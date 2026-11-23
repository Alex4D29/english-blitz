// MONSTER BOXING — a first-person listening game. Your two big red gloves are at the bottom of the screen,
// and a silly monster boxer bobs and weaves in the ring. Tap the 🔔 bell to hear the target (it's never
// shown). The monster wears three pads, on its head and on each side of its belly, each with an option
// (a row from ctx.choiceRows: ABC letters, phonics pictures (a different picture each punch), CVC
// pictures, HFW words). Tap a pad: the glove on that side punches it. Right: POW!, the face squishes and
// it sees stars, a hit pip, and the pads change. Wrong: it blocks with its gloves or dodges to the side
// ("NOPE!"), a miss pip, and the same choice comes back reshuffled. 3 hits: K.O.!, it falls over,
// confetti. 3 misses: YOU get knocked out (red flash, shake, stars spin over your view) while it flexes
// and gloats. Faster speeds: it bobs and weaves faster and wider.
(function () {
  const TEXT = {
    name: { en: "Monster Boxing" },
    icon: "🥊",
    howTo: (list) => {
      const what = list.type === "phonics" ? "a picture that starts with that letter"
        : list.type === "letter" ? "that letter" : list.type === "cvc" ? "the picture of that word" : "that word";
      return { en: {
        steps: [
          ["🔔", "Listen! Tap the bell to hear it."],
          ["🎯", `Find the pad on the monster with ${what}.`],
          ["🥊", "Tap it to punch! POW!"],
          ["🔁", "Ding! Then listen for the next one and punch that. Three punches and it's a knockout!"],
        ],
        tips: [
          "A wrong pad: the monster blocks or dodges. Three misses and YOU get knocked out!",
          "The pads change after every punch.",
          "When the game speeds up, the monster moves around more.",
        ],
      } };
    },
    instruction: { en: "KNOCK IT\nOUT!" },
    bellLabel: "Hear it again",
    padLabel: (t) => `Punch ${t}`,
    pow: ["POW!", "BAM!", "WHAM!"],
    block: "BLOCKED!",
    dodge: "MISSED!",
    ko: "K.O.!",
    haha: "HA HA!",
  };

  const CSS = `
  .box { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:6px; padding-bottom:4px; }
  .box-top { flex:none; display:flex; align-items:center; gap:12px; }
  .box-bell { width:66px; height:66px; border-radius:50%; padding:0; background:#ffd400; border:5px solid #111; box-shadow:0 5px 0 #111; font-size:2rem; line-height:1;
    display:flex; align-items:center; justify-content:center; cursor:pointer; touch-action:manipulation; font-family:inherit; }
  .box-bell.ring { animation:box-ring .3s ease-in-out 2; }
  .box-pips { display:flex; flex-direction:column; gap:6px; }
  .box-row { display:flex; gap:5px; }
  .box-pip { width:24px; height:24px; border:3px solid #111; border-radius:50%; background:#fff; font-size:13px; line-height:1; display:flex; align-items:center; justify-content:center; }
  .box-pip.on { background:#ff4d6d; } .box-pip.on::after { content:"🥊"; }
  .box-pip.miss { background:#444; } .box-pip.miss::after { content:"✕"; color:#fff; font-weight:900; }

  /* The ring: ropes at the back, a canvas floor */
  .box-ring { position:relative; flex:1; min-height:0; width:100%; max-width:560px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111;
    background:linear-gradient(180deg, #2b1d4a 0 18%, #54308a 18% 62%, #e9e2cf 62%); touch-action:manipulation; }
  .box-rope { position:absolute; left:0; right:0; height:7px; background:#e8173c; border-top:2px solid #111; border-bottom:2px solid #111; }
  .box-fx { position:absolute; inset:0; pointer-events:none; overflow:visible; z-index:9; }

  /* The opponent: a big green monster boxer. --mz is its height; anchor: feet centre */
  .box-mon { position:absolute; left:0; top:0; width:calc(var(--mz) * .9); height:var(--mz); margin:calc(var(--mz) * -1) 0 0 calc(var(--mz) * -.45); z-index:3;
    transform-origin:50% 90%; will-change:transform; }
  .box-body { position:absolute; left:8%; right:8%; top:4%; bottom:6%; background:#5fd932; border:5px solid #111; border-radius:46% 46% 38% 38%;
    background-image:radial-gradient(ellipse at 50% 80%, #a8f07e 0 30%, transparent 31%); }
  .box-shorts { position:absolute; left:14%; right:14%; bottom:0; height:16%; background:#1e6bff; border:4px solid #111; border-radius:6px 6px 14px 14px; }
  .box-eye { position:absolute; top:27%; width:24%; aspect-ratio:1; background:#fff; border:4px solid #111; border-radius:50%; z-index:1; }
  .box-eye.l { left:22%; } .box-eye.r { right:22%; width:20%; top:29%; }
  .box-eye i { position:absolute; left:28%; top:30%; width:46%; aspect-ratio:1; background:#111; border-radius:50%; animation:box-goggle 1s ease-in-out infinite; }
  .box-brow { position:absolute; top:24%; width:22%; height:4%; background:#111; border-radius:99px; z-index:2; }
  .box-brow.l { left:22%; transform:rotate(16deg); } .box-brow.r { right:22%; transform:rotate(-16deg); }
  .box-mouth { position:absolute; left:32%; right:32%; top:44%; height:9%; z-index:1; background:#6b1020; border:4px solid #111; border-radius:4px 4px 999px 999px; overflow:hidden; }
  .box-mouth::before { content:""; position:absolute; left:10%; right:10%; top:0; height:40%; background:repeating-linear-gradient(90deg, #fff 0 22%, #111 22% 28%); }
  .box-mglove { position:absolute; top:42%; width:28%; aspect-ratio:1; background:#1e6bff; border:5px solid #111; border-radius:50% 50% 44% 44%; z-index:2;
    transition:transform .15s ease-out; }
  .box-mglove.l { left:-14%; } .box-mglove.r { right:-14%; }
  .box-mon.block .box-mglove.l { transform:translate(70%, -60%) rotate(20deg); }
  .box-mon.block .box-mglove.r { transform:translate(-70%, -60%) rotate(-20deg); }
  .box-mon.hit { animation:box-hit .3s ease-out; }
  .box-mon.hit .box-eye i { animation:box-dizzy .4s linear infinite; }
  .box-mon.hit .box-mouth { left:40%; right:40%; border-radius:50%; }
  .box-mon.ko { transform-origin:50% 100%; }
  .box-mon.ko.landed .box-body { animation:box-thud .35s ease-out; }   /* one bounce on the canvas */
  .box-dizzy.small { transform:translate(-50%, -50%); }
  .box-dizzy.small span { font-size:1.6rem; }
  .box-mon.ko .box-eye i { display:none; }
  .box-mon.ko .box-eye::before, .box-mon.ko .box-eye::after { content:""; position:absolute; left:15%; right:15%; top:44%; height:12%; background:#111; border-radius:9px; }
  .box-mon.ko .box-eye::before { transform:rotate(45deg); } .box-mon.ko .box-eye::after { transform:rotate(-45deg); }
  .box-mon.gloat .box-mouth { height:15%; } .box-mon.gloat .box-mouth::after { content:""; position:absolute; left:24%; right:24%; bottom:-40%; height:80%; background:#ff6f91; border-radius:50%; }
  .box-mon.gloat .box-mglove.l { transform:translate(10%, -90%) rotate(-30deg); } .box-mon.gloat .box-mglove.r { transform:translate(-10%, -90%) rotate(30deg); }
  .box-mon.gloat { animation:box-flex .35s ease-in-out infinite alternate; }

  /* The pads: round targets worn on the monster */
  /* Boss Battle: the boss replaces the monster's drawing (centred on the monster box, feet on the canvas) */
  .box-mon.bossy > :not(.box-boss) { display:none; }
  .box-boss { position:absolute; left:50%; bottom:0; transform:translateX(-50%); }
  .box-pad { position:absolute; transform:translate(-50%, -50%); width:var(--pd); height:var(--pd); padding:0; border-radius:50%; background:#fff; color:#111; font:inherit;
    border:5px solid #111; box-shadow:0 0 0 5px #e8173c, 0 0 0 9px #111; font-size:calc(var(--pd) * .46); line-height:1; display:flex; align-items:center; justify-content:center;
    cursor:pointer; touch-action:manipulation; z-index:4; white-space:nowrap; }
  .box-pad.pic { font-size:calc(var(--pd) * .5); }
  .box-pad.flip { animation:box-flip .3s ease-out; }
  .box-pad.right { background:#b8ffcf; box-shadow:0 0 0 5px #00b86b, 0 0 0 9px #111; animation:box-wiggle .4s ease-in-out 3; }
  .box-pad.dim { opacity:.45; }

  /* Your gloves (first person): big red gloves at the bottom corners */
  .box-glove { position:absolute; bottom:calc(var(--gz) * -.3); width:var(--gz); height:calc(var(--gz) * 1.15); z-index:6; pointer-events:none; will-change:transform; }
  .box-glove.l { left:2%; } .box-glove.r { right:2%; }
  .box-gfist { position:absolute; inset:0 0 22%; background:radial-gradient(circle at 35% 30%, #ff7a7a 0 18%, #e8173c 50%, #b30f2c 100%); border:6px solid #111;
    border-radius:48% 52% 40% 40%; }
  .box-gfist::before { content:""; position:absolute; top:22%; width:34%; height:36%; background:#e8173c; border:5px solid #111; border-radius:50%; }
  .box-glove.l .box-gfist::before { right:-10%; } .box-glove.r .box-gfist::before { left:-10%; }   /* thumbs */
  .box-gcuff { position:absolute; left:12%; right:12%; bottom:0; height:30%; background:#fff; border:6px solid #111; border-radius:8px 8px 14px 14px;
    background-image:linear-gradient(180deg, transparent 40%, #e8173c 40% 60%, transparent 60%); }
  .box-glove { animation:box-guard 1.4s ease-in-out infinite; }
  .box-glove.r { animation-delay:-.7s; }

  .box-word { position:absolute; transform:translate(-50%, -50%) rotate(-8deg); z-index:10; pointer-events:none; font-size:2.4rem; color:#ffd400; -webkit-text-stroke:3px #111;
    paint-order:stroke fill; text-shadow:0 5px 0 #111; white-space:nowrap; animation:box-word .8s ease-out forwards; }
  .box-word.bad { color:#fff; font-size:1.7rem; }
  .box-word.big { font-size:3.6rem; animation:box-pop .35s cubic-bezier(.2,1.8,.4,1) both; }
  .box-star { position:absolute; font-size:1.6rem; pointer-events:none; z-index:8; }
  .box-ring.koed { animation:box-shake .07s linear 8; }
  .box-ring.koed::after { content:""; position:absolute; inset:0; z-index:11; pointer-events:none; background:radial-gradient(circle, transparent 30%, rgba(160,0,20,.75) 100%);
    animation:box-red .6s ease-out both; }
  .box-dizzy { position:absolute; left:50%; top:50%; width:60%; aspect-ratio:1; transform:translate(-50%, -50%); z-index:12; pointer-events:none; animation:box-spin 1.2s linear infinite; }
  .box-dizzy span { position:absolute; font-size:2.4rem; }

  @keyframes box-ring { 25% { rotate:-14deg; } 75% { rotate:14deg; } }
  @keyframes box-goggle { 0%, 100% { transform:translate(-16%, 0); } 50% { transform:translate(16%, -12%); } }
  @keyframes box-dizzy { from { transform:rotate(0) translate(30%); } to { transform:rotate(360deg) translate(30%); } }
  @keyframes box-hit { 30% { scale:1.15 .85; rotate:-6deg; } }
  @keyframes box-flex { from { rotate:-6deg; } to { rotate:6deg; } }
  @keyframes box-flip { from { transform:translate(-50%, -50%) rotateY(90deg); } }
  @keyframes box-wiggle { 25% { rotate:-8deg; } 75% { rotate:8deg; } }
  @keyframes box-guard { 50% { translate:0 -5%; } }
  @keyframes box-word { from { opacity:1; transform:translate(-50%, -50%) rotate(-8deg) scale(.5); } 25% { transform:translate(-50%, -60%) rotate(-8deg) scale(1.2); }
    to { opacity:0; transform:translate(-50%, -100%) rotate(-8deg) scale(1); } }
  @keyframes box-pop { from { transform:translate(-50%, -50%) rotate(-8deg) scale(.2); } }
  @keyframes box-shake { 25% { translate:-8px 3px; } 75% { translate:8px -3px; } }
  @keyframes box-red { from { opacity:0; } 30% { opacity:1; } to { opacity:.7; } }
  @keyframes box-spin { to { transform:translate(-50%, -50%) rotate(360deg); } }
  @keyframes box-thud { 40% { transform:translateX(-6%) scaleX(.92); } 70% { transform:translateX(2%); } }
  @media (prefers-reduced-motion: reduce) {
    .box-eye i, .box-glove, .box-mon.hit, .box-mon.gloat, .box-pad.right, .box-word, .box-ring.koed, .box-dizzy, .box-bell.ring { animation:none !important; }
  }`;

  function injectCss() {
    if (document.getElementById("box-css")) return;
    const style = document.createElement("style");
    style.id = "box-css";
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  registerMicrogame({
    id: "monster-boxing",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 12000,
    input: "tap",
    tutorial: true,
    bossArt: true, // Boss Battle: draws the boss itself when it's fought (ctx.boss, Boss.fighting) // has a ctx.tutorial script
    listening: true, // the target is only ever spoken: left out when listening games are off (Settings)

    start(ctx) {
      const bossId = window.Boss ? window.Boss.fighting(ctx) : null; // Boss Battle: you box the boss itself
      injectCss();
      const speed = ctx.speed || 1;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const { tone, sweep, noise } = ctx.sfx;
      const GOAL = 3, MISSES = 3, N = 3;
      // One row of three options per punch. A listening game: the card text is never shown.
      // Each punch brings a NEW target ("A"… punch a… "B"… punch b…): a combo. Between punches the clock stops
      // for a beat while the bell dings and the voice says the next one (the teacher's idea). A miss keeps it.
      const S = ctx.choiceSteps(GOAL, N);
      let C = S[0];
      const BEAT_MS = 800;

      // ---------- DOM ----------
      const wrap = document.createElement("div");
      wrap.className = "box";
      const top = document.createElement("div");
      top.className = "box-top";
      const bell = document.createElement("button");
      bell.className = "box-bell";
      bell.textContent = "🔔";
      bell.setAttribute("aria-label", TEXT.bellLabel);
      bell.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });
      const pips = document.createElement("div");
      pips.className = "box-pips";
      pips.innerHTML = `<div class="box-row hits">${'<span class="box-pip"></span>'.repeat(GOAL)}</div>` +
        `<div class="box-row misses">${'<span class="box-pip"></span>'.repeat(MISSES)}</div>`;
      top.append(bell, pips);
      const ring = document.createElement("div");
      ring.className = "box-ring";
      ring.innerHTML = '<div class="box-rope" style="top:24%"></div><div class="box-rope" style="top:38%"></div><div class="box-rope" style="top:52%"></div><div class="box-fx"></div>';
      const fx = ring.querySelector(".box-fx");
      const mon = document.createElement("div");
      mon.className = "box-mon";
      mon.innerHTML = '<div class="box-body"></div><div class="box-shorts"></div><div class="box-brow l"></div><div class="box-brow r"></div>' +
        '<div class="box-eye l"><i></i></div><div class="box-eye r"><i></i></div><div class="box-mouth"></div><div class="box-mglove l"></div><div class="box-mglove r"></div>';
      // Boss Battle: the opponent is the boss (the monster's own body is hidden; the pads, falls and K.O. stay).
      let boss = null;
      if (bossId) { mon.classList.add("bossy"); boss = window.Boss.el(bossId, "var(--mz)"); boss.classList.add("box-boss"); mon.appendChild(boss); }
      const bossMood = (m) => { if (boss) window.Boss.setMood(boss, m); };
      ring.appendChild(mon);
      const gloves = ["l", "r"].map((s) => {
        const g = document.createElement("div");
        g.className = `box-glove ${s}`;
        g.innerHTML = '<div class="box-gfist"></div><div class="box-gcuff"></div>';
        ring.appendChild(g);
        return g;
      });
      wrap.append(top, ring);
      ctx.root.appendChild(wrap);

      // Pads: 0 on the head, 1 left of the belly, 2 right of the belly (fractions of the monster box).
      const SPOTS = [{ fx: 0.5, fy: 0.07 }, { fx: 0.27, fy: 0.72 }, { fx: 0.73, fy: 0.72 }];
      const pads = SPOTS.map((s, i) => {
        const b = document.createElement("button");
        b.className = "box-pad";
        b.addEventListener("pointerdown", (e) => { e.preventDefault(); punch(p); });
        b.addEventListener("click", (e) => { if (e.detail === 0) punch(p); });
        ring.appendChild(b);
        const p = { el: b, i, ...s, opt: null };
        return p;
      });

      // ---------- Layout and the monster's bob-and-weave ----------
      let W = 0, H = 0, mz = 200, pd = 70, gz = 120, mx = 0, my = 0;
      function layout() {
        W = ring.clientWidth; H = ring.clientHeight;
        mz = Math.max(150, Math.min(H * 0.84, W * 0.8, 330));
        pd = Math.max(54, Math.min(mz * 0.27, 92));
        gz = Math.max(80, Math.min(W * 0.28, H * 0.34, 150));
        ring.style.setProperty("--mz", `${mz}px`);
        ring.style.setProperty("--pd", `${pd}px`);
        ring.style.setProperty("--gz", `${gz}px`);
      }
      let dodgeUntil = 0, dodgeDir = 0, state = "fight";
      function place(now) {
        const weave = reduceMotion ? 0 : Math.sin(now * 0.0016 * (0.8 + 0.4 * speed)) * W * (0.05 + 0.04 * (speed - 1));
        const bob = reduceMotion ? 0 : Math.abs(Math.sin(now * 0.004 * (0.8 + 0.3 * speed))) * mz * 0.03;
        const dodge = now < dodgeUntil ? dodgeDir * W * 0.22 * Math.sin(((dodgeUntil - now) / 450) * Math.PI) : 0;
        mx = W / 2 + weave + dodge; my = H * 0.93 - bob;
        // Knocked out: flat on its side on the canvas. It turns about its feet (transform-origin 50% 100%),
        // a little smaller (sprawled further back), so shift it right and up to lie on the floor, centred.
        mon.style.transform = state === "ko"
          ? `translate(${(mx + mz * 0.4).toFixed(1)}px, ${(H * 0.95 - mz * 0.36).toFixed(1)}px) rotate(-90deg) scale(.8)`
          : `translate(${mx.toFixed(1)}px, ${my.toFixed(1)}px)`;
        if (state === "ko") return;
        // Pads ride on the monster.
        const left = mx - mz * 0.45, topY = my - mz;
        pads.forEach((p) => { p.el.style.left = `${left + mz * 0.9 * p.fx}px`; p.el.style.top = `${topY + mz * p.fy}px`; });
      }

      // ---------- Rows of options ----------
      let step = 0, misses = 0, done = false, busy = false;
      function showRow(flip) {
        const row = ctx.shuffle(C.row.slice());
        pads.forEach((p, i) => {
          p.opt = row[i];
          p.el.textContent = p.opt.text;
          p.el.classList.toggle("pic", p.opt.kind === "pic");
          p.el.style.fontSize = p.opt.kind === "word" ? `${Math.min(pd * 0.42, (pd * 0.95) / (p.opt.text.length * 0.6))}px` : "";
          p.el.setAttribute("aria-label", TEXT.padLabel(p.opt.spoken));
          if (flip) { p.el.classList.remove("flip"); void p.el.offsetWidth; p.el.classList.add("flip"); }
        });
      }

      // ---------- Punching ----------
      function punch(p) {
        if (done || busy || ctx.ended) return;
        busy = true;
        const glove = p.i === 1 ? gloves[0] : p.i === 2 ? gloves[1] : gloves[step % 2];
        const g = glove.getBoundingClientRect(), r = ring.getBoundingClientRect(), t = p.el.getBoundingClientRect();
        const dx = t.left + t.width / 2 - (g.left + g.width / 2), dy = t.top + t.height / 2 - (g.top + g.height * 0.35);
        sweep(500, 200, 0.12, "sine", 0.12); // whoosh
        glove.getAnimations().forEach((a) => a.cancel());
        glove.animate([{ transform: "none" }, { transform: `translate(${dx * 0.92}px, ${dy * 0.92}px) scale(.62)`, offset: 0.45 }, { transform: "none" }],
          { duration: reduceMotion ? 1 : 360, easing: "ease-out" });
        ctx.later(() => (p.opt.right ? hit(p) : miss(p)), reduceMotion ? 5 : 160);
      }

      function hit(p) {
        noise(0.12, "lowpass", 1800, 300, 0.7); tone(140, 0.1, "square", 0.15); // POW
        mon.classList.remove("hit"); void mon.offsetWidth; mon.classList.add("hit");
        bossMood("hurt");
        word(p, TEXT.pow[step % TEXT.pow.length], false);
        stars(p);
        if (p.opt.kind === "pic") ctx.say(p.opt.spoken);
        pips.querySelector(".hits").children[step].classList.add("on");
        step++;
        if (step >= GOAL) { ctx.later(knockout, 300); return; }
        ctx.later(() => {
          // The beat: the clock stops, the bell dings and the voice says the next one.
          ctx.pauseTimer(BEAT_MS);
          C = S[step];
          bell.classList.remove("ring"); void bell.offsetWidth; bell.classList.add("ring");
          tone(1568, 0.2, "triangle", 0.07);
          ctx.later(() => { if (!done) ctx.say(C.prompt); }, p.opt.kind === "pic" ? 250 : 0);
          mon.classList.remove("hit"); showRow(true); busy = false;
        }, 450);
      }

      function miss(p) {
        // Blocks a head shot, dodges a body shot.
        const blockIt = p.i === 0 || Math.random() < 0.5;
        if (blockIt) {
          mon.classList.add("block");
          bossMood("laugh");
          tone(300, 0.06, "square", 0.1); noise(0.06, "bandpass", 900, 600, 0.3); // thud on its gloves
        } else {
          dodgeDir = p.i === 1 ? 1 : -1;
          dodgeUntil = performance.now() + 450;
          sweep(800, 300, 0.2, "sine", 0.08); // swoosh past
        }
        word(p, blockIt ? TEXT.block : TEXT.dodge, true);
        misses++;
        pips.querySelector(".misses").children[misses - 1].classList.add("miss");
        if (misses >= MISSES) { ctx.later(() => { mon.classList.remove("block"); youreOut(); }, 350); return; }
        ctx.later(() => { mon.classList.remove("block"); showRow(true); busy = false; }, 550); // the same choice, reshuffled
      }

      function knockout() {
        done = true;
        ctx.win();
        state = "ko";
        mon.classList.remove("hit");
        mon.classList.add("ko");
        bossMood("dead");
        // TIMBER: it topples onto its side (the frame loop stops placing it, so place it once here),
        // its pads fade away, it bounces once on the canvas, and stars circle its head.
        mon.style.transition = reduceMotion ? "" : "transform .55s cubic-bezier(.55,0,.9,.55)";
        place(performance.now());
        pads.forEach((p) => { p.el.style.transition = "opacity .2s"; p.el.style.opacity = "0"; p.el.disabled = true; });
        ctx.later(() => {
          mon.classList.add("landed");
          const s = document.createElement("div");
          s.className = "box-dizzy small";
          s.style.left = `${mx - mz * 0.24}px`; s.style.top = `${H * 0.95 - mz * 0.58}px`; s.style.width = `${mz * 0.42}px`;
          s.innerHTML = [0, 120, 240].map((a) => `<span style="left:${50 + 40 * Math.cos(a * Math.PI / 180)}%;top:${50 + 40 * Math.sin(a * Math.PI / 180)}%">⭐</span>`).join("");
          fx.appendChild(s);
        }, reduceMotion ? 10 : 560);
        bigWord(TEXT.ko, "#ffd400");
        noise(0.4, "lowpass", 600, 80, 0.8, 0.55); // THUD on the canvas
        [0, 0.12, 0.24, 0.36].forEach((t, i) => tone(523 + i * 131, 0.14, "triangle", 0.12, 0.2 + t)); // ding-ding-ding
        ctx.later(() => ctx.confetti(fx, W / 2, H * 0.4, { count: 100 }), 300);
        ctx.say(C.answer);
      }

      function youreOut() {
        done = true;
        ctx.lose();
        // It lands one on you: red flash, shake, stars spin over your view…
        ring.classList.add("koed");
        noise(0.3, "lowpass", 1200, 100, 0.8); tone(90, 0.3, "square", 0.15);
        gloves.forEach((g) => { g.getAnimations().forEach((a) => a.cancel()); g.style.transition = "transform .4s ease-in"; g.style.transform = "translateY(70%) rotate(20deg)"; });
        const d = document.createElement("div");
        d.className = "box-dizzy";
        d.innerHTML = [0, 72, 144, 216, 288].map((a) => `<span style="left:${50 + 42 * Math.cos(a * Math.PI / 180)}%;top:${50 + 42 * Math.sin(a * Math.PI / 180)}%">⭐</span>`).join("");
        fx.appendChild(d);
        // …while it flexes and gloats.
        mon.classList.add("gloat");
        bossMood("laugh");
        ctx.later(() => {
          bigWord(TEXT.haha, "#ff4d6d");
          [0, 0.18, 0.36].forEach((t) => { tone(330, 0.1, "square", 0.08, t); tone(262, 0.1, "square", 0.06, t + 0.09); }); // ha-ha-ha
        }, 250);
        ctx.later(() => { showRight(); ctx.say(C.answer); }, 700);
      }

      function word(p, text, bad) {
        const w = document.createElement("div");
        w.className = "box-word" + (bad ? " bad" : "");
        w.textContent = text;
        const r = p.el.getBoundingClientRect(), b = ring.getBoundingClientRect();
        w.style.left = `${Math.max(70, Math.min(W - 70, r.left + r.width / 2 - b.left))}px`;
        w.style.top = `${r.top - b.top}px`;
        fx.appendChild(w);
        ctx.later(() => w.remove(), 900);
      }
      function bigWord(text, color) {
        const w = document.createElement("div");
        w.className = "box-word big";
        w.style.color = color;
        w.textContent = text;
        w.style.left = `${W / 2}px`; w.style.top = `${H * 0.3}px`;
        fx.appendChild(w);
      }
      function stars(p) {
        if (reduceMotion) return;
        const r = p.el.getBoundingClientRect(), b = ring.getBoundingClientRect();
        for (let k = 0; k < 5; k++) {
          const s = document.createElement("div");
          s.className = "box-star";
          s.textContent = k % 2 ? "💥" : "⭐";
          s.style.left = `${r.left + r.width / 2 - b.left}px`; s.style.top = `${r.top + r.height / 2 - b.top}px`;
          fx.appendChild(s);
          const a = (k / 5) * Math.PI * 2, d = pd * 0.9;
          s.animate([{ transform: "translate(-50%, -50%) scale(.4)", opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d}px)) scale(1.1)`, opacity: 0 }],
            { duration: 500, easing: "ease-out", fill: "forwards" });
          ctx.later(() => s.remove(), 600);
        }
      }
      function showRight() { pads.forEach((p) => p.el.classList.add(p.opt.right ? "right" : "dim")); }
      function replay() {
        if (done) return;
        bell.classList.remove("ring"); void bell.offsetWidth; bell.classList.add("ring");
        tone(1568, 0.25, "triangle", 0.08); // ding
        ctx.say(C.prompt);
      }

      ctx.onTimeout(() => { done = true; showRight(); ctx.say(C.answer); });
      function onKey(e) {
        const i = parseInt(e.key, 10) - 1;
        if (i >= 0 && i < N) { e.preventDefault(); punch(pads[i]); }
        else if (e.key === " ") { e.preventDefault(); replay(); }
      }
      document.addEventListener("keydown", onKey);

      function frame(now) { if (state !== "ko") place(now); if (!ctx.ended || state === "fight") ctx.raf(frame); }
      layout();
      place(performance.now());
      showRow(false);
      ctx.raf(frame);
      const ro = new ResizeObserver(() => { layout(); place(performance.now()); });
      ro.observe(ring);

      bell.classList.add("ring");
      tone(1568, 0.25, "triangle", 0.08); // ding-ding: round one!
      tone(1568, 0.25, "triangle", 0.08, 0.3);
      ctx.say(C.prompt);

      // Tutorial: point at the bell (listen!), then punch the right pad three times (they change each time).
      ctx.tutorial(S.map((s) => s.target), async (f) => {
        await f.point(bell, 1000);
        for (let n = 0; n < 6 && step < GOAL && !done; n++) { // until three punches land
          await f.until(() => !busy || done, 4000);
          if (done) break;
          await f.tap(() => pads.find((p) => p.opt.right).el);
          await f.until(() => !busy || done, 2000);
        }
      });

      return () => { done = true; ro.disconnect(); document.removeEventListener("keydown", onKey); };
    },
  });
})();
