# UNBOUND — キネティックタイポグラフィー映像

制作日：2026-10-04（日本時間）
完成映像：75秒、横長1920×1080、30fps、2250フレーム。キネティックタイポグラフィー中心。

承認済み12秒の試作から、本編の制作・出力まで完了しました。編集用Remotionプロジェクトは[motion-project/](motion-project/README.md)です。

## すぐ使うもの

- index.html：画像、構図見本、音、主要指示書への入口。
- images/04-presenter-green.png：Seedanceへ添付するグリーンバックの人物画像。
- prompts/seedance-presenter-ja.txt：人物動画用の日本語プロンプト。8秒程度、16:9、1080p、初回1本のみ。
- handoff/OPUS_BRIEF.md：Opusへ渡す映像制作指示。
- handoff/CODEX_HANDOFF.md：別Codexセッションへ渡す引き継ぎ。

## 素材と用途

| 素材 | 用途 | 状態 |
| --- | --- | --- |
| images/01-pressure.png | 圧縮された金属リボン | 生成・確認済み |
| images/02-release.png | ほどけた同じ金属リボン | 生成・確認済み |
| images/03-macro.png | 金属の接写 | 生成・確認済み |
| images/04-presenter-green.png | 架空人物の動画生成リファレンス | 生成・確認済み |
| images/05-presenter-cutout.png | 透過人物の静止画・仮配置用 | RGBA確認済み。動画ではない |
| typography/words/ | 11種類の文字列、各文字は個別パス | アウトラインSVG |
| typography/glyphs/ | 24種類の独立した英字グリフ素材 | アウトラインSVG |
| typography/glyph-layouts.json | 文字の形・位置・座標系 | Remotionへの取り込み用 |
| typography/*.ttf / OFL-*.txt | Archivo / Noto Sans JPとライセンス | 同梱 |
| vectors/logo-*.svg | 6パーツに分けた独自ロゴ、3形態 | 個別ID付き |
| vectors/logo-morph-controls.json | 同じトポロジーの変形座標 | パーツごとに補間可能 |
| vectors/rail.svg / portal.svg / ribbon-centerline.svg | レール・穴・帯 | SVG素材 |
| audio/*.wav | 独自合成の効果音6点と75秒のリズムガイド | 48kHzステレオ |
| audio/timing-cues.json | 128 BPM、75秒の場面境界 | 30fps換算済み |
| previews/01–05*.png / *.svg | 5場面の静止画の構図見本 | 動画ではない |
| video-inbox/presenter-green.mp4 | 人物が喋って手を動かす動画 | ユーザーから受領済み・約8秒、854×480 |
| video-inbox/presenter-alpha.webm / presenter-frames/ | 切り抜き動画とRGBA連番 | 30fps、アルファ確認済み |
| video-inbox/presenter-voice.wav | 原本から抽出した音声 | 同梱 |

画像のネイティブ寸法は1672×941です。4K素材ではありません。画像生成には内蔵画像生成ツールを使用しました。モデル名の指定・確認は公開されていないため、特定モデル使用済みとは断定していません。全プロンプトはprompts/へ保存しています。

## 編集と出力

```sh
cd motion-project
npm ci
npm run studio
```

本編の書き出しは `npm run render:main`。出力先は `motion-project/out/unbound-75s.mp4`（H.264映像・AAC音声）です。試作は `npm run render:proto` で出力できます。型チェックは `npm run typecheck`、既存テストは `npm test`。

必要な画像、フォント、人物の透過連番、音声を `motion-project/public/` に同梱しています。外部の素材URLに依存せず、本編を再出力できます。人物の原本と切り抜きは `video-inbox/` に保存。追加のSeedance生成は不要です。

`handoff/` の制作指示は制作時の記録です。初期指示には、完成前の状態を記載した箇所があります。最終実装の内容は `handoff/OPUS_COMPLETION.md` と `motion-project/README.md` を参照してください。

## Gitで管理するもの

素材・プロンプト・SVG・フォントとライセンス・制作指示・Remotionコードを、このディレクトリから一緒に管理します。素材は通常のGitで保存しています。

依存関係 `node_modules/`、ビルド `build/`、完成動画と確認画像 `out/`、実行ログ、ローカルセッション情報、ZIPは `.gitignore` で除外しています。`index.html` の完成動画へのリンクはローカルで書き出した後に利用できます。完成動画自体はGitに含みません。

## 来歴と確認

他社の参考作品はreferences/REFERENCE_NOTES.mdにリンクとして保存し、完成映像へその素材を流用していません。フォントにはOFLを同梱しています。SVGロゴと音素材は今回独自に作成しました。

previewsのSVGは画像を埋め込み、単独で開いても参照切れしないようにしています。SVGの構造、画像の寸法とアルファ、音声の尺、主要な構図見本を確認しています。検証記録はverification.json、素材の寸法とハッシュはmanifest.jsonを参照してください。

本編の検証記録は `full-film-verification.json`。型チェック・既存16件のテスト通過、場面ごとの画面と完成動画の再生、音声ピークを確認しています。音の聴感は独立には確認していません。
