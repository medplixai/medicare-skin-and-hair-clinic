/* =====================================================================
   MEDICARE Skin & Hair Clinic — interactions
   ===================================================================== */
(function () {
  "use strict";

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ---- Mobile nav ---- */
  const nav = $("#nav");
  const toggle = $("#navToggle");
  const closeNav = () => { nav.classList.remove("open"); toggle.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); };

  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
  });
  $$(".nav__link", nav).forEach(a => a.addEventListener("click", closeNav));
  document.addEventListener("click", e => {
    if (nav.classList.contains("open") && !nav.contains(e.target) && !toggle.contains(e.target)) closeNav();
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeNav(); });

  /* ---- Header shadow on scroll ---- */
  const header = $(".header");
  const toTop = $("#toTop");
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle("scrolled", y > 12);
    toTop.classList.toggle("show", y > 600);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  /* ---- Reveal on scroll ---- */
  const reveals = $$(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en, i) => {
        if (en.isIntersecting) {
          en.target.style.transitionDelay = Math.min(i * 60, 240) + "ms";
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add("in"));
  }

  /* ---- Animated stat counters ---- */
  const counters = $$(".stat__num[data-count]");
  const runCount = (el) => {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || "";
    const dur = 1400; const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + (p === 1 ? suffix : "");
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if (counters.length && "IntersectionObserver" in window) {
    const co = new IntersectionObserver((entries) => {
      entries.forEach(en => { if (en.isIntersecting) { runCount(en.target); co.unobserve(en.target); } });
    }, { threshold: 0.6 });
    counters.forEach(c => co.observe(c));
  } else {
    counters.forEach(c => { c.textContent = c.dataset.count + (c.dataset.suffix || ""); });
  }

  /* ---- Active nav link on scroll (scrollspy) ---- */
  const sections = $$("main section[id]");
  const navLinks = $$(".nav__link");
  if (sections.length && "IntersectionObserver" in window) {
    const so = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          const id = en.target.id;
          navLinks.forEach(l => l.classList.toggle("active", l.getAttribute("href") === "#" + id));
        }
      });
    }, { threshold: 0.5, rootMargin: "-20% 0px -40% 0px" });
    sections.forEach(s => so.observe(s));
  }

  /* ---- Booking form -> WhatsApp ---- */
  const WHATSAPP_NUMBER = "919141247777"; // Kaikaluru head-office WhatsApp
  const form = $("#bookingForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const name = (data.get("name") || "").toString().trim();
      const phone = (data.get("phone") || "").toString().trim();
      const branch = data.get("branch");
      const service = data.get("service");
      const msg = (data.get("message") || "").toString().trim();

      const lines = [
        "నమస్తే మెడికేర్ స్కిన్ & హెయిర్ క్లినిక్,",
        "నేను అపాయింట్‌మెంట్ బుక్ చేసుకోవాలనుకుంటున్నాను.",
        "",
        "👤 పేరు: " + name,
        "📞 ఫోన్: " + phone,
        "📍 శాఖ: " + branch,
        "💆 సేవ: " + service,
      ];
      if (msg) lines.push("📝 సందేశం: " + msg);

      const url = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(lines.join("\n"));
      window.open(url, "_blank", "noopener");
    });
  }

  /* ---- Doctor photos: inject into leadership + roster avatars (falls back to initials) ---- */
  const DOC_PHOTOS = {
    "డా. మేఘన": "meghana", "డా. శృతి": "shruti", "నాగరాజు బండారు": "nagaraju",
    "డా. సాత్విక": "satvika", "డా. సౌమ్య": "soumya", "డా. కమ్మ సాయి దివిజ": "sai-divija",
    "డా. అఖిల": "akhila", "డా. సాయిదీప్తి": "sai-deepthi", "డా. సుధీర్ కుమార్": "sudheer-kumar",
    "డా. ఆదిత్య": "aditya", "డా. అనన్య బొల్లినేని": "ananya"
  };
  $$(".doctor, .medic").forEach(card => {
    const nameEl = card.querySelector("h3, h4");
    const avatar = card.querySelector(".doctor__avatar, .medic__avatar");
    if (!nameEl || !avatar) return;
    const slug = DOC_PHOTOS[nameEl.textContent.trim()];
    if (!slug) return;
    const img = new Image();
    img.src = "assets/img/doctors/" + slug + ".jpg";
    img.alt = nameEl.textContent.trim();
    img.loading = "lazy";
    img.onerror = () => img.remove();
    avatar.insertBefore(img, avatar.firstChild);
  });

  /* ---- Hero rotating phrase (grapheme-safe Telugu typewriter) ---- */
  const rot = $("#heroRotate");
  if (rot) {
    const phrases = ["a trusted name", "modern treatments", "expert care", "beautiful results"];
    const seg = (window.Intl && Intl.Segmenter) ? new Intl.Segmenter("te", { granularity: "grapheme" }) : null;
    const clusters = (s) => seg ? Array.from(seg.segment(s), (x) => x.segment) : Array.from(s);
    let pi = 0, gi = clusters(phrases[0]).length, del = true;
    const type = () => {
      const g = clusters(phrases[pi]);
      if (del) {
        gi--;
        rot.textContent = g.slice(0, Math.max(gi, 0)).join("");
        if (gi <= 0) { del = false; pi = (pi + 1) % phrases.length; gi = 0; return setTimeout(type, 300); }
        return setTimeout(type, 45);
      }
      gi++;
      const ng = clusters(phrases[pi]);
      rot.textContent = ng.slice(0, gi).join("");
      if (gi >= ng.length) { del = true; return setTimeout(type, 1700); }
      return setTimeout(type, 95);
    };
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce) setTimeout(type, 1800);
  }

  /* ---- Footer year ---- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
