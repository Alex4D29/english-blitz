// PENALTY KICK — a listening game. An announcer monster with a 📣 says the target (ABC "B for ball",
// phonics just "B", CVC/HFW the word) and a 🔊 bubble replays it; the target is never shown. Each of
// the goal's four corners has a sign: a letter (ABC), a picture (phonics: the one that starts with the
// letter), or a word (CVC, HFW). A silly goalkeeper monster sways in the goal; your player (a
// googly-eyed monster) waits by the ⚽. Tap a corner (or flick the ball towards one) to shoot. Right:
// the keeper dives the wrong way, the ball bulges the net, GOAL!, your player jumps for joy. Wrong: the
// keeper dives and catches it, then gloats (HA HA!, tongue out, a little dance) while your player cries;
// the right corner glows. One kick decides the round. Faster speeds: the keeper sways faster and wider.
(function () {
  const TEXT = {
    name: { en: "Penalty Kick" },
    icon: "⚽",
    howTo: (list) => {
      const what = list.type === "phonics" ? "a picture that starts with that letter"
        : list.type === "letter" ? "that letter" : "that word";
      return { en: {
        steps: [
          ["👂", list.type === "phonics" ? "Listen to the letter, like \"B\"." : list.type === "letter" ? "Listen to the letter, like \"B for ball\"." : "Listen to the word, like \"cat\"."],
          ["🥅", `Find the corner of the goal with ${what}.`],
          ["⚽", "Tap it to kick the ball there. GOAL!"],
        ],
        tips: [
          "Tap the monster or its 🔊 bubble to hear it again.",
          "You can also flick the ball towards a corner.",
          "A wrong corner: the keeper catches it and laughs. Then the right corner glows.",
        ],
      } };
    },
    instruction: { en: "SCORE A\nGOAL!" },
    hearLabel: "Hear it again",
    cornerLabel: (t) => `Kick to ${t}`,
    goal: "GOAL!",
    haha: "HA HA!",
    saved: "SAVED!",
    answer: (spoken, word) => (word ? `${spoken} for ${word}` : spoken),
  };

  const CSS = `
  .pk { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:6px; padding-bottom:8px; }
  /* The announcer: a green monster with a megaphone and a 🔊 bubble */
  .pk-top { flex:none; display:flex; align-items:center; gap:10px; padding:0; border:0; background:none; font:inherit; cursor:pointer; touch-action:manipulation; }
  .pk-ann { position:relative; width:64px; height:60px; }
  .pk-abody { position:absolute; inset:8px 6px 0; background:#5fd932; border:4px solid #111; border-radius:50% 50% 40% 40%; }
  .pk-aeye { position:absolute; top:6px; width:22px; height:22px; background:#fff; border:3px solid #111; border-radius:50%; z-index:1; }
  .pk-aeye.l { left:10px; } .pk-aeye.r { right:12px; width:18px; height:18px; top:9px; }
  .pk-aeye i { position:absolute; left:6px; top:6px; width:9px; height:9px; background:#111; border-radius:50%; animation:pk-goggle 1.1s ease-in-out infinite; }
  .pk-amouth { position:absolute; left:20px; right:20px; top:34px; height:14px; background:#6b1020; border:3px solid #111; border-radius:50%; z-index:1; animation:pk-talk .25s steps(2) infinite; }
  .pk-mega { position:absolute; right:-14px; top:26px; font-size:26px; transform:rotate(-15deg); z-index:2; }
  .pk-bubble { position:relative; height:56px; min-width:84px; padding:0 18px; background:#fff; border:5px solid #111; border-radius:28px; box-shadow:0 5px 0 #111;
    display:flex; align-items:center; justify-content:center; font-size:1.8rem; }
  .pk-bubble::before { content:""; position:absolute; left:-14px; top:50%; margin-top:-8px; border:8px solid transparent; border-right:12px solid #111; }

  /* The pitch: green stripes, the goal at the top, the penalty spot below */
  .pk-pitch { position:relative; flex:1; min-height:0; width:100%; max-width:560px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111;
    background:repeating-linear-gradient(180deg, #4cbf3a 0 34px, #43b032 34px 68px); touch-action:none; }
  .pk-fx { position:absolute; inset:0; pointer-events:none; overflow:visible; z-index:9; }
  .pk-goal { position:absolute; border:9px solid #fff; border-bottom:0; border-radius:6px 6px 0 0; box-shadow:0 0 0 3px #111, inset 0 0 0 3px #111;
    background:rgba(255,255,255,.12); background-image:repeating-linear-gradient(45deg, transparent 0 12px, rgba(255,255,255,.55) 12px 14px),
    repeating-linear-gradient(-45deg, transparent 0 12px, rgba(255,255,255,.55) 12px 14px); }
  .pk-goal.bulge { animation:pk-bulge .35s ease-out; }
  .pk-line { position:absolute; left:0; right:0; height:4px; background:rgba(255,255,255,.8); }
  .pk-spot { position:absolute; width:14px; height:8px; margin:-4px 0 0 -7px; background:#fff; border-radius:50%; }
  .pk-corner { position:absolute; transform:translate(-50%, -50%); min-width:var(--cs); height:calc(var(--cs) * .82); padding:0 6px; background:#fff; color:#111;
    border:4px solid #111; border-radius:12px; box-shadow:0 4px 0 #111; font:inherit; font-size:calc(var(--cs) * .48); line-height:1; display:flex; align-items:center;
    justify-content:center; white-space:nowrap; cursor:pointer; touch-action:manipulation; z-index:3; }
  .pk-corner.pic { font-size:calc(var(--cs) * .5); }
  .pk-corner.right { background:#b8ffcf; box-shadow:0 0 0 5px #fff, 0 0 0 10px #00b86b; animation:pk-wiggle .4s ease-in-out 3; }
  .pk-corner.dim { opacity:.45; }
  .pk-corner.hit { transform:translate(-50%, -50%) scale(1.15); }

  /* The goalkeeper: a purple monster with big white gloves. Anchor: feet centre. --kz is its height. */
  .pk-keeper { position:absolute; left:0; top:0; width:calc(var(--kz) * .8); height:var(--kz); margin:calc(var(--kz) * -1) 0 0 calc(var(--kz) * -.4); z-index:4;
    pointer-events:none; transform-origin:50% 80%; will-change:transform; }
  .pk-kbody { position:absolute; left:14%; right:14%; top:16%; bottom:12%; background:#9c6bff; border:4px solid #111; border-radius:46% 46% 36% 36%;
    background-image:linear-gradient(180deg, transparent 58%, #ffd400 58% 70%, transparent 70%); }
  .pk-keye { position:absolute; top:24%; width:24%; aspect-ratio:1; background:#fff; border:3px solid #111; border-radius:50%; z-index:1; }
  .pk-keye.l { left:22%; } .pk-keye.r { right:22%; width:20%; top:27%; }
  .pk-keye i { position:absolute; left:28%; top:30%; width:46%; aspect-ratio:1; background:#111; border-radius:50%; animation:pk-goggle 1s ease-in-out infinite; }
  .pk-kmouth { position:absolute; left:30%; right:30%; top:46%; height:12%; z-index:1; background:#6b1020; border:3px solid #111; border-radius:4px 4px 999px 999px; overflow:hidden; }
  .pk-kmouth::after { content:""; position:absolute; left:24%; right:24%; bottom:-30%; height:70%; background:#ff6f91; border-radius:50%; }
  .pk-glove { position:absolute; top:18%; width:30%; aspect-ratio:1; background:#fff; border:4px solid #111; border-radius:50% 50% 40% 40%; z-index:3; transition:left .12s, right .12s, top .12s; }
  /* A save: the ball sits in the keeper's hands (drawn inside the keeper, under its gloves), and the gloves close round it */
  .pk-kball { position:absolute; left:50%; top:2%; display:none; transform:translateX(-50%); font-size:calc(var(--kz) * .42); line-height:1; z-index:2; }
  .pk-keeper.holding .pk-kball { display:block; }
  .pk-keeper.holding .pk-glove.l { left:6%; top:6%; } .pk-keeper.holding .pk-glove.r { right:6%; top:6%; }
  .pk-keeper.holding.gloat .pk-kball { top:-34%; }   /* held up over its head */
  .pk-keeper.holding.gloat .pk-glove.l { left:4%; top:-26%; } .pk-keeper.holding.gloat .pk-glove.r { right:4%; top:-26%; }
  .pk-impact { position:absolute; width:calc(var(--kz) * 1.1); height:calc(var(--kz) * 1.1); transform:translate(-50%, -50%) scale(.3); z-index:8; pointer-events:none;
    background:#fff; border:4px solid #111; clip-path:polygon(50% 0, 60% 32%, 92% 18%, 70% 46%, 100% 56%, 68% 64%, 82% 96%, 54% 74%, 40% 100%, 36% 70%, 6% 86%, 26% 56%, 0 38%, 32% 34%, 18% 6%, 44% 26%);
    animation:pk-impact .45s ease-out forwards; }
  .pk-glove.l { left:-12%; transform:rotate(-20deg); } .pk-glove.r { right:-12%; transform:rotate(20deg); }
  .pk-kleg { position:absolute; bottom:0; width:18%; height:16%; background:#111; border-radius:6px; }
  .pk-kleg.l { left:26%; } .pk-kleg.r { right:26%; }
  .pk-keeper.gloat .pk-kmouth { height:20%; top:44%; }
  .pk-keeper.gloat .pk-kmouth::after { height:110%; bottom:-60%; }   /* tongue out */
  .pk-keeper.gloat { animation:pk-dance .3s ease-in-out infinite alternate; }
  .pk-keeper.flop .pk-keye i { animation:pk-dizzy .45s linear infinite; }
  .pk-keeper.flop .pk-kmouth { left:40%; right:40%; height:10%; top:50%; border-radius:50%; }

  /* Your player: an orange monster beside the ball. Anchor: feet centre. --pz is its height. */
  .pk-player { position:absolute; left:0; top:0; width:calc(var(--pz) * .8); height:var(--pz); margin:calc(var(--pz) * -1) 0 0 calc(var(--pz) * -.4); z-index:5; pointer-events:none; }
  .pk-pbody { position:absolute; left:10%; right:10%; top:6%; bottom:16%; background:#ff8a1f; border:4px solid #111; border-radius:48% 48% 40% 40%;
    background-image:linear-gradient(180deg, transparent 62%, #1e6bff 62%); }
  .pk-peye { position:absolute; top:16%; width:30%; aspect-ratio:1; background:#fff; border:3px solid #111; border-radius:50%; z-index:1; }
  .pk-peye.l { left:14%; } .pk-peye.r { right:14%; width:25%; top:19%; }
  .pk-peye i { position:absolute; left:28%; top:30%; width:46%; aspect-ratio:1; background:#111; border-radius:50%; animation:pk-goggle 1.2s ease-in-out infinite; }
  .pk-pmouth { position:absolute; left:28%; right:28%; top:46%; height:14%; z-index:1; background:#6b1020; border:3px solid #111; border-radius:4px 4px 999px 999px; }
  .pk-pleg { position:absolute; bottom:0; width:20%; height:22%; background:#ff8a1f; border:4px solid #111; border-radius:6px 6px 10px 10px; transform-origin:50% 0; }
  .pk-pleg.l { left:22%; } .pk-pleg.r { right:22%; }
  .pk-player.kick .pk-pleg.r { animation:pk-kick .25s ease-out; }
  .pk-player.yay { animation:pk-jump .4s cubic-bezier(.2,1.6,.4,1) 3; }
  .pk-player.yay .pk-pmouth { height:22%; }
  .pk-player.cry .pk-pmouth { border-radius:999px 999px 4px 4px; height:10%; top:50%; }
  .pk-player.cry .pk-peye i { top:52%; }
  .pk-tear { position:absolute; font-size:calc(var(--pz) * .2); z-index:6; pointer-events:none; animation:pk-tear .7s ease-in forwards; }

  .pk-ball { position:absolute; left:0; top:0; font-size:var(--bz); line-height:1; z-index:6; pointer-events:none; will-change:transform; }
  .pk-word { position:absolute; transform:translate(-50%, -50%) rotate(-8deg); z-index:10; pointer-events:none; font-size:2.6rem; color:#ffd400; -webkit-text-stroke:3px #111;
    paint-order:stroke fill; text-shadow:0 5px 0 #111; white-space:nowrap; animation:pk-pop .35s cubic-bezier(.2,1.8,.4,1) both; }
  .pk-word.bad { color:#ff4d6d; font-size:2rem; }
  .pk-word.saved { color:#ff4d6d; font-size:3.2rem; z-index:11; }   /* big and right over the goal, so a save is unmistakable */

  @keyframes pk-goggle { 0%, 100% { transform:translate(-16%, 0); } 50% { transform:translate(16%, -12%); } }
  @keyframes pk-talk { 50% { transform:scaleY(.4); } }
  @keyframes pk-dizzy { from { transform:rotate(0) translate(30%); } to { transform:rotate(360deg) translate(30%); } }
  @keyframes pk-bulge { 40% { transform:scale(1.04, 1.06); } }
  @keyframes pk-wiggle { 25% { rotate:-6deg; } 75% { rotate:6deg; } }
  @keyframes pk-kick { 50% { transform:rotate(-70deg); } }
  @keyframes pk-jump { 50% { translate:0 -30%; } }
  @keyframes pk-dance { from { rotate:-10deg; } to { rotate:10deg; } }
  @keyframes pk-tear { from { opacity:1; transform:translateY(0); } to { opacity:0; transform:translateY(40px); } }
  @keyframes pk-pop { from { transform:translate(-50%, -50%) rotate(-8deg) scale(.2); } }
  @keyframes pk-impact { 50% { transform:translate(-50%, -50%) scale(1.1); opacity:1; } to { transform:translate(-50%, -50%) scale(1.3); opacity:0; } }
  @media (prefers-reduced-motion: reduce) {
    .pk-aeye i, .pk-keye i, .pk-peye i, .pk-amouth, .pk-goal.bulge, .pk-corner.right, .pk-keeper.gloat, .pk-player.yay, .pk-word { animation:none !important; }
  }`;

  function injectCss() {
    if (document.getElementById("pk-css")) return;
    const style = document.createElement("style");
    style.id = "pk-css";
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  registerMicrogame({
    id: "penalty-kick",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 8000,
    input: "tap",
    tutorial: true, // has a ctx.tutorial script
    listening: true, // the target is only ever spoken: left out when listening games are off (Settings)

    start(ctx) {
      injectCss();
      const speed = ctx.speed || 1;
      const type = ctx.list.type;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const { tone, sweep, noise } = ctx.sfx;
      const letterName = (it) => it.say || it.text.toUpperCase();

      // ---------- Content: four options, one per corner ----------
      let prompt, answer, opts, answerItem;
      if (type === "phonics") {
        const letter = ctx.items.find((it) => ctx.phonics.pics(it).length) || ctx.items[0];
        answerItem = letter;
        const set = ctx.phonics.set(letter, 1, 3);
        const right = set.right[0];
        prompt = letterName(letter);
        answer = TEXT.answer(letterName(letter), right.word);
        opts = [right, ...set.wrong].map((p) => ({ text: p.emoji, kind: "pic", right: p === right, spoken: p.word }));
      } else if (type === "letter") {
        const target = ctx.items[0];
        answerItem = target;
        prompt = answer = TEXT.answer(letterName(target), target.word);
        opts = ctx.pickOptions(target, 4).map((o) => ({ text: o.text.toUpperCase(), kind: "letter", right: o === target, spoken: letterName(o) }));
      } else {
        const ok = (it) => it.text.length <= 6;
        const target = ctx.items.find(ok) || ctx.items[0];
        answerItem = target;
        prompt = answer = target.say || target.text;
        opts = ctx.pickOptions(target, 6).filter((o) => o === target || ok(o)).slice(0, 4)
          .map((o) => ({ text: o.text, kind: "word", right: o === target, spoken: o.say || o.text }));
        if (!opts.some((o) => o.right)) opts[0] = { text: target.text, kind: "word", right: true, spoken: prompt };
      }
      opts = ctx.shuffle(opts);

      // ---------- DOM ----------
      const wrap = document.createElement("div");
      wrap.className = "pk";
      const top = document.createElement("button");
      top.className = "pk-top";
      top.setAttribute("aria-label", TEXT.hearLabel);
      top.innerHTML = '<div class="pk-ann"><div class="pk-abody"></div><div class="pk-aeye l"><i></i></div><div class="pk-aeye r"><i></i></div>' +
        '<div class="pk-amouth"></div><div class="pk-mega">📣</div></div><div class="pk-bubble">🔊</div>';
      top.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });
      const pitch = document.createElement("div");
      pitch.className = "pk-pitch";
      pitch.innerHTML = '<div class="pk-line"></div><div class="pk-goal"></div><div class="pk-spot"></div><div class="pk-fx"></div>';
      const goalEl = pitch.querySelector(".pk-goal"), line = pitch.querySelector(".pk-line"), spot = pitch.querySelector(".pk-spot"), fx = pitch.querySelector(".pk-fx");
      const keeper = document.createElement("div");
      keeper.className = "pk-keeper";
      keeper.innerHTML = '<div class="pk-kleg l"></div><div class="pk-kleg r"></div><div class="pk-kbody"></div><div class="pk-keye l"><i></i></div><div class="pk-keye r"><i></i></div>' +
        '<div class="pk-kmouth"></div><div class="pk-kball">⚽</div><div class="pk-glove l"></div><div class="pk-glove r"></div>';
      const player = document.createElement("div");
      player.className = "pk-player";
      player.innerHTML = '<div class="pk-pleg l"></div><div class="pk-pleg r"></div><div class="pk-pbody"></div><div class="pk-peye l"><i></i></div><div class="pk-peye r"><i></i></div><div class="pk-pmouth"></div>';
      const ball = document.createElement("div");
      ball.className = "pk-ball";
      ball.textContent = "⚽";
      pitch.append(keeper, player, ball);
      wrap.append(top, pitch);
      ctx.root.appendChild(wrap);

      const corners = opts.map((o, i) => {
        const b = document.createElement("button");
        b.className = "pk-corner" + (o.kind === "pic" ? " pic" : "");
        b.textContent = o.text;
        b.setAttribute("aria-label", TEXT.cornerLabel(o.spoken));
        b.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); kick(c); });
        b.addEventListener("click", (e) => { if (e.detail === 0) kick(c); });
        pitch.appendChild(b);
        const c = { el: b, o, i, x: 0, y: 0 }; // i: 0 top-left, 1 top-right, 2 bottom-left, 3 bottom-right
        return c;
      });

      // ---------- Layout ----------
      let W = 0, H = 0, gx = 0, gy = 0, gw = 0, gh = 0, cs = 60, kz = 80, pz = 70, bz = 44, spotX = 0, spotY = 0;
      function layout() {
        W = pitch.clientWidth; H = pitch.clientHeight;
        gw = Math.min(W * 0.92, 520); gh = Math.min(gw * 0.5, H * 0.5);
        gx = (W - gw) / 2; gy = Math.max(10, H * 0.05);
        Object.assign(goalEl.style, { left: `${gx}px`, top: `${gy}px`, width: `${gw}px`, height: `${gh}px` });
        line.style.top = `${gy + gh}px`;
        cs = Math.max(48, Math.min(gw * 0.2, gh * 0.4, 90));
        kz = Math.min(gh * 0.8, 130); pz = Math.max(60, Math.min(H * 0.24, 110)); bz = Math.max(48, Math.min(H * 0.15, 80));
        pitch.style.setProperty("--cs", `${cs}px`);
        pitch.style.setProperty("--kz", `${kz}px`);
        pitch.style.setProperty("--pz", `${pz}px`);
        pitch.style.setProperty("--bz", `${bz}px`);
        spotX = W / 2; spotY = Math.min(H - pz * 0.3, gy + gh + (H - gy - gh) * 0.62);
        spot.style.left = `${spotX}px`; spot.style.top = `${spotY}px`;
        corners.forEach((c) => {
          c.x = gx + gw * (c.i % 2 ? 0.83 : 0.17);
          c.y = gy + gh * (c.i < 2 ? 0.27 : 0.7);
          c.el.style.left = `${c.x}px`; c.el.style.top = `${c.y}px`;
          if (c.o.kind === "word") c.el.style.fontSize = `${Math.min(cs * 0.44, (cs * 1.5) / (c.o.text.length * 0.6))}px`;
        });
        player.style.transform = `translate(${(spotX - pz * 0.55).toFixed(1)}px, ${(spotY + pz * 0.22).toFixed(1)}px)`;
        if (!kicked) setBall(spotX, spotY, 1, 0);
      }
      function setBall(x, y, s, r) {
        ball.style.transform = `translate(${(x - bz * 0.55).toFixed(1)}px, ${(y - bz * 0.9).toFixed(1)}px) scale(${s.toFixed(3)}) rotate(${r.toFixed(0)}deg)`;
      }
      // The keeper sways in the goal mouth until the kick, then dives.
      let kx = 0, ky = 0, dive = null;
      const swayAmp = () => gw * (0.1 + 0.06 * (speed - 1));
      function placeKeeper(now) {
        if (dive) {
          const k = Math.min(1, (now - dive.t0) / dive.ms), e = 1 - (1 - k) * (1 - k);
          const x = dive.fx + (dive.tx - dive.fx) * e, y = dive.fy + (dive.ty - dive.fy) * e;
          keeper.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${(dive.rot * e).toFixed(0)}deg)`;
          kx = x; ky = y;
          return;
        }
        kx = W / 2 + (reduceMotion ? 0 : Math.sin(now * 0.002 * (0.8 + 0.4 * speed)) * swayAmp());
        ky = gy + gh;
        keeper.style.transform = `translate(${kx.toFixed(1)}px, ${ky.toFixed(1)}px)`;
      }

      // ---------- The kick ----------
      let done = false, kicked = false;
      function kick(c) {
        if (done || kicked || ctx.ended) return;
        kicked = true;
        done = true;
        const right = c.o.right;
        if (right) ctx.win(); else ctx.lose();
        corners.forEach((x) => { x.el.disabled = true; });
        c.el.classList.add("hit");
        player.classList.add("kick");
        noise(0.08, "lowpass", 900, 200, 0.6); tone(120, 0.08, "sine", 0.3); // THUMP
        // The keeper dives: to the kicked corner on a wrong kick, the other way on a right one.
        const to = right ? corners.filter((x) => x.i % 2 !== c.i % 2)[c.i < 2 ? 1 : 0] || corners.find((x) => x !== c) : c;
        const side = to.i % 2 ? 1 : -1;
        dive = { t0: performance.now(), ms: reduceMotion ? 1 : 380, fx: kx, fy: ky,
          tx: to.x - side * kz * 0.05, ty: to.y + kz * (to.i < 2 ? 0.75 : 0.55), rot: side * (to.i < 2 ? 70 : 85) };
        // A goal flies into the corner. A save never reaches the net: it flies into the keeper's hands,
        // where they'll be at the end of its dive (the keeper turns about a point 20% up from its feet,
        // and its hands are 57% of its height above that).
        const th = (dive.rot * Math.PI) / 180;
        const hands = { x: dive.tx + Math.sin(th) * kz * 0.57, y: dive.ty - kz * 0.2 - Math.cos(th) * kz * 0.57 };
        const from = { x: spotX, y: spotY }, aim = right ? { x: c.x, y: c.y + cs * 0.1 } : hands;
        const t0 = performance.now(), ms = reduceMotion ? 1 : 460;
        (function fly(now) {
          const k = Math.min(1, (now - t0) / ms);
          const x = from.x + (aim.x - from.x) * k, y = from.y + (aim.y - from.y) * k - Math.sin(k * Math.PI) * H * 0.08;
          setBall(x, y, 1 - 0.3 * k, k * 720);
          if (k < 1) { ctx.raf(fly); return; }
          if (right) goal(c); else saved(c, aim);
        })(t0);
      }

      function goal(c) {
        goalEl.classList.add("bulge");
        keeper.classList.add("flop");
        player.classList.remove("kick");
        player.classList.add("yay");
        say(TEXT.goal, W / 2, gy + gh * 0.5, false);
        noise(0.9, "bandpass", 1200, 800, 0.35); // the crowd roars
        [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.14, "square", 0.07, 0.1 + i * 0.08));
        ctx.confetti(fx, c.x, c.y, { count: 90 });
        ctx.say(answer);
      }

      function saved(c, at) {
        // Caught, nowhere near the net: an impact burst, SAVED!, and the ball is now in the keeper's
        // hands (drawn inside the keeper, with the gloves closing round it).
        tone(160, 0.1, "square", 0.14); noise(0.12, "lowpass", 1500, 300, 0.5); // glove THUD
        ball.style.visibility = "hidden";
        keeper.classList.add("holding");
        const burst = document.createElement("div");
        burst.className = "pk-impact";
        burst.style.left = `${at.x}px`; burst.style.top = `${at.y}px`;
        fx.appendChild(burst);
        ctx.later(() => burst.remove(), 500);
        say(TEXT.saved, W / 2, gy + gh * 0.55, true, "saved");
        ctx.later(() => {
          // Back on its feet to gloat: HA HA!, tongue out, a little dance.
          dive = null;
          keeper.style.transition = reduceMotion ? "" : "transform .25s ease-out";
          keeper.classList.add("gloat");
          kx = W / 2; ky = gy + gh;
          keeper.style.transform = `translate(${kx}px, ${ky}px)`; // (it holds the ball up over its head)
          say(TEXT.haha, W / 2 + kz * 0.6, gy + gh * 0.1, true);
          [0, 0.18, 0.36].forEach((t) => { tone(330, 0.1, "square", 0.08, t); tone(262, 0.1, "square", 0.06, t + 0.09); }); // ha-ha-ha
          player.classList.remove("kick");
          player.classList.add("cry");
          sweep(400, 200, 0.6, "triangle", 0.1, 0.2); // waah
          tears();
        }, reduceMotion ? 10 : 420);
        ctx.later(() => { showRight(); ctx.say(answer); }, reduceMotion ? 20 : 800);
      }
      function tears() {
        const r = player.getBoundingClientRect(), p = pitch.getBoundingClientRect();
        [0.28, 0.66].forEach((fxp, k) => [0, 1, 2].forEach((n) => ctx.later(() => {
          const t = document.createElement("div");
          t.className = "pk-tear";
          t.textContent = "💧";
          t.style.left = `${r.left - p.left + r.width * fxp}px`;
          t.style.top = `${r.top - p.top + r.height * 0.32}px`;
          fx.appendChild(t);
          ctx.later(() => t.remove(), 800);
        }, n * 260 + k * 120)));
      }
      function say(text, x, y, bad, extra) {
        const w = document.createElement("div");
        w.className = "pk-word" + (bad ? " bad" : "") + (extra ? ` ${extra}` : "");
        w.textContent = text;
        w.style.left = `${Math.max(70, Math.min(W - 70, x))}px`; w.style.top = `${y}px`;
        fx.appendChild(w);
      }
      function showRight() { corners.forEach((c) => c.el.classList.add(c.o.right ? "right" : "dim")); }
      function replay() { if (!done) ctx.say(prompt); }

      // ---------- Flick the ball towards a corner ----------
      let flick = null;
      pitch.addEventListener("pointerdown", (e) => {
        if (done) return;
        e.preventDefault();
        flick = { id: e.pointerId, x: e.clientX, y: e.clientY };
      });
      pitch.addEventListener("pointerup", (e) => {
        if (!flick || e.pointerId !== flick.id) return;
        const dx = e.clientX - flick.x, dy = e.clientY - flick.y, f0 = flick;
        flick = null;
        if (dy > -30 || Math.abs(dy) < Math.abs(dx) * 0.4) return; // not an upward flick
        // Follow the flick line up to each corner's height, and take the nearest corner there.
        const p = pitch.getBoundingClientRect(), sx = f0.x - p.left, sy = f0.y - p.top;
        const best = corners.slice().sort((a, b) => {
          const at = (c) => Math.abs(sx + (dx / -dy) * (sy - c.y) - c.x) + (Math.hypot(dx, dy) > H * 0.35 ? (c.i < 2 ? 0 : 20) : (c.i < 2 ? 20 : 0));
          return at(a) - at(b);
        })[0];
        kick(best);
      });
      pitch.addEventListener("pointercancel", () => { flick = null; });

      ctx.onTimeout(() => { done = true; corners.forEach((c) => { c.el.disabled = true; }); showRight(); ctx.say(answer); });
      function onKey(e) {
        const i = parseInt(e.key, 10) - 1;
        if (i >= 0 && i < 4) { e.preventDefault(); kick(corners[i]); }
        else if (e.key === " ") { e.preventDefault(); replay(); }
      }
      document.addEventListener("keydown", onKey);

      function frame(now) {
        if (keeper.classList.contains("gloat")) return; // standing still to gloat
        placeKeeper(now);
        if (!ctx.ended || dive) ctx.raf(frame);
      }
      layout();
      placeKeeper(performance.now());
      ctx.raf(frame);
      const ro = new ResizeObserver(() => { layout(); });
      ro.observe(pitch);

      ctx.say(prompt);

      // Tutorial: point at the announcer (listen!), then at the right corner, and kick it there.
      ctx.tutorial(answerItem, async (f) => {
        const c = corners.find((x) => x.o.right);
        await f.point(top, 1000);
        await f.point(c.el, 800);
        await f.tap(c.el);
        await f.until(() => done, 1000);
      });

      return () => { done = true; ro.disconnect(); document.removeEventListener("keydown", onKey); };
    },
  });
})();
