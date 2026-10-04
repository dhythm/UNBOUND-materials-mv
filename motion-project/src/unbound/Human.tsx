import { AbsoluteFill, Img, staticFile } from "remotion";
import { Stage } from "../components/Photo";
import { Glyph } from "../components/Glyph";
import { ease, keys, noise1, progress, ring, wobble } from "../lib/anim";
import { layoutWord } from "../lib/glyphs";
import { CLIP, PRESENTER, SRC_H, SRC_W, clipFrameFile, srcToComp } from "../lib/presenter";
import hand from "../data/presenter-hand.json";
import { ACCENT, INK } from "./common";

/**
 * 1238–1462：人物。受領した実動画の RGBA 連番（30fps）を P0 から再生し、声を一度だけ同期。
 * 問いの文字は実際の発声の塊（実測）に合わせて出る。1行目は人物の後ろ、2行目は前。
 * 手が上がると指先から AI が生まれ、1回目の伸展（clip 154）で押され、
 * 最大伸展（clip 170）で弾かれて I を画面端へ押し付ける → 次の BREAK へ。
 */
export const P0 = 1240;
export const HEAD_POINT: [number, number] = srcToComp(418, 85);
export const CONTACT_1 = P0 + CLIP.firstReach;
export const CONTACT_2 = P0 + CLIP.maxReach;
const I_HIT = CONTACT_2 + 6;
const EDGE_HIT = CONTACT_2 + 14;

/** 指先の画面座標（実測値。手が上がる前は null） */
export function fingertip(local: number): [number, number] | null {
  const i = Math.max(0, Math.min(hand.handX.length - 1, Math.round(local)));
  if (i < CLIP.handRise + 4) return null;
  return srcToComp(hand.handX[i], hand.handY[i]);
}

/* 問い：発声の塊（実測 RMS）に合わせた各文字の出現（クリップ内フレーム） */
const Q1_TIMES = [34, 37, 41, 59, 61, 63, 66, 68];
const Q2_TIMES = [72, 74, 77, 80, 84, 89, 92, 95, 98, 101];
const Q1 = layoutWord("question-1", { cx: 140 + (7949 * 0.118) / 2, cy: 455, scale: 0.118 });
const Q2 = layoutWord("question-2", { cx: 130 + (8996 * 0.1) / 2, cy: 975, scale: 0.1 });

const AI = layoutWord("ai", { cx: 0, cy: 0, scale: 0.6 });
const A_W = AI.glyphs[0].box.w;
const I_W = AI.glyphs[1].box.w;
const CONTACT_PT = srcToComp(663, 185);
const A_LEFT = CONTACT_PT[0] - 16;
const A_CY = CONTACT_PT[1] + 10;
const I_LEFT = A_LEFT + A_W + 44;

export function Human({ f }: { f: number }) {
  const local = f - P0;
  const reveal = progress(f, 1236, 1256, ease.outExpo);
  const irisR = 2300 * reveal;

  const dim = 1 - 0.6 * progress(local, 112, 132, ease.inOut);
  const qShift = -40 * progress(local, 112, 140, ease.inOut);

  // AI：指先から生まれる
  const birthA = progress(local, 128, 146, ease.outBack);
  const birthI = progress(local, 136, 152, ease.outBack);
  const t1 = (local - CLIP.firstReach) / 30;
  const t2 = (local - CLIP.maxReach) / 30;
  const dxA =
    (local >= CLIP.firstReach ? 26 * wobble(t1, 1.4, 4.5) : 0) +
    (local >= CLIP.maxReach ? keys(local, [CLIP.maxReach, CLIP.maxReach + 6, CLIP.maxReach + 24], [0, 170, 60], ease.out) : 0);
  const sqA = (local >= CLIP.firstReach ? 0.12 * ring(t1, 3, 7) : 0) + (local >= CLIP.maxReach ? 0.18 * ring(t2, 2.6, 5) : 0);
  const iHit = local >= I_HIT - P0;
  const edgeTravel = 1890 - (I_LEFT + I_W);
  const dxI = iHit ? edgeTravel * progress(f, I_HIT, EDGE_HIT, ease.in) : 0;
  const pinned = f >= EDGE_HIT;
  const tension = pinned ? progress(f, EDGE_HIT, 1462) : 0;
  const sqI = pinned ? 0.34 * (1 - Math.exp(-(f - EDGE_HIT) / 3)) + 0.04 * tension : 0;
  const shake = (seed: number) => 3 * tension * noise1(seed, f * 1.3);

  const aX = A_LEFT + dxA + shake(1);
  const iRight = I_LEFT + I_W + dxI;

  const presenter = (
    <Img
      src={staticFile(clipFrameFile(local))}
      style={{ position: "absolute", left: PRESENTER.x, top: PRESENTER.y, width: SRC_W * PRESENTER.scale, height: SRC_H * PRESENTER.scale }}
    />
  );

  const q = (layout: typeof Q1, word: "question-1" | "question-2", times: number[], front: boolean) =>
    layout.glyphs.map((g, i) => {
      const p = progress(local, times[i], times[i] + 6, ease.outExpo);
      if (p <= 0) return null;
      const props = {
        word,
        index: i,
        x: g.box.cx + qShift,
        y: g.box.bottom + (1 - p) * 40,
        scale: layout.scale,
        sy: 0.6 + 0.4 * p,
        anchor: [0.5, 1] as [number, number],
      };
      return (
        <g key={`${word}${i}`} opacity={p * dim}>
          {front && <Glyph {...props} fill="#050505" stroke="#050505" strokeWidth={10} />}
          <Glyph {...props} fill={INK} />
        </g>
      );
    });

  return (
    <AbsoluteFill style={{ clipPath: reveal < 1 ? `circle(${irisR}px at ${HEAD_POINT[0]}px ${HEAD_POINT[1]}px)` : undefined }}>
      {/* 後ろ：問いの1行目と AI */}
      <Stage>
        {q(Q1, "question-1", Q1_TIMES, false)}
        {birthA > 0 && (
          <Glyph word="ai" index={0} x={aX} y={A_CY + shake(2)} scale={AI.scale * birthA} sx={1 - sqA} sy={1 + 0.3 * sqA} anchor={[0, 0.5]} skewX={-8 * sqA} />
        )}
        {birthI > 0 && (
          <Glyph word="ai" index={1} x={iRight + shake(3)} y={A_CY} scale={AI.scale * birthI} sx={1 - sqI} sy={1 + 0.2 * sqI} anchor={[1, 0.5]} />
        )}
        {/* 押し付けられた端の接触線 */}
        {pinned && <rect x={1890} y={A_CY - 230} width={10} height={460 * progress(f, EDGE_HIT, EDGE_HIT + 4, ease.out)} fill={ACCENT} />}
        {/* 指先が A に触れる瞬間の接触点 */}
        {[CLIP.firstReach, CLIP.maxReach].map((c) => {
          const a = progress(local, c, c + 2) * (1 - progress(local, c + 4, c + 12));
          return a > 0 ? <circle key={c} cx={CONTACT_PT[0] + 2} cy={CONTACT_PT[1]} r={10 + 30 * progress(local, c, c + 12)} fill="none" stroke={ACCENT} strokeWidth={4} opacity={a} /> : null;
        })}
      </Stage>
      {presenter}
      {/* 前：問いの2行目（暗い縁取りで衣装から分離） */}
      <Stage>{q(Q2, "question-2", Q2_TIMES, true)}</Stage>
    </AbsoluteFill>
  );
}
