// EGG SHUFFLE — letters (or words) stand in a row on little legs. Giant eggs
// drop down over them, then the eggs shuffle around. Only THEN does the card at
// the top show the target and the voice say it ("B for ball" / "cat"). The
// player taps the egg they think it's hiding in, and it cracks open.
//
// Right egg: the top half flies off, the letter hops out, confetti, cheep cheep,
// then the other eggs crack too so the player sees what was where.
// Wrong egg: it's a ROTTEN egg — green shell, stink clouds, a rude noise — then
// the right egg cracks open and glows.
//
// The round is split up front: the watching part (stand, drop, shuffle) gets
// about 60% of the time limit, choosing gets the rest (never less than 1.8 s).
// Faster speeds squeeze the watching part (quicker swaps), add a swap at 2×,
// and add a 4th egg from 2×.
(function () {
  const TEXT = {
    name: { en: "Egg Shuffle" },
    icon: "🥚",
    howTo: (list) => {
      const thing = list.type === "letter" ? "letter" : "word";
      return { en: {
        steps: [
          ["👀", `Look at the ${thing}s standing in a row.`],
          ["🥚", "Eggs drop down and hide them. Watch the eggs move around!"],
          ["👂", `Now look at the card at the top and listen. Which egg is that ${thing} in?`],
          ["👆", "Tap that egg to crack it open!"],
        ],
        tips: [
          "You can't tap the eggs while they're moving. Wait until they stop.",
          "Tap the card at the top to hear it again.",
          "A wrong egg is a stinky rotten egg! Then the right egg cracks open.",
          "When the game speeds up, the eggs move faster, and later there are 4 eggs.",
        ],
      } };
    },
    instruction: { en: "WATCH THE\nEGGS!" },
    prompt: (spoken, word) => (word ? `${spoken} for ${word}` : spoken),
    watchCue: "👀",
    targetLabel: (spoken) => `Find ${spoken}. Tap to hear it again`,
    eggLabel: (i) => `Egg ${i + 1}`,
  };

  const COLORS = ["#ff2e88", "#1e6bff", "#8a2be2", "#ff8a00", "#00b86b", "#e8173c"];
  const ROTTEN = "#a8d14a";
  const MAX_WORD = 5; // 4 when there are 4 eggs

  // Egg drawn in a 100×130 box, split along a zigzag so it can crack in two.
  const EGG = "M50 4 C80 4 96 52 96 84 C96 112 76 127 50 127 C24 127 4 112 4 84 C4 52 20 4 50 4 Z";
  const ZIG = [[5, 70], [10, 62], [20, 74], [30, 62], [40, 74], [50, 62], [60, 74], [70, 62], [80, 74], [90, 62], [95, 70]];
  const zigPts = ZIG.map((p) => p.join(",")).join(" ");
  const TOP_CLIP = `0,0 100,0 100,70 ${ZIG.slice().reverse().map((p) => p.join(",")).join(" ")} 0,70`;
  const BOT_CLIP = `0,70 ${zigPts} 100,70 100,130 0,130`;
  // The same speckles on every egg, so no egg can be told apart.
  const SPECKLES = [[34, 30, 3], [62, 22, 2.2], [70, 48, 3.4], [26, 56, 2.4], [52, 44, 2], [40, 92, 3], [72, 98, 2.6], [22, 100, 2], [58, 112, 2.4], [80, 78, 2]];

  let uid = 0;
  function eggSvg() {
    const id = `es${++uid}`;
    const spots = SPECKLES.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" class="es-spot"/>`).join("");
    const half = (cls, clip) =>
      `<g class="${cls}"><g clip-path="url(#${id}${clip})">` +
      `<path d="${EGG}" class="es-shell"/>` +
      `<path d="M78 24 C94 50 98 92 80 116 C88 88 88 52 72 26 Z" class="es-shade"/>` +
      `<ellipse cx="34" cy="32" rx="8" ry="14" transform="rotate(24 34 32)" class="es-shine"/>` +
      spots +
      `<path d="${EGG}" class="es-line"/></g>` +
      `<polyline points="${zigPts}" class="es-seam"/></g>`;
    return `<svg class="es-egg" viewBox="0 0 100 130" aria-hidden="true">` +
      `<defs><clipPath id="${id}t"><polygon points="${TOP_CLIP}"/></clipPath>` +
      `<clipPath id="${id}b"><polygon points="${BOT_CLIP}"/></clipPath></defs>` +
      half("es-bot", "b") + half("es-top", "t") +
      `<polyline points="${zigPts}" pathLength="100" class="es-crack"/></svg>`;
  }

  const CSS = `
  .es { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:8px; }
  .es-card { flex:none; position:relative; z-index:4; min-width:96px; min-height:64px; padding:2px 16px; display:flex; align-items:center;
    justify-content:center; gap:8px; background:#fff; border:5px solid #111; border-radius:18px; box-shadow:0 6px 0 #111;
    font:inherit; color:#111; touch-action:manipulation; animation:es-in .35s cubic-bezier(.2,1.8,.4,1) both; }
  .es-card:active { transform:translateY(4px); box-shadow:0 2px 0 #111; }
  .es-card.watch .es-tt { animation:es-blink 1s ease-in-out infinite; }
  .es-card.show { animation:es-slam .35s cubic-bezier(.2,1.8,.4,1) both; }
  .es-tt { font-size:3rem; line-height:1; white-space:nowrap; }
  .es-card.word .es-tt { font-size:2.2rem; }
  .es-spk { font-size:1.3rem; line-height:1; }
  .es-stage { position:relative; flex:1; min-height:0; width:100%; overflow:hidden; }
  .es-fx { position:absolute; inset:0; pointer-events:none; z-index:5; overflow:visible; }

  .es-pod { position:absolute; left:0; top:0; width:var(--ew); height:calc(var(--ew) * 1.3); padding:0; margin:0; border:0;
    background:none; font:inherit; cursor:pointer; touch-action:none; will-change:transform; }
  .es-pod:disabled { cursor:default; }

  /* the little letter people */
  .es-kid { position:absolute; left:50%; bottom:6%; width:calc(var(--ew) * .7); height:calc(var(--ew) * .7); margin-left:calc(var(--ew) * -.35);
    z-index:1; transition:transform .3s cubic-bezier(.2,1.6,.4,1); }
  .es-sway { position:absolute; inset:0; animation:es-sway var(--sw, 1.2s) ease-in-out infinite alternate; transform-origin:50% 100%; }
  .es-body { position:absolute; left:0; right:0; top:8%; height:66%; background:var(--c); border:4px solid #111; border-radius:16px;
    box-shadow:inset 0 -6px 0 rgba(0,0,0,.2); display:flex; align-items:center; justify-content:center; }
  .es-txt { color:#fff; line-height:1; white-space:nowrap; -webkit-text-stroke:3px #111; paint-order:stroke fill; text-shadow:0 3px 0 #111;
    font-size:calc(var(--ew) * .4); }
  .es-eyes { position:absolute; left:50%; top:0; transform:translate(-50%, -45%); display:flex; gap:4px; }
  .es-eye { width:calc(var(--ew) * .17); height:calc(var(--ew) * .17); background:#fff; border:3px solid #111; border-radius:50%; position:relative; }
  .es-eye::after { content:""; position:absolute; left:30%; top:34%; width:42%; height:42%; background:#111; border-radius:50%; }
  .es-legs { position:absolute; left:22%; right:22%; top:72%; bottom:0; display:flex; justify-content:space-between; }
  .es-leg { width:5px; height:100%; background:#111; border-radius:3px; position:relative; }
  .es-leg::after { content:""; position:absolute; bottom:-2px; width:calc(var(--ew) * .14); height:calc(var(--ew) * .08); background:#111; border-radius:50% 50% 30% 30%; }
  .es-leg:first-child::after { right:-2px; }
  .es-leg:last-child::after { left:-2px; }

  /* the eggs */
  .es-egg { position:absolute; inset:0; width:100%; height:100%; overflow:visible; z-index:2; transform:translateY(var(--drop, -150vh)); }
  .es-shell { fill:var(--egg, #fff6df); }
  .es-shade { fill:rgba(0,0,0,.1); }
  .es-shine { fill:rgba(255,255,255,.85); }
  .es-spot { fill:rgba(140,90,40,.35); }
  .es-line { fill:none; stroke:#111; stroke-width:8; }
  .es-seam { fill:none; stroke:#111; stroke-width:5; stroke-linejoin:round; opacity:0; }
  .es-crack { fill:none; stroke:#111; stroke-width:5; stroke-linejoin:round; stroke-dasharray:101; stroke-dashoffset:101; }
  .es-top, .es-bot { transform-box:fill-box; transform-origin:50% 100%; }
  .es-pod.ready .es-egg { animation:es-wobble 1.6s ease-in-out infinite; animation-delay:var(--wd, 0s); transform-origin:50% 95%; }

  .es-pod.crack .es-egg { animation:es-shiver .12s linear 2; }
  .es-pod.crack .es-crack { transition:stroke-dashoffset .14s linear; stroke-dashoffset:0; }
  .es-pod.open .es-crack { opacity:0; }
  .es-pod.open .es-seam { opacity:1; }
  .es-pod.open .es-top { animation:es-fly .6s cubic-bezier(.3,.6,.5,1) forwards; }
  .es-pod.covered:not(.open) .es-kid { visibility:hidden; }
  .es-pod.open .es-kid { z-index:3; transform:translateY(calc(var(--ew) * -.5)); }
  .es-pod.open.hop .es-kid { animation:es-hop .5s cubic-bezier(.2,1.6,.4,1); }
  .es-pod.rotten .es-shell { fill:${ROTTEN}; }
  .es-pod.rotten .es-spot { fill:rgba(60,90,0,.5); }
  .es-pod.rotten .es-body { filter:saturate(.4) brightness(.85); }
  .es-pod.answer .es-body { box-shadow:0 0 0 6px #fff, 0 0 0 10px #111; }
  .es-pod.answer .es-sway { animation:es-wiggle .35s ease-in-out infinite; }
  .es-pod.dim { opacity:.45; }

  .es-stink { position:absolute; font-size:calc(var(--ew) * .36); line-height:1; animation:es-stink 1.1s ease-out forwards; }
  .es-wave { position:absolute; width:14px; overflow:visible; animation:es-rise 1.2s ease-out forwards; }

  @keyframes es-in     { from { transform:scale(.6); opacity:0; } }
  @keyframes es-slam   { 0% { transform:scale(2.2) rotate(-8deg); opacity:0; } 60% { transform:scale(.92); opacity:1; } }
  @keyframes es-blink  { 50% { transform:scale(1.15); } }
  @keyframes es-sway   { from { transform:rotate(-5deg); } to { transform:rotate(5deg) translateY(-3%); } }
  @keyframes es-wobble { 0%, 70%, 100% { transform:rotate(0); } 78% { transform:rotate(-5deg); } 86% { transform:rotate(4deg); } 93% { transform:rotate(-2deg); } }
  @keyframes es-shiver { 25% { transform:translateX(-4px) rotate(-3deg); } 75% { transform:translateX(4px) rotate(3deg); } }
  @keyframes es-fly    { to { transform:translate(var(--fx, 30%), -160%) rotate(var(--fr, 80deg)); opacity:0; } }
  @keyframes es-hop    { 0% { transform:translateY(0) scale(.6); } 60% { transform:translateY(calc(var(--ew) * -.95)) scale(1.1); } }
  @keyframes es-wiggle { 25% { transform:rotate(-10deg) scale(1.08); } 75% { transform:rotate(10deg) scale(1.08); } }
  @keyframes es-stink  { 0% { transform:translate(0,0) scale(.3); opacity:0; } 20% { opacity:1; } 100% { transform:translate(var(--sx), -120%) scale(1.3); opacity:0; } }
  @keyframes es-rise   { 0% { transform:translateY(20%) scaleY(.4); opacity:0; } 25% { opacity:1; } 100% { transform:translateY(-60%) scaleY(1); opacity:0; } }
  @media (prefers-reduced-motion: reduce) {
    .es-card, .es-card.show, .es-card.watch .es-tt, .es-sway, .es-pod.ready .es-egg, .es-pod.crack .es-egg,
    .es-pod.open.hop .es-kid, .es-pod.answer .es-sway, .es-stink, .es-wave { animation:none; }
    .es-pod.open .es-top { animation:none; opacity:0; }
    .es-stink, .es-wave { display:none; }
  }`;

  function injectCss() {
    if (document.getElementById("es-css")) return;
    const style = document.createElement("style");
    style.id = "es-css";
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  registerMicrogame({
    id: "egg-shuffle",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "cvc", "hfw"],
    duration: 10000,

    start(ctx) {
      injectCss();
      const isLetter = ctx.list.type === "letter";
      const speed = ctx.speed || 1;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const { tone, sweep, noise } = ctx.sfx;
      const spoken = (it) => it.say || it.text;

      // Long sight words wouldn't fit on a little letter person.
      const maxWord = speed >= 2 ? MAX_WORD - 1 : MAX_WORD;
      const pool = isLetter ? ctx.items : ctx.items.filter((it) => it.text.length <= maxWord);
      const n = Math.min(speed >= 2 ? 4 : 3, pool.length);
      const target = pool[0];
      let options = ctx.pickOptions(target, n).filter((it) => isLetter || it.text.length <= maxWord);
      for (const it of pool) {
        if (options.length >= n) break;
        if (!options.includes(it)) options.push(it);
      }
      options = ctx.shuffle(options);
      const prompt = isLetter ? TEXT.prompt(spoken(target), target.word) : spoken(target);

      // ---------- Timing (all inside ctx.timeLimit) ----------
      const T = ctx.timeLimit;
      const chooseMs = Math.max(1800, T * 0.4);
      const watchMs = Math.max(900, T - chooseMs - 150);
      const swapCount = speed >= 2 ? 4 : 3;
      const showMs = watchMs * 0.35;
      const dropMs = Math.min(600, watchMs * 0.12);
      const swapSlot = Math.min(800, (watchMs - showMs - dropMs) / swapCount);
      const swapMs = swapSlot * 0.85;

      let phase = "watch"; // watch → choose → done

      // ---------- DOM ----------
      const wrap = document.createElement("div");
      wrap.className = "es";
      const card = document.createElement("button");
      card.className = "es-card watch" + (isLetter ? "" : " word");
      card.setAttribute("aria-label", TEXT.targetLabel("?"));
      const tt = document.createElement("span");
      tt.className = "es-tt";
      tt.textContent = TEXT.watchCue;
      card.appendChild(tt);
      card.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });
      card.addEventListener("click", (e) => { if (e.detail === 0) replay(); });
      const stage = document.createElement("div");
      stage.className = "es-stage";
      const fx = document.createElement("div");
      fx.className = "es-fx";
      stage.appendChild(fx);
      wrap.append(card, stage);
      ctx.root.appendChild(wrap);

      const pods = options.map((item, i) => {
        const el = document.createElement("button");
        el.className = "es-pod";
        el.disabled = true;
        el.style.setProperty("--c", COLORS[i % COLORS.length]);
        el.style.setProperty("--sw", `${(0.9 + Math.random() * 0.6).toFixed(2)}s`);
        el.style.setProperty("--wd", `${(-Math.random() * 1.6).toFixed(2)}s`);
        el.innerHTML =
          '<div class="es-kid"><div class="es-sway">' +
          '<div class="es-legs"><div class="es-leg"></div><div class="es-leg"></div></div>' +
          '<div class="es-body"><span class="es-txt"></span></div>' +
          '<div class="es-eyes"><div class="es-eye"></div><div class="es-eye"></div></div>' +
          "</div></div>" + eggSvg();
        const txt = el.querySelector(".es-txt");
        txt.textContent = item.text;
        if (!isLetter) {
          const len = Math.max(3, item.text.length);
          txt.style.fontSize = `calc(var(--ew) * ${(0.76 / len).toFixed(3)})`;
          txt.style.webkitTextStroke = "2px #111";
        }
        const pod = { el, item, slot: i, egg: el.querySelector(".es-egg"), opened: false };
        el.addEventListener("pointerdown", (e) => { e.preventDefault(); choose(pod); });
        el.addEventListener("click", (e) => { if (e.detail === 0) choose(pod); });
        stage.appendChild(el);
        return pod;
      });

      // ---------- Layout ----------
      let w = 0, h = 0, ew = 0, baseY = 0;
      function measure() {
        const r = stage.getBoundingClientRect();
        w = r.width;
        h = r.height;
        ew = Math.max(56, Math.min((w - 24) / n * 0.84, h * 0.5 / 1.3));
        baseY = Math.max(ew * 0.9, h * 0.62 - ew * 0.65); // leave room above for hatching
        stage.style.setProperty("--ew", `${ew}px`);
      }
      const slotX = (s) => (w / n) * (s + 0.5) - ew / 2;
      const place = (p) => { p.el.style.transform = `translate(${slotX(p.slot)}px, ${baseY}px)`; };
      measure();
      pods.forEach(place);

      let swapping = 0;
      const ro = new ResizeObserver(() => {
        measure();
        if (!swapping) pods.forEach(place);
      });
      ro.observe(stage);

      // ---------- Watch phase: stand, drop, shuffle ----------
      ctx.later(dropEggs, showMs);

      function dropEggs() {
        pods.forEach((p, i) => {
          p.egg.style.setProperty("--drop", "0px");
          if (!reduceMotion) {
            p.egg.animate(
              [{ transform: `translateY(${-(baseY + ew * 1.6)}px)` },
               { transform: "translateY(0) scale(1.08, .9)", offset: 0.75 },
               { transform: "translateY(0)" }],
              { duration: dropMs, delay: i * 40, easing: "cubic-bezier(.5,0,.8,.6)", fill: "backwards" });
          }
        });
        ctx.later(() => { thud(); pods.forEach((p) => p.el.classList.add("covered")); }, dropMs * 0.75 + 40 * n);
        ctx.later(() => runSwaps(0, null), dropMs + 80);
      }

      // Each swap trades two eggs: one hops over the top, the other ducks under.
      // The first swap always moves the target's egg, so it never just sits still.
      function runSwaps(k, lastPair) {
        if (ctx.ended) return;
        if (k >= swapCount) { startChoosing(); return; }
        let a, b;
        do {
          if (k === 0) a = pods.find((p) => p.item === target);
          else a = ctx.pick(pods);
          b = ctx.pick(pods.filter((p) => p !== a));
        } while (lastPair && lastPair.includes(a) && lastPair.includes(b) && pods.length > 2);
        swap(a, b);
        ctx.later(() => runSwaps(k + 1, [a, b]), swapSlot);
      }

      function swap(a, b) {
        const ax = slotX(a.slot), bx = slotX(b.slot);
        const lift = ew * (0.55 + 0.12 * Math.abs(a.slot - b.slot));
        [a.slot, b.slot] = [b.slot, a.slot];
        whoosh();
        swapping++;
        const arc = (p, from, to, dy) => {
          place(p);
          p.el.style.zIndex = dy < 0 ? 2 : 1;
          const mid = (from + to) / 2;
          return p.el.animate(
            [{ transform: `translate(${from}px, ${baseY}px)` },
             { transform: `translate(${mid}px, ${baseY + dy}px) scale(${dy < 0 ? 1.06 : 0.94})` },
             { transform: `translate(${to}px, ${baseY}px)` }],
            { duration: swapMs, easing: "ease-in-out" });
        };
        const anims = [arc(a, ax, bx, -lift), arc(b, bx, ax, lift * 0.25)];
        Promise.all(anims.map((an) => an.finished)).catch(() => {}).then(() => {
          swapping--;
          if (!swapping) pods.forEach(place);
        });
      }

      function startChoosing() {
        if (ctx.ended) return;
        phase = "choose";
        card.classList.remove("watch");
        card.classList.add("show");
        card.setAttribute("aria-label", TEXT.targetLabel(spoken(target)));
        tt.textContent = target.text;
        const spk = document.createElement("span");
        spk.className = "es-spk";
        spk.setAttribute("aria-hidden", "true");
        spk.textContent = ctx.canSpeak ? "🔊" : target.emoji || "";
        if (spk.textContent) card.appendChild(spk);
        pods.forEach((p) => { p.el.disabled = false; p.el.classList.add("ready"); p.el.setAttribute("aria-label", TEXT.eggLabel(p.slot)); });
        tone(1047, 0.12, "triangle", 0.15);
        ctx.say(prompt);
      }

      function replay() { if (phase === "choose") ctx.say(prompt); }

      // ---------- Choosing + cracking ----------
      function lockAll() {
        pods.forEach((p) => { p.el.disabled = true; p.el.classList.remove("ready"); });
      }

      function crack(p, { rotten = false, hop = false, dim = false } = {}) {
        if (p.opened) return;
        p.opened = true;
        p.el.classList.remove("ready");
        p.el.classList.add("crack");
        p.el.style.setProperty("--fx", `${Math.random() < 0.5 ? -40 : 40}%`);
        p.el.style.setProperty("--fr", `${(Math.random() < 0.5 ? -1 : 1) * (60 + Math.random() * 50)}deg`);
        crackSound();
        ctx.later(() => {
          p.el.classList.add("open");
          if (hop) p.el.classList.add("hop");
          if (rotten) { p.el.classList.add("rotten"); stink(p); }
          if (dim) p.el.classList.add("dim");
        }, reduceMotion ? 0 : 180);
      }

      function choose(p) {
        if (phase !== "choose" || ctx.ended || p.opened) return;
        phase = "done";
        lockAll();
        const right = pods.find((x) => x.item === target);
        if (p === right) {
          ctx.win();
          crack(p, { hop: true });
          ctx.later(() => {
            cheep();
            const at = centerOf(p);
            ctx.confetti(fx, at.x, at.y - ew * 0.4);
          }, 200);
          ctx.later(() => pods.forEach((x) => { if (x !== p) crack(x, { dim: true }); }), 550);
        } else {
          ctx.lose();
          crack(p, { rotten: true });
          ctx.later(fart, 200);
          ctx.later(() => {
            crack(right, { hop: true });
            right.el.classList.add("answer");
            ctx.say(prompt);
          }, 750);
        }
      }

      ctx.onTimeout(() => {
        phase = "done";
        lockAll();
        const right = pods.find((x) => x.item === target);
        crack(right, { hop: true });
        right.el.classList.add("answer");
        ctx.later(() => pods.forEach((x) => { if (x !== right) crack(x, { dim: true }); }), 300);
        if (card.classList.contains("show")) ctx.say(prompt);
      });

      function centerOf(p) {
        const r = p.el.getBoundingClientRect(), f = fx.getBoundingClientRect();
        return { x: r.left + r.width / 2 - f.left, y: r.top + r.height / 2 - f.top };
      }

      // Rotten egg: green stink waves and 💨 clouds rise out of it.
      function stink(p) {
        if (reduceMotion) return;
        const at = centerOf(p);
        for (let i = 0; i < 3; i++) {
          const s = document.createElement("div");
          s.className = "es-stink";
          s.textContent = "💨";
          s.style.left = `${at.x - ew * 0.18 + (i - 1) * ew * 0.3}px`;
          s.style.top = `${at.y - ew * 0.6}px`;
          s.style.setProperty("--sx", `${(i - 1) * 40}%`);
          s.style.animationDelay = `${i * 0.12}s`;
          fx.appendChild(s);
        }
        for (let i = 0; i < 3; i++) {
          const wv = document.createElement("div");
          wv.innerHTML = '<svg class="es-wave" viewBox="0 0 14 60" style="width:14px;height:100%">' +
            `<path d="M7 60 C0 50 14 40 7 30 S0 10 7 0" fill="none" stroke="${ROTTEN}" stroke-width="5" stroke-linecap="round"/>` +
            '<path d="M7 60 C0 50 14 40 7 30 S0 10 7 0" fill="none" stroke="#111" stroke-width="1.5" stroke-linecap="round"/></svg>';
          const svg = wv.firstChild;
          svg.style.cssText += `position:absolute;left:${at.x - 7 + (i - 1) * ew * 0.28}px;top:${at.y - ew * 1.4}px;height:${ew * 0.8}px;animation-delay:${i * 0.15}s;`;
          fx.appendChild(svg);
        }
      }

      // ---------- Sound effects ----------
      const thud = () => { sweep(180, 55, 0.18, "sine", 0.4); noise(0.12, "lowpass", 900, 120, 0.35); };
      const whoosh = () => noise(Math.max(0.12, swapMs / 1000 * 0.8), "bandpass", 500, 2200, 0.12);
      const crackSound = () => {
        noise(0.04, "highpass", 2500, 6000, 0.6);
        noise(0.05, "highpass", 1800, 5000, 0.5, 0.07);
        tone(1400, 0.03, "square", 0.05, 0.03);
      };
      const cheep = () => [0, 0.14].forEach((d) => { sweep(2200, 3200, 0.07, "sine", 0.15, d); sweep(3000, 2400, 0.05, "sine", 0.1, d + 0.07); });
      const fart = () => {
        sweep(140, 70, 0.55, "sawtooth", 0.14);
        sweep(150, 80, 0.5, "square", 0.06, 0.02);
        noise(0.5, "lowpass", 400, 90, 0.3);
      };

      // Desktop keyboard: 1–4 picks an egg, left to right. Space replays.
      function onKey(e) {
        if (e.key === " ") { e.preventDefault(); replay(); return; }
        const k = Number(e.key);
        if (!Number.isInteger(k) || k < 1 || k > n) return;
        const p = pods.find((x) => x.slot === k - 1);
        if (p) choose(p);
      }
      document.addEventListener("keydown", onKey);

      return function cleanup() {
        phase = "done";
        ro.disconnect();
        document.removeEventListener("keydown", onKey);
      };
    },
  });
})();
