#!/usr/bin/env python3
"""
Lay an opaque bar across the eyes of every patient in a photograph, so the
treatment stays visible and the person does not.

  python3 tools/eye-mask.py <eyes.tsv> <out-dir> <file> [file ...]

<eyes.tsv> is what tools/eye-detect.swift prints.  Pictures with no face in
them — scalps, feet, ears, backs of heads — are copied through untouched.
<out-dir> may be the pictures' own directory, which overwrites them.

The bar is drawn in the frame of the eyes themselves: as wide as the face,
as tall as H_FACE of it, centred on the line between the two pupils and
turned to the angle of that line, so a tilted head gets a tilted bar.

Three things keep it tidy:
  • a face that fills its frame (a hero crop) gets a bar right across the
    picture, so no sliver of eye survives at an edge;
  • two faces side by side in one card get bars that stop at the join
    between them, instead of merging into one long band;
  • a few cards are listed by hand below, because the eye region is itself
    the thing being treated and a standard bar would delete the result.
"""
import os, shutil, subprocess, sys

H_FACE  = 0.215   # bar height as a fraction of the face box
RISE    = 0.018   # lift the bar by this much of the face box, to take the brows
W_FACE  = 1.00    # bar width as a fraction of the face box
EYE_PAD = 0.04    # keep this much face box clear beyond the outermost eye point
FILL    = 0.80    # at or above this share of the frame, the bar spans the frame
BLEED   = 0.02    # how far a frame-spanning bar runs past the edge
GAP     = 0.008   # the join left between two bars in the same card
MIN_H   = 26

# Cards where a bar is not drawn, and the reason.
SKIP = {
    "xanthelasma.jpg":
        "the lesions are ON the eyelids — a bar would delete the result",
    "acne.jpg":
        "masked by hand below (the clinic's own bars are replaced)",
    "botox.jpg":   "masked by hand below (crow's feet must stay visible)",
    "botox-2.jpg": "masked by hand below (the foreheads must stay visible)",
}

# Bars placed by hand: (cx, cy, w, h, angle) in pixels.
EXTRA = {
    # The clinic's own small squares, grown into the same bar as everywhere
    # else: as wide as the face but kept inside its own quarter of the card,
    # and tall enough to swallow the old square whole.
    "acne.jpg": [
        (255.2, 213.5, 186.0, 81.0, 0.0),
        (616.9, 214.5, 184.3, 83.0, 0.0),
        (154.4, 539.5, 194.5, 79.0, 0.0),
        (465.0, 536.0, 162.0, 78.0, 0.0),
    ],
    # Eye close-ups. Narrow bars over the eye openings only; the wrinkles
    # that the treatment is about sit outside them and stay visible.
    "botox.jpg": [
        (295.0, 359.0, 166.0, 86.0, -6.0),
        (594.0, 395.0, 224.0, 78.0, -4.0),
    ],
    # Only a sliver of the eyes shows, along the bottom of the lower frame.
    "botox-2.jpg": [
        (380.0, 673.5, 630.0, 51.0, 0.0),
    ],
}


def rows(path):
    out = {}
    for line in open(path):
        f = line.rstrip("\n").split("\t")
        out.setdefault(f[0], [])
        if len(f) >= 18:
            out[f[0]].append([float(x) for x in f[2:18]])
    return out


def bars_for(name, faces):
    if name in SKIP:
        return []
    out = []
    for r in faces:
        W, H, fx, fy, fw, fh, ang, lx, ly, rx, ry, eminx, eminy, emaxx, emaxy, conf = r
        cy = (ly + ry) / 2 - fh * RISE
        h = max(fh * H_FACE, MIN_H)

        if fw >= FILL * W:                       # the face fills the frame
            x0, x1 = -BLEED * W, W * (1 + BLEED)
        else:
            half = fw * W_FACE / 2
            cx = fx + fw / 2
            x0 = min(cx - half, eminx - fw * EYE_PAD)
            x1 = max(cx + half, emaxx + fw * EYE_PAD)
        out.append([x0, x1, cy, h, ang, fx + fw / 2, cy])

    # two faces side by side in one card: stop each bar at the join
    for i, a in enumerate(out):
        for j, b in enumerate(out):
            if i == j or abs(a[6] - b[6]) > 0.15 * faces[i][1]:
                continue
            mid = (a[5] + b[5]) / 2
            if b[5] > a[5]:
                a[1] = min(a[1], mid - faces[i][0] * GAP)
            else:
                a[0] = max(a[0], mid + faces[i][0] * GAP)

    return [((x0 + x1) / 2, cy, x1 - x0, h, ang) for x0, x1, cy, h, ang, _, _ in out]


def pair_up(plan):
    """The hero card wipes one photograph away to show the other, and the two
    are cropped to line up. Give a before/after pair one and the same bar, or
    the wipe would step across it."""
    for name, bars in plan.items():
        if "-before." not in name or len(bars) != 1:
            continue
        twin = name.replace("-before.", "-after.")
        if twin not in plan or len(plan.get(twin) or []) != 1:
            continue
        a, b = bars[0], plan[twin][0]
        mean = tuple((x + y) / 2 for x, y in zip(a, b))
        plan[name] = [mean]
        plan[twin] = [mean]


def main():
    tsv, outdir = sys.argv[1], sys.argv[2]
    os.makedirs(outdir, exist_ok=True)
    det = rows(tsv)

    plan = {}
    for src in sys.argv[3:]:
        name = os.path.basename(src)
        plan[name] = bars_for(name, det.get(name, [])) + EXTRA.get(name, [])
    pair_up(plan)

    for src in sys.argv[3:]:
        name = os.path.basename(src)
        dst = os.path.join(outdir, name)
        ext = os.path.splitext(name)[1].lower()
        bars = plan[name]

        if not bars:
            why = SKIP.get(name, "no face in the picture")
            if os.path.abspath(src) != os.path.abspath(dst):
                shutil.copy2(src, dst)
            print(f"{name:<28} —   {why}")
            continue

        # re-encode at the quality the file already had, so masking a card
        # does not quietly add weight to the page
        q = subprocess.run(["magick", "identify", "-format", "%Q", src],
                           capture_output=True, text=True).stdout.strip()
        cmd = ["magick", src, "-fill", "black"]
        for cx, cy, w, h, ang in bars:
            cmd += ["-draw", f"translate {cx:.1f},{cy:.1f} rotate {ang:.2f} "
                             f"rectangle {-w/2:.1f},{-h/2:.1f} {w/2:.1f},{h/2:.1f}"]
        if ext in (".jpg", ".jpeg") and q.isdigit():
            cmd += ["-quality", q]
        cmd += ["-strip", dst]
        subprocess.run(cmd, check=True)
        print(f"{name:<28} {len(bars)}  " +
              "   ".join(f"{w:.0f}x{h:.0f}@({cx:.0f},{cy:.0f}){ang:+.0f}°"
                         for cx, cy, w, h, ang in bars))


if __name__ == "__main__":
    main()
