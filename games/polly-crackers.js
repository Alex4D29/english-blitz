// POLLY'S CRACKERS — a listening game (made up by Claude when the teacher asked for "a new listening game with
// a silly theme"). A greedy pirate parrot on its perch squawks what it wants ("SQUAWK! B!"): only heard, never
// shown (unless listening games are off). A plate of crackers below, each with an option. Tap the right
// cracker: the parrot swoops on it, CRUNCH, crumbs everywhere, and it squawks for the next one (a new target
// each time). A wrong one: it spits it out, BLEH!, feathers fly. 3 crackers and it does a happy dance;
// 3 wrong ones and it flies off in a huff.
(function () {
  const TEXT = {
    name: { en: "Polly's Crackers" },
    icon: "🦜",
    howTo: (list) => ({ en: {
      steps: [
        ["👂", "Listen! The parrot squawks what it wants."],
        ["🍪", "Tap the cracker with what you heard. CRUNCH!"],
        ["🔁", "Then it wants another one. Feed it 3 crackers!"],
      ],
      tips: [
        "Tap the parrot to hear it again.",
        "A wrong cracker and BLEH! It spits it out. Three of those and it flies off.",
        "When the game speeds up, there are more crackers.",
      ],
    } }),
    instruction: { en: "FEED THE\nPARROT!" },
    parrotLabel: "Parrot. Tap to hear it again.",
    crackerLabel: (t) => `Cracker ${t}`,
    crunch: ["CRUNCH!", "YUM!", "NOM NOM!"],
    bleh: "BLEH!",
    squawk: "SQUAWK!",
    listen: "🔊",
  };
  const GOAL = 3, MISSES = 3;

  const CSS = `
  .pa { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:6px; padding-bottom:8px; }
  .pa-pips { flex:none; display:flex; gap:14px; align-items:center; min-height:30px; }
  .pa-row { display:flex; gap:5px; }
  .pa-pip { width:24px; height:24px; border:3px solid #111; border-radius:50%; background:#fff; display:flex; align-items:center; justify-content:center; font-size:13px; line-height:1; }
  .pa-pip.on { background:#ffd400; } .pa-pip.on::after { content:"🍪"; }
  .pa-pip.x.on { background:#444; } .pa-pip.x.on::after { content:"✕"; color:#fff; font-weight:900; }
  /* A ship's deck: a perch at the top, a plate of crackers on a barrel below */
  .pa-deck { position:relative; flex:1; min-height:0; width:100%; max-width:560px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111;
    background:linear-gradient(180deg, #8fd3ff 0 40%, #3fa9e0 40% 48%, #b07a43 48%); }
  .pa-deck::after { content:""; position:absolute; left:0; right:0; top:48%; bottom:0; background:repeating-linear-gradient(90deg, transparent 0 60px, rgba(0,0,0,.15) 60px 64px); }   /* deck planks */
  .pa-perch { position:absolute; left:50%; top:var(--perch); width:calc(var(--pz) * 1.3); height:12px; transform:translateX(-50%); background:#6b4a2b; border:4px solid #111; border-radius:6px; z-index:2; }
  /* The parrot: --pz is its size. Red and round, green wings, a big curved yellow beak, googly eyes, an eye patch */
  .pa-parrot { position:absolute; left:50%; top:var(--perch); width:var(--pz); height:var(--pz); margin:calc(var(--pz) * -.92) 0 0 calc(var(--pz) * -.5); z-index:3; cursor:pointer; will-change:transform; }
  .pa-in { position:absolute; inset:0; transform-origin:50% 100%; animation:pa-bob .8s ease-in-out infinite alternate; }
  .pa-body { position:absolute; left:22%; right:22%; top:30%; bottom:2%; background:#e8173c; border:4px solid #111; border-radius:46% 46% 40% 40%; }
  .pa-head { position:absolute; left:20%; right:20%; top:2%; height:46%; background:#e8173c; border:4px solid #111; border-radius:50%; z-index:2; }
  .pa-wing { position:absolute; top:42%; width:24%; height:42%; background:#1f9d3a; border:4px solid #111; border-radius:50% 50% 40% 40%; z-index:1; transform-origin:50% 10%; }
  .pa-wing.l { left:12%; transform:rotate(14deg); } .pa-wing.r { right:12%; transform:rotate(-14deg); }
  .pa-eye { position:absolute; top:14%; width:22%; aspect-ratio:1; background:#fff; border:3px solid #111; border-radius:50%; z-index:3; }
  .pa-eye.l { left:26%; } .pa-eye i { position:absolute; left:28%; top:30%; width:46%; aspect-ratio:1; background:#111; border-radius:50%; animation:pa-goggle 1.1s ease-in-out infinite; }
  .pa-patch { position:absolute; right:26%; top:16%; width:20%; height:16%; background:#111; border-radius:40% 40% 50% 50%; z-index:3; }
  .pa-patch::before { content:""; position:absolute; left:-180%; right:-60%; top:-30%; height:16%; background:#111; transform:rotate(-12deg); }
  .pa-beak { position:absolute; left:38%; top:30%; width:26%; height:24%; background:#ffc400; border:4px solid #111; border-radius:20% 80% 60% 40%; z-index:4; transform-origin:30% 20%; }
  .pa-parrot.squawk .pa-beak { animation:pa-beak .1s ease-in-out 6 alternate; }
  .pa-parrot.eat .pa-in { animation:pa-peck .3s ease-in-out 2; }
  .pa-parrot.bleh .pa-in { animation:pa-shake .1s linear 6; }
  .pa-parrot.dance .pa-in { animation:pa-dance .35s ease-in-out infinite alternate; }
  .pa-parrot.dance .pa-wing.l { animation:pa-flapl .2s ease-in-out infinite alternate; } .pa-parrot.dance .pa-wing.r { animation:pa-flapr .2s ease-in-out infinite alternate; }
  .pa-say { position:absolute; left:80%; top:-4%; padding:2px 8px; background:#fff; border:4px solid #111; border-radius:12px; font-size:calc(var(--pz) * .22); line-height:1.1; white-space:nowrap; z-index:5;
    animation:pa-pop .25s cubic-bezier(.2,1.8,.4,1) both; }
  /* The crackers on their plate: --kz is a cracker's size */
  .pa-plate { position:absolute; left:50%; bottom:6%; transform:translateX(-50%); display:flex; gap:10px; padding:10px 18px 14px; background:#f4f4f4; border:5px solid #111; border-radius:50%/40%;
    box-shadow:0 6px 0 #111; z-index:2; }
  .pa-cracker { width:var(--kz); height:var(--kz); padding:0; font:inherit; cursor:pointer; touch-action:manipulation; border:4px solid #111; border-radius:12px; color:#111;
    background:radial-gradient(circle at 25% 25%, #b07a43 0 5%, transparent 6%), radial-gradient(circle at 70% 30%, #b07a43 0 5%, transparent 6%), radial-gradient(circle at 40% 75%, #b07a43 0 5%, transparent 6%),
      radial-gradient(circle at 75% 72%, #b07a43 0 5%, transparent 6%), #f0c27a;
    box-shadow:inset 0 -6px 0 rgba(0,0,0,.12); display:flex; align-items:center; justify-content:center; animation:pa-in .3s cubic-bezier(.2,1.6,.4,1) both; }
  .pa-lbl { padding:1px 5px; background:#fff; border:3px solid #111; border-radius:8px; font-size:calc(var(--kz) * .34); line-height:1.1; white-space:nowrap; }
  .pa-cracker.gone { visibility:hidden; }
  .pa-cracker.bad { animation:pa-shake .1s linear 4; filter:grayscale(.6); }
  .pa-cracker.right { box-shadow:0 0 0 5px #fff, 0 0 0 10px #00b86b; }
  .pa-cracker.dim { opacity:.4; }
  .pa-fx { position:absolute; inset:0; pointer-events:none; z-index:8; overflow:visible; }
  .pa-pop { position:absolute; line-height:1; pointer-events:none; transform:translate(-50%, -50%); font-size:1.4rem; }
  .pa-word { position:absolute; left:50%; top:44%; transform:translate(-50%, -50%) rotate(-8deg); font-size:2.2rem; color:#ffd400; -webkit-text-stroke:2px #111; paint-order:stroke fill;
    text-shadow:0 4px 0 #111; white-space:nowrap; pointer-events:none; animation:pa-word .9s ease-out forwards; z-index:9; }
  .pa-word.bad { color:#fff; }
  @keyframes pa-bob { from { transform:rotate(-4deg); } to { transform:rotate(4deg) translateY(-3%); } }
  @keyframes pa-goggle { 0%, 100% { transform:translate(-16%, 0); } 50% { transform:translate(16%, -12%); } }
  @keyframes pa-beak { to { transform:rotate(18deg); } }
  @keyframes pa-peck { 50% { transform:translateY(12%) rotate(14deg); } }
  @keyframes pa-shake { 25% { transform:translateX(-6%) rotate(-6deg); } 75% { transform:translateX(6%) rotate(6deg); } }
  @keyframes pa-dance { from { transform:rotate(-12deg) translateY(0); } to { transform:rotate(12deg) translateY(-10%); } }
  @keyframes pa-flapl { from { transform:rotate(14deg); } to { transform:rotate(70deg); } }
  @keyframes pa-flapr { from { transform:rotate(-14deg); } to { transform:rotate(-70deg); } }
  @keyframes pa-pop { from { transform:scale(.3); } }
  @keyframes pa-in { from { scale:.5; opacity:0; } }
  @keyframes pa-word { from { opacity:1; transform:translate(-50%, -50%) rotate(-8deg) scale(.5); } 25% { transform:translate(-50%, -60%) rotate(-8deg) scale(1.15); }
    75% { opacity:1; } to { opacity:0; transform:translate(-50%, -100%) rotate(-8deg); } }
  @media (prefers-reduced-motion: reduce) { .pa-in, .pa-eye i, .pa-cracker, .pa-word, .pa-parrot.dance .pa-in { animation:none !important; } }
  `;
  function injectCss() {
    if (document.getElementById("pa-css")) return;
    const s = document.createElement("style"); s.id = "pa-css"; s.textContent = CSS; document.head.appendChild(s);
  }

  registerMicrogame({
    id: "polly-crackers",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 13000,   // 3 crackers (the beats between them don't count)
    input: "tap",
    tutorial: true,
    listening: true,   // the target is only ever heard (left out when listening games are off)

    start(ctx) {
      injectCss();
      const speed = ctx.speed || 1;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const { tone, sweep, noise } = ctx.sfx;
      const N = speed >= 2 ? 4 : 3;
      const S = ctx.choiceSteps(GOAL, N, { lowercase: true });
      let C = S[0];

      const wrap = document.createElement("div");
      wrap.className = "pa";
      const pips = document.createElement("div");
      pips.className = "pa-pips";
      pips.innerHTML = `<div class="pa-row hits">${'<span class="pa-pip"></span>'.repeat(GOAL)}</div><div class="pa-row">${'<span class="pa-pip x"></span>'.repeat(MISSES)}</div>`;
      const deck = document.createElement("div");
      deck.className = "pa-deck";
      deck.innerHTML = '<div class="pa-perch"></div>';
      const parrot = document.createElement("div");
      parrot.className = "pa-parrot";
      parrot.setAttribute("role", "button");
      parrot.setAttribute("aria-label", TEXT.parrotLabel);
      parrot.innerHTML = '<div class="pa-in"><div class="pa-wing l"></div><div class="pa-wing r"></div><div class="pa-body"></div><div class="pa-head"></div>' +
        '<div class="pa-eye l"><i></i></div><div class="pa-patch"></div><div class="pa-beak"></div></div>';
      parrot.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });
      const plate = document.createElement("div");
      plate.className = "pa-plate";
      const fx = document.createElement("div");
      fx.className = "pa-fx";
      deck.append(parrot, plate, fx);
      wrap.append(pips, deck);
      ctx.root.appendChild(wrap);

      // ---------- Layout ----------
      let W = 0, H = 0, pz = 100, kz = 70;
      function layout() {
        W = deck.clientWidth; H = deck.clientHeight;
        pz = Math.max(80, Math.min(H * 0.42, W * 0.36, 170));
        kz = Math.max(56, Math.min((W - 60) / N - 12, H * 0.22, 100));
        deck.style.setProperty("--pz", `${pz}px`);
        deck.style.setProperty("--kz", `${kz}px`);
        deck.style.setProperty("--perch", `${Math.max(pz * 0.95, H * 0.42)}px`);
      }
      // The parrot squawks what it wants: a squawk, then the voice says it (a 🔊 bubble; the target itself when
      // listening games are off).
      function squawk() {
        parrot.classList.remove("squawk"); void parrot.offsetWidth; parrot.classList.add("squawk");
        sweep(1400, 2200, 0.12, "sawtooth", 0.06); sweep(2000, 1300, 0.12, "sawtooth", 0.05, 0.12); // SQUAWK
        parrot.querySelector(".pa-say")?.remove();
        const b = document.createElement("div");
        b.className = "pa-say";
        b.textContent = ctx.canSpeak ? TEXT.listen : C.cardText;
        parrot.appendChild(b);
        ctx.later(() => ctx.say(C.prompt), 260);
      }

      let crackers = [];
      function deal() {
        plate.innerHTML = "";
        crackers = ctx.shuffle(C.row.slice()).map((o, i) => {
          const b = document.createElement("button");
          b.className = "pa-cracker";
          b.style.animationDelay = `${i * 0.05}s`;
          b.setAttribute("aria-label", TEXT.crackerLabel(o.spoken));
          b.innerHTML = '<span class="pa-lbl"></span>';
          b.firstChild.textContent = o.text;
          if (o.kind === "word") b.firstChild.style.fontSize = `${Math.min(kz * 0.3, (kz * 0.82) / (o.text.length * 0.6))}px`;
          b.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); pick(b, o); });
          plate.appendChild(b);
          return { b, o };
        });
      }

      let hits = 0, misses = 0, done = false, busy = false;
      function pick(b, o) {
        if (done || busy || ctx.ended) return;
        busy = true;
        if (o.right) crunch(b, o); else bleh(b);
      }
      // It swoops down onto the cracker, gobbles it up (crumbs), and flies back to its perch.
      function crunch(b, o) {
        const d = deck.getBoundingClientRect(), r = b.getBoundingClientRect();
        const to = { x: r.left - d.left + r.width / 2 - W / 2, y: r.top - d.top - parseFloat(getComputedStyle(deck).getPropertyValue("--perch")) + pz * 0.2 };
        parrot.animate([{ transform: "translate(0, 0)" }, { transform: `translate(${to.x}px, ${to.y}px)`, offset: 0.45 }, { transform: `translate(${to.x}px, ${to.y}px)`, offset: 0.6 }, { transform: "translate(0, 0)" }],
          { duration: reduceMotion ? 1 : 900, easing: "ease-in-out" });
        ctx.later(() => {
          b.classList.add("gone");
          parrot.classList.remove("eat"); void parrot.offsetWidth; parrot.classList.add("eat");
          [0, 0.1, 0.2].forEach((t) => noise(0.06, "bandpass", 2400, 1600, 0.3, t)); // crunch crunch crunch
          for (let k = 0; k < 6; k++) crumb(r.left - d.left + r.width / 2, r.top - d.top + r.height / 2);
          word(TEXT.crunch[hits % 3], false);
          if (o.kind === "pic") ctx.say(o.spoken);
        }, reduceMotion ? 10 : 410);
        pips.querySelector(".hits").children[hits].classList.add("on");
        hits++;
        if (hits >= GOAL) {
          done = true; ctx.win();
          ctx.later(() => {
            parrot.classList.add("dance");
            [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, "triangle", 0.1, i * 0.08));
            ctx.confetti(fx, W / 2, H * 0.3, { count: 90 });
            ctx.say(C.answer);
          }, 950);
          return;
        }
        // The beat: the clock stops; it squawks for the next one, and the plate is refilled.
        ctx.later(() => {
          if (done) return;
          ctx.pauseTimer(1000);
          C = S[hits];
          deal();
          squawk();
          ctx.later(() => { busy = false; }, 300);
        }, 1000);
      }
      function bleh(b) {
        b.classList.add("bad");
        parrot.classList.remove("bleh"); void parrot.offsetWidth; parrot.classList.add("bleh");
        sweep(300, 900, 0.12, "sawtooth", 0.1); noise(0.12, "bandpass", 1200, 600, 0.3); // BLEH
        word(TEXT.bleh, true);
        const d = deck.getBoundingClientRect(), p = parrot.getBoundingClientRect();
        for (let k = 0; k < 4; k++) feather(p.left - d.left + p.width / 2, p.top - d.top + p.height / 2);
        pips.children[1].children[misses].classList.add("on");
        misses++;
        if (misses >= MISSES) {
          done = true; ctx.lose();
          parrot.animate([{ transform: "translate(0, 0)" }, { transform: `translate(${W * 0.7}px, ${-H * 0.6}px) rotate(20deg)` }], { duration: reduceMotion ? 1 : 900, easing: "ease-in", fill: "forwards" }); // off in a huff
          ctx.later(() => { crackers.forEach((x) => x.b.classList.add(x.o.right ? "right" : "dim")); ctx.say(C.answer); }, 500);
          return;
        }
        ctx.later(() => { b.classList.add("gone"); busy = false; }, 600);
      }
      function crumb(x, y) {
        const c = document.createElement("div");
        c.className = "pa-pop"; c.textContent = "🟫"; c.style.fontSize = "10px";
        c.style.left = `${x}px`; c.style.top = `${y}px`;
        fx.appendChild(c);
        const a = Math.random() * 6.28, r = 30 + Math.random() * 40;
        c.animate([{ transform: "translate(-50%, -50%)" }, { transform: `translate(calc(-50% + ${Math.cos(a) * r}px), calc(-50% + ${Math.sin(a) * r + 30}px))`, opacity: 0 }], { duration: 600, fill: "forwards" });
        ctx.later(() => c.remove(), 620);
      }
      function feather(x, y) {
        const f = document.createElement("div");
        f.className = "pa-pop"; f.textContent = "🪶";
        f.style.left = `${x}px`; f.style.top = `${y}px`;
        fx.appendChild(f);
        const a = Math.random() * 6.28, r = 40 + Math.random() * 50;
        f.animate([{ transform: "translate(-50%, -50%)" }, { transform: `translate(calc(-50% + ${Math.cos(a) * r}px), calc(-50% + ${Math.sin(a) * r + 40}px)) rotate(200deg)`, opacity: 0 }], { duration: 900, fill: "forwards" });
        ctx.later(() => f.remove(), 920);
      }
      function word(text, bad) {
        const w = document.createElement("div");
        w.className = "pa-word" + (bad ? " bad" : "");
        w.textContent = text;
        fx.appendChild(w);
        ctx.later(() => w.remove(), 900);
      }
      function replay() { if (!done) squawk(); }

      ctx.onTimeout(() => { done = true; parrot.classList.add("bleh"); crackers.forEach((x) => { if (!x.b.classList.contains("gone")) x.b.classList.add(x.o.right ? "right" : "dim"); }); ctx.say(C.answer); });
      function onKey(e) {
        const i = parseInt(e.key, 10) - 1;
        if (i >= 0 && i < crackers.length) { e.preventDefault(); pick(crackers[i].b, crackers[i].o); }
        else if (e.key === " ") { e.preventDefault(); replay(); }
      }
      document.addEventListener("keydown", onKey);

      deal();
      layout();
      const ro = new ResizeObserver(layout);
      ro.observe(deck);
      squawk();

      // Tutorial: point at the parrot (listen!), then tap the right cracker each time.
      ctx.tutorial(S.map((s) => s.target), async (f) => {
        await f.point(parrot, 900);
        for (let n = 0; n < GOAL && !done; n++) {
          await f.until(() => !busy && hits === n, 4000);
          if (n) await f.point(parrot, 500);
          await f.tap(() => (crackers.find((x) => x.o.right) || crackers[0]).b);
          await f.until(() => hits > n || done, 2500);
        }
      });
      return () => { done = true; ro.disconnect(); document.removeEventListener("keydown", onKey); };
    },
  });
})();
