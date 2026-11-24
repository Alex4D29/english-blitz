// LAKE LEAP — the teacher's design: cross a lake from left to right on stepping stones, two at a time. Your
// monster (the mascot) stands on the near bank; out in the lake, pairs of stones (one high, one low), each
// with an option. Jump onto the right one: it holds, and the view pans right as more stones come into view.
// The wrong one sinks: SPLASH, you're in the lake. 7 right jumps and you reach the far bank, where your friends
// are having a party (balloons, cake, cheering). Longer than most games: 16 s.
// One target all round (the card at the top); phonics: a different picture of the letter on each stone.
(function () {
  const TEXT = {
    name: { en: "Lake Leap" },
    icon: "🪨",
    howTo: (list) => ({ en: {
      steps: [
        list.type === "hfw" ? ["👂", "Listen to the word, like \"the\"."] : ["👀", "Look at the card at the top."],
        ["🪨", "Two stones at a time: tap the stone with the same one to jump onto it!"],
        ["🎉", "7 jumps get you across the lake to the party!"],
      ],
      tips: [
        "A wrong stone sinks, and SPLASH! Into the lake you go.",
        "Tap the card to hear it again.",
        "When the game speeds up, the stones bob up and down.",
      ],
    } }),
    instruction: { en: "CROSS THE\nLAKE!" },
    cardLabel: "Hear it again",
    stoneLabel: (t) => `Jump to ${t}`,
    splash: "SPLASH!",
    party: "PARTY!",
  };
  const JUMPS = 7;

  const CSS = `
  .ll { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:8px; padding-bottom:8px; }
  .ll-top { flex:none; display:flex; align-items:center; gap:12px; }
  .ll-card { min-width:84px; height:72px; padding:0 18px; border-radius:18px; font:inherit; font-size:2.6rem; line-height:1; background:#fff; color:#111;
    border:5px solid #111; box-shadow:0 6px 0 #111; display:flex; align-items:center; justify-content:center; gap:8px; cursor:pointer; touch-action:manipulation; }
  .ll-card .spk { font-size:1.3rem; opacity:.6; }
  .ll-pips { display:flex; gap:3px; flex-wrap:wrap; max-width:130px; }
  .ll-pip { width:16px; height:16px; border:3px solid #111; border-radius:50%; background:#fff; }
  .ll-pip.on { background:#4dd36b; }
  .ll-lake { position:relative; flex:1; min-height:0; width:100%; max-width:560px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111;
    background:repeating-linear-gradient(170deg, transparent 0 30px, rgba(255,255,255,.12) 30px 33px, transparent 33px 70px), linear-gradient(180deg, #4fc3f7, #1e88e5); }
  .ll-world { position:absolute; left:0; top:0; height:100%; transition:transform .5s cubic-bezier(.3,.8,.4,1); will-change:transform; }
  .ll-bank { position:absolute; top:0; bottom:0; background:#6cc04a; border:5px solid #111; z-index:1;
    background-image:radial-gradient(circle, #8fd66a 3px, transparent 4px); background-size:22px 22px; }
  .ll-bank.near { border-left:0; border-radius:0 40% 40% 0 / 0 12% 12% 0; }
  .ll-bank.far { border-right:0; border-radius:40% 0 0 40% / 12% 0 0 12%; }
  .ll-party { position:absolute; z-index:2; display:flex; align-items:flex-end; gap:4px; pointer-events:none; }
  .ll-balloon { position:absolute; font-size:calc(var(--ss) * .5); line-height:1; animation:ll-float 1.4s ease-in-out infinite alternate; }
  /* A stepping stone: --ss is its size */
  .ll-stone { position:absolute; left:0; top:0; width:var(--ss); height:calc(var(--ss) * .72); margin:calc(var(--ss) * -.36) 0 0 calc(var(--ss) * -.5); z-index:3; padding:0; font:inherit; cursor:pointer;
    touch-action:manipulation; border:5px solid #111; border-radius:46% 52% 44% 50% / 52% 48% 52% 48%; color:#111;
    background:radial-gradient(circle at 35% 30%, #c9c9c9, #8f8f8f 70%); box-shadow:inset 0 -8px 0 rgba(0,0,0,.18), 0 6px 0 rgba(0,40,90,.35);
    display:flex; align-items:center; justify-content:center; }
  .ll-stone::after { content:""; position:absolute; left:-8%; right:-8%; bottom:-14%; height:22%; border-radius:50%; border:3px solid rgba(255,255,255,.6); z-index:-1; }   /* a ripple round it */
  .ll-sign { min-width:56%; padding:1px 6px; background:#fff; border:3px solid #111; border-radius:10px; font-size:calc(var(--ss) * .32); line-height:1.1; white-space:nowrap; }
  .ll-sign.pic { font-size:calc(var(--ss) * .3); }
  .ll-stone.live { box-shadow:0 0 0 5px rgba(255,255,255,.85), inset 0 -8px 0 rgba(0,0,0,.18); animation:ll-live .8s ease-in-out infinite alternate; }
  .ll-stone.bob { animation:ll-bob 1.6s ease-in-out infinite alternate; }
  .ll-stone.sink { transition:transform .5s ease-in, opacity .5s; opacity:0; }
  .ll-stone.right { box-shadow:0 0 0 5px #fff, 0 0 0 10px #00b86b; }
  .ll-stone.dim { opacity:.5; }
  .ll-me { position:absolute; left:0; top:0; z-index:5; pointer-events:none; will-change:transform; }
  .ll-me .ms { margin:calc(var(--mz) * -1) 0 0 calc(var(--mz) * -.5); }
  .ll-splash { position:absolute; width:24px; height:24px; margin:-12px 0 0 -12px; border:4px solid #fff; border-radius:50%; z-index:6; animation:ll-ring .7s ease-out forwards; pointer-events:none; }
  .ll-fx { position:absolute; inset:0; pointer-events:none; z-index:8; overflow:visible; }
  .ll-word { position:absolute; left:50%; top:20%; transform:translate(-50%, -50%) rotate(-8deg); font-size:2.4rem; color:#ffd400; -webkit-text-stroke:2px #111; paint-order:stroke fill;
    text-shadow:0 4px 0 #111; white-space:nowrap; pointer-events:none; animation:ll-word 1.6s ease-out forwards; }
  .ll-word.bad { color:#fff; }
  @keyframes ll-float { to { transform:translateY(-12%) rotate(6deg); } }
  @keyframes ll-live { from { box-shadow:0 0 0 3px rgba(255,255,255,.5), inset 0 -8px 0 rgba(0,0,0,.18); } to { box-shadow:0 0 0 8px rgba(255,255,255,.95), inset 0 -8px 0 rgba(0,0,0,.18); } }
  @keyframes ll-bob { from { translate:0 -6px; } to { translate:0 6px; } }
  @keyframes ll-ring { from { transform:scale(.4); opacity:1; } to { transform:scale(5); opacity:0; } }
  @keyframes ll-word { from { opacity:1; transform:translate(-50%, -50%) rotate(-8deg) scale(.5); } 20% { transform:translate(-50%, -60%) rotate(-8deg) scale(1.15); }
    80% { opacity:1; } to { opacity:0; transform:translate(-50%, -90%) rotate(-8deg); } }
  @media (prefers-reduced-motion: reduce) { .ll-world { transition:none; } .ll-balloon, .ll-stone.live, .ll-stone.bob, .ll-word { animation:none !important; } }
  `;
  function injectCss() {
    if (document.getElementById("ll-css")) return;
    const s = document.createElement("style"); s.id = "ll-css"; s.textContent = CSS; document.head.appendChild(s);
  }

  registerMicrogame({
    id: "lake-leap",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 16000,   // 7 jumps: longer than usual (the teacher's design)
    input: "tap",
    tutorial: true,

    start(ctx) {
      injectCss();
      const speed = ctx.speed || 1;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const { tone, sweep, noise } = ctx.sfx;
      const C = ctx.choiceRows(JUMPS, 2, { lowercase: true });
      const bob = speed >= 1.5 && !reduceMotion;

      const wrap = document.createElement("div");
      wrap.className = "ll";
      const top = document.createElement("div");
      top.className = "ll-top";
      const card = document.createElement("button");
      card.className = "ll-card";
      card.setAttribute("aria-label", TEXT.cardLabel);
      card.innerHTML = '<span class="ct"></span>';
      card.firstChild.textContent = C.cardText;
      if (ctx.canSpeak && !C.listen) card.insertAdjacentHTML("beforeend", '<span class="spk">🔊</span>');
      card.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });
      const pips = document.createElement("div");
      pips.className = "ll-pips";
      pips.innerHTML = '<span class="ll-pip"></span>'.repeat(JUMPS);
      top.append(card, pips);
      const lake = document.createElement("div");
      lake.className = "ll-lake";
      const world = document.createElement("div");
      world.className = "ll-world";
      const fx = document.createElement("div");
      fx.className = "ll-fx";
      lake.append(world, fx);
      wrap.append(top, lake);
      ctx.root.appendChild(wrap);

      const nearBank = document.createElement("div"); nearBank.className = "ll-bank near";
      const farBank = document.createElement("div"); farBank.className = "ll-bank far";
      const party = document.createElement("div"); party.className = "ll-party";
      const friends = [0, 1].map(() => { const m = window.Mascot.el("var(--fz)"); party.appendChild(m); return m; });
      party.insertAdjacentHTML("beforeend", '<div class="ll-balloon" style="left:-10%;top:-60%">🎈</div><div class="ll-balloon" style="right:-8%;top:-70%;animation-delay:-.6s">🎈</div>' +
        '<div class="ll-balloon" style="left:40%;top:-95%;animation-delay:-.3s">🎉</div>');
      world.append(nearBank, farBank, party);
      // The stones: one column per jump, an upper and a lower stone.
      const cols = C.rows.map((row, c) => row.map((item, k) => {
        const b = document.createElement("button");
        b.className = "ll-stone" + (bob ? " bob" : "");
        b.style.animationDelay = `${-Math.random() * 1.6}s`;
        b.innerHTML = '<span class="ll-sign"></span>';
        const s = b.firstChild;
        s.textContent = item.text;
        if (item.kind === "pic") s.classList.add("pic");
        b.setAttribute("aria-label", TEXT.stoneLabel(item.spoken));
        b.addEventListener("pointerdown", (e) => { e.preventDefault(); jump(c, k); });
        b.addEventListener("click", (e) => { if (e.detail === 0) jump(c, k); });
        world.appendChild(b);
        return { el: b, sign: s, item, c, k, x: 0, y: 0 };
      }));
      const meBox = document.createElement("div");
      meBox.className = "ll-me";
      const me = window.Mascot.el("var(--llz)");
      meBox.appendChild(me);
      world.appendChild(meBox);

      // ---------- Layout: the world is a long strip; the camera pans along it ----------
      let W = 0, H = 0, colW = 120, ss = 80, step = 0, done = false, busy = false, pos = { x: 0, y: 0 };
      const colX = (c) => colW * (c + 1.25);
      const bankY = () => H * 0.56;
      function layout() {
        W = lake.clientWidth; H = lake.clientHeight;
        colW = Math.max(96, Math.min(W * 0.25, 145));     // (closer together than at first: the teacher asked)
        ss = Math.max(76, Math.min(colW * 0.86, H * 0.3, 135)); // (and bigger)
        lake.style.setProperty("--ss", `${ss}px`);
        lake.style.setProperty("--llz", `${Math.min(ss * 0.95, H * 0.3)}px`);
        lake.style.setProperty("--fz", `${Math.min(ss * 0.8, H * 0.24)}px`);
        const farX = colX(JUMPS) + colW * 0.1;
        world.style.width = `${farX + W}px`;
        nearBank.style.cssText = `left:-20px;width:${colW * 0.62 + 20}px;`;
        farBank.style.cssText = `left:${farX}px;width:${W}px;`;
        party.style.cssText = `left:${farX + colW * 0.6}px;top:${bankY() - ss * 0.2}px;`;
        cols.forEach((col) => col.forEach((s) => {
          s.x = colX(s.c); s.y = s.k === 0 ? H * 0.37 : H * 0.71;
          s.el.style.transform = `translate(${s.x}px, ${s.y}px)`;
          if (s.item.kind === "word") s.sign.style.fontSize = `${Math.min(ss * 0.3, (ss * 0.86) / (s.item.text.length * 0.6))}px`;
        }));
        if (!busy) place(spot(step - 1));
        pan(false);
      }
      // Where you stand after jump c (−1: the near bank; JUMPS: the far bank).
      function spot(c) {
        if (c < 0) return { x: colW * 0.35, y: bankY() };
        if (c >= JUMPS) return { x: colX(JUMPS) + colW * 0.42, y: bankY() };
        const s = cols[c].find((x) => x.item.right);
        return { x: s.x, y: s.y - ss * 0.12 };
      }
      function place(p) { pos = p; meBox.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px)`; }
      function pan(anim = true) {
        const cam = Math.min(0, -(pos.x - W * 0.26));
        world.style.transition = anim ? "" : "none";
        world.style.transform = `translateX(${cam.toFixed(1)}px)`;
      }
      function setLive() { cols.forEach((col, c) => col.forEach((s) => s.el.classList.toggle("live", !done && !busy && c === step))); }
      function hop(to, ms, then) {
        const from = { ...pos }, t0 = performance.now(), h = ss * 0.9;
        sweep(300, 700, 0.15, "square", 0.07); // boing
        (function go(now) {
          const k = Math.min(1, (now - t0) / (reduceMotion ? 1 : ms));
          place({ x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k - Math.sin(k * Math.PI) * h });
          if (k < 1) { ctx.raf(go); return; }
          then();
        })(t0);
      }

      // ---------- Jumping ----------
      function jump(c, k) {
        if (done || busy || ctx.ended || c !== step) return;
        busy = true;
        setLive();
        const s = cols[c][k];
        if (step === JUMPS - 1 || !s.item.right) ctx.freezeTimer(); // decided: stop the clock now
        hop({ x: s.x, y: s.y - ss * 0.12 }, 380, () => (s.item.right ? land(s) : sink(s)));
      }
      function land(s) {
        tone(520, 0.06, "square", 0.07); noise(0.05, "lowpass", 700, 300, 0.2); // tok
        s.el.animate([{ translate: "0 0" }, { translate: "0 6px" }, { translate: "0 0" }], { duration: 250 });
        if (s.item.kind === "pic") ctx.say(s.item.spoken);
        pips.children[step].classList.add("on");
        step++;
        pan();
        if (step >= JUMPS) { ctx.later(() => hop(spot(JUMPS), 420, partyTime), 250); return; }
        busy = false;
        setLive();
      }
      function partyTime() {
        done = true;
        ctx.win();
        pan();
        window.Mascot.mood(me, "cheer");
        friends.forEach((f) => window.Mascot.mood(f, "cheer"));
        word(TEXT.party, false);
        [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.12, "triangle", 0.1, i * 0.08));
        ctx.later(() => ctx.confetti(fx, W * 0.6, H * 0.3, { count: 120 }), 200);
        ctx.say(C.answer);
      }
      function sink(s) {
        done = true;
        ctx.lose();
        s.el.classList.add("sink");
        s.el.style.transform = `translate(${s.x}px, ${s.y + ss * 0.5}px)`;
        noise(0.45, "lowpass", 1800, 200, 0.7); sweep(500, 150, 0.4, "sine", 0.12, 0.05); // SPLASH
        const r = lake.getBoundingClientRect(), wr = world.getBoundingClientRect();
        [0, 0.15, 0.3].forEach((d) => {
          const sp = document.createElement("div");
          sp.className = "ll-splash";
          sp.style.left = `${s.x + (wr.left - r.left)}px`; sp.style.top = `${s.y}px`; sp.style.animationDelay = `${d}s`;
          fx.appendChild(sp);
        });
        window.Mascot.mood(me, "sad");
        place({ x: s.x, y: s.y + ss * 0.35 }); // up to its chin in the lake
        word(TEXT.splash, true);
        ctx.later(() => { showRight(s.c); ctx.say(C.answer); }, 450);
      }
      function showRight(c) { cols[c].forEach((s) => s.el.classList.add(s.item.right ? "right" : "dim")); }
      function word(text, bad) {
        const w = document.createElement("div");
        w.className = "ll-word" + (bad ? " bad" : "");
        w.textContent = text;
        fx.appendChild(w);
      }
      function replay() { if (!done) ctx.say(C.prompt); }

      ctx.onTimeout(() => { done = true; setLive(); window.Mascot.mood(me, "sad"); if (step < JUMPS) showRight(step); ctx.say(C.answer); });
      function onKey(e) {
        if (e.key === "1" || e.key === "ArrowUp") { e.preventDefault(); jump(step, 0); }
        else if (e.key === "2" || e.key === "ArrowDown") { e.preventDefault(); jump(step, 1); }
        else if (e.key === " ") { e.preventDefault(); replay(); }
      }
      document.addEventListener("keydown", onKey);

      layout();
      place(spot(-1));
      pan(false);
      setLive();
      const ro = new ResizeObserver(layout);
      ro.observe(lake);
      ctx.say(C.prompt);
      ctx.reveal(card);

      // Tutorial: point at the card, then hop onto the right stone, column by column.
      ctx.tutorial(C.target, async (f) => {
        await f.point(card, 800);
        for (let c = 0; c < JUMPS && !done; c++) {
          await f.until(() => !busy && step === c, 3000);
          await f.tap(cols[c].find((s) => s.item.right).el);
        }
        await f.until(() => done, 3000);
      });
      return () => { done = true; ro.disconnect(); document.removeEventListener("keydown", onKey); };
    },
  });
})();
