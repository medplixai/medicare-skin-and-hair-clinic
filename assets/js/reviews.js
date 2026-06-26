/* =====================================================================
   MEDICARE — Live Google Reviews per branch
   ---------------------------------------------------------------------
   Shows real Google star-rating + review cards inside each branch card.
   CONFIG is in assets/js/branches.js  ->  window.MEDICARE_REVIEWS:
     - apiKey   : Google Maps API key (enable "Maps JavaScript API" +
                  "Places API (New)", then restrict the key to your domain)
     - placeIds : each branch's Google Place ID (find via Google's
                  Place ID Finder or your Google Business Profile)
   Until both are filled, each branch shows a "Google Reviews" button that
   opens its live Google listing (graceful fallback — nothing breaks).
   ===================================================================== */
(function () {
  "use strict";

  var CFG = window.MEDICARE_REVIEWS || {};
  var KEY = (CFG.apiKey || "").trim();
  var MAX = 2; // review snippets shown per branch (full list is one click away on Google)

  // Google "G" logo (for attribution — reviews are from Google)
  var G = '<svg class="rv__g" viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">' +
    '<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/>' +
    '<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>' +
    '<path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.49 12c0-.73.13-1.44.35-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.94l3.66-2.84z"/>' +
    '<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>';

  function esc(t) { var d = document.createElement("div"); d.textContent = t == null ? "" : t; return d.innerHTML; }
  function clip(t, n) { t = t || ""; return t.length > n ? esc(t.slice(0, n).trim()) + "…" : esc(t); }
  function stars(rating) {
    var r = Math.round(rating || 0), s = "";
    for (var i = 1; i <= 5; i++) s += '<span class="rv__star' + (i <= r ? "" : " rv__star--off") + '">★</span>';
    return s;
  }

  function render(node, place) {
    var rating = place.rating;
    var count = place.userRatingCount;
    var reviews = place.reviews || [];

    // also fill the compact rating badge sitting on the clinic photo
    var slug = node.getAttribute("data-slug");
    if (slug && rating) {
      var badge = document.querySelector('.bx__rating[data-slug="' + slug + '"]');
      if (badge) {
        badge.removeAttribute("hidden");
        var bv = badge.querySelector(".bx__rating-val"); if (bv) bv.textContent = rating.toFixed(1);
        var bc = badge.querySelector(".bx__rating-count"); if (bc) bc.textContent = count ? "(" + count + ")" : "";
      }
    }

    if (!rating && !reviews.length) return; // keep the fallback button

    var mapsUri = place.googleMapsURI || node.getAttribute("data-fallback") || "#";
    var html = '<div class="rv__head">' + G +
      (rating ? '<span class="rv__rating">' + rating.toFixed(1) + "</span>" : "") +
      '<span class="rv__stars" aria-label="' + (rating ? rating.toFixed(1) + " out of 5" : "") + '">' + stars(rating) + "</span>" +
      (count ? '<span class="rv__count">(' + count + ")</span>" : "") +
      '<span class="rv__src">Google</span></div>';

    reviews.slice(0, MAX).forEach(function (rev) {
      var a = rev.authorAttribution || {};
      var name = a.displayName || "Google user";
      var txt = typeof rev.text === "string" ? rev.text : (rev.text && rev.text.text) || "";
      var when = rev.relativePublishTimeDescription || "";
      html += '<div class="rv__card">' +
        '<div class="rv__meta"><span class="rv__name">' + esc(name) + "</span>" +
        '<span class="rv__cstars">' + stars(rev.rating || 5) + "</span></div>" +
        (txt ? '<p class="rv__text">' + clip(txt, 160) + "</p>" : "") +
        (when ? '<span class="rv__when">' + esc(when) + "</span>" : "") + "</div>";
    });

    html += '<a class="rv__more" href="' + mapsUri + '" target="_blank" rel="noopener">Google లో అన్ని రివ్యూలు చూడండి →</a>';
    node.classList.add("bx__reviews--live");
    node.innerHTML = html;
  }

  function start() {
    if (!(window.google && google.maps && google.maps.places && google.maps.places.Place)) return;
    Array.from(document.querySelectorAll(".bx__reviews[data-place]")).forEach(function (node) {
      var id = node.getAttribute("data-place");
      if (!id) return;
      try {
        var place = new google.maps.places.Place({ id: id });
        place.fetchFields({ fields: ["rating", "userRatingCount", "reviews", "googleMapsURI"] })
          .then(function (res) { render(node, (res && res.place) || place); })
          .catch(function (e) { console.warn("[reviews] could not load", id, e && e.message); });
      } catch (e) { console.warn("[reviews] init failed", id, e && e.message); }
    });
  }

  // Only load the Google script if a key AND at least one Place ID are configured.
  var hasPlace = !!document.querySelector(".bx__reviews[data-place]");
  if (KEY && hasPlace) {
    window.__medicareInitReviews = start;
    var s = document.createElement("script");
    s.src = "https://maps.googleapis.com/maps/api/js?key=" + encodeURIComponent(KEY) +
            "&libraries=places&callback=__medicareInitReviews";
    s.async = true;
    s.onerror = function () { console.warn("[reviews] Google Maps script failed to load — check API key/restrictions."); };
    document.head.appendChild(s);
  }
})();
