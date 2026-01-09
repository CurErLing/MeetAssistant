
// 100MB limit for safe decoding in browser
const MAX_SAFE_DECODE_SIZE = 100 * 1024 * 1024;

let audioContext: AudioContext | null = null;

export const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
};

export const getAudioDuration = async (file: File): Promise<number> => {
  if (file.type.startsWith('audio/')) {
     const audio = new Audio(URL.createObjectURL(file));
     return new Promise((resolve) => {
        audio.onloadedmetadata = () => {
           resolve(audio.duration);
        };
        audio.onerror = () => resolve(0);
     });
  }
  return 0;
};

// Simple WAV encoder
export const bufferToWav = (buffer: AudioBuffer): Blob => {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const bufferArr = new ArrayBuffer(length);
  const view = new DataView(bufferArr);
  const channels = [];
  let i;
  let sample;
  let offset = 0;
  let pos = 0;

  // write WAVE header
  setUint32(0x46464952);                         // "RIFF"
  setUint32(length - 8);                         // file length - 8
  setUint32(0x45564157);                         // "WAVE"

  setUint32(0x20746d66);                         // "fmt " chunk
  setUint32(16);                                 // length = 16
  setUint16(1);                                  // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan);  // avg. bytes/sec
  setUint16(numOfChan * 2);                      // block-align
  setUint16(16);                                 // 16-bit (hardcoded in this example)

  setUint32(0x61746164);                         // "data" - chunk
  setUint32(length - pos - 4);                   // chunk length

  // write interleaved data
  for(i = 0; i < buffer.numberOfChannels; i++)
    channels.push(buffer.getChannelData(i));

  while(pos < buffer.length) {
    for(i = 0; i < numOfChan; i++) {             // interleave channels
      sample = Math.max(-1, Math.min(1, channels[i][pos])); // clamp
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767)|0; // scale to 16-bit signed int
      view.setInt16(44 + offset, sample, true);          // write 16-bit sample
      offset += 2;
    }
    pos++;
  }

  return new Blob([bufferArr], { type: 'audio/wav' });

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
};

export const convertToWav = async (chunks: Uint8Array[]): Promise<Blob> => {
    // Determine total length
    const totalLen = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const merged = new Uint8Array(totalLen);
    let offset = 0;
    for (const chunk of chunks) {
        merged.set(chunk, offset);
        offset += chunk.length;
    }
    // Assuming 16k mono 16bit PCM for now if raw, or let browser decode if it has header
    try {
        const audioCtx = getAudioContext();
        // DecodeAudioData requires a complete file usually, let's try creating a blob first
        const inputBlob = new Blob([merged]); 
        const arrayBuffer = await inputBlob.arrayBuffer();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        return bufferToWav(audioBuffer);
    } catch(e) {
        console.error("Conversion failed, returning raw blob", e);
        return new Blob([merged], {type: 'audio/wav'});
    }
};

/**
 * 保留选中区域 (裁剪掉首尾)
 * 优化：使用 OfflineAudioContext 重采样为 16kHz 单声道以减小文件体积
 */
export const sliceAudio = async (file: File, start: number, end: number): Promise<File> => {
  if (file.size > MAX_SAFE_DECODE_SIZE) {
    console.warn(`[AudioUtils] File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds safe decoding limit.`);
    return file;
  }

  const audioCtx = getAudioContext();

  try {
    const arrayBuffer = await file.arrayBuffer();
    const sourceBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    const duration = sourceBuffer.duration;
    // Calculate safe bounds
    const safeStart = Math.max(0, start);
    const safeEnd = (end > 0 && end < duration) ? end : duration;
    
    // Optimization: If the requested range covers almost the entire file, return original.
    // This prevents re-encoding compressed files (MP3) into WAV, which avoids file size explosion.
    if (safeStart <= 0.1 && safeEnd >= duration - 0.1) {
      return file;
    }

    const newDuration = safeEnd - safeStart;
    if (newDuration <= 0) return file;

    // Target Format: 16kHz, Mono (Sufficient for Speech, much smaller size)
    const TARGET_RATE = 16000;
    const TARGET_CHANNELS = 1;

    const offlineCtx = new OfflineAudioContext(
      TARGET_CHANNELS,
      newDuration * TARGET_RATE,
      TARGET_RATE
    );

    const source = offlineCtx.createBufferSource();
    source.buffer = sourceBuffer;
    
    // Connect to destination (automatically mixes down channels if needed)
    source.connect(offlineCtx.destination);

    // Schedule: start playing the buffer at 'safeStart' offset, immediately at time 0 of the offline context
    // start(when, offset, duration)
    source.start(0, safeStart, newDuration);

    const renderedBuffer = await offlineCtx.startRendering();

    const wavBlob = bufferToWav(renderedBuffer);
    const newName = file.name.replace(/\.[^/.]+$/, "") + "_trimmed.wav";
    return new File([wavBlob], newName, { type: 'audio/wav' });

  } catch (error) {
    console.error("Audio slicing failed:", error);
    return file;
  } finally {
    if (audioCtx.state !== 'closed') {
      // await audioCtx.close(); // Don't close shared context
    }
  }
};
