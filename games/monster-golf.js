// MONSTER GOLF — a power-bar game (js/power.js). The card at the top shows the target (letter; phonics
// letter; CVC word; HFW 🔊) and the voice says it. A golfing monster (flat cap, googly eyes, a club)
// stands at the tee on the left of a fairway; three holes lie at increasing distance, each with a flag in
// the power bar's colours (near green, middle yellow, far red) carrying an option. Charge the power bar
// (press and hold, or tap, tap): short power reaches the near hole, medium the middle, strong the far
// one. One swing decides. Right: the ball drops in, HOLE IN ONE!, the crowd claps (👏 float up). Wrong:
// the ball lands in the wrong hole, then a golf ball suddenly falls out of the sky and BONKs the golfer
// on the head (dizzy stars), and the right flag glows.
(function () {
  const TEXT = {
    name: { en: "Monster Golf" },
    icon: "⛳",
    howTo: (list) => ({ en: {
      steps: [
        list.type === "hfw" ? ["👂", "Listen to the word, like \"the\"."] : ["👀", "Look at the card at the top."],
        ["⛳", "Find the flag with the same one. Green is near, yellow is in the middle, red is far."],
        ["💪", "Hold to fill the power bar, then let go to swing! (Or tap, then tap again.)"],
      ],
      tips: [
        "Green power reaches the green flag, yellow the yellow one, red the red one.",
        "Tap the card to hear it again.",
        "A wrong hole… BONK! A ball lands on the golfer's head.",
      ],
    } }),
    instruction: { en: "GET IT IN\nTHE HOLE!" },
    cardLabel: "Hear it again",
    hole: "HOLE IN ONE!",
    bonk: "BONK!",
  };

  const FLAGS = ["#2fd15b", "#ffd400", "#ff4d6d"];
  const CSS = `
  .mg { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:8px; padding-bottom:8px; }
  .mg-card { flex:none; min-width:84px; height:72px; padding:0 18px; border-radius:18px; font:inherit; font-size:2.6rem; line-height:1; background:#fff; color:#111;
    border:5px solid #111; box-shadow:0 6px 0 #111; display:flex; align-items:center; justify-content:center; gap:8px; cursor:pointer; touch-action:manipulation; }
  .mg-card .spk { font-size:1.3rem; opacity:.6; }
  .mg-course { position:relative; flex:1; min-height:0; width:100%; max-width:560px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111;
    background:linear-gradient(180deg, #8fd3ff 0 40%, #5fc24a 40%); touch-action:none; cursor:pointer; }
  .mg-course::before { content:""; position:absolute; left:-20%; right:-20%; top:52%; height:60%; background:#7fdc5c; border-radius:50% 50% 0 0; }   /* the fairway */
  .mg-fx { position:absolute; inset:0; pointer-events:none; overflow:visible; z-index:8; }
  /* A hole: a dark cup with a flag on a pole. --fs is its size */
  .mg-hole { position:absolute; width:var(--fs); height:calc(var(--fs) * 1.6); transform:translate(-50%, -100%); z-index:2; pointer-events:none; }
  .mg-cup { position:absolute; left:10%; right:10%; bottom:0; height:16%; background:#222; border:3px solid #111; border-radius:50%; }
  .mg-pole { position:absolute; left:48%; bottom:8%; width:5px; height:90%; background:#fff; border:2px solid #111; }
  .mg-flag { position:absolute; left:calc(48% + 7px); top:0; min-width:70%; padding:4px 8px; background:var(--fc); border:4px solid #111; border-radius:4px 12px 12px 4px;
    font-size:calc(var(--fs) * .44); line-height:1.05; color:#111; white-space:nowrap; transform-origin:0 50%; animation:mg-wave 1.2s ease-in-out infinite; }
  .mg-hole.right .mg-flag { box-shadow:0 0 0 5px #fff, 0 0 0 10px #00b86b; }
  .mg-hole.dim { opacity:.45; }
  .mg-ball { position:absolute; left:0; top:0; width:var(--bs); height:var(--bs); margin:calc(var(--bs) * -.5) 0 0 calc(var(--bs) * -.5); border-radius:50%; z-index:6; pointer-events:none;
    background:radial-gradient(circle at 35% 30%, #fff 0 30%, #ddd 70%); border:3px solid #111; }
  /* The golfer: a blue monster in a flat cap with a club. Anchor: feet. --gz is its height */
  .mg-golfer { position:absolute; left:0; top:0; width:calc(var(--gz) * .8); height:var(--gz); margin:calc(var(--gz) * -1) 0 0 calc(var(--gz) * -.4); z-index:5; pointer-events:none; }
  .mg-gbody { position:absolute; left:10%; right:10%; top:20%; bottom:0; background:#5b8cff; border:4px solid #111; border-radius:46% 46% 36% 36%;
    background-image:linear-gradient(180deg, transparent 64%, #ffd400 64% 74%, transparent 74%); }
  .mg-cap { position:absolute; left:6%; right:6%; top:8%; height:20%; background:#e8173c; border:4px solid #111; border-radius:50% 50% 10% 10%; z-index:2; }
  .mg-cap::after { content:""; position:absolute; right:-30%; bottom:-4px; width:44%; height:40%; background:#e8173c; border:4px solid #111; border-radius:0 50% 50% 0; }
  .mg-eye { position:absolute; top:32%; width:30%; aspect-ratio:1; background:#fff; border:3px solid #111; border-radius:50%; z-index:1; }
  .mg-eye.l { left:14%; } .mg-eye.r { right:16%; width:25%; top:35%; }
  .mg-eye i { position:absolute; left:28%; top:30%; width:46%; aspect-ratio:1; background:#111; border-radius:50%; animation:mg-goggle 1.1s ease-in-out infinite; }
  .mg-mouth { position:absolute; left:28%; right:28%; top:60%; height:13%; z-index:1; background:#6b1020; border:3px solid #111; border-radius:4px 4px 999px 999px; }
  .mg-club { position:absolute; left:60%; top:40%; width:8px; height:80%; background:#999; border:2px solid #111; transform-origin:50% 0; transform:rotate(-20deg); z-index:3; transition:transform .12s; }
  .mg-club::after { content:""; position:absolute; left:-6px; bottom:-6px; width:24px; height:12px; background:#555; border:2px solid #111; border-radius:3px; }
  /* The holes are to the right: the backswing lifts the club up behind (left), the swing comes down
     through the ball and follows through high towards the flags (right). */
  .mg-golfer.wind .mg-club { transform:rotate(150deg); transition:transform .5s; }
  .mg-golfer.swing .mg-club { transform:rotate(-115deg); transition:transform .14s ease-in; }
  .mg-golfer.yay { animation:mg-hop .4s cubic-bezier(.2,1.6,.4,1) 3; }
  .mg-golfer.bonked .mg-eye i { animation:mg-dizzy .45s linear infinite; }
  .mg-golfer.bonked .mg-mouth { left:40%; right:40%; border-radius:50%; height:10%; top:64%; }
  .mg-golfer.bonked { animation:mg-squash .35s ease-out; }
  .mg-word { position:absolute; transform:translate(-50%, -50%) rotate(-8deg); z-index:9; pointer-events:none; font-size:2.2rem; color:#ffd400; -webkit-text-stroke:2px #111;
    paint-order:stroke fill; text-shadow:0 4px 0 #111; white-space:nowrap; animation:mg-pop .35s cubic-bezier(.2,1.8,.4,1) both; }
  .mg-word.bad { color:#ff4d6d; }
  .mg-clap { position:absolute; font-size:1.8rem; pointer-events:none; z-index:8; }
  .mg-star { position:absolute; font-size:1.3rem; pointer-events:none; z-index:8; }
  @keyframes mg-wave { 50% { transform:skewY(-6deg) scaleX(.94); } }
  @keyframes mg-goggle { 0%, 100% { transform:translate(-16%, 0); } 50% { transform:translate(16%, -12%); } }
  @keyframes mg-dizzy { from { transform:rotate(0) translate(30%); } to { transform:rotate(360deg) translate(30%); } }
  @keyframes mg-hop { 50% { translate:0 -20%; } }
  @keyframes mg-squash { 40% { scale:1.15 .8; } }
  @keyframes mg-pop { from { transform:translate(-50%, -50%) rotate(-8deg) scale(.2); } }
  @media (prefers-reduced-motion: reduce) { .mg-flag, .mg-eye i, .mg-golfer.yay, .mg-golfer.bonked { animation:none !important; } }`;

  function injectCss() {
    if (document.getElementById("mg-css")) return;
    const style = document.createElement("style");
    style.id = "mg-css";
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  registerMicrogame({
    id: "monster-golf",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 10000,
    input: "tap",
    tutorial: true, // has a ctx.tutorial script

    start(ctx) {
      injectCss();
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const { tone, sweep, noise } = ctx.sfx;
      const C = ctx.choiceRows(1, 3, { lowercase: true });
      const row = ctx.shuffle(C.rows[0].slice());

      const wrap = document.createElement("div");
      wrap.className = "mg";
      const card = document.createElement("button");
      card.className = "mg-card";
      card.setAttribute("aria-label", TEXT.cardLabel);
      card.innerHTML = '<span class="ct"></span>';
      card.firstChild.textContent = C.cardText;
      if (ctx.canSpeak && !C.listen) card.insertAdjacentHTML("beforeend", '<span class="spk">🔊</span>');
      card.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });
      const course = document.createElement("div");
      course.className = "mg-course";
      const fx = document.createElement("div");
      fx.className = "mg-fx";
      course.appendChild(fx);
      wrap.append(card, course);
      ctx.root.appendChild(wrap);

      const holes = row.map((opt, i) => {
        const el = document.createElement("div");
        el.className = "mg-hole";
        el.style.setProperty("--fc", FLAGS[i]);
        el.innerHTML = '<div class="mg-cup"></div><div class="mg-pole"></div><div class="mg-flag"></div>';
        el.querySelector(".mg-flag").textContent = opt.text;
        course.appendChild(el);
        return { el, i, opt, flag: el.querySelector(".mg-flag"), x: 0, y: 0, s: 0 };
      });
      const golfer = document.createElement("div");
      golfer.className = "mg-golfer";
      golfer.innerHTML = '<div class="mg-gbody"></div><div class="mg-cap"></div><div class="mg-eye l"><i></i></div><div class="mg-eye r"><i></i></div><div class="mg-mouth"></div><div class="mg-club"></div>';
      course.appendChild(golfer);
      const ball = document.createElement("div");
      ball.className = "mg-ball";
      course.appendChild(ball);

      let W = 0, H = 0, gz = 100, gx = 0, gy = 0, bs = 18, kicked = false;
      function layout() {
        W = course.clientWidth; H = course.clientHeight;
        gz = Math.max(80, Math.min(H * 0.34, 140)); bs = Math.max(14, gz * 0.16);
        course.style.setProperty("--gz", `${gz}px`); course.style.setProperty("--bs", `${bs}px`);
        gx = 70 + gz * 0.45; gy = H - 12;
        golfer.style.transform = `translate(${gx}px, ${gy}px)`;
        const spots = [{ fx: 0.45, fy: 0.94, k: 1 }, { fx: 0.68, fy: 0.78, k: 0.82 }, { fx: 0.88, fy: 0.64, k: 0.66 }];
        holes.forEach((h, i) => {
          const s = Math.max(70, Math.min(W * 0.24, H * 0.36, 140)) * spots[i].k;
          h.s = s; h.x = W * spots[i].fx; h.y = H * spots[i].fy;
          h.el.style.setProperty("--fs", `${s}px`);
          h.el.style.left = `${h.x}px`; h.el.style.top = `${h.y}px`;
          h.flag.style.fontSize = h.opt.kind === "word" ? `${Math.min(s * 0.28, (s * 0.9) / (h.opt.text.length * 0.6))}px` : "";
        });
        if (!kicked) setBall(gx + gz * 0.42, gy - bs * 0.5, 1);
      }
      function setBall(x, y, s) { ball.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${s.toFixed(3)})`; }
      const cupOf = (h) => ({ x: h.x, y: h.y - h.s * 1.6 * 0.08 });

      let done = false;
      const bar = ctx.powerBar({
        parent: course, press: course, icon: "⛳",
        onStart: () => golfer.classList.add("wind"),
        onRelease: (zone) => swing(holes[zone]),
      });
      bar.el.style.left = "8px"; bar.el.style.top = "10px"; bar.el.style.bottom = "10px";

      function swing(h) {
        if (done || ctx.ended) return;
        done = true; kicked = true;
        bar.lock();
        golfer.classList.remove("wind"); golfer.classList.add("swing");
        noise(0.05, "highpass", 2000, 4000, 0.4); tone(600, 0.05, "square", 0.1); // THWACK
        const right = h.opt.right;
        ctx.freezeTimer(); // the result is reported when it happens (hole in, or BONK), so the frame doesn't move on before it's seen
        const from = { x: gx + gz * 0.42, y: gy - bs * 0.5 }, to = cupOf(h), t0 = performance.now(), ms = reduceMotion ? 1 : 750;
        const lift = H * (0.25 + 0.1 * h.i);
        (function fly(now) {
          const k = Math.min(1, (now - t0) / ms);
          const x = from.x + (to.x - from.x) * k, y = from.y + (to.y - from.y) * k - Math.sin(k * Math.PI) * lift;
          setBall(x, y, 1 - 0.35 * k * (h.i / 2) - (k > 0.9 ? (k - 0.9) * 4 : 0) * (right ? 1 : 0));
          if (k < 1) { ctx.raf(fly); return; }
          tone(400, 0.05, "sine", 0.1); // plop
          if (right) holeIn(h); else bonk(h);
        })(t0);
      }

      function holeIn(h) {
        ctx.win();
        ball.style.opacity = "0";
        word(W / 2, H * 0.25, TEXT.hole, false);
        golfer.classList.add("yay");
        [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.14, "triangle", 0.12, i * 0.08));
        // The crowd claps: 👏 float up, with bursts of applause noise.
        for (let k = 0; k < 10; k++) ctx.later(() => {
          const c = document.createElement("div");
          c.className = "mg-clap"; c.textContent = "👏";
          c.style.left = `${10 + Math.random() * 80}%`; c.style.top = `${60 + Math.random() * 30}%`;
          fx.appendChild(c);
          c.animate([{ transform: "translateY(0) scale(.6)", opacity: 1 }, { transform: "translateY(-120px) scale(1.1)", opacity: 0 }], { duration: 900, easing: "ease-out", fill: "forwards" });
          noise(0.05, "bandpass", 2500, 1500, 0.25);
          ctx.later(() => c.remove(), 950);
        }, k * 90);
        ctx.confetti(fx, h.x, h.y - h.s, { count: 70 });
        ctx.say(C.answer);
      }

      function bonk(h) {
        // The ball sits in the wrong hole… then another one falls out of the sky onto the golfer's head.
        const head = { x: gx, y: gy - gz * 0.95 }, drop = document.createElement("div");
        drop.className = "mg-ball";
        fx.appendChild(drop);
        const t0 = performance.now(), ms = reduceMotion ? 1 : 550;
        whistle();
        (function fall(now) {
          const k = Math.min(1, (now - t0) / ms);
          drop.style.transform = `translate(${head.x}px, ${(-40 + (head.y + 40) * k * k).toFixed(1)}px)`;
          if (k < 1) { ctx.raf(fall); return; }
          golfer.classList.remove("swing");
          golfer.classList.add("bonked");
          ctx.lose();
          tone(180, 0.12, "square", 0.15); noise(0.08, "lowpass", 1200, 300, 0.4); // BONK
          word(head.x + 40, head.y - 20, TEXT.bonk, true);
          [0, 1, 2].forEach((n) => {
            const s = document.createElement("div");
            s.className = "mg-star"; s.textContent = "⭐";
            s.style.left = `${head.x}px`; s.style.top = `${head.y}px`;
            fx.appendChild(s);
            const a = (n / 3) * Math.PI * 2;
            s.animate([{ transform: "translate(-50%, -50%)" }, { transform: `translate(calc(-50% + ${Math.cos(a) * 30}px), calc(-50% + ${Math.sin(a) * 14 - 10}px))` }], { duration: 300, fill: "forwards" });
          });
          drop.animate([{ transform: drop.style.transform }, { transform: `translate(${head.x + 60}px, ${head.y + 40}px)`, opacity: 0 }], { duration: 400, fill: "forwards" });
          ctx.later(() => { holes.forEach((x) => x.el.classList.add(x.opt.right ? "right" : "dim")); ctx.say(C.answer); }, 300);
        })(t0);
      }
      function whistle() { sweep(1800, 600, 0.5, "sine", 0.06); }   // the falling whistle
      function word(x, y, text, bad) {
        const w = document.createElement("div");
        w.className = "mg-word" + (bad ? " bad" : "");
        w.textContent = text;
        w.style.left = `${Math.max(90, Math.min(W - 90, x))}px`; w.style.top = `${y}px`;
        fx.appendChild(w);
      }
      function replay() { if (!done) ctx.say(C.prompt); }

      ctx.onTimeout(() => { done = true; bar.lock(); golfer.classList.remove("wind"); holes.forEach((x) => x.el.classList.add(x.opt.right ? "right" : "dim")); ctx.say(C.answer); });
      function onKey(e) { if (e.key === " ") { e.preventDefault(); replay(); } }
      document.addEventListener("keydown", onKey);

      layout();
      const ro = new ResizeObserver(layout);
      ro.observe(course);
      ctx.say(C.prompt);
      // Show the target big in the middle for a moment before play starts (ctx.reveal).
      ctx.reveal(card);
      ctx.later(() => ctx.hint(bar.el.querySelector(".pwb-btn"), null, { scale: 0.7 }), 80);

      // Tutorial: point at the card, then the right flag, then charge to its colour and swing.
      ctx.tutorial(C.target, async (f) => {
        const btn = bar.el.querySelector(".pwb-btn"), h = holes.find((x) => x.opt.right);
        await f.point(card, 900);
        await f.point(h.flag, 700);
        await f.move(btn, 400);
        await f.tapNow(btn);
        await f.until(() => bar.charging && Math.abs(bar.level - bar.zoneCenter(h.i)) < 0.06, 6000);
        await f.tapNow(btn);
        await f.until(() => ctx.ended, 2000);
      });

      return () => { done = true; ro.disconnect(); document.removeEventListener("keydown", onKey); };
    },
  });
})();
