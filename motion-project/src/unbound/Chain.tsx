import { Logo } from "../components/Logo";
import { Stage } from "../components/Photo";
import { ease, keys, lerp, progress, wobble } from "../lib/anim";
import { makePath, RAIL_MAIN, RAIL_SECONDARY } from "../lib/paths";
import { ACCENT, BASE_Y, CX, CY, INK, camGlyph, draw, toScreen, type Cam, type G } from "./common";
import { CHAIN_CAM, HOLD_H, HOLD_SPREAD, HOLD_W } from "./Opening";

/**
 * 506–844：連鎖。H の回転が O を動かし、O が L を倒し、L が D を倒す。
 * 倒れた文字は床へ潰れて線になり、その先からレールが伸びる。
 * 6分割ロゴがレール上に降りて組み上がり、先を転がる O を追う（カメラはロゴを追従）。
 * 終点で O が立ち、ロゴは O の穴を抜け、カメラも穴へ潜る（→ portal）。
 */

const K = 2.6;
const SX = HOLD_SPREAD[0] - HOLD_W[0] / 2 - 200; // 床の始点
const PIVOT = HOLD_SPREAD.map((x, i) => x + HOLD_W[i] / 2);
const R0X = PIVOT[3] + HOLD_H[3] + 40; // 倒れた D の先からレール

function railD(src: string, withFloor: boolean): string {
  const nums = src.match(/-?\d+(\.\d+)?/g)!.map(Number);
  const cmds = src.match(/[MCS]/g)!;
  const pts: string[] = [];
  for (let i = 0; i < nums.length; i += 2) {
    const x = R0X + (nums[i] + 100) * K;
    const y = BASE_Y + (nums[i + 1] - 790) * K;
    pts.push(`${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  // M p0 C p1 p2 p3 S p4 p5
  const body = `${cmds[0]}${pts[0]} C${pts[1]} ${pts[2]} ${pts[3]} S${pts[4]} ${pts[5]}`;
  return withFloor ? `M${SX} ${BASE_Y} L${pts[0]} ${body.slice(1 + pts[0].length)}` : body;
}

const TRACK = makePath(railD(RAIL_MAIN, true));
const RAIL_ONLY = railD(RAIL_MAIN, false);
const RAIL_2 = railD(RAIL_SECONDARY, false);
const S_R0 = R0X - SX;
const { S_APEX, S_DIP } = (() => {
  let apex = 0;
  let minY = Infinity;
  for (let s = S_R0; s < TRACK.length; s += 10) {
    const p = TRACK.atLength(s);
    if (p.y < minY) {
      minY = p.y;
      apex = s;
    }
  }
  let dip = apex;
  let maxY = -Infinity;
  for (let s = apex; s < TRACK.length; s += 10) {
    const p = TRACK.atLength(s);
    if (p.y > maxY) {
      maxY = p.y;
      dip = s;
    }
  }
  return { S_APEX: apex, S_DIP: dip };
})();
const S_END = TRACK.length;

function onTrack(s: number, lift: number): [number, number] {
  const p = TRACK.atLength(s);
  const a = (p.angle * Math.PI) / 180;
  return [p.x + Math.sin(a) * lift, p.y - Math.cos(a) * lift];
}

/* O：楕円の転がり。中心の高さは回転角に応じた半幅 */
const O_A = HOLD_W[1] / 2;
const O_B = HOLD_H[1] / 2;
const O_R = (O_A + O_B) / 2;
function halfExtent(deg: number) {
  const t = (deg * Math.PI) / 180;
  return Math.sqrt((O_A * Math.sin(t)) ** 2 + (O_B * Math.cos(t)) ** 2);
}

const O_HIT = 517;
const L_HIT = 530;
const D_HIT = 540;
export const O_ROLL = 572;
export const ROLL = 619;
export const DIVE_START = 806;
const O_REST_X = HOLD_SPREAD[1] + 222;

function oState(f: number): { x: number; y: number; rot: number; s: number } {
  if (f < O_ROLL) {
    const dx = f < L_HIT ? 250 * progress(f, O_HIT, L_HIT) : lerp(250, 222, progress(f, L_HIT, L_HIT + 10, ease.out));
    const rot = ((dx / O_R) * 180) / Math.PI;
    return { x: HOLD_SPREAD[1] + dx, y: BASE_Y - halfExtent(rot), rot, s: O_REST_X - SX };
  }
  const s0 = O_REST_X - SX;
  const s = keys(f, [O_ROLL, 600, 690, 745, 790], [s0, S_R0 + 260, S_APEX + 620, S_DIP + 1000, S_END - 40], ease.inOut);
  const rot0 = ((222 / O_R) * 180) / Math.PI;
  let rot = rot0 + (((s - s0) / O_R) * 180) / Math.PI;
  rot = lerp(rot, Math.round(rot / 180) * 180, progress(f, 782, 796, ease.out));
  const [x, y] = onTrack(s, halfExtent(rot));
  return { x, y, rot, s };
}

const LOGO_SIZE = 360; // 世界座標での表示幅（400単位）
const LOGO_R = (155 / 400) * LOGO_SIZE;
const S_L0 = HOLD_SPREAD[1] - SX - 60;
const DROP = [578, 584, 590, 596, 602, 608];

function logoState(f: number) {
  // 区間ごとの速度差：登りは減速、頂点で溜め、下りは加速
  let s: number;
  if (f < ROLL) s = S_L0;
  else if (f < 682) s = lerp(S_L0, S_APEX - 90, progress(f, ROLL, 682, ease.inOut));
  else if (f < 712) s = lerp(S_APEX - 90, S_APEX + 60, progress(f, 682, 712, (t) => 0.5 - 0.5 * Math.cos(Math.PI * t)));
  else if (f < 760) s = lerp(S_APEX + 60, S_DIP + 300, progress(f, 712, 760, ease.in));
  else s = lerp(S_DIP + 300, S_END - 620, progress(f, 760, 800, ease.out));
  const [x, y] = onTrack(s, LOGO_R);
  const rot = ((s - S_L0) / LOGO_R) * (180 / Math.PI);
  return { x, y, s, rot };
}

export function chainCam(f: number): Cam {
  const lg = logoState(f);
  const lagged = logoState(f - 5);
  const o = oState(f);
  const assemble: Cam = { cx: lerp(lg.x, o.x, 0.45), cy: BASE_Y - 260, z: 0.62 };
  if (f < 556) return CHAIN_CAM;
  if (f < ROLL) return blendCam(CHAIN_CAM, assemble, progress(f, 556, 596, ease.inOut));
  const follow: Cam = {
    cx: lagged.x + 260,
    cy: lagged.y - 120,
    z: keys(f, [ROLL, 662, 700, 728, 770, 800], [0.62, 0.5, 0.36, 0.5, 0.78, 0.62], ease.inOut),
  };
  if (f < DIVE_START) return blendCam(assemble, follow, progress(f, ROLL, ROLL + 24, ease.inOut));
  // O の穴へ潜る：穴の幅（約80px）が画面幅を十分に超える倍率まで
  const end = logoState(DIVE_START);
  const fromCam: Cam = { cx: end.x + 260, cy: end.y - 120, z: 0.62 };
  const oc = counterCenter(o);
  const p = progress(f, DIVE_START, 826, ease.inOut);
  const z = lerp(0.62, 1.2, p) * (1 + 40 * progress(f, 816, 840, ease.inQuart));
  return { cx: lerp(fromCam.cx, oc[0], p), cy: lerp(fromCam.cy, oc[1], p), z };
}

function blendCam(a: Cam, b: Cam, t: number): Cam {
  return { cx: lerp(a.cx, b.cx, t), cy: lerp(a.cy, b.cy, t), z: lerp(a.z, b.z, t) };
}

function counterCenter(o: { x: number; y: number; rot: number }): [number, number] {
  // O の bbox 中心と穴の中心はほぼ一致（O_COUNTER 実測：穴中心 = bbox中心 -12単位）
  return [o.x, o.y + 0];
}

function domino(f: number, start: number, len = 16): number {
  const p = progress(f, start, start + len);
  return 90 * p * p;
}

export function Chain({ f }: { f: number }) {
  if (f < 506 || f >= 846) return null;
  const cam = chainCam(f);
  const o = oState(f);
  const items: G[] = [];

  // H, L, D：右下角を支点に倒れ、床へ潰れる
  const fall = [
    { i: 0, start: 506, flat: 524, lean: -5 * (1 - progress(f, 506, 510)) },
    { i: 2, start: L_HIT, flat: 546, lean: 0 },
    { i: 3, start: D_HIT, flat: 556, lean: 0 },
  ];
  for (const d of fall) {
    const flat = progress(f, d.flat, d.flat + 14, ease.in);
    if (flat >= 1) continue;
    const theta = Math.max(d.lean, domino(f, d.start));
    const bounce = f >= d.flat ? 3 * wobble((f - d.flat) / 30, 3, 8) : 0;
    items.push({ key: `c${d.i}`, word: "hold", index: d.i, x: PIVOT[d.i], y: BASE_Y, rotate: theta - bounce, sx: 1 - 0.96 * flat, anchor: [1, 1] });
  }

  const lg = logoState(f);
  const darken = progress(f, 814, 830, ease.in);
  const oG: G = { key: "cO", word: "hold", index: 1, x: o.x, y: o.y, rotate: o.rot, anchor: [0.5, 0.5], fill: mix(INK, "#050505", darken) };

  // ロゴ：上から1パーツずつ落ちて噛み合う → 転がる → 終点で O の穴へ跳ぶ
  const jump = progress(f, 800, 822, ease.in);
  const oc = counterCenter(o);
  const lx = lerp(lg.x, oc[0], jump);
  const ly = lerp(lg.y, oc[1], jump) - 260 * Math.sin(Math.PI * jump);
  const logoScale = lerp(1, 0.18, jump);
  const [sx, sy] = toScreen(cam, lx, ly);
  const segment = (i: number) => {
    const t = DROP[i];
    const p = progress(f, t - 10, t, ease.in);
    const settle = f >= t ? 10 * wobble((f - t) / 30, 3, 7) : 0;
    return {
      dy: -(1 - p) * 1400 / (LOGO_SIZE / 400) + settle,
      rotate: (i % 2 ? 1 : -1) * 50 * (1 - p),
      opacity: f >= t - 10 ? 1 : 0,
    };
  };

  // レール：倒れた D の先から伸びる
  const draw01 = progress(f, 560, 612, ease.inOut);
  const railStroke = Math.max(2, 12 * cam.z);
  const railTransform = `translate(${CX - cam.cx * cam.z},${CY - cam.cy * cam.z}) scale(${cam.z})`;
  const floorL = toScreen(cam, SX - 600, BASE_Y + 4);
  const floorR = toScreen(cam, R0X, BASE_Y + 4);
  const logoBehind = jump > 0.55;

  const logoEl = f >= DROP[0] - 10 && jump < 1 && (
    <Logo x={sx} y={sy} size={LOGO_SIZE * cam.z * logoScale} rotate={f >= ROLL ? lg.rot : 0} pose="loop" segment={segment} />
  );

  return (
    <Stage>
      <line x1={floorL[0]} y1={floorL[1]} x2={floorR[0]} y2={floorR[1]} stroke={INK} strokeWidth={Math.max(2, 3 * cam.z)} opacity={1 - darken} />
      <g transform={railTransform} opacity={1 - darken}>
        <path d={RAIL_2} fill="none" stroke={INK} strokeWidth={railStroke / cam.z / 4} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - progress(f, 570, 624, ease.inOut)} />
        <path d={RAIL_ONLY} fill="none" stroke={ACCENT} strokeWidth={railStroke / cam.z} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw01} />
      </g>
      {/* 床に潰れた瞬間のオレンジの接触線 */}
      {[0, 2, 3].map((i) => {
        const t = i === 0 ? 524 : i === 2 ? 546 : 556;
        const a = progress(f, t, t + 4, ease.out) * (1 - progress(f, t + 8, t + 20));
        if (a <= 0) return null;
        const p0 = toScreen(cam, PIVOT[i], BASE_Y + 2);
        const p1 = toScreen(cam, PIVOT[i] + HOLD_H[i], BASE_Y + 2);
        return <line key={i} x1={p0[0]} y1={p0[1]} x2={p1[0]} y2={p1[1]} stroke={ACCENT} strokeWidth={10 * cam.z} opacity={a} />;
      })}
      {items.map((g) => draw(camGlyph(cam, g)))}
      {logoBehind && logoEl}
      {draw(camGlyph(cam, oG))}
      {!logoBehind && logoEl}
    </Stage>
  );
}

function mix(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(lerp(v, pb[i], t))).join(",")})`;
}

