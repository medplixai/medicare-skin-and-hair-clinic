/* =====================================================================
   MEDICARE — AI Skin & Hair Photo Information Tool  (v5 — compliance)
   ---------------------------------------------------------------------
   WHAT THIS MAY AND MAY NOT DO.  Read before changing anything here.

   Telemedicine Practice Guidelines 2020 (Appendix 5 to the IMC (PCEE)
   Regulations 2002, in force), clause 5.4:
     "Technology platforms based on Artificial Intelligence/Machine
      Learning are not allowed to counsel the patients or prescribe any
      medicines to a patient. Only a RMP is entitled to counsel or
      prescribe and has to directly communicate with the patient."
   NMC Act 2019, s.34: only a person on the State/National Register may
   practise medicine — interpreting a clinical photograph and telling
   the patient what it shows is practising medicine.
   NMC Guidelines on Ethical Advertising, 06/10/2026: clause 7.2(c) —
   AI output must carry a source mark stating its origin is AI; 7.2(a) —
   no misleading representation about diagnosis, treatment or clinical
   outcomes; 7.2(d) — patient data fed to AI must meet privacy and
   data-protection duties; 8.1(x) — no "free" procedure or similar
   inducement; 8.1(i) — nothing built to create unnecessary demand or
   to market by fear.
   IT (Reasonable Security Practices … Sensitive Personal Data) Rules
   2011: a photograph of a skin or scalp condition is SENSITIVE personal
   data (rule 3(iii), 3(v)) — rule 5(1) written consent stating the
   purpose before collection, rule 5(3) notice of recipients, rule 6(1)
   prior permission for disclosure to a third party, rule 5(4)/(5)
   retention and purpose limitation.

   SO, DELIBERATELY REMOVED IN v5 — DO NOT PUT BACK:
     • the word "free"/"ఉచిత" anywhere (8.1(x) inducement; CCPA 2022 cl.7)
     • 0-100 appearance gauges  (numeric scoring of a patient's photo is
       screening output — unlicensed medical-device software under MDR
       2017 / CDSCO MDSW guidance — and claims an accuracy that cannot
       be substantiated: cl. 3.2 Explanation II)
     • the 3-step severity scale (AI grading = triage/counselling, 5.4)
     • "suggested treatments" tags  (AI recommending priced procedures:
       5.4 counselling + 8.1(i) demand creation)
     • "self-care tips"  (personalised advice from AI = counselling, 5.4)
     • "possible factors"  (etiology = diagnostic reasoning, 7.2(a))
     • the on-device score history / before-vs-now comparison (depended
       on the scores, and stored a copy of the photograph)

   WHAT REMAINS: the patient's details reach the clinic desk as an
   enquiry, the photograph is described in plain language, the output is
   marked AI-generated and non-diagnostic, and the patient is routed to
   a doctor.  The safety escalation ("please see a doctor soon") is kept
   — it only ever escalates, it never tells anyone they are fine.
     • dual photo (main + optional hair/close-up)
     • 3D face mesh animation while the request runs (MediaPipe,
       client-side only; graceful fallback to a scan line)
     • branded PDF copy of the report (html2canvas + jsPDF, lazy-loaded)
   Limit: 5 analyses / number / 90 days (server-enforced).  ?aidemo=1 = demo.
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
  // No HIST_KEY in v5: the old on-device history kept a copy of the patient's
  // photograph plus appearance scores in localStorage. SPDI Rules 2011 r.5(4)
  // (no retention beyond the purpose) and the removal of the score gauges both
  // make it unnecessary. One stale key is cleaned up at start-up below.

  var state = {
    view: "details",
    name: "", phone: "", age: "", gender: "", concern: "",
    consented: false, guardian: false,
    image: "", image2: "", dim: false,
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
  function lsGet(k, d) { try { return JSON.parse(localStorage.getItem(k) || "null") || d; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function needGuardian(age) { var n = parseInt(age, 10); return !isNaN(n) && n > 0 && n < 18; }
  // v4 stored a thumbnail of the patient's photograph + appearance scores on the
  // device. v5 does not keep either, so clear anything v4 left behind
  // (SPDI Rules 2011 r.5(4) — no retention beyond the purpose).
  try { localStorage.removeItem("medicareAiHistory"); localStorage.removeItem("medicareAiHistoryDemo"); } catch (e) {}

  var loadedScripts = {};
  function loadScript(src) {
    if (loadedScripts[src]) return loadedScripts[src];
    loadedScripts[src] = new Promise(function (res, rej) {
      var s = document.createElement("script");
      s.src = src; s.async = true;
      s.onload = function () { res(); };
      s.onerror = function () { delete loadedScripts[src]; rej(new Error("load failed " + src)); };
      document.head.appendChild(s);
    });
    return loadedScripts[src];
  }

  function api(path, body) {
    if (DEMO) return demo(path, body);
    return fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, status: r.status, json: j }; }); });
  }
  function demo(path, body) {
    return new Promise(function (res) {
      setTimeout(function () {
        var u = lsGet(LS_KEY, {});
        var used = (u.phone === body.phone && u.used) ? u.used : 0;
        if (used >= 5) { res({ ok: false, status: 429, json: { error: "limit_reached", remaining: 0, message: "ఈ నంబర్‌కు 90 రోజుల్లో అనుమతించిన 5 AI విశ్లేషణలు పూర్తయ్యాయి. మా వైద్యులను సంప్రదించండి 🌸" } }); return; }
        lsSet(LS_KEY, { phone: body.phone, used: used + 1, token: "demo" });
        // The demo payload mirrors what v5 actually renders: a plain description of
        // what is visible, and nothing that reads as a diagnosis, a grade, a
        // prognosis or a treatment recommendation (TPG 2020 cl. 5.4; NMC 7.2(a)).
        res({ ok: true, status: 200, json: { ok: true, usageToken: "demo", remaining: 5 - (used + 1), result: {
          imageUsable: true,
          summary: "ఫోటోలో మొటిమలు (acne) లాంటి మచ్చలు, కొంత ఎరుపు కనిపిస్తున్నాయి. ఇది ఫోటోలో ఏమి కనిపిస్తోందో చెప్పే వివరణ మాత్రమే — వ్యాధి నిర్ధారణ కాదు. దయచేసి మా వైద్యులను కలవండి.",
          observations: ["కొన్ని active మొటిమలు & రెడ్‌నెస్ · a few active pimples with redness", "స్వల్ప post-acne మచ్చలు · mild post-acne marks"],
          seeDoctorSoon: false,
          disclaimer: ""
        }}});
      }, path === "/api/analyze" ? 4200 : 300);
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
  /* makeThumb() was removed in v5 — it existed only to store a copy of the
     patient's photograph on the device for the retired comparison view. */

  /* ------------------------------ frame ------------------------------ */
  function stepsBar() {
    var idx = state.view === "details" ? 0 : state.view === "photo" ? 1 : 2;
    return '<div class="aiskin__steps" aria-hidden="true">' +
      ["Details", "Photo", "Result"].map(function (s, i) {
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

    /* ---- 1. details ---- */
    details: function () {
      var opts = CONCERN_OPTS.map(function (o) {
        return '<option value="' + esc(o[0]) + '"' + (state.concern === o[0] ? " selected" : "") + ">" + esc(o[0]) + " · " + esc(o[1]) + "</option>";
      }).join("");
      var v = el(
        '<div class="aiskin__step">' +
          '<div class="aiskin__fld"><input type="text" id="aiName" maxlength="60" placeholder=" " value="' + esc(state.name) + '"><label for="aiName">Name · పేరు</label></div>' +
          '<div class="aiskin__fldrow">' +
            '<div class="aiskin__fld"><input type="tel" id="aiPhone" inputmode="numeric" maxlength="10" placeholder=" " value="' + esc(state.phone) + '"><label for="aiPhone">Mobile · మొబైల్ *</label></div>' +
            '<div class="aiskin__fld"><input type="number" id="aiAge" min="1" max="120" placeholder=" " value="' + esc(state.age) + '"><label for="aiAge">Age · వయసు *</label></div>' +
          "</div>" +
          '<div class="aiskin__fldrow">' +
            '<div class="aiskin__fld"><select id="aiGender" required><option value="" disabled' + (state.gender ? "" : " selected") + ' hidden></option>' +
              ["స్త్రీ · Female", "పురుషుడు · Male", "ఇతర · Other"].map(function (g) { return "<option" + (state.gender === g ? " selected" : "") + ">" + g + "</option>"; }).join("") +
            '</select><label for="aiGender">Gender · లింగం *</label></div>' +
            '<div class="aiskin__fld"><select id="aiConcern" required><option value="" disabled' + (state.concern ? "" : " selected") + " hidden></option>" + opts +
            '</select><label for="aiConcern">Main Concern · ప్రధాన సమస్య *</label></div>' +
          "</div>" +
          '<div class="aiskin__notice">' +
            '<b>మీ ఫోటో ఏమవుతుంది — దయచేసి చదవండి</b>' +
            '<ul>' +
              '<li>మీరు ఇచ్చే ఫోటో <b>బయటి AI సేవకు (Anthropic — Claude API)</b> పంపి, అందులో ఏమి కనిపిస్తోందో వివరణ తయారవుతుంది.</li>' +
              '<li>ఈ వివరణ <b>వ్యాధి నిర్ధారణ కాదు, చికిత్స సలహా కాదు</b> — దీని ఆధారంగా మందులు ఇవ్వబడవు. <b>నమోదిత వైద్యుడు</b> మాత్రమే వైద్య అభిప్రాయం చెప్పగలరు.</li>' +
              '<li>ఫోటో మా సర్వర్‌లో <b>నిల్వ చేయబడదు</b> — ఆ request వరకే ఉంటుంది.</li>' +
              '<li>మీరు ఇచ్చిన <b>పేరు, మొబైల్, వయసు, లింగం, సమస్య</b> మరియు ఈ వివరణ <b>మా క్లినిక్ డెస్క్‌కు విచారణగా (enquiry)</b> చేరతాయి, తద్వారా మా సిబ్బంది మిమ్మల్ని సంప్రదించగలరు.</li>' +
              '<li>ఈ ఫోటోను ప్రకటనలకు, before/after చిత్రాలకు, రివ్యూలకు లేదా AI శిక్షణకు <b>ఎప్పుడూ వాడము</b>.</li>' +
              '<li>పూర్తి వివరాలు: <a href="privacy.html#ai" target="_blank" rel="noopener">Privacy Policy — AI photo analysis</a></li>' +
            '</ul>' +
          '</div>' +
          '<label class="aiskin__check"><input type="checkbox" id="aiConsent"' + (state.consented ? " checked" : "") + '>' +
            '<span>పైన రాసినవన్నీ చదివాను. నా ఫోటోను ఆ విధంగా ప్రాసెస్ చేయడానికి <b>సమ్మతిస్తున్నాను</b>.</span></label>' +
          '<label class="aiskin__check" id="aiGuardWrap"' + (needGuardian(state.age) ? "" : " hidden") + '><input type="checkbox" id="aiGuard"' + (state.guardian ? " checked" : "") + '>' +
            '<span>ఈ ఫోటో <b>18 ఏళ్ల లోపు వ్యక్తి</b>ది. నేను ఆ పిల్లవాడి/పిల్ల <b>తల్లి / తండ్రి / సంరక్షకుడిని</b>, నా సమ్మతితోనే ఇస్తున్నాను.</span></label>' +
          '<p class="aiskin__err" id="aiErr1">' + esc(state.limitMsg || "") + "</p>" +
          '<button class="btn btn--primary aiskin__full" id="aiNext1">Continue to Photo →</button>' +
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
        // Telemedicine Practice Guidelines 2020, cl. 3.2.3: a minor may be dealt with
        // only along with an identified adult. DPDP Act 2023 s.9 (from 13 May 2027)
        // will require verifiable parental consent; this is the step that prepares it.
        var guard = v.querySelector("#aiGuard");
        if (needGuardian(state.age)) {
          if (!guard || !guard.checked) { err.textContent = "18 ఏళ్ల లోపు వారి ఫోటోకు తల్లి/తండ్రి/సంరక్షకుని సమ్మతి ✓ తప్పనిసరి."; return; }
          state.guardian = true;
        } else { state.guardian = false; }
        state.consented = true;
        setView("photo");
      });
      // reveal the guardian consent line as soon as an under-18 age is typed
      var ageEl = v.querySelector("#aiAge"), guardWrap = v.querySelector("#aiGuardWrap");
      if (ageEl && guardWrap) {
        ageEl.addEventListener("input", function () { guardWrap.hidden = !needGuardian(ageEl.value); });
      }
      return v;
    },

    /* ---- 2. photos (main required + optional second) ---- */
    photo: function () {
      function box(id, ic, title, sub, key) {
        return '<label class="aiskin__drop" id="' + id + 'Box"><input id="' + id + '" type="file" accept="image/*" hidden>' +
          '<span class="aiskin__dropinner" id="' + id + 'Inner">' + ic +
            "<strong>" + title + "</strong><i>" + sub + "</i>" +
          "</span>" +
          '<span class="aiskin__preview" id="' + id + 'Prev" hidden></span>' +
        "</label>";
      }
      var faceIc = '<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><ellipse cx="24" cy="19" rx="9" ry="11" stroke="currentColor" stroke-width="2"/><path d="M9 41c2-7.5 7.5-10 15-10s13 2.5 15 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
      var hairIc = '<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M14 30c0-11 4-21 10-21s10 10 10 21M10 39c2-3 5-4 5-8m23 8c-2-3-5-4-5-8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
      var v = el(
        '<div class="aiskin__step">' +
          '<div class="aiskin__uploads">' +
            box("aiF1", faceIc, "Affected Area Photo *", "సమస్య ఉన్న భాగం · మంచి వెలుతురు · దగ్గరగా") +
            box("aiF2", hairIc, "Another Photo (optional)", "వేరే angle / జుట్టు / స్కాల్ప్") +
          "</div>" +
          '<p class="aiskin__warn" id="aiWarn" hidden>⚠️ ఫోటో కొంచెం చీకటిగా ఉంది — వెలుతురులో తీస్తే ఫలితం మెరుగ్గా ఉంటుంది.</p>' +
          '<p class="aiskin__err" id="aiErrP"></p>' +
          '<div class="aiskin__actions"><button class="btn btn--ghost" id="aiBack2">← Back</button>' +
            '<button class="btn btn--primary" id="aiGo2"' + (state.image ? "" : " disabled") + ">Analyze with AI ✨</button></div>" +
        "</div>"
      );
      var err = v.querySelector("#aiErrP"), warn = v.querySelector("#aiWarn"), go = v.querySelector("#aiGo2");

      function wire(id, key, dimCheck) {
        var input = v.querySelector("#" + id), inner = v.querySelector("#" + id + "Inner"),
            prev = v.querySelector("#" + id + "Prev"), boxEl = v.querySelector("#" + id + "Box");
        function show() {
          if (!state[key]) return;
          inner.hidden = true; prev.hidden = false;
          prev.innerHTML = '<img src="' + state[key] + '" alt=""><button type="button" class="aiskin__retake">🔄 Change</button>';
          prev.querySelector(".aiskin__retake").addEventListener("click", function (e) {
            e.preventDefault(); e.stopPropagation();
            state[key] = ""; if (dimCheck) { state.dim = false; warn.hidden = true; }
            prev.hidden = true; prev.innerHTML = ""; inner.hidden = false; input.value = "";
            if (key === "image") go.disabled = true;
          });
          if (dimCheck) warn.hidden = !state.dim;
          if (key === "image") go.disabled = false;
        }
        function accept(file) {
          if (!file || !/^image\//.test(file.type)) { err.textContent = "దయచేసి ఫోటో (image) ఎంచుకోండి."; return; }
          err.textContent = "";
          readImage(file, function (dataUrl, dim) {
            if (!dataUrl) { err.textContent = "ఫోటో చదవలేకపోయాం — మరో ఫోటో ప్రయత్నించండి."; return; }
            state[key] = dataUrl; if (dimCheck) state.dim = dim;
            show();
          });
        }
        input.addEventListener("change", function (e) { accept(e.target.files && e.target.files[0]); });
        ["dragover", "dragenter"].forEach(function (ev) { boxEl.addEventListener(ev, function (e) { e.preventDefault(); boxEl.classList.add("over"); }); });
        ["dragleave", "drop"].forEach(function (ev) { boxEl.addEventListener(ev, function (e) { e.preventDefault(); boxEl.classList.remove("over"); }); });
        boxEl.addEventListener("drop", function (e) { accept(e.dataTransfer.files && e.dataTransfer.files[0]); });
        show();
        return accept;
      }
      var acceptMain = wire("aiF1", "image", true);
      wire("aiF2", "image2", false);

      function onPaste(e) {
        var items = (e.clipboardData || {}).items || [];
        for (var i = 0; i < items.length; i++) if (items[i].type.indexOf("image") === 0) { acceptMain(items[i].getAsFile()); break; }
      }
      document.addEventListener("paste", onPaste);
      state.cleanup = function () { document.removeEventListener("paste", onPaste); };

      v.querySelector("#aiBack2").addEventListener("click", function () { setView("details"); });
      go.addEventListener("click", function () { if (state.image) { setView("analyzing"); runAnalysis(); } });
      return v;
    },

    /* ---- analyzing: 3D face mesh (fallback: scan line) ---- */
    analyzing: function () {
      var v = el(
        '<div class="aiskin__step aiskin__center">' +
          '<div class="aiskin__scanwrap" id="aiScanWrap"><img src="' + state.image + '" alt=""><span class="aiskin__scanline" aria-hidden="true"></span></div>' +
          '<div class="aiskin__mesh" id="aiMesh" hidden><canvas id="aiMeshCanvas" width="320" height="320"></canvas><span class="aiskin__meshtag">3D ఫేస్ మ్యాప్ · on-device</span></div>' +
          '<h3 class="aiskin__h" style="margin-top:1.1rem">AI is reading your photo… <i>AI ఫోటోను చూస్తోంది</i></h3>' +
          '<p class="aiskin__scanmsg" id="aiScanMsg">ఫోటోను చూస్తోంది…</p>' +
        "</div>"
      );
      var msgs = ["ఫోటోను చూస్తోంది…", "3D ఫేస్ మ్యాప్ తయారవుతోంది…", "ఫోటోలో ఏమి కనిపిస్తోందో రాస్తోంది…", "వివరణ సిద్ధం చేస్తోంది…"];
      var i = 0, m = v.querySelector("#aiScanMsg");
      var msgTimer = setInterval(function () { i = (i + 1) % msgs.length; m.textContent = msgs[i]; }, 1900);

      var raf = 0, stopped = false;
      /* try the 3D mesh in the background; never block, never break */
      if (!REDUCE) {
        loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js").then(function () {
          if (stopped || !window.FaceMesh) return;
          var fm = new window.FaceMesh({ locateFile: function (f) { return "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/" + f; } });
          fm.setOptions({ staticImageMode: true, maxNumFaces: 1, refineLandmarks: false, minDetectionConfidence: 0.5 });
          fm.onResults(function (res) {
            if (stopped) return;
            var lm = res.multiFaceLandmarks && res.multiFaceLandmarks[0];
            if (!lm || !lm.length) return;                    // no face → keep scan line
            var wrap = v.querySelector("#aiScanWrap"), mesh = v.querySelector("#aiMesh");
            if (!wrap || !mesh) return;
            wrap.hidden = true; mesh.hidden = false;
            var cv = v.querySelector("#aiMeshCanvas"), ctx = cv.getContext("2d");
            var pts = lm.map(function (p) { return { x: p.x - 0.5, y: p.y - 0.5, z: (p.z || 0) }; });
            var t0 = performance.now();
            (function draw(now) {
              if (stopped) return;
              var a = ((now - t0) / 1000) * 0.9;               // rotation speed
              var ca = Math.cos(a), sa = Math.sin(a);
              ctx.clearRect(0, 0, 320, 320);
              for (var k = 0; k < pts.length; k++) {
                var p = pts[k];
                var rx = p.x * ca + p.z * sa;                  // rotate around Y
                var rz = -p.x * sa + p.z * ca;
                var s = 300 / (1 + rz * 1.6);                  // mild perspective
                var X = 160 + rx * s, Y = 152 + p.y * s * 1.02;
                var depth = Math.max(0, Math.min(1, 0.5 - rz * 2));
                ctx.fillStyle = "rgba(255," + Math.round(120 + 60 * depth) + "," + Math.round(180 + 40 * depth) + "," + (0.35 + 0.6 * depth) + ")";
                ctx.beginPath(); ctx.arc(X, Y, 1.05 + depth, 0, 6.2832); ctx.fill();
              }
              raf = requestAnimationFrame(draw);
            })(t0);
          });
          var imgEl = new Image();
          imgEl.onload = function () { if (!stopped) fm.send({ image: imgEl }).catch(function () {}); };
          imgEl.src = state.image;
        }).catch(function () { /* CDN blocked → scan line stays */ });
      }
      state.cleanup = function () { stopped = true; clearInterval(msgTimer); if (raf) cancelAnimationFrame(raf); };
      return v;
    },

    /* ---- limit reached ---- */
    limit: function () {
      return el(
        '<div class="aiskin__step aiskin__center">' +
          '<div class="aiskin__limitic">🌸</div>' +
          '<h3 class="aiskin__h">Analysis Limit Reached <i>విశ్లేషణల పరిమితి పూర్తయింది</i></h3>' +
          '<p class="aiskin__summary" style="text-align:left">' + esc(state.limitMsg || "ఈ నంబర్‌కు 90 రోజుల్లో అనుమతించిన 5 AI విశ్లేషణలు పూర్తయ్యాయి. మీ సమస్యను పరీక్షించి చెప్పడానికి దయచేసి మా వైద్యులను కలవండి.") + "</p>" +
          '<div class="aiskin__cta">' +
            '<a class="btn btn--primary" href="#contact">📅 Book Appointment</a>' +
            '<a class="btn btn--ghost" target="_blank" rel="noopener" href="https://wa.me/' + WA + "?text=" + encodeURIComponent("నమస్తే Medicare 🌸 AI analysis limit అయిపోయింది — consultation కావాలి.") + '">💬 WhatsApp</a>' +
          "</div>" +
        "</div>"
      );
    },

    /* ---- 3. result ---- */
    result: function () {
      var r = state.result || {};
      function list(arr) { return '<ul class="aiskin__list">' + (arr || []).map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>"; }
      function section(ic, te, en, inner) { return '<section class="aiskin__sec"><h4><span>' + ic + "</span>" + en + " <i>" + te + "</i></h4>" + inner + "</section>"; }

      var remainNote = (state.remaining != null)
        ? '<p class="aiskin__remain">మిగిలిన విశ్లేషణలు: <b>' + state.remaining + "/5</b> (90 రోజుల్లో)</p>" : "";

      if (r.imageUsable === false) {
        var vb = el(
          '<div class="aiskin__step aiskin__center">' +
            '<p class="aiskin__summary" style="text-align:left">' + esc(r.summary || "ఫోటో స్పష్టంగా లేదు — మంచి వెలుతురులో close-up ఫోటో మళ్ళీ ప్రయత్నించండి.") + "</p>" + remainNote +
            '<div class="aiskin__actions"><span></span><button class="btn btn--primary aiskin__retry">📷 Try Another Photo</button></div>' +
          "</div>"
        );
        vb.querySelector(".aiskin__retry").addEventListener("click", function () { state.image = ""; state.image2 = ""; state.result = null; setView("photo"); });
        return vb;
      }

      /* The appearance gauges, the 3-step severity scale, "possible factors",
         "self-care tips", the "suggested treatments" tags and the before-vs-now
         comparison were all removed in v5. See the header of this file for the
         clause behind each one. They are not rebuilt below — if a future server
         response still carries those fields, they are simply ignored. */

      var waText = "నమస్తే Medicare 🌸 " + (state.name ? state.name + " — " : "") + "నేను website లో AI photo description చేసాను.\nఫోటోలో కనిపించినది: " + (r.summary || "").slice(0, 220) + "\nవైద్యుల సంప్రదింపు కావాలి.";

      /* Fixed, always-present legal block. It must NOT depend on the server's
         `disclaimer` field, which can come back empty on an error path.
         NMC 06/10/2026 cl. 7.2(c) (AI source mark), 7.2(a) (no diagnosis /
         outcome representation); TPG 2020 cl. 5.4 (AI may not counsel or
         prescribe) and 3.5.1 (physical examination may be essential);
         NMC Act 2019 s.34 (only a registered practitioner may form the opinion). */
      var AI_MARK = '<p class="aiskin__aimark">🤖 <b>AI-generated content</b> · ఈ వివరణను <b>కృత్రిమ మేధ (AI)</b> తయారు చేసింది — వైద్యుడు రాసినది కాదు.</p>';
      var LEGAL =
        '<div class="aiskin__legal">' +
          '<b>దయచేసి గమనించండి</b>' +
          '<ul>' +
            '<li>ఇది <b>వ్యాధి నిర్ధారణ (diagnosis) కాదు</b>, చికిత్స సలహా కాదు, ఫలితాల అంచనా కాదు.</li>' +
            '<li>ఫోటో చూసి <b>వైద్య అభిప్రాయం చెప్పగలిగేది నమోదిత వైద్యుడు (Registered Medical Practitioner) మాత్రమే</b> — సాఫ్ట్‌వేర్ కాదు.</li>' +
            '<li>చర్మం, జుట్టు సమస్యలకు చాలాసార్లు <b>స్వయంగా పరీక్ష</b> (dermoscopy, trichoscopy, scraping, biopsy) అవసరం. ఫోటో దానికి ప్రత్యామ్నాయం కాదు.</li>' +
            '<li>ఈ వివరణ ఆధారంగా <b>మందులు వాడొద్దు</b>. వైద్యుని సలహా లేకుండా ఏ క్రీము, మాత్ర, ఇంజెక్షన్ వాడటం ప్రమాదకరం.</li>' +
          '</ul>' +
        '</div>';

      var v = el(
        '<div class="aiskin__step">' +
          '<div id="aiReport">' +
            '<div class="aiskin__pdfhead"><b>MEDICARE</b> Skin &amp; Hair Clinic — AI photo description (not a diagnosis) · ' + new Date().toLocaleDateString("en-IN") + "</div>" +
            '<h3 class="aiskin__h">What the AI saw in your photo <i>మీ ఫోటోలో AI కి కనిపించినవి</i></h3>' +
            AI_MARK +
            (r.seeDoctorSoon ? '<div class="aiskin__soon">⚕️ దయచేసి <b>త్వరగా</b> మా వైద్యులను స్వయంగా కలవండి. <i>Please see our dermatologist soon.</i></div>' : "") +
            (r.summary ? '<p class="aiskin__summary">' + esc(r.summary) + "</p>" : "") +
            (r.observations && r.observations.length ? section("👁️", "ఫోటోలో కనిపించినవి", "Visible in the photo", list(r.observations)) : "") +
            LEGAL +
            (r.disclaimer ? '<p class="aiskin__disc">' + esc(r.disclaimer) + "</p>" : "") +
          "</div>" + remainNote +
          '<div class="aiskin__cta">' +
            '<a class="btn btn--primary" href="#contact">📅 వైద్యుల అపాయింట్‌మెంట్</a>' +
            '<a class="btn btn--ghost" target="_blank" rel="noopener" href="https://wa.me/' + WA + "?text=" + encodeURIComponent(waText) + '">💬 WhatsApp</a>' +
            '<button class="btn btn--ghost aiskin__pdf">📄 PDF కాపీ</button>' +
            ((state.remaining == null || state.remaining > 0) ? '<button class="btn btn--ghost aiskin__retry">📷 New Photo</button>' : "") +
          "</div>" +
        "</div>"
      );

      var rt = v.querySelector(".aiskin__retry");
      if (rt) rt.addEventListener("click", function () { state.image = ""; state.image2 = ""; state.result = null; setView("photo"); });

      v.querySelector(".aiskin__pdf").addEventListener("click", function () {
        var btn = this; btn.disabled = true; btn.textContent = "Preparing…";
        Promise.all([
          loadScript("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"),
          loadScript("https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js")
        ]).then(function () {
          var node = v.querySelector("#aiReport");
          node.classList.add("aiskin__pdfmode");
          return window.html2canvas(node, { scale: 2, backgroundColor: "#ffffff", useCORS: true }).then(function (canvas) {
            node.classList.remove("aiskin__pdfmode");
            var pdf = new window.jspdf.jsPDF("p", "mm", "a4");
            var pw = 190, ph = 277;                       // printable area (10mm margins)
            var ih = canvas.height * pw / canvas.width;   // image height in mm
            var pageCanvas = document.createElement("canvas"), pctx = pageCanvas.getContext("2d");
            var pagePx = Math.floor(canvas.width * ph / pw);   // source px per page
            var y = 0, page = 0;
            while (y < canvas.height) {
              var slice = Math.min(pagePx, canvas.height - y);
              pageCanvas.width = canvas.width; pageCanvas.height = slice;
              pctx.fillStyle = "#fff"; pctx.fillRect(0, 0, canvas.width, slice);
              pctx.drawImage(canvas, 0, y, canvas.width, slice, 0, 0, canvas.width, slice);
              if (page) pdf.addPage();
              pdf.addImage(pageCanvas.toDataURL("image/jpeg", 0.92), "JPEG", 10, 10, pw, slice * pw / canvas.width);
              y += slice; page++;
            }
            var d = new Date(), fn = "Medicare-AI-photo-description-" + d.getFullYear() + ("0" + (d.getMonth() + 1)).slice(-2) + ("0" + d.getDate()).slice(-2) + ".pdf";
            pdf.save(fn);
          });
        }).catch(function () { alert("PDF తయారు చేయలేకపోయాం — దయచేసి మళ్ళీ ప్రయత్నించండి."); })
          .then(function () { btn.disabled = false; btn.textContent = "📄 PDF కాపీ"; });
      });
      return v;
    },

    /* The "compare" view (Before · / Now · thumbnails + score deltas) was
       removed in v5. It depended on the appearance scores, which are gone, and
       it required keeping a copy of the patient's photograph in localStorage,
       which SPDI Rules 2011 r.5(4) does not allow beyond the purpose. */
  };

  /* ----------------------------- analyze ----------------------------- */
  /* saveHistory() was removed in v5 — nothing about the analysis is kept on the
     device any more. */

  function runAnalysis() {
    var type = "skin";
    CONCERN_OPTS.forEach(function (o) { if (o[0] === state.concern) type = o[2]; });
    var stored = lsGet(LS_KEY, {});
    var usageToken = (stored.phone === state.phone && stored.token) ? stored.token : "";
    var imgs = [{ data: state.image, mediaType: "image/jpeg" }];
    if (state.image2) imgs.push({ data: state.image2, mediaType: "image/jpeg" });

    api("/api/analyze", {
      images: imgs,
      consent: true, phone: state.phone, usageToken: usageToken,
      patient: { type: type, age: state.age, gender: state.gender, area: state.concern, details: state.concern }
    }).then(function (r) {
      if (r.ok && r.json.ok && r.json.result) {
        state.result = r.json.result;
        state.remaining = (typeof r.json.remaining === "number") ? r.json.remaining : null;
        if (!DEMO && r.json.usageToken) lsSet(LS_KEY, { phone: state.phone, token: r.json.usageToken });
        // The person gave a phone number and a concern, with notice and consent at
        // the details step, so it reaches the clinic desk as an enquiry. `guardian`
        // records that an adult submitted an under-18's photo (TPG 2020 cl. 3.2.3).
        if (!DEMO && typeof window.medicareSendLead === "function") {
          var rs = state.result;
          window.medicareSendLead({ kind: "ai_analysis", phone: state.phone, age: state.age, concern: state.concern, guardianConsent: !!state.guardian, seeDoctorSoon: !!rs.seeDoctorSoon, summary: rs.summary });
        }
        setView("result");
        return;
      }
      if (r.status === 429) { state.limitMsg = (r.json && r.json.message) || ""; setView("limit"); return; }
      if (r.status === 400 && r.json && r.json.error === "phone_required") { state.limitMsg = r.json.message || ""; setView("details"); return; }
      state.result = { imageUsable: true, summary: (r.json && r.json.message) || "AI వివరణ తయారు కాలేదు — దయచేసి మళ్ళీ ప్రయత్నించండి, లేదా మా వైద్యులను నేరుగా సంప్రదించండి.", observations: [], seeDoctorSoon: false, disclaimer: "" };
      setView("result");
    }).catch(function () {
      state.result = { imageUsable: true, summary: "నెట్‌వర్క్ సమస్య — దయచేసి మళ్ళీ ప్రయత్నించండి.", observations: [], seeDoctorSoon: false, disclaimer: "" };
      setView("result");
    });
  }

  /* ------------------------------ start ------------------------------ */
  startBtn.addEventListener("click", function () {
    flow.hidden = false;
    startBtn.setAttribute("aria-expanded", "true");
    setView("details");
  });
})();
