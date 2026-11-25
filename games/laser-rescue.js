// LASER RESCUE — a carve-it-out game (the teacher's idea: "more uses of tracing"; the shared engine is js/carve.js).
// Little robot friends are trapped inside a spaceship, behind round bolted hatches, each with a sign. Laser-cut round
// the hatch that matches the card: it pops off with a CLANG and the robot zooms out (FREEDOM!). A wrong hatch has a
// space slug behind it that oozes out (SPLORCH!).
(function () {
  const TEXT = {
    name: { en: "Laser Rescue" },
    icon: "🤖",
    howTo: { en: {
      steps: [
        ["👀", "Look at the card."],
        ["🔦", "Drag the laser all the way round the hatch with the same thing."],
        ["🤖", "It pops open and a robot zooms out! Rescue 3 to win."],
      ],
      tips: ["Cut round the dotted circle: the dashes glow as you go.", "A wrong hatch has a slimy space slug behind it! Two of those and it's over.", "Tap the card to hear it again."],
    } },
    instruction: { en: "RESCUE\nTHEM!" },
    cut: ["FREEDOM!", "BEEP BOOP!", "ZOOM!"],
    nope: "SPLORCH!",
    win: "ALL ABOARD!",
  };

  const CSS = `
  .lzr-stage { background:repeating-linear-gradient(90deg, transparent 0 78px, rgba(0,0,0,.25) 78px 81px), repeating-linear-gradient(0deg, transparent 0 78px, rgba(0,0,0,.25) 78px 81px),
    radial-gradient(circle, #8a96a6 0 3px, transparent 4px) 6px 6px / 81px 81px, linear-gradient(180deg, #b8c4d0, #9aa8b6); --cut:#ff3d6d; }
  .lzr-hatch { position:absolute; inset:0; border-radius:50%; background:radial-gradient(circle at 35% 30%, #e3e9f0 0 20%, #aab6c4 70%); border:5px solid #111;
    box-shadow:inset 0 0 0 8px #8a96a6; }
  .lzr-hatch::after { content:""; position:absolute; inset:8%; border-radius:50%; background:radial-gradient(circle, #555 0 4%, transparent 5%) 50% 2% / 12% 12% no-repeat,
    radial-gradient(circle, #555 0 4%, transparent 5%) 50% 98% / 12% 12% no-repeat, radial-gradient(circle, #555 0 4%, transparent 5%) 2% 50% / 12% 12% no-repeat, radial-gradient(circle, #555 0 4%, transparent 5%) 98% 50% / 12% 12% no-repeat; }
  .lzr-inside { position:absolute; inset:6%; border-radius:50%; background:#1d2a3a; opacity:0; }
  .lzr-bot { position:absolute; left:28%; right:28%; top:22%; bottom:22%; opacity:0; z-index:2; }
  .lzr-bot > * { position:absolute; box-sizing:border-box; }
  .lzr-bhead { inset:10% 0 0 0; background:#ffd400; border:3px solid #111; border-radius:10px; }
  .lzr-beye { top:32%; width:24%; aspect-ratio:1; background:#7cf0ff; border:2px solid #111; border-radius:50%; } .lzr-beye.l { left:16%; } .lzr-beye.r { right:16%; }
  .lzr-bant { left:46%; top:-10%; width:8%; height:22%; background:#111; }
  .lzr-piece.free .lzr-hatch { animation:lzr-off .7s ease-in forwards; }
  .lzr-piece.free .lzr-inside, .lzr-piece.dud .lzr-inside { opacity:1; }
  .lzr-piece.free .lzr-bot { opacity:1; animation:lzr-zoom 1s ease-in .3s forwards; }
  .lzr-piece.dud .lzr-hatch { animation:lzr-off .7s ease-in forwards; }
  .lzr-piece.free .co-lbl, .lzr-piece.dud .co-lbl { animation:lzr-off .7s ease-in forwards; }
  .lzr-slug { position:absolute; left:20%; right:20%; top:30%; bottom:14%; opacity:0; z-index:2; background:#7dff6a; border:3px solid #111; border-radius:50% 50% 40% 40%; }
  .lzr-slug::before, .lzr-slug::after { content:""; position:absolute; top:-30%; width:10%; height:40%; background:#7dff6a; border:3px solid #111; border-radius:99px; }
  .lzr-slug::before { left:30%; } .lzr-slug::after { right:30%; }
  .lzr-piece.dud .lzr-slug { opacity:1; animation:lzr-ooze .8s ease-out forwards; }
  @keyframes lzr-off { to { transform:translate(40%, 120%) rotate(200deg); opacity:0; } }
  @keyframes lzr-zoom { 0% { transform:none; } 30% { transform:translateY(-10%) rotate(-10deg) scale(1.2); } 100% { transform:translate(120%, -260%) rotate(20deg) scale(.6); opacity:0; } }
  @keyframes lzr-ooze { from { transform:scale(.4); } to { transform:scale(1.2, .9) translateY(20%); } }
  `;
  function injectCss() { if (document.getElementById("lzr-css")) return; const s = document.createElement("style"); s.id = "lzr-css"; s.textContent = CSS; document.head.appendChild(s); }

  registerMicrogame({
    id: "laser-rescue",
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
      const api = window.CarveOut.start(ctx, {
        cls: "lzr", tool: "🔦", sound: "laser", text: TEXT,
        piece: () => '<div class="lzr-inside"></div><div class="lzr-bot"><div class="lzr-bant"></div><div class="lzr-bhead"></div><div class="lzr-beye l"></div><div class="lzr-beye r"></div></div>' +
          '<div class="lzr-slug"></div><div class="lzr-hatch"></div>',
        onRight: (p, api) => {
          tone(330, 0.15, "square", 0.08); noise(0.1, "highpass", 3000, 2000, 0.2);   // CLANG
          ctx.later(() => { sweep(300, 1400, 0.6, "square", 0.06); api.pop("💨", p.x, p.y, 30, -40, 30, 700); }, 300);   // zoom
        },
        onWrong: (p) => { sweep(300, 120, 0.6, "sawtooth", 0.08); noise(0.4, "lowpass", 400, 200, 0.3, 0.1); void p; },   // splorch
        onWin: (api) => { for (let k = 0; k < 4; k++) ctx.later(() => api.pop("🤖", api.W * (0.2 + k * 0.2), api.H * 0.8, 34, 30, -api.H * 0.7, 1300), k * 150); },
      });
      return () => api.cleanup();
    },
  });
})();
