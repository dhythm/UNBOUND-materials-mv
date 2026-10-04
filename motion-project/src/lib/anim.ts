import { Easing, interpolate } from "remotion";

export type EaseFn = (t: number) => number;

export const ease = {
  linear: (t: number) => t,
  out: Easing.out(Easing.cubic),
  in: Easing.in(Easing.cubic),
  inOut: Easing.inOut(Easing.cubic),
  outExpo: Easing.out(Easing.exp),
  inExpo: Easing.in(Easing.exp),
  inOutExpo: Easing.inOut(Easing.exp),
  outQuint: Easing.out(Easing.poly(5)),
  inQuart: Easing.in(Easing.poly(4)),
  outBack: Easing.out(Easing.back(1.6)),
  inBack: Easing.in(Easing.back(1.8)),
  /** 速く入って長く減速する（スナップ） */
  snap: Easing.bezier(0.1, 0.9, 0.2, 1),
  /** 溜めてから出る */
  windup: Easing.bezier(0.6, -0.35, 0.7, 0.1),
};

/** f が a→b の間で 0→1（クランプ付き、イージング任意） */
export function progress(f: number, a: number, b: number, fn: EaseFn = ease.linear): number {
  if (b <= a) return f >= b ? 1 : 0;
  const t = Math.min(1, Math.max(0, (f - a) / (b - a)));
  return fn(t);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(v: number, lo = 0, hi = 1): number {
  return Math.min(hi, Math.max(lo, v));
}

/** キーフレーム補間（クランプ付き） */
export function keys(f: number, input: number[], output: number[], fn?: EaseFn): number {
  return interpolate(f, input, output, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: fn,
  });
}

/**
 * 減衰振動。t（秒）= 0 で 0 から始まり、初速で振れて減衰する二次動作用。
 * freq: Hz, decay: 1/s
 */
export function wobble(t: number, freq: number, decay: number): number {
  if (t <= 0) return 0;
  return Math.sin(2 * Math.PI * freq * t) * Math.exp(-decay * t);
}

/** 減衰振動（cos 版）：t=0 で 1、反動の残り揺れ */
export function ring(t: number, freq: number, decay: number): number {
  if (t <= 0) return 1;
  return Math.cos(2 * Math.PI * freq * t) * Math.exp(-decay * t);
}

function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

/** 決定論的な1次元バリューノイズ（-1..1） */
export function noise1(seed: number, t: number): number {
  const i = Math.floor(t);
  const fr = t - i;
  const u = fr * fr * (3 - 2 * fr);
  const a = hash(i + seed * 1000.13);
  const b = hash(i + 1 + seed * 1000.13);
  return (a + (b - a) * u) * 2 - 1;
}

/** 決定論的な乱数 0..1 */
export function rand(seed: number): number {
  return hash(seed * 17.31 + 3.7);
}
