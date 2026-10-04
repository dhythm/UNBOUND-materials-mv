import cues from "../data/timing-cues.json";

export const FPS = cues.fps;
export const DURATION = cues.durationFrames;
export const WIDTH = 1920;
export const HEIGHT = 1080;

/** 1拍のフレーム数（128 BPM / 30fps = 14.0625） */
export const BEAT = (FPS * 60) / cues.bpm;
export const BAR = BEAT * 4;

/** n拍目の開始フレーム（整数に丸める） */
export function beat(n: number): number {
  return Math.round(n * BEAT);
}

export type SectionId =
  | "ignition"
  | "pressure"
  | "chain"
  | "portal"
  | "human-question"
  | "release"
  | "resolve";

export type Section = { id: SectionId; start: number; end: number };

/** timing-cues.json の境界（end は exclusive） */
export const SECTIONS: Section[] = cues.sections.map((s) => ({
  id: s.id as SectionId,
  start: s.startFrame,
  end: s.endFrameExclusive,
}));

export function sectionAt(frame: number): Section {
  const found = SECTIONS.find((s) => frame >= s.start && frame < s.end);
  if (!found) {
    throw new RangeError(`frame ${frame} is outside 0..${DURATION - 1}`);
  }
  return found;
}

export function section(id: SectionId): Section {
  const found = SECTIONS.find((s) => s.id === id);
  if (!found) throw new Error(`unknown section ${id}`);
  return found;
}
