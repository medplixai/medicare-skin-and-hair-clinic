/* =====================================================================
   MEDICARE — శాఖల డేటా (Branch data)
   ---------------------------------------------------------------------
   👉 ప్రతి శాఖకు వివరాలు ఇక్కడ మార్చండి / fill in:
      address      : పూర్తి చిరునామా (ఖాళీగా ఉంటే "త్వరలో" చూపిస్తుంది)
      mapEmbed     : embedded map (exact coords -> output=embed). ఖాళీ ఉంటే ఊరి పేరుతో auto.
      mapsUrl      : Google Maps short link — "దారి" (directions) button దీన్ని తెరుస్తుంది
      clinicPhoto  : క్లినిక్ ఫోటో — assets/img/branches/<slug>.jpg
      phones       : ["mobile", "landline/2nd"]  (landline STD కోడ్‌తో, ఉదా 08677223344)
      whatsapp     : "91" + ఆ శాఖ WhatsApp నంబర్
   ===================================================================== */

/* ---------------------------------------------------------------------
   ⚠️  RATINGS & PATIENT REVIEWS — DELIBERATELY EMPTY. DO NOT REFILL.
   Removed 10 Oct 2026. The NMC "Guidelines on Ethical Advertising and
   Public Communication by hospitals/medical institutions and Registered
   Medical Practitioners" (No. R-13014/01/2024-Ethics, 06/10/2026, in force
   with immediate effect) prohibit a clinic from sharing patient reviews,
   ratings or testimonials for professional promotion (clause 3.2
   Explanation V), from publishing ratings/review counts that create a
   misleading impression of professional standing (clause 8.1(xii)), and
   from superiority claims such as "best" (clause 8.1(ix)) — which several
   of the quoted reviews carried in the patient's own words. Clause 8.1(xi)
   adds that a third party may not be used to do indirectly what the clinic
   may not do directly, so quoting a patient does not launder the claim.
   IMC (Professional Conduct, Etiquette and Ethics) Regulations 2002,
   reg. 7.12 is a closed list ("nothing more than" name, patient types,
   facilities, fees) which excludes ratings.
   The object is kept (empty) only so assets/js/reviews.js keeps loading.
   Exposure for a breach attaches to the named doctors' registrations.
   --------------------------------------------------------------------- */
window.MEDICARE_REVIEWS = { apiKey: "", manual: {} };

window.MEDICARE_BRANCHES = [
  {
    town: "కైకలూరు", slug: "kaikaluru", mapsName: "Kaikaluru", pin: "521333", hq: true,
    address: "Beside Maganti Theater, Kaikalur, Andhra Pradesh 521333",
    mapEmbed: "https://maps.google.com/maps?q=16.5559859,81.2202182&z=16&output=embed",
    mapsUrl: "https://maps.app.goo.gl/HFZcis2fraDKAbANA",
    phones: ["9141247777", "08677223344"],
    whatsapp: "919141247777",
    instagram: "https://www.instagram.com/medicareskinandhairclinickklr",
    clinicPhoto: "assets/img/branches/kaikaluru.jpg",
    doctor: { name: "డా. మేఘన", quals: "MBBS, MD, DVL", initial: "మే", photo: "assets/img/doctors/meghana.jpg", reg: "91692" }
  },
  {
    town: "భీమవరం", slug: "bhimavaram", mapsName: "Bhimavaram", pin: "534202", hq: false,
    address: "#2-6-6, 1st Floor, Upstairs to Twills, JP Road, beside Zudio, opposite Jai Srinivasa Hospital, Bhimavaram, Andhra Pradesh 534202",
    mapEmbed: "https://maps.google.com/maps?q=16.5441794,81.5156267&z=16&output=embed",
    mapsUrl: "https://maps.app.goo.gl/jtQiq29Td5WY8kuQ9",
    phones: ["9573124777"],
    whatsapp: "919573124777",
    instagram: "https://www.instagram.com/medicare_skin_bhimavaram",
    clinicPhoto: "assets/img/branches/bhimavaram.jpg",
    doctor: { name: "డా. శృతి", quals: "MBBS, MD, DVL", initial: "శృ", photo: "assets/img/doctors/shruti.jpg", reg: "139988" }
  },
  {
    town: "గన్నవరం", slug: "gannavaram", mapsName: "Gannavaram", pin: "521101", hq: false,
    address: "#6-60, Upstairs to Rasool Tea Stall, National Highway, Gandhi Chowk, opposite ICICI Bank, Gannavaram, Andhra Pradesh 521101",
    mapEmbed: "https://maps.google.com/maps?q=16.5400423,80.8007671&z=16&output=embed",
    mapsUrl: "https://maps.app.goo.gl/uibGorHRuuHGEUcAA",
    phones: ["9988167779"],
    whatsapp: "919988167779",
    instagram: "https://www.instagram.com/gannavaram_medicareskinclinic",
    clinicPhoto: "assets/img/branches/gannavaram.jpg",
    doctors: [
      { name: "డా. సాత్విక", quals: "MBBS, MD, DVL", initial: "సా", photo: "assets/img/doctors/satvika.jpg" },
      { name: "డా. ఆదిత్య", quals: "MBBS, MD, DVL", initial: "ఆ", photo: "assets/img/doctors/aditya.jpg", reg: "113812" }
    ]
  },
  {
    town: "నూజివీడు", slug: "nuzvid", mapsName: "Nuzvid", pin: "521201", hq: false,
    address: "Upstairs to Bank of Baroda, Chinna Gandhi Bomma Center, Nuzvid, Andhra Pradesh 521201",
    mapEmbed: "https://maps.google.com/maps?q=16.7866666,80.8488823&z=16&output=embed",
    mapsUrl: "https://maps.app.goo.gl/yNLqPmLvZeddiXEt9",
    phones: ["9535363536"],
    whatsapp: "919535363536",
    instagram: "https://www.instagram.com/nuzivid_medicareskinclinic",
    clinicPhoto: "assets/img/branches/nuzvid.jpg",
    doctor: { name: "డా. సౌమ్య", quals: "MBBS, MD, DVL", initial: "సౌ", photo: "assets/img/doctors/soumya.jpg", reg: "115714" }
  },
  {
    town: "ఏలూరు", slug: "eluru", mapsName: "Eluru", pin: "534002", hq: false,
    address: "Beside Bhuvaneswari Hospital, Bendapudi Vari Street, RR Peta, Eluru, Andhra Pradesh 534002",
    mapEmbed: "https://maps.google.com/maps?q=16.7145178,81.1008604&z=16&output=embed",
    mapsUrl: "https://maps.app.goo.gl/YqVA5ydieFBMhkyM9",
    phones: ["9988267779"],
    whatsapp: "919988267779",
    instagram: "https://www.instagram.com/eluru_medicare_skin_clinic",
    clinicPhoto: "assets/img/branches/eluru.jpg",
    doctor: { name: "డా. కమ్మ సాయి దివిజ", quals: "MBBS, MD, DVL", initial: "కా", photo: "assets/img/doctors/sai-divija.jpg", reg: "108959" }
  },
  {
    town: "తాడేపల్లిగూడెం", slug: "tadepalligudem", mapsName: "Tadepalligudem", pin: "534101", hq: false,
    address: "Bhopal Nagar, beside Usha Grand Hotel, KFC back side, Tadepalligudem, Andhra Pradesh 534101",
    mapEmbed: "https://maps.google.com/maps?q=16.8170189,81.5249456&z=16&output=embed",
    mapsUrl: "https://maps.app.goo.gl/F8DLphgoXup7LQdW8",
    phones: ["9988367779"],
    whatsapp: "919988367779",
    clinicPhoto: "assets/img/branches/tadepalligudem.jpg",
    doctor: { name: "డా. అఖిల", quals: "MBBS, MD, DVL", initial: "అ", photo: "assets/img/doctors/akhila.jpg", reg: "111274" }
  },
  {
    town: "ఒంగోలు", slug: "ongole", mapsName: "Ongole", pin: "523003", hq: false,
    address: "Lambadi Donka Road, opposite New Samata Hospital, Ongole, Andhra Pradesh 523003",
    mapEmbed: "https://maps.google.com/maps?q=15.5116371,80.0387788&z=16&output=embed",
    mapsUrl: "https://maps.app.goo.gl/R3EpNzh8KvWarq7K7",
    phones: ["9515830777", "9515831777"],
    whatsapp: "919515830777",
    instagram: "https://www.instagram.com/medicare_skin_clinic_ongole",
    clinicPhoto: "assets/img/branches/ongole.jpg",
    doctor: { name: "డా. సాయిదీప్తి", quals: "MBBS, MD, DVL", initial: "సా", photo: "assets/img/doctors/sai-deepthi.jpg", reg: "111083" }
  },
  {
    town: "మచిలీపట్నం", slug: "machilipatnam", mapsName: "Machilipatnam", pin: "521001", hq: false,
    address: "Koneru Center, opposite Brundavan Theater, beside Madhu Children's Hospital, Machilipatnam, Andhra Pradesh 521001",
    mapEmbed: "https://maps.google.com/maps?q=16.178566,81.1276889&z=16&output=embed",
    mapsUrl: "https://maps.app.goo.gl/LjaS5Sbwmb2W5XWe8",
    phones: ["9734227777", "08672223399"],
    whatsapp: "919734227777",
    clinicPhoto: "assets/img/branches/machilipatnam.jpg",
    doctor: { name: "డా. సుధీర్ కుమార్", quals: "MBBS, MD, DVL", initial: "సు", photo: "assets/img/doctors/sudheer-kumar.jpg", reg: "84590" }
  },
  {
    town: "గుడివాడ", slug: "gudivada", mapsName: "Gudivada", pin: "521301", hq: false,
    address: "Eluru Road, beside Sonovision, Gudivada, Andhra Pradesh 521301",
    mapEmbed: "https://maps.google.com/maps?q=16.4359352,80.9925423&z=16&output=embed",
    mapsUrl: "https://maps.app.goo.gl/RML6zPfHdLjcJWfD9",
    phones: ["7618882888"],
    whatsapp: "917618882888",
    instagram: "https://www.instagram.com/gudivada_medicareskinclinic",
    clinicPhoto: "assets/img/branches/gudivada.jpg",
    doctor: { name: "డా. అనన్య బొల్లినేని", quals: "MBBS, MD, DVL", initial: "అ", photo: "assets/img/doctors/ananya.jpg", reg: "113624" }
  },
  {
    town: "ఆకివీడు", slug: "akividu", mapsName: "Akividu", pin: "534235", hq: false,
    address: "Upstairs to HDFC Bank, S Turning, Akividu, Andhra Pradesh 534235",
    mapEmbed: "https://maps.google.com/maps?q=16.5817043,81.3767418&z=16&output=embed",
    mapsUrl: "https://maps.app.goo.gl/7A4WENmD7EjfaCo69",
    phones: ["9734117777", "7241122333"],
    whatsapp: "919734117777",
    instagram: "https://www.instagram.com/akivid_healthcareskinclinic",
    clinicPhoto: "assets/img/branches/akividu.jpg",
    doctor: { name: "డా. మేఘన", quals: "MBBS, MD, DVL", initial: "మే", photo: "assets/img/doctors/meghana.jpg", reg: "91692" }
  }
];

/* ---------------------------------------------------------------------
   Render branch cards into #branchList (runs before main.js so the
   reveal/scroll observers pick up the generated cards).
   --------------------------------------------------------------------- */
(function () {
  "use strict";
  var list = document.getElementById("branchList");
  if (!list || !window.MEDICARE_BRANCHES) return;

  var PIN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>';
  var enc = encodeURIComponent;
  // Per-clinic photo focal point (where the Medicare signboard sits) so banners crop neatly.
  var FOCAL = { bhimavaram: "center 28%", nuzvid: "center 30%", gannavaram: "center 42%" };

  // Phone display: 10-digit mobile -> "9876 543 210"; 11-digit landline (0XXXX...) -> "0XXXX XXXXXX".
  function fmtPhone(p) {
    var d = (p || "").replace(/\D/g, "");
    if (d.length === 10) return d.replace(/(\d{4})(\d{3})(\d{3})/, "$1 $2 $3");
    if (d.length === 11 && d.charAt(0) === "0") return d.replace(/(\d{5})(\d{6})/, "$1 $2");
    return p;
  }
  // tel: link — drop the leading 0 of a landline STD code, prefix +91.
  function telOf(p) {
    var d = (p || "").replace(/\D/g, "");
    if (d.charAt(0) === "0") d = d.slice(1);
    return "tel:+91" + d;
  }

  function mapSrc(b) {
    if (b.mapEmbed) return b.mapEmbed;
    var q = (b.address ? b.address + ", " : "") + "Medicare Skin and Hair Clinic, " + b.mapsName + ", Andhra Pradesh";
    return "https://maps.google.com/maps?q=" + enc(q) + "&z=14&output=embed";
  }
  function dirHref(b) {
    if (b.mapsUrl) return b.mapsUrl;
    var q = (b.address ? b.address + ", " : "") + "Medicare Skin and Hair Clinic, " + b.mapsName + ", Andhra Pradesh";
    return "https://www.google.com/maps/search/?api=1&query=" + enc(q);
  }
  function waHref(b) {
    var msg = "నమస్తే, " + b.town + " మెడికేర్ స్కిన్ & హెయిర్ క్లినిక్‌లో అపాయింట్‌మెంట్ కావాలి.";
    return "https://wa.me/" + b.whatsapp + "?text=" + enc(msg);
  }
  var html = window.MEDICARE_BRANCHES.map(function (b) {
    var addr = b.address
      ? '<span>' + b.address + '</span>'
      : '<span class="bx__addr-tbd">పూర్తి చిరునామా త్వరలో అప్‌డేట్ అవుతుంది' + (b.pin ? ' · ' + b.town + ', ఆంధ్రప్రదేశ్ – ' + b.pin : '') + '</span>';
    var phoneText = b.phones.map(fmtPhone).join(" · ");

    var docs = b.doctors || [b.doctor];
    var docPics = docs.map(function (d) {
      return '<div class="bx__docpic"><img src="' + d.photo + '" alt="' + d.name + '" loading="lazy" onerror="this.remove()"><span>' + d.initial + '</span></div>';
    }).join("");
    var docPicWrap = docs.length > 1 ? '<div class="bx__docpics">' + docPics + '</div>' : docPics;
    var docLine = docs.map(function (d) { return d.name; }).join(" &amp; ") + ' · ' + docs[0].quals;
    var regLine = docs.filter(function (d) { return d.reg; }).map(function (d) {
      return (docs.length > 1 ? d.name + ' · ' : '') + 'State Medical Council Reg. No. ' + d.reg;
    }).join(' &amp; ');

    return '' +
    '<article class="bx reveal' + (b.hq ? ' bx--hq' : '') + '">' +
      '<div class="bx__photo">' +
        '<img class="bx__clinic" src="' + b.clinicPhoto + '" alt="' + b.town + ' మెడికేర్ క్లినిక్"' + (FOCAL[b.slug] ? ' style="object-position:' + FOCAL[b.slug] + '"' : '') + ' loading="lazy" onerror="this.style.display=\'none\'">' +
        '<span class="bx__photo-ph"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 21h18M5 21V8l7-4 7 4v13M9 21v-5h6v5M9 11h.01M15 11h.01"/></svg>క్లినిక్ ఫోటో త్వరలో</span>' +
      '</div>' +
      '<div class="bx__body">' +
        '<div class="bx__docrow">' +
          docPicWrap +
          '<div class="bx__docmeta">' +
            '<h3 class="bx__town">' + b.town + ' <span class="bx__town-en">' + b.mapsName + '</span></h3>' +
            '<p class="bx__doc">' + docLine + '</p>' +
            (regLine ? '<p class="bx__reg"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2.2"/><circle cx="8.5" cy="11" r="2"/><path d="M13 10h5M13 13.5h5M5.5 15.5c.5-1.4 4.5-1.4 5 0"/></svg>' + regLine + '</p>' : '') +
          '</div>' +
        '</div>' +
        '<p class="bx__addr">' + PIN + addr + '</p>' +
        '<a class="bx__page-link" href="' + b.slug + '.html">' + b.town + ' (' + b.mapsName + ') శాఖ వివరాలు →</a>' +
        '<p class="bx__phone"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>' + phoneText + '</p>' +
        '<div class="branch__map">' +
          '<span class="branch__map-ph" aria-hidden="true">' + PIN + b.town + '</span>' +
          '<iframe title="' + b.town + ' మ్యాప్" src="' + mapSrc(b) + '" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>' +
        '</div>' +
        '<div class="bx__actions">' +
          '<a class="bx__btn bx__btn--call" href="' + telOf(b.phones[0]) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>కాల్</a>' +
          '<a class="bx__btn bx__btn--wa" href="' + waHref(b) + '" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15l-1 4 4.1-1A10 10 0 1 0 12 2z"/></svg>WhatsApp</a>' +
          '<a class="bx__btn bx__btn--dir" href="' + dirHref(b) + '" target="_blank" rel="noopener">' + PIN + 'దారి</a>' +
          (b.instagram ? '<a class="bx__btn bx__btn--ig" href="' + b.instagram + '" target="_blank" rel="noopener" aria-label="Instagram"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1.3"/></svg>Insta</a>' : '') +
        '</div>' +
      '</div>' +
    '</article>';
  }).join("");

  list.innerHTML = html;
})();
