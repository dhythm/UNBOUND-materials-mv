import { Audio, Sequence, staticFile } from "remotion";
import { progress } from "../lib/anim";
import { P0 } from "./Human";

/**
 * 音：オリジナル合成のリズムベッド（tools/make-score.mjs）＋接触点の SFX ＋人物の声（一度だけ）。
 * ベッドは主要接触点でキックを抜いてあるので、SFX と同じ打撃を重ねない。
 */
type Cue = { at: number; name: string; volume: number; cut?: number };

const SFX: Cue[] = [
  // 着火
  { at: 4, name: "snap-click", volume: 0.3 },
  { at: 16, name: "snap-click", volume: 0.3 },
  { at: 26, name: "tension-rise", volume: 0.45, cut: 86 },
  { at: 112, name: "impact-low", volume: 0.7 },
  { at: 112, name: "release-sweep", volume: 0.45 },
  { at: 140, name: "snap-click", volume: 0.5 },
  // 圧縮
  { at: 197, name: "impact-low", volume: 0.72 },
  { at: 197, name: "metal-flex", volume: 0.4 },
  { at: 255, name: "snap-click", volume: 0.55 },
  { at: 295, name: "impact-low", volume: 0.6 },
  { at: 298, name: "snap-click", volume: 0.4 },
  { at: 301, name: "snap-click", volume: 0.45 },
  { at: 304, name: "snap-click", volume: 0.55 },
  { at: 337, name: "impact-low", volume: 0.68 },
  { at: 380, name: "metal-flex", volume: 0.28 },
  { at: 450, name: "release-sweep", volume: 0.4 },
  { at: 450, name: "snap-click", volume: 0.5 },
  // 連鎖
  { at: 517, name: "snap-click", volume: 0.5 },
  { at: 524, name: "impact-low", volume: 0.4 },
  { at: 530, name: "snap-click", volume: 0.5 },
  { at: 540, name: "snap-click", volume: 0.45 },
  { at: 546, name: "impact-low", volume: 0.34 },
  { at: 556, name: "impact-low", volume: 0.3 },
  ...[578, 584, 590, 596, 602, 608].map((at, i) => ({ at, name: "snap-click", volume: 0.3 + 0.03 * i })),
  { at: 610, name: "metal-flex", volume: 0.24 },
  { at: 712, name: "release-sweep", volume: 0.32 },
  { at: 800, name: "snap-click", volume: 0.45 },
  { at: 806, name: "tension-rise", volume: 0.32, cut: 38 },
  // 空間
  { at: 844, name: "release-sweep", volume: 0.42 },
  { at: 984, name: "metal-flex", volume: 0.24 },
  { at: 1012, name: "metal-flex", volume: 0.24 },
  { at: 1062, name: "snap-click", volume: 0.5 },
  { at: 1062, name: "metal-flex", volume: 0.3 },
  { at: 1140, name: "release-sweep", volume: 0.3 },
  { at: 1236, name: "snap-click", volume: 0.35 },
  // 人物（実際の手の伸展フレーム）
  { at: 1394, name: "snap-click", volume: 0.42 },
  { at: 1410, name: "impact-low", volume: 0.35 },
  { at: 1424, name: "metal-flex", volume: 0.28 },
  // 解放
  { at: 1462, name: "impact-low", volume: 0.7 },
  { at: 1462, name: "release-sweep", volume: 0.5 },
  { at: 1477, name: "impact-low", volume: 0.5 },
  { at: 1477, name: "snap-click", volume: 0.5 },
  { at: 1512, name: "snap-click", volume: 0.4 },
  { at: 1526, name: "snap-click", volume: 0.45 },
  { at: 1547, name: "release-sweep", volume: 0.35 },
  { at: 1575, name: "metal-flex", volume: 0.3 },
  { at: 1684, name: "metal-flex", volume: 0.24 },
  { at: 1744, name: "snap-click", volume: 0.45 },
  { at: 1800, name: "impact-low", volume: 0.7 },
  { at: 1912, name: "impact-low", volume: 0.65 },
  { at: 1912, name: "release-sweep", volume: 0.45 },
  // 収束
  { at: 1969, name: "metal-flex", volume: 0.32 },
  ...[0, 1, 2, 3, 4].map((k) => ({ at: 1969 + k * 21 + 16, name: "snap-click", volume: 0.42 })),
  { at: 2138, name: "lock-final", volume: 0.6 },
];

export function Soundtrack() {
  return (
    <>
      <Audio
        src={staticFile("audio/score-bed.wav")}
        volume={(f) => 0.85 * (1 - 0.6 * progress(f, 1236, 1246) * (1 - progress(f, 1350, 1370)))}
      />
      <Sequence from={P0} layout="none">
        <Audio src={staticFile("presenter/presenter-voice.wav")} volume={0.95} />
      </Sequence>
      {SFX.map((s, i) => (
        <Sequence key={i} from={s.at} durationInFrames={s.cut ?? 90} layout="none">
          <Audio src={staticFile(`audio/${s.name}.wav`)} volume={(t) => s.volume * (s.cut ? 1 - progress(t, s.cut - 6, s.cut) : 1)} />
        </Sequence>
      ))}
    </>
  );
}
