/* =====================================================================
   MEDICARE — Hero before/after comparison
   ---------------------------------------------------------------------
   One card, two photographs of the same patient stacked on top of each
   other; a range input (invisible, full-bleed) wipes the top one away.
   The range is the only control — it brings keyboard, touch and screen
   reader support with it, so there is no pointer maths here at all.

   Photos: assets/img/hero/<slug>-before.jpg + -after.jpg, both 780x1040,
   cropped out of the branded cards in assets/img/before-after/ so the two
   halves line up pixel for pixel. Add a case by adding a pair of files
   and one entry to CASES.
   ===================================================================== */
(function () {
  "use strict";

  var CASES = [
    { slug: "chemical-peel",    te: "మొటిమలు · మచ్చలు",         en: "Acne & acne marks",      tab: "మొటిమలు" },
    { slug: "hair-mesotherapy", te: "జుట్టు రాలడం",             en: "Hair fall & thinning",   tab: "జుట్టు" },
    { slug: "laser-hair",       te: "అవాంఛిత రోమాలు · లేజర్",   en: "Unwanted hair · laser",  tab: "లేజర్" },
    { slug: "skin-tags",        te: "స్కిన్ ట్యాగ్స్ · పుట్టుమచ్చలు", en: "Skin tags & moles",  tab: "ట్యాగ్స్" },
    { slug: "botox",            te: "ముడతలు · బొటాక్స్",         en: "Wrinkles · Botox",       tab: "ముడతలు" }
  ];
  var DOCTOR = "Dr Meghana Valeti · MD (DVL)";
  var DIR = "assets/img/hero/";

  var root   = document.getElementById("heroBA");
  var stage  = document.getElementById("baStage");
  var before = document.getElementById("baBefore");
  var after  = document.getElementById("baAfter");
  var range  = document.getElementById("baRange");
  var tabs   = document.getElementById("baTabs");
  var nameTe = document.getElementById("baNameTe");
  var nameEn = document.getElementById("baNameEn");
  var doc    = document.getElementById("baDoc");
  if (!root || !stage || !before || !after || !range || !tabs) return;

  var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var touched = false;          // the visitor has taken over; stop all automation
  var idx = 0, rotateTimer = null, sweepRaf = null;

  /* ---- the wipe ---- */
  function paint(v) { stage.style.setProperty("--p", v + "%"); }
  function onInput() { paint(range.value); }
  range.addEventListener("input", onInput);

  function takeOver() {
    if (touched) return;
    touched = true;
    clearTimeout(rotateTimer);
    cancelAnimationFrame(sweepRaf);
    stage.classList.remove("is-sweeping");
  }
  ["pointerdown", "keydown", "touchstart"].forEach(function (e) {
    range.addEventListener(e, takeOver, { passive: true });
  });

  /* ---- one slow sweep, so it is obvious the card can be dragged ---- */
  function sweep(then) {
    if (calm || touched) { if (then) then(); return; }
    var stops = [50, 88, 14, 50], leg = 0, t0 = 0, DUR = 820;
    stage.classList.add("is-sweeping");
    function step(ts) {
      if (touched) return;
      if (!t0) t0 = ts;
      var k = Math.min((ts - t0) / DUR, 1);
      var e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;   // easeInOutQuad
      var v = stops[leg] + (stops[leg + 1] - stops[leg]) * e;
      paint(v); range.value = v;
      if (k < 1) { sweepRaf = requestAnimationFrame(step); }
      else if (++leg < stops.length - 1) { t0 = 0; sweepRaf = requestAnimationFrame(step); }
      else { stage.classList.remove("is-sweeping"); if (then) then(); }
    }
    sweepRaf = requestAnimationFrame(step);
  }

  /* ---- switching case ---- */
  function show(i, animate) {
    idx = (i + CASES.length) % CASES.length;
    var c = CASES[idx];

    var b = new Image(), a = new Image();
    var left = 2;
    function ready() {
      if (--left) return;
      if (animate && !calm) stage.classList.add("is-swapping");
      window.setTimeout(function () {
        before.src = b.src; after.src = a.src;
        before.alt = "చికిత్సకు ముందు — " + c.te;
        after.alt  = "చికిత్స తరువాత — " + c.te + ", Medicare Skin & Hair Clinic";
        nameTe.textContent = c.te;
        nameEn.textContent = c.en;
        doc.textContent = DOCTOR;
        paint(50); range.value = 50;
        stage.classList.remove("is-swapping");
        if (animate) sweep(queue);
      }, (animate && !calm) ? 220 : 0);
    }
    b.onload = b.onerror = ready;
    a.onload = a.onerror = ready;
    b.src = DIR + c.slug + "-before.jpg";
    a.src = DIR + c.slug + "-after.jpg";

    Array.prototype.forEach.call(tabs.children, function (el, n) {
      var on = n === idx;
      el.classList.toggle("on", on);
      el.setAttribute("aria-selected", on ? "true" : "false");
      el.tabIndex = on ? 0 : -1;
    });
  }

  function queue() {
    if (touched || calm) return;
    clearTimeout(rotateTimer);
    rotateTimer = setTimeout(function () { show(idx + 1, true); }, 2600);
  }

  /* ---- tabs ---- */
  CASES.forEach(function (c, n) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "ba2__tab" + (n === 0 ? " on" : "");
    b.setAttribute("role", "tab");
    b.setAttribute("aria-selected", n === 0 ? "true" : "false");
    b.tabIndex = n === 0 ? 0 : -1;
    b.textContent = c.tab;
    b.addEventListener("click", function () { takeOver(); show(n, false); });
    tabs.appendChild(b);
  });

  /* ---- start only once the card is actually on screen ---- */
  function begin() { sweep(queue); }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { io.disconnect(); begin(); } });
    }, { threshold: .4 });
    io.observe(root);
  } else { begin(); }

  /* quietly warm the next case so the first switch does not flash */
  window.addEventListener("load", function () {
    CASES.slice(1).forEach(function (c) {
      ["before", "after"].forEach(function (s) { new Image().src = DIR + c.slug + "-" + s + ".jpg"; });
    });
  });
})();
