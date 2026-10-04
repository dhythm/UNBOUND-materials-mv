import { Logo } from "../components/Logo";
import { Photo, Stage } from "../components/Photo";
import { Glyph } from "../components/Glyph";
import { ease, keys, lerp, noise1, progress, ring, wobble } from "../lib/anim";
import { layoutWord } from "../lib/glyphs";
import { posePoints, segmentCentroid, type PoseBlend } from "../lib/logo";
import { ACCENT, BASE_Y, CX, CY, INK, SCALE, camGlyph, clipShape, draw, toScreen, type Cam, type G } from "./common";

/**
 * 0–506：着火（ignition）と圧縮（pressure）。
 * 承認済みの試作（src/Prototype.tsx）の運動を、128BPM の拍へ配置し直したもの。
 * HOLD は横からの万力で締め、解放の反動で文字間が開き、次の連鎖の配置になる。
 */

const PRESS = layoutWord("press", { cx: CX, cy: 555, scale: SCALE, anchor: [0.5, 1] });
const PUSH_RAW = layoutWord("push", { cx: CX, cy: 555, scale: SCALE, anchor: [0.5, 1] });
const PUSH = PUSH_RAW.glyphs.map((g) => ({ ...g, ax: g.ax + (g.index - 1.5) * 56 }));
export const PAN = 2200;
export const HOLD = layoutWord("hold", { cx: CX + PAN, cy: 555, scale: SCALE, anchor: [0.5, 1] });
const LETTER_H = PRESS.glyphs[0].box.h;

/** 万力の解放後の配置（連鎖のドミノ間隔） */
const DOMINO_GAP = 250;
export const HOLD_SPREAD: number[] = (() => {
  const w = HOLD.glyphs.map((g) => g.box.w);
  const total = w.reduce((a, b) => a + b, 0) + DOMINO_GAP * 3;
  let x = CX + PAN - total / 2;
  return w.map((wi) => {
    const c = x + wi / 2;
    x += wi + DOMINO_GAP;
    return c;
  });
})();
export const HOLD_W = HOLD.glyphs.map((g) => g.box.w);
export const HOLD_H = HOLD.glyphs.map((g) => g.box.h);
export const CHAIN_CAM: Cam = { cx: CX + PAN, cy: CY, z: 0.55 };

/* ───────── 着火 0–168 ───────── */

export const RELEASE = 112;
const ORDER_DELAY = [0, 2, 4, 5, 3, 1];
const LOGO_SIZE = 360;

function ignitionPose(f: number) {
  // 二段の溜め：拍で半分ねじり、ゆっくり締め上げる
  const wind = keys(f, [26, 54, 60, 100], [0, 0.3, 0.42, 1], ease.inOut);
  const pose: PoseBlend =
    f < RELEASE
      ? { from: "loop", to: "pressure", t: wind }
      : { from: "pressure", to: "release", t: progress(f, RELEASE, RELEASE + 5, ease.snap) };
  const rot = f < RELEASE ? 40 * wind : keys(f, [RELEASE, RELEASE + 8, 152], [40, -16, -30], ease.out);
  const zoom =
    f < RELEASE
      ? 1 - 0.16 * wind
      : lerp(0.84, 1.05, progress(f, RELEASE, RELEASE + 4, ease.out)) * (1 + 10 * progress(f, 115, 137, ease.inExpo));
  return { wind, pose, rot, zoom };
}

function flyDistance(f: number, i: number): number {
  const s = 116 + ORDER_DELAY[i] * 1.2;
  return 900 * progress(f, s, s + 20, ease.inQuart) + 28 * progress(f, RELEASE, RELEASE + 5, ease.out);
}

type SegM = { dx: number; dy: number; rotate: number; scale: number; opacity: number };

function gapPoint(pose: PoseBlend, i: number, m: SegM): [number, number] {
  const p = posePoints(pose, i);
  const [a, b] = i === 5 ? [p[3], p[4]] : [p[0], p[7]];
  const [cx, cy] = segmentCentroid(p);
  const r = (m.rotate * Math.PI) / 180;
  const x = ((a[0] + b[0]) / 2 - cx) * m.scale;
  const y = ((a[1] + b[1]) / 2 - cy) * m.scale;
  return [cx + m.dx + x * Math.cos(r) - y * Math.sin(r), cy + m.dy + x * Math.sin(r) + y * Math.cos(r)];
}

function Ignition({ f }: { f: number }) {
  if (f > 150) return null;
  const st = ignitionPose(f);
  const tremble = f < RELEASE ? 4 * progress(f, 70, 100) + (f >= 100 ? 2 : 0) : 0;
  const segment = (i: number): SegM => {
    const appear = 4 + i * 4;
    const counter =
      f < RELEASE ? -26 * st.wind * (i % 2 ? 1 : 0.7) : keys(f, [RELEASE, RELEASE + 7], [-26 * (i % 2 ? 1 : 0.7), 0], ease.out);
    const [cx, cy] = segmentCentroid(posePoints(st.pose, i));
    const dir = Math.atan2(cy - 200, cx - 200);
    const d = flyDistance(f, i);
    const s0 = 116 + ORDER_DELAY[i] * 1.2;
    const spin = (i % 2 ? 1 : -1) * (70 + 25 * i) * progress(f, s0, 142, ease.in);
    // 出現：外から内へ寄って噛み合う
    const pop = progress(f, appear, appear + 8, ease.outBack);
    return {
      dx: Math.cos(dir) * (d + 60 * (1 - pop)) + tremble * noise1(i + 1, f * 0.9),
      dy: Math.sin(dir) * (d + 60 * (1 - pop)) + tremble * noise1(i + 11, f * 0.9),
      rotate: counter + spin + 30 * (1 - pop),
      scale: pop,
      opacity: f >= appear ? 1 : 0,
    };
  };
  const gapA = gapPoint(st.pose, 5, segment(5));
  const gapB = gapPoint(st.pose, 0, segment(0));
  const reach = progress(f, 28, 40, ease.out) * (1 - progress(f, RELEASE, RELEASE + 6, ease.out));
  const mid: [number, number] = [(gapA[0] + gapB[0]) / 2, (gapA[1] + gapB[1]) / 2 + 14 * st.wind];

  const k = (LOGO_SIZE / 400) * st.zoom;
  const minD = Math.min(...[0, 1, 2, 3, 4, 5].map((i) => flyDistance(f, i)));
  const holeR = f < 114 ? 0 : (86 + minD) * k;

  return (
    <>
      <defs>
        <clipPath id="ign-hole" clipPathUnits="userSpaceOnUse">
          <circle cx={CX} cy={CY} r={holeR} />
        </clipPath>
      </defs>
      {holeR > 0 && (
        <g clipPath="url(#ign-hole)">
          {PRESS.glyphs.map((g) => {
            const s = lerp(0.36, 1, progress(f, 114 + g.index * 1.2, 140 + g.index * 1.6, ease.outQuint));
            return draw({ key: `ig${g.index}`, word: "press", index: g.index, x: CX + (g.ax - CX) * s, y: CY + (g.ay - CY) * s, scale: SCALE * s });
          })}
        </g>
      )}
      <Logo x={CX} y={CY} size={LOGO_SIZE * st.zoom} rotate={st.rot} pose={st.pose} segment={segment}>
        {reach > 0 &&
          [gapA, gapB].map((g, n) => (
            <line
              key={n}
              x1={g[0]}
              y1={g[1]}
              x2={g[0] + (mid[0] - g[0]) * reach}
              y2={g[1] + (mid[1] - g[1]) * reach}
              stroke={ACCENT}
              strokeWidth={8}
              strokeLinecap="round"
            />
          ))}
      </Logo>
    </>
  );
}

/* ───────── PRESS → PUSH 150–337 ───────── */

export const SLAM = 197;
export const LIFT = 213;
const FREQ = [2.1, 2.7, 1.8, 2.4, 1.6];
const DECAY = [3.6, 4.4, 3.0, 4.0, 2.8];
const MORPH = 239; // R,E が挟まれ U が出る
export const U_POP = 255;

function squash(f: number, i: number): number {
  const contact = SLAM + (4 - i);
  const release = LIFT + i;
  if (f < contact) return 0;
  if (f < release) return 0.36 * progress(f, contact, contact + 4, ease.out);
  return 0.36 * ring((f - release) / 30, FREQ[i], DECAY[i]);
}

function pressGlyphs(f: number): G[] {
  const fade = progress(f, MORPH, MORPH + 20, ease.inOut);
  const q = PRESS.glyphs.map((g) => squash(f, g.index) * (1 - fade));
  // 着地後の小さな呼吸（静止を硬直させない）
  const breathe = f < SLAM ? 0.012 * wobble((f - 140) / 30, 0.9, 1.4) : 0;
  const sx = q.map((v) => 1 + 0.72 * v);
  const bulge = PRESS.glyphs.map((g, i) => g.box.w * (sx[i] - 1));
  const shift = PRESS.glyphs.map((_, i) => {
    if (i === 2) return 0;
    const sgn = i > 2 ? 1 : -1;
    let s = bulge[2] / 2 + bulge[i] / 2;
    for (let j = Math.min(i, 2) + 1; j < Math.max(i, 2); j++) s += bulge[j];
    return sgn * s;
  });
  const sway = (i: number) =>
    i === 0 ? -6 * wobble((f - LIFT - 4) / 30, 1.3, 2.3) : i === 4 ? 6 * wobble((f - LIFT - 6) / 30, 1.1, 2.0) : 0;

  const k = progress(f, MORPH, MORPH + 20, ease.inOut);
  const pinch = progress(f, MORPH, MORPH + 12, ease.in);
  const out: G[] = [];
  PRESS.glyphs.forEach((g, i) => {
    const base = { key: `pr${i}`, word: "press" as const, index: i, y: BASE_Y, sx: sx[i], sy: 1 - q[i] + breathe * (i % 2 ? 1 : -1), rotate: sway(i) };
    if (i === 0) out.push({ ...base, x: lerp(g.ax + shift[i], PUSH[0].ax, k) });
    if (i === 3) out.push({ ...base, x: lerp(g.ax + shift[i], PUSH[2].ax, k) });
    if (i === 1 || i === 2) {
      if (pinch >= 1) return;
      const mid = lerp(lerp(PRESS.glyphs[0].box.right, PUSH[0].box.right, k), lerp(PRESS.glyphs[3].box.left, PUSH[2].box.left, k), 0.5);
      out.push({ ...base, x: lerp(g.ax + shift[i], mid, pinch), sx: sx[i] * (1 - pinch), sy: (1 - q[i]) * (1 + 0.15 * pinch) });
    }
    if (i === 4) {
      const sink = progress(f, MORPH + 2, MORPH + 12, ease.in) * (LETTER_H + 20);
      if (sink < LETTER_H + 20) out.push({ ...base, x: lerp(g.ax + shift[i], PUSH[3].ax, k), y: BASE_Y + sink, clip: "slot" });
    }
  });
  return out;
}

export const STRIKE = 295;
const CONTACT = [STRIKE, STRIKE + 3, STRIKE + 6, STRIKE + 9];
export const LAUNCH = CONTACT[3];
export const DOCK = 337;

function pushGlyphs(f: number): G[] {
  const gaps = [0, 1, 2].map((i) => PUSH[i + 1].box.left - PUSH[i].box.right - 6);
  return PUSH.map((g, i): G | null => {
    let x = g.ax;
    if (i < 3) x += gaps[i] * progress(f, CONTACT[i], CONTACT[i] + 3);
    const hit = i > 0 ? CONTACT[i] : -999;
    const qHit = f >= hit ? 0.14 * ring((f - hit) / 30, 3.2, 7) : 0;
    const qOwn = i < 3 && f >= CONTACT[i] + 3 ? 0.1 * ring((f - CONTACT[i] - 3) / 30, 2.6, 6) : 0;
    const q = Math.max(qHit, qOwn);
    const base: G = { key: `pu${i}`, word: "push", index: i, x, y: BASE_Y, sx: 1 - q, sy: 1 + 0.4 * q };
    if (i === 1) {
      const pop = progress(f, MORPH + 10, MORPH + 21, ease.outBack);
      if (pop <= 0) return null;
      return { ...base, sx: pop * (1 - q), sy: 0.6 + 0.4 * progress(f, MORPH + 10, MORPH + 18, ease.out) };
    }
    if (i === 3) {
      if (f < MORPH + 10 || f >= LAUNCH) return null;
      const rise = (1 - progress(f, MORPH + 10, MORPH + 22, ease.out)) * (LETTER_H + 20);
      return { ...base, y: BASE_Y + rise, clip: f < MORPH + 25 ? "slot" : undefined };
    }
    return base;
  }).filter((g): g is G => g !== null);
}

function camX(f: number) {
  return PAN * progress(f, LAUNCH + 2, DOCK + 4, ease.inOut);
}

/* ───────── HOLD 337–506：着地 → 万力 → 解放（間隔が開く） ───────── */

const VISE_IN = 352;
const VISE_CLOSE = 380;
const VISE_PEAK = 424;
export const VISE_RELEASE = 450;

export function holdCam(f: number): Cam {
  const z = keys(f, [VISE_RELEASE, VISE_RELEASE + 40], [1, 0.55], ease.inOut);
  return { cx: CX + camX(f), cy: lerp(CY, CY, 0), z };
}

function viseSqueeze(f: number): number {
  if (f >= VISE_RELEASE) return 0;
  return 0.22 * progress(f, VISE_CLOSE, VISE_PEAK, ease.in) + (f >= VISE_PEAK ? 0.012 * Math.sin((f - VISE_PEAK) * 1.7) : 0);
}

/** 世界座標の HOLD（H は打ち出しから着地まで） */
export function holdWorld(f: number): G[] {
  const out: G[] = [];
  const hp = progress(f, LAUNCH, DOCK, ease.outQuint);
  const s = viseSqueeze(f);
  const center = CX + PAN;
  const tremble = f >= VISE_CLOSE && f < VISE_RELEASE ? 2.2 * progress(f, VISE_CLOSE, VISE_RELEASE) : 0;
  HOLD.glyphs.forEach((g, i) => {
    // 万力で中心へ寄せる → 解放で開いた配置へ、反動の揺れは文字ごとに異なる
    const squeezedX = center + (g.ax - center) * (1 - 0.9 * s);
    const rel = f >= VISE_RELEASE ? ring((f - VISE_RELEASE - i) / 30, 1.3 + 0.25 * i, 4.2) : 1;
    let x = f >= VISE_RELEASE ? HOLD_SPREAD[i] + (center + (g.ax - center) * (1 - 0.9 * 0.22) - HOLD_SPREAD[i]) * rel : squeezedX;
    let sx = 1 - s;
    let sy = 1 + 0.25 * s;
    if (f >= VISE_RELEASE) {
      sx = 1 - 0.22 * rel * (rel > 0 ? 1 : 0.6);
      sy = 1 + 0.25 * 0.22 * rel;
    }
    let rotate = 0;
    if (i === 0) {
      if (f < DOCK) {
        x = lerp(PUSH[3].ax, g.ax, hp);
        rotate = -9 * progress(f, LAUNCH, LAUNCH + 5, ease.out) * (1 - progress(f, DOCK - 8, DOCK));
      } else rotate = 7 * wobble((f - DOCK) / 30, 1.8, 3.5);
      // 次の連鎖へ：後ろへ溜める
      rotate += -5 * progress(f, 492, 505, ease.out);
    } else if (f >= DOCK && f < VISE_CLOSE) {
      const t = (f - DOCK - i) / 30;
      const q = f >= DOCK + i ? 0.12 * ring(t, 2.2 + i * 0.3, 4) : 0;
      x += 22 * wobble(t, 0.9, 3);
      sx = 1 - q;
      sy = 1 + 0.3 * q;
    }
    out.push({
      key: `h${i}`,
      word: "hold",
      index: i,
      x: x + tremble * noise1(i + 40, f * 0.8),
      y: BASE_Y,
      sx,
      sy,
      rotate: rotate + tremble * 0.3 * noise1(i + 50, f * 0.7),
    });
  });
  return out;
}

export function Opening({ f }: { f: number }) {
  if (f >= 506) return null;
  const inPress = f >= 138 && f < MORPH + 26;
  const inPush = f >= MORPH + 8 && f < DOCK + 30;
  const presses = inPress ? pressGlyphs(f) : [];
  const pan = camX(f);
  const pushes = inPush ? pushGlyphs(f).map((g) => ({ ...g, x: g.x - pan })) : [];
  const cam = holdCam(f);
  const holds = f >= LAUNCH ? holdWorld(f).map((g) => camGlyph(cam, g)) : [];

  // オレンジの帯：叩く→浮く→縦の押し棒→ P を打つ
  const top = BASE_Y - LETTER_H;
  const centerTop = BASE_Y - LETTER_H * (1 - squash(f, 2));
  const barW = PRESS.box.w + 120;
  const pl = PUSH[0].box.left;
  const barX = keys(f, [MORPH, 271, 279, 289, STRIKE, STRIKE + 10], [CX, pl - 70, pl - 70, pl - 150, pl - 13, pl - 40], ease.inOut);
  const barYBottom =
    f < SLAM
      ? keys(f, [177, 187, 192, SLAM], [top - 120, top - 120, top - 180, top], (t) => (f >= 192 ? ease.in(t) : ease.out(t)))
      : f < LIFT
        ? centerTop
        : keys(f, [LIFT, LIFT + 9, MORPH, 271], [centerTop, top - 250, top - 250, BASE_Y - LETTER_H / 2 + 12], ease.out);
  const barRot = keys(f, [SLAM - 2, SLAM + 4], [-2.4, 0]) + 90 * progress(f, MORPH + 2, 271, ease.inOut);
  const barLen = lerp(barW * progress(f, 175, 187, ease.outExpo), LETTER_H + 70, progress(f, MORPH + 2, 271, ease.inOut));
  const barOn = f >= 175 && f < DOCK;

  // 叩いた直後、写真が文字に満ちて抜ける
  const photoIn = f >= SLAM + 1 && f < LIFT + 4;
  const fillTop = BASE_Y - LETTER_H - 30;
  const wipeIn = lerp(fillTop, BASE_Y + 30, progress(f, SLAM + 1, SLAM + 5, ease.out));
  const wipeOut = lerp(BASE_Y + 30, fillTop, progress(f, LIFT - 1, LIFT + 4, ease.in));
  const band = f < LIFT - 1 ? [fillTop, wipeIn] : [wipeOut, BASE_Y + 30];

  // 万力

  const hw = holdWorld(f);
  const leftEdge = Math.min(...hw.map((g, i) => g.x - (HOLD_W[i] * (g.sx ?? 1)) / 2)) - 16;
  const rightEdge = Math.max(...hw.map((g, i) => g.x + (HOLD_W[i] * (g.sx ?? 1)) / 2)) + 16;
  const enter = progress(f, VISE_IN, VISE_IN + 22, ease.outQuint);
  const leave = progress(f, VISE_RELEASE, VISE_RELEASE + 14, ease.in);
  const vL = toScreen(cam, lerp(leftEdge - 900, leftEdge, enter) - 1400 * leave, BASE_Y - LETTER_H / 2);
  const vR = toScreen(cam, lerp(rightEdge + 900, rightEdge, enter) + 1400 * leave, BASE_Y - LETTER_H / 2);
  const viseOn = f >= VISE_IN && f < VISE_RELEASE + 16;
  const vh = (LETTER_H + 90) * cam.z;

  // O の穴の写真（圧縮のピーク付近）
  const oG = holds.find((g) => g.key === "h1");
  const oWindow = f >= 392 && f < VISE_RELEASE + 4 && oG;
  const [ocx, ocy] = oG ? [oG.x, oG.y - 356 * SCALE * cam.z * (oG.sy ?? 1)] : [0, 0];
  const oOpen = progress(f, 392, 400, ease.out) * (1 - progress(f, VISE_RELEASE, VISE_RELEASE + 4));

  return (
    <>
      <Stage>
        <defs>
          <clipPath id="slot" clipPathUnits="userSpaceOnUse">
            <rect x={-4000} y={-4000} width={10000} height={4000 + BASE_Y + 13} />
          </clipPath>
          <clipPath id="press-photo" clipPathUnits="userSpaceOnUse">
            {photoIn && presses.map((g) => clipShape(g))}
          </clipPath>
          <clipPath id="hold-o" clipPathUnits="userSpaceOnUse">
            {oWindow && oG && clipShape(oG, "inner")}
          </clipPath>
        </defs>
        <Ignition f={f} />
        {presses.map((g) => draw(g, photoIn ? "#2a2a28" : INK))}
        {photoIn &&
          presses.map((g) => (
            <Glyph key={`ol${g.key}`} word="press" index={g.index} x={g.x} y={g.y} scale={SCALE} sx={g.sx} sy={g.sy} rotate={g.rotate} anchor={[0.5, 1]} fill="none" stroke={INK} strokeWidth={3} />
          ))}
        {pushes.map((g) => draw(g))}
        {holds.map((g) => draw(g))}
        {f >= MORPH && f < MORPH + 26 && (
          <rect
            x={PUSH[3].box.left - 30}
            y={BASE_Y + 10}
            width={(PUSH[3].box.w + 60) * progress(f, MORPH, MORPH + 5, ease.out) * (1 - progress(f, MORPH + 21, MORPH + 26))}
            height={6}
            fill={ACCENT}
          />
        )}
        {barOn && (
          <rect
            x={-barLen / 2}
            y={-24}
            width={barLen}
            height={24}
            fill={ACCENT}
            transform={`translate(${f < MORPH ? CX : barX - pan},${barYBottom}) rotate(${barRot})`}
          />
        )}
        {viseOn &&
          [vL, vR].map((p, n) => (
            <rect key={n} x={n ? p[0] : p[0] - 24 * cam.z} y={p[1] - vh / 2} width={24 * cam.z} height={vh} fill={ACCENT} />
          ))}
        {/* 解放の床線：連鎖のレールへ引き継ぐ */}
        {f >= VISE_RELEASE + 10 && (
          <line
            x1={toScreen(cam, HOLD_SPREAD[0] - 300, 0)[0]}
            x2={lerp(toScreen(cam, HOLD_SPREAD[0] - 300, 0)[0], toScreen(cam, HOLD_SPREAD[3] + 260, 0)[0], progress(f, VISE_RELEASE + 10, VISE_RELEASE + 34, ease.outExpo))}
            y1={toScreen(cam, 0, BASE_Y + 4)[1]}
            y2={toScreen(cam, 0, BASE_Y + 4)[1]}
            stroke={INK}
            strokeWidth={3}
          />
        )}
      </Stage>
      {photoIn && (
        <div style={{ position: "absolute", inset: 0, clipPath: `polygon(0 ${band[0]}px, 100% ${band[0]}px, 100% ${band[1]}px, 0 ${band[1]}px)` }}>
          <Photo name="01-pressure" view={{ ix: 830, iy: 430, sx: CX, sy: 560, zoom: 1.12 }} clipId="press-photo" brightness={1.7} contrast={1.15} />
        </div>
      )}
      {oWindow && (
        <Photo
          name="03-macro"
          view={{ ix: lerp(700, 980, progress(f, 392, 452)), iy: 470, sx: ocx, sy: ocy, zoom: 0.42, rotate: 70 }}
          clipId="hold-o"
          opacity={oOpen}
          brightness={1.25}
        />
      )}
    </>
  );
}
