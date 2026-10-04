import { Logo } from "../components/Logo";
import { Stage } from "../components/Photo";
import { Glyph } from "../components/Glyph";
import { ease, lerp, noise1, progress, wobble } from "../lib/anim";
import { layoutWord } from "../lib/glyphs";
import { posePoints, segmentCentroid } from "../lib/logo";
import { ACCENT, CX, INK } from "./common";
import { BURST, unboundO } from "./Release";

/**
 * 1912–2250：O が6パーツに割れて散り（1912–1968）、
 * 1969 から1片ずつ戻って開いた輪へ。最後の1片は少し遅れて 2138 で噛み合う。
 * UNBOUND（wide）が基線の切れ目から立ち上がり、最後の約2秒は静止。
 */
const FINAL: [number, number] = [CX, 405];
const FINAL_SIZE = 380;
const K = FINAL_SIZE / 400;
export const LOCK_FINAL = 2138;

const SCATTER: Array<[number, number, number]> = [
  [1640, 230, 140],
  [1730, 690, -110],
  [1180, 930, 80],
  [560, 960, -150],
  [190, 640, 120],
  [330, 170, -90],
];
/** 戻る順（開口部の反対側から）。segment 0 が最後 */
const ORDER = [3, 2, 4, 1, 5];
const RETURN_GAP = 21;
const LAST = 0;

function finalCentroid(i: number): [number, number] {
  const c = segmentCentroid(posePoints("loop", i));
  return [FINAL[0] + (c[0] - 200) * K, FINAL[1] + (c[1] - 200) * K];
}

type SegState = { x: number; y: number; rot: number; scale: number };

function segState(f: number, i: number): SegState {
  const o = unboundO();
  const kO = o.height / 400 / 0.78; // 輪の外径 ≈ O の高さ
  const c = segmentCentroid(posePoints("loop", i));
  const start: SegState = { x: o.cx + (c[0] - 200) * kO, y: o.cy + (c[1] - 200) * kO, rot: 0, scale: kO / K };
  const [sx, sy, sr] = SCATTER[i];
  const b = progress(f, BURST, BURST + 26, ease.outExpo);
  const drift = (f - BURST) / 30;
  let s: SegState = {
    x: lerp(start.x, sx, b) + 14 * noise1(i + 3, drift * 0.8) * b,
    y: lerp(start.y, sy, b) + 14 * noise1(i + 13, drift * 0.8) * b,
    rot: lerp(0, sr, b) + 6 * drift * (i % 2 ? 1 : -1),
    scale: lerp(start.scale, 0.85, b),
  };
  const [fx, fy] = finalCentroid(i);
  if (i === LAST) {
    // 近づいて少し外れた位置で浮き、遅れて噛み合う
    const near = progress(f, 2054, 2076, ease.outQuint);
    const hover: SegState = { x: fx + 70 + 6 * Math.sin(f / 7), y: fy - 55 + 5 * Math.cos(f / 9), rot: 24 + 3 * Math.sin(f / 8), scale: 1 };
    s = mixState(s, hover, near);
    const lock = progress(f, LOCK_FINAL - 9, LOCK_FINAL, ease.inQuart);
    s = mixState(s, { x: fx, y: fy, rot: 0, scale: 1 }, lock);
    if (f >= LOCK_FINAL) {
      const t = (f - LOCK_FINAL) / 30;
      s = { x: fx - 6 * wobble(t, 2.4, 5), y: fy + 4 * wobble(t, 2.4, 5), rot: -3 * wobble(t, 2, 4), scale: 1 };
    }
    return s;
  }
  const k = ORDER.indexOf(i);
  const t0 = 1969 + k * RETURN_GAP;
  // 溜め（離れる）→ 速い移動 → 行き過ぎて戻る
  const away = progress(f, t0, t0 + 6, ease.out) * (1 - progress(f, t0 + 6, t0 + 9));
  const dx = s.x - fx;
  const dy = s.y - fy;
  const d = Math.hypot(dx, dy) || 1;
  s = { ...s, x: s.x + (dx / d) * 40 * away, y: s.y + (dy / d) * 40 * away };
  const go = progress(f, t0 + 6, t0 + 16, ease.in);
  s = mixState(s, { x: fx, y: fy, rot: 0, scale: 1 }, go);
  if (f >= t0 + 16) {
    const t = (f - t0 - 16) / 30;
    s = { x: fx - (dx / d) * 10 * wobble(t, 2.2, 5), y: fy - (dy / d) * 10 * wobble(t, 2.2, 5), rot: 4 * wobble(t, 1.8, 4), scale: 1 };
  }
  return s;
}

function mixState(a: SegState, b: SegState, t: number): SegState {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), rot: lerp(a.rot, b.rot, t), scale: lerp(a.scale, b.scale, t) };
}

const WIDE = layoutWord("unbound-wide", { cx: CX, cy: 0, height: 118, anchor: [0.5, 1] });
const WIDE_BASE = 820;
const ANSWER = layoutWord("answer", { cx: CX, cy: 930, height: 40, anchor: [0.5, 0.5] });

export function Resolve({ f }: { f: number }) {
  if (f < BURST) return null;
  const segment = (i: number) => {
    const s = segState(f, i);
    const [fx, fy] = finalCentroid(i);
    const flash = i === LAST ? progress(f, LOCK_FINAL, LOCK_FINAL + 1) * (1 - progress(f, LOCK_FINAL + 3, LOCK_FINAL + 16)) : 0;
    return { dx: (s.x - fx) / K, dy: (s.y - fy) / K, rotate: s.rot, scale: s.scale, fill: flash > 0.5 ? ACCENT : INK };
  };
  const rise = (i: number) => progress(f, 2092 + i * 4, 2104 + i * 4, ease.outExpo);
  const slotOpen = progress(f, 2084, 2094, ease.outExpo) * (1 - progress(f, 2128, 2140));
  const underline = progress(f, LOCK_FINAL, LOCK_FINAL + 14, ease.outExpo);
  const answer = progress(f, 2160, 2182, ease.out);
  const shock = progress(f, LOCK_FINAL, LOCK_FINAL + 14, ease.out);

  return (
    <Stage>
      <defs>
        <clipPath id="wide-slot" clipPathUnits="userSpaceOnUse">
          <rect x={-100} y={-100} width={2200} height={WIDE_BASE + 102} />
        </clipPath>
      </defs>
      {/* 噛み合った瞬間の衝撃の輪 */}
      {f >= LOCK_FINAL && shock < 1 && (
        <circle cx={FINAL[0]} cy={FINAL[1]} r={lerp(150, 330, shock)} fill="none" stroke={ACCENT} strokeWidth={lerp(6, 1, shock)} opacity={1 - shock} />
      )}
      <Logo x={FINAL[0]} y={FINAL[1]} size={FINAL_SIZE} pose="loop" segment={segment} />
      <g clipPath="url(#wide-slot)">
        {WIDE.glyphs.map((g) => (
          <Glyph key={g.index} word="unbound-wide" index={g.index} x={g.ax} y={WIDE_BASE + (1 - rise(g.index)) * 190} scale={WIDE.scale} anchor={[0.5, 1]} sy={lerp(1.25, 1, rise(g.index))} />
        ))}
      </g>
      {slotOpen > 0 && <rect x={CX - (WIDE.box.w / 2 + 30) * slotOpen} y={WIDE_BASE + 12} width={(WIDE.box.w + 60) * slotOpen} height={3} fill={INK} opacity={0.6} />}
      <rect x={CX - 95 * underline} y={WIDE_BASE + 34} width={190 * underline} height={7} fill={ACCENT} />
      {answer > 0 &&
        ANSWER.glyphs.map((g) => (
          <Glyph key={`a${g.index}`} word="answer" index={g.index} x={g.ax} y={g.ay + 10 * (1 - answer)} scale={ANSWER.scale} anchor={[0.5, 0.5]} opacity={answer * 0.85} />
        ))}
    </Stage>
  );
}
