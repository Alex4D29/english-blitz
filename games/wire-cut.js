// WIRE CUT — a bomb is wired up with pairs. Only ONE pair matches (A—a, 🐱—cat);
// every other pair is wrong (B—d, 🐶—cot), with look-alikes first. Cut the
// matching wire to defuse the bomb; cut a wrong one and it blows up.
// (Playtesting: kids spot a matching pair and go for it, so that's the answer.)
//
// Phonics list: letter—picture pairs. The match is B—⚽; the wrong pairs get pictures
// from other letters (C—🦆), never from a letter that's on the board.
// Tap a tile or the wire itself to cut. Faster speeds add a 4th pair and
// cross the wires so they have to be traced (colors help).
(function () {
  const TEXT = {
    name: { en: "Wire Cut" },
    icon: "💣",
    // Practice mode's "How to play" card: steps (icon + sentence) and tips.
    howTo: (list) => ({ en: {
      steps: [
        ["🔗", "Each wire joins two things. Only ONE wire joins two things that match!"],
        ["🔍", list.type === "letter" ? "Find the match, like A and a."
          : list.type === "phonics" ? "Find the letter joined to a picture that starts with it, like B and ⚽ ball."
          : list.type === "hfw" ? "Find the big word joined to the same small word, like THE and the."
          : "Find the picture joined to its word, like 🐱 and cat."],
        ["✂️", "Tap that wire, or either end of it, to cut it."],
      ],
      tips: [
        "Cut a wire that doesn't match and the bomb goes BOOM! Then the match lights up green.",
        "Follow the colors to see which ends go together.",
        "When the game speeds up, the wires cross and there are more of them.",
      ],
    } }),
    instruction: { en: "CUT THE\nMATCH!" },
    cutLabel: (a, b) => `Cut the wire from ${a} to ${b}`,
    bombLabel: "Bomb",
  };

  const MAX_WORD = 5; // longest word that stays readable on a tile
  const WIRE_COLORS =["#ff2e3b", "#1e6bff", "#1fd65f", "#b04dff", "#ff8a00"];
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
  .wc-tile.answer { background:#1fd65f; color:#fff !important; animation:wc-pulse .3s ease-in-out 4; }
  .wc-tile.good { background:#1fd65f; color:#fff !important; animation:wc-pop .4s cubic-bezier(.2,1.8,.4,1); }
  .wc-snip { position:absolute; z-index:2; width:44px; height:44px; margin:-22px 0 0 -22px; pointer-events:none;
    display:flex; align-items:center; justify-content:center; font-size:24px; background:#fff;
    border:4px solid #111; border-radius:50%; box-shadow:0 3px 0 #111; animation:wc-wiggle .6s ease-in-out infinite; }
  .wc-fx { position:absolute; inset:0; pointer-events:none; overflow:visible; z-index:3; }
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

  const mid = (p, q, t) => ({ x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t });
  const cubic = (a, b, c, d) => `M${a.x},${a.y} C${b.x},${b.y} ${c.x},${c.y} ${d.x},${d.y}`;

  // What each side of a pair shows, and how the voice says it.
  // Letters: A—a. Words with pictures: 🐱—cat. Words without (sight words): THE—the.
  // `pics` is decided once per round, so a board never mixes pictures and capitals.
  function faces(item, type, pics) {
    const spoken = item.say || item.text;
    const word = type !== "letter";
    if (pics) return { left: item.emoji, right: item.text, spoken, word, pic: true };
    return { left: item.text.toUpperCase(), right: item.text.toLowerCase(), spoken, word, pic: false };
  }

  // Shrink a word until it fits its tile. Call after layout: a tile without a size yet is left alone.
  function fitWord(el) {
    if (!el.clientWidth) return;
    el.style.fontSize = "";
    const range = document.createRange();
    range.selectNodeContents(el);
    const tooWide = () => range.getBoundingClientRect().width > el.clientWidth * 0.86;
    let px = parseFloat(getComputedStyle(el).fontSize);
    for (let i = 0; i < 12 && tooWide() && px > 10; i++) {
      px *= 0.9;
      el.style.fontSize = `${px}px`;
    }
  }

  // Uppercase I and lowercase l look the same, so that pair would look like a match.
  const looksSame = (a, b, type) => type === "letter" && a.text.toUpperCase() === "I" && b.text.toLowerCase() === "l";

  // Build the pairs from `pool`: the first item is the one real match; every other left item gets a
  // wrong partner on the right, ideally a look-alike (B—d, 🐶—cot, WAS—saw).
  function buildPairs(ctx, pool, count, type) {
    const lefts = ctx.shuffle(pool.slice()).slice(0, count);
    const [match, ...wrongs] = lefts;
    // Wrong partners only show as words on the right, so they may come from the whole list
    // (no picture needed). None of them is a left item's own partner, so no wire matches by accident.
    const used = new Set(lefts);
    const ok = (it, left) => !used.has(it) && it.text.length <= MAX_WORD && !looksSame(left, it, type);
    const pairs = [{ left: match, right: match, match: true }];
    for (const it of wrongs) {
      const partner = ctx.pickOptions(it, 5).find((o) => ok(o, it))
        || ctx.shuffle(ctx.items.slice()).find((o) => ok(o, it));
      if (!partner) continue; // tiny list: fewer wires
      used.add(partner);
      pairs.push({ left: it, right: partner, match: false });
    }
    return ctx.shuffle(pairs);
  }

  registerMicrogame({
    id: "wire-cut",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 7000,
    input: "tap",  // frame shows TAP! under the instruction

    start(ctx) {
      injectCss();
      const type = ctx.list.type;
      const speed = ctx.speed || 1;
      const crossed = speed >= 1.25;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const { shuffle, later } = ctx;
      let done = false;

      // Words longer than MAX_WORD get too small to read on a tile. Use pictures when there are enough.
      const fits = ctx.items.filter((it) => type === "letter" || type === "phonics" || it.text.length <= MAX_WORD);
      const withPics = fits.filter((it) => it.emoji);
      const pics = type !== "letter" && type !== "phonics" && withPics.length >= 5;
      let pool = pics ? withPics : fits;
      let pairs;
      if (type === "phonics") {
        // Letter—picture pairs. The match is B—⚽ (a picture that starts with B). Each wrong pair gets
        // a picture from another letter, a look-alike when there is one (C—🦆), but never from a
        // letter that's on the board, so no wrong picture has a partner sitting on the left.
        pool = ctx.items.filter((it) => ctx.phonics.pics(it).length);
        const n = Math.min(speed >= 1.5 ? 4 : 3, pool.length);
        const lefts = pool.slice(0, n);
        const onBoard = new Set(lefts.map((it) => it.text));
        const usedEmoji = new Set();
        const letterFace = (it) => ({ left: it.text.toUpperCase(), spoken: it.say || it.text, word: false, pic: false });
        const picFace = (p) => { usedEmoji.add(p.emoji); return { right: p.emoji, spoken: p.word, word: false, pic: true, picRight: true }; };
        pairs = [{ match: true, L: letterFace(lefts[0]), R: picFace(ctx.pick(ctx.phonics.pics(lefts[0]))) }];
        for (const it of lefts.slice(1)) {
          const p = ctx.phonics.set(it, 0, 25).wrong.find((w) => !onBoard.has(w.letter) && !usedEmoji.has(w.emoji));
          if (p) pairs.push({ match: false, L: letterFace(it), R: picFace(p) });
        }
        pairs = shuffle(pairs);
      } else {
        pairs = buildPairs(ctx, pool, Math.min(speed >= 1.5 ? 4 : 3, pool.length), type);
      }
      const count = pairs.length;
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
      // 👆 TAP! in the middle of the board, between the first two wires (never on one wire).
      ctx.later(() => {
        const g = ctx.root.getBoundingClientRect(), b = board.getBoundingClientRect();
        const y = (el) => { const r = el.getBoundingClientRect(); return r.top + r.height / 2; };
        if (wires.length < 2) { ctx.hint(board); return; }
        ctx.hint({ x: b.left + b.width / 2 - g.left, y: (y(wires[0].leftEl) + y(wires[1].leftEl)) / 2 - g.top });
      }, 80);

      const wires = pairs.map((pair, i) => {
        const color = WIRE_COLORS[i % WIRE_COLORS.length];
        const L = pair.L || faces(pair.left, type, pics);
        const R = pair.R || faces(pair.right, type, pics);
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
          if (isWord) ctx.raf(() => fitWord(b)); // after layout, once the tile has its size
          return b;
        };
        const wire = {
          pair, color, cut: false, sayLeft: L.spoken, sayRight: R.spoken,
          leftEl: tile(L.left, L.word && !L.pic, L.pic, 1, i),
          rightEl: tile(R.right, R.word, !!R.picRight, 3, rows[i]),
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
          if (animateCut) { void ha.getBoundingClientRect(); ctx.raf(fall); } else fall();
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
      function lockBoard() {
        wires.forEach((x) => {
          x.leftEl.disabled = x.rightEl.disabled = true;
          if (x.snip) x.snip.hidden = true;
        });
        bomb.querySelector(".wc-spark").hidden = true;
      }

      function cut(w) {
        if (done || ctx.ended || w.cut) return;
        done = true;
        w.cut = true;
        const g = drawWire(w, !reduceMotion);
        sparks(g.m);
        snipSound();
        lockBoard();
        ctx.say(`${w.sayLeft}... ${w.sayRight}`);

        if (w.pair.match) {
          w.leftEl.classList.add("good");
          w.rightEl.classList.add("good");
          wrap.classList.add("safe");
          ctx.win();
          later(confetti, 120);
        } else {
          ctx.lose();
          // The cut pair turns red, the real match lights up green, then boom.
          w.leftEl.classList.add("bad");
          w.rightEl.classList.add("bad");
          showMatch();
          later(explode, 220);
        }
      }
      function showMatch() {
        const m = wires.find((x) => x.pair.match);
        m.leftEl.classList.add("answer");
        m.rightEl.classList.add("answer");
        return m;
      }

      // Out of time: light up the match, say it, then boom.
      ctx.onTimeout(() => {
        done = true;
        lockBoard();
        const m = showMatch();
        ctx.say(`${m.sayLeft}... ${m.sayRight}`);
        later(explode, 300);
      });

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
        ctx.confetti(fx, wrap.getBoundingClientRect().width / 2, bomb.offsetHeight / 2);
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
        // Blow the good pairs away from the bomb; the match stays put so the player sees the answer.
        const box = wrap.getBoundingClientRect();
        const cx = box.left + box.width / 2, cy = box.top + bomb.offsetHeight / 2;
        wires.filter((w) => !w.pair.match).forEach((w) => [w.leftEl, w.rightEl].forEach((el) => {
          const r = el.getBoundingClientRect();
          const vx = r.left + r.width / 2 - cx, vy = r.top + r.height / 2 - cy;
          const len = Math.hypot(vx, vy) || 1;
          const push = 160 + Math.random() * 120;
          el.animate(
            [{ transform: "none" },
             { transform: `translate(${(vx / len) * push}px,${(vy / len) * push}px) rotate(${(Math.random() - 0.5) * 120}deg)` }],
            { duration: 450, delay: 60, easing: "cubic-bezier(.1,.8,.3,1)", fill: "forwards" });
        }));
        wires.filter((w) => !w.pair.match).forEach((w) =>
          w.g.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: "forwards" }));
      }

      // ---------- Sound effects (Web Audio; silent when there is no audio context) ----------
      const { noise, sweep } = ctx.sfx;
      const snipSound = () => { noise(0.05, "highpass", 3000, 6000, 0.5); noise(0.05, "highpass", 2500, 5000, 0.4, 0.07); };
      const popSound = () => { [0, 0.06, 0.13].forEach((d) => noise(0.08, "bandpass", 1800, 600, 0.35, d)); };
      const boomSound = () => { noise(0.9, "lowpass", 1500, 60, 0.9); sweep(120, 35, 0.7, "sine", 0.6); };

      return function cleanup() {
        done = true;
        ro.disconnect();
      };
    },
  });
})();
