// PEEKABOO PARK — a flip-cards memory game (Claude's idea; the shared engine is js/flip.js). Round bushes in a park,
// with silly animals hiding behind them (a different animal behind each bush: they don't give the pairs away).
// Tap a bush: it rustles down and the animal pops up holding half of a pair. Tap another: a pair, and both animals
// dance; not a pair, and they blow raspberries at each other (PFFT!) and duck back down. Find every pair to win.
(function () {
  const TEXT = {
    name: { en: "Peekaboo Park" },
    icon: "🌳",
    howTo: { en: {
      steps: [
        ["🌳", "Tap a bush. An animal pops up with a card!"],
        ["🐻", "Tap another bush. Find the card that matches!"],
        ["🎉", "Find every pair and they all dance!"],
      ],
      tips: ["Not a pair? PFFT! They hide again. Remember where things were!", "The animals are all different: look at the cards.", "When the game speeds up, there are 8 bushes."],
    } },
    instruction: { en: "PEEKABOO!" },
    found: ["PEEKABOO!", "PAIR!", "YAY!", "HOORAY!"],
    nope: "PFFT!",
    win: "PARK PARTY!",
  };
  const ANIMALS = ["🐻", "🐼", "🦊", "🐸", "🐷", "🐵", "🐨", "🐯", "🐰", "🦁"];

  const CSS = `
  .pbp-stage { background:linear-gradient(180deg, #9fe0ff 0 30%, #7fd36b 30%); }
  .pbp-stage::before { content:"☀️"; position:absolute; right:6%; top:4%; font-size:2.4rem; }
  .pbp-cell { overflow:visible; }
  /* The animal (an emoji, as a prop) peeking up from behind; the card sits on its tummy */
  .pbp-ani { position:absolute; left:50%; bottom:22%; transform:translate(-50%, 40%) scale(.6); font-size:calc(var(--cz) * .56); line-height:1; z-index:2; transition:transform .3s cubic-bezier(.2,1.6,.4,1); }
  .pbp-cell.open .pbp-ani, .pbp-cell.matched .pbp-ani, .pbp-cell.hint .pbp-ani { transform:translate(-50%, -34%) scale(1); }
  .pbp-cell.matched .pbp-ani { animation:pbp-dance .3s ease-in-out infinite alternate; }
  .pbp-cell .fc-face { top:66%; }
  /* The bush: round leafy bumps */
  .pbp-bush { position:absolute; left:0; right:0; bottom:0; height:62%; z-index:6; transition:transform .3s; transform-origin:50% 100%;
    background:radial-gradient(circle at 25% 45%, #3fa13a 0 26%, transparent 27%), radial-gradient(circle at 50% 30%, #4cbf45 0 30%, transparent 31%), radial-gradient(circle at 75% 45%, #3fa13a 0 26%, transparent 27%),
      radial-gradient(ellipse 50% 40% at 50% 80%, #2f8a2a 0 98%, transparent 100%); filter:drop-shadow(0 0 0 #111) drop-shadow(3px 3px 0 rgba(0,0,0,.25)); }
  .pbp-bush::after { content:""; position:absolute; left:30%; top:38%; width:8%; aspect-ratio:1; border-radius:50%; background:#ff4f6d; box-shadow:calc(var(--cz) * .22) calc(var(--cz) * .06) 0 #ffd400, calc(var(--cz) * .1) calc(var(--cz) * .16) 0 #ff4f6d; }   /* berries */
  .pbp-cell.open .pbp-bush, .pbp-cell.matched .pbp-bush, .pbp-cell.hint .pbp-bush { transform:scaleY(.55); }
  .pbp-cell.rustle .pbp-bush { animation:pbp-rustle .1s ease-in-out 4 alternate; }
  @keyframes pbp-dance { from { rotate:-12deg; translate:0 0; } to { rotate:12deg; translate:0 -10%; } }
  @keyframes pbp-rustle { from { rotate:-4deg; } to { rotate:4deg; } }
  `;
  function injectCss() { if (document.getElementById("pbp-css")) return; const s = document.createElement("style"); s.id = "pbp-css"; s.textContent = CSS; document.head.appendChild(s); }

  registerMicrogame({
    id: "peekaboo-park",
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
      const { noise, sweep, tone } = ctx.sfx;
      const who = ctx.shuffle(ANIMALS.slice());
      const api = window.FlipCards.start(ctx, {
        cls: "pbp",
        text: TEXT,
        cell: (i) => `<div class="pbp-ani">${who[i % who.length]}</div><div class="pbp-bush"></div>`,
        onOpen: (c) => { c.el.classList.remove("rustle"); void c.el.offsetWidth; c.el.classList.add("rustle"); noise(0.15, "bandpass", 2500, 1200, 0.15); },   // rustle rustle
        onMatch: (a, b, api) => {
          [a, b].forEach((c) => { const m = api.centre(c); ["🎵", "🎶"].forEach((e, k) => api.pop(e, m.x, m.y - 30, 26, (k - 0.5) * 50, -70)); });
          [392, 523, 659, 784].forEach((f, k) => tone(f, 0.08, "square", 0.06, k * 0.07));
        },
        onMiss: (a, b, api) => {
          [a, b].forEach((c, k) => { const m = api.centre(c); api.pop("😛", m.x + (k ? -20 : 20), m.y - 30, 30, (k ? -1 : 1) * 30, -40, 700); });
          sweep(180, 120, 0.4, "sawtooth", 0.1); noise(0.35, "bandpass", 300, 200, 0.25);   // pffffft
        },
        onWin: (api) => { for (let k = 0; k < 6; k++) ctx.later(() => api.pop(["🎈", "🎉", "🎶"][k % 3], api.W * (0.1 + Math.random() * 0.8), api.H * 0.8, 34, 0, -api.H * 0.6, 1400), k * 120); },
      });
      return () => api.cleanup();
    },
  });
})();
