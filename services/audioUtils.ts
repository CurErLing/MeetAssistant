
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

/**
 * 将任意音频文件或数据块转换为 WAV 格式
 */
export const convertToWav = async (fileOrData: File | Uint8Array[]): Promise<File> => {
  const audioCtx = getAudioContext();

  try {
    let arrayBuffer: ArrayBuffer;
    let chunks: Uint8Array[] = [];
    let fileName = "converted.wav";

    if (fileOrData instanceof File) {
      arrayBuffer = await fileOrData.arrayBuffer();
      fileName = fileOrData.name.replace(/\.[^/.]+$/, "") + ".wav";
      // 如果是文件，我们尝试先用原生解码
      try {
        const sourceBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
        const wavBlob = bufferToWav(sourceBuffer);
        return new File([wavBlob], fileName, { type: 'audio/wav' });
      } catch (e) {
        console.warn("Native decoding failed, trying WebCodecs fallback for raw frames...");
        chunks = [new Uint8Array(arrayBuffer)];
      }
    } else {
      chunks = fileOrData;
    }

    // 使用 WebCodecs 解码原始 Opus 帧
    if ('AudioDecoder' in window) {
      try {
        console.log(`Attempting WebCodecs decoding for ${chunks.length} chunks...`);
        const decodedBuffer = await decodeOpusFrames(chunks, 16000, 1);
        console.log("WebCodecs decoding successful!", {
          duration: decodedBuffer.duration,
          length: decodedBuffer.length,
          sampleRate: decodedBuffer.sampleRate
        });
        const wavBlob = bufferToWav(decodedBuffer);
        return new File([wavBlob], fileName, { type: 'audio/wav' });
      } catch (webCodecsError) {
        console.error("WebCodecs decoding failed, details:", webCodecsError);
      }
    }

    // 最后的兜底：PCM 16kHz
    const totalSize = chunks.reduce((acc, c) => acc + c.length, 0);
    const combined = new Uint8Array(totalSize);
    let offset = 0;
    for (const c of chunks) {
      combined.set(c, offset);
      offset += c.length;
    }
    
    console.warn("Falling back to raw PCM 16kHz. If this is noise, the data is likely Opus but WebCodecs failed.");
    const wavBlob = bufferToWavFromRaw(combined, 16000, 1);
    return new File([wavBlob], fileName, { type: 'audio/wav' });

  } catch (error) {
    console.error("Audio conversion failed:", error);
    return fileOrData instanceof File ? fileOrData : new File([], "error.wav");
  } finally {
    await audioCtx.close();
  }
};

/**
 * 使用 WebCodecs (AudioDecoder) 解码原始 Opus 帧
 */
async function decodeOpusFrames(chunks: Uint8Array[], targetSampleRate: number, channels: number): Promise<AudioBuffer> {
  return new Promise(async (resolve, reject) => {
    const audioCtx = getAudioContext();
    const decodedChunks: AudioBuffer[] = [];
    let frameCount = 0;
    
    // 每一个 EncodedAudioChunk 都需要一个唯一且递增的时间戳
    // 我们假设每帧 20ms (20000微秒)
    const FRAME_DURATION_US = 20000;

    const decoder = new (window as any).AudioDecoder({
      output: (data: any) => {
        frameCount++;
        // 记录解码出的实际采样数，用于诊断时长问题
        if (frameCount <= 3) {
          console.log(`Frame ${frameCount} info: sampleRate=${data.sampleRate}, duration=${data.duration}us, frames=${data.numberOfFrames}`);
        }
        const buffer = audioCtx.createBuffer(data.numberOfChannels, data.numberOfFrames, data.sampleRate);
        for (let i = 0; i < data.numberOfChannels; i++) {
          data.copyTo(buffer.getChannelData(i), { planeIndex: i });
        }
        decodedChunks.push(buffer);
        data.close();
      },
      error: (e: any) => {
        console.error("AudioDecoder error callback:", e);
        reject(e);
      },
    });

    // Opus 标准头：参考用户提供的代码，动态设置采样率
    const opusHead = new Uint8Array(19);
    const view = new DataView(opusHead.buffer);
    opusHead.set([0x4F, 0x70, 0x75, 0x73, 0x48, 0x65, 0x61, 0x64], 0); // 'OpusHead'
    view.setUint8(8, 1); // Version
    view.setUint8(9, channels); // Channels
    view.setUint16(10, 0, true); // Pre-skip
    view.setUint32(12, targetSampleRate, true); // 关键：使用 16000 而非硬编码 48000
    view.setUint16(16, 0, true); // Output gain
    view.setUint8(18, 0); // Mapping family

    try {
      await decoder.configure({
        codec: 'opus',
        sampleRate: targetSampleRate, // 与 OpusHead 保持一致
        numberOfChannels: channels,
        description: opusHead
      });

      const totalSize = chunks.reduce((acc, c) => acc + c.length, 0);
      console.log(`Decoder configured with SR: ${targetSampleRate}, Channels: ${channels}`);
      console.log(`Feeding ${chunks.length} chunks (${totalSize} bytes, avg ${Math.round(totalSize/chunks.length)} bytes/chunk) to decoder...`);

      // 改进的解码循环
      let currentTimestamp = 0;
      // 计算每帧的时长（微秒）。Opus 默认通常是 20ms = 20000us
      const FRAME_DURATION_US = 20000; 

      let totalSubFrames = 0;
      for (let i = 0; i < chunks.length; i++) {
        let chunk = chunks[i];
        if (chunk.length === 0) continue;

        const trySmartSplit = (data: Uint8Array) => {
          const frames: Uint8Array[] = [];
          
          // 策略 1: 检查是否符合长度前缀协议 [Len] [Data...]
          let pos = 0;
          let tempFrames: Uint8Array[] = [];
          let isLikelyLengthPrefixed = true;

          while (pos < data.length) {
            const frameLen = data[pos];
            // Opus 帧通常在 20-120 字节之间
            if (frameLen >= 10 && frameLen < 255 && pos + 1 + frameLen <= data.length) {
              tempFrames.push(data.slice(pos + 1, pos + 1 + frameLen));
              pos += 1 + frameLen;
            } else if (pos === data.length) {
              break;
            } else {
              isLikelyLengthPrefixed = false;
              break;
            }
          }

          if (isLikelyLengthPrefixed && tempFrames.length > 0) return tempFrames;
          
          // 策略 2: 针对蓝牙 MTU (约 240 字节) 的固定大小切分探测
          // 如果每包约 240 字节且包含约 6 帧，则每帧约 40 字节
          if (data.length > 100) {
            // 尝试几种常见的 Opus 帧对齐大小 (40, 41, 60, 80)
            // 很多设备会固定每帧 40 字节，或者 1 字节头 + 40 字节数据
            const possibleFrameSizes = [40, 41, 60, 80];
            for (const size of possibleFrameSizes) {
              if (data.length % size === 0 || (data.length % size < 5)) {
                console.log(`Detected potential fixed frame size: ${size} for chunk length ${data.length}`);
                for (let p = 0; p < data.length; p += size) {
                  if (p + size <= data.length) {
                    frames.push(data.slice(p, p + size));
                  }
                }
                return frames;
              }
            }
            
            // 如果都不匹配，尝试最激进的策略：假设每包前 1-4 字节是 header，后面全是 40 字节一帧
            // 这在很多蓝牙透传协议中很常见
            const headerSkip = data[0] === 0x55 ? 4 : 0; // 某些协议以 0x55 开头
            for (let p = headerSkip; p + 40 <= data.length; p += 40) {
               frames.push(data.slice(p, p + 40));
            }
            if (frames.length > 0) return frames;
          }

          // 策略 3: 保底
          return [data];
        };

        const subFrames = trySmartSplit(chunk);
        totalSubFrames += subFrames.length;
        
        for (const frame of subFrames) {
          try {
            decoder.decode(new (window as any).EncodedAudioChunk({
              type: 'key',
              timestamp: currentTimestamp,
              data: frame
            }));
            currentTimestamp += FRAME_DURATION_US;
          } catch (err) {
            console.warn(`Decode error at chunk ${i}:`, err);
          }
        }
      }
      console.log(`Feeding finished. Total chunks: ${chunks.length}, Total sub-frames: ${totalSubFrames}`);

      await decoder.flush();
      decoder.close();

      console.log(`Decoding complete. Input: ${chunks.length} chunks, Output: ${frameCount} frames.`);

      if (decodedChunks.length === 0) {
        throw new Error("AudioDecoder produced no output. Data may not be Opus.");
      }

      console.log(`Total decoded frames: ${frameCount}, chunks processed: ${chunks.length}`);

      if (decodedChunks.length === 0) {
        throw new Error("AudioDecoder produced no output frames. The input data might not be valid Opus frames.");
      }

      // 合并所有的 AudioBuffer 并进行重采样 (如果需要)
      const totalFrames = decodedChunks.reduce((acc, b) => acc + b.length, 0);
      const sourceSampleRate = decodedChunks[0].sampleRate;
      
      console.log(`Merging buffers. Source SR: ${sourceSampleRate}, Target SR: ${targetSampleRate}`);

      // 先合并成原始采样率的 Buffer
      const mergedBuffer = audioCtx.createBuffer(channels, totalFrames, sourceSampleRate);
      let mergeOffset = 0;
      for (const b of decodedChunks) {
        for (let i = 0; i < channels; i++) {
          mergedBuffer.getChannelData(i).set(b.getChannelData(i), mergeOffset);
        }
        mergeOffset += b.length;
      }

      // 如果采样率不匹配，进行重采样
      if (sourceSampleRate !== targetSampleRate) {
        // 精确计算重采样后的帧数，避免舍入误差导致的声音发抖
        const targetLength = Math.round((totalFrames * targetSampleRate) / sourceSampleRate);
        console.log(`Resampling: ${totalFrames} @ ${sourceSampleRate}Hz -> ${targetLength} @ ${targetSampleRate}Hz`);
        
        const offlineCtx = new OfflineAudioContext(channels, targetLength, targetSampleRate);
        const source = offlineCtx.createBufferSource();
        source.buffer = mergedBuffer;
        source.connect(offlineCtx.destination);
        source.start(0);
        
        const resampledBuffer = await offlineCtx.startRendering();
        resolve(resampledBuffer);
      } else {
        resolve(mergedBuffer);
      }
    } catch (e) {
      console.error("decodeOpusFrames caught error:", e);
      reject(e);
    }
  });
}

/**
 * 辅助方法：直接从原始 PCM 数据创建 WAV Blob
 */
function bufferToWavFromRaw(pcmData: Uint8Array, sampleRate: number, numChannels: number): Blob {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  
  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + pcmData.length, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, pcmData.length, true);

  return new Blob([header, pcmData as any], { type: 'audio/wav' });
}

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
