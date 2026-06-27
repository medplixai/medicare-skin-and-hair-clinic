/* =====================================================================
   MEDICARE — AI Assistant (left-side chat)
   ---------------------------------------------------------------------
   A self-contained, data-driven assistant. It reads the LIVE site data
   (window.MEDICARE_BRANCHES + window.MEDICARE_PRICING) so prices, phones,
   addresses & doctors stay in sync automatically. Intent matching covers
   Telugu + English + common transliterations. No backend / API key.
   (To upgrade to a live LLM later, replace respond() with a fetch() to a
   server endpoint that holds the API key — never put a key in this file.)
   ===================================================================== */
(function () {
  "use strict";

  var WA = "919141247777";          // Kaikaluru WhatsApp / main number
  var TEL = "+919141247777";
  var TEL2 = "+918677223344";

  /* ---------- helpers ---------- */
  function esc(t) { var d = document.createElement("div"); d.textContent = t == null ? "" : t; return d.innerHTML; }
  function inr(v) { var n = Number(v); return isNaN(n) ? String(v) : "₹" + n.toLocaleString("en-IN"); }
  function fmtPhone(p) {
    p = String(p || "");
    if (p.length === 10) return p.slice(0, 4) + " " + p.slice(4, 7) + " " + p.slice(7);
    if (p.length === 11 && p[0] === "0") return p.slice(0, 5) + " " + p.slice(5);
    return p;
  }
  function telHref(p) { p = String(p || ""); return "tel:+91" + (p[0] === "0" ? p.slice(1) : p); }
  function act(href, label, opts) {
    opts = opts || {};
    var cls = "chat-act" + (opts.primary ? " chat-act--primary" : "");
    var attrs = (opts.blank ? ' target="_blank" rel="noopener"' : "") + (opts.close ? ' data-close="1"' : "");
    return '<a class="' + cls + '" href="' + href + '"' + attrs + ">" + label + "</a>";
  }
  function acts(arr) { return '<div class="chat-acts">' + arr.join("") + "</div>"; }

  /* ---------- live data ---------- */
  function branches() { return window.MEDICARE_BRANCHES || []; }
  function docOf(b) { return b.doctor ? b.doctor.name : (b.doctors && b.doctors.length ? b.doctors.map(function (d) { return d.name; }).join(", ") : ""); }

  function findBranch(t) {
    var list = branches();
    for (var i = 0; i < list.length; i++) {
      var b = list[i];
      if (t.indexOf(b.town) >= 0) return b;
      if (b.mapsName && t.indexOf(b.mapsName.toLowerCase()) >= 0) return b;
    }
    // a couple of common spelling variants
    var alt = { "nuzvidu": "nuzvid", "nuzveedu": "nuzvid", "machlipatnam": "machilipatnam", "tadepalli": "tadepalligudem" };
    for (var k in alt) if (t.indexOf(k) >= 0) { var s = alt[k]; for (var j = 0; j < list.length; j++) if (list[j].slug === s) return list[j]; }
    return null;
  }
  function branchAnswer(b) {
    var ph = (b.phones || []).map(function (p) { return '<a href="' + telHref(p) + '">' + fmtPhone(p) + "</a>"; }).join(" · ");
    return "<strong>" + esc(b.town) + (b.mapsName ? " (" + esc(b.mapsName) + ")" : "") + "</strong> శాఖ:<br>" +
      "📍 " + esc(b.address || "") + "<br>" +
      (ph ? "📞 " + ph + "<br>" : "") +
      (docOf(b) ? "🩺 " + esc(docOf(b)) + "<br>" : "") +
      acts([
        b.phones && b.phones[0] ? act(telHref(b.phones[0]), "📞 కాల్ చేయండి") : "",
        b.mapsUrl ? act(b.mapsUrl, "📍 దారి (Map)", { blank: true }) : "",
        act("#contact", "అపాయింట్‌మెంట్", { primary: true, close: true })
      ].filter(Boolean));
  }
  function branchesList() {
    var towns = branches().map(function (b) { return esc(b.town); }).join(" · ");
    return "మాకు ఆంధ్రప్రదేశ్ అంతటా <strong>10+ శాఖలు</strong> ఉన్నాయి:<br>" + towns +
      "<br>👉 ఏ ఊరి శాఖ వివరాలు (అడ్రస్, ఫోన్, డాక్టర్) కావాలో ఆ <strong>ఊరి పేరు</strong> టైప్ చేయండి." +
      acts([act("#branches", "అన్ని శాఖలు చూడండి", { close: true })]);
  }

  function priceLookup(t) {
    var P = window.MEDICARE_PRICING; if (!P) return null;
    var items = [];
    (P.signature || []).forEach(function (s) { items.push({ name: s.name, te: s.nameTe, price: s.from }); });
    (P.categories || []).forEach(function (c) {
      (c.rows || []).forEach(function (r) { if (!r.sub && r.n) items.push({ name: r.n, te: "", price: (r.p && r.p[0]) }); });
    });
    var toks = t.split(/[^a-zఀ-౿]+/).filter(function (w) { return w.length >= 3; });
    var hits = [];
    items.forEach(function (it) {
      var nm = (it.name || "").toLowerCase();
      var matched = toks.some(function (w) { return nm.indexOf(w) >= 0 || (it.te && it.te.indexOf(w) >= 0); });
      if (matched && it.price != null && it.price !== "—") hits.push(it);
    });
    // de-dupe by name, cap 4
    var seen = {}, out = [];
    hits.forEach(function (h) { if (!seen[h.name]) { seen[h.name] = 1; out.push(h); } });
    return out.slice(0, 4);
  }

  /* ---------- intents ---------- */
  function greeting() {
    return "నమస్తే! 🌸 నేను <strong>మెడికేర్ AI అసిస్టెంట్</strong>. చర్మం, జుట్టు, గోళ్ళ చికిత్సలు, ధరలు, శాఖలు, అపాయింట్‌మెంట్ — ఏదైనా అడగండి. క్రింద ఒక అంశం ఎంచుకోండి లేదా మీ ప్రశ్న టైప్ చేయండి. 👇";
  }
  function fallback() {
    return "క్షమించండి, అది నాకు సరిగ్గా అర్థం కాలేదు 🙏. మీరు <strong>ధరలు, శాఖలు, హెయిర్ ట్రాన్స్‌ప్లాంట్, టెలీకన్సల్టేషన్, వైద్యులు, సమయాలు</strong> గురించి అడగవచ్చు — లేదా నేరుగా మా టీమ్‌తో మాట్లాడండి:" +
      acts([act(telHref("9141247777"), "📞 కాల్ చేయండి"), act("https://wa.me/" + WA, "WhatsApp", { blank: true })]);
  }

  var INTENTS = [
    { id: "greeting", keys: ["hi", "hello", "hey", "హాయ్", "హలో", "namaste", "namaskaram", "నమస్తే", "నమస్కారం", "help", "సహాయ", "ela unnav", "ఎలా ఉన్నా"], fn: greeting },

    { id: "teleconsult", keys: ["tele", "teleconsult", "teleconsultation", "online", "video", "ఆన్‌లైన్", "వీడియో", "టెలీ", "ఇంటి నుండి", "phone consult", "ఫోన్ లో"], fn: function () {
      return "🩺 <strong>టెలీకన్సల్టేషన్</strong> — ఇంటి నుండే ఫోన్ లేదా వీడియో ద్వారా మా సీనియర్ dermatologists తో నేరుగా మాట్లాడండి. Prescription &amp; follow-up కూడా అందుతాయి.<br>📞 కైకలూరు హెల్ప్‌లైన్: <a href='" + telHref("9141247777") + "'>9141 247 777</a>" +
        acts([act(TEL, "📞 ఇప్పుడే కాల్ చేయండి", { primary: true }), act("#teleconsultation", "వివరాలు", { close: true })]);
    } },

    { id: "hairtransplant", keys: ["hair transplant", "transplant", "ట్రాన్స్‌ప్లాంట్", "hairtransplant", "fue", "dhi", "బట్టతల", "baldness", "bald", "జుట్టు మార్పిడి", "grafts", "hairline"], fn: function () {
      return "💈 <strong>హెయిర్ ట్రాన్స్‌ప్లాంట్</strong> — <strong>₹59,999 నుండి</strong>.<br>పద్ధతులు: FUE · DHI · Bio-FUE + PRP/GFC · గడ్డం &amp; కనుబొమ్మలు.<br>✓ Natural hairline ✓ నొప్పి తక్కువ ✓ శాశ్వతంగా పెరిగే మీ సొంత జుట్టు." +
        acts([act("#hair-transplant", "వివరాలు చూడండి", { close: true }), act("#contact", "ఉచిత సంప్రదింపు", { primary: true, close: true })]);
    } },

    { id: "technology", keys: ["technology", "equipment", "machine", "usfda", "us-fda", "fda", "alma", "quanta", "co2", "q-switch", "qswitch", "follirich", "laser brand", "టెక్నాలజీ", "పరికర", "మెషిన్", "లేజర్ బ్రాండ్"], fn: function () {
      return "🔬 <strong>అధునాతన టెక్నాలజీ</strong> — మేము <strong>FDA Verified</strong> అధునాతన లేజర్‌లు వాడతాం: Diode (హెయిర్ రిడక్షన్), Pico, Fractional CO₂, Q-switched Nd:YAG — పలు లేజర్‌లు <strong>US-FDA 510(k) cleared</strong>. అలాగే Hydra ఫేషియల్ · FolliRich GFC/PRP · FUE &amp; DHI.<br><small>“FDA Verified” = US-FDA cleared పరికరాలు; ఫలితాలు వ్యక్తికి మారవచ్చు.</small>" +
        acts([act("#technology", "అన్ని పరికరాలు చూడండి", { close: true }), act("#contact", "అపాయింట్‌మెంట్", { primary: true, close: true })]);
    } },

    { id: "hair", keys: ["hair fall", "hairfall", "hair loss", "జుట్టు రాల", "జుట్టు రాలు", "prp", "gfc", "మెసో", "mesotherapy", "dandruff", "చుండ్రు", "జుట్టు సమస్య"], fn: function (t) {
      var p = priceLookup(t), px = p && p.length ? "<br>సుమారు ధర: " + p.map(function (h) { return esc(h.name) + " — " + inr(h.price) + " నుండి"; }).join("; ") : "";
      return "జుట్టు రాలటం, చుండ్రు, బట్టతల వంటి సమస్యలకు మేము PRP, GFC, mesotherapy, hair transplant వంటి చికిత్సలు అందిస్తాం. సరైన diagnosis కోసం consultation బుక్ చేయండి." + px +
        acts([act("#treatments", "చికిత్సలు &amp; ధరలు", { close: true }), act("#contact", "అపాయింట్‌మెంట్", { primary: true, close: true })]);
    } },

    { id: "skin", keys: ["acne", "pimple", "మొటిమ", "pigment", "మచ్చ", "మచ్చలు", "melasma", "మెలస్మా", "psoriasis", "సోరియాసిస్", "scar", "tan", "మంగు", "wart", "పులిపిర", "fungal", "దురద", "allergy", "అలర్జీ", "చర్మ"], fn: function () {
      return "మేము మొటిమలు, మచ్చలు, pigmentation, melasma, psoriasis, fungal infections, allergy — అన్ని రకాల చర్మ వ్యాధులకు నిపుణుల చికిత్స అందిస్తాం. మీ పరిస్థితిని బట్టి సరైన చికిత్స కోసం consultation బుక్ చేయండి." +
        acts([act("#services", "వ్యాధులు చూడండి", { close: true }), act("#contact", "అపాయింట్‌మెంట్", { primary: true, close: true })]);
    } },

    { id: "laser", keys: ["laser", "లేజర్", "cosmetic", "కాస్మెటిక్", "botox", "బొటాక్స్", "filler", "ఫిల్లర్", "peel", "పీల్", "hydrafacial", "హైడ్రా", "glutathione", "గ్లూటా", "aesthetic", "laser hair removal", "tattoo"], fn: function (t) {
      var p = priceLookup(t), px = p && p.length ? "<br>" + p.map(function (h) { return "• " + esc(h.name) + " — <strong>" + inr(h.price) + " నుండి</strong>"; }).join("<br>") : "";
      return "✨ మాకు USFDA ఆమోదిత యంత్రాలతో అన్ని రకాల <strong>lasers, cosmetic &amp; aesthetic</strong> చికిత్సలు ఉన్నాయి — Botox, fillers, chemical peels, HydraFacial, glutathione, laser hair reduction, advanced lasers." + px + "<br><small>* cosmetic procedures పై 18% GST అదనం.</small>" +
        acts([act("#treatments", "పూర్తి ధరలు", { close: true }), act("#contact", "అపాయింట్‌మెంట్", { primary: true, close: true })]);
    } },

    { id: "price", keys: ["price", "cost", "fee", "charge", "rate", "ధర", "ధరలు", "ఖర్చు", "ఫీజు", "రేటు", "ఎంత", "how much", "consultation fee"], fn: function (t) {
      var p = priceLookup(t);
      if (p && p.length) return "ధరల వివరాలు:<br>" + p.map(function (h) { return "• " + esc(h.name) + " — <strong>" + inr(h.price) + " నుండి</strong>"; }).join("<br>") + "<br><small>* అన్నీ \"నుండి\" ధరలు; cosmetic procedures పై 18% GST.</small>" + acts([act("#treatments", "అన్ని ధరలు", { close: true })]);
      return "💰 Consultation <strong>₹999 నుండి</strong>. మిగతా చికిత్సలు విభాగాల వారీగా \"నుండి\" ధరలతో ఉన్నాయి (85+ procedures). హెయిర్ ట్రాన్స్‌ప్లాంట్ ₹59,999 నుండి.<br>👉 ఏ treatment ధర కావాలో పేరు టైప్ చేయండి (ఉదా: \"botox ధర\")." +
        acts([act("#treatments", "ధరల పేజీ చూడండి", { primary: true, close: true })]);
    } },

    { id: "branches", keys: ["branch", "branches", "location", "locations", "where", "శాఖ", "శాఖలు", "address", "అడ్రస్", "చిరునామా", "ఎక్కడ", "near me", "directions", "దారి", "map"], fn: function () { return branchesList(); } },

    { id: "doctors", keys: ["doctor", "doctors", "వైద్యు", "డాక్టర్", "specialist", "నిపుణు", "dermatologist", "surgeon", "team", "బృందం", "meghana", "మేఘన", "nagaraju", "నాగరాజు", "founder", "ceo"], fn: function () {
      return "🩺 <strong>మా నాయకత్వం:</strong><br>• నాగరాజు బండారు — MBA, Founder &amp; CEO<br>• డా. మేఘన — MBBS, MD, DVL (Gold Medalist), Medical Director<br>అలాగే ప్రతి శాఖలో అర్హత కలిగిన <strong>సీనియర్ dermatologists</strong> ఉన్నారు." +
        acts([act("#doctors", "వైద్యుల బృందం", { close: true })]);
    } },

    { id: "hours", keys: ["timing", "timings", "time", "hours", "open", "closed", "సమయ", "టైమ్", "ఎప్పుడు", "గంటలు", "sunday", "ఆదివారం", "working"], fn: function () {
      return "🕒 <strong>సమయాలు:</strong> సోమవారం – శనివారం · ఉ. 9:00 – మ. 2:00 &amp; సా. 4:00 – రా. 9:00.<br>మ. 2:00 – సా. 4:00 విరామం · ఆదివారం సెలవు." +
        acts([act(TEL, "📞 కాల్ చేయండి"), act("#contact", "అపాయింట్‌మెంట్", { primary: true, close: true })]);
    } },

    { id: "ai", keys: ["ai", "ఏఐ", "analysis", "అనాలిసిస్", "skin analysis", "hair analysis", "scan"], fn: function () {
      return "🤖 అవును! మా క్లినిక్‌లో <strong>AI స్కిన్ &amp; హెయిర్ అనాలిసిస్</strong> అందుబాటులో ఉంది — మీ చర్మం/జుట్టు పరిస్థితిని ఖచ్చితంగా అంచనా వేసి, వ్యక్తిగత చికిత్స ప్రణాళిక ఇస్తాం." +
        acts([act("#contact", "అపాయింట్‌మెంట్ బుక్ చేయండి", { primary: true, close: true })]);
    } },

    { id: "appointment", keys: ["appointment", "book", "booking", "అపాయింట్", "బుక్", "slot", "consult", "సంప్రదింపు", "కన్సల్ట్", "meet", "visit", "రావాలి"], fn: function () {
      return "📅 అపాయింట్‌మెంట్ బుక్ చేయడం చాలా సులభం:<br>1️⃣ క్రింది ఫారం నింపండి, లేదా<br>2️⃣ నేరుగా కాల్ / WhatsApp చేయండి." +
        acts([act("#contact", "📝 అపాయింట్‌మెంట్ ఫారం", { primary: true, close: true }), act(TEL, "📞 కాల్"), act("https://wa.me/" + WA, "WhatsApp", { blank: true })]);
    } },

    { id: "contact", keys: ["contact", "phone", "number", "call", "whatsapp", "ఫోన్", "నంబర్", "కాల్", "సంప్రదించ", "వాట్సాప్", "reach"], fn: function () {
      return "📞 <strong>మమ్మల్ని సంప్రదించండి:</strong><br><a href='" + telHref("9141247777") + "'>9141 247 777</a> · <a href='" + telHref("08677223344") + "'>08677 223344</a> (కైకలూరు)" +
        acts([act(TEL, "📞 కాల్ చేయండి", { primary: true }), act("https://wa.me/" + WA, "WhatsApp", { blank: true })]);
    } },

    { id: "services", keys: ["service", "services", "treatment", "treatments", "చికిత్స", "సేవ", "what do you", "ఏం చేస్తా", "ఏమి చేస్తా", "specialit", "ప్రత్యేక"], fn: function () {
      return "మెడికేర్ స్కిన్ &amp; హెయిర్ క్లినిక్‌లో <strong>చర్మం, జుట్టు &amp; గోళ్ళ</strong> వ్యాధులకు సంపూర్ణ చికిత్స: dermatology, hair transplant, plastic/aesthetic procedures, అన్ని రకాల lasers, cosmetic &amp; aesthetic treatments + AI స్కిన్ &amp; హెయిర్ అనాలిసిస్ — సీనియర్ నిపుణుల చేతుల్లో." +
        acts([act("#services", "వ్యాధులు", { close: true }), act("#treatments", "చికిత్సలు &amp; ధరలు", { close: true })]);
    } },

    { id: "thanks", keys: ["thank", "thanks", "ధన్యవాద", "thank you", "tq", "thx", "super", "బాగుంది"], fn: function () { return "మీకు సహాయం చేయగలిగినందుకు సంతోషం! 😊 మరేదైనా సందేహం ఉంటే అడగండి. ఆరోగ్యంగా ఉండండి! 🌸"; } }
  ];

  function intentById(id) { for (var i = 0; i < INTENTS.length; i++) if (INTENTS[i].id === id) return INTENTS[i]; }

  function respond(raw) {
    var t = (raw || "").toLowerCase().trim();
    if (!t) return greeting();
    // strong specific routing so the generic "price" intent doesn't steal these
    if (/transplant|ట్రాన్స్‌ప్లాంట్|బట్టతల|\bfue\b|\bdhi\b/.test(t)) return intentById("hairtransplant").fn(t);
    if (/\btele|teleconsult|ఆన్‌లైన్|వీడియో|టెలీ/.test(t)) return intentById("teleconsult").fn(t);
    if (/technology|equipment|machine|us-?fda|\bfda\b|alma|quanta|q-?switch|qswitch|follirich|\bco2\b|laser brand|టెక్నాలజీ|పరికర|మెషిన్/.test(t)) return intentById("technology").fn(t);
    var b = findBranch(t);
    var best = null, bestScore = 0;
    INTENTS.forEach(function (it) {
      var s = 0; it.keys.forEach(function (k) { if (t.indexOf(k) >= 0) s++; });
      if (s > bestScore) { bestScore = s; best = it; }
    });
    if (b && bestScore < 2 && (!best || best.id === "branches" || best.id === "contact" || best.id === "doctors" || best.id === "hours")) return branchAnswer(b);
    if (best) return best.fn(t);
    if (b) return branchAnswer(b);
    return fallback();
  }

  var CHIPS = ["ధరలు", "శాఖలు", "హెయిర్ ట్రాన్స్‌ప్లాంట్", "అపాయింట్‌మెంట్", "టెలీకన్సల్టేషన్", "వైద్యులు", "సమయాలు"];

  /* ---------- UI ---------- */
  function el(html) { var d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstChild; }

  function init() {
    var launch = document.getElementById("chatLaunch");
    var box = document.getElementById("chatbox");
    var body = document.getElementById("chatBody");
    var chips = document.getElementById("chatChips");
    var form = document.getElementById("chatForm");
    var input = document.getElementById("chatInput");
    var closeBtn = document.getElementById("chatClose");
    if (!launch || !box) return;

    var started = false;

    function scrollDown() { body.scrollTop = body.scrollHeight; }
    function addMsg(html, who) {
      var m = el('<div class="chat-msg chat-msg--' + who + '">' + html + "</div>");
      body.appendChild(m); scrollDown(); return m;
    }
    function botSay(html) {
      var typing = el('<div class="chat-msg chat-msg--bot chat-typing"><span></span><span></span><span></span></div>');
      body.appendChild(typing); scrollDown();
      setTimeout(function () { typing.remove(); addMsg(html, "bot"); }, 480);
    }
    function renderChips() {
      chips.innerHTML = "";
      CHIPS.forEach(function (c) {
        var b = el('<button class="chat-chip" type="button">' + c + "</button>");
        b.addEventListener("click", function () { send(c); });
        chips.appendChild(b);
      });
    }
    function send(text) {
      text = (text || "").trim(); if (!text) return;
      addMsg(esc(text), "user");
      botSay(respond(text));
    }

    function open() {
      box.classList.add("chatbox--open"); box.setAttribute("aria-hidden", "false");
      document.body.classList.add("chat-open");
      if (!started) { started = true; botSay(greeting()); renderChips(); }
      setTimeout(function () { input.focus(); }, 200);
    }
    function close() { box.classList.remove("chatbox--open"); box.setAttribute("aria-hidden", "true"); document.body.classList.remove("chat-open"); }

    launch.addEventListener("click", open);
    closeBtn.addEventListener("click", close);
    form.addEventListener("submit", function (e) { e.preventDefault(); var v = input.value; input.value = ""; send(v); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && box.classList.contains("chatbox--open")) close(); });
    // links inside answers that should close the chat (then their href scrolls)
    body.addEventListener("click", function (e) { var a = e.target.closest("[data-close]"); if (a) close(); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
