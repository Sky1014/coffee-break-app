/**
 * Convert WAV assets to OGG for smaller package size.
 * Requires: @ffmpeg-installer/ffmpeg and fluent-ffmpeg (devDependencies).
 * Run: node scripts/convert-audio.cjs
 */
const path = require('node:path');
const fs = require('node:fs');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

const ASSETS_DIR = path.join(__dirname, '..', 'assets');

const files = [
  { input: 'coffee-pour-60s.wav', output: 'coffee-pour-60s.ogg' },
  { input: 'coffee-pour.wav', output: 'coffee-pour.ogg' }
];

async function convertOne(input, output) {
  return new Promise((resolve, reject) => {
    const inputPath = path.join(ASSETS_DIR, input);
    const outputPath = path.join(ASSETS_DIR, output);

    if (!fs.existsSync(inputPath)) {
      console.log(`  skip: ${input} not found`);
      return resolve(null);
    }

    ffmpeg(inputPath)
      .audioCodec('libvorbis')
      .audioQuality(6)       // 0-10, 6 is good balance (~192kbps eq)
      .output(outputPath)
      .on('end', () => {
        const inSize = (fs.statSync(inputPath).size / 1024 / 1024).toFixed(1);
        const outSize = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(1);
        console.log(`  ${input} (${inSize}MB) -> ${output} (${outSize}MB)`);
        resolve({ input, inputPath, output, outputPath, inSize, outSize });
      })
      .on('error', (err) => {
        console.error(`  FAILED: ${input} -> ${err.message}`);
        reject(err);
      })
      .run();
  });
}

async function main() {
  console.log('Converting WAV assets to OGG...\n');
  const results = [];
  for (const f of files) {
    try {
      const r = await convertOne(f.input, f.output);
      if (r) results.push(r);
    } catch {
      // Continue with next file
    }
  }
  console.log(`\nDone. Converted ${results.length} file(s).`);
  console.log('Remember: update references in code from .wav to .ogg!');
}

main().catch((err) => {
  console.error('Conversion failed:', err.message);
  process.exit(1);
});
