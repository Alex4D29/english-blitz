// GEM MINER — a carve-it-out game (the teacher's idea: "more uses of tracing"; the shared engine is js/carve.js). A
// rocky cave wall with gems stuck in it, each with a letter, picture or word. Drill round the gem that matches the
// card: it pops out, sparkles and drops into the minecart (SHINY!). A wrong one is just a rock: it crumbles into a
// cloud of dust (COUGH COUGH!).
(function () {
  const TEXT = {
    name: { en: "Gem Miner" },
    icon: "💎",
    howTo: { en: {
      steps: [
        ["👀", "Look at the card."],
        ["⛏️", "Drag the drill all the way round the gem with the same thing."],
        ["💎", "It pops out into your minecart! Dig out 3 gems to win."],
      ],
      tips: ["Drill round the dotted circle: the dashes light up as you go.", "A wrong one is just an old rock. COUGH COUGH! Two of those and it's over.", "Tap the card to hear it again."],
    } },
    instruction: { en: "DIG IT\nOUT!" },
    cut: ["SHINY!", "BLING!", "TREASURE!"],
    nope: "COUGH COUGH!",
    win: "RICH!",
  };
  const GEMS = ["#ff4f6d", "#4dd3ff", "#4dd36b", "#c38bff", "#ffd400", "#ff8a1f"];

  const CSS = `
  .gem-stage { background:radial-gradient(circle at 20% 30%, #8a7766 0 8%, transparent 9%), radial-gradient(circle at 70% 60%, #7a6858 0 10%, transparent 11%),
    radial-gradient(circle at 45% 85%, #8a7766 0 7%, transparent 8%), linear-gradient(180deg, #5a4a3e, #6e5c4e); }
  .gem-stage::before { content:"🔦"; position:absolute; left:4%; top:4%; font-size:1.6rem; }
  .gem-rock { position:absolute; inset:0; border-radius:46% 54% 50% 50%; background:#7a6858; border:4px solid #3e3128; box-shadow:inset -8px -8px 0 rgba(0,0,0,.2); }
  .gem-gem { position:absolute; left:18%; right:18%; top:14%; bottom:14%; background:linear-gradient(135deg, rgba(255,255,255,.7) 0 18%, transparent 18%), var(--g);
    border:4px solid #111; clip-path:polygon(50% 0, 100% 35%, 80% 100%, 20% 100%, 0 35%); }
  .gem-piece.free { animation:gem-fly .9s cubic-bezier(.4,-.4,.6,1) forwards; }
  .gem-piece.free .gem-rock { opacity:0; transition:opacity .2s; }
  .gem-piece.dud .gem-gem { background:#7a6858; }
  .gem-cart { position:absolute; left:50%; bottom:2%; width:110px; height:52px; margin-left:-55px; z-index:1; background:#555; border:4px solid #111; border-radius:6px 6px 14px 14px;
    clip-path:polygon(0 0, 100% 0, 88% 100%, 12% 100%); }
  .gem-cart.got { animation:gem-bump .3s ease-in-out 2 alternate; }
  @keyframes gem-fly { 40% { translate:0 -30%; scale:1.1; } 100% { translate:var(--tx) var(--ty); scale:.2; opacity:0; } }
  @keyframes gem-bump { to { translate:0 -10%; } }
  `;
  function injectCss() { if (document.getElementById("gem-css")) return; const s = document.createElement("style"); s.id = "gem-css"; s.textContent = CSS; document.head.appendChild(s); }

  registerMicrogame({
    id: "gem-miner",
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
      const { tone, noise } = ctx.sfx;
      let cart = null;
      const api = window.CarveOut.start(ctx, {
        cls: "gem", tool: "⛏️", sound: "drill", text: TEXT,
        scene: (stage) => { cart = document.createElement("div"); cart.className = "gem-cart"; stage.appendChild(cart); },
        spots: (n, W, H) => (n <= 3 ? [...Array(n)].map((_, i) => ({ x: W * (i + 0.5) / n, y: H * (i % 2 ? 0.52 : 0.4) }))
          : [...Array(n)].map((_, i) => ({ x: W * (0.27 + 0.46 * (i % 2)), y: H * (0.24 + 0.36 * Math.floor(i / 2)) }))),
        piece: (i) => `<div class="gem-rock"></div><div class="gem-gem" style="--g:${GEMS[i % GEMS.length]}"></div>`,
        onRight: (p, api) => {
          p.el.style.setProperty("--tx", `${api.W / 2 - p.x}px`); p.el.style.setProperty("--ty", `${api.H - 30 - p.y}px`);
          [1568, 2093].forEach((f, k) => tone(f, 0.1, "sine", 0.07, k * 0.08));   // bling
          api.pop("✨", p.x, p.y, 30, 0, -60);
          ctx.later(() => { cart.classList.remove("got"); void cart.offsetWidth; cart.classList.add("got"); noise(0.08, "lowpass", 600, 300, 0.3); }, 850);
        },
        onWrong: (p, api) => {
          noise(0.5, "lowpass", 400, 200, 0.4);   // crumble
          for (let k = 0; k < 5; k++) api.pop("💨", p.x + (k - 2) * 16, p.y, 30, (k - 2) * 20, -40, 900);
        },
        onWin: (api) => { for (let k = 0; k < 6; k++) ctx.later(() => api.pop("💎", api.W / 2 + (Math.random() - 0.5) * 80, api.H - 40, 26, 0, -80, 800), k * 120); },
      });
      return () => api.cleanup();
    },
  });
})();
