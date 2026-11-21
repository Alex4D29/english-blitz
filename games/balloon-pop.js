// BALLOON POP — the voice says "B for ball" (or "cat" with a word list).
// Letter balloons drift around the sky and bounce off each other; pop the
// right one. Tap 🔊 to hear it again (without speech it shows the picture).
//
// Right pop: confetti, and the other balloons float away.
// Wrong pop: that balloon was full of green slime — SPLAT, drips — then the
// right balloon wiggles so the player sees the answer.
// Phonics list: the button at the top shows the letter (B) and the voice says it. One balloon
// carries a picture that starts with B, the rest carry pictures from other letters (look-alikes
// first). After the pop the voice says "B for ball".
// Faster speeds make the balloons drift faster; 2× and up has six balloons.
(function () {
  const TEXT = {
    name: { en: "Balloon Pop" },
    icon: "🎈",
    // Practice mode's "How to play" card: steps (icon + sentence) and tips.
    howTo: (list) => {
      const letter = list.type === "letter";
      if (list.type === "phonics") return { en: {
        steps: [
          ["👀", "Look at the letter at the top and listen, like \"B\"."],
          ["🎈", "Find the balloon with a picture that starts with B. Ball… bee… banana!"],
          ["👆", "Tap it to pop it!"],
        ],
        tips: [
          "Tap the letter at the top to hear it again.",
          "Only one picture starts with the letter. A wrong balloon bursts into slime, then the right one wiggles.",
          "When the game speeds up, the balloons move faster and there are more of them.",
        ],
      } };
      return { en: {
        steps: [
          ["👂", letter ? "Listen. The voice says a letter, like \"B for ball\"." : "Listen. The voice says a word, like \"cat\"."],
          ["🎈", letter ? "Find the balloon with that letter." : "Find the balloon with that word."],
          ["👆", "Tap it to pop it!"],
        ],
        tips: [
          "Tap 🔊 at the top to hear it again.",
          "A wrong balloon bursts into slime, then the right one wiggles.",
          "When the game speeds up, the balloons move faster and there are more of them.",
        ],
      } };
    },
    instruction: (list) => ({ en: list.type === "letter" ? "POP THE\nLETTER!" : list.type === "phonics" ? "POP THE\nPICTURE!" : "POP THE\nWORD!" }),
    prompt: (spoken, word) => (word ? `${spoken} for ${word}` : spoken),
    replayLabel: "Hear it again",
    balloonLabel: (spoken) => `Pop ${spoken}`,
  };

  const COLORS = ["#ff2e88", "#1e6bff", "#8a2be2", "#ff8a00", "#00b86b", "#e8173c"];
  const SLIME = "#8ee000";
  const SVG_NS = "http://www.w3.org/2000/svg";

  const CSS = `
  .bp { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:8px; }
  .bp-speaker { flex:none; position:relative; z-index:2; min-width:64px; height:64px; padding:0 14px; border-radius:999px; font:inherit;
    font-size:2rem; line-height:1; background:#fff; border:5px solid #111; box-shadow:0 6px 0 #111;
    display:flex; align-items:center; justify-content:center; touch-action:manipulation; animation:bp-in .3s cubic-bezier(.2,1.8,.4,1) both; }
  .bp-speaker.cue { height:auto; min-height:64px; font-size:2.6rem; }
  .bp-speaker:active { transform:translateY(4px); box-shadow:0 2px 0 #111; }
  .bp-sky { position:relative; flex:1; min-height:0; width:100%; overflow:hidden; }
  .bp-fx { position:absolute; inset:0; pointer-events:none; z-index:3; overflow:visible; }

  .bp-balloon { position:absolute; left:0; top:0; width:var(--bw); height:calc(var(--bw) * 1.18); padding:0; margin:0;
    border:0; background:none; font:inherit; cursor:pointer; touch-action:none; will-change:transform; }
  .bp-balloon:disabled { cursor:default; }
  .bp-bob { position:absolute; inset:0; animation:bp-bob var(--bob, 2.4s) ease-in-out infinite alternate; }
  .bp-body { position:absolute; inset:0; background:var(--c); border:5px solid #111;
    border-radius:50% 50% 47% 47% / 56% 56% 44% 44%;
    box-shadow:inset calc(var(--bw) * -.09) calc(var(--bw) * -.07) 0 rgba(0,0,0,.2), 0 5px 0 rgba(0,0,0,.25); }
  .bp-body::before { content:""; position:absolute; left:16%; top:12%; width:20%; height:26%; border-radius:50%;
    background:rgba(255,255,255,.75); transform:rotate(28deg); }
  .bp-knot { position:absolute; left:50%; top:100%; width:16px; height:16px; margin:-9px 0 0 -8px; background:var(--c);
    border:4px solid #111; transform:rotate(45deg); border-radius:3px; z-index:-1; }
  .bp-string { position:absolute; left:50%; top:100%; width:20px; height:calc(var(--bw) * .5); margin-left:-10px;
    pointer-events:none; overflow:visible; z-index:-2; }
  .bp-text { position:absolute; inset:0 0 6% 0; display:flex; align-items:center; justify-content:center; color:#fff;
    font-size:calc(var(--bw) * .56); line-height:1; -webkit-text-stroke:3px #111; paint-order:stroke fill; text-shadow:0 4px 0 #111; }
  .bp-balloon.word .bp-text { font-size:calc(var(--bw) * .3); }
  .bp-balloon.pic .bp-text { font-size:calc(var(--bw) * .5); -webkit-text-stroke:0; text-shadow:none; filter:drop-shadow(0 3px 0 rgba(0,0,0,.35)); }

  .bp-balloon::after { content:""; position:absolute; left:50%; top:50%; width:140%; aspect-ratio:1; margin:-70% 0 0 -70%;
    border:6px dashed #fff; border-radius:50%; opacity:0; pointer-events:none; }
  .bp-balloon.popped .bp-body, .bp-balloon.popped .bp-text, .bp-balloon.popped .bp-knot { animation:bp-burst .14s ease-out forwards; }
  .bp-balloon.popped .bp-string { animation:bp-fall .7s ease-in forwards; }
  .bp-balloon.popped::after { animation:bp-ring .3s ease-out; }
  .bp-balloon.answer .bp-bob { animation:bp-wiggle .35s ease-in-out infinite; }
  .bp-balloon.answer .bp-body { box-shadow:0 0 0 7px #fff, 0 0 0 12px #111; }
  .bp-balloon.dim { opacity:.4; }

  .bp-splat { position:absolute; overflow:visible; animation:bp-splat .35s cubic-bezier(.2,1.7,.4,1) both; }
  .bp-drip { position:absolute; background:${SLIME}; border:4px solid #111; border-top:0; border-radius:0 0 12px 12px;
    transform-origin:top center; animation:bp-drip var(--d, 1.4s) .2s cubic-bezier(.5,0,.8,.6) both; }
  .bp-goo { position:absolute; border-radius:50%; background:${SLIME}; border:4px solid #111; }

  @keyframes bp-in     { from { transform:scale(.6); opacity:0; } }
  @keyframes bp-bob    { from { transform:translateY(-4%) rotate(-4deg); } to { transform:translateY(4%) rotate(4deg); } }
  @keyframes bp-burst  { 40% { transform:scale(1.25); opacity:1; } 100% { transform:scale(1.5); opacity:0; } }
  @keyframes bp-fall   { to { transform:translateY(180px) rotate(40deg); opacity:0; } }
  @keyframes bp-ring   { 0% { opacity:1; transform:scale(.5); } 100% { opacity:0; transform:scale(1.2); } }
  @keyframes bp-wiggle { 25% { transform:rotate(-10deg) scale(1.08); } 75% { transform:rotate(10deg) scale(1.08); } }
  @keyframes bp-splat  { from { transform:scale(.15); } }
  @keyframes bp-drip   { from { transform:scaleY(0); } }
  @media (prefers-reduced-motion: reduce) {
    .bp-speaker, .bp-bob, .bp-balloon.answer .bp-bob, .bp-splat, .bp-drip, .bp-balloon.popped::after { animation:none; }
  }`;

  function injectCss() {
    if (document.getElementById("bp-css")) return;
    const style = document.createElement("style");
    style.id = "bp-css";
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  registerMicrogame({
    id: "balloon-pop",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 6000,
    input: "tap",
    tutorial: true, // has a ctx.tutorial script

    start(ctx) {
      injectCss();
      const isLetter = ctx.list.type === "letter";
      const isPhonics = ctx.list.type === "phonics";
      const speed = ctx.speed || 1;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const n = Math.min(speed >= 2 ? 6 : 4, ctx.items.length);
      const spoken = (it) => it.say || it.text;
      let target, options, prompt, answerLine, letterItem = null;
      if (isPhonics) {
        // One balloon carries a picture that starts with the letter, the rest carry pictures that don't.
        // The balloons hold picture "items" ({ text: emoji, say: word }), so the popping code is the same.
        const letter = letterItem = ctx.items.find((it) => ctx.phonics.pics(it).length) || ctx.items[0];
        const set = ctx.phonics.set(letter, 1, n - 1);
        const asItem = (p) => ({ text: p.emoji, say: p.word });
        target = asItem(set.right[0]);
        options = ctx.shuffle([target, ...set.wrong.map(asItem)]);
        prompt = spoken(letter);
        answerLine = TEXT.prompt(spoken(letter), target.say); // "B for ball"
      } else {
        target = ctx.items[0];
        options = ctx.pickOptions(target, n);
        prompt = isLetter ? TEXT.prompt(spoken(target), target.word) : spoken(target);
        answerLine = prompt;
      }
      const { noise, sweep } = ctx.sfx;
      let done = false;
      let moving = !reduceMotion;
      let flyAway = false;

      // ---------- DOM ----------
      const wrap = document.createElement("div");
      wrap.className = "bp";
      const speaker = document.createElement("button");
      speaker.className = "bp-speaker" + (ctx.canSpeak ? "" : " cue");
      speaker.textContent = isPhonics ? (ctx.canSpeak ? `${letterItem.text} 🔊` : letterItem.text) : ctx.canSpeak ? "🔊" : target.emoji || target.text;
      speaker.setAttribute("aria-label", TEXT.replayLabel);
      speaker.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });
      speaker.addEventListener("click", (e) => { if (e.detail === 0) replay(); });
      const sky = document.createElement("div");
      sky.className = "bp-sky";
      const fx = document.createElement("div");
      fx.className = "bp-fx";
      wrap.append(speaker, sky, fx);
      ctx.root.appendChild(wrap);
      const balloons = options.map((item, i) => {
        const el = document.createElement("button");
        el.className = "bp-balloon" + (isPhonics ? " pic" : isLetter ? "" : " word");
        el.style.setProperty("--c", COLORS[i % COLORS.length]);
        el.style.setProperty("--bob", `${(2 + Math.random() * 1.2).toFixed(2)}s`);
        el.setAttribute("aria-label", TEXT.balloonLabel(spoken(item)));
        el.innerHTML =
          '<div class="bp-bob"><div class="bp-knot"></div>' +
          '<svg class="bp-string" viewBox="0 0 20 60" preserveAspectRatio="none">' +
          '<path d="M10 0 C2 12 18 24 10 36 S4 52 10 60" fill="none" stroke="#111" stroke-width="3" vector-effect="non-scaling-stroke"/></svg>' +
          '<div class="bp-body"></div><div class="bp-text"></div></div>';
        const txt = el.querySelector(".bp-text");
        txt.textContent = item.text;
        // Long sight words ("because") shrink so they stay inside the balloon. 3–4 letters keep the CSS size.
        if (!isLetter && !isPhonics && item.text.length > 4) txt.style.fontSize = `calc(var(--bw) * ${(1.2 / item.text.length).toFixed(3)})`;
        el.querySelector(".bp-bob").style.animationDelay = `${(-Math.random() * 2).toFixed(2)}s`;
        const b = { el, item, x: 0, y: 0, vx: 0, vy: 0, popped: false };
        el.addEventListener("pointerdown", (e) => { e.preventDefault(); pop(b); });
        el.addEventListener("click", (e) => { if (e.detail === 0) pop(b); }); // keyboard / assistive
        sky.appendChild(el);
        return b;
      });

      // ---------- Layout + drifting ----------
      let w = 0, h = 0, bw = 0;
      const cols = 2, rows = Math.ceil(n / cols);
      function measure() {
        const r = sky.getBoundingClientRect();
        w = r.width;
        h = r.height;
        bw = Math.max(48, Math.min(w * (n > 4 ? 0.3 : 0.36), h * (n > 4 ? 0.24 : 0.3)));
        sky.style.setProperty("--bw", `${bw}px`);
      }
      const maxX = () => Math.max(0, w - bw);
      const maxY = () => Math.max(0, h - bw * 1.25);

      measure();
      // Start in a jittered grid so nothing overlaps, drifting in a random direction.
      const order = ctx.shuffle(balloons.map((_, i) => i));
      const v0 = bw * (0.35 + 0.45 * (speed - 1)); // px per second
      balloons.forEach((b, i) => {
        const cell = order[i];
        const cw = w / cols, ch = h / rows;
        const cx = (cell % cols + 0.5) * cw, cy = (Math.floor(cell / cols) + 0.5) * ch;
        b.x = Math.min(maxX(), Math.max(0, cx - bw / 2 + (Math.random() - 0.5) * cw * 0.2));
        b.y = Math.min(maxY(), Math.max(0, cy - bw * 0.6 + (Math.random() - 0.5) * ch * 0.2));
        const ang = Math.random() * Math.PI * 2;
        b.vx = Math.cos(ang) * v0;
        b.vy = Math.sin(ang) * v0;
      });

      function render() {
        balloons.forEach((b) => { b.el.style.transform = `translate(${b.x}px, ${b.y}px)`; });
      }

      function step(dt) {
        const live = balloons.filter((b) => !b.popped);
        live.forEach((b) => {
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          if (flyAway) return; // no walls: let them escape off the top
          if (b.x < 0) { b.x = 0; b.vx = Math.abs(b.vx); }
          if (b.x > maxX()) { b.x = maxX(); b.vx = -Math.abs(b.vx); }
          if (b.y < 0) { b.y = 0; b.vy = Math.abs(b.vy); }
          if (b.y > maxY()) { b.y = maxY(); b.vy = -Math.abs(b.vy); }
        });
        if (flyAway) return;
        // Balloons bump off each other (equal-mass elastic bounce between circles).
        const r = bw * 0.56; // a bit bigger than half-width: the body is taller than it is wide
        for (let i = 0; i < live.length; i++) {
          for (let j = i + 1; j < live.length; j++) {
            const a = live[i], c = live[j];
            const dx = c.x - a.x, dy = c.y - a.y;
            const d = Math.hypot(dx, dy) || 0.01;
            if (d >= r * 2) continue;
            const nx = dx / d, ny = dy / d;
            const push = (r * 2 - d) / 2;
            a.x -= nx * push; a.y -= ny * push;
            c.x += nx * push; c.y += ny * push;
            const rel = (a.vx - c.vx) * nx + (a.vy - c.vy) * ny;
            if (rel > 0) {
              a.vx -= rel * nx; a.vy -= rel * ny;
              c.vx += rel * nx; c.vy += rel * ny;
            }
          }
        }
      }

      let last = 0;
      function frame(ts) {
        if (!moving) return;
        const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0;
        last = ts;
        step(dt);
        render();
        if (flyAway && balloons.every((b) => b.popped || b.y < -bw * 2)) return;
        ctx.raf(frame);
      }
      render();
      if (moving) ctx.raf(frame);

      const ro = new ResizeObserver(() => {
        measure();
        balloons.forEach((b) => {
          b.x = Math.min(maxX(), Math.max(0, b.x));
          if (!flyAway) b.y = Math.min(maxY(), Math.max(0, b.y));
        });
        render();
      });
      ro.observe(sky);

      // ---------- Popping ----------
      function replay() { if (!done) ctx.say(prompt); }

      function centerOf(b) {
        const r = b.el.getBoundingClientRect(), f = fx.getBoundingClientRect();
        return { x: r.left + r.width / 2 - f.left, y: r.top + r.height / 2 - f.top };
      }

      function lockAll() {
        balloons.forEach((b) => { b.el.disabled = true; });
      }

      function revealAnswer() {
        moving = false;
        balloons.forEach((b) => {
          if (b.item === target) b.el.classList.add("answer");
          else if (!b.popped) b.el.classList.add("dim");
        });
      }

      function pop(b) {
        if (done || ctx.ended || b.popped) return;
        done = true;
        b.popped = true;
        b.el.classList.add("popped");
        lockAll();
        popSound();
        const at = centerOf(b);

        if (b.item === target) {
          ctx.win();
          if (isPhonics) ctx.say(answerLine); // "B for ball"
          ctx.confetti(fx, at.x, at.y);
          // Everyone else floats off into the sky.
          flyAway = true;
          balloons.forEach((x) => {
            if (x.popped) return;
            x.vx *= 0.3;
            x.vy = -(h * 0.9 + Math.random() * h * 0.5);
          });
          if (!moving) balloons.forEach((x) => { if (!x.popped) x.el.classList.add("dim"); });
        } else {
          ctx.lose();
          moving = false;
          splat(at);
          ctx.later(() => {
            revealAnswer();
            ctx.say(answerLine);
          }, 500);
        }
      }

      ctx.onTimeout(() => {
        done = true;
        lockAll();
        revealAnswer();
        ctx.say(answerLine);
      });

      // Green slime: one blobby splat (union of circles with a shared ink outline) plus drips.
      function splat(at) {
        splatSound();
        const s = bw * 2.1;
        const circles = [{ x: 0, y: 0, r: s * 0.24 }];
        const lobes = 9;
        for (let i = 0; i < lobes; i++) {
          const ang = (i / lobes) * Math.PI * 2 + Math.random() * 0.4;
          const d = s * (0.18 + Math.random() * 0.12);
          circles.push({ x: Math.cos(ang) * d, y: Math.sin(ang) * d, r: s * (0.08 + Math.random() * 0.07) });
          if (Math.random() < 0.6) {
            const d2 = s * (0.38 + Math.random() * 0.1);
            circles.push({ x: Math.cos(ang) * d2, y: Math.sin(ang) * d2, r: s * (0.025 + Math.random() * 0.025) });
          }
        }

        // Drips go under the splat so its fill hides their tops.
        if (!reduceMotion) {
          for (let i = 0; i < 4; i++) {
            const d = document.createElement("div");
            d.className = "bp-drip";
            const dw = bw * (0.1 + Math.random() * 0.08);
            d.style.width = `${dw}px`;
            d.style.height = `${bw * (0.6 + Math.random() * 1.1)}px`;
            d.style.left = `${at.x + (Math.random() - 0.5) * s * 0.4 - dw / 2}px`;
            d.style.top = `${at.y + s * 0.1}px`;
            d.style.setProperty("--d", `${(1.1 + Math.random() * 0.8).toFixed(2)}s`);
            fx.appendChild(d);
          }
        }

        const svg = document.createElementNS(SVG_NS, "svg");
        svg.setAttribute("class", "bp-splat");
        svg.setAttribute("viewBox", `${-s / 2} ${-s / 2} ${s} ${s}`);
        svg.style.cssText = `left:${at.x - s / 2}px;top:${at.y - s / 2}px;width:${s}px;height:${s}px;`;
        const dots = (fill, stroke, sw) => circles.map((c) =>
          `<circle cx="${c.x}" cy="${c.y}" r="${c.r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`).join("");
        svg.innerHTML =
          `<g>${dots("#111", "#111", 10)}</g><g>${dots(SLIME, "none", 0)}</g>` +
          `<ellipse cx="${-s * 0.08}" cy="${-s * 0.09}" rx="${s * 0.06}" ry="${s * 0.035}" fill="rgba(255,255,255,.7)" transform="rotate(-25)"/>`;
        fx.appendChild(svg);

        // A few goo blobs fly out and land on the "screen".
        if (!reduceMotion) {
          const f = fx.getBoundingClientRect();
          for (let i = 0; i < 5; i++) {
            const g = document.createElement("div");
            g.className = "bp-goo";
            const size = bw * (0.12 + Math.random() * 0.14);
            g.style.cssText = `width:${size}px;height:${size}px;left:${at.x - size / 2}px;top:${at.y - size / 2}px;`;
            fx.appendChild(g);
            const tx = (Math.random() * f.width) - at.x;
            const ty = (Math.random() * f.height * 0.8) - at.y;
            g.animate(
              [{ transform: "translate(0,0) scale(.4)" },
               { transform: `translate(${tx}px,${ty}px) scale(1.5, 1.2)` }],
              { duration: 380 + Math.random() * 200, easing: "cubic-bezier(.2,.7,.4,1)", fill: "forwards" });
          }
        }
      }

      // ---------- Sound effects ----------
      const popSound = () => { noise(0.07, "highpass", 1200, 5000, 0.7); sweep(900, 200, 0.06, "square", 0.08); };
      const splatSound = () => {
        noise(0.4, "lowpass", 1200, 120, 0.8, 0.03);
        sweep(220, 55, 0.35, "sine", 0.45, 0.03);
        [0.25, 0.36, 0.5].forEach((d, i) => sweep(260 + i * 90, 700 + i * 150, 0.06, "sine", 0.18, d)); // bloop bloop
      };

      // Desktop keyboard: type the letter, space to replay.
      function onKey(e) {
        if (done) return;
        if (e.key === " ") { e.preventDefault(); replay(); return; }
        if (!isLetter || e.key.length !== 1) return;
        const b = balloons.find((x) => x.item.text.toUpperCase() === e.key.toUpperCase());
        if (b) pop(b);
      }
      document.addEventListener("keydown", onKey);

      ctx.say(prompt);
      // Phonics shows the letter on the card: show it big for a moment first (ctx.reveal). Otherwise the
      // card is only 🔊 and the target is spoken, so there's nothing to show.
      if (isPhonics || !ctx.canSpeak) ctx.reveal(speaker);

      // Tutorial: point at the 🔊 card, then pop the right balloon (the finger follows it as it drifts).
      ctx.tutorial(isPhonics ? letterItem : target, async (f) => {
        await f.point(speaker);
        await f.tap(() => balloons.find((b) => b.item === target).el.querySelector(".bp-body"));
      });

      return function cleanup() {
        done = true;
        moving = false;
        ro.disconnect();
        document.removeEventListener("keydown", onKey);
      };
    },
  });
})();
