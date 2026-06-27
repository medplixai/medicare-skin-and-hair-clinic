/* =====================================================================
   MEDICARE — AI Assistant (left-side chat)
   ---------------------------------------------------------------------
   A self-contained, data-driven assistant. It reads the LIVE site data
   (window.MEDICARE_BRANCHES + window.MEDICARE_PRICING) so prices, phones,
   addresses & doctors stay in sync automatically. Replies are in English;
   intent matching still understands Telugu + transliterations. No backend.
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
    return "<strong>" + esc(b.town) + (b.mapsName ? " (" + esc(b.mapsName) + ")" : "") + "</strong> branch:<br>" +
      "📍 " + esc(b.address || "") + "<br>" +
      (ph ? "📞 " + ph + "<br>" : "") +
      (docOf(b) ? "🩺 " + esc(docOf(b)) + "<br>" : "") +
      acts([
        b.phones && b.phones[0] ? act(telHref(b.phones[0]), "📞 Call") : "",
        b.mapsUrl ? act(b.mapsUrl, "📍 Directions (Map)", { blank: true }) : "",
        act("#contact", "Book appointment", { primary: true, close: true })
      ].filter(Boolean));
  }
  function branchesList() {
    var towns = branches().map(function (b) { return esc(b.mapsName || b.town); }).join(" · ");
    return "We have <strong>10+ branches</strong> across Andhra Pradesh:<br>" + towns +
      "<br>👉 Type a <strong>town name</strong> for that branch's details (address, phone, doctor)." +
      acts([act("#branches", "See all branches", { close: true })]);
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
    return "Hi! 🌸 I'm the <strong>Medicare AI Assistant</strong>. Ask me anything about skin, hair &amp; nail treatments, prices, branches or appointments. Pick a topic below or type your question. 👇";
  }
  function fallback() {
    return "Sorry, I didn't quite get that 🙏. You can ask about <strong>prices, branches, hair transplant, teleconsultation, doctors or timings</strong> — or talk to our team directly:" +
      acts([act(telHref("9141247777"), "📞 Call"), act("https://wa.me/" + WA, "WhatsApp", { blank: true })]);
  }

  var INTENTS = [
    { id: "greeting", keys: ["hi", "hello", "hey", "హాయ్", "హలో", "namaste", "namaskaram", "నమస్తే", "నమస్కారం", "help", "సహాయ", "ela unnav", "ఎలా ఉన్నా"], fn: greeting },

    { id: "teleconsult", keys: ["tele", "teleconsult", "teleconsultation", "online", "video", "ఆన్‌లైన్", "వీడియో", "టెలీ", "ఇంటి నుండి", "phone consult", "ఫోన్ లో"], fn: function () {
      return "🩺 <strong>Teleconsultation</strong> — talk to our senior dermatologists from home, by phone or video. Prescription &amp; follow-up included.<br>📞 Kaikaluru helpline: <a href='" + telHref("9141247777") + "'>9141 247 777</a>" +
        acts([act(TEL, "📞 Call now", { primary: true }), act("#teleconsultation", "Details", { close: true })]);
    } },

    { id: "hairtransplant", keys: ["hair transplant", "transplant", "ట్రాన్స్‌ప్లాంట్", "hairtransplant", "fue", "dhi", "బట్టతల", "baldness", "bald", "జుట్టు మార్పిడి", "grafts", "hairline"], fn: function () {
      return "💈 <strong>Hair Transplant</strong> — <strong>from ₹59,999</strong>.<br>Techniques: FUE · DHI · Bio-FUE + PRP/GFC · beard &amp; eyebrows.<br>✓ Natural hairline ✓ minimal discomfort ✓ your own hair that keeps growing." +
        acts([act("#hair-transplant", "See details", { close: true }), act("#contact", "Free consultation", { primary: true, close: true })]);
    } },

    { id: "technology", keys: ["technology", "equipment", "machine", "usfda", "us-fda", "fda", "alma", "quanta", "co2", "q-switch", "qswitch", "follirich", "laser brand", "టెక్నాలజీ", "పరికర", "మెషిన్", "లేజర్ బ్రాండ్"], fn: function () {
      return "🔬 <strong>Advanced Technology</strong> — we use <strong>FDA Verified</strong> advanced lasers: Diode (hair reduction), Pico, Fractional CO₂, Q-switched Nd:YAG — several are <strong>US-FDA 510(k) cleared</strong>. Plus Hydra facial · FolliRich GFC/PRP · FUE &amp; DHI.<br><small>“FDA Verified” = US-FDA cleared devices; results vary by person.</small>" +
        acts([act("#technology", "See all equipment", { close: true }), act("#contact", "Appointment", { primary: true, close: true })]);
    } },

    { id: "hair", keys: ["hair fall", "hairfall", "hair loss", "జుట్టు రాల", "జుట్టు రాలు", "prp", "gfc", "మెసో", "mesotherapy", "dandruff", "చుండ్రు", "జుట్టు సమస్య"], fn: function (t) {
      var p = priceLookup(t), px = p && p.length ? "<br>Approx. price: " + p.map(function (h) { return esc(h.name) + " — from " + inr(h.price); }).join("; ") : "";
      return "For hair fall, dandruff and baldness we offer PRP, GFC, mesotherapy and hair transplant. Book a consultation for the right diagnosis." + px +
        acts([act("#treatments", "Treatments &amp; Pricing", { close: true }), act("#contact", "Appointment", { primary: true, close: true })]);
    } },

    { id: "skin", keys: ["acne", "pimple", "మొటిమ", "pigment", "మచ్చ", "మచ్చలు", "melasma", "మెలస్మా", "psoriasis", "సోరియాసిస్", "scar", "tan", "మంగు", "wart", "పులిపిర", "fungal", "దురద", "allergy", "అలర్జీ", "చర్మ"], fn: function () {
      return "We treat acne, scars, pigmentation, melasma, psoriasis, fungal infections and allergies — all skin conditions, by specialists. Book a consultation for the right treatment for your condition." +
        acts([act("#services", "See conditions", { close: true }), act("#contact", "Appointment", { primary: true, close: true })]);
    } },

    { id: "laser", keys: ["laser", "లేజర్", "cosmetic", "కాస్మెటిక్", "botox", "బొటాక్స్", "filler", "ఫిల్లర్", "peel", "పీల్", "hydrafacial", "హైడ్రా", "glutathione", "గ్లూటా", "aesthetic", "laser hair removal", "tattoo"], fn: function (t) {
      var p = priceLookup(t), px = p && p.length ? "<br>" + p.map(function (h) { return "• " + esc(h.name) + " — <strong>from " + inr(h.price) + "</strong>"; }).join("<br>") : "";
      return "✨ We offer all <strong>lasers, cosmetic &amp; aesthetic</strong> treatments with USFDA-cleared machines — Botox, fillers, chemical peels, HydraFacial, glutathione, laser hair reduction, advanced lasers." + px + "<br><small>* 18% GST applies on cosmetic procedures.</small>" +
        acts([act("#treatments", "Full pricing", { close: true }), act("#contact", "Appointment", { primary: true, close: true })]);
    } },

    { id: "price", keys: ["price", "cost", "fee", "charge", "rate", "ధర", "ధరలు", "ఖర్చు", "ఫీజు", "రేటు", "ఎంత", "how much", "consultation fee"], fn: function (t) {
      var p = priceLookup(t);
      if (p && p.length) return "Price details:<br>" + p.map(function (h) { return "• " + esc(h.name) + " — <strong>from " + inr(h.price) + "</strong>"; }).join("<br>") + "<br><small>* all are “starts from” prices; 18% GST on cosmetic procedures.</small>" + acts([act("#treatments", "All prices", { close: true })]);
      return "💰 Consultation <strong>from ₹999</strong>. Other treatments are listed by category as “starts from” prices (85+ procedures). Hair transplant from ₹59,999.<br>👉 Type a treatment name for its price (e.g. “botox price”)." +
        acts([act("#treatments", "See pricing page", { primary: true, close: true })]);
    } },

    { id: "branches", keys: ["branch", "branches", "location", "locations", "where", "శాఖ", "శాఖలు", "address", "అడ్రస్", "చిరునామా", "ఎక్కడ", "near me", "directions", "దారి", "map"], fn: function () { return branchesList(); } },

    { id: "doctors", keys: ["doctor", "doctors", "వైద్యు", "డాక్టర్", "specialist", "నిపుణు", "dermatologist", "surgeon", "team", "బృందం", "meghana", "మేఘన", "nagaraju", "నాగరాజు", "founder", "ceo"], fn: function () {
      return "🩺 <strong>Our leadership:</strong><br>• Nagaraju Bandaru — MBA, Founder &amp; CEO<br>• Dr. Meghana — MBBS, MD, DVL (Gold Medalist), Medical Director<br>Plus qualified <strong>senior dermatologists</strong> at every branch." +
        acts([act("#doctors", "Our doctors", { close: true })]);
    } },

    { id: "hours", keys: ["timing", "timings", "time", "hours", "open", "closed", "సమయ", "టైమ్", "ఎప్పుడు", "గంటలు", "sunday", "ఆదివారం", "working"], fn: function () {
      return "🕒 <strong>Timings:</strong> Monday – Saturday · 9:00 AM – 2:00 PM &amp; 4:00 PM – 9:00 PM.<br>Break 2:00 – 4:00 PM · Sunday closed." +
        acts([act(TEL, "📞 Call"), act("#contact", "Appointment", { primary: true, close: true })]);
    } },

    { id: "ai", keys: ["ai", "ఏఐ", "analysis", "అనాలిసిస్", "skin analysis", "hair analysis", "scan"], fn: function () {
      return "🤖 Yes! Our clinic offers <strong>AI Skin &amp; Hair Analysis</strong> — we accurately assess your skin/hair condition and give a personalised treatment plan." +
        acts([act("#contact", "Book appointment", { primary: true, close: true })]);
    } },

    { id: "appointment", keys: ["appointment", "book", "booking", "అపాయింట్", "బుక్", "slot", "consult", "సంప్రదింపు", "కన్సల్ట్", "meet", "visit", "రావాలి"], fn: function () {
      return "📅 Booking an appointment is easy:<br>1️⃣ Fill the form below, or<br>2️⃣ Call / WhatsApp us directly." +
        acts([act("#contact", "📝 Appointment form", { primary: true, close: true }), act(TEL, "📞 Call"), act("https://wa.me/" + WA, "WhatsApp", { blank: true })]);
    } },

    { id: "contact", keys: ["contact", "phone", "number", "call", "whatsapp", "ఫోన్", "నంబర్", "కాల్", "సంప్రదించ", "వాట్సాప్", "reach"], fn: function () {
      return "📞 <strong>Contact us:</strong><br><a href='" + telHref("9141247777") + "'>9141 247 777</a> · <a href='" + telHref("08677223344") + "'>08677 223344</a> (Kaikaluru)" +
        acts([act(TEL, "📞 Call", { primary: true }), act("https://wa.me/" + WA, "WhatsApp", { blank: true })]);
    } },

    { id: "services", keys: ["service", "services", "treatment", "treatments", "చికిత్స", "సేవ", "what do you", "ఏం చేస్తా", "ఏమి చేస్తా", "specialit", "ప్రత్యేక"], fn: function () {
      return "At Medicare Skin &amp; Hair Clinic we offer complete care for <strong>skin, hair &amp; nail</strong> conditions: dermatology, hair transplant, plastic/aesthetic procedures, all lasers, cosmetic &amp; aesthetic treatments + AI Skin &amp; Hair Analysis — by senior specialists." +
        acts([act("#services", "Conditions", { close: true }), act("#treatments", "Treatments &amp; Pricing", { close: true })]);
    } },

    { id: "thanks", keys: ["thank", "thanks", "ధన్యవాద", "thank you", "tq", "thx", "super", "బాగుంది"], fn: function () { return "Glad I could help! 😊 Ask me anything else. Stay healthy! 🌸"; } }
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

  var CHIPS = ["Prices", "Branches", "Hair Transplant", "Appointment", "Teleconsultation", "Doctors", "Timings"];

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
