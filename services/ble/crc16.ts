
// Pre-computed CRC16-CCITT (Polynomial 0x1021) lookup table logic
// We initialize it lazily to avoid large static array definitions in code
let crcTable: Uint16Array | null = null;

const initCrcTable = () => {
  if (crcTable) return;
  crcTable = new Uint16Array(256);
  for (let i = 0; i < 256; i++) {
    let crc = i << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
    }
    crcTable[i] = crc & 0xFFFF;
  }
};

export const calculateCRC16 = (data: Uint8Array): number => {
  if (!crcTable) initCrcTable();
  
  let crc = 0x0000;
  const table = crcTable!; 
  const len = data.length;
  
  for (let i = 0; i < len; i++) {
    const index = ((crc >>> 8) ^ data[i]) & 0xFF;
    crc = ((crc << 8) ^ table[index]) & 0xFFFF;
  }
  
  return crc;
};
