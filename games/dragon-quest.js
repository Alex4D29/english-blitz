// DRAGON QUEST — a pixel-art JRPG battle (the teacher's idea). Four letter monsters (A, B, C, D) face a silly
// purple dragon. The dragon asks (a speech bubble shows the card, the voice says it: a row from
// ctx.choiceSteps: ABC letters, phonics pictures, CVC pictures, HFW words) and the party answers from the blue
// command box at the bottom (4 options). Each RIGHT answer: the next party member attacks: A throws a FIREBALL,
// B fires an ICE BEAM (the dragon freezes), C calls LIGHTNING, D summons a GIANT SWORD that slices the dragon in
// half. Then the victory fanfare and the party celebrates. Each WRONG answer: the dragon breathes fire on
// everyone and all four health bars drop a third. Three wrong answers: the party is defeated and the dragon
// celebrates. Everything is drawn in code as pixel art (no image files): sprites are painted into tiny
// canvases and scaled up with `image-rendering: pixelated`, inside a logical stage of about 100-280 × 120 "pixels".
// Music: a hand-written battle theme with a fanfare intro (js/music.js: "dragon-quest"), a victory fanfare and a defeat sting.
(function () {
  "use strict";
  const TEXT = {
    name: { en: "Dragon Quest" },
    icon: "🐉",
    howTo: (list) => {
      const what = list.type === "phonics" ? "a picture that starts with the letter the dragon shows"
        : list.type === "letter" ? "the letter the dragon shows" : list.type === "cvc" ? "the picture of the word the dragon shows" : "the word the dragon shows";
      return { en: {
        steps: [
          ["🐉", "The dragon asks! Look at its bubble and listen."],
          ["👆", `Tap ${what} in the blue box.`],
          ["⚔️", "Right! A friend attacks: 🔥 fire, ❄️ ice, ⚡ lightning, then a giant sword!"],
        ],
        tips: [
          "Tap the dragon's bubble to hear it again.",
          "A wrong answer: the dragon breathes fire on everyone! Three wrong answers and the party is defeated.",
          "Four right answers beat the dragon!",
        ],
      } };
    },
    instruction: { en: "FIGHT THE\nDRAGON!" },
    appears: "A DRAGON APPEARS!",
    fight: "FIGHT!",
    victory: "VICTORY!",
    victoryMsg: "THE DRAGON IS BEATEN!",
    defeatMsg: "THE PARTY IS DEFEATED...",
    haha: "HA HA HA!",
    slash: "SLASH!",
    bubbleLabel: "The dragon's question. Tap to hear it again.",
    optLabel: (t) => `Choose ${t}`,
    dragonName: "DRAGON",
  };

  const K = "#111";
  const HEROES = [
    { letter: "A", color: "#e8173c", atk: "fire" },
    { letter: "B", color: "#ff8a00", atk: "ice" },
    { letter: "C", color: "#ffc233", atk: "lightning" },
    { letter: "D", color: "#3fb54a", atk: "sword" },
  ];
  const DW = 72, DH = 60; // the dragon's sprite box (logical pixels)
  const MISSES = 3;

  const CSS = `
  .dq { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:4px; padding-bottom:2px; --t:1; user-select:none; -webkit-user-select:none; }
  .dq * { box-sizing:border-box; }
  .dq-stage { position:relative; flex:1; min-height:0; width:100%; max-width:820px; overflow:hidden; border:5px solid #111; border-radius:12px; box-shadow:0 5px 0 #111; background:#1b1035; touch-action:manipulation; }
  .dq-world { position:absolute; left:0; top:0; transform-origin:0 0; }
  .dq-world canvas { image-rendering:pixelated; display:block; }
  .dq-cam, .dq-world .dq-layer { position:absolute; left:0; top:0; width:100%; height:100%; }
  .dq-world .abs { position:absolute; }
  .dq-p { position:absolute; pointer-events:none; }

  /* ----- the blue JRPG command box ----- */
  .dq-box { flex:none; position:relative; width:calc(100% - 22px); max-width:780px; margin:6px 0 10px; padding:10px; border:4px solid #fff; outline:4px solid #111; border-radius:12px;
    background:linear-gradient(180deg, #3b50e6 0, #2237c2 40%, #131f8f 100%); box-shadow:inset 0 0 0 3px #101a70, 0 6px 0 4px #111; color:#fff; font-family:"Courier New", Courier, monospace; }
  .dq-opts { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
  .dq-opt { position:relative; min-height:var(--oh, 66px); padding:0 6px 0 26px; font:inherit; font-weight:900; font-size:2.2rem; line-height:1; color:#fff; text-shadow:3px 3px 0 #000; cursor:pointer;
    background:rgba(255,255,255,.10); border:3px solid rgba(255,255,255,.6); border-radius:8px; touch-action:manipulation; display:flex; align-items:center; justify-content:center; white-space:nowrap; }
  .dq-opt::before { content:"▶"; position:absolute; left:8px; top:50%; translate:0 -50%; font-size:1.2rem; color:#ffd400; text-shadow:2px 2px 0 #000; opacity:0; }
  .dq-opt.cur::before { opacity:1; animation:dq-blink .35s steps(2) infinite; }
  .dq-opt.pic { font-size:2.5rem; }
  .dq-opt.good { background:#1fbf6a; border-color:#d6ffe6; animation:dq-good .35s ease-in-out 2; }
  .dq-opt.bad { background:#555; border-color:#999; color:#aaa; text-shadow:none; animation:dq-nope .3s linear 1; }
  .dq-opt.bad::after { content:"✕"; position:absolute; right:10px; top:6px; font-size:1.2rem; color:#ff6b6b; }
  .dq-opt.dim { opacity:.4; }
  .dq-opt.flip { animation:dq-flip .3s ease-out; }
  .dq-msg { display:none; min-height:calc(var(--oh, 66px) * 2 + 8px); align-items:center; justify-content:center; text-align:center; font-weight:900; font-size:1.7rem; line-height:1.25; text-shadow:3px 3px 0 #000; padding:4px 10px 14px; }
  .dq-msg::after { content:"▼"; position:absolute; right:16px; bottom:8px; font-size:1rem; color:#ffd400; animation:dq-blink .5s steps(2) infinite; }
  .dq-box.msg .dq-opts { display:none; } .dq-box.msg .dq-msg { display:flex; }

  /* ----- stage pieces (sizes are logical pixels, scaled by the world's transform) ----- */
  .dq-fx { position:absolute; left:0; top:0; width:100%; height:100%; pointer-events:none; z-index:30; }
  .dq-flash { position:absolute; inset:0; background:#fff; opacity:0; pointer-events:none; z-index:40; }
  .dq-dark { position:absolute; inset:0; background:#050520; opacity:0; pointer-events:none; z-index:12; transition:opacity .25s; }
  .dq-wipe { position:absolute; inset:0; display:grid; z-index:50; pointer-events:none; }
  .dq-wipe i { background:#000; animation:dq-cell calc(.45s * var(--t)) steps(3) both; }

  .dq-bub { position:absolute; z-index:20; min-width:26px; padding:2px 5px 3px; background:#fff; border:2px solid #111; border-radius:6px; color:#111; text-align:center; font-weight:900;
    font-family:"Arial Black", Arial, sans-serif; line-height:1; white-space:nowrap; cursor:pointer; box-shadow:2px 2px 0 rgba(0,0,0,.35); transform-origin:50% 100%; }
  .dq-bub::after { content:""; position:absolute; left:var(--tx, 30%); bottom:-6px; width:7px; height:6px; background:#111; clip-path:polygon(0 0, 100% 0, 0 100%); }
  .dq-bub::before { content:""; position:absolute; left:calc(var(--tx, 30%) + 1px); bottom:-3px; width:4px; height:4px; background:#fff; clip-path:polygon(0 0, 100% 0, 0 100%); z-index:1; }
  .dq-bub.pop { animation:dq-bpop calc(.35s * var(--t)) cubic-bezier(.2,1.8,.4,1) both; }
  .dq-bub.hide { visibility:hidden; }

  .dq-hpbox { position:absolute; z-index:20; padding:2px 3px 3px; background:rgba(8,12,70,.88); border:1px solid #fff; border-radius:3px; font:900 5px/1 "Courier New", monospace; color:#fff; letter-spacing:.3px; }
  .dq-hpbox b { display:block; margin-bottom:2px; font-weight:900; }
  .dq-seg { display:flex; gap:1px; }
  .dq-seg i { flex:1; height:4px; background:#2bd35f; border:1px solid #111; transition:background .3s; }
  .dq-seg i.off { background:#3a3a55; }
  .dq-seg.hurt i:not(.off) { background:#ffd400; } .dq-seg.low i:not(.off) { background:#ff4d4d; }

  /* characters */
  .dq-h { position:absolute; }
  .dq-in { position:absolute; inset:0; transform-origin:50% 100%; }
  .dq-h .dq-in { animation:dq-bob calc(.9s * var(--t)) steps(2) infinite; }
  .dq-h:nth-child(2n) .dq-in { animation-delay:-.45s; }
  .dq-arm { position:absolute; width:4px; height:9px; border:1px solid #111; border-radius:2px; transform-origin:50% 12%; transition:rotate calc(.15s * var(--t)); }
  .dq-arm.l { rotate:18deg; } .dq-arm.r { rotate:-18deg; }
  .dq-h.cast .dq-arm.l, .dq-h.cheer .dq-arm.l { rotate:165deg; } .dq-h.cast .dq-arm.r, .dq-h.cheer .dq-arm.r { rotate:-165deg; }
  .dq-h.cheer .dq-in { animation:dq-hop calc(.45s * var(--t)) ease-in-out infinite alternate; }
  .dq-h.cheer:nth-child(2n) .dq-in { animation-delay:-.2s; }
  .dq-h.sad .dq-arm.l { rotate:4deg; } .dq-h.sad .dq-arm.r { rotate:-4deg; }
  .dq-h.sad .dq-in { animation:none; }
  .dq-h.burn .dq-in { filter:brightness(.38) sepia(1) hue-rotate(-30deg) saturate(2); animation:dq-jit calc(.12s * var(--t)) linear infinite; }
  .dq-h.ko .dq-in { animation:none; transform-origin:50% 62%; rotate:90deg; translate:0 5px; transition:rotate calc(.4s * var(--t)) ease-in, translate calc(.4s * var(--t)) ease-in; filter:grayscale(.5) brightness(.8); }
  .dq-eye { position:absolute; }
  .dq-eye .dq-pu { position:absolute; animation:dq-look calc(1.3s * var(--t)) ease-in-out infinite alternate; }
  .dq-eye.b .dq-pu { animation-duration:calc(1.7s * var(--t)); animation-delay:-.6s; }
  .dq-eye .dq-x { position:absolute; left:0; top:0; display:none; }
  .ko .dq-eye .dq-pu, .dq-dr.dead .dq-eye .dq-pu, .dq-h.ko .dq-eye .dq-pu { display:none; }
  .ko .dq-eye .dq-x, .dq-dr.dead .dq-eye .dq-x { display:block; }
  .dq-hp { position:absolute; width:22px; padding:1px; background:#111; border-radius:1px; }
  .dq-hp .dq-seg i { height:3px; border:0; }

  .dq-drw { position:absolute; transform-origin:0 0; width:${DW}px; height:${DH}px; }
  .dq-dr { position:absolute; left:0; top:0; width:${DW}px; height:${DH}px; transform-origin:50% 100%; animation:dq-breathe calc(1.6s * var(--t)) steps(3) infinite alternate; }
  .dq-dr > * { position:absolute; }
  .dq-dr .dq-wing { transform-origin:100% 80%; animation:dq-flap calc(1.1s * var(--t)) ease-in-out infinite alternate; }
  .dq-dr .dq-wing.r { transform-origin:0 80%; animation-delay:-.1s; }
  .dq-dr .dq-tail { transform-origin:10% 15%; animation:dq-wag calc(.9s * var(--t)) ease-in-out infinite alternate; }
  .dq-dr .dq-darm { transform-origin:50% 10%; }
  .dq-dr .dq-hd-o { display:none; } .dq-dr.open .dq-hd-o { display:block; } .dq-dr.open .dq-hd-c { display:none; }
  .dq-dr.laugh { animation:dq-laugh calc(.22s * var(--t)) steps(2) infinite alternate; }
  .dq-dr.laugh .dq-darm.l { animation:dq-armw calc(.22s * var(--t)) steps(2) infinite alternate; } .dq-dr.laugh .dq-darm.r { animation:dq-armw calc(.22s * var(--t)) steps(2) infinite alternate-reverse; }
  .dq-dr.laugh .dq-wing { animation-duration:calc(.18s * var(--t)); }
  .dq-dr.puff { animation:dq-puff calc(.5s * var(--t)) ease-out both; }
  .dq-dr.hurt { animation:dq-hurt calc(.5s * var(--t)) steps(2) both; }
  .dq-dr.dead .dq-wing, .dq-dr.dead .dq-tail { animation:none; }
  .dq-smoke { position:absolute; width:2px; height:2px; background:#ddd; opacity:0; animation:dq-smoke calc(1.4s * var(--t)) ease-out infinite; }
  .dq-drw.frozen { filter:sepia(1) hue-rotate(155deg) saturate(3.2) brightness(1.25); animation:dq-shiver calc(.1s * var(--t)) linear infinite; }
  .dq-drw.flashy { animation:dq-inv calc(.14s * var(--t)) steps(2) 5; }
  .dq-cloud { position:absolute; opacity:.85; }

  .dq-banner { position:absolute; left:0; right:0; text-align:center; z-index:45; pointer-events:none; font:900 15px/1 "Arial Black", Arial, sans-serif; color:#ffd400;
    -webkit-text-stroke:2px #111; paint-order:stroke fill; text-shadow:0 2px 0 #111, 0 3px 0 #111; animation:dq-ban calc(.5s * var(--t)) cubic-bezier(.2,1.7,.4,1) both; }
  .dq-banner.bad { color:#ff6b6b; } .dq-banner.sm { font-size:11px; }
  .dq-num { position:absolute; z-index:35; pointer-events:none; font:900 8px/1 "Arial Black", Arial, sans-serif; color:#fff; -webkit-text-stroke:1.5px #111; paint-order:stroke fill; transform:translate(-50%, 0); }

  @keyframes dq-blink { 50% { opacity:0; } }
  @keyframes dq-good { 50% { transform:scale(1.07); } }
  @keyframes dq-nope { 25% { translate:-6px 0; } 75% { translate:6px 0; } }
  @keyframes dq-flip { from { transform:rotateX(90deg); } }
  @keyframes dq-cell { from { opacity:1; } to { opacity:0; } }
  @keyframes dq-bpop { from { transform:scale(.1); } }
  @keyframes dq-bob { 50% { translate:0 -1px; } }
  @keyframes dq-hop { from { translate:0 0; } to { translate:0 -7px; } }
  @keyframes dq-jit { 25% { translate:-1px 0; } 75% { translate:1px 0; } }
  @keyframes dq-look { from { translate:-1px -1px; } to { translate:1px 1px; } }
  @keyframes dq-breathe { from { scale:1 1; } to { scale:1.015 1.03; } }
  @keyframes dq-flap { from { rotate:6deg; } to { rotate:-12deg; } }
  @keyframes dq-wag { from { rotate:-8deg; } to { rotate:10deg; } }
  @keyframes dq-laugh { from { translate:0 0; rotate:-2deg; } to { translate:0 -4px; rotate:2deg; } }
  @keyframes dq-armw { from { rotate:-25deg; } to { rotate:25deg; } }
  @keyframes dq-puff { 0% { scale:1 1; } 60% { scale:1.14 1.2; } 100% { scale:1.1 1.16; } }
  @keyframes dq-hurt { 0% { filter:brightness(3) saturate(0); translate:3px 0; } 50% { filter:none; translate:-3px 0; } 100% { filter:brightness(2) saturate(.3); translate:0 0; } }
  @keyframes dq-smoke { 0% { opacity:0; translate:0 0; } 15% { opacity:.9; } 100% { opacity:0; translate:2px -9px; scale:2.5; } }
  @keyframes dq-shiver { 25% { translate:-1px 0; } 75% { translate:1px 0; } }
  @keyframes dq-inv { 0% { filter:invert(1) hue-rotate(180deg); } 50% { filter:none; } }
  @keyframes dq-ban { from { transform:scale(.1) rotate(-8deg); opacity:0; } }
  @media (prefers-reduced-motion: reduce) {
    .dq-h .dq-in, .dq-dr, .dq-dr .dq-wing, .dq-dr .dq-tail, .dq-eye .dq-pu, .dq-smoke, .dq-h.cheer .dq-in { animation:none !important; }
  }`;

  function injectCss() {
    if (document.getElementById("dq-css")) return;
    const style = document.createElement("style");
    style.id = "dq-css";
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  // ---------- Pixel painter: draw into a small grid of colours, then turn it into a canvas ----------
  function painter(w, h) {
    const g = new Array(w * h).fill(null);
    const inb = (x, y) => x >= 0 && y >= 0 && x < w && y < h;
    const set = (x, y, c) => { x = Math.floor(x); y = Math.floor(y); if (inb(x, y)) g[y * w + x] = c; };
    const get = (x, y) => (inb(x, y) ? g[y * w + x] : null);
    const p = {
      w, h, get, px: set,
      rect(x, y, rw, rh, c) { for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) set(x + i, y + j, c); },
      disc(cx, cy, rx, ry, c) {
        for (let y = Math.max(0, Math.floor(cy - ry)); y <= Math.min(h - 1, Math.ceil(cy + ry)); y++) {
          for (let x = Math.max(0, Math.floor(cx - rx)); x <= Math.min(w - 1, Math.ceil(cx + rx)); x++) {
            const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
            if (dx * dx + dy * dy <= 1) g[y * w + x] = c;
          }
        }
      },
      poly(pts, c) {
        let y0 = Infinity, y1 = -Infinity;
        pts.forEach((q) => { y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); });
        for (let y = Math.max(0, Math.floor(y0)); y <= Math.min(h - 1, Math.ceil(y1)); y++) {
          const yy = y + 0.5, xs = [];
          for (let i = 0; i < pts.length; i++) {
            const a = pts[i], b = pts[(i + 1) % pts.length];
            if ((a[1] <= yy && b[1] > yy) || (b[1] <= yy && a[1] > yy)) xs.push(a[0] + ((yy - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
          }
          xs.sort((m, n) => m - n);
          for (let i = 0; i + 1 < xs.length; i += 2) for (let x = Math.round(xs[i]); x < Math.round(xs[i + 1]); x++) set(x, y, c);
        }
      },
      line(x0, y0, x1, y1, c, t = 1) {
        const n = Math.max(1, Math.round(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
        for (let i = 0; i <= n; i++) p.rect(Math.round(x0 + ((x1 - x0) * i) / n - (t - 1) / 2), Math.round(y0 + ((y1 - y0) * i) / n - (t - 1) / 2), t, t, c);
      },
      outline(c = K) {
        const add = [];
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          if (!g[y * w + x] && (get(x - 1, y) || get(x + 1, y) || get(x, y - 1) || get(x, y + 1))) add.push([x, y]);
        }
        add.forEach((q) => set(q[0], q[1], c));
      },
      // light on the top-left silhouette edge, dark on the bottom-right edge, for pixels of colour `base`
      bevel(base, light, dark) {
        const src = g.slice();
        const at = (x, y) => (inb(x, y) ? src[y * w + x] : null);
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          if (src[y * w + x] !== base) continue;
          if (!at(x + 1, y) || !at(x, y + 1) || !at(x + 1, y + 1)) g[y * w + x] = dark;
          else if (!at(x - 1, y) || !at(x, y - 1) || !at(x - 1, y - 1)) g[y * w + x] = light;
        }
      },
      canvas() {
        const cv = document.createElement("canvas");
        cv.width = w; cv.height = h;
        const c = cv.getContext("2d");
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = g[y * w + x]; if (v) { c.fillStyle = v; c.fillRect(x, y, 1, 1); } }
        return cv;
      },
    };
    return p;
  }
  const mix = (hex, to, a) => {
    const f = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const A = f(hex), B = f(to);
    return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * a).toString(16).padStart(2, "0")).join("");
  };
  const place = (cv, x, y, cls) => { const e = cv; e.className = (cls ? cls + " " : "") + "abs"; e.style.left = `${x}px`; e.style.top = `${y}px`; return e; };

  // A googly eye: a white disc with a black ring (canvas), a pupil that wobbles, and an X for when it's knocked out.
  function eyeEl(n, pupil, cls) {
    const e = document.createElement("div");
    e.className = `dq-eye ${cls || ""}`;
    e.style.width = e.style.height = `${n + 2}px`;
    const p = painter(n + 2, n + 2);
    p.disc((n + 2) / 2, (n + 2) / 2, n / 2, n / 2, "#fff");
    p.outline();
    e.appendChild(p.canvas());
    const pu = painter(pupil, pupil);
    pu.disc(pupil / 2, pupil / 2, pupil / 2, pupil / 2, K);
    const pc = pu.canvas(); pc.className = "dq-pu";
    pc.style.left = `${Math.round((n + 2 - pupil) / 2)}px`; pc.style.top = `${Math.round((n + 2 - pupil) / 2)}px`;
    e.appendChild(pc);
    const x = painter(n + 2, n + 2);
    x.disc((n + 2) / 2, (n + 2) / 2, n / 2, n / 2, "#fff");
    x.line(2, 2, n - 1, n - 1, K, 1); x.line(n - 1, 2, 2, n - 1, K, 1);
    x.outline();
    const xc = x.canvas(); xc.className = "dq-x";
    e.appendChild(xc);
    return e;
  }

  // ---------- A hero: a big pixel capital letter with googly eyes, little legs and arms ----------
  const heroCache = {};
  function heroSprite(letter, color) {
    const key = letter + color;
    if (heroCache[key]) return heroCache[key];
    const tmp = document.createElement("canvas");
    tmp.width = tmp.height = 48;
    const t = tmp.getContext("2d", { willReadFrequently: true });
    t.font = '900 32px "Arial Black", Arial, sans-serif';
    t.textAlign = "center"; t.textBaseline = "alphabetic"; t.fillStyle = "#000";
    t.fillText(letter, 24, 36);
    const d = t.getImageData(0, 0, 48, 48).data;
    const on = (x, y) => x >= 0 && y >= 0 && x < 48 && y < 48 && d[(y * 48 + x) * 4 + 3] > 120;
    let x0 = 99, x1 = -1, y0 = 99, y1 = -1;
    for (let y = 0; y < 48; y++) for (let x = 0; x < 48; x++) if (on(x, y)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1, top = 5, bot = 5, side = 3;
    const W = bw + side * 2 + 2, H = bh + top + bot + 2;
    const ox = side + 1 - x0, oy = top + 1 - y0;
    const p = painter(W, H);
    const light = mix(color, "#ffffff", 0.4), dark = mix(color, "#000000", 0.28), legc = mix(color, "#000000", 0.18);
    const cxm = Math.round(bw / 2) + side + 1;
    p.rect(cxm - 6, H - 1 - bot - 1, 3, bot + 1, legc); p.rect(cxm + 3, H - 1 - bot - 1, 3, bot + 1, legc);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (!on(x, y)) continue;
      const c = !on(x + 1, y) || !on(x, y + 1) ? dark : !on(x - 1, y) || !on(x, y - 1) ? light : color;
      p.px(x + ox, y + oy, c);
    }
    p.outline();
    // where the top of the letter is (for the eyes), and the left/right edges at mid height (for the arms)
    let tl = 99, tr = -1;
    for (let y = y0; y <= y0 + 1; y++) for (let x = x0; x <= x1; x++) if (on(x, y)) { tl = Math.min(tl, x); tr = Math.max(tr, x); }
    const my = y0 + Math.round(bh * 0.5);
    let ml = 99, mr = -1;
    for (let x = x0; x <= x1; x++) if (on(x, my)) { ml = Math.min(ml, x); mr = Math.max(mr, x); }
    const s = { cv: p.canvas(), w: W, h: H, eyeX: Math.round((tl + tr) / 2) + ox, eyeY: y0 + oy - 3, armL: ml + ox, armR: mr + ox, armY: my + oy - 2, feetY: H, color };
    heroCache[key] = s;
    return s;
  }
  function heroEl(h) {
    const s = heroSprite(h.letter, h.color);
    const wrap = document.createElement("div");
    wrap.className = "dq-h";
    wrap.style.width = `${s.w}px`; wrap.style.height = `${s.h}px`;
    const inn = document.createElement("div");
    inn.className = "dq-in";
    const armBg = (c) => `background:${c}`;
    inn.innerHTML = `<div class="dq-arm l" style="left:${s.armL - 3}px;top:${s.armY}px;${armBg(mix(s.color, "#000", 0.1))}"></div>` +
      `<div class="dq-arm r" style="left:${s.armR - 0}px;top:${s.armY}px;${armBg(mix(s.color, "#000", 0.1))}"></div>`;
    const cv = s.cv.cloneNode(); cv.getContext("2d").drawImage(s.cv, 0, 0);
    cv.className = "abs"; cv.style.left = cv.style.top = "0";
    inn.appendChild(cv);
    const el1 = eyeEl(6, 3, "a"), el2 = eyeEl(6, 3, "b");
    el1.style.left = `${s.eyeX - 7}px`; el1.style.top = `${s.eyeY}px`;
    el2.style.left = `${s.eyeX}px`; el2.style.top = `${s.eyeY + 1}px`;
    inn.append(el1, el2);
    wrap.appendChild(inn);
    return { wrap, inn, s };
  }

  // ---------- The dragon: front view, purple, bug-eyed, with a huge grin ----------
  function dragonEl() {
    const dr = document.createElement("div");
    dr.className = "dq-dr";
    const PUR = "#8e5cf0", PURD = "#6a3cc4", PURL = "#b08cff", BEL = "#ffd9ea", ORG = "#ff9f1c", ORGD = "#d9480f", YEL = "#ffd23f", LIME = "#b5f23d";
    // wings (the left one drawn, the right one mirrored)
    const wing = (flip) => {
      const p = painter(26, 32);
      p.poly([[25, 26], [3, 2], [11, 14], [2, 18], [10, 24], [8, 31], [25, 31]], ORG);
      p.line(25, 26, 3, 2, ORGD); p.line(25, 26, 2, 18, ORGD); p.line(25, 27, 8, 31, ORGD);
      p.px(3, 1, YEL); p.px(2, 2, YEL);
      p.outline();
      let cv = p.canvas();
      if (flip) { const m = document.createElement("canvas"); m.width = 26; m.height = 32; const mc = m.getContext("2d"); mc.translate(26, 0); mc.scale(-1, 1); mc.drawImage(cv, 0, 0); cv = m; }
      cv.className = "dq-wing abs" + (flip ? " r" : "");
      cv.style.left = flip ? `${DW - 26}px` : "0px"; cv.style.top = "14px";
      return cv;
    };
    dr.appendChild(wing(false)); dr.appendChild(wing(true));
    // tail
    {
      const p = painter(24, 30);
      const pts = [[3, 4, 3.4], [8, 6, 3.2], [13, 10, 3], [17, 15, 2.6], [18, 20, 2.3], [15, 24, 2]];
      pts.forEach(([x, y, r]) => p.disc(x, y, r, r, PUR));
      p.poly([[15, 22], [22, 25], [19, 29], [13, 29], [10, 25]], "#ff4f7b");
      p.bevel(PUR, PURL, PURD);
      p.outline();
      const cv = p.canvas();
      cv.className = "dq-tail abs"; cv.style.left = `${DW - 28}px`; cv.style.top = "34px";
      dr.appendChild(cv);
    }
    // body
    {
      const p = painter(40, 34);
      p.disc(11, 31, 6, 3, PURD); p.disc(29, 31, 6, 3, PURD);
      [6, 10, 14].forEach((x) => p.px(x, 33, YEL)); [24, 28, 32].forEach((x) => p.px(x, 33, YEL));
      p.disc(20, 16, 19, 15, PUR);
      p.disc(20, 19, 10, 12, BEL);
      for (let y = 11; y < 31; y += 4) for (let x = 8; x < 33; x++) if (p.get(x, y) === BEL) p.px(x, y, "#f6a9cb");
      p.disc(8, 10, 2, 2, LIME); p.disc(33, 12, 2, 2, LIME); p.disc(31, 5, 1.5, 1.5, LIME); p.disc(6, 18, 1.5, 1.5, LIME);
      p.bevel(PUR, PURL, PURD);
      p.outline();
      dr.appendChild(place(p.canvas(), 16, 26));
    }
    // arms
    [false, true].forEach((r) => {
      const p = painter(9, 13);
      p.disc(4.5, 6, 3.5, 5.5, PUR); [2, 4, 6].forEach((x) => p.px(x, 11, YEL));
      p.bevel(PUR, PURL, PURD);
      p.outline();
      const cv = place(p.canvas(), r ? 55 : 8, 36, `dq-darm ${r ? "r" : "l"}`);
      dr.appendChild(cv);
    });
    // heads: grin, and open mouth (roars, fire, laughs)
    const head = (open) => {
      const p = painter(42, 36);
      p.poly([[6, 15], [2, 1], [13, 10]], YEL); p.poly([[36, 15], [40, 1], [29, 10]], YEL);
      p.poly([[19, 11], [21, 2], [23, 11]], YEL);
      p.disc(21, 22, 18, 12, "#9a6bff");
      p.disc(21, 27, 12.5, 7.5, PURL);
      p.rect(15, 23, 2, 2, K); p.rect(25, 23, 2, 2, K);
      p.disc(6, 25, 3, 2.5, "#ff8fc2"); p.disc(36, 25, 3, 2.5, "#ff8fc2");
      if (!open) {
        for (let x = 10; x <= 32; x++) { const y = 28 + Math.round(3 * (1 - ((x - 21) / 11) ** 2)); p.px(x, y, K); p.px(x, y + 1, K); }
        [12, 16, 20, 24, 28].forEach((x, i) => { const y = 28 + Math.round(3 * (1 - ((x - 21) / 11) ** 2)); p.rect(x, y + 2, 2, 2, "#fff"); });
      } else {
        p.disc(21, 29, 11, 6.5, K);
        p.disc(21, 29.5, 10, 5.5, "#7a0b2c");
        for (let x = 13; x < 30; x += 4) p.poly([[x, 24], [x + 3, 24], [x + 1.5, 28]], "#fff");
        p.disc(21, 33, 6, 2.6, "#ff6f91");
      }
      p.bevel("#9a6bff", PURL, PURD);
      p.outline();
      const cv = place(p.canvas(), 15, 0, open ? "dq-hd-o" : "dq-hd-c");
      return cv;
    };
    dr.appendChild(head(false)); dr.appendChild(head(true));
    // bulging mismatched eyes on top of the head, with brows
    const eL = eyeEl(14, 6, "a"), eR = eyeEl(11, 5, "b");
    eL.style.left = "19px"; eL.style.top = "0px"; eR.style.left = "37px"; eR.style.top = "3px";
    dr.append(eL, eR);
    // smoke from the nostrils
    [[31, 24], [41, 24]].forEach(([x, y], i) => { const s = document.createElement("i"); s.className = "dq-smoke"; s.style.left = `${x}px`; s.style.top = `${y}px`; s.style.animationDelay = `${-i * 0.7}s`; dr.appendChild(s); });
    return dr;
  }

  function swordSprite() {
    const p = painter(15, 64);
    p.poly([[3, 14], [12, 14], [12, 54], [7.5, 63], [3, 54]], "#cfe6ff");
    p.poly([[8, 14], [12, 14], [12, 54], [8, 61]], "#8fb9e6");
    p.rect(7, 16, 1, 40, "#ffffff");
    p.rect(0, 9, 15, 5, YELLOW);
    p.rect(6, 10, 3, 3, "#e8173c");
    p.rect(5, 0, 5, 9, "#8b4513"); p.rect(5, 3, 5, 1, "#5c2e0a"); p.rect(5, 6, 5, 1, "#5c2e0a");
    p.disc(7.5, 1, 3, 2, YELLOW);
    p.outline();
    return p.canvas();
  }
  const YELLOW = "#ffd23f";
  function fireballSprite() {
    const p = painter(14, 14);
    p.disc(7, 7, 6.5, 6.5, "#e8173c"); p.disc(7, 7, 4.8, 4.8, "#ff7a00"); p.disc(7, 7, 2.8, 2.8, "#ffd400"); p.disc(6, 6, 1.2, 1.2, "#fff");
    p.poly([[1, 2], [4, 4], [3, 0]], "#ff7a00"); p.poly([[10, 1], [10, 4], [13, 2]], "#e8173c");
    p.outline();
    return p.canvas();
  }
  function cloudSprite(w) {
    const p = painter(w, 12);
    p.disc(w * 0.25, 7, w * 0.2, 4, "#d8dbea"); p.disc(w * 0.5, 5, w * 0.25, 5, "#d8dbea"); p.disc(w * 0.75, 7, w * 0.2, 4, "#d8dbea");
    p.rect(Math.round(w * 0.1), 7, Math.round(w * 0.8), 3, "#d8dbea");
    p.bevel("#d8dbea", "#fff", "#9aa0c0");
    p.outline();
    return p.canvas();
  }
  function stormSprite(w) {
    const p = painter(w, 14);
    p.disc(w * 0.22, 8, w * 0.2, 5, "#4b4f78"); p.disc(w * 0.5, 6, w * 0.28, 6, "#4b4f78"); p.disc(w * 0.78, 8, w * 0.2, 5, "#4b4f78");
    p.rect(Math.round(w * 0.08), 8, Math.round(w * 0.84), 4, "#4b4f78");
    p.bevel("#4b4f78", "#8387b8", "#2d3050");
    p.outline();
    return p.canvas();
  }
  function iceSprite(w, h) {
    const p = painter(w, h);
    for (let x = 0; x < w; x++) {
      const top = 2 + ((x * 7) % 5) + (x % 4 === 0 ? 0 : 1);
      for (let y = top; y < h; y++) p.px(x, y, (x + y) % 9 === 0 ? "#ffffff" : "#bff6ff");
    }
    for (let i = 0; i < 6; i++) p.line(2 + i * 6, 3, 14 + i * 6, h - 4, "#e9fdff");
    p.bevel("#bff6ff", "#ffffff", "#5ad1f2");
    p.outline("#1b7fb0");
    return p.canvas();
  }
  function circleSprite(w) {
    const h = Math.round(w * 0.4), p = painter(w, h);
    p.disc(w / 2, h / 2, w / 2 - 0.5, h / 2 - 0.5, "#ffe066");
    p.disc(w / 2, h / 2, w / 2 - 2.5, h / 2 - 2, "rgba(0,0,0,0)");
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dx = (x + 0.5 - w / 2) / (w / 2 - 2.5), dy = (y + 0.5 - h / 2) / (h / 2 - 2);
      if (dx * dx + dy * dy < 1) p.px(x, y, ((x * 3 + y * 5) % 7 === 0) ? "#fff7c2" : null);
    }
    return p.canvas();
  }

  const pickc = (a) => a[Math.floor(Math.random() * a.length)];
  const rnd = (a, b) => a + Math.random() * (b - a);

  registerMicrogame({
    id: "dragon-quest",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 30000,
    input: "tap",
    tutorial: true,

    start(ctx) {
      injectCss();
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const T = ctx.demo ? 0.55 : 1;
      const ms = (n) => Math.round(n * T);
      const wait = (n) => new Promise((r) => ctx.later(r, ms(n)));
      const { tone, sweep, noise } = ctx.sfx;
      const GOAL = 4, N = 4;
      const S = ctx.choiceSteps(GOAL, N);
      let C = S[0];
      let step = 0, misses = 0, busy = true, done = false, gone = false, introDone = false;

      // ---------- DOM ----------
      const wrap = document.createElement("div");
      wrap.className = "dq";
      wrap.style.setProperty("--t", T);
      const stage = document.createElement("div");
      stage.className = "dq-stage";
      const world = document.createElement("div");
      world.className = "dq-world";
      const cam = document.createElement("div");
      cam.className = "dq-cam";
      world.appendChild(cam);
      stage.appendChild(world);
      const bgCv = document.createElement("canvas");
      bgCv.className = "abs"; bgCv.style.left = bgCv.style.top = "0";
      const layer = document.createElement("div");
      layer.className = "dq-layer";
      cam.append(bgCv, layer);
      // clouds
      const clouds = [cloudSprite(22), cloudSprite(16)].map((c, i) => { c.className = "dq-cloud"; c.style.top = `${10 + i * 14}px`; layer.appendChild(c); return c; });
      // the dragon
      const drw = document.createElement("div");
      drw.className = "dq-drw";
      const dr = dragonEl();
      drw.appendChild(dr);
      layer.appendChild(drw);
      // the party
      const heroes = HEROES.map((h, i) => {
        const e = heroEl(h);
        layer.appendChild(e.wrap);
        const hp = document.createElement("div");
        hp.className = "dq-hp";
        hp.innerHTML = '<div class="dq-seg"><i></i><i></i><i></i></div>';
        layer.appendChild(hp);
        return { ...e, hp, seg: hp.firstChild, def: h, i, x: 0, y: 0 };
      });
      // dragon name + health, and its speech bubble
      const dhp = document.createElement("div");
      dhp.className = "dq-hpbox";
      dhp.innerHTML = `<b>${TEXT.dragonName}</b><div class="dq-seg"><i></i><i></i><i></i><i></i></div>`;
      dhp.style.width = "38px";
      const dseg = dhp.querySelector(".dq-seg");
      const bub = document.createElement("div");
      bub.className = "dq-bub hide";
      bub.setAttribute("role", "button");
      bub.setAttribute("aria-label", TEXT.bubbleLabel);
      const fx = document.createElement("div");
      fx.className = "dq-fx";
      const flashEl = document.createElement("div");
      flashEl.className = "dq-flash";
      const dark = document.createElement("div");
      dark.className = "dq-dark";
      layer.append(dhp, bub);
      world.append(dark, fx, flashEl);
      // the command box
      const box = document.createElement("div");
      box.className = "dq-box msg";
      box.innerHTML = '<div class="dq-opts"></div><div class="dq-msg"></div>';
      const optsEl = box.querySelector(".dq-opts"), msgEl = box.querySelector(".dq-msg");
      const opts = [...Array(N)].map((_, i) => {
        const b = document.createElement("button");
        b.className = "dq-opt";
        const o = { btn: b, opt: null, i };
        b.addEventListener("pointerdown", (e) => { e.preventDefault(); choose(o); });
        b.addEventListener("click", (e) => { if (e.detail === 0) choose(o); });
        optsEl.appendChild(b);
        return o;
      });
      wrap.append(stage, box);
      ctx.root.appendChild(wrap);
      const setMsg = (t) => { msgEl.textContent = t; box.classList.add("msg"); };
      const showOpts = () => box.classList.remove("msg");
      msgEl.textContent = "";

      bub.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });

      // ---------- Layout (logical pixels; the world is scaled up to fit the stage) ----------
      let s = 3, LW = 100, LH = 120, wide = false, dk = 1, dX = 0, dY = 0, dcx = 0, dcy = 0, mouth = { x: 0, y: 0 };
      function layout() {
        const sw = stage.clientWidth, sh = stage.clientHeight;
        if (!sw || !sh) return;
        s = Math.min(sh / 120, sw / 100);
        LW = Math.max(100, Math.round(sw / s)); LH = Math.max(120, Math.round(sh / s));
        world.style.width = `${LW}px`; world.style.height = `${LH}px`; world.style.transform = `scale(${s})`;
        wide = LW / LH > 1.45;
        const hh = heroes[0].s.h;
        // the party
        heroes.forEach((h, i) => {
          h.k = wide ? 1.2 : 1;
          if (wide) { const P = [[0.64, 0.56], [0.82, 0.68], [0.64, 0.85], [0.82, 0.97]][i]; h.x = Math.round(LW * P[0]); h.y = Math.round(LH * P[1]); }
          else { h.x = Math.round(LW * (0.5 + (i - 1.5) * 0.235)); h.y = LH - 9; }
          h.wrap.style.left = `${h.x - h.s.w / 2}px`; h.wrap.style.top = `${h.y - h.s.h}px`;
          h.wrap.style.transformOrigin = "50% 100%"; h.wrap.style.transform = `scale(${h.k})`;
          h.hp.style.left = wide ? `${h.x + h.s.w * h.k / 2 + 2}px` : `${h.x - 11}px`;
          h.hp.style.top = wide ? `${h.y - 7}px` : `${h.y + 2}px`;
        });
        // the dragon
        const heroTop = wide ? 0 : LH - 9 - hh;
        if (wide) {
          dk = Math.min(1.9, (LH * 0.72) / DH);
          dX = Math.round(LW * 0.27 - (DW * dk) / 2); dY = Math.round(LH * 0.9 - DH * dk);
        } else {
          dk = Math.max(0.8, Math.min(1.2, (heroTop - 3 - 20) / DH, (LW * 0.9) / DW));
          dX = Math.round(LW / 2 - (DW * dk) / 2); dY = Math.round(Math.max(18, heroTop - 3 - DH * dk));
        }
        drw.style.left = `${dX}px`; drw.style.top = `${dY}px`; drw.style.transform = `scale(${dk})`;
        dcx = dX + (DW * dk) / 2; dcy = dY + DH * dk * 0.55;
        mouth = { x: dX + DW * dk * 0.5, y: dY + DH * dk * 0.5 };
        dhp.style.left = "3px"; dhp.style.top = "3px";
        const bs = wide ? 17 : 15;
        bub.style.fontSize = `${bs}px`;
        if (wide) { bub.style.left = `${Math.round(dX + DW * dk * 0.62)}px`; bub.style.top = `${Math.max(3, dY - 8 - bs * 1.4)}px`; bub.style.right = ""; }
        else { bub.style.left = ""; bub.style.right = "4px"; bub.style.top = "3px"; }
        bub.style.setProperty("--tx", wide ? "20%" : "40%");
        clouds.forEach((c, i) => { c.style.left = `${i * LW * 0.5}px`; });
        drawBg();
        const oh = Math.max(56, Math.min(86, (wrap.clientHeight - stage.clientHeight) / 3));
        box.style.setProperty("--oh", `${oh}px`);
      }
      function drawBg() {
        const w = LW, h = LH;
        bgCv.width = w; bgCv.height = h; bgCv.style.width = `${w}px`; bgCv.style.height = `${h}px`;
        const c = bgCv.getContext("2d");
        const horizon = Math.round(wide ? h * 0.4 : dY + DH * dk - 12);
        const bands = ["#2b1055", "#3b1a78", "#512a96", "#7a3aa8", "#a84fb0", "#d96ba5", "#f48f98", "#ffb99a"];
        const bh = horizon / bands.length;
        for (let y = 0; y < horizon; y++) {
          const bi = Math.min(bands.length - 1, Math.floor(y / bh)), frac = y / bh - bi;
          for (let x = 0; x < w; x++) {
            const dith = frac > 0.7 && (x + y) % 2 === 0 ? 1 : 0;
            c.fillStyle = bands[Math.min(bands.length - 1, bi + dith)];
            c.fillRect(x, y, 1, 1);
          }
        }
        // stars, sun
        c.fillStyle = "#fff";
        for (let i = 0; i < 18; i++) { const x = (i * 53 + 7) % w, y = (i * 29 + 3) % Math.max(10, Math.round(horizon * 0.4)); c.fillRect(x, y, 1, 1); }
        const sx = Math.round(w * 0.82), sy = Math.round(horizon * 0.62), sr = 9;
        for (let y = -sr; y <= sr; y++) for (let x = -sr; x <= sr; x++) if (x * x + y * y <= sr * sr) { c.fillStyle = y > 3 && y % 3 === 0 ? "#ffb347" : "#ffe38a"; c.fillRect(sx + x, sy + y, 1, 1); }
        // mountains
        const mount = (base, amp, f, col, ph) => {
          c.fillStyle = col;
          for (let x = 0; x < w; x++) {
            const hgt = Math.round(amp * (0.55 + 0.3 * Math.sin(x * f + ph) + 0.15 * Math.sin(x * f * 2.7 + ph * 2)));
            c.fillRect(x, base - hgt, 1, hgt + 1);
          }
        };
        mount(horizon, 20, 0.07, "#6a3a9c", 1); mount(horizon, 12, 0.11, "#4a2778", 3);
        // ground
        c.fillStyle = "#3e9a46"; c.fillRect(0, horizon, w, h - horizon);
        c.fillStyle = "#68cf66"; c.fillRect(0, horizon, w, 2);
        for (let y = horizon + 4; y < h; y += 7) { c.fillStyle = "#37893f"; for (let x = (y % 14 === 0 ? 0 : 4); x < w; x += 8) c.fillRect(x, y, 4, 1); }
        for (let i = 0; i < 40; i++) { const x = (i * 37 + 11) % w, y = horizon + 3 + ((i * 17) % Math.max(4, h - horizon - 4)); c.fillStyle = i % 3 ? "#58c05a" : "#2d7a35"; c.fillRect(x, y, 1, 2); c.fillRect(x + 2, y + 1, 1, 1); }
      }

      // ---------- Small helpers ----------
      function spark(x, y, o = {}) {
        if (reduceMotion && !o.keep) return;
        const e = document.createElement("i");
        e.className = "dq-p";
        const sz = o.size || 2;
        e.style.cssText = `left:${Math.round(x)}px;top:${Math.round(y)}px;width:${sz}px;height:${sz}px;background:${o.color || "#fff"}`;
        fx.appendChild(e);
        const dur = ms(o.dur || 500), delay = o.delay ? ms(o.delay) : 0;
        e.animate([{ transform: "translate(0,0) scale(1)", opacity: 1 },
          { transform: `translate(${Math.round(o.dx || 0)}px, ${Math.round(o.dy || 0)}px) scale(${o.end === undefined ? 0.3 : o.end})`, opacity: o.fade === false ? 1 : 0 }],
        { duration: dur, delay, easing: o.ease || "ease-out", fill: "both" });
        ctx.later(() => e.remove(), dur + delay + 100);
      }
      function burst(x, y, n, colors, spread, o = {}) {
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2 + rnd(-0.3, 0.3), d = rnd(spread * 0.5, spread);
          spark(x, y, { color: pickc(colors), size: pickc([1, 2, 2, 3]), dx: Math.cos(a) * d, dy: Math.sin(a) * d + (o.fall || 0), dur: rnd(350, 650), ease: o.fall ? "cubic-bezier(.2,.6,.5,1)" : "ease-out" });
        }
      }
      function flash(color, dur = 160, peak = 0.9) {
        flashEl.style.background = color || "#fff";
        flashEl.animate([{ opacity: peak }, { opacity: 0 }], { duration: ms(dur), easing: "ease-out" });
      }
      function shake(mag = 3, dur = 400) {
        if (reduceMotion) return;
        const n = Math.max(4, Math.round(dur / 50)), kf = [];
        for (let i = 0; i < n; i++) kf.push({ transform: `translate(${Math.round(rnd(-mag, mag))}px, ${Math.round(rnd(-mag, mag))}px)` });
        kf.push({ transform: "translate(0,0)" });
        cam.animate(kf, { duration: ms(dur), easing: "linear" });
      }
      function floatNum(x, y, text, color) {
        const e = document.createElement("div");
        e.className = "dq-num";
        e.textContent = text;
        e.style.left = `${Math.round(x)}px`; e.style.top = `${Math.round(y)}px`;
        if (color) e.style.color = color;
        fx.appendChild(e);
        e.animate([{ transform: "translate(-50%, 6px) scale(.3)", opacity: 0 }, { transform: "translate(-50%, -4px) scale(1.3)", opacity: 1, offset: 0.25 },
          { transform: "translate(-50%, -2px) scale(1)", opacity: 1, offset: 0.6 }, { transform: "translate(-50%, -12px) scale(1)", opacity: 0 }], { duration: ms(1000), easing: "ease-out", fill: "both" });
        ctx.later(() => e.remove(), ms(1100));
      }
      function banner(text, y, cls) {
        const e = document.createElement("div");
        e.className = `dq-banner ${cls || ""}`;
        e.textContent = text;
        e.style.top = `${y}px`;
        if (wide) { e.style.right = "auto"; e.style.width = `${Math.round(dcx * 2)}px`; }
        fx.appendChild(e);
        return e;
      }
      const heroTopPt = (h) => ({ x: h.x, y: h.y - h.s.h * h.k + 2 });
      function dragonHurt() {
        dr.classList.remove("hurt"); void dr.offsetWidth; dr.classList.add("hurt");
        ctx.later(() => dr.classList.remove("hurt"), ms(520));
      }
      function setSeg(seg, remaining, total) {
        [...seg.children].forEach((c, i) => c.classList.toggle("off", i >= remaining));
        seg.classList.toggle("hurt", remaining < total && remaining > 1);
        seg.classList.toggle("low", remaining <= 1 && remaining < total);
      }
      function dragonSay(open = 600) {
        dr.classList.add("open");
        ctx.later(() => { if (!dr.classList.contains("keepopen")) dr.classList.remove("open"); }, ms(open));
      }
      function setBubble(text) {
        bub.textContent = text;
        bub.classList.remove("hide", "pop"); void bub.offsetWidth; bub.classList.add("pop");
      }

      // ---------- Options ----------
      function showRow(flip) {
        const row = ctx.shuffle(C.row.slice());
        opts.forEach((o, i) => {
          o.opt = row[i] || null;
          const b = o.btn;
          b.className = "dq-opt";
          b.disabled = !o.opt;
          b.style.visibility = o.opt ? "" : "hidden";
          if (!o.opt) return;
          b.textContent = o.opt.text;
          if (o.opt.kind === "pic") b.classList.add("pic");
          b.style.fontSize = o.opt.kind === "word" ? `${Math.min(2.2, 9 / Math.max(3, o.opt.text.length))}rem` : "";
          b.setAttribute("aria-label", TEXT.optLabel(o.opt.spoken));
          if (flip) { void b.offsetWidth; b.classList.add("flip"); }
        });
      }
      function ask(first) {
        C = S[step];
        showRow(!first);
        showOpts();
        setBubble(C.cardText);
        dragonSay(700);
        ctx.later(() => { if (!done) ctx.say(C.prompt); }, ms(first ? 150 : 100));
      }
      function replay() {
        if (done || !introDone) return;
        tone(1568, 0.1, "triangle", 0.06);
        bub.classList.remove("pop"); void bub.offsetWidth; bub.classList.add("pop");
        dragonSay(500);
        ctx.say(C.prompt);
      }

      // ---------- Choosing ----------
      function choose(o) {
        if (busy || done || ctx.ended || !introDone || !o.opt || o.btn.disabled) return;
        busy = true;
        opts.forEach((x) => x.btn.classList.remove("cur"));
        o.btn.classList.add("cur");
        if (o.opt.right) right(o); else wrong(o);
      }

      // ---------- A RIGHT answer: the next party member attacks ----------
      async function right(o) {
        const k = step;
        step++;
        o.btn.classList.add("good");
        opts.forEach((x) => { if (x !== o) x.btn.classList.add("dim"); });
        if (o.opt.kind === "pic") ctx.say(o.opt.spoken);
        if (k === GOAL - 1) ctx.freezeTimer(); else ctx.pauseTimer(ms(3300));
        const h = heroes[k];
        await wait(300);
        h.wrap.classList.add("cast");
        await ATTACKS[h.def.atk](h);
        setSeg(dseg, GOAL - 1 - k, GOAL);
        if (k < GOAL - 1) {
          h.wrap.classList.remove("cast");
          await wait(500);
          if (gone) return;
          ask(false);
          busy = false;
        } else {
          await finale();
        }
      }

      // Attack 1: A throws a fireball.
      async function fireAtk(h) {
        const a = heroTopPt(h), d = { x: dcx, y: dcy };
        tone(300, 0.5, "sawtooth", 0.05); sweep(200, 700, 0.5, "sawtooth", 0.07); noise(0.5, "bandpass", 500, 2500, 0.18);
        const orb = fireballSprite();
        orb.className = "abs"; orb.style.left = `${a.x - 7}px`; orb.style.top = `${a.y - 14}px`; orb.style.zIndex = 25; orb.style.transformOrigin = "50% 50%";
        layer.appendChild(orb);
        orb.animate([{ transform: "scale(0)" }, { transform: "scale(1.2)" }, { transform: "scale(1)" }], { duration: ms(450), fill: "both" });
        for (let i = 0; i < 8; i++) ctx.later(() => spark(a.x + rnd(-8, 8), a.y - 6 + rnd(-6, 6), { color: pickc(["#ffd400", "#ff7a00"]), dx: rnd(-3, 3), dy: -8, dur: 350 }), ms(i * 55));
        await wait(520);
        // fly
        sweep(400, 1200, 0.45, "sawtooth", 0.08);
        const fx0 = a.x - 7, fy0 = a.y - 14, fx1 = d.x - 7, fy1 = d.y - 7, dur = ms(520);
        orb.animate([{ transform: "translate(0,0) scale(1) rotate(0deg)" },
          { transform: `translate(${(fx1 - fx0) * 0.5}px, ${(fy1 - fy0) * 0.5 - 14}px) scale(1.5) rotate(180deg)`, offset: 0.5 },
          { transform: `translate(${fx1 - fx0}px, ${fy1 - fy0}px) scale(2) rotate(360deg)` }], { duration: dur, easing: "ease-in", fill: "both" });
        const trail = 12;
        for (let i = 0; i < trail; i++) {
          const f = i / trail;
          ctx.later(() => {
            const px = fx0 + (fx1 - fx0) * f + 7, py = fy0 + (fy1 - fy0) * f - Math.sin(f * Math.PI) * 14 + 7;
            spark(px + rnd(-3, 3), py + rnd(-3, 3), { color: pickc(["#ffd400", "#ff7a00", "#e8173c"]), size: pickc([2, 3, 4]), dx: rnd(-4, 4), dy: rnd(-4, 6), dur: 400 });
          }, dur * f);
        }
        await wait(540);
        orb.remove();
        // BOOM
        flash("#ffd9a0", 220, 0.85); shake(3, 450); dragonHurt();
        noise(0.5, "lowpass", 1800, 120, 0.7); tone(110, 0.3, "square", 0.14); tone(70, 0.4, "sawtooth", 0.12, 0.05);
        burst(d.x, d.y, 22, ["#fff", "#ffd400", "#ff7a00", "#e8173c"], 26);
        const ring = document.createElement("div");
        ring.className = "dq-p"; ring.style.cssText = `left:${d.x - 8}px;top:${d.y - 8}px;width:16px;height:16px;border:2px solid #ffb347;border-radius:50%`;
        fx.appendChild(ring);
        ring.animate([{ transform: "scale(.3)", opacity: 1 }, { transform: "scale(3.2)", opacity: 0 }], { duration: ms(450), easing: "ease-out", fill: "both" });
        ctx.later(() => ring.remove(), ms(500));
        floatNum(d.x, d.y - 16, "25", "#ffd400");
        h.wrap.classList.remove("cast");
        await wait(650);
      }

      // Attack 2: B fires an ice beam and the dragon freezes.
      async function iceAtk(h) {
        const a = heroTopPt(h), d = { x: dcx, y: dcy };
        tone(1200, 0.4, "triangle", 0.06); tone(1800, 0.3, "triangle", 0.05, 0.1); tone(2400, 0.3, "triangle", 0.04, 0.2);
        for (let i = 0; i < 10; i++) ctx.later(() => spark(a.x + rnd(-8, 8), a.y - 6 + rnd(-8, 4), { color: pickc(["#fff", "#9fe9ff", "#4cc9f0"]), dx: rnd(-6, 6), dy: rnd(-8, 6), dur: 500 }), ms(i * 45));
        await wait(500);
        // the beam
        const dx = d.x - a.x, dy = d.y - a.y, len = Math.hypot(dx, dy), ang = (Math.atan2(dy, dx) * 180) / Math.PI;
        const beam = document.createElement("div");
        beam.className = "dq-p";
        beam.style.cssText = `left:${a.x}px;top:${a.y - 3}px;width:${len}px;height:6px;transform-origin:0 50%;z-index:25;` +
          "background:repeating-linear-gradient(90deg,#fff 0 3px,#9fe9ff 3px 6px,#35b5f0 6px 9px);box-shadow:0 -1px 0 #0a5a8c, 0 1px 0 #0a5a8c, 0 -3px 0 rgba(120,220,255,.5), 0 3px 0 rgba(120,220,255,.5)";
        fx.appendChild(beam);
        beam.animate([{ transform: `rotate(${ang}deg) scaleX(0)` }, { transform: `rotate(${ang}deg) scaleX(1)` }], { duration: ms(180), easing: "ease-out", fill: "both" });
        sweep(2200, 500, 0.7, "sawtooth", 0.06); noise(0.7, "highpass", 3000, 6000, 0.14);
        for (let i = 0; i < 16; i++) {
          const f = i / 16;
          ctx.later(() => spark(a.x + dx * f + rnd(-3, 3), a.y + dy * f + rnd(-5, 5), { color: pickc(["#fff", "#9fe9ff"]), size: pickc([1, 2]), dx: rnd(-3, 3), dy: rnd(2, 9), dur: 450 }), ms(100 + i * 35));
        }
        await wait(260);
        // frozen solid
        const iw = Math.round(DW * dk * 0.75), ih = Math.round(DH * dk * 0.92);
        const ice = iceSprite(iw, ih);
        ice.className = "abs"; ice.style.left = `${Math.round(dX + (DW * dk - iw) / 2)}px`; ice.style.top = `${dY + Math.round(DH * dk - ih)}px`; ice.style.zIndex = 22; ice.style.opacity = ".78";
        layer.appendChild(ice);
        ice.animate([{ transform: "scale(.5)", opacity: 0 }, { transform: "scale(1)", opacity: 0.78 }], { duration: ms(200), easing: "ease-out", fill: "both", transformOrigin: "50% 100%" });
        drw.classList.add("frozen");
        flash("#c9f4ff", 220, 0.8); dragonHurt(); shake(2, 300);
        for (let i = 0; i < 4; i++) tone(2000 + i * 400, 0.12, "triangle", 0.06, i * 0.06);
        burst(d.x, d.y, 14, ["#fff", "#9fe9ff", "#4cc9f0"], 22);
        floatNum(d.x, d.y - 18, "25", "#9fe9ff");
        h.wrap.classList.remove("cast");
        beam.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms(300), delay: ms(150), fill: "both" });
        ctx.later(() => beam.remove(), ms(500));
        await wait(900);
        // shatter
        noise(0.45, "highpass", 3500, 8000, 0.4); tone(1500, 0.12, "square", 0.07); tone(1000, 0.18, "square", 0.05, 0.05);
        drw.classList.remove("frozen"); ice.remove(); flash("#fff", 120, 0.5);
        for (let i = 0; i < 24; i++) spark(dX + rnd(0, DW * dk), dY + rnd(0, DH * dk), { color: pickc(["#fff", "#bff6ff", "#5ad1f2"]), size: pickc([2, 3, 4]), dx: rnd(-14, 14), dy: rnd(8, 32), dur: rnd(500, 800), ease: "ease-in" });
        await wait(300);
      }

      // Attack 3: C calls down lightning from a storm cloud.
      async function boltAtk(h) {
        const a = heroTopPt(h), d = { x: dcx, y: dcy };
        tone(120, 0.7, "sawtooth", 0.08); noise(0.8, "lowpass", 500, 150, 0.4);
        for (let i = 0; i < 10; i++) ctx.later(() => spark(a.x + rnd(-8, 8), a.y - 4 + rnd(-8, 4), { color: pickc(["#ffe66b", "#fff"]), dx: rnd(-6, 6), dy: rnd(-10, 2), dur: 350 }), ms(i * 50));
        dark.style.opacity = ".55";
        const cw = Math.round(DW * dk * 0.9), storm = stormSprite(cw);
        storm.className = "abs"; storm.style.left = `${Math.round(dcx - cw / 2)}px`; storm.style.top = `${Math.max(2, dY - 14)}px`; storm.style.zIndex = 14;
        layer.appendChild(storm);
        storm.animate([{ transform: "translateY(-30px) scale(.4)", opacity: 0 }, { transform: "translateY(0) scale(1)", opacity: 1 }], { duration: ms(450), easing: "ease-out", fill: "both" });
        await wait(700);
        const bolt = document.createElement("canvas");
        bolt.width = LW; bolt.height = LH; bolt.className = "abs"; bolt.style.cssText = `left:0;top:0;width:${LW}px;height:${LH}px;z-index:26`;
        fx.appendChild(bolt);
        const bc = bolt.getContext("2d");
        const strike = (big) => {
          bc.clearRect(0, 0, LW, LH);
          const x0 = dcx + rnd(-8, 8), y0 = parseFloat(storm.style.top) + 11, y1 = dcy + 6;
          const pts = [[x0, y0]];
          const segs = 7;
          for (let i = 1; i <= segs; i++) pts.push([Math.round(lerpv(x0, dcx, i / segs) + (i < segs ? rnd(-9, 9) : 0)), Math.round(lerpv(y0, y1, i / segs))]);
          const draw = (col, t) => { bc.fillStyle = col; for (let i = 0; i < pts.length - 1; i++) { const [xa, ya] = pts[i], [xb, yb] = pts[i + 1]; const n = Math.max(Math.abs(xb - xa), Math.abs(yb - ya)); for (let j = 0; j <= n; j++) bc.fillRect(Math.round(xa + ((xb - xa) * j) / n) - (t >> 1), Math.round(ya + ((yb - ya) * j) / n), t, 1); } };
          draw("#ffe66b", big ? 7 : 5); draw("#fff", big ? 3 : 2);
        };
        const lerpv = (a1, b1, f) => a1 + (b1 - a1) * f;
        for (let i = 0; i < 3; i++) {
          strike(i === 2);
          flash("#ffffff", 120, i === 2 ? 0.95 : 0.7); shake(4, 220); dragonHurt();
          drw.classList.remove("flashy"); void drw.offsetWidth; drw.classList.add("flashy");
          noise(0.25, "highpass", 1500, 6000, 0.5); sweep(2400, 120, 0.25, "sawtooth", 0.14); tone(80, 0.3, "square", 0.1);
          burst(d.x, d.y, 12, ["#fff", "#ffe66b", "#ffb300"], 22);
          floatNum(d.x + (i - 1) * 8, d.y - 14 - i * 3, "9", "#ffe66b");
          await wait(170);
          bc.clearRect(0, 0, LW, LH);
          await wait(120);
        }
        noise(1.2, "lowpass", 400, 80, 0.5, 0.1); // thunder
        h.wrap.classList.remove("cast");
        drw.classList.remove("flashy");
        storm.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms(400), fill: "both" });
        dark.style.opacity = "0";
        await wait(500);
        bolt.remove(); storm.remove();
      }

      // Attack 4: D summons a giant sword from the sky. (The finale slices the dragon in half.)
      async function swordAtk(h) {
        const a = { x: h.x, y: h.y };
        // a glowing rune circle and a pillar of light at D's feet
        const cw = 34, circ = circleSprite(cw);
        circ.className = "abs"; circ.style.left = `${a.x - cw / 2}px`; circ.style.top = `${a.y - 10}px`; circ.style.zIndex = 5;
        layer.appendChild(circ);
        circ.animate([{ transform: "scale(.2)", opacity: 0 }, { transform: "scale(1)", opacity: 1 }], { duration: ms(400), fill: "both" });
        const pillar = document.createElement("div");
        pillar.className = "dq-p";
        pillar.style.cssText = `left:${a.x - 5}px;top:0;width:10px;height:${a.y - 4}px;z-index:4;background:linear-gradient(180deg,rgba(255,240,150,0),rgba(255,240,150,.85));image-rendering:pixelated`;
        fx.appendChild(pillar);
        pillar.animate([{ opacity: 0, transform: "scaleX(0)" }, { opacity: 1, transform: "scaleX(1)" }], { duration: ms(350), fill: "both" });
        [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.25, "triangle", 0.07, i * 0.12));
        sweep(200, 900, 0.7, "sine", 0.08);
        for (let i = 0; i < 14; i++) ctx.later(() => spark(a.x + rnd(-14, 14), a.y - 2, { color: pickc(["#fff7c2", "#ffe066", "#fff"]), dx: rnd(-4, 4), dy: rnd(-40, -16), dur: 700 }), ms(i * 60));
        await wait(700);
        // the giant sword appears above the dragon, glowing
        const sk = Math.max(1.4, Math.min(2, (dY + 10) / 62));
        const sw = swordSprite();
        sw.className = "abs"; sw.style.zIndex = 28; sw.style.transformOrigin = "50% 0";
        sw.style.left = `${Math.round(dcx - 7.5)}px`; sw.style.top = `${Math.round(-70 * sk)}px`;
        sw.style.filter = "drop-shadow(0 0 3px #fff7a0) drop-shadow(0 0 6px #7ff)";
        layer.appendChild(sw);
        const restY = Math.round(2 - 6 * sk);
        sw.animate([{ transform: `translateY(0) scale(${sk}) rotate(0deg)` }, { transform: `translateY(${restY + 70 * sk}px) scale(${sk}) rotate(0deg)` }], { duration: ms(500), easing: "cubic-bezier(.2,1.3,.4,1)", fill: "both" });
        tone(880, 0.3, "triangle", 0.07); sweep(300, 1500, 0.5, "triangle", 0.07);
        await wait(520);
        // it trembles, charging
        sw.animate([{ transform: `translateY(${restY + 70 * sk}px) scale(${sk})` }, { transform: `translateY(${restY + 70 * sk - 4}px) scale(${sk * 1.06})` }, { transform: `translateY(${restY + 70 * sk}px) scale(${sk})` }],
          { duration: ms(200), iterations: 3, fill: "both" });
        for (let i = 0; i < 12; i++) ctx.later(() => spark(dcx + rnd(-10, 10), restY + 40 + rnd(0, 50) * sk, { color: pickc(["#fff", "#9ff", "#ffe66b"]), dx: rnd(-5, 5), dy: rnd(-10, 4), dur: 400 }), ms(i * 50));
        await wait(600);
        h._sw = { el: sw, sk, rest: restY + 70 * sk };
        h.wrap.classList.remove("cast");
        circ.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms(500), fill: "both" });
        pillar.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms(400), fill: "both" });
        ctx.later(() => { circ.remove(); pillar.remove(); }, ms(600));
      }
      const ATTACKS = { fire: fireAtk, ice: iceAtk, lightning: boltAtk, sword: swordAtk };

      // ---------- The finale: SLASH! Then the fanfare and the party celebrates ----------
      async function finale() {
        const h = heroes[GOAL - 1];
        const sw = h._sw, sk = sw.sk;
        // plunge
        tone(1800, 0.2, "sawtooth", 0.08); sweep(2400, 200, 0.25, "sawtooth", 0.14);
        sw.el.animate([{ transform: `translateY(${sw.rest}px) scale(${sk})` }, { transform: `translateY(${sw.rest + 6}px) scale(${sk})`, offset: 0.2 }, { transform: `translateY(${dY + DH * dk * 0.95 - 62 * sk + 70 * sk}px) scale(${sk})` }],
          { duration: ms(260), easing: "cubic-bezier(.6,0,1,.6)", fill: "both" });
        await wait(270);
        // the cut
        flash("#fff", 400, 1); shake(5, 600);
        noise(0.5, "highpass", 1200, 8000, 0.7); tone(200, 0.4, "sawtooth", 0.14); sweep(900, 80, 0.5, "square", 0.12);
        const line = document.createElement("div");
        line.className = "dq-p";
        line.style.cssText = `left:${Math.round(dcx - 1)}px;top:${dY - 6}px;width:2px;height:${Math.round(DH * dk + 12)}px;background:#fff;box-shadow:0 0 0 1px #ffe66b, 0 0 5px 2px #fff;z-index:33`;
        fx.appendChild(line);
        line.animate([{ transform: "scaleY(0)", transformOrigin: "50% 0" }, { transform: "scaleY(1)" }], { duration: ms(120), fill: "both" });
        const sl = banner(TEXT.slash, Math.round(dY + DH * dk * 0.3), "");
        ctx.later(() => sl.remove(), ms(900));
        burst(dcx, dcy, 26, ["#fff", "#ffe66b", "#9ff"], 34);
        await wait(160);
        // two halves slide apart
        drw.style.visibility = "hidden";
        const half = (right) => {
          const w = document.createElement("div");
          w.className = "dq-drw";
          w.style.cssText = `left:${dX}px;top:${dY}px;transform:scale(${dk});z-index:20;clip-path:inset(0 ${right ? 0 : 50}% 0 ${right ? 50 : 0}%)`;
          const d2 = dragonEl();
          d2.classList.add("dead");
          w.appendChild(d2);
          layer.appendChild(w);
          return w;
        };
        const hl = half(false), hr = half(true);
        // (the halves are the dragon's own left and right sides, each sliding and tipping away from the cut)
        hl.animate([{ translate: "0 0", rotate: "0deg" }, { translate: `${-10 * dk}px ${4 * dk}px`, rotate: "-10deg" }], { duration: ms(700), easing: "cubic-bezier(.2,.8,.3,1)", fill: "both" });
        hr.animate([{ translate: "0 0", rotate: "0deg" }, { translate: `${10 * dk}px ${4 * dk}px`, rotate: "10deg" }], { duration: ms(700), easing: "cubic-bezier(.2,.8,.3,1)", fill: "both" });
        sw.el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms(600), delay: ms(300), fill: "both" });
        line.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms(300), delay: ms(150), fill: "both" });
        floatNum(dcx, dY - 4, "999", "#ffe66b");
        bub.classList.add("hide");
        setSeg(dseg, 0, GOAL);
        await wait(900);
        // the dragon pops into stars
        if (window.Music) { Music.play(null); Music.fanfare(); }
        noise(0.5, "lowpass", 2500, 200, 0.5); tone(260, 0.2, "square", 0.1);
        hl.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms(500), fill: "both" });
        hr.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms(500), fill: "both" });
        for (let i = 0; i < 26; i++) spark(dcx + rnd(-24, 24) * dk, dcy + rnd(-20, 16) * dk, { color: pickc(["#fff", "#ffe66b", "#ffb3d9", "#b08cff"]), size: pickc([2, 3, 4]), dx: rnd(-20, 20), dy: rnd(-34, -8), dur: rnd(600, 1100), end: 0.1 });
        // everybody cheers
        setMsg(TEXT.victoryMsg);
        heroes.forEach((x, i) => ctx.later(() => { x.wrap.classList.remove("cast"); x.wrap.classList.add("cheer"); tone(660 + i * 130, 0.1, "square", 0.05); }, ms(150 + i * 130)));
        const vb = banner(TEXT.victory, Math.round(LH * (wide ? 0.1 : 0.24)), "");
        ctx.say(C.answer);
        for (let i = 0; i < 50; i++) {
          spark(rnd(0, LW), -6, { color: pickc(["#e8173c", "#ff8a00", "#ffd23f", "#3fb54a", "#4cc9f0", "#c04dd9", "#fff"]), size: pickc([2, 3, 3, 4]), dx: rnd(-14, 14), dy: LH + 12, dur: rnd(1500, 2600), delay: rnd(0, 1100), end: 1, fade: false, ease: "linear" });
        }
        await wait(2300);
        done = true;
        ctx.win();
      }

      // ---------- A WRONG answer: the dragon breathes fire on everyone ----------
      async function wrong(o) {
        misses++;
        o.btn.classList.add("bad"); o.btn.disabled = true;
        ctx.pauseTimer(ms(3400));
        await wait(200);
        // breathe in…
        dr.classList.add("puff", "keepopen");
        tone(160, 0.5, "sawtooth", 0.07); sweep(120, 420, 0.5, "sawtooth", 0.09);
        await wait(520);
        dr.classList.add("open");
        // …and out
        const targets = heroes.map((x) => ({ x: x.x, y: x.y - x.s.h * x.k * 0.5 }));
        const cx = targets.reduce((m, t) => m + t.x, 0) / targets.length, cy = targets.reduce((m, t) => m + t.y, 0) / targets.length;
        noise(1.1, "bandpass", 500, 1800, 0.45); tone(70, 1, "sawtooth", 0.14); sweep(300, 90, 0.9, "sawtooth", 0.1);
        shake(2, 900);
        const reach = Math.hypot(cx - mouth.x, cy - mouth.y);
        for (let i = 0; i < 120; i++) {
          const t = pickc(targets);
          ctx.later(() => {
            if (gone) return;
            spark(mouth.x + rnd(-4, 4), mouth.y + rnd(-2, 3), { color: pickc(["#fff2a0", "#ffd400", "#ff7a00", "#e8173c"]), size: pickc([4, 5, 6, 8]), dx: t.x - mouth.x + rnd(-8, 8), dy: t.y - mouth.y + rnd(-6, 6), dur: rnd(350, 600), end: 1.6, ease: "ease-in" });
          }, ms(i * 7));
        }
        await wait(380);
        heroes.forEach((x, i) => {
          x.wrap.classList.add("burn");
          const t = targets[i];
          burst(t.x, t.y, 10, ["#ffd400", "#ff7a00", "#e8173c"], 14);
          floatNum(x.x, x.y - x.s.h * x.k - 4, "-33", "#ff8a8a");
          setSeg(x.seg, MISSES - misses, MISSES);
        });
        flash("#ff7a00", 300, 0.5);
        await wait(550);
        dr.classList.remove("puff", "keepopen", "open");
        heroes.forEach((x) => x.wrap.classList.remove("burn"));
        if (misses >= MISSES) { await defeat(); return; }
        // the dragon cackles, then asks again
        dr.classList.add("laugh");
        [0, 0.15, 0.3].forEach((t) => { tone(300, 0.1, "square", 0.06, t); tone(240, 0.1, "square", 0.05, t + 0.07); });
        await wait(550);
        dr.classList.remove("laugh");
        if (gone) return;
        opts.forEach((x) => { if (!x.btn.disabled) x.btn.classList.remove("cur"); });
        dragonSay(500);
        ctx.say(C.prompt);
        busy = false;
      }

      // ---------- Three wrong answers: the party falls and the dragon celebrates ----------
      async function defeat() {
        ctx.freezeTimer();
        if (window.Music) { Music.play(null); Music.defeat(); }
        heroes.forEach((x, i) => ctx.later(() => { x.wrap.classList.add("ko"); noise(0.15, "lowpass", 600, 100, 0.3); }, ms(i * 140)));
        setMsg(TEXT.defeatMsg);
        bub.classList.add("hide");
        await wait(900);
        dr.classList.add("laugh", "open");
        const hb = banner(TEXT.haha, Math.round(Math.max(4, dY - 8)), "bad sm");
        [0, 0.2, 0.4, 0.6, 0.8].forEach((t) => { tone(330, 0.12, "square", 0.07, t); tone(262, 0.12, "square", 0.06, t + 0.1); });
        for (let i = 0; i < 6; i++) ctx.later(() => spark(mouth.x + rnd(-10, 10), mouth.y - 4, { color: "#ffe66b", size: 3, dx: rnd(-14, 14), dy: rnd(-20, -6), dur: 600 }), ms(i * 150));
        // show what it should have been
        opts.forEach((x) => { x.btn.classList.remove("cur", "bad"); x.btn.classList.add(x.opt && x.opt.right ? "good" : "dim"); });
        ctx.say(C.answer);
        await wait(2200);
        done = true;
        ctx.lose();
        void hb;
      }

      // ---------- The intro: battle wipe, the party hops in, the dragon lands with a ROAR ----------
      async function intro() {
        const wipe = document.createElement("div");
        wipe.className = "dq-wipe";
        wipe.style.gridTemplateColumns = "repeat(10, 1fr)";
        for (let i = 0; i < 120; i++) { const c = document.createElement("i"); c.style.animationDelay = `${(Math.random() * 0.6 * T).toFixed(2)}s`; wipe.appendChild(c); }
        world.appendChild(wipe);
        ctx.later(() => wipe.remove(), ms(1300));
        heroes.forEach((h, i) => {
          h.wrap.style.visibility = "hidden";
          h.hp.style.visibility = "hidden";
          ctx.later(() => {
            h.wrap.style.visibility = "";
            h.hp.style.visibility = "";
            h.wrap.animate(wide ? [{ translate: "60px 0", opacity: 0 }, { translate: "0 -6px", opacity: 1, offset: 0.7 }, { translate: "0 0", opacity: 1 }]
              : [{ translate: `0 40px`, opacity: 0 }, { translate: "0 -8px", opacity: 1, offset: 0.7 }, { translate: "0 0", opacity: 1 }], { duration: ms(380), easing: "ease-out" });
            tone(500 + i * 120, 0.08, "square", 0.05); tone(750 + i * 180, 0.08, "square", 0.04, 0.08);
          }, ms(500 + i * 190));
        });
        dhp.style.visibility = "hidden";
        drw.style.visibility = "hidden";
        setMsg("");
        await wait(1300);
        // the dragon drops in
        setMsg(TEXT.appears);
        drw.style.visibility = "";
        dhp.style.visibility = "";
        drw.animate([{ translate: `0 ${-(dY + DH * dk + 20)}px` }, { translate: "0 0" }], { duration: ms(450), easing: "cubic-bezier(.6,0,1,.7)", fill: "both" });
        sweep(800, 120, 0.45, "sawtooth", 0.09);
        await wait(450);
        shake(5, 500); noise(0.5, "lowpass", 1500, 100, 0.6); tone(70, 0.4, "square", 0.14);
        const gy = Math.round(dY + DH * dk - 2);
        for (let i = 0; i < 16; i++) spark(dcx + rnd(-30, 30) * dk, gy, { color: pickc(["#d8c7a0", "#b8a37a", "#fff"]), size: pickc([2, 3, 4]), dx: (i < 8 ? -1 : 1) * rnd(8, 26), dy: rnd(-8, -1), dur: 600 });
        await wait(250);
        // ROAR
        dr.classList.add("open", "puff");
        sweep(220, 70, 0.9, "sawtooth", 0.13); sweep(210, 60, 0.9, "square", 0.08); noise(0.9, "bandpass", 300, 1200, 0.3);
        shake(2, 700);
        await wait(750);
        dr.classList.remove("open", "puff");
        const fb = banner(TEXT.fight, Math.round(LH * (wide ? 0.22 : 0.3)), "");
        tone(784, 0.1, "square", 0.08); tone(1047, 0.2, "square", 0.08, 0.1);
        await wait(550);
        fb.remove();
        introDone = true;
        ask(true);
        busy = false;
      }

      // ---------- Timeout: show the right answer ----------
      ctx.onTimeout(() => {
        done = true;
        opts.forEach((x) => { x.btn.classList.add(x.opt && x.opt.right ? "good" : "dim"); });
        dr.classList.add("laugh");
        ctx.say(C.answer);
      });

      function onKey(e) {
        const i = parseInt(e.key, 10) - 1;
        if (i >= 0 && i < N) { e.preventDefault(); choose(opts[i]); }
        else if (e.key === " ") { e.preventDefault(); replay(); }
      }
      document.addEventListener("keydown", onKey);

      layout();
      const ro = new ResizeObserver(() => { if (!introDone && !gone) { /* positions only */ } layout(); });
      ro.observe(stage);
      setSeg(dseg, GOAL, GOAL);
      heroes.forEach((x) => setSeg(x.seg, MISSES, MISSES));
      showRow(false);
      ctx.pauseTimer(ms(3600));
      intro();

      // Tutorial: watch the dragon ask, then answer four times (the party attacks each time).
      ctx.tutorial(S.map((x) => x.target), async (f) => {
        await f.until(() => introDone, 12000);
        await f.point(bub, 1000);
        for (let n = 0; n < GOAL && !done; n++) {
          await f.until(() => !busy || done, 15000);
          if (done) break;
          await f.tap(() => (opts.find((o) => o.opt && o.opt.right && !o.btn.disabled) || opts[0]).btn);
          await f.wait(300);
        }
        await f.until(() => done, 20000);
      });

      return () => { gone = true; done = true; ro.disconnect(); document.removeEventListener("keydown", onKey); };
    },
  });
})();
