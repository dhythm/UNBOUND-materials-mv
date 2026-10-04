import { svgPathProperties } from "svg-path-properties";

export type PathPoint = { x: number; y: number; /** 接線角（度） */ angle: number };

export type PathSampler = {
  d: string;
  length: number;
  /** t = 0..1（弧長パラメータ） */
  at: (t: number) => PathPoint;
  /** 弧長 s（px） */
  atLength: (s: number) => PathPoint;
};

const cache = new Map<string, PathSampler>();

/** 純粋JSの弧長サンプラー（S/T コマンドの反射制御点も正しく扱う） */
export function makePath(d: string): PathSampler {
  const hit = cache.get(d);
  if (hit) return hit;
  const props = new svgPathProperties(d);
  const length = props.getTotalLength();
  const atLength = (s: number): PathPoint => {
    const c = Math.min(length, Math.max(0, s));
    const p = props.getPointAtLength(c);
    const tan = props.getTangentAtLength(c);
    return { x: p.x, y: p.y, angle: (Math.atan2(tan.y, tan.x) * 180) / Math.PI };
  };
  const sampler: PathSampler = { d, length, at: (t) => atLength(t * length), atLength };
  cache.set(d, sampler);
  return sampler;
}

/** 素材 vectors/*.svg のパス */
export const RAIL_MAIN = "M-100 790 C350 790 460 210 900 210 S1420 890 2020 440";
export const RAIL_SECONDARY = "M-100 814 C350 814 460 234 900 234 S1420 914 2020 464";
export const RIBBON_CENTERLINE = "M-100 740 C300 1060 410 40 920 350 S1350 930 2040 160";
