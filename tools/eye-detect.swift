import Foundation
import Vision
import AppKit

/*  Every face in every picture, with the eyes located.

    One TSV line per face, pixels, origin TOP-LEFT:
      file  n  W  H  fx fy fw fh  angle  lx ly  rx ry  eMinX eMinY eMaxX eMaxY  conf

      fx..fh  the face box
      angle   degrees, the tilt of the line between the two eye centres
      lx,ly   centre of the face's own left eye (image left when facing us)
      rx,ry   centre of the face's own right eye
      eMin..  the box that holds every eye landmark point
      conf    Vision's confidence in the face

    A last field carries every eye landmark point itself, "x,y x,y ...",
    which is what tools/eye-mask.py checks its bars against.

    A file with no face at all prints "file\tNONE".                            */

func centre(_ r: VNFaceLandmarkRegion2D) -> CGPoint {
    var sx: CGFloat = 0, sy: CGFloat = 0
    for p in r.normalizedPoints { sx += p.x; sy += p.y }
    let n = CGFloat(max(r.pointCount, 1))
    return CGPoint(x: sx / n, y: sy / n)
}

for path in CommandLine.arguments.dropFirst() {
    let name = (path as NSString).lastPathComponent
    guard let img = NSImage(contentsOfFile: path),
          let tiff = img.tiffRepresentation,
          let bmp  = NSBitmapImageRep(data: tiff),
          let cg   = bmp.cgImage else { print("\(name)\tERR"); continue }
    let W = CGFloat(cg.width), H = CGFloat(cg.height)

    let req = VNDetectFaceLandmarksRequest()
    let handler = VNImageRequestHandler(cgImage: cg, options: [:])
    do { try handler.perform([req]) } catch { print("\(name)\tERR"); continue }
    guard let faces = req.results, !faces.isEmpty else { print("\(name)\tNONE"); continue }

    // left-to-right, then top-to-bottom, so the numbering follows the eye
    let sorted = faces.sorted {
        let a = $0.boundingBox, b = $1.boundingBox
        if abs(a.origin.y - b.origin.y) > 0.12 { return a.origin.y > b.origin.y }
        return a.origin.x < b.origin.x
    }

    for (n, f) in sorted.enumerated() {
        let b  = f.boundingBox                        // normalized, origin BOTTOM-left
        let fx = b.origin.x * W
        let fw = b.size.width * W
        let fh = b.size.height * H
        let fy = (1 - b.origin.y - b.size.height) * H // flip to top-left

        func toPixel(_ p: CGPoint) -> CGPoint {       // normalized inside the face box
            CGPoint(x: fx + p.x * fw, y: fy + (1 - p.y) * fh)
        }

        var lp = CGPoint(x: fx + fw * 0.32, y: fy + fh * 0.42)
        var rp = CGPoint(x: fx + fw * 0.68, y: fy + fh * 0.42)
        var minX = CGFloat.greatestFiniteMagnitude, minY = CGFloat.greatestFiniteMagnitude
        var maxX = -CGFloat.greatestFiniteMagnitude, maxY = -CGFloat.greatestFiniteMagnitude
        var haveLandmarks = false
        var pts: [CGPoint] = []

        if let lm = f.landmarks {
            if let le = lm.leftEye  { lp = toPixel(centre(le)); pts += le.normalizedPoints.map(toPixel); haveLandmarks = true }
            if let re = lm.rightEye { rp = toPixel(centre(re)); pts += re.normalizedPoints.map(toPixel); haveLandmarks = true }
            if let lb = lm.leftPupil  { pts += lb.normalizedPoints.map(toPixel) }
            if let rb = lm.rightPupil { pts += rb.normalizedPoints.map(toPixel) }
            for p in pts {
                minX = min(minX, p.x); maxX = max(maxX, p.x)
                minY = min(minY, p.y); maxY = max(maxY, p.y)
            }
        }
        if !haveLandmarks {
            minX = min(lp.x, rp.x) - fw * 0.06; maxX = max(lp.x, rp.x) + fw * 0.06
            minY = min(lp.y, rp.y) - fh * 0.04; maxY = max(lp.y, rp.y) + fh * 0.04
        }

        let angle = atan2(rp.y - lp.y, rp.x - lp.x) * 180 / .pi

        let list = pts.map { String(format: "%.1f,%.1f", $0.x, $0.y) }.joined(separator: " ")
        print(String(format: "%@\t%d\t%.0f\t%.0f\t%.1f\t%.1f\t%.1f\t%.1f\t%.2f\t%.1f\t%.1f\t%.1f\t%.1f\t%.1f\t%.1f\t%.1f\t%.1f\t%.3f\t%@",
                     name, n, W, H, fx, fy, fw, fh, angle,
                     lp.x, lp.y, rp.x, rp.y, minX, minY, maxX, maxY, Double(f.confidence), list))
    }
}
