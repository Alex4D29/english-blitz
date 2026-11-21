// TEST YOUR STRENGTH — a power-bar game (js/power.js), fairground hammer style. The card at the top
// shows the target (letter; phonics letter; CVC word; HFW 🔊) and the voice says it. A macho purple
// monster (tank top, big arms, googly eyes) holds a giant mallet beside a tall striker tower. The tower
// has three bands with options: bottom (green), middle (yellow) and top (red), like the power bar, and a
// bell on top. Charge the power bar (press and hold, or tap, tap): the monster raises the mallet, then
// slams it down, and the puck shoots up to the band for that power. One hit decides. Right: DING! (the
// band lights up, the bell rings when it's the top), the monster flexes, confetti. Wrong: the puck flops
// at the wrong band, the monster is embarrassed (💦), and the right band glows.
(function () {
  const TEXT = {
    name: { en: "Test Your Strength" },
    icon: "🔨",
    howTo: (list) => ({ en: {
      steps: [
        list.type === "hfw" ? ["👂", "Listen to the word, like \"the\"."] : ["👀", "Look at the card at the top."],
        ["🔔", "Find it on the tower. Green is low, yellow is in the middle, red is at the top."],
        ["💪", "Hold to fill the power bar, then let go to SMASH! (Or tap, then tap again.)"],
      ],
      tips: [
        "Green power sends the puck to the green part, yellow to yellow, red all the way up to red.",
        "Tap the card to hear it again.",
      ],
    } }),
    instruction: { en: "TEST YOUR\nSTRENGTH!" },
    cardLabel: "Hear it again",
    ding: "DING!",
    flop: "OOPS!",
  };

  const BANDS = ["#2fd15b", "#ffd400", "#ff4d6d"]; // bottom, middle, top
  const CSS = `
  .ts { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:8px; padding-bottom:8px; }
  .ts-card { flex:none; min-width:84px; height:72px; padding:0 18px; border-radius:18px; font:inherit; font-size:2.6rem; line-height:1; background:#fff; color:#111;
    border:5px solid #111; box-shadow:0 6px 0 #111; display:flex; align-items:center; justify-content:center; gap:8px; cursor:pointer; touch-action:manipulation; }
  .ts-card .spk { font-size:1.3rem; opacity:.6; }
  .ts-fair { position:relative; flex:1; min-height:0; width:100%; max-width:560px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111;
    background:repeating-linear-gradient(90deg, #ff6f91 0 40px, #fff 40px 80px); touch-action:none; cursor:pointer; }
  .ts-fair::after { content:""; position:absolute; left:0; right:0; bottom:0; height:14%; background:#c98a4b; border-top:5px solid #111; }
  .ts-fx { position:absolute; inset:0; pointer-events:none; overflow:visible; z-index:8; }
  /* The tower: a tall post with three bands, a bell on top, a pad at the bottom */
  .ts-tower { position:absolute; width:var(--tw); transform:translateX(-50%); z-index:2; pointer-events:none; }
  .ts-post { position:absolute; left:12%; right:12%; top:var(--bell); bottom:0; background:#fff; border:5px solid #111; border-radius:10px; display:flex; flex-direction:column-reverse; overflow:hidden; }
  .ts-band { flex:1; position:relative; border-top:4px solid #111; display:flex; align-items:center; justify-content:center; }
  .ts-band:first-child { border-top:0; }
  .ts-sign { padding:2px 4px; min-width:80%; max-width:96%; box-sizing:border-box; background:#fff; border:4px solid #111; border-radius:10px; font-size:calc(var(--tw) * .36); line-height:1.05; color:#111; white-space:nowrap; text-align:center; }
  .ts-band.lit { filter:brightness(1.25); box-shadow:inset 0 0 0 6px #fff; }
  .ts-band.right .ts-sign { box-shadow:0 0 0 5px #fff, 0 0 0 10px #00b86b; }
  .ts-band.dim { opacity:.5; }
  .ts-bell { position:absolute; left:50%; top:0; width:calc(var(--tw) * .6); height:var(--bell); transform:translateX(-50%); background:#ffd400; border:5px solid #111;
    border-radius:50% 50% 10% 10% / 70% 70% 10% 10%; }
  .ts-bell.ring { animation:ts-ring .12s linear 6; }
  .ts-pad { position:absolute; left:-10%; right:-10%; bottom:-8px; height:14px; background:#e8173c; border:4px solid #111; border-radius:6px; }
  .ts-puck { position:absolute; left:50%; width:calc(var(--tw) * .4); height:calc(var(--tw) * .22); margin-left:calc(var(--tw) * -.2); background:#444; border:4px solid #111;
    border-radius:8px; z-index:3; }
  /* The macho monster: purple, a tank top, big arms, a giant mallet. Anchor: feet. --mz is its height */
  .ts-mon { position:absolute; left:0; top:0; width:calc(var(--mz) * .9); height:var(--mz); margin:calc(var(--mz) * -1) 0 0 calc(var(--mz) * -.45); z-index:5; pointer-events:none; }
  .ts-body { position:absolute; left:14%; right:14%; top:14%; bottom:0; background:#9c6bff; border:5px solid #111; border-radius:44% 44% 30% 30%; }
  .ts-top { position:absolute; left:22%; right:22%; top:46%; bottom:6%; background:#fff; border:4px solid #111; border-radius:10px 10px 20px 20px; }
  .ts-arm { position:absolute; top:36%; width:30%; height:26%; background:#9c6bff; border:5px solid #111; border-radius:50%; z-index:1; }
  .ts-arm.l { left:-6%; } .ts-arm.r { right:-6%; }
  .ts-eye { position:absolute; top:22%; width:22%; aspect-ratio:1; background:#fff; border:3px solid #111; border-radius:50%; z-index:2; }
  .ts-eye.l { left:28%; } .ts-eye.r { right:28%; width:18%; top:24%; }
  .ts-eye i { position:absolute; left:28%; top:30%; width:46%; aspect-ratio:1; background:#111; border-radius:50%; animation:ts-goggle 1.1s ease-in-out infinite; }
  .ts-brow { position:absolute; top:17%; width:22%; height:4%; background:#111; border-radius:9px; z-index:3; }
  .ts-brow.l { left:28%; transform:rotate(-10deg); } .ts-brow.r { right:28%; transform:rotate(10deg); }
  .ts-mouth { position:absolute; left:36%; right:36%; top:36%; height:8%; z-index:2; background:#6b1020; border:3px solid #111; border-radius:4px 4px 999px 999px; }
  /* The mallet, in the monster's hands (its pivot, at the bottom: 64% across, 48% up). At rest it leans back over the
     shoulder, charging raises it further back, and the slam swings it over onto the pad at the foot of the tower
     (the monster is placed so the mallet head lands there), so it never sits over the answers. */
  .ts-mallet { position:absolute; left:58%; bottom:48%; width:13%; height:80%; z-index:4; transform-origin:50% 100%; transform:rotate(-30deg); transition:transform .2s; }
  .ts-mallet::before { content:""; position:absolute; left:32%; right:32%; top:18%; bottom:0; background:#8b5a2b; border:3px solid #111; border-radius:3px; }
  .ts-mallet::after { content:""; position:absolute; left:-110%; right:-110%; top:0; height:22%; background:#e8173c; border:4px solid #111; border-radius:8px; }
  .ts-mon.raise .ts-mallet { transform:rotate(-75deg); transition:transform .5s; }
  .ts-mon.slam .ts-mallet { transform:rotate(130deg); transition:transform .14s ease-in; }
  .ts-mon.flex { animation:ts-flex .3s ease-in-out infinite alternate; }
  .ts-mon.flex .ts-arm { transform:translateY(-40%) scale(1.25); }
  .ts-mon.oops .ts-mouth { border-radius:999px 999px 4px 4px; height:5%; top:40%; }
  .ts-word { position:absolute; transform:translate(-50%, -50%) rotate(-8deg); z-index:9; pointer-events:none; font-size:2.4rem; color:#ffd400; -webkit-text-stroke:2px #111;
    paint-order:stroke fill; text-shadow:0 4px 0 #111; white-space:nowrap; animation:ts-pop .35s cubic-bezier(.2,1.8,.4,1) both; }
  .ts-word.bad { color:#fff; font-size:1.8rem; }
  @keyframes ts-ring { 50% { rotate:-14deg; } }
  @keyframes ts-goggle { 0%, 100% { transform:translate(-16%, 0); } 50% { transform:translate(16%, -12%); } }
  @keyframes ts-flex { from { rotate:-5deg; } to { rotate:5deg; } }
  @keyframes ts-pop { from { transform:translate(-50%, -50%) rotate(-8deg) scale(.2); } }
  @media (prefers-reduced-motion: reduce) { .ts-eye i, .ts-mon.flex, .ts-bell.ring { animation:none !important; } }`;

  function injectCss() {
    if (document.getElementById("ts-css")) return;
    const style = document.createElement("style");
    style.id = "ts-css";
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  registerMicrogame({
    id: "strength-test",
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
      wrap.className = "ts";
      const card = document.createElement("button");
      card.className = "ts-card";
      card.setAttribute("aria-label", TEXT.cardLabel);
      card.innerHTML = '<span class="ct"></span>';
      card.firstChild.textContent = C.cardText;
      if (ctx.canSpeak && !C.listen) card.insertAdjacentHTML("beforeend", '<span class="spk">🔊</span>');
      card.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });
      const fair = document.createElement("div");
      fair.className = "ts-fair";
      const fx = document.createElement("div");
      fx.className = "ts-fx";
      fair.appendChild(fx);
      wrap.append(card, fair);
      ctx.root.appendChild(wrap);

      const tower = document.createElement("div");
      tower.className = "ts-tower";
      tower.innerHTML = '<div class="ts-bell"></div><div class="ts-post">' +
        row.map((o, i) => `<div class="ts-band" style="background:${BANDS[i]}"><div class="ts-sign"></div></div>`).join("") +
        '</div><div class="ts-pad"></div><div class="ts-puck"></div>';
      fair.appendChild(tower);
      const bands = [...tower.querySelectorAll(".ts-band")].map((el, i) => ({ el, i, opt: row[i], sign: el.querySelector(".ts-sign") }));
      bands.forEach((b) => { b.sign.textContent = b.opt.text; });
      const puck = tower.querySelector(".ts-puck"), bell = tower.querySelector(".ts-bell");
      const mon = document.createElement("div");
      mon.className = "ts-mon";
      mon.innerHTML = '<div class="ts-body"></div><div class="ts-top"></div><div class="ts-arm l"></div><div class="ts-arm r"></div><div class="ts-brow l"></div><div class="ts-brow r"></div>' +
        '<div class="ts-eye l"><i></i></div><div class="ts-eye r"><i></i></div><div class="ts-mouth"></div><div class="ts-mallet"></div>';
      fair.appendChild(mon);

      let W = 0, H = 0, tw = 90, th = 300, bellH = 40, tx = 0;
      function layout() {
        W = fair.clientWidth; H = fair.clientHeight;
        tw = Math.max(86, Math.min(W * 0.3, 150));
        bellH = tw * 0.42;
        th = H * 0.86 - 16;
        tx = W * 0.62;
        tower.style.cssText = `left:${tx}px;top:${H * 0.86 - th}px;height:${th}px;--tw:${tw}px;--bell:${bellH}px;`;
        const mz = Math.max(100, Math.min(H * 0.42, 170));
        fair.style.setProperty("--mz", `${mz}px`);
        // Its mallet pivots 0.13 mz right of its middle and the head lands 0.675 mz to the right at the slam,
        // so stand it there to bring the mallet down on the pad (the tower's middle).
        mon.style.transform = `translate(${Math.max(mz * 0.5, tx - mz * 0.675)}px, ${H * 0.86 + 2}px)`;
        // Words are sized to the post (76% of the tower), so long sight words fit.
        bands.forEach((b) => { b.sign.style.fontSize = b.opt.kind === "word" ? `${Math.min(tw * 0.3, (tw * 0.76 * 0.86) / (b.opt.text.length * 0.62))}px` : ""; });
        setPuck(0);
      }
      // The puck's height: 0 = on the pad, 1 = up at the bell. Band i spans (i/3 .. (i+1)/3) of the post.
      function setPuck(f) {
        const post = th - bellH, ph = tw * 0.22;
        puck.style.top = `${(bellH + post * (1 - f) - ph - (f > 0 ? 0 : 4)).toFixed(1)}px`;
      }

      let done = false;
      const bar = ctx.powerBar({
        parent: fair, press: fair, icon: "🔨",
        onStart: () => mon.classList.add("raise"),
        onRelease: (zone) => smash(bands[zone]),
      });
      bar.el.style.right = "8px"; bar.el.style.top = "10px"; bar.el.style.bottom = "16%";

      function smash(b) {
        if (done || ctx.ended) return;
        done = true;
        bar.lock();
        mon.classList.remove("raise"); mon.classList.add("slam");
        noise(0.12, "lowpass", 800, 100, 0.8); tone(90, 0.12, "square", 0.15); // WHAM on the pad
        const right = b.opt.right;
        ctx.freezeTimer(); // reported when the puck arrives, so the frame doesn't move on before it's seen
        const goal = (b.i + 0.5) / 3, t0 = performance.now(), ms = reduceMotion ? 1 : 520;
        sweep(200, 200 + goal * 900, 0.5, "square", 0.06); // the puck whizzes up
        (function rise(now) {
          const k = Math.min(1, (now - t0) / ms), e = 1 - (1 - k) * (1 - k);
          setPuck(goal * e);
          if (k < 1) { ctx.raf(rise); return; }
          if (right) ding(b); else flop(b);
        })(t0);
      }
      function ding(b) {
        ctx.win();
        b.el.classList.add("lit");
        if (b.i === 2) bell.classList.add("ring");
        [0, 0.1].forEach((d) => tone(1568, 0.4, "triangle", 0.15, d)); // DING
        word(tx, H * 0.2, TEXT.ding, false);
        mon.classList.remove("slam"); mon.classList.add("flex");
        ctx.confetti(fx, tx, H * 0.3, { count: 80 });
        ctx.say(C.answer);
      }
      function flop(b) {
        ctx.lose();
        sweep(400, 120, 0.4, "sawtooth", 0.1); // flop
        word(tx, H * 0.2, TEXT.flop, true);
        mon.classList.remove("slam"); mon.classList.add("oops");
        const s = document.createElement("div");
        s.textContent = "💦"; s.style.cssText = "position:absolute;font-size:1.6rem;";
        const r = mon.getBoundingClientRect(), f0 = fair.getBoundingClientRect();
        s.style.left = `${r.right - f0.left - 20}px`; s.style.top = `${r.top - f0.top}px`;
        fx.appendChild(s);
        ctx.later(() => { bands.forEach((x) => x.el.classList.add(x.opt.right ? "right" : "dim")); ctx.say(C.answer); }, 350);
      }
      function word(x, y, text, bad) {
        const w = document.createElement("div");
        w.className = "ts-word" + (bad ? " bad" : "");
        w.textContent = text;
        w.style.left = `${Math.max(70, Math.min(W - 70, x))}px`; w.style.top = `${y}px`;
        fx.appendChild(w);
      }
      function replay() { if (!done) ctx.say(C.prompt); }

      ctx.onTimeout(() => { done = true; bar.lock(); mon.classList.remove("raise"); bands.forEach((x) => x.el.classList.add(x.opt.right ? "right" : "dim")); ctx.say(C.answer); });
      function onKey(e) { if (e.key === " ") { e.preventDefault(); replay(); } }
      document.addEventListener("keydown", onKey);

      layout();
      const ro = new ResizeObserver(layout);
      ro.observe(fair);
      ctx.say(C.prompt);
      // Show the target big in the middle for a moment before play starts (ctx.reveal).
      ctx.reveal(card);
      ctx.later(() => ctx.hint(bar.el.querySelector(".pwb-btn"), null, { scale: 0.7 }), 80);

      // Tutorial: point at the card, then the right band, then charge to its colour and smash.
      ctx.tutorial(C.target, async (f) => {
        const btn = bar.el.querySelector(".pwb-btn"), b = bands.find((x) => x.opt.right);
        await f.point(card, 900);
        await f.point(b.sign, 700);
        await f.move(btn, 400);
        await f.tapNow(btn);
        await f.until(() => bar.charging && Math.abs(bar.level - bar.zoneCenter(b.i)) < 0.06, 6000);
        await f.tapNow(btn);
        await f.until(() => ctx.ended, 2000);
      });

      return () => { done = true; ro.disconnect(); document.removeEventListener("keydown", onKey); };
    },
  });
})();
