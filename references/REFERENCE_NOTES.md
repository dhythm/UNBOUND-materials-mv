# 制作リファレンス

確認日：2026-10-04（日本時間）。参考作品はリンクとして整理し、完成映像用の素材には取り込んでいない。

## BUCK — Playgrounds In Motion
https://buck.co/work/playgrounds-in-motion

制作者自身の説明では、N/Mに由来する波形をロゴ、立体表現、画像・映像を収める窓へ展開している。今回の参考点は「同じ形が別の役割へ変わり続ける」構造。作品固有のロゴや画面を複製せず、UNBOUNDの独自の開いた輪と文字で実装する。

## BUCK — Square / Restaurant Anthem
https://buck.co/work/square-restaurant-anthem

制作者の説明に、写真の印刷・再撮影とストップモーションの使用がある。今回の参考点は、写真も編集・分割・切り抜きによって映像の動きへ参加できること。UNBOUNDでは生成した金属写真と架空人物を使う。

## Ordinary Folk — Process
https://www.ordinaryfolk.co/process

制作者の工程では音と映像を初期から検討している。今回も先にリズムの区切りと接触音を作り、動きの到達点を音と合わせる。

## Google Fonts — Archivo
https://github.com/google/fonts/tree/main/ofl/archivo
https://github.com/Omnibus-Type/Archivo

公式Google Fontsリポジトリから可変フォントとOFLを取得。wght=900、wdth=62を主見出しに、wdth=100を一部に使用。可変軸は実ファイルから確認した。ライセンス同梱。

## Google Fonts — Noto Sans JP
https://github.com/google/fonts/tree/main/ofl/notosansjp

ユーザー環境にあるNoto Sans JP可変フォントのコピーを使用。公式Google FontsリポジトリからOFLを取得し同梱。日本語の問いかけと補助コピーに使用。

## 生成素材の来歴

images/01-pressure.png：内蔵画像生成ツールで新規生成。
images/02-release.png：01を材料・照明の参照として、ほどけた姿に編集。
images/03-macro.png：01を材料・照明の参照として、接写を新規生成。
images/04-presenter-green.png：内蔵画像生成ツールで架空人物を新規生成。
images/05-presenter-cutout.png：04の背景除去を内蔵画像生成ツールで実施。仮編集専用。

利用した内蔵ツールはモデル名の選択・確認を公開していないため、GPT Image 2.5使用済みとは断定しない。正確な生成プロンプトはprompts/image-*.txtに保存。生成画像のネイティブ寸法は1672×941。最終1920×1080への小幅な拡大・トリミングは編集工程で扱い、4K素材として表示しない。

SVGロゴ、レール、ポータルは今回独自に作成。文字SVGは同梱のOFLフォントからアウトライン化。音素材は録音サンプルや既存楽曲を使わず、波形合成で独自作成。参考リンクにある他社作品の画像・動画は再配布していない。

## 受領した動画

ユーザーからvideo-inbox/presenter-green.mp4を受領。Dreaminaで生成された架空人物の約8秒の動画。追加生成は実施していない。背景を切り抜いて30fpsの透過WebMとRGBA連番を作成し、音声をWAVとして抽出。詳細はhandoff/RECEIVED_VIDEO_NOTES.mdを参照。
