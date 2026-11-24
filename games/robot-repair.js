// ROBOT REPAIR — a gap game (the teacher's idea: choose the missing letter; Core.gapSteps). A broken robot
// slumps in a factory, sparking, with the word on its chest panel and one letter missing (c ▢ t; its head
// screen shows the picture). Letter bolts ride a conveyor belt below: tap the right one as it goes by and it
// zooms into the gap. The robot boots up (eyes light, it dances, says the word), then a beat and the next
// broken robot. A wrong bolt: ZAP, sparks, ✕. Fix 3 robots to win; 3 zaps and you lose.
(function () {
  const TEXT = {
    name: { en: "Robot Repair" },
    icon: "🔧",
    howTo: { en: {
      steps: [
        ["🤖", "The robot is broken! A letter is missing from the word on its chest."],
        ["👂", "Look at the picture and listen to the word."],
        ["🔩", "Tap the letter bolt that fixes the word. Fix 3 robots!"],
      ],
      tips: ["A wrong bolt goes ZAP! 3 zaps and it's over.", "Sight words show the whole word first: watch which letter flies out!"],
    } },
    instruction: { en: "FIX THE\nROBOT!" },
    fixed: ["BEEP BOOP!", "FIXED!", "ROBO-DANCE!"],
    zap: "ZAP!",
    missing: "What's missing?",
  };
  const GOAL = 3, MISSES = 3, BEAT_MS = 900;

  const CSS = `
  .rp { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:6px; padding-bottom:6px; }
  .rp-top { flex:none; display:flex; gap:10px; }
  .rp-pips { display:flex; gap:4px; }
  .rp-pip { width:24px; height:24px; border:3px solid #111; border-radius:50%; background:#fff; display:flex; align-items:center; justify-content:center; font-size:13px; line-height:1; }
  .rp-pip.on { background:#ffd400; } .rp-pip.on::after { content:"🤖"; } .rp-pip.x { background:#ff5a6e; } .rp-pip.x::after { content:"✕"; color:#fff; }
  .rp-fac { position:relative; flex:1; min-height:0; width:100%; max-width:600px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111;
    background:linear-gradient(180deg, #c9d3e0 0 70%, #8d99a8 70%), repeating-linear-gradient(90deg, transparent 0 60px, rgba(0,0,0,.06) 60px 64px); }
  .rp-fac::before { content:""; position:absolute; left:0; right:0; top:0; height:16px; background:repeating-linear-gradient(-45deg, #ffd400 0 14px, #111 14px 28px); }
  /* The robot (--rz) */
  .rp-bot { position:absolute; left:50%; top:20px; width:var(--rz); height:calc(var(--rz) * 1.05); margin-left:calc(var(--rz) / -2); transform-origin:50% 100%; }
  .rp-bot > * { position:absolute; box-sizing:border-box; }
  .rp-bot.broken { transform:rotate(-6deg) translateY(3%); }
  .rp-bot.dance { animation:rp-dance .3s ease-in-out infinite alternate; }
  .rp-ant { left:48%; top:0; width:4%; height:12%; background:#555; }
  .rp-ant::after { content:""; position:absolute; left:-90%; top:-50%; width:280%; aspect-ratio:1; border-radius:50%; background:#ff4d6d; border:3px solid #111; }
  .rp-bot.dance .rp-ant::after { background:#4dd36b; animation:rp-blink .2s steps(2) infinite; }
  .rp-head { left:22%; right:22%; top:10%; height:30%; background:#9fb3c8; border:5px solid #111; border-radius:16px; }
  .rp-screen { left:28%; right:28%; top:14%; height:20%; background:#1d2a3a; border:4px solid #111; border-radius:10px; display:flex; align-items:center; justify-content:center;
    font-size:calc(var(--rz) * .13); color:#7cf0ff; line-height:1; z-index:2; overflow:hidden; }
  .rp-eye { top:35%; width:9%; height:5%; background:#333; border:3px solid #111; border-radius:50%; z-index:3; }
  .rp-eye.l { left:31%; } .rp-eye.r { right:31%; }
  .rp-bot.dance .rp-eye { background:#7cf0ff; box-shadow:0 0 10px #7cf0ff; }
  .rp-body { left:12%; right:12%; top:42%; bottom:10%; background:#9fb3c8; border:5px solid #111; border-radius:18px; }
  .rp-arm { top:46%; width:12%; height:34%; background:#7f93a8; border:4px solid #111; border-radius:99px; transform-origin:50% 0; }
  .rp-arm.l { left:0; transform:rotate(14deg); } .rp-arm.r { right:0; transform:rotate(-14deg); }
  .rp-bot.dance .rp-arm.l { animation:rp-wave .3s ease-in-out infinite alternate; } .rp-bot.dance .rp-arm.r { animation:rp-wave .3s ease-in-out infinite alternate-reverse; }
  .rp-leg { bottom:0; width:12%; height:12%; background:#555; border:4px solid #111; border-radius:6px; } .rp-leg.l { left:30%; } .rp-leg.r { right:30%; }
  .rp-panel { left:18%; right:18%; top:52%; height:26%; z-index:3; display:flex; gap:4px; align-items:center; justify-content:center; background:#1d2a3a; border:4px solid #111; border-radius:10px; padding:4px; }
  .rp-cell { flex:1; max-width:calc(var(--rz) * .2); height:100%; display:flex; align-items:center; justify-content:center; background:#fff; color:#111; border:3px solid #111; border-radius:6px;
    font-size:var(--cf); font-weight:900; line-height:1; }
  .rp-cell.gap { background:#ffe066; animation:rp-gap .5s ease-in-out infinite alternate; }
  .rp-cell.gap::after { content:"?"; opacity:.5; }
  .rp-cell.filled { background:#b8ffcf; animation:none; } .rp-cell.filled::after, .rp-cell.answer::after { content:none; }
  .rp-cell.answer { background:#ffd400; animation:none; }
  .rp-spark { position:absolute; font-size:calc(var(--rz) * .14); line-height:1; pointer-events:none; z-index:6; }
  /* The conveyor belt and its bolts */
  .rp-belt { position:absolute; left:0; right:0; bottom:4%; height:var(--bz); background:repeating-linear-gradient(90deg, #333 0 18px, #444 18px 36px); border-top:5px solid #111; border-bottom:5px solid #111;
    animation:rp-belt .6s linear infinite; }
  .rp-bolt { position:absolute; left:0; bottom:calc(4% + var(--bz) * .5); width:var(--bz); height:var(--bz); margin:0 0 calc(var(--bz) / -2) calc(var(--bz) / -2); z-index:4;
    background:#c0c9d4; clip-path:polygon(25% 3%, 75% 3%, 100% 50%, 75% 97%, 25% 97%, 0 50%); display:flex; align-items:center; justify-content:center; touch-action:manipulation; cursor:pointer; }
  .rp-bolt::before { content:""; position:absolute; inset:7%; background:#e3e9f0; clip-path:inherit; }
  .rp-bolt b { position:relative; font-size:calc(var(--bz) * .52); color:#111; line-height:1; }
  .rp-bolt.right { filter:drop-shadow(0 0 8px #ffd400); }
  .rp-fx { position:absolute; inset:0; pointer-events:none; z-index:8; overflow:visible; }
  .rp-word { position:absolute; transform:translate(-50%, -50%) rotate(-8deg); font-size:1.9rem; color:#7cf0ff; -webkit-text-stroke:2px #111; paint-order:stroke fill;
    text-shadow:0 4px 0 #111; white-space:nowrap; animation:rp-word 1s ease-out forwards; }
  .rp-word.bad { color:#ff4d6d; }
  @keyframes rp-dance { from { transform:rotate(-6deg) translateY(0); } to { transform:rotate(6deg) translateY(-6%); } }
  @keyframes rp-wave { from { transform:rotate(30deg); } to { transform:rotate(150deg); } }
  @keyframes rp-blink { 50% { opacity:.3; } }
  @keyframes rp-gap { to { background:#fff6b0; } }
  @keyframes rp-belt { to { background-position:-36px 0; } }
  @keyframes rp-word { from { opacity:1; scale:.5; } 25% { scale:1.15; } 75% { opacity:1; } to { opacity:0; translate:0 -40px; } }
  @media (prefers-reduced-motion: reduce) { .rp-bot.dance, .rp-cell.gap, .rp-belt, .rp-word, .rp-bot.dance * { animation:none !important; } }
  `;
  function injectCss() { if (document.getElementById("rp-css")) return; const s = document.createElement("style"); s.id = "rp-css"; s.textContent = CSS; document.head.appendChild(s); }

  registerMicrogame({
    id: "robot-repair",
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
      const speed = ctx.speed || 1, pace = 0.6 + 0.4 * speed;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const { tone, sweep, noise } = ctx.sfx;
      const N = speed >= 1.75 ? 4 : 3;
      const S = ctx.gapSteps(GOAL, N, { lowercase: true });
      let si = 0, st = S[0], hits = 0, missN = 0, done = false, busy = true;

      const wrap = document.createElement("div");
      wrap.className = "rp";
      wrap.innerHTML = `<div class="rp-top"><div class="rp-pips hits">${'<span class="rp-pip"></span>'.repeat(GOAL)}</div><div class="rp-pips miss">${'<span class="rp-pip"></span>'.repeat(MISSES)}</div></div>` +
        '<div class="rp-fac"><div class="rp-bot broken"><div class="rp-ant"></div><div class="rp-arm l"></div><div class="rp-arm r"></div><div class="rp-leg l"></div><div class="rp-leg r"></div>' +
        '<div class="rp-body"></div><div class="rp-head"></div><div class="rp-screen"></div><div class="rp-eye l"></div><div class="rp-eye r"></div><div class="rp-panel"></div></div>' +
        '<div class="rp-belt"></div><div class="rp-fx"></div></div>';
      ctx.root.appendChild(wrap);
      const fac = wrap.querySelector(".rp-fac"), bot = wrap.querySelector(".rp-bot"), screen = wrap.querySelector(".rp-screen"), panel = wrap.querySelector(".rp-panel"), fx = wrap.querySelector(".rp-fx");
      const hitPips = wrap.querySelector(".hits").children, missPips = wrap.querySelector(".miss").children;
      screen.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });

      // ---------- Layout ----------
      let W = 0, H = 0, rz = 150, bz = 60;
      function layout() {
        W = fac.clientWidth; H = fac.clientHeight;
        bz = Math.max(52, Math.min(H * 0.18, W * 0.16, 84));
        rz = Math.max(110, Math.min(H - bz - 60, W * 0.6, 280));
        fac.style.setProperty("--rz", `${rz}px`); fac.style.setProperty("--bz", `${bz}px`);
        sizeCells();
      }
      function sizeCells() {
        const n = st.cells.length;
        fac.style.setProperty("--cf", `${Math.min(rz * 0.16, (rz * 0.56) / n)}px`);
      }

      // ---------- A robot to fix ----------
      let cells = [];
      function showStep() {
        panel.innerHTML = "";
        cells = st.cells.map((l, i) => {
          const c = document.createElement("div");
          c.className = "rp-cell";
          c.textContent = l;
          panel.appendChild(c);
          return c;
        });
        screen.textContent = st.pic || (st.kind === "letter" ? "❓" : "🔊");
        sizeCells();
        bot.className = "rp-bot broken";
        busy = true;
        const openGap = () => {
          const g = cells[st.gap];
          g.textContent = "";
          g.classList.add("gap");
          busy = false;
        };
        if (st.showFirst) {
          // Look, then cover: the whole word first, then its letter flies out (the teacher's sight-word rule).
          ctx.pauseTimer(1500);
          ctx.later(() => {
            const g = cells[st.gap];
            if (!reduceMotion) g.animate([{ transform: "none" }, { transform: "translateY(-160%) rotate(40deg) scale(.6)", opacity: 0 }], { duration: 450, easing: "ease-in" });
            sweep(600, 1400, 0.25, "triangle", 0.07);
            ctx.later(openGap, 430);
          }, 1050);
        } else openGap();
        if (st.prompt) ctx.say(st.prompt); else if (si === 0) ctx.say(TEXT.missing);
        refill();
      }

      // ---------- The belt ----------
      const bolts = [];
      let queue = [], nextGap = 0;
      function refill() {
        // About every other bolt is the right letter.
        const wrong = st.options.filter((o) => o !== st.answer);
        queue = [];
        ctx.shuffle(wrong.slice()).forEach((w) => queue.push(...ctx.shuffle([st.answer, w])));
      }
      function spawn() {
        if (!queue.length) refill();
        const l = queue.shift();
        const el = document.createElement("div");
        el.className = "rp-bolt";
        el.innerHTML = "<b></b>";
        el.firstChild.textContent = l;
        fac.insertBefore(el, fx);
        const b = { l, el, x: W + bz, state: "ride" };
        el.addEventListener("pointerdown", (e) => { e.preventDefault(); pick(b); });
        bolts.push(b);
      }
      let last = null;
      const cross = 5.5 / pace;
      function frame(ts) {
        const dt = last == null ? 0 : Math.min(50, ts - last) / 1000;
        last = ts;
        const v = (W + bz * 2) / cross;
        nextGap -= v * dt;
        if (!done && nextGap <= 0) { spawn(); nextGap = bz * 1.9; }
        for (let i = bolts.length - 1; i >= 0; i--) {
          const b = bolts[i];
          if (b.state === "ride") b.x -= v * dt;
          if (b.x < -bz) { b.el.remove(); bolts.splice(i, 1); continue; }
          if (b.state === "ride") b.el.style.transform = `translateX(${b.x.toFixed(1)}px)`;
        }
        if (!ctx.ended || bolts.length) ctx.raf(frame);
      }

      // ---------- Choosing ----------
      function pick(b) {
        if (done || busy || ctx.ended || b.state !== "ride") return;
        busy = true;
        b.state = "fly";
        const g = cells[st.gap].getBoundingClientRect(), fr = fac.getBoundingClientRect();
        const to = { x: g.left - fr.left + g.width / 2, y: g.top - fr.top + g.height / 2 };
        const from = { x: b.x, y: H * 0.96 - bz * 0.5 };
        b.el.style.transform = "";
        b.el.style.left = "0"; b.el.style.bottom = "auto"; b.el.style.top = "0";
        b.el.animate([{ transform: `translate(${from.x}px, ${from.y - bz / 2}px)` }, { transform: `translate(${(from.x + to.x) / 2}px, ${Math.min(from.y, to.y) - 60}px)`, offset: 0.5 },
          { transform: `translate(${to.x}px, ${to.y - bz / 2}px) scale(.6)` }], { duration: reduceMotion ? 1 : 380, easing: "ease-in-out", fill: "forwards" });
        sweep(400, 1000, 0.2, "square", 0.06);
        ctx.later(() => { b.el.remove(); const k = bolts.indexOf(b); if (k >= 0) bolts.splice(k, 1); if (b.l === st.answer) right(); else wrong(to); }, reduceMotion ? 20 : 390);
      }
      function right() {
        const g = cells[st.gap];
        g.classList.remove("gap"); g.classList.add("filled");
        g.textContent = st.answer;
        bot.className = "rp-bot dance";
        hitPips[hits].classList.add("on");
        hits++;
        [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.09, "square", 0.07, i * 0.07)); // boot-up
        word(TEXT.fixed[(hits - 1) % TEXT.fixed.length], false);
        ctx.confetti(fx, W / 2, H * 0.4, { count: 40 });
        ctx.say(st.say);
        if (hits >= GOAL) { done = true; ctx.win(); return; }
        ctx.later(() => {
          ctx.pauseTimer(BEAT_MS);
          st = S[++si];
          bolts.forEach((x) => { x.el.remove(); }); bolts.length = 0; nextGap = 0;
          tone(98, 0.08, "square", 0.1); tone(98, 0.08, "square", 0.1, 0.16);
          showStep();
        }, 900);
      }
      function wrong(at) {
        missPips[missN].classList.add("x");
        missN++;
        noise(0.25, "highpass", 2000, 5000, 0.4); sweep(900, 200, 0.3, "sawtooth", 0.08); // ZAP
        word(TEXT.zap, true);
        sparks(at);
        bot.animate([{ translate: "0 0" }, { translate: "-6px 0" }, { translate: "6px 0" }, { translate: "0 0" }], { duration: 250 });
        if (missN >= MISSES) { done = true; ctx.lose(); showAnswer(); ctx.say(st.say); return; }
        ctx.later(() => { busy = false; }, 350);
      }
      function sparks(at) {
        if (reduceMotion) return;
        for (let k = 0; k < 5; k++) {
          const s = document.createElement("div");
          s.className = "rp-spark"; s.textContent = "⚡";
          s.style.left = `${at.x}px`; s.style.top = `${at.y}px`;
          fx.appendChild(s);
          const a = Math.random() * 6.28;
          s.animate([{ transform: "translate(-50%,-50%) scale(.5)" }, { transform: `translate(calc(-50% + ${Math.cos(a) * 70}px), calc(-50% + ${Math.sin(a) * 70}px))`, opacity: 0 }], { duration: 450, fill: "forwards" });
          ctx.later(() => s.remove(), 460);
        }
      }
      function showAnswer() {
        const g = cells[st.gap];
        g.classList.remove("gap"); g.classList.add("answer");
        g.textContent = st.answer;
      }
      function word(text, bad) {
        const w = document.createElement("div");
        w.className = "rp-word" + (bad ? " bad" : "");
        w.textContent = text;
        w.style.left = `${W / 2}px`; w.style.top = `${Math.max(30, 26)}px`;
        fx.appendChild(w);
        ctx.later(() => w.remove(), 1000);
      }
      function replay() { if (!done && st.prompt) ctx.say(st.prompt); }

      ctx.onTimeout(() => { done = true; showAnswer(); ctx.say(st.say); });

      layout();
      const ro = new ResizeObserver(layout);
      ro.observe(fac);
      showStep();
      ctx.raf(frame);

      // Tutorial: tap the right bolt when it comes along (three robots).
      ctx.tutorial(S.map((s) => s.target), async (f) => {
        for (let n = 0; n < GOAL && !done; n++) {
          await f.until(() => !busy && si === n, 4000);
          await f.point(panel, 600);
          let b = null;
          await f.until(() => (b = bolts.find((x) => x.state === "ride" && x.l === st.answer && x.x > W * 0.2 && x.x < W * 0.8)), 8000);
          if (!b) continue;
          const t = b;
          await f.tapNow(() => t.el);
          await f.until(() => hits > n || done, 2500);
        }
      });
      return () => { done = true; ro.disconnect(); };
    },
  });
})();
