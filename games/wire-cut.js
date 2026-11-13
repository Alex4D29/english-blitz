// WIRE CUT — a bomb is wired up with pairs that should match (A—a, B—b,
// 🐱—cat…). One pair is wrong (B—d). Cut that wire to defuse the bomb;
// cut a good wire and it blows up.
//
// Tap a tile or the wire itself to cut. Faster speeds add a 4th pair and
// cross the wires so they have to be traced (colors help).
(function () {
  const TEXT = {
    instruction: { en: "CUT THE\nWRONG WIRE!" },
    cutLabel: (a, b) => `Cut the wire from ${a} to ${b}`,
    bombLabel: "Bomb",
  };

  const WIRE_COLORS = ["#ff2e3b", "#1e6bff", "#1fd65f", "#b04dff", "#ff8a00"];
  const CONFETTI_COLORS = ["#ff2e88", "#1e6bff", "#ffd400", "#1fd65f", "#ff8a00", "#b04dff", "#00d4ff"];
  const SVG_NS = "http://www.w3.org/2000/svg";

  const CSS = `
  .wc [hidden] { display:none !important; }
  .wc { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:4px; }
  .wc-bomb { position:relative; font-size:clamp(2.6rem,13vw,4rem); line-height:1; flex:none;
    filter:drop-shadow(0 4px 0 #111); animation:wc-throb .5s ease-in-out infinite alternate; }
  .wc-spark { position:absolute; right:-.1em; top:-.3em; font-size:.5em; animation:wc-spark .12s steps(2) infinite; }
  .wc-board { position:relative; flex:1; min-height:0; width:100%; display:grid;
    grid-template-columns:auto 1fr auto; align-content:space-evenly; row-gap:8px;
    --wc-tile:clamp(64px,23vw,108px); container-type:size; }
  .wc-board.n4 { --wc-tile:clamp(56px,20vw,96px); }
  @supports (height:1cqh) {
    .wc-board    { --wc-tile:min(23vw,108px,26cqh); }
    .wc-board.n4 { --wc-tile:min(20vw,96px,21cqh); }
  }
  .wc-wires { position:absolute; inset:0; width:100%; height:100%; overflow:visible; z-index:0; }
  .wc-wires .hit { stroke:transparent; stroke-width:44; fill:none; pointer-events:stroke; cursor:pointer; }
  .wc-wires .half { transition:transform .35s cubic-bezier(.3,1.6,.5,1); transform-box:view-box; }
  .wc-tile { position:relative; z-index:1; width:var(--wc-tile); height:var(--wc-tile); padding:0; font:inherit; cursor:pointer;
    background:#fff; border:5px solid #111; border-radius:20px; box-shadow:0 7px 0 #111;
    font-size:calc(var(--wc-tile) * .62); line-height:1; display:flex; align-items:center; justify-content:center;
    touch-action:manipulation; transition:transform .08s, box-shadow .08s; }
  .wc-tile.word { font-size:calc(var(--wc-tile) * .36); }
  .wc-tile.ink { -webkit-text-stroke:2px #111; paint-order:stroke fill; }
  .wc-tile:active:not(:disabled) { transform:translateY(5px); box-shadow:0 2px 0 #111; }
  .wc-tile:disabled { cursor:default; }
  .wc-tile.bad  { background:#ff3b3b; color:#fff !important; animation:wc-pulse .3s ease-in-out 3; }
  .wc-tile.good { background:#1fd65f; color:#fff !important; animation:wc-pop .4s cubic-bezier(.2,1.8,.4,1); }
  .wc-snip { position:absolute; z-index:2; width:44px; height:44px; margin:-22px 0 0 -22px; pointer-events:none;
    display:flex; align-items:center; justify-content:center; font-size:24px; background:#fff;
    border:4px solid #111; border-radius:50%; box-shadow:0 3px 0 #111; animation:wc-wiggle .6s ease-in-out infinite; }
  .wc-fx { position:absolute; inset:0; pointer-events:none; overflow:visible; z-index:3; }
  .wc-confetti { position:absolute; width:12px; height:18px; border:2px solid #111; border-radius:3px; }
  .wc-flash { position:absolute; inset:-50vmax; background:radial-gradient(circle,#fff 0 20%,#ffd400 35%,#ff5a00 60%,transparent 75%);
    animation:wc-flash .6s ease-out forwards; }
  .wc.shake { animation:wc-shake .45s linear; }
  .wc.boom .wc-bomb { animation:wc-boom .5s cubic-bezier(.2,1.6,.4,1) forwards; }
  .wc.safe .wc-bomb { animation:wc-pop .5s cubic-bezier(.2,1.8,.4,1); }
  @keyframes wc-throb  { to { transform:scale(1.08) rotate(4deg); } }
  @keyframes wc-spark  { 50% { transform:scale(1.5) rotate(30deg); opacity:.6; } }
  @keyframes wc-wiggle { 50% { transform:rotate(-14deg) scale(1.1); } }
  @keyframes wc-pulse  { 50% { transform:scale(1.12); } }
  @keyframes wc-pop    { 40% { transform:scale(1.3) rotate(-6deg); } }
  @keyframes wc-boom   { to { transform:scale(4); } }
  @keyframes wc-flash  { from { opacity:1; transform:scale(.2); } to { opacity:0; transform:scale(1.4); } }
  @keyframes wc-shake  { 10%,50%,90% { transform:translate(-10px,6px); } 30%,70% { transform:translate(10px,-6px); } }
  @media (prefers-reduced-motion: reduce) {
    .wc-bomb, .wc-spark, .wc-snip, .wc.shake { animation:none; }
    .wc-wires .half { transition:none; }
  }`;

  function injectCss() {
    if (document.getElementById("wc-css")) return;
    const style = document.createElement("style");
    style.id = "wc-css";
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  const mid = (p, q, t) => ({ x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t });
  const cubic = (a, b, c, d) => `M${a.x},${a.y} C${b.x},${b.y} ${c.x},${c.y} ${d.x},${d.y}`;

  // What each side of a pair shows, and how the voice says it.
  function faces(item, type) {
    const spoken = item.say || item.text;
    if (type === "letter") return { left: item.text.toUpperCase(), right: item.text.toLowerCase(), spoken, word: false };
    // Word lists: picture on the left, word on the right (falls back to text when there's no emoji).
    return { left: item.emoji || item.text, right: item.text, spoken, word: !item.emoji };
  }

  // Build the pairs: one item gets a decoy on its right side, ideally one of its `tricky` look-alikes.
  function buildPairs(pool, count) {
    const byText = new Map(pool.map((it) => [it.text, it]));
    const odd = pick(pool);
    const trickies = (odd.tricky || []).map((t) => byText.get(t)).filter(Boolean);
    const decoy = trickies.length ? pick(trickies) : pick(pool.filter((it) => it !== odd));
    // Leave the decoy out of the other pairs so its real match isn't on screen too.
    const others = shuffle(pool.filter((it) => it !== odd && it !== decoy)).slice(0, count - 1);
    return shuffle([{ left: odd, right: decoy, odd: true }, ...others.map((it) => ({ left: it, right: it, odd: false }))]);
  }

  registerMicrogame({
    id: "wire-cut",
    instruction: TEXT.instruction,
    contentTypes: ["letter", "cvc", "hfw"],
    duration: 7000,

    start(ctx) {
      injectCss();
      const type = ctx.list.type;
      const speed = ctx.speed || 1;
      const count = Math.min(speed >= 1.5 ? 4 : 3, ctx.items.length - 1);
      const crossed = speed >= 1.25;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const timers = [];
      const later = (fn, ms) => timers.push(setTimeout(fn, ms));
      let done = false;

      const pairs = buildPairs(ctx.items, count);
      // Right-hand row for each pair. When crossed, make sure at least one wire actually crosses.
      let rows = pairs.map((_, i) => i);
      if (crossed) do shuffle(rows); while (rows.every((r, i) => r === i));

      // ---------- DOM ----------
      const wrap = document.createElement("div");
      wrap.className = "wc";
      const bomb = document.createElement("div");
      bomb.className = "wc-bomb";
      bomb.setAttribute("role", "img");
      bomb.setAttribute("aria-label", TEXT.bombLabel);
      bomb.innerHTML = '<span class="wc-face">💣</span><span class="wc-spark">✨</span>';
      const board = document.createElement("div");
      board.className = "wc-board" + (count >= 4 ? " n4" : "");
      board.style.gridTemplateRows = `repeat(${count}, auto)`;
      const svg = document.createElementNS(SVG_NS, "svg");
      svg.setAttribute("class", "wc-wires");
      const fx = document.createElement("div");
      fx.className = "wc-fx";
      board.appendChild(svg);
      wrap.append(bomb, board, fx);
      ctx.root.appendChild(wrap);

      const wires = pairs.map((pair, i) => {
        const color = WIRE_COLORS[i % WIRE_COLORS.length];
        const L = faces(pair.left, type);
        const R = faces(pair.right, type);
        const tile = (text, isWord, isEmoji, col, row) => {
          const b = document.createElement("button");
          b.className = "wc-tile" + (isWord ? " word" : "") + (isEmoji ? "" : " ink");
          b.textContent = text;
          b.style.color = color;
          b.style.borderColor = color;
          b.style.gridColumn = col;
          b.style.gridRow = row + 1;
          b.setAttribute("aria-label", TEXT.cutLabel(L.spoken, R.spoken));
          b.addEventListener("pointerdown", (e) => { e.preventDefault(); cut(wire); });
          b.addEventListener("click", () => cut(wire)); // keyboard / assistive fallback
          board.appendChild(b);
          return b;
        };
        const wire = {
          pair, color, cut: false, sayLeft: L.spoken, sayRight: R.spoken,
          leftEl: tile(L.left, type !== "letter" && L.word, type !== "letter" && !L.word, 1, i),
          rightEl: tile(R.right, type !== "letter", false, 3, rows[i]),
          sag: 14 + Math.random() * 16,
          g: document.createElementNS(SVG_NS, "g"),
          snip: null,
        };
        svg.appendChild(wire.g);
        if (!crossed) {
          wire.snip = document.createElement("div");
          wire.snip.className = "wc-snip";
          wire.snip.textContent = "✂️";
          board.appendChild(wire.snip);
        }
        return wire;
      });

      // ---------- Wires (redrawn whenever the board resizes) ----------
      function geometry(w) {
        const box = board.getBoundingClientRect();
        const a = w.leftEl.getBoundingClientRect();
        const b = w.rightEl.getBoundingClientRect();
        const p0 = { x: a.right - box.left - 4, y: a.top + a.height / 2 - box.top };
        const p3 = { x: b.left - box.left + 4, y: b.top + b.height / 2 - box.top };
        const dx = p3.x - p0.x;
        const p1 = { x: p0.x + dx * 0.35, y: p0.y + w.sag };
        const p2 = { x: p3.x - dx * 0.35, y: p3.y + w.sag };
        // Split the curve in half (de Casteljau) so a cut wire can fall apart in two pieces.
        const p01 = mid(p0, p1, 0.5), p12 = mid(p1, p2, 0.5), p23 = mid(p2, p3, 0.5);
        const p012 = mid(p01, p12, 0.5), p123 = mid(p12, p23, 0.5), m = mid(p012, p123, 0.5);
        return { p0, p3, m, halfA: cubic(p0, p01, p012, m), halfB: cubic(m, p123, p23, p3) };
      }

      function strokes(d, color) {
        return `<path d="${d}" fill="none" stroke="#111" stroke-width="15" stroke-linecap="round"/>` +
               `<path d="${d}" fill="none" stroke="${color}" stroke-width="9" stroke-linecap="round"/>`;
      }

      function drawWire(w, animateCut) {
        const g = geometry(w);
        const drop = (sign) => `rotate(${sign * 38}deg)`;
        w.g.innerHTML =
          `<g class="half a" style="transform-origin:${g.p0.x}px ${g.p0.y}px">${strokes(g.halfA, w.color)}</g>` +
          `<g class="half b" style="transform-origin:${g.p3.x}px ${g.p3.y}px">${strokes(g.halfB, w.color)}</g>` +
          (w.cut ? "" : `<path class="hit" d="${g.halfA} ${g.halfB.replace(/^M[^C]+/, "")}"/>`);
        const [ha, hb] = w.g.querySelectorAll(".half");
        if (w.cut) {
          const fall = () => { ha.style.transform = drop(1); hb.style.transform = drop(-1); };
          if (animateCut) { void ha.getBoundingClientRect(); requestAnimationFrame(fall); } else fall();
        } else {
          w.g.querySelector(".hit").addEventListener("pointerdown", (e) => { e.preventDefault(); cut(w); });
        }
        if (w.snip) {
          w.snip.style.left = g.m.x + "px";
          w.snip.style.top = g.m.y + "px";
          w.snip.hidden = done;
        }
        return g;
      }
      const drawAll = () => wires.forEach((w) => drawWire(w, false));
      const ro = new ResizeObserver(drawAll);
      ro.observe(board);

      // ---------- Cutting ----------
      function cut(w) {
        if (done || w.cut) return;
        done = true;
        w.cut = true;
        const g = drawWire(w, !reduceMotion);
        sparks(g.m);
        snipSound();
        wires.forEach((x) => {
          x.leftEl.disabled = x.rightEl.disabled = true;
          if (x.snip) x.snip.hidden = true;
        });
        bomb.querySelector(".wc-spark").hidden = true;
        ctx.say(`${w.sayLeft}... ${w.sayRight}`);

        if (w.pair.odd) {
          w.leftEl.classList.add("good");
          w.rightEl.classList.add("good");
          wrap.classList.add("safe");
          ctx.win();
          later(confetti, 120);
        } else {
          ctx.lose();
          // Show which pair was the wrong one, then boom.
          const odd = wires.find((x) => x.pair.odd);
          odd.leftEl.classList.add("bad");
          odd.rightEl.classList.add("bad");
          later(explode, 220);
        }
      }

      // ---------- Effects ----------
      function sparks(at) {
        if (reduceMotion) return;
        for (let i = 0; i < 8; i++) {
          const s = document.createElement("div");
          s.textContent = "✦";
          s.style.cssText = `position:absolute;left:${at.x}px;top:${at.y}px;font-size:18px;color:#fff;` +
                            `-webkit-text-stroke:1.5px #111;margin:-10px 0 0 -6px;`;
          board.appendChild(s);
          const ang = (i / 8) * Math.PI * 2;
          s.animate(
            [{ transform: "translate(0,0) scale(1)", opacity: 1 },
             { transform: `translate(${Math.cos(ang) * 40}px,${Math.sin(ang) * 40}px) scale(.3)`, opacity: 0 }],
            { duration: 350, easing: "ease-out", fill: "forwards" });
        }
      }

      function confetti() {
        const box = wrap.getBoundingClientRect();
        const ox = box.width / 2, oy = bomb.offsetHeight / 2;
        const n = reduceMotion ? 0 : 70;
        for (let i = 0; i < n; i++) {
          const c = document.createElement("div");
          c.className = "wc-confetti";
          c.style.left = ox + "px";
          c.style.top = oy + "px";
          c.style.background = pick(CONFETTI_COLORS);
          if (Math.random() < 0.3) c.style.borderRadius = "50%";
          fx.appendChild(c);
          const dx = (Math.random() - 0.5) * box.width * 1.3;
          const up = -(80 + Math.random() * 160);
          const fall = box.height * (0.6 + Math.random() * 0.6);
          const spin = (Math.random() - 0.5) * 1440;
          c.animate(
            [{ transform: "translate(0,0) rotate(0) scale(.4)" },
             { transform: `translate(${dx * 0.6}px,${up}px) rotate(${spin * 0.4}deg) scale(1)`, offset: 0.3 },
             { transform: `translate(${dx}px,${fall}px) rotate(${spin}deg) scale(1)` }],
            { duration: 1100 + Math.random() * 500, easing: "cubic-bezier(.2,.6,.4,1)", fill: "forwards" });
        }
        popSound();
      }

      function explode() {
        bomb.querySelector(".wc-face").textContent = "💥";
        wrap.classList.add("boom");
        boomSound();
        if (reduceMotion) return;
        wrap.classList.add("shake");
        const flash = document.createElement("div");
        flash.className = "wc-flash";
        fx.appendChild(flash);
        // Blow the good pairs away from the bomb; the wrong pair stays put so the player sees the answer.
        const box = wrap.getBoundingClientRect();
        const cx = box.left + box.width / 2, cy = box.top + bomb.offsetHeight / 2;
        wires.filter((w) => !w.pair.odd).forEach((w) => [w.leftEl, w.rightEl].forEach((el) => {
          const r = el.getBoundingClientRect();
          const vx = r.left + r.width / 2 - cx, vy = r.top + r.height / 2 - cy;
          const len = Math.hypot(vx, vy) || 1;
          const push = 160 + Math.random() * 120;
          el.animate(
            [{ transform: "none" },
             { transform: `translate(${(vx / len) * push}px,${(vy / len) * push}px) rotate(${(Math.random() - 0.5) * 120}deg)` }],
            { duration: 450, delay: 60, easing: "cubic-bezier(.1,.8,.3,1)", fill: "forwards" });
        }));
        wires.filter((w) => !w.pair.odd).forEach((w) =>
          w.g.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: "forwards" }));
      }

      // ---------- Sound effects (Web Audio; silent when there is no audio context) ----------
      const ac = ctx.audio;
      function noise(dur, filterType, from, to, vol, delay = 0) {
        if (!ac) return;
        try {
          const t = ac.currentTime + delay;
          const buf = ac.createBuffer(1, Math.ceil(ac.sampleRate * dur), ac.sampleRate);
          const data = buf.getChannelData(0);
          for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
          const src = ac.createBufferSource();
          src.buffer = buf;
          const f = ac.createBiquadFilter();
          f.type = filterType;
          f.frequency.setValueAtTime(from, t);
          f.frequency.exponentialRampToValueAtTime(to, t + dur);
          const g = ac.createGain();
          g.gain.setValueAtTime(vol, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + dur);
          src.connect(f).connect(g).connect(ac.destination);
          src.start(t);
        } catch (err) {
          console.error("wire-cut sound:", err);
        }
      }
      function sweep(from, to, dur, type, vol) {
        if (!ac) return;
        try {
          const t = ac.currentTime;
          const o = ac.createOscillator();
          const g = ac.createGain();
          o.type = type;
          o.frequency.setValueAtTime(from, t);
          o.frequency.exponentialRampToValueAtTime(to, t + dur);
          g.gain.setValueAtTime(vol, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + dur);
          o.connect(g).connect(ac.destination);
          o.start(t);
          o.stop(t + dur + 0.02);
        } catch (err) {
          console.error("wire-cut sound:", err);
        }
      }
      const snipSound = () => { noise(0.05, "highpass", 3000, 6000, 0.5); noise(0.05, "highpass", 2500, 5000, 0.4, 0.07); };
      const popSound = () => { [0, 0.06, 0.13].forEach((d) => noise(0.08, "bandpass", 1800, 600, 0.35, d)); };
      const boomSound = () => { noise(0.9, "lowpass", 1500, 60, 0.9); sweep(120, 35, 0.7, "sine", 0.6); };

      return function cleanup() {
        done = true;
        timers.forEach(clearTimeout);
        ro.disconnect();
      };
    },
  });
})();
