// =====================================================================
//  /api/analyze  —  AI Skin & Hair Analysis (Claude Opus 4.8 vision)
//  Serverless function (Vercel Node runtime). No dependencies: uses the
//  built-in fetch + crypto. The uploaded photo is analyzed in-memory and
//  is NEVER stored (privacy-first).
//
//  Access control (OTP-less until an SMS provider is wired):
//    - consent flag (checkbox attestation) + 10-digit mobile number
//    - LIMIT: 5 analyses per mobile number per 90 days, enforced via a
//      stateless HMAC-signed usage token the client stores & echoes back
//      (no database). When SMS/OTP is added later, the same token gets
//      anchored to a verified number.
//
//  Required env vars (set in Vercel → Project → Settings → Environment):
//    ANTHROPIC_API_KEY   — your Anthropic API key (billing)
//    CONSENT_SECRET      — a long random string (HMAC secret for tokens)
// =====================================================================
const crypto = require("crypto");

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const CONSENT_SECRET = process.env.CONSENT_SECRET || "DEV_INSECURE_change_me_set_CONSENT_SECRET";
const MODEL = "claude-opus-4-8";
const LIMIT = 5;                                   // free analyses…
const WINDOW_MS = 90 * 24 * 60 * 60 * 1000;        // …per 90 days per number

/* ---- stateless per-number usage token (HMAC-signed) ---- */
function hmac(body) { return crypto.createHmac("sha256", CONSENT_SECRET).update(body).digest("base64url"); }
function readUsage(token, phone) {
  try {
    if (!token || typeof token !== "string") return { start: Date.now(), count: 0 };
    const [body, sig] = token.split(".");
    if (!body || !sig) return { start: Date.now(), count: 0 };
    const a = Buffer.from(sig), b = Buffer.from(hmac(body));
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return { start: Date.now(), count: 0 };
    const p = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (p.p !== phone) return { start: Date.now(), count: 0 };
    if (!p.s || Date.now() - p.s > WINDOW_MS) return { start: Date.now(), count: 0 };  // window expired → reset
    return { start: p.s, count: Math.max(0, p.c | 0) };
  } catch (e) { return { start: Date.now(), count: 0 }; }
}
function signUsage(phone, start, count) {
  const body = Buffer.from(JSON.stringify({ p: phone, s: start, c: count, v: 1 })).toString("base64url");
  return body + "." + hmac(body);
}

const TREATMENTS =
  "Acne & acne-scar treatment, chemical peels, pigmentation/melasma treatment, " +
  "lasers (pigmentation, hair reduction, tattoo removal), MNRF/skin tightening, " +
  "HydraFacial, anti-wrinkle & fillers, hair-fall treatment, PRP & GFC therapy, " +
  "hair transplant (FUE/DHI), dandruff & scalp treatment, nail-disease treatment, " +
  "vitiligo care, wart/mole/skin-tag removal";

const SYSTEM =
`You are "Medicare AI", an educational skin & hair photo-observation assistant on the website of Medicare Skin & Hair Clinic — a dermatology clinic chain in Andhra Pradesh, India. Most users read Telugu.

CRITICAL SAFETY RULES — follow every one, without exception:
- You are NOT a doctor and you must NOT diagnose. Never state a definitive diagnosis or a specific disease name as a conclusion. Use tentative, general, non-alarming language ("might", "commonly associated with", "could be related to").
- NEVER claim to detect, confirm, or rule out cancer, tumours, or any serious or urgent condition. If anything looks potentially serious, do NOT name it — instead set seeDoctorSoon=true and gently recommend a prompt in-person check-up.
- Do NOT name prescription medicines, dosages, or specific drug regimens.
- No guarantees, no "permanent cure", no "100%", no "shashwatam". Results vary from person to person.
- If the image is not a clear photo of human skin, scalp, hair, or nails (e.g. blurry, dark, unrelated object, or a face-only selfie with no visible concern), set imageUsable=false, leave the analysis arrays empty, and politely ask in the summary for a clearer, well-lit close-up of the affected area.
- Keep everything general, supportive and educational. Always recommend an in-person consultation with Medicare's dermatologists for an accurate assessment.

SCORES: Also return 4-6 appearance scores (0-100, HIGHER = healthier-looking) relevant to the focus — e.g. for skin: Hydration look, Oil balance, Even tone, Texture, Clarity; for hair/scalp: Density look, Scalp health, Volume, Shine. These are rough visual impressions from a photo, NOT measurements — be conservative, avoid extremes (stay within 25-90 unless truly obvious), and never present them as clinical readings. label = short Telugu, labelEn = short English.

STYLE: Write summary, observations, possibleFactors and selfCareTips BILINGUALLY — Telugu first, then a short English phrase — in a warm, simple, reassuring tone. suggestedTreatments must be chosen ONLY from services Medicare actually offers: ${TREATMENTS}. Return ONLY the JSON described by the schema.`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["imageUsable", "summary", "scores", "observations", "possibleFactors", "selfCareTips", "suggestedTreatments", "severity", "seeDoctorSoon", "disclaimer"],
  properties: {
    imageUsable: { type: "boolean" },
    summary: { type: "string" },
    scores: { type: "array", items: {
      type: "object", additionalProperties: false,
      required: ["label", "labelEn", "value"],
      properties: {
        label: { type: "string" },
        labelEn: { type: "string" },
        value: { type: "integer" }
      }
    } },
    observations: { type: "array", items: { type: "string" } },
    possibleFactors: { type: "array", items: { type: "string" } },
    selfCareTips: { type: "array", items: { type: "string" } },
    suggestedTreatments: { type: "array", items: { type: "string" } },
    severity: { type: "string", enum: ["general-care", "recommend-consult", "see-soon"] },
    seeDoctorSoon: { type: "boolean" },
    disclaimer: { type: "string" }
  }
};

const SAFE_DISCLAIMER =
  "ఇది AI ద్వారా ఇచ్చిన సాధారణ, విద్యాపరమైన సమాచారం మాత్రమే — వైద్య నిర్ధారణ (diagnosis) కాదు. " +
  "ఖచ్చితమైన అంచనా & చికిత్స కోసం దయచేసి మా అర్హత గల చర్మవైద్య నిపుణులను సంప్రదించండి. " +
  "This is AI-generated general guidance, not a medical diagnosis — please consult our dermatologists.";

module.exports = async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ error: "method_not_allowed" }); return; }
  try {
    if (!ANTHROPIC_API_KEY) {
      res.status(503).json({ error: "not_configured", message: "AI analysis is not configured yet. (Set ANTHROPIC_API_KEY in Vercel.)" });
      return;
    }
    const { image, mediaType, images, patient, consent, phone, usageToken } = req.body || {};

    if (consent !== true) { res.status(400).json({ error: "consent_required", message: "దయచేసి అనుమతి (consent) ✓ ఇవ్వండి." }); return; }
    const ph = (phone || "").toString().replace(/\D/g, "");
    if (ph.length !== 10) { res.status(400).json({ error: "phone_required", message: "దయచేసి 10 అంకెల మొబైల్ నంబర్ ఇవ్వండి." }); return; }

    /* per-number limit: 5 analyses / 90 days (stateless signed token) */
    const usage = readUsage(usageToken, ph);
    if (usage.count >= LIMIT) {
      res.status(429).json({ error: "limit_reached", remaining: 0,
        message: "ఈ నంబర్‌కు 90 రోజుల్లో " + LIMIT + " ఉచిత AI విశ్లేషణలు పూర్తయ్యాయి. ఖచ్చితమైన అంచనా కోసం మా వైద్యులను సంప్రదించండి 🌸" });
      return;
    }

    /* accept 1-2 photos: `images:[{data,mediaType},...]` (new) or single `image` (legacy) */
    var list = Array.isArray(images) && images.length
      ? images.slice(0, 2).map(it => ({ data: (it && it.data) || "", mt: (it && it.mediaType) || "image/jpeg" }))
      : (image ? [{ data: image, mt: mediaType || "image/jpeg" }] : []);
    list = list.filter(it => it.data && typeof it.data === "string");
    if (!list.length) { res.status(400).json({ error: "image_required" }); return; }
    const imgBlocks = [];
    for (const it of list) {
      const b64 = it.data.includes(",") ? it.data.split(",").pop() : it.data;
      if (b64.length > 6000000) { res.status(413).json({ error: "image_too_large", message: "ఫోటో చాలా పెద్దది. దయచేసి చిన్న ఫోటో వాడండి." }); return; }
      const mt = /^image\/(jpeg|png|webp)$/.test(it.mt) ? it.mt : "image/jpeg";
      imgBlocks.push({ type: "image", source: { type: "base64", media_type: mt, data: b64 } });
    }

    const p = patient || {};
    const clip = (v, n) => (v == null ? "" : String(v)).slice(0, n);
    const ctx =
`Patient context (self-reported, may be incomplete):
- Focus: ${p.type === "hair" ? "Hair / scalp" : "Skin / nails"}
- Age: ${clip(p.age, 10) || "not given"}
- Gender: ${clip(p.gender, 20) || "not given"}
- Area of concern: ${clip(p.area, 80) || "not given"}
- Described problem: ${clip(p.details, 600) || "not given"}
- Photos provided: ${imgBlocks.length}${imgBlocks.length > 1 ? " (consider BOTH together — e.g. overall view + close-up/scalp)" : ""}

Provide general, educational observations of ${imgBlocks.length > 1 ? "THESE photos" : "THIS photo"} for the focus above, following ALL safety rules. Telugu-first bilingual text. Return only the JSON.`;

    const payload = {
      model: MODEL,
      max_tokens: 1900,
      system: SYSTEM,
      messages: [{
        role: "user",
        content: imgBlocks.concat([{ type: "text", text: ctx }])
      }],
      output_config: { format: { type: "json_schema", schema: SCHEMA } }
    };

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify(payload)
    });

    if (!r.ok) {
      const t = await r.text().catch(() => "");
      console.error("anthropic_error", r.status, t.slice(0, 400));
      res.status(502).json({ error: "ai_error", message: "AI విశ్లేషణ విఫలమైంది. దయచేసి కొద్దిసేపటి తర్వాత మళ్ళీ ప్రయత్నించండి." });
      return;
    }
    const data = await r.json();

    /* each successful Claude call consumes one of the 5 free uses */
    const newCount = usage.count + 1;
    const newToken = signUsage(ph, usage.start, newCount);
    const remaining = Math.max(0, LIMIT - newCount);

    if (data.stop_reason === "refusal") {
      res.status(200).json({ ok: true, usageToken: newToken, remaining: remaining, result: {
        imageUsable: false, scores: [],
        summary: "క్షమించండి, ఈ ఫోటోను విశ్లేషించలేకపోయాం. దయచేసి మా వైద్యులను నేరుగా సంప్రదించండి. Sorry, we couldn't analyze this photo — please consult our doctors directly.",
        observations: [], possibleFactors: [], selfCareTips: [], suggestedTreatments: [],
        severity: "recommend-consult", seeDoctorSoon: false, disclaimer: SAFE_DISCLAIMER
      }});
      return;
    }

    const textBlock = (data.content || []).find(b => b.type === "text");
    if (!textBlock) { res.status(502).json({ error: "empty_response" }); return; }
    let result;
    try { result = JSON.parse(textBlock.text); }
    catch (e) { console.error("parse_error", textBlock.text && textBlock.text.slice(0, 200)); res.status(502).json({ error: "parse_error" }); return; }

    if (!result.disclaimer) result.disclaimer = SAFE_DISCLAIMER;
    // Privacy: the image is never persisted — it lived only in this request.
    res.status(200).json({ ok: true, usageToken: newToken, remaining: remaining, result: result });
  } catch (e) {
    console.error("server_error", e && e.message);
    res.status(500).json({ error: "server_error", message: "సర్వర్ లోపం. దయచేసి మళ్ళీ ప్రయత్నించండి." });
  }
};
