// DANCE OFF — a dance-mat game (made for Robot Boss's dance battle, and in the normal pool too). The card
// at the top shows the target (letter; phonics letter; CVC word; HFW 🔊) and the voice says it. Your
// orange monster stands in the middle of a disco floor, with four arrow pads round it (▲ up, ◀ left,
// ▶ right, ▼ down), each with an option. Tap the right pad and the monster strikes that pose (arms up,
// lean left, lean right, squat), the floor flashes and the next move's options come up (a row of
// ctx.choiceRows, so phonics gets a different picture each move). 3 moves win (4 from 1.5×): a spin,
// disco lights, confetti. A wrong pad: a record scratch, the monster trips over (dizzy) and the right
// pad glows. In Robot Boss's battle (ctx.boss), the robot dances in the corner: it gets zapped by each of
// your moves and laughs if you trip. Arrow keys or 1–4 pick a pad, Space replays.
(function () {
  const TEXT = {
    name: { en: "Dance Off" },
    icon: "🕺",
    howTo: (list) => ({ en: {
      steps: [
        list.type === "hfw" ? ["👂", "Listen to the word, like \"the\"."] : ["👀", "Look at the card at the top."],
        ["🕺", "Tap the dance pad with the same one!"],
        ["⭐", "Get 3 moves right to win the dance."],
      ],
      tips: [
        "Tap the card to hear it again.",
        "A wrong pad and the monster stumbles: you can make one mistake (the ❤️). A second one and it trips over: the dance is over.",
        "When the game speeds up, the dance has 4 moves.",
      ],
    } }),
    instruction: { en: "DANCE\nOFF!" },
    cardLabel: "Hear it again",
    padLabel: (t) => `Dance to ${t}`,
    good: ["NICE!", "GROOVY!", "WOW!", "FUNKY!"],
    scratch: "OOPS!",
  };
  // Pads: direction, grid cell (col, row), arrow, colour, key.
  const PADS = [
    { dir: "up", c: 1, r: 0, arrow: "▲", color: "#ff4d6d", key: "ArrowUp" },
    { dir: "left", c: 0, r: 1, arrow: "◀", color: "#4d9dff", key: "ArrowLeft" },
    { dir: "right", c: 2, r: 1, arrow: "▶", color: "#4dd36b", key: "ArrowRight" },
    { dir: "down", c: 1, r: 2, arrow: "▼", color: "#ffd400", key: "ArrowDown" },
  ];

  const CSS = `
  .do { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:8px; padding-bottom:8px; }
  .do-top { flex:none; display:flex; align-items:center; gap:12px; }
  .do-card { min-width:84px; height:72px; padding:0 18px; border-radius:18px; font:inherit; font-size:2.6rem; line-height:1; background:#fff; color:#111;
    border:5px solid #111; box-shadow:0 6px 0 #111; display:flex; align-items:center; justify-content:center; gap:8px; cursor:pointer; touch-action:manipulation; }
  .do-card .spk { font-size:1.3rem; opacity:.6; }
  .do-pips { display:flex; gap:5px; }
  .do-pip { width:24px; height:24px; border:3px solid #111; border-radius:50%; background:#fff; }
  .do-pip.on { background:#ffd400; box-shadow:0 0 10px #ffd400; }
  .do-life { margin-left:6px; font-size:22px; line-height:1; transition:transform .2s; }
  .do-life.lost { filter:grayscale(1); opacity:.5; animation:do-shake .3s linear; }
  .do-me.stumble { animation:do-stumble .45s ease-in-out; }
  @keyframes do-stumble { 25% { transform:rotate(-14deg) translateX(-6%); } 60% { transform:rotate(10deg); } }
  /* The disco: a dark room with coloured spotlights sweeping and a flashing tiled floor */
  .do-stage { position:relative; flex:1; min-height:0; width:100%; max-width:560px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111;
    background:#24124a; display:flex; align-items:center; justify-content:center; touch-action:none; }
  .do-stage::before { content:""; position:absolute; inset:-40%; background:conic-gradient(from 0deg, rgba(255,77,109,.25), transparent 15%, rgba(77,157,255,.25) 30%, transparent 45%, rgba(77,211,107,.25) 60%, transparent 75%, rgba(255,212,0,.25) 90%, transparent);
    animation:do-spin 5s linear infinite; }
  .do-floor { position:absolute; left:0; right:0; bottom:0; height:38%; background:conic-gradient(#ff4d6d 25%, #4d9dff 0 50%, #ffd400 0 75%, #4dd36b 0) 0 0 / 25% 50%; opacity:.35; transition:opacity .15s; }
  .do-stage.flash .do-floor { opacity:.9; }
  .do-stage.party .do-floor { animation:do-party .25s steps(2) infinite; }
  .do-ball { position:absolute; left:50%; top:-4px; width:44px; height:44px; margin-left:-22px; border-radius:50%; border:3px solid #111; z-index:1;
    background:repeating-conic-gradient(#eee 0 15deg, #9aa 15deg 30deg); animation:do-spin 3s linear infinite; }
  .do-grid { position:relative; width:var(--gs); height:var(--gs); display:grid; grid-template-columns:repeat(3, 1fr); grid-template-rows:repeat(3, 1fr); gap:6px; z-index:2; }
  .do-pad { position:relative; border:5px solid #111; border-radius:18px; box-shadow:0 6px 0 #111; background:var(--pc); padding:0; font:inherit; cursor:pointer; touch-action:manipulation;
    display:flex; align-items:center; justify-content:center; }
  .do-pad .arw { position:absolute; font-size:calc(var(--gs) * .07); color:#111; opacity:.55; line-height:1; }
  .do-pad.up .arw { top:3%; } .do-pad.down .arw { bottom:3%; } .do-pad.left .arw { left:5%; } .do-pad.right .arw { right:5%; }
  .do-sign { min-width:62%; max-width:92%; padding:2px 6px; background:#fff; border:4px solid #111; border-radius:12px; color:#111; font-size:calc(var(--gs) * .11); line-height:1.15; white-space:nowrap; overflow:hidden; text-align:center; }
  .do-sign.pic { font-size:calc(var(--gs) * .12); }
  .do-pad:active { transform:translateY(4px); box-shadow:0 2px 0 #111; }
  .do-pad.flip .do-sign { animation:do-flip .3s ease-out; }
  .do-pad.lit { filter:brightness(1.3); box-shadow:0 0 0 5px #fff, 0 6px 0 #111; }
  .do-pad.bad { animation:do-shake .3s linear; filter:grayscale(.7); }
  .do-pad.right-ans { animation:do-glow .5s ease-in-out infinite alternate; }
  .do-pad.dim { opacity:.35; }
  /* The dancer: an orange monster (googly eyes, grin, arms and legs) in the middle cell */
  .do-me { position:relative; align-self:center; justify-self:center; width:90%; height:90%; }
  .do-body { position:absolute; left:20%; top:12%; width:60%; height:62%; background:#ff8a1f; border:4px solid #111; border-radius:46% 46% 40% 40%; z-index:2; transition:transform .15s; }
  .do-eye { position:absolute; top:20%; width:30%; height:30%; border-radius:50%; background:#fff; border:3px solid #111; overflow:hidden; }
  .do-eye i { position:absolute; left:28%; top:28%; width:46%; height:46%; border-radius:50%; background:#111; animation:do-roll 1.4s ease-in-out infinite alternate; }
  .do-eye.l { left:14%; } .do-eye.r { right:12%; width:34%; height:34%; }
  .do-mouth { position:absolute; left:26%; top:58%; width:48%; height:24%; background:#5a0f1e; border:3px solid #111; border-radius:10% 10% 50% 50% / 14% 14% 86% 86%; overflow:hidden; }
  .do-mouth::after { content:""; position:absolute; left:8%; right:8%; top:0; height:30%; background:#fff; }
  .do-arm { position:absolute; top:34%; width:32%; height:10%; background:#ff8a1f; border:4px solid #111; border-radius:99px; z-index:1; transition:transform .15s; }
  .do-arm.l { left:2%; transform-origin:100% 50%; transform:rotate(-30deg); } .do-arm.r { right:2%; transform-origin:0 50%; transform:rotate(30deg); }
  .do-leg { position:absolute; top:68%; width:12%; height:28%; background:#ff8a1f; border:4px solid #111; border-radius:99px; transition:transform .15s; transform-origin:50% 0; }
  .do-leg.l { left:32%; } .do-leg.r { right:32%; }
  .do-me.p-up .do-arm.l { transform:rotate(60deg); } .do-me.p-up .do-arm.r { transform:rotate(-60deg); } .do-me.p-up { animation:do-jump .4s ease-out; }
  .do-me.p-left .do-body { transform:rotate(-18deg) translateX(-8%); } .do-me.p-left .do-arm.l { transform:rotate(0deg) translateX(-14%); } .do-me.p-left .do-arm.r { transform:rotate(-70deg); } .do-me.p-left .do-leg.r { transform:rotate(-30deg); }
  .do-me.p-right .do-body { transform:rotate(18deg) translateX(8%); } .do-me.p-right .do-arm.r { transform:rotate(0deg) translateX(14%); } .do-me.p-right .do-arm.l { transform:rotate(70deg); } .do-me.p-right .do-leg.l { transform:rotate(30deg); }
  .do-me.p-down .do-body { transform:translateY(16%) scale(1.08, .88); } .do-me.p-down .do-arm.l { transform:rotate(-10deg) translateY(120%); } .do-me.p-down .do-arm.r { transform:rotate(10deg) translateY(120%); }
  .do-me.p-down .do-leg.l { transform:rotate(40deg) scaleY(.7); } .do-me.p-down .do-leg.r { transform:rotate(-40deg) scaleY(.7); }
  .do-me.trip { animation:do-trip .5s ease-in forwards; }
  .do-me.trip .do-eye i { animation:do-dizzy .4s linear infinite; }
  .do-me.yay { animation:do-twirl .6s ease-in-out 2; }
  .do-me.sad .do-mouth { border-radius:50% 50% 10% 10% / 86% 86% 14% 14%; height:14%; top:64%; }
  .do-me.sad .do-mouth::after { display:none; }
  .do-robot { position:absolute; right:2%; top:2%; z-index:3; pointer-events:none; }
  .do-fx { position:absolute; inset:0; pointer-events:none; z-index:8; }
  .do-word { position:absolute; left:50%; top:30%; transform:translate(-50%, -50%); font-size:2.2rem; color:#ffd400; -webkit-text-stroke:2px #111; text-shadow:0 4px 0 #111;
    white-space:nowrap; animation:do-word .8s ease-out forwards; }
  .do-word.bad { color:#ff4d6d; }
  @keyframes do-spin { to { transform:rotate(360deg); } }
  @keyframes do-party { 50% { filter:hue-rotate(180deg); opacity:.9; } }
  @keyframes do-flip { from { transform:rotateX(90deg); } }
  @keyframes do-shake { 25% { transform:translateX(-6px); } 75% { transform:translateX(6px); } }
  @keyframes do-glow { from { box-shadow:0 0 0 4px #fff, 0 6px 0 #111; } to { box-shadow:0 0 0 10px #fff, 0 0 30px #fff; } }
  @keyframes do-roll { 0% { transform:translate(-30%, -20%); } 100% { transform:translate(30%, 25%); } }
  @keyframes do-dizzy { from { transform:rotate(0) translate(30%); } to { transform:rotate(360deg) translate(30%); } }
  @keyframes do-jump { 50% { transform:translateY(-14%); } }
  @keyframes do-trip { 30% { transform:rotate(-20deg); } 100% { transform:rotate(90deg) translate(20%, -10%) scale(.85); } }
  @keyframes do-twirl { 50% { transform:rotate(180deg) scale(1.15); } 100% { transform:rotate(360deg); } }
  @keyframes do-word { from { opacity:1; transform:translate(-50%, -50%) rotate(-8deg) scale(.5); } 30% { transform:translate(-50%, -60%) rotate(-8deg) scale(1.15); }
    to { opacity:0; transform:translate(-50%, -110%) rotate(-8deg); } }
  @media (prefers-reduced-motion: reduce) { .do-stage::before, .do-ball, .do-eye i, .do-me, .do-stage.party .do-floor { animation:none !important; } }
  `;
  let cssDone = false;
  function injectCss() {
    if (cssDone) return;
    cssDone = true;
    const s = document.createElement("style");
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  registerMicrogame({
    id: "dance-off",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 12000, // (10 s was too hard at MEDIUM and HARD speeds)
    input: "tap",
    tutorial: true,
    bossArt: true, // Boss Battle: draws the boss itself when it's fought (ctx.boss, Boss.fighting)
    start(ctx) {
      injectCss();
      const speed = ctx.speed || 1;
      const { tone, sweep, noise } = ctx.sfx;
      const R = speed >= 1.5 ? 4 : 3;
      const C = ctx.choiceRows(R, 4, { lowercase: true });
      const robotBattle = ctx.boss && ctx.boss.id === "robot" && window.Boss;

      // ---------- DOM ----------
      const wrap = document.createElement("div");
      wrap.className = "do";
      const top = document.createElement("div");
      top.className = "do-top";
      const card = document.createElement("button");
      card.className = "do-card";
      card.setAttribute("aria-label", TEXT.cardLabel);
      card.innerHTML = '<span class="ct"></span>';
      card.firstChild.textContent = C.cardText;
      if (ctx.canSpeak && !C.listen) card.insertAdjacentHTML("beforeend", '<span class="spk">🔊</span>');
      card.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });
      const pips = document.createElement("div");
      pips.className = "do-pips";
      pips.innerHTML = '<span class="do-pip"></span>'.repeat(R) + '<span class="do-life">❤️</span>'; // one mistake allowed
      top.append(card, pips);
      const stage = document.createElement("div");
      stage.className = "do-stage";
      stage.innerHTML = '<div class="do-floor"></div><div class="do-ball"></div>';
      const grid = document.createElement("div");
      grid.className = "do-grid";
      const fx = document.createElement("div");
      fx.className = "do-fx";
      stage.append(grid, fx);
      wrap.append(top, stage);
      ctx.root.appendChild(wrap);

      const me = document.createElement("div");
      me.className = "do-me";
      me.style.gridColumn = "2"; me.style.gridRow = "2";
      me.innerHTML = '<div class="do-arm l"></div><div class="do-arm r"></div><div class="do-leg l"></div><div class="do-leg r"></div>' +
        '<div class="do-body"><div class="do-eye l"><i></i></div><div class="do-eye r"><i></i></div><div class="do-mouth"></div></div>';
      grid.appendChild(me);
      const pads = PADS.map((p) => {
        const el = document.createElement("button");
        el.className = `do-pad ${p.dir}`;
        el.style.setProperty("--pc", p.color);
        el.style.gridColumn = String(p.c + 1); el.style.gridRow = String(p.r + 1);
        el.innerHTML = `<span class="arw" aria-hidden="true">${p.arrow}</span><span class="do-sign"></span>`;
        el.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); dance(pad); });
        el.addEventListener("click", (e) => { if (e.detail === 0) dance(pad); });
        grid.appendChild(el);
        const pad = { ...p, el, sign: el.querySelector(".do-sign"), opt: null };
        return pad;
      });
      let robot = null;
      if (robotBattle) { robot = window.Boss.el("robot", 80); robot.classList.add("do-robot"); stage.appendChild(robot); }

      // ---------- Layout ----------
      let gs = 300;
      function layout() {
        gs = Math.max(200, Math.min(stage.clientWidth - 16, stage.clientHeight - 16, 520));
        stage.style.setProperty("--gs", `${gs}px`);
        if (robot) robot.style.setProperty("--bs", `${Math.round(gs * 0.28)}px`);
        pads.forEach(fitSign);
      }
      function fitSign(p) {
        if (!p.opt) return;
        p.sign.style.fontSize = p.opt.kind === "word" ? `${Math.min(gs * 0.11, (gs * 0.27) / (p.opt.text.length * 0.62))}px` : "";
      }

      // ---------- Moves ----------
      let step = 0, done = false, busy = false, slips = 0;
      function showRow(flip) {
        const row = ctx.shuffle(C.rows[step].slice());
        pads.forEach((p, i) => {
          p.opt = row[i];
          p.sign.textContent = p.opt.text;
          p.sign.classList.toggle("pic", p.opt.kind === "pic");
          fitSign(p);
          p.el.setAttribute("aria-label", TEXT.padLabel(p.opt.spoken));
          if (flip) { p.el.classList.remove("flip"); void p.el.offsetWidth; p.el.classList.add("flip"); }
        });
      }
      function pose(dir) {
        me.classList.remove("p-up", "p-left", "p-right", "p-down");
        void me.offsetWidth;
        if (dir) me.classList.add(`p-${dir}`);
      }
      function dance(p) {
        if (done || busy || ctx.ended) return;
        if (!p.opt.right) return slips++ < 1 ? stumble(p) : trip(p); // the first mistake is only a stumble
        busy = true;
        pose(p.dir);
        p.el.classList.add("lit");
        stage.classList.add("flash");
        const base = [262, 294, 330, 392][PADS.indexOf(PADS.find((q) => q.dir === p.dir))];
        tone(base, 0.12, "square", 0.09); tone(base * 1.5, 0.12, "square", 0.07, 0.06); tone(base * 2, 0.16, "triangle", 0.08, 0.12);
        noise(0.05, "highpass", 6000, 8000, 0.15);
        word(TEXT.good[step % TEXT.good.length], false);
        if (p.opt.kind === "pic") ctx.say(p.opt.spoken);
        pips.children[step].classList.add("on");
        if (robot) { window.Boss.setMood(robot, "hurt"); for (let i = 0; i < 3; i++) tone(800 + Math.random() * 1200, 0.04, "square", 0.05, i * 0.05); }
        step++;
        ctx.later(() => {
          p.el.classList.remove("lit");
          stage.classList.remove("flash");
          if (step >= R) { win(); return; }
          pose(null);
          showRow(true);
          busy = false;
        }, 420);
      }
      // The first wrong pad: the monster stumbles, the ❤️ breaks, and the same move comes back reshuffled.
      function stumble(p) {
        busy = true;
        p.el.classList.add("bad");
        sweep(500, 200, 0.2, "sawtooth", 0.08);
        me.classList.remove("stumble"); void me.offsetWidth; me.classList.add("stumble");
        pips.querySelector(".do-life").classList.add("lost");
        word(TEXT.scratch, true);
        if (robot) window.Boss.setMood(robot, "laugh");
        ctx.later(() => {
          p.el.classList.remove("bad");
          me.classList.remove("stumble");
          if (robot) window.Boss.setMood(robot, null);
          if (done) return;
          showRow(true);
          busy = false;
        }, 600);
      }
      function trip(p) {
        done = true;
        ctx.lose();
        p.el.classList.add("bad");
        sweep(900, 120, 0.35, "sawtooth", 0.1); noise(0.3, "bandpass", 1800, 300, 0.3); // record scratch
        me.classList.add("trip", "sad");
        word(TEXT.scratch, true);
        if (robot) window.Boss.setMood(robot, "laugh");
        ctx.later(() => { showRight(); ctx.say(C.answer); }, 450);
      }
      function win() {
        done = true;
        ctx.win();
        pose(null);
        me.classList.add("yay");
        stage.classList.add("party");
        [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.14, "square", 0.08, i * 0.08));
        ctx.confetti(fx, stage.clientWidth / 2, stage.clientHeight * 0.4, { count: 100 });
        if (robot) window.Boss.setMood(robot, "angry");
        ctx.say(C.answer);
      }
      function word(text, bad) {
        const w = document.createElement("div");
        w.className = "do-word" + (bad ? " bad" : "");
        w.textContent = text;
        fx.appendChild(w);
        ctx.later(() => w.remove(), 820);
      }
      function showRight() { pads.forEach((p) => p.el.classList.add(p.opt.right ? "right-ans" : "dim")); }
      function replay() { if (!done) ctx.say(C.prompt); }

      ctx.onTimeout(() => { done = true; me.classList.add("sad"); showRight(); ctx.say(C.answer); });
      function onKey(e) {
        const byKey = pads.find((p) => p.key === e.key);
        const i = parseInt(e.key, 10) - 1;
        if (byKey) { e.preventDefault(); dance(byKey); }
        else if (i >= 0 && i < 4) { e.preventDefault(); dance(pads[i]); }
        else if (e.key === " ") { e.preventDefault(); replay(); }
      }
      document.addEventListener("keydown", onKey);

      showRow(false);
      layout();
      const ro = new ResizeObserver(layout);
      ro.observe(stage);
      ctx.say(C.prompt);
      ctx.reveal(card);

      // Tutorial: point at the card, then tap the right pad for each move.
      ctx.tutorial(C.target, async (f) => {
        await f.point(card);
        for (let n = 0; n < R && !done; n++) {
          await f.until(() => !busy && step === n, 3000);
          await f.tap(() => pads.find((p) => p.opt.right).el);
          await f.until(() => step > n || done, 2000);
        }
      });

      return () => { done = true; ro.disconnect(); document.removeEventListener("keydown", onKey); };
    },
  });
})();
