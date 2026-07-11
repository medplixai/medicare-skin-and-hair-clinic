// =====================================================================
//  /api/analyze  —  AI Skin & Hair Analysis (Claude Opus 4.8 vision)
//  Serverless function (Vercel Node runtime). No dependencies: uses the
//  built-in fetch + crypto. The uploaded photo is analyzed in-memory and
//  is NEVER stored (privacy-first). A valid signed consent token (issued
//  by /api/verify-otp after OTP) is required.
//
//  Required env vars (set in Vercel → Project → Settings → Environment):
//    ANTHROPIC_API_KEY   — your Anthropic API key (billing)
//    CONSENT_SECRET      — a long random string (HMAC secret for consent tokens)
// =====================================================================
const crypto = require("crypto");

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const CONSENT_SECRET = process.env.CONSENT_SECRET || "DEV_INSECURE_change_me_set_CONSENT_SECRET";
const MODEL = "claude-opus-4-8";

/* ---- consent token verification (HMAC, must match /api/verify-otp) ---- */
function verifyConsent(token) {
  try {
    if (!token || typeof token !== "string") return null;
    const [body, sig] = token.split(".");
    if (!body || !sig) return null;
    const expected = crypto.createHmac("sha256", CONSENT_SECRET).update(body).digest("base64url");
    const a = Buffer.from(sig), b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!payload.consent || !payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch (e) { return null; }
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

STYLE: Write summary, observations, possibleFactors and selfCareTips BILINGUALLY — Telugu first, then a short English phrase — in a warm, simple, reassuring tone. suggestedTreatments must be chosen ONLY from services Medicare actually offers: ${TREATMENTS}. Return ONLY the JSON described by the schema.`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["imageUsable", "summary", "observations", "possibleFactors", "selfCareTips", "suggestedTreatments", "severity", "seeDoctorSoon", "disclaimer"],
  properties: {
    imageUsable: { type: "boolean" },
    summary: { type: "string" },
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
    const { image, mediaType, patient, consentToken } = req.body || {};

    const consent = verifyConsent(consentToken);
    if (!consent) { res.status(401).json({ error: "consent_required", message: "మీ అనుమతి/OTP ధృవీకరణ అవసరం లేదా గడువు ముగిసింది. దయచేసి మళ్ళీ ధృవీకరించండి." }); return; }

    if (!image || typeof image !== "string") { res.status(400).json({ error: "image_required" }); return; }
    const b64 = image.includes(",") ? image.split(",").pop() : image;
    if (b64.length > 6000000) { res.status(413).json({ error: "image_too_large", message: "ఫోటో చాలా పెద్దది. దయచేసి చిన్న ఫోటో వాడండి." }); return; }
    const mt = (mediaType && /^image\/(jpeg|png|webp)$/.test(mediaType)) ? mediaType : "image/jpeg";

    const p = patient || {};
    const clip = (v, n) => (v == null ? "" : String(v)).slice(0, n);
    const ctx =
`Patient context (self-reported, may be incomplete):
- Focus: ${p.type === "hair" ? "Hair / scalp" : "Skin / nails"}
- Age: ${clip(p.age, 10) || "not given"}
- Gender: ${clip(p.gender, 20) || "not given"}
- Area of concern: ${clip(p.area, 80) || "not given"}
- Described problem: ${clip(p.details, 600) || "not given"}

Provide general, educational observations of THIS photo for the focus above, following ALL safety rules. Telugu-first bilingual text. Return only the JSON.`;

    const payload = {
      model: MODEL,
      max_tokens: 1600,
      system: SYSTEM,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mt, data: b64 } },
          { type: "text", text: ctx }
        ]
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

    if (data.stop_reason === "refusal") {
      res.status(200).json({ ok: true, result: {
        imageUsable: false,
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
    res.status(200).json({ ok: true, result });
  } catch (e) {
    console.error("server_error", e && e.message);
    res.status(500).json({ error: "server_error", message: "సర్వర్ లోపం. దయచేసి మళ్ళీ ప్రయత్నించండి." });
  }
};
