
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BG, Glyph, INK, ACCENT } from "./components/Glyph";
import { Logo } from "./components/Logo";
import { Logo3D } from "./components/Logo3D";
import { Photo, Stage } from "./components/Photo";
import { layoutWord } from "./lib/glyphs";

/** 検証用：グリフの穴・写真マスク・ロゴ3形態・3D */
export function Lab() {
  const f = useCurrentFrame();
  const L = layoutWord("press", { cx: 960, cy: 400, height: 420 });
  const H = layoutWord("hold", { cx: 1500, cy: 860, height: 260 });
  if (f === 1) {
    return (
      <AbsoluteFill style={{ background: BG }}>
        <Logo3D x={600} y={540} size={500} rx={0.5} ry={0.9} rz={0.2} />
        <Logo3D x={1350} y={540} size={500} rx={-0.3} ry={1.45} rz={0} explode={30} />
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ background: BG }}>
      <Stage>
        <defs>
          <clipPath id="lab-press" clipPathUnits="userSpaceOnUse">
            {L.glyphs.slice(2).map((g) => (
              <Glyph key={g.index} word="press" index={g.index} x={g.ax} y={g.ay} scale={L.scale} />
            ))}
          </clipPath>
          <clipPath id="lab-o" clipPathUnits="userSpaceOnUse">
            <Glyph word="hold" index={1} part="inner" x={H.glyphs[1].ax} y={H.glyphs[1].ay} scale={H.scale} />
          </clipPath>
        </defs>
        {L.glyphs.slice(0, 2).map((g) => (
          <Glyph key={g.index} word="press" index={g.index} x={g.ax} y={g.ay} scale={L.scale} />
        ))}
        {H.glyphs.map((g) => (
          <Glyph key={g.index} word="hold" index={g.index} x={g.ax} y={g.ay} scale={H.scale} />
        ))}
        <Logo x={160} y={860} size={220} pose="loop" />
        <Logo x={420} y={860} size={220} pose="pressure" />
        <Logo x={680} y={860} size={220} pose="release" fill={ACCENT} />
        <rect x={L.box.left} y={L.box.top} width={L.box.w} height={L.box.h} fill="none" stroke={INK} strokeOpacity={0.3} />
      </Stage>
      <Photo name="01-pressure" view={{ ix: 830, iy: 415, sx: 1200, sy: 420, zoom: 1.2 }} clipId="lab-press" />
      <Photo name="03-macro" view={{ ix: 836, iy: 470, sx: H.glyphs[1].ax, sy: H.glyphs[1].ay, zoom: 0.5 }} clipId="lab-o" />
    </AbsoluteFill>
  );
}
