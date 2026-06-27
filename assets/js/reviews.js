/* =====================================================================
   MEDICARE — Google reviews per branch (hardcoded, zero API calls)
   ---------------------------------------------------------------------
   Ratings + a couple of real review snippets are stored statically in
   window.MEDICARE_REVIEWS.manual (in branches.js) — fetched once from the
   Google Places API. The compact ★ rating badge on each clinic photo is
   rendered by branches.js; this file fills in the review snippets below
   the map. No per-visit API key / calls → no Google billing.
   To refresh the numbers, re-fetch from Places and update branches.js.
   ===================================================================== */
(function () {
  "use strict";
  var CFG = window.MEDICARE_REVIEWS || {};
  var MANUAL = CFG.manual || {};
  var MAX = 2; // snippets shown per branch

  var G = '<svg class="rv__g" viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">' +
    '<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/>' +
    '<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>' +
    '<path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.49 12c0-.73.13-1.44.35-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.94l3.66-2.84z"/>' +
    '<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>';

  function esc(t) { var d = document.createElement("div"); d.textContent = t == null ? "" : t; return d.innerHTML; }
  function clip(t, n) { t = t || ""; return t.length > n ? esc(t.slice(0, n).trim()) + "…" : esc(t); }
  function stars(r) { r = Math.round(r || 0); var s = ""; for (var i = 1; i <= 5; i++) s += '<span class="rv__star' + (i <= r ? "" : " rv__star--off") + '">★</span>'; return s; }

  function render() {
    Array.prototype.forEach.call(document.querySelectorAll('.bx__reviews[data-slug]'), function (node) {
      var slug = node.getAttribute('data-slug');
      var m = MANUAL[slug];
      if (!m || !m.rating) return; // keep the fallback "Google Reviews" button
      var revs = m.reviews || [];
      var rv = Number(m.rating).toFixed(1);
      var html = '<div class="rv__head">' + G +
        '<span class="rv__rating">' + rv + '</span>' +
        '<span class="rv__stars" aria-label="' + rv + ' out of 5">' + stars(m.rating) + '</span>' +
        (m.count ? '<span class="rv__count">(' + m.count + ')</span>' : '') +
        '<span class="rv__src">Google</span></div>';
      revs.slice(0, MAX).forEach(function (rev) {
        html += '<div class="rv__card">' +
          '<div class="rv__meta"><span class="rv__name">' + esc(rev.name || "Google user") + '</span>' +
          '<span class="rv__cstars">' + stars(rev.rating || 5) + '</span></div>' +
          (rev.text ? '<p class="rv__text">' + clip(rev.text, 160) + '</p>' : '') + '</div>';
      });
      html += '<a class="rv__more" href="' + (m.uri || "#") + '" target="_blank" rel="noopener">Google లో అన్ని రివ్యూలు చూడండి →</a>';
      node.classList.add("bx__reviews--live");
      node.innerHTML = html;
    });
  }

  // branch cards are built synchronously by branches.js (loaded earlier); render after a tick
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(render, 60); });
  else setTimeout(render, 60);
})();
