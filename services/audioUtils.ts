
// Utility to slice (trim) an audio file in the browser without external libraries.
// It decodes the audio, copies the selected segment, and re-encodes it as WAV.

const getAudioContext = () => {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  return new AudioContextClass();
};

// 50MB limit for browser in-memory decoding to prevent OOM (Out Of Memory) crashes.
// A 50MB MP3/M4A can decode to >500MB PCM data, risking browser stability on mobile.
const MAX_SAFE_DECODE_SIZE = 50 * 1024 * 1024; 

/**
 * 保留选中区域 (裁剪掉首尾)
 */
export const sliceAudio = async (file: File, start: number, end: number): Promise<File> => {
  // 1. Safety Check: If file is too large, skip physical slicing to avoid OOM.
  // The app will fall back to "Virtual Trimming" (sending timestamps to AI prompt).
  if (file.size > MAX_SAFE_DECODE_SIZE) {
    console.warn(`[AudioUtils] File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds safe decoding limit. Skipping physical slice to prevent crash.`);
    return file;
  }

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
    // Return original file on failure ensures the user flow continues
    return file;
  } finally {
    // Explicitly close context to release hardware resources
    if (audioCtx.state !== 'closed') {
      await audioCtx.close();
    }
  }
};

/**
 * 获取音频文件的时长 (秒)
 */
export const getAudioDuration = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    // Optimization: Use standard HTML5 Audio element for duration which streams metadata
    // instead of decoding the whole file.
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
    
    const decoder = new (window as any).AudioDecoder({
      output: (data: any) => {
        frameCount++;
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

    // Opus 标准头
    const opusHead = new Uint8Array(19);
    const view = new DataView(opusHead.buffer);
    opusHead.set([0x4F, 0x70, 0x75, 0x73, 0x48, 0x65, 0x61, 0x64], 0);
    view.setUint8(8, 1);
    view.setUint8(9, channels);
    view.setUint16(10, 0, true);
    view.setUint32(12, targetSampleRate, true);
    view.setUint16(16, 0, true);
    view.setUint8(18, 0);

    try {
      await decoder.configure({
        codec: 'opus',
        sampleRate: targetSampleRate,
        numberOfChannels: channels,
        description: opusHead
      });

      // 合并数据进行分析
      const totalSize = chunks.reduce((acc, c) => acc + c.length, 0);
      const fullData = new Uint8Array(totalSize);
      let currentOffset = 0;
      for (const c of chunks) {
        fullData.set(c, currentOffset);
        currentOffset += c.length;
      }

      // --- 动态探测逻辑 ---
      const trySmartSplit = (data: Uint8Array): { frames: Uint8Array[], frameDurationUs: number } => {
        // 候选帧大小列表 (常见于不同码率下的 20ms 帧)
        const candidates = [40, 80, 60, 120, 20, 160];
        let detectedSize = 40; // 默认
        let detectedDurationUs = 20000;

        // 1. 尝试检测 TOC 字节模式 (Opus 帧的第一个字节包含配置信息)
        for (const size of candidates) {
          if (data.length >= size * 3) {
            const toc1 = data[0] & 0xFC; // 忽略最后两位 (通道和帧数)
            const toc2 = data[size] & 0xFC;
            const toc3 = data[size * 2] & 0xFC;
            if (toc1 === toc2 && toc2 === toc3 && toc1 !== 0) {
              detectedSize = size;
              // 从 TOC 字节解析时长
              const config = (data[0] >> 3) & 0x1F;
              if (config < 4) detectedDurationUs = 10000;
              else if (config < 8) detectedDurationUs = 20000;
              else if (config < 12) detectedDurationUs = 40000;
              else if (config < 16) detectedDurationUs = 60000;
              console.log(`Dynamic detection: size=${size}, duration=${detectedDurationUs}us, TOC=${toc1.toString(16)}`);
              break;
            }
          }
        }

        const result: Uint8Array[] = [];
        for (let p = 0; p + detectedSize <= data.length; p += detectedSize) {
          result.push(data.slice(p, p + detectedSize));
        }
        return { frames: result, frameDurationUs: detectedDurationUs };
      };

      const { frames, frameDurationUs } = trySmartSplit(fullData);
      console.log(`Adaptive splitting: Found ${frames.length} frames, using ${frameDurationUs}us per frame.`);

      let currentTimestamp = 0;
      for (const frame of frames) {
        try {
          decoder.decode(new (window as any).EncodedAudioChunk({
            type: 'key',
            timestamp: currentTimestamp,
            data: frame
          }));
          currentTimestamp += frameDurationUs;
        } catch (err) {
          console.warn(`Decode error at timestamp ${currentTimestamp}:`, err);
        }
      }
      
      await decoder.flush();
      decoder.close();

      if (decodedChunks.length === 0) {
        throw new Error("AudioDecoder produced no output.");
      }

      // 合并并重采样
      const totalFrames = decodedChunks.reduce((acc, b) => acc + b.length, 0);
      const sourceSampleRate = decodedChunks[0].sampleRate;
      const mergedBuffer = audioCtx.createBuffer(channels, totalFrames, sourceSampleRate);
      let mergeOffset = 0;
      for (const b of decodedChunks) {
        for (let i = 0; i < channels; i++) {
          mergedBuffer.getChannelData(i).set(b.getChannelData(i), mergeOffset);
        }
        mergeOffset += b.length;
      }

      if (sourceSampleRate !== targetSampleRate) {
        const targetLength = Math.round((totalFrames * targetSampleRate) / sourceSampleRate);
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
