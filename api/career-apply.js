// =====================================================================
//  /api/career-apply — deliver careers-form applications by email
//  Uses Resend (https://resend.com) REST API via built-in fetch.
//
//  Setup (one time):
//    1. Sign up at resend.com USING the recipient inbox (b.n.raaz@gmail.com)
//       — free tier: 100 emails/day, no domain verification needed when
//       sending to your own account email from onboarding@resend.dev.
//    2. Resend dashboard → API Keys → Create → copy (starts "re_").
//    3. Vercel → Project → Settings → Environment Variables:
//         RESEND_API_KEY = re_xxxxxxxx
//       (optional) CAREERS_TO = a different recipient email
//    4. Redeploy. The careers form automatically starts using this
//       endpoint (it falls back to FormSubmit/WhatsApp until then).
// =====================================================================
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO = process.env.CAREERS_TO || "b.n.raaz@gmail.com";

function esc(s) {
  return (s == null ? "" : String(s)).slice(0, 600)
    .replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

module.exports = async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ error: "method_not_allowed" }); return; }
  try {
    if (!RESEND_API_KEY) { res.status(503).json({ error: "not_configured" }); return; }
    const b = req.body || {};
    if ((b._honey || "").length) { res.status(200).json({ ok: true }); return; }   // bot trap
    const name = esc(b.name), phone = esc(b.phone), position = esc(b.position);
    if (!name || !phone || !position) { res.status(400).json({ error: "missing_fields" }); return; }

    const rows = [
      ["Name", name], ["Phone", phone], ["Email", esc(b.email) || "-"],
      ["Position", position], ["Experience", esc(b.experience) || "-"],
      ["Preferred Branch", esc(b.preferred_branch) || "-"],
      ["Qualification", esc(b.qualification) || "-"],
      ["Resume Link", esc(b.resume_link) || "-"], ["Message", esc(b.message) || "-"]
    ].map(r =>
      '<tr><td style="padding:8px 12px;border:1px solid #eee;background:#faf7f9;font-weight:600">' + r[0] +
      '</td><td style="padding:8px 12px;border:1px solid #eee">' + r[1] + "</td></tr>"
    ).join("");

    const html =
      '<div style="font-family:Arial,sans-serif;max-width:560px">' +
      '<h2 style="color:#BE2F79;margin:0 0 4px">New Career Application</h2>' +
      '<p style="color:#777;margin:0 0 14px">medicareskinandhairclinic.com/careers.html</p>' +
      '<table style="border-collapse:collapse;width:100%">' + rows + "</table></div>";

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer " + RESEND_API_KEY },
      body: JSON.stringify({
        from: "Medicare Careers <onboarding@resend.dev>",
        to: [TO],
        reply_to: b.email && /.+@.+\..+/.test(b.email) ? String(b.email).slice(0, 120) : undefined,
        subject: "Career Application - " + position + " - " + name,
        html: html
      })
    });
    if (!r.ok) {
      const t = await r.text().catch(() => "");
      console.error("resend_error", r.status, t.slice(0, 300));
      res.status(502).json({ error: "send_failed" });
      return;
    }
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error("career_apply_error", e && e.message);
    res.status(500).json({ error: "server_error" });
  }
};
