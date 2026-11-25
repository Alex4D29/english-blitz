// MAGIC HATS — a flip-cards memory game (Claude's idea; the shared engine is js/flip.js). A magician's table with a
// row of top hats. Tap a hat: it lifts, and a bunny pops up holding half of a pair. Tap another: a pair, and TA-DA!
// (sparkles, doves); not a pair, and a custard pie flies across the table (SPLAT!) and the hats drop back down.
// Find every pair to win.
(function () {
  const TEXT = {
    name: { en: "Magic Hats" },
    icon: "🎩",
    howTo: { en: {
      steps: [
        ["🎩", "Tap a hat to lift it. A bunny pops up with a card!"],
        ["🐰", "Tap another hat. Find the bunny with the card that matches!"],
        ["✨", "Find every pair: TA-DA!"],
      ],
      tips: ["Not a pair? SPLAT! The hats go back down. Remember where things were!", "Capitals go with small letters, letters with pictures, words with pictures (sight words: the same word).", "When the game speeds up, there are 8 hats."],
    } },
    instruction: { en: "FIND THE\nPAIRS!" },
    found: ["TA-DA!", "MAGIC!", "ABRACADABRA!", "WOW!"],
    nope: "SPLAT!",
    win: "THE END!",
  };

  const CSS = `
  .mh-stage { background:linear-gradient(180deg, #7a1530 0 16%, transparent 16%), repeating-linear-gradient(90deg, #b3203f 0 30px, #8f1832 30px 60px); }
  .mh-stage::before { content:""; position:absolute; left:0; right:0; top:16%; height:8px; background:#ffd400; border-top:3px solid #111; border-bottom:3px solid #111; }
  .mh-cell { overflow:visible; }
  .mh-table { position:absolute; left:4%; right:4%; bottom:0; height:16%; background:#3d2a6e; border:4px solid #111; border-radius:50%; }
  /* The hat: a black top hat with a red band; it lifts and tips when open */
  .mh-hat { position:absolute; left:16%; right:16%; bottom:8%; height:70%; z-index:6; transform-origin:30% 100%; transition:transform .35s cubic-bezier(.2,1.6,.4,1); }
  .mh-crown { position:absolute; left:12%; right:12%; top:0; bottom:14%; background:#222; border:4px solid #111; border-radius:8px 8px 2px 2px; box-shadow:inset 6px 0 0 #3a3a3a; }
  .mh-band { position:absolute; left:12%; right:12%; bottom:20%; height:16%; background:#e8173c; border:3px solid #111; }
  .mh-brim { position:absolute; left:0; right:0; bottom:0; height:18%; background:#222; border:4px solid #111; border-radius:50%; }
  .mh-cell.open .mh-hat, .mh-cell.matched .mh-hat, .mh-cell.hint .mh-hat { transform:translate(-30%, -78%) rotate(-28deg); }
  /* The bunny's ears, behind the card */
  .mh-ears { position:absolute; left:50%; top:4%; width:40%; height:40%; transform:translateX(-50%) scaleY(0); transform-origin:50% 100%; transition:transform .3s .1s; z-index:4; }
  .mh-ears::before, .mh-ears::after { content:""; position:absolute; bottom:0; width:34%; height:100%; background:#fff; border:3px solid #111; border-radius:50%; box-shadow:inset 0 0 0 5px #ff9cc0; }
  .mh-ears::before { left:6%; transform:rotate(-12deg); } .mh-ears::after { right:6%; transform:rotate(12deg); }
  .mh-cell.open .mh-ears, .mh-cell.matched .mh-ears, .mh-cell.hint .mh-ears { transform:translateX(-50%) scaleY(1); }
  .mh-cell.matched .mh-ears { animation:mh-wiggle .3s ease-in-out 4 alternate; }
  .mh-splat { position:absolute; z-index:8; background:#fff8e0; border:3px solid #111; border-radius:46% 54% 40% 60% / 50% 40% 60% 50%; pointer-events:none; }
  @keyframes mh-wiggle { from { rotate:-8deg; } to { rotate:8deg; } }
  `;
  function injectCss() { if (document.getElementById("mh-css")) return; const s = document.createElement("style"); s.id = "mh-css"; s.textContent = CSS; document.head.appendChild(s); }

  registerMicrogame({
    id: "magic-hats",
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
      const api = window.FlipCards.start(ctx, {
        cls: "mh",
        text: TEXT,
        topPad: (H) => H * 0.18,
        cell: () => '<div class="mh-table"></div><div class="mh-ears"></div><div class="mh-hat"><div class="mh-crown"></div><div class="mh-band"></div><div class="mh-brim"></div></div>',
        onOpen: () => sweep(500, 900, 0.12, "sine", 0.05),   // whoop!
        onMatch: (a, b, api) => {
          [a, b].forEach((c) => { const m = api.centre(c); ["✨", "🕊️", "✨"].forEach((e, k) => api.pop(e, m.x, m.y - 20, 28, (k - 1) * 40, -90)); });
          [1047, 1319, 1568].forEach((f, k) => tone(f, 0.1, "sine", 0.07, k * 0.08));   // ting ting ting
        },
        onMiss: (a, b, api) => {
          // A custard pie flies in from the side and splats on the table.
          const m = api.centre(b), pie = document.createElement("div");
          pie.className = "fc-pop"; pie.textContent = "🥧"; pie.style.fontSize = "40px";
          pie.style.left = `${-40}px`; pie.style.top = `${m.y}px`;
          api.fx.appendChild(pie);
          pie.animate([{ transform: "translate(-50%, -50%) rotate(0)" }, { transform: `translate(calc(-50% + ${m.x + 40}px), -50%) rotate(540deg)` }], { duration: 400, easing: "ease-in", fill: "forwards" });
          ctx.later(() => {
            pie.remove();
            noise(0.15, "lowpass", 800, 300, 0.4);
            const s = document.createElement("div");
            s.className = "mh-splat";
            s.style.width = "90px"; s.style.height = "60px"; s.style.left = `${m.x - 45}px`; s.style.top = `${m.y - 30}px`;
            api.fx.appendChild(s);
            s.animate([{ transform: "scale(0)" }, { transform: "scale(1.2)", offset: 0.3 }, { transform: "scale(1)", opacity: 1, offset: 0.7 }, { opacity: 0 }], { duration: 900, fill: "forwards" });
            ctx.later(() => s.remove(), 920);
          }, 400);
        },
        onWin: (api) => { for (let k = 0; k < 8; k++) ctx.later(() => api.pop("🕊️", api.W * (0.1 + Math.random() * 0.8), api.H * 0.7, 34, 0, -api.H * 0.6, 1400), k * 120); },
      });
      return () => api.cleanup();
    },
  });
})();
