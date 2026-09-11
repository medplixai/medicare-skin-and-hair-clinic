// =====================================================================
//  /api/lead — send a website enquiry to the Medicare growth platform
//
//  The platform (the Medicare Hospitals Next.js app + Supabase) is the one
//  CRM for the whole group. Every skin-clinic enquiry lands there as a lead
//  tagged org_slug = "medicare-skin" and the branch the visitor chose, so
//  the branch desk and the WhatsApp agent see the same person.
//
//  Called by the appointment form (main.js) and the AI analysis (ai-analysis.js).
//  Fire-and-forget on the client: the WhatsApp hand-off happens regardless.
//
//  Env (Vercel → Settings → Environment Variables), all optional:
//    PLATFORM_URL   — defaults to https://medicarehospitals.in
// =====================================================================
const PLATFORM_URL = (process.env.PLATFORM_URL || "https://medicarehospitals.in").replace(/\/$/, "");
const ORG = "medicare-skin";
const HQ = "ms-kaikaluru";

/* Telugu / English branch labels (as the form and pages write them) → branches.id on the platform. */
const BRANCHES = [
  ["ms-kaikaluru", ["కైకలూరు", "kaikaluru", "kaikalur"]],
  ["ms-bhimavaram", ["భీమవరం", "bhimavaram"]],
  ["ms-eluru", ["ఏలూరు", "eluru"]],
  ["ms-gudivada", ["గుడివాడ", "gudivada"]],
  ["ms-gannavaram", ["గన్నవరం", "gannavaram"]],
  ["ms-nuzvid", ["నూజివీడు", "nuzvid", "nuzivid"]],
  ["ms-akividu", ["ఆకివీడు", "akividu", "akivid"]],
  ["ms-tadepalligudem", ["తాడేపల్లిగూడెం", "tadepalligudem"]],
  ["ms-machilipatnam", ["మచిలీపట్నం", "machilipatnam"]],
  ["ms-ongole", ["ఒంగోలు", "ongole"]],
];

function branchId(label) {
  const s = (label || "").toString().toLowerCase();
  if (!s) return null;
  if (/^ms-[a-z]+$/.test(s)) return BRANCHES.some(b => b[0] === s) ? s : null;
  for (const [id, names] of BRANCHES) if (names.some(n => s.indexOf(n) > -1)) return id;
  return null; // "ఏదైనా / దగ్గర్లోని శాఖ" → head office decides
}

function clip(v, n) { return (v == null ? "" : String(v)).replace(/\s+/g, " ").trim().slice(0, n); }

module.exports = async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ error: "method_not_allowed" }); return; }
  const b = req.body || {};
  if ((b._honey || "").length) { res.status(200).json({ ok: true }); return; }   // bot trap

  const phone = clip(b.phone, 15).replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
  if (!/^[6-9]\d{9}$/.test(phone)) { res.status(400).json({ error: "invalid_phone" }); return; }

  const branch = branchId(b.branch) || HQ;
  const kind = b.kind === "ai_analysis" ? "ai_analysis" : "appointment_form";
  const parts = [];
  if (kind === "appointment_form") {
    if (b.service) parts.push("సేవ: " + clip(b.service, 60));
    if (b.branch) parts.push("శాఖ: " + clip(b.branch, 60));
    if (b.message) parts.push(clip(b.message, 500));
  } else {
    parts.push("AI skin/hair analysis on the website");
    if (b.concern) parts.push("concern: " + clip(b.concern, 80));
    if (b.age) parts.push("age " + clip(b.age, 3));
    if (b.severity) parts.push("severity: " + clip(b.severity, 30) + (b.seeDoctorSoon ? " (see doctor soon)" : ""));
    if (b.summary) parts.push(clip(b.summary, 300));
  }

  const payload = {
    org_slug: ORG,
    branch_id: branch,
    name: clip(b.name, 100) || null,
    phone,
    source: "website",
    department_slug: null,
    message: parts.join(" · ") || null,
    attribution: {
      utm_source: clip(b.utm_source, 60) || "medicareskinandhairclinic.com",
      utm_medium: kind,
      utm_campaign: clip(b.utm_campaign, 100) || null,
      utm_content: clip(b.utm_content, 100) || null,
      landing_page: clip(b.page || req.headers.referer, 200) || null,
    },
  };

  try {
    const r = await fetch(PLATFORM_URL + "/api/leads", {
      method: "POST",
      headers: { "content-type": "application/json", "user-agent": "medicare-skin-site/1.0" },
      body: JSON.stringify(payload),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { console.error("[lead] platform", r.status, j); res.status(200).json({ ok: false, error: "platform_" + r.status }); return; }
    res.status(200).json({ ok: true, leadId: j.leadId || null, branch });
  } catch (e) {
    console.error("[lead] forward failed", e && e.message);
    res.status(200).json({ ok: false, error: "forward_failed" });
  }
};

module.exports.branchId = branchId;
