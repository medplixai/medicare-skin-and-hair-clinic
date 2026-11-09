import Foundation
import Vision
import AppKit

// For each image: print  name  imgW imgH  faceX faceY faceW faceH  eyeX eyeY
// Coordinates are pixels with the origin at the TOP-LEFT.
for path in CommandLine.arguments.dropFirst() {
    let name = (path as NSString).lastPathComponent
    guard let img = NSImage(contentsOfFile: path),
          let tiff = img.tiffRepresentation,
          let bmp = NSBitmapImageRep(data: tiff),
          let cg = bmp.cgImage else { print("\(name)\tERR"); continue }
    let W = CGFloat(cg.width), H = CGFloat(cg.height)

    let req = VNDetectFaceLandmarksRequest()
    let handler = VNImageRequestHandler(cgImage: cg, options: [:])
    do { try handler.perform([req]) } catch { print("\(name)\tERR"); continue }
    guard let faces = req.results, !faces.isEmpty else { print("\(name)\tNONE"); continue }
    // largest face
    let f = faces.max(by: { $0.boundingBox.width * $0.boundingBox.height
                          < $1.boundingBox.width * $1.boundingBox.height })!
    let b = f.boundingBox                       // normalized, origin BOTTOM-left
    let fx = b.origin.x * W
    let fw = b.size.width * W
    let fh = b.size.height * H
    let fy = (1 - b.origin.y - b.size.height) * H   // flip to top-left

    // eye centre from landmarks, if we have them
    var ex = fx + fw/2, ey = fy + fh*0.42
    if let lm = f.landmarks, let le = lm.leftEye, let re = lm.rightEye {
        func centre(_ r: VNFaceLandmarkRegion2D) -> CGPoint {
            var sx: CGFloat = 0, sy: CGFloat = 0
            for p in r.normalizedPoints { sx += p.x; sy += p.y }
            let n = CGFloat(r.pointCount)
            return CGPoint(x: sx/n, y: sy/n)       // normalized INSIDE the face box
        }
        let l = centre(le), r = centre(re)
        let mx = (l.x + r.x)/2, my = (l.y + r.y)/2
        ex = fx + mx * fw
        ey = fy + (1 - my) * fh                    // flip within the box
    }
    print(String(format: "%@\t%.0f\t%.0f\t%.1f\t%.1f\t%.1f\t%.1f\t%.1f\t%.1f",
                 name, W, H, fx, fy, fw, fh, ex, ey))
}
