import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BG } from "../components/Glyph";
import { Chain } from "./Chain";
import { Human } from "./Human";
import { Opening } from "./Opening";
import { Portal } from "./Portal";
import { Release } from "./Release";
import { Resolve } from "./Resolve";
import { Soundtrack } from "./Soundtrack";

/** 本編 75秒（2250f）。各場面は全体フレームから自分の動きを決める（timing-cues.json の境界） */
export function Unbound() {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: BG }}>
      <Opening f={f} />
      <Chain f={f} />
      <Portal f={f} />
      {f >= 1236 && f < 1462 && <Human f={f} />}
      <Release f={f} />
      <Resolve f={f} />
      <Soundtrack />
    </AbsoluteFill>
  );
}
