
import { convertToWav } from '../audioUtils';
import { BLE_UUIDS, CMD, DATA_TYPES, Packet, buildPacket, parsePacket } from './protocol';

// ... (Web Bluetooth Interfaces - keeping them for context/types) ...
interface BluetoothCharacteristicProperties {
  broadcast: boolean;
  read: boolean;
  writeWithoutResponse: boolean;
  write: boolean;
  notify: boolean;
  indicate: boolean;
  authenticatedSignedWrites: boolean;
  reliableWrite: boolean;
  writableAuxiliaries: boolean;
}

interface BluetoothRemoteGATTDescriptor {
  characteristic: BluetoothRemoteGATTCharacteristic;
  uuid: string;
  value?: DataView;
  readValue(): Promise<DataView>;
  writeValue(value: BufferSource): Promise<void>;
}

interface BluetoothRemoteGATTCharacteristic extends EventTarget {
  service: BluetoothRemoteGATTService;
  uuid: string;
  properties: BluetoothCharacteristicProperties;
  value?: DataView;
  getDescriptor(descriptor: BluetoothDescriptorUUID): Promise<BluetoothRemoteGATTDescriptor>;
  getDescriptors(descriptor?: BluetoothDescriptorUUID): Promise<BluetoothRemoteGATTDescriptor[]>;
  readValue(): Promise<DataView>;
  writeValue(value: BufferSource): Promise<void>;
  writeValueWithResponse(value: BufferSource): Promise<void>;
  writeValueWithoutResponse(value: BufferSource): Promise<void>;
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
}

interface BluetoothRemoteGATTService extends EventTarget {
  device: BluetoothDevice;
  uuid: string;
  isPrimary: boolean;
  getCharacteristic(characteristic: BluetoothCharacteristicUUID): Promise<BluetoothRemoteGATTCharacteristic>;
  getCharacteristics(characteristic?: BluetoothCharacteristicUUID): Promise<BluetoothRemoteGATTCharacteristic[]>;
  getIncludedService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>;
  getIncludedServices(service?: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService[]>;
}

interface BluetoothRemoteGATTServer {
  device: BluetoothDevice;
  connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>;
  getPrimaryServices(service?: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService[]>;
}

interface BluetoothDevice extends EventTarget {
  id: string;
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
  watchAdvertisements(): Promise<void>;
  unwatchAdvertisements(): void;
  readonly watchingAdvertisements: boolean;
}

interface BluetoothLEScanFilter {
  name?: string;
  namePrefix?: string;
  services?: BluetoothServiceUUID[];
  manufacturerData?: { companyIdentifier: number; dataPrefix?: BufferSource; mask?: BufferSource }[];
  serviceData?: { service: BluetoothServiceUUID; dataPrefix?: BufferSource; mask?: BufferSource }[];
}

interface RequestDeviceOptions {
  filters?: BluetoothLEScanFilter[];
  optionalServices?: BluetoothServiceUUID[];
  acceptAllDevices?: boolean;
}

interface Bluetooth extends EventTarget {
  getAvailability(): Promise<boolean>;
  requestDevice(options?: RequestDeviceOptions): Promise<BluetoothDevice>;
}

type BluetoothServiceUUID = number | string;
type BluetoothCharacteristicUUID = number | string;
type BluetoothDescriptorUUID = number | string;

declare global {
  interface Navigator {
    bluetooth: Bluetooth;
  }
}

export interface DeviceFileInfo {
  name: string;
  rawName: Uint8Array;
  size: number;
  time: number;
  duration?: number;
}

export interface DeviceStatus {
  battery: number;
  capacity: { used: number; total: number } | null;
  version: string;
}

type ConnectionState = 'idle' | 'searching' | 'connected' | 'syncing' | 'disconnected';

class BluetoothService {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private writeChar: BluetoothRemoteGATTCharacteristic | null = null;
  
  private seq = 0;
  private connectionState: ConnectionState = 'idle';
  private stateListeners: ((state: ConnectionState) => void)[] = [];
  
  // Processing Queue buffers
  private processingBuffer: Uint8Array = new Uint8Array(0);
  private statusBuffer: Uint8Array = new Uint8Array(0);
  private incomingQueue: Uint8Array[] = [];
  private isProcessingQueue = false;

  private fileListBuffer: DeviceFileInfo[] = [];
  private currentDownloadFile: { name: string; data: Uint8Array[]; receivedSize: number; totalSize: number } | null = null;
  
  private listDataBuffer: Uint8Array = new Uint8Array(0);
  private isFetchingList = false;
  private listTransferTimer: any = null;
  private downloadWatchdog: any = null; 
  
  // Throttle control for progress updates
  private lastProgressUpdate = 0;
  private lastProgressValue = 0;
  
  private onFileListReceived: ((files: DeviceFileInfo[]) => void) | null = null;
  private onFileChunkReceived: ((progress: number) => void) | null = null;
  private onFileDownloadComplete: ((file: File) => void) | null = null;
  private onFileDownloadError: ((error: string) => void) | null = null;
  private onStatusReceived: ((status: Partial<DeviceStatus>) => void) | null = null;

  constructor() {}

  public isSupported(): boolean {
    return !!navigator.bluetooth;
  }

  public get isConnected(): boolean {
    return this.connectionState === 'connected';
  }

  public subscribeToState(cb: (state: ConnectionState) => void) {
    this.stateListeners.push(cb);
    cb(this.connectionState);
    return () => {
      this.stateListeners = this.stateListeners.filter(l => l !== cb);
    };
  }

  private setState(state: ConnectionState) {
    this.connectionState = state;
    this.stateListeners.forEach(cb => cb(state));
  }

  public async connect() {
    if (!this.isSupported()) {
      throw new Error("您的浏览器不支持 Web Bluetooth，请使用 Chrome 或 Edge。");
    }

    this.setState('searching');

    try {
      this.device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [BLE_UUIDS.SERVICE] }],
      });

      this.device.addEventListener('gattserverdisconnected', this.handleDisconnect);

      this.server = await this.device.gatt!.connect();
      const service = await this.server.getPrimaryService(BLE_UUIDS.SERVICE);

      this.writeChar = await service.getCharacteristic(BLE_UUIDS.CHAR_WRITE);
      const notifyCharData = await service.getCharacteristic(BLE_UUIDS.CHAR_NOTIFY_DATA);
      const notifyCharStatus = await service.getCharacteristic(BLE_UUIDS.CHAR_NOTIFY_STATUS);

      await notifyCharData.startNotifications();
      notifyCharData.addEventListener('characteristicvaluechanged', this.handleDataNotification);

      await notifyCharStatus.startNotifications();
      notifyCharStatus.addEventListener('characteristicvaluechanged', this.handleStatusNotification);

      this.processingBuffer = new Uint8Array(0);
      this.statusBuffer = new Uint8Array(0);
      this.incomingQueue = [];
      this.isProcessingQueue = false;
      this.seq = 0;

      this.setState('connected');

    } catch (error: any) {
      this.setState('idle');
      if (error.name === 'NotFoundError') {
        console.log("User cancelled Bluetooth device selection");
        return; // Silent return for user cancel
      }
      throw error; // Re-throw for UI handling
    }
  }

  public disconnect() {
    if (this.downloadWatchdog) clearTimeout(this.downloadWatchdog);
    if (this.device && this.device.gatt?.connected) {
      this.device.gatt.disconnect();
    }
  }

  private handleDisconnect = () => {
    if (this.downloadWatchdog) clearTimeout(this.downloadWatchdog);
    this.device = null;
    this.server = null;
    this.writeChar = null;
    this.setState('disconnected');
  };

  private async sendCommand(dataType: number, cmd: number, data: Uint8Array | null = null) {
    if (!this.writeChar) return;
    
    const packet = buildPacket(this.seq, dataType, cmd, data);
    this.seq = (this.seq + 1) % 256;

    try {
      await this.writeChar.writeValueWithoutResponse(packet);
    } catch (e) {
      console.error("Write failed", e);
    }
  }

  private async sendConfirmation(packet: Packet) {
    if (!this.writeChar) return;
    if (packet.payload.length < 2) return;

    const type = packet.payload[0];
    const cmd = packet.payload[1];
    
    const ackData = buildPacket(packet.seq, type, cmd, null);
    
    try {
      await this.writeChar.writeValueWithoutResponse(ackData);
    } catch (e) {
      console.warn("ACK write failed", e);
    }
  }

  public async getDeviceInfo() {
    try {
        await this.sendCommand(DATA_TYPES.CONTROL, CMD.GET_BATTERY);
        await new Promise(r => setTimeout(r, 150));
        await this.sendCommand(DATA_TYPES.CONTROL, CMD.GET_CAPACITY);
        await new Promise(r => setTimeout(r, 150));
        await this.sendCommand(DATA_TYPES.CONTROL, CMD.GET_VERSION);
        
        // Upgrade: Attempt to enable high speed mode (Bluetooth 5.3 optimization)
        await new Promise(r => setTimeout(r, 150));
        const highSpeedPayload = new Uint8Array([0x01]); // Enable flag
        await this.sendCommand(DATA_TYPES.CONTROL, CMD.ENABLE_HIGH_SPEED, highSpeedPayload);
        console.log("Sent negotiation for High Speed Mode (5.3)");
        
    } catch (e) {
        console.error("Error getting device info", e);
    }
  }

  public async fetchFileList(callback: (files: DeviceFileInfo[]) => void) {
    this.onFileListReceived = callback;
    this.fileListBuffer = [];
    
    this.listDataBuffer = new Uint8Array(0);
    this.isFetchingList = true; 
    if (this.listTransferTimer) clearTimeout(this.listTransferTimer);
    
    await this.sendCommand(DATA_TYPES.FILE_TRANSFER, CMD.GET_FILE_LIST);
  }

  public async downloadFile(
    fileName: string, 
    rawName: Uint8Array,
    fileSize: number,
    onProgress: (pct: number) => void, 
    onComplete: (file: File) => void,
    onError: (error: string) => void
  ) {
    this.isFetchingList = false;
    if (this.listTransferTimer) clearTimeout(this.listTransferTimer);

    this.currentDownloadFile = {
      name: fileName,
      data: [],
      receivedSize: 0,
      totalSize: fileSize
    };
    this.onFileChunkReceived = onProgress;
    this.onFileDownloadComplete = onComplete;
    this.onFileDownloadError = onError;
    this.lastProgressUpdate = 0;
    this.lastProgressValue = 0;
    
    this.setState('syncing');
    
    this.resetDownloadWatchdog();

    const buffer = new ArrayBuffer(24);
    const view = new DataView(buffer);
    const uint8 = new Uint8Array(buffer);
    
    view.setUint32(0, 0, false); 
    
    if (rawName && rawName.length > 0) {
       const len = Math.min(rawName.length, 20);
       uint8.set(rawName.slice(0, len), 4);
    } else {
       try {
         const encoder = new TextEncoder();
         const nameBytes = encoder.encode(fileName);
         uint8.set(nameBytes.slice(0, 20), 4);
       } catch (e) {
       }
    }

    await this.sendCommand(DATA_TYPES.FILE_TRANSFER, CMD.REQ_IMPORT_FILE, uint8);
  }

  private resetDownloadWatchdog() {
    if (this.downloadWatchdog) clearTimeout(this.downloadWatchdog);
    
    if (this.currentDownloadFile) {
        this.downloadWatchdog = setTimeout(() => {
            console.warn("Transfer timed out - 8s without data");
            if (this.onFileDownloadError) {
                this.onFileDownloadError("设备传输超时");
            }
            this.currentDownloadFile = null;
            this.setState('connected');
        }, 8000); 
    }
  }

  private handleDataNotification = (event: Event) => {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    const value = target.value;
    if (!value) return;

    const newData = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
    
    // Push to queue and trigger processor
    this.incomingQueue.push(newData);
    if (!this.isProcessingQueue) {
        this.processQueue();
    }
  };

  private async processQueue() {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    // Optimization: Batch process all queued chunks to prevent frequent small allocations
    // This is crucial for high throughput (2Mbps+) where JS event loop lag can cause queue buildup
    if (this.incomingQueue.length > 0) {
        let totalNewSize = 0;
        for (const chunk of this.incomingQueue) {
            totalNewSize += chunk.length;
        }

        // Single allocation for all pending data
        const newBuffer = new Uint8Array(this.processingBuffer.length + totalNewSize);
        newBuffer.set(this.processingBuffer);
        
        let offset = this.processingBuffer.length;
        for (const chunk of this.incomingQueue) {
            newBuffer.set(chunk, offset);
            offset += chunk.length;
        }
        
        this.processingBuffer = newBuffer;
        this.incomingQueue = []; // Clear queue in one go
        
        await this.processBufferLoop();
    }

    this.isProcessingQueue = false;
    
    // Re-check in case new data arrived while processing
    if (this.incomingQueue.length > 0) {
        setTimeout(() => this.processQueue(), 0);
    }
  }

  private handleStatusNotification = async (event: Event) => {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    const value = target.value;
    if (!value) return;

    const newData = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
    this.statusBuffer = this.appendBuffer(this.statusBuffer, newData);
    await this.processStatusBuffer();
  };

  private appendBuffer(buffer: Uint8Array, newData: Uint8Array): Uint8Array {
    const newBuffer = new Uint8Array(buffer.length + newData.length);
    newBuffer.set(buffer);
    newBuffer.set(newData, buffer.length);
    return newBuffer;
  }

  // Optimized loop with offset instead of slicing
  private async processBufferLoop() {
    const buffer = this.processingBuffer;
    let offset = 0;
    const len = buffer.length;
    
    // Header size is 6 bytes
    while (len - offset >= 6) {
      // 1. Sync Byte Check
      if (buffer[offset] !== 0x5A) {
        // Search for next 0x5A to recover sync
        let found = false;
        for (let i = offset + 1; i < len; i++) {
            if (buffer[i] === 0x5A) {
                offset = i;
                found = true;
                break;
            }
        }
        if (!found) {
            // No more sync bytes, discard all up to end
            offset = len; 
            break;
        }
        continue;
      }

      // 2. Length Check
      // Length is at offset + 4 (2 bytes, little endian)
      if (len - offset < 6) break;

      const dataLen = buffer[offset + 4] | (buffer[offset + 5] << 8);
      const totalPacketLen = 6 + dataLen;

      if (len - offset < totalPacketLen) {
        // Not enough data yet
        break;
      }

      // 3. Parse Packet
      const packetView = new DataView(buffer.buffer, buffer.byteOffset + offset, totalPacketLen);
      const packet = parsePacket(packetView);

      if (packet) {
        // CRITICAL: Copy payload to detach from the large processing buffer
        // This prevents the small packet view from keeping the large accumulated buffer in memory
        packet.payload = new Uint8Array(packet.payload);
        
        await this.handlePacket(packet);
      } else {
        // Invalid CRC, skip one byte to try re-syncing
        console.warn("Invalid CRC packet skipped");
        offset++;
        continue;
      }

      offset += totalPacketLen;
    }
    
    // Consolidate remainder
    if (offset > 0) {
      if (offset === len) {
        this.processingBuffer = new Uint8Array(0);
      } else {
        // Slice creates a copy, allowing old large buffer to be GC'ed
        this.processingBuffer = buffer.slice(offset);
      }
    }
  }

  // Optimized loop for status buffer
  private async processStatusBuffer() {
    const buffer = this.statusBuffer;
    let offset = 0;
    const len = buffer.length;

    while (len - offset >= 6) {
        if (buffer[offset] !== 0x5A) {
            let found = false;
            for (let i = offset + 1; i < len; i++) {
                if (buffer[i] === 0x5A) {
                    offset = i;
                    found = true;
                    break;
                }
            }
            if (!found) {
                offset = len;
                break;
            }
            continue;
        }

        if (len - offset < 6) break;
        const dataLen = buffer[offset + 4] | (buffer[offset + 5] << 8);
        const totalPacketLen = 6 + dataLen;

        if (len - offset < totalPacketLen) break;

        const packetView = new DataView(buffer.buffer, buffer.byteOffset + offset, totalPacketLen);
        const packet = parsePacket(packetView);
        
        if (packet) {
            packet.payload = new Uint8Array(packet.payload);
            await this.handlePacket(packet);
        } else {
            offset++;
            continue;
        }
        offset += totalPacketLen;
    }

    if (offset > 0) {
        if (offset === len) {
            this.statusBuffer = new Uint8Array(0);
        } else {
            this.statusBuffer = buffer.slice(offset);
        }
    }
  }

  private async handlePacket(packet: Packet) {
    if (packet.payload.length < 2) return;

    const type = packet.payload[0];
    const cmd = packet.payload[1];
    const data = packet.payload.subarray(2);

    if (type === DATA_TYPES.CONTROL) {
       this.handleControlCommand(cmd, data);
    } else if (type === DATA_TYPES.FILE_TRANSFER) {
       await this.handleFileCommand(cmd, data);
    }
  }

  private handleControlCommand(cmd: number, data: Uint8Array) {
    if (cmd === CMD.RET_BATTERY) {
       const level = data[0];
       if (this.onStatusReceived) this.onStatusReceived({ battery: level });
    } else if (cmd === CMD.RET_CAPACITY) {
       if (data.length >= 8) {
         const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
         const remaining = view.getUint32(0, false); 
         const total = view.getUint32(4, false);     
         
         if (this.onStatusReceived) {
           this.onStatusReceived({ 
             capacity: { 
               used: Math.max(0, total - remaining) * 1024 * 1024, 
               total: total * 1024 * 1024
             } 
           });
         }
       }
    } else if (cmd === CMD.RET_VERSION) {
       const decoder = new TextDecoder();
       const rawVersion = decoder.decode(data);
       const version = rawVersion.replace(/\0/g, '');
       if (this.onStatusReceived) this.onStatusReceived({ version });
    }
  }

  private async handleFileCommand(cmd: number, data: Uint8Array) {
    if (cmd === CMD.START_IMPORT_FILE) {
        console.log("Device started sending file data.");
        this.resetDownloadWatchdog(); 
    } else if (cmd === CMD.RET_FILE_LIST) {
      if (data.length >= 4) {
         this.processListStream(data.slice(4));
      }
    } else if (cmd === CMD.FILE_DATA) {
      if (this.currentDownloadFile) {
         this.handleFileData(data);
      } else if (this.isFetchingList) {
         this.processListStream(data);
      }
    } else if (cmd === CMD.IMPORT_COMPLETE) {
      const status = data.length > 0 ? data[0] : 0;
      if (status === 0) {
         await this.finishDownload();
      } else {
         console.warn("Hardware import failed with status:", status);
         if (this.onFileDownloadError) {
             this.onFileDownloadError(`设备返回错误 (代码 ${status})`);
         }
         this.currentDownloadFile = null;
         this.setState('connected');
      }
    } else if (cmd === CMD.LIST_TRANSFER_COMPLETE) {
       this.finalizeListTransfer();
    }
  }

  private finalizeListTransfer() {
    this.isFetchingList = false;
    if (this.listTransferTimer) clearTimeout(this.listTransferTimer);
    if (this.onFileListReceived) {
        console.log("File list transfer complete. Total files:", this.fileListBuffer.length);
        this.onFileListReceived([...this.fileListBuffer]);
    }
  }

  private processListStream(data: Uint8Array) {
    this.listDataBuffer = this.appendBuffer(this.listDataBuffer, data);
    
    if (this.listTransferTimer) clearTimeout(this.listTransferTimer);
    this.listTransferTimer = setTimeout(() => {
        this.finalizeListTransfer();
    }, 1500);

    const ENTRY_SIZE = 28;
    let foundNewFiles = false;
    
    while (this.listDataBuffer.length >= ENTRY_SIZE) {
       const entry = this.listDataBuffer.slice(0, ENTRY_SIZE);
       const view = new DataView(entry.buffer, entry.byteOffset, entry.byteLength);
       
       let protocolTime = view.getUint32(0, false); 
       const size = view.getUint32(4, false); 
       const nameBytes = entry.subarray(8, 28);
       
       const rawName = new Uint8Array(nameBytes);

       let nameEnd = 0;
       while (nameEnd < 20 && nameBytes[nameEnd] !== 0) nameEnd++;
       
       let name = "Unknown";
       try {
         const decoder = new TextDecoder('gbk');
         name = decoder.decode(nameBytes.subarray(0, nameEnd));
       } catch (e) {
         try {
            const decoder = new TextDecoder('utf-8');
            name = decoder.decode(nameBytes.subarray(0, nameEnd));
         } catch(e2) {
            name = "File_" + Math.floor(Math.random() * 1000);
         }
       }

       let parsedTime = 0;
       const dateMatch = name.match(/(\d{4})(\d{2})(\d{2})[-_]?(\d{2})(\d{2})(\d{2})/);
       
       if (dateMatch) {
          const year = parseInt(dateMatch[1]);
          const month = parseInt(dateMatch[2]) - 1;
          const day = parseInt(dateMatch[3]);
          const hour = parseInt(dateMatch[4]);
          const minute = parseInt(dateMatch[5]);
          const second = parseInt(dateMatch[6]);
          const date = new Date(year, month, day, hour, minute, second);
          parsedTime = Math.floor(date.getTime() / 1000);
       } else {
          if (protocolTime > 946684800) { 
             parsedTime = protocolTime;
          } else {
             parsedTime = Math.floor(Date.now() / 1000); 
          }
       }

       let duration = 0;
       if (protocolTime < 604800) {
          duration = protocolTime;
       }

       if (size > 0 && name.length > 0) {
          if (!this.fileListBuffer.some(f => f.name === name && f.size === size)) {
              this.fileListBuffer.push({ name, rawName, size, time: parsedTime, duration });
              foundNewFiles = true;
          }
       }
       
       this.listDataBuffer = this.listDataBuffer.slice(ENTRY_SIZE);
    }

    if (foundNewFiles && this.onFileListReceived) {
        this.onFileListReceived([...this.fileListBuffer]);
    }
  }

  private handleFileData(data: Uint8Array) {
    if (this.currentDownloadFile) {
      this.resetDownloadWatchdog(); 
      this.currentDownloadFile.data.push(data);
      this.currentDownloadFile.receivedSize += data.length;
      
      if (this.onFileChunkReceived) {
        // UI Optimization: Throttle progress updates to avoid blocking the main thread
        // Only update if 1% changed OR 200ms passed
        const now = Date.now();
        const pct = Math.min(100, Math.round((this.currentDownloadFile.receivedSize / this.currentDownloadFile.totalSize) * 100));
        
        if (pct !== this.lastProgressValue && (now - this.lastProgressUpdate > 200 || pct === 100 || pct === 0)) {
            this.onFileChunkReceived(pct);
            this.lastProgressUpdate = now;
            this.lastProgressValue = pct;
        }
      }
    }
  }

  private getMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch(ext) {
        case 'mp3': return 'audio/mpeg';
        case 'wav': return 'audio/wav';
        case 'm4a': return 'audio/mp4';
        case 'aac': return 'audio/aac';
        case 'ogg': return 'audio/ogg';
        case 'opus': return 'audio/ogg'; 
        case 'webm': return 'audio/webm';
        default: return 'audio/wav'; 
    }
  }

  private async finishDownload() {
    if (this.downloadWatchdog) clearTimeout(this.downloadWatchdog);
    
    if (this.currentDownloadFile && this.onFileDownloadComplete) {
      let fileName = this.currentDownloadFile.name;
      
      if (!fileName.includes('.')) {
          fileName += '.wav'; 
      }
      
      const mimeType = this.getMimeType(fileName);
      let file: File;

      if (mimeType === 'audio/wav') {
         const totalSize = this.currentDownloadFile.data.reduce((acc, chunk) => acc + chunk.length, 0);
         let finalData = new Uint8Array(totalSize);
         let offset = 0;
         for (const chunk of this.currentDownloadFile.data) {
           finalData.set(chunk, offset);
           offset += chunk.length;
         }

         const hasRIFF = finalData.length >= 4 && 
                         finalData[0] === 0x52 && 
                         finalData[1] === 0x49 && 
                         finalData[2] === 0x46 && 
                         finalData[3] === 0x46;   
         
         if (!hasRIFF) {
            console.warn("Detected raw PCM data without header, adding WAV header.");
            const wavData = this.addWavHeader(finalData, 16000, 1, 16);
            finalData = new Uint8Array(wavData.buffer as ArrayBuffer);
         }
         const blob = new Blob([finalData], { type: mimeType }); 
         file = new File([blob], fileName, { type: mimeType });
      } else if (mimeType === 'audio/ogg' || mimeType === 'audio/webm' || fileName.endsWith('.opus') || fileName.endsWith('.webm')) {
         console.log(`Converting Opus/WebM chunks (${this.currentDownloadFile.data.length}) to WAV...`);
         file = await convertToWav(this.currentDownloadFile.data);
         const newName = fileName.replace(/\.[^/.]+$/, "") + ".wav";
         file = new File([file], newName, { type: 'audio/wav' });
      } else {
         const totalSize = this.currentDownloadFile.data.reduce((acc, chunk) => acc + chunk.length, 0);
         const combinedData = new Uint8Array(totalSize);
         let offset = 0;
         for (const chunk of this.currentDownloadFile.data) {
           combinedData.set(chunk, offset);
           offset += chunk.length;
         }
         const blob = new Blob([combinedData], { type: mimeType }); 
         file = new File([blob], fileName, { type: mimeType });
      }
      
      this.onFileDownloadComplete(file);
      this.currentDownloadFile = null;
      this.setState('connected');
    }
  }

  private addWavHeader(samples: Uint8Array, sampleRate: number, numChannels: number, bitDepth: number): Uint8Array {
      const buffer = new ArrayBuffer(44 + samples.length);
      const view = new DataView(buffer);

      const writeString = (view: DataView, offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };

      writeString(view, 0, 'RIFF');
      view.setUint32(4, 36 + samples.length, true);
      writeString(view, 8, 'WAVE');
      writeString(view, 12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true); 
      view.setUint16(22, numChannels, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
      view.setUint16(32, numChannels * (bitDepth / 8), true);
      view.setUint16(34, bitDepth, true);
      writeString(view, 36, 'data');
      view.setUint32(40, samples.length, true);

      const u8 = new Uint8Array(buffer);
      u8.set(samples, 44);
      return u8;
  }

  public setStatusCallback(cb: (status: Partial<DeviceStatus>) => void) {
    this.onStatusReceived = cb;
  }
}

export const bluetoothService = new BluetoothService();
