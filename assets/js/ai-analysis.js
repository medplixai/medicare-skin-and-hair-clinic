/* =====================================================================
   MEDICARE — AI Skin & Hair Analysis wizard  (v2, elegant shell UI)
   Backend: /api/send-otp, /api/verify-otp, /api/analyze (unchanged).
   Add ?aidemo=1 to the URL to walk the flow without a backend.
   ===================================================================== */
(function () {
  "use strict";
  var mount = document.getElementById("aiskinMount");
  if (!mount) return;

  var DEMO = /[?&]aidemo=1/.test(location.search);
  var WA = "919141247777";
  var REDUCE = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------ state ------------------------------ */
  var state = {
    view: "form",            // form | verify | photo | analyzing | result
    type: "skin",
    age: "", gender: "", concerns: [], details: "",
    phone: "", otpSent: false, devHint: "", verifyMsg: "",
    consentToken: "",
    image: "", mediaType: "image/jpeg", dim: false,
    result: null,
    cleanup: null             // per-view timers/listeners
  };

  var CONCERNS = {
    skin: [
      ["మొటిమలు", "Acne"], ["మచ్చలు / పిగ్మెంటేషన్", "Pigmentation"], ["టాన్ / నలుపుదనం", "Tan"],
      ["ముడతలు / వృద్ధాప్య ఛాయలు", "Wrinkles"], ["దురద / తామర", "Itch / Eczema"], ["సోరియాసిస్", "Psoriasis"],
      ["బొల్లి మచ్చలు", "Vitiligo"], ["ఫంగల్ ఇన్ఫెక్షన్", "Fungal"], ["గోళ్ళ సమస్య", "Nail issue"], ["ఇతర", "Other"]
    ],
    hair: [
      ["జుట్టు రాలడం", "Hair fall"], ["చుండ్రు", "Dandruff"], ["బట్టతల / పలచబడటం", "Thinning"],
      ["ప్యాచీ అలోపేసియా", "Patchy loss"], ["స్కాల్ప్ దురద", "Scalp itch"], ["ముందుగా తెల్లజుట్టు", "Early greying"], ["ఇతర", "Other"]
    ]
  };
  var AGES = ["18 లోపు", "18–25", "26–35", "36–50", "50+"];
  var GENDERS = [["స్త్రీ", "Female"], ["పురుషుడు", "Male"], ["ఇతర", "Other"]];

  /* ----------------------------- helpers ----------------------------- */
  function el(html) { var t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstChild; }
  function esc(s) { return (s == null ? "" : String(s)).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function digits(s) { return (s || "").replace(/\D/g, ""); }

  function api(path, body) {
    if (DEMO) return demo(path, body);
    return fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function(){return {};}).then(function (j) { return { ok: r.ok, status: r.status, json: j }; }); });
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
            summary: "మీ ఫోటోలో మొటిమలు (acne) & స్వల్ప మచ్చలు కనిపిస్తున్నాయి — ఇది సాధారణంగా చికిత్సతో మెరుగుపడుతుంది. Your photo shows mild acne with a few marks; commonly manageable with care.",
            observations: ["కొన్ని active మొటిమలు & రెడ్‌నెస్ · a few active pimples with redness", "స్వల్ప post-acne మచ్చలు · mild post-acne marks"],
            possibleFactors: ["ఆయిల్ స్కిన్ / hormonal మార్పులు · oily skin or hormonal changes", "సరిపడని skincare · irregular skincare routine"],
            selfCareTips: ["రోజుకు 2 సార్లు మృదువైన cleanser వాడండి", "బయటికి వెళ్ళేటప్పుడు sunscreen తప్పనిసరి", "మొటిమలను గిల్లవద్దు / పిండవద్దు"],
            suggestedTreatments: ["Acne & acne-scar treatment", "Chemical peels", "HydraFacial"],
            severity: "recommend-consult", seeDoctorSoon: false,
            disclaimer: "ఇది AI సాధారణ సమాచారం మాత్రమే — వైద్య నిర్ధారణ కాదు. ఖచ్చితమైన అంచనా కోసం మా వైద్యులను సంప్రదించండి."
          }}});
        } else res({ ok: false, status: 400, json: {} });
      }, path === "/api/analyze" ? 2600 : 600);
    });
  }

  /* photo: downscale + simple brightness check */
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

  /* ------------------------------ shell ------------------------------ */
  var STAGES = ["వివరాలు", "ధృవీకరణ", "ఫోటో", "ఫలితం"];
  function stageIndex() {
    return state.view === "form" ? 0 : state.view === "verify" ? 1 :
           state.view === "photo" ? 2 : 3;
  }

  function shell(contentNode) {
    var idx = stageIndex();
    var pct = Math.round(((idx + (state.view === "result" ? 1 : 0.55)) / STAGES.length) * 100);
    var labels = STAGES.map(function (s, i) {
      return '<span class="' + (i < idx ? "done" : i === idx ? "on" : "") + '">' + (i < idx ? "✓ " : "") + s + "</span>";
    }).join("");

    var v = el(
      '<div class="aiskin__shell">' +
        '<aside class="aiskin__rail">' +
          '<div class="aiskin__brand"><span class="aiskin__badge">✨ Medicare AI</span>' +
            "<h3>చర్మం &amp; జుట్టు <br>AI విశ్లేషణ</h3>" +
            '<p class="aiskin__railsub">ఫోటోతో ~30 సెకన్లలో వ్యక్తిగత సూచనలు</p></div>' +
          '<ol class="aiskin__how">' +
            "<li><b>1</b>వివరాలు &amp; ఫోటో ఇవ్వండి</li>" +
            "<li><b>2</b>AI విశ్లేషిస్తుంది</li>" +
            "<li><b>3</b>ఫలితం &amp; చికిత్స సూచనలు</li>" +
          "</ol>" +
          '<div class="aiskin__trust">' +
            "<span>🔒 100% గోప్యం</span><span>🗑️ ఫోటో save అవదు</span><span>🆓 పూర్తిగా ఉచితం</span><span>⚕️ diagnosis కాదు</span>" +
          "</div>" +
        "</aside>" +
        '<div class="aiskin__content">' +
          '<div class="aiskin__progress"><div class="aiskin__bar"><i style="width:' + pct + '%"></i></div>' +
            '<div class="aiskin__stages">' + labels + "</div></div>" +
          '<div class="aiskin__view" id="aiView"></div>' +
        "</div>" +
      "</div>"
    );
    v.querySelector("#aiView").appendChild(contentNode);
    return v;
  }

  function setView(name) {
    if (state.cleanup) { try { state.cleanup(); } catch (e) {} state.cleanup = null; }
    state.view = name;
    mount.innerHTML = "";
    mount.appendChild(shell(views[name]()));
    var r = mount.getBoundingClientRect();
    if (r.top < 0 || r.top > innerHeight * 0.6) {
      mount.scrollIntoView({ behavior: REDUCE ? "auto" : "smooth", block: "start" });
    }
  }

  /* ------------------------------ views ------------------------------ */
  var views = {

    /* ---- 1. details: all tap-chips, no typing needed ---- */
    form: function () {
      var v = el(
        '<div class="aiskin__step">' +
          '<h3 class="aiskin__h">దేని గురించి? <i>What is this about?</i></h3>' +
          '<div class="aiskin__seg" role="tablist">' +
            '<button class="' + (state.type === "skin" ? "sel" : "") + '" data-t="skin">🧴 చర్మం / గోళ్ళు</button>' +
            '<button class="' + (state.type === "hair" ? "sel" : "") + '" data-t="hair">💇 జుట్టు / స్కాల్ప్</button>' +
          "</div>" +
          '<h4 class="aiskin__label">సమస్య ఎంచుకోండి <i>(ఒకటి లేదా ఎక్కువ)</i></h4>' +
          '<div class="aiskin__chips" id="aiConcerns"></div>' +
          '<div class="aiskin__row2">' +
            '<div><h4 class="aiskin__label">వయసు</h4><div class="aiskin__chips aiskin__chips--sm" id="aiAges"></div></div>' +
            '<div><h4 class="aiskin__label">లింగం</h4><div class="aiskin__chips aiskin__chips--sm" id="aiGenders"></div></div>' +
          "</div>" +
          '<h4 class="aiskin__label">మరిన్ని వివరాలు <i>(optional — ఎప్పటి నుండి, ఎక్కడ...)</i></h4>' +
          '<textarea class="aiskin__ta" id="aiDetails" rows="2" maxlength="500" placeholder="ఉదా. 2 నెలలుగా ముఖం మీద మొటిమలు...">' + esc(state.details) + "</textarea>" +
          '<p class="aiskin__err" id="aiErrF"></p>' +
          '<div class="aiskin__actions"><span></span><button class="btn btn--primary aiskin__next">కొనసాగించండి →</button></div>' +
        "</div>"
      );

      function chips(holder, list, selected, single) {
        holder.innerHTML = "";
        list.forEach(function (item) {
          var te = Array.isArray(item) ? item[0] : item, en = Array.isArray(item) ? item[1] : "";
          var b = el('<button type="button" class="aiskin__chip' + (selected.indexOf(te) > -1 ? " sel" : "") + '">' + esc(te) + (en ? "<i>" + esc(en) + "</i>" : "") + "</button>");
          b.addEventListener("click", function () {
            if (single) { selected.length = 0; selected.push(te); chips(holder, list, selected, true); }
            else {
              var i = selected.indexOf(te);
              if (i > -1) selected.splice(i, 1); else selected.push(te);
              b.classList.toggle("sel");
            }
          });
          holder.appendChild(b);
        });
      }
      var ageSel = state.age ? [state.age] : [], genSel = state.gender ? [state.gender] : [];
      chips(v.querySelector("#aiConcerns"), CONCERNS[state.type], state.concerns, false);
      chips(v.querySelector("#aiAges"), AGES, ageSel, true);
      chips(v.querySelector("#aiGenders"), GENDERS, genSel, true);

      v.querySelectorAll(".aiskin__seg button").forEach(function (b) {
        b.addEventListener("click", function () {
          if (state.type !== b.getAttribute("data-t")) { state.type = b.getAttribute("data-t"); state.concerns = []; setView("form"); }
        });
      });

      v.querySelector(".aiskin__next").addEventListener("click", function () {
        var err = v.querySelector("#aiErrF");
        state.details = v.querySelector("#aiDetails").value.trim();
        state.age = ageSel[0] || ""; state.gender = genSel[0] || "";
        if (!state.concerns.length && !state.details) { err.textContent = "కనీసం ఒక సమస్య ఎంచుకోండి (లేదా వివరించండి)."; return; }
        if (!state.age) { err.textContent = "వయసు ఎంచుకోండి."; return; }
        if (!state.gender) { err.textContent = "లింగం ఎంచుకోండి."; return; }
        setView(state.consentToken ? "photo" : "verify");
      });
      return v;
    },

    /* ---- 2. consent + phone + inline OTP ---- */
    verify: function () {
      var phaseB = state.otpSent;
      var v = el(
        '<div class="aiskin__step">' +
          '<h3 class="aiskin__h">అనుమతి &amp; మొబైల్ ధృవీకరణ <i>Consent &amp; verify</i></h3>' +
          '<label class="aiskin__check"><input type="checkbox" id="aiConsent"' + (state.consentChecked ? " checked" : "") + '><span>నా ఫోటో &amp; వివరాలను AI విశ్లేషణ కోసం ప్రాసెస్ చేయడానికి అంగీకరిస్తున్నాను. ఇది <b>వైద్య నిర్ధారణ కాదు</b>; ఫోటో <b>save అవదు</b>.<i>I consent to AI processing; not a diagnosis; photo is not stored.</i></span></label>' +
          '<h4 class="aiskin__label">మొబైల్ నంబర్</h4>' +
          '<div class="aiskin__phonerow"><span>+91</span><input id="aiPhone" type="tel" inputmode="numeric" maxlength="10" placeholder="10 అంకెలు" value="' + esc(state.phone) + '"' + (phaseB ? " disabled" : "") + ">" +
            '<button class="btn btn--primary aiskin__send" id="aiSend">' + (phaseB ? "మార్చు" : "OTP పంపండి") + "</button></div>" +
          (phaseB
            ? ('<h4 class="aiskin__label">OTP నమోదు చేయండి' + (state.devHint ? ' <i class="aiskin__devhint">🔑 test code: ' + esc(state.devHint) + "</i>" : "") + "</h4>" +
               '<div class="aiskin__otps" id="aiOtps">' + "<input maxlength='1' inputmode='numeric'>".repeat(6) + "</div>" +
               '<p class="aiskin__resend" id="aiResend">మళ్ళీ పంపడానికి <b>30</b>s</p>')
            : "") +
          '<p class="aiskin__err" id="aiErrV">' + esc(state.verifyMsg || "") + "</p>" +
          '<div class="aiskin__actions"><button class="btn btn--ghost aiskin__back">← వెనక్కి</button>' +
            (phaseB ? '<button class="btn btn--primary aiskin__go">ధృవీకరించండి ✓</button>' : "<span></span>") +
          "</div>" +
        "</div>"
      );
      state.verifyMsg = "";
      var err = v.querySelector("#aiErrV");
      v.querySelector(".aiskin__back").addEventListener("click", function () { state.otpSent = false; setView("form"); });

      function sendOtp() {
        if (!v.querySelector("#aiConsent").checked) { err.textContent = "దయచేసి పైన అనుమతి ✓ ఇవ్వండి."; return; }
        var ph = digits(v.querySelector("#aiPhone").value);
        if (ph.length !== 10) { err.textContent = "10 అంకెల సరైన నంబర్ ఇవ్వండి."; return; }
        state.phone = ph; state.consentChecked = true;
        var btn = v.querySelector("#aiSend"); btn.disabled = true; btn.textContent = "పంపుతోంది…";
        api("/api/send-otp", { phone: ph }).then(function (r) {
          if (r.ok && r.json.ok) { state.devHint = r.json.devHint || ""; state.otpSent = true; setView("verify"); }
          else { err.textContent = (r.json && r.json.message) || "OTP పంపడంలో సమస్య."; btn.disabled = false; btn.textContent = "OTP పంపండి"; }
        }).catch(function () { err.textContent = "నెట్‌వర్క్ సమస్య."; btn.disabled = false; btn.textContent = "OTP పంపండి"; });
      }

      if (!phaseB) {
        v.querySelector("#aiSend").addEventListener("click", sendOtp);
      } else {
        /* change number */
        v.querySelector("#aiSend").addEventListener("click", function () { state.otpSent = false; setView("verify"); });

        /* OTP boxes: auto-advance, backspace, paste */
        var boxes = [].slice.call(v.querySelectorAll("#aiOtps input"));
        boxes[0] && setTimeout(function () { boxes[0].focus(); }, 60);
        boxes.forEach(function (b, i) {
          b.addEventListener("input", function () {
            b.value = digits(b.value).slice(-1);
            if (b.value && i < 5) boxes[i + 1].focus();
          });
          b.addEventListener("keydown", function (e) {
            if (e.key === "Backspace" && !b.value && i > 0) boxes[i - 1].focus();
            if (e.key === "Enter") doVerify();
          });
          b.addEventListener("paste", function (e) {
            var t = digits((e.clipboardData || window.clipboardData).getData("text")).slice(0, 6);
            if (t.length > 1) { e.preventDefault(); boxes.forEach(function (x, j) { x.value = t[j] || ""; }); (boxes[Math.min(t.length, 5)] || b).focus(); }
          });
        });

        /* resend timer */
        var left = 30, rs = v.querySelector("#aiResend");
        var timer = setInterval(function () {
          left--;
          if (left <= 0) {
            clearInterval(timer);
            rs.innerHTML = '<button type="button" class="aiskin__link">మళ్ళీ OTP పంపండి</button>';
            rs.querySelector("button").addEventListener("click", function () { state.otpSent = false; sendOtpAgain(); });
          } else rs.innerHTML = "మళ్ళీ పంపడానికి <b>" + left + "</b>s";
        }, 1000);
        state.cleanup = function () { clearInterval(timer); };
        function sendOtpAgain() {
          api("/api/send-otp", { phone: state.phone }).then(function (r) {
            if (r.ok && r.json.ok) { state.devHint = r.json.devHint || ""; state.otpSent = true; setView("verify"); }
          });
        }

        function doVerify() {
          var code = boxes.map(function (b) { return b.value; }).join("");
          if (digits(code).length !== 6) { err.textContent = "6 అంకెల OTP నమోదు చేయండి."; return; }
          var go = v.querySelector(".aiskin__go"); go.disabled = true; go.textContent = "ధృవీకరిస్తోంది…";
          api("/api/verify-otp", { phone: state.phone, code: code }).then(function (r) {
            if (r.ok && r.json.ok && r.json.consentToken) { state.consentToken = r.json.consentToken; setView("photo"); }
            else { err.textContent = (r.json && r.json.message) || "OTP సరిపోలేదు."; go.disabled = false; go.textContent = "ధృవీకరించండి ✓"; }
          }).catch(function () { err.textContent = "నెట్‌వర్క్ సమస్య."; go.disabled = false; go.textContent = "ధృవీకరించండి ✓"; });
        }
        v.querySelector(".aiskin__go").addEventListener("click", doVerify);
      }
      return v;
    },

    /* ---- 3. photo ---- */
    photo: function () {
      var v = el(
        '<div class="aiskin__step">' +
          '<h3 class="aiskin__h">ఫోటో ఇవ్వండి <i>Upload a clear photo</i></h3>' +
          '<div class="aiskin__tips"><span>💡 మంచి వెలుతురు</span><span>📏 దగ్గరగా (close-up)</span><span>🚫 ఫిల్టర్ వద్దు</span></div>' +
          '<label class="aiskin__drop" id="aiDrop"><input id="aiFile" type="file" accept="image/*" hidden>' +
            '<span class="aiskin__dropinner" id="aiDropInner"><b>📷</b><strong>ఫోటో తీయండి / ఎంచుకోండి</strong><i>tap · drag &amp; drop · paste</i></span>' +
            '<span class="aiskin__preview" id="aiPrev" hidden></span>' +
          "</label>" +
          '<p class="aiskin__warn" id="aiWarn" hidden>⚠️ ఫోటో కొంచెం చీకటిగా ఉంది — వెలుతురులో తీస్తే ఫలితం మెరుగ్గా ఉంటుంది.</p>' +
          '<p class="aiskin__err" id="aiErrP"></p>' +
          '<div class="aiskin__actions"><button class="btn btn--ghost aiskin__back">← వెనక్కి</button>' +
            '<button class="btn btn--primary aiskin__go"' + (state.image ? "" : " disabled") + ">విశ్లేషించండి ✨</button></div>" +
        "</div>"
      );
      var drop = v.querySelector("#aiDrop"), inner = v.querySelector("#aiDropInner"),
          prev = v.querySelector("#aiPrev"), go = v.querySelector(".aiskin__go"),
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
      v.querySelector(".aiskin__back").addEventListener("click", function () { setView("form"); });
      go.addEventListener("click", function () { if (state.image) { setView("analyzing"); runAnalysis(); } });
      return v;
    },

    /* ---- 4. analyzing: photo scan animation ---- */
    analyzing: function () {
      var v = el(
        '<div class="aiskin__step aiskin__center">' +
          '<div class="aiskin__scanwrap">' +
            '<img src="' + state.image + '" alt="">' +
            '<span class="aiskin__scanline" aria-hidden="true"></span>' +
          "</div>" +
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

    /* ---- 5. result ---- */
    result: function () {
      var r = state.result || {};
      function list(arr) {
        return '<ul class="aiskin__list">' + (arr || []).map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>";
      }
      function section(ic, te, en, inner) {
        return '<section class="aiskin__sec"><h4><span>' + ic + "</span>" + te + " <i>" + en + "</i></h4>" + inner + "</section>";
      }

      var v;
      if (r.imageUsable === false) {
        v = el(
          '<div class="aiskin__step aiskin__center">' +
            '<p class="aiskin__summary">' + esc(r.summary || "ఫోటో స్పష్టంగా లేదు — మంచి వెలుతురులో close-up ఫోటో మళ్ళీ ప్రయత్నించండి.") + "</p>" +
            '<div class="aiskin__actions"><span></span><button class="btn btn--primary aiskin__retry">📷 మళ్ళీ ఫోటో</button></div>' +
          "</div>"
        );
      } else {
        var sev = r.severity === "see-soon" ? 2 : r.severity === "recommend-consult" ? 1 : 0;
        var sevRow = ["సాధారణ సంరక్షణ", "వైద్య సలహా మంచిది", "త్వరగా సంప్రదించండి"].map(function (s, i) {
          return '<span class="' + (i === sev ? "on s" + i : "") + '">' + s + "</span>";
        }).join("");
        var waText = "నమస్తే Medicare 🌸 నేను website లో AI Skin & Hair Analysis చేసాను.\n" +
                     "ఫలితం: " + (r.summary || "").slice(0, 220) + "\nConsultation కావాలి.";
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
            '<p class="aiskin__disc">' + esc(r.disclaimer || "") + "</p>" +
            '<div class="aiskin__cta">' +
              '<a class="btn btn--primary" href="#contact">📅 అపాయింట్‌మెంట్</a>' +
              '<a class="btn btn--ghost" target="_blank" rel="noopener" href="https://wa.me/' + WA + "?text=" + encodeURIComponent(waText) + '">💬 WhatsApp లో పంపండి</a>' +
              '<button class="btn btn--ghost aiskin__retry">📷 మరో ఫోటో</button>' +
              '<button class="btn btn--ghost aiskin__edit">✏️ వివరాలు మార్చండి</button>' +
            "</div>" +
          "</div>"
        );
        v.querySelector(".aiskin__edit").addEventListener("click", function () { state.result = null; setView("form"); });
      }
      var rt = v.querySelector(".aiskin__retry");
      if (rt) rt.addEventListener("click", function () { state.image = ""; state.result = null; setView("photo"); });
      return v;
    }
  };

  /* ----------------------------- analyze ----------------------------- */
  function runAnalysis() {
    var patient = {
      type: state.type, age: state.age, gender: state.gender,
      area: state.concerns.join(", ").slice(0, 80),
      details: (state.concerns.length ? "సమస్యలు: " + state.concerns.join(", ") + ". " : "") + state.details
    };
    api("/api/analyze", { image: state.image, mediaType: state.mediaType, patient: patient, consentToken: state.consentToken })
      .then(function (r) {
        if (r.ok && r.json.ok && r.json.result) { state.result = r.json.result; setView("result"); return; }
        if (r.status === 401) { state.consentToken = ""; state.otpSent = false; state.verifyMsg = "ధృవీకరణ గడువు ముగిసింది — దయచేసి మళ్ళీ OTP చేయండి."; setView("verify"); return; }
        state.result = { imageUsable: true, summary: (r.json && r.json.message) || "AI విశ్లేషణ విఫలమైంది — దయచేసి మళ్ళీ ప్రయత్నించండి, లేదా మా వైద్యులను నేరుగా సంప్రదించండి.", observations: [], possibleFactors: [], selfCareTips: [], suggestedTreatments: [], severity: "recommend-consult", seeDoctorSoon: false, disclaimer: "" };
        setView("result");
      })
      .catch(function () {
        state.result = { imageUsable: true, summary: "నెట్‌వర్క్ సమస్య — దయచేసి మళ్ళీ ప్రయత్నించండి.", observations: [], possibleFactors: [], selfCareTips: [], suggestedTreatments: [], severity: "recommend-consult", seeDoctorSoon: false, disclaimer: "" };
        setView("result");
      });
  }

  setView("form");
})();
