// YARN BALL CHASE — a rhythm game (the teacher's idea, made for Kitty Boss's stage 2 and a normal game too).
// A living-room floor; balls of wool roll across it in lanes, each with a label (a letter, a picture or a
// word). Your cat sits at the bottom wiggling its bottom, ready to pounce. The card at the top shows the
// target: tap a ball with it and the cat LEAPS on it and hugs it (a 🧶 pip), then a beat and a new target.
// Tap a wrong one and the ball unravels and the cat gets all TANGLED up (✕); 3 of those and you lose.
// 3 catches win (5 in Kitty Boss's longer version, where Kitty Boss is the cat).
(function () {
  const TEXT = {
    name: { en: "Yarn Ball Chase" },
    icon: "🧶",
    howTo: (list) => ({ en: {
      steps: [
        list.type === "hfw" ? ["👂", "Listen to the word, like \"the\". It's on the card too."] : ["👀", "Look at the card at the top."],
        ["🧶", "Balls of wool roll across the floor. Tap the one with the same thing on it!"],
        ["🐱", "The cat pounces on it! Then the card changes. Catch 3!"],
      ],
      tips: [
        "Tap a wrong ball and the cat gets all tangled up. 3 tangles and it's over!",
        "A ball you missed comes back round.",
        "Tap the card to hear it again.",
      ],
    } }),
    instruction: { en: "CHASE THE\nYARN!" },
    cardLabel: "Hear it again",
    got: ["GOT IT!", "MEOW!", "POUNCE!", "YES!", "PURR!"],
    tangled: "TANGLED!",
    purr: "PURRRR!",
    yawn: "MEH…",
  };
  const BEAT_MS = 800;
  const YARN = ["#ff4d6d", "#4d9dff", "#b04dff", "#1fc26b", "#ffb020", "#ff7ad9"];

  const CSS = `
  .yc { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:8px; padding-bottom:6px; }
  .yc-top { flex:none; display:flex; align-items:center; gap:10px; flex-wrap:wrap; justify-content:center; }
  .yc-card { min-width:84px; height:70px; padding:0 16px; border-radius:18px; font:inherit; font-size:2.5rem; line-height:1; background:#fff; color:#111;
    border:5px solid #111; box-shadow:0 6px 0 #111; display:flex; align-items:center; justify-content:center; gap:8px; cursor:pointer; touch-action:manipulation; }
  .yc-card .spk { font-size:1.2rem; opacity:.6; }
  .yc-card.next { animation:yc-next .45s cubic-bezier(.2,1.8,.4,1); }
  .yc-pips { display:flex; gap:4px; }
  .yc-pip { width:24px; height:24px; border:3px solid #111; border-radius:50%; background:#fff; display:flex; align-items:center; justify-content:center; font-size:13px; line-height:1; }
  .yc-pip.on { background:#ffd400; } .yc-pip.on::after { content:"🧶"; }
  .yc-pip.x { background:#ff5a6e; } .yc-pip.x::after { content:"✕"; color:#fff; font-size:14px; }
  .yc-miss { display:flex; gap:4px; }

  /* The room: striped wallpaper, a skirting board and a wooden floor */
  .yc-room { position:relative; flex:1; min-height:0; width:100%; max-width:600px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111;
    background:linear-gradient(180deg, transparent 0 22%, #fff 22% 23.5%, #111 23.5% 24.2%, transparent 24.2%),
      linear-gradient(180deg, transparent 0 24%, #c98a4b 24%),
      repeating-linear-gradient(90deg, #ffe3a3 0 22px, #ffd27a 22px 44px);
    touch-action:manipulation; cursor:pointer; }
  .yc-room::before { content:""; position:absolute; left:0; right:0; top:24%; bottom:0;
    background:repeating-linear-gradient(90deg, transparent 0 calc(25% - 3px), rgba(0,0,0,.18) calc(25% - 3px) 25%),
      repeating-linear-gradient(180deg, transparent 0 46px, rgba(0,0,0,.08) 46px 49px); }
  .yc-rug { position:absolute; left:50%; bottom:2%; width:70%; height:30%; transform:translateX(-50%); border-radius:50%; background:radial-gradient(ellipse, #6fc7ff 0 40%, #3d9be0 41% 60%, #2f6fbf 61%);
    border:4px solid #111; opacity:.9; }
  .yc-window { position:absolute; left:8%; top:3%; width:20%; height:16%; background:linear-gradient(#bfe9ff, #8fd3ff); border:4px solid #111; border-radius:6px;
    box-shadow:inset 0 0 0 4px #fff; }
  .yc-window::after { content:""; position:absolute; left:50%; top:0; bottom:0; width:4px; margin-left:-2px; background:#fff; }
  .yc-shelf { position:absolute; right:8%; top:12%; width:22%; height:3%; background:#8a5a2b; border:3px solid #111; border-radius:3px; }
  .yc-shelf::after { content:"🪴"; position:absolute; left:20%; bottom:100%; font-size:calc(var(--bz) * .4); line-height:1; }

  /* A ball of wool: stripes that spin, a loose end trailing behind; the label stays upright */
  .yc-ball { position:absolute; left:0; top:0; width:var(--bz); height:var(--bz); margin:calc(var(--bz) / -2) 0 0 calc(var(--bz) / -2); z-index:3; will-change:transform; pointer-events:none; }
  .yc-wool { position:absolute; inset:0; border-radius:50%; border:4px solid #111; background:var(--yc);
    background-image:repeating-linear-gradient(35deg, rgba(255,255,255,.35) 0 4px, transparent 4px 11px), repeating-linear-gradient(-50deg, rgba(0,0,0,.18) 0 3px, transparent 3px 12px); }
  .yc-end { position:absolute; top:58%; width:60%; height:30%; border:4px solid var(--yc); border-color:var(--yc) transparent transparent transparent; border-radius:50%; z-index:-1; }
  .yc-ball.r .yc-end { right:72%; } .yc-ball.l .yc-end { left:72%; }
  .yc-label { position:absolute; left:50%; top:50%; transform:translate(-50%, -50%); min-width:62%; height:58%; padding:0 6px; border-radius:999px; background:#fff; border:3px solid #111;
    display:flex; align-items:center; justify-content:center; font-weight:900; line-height:1; color:#111; white-space:nowrap; z-index:2; }
  .yc-ball.answer .yc-label { box-shadow:0 0 0 5px #ffd400, 0 0 24px 10px #ffd400; }
  .yc-ball.bad .yc-label { background:#ff5a6e; color:#fff; }
  .yc-ball.caught { z-index:5; }

  /* The cat (the normal game): a grey tabby with white socks, big googly eyes and a swishy tail */
  .yc-catbox { position:absolute; left:0; top:0; width:var(--cz); height:var(--cz); margin:calc(var(--cz) / -2) 0 0 calc(var(--cz) / -2); z-index:4; pointer-events:none; }
  .yc-cat { position:absolute; inset:0; transform-origin:50% 100%; animation:yc-wiggle .5s ease-in-out infinite alternate; }
  .yc-cat * { position:absolute; box-sizing:border-box; }
  .yc-ctail { right:2%; top:34%; width:30%; height:46%; border:calc(var(--cz) * .06) solid #111; border-color:#111 #111 transparent transparent; border-radius:50%; transform-origin:0 100%;
    animation:yc-swish .6s ease-in-out infinite alternate; }
  .yc-ctail::after { content:""; position:absolute; inset:calc(var(--cz) * -.04); border:calc(var(--cz) * .03) solid #9a9aaa; border-color:#9a9aaa #9a9aaa transparent transparent; border-radius:50%; }
  .yc-cbody { left:22%; right:22%; top:46%; bottom:0; background:#9a9aaa; border:calc(var(--cz) * .03) solid #111; border-radius:46% 46% 30% 30%; }
  .yc-cbody::after { content:""; left:30%; right:30%; top:16%; bottom:10%; position:absolute; background:#fff; border-radius:50%; }
  .yc-cpaw { bottom:0; width:17%; height:11%; background:#fff; border:calc(var(--cz) * .025) solid #111; border-radius:50% 50% 40% 40%; z-index:2; }
  .yc-cpaw.l { left:30%; } .yc-cpaw.r { right:30%; }
  .yc-cear { top:2%; width:26%; height:26%; background:#111; clip-path:polygon(50% 0, 100% 100%, 0 100%); }
  .yc-cear::after { content:""; position:absolute; inset:calc(var(--cz) * .03) calc(var(--cz) * .04) 0; background:#9a9aaa; clip-path:polygon(50% 0, 100% 100%, 0 100%); }
  .yc-cear.l { left:12%; transform:rotate(-14deg); } .yc-cear.r { right:12%; transform:rotate(14deg); }
  .yc-chead { left:10%; right:10%; top:12%; height:46%; background:#9a9aaa; border:calc(var(--cz) * .03) solid #111; border-radius:50% 50% 46% 46%; overflow:hidden; z-index:1; }
  .yc-chead::before { content:""; position:absolute; left:34%; right:34%; top:0; height:30%; background:repeating-linear-gradient(90deg, #5d5d6b 0 14%, transparent 14% 28%); }
  .yc-chead::after { content:""; position:absolute; left:22%; right:22%; bottom:-12%; height:46%; background:#fff; border-radius:50%; }
  .yc-ceye { top:20%; width:26%; aspect-ratio:1; background:#fff; border:calc(var(--cz) * .025) solid #111; border-radius:50%; overflow:hidden; z-index:3; }
  .yc-ceye.l { left:20%; } .yc-ceye.r { right:20%; width:22%; top:22%; }
  .yc-ceye i { left:28%; top:30%; width:46%; aspect-ratio:1; background:#111; border-radius:50%; animation:yc-look 1.2s ease-in-out infinite alternate; }
  .yc-cnose { left:45%; top:43%; width:10%; height:5%; background:#ff6f91; border:2px solid #111; border-radius:20% 20% 50% 50%; z-index:3; }
  .yc-cmouth { left:41%; top:48%; width:18%; height:7%; background:#5a0f1e; border:2px solid #111; border-radius:10% 10% 50% 50%; z-index:3; }
  .yc-cwhisk { top:43%; width:24%; height:8%; border-top:2px solid #111; border-bottom:2px solid #111; z-index:3; }
  .yc-cwhisk.l { left:3%; transform:rotate(8deg); } .yc-cwhisk.r { right:3%; transform:rotate(-8deg); }
  .yc-cat.happy .yc-ceye { height:8%; aspect-ratio:auto; background:none; border-color:#111 transparent transparent transparent; border-radius:50% 50% 0 0; top:27%; }
  .yc-cat.happy .yc-ceye i { display:none; }
  .yc-cat.sad .yc-cmouth { height:4%; border-radius:50% 50% 10% 10%; top:51%; }
  .yc-cat.sad .yc-ceye i { top:52%; }
  .yc-catbox.air .yc-cat { animation:none; transform:scale(1.08, .92); }
  /* Tangled up in wool */
  .yc-tangle { position:absolute; inset:-8%; z-index:6; pointer-events:none; display:none; }
  .yc-catbox.tangled .yc-tangle { display:block; }
  .yc-catbox.tangled .yc-ceye i, .yc-catbox.tangled .bx-eye i { animation:yc-dizzy .5s linear infinite; }
  .yc-catbox.tangled .yc-cat, .yc-catbox.tangled > .bx-boss { animation:yc-struggle .25s ease-in-out infinite alternate; }

  .yc-fx { position:absolute; inset:0; pointer-events:none; z-index:8; overflow:visible; }
  .yc-word { position:absolute; transform:translate(-50%, -50%) rotate(-8deg); font-size:2rem; color:#ffd400; -webkit-text-stroke:2px #111; paint-order:stroke fill;
    text-shadow:0 4px 0 #111; white-space:nowrap; pointer-events:none; animation:yc-word .9s ease-out forwards; }
  .yc-word.bad { color:#ff4d6d; }
  @keyframes yc-next { 0% { transform:scale(.4) rotate(-10deg); } 60% { transform:scale(1.25) rotate(4deg); } 100% { transform:none; } }
  @keyframes yc-wiggle { from { transform:rotate(-4deg) scaleY(.97); } to { transform:rotate(4deg) scaleY(1.02); } }
  @keyframes yc-swish { from { transform:rotate(-14deg); } to { transform:rotate(18deg); } }
  @keyframes yc-look { 0% { transform:translate(-30%, -10%); } 100% { transform:translate(30%, 10%); } }
  @keyframes yc-dizzy { from { transform:rotate(0) translateX(30%); } to { transform:rotate(360deg) translateX(30%); } }
  @keyframes yc-struggle { from { transform:rotate(-8deg); } to { transform:rotate(8deg); } }
  @keyframes yc-word { from { opacity:1; scale:.5; } 25% { scale:1.15; } 75% { opacity:1; } to { opacity:0; translate:0 -40px; } }
  @media (prefers-reduced-motion: reduce) { .yc-cat, .yc-ctail, .yc-ceye i, .yc-card.next, .yc-word { animation:none !important; } }
  `;
  function injectCss() {
    if (document.getElementById("yc-css")) return;
    const s = document.createElement("style"); s.id = "yc-css"; s.textContent = CSS; document.head.appendChild(s);
  }
  const CAT = '<div class="yc-cat"><div class="yc-ctail"></div><div class="yc-cbody"></div><div class="yc-cpaw l"></div><div class="yc-cpaw r"></div>' +
    '<div class="yc-cear l"></div><div class="yc-cear r"></div><div class="yc-chead"></div><div class="yc-ceye l"><i></i></div><div class="yc-ceye r"><i></i></div>' +
    '<div class="yc-cnose"></div><div class="yc-cmouth"></div><div class="yc-cwhisk l"></div><div class="yc-cwhisk r"></div></div>';

  registerMicrogame({
    id: "yarn-chase",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 13000,        // 3 catches (the beats don't count)
    input: "tap",
    tutorial: true,
    bossArt: true,          // Boss Battle: Kitty Boss's stage 2 (Kitty is the cat; 5 catches)
    bossDuration: 42000,    // (24 s at the stage's 1.75×)

    start(ctx) {
      injectCss();
      const speed = ctx.speed || 1;
      const pace = 0.6 + 0.4 * speed;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const { tone, sweep, noise } = ctx.sfx;
      const bossId = window.Boss ? window.Boss.fighting(ctx) : null; // Kitty Boss
      const GOAL = bossId ? 5 : 3, MISSES = 3;
      const N = speed >= 1.75 ? 3 : 2; // options per target (the right one + 1 or 2 others)
      const S = ctx.choiceSteps(GOAL, N, { lowercase: true });
      let si = 0, C = S[0];
      const LANES = speed >= 1.5 ? 3 : 2;

      // ---------- DOM ----------
      const wrap = document.createElement("div");
      wrap.className = "yc";
      const top = document.createElement("div");
      top.className = "yc-top";
      const card = document.createElement("button");
      card.className = "yc-card";
      card.setAttribute("aria-label", TEXT.cardLabel);
      card.innerHTML = '<span class="ct"></span>';
      const cardText = () => (C.listen ? C.target.text : C.cardText); // always shown: too fast to play by ear
      card.firstChild.textContent = cardText();
      if (ctx.canSpeak) card.insertAdjacentHTML("beforeend", '<span class="spk">🔊</span>');
      card.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });
      const pips = document.createElement("div");
      pips.className = "yc-pips";
      pips.innerHTML = '<span class="yc-pip"></span>'.repeat(GOAL);
      const misses = document.createElement("div");
      misses.className = "yc-miss";
      misses.innerHTML = '<span class="yc-pip"></span>'.repeat(MISSES);
      top.append(pips, card, misses);
      const room = document.createElement("div");
      room.className = "yc-room";
      room.innerHTML = '<div class="yc-window"></div><div class="yc-shelf"></div><div class="yc-rug"></div><div class="yc-fx"></div>';
      const fx = room.querySelector(".yc-fx");
      const catBox = document.createElement("div");
      catBox.className = "yc-catbox";
      let catFig;
      if (bossId) { catFig = window.Boss.el(bossId, "var(--cz)"); catBox.appendChild(catFig); }
      else { catBox.innerHTML = CAT; catFig = catBox.firstChild; }
      const tangle = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      tangle.setAttribute("class", "yc-tangle");
      tangle.setAttribute("viewBox", "0 0 100 100");
      catBox.appendChild(tangle);
      room.appendChild(catBox);
      wrap.append(top, room);
      ctx.root.appendChild(wrap);
      const mood = (m) => {
        if (bossId) { window.Boss.setMood(catFig, m === "sad" ? "angry" : m); return; }
        catFig.classList.remove("happy", "sad");
        if (m) catFig.classList.add(m);
      };

      // ---------- Layout ----------
      let W = 0, H = 0, bz = 80, cz = 120, home = { x: 0, y: 0 }, laneY = [];
      function layout() {
        W = room.clientWidth; H = room.clientHeight;
        cz = Math.max(80, Math.min(W * 0.3, H * 0.3, 150));
        home = { x: W / 2, y: H - cz * 0.5 - 4 };
        bz = Math.max(56, Math.min(W * 0.2, H * (LANES === 3 ? 0.15 : 0.19), 110));
        const yTop = H * 0.24 + bz * 0.6, yBot = H - cz - bz * 0.45;
        laneY = [...Array(LANES)].map((_, i) => yTop + (LANES === 1 ? 0 : (yBot - yTop) * i / (LANES - 1)));
        room.style.setProperty("--bz", `${bz}px`);
        room.style.setProperty("--cz", `${cz}px`);
        catBox.style.transform = `translate(${home.x}px, ${home.y}px)`;
        balls.forEach(sizeLabel);
      }

      // ---------- The balls ----------
      const balls = [];
      let queue = [], colorI = 0;
      function refill() {
        // About every other ball is a right one (the teacher found every third too slow in Bongo Bash).
        const right = C.row.find((o) => o.right), wrong = ctx.shuffle(C.row.filter((o) => !o.right));
        queue = [];
        wrong.forEach((w) => queue.push(...ctx.shuffle([right, w])));
      }
      refill();
      const laneLast = [];
      function spawn(force) {
        // The lane that's been empty longest; balls in a lane all roll the same way.
        let lane = 0;
        for (let i = 1; i < LANES; i++) if ((laneLast[i] || 0) < (laneLast[lane] || 0)) lane = i;
        const now = performance.now();
        if (!force && laneLast[lane] && now - laneLast[lane] < 900 / pace) return;
        laneLast[lane] = now;
        if (!queue.length) refill();
        const o = queue.shift();
        const dir = lane % 2 ? -1 : 1;
        const el = document.createElement("div");
        el.className = "yc-ball " + (dir > 0 ? "r" : "l");
        el.style.setProperty("--yc", YARN[colorI++ % YARN.length]);
        el.innerHTML = '<div class="yc-end"></div><div class="yc-wool"></div><div class="yc-label"></div>';
        el.querySelector(".yc-label").textContent = o.text;
        room.insertBefore(el, fx);
        const b = { o, el, wool: el.querySelector(".yc-wool"), label: el.querySelector(".yc-label"), lane, dir,
          x: dir > 0 ? -bz : W + bz, y: laneY[lane], spin: Math.random() * 360, state: "roll", fast: 1 };
        sizeLabel(b);
        balls.push(b);
      }
      function sizeLabel(b) {
        const len = Math.max(1, [...b.o.text].length);
        b.label.style.fontSize = b.o.kind === "word" ? `${Math.min(bz * 0.34, (bz * 1.15) / (len * 0.62))}px` : `${bz * 0.4}px`;
        b.y = laneY[b.lane] || b.y;
      }
      function place(b) {
        b.el.style.transform = `translate(${b.x.toFixed(1)}px, ${b.y.toFixed(1)}px)`;
        b.wool.style.transform = `rotate(${b.spin.toFixed(0)}deg)`;
      }

      // ---------- Loop ----------
      const cross = 3.4 / pace;    // seconds to roll across
      let last = null, nextSpawn = 0;
      function frame(ts) {
        if (ctx.ended && !balls.length) return;
        const dt = last == null ? 0 : Math.min(50, ts - last) / 1000;
        last = ts;
        const now = performance.now();
        if (!done && now >= nextSpawn && started) { spawn(false); nextSpawn = now + 700 / pace; }
        for (let i = balls.length - 1; i >= 0; i--) {
          const b = balls[i];
          if (b.state === "roll") {
            const v = (W + bz * 2) / cross * b.fast;
            b.x += b.dir * v * dt;
            b.spin += b.dir * v * dt / (bz * 0.5) * 57.3;
            if ((b.dir > 0 && b.x > W + bz) || (b.dir < 0 && b.x < -bz)) { b.el.remove(); balls.splice(i, 1); continue; }
          }
          if (b.state !== "gone") place(b);
        }
        ctx.raf(frame);
      }

      // ---------- Pounce ----------
      let hits = 0, missN = 0, done = false, busy = false, started = false;
      room.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        if (done || busy || ctx.ended) return;
        const r = room.getBoundingClientRect();
        const p = { x: e.clientX - r.left, y: e.clientY - r.top };
        let best = null, bd = Infinity;
        balls.forEach((b) => {
          if (b.state !== "roll") return;
          const d = Math.hypot(b.x - p.x, b.y - p.y);
          if (d < bz * 0.75 && d < bd) { best = b; bd = d; }
        });
        if (best) pounce(best);
      });
      function pounce(b) {
        busy = true;
        b.state = "held";
        b.el.classList.add("caught");
        const right = b.o.right;
        const final = right ? hits + 1 >= GOAL : missN + 1 >= MISSES;
        if (final) ctx.freezeTimer(); else ctx.pauseTimer(520);
        const dx = b.x - home.x, dy = b.y - home.y + cz * 0.2;
        catBox.classList.add("air");
        sweep(300, 900, 0.25, "triangle", 0.09); // whoosh up
        const jump = catBox.animate([{ translate: "0 0" }, { translate: `${dx * 0.5}px ${dy * 0.5 - cz * 0.6}px`, offset: 0.5 }, { translate: `${dx}px ${dy}px` }],
          { duration: reduceMotion ? 1 : 380, easing: "ease-in-out", fill: "forwards" });
        ctx.later(() => { catBox.classList.remove("air"); if (right) caught(b, final); else tangled(b, final); }, reduceMotion ? 20 : 390);
        void jump;
      }
      function goHome(after) {
        const cur = getComputedStyle(catBox).translate;
        catBox.getAnimations().forEach((a) => a.cancel());
        catBox.animate([{ translate: cur && cur !== "none" ? cur : "0 0" }, { translate: "0 -30px", offset: 0.5 }, { translate: "0 0" }],
          { duration: reduceMotion ? 1 : 320, easing: "ease-in-out" });
        ctx.later(after, reduceMotion ? 20 : 330);
      }
      function caught(b, final) {
        b.el.animate([{ scale: "1" }, { scale: "1.25, .7" }, { scale: ".2", opacity: 0 }], { duration: 360, fill: "forwards" });
        ctx.later(() => { b.state = "gone"; b.el.remove(); const i = balls.indexOf(b); if (i >= 0) balls.splice(i, 1); }, 370);
        mood("happy");
        [523, 659, 784].forEach((f, i) => tone(f, 0.1, "triangle", 0.09, i * 0.07));
        tone(1200, 0.06, "sine", 0.06, 0.25); tone(900, 0.08, "sine", 0.06, 0.3); // meow-ish
        word(TEXT.got[hits % TEXT.got.length], false, b.x, b.y - bz * 0.6);
        ctx.confetti(fx, b.x, b.y, { count: 30 });
        if (b.o.kind === "pic") ctx.say(b.o.spoken);
        pips.children[hits].classList.add("on");
        hits++;
        if (final) {
          done = true;
          ctx.win();
          balls.forEach((x) => { if (x.state === "roll") x.fast = 3; });
          ctx.later(() => {
            word(TEXT.purr, false, home.x, home.y - cz * 0.8);
            for (let i = 0; i < 10; i++) noise(0.07, "lowpass", 180, 120, 0.5, i * 0.09);
            ctx.confetti(fx, W / 2, H * 0.4, { count: 80 });
            goHome(() => {});
          }, 400);
          return;
        }
        ctx.later(() => goHome(next), 380);
      }
      function tangled(b, final) {
        b.el.classList.add("bad");
        b.state = "gone";
        b.el.animate([{ opacity: 1 }, { opacity: 0, scale: ".3" }], { duration: 300, fill: "forwards" });
        ctx.later(() => { b.el.remove(); const i = balls.indexOf(b); if (i >= 0) balls.splice(i, 1); }, 320);
        // Wool all round the cat: a scribble in the ball's colour.
        const col = b.el.style.getPropertyValue("--yc");
        let d = "M10 30";
        for (let k = 0; k < 9; k++) d += ` Q${Math.random() * 100} ${Math.random() * 100} ${10 + Math.random() * 80} ${15 + Math.random() * 75}`;
        tangle.innerHTML = `<path d="${d}" fill="none" stroke="#111" stroke-width="7" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${col}" stroke-width="4" stroke-linecap="round"/>`;
        catBox.classList.add("tangled");
        mood("sad");
        sweep(700, 200, 0.4, "sawtooth", 0.08); noise(0.2, "bandpass", 1200, 800, 0.3);
        word(TEXT.tangled, true, b.x, b.y - bz * 0.6);
        misses.children[missN].classList.add("x");
        missN++;
        if (final) { done = true; ctx.lose(); ctx.later(() => { goHome(() => {}); showRight(); }, 500); ctx.say(C.answer); return; }
        ctx.later(() => goHome(() => {
          catBox.classList.remove("tangled");
          mood(null);
          busy = false;
        }), 750);
      }
      // The beat: the clock stops, the card pops to the next target, the voice says it; the balls on the
      // floor roll off quickly and fresh ones come.
      function next() {
        if (done) return;
        ctx.pauseTimer(BEAT_MS);
        C = S[++si];
        card.firstChild.textContent = cardText();
        card.classList.remove("next"); void card.offsetWidth; card.classList.add("next");
        tone(98, 0.08, "square", 0.1); tone(98, 0.08, "square", 0.1, 0.16);
        ctx.later(() => { if (!done) ctx.say(C.prompt); }, 150);
        mood(null);
        balls.forEach((x) => { if (x.state === "roll") x.fast = 3.5; });
        refill();
        nextSpawn = performance.now() + 350;
        ctx.later(() => { busy = false; }, 250);
      }
      function showRight() {
        let any = false;
        balls.forEach((x) => { if (x.o.right && x.state === "roll") { x.el.classList.add("answer"); x.fast = 0.25; any = true; } });
        if (!any && !reduceMotion) { const o = C.row.find((x) => x.right); queue.unshift(o); }
      }
      function word(text, bad, x, y) {
        const w = document.createElement("div");
        w.className = "yc-word" + (bad ? " bad" : "");
        w.textContent = text;
        w.style.left = `${x}px`; w.style.top = `${Math.max(24, y)}px`;
        fx.appendChild(w);
        ctx.later(() => w.remove(), 900);
      }
      function replay() { if (!done) ctx.say(C.prompt); }

      ctx.onTimeout(() => { done = true; mood(bossId ? "laugh" : "sad"); word(TEXT.yawn, true, home.x, home.y - cz * 0.7); showRight(); ctx.say(C.answer); });
      function onKey(e) { if (e.key === " ") { e.preventDefault(); replay(); } }
      document.addEventListener("keydown", onKey);

      layout();
      const ro = new ResizeObserver(layout);
      ro.observe(room);
      ctx.say(C.prompt);
      const rev = ctx.reveal(card) || 0;
      ctx.later(() => { started = true; spawn(true); nextSpawn = performance.now() + 700 / pace; }, rev + 200);
      ctx.raf(frame);

      // Tutorial: point at the card, then wait for a right ball to roll into the middle and tap it.
      ctx.tutorial(S.map((s) => s.target), async (f) => {
        await f.point(card, 800);
        for (let n = 0; n < GOAL && !done; n++) {
          await f.until(() => !busy && hits === n, 3000);
          if (n) await f.point(card, 500);
          let tb = null;
          await f.until(() => (tb = balls.find((b) => b.o.right && b.state === "roll" && b.x > W * 0.2 && b.x < W * 0.8)), 8000);
          if (!tb) continue;
          const t = tb;
          await f.tapNow(() => t.el);
          await f.until(() => hits > n || done, 2500);
        }
      });
      return () => { done = true; ro.disconnect(); document.removeEventListener("keydown", onKey); };
    },
  });
})();
