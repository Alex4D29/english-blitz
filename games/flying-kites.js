// FLYING KITES — a draw-a-line game (Claude's idea; pairs from `ctx.matchPairs`). Kites bob in the sky across the
// top, each with half of a pair; little monster kids stand on the grass below holding the other halves. Draw a
// string from a kid up to the matching kite (or tap one, then the other): the kite catches the wind and soars,
// looping, and the kid cheers. A wrong kite: the string TANGLES and the kite crashes, ✕ (then it bobs back up).
// Fly them all to win; 3 tangles lose.
(function () {
  const TEXT = {
    name: { en: "Flying Kites" },
    icon: "🪁",
    howTo: { en: {
      steps: [
        ["🧒", "Each kid wants the kite that matches their sign."],
        ["🪁", "Draw a string from a kid up to their kite (or tap the kid, then the kite)."],
        ["🌬️", "WHOOSH! It flies. Fly every kite to win."],
      ],
      tips: ["A wrong kite tangles and crashes. Three tangles and it's over.", "Capitals go with small letters, letters with pictures, words with pictures.", "When the game speeds up, there are 4 kites."],
    } },
    instruction: { en: "FLY THE\nKITES!" },
    kidLabel: (t) => `Kid with ${t}`,
    kiteLabel: (t) => `Kite with ${t}`,
    whoosh: ["WHOOSH!", "WHEEE!", "UP UP!", "SO HIGH!"],
    tangle: "TANGLED!",
  };
  const MISSES = 3;
  const KITES = ["#ff5a6e", "#3d8bfd", "#ffd400", "#4dd36b"];
  const KIDS = ["#ff8a1f", "#c04dd9", "#2ec4b6", "#ff6fb0"];

  const CSS = `
  .kit { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:6px; padding-bottom:6px; }
  .kit-pips { flex:none; display:flex; gap:5px; min-height:28px; align-items:center; }
  .kit-pip { width:24px; height:24px; border:3px solid #111; border-radius:50%; background:#fff; }
  .kit-pip.x { background:#ff5a6e; } .kit-pip.x::after { content:"✕"; display:block; text-align:center; color:#fff; font-weight:900; font-size:14px; line-height:18px; }
  .kit-sky { position:relative; flex:1; min-height:0; width:100%; max-width:620px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111;
    background:linear-gradient(180deg, #8fd8ff 0 74%, #6fcf5a 74%); touch-action:none; }
  .kit-cloud { position:absolute; width:90px; height:28px; background:#fff; border-radius:99px; opacity:.9; animation:kit-drift 10s linear infinite alternate; }
  .kit-cloud::before { content:""; position:absolute; left:20px; top:-16px; width:44px; height:40px; background:#fff; border-radius:50%; }
  .kit-tree { position:absolute; bottom:24%; width:70px; height:90px; }
  .kit-tree::before { content:""; position:absolute; left:28px; bottom:0; width:14px; height:40px; background:#8a5a3c; border:3px solid #111; }
  .kit-tree::after { content:""; position:absolute; left:0; bottom:30px; width:70px; height:64px; background:#3fa13a; border:3px solid #111; border-radius:50%; }
  .kit-svg { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; z-index:3; overflow:visible; }
  .kit-svg path { fill:none; stroke:#111; stroke-width:2.5; stroke-linecap:round; }
  .kit-svg .bad path { stroke:#e8173c; stroke-width:3; }
  /* A kite (--kz): a diamond with crossed sticks, its half in the middle, a tail of bows */
  .kit-kite { position:absolute; width:var(--kz); height:calc(var(--kz) * 1.2); margin:calc(var(--kz) * -.6) 0 0 calc(var(--kz) / -2); z-index:2; cursor:pointer; touch-action:none;
    animation:kit-bob 1.6s ease-in-out infinite alternate; }
  .kit-kite > * { position:absolute; pointer-events:none; }
  .kit-dia { left:12%; right:12%; top:6%; height:76%; background:var(--c); border:4px solid #111; clip-path:polygon(50% 0, 100% 42%, 50% 100%, 0 42%); }
  .kit-dia::before { content:""; position:absolute; inset:0; background:linear-gradient(90deg, transparent 48%, #111 48% 52%, transparent 52%), linear-gradient(transparent 40%, #111 40% 44%, transparent 44%); }
  .kit-edge { left:12%; right:12%; top:6%; height:76%; clip-path:polygon(50% 0, 100% 42%, 50% 100%, 0 42%, 0 42%, 4% 42%, 50% 6%, 96% 42%, 50% 94%, 4% 42%, 0 42%); background:#111; }
  .kit-lbl { left:50%; top:40%; transform:translate(-50%, -50%); padding:1px 6px; background:#fff; border:3px solid #111; border-radius:9px; font-weight:900; color:#111; line-height:1.1; white-space:nowrap; z-index:2; }
  .kit-tail { left:46%; top:80%; width:8%; height:34%; border-left:3px solid #111; transform-origin:0 0; animation:kit-tail .5s ease-in-out infinite alternate; }
  .kit-tail::before, .kit-tail::after { content:""; position:absolute; left:-9px; width:16px; height:10px; background:radial-gradient(circle, #ffd400 0 30%, transparent 32%), var(--c);
    clip-path:polygon(0 0, 50% 50%, 0 100%, 100% 0, 50% 50%, 100% 100%); }
  .kit-tail::before { top:30%; } .kit-tail::after { top:75%; }
  .kit-kite.fly { animation:kit-soar 1.4s ease-in-out infinite alternate; }
  .kit-kite.crash { animation:kit-crash .7s ease-in forwards; }
  .kit-kite.sel .kit-lbl, .kit-kid.sel .kit-sign { box-shadow:0 0 0 5px #fff, 0 0 0 10px #ffd400; }
  .kit-kite.right .kit-lbl, .kit-kid.right .kit-sign { box-shadow:0 0 0 4px #fff, 0 0 0 8px #00b86b; }
  .kit-kite.done, .kit-kid.done { pointer-events:none; }
  /* A little monster kid (--dz) on the grass, holding a sign with its half */
  .kit-kid { position:absolute; width:var(--dz); height:var(--dz); margin:calc(var(--dz) * -.5) 0 0 calc(var(--dz) / -2); z-index:2; cursor:pointer; touch-action:none; }
  .kit-kid > * { position:absolute; box-sizing:border-box; pointer-events:none; }
  .kit-kbody { left:18%; right:18%; top:8%; bottom:6%; background:var(--c); border:4px solid #111; border-radius:50% 50% 40% 40%; }
  .kit-keye { top:16%; width:22%; aspect-ratio:1; background:#fff; border:3px solid #111; border-radius:50%; overflow:hidden; z-index:2; }
  .kit-keye.l { left:28%; } .kit-keye.r { right:28%; width:18%; top:18%; }
  .kit-keye i { position:absolute; left:28%; top:22%; width:46%; aspect-ratio:1; background:#111; border-radius:50%; }   /* looking up at the kites */
  .kit-kmouth { left:40%; right:40%; top:40%; height:8%; background:#5a0f1e; border-radius:0 0 99px 99px; z-index:2; }
  .kit-kid.yay .kit-kmouth { height:14%; border:2px solid #111; }
  .kit-kid.yay { animation:kit-hop .3s ease-in-out infinite alternate; }
  .kit-kid.sad .kit-kmouth { border-radius:99px 99px 0 0; }
  .kit-sign { left:8%; right:8%; top:52%; height:36%; background:#fff; border:3px solid #111; border-radius:8px; z-index:3; display:flex; align-items:center; justify-content:center;
    font-weight:900; color:#111; line-height:1; white-space:nowrap; }
  .kit-fx { position:absolute; inset:0; pointer-events:none; z-index:8; overflow:visible; }
  .kit-word { position:absolute; transform:translate(-50%, -50%) rotate(-8deg); font-size:1.9rem; color:#fff; -webkit-text-stroke:2px #111; paint-order:stroke fill;
    text-shadow:0 4px 0 #111; white-space:nowrap; animation:kit-word 1s ease-out forwards; }
  .kit-word.bad { color:#ff5a6e; }
  @keyframes kit-drift { to { translate:80px 0; } }
  @keyframes kit-bob { from { translate:0 -4px; rotate:-5deg; } to { translate:0 4px; rotate:5deg; } }
  @keyframes kit-soar { from { translate:0 -26px; rotate:-14deg; } to { translate:10px -40px; rotate:14deg; } }
  @keyframes kit-crash { 0% { translate:0 0; rotate:0deg; } 70% { translate:20px 120px; rotate:300deg; } 100% { translate:20px 110px; rotate:330deg; } }
  @keyframes kit-tail { from { rotate:-12deg; } to { rotate:12deg; } }
  @keyframes kit-hop { to { translate:0 -12%; } }
  @keyframes kit-word { from { opacity:1; scale:.5; } 25% { scale:1.15; } 75% { opacity:1; } to { opacity:0; translate:0 -40px; } }
  @media (prefers-reduced-motion: reduce) { .kit-kite, .kit-tail, .kit-cloud, .kit-kid.yay, .kit-word { animation:none !important; } }
  `;
  function injectCss() { if (document.getElementById("kit-css")) return; const s = document.createElement("style"); s.id = "kit-css"; s.textContent = CSS; document.head.appendChild(s); }

  registerMicrogame({
    id: "flying-kites",
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
      wrap.className = "kit";
      wrap.innerHTML = `<div class="kit-pips">${'<span class="kit-pip"></span>'.repeat(MISSES)}</div>`;
      const sky = document.createElement("div");
      sky.className = "kit-sky";
      sky.innerHTML = '<div class="kit-cloud" style="left:8%;top:8%"></div><div class="kit-cloud" style="left:58%;top:4%;animation-delay:-5s"></div><div class="kit-tree" style="right:3%"></div>';
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("class", "kit-svg");
      const fx = document.createElement("div");
      fx.className = "kit-fx";
      sky.append(svg, fx);
      wrap.appendChild(sky);
      ctx.root.appendChild(wrap);
      const missPips = wrap.querySelector(".kit-pips").children;

      // Kids along the bottom in the pairs' order; kites across the top, shuffled.
      const kids = P.map((p, i) => {
        const el = document.createElement("div");
        el.className = "kit-kid";
        el.style.setProperty("--c", KIDS[i % KIDS.length]);
        el.setAttribute("aria-label", TEXT.kidLabel(p.a.spoken));
        el.innerHTML = '<div class="kit-kbody"></div><div class="kit-keye l"><i></i></div><div class="kit-keye r"><i></i></div><div class="kit-kmouth"></div><div class="kit-sign"></div>';
        el.querySelector(".kit-sign").textContent = p.a.text;
        sky.insertBefore(el, svg);
        return { el, p, side: "a", x: 0, y: 0, done: false };
      });
      const kites = ctx.shuffle(P.slice()).map((p, i) => {
        const el = document.createElement("div");
        el.className = "kit-kite";
        el.style.setProperty("--c", KITES[i % KITES.length]);
        el.style.animationDelay = `${-i * 0.5}s`;
        el.setAttribute("aria-label", TEXT.kiteLabel(p.b.spoken));
        el.innerHTML = '<div class="kit-tail"></div><div class="kit-dia"></div><div class="kit-lbl"></div>';
        el.querySelector(".kit-lbl").textContent = p.b.text;
        sky.insertBefore(el, svg);
        return { el, p, side: "b", x: 0, y: 0, done: false };
      });

      let W = 0, H = 0, kz = 90, dz = 80;
      function layout() {
        W = sky.clientWidth; H = sky.clientHeight;
        const col = W / N;
        kz = Math.max(60, Math.min(col * 0.78, H * 0.26, 120));
        dz = Math.max(56, Math.min(col * 0.72, H * 0.24, 110));
        sky.style.setProperty("--kz", `${kz}px`); sky.style.setProperty("--dz", `${dz}px`);
        kites.forEach((k, i) => { k.x = col * (i + 0.5); k.y = H * (i % 2 ? 0.27 : 0.21); k.el.style.left = `${k.x}px`; k.el.style.top = `${k.y}px`;
          k.el.querySelector(".kit-lbl").style.fontSize = `${k.p.b.kind === "pic" ? kz * 0.34 : Math.min(kz * 0.3, (kz * 0.8) / ([...k.p.b.text].length * 0.62))}px`; });
        kids.forEach((d, i) => { d.x = col * (i + 0.5); d.y = H * 0.8; d.el.style.left = `${d.x}px`; d.el.style.top = `${d.y}px`;
          d.el.querySelector(".kit-sign").style.fontSize = `${Math.min(dz * 0.3, (dz * 0.74) / ([...d.p.a.text].length * 0.62))}px`; });
        strings.forEach(drawString);
      }
      const handOf = (d) => ({ x: d.x, y: d.y - dz * 0.1 });
      const kiteOf = (k) => ({ x: k.x, y: k.y + kz * 0.38 });

      // ---------- Strings (SVG) ----------
      const strings = [];
      function makeString() {
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.innerHTML = "<path/>";
        svg.appendChild(g);
        const s = { g, a: { x: 0, y: 0 }, b: { x: 0, y: 0 }, tangle: false };
        strings.push(s);
        return s;
      }
      function drawString(s) {
        let d;
        if (s.tangle) {   // a scribbly knot halfway along
          const mx = (s.a.x + s.b.x) / 2, my = (s.a.y + s.b.y) / 2;
          d = `M${s.a.x} ${s.a.y} L${mx} ${my}`;
          for (let k = 0; k < 10; k++) d += ` L${(mx + Math.cos(k * 2.4) * 18).toFixed(1)} ${(my + Math.sin(k * 2.4) * 14).toFixed(1)}`;
          d += ` L${s.b.x} ${s.b.y}`;
        } else {
          const mx = (s.a.x + s.b.x) / 2 + 16, my = (s.a.y + s.b.y) / 2 + 10;
          d = `M${s.a.x.toFixed(1)} ${s.a.y.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${s.b.x.toFixed(1)} ${s.b.y.toFixed(1)}`;
        }
        s.g.firstChild.setAttribute("d", d);
      }
      function dropString(s) { s.g.remove(); const k = strings.indexOf(s); if (k >= 0) strings.splice(k, 1); }

      // ---------- Dragging (or tap, then tap) ----------
      let done = false, busy = false, drag = null, sel = null, missN = 0, flown = 0;
      const local = (e) => { const r = sky.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
      const near = (list, p, rad) => list.filter((o) => !o.done).map((o) => ({ o, d: Math.hypot(o.x - p.x, o.y - p.y) })).filter((z) => z.d < rad).sort((u, v) => u.d - v.d)[0]?.o;
      const hit = (p) => near(kids, p, dz * 0.62) || near(kites, p, kz * 0.62);
      const end = (o) => (o.side === "a" ? handOf(o) : kiteOf(o));
      sky.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        if (done || busy || ctx.ended) return;
        const p = local(e), o = hit(p);
        if (!o) { clearSel(); return; }
        if (sel && sel.side !== o.side) { const s = sel; clearSel(); join(s, o); return; }
        const s = makeString();
        s.a = end(o); s.b = p;
        drawString(s);
        drag = { from: o, s, start: p, moved: false };
      });
      sky.addEventListener("pointermove", (e) => {
        if (!drag) return;
        const p = local(e);
        if (Math.hypot(p.x - drag.start.x, p.y - drag.start.y) > 14) drag.moved = true;
        drag.s.b = p;
        drawString(drag.s);
      });
      sky.addEventListener("pointerup", (e) => {
        if (!drag) return;
        const d = drag; drag = null;
        const p = e.clientX != null ? local(e) : d.s.b;
        dropString(d.s);
        if (!d.moved) { select(d.from); return; }
        const to = d.from.side === "a" ? near(kites, p, kz * 0.8) : near(kids, p, dz * 0.8);
        if (to) join(d.from, to);
      });
      sky.addEventListener("pointercancel", () => { if (drag) { dropString(drag.s); drag = null; } });
      function select(o) { clearSel(); sel = o; o.el.classList.add("sel"); tone(660, 0.05, "triangle", 0.06); }
      function clearSel() { if (sel) sel.el.classList.remove("sel"); sel = null; }

      function join(x, y) {
        const d = x.side === "a" ? x : y, k = x.side === "a" ? y : x;
        const s = makeString();
        s.a = handOf(d); s.b = kiteOf(k);
        if (d.p === k.p) { drawString(s); fly(d, k, s); } else { s.tangle = true; drawString(s); s.g.classList.add("bad"); crash(d, k, s); }
      }
      function fly(d, k, s) {
        d.done = k.done = true;
        d.el.classList.add("done", "yay"); k.el.classList.add("done", "fly");
        noise(0.6, "bandpass", 900, 600, 0.2); sweep(400, 1200, 0.5, "sine", 0.08);   // whoosh
        word(TEXT.whoosh[flown % TEXT.whoosh.length], false, k.x, k.y - kz * 0.5);
        // The string follows the kite up as it soars.
        const t0 = performance.now();
        (function tug() {
          if (!s.g.isConnected) return;
          const r = k.el.getBoundingClientRect(), sr = sky.getBoundingClientRect();
          s.b = { x: r.left - sr.left + r.width / 2, y: r.top - sr.top + r.height * 0.82 };
          drawString(s);
          if (performance.now() - t0 < 60000) ctx.raf(tug);
        })();
        ctx.say(d.p.say);
        flown++;
        if (flown >= P.length) { done = true; ctx.win(); ctx.confetti(fx, W / 2, H * 0.3, { count: 90 }); [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, "triangle", 0.1, 0.3 + i * 0.08)); }
      }
      function crash(d, k, s) {
        busy = true;
        k.el.classList.add("crash"); d.el.classList.add("sad");
        sweep(1200, 200, 0.6, "sawtooth", 0.06); ctx.later(() => noise(0.15, "lowpass", 600, 200, 0.4), 500);   // wheee… crunch
        word(TEXT.tangle, true, (s.a.x + s.b.x) / 2, (s.a.y + s.b.y) / 2);
        missPips[missN].classList.add("x");
        missN++;
        ctx.later(() => { dropString(s); k.el.classList.remove("crash"); d.el.classList.remove("sad"); busy = false; }, 900);
        if (missN >= MISSES) { done = true; ctx.lose(); ctx.later(showAnswer, 950); }
      }
      function showAnswer() { kids.forEach((d) => { if (!d.done) { d.el.classList.add("right"); kites.find((k) => k.p === d.p).el.classList.add("right"); } }); }
      function word(text, bad, x, y) {
        const w = document.createElement("div");
        w.className = "kit-word" + (bad ? " bad" : "");
        w.textContent = text;
        w.style.left = `${Math.max(80, Math.min(W - 80, x))}px`; w.style.top = `${Math.max(26, y)}px`;
        fx.appendChild(w);
        ctx.later(() => w.remove(), 1000);
      }

      ctx.onTimeout(() => { done = true; clearSel(); showAnswer(); });

      layout();
      const ro = new ResizeObserver(layout);
      ro.observe(sky);
      ctx.later(() => { const d = kids[0]; ctx.hint({ x: sky.offsetLeft + d.x + dz * 0.6, y: sky.offsetTop + H * 0.66 }, { x: sky.offsetLeft + d.x + dz * 0.6, y: sky.offsetTop + H * 0.4 }, { small: true }); }, 80);

      // Tutorial: draw a string from each kid up to their kite.
      ctx.tutorial(P.map((p) => p.item), async (f) => {
        const at = (o) => () => { const rr = ctx.root.getBoundingClientRect(), r = sky.getBoundingClientRect(); return { x: r.left - rr.left + o.x, y: r.top - rr.top + o.y }; };
        for (const d of kids) {
          if (done) break;
          await f.until(() => !busy, 3000);
          await f.drag(at(d), at(kites.find((k) => k.p === d.p)), 700);
          await f.until(() => d.done || done, 2000);
        }
      });
      return () => { done = true; ro.disconnect(); };
    },
  });
})();
