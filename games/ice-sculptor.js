// ICE SCULPTOR — a carve-it-out game (the teacher's idea: "more uses of tracing"; the shared engine is js/carve.js).
// Reworked at the teacher's request (the frozen animals were small and didn't react, and it didn't make sense):
// a BIG block of ice stands at the top, empty. Below are chunks of ice, each with an answer. Saw round the chunk
// that matches the card: it flies up to the block and the block is carved a bit more. Three right answers turn
// the block into a cute ice cat (block → rough cat → smooth cat → face, whiskers and sparkles). A wrong
// chunk just cracks apart, the block shakes and the carving doesn't move on.
(function () {
  const TEXT = {
    name: { en: "Ice Sculptor" },
    icon: "🧊",
    howTo: { en: {
      steps: [
        ["👀", "Look at the card."],
        ["🪚", "Saw all the way round the ice chunk with the same thing."],
        ["🐱", "It flies up and carves the big ice block. Do it 3 times to finish the ice cat!"],
      ],
      tips: ["Saw round the dotted circle: the dashes light up as you cut.", "A wrong chunk cracks and the carving doesn't move on. Two of those and it's over.", "Tap the card to hear it again."],
    } },
    instruction: { en: "SCULPT\nTHE CAT!" },
    cut: ["CHIP!", "CARVED!", "NICE!"],
    nope: "CRACK!",
    win: "PURR-FECT!",
  };

  // The sculpture: an SVG (200 × 200), four stages. 0: a big block. 1: a rough, angular cat. 2: a smooth cat.
  // 3: the finished cat with a face, whiskers, a bow and sparkles. The base stays under it the whole time.
  const ICE = "url(#ics-g)", LINE = "#2a6a9a";
  const SCULPTURE = `
  <svg viewBox="0 0 200 200" class="ics-svg" aria-hidden="true">
    <defs>
      <linearGradient id="ics-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4fcff"/><stop offset=".45" stop-color="#bfe8ff"/><stop offset="1" stop-color="#7cc4ee"/></linearGradient>
    </defs>
    <g stroke="${LINE}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round">
      <rect class="base" x="28" y="152" width="144" height="40" rx="9" fill="${ICE}"/>
      <g class="blk">
        <rect x="28" y="14" width="144" height="140" rx="10" fill="${ICE}"/>
        <path d="M44 34 L74 34 M44 34 L44 64" stroke="#fff" stroke-width="6" fill="none" opacity=".9"/>
        <path d="M118 120 L150 88 M128 134 L158 104" stroke="#fff" stroke-width="3" fill="none" opacity=".7"/>
      </g>
      <polygon class="rough" fill="${ICE}" points="62,24 92,46 108,46 138,24 142,64 140,98 144,130 170,108 176,130 152,154 48,154 58,128 60,98 58,64"/>
      <g class="smooth">
        <path d="M138 138 C176 138 186 98 168 84" fill="none" stroke="${LINE}" stroke-width="22"/>
        <path d="M138 138 C176 138 186 98 168 84" fill="none" stroke="#bfe8ff" stroke-width="15"/>
        <ellipse cx="100" cy="124" rx="42" ry="32" fill="${ICE}"/>
        <ellipse cx="80" cy="152" rx="14" ry="9" fill="${ICE}"/><ellipse cx="120" cy="152" rx="14" ry="9" fill="${ICE}"/>
        <polygon points="62,62 60,22 94,46" fill="${ICE}"/><polygon points="138,62 140,22 106,46" fill="${ICE}"/>
        <polygon points="68,54 67,34 83,47" fill="#ffc2dc" stroke="none"/><polygon points="132,54 133,34 117,47" fill="#ffc2dc" stroke="none"/>
        <ellipse cx="100" cy="76" rx="42" ry="36" fill="${ICE}"/>
        <path d="M70 66 Q80 52 98 50" stroke="#fff" stroke-width="5" fill="none" opacity=".9"/>
      </g>
      <g class="face">
        <ellipse cx="83" cy="75" rx="7" ry="10" fill="#17406a" stroke="none"/><ellipse cx="117" cy="75" rx="7" ry="10" fill="#17406a" stroke="none"/>
        <circle cx="85" cy="71" r="3" fill="#fff" stroke="none"/><circle cx="119" cy="71" r="3" fill="#fff" stroke="none"/>
        <circle cx="70" cy="90" r="7" fill="#ff9ec4" stroke="none" opacity=".8"/><circle cx="130" cy="90" r="7" fill="#ff9ec4" stroke="none" opacity=".8"/>
        <polygon points="94,86 106,86 100,93" fill="#ff7aa8" stroke-width="2"/>
        <path d="M100 93 Q95 102 88 97 M100 93 Q105 102 112 97" fill="none" stroke-width="3"/>
        <path d="M60 80 L38 74 M60 88 L36 90 M140 80 L162 74 M140 88 L164 90" fill="none" stroke-width="2.5"/>
        <path d="M84 108 L116 108 L100 120 Z" fill="#ff5a6e" stroke-width="3"/>
        <circle cx="100" cy="109" r="5" fill="#ff5a6e" stroke-width="3"/>
      </g>
    </g>
    <g class="spark" font-size="22"><text x="22" y="40">✨</text><text x="160" y="30">✨</text><text x="166" y="140">✨</text><text x="14" y="130">✨</text></g>
  </svg>`;

  const CSS = `
  .ics-stage { background:linear-gradient(180deg, #e3f7ff 0 44%, #7a5a3c 44% 46%, #b88a5a 46%); }
  .ics-stage::before { content:""; position:absolute; left:0; right:0; top:0; height:44%; background:radial-gradient(circle at 50% 45%, rgba(255,255,255,.95) 0 25%, rgba(255,255,255,0) 70%); }
  .ics-sc { position:absolute; left:50%; top:2%; height:41%; aspect-ratio:1; transform:translateX(-50%); z-index:1; pointer-events:none; }
  .ics-svg { width:100%; height:100%; overflow:visible; filter:drop-shadow(0 6px 0 rgba(30,70,110,.25)); }
  .ics-sc.bump .ics-svg { animation:ics-bump .6s cubic-bezier(.2,1.6,.4,1); }
  .ics-sc.shake .ics-svg { animation:ics-shake .4s linear; }
  .ics-svg .blk, .ics-svg .rough, .ics-svg .smooth, .ics-svg .face, .ics-svg .spark { transition:opacity .5s ease; }
  .ics-svg .rough, .ics-svg .smooth, .ics-svg .face, .ics-svg .spark { opacity:0; }
  .ics-sc[data-s="1"] .blk, .ics-sc[data-s="2"] .blk, .ics-sc[data-s="3"] .blk { opacity:0; }
  .ics-sc[data-s="1"] .rough { opacity:1; }
  .ics-sc[data-s="2"] .smooth, .ics-sc[data-s="3"] .smooth { opacity:1; }
  .ics-sc[data-s="3"] .face, .ics-sc[data-s="3"] .spark { opacity:1; }
  .ics-sc[data-s="3"] .spark text { animation:ics-twinkle .5s ease-in-out infinite alternate; transform-box:fill-box; transform-origin:center; }
  .ics-ice { position:absolute; inset:0; border-radius:42% 58% 50% 50% / 54% 46% 54% 46%; border:4px solid #2a6a9a;
    background:linear-gradient(135deg, rgba(255,255,255,.95) 0 14%, transparent 14% 24%, rgba(255,255,255,.5) 24% 28%, transparent 28%), radial-gradient(circle at 40% 35%, #e6f8ff, #a6dcf7 60%, #6fb8e6); }
  .ics-crack { position:absolute; inset:6%; opacity:0; background:linear-gradient(60deg, transparent 47%, #1d4a72 48% 52%, transparent 53%), linear-gradient(-30deg, transparent 47%, #1d4a72 48% 52%, transparent 53%); }
  .ics-piece.dud .ics-crack { opacity:1; }
  @keyframes ics-bump { 0% { scale:.9; } 50% { scale:1.1; } }
  @keyframes ics-shake { 25% { translate:-5% 0; } 75% { translate:5% 0; } }
  @keyframes ics-twinkle { from { scale:.6; opacity:.5; } to { scale:1.2; opacity:1; } }
  @media (prefers-reduced-motion: reduce) { .ics-sc .ics-svg, .ics-sc[data-s="3"] .spark text { animation:none !important; } }
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
      const N = (ctx.speed || 1) >= 1.75 ? 4 : 3;
      let sc = null, stage = 0;
      const retrigger = (cls) => { sc.classList.remove(cls); void sc.offsetWidth; sc.classList.add(cls); };
      const api = window.CarveOut.start(ctx, {
        cls: "ics", tool: "🪚", sound: "saw", text: TEXT,
        cols: N, rW: 0.44, rH: 0.27,
        scene: (st) => { st.insertAdjacentHTML("beforeend", `<div class="ics-sc" data-s="0">${SCULPTURE}</div>`); sc = st.querySelector(".ics-sc"); },
        spots: (n, W, H) => [...Array(n)].map((_, i) => ({ x: W * (i + 0.5) / n, y: H * 0.74 })),
        piece: () => `<div class="ics-ice"></div><div class="ics-crack"></div>`,
        onRight: (p, api) => {
          const last = stage === 2;
          // The chunk flies up into the block and shrinks away; then the block is carved a stage further.
          const dx = api.W / 2 - p.x, dy = api.H * 0.22 - p.y;
          if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches)
            p.el.animate([{ transform: "none", opacity: 1 }, { transform: `translate(${dx}px, ${dy}px) scale(.2)`, opacity: 0.2 }], { duration: 550, easing: "cubic-bezier(.5,0,.8,.6)", fill: "forwards" });
          ctx.later(() => {
            stage++;
            sc.dataset.s = String(stage);
            retrigger("bump");
            noise(0.25, "highpass", 1800, 3000, 0.3);   // chisel crunch
            [1319, 1568, 1976].forEach((f, k) => tone(f, 0.08, "sine", 0.07, k * 0.06));   // tinkle of ice
            for (let k = 0; k < 10; k++) api.pop("❄️", api.W / 2, api.H * 0.2, 24, Math.cos(k * 0.63) * 110, Math.sin(k * 0.63) * 80, 800);
            api.pop(["🔨", "🪚", "✨"][stage - 1], api.W / 2 + api.H * 0.12, api.H * 0.12, 40, 0, -30, 700);
          }, 520);
          return last ? 700 : 0;
        },
        onWrong: (p, api) => {
          noise(0.18, "highpass", 1500, 2500, 0.3);   // crack
          retrigger("shake");
          for (let k = 0; k < 6; k++) api.pop("🧊", p.x, p.y, 22, (k - 2.5) * 34, 60 + (k % 2) * 30, 800);
        },
        onWin: (api) => {
          tone(784, 0.12, "triangle", 0.1); tone(988, 0.12, "triangle", 0.1, 0.12); tone(1319, 0.3, "triangle", 0.1, 0.24);   // meow-ish chirp
          for (let k = 0; k < 8; k++) ctx.later(() => api.pop("❄️", api.W * Math.random(), -10, 26, 0, api.H, 1600), k * 100);
        },
      });
      return () => api.cleanup();
    },
  });
})();
