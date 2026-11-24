// SHOPPING SWEEP — a chase game (Claude's idea, named by the teacher; like Sack Man). A supermarket seen from
// above: aisles of shelves, items lying on the floor, each with an answer. Your character rides in a wobbly
// shopping trolley: tap anywhere and it rolls to the nearest floor tile by the shortest way (around wrong items
// when it can). Roll over every item that matches the card to win (CHECKOUT!). A wrong item: the trolley spins
// out (OOPS!) and stops for a moment. A grumpy shop-floor robot rolls after you; if it catches you, you lose.
(function () {
  const TEXT = {
    name: { en: "Shopping Sweep" },
    icon: "🛒",
    howTo: { en: {
      steps: [
        ["👀", "Look at the card: that's your shopping list."],
        ["👆", "Tap where you want to go. Your trolley rolls there!"],
        ["🛒", "Grab every item that matches the card before the robot catches you!"],
      ],
      tips: ["A wrong item makes your trolley spin out.", "The robot is slow at first. Keep moving!", "Tap the card to hear it again."],
    } },
    instruction: { en: "GO\nSHOPPING!" },
    cardLabel: "Your shopping list. Tap to hear it again.",
    got: ["GOT IT!", "IN THE TROLLEY!", "YES!"],
    oops: "OOPS!",
    gotcha: "GOTCHA!",
    checkout: "CHECKOUT!",
  };
  // Floor plans: "#" a shelf, "." floor. Every aisle loops round, so there's always another way.
  const MAPS = [
    [".......", ".##.##.", ".......", ".##.##.", ".......", ".##.##.", "......."],
    [".......", ".#.#.#.", ".#.#.#.", ".......", ".#.#.#.", ".#.#.#.", "......."],
    [".......", ".##.#..", "....#.#", ".#.....", ".#.##..", "......#", ".##...."],
  ];
  const SHELF = ["#ff8a8a", "#8fd3ff", "#ffe066", "#a8e6a1", "#d2b3ff"];

  const CSS = `
  .shs { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:6px; padding-bottom:6px; }
  .shs-top { flex:none; display:flex; align-items:center; gap:10px; }
  .shs-card { padding:4px 14px; background:#fff; border:5px solid #111; border-radius:16px; box-shadow:0 5px 0 #111; font:inherit; color:#111; font-size:clamp(1.6rem, 7vw, 2.6rem);
    line-height:1.05; cursor:pointer; touch-action:manipulation; display:flex; align-items:center; gap:6px; white-space:nowrap; }
  .shs-card .spk { font-size:.45em; }
  .shs-pips { display:flex; gap:4px; }
  .shs-pip { width:24px; height:24px; border:3px solid #111; border-radius:50%; background:#fff; display:flex; align-items:center; justify-content:center; font-size:13px; line-height:1; }
  .shs-pip.on { background:#ffd400; } .shs-pip.on::after { content:"🛒"; }
  .shs-wrap { position:relative; flex:1; min-height:0; width:100%; display:flex; align-items:center; justify-content:center; }
  .shs-board { position:relative; width:var(--bw); height:var(--bw); border:5px solid #111; border-radius:14px; box-shadow:0 7px 0 #111; overflow:hidden; touch-action:none;
    background:#f3efe4; background-image:linear-gradient(45deg, rgba(0,0,0,.05) 25%, transparent 25% 75%, rgba(0,0,0,.05) 75%), linear-gradient(45deg, rgba(0,0,0,.05) 25%, transparent 25% 75%, rgba(0,0,0,.05) 75%);
    background-size:calc(var(--t) * 2) calc(var(--t) * 2); background-position:0 0, var(--t) var(--t); }
  /* A shelf tile: a wooden unit with coloured boxes on it */
  .shs-shelf { position:absolute; width:var(--t); height:var(--t); background:#c9874a; border:3px solid #111; border-radius:4px; box-sizing:border-box;
    background-image:linear-gradient(90deg, var(--sc) 0 22%, transparent 22% 28%, var(--sc) 28% 50%, transparent 50% 56%, var(--sc) 56% 78%, transparent 78% 84%, var(--sc) 84%);
    background-size:100% 40%; background-repeat:no-repeat; background-position:0 20%; box-shadow:inset 0 calc(var(--t) * -.16) 0 rgba(0,0,0,.15); }
  /* An item on the floor (a tag with the answer) */
  .shs-item { position:absolute; width:var(--t); height:var(--t); display:flex; align-items:center; justify-content:center; pointer-events:none; z-index:2; }
  .shs-item b { padding:1px 5px; background:#fff; border:3px solid #111; border-radius:9px; box-shadow:0 3px 0 #111; font-size:calc(var(--t) * .42); line-height:1.1; white-space:nowrap; color:#111; }
  .shs-item.right b { box-shadow:0 0 0 4px #fff, 0 0 0 8px #00b86b; }
  .shs-goal { position:absolute; width:var(--t); height:var(--t); border-radius:50%; border:4px solid #ff4fa0; box-sizing:border-box; pointer-events:none; z-index:1; animation:shs-ping .6s ease-in-out infinite alternate; }
  /* Your trolley (--t): a wire basket on wheels, you riding in it */
  .shs-me { position:absolute; left:0; top:0; width:var(--t); height:var(--t); z-index:4; pointer-events:none; }
  .shs-me .ms { position:absolute; left:16%; top:-30%; }
  .shs-cart { position:absolute; left:6%; right:6%; top:38%; height:44%; border:3px solid #111; border-radius:3px 3px 10px 10px; z-index:2;
    background:repeating-linear-gradient(90deg, rgba(150,160,175,.9) 0 3px, transparent 3px 9px), repeating-linear-gradient(0deg, rgba(150,160,175,.9) 0 3px, transparent 3px 9px), rgba(255,255,255,.35); }
  .shs-cart::before { content:""; position:absolute; right:-18%; top:-16%; width:22%; height:12%; background:#e8173c; border:2px solid #111; border-radius:99px; }   /* handle */
  .shs-cart::after { content:""; position:absolute; left:6%; right:6%; bottom:-28%; height:24%; background:radial-gradient(circle, #111 0 40%, transparent 42%) 0 0 / 25% 100%; }   /* wheels */
  .shs-me.spin { animation:shs-spin .7s ease-in-out; }
  .shs-me.tip { transform-origin:50% 90%; }
  /* The shop-floor robot (--t) */
  .shs-bot { position:absolute; left:0; top:0; width:var(--t); height:var(--t); z-index:3; pointer-events:none; }
  .shs-bot > * { position:absolute; box-sizing:border-box; }
  .shs-bbody { left:16%; right:16%; top:30%; bottom:12%; background:#b8c4d0; border:3px solid #111; border-radius:8px; }
  .shs-bhead { left:22%; right:22%; top:4%; height:36%; background:#d7e0e8; border:3px solid #111; border-radius:50% 50% 12% 12%; z-index:2; }
  .shs-beye { top:14%; width:20%; aspect-ratio:1; background:#fff; border:2px solid #111; border-radius:50%; z-index:3; }
  .shs-beye.l { left:32%; } .shs-beye.r { right:32%; }
  .shs-beye::after { content:""; position:absolute; left:30%; top:30%; width:45%; aspect-ratio:1; border-radius:50%; background:#111; }
  .shs-bbrow { top:10%; width:22%; height:6%; background:#111; z-index:4; } .shs-bbrow.l { left:30%; transform:rotate(20deg); } .shs-bbrow.r { right:30%; transform:rotate(-20deg); }
  .shs-blight { left:44%; top:-6%; width:12%; height:12%; border-radius:50%; background:#ff4d6d; border:2px solid #111; animation:shs-blink .4s steps(2) infinite; z-index:3; }
  .shs-bwheel { bottom:2%; width:24%; height:14%; background:#333; border:2px solid #111; border-radius:99px; } .shs-bwheel.l { left:14%; } .shs-bwheel.r { right:14%; }
  .shs-fx { position:absolute; inset:0; pointer-events:none; z-index:8; overflow:visible; }
  .shs-word { position:absolute; transform:translate(-50%, -50%) rotate(-8deg); font-size:1.8rem; color:#ffd400; -webkit-text-stroke:2px #111; paint-order:stroke fill;
    text-shadow:0 4px 0 #111; white-space:nowrap; animation:shs-word 1s ease-out forwards; }
  .shs-word.bad { color:#ff5a6e; }
  @keyframes shs-ping { from { transform:scale(.6); opacity:.9; } to { transform:scale(1); opacity:.4; } }
  @keyframes shs-spin { to { rotate:720deg; } }
  @keyframes shs-blink { 50% { background:#ffd400; } }
  @keyframes shs-word { from { opacity:1; scale:.5; } 25% { scale:1.15; } 75% { opacity:1; } to { opacity:0; translate:0 -40px; } }
  @media (prefers-reduced-motion: reduce) { .shs-goal, .shs-blight, .shs-me.spin, .shs-word { animation:none !important; } }
  `;
  function injectCss() { if (document.getElementById("shs-css")) return; const s = document.createElement("style"); s.id = "shs-css"; s.textContent = CSS; document.head.appendChild(s); }

  registerMicrogame({
    id: "shopping-sweep",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 13000,
    input: "tap",
    tutorial: true,

    start(ctx) {
      injectCss();
      const speed = ctx.speed || 1;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const { tone, sweep, noise } = ctx.sfx;
      const K = speed >= 1.5 ? 3 : 2;   // items to grab
      const D = speed >= 1.5 ? 3 : 2;   // wrong items
      // K rows with one right each: the right ones are the shopping list (phonics: different pictures of the letter).
      const C = ctx.choiceRows(K, D + 1, { lowercase: true });
      const goods = [...C.rows.map((r) => r.find((o) => o.right)), ...C.rows[0].filter((o) => !o.right).slice(0, D)];
      const MAP = MAPS[Math.floor(Math.random() * MAPS.length)];
      const R = MAP.length, COLS = MAP[0].length;
      const open = (c, r) => r >= 0 && r < R && c >= 0 && c < COLS && MAP[r][c] === ".";
      const key = (c, r) => `${c},${r}`;
      const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

      // ---------- DOM ----------
      const wrap = document.createElement("div");
      wrap.className = "shs";
      const top = document.createElement("div");
      top.className = "shs-top";
      const card = document.createElement("button");
      card.className = "shs-card";
      card.setAttribute("aria-label", TEXT.cardLabel);
      card.innerHTML = '<span class="ct"></span>';
      card.firstChild.textContent = C.cardText;
      if (ctx.canSpeak && !C.listen) card.insertAdjacentHTML("beforeend", '<span class="spk">🔊</span>');
      card.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });
      const pips = document.createElement("div");
      pips.className = "shs-pips";
      pips.innerHTML = '<span class="shs-pip"></span>'.repeat(K);
      top.append(card, pips);
      const area = document.createElement("div");
      area.className = "shs-wrap";
      const board = document.createElement("div");
      board.className = "shs-board";
      area.appendChild(board);
      wrap.append(top, area);
      ctx.root.appendChild(wrap);

      for (let r = 0; r < R; r++) for (let c = 0; c < COLS; c++) {
        if (MAP[r][c] !== "#") continue;
        const s = document.createElement("div");
        s.className = "shs-shelf";
        s.style.setProperty("--sc", SHELF[(r * 3 + c) % SHELF.length]);
        s.style.left = `calc(var(--t) * ${c})`; s.style.top = `calc(var(--t) * ${r})`;
        board.appendChild(s);
      }

      // BFS over the floor. `avoid`: tiles to go round if there's another way.
      function bfs(from, to, avoid) {
        const prev = new Map([[key(...from), null]]), q = [from];
        while (q.length) {
          const [c, r] = q.shift();
          if (c === to[0] && r === to[1]) break;
          for (const [dc, dr] of DIRS) {
            const n = [c + dc, r + dr], k = key(...n);
            if (!open(...n) || prev.has(k) || (avoid && avoid.has(k) && !(n[0] === to[0] && n[1] === to[1]))) continue;
            prev.set(k, [c, r]); q.push(n);
          }
        }
        if (!prev.has(key(...to))) return null;
        const path = [];
        for (let p = to; p && !(p[0] === from[0] && p[1] === from[1]); p = prev.get(key(...p))) path.unshift(p);
        return path;
      }
      const dist = (a, b) => { const p = bfs(a, b); return p ? p.length : 99; };

      // Where everyone starts: you at the bottom middle, the robot at the open tile farthest from you.
      const floor = [];
      for (let r = 0; r < R; r++) for (let c = 0; c < COLS; c++) if (open(c, r)) floor.push([c, r]);
      const meStart = [Math.floor(COLS / 2), R - 1];
      const botStart = floor.reduce((a, t) => (dist(meStart, t) > dist(meStart, a) ? t : a), floor[0]);
      // Items: on floor tiles away from both starts, spread out.
      const spots = ctx.shuffle(floor.filter((t) => dist(meStart, t) >= 2 && dist(botStart, t) >= 3));
      const items = [];
      for (const o of goods) {
        const t = spots.find((s) => !items.some((it) => Math.abs(it.c - s[0]) + Math.abs(it.r - s[1]) < 2));
        if (!t) break;
        spots.splice(spots.indexOf(t), 1);
        const el = document.createElement("div");
        el.className = "shs-item";
        el.innerHTML = "<b></b>";
        el.firstChild.textContent = o.text;
        el.style.left = `calc(var(--t) * ${t[0]})`; el.style.top = `calc(var(--t) * ${t[1]})`;
        board.appendChild(el);
        items.push({ o, el, c: t[0], r: t[1], gone: false });
      }
      const need = items.filter((it) => it.o.right).length;

      const me = document.createElement("div");
      me.className = "shs-me";
      const fig = window.Mascot ? window.Mascot.el("calc(var(--t) * .68)") : document.createElement("div");
      me.append(fig);
      me.insertAdjacentHTML("beforeend", '<div class="shs-cart"></div>');
      const bot = document.createElement("div");
      bot.className = "shs-bot";
      bot.innerHTML = '<div class="shs-bwheel l"></div><div class="shs-bwheel r"></div><div class="shs-bbody"></div><div class="shs-bhead"></div><div class="shs-blight"></div>' +
        '<div class="shs-beye l"></div><div class="shs-beye r"></div><div class="shs-bbrow l"></div><div class="shs-bbrow r"></div>';
      const goalEl = document.createElement("div");
      goalEl.className = "shs-goal"; goalEl.hidden = true;
      const fx = document.createElement("div");
      fx.className = "shs-fx";
      board.append(goalEl, me, bot, fx);

      let T = 50;
      function layout() {
        const w = area.clientWidth, h = area.clientHeight;
        const bw = Math.max(200, Math.min(w - 16, h - 12, 560));
        T = (bw - 10) / COLS;
        board.style.setProperty("--bw", `${bw}px`);
        board.style.setProperty("--t", `${T}px`);
        items.forEach((it) => { if (it.o.kind === "word") it.el.firstChild.style.fontSize = `${Math.min(T * 0.4, (T * 1.25) / ([...it.o.text].length * 0.62))}px`; });
        draw();
      }

      // ---------- Movers ----------
      const you = { x: meStart[0], y: meStart[1], path: [], stun: 0 };
      const rob = { x: botStart[0], y: botStart[1], path: [], wait: 1.3 };
      const youV = 3.2 + 0.25 * (speed - 1), robV = 1.0 + 1.1 * (speed - 1);
      function draw() {
        me.style.transform = `translate(${(you.x * T).toFixed(1)}px, ${(you.y * T).toFixed(1)}px)`;
        bot.style.transform = `translate(${(rob.x * T).toFixed(1)}px, ${(rob.y * T).toFixed(1)}px)`;
      }
      const tileOf = (m) => (m.path.length ? m.path[0] : [Math.round(m.x), Math.round(m.y)]);
      function step(m, v, dt) {
        if (!m.path.length) return false;
        const [tc, tr] = m.path[0];
        const dx = tc - m.x, dy = tr - m.y, d = Math.hypot(dx, dy), s = v * dt;
        if (d <= s) { m.x = tc; m.y = tr; m.path.shift(); return true; }
        m.x += (dx / d) * s; m.y += (dy / d) * s;
        return false;
      }

      // ---------- Steering: tap a spot, roll there ----------
      let done = false;
      function goTo(t) {
        if (done || ctx.ended) return;
        const from = tileOf(you);
        const avoid = new Set(items.filter((it) => !it.gone && !it.o.right).map((it) => key(it.c, it.r)));
        const p = bfs(from, t, avoid) || bfs(from, t);
        if (!p) return;
        // (keep rolling to the tile we're on the way to, then follow the new path)
        you.path = you.path.length ? [you.path[0], ...p] : p;
        goalEl.hidden = false;
        goalEl.style.left = `${t[0] * T}px`; goalEl.style.top = `${t[1] * T}px`;
        tone(660, 0.04, "square", 0.05);
      }
      function nearestFloor(px, py) {
        let best = null, bd = 1e9;
        for (const t of floor) { const d = Math.hypot(t[0] + 0.5 - px / T, t[1] + 0.5 - py / T); if (d < bd) { bd = d; best = t; } }
        return best;
      }
      board.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        const r = board.getBoundingClientRect();
        goTo(nearestFloor(e.clientX - r.left - 5, e.clientY - r.top - 5));
      });
      function onKey(e) {
        const d = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] }[e.key];
        if (d) {
          e.preventDefault();
          let [c, r] = tileOf(you);
          while (open(c + d[0], r + d[1])) { c += d[0]; r += d[1]; }
          goTo([c, r]);
        } else if (e.key === " ") { e.preventDefault(); replay(); }
      }
      document.addEventListener("keydown", onKey);

      // ---------- Grabbing ----------
      let got = 0;
      function arrive() {
        const c = Math.round(you.x), r = Math.round(you.y);
        if (!you.path.length) goalEl.hidden = true;
        const it = items.find((x) => !x.gone && x.c === c && x.r === r);
        if (!it) return;
        it.gone = true;
        if (it.o.right) {
          it.el.animate([{ transform: "none" }, { transform: "translateY(-40%) scale(.3)", opacity: 0 }], { duration: 300, fill: "forwards" });
          [784, 1047].forEach((f, k) => tone(f, 0.1, "triangle", 0.1, k * 0.08));   // ding!
          pips.children[got].classList.add("on");
          got++;
          word(TEXT.got[(got - 1) % TEXT.got.length], false, (c + 0.5) * T, r * T);
          if (it.o.kind === "pic") ctx.say(it.o.spoken);
          if (got >= need) { done = true; ctx.win(); checkout(); }
        } else {
          // A wrong item: the trolley spins out and stops for a moment.
          it.el.animate([{ transform: "none" }, { transform: `translate(${T}px, ${-T * 0.6}px) rotate(200deg)`, opacity: 0 }], { duration: 500, fill: "forwards" });
          me.classList.remove("spin"); void me.offsetWidth; me.classList.add("spin");
          sweep(900, 200, 0.5, "sawtooth", 0.07); noise(0.2, "lowpass", 800, 300, 0.3);
          word(TEXT.oops, true, (c + 0.5) * T, r * T);
          you.path = []; you.stun = 0.75; goalEl.hidden = true;
          if (it.o.kind === "pic") ctx.say(it.o.spoken);
        }
      }
      function checkout() {
        goalEl.hidden = true;
        if (window.Mascot) window.Mascot.mood(fig, "cheer");
        [523, 659, 784, 1047, 1319].forEach((f, k) => tone(f, 0.12, "triangle", 0.1, k * 0.08));   // ka-ching
        noise(0.15, "highpass", 4000, 2000, 0.2, 0.4);
        word(TEXT.checkout, false, board.clientWidth / 2, board.clientHeight * 0.3);
        ctx.confetti(fx, (you.x + 0.5) * T, you.y * T, { count: 80 });
        ctx.say(C.answer);
      }
      function caught() {
        done = true;
        ctx.lose();
        goalEl.hidden = true;
        if (window.Mascot) window.Mascot.mood(fig, "sad");
        me.animate([{ rotate: "0deg" }, { rotate: "80deg" }], { duration: 300, fill: "forwards" });
        tone(300, 0.1, "square", 0.1); tone(200, 0.1, "square", 0.1, 0.12); tone(120, 0.25, "square", 0.1, 0.24);
        word(TEXT.gotcha, true, (rob.x + 0.5) * T, rob.y * T);
        ctx.later(showAnswer, 500);
      }
      function showAnswer() { items.forEach((it) => { if (!it.gone && it.o.right) it.el.classList.add("right"); }); ctx.say(C.answer); }
      function word(text, bad, x, y) {
        const w = document.createElement("div");
        w.className = "shs-word" + (bad ? " bad" : "");
        w.textContent = text;
        w.style.left = `${Math.max(80, Math.min(board.clientWidth - 80, x))}px`; w.style.top = `${Math.max(26, y)}px`;
        fx.appendChild(w);
        ctx.later(() => w.remove(), 1000);
      }
      function replay() { if (!done) ctx.say(C.prompt); }

      // ---------- The loop ----------
      let last = null, started = false;
      function frame(ts) {
        const dt = last == null ? 0 : Math.min(50, ts - last) / 1000;
        last = ts;
        if (!done && !ctx.ended && started) {
          if (you.stun > 0) you.stun -= dt;
          else if (step(you, youV, dt)) arrive();
          // The robot waits a moment, then chases along the shortest way (sometimes a wrong turn, at the slow speeds).
          if (!ctx.demo) {
            if (rob.wait > 0) rob.wait -= dt;
            else {
              if (!rob.path.length) {
                const from = [Math.round(rob.x), Math.round(rob.y)];
                const p = bfs(from, tileOf(you));
                if (p && p.length) {
                  let next = p[0];
                  if (Math.random() < Math.max(0, 0.3 - 0.25 * (speed - 1))) {
                    // (a wrong turn, but never straight back the way it came)
                    const opts = DIRS.map(([dc, dr]) => [from[0] + dc, from[1] + dr]).filter((t) => open(...t) && !(rob.prev && t[0] === rob.prev[0] && t[1] === rob.prev[1]));
                    next = opts[Math.floor(Math.random() * opts.length)] || next;
                  }
                  rob.prev = from;
                  rob.path = [next];
                }
              }
              step(rob, robV, dt);
            }
            if (Math.hypot(rob.x - you.x, rob.y - you.y) < 0.6) caught();
          }
          draw();
        }
        if (!ctx.ended) ctx.raf(frame);
      }

      ctx.onTimeout(() => { done = true; goalEl.hidden = true; if (window.Mascot) window.Mascot.mood(fig, "sad"); showAnswer(); });

      layout();
      const ro = new ResizeObserver(layout);
      ro.observe(area);
      ctx.say(C.prompt);
      const wait = ctx.reveal(card);
      ctx.later(() => { started = true; }, wait || 0);
      ctx.raf(frame);
      // A small finger-only hint on an empty floor tile beside you (never on an item).
      ctx.later(() => {
        const t = floor.find((f) => Math.abs(f[0] - meStart[0]) + Math.abs(f[1] - meStart[1]) === 1 && !items.some((it) => it.c === f[0] && it.r === f[1]));
        if (t) { const br = board.getBoundingClientRect(), rr = ctx.root.getBoundingClientRect(); ctx.hint({ x: br.left - rr.left + 5 + (t[0] + 0.5) * T, y: br.top - rr.top + 5 + (t[1] + 0.5) * T }, null, { small: true }); }
      }, (wait || 0) + 100);

      // Tutorial: point at the card, then tap each right item in turn and wait for the trolley to grab it.
      ctx.tutorial(C.target, async (f) => {
        await f.point(card, 900);
        await f.until(() => started, 3000);
        for (let n = 0; n < need && !done; n++) {
          const it = items.filter((x) => x.o.right && !x.gone).sort((a, b) => dist(tileOf(you), [a.c, a.r]) - dist(tileOf(you), [b.c, b.r]))[0];
          if (!it) break;
          await f.tap(it.el);
          await f.until(() => it.gone || done, 6000);
        }
      });
      return () => { done = true; ro.disconnect(); document.removeEventListener("keydown", onKey); };
    },
  });
})();
