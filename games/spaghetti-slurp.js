// SPAGHETTI SLURP — a draw-a-line game (Claude's idea, named by the teacher; pairs from `ctx.matchPairs`). Hungry
// monsters sit down the left in bibs that show one half of a pair (B, or "cat"); plates of spaghetti down the right
// show the other half (b, 🐝, 🐱). Drag a noodle from a monster to its plate (or tap one, then the other): the
// right plate and the noodle stays, then the monster SLURPS it up and the plate is licked clean. A wrong plate:
// the noodle snaps back (BOING), ✕. Feed everyone to win; 3 snaps lose.
(function () {
  const TEXT = {
    name: { en: "Spaghetti Slurp" },
    icon: "🍝",
    howTo: { en: {
      steps: [
        ["👹", "Each hungry monster wants the plate that matches its bib."],
        ["🍝", "Drag a noodle from a monster to its plate (or tap the monster, then the plate)."],
        ["😋", "SLURP! Feed every monster to win."],
      ],
      tips: ["A wrong plate and the noodle snaps back. Three snaps and it's over.", "Capitals go with small letters, letters with pictures, words with pictures.", "When the game speeds up, there are 4 monsters."],
    } },
    instruction: { en: "FEED THEM!" },
    monLabel: (t) => `Monster with ${t}`,
    plateLabel: (t) => `Plate with ${t}`,
    slurp: ["SLUUURP!", "YUM!", "SLURP!", "MMM!"],
    boing: "BOING!",
  };
  const MISSES = 3;
  const MONS = ["#ff8a1f", "#2ec4b6", "#c04dd9", "#4dd36b"];

  const CSS = `
  .spg { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:6px; padding-bottom:6px; }
  .spg-pips { flex:none; display:flex; gap:5px; min-height:28px; align-items:center; }
  .spg-pip { width:24px; height:24px; border:3px solid #111; border-radius:50%; background:#fff; }
  .spg-pip.x { background:#ff5a6e; } .spg-pip.x::after { content:"✕"; display:block; text-align:center; color:#fff; font-weight:900; font-size:14px; line-height:18px; }
  .spg-room { position:relative; flex:1; min-height:0; width:100%; max-width:620px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111;
    background:linear-gradient(90deg, rgba(232,23,60,.14) 50%, transparent 50%) 0 0 / 44px 44px, linear-gradient(rgba(232,23,60,.14) 50%, transparent 50%) 0 0 / 44px 44px, #fff7e8; touch-action:none; }
  .spg-svg { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; z-index:3; overflow:visible; }
  .spg-svg path { fill:none; stroke-linecap:round; stroke-linejoin:round; }
  .spg-svg .o { stroke:#b5821e; stroke-width:12; } .spg-svg .i { stroke:#ffe08a; stroke-width:7; }
  .spg-svg .bad .i { stroke:#ffb0b0; }
  /* A hungry monster (--mz): a round body, googly eyes, a big open mouth, a bib with its half of the pair */
  .spg-mon { position:absolute; width:var(--mz); height:var(--mz); margin:calc(var(--mz) / -2) 0 0 calc(var(--mz) / -2); z-index:2; cursor:pointer; touch-action:none; }
  .spg-mon > * { position:absolute; box-sizing:border-box; pointer-events:none; }
  .spg-body { left:6%; right:6%; top:4%; bottom:2%; background:var(--c); border:4px solid #111; border-radius:50% 50% 44% 44%; }
  .spg-eye { top:12%; width:24%; aspect-ratio:1; background:#fff; border:3px solid #111; border-radius:50%; overflow:hidden; z-index:2; }
  .spg-eye.l { left:22%; } .spg-eye.r { right:22%; width:20%; top:14%; }
  .spg-eye i { position:absolute; left:28%; top:30%; width:46%; aspect-ratio:1; background:#111; border-radius:50%; animation:spg-roll 1.2s ease-in-out infinite alternate; }
  .spg-mouth { left:30%; right:30%; top:36%; height:16%; background:#5a0f1e; border:3px solid #111; border-radius:30% 30% 50% 50%; z-index:2; }
  .spg-mouth::after { content:""; position:absolute; left:26%; right:26%; bottom:0; height:40%; background:#ff6f91; border-radius:50% 50% 0 0; }
  .spg-mon.chew .spg-mouth { animation:spg-chew .14s ease-in-out infinite alternate; }
  .spg-mon.full .spg-mouth { height:7%; top:42%; border-radius:0 0 99px 99px; }
  .spg-mon.full .spg-mouth::after { display:none; }
  .spg-mon.sad .spg-mouth { height:8%; top:44%; border-radius:99px 99px 0 0; }
  .spg-bib { left:18%; right:18%; top:56%; bottom:8%; background:#fff; border:3px solid #111; border-radius:6px 6px 40% 40%; z-index:3;
    display:flex; align-items:center; justify-content:center; font-weight:900; color:#111; line-height:1; white-space:nowrap; }
  .spg-mon.sel .spg-body, .spg-plate.sel .spg-dish { box-shadow:0 0 0 5px #fff, 0 0 0 10px #ffd400; }
  .spg-mon.done, .spg-plate.done { pointer-events:none; }
  .spg-mon.right .spg-bib, .spg-plate.right .spg-lbl { box-shadow:0 0 0 4px #fff, 0 0 0 8px #00b86b; }
  /* A plate of spaghetti (--pz) with the other half on a little card */
  .spg-plate { position:absolute; width:var(--pz); height:var(--pz); margin:calc(var(--pz) / -2) 0 0 calc(var(--pz) / -2); z-index:2; cursor:pointer; touch-action:none; }
  .spg-plate > * { position:absolute; pointer-events:none; }
  .spg-dish { left:0; right:0; top:22%; bottom:10%; background:radial-gradient(ellipse, #fff 0 56%, #dfe6ee 58% 100%); border:4px solid #111; border-radius:50%; }
  .spg-pile { left:16%; right:16%; top:30%; bottom:22%; border-radius:50%; transition:transform .5s, opacity .5s;
    background:repeating-radial-gradient(circle at 40% 50%, #ffe08a 0 3px, #d9a83a 3px 5px), #ffe08a; border:3px solid #b5821e; }
  .spg-pile::after { content:""; position:absolute; left:40%; top:20%; width:24%; height:30%; border-radius:50%; background:#e8173c; border:2px solid #111; }   /* a meatball */
  .spg-plate.done .spg-pile { transform:scale(0); opacity:0; }
  .spg-lbl { left:50%; top:-2%; transform:translateX(-50%); z-index:2; padding:2px 8px; background:#fff; border:3px solid #111; border-radius:10px; box-shadow:0 3px 0 #111;
    font-weight:900; color:#111; line-height:1.1; white-space:nowrap; }
  .spg-fx { position:absolute; inset:0; pointer-events:none; z-index:8; overflow:visible; }
  .spg-word { position:absolute; transform:translate(-50%, -50%) rotate(-8deg); font-size:1.9rem; color:#ffd400; -webkit-text-stroke:2px #111; paint-order:stroke fill;
    text-shadow:0 4px 0 #111; white-space:nowrap; animation:spg-word 1s ease-out forwards; }
  .spg-word.bad { color:#ff5a6e; }
  @keyframes spg-roll { from { transform:translate(-25%, -15%); } to { transform:translate(25%, 15%); } }
  @keyframes spg-chew { to { transform:scaleY(.35); } }
  @keyframes spg-word { from { opacity:1; scale:.5; } 25% { scale:1.15; } 75% { opacity:1; } to { opacity:0; translate:0 -40px; } }
  @media (prefers-reduced-motion: reduce) { .spg-eye i, .spg-mon.chew .spg-mouth, .spg-word { animation:none !important; } }
  `;
  function injectCss() { if (document.getElementById("spg-css")) return; const s = document.createElement("style"); s.id = "spg-css"; s.textContent = CSS; document.head.appendChild(s); }

  registerMicrogame({
    id: "spaghetti-slurp",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc"],
    duration: 16000,
    input: "drag",
    tutorial: true,

    start(ctx) {
      injectCss();
      const speed = ctx.speed || 1;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const { tone, sweep, noise } = ctx.sfx;
      const N = speed >= 1.5 ? 4 : 3;
      const P = ctx.matchPairs(N);

      const wrap = document.createElement("div");
      wrap.className = "spg";
      wrap.innerHTML = `<div class="spg-pips">${'<span class="spg-pip"></span>'.repeat(MISSES)}</div>`;
      const room = document.createElement("div");
      room.className = "spg-room";
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("class", "spg-svg");
      const fx = document.createElement("div");
      fx.className = "spg-fx";
      room.append(svg, fx);
      wrap.appendChild(room);
      ctx.root.appendChild(wrap);
      const missPips = wrap.querySelector(".spg-pips").children;

      // Monsters on the left in the pairs' order; plates on the right, shuffled.
      const mons = P.map((p, i) => {
        const el = document.createElement("div");
        el.className = "spg-mon";
        el.style.setProperty("--c", MONS[i % MONS.length]);
        el.setAttribute("aria-label", TEXT.monLabel(p.a.spoken));
        el.innerHTML = '<div class="spg-body"></div><div class="spg-eye l"><i></i></div><div class="spg-eye r"><i></i></div><div class="spg-mouth"></div><div class="spg-bib"></div>';
        el.querySelector(".spg-bib").textContent = p.a.text;
        room.insertBefore(el, svg);
        return { el, p, side: "a", x: 0, y: 0, done: false };
      });
      const plates = ctx.shuffle(P.slice()).map((p) => {
        const el = document.createElement("div");
        el.className = "spg-plate";
        el.setAttribute("aria-label", TEXT.plateLabel(p.b.spoken));
        el.innerHTML = '<div class="spg-dish"></div><div class="spg-pile"></div><div class="spg-lbl"></div>';
        el.querySelector(".spg-lbl").textContent = p.b.text;
        room.insertBefore(el, svg);
        return { el, p, side: "b", x: 0, y: 0, done: false };
      });

      let W = 0, H = 0, mz = 80, pz = 80;
      function layout() {
        W = room.clientWidth; H = room.clientHeight;
        const row = H / N;
        mz = Math.max(56, Math.min(row * 0.88, W * 0.24, 120));
        pz = Math.max(56, Math.min(row * 0.9, W * 0.24, 120));
        room.style.setProperty("--mz", `${mz}px`); room.style.setProperty("--pz", `${pz}px`);
        mons.forEach((m, i) => { m.x = W * 0.2; m.y = row * (i + 0.5); m.el.style.left = `${m.x}px`; m.el.style.top = `${m.y}px`;
          const bib = m.el.querySelector(".spg-bib"); bib.style.fontSize = `${Math.min(mz * 0.3, (mz * 0.6) / ([...m.p.a.text].length * 0.62))}px`; });
        plates.forEach((q, i) => { q.x = W * 0.8; q.y = row * (i + 0.5); q.el.style.left = `${q.x}px`; q.el.style.top = `${q.y}px`;
          q.el.querySelector(".spg-lbl").style.fontSize = `${q.p.b.kind === "pic" ? pz * 0.36 : Math.min(pz * 0.32, (pz * 0.9) / ([...q.p.b.text].length * 0.62))}px`; });
        noodles.forEach(drawNoodle);
      }
      const mouthOf = (m) => ({ x: m.x, y: m.y - mz * 0.06 });
      const plateOf = (q) => ({ x: q.x, y: q.y + pz * 0.1 });

      // ---------- Noodles (SVG): a wiggly line ----------
      const noodles = [];
      function wiggle(a, b, amp = 7) {
        const L = Math.hypot(b.x - a.x, b.y - a.y), n = Math.max(2, Math.round(L / 14)), nx = -(b.y - a.y) / (L || 1), ny = (b.x - a.x) / (L || 1);
        let d = `M${a.x.toFixed(1)} ${a.y.toFixed(1)}`;
        for (let k = 1; k <= n; k++) {
          const t = k / n, w = k === n ? 0 : Math.sin(t * Math.PI * (L / 40)) * amp;
          d += ` L${(a.x + (b.x - a.x) * t + nx * w).toFixed(1)} ${(a.y + (b.y - a.y) * t + ny * w).toFixed(1)}`;
        }
        return d;
      }
      function makeNoodle() {
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.innerHTML = '<path class="o"/><path class="i"/>';
        svg.appendChild(g);
        const n = { g, a: { x: 0, y: 0 }, b: { x: 0, y: 0 } };
        noodles.push(n);
        return n;
      }
      function drawNoodle(n) { const d = wiggle(n.a, n.b); n.g.children[0].setAttribute("d", d); n.g.children[1].setAttribute("d", d); }
      function dropNoodle(n) { n.g.remove(); const k = noodles.indexOf(n); if (k >= 0) noodles.splice(k, 1); }

      // ---------- Dragging (or tap, then tap) ----------
      let done = false, busy = false, drag = null, sel = null, missN = 0, fed = 0;
      const local = (e) => { const r = room.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
      const near = (list, p, rad) => list.filter((o) => !o.done).map((o) => ({ o, d: Math.hypot(o.x - p.x, o.y - p.y) })).filter((z) => z.d < rad).sort((u, v) => u.d - v.d)[0]?.o;
      const hit = (p) => near(mons, p, mz * 0.6) || near(plates, p, pz * 0.6);
      const end = (o) => (o.side === "a" ? mouthOf(o) : plateOf(o));
      room.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        if (done || busy || ctx.ended) return;
        const p = local(e), o = hit(p);
        if (!o) { clearSel(); return; }
        if (sel && sel.side !== o.side) { const s = sel; clearSel(); join(s, o); return; }   // tap, then tap
        const n = makeNoodle();
        n.a = end(o); n.b = p;
        drawNoodle(n);
        drag = { from: o, n, start: p, moved: false };
        sweep(300, 500, 0.08, "triangle", 0.05);
      });
      room.addEventListener("pointermove", (e) => {
        if (!drag) return;
        const p = local(e);
        if (Math.hypot(p.x - drag.start.x, p.y - drag.start.y) > 14) drag.moved = true;
        drag.n.b = p;
        drawNoodle(drag.n);
      });
      const up = (e) => {
        if (!drag) return;
        const d = drag; drag = null;
        const p = e && e.clientX != null ? local(e) : d.n.b;
        dropNoodle(d.n);
        if (!d.moved) { select(d.from); return; }   // (a tap: pick it, then tap the other one)
        const to = (d.from.side === "a" ? near(plates, p, pz * 0.75) : near(mons, p, mz * 0.75));
        if (to) join(d.from, to);
      };
      room.addEventListener("pointerup", up);
      room.addEventListener("pointercancel", () => { if (drag) { dropNoodle(drag.n); drag = null; } });
      function select(o) { clearSel(); sel = o; o.el.classList.add("sel"); tone(660, 0.05, "triangle", 0.06); }
      function clearSel() { if (sel) sel.el.classList.remove("sel"); sel = null; }

      // ---------- Matching ----------
      function join(x, y) {
        const m = x.side === "a" ? x : y, q = x.side === "a" ? y : x;
        const n = makeNoodle();
        n.a = mouthOf(m); n.b = plateOf(q);
        drawNoodle(n);
        if (m.p === q.p) slurp(m, q, n); else snap(m, n);
      }
      function slurp(m, q, n) {
        busy = true;
        m.done = q.done = true;
        m.el.classList.add("done", "chew"); q.el.classList.add("done");
        // The noodle gets sucked up into the mouth.
        const from = { ...n.b }, to = mouthOf(m), t0 = performance.now(), ms = reduceMotion ? 1 : 650;
        sweep(900, 300, 0.6, "sine", 0.08);   // sluuurp
        (function suck(now) {
          const k = Math.min(1, (now - t0) / ms);
          n.b = { x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k };
          drawNoodle(n);
          if (k < 1) { ctx.raf(suck); return; }
          dropNoodle(n);
          m.el.classList.remove("chew"); m.el.classList.add("full");
          tone(523, 0.08, "triangle", 0.1); tone(784, 0.1, "triangle", 0.1, 0.08);
          word(TEXT.slurp[fed % TEXT.slurp.length], false, m.x + mz * 0.6, m.y - mz * 0.4);
          ctx.say(m.p.say);
          fed++;
          if (fed >= P.length) { done = true; ctx.win(); ctx.confetti(fx, W / 2, H * 0.4, { count: 90 }); [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, "triangle", 0.1, 0.2 + i * 0.08)); return; }
          busy = false;
        })(t0);
      }
      function snap(m, n) {
        busy = true;
        n.g.classList.add("bad");
        tone(200, 0.1, "square", 0.1); sweep(600, 150, 0.25, "sawtooth", 0.07);   // BOING
        word(TEXT.boing, true, W / 2, (n.a.y + n.b.y) / 2);
        m.el.classList.add("sad");
        missPips[missN].classList.add("x");
        missN++;
        ctx.later(() => { dropNoodle(n); m.el.classList.remove("sad"); busy = false; }, 450);
        if (missN >= MISSES) { done = true; ctx.lose(); ctx.later(showAnswer, 500); }
      }
      function showAnswer() { mons.forEach((m) => { if (!m.done) { m.el.classList.add("right"); const q = plates.find((x) => x.p === m.p); q.el.classList.add("right"); } }); }
      function word(text, bad, x, y) {
        const w = document.createElement("div");
        w.className = "spg-word" + (bad ? " bad" : "");
        w.textContent = text;
        w.style.left = `${Math.max(80, Math.min(W - 80, x))}px`; w.style.top = `${Math.max(26, y)}px`;
        fx.appendChild(w);
        ctx.later(() => w.remove(), 1000);
      }

      ctx.onTimeout(() => { done = true; clearSel(); showAnswer(); });

      layout();
      const ro = new ResizeObserver(layout);
      ro.observe(room);
      ctx.later(() => { const a = mons[0], b = plates.find((q) => q.p === a.p) || plates[0]; ctx.hint({ x: room.offsetLeft + W * 0.38, y: room.offsetTop + a.y }, { x: room.offsetLeft + W * 0.62, y: room.offsetTop + a.y }, { small: true }); void b; }, 80);

      // Tutorial: drag a noodle from each monster to its plate.
      ctx.tutorial(P.map((p) => p.item), async (f) => {
        const at = (o) => () => { const rr = ctx.root.getBoundingClientRect(), r = room.getBoundingClientRect(); return { x: r.left - rr.left + o.x, y: r.top - rr.top + o.y }; };
        for (const m of mons) {
          if (done) break;
          await f.until(() => !busy, 3000);
          const q = plates.find((x) => x.p === m.p);
          await f.drag(at(m), at(q), 700);
          await f.until(() => m.done || done, 2000);
        }
      });
      return () => { done = true; ro.disconnect(); };
    },
  });
})();
