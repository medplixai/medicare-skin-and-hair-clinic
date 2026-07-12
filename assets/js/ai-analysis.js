/* =====================================================================
   MEDICARE — AI Skin & Hair Analysis  (v4 — advanced)
   DermaLuxe-style flow + advanced extras:
     • dual photo (main + optional hair/close-up)
     • 3D face analysis: MediaPipe FaceMesh point-cloud spins while the
       AI works (client-side & private; graceful fallback to scan line)
     • 0-100 appearance scores rendered as animated circular gauges
     • branded PDF report download (html2canvas + jsPDF, lazy-loaded)
     • on-device progress tracking: last 5 reports in localStorage with
       old-vs-new score comparison (nothing leaves the phone)
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
  var HIST_KEY = DEMO ? "medicareAiHistoryDemo" : "medicareAiHistory";

  var state = {
    view: "details",
    name: "", phone: "", age: "", gender: "", concern: "",
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
        if (used >= 5) { res({ ok: false, status: 429, json: { error: "limit_reached", remaining: 0, message: "ఈ నంబర్‌కు 90 రోజుల్లో 5 ఉచిత AI విశ్లేషణలు పూర్తయ్యాయి. మా వైద్యులను సంప్రదించండి 🌸" } }); return; }
        lsSet(LS_KEY, { phone: body.phone, used: used + 1, token: "demo" });
        var hair = body.patient && body.patient.type === "hair";
        res({ ok: true, status: 200, json: { ok: true, usageToken: "demo", remaining: 5 - (used + 1), result: {
          imageUsable: true,
          summary: "మీ ఫోటోలో మొటిమలు (acne) & స్వల్ప మచ్చలు కనిపిస్తున్నాయి — ఇది సాధారణంగా చికిత్సతో మెరుగుపడుతుంది. Your photo shows mild acne with a few marks; commonly manageable with care.",
          scores: hair
            ? [{ label: "జుట్టు సాంద్రత", labelEn: "Density look", value: 62 }, { label: "స్కాల్ప్ ఆరోగ్యం", labelEn: "Scalp health", value: 71 }, { label: "వాల్యూమ్", labelEn: "Volume", value: 58 }, { label: "మెరుపు", labelEn: "Shine", value: 66 }]
            : [{ label: "తేమ", labelEn: "Hydration", value: 64 }, { label: "ఆయిల్ బ్యాలెన్స్", labelEn: "Oil balance", value: 52 }, { label: "సమాన ఛాయ", labelEn: "Even tone", value: 58 }, { label: "ఆకృతి", labelEn: "Texture", value: 61 }, { label: "క్లారిటీ", labelEn: "Clarity", value: 55 }],
          observations: ["కొన్ని active మొటిమలు & రెడ్‌నెస్ · a few active pimples with redness", "స్వల్ప post-acne మచ్చలు · mild post-acne marks"],
          possibleFactors: ["ఆయిల్ స్కిన్ / hormonal మార్పులు · oily skin or hormonal changes", "సరిపడని skincare · irregular skincare routine"],
          selfCareTips: ["రోజుకు 2 సార్లు మృదువైన cleanser వాడండి", "బయటికి వెళ్ళేటప్పుడు sunscreen తప్పనిసరి", "మొటిమలను గిల్లవద్దు / పిండవద్దు"],
          suggestedTreatments: ["Acne & acne-scar treatment", "Chemical peels", "HydraFacial"],
          severity: "recommend-consult", seeDoctorSoon: false,
          disclaimer: "ఇది AI సాధారణ సమాచారం మాత్రమే — వైద్య నిర్ధారణ కాదు. ఖచ్చితమైన అంచనా కోసం మా వైద్యులను సంప్రదించండి."
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
  function makeThumb(dataUrl, cb) {
    var img = new Image();
    img.onload = function () {
      var max = 240, w = img.width, h = img.height;
      if (w > h) { h = Math.round(h * max / w); w = max; } else { w = Math.round(w * max / h); h = max; }
      var c = document.createElement("canvas"); c.width = w; c.height = h;
      c.getContext("2d").drawImage(img, 0, 0, w, h);
      cb(c.toDataURL("image/jpeg", 0.55));
    };
    img.onerror = function () { cb(""); };
    img.src = dataUrl;
  }

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
          '<label class="aiskin__check"><input type="checkbox" id="aiConsent"' + (state.consented ? " checked" : "") + '>' +
            '<span>నా ఫోటోను AI విశ్లేషణ కోసం ప్రాసెస్ చేయడానికి సమ్మతిస్తున్నాను — ఇది <b>వైద్య నిర్ధారణ కాదు</b>, ఫోటో <b>save అవదు</b>. <a href="privacy.html" target="_blank" rel="noopener">Privacy</a></span></label>' +
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
        state.consented = true;
        setView("photo");
      });
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
          '<h3 class="aiskin__h" style="margin-top:1.1rem">AI is Analyzing… <i>AI విశ్లేషిస్తోంది</i></h3>' +
          '<p class="aiskin__scanmsg" id="aiScanMsg">ఫోటోను పరిశీలిస్తోంది…</p>' +
        "</div>"
      );
      var msgs = ["ఫోటోను పరిశీలిస్తోంది…", "3D ఫేస్ మ్యాప్ తయారవుతోంది…", "చర్మం / జుట్టు లక్షణాలను గుర్తిస్తోంది…", "స్కోర్లు లెక్కిస్తోంది…", "సూచనలు సిద్ధం చేస్తోంది…"];
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
          '<h3 class="aiskin__h">Free Analyses Used Up <i>ఉచిత విశ్లేషణలు పూర్తయ్యాయి</i></h3>' +
          '<p class="aiskin__summary" style="text-align:left">' + esc(state.limitMsg || "ఈ నంబర్‌కు 90 రోజుల్లో 5 ఉచిత AI విశ్లేషణలు పూర్తయ్యాయి. ఖచ్చితమైన అంచనా & చికిత్స కోసం మా వైద్యులను సంప్రదించండి.") + "</p>" +
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
        ? '<p class="aiskin__remain">మిగిలిన ఉచిత విశ్లేషణలు: <b>' + state.remaining + "/5</b> (90 రోజుల్లో)</p>" : "";

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

      /* gauges */
      var gauges = "";
      if (r.scores && r.scores.length) {
        gauges = '<div class="aiskin__gauges">' + r.scores.slice(0, 6).map(function (s) {
          var val = Math.max(0, Math.min(100, s.value | 0));
          var cls = val >= 70 ? "g-good" : val >= 45 ? "g-mid" : "g-low";
          var C = 2 * Math.PI * 26;
          return '<div class="aiskin__gauge ' + cls + '" data-val="' + val + '">' +
            '<svg viewBox="0 0 64 64"><circle class="gbg" cx="32" cy="32" r="26"/><circle class="gfg" cx="32" cy="32" r="26" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + C.toFixed(1) + '"/></svg>' +
            '<b>' + val + "</b><span>" + esc(s.label) + "<i>" + esc(s.labelEn) + "</i></span></div>";
        }).join("") + "</div>";
      }

      var sev = r.severity === "see-soon" ? 2 : r.severity === "recommend-consult" ? 1 : 0;
      var sevRow = ["సాధారణ సంరక్షణ", "వైద్య సలహా మంచిది", "త్వరగా సంప్రదించండి"].map(function (s, i2) {
        return '<span class="' + (i2 === sev ? "on s" + i2 : "") + '">' + s + "</span>";
      }).join("");
      var waText = "నమస్తే Medicare 🌸 " + (state.name ? state.name + " — " : "") + "నేను website లో AI Skin & Hair Analysis చేసాను.\nఫలితం: " + (r.summary || "").slice(0, 220) + "\nConsultation కావాలి.";
      var hist = lsGet(HIST_KEY, []);
      var compareBtn = hist.length >= 2 ? '<button class="btn btn--ghost aiskin__compare">📈 Compare Progress</button>' : "";

      var v = el(
        '<div class="aiskin__step">' +
          '<div id="aiReport">' +
            '<div class="aiskin__pdfhead"><b>MEDICARE</b> Skin &amp; Hair Clinic — AI Report · ' + new Date().toLocaleDateString("en-IN") + "</div>" +
            '<h3 class="aiskin__h">Your AI Result <i>మీ AI ఫలితం</i></h3>' +
            gauges +
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
            '<p class="aiskin__disc">' + esc(r.disclaimer || "") + "</p>" +
          "</div>" + remainNote +
          '<div class="aiskin__cta">' +
            '<a class="btn btn--primary" href="#contact">📅 Book Appointment</a>' +
            '<a class="btn btn--ghost" target="_blank" rel="noopener" href="https://wa.me/' + WA + "?text=" + encodeURIComponent(waText) + '">💬 WhatsApp</a>' +
            '<button class="btn btn--ghost aiskin__pdf">📄 PDF Report</button>' +
            compareBtn +
            ((state.remaining == null || state.remaining > 0) ? '<button class="btn btn--ghost aiskin__retry">📷 New Photo</button>' : "") +
          "</div>" +
        "</div>"
      );

      /* animate gauges after paint (setTimeout fallback for throttled tabs) */
      function fillGauges() {
        [].forEach.call(v.querySelectorAll(".aiskin__gauge"), function (g) {
          var val = +g.getAttribute("data-val"), C = 2 * Math.PI * 26;
          g.querySelector(".gfg").style.strokeDashoffset = (C * (1 - val / 100)).toFixed(1);
        });
      }
      requestAnimationFrame(function () { requestAnimationFrame(fillGauges); });
      setTimeout(fillGauges, 250);

      var rt = v.querySelector(".aiskin__retry");
      if (rt) rt.addEventListener("click", function () { state.image = ""; state.image2 = ""; state.result = null; setView("photo"); });
      var cp = v.querySelector(".aiskin__compare");
      if (cp) cp.addEventListener("click", function () { setView("compare"); });

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
            var d = new Date(), fn = "Medicare-AI-Report-" + d.getFullYear() + ("0" + (d.getMonth() + 1)).slice(-2) + ("0" + d.getDate()).slice(-2) + ".pdf";
            pdf.save(fn);
          });
        }).catch(function () { alert("PDF తయారు చేయలేకపోయాం — దయచేసి మళ్ళీ ప్రయత్నించండి."); })
          .then(function () { btn.disabled = false; btn.textContent = "📄 PDF Report"; });
      });
      return v;
    },

    /* ---- compare (on-device history) ---- */
    compare: function () {
      var hist = lsGet(HIST_KEY, []);
      var a = hist[1], b = hist[0];   // previous vs latest
      function dt(ms) { return new Date(ms).toLocaleDateString("en-IN"); }
      var rows = "";
      if (a && b && a.scores && b.scores) {
        rows = b.scores.map(function (s) {
          var prev = null;
          a.scores.forEach(function (p) { if ((p.labelEn || "").toLowerCase() === (s.labelEn || "").toLowerCase()) prev = p; });
          if (!prev) return "";
          var d = s.value - prev.value;
          var cls = d > 2 ? "up" : d < -2 ? "down" : "flat";
          var arrow = d > 2 ? "▲" : d < -2 ? "▼" : "—";
          return "<tr><td>" + esc(s.label) + " <i>" + esc(s.labelEn) + "</i></td><td>" + prev.value + "</td><td>" + s.value + '</td><td class="' + cls + '">' + arrow + " " + (d > 0 ? "+" : "") + d + "</td></tr>";
        }).join("");
      }
      var v = el(
        '<div class="aiskin__step">' +
          '<h3 class="aiskin__h">Progress Comparison <i>పురోగతి పోలిక · మీ ఫోన్‌లోనే</i></h3>' +
          '<div class="aiskin__cmp">' +
            '<figure><img src="' + (a && a.thumb || "") + '" alt=""><figcaption>Before · ' + (a ? dt(a.d) : "") + "</figcaption></figure>" +
            '<span class="aiskin__cmparrow">➜</span>' +
            '<figure><img src="' + (b && b.thumb || "") + '" alt=""><figcaption>Now · ' + (b ? dt(b.d) : "") + "</figcaption></figure>" +
          "</div>" +
          (rows ? '<table class="aiskin__cmptable"><thead><tr><th>Parameter · పరామితి</th><th>Before · మునుపు</th><th>Now · ఇప్పుడు</th><th>Change</th></tr></thead><tbody>' + rows + "</tbody></table>"
                : '<p class="aiskin__scanmsg">పోల్చదగిన స్కోర్లు లేవు.</p>') +
          '<p class="aiskin__disc">ఈ పోలిక మీ ఫోన్‌లో మాత్రమే భద్రం — server కి వెళ్ళదు. ఫోటో పరిస్థితులు (వెలుతురు, angle) మారితే స్కోర్లు మారవచ్చు.</p>' +
          '<div class="aiskin__actions"><button class="btn btn--ghost aiskin__backres">← Back to Result</button><a class="btn btn--primary" href="#contact">📅 Book Appointment</a></div>' +
        "</div>"
      );
      v.querySelector(".aiskin__backres").addEventListener("click", function () { setView("result"); });
      return v;
    }
  };

  /* ----------------------------- analyze ----------------------------- */
  function saveHistory(r, done) {
    if (!r || r.imageUsable === false) { done(); return; }
    var finished = false;
    function fin() { if (!finished) { finished = true; done(); } }
    setTimeout(fin, 700);                       // never block the result on a slow thumb
    makeThumb(state.image, function (thumb) {
      var hist = lsGet(HIST_KEY, []);
      hist.unshift({ d: Date.now(), concern: state.concern, scores: r.scores || [], summary: (r.summary || "").slice(0, 180), thumb: thumb });
      lsSet(HIST_KEY, hist.slice(0, 5));
      fin();
    });
  }

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
        saveHistory(state.result, function () { setView("result"); });
        return;
      }
      if (r.status === 429) { state.limitMsg = (r.json && r.json.message) || ""; setView("limit"); return; }
      if (r.status === 400 && r.json && r.json.error === "phone_required") { state.limitMsg = r.json.message || ""; setView("details"); return; }
      state.result = { imageUsable: true, scores: [], summary: (r.json && r.json.message) || "AI విశ్లేషణ విఫలమైంది — దయచేసి మళ్ళీ ప్రయత్నించండి, లేదా మా వైద్యులను నేరుగా సంప్రదించండి.", observations: [], possibleFactors: [], selfCareTips: [], suggestedTreatments: [], severity: "recommend-consult", seeDoctorSoon: false, disclaimer: "" };
      setView("result");
    }).catch(function () {
      state.result = { imageUsable: true, scores: [], summary: "నెట్‌వర్క్ సమస్య — దయచేసి మళ్ళీ ప్రయత్నించండి.", observations: [], possibleFactors: [], selfCareTips: [], suggestedTreatments: [], severity: "recommend-consult", seeDoctorSoon: false, disclaimer: "" };
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
