// SKATEBOARD DASH — a runner (Claude's idea, named by the teacher). Your character skates along a street that
// scrolls by; the card shows one target. Ramps roll in from the right, all alike, each with a sign: a ramp with the
// right answer, stay down: you ride up it and do a trick (RAD!); a wrong one hides a banana peel, so tap to JUMP over
// it. Ride 4 ramps to win; slip on a peel and you tumble (WHOOPS!), ✕; 3 tumbles lose. A missed ramp just rolls
// by (more come). About every other thing is right (choiceRows rows strung together: phonics, a different picture
// each time).
(function () {
  const TEXT = {
    name: { en: "Skateboard Dash" },
    icon: "🛹",
    howTo: { en: {
      steps: [
        ["👀", "Look at the card."],
        ["🛹", "Things roll toward you. A RAMP with the card's answer: stay down and ride it!"],
        ["🍌", "A ramp with a wrong answer hides a banana peel: TAP to jump over it!"],
      ],
      tips: ["Ride 4 ramps to win. Slip on 3 peels and it's over.", "Missed a ramp? Don't worry, more are coming.", "Tap the card to hear it again."],
    } },
    instruction: { en: "SKATE!" },
    cardLabel: "The card. Tap to hear it again.",
    rad: ["RAD!", "SICK TRICK!", "AWESOME!", "WOW!"],
    whoops: "WHOOPS!",
    hop: "NICE JUMP!",
  };
  const GOAL = 4, MISSES = 3;

  const CSS = `
  .skd { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:6px; padding-bottom:6px; }
  .skd-top { flex:none; display:flex; align-items:center; gap:10px; }
  .skd-card { padding:4px 16px; background:#fff; border:5px solid #111; border-radius:16px; box-shadow:0 5px 0 #111; font:inherit; color:#111; font-size:clamp(1.8rem, 8vw, 2.8rem);
    line-height:1.05; cursor:pointer; touch-action:manipulation; display:flex; align-items:center; gap:6px; white-space:nowrap; }
  .skd-card .spk { font-size:.45em; }
  .skd-pips { display:flex; flex-direction:column; gap:4px; }
  .skd-row { display:flex; gap:4px; }
  .skd-pip { width:22px; height:22px; border:3px solid #111; border-radius:50%; background:#fff; display:flex; align-items:center; justify-content:center; font-size:12px; line-height:1; }
  .skd-pip.on { background:#ffd400; } .skd-pip.on::after { content:"🛹"; }
  .skd-pip.x.on { background:#ff5a6e; } .skd-pip.x.on::after { content:"✕"; color:#fff; font-weight:900; }
  .skd-street { position:relative; flex:1; min-height:0; width:100%; max-width:640px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111;
    background:#8fd8ff; touch-action:manipulation; cursor:pointer; }
  .skd-city { position:absolute; left:0; right:0; bottom:calc(100% - var(--gy)); height:44%;
    background:linear-gradient(0deg, #f2a0c0 0 100%) 0 100% / 90px 60% repeat-x, linear-gradient(0deg, #c38bff 0 100%) 45px 100% / 90px 85% repeat-x; opacity:.7; }
  .skd-road { position:absolute; left:0; right:0; top:var(--gy); bottom:0; background:#555; border-top:5px solid #111;
    background-image:linear-gradient(90deg, #ffd400 0 40px, transparent 40px 90px); background-size:90px 6px; background-repeat:repeat-x; background-position-y:55%; }
  /* You on your board (--smz) */
  .skd-me { position:absolute; left:0; top:0; width:var(--smz); height:calc(var(--smz) * 1.2); z-index:4; pointer-events:none; }
  .skd-me .ms { position:absolute; left:0; top:0; }
  .skd-board { position:absolute; left:-8%; right:-8%; bottom:0; height:11%; background:#e8173c; border:3px solid #111; border-radius:99px; }
  .skd-board::before, .skd-board::after { content:""; position:absolute; bottom:-80%; width:22%; aspect-ratio:1; background:#ffd400; border:3px solid #111; border-radius:50%; }
  .skd-board::before { left:12%; } .skd-board::after { right:12%; }
  .skd-me.trick .ms { animation:skd-flip .6s ease-in-out; }
  .skd-me.fall { transition:transform .1s; }
  /* A thing on the road (--iz): a ramp (right) or a banana peel (wrong), and a sign above it */
  .skd-thing { position:absolute; left:0; top:0; width:var(--iz); height:var(--iz); z-index:3; pointer-events:none; }
  .skd-sign { position:absolute; left:50%; bottom:100%; transform:translateX(-50%); margin-bottom:6px; padding:2px 8px; background:#fff; border:4px solid #111; border-radius:12px;
    box-shadow:0 4px 0 #111; font-weight:900; color:#111; line-height:1.1; white-space:nowrap; }
  .skd-sign::after { content:""; position:absolute; left:50%; top:100%; width:4px; height:10px; margin-left:-2px; background:#111; }
  .skd-ramp { position:absolute; left:0; right:0; bottom:0; height:46%; background:#ffd400; border:4px solid #111; clip-path:polygon(0 100%, 100% 0, 100% 100%);
    background-image:repeating-linear-gradient(-30deg, transparent 0 10px, rgba(0,0,0,.15) 10px 14px); }
  .skd-peel { position:absolute; left:10%; right:10%; bottom:0; text-align:center; font-size:calc(var(--iz) * .6); line-height:1; }
  .skd-thing.right .skd-sign { box-shadow:0 0 0 4px #fff, 0 0 0 8px #00b86b; }
  .skd-thing.gone { opacity:0; transition:opacity .2s; }
  .skd-fx { position:absolute; inset:0; pointer-events:none; z-index:8; overflow:visible; }
  .skd-word { position:absolute; transform:translate(-50%, -50%) rotate(-8deg); font-size:1.9rem; color:#ffd400; -webkit-text-stroke:2px #111; paint-order:stroke fill;
    text-shadow:0 4px 0 #111; white-space:nowrap; animation:skd-word 1s ease-out forwards; }
  .skd-word.bad { color:#ff5a6e; } .skd-word.small { font-size:1.3rem; color:#fff; }
  @keyframes skd-flip { to { transform:rotate(-360deg); } }
  @keyframes skd-word { from { opacity:1; scale:.5; } 25% { scale:1.15; } 75% { opacity:1; } to { opacity:0; translate:0 -40px; } }
  @media (prefers-reduced-motion: reduce) { .skd-me.trick .ms, .skd-word { animation:none !important; } }
  `;
  function injectCss() { if (document.getElementById("skd-css")) return; const s = document.createElement("style"); s.id = "skd-css"; s.textContent = CSS; document.head.appendChild(s); }

  registerMicrogame({
    id: "skateboard-dash",
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
      const C = ctx.choiceRows(GOAL + 3, 3, { lowercase: true });
      // The stream: each row gives a right one and a wrong one, in a random order (about every other is right).
      let rowI = 0;
      const stream = [];
      function refill() {
        const row = C.rows[rowI++ % C.rows.length];
        const right = row.find((o) => o.right), wrong = ctx.pick(row.filter((o) => !o.right));
        stream.push(...ctx.shuffle([right, wrong]));
      }

      const wrap = document.createElement("div");
      wrap.className = "skd";
      const top = document.createElement("div");
      top.className = "skd-top";
      const card = document.createElement("button");
      card.className = "skd-card";
      card.setAttribute("aria-label", TEXT.cardLabel);
      card.innerHTML = '<span class="ct"></span>';
      card.firstChild.textContent = C.listen ? C.target.text : C.cardText;   // (always shown: it's too fast to play by ear)
      if (ctx.canSpeak) card.insertAdjacentHTML("beforeend", '<span class="spk">🔊</span>');
      card.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); ctx.say(C.prompt); });
      const pips = document.createElement("div");
      pips.className = "skd-pips";
      pips.innerHTML = `<div class="skd-row hits">${'<span class="skd-pip"></span>'.repeat(GOAL)}</div><div class="skd-row">${'<span class="skd-pip x"></span>'.repeat(MISSES)}</div>`;
      top.append(card, pips);
      const street = document.createElement("div");
      street.className = "skd-street";
      street.innerHTML = '<div class="skd-city"></div><div class="skd-road"></div>';
      const me = document.createElement("div");
      me.className = "skd-me";
      const fig = window.Mascot ? window.Mascot.el("var(--smz)") : document.createElement("div");
      me.append(fig);
      me.insertAdjacentHTML("beforeend", '<div class="skd-board"></div>');
      const fx = document.createElement("div");
      fx.className = "skd-fx";
      street.append(me, fx);
      wrap.append(top, street);
      ctx.root.appendChild(wrap);
      const hitPips = pips.querySelector(".hits").children, missPips = pips.children[1].children;
      const city = street.querySelector(".skd-city"), road = street.querySelector(".skd-road");

      let W = 0, H = 0, mz = 70, iz = 70, gy = 0, mx = 0;
      function layout() {
        W = street.clientWidth; H = street.clientHeight;
        mz = Math.max(50, Math.min(H * 0.2, W * 0.14, 100));
        iz = Math.max(50, Math.min(H * 0.18, W * 0.14, 90));
        gy = H * 0.78; mx = W * 0.22;
        street.style.setProperty("--smz", `${mz}px`); street.style.setProperty("--iz", `${iz}px`); street.style.setProperty("--gy", `${gy}px`);
      }

      // ---------- You ----------
      let air = 0, jumpT = -1, fallen = 0;
      const jumpMs = 760 / Math.sqrt(pace), jumpH = () => H * 0.3;
      function jump() {
        if (done || ctx.ended || jumpT >= 0 || fallen > 0) return;
        jumpT = 0;
        sweep(300, 800, 0.2, "square", 0.06);   // boing
      }
      street.addEventListener("pointerdown", (e) => { e.preventDefault(); jump(); });
      function onKey(e) { if (e.key === " " || e.key === "ArrowUp") { e.preventDefault(); jump(); } }
      document.addEventListener("keydown", onKey);

      // ---------- Things ----------
      const things = [];
      const cross = 2.8 / pace, gap = 1.55 / pace;   // seconds to reach you; seconds between things
      function spawn() {
        if (!stream.length) refill();
        const o = stream.shift();
        const el = document.createElement("div");
        el.className = "skd-thing";
        // (every ramp looks the same, so only the sign tells you: a wrong one hides a banana peel)
        el.innerHTML = '<span class="skd-sign"></span><div class="skd-ramp"></div>';
        const sg = el.firstChild;
        sg.textContent = o.text;
        sg.style.fontSize = `${o.kind === "word" ? Math.min(iz * 0.42, (iz * 1.6) / ([...o.text].length * 0.62)) : iz * 0.46}px`;
        street.insertBefore(el, me);
        things.push({ o, el, x: W + iz, judged: false });
      }

      let hits = 0, missN = 0, done = false, started = false, last = null, nextAt = 0, scroll = 0;
      function frame(ts) {
        const dt = last == null ? 0 : Math.min(50, ts - last) / 1000;
        last = ts;
        const now = performance.now();
        const v = (W + iz - mx) / cross;
        if (started && !done) {
          if (now >= nextAt) { spawn(); nextAt = now + gap * 1000; }
          scroll += v * dt * (fallen > 0 ? 0.3 : 1);
        }
        // The street scrolls (the city slower, for depth).
        road.style.backgroundPositionX = `${-scroll}px`;
        city.style.backgroundPositionX = `${-scroll * 0.3}px, ${45 - scroll * 0.3}px`;
        // You: jumping, or fallen over for a moment.
        if (jumpT >= 0) { jumpT += dt * 1000; air = Math.sin(Math.min(1, jumpT / jumpMs) * Math.PI) * jumpH(); if (jumpT >= jumpMs) { jumpT = -1; air = 0; } }
        if (fallen > 0) fallen -= dt;
        me.style.transform = `translate(${mx - mz / 2}px, ${gy - mz * 1.2 - air}px) rotate(${fallen > 0 ? -70 : air > 0 ? -12 : 0}deg)`;
        for (let i = things.length - 1; i >= 0; i--) {
          const t = things[i];
          if (started && !done) t.x -= v * dt * (fallen > 0 ? 0.3 : 1);
          t.el.style.transform = `translate(${t.x - iz / 2}px, ${gy - iz}px)`;
          if (!t.judged && t.x <= mx + iz * 0.1) judge(t);
          if (t.x < -iz * 2) { t.el.remove(); things.splice(i, 1); }
        }
        if (!ctx.ended || things.length) ctx.raf(frame);
      }
      // A thing reaches you: on the ground, a ramp is a trick and a peel is a tumble; in the air, it passes under.
      function judge(t) {
        t.judged = true;
        if (done || ctx.ended) return;
        const onGround = air < mz * 0.25 && fallen <= 0;
        if (t.o.right && onGround) trick(t);
        else if (!t.o.right && onGround) tumble(t);
        else if (!t.o.right) word(TEXT.hop, false, mx + mz, gy - mz * 2, true);
      }
      function trick(t) {
        jumpT = 0;   // up the ramp
        me.classList.remove("trick"); void me.offsetWidth; me.classList.add("trick");
        [523, 659, 784].forEach((f, k) => tone(f, 0.08, "square", 0.07, k * 0.07));
        word(TEXT.rad[hits % TEXT.rad.length], false, mx + mz, gy - mz * 2.2);
        if (t.o.kind === "pic") ctx.say(t.o.spoken);
        hitPips[hits].classList.add("on");
        hits++;
        if (hits >= GOAL) { done = true; ctx.win(); ctx.confetti(fx, mx, gy - mz * 2, { count: 90 }); ctx.say(C.answer); }
      }
      function tumble(t) {
        fallen = 0.9;
        // The banana peel that was hiding on the wrong ramp flies up.
        const peel = document.createElement("div");
        peel.className = "skd-peel"; peel.textContent = "🍌";
        t.el.appendChild(peel);
        peel.animate([{ transform: "translateY(0) rotate(0)" }, { transform: `translateY(${-iz}px) rotate(300deg)` }, { transform: `translateY(${-iz * 0.3}px) rotate(400deg)`, opacity: 0 }], { duration: 700, fill: "forwards" });
        ctx.later(() => t.el.classList.add("gone"), 500);
        noise(0.15, "lowpass", 700, 200, 0.4); sweep(700, 200, 0.4, "sawtooth", 0.07);   // whoops… thud
        word(TEXT.whoops, true, mx + mz, gy - mz * 2);
        if (t.o.kind === "pic") ctx.say(t.o.spoken);
        missPips[missN].classList.add("on");
        missN++;
        if (missN >= MISSES) { done = true; ctx.lose(); if (window.Mascot) window.Mascot.mood(fig, "sad"); fallen = 99; ctx.later(() => ctx.say(C.answer), 400); }
      }
      function word(text, bad, x, y, small) {
        const w = document.createElement("div");
        w.className = "skd-word" + (bad ? " bad" : "") + (small ? " small" : "");
        w.textContent = text;
        w.style.left = `${Math.max(80, Math.min(W - 80, x))}px`; w.style.top = `${Math.max(26, y)}px`;
        fx.appendChild(w);
        ctx.later(() => w.remove(), 1000);
      }

      ctx.onTimeout(() => { done = true; if (window.Mascot) window.Mascot.mood(fig, "sad"); things.forEach((t) => { if (t.o.right) t.el.classList.add("right"); }); ctx.say(C.answer); });

      layout();
      const ro = new ResizeObserver(layout);
      ro.observe(street);
      ctx.say(C.prompt);
      const rev = ctx.reveal(card);
      ctx.later(() => { started = true; nextAt = performance.now(); }, (rev || 0) + 200);
      ctx.raf(frame);

      // Tutorial: jump over each peel as it comes; ride the ramps.
      ctx.tutorial(C.target, async (f) => {
        await f.point(card, 800);
        while (!done) {
          const ok = await f.until(() => things.some((t) => !t.judged && !t.o.right && t.x - mx < iz * 1.6 && t.x - mx > iz * 0.6), 9000);
          if (!ok || done) break;
          await f.tapNow(street);
          await f.until(() => jumpT < 0, 2000);
        }
      });
      return () => { done = true; ro.disconnect(); document.removeEventListener("keydown", onKey); };
    },
  });
})();
