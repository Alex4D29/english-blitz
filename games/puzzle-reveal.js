// PUZZLE REVEAL — something is hidden under a 3×3 jigsaw. The pieces lift off one at a time, and the
// player taps the matching answer below as soon as they can tell what it is.
//
// Letter list: a big letter is hidden, the answers are letters (look-alikes first: b/d, M/N).
// Phonics: a picture is hidden, the answers are letters ("which letter does it start with?").
// CVC: a picture is hidden, the answers are words (look-alikes: cat, cot, cut).
// HFW: a word is hidden, the answers are words.
// Nothing is spoken until the end (speech would give it away); then the voice says the answer.
// The answers are locked (greyed) for the first 1–1.5 s, so a quick tap before anything shows can't
// count; taps on them then just wobble. The pieces come off on a schedule fitted to the real time
// limit, and the last one never comes off, so there's always a bit left hidden when time runs out.
// Right: the rest of the pieces fly off, confetti. Wrong: the pieces fly off and the right answer glows.
// Faster speeds give less time (so faster reveals) and, from 1.5×, 4 answers instead of 3.
(function () {
  const TEXT = {
    name: { en: "Puzzle Reveal" },
    icon: "🧩",
    howTo: (list) => {
      const pick = {
        letter: "Which letter is hiding? Tap it!",
        phonics: "What's the picture? Tap the letter it starts with!",
        cvc: "What's the picture? Tap its word!",
        hfw: "Which word is hiding? Tap it!",
      }[list.type] || "Tap the answer!";
      return { en: {
        steps: [
          ["🧩", "Something is hiding under the puzzle."],
          ["👀", "Watch. The pieces come off one by one."],
          ["👆", pick],
        ],
        tips: [
          "The answers wake up after a moment, so watch first!",
          "You only get one try. If it's wrong, the puzzle opens and the right answer glows.",
          "When the game speeds up, the pieces come off faster.",
        ],
      } };
    },
    instruction: { en: "WHAT'S\nHIDING?" },
    answer: (letter, word) => `${letter} for ${word}`,
    optLabel: (s) => `Answer ${s}`,
  };

  const PIECE_COLORS = ["#ff2e88", "#1e6bff", "#ffb800", "#00b86b", "#8a2be2", "#ff6a00", "#00a3d9", "#e8173c", "#7ac943"];
  const G = 3;          // grid size
  const CELL = 100;     // piece size in SVG units
  const SVG_NS = "http://www.w3.org/2000/svg";

  const CSS = `
  .pr { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:14px; padding-bottom:10px; }
  .pr-stage { position:relative; flex:1; min-height:0; width:100%; display:flex; align-items:center; justify-content:center; container-type:size; }
  .pr-board { --bs:min(80vw, 46vh); position:relative; width:var(--bs); height:var(--bs); }
  @supports (width:1cqw) { .pr-board { --bs:min(88cqw, 94cqh); } }
  .pr-hidden { position:absolute; inset:0; background:#fff; border:6px solid #111; border-radius:14px; box-shadow:0 8px 0 #111;
    display:flex; align-items:center; justify-content:center; overflow:hidden; color:#111; line-height:1; white-space:nowrap; }
  .pr-hidden.letter { font-size:calc(var(--bs) * .74); }
  .pr-hidden.pic { font-size:calc(var(--bs) * .62); }
  .pr-hidden.win { box-shadow:0 0 0 8px #00b86b, 0 8px 0 #111; }
  .pr-piece { position:absolute; inset:0; width:100%; height:100%; overflow:visible; pointer-events:none;
    transform-box:fill-box; filter:drop-shadow(0 4px 0 rgba(0,0,0,.25)); }
  .pr-piece path { stroke:#111; stroke-width:4; stroke-linejoin:round; vector-effect:non-scaling-stroke; }
  .pr-piece text { font-size:34px; font-weight:900; fill:rgba(255,255,255,.55); text-anchor:middle; dominant-baseline:central; }
  .pr-piece.off { animation:pr-off .65s cubic-bezier(.4,0,.8,.6) forwards; }
  .pr-fx { position:absolute; inset:0; pointer-events:none; overflow:visible; }

  .pr-opts { flex:none; display:flex; gap:12px; justify-content:center; width:100%; padding:0 12px; }
  .pr-opt { flex:0 1 calc((100% - 36px) / var(--n)); max-width:150px; min-height:clamp(78px, 13dvh, 110px); border-radius:18px; font:inherit;
    font-size:clamp(2.2rem, 11vw, 3.4rem); line-height:1; background:#fff; color:var(--c); border:5px solid #111; box-shadow:0 7px 0 #111;
    display:flex; align-items:center; justify-content:center; padding:0 4px; touch-action:manipulation; cursor:pointer; white-space:nowrap;
    transition:filter .2s, opacity .2s; }
  .pr-opt.word { color:#111; }
  .pr-opt.locked { filter:grayscale(1); opacity:.45; cursor:default; }
  .pr-opt.nope { animation:pr-nope .3s ease-in-out; }
  .pr-opt.wake { animation:pr-wake .35s cubic-bezier(.2,1.8,.4,1); }
  .pr-opt:not(.locked):active { transform:translateY(5px); box-shadow:0 2px 0 #111; }
  .pr-opt.right { background:#b8ffcf; box-shadow:0 0 0 6px #00b86b, 0 7px 0 #111; animation:pr-wiggle .4s ease-in-out 3; }
  .pr-opt.wrong { background:#ffc2c2; animation:pr-nope .35s ease-in-out 2; }
  .pr-opt.dim { opacity:.4; }

  @keyframes pr-off { 0% { transform:none; } 25% { transform:translate(0, -6%) scale(1.08) rotate(var(--r1)); opacity:1; }
    100% { transform:translate(var(--tx), var(--ty)) rotate(var(--r2)) scale(.7); opacity:0; } }
  @keyframes pr-nope { 25% { transform:translateX(-8px); } 75% { transform:translateX(8px); } }
  @keyframes pr-wake { from { transform:scale(.85); } }
  @keyframes pr-wiggle { 25% { transform:rotate(-6deg) scale(1.06); } 75% { transform:rotate(6deg) scale(1.06); } }
  @media (prefers-reduced-motion: reduce) {
    .pr-piece.off { animation:pr-fade .3s forwards; }
    .pr-opt.nope, .pr-opt.wake, .pr-opt.right, .pr-opt.wrong { animation:none; }
    @keyframes pr-fade { to { opacity:0; } }
  }`;

  function injectCss() {
    if (document.getElementById("pr-css")) return;
    const style = document.createElement("style");
    style.id = "pr-css";
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  // One jigsaw edge from (x0, y0) to (x1, y1). h > 0 bulges to the left of the direction of travel
  // (screen coordinates), h < 0 to the right, 0 is straight. Returns path commands without the M.
  function edge(x0, y0, x1, y1, h) {
    if (!h) return `L${x1} ${y1}`;
    const dx = x1 - x0, dy = y1 - y0, nx = -dy, ny = dx;
    const p = (t, k) => `${(x0 + dx * t + nx * k * h).toFixed(1)} ${(y0 + dy * t + ny * k * h).toFixed(1)}`;
    return `L${p(0.36, 0)} C${p(0.42, 0.05)} ${p(0.3, 1)} ${p(0.5, 1)} C${p(0.7, 1)} ${p(0.58, 0.05)} ${p(0.64, 0)} L${x1} ${y1}`;
  }

  // Every piece's outline. hz[r][c]: the edge under row r (1 = bulges down), vt[r][c]: the edge right of col c (1 = bulges right).
  function piecePaths() {
    const sgn = () => (Math.random() < 0.5 ? 1 : -1);
    const hz = [...Array(G - 1)].map(() => [...Array(G)].map(sgn));
    const vt = [...Array(G)].map(() => [...Array(G - 1)].map(sgn));
    const T = 0.22; // tab height, in cells
    const out = [];
    for (let r = 0; r < G; r++) {
      for (let c = 0; c < G; c++) {
        const x = c * CELL, y = r * CELL, s = CELL;
        // Normals (left of travel, in screen coords) for a clockwise walk: top → down, right → left,
        // bottom → up, left → right. So "bulges down/right" maps to these signs:
        const top = r > 0 ? hz[r - 1][c] * T : 0;          // travel → : left-normal points down
        const right = c < G - 1 ? -vt[r][c] * T : 0;       // travel ↓ : left-normal points left
        const bottom = r < G - 1 ? -hz[r][c] * T : 0;      // travel ← : left-normal points up
        const left = c > 0 ? vt[r][c - 1] * T : 0;         // travel ↑ : left-normal points right
        const d = `M${x} ${y} ` + edge(x, y, x + s, y, top) + " " + edge(x + s, y, x + s, y + s, right) + " " +
          edge(x + s, y + s, x, y + s, bottom) + " " + edge(x, y + s, x, y, left) + " Z";
        out.push({ d, cx: x + s / 2, cy: y + s / 2 });
      }
    }
    return out;
  }

  registerMicrogame({
    id: "puzzle-reveal",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 9000,
    input: "tap",

    start(ctx) {
      injectCss();
      const type = ctx.list.type;
      const speed = ctx.speed || 1;
      const n = speed >= 1.5 ? 4 : 3;
      const letterName = (it) => it.say || it.text.toUpperCase();
      const { tone, sweep, noise } = ctx.sfx;

      // ---------- Content ----------
      // hidden: what's under the puzzle; opts: [{ text, right, spoken }]
      let hidden, hiddenKind, answer, opts, optKind;
      if (type === "phonics") {
        const letter = ctx.items.find((it) => ctx.phonics.pics(it).length) || ctx.items[0];
        const pic = ctx.pick(ctx.phonics.pics(letter));
        hidden = pic.emoji; hiddenKind = "pic";
        answer = TEXT.answer(letterName(letter), pic.word);
        opts = ctx.pickOptions(letter, n).map((o) => ({ text: o.text.toUpperCase(), right: o === letter }));
        optKind = "letter";
      } else if (type === "cvc") {
        const target = ctx.items.find((it) => it.emoji) || ctx.items[0];
        hidden = target.emoji; hiddenKind = "pic";
        answer = target.say || target.text;
        opts = ctx.pickOptions(target, n).map((o) => ({ text: o.text, right: o === target }));
        optKind = "word";
      } else if (type === "hfw") {
        const target = ctx.items[0];
        hidden = target.text; hiddenKind = "word";
        answer = target.say || target.text;
        opts = ctx.pickOptions(target, n).map((o) => ({ text: o.text, right: o === target }));
        optKind = "word";
      } else {
        const target = ctx.items[0];
        hidden = target.text; hiddenKind = "letter";
        answer = target.word ? TEXT.answer(letterName(target), target.word) : letterName(target);
        opts = ctx.pickOptions(target, n).map((o) => ({ text: o.text, right: o === target }));
        optKind = "letter";
      }
      opts = ctx.shuffle(opts);

      // ---------- DOM ----------
      const wrap = document.createElement("div");
      wrap.className = "pr";
      const stage = document.createElement("div");
      stage.className = "pr-stage";
      const board = document.createElement("div");
      board.className = "pr-board";
      const hid = document.createElement("div");
      hid.className = "pr-hidden " + hiddenKind;
      hid.textContent = hidden;
      board.appendChild(hid);
      const fx = document.createElement("div");
      fx.className = "pr-fx";

      const paths = piecePaths();
      const pieces = paths.map((p, i) => {
        const svg = document.createElementNS(SVG_NS, "svg");
        svg.setAttribute("class", "pr-piece");
        svg.setAttribute("viewBox", `0 0 ${G * CELL} ${G * CELL}`);
        svg.innerHTML = `<path d="${p.d}" fill="${PIECE_COLORS[i % PIECE_COLORS.length]}"/><text x="${p.cx}" y="${p.cy}">?</text>`;
        // Where it flies: outward from the board's centre, with a spin.
        const ax = p.cx - (G * CELL) / 2, ay = p.cy - (G * CELL) / 2;
        const len = Math.hypot(ax, ay) || 1;
        const dirX = ax ? ax / len : Math.random() - 0.5, dirY = ay ? ay / len : -1;
        svg.style.setProperty("--tx", `${(dirX * 70).toFixed(0)}%`);
        svg.style.setProperty("--ty", `${(dirY * 70 - 30).toFixed(0)}%`);
        svg.style.setProperty("--r1", `${(Math.random() * 16 - 8).toFixed(0)}deg`);
        svg.style.setProperty("--r2", `${(Math.random() * 120 - 60).toFixed(0)}deg`);
        svg.style.transformOrigin = `${(p.cx / (G * CELL)) * 100}% ${(p.cy / (G * CELL)) * 100}%`;
        board.appendChild(svg);
        return { svg, off: false };
      });
      board.appendChild(fx);
      stage.appendChild(board);

      const row = document.createElement("div");
      row.className = "pr-opts";
      row.style.setProperty("--n", n);
      const COLORS = ["#e8173c", "#1e6bff", "#00a35a", "#8a2be2"];
      const buttons = opts.map((o, i) => {
        const b = document.createElement("button");
        b.className = "pr-opt locked" + (optKind === "word" ? " word" : "");
        b.textContent = o.text;
        b.style.setProperty("--c", COLORS[i % COLORS.length]);
        b.setAttribute("aria-label", TEXT.optLabel(o.text));
        b.setAttribute("aria-disabled", "true");
        b.prOpt = o;
        b.addEventListener("pointerdown", (e) => { e.preventDefault(); choose(b); });
        b.addEventListener("click", (e) => { if (e.detail === 0) choose(b); });
        row.appendChild(b);
        return b;
      });
      wrap.append(stage, row);
      ctx.root.appendChild(wrap);

      // Word sizes: the hidden word fills the board, answer words fit their buttons.
      function fit() {
        const bs = board.clientWidth;
        if (hiddenKind === "word") hid.style.fontSize = `${Math.min(bs * 0.5, (bs * 0.86) / (hidden.length * 0.6))}px`;
        if (optKind === "word") {
          const longest = Math.max(...opts.map((o) => o.text.length));
          buttons.forEach((b) => { b.style.fontSize = `${Math.min(48, (b.clientWidth - 14) / (longest * 0.62))}px`; });
        }
      }
      fit();
      const ro = new ResizeObserver(fit);
      ro.observe(wrap);

      // ---------- Timeline ----------
      let done = false, locked = true;
      const T = ctx.timeLimit;
      const lockMs = Math.max(1000, Math.min(1500, T * 0.35));
      const order = ctx.shuffle(pieces.slice());
      const removable = order.slice(0, pieces.length - 1); // the last piece always stays on
      const firstAt = 450, lastAt = T * 0.88;
      const gap = (lastAt - firstAt) / Math.max(1, removable.length - 1);
      removable.forEach((p, i) => ctx.later(() => { if (!done) liftOff(p, i); }, firstAt + gap * i));
      ctx.later(() => {
        if (done) return;
        locked = false;
        buttons.forEach((b) => { b.classList.remove("locked"); b.classList.add("wake"); b.removeAttribute("aria-disabled"); });
        tone(880, 0.08, "triangle", 0.12);
        tone(1320, 0.1, "triangle", 0.12, 0.08);
      }, lockMs);

      function liftOff(p, i) {
        if (p.off) return;
        p.off = true;
        p.svg.classList.add("off");
        if (i !== undefined) {
          sweep(500 + i * 40, 1100 + i * 60, 0.12, "sine", 0.1);
          noise(0.08, "bandpass", 2500, 4000, 0.15);
        }
      }
      function openAll() {
        pieces.filter((p) => !p.off).forEach((p, i) => ctx.later(() => liftOff(p), i * 45));
        noise(0.25, "highpass", 1500, 5000, 0.3);
      }

      // ---------- Choosing ----------
      function choose(b) {
        if (done || ctx.ended) return;
        if (locked) { // not yet: a little wobble so it's clear the tap was seen
          b.classList.remove("nope"); void b.offsetWidth; b.classList.add("nope");
          return;
        }
        done = true;
        buttons.forEach((x) => { x.disabled = true; });
        openAll();
        if (b.prOpt.right) {
          ctx.win();
          b.classList.add("right");
          hid.classList.add("win");
          buttons.forEach((x) => { if (x !== b) x.classList.add("dim"); });
          ctx.later(() => ctx.confetti(fx, board.clientWidth / 2, board.clientHeight / 2), 150);
          ctx.say(answer);
        } else {
          ctx.lose();
          b.classList.add("wrong");
          ctx.later(() => {
            buttons.forEach((x) => { if (x.prOpt.right) x.classList.add("right"); });
            ctx.say(answer);
          }, 450);
        }
      }

      ctx.onTimeout(() => {
        done = true;
        buttons.forEach((x) => { x.disabled = true; x.classList.remove("locked"); if (x.prOpt.right) x.classList.add("right"); else x.classList.add("dim"); });
        openAll();
        ctx.say(answer);
      });

      function onKey(e) {
        const i = parseInt(e.key, 10) - 1;
        if (i >= 0 && i < buttons.length) { e.preventDefault(); choose(buttons[i]); }
      }
      document.addEventListener("keydown", onKey);

      return function cleanup() {
        done = true;
        ro.disconnect();
        document.removeEventListener("keydown", onKey);
      };
    },
  });
})();
