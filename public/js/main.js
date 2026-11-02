/*
 * Yuzu Talent Agency · Concept 10 "Good Trouble"
 * Kinetic yuzu mark (slice → smile → Y), ransom-note letters that reshuffle,
 * torn paper edges, scroll reveals and the creator/brand enquiry form.
 */
(function () {
  "use strict";

  const SITE = "10-good-trouble";
  const NS = "http://www.w3.org/2000/svg";
  const root = document.documentElement;
  root.classList.remove("no-js");
  root.classList.add("js");

  const reduceMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reduced = reduceMQ.matches;

  /* ---------------------------------------------------------------
   * Utilities
   * ------------------------------------------------------------- */
  const $ = (s, ctx) => (ctx || document).querySelector(s);
  const $$ = (s, ctx) => Array.from((ctx || document).querySelectorAll(s));
  const f1 = (n) => Math.round(n * 10) / 10;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  function hash(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return h >>> 0;
  }
  function rng(seed) {
    let s = typeof seed === "number" ? seed : hash(String(seed));
    return function () {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function svgEl(tag, attrs) {
    const n = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }
  /* closed smooth path through points (quadratic midpoints) */
  function smoothClosed(pts) {
    const n = pts.length;
    const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const P = (p) => f1(p[0]) + " " + f1(p[1]);
    let d = "M" + P(mid(pts[n - 1], pts[0]));
    for (let i = 0; i < n; i++) d += "Q" + P(pts[i]) + " " + P(mid(pts[i], pts[(i + 1) % n]));
    return d + "Z";
  }
  /* Goodform-style organic ring */
  function noisyRing(cx, cy, r, amp, ph, steps) {
    const pts = [];
    steps = steps || 48;
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const k = 1 + amp * (Math.sin(2 * a + ph[0]) * 0.6 + Math.sin(3 * a + ph[1]) * 0.3 + Math.sin(5 * a + ph[2]) * 0.15);
      pts.push([cx + Math.cos(a) * r * k, cy + Math.sin(a) * r * k]);
    }
    return smoothClosed(pts);
  }
  function debounce(fn, ms) {
    let t;
    return function () { clearTimeout(t); t = setTimeout(fn, ms); };
  }

  /* ---------------------------------------------------------------
   * 1. Kinetic logomark: six cut-paper pieces morph between a citrus
   *    slice, a smiley face and a "Y", inside a breathing peel ring.
   * ------------------------------------------------------------- */
  const Mark = (function () {
    const L = (ax, ay, bx, by, w1, w2) => ({ ax, ay, bx, by, w1, w2: w2 == null ? w1 : w2 });
    const slice = [];
    for (let i = 0; i < 6; i++) {
      const a = ((-90 + i * 60) * Math.PI) / 180, dx = Math.cos(a), dy = Math.sin(a);
      slice.push(L(50 + dx * 9, 50 + dy * 9, 50 + dx * 35, 50 + dy * 35, 6, 11));
    }
    const arc = (deg) => [50 + Math.cos((deg * Math.PI) / 180) * 23, 50 + Math.sin((deg * Math.PI) / 180) * 23];
    const s1 = arc(22), s2 = arc(66), s3 = arc(114), s4 = arc(158);
    const smile = [
      L(52, 22, 64, 13, 3.5, 4),               // leaf on top
      L(63, 31, 63, 45, 4.5),                  // right eye
      L(s1[0], s1[1], s2[0], s2[1], 3.6),      // smile, right
      L(s2[0], s2[1], s3[0], s3[1], 3.6),      // smile, middle
      L(s3[0], s3[1], s4[0], s4[1], 3.6),      // smile, left
      L(37, 31, 37, 45, 4.5)                   // left eye
    ];
    const Y = [
      L(72, 19, 62, 34, 5.5),
      L(61, 36, 52, 49, 5.5),
      L(50, 53, 50, 68, 5.5),
      L(50, 71, 50, 85, 5.5),
      L(48, 49, 39, 36, 5.5),
      L(38, 34, 28, 19, 5.5)
    ];
    const STATES = [
      { p: slice, core: 1, spin: 1 },
      { p: smile, core: 0, spin: 0 },
      { p: Y, core: 0, spin: 0 }
    ];
    const HOLD = 2.2, MORPH = 0.85, SEG = HOLD + MORPH;
    const easeBack = (t) => { const c = 1.25, c3 = c + 1; return 1 + c3 * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

    function piecePath(s) {
      const dx = s.bx - s.ax, dy = s.by - s.ay, len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len;
      const p = (t, w) => [s.ax + dx * t + nx * w, s.ay + dy * t + ny * w];
      const a1 = p(0.22, s.w1), a2 = p(0.78, s.w2), b1 = p(0.78, -s.w2), b2 = p(0.22, -s.w1);
      const F = (q) => f1(q[0]) + " " + f1(q[1]);
      return `M${F([s.ax, s.ay])}C${F(a1)} ${F(a2)} ${F([s.bx, s.by])}C${F(b1)} ${F(b2)} ${F([s.ax, s.ay])}Z`;
    }
    function mix(A, B, t) {
      return {
        core: lerp(A.core, B.core, clamp(t, 0, 1)),
        spin: lerp(A.spin, B.spin, clamp(t, 0, 1)),
        p: A.p.map((a, i) => {
          const b = B.p[i], o = {};
          for (const k in a) o[k] = lerp(a[k], b[k], t);
          o.w1 = Math.max(1, o.w1); o.w2 = Math.max(1, o.w2);
          return o;
        })
      };
    }
    function peelPath(t) {
      const pts = [];
      for (let i = 0; i < 40; i++) {
        const a = (i / 40) * Math.PI * 2;
        const k = 1 + 0.03 * Math.sin(3 * a + t * 1.3) + 0.018 * Math.sin(5 * a - t * 2.1);
        pts.push([50 + Math.cos(a) * 44 * k, 50 + Math.sin(a) * 44 * k]);
      }
      return smoothClosed(pts);
    }

    const loops = [];
    function mount(host) {
      const svg = svgEl("svg", { viewBox: "0 0 100 100", "aria-hidden": "true", focusable: "false" });
      svg.innerHTML = '<circle class="m-disk" cx="50" cy="50" r="44"/><path class="m-peel"/><g class="m-g">' +
        "<path class='m-piece'/>".repeat(6) + '<circle class="m-core" cx="50" cy="50" r="4.5"/></g>';
      host.appendChild(svg);
      const inst = { peel: $(".m-peel", svg), g: $(".m-g", svg), core: $(".m-core", svg), pieces: $$(".m-piece", svg), last: {} };
      const mode = host.dataset.mark;
      render(inst, mode === "smile" ? STATES[1] : STATES[0], 0, 0);
      if (mode === "loop") loops.push(inst);
    }
    // only touch the DOM when a value actually changed (pieces sit still
    // for most of each cycle, so this skips most of the per-frame work)
    function put(m, key, el, attr, val) {
      if (m.last[key] === val) return;
      m.last[key] = val;
      el.setAttribute(attr, val);
    }
    function render(m, state, rot, t) {
      put(m, "peel", m.peel, "d", peelPath(t));
      const core = String(f1(state.core));
      if (m.last.core !== core) { m.last.core = core; m.core.style.opacity = core; }
      put(m, "rot", m.g, "transform", `rotate(${f1(rot)} 50 50)`);
      state.p.forEach((s, i) => put(m, "p" + i, m.pieces[i], "d", piecePath(s)));
    }
    let raf = 0;
    function frame(now) {
      const t = now / 1000;
      const cyc = t % (SEG * 3), idx = Math.floor(cyc / SEG), local = cyc - idx * SEG;
      const k = local < HOLD ? 0 : easeBack((local - HOLD) / MORPH);
      const s = mix(STATES[idx], STATES[(idx + 1) % 3], k);
      const rot = s.spin * Math.sin(t * 0.8) * 14;
      loops.forEach((m) => render(m, s, rot, t));
      raf = requestAnimationFrame(frame);
    }
    function start() {
      cancelAnimationFrame(raf);
      if (reduced) loops.forEach((m) => render(m, STATES[0], 0, 0));
      else if (loops.length) raf = requestAnimationFrame(frame);
    }
    return {
      init() { $$("[data-mark]").forEach(mount); start(); },
      restart: start
    };
  })();

  /* ---------------------------------------------------------------
   * 2. Ransom-note letters (reshuffle on hover)
   * ------------------------------------------------------------- */
  const RANSOM = ["r-forest", "r-butter", "r-tomato", "r-cobalt", "r-paper", "r-outline", "r-soft", "r-hand", "r-dots"];
  function stylesFor(node) {
    return node.closest(".how") ? RANSOM.filter((c) => c !== "r-forest") : RANSOM;
  }
  function styleLetter(span, r, pool, avoid) {
    let k;
    do { k = pool[Math.floor(r() * pool.length)]; } while (k === avoid || k === span.dataset.style);
    if (span.dataset.style) span.classList.remove(span.dataset.style);
    span.dataset.style = k;
    span.classList.add(k);
    span.style.setProperty("--rr", ((r() - 0.5) * 14).toFixed(1) + "deg");
    span.style.setProperty("--ry", ((r() - 0.5) * 0.14).toFixed(2) + "em");
    return k;
  }
  function ransom(node) {
    const text = node.textContent.trim();
    const r = rng("goodtrouble" + text);
    const pool = stylesFor(node);
    node.textContent = "";
    const sr = document.createElement("span");
    sr.className = "sr-only";
    sr.textContent = text;
    const vis = document.createElement("span");
    vis.setAttribute("aria-hidden", "true");
    let prev = "";
    text.split(/(\s+)/).forEach((word) => {
      if (!word) return;
      if (/^\s+$/.test(word)) { vis.appendChild(document.createTextNode(" ")); return; }
      const w = document.createElement("span");
      w.className = "rw";
      for (const ch of word) {
        const s = document.createElement("span");
        s.className = "rl";
        s.textContent = ch;
        prev = styleLetter(s, r, pool, prev);
        w.appendChild(s);
      }
      vis.appendChild(w);
    });
    node.append(sr, vis);

    // Hover reshuffle is purely decorative (the letters are aria-hidden and the
    // sr-only copy above carries the real words). Off for reduced motion.
    const shuffleRng = rng(Date.now() ^ hash(text));
    vis.addEventListener("pointerover", (e) => {
      if (reduced) return;
      const s = e.target.closest && e.target.closest(".rl");
      if (!s || s.dataset.busy) return;
      s.dataset.busy = "1";
      styleLetter(s, shuffleRng, pool, "");
      s.classList.remove("is-pop");
      void s.offsetWidth;
      s.classList.add("is-pop");
      setTimeout(() => { delete s.dataset.busy; }, 260);
    });
  }

  /* ---------------------------------------------------------------
   * 3. Torn paper (clip-path polygons) and section rips
   * ------------------------------------------------------------- */
  function tearPolygon(w, h, sides, amp, r) {
    const pts = [];
    const has = (s) => sides === "all" || sides.indexOf(s) > -1;
    const tooth = () => amp * (0.25 + 0.75 * r()) + (r() < 0.1 ? amp * 0.7 : 0);
    const run = (len) => {
      const out = [0];
      let p = 0;
      const step = Math.max(1.2, (11 / Math.max(len, 60)) * 100);
      while (p < 100) { p += step * (0.45 + r() * 1.1); out.push(Math.min(100, p)); }
      return out;
    };
    if (has("t")) run(w).forEach((x) => pts.push(`${x.toFixed(2)}% ${tooth().toFixed(1)}px`));
    else pts.push("0% 0%", "100% 0%");
    if (has("r")) run(h).forEach((y) => pts.push(`calc(100% - ${tooth().toFixed(1)}px) ${y.toFixed(2)}%`));
    if (has("b")) run(w).reverse().forEach((x) => pts.push(`${x.toFixed(2)}% calc(100% - ${tooth().toFixed(1)}px)`));
    else pts.push("100% 100%", "0% 100%");
    if (has("l")) run(h).reverse().forEach((y) => pts.push(`${tooth().toFixed(1)}px ${y.toFixed(2)}%`));
    return `polygon(${pts.join(",")})`;
  }
  function tearAll() {
    // read every size first, then write, so this never interleaves layout reads with style writes
    const nodes = $$("[data-tear]");
    const sizes = nodes.map((node) => [node.offsetWidth || 300, node.offsetHeight || 300]);
    nodes.forEach((node, i) => {
      const sides = node.dataset.tear || "all";
      const amp = parseFloat(node.dataset.amp || "6");
      const r = rng("tear" + i + sides);
      node.style.clipPath = tearPolygon(sizes[i][0], sizes[i][1], sides, amp, r);
    });
  }
  function drawRips() {
    $$("[data-rip]").forEach((host, i) => {
      const top = host.dataset.rip === "top";
      const r = rng("rip" + i);
      let d = top ? "M0 22 L0 12" : "M0 0 L0 10";
      for (let x = 0; x < 1000;) {
        x = Math.min(1000, x + 6 + r() * 16);
        const y = top ? 2 + r() * 13 + (r() < 0.08 ? 4 : 0) : 7 + r() * 13 - (r() < 0.08 ? 4 : 0);
        d += ` L${f1(x)} ${f1(y)}`;
      }
      d += top ? " L1000 22 Z" : " L1000 0 Z";
      host.innerHTML = `<svg viewBox="0 0 1000 22" preserveAspectRatio="none" focusable="false"><path fill="currentColor" d="${d}"/></svg>`;
    });
  }

  /* ---------------------------------------------------------------
   * 4. Growth rings: background of "What we do"
   * ------------------------------------------------------------- */
  function drawRings() {
    const bg = $("[data-rings]");
    if (bg) {
      const r = rng("growth");
      const ph = [r() * 6, r() * 6, r() * 6];
      let out = "";
      for (let i = 0; i < 16; i++) {
        const rad = 26 + i * 17 + r() * 5;
        out += `<path d="${noisyRing(300, 300, rad, 0.04 + i * 0.002, [ph[0] + i * 0.12, ph[1] - i * 0.08, ph[2] + i * 0.05], 56)}"/>`;
      }
      bg.innerHTML = out;
    }
  }

  /* ---------------------------------------------------------------
   * 5. Nav menu (small screens)
   * ------------------------------------------------------------- */
  function initNav() {
    const btn = $(".nav__toggle"), menu = $("#nav-menu");
    if (!btn || !menu) return;
    const setOpen = (open) => {
      btn.setAttribute("aria-expanded", String(open));
      menu.classList.toggle("is-open", open);
    };
    const isOpen = () => btn.getAttribute("aria-expanded") === "true";
    btn.addEventListener("click", () => setOpen(!isOpen()));
    $$("a", menu).forEach((a) => a.addEventListener("click", () => setOpen(false)));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isOpen()) { setOpen(false); btn.focus(); }
    });
    // tap/click anywhere outside the header closes it too
    document.addEventListener("click", (e) => {
      if (isOpen() && !e.target.closest(".nav")) setOpen(false);
    });
  }

  /* ---------------------------------------------------------------
   * 6. Scroll reveals
   * ------------------------------------------------------------- */
  function initReveals() {
    const els = $$(".reveal");
    if (reduced || !("IntersectionObserver" in window)) { els.forEach((el) => el.classList.add("is-in")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const sibs = $$(".reveal", e.target.parentNode);
        setTimeout(() => e.target.classList.add("is-in"), Math.max(0, sibs.indexOf(e.target)) * 110);
        io.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    els.forEach((el) => io.observe(el));
  }

  /* ---------------------------------------------------------------
   * 7. Enquiry form
   * ------------------------------------------------------------- */
  function initForm() {
    const form = $("#enquiry");
    if (!form) return;
    const sent = $(".sent");
    const status = $(".form__status", form);
    const msgLabel = $("#f-message-label");
    const nameInput = $("#f-name");
    const submitBtn = $('button[type="submit"]', form);
    const honeypot = $("#f-website", form);
    // every field the API / server can send an error for, in focus order
    const FIELDS = { name: "#f-name", email: "#f-email", handle: "#f-handle", company: "#f-company", message: "#f-message" };
    const ORDER = ["type", "name", "email", "handle", "company", "message"];
    let busy = false;

    const val = (key) => { const el = $(FIELDS[key], form); return el ? String(el.value || "").trim() : ""; };
    const checkedType = () => { const r = $('input[name="type"]:checked', form); return r ? r.value : ""; };
    // server messages may contain dashes; keep visible copy dash-free
    const plain = (s) => String(s).replace(/\s*[–—]\s*/g, ", ");
    const wait = (ms) => new Promise((res) => setTimeout(res, ms));

    function setType(type) {
      const radio = $(`input[name="type"][value="${type}"]`, form);
      if (radio) radio.checked = true;
      $$("[data-for]", form).forEach((f) => { f.hidden = f.dataset.for !== type; });
      msgLabel.textContent = msgLabel.dataset[type === "brand" ? "brand" : "creator"];
    }

    function setFieldError(key, msg) {
      const p = $(`[data-error="${key}"]`, form);
      if (p) p.textContent = msg;
      const input = FIELDS[key] && $(FIELDS[key], form);
      if (!input) return;
      const field = input.closest(".field");
      if (field) field.classList.toggle("has-error", !!msg);
      if (msg) input.setAttribute("aria-invalid", "true");
      else input.removeAttribute("aria-invalid");
    }
    function clearErrors() { ORDER.forEach((k) => setFieldError(k, "")); }

    function showErrors(errors) {
      errors = errors || {};
      ORDER.forEach((k) => setFieldError(k, typeof errors[k] === "string" ? errors[k] : ""));
      const first = ORDER.find((k) => errors[k]);
      if (first === "type") {
        const r = $('input[name="type"]', form);
        if (r) r.focus();
      } else if (first) {
        const el = $(FIELDS[first], form);
        if (el && !el.closest("[hidden]")) el.focus();
      }
      if (first) status.textContent = "Nearly there. Check the bits in red.";
      else if (typeof errors.form === "string" && errors.form) status.textContent = plain(errors.form);
      else status.textContent = "Something went wrong. Mind trying again?";
    }

    function setBusy(on) {
      busy = on;
      form.classList.toggle("is-sending", on);
      if (on) { form.setAttribute("aria-busy", "true"); if (submitBtn) submitBtn.setAttribute("aria-disabled", "true"); }
      else { form.removeAttribute("aria-busy"); if (submitBtn) submitBtn.removeAttribute("aria-disabled"); }
    }

    function reset(type) {
      form.reset();
      setBusy(false);
      clearErrors();
      status.textContent = "";
      setType(type || "creator");
      if (sent) sent.hidden = true;
      form.hidden = false;
    }

    $$('input[name="type"]', form).forEach((r) => r.addEventListener("change", () => {
      setType(r.value);
      setFieldError("type", "");
    }));
    $$("a[data-type]").forEach((a) => a.addEventListener("click", () => {
      // reset first (it defaults to creator), then apply the type this link asked for
      if (sent && !sent.hidden) reset(a.dataset.type);
      else setType(a.dataset.type);
      setTimeout(() => nameInput.focus({ preventScroll: true }), reduced ? 0 : 650);
    }));
    setType(checkedType() || "creator");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (busy) return;                        // double-submit guard (click + Enter, fast taps)
      const type = checkedType();
      const payload = {
        site: SITE,
        type,
        name: val("name"),
        email: val("email"),
        message: val("message"),
        website: honeypot ? String(honeypot.value || "") : ""
      };
      // only the optional field that belongs to the chosen type
      if (type === "creator" && val("handle")) payload.handle = val("handle");
      if (type === "brand" && val("company")) payload.company = val("company");

      const api = window.YuzuAPI;
      if (!api || typeof api.submitEnquiry !== "function") {
        status.textContent = "Our form is having a nap. Please try again in a moment.";
        return;
      }

      setBusy(true);
      status.textContent = "Sending...";
      let result;
      try { result = await api.submitEnquiry(payload); }
      catch (_) { result = null; }

      if (!result || !result.ok) {
        setBusy(false);
        showErrors(result && result.errors);
        return;
      }
      clearErrors();
      status.textContent = "";
      await wait(reduced ? 0 : 650);           // let the paper plane fly off first
      $("[data-sent-name]", sent).textContent = payload.name.split(/\s+/)[0] || "friend";
      form.hidden = true;
      setBusy(false);
      sent.hidden = false;
      const stamp = $(".sent__stamp", sent);
      if (stamp) { stamp.style.animation = "none"; void stamp.offsetWidth; stamp.style.animation = ""; }
      $(".sent__title", sent).focus();
    });

    // clear a field's error as soon as it is edited
    Object.keys(FIELDS).forEach((key) => {
      const input = $(FIELDS[key], form);
      if (input) input.addEventListener("input", () => {
        const p = $(`[data-error="${key}"]`, form);
        if (p && p.textContent) setFieldError(key, "");
      });
    });

    const again = $("[data-again]");
    if (again) again.addEventListener("click", () => { reset(); nameInput.focus(); });
  }

  /* ---------------------------------------------------------------
   * 8. Pause the infinite CSS loops (step blobs) while their section
   *    is off-screen
   * ------------------------------------------------------------- */
  function initOffscreenPause() {
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => e.target.classList.toggle("is-offscreen", !e.isIntersecting));
    });
    $$(".how").forEach((s) => io.observe(s));
  }

  /* ---------------------------------------------------------------
   * Boot (each step isolated, so one failure never leaves the
   * .reveal content hidden or the form unwired)
   * ------------------------------------------------------------- */
  function safe(fn) {
    try { fn(); } catch (err) { if (window.console) console.error(err); }
  }
  safe(() => Mark.init());
  safe(() => $$("[data-ransom]").forEach(ransom));
  safe(drawRips);
  safe(drawRings);
  safe(tearAll);
  safe(initNav);
  safe(initReveals);
  safe(initForm);
  safe(initOffscreenPause);

  let lastWidth = window.innerWidth;
  window.addEventListener("resize", debounce(() => {
    if (window.innerWidth === lastWidth) return;
    lastWidth = window.innerWidth;
    tearAll();
  }, 180));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(tearAll);

  const onMotionChange = (e) => {
    reduced = e.matches;
    Mark.restart();
  };
  if (reduceMQ.addEventListener) reduceMQ.addEventListener("change", onMotionChange);
  else if (reduceMQ.addListener) reduceMQ.addListener(onMotionChange);   // older Safari
})();
