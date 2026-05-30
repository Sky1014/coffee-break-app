const { app, BrowserWindow } = require('electron');
const path = require('node:path');

const inputPath = process.argv[2];
const outputPath = process.argv[3];
const targetSeconds = Number(process.argv[4] || 60);
const crossfadeSeconds = Number(process.argv[5] || 0.22);

if (!inputPath || !outputPath) {
  console.error('Usage: electron scripts/extend-audio.cjs <input.mp3> <output.wav> [seconds] [crossfadeSeconds]');
  process.exit(2);
}

function normalizePath(value) {
  return path.resolve(value);
}

async function main() {
  await app.whenReady();

  const window = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      sandbox: false
    }
  });

  await window.loadURL('about:blank');

  const result = await window.webContents.executeJavaScript(`
    (async () => {
      const fs = require('node:fs');
      const inputPath = ${JSON.stringify(normalizePath(inputPath))};
      const outputPath = ${JSON.stringify(normalizePath(outputPath))};
      const targetSeconds = ${JSON.stringify(targetSeconds)};
      const crossfadeSeconds = ${JSON.stringify(crossfadeSeconds)};

      function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
      }

      function encodeWav(channelData, sampleRate) {
        const channelCount = channelData.length;
        const frameCount = channelData[0].length;
        const bytesPerSample = 2;
        const blockAlign = channelCount * bytesPerSample;
        const byteRate = sampleRate * blockAlign;
        const dataSize = frameCount * blockAlign;
        const buffer = Buffer.alloc(44 + dataSize);
        let offset = 0;

        function writeString(value) {
          buffer.write(value, offset, 'ascii');
          offset += value.length;
        }

        writeString('RIFF');
        buffer.writeUInt32LE(36 + dataSize, offset);
        offset += 4;
        writeString('WAVE');
        writeString('fmt ');
        buffer.writeUInt32LE(16, offset);
        offset += 4;
        buffer.writeUInt16LE(1, offset);
        offset += 2;
        buffer.writeUInt16LE(channelCount, offset);
        offset += 2;
        buffer.writeUInt32LE(sampleRate, offset);
        offset += 4;
        buffer.writeUInt32LE(byteRate, offset);
        offset += 4;
        buffer.writeUInt16LE(blockAlign, offset);
        offset += 2;
        buffer.writeUInt16LE(16, offset);
        offset += 2;
        writeString('data');
        buffer.writeUInt32LE(dataSize, offset);
        offset += 4;

        for (let i = 0; i < frameCount; i += 1) {
          for (let ch = 0; ch < channelCount; ch += 1) {
            const sample = clamp(channelData[ch][i], -1, 1);
            const intSample = Math.round(sample < 0 ? sample * 32768 : sample * 32767);
            buffer.writeInt16LE(intSample, offset);
            offset += 2;
          }
        }

        return buffer;
      }

      const mp3Bytes = fs.readFileSync(inputPath);
      const copy = mp3Bytes.buffer.slice(mp3Bytes.byteOffset, mp3Bytes.byteOffset + mp3Bytes.byteLength);
      const audioContext = new AudioContext();
      const decoded = await audioContext.decodeAudioData(copy);
      const sampleRate = decoded.sampleRate;
      const sourceFrames = decoded.length;
      const targetFrames = Math.round(targetSeconds * sampleRate);
      const sourceChannels = decoded.numberOfChannels;
      const outputChannels = sourceChannels === 1 ? 1 : 2;
      const fadeFrames = Math.min(Math.round(crossfadeSeconds * sampleRate), Math.max(0, Math.floor(sourceFrames / 4)));
      const source = [];
      const output = [];

      for (let ch = 0; ch < outputChannels; ch += 1) {
        source[ch] = decoded.getChannelData(Math.min(ch, sourceChannels - 1));
        output[ch] = new Float32Array(targetFrames);
      }

      for (let i = 0; i < targetFrames; i += 1) {
        const index = i % sourceFrames;
        for (let ch = 0; ch < outputChannels; ch += 1) {
          let sample = source[ch][index];
          if (fadeFrames > 0 && sourceFrames < targetFrames && index >= sourceFrames - fadeFrames) {
            const fade = (index - (sourceFrames - fadeFrames)) / fadeFrames;
            const nextIndex = index - (sourceFrames - fadeFrames);
            const equalPowerOut = Math.cos(fade * Math.PI * 0.5);
            const equalPowerIn = Math.sin(fade * Math.PI * 0.5);
            sample = source[ch][index] * equalPowerOut + source[ch][nextIndex] * equalPowerIn;
          }
          output[ch][i] = sample;
        }
      }

      const fadeOutFrames = Math.min(Math.round(0.04 * sampleRate), Math.floor(targetFrames / 4));
      for (let i = 0; i < fadeOutFrames; i += 1) {
        const fade = 1 - i / fadeOutFrames;
        for (let ch = 0; ch < outputChannels; ch += 1) {
          output[ch][targetFrames - 1 - i] *= fade;
        }
      }

      fs.writeFileSync(outputPath, encodeWav(output, sampleRate));
      await audioContext.close();

      return {
        inputPath,
        outputPath,
        sourceSeconds: decoded.duration,
        targetSeconds,
        sampleRate,
        channels: outputChannels,
        crossfadeSeconds: fadeFrames / sampleRate
      };
    })()
  `);

  console.log(JSON.stringify(result, null, 2));
  window.destroy();
  app.quit();
}

main().catch((error) => {
  console.error(error);
  app.quit();
  process.exit(1);
});
