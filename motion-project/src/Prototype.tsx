
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { ACCENT, BG, Glyph, INK } from "./components/Glyph";
import { Logo } from "./components/Logo";
import { Photo, Stage, photoScale, photoToScreen, type PhotoView } from "./components/Photo";
import { ease, keys, lerp, noise1, progress, ring, wobble } from "./lib/anim";
import { layoutWord, type WordId } from "./lib/glyphs";
import { posePoints, segmentCentroid, type PoseBlend } from "./lib/logo";

/**
 * 12秒（360f）の試作。
 *  0–2s   ロゴが逆ねじれで力を溜め、解放して6パーツが飛散、輪の穴から PRESS へ。
 *  2–7s   PRESS を上から押し潰す（右から順に接触）→ 反動 → PUSH へ組み替え → 押し出しの連鎖。
 *  7–12s  H が HOLD へ着地 → O の穴へ潜り写真 → リボンの輪郭を窓にして接写へ。
 */
export const PROTO_FRAMES = 360;

const CX = 960;
const SCALE = 0.659; // 文字高 ≈ 470px
const BASE_Y = 790; // 文字の下端（アンカー）

const PRESS = layoutWord("press", { cx: CX, cy: 555, scale: SCALE, anchor: [0.5, 1] });
const PUSH_RAW = layoutWord("push", { cx: CX, cy: 555, scale: SCALE, anchor: [0.5, 1] });
const SPREAD = 56;
const PUSH = PUSH_RAW.glyphs.map((g) => ({ ...g, ax: g.ax + (g.index - 1.5) * SPREAD }));
const PAN = 2200;
const HOLD = layoutWord("hold", { cx: CX + PAN, cy: 555, scale: SCALE, anchor: [0.5, 1] });
const LETTER_H = PRESS.glyphs[0].box.h;

type G = {
  word: WordId;
  index: number;
  x: number;
  y: number;
  sx?: number;
  sy?: number;
  rotate?: number;
  scale?: number;
  anchor?: [number, number];
  clip?: string;
  key: string;
};

function draw(g: G, fill = INK) {
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
      anchor={g.anchor ?? [0.5, 1]}
      fill={fill}
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

/* ───────────── 0–2.8s：着火 ───────────── */

const RELEASE = 50;
const ORDER_DELAY = [0, 2, 4, 5, 3, 1];

function ignitionPose(f: number) {
  const wind = progress(f, 8, 44, ease.inOut);
  const pose: PoseBlend =
    f < RELEASE
      ? { from: "loop", to: "pressure", t: wind }
      : { from: "pressure", to: "release", t: progress(f, RELEASE, RELEASE + 5, ease.snap) };
  const rot = f < RELEASE ? 38 * wind : keys(f, [RELEASE, RELEASE + 8, 90], [38, -16, -30], ease.out);
  const zoom =
    f < RELEASE
      ? 1 - 0.14 * wind
      : lerp(0.86, 1.04, progress(f, RELEASE, RELEASE + 4, ease.out)) * (1 + 12 * progress(f, 53, 74, ease.inExpo));
  return { wind, pose, rot, zoom };
}

function flyDistance(f: number, i: number): number {
  const s = 54 + ORDER_DELAY[i] * 1.2;
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
  if (f > 84) return null;
  const st = ignitionPose(f);
  const tremble = f < RELEASE ? 3.4 * progress(f, 26, 44) + (f >= 44 ? 1.6 : 0) : 0;
  const segment = (i: number): SegM => {
    const appear = 1 + i * 2;
    const counter =
      f < RELEASE ? -26 * st.wind * (i % 2 ? 1 : 0.7) : keys(f, [RELEASE, RELEASE + 7], [-26 * (i % 2 ? 1 : 0.7), 0], ease.out);
    const [cx, cy] = segmentCentroid(posePoints(st.pose, i));
    const dir = Math.atan2(cy - 200, cx - 200);
    const d = flyDistance(f, i);
    const s0 = 54 + ORDER_DELAY[i] * 1.2;
    const spin = (i % 2 ? 1 : -1) * (70 + 25 * i) * progress(f, s0, 80, ease.in);
    return {
      dx: Math.cos(dir) * d + tremble * noise1(i + 1, f * 0.9),
      dy: Math.sin(dir) * d + tremble * noise1(i + 11, f * 0.9),
      rotate: counter + spin,
      scale: progress(f, appear, appear + 6, ease.outBack),
      opacity: f >= appear ? 1 : 0,
    };
  };
  const gapA = gapPoint(st.pose, 5, segment(5));
  const gapB = gapPoint(st.pose, 0, segment(0));
  const reach = progress(f, 8, 18, ease.out) * (1 - progress(f, RELEASE, RELEASE + 6, ease.out));
  const mid: [number, number] = [(gapA[0] + gapB[0]) / 2, (gapA[1] + gapB[1]) / 2 + 12 * st.wind];

  const k = (230 / 400) * st.zoom;
  const minD = Math.min(...[0, 1, 2, 3, 4, 5].map((i) => flyDistance(f, i)));
  const holeR = f < 52 ? 0 : (86 + minD) * k;

  return (
    <>
      <defs>
        <clipPath id="ign-hole" clipPathUnits="userSpaceOnUse">
          <circle cx={CX} cy={540} r={holeR} />
        </clipPath>
      </defs>
      {holeR > 0 && (
        <g clipPath="url(#ign-hole)">
          {PRESS.glyphs.map((g) => {
            const s = lerp(0.36, 1, progress(f, 52 + g.index * 1.2, 76 + g.index * 1.5, ease.outQuint));
            return draw({ key: `ig${g.index}`, word: "press", index: g.index, x: CX + (g.ax - CX) * s, y: 540 + (g.ay - 540) * s, scale: SCALE * s });
          })}
        </g>
      )}
      <Logo x={CX} y={540} size={230 * st.zoom} rotate={st.rot} pose={st.pose} segment={segment}>
        {reach > 0 &&
          [gapA, gapB].map((g, n) => (
            <line
              key={n}
              x1={g[0]}
              y1={g[1]}
              x2={g[0] + (mid[0] - g[0]) * reach}
              y2={g[1] + (mid[1] - g[1]) * reach}
              stroke={ACCENT}
              strokeWidth={9}
              strokeLinecap="round"
            />
          ))}
      </Logo>
    </>
  );
}

/* ───────────── 2.8–7s：PRESS → PUSH ───────────── */

const SLAM = 108;
const LIFT = 124;
const FREQ = [2.1, 2.7, 1.8, 2.4, 1.6];
const DECAY = [3.6, 4.4, 3.0, 4.0, 2.8];

/** 押し潰し量 q（正=潰れ、負=伸び）。右から順に接触し、左から順に解放、各文字で揺れの周期が異なる */
function squash(f: number, i: number): number {
  const contact = SLAM + (4 - i);
  const release = LIFT + i;
  if (f < contact) return 0;
  if (f < release) return 0.36 * progress(f, contact, contact + 4, ease.out);
  return 0.36 * ring((f - release) / 30, FREQ[i], DECAY[i]);
}

function pressGlyphs(f: number): G[] {
  const fade = progress(f, 150, 170, ease.inOut);
  const q = PRESS.glyphs.map((g) => squash(f, g.index) * (1 - fade));
  const sx = q.map((v) => 1 + 0.72 * v);
  const bulge = PRESS.glyphs.map((g, i) => g.box.w * (sx[i] - 1));
  // 中央の E から外へ押し出す
  const shift = PRESS.glyphs.map((_, i) => {
    if (i === 2) return 0;
    const sgn = i > 2 ? 1 : -1;
    let s = bulge[2] / 2 + bulge[i] / 2;
    for (let j = Math.min(i, 2) + 1; j < Math.max(i, 2); j++) s += bulge[j];
    return sgn * s;
  });
  // 遅れて残る揺れ：外側の文字だけ傾きが遅れて揺れる
  const sway = (i: number) =>
    i === 0 ? -6 * wobble((f - LIFT - 4) / 30, 1.3, 2.3) : i === 4 ? 6 * wobble((f - LIFT - 6) / 30, 1.1, 2.0) : 0;

  const k = progress(f, 150, 170, ease.inOut);
  const pinch = progress(f, 150, 162, ease.in);
  const out: G[] = [];
  PRESS.glyphs.forEach((g, i) => {
    const base = { key: `pr${i}`, word: "press" as WordId, index: i, y: BASE_Y, sx: sx[i], sy: 1 - q[i], rotate: sway(i) };
    if (i === 0) out.push({ ...base, x: lerp(g.ax + shift[i], PUSH[0].ax, k) });
    if (i === 3) out.push({ ...base, x: lerp(g.ax + shift[i], PUSH[2].ax, k) });
    if (i === 1 || i === 2) {
      if (pinch >= 1) return;
      const mid = lerp(lerp(PRESS.glyphs[0].box.right, PUSH[0].box.right, k), lerp(PRESS.glyphs[3].box.left, PUSH[2].box.left, k), 0.5);
      out.push({ ...base, x: lerp(g.ax + shift[i], mid, pinch), sx: sx[i] * (1 - pinch), sy: (1 - q[i]) * (1 + 0.15 * pinch) });
    }
    if (i === 4) {
      // 基線のスロットへ沈む
      const sink = progress(f, 152, 162, ease.in) * (LETTER_H + 20);
      if (sink < LETTER_H + 20) out.push({ ...base, x: lerp(g.ax + shift[i], PUSH[3].ax, k), y: BASE_Y + sink, clip: "slot" });
    }
  });
  return out;
}

/** PUSH：押し出しの連鎖。P→U→S→H と接触ごとに止まり、潰れて次へ渡す */
const STRIKE = 198;
const CONTACT = [STRIKE, STRIKE + 3, STRIKE + 6, STRIKE + 9];

function pushGlyphs(f: number): G[] {
  const gaps = [0, 1, 2].map((i) => PUSH[i + 1].box.left - PUSH[i].box.right - 6);
  return PUSH.map((g, i) => {
    let x = g.ax;
    if (i < 3) x += gaps[i] * progress(f, CONTACT[i], CONTACT[i] + 3);
    const hit = i > 0 ? CONTACT[i] : -999;
    const qHit = f >= hit ? 0.14 * ring((f - hit) / 30, 3.2, 7) : 0;
    const qOwn = i < 3 && f >= CONTACT[i] + 3 ? 0.1 * ring((f - CONTACT[i] - 3) / 30, 2.6, 6) : 0;
    const q = Math.max(qHit, qOwn);
    const base: G = { key: `pu${i}`, word: "push", index: i, x, y: BASE_Y, sx: 1 - q, sy: 1 + 0.4 * q };
    if (i === 1) {
      const pop = progress(f, 160, 171, ease.outBack);
      if (pop <= 0) return null;
      return { ...base, sx: pop * (1 - q), sy: 0.6 + 0.4 * progress(f, 160, 168, ease.out) };
    }
    if (i === 3) {
      const rise = (1 - progress(f, 160, 172, ease.out)) * (LETTER_H + 20);
      if (f < 160) return null;
      return { ...base, y: BASE_Y + rise, clip: f < 175 ? "slot" : undefined };
    }
    return base;
  }).filter((g): g is G => g !== null);
}

/* ───────────── 7–12s：HOLD → O の穴 → 写真 ───────────── */

const LAUNCH = CONTACT[3];
const DOCK = 234;
const DIVE = 252;

function camX(f: number) {
  return PAN * progress(f, LAUNCH + 2, DOCK + 4, ease.inOut);
}

const O = HOLD.glyphs[1];
const O_CENTER: [number, number] = [O.box.cx, O.box.top + O.box.h * 0.5];

/** 画面写像：パン後に O の穴の中心へ寄る */
function camera(f: number) {
  const z = keys(f, [DIVE - 8, DIVE, DIVE + 40], [1, 0.95, 1], ease.out) * (1 + 30 * progress(f, DIVE, DIVE + 40, ease.inExpo));
  const p = progress(f, DIVE, DIVE + 30, ease.inOut);
  const c: [number, number] = [lerp(O_CENTER[0] - camX(f), CX, p), lerp(O_CENTER[1], 540, p)];
  const map = (x: number, y: number): [number, number] => [c[0] + (x - O_CENTER[0]) * z, c[1] + (y - O_CENTER[1]) * z];
  return { z, map };
}

function holdGlyphs(f: number): G[] {
  const cam = camera(f);
  const out: G[] = [];
  // H：打ち出され、前傾しながら減速して O に着地
  const hp = progress(f, LAUNCH, DOCK, ease.outQuint);
  const hx0 = PUSH[3].ax + 0; // 世界座標
  const hx = lerp(hx0, HOLD.glyphs[0].ax, hp);
  const lean = f < DOCK ? -9 * progress(f, LAUNCH, LAUNCH + 5, ease.out) * (1 - progress(f, DOCK - 8, DOCK)) : 7 * wobble((f - DOCK) / 30, 1.8, 3.5);
  if (f >= LAUNCH) {
    const [x, y] = cam.map(hx, BASE_Y);
    out.push({ key: "hH", word: "hold", index: 0, x, y, scale: SCALE * cam.z, rotate: lean });
  }
  // O L D：着地の衝撃を受けて右へずれ、遅れて揺れる
  HOLD.glyphs.slice(1).forEach((g) => {
    const t = (f - DOCK - g.index) / 30;
    const q = f >= DOCK + g.index ? 0.12 * ring(t, 2.2 + g.index * 0.3, 4) : 0;
    const dx = f >= DOCK ? 22 * wobble(t, 0.9, 3) : 0;
    const [x, y] = cam.map(g.ax + dx, BASE_Y);
    out.push({ key: `h${g.index}`, word: "hold", index: g.index, x, y, scale: SCALE * cam.z, sx: 1 - q, sy: 1 + 0.3 * q });
  });
  return out;
}

/* ───────────── 合成 ───────────── */

const LOOP_IMG: [number, number] = [830, 415];
const LOOP_R: [number, number] = [140, 82];
const LOOP_TILT = 12;
const RIBBON_END = 360;

function photoView(f: number): PhotoView {
  const zoom = keys(f, [DIVE, DIVE + 40, 330, RIBBON_END], [1.22, 1.0, 1.16, 1.3], ease.inOut);
  return { ix: LOOP_IMG[0], iy: LOOP_IMG[1], sx: CX, sy: 540, zoom };
}

export function Prototype() {
  const f = useCurrentFrame();
  const inPress = f >= 76 && f < 176;
  const inPush = f >= 160 && f < DOCK + 30;
  const inHold = f >= LAUNCH && f < DIVE + 42;
  const presses = inPress ? pressGlyphs(f) : [];
  const pushes = inPush ? pushGlyphs(f).filter((g) => !(g.index === 3 && f >= LAUNCH)) : [];
  const pan = camX(f);
  const panned = (g: G): G => ({ ...g, x: g.x - pan });
  const holds = inHold ? holdGlyphs(f) : [];

  // 押し潰しの帯（オレンジ）：上から叩き、浮いて回転し、縦の押し棒になって P を打つ
  const top = BASE_Y - LETTER_H;
  const centerTop = BASE_Y - LETTER_H * (1 - squash(f, 2));
  const barW = PRESS.box.w + 120;
  const barX = keys(f, [150, 182, 186, 194, STRIKE, STRIKE + 10], [CX, PUSH[0].box.left - 70, PUSH[0].box.left - 70, PUSH[0].box.left - 140, PUSH[0].box.left - 13, PUSH[0].box.left - 40], ease.inOut);
  const barYBottom =
    f < SLAM
      ? keys(f, [88, 98, 104, SLAM], [top - 120, top - 120, top - 175, top], (t) => (f >= 104 ? ease.in(t) : ease.out(t)))
      : f < LIFT
        ? centerTop
        : keys(f, [LIFT, LIFT + 9, 150, 182], [centerTop, top - 250, top - 250, BASE_Y - LETTER_H / 2 + 12], ease.out);
  const barRot = keys(f, [SLAM - 2, SLAM + 4], [-2.4, 0]) + 90 * progress(f, 152, 182, ease.inOut);
  const barLen = lerp(barW * progress(f, 86, 98, ease.outExpo), LETTER_H + 70, progress(f, 152, 182, ease.inOut));
  const barOn = f >= 86 && f < DOCK;

  // 写真が文字内部に一瞬入る（叩いた直後、上から満ち、下から抜ける）
  const photoIn = f >= SLAM + 1 && f < LIFT + 4;
  const fillTop = BASE_Y - LETTER_H - 30;
  const wipeIn = lerp(fillTop, BASE_Y + 30, progress(f, SLAM + 1, SLAM + 5, ease.out));
  const wipeOut = lerp(BASE_Y + 30, fillTop, progress(f, LIFT - 1, LIFT + 4, ease.in));

  // O の穴 → 写真
  const cam = camera(f);
  const oGlyph = holds.find((g) => g.key === "h1");
  const diveWindow = f >= DIVE - 2 && f < DIVE + 42;
  const photoFull = f >= DIVE + 40;
  const view = photoView(f);
  const ps = photoScale(view);
  const [lx, ly] = photoToScreen(view, LOOP_IMG[0], LOOP_IMG[1]);
  const draw01 = progress(f, 298, 314, ease.inOut);
  const open = 1 + 14 * progress(f, 320, 350, ease.inExpo);
  const macroOn = f >= 320;
  const ringFade = 1 - progress(f, 340, 350);

  return (
    <AbsoluteFill style={{ background: BG }}>
      <Stage>
        <defs>
          <clipPath id="slot" clipPathUnits="userSpaceOnUse">
            <rect x={-4000} y={-4000} width={10000} height={4000 + BASE_Y + 13} />
          </clipPath>
          <clipPath id="press-photo" clipPathUnits="userSpaceOnUse">
            {photoIn && presses.map((g) => <Glyph key={g.key} word="press" index={g.index} x={g.x} y={g.y} scale={SCALE} sx={g.sx} sy={g.sy} rotate={g.rotate} anchor={[0.5, 1]} />)}
          </clipPath>
          <clipPath id="o-counter" clipPathUnits="userSpaceOnUse">
            {diveWindow && oGlyph && (
              <Glyph word="hold" index={1} part="inner" x={oGlyph.x} y={oGlyph.y} scale={SCALE * cam.z} sx={oGlyph.sx} sy={oGlyph.sy} anchor={[0.5, 1]} />
            )}
          </clipPath>
          <clipPath id="loop-window" clipPathUnits="userSpaceOnUse">
            <ellipse cx={lx} cy={ly} rx={LOOP_R[0] * ps * open} ry={LOOP_R[1] * ps * open} transform={`rotate(${LOOP_TILT} ${lx} ${ly})`} />
          </clipPath>
        </defs>
        <Ignition f={f} />
        {presses.map((g) => draw(g, photoIn ? "#2a2a28" : INK))}
        {photoIn &&
          presses.map((g) => (
            <Glyph key={`ol${g.key}`} word="press" index={g.index} x={g.x} y={g.y} scale={SCALE} sx={g.sx} sy={g.sy} rotate={g.rotate} anchor={[0.5, 1]} fill="none" stroke={INK} strokeWidth={3} />
          ))}
        {pushes.map((g) => draw(panned(g)))}
        {holds.map((g) => draw(g))}
        {/* 基線のスロット（S が沈み H が上がる切れ目） */}
        {f >= 150 && f < 176 && (
          <rect
            x={PUSH[3].box.left - 30}
            y={BASE_Y + 10}
            width={(PUSH[3].box.w + 60) * progress(f, 150, 155, ease.out) * (1 - progress(f, 171, 176))}
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
            transform={`translate(${f < 150 ? CX : barX - pan},${barYBottom}) rotate(${barRot})`}
          />
        )}
      </Stage>
      {photoIn && (
        <AbsoluteFill style={{ clipPath: `polygon(0 ${f < LIFT - 1 ? fillTop : wipeOut}px, 100% ${f < LIFT - 1 ? fillTop : wipeOut}px, 100% ${f < LIFT - 1 ? wipeIn : BASE_Y + 30}px, 0 ${f < LIFT - 1 ? wipeIn : BASE_Y + 30}px)` }}>
          <Photo name="01-pressure" view={{ ix: 830, iy: 430, sx: CX, sy: 560, zoom: 1.12 }} clipId="press-photo" brightness={1.7} contrast={1.15} />
        </AbsoluteFill>
      )}
      {diveWindow && !photoFull && <Photo name="01-pressure" view={view} clipId="o-counter" brightness={1.1} />}
      {photoFull && <Photo name="01-pressure" view={view} />}
      {macroOn && (
        <Photo
          name="03-macro"
          view={{ ix: 836, iy: 470, sx: lx, sy: ly, zoom: keys(f, [320, 360], [1.0, 1.12], ease.out), rotate: -4 }}
          clipId="loop-window"
        />
      )}
      {photoFull && f < 350 && (
        <Stage>
          <ellipse
            cx={lx}
            cy={ly}
            rx={LOOP_R[0] * ps * open}
            ry={LOOP_R[1] * ps * open}
            transform={`rotate(${LOOP_TILT} ${lx} ${ly})`}
            fill="none"
            stroke={ACCENT}
            strokeWidth={6}
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - draw01}
            opacity={ringFade}
          />
        </Stage>
      )}
      <ProtoSound />
    </AbsoluteFill>
  );
}

/* ───────────── 音：接触と停止の点だけ ───────────── */

const SFX: Array<{ at: number; name: string; volume: number; cut?: number }> = [
  { at: 1, name: "snap-click", volume: 0.5 },
  { at: 8, name: "tension-rise", volume: 0.55, cut: 44 },
  { at: RELEASE, name: "impact-low", volume: 0.7 },
  { at: RELEASE, name: "release-sweep", volume: 0.5 },
  { at: 80, name: "snap-click", volume: 0.6 },
  { at: SLAM, name: "impact-low", volume: 0.75 },
  { at: SLAM, name: "metal-flex", volume: 0.42 },
  { at: 166, name: "snap-click", volume: 0.6 },
  { at: STRIKE, name: "impact-low", volume: 0.6 },
  { at: CONTACT[1], name: "snap-click", volume: 0.45 },
  { at: CONTACT[2], name: "snap-click", volume: 0.5 },
  { at: CONTACT[3], name: "snap-click", volume: 0.6 },
  { at: DOCK, name: "impact-low", volume: 0.7 },
  { at: DIVE, name: "tension-rise", volume: 0.45, cut: 40 },
  { at: DIVE + 40, name: "release-sweep", volume: 0.45 },
  { at: 320, name: "metal-flex", volume: 0.3 },
];

function ProtoSound() {
  return (
    <>
      {SFX.map((s, i) => (
        <Sequence key={i} from={s.at} durationInFrames={s.cut ?? 90} layout="none">
          <Audio
            src={staticFile(`audio/${s.name}.wav`)}
            volume={(t) => s.volume * (s.cut ? 1 - progress(t, s.cut - 6, s.cut) : 1)}
          />
        </Sequence>
      ))}
    </>
  );
}
