// ALIEN TWINS — a flip-cards memory game (Claude's idea; the shared engine is js/flip.js). A row of UFO pods with
// blinking lights, their glass domes frosted over. Tap a pod: the dome clears and a little alien inside holds up half
// of a pair (every alien a different colour, so they don't give the pairs away). Tap another: a pair, and the twins
// high-five and a tractor beam lifts them up (BEAM ME UP!); not a pair, and they zap each other (ZAP!) and end up
// with frizzy hair. Find every pair to win.
(function () {
  const TEXT = {
    name: { en: "Alien Twins" },
    icon: "👽",
    howTo: { en: {
      steps: [
        ["🛸", "Tap a pod. An alien inside holds up a card!"],
        ["👽", "Tap another pod. Find the alien twin with the matching card!"],
        ["✨", "Find every pair and they all beam up!"],
      ],
      tips: ["Not a pair? ZAP! The pods close again. Remember where things were!", "The aliens are all different colours: look at the cards.", "When the game speeds up, there are 8 pods."],
    } },
    instruction: { en: "FIND THE\nTWINS!" },
    found: ["BEAM ME UP!", "TWINS!", "HIGH FIVE!", "ZOOP!"],
    nope: "ZAP!",
    win: "TAKE OFF!",
  };
  const SKINS = ["#7dff6a", "#6ad7ff", "#ff8af0", "#ffd84d", "#b28aff", "#ff9a5c", "#6affc8", "#ff6a8a"];

  const CSS = `
  .alt-stage { background:radial-gradient(circle, #fff 0 1px, transparent 2px) 0 0 / 46px 40px, radial-gradient(circle at 80% 20%, #ffb3f0 0 6%, transparent 7%), linear-gradient(180deg, #140a3a, #3a1f7a); }
  .alt-cell { overflow:visible; }
  /* The pod: a metal base with blinking lights and a glass dome (frosted while closed) */
  .alt-base { position:absolute; left:4%; right:4%; bottom:4%; height:28%; background:linear-gradient(#c4ccd6, #8a96a6); border:4px solid #111; border-radius:50%; z-index:4; }
  .alt-base::after { content:""; position:absolute; left:14%; right:14%; top:40%; height:22%; background:radial-gradient(circle, #ffd400 0 40%, transparent 44%) 0 0 / 25% 100%; animation:alt-blink .6s steps(2) infinite; }
  .alt-dome { position:absolute; left:14%; right:14%; bottom:22%; height:66%; border:4px solid #111; border-bottom:0; border-radius:50% 50% 10% 10% / 70% 70% 10% 10%; z-index:5;
    background:rgba(200,230,255,.95); transition:background .3s; overflow:hidden; }
  .alt-dome::after { content:""; position:absolute; left:16%; top:12%; width:16%; height:30%; border-radius:50%; background:rgba(255,255,255,.8); }
  .alt-cell.open .alt-dome, .alt-cell.matched .alt-dome, .alt-cell.hint .alt-dome { background:rgba(200,230,255,.18); }
  /* The alien (--ac): a round green-ish blob with an antenna and three googly eyes */
  .alt-ali { position:absolute; left:30%; right:30%; bottom:24%; height:52%; z-index:3; }
  .alt-ali > * { position:absolute; box-sizing:border-box; }
  .alt-head { inset:12% 0 0 0; background:var(--ac); border:3px solid #111; border-radius:50% 50% 40% 40%; }
  .alt-ant { left:46%; top:-10%; width:8%; height:26%; background:#111; }
  .alt-ant::after { content:""; position:absolute; left:-90%; top:-40%; width:280%; aspect-ratio:1; border-radius:50%; background:var(--ac); border:2px solid #111; }
  .alt-eye { top:30%; width:26%; aspect-ratio:1; background:#fff; border:2px solid #111; border-radius:50%; } .alt-eye.a { left:8%; } .alt-eye.b { left:37%; top:24%; } .alt-eye.c { right:8%; }
  .alt-eye::after { content:""; position:absolute; left:30%; top:30%; width:44%; aspect-ratio:1; border-radius:50%; background:#111; }
  .alt-frizz { left:-10%; right:-10%; top:-18%; height:30%; opacity:0; background:#111; clip-path:polygon(0 100%, 8% 0, 16% 100%, 24% 0, 32% 100%, 40% 0, 48% 100%, 56% 0, 64% 100%, 72% 0, 80% 100%, 88% 0, 100% 100%); }
  .alt-cell.zapped .alt-frizz { opacity:1; }
  .alt-cell.matched .alt-ali { animation:alt-beam 1s ease-in forwards; }
  .alt-beam { position:absolute; left:20%; right:20%; bottom:30%; height:400%; z-index:2; opacity:0; background:linear-gradient(0deg, rgba(255,240,120,.7), rgba(255,240,120,0)); clip-path:polygon(30% 100%, 70% 100%, 100% 0, 0 0); }
  .alt-cell.matched .alt-beam { animation:alt-glow 1s ease-out forwards; }
  .alt-cell .fc-face { top:46%; }
  @keyframes alt-blink { 50% { filter:hue-rotate(120deg); } }
  @keyframes alt-beam { 0% { transform:none; } 40% { transform:translateY(-10%) rotate(-8deg); } 100% { transform:translateY(-140%); opacity:0; } }
  @keyframes alt-glow { 0% { opacity:0; } 30% { opacity:1; } 100% { opacity:0; } }
  @media (prefers-reduced-motion: reduce) { .alt-base::after, .alt-cell.matched .alt-ali, .alt-cell.matched .alt-beam { animation:none !important; } }
  `;
  function injectCss() { if (document.getElementById("alt-css")) return; const s = document.createElement("style"); s.id = "alt-css"; s.textContent = CSS; document.head.appendChild(s); }

  registerMicrogame({
    id: "alien-twins",
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
      const cols = ctx.shuffle(SKINS.slice());
      const api = window.FlipCards.start(ctx, {
        cls: "alt",
        text: TEXT,
        cell: (i) => `<div class="alt-beam"></div><div class="alt-ali" style="--ac:${cols[i % cols.length]}"><div class="alt-ant"></div><div class="alt-head"></div>` +
          '<div class="alt-eye a"></div><div class="alt-eye b"></div><div class="alt-eye c"></div><div class="alt-frizz"></div></div><div class="alt-dome"></div><div class="alt-base"></div>',
        onOpen: () => sweep(800, 1400, 0.15, "sine", 0.05),   // bweee
        onMatch: (a, b, api) => {
          sweep(300, 1600, 0.9, "sine", 0.07);   // the beam
          [a, b].forEach((c) => { const m = api.centre(c); api.pop("✨", m.x, m.y - 40, 26, 0, -100); });
        },
        onMiss: (a, b, api) => {
          [a, b].forEach((c) => { c.el.classList.add("zapped"); const m = api.centre(c); api.pop("⚡", m.x, m.y - 20, 30, 0, -50, 600); });
          noise(0.25, "highpass", 2000, 5000, 0.35);
          ctx.later(() => [a, b].forEach((c) => c.el.classList.remove("zapped")), 1200);
        },
        onWin: (api) => { tone(196, 0.5, "sawtooth", 0.06); sweep(200, 1200, 1.2, "sine", 0.07, 0.2); for (let k = 0; k < 4; k++) ctx.later(() => api.pop("🛸", api.W * (0.15 + k * 0.22), api.H * 0.7, 40, 30, -api.H * 0.7, 1300), k * 150); },
      });
      return () => api.cleanup();
    },
  });
})();
