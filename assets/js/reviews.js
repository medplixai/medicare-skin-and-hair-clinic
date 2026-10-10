/* =====================================================================
   MEDICARE — branch review snippets  →  WITHDRAWN (legal)
   ---------------------------------------------------------------------
   This file used to republish, under each branch, the Google star
   rating, the review count and two patient review snippets held in
   window.MEDICARE_REVIEWS.manual (branches.js).

   That is no longer permitted.  NMC Guidelines on Ethical Advertising
   and Public Communication (No. R-13014/01/2024-Ethics, 06/10/2026 —
   in force with immediate effect):
     • clause 3.2 Explanation V — "An RMP shall not request or share
       patient testimonials, recommendations, endorsements or reviews
       for professional promotion."
     • clause 8.1(xii) — no procuring or manipulating "reviews, ratings,
       testimonials, comments, views or other digital engagement, or
       manipulate search rankings, visibility or algorithms to create a
       misleading impression of professional standing."
     • clause 8.1(xi) — a third party may not be used to do indirectly
       what the clinic may not do directly, so quoting a patient's own
       superlative ("best skin doctor in …") does not launder it.
     • clause 6.2 — patient consent does not rescue a testimonial.
   IMC (PCEE) Regulations 2002, reg. 7.12 is a closed list of what an
   institution's advertisement may contain ("nothing more than the name
   of the institution, type of patients admitted, type of training and
   other facilities offered and the fees") — ratings and reviews are
   outside it.

   What replaces it: a plain, unstyled link to the branch's own Google
   listing.  Sending a reader to an independent platform to read
   whatever is there is not the clinic sharing testimonials as
   promotion, and it keeps the genuine signal available to patients.
   No rating, no count, no stars, no quoted review text is rendered
   here or served to a crawler.

   NOTE FOR WHOEVER OWNS branches.js: the compact ★ rating badge drawn
   over each clinic photo, and the rating/count/review text stored in
   window.MEDICARE_REVIEWS.manual, are rendered by THAT file and are
   caught by the same clauses.  They must come out there too.
   ===================================================================== */
(function () {
  "use strict";
  var CFG = window.MEDICARE_REVIEWS || {};
  var MANUAL = CFG.manual || {};

  function render() {
    Array.prototype.forEach.call(document.querySelectorAll('.bx__reviews[data-slug]'), function (node) {
      var slug = node.getAttribute('data-slug');
      var m = MANUAL[slug] || {};
      var uri = m.uri || "";
      node.classList.remove("bx__reviews--live");
      // Only a route to the independent listing — never a rating, count or quote.
      node.innerHTML = uri
        ? '<a class="rv__more" href="' + uri + '" target="_blank" rel="noopener">Google లో ఈ శాఖ లిస్టింగ్ చూడండి →</a>'
        : "";
    });
  }

  // branch cards are built synchronously by branches.js (loaded earlier); render after a tick
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(render, 60); });
  else setTimeout(render, 60);
  // and once more, in case branches.js repaints a card later
  setTimeout(render, 400);
})();
