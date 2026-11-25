// GLOVE HUNT — a flip-cards memory game (the teacher's twist on the sock idea; the shared engine is js/flip.js). A
// giant purple monster with LOTS of bare, chilly hands (eight of them, waving) waits at the top. Below, mittens lie
// face down, all alike. Tap one and it flips over to show half of a pair; tap another: a pair, and the two mittens
// fly up onto two of the monster's hands (WARM!); not a pair, and the monster shivers (BRRR!) and they flip back.
// Find every pair to glove up the hands.
(function () {
  const TEXT = {
    name: { en: "Glove Hunt" },
    icon: "🧤",
    howTo: { en: {
      steps: [
        ["🥶", "The monster has lots of cold hands! Find gloves that match."],
        ["🧤", "Tap a glove to turn it over, then another. A matching pair goes on two hands!"],
        ["🙌", "Find every pair to warm up its hands!"],
      ],
      tips: ["Not a pair? BRRR! They turn back over. Remember where things were!", "Capitals go with small letters, letters with pictures, words with pictures (sight words: the same word).", "When the game speeds up, there are 8 gloves."],
    } },
    instruction: { en: "FIND THE\nGLOVES!" },
    found: ["WARM!", "TOASTY!", "COSY!", "AHHH!"],
    nope: "BRRR!",
    win: "ALL WARM!",
  };
  const COLS = ["#ff5a6e", "#3d8bfd", "#ffd400", "#4dd36b"];

  const CSS = `
  .glv-stage { background:linear-gradient(180deg, #dff4ff 0 var(--mh), #e8d2a8 var(--mh)); }
  /* The many-handed monster (top strip, --mh tall) */
  .glv-mon { position:absolute; left:50%; top:4px; width:calc(var(--mh) * 1.6); height:calc(var(--mh) - 8px); transform:translateX(-50%); z-index:1; }
  .glv-mon > * { position:absolute; box-sizing:border-box; }
  .glv-body { left:34%; right:34%; top:6%; bottom:0; background:#9c6bff; border:4px solid #111; border-radius:50% 50% 30% 30%; z-index:2; }
  .glv-eye { top:18%; width:16%; aspect-ratio:1; background:#fff; border:3px solid #111; border-radius:50%; z-index:3; overflow:hidden; }
  .glv-eye { width:11%; } .glv-eye.l { left:38%; } .glv-eye.r { right:38%; width:9%; top:21%; }
  .glv-eye i { position:absolute; left:28%; top:30%; width:46%; aspect-ratio:1; background:#111; border-radius:50%; animation:glv-roll 1.2s ease-in-out infinite alternate; }
  .glv-mouth { left:44%; right:44%; top:56%; height:14%; background:#5a0f1e; border:3px solid #111; border-radius:10% 10% 50% 50%; z-index:3; }
  .glv-mon.cold .glv-mouth { border-radius:4px; background:repeating-linear-gradient(90deg, #fff 0 4px, #111 4px 6px); height:9%; top:58%; }   /* chattering teeth */
  .glv-mon.cold { animation:glv-shiver .06s linear 12 alternate; }
  /* Arms with hands, fanned out each side; a hand is bare (pink) until a glove goes on */
  .glv-arm { left:50%; top:46%; width:44%; height:7%; transform-origin:0 50%; rotate:var(--a); z-index:1; }
  .glv-arm::before { content:""; position:absolute; left:0; right:20%; top:0; bottom:0; background:#9c6bff; border:3px solid #111; border-radius:99px; }
  .glv-hand { position:absolute; right:0; top:50%; width:22%; aspect-ratio:1; transform:translateY(-50%); background:#ffc9a8; border:3px solid #111; border-radius:50% 50% 45% 45%; transition:background .3s; }
  .glv-hand::after { content:""; position:absolute; left:-30%; top:10%; width:40%; height:34%; background:inherit; border:3px solid #111; border-radius:50%; }   /* thumb */
  .glv-hand.on { background:var(--gc); }
  .glv-arm { animation:glv-wave .7s ease-in-out infinite alternate; }
  /* A mitten lying face down (all alike), that flips over when open */
  .glv-cell { perspective:400px; }
  .glv-mit { position:absolute; inset:8% 14%; z-index:4; transition:transform .35s; transform-style:preserve-3d; }
  .glv-back { position:absolute; inset:0; border:4px solid #111; border-radius:40% 40% 18% 18%; backface-visibility:hidden;
    background:repeating-linear-gradient(45deg, #c38bff 0 10px, #a76ef0 10px 20px); }
  .glv-back::after { content:""; position:absolute; left:-24%; top:30%; width:34%; height:30%; background:#a76ef0; border:4px solid #111; border-radius:50%; }   /* thumb */
  .glv-cell.open .glv-mit, .glv-cell.matched .glv-mit, .glv-cell.hint .glv-mit { transform:rotateY(180deg); opacity:.25; }
  .glv-cell.matched .glv-mit { opacity:0; }
  @keyframes glv-roll { from { transform:translate(-25%, -15%); } to { transform:translate(25%, 15%); } }
  @keyframes glv-shiver { from { translate:-3px 0; } to { translate:3px 0; } }
  @keyframes glv-wave { from { rotate:calc(var(--a) - 6deg); } to { rotate:calc(var(--a) + 6deg); } }
  @media (prefers-reduced-motion: reduce) { .glv-eye i, .glv-mon.cold, .glv-arm { animation:none !important; } }
  `;
  function injectCss() { if (document.getElementById("glv-css")) return; const s = document.createElement("style"); s.id = "glv-css"; s.textContent = CSS; document.head.appendChild(s); }

  registerMicrogame({
    id: "glove-hunt",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 24000,
    input: "tap",
    tutorial: true,

    start(ctx) {
      injectCss();
      const { tone, noise } = ctx.sfx;
      let mon = null, hands = [], gloved = 0;
      // One hand per glove (6, or 8 from 1.5×), fanned out round the body.
      const NH = (ctx.speed || 1) >= 1.5 ? 8 : 6;
      const ANG = [...Array(NH)].map((_, k) => -170 + (160 * k) / (NH - 1));
      const api = window.FlipCards.start(ctx, {
        cls: "glv",
        text: TEXT,
        topPad: (H) => H * 0.32,
        scene: (stage) => {
          mon = document.createElement("div");
          mon.className = "glv-mon";
          mon.innerHTML = ANG.map((a) => `<div class="glv-arm" style="--a:${a.toFixed(0)}deg"><div class="glv-hand"></div></div>`).join("") +
            '<div class="glv-body"></div><div class="glv-eye l"><i></i></div><div class="glv-eye r"><i></i></div><div class="glv-mouth"></div>';
          stage.appendChild(mon);
          hands = [...mon.querySelectorAll(".glv-hand")];
          // (pairs fill in from the outside in: left and right hands together)
          const order = [];
          for (let k = 0; k < NH / 2; k++) order.push(k, NH - 1 - k);
          hands = order.map((k) => hands[k]);
          const size = () => stage.style.setProperty("--mh", `${Math.round(stage.clientHeight * 0.32)}px`);
          size(); new ResizeObserver(size).observe(stage);
        },
        cell: () => '<div class="glv-mit"><div class="glv-back"></div></div>',
        onOpen: () => tone(700, 0.05, "triangle", 0.05),
        onMatch: (a, b, api) => {
          // The pair flies up onto two bare hands.
          const col = COLS[(gloved / 2) % COLS.length];
          [a, b].forEach((c, k) => {
            const h = hands[gloved + k];
            if (!h) return;
            const m = api.centre(c), hr = h.getBoundingClientRect(), sr = api.stage.getBoundingClientRect();
            const g = document.createElement("div");
            g.className = "fc-pop"; g.textContent = "🧤"; g.style.fontSize = "34px"; g.style.left = `${m.x}px`; g.style.top = `${m.y}px`;
            api.fx.appendChild(g);
            g.animate([{ transform: "translate(-50%, -50%)" }, { transform: `translate(calc(-50% + ${hr.left - sr.left + hr.width / 2 - m.x}px), calc(-50% + ${hr.top - sr.top + hr.height / 2 - m.y}px)) scale(.6)` }],
              { duration: 500, easing: "ease-in", fill: "forwards" });
            ctx.later(() => { g.remove(); h.style.setProperty("--gc", col); h.classList.add("on"); }, 500);
          });
          gloved += 2;
          ctx.later(() => tone(523, 0.12, "triangle", 0.08), 500);
        },
        onMiss: () => {
          mon.classList.remove("cold"); void mon.offsetWidth; mon.classList.add("cold");
          noise(0.6, "bandpass", 3000, 2000, 0.12);   // teeth chattering
          ctx.later(() => mon.classList.remove("cold"), 800);
        },
        onWin: () => { [523, 659, 784, 1047].forEach((f, k) => tone(f, 0.12, "triangle", 0.1, 0.4 + k * 0.08)); },
      });
      return () => api.cleanup();
    },
  });
})();
