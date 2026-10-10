/**
 * The site's own pictures, made to a rule: they may carry no claim.
 *
 * The banners this replaces were withdrawn on 10 October 2026 because the claim was INSIDE the
 * picture, where no copy edit could reach it — "Senior DERMATOLOGIST & COSMETOLOGIST", "ONE
 * SOLUTION. COMPLETE TRANSFORMATION.", "Specialized Care. Lasting Relief.", graded appearance
 * scores and a product recommendation list, and a wall sign for a "PEDIATRIC DERMA" clinic that
 * is not ours. NMC Guidelines on Ethical Advertising (6 Oct 2026) cl. 8.1(iii), (v), (vi), (xii).
 *
 * So every prompt here forbids three things, and the check at the end fails the run if the model
 * ignores them:
 *   - no lettering of any kind, in any script;
 *   - no before/after, no treatment being performed on a patient, no result shown;
 *   - no signage, no logo, no branded premises — the room in a picture must not claim to be ours.
 *
 * Faces are avoided deliberately. A photographed "patient" in a dermatology advertisement reads
 * as a case, and cl. 8.1(v) does not allow cases to be published for promotion. Hands, light,
 * instruments and texture carry the same warmth and claim nothing.
 *
 * Run:  node tools/gen-images.mjs            (only what is missing)
 *       node tools/gen-images.mjs --force    (redraw everything)
 *       node tools/gen-images.mjs laser-hair peels     (just these)
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

// The key lives with the platform, which is the only place it is configured. Read, never printed.
const ENV = "/Users/nagarajubandaru/Developer/medicarehospital website and app/web/.env.local";
const KEY = (() => {
  const line = readFileSync(ENV, "utf8").split("\n").find((l) => l.startsWith("GEMINI_API_KEY="));
  if (!line) throw new Error("GEMINI_API_KEY not found in the platform's .env.local");
  return line.slice("GEMINI_API_KEY=".length).trim().replace(/^["']|["']$/g, "");
})();

const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-3-pro-image";
const BASE = "https://generativelanguage.googleapis.com/v1beta";

/** Said at the end of every prompt, because this is the part that must never slip. */
const RULES = [
  "Absolutely no text, no lettering, no numbers, no words in any language or script anywhere in the image.",
  "No logos, no signage, no brand marks, no wall boards, no screens showing any interface.",
  "No people's faces, no patient, no before-and-after, no treatment being performed on a person.",
  "Photographic, natural light, shallow depth of field, calm and clean. Soft pink and warm white palette.",
  "Indian clinical setting, tasteful and understated, nothing futuristic or neon, no stock-photo gloss.",
].join(" ");

const IMAGES = [
  // ---- wide banners that sit inside a section, white-matted by .section__banner ----
  { out: "assets/img/banner-doctors.jpg", aspect: "16:9",
    prompt: "A dermatology consultation desk photographed from a slight angle: a dermatoscope resting on a clean notepad, a pen, a small potted plant, a folded white coat sleeve out of focus at the edge, soft daylight from a window." },
  { out: "assets/img/banner-treatments.jpg", aspect: "16:9",
    prompt: "A tidy arrangement of aesthetic dermatology equipment on a white counter: a laser handpiece, small glass serum vials with droppers, a rolled white towel, stainless steel tray, soft pink light falling across them." },
  { out: "assets/img/banner-chronic.jpg", aspect: "16:9",
    prompt: "An unlabelled white ointment tube and a small plain glass jar standing on a clean pale shelf beside a neatly folded towel, soft morning light from the side, calm and domestic, nothing clinical or dramatic." },
  { out: "assets/img/banner-ai.jpg", aspect: "16:9",
    prompt: "A smartphone lying face down on a pale marble surface beside a small ring light and a folded towel, soft morning light, the phone's screen not visible at all." },
  { out: "assets/img/banner-children.jpg", aspect: "16:9",
    prompt: "A parent's hand gently holding a small child's hand, close crop on the two hands only, warm daylight, soft neutral background, no faces in frame." },

  // ---- signature treatment cards, 16:10 media box in .tx__media ----
  { out: "assets/img/treatments/botox.jpg", aspect: "16:9",
    prompt: "A sealed sterile syringe and a small glass vial on a stainless steel tray on white cloth, gloved hand out of focus in the background, clinical and clean." },
  { out: "assets/img/treatments/glutathione.jpg", aspect: "16:9",
    prompt: "An intravenous drip bottle hanging beside a comfortable reclining chair in a bright, uncluttered clinic room, soft daylight, viewed from a respectful distance, no person in the chair." },
  { out: "assets/img/treatments/hydrafacial.jpg", aspect: "16:9",
    prompt: "A facial treatment trolley: a handpiece with a clear spiral tip, bottles of clear solution, cotton pads and a folded towel, arranged on a white surface in soft pink light." },
  { out: "assets/img/treatments/laser-hair.jpg", aspect: "16:9",
    prompt: "A laser handpiece with a cooling tip resting on a white towel beside protective eyewear, on a clinic counter, cool steel and warm white, soft shadows." },
  { out: "assets/img/treatments/hair.jpg", aspect: "16:9",
    prompt: "A small centrifuge and labelled empty tubes on a clean laboratory bench beside a sterile tray, soft daylight, shallow focus." },
  { out: "assets/img/treatments/skin-booster.jpg", aspect: "16:9",
    prompt: "Small glass ampoules of clear liquid standing in a neat row on a white marble surface, one lying on its side, soft pink light and gentle reflections." },
  { out: "assets/img/treatments/peels.jpg", aspect: "16:9",
    prompt: "A glass bowl of clear solution with a soft fan brush resting across it, cotton pads and a white towel beside it on a clean counter, warm light." },
  { out: "assets/img/treatments/lasers.jpg", aspect: "16:9",
    prompt: "A dermatology laser console beside a treatment couch in a bright uncluttered room, its display switched off, white linen, soft daylight through a blind." },
];

const want = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const force = process.argv.includes("--force");

async function draw(spec) {
  const res = await fetch(`${BASE}/models/${MODEL}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${spec.prompt} ${RULES}` }] }],
      generationConfig: {
        responseModalities: ["IMAGE"],
        imageConfig: { aspectRatio: spec.aspect, ...(MODEL.includes("pro") ? { imageSize: "2K" } : {}) },
      },
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${res.status}: ${JSON.stringify(json).slice(0, 220)}`);
  const part = (json?.candidates?.[0]?.content?.parts ?? []).find((p) => p.inlineData?.data);
  if (!part) throw new Error(`no image returned: ${JSON.stringify(json).slice(0, 220)}`);
  return Buffer.from(part.inlineData.data, "base64");
}

let made = 0;
for (const spec of IMAGES) {
  const name = spec.out.split("/").pop().replace(/\.jpg$/, "");
  if (want.length && !want.includes(name)) continue;
  if (!force && existsSync(spec.out)) {
    console.log(`· ${name} – already there`);
    continue;
  }
  process.stdout.write(`… ${name} `);
  try {
    const bytes = await draw(spec);
    mkdirSync(dirname(spec.out), { recursive: true });
    writeFileSync(spec.out, bytes);
    console.log(`→ ${spec.out} (${Math.round(bytes.length / 1024)} KB)`);
    made++;
  } catch (e) {
    console.log(`✗ ${e.message}`);
  }
}
console.log(`\n${made} drawn. Look at every one before it ships: a claim in a picture is still a claim.`);
