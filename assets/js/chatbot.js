/* =====================================================================
   MEDICARE — AI Assistant (left-side chat)
   ---------------------------------------------------------------------
   A self-contained, data-driven assistant. It reads the LIVE site data
   (window.MEDICARE_BRANCHES + window.MEDICARE_PRICING) so prices, phones,
   addresses & doctors stay in sync automatically. Replies are in Telugu;
   intent matching understands Telugu + English + common transliterations.
   No backend / API key. (To upgrade to a live LLM later, replace respond()
   with a fetch() to a server endpoint that holds the key — never here.)

   LEGAL — read before editing any reply below.  NMC Guidelines on Ethical
   Advertising and Public Communication (No. R-13014/01/2024-Ethics,
   06/10/2026, in force) clause 3.2 treats chatbot and messaging-platform
   output as a medium of advertisement, so every clause that binds the
   page body binds these strings too:
     • 8.1(x)  — no free consultation, discount or other inducement
     • 8.1(iii)— no "best / No.1 / 100% / painless / guaranteed", no
                 personal achievements, success rates or patient counts
     • 8.1(ix) — no comparative or superiority claim
     • 8.1(vi) — no unrealistic expectation, no concealing of risk
     • 3.2 Expl. II — equipment may be stated as fact only, with no
                 superiority, guaranteed accuracy or guaranteed outcome
   Telemedicine Practice Guidelines 2020: cl. 5.4 an AI/ML platform may
   not counsel or prescribe; cl. 3.7.1.4 no soliciting for telemedicine
   by advertisement or inducement; cl. 3.7.3.1 teleconsultation fees are
   treated the same as in-person fees; cl. 3.5.1 do not proceed where a
   physical examination is critical; cl. 1.2 not for patients outside
   India.  Drugs and Magic Remedies Act 1954, s.3 and s.4: never name a
   drug, injection or medicine as treating any condition, and never for
   the Schedule conditions (impotence, venereal disease, leucoderma,
   leprosy, obesity among them).
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
    var list = branches();
    var towns = list.map(function (b) { return esc(b.town); }).join(" · ");
    // was a flat "10+ శాఖలు" — count what is actually in the data instead
    var n = list.length;
    return "మాకు ఆంధ్రప్రదేశ్‌లో <strong>" + n + " శాఖలు</strong> ఉన్నాయి:<br>" + towns +
      "<br>👉 ఏ ఊరి శాఖ వివరాలు (అడ్రస్, ఫోన్, డాక్టర్) కావాలో ఆ <strong>ఊరి పేరు</strong> టైప్ చేయండి." +
      acts([act("#branches", "అన్ని శాఖలు చూడండి", { close: true })]);
  }

  /* CCPA Guidelines 2022 cl. 12(e)(i) does not allow "prices from as low as
     Rs. Y" — a fixed amount, or a stated range with what drives it, is required.
     NMC 8.1(x) proviso: any disclosure of charges must be factual, transparent
     and not misleading. So quote the figure, then say plainly what can change
     it, and warn that not every procedure runs at every branch (CCPA cl. 5(c)(iii)
     and 5(d) on bait advertisements and geographic limits). */
  var PRICE_NOTE = "<br><small>* ఇవి ఆ ప్రక్రియకు క్లినిక్ ధరలు. సెషన్ల సంఖ్య, చికిత్స చేసే ప్రాంతం/విస్తీర్ణం బట్టి మొత్తం మారుతుంది — <strong>ఖచ్చితమైన మొత్తం చికిత్సకు ముందే</strong> చెప్పబడుతుంది. cosmetic procedures పై 18% GST అదనం. కొన్ని ప్రక్రియలు కొన్ని శాఖల్లోనే ఉంటాయి — బయలుదేరే ముందు మీ శాఖకు ఫోన్ చేసి నిర్ధారించుకోండి.</small>";

  function procedureCount() {
    var P = window.MEDICARE_PRICING; if (!P) return null;
    var n = 0;
    (P.categories || []).forEach(function (c) {
      (c.rows || []).forEach(function (r) { if (r && !r.sub && r.n) n++; });
    });
    return n || null;
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
    // NMC 06/10/2026 cl. 7.2(c): AI content must say it is AI. TPG 2020 cl. 5.4:
    // an AI platform may not counsel or prescribe — say so up front.
    return "నమస్తే! 🌸 నేను <strong>మెడికేర్ ఆటోమేటిక్ AI అసిస్టెంట్</strong> — <strong>వైద్యుడు కాదు</strong>. నేను శాఖలు, సమయాలు, ధరలు, చికిత్సల సమాచారం చెప్పగలను; <strong>వ్యాధి నిర్ధారణ చేయను, మందులు చెప్పను</strong>. వైద్య సలహా మా వైద్యులు మాత్రమే ఇస్తారు. క్రింద ఒక అంశం ఎంచుకోండి లేదా మీ ప్రశ్న టైప్ చేయండి. 👇";
  }
  function fallback() {
    return "క్షమించండి, అది నాకు సరిగ్గా అర్థం కాలేదు 🙏. మీరు <strong>ధరలు, శాఖలు, హెయిర్ ట్రాన్స్‌ప్లాంట్, టెలీకన్సల్టేషన్, వైద్యులు, సమయాలు, ఫిర్యాదు</strong> గురించి అడగవచ్చు — లేదా నేరుగా మా టీమ్‌తో మాట్లాడండి:" +
      acts([act(telHref("9141247777"), "📞 కాల్ చేయండి"), act("https://wa.me/" + WA, "WhatsApp", { blank: true })]);
  }

  var INTENTS = [
    { id: "greeting", keys: ["hi", "hello", "hey", "హాయ్", "హలో", "namaste", "namaskaram", "నమస్తే", "నమస్కారం", "help", "సహాయ", "ela unnav", "ఎలా ఉన్నా"], fn: greeting },

    { id: "teleconsult", keys: ["tele", "teleconsult", "teleconsultation", "online", "video", "ఆన్‌లైన్", "వీడియో", "టెలీ", "ఇంటి నుండి", "phone consult", "ఫోన్ లో"], fn: function () {
      // TPG 2020: 3.7.3.1 same fee as in-person; 3.7.4 a FIRST consult must be by
      // video for anything beyond over-the-counter advice; 3.5.1 do not proceed
      // where examination is critical; 1.2 India only. 3.7.1.4 forbids any
      // inducement to teleconsult, so no "free", no discount, no urgency here.
      return "🩺 <strong>ఆన్‌లైన్ (టెలీ) కన్సల్టేషన్</strong> — ఇంటి నుండే మా వైద్యులతో మాట్లాడవచ్చు.<br>" +
        "💰 ఫీజు <strong>₹200</strong> (VIP ₹500) — <strong>క్లినిక్‌లో వచ్చినా, ఆన్‌లైన్‌లో అయినా ఒకే ఫీజు</strong>. చెల్లించిన మొత్తానికి రసీదు ఇవ్వబడుతుంది.<br>" +
        "📹 <strong>మొదటి</strong> కన్సల్టేషన్ <strong>వీడియో కాల్‌లో</strong> జరగాలి — అప్పుడే వైద్యుడు అవసరమైన మందులు రాయగలరు.<br>" +
        "⚕️ చర్మం, జుట్టు సమస్యలకు చాలాసార్లు <strong>స్వయంగా పరీక్ష</strong> అవసరం. అలాంటప్పుడు వైద్యుడు ఆన్‌లైన్‌లో ముగించకుండా, దగ్గరి శాఖకు రావాలని చెబుతారు — అది మీ క్షేమం కోసమే.<br>" +
        "🇮🇳 ఈ సేవ <strong>భారతదేశంలో ఉన్న వారికే</strong>.<br>📞 కైకలూరు హెల్ప్‌లైన్: <a href='" + telHref("9141247777") + "'>9141 247 777</a>" +
        acts([act(TEL, "📞 కాల్ చేయండి", { primary: true }), act("#teleconsultation", "వివరాలు", { close: true })]);
    } },

    { id: "hairtransplant", keys: ["hair transplant", "transplant", "ట్రాన్స్‌ప్లాంట్", "hairtransplant", "fue", "dhi", "బట్టతల", "baldness", "bald", "జుట్టు మార్పిడి", "grafts", "hairline"], fn: function () {
      // "✓ నొప్పి తక్కువ" was a pain claim — NMC 8.1(iii) names "painless
      // treatment" expressly. The ✓ outcome list and "ఉచిత సంప్రదింపు" (free
      // consultation) are gone: 8.1(vi) outcomes/risk, 8.1(x) inducement.
      return "💈 <strong>హెయిర్ ట్రాన్స్‌ప్లాంట్</strong> — ధర <strong>₹59,999</strong> నుండి ప్రారంభం (grafts సంఖ్య, పద్ధతిని బట్టి మారుతుంది; ఖచ్చితమైన మొత్తం పరీక్ష తర్వాత చెబుతారు).<br>" +
        "పద్ధతులు: FUE · DHI · Bio-FUE + PRP/GFC · గడ్డం &amp; కనుబొమ్మలు.<br>" +
        "⚕️ ఇది <strong>శస్త్రచికిత్స</strong> — స్థానిక మత్తు, వాపు, ఇన్ఫెక్షన్ వంటి సాధ్య ప్రమాదాలు ఉంటాయి. ఎవరికి సరిపోతుందో, ఎంత జుట్టు అవసరమో <strong>పరీక్ష తర్వాతే</strong> తెలుస్తుంది. <strong>ఫలితాలు ఒక్కొక్కరికీ మారతాయి; ఏ ఫలితానికీ హామీ లేదు.</strong>" +
        acts([act("#hair-transplant", "వివరాలు చూడండి", { close: true }), act("#contact", "అపాయింట్‌మెంట్", { primary: true, close: true })]);
    } },

    { id: "technology", keys: ["technology", "equipment", "machine", "usfda", "us-fda", "fda", "alma", "quanta", "co2", "q-switch", "qswitch", "follirich", "laser brand", "టెక్నాలజీ", "పరికర", "మెషిన్", "లేజర్ బ్రాండ్"], fn: function () {
      // "FDA Verified" is not a regulatory status and gave a false impression of
      // the devices' character — Drugs and Magic Remedies Act 1954 s.4(a), and
      // NMC 8.1(iii) (unverifiable claim). Only "510(k)-cleared" is a real fact,
      // and cl. 3.2 Expl. II allows it as a plain statement with no superiority
      // or outcome attached.
      return "🔬 <strong>మా పరికరాలు</strong> — Diode (హెయిర్ రిడక్షన్), Pico, Fractional CO₂, Q-switched Nd:YAG లేజర్‌లు; అలాగే Hydra ఫేషియల్ · FolliRich GFC/PRP · FUE &amp; DHI.<br>ఈ లేజర్‌లలో పలువి <strong>US-FDA 510(k)-cleared</strong> పరికరాలు — అంటే ఆ పరికరానికి అమెరికా నియంత్రణ సంస్థ అనుమతి ఉందని మాత్రమే అర్థం.<br><small>ఇది పరికరం గురించి ఒక వాస్తవం మాత్రమే — ఫలితాల గురించి హామీ కాదు. ఫలితాలు ఒక్కొక్కరికీ మారతాయి.</small>" +
        acts([act("#technology", "అన్ని పరికరాలు చూడండి", { close: true }), act("#contact", "అపాయింట్‌మెంట్", { primary: true, close: true })]);
    } },

    { id: "hair", keys: ["hair fall", "hairfall", "hair loss", "జుట్టు రాల", "జుట్టు రాలు", "prp", "gfc", "మెసో", "mesotherapy", "dandruff", "చుండ్రు", "జుట్టు సమస్య"], fn: function (t) {
      var p = priceLookup(t), px = p && p.length ? "<br>ధర: " + p.map(function (h) { return esc(h.name) + " — " + inr(h.price); }).join("; ") + PRICE_NOTE : "";
      return "జుట్టు రాలటం, చుండ్రు, బట్టతల వంటి సమస్యలకు మేము PRP, GFC, mesotherapy, hair transplant వంటి చికిత్సలు అందిస్తాం. సరైన diagnosis కోసం consultation బుక్ చేయండి." + px +
        acts([act("#treatments", "చికిత్సలు &amp; ధరలు", { close: true }), act("#contact", "అపాయింట్‌మెంట్", { primary: true, close: true })]);
    } },

    { id: "skin", keys: ["acne", "pimple", "మొటిమ", "pigment", "మచ్చ", "మచ్చలు", "melasma", "మెలస్మా", "psoriasis", "సోరియాసిస్", "scar", "tan", "మంగు", "wart", "పులిపిర", "fungal", "దురద", "allergy", "అలర్జీ", "చర్మ"], fn: function () {
      return "మేము మొటిమలు, మచ్చలు, pigmentation, melasma, psoriasis, fungal infections, allergy — అన్ని రకాల చర్మ వ్యాధులకు నిపుణుల చికిత్స అందిస్తాం. మీ పరిస్థితిని బట్టి సరైన చికిత్స కోసం consultation బుక్ చేయండి." +
        acts([act("#services", "వ్యాధులు చూడండి", { close: true }), act("#contact", "అపాయింట్‌మెంట్", { primary: true, close: true })]);
    } },

    { id: "laser", keys: ["laser", "లేజర్", "cosmetic", "కాస్మెటిక్", "botox", "బొటాక్స్", "filler", "ఫిల్లర్", "peel", "పీల్", "hydrafacial", "హైడ్రా", "glutathione", "గ్లూటా", "aesthetic", "laser hair removal", "tattoo"], fn: function (t) {
      var p = priceLookup(t), px = p && p.length ? "<br>" + p.map(function (h) { return "• " + esc(h.name) + " — <strong>" + inr(h.price) + "</strong>"; }).join("<br>") : "";
      return "✨ మా క్లినిక్‌లో <strong>lasers, cosmetic &amp; aesthetic</strong> చికిత్సలు ఉన్నాయి — Botox, fillers, chemical peels, HydraFacial, glutathione, laser hair reduction, advanced lasers. వాడే లేజర్‌లలో పలువి US-FDA 510(k)-cleared పరికరాలు.<br>ఏ చికిత్స మీకు సరిపోతుందో <strong>పరీక్ష తర్వాతే</strong> వైద్యుడు నిర్ణయిస్తారు; ఫలితాలు ఒక్కొక్కరికీ మారతాయి." + px + PRICE_NOTE +
        acts([act("#treatments", "పూర్తి ధరలు", { close: true }), act("#contact", "అపాయింట్‌మెంట్", { primary: true, close: true })]);
    } },

    { id: "price", keys: ["price", "cost", "fee", "charge", "rate", "ధర", "ధరలు", "ఖర్చు", "ఫీజు", "రేటు", "ఎంత", "how much", "consultation fee"], fn: function (t) {
      var p = priceLookup(t);
      if (p && p.length) return "ధరల వివరాలు:<br>" + p.map(function (h) { return "• " + esc(h.name) + " — <strong>" + inr(h.price) + "</strong>"; }).join("<br>") + PRICE_NOTE + acts([act("#treatments", "అన్ని ధరలు", { close: true })]);
      // The fee is a flat ₹200 at every branch (VIP ₹500), not a "నుండి" price. This chip used
      // to answer "₹999 నుండి" — a figure no branch has ever charged for a consultation.
      // Publishing the charge is expressly permitted: IMC 2002 reg. 6.1.1(7)
      // "Public declaration of charges", restated at NMC 06/10/2026 cl. 8.2(ii)(g).
      var n = procedureCount();
      return "💰 కన్సల్టేషన్ ఫీజు <strong>₹200</strong> · VIP కన్సల్టేషన్ <strong>₹500</strong> — <strong>అన్ని శాఖల్లోనూ ఒకటే, ఆన్‌లైన్‌లోనూ అదే</strong>. రసీదు ఇవ్వబడుతుంది.<br>మిగతా చికిత్సల ధరలు విభాగాల వారీగా ధరల పేజీలో ఉన్నాయి" + (n ? " (" + n + " ప్రక్రియలు)" : "") + ". హెయిర్ ట్రాన్స్‌ప్లాంట్ ₹59,999 నుండి ప్రారంభం.<br>👉 ఏ treatment ధర కావాలో పేరు టైప్ చేయండి (ఉదా: \"botox ధర\")." + PRICE_NOTE +
        acts([act("#treatments", "ధరల పేజీ చూడండి", { primary: true, close: true })]);
    } },

    { id: "branches", keys: ["branch", "branches", "location", "locations", "where", "శాఖ", "శాఖలు", "address", "అడ్రస్", "చిరునామా", "ఎక్కడ", "near me", "directions", "దారి", "map"], fn: function () { return branchesList(); } },

    { id: "doctors", keys: ["doctor", "doctors", "వైద్యు", "డాక్టర్", "specialist", "నిపుణు", "dermatologist", "surgeon", "team", "బృందం", "meghana", "మేఘన", "nagaraju", "నాగరాజు", "founder", "ceo"], fn: function () {
      // "(Gold Medalist)" is a personal achievement — NMC 8.1(iii) forbids
      // advertising personal achievements. "సీనియర్" is an unverifiable
      // comparative flavour (8.1(ix)); "అర్హత కలిగిన" states the fact instead.
      // NMC cl. 3.2 Expl. IV + TPG 3.2.5 require name, qualification,
      // registration status and registration number wherever a doctor is named,
      // so the reply sends the reader to the directory that carries them.
      return "🩺 <strong>మా వైద్యులు:</strong><br>• డా. మేఘన — MBBS, MD, DVL — Medical Director<br>• నాగరాజు బండారు — MBA — Founder &amp; CEO (<i>వైద్యుడు కాదు; నిర్వహణ బాధ్యత</i>)<br>ప్రతి శాఖలో అర్హత కలిగిన చర్మవైద్య నిపుణులు ఉన్నారు. ప్రతి వైద్యుని <strong>అర్హతలు, మెడికల్ కౌన్సిల్ రిజిస్ట్రేషన్ నంబర్, ఏ శాఖలో ఉంటారు</strong> అనే వివరాలు శాఖల పేజీల్లో ఉన్నాయి — మీ వైద్యుని రిజిస్ట్రేషన్ నంబర్ అడిగి తెలుసుకునే హక్కు మీకు ఉంది." +
        acts([act("#doctors", "వైద్యుల వివరాలు", { close: true })]);
    } },

    { id: "hours", keys: ["timing", "timings", "time", "hours", "open", "closed", "సమయ", "టైమ్", "ఎప్పుడు", "గంటలు", "sunday", "ఆదివారం", "working"], fn: function () {
      return "🕒 <strong>సమయాలు:</strong> సోమవారం – శనివారం · ఉ. 10:00 – మ. 2:00 &amp; సా. 5:00 – రా. 9:00.<br>మ. 2:00 – సా. 5:00 విరామం · ఆదివారం సెలవు." +
        acts([act(TEL, "📞 కాల్ చేయండి"), act("#contact", "అపాయింట్‌మెంట్", { primary: true, close: true })]);
    } },

    { id: "ai", keys: ["ai", "ఏఐ", "analysis", "అనాలిసిస్", "skin analysis", "hair analysis", "scan"], fn: function () {
      // Was: "ఖచ్చితంగా అంచనా వేసి, వ్యక్తిగత చికిత్స ప్రణాళిక ఇస్తాం" — a
      // guaranteed-accuracy claim (cl. 3.2 Expl. II) plus an AI treatment plan,
      // which TPG 2020 cl. 5.4 flatly forbids.
      return "🤖 వెబ్‌సైట్‌లో <strong>AI ఫోటో వివరణ</strong> సౌకర్యం ఉంది: మీరు ఫోటో ఇస్తే, <strong>ఫోటోలో ఏమి కనిపిస్తోందో</strong> AI సాధారణ భాషలో రాస్తుంది.<br>⚠️ ఇది <strong>వ్యాధి నిర్ధారణ కాదు, చికిత్స ప్రణాళిక కాదు</strong> — AI మందులు చెప్పదు. ఫోటో చూసి <strong>వైద్య అభిప్రాయం చెప్పగలిగేది నమోదిత వైద్యుడు మాత్రమే</strong>. 18 ఏళ్ల లోపు వారి ఫోటో అయితే తల్లి/తండ్రి/సంరక్షకుని సమ్మతి అవసరం." +
        acts([act("#ai-analysis", "ఎలా పనిచేస్తుంది", { close: true }), act("#contact", "వైద్యుల అపాయింట్‌మెంట్", { primary: true, close: true })]);
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
      return "మెడికేర్ స్కిన్ &amp; హెయిర్ క్లినిక్‌లో <strong>చర్మం, జుట్టు &amp; గోళ్ళ</strong> వ్యాధులకు చికిత్స అందిస్తాం: dermatology, hair transplant, plastic/aesthetic procedures, lasers, cosmetic &amp; aesthetic treatments. వెబ్‌సైట్‌లో AI ఫోటో వివరణ సౌకర్యం కూడా ఉంది (అది వ్యాధి నిర్ధారణ కాదు)." +
        acts([act("#services", "వ్యాధులు", { close: true }), act("#treatments", "చికిత్సలు &amp; ధరలు", { close: true })]);
    } },

    /* Asked more shyly than anything else on this site, and usually once. Answer the worry
       (is it private? is it a real doctor?) before answering the question, and never name a
       medicine or promise a result – the reply is an invitation to be examined, nothing more. */
    { id: "sexualhealth", keys: ["sexual", "sex", "erectile", "\u0c05\u0c02\u0c17\u0c38\u0c4d\u0c24\u0c02\u0c2d\u0c28", "\u0c32\u0c48\u0c02\u0c17\u0c3f\u0c15", "std", "sti", "\u0c38\u0c41\u0c16\u0c35\u0c4d\u0c2f\u0c3e\u0c27", "\u0c17\u0c41\u0c2a\u0c4d\u0c24", "premature", "libido", "\u0c15\u0c4b\u0c30\u0c3f\u0c15", "impotence", "\u0c35\u0c40\u0c30\u0c4d\u0c2f", "herpes", "\u0c39\u0c46\u0c30\u0c4d\u0c2a\u0c3f\u0c38\u0c4d", "syphilis", "\u0c17\u0c4b\u0c2a\u0c4d\u0c2f"], fn: function () {
      return "\u0c07\u0c26\u0c3f \u0c2e\u0c40\u0c30\u0c41 \u0c05\u0c21\u0c17\u0c17\u0c32\u0c3f\u0c17\u0c3f\u0c28 \u0c2a\u0c4d\u0c30\u0c36\u0c4d\u0c28\u0c47 \ud83d\ude4f \u0c2a\u0c41\u0c30\u0c41\u0c37\u0c41\u0c32\u0c41, \u0c38\u0c4d\u0c24\u0c4d\u0c30\u0c40\u0c32\u0c41 \u0c07\u0c26\u0c4d\u0c26\u0c30\u0c3f\u0c15\u0c40 \u2014 <strong>\u0c05\u0c02\u0c17\u0c38\u0c4d\u0c24\u0c02\u0c2d\u0c28 \u0c38\u0c2e\u0c38\u0c4d\u0c2f (ED), \u0c36\u0c40\u0c18\u0c4d\u0c30 \u0c38\u0c4d\u0c16\u0c32\u0c28\u0c02, \u0c15\u0c4b\u0c30\u0c3f\u0c15 \u0c24\u0c17\u0c4d\u0c17\u0c21\u0c02, \u0c28\u0c4a\u0c2a\u0c4d\u0c2a\u0c3f, \u0c38\u0c41\u0c16\u0c35\u0c4d\u0c2f\u0c3e\u0c27\u0c41\u0c32\u0c41</strong> \u2014 \u0c2e\u0c3e MD (DVL) \u0c35\u0c48\u0c26\u0c4d\u0c2f\u0c41\u0c32\u0c41 \u0c1a\u0c42\u0c38\u0c4d\u0c24\u0c3e\u0c30\u0c41.<br><br>\ud83d\udd12 <strong>\u0c2a\u0c42\u0c30\u0c4d\u0c24\u0c3f \u0c17\u0c4b\u0c2a\u0c4d\u0c2f\u0c24:</strong> \u0c30\u0c3f\u0c38\u0c46\u0c2a\u0c4d\u0c37\u0c28\u0c4d\u200c\u0c32\u0c4b \u0c2e\u0c40 \u0c38\u0c2e\u0c38\u0c4d\u0c2f \u0c1a\u0c46\u0c2a\u0c4d\u0c2a\u0c15\u0c4d\u0c15\u0c30\u0c4d\u0c32\u0c47\u0c26\u0c41 \u2014 \u201c\u0c21\u0c3e\u0c15\u0c4d\u0c1f\u0c30\u0c4d \u0c17\u0c3e\u0c30\u0c3f\u0c28\u0c3f \u0c15\u0c32\u0c35\u0c3e\u0c32\u0c3f\u201d \u0c05\u0c02\u0c1f\u0c47 \u0c1a\u0c3e\u0c32\u0c41. \u0c2a\u0c4d\u0c30\u0c24\u0c4d\u0c2f\u0c47\u0c15 \u0c17\u0c26\u0c3f\u0c32\u0c4b \u0c21\u0c3e\u0c15\u0c4d\u0c1f\u0c30\u0c4d\u0c24\u0c4b \u0c12\u0c02\u0c1f\u0c30\u0c3f\u0c17\u0c3e \u0c2e\u0c3e\u0c1f\u0c4d\u0c32\u0c3e\u0c21\u0c35\u0c1a\u0c4d\u0c1a\u0c41.<br><br>\u26a0\ufe0f ED \u0c1a\u0c3e\u0c32\u0c3e\u0c38\u0c3e\u0c30\u0c4d\u0c32\u0c41 <strong>\u0c37\u0c41\u0c17\u0c30\u0c4d, \u0c2c\u0c40\u0c2a\u0c40, \u0c25\u0c48\u0c30\u0c3e\u0c2f\u0c3f\u0c21\u0c4d \u0c32\u0c47\u0c26\u0c3e \u0c17\u0c41\u0c02\u0c21\u0c46 \u0c38\u0c2e\u0c38\u0c4d\u0c2f\u0c15\u0c41 \u0c2e\u0c4a\u0c26\u0c1f\u0c3f \u0c38\u0c02\u0c15\u0c47\u0c24\u0c02</strong> \u2014 \u0c05\u0c02\u0c26\u0c41\u0c15\u0c47 \u0c2a\u0c30\u0c40\u0c15\u0c4d\u0c37 \u0c2e\u0c41\u0c16\u0c4d\u0c2f\u0c02. \u0c2a\u0c30\u0c40\u0c15\u0c4d\u0c37 \u0c32\u0c47\u0c15\u0c41\u0c02\u0c21\u0c3e \u0c2e\u0c02\u0c26\u0c41\u0c32\u0c41 \u0c35\u0c3e\u0c21\u0c4a\u0c26\u0c4d\u0c26\u0c41." +
        acts([act("#sexual-health", "\u0c35\u0c3f\u0c35\u0c30\u0c3e\u0c32\u0c41 \u0c1a\u0c42\u0c21\u0c02\u0c21\u0c3f", { close: true }), act("https://wa.me/" + WA, "WhatsApp \u0c32\u0c4b \u0c05\u0c21\u0c17\u0c02\u0c21\u0c3f", { primary: true, blank: true })]);
    } },

    /* Telemedicine Practice Guidelines 2020 cl. 5.6 requires a platform that
       offers consultation to have a working route for queries and grievances;
       NMC 06/10/2026 cl. 9.4 expects transparency from a hosting platform.
       SPDI Rules 2011 r.5(9) gives one month to redress a data grievance. */
    { id: "grievance", keys: ["complaint", "complain", "grievance", "ఫిర్యాదు", "సమస్య ఉంది", "బాధ", "refund", "రీఫండ్", "డబ్బు వాపస్", "cancel", "రద్దు", "data", "డేటా", "privacy", "గోప్యత", "delete my", "ఫోటో తొలగించ"], fn: function () {
      return "🙏 మీ ఫిర్యాదు మాకు ముఖ్యం. ఎలా చేయాలో ఇక్కడ ఉంది:<br>" +
        "• <strong>చికిత్స / సేవ గురించి ఫిర్యాదు</strong> — కైకలూరు హెల్ప్‌లైన్ <a href='" + telHref("9141247777") + "'>9141 247 777</a> కి కాల్ చేయండి, లేదా <a href='mailto:bnrmedicalagency@gmail.com'>bnrmedicalagency@gmail.com</a> కి మెయిల్ చేయండి.<br>" +
        "• <strong>మీ సమాచారం / ఫోటో గురించి</strong> (చూడాలి, సరిదిద్దాలి, తొలగించాలి) — అదే చిరునామాకు రాయండి. అలాంటి ఫిర్యాదును <strong>ఒక నెలలోపు</strong> పరిష్కరిస్తాం.<br>" +
        "• <strong>అపాయింట్‌మెంట్ రద్దు / డబ్బు వాపసు</strong> — నియమాలు policy పేజీల్లో ఉన్నాయి." +
        acts([
          act("privacy.html#grievance", "డేటా ఫిర్యాదు విధానం", { blank: true }),
          act("cancellation-policy.html", "రద్దు విధానం", { blank: true }),
          act("refund-policy.html", "రీఫండ్ విధానం", { blank: true }),
          act(TEL, "📞 కాల్ చేయండి", { primary: true })
        ]);
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
    if (/sexual|erectile|\bed\b|impotence|premature|libido|\bstd\b|\bsti\b|herpes|syphilis|gonorrh|అంగస్తంభన|లైంగిక|సుఖవ్యాధ|సుఖ వ్యాధ|గుప్త|స్ఖలన|వీర్య/.test(t)) return intentById("sexualhealth").fn(t);
    if (/technology|equipment|machine|us-?fda|\bfda\b|alma|quanta|q-?switch|qswitch|follirich|\bco2\b|laser brand|టెక్నాలజీ|పరికర|మెషిన్/.test(t)) return intentById("technology").fn(t);
    if (/complaint|complain|grievance|refund|privacy|delete my|ఫిర్యాదు|రీఫండ్|డబ్బు వాపస్|గోప్యత|ఫోటో తొలగించ/.test(t)) return intentById("grievance").fn(t);
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

  var CHIPS = ["ధరలు", "శాఖలు", "హెయిర్ ట్రాన్స్‌ప్లాంట్", "లైంగిక ఆరోగ్యం (గోప్యం)", "అపాయింట్‌మెంట్", "టెలీకన్సల్టేషన్", "వైద్యులు", "సమయాలు", "ఫిర్యాదు"];

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
