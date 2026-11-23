// CHICKEN CHOIR — a rhythm game (made up by Claude when the teacher asked for "a new rhythm game with a silly
// theme"). Chickens stand in a row on a fence, each holding a sign; your monster (the mascot) conducts with a
// baton. Tap the chicken with the card's target and it sings the next note of the song (BAWK ♪): then a beat,
// the card changes, and the signs are swapped round. 5 notes and the whole choir sings the song together
// (ENCORE!). A wrong chicken squawks off-key, feathers fly, and it drops an egg on the conductor's head
// (SPLAT!). 3 of those and the song is ruined.
(function () {
  const TEXT = {
    name: { en: "Chicken Choir" },
    icon: "🐔",
    howTo: (list) => ({ en: {
      steps: [
        list.type === "hfw" ? ["👂", "Listen to the word, like \"the\". It's on the card too."] : ["👀", "Look at the card at the top."],
        ["🐔", "Tap the chicken with the same one: it sings a note! BAWK ♪"],
        ["🔁", "Then the card changes. Sing 5 notes to finish the song!"],
      ],
      tips: [
        "A wrong chicken sings off-key and drops an egg on your head! Three eggs and the song is ruined.",
        "Tap the card to hear it again.",
        "When the game speeds up, there are 4 chickens.",
      ],
    } }),
    instruction: { en: "CHICKEN\nCHOIR!" },
    cardLabel: "Hear it again",
    chickLabel: (t) => `The chicken with ${t}`,
    sing: ["BAWK ♪", "BUK-BUK ♪", "BA-GAWK ♪", "CLUCK ♪", "BAWK ♪"],
    squawk: "SQUAWK!",
    splat: "SPLAT!",
    encore: "ENCORE!",
  };
  const NOTES = 5;
  // The song: a little tune made up for it (one note per right chicken), then the big finish.
  const TUNE = [523, 659, 784, 659, 1047];

  const CSS = `
  .ch { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:8px; padding-bottom:8px; }
  .ch-top { flex:none; display:flex; align-items:center; gap:12px; }
  .ch-card { min-width:84px; height:72px; padding:0 18px; border-radius:18px; font:inherit; font-size:2.6rem; line-height:1; background:#fff; color:#111;
    border:5px solid #111; box-shadow:0 6px 0 #111; display:flex; align-items:center; justify-content:center; gap:8px; cursor:pointer; touch-action:manipulation; }
  .ch-card .spk { font-size:1.3rem; opacity:.6; }
  .ch-card.next { animation:ch-next .45s cubic-bezier(.2,1.8,.4,1); }
  .ch-notes { display:flex; gap:3px; font-size:1.3rem; }
  .ch-note { filter:grayscale(1) opacity(.3); } .ch-note.on { filter:none; }
  .ch-eggs { display:flex; gap:2px; font-size:1.1rem; }
  .ch-egg { filter:grayscale(1) opacity(.25); } .ch-egg.on { filter:none; }
  /* The stage: a barnyard at sunset, a fence, the chickens on it */
  .ch-stage { position:relative; flex:1; min-height:0; width:100%; max-width:560px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111;
    background:linear-gradient(180deg, #ffb36b 0 45%, #ffd37a 45% 58%, #7cc95a 58%); touch-action:manipulation; }
  .ch-stage::before { content:""; position:absolute; left:72%; top:8%; width:16%; aspect-ratio:1; border-radius:50%; background:#ffe680; box-shadow:0 0 30px 10px rgba(255,230,128,.6); }   /* the sun */
  .ch-fence { position:absolute; left:0; right:0; top:var(--fy); height:calc(var(--cz) * .5); z-index:1;
    background:repeating-linear-gradient(90deg, #b07a43 0 18px, transparent 18px 46px), linear-gradient(transparent 0 20%, #c98a4b 20% 40%, transparent 40% 60%, #c98a4b 60% 80%, transparent 80%); }
  /* A chicken: --cz is its size. White and round, a red comb, a yellow beak, googly eyes, a sign under its wing */
  .ch-chick { position:absolute; left:0; top:0; width:var(--cz); height:var(--cz); margin:calc(var(--cz) * -1) 0 0 calc(var(--cz) * -.5); z-index:3; padding:0; border:0; background:none;
    font:inherit; cursor:pointer; touch-action:manipulation; }
  .ch-in { position:absolute; inset:0; transform-origin:50% 100%; animation:ch-sway 1s ease-in-out infinite alternate; }
  .ch-body { position:absolute; left:12%; right:12%; top:24%; bottom:6%; background:#fff; border:4px solid #111; border-radius:50% 50% 46% 46%; }
  .ch-comb { position:absolute; left:38%; top:8%; width:26%; height:18%; background:#e8173c; border:4px solid #111; border-radius:50% 50% 20% 20%; clip-path:polygon(0 100%, 0 30%, 25% 0, 50% 30%, 75% 0, 100% 30%, 100% 100%); }
  .ch-eye { position:absolute; top:32%; width:20%; aspect-ratio:1; background:#fff; border:3px solid #111; border-radius:50%; z-index:2; }
  .ch-eye.l { left:26%; } .ch-eye.r { right:26%; width:17%; top:34%; }
  .ch-eye i { position:absolute; left:28%; top:30%; width:46%; aspect-ratio:1; background:#111; border-radius:50%; animation:ch-goggle 1.2s ease-in-out infinite; }
  .ch-beak { position:absolute; left:41%; top:50%; width:18%; height:12%; background:#ffb000; border:3px solid #111; border-radius:50% 50% 20% 20%; z-index:2; transform-origin:50% 0; }
  .ch-sign { position:absolute; left:8%; right:8%; bottom:-2%; height:38%; display:flex; align-items:center; justify-content:center; background:#fff8d6; border:3px solid #111; border-radius:8px;
    font-size:calc(var(--cz) * .28); line-height:1; color:#111; white-space:nowrap; z-index:3; }
  .ch-sign.pic { font-size:calc(var(--cz) * .3); }
  .ch-legs { position:absolute; left:34%; right:34%; bottom:-8%; height:12%; border-left:4px solid #ff8a00; border-right:4px solid #ff8a00; }
  .ch-chick.sing .ch-in { animation:ch-sing .35s ease-out; }
  .ch-chick.sing .ch-beak { animation:ch-beak .12s ease-in-out 4 alternate; }
  .ch-chick.sour .ch-in { animation:ch-flap .1s linear 6; }
  .ch-chick.right .ch-sign { background:#b8ffcf; box-shadow:0 0 0 4px #fff, 0 0 0 8px #00b86b; }
  .ch-chick.dim { opacity:.45; }
  .ch-all .ch-in { animation:ch-sing .3s ease-in-out infinite alternate; }
  .ch-me { position:absolute; left:50%; bottom:2%; z-index:4; pointer-events:none; transform:translateX(-50%); }
  .ch-baton { position:absolute; right:-4%; top:30%; width:6px; height:calc(var(--chz) * .6); background:#fff; border:2px solid #111; border-radius:3px; transform-origin:50% 100%;
    transform:rotate(-30deg); animation:ch-wave .5s ease-in-out infinite alternate; z-index:6; }
  .ch-fx { position:absolute; inset:0; pointer-events:none; z-index:8; overflow:visible; }
  .ch-pop { position:absolute; font-size:1.6rem; line-height:1; pointer-events:none; transform:translate(-50%, -50%); }
  .ch-word { position:absolute; left:50%; top:16%; transform:translate(-50%, -50%) rotate(-8deg); font-size:2.2rem; color:#ffd400; -webkit-text-stroke:2px #111; paint-order:stroke fill;
    text-shadow:0 4px 0 #111; white-space:nowrap; pointer-events:none; animation:ch-word .9s ease-out forwards; }
  .ch-word.bad { color:#fff; } .ch-word.big { font-size:3rem; animation-duration:2s; }
  @keyframes ch-next { 0% { transform:scale(.4) rotate(-10deg); } 60% { transform:scale(1.25) rotate(4deg); } 100% { transform:none; } }
  @keyframes ch-sway { from { transform:rotate(-4deg); } to { transform:rotate(4deg); } }
  @keyframes ch-goggle { 0%, 100% { transform:translate(-16%, 0); } 50% { transform:translate(16%, -12%); } }
  @keyframes ch-sing { 40% { transform:translateY(-18%) scale(1.08, .94); } }
  @keyframes ch-beak { to { transform:scaleY(1.8); } }
  @keyframes ch-flap { 25% { transform:rotate(-12deg); } 75% { transform:rotate(12deg); } }
  @keyframes ch-wave { from { transform:rotate(-40deg); } to { transform:rotate(10deg); } }
  @keyframes ch-word { from { opacity:1; transform:translate(-50%, -50%) rotate(-8deg) scale(.5); } 25% { transform:translate(-50%, -60%) rotate(-8deg) scale(1.15); }
    75% { opacity:1; } to { opacity:0; transform:translate(-50%, -100%) rotate(-8deg); } }
  @media (prefers-reduced-motion: reduce) { .ch-in, .ch-eye i, .ch-baton, .ch-card.next, .ch-word, .ch-all .ch-in { animation:none !important; } }
  `;
  function injectCss() {
    if (document.getElementById("ch-css")) return;
    const s = document.createElement("style"); s.id = "ch-css"; s.textContent = CSS; document.head.appendChild(s);
  }

  registerMicrogame({
    id: "chicken-choir",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 14000,   // 5 notes (the beats between them don't count)
    input: "tap",
    tutorial: true,

    start(ctx) {
      injectCss();
      const speed = ctx.speed || 1;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const { tone, sweep, noise } = ctx.sfx;
      const N = speed >= 1.75 ? 4 : 3;
      const S = ctx.choiceSteps(NOTES, N, { lowercase: true });
      let C = S[0];

      const wrap = document.createElement("div");
      wrap.className = "ch";
      const top = document.createElement("div");
      top.className = "ch-top";
      const card = document.createElement("button");
      card.className = "ch-card";
      card.setAttribute("aria-label", TEXT.cardLabel);
      card.innerHTML = '<span class="ct"></span>';
      const cardText = () => (C.listen ? C.target.text : C.cardText); // always shown (🔊 replays)
      card.firstChild.textContent = cardText();
      if (ctx.canSpeak) card.insertAdjacentHTML("beforeend", '<span class="spk">🔊</span>');
      card.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });
      const prog = document.createElement("div");
      prog.innerHTML = `<div class="ch-notes">${'<span class="ch-note">🎵</span>'.repeat(NOTES)}</div><div class="ch-eggs">${'<span class="ch-egg">🥚</span>'.repeat(3)}</div>`;
      top.append(card, prog);
      const stage = document.createElement("div");
      stage.className = "ch-stage";
      stage.innerHTML = '<div class="ch-fence"></div><div class="ch-fx"></div>';
      const fx = stage.querySelector(".ch-fx");
      const meBox = document.createElement("div");
      meBox.className = "ch-me";
      const me = window.Mascot.el("var(--chz)");
      me.insertAdjacentHTML("beforeend", '<div class="ch-baton"></div>');
      meBox.appendChild(me);
      stage.appendChild(meBox);
      wrap.append(top, stage);
      ctx.root.appendChild(wrap);

      const chicks = [...Array(N)].map((_, i) => {
        const b = document.createElement("button");
        b.className = "ch-chick";
        b.innerHTML = '<div class="ch-in"><div class="ch-legs"></div><div class="ch-comb"></div><div class="ch-body"></div><div class="ch-eye l"><i></i></div><div class="ch-eye r"><i></i></div>' +
          '<div class="ch-beak"></div><div class="ch-sign"></div></div>';
        b.querySelector(".ch-in").style.animationDelay = `${-i * 0.25}s`;
        b.addEventListener("pointerdown", (e) => { e.preventDefault(); pick(c); });
        stage.insertBefore(b, fx);
        const c = { el: b, sign: b.querySelector(".ch-sign"), i, opt: null, x: 0, y: 0 };
        return c;
      });

      // ---------- Layout ----------
      let W = 0, H = 0, cz = 80;
      function layout() {
        W = stage.clientWidth; H = stage.clientHeight;
        cz = Math.max(60, Math.min((W - 16) / N - 6, H * 0.4, 130));
        const fy = H * 0.52;
        stage.style.setProperty("--cz", `${cz}px`);
        stage.style.setProperty("--fy", `${fy}px`);
        stage.style.setProperty("--chz", `${Math.max(60, Math.min(H - fy - cz * 0.2, W * 0.26, 120))}px`);
        chicks.forEach((c) => {
          c.x = (W / N) * (c.i + 0.5); c.y = fy + cz * 0.12;
          c.el.style.transform = `translate(${c.x}px, ${c.y}px)`;
          if (c.opt && c.opt.kind === "word") c.sign.style.fontSize = `${Math.min(cz * 0.26, (cz * 0.78) / (c.opt.text.length * 0.6))}px`;
        });
      }
      function deal() {
        const row = ctx.shuffle(C.row.slice());
        chicks.forEach((c, i) => {
          c.opt = row[i];
          c.sign.textContent = c.opt.text;
          c.sign.classList.toggle("pic", c.opt.kind === "pic");
          c.el.setAttribute("aria-label", TEXT.chickLabel(c.opt.spoken));
          c.el.classList.remove("right", "dim");
        });
        layout();
      }

      // ---------- Singing ----------
      let step = 0, misses = 0, done = false, busy = false;
      function pick(c) {
        if (done || busy || ctx.ended) return;
        busy = true;
        if (c.opt.right) sing(c); else sour(c);
      }
      function sing(c) {
        c.el.classList.remove("sing"); void c.el.offsetWidth; c.el.classList.add("sing");
        tone(TUNE[step], 0.32, "square", 0.08); tone(TUNE[step] * 1.5, 0.3, "triangle", 0.04, 0.02); // the note
        pop("🎵", c.x, c.y - cz * 1.05);
        word(TEXT.sing[step % TEXT.sing.length], false);
        if (c.opt.kind === "pic") ctx.later(() => ctx.say(c.opt.spoken), 250);
        top.querySelectorAll(".ch-note")[step].classList.add("on");
        step++;
        if (step >= NOTES) { done = true; ctx.win(); ctx.later(encore, 400); return; }
        ctx.later(next, 520);
      }
      // The beat: the clock stops, the card pops to the next target, the voice says it, the signs swap round.
      function next() {
        if (done) return;
        ctx.pauseTimer(800);
        C = S[step];
        card.firstChild.textContent = cardText();
        card.classList.remove("next"); void card.offsetWidth; card.classList.add("next");
        ctx.later(() => { if (!done) ctx.say(C.prompt); }, 150);
        deal();
        ctx.later(() => { busy = false; }, 250);
      }
      function sour(c) {
        c.el.classList.remove("sour"); void c.el.offsetWidth; c.el.classList.add("sour");
        sweep(900, 300, 0.3, "sawtooth", 0.1); sweep(700, 250, 0.25, "sawtooth", 0.08, 0.05); // SQUAWK (off-key)
        word(TEXT.squawk, true);
        for (let k = 0; k < 4; k++) pop("🪶", c.x + (Math.random() - 0.5) * cz, c.y - cz * (0.6 + Math.random() * 0.6));
        // …and drops an egg on the conductor's head: SPLAT!
        const m = meBox.getBoundingClientRect(), s0 = stage.getBoundingClientRect();
        const head = { x: m.left - s0.left + m.width / 2, y: m.top - s0.top + m.height * 0.15 };
        const egg = document.createElement("div");
        egg.className = "ch-pop"; egg.textContent = "🥚";
        fx.appendChild(egg);
        egg.animate([{ left: `${c.x}px`, top: `${c.y - cz * 0.5}px` }, { left: `${head.x}px`, top: `${head.y}px` }], { duration: reduceMotion ? 1 : 420, easing: "ease-in", fill: "forwards" });
        ctx.later(() => {
          egg.textContent = "🍳";
          noise(0.1, "bandpass", 1200, 600, 0.3); // splat
          window.Mascot.mood(me, "sad");
          ctx.later(() => egg.remove(), 700);
        }, reduceMotion ? 10 : 430);
        top.querySelectorAll(".ch-egg")[misses].classList.add("on");
        misses++;
        if (misses >= 3) { done = true; ctx.lose(); ctx.later(() => { showRight(); ctx.say(C.answer); }, 500); return; }
        ctx.later(() => { window.Mascot.mood(me, null); busy = false; }, 800);
      }
      // All 5 notes: the whole choir sings the song together, ENCORE!
      function encore() {
        stage.classList.add("ch-all");
        window.Mascot.mood(me, "cheer");
        TUNE.forEach((f, i) => { tone(f, 0.22, "square", 0.07, i * 0.2); tone(f / 2, 0.22, "triangle", 0.05, i * 0.2); });
        tone(1047, 0.6, "square", 0.07, TUNE.length * 0.2); tone(784, 0.6, "triangle", 0.05, TUNE.length * 0.2);
        word(TEXT.encore, false, true);
        for (let k = 0; k < 6; k++) ctx.later(() => pop("🎶", W * (0.15 + Math.random() * 0.7), H * (0.2 + Math.random() * 0.3)), k * 150);
        ctx.confetti(fx, W / 2, H * 0.35, { count: 90 });
        ctx.say(C.answer);
      }
      function showRight() { chicks.forEach((c) => c.el.classList.add(c.opt.right ? "right" : "dim")); }
      function pop(text, x, y) {
        const p = document.createElement("div");
        p.className = "ch-pop"; p.textContent = text;
        p.style.left = `${x}px`; p.style.top = `${y}px`;
        fx.appendChild(p);
        p.animate([{ transform: "translate(-50%, -50%) scale(.6)", opacity: 1 }, { transform: "translate(-50%, -160%) scale(1.3)", opacity: 0 }], { duration: 800, fill: "forwards" });
        ctx.later(() => p.remove(), 820);
      }
      function word(text, bad, big) {
        const w = document.createElement("div");
        w.className = "ch-word" + (bad ? " bad" : "") + (big ? " big" : "");
        w.textContent = text;
        fx.appendChild(w);
        ctx.later(() => w.remove(), big ? 2000 : 900);
      }
      function replay() { if (!done) ctx.say(C.prompt); }

      ctx.onTimeout(() => { done = true; window.Mascot.mood(me, "sad"); showRight(); ctx.say(C.answer); });
      function onKey(e) {
        const i = parseInt(e.key, 10) - 1;
        if (i >= 0 && i < N) { e.preventDefault(); pick(chicks[i]); }
        else if (e.key === " ") { e.preventDefault(); replay(); }
      }
      document.addEventListener("keydown", onKey);

      deal();
      const ro = new ResizeObserver(layout);
      ro.observe(stage);
      ctx.say(C.prompt);
      ctx.reveal(card);

      // Tutorial: point at the card, then tap the singing chicken each time (the card changes).
      ctx.tutorial(S.map((s) => s.target), async (f) => {
        await f.point(card, 800);
        for (let n = 0; n < NOTES && !done; n++) {
          await f.until(() => !busy && step === n, 3000);
          if (n) await f.point(card, 400);
          await f.tap(() => (chicks.find((c) => c.opt.right) || chicks[0]).el);
          await f.until(() => step > n || done, 2000);
        }
      });
      return () => { done = true; ro.disconnect(); document.removeEventListener("keydown", onKey); };
    },
  });
})();
