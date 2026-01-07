
export const calculateCRC16 = (data: Uint8Array): number => {
  let crc = 0x0000;
  const polynomial = 0x1021;

  for (let i = 0; i < data.length; i++) {
    crc ^= (data[i] << 8);
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ polynomial;
      } else {
        crc = (crc << 1);
      }
    }
  }
  return crc & 0xFFFF;
};
