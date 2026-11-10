/* =====================================================================
   MEDICARE — Hero before/after comparison
   ---------------------------------------------------------------------
   One card, two photographs of the same patient stacked on top of each
   other; a range input (invisible, full-bleed) wipes the top one away.
   The range is the only control — it brings keyboard, touch and screen
   reader support with it, so there is no pointer maths here at all.

   The card runs on its own: every case sweeps once from before to after
   and back, then the next case takes over, round and round. Touching the
   slider or a tab holds it still for RESUME_MS and then it picks up
   again; the pause button stops it until it is pressed a second time. It
   never runs while it is off screen, in a hidden tab, or under
   prefers-reduced-motion.

   Photos: assets/img/hero/<slug>-before.jpg + -after.jpg, both 780x1040,
   cropped out of the branded cards in assets/img/before-after/ so the two
   halves line up pixel for pixel. Add a case by adding a pair of files
   and one entry to CASES.

   Every patient's eyes carry a black bar — tools/eye-mask.py puts it there,
   and gives a before/after pair the same bar so the wipe does not step
   across it. A new photograph has to be masked before it goes in.
   ===================================================================== */
(function () {
  "use strict";

  var CASES = [
    { slug: "chemical-peel",    te: "మొటిమలు · మచ్చలు",         en: "Acne & acne marks",      tab: "Acne" },
    { slug: "melasma",          te: "మచ్చలు · మెలస్మా",         en: "Melasma & pigmentation", tab: "Melasma" },
    { slug: "hair-mesotherapy", te: "జుట్టు రాలడం",             en: "Hair fall & thinning",   tab: "Hair Fall" },
    { slug: "laser-hair",       te: "అవాంఛిత రోమాలు · లేజర్",   en: "Unwanted hair · laser",  tab: "Laser" },
    { slug: "skin-tags",        te: "స్కిన్ ట్యాగ్స్ · పుట్టుమచ్చలు", en: "Skin tags & moles",  tab: "Skin Tags" },
    { slug: "botox",            te: "ముడతలు · బొటాక్స్",         en: "Wrinkles · Botox",       tab: "Wrinkles" }
  ];
  var DOCTOR    = "Dr Meghana Valeti · MD (DVL)";
  var DIR       = "assets/img/hero/";
  /* The eye masks were added to these files without renaming them, so a
     browser or CDN holding the older copy would keep showing the patients'
     faces. Raise this whenever a photograph is re-edited, and raise the
     same token on the two <img> tags in index.html. */
  var V         = "?v=202611100900";
  var HOLD_MS   = 1500;   // how long the finished "after" stays up before the next case
  var RESUME_MS = 8000;   // how long a visitor's own drag keeps the card still
  var LEG_MS    = 820;    // one leg of the sweep

  var root   = document.getElementById("heroBA");
  var stage  = document.getElementById("baStage");
  var before = document.getElementById("baBefore");
  var after  = document.getElementById("baAfter");
  var range  = document.getElementById("baRange");
  var tabs   = document.getElementById("baTabs");
  var play   = document.getElementById("baPlay");
  var nameTe = document.getElementById("baNameTe");
  var nameEn = document.getElementById("baNameEn");
  var doc    = document.getElementById("baDoc");
  if (!root || !stage || !before || !after || !range || !tabs) return;

  var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var idx = 0;
  var timer = null, raf = null, guard = null;
  var onScreen = false;      // the card is in the viewport
  var userPaused = false;    // the pause button is down
  var holdUntil = 0;         // wall-clock time the visitor's own turn ends

  /* ---- the wipe ---- */
  function paint(v) { stage.style.setProperty("--p", v + "%"); }
  range.addEventListener("input", function () { paint(range.value); });

  /* ---- the loop ---------------------------------------------------- */
  function schedule(ms) { clearTimeout(timer); timer = setTimeout(tick, ms); }

  function stopSweep() {
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    clearTimeout(guard); guard = null;
    stage.classList.remove("is-sweeping");
  }

  function tick() {
    if (calm || userPaused || !onScreen || document.hidden) { schedule(1000); return; }
    var left = holdUntil - Date.now();
    if (left > 0) { schedule(left); return; }
    show(idx + 1, true);
  }

  /* A visitor touching the card wins: the sweep stops where it is and the
     loop waits RESUME_MS from the last thing they did. */
  function handOver() {
    stopSweep();
    holdUntil = Date.now() + RESUME_MS;
    schedule(RESUME_MS);
  }
  ["pointerdown", "keydown", "touchstart", "input"].forEach(function (e) {
    range.addEventListener(e, handOver, { passive: true });
  });

  /* ---- one sweep: before -> after -> before -> middle --------------- */
  function sweep(then) {
    if (calm) { paint(50); range.value = 50; if (then) then(); return; }
    var stops = [50, 88, 14, 50], leg = 0, t0 = 0, done = false;

    /* requestAnimationFrame stops being delivered whenever the page is not
       being painted — a background tab, an occluded window, a preview pane
       that is closed. visibilitychange catches the common case, but not all
       of them, and a sweep that never reaches its last frame would freeze the
       whole rotation. This guard ends it on wall-clock time instead. */
    function finish() {
      if (done) return;
      done = true;
      stopSweep();
      paint(50); range.value = 50;
      if (then) then();
    }

    stage.classList.add("is-sweeping");
    function step(ts) {
      if (done) return;
      if (!t0) t0 = ts;
      var k = Math.min((ts - t0) / LEG_MS, 1);
      var e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;   // easeInOutQuad
      var v = stops[leg] + (stops[leg + 1] - stops[leg]) * e;
      paint(v); range.value = v;
      if (k < 1) { raf = requestAnimationFrame(step); }
      else if (++leg < stops.length - 1) { t0 = 0; raf = requestAnimationFrame(step); }
      else { finish(); }
    }
    raf = requestAnimationFrame(step);
    guard = setTimeout(finish, LEG_MS * 3 + 1600);
  }

  /* ---- switching case ----------------------------------------------- */
  function show(i, animate) {
    idx = (i + CASES.length) % CASES.length;
    var c = CASES[idx];
    stopSweep();

    var b = new Image(), a = new Image(), left = 2;
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
        if (animate) sweep(function () { schedule(HOLD_MS); });
      }, (animate && !calm) ? 220 : 0);
    }
    b.onload = b.onerror = ready;
    a.onload = a.onerror = ready;
    b.src = DIR + c.slug + "-before.jpg" + V;
    a.src = DIR + c.slug + "-after.jpg" + V;

    Array.prototype.forEach.call(tabs.children, function (el, n) {
      var on = n === idx;
      el.classList.toggle("on", on);
      el.setAttribute("aria-selected", on ? "true" : "false");
      el.tabIndex = on ? 0 : -1;
    });
  }

  /* ---- tabs ---------------------------------------------------------- */
  CASES.forEach(function (c, n) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "ba2__tab" + (n === 0 ? " on" : "");
    b.setAttribute("role", "tab");
    b.setAttribute("aria-selected", n === 0 ? "true" : "false");
    b.tabIndex = n === 0 ? 0 : -1;
    b.textContent = c.tab;
    b.addEventListener("click", function () { show(n, false); handOver(); });
    tabs.appendChild(b);
  });

  /* ---- pause ---------------------------------------------------------- */
  if (play) {
    play.addEventListener("click", function () {
      userPaused = !userPaused;
      play.classList.toggle("is-paused", userPaused);
      play.setAttribute("aria-pressed", userPaused ? "true" : "false");
      play.setAttribute("aria-label", userPaused
        ? "ఫోటోలు వాటంతట మారడం మళ్ళీ మొదలుపెట్టండి · resume auto-play"
        : "ఫోటోలు వాటంతట మారడం ఆపండి · pause auto-play");
      if (userPaused) { stopSweep(); clearTimeout(timer); }
      else { holdUntil = 0; schedule(400); }
    });
  }

  /* ---- only while it is actually on screen ---------------------------- */
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        onScreen = e.isIntersecting;
        if (onScreen) schedule(600); else { stopSweep(); clearTimeout(timer); }
      });
    }, { threshold: .35 }).observe(root);
  } else {
    onScreen = true; schedule(600);
  }
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { stopSweep(); clearTimeout(timer); }
    else if (onScreen) schedule(600);
  });

  /* quietly warm the other cases so a switch never flashes */
  window.addEventListener("load", function () {
    CASES.slice(1).forEach(function (c) {
      ["before", "after"].forEach(function (s) { new Image().src = DIR + c.slug + "-" + s + ".jpg" + V; });
    });
  });
})();
