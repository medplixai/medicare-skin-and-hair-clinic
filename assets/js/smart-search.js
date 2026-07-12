/* =====================================================================
   MEDICARE — Smart Search (hero)
   Instant client-side search across 84+ treatments & prices
   (window.MEDICARE_PRICING), signature treatments, conditions, FAQs and
   site sections. Telugu + English queries supported (alias map).
   Selecting a treatment deep-links: opens its price category, scrolls
   to the exact row and flash-highlights it. No backend.
   ===================================================================== */
(function () {
  "use strict";
  var box = document.getElementById("heroSearch");
  var input = document.getElementById("hsearchInput");
  var panel = document.getElementById("hsearchPanel");
  if (!box || !input || !panel) return;

  /* ---------- Telugu → English alias expansion ---------- */
  var ALIAS = [
    ["మొటిమ", "acne pimple"], ["మచ్చ", "scar spot pigment"], ["పిగ్మెంట", "pigmentation melasma"],
    ["జుట్టు రాల", "hair fall"], ["జుట్టు", "hair"], ["బట్టతల", "baldness transplant"],
    ["చుండ్రు", "dandruff"], ["గోళ్ళ", "nail"], ["గోరు", "nail"], ["తామర", "eczema"],
    ["సోరియాసిస్", "psoriasis"], ["బొల్లి", "vitiligo"], ["లేజర్", "laser"],
    ["ధర", "price cost"], ["ఫేషియల్", "facial"], ["హైడ్రా", "hydrafacial"],
    ["బొటాక్స్", "botox"], ["ఫిల్లర్", "filler"], ["పీల్", "peel"], ["టాటూ", "tattoo"],
    ["మెలస్మా", "melasma"], ["గ్లూటా", "glutathione"], ["పిల్లల", "children"],
    ["డాక్టర్", "doctor"], ["వైద్య", "doctor"], ["శాఖ", "branch"], ["సమయ", "timings hours"],
    ["అపాయింట్", "appointment book"], ["ట్రాన్స్", "transplant"], ["ముడత", "wrinkle ageing"],
    ["వార్ట్", "wart"], ["పుట్టుమచ్చ", "mole"], ["సన్", "sun tan"], ["టాన్", "tan"],
    ["దురద", "itch allergy"], ["అలర్జీ", "allergy"], ["ఫంగల్", "fungal"], ["కెమికల్", "chemical peel"]
  ];

  var INDEX = null;

  function buildIndex() {
    if (INDEX) return INDEX;
    INDEX = [];
    var P = window.MEDICARE_PRICING || {};

    /* signature showcase treatments */
    (P.signature || []).forEach(function (s) {
      INDEX.push({ t: s.name, te: s.nameTe || "", extra: s.slug, price: s.from,
        tag: "Treatment", go: { type: "anchor", href: "#treatments" } });
    });

    /* every priced procedure, deep-linked to its category + row */
    (P.categories || []).forEach(function (c, ci) {
      (c.rows || []).forEach(function (r) {
        if (!r || !r.n) return;
        INDEX.push({ t: r.n, te: "", extra: (c.titleEn || "") + " " + (c.title || ""),
          price: (r.p && r.p.length ? r.p[0] : null), tag: c.titleEn || "Treatment",
          go: { type: "row", cat: ci, name: r.n } });
      });
    });

    /* conditions (cards in #services) */
    [
      ["Skin Diseases", "చర్మవ్యాధులు acne eczema psoriasis vitiligo allergy fungal wrinkles"],
      ["Hair Problems", "జుట్టు సమస్యలు hair fall dandruff baldness alopecia prp gfc"],
      ["Nail Diseases", "గోళ్ళ వ్యాధులు fungal nails discoloration brittle ingrown"],
      ["Chronic & Stubborn Diseases", "మొండి దీర్ఘకాలిక leprosy skin tb hiv psoriasis"],
      ["STD Care · Confidential", "సుఖ వ్యాధులు గోప్యత std confidential"],
      ["Children's Skin Care", "పిల్లల చర్మ children scabies"]
    ].forEach(function (c) {
      INDEX.push({ t: c[0], te: "", extra: c[1], price: null, tag: "Conditions", go: { type: "anchor", href: "#services" } });
    });

    /* key sections */
    [
      ["Hair Transplant (FUE/DHI)", "బట్టతల హెయిర్ ట్రాన్స్‌ప్లాంట్ transplant fue dhi baldness", "#hair-transplant", 59999],
      ["AI Skin & Hair Analysis", "ఉచిత ai విశ్లేషణ free analysis photo", "#ai-analysis", null],
      ["Online Consultation", "టెలీ ఆన్‌లైన్ tele video consultation", "#teleconsultation", null],
      ["Our Doctors", "వైద్యులు డాక్టర్ dermatologist specialist", "#doctors", null],
      ["Branches (10+ locations)", "శాఖలు kaikaluru bhimavaram eluru gudivada gannavaram nuzvid akividu tadepalligudem machilipatnam ongole branch near", "#branches", null],
      ["Equipment & Technology", "usfda laser machines technology పరికరాలు", "#technology", null],
      ["Before & After Results", "ఫలితాలు results before after", "#results", null],
      ["Book Appointment / Contact", "అపాయింట్‌మెంట్ బుక్ contact whatsapp call timings సమయాలు hours", "#contact", null]
    ].forEach(function (s) {
      INDEX.push({ t: s[0], te: "", extra: s[1], price: s[3], tag: "Section", go: { type: "anchor", href: s[2] } });
    });

    /* FAQs from the DOM */
    [].slice.call(document.querySelectorAll("#faq details.faq__item summary")).forEach(function (sm, i) {
      INDEX.push({ t: sm.textContent.trim().slice(0, 90), te: "", extra: "faq question", price: null, tag: "FAQ", go: { type: "faq", idx: i } });
    });

    return INDEX;
  }

  /* ---------- matching ---------- */
  function expand(q) {
    var out = q;
    ALIAS.forEach(function (a) { if (q.indexOf(a[0]) > -1) out += " " + a[1]; });
    return out;
  }
  function search(qRaw) {
    var q = expand(qRaw.toLowerCase().trim());
    if (q.length < 2) return [];
    var toks = q.split(/\s+/).filter(function (t) { return t.length >= 2; });
    if (!toks.length) return [];
    var res = [];
    buildIndex().forEach(function (e) {
      var hay = (e.t + " " + e.te + " " + (e.extra || "")).toLowerCase();
      var score = 0;
      toks.forEach(function (tk) {
        if (hay.indexOf(tk) === -1) return;
        score += 1;
        if (e.t.toLowerCase().indexOf(tk) === 0) score += 2;
        else if (e.t.toLowerCase().indexOf(tk) > -1) score += 1;
      });
      if (score > 0) res.push({ e: e, s: score });
    });
    res.sort(function (a, b) { return b.s - a.s; });
    return res.slice(0, 8).map(function (r) { return r.e; });
  }

  /* ---------- actions ---------- */
  function flash(elm) {
    if (!elm) return;
    elm.classList.add("search-hit");
    setTimeout(function () { elm.classList.remove("search-hit"); }, 3200);
  }
  function go(e) {
    close();
    input.blur();
    if (e.go.type === "anchor") {
      var t = document.querySelector(e.go.href);
      if (t) t.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (e.go.type === "faq") {
      var faq = document.querySelectorAll("#faq details.faq__item")[e.go.idx];
      var sec = document.getElementById("faq");
      if (sec) sec.scrollIntoView({ behavior: "smooth", block: "start" });
      if (faq) { faq.open = true; setTimeout(function () { flash(faq); faq.scrollIntoView({ behavior: "smooth", block: "center" }); }, 450); }
      return;
    }
    /* deep-link to a price row: open its category, scroll & flash the row */
    var tsec = document.getElementById("treatments");
    if (tsec) tsec.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(function () {
      var cat = document.querySelectorAll("#treatments details.pcat")[e.go.cat];
      if (!cat) return;
      cat.open = true;
      var row = null;
      [].slice.call(cat.querySelectorAll("td.ptable__name")).some(function (td) {
        if (td.textContent.trim().indexOf(e.go.name) === 0) { row = td.parentElement; return true; }
        return false;
      });
      if (row) setTimeout(function () { row.scrollIntoView({ behavior: "smooth", block: "center" }); flash(row); }, 350);
      else { flash(cat); cat.scrollIntoView({ behavior: "smooth", block: "start" }); }
    }, 500);
  }

  /* ---------- UI ---------- */
  var active = -1, current = [];
  function close() { panel.hidden = true; panel.innerHTML = ""; active = -1; current = []; }
  function render(list) {
    current = list; active = -1;
    if (!list.length) {
      panel.innerHTML = '<div class="hsearch__empty">ఫలితాలు లేవు — వేరే పదం ప్రయత్నించండి · no matches</div>';
      panel.hidden = false; return;
    }
    panel.innerHTML = list.map(function (e, i) {
      var price = e.price ? '<b>from ₹' + Number(e.price).toLocaleString("en-IN") + "</b>" : '<i>' + e.tag + "</i>";
      return '<button type="button" class="hsearch__item" data-i="' + i + '">' +
        "<span>" + e.t + (e.te ? ' <em>' + e.te + "</em>" : "") + "</span>" + price + "</button>";
    }).join("");
    panel.hidden = false;
    [].forEach.call(panel.querySelectorAll(".hsearch__item"), function (b) {
      b.addEventListener("click", function () { go(current[+b.getAttribute("data-i")]); });
    });
  }
  function highlight() {
    [].forEach.call(panel.querySelectorAll(".hsearch__item"), function (b, i) {
      b.classList.toggle("on", i === active);
    });
  }

  var deb;
  input.addEventListener("input", function () {
    clearTimeout(deb);
    var q = input.value;
    deb = setTimeout(function () {
      if (q.trim().length < 2) { close(); return; }
      render(search(q));
    }, 140);
  });
  input.addEventListener("keydown", function (ev) {
    if (panel.hidden) return;
    if (ev.key === "ArrowDown") { ev.preventDefault(); active = Math.min(active + 1, current.length - 1); highlight(); }
    else if (ev.key === "ArrowUp") { ev.preventDefault(); active = Math.max(active - 1, 0); highlight(); }
    else if (ev.key === "Enter") { ev.preventDefault(); if (current.length) go(current[Math.max(active, 0)]); }
    else if (ev.key === "Escape") { close(); input.blur(); }
  });
  input.addEventListener("focus", function () { if (input.value.trim().length >= 2) render(search(input.value)); });
  document.addEventListener("click", function (ev) { if (!box.contains(ev.target)) close(); });
})();
