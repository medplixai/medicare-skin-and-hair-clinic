/* =====================================================================
   MEDICARE — Before / After results  →  WITHDRAWN (legal)
   ---------------------------------------------------------------------
   This file used to render an auto-scrolling before/after photo carousel
   from assets/img/before-after/<slug>.jpg.  That display is prohibited.

   NMC Guidelines on Ethical Advertising and Public Communication
   (No. R-13014/01/2024-Ethics, 06/10/2026 — in force with immediate
   effect), clause 8.1(v):
     "Shall not publish cases for promotional purposes, advertise
      surgical results, display 'before and after' photographs ...
      unless published strictly for scientific or educational purposes
      with anonymized patient consent."
   A marketing carousel on a clinic home page is not a scientific or
   educational publication, so the exception does not reach it.  Clause
   6.2 closes the usual workaround: patient consent does NOT by itself
   make a before-and-after depiction permissible.  The same conduct was
   already caught by IMC (PCEE) Regulations 2002, reg. 6.1.1 ("nor shall
   he boast of cases, operations, cures or remedies or permit the
   publication of report thereof through any mode").

   This script therefore renders nothing and actively keeps the section
   and its navigation links hidden, so that stale markup or image files
   left anywhere in the tree cannot republish the gallery.
   DO NOT reinstate the carousel.  Clinical images may be retained for
   genuine scientific or educational use only, de-identified per clause
   6.4, and not on a public marketing page.
   ===================================================================== */
window.MEDICARE_RESULTS = [];

(function () {
  "use strict";

  function suppress() {
    var section = document.getElementById("results");
    if (section) {
      section.classList.remove("results--ready");
      section.hidden = true;
      section.setAttribute("aria-hidden", "true");
      section.style.display = "none";
      var list = document.getElementById("resultsList");
      if (list) list.innerHTML = "";
    }
    // hide every link that points at the withdrawn section
    Array.prototype.forEach.call(
      document.querySelectorAll('a[href="#results"], a[href$="#results"]'),
      function (a) { a.style.display = "none"; a.setAttribute("aria-hidden", "true"); }
    );
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", suppress);
  else suppress();
  // run once more after other scripts have built their markup
  setTimeout(suppress, 120);
})();
