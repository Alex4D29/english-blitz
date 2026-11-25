// RECYCLING ROBOT — a quick-sort game (Claude's idea, named by the teacher; groups from `ctx.sortSets`). A friendly
// sorting robot stands at the top of a chute; bits of junk (a can, a bottle, a box) drop out one at a time, each
// with a letter, picture or word. Two big recycling bins wait below, one each side, each with a label. Flick the
// junk into the right bin (or tap the bin, or ← →): CLUNK, the bin burps happily. A wrong bin: the robot JAMS
// (sparks, its head spins, a ⚙️ pops off) and the junk bounces back, ✕. Sort it all to win; 3 jams lose.
(function () {
  const TEXT = {
    name: { en: "Recycling Robot" },
    icon: "♻️",
    howTo: { en: {
      steps: [
        ["♻️", "Look at the two bins. Each one takes a different letter."],
        ["🥫", "The robot drops some junk. Flick it into the right bin (or tap the bin)."],
        ["🤖", "Sort it all!"],
      ],
      tips: ["The wrong bin jams the robot! Three jams and it's over.", "Arrow keys work too.", "When the game speeds up, there's more junk."],
    } },
    instruction: { en: "SORT IT!" },
    binLabel: (t) => `Bin for ${t}`,
    clunk: ["CLUNK!", "BEEP BOOP!", "SORTED!", "NICE!"],
    jam: "JAMMED!",
    clean: "ALL CLEAN!",
  };
  const MISSES = 3;
  const JUNK = ["🥫", "🧃", "📦", "🍼", "🥡"];

  const CSS = `
  .rcy { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:6px; padding-bottom:6px; }
  .rcy-top { flex:none; display:flex; gap:12px; align-items:center; min-height:28px; }
  .rcy-left { font-size:1.1rem; padding:2px 10px; background:#fff; border:3px solid #111; border-radius:99px; }
  .rcy-pips { display:flex; gap:5px; }
  .rcy-pip { width:24px; height:24px; border:3px solid #111; border-radius:50%; background:#fff; }
  .rcy-pip.x { background:#ffd400; } .rcy-pip.x::after { content:"⚙️"; display:block; text-align:center; font-size:12px; line-height:18px; }
  .rcy-room { position:relative; flex:1; min-height:0; width:100%; max-width:620px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111;
    background:linear-gradient(180deg, #d7e8f0 0 70%, #8fa0a8 70%); touch-action:none; }
  .rcy-room::before { content:""; position:absolute; left:0; right:0; top:0; height:14px; background:repeating-linear-gradient(-45deg, #ffd400 0 12px, #111 12px 24px); }
  /* The robot at the top (--rz): a box head with a screen face, a little antenna, and its chute */
  .rcy-bot { position:absolute; left:50%; top:4%; width:var(--rz); height:var(--rz); margin-left:calc(var(--rz) / -2); z-index:3; }
  .rcy-bot > * { position:absolute; box-sizing:border-box; }
  .rcy-head { left:10%; right:10%; top:12%; bottom:20%; background:#9fb3c8; border:4px solid #111; border-radius:14px; transition:transform .3s; }
  .rcy-face { left:20%; right:20%; top:26%; bottom:32%; background:#1d2a3a; border:3px solid #111; border-radius:8px; z-index:2; }
  .rcy-eye { top:36%; width:14%; height:12%; background:#7cf0ff; border-radius:50%; z-index:3; box-shadow:0 0 8px #7cf0ff; }
  .rcy-eye.l { left:32%; } .rcy-eye.r { right:32%; }
  .rcy-smile { left:38%; right:38%; top:52%; height:8%; border-bottom:3px solid #7cf0ff; border-radius:0 0 99px 99px; z-index:3; }
  .rcy-ant { left:48%; top:0; width:4%; height:14%; background:#555; }
  .rcy-ant::after { content:""; position:absolute; left:-110%; top:-60%; width:320%; aspect-ratio:1; border-radius:50%; background:#4dd36b; border:2px solid #111; }
  .rcy-chute { left:30%; right:30%; bottom:0; height:22%; background:#6b7c8c; border:4px solid #111; border-top:0; border-radius:0 0 8px 8px; }
  .rcy-bot.jam .rcy-head { animation:rcy-spin .5s ease-in-out; } .rcy-bot.jam .rcy-eye { background:#ff4d6d; box-shadow:0 0 8px #ff4d6d; }
  .rcy-bot.jam .rcy-smile { border-bottom:0; border-top:3px solid #ff4d6d; border-radius:99px 99px 0 0; }
  .rcy-bot.happy .rcy-eye { height:6%; top:40%; }
  /* The junk (--jz): an emoji with its label */
  .rcy-junk { position:absolute; left:50%; top:0; width:var(--jz); height:var(--jz); margin-left:calc(var(--jz) / -2); z-index:4; pointer-events:none;
    display:flex; flex-direction:column; align-items:center; justify-content:center; }
  .rcy-junk i { font-style:normal; line-height:1; filter:drop-shadow(0 3px 0 rgba(0,0,0,.3)); }
  .rcy-junk b { margin-top:-8%; padding:2px 8px; background:#fff; border:3px solid #111; border-radius:8px; font-weight:900; color:#111; line-height:1.1; white-space:nowrap; }
  .rcy-junk u { text-decoration:none; line-height:1; }
  /* A recycling bin (--bz): a green or blue bin with the ♻️ sign and its label */
  .rcy-bin { position:absolute; bottom:3%; width:var(--bz); height:calc(var(--bz) * 1.05); z-index:3; cursor:pointer; touch-action:none; }
  .rcy-bin.l { left:6%; } .rcy-bin.r { right:6%; }
  .rcy-bin > * { position:absolute; box-sizing:border-box; pointer-events:none; }
  .rcy-can { left:6%; right:6%; top:14%; bottom:0; background:var(--c); border:4px solid #111; border-radius:6px 6px 14px 14px;
    background-image:repeating-linear-gradient(90deg, transparent 0 18%, rgba(0,0,0,.14) 18% 22%); }
  .rcy-lid { left:0; right:0; top:4%; height:14%; background:var(--c); border:4px solid #111; border-radius:8px; transform-origin:10% 100%; transition:transform .2s; filter:brightness(.85); }
  .rcy-bin.open .rcy-lid { transform:rotate(-40deg); }
  .rcy-tag { left:16%; right:16%; top:36%; height:40%; background:#fff; border:3px solid #111; border-radius:8px; z-index:2; display:flex; align-items:center; justify-content:center;
    font-weight:900; color:#111; line-height:1; white-space:nowrap; }
  .rcy-tag::before { content:"♻️"; position:absolute; top:-62%; font-size:calc(var(--bz) * .16); }
  .rcy-bin.yum { animation:rcy-hop .2s ease-in-out 2 alternate; }
  .rcy-bin.hint .rcy-tag { box-shadow:0 0 0 4px #fff, 0 0 0 8px #00b86b; }
  .rcy-arrow { position:absolute; top:52%; font-size:2.4rem; color:rgba(0,0,0,.22); font-weight:900; animation:rcy-nudge .6s ease-in-out infinite alternate; }
  .rcy-arrow.l { left:32%; } .rcy-arrow.r { right:32%; animation-direction:alternate-reverse; }
  .rcy-fx { position:absolute; inset:0; pointer-events:none; z-index:8; overflow:visible; }
  .rcy-pop { position:absolute; line-height:1; transform:translate(-50%, -50%); pointer-events:none; }
  .rcy-word { position:absolute; transform:translate(-50%, -50%) rotate(-8deg); font-size:1.9rem; color:#7cf0ff; -webkit-text-stroke:2px #111; paint-order:stroke fill;
    text-shadow:0 4px 0 #111; white-space:nowrap; animation:rcy-word 1s ease-out forwards; }
  .rcy-word.bad { color:#ff4d6d; }
  @keyframes rcy-spin { 50% { transform:rotate(200deg); } to { transform:rotate(360deg); } }
  @keyframes rcy-hop { to { translate:0 -8%; } }
  @keyframes rcy-nudge { to { translate:-8px 0; } }
  @keyframes rcy-word { from { opacity:1; scale:.5; } 25% { scale:1.15; } 75% { opacity:1; } to { opacity:0; translate:0 -40px; } }
  @media (prefers-reduced-motion: reduce) { .rcy-bot.jam .rcy-head, .rcy-bin.yum, .rcy-arrow, .rcy-word { animation:none !important; } }
  `;
  function injectCss() { if (document.getElementById("rcy-css")) return; const s = document.createElement("style"); s.id = "rcy-css"; s.textContent = CSS; document.head.appendChild(s); }

  registerMicrogame({
    id: "recycling-robot",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 18000,
    input: "slice",
    tutorial: true,

    start(ctx) {
      injectCss();
      const speed = ctx.speed || 1;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const { tone, sweep, noise } = ctx.sfx;
      const G = ctx.sortSets(speed >= 1.5 ? 8 : 6);
      const queue = G.items.slice();

      const wrap = document.createElement("div");
      wrap.className = "rcy";
      wrap.innerHTML = `<div class="rcy-top"><span class="rcy-left">♻️ <b>${queue.length}</b></span><div class="rcy-pips">${'<span class="rcy-pip"></span>'.repeat(MISSES)}</div></div>`;
      const room = document.createElement("div");
      room.className = "rcy-room";
      room.innerHTML = '<div class="rcy-arrow l">◀</div><div class="rcy-arrow r">▶</div>';
      const bot = document.createElement("div");
      bot.className = "rcy-bot";
      bot.innerHTML = '<div class="rcy-ant"></div><div class="rcy-chute"></div><div class="rcy-head"></div><div class="rcy-face"></div><div class="rcy-eye l"></div><div class="rcy-eye r"></div><div class="rcy-smile"></div>';
      const bins = G.bins.map((b, i) => {
        const el = document.createElement("div");
        el.className = `rcy-bin ${i ? "r" : "l"}`;
        el.style.setProperty("--c", i ? "#3d8bfd" : "#4dd36b");
        el.setAttribute("aria-label", TEXT.binLabel(b.say));
        el.innerHTML = '<div class="rcy-can"></div><div class="rcy-lid"></div><div class="rcy-tag"></div>';
        el.querySelector(".rcy-tag").textContent = b.text;
        room.appendChild(el);
        el.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); send(i); });
        return el;
      });
      const junk = document.createElement("div");
      junk.className = "rcy-junk";
      const fx = document.createElement("div");
      fx.className = "rcy-fx";
      room.append(bot, junk, fx);
      wrap.appendChild(room);
      ctx.root.appendChild(wrap);
      const leftEl = wrap.querySelector(".rcy-left b"), missPips = wrap.querySelector(".rcy-pips").children;

      let W = 0, H = 0, rz = 100, jz = 100, bz = 130;
      function layout() {
        W = room.clientWidth; H = room.clientHeight;
        rz = Math.max(70, Math.min(H * 0.24, W * 0.22, 120));
        jz = Math.max(76, Math.min(W * 0.24, H * 0.26, 130));
        bz = Math.max(100, Math.min(W * 0.3, H * 0.36, 170));
        room.style.setProperty("--rz", `${rz}px`); room.style.setProperty("--jz", `${jz}px`); room.style.setProperty("--bz", `${bz}px`);
        bins.forEach((b, i) => { b.querySelector(".rcy-tag").style.fontSize = `${Math.min(bz * 0.24, (bz * 0.56) / ([...G.bins[i].text].length * 0.62))}px`; });
        if (cur) dress();
        if (cur && !busy) junk.style.transform = `translateY(${restY()}px)`;
      }
      const restY = () => H * 0.04 + rz + 6;

      let cur = null, done = false, busy = true, missN = 0, sorted = 0;
      function dress() {
        junk.innerHTML = "<i></i><b></b><u></u>";
        const i = junk.querySelector("i"), b = junk.querySelector("b"), u = junk.querySelector("u");
        i.textContent = cur.look; i.style.fontSize = `${jz * 0.46}px`;
        b.textContent = cur.text;
        b.style.fontSize = `${cur.kind === "pic" ? jz * 0.3 : Math.min(jz * 0.28, (jz * 0.9) / ([...cur.text].length * 0.62))}px`;
        u.textContent = cur.kind === "word" && cur.pic ? cur.pic : ""; u.style.fontSize = `${jz * 0.18}px`;
      }
      function next() {
        cur = queue.shift();
        if (!cur) return;
        cur.look = JUNK[(sorted + missN) % JUNK.length];
        dress();
        junk.style.opacity = "1";
        bot.classList.remove("happy");
        junk.animate([{ transform: `translateY(${restY() - jz * 0.8}px) scale(.4)`, opacity: 0 }, { transform: `translateY(${restY()}px)`, opacity: 1 }], { duration: reduceMotion ? 1 : 380, easing: "cubic-bezier(.3,1.6,.5,1)", fill: "forwards" });
        sweep(600, 300, 0.15, "square", 0.05);   // ka-chunk out of the chute
        ctx.later(() => { busy = false; if (cur && cur.kind !== "letter") ctx.say(cur.spoken); }, reduceMotion ? 10 : 400);
      }
      function send(i) {
        if (done || busy || ctx.ended || !cur) return;
        busy = true;
        const b = bins[i], br = b.getBoundingClientRect(), rr = room.getBoundingClientRect();
        const dx = br.left - rr.left + br.width / 2 - W / 2, dy = br.top - rr.top + br.height * 0.1 - restY() - jz * 0.3;
        b.classList.add("open");
        junk.animate([{ transform: `translateY(${restY()}px)` }, { transform: `translate(${dx * 0.6}px, ${restY() + dy * 0.2}px) rotate(${i ? 90 : -90}deg)`, offset: 0.4 },
          { transform: `translate(${dx}px, ${restY() + dy}px) scale(.5) rotate(${i ? 200 : -200}deg)` }], { duration: reduceMotion ? 1 : 420, easing: "ease-in", fill: "forwards" });
        sweep(500, 900, 0.15, "triangle", 0.06);
        ctx.later(() => { b.classList.remove("open"); if (cur.bin === i) clunk(b, i); else jam(b, i, dx, dy); }, reduceMotion ? 10 : 430);
      }
      function clunk(b, i) {
        junk.style.opacity = "0";
        b.classList.remove("yum"); void b.offsetWidth; b.classList.add("yum");
        bot.classList.add("happy");
        noise(0.08, "lowpass", 500, 200, 0.4); tone(660, 0.06, "square", 0.07, 0.08); tone(990, 0.08, "square", 0.07, 0.16);   // CLUNK, beep boop
        word(TEXT.clunk[sorted % TEXT.clunk.length], false, i ? W * 0.78 : W * 0.22, H * 0.5);
        sorted++;
        leftEl.textContent = queue.length;
        if (!queue.length) { done = true; ctx.win(); allClean(); return; }
        ctx.later(next, 250);
      }
      // A wrong bin: the robot jams (sparks, its head spins, a cog pops off) and the junk bounces back.
      function jam(b, i, dx, dy) {
        bot.classList.remove("jam", "happy"); void bot.offsetWidth; bot.classList.add("jam");
        noise(0.3, "highpass", 2000, 5000, 0.35); sweep(900, 150, 0.5, "sawtooth", 0.08);   // grrrzzzt
        word(TEXT.jam, true, W / 2, H * 0.08 + rz);
        if (cur.kind !== "letter") ctx.say(cur.spoken);
        const br = bot.getBoundingClientRect(), rr = room.getBoundingClientRect();
        ["⚡", "⚙️", "⚡", "🔩"].forEach((e, k) => pop(e, br.left - rr.left + br.width / 2, br.top - rr.top + br.height * 0.4, k));
        missPips[missN].classList.add("x");
        missN++;
        junk.animate([{ transform: `translate(${dx}px, ${restY() + dy}px) scale(.5)` }, { transform: `translate(${dx * 0.5}px, ${restY() - jz * 0.3}px) rotate(${i ? -60 : 60}deg)`, offset: 0.5 }, { transform: `translateY(${restY()}px)` }],
          { duration: reduceMotion ? 1 : 520, easing: "ease-out", fill: "forwards" });
        ctx.later(() => bot.classList.remove("jam"), 600);
        if (missN >= MISSES) { done = true; ctx.lose(); ctx.later(showAnswer, 540); return; }
        ctx.later(() => { busy = false; }, 540);
      }
      function pop(e, x, y, k) {
        if (reduceMotion) return;
        const p = document.createElement("div");
        p.className = "rcy-pop"; p.textContent = e; p.style.fontSize = `${rz * 0.26}px`;
        p.style.left = `${x}px`; p.style.top = `${y}px`;
        fx.appendChild(p);
        const a = -Math.PI / 2 + (k - 1.5) * 0.6;
        p.animate([{ transform: "translate(-50%, -50%) scale(.4)" }, { transform: `translate(calc(-50% + ${Math.cos(a) * 80}px), calc(-50% + ${Math.sin(a) * 60 + 40}px)) rotate(240deg)`, opacity: 0 }], { duration: 800, fill: "forwards" });
        ctx.later(() => p.remove(), 820);
      }
      function allClean() {
        [523, 659, 784, 1047].forEach((f, k) => tone(f, 0.12, "square", 0.08, 0.2 + k * 0.08));
        word(TEXT.clean, false, W / 2, H * 0.42);
        ctx.confetti(fx, W / 2, H * 0.4, { count: 80 });
      }
      function showAnswer() { if (cur) bins[cur.bin].classList.add("hint"); }
      function word(text, bad, x, y) {
        const w = document.createElement("div");
        w.className = "rcy-word" + (bad ? " bad" : "");
        w.textContent = text;
        w.style.left = `${Math.max(80, Math.min(W - 80, x))}px`; w.style.top = `${Math.max(26, y)}px`;
        fx.appendChild(w);
        ctx.later(() => w.remove(), 1000);
      }

      let start = null;
      room.addEventListener("pointerdown", (e) => { e.preventDefault(); start = { x: e.clientX, y: e.clientY }; });
      room.addEventListener("pointermove", (e) => {
        if (!start) return;
        const dx = e.clientX - start.x;
        if (Math.abs(dx) > 30) { start = null; send(dx < 0 ? 0 : 1); }
      });
      room.addEventListener("pointerup", () => { start = null; });
      function onKey(e) {
        if (e.key === "ArrowLeft") { e.preventDefault(); send(0); } else if (e.key === "ArrowRight") { e.preventDefault(); send(1); }
        else if (e.key === " ") { e.preventDefault(); if (cur) ctx.say(cur.spoken); }
      }
      document.addEventListener("keydown", onKey);

      ctx.onTimeout(() => { done = true; showAnswer(); });

      layout();
      const ro = new ResizeObserver(layout);
      ro.observe(room);
      ctx.say(`${G.bins[0].say}, ${G.bins[1].say}`);
      ctx.later(next, 300);
      ctx.later(() => ctx.hint({ x: room.offsetLeft + W * 0.5, y: room.offsetTop + H * 0.6 }, { x: room.offsetLeft + W * 0.3, y: room.offsetTop + H * 0.6 }, { small: true }), 900);

      // Tutorial: tap the right bin for each piece of junk.
      ctx.tutorial(null, async (f) => {
        for (let n = 0; n < G.items.length && !done; n++) {
          await f.until(() => !busy && cur, 3000);
          const c = cur;
          await f.tap(bins[c.bin]);
          await f.until(() => cur !== c || done, 2000);
        }
      });
      return () => { done = true; ro.disconnect(); document.removeEventListener("keydown", onKey); };
    },
  });
})();
