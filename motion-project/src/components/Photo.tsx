import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";

export type PhotoName = "01-pressure" | "02-release" | "03-macro";

export const PHOTO_W = 1672;
export const PHOTO_H = 941;
/** 1920 幅に合わせる倍率（=cover） */
export const COVER = 1920 / PHOTO_W;

export type PhotoView = {
  /** 画像上の注視点（画像ピクセル）を画面の (sx, sy) に置く */
  ix: number;
  iy: number;
  sx: number;
  sy: number;
  /** cover に対する倍率（1 = 画面幅いっぱい）。原寸が小さいので 1.4 程度までに抑える */
  zoom: number;
  rotate?: number;
};

export function photoScale(v: PhotoView): number {
  return COVER * v.zoom;
}

/** 画像座標 → 画面座標 */
export function photoToScreen(v: PhotoView, x: number, y: number): [number, number] {
  const s = photoScale(v);
  const r = ((v.rotate ?? 0) * Math.PI) / 180;
  const dx = (x - v.ix) * s;
  const dy = (y - v.iy) * s;
  return [v.sx + dx * Math.cos(r) - dy * Math.sin(r), v.sy + dx * Math.sin(r) + dy * Math.cos(r)];
}

/**
 * 銀色写真（必ずモノクロ）。clipId を渡すと SVG の clipPath（画面座標）で切り抜く。
 * Remotion の <Img> で読み込みを待つ。
 */
export function Photo(props: {
  name: PhotoName;
  view: PhotoView;
  clipId?: string;
  opacity?: number;
  brightness?: number;
  contrast?: number;
  blur?: number;
}) {
  const s = photoScale(props.view);
  const v = props.view;
  return (
    <AbsoluteFill
      style={{
        clipPath: props.clipId ? `url(#${props.clipId})` : undefined,
        opacity: props.opacity,
        overflow: "hidden",
      }}
    >
      <Img
        src={staticFile(`images/${props.name}.png`)}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: PHOTO_W,
          height: PHOTO_H,
          transformOrigin: "0 0",
          transform: `translate(${v.sx}px, ${v.sy}px) rotate(${v.rotate ?? 0}deg) scale(${s}) translate(${-v.ix}px, ${-v.iy}px)`,
          filter: `grayscale(1) brightness(${props.brightness ?? 1}) contrast(${props.contrast ?? 1.05})${props.blur ? ` blur(${props.blur}px)` : ""}`,
        }}
      />
    </AbsoluteFill>
  );
}

/** 画面全体の SVG（defs 用・描画用の共通ラッパ） */
export function Stage(props: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <svg
      width={1920}
      height={1080}
      viewBox="0 0 1920 1080"
      style={{ position: "absolute", left: 0, top: 0, overflow: "visible", ...props.style }}
    >
      {props.children}
    </svg>
  );
}
