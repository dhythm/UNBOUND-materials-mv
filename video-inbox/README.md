# Seedance人物動画の受け取り場所

人物の生成動画を受領済み。presenter-green.mp4が原本。presenter-alpha.webmとpresenter-frames/は切り抜き済み素材、presenter-voice.wavは抽出音声。参照画像は ../images/04-presenter-green.png、プロンプトは ../prompts/seedance-presenter-ja.txt。

生成するのは人物が話して一度だけ手を押し出す約8秒の1カット。文字・ロゴ・リボン・カメラの演出はRemotion/HTML/CSS/SVGで作る。

人物の動画を presenter-green.mp4 という名前でここへ置く。音声が別ファイルで提供される場合は presenter-voice.wav または presenter-voice.mp3 も置く。画像素材を動画作成済みの代わりに扱わない。

取り込み後に、顔・口・指・フレーム外へのはみ出し・背景の均一性を確認。口と手が十分なら、一部の問題はトリムや編集で解消し、すぐに再生成へ進まない。
