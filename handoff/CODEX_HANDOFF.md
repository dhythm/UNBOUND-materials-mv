# 別のCodexセッションへ引き継ぐ依頼

このフォルダの素材を使い、Claude Code CLIのOpusへ映像制作を依頼してください。

プロジェクトフォルダ：/Users/yuta.okada/Downloads/UNBOUND-materials-2026-10-04

主指示書：handoff/OPUS_BRIEF.md
素材一覧：README.md / manifest.json
画面の構図見本：index.html / previews/*.png

静止画素材5点、文字ごとのSVG、6パーツのロゴと変形用座標、フォントとライセンス、音素材、75秒の構成は準備済みです。完成動画とRemotionプロジェクトはまだありません。

Seedanceで作るのはグリーンバックの架空人物が日本語で問いかけて、一度だけ片手を押し出す約8秒の1カットです。ユーザーが生成し、video-inbox/presenter-green.mp4へ格納済みです。参照はimages/04-presenter-green.png、プロンプトはprompts/seedance-presenter-ja.txtです。生成した動画をvideo-inbox/presenter-green.mp4へ置きます。

文字、ロゴ、帯、カメラ、写真の変形・マスクはRemotion/HTML/CSS/SVGで行い、有料動画生成サービスへ追加依頼しないでください。

認証確認：制限内の実行ではloggedIn:falseでしたが、通常の環境で確認するとloggedIn:trueでした。ユーザーはログイン済みです。実行制限が認証アクセスに影響するため、必要な場合は通常の承認付き実行を使い、ユーザーへ再ログインを依頼しないでください。

通常のCLI権限モードで、--model opusを使って主指示書を渡してください。起動例はhandoff/run-opus.shです。このスクリプトは素材フォルダをカレントにして、指示書を標準入力から渡します。権限迂回は含みません。CLIやネットワークの制約があれば、未実行であることと必要な次の操作を明示してください。

人物動画が未着でも、12–15秒のモーション試作と、その他のセクションの制作は進められます。人物の静止画を「動画生成済み」と扱わず、完成本編には人物動画の到着とキーイングの確認が必要です。
