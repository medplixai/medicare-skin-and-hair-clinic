import sys, subprocess, os
# S = K * faceH  (Vision's box is brow-to-chin; a whole head is ~1.6x that,
#                 and we want the head to fill ~2/3 of the circle)
K      = 2.55
EYE_Y  = 0.44   # where the eye line sits down the square
OUT    = sys.argv[1]
SIZE   = int(sys.argv[2])
os.makedirs(OUT, exist_ok=True)
rows=[]
for line in open(sys.argv[3]):
    p=line.rstrip("\n").split("\t")
    if len(p)!=9: continue
    name,W,H,fx,fy,fw,fh,ex,ey = p[0],*(float(v) for v in p[1:])
    S = K*fh
    left = ex - S/2
    top  = ey - EYE_Y*S
    # keep the window inside the picture, shrinking only as a last resort
    S = min(S, W, H)
    left = max(0, min(left, W-S))
    top  = max(0, min(top,  H-S))
    src = os.path.join("assets/img/doctors", name)
    dst = os.path.join(OUT, name)
    subprocess.run(["magick", src, "-crop", f"{S:.0f}x{S:.0f}+{left:.0f}+{top:.0f}", "+repage",
                    "-resize", f"{SIZE}x{SIZE}", "-strip", "-quality", "86", dst], check=True)
    rows.append(f"{name:18} S={S:5.0f} left={left:5.0f} top={top:5.0f}  (eye {ex:.0f},{ey:.0f})")
print("\n".join(rows))
