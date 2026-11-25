// PLUG IT IN — a draw-a-line game (Claude's idea; pairs from `ctx.matchPairs`). Sleepy gadgets sit on a shelf down
// the left (a TV, a lamp, a fan, a radio), each with half of a pair on its screen and a cable dangling. Sockets
// down the right wall show the other halves. Drag a plug from a gadget to its socket (or tap one, then the other):
// CLICK, the gadget wakes up (eyes open, it lights up and does its thing: music, light, wind, a rainbow). A wrong
// socket: ZAP, sparks and a puff of smoke, ✕. Plug everything in to win; 3 zaps lose.
(function () {
  const TEXT = {
    name: { en: "Plug It In" },
    icon: "🔌",
    howTo: { en: {
      steps: [
        ["📺", "Each sleepy gadget needs the socket that matches its screen."],
        ["🔌", "Drag the plug from a gadget to its socket (or tap the gadget, then the socket)."],
        ["⚡", "CLICK! It wakes up. Plug them all in to win."],
      ],
      tips: ["A wrong socket goes ZAP! Three zaps and it's over.", "Capitals go with small letters, letters with pictures, words with pictures.", "When the game speeds up, there are 4 gadgets."],
    } },
    instruction: { en: "PLUG IT IN!" },
    gadgetLabel: (t) => `Gadget with ${t}`,
    socketLabel: (t) => `Socket with ${t}`,
    on: ["CLICK!", "IT WORKS!", "POWER ON!", "ZING!"],
    zap: "ZAP!",
  };
  const MISSES = 3;
  // The gadgets (the teacher asked for each to be a different thing): a TV, a lamp that lights up, a fan that
  // starts blowing, and (with 4) a toaster that pops up toast. A colour, its drawing, and what puffs out when it's on.
  const GADGETS = [
    { kind: "tv", c: "#3d8bfd", fx: ["🌈", "⭐"], html: '<div class="plg-box"></div>' },
    { kind: "lamp", c: "#ffd400", fx: ["✨", "💡"], html: '<div class="plg-glow"></div><div class="plg-pole"></div><div class="plg-base"></div><div class="plg-shade"></div><div class="plg-bulb"></div>' },
    { kind: "fan", c: "#4dd36b", fx: ["💨", "🍃"], html: '<div class="plg-stand"></div><div class="plg-base"></div><div class="plg-cage"><div class="plg-blades"></div></div><div class="plg-wind"></div>' },
    { kind: "toaster", c: "#ff6fb0", fx: ["🍞", "✨"], html: '<div class="plg-toast a"></div><div class="plg-toast b"></div><div class="plg-box"></div>' },
  ];

  const CSS = `
  .plg { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:6px; padding-bottom:6px; }
  .plg-pips { flex:none; display:flex; gap:5px; min-height:28px; align-items:center; }
  .plg-pip { width:24px; height:24px; border:3px solid #111; border-radius:50%; background:#fff; }
  .plg-pip.x { background:#ffd400; } .plg-pip.x::after { content:"⚡"; display:block; text-align:center; font-size:13px; line-height:18px; }
  .plg-room { position:relative; flex:1; min-height:0; width:100%; max-width:620px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111;
    background:linear-gradient(90deg, transparent 0 70%, #d9c7a8 70%), repeating-linear-gradient(0deg, #f6ecd8 0 30px, #efe1c6 30px 32px); touch-action:none; }
  .plg-room::before { content:""; position:absolute; left:70%; top:0; bottom:0; width:6px; background:#a8865a; border-left:3px solid #111; }   /* the wall's edge */
  .plg-svg { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; z-index:3; overflow:visible; }
  .plg-svg path { fill:none; stroke-linecap:round; }
  .plg-svg .o { stroke:#111; stroke-width:9; } .plg-svg .i { stroke:#555; stroke-width:4; }
  .plg-svg .plug { fill:#e0e0e0; stroke:#111; stroke-width:3; }
  .plg-svg .bad .i { stroke:#ff5a6e; }
  /* A gadget (--gz): a box with a screen showing its half, googly eyes on top (shut while it's off) */
  .plg-gad { position:absolute; width:var(--gz); height:calc(var(--gz) * .9); margin:calc(var(--gz) * -.45) 0 0 calc(var(--gz) / -2); z-index:2; cursor:pointer; touch-action:none; }
  .plg-gad > * { position:absolute; box-sizing:border-box; pointer-events:none; }
  .plg-box { inset:14% 0 0 0; background:var(--c); border:4px solid #111; border-radius:14px; box-shadow:inset -6px -6px 0 rgba(0,0,0,.15); }
  .plg-scr { left:14%; right:14%; top:30%; bottom:14%; background:#2a3140; border:3px solid #111; border-radius:8px; z-index:2; display:flex; align-items:center; justify-content:center;
    font-weight:900; color:#fff; line-height:1; white-space:nowrap; transition:background .2s; }
  .plg-gad.on .plg-scr { background:#fff6b0; color:#111; box-shadow:0 0 18px 6px rgba(255,240,120,.8); }
  .plg-eye { top:0; width:24%; aspect-ratio:1; background:#fff; border:3px solid #111; border-radius:50%; overflow:hidden; z-index:3; }
  .plg-eye.l { left:18%; } .plg-eye.r { right:18%; width:20%; top:2%; }
  .plg-eye i { position:absolute; left:28%; top:30%; width:46%; aspect-ratio:1; background:#111; border-radius:50%; animation:plg-roll 1.2s ease-in-out infinite alternate; }
  .plg-eye::after { content:""; position:absolute; inset:0; background:var(--c); border-bottom:3px solid #111; transform-origin:50% 0; transition:transform .2s; }   /* a sleepy eyelid */
  .plg-gad.on .plg-eye::after { transform:scaleY(0); }
  .plg-gad:not(.on) .plg-eye::after { transform:scaleY(.62); }
  .plg-gad.on { animation:plg-jig .25s ease-in-out infinite alternate; }
  .plg-gad.smoke { filter:brightness(.6); }
  .plg-gad.sel .plg-scr, .plg-sock.sel .plg-plate { box-shadow:0 0 0 5px #fff, 0 0 0 10px #ffd400; }
  /* The lamp: a shade with the label and the eyes, a bulb, a pole and a base; on, the bulb glows and a cone of light shines down */
  .k-lamp .plg-shade { left:8%; right:8%; top:2%; height:56%; background:var(--c); border:4px solid #111; clip-path:polygon(22% 0, 78% 0, 100% 100%, 0 100%); }
  .k-lamp .plg-scr { left:24%; right:24%; top:22%; bottom:48%; }
  .k-lamp .plg-eye { top:-6%; } .k-lamp .plg-eye.l { left:24%; width:22%; } .k-lamp .plg-eye.r { right:24%; width:18%; }
  .k-lamp .plg-bulb { left:40%; right:40%; top:56%; height:14%; background:#e0e0e0; border:3px solid #111; border-radius:0 0 50% 50%; }
  .k-lamp .plg-pole { left:46%; right:46%; top:60%; bottom:10%; background:#555; border:3px solid #111; }
  .k-lamp .plg-base { left:22%; right:22%; bottom:0; height:12%; background:#555; border:3px solid #111; border-radius:50% 50% 8px 8px; }
  .k-lamp .plg-glow { left:-10%; right:-10%; top:56%; bottom:-6%; background:linear-gradient(180deg, rgba(255,240,120,.85), rgba(255,240,120,0)); clip-path:polygon(38% 0, 62% 0, 100% 100%, 0 100%); opacity:0; transition:opacity .25s; }
  .k-lamp.on .plg-glow { opacity:1; }
  .k-lamp.on .plg-bulb { background:#fff6b0; box-shadow:0 0 22px 10px #ffe066; }
  /* The fan: a round cage of blades on a stand, the label on its base; on, the blades whizz round and wind blows */
  .k-fan .plg-cage { left:10%; right:10%; top:0; height:66%; border:4px solid #111; border-radius:50%; background:repeating-radial-gradient(circle, transparent 0 9%, rgba(0,0,0,.25) 9% 11%), rgba(255,255,255,.6); overflow:hidden; }
  .k-fan .plg-blades { position:absolute; inset:8%; border-radius:50%; background:conic-gradient(var(--c) 0 40deg, transparent 40deg 120deg, var(--c) 120deg 160deg, transparent 160deg 240deg, var(--c) 240deg 280deg, transparent 280deg);
    box-shadow:inset 0 0 0 calc(var(--gz) * .12) transparent; }
  .k-fan .plg-blades::after { content:""; position:absolute; left:38%; top:38%; width:24%; height:24%; border-radius:50%; background:#555; border:3px solid #111; }
  .k-fan.on .plg-blades { animation:plg-whirr .18s linear infinite; }
  .k-fan .plg-stand { left:44%; right:44%; top:60%; bottom:22%; background:#555; border:3px solid #111; }
  .k-fan .plg-base { left:8%; right:8%; bottom:0; height:26%; background:var(--c); border:4px solid #111; border-radius:10px; }
  .k-fan .plg-scr { left:14%; right:14%; bottom:3%; top:auto; height:20%; }
  .k-fan .plg-eye { top:16%; z-index:4; } .k-fan .plg-eye.l { left:22%; width:20%; } .k-fan .plg-eye.r { right:22%; width:17%; }
  .k-fan .plg-eye::after { background:#e8e8e8; }
  .k-fan .plg-wind { left:96%; top:10%; width:60%; height:50%; opacity:0; background:repeating-linear-gradient(0deg, transparent 0 18%, rgba(255,255,255,.95) 18% 24%); border-radius:0 50% 50% 0; }
  .k-fan.on .plg-wind { animation:plg-blow .4s linear infinite; }
  /* The toaster: a rounded box with two slots, the label on its front; on, two slices of toast pop up */
  .k-toaster .plg-box { top:30%; border-radius:30% 30% 14px 14px / 40% 40% 14px 14px; }
  .k-toaster .plg-box::before { content:""; position:absolute; left:16%; right:16%; top:8%; height:8%; background:repeating-linear-gradient(90deg, #111 0 44%, transparent 44% 56%, #111 56%); border-radius:4px; }
  .k-toaster .plg-scr { top:50%; bottom:10%; left:18%; right:18%; }
  .k-toaster .plg-eye { top:24%; } .k-toaster .plg-eye.l { left:22%; } .k-toaster .plg-eye.r { right:22%; }
  .k-toaster .plg-toast { top:22%; width:26%; height:30%; background:#e0a050; border:3px solid #111; border-radius:30% 30% 4px 4px; box-shadow:inset 0 0 0 4px #f6d08a; transition:transform .25s cubic-bezier(.2,1.8,.4,1); }
  .k-toaster .plg-toast.a { left:20%; } .k-toaster .plg-toast.b { right:20%; }
  .k-toaster.on .plg-toast { transform:translateY(-90%) rotate(-8deg); } .k-toaster.on .plg-toast.b { transform:translateY(-110%) rotate(10deg); }
  @keyframes plg-whirr { to { transform:rotate(360deg); } }
  @keyframes plg-blow { from { opacity:.9; transform:translateX(0); } to { opacity:0; transform:translateX(40%); } }
  .plg-gad.right .plg-scr, .plg-sock.right .plg-lbl { box-shadow:0 0 0 4px #fff, 0 0 0 8px #00b86b; }
  .plg-gad.done, .plg-sock.done { pointer-events:none; }
  /* A wall socket (--sz) with its half on a label above */
  .plg-sock { position:absolute; width:var(--sz); height:var(--sz); margin:calc(var(--sz) / -2) 0 0 calc(var(--sz) / -2); z-index:2; cursor:pointer; touch-action:none; }
  .plg-sock > * { position:absolute; pointer-events:none; }
  .plg-plate { left:18%; right:18%; top:34%; bottom:4%; background:#fff; border:4px solid #111; border-radius:12px; box-shadow:0 4px 0 #111;
    background-image:radial-gradient(ellipse 9% 16% at 36% 50%, #111 90%, transparent), radial-gradient(ellipse 9% 16% at 64% 50%, #111 90%, transparent); }
  .plg-lbl { left:50%; top:-4%; transform:translateX(-50%); padding:2px 8px; background:#fff; border:3px solid #111; border-radius:10px; box-shadow:0 3px 0 #111;
    font-weight:900; color:#111; line-height:1.1; white-space:nowrap; z-index:2; }
  .plg-fx { position:absolute; inset:0; pointer-events:none; z-index:8; overflow:visible; }
  .plg-pop { position:absolute; line-height:1; transform:translate(-50%, -50%); pointer-events:none; }
  .plg-word { position:absolute; transform:translate(-50%, -50%) rotate(-8deg); font-size:1.9rem; color:#ffd400; -webkit-text-stroke:2px #111; paint-order:stroke fill;
    text-shadow:0 4px 0 #111; white-space:nowrap; animation:plg-word 1s ease-out forwards; }
  .plg-word.bad { color:#7cf0ff; }
  @keyframes plg-roll { from { transform:translate(-25%, -15%); } to { transform:translate(25%, 15%); } }
  @keyframes plg-jig { from { rotate:-4deg; } to { rotate:4deg; } }
  @keyframes plg-word { from { opacity:1; scale:.5; } 25% { scale:1.15; } 75% { opacity:1; } to { opacity:0; translate:0 -40px; } }
  @media (prefers-reduced-motion: reduce) { .plg-eye i, .plg-gad.on, .plg-word, .k-fan.on .plg-blades, .k-fan.on .plg-wind { animation:none !important; } }
  `;
  function injectCss() { if (document.getElementById("plg-css")) return; const s = document.createElement("style"); s.id = "plg-css"; s.textContent = CSS; document.head.appendChild(s); }

  registerMicrogame({
    id: "plug-it-in",
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
      const looks = ctx.shuffle(GADGETS.slice(0, N));   // (always a TV, a lamp and a fan; the toaster joins with 4)

      const wrap = document.createElement("div");
      wrap.className = "plg";
      wrap.innerHTML = `<div class="plg-pips">${'<span class="plg-pip"></span>'.repeat(MISSES)}</div>`;
      const room = document.createElement("div");
      room.className = "plg-room";
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("class", "plg-svg");
      const fx = document.createElement("div");
      fx.className = "plg-fx";
      room.append(svg, fx);
      wrap.appendChild(room);
      ctx.root.appendChild(wrap);
      const missPips = wrap.querySelector(".plg-pips").children;

      const gads = P.map((p, i) => {
        const look = looks[i % looks.length];
        const el = document.createElement("div");
        el.className = `plg-gad k-${look.kind}`;
        el.style.setProperty("--c", look.c);
        el.setAttribute("aria-label", TEXT.gadgetLabel(p.a.spoken));
        el.innerHTML = look.html + '<div class="plg-scr"></div><div class="plg-eye l"><i></i></div><div class="plg-eye r"><i></i></div>';
        el.querySelector(".plg-scr").textContent = p.a.text;
        room.insertBefore(el, svg);
        return { el, p, look, side: "a", x: 0, y: 0, done: false };
      });
      const socks = ctx.shuffle(P.slice()).map((p) => {
        const el = document.createElement("div");
        el.className = "plg-sock";
        el.setAttribute("aria-label", TEXT.socketLabel(p.b.spoken));
        el.innerHTML = '<div class="plg-plate"></div><div class="plg-lbl"></div>';
        el.querySelector(".plg-lbl").textContent = p.b.text;
        room.insertBefore(el, svg);
        return { el, p, side: "b", x: 0, y: 0, done: false };
      });

      let W = 0, H = 0, gz = 90, sz = 80;
      function layout() {
        W = room.clientWidth; H = room.clientHeight;
        const row = H / N;
        gz = Math.max(60, Math.min(row * 0.95, W * 0.26, 130));
        sz = Math.max(56, Math.min(row * 0.9, W * 0.22, 110));
        room.style.setProperty("--gz", `${gz}px`); room.style.setProperty("--sz", `${sz}px`);
        gads.forEach((g, i) => { g.x = W * 0.2; g.y = row * (i + 0.5); g.el.style.left = `${g.x}px`; g.el.style.top = `${g.y}px`;
          // (the label area is smaller on the lamp's shade and the fan's base than on the TV's screen)
          const k = g.look.kind === "tv" ? 1 : g.look.kind === "toaster" ? 0.85 : 0.62;
          g.el.querySelector(".plg-scr").style.fontSize = `${g.p.a.kind === "word" ? Math.min(gz * 0.28 * k, (gz * 0.66 * k) / ([...g.p.a.text].length * 0.62)) : gz * 0.32 * k}px`; });
        socks.forEach((s, i) => { s.x = W * 0.85; s.y = row * (i + 0.5); s.el.style.left = `${s.x}px`; s.el.style.top = `${s.y}px`;
          s.el.querySelector(".plg-lbl").style.fontSize = `${s.p.b.kind === "pic" ? sz * 0.34 : Math.min(sz * 0.3, (sz * 0.9) / ([...s.p.b.text].length * 0.62))}px`; });
        cables.forEach(drawCable);
      }
      const plugOf = (g) => ({ x: g.x + gz * 0.5, y: g.y + gz * 0.3 });        // the cable comes out of the gadget's side
      const holeOf = (s) => ({ x: s.x, y: s.y + sz * 0.2 });

      // ---------- Cables (SVG): a sagging cable with a plug on the end ----------
      const cables = [];
      function makeCable() {
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.innerHTML = '<path class="o"/><path class="i"/><rect class="plug" width="22" height="14" rx="3"/>';
        svg.appendChild(g);
        const c = { g, a: { x: 0, y: 0 }, b: { x: 0, y: 0 } };
        cables.push(c);
        return c;
      }
      function drawCable(c) {
        const mx = (c.a.x + c.b.x) / 2, my = Math.max(c.a.y, c.b.y) + 30 + Math.abs(c.b.x - c.a.x) * 0.12;   // it droops
        const d = `M${c.a.x.toFixed(1)} ${c.a.y.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${c.b.x.toFixed(1)} ${c.b.y.toFixed(1)}`;
        c.g.children[0].setAttribute("d", d); c.g.children[1].setAttribute("d", d);
        const ang = Math.atan2(c.b.y - my, c.b.x - mx) * 57.3;
        c.g.children[2].setAttribute("transform", `translate(${c.b.x.toFixed(1)} ${c.b.y.toFixed(1)}) rotate(${ang.toFixed(1)}) translate(-14 -7)`);
      }
      function dropCable(c) { c.g.remove(); const k = cables.indexOf(c); if (k >= 0) cables.splice(k, 1); }

      // ---------- Dragging (or tap, then tap) ----------
      let done = false, busy = false, drag = null, sel = null, missN = 0, lit = 0;
      const local = (e) => { const r = room.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
      const near = (list, p, rad) => list.filter((o) => !o.done).map((o) => ({ o, d: Math.hypot(o.x - p.x, o.y - p.y) })).filter((z) => z.d < rad).sort((u, v) => u.d - v.d)[0]?.o;
      const hit = (p) => near(gads, p, gz * 0.6) || near(socks, p, sz * 0.6);
      const end = (o) => (o.side === "a" ? plugOf(o) : holeOf(o));
      room.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        if (done || busy || ctx.ended) return;
        const p = local(e), o = hit(p);
        if (!o) { clearSel(); return; }
        if (sel && sel.side !== o.side) { const s = sel; clearSel(); join(s, o); return; }
        const c = makeCable();
        c.a = end(o); c.b = p;
        drawCable(c);
        drag = { from: o, c, start: p, moved: false };
      });
      room.addEventListener("pointermove", (e) => {
        if (!drag) return;
        const p = local(e);
        if (Math.hypot(p.x - drag.start.x, p.y - drag.start.y) > 14) drag.moved = true;
        drag.c.b = p;
        drawCable(drag.c);
      });
      room.addEventListener("pointerup", (e) => {
        if (!drag) return;
        const d = drag; drag = null;
        const p = e.clientX != null ? local(e) : d.c.b;
        dropCable(d.c);
        if (!d.moved) { select(d.from); return; }
        const to = d.from.side === "a" ? near(socks, p, sz * 0.75) : near(gads, p, gz * 0.75);
        if (to) join(d.from, to);
      });
      room.addEventListener("pointercancel", () => { if (drag) { dropCable(drag.c); drag = null; } });
      function select(o) { clearSel(); sel = o; o.el.classList.add("sel"); tone(660, 0.05, "triangle", 0.06); }
      function clearSel() { if (sel) sel.el.classList.remove("sel"); sel = null; }

      function join(x, y) {
        const g = x.side === "a" ? x : y, s = x.side === "a" ? y : x;
        const c = makeCable();
        c.a = plugOf(g); c.b = holeOf(s);
        drawCable(c);
        if (g.p === s.p) powerOn(g, s); else zap(g, s, c);
      }
      function powerOn(g, s) {
        g.done = s.done = true;
        g.el.classList.add("done", "on"); s.el.classList.add("done");
        noise(0.03, "highpass", 3000, 4000, 0.3); tone(220, 0.05, "square", 0.08);   // click
        ctx.later(() => { sweep(300, 900, 0.25, "square", 0.06); }, 80);              // hummm up
        word(TEXT.on[lit % TEXT.on.length], false, g.x, g.y - gz * 0.5);
        for (let k = 0; k < 5; k++) ctx.later(() => pop(g.look.fx[k % 2], g.x + (Math.random() - 0.3) * gz, g.y - gz * 0.3), k * 120);
        ctx.say(g.p.say);
        lit++;
        if (lit >= P.length) { done = true; ctx.win(); ctx.confetti(fx, W / 2, H * 0.4, { count: 90 }); [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, "triangle", 0.1, 0.3 + i * 0.08)); }
      }
      function zap(g, s, c) {
        busy = true;
        c.g.classList.add("bad");
        noise(0.25, "highpass", 2000, 5000, 0.4); sweep(900, 200, 0.3, "sawtooth", 0.08);   // ZAP
        word(TEXT.zap, true, s.x - sz * 0.3, s.y - sz * 0.6);
        for (let k = 0; k < 4; k++) pop("⚡", s.x + (Math.random() - 0.5) * sz, s.y + (Math.random() - 0.5) * sz);
        g.el.classList.add("smoke"); pop("💨", g.x, g.y - gz * 0.4);
        missPips[missN].classList.add("x");
        missN++;
        ctx.later(() => { dropCable(c); g.el.classList.remove("smoke"); busy = false; }, 500);
        if (missN >= MISSES) { done = true; ctx.lose(); ctx.later(showAnswer, 550); }
      }
      function showAnswer() { gads.forEach((g) => { if (!g.done) { g.el.classList.add("right"); socks.find((s) => s.p === g.p).el.classList.add("right"); } }); }
      function pop(e, x, y) {
        if (reduceMotion) return;
        const p = document.createElement("div");
        p.className = "plg-pop"; p.textContent = e; p.style.fontSize = `${gz * 0.28}px`;
        p.style.left = `${x}px`; p.style.top = `${y}px`;
        fx.appendChild(p);
        p.animate([{ transform: "translate(-50%, -50%) scale(.4)", opacity: 1 }, { transform: `translate(calc(-50% + ${(Math.random() - 0.5) * 60}px), calc(-50% - 60px)) scale(1.1)`, opacity: 0 }], { duration: 800, fill: "forwards" });
        ctx.later(() => p.remove(), 820);
      }
      function word(text, bad, x, y) {
        const w = document.createElement("div");
        w.className = "plg-word" + (bad ? " bad" : "");
        w.textContent = text;
        w.style.left = `${Math.max(80, Math.min(W - 80, x))}px`; w.style.top = `${Math.max(26, y)}px`;
        fx.appendChild(w);
        ctx.later(() => w.remove(), 1000);
      }

      ctx.onTimeout(() => { done = true; clearSel(); showAnswer(); });

      layout();
      const ro = new ResizeObserver(layout);
      ro.observe(room);
      ctx.later(() => { const a = gads[0]; ctx.hint({ x: room.offsetLeft + W * 0.4, y: room.offsetTop + a.y }, { x: room.offsetLeft + W * 0.62, y: room.offsetTop + a.y }, { small: true }); }, 80);

      // Tutorial: drag each gadget's plug to its socket.
      ctx.tutorial(P.map((p) => p.item), async (f) => {
        const at = (o) => () => { const rr = ctx.root.getBoundingClientRect(), r = room.getBoundingClientRect(); return { x: r.left - rr.left + o.x, y: r.top - rr.top + o.y }; };
        for (const g of gads) {
          if (done) break;
          await f.until(() => !busy, 3000);
          await f.drag(at(g), at(socks.find((s) => s.p === g.p)), 700);
          await f.until(() => g.done || done, 2000);
        }
      });
      return () => { done = true; ro.disconnect(); };
    },
  });
})();
