// ARCHERY — a power-bar game (js/power.js). The card at the top shows the target (letter; phonics letter;
// CVC word; HFW 🔊) and the voice says it. A folk-hero archer monster (green, feathered cap, googly eyes,
// a bow) stands on the left of a meadow; three bullseye targets stand at increasing distance, ringed
// green (near), yellow (middle) and red (far) like the power bar's bands, each with an option in the
// middle (a row from ctx.choiceRows). Charge the power bar (press and hold, or tap, tap): short power
// reaches the near target, medium the middle, strong the far one. The arrow arcs over and thunks in.
// Right: BULLSEYE!, a hit pip, and the targets change. Wrong: OOPS, a miss pip, the same choice again
// reshuffled. 3 hits win; 3 misses lose. Faster speeds: the needle moves a little faster.
(function () {
  const TEXT = {
    name: { en: "Archery" },
    icon: "🏹",
    howTo: (list) => ({ en: {
      steps: [
        list.type === "hfw" ? ["👂", "Listen to the word, like \"the\"."] : ["👀", "Look at the card at the top."],
        ["🎯", "Find the target with the same one. Green is near, yellow is in the middle, red is far."],
        ["💪", "Hold to fill the power bar, then let go! (Or tap to start and tap again to shoot.)"],
        ["🔁", "Then the card changes: aim for the new one. Hit 3 targets to win!"],
      ],
      tips: [
        "Green power reaches the green target, yellow the yellow one, red the red one.",
        "Tap the card to hear it again.",
        "Three misses and the game is over.",
      ],
    } }),
    instruction: { en: "HIT THE\nTARGET!" },
    cardLabel: "Hear it again",
    hit: "BULLSEYE!",
    miss: "OOPS!",
  };

  // (the targets' ring colours are the power bar's bands: PowerBar.colors, near to far)
  const CSS = `
  .ar { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:8px; padding-bottom:8px; }
  .ar-top { flex:none; display:flex; align-items:center; gap:12px; }
  .ar-card { min-width:84px; height:72px; padding:0 18px; border-radius:18px; font:inherit; font-size:2.6rem; line-height:1; background:#fff; color:#111;
    border:5px solid #111; box-shadow:0 6px 0 #111; display:flex; align-items:center; justify-content:center; gap:8px; cursor:pointer; touch-action:manipulation; }
  .ar-card .spk { font-size:1.3rem; opacity:.6; }
  .ar-card.next { animation:ar-next .45s cubic-bezier(.2,1.8,.4,1); }   /* a new target for each hit */
  @keyframes ar-next { 0% { transform:scale(.4) rotate(-10deg); } 60% { transform:scale(1.25) rotate(4deg); } 100% { transform:none; } }
  .ar-pips { display:flex; flex-direction:column; gap:6px; }
  .ar-row { display:flex; gap:5px; }
  .ar-pip { width:24px; height:24px; border:3px solid #111; border-radius:50%; background:#fff; font-size:13px; display:flex; align-items:center; justify-content:center; }
  .ar-pip.on { background:#ff4d6d; } .ar-pip.on::after { content:"🎯"; }
  .ar-pip.miss { background:#444; } .ar-pip.miss::after { content:"✕"; color:#fff; font-weight:900; }
  .ar-field { position:relative; flex:1; min-height:0; width:100%; max-width:560px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111;
    background:linear-gradient(180deg, #8fd3ff 0 46%, #7ccf5a 46%); touch-action:none; cursor:pointer; }
  .ar-field::before { content:""; position:absolute; left:-10%; right:-10%; top:40%; height:12%; background:#5aa83c; border-radius:50% 50% 0 0; }   /* far hills */
  .ar-fx { position:absolute; inset:0; pointer-events:none; overflow:visible; z-index:8; }

  /* A target: a bullseye on a wooden stand, ringed in its power colour, an option in the middle. --ts is its size */
  .ar-tgt { position:absolute; width:var(--ts); height:calc(var(--ts) * 1.45); transform:translate(-50%, -100%); z-index:2; pointer-events:none; }
  .ar-legs { position:absolute; left:20%; right:20%; bottom:0; height:52%; border-left:6px solid #8b5a2b; border-right:6px solid #8b5a2b; }
  .ar-face { position:absolute; left:0; top:0; width:100%; aspect-ratio:1; border-radius:50%; border:5px solid #111; background:radial-gradient(circle, #fff 0 22%, var(--ring) 23% 40%, #fff 41% 58%, var(--ring) 59% 76%, #fff 77%); }
  .ar-sign { position:absolute; left:50%; top:calc(var(--ts) * .5); transform:translate(-50%, -50%); min-width:52%; padding:2px 6px; background:#fff; border:4px solid #111;
    border-radius:12px; font-size:calc(var(--ts) * .38); line-height:1.05; color:#111; white-space:nowrap; text-align:center; }
  .ar-tgt.flip .ar-sign { animation:ar-flip .3s ease-out; }
  .ar-tgt.thunk .ar-face { animation:ar-thunk .3s ease-out; }
  .ar-tgt.right .ar-face { box-shadow:0 0 0 5px #fff, 0 0 0 10px #00b86b; }
  .ar-tgt.dim { opacity:.45; }
  .ar-arrow { position:absolute; left:0; top:0; width:60px; height:8px; margin:-4px 0 0 -54px; z-index:6; pointer-events:none; transform-origin:54px 4px;
    background:linear-gradient(90deg, #ff4d6d 0 14px, #8b5a2b 14px 50px, #888 50px); border:2px solid #111; border-radius:2px; clip-path:polygon(0 0, 90% 0, 100% 50%, 90% 100%, 0 100%); }

  /* The archer: a green monster in a feathered cap, with a bow. Anchor: feet. --az is its height */
  .ar-archer { position:absolute; left:0; top:0; width:calc(var(--az) * .8); height:var(--az); margin:calc(var(--az) * -1) 0 0 calc(var(--az) * -.4); z-index:5; pointer-events:none; }
  .ar-abody { position:absolute; left:10%; right:10%; top:22%; bottom:0; background:#3aa64a; border:4px solid #111; border-radius:46% 46% 36% 36%; }
  .ar-cap { position:absolute; left:4%; right:14%; top:4%; height:30%; background:#2e7d32; border:4px solid #111; border-radius:80% 20% 10% 10%; z-index:2; transform:rotate(-8deg); }
  .ar-cap::after { content:""; position:absolute; right:-28%; top:-30%; width:40%; height:22%; background:#e8173c; border:3px solid #111; border-radius:50% 10% 50% 10%; transform:rotate(-35deg); } /* feather */
  .ar-eye { position:absolute; top:34%; width:30%; aspect-ratio:1; background:#fff; border:3px solid #111; border-radius:50%; z-index:1; }
  .ar-eye.l { left:14%; } .ar-eye.r { right:16%; width:25%; top:37%; }
  .ar-eye i { position:absolute; left:28%; top:30%; width:46%; aspect-ratio:1; background:#111; border-radius:50%; animation:ar-goggle 1.1s ease-in-out infinite; }
  .ar-mouth { position:absolute; left:28%; right:28%; top:62%; height:14%; z-index:1; background:#6b1020; border:3px solid #111; border-radius:4px 4px 999px 999px; }
  .ar-bow { position:absolute; right:-34%; top:20%; width:40%; height:70%; border:6px solid #8b5a2b; border-left:0; border-radius:0 999px 999px 0; z-index:3; }
  .ar-string { position:absolute; left:-2px; top:0; bottom:0; width:0; border-left:2px solid #111; transform-origin:50% 50%; }
  .ar-archer.yay { animation:ar-hop .4s cubic-bezier(.2,1.6,.4,1) 3; }
  .ar-archer.sad .ar-mouth { border-radius:999px 999px 4px 4px; height:9%; top:66%; }
  .ar-word { position:absolute; transform:translate(-50%, -50%) rotate(-8deg); z-index:9; pointer-events:none; font-size:1.8rem; color:#ffd400; -webkit-text-stroke:2px #111;
    paint-order:stroke fill; text-shadow:0 4px 0 #111; white-space:nowrap; animation:ar-word .8s ease-out forwards; }
  .ar-word.bad { color:#fff; }
  /* Boss Battle showdown: the boss stands bottom right and shoots at its own target (no sign) on the hill */
  .ar-boss { position:absolute; left:0; top:0; z-index:5; pointer-events:none; }
  .ar-boss .bx-boss { margin:calc(var(--bbs) * -1) 0 0 calc(var(--bbs) * -.5); }
  .ar-btgt { position:absolute; width:var(--bts); height:calc(var(--bts) * 1.45); transform:translate(-50%, -100%); z-index:2; pointer-events:none; --ring:#9a4dff; --ts:var(--bts); }
  .ar-btgt .ar-legs { border-width:0 4px; }
  .ar-btgt.thunk .ar-face { animation:ar-thunk .3s ease-out; }

  @keyframes ar-flip { from { transform:translate(-50%, -50%) rotateX(90deg); } }
  @keyframes ar-thunk { 30% { transform:translateX(4px) rotate(3deg); } 60% { transform:translateX(-3px); } }
  @keyframes ar-goggle { 0%, 100% { transform:translate(-16%, 0); } 50% { transform:translate(16%, -12%); } }
  @keyframes ar-hop { 50% { translate:0 -20%; } }
  @keyframes ar-word { from { opacity:1; transform:translate(-50%, -50%) rotate(-8deg) scale(.6); } 30% { transform:translate(-50%, -60%) rotate(-8deg) scale(1.15); }
    to { opacity:0; transform:translate(-50%, -110%) rotate(-8deg) scale(1); } }
  @media (prefers-reduced-motion: reduce) { .ar-eye i, .ar-archer.yay, .ar-word, .ar-tgt.thunk .ar-face { animation:none !important; } }`;

  function injectCss() {
    if (document.getElementById("ar-css")) return;
    const style = document.createElement("style");
    style.id = "ar-css";
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  registerMicrogame({
    id: "archery",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 16000,
    input: "tap",
    tutorial: true, // has a ctx.tutorial script
    bossRival: true, // Boss Battle showdown: the boss shoots at its own target
    showdownDuration: 26000, // (Boss Battle showdown: ~21 s at 1.25×; kids wait for the power bar to come round a lot: the teacher)

    start(ctx) {
      injectCss();
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const { tone, sweep, noise } = ctx.sfx;
      const GOAL = 3, MISSES = 3;
      // Targets = power bands: 3 at normal speed, 4 from 1.75× (Practice MEDIUM), 5 from 2.5× (HARD).
      const NZ = window.PowerBar.zoneCount(ctx.speed), RINGS = window.PowerBar.colors(NZ);
      // Each hit brings a NEW target ("A"… hit a… "B"… hit b…), with a beat in between where the clock stops
      // while the next one is shown and said (the teacher's idea). A miss keeps the same target.
      const S = ctx.choiceSteps(GOAL, NZ, { lowercase: true });
      let C = S[0];
      const BEAT_MS = 800;

      // ---------- DOM ----------
      const wrap = document.createElement("div");
      wrap.className = "ar";
      const top = document.createElement("div");
      top.className = "ar-top";
      const card = document.createElement("button");
      card.className = "ar-card";
      card.setAttribute("aria-label", TEXT.cardLabel);
      card.innerHTML = '<span class="ct"></span>';
      card.firstChild.textContent = C.cardText;
      if (ctx.canSpeak && !C.listen) card.insertAdjacentHTML("beforeend", '<span class="spk">🔊</span>');
      card.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });
      const pips = document.createElement("div");
      pips.className = "ar-pips";
      pips.innerHTML = `<div class="ar-row hits">${'<span class="ar-pip"></span>'.repeat(GOAL)}</div><div class="ar-row misses">${'<span class="ar-pip"></span>'.repeat(MISSES)}</div>`;
      top.append(card, pips);
      const field = document.createElement("div");
      field.className = "ar-field";
      const fx = document.createElement("div");
      fx.className = "ar-fx";
      field.appendChild(fx);
      wrap.append(top, field);
      ctx.root.appendChild(wrap);

      const targets = RINGS.map((ring, i) => {
        const el = document.createElement("div");
        el.className = "ar-tgt";
        el.style.setProperty("--ring", ring);
        el.innerHTML = '<div class="ar-legs"></div><div class="ar-face"></div><div class="ar-sign"></div>';
        field.appendChild(el);
        return { el, i, sign: el.querySelector(".ar-sign"), opt: null, x: 0, y: 0, s: 0 };
      });
      const archer = document.createElement("div");
      archer.className = "ar-archer";
      archer.innerHTML = '<div class="ar-abody"></div><div class="ar-cap"></div><div class="ar-eye l"><i></i></div><div class="ar-eye r"><i></i></div>' +
        '<div class="ar-mouth"></div><div class="ar-bow"><div class="ar-string"></div></div>';
      field.appendChild(archer);
      const string = archer.querySelector(".ar-string");

      // Boss Battle showdown: the boss stands at the bottom right and shoots at its own plain target on the
      // hill. Its arrows fall short or fly over until time runs out, and then it hits the bullseye.
      const rv = window.Boss && Boss.rival(ctx);
      let boss = null, btgt = null, bpos = { x: 0, y: 0 }, bt = { x: 0, y: 0, s: 40 };
      if (rv) {
        boss = document.createElement("div");
        boss.className = "ar-boss";
        boss.appendChild(rv.el("var(--bbs)"));
        btgt = document.createElement("div");
        btgt.className = "ar-btgt";
        btgt.innerHTML = '<div class="ar-legs"></div><div class="ar-face"></div>';
        field.append(btgt, boss);
      }

      // ---------- Layout: the archer bottom-left, targets further away = higher and smaller ----------
      let W = 0, H = 0, az = 100, ax = 0, ay = 0;
      function layout() {
        W = field.clientWidth; H = field.clientHeight;
        az = Math.max(80, Math.min(H * 0.34, 140));
        field.style.setProperty("--az", `${az}px`);
        ax = 70 + az * 0.4; ay = H - 10;
        archer.style.transform = `translate(${ax}px, ${ay}px)`;
        // Near to far: further right, higher and smaller (spread wider and a little smaller with 4 or 5 targets).
        const x0 = NZ > 3 ? 0.47 : 0.5, sMul = NZ === 3 ? 1 : NZ === 4 ? 0.9 : 0.8, rise = NZ > 3 ? 0.52 : 0.35;
        const spots = targets.map((_, i) => { const k = i / (NZ - 1); return { fx: x0 + (0.91 - x0) * k, fy: 0.95 - rise * k, k: (1 - 0.34 * k) * sMul }; });
        targets.forEach((t, i) => {
          const s = Math.max(60, Math.min(W * 0.2, H * 0.36, 130)) * spots[i].k;
          t.s = s; t.x = W * spots[i].fx; t.y = H * spots[i].fy;
          t.el.style.setProperty("--ts", `${s}px`);
          t.el.style.left = `${t.x}px`; t.el.style.top = `${t.y}px`;
          if (t.opt) fit(t);
        });
        if (rv) {
          const bs = Math.max(56, Math.min(H * 0.24, W * 0.2, 96));
          field.style.setProperty("--bbs", `${bs}px`);
          bpos = { x: W - bs * 0.5 - 6, y: H - 6 };
          boss.style.transform = `translate(${bpos.x}px, ${bpos.y}px)`;
          bt = { x: W * 0.3, y: H * 0.52, s: Math.max(34, Math.min(W * 0.12, 60)) };
          field.style.setProperty("--bts", `${bt.s}px`);
          btgt.style.left = `${bt.x}px`; btgt.style.top = `${bt.y}px`;
        }
      }
      const bullseye = (t) => ({ x: t.x, y: t.y - t.s * 1.45 + t.s * 0.5 });
      function fit(t) { t.sign.style.fontSize = t.opt.kind === "word" ? `${Math.min(t.s * 0.28, (t.s * 0.8) / (t.opt.text.length * 0.6))}px` : ""; }

      // ---------- Rows of options ----------
      let step = 0, misses = 0, done = false, busy = false;
      function showRow(flip) {
        const row = ctx.shuffle(C.row.slice());
        targets.forEach((t, i) => {
          t.opt = row[i];
          t.sign.textContent = t.opt.text;
          fit(t);
          if (flip) { t.el.classList.remove("flip"); void t.el.offsetWidth; t.el.classList.add("flip"); }
        });
      }

      // ---------- The power bar and the shot ----------
      const bar = ctx.powerBar({
        parent: field, press: field, icon: "🏹", zones: NZ,
        onStart: () => { busy = true; },
        onRelease: (zone) => shoot(targets[zone]),
      });
      bar.el.style.left = "8px"; bar.el.style.top = "10px"; bar.el.style.bottom = "10px";
      (function drawString() { // the bowstring pulls back with the power
        if (ctx.ended && !bar.charging) { string.style.transform = ""; return; }
        string.style.transform = bar.charging ? `translateX(${(-bar.level * az * 0.22).toFixed(1)}px)` : "";
        ctx.raf(drawString);
      })();

      function shoot(t) {
        if (done || ctx.ended) return;
        busy = true;
        sweep(900, 300, 0.15, "sine", 0.1); // twang
        const arrow = document.createElement("div");
        arrow.className = "ar-arrow";
        fx.appendChild(arrow);
        const from = { x: ax + az * 0.55, y: ay - az * 0.55 }, to = bullseye(t), t0 = performance.now(), ms = reduceMotion ? 1 : 520;
        const lift = H * (0.15 + 0.12 * t.i);
        let prev = from;
        (function fly(now) {
          const k = Math.min(1, (now - t0) / ms);
          const x = from.x + (to.x - from.x) * k, y = from.y + (to.y - from.y) * k - Math.sin(k * Math.PI) * lift;
          const ang = Math.atan2(y - prev.y, x - prev.x) * 57.3;
          prev = { x, y };
          arrow.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${ang.toFixed(1)}deg) scale(${(1 - 0.35 * k * (t.i / 2)).toFixed(3)})`;
          if (k < 1) { ctx.raf(fly); return; }
          t.el.classList.remove("thunk"); void t.el.offsetWidth; t.el.classList.add("thunk");
          noise(0.06, "lowpass", 900, 300, 0.5); tone(220, 0.06, "square", 0.08); // THUNK
          if (t.opt.right) hit(t, arrow); else miss(t, arrow);
        })(t0);
      }

      function hit(t, arrow) {
        word(bullseye(t), TEXT.hit, false);
        ctx.confetti(fx, bullseye(t).x, bullseye(t).y, { count: 40 });
        tone(880, 0.1, "triangle", 0.12); tone(1320, 0.12, "triangle", 0.1, 0.08);
        if (t.opt.kind === "pic") ctx.say(t.opt.spoken);
        pips.querySelector(".hits").children[step].classList.add("on");
        step++;
        if (step >= GOAL) { win(); return; }
        ctx.later(() => {
          // The beat: the clock stops, the card pops to the next target and the voice says it.
          ctx.pauseTimer(BEAT_MS);
          C = S[step];
          card.firstChild.textContent = C.cardText;
          card.classList.remove("next"); void card.offsetWidth; card.classList.add("next");
          tone(98, 0.08, "square", 0.1); tone(98, 0.08, "square", 0.1, 0.16);
          if (!done) ctx.say(C.prompt);
          arrow.remove(); showRow(true); bar.reset(); busy = false;
        }, 650);
      }
      function miss(t, arrow) {
        word(bullseye(t), TEXT.miss, true);
        sweep(500, 250, 0.3, "triangle", 0.1);
        misses++;
        pips.querySelector(".misses").children[misses - 1].classList.add("miss");
        if (misses >= MISSES) {
          done = true; ctx.lose(); bar.lock();
          archer.classList.add("sad");
          ctx.later(() => { showRight(); ctx.say(C.answer); }, 300);
          return;
        }
        ctx.later(() => { arrow.remove(); showRow(true); bar.reset(); busy = false; }, 700);
      }
      function win() {
        done = true; ctx.win(); bar.lock();
        archer.classList.add("yay");
        [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.14, "triangle", 0.12, i * 0.08));
        ctx.confetti(fx, W / 2, H * 0.4, { count: 90 });
        ctx.say(C.answer);
      }
      function word(at, text, bad) {
        const w = document.createElement("div");
        w.className = "ar-word" + (bad ? " bad" : "");
        w.textContent = text;
        w.style.left = `${Math.max(70, Math.min(W - 70, at.x))}px`; w.style.top = `${at.y - 30}px`;
        fx.appendChild(w);
        ctx.later(() => w.remove(), 850);
      }
      function showRight() { targets.forEach((t) => t.el.classList.add(t.opt.right ? "right" : "dim")); }
      function replay() { if (!done) ctx.say(C.prompt); }

      // The boss's shots: short, over, short… and at time up, the bullseye.
      function bossShot(kind) {
        const arrow = document.createElement("div");
        arrow.className = "ar-arrow";
        fx.appendChild(arrow);
        const bs = parseFloat(field.style.getPropertyValue("--bbs")) || 70;
        const eye = { x: bt.x, y: bt.y - bt.s * 0.95 };
        const from = { x: bpos.x - bs * 0.3, y: bpos.y - bs * 0.55 };
        const to = kind === "hit" ? eye : kind === "short" ? { x: eye.x + bt.s * 1.4, y: bt.y + H * 0.12 } : { x: eye.x - bt.s * 2.2, y: -40 };
        const t0 = performance.now(), ms = reduceMotion ? 1 : 560, lift = H * 0.18;
        let prev = from;
        sweep(800, 260, 0.15, "sine", 0.07);
        (function fly(now) {
          const k = Math.min(1, (now - t0) / ms);
          const x = from.x + (to.x - from.x) * k, y = from.y + (to.y - from.y) * k - Math.sin(k * Math.PI) * lift;
          arrow.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${(Math.atan2(y - prev.y, x - prev.x) * 57.3).toFixed(1)}deg) scale(.8)`;
          prev = { x, y };
          if (k < 1) { ctx.raf(fly); return; }
          if (kind === "hit") {
            btgt.classList.remove("thunk"); void btgt.offsetWidth; btgt.classList.add("thunk");
            noise(0.06, "lowpass", 900, 300, 0.5); tone(220, 0.06, "square", 0.08);
            rv.bubble(window.Boss.TEXT.done, 1500);
            return;
          }
          if (kind === "short") noise(0.05, "lowpass", 600, 200, 0.3); // thud in the grass
          rv.bubble(ctx.pick(window.Boss.TEXT.miss));
          ctx.later(() => arrow.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: "forwards" }), 600);
        })(t0);
      }
      if (rv) {
        rv.tries(3, (i) => { if (!done) bossShot(i % 2 ? "over" : "short"); });
        rv.onTimeUp(() => bossShot("hit"));
      }

      ctx.onTimeout(() => { done = true; bar.lock(); archer.classList.add("sad"); showRight(); ctx.say(C.answer); });
      function onKey(e) {
        if (e.key === " ") { e.preventDefault(); replay(); }
      }
      document.addEventListener("keydown", onKey);

      layout();
      showRow(false);
      const ro = new ResizeObserver(layout);
      ro.observe(field);
      ctx.say(C.prompt);
      // Show the target big in the middle for a moment before play starts (ctx.reveal).
      ctx.reveal(card);
      // 👆 TAP! on the power button (holding it isn't obvious).
      ctx.later(() => ctx.hint(bar.el.querySelector(".pwb-btn"), null, { scale: 0.7 }), 80);

      // Tutorial: point at the card, at the right target, then charge the bar to its colour and shoot (3 times).
      ctx.tutorial(S.map((s) => s.target), async (f) => {
        const btn = bar.el.querySelector(".pwb-btn");
        await f.point(card, 900);
        for (let n = 0; n < 6 && step < GOAL && !done; n++) {
          await f.until(() => !busy && !bar.locked, 4000);
          const t = targets.find((x) => x.opt.right);
          await f.point(t.el.querySelector(".ar-face"), 600);
          await f.move(btn, 400);
          await f.tapNow(btn);                                                   // tap: start charging
          await f.until(() => bar.charging && Math.abs(bar.level - bar.zoneCenter(t.i)) < 0.06, 6000);
          await f.tapNow(btn);                                                   // tap again: shoot
          await f.until(() => !busy || done, 2500);
        }
      });

      return () => { done = true; ro.disconnect(); document.removeEventListener("keydown", onKey); };
    },
  });
})();
