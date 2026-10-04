# UNBOUND

75秒のキネティックタイポグラフィー映像。1920×1080、30fps、2250フレーム。承認済み12秒のPrototypeを土台に、文字の圧縮、連鎖、空間通過、人物との接触、解放、ロゴの収束をつなぐ。

## 編集・出力

- 依存関係：`npm ci`
- 編集プレビュー：`npm run studio`
- 本編出力：`npm run render:main` → `out/unbound-75s.mp4`
- 試作出力：`npm run render:proto` → `out/unbound-prototype.mp4`
- 確認：`npm run typecheck`、`npm test`

本編は `src/unbound/Unbound.tsx`、各場面は同じフォルダのOpening、Chain、Portal、Human、Release、Resolve。区切りは `src/data/timing-cues.json`。音の配置はSoundtrack、リズムの生成は `node tools/make-score.mjs`。

## 同梱素材

必要な画像、フォント、効果音、人物の透過連番と声をpublicに同梱。人物はユーザー提供の854×480・約8秒の動画を30fpsの透過連番へ変換して使用。表示高は約496px。画像・ロゴ・音・フォントの来歴は `public/SOURCE-NOTES.txt` とfontsのOFLを参照。

## 完成版の確認

型チェックと既存16件のテストが通過。場面ごとの画面、場面境界、完成MP4から抽出した全編43フレームを確認。H.264映像75.0秒・2250フレーム、AAC音声あり。測定した音声ピークは−2.4dBFS。台詞を含む音声の聴感は独立に確認していない。人物素材は480pのため、人物を大きく拡大する場合には画質の制限がある。

編集用ZIPはnode_modules、build、出力動画を除外し、素材を同梱。完成MP4は別ファイルで提供。
