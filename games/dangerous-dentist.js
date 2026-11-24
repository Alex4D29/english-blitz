// DANGEROUS DENTIST — a gap game (Claude's idea, named by the teacher; `Core.gapSteps`, like Robot Repair). A
// giant grinning monster opens wide: its top teeth spell the word, with one tooth missing (a dark gap). The
// picture is on the dentist's poster. Letter teeth wait on the dentist's tray: tap the right one and it pops
// into the gap, the smile sparkles (SPARKLY!), the monster says the word, then a beat and the next word. A
// wrong tooth wobbles, falls out, and the monster CHOMPs (and lisps: THILLY!). Fix 3 smiles; 3 chomps lose.
(function () {
  const TEXT = {
    name: { en: "Dangerous Dentist" },
    icon: "🦷",
    howTo: { en: {
      steps: [
        ["😁", "The monster's teeth spell a word, but one tooth is missing!"],
        ["👂", "Look at the picture and listen to the word."],
        ["🦷", "Tap the tooth with the missing letter. Fix 3 smiles!"],
      ],
      tips: ["A wrong tooth falls out and the monster goes CHOMP! 3 chomps and it's over.", "Sight words show the whole word first: watch which tooth pops out!", "Tap the poster to hear the word again."],
    } },
    instruction: { en: "FIX THE\nSMILE!" },
    posterLabel: "The poster. Tap to hear it again.",
    toothLabel: (t) => `Tooth ${t}`,
    sparkly: ["SPARKLY!", "SHINY!", "BEAUTIFUL!"],
    chomp: "CHOMP!",
    lisp: ["THILLY!", "WOBBLY!", "OOPTH!"],
  };
  const GOAL = 3, MISSES = 3, BEAT_MS = 900;

  const CSS = `
  .dd { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:6px; padding-bottom:6px; }
  .dd-top { flex:none; display:flex; gap:12px; align-items:center; }
  .dd-pips { display:flex; gap:4px; }
  .dd-pip { width:24px; height:24px; border:3px solid #111; border-radius:50%; background:#fff; display:flex; align-items:center; justify-content:center; font-size:13px; line-height:1; }
  .dd-pip.on { background:#bff0ff; } .dd-pip.on::after { content:"✨"; } .dd-pip.x { background:#ff5a6e; } .dd-pip.x::after { content:"✕"; color:#fff; font-weight:900; }
  .dd-room { position:relative; flex:1; min-height:0; width:100%; max-width:620px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111;
    background:linear-gradient(180deg, #d9f4ff 0 76%, #9fd8c8 76%); }
  .dd-room::before { content:""; position:absolute; inset:0; background:linear-gradient(90deg, rgba(255,255,255,.4) 0 2px, transparent 2px) 0 0 / 46px 46px, linear-gradient(rgba(255,255,255,.4) 0 2px, transparent 2px) 0 0 / 46px 46px; }
  /* The poster with the picture (tap: hear the word) */
  .dd-poster { position:absolute; right:10px; top:10px; width:calc(var(--fz) * .34); aspect-ratio:.8; background:#fff; border:4px solid #111; border-radius:8px; box-shadow:0 4px 0 #111; z-index:3;
    display:flex; align-items:center; justify-content:center; font-size:calc(var(--fz) * .2); line-height:1; cursor:pointer; touch-action:manipulation; transform:rotate(4deg); }
  .dd-poster::before { content:""; position:absolute; left:50%; top:-8px; width:12px; height:12px; margin-left:-6px; border-radius:50%; background:#e8173c; border:2px solid #111; }
  /* The monster (--fz): a big head, angry brows, googly eyes, a HUGE mouth with the word on its top teeth */
  .dd-mon { position:absolute; left:50%; top:4%; width:var(--fz); height:calc(var(--fz) * .82); margin-left:calc(var(--fz) / -2); z-index:2; }
  .dd-mon > * { position:absolute; box-sizing:border-box; }
  .dd-head { inset:0; background:#7a4fe0; border:5px solid #111; border-radius:46% 46% 42% 42%; box-shadow:inset calc(var(--fz) * -.04) calc(var(--fz) * -.03) 0 rgba(0,0,0,.15); }
  .dd-horn { top:-8%; width:12%; height:18%; background:#ffe9a8; border:4px solid #111; clip-path:polygon(50% 0, 100% 100%, 0 100%); }
  .dd-horn.l { left:18%; transform:rotate(-14deg); } .dd-horn.r { right:18%; transform:rotate(14deg); }
  .dd-eye { top:9%; width:17%; aspect-ratio:1; background:#fff; border:4px solid #111; border-radius:50%; overflow:hidden; z-index:2; }
  .dd-eye.l { left:26%; } .dd-eye.r { right:24%; width:14%; top:11%; }
  .dd-eye i { position:absolute; left:28%; top:30%; width:46%; aspect-ratio:1; background:#111; border-radius:50%; animation:dd-roll 1.3s ease-in-out infinite alternate; }
  .dd-brow { top:6%; width:20%; height:5%; background:#111; border-radius:99px; z-index:3; transition:transform .2s; }
  .dd-brow.l { left:24%; transform:rotate(16deg); } .dd-brow.r { right:22%; transform:rotate(-16deg); }
  .dd-mon.happy .dd-brow.l { transform:rotate(-12deg) translateY(-30%); } .dd-mon.happy .dd-brow.r { transform:rotate(12deg) translateY(-30%); }
  .dd-mouth { left:9%; right:9%; top:30%; height:58%; background:#5a0f1e; border:5px solid #111; border-radius:18% 18% 50% 50% / 14% 14% 60% 60%; overflow:hidden; z-index:2;
    transform-origin:50% 0; transition:transform .12s ease-in; }
  .dd-mon.chomp .dd-mouth { transform:scaleY(.18); }
  .dd-tongue { position:absolute; left:26%; right:26%; bottom:-8%; height:36%; background:#ff6f91; border-radius:50% 50% 0 0; }
  .dd-teeth { position:absolute; left:3%; right:3%; top:0; height:var(--th); display:flex; gap:2%; justify-content:center; }
  .dd-tooth { flex:1; max-width:calc(var(--fz) * .16); height:100%; background:#fffdf2; border:3px solid #111; border-top:0; border-radius:0 0 40% 40% / 0 0 30% 30%;
    display:flex; align-items:center; justify-content:center; font-size:var(--tf); font-weight:900; color:#111; line-height:1; }
  .dd-tooth.gap { background:transparent; border:3px dashed rgba(255,255,255,.6); border-top:0; animation:dd-gap .5s ease-in-out infinite alternate; }
  .dd-tooth.gap::after { content:"?"; color:rgba(255,255,255,.7); }
  .dd-tooth.new { background:#fff; box-shadow:0 0 14px 4px #bff0ff; }
  .dd-tooth.answer { background:#ffe066; } .dd-tooth.new::after, .dd-tooth.answer::after { content:none; }
  .dd-bottom { position:absolute; left:16%; right:16%; bottom:3%; height:12%; display:flex; gap:6%; justify-content:center; }
  .dd-bottom i { flex:1; background:#fffdf2; border:3px solid #111; border-bottom:0; border-radius:40% 40% 0 0; }
  /* The dentist's tray of teeth (--kz) */
  .dd-tray { position:absolute; left:50%; bottom:3%; transform:translateX(-50%); display:flex; gap:10px; padding:8px 14px; background:#c4ccd6; border:4px solid #111; border-radius:14px;
    box-shadow:0 5px 0 #111; z-index:4; }
  .dd-opt { width:var(--kz); height:calc(var(--kz) * 1.15); padding:0; font:inherit; color:#111; cursor:pointer; touch-action:manipulation; border:4px solid #111;
    border-radius:30% 30% 40% 40% / 24% 24% 50% 50%; background:linear-gradient(160deg, #fff 0 60%, #e9e4d0); box-shadow:0 4px 0 #111; font-size:calc(var(--kz) * .55); font-weight:900;
    display:flex; align-items:center; justify-content:center; animation:dd-in .3s cubic-bezier(.2,1.6,.4,1) both; }
  .dd-opt.used { visibility:hidden; }
  .dd-fly { position:absolute; z-index:7; pointer-events:none; display:flex; align-items:center; justify-content:center; background:#fff; border:3px solid #111; border-radius:30% 30% 40% 40%;
    font-weight:900; color:#111; line-height:1; }
  .dd-fx { position:absolute; inset:0; pointer-events:none; z-index:8; overflow:visible; }
  .dd-word { position:absolute; transform:translate(-50%, -50%) rotate(-8deg); font-size:2rem; color:#7cf0ff; -webkit-text-stroke:2px #111; paint-order:stroke fill;
    text-shadow:0 4px 0 #111; white-space:nowrap; animation:dd-word 1s ease-out forwards; }
  .dd-word.bad { color:#ff5a6e; }
  .dd-spark { position:absolute; line-height:1; pointer-events:none; }
  @keyframes dd-roll { from { transform:translate(-25%, -15%); } to { transform:translate(25%, 15%); } }
  @keyframes dd-gap { to { background:rgba(255,255,255,.12); } }
  @keyframes dd-in { from { scale:.4; opacity:0; } }
  @keyframes dd-word { from { opacity:1; scale:.5; } 25% { scale:1.15; } 75% { opacity:1; } to { opacity:0; translate:0 -40px; } }
  @media (prefers-reduced-motion: reduce) { .dd-eye i, .dd-tooth.gap, .dd-opt, .dd-word { animation:none !important; } }
  `;
  function injectCss() { if (document.getElementById("dd-css")) return; const s = document.createElement("style"); s.id = "dd-css"; s.textContent = CSS; document.head.appendChild(s); }

  registerMicrogame({
    id: "dangerous-dentist",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 16000,
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
      wrap.className = "dd";
      wrap.innerHTML = `<div class="dd-top"><div class="dd-pips hits">${'<span class="dd-pip"></span>'.repeat(GOAL)}</div><div class="dd-pips miss">${'<span class="dd-pip"></span>'.repeat(MISSES)}</div></div>` +
        '<div class="dd-room"><button class="dd-poster"></button><div class="dd-mon"><div class="dd-horn l"></div><div class="dd-horn r"></div><div class="dd-head"></div>' +
        '<div class="dd-eye l"><i></i></div><div class="dd-eye r"><i></i></div><div class="dd-brow l"></div><div class="dd-brow r"></div>' +
        '<div class="dd-mouth"><div class="dd-tongue"></div><div class="dd-teeth"></div><div class="dd-bottom"><i></i><i></i><i></i><i></i></div></div></div>' +
        '<div class="dd-tray"></div><div class="dd-fx"></div></div>';
      ctx.root.appendChild(wrap);
      const room = wrap.querySelector(".dd-room"), mon = wrap.querySelector(".dd-mon"), teethEl = wrap.querySelector(".dd-teeth"), tray = wrap.querySelector(".dd-tray");
      const poster = wrap.querySelector(".dd-poster"), fx = wrap.querySelector(".dd-fx");
      const hitPips = wrap.querySelector(".hits").children, missPips = wrap.querySelector(".miss").children;
      poster.setAttribute("aria-label", TEXT.posterLabel);
      poster.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });

      let W = 0, H = 0, fz = 260, kz = 60;
      function layout() {
        W = room.clientWidth; H = room.clientHeight;
        kz = Math.max(48, Math.min((W - 60) / N - 12, H * 0.16, 80));
        fz = Math.max(180, Math.min(W * 0.78, (H - kz * 1.15 - 50) / 0.82, 440));
        room.style.setProperty("--fz", `${fz}px`); room.style.setProperty("--kz", `${kz}px`);
        sizeTeeth();
      }
      function sizeTeeth() {
        const n = st.cells.length;
        room.style.setProperty("--th", `${fz * 0.82 * 0.58 * 0.42}px`);
        room.style.setProperty("--tf", `${Math.min(fz * 0.11, (fz * 0.72) / n * 0.62)}px`);
      }

      let teeth = [], opts = [];
      function showStep() {
        teethEl.innerHTML = "";
        teeth = st.cells.map((l) => { const t = document.createElement("div"); t.className = "dd-tooth"; t.textContent = l; teethEl.appendChild(t); return t; });
        poster.textContent = st.pic || (st.kind === "letter" ? "🔤" : "🔊");
        mon.classList.remove("happy");
        sizeTeeth();
        busy = true;
        const openGap = () => { const g = teeth[st.gap]; g.textContent = ""; g.classList.add("gap"); busy = false; };
        if (st.showFirst) {
          // Look, then cover: the whole word first, then its tooth pops out (the teacher's sight-word rule).
          ctx.pauseTimer(1500);
          ctx.later(() => {
            const g = teeth[st.gap];
            if (!reduceMotion) g.animate([{ transform: "none" }, { transform: "translateY(160%) rotate(60deg)", opacity: 0 }], { duration: 450, easing: "ease-in" });
            sweep(800, 300, 0.25, "triangle", 0.07);
            ctx.later(openGap, 430);
          }, 1050);
        } else openGap();
        if (st.prompt) ctx.say(st.prompt);
        tray.innerHTML = "";
        opts = ctx.shuffle(st.options.slice()).map((l, i) => {
          const b = document.createElement("button");
          b.className = "dd-opt";
          b.style.animationDelay = `${i * 0.05}s`;
          b.textContent = l;
          b.setAttribute("aria-label", TEXT.toothLabel(l));
          b.addEventListener("pointerdown", (e) => { e.preventDefault(); pick(b, l); });
          tray.appendChild(b);
          return { b, l };
        });
      }

      function pick(b, l) {
        if (done || busy || ctx.ended) return;
        busy = true;
        // The tooth flies up into the gap.
        const g = teeth[st.gap].getBoundingClientRect(), rr = room.getBoundingClientRect(), br = b.getBoundingClientRect();
        const fly = document.createElement("div");
        fly.className = "dd-fly";
        fly.textContent = l;
        fly.style.left = `${br.left - rr.left}px`; fly.style.top = `${br.top - rr.top}px`;
        fly.style.width = `${br.width}px`; fly.style.height = `${br.height}px`; fly.style.fontSize = `${kz * 0.55}px`;
        fx.appendChild(fly);
        b.classList.add("used");
        fly.animate([{ transform: "none" }, { transform: `translate(${g.left - br.left + (g.width - br.width) / 2}px, ${g.top - br.top + (g.height - br.height) / 2}px) scale(${Math.min(g.width / br.width, g.height / br.height).toFixed(3)})` }],
          { duration: reduceMotion ? 1 : 380, easing: "ease-in-out", fill: "forwards" });
        sweep(400, 1000, 0.2, "triangle", 0.06);
        ctx.later(() => { fly.remove(); if (l === st.answer) sparkly(); else wobbly(b, l); }, reduceMotion ? 20 : 390);
      }
      function sparkly() {
        const g = teeth[st.gap];
        g.classList.remove("gap"); g.classList.add("new");
        g.textContent = st.answer;
        mon.classList.add("happy");
        hitPips[hits].classList.add("on");
        hits++;
        [1319, 1568, 1976].forEach((f, k) => tone(f, 0.12, "sine", 0.08, k * 0.08));   // ting ting ting
        sparks(g);
        word(TEXT.sparkly[(hits - 1) % TEXT.sparkly.length], false);
        ctx.say(st.say);
        if (hits >= GOAL) { done = true; ctx.win(); ctx.confetti(fx, W / 2, H * 0.3, { count: 80 }); return; }
        ctx.later(() => {
          ctx.pauseTimer(BEAT_MS);
          st = S[++si];
          tone(98, 0.08, "square", 0.1); tone(147, 0.08, "square", 0.1, 0.16);
          showStep();
        }, 1100);
      }
      // A wrong tooth: it wobbles, drops out, and the monster CHOMPs (with a lisp).
      function wobbly(b, l) {
        const g = teeth[st.gap];
        g.classList.remove("gap");
        g.textContent = l;
        g.style.background = "#fff";
        g.animate([{ rotate: "0deg" }, { rotate: "-14deg" }, { rotate: "14deg" }, { rotate: "-10deg" }, { rotate: "0deg" }], { duration: 400 });
        ctx.later(() => {
          g.animate([{ transform: "none" }, { transform: "translateY(260%) rotate(120deg)", opacity: 0 }], { duration: reduceMotion ? 1 : 400, easing: "ease-in" });
          ctx.later(() => { g.textContent = ""; g.style.background = ""; g.classList.add("gap"); }, 400);
          mon.classList.add("chomp");
          noise(0.08, "lowpass", 900, 300, 0.5); tone(120, 0.12, "square", 0.12);   // CHOMP
          word(TEXT.chomp, true);
          ctx.later(() => { mon.classList.remove("chomp"); word(TEXT.lisp[missN % TEXT.lisp.length], true, W / 2, H * 0.62); }, 300);
          missPips[missN].classList.add("x");
          missN++;
          if (missN >= MISSES) { done = true; ctx.lose(); ctx.later(showAnswer, 500); return; }
          ctx.later(() => { busy = false; }, 700);   // (that tooth stays gone from the tray, like a cut wire)
        }, 420);
      }
      function showAnswer() { const g = teeth[st.gap]; g.classList.remove("gap"); g.classList.add("answer"); g.textContent = st.answer; ctx.say(st.say); }
      function sparks(el) {
        if (reduceMotion) return;
        const r = el.getBoundingClientRect(), rr = room.getBoundingClientRect();
        for (let k = 0; k < 6; k++) {
          const s = document.createElement("div");
          s.className = "dd-spark"; s.textContent = "✨"; s.style.fontSize = `${fz * 0.07}px`;
          s.style.left = `${r.left - rr.left + r.width / 2}px`; s.style.top = `${r.top - rr.top + r.height / 2}px`;
          fx.appendChild(s);
          const a = (k / 6) * Math.PI * 2;
          s.animate([{ transform: "translate(-50%,-50%) scale(.4)" }, { transform: `translate(calc(-50% + ${Math.cos(a) * 50}px), calc(-50% + ${Math.sin(a) * 50}px)) scale(1)`, opacity: 0 }], { duration: 600, fill: "forwards" });
          ctx.later(() => s.remove(), 620);
        }
      }
      function word(text, bad, x = W / 2, y = 34) {
        const w = document.createElement("div");
        w.className = "dd-word" + (bad ? " bad" : "");
        w.textContent = text;
        w.style.left = `${x}px`; w.style.top = `${y}px`;
        fx.appendChild(w);
        ctx.later(() => w.remove(), 1000);
      }
      function replay() { if (!done && st.prompt) ctx.say(st.prompt); }

      ctx.onTimeout(() => { done = true; showAnswer(); });
      function onKey(e) {
        const i = parseInt(e.key, 10) - 1;
        if (i >= 0 && i < opts.length) { e.preventDefault(); pick(opts[i].b, opts[i].l); }
        else if (e.key === " ") { e.preventDefault(); replay(); }
      }
      document.addEventListener("keydown", onKey);

      layout();
      const ro = new ResizeObserver(layout);
      ro.observe(room);
      showStep();

      // Tutorial: for each word, point at the gap, then tap the right tooth.
      ctx.tutorial(S.map((s) => s.target), async (f) => {
        for (let n = 0; n < GOAL && !done; n++) {
          await f.until(() => !busy && si === n, 4000);
          await f.point(() => teeth[st.gap], 600);
          await f.tap(() => (opts.find((o) => o.l === st.answer) || opts[0]).b);
          await f.until(() => hits > n || done, 2500);
        }
      });
      return () => { done = true; ro.disconnect(); document.removeEventListener("keydown", onKey); };
    },
  });
})();
