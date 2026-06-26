/* =====================================================================
   MEDICARE — Treatments & Pricing (from Medicare price list)
   ---------------------------------------------------------------------
   • SIGNATURE  : visual showcase cards (image + desc + "from" price).
                  Drop photos in assets/img/treatments/<slug>.jpg
                  (icon fallback shows until a photo is added).
   • CATEGORIES : complete price list — every procedure + ₹ price + చిన్న
                  description, grouped into expandable category tables.
                  Row format: { n:"name", d:"చిన్న description", p:[price1, price2,...] }
                  Sub-header row: { sub:"..." }
   Prices are in INR (₹). Edit here to update.
   ===================================================================== */
window.MEDICARE_PRICING = {
  signature: [
    { slug: "botox",       name: "Botox & Anti-Wrinkle", nameTe: "బొటాక్స్",            from: 17000, badge: "Popular",   icon: "spark",
      desc: "ముఖ ముడతలు, frown lines, crow's feet తగ్గించి — సహజమైన యవ్వన రూపం." },
    { slug: "glutathione", name: "Glutathione IV Drip",  nameTe: "గ్లూటాతియాన్ డ్రిప్",  from: 5000,  badge: "Glow",      icon: "drop",
      desc: "Antioxidant IV therapy — చర్మ కాంతి, brightening, లోపలి నుండి glow." },
    { slug: "hydrafacial", name: "HydraFacial & Medifacials", nameTe: "హైడ్రాఫేషియల్",  from: 5000,  badge: "",          icon: "sparkle",
      desc: "Deep cleanse + hydration, instant glow — Vampire, Carbon, Pumpkin medifacials." },
    { slug: "laser-hair",  name: "Laser Hair Reduction", nameTe: "లేజర్ హెయిర్ రిడక్షన్", from: 2000,  badge: "Painless",  icon: "laser",
      desc: "USFDA diode laser — అవాంఛిత రోమాలకు long-term తగ్గింపు, అన్ని body areas." },
    { slug: "hair",        name: "GFC / PRF Hair Growth", nameTe: "హెయిర్ గ్రోత్",       from: 4000,  badge: "For Hair",  icon: "hair",
      desc: "GFC, PRF, mesotherapy — జుట్టు రాలటం తగ్గించి కొత్త జుట్టు పెరుగుదలకు తోడ్పడుతుంది." },
    { slug: "skin-booster",name: "Skin Boosters",        nameTe: "స్కిన్ బూస్టర్స్",     from: 10000, badge: "",          icon: "drop",
      desc: "Mint / Restylane boosters — deep hydration, glow, fine lines తగ్గింపు." },
    { slug: "peels",       name: "Chemical Peels & Cosmelan", nameTe: "కెమికల్ పీల్స్",  from: 3000,  badge: "",          icon: "leaf",
      desc: "Acne, pigmentation, melasma, tan — peels + Cosmelan brightening." },
    { slug: "lasers",      name: "Advanced Lasers",      nameTe: "లేజర్ చికిత్సలు",      from: 3000,  badge: "",          icon: "laser",
      desc: "Q-switch, CO2, MNRF, HIFU — pigmentation, scars, tattoo removal, tightening." }
  ],

  categories: [
    {
      key: "dermatosurgery", title: "డర్మటోసర్జరీ", titleEn: "Dermatosurgery", icon: "scalpel",
      blurb: "మచ్చలు, పుట్టుమచ్చలు, cysts, warts, corns, vitiligo surgery — minor skin surgeries.",
      columns: ["ధర / Amount"],
      rows: [
        { n: "Biopsy (Session)", d: "చర్మ నమూనా పరీక్ష (diagnosis)", p: [2000] },
        { n: "Nail Avulsion", d: "దెబ్బతిన్న గోరు తొలగింపు", p: [5000] },
        { n: "Sebaceous Cyst", d: "చర్మం క్రింద గడ్డ తొలగింపు", p: [6000] },
        { n: "Lipoma (Single)", d: "కొవ్వు గడ్డ తొలగింపు", p: [5000] },
        { n: "Ear Lobuloplasty", d: "చిరిగిన చెవి తమ్మె రిపేర్", p: [6000] },
        { n: "Xanthelasma (Single)", d: "కంటి చుట్టూ పసుపు మచ్చల తొలగింపు", p: [5000] },
        { n: "Mini Punch Grafting – Vitiligo (Session)", d: "బొల్లి మచ్చలకు చర్మ అంటుకట్టు", p: [8000] },
        { n: "NCES – Vitiligo (Session)", d: "బొల్లికి కణ మార్పిడి సర్జరీ", p: [15000] },
        { n: "Compound Nevus Excision", d: "పుట్టుమచ్చ తొలగింపు", p: [10000] },
        { n: "Scar Revision", d: "మచ్చలను సరిదిద్దే సర్జరీ", p: [10000] },
        { n: "Dermoid Cyst Excision", d: "డెర్మాయిడ్ గడ్డ తొలగింపు", p: [6000] },
        { n: "Incision & Drainage (I&D)", d: "చీము గడ్డను తీయడం", p: [1500] },
        { n: "Soaking & Pairing (Session)", d: "మొద్దుబారిన చర్మ సంరక్షణ", p: [1500] },
        { n: "Corn Excision", d: "కాలి మొద్దు (corn) తొలగింపు", p: [5000] },
        { n: "RF & Electrocautery", d: "పులిపిర్లు/మచ్చల కాటరీ", p: [2000] },
        { n: "Platelet-Rich Fibrin – Wounds", d: "గాయాలు త్వరగా మానేందుకు PRF", p: [2500] },
        { n: "PRF (Under-Eye) / Session", d: "కళ్ళ క్రింద నల్లటి వలయాలకు PRF", p: [3000] },
        { n: "Molluscum – Needling & Extirpation", d: "నీటి పులిపిర్ల తొలగింపు", p: [4000] }
      ]
    },
    {
      key: "hair-facial", title: "హెయిర్ & ఫేషియల్", titleEn: "Hair & Facial Treatments", icon: "hair", gstAll: true,
      blurb: "GFC, PRF జుట్టు పెరుగుదల + HydraFacial, Vampire, Carbon medifacials.",
      columns: ["1 సిట్టింగ్", "4 సిట్టింగ్‌లు"],
      rows: [
        { sub: "జుట్టు చికిత్సలు · Hair Treatments" },
        { n: "GFC", d: "Growth factor — జుట్టు పెరుగుదలకు", p: [5000, 18000] },
        { n: "Dutasteride Mesotherapy", d: "జుట్టు రాలటం ఆపే mesotherapy", p: [5000, 18000] },
        { n: "GFC + Dutasteride (6 sittings: 3+3)", d: "Combined జుట్టు పెరుగుదల course", p: ["—", 28000] },
        { n: "Platelet-Rich Fibrin (PRF)", d: "సొంత రక్తంతో జుట్టు చికిత్స", p: [4000, 14000] },
        { sub: "ఫేషియల్ చికిత్సలు · Facial Treatments" },
        { n: "Hydrafacial", d: "Deep cleanse + hydration, instant glow", p: [5000, 18000] },
        { n: "Pumpkin Medifacial", d: "Enzyme exfoliating glow facial", p: [5000, 18000] },
        { n: "Elite Medifacial", d: "Premium brightening medifacial", p: [5000, 18000] },
        { n: "Vampire Facial", d: "PRP తో చర్మ పునరుజ్జీవనం", p: [5000, 18000] },
        { n: "Carbon Peel Facial", d: "Carbon laser deep clean & glow", p: [5000, 18000] }
      ]
    },
    {
      key: "injections", title: "ఇంజెక్షన్లు", titleEn: "Injections", icon: "syringe",
      blurb: "Botox, skin boosters, Glutathione, ILS, lipolysis & medical injections.",
      columns: ["ధర / Amount"],
      rows: [
        { n: "Inj Avil", d: "అలర్జీ/దురద కోసం (antihistamine)", p: [150] },
        { n: "Inj Hydrocort / Dexa", d: "వాపు/అలర్జీ steroid injection", p: [150] },
        { n: "Inj Avil + Hydrocort", d: "అలర్జీకి combined injection", p: [300] },
        { n: "Benzathine Penicillin (Session)", d: "ఇన్ఫెక్షన్లకు యాంటీబయోటిక్", p: [1500] },
        { n: "Alivir Injection (Session)", d: "వైరల్ ఇన్ఫెక్షన్లకు (antiviral)", p: [2000] },
        { n: "MMR Vaccine (Session)", d: "మొండి పులిపిర్ల చికిత్సకు", p: [2000] },
        { n: "Bleomycin Injection (Session)", d: "మొండి పులిపిర్లకు injection", p: [2000] },
        { n: "ILS (1 Vial)", d: "మచ్చలు/కెలాయిడ్‌లకు steroid", p: [1000] },
        { n: "ILS (2 Vials)", d: "పెద్ద మచ్చలకు steroid", p: [2000] },
        { n: "ILS + 5-FU", d: "కెలాయిడ్ మచ్చలకు combined", p: [1500] },
        { n: "Lipolysis – Double Chin (Session)", d: "గెడ్డం క్రింది కొవ్వు కరిగింపు", p: [4000], gst: true },
        { n: "Lipolysis – Multiple Lipomas (1 Vial)", d: "కొవ్వు గడ్డల కరిగింపు", p: [6000] },
        { n: "Botox 50U", d: "ముడతలు/అధిక చెమట తగ్గింపు", p: [30000], gst: true },
        { n: "Botox 20U (Crow's Feet)", d: "కంటి చివర ముడతలకు", p: [17000], gst: true },
        { n: "Restylane Skin Booster (Session)", d: "Deep hydration & glow booster", p: [40000], gst: true },
        { n: "Mint Skin Booster (1 sitting)", d: "చర్మ గ్లో booster", p: [10000], gst: true },
        { n: "Mint Skin Booster (4 sittings)", d: "Glow booster course", p: [40000], gst: true },
        { n: "Glutathione IV Drip (1 sitting)", d: "Skin brightening drip", p: [5000], gst: true },
        { n: "Glutathione IV Drip (8 sittings)", d: "Brightening full course", p: [38000], gst: true }
      ]
    },
    {
      key: "laser-hair", title: "లేజర్ హెయిర్ రిడక్షన్", titleEn: "Laser Hair Reduction", icon: "laser", gstAll: true,
      blurb: "USFDA diode laser — శాశ్వత (long-term) hair reduction, అన్ని body areas.",
      columns: ["1 సిట్టింగ్", "5+1", "6+2"],
      rows: [
        { n: "Upper Lip", d: "పై పెదవి రోమాల తగ్గింపు", p: [2000, 10000, 12000] },
        { n: "Chin", d: "గడ్డం రోమాల తగ్గింపు", p: [2000, 10000, 12000] },
        { n: "Lower Face", d: "ముఖం క్రింది భాగం", p: [5000, 25000, 30000] },
        { n: "Under Arms", d: "చంకల రోమాల తగ్గింపు", p: [5000, 25000, 30000] },
        { n: "Full Arms", d: "పూర్తి చేతులు", p: [7000, 35000, 42000] },
        { n: "Full Legs", d: "పూర్తి కాళ్ళు", p: [8000, 40000, 48000] },
        { n: "Back (Full)", d: "పూర్తి వీపు", p: [8000, 40000, 48000] },
        { n: "Trunk (Chest + Abdomen)", d: "ఛాతీ + పొట్ట", p: [8000, 40000, 48000] },
        { n: "Beard Shaping", d: "గడ్డం shaping & design", p: [3000, 15000, 18000] },
        { n: "Nose", d: "ముక్కు రోమాల తగ్గింపు", p: [2000, 10000, 12000] },
        { n: "Ear Pinna", d: "చెవి రోమాల తగ్గింపు", p: [3000, 15000, 18000] },
        { n: "Nipple Area", d: "చనుమొన ప్రాంతం", p: [3000, 15000, 18000] },
        { n: "Bikini", d: "బికినీ ప్రాంతం", p: [5000, 25000, 30000] },
        { n: "Upper Lip + Chin", d: "పై పెదవి + గడ్డం", p: [4000, 20000, 24000] },
        { n: "Full Body", d: "పూర్తి శరీరం", p: [17000, 85000, 102000] }
      ]
    },
    {
      key: "peels", title: "కెమికల్ పీల్స్", titleEn: "Chemical Peels", icon: "leaf", gstAll: true,
      blurb: "Acne, pigmentation, melasma, tan — peels + Cosmelan.",
      columns: ["1 సిట్టింగ్", "4 సిట్టింగ్‌లు"],
      rows: [
        { n: "Black Peel", d: "మొటిమలు/నూనె చర్మానికి peel", p: [4000, 14000] },
        { n: "Azelaic-M Peel", d: "మొటిమలు/మచ్చలకు peel", p: [4000, 14000] },
        { n: "Azelaic-M + Retises Forte", d: "మొటిమ మచ్చలకు combined peel", p: [5000, 18000] },
        { n: "NMF Light Peel (Face)", d: "తేలికపాటి brightening peel", p: [5000, 18000] },
        { n: "NMF Medium Peel (Face)", d: "మధ్యస్థ glow peel", p: [5000, 18000] },
        { n: "Yellow Peel (Face)", d: "Pigmentation / anti-aging peel", p: [5000, 18000] },
        { n: "Neck Peel (NMF Med / Yellow)", d: "మెడ నలుపు తగ్గింపు", p: [5000, 18000] },
        { n: "Back", d: "వీపు మొటిమలు/మచ్చలకు", p: [7000, 26000] },
        { n: "Full Arms", d: "చేతుల tan/మచ్చలకు", p: [7000, 26000] },
        { n: "Underarms", d: "చంకల నలుపు తగ్గింపు", p: [5000, 18000] },
        { n: "Under-Eye Peel", d: "కళ్ళ క్రింద నలుపు తగ్గింపు", p: [3000, 10000] },
        { n: "TCA CROSS", d: "లోతైన మొటిమ గుంటలకు", p: [3000, 10000] },
        { n: "Cosmelan (Single Sitting)", d: "మెలస్మా/pigmentation పూర్తి సొల్యూషన్", p: [50000, "—"] }
      ]
    },
    {
      key: "lasers", title: "లేజర్ చికిత్సలు", titleEn: "Lasers", icon: "laser", gstAll: true,
      blurb: "Pigmentation, scars, tattoo removal, skin tightening (HIFU, CO2, MNRF).",
      columns: ["1 సిట్టింగ్", "ప్యాకేజీ"],
      rows: [
        { n: "Q-switch Nd:YAG (Full Face) · 6 sittings", d: "Pigmentation/tan తగ్గింపు, glow", p: [5000, 28000] },
        { n: "Freckles · 4 sittings", d: "మచ్చలు/freckles తొలగింపు", p: [3500, 12000] },
        { n: "Tattoo – Small · 6 sittings", d: "చిన్న టాటూ తొలగింపు", p: [3000, 16000] },
        { n: "Tattoo – Large · 6 sittings", d: "పెద్ద టాటూ తొలగింపు", p: [5000, 28000] },
        { n: "Lip Toning · 4 sittings", d: "పెదవుల నలుపు తగ్గింపు", p: [3000, 10000] },
        { n: "Q-switch Nd:YAG (Face + Neck) · 6 sittings", d: "ముఖం + మెడ pigmentation", p: [6000, 34000] },
        { n: "CO2 Laser · 6 sittings", d: "పుట్టుమచ్చలు/పులిపిర్లు/మచ్చలు", p: [5000, 28000] },
        { n: "MNRF + PRP · 6 sittings", d: "మొటిమ గుంటలు, చర్మ బిగువు", p: [6000, 34000] },
        { n: "HIFU (Chin) · 4 sittings", d: "గెడ్డం skin tightening (non-surgical)", p: [4000, 14000] },
        { n: "HIFU (Lower Face) · 4 sittings", d: "ముఖ skin tightening & lift", p: [5000, 18000] }
      ]
    }
  ]
};

(function () {
  "use strict";
  var P = window.MEDICARE_PRICING;
  var sig = document.getElementById("signatureList");
  var cats = document.getElementById("priceCategories");
  if (!P) return;

  var ICONS = {
    spark:  '<path d="M12 3l2.1 4.3 4.7.7-3.4 3.3.8 4.7L12 14.8 7.8 16l.8-4.7L5.2 8l4.7-.7L12 3z"/>',
    drop:   '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
    sparkle:'<path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2z"/><path d="M19 14l.9 2.4L22 17l-2.1.6L19 20l-.9-2.4L16 17l2.1-.6L19 14z"/>',
    laser:  '<path d="M3 12h4l2-6 4 12 2-6h6"/>',
    hair:   '<path d="M4 20c1-7 4-12 8-12s7 5 8 12"/><path d="M8 20c.5-5 2-8 4-8s3.5 3 4 8"/>',
    leaf:   '<path d="M5 21c0-9 5-15 14-16-1 9-7 15-14 16z"/><path d="M5 21c3-5 7-8 11-9"/>',
    scalpel:'<path d="M14 4l6 6-9 9H5v-6l9-9z"/><path d="M9 14l-3 3"/>',
    syringe:'<path d="M5 19l3-3M14 4l6 6M16 6l2 2M11 9l4 4-5 5-4 1 1-4 4-3z"/>'
  };
  function ic(key) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[key] || ICONS.sparkle) + '</svg>'; }
  function inr(v) {
    if (v === "—" || v == null || v === "") return "—";
    var n = Number(v);
    if (isNaN(n)) return String(v);
    return "₹" + n.toLocaleString("en-IN");
  }
  // price cell with a small "నుండి" (starting from) qualifier
  function priceFrom(v) {
    if (v === "—" || v == null || v === "") return "—";
    var n = Number(v);
    if (isNaN(n)) return String(v);
    return "₹" + n.toLocaleString("en-IN") + '<span class="ptable__from"> నుండి</span>';
  }
  function esc(t){ var d=document.createElement("div"); d.textContent=t==null?"":t; return d.innerHTML; }

  /* ---- Signature showcase ---- */
  if (sig) {
    sig.innerHTML = P.signature.map(function (s) {
      return '<article class="tx reveal">' +
        '<div class="tx__media">' +
          '<img class="tx__img" src="assets/img/treatments/' + s.slug + '.jpg" alt="' + esc(s.name) + '" loading="lazy" onerror="this.style.display=\'none\'">' +
          '<span class="tx__ic">' + ic(s.icon) + '</span>' +
          (s.badge ? '<span class="tx__badge">' + esc(s.badge) + '</span>' : '') +
        '</div>' +
        '<div class="tx__body">' +
          '<h3 class="tx__name">' + esc(s.name) + (s.nameTe ? ' <span>' + esc(s.nameTe) + '</span>' : '') + '</h3>' +
          '<p class="tx__desc">' + s.desc + '</p>' +
          '<div class="tx__from">' + inr(s.from) + ' <span>నుండి · from</span></div>' +
        '</div>' +
      '</article>';
    }).join("");
  }

  /* ---- Complete categorized price list ---- */
  if (cats) {
    cats.innerHTML = P.categories.map(function (c, idx) {
      var priceCols = c.columns.length;
      var nums = [];
      c.rows.forEach(function (r) {
        if (r.sub) return;
        var v = Number(r.p[0]); if (!isNaN(v) && v > 0) nums.push(v);
      });
      var from = nums.length ? Math.min.apply(null, nums) : null;
      var count = c.rows.filter(function (r) { return !r.sub; }).length;

      var head = '<tr><th>చికిత్స · Procedure</th>' + c.columns.map(function (col) { return '<th class="ptable__num">' + esc(col) + '</th>'; }).join("") + '</tr>';
      var body = c.rows.map(function (r) {
        if (r.sub) return '<tr class="ptable__sub"><td colspan="' + (priceCols + 1) + '">' + esc(r.sub) + '</td></tr>';
        var isGst = c.gstAll || r.gst;
        var tds = '<td class="ptable__name">' + esc(r.n) +
          (isGst ? ' <span class="ptable__gst">+ GST</span>' : '') +
          (r.d ? '<span class="ptable__desc">' + esc(r.d) + '</span>' : '') + '</td>';
        for (var i = 0; i < priceCols; i++) tds += '<td class="ptable__num">' + priceFrom(r.p[i]) + '</td>';
        return '<tr>' + tds + '</tr>';
      }).join("");

      return '<details class="pcat reveal"' + (idx === 0 ? ' open' : '') + '>' +
        '<summary class="pcat__sum">' +
          '<span class="pcat__ic">' + ic(c.icon) + '</span>' +
          '<span class="pcat__meta"><span class="pcat__title">' + esc(c.titleEn) + ' <i>' + esc(c.title) + '</i></span>' +
            '<span class="pcat__sub">' + count + ' procedures' + (from ? ' · from ' + inr(from) : '') + '</span></span>' +
          '<span class="pcat__chev" aria-hidden="true">+</span>' +
        '</summary>' +
        '<div class="pcat__body">' +
          (c.blurb ? '<p class="pcat__blurb">' + c.blurb + '</p>' : '') +
          '<div class="ptable-wrap"><table class="ptable"><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>' +
        '</div>' +
      '</details>';
    }).join("");
  }
})();
