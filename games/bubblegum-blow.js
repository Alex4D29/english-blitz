// BUBBLEGUM BLOW — a sequence game (Claude's idea, named by the teacher; like Froggy Hop: a chain of choices,
// one right in each row, `ctx.choiceRows`). Your character chews gum under the card. Each right gumball makes
// them blow the bubble bigger; after the last row the bubble is so big it floats them up and away (WHEEE!).
// A wrong gumball: POP! The bubble bursts all over their face (pink splats, sad), and the round is lost.
(function () {
  const TEXT = {
    name: { en: "Bubblegum Blow" },
    icon: "🫧",
    howTo: { en: {
      steps: [
        ["👀", "Look at the card."],
        ["🍬", "Tap the gumball that matches. The bubble gets BIGGER!"],
        ["🎈", "Keep going until the bubble floats away with you!"],
      ],
      tips: ["A wrong gumball and POP! Gum all over your face.", "Tap the card to hear it again.", "When the game speeds up, the bubble needs one more puff."],
    } },
    instruction: { en: "BLOW THE\nBUBBLE!" },
    cardLabel: "The card. Tap to hear it again.",
    ballLabel: (t) => `Gumball ${t}`,
    puff: ["PUFF!", "BIGGER!", "HUGE!", "MEGA!"],
    pop: "POP!",
    whee: "WHEEE!",
  };
  const BALLS = ["#ff6fb0", "#4dd3ff", "#ffd400", "#8fe36b", "#c38bff"];

  const CSS = `
  .gum { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:6px; padding-bottom:6px; }
  .gum-card { flex:none; min-width:120px; padding:4px 16px; background:#fff; border:5px solid #111; border-radius:16px; box-shadow:0 5px 0 #111; font:inherit; color:#111;
    font-size:clamp(2rem, 9vw, 3.2rem); line-height:1.05; cursor:pointer; touch-action:manipulation; display:flex; align-items:center; gap:6px; white-space:nowrap; }
  .gum-card .spk { font-size:.45em; }
  .gum-stage { position:relative; flex:1; min-height:0; width:100%; max-width:600px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111;
    background:radial-gradient(circle at 50% 40%, #fff3fa 0 30%, #ffd1e8 70%); }
  .gum-stage::before { content:""; position:absolute; inset:0; background:radial-gradient(circle, rgba(255,111,176,.25) 0 6px, transparent 7px) 0 0 / 46px 46px; }
  .gum-steps { position:absolute; left:10px; top:10px; display:flex; flex-direction:column-reverse; gap:5px; z-index:3; }
  .gum-step { width:22px; height:22px; border:3px solid #111; border-radius:50%; background:#fff; }
  .gum-step.on { background:#ff6fb0; } .gum-step.now { box-shadow:0 0 0 4px #ffd400; }
  /* You (--gmz), and the bubble at your mouth */
  .gum-me { position:absolute; left:50%; top:var(--my); width:var(--gmz); height:var(--gmz); margin-left:calc(var(--gmz) / -2); z-index:2; }
  .gum-bub { position:absolute; left:50%; top:64%; width:calc(var(--gmz) * 1.2); aspect-ratio:1; margin:calc(var(--gmz) * -.6) 0 0 calc(var(--gmz) * -.6); z-index:6; border-radius:50%;
    border:4px solid #111; background:radial-gradient(circle at 32% 28%, #fff 0 9%, rgba(255,255,255,0) 10%), radial-gradient(circle at 50% 50%, #ffb3d6 0 55%, #ff6fb0 100%);
    opacity:.93; transform:scale(var(--bs, .08)); transition:transform .35s cubic-bezier(.2,1.6,.4,1); pointer-events:none; }
  .gum-bub.wobble { animation:gum-wob .5s ease-in-out infinite alternate; }
  .gum-splat { position:absolute; z-index:7; background:#ff6fb0; border:3px solid #111; border-radius:46% 54% 40% 60% / 50% 40% 60% 50%; pointer-events:none; }
  .gum-me.fly { z-index:5; }
  /* The gumballs (--kz) on the counter */
  .gum-tray { position:absolute; left:0; right:0; bottom:0; height:calc(var(--kz) + 30px); display:flex; align-items:center; justify-content:center; gap:12px; z-index:3;
    background:linear-gradient(#c9874a, #a86a35); border-top:5px solid #111; }
  .gum-ball { width:var(--kz); height:var(--kz); padding:0; border:4px solid #111; border-radius:50%; font:inherit; color:#111; cursor:pointer; touch-action:manipulation;
    background:radial-gradient(circle at 30% 28%, rgba(255,255,255,.85) 0 10%, transparent 11%), var(--c); box-shadow:0 5px 0 #111; display:flex; align-items:center; justify-content:center;
    animation:gum-in .3s cubic-bezier(.2,1.6,.4,1) both; }
  .gum-ball span { padding:1px 5px; background:#fff; border:3px solid #111; border-radius:9px; font-size:calc(var(--kz) * .36); line-height:1.1; white-space:nowrap; }
  .gum-ball:active { transform:translateY(3px); box-shadow:0 2px 0 #111; }
  .gum-ball.right { box-shadow:0 0 0 5px #fff, 0 0 0 10px #00b86b; } .gum-ball.dim { opacity:.35; } .gum-ball.bad { filter:grayscale(.8); }
  .gum-fx { position:absolute; inset:0; pointer-events:none; z-index:9; overflow:visible; }
  .gum-word { position:absolute; transform:translate(-50%, -50%) rotate(-8deg); font-size:2.1rem; color:#ff6fb0; -webkit-text-stroke:2px #111; paint-order:stroke fill;
    text-shadow:0 4px 0 #111; white-space:nowrap; animation:gum-word 1s ease-out forwards; }
  @keyframes gum-wob { from { scale:1 1; } to { scale:1.04 .96; } }
  @keyframes gum-in { from { scale:.4; opacity:0; } }
  @keyframes gum-word { from { opacity:1; scale:.5; } 25% { scale:1.15; } 75% { opacity:1; } to { opacity:0; translate:0 -40px; } }
  @media (prefers-reduced-motion: reduce) { .gum-bub, .gum-ball, .gum-word { animation:none !important; transition:none !important; } }
  `;
  function injectCss() { if (document.getElementById("gum-css")) return; const s = document.createElement("style"); s.id = "gum-css"; s.textContent = CSS; document.head.appendChild(s); }

  registerMicrogame({
    id: "bubblegum-blow",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 10000,
    input: "tap",
    tutorial: true,

    start(ctx) {
      injectCss();
      const speed = ctx.speed || 1;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const { tone, sweep, noise } = ctx.sfx;
      const R = speed >= 1.5 ? 4 : 3, N = speed >= 2 ? 4 : 3;
      const C = ctx.choiceRows(R, N, { lowercase: true });

      const wrap = document.createElement("div");
      wrap.className = "gum";
      const card = document.createElement("button");
      card.className = "gum-card";
      card.setAttribute("aria-label", TEXT.cardLabel);
      card.innerHTML = '<span class="ct"></span>';
      card.firstChild.textContent = C.cardText;
      if (ctx.canSpeak && !C.listen) card.insertAdjacentHTML("beforeend", '<span class="spk">🔊</span>');
      card.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });
      const stage = document.createElement("div");
      stage.className = "gum-stage";
      stage.innerHTML = `<div class="gum-steps">${'<span class="gum-step"></span>'.repeat(R)}</div>`;
      const me = document.createElement("div");
      me.className = "gum-me";
      const fig = window.Mascot ? window.Mascot.el("var(--gmz)") : document.createElement("div");
      me.appendChild(fig);
      const bub = document.createElement("div");
      bub.className = "gum-bub wobble";
      me.appendChild(bub);
      const tray = document.createElement("div");
      tray.className = "gum-tray";
      const fx = document.createElement("div");
      fx.className = "gum-fx";
      stage.append(me, tray, fx);
      wrap.append(card, stage);
      ctx.root.appendChild(wrap);
      const stepEls = stage.querySelectorAll(".gum-step");

      let W = 0, H = 0, mz = 120, kz = 70;
      function layout() {
        W = stage.clientWidth; H = stage.clientHeight;
        kz = Math.max(56, Math.min((W - 40) / N - 14, H * 0.2, 96));
        mz = Math.max(80, Math.min((H - kz - 30) * 0.62, W * 0.42, 220));
        stage.style.setProperty("--kz", `${kz}px`); stage.style.setProperty("--gmz", `${mz}px`);
        stage.style.setProperty("--my", `${Math.max(10, (H - kz - 30 - mz) * 0.62)}px`);
        balls.forEach(({ b, o }) => { b.firstChild.style.fontSize = o.kind === "word" ? `${Math.min(kz * 0.32, (kz * 1.1) / ([...o.text].length * 0.62))}px` : ""; });
      }

      let r = 0, done = false, busy = false, balls = [];
      function deal() {
        tray.innerHTML = "";
        stepEls.forEach((s, i) => { s.classList.toggle("on", i < r); s.classList.toggle("now", i === r); });
        balls = ctx.shuffle(C.rows[r].slice()).map((o, i) => {
          const b = document.createElement("button");
          b.className = "gum-ball";
          b.style.setProperty("--c", BALLS[(i + r) % BALLS.length]);
          b.style.animationDelay = `${i * 0.05}s`;
          b.setAttribute("aria-label", TEXT.ballLabel(o.spoken || o.text));
          b.innerHTML = "<span></span>";
          b.firstChild.textContent = o.text;
          b.addEventListener("pointerdown", (e) => { e.preventDefault(); pick(b, o); });
          tray.appendChild(b);
          return { b, o };
        });
        if (W) layout();
      }
      const size = (k) => 0.08 + 0.92 * Math.pow(k / R, 1.1);
      function pick(b, o) {
        if (done || busy || ctx.ended) return;
        if (!o.right) { pop(b); return; }
        busy = true;
        r++;
        // Chomp chomp, then a big breath into the bubble.
        if (window.Mascot) window.Mascot.mood(fig, "eat");
        tone(300, 0.05, "square", 0.06); tone(300, 0.05, "square", 0.06, 0.12);
        ctx.later(() => {
          if (window.Mascot) window.Mascot.mood(fig, null);
          bub.style.setProperty("--bs", size(r).toFixed(3));
          sweep(200 + r * 80, 500 + r * 140, 0.35, "sine", 0.1);   // fwoooo
          word(r >= R ? TEXT.puff[3] : TEXT.puff[Math.min(r - 1, 2)], W / 2, H * 0.12);
          if (o.kind === "pic") ctx.say(o.spoken);
          if (r >= R) { done = true; ctx.win(); floatAway(); return; }
          deal();
          busy = false;
        }, reduceMotion ? 10 : 260);
      }
      // The last puff: the bubble is so big it lifts you up and away.
      function floatAway() {
        stepEls.forEach((s) => { s.classList.add("on"); s.classList.remove("now"); });
        tray.querySelectorAll(".gum-ball").forEach((x) => x.classList.add("dim"));
        if (window.Mascot) window.Mascot.mood(fig, "cheer");
        ctx.later(() => {
          bub.style.setProperty("--bs", "1.25");
          me.classList.add("fly");
          me.animate([{ transform: "translate(0, 0)" }, { transform: `translate(${W * 0.06}px, ${-H * 0.15}px) rotate(-5deg)`, offset: 0.3 }, { transform: `translate(${-W * 0.05}px, ${-H * 1.2}px) rotate(6deg)` }],
            { duration: reduceMotion ? 1 : 1500, easing: "ease-in", fill: "forwards" });
          sweep(400, 1600, 1.2, "triangle", 0.07);
          word(TEXT.whee, W / 2, H * 0.35);
          ctx.confetti(fx, W / 2, H * 0.5, { count: 80 });
          ctx.say(C.answer);
        }, 400);
      }
      // A wrong gumball: POP! Gum all over your face.
      function pop(b) {
        done = true;
        ctx.lose();
        b.classList.add("bad");
        bub.classList.remove("wobble");
        bub.style.transition = "none";
        bub.animate([{ transform: `scale(${size(r) + 0.15})` }, { transform: `scale(${size(r) + 0.45})`, opacity: 0 }], { duration: 160, fill: "forwards" });
        noise(0.08, "highpass", 1500, 3000, 0.5); tone(140, 0.12, "square", 0.12);   // POP
        word(TEXT.pop, W / 2, H * 0.18);
        if (window.Mascot) window.Mascot.mood(fig, "sad");
        // Pink splats stuck all over the face.
        [[22, 18, 0.3], [62, 12, 0.26], [40, 40, 0.34], [12, 52, 0.22], [70, 46, 0.24], [48, 70, 0.2]].forEach(([x, y, s], k) => {
          const g = document.createElement("div");
          g.className = "gum-splat";
          g.style.left = `${x}%`; g.style.top = `${y}%`; g.style.width = `calc(var(--gmz) * ${s})`; g.style.height = `calc(var(--gmz) * ${s * 0.8})`;
          me.appendChild(g);
          g.animate([{ transform: "scale(0)" }, { transform: "scale(1.2)" }, { transform: "scale(1)" }], { duration: reduceMotion ? 1 : 260, delay: k * 30, fill: "backwards" });
        });
        ctx.later(() => { balls.forEach((x) => x.b.classList.add(x.o.right ? "right" : "dim")); ctx.say(C.answer); }, 500);
      }
      function word(text, x, y) {
        const w = document.createElement("div");
        w.className = "gum-word";
        w.textContent = text;
        w.style.left = `${x}px`; w.style.top = `${Math.max(30, y)}px`;
        fx.appendChild(w);
        ctx.later(() => w.remove(), 1000);
      }
      function replay() { if (!done) ctx.say(C.prompt); }

      ctx.onTimeout(() => { done = true; if (window.Mascot) window.Mascot.mood(fig, "sad"); balls.forEach((x) => x.b.classList.add(x.o.right ? "right" : "dim")); ctx.say(C.answer); });
      function onKey(e) {
        const i = parseInt(e.key, 10) - 1;
        if (i >= 0 && i < balls.length) { e.preventDefault(); pick(balls[i].b, balls[i].o); }
        else if (e.key === " ") { e.preventDefault(); replay(); }
      }
      document.addEventListener("keydown", onKey);

      deal();
      layout();
      const ro = new ResizeObserver(layout);
      ro.observe(stage);
      ctx.say(C.prompt);
      ctx.reveal(card);

      // Tutorial: point at the card, then tap the right gumball in each row.
      ctx.tutorial(C.target, async (f) => {
        await f.point(card, 900);
        for (let n = 0; n < R && !done; n++) {
          await f.until(() => !busy && r === n, 2000);
          await f.tap(() => (balls.find((x) => x.o.right) || balls[0]).b);
          await f.until(() => r > n || done, 1500);
        }
      });
      return () => { done = true; ro.disconnect(); document.removeEventListener("keydown", onKey); };
    },
  });
})();
