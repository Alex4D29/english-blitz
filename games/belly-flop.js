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
  /* The 3 judges (--jz): little silly monsters on a bench by the pool, watching; they hold up their own scores */
  .bf-bench { position:absolute; right:3%; top:calc(var(--jz) * .78);   /* (room above for the raised cards) */ display:flex; gap:calc(var(--jz) * .14); align-items:flex-end; z-index:5; pointer-events:none; }
  .bf-bench::after { content:""; position:absolute; left:-6%; right:-6%; bottom:calc(var(--jz) * .08); height:calc(var(--jz) * .14); background:#8a5a3c; border:3px solid #111; border-radius:4px; z-index:-1; }
  .bf-jdg { position:relative; width:var(--jz); height:var(--jz); animation:bf-watch 1.4s ease-in-out infinite alternate; }
  .bf-jdg > * { position:absolute; box-sizing:border-box; }
  .bf-jbody { left:10%; right:10%; top:22%; bottom:6%; background:var(--jc); border:3px solid #111; border-radius:50% 50% 40% 40%; }
  .bf-jeye { top:30%; width:28%; aspect-ratio:1; background:#fff; border:3px solid #111; border-radius:50%; overflow:hidden; z-index:2; }
  .bf-jeye.l { left:20%; } .bf-jeye.r { right:20%; width:24%; top:33%; }
  .bf-jeye i { position:absolute; left:28%; top:30%; width:46%; aspect-ratio:1; background:#111; border-radius:50%; animation:bf-look 1.6s ease-in-out infinite alternate; }
  .bf-jmouth { left:38%; right:38%; top:64%; height:8%; background:#5a0f1e; border-radius:0 0 99px 99px; z-index:2; transition:all .2s; }
  .bf-jdg.yay .bf-jmouth { left:30%; right:30%; height:16%; border:2px solid #111; }
  .bf-jdg.boo .bf-jmouth { left:40%; right:40%; height:14%; border-radius:50%; border:2px solid #111; }
  .bf-jdg.boo .bf-jeye i { width:22%; left:39%; top:39%; }
  .bf-jhat { left:24%; right:24%; top:6%; height:20%; background:#111; border-radius:6px 6px 2px 2px; z-index:3; }       /* a little top hat (the judge with --hat) */
  .bf-jhat::after { content:""; position:absolute; left:-30%; right:-30%; bottom:-10%; height:24%; background:#111; border-radius:99px; }
  .bf-jdg:not(.hat) .bf-jhat { display:none; }
  .bf-jdg.bow .bf-jbody::before { content:""; position:absolute; left:50%; top:-16%; width:44%; height:26%; transform:translateX(-50%); background:radial-gradient(circle at 50% 50%, #ff4fa0 0 18%, transparent 19%),
    conic-gradient(from 90deg, #ff4fa0 0 25%, transparent 0 50%, #ff4fa0 0 75%, transparent 0); border-radius:4px; }   /* a bow */
  .bf-jdg.specs .bf-jeye { border-width:4px; box-shadow:0 0 0 2px #333; }
  .bf-jarm { right:-8%; top:44%; width:16%; height:36%; background:var(--jc); border:3px solid #111; border-radius:99px; transform-origin:50% 10%; transform:rotate(20deg); transition:transform .25s; z-index:1; }
  .bf-jcard { left:50%; bottom:100%; transform:translate(-50%, 40%) scale(0); width:calc(var(--jz) * .7); height:calc(var(--jz) * .62); background:#fff; border:3px solid #111; border-radius:6px;
    box-shadow:0 3px 0 #111; display:flex; align-items:center; justify-content:center; font-size:calc(var(--jz) * .42); font-weight:900; color:#111; transition:transform .3s cubic-bezier(.2,1.6,.4,1); z-index:4; }
  .bf-jdg.up .bf-jcard { transform:translate(-50%, -6%) scale(1); }
  .bf-jdg.up .bf-jarm { transform:rotate(200deg); }
  .bf-jdg.up { animation:bf-hop .3s ease-in-out 3 alternate; }
  .bf-jcard.low { color:#e8173c; }
  /* The splash: a tall column of water, a ripple ring, droplets */
  .bf-col { position:absolute; bottom:0; width:var(--cw); margin-left:calc(var(--cw) / -2); height:var(--ch); transform-origin:50% 100%; z-index:6;
    background:linear-gradient(0deg, rgba(191,233,255,.95), rgba(255,255,255,.95)); border:4px solid #1e7fd6; border-bottom:0; border-radius:45% 45% 12% 12% / 30% 30% 6% 6%; }
  /* the crown of spray bursting out of the top: big droplets fanning out, and a white burst */
  .bf-col::before { content:""; position:absolute; left:-90%; right:-90%; top:-26%; height:34%;
    background:radial-gradient(circle, #fff 0 34%, #1e7fd6 36% 42%, transparent 44%) 0 60% / 16% 46% repeat-x, radial-gradient(circle, #fff 0 30%, #1e7fd6 32% 40%, transparent 42%) 8% 0 / 22% 40% repeat-x; }
  .bf-col::after { content:""; position:absolute; left:-45%; right:-45%; top:-8%; height:22%; border-radius:50% 50% 30% 30%; border:4px solid #1e7fd6; border-bottom:0;
    background:radial-gradient(ellipse at 50% 100%, #fff 0 55%, #dff4ff 70%); clip-path:polygon(0 100%, 6% 30%, 16% 70%, 26% 0, 38% 60%, 50% 10%, 62% 60%, 74% 0, 84% 70%, 94% 30%, 100% 100%); }
  .bf-ripple { position:absolute; width:20px; height:10px; margin:-5px 0 0 -10px; border:4px solid rgba(255,255,255,.9); border-radius:50%; z-index:5; }
  .bf-word { position:absolute; transform:translate(-50%, -50%) rotate(-8deg); font-size:2.2rem; color:#ffd400; -webkit-text-stroke:2px #111; paint-order:stroke fill;
    text-shadow:0 4px 0 #111; white-space:nowrap; animation:bf-word 1.2s ease-out forwards; }
  .bf-word.bad { color:#ff5a6e; }
  @keyframes bf-flex { from { transform:rotate(0); } to { transform:rotate(5deg); } }
  @keyframes bf-bounce { from { translate:0 0; } to { translate:0 calc(var(--bmz) * -.18); } }
  @keyframes bf-float { from { translate:0 -3px; } to { translate:0 3px; } }
  @keyframes bf-watch { from { transform:rotate(-4deg); } to { transform:rotate(4deg); } }
  @keyframes bf-look { from { transform:translate(-25%, -10%); } to { transform:translate(20%, 15%); } }
  @keyframes bf-hop { to { translate:0 -14%; } }
  @keyframes bf-word { from { opacity:1; scale:.5; } 20% { scale:1.15; } 80% { opacity:1; } to { opacity:0; translate:0 -40px; } }
  @media (prefers-reduced-motion: reduce) { .bf-ring, .bf-me.bounce, .bf-board.flex, .bf-word, .bf-jdg, .bf-jeye i { animation:none !important; } }
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
      // The 3 judges on their bench, watching (each a little different: a top hat, a bow, big specs).
      const bench = document.createElement("div");
      bench.className = "bf-bench";
      const judgesEls = [["#ff8fb8", "hat"], ["#8fe36b", "bow"], ["#8fd3ff", "specs"]].map(([c, look], k) => {
        const j = document.createElement("div");
        j.className = `bf-jdg ${look}`;
        j.style.setProperty("--jc", c);
        j.style.animationDelay = `${-k * 0.5}s`;
        j.innerHTML = '<div class="bf-jarm"></div><div class="bf-jbody"></div><div class="bf-jhat"></div><div class="bf-jeye l"><i></i></div><div class="bf-jeye r"><i></i></div><div class="bf-jmouth"></div><div class="bf-jcard"></div>';
        bench.appendChild(j);
        return j;
      });
      pool.append(bench, me, fx);
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
        pool.style.setProperty("--jz", `${Math.max(40, Math.min(H * 0.17, W * 0.11, 80))}px`);
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
        bigSplash(r, false);
        word(TEXT.perfect, false, W / 2, Math.min(H - 30, r.y + r.s * 0.45));
        raise(["10", "10", "10"], false);
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
        bigSplash(r, true);
        // A big red tummy (a blotch, so it shows on any colour of character).
        const belly = document.createElement("div");
        belly.className = "bf-belly";
        me.appendChild(belly);
        if (window.Mascot) window.Mascot.mood(fig, "sad");
        pool.animate([{ translate: "0 0" }, { translate: "-8px 4px" }, { translate: "8px -4px" }, { translate: "0 0" }], { duration: 300 });
        word(TEXT.smack, true, Math.min(r.x, W - 110), Math.min(H - 30, r.y + r.s * 0.45));
        raise(["0", "1", "0"], true);
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
      // A BIG splash (the teacher asked): a tall column of water shoots up and falls, a ripple spreads, droplets
      // fly everywhere. The belly flop's is even bigger.
      function bigSplash(r, flop) {
        const k = flop ? 1.5 : 1;
        if (!reduceMotion) {
          const col = document.createElement("div");
          col.className = "bf-col";
          col.style.left = `${r.x}px`; col.style.bottom = `${H - r.y}px`;
          col.style.setProperty("--cw", `${r.s * (flop ? 1.1 : 0.6)}px`);
          col.style.setProperty("--ch", `${Math.min(r.y - 10, H * 0.5 * k)}px`);
          fx.appendChild(col);
          col.animate([{ transform: "scaleY(0)" }, { transform: "scaleY(1.05)", offset: 0.35 }, { transform: "scaleY(.9)", offset: 0.6 }, { transform: "scaleY(0)", opacity: 0.4 }],
            { duration: 1100, easing: "ease-out", fill: "forwards" });
          ctx.later(() => col.remove(), 1150);
          for (let n = 0; n < 2; n++) {
            const rp = document.createElement("div");
            rp.className = "bf-ripple";
            rp.style.left = `${r.x}px`; rp.style.top = `${r.y}px`;
            fx.appendChild(rp);
            rp.animate([{ transform: "scale(1)", opacity: 1 }, { transform: `scale(${(r.s / 20) * 1.6 * k})`, opacity: 0 }], { duration: 900, delay: n * 250, fill: "both" });
            ctx.later(() => rp.remove(), 1200);
          }
        }
        splash(r.x, r.y, flop ? 40 : 26, flop ? 2 : 1.4);
        noise(flop ? 0.9 : 0.6, "lowpass", 1400, 400, flop ? 0.5 : 0.35);   // SPLOOSH
        if (flop) pool.animate([{ translate: "0 0" }, { translate: "-10px 6px" }, { translate: "10px -6px" }, { translate: "-6px 3px" }, { translate: "0 0" }], { duration: 420 });
      }
      // The judges hold up their cards one after another (happy for a dive, shocked for a flop).
      function raise(scores, low) {
        judgesEls.forEach((j, k) => ctx.later(() => {
          const c = j.querySelector(".bf-jcard");
          c.textContent = scores[k];
          c.classList.toggle("low", low);
          j.classList.add("up", low ? "boo" : "yay");
          tone(low ? 220 - k * 30 : 660 + k * 120, 0.08, "square", 0.07);
        }, 500 + k * 220));
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
