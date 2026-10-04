import { AbsoluteFill } from "remotion";
import { Photo, Stage } from "../components/Photo";
import { Glyph } from "../components/Glyph";
import { ease, keys, lerp, noise1, progress, ring } from "../lib/anim";
import { layoutWord, wordData } from "../lib/glyphs";
import { makePath, RAIL_MAIN, RIBBON_CENTERLINE } from "../lib/paths";
import { ACCENT, CX, CY, INK, clipShape, draw, type G } from "./common";
import { Human } from "./Human";
import { srcToComp } from "../lib/presenter";

/**
 * 1462–1969：解放。人物の押す手の高さで画面が裂け（BREAK）、分割が広がって流線になり、
 * 写真を収めた FLOW と、曲線を流れて巻き取られる文字の帯へ。帯の輪が UNBOUND の O の穴に重なり、
 * そこから大きく引いて全体を見せ、密度を上げて溜め、O が6パーツに割れる（→ resolve）。
 */
export const BREAK_AT = 1462;
const CUT_Y = srcToComp(663, 185)[1];
const CUT_X = srcToComp(663, 185)[0];
const LOCK = 1477;
const SPREAD_START = 1504;
const STREAK = 1547;
export const FLOW_AT = 1575;
const COIL = 1684;
export const UNB_AT = 1744;
const UNB_LAND = 1800;
const SQUEEZE = 1870;
export const BURST = 1912;

const BREAK_L = layoutWord("break", { cx: CX, cy: CUT_Y - 110, scale: 0.72, anchor: [0.5, 0.5] });
const BRK_TOP = BREAK_L.box.top;
const BRK_BOT = BREAK_L.box.bottom;

/* ───────── BREAK ───────── */

function BreakScene({ f }: { f: number }) {
  if (f < BREAK_AT || f >= FLOW_AT + 4) return null;
  const cutDraw = progress(f, BREAK_AT, BREAK_AT + 4, ease.outExpo);
  const split = progress(f, BREAK_AT + 3, BREAK_AT + 24, ease.in);
  const arrive = progress(f, BREAK_AT + 3, LOCK, ease.outQuint);
  // 分割が広がる：拍ごとに段階的に大きくずれる
  const amp = keys(f, [SPREAD_START, 1512, 1518, 1526, 1533, STREAK, 1575], [0, 150, 60, 330, 140, 520, 2600], (t) => t);
  const stretch = 1 + 9 * progress(f, STREAK, 1575, ease.inExpo);
  const streakFade = 1 - progress(f, 1562, 1576);
  const strips = 7;
  const pattern = [-1, 0.55, -0.35, 0.9, -0.65, 0.3, -0.85];
  const stripH = (BRK_BOT - BRK_TOP + 40) / strips;

  const glyphs = (dx: number, key: string): G[] =>
    BREAK_L.glyphs.map((g, i) => {
      const q = f >= LOCK ? 0.1 * ring((f - LOCK - i) / 30, 2.2 + 0.35 * i, 4.5) : 0;
      return { key: `${key}${i}`, word: "break", index: i, x: g.ax + dx, y: g.ay, scale: BREAK_L.scale, anchor: [0.5, 0.5], sx: 1 + 0.6 * q, sy: 1 - q };
    });

  const humanOn = f < BREAK_AT + 26;
  const seam = progress(f, LOCK, LOCK + 2) * (1 - progress(f, LOCK + 4, LOCK + 16));

  return (
    <>
      <Stage>
        <defs>
          <clipPath id="brk-top" clipPathUnits="userSpaceOnUse">
            <rect x={-3000} y={-3000} width={8000} height={3000 + CUT_Y} />
          </clipPath>
          <clipPath id="brk-bot" clipPathUnits="userSpaceOnUse">
            <rect x={-3000} y={CUT_Y} width={8000} height={3000} />
          </clipPath>
          {Array.from({ length: strips }, (_, k) => (
            <clipPath key={k} id={`brk-s${k}`} clipPathUnits="userSpaceOnUse">
              <rect x={-3000} y={BRK_TOP - 20 + k * stripH} width={8000} height={stripH + 0.5} />
            </clipPath>
          ))}
        </defs>
        {f < SPREAD_START ? (
          <>
            <g clipPath="url(#brk-top)">{glyphs(1500 * (1 - arrive), "bt").map((g) => draw(g))}</g>
            <g clipPath="url(#brk-bot)">{glyphs(-1500 * (1 - arrive), "bb").map((g) => draw(g))}</g>
          </>
        ) : (
          Array.from({ length: strips }, (_, k) => (
            <g key={k} clipPath={`url(#brk-s${k})`} opacity={streakFade}>
              <g transform={`translate(${CX + pattern[k] * amp} 0) scale(${stretch} 1) translate(${-CX} 0)`}>{glyphs(0, `s${k}`).map((g) => draw(g))}</g>
            </g>
          ))
        )}
        {f >= SPREAD_START &&
          Array.from({ length: strips - 1 }, (_, k) => {
            const y = BRK_TOP - 20 + (k + 1) * stripH;
            const a = progress(f, SPREAD_START, SPREAD_START + 6) * streakFade;
            return <line key={k} x1={0} x2={1920} y1={y} y2={y} stroke={ACCENT} strokeWidth={2} opacity={a * 0.8} />;
          })}
        <line x1={lerp(CUT_X, 0, cutDraw)} x2={lerp(CUT_X, 1920, cutDraw)} y1={CUT_Y} y2={CUT_Y} stroke={ACCENT} strokeWidth={lerp(6, 14, seam)} opacity={f < SPREAD_START ? 1 : 0} />
      </Stage>
      {humanOn && (
        <>
          <AbsoluteFill style={{ clipPath: `polygon(0 0, 100% 0, 100% ${CUT_Y}px, 0 ${CUT_Y}px)`, transform: `translateX(${-2300 * split}px)` }}>
            <Human f={f} />
          </AbsoluteFill>
          <AbsoluteFill style={{ clipPath: `polygon(0 ${CUT_Y}px, 100% ${CUT_Y}px, 100% 100%, 0 100%)`, transform: `translateX(${2300 * split}px)` }}>
            <Human f={f} />
          </AbsoluteFill>
        </>
      )}
    </>
  );
}

/* ───────── FLOW ───────── */

const FLOW_L = layoutWord("flow", { cx: CX, cy: CY, scale: 0.78, anchor: [0.5, 0.5] });
const BAND_PATH = makePath(RIBBON_CENTERLINE);
const RAIL = makePath(RAIL_MAIN);
const BAND_SCALE = 0.19;
const FLOW_ADV = wordData("flow").glyphs.map((g) => g.advance * BAND_SCALE + 18);
const BAND_N = 30;

function bandPoint(u: number, coil: number, f: number): { x: number; y: number; angle: number } {
  // 曲線（リボンの中心線）と円（輪）を同じパラメータで補間する
  const L = BAND_PATH.length;
  const s = ((u % L) + L) % L;
  const p = BAND_PATH.atLength(s);
  const r = lerp(330, 300, progress(f, COIL + 30, UNB_AT));
  const th = (s / L) * Math.PI * 2 + (f - COIL) * 0.05;
  // 終盤は縦長の楕円へ（UNBOUND の O の穴の比率）
  const squeeze = progress(f, UNB_AT - 16, UNB_AT, ease.inOut);
  const rx = lerp(r, 128, squeeze);
  const ry = lerp(r, 420, squeeze);
  const cx = CX + rx * Math.cos(th);
  const cy = CY + ry * Math.sin(th);
  const ca = (Math.atan2(ry * Math.cos(th), -rx * Math.sin(th)) * 180) / Math.PI;
  return { x: lerp(p.x, cx, coil), y: lerp(p.y, cy, coil), angle: lerp(p.angle, ca, coil) };
}

function FlowScene({ f }: { f: number }) {
  if (f < FLOW_AT - 2 || f >= UNB_AT + 2) return null;
  const open = (i: number) => progress(f, FLOW_AT + i * 3, FLOW_AT + 10 + i * 3, ease.outExpo);
  const recede = progress(f, COIL - 20, COIL + 30, ease.inOut);
  const bigScale = lerp(1, 0.55, recede);
  const bigOpacity = 1 - progress(f, COIL + 10, COIL + 40);
  const coil = progress(f, COIL, COIL + 44, ease.inOut);
  const speed = keys(f, [FLOW_AT, 1620, COIL, COIL + 30, UNB_AT], [26, 14, 10, 18, 30]);
  // 帯の位置（速度を積分した近似：区間ごとの平均）
  const travel = (f - FLOW_AT) * speed;
  const bandIn = progress(f, FLOW_AT + 10, FLOW_AT + 30, ease.out);
  const ringFade = 1 - progress(f, UNB_AT - 4, UNB_AT + 2);

  const big: G[] = FLOW_L.glyphs.map((g, i) => ({
    key: `fl${i}`,
    word: "flow",
    index: i,
    x: CX + (g.ax - CX) * bigScale,
    y: CY + (g.ay - CY) * bigScale + 8 * Math.sin((f - FLOW_AT) / 9 + i),
    scale: FLOW_L.scale * bigScale,
    anchor: [0.5, 0.5],
    sy: open(i),
    rotate: 2 * noise1(i + 70, (f - FLOW_AT) / 20),
  }));

  const band = [];
  const totalAdv = FLOW_ADV.reduce((a, b) => a + b, 0);
  for (let n = 0; n < BAND_N; n++) {
    const idx = n % 4;
    const before = Math.floor(n / 4) * totalAdv + FLOW_ADV.slice(0, idx).reduce((a, b) => a + b, 0);
    const u = travel + before;
    const p = bandPoint(u, coil, f);
    band.push(
      <Glyph key={`b${n}`} word="flow" index={idx} x={p.x} y={p.y} scale={BAND_SCALE} rotate={p.angle} anchor={[0.5, 0.75]} fill={n % 4 === 2 ? ACCENT : INK} opacity={bandIn * ringFade} />,
    );
  }

  const railDraw = progress(f, FLOW_AT + 6, FLOW_AT + 40, ease.inOut);
  const railY = lerp(120, -80, progress(f, FLOW_AT, COIL));
  return (
    <>
      <Stage>
        <defs>
          <clipPath id="flow-photo" clipPathUnits="userSpaceOnUse">
            {big.map((g) => clipShape(g))}
          </clipPath>
        </defs>
        <g transform={`translate(0 ${railY}) scale(1 1)`} opacity={1 - recede}>
          <path d={RAIL.d} fill="none" stroke={ACCENT} strokeWidth={6} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - railDraw} />
        </g>
        {big.map((g) => draw(g, "#1c1c1b"))}
      </Stage>
      <Photo
        name="02-release"
        view={{ ix: lerp(760, 940, progress(f, FLOW_AT, COIL + 40)), iy: 450, sx: CX, sy: CY, zoom: 1.15 * bigScale + 0.05 }}
        clipId="flow-photo"
        opacity={bigOpacity}
        brightness={1.45}
      />
      <Stage>
        {big.map((g) => (
          <Glyph key={`o${g.key}`} word="flow" index={g.index} x={g.x} y={g.y} scale={g.scale!} sy={g.sy} rotate={g.rotate} anchor={[0.5, 0.5]} fill="none" stroke={INK} strokeWidth={2} opacity={bigOpacity} />
        ))}
        {band}
      </Stage>
    </>
  );
}

/* ───────── UNBOUND ───────── */

const UNB_SCALE = 0.44;
const UNB = layoutWord("unbound", { cx: CX, cy: CY, scale: UNB_SCALE, anchor: [0.5, 0.5] });
const O_I = 3;
// 穴の中心（フォント単位の実測：x 277, y 344 → bbox 中心 (277, 344) とほぼ一致）
const O_C: [number, number] = [UNB.glyphs[O_I].box.cx, UNB.glyphs[O_I].box.top + (700 - 344) * UNB_SCALE];
const START_ZOOM = 420 / (199 * UNB_SCALE); // 穴の半高 199 単位 → 画面 420px
const WIDE = layoutWord("unbound-wide", { cx: CX, cy: CY, scale: 0.15, anchor: [0.5, 0.5] });

export function unboundO(): { cx: number; cy: number; height: number } {
  return { cx: UNB.glyphs[O_I].box.cx, cy: UNB.glyphs[O_I].box.cy, height: UNB.glyphs[O_I].box.h };
}

function UnboundScene({ f }: { f: number }) {
  if (f < UNB_AT - 2 || f >= BURST + 24) return null;
  const pull = progress(f, UNB_AT, UNB_LAND, ease.inOut);
  const z = Math.exp(lerp(Math.log(START_ZOOM), 0, pull));
  // 着地後の小さな押し戻り
  const land = f >= UNB_LAND ? 1 + 0.03 * ring((f - UNB_LAND) / 30, 1.8, 5) - 0.03 : 1;
  const zz = z * land;
  const map = (x: number, y: number): [number, number] => [CX + (x - O_C[0]) * zz + (O_C[0] - CX) * Math.min(1, pull * 1.0), CY + (y - O_C[1]) * zz + (O_C[1] - CY) * Math.min(1, pull)];

  const squeeze = progress(f, SQUEEZE, BURST - 8, ease.in);
  const tremble = progress(f, BURST - 14, BURST) * 4;
  const burst = progress(f, BURST, BURST + 22, ease.in);
  const beatOf = (k: number) => UNB_LAND + Math.round(k * 14.0625);

  const glyphs: G[] = UNB.glyphs.map((g, i) => {
    // 拍ごとに1文字ずつ跳ねる波
    let wave = 0;
    for (let k = 0; k < 5; k++) {
      const b = beatOf(k * 1 + (i % 7) / 7);
      if (f >= b) wave += 0.14 * Math.max(0, ring((f - b) / 30, 2.4, 6)) * (k < 4 ? 1 : 0);
    }
    const toward = g.ax + (O_C[0] - g.ax) * 0.45 * squeeze;
    const away = (g.ax - O_C[0]) * 3.5 * burst + (i < O_I ? -1 : 1) * 600 * burst;
    const [x, y] = map(toward + away + tremble * noise1(i + 90, f), g.ay);
    return { key: `u${i}`, word: "unbound", index: i, x, y, scale: UNB_SCALE * zz, anchor: [0.5, 0.5], sx: 1 - 0.32 * squeeze, sy: 1 + wave + 0.1 * squeeze, opacity: i === O_I && f >= BURST ? 0 : 1 };
  });

  // 密度：上下の輪郭文字列が逆方向へ流れ、溜めで中央へ詰まる
  const rowsOn = f >= UNB_LAND - 6 && f < BURST;
  const rowsIn = progress(f, UNB_LAND - 6, UNB_LAND + 10, ease.out);
  const rows = [];
  if (rowsOn) {
    const speedK = keys(f, [UNB_LAND, 1856, SQUEEZE, BURST], [4, 6, 14, 26], ease.in);
    const gap = lerp(250, 150, squeeze);
    for (let r = -2; r <= 2; r++) {
      if (r === 0) continue;
      const dir = r % 2 ? 1 : -1;
      const off = ((dir * (f - UNB_LAND) * speedK) % WIDE.box.w) - WIDE.box.w;
      for (let rep = 0; rep < 3; rep++) {
        rows.push(
          ...WIDE.glyphs.map((g) => (
            <Glyph
              key={`w${r}${rep}${g.index}`}
              word="unbound-wide"
              index={g.index}
              x={g.ax + off + rep * (WIDE.box.w + 80) - 400}
              y={CY + r * gap}
              scale={WIDE.scale}
              anchor={[0.5, 0.5]}
              fill="none"
              stroke={Math.abs(r) === 1 ? INK : ACCENT}
              strokeWidth={1.5}
              opacity={rowsIn * (Math.abs(r) === 1 ? 0.5 : 0.35)}
            />
          )),
        );
      }
    }
  }
  const lineW = 1920 * progress(f, UNB_LAND, UNB_LAND + 8, ease.outExpo) * (1 - squeeze);

  return (
    <Stage>
      {rows}
      {glyphs.map((g) => draw(g))}
      {f >= UNB_LAND && f < BURST && <rect x={CX - lineW / 2} y={CY + 205} width={lineW} height={4} fill={ACCENT} />}
    </Stage>
  );
}

export function Release({ f }: { f: number }) {
  if (f < BREAK_AT || f >= BURST + 24) return null;
  return (
    <>
      <BreakScene f={f} />
      <FlowScene f={f} />
      <UnboundScene f={f} />
    </>
  );
}

export { UNB, O_C, UNB_SCALE };
