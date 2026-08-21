import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const sampleRate = 22_050;
const argument = (name: string) => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
};
const durationSec = Number(argument("--duration") ?? 12);
const noteSets = [
  [261.63, 329.63, 392, 523.25],
  [293.66, 369.99, 440, 587.33],
  [329.63, 392, 493.88, 659.25],
  [220, 277.18, 329.63, 440],
  [246.94, 311.13, 369.99, 493.88],
  [196, 246.94, 293.66, 392],
];

function createWave(notes: number[]): Buffer {
  const sampleCount = sampleRate * durationSec;
  const dataSize = sampleCount * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVEfmt ", 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let index = 0; index < sampleCount; index += 1) {
    const time = index / sampleRate;
    const beat = Math.floor(time * 2) % notes.length;
    const phase = time % 0.5;
    const envelope = Math.min(1, phase * 12) * Math.max(0, 1 - phase * 1.7);
    const fundamental = Math.sin(2 * Math.PI * notes[beat] * time);
    const harmonic = Math.sin(2 * Math.PI * notes[(beat + 2) % notes.length] * time) * 0.28;
    const sample = Math.round((fundamental + harmonic) * envelope * 0.22 * 32767);
    buffer.writeInt16LE(sample, 44 + index * 2);
  }
  return buffer;
}

const outputDirectory = resolve(process.cwd(), argument("--output") ?? "public/assets/new-games/audio");
const outputCount = Math.min(noteSets.length, Number(argument("--count") ?? noteSets.length));
mkdirSync(outputDirectory, { recursive: true });
noteSets.slice(0, outputCount).forEach((notes, index) => writeFileSync(join(outputDirectory, `tone-${index + 1}.wav`), createWave(notes)));
console.log(`Generated ${outputCount} original WAV samples in ${outputDirectory}`);
