// HOOP SHOT — a basketball game. The card at the top shows the target (letter; phonics letter; CVC
// word; HFW 🔊) and the voice says it. Three hoops stand across the top of the court, each with a sign
// on its backboard. A silly basketball (googly eyes, big grin) waits at the bottom. Tap a hoop (or flick
// the ball towards one) to shoot: the ball flies in an arc. The right hoop: SWISH through the net, a
// point (🏀 pips), a new ball pops up and the signs change (the next row from ctx.choiceRows, so
// phonics gets a different picture each time). A wrong hoop: CLANG off the rim, the ball bounces away
// dizzy, a miss (❌ pips) and the same choice comes back reshuffled. 3 points win (confetti, the ball
// spins); 3 misses lose. Faster speeds: the hoops slide side to side from 1.5×, 4 hoops from 2×.
(function () {
  const TEXT = {
    name: { en: "Hoop Shot" },
    icon: "🏀",
    howTo: (list) => ({ en: {
      steps: [
        list.type === "hfw" ? ["👂", "Listen to the word, like \"the\"."] : ["👀", "Look at the card at the top."],
        ["🏀", "Tap the hoop with the same one to shoot!"],
        ["⭐", "Score 3 baskets to win."],
      ],
      tips: [
        "Tap the card to hear it again.",
        "You can also flick the ball towards a hoop.",
        "A wrong hoop goes CLANG. Three misses and the game is over.",
        "When the game speeds up, the hoops move and there are more of them.",
      ],
    } }),
    instruction: { en: "SHOOT\nHOOPS!" },
    cardLabel: "Hear it again",
    hoopLabel: (t) => `Shoot at ${t}`,
    swish: "SWISH!",
    clang: "CLANG!",
  };

  const CSS = `
  .hs { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:8px; padding-bottom:8px; }
  .hs-top { flex:none; display:flex; align-items:center; gap:12px; }
  .hs-card { min-width:84px; height:72px; padding:0 18px; border-radius:18px; font:inherit; font-size:2.6rem; line-height:1; background:#fff; color:#111;
    border:5px solid #111; box-shadow:0 6px 0 #111; display:flex; align-items:center; justify-content:center; gap:8px; cursor:pointer; touch-action:manipulation; }
  .hs-card .spk { font-size:1.3rem; opacity:.6; }
  .hs-pips { display:flex; flex-direction:column; gap:6px; }
  .hs-row { display:flex; gap:5px; }
  .hs-pip { width:24px; height:24px; border:3px solid #111; border-radius:50%; background:#fff; display:flex; align-items:center; justify-content:center; font-size:14px; line-height:1; }
  .hs-pip.on { background:#ff8a1f; box-shadow:inset 0 0 0 3px #ffb766; }
  .hs-pip.miss { background:#ff4d6d; }
  .hs-pip.miss::after { content:"✕"; color:#fff; font-weight:900; }
  /* The court: a blue wall at the back, a wooden floor in front */
  .hs-court { position:relative; flex:1; min-height:0; width:100%; max-width:560px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111;
    background:linear-gradient(180deg, #2f5fd0 0 62%, #d99a52 62%); touch-action:none; }
  .hs-court::before { content:""; position:absolute; left:0; right:0; top:62%; bottom:0;
    background:repeating-linear-gradient(90deg, transparent 0 46px, rgba(0,0,0,.12) 46px 49px); border-top:5px solid #111; }
  .hs-court::after { content:""; position:absolute; left:50%; bottom:-30%; width:70%; height:60%; transform:translateX(-50%); border:5px solid rgba(255,255,255,.75); border-radius:50%; }
  .hs-fx { position:absolute; inset:0; pointer-events:none; overflow:visible; z-index:8; }

  /* A hoop: backboard with the sign, an orange rim, a white net */
  .hs-hoop { position:absolute; left:0; top:0; width:var(--hw); padding:0; border:0; background:none; font:inherit; cursor:pointer; touch-action:manipulation; z-index:2; }
  .hs-board { position:relative; width:100%; height:calc(var(--hw) * .66); background:#fff; border:5px solid #111; border-radius:10px; box-shadow:0 5px 0 rgba(0,0,0,.35);
    display:flex; align-items:center; justify-content:center; }
  .hs-sign { position:relative; z-index:1; margin-bottom:12%; min-width:56%; padding:0 6px; color:#111; font-size:calc(var(--hw) * .3); line-height:1.1; white-space:nowrap;
    background:#fff; border-radius:8px; }
  .hs-sign.pic { font-size:calc(var(--hw) * .3); }
  .hs-rim { position:relative; z-index:3; width:66%; height:calc(var(--hw) * .1); margin:-3px auto 0; border:5px solid #ff6a00; border-radius:50%; box-shadow:0 2px 0 #111, inset 0 2px 0 #111; }
  .hs-net { position:relative; z-index:1; width:58%; height:calc(var(--hw) * .36); margin:-4px auto 0; clip-path:polygon(0 0, 100% 0, 84% 100%, 16% 100%); transform-origin:50% 0;
    background:repeating-linear-gradient(60deg, transparent 0 7px, #fff 7px 10px), repeating-linear-gradient(-60deg, transparent 0 7px, #fff 7px 10px); }
  .hs-hoop.swish .hs-net { animation:hs-swish .35s ease-out; }
  .hs-hoop.clang .hs-board { animation:hs-clang .3s ease-out; }
  .hs-hoop.right .hs-board { box-shadow:0 0 0 5px #fff, 0 0 0 10px #00b86b; }
  .hs-hoop.dim { opacity:.5; }
  .hs-hoop.flip .hs-sign { animation:hs-flip .3s ease-out; }

  /* The ball: orange, seams, googly eyes, a big grin. Its anchor is its centre. */
  .hs-ball { position:absolute; left:0; top:0; width:var(--bz); height:var(--bz); z-index:4; pointer-events:none; will-change:transform; }
  .hs-bin { position:absolute; inset:0; border-radius:50%; background:radial-gradient(circle at 35% 30%, #ffb766 0 18%, #ff8a1f 45%, #e86a00 100%); border:4px solid #111;
    overflow:hidden; filter:drop-shadow(0 5px 0 rgba(0,0,0,.3)); }
  .hs-bin::before { content:""; position:absolute; left:-10%; right:-10%; top:47%; height:0; border-top:3px solid #111; }
  .hs-bin::after { content:""; position:absolute; left:22%; top:-10%; bottom:-10%; width:56%; border:3px solid #111; border-top:0; border-bottom:0; border-radius:50%; opacity:.8; }
  .hs-eye { position:absolute; top:18%; width:30%; aspect-ratio:1; background:#fff; border:3px solid #111; border-radius:50%; z-index:1; }
  .hs-eye.l { left:14%; } .hs-eye.r { right:14%; width:25%; top:22%; }
  .hs-eye i { position:absolute; left:28%; top:30%; width:48%; aspect-ratio:1; background:#111; border-radius:50%; animation:hs-goggle 1.1s ease-in-out infinite; }
  .hs-eye.r i { animation-delay:-.45s; }
  .hs-mouth { position:absolute; left:26%; right:26%; top:58%; height:24%; z-index:1; background:#6b1020; border:3px solid #111; border-radius:4px 4px 999px 999px; overflow:hidden; }
  .hs-mouth::after { content:""; position:absolute; left:26%; right:26%; bottom:-24%; height:55%; background:#ff6f91; border-radius:50%; }
  .hs-ball.dizzy .hs-eye i { animation:hs-dizzy .45s linear infinite; }
  .hs-ball.dizzy .hs-mouth { left:40%; right:40%; height:14%; top:64%; border-radius:50%; }
  .hs-ball.yay .hs-bin { animation:hs-spin .6s ease-in-out 2; }
  .hs-ball.pop .hs-bin { animation:hs-pop .3s cubic-bezier(.2,1.8,.4,1); }
  .hs-word { position:absolute; transform:translate(-50%, -50%) rotate(-8deg); z-index:9; pointer-events:none; font-size:1.8rem; color:#fff; -webkit-text-stroke:2px #111;
    paint-order:stroke fill; text-shadow:0 4px 0 #111; animation:hs-word .7s ease-out forwards; white-space:nowrap; }
  .hs-word.bad { color:#ff4d6d; }

  @keyframes hs-swish { 40% { transform:scaleY(1.35) scaleX(.85); } }
  @keyframes hs-clang { 30% { transform:rotate(-4deg); } 60% { transform:rotate(3deg); } }
  @keyframes hs-flip { from { transform:rotateX(90deg); } }
  @keyframes hs-goggle { 0%, 100% { transform:translate(-16%, 0); } 50% { transform:translate(16%, -12%); } }
  @keyframes hs-dizzy { from { transform:rotate(0) translate(30%); } to { transform:rotate(360deg) translate(30%); } }
  @keyframes hs-spin { to { transform:rotate(360deg); } }
  @keyframes hs-pop { from { transform:scale(.2); } }
  @keyframes hs-word { from { opacity:1; transform:translate(-50%, -50%) rotate(-8deg) scale(.6); } 30% { transform:translate(-50%, -60%) rotate(-8deg) scale(1.15); }
    to { opacity:0; transform:translate(-50%, -110%) rotate(-8deg) scale(1); } }
  @media (prefers-reduced-motion: reduce) { .hs-eye i, .hs-hoop.swish .hs-net, .hs-ball.yay .hs-bin, .hs-word { animation:none !important; } }`;

  function injectCss() {
    if (document.getElementById("hs-css")) return;
    const style = document.createElement("style");
    style.id = "hs-css";
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  registerMicrogame({
    id: "hoop-shot",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 12000,
    input: "tap",
    tutorial: true, // has a ctx.tutorial script

    start(ctx) {
      injectCss();
      const speed = ctx.speed || 1;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const { tone, sweep, noise } = ctx.sfx;
      const GOAL = 3, MISSES = 3;
      const N = speed >= 2 ? 4 : 3;
      const moving = speed >= 1.5 && !reduceMotion;
      // One row of options per basket: ABC is half same-case, half capital → lowercase; phonics gets a
      // different picture of the letter each time.
      const C = ctx.choiceRows(GOAL, N, { lowercase: true });

      // ---------- DOM ----------
      const wrap = document.createElement("div");
      wrap.className = "hs";
      const top = document.createElement("div");
      top.className = "hs-top";
      const card = document.createElement("button");
      card.className = "hs-card";
      card.setAttribute("aria-label", TEXT.cardLabel);
      card.innerHTML = '<span class="ct"></span>';
      card.firstChild.textContent = C.cardText;
      if (ctx.canSpeak && !C.listen) card.insertAdjacentHTML("beforeend", '<span class="spk">🔊</span>');
      card.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });
      const pips = document.createElement("div");
      pips.className = "hs-pips";
      pips.innerHTML = `<div class="hs-row score">${'<span class="hs-pip"></span>'.repeat(GOAL)}</div>` +
        `<div class="hs-row misses">${'<span class="hs-pip"></span>'.repeat(MISSES)}</div>`;
      top.append(card, pips);
      const court = document.createElement("div");
      court.className = "hs-court";
      const fx = document.createElement("div");
      fx.className = "hs-fx";
      court.appendChild(fx);
      wrap.append(top, court);
      ctx.root.appendChild(wrap);

      const hoops = [...Array(N)].map((_, i) => {
        const el = document.createElement("button");
        el.className = "hs-hoop";
        el.innerHTML = '<div class="hs-board"><span class="hs-sign"></span></div><div class="hs-rim"></div><div class="hs-net"></div>';
        el.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); shoot(h); });
        el.addEventListener("click", (e) => { if (e.detail === 0) shoot(h); });
        court.appendChild(el);
        const h = { el, i, sign: el.querySelector(".hs-sign"), rim: el.querySelector(".hs-rim"), opt: null, x: 0, y: 0, ph: Math.random() * 6.28 };
        return h;
      });
      const ball = document.createElement("div");
      ball.className = "hs-ball";
      ball.innerHTML = '<div class="hs-bin"><div class="hs-eye l"><i></i></div><div class="hs-eye r"><i></i></div><div class="hs-mouth"></div></div>';
      court.appendChild(ball);

      // ---------- Layout ----------
      let W = 0, H = 0, hw = 100, bz = 70, hoopY = 10, homeX = 0, homeY = 0;
      function layout() {
        W = court.clientWidth; H = court.clientHeight;
        hw = Math.max(70, Math.min((W - 16) / N - 12, H * 0.34, 150));
        bz = Math.max(54, Math.min(W * 0.2, H * 0.22, 100));
        court.style.setProperty("--hw", `${hw}px`);
        court.style.setProperty("--bz", `${bz}px`);
        hoopY = Math.max(8, H * 0.04);
        homeX = W / 2; homeY = H - bz * 0.65;
        if (!flying) setBall(homeX, homeY);
      }
      const laneX = (i) => (W / N) * (i + 0.5);
      function placeHoops(now) {
        hoops.forEach((h) => {
          const sway = moving ? Math.sin(now * 0.0012 * speed + h.ph) * (W / N) * 0.14 * (h.i % 2 ? -1 : 1) : 0;
          h.x = laneX(h.i) + sway; h.y = hoopY;
          h.el.style.transform = `translate(${(h.x - hw / 2).toFixed(1)}px, ${h.y.toFixed(1)}px)`;
        });
      }
      // The middle of a hoop's rim, in court px (read from the page, so it follows a moving hoop).
      function rimPoint(h) {
        const r = h.rim.getBoundingClientRect(), c = court.getBoundingClientRect();
        return { x: r.left + r.width / 2 - c.left, y: r.top + r.height / 2 - c.top };
      }
      function setBall(x, y, s = 1, rot = 0) {
        ball.style.transform = `translate(${(x - bz / 2).toFixed(1)}px, ${(y - bz / 2).toFixed(1)}px) scale(${s.toFixed(3)}) rotate(${rot.toFixed(0)}deg)`;
      }

      // ---------- Rows of signs ----------
      let step = 0, misses = 0, done = false, flying = false;
      function showRow(flip) {
        const row = ctx.shuffle(C.rows[step].slice());
        hoops.forEach((h, i) => {
          h.opt = row[i];
          h.sign.textContent = h.opt.text;
          h.sign.classList.toggle("pic", h.opt.kind === "pic");
          h.sign.style.fontSize = h.opt.kind === "word" ? `${Math.min(hw * 0.3, (hw * 0.9) / (h.opt.text.length * 0.6))}px` : "";
          h.el.setAttribute("aria-label", TEXT.hoopLabel(h.opt.spoken));
          if (flip) { h.el.classList.remove("flip"); void h.el.offsetWidth; h.el.classList.add("flip"); }
        });
      }

      // ---------- Shooting ----------
      function shoot(h) {
        if (done || flying || ctx.ended) return;
        flying = true;
        const right = h.opt.right;
        sweep(300, 600, 0.12, "sine", 0.1); // whoosh
        const from = { x: homeX, y: homeY }, t0 = performance.now(), ms = reduceMotion ? 1 : 620;
        const end = 0.42; // ball size at the rim (it's further away)
        function fly(now) {
          const k = Math.min(1, (now - t0) / ms), to = rimPoint(h);
          const x = from.x + (to.x - from.x) * k;
          const y = from.y + (to.y - bz * end * 0.5 - from.y) * k - Math.sin(k * Math.PI) * H * 0.28;
          setBall(x, y, 1 - (1 - end) * k, k * 540);
          if (k < 1) { ctx.raf(fly); return; }
          if (right) swish(h); else clang(h);
        }
        ctx.raf(fly);
      }

      function swish(h) {
        // Through the net, then down and out of sight.
        h.el.classList.remove("swish"); void h.el.offsetWidth; h.el.classList.add("swish");
        noise(0.25, "highpass", 2500, 5000, 0.25); tone(880, 0.08, "triangle", 0.12, 0.05); // swish
        word(rimPoint(h), TEXT.swish, false);
        if (h.opt.kind === "pic") ctx.say(h.opt.spoken);
        pips.querySelector(".score").children[step].classList.add("on");
        step++;
        const p = rimPoint(h), t0 = performance.now(), ms = reduceMotion ? 1 : 380;
        (function drop(now) {
          const k = Math.min(1, (now - t0) / ms);
          setBall(p.x, p.y + k * H * 0.3, 0.42, 540 + k * 90);
          ball.style.opacity = String(1 - k);
          if (k < 1) { ctx.raf(drop); return; }
          if (step >= GOAL) { win(); return; }
          showRow(true);
          newBall();
        })(t0);
      }

      function clang(h) {
        h.el.classList.remove("clang"); void h.el.offsetWidth; h.el.classList.add("clang");
        tone(1400, 0.08, "square", 0.08); tone(980, 0.2, "square", 0.07, 0.04); // CLANG
        word(rimPoint(h), TEXT.clang, true);
        ball.classList.add("dizzy");
        misses++;
        pips.querySelector(".misses").children[misses - 1].classList.add("miss");
        if (misses >= MISSES) { done = true; ctx.lose(); }
        // Bounce off sideways and fall to the floor.
        const p = rimPoint(h), side = p.x < W / 2 ? 1 : -1, t0 = performance.now(), ms = reduceMotion ? 1 : 700;
        (function bounce(now) {
          const k = Math.min(1, (now - t0) / ms);
          const x = p.x + side * k * W * 0.3;
          const y = p.y - Math.sin(Math.min(1, k * 1.4) * Math.PI) * H * 0.12 + Math.max(0, k - 0.35) * (H * 0.85);
          setBall(x, Math.min(H - bz * 0.3, y), 0.42 + k * 0.4, 540 + k * 400 * side);
          if (k < 1) { ctx.raf(bounce); return; }
          if (done) { showRight(); ctx.say(C.answer); return; }
          showRow(true); // the same choice again, reshuffled
          newBall();
        })(t0);
      }

      function newBall() {
        ball.classList.remove("dizzy");
        ball.style.opacity = "";
        setBall(homeX, homeY);
        ball.classList.remove("pop"); void ball.offsetWidth; ball.classList.add("pop");
        tone(660, 0.05, "triangle", 0.08);
        flying = false;
      }

      function win() {
        done = true;
        ctx.win();
        ball.style.opacity = "";
        setBall(homeX, homeY);
        ball.classList.add("yay");
        [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.14, "triangle", 0.12, i * 0.08)); // ta-da
        ctx.confetti(fx, W / 2, H * 0.4, { count: 90 });
        ctx.say(C.answer);
      }

      function word(at, text, bad) {
        const w = document.createElement("div");
        w.className = "hs-word" + (bad ? " bad" : "");
        w.textContent = text;
        w.style.left = `${Math.max(50, Math.min(W - 50, at.x))}px`;
        w.style.top = `${at.y + hw * 0.2}px`;
        fx.appendChild(w);
        ctx.later(() => w.remove(), 800);
      }
      function showRight() { hoops.forEach((h) => h.el.classList.add(h.opt.right ? "right" : "dim")); }
      function replay() { if (!done) ctx.say(C.prompt); }

      // ---------- Flick the ball towards a hoop ----------
      let flick = null;
      court.addEventListener("pointerdown", (e) => {
        if (done || flying) return;
        e.preventDefault();
        flick = { id: e.pointerId, x: e.clientX, y: e.clientY };
      });
      const endFlick = (e) => {
        if (!flick || e.pointerId !== flick.id) return;
        const dx = e.clientX - flick.x, dy = e.clientY - flick.y;
        flick = null;
        if (dy > -30 || Math.abs(dy) < Math.abs(dx) * 0.5) return; // not an upward flick
        // Where the flick line reaches the hoops' height: the nearest hoop there.
        const c = court.getBoundingClientRect(), sx = e.clientX - c.left - dx, sy = e.clientY - c.top - dy;
        const ax = sx + (dx / -dy) * (sy - hoopY - hw * 0.7);
        const h = hoops.slice().sort((a, b) => Math.abs(a.x - ax) - Math.abs(b.x - ax))[0];
        shoot(h);
      };
      court.addEventListener("pointerup", endFlick);
      court.addEventListener("pointercancel", () => { flick = null; });

      ctx.onTimeout(() => { done = true; showRight(); ctx.say(C.answer); });
      function onKey(e) {
        const i = parseInt(e.key, 10) - 1;
        if (i >= 0 && i < N) { e.preventDefault(); shoot(hoops[i]); }
        else if (e.key === " ") { e.preventDefault(); replay(); }
      }
      document.addEventListener("keydown", onKey);

      function frame(now) { placeHoops(now); if (!ctx.ended || flying) ctx.raf(frame); }
      layout();
      placeHoops(performance.now());
      showRow(false);
      ctx.raf(frame);
      const ro = new ResizeObserver(() => { layout(); placeHoops(performance.now()); });
      ro.observe(court);

      ctx.say(C.prompt);
      // Show the target big in the middle for a moment before play starts (ctx.reveal).
      ctx.reveal(card);

      // Tutorial: point at the card, then shoot at the right hoop three times (the signs change each time).
      ctx.tutorial(C.target, async (f) => {
        await f.point(card);
        for (let n = 0; n < GOAL && !done; n++) {
          await f.until(() => !flying && step === n, 4000);
          await f.tap(() => hoops.find((h) => h.opt.right).el.querySelector(".hs-board"));
          await f.until(() => step > n || done, 3000);
        }
      });

      return () => { done = true; ro.disconnect(); document.removeEventListener("keydown", onKey); };
    },
  });
})();
