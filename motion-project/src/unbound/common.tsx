import { ACCENT, Glyph, INK } from "../components/Glyph";
import type { WordId } from "../lib/glyphs";

export { ACCENT, INK };

/** 承認済み試作と同じ文字スケール（字高 ≈ 453–470px） */
export const SCALE = 0.659;
export const BASE_Y = 790;
export const CX = 960;
export const CY = 540;

export type G = {
  word: WordId;
  index: number;
  x: number;
  y: number;
  sx?: number;
  sy?: number;
  rotate?: number;
  skewX?: number;
  scale?: number;
  anchor?: [number, number];
  clip?: string;
  fill?: string;
  opacity?: number;
  key: string;
};

export function draw(g: G, fill = INK) {
  const el = (
    <Glyph
      key={g.key}
      word={g.word}
      index={g.index}
      x={g.x}
      y={g.y}
      scale={g.scale ?? SCALE}
      sx={g.sx}
      sy={g.sy}
      rotate={g.rotate}
      skewX={g.skewX}
      anchor={g.anchor ?? [0.5, 1]}
      fill={g.fill ?? fill}
      opacity={g.opacity}
    />
  );
  return g.clip ? (
    <g key={g.key} clipPath={`url(#${g.clip})`}>
      {el}
    </g>
  ) : (
    el
  );
}

/** clipPath の子として同じ形を置く（<g> は使えないので Glyph を直接） */
export function clipShape(g: G, part: "all" | "inner" = "all") {
  return (
    <Glyph
      key={`c${g.key}`}
      word={g.word}
      index={g.index}
      part={part}
      x={g.x}
      y={g.y}
      scale={g.scale ?? SCALE}
      sx={g.sx}
      sy={g.sy}
      rotate={g.rotate}
      skewX={g.skewX}
      anchor={g.anchor ?? [0.5, 1]}
    />
  );
}

/** 2Dカメラ：世界座標の点 (cx, cy) を画面中央へ、倍率 z */
export type Cam = { cx: number; cy: number; z: number };

export function toScreen(cam: Cam, x: number, y: number): [number, number] {
  return [CX + (x - cam.cx) * cam.z, CY + (y - cam.cy) * cam.z];
}

export function camGlyph(cam: Cam, g: G): G {
  const [x, y] = toScreen(cam, g.x, g.y);
  return { ...g, x, y, scale: (g.scale ?? SCALE) * cam.z };
}

/** O（condensed）の穴：フォント単位の実測（tools 参照）。下端アンカーからの中心オフセットとサイズ */
export const O_COUNTER = { dy: -356, w: 122, h: 398 };
