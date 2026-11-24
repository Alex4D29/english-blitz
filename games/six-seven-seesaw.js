// SIX SEVEN SEESAW — the teacher's silly idea ("it won't age well but let's do it for now"). A chunky orange 6
// and a blue 7 (googly eyes, arms, legs) sit on either end of a seesaw; the card above shows the target. Tap
// the right answer: the seesaw tips and whoever goes up shouts "SIX!" / "SEVEN!" (a new target each time).
// 4 right: SUPER SPEED SEESAWING, a blur of SIX-SEVEN-SIX-SEVEN, speed lines and sparks: win. A wrong answer:
// the seesaw doesn't move and they both look sad. Two wrong: they fall off and cry: lose.
(function () {
  const TEXT = {
    name: { en: "Six Seven Seesaw" },
    icon: "🎢",
    howTo: (list) => ({ en: {
      steps: [
        list.type === "hfw" ? ["👂", "Listen to the word, like \"the\". It's on the card too."] : ["👀", "Look at the card at the top."],
        ["👆", "Tap the matching answer: the seesaw goes up and down! SIX! SEVEN!"],
        ["🎢", "4 right and they seesaw SUPER fast!"],
      ],
      tips: ["A wrong answer and they're sad. Two wrong and they fall off!"],
    } }),
    instruction: { en: "SIX SEVEN\nSEESAW!" },
    six: "SIX!", seven: "SEVEN!",
    say6: "six!", say7: "seven!",
    turbo: "SUPER SPEED!",
    sad: "AWW…",
    fall: "WAAAH!",
  };
  const GOAL = 4, MISSES = 2, TILT = 16;

  const CSS = `
  .sv { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:6px; padding-bottom:6px; }
  .sv-top { flex:none; display:flex; align-items:center; gap:10px; }
  .sv-card { min-width:76px; height:66px; padding:0 14px; border-radius:16px; background:#fff; border:5px solid #111; box-shadow:0 6px 0 #111; display:flex; align-items:center; justify-content:center;
    gap:6px; font:inherit; font-size:2.3rem; line-height:1; color:#111; cursor:pointer; touch-action:manipulation; }
  .sv-card .spk { font-size:1.1rem; opacity:.6; } .sv-card.next { animation:sv-next .45s cubic-bezier(.2,1.8,.4,1); }
  .sv-pips { display:flex; gap:4px; }
  .sv-pip { width:24px; height:24px; border:3px solid #111; border-radius:50%; background:#fff; display:flex; align-items:center; justify-content:center; font-size:12px; line-height:1; }
  .sv-pip.on { background:#ffd400; } .sv-pip.on::after { content:"⭐"; } .sv-pip.x { background:#ff5a6e; } .sv-pip.x::after { content:"✕"; color:#fff; }
  .sv-park { position:relative; flex:1; min-height:0; width:100%; max-width:600px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111;
    background:linear-gradient(#9fe0ff 0 65%, #6cc04a 65%); }
  .sv-park.turbo { animation:sv-shake .08s linear infinite; }
  .sv-park.turbo::before { content:""; position:absolute; inset:0; z-index:1; background:repeating-linear-gradient(90deg, transparent 0 40px, rgba(255,255,255,.5) 40px 44px); animation:sv-lines .2s linear infinite; }
  .sv-cloud { position:absolute; font-size:2.4rem; opacity:.9; }
  /* The seesaw: a plank on a pivot; the riders sit on it and tip with it */
  .sv-pivot { position:absolute; left:50%; bottom:22%; width:calc(var(--pw) * .16); height:calc(var(--pw) * .14); margin-left:calc(var(--pw) * -.08); background:#e8173c; border:5px solid #111;
    clip-path:polygon(50% 0, 100% 100%, 0 100%); z-index:2; }
  .sv-plank { position:absolute; left:50%; bottom:calc(22% + var(--pw) * .13); width:var(--pw); height:calc(var(--pw) * .05); margin-left:calc(var(--pw) * -.5); transform-origin:50% 50%;
    background:repeating-linear-gradient(90deg, #ffd400 0 30px, #ffb800 30px 60px); border:5px solid #111; border-radius:10px; z-index:3; transition:transform .35s cubic-bezier(.3,1.5,.5,1); }
  .sv-park.turbo .sv-plank { transition:none; animation:sv-turbo .16s ease-in-out infinite alternate; }
  .sv-seat { position:absolute; bottom:100%; width:var(--nz); height:var(--nz); }
  .sv-seat.l { left:0; } .sv-seat.r { right:0; }
  /* A number character */
  .sv-num { position:absolute; inset:0; transform-origin:50% 100%; animation:sv-bob .6s ease-in-out infinite alternate; }
  .sv-num > * { position:absolute; box-sizing:border-box; }
  .sv-num .g { left:0; right:0; top:2%; height:86%; display:flex; align-items:center; justify-content:center; font-family:"Arial Black", system-ui, sans-serif; font-weight:900;
    font-size:calc(var(--nz) * .95); line-height:1; color:var(--c); -webkit-text-stroke:calc(var(--nz) * .035) #111; paint-order:stroke fill; z-index:2; }
  .sv-num .eye { top:-4%; width:24%; aspect-ratio:1; background:#fff; border:3px solid #111; border-radius:50%; overflow:hidden; z-index:3; }
  .sv-num .eye.l { left:24%; } .sv-num .eye.r { left:52%; width:20%; top:-2%; }
  .sv-num .eye i { position:absolute; left:28%; top:30%; width:46%; aspect-ratio:1; background:#111; border-radius:50%; animation:sv-look 1s ease-in-out infinite alternate; }
  .sv-num .mouth { left:40%; top:42%; width:20%; height:10%; background:#5a0f1e; border:3px solid #111; border-radius:10% 10% 50% 50%; z-index:3; }
  .sv-num .arm { top:44%; width:26%; height:9%; background:var(--c); border:3px solid #111; border-radius:99px; z-index:1; transform-origin:100% 50%; }
  .sv-num .arm.l { left:0; transform:rotate(-20deg); } .sv-num .arm.r { right:0; transform-origin:0 50%; transform:rotate(20deg); }
  .sv-num .leg { bottom:0; width:12%; height:16%; background:var(--c); border:3px solid #111; border-radius:99px 99px 30% 30%; } .sv-num .leg.l { left:34%; } .sv-num .leg.r { right:34%; }
  .sv-num .tear { top:14%; width:8%; height:0; background:#5ec8ff; border-radius:0 0 99px 99px; z-index:4; display:none; } .sv-num .tear.l { left:30%; } .sv-num .tear.r { left:60%; }
  .sv-num.up .arm.l { transform:rotate(60deg); } .sv-num.up .arm.r { transform:rotate(-60deg); }
  .sv-num.up .mouth { height:18%; }
  .sv-num.sad .mouth { height:6%; border-radius:50% 50% 10% 10%; top:46%; } .sv-num.sad .eye i { top:52%; }
  .sv-num.cry .tear { display:block; animation:sv-tear .45s linear infinite; } .sv-num.cry .tear.r { animation-delay:.22s; }
  .sv-num.cry .mouth { height:16%; border-radius:50%; }
  .sv-shout { position:absolute; left:50%; bottom:105%; transform:translateX(-50%); padding:4px 10px; background:#fff; border:4px solid #111; border-radius:14px; font-size:calc(var(--nz) * .26);
    white-space:nowrap; z-index:6; animation:sv-pop .7s ease-out forwards; }
  .sv-fx { position:absolute; inset:0; pointer-events:none; z-index:8; overflow:visible; }
  .sv-word { position:absolute; left:50%; top:18%; transform:translate(-50%, -50%) rotate(-6deg); font-size:2.4rem; color:#ffd400; -webkit-text-stroke:2px #111; paint-order:stroke fill;
    text-shadow:0 4px 0 #111; white-space:nowrap; animation:sv-word 1.2s ease-out forwards; }
  .sv-word.bad { color:#5ec8ff; }
  /* The answers */
  .sv-opts { flex:none; display:flex; gap:10px; justify-content:center; width:100%; padding:0 10px; }
  .sv-opt { flex:1; max-width:120px; height:var(--bh); border:5px solid #111; border-radius:16px; box-shadow:0 6px 0 #111; background:#fff; color:#111; font:inherit; font-size:calc(var(--bh) * .5);
    line-height:1; cursor:pointer; touch-action:manipulation; white-space:nowrap; overflow:hidden; animation:sv-in .3s cubic-bezier(.2,1.6,.4,1) both; }
  .sv-opt:active { transform:translateY(4px); box-shadow:0 2px 0 #111; }
  .sv-opt.bad { background:#ff5a6e; color:#fff; } .sv-opt.right { box-shadow:0 0 0 5px #fff, 0 0 0 10px #00b86b; }
  @keyframes sv-bob { from { transform:translateY(0); } to { transform:translateY(-5%); } }
  @keyframes sv-look { 0% { transform:translate(-30%, -10%); } 100% { transform:translate(30%, 15%); } }
  @keyframes sv-tear { 0% { height:0; opacity:1; } 80% { height:40%; opacity:1; } 100% { height:44%; opacity:0; } }
  @keyframes sv-pop { from { transform:translateX(-50%) scale(.3); opacity:1; } 30% { transform:translateX(-50%) scale(1.15); } 80% { opacity:1; } to { opacity:0; transform:translateX(-50%) translateY(-20px); } }
  @keyframes sv-turbo { from { transform:rotate(-26deg); } to { transform:rotate(26deg); } }
  @keyframes sv-shake { 50% { translate:2px -2px; } }
  @keyframes sv-lines { to { background-position:44px 0; } }
  @keyframes sv-next { 0% { transform:scale(.4); } 60% { transform:scale(1.2); } 100% { transform:none; } }
  @keyframes sv-in { from { scale:.5; opacity:0; } }
  @keyframes sv-word { from { opacity:1; scale:.5; } 25% { scale:1.15; } 75% { opacity:1; } to { opacity:0; translate:0 -30px; } }
  @media (prefers-reduced-motion: reduce) { .sv-num, .sv-num *, .sv-park.turbo, .sv-park.turbo::before, .sv-park.turbo .sv-plank, .sv-word, .sv-shout { animation:none !important; } }
  `;
  function injectCss() { if (document.getElementById("sv-css")) return; const s = document.createElement("style"); s.id = "sv-css"; s.textContent = CSS; document.head.appendChild(s); }
  const NUM = (g, c) => `<div class="sv-num" style="--c:${c}"><div class="arm l"></div><div class="arm r"></div><div class="leg l"></div><div class="leg r"></div><div class="g">${g}</div>` +
    '<div class="eye l"><i></i></div><div class="eye r"><i></i></div><div class="mouth"></div><div class="tear l"></div><div class="tear r"></div></div>';

  registerMicrogame({
    id: "six-seven-seesaw",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 12000,
    input: "tap",
    tutorial: true,

    start(ctx) {
      injectCss();
      const speed = ctx.speed || 1;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const { tone, sweep, noise } = ctx.sfx;
      const N = speed >= 1.75 ? 4 : 3;
      const S = ctx.choiceSteps(GOAL, N, { lowercase: true });
      let si = 0, C = S[0], hits = 0, missN = 0, done = false, busy = false, side = 1; // side: which end is up (1 = the 6)

      const wrap = document.createElement("div");
      wrap.className = "sv";
      wrap.innerHTML = `<div class="sv-top"><div class="sv-pips hits">${'<span class="sv-pip"></span>'.repeat(GOAL)}</div><button class="sv-card"><span class="ct"></span></button>` +
        `<div class="sv-pips miss">${'<span class="sv-pip"></span>'.repeat(MISSES)}</div></div>` +
        `<div class="sv-park"><div class="sv-cloud" style="left:8%;top:8%">☁️</div><div class="sv-cloud" style="right:10%;top:16%">☁️</div><div class="sv-pivot"></div>` +
        `<div class="sv-plank"><div class="sv-seat l">${NUM("6", "#ff8a1f")}</div><div class="sv-seat r">${NUM("7", "#2f8fe0")}</div></div><div class="sv-fx"></div></div><div class="sv-opts"></div>`;
      ctx.root.appendChild(wrap);
      const park = wrap.querySelector(".sv-park"), plank = wrap.querySelector(".sv-plank"), card = wrap.querySelector(".sv-card"), opts = wrap.querySelector(".sv-opts"), fx = wrap.querySelector(".sv-fx");
      const [six, seven] = [...wrap.querySelectorAll(".sv-num")];
      const seats = [...wrap.querySelectorAll(".sv-seat")];
      const hitPips = wrap.querySelector(".hits").children, missPips = wrap.querySelector(".miss").children;
      card.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });
      if (ctx.canSpeak) card.insertAdjacentHTML("beforeend", '<span class="spk">🔊</span>');

      let W = 0, H = 0;
      function layout() {
        W = park.clientWidth; H = park.clientHeight;
        const pw = Math.min(W * 0.86, 520);
        park.style.setProperty("--pw", `${pw}px`);
        park.style.setProperty("--nz", `${Math.max(60, Math.min(pw * 0.24, H * 0.38, 130))}px`);
        opts.style.setProperty("--bh", `${Math.max(52, Math.min(68, (opts.clientWidth - 20) / N * 0.7))}px`);
      }
      const tilt = () => { plank.style.transform = `rotate(${side > 0 ? TILT : -TILT}deg)`; }; // (positive: the 6's end goes up)

      let buttons = [];
      const cardText = () => (C.listen ? C.target.text : C.cardText);
      function deal() {
        card.firstChild.textContent = cardText();
        opts.innerHTML = "";
        buttons = ctx.shuffle(C.row.slice()).map((o, i) => {
          const b = document.createElement("button");
          b.className = "sv-opt";
          b.textContent = o.text;
          b.style.animationDelay = `${i * 0.05}s`;
          if (o.kind === "word") b.style.fontSize = `${Math.min(28, ((opts.clientWidth - 20) / N - 16) / (o.text.length * 0.6))}px`;
          b.addEventListener("pointerdown", (e) => { e.preventDefault(); pick(b, o); });
          opts.appendChild(b);
          return { b, o };
        });
      }
      function pick(b, o) {
        if (done || busy || ctx.ended) return;
        busy = true;
        if (o.right) right(o); else wrong(b);
      }
      // The seesaw tips; whoever goes up shouts.
      function right(o) {
        [six, seven].forEach((n) => n.classList.remove("sad", "up"));
        side = -side;
        tilt();
        const upNum = side > 0 ? six : seven;
        upNum.classList.add("up");
        const sh = document.createElement("div");
        sh.className = "sv-shout";
        sh.textContent = side > 0 ? TEXT.six : TEXT.seven;
        upNum.parentElement.appendChild(sh);
        ctx.later(() => sh.remove(), 700);
        ctx.say(side > 0 ? TEXT.say6 : TEXT.say7);
        sweep(side > 0 ? 400 : 600, side > 0 ? 800 : 1100, 0.2, "triangle", 0.09); // wheee
        tone(180, 0.06, "square", 0.08); // clunk
        hitPips[hits].classList.add("on");
        hits++;
        if (hits >= GOAL) { done = true; ctx.freezeTimer(); ctx.later(turbo, 400); ctx.later(() => ctx.win(), 1600); return; } // (the super-speed seesawing gets its moment)
        ctx.later(() => {
          ctx.pauseTimer(700);
          C = S[++si];
          card.classList.remove("next"); void card.offsetWidth; card.classList.add("next");
          tone(98, 0.08, "square", 0.1); tone(98, 0.08, "square", 0.1, 0.16);
          deal();
          ctx.later(() => { if (!done) ctx.say(C.prompt); }, 250);
          busy = false;
        }, 650);
      }
      // SUPER SPEED SEESAWING!
      function turbo() {
        park.classList.add("turbo");
        [six, seven].forEach((n) => n.classList.add("up"));
        const w = document.createElement("div");
        w.className = "sv-word"; w.textContent = TEXT.turbo;
        fx.appendChild(w);
        for (let k = 0; k < 10; k++) tone(k % 2 ? 660 : 880, 0.07, "square", 0.07, k * 0.12); // six seven six seven…
        ctx.later(() => ctx.say("six seven six seven six seven!"), 200);
        ctx.confetti(fx, W / 2, H * 0.4, { count: 100 });
      }
      // Wrong: nobody moves, they're sad. Twice: they fall off and cry.
      function wrong(b) {
        b.classList.add("bad");
        missPips[missN].classList.add("x");
        missN++;
        [six, seven].forEach((n) => { n.classList.remove("up"); n.classList.add("sad"); });
        sweep(400, 250, 0.3, "sawtooth", 0.07); sweep(320, 200, 0.35, "sawtooth", 0.07, 0.25); // aww
        word(TEXT.sad);
        if (missN >= MISSES) { done = true; ctx.freezeTimer(); ctx.later(fallOff, 300); ctx.later(() => ctx.lose(), 1500); return; }
        ctx.later(() => { b.classList.remove("bad"); busy = false; }, 600);
      }
      function fallOff() {
        plank.style.transform = "rotate(0deg)";
        seats.forEach((s, k) => {
          const n = s.firstElementChild;
          n.classList.remove("sad"); n.classList.add("cry");
          if (!reduceMotion) s.animate([{ transform: "none" }, { transform: `translate(${k ? 60 : -60}px, -30px) rotate(${k ? 40 : -40}deg)`, offset: 0.3 },
            { transform: `translate(${k ? 110 : -110}px, ${H * 0.2}px) rotate(${k ? 90 : -90}deg)` }], { duration: 700, easing: "ease-in", fill: "forwards" });
        });
        ctx.later(() => { noise(0.3, "lowpass", 400, 100, 0.6); tone(70, 0.25, "square", 0.12); word(TEXT.fall); }, 700); // THUMP, waaah
        ctx.later(() => { for (let k = 0; k < 3; k++) sweep(700, 380, 0.35, "triangle", 0.07, k * 0.4); }, 800);
        buttons.forEach((x) => x.o.right && x.b.classList.add("right"));
        ctx.say(C.answer);
      }
      function word(text) {
        const w = document.createElement("div");
        w.className = "sv-word bad"; w.textContent = text;
        fx.appendChild(w);
        ctx.later(() => w.remove(), 1200);
      }
      function replay() { if (!done) ctx.say(C.prompt); }

      ctx.onTimeout(() => { done = true; [six, seven].forEach((n) => { n.classList.remove("up"); n.classList.add("sad"); }); buttons.forEach((x) => x.o.right && x.b.classList.add("right")); ctx.say(C.answer); });

      deal();
      layout();
      tilt();
      const ro = new ResizeObserver(layout);
      ro.observe(park);
      ctx.say(C.prompt);
      ctx.reveal(card);

      ctx.tutorial(S.map((s) => s.target), async (f) => {
        await f.point(card, 700);
        for (let n = 0; n < GOAL && !done; n++) {
          await f.until(() => !busy && hits === n, 3000);
          if (n) await f.point(card, 400);
          await f.tap(() => (buttons.find((x) => x.o.right) || buttons[0]).b);
          await f.until(() => hits > n || done, 2000);
        }
      });
      return () => { done = true; ro.disconnect(); };
    },
  });
})();
