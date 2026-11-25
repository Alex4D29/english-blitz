// PUMPKIN CARVER — a tracing game (the teacher's idea: "more uses of tracing"; ABC only: it's handwriting practice).
// A big pumpkin with a jack-o'-lantern face shows a dotted letter (capital or lowercase; the shapes are shared with
// Trace Monster: `Core.letterShapes`). Carve along every stroke with the spoon: the dots light up as you go, and a
// finished stroke glows. Every stroke done: the candle lights inside, the letter and face glow (SPOOKY!), the voice
// says the letter, and the next pumpkin rolls in. Carve 2 pumpkins to win. (No wrong answers: only the clock.)
(function () {
  const TEXT = {
    name: { en: "Pumpkin Carver" },
    icon: "🎃",
    howTo: { en: {
      steps: [
        ["🎃", "The pumpkin shows a dotted letter."],
        ["🥄", "Carve it: drag along every line until all the dots light up."],
        ["🕯️", "It glows! Carve 2 pumpkins to win."],
      ],
      tips: ["Start anywhere: every line needs carving.", "Tap the pumpkin to hear the letter.", "When the game speeds up, you have to stay closer to the dots."],
    } },
    instruction: { en: "CARVE THE\nLETTER!" },
    spooky: ["SPOOKY!", "GLOWING!", "BOO!"],
    win: "HAPPY HALLOWEEN!",
  };
  const GOAL = 2, SPACING = 7, STROKE_DONE = 0.88;

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
  .pmk-face .e1 { left:24%; top:22%; width:13%; height:11%; clip-path:polygon(50% 0, 100% 100%, 0 100%); }
  .pmk-face .e2 { right:24%; top:22%; width:13%; height:11%; clip-path:polygon(50% 0, 100% 100%, 0 100%); }
  .pmk-face .m { left:30%; right:30%; bottom:12%; height:9%; clip-path:polygon(0 0, 15% 40%, 30% 0, 45% 40%, 60% 0, 75% 40%, 100% 0, 85% 100%, 15% 100%); }
  .pmk-pump.lit .pmk-face i { background:#ffe066; box-shadow:0 0 18px 6px #ffb000; }
  .pmk-pump.lit .pmk-body { box-shadow:0 0 50px 14px rgba(255,170,40,.7); }
  /* (no touches on the drawing: it's redrawn as you carve, and a touch that started on a dot that got redrawn would
     lose all its moves; the night sky underneath gets them instead) */
  .pmk-svg { position:absolute; inset:0; width:100%; height:100%; overflow:visible; z-index:2; pointer-events:none; }
  .pmk-pump > * { pointer-events:none; }
  .pmk-svg .guide { fill:none; stroke:rgba(58,26,5,.35); stroke-width:3; stroke-linecap:round; stroke-linejoin:round; stroke-dasharray:1 5; }
  .pmk-svg .dot { fill:#3a1a05; }
  .pmk-svg .dot.lit { fill:#ffe066; }
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
    duration: 22000,
    input: "drag",
    tutorial: true,

    start(ctx) {
      injectCss();
      const speed = ctx.speed || 1;
      const { tone, noise, sweep } = ctx.sfx;
      const LET = window.Core.letterShapes;
      const TOL = speed >= 1.75 ? 10 : 13;   // how close (in letter units: the box is 100) the finger must pass
      // Two letters to carve; a list item in lowercase stays lowercase, else a coin flip (like Trace Monster).
      const picks = [], want = ctx.demo ? 1 : GOAL;   // (the tutorial carves one pumpkin: enough to show how, inside its 15 s)
      for (const it of ctx.items) {
        if (picks.length >= want) break;
        const lower = it.text === it.text.toLowerCase() && it.text !== it.text.toUpperCase() ? true : Math.random() < 0.5;
        const key = lower ? it.text.toLowerCase() : it.text.toUpperCase();
        if (LET[key] && !picks.some((p) => p.key.toUpperCase() === key.toUpperCase())) picks.push({ it, key, lower });
      }
      if (!picks.length) picks.push({ it: ctx.items[0], key: "O", lower: false });
      const sayOf = (p) => p.it.say || p.it.text.toUpperCase();

      const wrap = document.createElement("div");
      wrap.className = "pmk";
      wrap.innerHTML = `<div class="pmk-pips">${'<span class="pmk-pip"></span>'.repeat(picks.length)}</div>`;
      const night = document.createElement("div");
      night.className = "pmk-night";
      const pump = document.createElement("div");
      pump.className = "pmk-pump";
      pump.innerHTML = '<div class="pmk-stalk"></div><div class="pmk-body"></div><div class="pmk-face"><i class="e1"></i><i class="e2"></i><i class="m"></i></div>';
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

      // ---------- Layout: the letter box sits in the middle of the pumpkin ----------
      let W = 0, H = 0, kz = 300, box = { x: 0, y: 0, s: 1 };
      function layout() {
        W = night.clientWidth; H = night.clientHeight;
        kz = Math.max(200, Math.min(W * 0.8, H * 0.9 / 0.86, 460));
        night.style.setProperty("--kz", `${kz}px`);
        // Fit the letter's own outline into the middle of the pumpkin (between the eyes and the grin), so short
        // lowercase letters are as big as capitals.
        const h = kz * 0.86;
        let x0 = 0, y0 = 0, x1 = 100, y1 = 100;
        if (cur) {
          const all = LET[cur.key].flat();
          x0 = Math.min(...all.map((p) => p[0])); x1 = Math.max(...all.map((p) => p[0]));
          y0 = Math.min(...all.map((p) => p[1])); y1 = Math.max(...all.map((p) => p[1]));
        }
        const s = Math.min((kz * 0.42) / Math.max(30, x1 - x0), (h * 0.42) / Math.max(30, y1 - y0));   // letter units → px
        box = { x: kz / 2 - ((x0 + x1) / 2) * s, y: h * 0.56 - ((y0 + y1) / 2) * s, s };
        svg.setAttribute("viewBox", `0 0 ${kz} ${h}`);
        if (cur) draw();
      }

      // ---------- A pumpkin to carve ----------
      let cur = null, idx = 0, strokes = [], done = false, busy = true, carved = 0;
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
      function load() {
        cur = picks[idx];
        strokes = LET[cur.key].map((s) => ({ pts: s, dots: sample(s).map((p) => ({ p, lit: false })), done: false }));
        pump.classList.remove("lit", "roll"); void pump.offsetWidth; pump.classList.add("roll");
        layout();
        ctx.say(sayOf(cur));
        ctx.later(() => { busy = false; }, 500);
      }
      const px = ([x, y]) => [box.x + x * box.s, box.y + y * box.s];
      function draw() {
        let html = "";
        strokes.forEach((s) => {
          const d = s.pts.map((p, i) => `${i ? "L" : "M"}${px(p).map((v) => v.toFixed(1)).join(" ")}`).join(" ");
          html += `<path class="${s.done ? "carved" : "guide"}" d="${d}"/>`;
          if (!s.done) s.dots.forEach((o) => { const [x, y] = px(o.p); html += `<circle class="dot${o.lit ? " lit" : ""}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${Math.max(3, box.s * 3.2).toFixed(1)}"/>`; });
        });
        svg.innerHTML = html;
      }

      // ---------- Carving ----------
      let last = null, lastSnd = 0;
      const local = (e) => { const r = pump.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, nx: e.clientX - night.getBoundingClientRect().left, ny: e.clientY - night.getBoundingClientRect().top }; };
      night.addEventListener("pointerdown", (e) => { e.preventDefault(); last = local(e); tool.classList.add("on"); moveTool(last); carveAt(last); if (cur && !done && e.target.closest(".pmk-pump") && strokes.every((s) => !s.dots.some((o) => o.lit))) ctx.say(sayOf(cur)); });
      night.addEventListener("pointermove", (e) => { if (!last) return; const p = local(e); moveTool(p); carveSeg(last, p); last = p; });
      const up = () => { last = null; tool.classList.remove("on"); };
      night.addEventListener("pointerup", up);
      night.addEventListener("pointercancel", up);
      function moveTool(p) { tool.style.transform = `translate(${p.nx - 10}px, ${p.ny - 30}px) rotate(-30deg)`; }
      function carveSeg(a, b) { const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 6)); for (let k = 1; k <= n; k++) carveAt({ x: a.x + (b.x - a.x) * k / n, y: a.y + (b.y - a.y) * k / n }); }
      function carveAt(p) {
        if (done || busy || ctx.ended || !cur) return;
        // (back into letter units)
        const lx = (p.x - box.x) / box.s, ly = (p.y - box.y) / box.s;
        let any = false;
        for (const s of strokes) {
          if (s.done) continue;
          for (const o of s.dots) if (!o.lit && Math.hypot(o.p[0] - lx, o.p[1] - ly) < TOL) { o.lit = true; any = true; }
          if (s.dots.filter((o) => o.lit).length >= s.dots.length * STROKE_DONE) { s.done = true; tone(660 + strokes.filter((x) => x.done).length * 120, 0.08, "triangle", 0.08); }
        }
        if (!any) return;
        const now = performance.now();
        if (now - lastSnd > 80) { lastSnd = now; noise(0.05, "bandpass", 1800, 900, 0.15); }   // scrape scrape
        draw();
        if (strokes.every((s) => s.done)) glow();
      }
      function glow() {
        busy = true;
        up();
        pump.classList.add("lit");
        pips[carved].classList.add("on");
        carved++;
        sweep(200, 600, 0.5, "sine", 0.08); [523, 659, 784].forEach((f, k) => tone(f, 0.1, "triangle", 0.09, 0.2 + k * 0.08));
        word(TEXT.spooky[(carved - 1) % TEXT.spooky.length], W / 2, H * 0.12);
        ctx.say(cur.it.word ? `${sayOf(cur)} for ${cur.it.word}` : sayOf(cur));
        if (carved >= picks.length) { done = true; ctx.win(); ctx.later(() => { word(TEXT.win, W / 2, H * 0.12); ctx.confetti(fx, W / 2, H * 0.4, { count: 90 }); }, 900); return; }
        ctx.later(() => { ctx.pauseTimer(800); idx++; load(); }, ctx.demo ? 900 : 1400);
      }
      function word(text, x, y) {
        const w = document.createElement("div");
        w.className = "pmk-word"; w.textContent = text;
        w.style.left = `${Math.max(110, Math.min(W - 110, x))}px`; w.style.top = `${Math.max(28, y)}px`;
        fx.appendChild(w);
        ctx.later(() => w.remove(), 1000);
      }

      ctx.onTimeout(() => { done = true; up(); strokes.forEach((s) => (s.done = true)); draw(); pump.classList.add("lit"); ctx.say(sayOf(cur)); });

      cur = picks[0];
      layout();
      const ro = new ResizeObserver(layout);
      ro.observe(night);
      load();

      // Tutorial: trace every stroke of each pumpkin's letter.
      ctx.tutorial(picks.map((p) => p.it), async (f) => {
        for (let n = 0; n < picks.length && !done; n++) {
          await f.until(() => !busy && idx === n, 4000);
          for (const s of strokes) {
            if (done || s.done) continue;
            const pts = sample(s.pts).filter((_, i, a) => i % 3 === 0 || i === a.length - 1).map((p) => () => {
              const rr = ctx.root.getBoundingClientRect(), pr = pump.getBoundingClientRect(), [x, y] = px(p);
              return { x: pr.left - rr.left + x, y: pr.top - rr.top + y };
            });
            await f.path(pts, 55);   // (both pumpkins have to fit in the tutorial's 15 s)
          }
          await f.until(() => carved > n || done, 2000);
        }
      });
      return () => { done = true; ro.disconnect(); };
    },
  });
})();
