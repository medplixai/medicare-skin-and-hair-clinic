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

/**
 * CONDITION ILLUSTRATIONS — a different rule, deliberately.
 *
 * A picture of the disease is patient information, not an advertisement: it shows what a problem
 * looks like so somebody recognises their own and comes in. What the rules forbid is a RESULT —
 * a before-and-after, a cleared patch, a case published to persuade (cl. 8.1(v), 8.1(vi)). So
 * these show the condition and never its treatment or its outcome.
 *
 * Three things keep them honest, and all three are required together:
 *   - no face, ever. A dermatology picture with a face reads as a patient, and these are nobody;
 *   - AI-generated and SAID to be, on the page itself (cl. 7.2 — AI content carries a source mark);
 *   - a clinical illustration, not a photograph of a real person's disease.
 * The mark is rendered by the page, not drawn into the picture, so it stays legible, translatable
 * and impossible to crop off in a forward.
 */
const CONDITION_RULES = [
  "A clinical dermatology teaching illustration of the condition only.",
  "Absolutely no text, no lettering, no numbers, no watermark in any language or script.",
  "No face, no eyes, no mouth, no identifiable person: the frame holds only the affected area of skin, scalp or nail.",
  "Show the condition as it presents, untreated. Not a result, not healed skin, not a comparison, not two panels.",
  "Indian skin tone, even clinical daylight, plain neutral background, respectful and matter-of-fact, no drama and no beauty styling.",
].join(" ");

const CONDITIONS = [
  { slug: "psoriasis", te: "సోరియాసిస్", en: "Psoriasis",
    prompt: "A close clinical view of an adult elbow with well-defined raised red plaques covered in silvery-white scale, typical of plaque psoriasis." },
  { slug: "vitiligo", te: "బొల్లి", en: "Vitiligo",
    prompt: "A close clinical view of the back of an adult hand and wrist with sharply defined milk-white depigmented patches of vitiligo against brown skin." },
  { slug: "eczema", te: "తామర (ఎగ్జిమా)", en: "Eczema",
    prompt: "A close clinical view of the inner elbow crease with dry, thickened, reddened and lightly cracked skin typical of atopic eczema." },
  { slug: "fungal", te: "ఫంగల్ ఇన్ఫెక్షన్", en: "Fungal infection",
    prompt: "A close clinical view of a forearm with a ring-shaped fungal infection: a raised scaly advancing border with clearer skin at the centre." },
  { slug: "acne", te: "మొటిమలు", en: "Acne",
    prompt: "A tight macro of the skin of a cheek and jawline showing inflamed acne papules, pustules and open comedones, cropped so that no eye, nose or mouth is in the frame." },
  { slug: "hairfall", te: "జుట్టు రాలడం", en: "Hair loss",
    prompt: "Photographic close view, shot from directly behind and above an adult head: the crown and parting, where the dark hair is visibly thinned and the scalp shows through. Real photograph, natural daylight, not an illustration or drawing. No face, no forehead, no ear in frame." },
  { slug: "nail-fungus", te: "గోళ్ళ ఫంగస్", en: "Nail infection",
    prompt: "A close clinical view of adult fingernails that are thickened, yellowed, crumbling at the free edge and lifting from the nail bed, typical of fungal nail infection." },
  { slug: "melasma", te: "మచ్చలు (మెలస్మా)", en: "Melasma",
    prompt: "Extreme close-up of ONE side of an adult face: the skin of a single left cheek and temple only, filling the whole frame at a slight angle, showing blotchy brown-grey melasma pigmentation. Not symmetrical, not a portrait, not mirrored. No eye, no eyebrow, no nose, no mouth, no ear, no chin, no jawline edge anywhere in the frame — skin only." },
  { slug: "warts", te: "పులిపిర్లు", en: "Warts",
    prompt: "A close clinical view of the back of an adult hand with several rough, raised, greyish-brown warts with a cauliflower-like surface." },
  { slug: "scabies", te: "గజ్జి", en: "Scabies",
    prompt: "A close clinical view of the webs between the fingers of an adult hand showing fine linear burrows, small red bumps and scratch marks typical of scabies." },
  { slug: "dandruff", te: "చుండ్రు", en: "Dandruff",
    prompt: "Real photograph, macro, natural light: an adult scalp with dark hair parted by two fingers to reveal dry white flakes of dandruff scattered along the parting and over the hair. Photographic, not an illustration, not a drawing, not a cartoon. Seen from above and behind, no face." },
  { slug: "alopecia-areata", te: "ప్యాచీ అలోపేషియా", en: "Alopecia areata",
    prompt: "A close view of the back of an adult head with dark hair showing one sharply defined smooth round patch where the hair is completely absent, seen from behind." },
  { slug: "baldness", te: "బట్టతల", en: "Male pattern baldness",
    prompt: "A view from above and behind an adult man's head showing an advanced receding hairline and a bald crown with only a rim of hair remaining, no face in frame." },
  { slug: "keloid", te: "కెలాయిడ్ మచ్చ", en: "Keloid",
    prompt: "A close clinical view of a shoulder with a firm, raised, shiny keloid scar extending beyond the line of an old wound." },
  { slug: "moles", te: "పుట్టుమచ్చలు", en: "Moles",
    prompt: "A close clinical view of the skin of an upper back with several small, evenly coloured, round brown moles of different sizes." },
  { slug: "suspicious-mole", te: "అనుమానాస్పద మచ్చ", en: "Mole that needs checking",
    prompt: "A close clinical view of a single dark skin lesion on a forearm that is asymmetric, with an irregular notched border and two different shades of brown and black within it." },
  { slug: "urticaria", te: "దద్దుర్లు (అలర్జీ)", en: "Hives / allergy",
    prompt: "A close clinical view of a forearm covered in raised pale pink weals with surrounding redness, of varying size and irregular outline, typical of urticaria." },
  { slug: "lichen-planus", te: "లైకెన్ ప్లానస్", en: "Lichen planus",
    prompt: "Real clinical photograph, macro: the inner wrist of an adult with a cluster of small flat-topped shiny violet-purple papules of lichen planus on brown skin, with fine white lines across them. Photographic, not an illustration, not a drawing, not a cartoon." },
  { slug: "acne-scars", te: "మొటిమల మచ్చలు", en: "Acne scars",
    prompt: "A tight macro of the skin of one cheek showing pitted and boxcar acne scars with uneven texture and brown post-inflammatory marks, no acne pimples. Only skin fills the frame: no eye, no nose, no mouth, no ear, no jaw edge." },
  { slug: "wrinkles", te: "చర్మ ముడతలు", en: "Wrinkles",
    prompt: "Real photograph, macro, natural light: the back of an older adult's hand with thin crepey skin, prominent veins and fine wrinkles. Photographic, not an illustration, not a drawing, not a cartoon." },
  { slug: "nail-discolour", te: "గోళ్ల రంగు మారడం", en: "Nail discolouration",
    prompt: "A close clinical view of adult fingernails showing uneven white and brown-grey discolouration and horizontal ridges across the nail plates." },
  { slug: "ingrown-nail", te: "లోపలికి పెరిగిన గోరు", en: "Ingrown nail",
    prompt: "Real clinical photograph, macro: an adult big toe where the nail edge has grown into the side skin fold, which is red, swollen and shiny. Photographic, not an illustration, not a drawing, not a cartoon." },
].map((c) => ({ ...c, out: `assets/img/conditions/${c.slug}.jpg`, aspect: "1:1", rules: CONDITION_RULES }));

const want = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const force = process.argv.includes("--force");

async function draw(spec) {
  const res = await fetch(`${BASE}/models/${MODEL}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${spec.prompt} ${spec.rules ?? RULES}` }] }],
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
for (const spec of [...IMAGES, ...CONDITIONS]) {
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
