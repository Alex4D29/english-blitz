// CARTOON SAW — a carve-it-out game (the teacher's idea: "more uses of tracing"; the shared engine is js/carve.js). A
// sneaky burglar monster tiptoes back and forth right across the tops of round trapdoor spots in a wooden floor
// (the teacher: it wasn't clear we had to catch him while he walked along the wall), each spot with a sign, taunting
// you (CAN'T CATCH ME!). Saw round the spot that matches the card: the burglar steps onto it and drops through the hole with a long
// falling whistle, then climbs back out, grumpy (the last time, he's gone for good: BYE BYE!). Saw the wrong spot
// and it crashes down into the basement on its own (CRASH!) and the burglar laughs.
(function () {
  const TEXT = {
    name: { en: "Cartoon Saw" },
    icon: "🪚",
    howTo: { en: {
      steps: [
        ["🦹", "A sneaky burglar is tiptoeing over the trapdoors. Catch him!"],
        ["🪚", "Saw a circle round the trapdoor with the same thing as the card."],
        ["🕳️", "He falls through! Catch him 3 times to win."],
      ],
      tips: ["Saw round the dotted circle: the dashes light up as you cut.", "The wrong spot crashes down and he laughs. Two of those and it's over.", "Tap the card to hear it again."],
    } },
    instruction: { en: "CATCH THE\nBURGLAR!" },
    cut: ["GOTCHA!", "WHOOPS-A-DAISY!", "BYE BYE!"],
    nope: "CRASH!",
    ooh: "OOH! MONEY!",
    win: "CAUGHT HIM!",
  };

  const CSS = `
  .saw-stage { background:linear-gradient(180deg, #f6e2b8 0 24%, #c98a4b 24%); }
  .saw-stage::before { content:""; position:absolute; left:0; right:0; top:24%; bottom:0; background:repeating-linear-gradient(90deg, transparent 0 58px, rgba(0,0,0,.25) 58px 61px),
    repeating-linear-gradient(0deg, transparent 0 34px, rgba(0,0,0,.12) 34px 36px); border-top:5px solid #111; }
  .saw-door { position:absolute; inset:0; border-radius:50%; background:repeating-linear-gradient(90deg, #d9a066 0 20%, #c08850 20% 22%); border:4px dashed rgba(0,0,0,.35); }
  .saw-hole { position:absolute; inset:0; border-radius:50%; background:radial-gradient(circle, #000 0 55%, #2a1a10 70%); border:4px solid #111; opacity:0; }
  /* The right one, once cut, stays in place (cut all round, wobbling, a coin on it) until he steps on it: then it springs */
  .saw-piece.sprung .saw-hole, .saw-piece.dud .saw-hole { opacity:1; }
  .saw-piece.sprung .saw-door, .saw-piece.dud .saw-door { animation:saw-drop .5s ease-in forwards; }
  .saw-piece.sprung .co-lbl, .saw-piece.dud .co-lbl { animation:saw-drop .5s ease-in forwards; }
  .saw-piece.free:not(.sprung) .saw-door { border:4px solid #111; box-shadow:0 0 0 3px #ffd400; animation:saw-wobble .18s ease-in-out infinite alternate; }
  .saw-coin { position:absolute; left:50%; top:4%; transform:translate(-50%, -50%); font-size:calc(var(--pr) * .5); line-height:1; z-index:6; animation:saw-glint .5s ease-in-out infinite alternate; }
  .saw-piece.sprung .saw-coin { display:none; }
  .saw-bad.rush .saw-feet::before, .saw-bad.rush .saw-feet::after { animation-duration:.1s; }
  @keyframes saw-wobble { from { rotate:-2deg; } to { rotate:2deg; } }
  @keyframes saw-glint { from { scale:1; filter:brightness(1); } to { scale:1.2; filter:brightness(1.4); } }
  /* The burglar (--bz): grey, a black mask, a striped top, a swag bag, tiptoeing */
  .saw-bad { position:absolute; left:0; top:0; width:var(--bz); height:var(--bz); z-index:7; pointer-events:none; }
  .saw-bad > * { position:absolute; box-sizing:border-box; }
  .saw-bbody { left:14%; right:14%; top:14%; bottom:8%; border:4px solid #111; border-radius:46% 46% 30% 30%;
    background:linear-gradient(180deg, #9aa3b5 0 46%, #fff 46% 54%, #111 54% 62%, #fff 62% 70%, #111 70% 78%, #fff 78% 86%, #111 86%); }
  .saw-mask { left:18%; right:18%; top:26%; height:15%; background:#111; border-radius:40%; z-index:2; }
  .saw-eye { top:28%; width:16%; aspect-ratio:1; background:#fff; border-radius:50%; z-index:3; } .saw-eye.l { left:30%; } .saw-eye.r { right:30%; }
  .saw-eye::after { content:""; position:absolute; left:30%; top:30%; width:45%; aspect-ratio:1; border-radius:50%; background:#111; }
  .saw-mouth { left:40%; right:40%; top:47%; height:6%; background:#111; border-radius:99px; z-index:3; }
  .saw-bad.laugh .saw-mouth { height:12%; border-radius:0 0 99px 99px; background:#5a0f1e; border:2px solid #111; }
  .saw-bag { right:-26%; top:30%; font-size:calc(var(--bz) * .4); line-height:1; }
  .saw-feet { left:24%; right:24%; bottom:0; height:12%; }
  .saw-feet::before, .saw-feet::after { content:""; position:absolute; bottom:0; width:40%; height:100%; background:#333; border:3px solid #111; border-radius:50% 50% 20% 20%; animation:saw-tip .3s ease-in-out infinite alternate; }
  .saw-feet::before { left:0; } .saw-feet::after { right:0; animation-delay:-.15s; }
  .saw-say { position:absolute; left:50%; bottom:100%; transform:translateX(-30%); padding:1px 8px; background:#fff; border:3px solid #111; border-radius:10px; font-weight:900; font-size:calc(var(--bz) * .2);
    color:#111; white-space:nowrap; opacity:0; transition:opacity .2s; }
  .saw-say.on { opacity:1; }
  @keyframes saw-drop { to { transform:translateY(60%) scale(.5); opacity:0; } }
  @keyframes saw-tip { to { translate:0 -40%; } }
  @media (prefers-reduced-motion: reduce) { .saw-feet::before, .saw-feet::after { animation:none !important; } }
  `;
  function injectCss() { if (document.getElementById("saw-css")) return; const s = document.createElement("style"); s.id = "saw-css"; s.textContent = CSS; document.head.appendChild(s); }

  registerMicrogame({
    id: "cartoon-saw",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 26000,
    input: "drag",
    tutorial: true,

    start(ctx) {
      injectCss();
      const { tone, sweep, noise } = ctx.sfx;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let bad = null, bx = 0, dir = 1, caught = 0, mode = "walk", target = null, laughing = false;   // mode: walk | rush (to the coin) | drop | gone
      const WALK = 0.12, RUSH = 0.55, DROP_MS = 900;   // (walking speeds: × the floor width per second)
      const bz = () => Math.max(60, Math.min(api.H * 0.28, api.R * 1.7, 130));
      // His path runs across the tops of the trapdoors (feet on the door, clear of its label), weaving between them.
      function yAt(x) {
        const pts = api.pieces.map((p) => ({ x: p.x, y: p.y - api.R * 0.45 })).sort((a, b) => a.x - b.x);
        if (!pts.length) return api.H * 0.5;
        if (x <= pts[0].x) return pts[0].y;
        for (let i = 1; i < pts.length; i++) if (x <= pts[i].x) { const a = pts[i - 1], b = pts[i]; return a.y + (b.y - a.y) * (x - a.x) / (b.x - a.x); }
        return pts[pts.length - 1].y;
      }
      const TAUNTS = ["CAN'T CATCH ME!", "HEE HEE!", "NYAH NYAH!"];
      let tauntAt = 0, tauntI = 0;
      const api = window.CarveOut.start(ctx, {
        cls: "saw", tool: "🪚", sound: "saw", text: TEXT,
        scene: (stage) => {
          bad = document.createElement("div");
          bad.className = "saw-bad";
          bad.innerHTML = '<div class="saw-feet"></div><div class="saw-bbody"></div><div class="saw-mask"></div><div class="saw-eye l"></div><div class="saw-eye r"></div><div class="saw-mouth"></div><div class="saw-bag">💰</div><div class="saw-say"></div>';
          stage.appendChild(bad);
        },
        spots: (n, W, H) => [...Array(n)].map((_, i) => ({ x: W * (i + 0.5) / n, y: H * (n <= 3 ? 0.66 : (i % 2 ? 0.78 : 0.56)) })),
        piece: () => '<div class="saw-hole"></div><div class="saw-door"></div>',
        onRight: (p) => {
          // The cut trapdoor stays put with a coin on it. He spots the coin (OOH! MONEY!), scurries over along his
          // path (hopping any open holes), steps on it, and only then does it drop: a long falling whistle. (The teacher
          // saw him slide into a hole far away from him; now he really walks there. The engine waits: the return value.)
          caught++;
          mode = "rush"; target = p;
          const coin = document.createElement("div");
          coin.className = "saw-coin"; coin.textContent = "🪙";
          p.el.appendChild(coin);
          tone(1319, 0.06, "triangle", 0.07); tone(1760, 0.1, "triangle", 0.07, 0.07);   // ting!
          const say = bad.querySelector(".saw-say");
          say.textContent = TEXT.ooh; say.classList.add("on");
          tauntAt = performance.now() + 99999;
          const walkMs = reduceMotion ? 0 : (Math.abs(p.x - bx) / (api.W * RUSH)) * 1000;
          return walkMs + DROP_MS;
        },
        onWrong: (p) => {
          noise(0.4, "lowpass", 900, 200, 0.5); ctx.later(() => noise(0.2, "lowpass", 500, 200, 0.4), 300);   // CRASH… crash
          laughing = true;
          ctx.later(() => [0, 0.15, 0.3].forEach((t) => tone(300, 0.1, "square", 0.07, t)), 300);   // ha ha ha
          ctx.later(() => { laughing = false; }, 1200);
        },
      });
      // He steps on the cut trapdoor: it springs and he drops through. Then (unless that was the third time) he climbs
      // back out after the next pieces are dealt.
      function spring() {
        const p = target, z = bz();
        mode = "drop";
        p.el.classList.add("sprung");
        bad.classList.remove("rush", "hop");
        bad.querySelector(".saw-say").classList.remove("on");
        bad.animate([{ transform: `translate(${p.x - z / 2}px, ${yAt(p.x) - z}px)` }, { transform: `translate(${p.x - z / 2}px, ${yAt(p.x) - z * 1.15}px)`, offset: 0.15 },
          { transform: `translate(${p.x - z / 2}px, ${p.y - z * 0.2}px) scale(.3)`, opacity: 0 }], { duration: reduceMotion ? 1 : DROP_MS - 100, easing: "ease-in", fill: "forwards" });
        sweep(1800, 300, 0.8, "sine", 0.07);
        ctx.later(() => noise(0.15, "lowpass", 400, 200, 0.4), DROP_MS + 300);   // thud, far below
        if (caught >= 3) { mode = "gone"; return; }
        ctx.later(() => { bad.getAnimations().forEach((a) => a.cancel()); bx = p.x; mode = "walk"; tauntAt = performance.now() + 1500; tone(220, 0.1, "square", 0.08); }, DROP_MS + 1500);
      }
      // Open holes (a wrong one that crashed in): he hops right over them, laughing. Lift in px at x.
      function holeLift(x, z) {
        let lift = 0;
        for (const p of api.pieces) {
          if (p.state !== "dud" && !p.el.classList.contains("sprung")) continue;
          const d = Math.abs(x - p.x) / (api.R * 1.3);
          if (d < 1) lift = Math.max(lift, Math.cos((d * Math.PI) / 2) * z * 0.8);
        }
        return lift;
      }
      // He tiptoes back and forth along the top of the floor.
      let last = null;
      function walk(ts) {
        const dt = last == null ? 0 : Math.min(50, ts - last) / 1000;
        last = ts;
        if ((mode === "walk" || mode === "rush") && bad) {
          const z = bz();
          if (mode === "rush") {   // scurrying over to the coin
            const dx = target.x - bx, step = api.W * RUSH * dt;
            if (dx) dir = Math.sign(dx);
            bad.classList.add("rush");
            if (reduceMotion || Math.abs(dx) <= step) bx = target.x; else bx += dir * step;
          } else {
            bx += dir * api.W * WALK * dt;
            if (bx > api.W - z) { bx = api.W - z; dir = -1; } else if (bx < z) { bx = z; dir = 1; }
          }
          const lift = holeLift(bx, z);
          bad.classList.toggle("hop", lift > 2);
          bad.classList.toggle("laugh", lift > 2 || laughing);
          bad.style.setProperty("--bz", `${z}px`);
          bad.style.transform = `translate(${bx - z / 2}px, ${yAt(bx) - z - lift}px)`;
          bad.querySelector(".saw-feet").style.scale = `${dir} 1`;
          if (mode === "rush" && bx === target.x) spring();
          // a taunt now and then
          const now = performance.now(), say = bad.querySelector(".saw-say");
          if (mode === "walk" && now > tauntAt) { tauntAt = now + 3200; say.textContent = TAUNTS[tauntI++ % TAUNTS.length]; say.classList.add("on"); ctx.later(() => say.classList.remove("on"), 1400); }
        }
        if (!ctx.ended) ctx.raf(walk);
      }
      bx = api.W * 0.2;
      ctx.raf(walk);
      return () => api.cleanup();
    },
  });
})();
