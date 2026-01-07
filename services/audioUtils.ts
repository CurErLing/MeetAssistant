
// Utility to slice (trim) an audio file in the browser without external libraries.
// It decodes the audio, copies the selected segment, and re-encodes it as WAV.

const getAudioContext = () => {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  return new AudioContextClass();
};

/**
 * 保留选中区域 (裁剪掉首尾)
 */
export const sliceAudio = async (file: File, start: number, end: number): Promise<File> => {
  const audioCtx = getAudioContext();

  try {
    const arrayBuffer = await file.arrayBuffer();
    const sourceBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    const sampleRate = sourceBuffer.sampleRate;
    const startFrame = Math.max(0, Math.floor(start * sampleRate));
    const endFrame = (end > 0 && end < sourceBuffer.duration) 
      ? Math.floor(end * sampleRate) 
      : sourceBuffer.length;
    
    const frameCount = endFrame - startFrame;

    if (startFrame === 0 && endFrame === sourceBuffer.length) {
      return file;
    }
    
    if (frameCount <= 0) {
      throw new Error("Invalid slice duration");
    }

    const destBuffer = audioCtx.createBuffer(
      sourceBuffer.numberOfChannels,
      frameCount,
      sampleRate
    );

    for (let i = 0; i < sourceBuffer.numberOfChannels; i++) {
      const channelData = sourceBuffer.getChannelData(i);
      const slicedData = channelData.subarray(startFrame, endFrame);
      destBuffer.copyToChannel(slicedData, i);
    }

    const wavBlob = bufferToWav(destBuffer);
    const newName = file.name.replace(/\.[^/.]+$/, "") + "_trimmed.wav";
    return new File([wavBlob], newName, { type: 'audio/wav' });

  } catch (error) {
    console.error("Audio slicing failed:", error);
    return file;
  } finally {
    await audioCtx.close();
  }
};

/**
 * 删除选中区域 (删除中间，拼接首尾)
 */
export const deleteAudioRange = async (file: File, start: number, end: number): Promise<File> => {
  const audioCtx = getAudioContext();

  try {
    const arrayBuffer = await file.arrayBuffer();
    const sourceBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    const sampleRate = sourceBuffer.sampleRate;
    const startFrame = Math.max(0, Math.floor(start * sampleRate));
    const endFrame = (end > 0 && end < sourceBuffer.duration) 
      ? Math.floor(end * sampleRate) 
      : sourceBuffer.length;

    // 如果选区无效或覆盖全长，处理为特殊情况
    if (startFrame >= endFrame) return file;
    if (startFrame === 0 && endFrame === sourceBuffer.length) {
       // 删除全部？返回空文件可能会导致问题，这里返回极短静音或报错，暂且返回原文件避免崩溃
       throw new Error("Cannot delete entire file");
    }

    const removeCount = endFrame - startFrame;
    const newLength = sourceBuffer.length - removeCount;

    const destBuffer = audioCtx.createBuffer(
      sourceBuffer.numberOfChannels,
      newLength,
      sampleRate
    );

    for (let i = 0; i < sourceBuffer.numberOfChannels; i++) {
      const channelData = sourceBuffer.getChannelData(i);
      const preSegment = channelData.subarray(0, startFrame);
      const postSegment = channelData.subarray(endFrame);
      
      destBuffer.copyToChannel(preSegment, i, 0);
      destBuffer.copyToChannel(postSegment, i, startFrame);
    }

    const wavBlob = bufferToWav(destBuffer);
    const newName = file.name.replace(/\.[^/.]+$/, "") + "_cut.wav";
    return new File([wavBlob], newName, { type: 'audio/wav' });

  } catch (error) {
    console.error("Audio deletion failed:", error);
    return file;
  } finally {
    await audioCtx.close();
  }
};

/**
 * 获取音频文件的时长 (秒)
 */
export const getAudioDuration = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    
    audio.preload = 'metadata';
    
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      const duration = audio.duration;
      if (isFinite(duration) && duration >= 0) {
        resolve(duration);
      } else {
        resolve(0);
      }
    };

    audio.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
  });
};

// Helper: Simple WAV encoder
function bufferToWav(abuffer: AudioBuffer) {
  const numOfChan = abuffer.numberOfChannels;
  const length = abuffer.length * numOfChan * 2 + 44;
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);
  let channels = [];
  let i;
  let sample;
  let offset = 0;
  let pos = 0;

  // write WAVE header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(abuffer.sampleRate);
  setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit (hardcoded in this example)

  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  // write interleaved data
  for (i = 0; i < abuffer.numberOfChannels; i++)
    channels.push(abuffer.getChannelData(i));

  while (pos < abuffer.length) {
    for (i = 0; i < numOfChan; i++) { // interleave channels
      sample = Math.max(-1, Math.min(1, channels[i][pos])); // clamp
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
      view.setInt16(44 + offset, sample, true); // write 16-bit sample
      offset += 2;
    }
    pos++;
  }

  return new Blob([buffer], { type: "audio/wav" });

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }
  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
}
