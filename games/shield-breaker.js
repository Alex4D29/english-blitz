// SHIELD BREAKER — first person, like Monster Boxing (the teacher's design). A silly knight (a big tin
// helmet with a red plume, googly eyes peering out of the visor, a huge curly moustache, wobbly legs)
// holds up a shield in each hand (a third one in front from 1.5×), each with an option. The card at the
// top shows the target and the voice says it. Your sword is in the bottom corner: swipe across the right
// shield (or tap it) and it's sliced in two and falls apart. Then a beat where the clock stops: the card
// pops to a NEW target, the voice says it, and the knight pulls out fresh shields (it's a rhythm game, like
// Dance Off). A wrong shield: CLANG, the sword bounces off with sparks and the knight laughs. Break 3
// shields: the knight has nothing left, drops to the floor and cries (WAAAH!). 3 misses lose (the right
// shield glows).
// Boss Battle: Banana Boss's finale. The knight is Banana Boss, holding banana-shaped shields; when the
// last shield breaks, the next slash slices the boss itself in two.
(function () {
  const TEXT = {
    name: { en: "Shield Breaker" },
    icon: "🛡️",
    howTo: (list) => ({ en: {
      steps: [
        list.type === "hfw" ? ["👂", "Listen to the word, like \"the\"."] : ["👀", "Look at the card at the top."],
        ["⚔️", "Swipe across the shield with the same one to slice it! (Tapping it works too.)"],
        ["🔁", "Then the card changes and the knight pulls out new shields. Break 3 shields to win!"],
      ],
      tips: [
        "Tap the card to hear it again.",
        "A wrong shield: CLANG! Your sword bounces off. Three of those and the knight wins.",
        "When the game speeds up, the knight holds 3 shields.",
      ],
    } }),
    instruction: { en: "BREAK THE\nSHIELD!" },
    cardLabel: "Hear it again",
    shieldLabel: (t) => `Slice the shield ${t}`,
    good: ["SMASH!", "CRACK!", "KA-CHUNK!"],
    clang: "CLANG!",
    haha: "HA HA!",
    waah: "WAAAH!",
    sliced: "SLICED!",
  };
  const GOAL = 3, MISSES = 3;
  const SHIELD_COLORS = ["#2f6fe0", "#e8173c", "#1f9d3a"];

  const CSS = `
  .sb { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:8px; padding-bottom:8px; }
  .sb-top { flex:none; display:flex; align-items:center; gap:12px; }
  .sb-card { min-width:84px; height:72px; padding:0 18px; border-radius:18px; font:inherit; font-size:2.6rem; line-height:1; background:#fff; color:#111;
    border:5px solid #111; box-shadow:0 6px 0 #111; display:flex; align-items:center; justify-content:center; gap:8px; cursor:pointer; touch-action:manipulation; }
  .sb-card .spk { font-size:1.3rem; opacity:.6; }
  .sb-card.next { animation:sb-next .45s cubic-bezier(.2,1.8,.4,1); }
  .sb-pips { display:flex; flex-direction:column; gap:6px; }
  .sb-row { display:flex; gap:5px; }
  .sb-pip { width:24px; height:24px; border:3px solid #111; border-radius:50%; background:#fff; display:flex; align-items:center; justify-content:center; font-size:13px; line-height:1; }
  .sb-pip.on { background:#ffd400; } .sb-pip.on::after { content:"🛡️"; }
  .sb-pip.miss { background:#444; } .sb-pip.miss::after { content:"✕"; color:#fff; font-weight:900; }

  /* The arena: a castle wall with battlements, a sandy floor */
  .sb-arena { position:relative; flex:1; min-height:0; width:100%; max-width:560px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111;
    background:linear-gradient(180deg, #8fd3ff 0 14%, transparent 14%), repeating-linear-gradient(90deg, #9aa3ad 0 46px, #8a939c 46px 50px), #9aa3ad; touch-action:none; cursor:crosshair; }
  .sb-arena::before { content:""; position:absolute; left:0; right:0; top:8%; height:8%; background:repeating-linear-gradient(90deg, #9aa3ad 0 30px, transparent 30px 52px); }   /* battlements */
  .sb-arena::after { content:""; position:absolute; left:0; right:0; bottom:0; height:22%; background:#e3c27a; border-top:5px solid #111; }   /* the sandy floor */
  .sb-fx { position:absolute; inset:0; pointer-events:none; overflow:visible; z-index:9; }

  /* The knight: --k is its size. Anchor: its feet, in the middle. */
  .sb-foe { position:absolute; left:0; top:0; width:var(--k); height:var(--k); margin:calc(var(--k) * -1) 0 0 calc(var(--k) * -.5); z-index:2; pointer-events:none; transform-origin:50% 100%; }
  .sb-knight { position:absolute; inset:0; animation:sb-sway 1.2s ease-in-out infinite alternate; transform-origin:50% 100%; }
  .sb-leg { position:absolute; bottom:0; width:12%; height:24%; background:#b8c4cf; border:4px solid #111; border-radius:6px 6px 10px 10px; }
  .sb-leg.l { left:34%; } .sb-leg.r { right:34%; }
  .sb-body { position:absolute; left:26%; right:26%; top:44%; height:36%; background:#b8c4cf; border:4px solid #111; border-radius:30% 30% 20% 20%; }
  .sb-body::after { content:"★"; position:absolute; left:50%; top:46%; transform:translate(-50%, -50%); font-size:calc(var(--k) * .14); color:#ffd400; -webkit-text-stroke:2px #111; line-height:1; }
  .sb-arm { position:absolute; top:50%; width:24%; height:9%; background:#b8c4cf; border:4px solid #111; border-radius:99px; }
  .sb-arm.l { left:6%; transform:rotate(-12deg); } .sb-arm.r { right:6%; transform:rotate(12deg); }
  .sb-helm { position:absolute; left:20%; right:20%; top:4%; height:46%; z-index:2; border:4px solid #111; border-radius:46% 46% 30% 30%;
    background:linear-gradient(90deg, #e2e9ef, #9eacb8); }
  .sb-plume { position:absolute; left:44%; top:-34%; width:26%; height:48%; background:#e8173c; border:4px solid #111; border-radius:80% 20% 60% 40%; transform:rotate(18deg); z-index:-1; }
  .sb-visor { position:absolute; left:8%; right:8%; top:34%; height:30%; background:#222; border:4px solid #111; border-radius:12px; overflow:hidden; }
  .sb-eye { position:absolute; top:6%; width:34%; aspect-ratio:1; background:#fff; border:3px solid #111; border-radius:50%; }
  .sb-eye.l { left:10%; } .sb-eye.r { right:12%; width:28%; top:12%; }
  .sb-eye i { position:absolute; left:28%; top:30%; width:46%; aspect-ratio:1; background:#111; border-radius:50%; animation:sb-goggle 1.1s ease-in-out infinite; }
  .sb-eye.r i { animation-delay:-.45s; }
  .sb-stache { position:absolute; left:10%; right:10%; top:70%; height:16%; z-index:1;
    background:radial-gradient(ellipse at 25% 0, transparent 40%, #c0642a 42%) left / 50% 100% no-repeat, radial-gradient(ellipse at 75% 0, transparent 40%, #c0642a 42%) right / 50% 100% no-repeat; }
  .sb-mouth { position:absolute; left:38%; right:38%; top:84%; height:0; background:#6b1020; border:0 solid #111; border-radius:50%; transition:height .15s; }
  .sb-tear { position:absolute; top:62%; width:7%; height:0; background:#5ec8ff; border-radius:0 0 99px 99px; z-index:3; opacity:0; }
  .sb-tear.l { left:24%; } .sb-tear.r { right:24%; }
  .sb-foe.hurt .sb-knight { animation:sb-hurt .09s linear 6; }
  .sb-foe.laugh .sb-knight { animation:sb-laugh .2s ease-in-out infinite alternate; }
  .sb-foe.laugh .sb-mouth, .sb-foe.down .sb-mouth { height:16%; border-width:3px; }
  /* Beaten: it drops to the floor and cries */
  .sb-foe.down .sb-knight { animation:sb-down .5s ease-in forwards, sb-sob .3s .5s ease-in-out infinite alternate; }
  .sb-foe.down .sb-eye i { display:none; }
  .sb-foe.down .sb-eye { height:10%; top:40%; border-radius:99px; background:#111; }
  .sb-foe.down .sb-tear { opacity:1; animation:sb-tear .5s linear infinite; }
  .sb-foe.down .sb-tear.r { animation-delay:.25s; }
  .sb-foe .bx-boss { position:absolute; left:0; top:0; }

  /* A shield: --ss is its width. Kite shaped, in a bold colour, with a white plate for the option. */
  .sb-shield { position:absolute; left:0; top:0; width:var(--ss); height:calc(var(--ss) * 1.15); margin:calc(var(--ss) * -.575) 0 0 calc(var(--ss) * -.5); padding:0; border:0;
    background:none; font:inherit; z-index:4; pointer-events:none; }
  .sb-face { position:absolute; inset:0; background:var(--sc); border:5px solid #111; border-radius:14% 14% 50% 50% / 10% 10% 62% 62%;
    box-shadow:inset 0 0 0 7px rgba(255,255,255,.35), 0 6px 0 rgba(0,0,0,.3); display:flex; align-items:center; justify-content:center; }
  .sb-sign { min-width:60%; max-width:88%; padding:2px 6px; margin-bottom:12%; background:#fff; border:4px solid #111; border-radius:12px; color:#111; font-size:calc(var(--ss) * .34);
    line-height:1.1; white-space:nowrap; overflow:hidden; text-align:center; }
  .sb-shield.in { animation:sb-in .35s cubic-bezier(.2,1.6,.4,1) both; }
  .sb-shield.right .sb-face { box-shadow:0 0 0 6px #fff, 0 0 0 11px #00b86b; }
  .sb-shield.right { animation:sb-wiggle .4s ease-in-out 3; }
  .sb-shield.dim { opacity:.45; }
  .sb-shield.clang .sb-face { animation:sb-shake .3s linear; }
  /* Banana Boss's banana-shaped shields */
  .sb-shield.nana .sb-face { background:linear-gradient(90deg, #ffe866, #ffd000 55%, #e3a800); border-radius:50% 50% 46% 46% / 62% 62% 38% 38%; box-shadow:0 6px 0 rgba(0,0,0,.3); }
  .sb-shield.nana .sb-face::before { content:""; position:absolute; left:42%; top:-7%; width:16%; height:10%; background:#6b4a1f; border:3px solid #111; border-radius:30% 30% 10% 10%; }
  .sb-shield.nana .sb-face::after { content:""; position:absolute; left:42%; bottom:-2%; width:16%; height:5%; background:#4a2f10; border-radius:50%; }
  .sb-shield.nana.right .sb-face { box-shadow:0 0 0 6px #fff, 0 0 0 11px #00b86b; }
  .sb-half { position:absolute; inset:0; pointer-events:none; }
  /* Banana Boss's finale target: just the plate, right on its body, ringed and pulsing: slice here! */
  .sb-shield.fin { z-index:5; }
  .sb-shield.fin .sb-face { background:none; border:0; box-shadow:none; }
  .sb-shield.fin .sb-sign { margin:0; box-shadow:0 0 0 6px #fff, 0 0 0 11px #ff4d6d, 0 0 26px 14px rgba(255,255,255,.8); animation:sb-pulse .5s ease-in-out infinite alternate; }
  @keyframes sb-pulse { to { scale:1.12; } }

  /* Your sword, first person, in the bottom-right corner */
  .sb-sword { position:absolute; right:-3%; bottom:-22%; width:var(--sw); height:calc(var(--sw) * 2.3); z-index:6; pointer-events:none; transform-origin:70% 92%; transform:rotate(-24deg);
    transition:transform .12s ease-out; }
  .sb-blade { position:absolute; left:38%; width:24%; top:0; height:66%; background:linear-gradient(90deg, #f4f7fa, #b9c4ce); border:4px solid #111; border-radius:50% 50% 4px 4px / 14% 14% 4px 4px; }
  .sb-guard { position:absolute; left:6%; right:6%; top:64%; height:7%; background:#ffd400; border:4px solid #111; border-radius:8px; }
  .sb-grip { position:absolute; left:40%; width:20%; top:70%; height:22%; background:repeating-linear-gradient(180deg, #8b5a2b 0 8px, #6b3f1d 8px 12px); border:4px solid #111; border-radius:6px; }
  .sb-pommel { position:absolute; left:34%; width:32%; top:90%; aspect-ratio:1; background:#ffd400; border:4px solid #111; border-radius:50%; }
  .sb-sword.swing { transform:rotate(-80deg) translate(-10%, 0); }
  .sb-sword.bonk { animation:sb-bonk .4s ease-out; }
  .sb-slash { position:absolute; left:0; top:0; height:12px; margin-top:-6px; background:#fff; border-radius:99px; box-shadow:0 0 16px #fff, 0 0 4px #9ff; transform-origin:0 50%;
    animation:sb-slash .3s ease-out forwards; z-index:8; }
  .sb-word { position:absolute; transform:translate(-50%, -50%) rotate(-8deg); z-index:10; pointer-events:none; font-size:2rem; color:#ffd400; -webkit-text-stroke:2px #111;
    paint-order:stroke fill; text-shadow:0 4px 0 #111; white-space:nowrap; animation:sb-word .9s ease-out forwards; }
  .sb-word.bad { color:#ff4d6d; } .sb-word.big { font-size:2.8rem; animation-duration:2s; }
  .sb-spark { position:absolute; font-size:1.6rem; line-height:1; pointer-events:none; z-index:9; }

  @keyframes sb-next { 0% { transform:scale(.4) rotate(-10deg); } 60% { transform:scale(1.25) rotate(4deg); } 100% { transform:none; } }
  @keyframes sb-sway { from { transform:rotate(-3deg); } to { transform:rotate(3deg) translateY(-2%); } }
  @keyframes sb-goggle { 0%, 100% { transform:translate(-16%, 0); } 50% { transform:translate(16%, -12%); } }
  @keyframes sb-hurt { 0%, 100% { transform:translateX(0); } 25% { transform:translateX(-5%) rotate(-4deg); } 75% { transform:translateX(5%) rotate(4deg); } }
  @keyframes sb-laugh { from { transform:translateY(0) rotate(-5deg); } to { transform:translateY(-6%) rotate(5deg); } }
  @keyframes sb-down { 60% { transform:translateY(8%) scale(1.1, .8); } 100% { transform:translateY(14%) scale(1.05, .82); } }
  @keyframes sb-sob { from { transform:translateY(14%) scale(1.05, .82); } to { transform:translateY(12%) scale(1.02, .86); } }
  @keyframes sb-tear { 0% { height:0; opacity:1; } 80% { height:34%; opacity:1; } 100% { height:38%; opacity:0; } }
  @keyframes sb-in { from { translate:0 60%; scale:.3; rotate:-30deg; opacity:0; } }   /* (separate properties, so it keeps its place: transform) */
  @keyframes sb-wiggle { 25% { rotate:-7deg; } 75% { rotate:7deg; } }
  @keyframes sb-shake { 25% { transform:translateX(-7px) rotate(-3deg); } 75% { transform:translateX(7px) rotate(3deg); } }
  @keyframes sb-bonk { 0% { transform:rotate(-80deg) translate(-10%, 0); } 40% { transform:rotate(10deg) translate(8%, 4%); } 100% { transform:rotate(-24deg); } }
  @keyframes sb-slash { from { transform:rotate(var(--a)) scaleX(0); opacity:1; } 60% { transform:rotate(var(--a)) scaleX(1); opacity:1; } to { transform:rotate(var(--a)) scaleX(1); opacity:0; } }
  @keyframes sb-word { from { opacity:1; transform:translate(-50%, -50%) rotate(-8deg) scale(.5); } 25% { transform:translate(-50%, -60%) rotate(-8deg) scale(1.15); }
    75% { opacity:1; } to { opacity:0; transform:translate(-50%, -100%) rotate(-8deg); } }
  @media (prefers-reduced-motion: reduce) { .sb-knight, .sb-eye i, .sb-shield.in, .sb-shield.right, .sb-card.next, .sb-word, .sb-slash { animation:none !important; } }
  `;
  function injectCss() {
    if (document.getElementById("sb-css")) return;
    const s = document.createElement("style");
    s.id = "sb-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  registerMicrogame({
    id: "shield-breaker",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 12000,
    input: "slice",
    tutorial: true,
    bossArt: true, // Boss Battle: Banana Boss's finale draws the boss itself (ctx.boss, Boss.fighting)

    start(ctx) {
      injectCss();
      const speed = ctx.speed || 1;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const { tone, sweep, noise } = ctx.sfx;
      const N = speed >= 1.5 ? 3 : 2;                     // shields at a time
      // A rhythm game: every shield broken brings a NEW target, with a beat in between where the clock
      // stops while the next one is shown and said (like Dance Off).
      // (Banana Boss gets one more: the finale target, on its own body.)
      const finaleSteps = window.Boss && window.Boss.fighting(ctx) === "banana" ? 1 : 0;
      const S = ctx.choiceSteps(GOAL + finaleSteps, N, { lowercase: true });
      let C = S[0];
      const BEAT_MS = 800;
      const bossId = window.Boss ? window.Boss.fighting(ctx) : null; // Banana Boss's finale
      const nana = bossId === "banana";

      // ---------- DOM ----------
      const wrap = document.createElement("div");
      wrap.className = "sb";
      const top = document.createElement("div");
      top.className = "sb-top";
      const card = document.createElement("button");
      card.className = "sb-card";
      card.setAttribute("aria-label", TEXT.cardLabel);
      card.innerHTML = '<span class="ct"></span>';
      card.firstChild.textContent = C.cardText;
      if (ctx.canSpeak && !C.listen) card.insertAdjacentHTML("beforeend", '<span class="spk">🔊</span>');
      card.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });
      const pips = document.createElement("div");
      pips.className = "sb-pips";
      pips.innerHTML = `<div class="sb-row hits">${'<span class="sb-pip"></span>'.repeat(GOAL)}</div><div class="sb-row misses">${'<span class="sb-pip"></span>'.repeat(MISSES)}</div>`;
      top.append(card, pips);
      const arena = document.createElement("div");
      arena.className = "sb-arena";
      const fx = document.createElement("div");
      fx.className = "sb-fx";
      wrap.append(top, arena);
      ctx.root.appendChild(wrap);

      const foe = document.createElement("div");
      foe.className = "sb-foe";
      let boss = null;
      if (bossId) {
        boss = window.Boss.el(bossId, "var(--k)");
        foe.appendChild(boss);
      } else {
        foe.innerHTML = '<div class="sb-knight"><div class="sb-leg l"></div><div class="sb-leg r"></div><div class="sb-arm l"></div><div class="sb-arm r"></div><div class="sb-body"></div>' +
          '<div class="sb-helm"><div class="sb-plume"></div><div class="sb-visor"><div class="sb-eye l"><i></i></div><div class="sb-eye r"><i></i></div></div>' +
          '<div class="sb-stache"></div><div class="sb-mouth"></div><div class="sb-tear l"></div><div class="sb-tear r"></div></div></div>';
      }
      const sword = document.createElement("div");
      sword.className = "sb-sword";
      sword.innerHTML = '<div class="sb-blade"></div><div class="sb-guard"></div><div class="sb-grip"></div><div class="sb-pommel"></div>';
      arena.append(foe, sword, fx);

      // ---------- Layout ----------
      let W = 0, H = 0, K = 200, ss = 110, feet = { x: 0, y: 0 };
      const spots = [];                                   // where each shield is held (arena px)
      function layout() {
        W = arena.clientWidth; H = arena.clientHeight;
        K = Math.max(130, Math.min(H * 0.66, W * 0.46, 260));
        ss = Math.max(80, Math.min(K * 0.6, W * 0.3, 150));
        feet = { x: W / 2, y: H * 0.93 };
        arena.style.setProperty("--k", `${K}px`);
        arena.style.setProperty("--ss", `${ss}px`);
        arena.style.setProperty("--sw", `${Math.max(56, Math.min(W * 0.16, H * 0.2, 90))}px`);
        foe.style.transform = `translate(${feet.x}px, ${feet.y}px)`;
        foe.style.left = "0"; foe.style.top = "0";
        const chest = feet.y - K * 0.52, side = Math.min(W / 2 - ss * 0.55 - 6, K * 0.5 + ss * 0.1);
        spots.length = 0;
        spots.push({ x: W / 2 - side, y: chest }, { x: W / 2 + side, y: chest });
        if (N > 2) spots.push({ x: W / 2, y: Math.min(feet.y - ss * 0.5, chest + ss * 0.55) }); // the third one, held out in front
        spots[N] = { x: W / 2, y: feet.y - K * 0.5 }; // Banana Boss's finale target: the middle of its body
        shields.forEach((s) => place(s));
      }
      function place(s) { if (!spots[s.i]) return; s.el.style.transform = `translate(${spots[s.i].x}px, ${spots[s.i].y}px)`; fitSign(s); }
      function fitSign(s) {
        s.sign.style.fontSize = s.opt.kind === "word" ? `${Math.min(ss * 0.3, (ss * 0.72) / (s.opt.text.length * 0.6))}px` : "";
      }

      // ---------- Shields ----------
      let shields = [];
      function dealShields(anim) {
        shields.forEach((s) => s.el.remove());
        const row = ctx.shuffle(C.row.slice());
        shields = row.map((opt, i) => {
          const el = document.createElement("div");
          el.className = "sb-shield" + (nana ? " nana" : "") + (anim ? " in" : "");
          el.style.setProperty("--sc", SHIELD_COLORS[i % SHIELD_COLORS.length]);
          el.style.animationDelay = anim ? `${i * 0.08}s` : "";
          el.setAttribute("aria-label", TEXT.shieldLabel(opt.spoken));
          el.innerHTML = '<div class="sb-face"><span class="sb-sign"></span></div>';
          const s = { el, i, opt, sign: el.querySelector(".sb-sign"), gone: false };
          s.sign.textContent = opt.text;
          arena.insertBefore(el, sword);
          place(s);
          return s;
        });
      }
      dealShields(false);
      layout();
      const ro = new ResizeObserver(layout);
      ro.observe(arena);

      // ---------- Slashing: swipe across a shield (or tap it) ----------
      const local = (e) => { const r = arena.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
      const live = () => shields.filter((s) => !s.gone);
      // The shield the swipe line (a → b, stretched a little both ways) passes nearest, within its size.
      function crossed(a, b) {
        const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
        let best = null, bd = Infinity;
        live().forEach((s) => {
          const c = spots[s.i], t = Math.max(-40, Math.min(L + 40, (c.x - a.x) * ux + (c.y - a.y) * uy));
          const d = Math.hypot(a.x + ux * t - c.x, a.y + uy * t - c.y);
          if (d < ss * 0.62 && d < bd) { bd = d; best = s; }
        });
        return best;
      }
      function under(p) {
        let best = null, bd = Infinity;
        live().forEach((s) => { const c = spots[s.i], d = Math.hypot(p.x - c.x, (p.y - c.y) * 0.87); if (d < ss * 0.62 && d < bd) { bd = d; best = s; } });
        return best;
      }
      let drag = null;
      arena.addEventListener("pointerdown", (e) => {
        if (done || ctx.ended) return;
        e.preventDefault();
        drag = { id: e.pointerId, a: local(e), used: false };
        try { arena.setPointerCapture(e.pointerId); } catch (err) { /* old browsers */ }
      });
      arena.addEventListener("pointermove", (e) => {
        if (!drag || drag.used || e.pointerId !== drag.id) return;
        const b = local(e);
        if (Math.hypot(b.x - drag.a.x, b.y - drag.a.y) < 22) return;
        drag.used = true;
        const s = crossed(drag.a, b);
        if (s) slash(s, Math.atan2(b.y - drag.a.y, b.x - drag.a.x));
      });
      const up = (e) => {
        if (!drag || e.pointerId !== drag.id) return;
        const d = drag;
        drag = null;
        if (d.used) return;
        const s = under(local(e)); // a tap on a shield slashes it too (5-year-olds tap)
        if (s) slash(s, -0.6);
      };
      arena.addEventListener("pointerup", up);
      arena.addEventListener("pointercancel", () => { drag = null; });

      let step = 0, misses = 0, done = false, busy = false;
      function slash(s, ang) {
        if (done || busy || ctx.ended || s.gone) return;
        busy = true;
        sword.classList.remove("bonk"); sword.classList.add("swing");
        noise(0.1, "highpass", 2500, 7000, 0.3); // swish
        streak(spots[s.i], ang);
        if (s.fin) { s.gone = true; s.el.remove(); win(ang); return; } // the finale: you slice the boss itself
        if (s.opt.right) breakShield(s, ang); else ding(s);
      }
      function streak(c, ang) {
        if (reduceMotion) return;
        const w = ss * 1.6, l = document.createElement("div");
        l.className = "sb-slash";
        l.style.width = `${w}px`;
        l.style.left = `${c.x - Math.cos(ang) * w / 2}px`; l.style.top = `${c.y - Math.sin(ang) * w / 2}px`;
        l.style.setProperty("--a", `${ang}rad`);
        fx.appendChild(l);
        ctx.later(() => l.remove(), 320);
      }
      // Sliced in two: the halves fall apart along the cut.
      function halves(el, ang) {
        const deg = (ang * 180) / Math.PI;
        el.style.visibility = "hidden";
        [-1, 1].forEach((side) => {
          const h = document.createElement("div");
          h.className = "sb-half";
          h.style.transform = el.style.transform;
          h.style.width = el.offsetWidth + "px"; h.style.height = el.offsetHeight + "px";
          h.style.margin = getComputedStyle(el).margin;
          // a cut through the middle, at the swipe's angle (roughly): clip one side of the line
          const k = Math.tan(Math.max(-1.2, Math.min(1.2, ang)));
          const y0 = 50 - k * 50, y1 = 50 + k * 50; // where the cut meets the left and right edges (%)
          h.style.clipPath = side < 0 ? `polygon(0 0, 100% 0, 100% ${y1}%, 0 ${y0}%)` : `polygon(0 ${y0}%, 100% ${y1}%, 100% 100%, 0 100%)`;
          const inner = el.cloneNode(true);
          inner.style.cssText = "position:absolute;inset:0;margin:0;transform:none;visibility:visible;animation:none;";
          h.appendChild(inner);
          arena.insertBefore(h, sword);
          h.animate([{ transform: el.style.transform, opacity: 1 },
            { transform: `${el.style.transform} translate(${side * ss * 0.5}px, ${H * 0.5}px) rotate(${side * 40 + deg * 0.2}deg)`, opacity: 0 }],
          { duration: reduceMotion ? 1 : 800, easing: "cubic-bezier(.4,0,.8,.6)", fill: "forwards" });
          ctx.later(() => h.remove(), 850);
        });
      }
      function breakShield(s, ang) {
        s.gone = true;
        halves(s.el, ang);
        noise(0.2, "lowpass", 2500, 300, 0.6); tone(1046, 0.06, "square", 0.08, 0.05); tone(1568, 0.12, "square", 0.08, 0.1); // CRACK
        word(spots[s.i], TEXT.good[step % TEXT.good.length], false);
        ctx.confetti(fx, spots[s.i].x, spots[s.i].y, { count: 20 });
        if (s.opt.kind === "pic") ctx.say(s.opt.spoken);
        mood("hurt");
        pips.querySelector(".hits").children[step].classList.add("on");
        step++;
        ctx.later(() => sword.classList.remove("swing"), 160);
        if (step >= GOAL) { if (nana) ctx.later(finale, 520); else ctx.later(win, 380); return; }
        ctx.later(nextShields, 520);
      }
      // The beat: the clock stops, the card pops to the next target, the voice says it, and the knight
      // throws away what's left and pulls out fresh shields.
      function nextShields() {
        if (done) return;
        ctx.pauseTimer(BEAT_MS);
        C = S[step];
        card.firstChild.textContent = C.cardText;
        card.classList.remove("next"); void card.offsetWidth; card.classList.add("next");
        tone(98, 0.08, "square", 0.1); tone(98, 0.08, "square", 0.1, 0.16);
        ctx.later(() => { if (!done) ctx.say(C.prompt); }, 150);
        mood(null);
        live().forEach((s) => s.el.animate([{ opacity: 1 }, { opacity: 0, translate: "0 40px" }], { duration: 200, fill: "forwards" }));
        ctx.later(() => {
          if (done) return;
          dealShields(true);
          sweep(300, 700, 0.12, "square", 0.05); // whip them out
          ctx.later(() => { busy = false; }, 250);
        }, 200);
      }
      function ding(s) {
        s.el.classList.remove("clang"); void s.el.offsetWidth; s.el.classList.add("clang");
        sword.classList.remove("swing"); void sword.offsetWidth; sword.classList.add("bonk");
        tone(2400, 0.06, "square", 0.08); tone(3100, 0.14, "triangle", 0.08, 0.03); // CLANG
        word(spots[s.i], TEXT.clang, true);
        sparks(spots[s.i]);
        mood("laugh");
        misses++;
        pips.querySelector(".misses").children[misses - 1].classList.add("miss");
        if (misses >= MISSES) { lose(); return; }
        ctx.later(() => { mood(null); busy = false; }, 550); // same shields: try again
      }
      function sparks(c) {
        if (reduceMotion) return;
        for (let i = 0; i < 5; i++) {
          const p = document.createElement("div");
          p.className = "sb-spark"; p.textContent = "✨";
          p.style.left = `${c.x}px`; p.style.top = `${c.y}px`;
          fx.appendChild(p);
          const a = Math.random() * 6.28, r = ss * (0.4 + Math.random() * 0.4);
          p.animate([{ transform: "translate(-50%, -50%) scale(.5)", opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(a) * r}px), calc(-50% + ${Math.sin(a) * r}px)) scale(1.1)`, opacity: 0 }],
            { duration: 500, easing: "ease-out", fill: "forwards" });
          ctx.later(() => p.remove(), 520);
        }
      }
      function mood(m) {
        if (boss) { window.Boss.setMood(boss, m); return; }
        foe.classList.remove("hurt", "laugh");
        if (m) { void foe.offsetWidth; foe.classList.add(m); }
      }

      // Banana Boss's finale (the teacher's idea): all its shields are gone, the clock stops, and one more
      // target pops up, the only answer, right in the middle of its body, so slicing it slices the boss.
      let fin = null;
      function finale() {
        if (done) return;
        ctx.freezeTimer();
        C = S[GOAL];
        card.firstChild.textContent = C.cardText;
        card.classList.remove("next"); void card.offsetWidth; card.classList.add("next");
        tone(98, 0.08, "square", 0.1); tone(98, 0.08, "square", 0.1, 0.16); tone(131, 0.2, "square", 0.1, 0.32);
        ctx.later(() => { if (!done) ctx.say(C.prompt); }, 150);
        mood("angry");
        live().forEach((s) => { s.gone = true; s.el.remove(); });
        const opt = C.row.find((o) => o.right);
        const el = document.createElement("div");
        el.className = "sb-shield fin in";
        el.setAttribute("aria-label", TEXT.shieldLabel(opt.spoken));
        el.innerHTML = '<div class="sb-face"><span class="sb-sign"></span></div>';
        fin = { el, i: N, opt, sign: el.querySelector(".sb-sign"), gone: false, fin: true };
        fin.sign.textContent = opt.text;
        arena.insertBefore(el, sword);
        shields = [fin];
        place(fin);
        ctx.later(() => { busy = false; }, 250);
        ctx.later(() => { if (!done && !fin.gone) ctx.hint(fin.el, null, { small: true }); }, 1800); // (the only answer, so a hint can point at it)
        // (the clock is stopped, so never leave it hanging: after a while the sword finishes the job by itself)
        ctx.later(() => { if (!done && !fin.gone) slash(fin, -0.55); }, 8000);
      }

      function win(ang) {
        done = true;
        ctx.win();
        live().forEach((s) => { s.gone = true; s.el.animate([{ opacity: 1 }, { opacity: 0, translate: "0 60px" }], { duration: 300, fill: "forwards" }); });
        sword.classList.remove("swing");
        const head = { x: feet.x, y: feet.y - K * 0.75 };
        if (boss) {
          // Banana Boss: one last slash, and it's sliced in two.
          ctx.later(() => {
            sword.classList.add("swing");
            streak({ x: feet.x, y: feet.y - K * 0.5 }, ang ?? -0.55);
            noise(0.25, "highpass", 3000, 6000, 0.35);
            boss.style.visibility = "hidden";
            const box = document.createElement("div");
            box.style.cssText = "position:absolute;inset:0;";
            foe.appendChild(box);
            window.Boss.split(box, bossId, K);
            tone(90, 0.3, "square", 0.15);
            word(head, TEXT.sliced, false, true);
            ctx.confetti(fx, feet.x, feet.y - K * 0.5, { count: 90 });
            if (!reduceMotion) for (let i = 0; i < 8; i++) {
              const b = document.createElement("div");
              b.className = "sb-spark"; b.textContent = "🍌";
              b.style.left = `${feet.x}px`; b.style.top = `${feet.y - K * 0.5}px`;
              fx.appendChild(b);
              const a = Math.random() * 6.28, r = W * (0.25 + Math.random() * 0.3);
              b.animate([{ transform: "translate(-50%, -50%)", opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(a) * r}px), calc(-50% + ${Math.sin(a) * r}px)) rotate(400deg)`, opacity: 0 }],
                { duration: 900, easing: "ease-out", fill: "forwards" });
            }
          }, 150);
        } else {
          // The knight has nothing left: it drops to the floor and cries.
          foe.classList.remove("hurt", "laugh");
          foe.classList.add("down");
          word(head, TEXT.waah, true, true);
          [0, 0.35, 0.7].forEach((d) => sweep(700, 380, 0.3, "triangle", 0.07, d)); // waaah waaah
          ctx.confetti(fx, feet.x, feet.y - K * 0.6, { count: 80 });
        }
        [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.14, "triangle", 0.1, 0.2 + i * 0.08));
        ctx.say(C.answer);
      }
      function lose() {
        done = true;
        ctx.lose();
        word({ x: feet.x, y: feet.y - K * 1.02 }, TEXT.haha, true);
        [0, 0.15, 0.3].forEach((d) => tone(330, 0.1, "square", 0.07, d)); // ha ha ha
        ctx.later(() => { showRight(); ctx.say(C.answer); }, 450);
      }
      function showRight() { shields.forEach((s) => { if (!s.gone) s.el.classList.add(s.opt.right ? "right" : "dim"); }); }
      function word(at, text, bad, big) {
        const w = document.createElement("div");
        w.className = "sb-word" + (bad ? " bad" : "") + (big ? " big" : "");
        w.textContent = text;
        w.style.left = `${Math.max(70, Math.min(W - 70, at.x))}px`; w.style.top = `${Math.max(30, at.y)}px`;
        fx.appendChild(w);
        ctx.later(() => w.remove(), big ? 2000 : 900);
      }
      function replay() { if (!done) ctx.say(C.prompt); }

      ctx.onTimeout(() => { done = true; mood("laugh"); showRight(); ctx.say(C.answer); });
      function onKey(e) {
        const i = parseInt(e.key, 10) - 1;
        if (i >= 0 && i < N) { e.preventDefault(); const s = shields.find((x) => x.i === i && !x.gone); if (s) slash(s, -0.6); }
        else if (e.key === " ") { e.preventDefault(); replay(); }
      }
      document.addEventListener("keydown", onKey);

      ctx.say(C.prompt);
      ctx.reveal(card);
      // SLICE! on the knight's middle (never on one shield), small.
      ctx.later(() => ctx.hint({ x: feet.x, y: feet.y - K * 0.2 }, null, { small: true }), 80);

      // Tutorial: point at the card, then swipe across the right shield; the card changes each time.
      ctx.tutorial(S.map((s) => s.target), async (f) => {
        const at = (dx, dy) => () => {
          const s = shields.find((x) => x.opt.right && !x.gone);
          if (!s) return { x: 0, y: 0 };
          const r = ctx.root.getBoundingClientRect(), a = arena.getBoundingClientRect(), c = spots[s.i];
          return { x: a.left - r.left + c.x + dx * ss, y: a.top - r.top + c.y + dy * ss };
        };
        await f.point(card);
        for (let n = 0; n < GOAL + finaleSteps && !done; n++) {
          await f.until(() => !busy && (n < GOAL ? step === n : !!fin) && shields.some((x) => x.opt.right && !x.gone), 4000);
          if (n) await f.point(card, 500); // the new one
          await f.slice(at(-0.55, -0.35), at(0.55, 0.35));
          await f.until(() => step > n || done, 2500);
        }
      });

      return () => { done = true; ro.disconnect(); document.removeEventListener("keydown", onKey); };
    },
  });
})();
