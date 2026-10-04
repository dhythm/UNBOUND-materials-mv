# 静止画を 4列のコンタクトシートにまとめる: python3 tools/sheet.py out.png dir frame...
import subprocess, sys
out, d, frames = sys.argv[1], sys.argv[2], sys.argv[3:]
args, fl, ins, lay = [], "", "", []
for i, fr in enumerate(frames):
    args += ["-i", f"{d}/f{fr}.png"]
    fl += f"[{i}]scale=480:270[s{i}];"
    ins += f"[s{i}]"
    lay.append(f"{(i % 4) * 480}_{(i // 4) * 270}")
subprocess.run(["ffmpeg", "-v", "error", "-y", *args, "-filter_complex", f"{fl}{ins}xstack=inputs={len(frames)}:layout={'|'.join(lay)}:fill=gray", out], check=True)
