// NINJA ROOFTOPS — a runner (Claude's idea, named by the teacher). Your character, in a ninja headband, runs across
// the rooftops at night; the card shows one target. Paper lanterns float in from the right up high, each with a
// sign. Tap to JUMP and grab the right ones (GOT IT!); stay down and the wrong ones float over your head. Jump into a
// wrong one and it bursts in your face (POOF!), ✕. Grab 4 to win; 3 poofs lose. A missed lantern just floats by.
// Gaps in the rooftops come by between lanterns now and then (the teacher: a fun extra challenge, no answer): tap to
// jump them; fall in and you scramble back out, which only costs time.
(function () {
  const TEXT = {
    name: { en: "Ninja Rooftops" },
    icon: "🏮",
    howTo: { en: {
      steps: [
        ["👀", "Look at the card."],
        ["🏮", "Lanterns float toward you, up high. One matches the card? TAP to jump and grab it!"],
        ["🙅", "A wrong one? Stay down and let it float over you."],
        ["🕳️", "A gap in the roofs? TAP to jump it!"],
      ],
      tips: ["Fall in a gap and you have to climb out: it costs time.","Grab 4 lanterns to win. Jump into 3 wrong ones and it's over.", "Missed one? More are coming.", "Tap the card to hear it again."],
    } },
    instruction: { en: "JUMP AND\nGRAB!" },
    cardLabel: "The card. Tap to hear it again.",
    got: ["GOT IT!", "HI-YAH!", "NINJA!", "SWISH!"],
    poof: "POOF!",
    whoa: "WHOAAA!",
    leap: "NINJA LEAP!",
  };
  const GOAL = 4, MISSES = 3;

  const CSS = `
  .nin { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:6px; padding-bottom:6px; }
  .nin-top { flex:none; display:flex; align-items:center; gap:10px; }
  .nin-card { padding:4px 16px; background:#fff; border:5px solid #111; border-radius:16px; box-shadow:0 5px 0 #111; font:inherit; color:#111; font-size:clamp(1.8rem, 8vw, 2.8rem);
    line-height:1.05; cursor:pointer; touch-action:manipulation; display:flex; align-items:center; gap:6px; white-space:nowrap; }
  .nin-card .spk { font-size:.45em; }
  .nin-pips { display:flex; flex-direction:column; gap:4px; }
  .nin-row { display:flex; gap:4px; }
  .nin-pip { width:22px; height:22px; border:3px solid #111; border-radius:50%; background:#fff; display:flex; align-items:center; justify-content:center; font-size:12px; line-height:1; }
  .nin-pip.on { background:#ffd400; } .nin-pip.on::after { content:"🏮"; }
  .nin-pip.x.on { background:#ff5a6e; } .nin-pip.x.on::after { content:"✕"; color:#fff; font-weight:900; }
  .nin-night { position:relative; flex:1; min-height:0; width:100%; max-width:640px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111;
    background:radial-gradient(circle at 80% 18%, #fff6c9 0 5%, transparent 5.5%), radial-gradient(circle, #fff 0 1px, transparent 2px) 0 0 / 60px 50px, linear-gradient(180deg, #1b1446, #47307a);
    touch-action:manipulation; cursor:pointer; }
  .nin-far { position:absolute; left:0; right:0; bottom:calc(100% - var(--gy)); height:30%; opacity:.55;
    background:linear-gradient(0deg, #1b1446 0 100%) 0 100% / 120px 70% repeat-x, linear-gradient(0deg, #2a1f5e 0 100%) 60px 100% / 120px 100% repeat-x; }
  /* The rooftop you run on: red tiles */
  .nin-roof { position:absolute; left:0; right:0; top:var(--gy); bottom:0; border-top:5px solid #111;
    background:repeating-linear-gradient(90deg, #c0392b 0 30px, #a52a1f 30px 34px), #c0392b; background-size:34px 100%; }
  .nin-roof::before { content:""; position:absolute; left:0; right:0; top:0; height:14px; background:#7a1f16; border-bottom:3px solid #111; }
  /* A gap between the rooftops (--gw): a dark alley with nothing in it, just jump it (the teacher: a fun extra challenge) */
  .nin-gap { position:absolute; left:0; top:calc(var(--gy) - 2px); bottom:0; width:var(--gw); z-index:2; background:linear-gradient(180deg, #0d0a24, #000);
    border-left:5px solid #111; border-right:5px solid #111; box-sizing:border-box; pointer-events:none; }
  .nin-gap::before, .nin-gap::after { content:""; position:absolute; top:0; width:6px; height:100%; background:#7a1f16; }
  .nin-gap::before { left:-5px; } .nin-gap::after { right:-5px; }
  /* You (--nmz), with a red ninja headband */
  .nin-me { position:absolute; left:0; top:0; width:var(--nmz); height:var(--nmz); z-index:4; pointer-events:none; }
  .nin-band { position:absolute; left:4%; right:4%; top:8%; height:12%; background:#e8173c; border:3px solid #111; z-index:6; border-radius:4px; }
  .nin-band::after { content:""; position:absolute; left:-32%; top:-10%; width:34%; height:110%; background:#e8173c; border:3px solid #111; clip-path:polygon(100% 20%, 0 0, 40% 50%, 0 100%, 100% 80%);
    transform-origin:100% 50%; animation:nin-flap .25s ease-in-out infinite alternate; }
  .nin-me.poof .ms { filter:grayscale(.6) brightness(.8); }
  /* A paper lantern (--iz) with its sign */
  .nin-lan { position:absolute; left:0; top:0; width:var(--iz); height:calc(var(--iz) * 1.1); z-index:3; pointer-events:none; animation:nin-sway 1.2s ease-in-out infinite alternate; }
  .nin-lan > * { position:absolute; }
  .nin-paper { left:6%; right:6%; top:10%; bottom:10%; background:radial-gradient(circle at 50% 40%, #ffe08a 0 30%, #ff6a3d 70%); border:4px solid #111; border-radius:40%;
    background-image:repeating-linear-gradient(0deg, transparent 0 14%, rgba(0,0,0,.18) 14% 17%), radial-gradient(circle at 50% 40%, #ffe08a 0 30%, #ff6a3d 70%); box-shadow:0 0 22px 6px rgba(255,160,60,.55); }
  .nin-cap { left:28%; right:28%; height:12%; background:#ffd400; border:3px solid #111; border-radius:3px; } .nin-cap.t { top:2%; } .nin-cap.b { bottom:2%; }
  .nin-sign { left:50%; top:50%; transform:translate(-50%, -50%); padding:1px 6px; background:#fff; border:3px solid #111; border-radius:9px; font-weight:900; color:#111; line-height:1.1; white-space:nowrap; z-index:2; }
  .nin-lan.right .nin-sign { box-shadow:0 0 0 4px #fff, 0 0 0 8px #00b86b; }
  .nin-lan.gone { opacity:0; transform-origin:50% 50%; transition:opacity .25s; }
  .nin-fx { position:absolute; inset:0; pointer-events:none; z-index:8; overflow:visible; }
  .nin-puff { position:absolute; width:20px; height:20px; border-radius:50%; background:rgba(255,255,255,.9); pointer-events:none; }
  .nin-word { position:absolute; transform:translate(-50%, -50%) rotate(-8deg); font-size:1.9rem; color:#ffd400; -webkit-text-stroke:2px #111; paint-order:stroke fill;
    text-shadow:0 4px 0 #111; white-space:nowrap; animation:nin-word 1s ease-out forwards; }
  .nin-word.bad { color:#fff; }
  @keyframes nin-flap { from { transform:rotate(-14deg); } to { transform:rotate(14deg); } }
  @keyframes nin-sway { from { translate:0 -4px; } to { translate:0 4px; } }   /* (no rotate: the lantern is placed with a transform, so a rotation would pivot far away) */
  @keyframes nin-word { from { opacity:1; scale:.5; } 25% { scale:1.15; } 75% { opacity:1; } to { opacity:0; translate:0 -40px; } }
  @media (prefers-reduced-motion: reduce) { .nin-band::after, .nin-lan, .nin-word { animation:none !important; } }
  `;
  function injectCss() { if (document.getElementById("nin-css")) return; const s = document.createElement("style"); s.id = "nin-css"; s.textContent = CSS; document.head.appendChild(s); }

  registerMicrogame({
    id: "ninja-rooftops",
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
      let rowI = 0;
      const stream = [];
      function refill() {
        const row = C.rows[rowI++ % C.rows.length];
        stream.push(...ctx.shuffle([row.find((o) => o.right), ctx.pick(row.filter((o) => !o.right))]));
      }

      const wrap = document.createElement("div");
      wrap.className = "nin";
      const top = document.createElement("div");
      top.className = "nin-top";
      const card = document.createElement("button");
      card.className = "nin-card";
      card.setAttribute("aria-label", TEXT.cardLabel);
      card.innerHTML = '<span class="ct"></span>';
      card.firstChild.textContent = C.listen ? C.target.text : C.cardText;
      if (ctx.canSpeak) card.insertAdjacentHTML("beforeend", '<span class="spk">🔊</span>');
      card.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); ctx.say(C.prompt); });
      const pips = document.createElement("div");
      pips.className = "nin-pips";
      pips.innerHTML = `<div class="nin-row hits">${'<span class="nin-pip"></span>'.repeat(GOAL)}</div><div class="nin-row">${'<span class="nin-pip x"></span>'.repeat(MISSES)}</div>`;
      top.append(card, pips);
      const night = document.createElement("div");
      night.className = "nin-night";
      night.innerHTML = '<div class="nin-far"></div><div class="nin-roof"></div>';
      const me = document.createElement("div");
      me.className = "nin-me";
      const fig = window.Mascot ? window.Mascot.el("var(--nmz)") : document.createElement("div");
      const band = document.createElement("div");
      band.className = "nin-band";
      (fig.querySelector(".ms-in") || fig).appendChild(band);   // (inside the character, so it runs and hops with it)
      me.append(fig);
      const fx = document.createElement("div");
      fx.className = "nin-fx";
      night.append(me, fx);
      wrap.append(top, night);
      ctx.root.appendChild(wrap);
      const hitPips = pips.querySelector(".hits").children, missPips = pips.children[1].children;
      const roof = night.querySelector(".nin-roof"), far = night.querySelector(".nin-far");

      let W = 0, H = 0, mz = 70, iz = 70, gy = 0, mx = 0;
      function layout() {
        W = night.clientWidth; H = night.clientHeight;
        mz = Math.max(50, Math.min(H * 0.2, W * 0.14, 100));
        iz = Math.max(50, Math.min(H * 0.17, W * 0.14, 88));
        gy = H * 0.8; mx = W * 0.22;
        night.style.setProperty("--nmz", `${mz}px`); night.style.setProperty("--iz", `${iz}px`); night.style.setProperty("--gy", `${gy}px`);
      }
      const jumpMs = 800 / Math.sqrt(pace), jumpH = () => H * 0.34;
      const lanY = () => gy - mz - jumpH() * 0.75 - iz * 0.2;   // (the lanterns float at the top of a jump)

      let air = 0, jumpT = -1;
      function jump() {
        if (done || ctx.ended || jumpT >= 0 || fallT > 0) return;
        jumpT = 0;
        sweep(400, 1000, 0.2, "triangle", 0.07);   // hup!
      }
      night.addEventListener("pointerdown", (e) => { e.preventDefault(); jump(); });
      function onKey(e) { if (e.key === " " || e.key === "ArrowUp") { e.preventDefault(); jump(); } }
      document.addEventListener("keydown", onKey);

      const things = [];
      const cross = 2.8 / pace, gap = 1.55 / pace;
      function spawn() {
        if (!stream.length) refill();
        const o = stream.shift();
        const el = document.createElement("div");
        el.className = "nin-lan";   // (all lanterns look alike: only the sign tells them apart)
        el.innerHTML = '<div class="nin-cap t"></div><div class="nin-paper"></div><div class="nin-cap b"></div><span class="nin-sign"></span>';
        const sg = el.querySelector(".nin-sign");
        sg.textContent = o.text;
        sg.style.fontSize = `${o.kind === "word" ? Math.min(iz * 0.36, (iz * 1.2) / ([...o.text].length * 0.62)) : iz * 0.4}px`;
        night.insertBefore(el, me);
        things.push({ o, el, x: W + iz, judged: false });
        // Now and then a gap in the rooftops comes half-way between this lantern and the next (never with a lantern).
        spawned++;
        if (spawned >= 2 && !gapAt && Math.random() < 0.45) gapAt = performance.now() + gap * 500;
      }

      // ---------- Gaps in the rooftops ----------
      const gaps = [];
      let spawned = 0, gapAt = 0, gw = 60, fallT = 0;
      function spawnGap() {
        const el = document.createElement("div");
        el.className = "nin-gap";
        night.insertBefore(el, things.length ? things[0].el : me);
        gaps.push({ el, x: W + gw, fell: false });
      }
      function fall(g) {
        g.fell = true;
        fallT = 1.1;
        sweep(900, 150, 0.6, "triangle", 0.08);   // whee-ooo
        word(TEXT.whoa, true, mx + mz, gy - mz * 1.6);
        if (window.Mascot) window.Mascot.mood(fig, "sad");
      }

      let hits = 0, missN = 0, done = false, started = false, last = null, nextAt = 0, scroll = 0;
      function frame(ts) {
        const dt = last == null ? 0 : Math.min(50, ts - last) / 1000;
        last = ts;
        const now = performance.now();
        const v = (W + iz - mx) / cross;
        gw = Math.max(40, Math.min(v * 0.32, mz * 1.1));
        night.style.setProperty("--gw", `${gw}px`);
        // Fallen into a gap: everything waits while you scramble out (it only costs time).
        const moving = started && !done && fallT <= 0;
        if (fallT > 0) {
          fallT -= dt;
          if (fallT <= 0) { if (window.Mascot) window.Mascot.mood(fig, null); jumpT = 0; sweep(300, 900, 0.2, "triangle", 0.07); }   // …and hop back up and out
          else nextAt += dt * 1000;
        }
        if (moving) {
          if (now >= nextAt) { spawn(); nextAt = now + gap * 1000; }
          if (gapAt && now >= gapAt) { gapAt = 0; spawnGap(); }
          scroll += v * dt;
        } else if (gapAt) gapAt += dt * 1000;
        roof.style.backgroundPositionX = `${-scroll}px`;
        far.style.backgroundPositionX = `${-scroll * 0.3}px, ${60 - scroll * 0.3}px`;
        if (jumpT >= 0) { jumpT += dt * 1000; air = Math.sin(Math.min(1, jumpT / jumpMs) * Math.PI) * jumpH(); if (jumpT >= jumpMs) { jumpT = -1; air = 0; } }
        const run = jumpT < 0 && moving ? Math.abs(Math.sin(now / 90)) * mz * 0.06 : 0;   // a little running bounce
        const drop = fallT > 0 ? Math.min(1, (1.1 - fallT) / 0.3) * mz * 0.9 : 0;   // down into the gap
        me.style.transform = `translate(${mx - mz / 2}px, ${gy - mz - air - run + drop}px) rotate(${air > 0 ? -10 : 0}deg)`;
        for (let i = gaps.length - 1; i >= 0; i--) {
          const g = gaps[i];
          if (moving) g.x -= v * dt;
          g.el.style.transform = `translateX(${g.x - gw / 2}px)`;
          if (!g.fell && jumpT < 0 && fallT <= 0 && moving && Math.abs(g.x - mx) < gw / 2 - mz * 0.1) fall(g);
          if (!g.fell && g.x < mx - gw && !g.jumped) { g.jumped = true; word(TEXT.leap, false, mx + mz * 0.6, gy - mz * 1.8); }
          if (g.x < -gw * 2) { g.el.remove(); gaps.splice(i, 1); }
        }
        for (let i = things.length - 1; i >= 0; i--) {
          const t = things[i];
          if (moving) t.x -= v * dt;
          t.el.style.transform = `translate(${t.x - iz / 2}px, ${lanY()}px)`;
          if (!t.judged && t.x <= mx + iz * 0.15) judge(t);
          if (t.x < -iz * 2) { t.el.remove(); things.splice(i, 1); }
        }
        if (!ctx.ended || things.length) ctx.raf(frame);
      }
      // A lantern reaches you: up in the air you grab it (right) or it bursts in your face (wrong); on the roof it floats over.
      function judge(t) {
        t.judged = true;
        if (done || ctx.ended) return;
        const high = air > jumpH() * 0.45;
        if (!high) return;
        t.el.classList.add("gone");
        if (t.o.right) grab(t); else poof(t);
      }
      function grab(t) {
        [784, 1047].forEach((f, k) => tone(f, 0.08, "triangle", 0.1, k * 0.07)); noise(0.05, "highpass", 3000, 4000, 0.2);   // swish
        word(TEXT.got[hits % TEXT.got.length], false, mx + mz, lanY() - 10);
        if (t.o.kind === "pic") ctx.say(t.o.spoken);
        hitPips[hits].classList.add("on");
        hits++;
        if (hits >= GOAL) { done = true; ctx.win(); ctx.confetti(fx, mx, lanY(), { count: 90 }); ctx.say(C.answer); }
      }
      function poof(t) {
        me.classList.add("poof");
        noise(0.25, "lowpass", 1200, 300, 0.35);
        word(TEXT.poof, true, mx + mz, lanY() - 10);
        if (!reduceMotion) for (let k = 0; k < 6; k++) {
          const p = document.createElement("div");
          p.className = "nin-puff";
          p.style.left = `${mx}px`; p.style.top = `${lanY() + iz * 0.4}px`;
          fx.appendChild(p);
          const a = k * 1.05;
          p.animate([{ transform: "scale(.5)", opacity: 1 }, { transform: `translate(${Math.cos(a) * 50}px, ${Math.sin(a) * 40}px) scale(2)`, opacity: 0 }], { duration: 600, fill: "forwards" });
          ctx.later(() => p.remove(), 620);
        }
        ctx.later(() => me.classList.remove("poof"), 700);
        if (t.o.kind === "pic") ctx.say(t.o.spoken);
        missPips[missN].classList.add("on");
        missN++;
        if (missN >= MISSES) { done = true; ctx.lose(); if (window.Mascot) window.Mascot.mood(fig, "sad"); ctx.later(() => ctx.say(C.answer), 400); }
      }
      function word(text, bad, x, y) {
        const w = document.createElement("div");
        w.className = "nin-word" + (bad ? " bad" : "");
        w.textContent = text;
        w.style.left = `${Math.max(80, Math.min(W - 80, x))}px`; w.style.top = `${Math.max(26, y)}px`;
        fx.appendChild(w);
        ctx.later(() => w.remove(), 1000);
      }

      ctx.onTimeout(() => { done = true; if (window.Mascot) window.Mascot.mood(fig, "sad"); things.forEach((t) => { if (t.o.right && !t.judged) t.el.classList.add("right"); }); ctx.say(C.answer); });

      layout();
      const ro = new ResizeObserver(layout);
      ro.observe(night);
      ctx.say(C.prompt);
      const rev = ctx.reveal(card);
      ctx.later(() => { started = true; nextAt = performance.now(); }, (rev || 0) + 200);
      ctx.raf(frame);

      // Tutorial: jump up to grab each right lantern as it arrives.
      ctx.tutorial(C.target, async (f) => {
        await f.point(card, 800);
        while (!done) {
          const lead = () => ((W + iz - mx) / (2.8 / pace)) * (jumpMs / 2000);   // (how far a gap travels in half a jump)
          const ok = await f.until(() => jumpT < 0 && (things.some((t) => !t.judged && t.o.right && t.x - mx < iz * 1.3 && t.x - mx > iz * 0.6) ||
            gaps.some((g) => !g.fell && g.x - mx > 0 && g.x - mx < lead())), 9000);
          if (!ok || done) break;
          await f.tapNow(night);
          await f.until(() => jumpT < 0, 2000);
        }
      });
      return () => { done = true; ro.disconnect(); document.removeEventListener("keydown", onKey); };
    },
  });
})();
