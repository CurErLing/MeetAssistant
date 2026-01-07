
import { BLE_UUIDS, DATA_TYPES, CMD, buildPacket, parsePacket, Packet } from './protocol';

// --- Web Bluetooth Types Polyfill ---
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
// ------------------------------------

export interface DeviceFileInfo {
  name: string;
  size: number;
  time: number; // Unix timestamp in seconds
  duration?: number; // Duration in seconds (parsed from protocol 'time' field if applicable)
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
  
  // Independent buffers for packet assembly (Protocol Level)
  private dataBuffer: Uint8Array = new Uint8Array(0);
  private statusBuffer: Uint8Array = new Uint8Array(0);

  // Application State
  private fileListBuffer: DeviceFileInfo[] = [];
  private currentDownloadFile: { name: string; data: Uint8Array[]; receivedSize: number; totalSize: number } | null = null;
  
  // File List Stream Buffering (Application Level)
  private listDataBuffer: Uint8Array = new Uint8Array(0);
  private hasParsedListCount = false;
  private isFetchingList = false; // Flag to track if we are in list fetching mode
  private listTransferTimer: any = null; // Safety timer for list completion
  
  // Callbacks
  private onFileListReceived: ((files: DeviceFileInfo[]) => void) | null = null;
  private onFileChunkReceived: ((progress: number) => void) | null = null;
  private onFileDownloadComplete: ((file: File) => void) | null = null;
  private onStatusReceived: ((status: Partial<DeviceStatus>) => void) | null = null;

  constructor() {}

  public isSupported(): boolean {
    return !!navigator.bluetooth;
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

      // Get Characteristics
      this.writeChar = await service.getCharacteristic(BLE_UUIDS.CHAR_WRITE);
      const notifyCharData = await service.getCharacteristic(BLE_UUIDS.CHAR_NOTIFY_DATA);
      const notifyCharStatus = await service.getCharacteristic(BLE_UUIDS.CHAR_NOTIFY_STATUS);

      // Start Notifications
      await notifyCharData.startNotifications();
      notifyCharData.addEventListener('characteristicvaluechanged', this.handleDataNotification);

      await notifyCharStatus.startNotifications();
      notifyCharStatus.addEventListener('characteristicvaluechanged', this.handleStatusNotification);

      // Reset State
      this.dataBuffer = new Uint8Array(0);
      this.statusBuffer = new Uint8Array(0);
      this.seq = 0;

      this.setState('connected');
      
      // Initialize Device info (Battery & Capacity)
      setTimeout(() => this.getDeviceInfo(), 800);

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
    if (this.device && this.device.gatt?.connected) {
      this.device.gatt.disconnect();
    }
  }

  private handleDisconnect = () => {
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

  // --- Logic Commands ---

  public async getDeviceInfo() {
    // Send Battery request
    await this.sendCommand(DATA_TYPES.CONTROL, CMD.GET_BATTERY);
    // Wait longer between commands to prevent packet loss
    await new Promise(r => setTimeout(r, 500));
    // Send Capacity request
    await this.sendCommand(DATA_TYPES.CONTROL, CMD.GET_CAPACITY);
  }

  public async fetchFileList(callback: (files: DeviceFileInfo[]) => void) {
    this.onFileListReceived = callback;
    this.fileListBuffer = [];
    
    // Reset list stream buffer
    this.listDataBuffer = new Uint8Array(0);
    this.hasParsedListCount = false;
    this.isFetchingList = true; // Start list fetching mode
    if (this.listTransferTimer) clearTimeout(this.listTransferTimer);
    
    await this.sendCommand(DATA_TYPES.FILE_TRANSFER, CMD.GET_FILE_LIST);
  }

  public async downloadFile(
    fileName: string, 
    fileSize: number,
    onProgress: (pct: number) => void, 
    onComplete: (file: File) => void
  ) {
    this.currentDownloadFile = {
      name: fileName,
      data: [],
      receivedSize: 0,
      totalSize: fileSize
    };
    this.onFileChunkReceived = onProgress;
    this.onFileDownloadComplete = onComplete;
    this.setState('syncing');

    // Protocol: Type 2, Cmd 2 (Req Import)
    // Data: Offset(4B) + Name(20B)
    const buffer = new ArrayBuffer(24);
    const view = new DataView(buffer);
    const uint8 = new Uint8Array(buffer);
    
    // Offset - Big Endian (Protocol Specification)
    view.setUint32(0, 0, false); 
    
    // Encode filename
    let nameBytes: Uint8Array;
    try {
      const encoder = new TextEncoder(); // UTF-8
      nameBytes = encoder.encode(fileName);
    } catch (e) {
      nameBytes = new Uint8Array(0); 
    }
    
    // Ensure filename fits in 20 bytes
    uint8.set(nameBytes.slice(0, 20), 4);

    await this.sendCommand(DATA_TYPES.FILE_TRANSFER, CMD.REQ_IMPORT_FILE, uint8);
  }

  // --- Notification Handlers ---

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

    // Header size = 6 (Magic 1 + Seq 1 + CRC 2 + Len 2)
    while (currentBuffer.length >= 6) {
      // 1. Sync Magic Byte (0x5A)
      if (currentBuffer[0] !== 0x5A) {
        // Shift buffer until 0x5A found
        let start = 1;
        while (start < currentBuffer.length && currentBuffer[start] !== 0x5A) {
          start++;
        }
        currentBuffer = currentBuffer.slice(start);
        continue;
      }

      // 2. Read Length (bytes 4, 5 Little Endian) -> Packet length is LE
      const view = new DataView(currentBuffer.buffer, currentBuffer.byteOffset, currentBuffer.byteLength);
      const dataLen = view.getUint16(4, true); 
      const totalPacketLen = 6 + dataLen;

      // 3. Wait for full packet
      if (currentBuffer.length < totalPacketLen) {
        break; 
      }

      // 4. Extract and process
      const packetBytes = currentBuffer.slice(0, totalPacketLen);
      const packet = parsePacket(new DataView(packetBytes.buffer));

      if (packet) {
        if (!packet.isValid) {
             console.warn("Packet CRC mismatch, but processing to ensure compatibility.", packet);
        }
        this.handlePacket(packet);
      }

      // 5. Advance buffer
      currentBuffer = currentBuffer.slice(totalPacketLen);
    }
    
    setBuffer(currentBuffer);
  }

  private handlePacket(packet: Packet) {
    if (packet.payload.length < 2) return;

    const type = packet.payload[0];
    const cmd = packet.payload[1];
    const data = packet.payload.subarray(2);

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
       // 8 Bytes: Total(4) + Remaining(4) OR Remaining(4) + Total(4)
       if (data.length >= 8) {
         const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
         // Doc: Capacity data is Big Endian
         const total = view.getUint32(0, false);     
         const remaining = view.getUint32(4, false); 
         
         if (this.onStatusReceived) {
           this.onStatusReceived({ 
             capacity: { 
               used: Math.max(0, total - remaining), 
               total: total 
             } 
           });
         }
       }
    } else if (cmd === CMD.RET_VERSION) {
       const decoder = new TextDecoder();
       const version = decoder.decode(data);
       if (this.onStatusReceived) this.onStatusReceived({ version });
    }
  }

  private handleFileCommand(cmd: number, data: Uint8Array) {
    if (cmd === CMD.RET_FILE_LIST) {
      this.processListStream(data);
    } else if (cmd === CMD.FILE_DATA) {
      // Important: If we are in "Fetching List" mode, treat FILE_DATA as part of the list stream
      // This handles cases where devices switch to a data streaming command for the list content
      if (this.isFetchingList && !this.currentDownloadFile) {
         this.processListStream(data);
      } else {
         this.handleFileData(data);
      }
    } else if (cmd === CMD.IMPORT_COMPLETE) {
      this.finishDownload();
    } else if (cmd === CMD.LIST_TRANSFER_COMPLETE) {
       this.finalizeListTransfer();
    }
  }

  private finalizeListTransfer() {
    this.isFetchingList = false; // Turn off list fetching mode
    if (this.listTransferTimer) clearTimeout(this.listTransferTimer);
    if (this.onFileListReceived) {
        console.log("File list transfer complete. Total files:", this.fileListBuffer.length);
        this.onFileListReceived(this.fileListBuffer);
        this.onFileListReceived = null;
    }
  }

  private processListStream(data: Uint8Array) {
    // Append incoming data chunk to the list buffer
    this.listDataBuffer = this.appendBuffer(this.listDataBuffer, data);
    
    // Safety Timeout - Refresh on every data chunk
    if (this.listTransferTimer) clearTimeout(this.listTransferTimer);
    this.listTransferTimer = setTimeout(() => {
        this.finalizeListTransfer();
    }, 1500);

    // 1. Header: 4 Bytes File Count (Big Endian)
    if (!this.hasParsedListCount) {
       if (this.listDataBuffer.length < 4) return;
       
       const view = new DataView(this.listDataBuffer.buffer, this.listDataBuffer.byteOffset, this.listDataBuffer.byteLength);
       const fileCount = view.getUint32(0, false); // Big Endian
       console.log(`Expecting ${fileCount} files`);

       this.listDataBuffer = this.listDataBuffer.slice(4);
       this.hasParsedListCount = true;
    }

    // 2. Parse File Infos (28 bytes each)
    // Structure: 4B Time (BE) + 4B Size (BE) + 20B Name
    const ENTRY_SIZE = 28;
    
    while (this.listDataBuffer.length >= ENTRY_SIZE) {
       // Extract current entry
       const entry = this.listDataBuffer.slice(0, ENTRY_SIZE);
       const view = new DataView(entry.buffer, entry.byteOffset, entry.byteLength);
       
       // Doc: Time(4), Size(4) are Big Endian
       let protocolTime = view.getUint32(0, false); 
       const size = view.getUint32(4, false); 
       const nameBytes = entry.subarray(8, 28);
       
       // Decode name
       let nameEnd = 0;
       while (nameEnd < 20 && nameBytes[nameEnd] !== 0) nameEnd++;
       
       let name = "Unknown";
       try {
         // Priority: GBK (Common in legacy devices) -> UTF-8
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

       // Smart Date Parsing from Filename (Priority 1)
       // e.g., "20260105-115410.opus"
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
          // Fallback: If protocolTime looks like a real timestamp (> year 2000), use it.
          // Otherwise default to now.
          if (protocolTime > 946684800) { // > 2000-01-01
             parsedTime = protocolTime;
          } else {
             parsedTime = Math.floor(Date.now() / 1000); 
          }
       }

       // Determine Duration from protocol time field
       // If protocolTime is small (e.g. < 1 week), it's likely Duration in seconds.
       let duration = 0;
       if (protocolTime < 604800) {
          duration = protocolTime;
       }

       if (size > 0 && name.length > 0) {
          // Dedup check
          if (!this.fileListBuffer.some(f => f.name === name && f.size === size)) {
              this.fileListBuffer.push({ name, size, time: parsedTime, duration });
          }
       }
       
       // Move buffer forward
       this.listDataBuffer = this.listDataBuffer.slice(ENTRY_SIZE);
    }
  }

  private handleFileData(data: Uint8Array) {
    if (this.currentDownloadFile) {
      this.currentDownloadFile.data.push(data);
      this.currentDownloadFile.receivedSize += data.length;
      
      if (this.onFileChunkReceived) {
        const pct = Math.min(100, Math.round((this.currentDownloadFile.receivedSize / this.currentDownloadFile.totalSize) * 100));
        this.onFileChunkReceived(pct);
      }
    }
  }

  private finishDownload() {
    if (this.currentDownloadFile && this.onFileDownloadComplete) {
      const blob = new Blob(this.currentDownloadFile.data, { type: 'audio/wav' }); 
      const file = new File([blob], this.currentDownloadFile.name, { type: 'audio/wav' });
      
      this.onFileDownloadComplete(file);
      this.currentDownloadFile = null;
      this.setState('connected');
    }
  }

  public setStatusCallback(cb: (status: Partial<DeviceStatus>) => void) {
    this.onStatusReceived = cb;
  }
}

export const bluetoothService = new BluetoothService();
