// ROCKET FIX — a gap game (the teacher's idea; Core.gapSteps). A rocket on its launch pad is built from letter
// sections, read top to bottom: the nose cone, the body, the tail with fins (c / a / t), with one section
// missing (dashed). Spare sections float about beside it: tap the right one and it clicks into place, then
// 3-2-1… BLAST OFF (flames, smoke, it zooms up) and a new rocket rolls in. A wrong section fizzles and the
// rocket wobbles (✕). 3 launches win; 2 fizzles and you lose (it's dramatic: one mistake allowed).
(function () {
  const TEXT = {
    name: { en: "Rocket Fix" },
    icon: "🚀",
    howTo: { en: {
      steps: [
        ["🚀", "The rocket is made of letters, top to bottom. One piece is missing!"],
        ["👂", "Look at the picture and listen to the word."],
        ["👆", "Tap the piece that fixes the word: 3, 2, 1… BLAST OFF! Launch 3 rockets!"],
      ],
      tips: ["A wrong piece fizzles. Two fizzles and it's over!", "Sight words show the whole word first: watch which letter flies out!"],
    } },
    instruction: { en: "FIX THE\nROCKET!" },
    count: ["3", "2", "1"],
    blast: "BLAST OFF!",
    fizz: "FIZZLE!",
    missing: "What's missing?",
  };
  const GOAL = 3, MISSES = 2, BEAT_MS = 900;
  const COLORS = ["#e8173c", "#ffffff", "#2f8fe0", "#ffd400", "#4dd36b", "#b04dff"];

  const CSS = `
  .rk { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:6px; padding-bottom:6px; }
  .rk-top { flex:none; display:flex; gap:10px; }
  .rk-pips { display:flex; gap:4px; }
  .rk-pip { width:24px; height:24px; border:3px solid #111; border-radius:50%; background:#fff; display:flex; align-items:center; justify-content:center; font-size:13px; line-height:1; }
  .rk-pip.on { background:#ffd400; } .rk-pip.on::after { content:"🚀"; } .rk-pip.x { background:#ff5a6e; } .rk-pip.x::after { content:"✕"; color:#fff; }
  .rk-sky { position:relative; flex:1; min-height:0; width:100%; max-width:600px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111;
    background:radial-gradient(circle at 20% 20%, #fff 0 1px, transparent 2px) 0 0 / 60px 50px, radial-gradient(circle at 70% 60%, #fff 0 1.5px, transparent 2.5px) 0 0 / 90px 70px,
      linear-gradient(#1b1f4d, #3b3f8f 70%, #6b5fb0); }
  .rk-pad { position:absolute; left:34%; bottom:0; width:calc(var(--sw) * 1.8); height:6%; transform:translateX(-50%); background:#666; border:4px solid #111; border-bottom:0; border-radius:8px 8px 0 0; }
  .rk-moon { position:absolute; right:8%; top:6%; font-size:2.4rem; }
  .rk-pic { position:absolute; right:8%; top:30%; padding:6px 12px; background:#fff; border:4px solid #111; border-radius:18px; font-size:calc(var(--sh) * 1.1); line-height:1; z-index:2; }
  .rk-rocket { position:absolute; left:34%; bottom:6%; width:var(--sw); transform:translateX(-50%); display:flex; flex-direction:column; align-items:center; z-index:3; }
  .rk-sec { position:relative; width:100%; height:var(--sh); margin-top:-4px; display:flex; align-items:center; justify-content:center; border:4px solid #111; background:var(--c);
    font-size:calc(var(--sh) * .6); font-weight:900; color:#111; line-height:1; }
  .rk-sec b { background:#fff; border:3px solid #111; border-radius:50%; width:calc(var(--sh) * .8); height:calc(var(--sh) * .8); display:flex; align-items:center; justify-content:center; }
  .rk-sec.nose { border-radius:50% 50% 8% 8% / 80% 80% 20% 20%; height:calc(var(--sh) * 1.3); }
  .rk-sec.tail::before, .rk-sec.tail::after { content:""; position:absolute; bottom:-4px; width:40%; height:90%; background:#e8173c; border:4px solid #111; z-index:-1; }
  .rk-sec.tail::before { left:-30%; clip-path:polygon(100% 0, 100% 100%, 0 100%); } .rk-sec.tail::after { right:-30%; clip-path:polygon(0 0, 100% 100%, 0 100%); }
  .rk-sec.gap { background:rgba(255,255,255,.2); border-style:dashed; border-color:#fff; animation:rk-gap .5s ease-in-out infinite alternate; }
  .rk-sec.gap b { visibility:hidden; }
  .rk-sec.answer b { box-shadow:0 0 0 5px #ffd400, 0 0 18px 8px #ffd400; }
  .rk-flame { position:absolute; left:50%; top:100%; transform:translateX(-50%); font-size:calc(var(--sh) * 1.1); line-height:1; display:none; animation:rk-flame .1s steps(2) infinite; }
  .rk-rocket.go .rk-flame { display:block; }
  .rk-rocket.wobble { animation:rk-wobble .15s linear 4; }
  /* The spare sections floating about */
  .rk-spare { position:absolute; left:0; top:0; width:calc(var(--sw) * .9); height:calc(var(--sh) * .9); border:4px solid #111; border-radius:10px; background:var(--c); display:flex; align-items:center;
    justify-content:center; cursor:pointer; touch-action:manipulation; z-index:4; animation:rk-float 1.6s ease-in-out infinite alternate; }
  .rk-spare b { background:#fff; border:3px solid #111; border-radius:50%; width:calc(var(--sh) * .72); height:calc(var(--sh) * .72); display:flex; align-items:center; justify-content:center;
    font-size:calc(var(--sh) * .52); font-weight:900; line-height:1; color:#111; }
  .rk-spare.used { visibility:hidden; }
  .rk-fx { position:absolute; inset:0; pointer-events:none; z-index:8; overflow:visible; }
  .rk-word { position:absolute; left:50%; top:30%; transform:translate(-50%, -50%); font-size:2.6rem; color:#ffd400; -webkit-text-stroke:2px #111; paint-order:stroke fill;
    text-shadow:0 5px 0 #111; white-space:nowrap; animation:rk-word .8s ease-out forwards; }
  .rk-word.bad { color:#ff9f43; }
  .rk-smoke { position:absolute; font-size:2rem; line-height:1; pointer-events:none; }
  @keyframes rk-gap { to { background:rgba(255,230,120,.35); } }
  @keyframes rk-flame { 50% { transform:translateX(-50%) scale(1.25, .8); } }
  @keyframes rk-wobble { 25% { rotate:-6deg; } 75% { rotate:6deg; } }
  @keyframes rk-float { from { translate:0 -6px; rotate:-4deg; } to { translate:0 6px; rotate:4deg; } }
  @keyframes rk-word { from { opacity:1; scale:.4; } 30% { scale:1.2; } 80% { opacity:1; } to { opacity:0; scale:1; } }
  @media (prefers-reduced-motion: reduce) { .rk-sec.gap, .rk-spare, .rk-flame, .rk-word { animation:none !important; } }
  `;
  function injectCss() { if (document.getElementById("rk-css")) return; const s = document.createElement("style"); s.id = "rk-css"; s.textContent = CSS; document.head.appendChild(s); }

  registerMicrogame({
    id: "rocket-fix",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 15000, // (the countdowns and launches are beats: they don't count)
    input: "tap",
    tutorial: true,

    start(ctx) {
      injectCss();
      const speed = ctx.speed || 1;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const { tone, sweep, noise } = ctx.sfx;
      const N = speed >= 1.75 ? 4 : 3;
      const S = ctx.gapSteps(GOAL, N, { lowercase: true });
      let si = 0, st = S[0], hits = 0, missN = 0, done = false, busy = true;

      const wrap = document.createElement("div");
      wrap.className = "rk";
      wrap.innerHTML = `<div class="rk-top"><div class="rk-pips hits">${'<span class="rk-pip"></span>'.repeat(GOAL)}</div><div class="rk-pips miss">${'<span class="rk-pip"></span>'.repeat(MISSES)}</div></div>` +
        '<div class="rk-sky"><div class="rk-moon">🌙</div><div class="rk-pic"></div><div class="rk-pad"></div><div class="rk-rocket"></div><div class="rk-fx"></div></div>';
      ctx.root.appendChild(wrap);
      const sky = wrap.querySelector(".rk-sky"), rocket = wrap.querySelector(".rk-rocket"), pic = wrap.querySelector(".rk-pic"), fx = wrap.querySelector(".rk-fx");
      const hitPips = wrap.querySelector(".hits").children, missPips = wrap.querySelector(".miss").children;
      pic.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });

      let W = 0, H = 0, sw = 80, sh = 50;
      function layout() {
        W = sky.clientWidth; H = sky.clientHeight;
        const n = st.cells.length;
        sh = Math.max(30, Math.min((H * 0.72) / (n + 0.6), 70));
        sw = Math.min(sh * 1.7, W * 0.26);
        sky.style.setProperty("--sh", `${sh}px`); sky.style.setProperty("--sw", `${sw}px`);
        placeSpares();
      }

      let secs = [], spares = [];
      function showStep() {
        const n = st.cells.length;
        rocket.getAnimations().forEach((a) => a.cancel()); // (the last launch held it up in the sky)
        rocket.innerHTML = "";
        rocket.className = "rk-rocket";
        rocket.style.transform = "translateX(-50%)";
        secs = st.cells.map((l, i) => {
          const el = document.createElement("div");
          el.className = "rk-sec" + (i === 0 ? " nose" : i === n - 1 ? " tail" : "");
          el.style.setProperty("--c", COLORS[(i + si) % COLORS.length]);
          el.innerHTML = "<b></b>";
          el.firstChild.textContent = l;
          rocket.appendChild(el);
          return el;
        });
        rocket.insertAdjacentHTML("beforeend", '<div class="rk-flame">🔥</div>');
        pic.textContent = st.pic || (st.kind === "letter" ? "🔤" : "🔊") /* (🔤: alphabet order) */;
        spares.forEach((s) => s.el.remove());
        spares = st.options.map((l, k) => {
          const el = document.createElement("div");
          el.className = "rk-spare";
          el.style.setProperty("--c", COLORS[(k + 2) % COLORS.length]);
          el.style.animationDelay = `${-k * 0.4}s`;
          el.innerHTML = "<b></b>";
          el.firstChild.textContent = l;
          el.addEventListener("pointerdown", (e) => { e.preventDefault(); pick(sp); });
          sky.insertBefore(el, fx);
          const sp = { el, l };
          return sp;
        });
        layout();
        if (!reduceMotion && si) rocket.animate([{ transform: "translate(-50%, 120%)" }, { transform: "translateX(-50%)" }], { duration: 400, easing: "ease-out" });
        busy = true;
        const openGap = () => { secs[st.gap].classList.add("gap"); busy = false; };
        if (st.showFirst) {
          ctx.pauseTimer(1500);
          ctx.later(() => {
            if (!reduceMotion) secs[st.gap].animate([{ transform: "none" }, { transform: "translateX(160%) rotate(30deg)", opacity: 0.2 }, { transform: "none", opacity: 1 }], { duration: 460 });
            sweep(600, 1400, 0.25, "triangle", 0.07);
            ctx.later(openGap, 300);
          }, 1050);
        } else openGap();
        if (st.prompt) ctx.say(st.prompt); else if (si === 0) ctx.say(TEXT.missing);
      }
      function placeSpares() {
        // In a column on the right-hand side, under the picture.
        spares.forEach((s, k) => {
          const x = W * 0.62 + (k % 2) * sw * 1.05, y = H * 0.46 + Math.floor(k / 2) * sh * 1.25;
          s.el.style.left = `${Math.min(x, W - sw)}px`; s.el.style.top = `${Math.min(y, H - sh * 1.1)}px`;
        });
      }

      function pick(sp) {
        if (done || busy || ctx.ended || sp.el.classList.contains("used")) return;
        busy = true;
        sp.el.classList.add("used");
        const g = secs[st.gap];
        if (sp.l === st.answer) {
          g.classList.remove("gap");
          g.firstChild.textContent = st.answer;
          g.style.setProperty("--c", getComputedStyle(sp.el).getPropertyValue("--c"));
          tone(1200, 0.05, "square", 0.08); tone(600, 0.06, "square", 0.08, 0.05); // CLICK
          launch();
        } else fizzle(sp);
      }
      // 3-2-1… BLAST OFF: the clock stops for the countdown and launch.
      function launch() {
        hitPips[hits].classList.add("on");
        hits++;
        ctx.say(st.say);
        const last = hits >= GOAL;
        if (last) ctx.freezeTimer(); else ctx.pauseTimer(2300 + BEAT_MS);
        TEXT.count.forEach((c, k) => ctx.later(() => { word(c, false); tone(440, 0.12, "square", 0.08); }, 350 + k * 380));
        ctx.later(() => {
          rocket.classList.add("go");
          word(TEXT.blast, false);
          noise(1.2, "lowpass", 800, 150, 0.6); sweep(200, 1200, 1.1, "sawtooth", 0.07);
          if (!reduceMotion) rocket.animate([{ transform: "translateX(-50%)" }, { transform: "translate(-50%, 20px)", offset: 0.15 }, { transform: `translate(-50%, ${-H * 1.4}px)` }],
            { duration: 1000, easing: "cubic-bezier(.6,0,.9,.4)", fill: "forwards" });
          for (let k = 0; k < 6 && !reduceMotion; k++) {
            const s = document.createElement("div");
            s.className = "rk-smoke"; s.textContent = "💨";
            s.style.left = `${W * 0.34 + (k - 2.5) * 22}px`; s.style.top = `${H - 30}px`;
            fx.appendChild(s);
            s.animate([{ transform: "scale(.5)", opacity: 1 }, { transform: `translate(${(k - 2.5) * 30}px, -20px) scale(1.6)`, opacity: 0 }], { duration: 900, fill: "forwards" });
            ctx.later(() => s.remove(), 920);
          }
          ctx.confetti(fx, W * 0.34, H * 0.3, { count: 40 });
        }, 350 + 3 * 380);
        if (last) { ctx.later(() => { done = true; ctx.win(); }, 1700); busy = true; return; }
        ctx.later(() => {
          st = S[++si];
          tone(98, 0.08, "square", 0.1); tone(98, 0.08, "square", 0.1, 0.16);
          showStep();
        }, 2400);
      }
      function fizzle(sp) {
        missPips[missN].classList.add("x");
        missN++;
        rocket.classList.remove("wobble"); void rocket.offsetWidth; rocket.classList.add("wobble");
        noise(0.5, "highpass", 3000, 800, 0.3); sweep(600, 150, 0.5, "sawtooth", 0.07); // fzzzz…
        word(TEXT.fizz, true);
        if (!reduceMotion) sp.el.animate([{ opacity: 1 }, { opacity: 0, transform: "scale(.3) rotate(90deg)" }], { duration: 400 });
        if (missN >= MISSES) { done = true; ctx.lose(); showAnswer(); ctx.say(st.say); return; }
        ctx.later(() => { busy = false; }, 500);
      }
      function showAnswer() { const g = secs[st.gap]; g.classList.remove("gap"); g.classList.add("answer"); g.firstChild.textContent = st.answer; }
      function word(text, bad) {
        const w = document.createElement("div");
        w.className = "rk-word" + (bad ? " bad" : "");
        w.textContent = text;
        fx.appendChild(w);
        ctx.later(() => w.remove(), 800);
      }
      function replay() { if (!done && st.prompt) ctx.say(st.prompt); }

      ctx.onTimeout(() => { done = true; showAnswer(); ctx.say(st.say); });
      const ro = new ResizeObserver(layout);
      ro.observe(sky);
      showStep();

      ctx.tutorial(S.map((s) => s.target), async (f) => {
        for (let n = 0; n < GOAL && !done; n++) {
          await f.until(() => !busy && si === n, 5000);
          await f.point(rocket, 600);
          await f.tap(() => (spares.find((s) => s.l === st.answer) || spares[0]).el);
          await f.until(() => hits > n || done, 3000);
        }
      });
      return () => { done = true; ro.disconnect(); };
    },
  });
})();
