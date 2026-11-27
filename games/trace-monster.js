// TRACE THE MONSTER! — a monster shaped like a letter (a fat purple B with
// googly eyes and a toothy grin) creeps up on you. Trace it with your finger
// to make it explode in a goopy mess, eyeballs bouncing away.
//
// Tracing: drag anywhere over the letter. Each stroke has a row of dots that
// light up as the finger passes over them; once every stroke is lit, the
// monster swells and POPS. Stroke order isn't shown or enforced (schools teach
// it differently); a ghost finger slides along one stroke to show what to do.
// Capital or lowercase: a list item written in lowercase is always lowercase,
// otherwise it's a coin flip.
// Out of time: the monster gets fatter and hungrier the whole round, then
// lunges at the screen and CHOMP, it eats you.
// The voice says the letter name at the start. Letter lists only.
// Faster speeds: tighter tracing, and from 1.75× the dotted guide is hidden
// (the fat letter body still shows the shape).
(function () {
  const TEXT = {
    name: { en: "Trace Monster" },
    icon: "👾",
    // Practice mode's "How to play" card: steps (icon + sentence) and tips.
    howTo: { en: {
      steps: [
        ["👾", "A monster shaped like a letter appears, and the voice says the letter."],
        ["☝️", "Put your finger on the monster and trace over the letter."],
        ["✨", "The dots light up as you go. Light up every line to pop the monster! Pop 3 monsters to win."],
      ],
      tips: [
        "Watch the 👆 hand. It shows you where to trace.",
        "You can trace the lines in any order.",
        "Too slow and the monster bites! CHOMP!",
        "When the game speeds up, you have to trace more carefully, and the dots disappear.",
      ],
    } },
    instruction: { en: "TRACE THE\nMONSTER!" },
    monsterLabel: (spoken) => `Letter monster ${spoken}. Trace it with your finger.`,
  };

  const MONSTER_COLORS = ["#9b3dff", "#1fd65f", "#ff2e88", "#ff8a00", "#1e9bff", "#e8173c"];
  const SPACING = 6;       // checkpoint spacing along each stroke (letter box is 100×100)
  const STROKE_DONE = 0.9; // share of a stroke's dots to light before it counts

  // ---------- Letter shapes: shared, in js/core.js (Core.letterShapes) ----------
  const LETTERS = window.Core.letterShapes;

  // Points every SPACING units along a polyline (both ends included).
  function sample(stroke) {
    const out = [stroke[0]];
    let carry = 0;
    for (let i = 1; i < stroke.length; i++) {
      const [x0, y0] = stroke[i - 1], [x1, y1] = stroke[i];
      const len = Math.hypot(x1 - x0, y1 - y0);
      if (!len) continue;
      let d = SPACING - carry;
      while (d <= len) {
        out.push([x0 + ((x1 - x0) * d) / len, y0 + ((y1 - y0) * d) / len]);
        d += SPACING;
      }
      carry = len - (d - SPACING);
    }
    const last = stroke[stroke.length - 1], prev = out[out.length - 1];
    if (Math.hypot(last[0] - prev[0], last[1] - prev[1]) > SPACING / 3) out.push(last);
    return out;
  }

  const CSS = `
  .tl { position:absolute; inset:0; overflow:hidden; }
  .tl-mon { position:absolute; inset:5% 4% 6%; }
  .tl-svg { display:block; width:100%; height:100%; overflow:visible; touch-action:none; cursor:crosshair;
    -webkit-user-select:none; user-select:none; -webkit-touch-callout:none; }
  .tl-fx { position:absolute; inset:0; pointer-events:none; overflow:hidden; z-index:3; }
  .tl-pips { position:absolute; left:8px; top:8px; z-index:4; display:flex; gap:5px; pointer-events:none; }
  .tl-pips span { width:26px; height:26px; border:3px solid #111; border-radius:50%; background:#fff; display:flex; align-items:center; justify-content:center; font-size:14px; line-height:1; }
  .tl-pips span.on { background:#ffd400; } .tl-pips span.on::after { content:"👾"; }
  .tl-svg g, .tl-svg circle { transform-box:fill-box; transform-origin:center; }

  .tl-dot { fill:#fff; stroke:#111; stroke-width:1; transition:transform .12s, fill .12s; }
  .tl-dot.lit { fill:#ffe14d; transform:scale(1.8); }
  .tl.noguide .tl-dot:not(.lit) { opacity:0; }
  .tl-ink { fill:none; stroke:#ffe14d; stroke-width:6; stroke-linecap:round; stroke-linejoin:round; opacity:.8; }
  .tl.over .tl-guide { display:none; }
  .tl-ghost { font-size:22px; pointer-events:none; }

  .tl-eye-ball { fill:#fff; stroke:#111; stroke-width:2.5; }
  .tl-pupil { transition:transform .1s linear; }
  .tl-pupil circle { fill:#111; }
  .tl-pupil circle + circle { fill:#fff; }
  .tl.scared .tl-pupil circle:first-child { transform:scale(.55); }
  .tl.scared .tl-eyes { animation:tl-tremble .09s linear infinite; }
  .tl-svg .tl-gnash { animation:tl-gnash .4s ease-in-out infinite alternate; transform-origin:center top; }
  .tl.hungry .tl-gnash { animation-duration:.18s; }
  .tl.hungry .tl-shake { animation:tl-tremble .1s linear infinite; }

  /* win: goo, googly eyes and a puff */
  .tl-goo { position:absolute; left:0; top:0; border:3px solid #111; border-radius:50%; box-shadow:inset -4px -4px 0 rgba(0,0,0,.2); }
  .tl-geye { position:absolute; left:0; top:0; background:#fff; border:3px solid #111; border-radius:50%; box-sizing:border-box; }
  .tl-geye::after { content:""; position:absolute; left:40%; top:22%; width:44%; height:44%; background:#111; border-radius:50%; }
  .tl-puff { position:absolute; left:0; top:0; width:200px; height:200px; margin:-100px 0 0 -100px; border-radius:50%;
    background:radial-gradient(circle, #fff 0 45%, rgba(255,255,255,.7) 46% 60%, transparent 61%); }

  /* lose: chomp */
  .tl-chomp { position:absolute; inset:0; z-index:4; background:#3a0010; pointer-events:none; }
  .tl-jaw { position:absolute; left:-5%; right:-5%; height:52%; background:#ff5c8a; border:6px solid #111; }
  .tl-jaw::after { content:""; position:absolute; left:0; right:0; height:40%; background:#fff;
    clip-path:polygon(0 0,100% 0,100% 100%,92% 0,84% 100%,76% 0,68% 100%,60% 0,52% 100%,44% 0,36% 100%,28% 0,20% 100%,12% 0,4% 100%,0 0); }
  .tl-jaw.top { top:0; border-top:0; }
  .tl-jaw.top::after { top:100%; }
  .tl-jaw.bot { bottom:0; border-bottom:0; }
  .tl-jaw.bot::after { bottom:100%; transform:scaleY(-1); }

  @keyframes tl-gnash { from { transform:scaleY(1); } to { transform:scaleY(1.4); } }
  @keyframes tl-tremble { 25% { transform:translate(1px,-1px); } 50% { transform:translate(-1px,1px); } 75% { transform:translate(1px,1px); } }
  @media (prefers-reduced-motion: reduce) {
    .tl-gnash, .tl.hungry .tl-shake, .tl.scared .tl-eyes { animation:none !important; }
  }`;

  function injectCss() {
    if (document.getElementById("tl-css")) return;
    const style = document.createElement("style");
    style.id = "tl-css";
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  // A random monster color that stands out from this round's background (--bg).
  function pickColor() {
    const rgb = (hex) => { const n = parseInt(hex.replace("#", ""), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
    const bg = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();
    if (!/^#[0-9a-f]{6}$/i.test(bg)) return MONSTER_COLORS[Math.floor(Math.random() * MONSTER_COLORS.length)];
    const b = rgb(bg);
    const far = MONSTER_COLORS.filter((c) => rgb(c).reduce((s, v, i) => s + (v - b[i]) ** 2, 0) > 150 ** 2);
    const pool = far.length ? far : MONSTER_COLORS;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  const NS = "http://www.w3.org/2000/svg";
  function svgEl(tag, attrs, parent) {
    const el = document.createElementNS(NS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(el);
    return el;
  }
  const f1 = (n) => Math.round(n * 10) / 10;

  registerMicrogame({
    id: "trace-monster",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter"],
    duration: 18000, // three monsters to trace (one was over too quickly: the teacher); the pops between don't count
    input: "drag",
    tutorial: true, // has a ctx.tutorial script

    start(ctx) {
      injectCss();
      const speed = ctx.speed || 1;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const later = ctx.later;
      const { tone, sweep, noise } = ctx.sfx;
      // THREE monsters to trace, one after another (the teacher asked: one was over too quickly).
      const GOAL = 3;
      const picks = [];
      for (const it of ctx.items) {
        if (LETTERS[String(it.text).toUpperCase()] && !picks.some((p) => p.text.toUpperCase() === it.text.toUpperCase())) picks.push(it);
        if (picks.length >= GOAL) break;
      }
      if (!picks.length) throw new Error("no traceable letter in list");
      const wrap = document.createElement("div");
      wrap.className = "tl" + (speed >= 1.75 ? " noguide" : "");
      const fx = document.createElement("div");
      fx.className = "tl-fx";
      const pips = document.createElement("div");
      pips.className = "tl-pips";
      pips.innerHTML = "<span></span>".repeat(picks.length);
      wrap.append(fx, pips);
      ctx.root.appendChild(wrap);
      if (window.DrawHint) window.DrawHint.zigzag(ctx, wrap); // 👆 how to draw
      let cur = null;

      // One monster: built, traced, popped; then the next one comes (a beat between: the clock stops).
      function makeMonster(n) {
      const item = picks[n];
      let done = false;
      wrap.classList.remove("hungry", "scared", "over");
      const lower = item.text === item.text.toLowerCase() || Math.random() < 0.5;
      const letter = lower ? item.text.toLowerCase() : item.text.toUpperCase();
      const spoken = item.say || item.text.toUpperCase();
      const strokes = LETTERS[letter] || LETTERS[item.text.toUpperCase()];
      const color = pickColor();
      // How close the finger must pass a dot (body is ~22–26 wide). Kept under the body's
      // half-width so tracing one stroke doesn't light the far end of it or its neighbours.
      const hitR = speed >= 1.75 ? 10 : 11;
      const bodyW = lower ? 22 : 26;        // lowercase bowls are smaller, so a slimmer body keeps the holes open

      const dots = strokes.map((s, si) => sample(s).map(([x, y]) => ({ x, y, si, lit: false, el: null })));
      const all = dots.flat();
      const strokeLit = strokes.map(() => 0);

      // Bounding box, and a view at least 100×100 around it, so x-height
      // letters (a, o) look the same size as the bowls of b and d.
      const xs = all.map((d) => d.x), ys = all.map((d) => d.y);
      const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
      const mid = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
      const viewW = Math.max(100, maxX - minX), viewH = Math.max(100, maxY - minY);
      const viewBox = [mid.x - viewW / 2 - 24, mid.y - viewH / 2 - 36, viewW + 48, viewH + 60].map(f1).join(" ");

      // Face: eyes on the top of the letter, mouth near the middle.
      // The dots of i and j are left uncovered, so the player can see to trace them.
      const face = all.filter((d) => dots[d.si].length > 2);
      const faceTop = Math.min(...face.map((d) => d.y));
      const tops = face.filter((d) => d.y <= faceTop + 12);
      const left = tops.reduce((a, b) => (b.x < a.x ? b : a));
      const right = tops.reduce((a, b) => (b.x > a.x ? b : a));
      const big = 13, small = 10;
      const sizes = Math.random() < 0.5 ? [big, small] : [small, big];
      const eyes = right.x - left.x > 45
        ? [{ x: left.x, y: left.y - 6, r: sizes[0] }, { x: right.x, y: right.y - 6, r: sizes[1] }]
        : [{ x: (left.x + right.x) / 2 - 12, y: faceTop - 6, r: sizes[0] }, { x: (left.x + right.x) / 2 + 12, y: faceTop - 6, r: sizes[1] }];
      const nearEye = (d) => eyes.some((e) => Math.hypot(d.x - e.x, d.y - e.y) < 24);
      const aim = { x: mid.x, y: minY + (maxY - minY) * 0.58 };
      let mouth = aim, best = Infinity;
      all.forEach((d) => {
        const dist = Math.hypot(d.x - aim.x, d.y - aim.y);
        if (dist < best && !nearEye(d)) { best = dist; mouth = { x: d.x, y: d.y }; }
      });
      if (best > 22) mouth = aim; // O, C, U: grin from inside the hole

      // ---------- DOM ----------
      const mon = document.createElement("div");
      mon.className = "tl-mon";
      wrap.insertBefore(mon, fx);
      if (n) mon.animate([{ transform: "translateX(110%) rotate(20deg)" }, { transform: "none" }], { duration: reduceMotion ? 1 : 380, easing: "cubic-bezier(.2,1.3,.4,1)" }); // it hops in

      const svg = svgEl("svg", { class: "tl-svg", viewBox, role: "img",
        "aria-label": TEXT.monsterLabel(spoken) }, mon);
      const shake = svgEl("g", { class: "tl-shake" }, svg);
      const d = strokes.map((s) => "M" + s.map(([x, y]) => `${f1(x)} ${f1(y)}`).join(" L")).join(" ");
      const lineAttrs = { d, fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round" };
      const outline = svgEl("path", { ...lineAttrs, stroke: "#111", "stroke-width": bodyW + 8 }, shake);
      const body = svgEl("path", { ...lineAttrs, stroke: color, "stroke-width": bodyW }, shake);
      const shine = svgEl("path", { ...lineAttrs, stroke: "rgba(255,255,255,.35)", "stroke-width": 7, transform: "translate(-4 -4)" }, shake);

      const mouthPos = svgEl("g", { transform: `translate(${f1(mouth.x)} ${f1(mouth.y)})` }, shake);
      const mouthGrow = svgEl("g", {}, mouthPos);
      const mouthIn = svgEl("g", { class: "tl-gnash" }, mouthGrow);
      svgEl("path", { d: "M-15 -4 Q0 -8 15 -4 Q12 12 0 13 Q-12 12 -15 -4 Z", fill: "#3a0010", stroke: "#111", "stroke-width": 2.5, "stroke-linejoin": "round" }, mouthIn);
      svgEl("ellipse", { cx: 0, cy: 8, rx: 7, ry: 3.5, fill: "#ff5c8a" }, mouthIn);
      svgEl("path", { d: "M-12 -5 L-9 1 L-6 -5.5 L-3 1 L0 -6 L3 1 L6 -5.5 L9 1 L12 -5 Z", fill: "#fff", stroke: "#111", "stroke-width": 1 }, mouthIn);

      const dotLayer = svgEl("g", { class: "tl-guide" }, svg);
      all.forEach((dt) => { dt.el = svgEl("circle", { class: "tl-dot", cx: f1(dt.x), cy: f1(dt.y), r: 2.6 }, dotLayer); });
      const inkLayer = svgEl("g", { class: "tl-guide" }, svg);

      const eyeLayer = svgEl("g", { class: "tl-eyes" }, svg);
      const pupils = eyes.map((e) => {
        const g = svgEl("g", { transform: `translate(${f1(e.x)} ${f1(e.y)})` }, eyeLayer);
        svgEl("circle", { class: "tl-eye-ball", r: e.r }, g);
        const p = svgEl("g", { class: "tl-pupil" }, g);
        svgEl("circle", { r: f1(e.r * 0.48) }, p);
        svgEl("circle", { cx: f1(-e.r * 0.15), cy: f1(-e.r * 0.18), r: f1(e.r * 0.14) }, p);
        return { eye: e, el: p };
      });
      ctx.say(spoken);

      // ---------- Eyes ----------
      function lookAt(x, y) {
        pupils.forEach(({ eye, el }) => {
          const dx = x - eye.x, dy = y - eye.y, len = Math.hypot(dx, dy) || 1, k = Math.min(1, len / 20) * eye.r * 0.42;
          el.setAttribute("transform", `translate(${f1((dx / len) * k)} ${f1((dy / len) * k)})`);
        });
      }
      let tracking = false;
      (function crazyEyes() { // pupils roll around until the player starts tracing
        if (done || tracking) return;
        pupils.forEach(({ eye, el }) => {
          const a = Math.random() * Math.PI * 2, k = eye.r * 0.4;
          el.setAttribute("transform", `translate(${f1(Math.cos(a) * k)} ${f1(Math.sin(a) * k)})`);
        });
        later(crazyEyes, 280 + Math.random() * 200);
      })();

      // ---------- Ghost finger: shows the first stroke once ----------
      if (n === 0 && speed < 1.5 && !reduceMotion && !ctx.demo) { // (a tutorial has its own finger; only the first monster)
        const path = dots[0];
        const ghost = svgEl("text", { class: "tl-ghost", x: 0, y: 0 }, svg);
        ghost.textContent = "👆";
        const t0 = performance.now(), dur = 1000;
        (function step() {
          const t = (performance.now() - t0) / dur;
          if (done || tracking || t >= 1) { ghost.remove(); return; }
          const p = path[Math.min(path.length - 1, Math.floor(t * path.length))];
          ghost.setAttribute("x", f1(p.x - 7));
          ghost.setAttribute("y", f1(p.y + 18));
          ctx.raf(step);
        })();
      }

      // ---------- Hunger: fatter, wider mouth, then trembling ----------
      (function grow() {
        if (done) return;
        const t = ctx.timeFrac(); // (over the whole round: the later monsters start hungrier)
        const w = bodyW * (1 + 0.46 * t * t);
        body.setAttribute("stroke-width", f1(w));
        outline.setAttribute("stroke-width", f1(w + 8));
        shine.setAttribute("stroke-width", f1(w * 0.27));
        mouthGrow.setAttribute("transform", `scale(${f1(1 + 0.9 * t)})`);
        wrap.classList.toggle("hungry", t > 0.6);
        ctx.raf(grow);
      })();

      // ---------- Tracing ----------
      let last = null, ink = null, inkPts = [], lastBlip = 0;
      const toSvg = (e) => {
        const m = svg.getScreenCTM();
        if (!m) return null;
        const p = svg.createSVGPoint();
        p.x = e.clientX; p.y = e.clientY;
        return p.matrixTransform(m.inverse());
      };

      function touch(x, y) {
        let lit = 0;
        for (const dt of all) {
          if (dt.lit) continue;
          if ((dt.x - x) ** 2 + (dt.y - y) ** 2 < hitR * hitR) {
            dt.lit = true;
            dt.el.classList.add("lit");
            strokeLit[dt.si]++;
            lit++;
          }
        }
        return lit;
      }

      function moveTo(p) {
        let lit = 0;
        if (last) {
          const steps = Math.ceil(Math.hypot(p.x - last.x, p.y - last.y) / 3);
          for (let i = 1; i <= steps; i++) lit += touch(last.x + ((p.x - last.x) * i) / steps, last.y + ((p.y - last.y) * i) / steps);
        } else {
          lit += touch(p.x, p.y);
        }
        last = { x: p.x, y: p.y };
        if (inkPts.length < 400) {
          inkPts.push(`${f1(p.x)},${f1(p.y)}`);
          ink.setAttribute("points", inkPts.join(" "));
        }
        lookAt(p.x, p.y);
        if (!lit) return;

        const progress = all.filter((dt) => dt.lit).length / all.length;
        const now = performance.now();
        if (now - lastBlip > 45) { lastBlip = now; tone(420 + 900 * progress, 0.06, "triangle", 0.08); }
        wrap.classList.toggle("scared", progress > 0.45);
        if (strokeLit.every((n, i) => n >= dots[i].length * STROKE_DONE)) finish();
      }

      function onDown(e) {
        if (done || ctx.ended) return;
        e.preventDefault();
        try { svg.setPointerCapture(e.pointerId); } catch (err) { /* not capturable: still fine */ }
        tracking = true;
        last = null;
        inkPts = [];
        ink = svgEl("polyline", { class: "tl-ink" }, inkLayer);
        const p = toSvg(e);
        if (p) moveTo(p);
      }
      function onMove(e) {
        if (!ink || done || ctx.ended) return;
        e.preventDefault();
        const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
        for (const ev of evs.length ? evs : [e]) {
          const p = toSvg(ev);
          if (p) moveTo(p);
          if (done) break;
        }
      }
      function onUp() { ink = null; last = null; }
      svg.addEventListener("pointerdown", onDown);
      svg.addEventListener("pointermove", onMove);
      svg.addEventListener("pointerup", onUp);
      svg.addEventListener("pointercancel", onUp);

      // ---------- Win: swell, then POP ----------
      function finish() {
        if (done) return;
        done = true;
        ink = null;
        pips.children[n].classList.add("on");
        if (n >= picks.length - 1) ctx.win();
        else {
          // The beat: the clock stops while it pops, then the next monster hops in.
          ctx.pauseTimer(1400);
          later(() => { if (ctx.ended) return; mon.remove(); cleanup(); cur = makeMonster(n + 1); }, 1300);
        }
        wrap.classList.remove("hungry", "scared");
        wrap.classList.add("over");
        lookAt(50, -200); // eyes roll up in panic
        swellSound();
        if (reduceMotion) {
          mon.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: "forwards" });
          later(() => ctx.say(spoken), 300);
          return;
        }
        mon.animate(
          [{ transform: "scale(1)" }, { transform: "scale(1.12, .9)" }, { transform: "scale(.95, 1.15) rotate(-4deg)" }, { transform: "scale(1.22) rotate(4deg)" }],
          { duration: 260, easing: "ease-in", fill: "forwards" });
        later(pop, 260);
      }

      function pop() {
        const box = wrap.getBoundingClientRect();
        const m = svg.getScreenCTM();
        const local = (x, y) => {
          const p = svg.createSVGPoint();
          p.x = x; p.y = y;
          const s = p.matrixTransform(m);
          return { x: s.x - box.left, y: s.y - box.top };
        };
        const unit = m.a; // px per letter unit (before the swell)
        const c = local(mid.x, mid.y);
        mon.style.visibility = "hidden";
        popSound();

        const puff = document.createElement("div");
        puff.className = "tl-puff";
        puff.style.left = `${c.x}px`;
        puff.style.top = `${c.y}px`;
        fx.appendChild(puff);
        puff.animate([{ transform: "scale(.2)", opacity: 1 }, { transform: "scale(1.8)", opacity: 0 }],
          { duration: 450, easing: "ease-out", fill: "forwards" });

        // Goo: chunks of the body fly out from the middle and fall.
        const step = Math.max(1, Math.floor(all.length / 18));
        all.filter((_, i) => i % step === 0).forEach((dt) => {
          const p = local(dt.x, dt.y);
          const size = Math.round(unit * (14 + Math.random() * 16));
          const g = document.createElement("div");
          g.className = "tl-goo";
          g.style.cssText += `width:${size}px;height:${size}px;background:${color};margin:${-size / 2}px 0 0 ${-size / 2}px;`;
          fx.appendChild(g);
          const ang = Math.atan2(p.y - c.y, p.x - c.x) + (Math.random() - 0.5) * 0.6;
          const dist = box.width * (0.25 + Math.random() * 0.35);
          const dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist - box.height * 0.15;
          const fall = box.height - p.y + size + 40;
          const spin = (Math.random() - 0.5) * 720;
          g.animate(
            [{ transform: `translate(${p.x}px,${p.y}px) scale(.6)` },
             { transform: `translate(${p.x + dx}px,${p.y + dy}px) scale(1.1, .8) rotate(${spin / 2}deg)`, offset: 0.35 },
             { transform: `translate(${p.x + dx * 1.3}px,${p.y + fall}px) scale(.8, 1.2) rotate(${spin}deg)` }],
            { duration: 1000 + Math.random() * 400, easing: "cubic-bezier(.25,.6,.5,1)", fill: "forwards" });
        });

        // Googly eyes: shoot up, fall, and bounce along the floor.
        eyes.forEach((e, i) => {
          const p = local(e.x, e.y);
          const size = Math.round(unit * e.r * 2.4);
          const el = document.createElement("div");
          el.className = "tl-geye";
          el.style.cssText += `width:${size}px;height:${size}px;margin:${-size / 2}px 0 0 ${-size / 2}px;`;
          fx.appendChild(el);
          const floor = box.height - size / 2 - 8;
          const up = Math.max(size, p.y * 0.8);
          const dir = i === 0 ? -1 : 1;
          const xs = [0, 0.25, 0.5, 0.65, 0.8, 0.9, 1].map((k) => p.x + dir * k * box.width * 0.32);
          const ys = [p.y, p.y - up, floor, floor - box.height * 0.18, floor, floor - box.height * 0.06, floor];
          el.animate(xs.map((x, k) => ({
            transform: `translate(${x}px,${ys[k]}px) rotate(${dir * k * 160}deg) scale(${k === 2 || k === 4 ? "1.2,.8" : "1"})`,
            offset: [0, 0.22, 0.45, 0.6, 0.74, 0.86, 1][k],
          })), { duration: 1400, easing: "ease-in-out", fill: "forwards" });
          [0.45, 0.74].forEach((at, k) => later(() => boing(k), 1400 * at));
        });

        ctx.confetti(fx, c.x, c.y, { count: 40 });
        later(() => ctx.say(spoken), 350);
      }

      // ---------- Lose: lunge and CHOMP ----------
      function timeout() {
        if (done) return;
        done = true;
        ink = null;
        wrap.classList.remove("scared");
        wrap.classList.add("hungry", "over");
        mouthGrow.setAttribute("transform", "scale(2.4)");
        lookAt(50, 400);
        roarSound();
        const chomp = () => {
          const ov = document.createElement("div");
          ov.className = "tl-chomp";
          ov.innerHTML = `<div class="tl-jaw top"></div><div class="tl-jaw bot"></div>`;
          fx.appendChild(ov);
          crunchSound();
          if (reduceMotion) return;
          const [top, bot] = ov.children;
          const opts = { duration: 240, easing: "cubic-bezier(.6,0,1,1)", fill: "both" };
          top.animate([{ transform: "translateY(-110%)" }, { transform: "translateY(0)" }], opts);
          bot.animate([{ transform: "translateY(110%)" }, { transform: "translateY(0)" }], opts);
          ov.animate([{ transform: "none" }, { transform: "translate(-8px,6px)" }, { transform: "translate(6px,-4px)" }, { transform: "none" }],
            { duration: 220, delay: 240 });
        };
        if (reduceMotion) { later(chomp, 300); return; }

        // Lunge: rear back, then zoom in on the mouth until it fills the screen.
        const box = mon.getBoundingClientRect();
        const m = svg.getScreenCTM();
        let origin = "50% 50%";
        if (m) {
          const p = svg.createSVGPoint();
          p.x = mouth.x; p.y = mouth.y;
          const s = p.matrixTransform(m);
          origin = `${s.x - box.left}px ${s.y - box.top}px`;
        }
        mon.style.transformOrigin = origin;
        mon.animate(
          [{ transform: "scale(1)" }, { transform: "scale(.85) rotate(-3deg)", offset: 0.35 }, { transform: "scale(9)" }],
          { duration: 650, easing: "cubic-bezier(.6,0,.9,.6)", fill: "forwards" });
        later(chomp, 560);
      }

      // ---------- Sound effects ----------
      function swellSound() { sweep(200, 700, 0.26, "sine", 0.18); tone(300, 0.25, "triangle", 0.06); }
      function popSound() {
        noise(0.12, "highpass", 4000, 800, 0.5);
        noise(0.35, "lowpass", 1400, 120, 0.45, 0.03); // splat
        sweep(900, 120, 0.25, "square", 0.08);
      }
      function boing(k) { sweep(180 + k * 60, 620 + k * 120, 0.18, "sine", 0.2); sweep(620, 300, 0.12, "sine", 0.1, 0.18); }
      function roarSound() { sweep(260, 70, 0.6, "sawtooth", 0.14); noise(0.6, "lowpass", 900, 150, 0.3); }
      function crunchSound() {
        for (let i = 0; i < 3; i++) noise(0.08, "bandpass", 1800, 600, 0.45, i * 0.09);
        tone(90, 0.2, "square", 0.15);
      }


      const at = (dt) => () => { // a letter-box point → px in ctx.root (tutorial)
        const m = svg.getScreenCTM(), g = ctx.root.getBoundingClientRect();
        const p = svg.createSVGPoint(); p.x = dt.x; p.y = dt.y;
        const q = p.matrixTransform(m);
        return { x: q.x - g.left, y: q.y - g.top };
      };
      function cleanup() {
        svg.removeEventListener("pointerdown", onDown);
        svg.removeEventListener("pointermove", onMove);
        svg.removeEventListener("pointerup", onUp);
        svg.removeEventListener("pointercancel", onUp);
      }
      return { n, svg, dots, at, timeout, isDone: () => done, end: () => { done = true; cleanup(); } };
      } // makeMonster

      cur = makeMonster(0);
      ctx.onTimeout(() => { if (cur) cur.timeout(); });

      // Tutorial: point at the monster, then trace each stroke through its dots; three times.
      ctx.tutorial(picks, async (f) => {
        for (let k = 0; k < picks.length; k++) {
          if (!(await f.until(() => cur && cur.n === k && !cur.isDone(), 3000))) break;
          const m = cur;
          await f.point(m.svg, k ? 500 : 900);
          for (const stroke of m.dots) {
            if (m.isDone()) break;
            await f.path(stroke.map(m.at), Math.max(30, 900 / stroke.length));
          }
          await f.until(() => m.isDone(), 1500);
        }
      });

      return function cleanupAll() { if (cur) cur.end(); };
    },
  });
})();
