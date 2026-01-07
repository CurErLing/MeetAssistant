
/**
 * 将 File 对象转换为 Base64 字符串
 * 用于 Google Gemini API 的 inlineData 传输
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file); // 开始读取文件
    reader.onload = () => {
      // reader.result 包含了 data:audio/mp3;base64,... 前缀，我们需要去掉它
      let encoded = reader.result?.toString().replace(/^data:(.*,)?/, '') || '';
      // 补全 Base64 字符串长度，使其符合规范（长度必须是 4 的倍数）
      if ((encoded.length % 4) > 0) {
        encoded += '='.repeat(4 - (encoded.length % 4));
      }
      resolve(encoded); // 读取成功，返回结果
    };
    reader.onerror = (error) => reject(error); // 读取失败
  });
};
