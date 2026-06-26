/* =====================================================================
   MEDICARE — Before / After results (glossy auto-scroll carousel)
   ---------------------------------------------------------------------
   Branded before/after cards scroll smoothly left → right (auto, infinite).
   👉 ఫోటోలు పెట్టండి: assets/img/before-after/<slug>.jpg
   ఒక్క ఫోటో కూడా లోడ్ కాకపోతే "Before & After" section మొత్తం దాగి ఉంటుంది.
   కొత్త result add చేయాలంటే ఈ list లో ఒక slug చేర్చండి.
   ===================================================================== */
window.MEDICARE_RESULTS = [
  "melasma", "alopecia", "acne", "chemical-peel", "laser-hair", "skin-tags",
  "botox", "botox-2", "xanthelasma", "psoriasis", "burns", "ear-lobe",
  "ear", "drug-allergy", "hair-mesotherapy", "childrens-skin", "hair-prp"
];

(function () {
  "use strict";
  var section = document.getElementById("results");
  var list = document.getElementById("resultsList");
  if (!section || !list || !window.MEDICARE_RESULTS || !window.MEDICARE_RESULTS.length) return;

  var DIR = "assets/img/before-after/";

  // one glossy slide — full branded before/after image, height-fixed (width auto)
  function slide(slug) {
    return '<figure class="ba-slide">' +
      '<img class="ba-img" src="' + DIR + slug + '.jpg" alt="Medicare — Before & After ' + slug +
      '" decoding="async" onerror="this.closest(\'.ba-slide\').style.display=\'none\'">' +
      '</figure>';
  }

  // render the set TWICE so the marquee can loop seamlessly
  var set = window.MEDICARE_RESULTS.map(slide).join("");
  list.innerHTML =
    '<div class="ba-marquee">' +
      '<div class="ba-track" aria-label="Before and after results">' + set + set + '</div>' +
    '</div>';

  // Reveal the section ONLY once at least one image actually loads
  var imgs = Array.prototype.slice.call(list.querySelectorAll(".ba-img"));
  var revealed = false;
  function reveal() {
    if (revealed) return;
    revealed = true;
    section.classList.add("results--ready");
    document.querySelectorAll('a[href="#results"]').forEach(function (a) { a.style.display = ""; });
  }
  imgs.forEach(function (im) {
    if (im.complete && im.naturalWidth > 0) reveal();
    else im.addEventListener("load", reveal);
  });
})();
