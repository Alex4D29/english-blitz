// ICE SCULPTOR — a carve-it-out game (the teacher's idea: "more uses of tracing"; the shared engine is js/carve.js).
// Silly animals are frozen in a big block of ice, each holding a sign (a different animal in each piece, so only the
// sign tells you). Saw round the one that matches the card: it pops out, the frost shatters off and it does a happy
// dance (FREE!). A wrong one cracks, and a grumpy walrus pops out and sprays you with water (SPLOOSH!).
(function () {
  const TEXT = {
    name: { en: "Ice Sculptor" },
    icon: "🧊",
    howTo: { en: {
      steps: [
        ["👀", "Look at the card."],
        ["🪚", "Drag the saw all the way round the frozen animal with the same thing."],
        ["🧊", "It pops out of the ice! Free 3 animals to win."],
      ],
      tips: ["Saw round the dotted circle: the dashes light up as you cut.", "A wrong one has a grumpy walrus inside! Two of those and it's over.", "Tap the card to hear it again."],
    } },
    instruction: { en: "CUT IT\nOUT!" },
    cut: ["FREE!", "THAWED!", "CHILLY!"],
    nope: "SPLOOSH!",
    win: "ICE PARTY!",
  };
  const ANIMALS = ["🐧", "🐻‍❄️", "🦊", "🐰", "🐱", "🐶", "🦉", "🐨"];

  const CSS = `
  .ics-stage { background:linear-gradient(180deg, #d9f4ff 0 22%, #a8e0ff 22%); }
  .ics-stage::before { content:""; position:absolute; left:4%; right:4%; top:14%; bottom:6%; border:5px solid #111; border-radius:18px;
    background:linear-gradient(135deg, rgba(255,255,255,.7) 0 20%, transparent 20% 40%, rgba(255,255,255,.35) 40% 46%, transparent 46%), #bfeaff; box-shadow:inset 0 0 30px rgba(255,255,255,.9); }
  .ics-ice { position:absolute; inset:0; border-radius:50%; background:radial-gradient(circle at 35% 30%, rgba(255,255,255,.85) 0 12%, rgba(200,236,255,.7) 40%, rgba(150,210,245,.85));
    border:3px solid rgba(80,140,190,.8); }
  .ics-ani { position:absolute; left:50%; top:4%; transform:translateX(-50%); font-size:calc(var(--pr) * .7); line-height:1; opacity:.7; filter:saturate(.4); }
  .ics-piece .co-lbl { top:66%; }
  .ics-piece.free { animation:ics-pop .6s cubic-bezier(.2,1.6,.4,1) forwards; }
  .ics-piece.free .ics-ice { animation:ics-melt .5s ease-out forwards; }
  .ics-piece.free .ics-ani { opacity:1; filter:none; animation:ics-dance .3s ease-in-out .4s infinite alternate; }
  .ics-crack { position:absolute; inset:10%; opacity:0; background:linear-gradient(60deg, transparent 47%, #2a5a80 48% 52%, transparent 53%), linear-gradient(-30deg, transparent 47%, #2a5a80 48% 52%, transparent 53%); }
  .ics-piece.dud .ics-crack { opacity:1; }
  @keyframes ics-pop { to { translate:0 -14%; scale:1.08; } }
  @keyframes ics-melt { to { opacity:0; scale:1.3; } }
  @keyframes ics-dance { from { rotate:-12deg; } to { rotate:12deg; } }
  `;
  function injectCss() { if (document.getElementById("ics-css")) return; const s = document.createElement("style"); s.id = "ics-css"; s.textContent = CSS; document.head.appendChild(s); }

  registerMicrogame({
    id: "ice-sculptor",
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
      let who = ctx.shuffle(ANIMALS.slice());
      const api = window.CarveOut.start(ctx, {
        cls: "ics", tool: "🪚", sound: "saw", text: TEXT,
        piece: (i) => `<div class="ics-ice"></div><div class="ics-ani">${who[i % who.length]}</div><div class="ics-crack"></div>`,
        onStep: () => { who = ctx.shuffle(ANIMALS.slice()); },
        onRight: (p, api) => {
          [1319, 1568, 1976].forEach((f, k) => tone(f, 0.08, "sine", 0.07, k * 0.06));   // tinkle of ice
          for (let k = 0; k < 6; k++) api.pop("❄️", p.x, p.y, 22, Math.cos(k) * 70, Math.sin(k) * 60 - 30, 700);
        },
        onWrong: (p, api) => {
          noise(0.15, "highpass", 1500, 2500, 0.3);   // crack
          api.pop("🦭", p.x, p.y, api.R * 0.9, 0, -api.R * 0.6, 1200);
          ctx.later(() => { noise(0.5, "bandpass", 1800, 1200, 0.25); for (let k = 0; k < 6; k++) api.pop("💦", p.x, p.y - api.R * 0.4, 24, (k - 2.5) * 30, 90, 700); }, 400);
        },
        onWin: (api) => { for (let k = 0; k < 8; k++) ctx.later(() => api.pop("❄️", api.W * Math.random(), -10, 26, 0, api.H, 1600), k * 100); },
      });
      return () => api.cleanup();
    },
  });
})();
