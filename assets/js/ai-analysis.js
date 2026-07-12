/* =====================================================================
   MEDICARE — AI Skin & Hair Analysis  (v3, DermaLuxe-style flow)
   Pitch is static HTML; clicking Start reveals a 3-step flow:
   1 వివరాలు → 2 ఫోటో → 3 ఫలితం.  No OTP for now — access is limited to
   5 analyses per mobile number per 90 days via a server-signed token.
   Add ?aidemo=1 to walk the flow without a backend.
   ===================================================================== */
(function () {
  "use strict";
  var flow = document.getElementById("aiskinFlow");
  var startBtn = document.getElementById("aiStart");
  if (!flow || !startBtn) return;

  var DEMO = /[?&]aidemo=1/.test(location.search);
  var WA = "919141247777";
  var REDUCE = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var LS_KEY = DEMO ? "medicareAiUsageDemo" : "medicareAiUsage";

  var state = {
    view: "details",
    name: "", phone: "", age: "", gender: "", concern: "",
    image: "", mediaType: "image/jpeg", dim: false,
    result: null, remaining: null, limitMsg: "",
    cleanup: null
  };

  var CONCERN_OPTS = [
    ["మొటిమలు / మచ్చలు", "Acne / Pimples", "skin"],
    ["పిగ్మెంటేషన్ / నల్ల మచ్చలు", "Pigmentation / Dark spots", "skin"],
    ["జుట్టు రాలడం / పలచబడటం", "Hair fall / Thinning", "hair"],
    ["చుండ్రు / స్కాల్ప్ సమస్య", "Dandruff / Scalp", "hair"],
    ["ముడతలు / వృద్ధాప్య ఛాయలు", "Ageing / Wrinkles", "skin"],
    ["దురద / తామర / ఇన్ఫెక్షన్", "Itch / Eczema / Infection", "skin"],
    ["గోళ్ళ సమస్య", "Nail issue", "skin"],
    ["జనరల్ చెక్", "General check", "skin"]
  ];

  /* ----------------------------- helpers ----------------------------- */
  function el(html) { var t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstChild; }
  function esc(s) { return (s == null ? "" : String(s)).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function digits(s) { return (s || "").replace(/\D/g, ""); }

  function loadUsage() { try { return JSON.parse(localStorage.getItem(LS_KEY) || "null") || {}; } catch (e) { return {}; } }
  function saveUsage(u) { try { localStorage.setItem(LS_KEY, JSON.stringify(u)); } catch (e) {} }

  function api(path, body) {
    if (DEMO) return demo(path, body);
    return fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, status: r.status, json: j }; }); });
  }
  function demo(path, body) {
    return new Promise(function (res) {
      setTimeout(function () {
        var u = loadUsage();
        var used = (u.phone === body.phone && u.used) ? u.used : 0;
        if (used >= 5) { res({ ok: false, status: 429, json: { error: "limit_reached", remaining: 0, message: "ఈ నంబర్‌కు 90 రోజుల్లో 5 ఉచిత AI విశ్లేషణలు పూర్తయ్యాయి. మా వైద్యులను సంప్రదించండి 🌸" } }); return; }
        saveUsage({ phone: body.phone, used: used + 1, token: "demo" });
        res({ ok: true, status: 200, json: { ok: true, usageToken: "demo", remaining: 5 - (used + 1), result: {
          imageUsable: true,
          summary: "మీ ఫోటోలో మొటిమలు (acne) & స్వల్ప మచ్చలు కనిపిస్తున్నాయి — ఇది సాధారణంగా చికిత్సతో మెరుగుపడుతుంది. Your photo shows mild acne with a few marks; commonly manageable with care.",
          observations: ["కొన్ని active మొటిమలు & రెడ్‌నెస్ · a few active pimples with redness", "స్వల్ప post-acne మచ్చలు · mild post-acne marks"],
          possibleFactors: ["ఆయిల్ స్కిన్ / hormonal మార్పులు · oily skin or hormonal changes", "సరిపడని skincare · irregular skincare routine"],
          selfCareTips: ["రోజుకు 2 సార్లు మృదువైన cleanser వాడండి", "బయటికి వెళ్ళేటప్పుడు sunscreen తప్పనిసరి", "మొటిమలను గిల్లవద్దు / పిండవద్దు"],
          suggestedTreatments: ["Acne & acne-scar treatment", "Chemical peels", "HydraFacial"],
          severity: "recommend-consult", seeDoctorSoon: false,
          disclaimer: "ఇది AI సాధారణ సమాచారం మాత్రమే — వైద్య నిర్ధారణ కాదు. ఖచ్చితమైన అంచనా కోసం మా వైద్యులను సంప్రదించండి."
        }}});
      }, path === "/api/analyze" ? 2400 : 300);
    });
  }

  /* photo: downscale + brightness check */
  function readImage(file, cb) {
    var img = new Image();
    img.onload = function () {
      var max = 1280, w = img.width, h = img.height;
      if (w > max || h > max) { if (w > h) { h = Math.round(h * max / w); w = max; } else { w = Math.round(w * max / h); h = max; } }
      var c = document.createElement("canvas"); c.width = w; c.height = h;
      var x = c.getContext("2d"); x.drawImage(img, 0, 0, w, h);
      var dim = false;
      try {
        var d = x.getImageData(0, 0, w, h).data, sum = 0, n = 0;
        for (var i = 0; i < d.length; i += 4 * 97) { sum += (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000; n++; }
        dim = (sum / Math.max(n, 1)) < 46;
      } catch (e) {}
      cb(c.toDataURL("image/jpeg", 0.85), dim);
    };
    img.onerror = function () { cb(null, false); };
    var fr = new FileReader();
    fr.onload = function (e) { img.src = e.target.result; };
    fr.readAsDataURL(file);
  }

  /* ------------------------------ frame ------------------------------ */
  function stepsBar() {
    var idx = state.view === "details" ? 0 : state.view === "photo" ? 1 : 2;
    return '<div class="aiskin__steps" aria-hidden="true">' +
      ["వివరాలు", "ఫోటో", "ఫలితం"].map(function (s, i) {
        var cls = i < idx ? "done" : i === idx ? "on" : "";
        return '<span class="aiskin__stepdot ' + cls + '"><b>' + (i < idx ? "✓" : i + 1) + "</b>" + s + "</span>" + (i < 2 ? '<i class="aiskin__stepline"></i>' : "");
      }).join("") + "</div>";
  }

  function setView(name) {
    if (state.cleanup) { try { state.cleanup(); } catch (e) {} state.cleanup = null; }
    state.view = name;
    flow.innerHTML = "";
    var pane = el('<div class="aiskin__pane">' + stepsBar() + "</div>");
    pane.appendChild(views[name]());
    flow.appendChild(pane);
    var r = flow.getBoundingClientRect();
    if (r.top < 0 || r.top > innerHeight * 0.7) flow.scrollIntoView({ behavior: REDUCE ? "auto" : "smooth", block: "start" });
  }

  /* ------------------------------ views ------------------------------ */
  var views = {

    /* ---- 1. details (DermaLuxe-style floating fields) ---- */
    details: function () {
      var opts = CONCERN_OPTS.map(function (o) {
        return '<option value="' + esc(o[0]) + '"' + (state.concern === o[0] ? " selected" : "") + ">" + esc(o[0]) + " · " + esc(o[1]) + "</option>";
      }).join("");
      var v = el(
        '<div class="aiskin__step">' +
          '<div class="aiskin__fld"><input type="text" id="aiName" maxlength="60" placeholder=" " value="' + esc(state.name) + '"><label for="aiName">పేరు · Name</label></div>' +
          '<div class="aiskin__fldrow">' +
            '<div class="aiskin__fld"><input type="tel" id="aiPhone" inputmode="numeric" maxlength="10" placeholder=" " value="' + esc(state.phone) + '"><label for="aiPhone">మొబైల్ · Mobile *</label></div>' +
            '<div class="aiskin__fld"><input type="number" id="aiAge" min="1" max="120" placeholder=" " value="' + esc(state.age) + '"><label for="aiAge">వయసు · Age *</label></div>' +
          "</div>" +
          '<div class="aiskin__fldrow">' +
            '<div class="aiskin__fld"><select id="aiGender" required><option value="" disabled' + (state.gender ? "" : " selected") + ' hidden></option>' +
              ["స్త్రీ · Female", "పురుషుడు · Male", "ఇతర · Other"].map(function (g) { return "<option" + (state.gender === g ? " selected" : "") + ">" + g + "</option>"; }).join("") +
            '</select><label for="aiGender">లింగం · Gender *</label></div>' +
            '<div class="aiskin__fld"><select id="aiConcern" required><option value="" disabled' + (state.concern ? "" : " selected") + " hidden></option>" + opts +
            '</select><label for="aiConcern">ప్రధాన సమస్య · Main concern *</label></div>' +
          "</div>" +
          '<label class="aiskin__check"><input type="checkbox" id="aiConsent"' + (state.consented ? " checked" : "") + '>' +
            '<span>నా ఫోటోను AI విశ్లేషణ కోసం ప్రాసెస్ చేయడానికి సమ్మతిస్తున్నాను — ఇది <b>వైద్య నిర్ధారణ కాదు</b>, ఫోటో <b>save అవదు</b>. <a href="privacy.html" target="_blank" rel="noopener">Privacy</a></span></label>' +
          '<p class="aiskin__err" id="aiErr1">' + esc(state.limitMsg || "") + "</p>" +
          '<button class="btn btn--primary aiskin__full" id="aiNext1">ఫోటోకు కొనసాగండి →</button>' +
        "</div>"
      );
      state.limitMsg = "";
      v.querySelector("#aiNext1").addEventListener("click", function () {
        var err = v.querySelector("#aiErr1");
        state.name = v.querySelector("#aiName").value.trim();
        state.phone = digits(v.querySelector("#aiPhone").value);
        state.age = v.querySelector("#aiAge").value.trim();
        state.gender = v.querySelector("#aiGender").value;
        state.concern = v.querySelector("#aiConcern").value;
        if (state.phone.length !== 10) { err.textContent = "10 అంకెల మొబైల్ నంబర్ ఇవ్వండి."; return; }
        if (!state.age || +state.age < 1 || +state.age > 120) { err.textContent = "వయసు సరిగ్గా ఇవ్వండి."; return; }
        if (!state.gender) { err.textContent = "లింగం ఎంచుకోండి."; return; }
        if (!state.concern) { err.textContent = "ప్రధాన సమస్య ఎంచుకోండి."; return; }
        if (!v.querySelector("#aiConsent").checked) { err.textContent = "దయచేసి సమ్మతి ✓ ఇవ్వండి."; return; }
        state.consented = true;
        setView("photo");
      });
      return v;
    },

    /* ---- 2. photo ---- */
    photo: function () {
      var v = el(
        '<div class="aiskin__step">' +
          '<label class="aiskin__drop" id="aiDrop"><input id="aiFile" type="file" accept="image/*" hidden>' +
            '<span class="aiskin__dropinner" id="aiDropInner">' +
              '<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><ellipse cx="24" cy="19" rx="9" ry="11" stroke="currentColor" stroke-width="2"/><path d="M9 41c2-7.5 7.5-10 15-10s13 2.5 15 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
              "<strong>సమస్య ఉన్న భాగం ఫోటో</strong><i>మంచి వెలుతురు · దగ్గరగా · ఫిల్టర్ లేకుండా — tap / drag / paste</i>" +
            "</span>" +
            '<span class="aiskin__preview" id="aiPrev" hidden></span>' +
          "</label>" +
          '<p class="aiskin__warn" id="aiWarn" hidden>⚠️ ఫోటో కొంచెం చీకటిగా ఉంది — వెలుతురులో తీస్తే ఫలితం మెరుగ్గా ఉంటుంది.</p>' +
          '<p class="aiskin__err" id="aiErrP"></p>' +
          '<div class="aiskin__actions"><button class="btn btn--ghost" id="aiBack2">← వెనక్కి</button>' +
            '<button class="btn btn--primary" id="aiGo2"' + (state.image ? "" : " disabled") + ">AI తో విశ్లేషించండి ✨</button></div>" +
        "</div>"
      );
      var drop = v.querySelector("#aiDrop"), inner = v.querySelector("#aiDropInner"),
          prev = v.querySelector("#aiPrev"), go = v.querySelector("#aiGo2"),
          err = v.querySelector("#aiErrP"), warn = v.querySelector("#aiWarn");

      function showPreview() {
        if (!state.image) return;
        inner.hidden = true; prev.hidden = false;
        prev.innerHTML = '<img src="' + state.image + '" alt="మీ ఫోటో"><button type="button" class="aiskin__retake">🔄 మార్చండి</button>';
        prev.querySelector(".aiskin__retake").addEventListener("click", function (e) {
          e.preventDefault(); e.stopPropagation();
          state.image = ""; state.dim = false; prev.hidden = true; prev.innerHTML = ""; inner.hidden = false;
          warn.hidden = true; go.disabled = true; v.querySelector("#aiFile").value = "";
        });
        warn.hidden = !state.dim;
        go.disabled = false;
      }
      function accept(file) {
        if (!file || !/^image\//.test(file.type)) { err.textContent = "దయచేసి ఫోటో (image) ఎంచుకోండి."; return; }
        err.textContent = "";
        readImage(file, function (dataUrl, dim) {
          if (!dataUrl) { err.textContent = "ఫోటో చదవలేకపోయాం — మరో ఫోటో ప్రయత్నించండి."; return; }
          state.image = dataUrl; state.mediaType = "image/jpeg"; state.dim = dim;
          showPreview();
        });
      }
      v.querySelector("#aiFile").addEventListener("change", function (e) { accept(e.target.files && e.target.files[0]); });
      ["dragover", "dragenter"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("over"); }); });
      ["dragleave", "drop"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("over"); }); });
      drop.addEventListener("drop", function (e) { accept(e.dataTransfer.files && e.dataTransfer.files[0]); });
      function onPaste(e) {
        var items = (e.clipboardData || {}).items || [];
        for (var i = 0; i < items.length; i++) if (items[i].type.indexOf("image") === 0) { accept(items[i].getAsFile()); break; }
      }
      document.addEventListener("paste", onPaste);
      state.cleanup = function () { document.removeEventListener("paste", onPaste); };

      showPreview();
      v.querySelector("#aiBack2").addEventListener("click", function () { setView("details"); });
      go.addEventListener("click", function () { if (state.image) { setView("analyzing"); runAnalysis(); } });
      return v;
    },

    /* ---- analyzing: scan over the photo ---- */
    analyzing: function () {
      var v = el(
        '<div class="aiskin__step aiskin__center">' +
          '<div class="aiskin__scanwrap"><img src="' + state.image + '" alt=""><span class="aiskin__scanline" aria-hidden="true"></span></div>' +
          '<h3 class="aiskin__h" style="margin-top:1.1rem">AI విశ్లేషిస్తోంది…</h3>' +
          '<p class="aiskin__scanmsg" id="aiScanMsg">ఫోటోను పరిశీలిస్తోంది…</p>' +
        "</div>"
      );
      var msgs = ["ఫోటోను పరిశీలిస్తోంది…", "చర్మం / జుట్టు లక్షణాలను గుర్తిస్తోంది…", "సంరక్షణ సూచనలు సిద్ధం చేస్తోంది…", "దాదాపు పూర్తయింది…"];
      var i = 0, m = v.querySelector("#aiScanMsg");
      var t = setInterval(function () { i = (i + 1) % msgs.length; m.textContent = msgs[i]; }, 1700);
      state.cleanup = function () { clearInterval(t); };
      return v;
    },

    /* ---- limit reached ---- */
    limit: function () {
      var v = el(
        '<div class="aiskin__step aiskin__center">' +
          '<div class="aiskin__limitic">🌸</div>' +
          '<h3 class="aiskin__h">ఉచిత విశ్లేషణలు పూర్తయ్యాయి</h3>' +
          '<p class="aiskin__summary" style="text-align:left">' + esc(state.limitMsg || "ఈ నంబర్‌కు 90 రోజుల్లో 5 ఉచిత AI విశ్లేషణలు పూర్తయ్యాయి. ఖచ్చితమైన అంచనా & చికిత్స కోసం మా వైద్యులను సంప్రదించండి.") + "</p>" +
          '<div class="aiskin__cta">' +
            '<a class="btn btn--primary" href="#contact">📅 అపాయింట్‌మెంట్ బుక్ చేయండి</a>' +
            '<a class="btn btn--ghost" target="_blank" rel="noopener" href="https://wa.me/' + WA + "?text=" + encodeURIComponent("నమస్తే Medicare 🌸 AI analysis limit అయిపోయింది — consultation కావాలి.") + '">💬 WhatsApp</a>' +
          "</div>" +
        "</div>"
      );
      return v;
    },

    /* ---- 3. result ---- */
    result: function () {
      var r = state.result || {};
      function list(arr) { return '<ul class="aiskin__list">' + (arr || []).map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>"; }
      function section(ic, te, en, inner) { return '<section class="aiskin__sec"><h4><span>' + ic + "</span>" + te + " <i>" + en + "</i></h4>" + inner + "</section>"; }

      var remainNote = (state.remaining != null)
        ? '<p class="aiskin__remain">మిగిలిన ఉచిత విశ్లేషణలు: <b>' + state.remaining + "/5</b> (90 రోజుల్లో)</p>" : "";

      var v;
      if (r.imageUsable === false) {
        v = el(
          '<div class="aiskin__step aiskin__center">' +
            '<p class="aiskin__summary" style="text-align:left">' + esc(r.summary || "ఫోటో స్పష్టంగా లేదు — మంచి వెలుతురులో close-up ఫోటో మళ్ళీ ప్రయత్నించండి.") + "</p>" + remainNote +
            '<div class="aiskin__actions"><span></span><button class="btn btn--primary aiskin__retry">📷 మళ్ళీ ఫోటో</button></div>' +
          "</div>"
        );
      } else {
        var sev = r.severity === "see-soon" ? 2 : r.severity === "recommend-consult" ? 1 : 0;
        var sevRow = ["సాధారణ సంరక్షణ", "వైద్య సలహా మంచిది", "త్వరగా సంప్రదించండి"].map(function (s, i) {
          return '<span class="' + (i === sev ? "on s" + i : "") + '">' + s + "</span>";
        }).join("");
        var waText = "నమస్తే Medicare 🌸 " + (state.name ? state.name + " — " : "") + "నేను website లో AI Skin & Hair Analysis చేసాను.\nఫలితం: " + (r.summary || "").slice(0, 220) + "\nConsultation కావాలి.";
        v = el(
          '<div class="aiskin__step">' +
            '<h3 class="aiskin__h">మీ AI ఫలితం <i>Your result</i></h3>' +
            '<div class="aiskin__sev">' + sevRow + "</div>" +
            (r.seeDoctorSoon ? '<div class="aiskin__soon">⚕️ దయచేసి త్వరగా మా వైద్యులను స్వయంగా కలవండి. <i>Please visit our dermatologist soon.</i></div>' : "") +
            (r.summary ? '<p class="aiskin__summary">' + esc(r.summary) + "</p>" : "") +
            (r.observations && r.observations.length ? section("👁️", "కనిపించినవి", "Observations", list(r.observations)) : "") +
            (r.possibleFactors && r.possibleFactors.length ? section("🔎", "సాధ్య కారణాలు", "Possible factors", list(r.possibleFactors)) : "") +
            (r.selfCareTips && r.selfCareTips.length ? section("🌿", "సంరక్షణ చిట్కాలు", "Self-care", list(r.selfCareTips)) : "") +
            (r.suggestedTreatments && r.suggestedTreatments.length
              ? section("💠", "Medicare లో తగిన చికిత్సలు", "Suggested treatments",
                  '<div class="aiskin__tags">' + r.suggestedTreatments.map(function (t) { return "<span>" + esc(t) + "</span>"; }).join("") + "</div>")
              : "") +
            '<p class="aiskin__disc">' + esc(r.disclaimer || "") + "</p>" + remainNote +
            '<div class="aiskin__cta">' +
              '<a class="btn btn--primary" href="#contact">📅 అపాయింట్‌మెంట్</a>' +
              '<a class="btn btn--ghost" target="_blank" rel="noopener" href="https://wa.me/' + WA + "?text=" + encodeURIComponent(waText) + '">💬 WhatsApp లో పంపండి</a>' +
              ((state.remaining == null || state.remaining > 0) ? '<button class="btn btn--ghost aiskin__retry">📷 మరో ఫోటో</button>' : "") +
            "</div>" +
          "</div>"
        );
      }
      var rt = v.querySelector(".aiskin__retry");
      if (rt) rt.addEventListener("click", function () { state.image = ""; state.result = null; setView("photo"); });
      return v;
    }
  };

  /* ----------------------------- analyze ----------------------------- */
  function runAnalysis() {
    var type = "skin";
    CONCERN_OPTS.forEach(function (o) { if (o[0] === state.concern) type = o[2]; });
    var stored = loadUsage();
    var usageToken = (stored.phone === state.phone && stored.token) ? stored.token : "";

    api("/api/analyze", {
      image: state.image, mediaType: state.mediaType,
      consent: true, phone: state.phone, usageToken: usageToken,
      patient: { type: type, age: state.age, gender: state.gender, area: state.concern, details: state.concern }
    }).then(function (r) {
      if (r.ok && r.json.ok && r.json.result) {
        state.result = r.json.result;
        state.remaining = (typeof r.json.remaining === "number") ? r.json.remaining : null;
        if (!DEMO && r.json.usageToken) saveUsage({ phone: state.phone, token: r.json.usageToken });
        setView("result"); return;
      }
      if (r.status === 429) { state.limitMsg = (r.json && r.json.message) || ""; setView("limit"); return; }
      if (r.status === 400 && r.json && r.json.error === "phone_required") { state.limitMsg = r.json.message || ""; setView("details"); return; }
      state.result = { imageUsable: true, summary: (r.json && r.json.message) || "AI విశ్లేషణ విఫలమైంది — దయచేసి మళ్ళీ ప్రయత్నించండి, లేదా మా వైద్యులను నేరుగా సంప్రదించండి.", observations: [], possibleFactors: [], selfCareTips: [], suggestedTreatments: [], severity: "recommend-consult", seeDoctorSoon: false, disclaimer: "" };
      setView("result");
    }).catch(function () {
      state.result = { imageUsable: true, summary: "నెట్‌వర్క్ సమస్య — దయచేసి మళ్ళీ ప్రయత్నించండి.", observations: [], possibleFactors: [], selfCareTips: [], suggestedTreatments: [], severity: "recommend-consult", seeDoctorSoon: false, disclaimer: "" };
      setView("result");
    });
  }

  /* ------------------------------ start ------------------------------ */
  startBtn.addEventListener("click", function () {
    flow.hidden = false;
    startBtn.closest(".aiskin__pitch") && startBtn.setAttribute("aria-expanded", "true");
    setView("details");
  });
})();
