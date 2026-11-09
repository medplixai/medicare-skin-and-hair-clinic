# Re-cutting the doctor avatars

`assets/img/doctors/face/*.jpg` are 200x200 circle-ready crops of the
640x800 studio portraits in `assets/img/doctors/`.

They used to be cut from the top of the portrait, which is not where the
face is — the circular mask clipped the top of every head and left empty
white under every chin. They are cut from the eye line instead.

    swift tools/face-detect.swift assets/img/doctors/*.jpg > /tmp/faces.tsv
    python3 tools/face-crop.py assets/img/doctors/face 200 /tmp/faces.tsv

`face-detect.swift` uses macOS Vision (built in, no model download) and
prints, per portrait: image size, face box, and the eye centre, all in
pixels from the top-left. `face-crop.py` takes a window 2.55x the face
height, centred on the eye centre, with the eyes 44% of the way down it,
clamped to the edges of the picture.

Bump the `?v=` on the eleven `doctors/face/` img tags in index.html after
re-cutting, or browsers keep the old framing — the filenames do not change.
