/**
 * 受領した人物動画（video-inbox/presenter-frames、30fps RGBA連番 241枚、854×480）。
 * frame-0001 が動画 0 秒。数値は tools/analyze-presenter.mjs の実測値。
 */
export const CLIP_FRAMES = 241;
export const SRC_W = 854;
export const SRC_H = 480;

/** 実測：手の動き（クリップ内 0 始まりのフレーム番号＝ファイル番号 - 1） */
export const CLIP = {
  /** 発声区間（音量解析 約0.47–3.41秒） */
  speechStart: 14,
  speechEnd: 102,
  /** 右手が上がり始める */
  handRise: 126,
  /** 1回目の伸展（指先 x=663） */
  firstReach: 154,
  /** 少し戻る */
  recoil: 164,
  /** 最大伸展（指先 x=665, y=195） */
  maxReach: 170,
  /** 以降は x≈657 で保持 */
  holdFrom: 174,
} as const;

/** 指先の位置（ソース画素）。手の高さは y≈170–196 */
export const FINGERTIP_SRC = {
  firstReach: [663, 185] as [number, number],
  maxReach: [665, 195] as [number, number],
  hold: [657, 189] as [number, number],
};

/**
 * 画面配置：原本の下端（腰の切れ目）を画面下端に一致させる。
 * 人物（y 28–479）の高さ = 451 × 1.1 ≈ 496px（指示の 450–510px 内）。
 */
export const PRESENTER = {
  scale: 1.1,
  x: 250,
  get y() {
    return 1080 - SRC_H * this.scale;
  },
};

export function srcToComp(x: number, y: number): [number, number] {
  return [PRESENTER.x + x * PRESENTER.scale, PRESENTER.y + y * PRESENTER.scale];
}

/** クリップ内ローカルフレーム（0始まり）→ 連番ファイル（staticFile 用、範囲外はクランプ） */
export function clipFrameFile(local: number): string {
  const n = Math.min(CLIP_FRAMES, Math.max(1, Math.floor(local) + 1));
  return `presenter/frames/frame-${String(n).padStart(4, "0")}.png`;
}
