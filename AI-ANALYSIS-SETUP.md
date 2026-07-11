# AI Skin & Hair Analysis — setup & go-live

This feature adds a **functional** AI analysis tool to the home page (`#ai-analysis`):
**details → consent → mobile OTP → photo → Claude Vision analysis → results**.

It uses **Vercel Serverless Functions** in `/api/` (no new hosting). The photo is
analyzed in‑memory and **never stored**. Consent is a short‑lived HMAC‑signed
token, so **no database** is needed.

```
/api/analyze.js      → Claude Opus 4.8 vision, returns structured JSON
/api/send-otp.js     → sends OTP (dev mode now; Twilio when configured)
/api/verify-otp.js   → verifies OTP → issues signed consent token
assets/js/ai-analysis.js  → the front-end wizard
```

No npm dependencies — the functions use Node's built‑in `fetch` + `crypto`.

---

## 1. Make it live (minimum — enables the AI)

In **Vercel → your project → Settings → Environment Variables**, add:

| Name | Value |
|---|---|
| `ANTHROPIC_API_KEY` | Your Anthropic API key (from console.anthropic.com — billing must be enabled) |
| `CONSENT_SECRET` | A long random string, e.g. run `openssl rand -hex 32` and paste the result |

Redeploy. That's it — the AI analysis now works. **OTP runs in DEV mode** until
you do step 2: the code shown on screen is `123456` (a test code).

> ⚠️ Do **not** leave OTP in DEV mode in production — anyone can pass `123456`.
> Complete step 2 before promoting this as a real patient feature.

---

## 2. Turn on real Mobile OTP (Twilio Verify)

1. Create a Twilio account → **Verify → Services → Create** → copy the **Service SID**.
2. Add these env vars in Vercel:

| Name | Value |
|---|---|
| `TWILIO_ACCOUNT_SID` | From Twilio console |
| `TWILIO_AUTH_TOKEN` | From Twilio console |
| `TWILIO_VERIFY_SERVICE_SID` | The Verify Service SID (starts `VA...`) |
| `OTP_CHANNEL` | `sms` (default) or `whatsapp` |

3. Redeploy. `send-otp` / `verify-otp` automatically switch from DEV to real
   Twilio Verify — no code change. The on‑screen "test code" hint disappears.

**India note:** Indian SMS requires **DLT registration** of your sender/templates
(TRAI rule). Twilio guides this, or use `OTP_CHANNEL=whatsapp` (your clinic is
already WhatsApp‑first) to avoid SMS DLT. Cheaper Indian option: MSG91/Fast2SMS —
tell me and I'll wire it.

---

## 3. Test it now (no backend needed)

Open the site with `?aidemo=1` (e.g. `medicareskinandhairclinic.com/?aidemo=1`).
The wizard runs end‑to‑end on demo data — use OTP `123456`. Great for showing the
UX before keys are set.

---

## Cost & safety notes

- Each analysis is one Claude Opus 4.8 vision call (image is downscaled to ~1280px
  client‑side). Rough cost ≈ **a few cents per analysis**. The OTP gate + consent
  token limit abuse; add a per‑IP rate limit later if volume grows.
- Every result carries a prominent **"not a diagnosis — consult our dermatologist"**
  disclaimer. The model is instructed to never name cancer/serious disease, never
  give prescriptions, and to ask for a clearer photo when the image isn't usable.
- Photos and patient details are **not persisted** anywhere (privacy‑first).
