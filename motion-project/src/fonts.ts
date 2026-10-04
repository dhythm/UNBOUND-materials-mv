import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

/**
 * 同梱フォント（OFL）。文字の主要部はアウトライン済みSVGだが、
 * 補助のライブテキスト用に読み込み完了まで描画を待つ。
 */
export const ARCHIVO = "Archivo";
export const NOTO_JP = "NotoSansJP";

export const fontsReady = Promise.all([
  loadFont({ family: ARCHIVO, url: staticFile("fonts/Archivo-Variable.ttf"), format: "truetype", weight: "100 900", display: "block" }),
  loadFont({ family: NOTO_JP, url: staticFile("fonts/NotoSansJP-Variable.ttf"), format: "truetype", weight: "100 900", display: "block" }),
]);
