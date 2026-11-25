// CARTOON SAW — a carve-it-out game (the teacher's idea: "more uses of tracing"; the shared engine is js/carve.js). A
// sneaky burglar monster tiptoes back and forth across a wooden floor that has round trapdoor spots, each with a
// sign. Saw round the spot that matches the card: the burglar steps onto it and drops through the hole with a long
// falling whistle, then climbs back out, grumpy (the last time, he's gone for good: BYE BYE!). Saw the wrong spot
// and it crashes down into the basement on its own (CRASH!) and the burglar laughs.
(function () {
  const TEXT = {
    name: { en: "Cartoon Saw" },
    icon: "🪚",
    howTo: { en: {
      steps: [
        ["🦹", "A sneaky burglar is tiptoeing across the floor!"],
        ["🪚", "Saw a circle round the spot with the same thing as the card."],
        ["🕳️", "He falls through! Catch him 3 times to win."],
      ],
      tips: ["Saw round the dotted circle: the dashes light up as you cut.", "The wrong spot crashes down and he laughs. Two of those and it's over.", "Tap the card to hear it again."],
    } },
    instruction: { en: "SAW THE\nFLOOR!" },
    cut: ["GOTCHA!", "WHOOPS-A-DAISY!", "BYE BYE!"],
    nope: "CRASH!",
    win: "CAUGHT HIM!",
  };

  const CSS = `
  .saw-stage { background:linear-gradient(180deg, #f6e2b8 0 24%, #c98a4b 24%); }
  .saw-stage::before { content:""; position:absolute; left:0; right:0; top:24%; bottom:0; background:repeating-linear-gradient(90deg, transparent 0 58px, rgba(0,0,0,.25) 58px 61px),
    repeating-linear-gradient(0deg, transparent 0 34px, rgba(0,0,0,.12) 34px 36px); border-top:5px solid #111; }
  .saw-door { position:absolute; inset:0; border-radius:50%; background:repeating-linear-gradient(90deg, #d9a066 0 20%, #c08850 20% 22%); border:4px dashed rgba(0,0,0,.35); }
  .saw-hole { position:absolute; inset:0; border-radius:50%; background:radial-gradient(circle, #000 0 55%, #2a1a10 70%); border:4px solid #111; opacity:0; }
  .saw-piece.free .saw-hole, .saw-piece.dud .saw-hole { opacity:1; }
  .saw-piece.free .saw-door, .saw-piece.dud .saw-door { animation:saw-drop .5s ease-in forwards; }
  .saw-piece.free .co-lbl, .saw-piece.dud .co-lbl { animation:saw-drop .5s ease-in forwards; }
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
      let bad = null, bx = 0, dir = 1, falling = false, gone = false, caught = 0;
      const bz = () => Math.max(50, Math.min(api.H * 0.2, 90));
      const api = window.CarveOut.start(ctx, {
        cls: "saw", tool: "🪚", sound: "saw", text: TEXT,
        scene: (stage) => {
          bad = document.createElement("div");
          bad.className = "saw-bad";
          bad.innerHTML = '<div class="saw-feet"></div><div class="saw-bbody"></div><div class="saw-mask"></div><div class="saw-eye l"></div><div class="saw-eye r"></div><div class="saw-mouth"></div><div class="saw-bag">💰</div>';
          stage.appendChild(bad);
        },
        spots: (n, W, H) => [...Array(n)].map((_, i) => ({ x: W * (i + 0.5) / n, y: H * (n <= 3 ? 0.66 : (i % 2 ? 0.78 : 0.56)) })),
        piece: () => '<div class="saw-hole"></div><div class="saw-door"></div>',
        onRight: (p) => {
          // He tiptoes over and drops through the hole: a long falling whistle.
          falling = true;
          caught++;
          const z = bz(), from = bx;
          bad.animate([{ transform: `translate(${from - z / 2}px, ${api.H * 0.24 - z + 6}px)` }, { transform: `translate(${p.x - z / 2}px, ${p.y - z}px)`, offset: 0.4 },
            { transform: `translate(${p.x - z / 2}px, ${p.y - z * 0.2}px) scale(.3)`, opacity: 0 }], { duration: reduceMotion ? 1 : 1100, easing: "ease-in", fill: "forwards" });
          ctx.later(() => sweep(1800, 300, 0.8, "sine", 0.07), 450);
          ctx.later(() => noise(0.15, "lowpass", 400, 200, 0.4), 1300);   // thud, far below
          if (caught >= 3) { gone = true; return; }
          // …then climbs back out, grumpy, for the next round.
          ctx.later(() => { bad.getAnimations().forEach((a) => a.cancel()); bx = p.x; falling = false; tone(220, 0.1, "square", 0.08); }, 1700);
        },
        onWrong: (p) => {
          noise(0.4, "lowpass", 900, 200, 0.5); ctx.later(() => noise(0.2, "lowpass", 500, 200, 0.4), 300);   // CRASH… crash
          bad.classList.add("laugh");
          ctx.later(() => [0, 0.15, 0.3].forEach((t) => tone(300, 0.1, "square", 0.07, t)), 300);   // ha ha ha
          ctx.later(() => bad.classList.remove("laugh"), 1200);
        },
      });
      // He tiptoes back and forth along the top of the floor.
      let last = null;
      function walk(ts) {
        const dt = last == null ? 0 : Math.min(50, ts - last) / 1000;
        last = ts;
        if (!falling && !gone && bad) {
          const z = bz();
          bx += dir * api.W * 0.12 * dt;
          if (bx > api.W - z) { bx = api.W - z; dir = -1; } else if (bx < z) { bx = z; dir = 1; }
          bad.style.setProperty("--bz", `${z}px`);
          bad.style.transform = `translate(${bx - z / 2}px, ${api.H * 0.24 - z + 6}px) scaleX(${dir})`;
        }
        if (!ctx.ended) ctx.raf(walk);
      }
      bx = api.W * 0.2;
      ctx.raf(walk);
      return () => api.cleanup();
    },
  });
})();
