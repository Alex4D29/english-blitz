// WIRE CUT — a silly bomb (googly eyes, a fizzing fuse) has wires plugged into it. Its countdown screen
// shows the target (b); the plugs in a column on the left hold the options (d, b, p): cut the wire that
// matches. It's a rhythm game: each right cut snips a wire, then a beat where the clock stops, the screen
// flips to a new target and fresh wires plug in. 3 cuts and the bomb is defused (the fuse goes out, PHEW!).
// A wrong wire makes it tick faster and swell (a ✕); 3 of those, or running out of time, and BOOM.
// (It used to be "find the one matching pair" and before that "cut the wrong pair": in playtesting both
// caused panic and confusion under time pressure. The teacher preferred this, from Robot Boss's finale.)
//
// Boss Battle: Robot Boss's finale is the same game with the wires plugged into the robot: cut 3 and it
// blows up into nuts and bolts (bossArt; `bossDuration` gives it a longer time limit).
(function () {
  const TEXT = {
    name: { en: "Wire Cut" },
    icon: "💣",
    howTo: (list) => ({ en: {
      steps: [
        list.type === "hfw" ? ["👂", "Listen to the word, like \"the\". It's on the bomb's screen too."] : ["👀", "Look at the bomb's screen. It shows a letter, a word or a picture."],
        ["✂️", "Cut the wire with the same one! Tap its plug, or the wire."],
        ["🔁", "Then the screen changes: cut the new one. Cut 3 wires to stop the bomb!"],
      ],
      tips: [
        "Follow the colours: the wires cross over.",
        "A wrong wire makes the bomb tick faster. Three wrong wires and BOOM!",
        "Tap the screen to hear it again.",
        "When the game speeds up, there are 4 wires.",
      ],
    } }),
    instruction: { en: "CUT THE\nWIRE!" },
    cutLabel: (t) => `Cut the wire ${t}`,
    zap: ["BZZT!", "ZAP!", "FZZT!"],
    snip: ["SNIP!", "PHEW!", "SNIP!"],
    boom: "KA-BOOM!",
    bigBoom: "BOOM!",
    phew: "PHEW!",
    haha: "HA HA!",
    tick: "TICK TICK!",
  };
  const NEED = 3, MISSES = 3, BEAT_MS = 800;
  const WIRE_COLORS = ["#ff2e3b", "#1e6bff", "#1fd65f", "#b04dff", "#ff8a00"];
  const SVG_NS = "http://www.w3.org/2000/svg";

  const CSS = `
  .wcr { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:6px; padding-bottom:8px; }
  .wcr-pips { flex:none; display:flex; gap:14px; align-items:center; min-height:30px; }
  .wcr-row { display:flex; gap:5px; }
  .wcr-pip { width:24px; height:24px; border:3px solid #111; border-radius:50%; background:#fff; display:flex; align-items:center; justify-content:center; font-size:13px; line-height:1; }
  .wcr-pip.on { background:#ffd400; } .wcr-pip.on::after { content:"✂️"; }
  .wcr.robot .wcr-pip.on::after { content:"⚡"; }
  .wcr-pip.miss { background:#444; } .wcr-pip.miss::after { content:"✕"; color:#fff; font-weight:900; }
  .wcr-lab { position:relative; flex:1; min-height:0; width:100%; max-width:560px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111;
    background:repeating-linear-gradient(0deg, transparent 0 38px, rgba(255,255,255,.06) 38px 40px), repeating-linear-gradient(90deg, transparent 0 38px, rgba(255,255,255,.06) 38px 40px), #2b3a4a; }
  .wcr-lab.flash::after { content:""; position:absolute; inset:0; background:#fff; z-index:20; animation:wcr-flash .4s ease-out forwards; pointer-events:none; }
  .wcr-lab.shake { animation:wcr-shake .3s linear 2; }
  .wcr-lab.sooty { filter:brightness(.6) saturate(.5); transition:filter .3s; }
  .wcr-svg { position:absolute; inset:0; width:100%; height:100%; z-index:2; overflow:visible; }
  .wcr-bot { position:absolute; left:0; top:0; z-index:3; pointer-events:none; }
  /* The target, on a screen on the bomb's (or robot's) belly */
  .wcr-screen { position:absolute; left:50%; top:var(--scr, 72%); transform:translate(-50%, -50%); min-width:30%; padding:2px 8px; z-index:5; background:#d7ffe0; color:#111;
    border:5px solid #111; border-radius:10px; box-shadow:inset 0 0 0 3px #7fd99a, 0 0 18px 4px rgba(127,255,160,.6); font-size:calc(var(--rs) * .17); line-height:1.15;
    text-align:center; white-space:nowrap; pointer-events:auto; cursor:pointer; }
  .wcr-screen.next { animation:wcr-next .45s cubic-bezier(.2,1.8,.4,1); }
  .wcr.bomb .wcr-screen { background:#ffe3e3; box-shadow:inset 0 0 0 3px #ff8a8a, 0 0 18px 4px rgba(255,80,80,.55); }
  .wcr.safe .wcr-screen { background:#d7ffe0; box-shadow:inset 0 0 0 3px #7fd99a, 0 0 18px 4px rgba(127,255,160,.6); }

  /* The bomb: a black ball with a cap, a fizzing fuse, googly eyes and a worried mouth. --rs is its size. */
  .wcb { position:relative; width:var(--rs); height:var(--rs); animation:wcb-throb .5s ease-in-out infinite alternate; transform-origin:50% 60%; }
  .wcb.tick { animation-duration:.18s; }
  .wcb.tick2 { animation-duration:.1s; scale:1.08; }
  .wcb-ball { position:absolute; left:8%; right:8%; top:18%; bottom:2%; border-radius:50%; border:5px solid #111;
    background:radial-gradient(circle at 34% 30%, #6a6a78 0 10%, #2c2c34 30%, #111 75%); }
  .wcb-cap { position:absolute; left:56%; top:12%; width:22%; height:14%; background:#888; border:5px solid #111; border-radius:6px; transform:rotate(28deg); }
  .wcb-fuse { position:absolute; left:70%; top:-2%; width:20%; height:20%; border:6px solid #c49a5a; border-color:#c49a5a #c49a5a transparent transparent; border-radius:0 90% 0 0; }
  .wcb-spark { position:absolute; left:86%; top:-10%; font-size:calc(var(--rs) * .16); line-height:1; animation:wcb-spark .12s steps(2) infinite; }
  .wcb-eye { position:absolute; top:34%; width:20%; aspect-ratio:1; background:#fff; border:4px solid #111; border-radius:50%; z-index:2; }
  .wcb-eye.l { left:26%; } .wcb-eye.r { left:52%; width:16%; top:36%; }
  .wcb-eye i { position:absolute; left:28%; top:30%; width:46%; aspect-ratio:1; background:#111; border-radius:50%; animation:wcb-goggle 1.1s ease-in-out infinite; }
  .wcb-mouth { position:absolute; left:42%; top:52%; width:14%; height:7%; background:#5a0f1e; border:3px solid #111; border-radius:50% 50% 30% 30%; z-index:2; }
  .wcr.safe .wcb { animation:wcb-hop .4s cubic-bezier(.2,1.6,.4,1) 3; }
  .wcr.safe .wcb-spark { display:none; }
  .wcr.safe .wcb-mouth { height:9%; border-radius:0 0 99px 99px; }
  .wcr.safe .wcb-fuse::after { content:"💨"; position:absolute; right:-40%; top:-60%; font-size:calc(var(--rs) * .12); }

  /* The plugs: a column of tiles on the left, one wire each */
  .wcr-plug { position:absolute; left:0; top:0; width:var(--pw); height:var(--ph); margin:calc(var(--ph) * -.5) 0 0 calc(var(--pw) * -.5); z-index:4; padding:0; font:inherit; cursor:pointer;
    touch-action:manipulation; background:#fff; color:#111; border:5px solid #111; border-radius:14px; box-shadow:inset 0 0 0 5px var(--wc), 0 5px 0 #111;
    display:flex; align-items:center; justify-content:center; font-size:calc(var(--ph) * .5); line-height:1; white-space:nowrap; }
  .wcr-plug.in { animation:wcr-in .3s cubic-bezier(.2,1.6,.4,1) both; }
  .wcr-plug.cut { opacity:.45; }
  .wcr-plug.bad { animation:wcr-shake .3s linear; background:#ff5a6e; color:#fff; }
  .wcr-plug.right { box-shadow:inset 0 0 0 5px var(--wc), 0 0 0 5px #fff, 0 0 0 10px #00b86b; animation:wcr-wiggle .4s ease-in-out 3; }
  .wcr-plug.dim { opacity:.4; }
  .wcr-fx { position:absolute; inset:0; pointer-events:none; z-index:9; overflow:visible; }
  .wcr-pop { position:absolute; line-height:1; pointer-events:none; transform:translate(-50%, -50%); }
  .wcr-word { position:absolute; transform:translate(-50%, -50%) rotate(-8deg); font-size:2rem; color:#ffd400; -webkit-text-stroke:2px #111; paint-order:stroke fill;
    text-shadow:0 4px 0 #111; white-space:nowrap; pointer-events:none; animation:wcr-word .9s ease-out forwards; z-index:10; }
  .wcr-word.bad { color:#ff4d6d; } .wcr-word.big { font-size:3rem; animation-duration:2s; }
  @keyframes wcr-flash { from { opacity:1; } to { opacity:0; } }
  @keyframes wcr-shake { 25% { transform:translate(-6px, 3px); } 75% { transform:translate(6px, -3px); } }
  @keyframes wcr-next { 0% { transform:translate(-50%, -50%) scale(.4); } 60% { transform:translate(-50%, -50%) scale(1.25); } 100% { transform:translate(-50%, -50%); } }
  @keyframes wcr-in { from { scale:.3; opacity:0; } }
  @keyframes wcr-wiggle { 25% { rotate:-6deg; } 75% { rotate:6deg; } }
  @keyframes wcr-word { from { opacity:1; transform:translate(-50%, -50%) rotate(-8deg) scale(.5); } 25% { transform:translate(-50%, -60%) rotate(-8deg) scale(1.15); }
    75% { opacity:1; } to { opacity:0; transform:translate(-50%, -100%) rotate(-8deg); } }
  @keyframes wcb-throb { to { transform:scale(1.04) rotate(2deg); } }
  @keyframes wcb-spark { 50% { transform:scale(1.5) rotate(30deg); opacity:.6; } }
  @keyframes wcb-goggle { 0%, 100% { transform:translate(-16%, 0); } 50% { transform:translate(16%, -12%); } }
  @keyframes wcb-hop { 50% { transform:translateY(-10%); } }
  @media (prefers-reduced-motion: reduce) { .wcr-screen.next, .wcr-plug.in, .wcr-word, .wcr-lab.shake, .wcb, .wcb-spark, .wcb-eye i { animation:none !important; } }
  `;
  function injectCss() {
    if (document.getElementById("wcr-css")) return;
    const s = document.createElement("style"); s.id = "wcr-css"; s.textContent = CSS; document.head.appendChild(s);
  }

  registerMicrogame({
    id: "wire-cut",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 12000,       // 3 cuts (the beats between them don't count)
    input: "tap",
    tutorial: true,
    bossArt: true,         // Boss Battle: Robot Boss's finale draws the robot instead of the bomb
    bossDuration: 14000,   // …and gets a little longer (it's played at 2×)

    start(ctx) {
      injectCss();
      const robotMode = !!(window.Boss && window.Boss.fighting(ctx) === "robot");
      const speed = ctx.speed || 1;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const { tone, sweep, noise } = ctx.sfx;
      const N = speed >= 1.75 ? 4 : 3;
      const S = ctx.choiceSteps(NEED, N, { lowercase: true });
      let C = S[0];

      const wrap = document.createElement("div");
      wrap.className = "wcr " + (robotMode ? "robot" : "bomb");
      const pips = document.createElement("div");
      pips.className = "wcr-pips";
      pips.innerHTML = `<div class="wcr-row hits">${'<span class="wcr-pip"></span>'.repeat(NEED)}</div><div class="wcr-row misses">${'<span class="wcr-pip"></span>'.repeat(MISSES)}</div>`;
      const lab = document.createElement("div");
      lab.className = "wcr-lab";
      const svg = document.createElementNS(SVG_NS, "svg");
      svg.setAttribute("class", "wcr-svg");
      const botBox = document.createElement("div");
      botBox.className = "wcr-bot";
      let robot = null, bomb = null;
      if (robotMode) {
        robot = window.Boss.el("robot", "var(--rs)");
        botBox.appendChild(robot);
        botBox.style.setProperty("--scr", "79%"); // on its body
      } else {
        bomb = document.createElement("div");
        bomb.className = "wcb";
        bomb.innerHTML = '<div class="wcb-fuse"></div><div class="wcb-spark">✨</div><div class="wcb-cap"></div><div class="wcb-ball"></div>' +
          '<div class="wcb-eye l"><i></i></div><div class="wcb-eye r"><i></i></div><div class="wcb-mouth"></div>';
        botBox.appendChild(bomb);
      }
      const screen = document.createElement("div");
      screen.className = "wcr-screen";
      screen.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });
      botBox.appendChild(screen);
      const fx = document.createElement("div");
      fx.className = "wcr-fx";
      lab.append(svg, botBox, fx);
      wrap.append(pips, lab);
      ctx.root.appendChild(wrap);
      const mood = (m) => { if (robot) window.Boss.setMood(robot, m); };

      // ---------- Layout: the plugs in a column on the left, the bomb (or robot) on the right ----------
      let W = 0, H = 0, R = 200, pw = 90, ph = 60, bot = { x: 0, y: 0 };
      let wires = [];
      function layout() {
        W = lab.clientWidth; H = lab.clientHeight;
        R = Math.max(150, Math.min(H * 0.8, W * 0.52, 300));
        ph = Math.max(46, Math.min((H - 20) / N - 12, 80));
        pw = Math.max(70, Math.min(W * 0.26, ph * (C.row[0].kind === "word" ? 2.2 : 1.5), 150));
        lab.style.setProperty("--rs", `${R}px`);
        lab.style.setProperty("--pw", `${pw}px`);
        lab.style.setProperty("--ph", `${ph}px`);
        bot = { x: W - R / 2 - 6, y: H / 2 };
        botBox.style.transform = `translate(${bot.x - R / 2}px, ${bot.y - R / 2}px)`;
        botBox.style.width = botBox.style.height = `${R}px`;
        wires.forEach(placeWire);
      }
      const plugAt = (i) => ({ x: pw / 2 + 10, y: H * ((i + 0.5) / N) });
      // Where each wire plugs in: the robot's left side by its body, or round the bomb's left side.
      const socketAt = (i) => {
        const k = N > 1 ? i / (N - 1) : 0.5;
        return robotMode ? { x: bot.x - R * 0.24, y: bot.y + R * (0.12 + 0.3 * k) }
          : { x: bot.x - R * (0.36 - 0.04 * Math.abs(k - 0.5)), y: bot.y + R * (-0.05 + 0.4 * k) };
      };

      // ---------- Wires ----------
      function dealWires(anim) {
        wires.forEach((w) => { w.plug.remove(); w.g.remove(); });
        const order = ctx.shuffle(C.row.slice());
        const sockets = ctx.shuffle([...Array(N)].map((_, k) => k)); // crossed wires: follow the colours
        wires = order.map((opt, i) => {
          const color = WIRE_COLORS[i % WIRE_COLORS.length];
          const plug = document.createElement("button");
          plug.className = "wcr-plug" + (anim ? " in" : "");
          plug.style.setProperty("--wc", color);
          plug.textContent = opt.text;
          plug.setAttribute("aria-label", TEXT.cutLabel(opt.spoken));
          if (opt.kind === "word") plug.style.fontSize = `${Math.min(ph * 0.42, (pw * 0.8) / (opt.text.length * 0.6))}px`;
          const g = document.createElementNS(SVG_NS, "g");
          g.innerHTML = `<path class="o" fill="none" stroke="#111" stroke-width="13" stroke-linecap="round"/><path class="c" fill="none" stroke="${color}" stroke-width="7" stroke-linecap="round"/>` +
            '<path class="hit" fill="none" stroke="transparent" stroke-width="34" style="pointer-events:stroke;cursor:pointer"/>';
          svg.appendChild(g);
          lab.insertBefore(plug, fx);
          const w = { opt, plug, g, i, s: sockets[i], cut: false };
          const go = (e) => { e.preventDefault(); cut(w); };
          plug.addEventListener("pointerdown", go);
          g.querySelector(".hit").addEventListener("pointerdown", go);
          placeWire(w);
          return w;
        });
      }
      function placeWire(w) {
        const a = plugAt(w.i), b = socketAt(w.s), mx = (a.x + b.x) / 2;
        w.plug.style.transform = `translate(${a.x}px, ${a.y}px)`;
        w.d = `M${a.x + pw / 2 - 4} ${a.y} C${mx} ${a.y} ${mx} ${b.y} ${b.x} ${b.y}`;
        if (!w.cut) w.g.querySelectorAll("path").forEach((p) => p.setAttribute("d", w.d));
      }

      // ---------- Cutting ----------
      let step = 0, misses = 0, done = false, busy = false;
      function cut(w) {
        if (done || busy || ctx.ended || w.cut) return;
        busy = true;
        w.cut = true;
        w.plug.classList.add("cut");
        // snip it in the middle: a gap opens in the wire
        const p = w.g.querySelector(".c"), len = p.getTotalLength(), midPt = p.getPointAtLength(len * 0.5);
        w.g.querySelectorAll(".o, .c").forEach((q) => { q.setAttribute("stroke-dasharray", `${len * 0.44} ${len * 0.12} ${len}`); });
        w.g.querySelector(".hit").remove();
        pop("✂️", midPt, 0.5);
        noise(0.05, "highpass", 3000, 6000, 0.3); tone(1800, 0.03, "square", 0.06); // snip
        if (w.opt.right) good(w, midPt); else wrong(w, midPt);
      }
      function good(w, at) {
        if (robotMode) {
          for (let k = 0; k < 6; k++) pop("⚡", { x: at.x + (Math.random() - 0.5) * 60, y: at.y + (Math.random() - 0.5) * 60 }, 0.35);
          for (let k = 0; k < 5; k++) tone(300 + Math.random() * 1600, 0.05, "square", 0.06, k * 0.05);
          mood("hurt");
          word({ x: bot.x, y: bot.y - R * 0.45 }, TEXT.zap[step % 3], false);
        } else {
          tone(880, 0.06, "triangle", 0.1); tone(1320, 0.08, "triangle", 0.08, 0.06);
          bomb.classList.remove("tick", "tick2");
          word({ x: bot.x, y: bot.y - R * 0.45 }, TEXT.snip[step % 3], false);
        }
        if (w.opt.kind === "pic") ctx.say(w.opt.spoken);
        pips.querySelector(".hits").children[step].classList.add("on");
        step++;
        if (step >= NEED) { done = true; ctx.win(); ctx.later(robotMode ? robotBoom : defused, 250); return; }
        ctx.later(nextTarget, 550);
      }
      // The beat: the clock stops, the screen flips to a new target, the voice says it, fresh wires plug in.
      function nextTarget() {
        if (done) return;
        ctx.pauseTimer(BEAT_MS);
        C = S[step];
        showTarget(true);
        tone(98, 0.08, "square", 0.1); tone(98, 0.08, "square", 0.1, 0.16);
        ctx.later(() => { if (!done) ctx.say(C.prompt); }, 150);
        mood(null);
        dealWires(true);
        ctx.later(() => { busy = false; }, 250);
      }
      function wrong(w, at) {
        pop("⚡", at, 0.4);
        w.plug.classList.add("bad");
        misses++;
        pips.querySelector(".misses").children[misses - 1].classList.add("miss");
        if (robotMode) {
          sweep(600, 150, 0.3, "sawtooth", 0.09);
          mood("laugh");
          word({ x: bot.x, y: bot.y - R * 0.45 }, TEXT.haha, true);
        } else {
          // it ticks faster and swells
          [0, 0.1, 0.2, 0.3].forEach((d) => tone(1500, 0.03, "square", 0.08, d));
          bomb.classList.add(misses >= 2 ? "tick2" : "tick");
          word({ x: bot.x, y: bot.y - R * 0.45 }, TEXT.tick, true);
        }
        if (misses >= MISSES) { done = true; ctx.lose(); if (!robotMode) ctx.later(bombBoom, 200); ctx.later(() => { showRight(); ctx.say(C.answer); }, 600); return; }
        ctx.later(() => { mood(null); busy = false; }, 500);
      }
      // 3 wires cut, bomb: the fuse goes out, PHEW!, confetti.
      function defused() {
        wrap.classList.add("safe");
        sweep(900, 300, 0.4, "sine", 0.06); // the fizz dies down
        [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, "triangle", 0.1, 0.2 + i * 0.08));
        word({ x: bot.x, y: bot.y - R * 0.5 }, TEXT.phew, false, true);
        ctx.confetti(fx, bot.x, bot.y, { count: 100 });
        ctx.say(C.answer);
      }
      // Too many wrong wires (or out of time), bomb: BOOM, everything goes sooty.
      function bombBoom() {
        lab.classList.add("flash");
        if (!reduceMotion) lab.classList.add("shake");
        botBox.style.visibility = "hidden";
        noise(0.8, "lowpass", 1500, 100, 0.9); tone(60, 0.5, "square", 0.18);
        word({ x: bot.x, y: bot.y }, TEXT.bigBoom, true, true);
        pop("💥", bot, 1.2);
        ctx.later(() => lab.classList.add("sooty"), 120);
      }
      // 3 wires cut, robot: it sparks, shakes, and blows up into nuts and bolts.
      function robotBoom() {
        mood("angry");
        for (let k = 0; k < 10; k++) ctx.later(() => { pop("⚡", { x: bot.x + (Math.random() - 0.5) * R * 0.8, y: bot.y + (Math.random() - 0.5) * R * 0.8 }, 0.3); tone(400 + Math.random() * 1600, 0.04, "square", 0.06); }, k * 45);
        ctx.later(() => {
          lab.classList.add("flash");
          if (!reduceMotion) lab.classList.add("shake");
          botBox.style.visibility = "hidden";
          wires.forEach((w) => { w.g.style.opacity = "0.3"; });
          noise(0.8, "lowpass", 1500, 100, 0.9); tone(60, 0.5, "square", 0.18);
          word({ x: bot.x, y: bot.y }, TEXT.boom, false, true);
          ctx.confetti(fx, bot.x, bot.y, { count: 120 });
          if (!reduceMotion) for (let k = 0; k < 12; k++) {
            const e = document.createElement("div");
            e.className = "wcr-pop"; e.textContent = ["🔩", "⚙️", "🔧", "💥"][k % 4]; e.style.fontSize = `${R * 0.16}px`;
            e.style.left = `${bot.x}px`; e.style.top = `${bot.y}px`;
            fx.appendChild(e);
            const a = Math.random() * 6.28, r = W * (0.25 + Math.random() * 0.35);
            e.animate([{ transform: "translate(-50%, -50%)" }, { transform: `translate(calc(-50% + ${Math.cos(a) * r}px), calc(-50% + ${Math.sin(a) * r}px)) rotate(500deg)`, opacity: 0 }],
              { duration: 1100, easing: "cubic-bezier(.2,.7,.4,1)", fill: "forwards" });
          }
        }, 480);
        ctx.say(C.answer);
      }
      function showRight() { wires.forEach((w) => { if (!w.cut) w.plug.classList.add(w.opt.right ? "right" : "dim"); }); }
      function showTarget(anim) {
        screen.textContent = C.cardText;
        screen.style.fontSize = C.row[0].kind === "word" || C.cardText.length > 2 ? `${Math.min(R * 0.15, (R * 0.5) / (C.cardText.length * 0.6))}px` : "";
        if (anim) { screen.classList.remove("next"); void screen.offsetWidth; screen.classList.add("next"); }
      }
      function pop(text, at, scale) {
        const e = document.createElement("div");
        e.className = "wcr-pop"; e.textContent = text; e.style.fontSize = `${Math.max(24, R * scale * 0.5)}px`;
        e.style.left = `${at.x}px`; e.style.top = `${at.y}px`;
        fx.appendChild(e);
        e.animate([{ transform: "translate(-50%, -50%) scale(.5)", opacity: 1 }, { transform: "translate(-50%, -80%) scale(1.2)", opacity: 0 }], { duration: 500, fill: "forwards" });
        ctx.later(() => e.remove(), 520);
      }
      function word(at, text, bad, big) {
        const e = document.createElement("div");
        e.className = "wcr-word" + (bad ? " bad" : "") + (big ? " big" : "");
        e.textContent = text;
        e.style.left = `${Math.max(70, Math.min(W - 70, at.x))}px`; e.style.top = `${Math.max(30, at.y)}px`;
        fx.appendChild(e);
        ctx.later(() => e.remove(), big ? 2000 : 900);
      }
      function replay() { if (!done) ctx.say(C.prompt); }

      ctx.onTimeout(() => {
        done = true;
        if (robotMode) mood("laugh"); else bombBoom();
        ctx.later(showRight, robotMode ? 0 : 300);
        ctx.say(C.answer);
      });
      function onKey(e) {
        const i = parseInt(e.key, 10) - 1;
        if (i >= 0 && i < N) { e.preventDefault(); const w = wires.find((x) => x.i === i); if (w) cut(w); }
        else if (e.key === " ") { e.preventDefault(); replay(); }
      }
      document.addEventListener("keydown", onKey);

      showTarget(false);
      dealWires(false);
      layout();
      const ro = new ResizeObserver(layout);
      ro.observe(lab);
      ctx.say(C.prompt);
      ctx.reveal(screen);

      // Tutorial: point at the screen, then cut the right wire; the screen changes each time.
      ctx.tutorial(S.map((s) => s.target), async (f) => {
        await f.point(screen, 800);
        for (let n = 0; n < NEED && !done; n++) {
          await f.until(() => !busy && step === n, 3000);
          if (n) await f.point(screen, 500); // the new one
          await f.tap(() => (wires.find((w) => w.opt.right && !w.cut) || wires.find((w) => w.opt.right) || wires[0]).plug); // (still read after the cut)
          await f.until(() => step > n || done, 2000);
        }
      });
      return () => { done = true; ro.disconnect(); document.removeEventListener("keydown", onKey); };
    },
  });
})();
