// PARTY CAKE — a carve-it-out tracing game (the teacher's idea: "a cake has 6 words on it, you need to slice up the
// monster's order and give them the right cake"). A hungry party monster (a party hat, googly eyes, a big open mouth)
// orders something in a speech bubble (a new target each customer: `ctx.choiceSteps(3, 6)`); a big round cake seen
// from above has 6 slices, each piped with an option. Dotted cut lines run from the middle out to the edge between the
// slices: trace along them with the knife (the dots light up, 80% and the line is cut). A slice comes free once both of
// its lines are cut, and flies to the monster: the right one, CHOMP! YUM!, and the customer skips off happy; then the
// next customer and a fresh cake (the beat). The wrong one: BLEH!, it's spat out, ✕ (the cake stays: keep cutting);
// 3 wrong slices lose. Feed 3 customers to win.
(function () {
  const TEXT = {
    name: { en: "Party Cake" },
    icon: "🎂",
    howTo: { en: {
      steps: [
        ["👹", "A hungry monster orders a slice of cake."],
        ["🔪", "Find that slice and drag the knife along the two dotted lines beside it."],
        ["🍰", "It comes free and the monster gobbles it up! Feed 3 monsters."],
      ],
      tips: ["Cut out the wrong slice and they spit it out. BLEH! Three of those and it's over.", "Each line goes from the middle of the cake to the edge.", "Tap the monster to hear the order again."],
    } },
    instruction: { en: "SLICE THE\nCAKE!" },
    custLabel: "The customer. Tap to hear the order again.",
    yum: ["YUM!", "CHOMP!", "DELICIOUS!"],
    bleh: "BLEH!",
    win: "PARTY TIME!",
  };
  const GOAL = 3, MISSES = 3, SLICES = 6, DOTS = 9, LINE_DONE = 0.8;
  const MONS = ["#ff8a1f", "#c04dd9", "#2ec4b6", "#4dd36b", "#3d8bfd"];
  const ICING = ["#ff8fb8", "#ffe066", "#a8e6ff", "#c9a2ff"];

  const CSS = `
  .pck { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:6px; padding-bottom:6px; }
  .pck-top { flex:none; display:flex; gap:12px; align-items:center; min-height:28px; }
  .pck-pips { display:flex; gap:5px; }
  .pck-pip { width:24px; height:24px; border:3px solid #111; border-radius:50%; background:#fff; display:flex; align-items:center; justify-content:center; font-size:13px; line-height:1; }
  .pck-pip.on { background:#ffd400; } .pck-pip.on::after { content:"🍰"; }
  .pck-pip.x.on { background:#ff5a6e; } .pck-pip.x.on::after { content:"✕"; color:#fff; font-weight:900; }
  .pck-room { position:relative; flex:1; min-height:0; width:100%; max-width:640px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111; touch-action:none;
    background:radial-gradient(circle, rgba(255,255,255,.5) 0 3px, transparent 4px) 0 0 / 34px 34px, linear-gradient(180deg, #ffd6e8, #ffeaf3); }
  .pck-room::before { content:"🎈"; position:absolute; left:3%; top:3%; font-size:1.8rem; } .pck-room::after { content:"🎉"; position:absolute; right:3%; top:3%; font-size:1.8rem; }
  /* The monster (--mz), at the left, with the order in a bubble */
  .pck-mon { position:absolute; left:0; top:0; width:var(--mz); height:var(--mz); z-index:4; cursor:pointer; touch-action:none; }
  .pck-min { position:absolute; inset:0; }
  .pck-min > * { position:absolute; box-sizing:border-box; }
  .pck-mon.hop .pck-min { animation:pck-hop .18s ease-in-out infinite alternate; }
  .pck-body { left:10%; right:10%; top:14%; bottom:6%; background:var(--c); border:4px solid #111; border-radius:46% 46% 38% 38%; }
  .pck-hat { left:38%; top:-6%; width:24%; height:26%; background:repeating-linear-gradient(135deg, #ffd400 0 6px, #ff4f6d 6px 12px); border:3px solid #111; clip-path:polygon(50% 0, 100% 100%, 0 100%); z-index:2; }
  .pck-eye { top:24%; width:22%; aspect-ratio:1; background:#fff; border:3px solid #111; border-radius:50%; overflow:hidden; z-index:2; }
  .pck-eye.l { left:24%; } .pck-eye.r { right:24%; width:19%; top:26%; }
  .pck-eye i { position:absolute; left:28%; top:30%; width:46%; aspect-ratio:1; background:#111; border-radius:50%; animation:pck-roll 1.1s ease-in-out infinite alternate; }
  .pck-mouth { left:28%; right:28%; top:52%; height:26%; background:#5a0f1e; border:4px solid #111; border-radius:20% 20% 50% 50%; z-index:2; overflow:hidden; }
  .pck-mouth::before { content:""; position:absolute; left:6%; right:6%; top:0; height:22%; background:repeating-linear-gradient(90deg, #fff 0 22%, #ddd 22% 25%); }
  .pck-mouth::after { content:""; position:absolute; left:28%; right:28%; bottom:-10%; height:40%; background:#ff6f91; border-radius:50% 50% 0 0; }
  .pck-mon.chomp .pck-mouth { animation:pck-chomp .1s ease-in-out 6 alternate; }
  .pck-mon.bleh .pck-body { background:#a8d68a; } .pck-mon.bleh { animation:pck-shake .08s linear 6 alternate; }
  .pck-mon.bleh .pck-mouth { left:38%; right:38%; border-radius:50%; height:16%; }
  .pck-bub { position:absolute; left:58%; bottom:92%; padding:2px 10px; background:#fff; border:4px solid #111; border-radius:14px; font-weight:900; color:#111; line-height:1.1; white-space:nowrap; z-index:5;
    animation:pck-pop .25s cubic-bezier(.2,1.8,.4,1) both; display:flex; align-items:center; gap:4px; }
  .pck-bub .spk { font-size:.5em; }
  .pck-bub::after { content:""; position:absolute; left:8%; top:100%; width:14px; height:12px; background:#fff; border:4px solid #111; border-top:0; border-right:0; transform:skewX(30deg); margin-top:-3px; }
  /* The cake (--cr: its radius), seen from above, on a plate */
  .pck-plate { position:absolute; width:calc(var(--cr) * 2.24); height:calc(var(--cr) * 2.24); margin:calc(var(--cr) * -1.12) 0 0 calc(var(--cr) * -1.12); border-radius:50%; background:#fff; border:4px solid #111; box-shadow:0 6px 0 rgba(0,0,0,.2); z-index:1; }
  .pck-plate.in { animation:pck-in .4s cubic-bezier(.2,1.4,.4,1); }
  .pck-sl { position:absolute; left:0; top:0; width:calc(var(--cr) * 2); height:calc(var(--cr) * 2); z-index:2; pointer-events:none; }
  .pck-sl svg { position:absolute; inset:0; width:100%; height:100%; overflow:visible; }
  .pck-sl .w { stroke:#111; stroke-width:4; stroke-linejoin:round; }
  .pck-lbl { position:absolute; transform:translate(-50%, -50%); padding:0 5px; background:rgba(255,255,255,.9); border:3px solid #111; border-radius:9px; font-weight:900; color:#111; line-height:1.1; white-space:nowrap; }
  .pck-sl.right .pck-lbl { box-shadow:0 0 0 4px #fff, 0 0 0 8px #00b86b; }
  .pck-lines { position:absolute; left:0; top:0; width:calc(var(--cr) * 2); height:calc(var(--cr) * 2); z-index:3; pointer-events:none; overflow:visible; }
  .pck-lines .dot { fill:#fff; stroke:#111; stroke-width:2; }
  .pck-lines .dot.lit { fill:#ffd400; }
  .pck-lines .cut { stroke:#5a3a1a; stroke-width:5; stroke-linecap:round; }
  .pck-knife { position:absolute; left:0; top:0; z-index:7; font-size:2.2rem; line-height:1; pointer-events:none; opacity:0; }
  .pck-knife.on { opacity:1; }
  .pck-fx { position:absolute; inset:0; pointer-events:none; z-index:8; overflow:visible; }
  .pck-word { position:absolute; transform:translate(-50%, -50%) rotate(-8deg); font-size:1.8rem; color:#ffd400; -webkit-text-stroke:2px #111; paint-order:stroke fill;
    text-shadow:0 4px 0 #111; white-space:nowrap; animation:pck-word 1s ease-out forwards; }
  .pck-word.bad { color:#8fd16a; }
  @keyframes pck-roll { from { transform:translate(-25%, -15%); } to { transform:translate(25%, 15%); } }
  @keyframes pck-hop { to { transform:translateY(-6%); } }
  @keyframes pck-chomp { to { transform:scaleY(.4); } }
  @keyframes pck-shake { from { translate:-4px 0; } to { translate:4px 0; } }
  @keyframes pck-pop { from { transform:scale(.3); } }
  @keyframes pck-in { from { translate:60% 0; opacity:0; } }
  @keyframes pck-word { from { opacity:1; scale:.5; } 25% { scale:1.15; } 75% { opacity:1; } to { opacity:0; translate:0 -40px; } }
  @media (prefers-reduced-motion: reduce) { .pck-eye i, .pck-mon.hop .pck-min, .pck-mon.chomp .pck-mouth, .pck-mon.bleh, .pck-plate.in, .pck-word { animation:none !important; } }
  `;
  function injectCss() { if (document.getElementById("pck-css")) return; const s = document.createElement("style"); s.id = "pck-css"; s.textContent = CSS; document.head.appendChild(s); }

  registerMicrogame({
    id: "party-cake",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 28000,
    input: "drag",
    tutorial: true,

    start(ctx) {
      injectCss();
      const speed = ctx.speed || 1;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const { tone, sweep, noise } = ctx.sfx;
      const TOL = speed >= 1.75 ? 0.1 : 0.13;   // how close (a fraction of the cake's radius) the knife must pass a dot
      const S = ctx.choiceSteps(GOAL + MISSES, SLICES, { lowercase: true });
      let si = 0, st = S[0];

      const wrap = document.createElement("div");
      wrap.className = "pck";
      wrap.innerHTML = `<div class="pck-top"><div class="pck-pips hits">${'<span class="pck-pip"></span>'.repeat(GOAL)}</div><div class="pck-pips miss">${'<span class="pck-pip x"></span>'.repeat(MISSES)}</div></div>`;
      const room = document.createElement("div");
      room.className = "pck-room";
      const knife = document.createElement("div");
      knife.className = "pck-knife"; knife.textContent = "🔪";
      const fx = document.createElement("div");
      fx.className = "pck-fx";
      room.append(knife, fx);
      wrap.appendChild(room);
      ctx.root.appendChild(wrap);
      const hitPips = wrap.querySelector(".hits").children, missPips = wrap.querySelector(".miss").children;

      let W = 0, H = 0, cr = 100, cx = 0, cy = 0, mz = 100, mx = 0, my = 0;
      function layout() {
        W = room.clientWidth; H = room.clientHeight;
        mz = Math.max(60, Math.min(H * 0.4, W * 0.26, 160));
        cr = Math.max(60, Math.min(H * 0.43, (W - mz - 40) * 0.44, 210));
        cx = W - cr * 1.12 - Math.max(10, (W - mz - cr * 2.24) * 0.3); cy = H / 2 + 4;
        mx = Math.max(mz / 2 + 6, (cx - cr * 1.12) / 2); my = H - mz / 2 - 8;
        room.style.setProperty("--cr", `${cr}px`); room.style.setProperty("--mz", `${mz}px`);
        if (cake) placeCake();
        if (mon && !mon.dataset.walking) mon.style.transform = `translate(${mx - mz / 2}px, ${my - mz / 2}px)`;
      }

      // ---------- The cake: 6 slices, 6 cut lines between them ----------
      const angOf = (j) => -Math.PI / 2 - Math.PI / SLICES + (j * 2 * Math.PI) / SLICES;   // line j; slice k is between lines k and k+1
      let cake = null;   // { plate, slices: [{ el, o, k, free }], lines: [{ dots, cut }], svg }
      function newCake() {
        if (cake) { cake.plate.remove(); cake.slices.forEach((s) => s.el.remove()); cake.svg.remove(); }
        const plate = document.createElement("div");
        plate.className = "pck-plate in";
        room.insertBefore(plate, knife);
        const icing = ICING[si % ICING.length];
        const opts = ctx.shuffle(st.row.slice());
        const slices = opts.map((o, k) => {
          const el = document.createElement("div");
          el.className = "pck-sl";
          const a0 = angOf(k), a1 = angOf(k + 1), r = 50;
          const p = (a) => `${(50 + Math.cos(a) * r).toFixed(2)} ${(50 + Math.sin(a) * r).toFixed(2)}`;
          // a sprinkle or two on each slice, in a random colour
          const sp = [...Array(3)].map(() => { const a = a0 + (a1 - a0) * (0.2 + Math.random() * 0.6), d = 30 + Math.random() * 16;
            return `<rect x="${(50 + Math.cos(a) * d).toFixed(1)}" y="${(50 + Math.sin(a) * d).toFixed(1)}" width="3" height="1.2" rx=".6" fill="${["#ff4f6d", "#3d8bfd", "#4dd36b", "#ffd400"][Math.floor(Math.random() * 4)]}" transform="rotate(${Math.floor(Math.random() * 180)} ${(50 + Math.cos(a) * d).toFixed(1)} ${(50 + Math.sin(a) * d).toFixed(1)})"/>`; }).join("");
          el.innerHTML = `<svg viewBox="0 0 100 100"><path class="w" d="M50 50 L${p(a0)} A50 50 0 0 1 ${p(a1)} Z" fill="${icing}" vector-effect="non-scaling-stroke"/>` +
            `<path d="M50 50 L${p(a0)} A50 50 0 0 1 ${p(a1)} Z" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="2 3" opacity=".7" transform="scale(.9) translate(5.5 5.5)"/>${sp}</svg><span class="pck-lbl"></span>`;
          el.querySelector(".pck-lbl").textContent = o.text;
          room.insertBefore(el, knife);
          return { el, o, k, free: false };
        });
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("class", "pck-lines");
        room.insertBefore(svg, knife);
        const lines = [...Array(SLICES)].map((_, j) => ({ j, dots: [...Array(DOTS)].map((_, d) => ({ f: 0.12 + (0.88 * d) / (DOTS - 1), lit: false })), cut: false }));
        cake = { plate, slices, lines, svg };
        placeCake();
      }
      function placeCake() {
        cake.plate.style.left = `${cx}px`; cake.plate.style.top = `${cy}px`;
        cake.slices.forEach((s) => {
          if (s.free) return;
          s.el.style.transform = `translate(${cx - cr}px, ${cy - cr}px)`;
          const a = (angOf(s.k) + angOf(s.k + 1)) / 2, lb = s.el.querySelector(".pck-lbl");
          lb.style.left = `${cr + Math.cos(a) * cr * 0.6}px`; lb.style.top = `${cr + Math.sin(a) * cr * 0.6}px`;
          lb.style.fontSize = `${s.o.kind === "pic" ? cr * 0.26 : Math.min(cr * 0.24, (cr * 0.62) / ([...s.o.text].length * 0.62))}px`;
        });
        cake.svg.style.transform = `translate(${cx - cr}px, ${cy - cr}px)`;
        drawLines();
      }
      const dotAt = (j, f) => [cr + Math.cos(angOf(j)) * cr * f, cr + Math.sin(angOf(j)) * cr * f];
      function drawLines() {
        let h = "";
        cake.lines.forEach((l) => {
          if (l.cut) { const [x0, y0] = dotAt(l.j, 0), [x1, y1] = dotAt(l.j, 1); h += `<line class="cut" x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}"/>`; return; }
          l.dots.forEach((d) => { const [x, y] = dotAt(l.j, d.f); h += `<circle class="dot${d.lit ? " lit" : ""}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${Math.max(3.5, cr * 0.035).toFixed(1)}"/>`; });
        });
        cake.svg.innerHTML = h;
      }

      // ---------- The customer ----------
      let mon = null;
      function newMonster() {
        if (mon) mon.remove();
        mon = document.createElement("div");
        mon.className = "pck-mon hop";
        mon.style.setProperty("--c", MONS[si % MONS.length]);
        mon.setAttribute("role", "button"); mon.setAttribute("aria-label", TEXT.custLabel);
        mon.innerHTML = '<div class="pck-min"><div class="pck-body"></div><div class="pck-hat"></div><div class="pck-eye l"><i></i></div><div class="pck-eye r"><i></i></div><div class="pck-mouth"></div></div>';
        mon.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); if (!done) ctx.say(st.prompt); });
        room.insertBefore(mon, knife);
        // hops in from the left
        mon.dataset.walking = "1";
        const t0 = performance.now(), ms = reduceMotion ? 1 : 600;
        (function walk(now) {
          const k = Math.min(1, (now - t0) / ms);
          mon.style.transform = `translate(${-mz + (mx + mz / 2) * k - mz / 2 + mz / 2 * 0}px, ${my - mz / 2}px)`;
          if (k < 1) { ctx.raf(walk); return; }
          delete mon.dataset.walking;
          mon.style.transform = `translate(${mx - mz / 2}px, ${my - mz / 2}px)`;
          mon.classList.remove("hop");
          const b = document.createElement("div");
          b.className = "pck-bub";
          b.innerHTML = '<span class="t"></span>';
          b.firstChild.textContent = st.listen ? st.target.text : st.cardText;
          if (ctx.canSpeak) b.insertAdjacentHTML("beforeend", '<span class="spk">🔊</span>');
          b.style.fontSize = `${Math.min(mz * 0.3, 34)}px`;
          mon.appendChild(b);
          ctx.say(st.prompt);
          busy = false;
        })(t0);
      }

      // ---------- Cutting ----------
      let done = false, busy = true, hits = 0, missN = 0, last = null, lastSnd = 0;
      const local = (e) => { const r = room.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
      room.addEventListener("pointerdown", (e) => { e.preventDefault(); last = local(e); knife.classList.add("on"); moveKnife(last); cutAt(last); });
      room.addEventListener("pointermove", (e) => { if (!last) return; const p = local(e), a = last; moveKnife(p); last = p; const n = Math.max(1, Math.ceil(Math.hypot(p.x - a.x, p.y - a.y) / 5)); for (let k = 1; k <= n && last; k++) cutAt({ x: a.x + (p.x - a.x) * k / n, y: a.y + (p.y - a.y) * k / n }); });
      const up = () => { last = null; knife.classList.remove("on"); };
      room.addEventListener("pointerup", up);
      room.addEventListener("pointercancel", up);
      function moveKnife(p) { knife.style.transform = `translate(${p.x - 8}px, ${p.y - 34}px) rotate(-20deg)`; }
      function cutAt(p) {
        if (done || busy || ctx.ended || !cake) return;
        let any = false;
        for (const l of cake.lines) {
          if (l.cut) continue;
          for (const d of l.dots) {
            if (d.lit) continue;
            const [x, y] = dotAt(l.j, d.f);
            if (Math.hypot(cx - cr + x - p.x, cy - cr + y - p.y) < cr * TOL + 6) { d.lit = true; any = true; }
          }
          if (l.dots.filter((d) => d.lit).length >= DOTS * LINE_DONE) { l.cut = true; tone(500 + cake.lines.filter((x) => x.cut).length * 60, 0.06, "triangle", 0.07); }
        }
        if (!any) return;
        const now = performance.now();
        if (now - lastSnd > 90) { lastSnd = now; noise(0.05, "bandpass", 1400, 700, 0.12); }   // squish squish
        drawLines();
        // a slice with both its lines cut comes free
        const s = cake.slices.find((x) => !x.free && cake.lines[x.k].cut && cake.lines[(x.k + 1) % SLICES].cut);
        if (s) serve(s);
      }

      // ---------- Serving ----------
      function serve(s) {
        s.free = true; busy = true; up();
        const tx = mx - cr, ty = my - cr - mz * 0.1;
        s.el.style.zIndex = 6;
        const a = s.el.animate([{ transform: s.el.style.transform }, { transform: `translate(${tx}px, ${ty - cr * 0.5}px) scale(.55) rotate(-30deg)`, offset: 0.6 }, { transform: `translate(${tx}px, ${ty}px) scale(.3) rotate(-50deg)` }],
          { duration: reduceMotion ? 1 : 700, easing: "ease-in-out", fill: "forwards" });
        sweep(400, 900, 0.3, "triangle", 0.05);
        ctx.later(() => (s.o.right ? yum(s) : bleh(s, a)), reduceMotion ? 10 : 700);
      }
      function yum(s) {
        s.el.remove();
        mon.querySelector(".pck-bub")?.remove();
        mon.classList.add("chomp");
        [523, 659, 784].forEach((f, k) => tone(f, 0.09, "triangle", 0.09, k * 0.07));
        word(TEXT.yum[hits % TEXT.yum.length], false, mx, my - mz * 0.8);
        if (s.o.kind === "pic") ctx.say(s.o.spoken); else ctx.say(st.answer);
        hitPips[hits].classList.add("on");
        hits++;
        if (hits >= GOAL) { done = true; ctx.win(); ctx.later(() => { word(TEXT.win, W / 2, H * 0.2); ctx.confetti(fx, W / 2, H * 0.4, { count: 90 }); }, 500); return; }
        // The beat: the customer skips off, the next one comes for a fresh cake.
        ctx.later(() => {
          if (done) return;
          ctx.pauseTimer(900);
          const m = mon; m.classList.remove("chomp"); m.classList.add("hop");
          m.animate([{ transform: m.style.transform }, { transform: `translate(${-mz * 1.4}px, ${my - mz / 2}px)` }], { duration: 400, fill: "forwards" });
          ctx.later(() => m.remove(), 420);
          mon = null;
          st = S[++si];
          ctx.later(() => { newCake(); newMonster(); }, 450);
        }, 800);
      }
      function bleh(s, a) {
        mon.classList.add("bleh");
        sweep(700, 250, 0.4, "square", 0.07);
        word(TEXT.bleh, true, mx, my - mz * 0.8);
        if (s.o.kind === "pic") ctx.say(s.o.spoken);
        missPips[missN].classList.add("on");
        missN++;
        // spat out: it drops off the bottom
        s.el.animate([{ transform: `translate(${mx - cr}px, ${my - cr - mz * 0.1}px) scale(.3)` }, { transform: `translate(${mx - cr + mz}px, ${H}px) scale(.3) rotate(200deg)`, opacity: 0 }], { duration: 600, fill: "forwards" });
        ctx.later(() => { a.cancel(); s.el.remove(); mon && mon.classList.remove("bleh"); }, 620);
        if (missN >= MISSES) { done = true; ctx.lose(); showRight(); return; }
        ctx.later(() => { busy = false; }, 650);
      }
      function showRight() { if (cake) cake.slices.forEach((x) => { if (x.o.right && !x.free) x.el.classList.add("right"); }); ctx.say(st.answer); }
      function word(text, bad, x, y) {
        const w = document.createElement("div");
        w.className = "pck-word" + (bad ? " bad" : "");
        w.textContent = text;
        w.style.left = `${Math.max(90, Math.min(W - 90, x))}px`; w.style.top = `${Math.max(26, y)}px`;
        fx.appendChild(w);
        ctx.later(() => w.remove(), 1000);
      }

      ctx.onTimeout(() => { done = true; up(); showRight(); });

      layout();
      const ro = new ResizeObserver(layout);
      ro.observe(room);
      newCake();
      newMonster();

      // Tutorial: for each customer, point at the order, then cut the two lines either side of the right slice.
      const pt = (j, f) => () => { const rr = ctx.root.getBoundingClientRect(), r = room.getBoundingClientRect(), [x, y] = dotAt(j, f); return { x: r.left - rr.left + cx - cr + x, y: r.top - rr.top + cy - cr + y }; };
      ctx.tutorial(S.slice(0, GOAL).map((s) => s.target), async (f) => {
        for (let n = 0; n < GOAL && !done; n++) {
          await f.until(() => !busy && si === n && mon, 5000);
          await f.point(() => mon.querySelector(".pck-bub") || mon, 600);
          const s = cake.slices.find((x) => x.o.right);
          for (const j of [s.k, (s.k + 1) % SLICES]) {
            if (cake.lines[j].cut) continue;
            await f.path([pt(j, 0.08), pt(j, 0.55), pt(j, 1.02)], 260);
          }
          await f.until(() => hits > n || done, 2500);
        }
      });
      return () => { done = true; ro.disconnect(); };
    },
  });
})();
