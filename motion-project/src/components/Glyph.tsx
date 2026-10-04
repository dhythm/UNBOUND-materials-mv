
import { glyphLocalTransform, subpaths, wordData, type WordId } from "../lib/glyphs";

export const INK = "#F5F3EC";
export const BG = "#050505";
export const ACCENT = "#FF4D24";

export type GlyphPose = {
  /** 画面座標でのアンカー位置 */
  x: number;
  y: number;
  /** フォント単位→px の倍率 */
  scale: number;
  sx?: number;
  sy?: number;
  rotate?: number;
  skewX?: number;
  /** 正規化アンカー（0..1、y-down）。回転・拡縮の支点 */
  anchor?: [number, number];
};

export function glyphTransform(p: GlyphPose): string {
  const sx = p.scale * (p.sx ?? 1);
  const sy = p.scale * (p.sy ?? 1);
  return `translate(${p.x},${p.y}) rotate(${p.rotate ?? 0}) skewX(${p.skewX ?? 0}) scale(${sx},${sy})`;
}

/** グリフの部分パス：all=全体、outer=最初の輪郭、inner=穴（2番目以降の輪郭） */
export type GlyphPart = "all" | "outer" | "inner";

export function glyphD(word: WordId, index: number, part: GlyphPart = "all"): string {
  const d = wordData(word).glyphs[index].d;
  if (part === "all") return d;
  const parts = subpaths(d);
  return part === "outer" ? parts[0] : parts.slice(1).join(" ");
}

/**
 * 文字アウトラインを個別の位置・回転・拡縮で描く（SVG 内で使用）。
 * clipPath の子にも置けるよう、<g> で包まず単一の <path> に変換をまとめる。
 */
export function Glyph(
  props: GlyphPose & {
    word: WordId;
    index: number;
    part?: GlyphPart;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    opacity?: number;
  },
) {
  const anchor = props.anchor ?? [0.5, 0.5];
  return (
    <path
      d={glyphD(props.word, props.index, props.part)}
      transform={`${glyphTransform({ ...props, anchor })} ${glyphLocalTransform(props.word, props.index, anchor)}`}
      fill={props.fill ?? INK}
      opacity={props.opacity}
      stroke={props.stroke}
      strokeWidth={props.strokeWidth}
      vectorEffect={props.stroke ? "non-scaling-stroke" : undefined}
    />
  );
}
