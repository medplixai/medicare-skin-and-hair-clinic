# Eye masks on the patient photographs

Every patient whose face can be recognised on the site carries a black bar
across the eyes. The bars are burned into the image files — nothing is done
in CSS, so the masked picture is what leaves the server, what a right-click
saves, and what Google indexes.

Two scripts do it, and they are repeatable: run them again after the
photographs change and you get the same bars back.

```bash
# 1. find every face, and inside it every eye
swift tools/eye-detect.swift assets/img/before-after/*.jpg assets/img/hero/*.jpg > /tmp/eyes.tsv

# 2. draw the bars, in place
python3 tools/eye-mask.py /tmp/eyes.tsv assets/img/before-after assets/img/before-after/*.jpg
python3 tools/eye-mask.py /tmp/eyes.tsv assets/img/hero        assets/img/hero/*.jpg
```

`eye-detect.swift` is macOS **Vision** — already on the Mac, nothing to
install, nothing to download. It reports each face box, each eye centre and
every eye landmark point, in pixels.

`eye-mask.py` draws one bar per face: as wide as the face, 21.5% of the face
box tall, centred on the line between the pupils and turned to the angle of
that line, so a tilted head gets a tilted bar. Three rules keep it tidy:

* a face that fills its frame — the hero crops — gets a bar right across the
  picture, so no sliver of an eye survives at an edge;
* two faces side by side in one card get bars that stop at the join, instead
  of merging into one long band;
* a **before/after pair in the hero card gets one and the same bar**, because
  that card wipes one photograph away to show the other and a mismatched bar
  would step across the wipe line.

## ⚠️ The file names do not change

So a browser, and Vercel's CDN, will happily keep serving the older, unmasked
copy. After re-masking, raise the token in **both** places:

* `assets/js/results.js` → `var V = "?v=…"` (the carousel cards)
* `assets/js/hero-ba.js` → `var V = "?v=…"` (the hero photographs)
* `index.html` → the two `assets/img/hero/chemical-peel-*.jpg?v=…` tags, which
  are written out in the HTML so the first one paints immediately

## The pictures that are handled by hand

Listed at the top of `eye-mask.py`, with the reason beside each:

| file | what happens |
|---|---|
| `acne.jpg` | the clinic's own small squares are replaced by the standard bar |
| `botox.jpg` | narrow bars over the eye openings only — the crow's feet, which are the result, stay visible |
| `botox-2.jpg` | a strip along the bottom of the lower frame — both foreheads stay whole |
| `xanthelasma.jpg` | **not masked.** The lesions sit on the eyelids; a bar would delete the result. |

Fourteen other pictures have no face in them at all — scalps, feet, ears, the
back of a head — and are copied through untouched.

## Checking it worked

The honest test is to read the shipped files back and confirm that every eye
landmark Vision found is now a black pixel:

```python
magick <file> -format "%[pixel:p{x,y}]" info:
```

At the last run that was 345 eye landmarks across 17 files, all black, with
at least 7px of bar around the tightest one.
