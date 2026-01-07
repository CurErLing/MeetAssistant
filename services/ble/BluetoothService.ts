
import { BLE_UUIDS, DATA_TYPES, CMD, buildPacket, parsePacket, Packet } from './protocol';

// ... (Web Bluetooth Interfaces - omitted for brevity) ...
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
  
  private dataBuffer: Uint8Array = new Uint8Array(0);
  private statusBuffer: Uint8Array = new Uint8Array(0);

  private fileListBuffer: DeviceFileInfo[] = [];
  private currentDownloadFile: { name: string; data: Uint8Array[]; receivedSize: number; totalSize: number } | null = null;
  
  private listDataBuffer: Uint8Array = new Uint8Array(0);
  private isFetchingList = false;
  private listTransferTimer: any = null;
  private downloadWatchdog: any = null; // Timer to detect transfer stalls
  
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
      alert("您的浏览器不支持 Web Bluetooth，请使用 Chrome 或 Edge。");
      return;
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

      this.dataBuffer = new Uint8Array(0);
      this.statusBuffer = new Uint8Array(0);
      this.seq = 0;

      this.setState('connected');

    } catch (error: any) {
      if (error.name === 'NotFoundError') {
        console.log("User cancelled Bluetooth device selection");
      } else {
        console.error("Bluetooth connection failed", error);
        alert("连接设备失败: " + (error.message || "未知错误"));
      }
      this.setState('idle');
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

  // Generic command sender (auto-increments seq)
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

  // ACK sender (uses specific seq from received packet)
  private async sendConfirmation(packet: Packet) {
    if (!this.writeChar) return;
    if (packet.payload.length < 2) return;

    // Echo the Type and Cmd from the received packet
    const type = packet.payload[0];
    const cmd = packet.payload[1];
    
    // Construct ACK packet: Same Seq, Same Type/Cmd, Empty Data
    const ackData = buildPacket(packet.seq, type, cmd, null);
    
    try {
      // Use fire-and-forget to avoid blocking the read loop
      await this.writeChar.writeValueWithoutResponse(ackData);
    } catch (e) {
      console.warn("ACK write failed", e);
    }
  }

  public async getDeviceInfo() {
    try {
        await this.sendCommand(DATA_TYPES.CONTROL, CMD.GET_BATTERY);
        await new Promise(r => setTimeout(r, 400));
        await this.sendCommand(DATA_TYPES.CONTROL, CMD.GET_CAPACITY);
        await new Promise(r => setTimeout(r, 400));
        await this.sendCommand(DATA_TYPES.CONTROL, CMD.GET_VERSION);
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
    this.setState('syncing');
    
    // Start watchdog
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
    
    // Only active during download
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
    this.dataBuffer = this.appendBuffer(this.dataBuffer, newData);
    this.processBuffer(this.dataBuffer, (newBuff) => this.dataBuffer = newBuff);
  };

  private handleStatusNotification = (event: Event) => {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    const value = target.value;
    if (!value) return;

    const newData = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
    this.statusBuffer = this.appendBuffer(this.statusBuffer, newData);
    this.processBuffer(this.statusBuffer, (newBuff) => this.statusBuffer = newBuff);
  };

  private appendBuffer(buffer: Uint8Array, newData: Uint8Array): Uint8Array {
    const newBuffer = new Uint8Array(buffer.length + newData.length);
    newBuffer.set(buffer);
    newBuffer.set(newData, buffer.length);
    return newBuffer;
  }

  private processBuffer(buffer: Uint8Array, setBuffer: (b: Uint8Array) => void) {
    let currentBuffer = buffer;

    while (currentBuffer.length >= 6) {
      if (currentBuffer[0] !== 0x5A) {
        let start = 1;
        while (start < currentBuffer.length && currentBuffer[start] !== 0x5A) {
          start++;
        }
        currentBuffer = currentBuffer.slice(start);
        continue;
      }

      const view = new DataView(currentBuffer.buffer, currentBuffer.byteOffset, currentBuffer.byteLength);
      const dataLen = view.getUint16(4, true); 
      const totalPacketLen = 6 + dataLen;

      if (currentBuffer.length < totalPacketLen) {
        break; 
      }

      const packetBytes = currentBuffer.slice(0, totalPacketLen);
      const packet = parsePacket(new DataView(packetBytes.buffer));

      if (packet) {
        this.handlePacket(packet);
      }

      currentBuffer = currentBuffer.slice(totalPacketLen);
    }
    
    setBuffer(currentBuffer);
  }

  private handlePacket(packet: Packet) {
    if (packet.payload.length < 2) return;

    const type = packet.payload[0];
    const cmd = packet.payload[1];
    const data = packet.payload.subarray(2);

    // CRITICAL: Send ACK for File Transfer packets (Type 2)
    // The device expects a reply with the same Sequence Number for data packets.
    if (type === DATA_TYPES.FILE_TRANSFER) {
        this.sendConfirmation(packet);
    }

    if (type === DATA_TYPES.CONTROL) {
       this.handleControlCommand(cmd, data);
    } else if (type === DATA_TYPES.FILE_TRANSFER) {
       this.handleFileCommand(cmd, data);
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

  private handleFileCommand(cmd: number, data: Uint8Array) {
    if (cmd === CMD.START_IMPORT_FILE) {
        console.log("Device started sending file data.");
        this.resetDownloadWatchdog(); // Ensure watchdog is active when import starts
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
         this.finishDownload();
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
      this.resetDownloadWatchdog(); // Reset watchdog on each data chunk
      this.currentDownloadFile.data.push(data);
      this.currentDownloadFile.receivedSize += data.length;
      
      if (this.onFileChunkReceived) {
        const pct = Math.min(100, Math.round((this.currentDownloadFile.receivedSize / this.currentDownloadFile.totalSize) * 100));
        this.onFileChunkReceived(pct);
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

  private finishDownload() {
    if (this.downloadWatchdog) clearTimeout(this.downloadWatchdog);
    
    if (this.currentDownloadFile && this.onFileDownloadComplete) {
      const totalSize = this.currentDownloadFile.data.reduce((acc, chunk) => acc + chunk.length, 0);
      const combinedData = new Uint8Array(totalSize);
      let offset = 0;
      for (const chunk of this.currentDownloadFile.data) {
        combinedData.set(chunk, offset);
        offset += chunk.length;
      }

      let finalData = combinedData;
      let fileName = this.currentDownloadFile.name;
      
      if (!fileName.includes('.')) {
          fileName += '.wav'; 
      }
      
      const mimeType = this.getMimeType(fileName);

      if (mimeType === 'audio/wav') {
         const hasRIFF = finalData.length >= 4 && 
                         finalData[0] === 0x52 && 
                         finalData[1] === 0x49 && 
                         finalData[2] === 0x46 && 
                         finalData[3] === 0x46;   
         
         if (!hasRIFF) {
            console.warn("Detected raw PCM data without header, adding WAV header.");
            finalData = this.addWavHeader(combinedData, 16000, 1, 16);
         }
      }

      const blob = new Blob([finalData], { type: mimeType }); 
      const file = new File([blob], fileName, { type: mimeType });
      
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
