// PUMPKIN CARVER — a tracing game (the teacher's idea: "more uses of tracing"; ABC only: it's handwriting practice).
// A big pumpkin whose face is three dotted letters (the teacher: "like we are carving 2 eyes and a nose"): a left eye,
// a right eye and a nose, each a different letter (capital or lowercase; the shapes are shared with Trace Monster:
// `Core.letterShapes`), and a ready-carved grin. Carve along every stroke with the spoon: the dots light up as you go,
// a finished stroke glows, a finished letter lights up and is said. All three: the candle lights inside and the whole
// face glows (SPOOKY!). (No wrong answers: only the clock.)
(function () {
  const TEXT = {
    name: { en: "Pumpkin Carver" },
    icon: "🎃",
    howTo: { en: {
      steps: [
        ["🎃", "The pumpkin's eyes and nose are dotted letters."],
        ["🥄", "Carve them: drag along every line until all the dots light up."],
        ["🕯️", "Carve both eyes and the nose and the pumpkin glows!"],
      ],
      tips: ["Start anywhere: every line needs carving.", "Tap a letter to hear it.", "When the game speeds up, you have to stay closer to the dots."],
    } },
    instruction: { en: "CARVE THE\nLETTER!" },
    spooky: ["SPOOKY!", "GLOWING!", "BOO!"],
    win: "HAPPY HALLOWEEN!",
  };
  const GOAL = 3, SPACING = 7, STROKE_DONE = 0.88;

  const CSS = `
  .pmk { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:6px; padding-bottom:6px; }
  .pmk-pips { flex:none; display:flex; gap:6px; min-height:30px; align-items:center; }
  .pmk-pip { width:26px; height:26px; border:3px solid #111; border-radius:50%; background:#fff; display:flex; align-items:center; justify-content:center; font-size:15px; line-height:1; }
  .pmk-pip.on { background:#ff8a1f; } .pmk-pip.on::after { content:"🎃"; }
  .pmk-night { position:relative; flex:1; min-height:0; width:100%; max-width:640px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111; touch-action:none;
    background:radial-gradient(circle at 85% 15%, #fff6c9 0 5%, transparent 5.5%), radial-gradient(circle, #fff 0 1px, transparent 2px) 0 0 / 50px 44px, linear-gradient(180deg, #1b1446, #3a2a6e 70%, #2a5a2a 70%); }
  /* The pumpkin (--kz): orange ribs, a stalk, a carved face (dark until it's lit) */
  .pmk-pump { position:absolute; left:50%; top:52%; width:var(--kz); height:calc(var(--kz) * .86); transform:translate(-50%, -50%); }
  .pmk-pump.roll { animation:pmk-roll .6s cubic-bezier(.2,1.4,.4,1); }
  .pmk-body { position:absolute; inset:0; border:5px solid #111; border-radius:46% 46% 42% 42%;
    background:radial-gradient(ellipse 22% 50% at 50% 50%, #ff9a2e 0 98%, transparent 100%), radial-gradient(ellipse 30% 48% at 28% 52%, #ff8a1f 0 98%, transparent 100%),
      radial-gradient(ellipse 30% 48% at 72% 52%, #ff8a1f 0 98%, transparent 100%), #f07a10; }
  .pmk-stalk { position:absolute; left:46%; top:-10%; width:9%; height:14%; background:#4f7a2a; border:4px solid #111; border-radius:4px 10px 2px 2px; transform:rotate(8deg); }
  .pmk-face { position:absolute; inset:0; }
  .pmk-face i { position:absolute; background:#3a1a05; border:3px solid #111; }
  .pmk-face .e1, .pmk-face .e2 { display:none; }   /* (the letters are the eyes now) */
  .pmk-face .e1 { left:24%; top:22%; width:13%; height:11%; clip-path:polygon(50% 0, 100% 100%, 0 100%); }
  .pmk-face .e2 { right:24%; top:22%; width:13%; height:11%; clip-path:polygon(50% 0, 100% 100%, 0 100%); }
  .pmk-face .m { left:30%; right:30%; bottom:5%; height:9%; clip-path:polygon(0 0, 15% 40%, 30% 0, 45% 40%, 60% 0, 75% 40%, 100% 0, 85% 100%, 15% 100%); }
  .pmk-pump.lit .pmk-face i { background:#ffe066; box-shadow:0 0 18px 6px #ffb000; }
  .pmk-pump.lit .pmk-body { box-shadow:0 0 50px 14px rgba(255,170,40,.7); }
  /* (no touches on the drawing: it's redrawn as you carve, and a touch that started on a dot that got redrawn would
     lose all its moves; the night sky underneath gets them instead) */
  .pmk-svg { position:absolute; inset:0; width:100%; height:100%; overflow:visible; z-index:2; pointer-events:none; }
  .pmk-pump > * { pointer-events:none; }
  .pmk-svg .guide { fill:none; stroke:rgba(58,26,5,.35); stroke-width:3; stroke-linecap:round; stroke-linejoin:round; stroke-dasharray:1 5; }
  .pmk-svg .dot { fill:#3a1a05; }
  .pmk-svg .dot.lit { fill:#ffe066; }
  .pmk-svg .carved.whole { stroke:#fff6b0; stroke-width:9; }
  .pmk-svg .carved { fill:none; stroke:#ffe066; stroke-width:7; stroke-linecap:round; stroke-linejoin:round; filter:drop-shadow(0 0 4px #ffb000); }
  .pmk-tool { position:absolute; left:0; top:0; z-index:6; font-size:2.2rem; line-height:1; pointer-events:none; opacity:0; }
  .pmk-tool.on { opacity:1; }
  .pmk-fx { position:absolute; inset:0; pointer-events:none; z-index:8; overflow:visible; }
  .pmk-word { position:absolute; transform:translate(-50%, -50%) rotate(-8deg); font-size:2rem; color:#ffb000; -webkit-text-stroke:2px #111; paint-order:stroke fill;
    text-shadow:0 4px 0 #111; white-space:nowrap; animation:pmk-word 1s ease-out forwards; }
  @keyframes pmk-roll { from { translate:-140% 0; rotate:-90deg; } }
  @keyframes pmk-word { from { opacity:1; scale:.5; } 25% { scale:1.15; } 75% { opacity:1; } to { opacity:0; translate:0 -40px; } }
  @media (prefers-reduced-motion: reduce) { .pmk-pump.roll, .pmk-word { animation:none !important; } }
  `;
  function injectCss() { if (document.getElementById("pmk-css")) return; const s = document.createElement("style"); s.id = "pmk-css"; s.textContent = CSS; document.head.appendChild(s); }

  registerMicrogame({
    id: "pumpkin-carver",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter"],
    duration: 26000,
    input: "drag",
    tutorial: true,

    start(ctx) {
      injectCss();
      const speed = ctx.speed || 1;
      const { tone, noise, sweep } = ctx.sfx;
      const LET = window.Core.letterShapes;
      const TOL = speed >= 1.75 ? 10 : 13;   // how close (in letter units: the box is 100) the finger must pass
      // Three letters: the left eye, the right eye and the nose. A list item in lowercase stays lowercase, else a coin flip.
      const picks = [];
      for (const it of ctx.items) {
        if (picks.length >= GOAL) break;
        const lower = it.text === it.text.toLowerCase() && it.text !== it.text.toUpperCase() ? true : Math.random() < 0.5;
        const key = lower ? it.text.toLowerCase() : it.text.toUpperCase();
        if (LET[key] && !picks.some((p) => p.key.toUpperCase() === key.toUpperCase())) picks.push({ it, key, lower });
      }
      for (const k of ["O", "X", "V"]) if (picks.length < GOAL && !picks.some((p) => p.key.toUpperCase() === k)) picks.push({ it: { text: k }, key: k, lower: false });
      const sayOf = (p) => p.it.say || p.it.text.toUpperCase();
      // Where each goes on the face (fractions of the pumpkin's width and height), and how big its box is.
      const SLOTS = [{ cx: 0.29, cy: 0.33, w: 0.3, h: 0.32 }, { cx: 0.71, cy: 0.33, w: 0.3, h: 0.32 }, { cx: 0.5, cy: 0.66, w: 0.26, h: 0.26 }];

      const wrap = document.createElement("div");
      wrap.className = "pmk";
      wrap.innerHTML = `<div class="pmk-pips">${'<span class="pmk-pip"></span>'.repeat(GOAL)}</div>`;
      const night = document.createElement("div");
      night.className = "pmk-night";
      const pump = document.createElement("div");
      pump.className = "pmk-pump roll";
      pump.innerHTML = '<div class="pmk-stalk"></div><div class="pmk-body"></div><div class="pmk-face"><i class="m"></i></div>';
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("class", "pmk-svg");
      pump.appendChild(svg);
      const tool = document.createElement("div");
      tool.className = "pmk-tool"; tool.textContent = "🥄";
      const fx = document.createElement("div");
      fx.className = "pmk-fx";
      night.append(pump, tool, fx);
      wrap.appendChild(night);
      ctx.root.appendChild(wrap);
      const pips = wrap.querySelector(".pmk-pips").children;

      function sample(stroke) {
        const out = [stroke[0]];
        let carry = 0;
        for (let i = 1; i < stroke.length; i++) {
          const [x0, y0] = stroke[i - 1], [x1, y1] = stroke[i], len = Math.hypot(x1 - x0, y1 - y0);
          if (!len) continue;
          let d = SPACING - carry;
          while (d <= len) { out.push([x0 + (x1 - x0) * d / len, y0 + (y1 - y0) * d / len]); d += SPACING; }
          carry = len - (d - SPACING);
        }
        out.push(stroke[stroke.length - 1]);
        return out;
      }
      const slots = picks.map((p, i) => ({ p, at: SLOTS[i], box: { x: 0, y: 0, s: 1 }, done: false,
        strokes: LET[p.key].map((st) => ({ pts: st, dots: sample(st).map((q) => ({ p: q, lit: false })), done: false })) }));

      // ---------- Layout: each letter fitted (by its own outline) into its spot on the face ----------
      let W = 0, H = 0, kz = 300;
      function layout() {
        W = night.clientWidth; H = night.clientHeight;
        kz = Math.max(220, Math.min(W * 0.86, H * 0.94 / 0.86, 500));
        night.style.setProperty("--kz", `${kz}px`);
        const h = kz * 0.86;
        slots.forEach((sl) => {
          const all = LET[sl.p.key].flat();
          const x0 = Math.min(...all.map((q) => q[0])), x1 = Math.max(...all.map((q) => q[0]));
          const y0 = Math.min(...all.map((q) => q[1])), y1 = Math.max(...all.map((q) => q[1]));
          const s = Math.min((kz * sl.at.w) / Math.max(30, x1 - x0), (h * sl.at.h) / Math.max(30, y1 - y0));
          sl.box = { x: kz * sl.at.cx - ((x0 + x1) / 2) * s, y: h * sl.at.cy - ((y0 + y1) / 2) * s, s };
        });
        svg.setAttribute("viewBox", `0 0 ${kz} ${h}`);
        draw();
      }
      const px = (sl, [x, y]) => [sl.box.x + x * sl.box.s, sl.box.y + y * sl.box.s];
      function draw() {
        let html = "";
        slots.forEach((sl) => sl.strokes.forEach((st) => {
          const d = st.pts.map((q, i) => `${i ? "L" : "M"}${px(sl, q).map((v) => v.toFixed(1)).join(" ")}`).join(" ");
          html += `<path class="${st.done ? "carved" + (sl.done ? " whole" : "") : "guide"}" d="${d}"/>`;
          if (!st.done) st.dots.forEach((o) => { const [x, y] = px(sl, o.p); html += `<circle class="dot${o.lit ? " lit" : ""}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${Math.max(3, sl.box.s * 3.4).toFixed(1)}"/>`; });
        }));
        svg.innerHTML = html;
      }

      // ---------- Carving ----------
      let done = false, busy = true, carved = 0, last = null, lastSnd = 0;
      const local = (e) => { const r = pump.getBoundingClientRect(), nr = night.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, nx: e.clientX - nr.left, ny: e.clientY - nr.top }; };
      night.addEventListener("pointerdown", (e) => {
        e.preventDefault(); last = local(e); tool.classList.add("on"); moveTool(last); carveAt(last);
        // a tap near a letter that isn't started yet says it
        const sl = slots.find((x) => !x.done && Math.hypot(last.x - kz * x.at.cx, last.y - kz * 0.86 * x.at.cy) < kz * 0.15);
        if (sl && !done && sl.strokes.every((st) => !st.dots.some((o) => o.lit))) ctx.say(sayOf(sl.p));
      });
      night.addEventListener("pointermove", (e) => { if (!last) return; const p = local(e); moveTool(p); carveSeg(last, p); last = p; });
      const up = () => { last = null; tool.classList.remove("on"); };
      night.addEventListener("pointerup", up);
      night.addEventListener("pointercancel", up);
      function moveTool(p) { tool.style.transform = `translate(${p.nx - 10}px, ${p.ny - 30}px) rotate(-30deg)`; }
      function carveSeg(a, b) { const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 5)); for (let k = 1; k <= n; k++) carveAt({ x: a.x + (b.x - a.x) * k / n, y: a.y + (b.y - a.y) * k / n }); }
      function carveAt(p) {
        if (done || busy || ctx.ended) return;
        let any = false;
        for (const sl of slots) {
          if (sl.done) continue;
          const lx = (p.x - sl.box.x) / sl.box.s, ly = (p.y - sl.box.y) / sl.box.s;   // (back into letter units)
          for (const st of sl.strokes) {
            if (st.done) continue;
            for (const o of st.dots) if (!o.lit && Math.hypot(o.p[0] - lx, o.p[1] - ly) < TOL) { o.lit = true; any = true; }
            if (st.dots.filter((o) => o.lit).length >= st.dots.length * STROKE_DONE) { st.done = true; tone(660 + sl.strokes.filter((x) => x.done).length * 120, 0.08, "triangle", 0.08); }
          }
          if (sl.strokes.every((st) => st.done)) letterDone(sl);
        }
        if (!any) return;
        const now = performance.now();
        if (now - lastSnd > 80) { lastSnd = now; noise(0.05, "bandpass", 1800, 900, 0.15); }   // scrape scrape
        draw();
      }
      function letterDone(sl) {
        sl.done = true;
        pips[carved].classList.add("on");
        carved++;
        [523, 659, 784].forEach((f, k) => tone(f, 0.08, "triangle", 0.08, k * 0.06));
        ctx.say(sayOf(sl.p));
        draw();
        if (carved >= slots.length) glow();
      }
      function glow() {
        busy = true; done = true;
        up();
        pump.classList.add("lit");
        sweep(200, 600, 0.5, "sine", 0.08);
        word(TEXT.spooky[0], W / 2, H * 0.12);
        ctx.win();
        ctx.later(() => { word(TEXT.win, W / 2, H * 0.12); ctx.confetti(fx, W / 2, H * 0.4, { count: 90 }); }, 900);
      }
      function word(text, x, y) {
        const w = document.createElement("div");
        w.className = "pmk-word"; w.textContent = text;
        w.style.left = `${Math.max(110, Math.min(W - 110, x))}px`; w.style.top = `${Math.max(28, y)}px`;
        fx.appendChild(w);
        ctx.later(() => w.remove(), 1000);
      }

      ctx.onTimeout(() => { done = true; up(); slots.forEach((sl) => { sl.done = true; sl.strokes.forEach((st) => (st.done = true)); }); draw(); pump.classList.add("lit"); });

      layout();
      const ro = new ResizeObserver(layout);
      ro.observe(night);
      ctx.say(slots.map((sl) => sayOf(sl.p)).join(", "));
      ctx.later(() => { busy = false; }, 600);

      // Tutorial: trace every stroke of each letter in turn (the eyes, then the nose).
      ctx.tutorial(picks.map((p) => p.it), async (f) => {
        await f.until(() => !busy, 3000);
        for (const sl of slots) {
          for (const st of sl.strokes) {
            if (done || st.done) continue;
            const pts = sample(st.pts).filter((_, i, a) => i % 4 === 0 || i === a.length - 1).map((q) => () => {
              const rr = ctx.root.getBoundingClientRect(), pr = pump.getBoundingClientRect(), [x, y] = px(sl, q);
              return { x: pr.left - rr.left + x, y: pr.top - rr.top + y };
            });
            await f.path(pts, 50);
          }
        }
        await f.until(() => done, 2000);
      });
      return () => { done = true; ro.disconnect(); };
    },
  });
})();
