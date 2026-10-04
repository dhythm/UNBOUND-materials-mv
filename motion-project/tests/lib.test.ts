import { describe, expect, it } from "vitest";
import { BEAT, DURATION, FPS, SECTIONS, beat, sectionAt } from "../src/lib/time";
import { glyphBox, glyphPivot, layoutWord, wordData, subpaths } from "../src/lib/glyphs";
import { LOGO_CENTER, poseD, posePoints, segmentCentroid } from "../src/lib/logo";
import { makePath } from "../src/lib/paths";
import { clipFrameFile, CLIP_FRAMES, PRESENTER, srcToComp } from "../src/lib/presenter";
import { noise1, progress, wobble } from "../src/lib/anim";

describe("time", () => {
  it("uses 30fps / 75s / 128bpm", () => {
    expect(FPS).toBe(30);
    expect(DURATION).toBe(2250);
    expect(BEAT).toBeCloseTo(14.0625);
    expect(beat(4)).toBe(56);
  });

  it("sections are contiguous and cover the whole piece", () => {
    expect(SECTIONS[0].start).toBe(0);
    for (let i = 1; i < SECTIONS.length; i++) {
      expect(SECTIONS[i].start).toBe(SECTIONS[i - 1].end);
    }
    expect(SECTIONS[SECTIONS.length - 1].end).toBe(DURATION);
  });

  it("finds the section for a frame", () => {
    expect(sectionAt(0).id).toBe("ignition");
    expect(sectionAt(168).id).toBe("ignition");
    expect(sectionAt(169).id).toBe("pressure");
    expect(sectionAt(2249).id).toBe("resolve");
  });
});

describe("glyphs", () => {
  it("computes the glyph box in word coordinates (y-down)", () => {
    // P of PRESS: offsetX -20, x 0, bounds [40,0,480,688], baseline 721
    const b = glyphBox("press", 0);
    expect(b.left).toBe(20);
    expect(b.right).toBe(460);
    expect(b.top).toBe(33);
    expect(b.bottom).toBe(721);
    expect(b.cx).toBe(240);
    expect(b.cy).toBe(377);
  });

  it("maps a normalized anchor to font units", () => {
    // bottom-center of P in font units
    expect(glyphPivot("press", 0, [0.5, 1])).toEqual([260, 0]);
    // top-left
    expect(glyphPivot("press", 0, [0, 0])).toEqual([40, 688]);
  });

  it("centers a word layout on the requested point", () => {
    const L = layoutWord("press", { cx: 960, cy: 540, height: 400 });
    const left = Math.min(...L.glyphs.map((g) => g.box.left));
    const right = Math.max(...L.glyphs.map((g) => g.box.right));
    const top = Math.min(...L.glyphs.map((g) => g.box.top));
    const bottom = Math.max(...L.glyphs.map((g) => g.box.bottom));
    expect((left + right) / 2).toBeCloseTo(960);
    expect((top + bottom) / 2).toBeCloseTo(540);
    // PRESS visual height: S overshoot 701 above / 12 below baseline = 713 units
    expect(L.scale).toBeCloseTo(400 / 713, 6);
    expect(bottom - top).toBeCloseTo(400);
  });

  it("splits a glyph into its subpaths (O has an outer and an inner contour)", () => {
    const o = wordData("hold").glyphs[1];
    const parts = subpaths(o.d);
    expect(parts.length).toBe(2);
    expect(parts.every((p) => p.startsWith("M"))).toBe(true);
  });
});

describe("logo", () => {
  it("rebuilds the loop pose path from matched points", () => {
    const d = poseD(posePoints("loop", 0));
    expect(d.startsWith("M277.50,65.77 C")).toBe(true);
    expect(d.endsWith("Z")).toBe(true);
  });

  it("interpolates matching segments between poses", () => {
    const a = posePoints("loop", 2);
    const b = posePoints("pressure", 2);
    const mid = posePoints({ from: "loop", to: "pressure", t: 0.5 }, 2);
    expect(mid[3][0]).toBeCloseTo((a[3][0] + b[3][0]) / 2);
    expect(posePoints({ from: "loop", to: "pressure", t: 0 }, 2)).toEqual(a);
  });

  it("logo is centered around (200,200)", () => {
    expect(LOGO_CENTER).toEqual([200, 200]);
    for (let s = 0; s < 6; s++) {
      const c = segmentCentroid(posePoints("loop", s));
      const r = Math.hypot(c[0] - 200, c[1] - 200);
      expect(r).toBeGreaterThan(120);
      expect(r).toBeLessThan(140);
    }
  });
});

describe("paths", () => {
  it("samples an S-command path deterministically", () => {
    const p = makePath("M-100 790 C350 790 460 210 900 210 S1420 890 2020 440");
    const s = p.at(0);
    const e = p.at(1);
    expect(s.x).toBeCloseTo(-100);
    expect(s.y).toBeCloseTo(790);
    expect(e.x).toBeCloseTo(2020);
    expect(e.y).toBeCloseTo(440);
    expect(p.length).toBeGreaterThan(2120);
    // tangent at start is horizontal
    expect(Math.abs(s.angle)).toBeLessThan(1);
  });
});

describe("presenter", () => {
  it("maps local frames to the RGBA sequence and clamps", () => {
    expect(CLIP_FRAMES).toBe(241);
    expect(clipFrameFile(0)).toBe("presenter/frames/frame-0001.png");
    expect(clipFrameFile(170)).toBe("presenter/frames/frame-0171.png");
    expect(clipFrameFile(999)).toBe("presenter/frames/frame-0241.png");
    expect(clipFrameFile(-5)).toBe("presenter/frames/frame-0001.png");
  });

  it("converts source pixels to composition pixels", () => {
    const [x, y] = srcToComp(0, 480);
    expect(y).toBeCloseTo(1080);
    expect(x).toBeCloseTo(PRESENTER.x);
    const [hx] = srcToComp(665, 195);
    expect(hx).toBeCloseTo(PRESENTER.x + 665 * PRESENTER.scale);
    // person height must stay within 450–510px
    expect((479 - 28) * PRESENTER.scale).toBeGreaterThanOrEqual(450);
    expect((479 - 28) * PRESENTER.scale).toBeLessThanOrEqual(510);
  });
});

describe("anim", () => {
  it("progress clamps 0..1", () => {
    expect(progress(5, 10, 20)).toBe(0);
    expect(progress(25, 10, 20)).toBe(1);
    expect(progress(15, 10, 20)).toBeCloseTo(0.5);
  });

  it("wobble starts at zero and decays", () => {
    expect(wobble(0, 2, 3)).toBeCloseTo(0);
    expect(Math.abs(wobble(3, 2, 3))).toBeLessThan(0.01);
    expect(wobble(-1, 2, 3)).toBe(0);
  });

  it("noise is deterministic and bounded", () => {
    expect(noise1(3, 1.25)).toBe(noise1(3, 1.25));
    for (let t = 0; t < 10; t += 0.37) {
      expect(Math.abs(noise1(7, t))).toBeLessThanOrEqual(1);
    }
  });
});
