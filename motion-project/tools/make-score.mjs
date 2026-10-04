// UNBOUND のオリジナル・リズムベッド（75秒、48kHz ステレオ）を決定論的に合成する。
// 既存SFXは Remotion 側で接触点に置く。ここでは主要接触点のキックを抜き、二重に重ねない。
// 使い方: node tools/make-score.mjs → public/audio/score-bed.wav
import fs from "node:fs";

const SR = 48000;
const DUR = 75;
const N = SR * DUR;
const L = new Float32Array(N);
const R = new Float32Array(N);
const BEAT = 60 / 128;
const fr = (f) => f / 30;

let seed = 7;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;

function add(at, buf, gain = 1, pan = 0) {
  const s0 = Math.round(at * SR);
  const gl = gain * (1 - Math.max(0, pan));
  const gr = gain * (1 + Math.min(0, pan));
  for (let i = 0; i < buf.length; i++) {
    const j = s0 + i;
    if (j < 0 || j >= N) continue;
    L[j] += buf[i] * gl;
    R[j] += buf[i] * gr;
  }
}

function kick(len = 0.38, f0 = 120, f1 = 44) {
  const n = Math.round(len * SR);
  const b = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = f1 + (f0 - f1) * Math.exp(-t * 32);
    ph += (2 * Math.PI * f) / SR;
    b[i] = Math.sin(ph) * Math.exp(-t * 9) * Math.min(1, t * 400);
  }
  return b;
}

function hat(len = 0.05, bright = 1) {
  const n = Math.round(len * SR);
  const b = new Float32Array(n);
  let prev = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const w = rnd();
    b[i] = (w - prev * 0.96) * Math.exp(-t * (70 / bright)) * 0.5;
    prev = w;
  }
  return b;
}

function tone(freq, len, attack, release, harm = [1, 0.3, 0.12]) {
  const n = Math.round(len * SR);
  const b = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const env = Math.min(1, t / attack) * Math.min(1, (len - t) / release);
    let v = 0;
    harm.forEach((h, k) => (v += h * Math.sin(2 * Math.PI * freq * (k + 1) * t)));
    b[i] = v * env;
  }
  return b;
}

function riser(len, top = 1) {
  const n = Math.round(len * SR);
  const b = new Float32Array(n);
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const p = t / len;
    const a = 0.05 + 0.6 * p * p;
    lp += a * (rnd() - lp);
    b[i] = (lp * 0.6 + 0.25 * Math.sin(2 * Math.PI * (200 + 1800 * p * p) * t)) * p * p * top;
  }
  return b;
}

// 主要接触点（Remotion 側で SFX を置くフレーム）。この近くではベッドのキックを抜く
const HERO = [112, 197, 295, 337, 520, 546, 610, 1394, 1410, 1462, 1477, 1800, 1912, 2138].map(fr);
const nearHero = (t) => HERO.some((h) => Math.abs(h - t) < 0.09);

const K = kick();
const KS = kick(0.3, 95, 40);
const H = hat();
const HO = hat(0.12, 2.2);

// 拍ごとのパターン
for (let b = 0; b < 160; b++) {
  const t = b * BEAT;
  const bar = Math.floor(b / 4);
  const pos = b % 4;
  if (t >= 41.0 && t < 48.75) continue; // 人物：リズムを止める
  if (t >= 69.4) continue; // 余韻
  let kickG = 0;
  let hats = [];
  if (t < 5.625) kickG = pos === 0 && b < 8 ? 0.35 : 0;
  else if (t < 16.875) {
    kickG = pos % 2 === 0 ? 0.55 : 0;
    if (b >= 16) hats = [0.5];
  } else if (t < 28.125) {
    kickG = 0.6;
    hats = [0.5, 0.25, 0.75];
  } else if (t < 41.25) {
    kickG = pos === 0 && bar % 2 === 0 ? 0.3 : 0;
    hats = pos === 2 ? [0.5] : [];
  } else if (t < 52.5) {
    kickG = 0.7;
    hats = [0.25, 0.5, 0.75];
  } else if (t < 58.1) {
    kickG = pos % 2 === 0 ? 0.5 : 0; // FLOW：浮遊
    hats = [0.5];
  } else if (t < 60) {
    kickG = 0.55;
    hats = [0.5];
  } else if (t < 63.7) {
    kickG = 0.72;
    hats = [0.25, 0.5, 0.75];
    if (t > 62.3) add(t + BEAT / 2, KS, 0.4); // 溜めで倍打ち
  } else if (t < 65.6) {
    kickG = 0;
  } else {
    kickG = pos === 0 ? 0.32 : 0;
  }
  if (kickG > 0 && !nearHero(t)) add(t, K, kickG);
  hats.forEach((h, k) => add(t + h * BEAT, h === 0.5 ? HO : H, 0.16 + 0.04 * k, (k % 2 ? -0.35 : 0.35)));
}

// ベース：区間ごとの音型（A マイナー周辺）
const BASS = [55, 55, 65.41, 49];
for (let b = 0; b < 160; b++) {
  const t = b * BEAT;
  const bar = Math.floor(b / 4);
  const f = BASS[bar % 4];
  if (t >= 16.875 && t < 28.125) for (const h of [0, 0.5]) add(t + h * BEAT, tone(f, BEAT * 0.45, 0.005, 0.08, [1, 0.45, 0.15]), 0.22);
  if ((t >= 48.75 && t < 52.5) || (t >= 60 && t < 63.7)) for (const h of [0, 0.5]) add(t + h * BEAT, tone(f, BEAT * 0.45, 0.005, 0.08, [1, 0.5, 0.2]), 0.26);
  if (t >= 52.5 && t < 60 && b % 2 === 0) add(t, tone(f, BEAT * 1.8, 0.02, 0.3, [1, 0.3]), 0.2);
  if (t >= 5.625 && t < 16.875 && b % 4 === 0) add(t, tone(41.2, BAR(), 0.01, 0.4, [1, 0.4]), 0.2);
}
function BAR() {
  return BEAT * 4;
}

// パッド（和音）：着火の持続、空間の広がり、終わりの解決
function pad(at, len, freqs, gain, attack = 1.5, release = 2) {
  freqs.forEach((fq, k) => {
    add(at, tone(fq * (1 + 0.002 * k), len, attack, release, [1, 0.2]), gain / freqs.length, k % 2 ? -0.4 : 0.4);
    add(at, tone(fq * 1.004, len, attack, release, [1]), (gain / freqs.length) * 0.6, k % 2 ? 0.4 : -0.4);
  });
}
pad(0, 5.8, [55, 82.41], 0.18, 3, 0.4);
pad(28.1, 13.2, [110, 164.8, 220, 261.6, 329.6], 0.16, 2.5, 1.5);
pad(41.2, 7.6, [55, 82.41], 0.05, 1.5, 0.8); // 人物の下に薄く
pad(52.5, 7.5, [110, 164.8, 246.9, 329.6], 0.12, 1.2, 1.5);
pad(65.6, 9.4, [110, 138.6, 164.8, 220, 277.2, 329.6], 0.17, 2.0, 3.8); // A メジャーで解決

// ライザー（溜め）
add(fr(24), riser(fr(100) - fr(24), 0.5), 0.35);
add(39.2, riser(2.0, 0.6), 0.32);
add(fr(1870), riser(fr(1912) - fr(1870), 0.8), 0.4);

// マスター：ソフトクリップとピーク正規化（-6 dBFS）
let peak = 0;
for (let i = 0; i < N; i++) {
  L[i] = Math.tanh(L[i] * 1.2) / 1.2;
  R[i] = Math.tanh(R[i] * 1.2) / 1.2;
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
}
const norm = 0.5 / peak;
const out = Buffer.alloc(44 + N * 4);
out.write("RIFF", 0);
out.writeUInt32LE(36 + N * 4, 4);
out.write("WAVEfmt ", 8);
out.writeUInt32LE(16, 16);
out.writeUInt16LE(1, 20);
out.writeUInt16LE(2, 22);
out.writeUInt32LE(SR, 24);
out.writeUInt32LE(SR * 4, 28);
out.writeUInt16LE(4, 32);
out.writeUInt16LE(16, 34);
out.write("data", 36);
out.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  out.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * norm)) * 32767), 44 + i * 4);
  out.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * norm)) * 32767), 46 + i * 4);
}
fs.writeFileSync("public/audio/score-bed.wav", out);
console.log("score-bed.wav written, raw peak", peak.toFixed(3));
