import React from "react";
import { INK } from "./Glyph";
import { LOGO_CENTER, LOGO_SEGMENTS, poseD, posePoints, segmentCentroid, type PoseBlend, type PoseName } from "../lib/logo";

export type SegmentMotion = {
  dx?: number;
  dy?: number;
  rotate?: number;
  scale?: number;
  opacity?: number;
  fill?: string;
};

/**
 * 6パーツの開いた輪。座標は 400 単位の viewBox 空間。
 * x, y は画面上の輪の中心、size は viewBox 400 に対する表示幅。
 */
export function Logo(props: {
  x: number;
  y: number;
  size: number;
  rotate?: number;
  pose?: PoseName | PoseBlend;
  segment?: (i: number) => SegmentMotion;
  fill?: string;
  opacity?: number;
  /** ロゴ座標系（400単位）で追加描画するもの */
  children?: React.ReactNode;
}) {
  const k = props.size / 400;
  const pose = props.pose ?? "loop";
  return (
    <g
      transform={`translate(${props.x},${props.y}) rotate(${props.rotate ?? 0}) scale(${k}) translate(${-LOGO_CENTER[0]},${-LOGO_CENTER[1]})`}
      opacity={props.opacity}
    >
      {Array.from({ length: LOGO_SEGMENTS }, (_, i) => {
        const pts = posePoints(pose, i);
        const m = props.segment?.(i) ?? {};
        const [cx, cy] = segmentCentroid(pts);
        return (
          <path
            key={i}
            d={poseD(pts)}
            fill={m.fill ?? props.fill ?? INK}
            opacity={m.opacity}
            transform={`translate(${(m.dx ?? 0) + cx},${(m.dy ?? 0) + cy}) rotate(${m.rotate ?? 0}) scale(${m.scale ?? 1}) translate(${-cx},${-cy})`}
          />
        );
      })}
      {props.children}
    </g>
  );
}
