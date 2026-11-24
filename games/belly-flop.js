// BELLY FLOP SPLASH — a power bar game (Claude's idea, named by the teacher; like Monster Golf: ctx.powerBar,
// near / middle / far in green, yellow, red). Your character bounces on a diving board above a pool with rubber
// rings floating at different distances, each with an answer. Charge and let go: the power decides which ring
// you land in. The right ring: a perfect dive, a neat splash, and the judges hold up 10s. The wrong one: a huge
// BELLY FLOP, SMACK, a giant splash, a bright red tummy, and the judges hold up 0s.
(function () {
  const TEXT = {
    name: { en: "Belly Flop Splash" },
    icon: "🏊",
    howTo: { en: {
      steps: [
        ["👀", "Look at the card, then find it on a swim ring."],
        ["👆", "Press and hold (or tap) to bounce. Let go when the bar is on that ring's colour."],
        ["🏊", "Land in the right ring for a perfect dive!"],
      ],
      tips: ["The wrong ring is a BELLY FLOP. SMACK!", "Green is close, yellow is in the middle, red is far.", "Tap the card to hear it again."],
    } },
    instruction: { en: "DIVE IN!" },
    cardLabel: "The card. Tap to hear it again.",
    perfect: "PERFECT 10!",
    smack: "SMACK!",
  };

  const CSS = `
  .bf { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:6px; padding-bottom:6px; }
  .bf-card { flex:none; min-width:110px; padding:4px 16px; background:#fff; border:5px solid #111; border-radius:16px; box-shadow:0 5px 0 #111; font:inherit; color:#111;
    font-size:clamp(1.8rem, 8vw, 3rem); line-height:1.05; cursor:pointer; touch-action:manipulation; display:flex; align-items:center; gap:6px; white-space:nowrap; }
  .bf-card .spk { font-size:.45em; }
  .bf-pool { position:relative; flex:1; min-height:0; width:100%; max-width:640px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111;
    background:linear-gradient(180deg, #bfe9ff 0 var(--wy), #2fa6e8 var(--wy)); }
  .bf-pool::before { content:""; position:absolute; left:0; right:0; top:var(--wy); bottom:0; background:repeating-linear-gradient(0deg, transparent 0 22px, rgba(255,255,255,.12) 22px 26px),
    linear-gradient(90deg, rgba(255,255,255,.06) 0 50%, transparent 50%) 0 0 / 60px 100%; }
  .bf-edge { position:absolute; left:0; right:0; top:calc(var(--wy) - 6px); height:12px; background:repeating-linear-gradient(90deg, #fff 0 24px, #4aa8e8 24px 48px); border-top:3px solid #111; border-bottom:3px solid #111; z-index:1; }
  /* The diving board on its tower */
  .bf-tower { position:absolute; left:var(--tx); top:var(--by); width:calc(var(--bmz) * .32); bottom:0; background:repeating-linear-gradient(0deg, #e0e0e8 0 18px, #c4c4d0 18px 20px); border:4px solid #111; border-bottom:0; }
  .bf-ladder { position:absolute; left:calc(var(--tx) - 16px); top:var(--by); width:14px; bottom:0; background:repeating-linear-gradient(0deg, transparent 0 14px, #888 14px 18px); border-left:3px solid #888; border-right:3px solid #888; }
  .bf-board { position:absolute; left:var(--tx); top:var(--by); width:calc(var(--bmz) * 1.25); height:12px; background:#2ec4b6; border:4px solid #111; border-radius:0 8px 8px 0; transform-origin:0 50%; z-index:2; }
  .bf-board.flex { animation:bf-flex .18s ease-in-out infinite alternate; }
  /* You (--bmz) */
  .bf-me { position:absolute; left:0; top:0; width:var(--bmz); height:var(--bmz); z-index:4; pointer-events:none; }
  .bf-me .ms { transition:filter .2s; }
  .bf-belly { position:absolute; left:28%; top:40%; width:44%; height:34%; z-index:6; border-radius:50%; background:radial-gradient(circle, rgba(255,30,60,.85) 0 45%, rgba(255,30,60,0) 72%);
    animation:bf-throb .3s ease-in-out infinite alternate; }
  @keyframes bf-throb { to { scale:1.15; } }
  .bf-me.bounce { animation:bf-bounce .36s ease-in-out infinite alternate; }
  /* The swim rings: --rs is a ring's size, --fc its power colour */
  .bf-ring { position:absolute; width:var(--rs); height:calc(var(--rs) * .5); margin:calc(var(--rs) * -.25) 0 0 calc(var(--rs) / -2); z-index:3; border-radius:50%;
    border:calc(var(--rs) * .12) solid var(--fc); box-shadow:0 0 0 3px #111, inset 0 0 0 3px #111; background:rgba(255,255,255,.18); animation:bf-float 1.4s ease-in-out infinite alternate; }
  .bf-ring::before { content:""; position:absolute; inset:-14%; border-radius:50%; background:repeating-conic-gradient(transparent 0 30deg, rgba(255,255,255,.7) 30deg 45deg); -webkit-mask:radial-gradient(closest-side, transparent 62%, #000 64%); mask:radial-gradient(closest-side, transparent 62%, #000 64%); }
  .bf-lbl { position:absolute; left:50%; bottom:100%; transform:translateX(-50%); margin-bottom:4px; padding:1px 6px; background:#fff; border:3px solid #111; border-radius:9px;
    font-size:calc(var(--rs) * .3); line-height:1.1; white-space:nowrap; color:#111; }
  .bf-ring.right .bf-lbl { box-shadow:0 0 0 4px #fff, 0 0 0 8px #00b86b; } .bf-ring.dim { opacity:.35; }
  .bf-fx { position:absolute; inset:0; pointer-events:none; z-index:8; overflow:visible; }
  .bf-drop { position:absolute; width:12px; height:16px; background:#bfe9ff; border:2px solid #1e7fd6; border-radius:50% 50% 50% 50% / 60% 60% 40% 40%; }
  .bf-judges { position:absolute; left:50%; top:6%; transform:translateX(-50%); display:flex; gap:10px; z-index:9; }
  .bf-judge { width:54px; height:62px; background:#fff; border:4px solid #111; border-radius:8px; box-shadow:0 4px 0 #111; display:flex; align-items:center; justify-content:center;
    font-size:2rem; color:#111; animation:bf-up .4s cubic-bezier(.2,1.6,.4,1) both; }
  .bf-judge.low { color:#e8173c; }
  .bf-word { position:absolute; transform:translate(-50%, -50%) rotate(-8deg); font-size:2.2rem; color:#ffd400; -webkit-text-stroke:2px #111; paint-order:stroke fill;
    text-shadow:0 4px 0 #111; white-space:nowrap; animation:bf-word 1.2s ease-out forwards; }
  .bf-word.bad { color:#ff5a6e; }
  @keyframes bf-flex { from { transform:rotate(0); } to { transform:rotate(5deg); } }
  @keyframes bf-bounce { from { translate:0 0; } to { translate:0 calc(var(--bmz) * -.18); } }
  @keyframes bf-float { from { translate:0 -3px; } to { translate:0 3px; } }
  @keyframes bf-up { from { transform:translateY(80px); opacity:0; } }
  @keyframes bf-word { from { opacity:1; scale:.5; } 20% { scale:1.15; } 80% { opacity:1; } to { opacity:0; translate:0 -40px; } }
  @media (prefers-reduced-motion: reduce) { .bf-ring, .bf-me.bounce, .bf-board.flex, .bf-word, .bf-judge { animation:none !important; } }
  `;
  function injectCss() { if (document.getElementById("bf-css")) return; const s = document.createElement("style"); s.id = "bf-css"; s.textContent = CSS; document.head.appendChild(s); }

  registerMicrogame({
    id: "belly-flop",
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
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const { tone, sweep, noise } = ctx.sfx;
      const NZ = window.PowerBar.zoneCount(ctx.speed), COLS = window.PowerBar.colors(NZ);
      const C = ctx.choiceRows(1, NZ, { lowercase: true });
      const row = ctx.shuffle(C.rows[0].slice());

      const wrap = document.createElement("div");
      wrap.className = "bf";
      const card = document.createElement("button");
      card.className = "bf-card";
      card.setAttribute("aria-label", TEXT.cardLabel);
      card.innerHTML = '<span class="ct"></span>';
      card.firstChild.textContent = C.cardText;
      if (ctx.canSpeak && !C.listen) card.insertAdjacentHTML("beforeend", '<span class="spk">🔊</span>');
      card.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });
      const pool = document.createElement("div");
      pool.className = "bf-pool";
      pool.innerHTML = '<div class="bf-edge"></div><div class="bf-ladder"></div><div class="bf-tower"></div><div class="bf-board"></div>';
      const me = document.createElement("div");
      me.className = "bf-me";
      me.appendChild(window.Mascot ? window.Mascot.el("var(--bmz)") : document.createElement("div"));
      const fig = me.firstChild;
      const fx = document.createElement("div");
      fx.className = "bf-fx";
      pool.append(me, fx);
      wrap.append(card, pool);
      ctx.root.appendChild(wrap);
      const board = pool.querySelector(".bf-board");

      const rings = row.map((opt, i) => {
        const el = document.createElement("div");
        el.className = "bf-ring";
        el.style.setProperty("--fc", COLS[i]);
        el.style.animationDelay = `${-i * 0.4}s`;
        el.innerHTML = '<span class="bf-lbl"></span>';
        el.firstChild.textContent = opt.text;
        pool.insertBefore(el, me);
        return { el, i, opt, x: 0, y: 0, s: 0 };
      });

      let W = 0, H = 0, mz = 80, wy = 0, tx = 0, by = 0, jumped = false;
      function layout() {
        W = pool.clientWidth; H = pool.clientHeight;
        mz = Math.max(56, Math.min(H * 0.24, W * 0.16, 110));
        wy = H * 0.66; tx = 64; by = H * 0.34;
        pool.style.setProperty("--bmz", `${mz}px`); pool.style.setProperty("--wy", `${wy}px`);
        pool.style.setProperty("--tx", `${tx}px`); pool.style.setProperty("--by", `${by}px`);
        const x0 = tx + mz * 1.6;
        rings.forEach((r, i) => {
          const k = NZ > 1 ? i / (NZ - 1) : 0;
          r.s = Math.max(60, Math.min((W - x0) / NZ * 0.85, 120)) * (1 - 0.12 * k);
          r.x = x0 + (W - x0 - r.s * 0.95) * k + r.s * 0.1; r.y = wy + (H - wy) * (0.35 + 0.25 * (i % 2));
          r.el.style.setProperty("--rs", `${r.s}px`);
          r.el.style.left = `${r.x}px`; r.el.style.top = `${r.y}px`;
          const lbl = r.el.firstChild;
          lbl.style.fontSize = r.opt.kind === "word" ? `${Math.min(r.s * 0.28, (r.s * 1.1) / ([...r.opt.text].length * 0.62))}px` : "";
        });
        if (!jumped) placeMe(tx + mz * 0.75, by - mz, 0);
      }
      const startAt = () => ({ x: tx + mz * 0.75, y: by - mz });
      function placeMe(x, y, rot) { me.style.transform = `translate(${(x - mz / 2).toFixed(1)}px, ${y.toFixed(1)}px) rotate(${rot.toFixed(1)}deg)`; }

      let done = false;
      const bar = ctx.powerBar({
        parent: pool, press: pool, icon: "🏊", zones: NZ,
        onStart: () => { me.classList.add("bounce"); board.classList.add("flex"); tone(330, 0.06, "triangle", 0.06); },
        onRelease: (zone) => jump(rings[zone]),
      });
      bar.el.style.left = "8px"; bar.el.style.top = "10px"; bar.el.style.bottom = "10px";

      // Boing off the board in an arc to the ring: the right one is a dive (head first), the wrong one a flop.
      function jump(r) {
        if (done || ctx.ended) return;
        done = true; jumped = true;
        bar.lock();
        me.classList.remove("bounce"); board.classList.remove("flex");
        ctx.freezeTimer();
        sweep(300, 900, 0.3, "triangle", 0.1);   // boing
        const right = r.opt.right, a = startAt(), b = { x: r.x, y: r.y - mz * 0.55 }, t0 = performance.now(), ms = reduceMotion ? 1 : 900;
        const lift = H * 0.28;
        (function fly(now) {
          const k = Math.min(1, (now - t0) / ms);
          const x = a.x + (b.x - a.x) * k, y = a.y + (b.y - a.y) * k - Math.sin(k * Math.PI) * lift;
          // A dive tucks and turns head first; a flop tips over flat on its tummy.
          const rot = right ? k * 180 : Math.min(1, k * 1.4) * -90;
          placeMe(x, y, rot);
          if (k < 1) { ctx.raf(fly); return; }
          if (right) dive(r); else flop(r);
        })(t0);
      }
      function dive(r) {
        ctx.win();
        me.animate([{ opacity: 1 }, { opacity: 0, translate: `0 ${mz * 0.6}px` }], { duration: 300, fill: "forwards" });
        noise(0.15, "highpass", 2500, 3000, 0.25);   // a neat little plip
        splash(r.x, r.y, 8, 0.6);
        word(TEXT.perfect, false, W / 2, Math.min(H - 30, r.y + r.s * 0.45));
        judges(["10", "10", "10"], false);
        [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.14, "triangle", 0.11, 0.2 + i * 0.08));
        ctx.confetti(fx, W / 2, H * 0.3, { count: 90 });
        ctx.later(() => { // you pop back up, cheering, in the ring
          if (window.Mascot) window.Mascot.mood(fig, "cheer");
          placeMe(r.x, r.y - mz * 0.7, 0);
          me.animate([{ opacity: 0, translate: `0 ${mz * 0.4}px` }, { opacity: 1, translate: "0 0" }], { duration: 400, fill: "forwards" });
        }, 650);
        ctx.say(C.answer);
      }
      function flop(r) {
        ctx.lose();
        noise(0.12, "lowpass", 900, 200, 0.6); tone(90, 0.2, "square", 0.15);   // SMACK
        splash(r.x, r.y, 26, 1.4);
        // A big red tummy (a blotch, so it shows on any colour of character).
        const belly = document.createElement("div");
        belly.className = "bf-belly";
        me.appendChild(belly);
        if (window.Mascot) window.Mascot.mood(fig, "sad");
        pool.animate([{ translate: "0 0" }, { translate: "-8px 4px" }, { translate: "8px -4px" }, { translate: "0 0" }], { duration: 300 });
        word(TEXT.smack, true, Math.min(r.x, W - 110), Math.min(H - 30, r.y + r.s * 0.45));
        judges(["0", "1", "0"], true);
        ctx.later(() => { rings.forEach((x) => x.el.classList.add(x.opt.right ? "right" : "dim")); ctx.say(C.answer); }, 700);
      }
      function splash(x, y, n, big) {
        if (reduceMotion) return;
        for (let k = 0; k < n; k++) {
          const d = document.createElement("div");
          d.className = "bf-drop";
          d.style.left = `${x}px`; d.style.top = `${y}px`;
          fx.appendChild(d);
          const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4, v = (60 + Math.random() * 90) * big;
          const dx = Math.cos(a) * v, dy = Math.sin(a) * v;
          d.animate([{ transform: "translate(-50%, -50%) scale(.6)" }, { transform: `translate(calc(-50% + ${dx * 0.7}px), calc(-50% + ${dy}px)) scale(1)`, offset: 0.5 },
            { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy * 0.2 + 40}px)) scale(.7)`, opacity: 0 }], { duration: 800, easing: "ease-out", fill: "forwards" });
          ctx.later(() => d.remove(), 820);
        }
      }
      function judges(scores, low) {
        const j = document.createElement("div");
        j.className = "bf-judges";
        scores.forEach((s, k) => {
          const c = document.createElement("div");
          c.className = "bf-judge" + (low ? " low" : "");
          c.style.animationDelay = `${0.4 + k * 0.15}s`;
          c.textContent = s;
          j.appendChild(c);
        });
        fx.appendChild(j);
      }
      function word(text, bad, x, y) {
        const w = document.createElement("div");
        w.className = "bf-word" + (bad ? " bad" : "");
        w.textContent = text;
        w.style.left = `${Math.max(100, Math.min(W - 100, x))}px`; w.style.top = `${Math.max(30, y)}px`;
        fx.appendChild(w);
      }
      function replay() { if (!done) ctx.say(C.prompt); }

      ctx.onTimeout(() => { done = true; bar.lock(); me.classList.remove("bounce"); board.classList.remove("flex"); rings.forEach((x) => x.el.classList.add(x.opt.right ? "right" : "dim")); ctx.say(C.answer); });
      function onKey(e) { if (e.key === " ") { e.preventDefault(); replay(); } }
      document.addEventListener("keydown", onKey);

      layout();
      const ro = new ResizeObserver(layout);
      ro.observe(pool);
      ctx.say(C.prompt);
      ctx.reveal(card);
      ctx.later(() => ctx.hint(bar.el.querySelector(".pwb-btn"), null, { scale: 0.7 }), 80);

      // Tutorial: point at the card, then the right ring, then charge to its colour and let go.
      ctx.tutorial(C.target, async (f) => {
        const btn = bar.el.querySelector(".pwb-btn"), r = rings.find((x) => x.opt.right);
        await f.point(card, 900);
        await f.point(r.el, 700);
        await f.move(btn, 400);
        await f.tapNow(btn);
        await f.until(() => bar.charging && Math.abs(bar.level - bar.zoneCenter(r.i)) < 0.06, 6000);
        await f.tapNow(btn);
        await f.until(() => ctx.ended, 2500);
      });
      return () => { done = true; ro.disconnect(); document.removeEventListener("keydown", onKey); };
    },
  });
})();
