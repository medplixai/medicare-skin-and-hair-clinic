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

  /* ---- Booking form -> CRM lead + WhatsApp ----
     The enquiry is saved to the group's CRM first (fire-and-forget, never blocks),
     then WhatsApp opens with the prefilled message exactly as before. ---- */
  const WHATSAPP_NUMBER = "919141247777"; // Kaikaluru head-office WhatsApp
  const BRANCH_SLUGS = { "కైకలూరు": "kaikaluru", "భీమవరం": "bhimavaram", "ఏలూరు": "eluru", "గుడివాడ": "gudivada", "గన్నవరం": "gannavaram", "నూజివీడు": "nuzvid", "ఆకివీడు": "akividu", "తాడేపల్లిగూడెం": "tadepalligudem", "మచిలీపట్నం": "machilipatnam", "ఒంగోలు": "ongole" };
  const sendLead = (payload) => {
    try {
      const params = new URLSearchParams(location.search);
      const body = Object.assign({ page: location.href, utm_source: params.get("utm_source"), utm_campaign: params.get("utm_campaign"), utm_content: params.get("utm_content") }, payload);
      fetch("/api/lead", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), keepalive: true }).catch(() => {});
    } catch (_) { /* never block the WhatsApp hand-off */ }
  };
  window.medicareSendLead = sendLead;
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

      sendLead({ kind: "appointment_form", name, phone, branch, service, message: msg });

      const slug = BRANCH_SLUGS[branch] || "any";
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
      // Attribution tag the WhatsApp agent reads: which branch the website visitor picked.
      lines.push("", "(from=web-" + slug + ")");

      const url = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(lines.join("\n"));
      window.open(url, "_blank", "noopener");
    });
  }

  /* ---- Doctor photos: inject into leadership + roster avatars (falls back to initials) ----
     Headings are bilingual (English + Telugu), so match by substring. ---- */
  const DOC_PHOTOS = [
    ["Nagaraju", "nagaraju"], ["Meghana", "meghana"], ["Sruthi", "shruti"],
    ["Satvika", "satvika"], ["Sowmya", "soumya"], ["Divija", "sai-divija"],
    ["Akhila", "akhila"], ["Deepthi", "sai-deepthi"], ["Sudheer", "sudheer-kumar"],
    ["Aditya", "aditya"], ["Ananya", "ananya"]
  ];
  $$(".doctor, .medic").forEach(card => {
    const nameEl = card.querySelector("h3, h4");
    const avatar = card.querySelector(".doctor__avatar, .medic__avatar");
    if (!nameEl || !avatar) return;
    const txt = nameEl.textContent;
    let slug = null;
    DOC_PHOTOS.forEach(p => { if (!slug && txt.indexOf(p[0]) > -1) slug = p[1]; });
    if (!slug) return;
    const img = new Image();
    img.src = "assets/img/doctors/" + slug + ".jpg";
    img.alt = nameEl.textContent.trim();
    img.loading = "lazy";
    img.onerror = () => img.remove();
    avatar.insertBefore(img, avatar.firstChild);
  });

  /* ---- Hero headline: typewriter, alternating Telugu <-> English (Telugu primary) ---- */
  const leadEl = $("#heroLead"), rot = $("#heroRotate");
  if (leadEl && rot) {
    const LEAD = { te: "మీ చర్మం, జుట్టు & గోళ్ళ ఆరోగ్యానికి", en: "Your skin, hair & nail health —" };
    const PAIRS = [
      { te: "నమ్మదగిన చిరునామా", en: "a trusted name" },
      { te: "ఆధునిక చికిత్సలు", en: "modern treatments" },
      { te: "నిపుణుల సంరక్షణ", en: "expert care" },
      { te: "అందమైన ఫలితాలు", en: "beautiful results" }
    ];
    // alternate Telugu then English -> Telugu shown first & on every other slide
    const order = [];
    PAIRS.forEach(function (p) {
      order.push({ lead: LEAD.te, phrase: p.te });
      order.push({ lead: LEAD.en, phrase: p.en });
    });
    const seg = (window.Intl && Intl.Segmenter) ? new Intl.Segmenter("te", { granularity: "grapheme" }) : null;
    const clusters = (s) => seg ? Array.from(seg.segment(s), (x) => x.segment) : Array.from(s);
    let pi = 0, gi = clusters(order[0].phrase).length, del = true;
    const type = () => {
      const g = clusters(order[pi].phrase);
      if (del) {
        gi--;
        rot.textContent = g.slice(0, Math.max(gi, 0)).join("");
        if (gi <= 0) {
          del = false;
          pi = (pi + 1) % order.length;
          leadEl.textContent = order[pi].lead;   // swap lead language while phrase is empty
          gi = 0;
          return setTimeout(type, 350);
        }
        return setTimeout(type, 42);
      }
      gi++;
      const ng = clusters(order[pi].phrase);
      rot.textContent = ng.slice(0, gi).join("");
      if (gi >= ng.length) { del = true; return setTimeout(type, 1700); }
      return setTimeout(type, 90);
    };
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce) setTimeout(type, 1600);
  }

  /* ---- Footer year ---- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
