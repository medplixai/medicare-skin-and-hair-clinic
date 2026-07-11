// =====================================================================
//  /api/send-otp  —  send a mobile OTP to confirm consent
//
//  DEV MODE (default): no OTP provider configured → returns a dev hint
//    so you can test the flow now (use code 123456 on the next step).
//  PRODUCTION: set the Twilio Verify env vars below and this switches to
//    real OTP delivery automatically — no code change needed.
//      TWILIO_ACCOUNT_SID
//      TWILIO_AUTH_TOKEN
//      TWILIO_VERIFY_SERVICE_SID
//      OTP_CHANNEL      (optional: "sms" | "whatsapp" | "call", default "sms")
//  NOTE: Indian SMS also needs DLT sender registration — see AI-ANALYSIS-SETUP.md
// =====================================================================
function hasTwilio() {
  return process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_VERIFY_SERVICE_SID;
}
function toE164(digits) {
  return digits.length === 10 ? "+91" + digits : "+" + digits;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ error: "method_not_allowed" }); return; }
  const { phone } = req.body || {};
  const clean = (phone || "").toString().replace(/\D/g, "");
  if (clean.length < 10 || clean.length > 13) {
    res.status(400).json({ error: "invalid_phone", message: "దయచేసి సరైన మొబైల్ నంబర్ ఇవ్వండి." });
    return;
  }

  if (hasTwilio()) {
    try {
      const sid = process.env.TWILIO_ACCOUNT_SID, tok = process.env.TWILIO_AUTH_TOKEN, svc = process.env.TWILIO_VERIFY_SERVICE_SID;
      const r = await fetch(`https://verify.twilio.com/v2/Services/${svc}/Verifications`, {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          "authorization": "Basic " + Buffer.from(sid + ":" + tok).toString("base64")
        },
        body: new URLSearchParams({ To: toE164(clean), Channel: process.env.OTP_CHANNEL || "sms" })
      });
      if (!r.ok) {
        const t = await r.text().catch(() => "");
        console.error("twilio_send_error", r.status, t.slice(0, 300));
        res.status(502).json({ error: "otp_send_failed", message: "OTP పంపడంలో సమస్య. దయచేసి మళ్ళీ ప్రయత్నించండి." });
        return;
      }
      res.status(200).json({ ok: true, mode: "sms" });
    } catch (e) {
      console.error("server_error", e && e.message);
      res.status(500).json({ error: "server_error" });
    }
    return;
  }

  // ---- DEV MODE (no OTP provider yet) ----
  res.status(200).json({ ok: true, mode: "dev", devHint: process.env.DEV_OTP || "123456" });
};
