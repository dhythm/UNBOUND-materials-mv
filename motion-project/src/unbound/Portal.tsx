import { AbsoluteFill } from "remotion";
import { Logo3D } from "../components/Logo3D";
import { Photo, Stage, photoScale, photoToScreen, type PhotoView } from "../components/Photo";
import { ease, keys, lerp, progress } from "../lib/anim";
import type { WordId } from "../lib/glyphs";
import { wordData } from "../lib/glyphs";
import { ACCENT, CX, CY, INK, draw } from "./common";
import { HEAD_POINT } from "./Human";

/**
 * 844–1238：空間。O の穴の内側から文字の壁のトンネルを進む。
 * 中央に厚みを持つ3Dロゴが回り、最後に傾いて、その穴の投影楕円が
 * 銀色リボンのループの穴と一致 → 写真へ受け渡す → 楕円の窓が開いて接写へ。
 * 最後は虹彩状に閉じ、人物の顔の位置で次の場面へ。
 */

const FOCAL = 900;
const RING_R = 760;
const RING_GAP = 620;
const WORDS: WordId[] = ["unbound", "press", "push", "hold", "flow", "break"];

function camZ(f: number): number {
  return keys(f, [844, 880, 950, 1040, 1068], [0, 2900, 4300, 4900, 5600], (t) => 1 - (1 - t) * (1 - t));
}

/* リボンのループ（01-pressure の画像座標で実測） */
const LOOP_IMG: [number, number] = [830, 415];
const LOOP_R: [number, number] = [140, 82];
const LOOP_TILT = 12;

const MATCH = 1062; // 3Dロゴの穴とループが一致する
const EXIT_PHOTO = 1068;
const MACRO_OPEN = 1140;
export const IRIS_CLOSE = 1212;

function photoView(f: number): PhotoView {
  const zoom = keys(f, [EXIT_PHOTO, 1140, 1172], [1.0, 1.24, 1.36], ease.inOut);
  return { ix: LOOP_IMG[0], iy: LOOP_IMG[1], sx: CX, sy: CY, zoom };
}

function Tunnel({ f }: { f: number }) {
  const z = camZ(f);
  const fadeOut = 1 - progress(f, 1030, 1054, ease.inOut);
  const fadeIn = progress(f, 844, 852);
  const first = Math.max(0, Math.floor((z - 400) / RING_GAP));
  const rings = [];
  for (let k = first + 15; k >= first; k--) {
    const d = k * RING_GAP + 500 - z;
    if (d < 230 || d > 9000) continue;
    const p = FOCAL / d;
    const r = RING_R * p;
    const near = progress(d, 230, 420);
    const far = 1 - progress(d, 5000, 9000);
    const op = near * far * fadeOut * fadeIn;
    const spin = (k % 2 ? 1 : -1) * (f - 844) * 0.35 + k * 17;
    if (k % 3 === 2) {
      rings.push(
        <circle key={`r${k}`} cx={CX} cy={CY} r={r} fill="none" stroke={k % 2 ? ACCENT : INK} strokeWidth={Math.max(1, 6 * p)} opacity={op} strokeDasharray={`${r * 0.9} ${r * 0.12}`} transform={`rotate(${spin} ${CX} ${CY})`} />,
      );
      continue;
    }
    const word = WORDS[k % WORDS.length];
    const n = wordData(word).glyphs.length;
    const count = 16;
    const gs = 0.36 * p;
    for (let j = 0; j < count; j++) {
      const a = ((j / count) * 360 + spin) * (Math.PI / 180);
      const x = CX + Math.cos(a) * r;
      const y = CY + Math.sin(a) * r;
      rings.push(
        draw({
          key: `t${k}-${j}`,
          word,
          index: j % n,
          x,
          y,
          scale: gs,
          rotate: (a * 180) / Math.PI - 90,
          anchor: [0.5, 1],
          opacity: op * (0.55 + 0.45 * far),
        }),
      );
    }
  }
  return <>{rings}</>;
}

export function Portal({ f }: { f: number }) {
  if (f < 844 || f >= 1240) return null;
  const view = photoView(f);
  const ps = photoScale(view);
  const [lx, ly] = photoToScreen(view, LOOP_IMG[0], LOOP_IMG[1]);

  // 3Dロゴ：奥から現れ、2回転して厚みを見せ、傾いてループに重なる
  const logoOn = f >= 948 && f < 1094;
  const turn = progress(f, 950, 1040, ease.inOut);
  const settle = progress(f, 1040, MATCH, ease.inOut);
  const pulse = (b: number) => Math.max(0, 1 - Math.abs(f - b) / 7);
  // 穴の投影：半径 107 単位 × size/310 → 161px（ループの長径）。傾き acos(94/161)
  const matchSize = ((LOOP_R[0] * photoScale({ ...view, zoom: 1 })) / 107) * 310;
  const size = keys(f, [948, 1000, 1040, MATCH, 1094], [20, 380, 430, matchSize, matchSize * 1.3], ease.out);
  const rx = lerp(0.45 * Math.sin(turn * Math.PI), Math.acos(LOOP_R[1] / LOOP_R[0]), settle);
  const ry = 4 * Math.PI * turn;
  const screenRz = lerp(0, (-LOOP_TILT * Math.PI) / 180, settle);
  const logoOpacity = 1 - progress(f, MATCH + 6, 1088, ease.inOut);

  // 写真
  const photoOn = f >= MATCH - 4;
  const photoOpacity = progress(f, MATCH - 4, EXIT_PHOTO + 4, ease.inOut);
  const drawRing = progress(f, 1096, 1122, ease.inOut);
  const open = 1 + 14 * progress(f, MACRO_OPEN, MACRO_OPEN + 30, ease.inExpo);
  const macroOn = f >= MACRO_OPEN;
  const ringFade = 1 - progress(f, MACRO_OPEN + 20, MACRO_OPEN + 30);

  // 虹彩：人物の顔の位置へ閉じる
  const irisP = progress(f, IRIS_CLOSE, 1237, ease.inOut);
  const irisR = lerp(2300, 0, irisP);
  const irisC: [number, number] = [lerp(CX, HEAD_POINT[0], progress(f, IRIS_CLOSE, 1230, ease.inOut)), lerp(CY, HEAD_POINT[1], progress(f, IRIS_CLOSE, 1230, ease.inOut))];
  const irisOn = f >= IRIS_CLOSE;

  return (
    <AbsoluteFill style={{ clipPath: irisOn ? `circle(${irisR}px at ${irisC[0]}px ${irisC[1]}px)` : undefined }}>
      {f < 1072 && (
        <Stage>
          <Tunnel f={f} />
        </Stage>
      )}
      {photoOn && <Photo name="01-pressure" view={view} opacity={photoOpacity} />}
      {logoOn && <Logo3D x={CX} y={CY} size={size} rx={rx} ry={ry} rz={0} screenRz={screenRz} explode={18 * (pulse(984) + pulse(1012))} opacity={logoOpacity} />}
      <Stage>
        <defs>
          <clipPath id="loop-window" clipPathUnits="userSpaceOnUse">
            <ellipse cx={lx} cy={ly} rx={LOOP_R[0] * ps * open} ry={LOOP_R[1] * ps * open} transform={`rotate(${LOOP_TILT} ${lx} ${ly})`} />
          </clipPath>
        </defs>
      </Stage>
      {macroOn && (
        <Photo
          name="03-macro"
          view={{ ix: lerp(760, 900, progress(f, MACRO_OPEN, 1238)), iy: 470, sx: lx, sy: ly, zoom: keys(f, [MACRO_OPEN, 1238], [1.0, 1.16], ease.out), rotate: lerp(-4, 3, progress(f, MACRO_OPEN, 1238)) }}
          clipId="loop-window"
        />
      )}
      {f >= 1094 && f < MACRO_OPEN + 30 && (
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
            strokeDashoffset={1 - drawRing}
            opacity={ringFade}
          />
        </Stage>
      )}
      {irisOn && (
        <Stage>
          <circle cx={irisC[0]} cy={irisC[1]} r={Math.max(0, irisR - 4)} fill="none" stroke={INK} strokeWidth={8} />
        </Stage>
      )}
    </AbsoluteFill>
  );
}
