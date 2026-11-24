// CHICKEN BANANA — a rhythm game (the teacher's idea: a chicken and a banana do a silly fusion dance; our own
// moves and chant, "CHICK… EN… BA… NANA… FUUUSION!"). The chicken is on the left, a cheeky little banana in
// sneakers on the right, the card between them. Each move a BEAT RING shrinks onto the middle, tick-tock;
// tap the right answer before it lands and both dancers strike the pose on the beat (PERFECT! if tapped as it
// lands, GOOD! if early), shuffling closer. A wrong answer, or none before the ring lands: they bump into each
// other (OOPS!). 4 moves, a new target each. 3 or more good moves: FLASH, they spin into the PERFECT
// CHICKANANA (golden, a banana-peel crest, sunglasses, a sparkly aura): win. Otherwise: BLOOP… a big fat
// chicken-banana blob with tiny wings and a rumbling tummy.
(function () {
  const TEXT = {
    name: { en: "Chicken Banana" },
    icon: "🍌",
    howTo: (list) => ({ en: {
      steps: [
        list.type === "hfw" ? ["👂", "Listen to the word, like \"the\". It's on the card too."] : ["👀", "Look at the card between the dancers."],
        ["🎵", "A ring shrinks to the beat. Tap the matching answer before it lands!"],
        ["🐔", "4 good moves and the chicken and banana FUSE into a super dancer!"],
      ],
      tips: ["Tap right as the ring lands for PERFECT!", "Miss 2 moves and they turn into a big fat chicken-banana!"],
    } }),
    instruction: { en: "FUSION\nDANCE!" },
    chant: ["CHICK…", "EN…", "BA…", "NANA…"],
    fusion: "FUUUSION!",
    perfect: "PERFECT!",
    good: "GOOD!",
    oops: "OOPS!",
    super: "CHICKANANA!",
    bloop: "BLOOP…",
  };
  const MOVES = 4, NEED = 3;

  const CSS = `
  .cb { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:6px; padding-bottom:6px; }
  .cb-pips { flex:none; display:flex; gap:5px; }
  .cb-pip { width:26px; height:26px; border:3px solid #111; border-radius:50%; background:#fff; display:flex; align-items:center; justify-content:center; font-size:14px; line-height:1; }
  .cb-pip.on { background:#ffd400; } .cb-pip.on::after { content:"⭐"; } .cb-pip.x { background:#ff5a6e; } .cb-pip.x::after { content:"✕"; color:#fff; }
  .cb-stage { position:relative; flex:1; min-height:0; width:100%; max-width:600px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111;
    background:radial-gradient(ellipse at 50% 110%, #ff9ce0 0 30%, transparent 60%), linear-gradient(#2a1b5e, #6a2c8f); }
  .cb-stage.flash { animation:cb-flash .5s ease-out; }
  .cb-floor { position:absolute; left:0; right:0; bottom:0; height:22%; background:repeating-linear-gradient(90deg, #ff4fa0 0 50px, #ffd400 50px 100px, #4dd36b 100px 150px, #2f8fe0 150px 200px);
    border-top:5px solid #111; opacity:.85; }
  .cb-stage.beat .cb-floor { filter:brightness(1.4); }
  .cb-card { position:absolute; left:50%; top:8%; transform:translateX(-50%); min-width:76px; height:66px; padding:0 14px; border-radius:16px; background:#fff; border:5px solid #111;
    box-shadow:0 6px 0 #111; display:flex; align-items:center; justify-content:center; gap:6px; font:inherit; font-size:2.3rem; line-height:1; color:#111; z-index:5; cursor:pointer; }
  .cb-card .spk { font-size:1.1rem; opacity:.6; }
  .cb-card.next { animation:cb-next .45s cubic-bezier(.2,1.8,.4,1); }
  /* The beat ring, shrinking onto the target circle */
  .cb-target { position:absolute; left:50%; top:52%; width:var(--tz); height:var(--tz); margin:calc(var(--tz) / -2) 0 0 calc(var(--tz) / -2); border-radius:50%; border:5px dashed rgba(255,255,255,.7); z-index:2; }
  .cb-ring { position:absolute; left:50%; top:52%; width:var(--tz); height:var(--tz); margin:calc(var(--tz) / -2) 0 0 calc(var(--tz) / -2); border-radius:50%; border:8px solid #ffd400;
    box-shadow:0 0 18px #ffd400; z-index:2; pointer-events:none; }
  .cb-ring.ready { border-color:#4dd36b; box-shadow:0 0 18px #4dd36b; }
  /* The dancers (--dz): they shuffle in from the sides */
  .cb-dancer { position:absolute; bottom:18%; width:var(--dz); height:var(--dz); z-index:3; transition:left .35s cubic-bezier(.3,1.4,.5,1); }
  .cb-dancer > .in { position:absolute; inset:0; transform-origin:50% 100%; animation:cb-groove .5s ease-in-out infinite alternate; }
  .cb-dancer .in > * { position:absolute; box-sizing:border-box; }
  .cb-dancer.pose0 .in { animation:none; transform:rotate(-10deg) scale(1.05); }
  .cb-dancer.pose1 .in { animation:none; transform:translateY(-12%) rotate(8deg); }
  .cb-dancer.pose2 .in { animation:none; transform:scale(1.1, .9); }
  .cb-dancer.pose3 .in { animation:none; transform:rotate(-16deg) translateX(8%); }
  .cb-dancer.r.pose0 .in, .cb-dancer.r.pose3 .in { transform:scaleX(-1) rotate(-10deg); }
  .cb-dancer.bump .in { animation:cb-bump .4s ease-out; }
  /* The chicken */
  .cb-ch .bod { left:16%; right:16%; top:30%; bottom:8%; background:#fff; border:5px solid #111; border-radius:50% 50% 44% 44%; }
  .cb-ch .comb { left:38%; top:14%; width:26%; height:20%; background:#e8173c; border:4px solid #111; border-radius:50% 50% 30% 30%; }
  .cb-ch .eye { top:36%; width:20%; aspect-ratio:1; background:#fff; border:4px solid #111; border-radius:50%; overflow:hidden; z-index:2; } .cb-ch .eye.l { left:28%; } .cb-ch .eye.r { right:28%; width:16%; }
  .cb-ch .eye i, .cb-ba .eye i { position:absolute; left:28%; top:30%; width:46%; aspect-ratio:1; background:#111; border-radius:50%; animation:cb-look 1s ease-in-out infinite alternate; }
  .cb-ch .beak { left:42%; top:54%; width:18%; height:12%; background:#ffb020; border:3px solid #111; clip-path:polygon(0 0, 100% 50%, 0 100%); z-index:2; }
  .cb-ch .wing { top:44%; width:22%; height:30%; background:#f2f2f2; border:4px solid #111; border-radius:50%; transform-origin:50% 10%; }
  .cb-ch .wing.l { left:4%; transform:rotate(30deg); } .cb-ch .wing.r { right:4%; transform:rotate(-30deg); }
  .cb-dancer.pose0 .wing.l, .cb-dancer.pose2 .wing.l { transform:rotate(120deg); } .cb-dancer.pose1 .wing.r, .cb-dancer.pose3 .wing.r { transform:rotate(-120deg); }
  .cb-ch .leg { bottom:0; width:6%; height:12%; background:#ffb020; border:2px solid #111; } .cb-ch .leg.l { left:38%; } .cb-ch .leg.r { right:38%; }
  /* The banana (in sneakers) */
  .cb-ba .bod { left:26%; right:20%; top:8%; bottom:12%; background:linear-gradient(90deg, #ffe066, #ffd000); border:5px solid #111; border-radius:60% 40% 50% 50% / 50% 50% 50% 50%; transform:rotate(12deg); }
  .cb-ba .tip { left:58%; top:2%; width:10%; height:12%; background:#6b4a1f; border:3px solid #111; border-radius:4px; transform:rotate(20deg); }
  .cb-ba .eye { top:30%; width:20%; aspect-ratio:1; background:#fff; border:4px solid #111; border-radius:50%; overflow:hidden; z-index:2; } .cb-ba .eye.l { left:32%; } .cb-ba .eye.r { right:22%; width:17%; }
  .cb-ba .mouth { left:38%; top:52%; width:26%; height:10%; background:#5a0f1e; border:3px solid #111; border-radius:10% 10% 50% 50%; z-index:2; }
  .cb-ba .arm { top:44%; width:24%; height:7%; background:#ffd000; border:3px solid #111; border-radius:99px; transform-origin:0 50%; }
  .cb-ba .arm.l { left:8%; transform:rotate(-20deg); } .cb-ba .arm.r { right:0; transform:rotate(200deg); }
  .cb-dancer.pose0 .arm.l, .cb-dancer.pose2 .arm.l { transform:rotate(-70deg); } .cb-dancer.pose1 .arm.r, .cb-dancer.pose3 .arm.r { transform:rotate(250deg); }
  .cb-ba .shoe { bottom:0; width:22%; height:10%; background:#e8173c; border:3px solid #111; border-radius:50% 50% 20% 20%; } .cb-ba .shoe.l { left:28%; } .cb-ba .shoe.r { right:22%; }
  /* The fused results */
  .cb-fused { position:absolute; left:50%; bottom:18%; width:var(--fz); height:var(--fz); margin-left:calc(var(--fz) / -2); z-index:4; display:none; }
  .cb-fused > * { position:absolute; box-sizing:border-box; }
  .cb-fused.show { display:block; animation:cb-fuse .6s cubic-bezier(.2,1.6,.4,1); }
  .cb-fused.fat { width:calc(var(--fz) * 1.35); height:calc(var(--fz) * 1.2); margin-left:calc(var(--fz) * -.675); } /* (extra fat) */
  .cb-fused.super .aura { inset:-18%; border-radius:50%; background:radial-gradient(circle, rgba(255,230,80,.75), transparent 65%); animation:cb-aura .4s ease-in-out infinite alternate; }
  .cb-fused.super .bod { left:20%; right:20%; top:22%; bottom:6%; background:linear-gradient(135deg, #fff6a8, #ffd000); border:5px solid #111; border-radius:50% 50% 44% 44%; }
  .cb-fused.super .crest { left:30%; top:0; width:40%; height:30%; background:#ffd000; border:4px solid #111; clip-path:polygon(50% 0, 70% 60%, 100% 30%, 80% 100%, 20% 100%, 0 30%, 30% 60%); }
  .cb-fused.super .shades { left:28%; right:28%; top:34%; height:12%; background:#111; border-radius:6px 6px 40% 40%; z-index:2; }
  .cb-fused.super .beak { left:43%; top:52%; width:16%; height:11%; background:#ffb020; border:3px solid #111; clip-path:polygon(0 0, 100% 50%, 0 100%); }
  .cb-fused.super .wing { top:40%; width:24%; height:34%; background:#ffe066; border:4px solid #111; border-radius:50%; } .cb-fused.super .wing.l { left:4%; transform:rotate(140deg); } .cb-fused.super .wing.r { right:4%; transform:rotate(-140deg); }
  .cb-fused.super .spark { font-size:calc(var(--fz) * .16); animation:cb-twinkle .5s ease-in-out infinite alternate; }
  .cb-fused.fat .bod { left:0; right:0; top:20%; bottom:0; background:linear-gradient(90deg, #fff 0 50%, #ffd000 50%); border:6px solid #111; border-radius:50%; animation:cb-wobble .6s ease-in-out infinite alternate; }
  .cb-fused.fat .comb { left:38%; top:10%; width:22%; height:16%; background:#e8173c; border:4px solid #111; border-radius:50%; }
  .cb-fused.fat .eye { top:38%; width:12%; aspect-ratio:1; background:#fff; border:3px solid #111; border-radius:50%; z-index:2; } .cb-fused.fat .eye.l { left:32%; } .cb-fused.fat .eye.r { left:52%; top:42%; width:9%; }
  .cb-fused.fat .eye i { position:absolute; left:20%; top:50%; width:50%; aspect-ratio:1; background:#111; border-radius:50%; }
  .cb-fused.fat .mouth { left:40%; top:62%; width:18%; height:6%; background:#5a0f1e; border:3px solid #111; border-radius:50% 50% 20% 20%; z-index:2; }
  .cb-fused.fat .wing { top:48%; width:10%; height:12%; background:#fff; border:3px solid #111; border-radius:50%; animation:cb-flap .12s linear infinite alternate; } .cb-fused.fat .wing.l { left:-4%; } .cb-fused.fat .wing.r { right:-4%; }
  .cb-fx { position:absolute; inset:0; pointer-events:none; z-index:8; overflow:visible; }
  .cb-word { position:absolute; left:50%; top:34%; transform:translate(-50%, -50%) rotate(-6deg); font-size:2.2rem; color:#ffd400; -webkit-text-stroke:2px #111; paint-order:stroke fill;
    text-shadow:0 4px 0 #111; white-space:nowrap; animation:cb-word .8s ease-out forwards; }
  .cb-word.bad { color:#ff7a9a; } .cb-word.big { font-size:2.8rem; animation-duration:1.6s; }
  /* The answers */
  .cb-opts { flex:none; display:flex; gap:10px; justify-content:center; width:100%; padding:0 10px; }
  .cb-opt { flex:1; max-width:120px; height:var(--bh); border:5px solid #111; border-radius:16px; box-shadow:0 6px 0 #111; background:#fff; color:#111; font:inherit; font-size:calc(var(--bh) * .5);
    line-height:1; cursor:pointer; touch-action:manipulation; white-space:nowrap; overflow:hidden; }
  .cb-opt:active { transform:translateY(4px); box-shadow:0 2px 0 #111; }
  .cb-opt.picked { background:#b8ffcf; } .cb-opt.bad { background:#ff5a6e; color:#fff; } .cb-opt.right { box-shadow:0 0 0 5px #fff, 0 0 0 10px #00b86b; }
  @keyframes cb-groove { from { transform:rotate(-5deg); } to { transform:rotate(5deg) translateY(-4%); } }
  @keyframes cb-bump { 30% { transform:translateX(-10%) rotate(-12deg); } 60% { transform:translateX(6%) rotate(8deg); } }
  @keyframes cb-look { 0% { transform:translate(-30%, -10%); } 100% { transform:translate(30%, 15%); } }
  @keyframes cb-next { 0% { transform:translateX(-50%) scale(.4); } 60% { transform:translateX(-50%) scale(1.2); } 100% { transform:translateX(-50%); } }
  @keyframes cb-flash { 0% { filter:brightness(3); } 100% { filter:none; } }
  @keyframes cb-fuse { from { transform:scale(.2) rotate(-360deg); opacity:0; } }
  @keyframes cb-aura { to { transform:scale(1.12); } }
  @keyframes cb-twinkle { from { opacity:.4; transform:scale(.7); } to { opacity:1; transform:scale(1.2); } }
  @keyframes cb-wobble { from { transform:scale(1.04, .96); } to { transform:scale(.96, 1.04); } }
  @keyframes cb-flap { to { transform:rotate(40deg); } }
  @keyframes cb-word { from { opacity:1; scale:.5; } 25% { scale:1.15; } 75% { opacity:1; } to { opacity:0; translate:0 -30px; } }
  @media (prefers-reduced-motion: reduce) { .cb-dancer .in, .cb-fused *, .cb-word, .cb-stage.flash { animation:none !important; } }
  `;
  function injectCss() { if (document.getElementById("cb-css")) return; const s = document.createElement("style"); s.id = "cb-css"; s.textContent = CSS; document.head.appendChild(s); }

  registerMicrogame({
    id: "chicken-banana",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 16000, // (the dance keeps its own beat; time running out is a fat fusion)
    input: "tap",
    tutorial: true,

    start(ctx) {
      injectCss();
      const speed = ctx.speed || 1, pace = 0.6 + 0.4 * speed;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const { tone, sweep, noise } = ctx.sfx;
      const N = speed >= 1.75 ? 4 : 3;
      const S = ctx.choiceSteps(MOVES, N, { lowercase: true });
      // One move: the ring shrinks over this long (4 beats); quicker when it's fast, so 4 moves fit in the time.
      const RING_MS = Math.round(Math.min(2600 / pace, (ctx.paceMs * 0.85 - 700) / MOVES));
      const WINDOW = 0.3;                         // the last 30% of the shrink is PERFECT

      const wrap = document.createElement("div");
      wrap.className = "cb";
      wrap.innerHTML = `<div class="cb-pips">${'<span class="cb-pip"></span>'.repeat(MOVES)}</div>` +
        '<div class="cb-stage"><div class="cb-floor"></div><button class="cb-card"><span class="ct"></span></button><div class="cb-target"></div><div class="cb-ring"></div>' +
        '<div class="cb-dancer cb-ch l"><div class="in"><div class="wing l"></div><div class="wing r"></div><div class="leg l"></div><div class="leg r"></div><div class="bod"></div><div class="comb"></div><div class="eye l"><i></i></div><div class="eye r"><i></i></div><div class="beak"></div></div></div>' +
        '<div class="cb-dancer cb-ba r"><div class="in"><div class="arm l"></div><div class="arm r"></div><div class="shoe l"></div><div class="shoe r"></div><div class="bod"></div><div class="tip"></div><div class="eye l"><i></i></div><div class="eye r"><i></i></div><div class="mouth"></div></div></div>' +
        '<div class="cb-fused"></div><div class="cb-fx"></div></div><div class="cb-opts"></div>';
      ctx.root.appendChild(wrap);
      const stage = wrap.querySelector(".cb-stage"), card = wrap.querySelector(".cb-card"), ring = wrap.querySelector(".cb-ring"), fx = wrap.querySelector(".cb-fx");
      const chick = wrap.querySelector(".cb-ch"), nana = wrap.querySelector(".cb-ba"), fused = wrap.querySelector(".cb-fused"), opts = wrap.querySelector(".cb-opts");
      const pips = wrap.querySelector(".cb-pips").children;
      card.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });
      if (ctx.canSpeak) card.insertAdjacentHTML("beforeend", '<span class="spk">🔊</span>');

      let W = 0, H = 0, dz = 100;
      function layout() {
        W = stage.clientWidth; H = stage.clientHeight;
        dz = Math.max(70, Math.min(W * 0.26, H * 0.4, 160));
        stage.style.setProperty("--dz", `${dz}px`);
        stage.style.setProperty("--tz", `${Math.max(60, Math.min(dz * 0.8, H * 0.24))}px`);
        stage.style.setProperty("--fz", `${dz * 1.5}px`);
        opts.style.setProperty("--bh", `${Math.max(52, Math.min(68, (opts.clientWidth - 20) / N * 0.7))}px`);
        placeDancers();
      }
      // They start at the sides and shuffle a step closer with each good move.
      let close = 0;
      function placeDancers() {
        const gapL = W * 0.06 + close * W * 0.07;
        chick.style.left = `${gapL}px`;
        nana.style.left = `${W - gapL - dz}px`;
      }

      let mi = 0, C = S[0], good = 0, missN = 0, done = false, picked = null, t0 = 0, buttons = [];
      const cardText = () => (C.listen ? C.target.text : C.cardText);
      function deal() {
        card.firstChild.textContent = cardText();
        opts.innerHTML = "";
        buttons = C.row.map((o) => {
          const b = document.createElement("button");
          b.className = "cb-opt";
          b.textContent = o.text;
          if (o.kind === "word") b.style.fontSize = `${Math.min(28, ((opts.clientWidth - 20) / N - 16) / (o.text.length * 0.6))}px`;
          b.addEventListener("pointerdown", (e) => { e.preventDefault(); tap(b, o); });
          opts.appendChild(b);
          return { b, o };
        });
      }
      // ---------- One move: the ring shrinks to the beat; the pose happens when it lands ----------
      function move() {
        if (done) return;
        picked = null;
        t0 = performance.now();
        ring.classList.remove("ready");
        ctx.say(C.prompt);
        for (let k = 0; k < 4; k++) ctx.later(() => { if (!done) { tone(k === 3 ? 880 : 660, 0.05, "square", 0.06); stage.classList.toggle("beat", k % 2 === 0); } }, (RING_MS / 4) * k); // tick tick tick TOCK
        ctx.raf(shrink);
      }
      function shrink() {
        if (done) return;
        const f = Math.min(1, (performance.now() - t0) / RING_MS);
        ring.style.transform = `scale(${(3.2 - 2.2 * f).toFixed(3)})`;
        ring.classList.toggle("ready", f >= 1 - WINDOW);
        if (f >= 1) { land(); return; }
        ctx.raf(shrink);
      }
      function tap(b, o) {
        if (done || picked || ctx.ended) return;
        const f = (performance.now() - t0) / RING_MS;
        picked = { o, perfect: f >= 1 - WINDOW, b };
        b.classList.add(o.right ? "picked" : "bad");
        tone(o.right ? 990 : 200, 0.06, "triangle", 0.08);
      }
      // The beat lands: the dancers pose (or bump), then the next move.
      function land() {
        const ok = picked && picked.o.right;
        const k = mi % 4;
        word(TEXT.chant[k], false, 0.16);
        if (ok) {
          good++;
          pips[mi].classList.add("on");
          close++;
          placeDancers();
          [chick, nana].forEach((d) => { d.className = d.className.replace(/ pose\d| bump/g, "") + ` pose${k}`; });
          word(picked.perfect ? TEXT.perfect : TEXT.good, false);
          [523, 659, 784].forEach((f, i) => tone(f, 0.08, "square", 0.07, i * 0.06));
          if (picked.o.kind === "pic") ctx.say(picked.o.spoken);
        } else {
          missN++;
          pips[mi].classList.add("x");
          [chick, nana].forEach((d) => { d.className = d.className.replace(/ pose\d| bump/g, ""); void d.offsetWidth; d.classList.add("bump"); });
          word(TEXT.oops, true);
          sweep(400, 150, 0.3, "sawtooth", 0.08); noise(0.15, "lowpass", 800, 200, 0.4); // BONK
          buttons.forEach((x) => x.o.right && x.b.classList.add("right"));
        }
        mi++;
        if (mi >= MOVES) { ctx.later(finale, 600); return; }
        ctx.pauseTimer(700);
        ctx.later(() => {
          if (done) return;
          [chick, nana].forEach((d) => d.classList.remove("pose0", "pose1", "pose2", "pose3", "bump"));
          C = S[mi];
          card.classList.remove("next"); void card.offsetWidth; card.classList.add("next");
          deal();
          move();
        }, 650);
      }
      // ---------- FUUUSION! ----------
      function finale() {
        if (done) return;
        done = true;
        const win = good >= NEED;
        ctx.freezeTimer();
        ring.style.display = "none";
        word(TEXT.fusion, false, 0.3, true);
        sweep(300, 1600, 0.6, "sawtooth", 0.06);
        // They spin into the middle and merge.
        [chick, nana].forEach((d) => {
          d.style.transition = "none";
          if (!reduceMotion) d.animate([{ transform: "none" }, { transform: `translateX(${d === chick ? 1 : -1}px) rotate(${d === chick ? 720 : -720}deg) scale(.3)`, opacity: 0 }], { duration: 650, easing: "ease-in", fill: "forwards" });
          d.style.left = `${W / 2 - dz / 2}px`;
        });
        ctx.later(() => {
          stage.classList.remove("flash"); void stage.offsetWidth; stage.classList.add("flash");
          chick.style.display = nana.style.display = "none";
          if (win) {
            fused.className = "cb-fused super show";
            fused.innerHTML = '<div class="aura"></div><div class="wing l"></div><div class="wing r"></div><div class="bod"></div><div class="crest"></div><div class="shades"></div><div class="beak"></div>' +
              '<div class="spark" style="left:-6%;top:6%">✨</div><div class="spark" style="right:-6%;top:24%;animation-delay:-.25s">✨</div><div class="spark" style="left:40%;top:-14%">⭐</div>';
            word(TEXT.super, false, 0.2, true);
            [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.14, "triangle", 0.1, i * 0.09));
            ctx.confetti(fx, W / 2, H * 0.4, { count: 110 });
            ctx.win();
          } else {
            fused.className = "cb-fused fat show";
            fused.innerHTML = '<div class="wing l"></div><div class="wing r"></div><div class="bod"></div><div class="comb"></div><div class="eye l"><i></i></div><div class="eye r"><i></i></div><div class="mouth"></div>';
            word(TEXT.bloop, true, 0.2, true);
            sweep(300, 80, 0.8, "sawtooth", 0.1); // BLOOP
            ctx.later(() => { for (let i = 0; i < 3; i++) noise(0.25, "lowpass", 200, 80, 0.5, i * 0.3); }, 600); // tummy rumble
            ctx.lose();
          }
        }, reduceMotion ? 20 : 650);
      }
      function word(text, bad, y = 0.34, big = false) {
        const w = document.createElement("div");
        w.className = "cb-word" + (bad ? " bad" : "") + (big ? " big" : "");
        w.textContent = text;
        w.style.top = `${y * 100}%`;
        fx.appendChild(w);
        ctx.later(() => w.remove(), big ? 1600 : 800);
      }
      function replay() { if (!done) ctx.say(C.prompt); }

      // Out of time (it shouldn't happen, the dance keeps its beat): straight to the fusion.
      ctx.onTimeout(() => { if (!done) { mi = MOVES; good = Math.min(good, NEED - 1); finaleOnTimeout(); } });
      function finaleOnTimeout() { done = false; finale(); }

      deal();
      layout();
      const ro = new ResizeObserver(layout);
      ro.observe(stage);
      ctx.later(move, 400);

      // Tutorial: tap the right answer as the ring goes green, four times.
      ctx.tutorial(S.map((s) => s.target), async (f) => {
        for (let n = 0; n < MOVES && !done; n++) {
          await f.until(() => mi === n && t0 && !picked && performance.now() - t0 > RING_MS * 0.55, 6000);
          await f.tapNow(() => (buttons.find((x) => x.o.right) || buttons[0]).b);
          await f.until(() => mi > n || done, 4000);
        }
      });
      return () => { done = true; ro.disconnect(); };
    },
  });
})();
