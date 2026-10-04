// 人物RGBA連番のアルファ境界を解析し、手の最大伸展フレームを求める
import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";

const dir = path.resolve("public/presenter/frames");
const files = fs.readdirSync(dir).filter((f) => /^frame-\d{4}\.png$/.test(f)).sort();
const rows = [];
for (const f of files) {
  const png = PNG.sync.read(fs.readFileSync(path.join(dir, f)));
  const { width: w, height: h, data } = png;
  let minX = w, maxX = -1, minY = h, maxY = -1;
  // 上半身（y < 330）で最も右の不透明画素 = 画面右側の手
  let handX = -1, handY = -1;
  let semi = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = data[(y * w + x) * 4 + 3];
      if (a > 0 && a < 255) semi++;
      if (a < 128) continue;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
      if (y < 330 && x > handX) { handX = x; handY = y; }
    }
  }
  rows.push({ frame: Number(f.slice(6, 10)), minX, maxX, minY, maxY, handX, handY, semi });
}
fs.writeFileSync("tools/presenter-analysis.json", JSON.stringify(rows));
for (const r of rows) if (r.frame % 6 === 1 || r.frame > 150 && r.frame < 200) console.log(JSON.stringify(r));
const best = rows.reduce((a, b) => (b.handX > a.handX ? b : a));
console.log("max extension", best);
