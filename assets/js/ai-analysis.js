/* =====================================================================
   MEDICARE — AI Skin & Hair Analysis wizard (front-end)
   Talks to /api/send-otp, /api/verify-otp, /api/analyze.
   Add ?aidemo=1 to the URL to walk the flow without a backend (demo data).
   ===================================================================== */
(function () {
  "use strict";
  var mount = document.getElementById("aiskinMount");
  if (!mount) return;

  var DEMO = /[?&]aidemo=1/.test(location.search);
  var WA = "919141247777"; // Kaikaluru WhatsApp

  var state = { step: 0, type: "skin", patient: {}, phone: "", consentToken: "", image: "", mediaType: "image/jpeg", result: null };

  /* ---------- tiny helpers ---------- */
  function el(html) { var t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstChild; }
  function esc(s) { return (s == null ? "" : String(s)).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function digits(s) { return (s || "").replace(/\D/g, ""); }

  function api(path, body) {
    if (DEMO) return demo(path, body);
    return fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, status: r.status, json: j }; }); });
  }
  function demo(path, body) {
    return new Promise(function (res) {
      setTimeout(function () {
        if (path === "/api/send-otp") res({ ok: true, status: 200, json: { ok: true, mode: "dev", devHint: "123456" } });
        else if (path === "/api/verify-otp") {
          if (digits(body.code) === "123456") res({ ok: true, status: 200, json: { ok: true, consentToken: "demo.token" } });
          else res({ ok: false, status: 401, json: { message: "Demo: code 123456 వాడండి." } });
        } else if (path === "/api/analyze") {
          res({ ok: true, status: 200, json: { ok: true, result: {
            imageUsable: true,
            summary: "మీ ఫోటోలో మొటిమలు (acne) & స్వల్ప మచ్చలు కనిపిస్తున్నాయి. ఇది సాధారణంగా నయం చేయదగినది. Your photo shows mild acne with a few marks — commonly manageable.",
            observations: ["కొన్ని మొటిమలు & రెడ్‌నెస్ · a few active pimples and redness", "స్వల్ప మచ్చలు · mild post-acne marks"],
            possibleFactors: ["ఆయిల్ ఎక్కువ / hormonal మార్పులు · oily skin or hormonal changes", "సరైన skincare లేకపోవడం · irregular skincare"],
            selfCareTips: ["రోజుకు 2 సార్లు మృదువైన cleanser వాడండి", "sunscreen తప్పకుండా వాడండి", "మొటిమలను పిండవద్దు"],
            suggestedTreatments: ["Acne & acne-scar treatment", "Chemical peels", "Pigmentation/melasma treatment"],
            severity: "recommend-consult", seeDoctorSoon: false,
            disclaimer: "ఇది AI సాధారణ సమాచారం మాత్రమే — వైద్య నిర్ధారణ కాదు. ఖచ్చితమైన అంచనా కోసం మా వైద్యులను సంప్రదించండి."
          }}});
        } else res({ ok: false, status: 400, json: {} });
      }, path === "/api/analyze" ? 1400 : 500);
    });
  }

  /* ---------- image downscale (privacy + smaller upload) ---------- */
  function readImage(file, cb) {
    var img = new Image();
    img.onload = function () {
      var max = 1280, w = img.width, h = img.height;
      if (w > max || h > max) { if (w > h) { h = Math.round(h * max / w); w = max; } else { w = Math.round(w * max / h); h = max; } }
      var c = document.createElement("canvas"); c.width = w; c.height = h;
      c.getContext("2d").drawImage(img, 0, 0, w, h);
      cb(c.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = function () { cb(null); };
    var fr = new FileReader();
    fr.onload = function (e) { img.src = e.target.result; };
    fr.readAsDataURL(file);
  }

  /* ---------- progress ---------- */
  var STEPS = ["వివరాలు", "అనుమతి", "OTP", "ఫోటో", "ఫలితం"];
  function progress(active) {
    var dots = STEPS.map(function (s, i) {
      var cls = i < active ? "done" : (i === active ? "on" : "");
      return '<span class="aiskin__dot ' + cls + '"><b>' + (i + 1) + "</b>" + esc(s) + "</span>";
    }).join("");
    return '<div class="aiskin__steps" aria-hidden="true">' + dots + "</div>";
  }

  var DISCLAIMER =
    "⚠️ ఇది AI ద్వారా ఇచ్చే <strong>సాధారణ, విద్యాపరమైన</strong> సమాచారం మాత్రమే — <strong>వైద్య నిర్ధారణ (diagnosis) కాదు</strong>. " +
    "ఖచ్చితమైన అంచనా &amp; చికిత్స కోసం దయచేసి మా అర్హత గల చర్మవైద్య నిపుణులను సంప్రదించండి. మీ ఫోటో ఎక్కడా save చేయబడదు (100% గోప్యం).";

  /* ---------- renderers ---------- */
  function render() { mount.innerHTML = ""; mount.appendChild(views[state.step]()); }

  var views = {
    /* 0 — intro */
    0: function () {
      var v = el(
        '<div class="aiskin__card">' +
          '<div class="aiskin__intro">' +
            '<span class="aiskin__ai">✨ AI</span>' +
            "<h3>మీ చర్మం / జుట్టు — AI విశ్లేషణ</h3>" +
            "<p>ఫోటో అప్‌లోడ్ చేసి, కొన్ని సెకన్లలో <strong>సాధారణ విశ్లేషణ, సంరక్షణ చిట్కాలు &amp; తగిన చికిత్సల సూచన</strong> పొందండి. పూర్తిగా ఉచితం &amp; గోప్యం.</p>" +
            '<div class="aiskin__pick">' +
              '<button class="aiskin__pickbtn" data-type="skin"><span>🧴</span>చర్మం / గోళ్ళు<i>Skin / Nails</i></button>' +
              '<button class="aiskin__pickbtn" data-type="hair"><span>💇</span>జుట్టు / స్కాల్ప్<i>Hair / Scalp</i></button>' +
            "</div>" +
            '<p class="aiskin__note">' + DISCLAIMER + "</p>" +
          "</div>" +
        "</div>"
      );
      v.querySelectorAll(".aiskin__pickbtn").forEach(function (b) {
        b.addEventListener("click", function () { state.type = b.getAttribute("data-type"); state.step = 1; render(); });
      });
      return v;
    },

    /* 1 — patient details */
    1: function () {
      var v = el(
        '<div class="aiskin__card">' + progress(0) +
          '<h3 class="aiskin__h">మీ వివరాలు <i>Your details</i></h3>' +
          '<form class="aiskin__form" id="aiForm">' +
            '<label>వయసు · Age<input name="age" type="number" min="0" max="120" inputmode="numeric" placeholder="ఉదా. 25" required></label>' +
            "<label>లింగం · Gender<select name=\"gender\" required><option value=''>—</option><option>స్త్రీ / Female</option><option>పురుషుడు / Male</option><option>ఇతర / Other</option></select></label>" +
            '<label class="aiskin__full">సమస్య ఉన్న ప్రాంతం · Area<input name="area" maxlength="60" placeholder="ఉదా. ముఖం, తల, చేతులు" required></label>' +
            '<label class="aiskin__full">సమస్య వివరించండి · Describe the problem<textarea name="details" maxlength="500" rows="3" placeholder="ఉదా. 2 నెలలుగా మొటిమలు, దురద..."></textarea></label>' +
          "</form>" +
          '<div class="aiskin__actions"><button class="btn btn--ghost aiskin__back">← వెనక్కి</button><button class="btn btn--primary aiskin__next">కొనసాగించు →</button></div>' +
        "</div>"
      );
      v.querySelector(".aiskin__back").addEventListener("click", function () { state.step = 0; render(); });
      v.querySelector(".aiskin__next").addEventListener("click", function () {
        var f = v.querySelector("#aiForm");
        if (!f.reportValidity()) return;
        var d = new FormData(f);
        state.patient = { type: state.type, age: d.get("age"), gender: d.get("gender"), area: d.get("area"), details: d.get("details") };
        state.step = 2; render();
      });
      return v;
    },

    /* 2 — consent + phone */
    2: function () {
      var v = el(
        '<div class="aiskin__card">' + progress(1) +
          '<h3 class="aiskin__h">అనుమతి &amp; మొబైల్ ధృవీకరణ <i>Consent &amp; mobile verify</i></h3>' +
          '<div class="aiskin__consent">' +
            '<label class="aiskin__check"><input type="checkbox" id="aiConsent"><span>నా ఫోటో &amp; వివరాలను AI విశ్లేషణ కోసం ప్రాసెస్ చేయడానికి నేను అంగీకరిస్తున్నాను. ఇది వైద్య నిర్ధారణ కాదని, ఫోటో save చేయబడదని నాకు తెలుసు. <i>I consent to AI processing of my photo &amp; details; I understand this is not a diagnosis and my photo is not stored.</i></span></label>' +
          "</div>" +
          '<label class="aiskin__phone">మొబైల్ నంబర్ · Mobile number<div class="aiskin__phonerow"><span>+91</span><input id="aiPhone" type="tel" inputmode="numeric" maxlength="10" placeholder="10 అంకెల నంబర్"></div></label>' +
          '<p class="aiskin__err" id="aiErr2"></p>' +
          '<div class="aiskin__actions"><button class="btn btn--ghost aiskin__back">← వెనక్కి</button><button class="btn btn--primary aiskin__next">OTP పంపు →</button></div>' +
        "</div>"
      );
      v.querySelector(".aiskin__back").addEventListener("click", function () { state.step = 1; render(); });
      var err = v.querySelector("#aiErr2");
      v.querySelector(".aiskin__next").addEventListener("click", function () {
        err.textContent = "";
        if (!v.querySelector("#aiConsent").checked) { err.textContent = "దయచేసి అనుమతి ఇవ్వండి."; return; }
        var ph = digits(v.querySelector("#aiPhone").value);
        if (ph.length !== 10) { err.textContent = "10 అంకెల సరైన మొబైల్ నంబర్ ఇవ్వండి."; return; }
        state.phone = ph;
        var btn = v.querySelector(".aiskin__next"); btn.disabled = true; btn.textContent = "పంపుతోంది…";
        api("/api/send-otp", { phone: ph }).then(function (r) {
          if (r.ok && r.json.ok) { state.devHint = r.json.devHint || ""; state.step = 3; render(); }
          else { err.textContent = (r.json && r.json.message) || "OTP పంపడంలో సమస్య."; btn.disabled = false; btn.textContent = "OTP పంపు →"; }
        }).catch(function () { err.textContent = "నెట్‌వర్క్ సమస్య. మళ్ళీ ప్రయత్నించండి."; btn.disabled = false; btn.textContent = "OTP పంపు →"; });
      });
      return v;
    },

    /* 3 — OTP */
    3: function () {
      var hint = state.devHint ? '<p class="aiskin__hint">🔑 Test/DEV OTP: <b>' + esc(state.devHint) + "</b> (Twilio configure చేసాక ఇది రాదు)</p>" : "";
      var v = el(
        '<div class="aiskin__card">' + progress(2) +
          '<h3 class="aiskin__h">OTP నమోదు చేయండి <i>Enter OTP</i></h3>' +
          "<p class=\"aiskin__sub\">+91 " + esc(state.phone) + " కి పంపిన కోడ్ ఎంటర్ చేయండి.</p>" + hint +
          '<input id="aiOtp" class="aiskin__otp" type="text" inputmode="numeric" maxlength="6" placeholder="______">' +
          '<p class="aiskin__err" id="aiErr3"></p>' +
          '<div class="aiskin__actions"><button class="btn btn--ghost aiskin__back">← మార్చు</button><button class="btn btn--primary aiskin__next">ధృవీకరించు →</button></div>' +
        "</div>"
      );
      v.querySelector(".aiskin__back").addEventListener("click", function () { state.step = 2; render(); });
      var err = v.querySelector("#aiErr3");
      v.querySelector(".aiskin__next").addEventListener("click", function () {
        err.textContent = "";
        var code = digits(v.querySelector("#aiOtp").value);
        if (code.length < 4) { err.textContent = "OTP కోడ్ ఎంటర్ చేయండి."; return; }
        var btn = v.querySelector(".aiskin__next"); btn.disabled = true; btn.textContent = "ధృవీకరిస్తోంది…";
        api("/api/verify-otp", { phone: state.phone, code: code }).then(function (r) {
          if (r.ok && r.json.ok && r.json.consentToken) { state.consentToken = r.json.consentToken; state.step = 4; render(); }
          else { err.textContent = (r.json && r.json.message) || "OTP సరిగ్గా లేదు."; btn.disabled = false; btn.textContent = "ధృవీకరించు →"; }
        }).catch(function () { err.textContent = "నెట్‌వర్క్ సమస్య."; btn.disabled = false; btn.textContent = "ధృవీకరించు →"; });
      });
      return v;
    },

    /* 4 — photo */
    4: function () {
      var v = el(
        '<div class="aiskin__card">' + progress(3) +
          '<h3 class="aiskin__h">ఫోటో అప్‌లోడ్ చేయండి <i>Upload a clear photo</i></h3>' +
          '<p class="aiskin__sub">సమస్య ఉన్న ప్రాంతం యొక్క <strong>స్పష్టమైన, వెలుతురులో</strong> క్లోజ్-అప్ ఫోటో తీయండి.</p>' +
          '<label class="aiskin__drop" id="aiDrop"><input id="aiFile" type="file" accept="image/*" capture="environment" hidden>' +
            '<span class="aiskin__dropinner"><b>📷</b> ఫోటో ఎంచుకోండి / తీయండి<i>Tap to take or choose a photo</i></span>' +
          "</label>" +
          '<div class="aiskin__preview" id="aiPrev" hidden></div>' +
          '<p class="aiskin__err" id="aiErr4"></p>' +
          '<div class="aiskin__actions"><button class="btn btn--ghost aiskin__back">← వెనక్కి</button><button class="btn btn--primary aiskin__next" disabled>విశ్లేషించు ✨</button></div>' +
        "</div>"
      );
      var next = v.querySelector(".aiskin__next"), prev = v.querySelector("#aiPrev"), err = v.querySelector("#aiErr4");
      v.querySelector(".aiskin__back").addEventListener("click", function () { state.step = 3; render(); });
      v.querySelector("#aiFile").addEventListener("change", function (e) {
        var file = e.target.files && e.target.files[0]; if (!file) return;
        err.textContent = "";
        readImage(file, function (dataUrl) {
          if (!dataUrl) { err.textContent = "ఫోటో చదవలేకపోయాం. మరో ఫోటో ప్రయత్నించండి."; return; }
          state.image = dataUrl; state.mediaType = "image/jpeg";
          prev.hidden = false; prev.innerHTML = '<img src="' + dataUrl + '" alt="preview"><button class="aiskin__retake">మార్చు</button>';
          prev.querySelector(".aiskin__retake").addEventListener("click", function () { state.image = ""; prev.hidden = true; prev.innerHTML = ""; next.disabled = true; v.querySelector("#aiFile").value = ""; });
          next.disabled = false;
        });
      });
      next.addEventListener("click", function () {
        if (!state.image) return;
        state.step = 5; render(); runAnalysis();
      });
      return v;
    },

    /* 5 — analyzing */
    5: function () {
      return el(
        '<div class="aiskin__card aiskin__loading">' +
          '<div class="aiskin__spin"></div>' +
          "<h3>AI విశ్లేషిస్తోంది…</h3>" +
          "<p>మీ ఫోటోను మా AI పరిశీలిస్తోంది. కొన్ని సెకన్లు వేచి ఉండండి.</p>" +
        "</div>"
      );
    },

    /* 6 — result */
    6: function () {
      var r = state.result || {};
      function list(arr, cls) {
        if (!arr || !arr.length) return "";
        return '<ul class="aiskin__list ' + (cls || "") + '">' + arr.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>";
      }
      var soon = r.seeDoctorSoon
        ? '<div class="aiskin__soon">⚕️ మంచిది త్వరగా మా వైద్యులను స్వయంగా సంప్రదించండి. <i>Please see our dermatologist in person soon.</i></div>' : "";
      var body;
      if (r.imageUsable === false) {
        body =
          '<div class="aiskin__result">' +
            '<p class="aiskin__summary">' + esc(r.summary || "ఫోటో స్పష్టంగా లేదు. దయచేసి మంచి వెలుతురులో, క్లోజ్-అప్ ఫోటో మళ్ళీ అప్‌లోడ్ చేయండి.") + "</p>" +
            '<div class="aiskin__actions"><button class="btn btn--primary aiskin__retry">మళ్ళీ ఫోటో ✨</button></div>' +
          "</div>";
      } else {
        body =
          '<div class="aiskin__result">' + soon +
            (r.summary ? '<p class="aiskin__summary">' + esc(r.summary) + "</p>" : "") +
            (r.observations && r.observations.length ? "<h4>👁️ కనిపించినవి · Observations</h4>" + list(r.observations) : "") +
            (r.possibleFactors && r.possibleFactors.length ? "<h4>🔎 సాధ్యమయ్యే కారణాలు · Possible factors</h4>" + list(r.possibleFactors) : "") +
            (r.selfCareTips && r.selfCareTips.length ? "<h4>🌿 సంరక్షణ చిట్కాలు · Self-care tips</h4>" + list(r.selfCareTips) : "") +
            (r.suggestedTreatments && r.suggestedTreatments.length ? '<h4>💠 సూచించిన చికిత్సలు · Suggested at Medicare</h4><div class="aiskin__tags">' + r.suggestedTreatments.map(function (t) { return "<span>" + esc(t) + "</span>"; }).join("") + "</div>" : "") +
            '<p class="aiskin__disc">' + esc(r.disclaimer || "") + "</p>" +
            '<div class="aiskin__cta">' +
              '<a class="btn btn--primary" href="#contact">📅 అపాయింట్‌మెంట్ బుక్ చేయండి</a>' +
              '<a class="btn btn--ghost" target="_blank" rel="noopener" href="https://wa.me/' + WA + '?text=' + encodeURIComponent("నమస్తే, AI analysis చేసా — consultation కావాలి.") + '">💬 WhatsApp</a>' +
              '<button class="btn btn--ghost aiskin__retry">🔄 మరొక ఫోటో</button>' +
            "</div>" +
          "</div>";
      }
      var v = el('<div class="aiskin__card">' + progress(4) + '<h3 class="aiskin__h">AI ఫలితం <i>Your AI result</i></h3>' + body + "</div>");
      var rt = v.querySelector(".aiskin__retry");
      if (rt) rt.addEventListener("click", function () { state.image = ""; state.result = null; state.step = 4; render(); });
      return v;
    }
  };

  function runAnalysis() {
    api("/api/analyze", { image: state.image, mediaType: state.mediaType, patient: state.patient, consentToken: state.consentToken })
      .then(function (r) {
        if (r.ok && r.json.ok && r.json.result) { state.result = r.json.result; state.step = 6; render(); return; }
        if (r.status === 401) { alert("మీ ధృవీకరణ గడువు ముగిసింది. దయచేసి మళ్ళీ OTP ధృవీకరించండి."); state.step = 2; render(); return; }
        state.result = { imageUsable: true, summary: (r.json && r.json.message) || "AI విశ్లేషణ విఫలమైంది. దయచేసి మళ్ళీ ప్రయత్నించండి, లేదా మా వైద్యులను సంప్రదించండి.", severity: "recommend-consult", disclaimer: "" };
        state.step = 6; render();
      })
      .catch(function () {
        state.result = { imageUsable: true, summary: "నెట్‌వర్క్ సమస్య. దయచేసి మళ్ళీ ప్రయత్నించండి.", disclaimer: "" };
        state.step = 6; render();
      });
  }

  render();
})();
