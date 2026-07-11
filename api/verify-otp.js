// =====================================================================
//  /api/verify-otp  —  verify the OTP and issue a signed consent token
//
//  On success it returns a short-lived (30 min) HMAC-signed consent token
//  that /api/analyze requires. No database is used — the token is stateless.
//
//  DEV MODE (default): accepts code 123456 (or DEV_OTP env var).
//  PRODUCTION: with the Twilio env vars set (see send-otp.js) it verifies
//  the real code via Twilio Verify.
//
//  Required env var: CONSENT_SECRET (long random string; MUST match analyze.js)
// =====================================================================
const crypto = require("crypto");
const CONSENT_SECRET = process.env.CONSENT_SECRET || "DEV_INSECURE_change_me_set_CONSENT_SECRET";

function hasTwilio() {
  return process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_VERIFY_SERVICE_SID;
}
function toE164(d) { return d.length === 10 ? "+91" + d : "+" + d; }

function issueConsent(phone) {
  const payload = { consent: true, phone, iat: Date.now(), exp: Date.now() + 30 * 60 * 1000, v: 1 };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", CONSENT_SECRET).update(body).digest("base64url");
  return body + "." + sig;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ error: "method_not_allowed" }); return; }
  const { phone, code } = req.body || {};
  const clean = (phone || "").toString().replace(/\D/g, "");
  const otp = (code || "").toString().replace(/\D/g, "");
  if (clean.length < 10 || otp.length < 4) { res.status(400).json({ error: "invalid_input", message: "OTP సరిగ్గా ఇవ్వండి." }); return; }

  if (hasTwilio()) {
    try {
      const sid = process.env.TWILIO_ACCOUNT_SID, tok = process.env.TWILIO_AUTH_TOKEN, svc = process.env.TWILIO_VERIFY_SERVICE_SID;
      const r = await fetch(`https://verify.twilio.com/v2/Services/${svc}/VerificationCheck`, {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          "authorization": "Basic " + Buffer.from(sid + ":" + tok).toString("base64")
        },
        body: new URLSearchParams({ To: toE164(clean), Code: otp })
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.status === "approved") { res.status(200).json({ ok: true, consentToken: issueConsent(clean) }); return; }
      res.status(401).json({ error: "otp_invalid", message: "OTP సరిగ్గా లేదు లేదా గడువు ముగిసింది. మళ్ళీ ప్రయత్నించండి." });
    } catch (e) {
      console.error("server_error", e && e.message);
      res.status(500).json({ error: "server_error" });
    }
    return;
  }

  // ---- DEV MODE ----
  if (otp === (process.env.DEV_OTP || "123456")) {
    res.status(200).json({ ok: true, mode: "dev", consentToken: issueConsent(clean) });
    return;
  }
  res.status(401).json({ error: "otp_invalid", message: "DEV mode: code 123456 వాడండి. (Production కోసం Twilio configure చేయండి.)" });
};
