// EGG CATCHER — the teacher's design: "a vertical version of Penguin Slide". Silly chickens flap across the top of a
// farmyard and drop eggs, each with a sign; a farmer with a basket at the bottom moves between 3 spots (tap the left,
// middle or right of the yard, swipe, or ← →; 1–3). The card shows one target (always shown); about every other egg is
// right (choiceRows rows strung together: phonics, a different picture each time). Catch a right egg in the basket:
// it cracks and a fluffy chick pops out and waddles off (PEEP PEEP!). Catch a wrong one: SPLAT!, egg all over the
// farmer, ✕; the teacher's rule: 2 chances, so the 2nd splat loses. An egg you don't catch just smashes on the ground
// (no harm). Catch 4 to win.
(function () {
  const TEXT = {
    name: { en: "Egg Catcher" },
    icon: "🥚",
    howTo: { en: {
      steps: [
        ["👀", "Look at the card."],
        ["🐔", "Chickens drop eggs! TAP left, middle or right to move the farmer."],
        ["🐣", "Catch the eggs that match the card. Dodge the others!"],
      ],
      tips: ["Catch a wrong egg and SPLAT! Two of those and it's over.", "Missed a good egg? More are coming.", "Tap the card to hear it again."],
    } },
    instruction: { en: "CATCH THE\nEGGS!" },
    cardLabel: "The card. Tap to hear it again.",
    yay: ["PEEP PEEP!", "A CHICK!", "CHEEP!", "CAUGHT IT!"],
    splat: "SPLAT!",
  };
  const GOAL = 4, MISSES = 2, LANES = 3;

  const CSS = `
  .egc { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:6px; padding-bottom:6px; }
  .egc-top { flex:none; display:flex; align-items:center; gap:10px; }
  .egc-card { padding:4px 16px; background:#fff; border:5px solid #111; border-radius:16px; box-shadow:0 5px 0 #111; font:inherit; color:#111; font-size:clamp(1.8rem, 8vw, 2.8rem);
    line-height:1.05; cursor:pointer; touch-action:manipulation; display:flex; align-items:center; gap:6px; white-space:nowrap; }
  .egc-card .spk { font-size:.45em; }
  .egc-pips { display:flex; flex-direction:column; gap:4px; }
  .egc-row { display:flex; gap:4px; }
  .egc-pip { width:22px; height:22px; border:3px solid #111; border-radius:50%; background:#fff; display:flex; align-items:center; justify-content:center; font-size:12px; line-height:1; }
  .egc-pip.on { background:#ffd400; } .egc-pip.on::after { content:"🐣"; }
  .egc-pip.x.on { background:#ff5a6e; } .egc-pip.x.on::after { content:"✕"; color:#fff; font-weight:900; }
  .egc-yard { position:relative; flex:1; min-height:0; width:100%; max-width:640px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111; touch-action:none; cursor:pointer;
    background:radial-gradient(ellipse 60px 22px at 20% 18%, #fff 0 98%, transparent 100%), radial-gradient(ellipse 80px 26px at 75% 12%, #fff 0 98%, transparent 100%), linear-gradient(180deg, #8fd8ff 0 72%, #7fd36b 72%); }
  /* a fence along the back, and the three spots marked on the ground */
  .egc-fence { position:absolute; left:0; right:0; top:62%; height:10%; background:linear-gradient(180deg, transparent 0 30%, #c98a4b 30% 42%, transparent 42% 64%, #c98a4b 64% 76%, transparent 76%),
    repeating-linear-gradient(90deg, #d99a5b 0 10px, #a8693a 10px 13px, transparent 13px 46px); }
  .egc-spot { position:absolute; bottom:3%; width:22%; height:5%; margin-left:-11%; border-radius:50%; background:rgba(0,0,0,.12); }
  /* A chicken (--hz): white, a red comb and wattle, a beak, a googly eye, flapping wings */
  .egc-hen { position:absolute; left:0; top:0; width:var(--hz); height:calc(var(--hz) * .8); z-index:3; pointer-events:none; }
  .egc-hin { position:absolute; inset:0; animation:egc-bob .2s ease-in-out infinite alternate; }
  .egc-hin > * { position:absolute; box-sizing:border-box; }
  .egc-hen.l .egc-hin { transform:scaleX(-1); }
  .egc-hbody { left:10%; right:14%; top:22%; bottom:8%; background:#fff; border:4px solid #111; border-radius:50% 60% 45% 50%; }
  .egc-comb { right:14%; top:2%; width:22%; height:24%; background:#ff3b3b; border:3px solid #111; border-radius:50% 50% 20% 20%; }
  .egc-beak { right:-4%; top:34%; width:20%; height:16%; background:#ffb000; border:3px solid #111; clip-path:polygon(0 0, 100% 50%, 0 100%); }
  .egc-hEye { right:16%; top:22%; width:22%; aspect-ratio:1; background:#fff; border:3px solid #111; border-radius:50%; overflow:hidden; z-index:2; }
  .egc-hEye i { position:absolute; left:30%; top:30%; width:46%; aspect-ratio:1; background:#111; border-radius:50%; animation:egc-roll .7s ease-in-out infinite alternate; }
  .egc-wing { left:28%; top:34%; width:40%; height:34%; background:#eee; border:3px solid #111; border-radius:50% 50% 50% 50% / 30% 30% 70% 70%; transform-origin:50% 10%; animation:egc-flap .12s ease-in-out infinite alternate; z-index:2; }
  .egc-hleg { bottom:-6%; width:6%; height:16%; background:#ffb000; border:2px solid #111; } .egc-hleg.a { left:38%; } .egc-hleg.b { left:52%; }
  /* An egg (--ez) with its sign */
  .egc-egg { position:absolute; left:0; top:0; width:var(--ez); height:calc(var(--ez) * 1.2); z-index:4; pointer-events:none; }
  .egc-shell { position:absolute; inset:0; background:radial-gradient(circle at 35% 30%, #fff 0 25%, #fff6e6 60%, #f0dcc0); border:4px solid #111; border-radius:50% 50% 50% 50% / 60% 60% 40% 40%; }
  .egc-sign { position:absolute; left:50%; top:56%; transform:translate(-50%, -50%); padding:0 5px; background:#fff; border:3px solid #111; border-radius:8px; font-weight:900; color:#111; line-height:1.1; white-space:nowrap; }
  .egc-egg.right .egc-sign { box-shadow:0 0 0 4px #fff, 0 0 0 8px #00b86b; }
  .egc-goo { position:absolute; width:calc(var(--ez) * 1.4); height:calc(var(--ez) * .5); margin-left:calc(var(--ez) * -.7); z-index:2; pointer-events:none;
    background:radial-gradient(circle at 50% 50%, #ffc400 0 22%, transparent 23%), radial-gradient(ellipse 50% 40% at 50% 55%, #fffbe8 0 96%, transparent 100%); }
  /* The farmer (--fz): a straw hat, googly eyes, a big moustache, blue overalls, holding a basket out in front */
  .egc-me { position:absolute; left:0; top:0; width:var(--fz); height:calc(var(--fz) * 1.15); z-index:5; pointer-events:none; }
  .egc-me > * { position:absolute; box-sizing:border-box; }
  .egc-legs { left:30%; right:30%; bottom:0; height:16%; background:linear-gradient(90deg, #2d5aa8 0 40%, transparent 40% 60%, #2d5aa8 60%); }
  .egc-body { left:20%; right:20%; top:40%; bottom:12%; background:#ff5a6e; border:4px solid #111; border-radius:30% 30% 12% 12%; }
  .egc-body::after { content:""; position:absolute; left:16%; right:16%; top:30%; bottom:0; background:#3d6fd9; border-top:3px solid #111; }   /* overalls */
  .egc-head { left:24%; right:24%; top:12%; height:36%; background:#ffc9a8; border:4px solid #111; border-radius:50%; z-index:2; }
  .egc-hat { left:6%; right:6%; top:4%; height:16%; background:#f2d37a; border:4px solid #111; border-radius:50% 50% 10% 10% / 90% 90% 10% 10%; z-index:3; }
  .egc-hat::before { content:""; position:absolute; left:24%; right:24%; top:-70%; height:90%; background:#f2d37a; border:4px solid #111; border-bottom:0; border-radius:40% 40% 0 0; }
  .egc-fEye { top:22%; width:13%; aspect-ratio:1; background:#fff; border:3px solid #111; border-radius:50%; overflow:hidden; z-index:4; }
  .egc-fEye.l { left:34%; } .egc-fEye.r { right:34%; width:11%; top:23%; }
  .egc-fEye i { position:absolute; left:28%; top:20%; width:48%; aspect-ratio:1; background:#111; border-radius:50%; }   /* (looking up at the eggs) */
  .egc-tache { left:32%; right:32%; top:35%; height:7%; background:#7a4a1a; border:2px solid #111; border-radius:50% 50% 30% 30%; z-index:4; }
  .egc-arm { top:0; width:9%; height:50%; background:#ffc9a8; border:3px solid #111; border-radius:99px; z-index:1; } .egc-arm.l { left:14%; rotate:-8deg; } .egc-arm.r { right:14%; rotate:8deg; }   /* holding the basket up */
  .egc-basket { left:6%; right:6%; top:-14%; height:22%; background:repeating-linear-gradient(90deg, #c98a4b 0 8px, #a8693a 8px 11px); border:4px solid #111; border-radius:4px 4px 40% 40%; z-index:5; }
  .egc-basket::before { content:""; position:absolute; left:10%; right:10%; top:-60%; height:80%; border:4px solid #111; border-bottom:0; border-radius:50% 50% 0 0; }   /* handle */
  .egc-me.catch .egc-basket { animation:egc-bump .12s ease-in-out 2 alternate; }
  .egc-eggy { left:18%; right:18%; top:6%; height:50%; z-index:6; opacity:0; transition:opacity .2s;
    background:radial-gradient(circle at 50% 40%, #ffc400 0 16%, transparent 17%), radial-gradient(ellipse 50% 46% at 50% 44%, rgba(255,251,232,.95) 0 96%, transparent 100%);
    clip-path:polygon(0 30%, 10% 0, 90% 0, 100% 30%, 96% 70%, 88% 100%, 80% 66%, 68% 92%, 58% 62%, 44% 100%, 34% 60%, 20% 88%, 12% 58%); }
  .egc-me.eggy .egc-eggy { opacity:1; }
  .egc-me.eggy .egc-head { animation:egc-shake .08s linear 8 alternate; }
  /* A fluffy chick that waddles off */
  .egc-chick { position:absolute; width:calc(var(--ez) * .8); height:calc(var(--ez) * .8); z-index:6; pointer-events:none; }
  .egc-chick > * { position:absolute; box-sizing:border-box; }
  .egc-cb { inset:0; background:#ffe14d; border:3px solid #111; border-radius:50%; }
  .egc-ce { top:28%; width:18%; aspect-ratio:1; background:#111; border-radius:50%; } .egc-ce.a { left:28%; } .egc-ce.b { right:28%; }
  .egc-cbk { left:42%; top:44%; width:16%; height:14%; background:#ff8a1f; border:2px solid #111; clip-path:polygon(0 0, 100% 0, 50% 100%); }
  .egc-chick .waddle { inset:0; animation:egc-waddle .15s ease-in-out infinite alternate; }
  .egc-fx { position:absolute; inset:0; pointer-events:none; z-index:8; overflow:visible; }
  .egc-word { position:absolute; transform:translate(-50%, -50%) rotate(-8deg); font-size:1.8rem; color:#ffd400; -webkit-text-stroke:2px #111; paint-order:stroke fill;
    text-shadow:0 4px 0 #111; white-space:nowrap; animation:egc-word 1s ease-out forwards; }
  .egc-word.bad { color:#fff; }
  @keyframes egc-bob { to { transform:translateY(-6%); } }
  .egc-hen.l .egc-hin { animation-name:egc-bobl; } @keyframes egc-bobl { from { transform:scaleX(-1); } to { transform:scaleX(-1) translateY(-6%); } }
  @keyframes egc-flap { from { rotate:-30deg; } to { rotate:20deg; } }
  @keyframes egc-roll { from { transform:translate(-25%, -15%); } to { transform:translate(25%, 15%); } }
  @keyframes egc-bump { to { translate:0 10%; } }
  @keyframes egc-shake { from { translate:-3px 0; } to { translate:3px 0; } }
  @keyframes egc-waddle { from { rotate:-12deg; } to { rotate:12deg; } }
  @keyframes egc-word { from { opacity:1; scale:.5; } 25% { scale:1.15; } 75% { opacity:1; } to { opacity:0; translate:0 -40px; } }
  @media (prefers-reduced-motion: reduce) { .egc-hin, .egc-wing, .egc-hEye i, .egc-me.catch .egc-basket, .egc-me.eggy .egc-head, .egc-chick .waddle, .egc-word { animation:none !important; } }
  `;
  function injectCss() { if (document.getElementById("egc-css")) return; const s = document.createElement("style"); s.id = "egc-css"; s.textContent = CSS; document.head.appendChild(s); }

  registerMicrogame({
    id: "egg-catcher",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 22000,
    input: "tap",
    tutorial: true,

    start(ctx) {
      injectCss();
      const speed = ctx.speed || 1, pace = 0.6 + 0.4 * speed;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const { tone, sweep, noise } = ctx.sfx;
      const C = ctx.choiceRows(GOAL + 4, 3, { lowercase: true });
      let rowI = 0;
      const stream = [];
      function refill() {
        const row = C.rows[rowI++ % C.rows.length];
        stream.push(...ctx.shuffle([row.find((o) => o.right), ctx.pick(row.filter((o) => !o.right))]));
      }

      const wrap = document.createElement("div");
      wrap.className = "egc";
      const top = document.createElement("div");
      top.className = "egc-top";
      const card = document.createElement("button");
      card.className = "egc-card";
      card.setAttribute("aria-label", TEXT.cardLabel);
      card.innerHTML = '<span class="ct"></span>';
      card.firstChild.textContent = C.listen ? C.target.text : C.cardText;
      if (ctx.canSpeak) card.insertAdjacentHTML("beforeend", '<span class="spk">🔊</span>');
      card.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); ctx.say(C.prompt); });
      const pips = document.createElement("div");
      pips.className = "egc-pips";
      pips.innerHTML = `<div class="egc-row hits">${'<span class="egc-pip"></span>'.repeat(GOAL)}</div><div class="egc-row">${'<span class="egc-pip x"></span>'.repeat(MISSES)}</div>`;
      top.append(card, pips);
      const yard = document.createElement("div");
      yard.className = "egc-yard";
      yard.innerHTML = '<div class="egc-fence"></div>' + [...Array(LANES)].map((_, i) => `<div class="egc-spot" style="left:${(100 * (i + 0.5)) / LANES}%"></div>`).join("");
      const me = document.createElement("div");
      me.className = "egc-me";
      me.innerHTML = '<div class="egc-legs"></div><div class="egc-arm l"></div><div class="egc-arm r"></div><div class="egc-body"></div><div class="egc-head"></div><div class="egc-hat"></div><div class="egc-fEye l"><i></i></div><div class="egc-fEye r"><i></i></div>' +
        '<div class="egc-tache"></div><div class="egc-eggy"></div><div class="egc-basket"></div>';
      const fx = document.createElement("div");
      fx.className = "egc-fx";
      yard.append(me, fx);
      wrap.append(top, yard);
      ctx.root.appendChild(wrap);
      const hitPips = pips.querySelector(".hits").children, missPips = pips.children[1].children;

      let W = 0, H = 0, ez = 60, fz = 90, hz = 70, gy = 0;
      const laneX = (l) => (W * (l + 0.5)) / LANES;
      function layout() {
        W = yard.clientWidth; H = yard.clientHeight;
        ez = Math.max(48, Math.min(W * 0.15, H * 0.15, 86));
        fz = Math.max(70, Math.min(W * 0.22, H * 0.3, 140));
        hz = Math.max(56, Math.min(W * 0.15, H * 0.17, 100));
        gy = H - 6;   // the ground line (the farmer's feet)
        yard.style.setProperty("--ez", `${ez}px`); yard.style.setProperty("--fz", `${fz}px`); yard.style.setProperty("--hz", `${hz}px`);
        eggs.forEach((g) => { const sg = g.el.querySelector(".egc-sign"); sg.style.fontSize = sizeOf(g.o); });
      }
      const sizeOf = (o) => `${o.kind === "pic" ? ez * 0.42 : Math.min(ez * 0.36, (ez * 1.1) / ([...o.text].length * 0.62))}px`;
      const basketY = () => gy - fz * 1.15 - fz * 1.15 * 0.08;   // where an egg lands in the basket (held up over the farmer's head)

      // ---------- The farmer ----------
      let lane = 1, fx0 = null;
      function go(l) {
        if (done || ctx.ended) return;
        l = Math.max(0, Math.min(LANES - 1, l));
        if (l === lane) return;
        lane = l;
        tone(380 + l * 80, 0.05, "triangle", 0.05);   // pitter-patter
      }
      let sx = null;
      yard.addEventListener("pointerdown", (e) => { e.preventDefault(); const r = yard.getBoundingClientRect(); sx = e.clientX; go(Math.floor(((e.clientX - r.left) / r.width) * LANES)); });
      yard.addEventListener("pointermove", (e) => { if (sx == null) return; const dx = e.clientX - sx; if (Math.abs(dx) > 40) { go(lane + Math.sign(dx)); sx = e.clientX; } });
      yard.addEventListener("pointerup", () => { sx = null; });
      function onKey(e) {
        if (e.key === "ArrowLeft") { e.preventDefault(); go(lane - 1); }
        else if (e.key === "ArrowRight") { e.preventDefault(); go(lane + 1); }
        else if (["1", "2", "3"].includes(e.key)) { e.preventDefault(); go(+e.key - 1); }
        else if (e.key === " ") { e.preventDefault(); ctx.say(C.prompt); }
      }
      document.addEventListener("keydown", onKey);

      // ---------- Chickens and eggs ----------
      const eggs = [], hens = [];
      const fallS = 2.4 / pace, gap = 1.35 / pace;
      function spawn() {
        if (!stream.length) refill();
        const o = stream.shift();
        // Right eggs usually come where the farmer ISN'T (so you have to move); wrong ones often right above you.
        const others = [0, 1, 2].filter((l) => l !== lane);
        const l = Math.random() < 0.7 ? (o.right ? ctx.pick(others) : lane) : Math.floor(Math.random() * LANES);
        // A chicken flaps in from a side to above that spot, lays the egg, and flaps off the other side.
        const fromLeft = Math.random() < 0.5;
        const h = document.createElement("div");
        h.className = "egc-hen" + (fromLeft ? "" : " l");
        h.innerHTML = '<div class="egc-hin"><div class="egc-hleg a"></div><div class="egc-hleg b"></div><div class="egc-hbody"></div><div class="egc-comb"></div><div class="egc-beak"></div>' +
          '<div class="egc-hEye"><i></i></div><div class="egc-wing"></div></div>';
        yard.insertBefore(h, me);
        const hy = H * 0.04 + Math.random() * H * 0.05;
        const hen = { el: h, x: fromLeft ? -hz : W + hz, y: hy, to: laneX(l), dir: fromLeft ? 1 : -1, laid: false };
        hens.push(hen);
        // the egg (laid when the chicken gets there)
        const el = document.createElement("div");
        el.className = "egc-egg";
        el.innerHTML = '<div class="egc-shell"></div><span class="egc-sign"></span>';
        const sg = el.querySelector(".egc-sign");
        sg.textContent = o.text; sg.style.fontSize = sizeOf(o);
        el.style.visibility = "hidden";
        yard.insertBefore(el, me);
        const g = { el, o, lane: l, y: hy + hz * 0.5, laid: false, judged: false, hen };
        eggs.push(g);
        hen.egg = g;
      }

      // ---------- The loop ----------
      let hits = 0, missN = 0, done = false, started = false, last = null, nextAt = 0, eggyT = 0;
      function frame(ts) {
        const dt = last == null ? 0 : Math.min(50, ts - last) / 1000;
        last = ts;
        const now = performance.now();
        if (started && !done && now >= nextAt) { spawn(); nextAt = now + gap * 1000; }
        // The farmer trots to the spot.
        const want = laneX(lane);
        fx0 = fx0 == null ? want : fx0 + (want - fx0) * Math.min(1, dt * 14);
        me.style.transform = `translate(${fx0 - fz / 2}px, ${gy - fz * 1.15}px)`;
        if (eggyT > 0) { eggyT -= dt; if (eggyT <= 0) me.classList.remove("eggy"); }
        const hv = W * 0.9 * pace;   // chicken flying speed (px/s)
        for (let i = hens.length - 1; i >= 0; i--) {
          const hn = hens[i];
          if (!done || hn.laid) hn.x += hn.dir * hv * dt * (hn.laid ? 1.3 : 1);
          if (!hn.laid && ((hn.dir > 0 && hn.x >= hn.to) || (hn.dir < 0 && hn.x <= hn.to))) {
            hn.x = hn.to; hn.laid = true;
            if (hn.egg && !done) { hn.egg.laid = true; hn.egg.el.style.visibility = ""; noise(0.04, "bandpass", 1200, 600, 0.1); tone(900, 0.05, "square", 0.04); }   // bawk!
          }
          hn.el.style.transform = `translate(${hn.x - hz / 2}px, ${hn.y}px)`;
          if (hn.x < -hz * 2 || hn.x > W + hz * 2) { hn.el.remove(); hens.splice(i, 1); }
        }
        const fallV = (basketY() - H * 0.1) / fallS;
        for (let i = eggs.length - 1; i >= 0; i--) {
          const g = eggs[i];
          if (!g.laid) { g.el.style.transform = `translate(${g.hen.x - ez / 2}px, ${g.y}px)`; continue; }
          if (!done || g.judged) g.y += fallV * dt;
          const x = laneX(g.lane);
          g.el.style.transform = `translate(${x - ez / 2}px, ${g.y - ez * 0.6}px)`;
          if (!g.judged && g.y >= basketY()) {
            if (g.lane === lane && Math.abs(fx0 - want) < W / LANES * 0.4) { g.judged = true; caught(g, i); continue; }
            g.judged = "fell";
          }
          if (g.judged === "fell" && g.y >= gy - ez * 0.3) { smash(g); eggs.splice(i, 1); }
        }
        if (!ctx.ended || eggs.length || hens.length) ctx.raf(frame);
      }
      function caught(g, i) {
        eggs.splice(i, 1);
        g.el.remove();
        me.classList.remove("catch"); void me.offsetWidth; me.classList.add("catch");
        if (g.o.kind === "pic") ctx.say(g.o.spoken);
        if (done || ctx.ended) return;
        if (g.o.right) {
          [784, 1047, 1319].forEach((f, k) => tone(f, 0.06, "square", 0.05, k * 0.06));   // peep peep
          word(TEXT.yay[hits % TEXT.yay.length], false, fx0, gy - fz * 1.5);
          chick(fx0, basketY());
          hitPips[hits].classList.add("on");
          hits++;
          if (hits >= GOAL) { done = true; ctx.win(); ctx.confetti(fx, fx0, gy - fz, { count: 90 }); ctx.say(C.answer); }
        } else {
          noise(0.2, "lowpass", 900, 200, 0.4); sweep(500, 150, 0.3, "sawtooth", 0.06);   // splat
          word(TEXT.splat, true, fx0, gy - fz * 1.5);
          me.classList.add("eggy"); eggyT = 1.6;
          missPips[missN].classList.add("on");
          missN++;
          if (missN >= MISSES) { done = true; ctx.lose(); eggyT = 99; showRight(); ctx.later(() => ctx.say(C.answer), 400); }
        }
      }
      function smash(g) {
        const goo = document.createElement("div");
        goo.className = "egc-goo";
        goo.style.left = `${laneX(g.lane)}px`; goo.style.top = `${gy - ez * 0.4}px`;
        yard.insertBefore(goo, me);
        g.el.remove();
        noise(0.08, "lowpass", 800, 300, 0.15);
        ctx.later(() => goo.remove(), 1200);
      }
      function chick(x, y) {
        const c = document.createElement("div");
        c.className = "egc-chick";
        c.innerHTML = '<div class="waddle"><div class="egc-cb"></div><div class="egc-ce a"></div><div class="egc-ce b"></div><div class="egc-cbk"></div></div>';
        fx.appendChild(c);
        const dir = x < W / 2 ? 1 : -1, cs = ez * 0.8;
        c.animate([{ transform: `translate(${x - cs / 2}px, ${y - cs}px) scale(.3)` }, { transform: `translate(${x - cs / 2}px, ${y - cs * 1.6}px) scale(1)`, offset: 0.2 },
          { transform: `translate(${x - cs / 2 + dir * cs * 0.6}px, ${gy - cs}px)`, offset: 0.35 }, { transform: `translate(${dir > 0 ? W + cs : -cs * 2}px, ${gy - cs}px)` }],
          { duration: reduceMotion ? 1 : 2200, fill: "forwards" });
        ctx.later(() => c.remove(), 2250);
      }
      function showRight() { eggs.forEach((g) => { if (g.o.right) g.el.classList.add("right"); }); }
      function word(text, bad, x, y) {
        const w = document.createElement("div");
        w.className = "egc-word" + (bad ? " bad" : "");
        w.textContent = text;
        w.style.left = `${Math.max(80, Math.min(W - 80, x))}px`; w.style.top = `${Math.max(26, y)}px`;
        fx.appendChild(w);
        ctx.later(() => w.remove(), 1000);
      }

      ctx.onTimeout(() => { done = true; showRight(); ctx.say(C.answer); });

      layout();
      const ro = new ResizeObserver(layout);
      ro.observe(yard);
      ctx.say(C.prompt);
      const rev = ctx.reveal(card);
      ctx.later(() => { started = true; nextAt = performance.now(); }, (rev || 0) + 200);
      ctx.raf(frame);

      // Tutorial: for each egg about to land, go under it if it's right, get out from under it if it's wrong.
      const laneAt = (l) => () => { const rr = ctx.root.getBoundingClientRect(), r = yard.getBoundingClientRect(); return { x: r.left - rr.left + laneX(l), y: r.top - rr.top + H * 0.6 }; };
      ctx.tutorial(C.target, async (f) => {
        await f.point(card, 800);
        while (!done) {
          const ok = await f.until(() => eggs.some((g) => g.laid && !g.judged), 9000);
          if (!ok || done) break;
          const nx = eggs.filter((g) => g.laid && !g.judged).sort((a, b) => b.y - a.y)[0];
          let want = lane;
          if (nx.o.right) want = nx.lane;
          else if (nx.lane === lane) want = [0, 1, 2].find((l) => l !== nx.lane && !eggs.some((g) => g !== nx && g.laid && !g.judged && g.lane === l && !g.o.right)) ?? (nx.lane + 1) % 3;
          if (want !== lane) await f.tapNow(laneAt(want));
          await f.until(() => nx.judged || done, 4000);
        }
      });
      return () => { done = true; ro.disconnect(); document.removeEventListener("keydown", onKey); };
    },
  });
})();
