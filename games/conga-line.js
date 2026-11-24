// CONGA LINE — a rhythm game (Claude's idea, named by the teacher; like Dance Off: every step a NEW target,
// `ctx.choiceSteps`, with a beat between). Your character leads a conga line along a beach dance floor. Below,
// letter monsters wait holding signs. Tap the one with the card's answer and it dances over and joins the line
// (CONGA!). A wrong one trips the whole line over (OOPS!): one trip is allowed, the second loses. Four joiners
// and it's a CONGA PARTY.
(function () {
  const TEXT = {
    name: { en: "Conga Line" },
    icon: "💃",
    howTo: { en: {
      steps: [
        ["👀", "Look at the card."],
        ["👆", "Tap the dancer holding the same thing. They join your conga line!"],
        ["🎶", "Then the card changes. Get 4 dancers for a conga party!"],
      ],
      tips: ["A wrong dancer trips everyone over! You can trip once.", "Tap the card to hear it again.", "When the game speeds up, there are more dancers to choose from."],
    } },
    instruction: { en: "CONGA\nLINE!" },
    cardLabel: "The card. Tap to hear it again.",
    dancerLabel: (t) => `Dancer with ${t}`,
    join: ["CONGA!", "JOIN IN!", "CHA CHA!", "WOO!"],
    oops: "OOPS!",
    party: "CONGA PARTY!",
  };
  const GOAL = 4, MISSES = 2, BEAT_MS = 900;
  const STARTERS = ["apple", "ball", "cat", "dinosaur", "elephant", "flower"];

  const CSS = `
  .cg { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:6px; padding-bottom:6px; }
  .cg-top { flex:none; display:flex; align-items:center; gap:10px; }
  .cg-card { min-width:110px; padding:4px 16px; background:#fff; border:5px solid #111; border-radius:16px; box-shadow:0 5px 0 #111; font:inherit; color:#111;
    font-size:clamp(1.8rem, 8vw, 3rem); line-height:1.05; cursor:pointer; touch-action:manipulation; display:flex; align-items:center; gap:6px; white-space:nowrap; }
  .cg-card .spk { font-size:.45em; }
  .cg-card.next { animation:cg-next .35s cubic-bezier(.2,1.8,.4,1); }
  .cg-pips { display:flex; flex-direction:column; gap:4px; }
  .cg-row { display:flex; gap:4px; }
  .cg-pip { width:22px; height:22px; border:3px solid #111; border-radius:50%; background:#fff; display:flex; align-items:center; justify-content:center; font-size:12px; line-height:1; }
  .cg-pip.on { background:#ffd400; } .cg-pip.on::after { content:"💃"; }
  .cg-pip.x { background:#fff; } .cg-pip.x.on { background:#ff5a6e; } .cg-pip.x.on::after { content:"✕"; color:#fff; font-weight:900; }
  /* A beach dance floor: the sea and the sun at the top, sand below, coloured lights */
  .cg-floor { position:relative; flex:1; min-height:0; width:100%; max-width:620px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111;
    background:linear-gradient(180deg, #ffb36b 0 18%, #3fa9e0 18% 30%, #f4d28a 30%); }
  .cg-sun { position:absolute; left:70%; top:4%; width:12%; aspect-ratio:1; border-radius:50%; background:#fff27a; box-shadow:0 0 30px 10px rgba(255,240,120,.7); }
  .cg-lights { position:absolute; left:0; right:0; top:2%; height:20px; background:radial-gradient(circle, #ff5a6e 0 5px, transparent 6px) 0 0 / 40px 20px,
    radial-gradient(circle, #ffd400 0 5px, transparent 6px) 20px 6px / 40px 20px; animation:cg-blink .5s steps(2) infinite; }
  .cg-path { position:absolute; left:4%; right:4%; top:calc(var(--ly) + var(--dz) * .92); height:10px; background:repeating-linear-gradient(90deg, rgba(0,0,0,.18) 0 18px, transparent 18px 30px); border-radius:99px; }
  /* The line: you first, then everyone who joins; each bobs and kicks */
  .cg-mem { position:absolute; top:var(--ly); width:var(--dz); height:var(--dz); margin-left:calc(var(--dz) / -2); z-index:2; transition:left .5s ease-in-out; }
  .cg-mem .bob { position:absolute; inset:0; animation:cg-conga .5s ease-in-out infinite alternate; transform-origin:50% 100%; }
  .cg-mem.kick .bob { animation:cg-kick .25s ease-in-out 2 alternate; }
  .cg-floor.trip .cg-mem .bob { animation:cg-trip .5s ease-out forwards; }
  /* The dancers waiting to join: a letter monster holding a sign up (--wz) */
  .cg-wait { position:absolute; bottom:4%; width:var(--wz); height:calc(var(--wz) * 1.6); margin-left:calc(var(--wz) / -2); padding:0; border:0; background:none; font:inherit;
    cursor:pointer; touch-action:manipulation; z-index:3; animation:cg-in .35s cubic-bezier(.2,1.6,.4,1) both; }
  .cg-wait .who { position:absolute; left:0; bottom:0; }
  .cg-wait .who .ms { animation:cg-sway .6s ease-in-out infinite alternate; }
  .cg-stick { position:absolute; left:47%; top:30%; width:6%; height:34%; background:#8a5a3c; border:3px solid #111; z-index:0; }
  .cg-sign { position:absolute; left:50%; top:0; transform:translateX(-50%); min-width:78%; padding:2px 6px; background:#fff; border:4px solid #111; border-radius:10px;
    box-shadow:0 4px 0 #111; font-size:calc(var(--wz) * .36); line-height:1.1; color:#111; white-space:nowrap; z-index:2; }
  .cg-wait.bad { animation:cg-shake .1s linear 4; filter:grayscale(.7); }
  .cg-wait.right .cg-sign { box-shadow:0 0 0 5px #fff, 0 0 0 10px #00b86b; }
  .cg-wait.dim { opacity:.35; }
  .cg-fx { position:absolute; inset:0; pointer-events:none; z-index:8; overflow:visible; }
  .cg-word { position:absolute; transform:translate(-50%, -50%) rotate(-8deg); font-size:2.1rem; color:#ffd400; -webkit-text-stroke:2px #111; paint-order:stroke fill;
    text-shadow:0 4px 0 #111; white-space:nowrap; animation:cg-word 1s ease-out forwards; }
  .cg-word.bad { color:#ff5a6e; }
  .cg-note { position:absolute; font-size:1.4rem; line-height:1; animation:cg-float 1.2s ease-out forwards; }
  @keyframes cg-conga { from { transform:translateY(0) rotate(-6deg); } to { transform:translateY(-6%) rotate(6deg); } }
  @keyframes cg-kick { to { transform:translateY(-14%) rotate(-14deg) scale(1.05); } }
  @keyframes cg-trip { to { transform:translateY(12%) rotate(-82deg); } }
  @keyframes cg-sway { from { transform:rotate(-4deg); } to { transform:rotate(4deg); } }
  @keyframes cg-blink { 50% { filter:hue-rotate(120deg); } }
  @keyframes cg-in { from { scale:.4; opacity:0; } }
  @keyframes cg-shake { 25% { translate:-6px 0; } 75% { translate:6px 0; } }
  @keyframes cg-next { from { scale:.6; } }
  @keyframes cg-word { from { opacity:1; scale:.5; } 25% { scale:1.15; } 75% { opacity:1; } to { opacity:0; translate:0 -40px; } }
  @keyframes cg-float { to { translate:0 -60px; opacity:0; } }
  @media (prefers-reduced-motion: reduce) { .cg-mem .bob, .cg-wait, .cg-wait .who .ms, .cg-lights, .cg-word, .cg-note { animation:none !important; } }
  `;
  function injectCss() { if (document.getElementById("cg-css")) return; const s = document.createElement("style"); s.id = "cg-css"; s.textContent = CSS; document.head.appendChild(s); }

  registerMicrogame({
    id: "conga-line",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 14000,   // 4 joiners (the beats between them don't count)
    input: "tap",
    tutorial: true,

    start(ctx) {
      injectCss();
      const speed = ctx.speed || 1;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const { tone, noise } = ctx.sfx;
      const N = speed >= 1.75 ? 4 : 3;
      const S = ctx.choiceSteps(GOAL, N, { lowercase: true });
      let si = 0, st = S[0];
      const M = window.Mascot;
      // Who's waiting to dance: letter monsters (the ones this player has, else the starters), never you.
      const pool = (() => {
        if (!M) return [];
        const me = M.current();
        const ids = M.CHARS.filter((c) => c.letter && c.id !== me && M.isUnlocked(c.id)).map((c) => c.id);
        return ids.length >= N ? ids : STARTERS.filter((id) => id !== me);
      })();

      const wrap = document.createElement("div");
      wrap.className = "cg";
      const top = document.createElement("div");
      top.className = "cg-top";
      const card = document.createElement("button");
      card.className = "cg-card";
      card.setAttribute("aria-label", TEXT.cardLabel);
      card.innerHTML = '<span class="ct"></span>';
      card.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });
      const pips = document.createElement("div");
      pips.className = "cg-pips";
      pips.innerHTML = `<div class="cg-row hits">${'<span class="cg-pip"></span>'.repeat(GOAL)}</div><div class="cg-row">${'<span class="cg-pip x"></span>'.repeat(MISSES)}</div>`;
      top.append(card, pips);
      const floor = document.createElement("div");
      floor.className = "cg-floor";
      floor.innerHTML = '<div class="cg-sun"></div><div class="cg-lights"></div><div class="cg-path"></div>';
      const fx = document.createElement("div");
      fx.className = "cg-fx";
      floor.appendChild(fx);
      wrap.append(top, floor);
      ctx.root.appendChild(wrap);
      const hitPips = pips.querySelector(".hits").children, missPips = pips.children[1].children;

      // The line: you lead.
      const line = [];
      function addMember(id) {
        const m = document.createElement("div");
        m.className = "cg-mem";
        const b = document.createElement("div");
        b.className = "bob";
        b.style.animationDelay = `${-line.length * 0.12}s`;
        b.appendChild(M ? M.el("var(--dz)", id) : document.createElement("div"));
        m.appendChild(b);
        floor.insertBefore(m, fx);
        line.push(m);
        return m;
      }
      addMember(undefined);

      let W = 0, H = 0, dz = 70, wz = 70;
      function layout() {
        W = floor.clientWidth; H = floor.clientHeight;
        dz = Math.max(48, Math.min(W / 6.2, H * 0.28, 110));
        wz = Math.max(56, Math.min((W - 30) / N - 16, H * 0.26, 110));
        floor.style.setProperty("--dz", `${dz}px`); floor.style.setProperty("--wz", `${wz}px`);
        floor.style.setProperty("--ly", `${H * 0.24}px`);
        placeLine();
        waiting.forEach((w, i) => {
          w.b.style.left = `${W * (i + 0.5) / N}px`;
          w.b.querySelector(".cg-sign").style.fontSize = w.o.kind === "word" ? `${Math.min(wz * 0.32, (wz * 1.3) / ([...w.o.text].length * 0.62))}px` : "";
        });
      }
      // The line snakes along from the left; everyone sits a little behind the one in front.
      function placeLine() {
        const gap = dz * 0.78, x0 = Math.min(W * 0.5, dz * 0.7 + (line.length - 1) * gap);
        line.forEach((m, k) => { m.style.left = `${x0 - k * gap}px`; m.style.zIndex = 10 - k; });
      }

      let waiting = [];
      function deal() {
        waiting.forEach((w) => w.b.remove());
        card.firstChild.textContent = st.cardText;
        card.querySelector(".spk")?.remove();
        if (ctx.canSpeak && !st.listen) card.insertAdjacentHTML("beforeend", '<span class="spk">🔊</span>');
        const ids = ctx.shuffle(pool.slice());
        waiting = ctx.shuffle(st.row.slice()).map((o, i) => {
          const b = document.createElement("button");
          b.className = "cg-wait";
          b.style.animationDelay = `${i * 0.06}s`;
          b.setAttribute("aria-label", TEXT.dancerLabel(o.spoken || o.text));
          const id = ids[i % Math.max(1, ids.length)];
          b.innerHTML = '<div class="cg-stick"></div><div class="who"></div><span class="cg-sign"></span>';
          b.querySelector(".cg-sign").textContent = o.text;
          if (M) b.querySelector(".who").appendChild(M.el("var(--wz)", id));
          b.addEventListener("pointerdown", (e) => { e.preventDefault(); pick(w); });
          floor.insertBefore(b, fx);
          const w = { b, o, id };
          return w;
        });
        if (W) layout();
      }

      let hits = 0, missN = 0, done = false, busy = false;
      function pick(w) {
        if (done || busy || ctx.ended) return;
        busy = true;
        if (w.o.right) join(w); else trip(w);
      }
      // A right dancer: it hops up into the back of the line, and everyone kicks.
      function join(w) {
        const fr = floor.getBoundingClientRect(), r = w.b.getBoundingClientRect();
        w.b.style.visibility = "hidden";
        const m = addMember(w.id);
        placeLine();
        const to = parseFloat(m.style.left);
        m.style.transition = "none";
        m.animate([{ transform: `translate(${r.left - fr.left + r.width / 2 - to}px, ${r.top - fr.top + r.height - dz - H * 0.24}px)` }, { transform: `translate(0, ${-dz * 0.4}px)`, offset: 0.6 }, { transform: "none" }],
          { duration: reduceMotion ? 1 : 520, easing: "ease-out" });
        ctx.later(() => { m.style.transition = ""; }, 600);
        line.forEach((x, k) => ctx.later(() => { x.classList.remove("kick"); void x.offsetWidth; x.classList.add("kick"); }, 300 + k * 70));
        [392, 523, 659].forEach((f, k) => tone(f, 0.1, "square", 0.07, k * 0.12));   // cha-cha-cha
        noise(0.05, "highpass", 3000, 5000, 0.2, 0.36);
        note(r.left - fr.left + r.width / 2, r.top - fr.top);
        word(TEXT.join[hits % TEXT.join.length], false);
        if (w.o.kind === "pic") ctx.say(w.o.spoken);
        hitPips[hits].classList.add("on");
        hits++;
        if (hits >= GOAL) { done = true; ctx.win(); ctx.later(party, 600); return; }
        // The beat: the clock stops, the card pops to the next target, new dancers come.
        ctx.later(() => {
          if (done) return;
          ctx.pauseTimer(BEAT_MS);
          st = S[++si];
          tone(98, 0.08, "square", 0.1); tone(147, 0.08, "square", 0.1, 0.16);   // ba-dum
          card.classList.remove("next"); void card.offsetWidth; card.classList.add("next");
          deal();
          ctx.say(st.prompt);
          ctx.later(() => { busy = false; }, 300);
        }, 750);
      }
      function party() {
        word(TEXT.party, false, W / 2, H * 0.12);
        line.forEach((x) => x.classList.add("kick"));
        [523, 659, 784, 1047, 784, 1047].forEach((f, k) => tone(f, 0.12, "square", 0.08, k * 0.11));
        ctx.confetti(fx, W / 2, H * 0.3, { count: 100 });
        for (let k = 0; k < 6; k++) ctx.later(() => note(W * (0.1 + Math.random() * 0.8), H * 0.3), k * 150);
        ctx.say(st.answer);
      }
      // A wrong dancer: it trips the whole line over.
      function trip(w) {
        w.b.classList.add("bad");
        floor.classList.add("trip");
        tone(400, 0.08, "square", 0.1); tone(200, 0.2, "sawtooth", 0.1, 0.1); noise(0.2, "lowpass", 600, 200, 0.4, 0.25);   // trip… THUD
        word(TEXT.oops, true);
        missPips[missN].classList.add("on");
        missN++;
        if (missN >= MISSES) { done = true; ctx.lose(); ctx.later(showAnswer, 500); return; }
        ctx.later(() => { floor.classList.remove("trip"); w.b.classList.remove("bad"); busy = false; }, 900);
      }
      function showAnswer() { waiting.forEach((x) => x.b.classList.add(x.o.right ? "right" : "dim")); ctx.say(st.answer); }
      function note(x, y) {
        const n = document.createElement("div");
        n.className = "cg-note"; n.textContent = Math.random() < 0.5 ? "🎵" : "🎶";
        n.style.left = `${x}px`; n.style.top = `${y}px`;
        fx.appendChild(n);
        ctx.later(() => n.remove(), 1200);
      }
      function word(text, bad, x = W / 2, y = H * 0.12) {
        const el = document.createElement("div");
        el.className = "cg-word" + (bad ? " bad" : "");
        el.textContent = text;
        el.style.left = `${x}px`; el.style.top = `${Math.max(30, y)}px`;
        fx.appendChild(el);
        ctx.later(() => el.remove(), 1000);
      }
      function replay() { if (!done) ctx.say(st.prompt); }

      ctx.onTimeout(() => { done = true; floor.classList.add("trip"); showAnswer(); });
      function onKey(e) {
        const i = parseInt(e.key, 10) - 1;
        if (i >= 0 && i < waiting.length) { e.preventDefault(); pick(waiting[i]); }
        else if (e.key === " ") { e.preventDefault(); replay(); }
      }
      document.addEventListener("keydown", onKey);

      deal();
      layout();
      const ro = new ResizeObserver(layout);
      ro.observe(floor);
      ctx.say(st.prompt);
      ctx.reveal(card);

      // Tutorial: for each target, point at the card, then tap the dancer holding it.
      ctx.tutorial(S.map((s) => s.target), async (f) => {
        for (let n = 0; n < GOAL && !done; n++) {
          await f.until(() => !busy && si === n, 3000);
          await f.point(card, n ? 450 : 900);
          await f.tap(() => (waiting.find((x) => x.o.right) || waiting[0]).b);
          await f.until(() => hits > n || done, 2000);
        }
      });
      return () => { done = true; ro.disconnect(); document.removeEventListener("keydown", onKey); };
    },
  });
})();
