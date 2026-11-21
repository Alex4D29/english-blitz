// SACK MAN — a little sack monster in a maze of cardboard boxes. A card at the top shows the target
// (and the voice says it). Swipe up/down/left/right to steer (arrow keys too): the sack keeps going in
// that direction and turns at the next opening, like a classic maze chase. Eat every target to win.
// Eating a wrong one makes the sack sad and stops it for a moment. A pair of scissors chases the sack;
// if they catch it, SNIP — the sack is cut in half and cries.
//
// Letter list: tiles hold letters (look-alike decoys). Phonics: the card is a letter, the targets are
// pictures that start with it. CVC: the card is a word, the targets are its picture. HFW: the card is
// 🔊, the targets are the word. 2 targets, 3 from 1.5×. Targets are placed within reach of the time
// limit (each within a few steps of the last), and away from the scissors. The scissors wait a moment,
// then chase along the shortest path; at 1× they're slow and often wander, and from 1.5× they hunt and
// speed up (faster than the sack from about 2.25×).
(function () {
  const TEXT = {
    name: { en: "Sack Man" },
    icon: "💰", // the closest emoji to a tied sack
    howTo: (list) => {
      const what = {
        letter: ["🔤", "Look at the card, like \"A\". Eat all the A's!"],
        phonics: ["🔤", "Look at the letter, like \"B\". Eat all the pictures that start with it: ball, bee…"],
        cvc: ["📝", "Look at the word, like \"cat\". Eat all the cat pictures!"],
        hfw: ["👂", "Listen to the word, like \"the\". Eat all of them!"],
      }[list.type] || ["👀", "Look at the card."];
      return { en: {
        steps: [
          what,
          ["👆", "Tap where you want the sack to go, and it walks there. (Swiping works too!)"],
          ["✂️", "Watch out for the scissors!"],
        ],
        tips: [
          "Tap the card to hear it again.",
          "Eat a wrong one and the sack stops for a moment, feeling sick.",
          "If the scissors catch the sack… SNIP! Run away!",
          "When the game speeds up, there are 3 to eat and the scissors get faster.",
        ],
      } };
    },
    instruction: { en: "EAT THEM\nALL!" },
    listen: "🔊",
    answer: (letter, word) => `${letter} for ${word}`,
    cardLabel: "Hear it again",
  };

  // Mazes, 9 × 11 ("#" box, "." floor). Loops everywhere so there's always a way round the scissors.
  const MAZES = [
    ["#########",
     "#.......#",
     "#.##.##.#",
     "#.......#",
     "#.#.#.#.#",
     "#...#...#",
     "#.#.#.#.#",
     "#.......#",
     "#.##.##.#",
     "#.......#",
     "#########"],
    ["#########",
     "#...#...#",
     "#.#...#.#",
     "#.#.#.#.#",
     "#.......#",
     "###.#.###",
     "#.......#",
     "#.#.#.#.#",
     "#.#...#.#",
     "#...#...#",
     "#########"],
    ["#########",
     "#.......#",
     "#.#.#.#.#",
     "#.#...#.#",
     "#...#...#",
     "#.#.#.#.#",
     "#.......#",
     "##.###.##",
     "#...#...#",
     "#.......#",
     "#########"],
  ];
  const DIRS = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };
  const OPP = { left: "right", right: "left", up: "down", down: "up" };

  const CSS = `
  .sk { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:8px; padding-bottom:8px; touch-action:none; }
  .sk-top { flex:none; display:flex; align-items:center; gap:12px; }
  .sk-card { position:relative; min-width:78px; height:68px; padding:0 16px; border-radius:16px; font:inherit; font-size:2.4rem; line-height:1;
    background:#fff; color:#111; border:5px solid #111; box-shadow:0 6px 0 #111; display:flex; align-items:center; justify-content:center; gap:6px;
    cursor:pointer; touch-action:manipulation; animation:sk-in .3s cubic-bezier(.2,1.8,.4,1) both; }
  .sk-card .spk { font-size:1.2rem; opacity:.6; }
  .sk-pips { display:flex; gap:4px; font-size:1.6rem; line-height:1; }
  .sk-pip { filter:grayscale(1) opacity(.35); transition:filter .2s; }
  .sk-pip.on { filter:none; animation:sk-in .3s cubic-bezier(.2,1.8,.4,1); }
  .sk-stage { position:relative; flex:1; min-height:0; width:100%; display:flex; align-items:center; justify-content:center; }
  .sk-board { position:relative; background:#fff3d6; border:5px solid #111; border-radius:12px; box-shadow:0 7px 0 #111; overflow:hidden;
    background-image:radial-gradient(circle, rgba(201,145,90,.25) 1.5px, transparent 2px); background-size:var(--ts) var(--ts); }
  .sk-wall { position:absolute; width:var(--ts); height:var(--ts); padding:2px; }
  .sk-wall i { display:block; width:100%; height:100%; background:#d39b5f; border:3px solid #111; border-radius:6px;
    box-shadow:inset 0 -4px 0 rgba(0,0,0,.15); position:relative; }
  .sk-wall i::after { content:""; position:absolute; left:42%; top:-3px; bottom:-3px; width:16%; background:#e9c48f; }
  .sk-item { position:absolute; width:var(--ts); height:var(--ts); display:flex; align-items:center; justify-content:center; }
  .sk-item b { display:flex; align-items:center; justify-content:center; min-width:80%; height:80%; padding:0 3px; border-radius:999px; background:#fff;
    border:3px solid #111; color:#111; font-size:calc(var(--ts) * .5); line-height:1; white-space:nowrap; box-shadow:0 3px 0 rgba(0,0,0,.25); font-weight:900; }
  .sk-item.pic b { font-size:calc(var(--ts) * .5); }
  .sk-item.eaten { animation:sk-gulp .25s ease-in forwards; }
  .sk-item.left b { box-shadow:0 0 0 4px #fff, 0 0 0 7px #00b86b; }
  .sk-item.left { animation:sk-wiggle .4s ease-in-out infinite; }

  .sk-goal { position:absolute; width:var(--ts); height:var(--ts); pointer-events:none; z-index:2; }
  .sk-goal::before { content:""; position:absolute; inset:12%; border:4px dashed #ff2e88; border-radius:50%; animation:sk-goal .6s ease-in-out infinite alternate; }
  @keyframes sk-goal { from { transform:scale(.8); } to { transform:scale(1.05); } }
  .sk-sack, .sk-snip { position:absolute; left:0; top:0; width:var(--ts); height:var(--ts); will-change:transform; z-index:3; }
  .sk-half { position:absolute; inset:0; transition:transform .5s cubic-bezier(.3,1.4,.5,1); }
  .sk-half.l { clip-path:polygon(0 0, 54% 0, 46% 100%, 0 100%); }
  .sk-half.r { clip-path:polygon(54% 0, 100% 0, 100% 100%, 46% 100%); }
  .sk-sack.cut .sk-half.l { transform:translate(-22%, 8%) rotate(-24deg); }
  .sk-sack.cut .sk-half.r { transform:translate(22%, 8%) rotate(24deg); }
  .sk-bag { position:absolute; left:8%; right:8%; top:24%; bottom:4%; background:#c9a26b; border:3px solid #111; border-radius:42% 42% 38% 38% / 34% 34% 50% 50%;
    box-shadow:inset -4px -4px 0 rgba(0,0,0,.18); }
  .sk-bag::before { content:""; position:absolute; left:18%; top:30%; width:12%; height:30%; border-left:2px dashed rgba(0,0,0,.25); }
  .sk-neck { position:absolute; left:30%; right:30%; top:6%; height:24%; background:#c9a26b; border:3px solid #111; border-radius:30% 30% 10% 10%; }
  .sk-neck::before, .sk-neck::after { content:""; position:absolute; top:-40%; width:40%; height:60%; background:#c9a26b; border:3px solid #111; border-radius:50% 50% 20% 20%; }
  .sk-neck::before { left:-24%; transform:rotate(-20deg); } .sk-neck::after { right:-24%; transform:rotate(20deg); }
  .sk-rope { position:absolute; left:26%; right:26%; top:24%; height:9%; background:#e8173c; border:2px solid #111; border-radius:99px; z-index:1; }
  .sk-eye { position:absolute; top:40%; width:18%; height:20%; background:#fff; border:2px solid #111; border-radius:50%; z-index:1; }
  .sk-eye.l { left:26%; } .sk-eye.r { right:26%; }
  .sk-eye::after { content:""; position:absolute; left:50%; top:50%; width:50%; height:50%; margin:-25% 0 0 -25%; background:#111; border-radius:50%;
    transform:translate(var(--lx, 0), var(--ly, 0)); }
  .sk-mouth { position:absolute; left:50%; top:66%; width:28%; height:16%; margin-left:-14%; background:#4a0d1a; border:2px solid #111; border-radius:0 0 99px 99px; z-index:1; }
  .sk-sack.moving .sk-mouth { animation:sk-chomp .22s ease-in-out infinite alternate; }
  .sk-sack.happy .sk-in { animation:sk-hop .3s cubic-bezier(.2,1.6,.4,1) 2; }
  .sk-sack.happy .sk-eye { height:8%; top:46%; border-radius:99px 99px 0 0; }
  .sk-sack.sad .sk-mouth, .sk-sack.cut .sk-mouth { border-radius:99px 99px 0 0; height:9%; top:70%; animation:none; }
  .sk-sack.sad .sk-bag, .sk-sack.sad .sk-neck { background:#a8b86b; }
  .sk-sack.sad .sk-in { animation:sk-shake .15s linear 3; }
  .sk-in { position:absolute; inset:0; }
  .sk-tear { position:absolute; font-size:calc(var(--ts) * .3); animation:sk-tear .6s ease-in infinite; z-index:4; }

  .sk-snip { display:flex; align-items:center; justify-content:center; font-size:calc(var(--ts) * .8); line-height:1; z-index:4; }
  .sk-snip span { display:block; animation:sk-snipsnap .3s ease-in-out infinite alternate; filter:drop-shadow(0 3px 0 rgba(0,0,0,.35)); }
  .sk-snip.wait span { animation:none; opacity:.75; }
  .sk-fx { position:absolute; inset:0; pointer-events:none; overflow:visible; z-index:5; }

  @keyframes sk-in { from { transform:scale(.5); opacity:0; } }
  @keyframes sk-gulp { to { transform:scale(.2); opacity:0; } }
  @keyframes sk-wiggle { 25% { transform:rotate(-10deg) scale(1.1); } 75% { transform:rotate(10deg) scale(1.1); } }
  @keyframes sk-chomp { from { transform:scaleY(.3); } to { transform:scaleY(1.2); } }
  @keyframes sk-hop { 50% { transform:translateY(-30%); } }
  @keyframes sk-shake { 25% { transform:translateX(-10%); } 75% { transform:translateX(10%); } }
  @keyframes sk-tear { from { transform:translateY(0); opacity:1; } to { transform:translateY(120%); opacity:0; } }
  @keyframes sk-snipsnap { from { transform:rotate(var(--rot)) scale(1); } to { transform:rotate(calc(var(--rot) + 14deg)) scale(1.1); } }
  @media (prefers-reduced-motion: reduce) {
    .sk-card, .sk-pip.on, .sk-item.left, .sk-sack.moving .sk-mouth, .sk-sack.happy .sk-in, .sk-sack.sad .sk-in, .sk-tear, .sk-snip span { animation:none !important; }
  }`;

  const SACK_HTML = '<div class="sk-in"><div class="sk-neck"></div><div class="sk-bag"></div><div class="sk-rope"></div>' +
    '<div class="sk-eye l"></div><div class="sk-eye r"></div><div class="sk-mouth"></div></div>';

  function injectCss() {
    if (document.getElementById("sk-css")) return;
    const style = document.createElement("style");
    style.id = "sk-css";
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  registerMicrogame({
    id: "sack-man",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 12000,
    input: "tap",
    tutorial: true, // has a ctx.tutorial script

    start(ctx) {
      injectCss();
      const type = ctx.list.type;
      const speed = ctx.speed || 1;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const K = speed >= 1.5 ? 3 : 2;           // targets to eat
      const ND = speed >= 1.5 ? 3 : 2;          // decoys
      const letterName = (it) => it.say || it.text.toUpperCase();
      const { tone, sweep, noise } = ctx.sfx;

      // ---------- Content ----------
      // goods / bads: [{ text, kind, spoken }]
      let cardText, prompt, goods, bads, kind, answerItem; // answerItem: the list item the round is about (tutorial)
      if (type === "phonics") {
        const letter = ctx.items.find((it) => ctx.phonics.pics(it).length >= K) || ctx.items.find((it) => ctx.phonics.pics(it).length) || ctx.items[0];
        answerItem = letter;
        const set = ctx.phonics.set(letter, K, ND);
        cardText = letter.text.toUpperCase();
        prompt = letterName(letter);
        kind = "pic";
        goods = [...Array(K)].map((_, i) => set.right[i % set.right.length]).map((p) => ({ text: p.emoji, spoken: p.word }));
        bads = set.wrong.map((p) => ({ text: p.emoji, spoken: p.word }));
      } else if (type === "cvc") {
        const pool = ctx.items.filter((it) => it.emoji);
        const target = pool[0];
        answerItem = target;
        const picks = [];
        for (const o of [...ctx.pickOptions(target, 12), ...ctx.shuffle(pool.slice())]) {
          if (picks.length >= ND) break;
          if (o !== target && o.emoji && o.emoji !== target.emoji && !picks.includes(o)) picks.push(o);
        }
        cardText = target.text;
        prompt = target.say || target.text;
        kind = "pic";
        goods = [...Array(K)].map(() => ({ text: target.emoji, spoken: prompt }));
        bads = picks.map((o) => ({ text: o.emoji, spoken: o.say || o.text }));
      } else if (type === "hfw") {
        const target = ctx.items[0];
        answerItem = target;
        cardText = ctx.canSpeak ? TEXT.listen : target.text;
        prompt = target.say || target.text;
        kind = "word";
        goods = [...Array(K)].map(() => ({ text: target.text, spoken: prompt }));
        bads = ctx.pickOptions(target, ND + 2).filter((o) => o !== target).slice(0, ND).map((o) => ({ text: o.text, spoken: o.say || o.text }));
      } else {
        const target = ctx.items[0];
        answerItem = target;
        cardText = target.text;
        prompt = letterName(target);
        kind = "letter";
        goods = [...Array(K)].map(() => ({ text: target.text, spoken: prompt }));
        bads = ctx.pickOptions(target, ND + 2).filter((o) => o !== target && o.text !== target.text).slice(0, ND)
          .map((o) => ({ text: o.text, spoken: letterName(o) }));
      }

      // ---------- Maze ----------
      const maze = ctx.pick(MAZES);
      const ROWS = maze.length, COLS = maze[0].length;
      const open = (c, r) => r >= 0 && r < ROWS && c >= 0 && c < COLS && maze[r][c] !== "#";
      const key = (c, r) => r * COLS + c;
      // Shortest-path distances from (c0, r0). `blocked` (a Set of keys) are tiles to route around.
      function bfs(c0, r0, blocked) {
        const dist = new Array(ROWS * COLS).fill(-1);
        const q = [[c0, r0]];
        dist[key(c0, r0)] = 0;
        while (q.length) {
          const [c, r] = q.shift();
          for (const [dc, dr] of Object.values(DIRS)) {
            const nc = c + dc, nr = r + dr;
            if (open(nc, nr) && dist[key(nc, nr)] < 0 && !(blocked && blocked.has(key(nc, nr)))) {
              dist[key(nc, nr)] = dist[key(c, r)] + 1; q.push([nc, nr]);
            }
          }
        }
        return dist;
      }
      const floor = [];
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (open(c, r)) floor.push([c, r]);
      // The sack starts near the bottom middle; the scissors at the farthest tile from it.
      const start = floor.slice().sort((a, b) => Math.hypot(a[0] - 4, a[1] - 9) - Math.hypot(b[0] - 4, b[1] - 9))[0];
      const fromStart = bfs(start[0], start[1]);
      const snipStart = floor.slice().sort((a, b) => fromStart[key(b[0], b[1])] - fromStart[key(a[0], a[1])])[0];
      const fromSnip = bfs(snipStart[0], snipStart[1]);

      // ---------- Speeds ----------
      const sackV = 3.2 + 0.4 * (speed - 1);              // tiles per second
      const snipV = 1.15 + 1.45 * (speed - 1);             // 1.15 at 1× … 3.3 at 2.5×
      const wander = Math.max(0, 0.5 - 0.35 * (speed - 1)); // chance to take a random turn
      let snipDelay = 1200 / Math.min(speed, 1.6); // + the reveal, below

      // Place targets as a short tour from the start, each within reach of the last.
      const reach = Math.max(3, Math.floor((sackV * (ctx.paceMs / 1000) * 0.55) / K));
      const used = new Set([key(...start), key(...snipStart)]);
      const tiles = [];
      let prev = start;
      for (const g of goods) {
        const dPrev = bfs(prev[0], prev[1]);
        let cands = floor.filter(([c, r]) => !used.has(key(c, r)) && dPrev[key(c, r)] >= 2 && dPrev[key(c, r)] <= reach && fromSnip[key(c, r)] >= 3);
        if (!cands.length) cands = floor.filter(([c, r]) => !used.has(key(c, r)) && fromSnip[key(c, r)] >= 2);
        const t = ctx.pick(cands);
        used.add(key(...t));
        tiles.push({ c: t[0], r: t[1], good: true, ...g });
        prev = t;
      }
      for (const b of bads) {
        const cands = floor.filter(([c, r]) => !used.has(key(c, r)) && fromStart[key(c, r)] >= 2);
        if (!cands.length) break;
        const t = ctx.pick(cands);
        used.add(key(...t));
        tiles.push({ c: t[0], r: t[1], good: false, ...b });
      }

      // ---------- DOM ----------
      const wrap = document.createElement("div");
      wrap.className = "sk";
      const top = document.createElement("div");
      top.className = "sk-top";
      const card = document.createElement("button");
      card.className = "sk-card";
      card.setAttribute("aria-label", TEXT.cardLabel);
      card.innerHTML = '<span class="ct"></span>';
      card.firstChild.textContent = cardText;
      if (ctx.canSpeak && cardText !== TEXT.listen) card.insertAdjacentHTML("beforeend", '<span class="spk">🔊</span>');
      card.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); replay(); });
      const pips = document.createElement("div");
      pips.className = "sk-pips";
      pips.innerHTML = '<span class="sk-pip">⭐</span>'.repeat(K);
      top.append(card, pips);
      const stage = document.createElement("div");
      stage.className = "sk-stage";
      const board = document.createElement("div");
      board.className = "sk-board";
      stage.appendChild(board);
      wrap.append(top, stage);
      ctx.root.appendChild(wrap);

      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        if (open(c, r)) continue;
        // The outer border is the board's own edge; only inner boxes are drawn.
        if (r === 0 || c === 0 || r === ROWS - 1 || c === COLS - 1) continue;
        const w = document.createElement("div");
        w.className = "sk-wall";
        w.style.left = `calc(var(--ts) * ${c - 1})`;
        w.style.top = `calc(var(--ts) * ${r - 1})`;
        w.innerHTML = "<i></i>";
        board.appendChild(w);
      }
      tiles.forEach((t) => {
        const el = document.createElement("div");
        el.className = "sk-item" + (kind === "pic" ? " pic" : "");
        el.style.left = `calc(var(--ts) * ${t.c - 1})`;
        el.style.top = `calc(var(--ts) * ${t.r - 1})`;
        el.innerHTML = "<b></b>";
        el.firstChild.textContent = t.text;
        board.appendChild(el);
        t.el = el;
      });
      const goalEl = document.createElement("div"); // where a tap sent the sack
      goalEl.className = "sk-goal";
      goalEl.style.display = "none";
      board.appendChild(goalEl);
      const sackEl = document.createElement("div");
      sackEl.className = "sk-sack";
      sackEl.innerHTML = `<div class="sk-half l">${SACK_HTML}</div><div class="sk-half r">${SACK_HTML}</div>`;
      const snipEl = document.createElement("div");
      snipEl.className = "sk-snip wait";
      snipEl.innerHTML = "<span>✂️</span>";
      const fx = document.createElement("div");
      fx.className = "sk-fx";
      board.append(sackEl, snipEl, fx);

      // Board size: the inner 7 × 9 tiles fill the stage.
      let TS = 40;
      function measure() {
        const r = stage.getBoundingClientRect();
        TS = Math.max(24, Math.floor(Math.min((r.width - 24) / (COLS - 2), (r.height - 16) / (ROWS - 2))));
        board.style.setProperty("--ts", `${TS}px`);
        board.style.width = `${TS * (COLS - 2) + 10}px`;
        board.style.height = `${TS * (ROWS - 2) + 10}px`;
        if (kind === "word") {
          const longest = Math.max(...tiles.map((t) => t.text.length));
          const fs = Math.min(TS * 0.42, (TS * 1.25) / (longest * 0.6));
          tiles.forEach((t) => { t.el.firstChild.style.fontSize = `${fs}px`; });
        }
        render();
      }

      // ---------- Movers ----------
      // A mover goes from tile `from` to tile `to`; t is 0 → 1 along the way.
      const mover = (c, r) => ({ from: [c, r], to: [c, r], t: 1, dir: null });
      const sack = mover(...start), snip = mover(...snipStart);
      let want = null, goal = null, stunUntil = 0, done = false, eaten = 0;
      const pos = (m) => [m.from[0] + (m.to[0] - m.from[0]) * m.t, m.from[1] + (m.to[1] - m.from[1]) * m.t];
      const canGo = (tile, d) => d && open(tile[0] + DIRS[d][0], tile[1] + DIRS[d][1]);
      function step(m, v, dt, choose) {
        let left = v * dt;
        while (left > 0) {
          if (m.t >= 1) {
            m.from = m.to;
            if (m === sack) { arrive(); if (done || performance.now() < stunUntil) return; }
            const d = choose(m.from);
            if (!d) { m.dir = null; return; }
            m.dir = d;
            m.to = [m.from[0] + DIRS[d][0], m.from[1] + DIRS[d][1]];
            m.t = 0;
          }
          const take = Math.min(left, 1 - m.t);
          m.t += take;
          left -= take;
        }
      }
      // The sack: walking to a tapped tile (shortest path, around wrong items when it can), or the
      // swiped direction when it's open, otherwise carry on, otherwise stop.
      function sackChoose(tile) {
        if (goal) {
          if (tile[0] === goal[0] && tile[1] === goal[1]) { setGoal(null); return null; }
          return stepToward(tile, goal);
        }
        if (canGo(tile, want)) return want;
        if (canGo(tile, sack.dir)) return sack.dir;
        return null;
      }
      // Distances to the goal, avoiding uneaten wrong items (unless the goal is one, or there's no other way).
      function goalDist(g) {
        const avoid = new Set(tiles.filter((x) => !x.good && !x.gone && !(x.c === g[0] && x.r === g[1])).map((x) => key(x.c, x.r)));
        const d = bfs(g[0], g[1], avoid);
        const [fc, fr] = sack.t >= 1 ? sack.to : sack.from;
        return d[key(fc, fr)] >= 0 || d[key(...sack.to)] >= 0 ? d : bfs(g[0], g[1]);
      }
      function stepToward(tile, g) {
        const dist = goalDist(g);
        let best = null, bd = Infinity;
        for (const d of Object.keys(DIRS)) {
          if (!canGo(tile, d)) continue;
          const nd = dist[key(tile[0] + DIRS[d][0], tile[1] + DIRS[d][1])];
          if (nd >= 0 && nd < bd) { bd = nd; best = d; }
        }
        return best;
      }
      function setGoal(g) {
        goal = g;
        goalEl.style.display = g ? "" : "none";
        if (!g || done) return;
        goalEl.style.left = `calc(var(--ts) * ${g[0] - 1})`;
        goalEl.style.top = `calc(var(--ts) * ${g[1] - 1})`;
        want = null;
        // Mid-tile and the goal is behind us? Turn round at once.
        if (sack.dir && sack.t < 1) {
          const dist = goalDist(g);
          const df = dist[key(...sack.from)], dt = dist[key(...sack.to)];
          if (df >= 0 && (dt < 0 || df < dt)) {
            [sack.from, sack.to] = [sack.to, sack.from];
            sack.t = 1 - sack.t;
            sack.dir = OPP[sack.dir];
          }
        }
      }
      // The scissors: the next step on the shortest path to the sack, sometimes a random turn.
      function snipChoose(tile) {
        const opts = Object.keys(DIRS).filter((d) => canGo(tile, d));
        const fwd = opts.filter((d) => d !== OPP[snip.dir]);
        if (Math.random() < wander && fwd.length) return ctx.pick(fwd);
        const sp = pos(sack);
        const goal = [Math.round(sp[0]), Math.round(sp[1])];
        const dist = bfs(goal[0], goal[1]);
        let best = null, bd = Infinity;
        for (const d of opts) {
          const nd = dist[key(tile[0] + DIRS[d][0], tile[1] + DIRS[d][1])];
          if (nd >= 0 && nd < bd) { bd = nd; best = d; }
        }
        return best;
      }

      function setWant(d) {
        if (done) return;
        setGoal(null);
        want = d;
        // Reverse at once, mid-tile, so the sack feels responsive.
        if (sack.dir && d === OPP[sack.dir] && sack.t < 1) {
          [sack.from, sack.to] = [sack.to, sack.from];
          sack.t = 1 - sack.t;
          sack.dir = d;
        }
      }

      // Eating happens the moment the sack reaches a tile's centre.
      function arrive() {
        const [c, r] = sack.from;
        const t = tiles.find((x) => !x.gone && x.c === c && x.r === r);
        if (t) eat(t);
      }
      function eat(t) {
        t.gone = true;
        t.el.classList.add("eaten");
        if (t.good) {
          eaten++;
          pips.children[eaten - 1].classList.add("on");
          tone(660, 0.07, "square", 0.1);
          tone(990, 0.1, "square", 0.1, 0.07);
          sackEl.classList.remove("happy"); void sackEl.offsetWidth; sackEl.classList.add("happy");
          const [x, y] = pos(sack);
          ctx.confetti(fx, (x - 0.5) * TS, (y - 0.5) * TS, { count: 30 });
          ctx.say(t.spoken);
          if (eaten >= K) win();
        } else {
          stunUntil = performance.now() + 700;
          sackEl.classList.add("sad");
          ctx.later(() => sackEl.classList.remove("sad"), 700);
          sweep(300, 120, 0.3, "sawtooth", 0.1); // bleh
          ctx.say(t.spoken);
        }
      }

      function win() {
        done = true; goalEl.style.display = "none";
        ctx.win();
        sackEl.classList.remove("moving");
        snipEl.classList.add("wait");
        [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.1, "triangle", 0.12, i * 0.08));
        const [x, y] = pos(sack);
        ctx.confetti(fx, (x - 0.5) * TS, (y - 0.5) * TS);
      }
      function caught() {
        done = true; goalEl.style.display = "none";
        ctx.lose();
        sackEl.classList.remove("moving", "happy");
        sackEl.classList.add("cut");
        noise(0.12, "highpass", 3000, 6000, 0.5); // SNIP
        tone(1800, 0.05, "square", 0.12);
        sweep(500, 160, 0.7, "sine", 0.18, 0.2); // waaah
        ["💧", "💧"].forEach((s, i) => {
          const d = document.createElement("div");
          d.className = "sk-tear";
          d.textContent = s;
          const [x, y] = pos(sack);
          d.style.left = `${(x - 1) * TS + TS * (i ? 0.7 : 0.15)}px`;
          d.style.top = `${(y - 1) * TS + TS * 0.45}px`;
          d.style.animationDelay = `${i * 0.3}s`;
          fx.appendChild(d);
        });
        showLeft();
      }
      function showLeft() { tiles.forEach((t) => { if (t.good && !t.gone) t.el.classList.add("left"); }); }

      // ---------- Loop ----------
      let last = 0;
      const t0 = performance.now();
      function render() {
        const [sx, sy] = pos(sack), [cx, cy] = pos(snip);
        sackEl.style.transform = `translate(${((sx - 1) * TS).toFixed(1)}px, ${((sy - 1) * TS).toFixed(1)}px)`;
        snipEl.style.transform = `translate(${((cx - 1) * TS).toFixed(1)}px, ${((cy - 1) * TS).toFixed(1)}px)`;
        const look = { left: [-30, 0], right: [30, 0], up: [0, -30], down: [0, 30] }[sack.dir || want] || [0, 0];
        sackEl.style.setProperty("--lx", `${look[0]}%`);
        sackEl.style.setProperty("--ly", `${look[1]}%`);
        snipEl.style.setProperty("--rot", `${{ left: 180, right: 0, up: -90, down: 90 }[snip.dir] || 0}deg`);
      }
      let nextSnipSound = 0;
      function frame(ts) {
        if (done) { render(); return; }
        const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0;
        last = ts;
        const now = performance.now();
        if (now >= stunUntil) step(sack, sackV, dt, sackChoose);
        sackEl.classList.toggle("moving", !!sack.dir && sack.t < 1 && now >= stunUntil);
        if (now - t0 > snipDelay) {
          snipEl.classList.remove("wait");
          step(snip, snipV, dt, snipChoose);
        }
        const [sx, sy] = pos(sack), [cx, cy] = pos(snip);
        const d = Math.hypot(sx - cx, sy - cy);
        if (d < 2.5 && now > nextSnipSound && now - t0 > snipDelay) { nextSnipSound = now + 450; noise(0.04, "highpass", 4000, 7000, 0.18); }
        render();
        if (!done && d < 0.62) { caught(); return; }
        ctx.raf(frame);
      }
      measure();
      const ro = new ResizeObserver(measure);
      ro.observe(stage);
      ctx.raf(frame);

      // ---------- Input: tap a spot and the sack walks there; or swipe (a new direction every 22 px of
      // travel, so you can steer without lifting); arrow keys too ----------
      let swipe = null;
      wrap.addEventListener("pointerdown", (e) => {
        if (done) return;
        e.preventDefault();
        swipe = { id: e.pointerId, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, swiped: false };
        try { wrap.setPointerCapture(e.pointerId); } catch (err) { /* capture is a nicety */ }
      });
      wrap.addEventListener("pointermove", (e) => {
        if (!swipe || e.pointerId !== swipe.id) return;
        const dx = e.clientX - swipe.x, dy = e.clientY - swipe.y;
        if (Math.hypot(dx, dy) < 22) return;
        swipe.swiped = true;
        setWant(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up"));
        swipe.x = e.clientX; swipe.y = e.clientY;
      });
      const endSwipe = (e) => {
        if (!swipe || e.pointerId !== swipe.id) return;
        const s = swipe;
        swipe = null;
        if (s.swiped || done || e.type === "pointercancel") return;
        // A tap: walk to the open tile nearest the finger.
        const b = board.getBoundingClientRect();
        const fx = (s.x0 - b.left - 5) / TS + 1, fy = (s.y0 - b.top - 5) / TS + 1;
        let best = null, bd = Infinity;
        for (const [c, r] of floor) {
          const d = Math.hypot(c + 0.5 - fx, r + 0.5 - fy);
          if (d < bd) { bd = d; best = [c, r]; }
        }
        if (best) { setGoal(best); tone(880, 0.04, "triangle", 0.06); }
      };
      wrap.addEventListener("pointerup", endSwipe);
      wrap.addEventListener("pointercancel", endSwipe);
      function onKey(e) {
        const d = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down" }[e.key];
        if (d) { e.preventDefault(); setWant(d); }
        else if (e.key === " ") { e.preventDefault(); replay(); }
      }
      document.addEventListener("keydown", onKey);

      function replay() { if (!done) ctx.say(prompt); }

      ctx.onTimeout(() => {
        done = true; goalEl.style.display = "none";
        sackEl.classList.remove("moving");
        sackEl.classList.add("sad");
        snipEl.classList.add("wait");
        showLeft();
        ctx.say(prompt);
      });

      ctx.say(prompt);
      // Show the target big in the middle for a moment before play starts (ctx.reveal).
      snipDelay += ctx.reveal(card); // the scissors wait for it
      if (ctx.demo) snipDelay = Infinity; // in a tutorial the scissors only watch, so the demo is calm and always finishes


      // Tutorial: point at the card, then tap each target in turn and let the sack walk there and eat it.
      ctx.tutorial(answerItem, async (f) => {
        await f.point(card);
        for (const t of tiles.filter((x) => x.good)) {
          if (done) break;
          await f.tap(t.el);
          await f.until(() => t.gone || done, 7000);
        }
      });

      return function cleanup() {
        done = true;
        ro.disconnect();
        document.removeEventListener("keydown", onKey);
      };
    },
  });
})();
