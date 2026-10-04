import controls from "../data/logo-morph-controls.json";

/**
 * vectors/logo-morph-controls.json の6パーツ。
 * 各 segment は M p0 C p1 p2 p3 L p4 C p5 p6 p7 Z の同一トポロジー。
 * 同じ segment 同士でのみ座標補間する。
 */
export type PoseName = "loop" | "pressure" | "release";
export type Pt = [number, number];
export type PoseBlend = { from: PoseName; to: PoseName; t: number };

export const LOGO_CENTER: Pt = [200, 200];
export const LOGO_SEGMENTS = 6;
/** loop 形状の外径・内径（viewBox 400 単位） */
export const LOGO_OUTER_R = 155;
export const LOGO_INNER_R = 107;

function rawPose(name: PoseName, seg: number): Pt[] {
  return controls.poses[name][seg].points as Pt[];
}

export function posePoints(pose: PoseName | PoseBlend, seg: number): Pt[] {
  if (typeof pose === "string") return rawPose(pose, seg);
  const a = rawPose(pose.from, seg);
  if (pose.t === 0) return a;
  const b = rawPose(pose.to, seg);
  return a.map((p, i) => [p[0] + (b[i][0] - p[0]) * pose.t, p[1] + (b[i][1] - p[1]) * pose.t]);
}

const f2 = (n: number) => n.toFixed(2);

export function poseD(p: Pt[]): string {
  const s = (q: Pt) => `${f2(q[0])},${f2(q[1])}`;
  return `M${s(p[0])} C${s(p[1])} ${s(p[2])} ${s(p[3])} L${s(p[4])} C${s(p[5])} ${s(p[6])} ${s(p[7])} Z`;
}

/** 端点4つの平均（パーツの回転・飛散の中心に使う） */
export function segmentCentroid(p: Pt[]): Pt {
  const idx = [0, 3, 4, 7];
  return [idx.reduce((s, i) => s + p[i][0], 0) / 4, idx.reduce((s, i) => s + p[i][1], 0) / 4];
}
