import layouts from "../data/glyph-layouts.json";

/**
 * typography/glyph-layouts.json の文字アウトライン。
 * フォント座標は y-up。ワードSVGでは親に translate(offsetX, baseline) scale(1,-1)、
 * 各グリフに translate(x, 0) が掛かる。ここではワード座標（y-down）へ変換して扱う。
 */
export type GlyphData = {
  id: string;
  character: string;
  d: string;
  x: number;
  advance: number;
  bounds: [number, number, number, number];
};

export type WordData = {
  text: string;
  font: string;
  viewBox: [number, number, number, number];
  baseline: number;
  offsetX: number;
  glyphs: GlyphData[];
};

export type WordId = keyof typeof layouts.words;

export function wordData(id: WordId): WordData {
  return layouts.words[id] as unknown as WordData;
}

export type Box = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  cx: number;
  cy: number;
  w: number;
  h: number;
};

/** ワード座標（y-down、ワードSVGの viewBox 空間）でのグリフ外接矩形 */
export function glyphBox(id: WordId, i: number): Box {
  const w = wordData(id);
  const g = w.glyphs[i];
  const [x0, y0, x1, y1] = g.bounds;
  const left = w.offsetX + g.x + x0;
  const right = w.offsetX + g.x + x1;
  const top = w.baseline - y1;
  const bottom = w.baseline - y0;
  return {
    left,
    right,
    top,
    bottom,
    cx: (left + right) / 2,
    cy: (top + bottom) / 2,
    w: right - left,
    h: bottom - top,
  };
}

/** 正規化アンカー（0..1、y-down）をフォント単位（y-up）のピボットへ */
export function glyphPivot(id: WordId, i: number, anchor: [number, number]): [number, number] {
  const g = wordData(id).glyphs[i];
  const [x0, y0, x1, y1] = g.bounds;
  return [x0 + anchor[0] * (x1 - x0), y1 - anchor[1] * (y1 - y0)];
}

/** パス d を、ピボットを原点とする y-down ローカル座標へ置く transform */
export function glyphLocalTransform(id: WordId, i: number, anchor: [number, number]): string {
  const [pu, pv] = glyphPivot(id, i, anchor);
  return `scale(1,-1) translate(${-pu},${-pv})`;
}

export type PlacedGlyph = {
  index: number;
  character: string;
  /** 画面座標での外接矩形 */
  box: Box;
  /** 画面座標でのアンカー位置 */
  ax: number;
  ay: number;
};

export type WordLayout = {
  id: WordId;
  scale: number;
  anchor: [number, number];
  glyphs: PlacedGlyph[];
  box: Box;
};

function unionBox(boxes: Box[]): Box {
  const left = Math.min(...boxes.map((b) => b.left));
  const right = Math.max(...boxes.map((b) => b.right));
  const top = Math.min(...boxes.map((b) => b.top));
  const bottom = Math.max(...boxes.map((b) => b.bottom));
  return { left, right, top, bottom, cx: (left + right) / 2, cy: (top + bottom) / 2, w: right - left, h: bottom - top };
}

/**
 * ワード全体の可視範囲を (cx, cy) に中央揃えし、高さ height または幅 width に合わせる。
 * 各グリフのアンカー（既定は中心）を画面座標で返す。
 */
export function layoutWord(
  id: WordId,
  opts: { cx: number; cy: number; height?: number; width?: number; scale?: number; anchor?: [number, number] },
): WordLayout {
  const w = wordData(id);
  const anchor = opts.anchor ?? [0.5, 0.5];
  const raw = w.glyphs.map((_, i) => glyphBox(id, i));
  const u = unionBox(raw);
  const scale = opts.scale ?? (opts.width !== undefined ? opts.width / u.w : (opts.height ?? 400) / u.h);
  const map = (x: number, y: number): [number, number] => [
    opts.cx + (x - u.cx) * scale,
    opts.cy + (y - u.cy) * scale,
  ];
  const glyphs = raw.map((b, i) => {
    const [l, t] = map(b.left, b.top);
    const [r, bt] = map(b.right, b.bottom);
    const box: Box = { left: l, right: r, top: t, bottom: bt, cx: (l + r) / 2, cy: (t + bt) / 2, w: r - l, h: bt - t };
    return {
      index: i,
      character: w.glyphs[i].character,
      box,
      ax: l + anchor[0] * (r - l),
      ay: t + anchor[1] * (bt - t),
    };
  });
  return { id, scale, anchor, glyphs, box: unionBox(glyphs.map((g) => g.box)) };
}

/** d を M ごとの部分パスへ分割（O の外形と内側の穴など） */
export function subpaths(d: string): string[] {
  return d
    .split(/(?=M)/)
    .map((s) => s.trim())
    .filter(Boolean);
}
