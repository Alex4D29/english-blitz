// SNOWMAN — build a snowman piece by piece. Each step offers a row of snowballs (the right size for
// that step: big base, middle, head; from 1.5× a hat too), each with a sign. Tap the right one and it
// rolls up onto the stack (each placed piece keeps its label). A wrong one lands on top, the whole
// stack wobbles and topples, and the pieces roll away. When the snowman is finished it comes alive:
// coal eyes, carrot nose, smile, waving stick arms, snowflakes. Content comes from ctx.choiceRows
// (ABC: half the rounds are capital → lowercase). 3 steps, 4 (with the hat) from 1.5×; 4 options from 2×.
(function () {
  const TEXT = {
    name: { en: "Snowman" },
    icon: "⛄",
    howTo: (list) => ({ en: {
      steps: [
        list.type === "hfw" ? ["👂", "Listen to the word, like \"the\"."] : ["👀", "Look at the card at the top."],
        ["⛄", "Tap the snowball with the same one. It rolls onto the snowman!"],
        ["🔁", "Then the card changes: find the new one. Big ball, middle ball, head… build it all the way up!"],
      ],
      tips: [
        "Tap the card to hear it again.",
        "A wrong snowball makes the snowman fall over! The right one glows.",
        "When the game speeds up, the snowman needs a hat too.",
      ],
    } }),
    instruction: { en: "BUILD THE\nSNOWMAN!" },
    cardLabel: "Hear it again",
    optLabel: (t) => `Add ${t}`,
  };

  const SIZES = [1, 0.78, 0.6]; // base, middle, head (times the base size); the hat is separate

  const CSS = `
  .sw { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:8px; padding-bottom:10px; }
  .sw-card { flex:none; min-width:84px; height:72px; padding:0 18px; border-radius:18px; font:inherit; font-size:2.6rem; line-height:1; background:#fff; color:#111;
    border:5px solid #111; box-shadow:0 6px 0 #111; display:flex; align-items:center; justify-content:center; gap:8px; cursor:pointer; touch-action:manipulation; }
  .sw-card .spk { font-size:1.3rem; opacity:.6; }
  .sw-card.next { animation:sw-next .45s cubic-bezier(.2,1.8,.4,1); }   /* a new target each step */
  @keyframes sw-next { 0% { transform:scale(.4) rotate(-10deg); } 60% { transform:scale(1.25) rotate(4deg); } 100% { transform:none; } }
  .sw-scene { position:relative; flex:1; min-height:0; width:100%; max-width:520px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111;
    background:linear-gradient(180deg, #9fd4ff, #dff1ff); }
  .sw-ground { position:absolute; left:-5%; right:-5%; bottom:-20px; height:80px; background:#fff; border-top:5px solid #111; border-radius:50% 50% 0 0; }
  .sw-flake { position:absolute; top:-20px; color:#fff; font-size:1rem; animation:sw-snow linear infinite; text-shadow:0 0 2px #7fb6e0; }
  .sw-stack { position:absolute; left:50%; bottom:40px; width:0; height:0; transform-origin:0 100%; transition:transform .5s cubic-bezier(.4,0,.8,.5); }
  .sw-ball { position:absolute; left:0; border-radius:50%; background:radial-gradient(circle at 35% 30%, #fff 0 40%, #e6f0fa 75%, #c8dbee 100%); border:5px solid #111;
    display:flex; align-items:center; justify-content:center; color:#2b6cb0; line-height:1; white-space:nowrap; transform:translateX(-50%); }
  .sw-ball.pic { color:inherit; }
  .sw-hat { position:absolute; left:0; transform:translateX(-50%); display:flex; align-items:flex-end; justify-content:center; }
  .sw-hat i { position:absolute; bottom:0; left:50%; transform:translateX(-50%); width:150%; height:16%; background:#222; border:4px solid #111; border-radius:6px; }
  .sw-hat b { position:relative; width:100%; height:100%; background:#222; border:4px solid #111; border-radius:6px 6px 0 0; display:flex; align-items:center;
    justify-content:center; color:#fff; font-weight:900; margin-bottom:10%; }
  .sw-hat b::after { content:""; position:absolute; left:-4px; right:-4px; bottom:18%; height:16%; background:#e8173c; }
  .sw-face { position:absolute; inset:0; opacity:0; transition:opacity .3s; pointer-events:none; }
  .sw-stack.alive .sw-face { opacity:1; }
  .sw-lbl { transition:opacity .3s; }
  .sw-stack.alive .sw-lbl { opacity:0; }   /* the labels melt away so the face shows */
  /* A really silly face: big googly eyes (one bigger), a GIANT carrot sticking way out past the head,
     rosy cheeks and a huge open grin with teeth and a tongue. */
  .sw-face::before, .sw-face::after { content:""; position:absolute; top:56%; width:16%; height:10%; background:#ff8fab; border-radius:50%; opacity:.75; }
  .sw-face::before { left:6%; } .sw-face::after { right:6%; }
  .sw-eye { position:absolute; top:7%; width:38%; aspect-ratio:1; background:#fff; border:4px solid #111; border-radius:50%; }
  .sw-eye.l { left:8%; } .sw-eye.r { right:9%; width:31%; top:12%; }
  .sw-eye::after { content:""; position:absolute; left:28%; top:30%; width:46%; aspect-ratio:1; background:#111; border-radius:50%; animation:sw-goggle 1.2s ease-in-out infinite; }
  .sw-eye.r::after { animation-delay:-.5s; }
  .sw-nose { position:absolute; left:42%; top:38%; width:115%; height:24%; z-index:2; transform-origin:0 50%; transform:rotate(6deg);
    background:repeating-linear-gradient(90deg, #ff8a1f 0 16%, #e86a00 16% 19%); clip-path:polygon(0 0, 100% 46%, 100% 54%, 0 100%);
    filter:drop-shadow(2px 0 0 #111) drop-shadow(-2px 0 0 #111) drop-shadow(0 2px 0 #111) drop-shadow(0 -2px 0 #111); animation:sw-boop 1.6s ease-in-out infinite; }
  .sw-smile { position:absolute; left:20%; right:20%; top:64%; height:25%; background:#6b1020; border:4px solid #111; border-radius:0 0 999px 999px; overflow:hidden; }
  .sw-smile::before { content:""; position:absolute; left:0; right:0; top:0; height:30%; background:#fff; border-bottom:2px solid #111; }
  .sw-smile::after { content:""; position:absolute; left:28%; right:28%; bottom:-25%; height:60%; background:#ff6f91; border-radius:50%; }
  @keyframes sw-goggle { 0%, 100% { transform:translate(-14%, 0); } 50% { transform:translate(16%, -12%); } }
  @keyframes sw-boop { 0%, 100% { transform:rotate(6deg); } 50% { transform:rotate(0deg) scaleX(1.06); } }
  .sw-arm { position:absolute; width:calc(var(--bs) * .8); height:7px; background:#6b3f1d; border:2px solid #111; border-radius:99px; top:0; opacity:0; transition:opacity .3s; }
  .sw-stack.alive .sw-arm { opacity:1; }
  .sw-arm.l { right:calc(var(--bs) * .3); transform-origin:100% 50%; transform:rotate(20deg); }
  .sw-arm.r { left:calc(var(--bs) * .3); transform-origin:0 50%; transform:rotate(-20deg); animation:sw-wave .4s ease-in-out infinite alternate; animation-play-state:paused; }
  .sw-stack.alive .sw-arm.r { animation-play-state:running; }
  .sw-stack.alive { animation:sw-hop .45s cubic-bezier(.2,1.6,.4,1) 3; }
  .sw-stack.fall { transform:rotate(80deg) translateY(10px); }
  .sw-stack.fall .sw-ball { transition:transform .9s ease-in .35s; }

  .sw-tray { flex:none; display:flex; gap:12px; justify-content:center; align-items:flex-end; width:100%; padding:0 10px; min-height:96px; }
  .sw-opt { position:relative; width:var(--os); height:var(--os); border-radius:50%; padding:0; font:inherit; line-height:1; cursor:pointer; touch-action:manipulation;
    background:radial-gradient(circle at 35% 30%, #fff 0 40%, #e6f0fa 75%, #c8dbee 100%); border:5px solid #111; box-shadow:0 6px 0 #111; color:#2b6cb0;
    display:flex; align-items:center; justify-content:center; white-space:nowrap; animation:sw-in .3s cubic-bezier(.2,1.8,.4,1) both; }
  .sw-opt.hat { border-radius:10px 10px 4px 4px; background:#222; color:#fff; }
  .sw-opt.pic { color:inherit; }
  .sw-opt.gone { visibility:hidden; }
  .sw-opt.right { box-shadow:0 0 0 5px #fff, 0 0 0 10px #00b86b; animation:sw-wiggle .4s ease-in-out 3; }
  .sw-opt.dim { opacity:.4; }
  .sw-fly { position:absolute; z-index:5; pointer-events:none; }
  .sw-fx { position:absolute; inset:0; pointer-events:none; overflow:visible; z-index:6; }
  /* Boss Battle showdown: your snowman on the left, the boss builds its own on the right */
  .sw-scene.vs .sw-stack { left:26%; }
  .sw-scene.vs .sw-stack.sw-bstack { left:62%; }
  .sw-boss { position:absolute; right:4px; bottom:30px; z-index:4; pointer-events:none; }
  .sw-boss.throw .bx-boss { animation:sw-hop .3s ease-out; }

  @keyframes sw-snow { from { transform:translateY(0); } to { transform:translateY(110vh); } }
  @keyframes sw-wave { from { transform:rotate(-20deg); } to { transform:rotate(-50deg); } }
  @keyframes sw-hop { 50% { transform:translateY(-10%); } }
  @keyframes sw-in { from { transform:scale(.4); opacity:0; } }
  @keyframes sw-wiggle { 25% { transform:rotate(-8deg) scale(1.06); } 75% { transform:rotate(8deg) scale(1.06); } }
  @media (prefers-reduced-motion: reduce) { .sw-flake, .sw-stack.alive, .sw-opt, .sw-opt.right, .sw-arm.r, .sw-eye::after, .sw-nose { animation:none !important; } }`;

  function injectCss() {
    if (document.getElementById("sw-css")) return;
    const style = document.createElement("style");
    style.id = "sw-css";
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  registerMicrogame({
    id: "snowman",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 10000,
    input: "tap",
    tutorial: true, // has a ctx.tutorial script
    bossRival: true, // Boss Battle showdown: the boss builds its own snowman

    start(ctx) {
      injectCss();
      const speed = ctx.speed || 1;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const R = speed >= 1.5 ? 4 : 3, N = speed >= 2 ? 4 : 3;
      const { tone, sweep, noise } = ctx.sfx;
      // Each step has a NEW target ("A"… pick a… "B"… pick b…), with a beat in between where the clock stops
      // while the next one is shown and said (the teacher's idea, like the rhythm games).
      const S = ctx.choiceSteps(R, N, { lowercase: true });
      let C = S[0];
      const BEAT_MS = 800;
      // The beat: the clock stops, the card pops to the next target and the voice says it.
      function nextTarget(saidWord) {
        ctx.pauseTimer(BEAT_MS);
        C = S[step];
        card.firstChild.textContent = C.cardText;
        card.classList.remove("next"); void card.offsetWidth; card.classList.add("next");
        ctx.sfx.tone(98, 0.08, "square", 0.1); ctx.sfx.tone(98, 0.08, "square", 0.1, 0.16);
        ctx.later(() => { if (!done) ctx.say(C.prompt); }, saidWord ? 350 : 0);
      }

      const wrap = document.createElement("div");
      wrap.className = "sw";
      const card = document.createElement("button");
      card.className = "sw-card";
      card.setAttribute("aria-label", TEXT.cardLabel);
      card.innerHTML = '<span class="ct"></span>';
      card.firstChild.textContent = C.cardText;
      if (ctx.canSpeak && !C.listen) card.insertAdjacentHTML("beforeend", '<span class="spk">🔊</span>');
      card.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });
      const scene = document.createElement("div");
      scene.className = "sw-scene";
      scene.innerHTML = '<div class="sw-ground"></div><div class="sw-stack"><div class="sw-arm l"></div><div class="sw-arm r"></div></div><div class="sw-fx"></div>';
      if (!reduceMotion) for (let i = 0; i < 14; i++) {
        const f = document.createElement("div");
        f.className = "sw-flake";
        f.textContent = "❄";
        f.style.cssText = `left:${Math.random() * 100}%;animation-duration:${(4 + Math.random() * 4).toFixed(1)}s;animation-delay:${(-Math.random() * 6).toFixed(1)}s;font-size:${(0.7 + Math.random() * 0.8).toFixed(2)}rem;`;
        scene.appendChild(f);
      }
      const stack = scene.querySelector(".sw-stack"), fx = scene.querySelector(".sw-fx");
      const arms = [...scene.querySelectorAll(".sw-arm")];

      // Boss Battle showdown: your snowman moves to the left and the boss builds its own on the right, a
      // ball at a time (plain ones), and finishes it (face, arms, a hop) just as time runs out.
      const rv = window.Boss && Boss.rival(ctx);
      let bstack = null, bossBox = null;
      const bplaced = [];
      if (rv) {
        scene.classList.add("vs");
        bstack = document.createElement("div");
        bstack.className = "sw-stack sw-bstack";
        bstack.innerHTML = '<div class="sw-arm l"></div><div class="sw-arm r"></div>';
        bossBox = document.createElement("div");
        bossBox.className = "sw-boss";
        bossBox.appendChild(rv.el("var(--bbs)"));
        scene.insertBefore(bstack, fx);
        scene.insertBefore(bossBox, fx);
      }
      const tray = document.createElement("div");
      tray.className = "sw-tray";
      wrap.append(card, scene, tray);
      ctx.root.appendChild(wrap);

      // ---------- Sizes ----------
      let bs = 100; // base ball diameter
      const pieceSize = (s) => (s < 3 ? bs * SIZES[s] : bs * 0.5);
      function layout() {
        const H = scene.clientHeight, W = scene.clientWidth;
        const total = R >= 4 ? 1 + 0.78 + 0.6 + 0.62 : 1 + 0.78 + 0.6;
        bs = Math.max(rv ? 44 : 56, Math.min((H - 70) / (total * 0.9), W * (rv ? 0.3 : 0.42), 150)); // (two snowmen in the showdown)
        if (rv) scene.style.setProperty("--bbs", `${Math.max(50, Math.min(bs * 0.75, 90))}px`);
        scene.style.setProperty("--bs", `${bs}px`);
        scene.style.setProperty("--hs", `${bs * 0.6}px`);
        tray.style.setProperty("--os", `${Math.min(84, (tray.clientWidth - 12 * N - 20) / N)}px`);
        placed.forEach(placePiece);
        bplaced.forEach((p) => { const sz = pieceSize(p.step); p.el.style.width = p.el.style.height = `${sz}px`; p.el.style.bottom = `${baseOf(p.step)}px`; });
        if (bstack) bstack.querySelectorAll(".sw-arm").forEach((a) => { a.style.top = `${-(baseOf(1) + pieceSize(1) * 0.5)}px`; });
      }
      // Where piece s sits: each ball overlaps the one below by 10%.
      const baseOf = (s) => { let y = 0; for (let k = 0; k < s; k++) y += pieceSize(k) * 0.9; return y; };
      function placePiece(p) {
        const sz = pieceSize(p.step);
        p.el.style.width = `${p.step < 3 ? sz : sz * 0.8}px`;
        p.el.style.height = `${sz}px`;
        p.el.style.bottom = `${baseOf(p.step) - (p.step === 3 ? pieceSize(2) * 0.12 : 0)}px`;
        fitText(p.el, p.item, sz);
        if (p.step === 1) arms.forEach((a) => { a.style.top = `${-(baseOf(1) + sz * 0.5)}px`; });
      }
      function fitText(el, item, sz) {
        const t = el.querySelector("b, .sw-lbl") || el;
        if (item.kind === "word") t.style.fontSize = `${Math.min(sz * 0.32, (sz * 0.8) / (item.text.length * 0.6))}px`;
        else t.style.fontSize = `${sz * (item.kind === "pic" ? 0.4 : 0.46)}px`;
      }

      // ---------- Steps ----------
      let step = 0, done = false, busy = false;
      const placed = [];
      let opts = [];
      function showStep() {
        tray.innerHTML = "";
        opts = C.row.map((item, i) => {
          const b = document.createElement("button");
          b.className = "sw-opt" + (step === 3 ? " hat" : "") + (item.kind === "pic" ? " pic" : "");
          b.textContent = item.text;
          b.style.animationDelay = `${i * 0.06}s`;
          b.setAttribute("aria-label", TEXT.optLabel(item.spoken));
          const os = parseFloat(getComputedStyle(tray).getPropertyValue("--os")) || 80;
          if (item.kind === "word") b.style.fontSize = `${Math.min(os * 0.32, (os * 0.86) / (item.text.length * 0.6))}px`;
          else b.style.fontSize = `${os * 0.44}px`;
          b.addEventListener("pointerdown", (e) => { e.preventDefault(); choose(i); });
          b.addEventListener("click", (e) => { if (e.detail === 0) choose(i); });
          tray.appendChild(b);
          return { el: b, item };
        });
      }
      function makePiece(item, s) {
        let el;
        if (s === 3) {
          el = document.createElement("div");
          el.className = "sw-hat";
          el.innerHTML = "<b></b><i></i>";
          el.querySelector("b").textContent = item.text;
        } else {
          el = document.createElement("div");
          el.className = "sw-ball" + (item.kind === "pic" ? " pic" : "");
          el.innerHTML = '<span class="sw-lbl"></span>';
          el.firstChild.textContent = item.text;
          if (s === 2) el.insertAdjacentHTML("beforeend", '<div class="sw-face"><div class="sw-eye l"></div><div class="sw-eye r"></div><div class="sw-nose"></div><div class="sw-smile"></div></div>');
        }
        stack.appendChild(el);
        const p = { el, item, step: s };
        placed.push(p);
        placePiece(p);
        return p;
      }

      function choose(i) {
        if (done || busy || ctx.ended) return;
        const o = opts[i];
        busy = true;
        // Fly the option from the tray to its place on the stack.
        const sr = scene.getBoundingClientRect(), br = o.el.getBoundingClientRect();
        o.el.classList.add("gone");
        const p = makePiece(o.item, step);
        const pr = p.el.getBoundingClientRect();
        const dx = br.left + br.width / 2 - (pr.left + pr.width / 2), dy = br.top + br.height / 2 - (pr.top + pr.height / 2);
        p.el.animate([{ transform: `translate(calc(-50% + ${dx}px), ${dy}px) scale(${br.width / pr.width})` }, { transform: "translate(-50%, 0) scale(1)" }],
          { duration: reduceMotion ? 1 : 380, easing: "cubic-bezier(.3,.7,.4,1)" });
        sweep(200, 500, 0.3, "sine", 0.08); // whoosh
        ctx.later(() => {
          noise(0.12, "lowpass", 900, 300, 0.4); // flump
          if (!o.item.right) { topple(); return; }
          if (o.item.kind === "pic") ctx.say(o.item.spoken);
          step++;
          busy = false;
          if (step >= R) win();
          else { nextTarget(o.item.kind === "pic"); showStep(); }
        }, reduceMotion ? 10 : 390);
      }

      function win() {
        done = true;
        ctx.win();
        tray.innerHTML = "";
        stack.classList.add("alive");
        [523, 659, 784, 1047].forEach((f, k) => tone(f, 0.12, "triangle", 0.12, k * 0.08));
        const sr = stack.getBoundingClientRect(), fr = fx.getBoundingClientRect();
        ctx.confetti(fx, sr.left - fr.left, sr.top - fr.top - baseOf(Math.min(R, 3)) * 0.6);
        ctx.say(C.answer);
      }

      function topple() {
        done = true;
        ctx.lose();
        stack.classList.add("fall");
        // Each piece rolls away a different distance.
        placed.forEach((p, k) => { p.el.style.transform = `translate(calc(-50% + ${(k - 1) * 30}px), ${-80 - k * 40}px) rotate(${180 + k * 90}deg)`; });
        sweep(400, 80, 0.8, "sawtooth", 0.1); // wobble... crash
        noise(0.5, "lowpass", 1200, 150, 0.6, 0.35);
        ctx.later(() => { showRight(); ctx.say(C.answer); }, 600);
      }
      function showRight() { opts.forEach((o) => { o.el.classList.remove("gone"); o.el.classList.add(o.item.right ? "right" : "dim"); o.el.disabled = true; }); }
      function replay() { if (!done) ctx.say(C.prompt); }

      // The boss's snowman: plain balls dropping on one at a time (3 of them, like yours at this speed).
      const BN = Math.min(R, 3);
      function bossBall() {
        const s = bplaced.length;
        if (s >= BN) return;
        const el = document.createElement("div");
        el.className = "sw-ball";
        if (s === BN - 1) el.innerHTML = '<div class="sw-face"><div class="sw-eye l"></div><div class="sw-eye r"></div><div class="sw-nose"></div><div class="sw-smile"></div></div>';
        bstack.appendChild(el);
        bplaced.push({ el, step: s });
        layout();
        el.animate([{ transform: "translate(-50%, -160px) scale(.6)" }, { transform: "translate(-50%, 0) scale(1)" }], { duration: reduceMotion ? 1 : 380, easing: "cubic-bezier(.3,.7,.4,1)" });
        bossBox.classList.remove("throw"); void bossBox.offsetWidth; bossBox.classList.add("throw");
        ctx.later(() => noise(0.1, "lowpass", 800, 300, 0.25), 380); // flump
      }
      if (rv) {
        rv.tries(BN - 1, bossBall);
        rv.onTimeUp(() => {
          while (bplaced.length < BN) bossBall();
          ctx.later(() => { bstack.classList.add("alive"); rv.bubble(window.Boss.TEXT.done, 1500); }, 420);
        });
      }

      ctx.onTimeout(() => { done = true; showRight(); ctx.say(C.answer); });
      function onKey(e) {
        const i = parseInt(e.key, 10) - 1;
        if (i >= 0 && i < N) { e.preventDefault(); choose(i); }
        else if (e.key === " ") { e.preventDefault(); replay(); }
      }
      document.addEventListener("keydown", onKey);

      layout();
      showStep();
      const ro = new ResizeObserver(layout);
      ro.observe(scene);
      ctx.say(C.prompt);
      // Show the target big in the middle for a moment before play starts (ctx.reveal).
      ctx.reveal(card);

      // Tutorial: point at the card, then at each step tap the right one once the game is ready for it.
      ctx.tutorial(S.map((s) => s.target), async (f) => {
        await f.point(card);
        for (let r = 0; r < R; r++) {
          await f.until(() => !busy && step === r && opts.length && S[r].row.includes(opts[0].item) && opts[0].el.isConnected, 5000);
          if (r) await f.point(card, 500); // the new one
          await f.tap(() => opts.find((o) => o.item.right).el);
        }
      });
      return () => { done = true; ro.disconnect(); document.removeEventListener("keydown", onKey); };
    },
  });
})();
