// TUG OF WAR — a rhythm game (the teacher's design for Gorilla Boss's finale, and a normal game too). A rope
// across a mud pit: your team (three of the mascot, js/mascot.js) on the left, a big bully monster on the
// right. The card at the top shows the target; the answer buttons are along the bottom. A right answer is a
// big HEAVE towards your side (then a beat: the clock stops, a new target); a wrong one and the bully yanks it
// back. Three heaves more than yanks and the bully is dragged face-first into the mud: SPLASH, muddy and
// crying, your team cheers. Pulled the other way (or out of time) and it's your team in the mud.
// Boss Battle: Gorilla Boss's finale: Gorilla Boss holds the other end (bossArt).
(function () {
  const TEXT = {
    name: { en: "Tug of War" },
    icon: "🪢",
    howTo: (list) => ({ en: {
      steps: [
        list.type === "hfw" ? ["👂", "Listen to the word, like \"the\". It's on the card too."] : ["👀", "Look at the card at the top."],
        ["👆", "Tap the button with the same one: your team gives the rope a big HEAVE!"],
        ["🔁", "Then the card changes. Pull 3 times to drag the big monster into the mud!"],
      ],
      tips: [
        "A wrong one and the monster pulls the rope back.",
        "Too slow, or pulled back too far, and YOUR team lands in the mud!",
        "Tap the card to hear it again.",
      ],
    } }),
    instruction: { en: "TUG OF\nWAR!" },
    cardLabel: "Hear it again",
    optLabel: (t) => `Pull for ${t}`,
    heave: ["HEAVE!", "PULL!", "HEAVE-HO!"],
    yank: "YANK!",
    splash: "SPLASH!",
    waah: "WAAAH!",
    haha: "HA HA!",
  };
  const GOAL = 3, BEAT_MS = 800;

  const CSS = `
  .tw { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:8px; padding-bottom:8px; }
  .tw-top { flex:none; display:flex; align-items:center; gap:12px; }
  .tw-card { min-width:84px; height:72px; padding:0 18px; border-radius:18px; font:inherit; font-size:2.6rem; line-height:1; background:#fff; color:#111;
    border:5px solid #111; box-shadow:0 6px 0 #111; display:flex; align-items:center; justify-content:center; gap:8px; cursor:pointer; touch-action:manipulation; }
  .tw-card .spk { font-size:1.3rem; opacity:.6; }
  .tw-card.next { animation:tw-next .45s cubic-bezier(.2,1.8,.4,1); }
  .tw-pips { display:flex; gap:5px; }
  .tw-pip { width:24px; height:24px; border:3px solid #111; border-radius:50%; background:#fff; display:flex; align-items:center; justify-content:center; font-size:13px; line-height:1; }
  .tw-pip.on { background:#ffd400; } .tw-pip.on::after { content:"💪"; }

  /* The field: sky, grass, and a mud pit in the middle */
  .tw-field { position:relative; flex:1; min-height:0; width:100%; max-width:560px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111;
    background:linear-gradient(180deg, #8fd3ff 0 55%, #6cc04a 55%); }
  .tw-mud { position:absolute; left:50%; top:var(--gy); width:var(--mw); height:calc(var(--mw) * .34); transform:translate(-50%, -40%); border-radius:50%; z-index:1;
    background:radial-gradient(ellipse at 40% 40%, #8a5a2b 0 30%, #6b4320 60%, #553417 100%); border:5px solid #111; }
  .tw-mud::after { content:""; position:absolute; left:22%; top:26%; width:18%; height:20%; border-radius:50%; background:rgba(255,255,255,.18); }   /* a shiny bit */
  .tw-line { position:absolute; top:calc(var(--gy) - 8px); width:6px; height:16px; background:#fff; border:2px solid #111; z-index:1; }
  /* Everyone on the rope moves together */
  .tw-group { position:absolute; inset:0; z-index:2; transition:transform .35s cubic-bezier(.3,1.4,.5,1); }
  .tw-rope { position:absolute; top:var(--ry); height:12px; margin-top:-6px; border:3px solid #111; border-radius:99px; z-index:1;
    background:repeating-linear-gradient(60deg, #d8a865 0 8px, #b98a4a 8px 14px); }
  .tw-flag { position:absolute; top:var(--ry); width:18px; height:30px; margin:-2px 0 0 -9px; background:#e8173c; border:3px solid #111; border-radius:0 0 4px 4px; z-index:2;
    clip-path:polygon(0 0, 100% 0, 100% 100%, 50% 75%, 0 100%); }
  .tw-mate { position:absolute; left:0; top:0; z-index:3; }
  .tw-mate .ms { margin:calc(var(--tz) * -1) 0 0 calc(var(--tz) * -.5); }
  .tw-foe { position:absolute; left:0; top:0; z-index:3; transform-origin:50% 100%; }
  .tw-foe > * { margin:calc(var(--oz) * -1) 0 0 calc(var(--oz) * -.5); }
  .tw-foe.lean > * { transform:rotate(10deg); transform-origin:50% 100%; transition:transform .2s; }
  .tw-foe.stagger > * { animation:tw-stagger .4s ease-out; }
  /* The bully (the normal game's opponent): a big purple monster with one horn, angry brows and a toothy grin */
  .tw-bully { position:relative; width:var(--oz); height:var(--oz); }
  .tw-bbody { position:absolute; left:12%; right:12%; top:18%; bottom:0; background:#8e44ad; border:5px solid #111; border-radius:46% 46% 32% 32%; }
  .tw-horn { position:absolute; left:42%; top:2%; width:16%; height:22%; background:#ffd400; border:4px solid #111; border-radius:50% 50% 10% 10%; clip-path:polygon(50% 0, 100% 100%, 0 100%); }
  .tw-beye { position:absolute; top:30%; width:24%; aspect-ratio:1; background:#fff; border:4px solid #111; border-radius:50%; z-index:2; }
  .tw-beye.l { left:24%; } .tw-beye.r { right:24%; width:20%; top:32%; }
  .tw-beye i { position:absolute; left:28%; top:30%; width:46%; aspect-ratio:1; background:#111; border-radius:50%; animation:tw-goggle 1.1s ease-in-out infinite; }
  .tw-bbrow { position:absolute; top:24%; width:28%; height:6%; background:#111; border-radius:9px; z-index:3; }
  .tw-bbrow.l { left:20%; transform:rotate(18deg); } .tw-bbrow.r { right:20%; transform:rotate(-18deg); }
  .tw-bmouth { position:absolute; left:28%; right:28%; top:58%; height:18%; background:#5a0f1e; border:4px solid #111; border-radius:6px 6px 99px 99px; overflow:hidden; z-index:2; }
  .tw-bmouth::before { content:""; position:absolute; left:0; right:0; top:0; height:34%; background:repeating-linear-gradient(90deg, #fff 0 20%, #ddd 20% 24%); }
  .tw-barm { position:absolute; left:-4%; top:48%; width:34%; height:12%; background:#8e44ad; border:4px solid #111; border-radius:99px; z-index:3; }
  .tw-btear { position:absolute; top:44%; width:6%; height:0; background:#5ec8ff; border-radius:0 0 99px 99px; z-index:4; display:none; }
  .tw-btear.l { left:30%; } .tw-btear.r { right:30%; }
  .tw-bully.cry .tw-btear { display:block; animation:tw-tear .5s linear infinite; } .tw-bully.cry .tw-btear.r { animation-delay:.25s; }
  .tw-bully.cry .tw-bmouth { left:38%; right:38%; border-radius:50%; } .tw-bully.cry .tw-bmouth::before { display:none; }
  .tw-bully.laugh { animation:tw-laugh .2s ease-in-out infinite alternate; }
  .tw-bmud { position:absolute; inset:0; z-index:5; display:none;
    background:radial-gradient(circle at 30% 30%, #6b4320 0 9%, transparent 10%), radial-gradient(circle at 66% 50%, #6b4320 0 12%, transparent 13%), radial-gradient(circle at 44% 78%, #6b4320 0 11%, transparent 12%); }
  .tw-bully.muddy .tw-bmud { display:block; }
  .tw-word { position:absolute; left:50%; top:22%; transform:translate(-50%, -50%) rotate(-8deg); font-size:2.2rem; color:#ffd400; -webkit-text-stroke:2px #111; paint-order:stroke fill;
    text-shadow:0 4px 0 #111; white-space:nowrap; pointer-events:none; z-index:9; animation:tw-word .9s ease-out forwards; }
  .tw-word.bad { color:#ff4d6d; } .tw-word.big { font-size:3rem; animation-duration:2s; }
  .tw-drop { position:absolute; width:16px; height:16px; margin:-8px 0 0 -8px; border-radius:50%; background:#6b4320; border:2px solid #111; z-index:8; pointer-events:none; }
  .tw-fx { position:absolute; inset:0; pointer-events:none; z-index:8; overflow:visible; }
  /* The answers */
  .tw-opts { flex:none; display:flex; gap:10px; justify-content:center; width:100%; padding:0 10px; }
  .tw-opt { flex:1; max-width:120px; height:var(--bh); padding:0 6px; border:5px solid #111; border-radius:16px; box-shadow:0 6px 0 #111; background:#fff; color:#111; font:inherit;
    font-size:calc(var(--bh) * .5); line-height:1; cursor:pointer; touch-action:manipulation; white-space:nowrap; overflow:hidden; animation:tw-in .3s cubic-bezier(.2,1.6,.4,1) both; }
  .tw-opt:active { transform:translateY(4px); box-shadow:0 2px 0 #111; }
  .tw-opt.bad { background:#ff5a6e; color:#fff; animation:tw-shake .3s linear; }
  .tw-opt.right { background:#b8ffcf; box-shadow:0 0 0 5px #fff, 0 0 0 10px #00b86b; }
  .tw-opt.dim { opacity:.4; }
  @keyframes tw-next { 0% { transform:scale(.4) rotate(-10deg); } 60% { transform:scale(1.25) rotate(4deg); } 100% { transform:none; } }
  @keyframes tw-goggle { 0%, 100% { transform:translate(-16%, 0); } 50% { transform:translate(16%, -12%); } }
  @keyframes tw-stagger { 30% { transform:rotate(-14deg) translateX(-8%); } 70% { transform:rotate(6deg); } }
  @keyframes tw-laugh { from { transform:translateY(0) rotate(-4deg); } to { transform:translateY(-6%) rotate(4deg); } }
  @keyframes tw-tear { 0% { height:0; opacity:1; } 80% { height:40%; opacity:1; } 100% { height:44%; opacity:0; } }
  @keyframes tw-in { from { scale:.5; opacity:0; } }
  @keyframes tw-shake { 25% { transform:translateX(-6px); } 75% { transform:translateX(6px); } }
  @keyframes tw-word { from { opacity:1; transform:translate(-50%, -50%) rotate(-8deg) scale(.5); } 25% { transform:translate(-50%, -60%) rotate(-8deg) scale(1.15); }
    75% { opacity:1; } to { opacity:0; transform:translate(-50%, -100%) rotate(-8deg); } }
  @media (prefers-reduced-motion: reduce) { .tw-group { transition:none; } .tw-card.next, .tw-opt, .tw-word, .tw-beye i, .tw-bully.laugh { animation:none !important; } }
  `;
  function injectCss() {
    if (document.getElementById("tw-css")) return;
    const s = document.createElement("style"); s.id = "tw-css"; s.textContent = CSS; document.head.appendChild(s);
  }

  registerMicrogame({
    id: "tug-of-war",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 12000,       // 3 heaves (the beats don't count)
    input: "tap",
    tutorial: true,
    bossArt: true,         // Boss Battle: Gorilla Boss's finale (he holds the other end)
    bossDuration: 16000,

    start(ctx) {
      injectCss();
      const speed = ctx.speed || 1;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const { tone, sweep, noise } = ctx.sfx;
      const N = speed >= 1.75 ? 4 : 3;
      const S = ctx.choiceSteps(GOAL + 3, N, { lowercase: true }); // (spare targets: wrong answers don't use one up)
      let si = 0, C = S[0];
      const bossId = window.Boss ? window.Boss.fighting(ctx) : null; // Gorilla Boss's finale

      // ---------- DOM ----------
      const wrap = document.createElement("div");
      wrap.className = "tw";
      const top = document.createElement("div");
      top.className = "tw-top";
      const card = document.createElement("button");
      card.className = "tw-card";
      card.setAttribute("aria-label", TEXT.cardLabel);
      card.innerHTML = '<span class="ct"></span>';
      // Always shown, sight words too (the 🔊 replays it).
      const cardText = () => (C.listen ? C.target.text : C.cardText);
      card.firstChild.textContent = cardText();
      if (ctx.canSpeak) card.insertAdjacentHTML("beforeend", '<span class="spk">🔊</span>');
      card.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });
      const pips = document.createElement("div");
      pips.className = "tw-pips";
      pips.innerHTML = '<span class="tw-pip"></span>'.repeat(GOAL);
      top.append(card, pips);
      const field = document.createElement("div");
      field.className = "tw-field";
      field.innerHTML = '<div class="tw-mud"></div><div class="tw-line l"></div><div class="tw-line r"></div><div class="tw-group"><div class="tw-rope"></div><div class="tw-flag"></div></div><div class="tw-fx"></div>';
      const group = field.querySelector(".tw-group"), rope = field.querySelector(".tw-rope"), flag = field.querySelector(".tw-flag"), fx = field.querySelector(".tw-fx");
      const opts = document.createElement("div");
      opts.className = "tw-opts";
      wrap.append(top, field, opts);
      ctx.root.appendChild(wrap);

      // Your team: three mascots, leaning back on the rope.
      const team = [0, 1, 2].map(() => {
        const m = document.createElement("div");
        m.className = "tw-mate";
        const me = window.Mascot.el("var(--tz)");
        window.Mascot.mood(me, "pull");
        m.appendChild(me);
        group.appendChild(m);
        return { box: m, me };
      });
      // The other end: Gorilla Boss, or the bully.
      const foe = document.createElement("div");
      foe.className = "tw-foe lean";
      let foeFig;
      if (bossId) foeFig = window.Boss.el(bossId, "var(--oz)");
      else {
        foeFig = document.createElement("div");
        foeFig.className = "tw-bully";
        foeFig.innerHTML = '<div class="tw-horn"></div><div class="tw-bbody"></div><div class="tw-bbrow l"></div><div class="tw-bbrow r"></div><div class="tw-beye l"><i></i></div><div class="tw-beye r"><i></i></div>' +
          '<div class="tw-bmouth"></div><div class="tw-barm"></div><div class="tw-btear l"></div><div class="tw-btear r"></div><div class="tw-bmud"></div>';
      }
      foe.appendChild(foeFig);
      group.appendChild(foe);
      const foeMood = (m) => {
        if (bossId) { window.Boss.setMood(foeFig, m); return; }
        foeFig.classList.remove("cry", "laugh");
        if (m) foeFig.classList.add(m);
      };

      // ---------- Layout ----------
      // The rope's position p runs from -1 (your team's front at the middle of the mud) to 1 (the foe there).
      let W = 0, H = 0, gy = 0, D = 100, tz = 60, oz = 120, p = 0, bh = 60;
      function layout() {
        W = field.clientWidth; H = field.clientHeight;
        gy = H * 0.8;
        oz = Math.max(90, Math.min(W * 0.32, H * 0.6, 220));
        tz = Math.max(50, Math.min(W * 0.17, H * 0.36, 110));
        const mw = Math.max(90, W * 0.26);
        D = mw * 0.5 + Math.max(oz, tz) * 0.35;               // from the middle of the mud to each side's front
        field.style.setProperty("--gy", `${gy}px`);
        field.style.setProperty("--mw", `${mw}px`);
        field.style.setProperty("--oz", `${oz}px`);
        field.style.setProperty("--tz", `${tz}px`);
        const ry = gy - Math.min(oz, tz * 1.6) * 0.5;
        field.style.setProperty("--ry", `${ry}px`);
        const fx0 = W / 2 + D + oz * 0.12, tx0 = W / 2 - D;   // the foe's middle, your front mate's middle
        foe.style.transform = `translate(${fx0}px, ${gy}px)`;
        team.forEach((t, i) => { t.box.style.transform = `translate(${tx0 - i * tz * 0.62}px, ${gy}px)`; });
        rope.style.left = `${tx0 - 2 * tz * 0.62 - tz * 0.3}px`;
        rope.style.width = `${fx0 - (tx0 - 2 * tz * 0.62 - tz * 0.3)}px`;
        flag.style.left = `${W / 2}px`;
        field.querySelector(".tw-line.l").style.left = `${W / 2 - D}px`;
        field.querySelector(".tw-line.r").style.left = `${W / 2 + D}px`;
        bh = Math.max(52, Math.min(70, (opts.clientWidth - 20) / N * 0.7));
        opts.style.setProperty("--bh", `${bh}px`);
        setP(p, false);
      }
      const SLIDE = 0.55;
      function setP(v, anim = true) {
        p = Math.max(-1, Math.min(1, v));
        group.style.transition = anim ? "" : "none";
        group.style.transform = `translateX(${(-p * D * SLIDE).toFixed(1)}px)`; // (only part of the way: the fall does the rest)
      }

      // ---------- The answers ----------
      let buttons = [];
      function deal() {
        opts.innerHTML = "";
        buttons = ctx.shuffle(C.row.slice()).map((o, i) => {
          const b = document.createElement("button");
          b.className = "tw-opt";
          b.textContent = o.text;
          b.style.animationDelay = `${i * 0.05}s`;
          b.setAttribute("aria-label", TEXT.optLabel(o.spoken));
          if (o.kind === "word") b.style.fontSize = `${Math.min(bh * 0.42, ((opts.clientWidth - 20) / N - 16) / (o.text.length * 0.6))}px`;
          b.addEventListener("pointerdown", (e) => { e.preventDefault(); pick(b, o); });
          opts.appendChild(b);
          return { b, o };
        });
      }

      let hits = 0, done = false, busy = false;
      function pick(btn, o) {
        if (done || busy || ctx.ended) return;
        busy = true;
        if (o.right) heave(o); else yank(btn);
      }
      function heave(o) {
        team.forEach((t, i) => { t.me.classList.add("heave"); ctx.later(() => t.me.classList.remove("heave"), 300 + i * 40); });
        foe.classList.remove("stagger"); void foe.offsetWidth; foe.classList.add("stagger");
        [0, 0.08].forEach((d) => noise(0.1, "lowpass", 900, 300, 0.4, d)); sweep(200, 420, 0.2, "square", 0.07); // HEAVE
        word(TEXT.heave[hits % 3], false);
        if (o.kind === "pic") ctx.say(o.spoken);
        foeMood(bossId ? "hurt" : null);
        pips.children[hits].classList.add("on");
        hits++;
        setP(p + 1 / GOAL + 0.01);
        if (p >= 0.99 || hits >= GOAL) { setP(1); done = true; ctx.win(); ctx.later(foeInMud, 380); return; }
        ctx.later(next, 520);
      }
      function yank(btn) {
        btn.classList.add("bad");
        sweep(500, 160, 0.3, "sawtooth", 0.09); noise(0.1, "lowpass", 700, 200, 0.4); // YANK
        word(TEXT.yank, true);
        foeMood("laugh");
        team.forEach((t) => { t.box.animate([{ translate: "0 0" }, { translate: "8px -6px" }, { translate: "0 0" }], { duration: 300 }); });
        setP(p - 1 / GOAL);
        if (p <= -0.99) { done = true; ctx.lose(); ctx.later(teamInMud, 380); return; }
        ctx.later(() => { foeMood(null); busy = false; }, 550);
      }
      // The beat: the clock stops, the card pops to the next target, the voice says it, new buttons.
      function next() {
        if (done) return;
        ctx.pauseTimer(BEAT_MS);
        C = S[++si];
        card.firstChild.textContent = cardText();
        card.classList.remove("next"); void card.offsetWidth; card.classList.add("next");
        tone(98, 0.08, "square", 0.1); tone(98, 0.08, "square", 0.1, 0.16);
        ctx.later(() => { if (!done) ctx.say(C.prompt); }, 150);
        foeMood(null);
        deal();
        ctx.later(() => { busy = false; }, 250);
      }
      // Into the mud, face first: SPLASH, muddy, crying; your team cheers.
      function foeInMud() {
        foe.classList.remove("lean", "stagger");
        foe.animate([{ transform: foe.style.transform }, { transform: `translate(${W / 2 + D * SLIDE}px, ${gy + oz * 0.1}px) rotate(-75deg)` }],
          { duration: reduceMotion ? 1 : 420, easing: "cubic-bezier(.5,0,.9,.5)", fill: "forwards" });
        ctx.later(() => {
          splash(W / 2, gy);
          foeFig.classList.add("muddy");
          foeMood(bossId ? "cry" : "cry");
          word(TEXT.splash, false, true);
          team.forEach((t) => window.Mascot.mood(t.me, "cheer"));
          [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, "triangle", 0.1, 0.2 + i * 0.08));
          ctx.confetti(fx, W * 0.3, H * 0.4, { count: 80 });
          ctx.say(C.answer);
        }, reduceMotion ? 10 : 420);
      }
      function teamInMud() {
        team.forEach((t) => t.box.animate([{ translate: "0 0" }, { translate: `${D * (1 - SLIDE)}px ${tz * 0.12}px` }], { duration: reduceMotion ? 1 : 380, easing: "ease-in", fill: "forwards" })); // dragged in
        team.forEach((t) => { window.Mascot.mood(t.me, "sad"); t.me.classList.add("muddy"); });
        splash(W / 2, gy);
        foeMood("laugh");
        word(TEXT.haha, true, true);
        ctx.later(showRight, 300);
        ctx.say(C.answer);
      }
      function splash(x, y) {
        noise(0.5, "lowpass", 1200, 150, 0.7); sweep(500, 120, 0.4, "sine", 0.12); // SPLOSH
        if (reduceMotion) return;
        for (let k = 0; k < 12; k++) {
          const d = document.createElement("div");
          d.className = "tw-drop";
          d.style.left = `${x}px`; d.style.top = `${y}px`;
          fx.appendChild(d);
          const a = Math.PI + (k / 11) * Math.PI, r = W * (0.12 + Math.random() * 0.18);
          d.animate([{ transform: "translate(0,0)" }, { transform: `translate(${Math.cos(a) * r}px, ${Math.sin(a) * r * 0.9}px)`, offset: 0.5 },
            { transform: `translate(${Math.cos(a) * r * 1.3}px, ${H * 0.1}px)`, opacity: 0 }], { duration: 800, easing: "ease-out", fill: "forwards" });
          ctx.later(() => d.remove(), 820);
        }
      }
      function showRight() { buttons.forEach((x) => x.b.classList.add(x.o.right ? "right" : "dim")); }
      function word(text, bad, big) {
        const w = document.createElement("div");
        w.className = "tw-word" + (bad ? " bad" : "") + (big ? " big" : "");
        w.textContent = text;
        fx.appendChild(w);
        ctx.later(() => w.remove(), big ? 2000 : 900);
      }
      function replay() { if (!done) ctx.say(C.prompt); }

      // Out of time: the foe gives one almighty yank, and your team goes in.
      ctx.onTimeout(() => { done = true; setP(-1); ctx.later(teamInMud, 380); });
      function onKey(e) {
        const i = parseInt(e.key, 10) - 1;
        if (i >= 0 && i < buttons.length) { e.preventDefault(); pick(buttons[i].b, buttons[i].o); }
        else if (e.key === " ") { e.preventDefault(); replay(); }
      }
      document.addEventListener("keydown", onKey);

      deal();
      layout();
      const ro = new ResizeObserver(layout);
      ro.observe(field);
      ctx.say(C.prompt);
      ctx.reveal(card);

      // Tutorial: point at the card, then tap the right button each time (the card changes).
      ctx.tutorial(S.slice(0, GOAL).map((s) => s.target), async (f) => {
        await f.point(card, 800);
        for (let n = 0; n < GOAL && !done; n++) {
          await f.until(() => !busy && hits === n, 3000);
          if (n) await f.point(card, 500);
          await f.tap(() => (buttons.find((x) => x.o.right) || buttons[0]).b);
          await f.until(() => hits > n || done, 2000);
        }
      });
      return () => { done = true; ro.disconnect(); document.removeEventListener("keydown", onKey); };
    },
  });
})();
