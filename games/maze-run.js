// MAZE RUN — a Japanese-themed room maze, seen from above (an original design: tatami rooms, paper
// lanterns, shoji doors, a torii garden, cherry blossoms). The card at the top shows the target (letter;
// phonics letter; CVC word; HFW 🔊) and the voice says it. A 5×5 grid of rooms; your monster comes in at
// the top, into one of the top rooms. The rooms you can move into (up, down, left or right) glow: tap one
// to walk there. Under the bottom row are four exit doors (under the two left and two right columns; the
// middle column ends in a stone wall), each with an option (one row of ctx.choiceRows): from a bottom room,
// tap the exit below you. The right exit opens onto a garden and a shower of cherry blossoms. A wrong exit
// opens onto a pool of water: SPLASH, and the right exit glows.
// Two red horned monsters (three from 1.5×) wander slowly from room to room. A room with a monster in it
// doesn't glow, and walking into it is a BUMP: caught, and the round is lost. They never step into your
// room or the room you're walking to, so you only bump into one by choosing its room. Once you start, one
// more comes in at the top and follows your path a room at a time; if it reaches you, you're caught.
(function () {
  const TEXT = {
    name: { en: "Maze Run" },
    icon: "🏯",
    howTo: (list) => ({ en: {
      steps: [
        list.type === "hfw" ? ["👂", "Listen to the word, like \"the\"."] : ["👀", "Look at the card at the top."],
        ["🟨", "Tap a glowing room to walk there. Work your way down!"],
        ["👹", "Don't bump into the red monsters wandering around!"],
        ["🚪", "At the bottom, tap the door with the same one. The wrong door: SPLASH!"],
      ],
      tips: [
        "Glowing rooms are always safe. A room with a monster in it never glows.",
        "Hurry: one more monster follows you once you start.",
        "Tap the card to hear it again.",
      ],
    } }),
    instruction: { en: "ESCAPE THE\nMAZE!" },
    cardLabel: "Hear it again",
    roomLabel: "Walk into this room",
    exitLabel: (t) => `Go out the door to ${t}`,
    splash: "SPLASH!",
    bump: "BUMP!",
    caught: "CAUGHT!",
    out: "YOU MADE IT!",
    haha: "HA HA HA!",
    pop: "POP!",
  };

  const COLS = 5, ROWS = 5;
  const EXIT_COLS = [0, 1, 3, 4];   // four answers; the middle column ends in a wall
  const CSS = `
  .mz { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:8px; padding-bottom:8px; }
  .mz-card { flex:none; min-width:84px; height:64px; padding:0 18px; border-radius:18px; font:inherit; font-size:2.4rem; line-height:1; background:#fff; color:#111;
    border:5px solid #111; box-shadow:0 6px 0 #111; display:flex; align-items:center; justify-content:center; gap:8px; cursor:pointer; touch-action:manipulation; }
  .mz-card .spk { font-size:1.3rem; opacity:.6; }
  .mz-maze { position:relative; flex:1; min-height:0; width:100%; max-width:560px; touch-action:manipulation; }
  .mz-board { position:absolute; left:50%; top:0; transform:translateX(-50%); width:calc(var(--bw) + 12px); height:calc(var(--bh) + 12px); background:#5a3a1e; border:6px solid #111; border-radius:12px; /* + the 6 px frame on each side (border-box) */
    box-shadow:0 7px 0 #111; }
  .mz-fx { position:absolute; inset:0; pointer-events:none; overflow:visible; z-index:9; }
  /* A room: a tatami floor inside dark wooden walls (the board's colour shows between rooms) */
  .mz-room { position:absolute; width:var(--cs); height:var(--cs); padding:0; border:0; background:none; font:inherit; cursor:pointer; touch-action:manipulation; }
  .mz-floor { position:absolute; inset:4px; border-radius:4px; background:#d8c98a;
    background-image:linear-gradient(90deg, #3d5a1e 3px, transparent 3px), linear-gradient(0deg, #3d5a1e 3px, transparent 3px), repeating-linear-gradient(90deg, rgba(120,150,60,.2) 0 2px, transparent 2px 7px);
    background-size:50% 50%, 50% 50%, auto; transition:filter .2s; }
  .mz-room.next .mz-floor { box-shadow:0 0 0 5px #ffd400, 0 0 16px 4px rgba(255,212,0,.8); animation:mz-glow 1s ease-in-out infinite; }
  .mz-room.seen .mz-floor { filter:brightness(.92) saturate(.8); }
  .mz-lantern { position:absolute; font-size:calc(var(--cs) * .32); line-height:1; pointer-events:none; z-index:2; }
  .mz-wall { position:absolute; display:flex; align-items:center; justify-content:center; background:#7d7466; border:4px solid #111; border-radius:6px;
    background-image:linear-gradient(0deg, rgba(0,0,0,.25) 3px, transparent 3px), linear-gradient(90deg, rgba(0,0,0,.25) 3px, transparent 3px); background-size:33% 50%;
    font-size:calc(var(--es) * .5); }
  /* The exits: shoji doors under the bottom row, each with an option */
  .mz-exit { position:absolute; width:calc(var(--cs) - 6px); height:calc(var(--es) - 10px); padding:0; border:4px solid #111; border-radius:6px; background:#2a1a0e; overflow:hidden;
    font:inherit; cursor:pointer; touch-action:manipulation; }
  .mz-out { position:absolute; inset:0; }
  .mz-out.water { background:radial-gradient(ellipse at 50% 60%, #7fd3ff 0 30%, #2d8ee0 60%, #1b5fa8 100%); }
  .mz-out.garden { background:linear-gradient(180deg, #ffd6e8, #c8f0a8); }
  .mz-out.garden::after { content:"⛩️"; position:absolute; left:50%; top:50%; transform:translate(-50%, -50%); font-size:calc(var(--es) * .55); }
  .mz-panel { position:absolute; inset:0; background:#fff7e0; border:2px solid #8b5a2b; display:flex; align-items:center; justify-content:center; transition:transform .35s ease-in-out;
    background-image:linear-gradient(90deg, rgba(139,90,43,.45) 2px, transparent 2px), linear-gradient(0deg, rgba(139,90,43,.45) 2px, transparent 2px); background-size:25% 33%; }
  .mz-sign { padding:2px 3px; min-width:62%; max-width:98%; box-sizing:border-box; background:#fff; border:3px solid #111; border-radius:10px; font-size:calc(var(--es) * .5);
    line-height:1.05; color:#111; white-space:nowrap; text-align:center; }
  .mz-exit.open .mz-panel { transform:translateX(90%); }
  .mz-exit.next { box-shadow:0 0 0 5px #ffd400, 0 0 16px 4px rgba(255,212,0,.8); animation:mz-glow 1s ease-in-out infinite; }
  .mz-exit.right { box-shadow:0 0 0 5px #fff, 0 0 0 10px #00b86b; }
  .mz-exit.dim { opacity:.5; }
  /* You and the red monsters (the wanderers and the chaser), seen from above. --pz is their size */
  .mz-me, .mz-oni { position:absolute; left:0; top:0; width:var(--pz); height:var(--pz); margin:calc(var(--pz) * -.5) 0 0 calc(var(--pz) * -.5); z-index:5; pointer-events:none; will-change:transform; }
  .mz-me { z-index:6; }
  .mz-mb { position:absolute; inset:0; border-radius:50%; background:#ff8a1f; border:4px solid #111; }
  .mz-oni .mz-mb { background:#e8173c; }
  .mz-oni .mz-mb::before, .mz-oni .mz-mb::after { content:""; position:absolute; top:-18%; width:22%; height:30%; background:#fff3d6; border:3px solid #111; border-radius:50% 50% 10% 10%; }
  .mz-oni .mz-mb::before { left:16%; transform:rotate(-20deg); } .mz-oni .mz-mb::after { right:16%; transform:rotate(20deg); }
  .mz-me i, .mz-oni i { position:absolute; top:22%; width:32%; aspect-ratio:1; background:#fff; border:3px solid #111; border-radius:50%; }
  .mz-me i.l, .mz-oni i.l { left:14%; } .mz-me i.r, .mz-oni i.r { right:14%; width:27%; top:25%; }
  .mz-me i::after, .mz-oni i::after { content:""; position:absolute; left:28%; top:30%; width:46%; aspect-ratio:1; background:#111; border-radius:50%; animation:mz-goggle 1.1s ease-in-out infinite; }
  .mz-me b, .mz-oni b { position:absolute; left:30%; right:30%; top:62%; height:16%; background:#6b1020; border:3px solid #111; border-radius:4px 4px 999px 999px; }
  .mz-oni b { background:#fff; background-image:repeating-linear-gradient(90deg, #fff 0 22%, #111 22% 28%); }
  .mz-me.sink { animation:mz-sink .6s ease-in forwards; }
  .mz-me.caught b { border-radius:50%; left:40%; right:40%; }
  .mz-word { position:absolute; transform:translate(-50%, -50%) rotate(-8deg); z-index:10; pointer-events:none; font-size:2.2rem; color:#ffd400; -webkit-text-stroke:2px #111;
    paint-order:stroke fill; text-shadow:0 4px 0 #111; white-space:nowrap; animation:mz-pop .35s cubic-bezier(.2,1.8,.4,1) both; }
  .mz-word.bad { color:#ff6f91; } .mz-word.water { color:#7fd3ff; }
  .mz-petal { position:absolute; top:-30px; font-size:1.6rem; pointer-events:none; z-index:10; }
  /* Dramatic reactions: the catcher laughs, you cry and run, the splash floods the maze */
  .mz-oni.laugh { z-index:7; animation:mz-laugh .22s ease-in-out infinite alternate; }
  .mz-oni.laugh b { top:54%; height:30%; }
  .mz-me.cry b { border-radius:999px 999px 4px 4px; top:66%; height:12%; left:34%; right:34%; }
  .mz-me.cry i::after { top:52%; animation:none; }
  .mz-tear { position:absolute; left:0; top:0; font-size:calc(var(--pz) * .35); line-height:1; pointer-events:none; z-index:9; }
  .mz-word.laughw { color:#ff4d6d; font-size:1.9rem; }
  .mz-word.huge { font-size:3.8rem; z-index:11; }
  .mz-burst { position:absolute; width:40px; height:40px; margin:-20px 0 0 -20px; border-radius:50%; z-index:9; pointer-events:none;
    background:radial-gradient(circle, #fff 0 25%, #a8e4ff 40%, #2d8ee0 65%, transparent 70%); animation:mz-burst .6s ease-out forwards; }
  .mz-flood { position:absolute; z-index:8; pointer-events:none; overflow:hidden; border-radius:12px; }
  .mz-water { position:absolute; left:0; right:0; bottom:0; height:0; background:linear-gradient(180deg, rgba(127,211,255,.9), rgba(27,95,168,.92)); animation:mz-flood .8s cubic-bezier(.2,.9,.3,1) forwards; }
  .mz-water::before { content:""; position:absolute; left:0; right:0; top:-14px; height:16px; background:radial-gradient(circle at 12px 16px, rgba(127,211,255,.9) 11px, transparent 12px) 0 0 / 24px 16px repeat-x; }
  .mz.shake { animation:mz-shake .07s linear 8; }
  @keyframes mz-glow { 50% { filter:brightness(1.12); } }
  @keyframes mz-goggle { 0%, 100% { transform:translate(-16%, 0); } 50% { transform:translate(16%, -12%); } }
  @keyframes mz-sink { to { transform:var(--at) scale(.2); opacity:.2; } }
  @keyframes mz-pop { from { transform:translate(-50%, -50%) rotate(-8deg) scale(.2); } }
  @keyframes mz-laugh { from { transform:var(--at) scale(1.05) rotate(-10deg); } to { transform:var(--at) scale(1.3) rotate(10deg); } }
  @keyframes mz-burst { to { transform:scale(16); opacity:0; } }
  @keyframes mz-flood { 0% { height:0; } 65% { height:82%; } 100% { height:74%; } }
  @keyframes mz-shake { 25% { translate:-8px 3px; } 75% { translate:8px -3px; } }
  @media (prefers-reduced-motion: reduce) { .mz-room.next .mz-floor, .mz-exit.next, .mz-me i::after, .mz-oni i::after, .mz-oni.laugh, .mz.shake, .mz-burst { animation:none !important; } }`;

  function injectCss() {
    if (document.getElementById("mz-css")) return;
    const style = document.createElement("style");
    style.id = "mz-css";
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  registerMicrogame({
    id: "maze-run",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 20000,
    input: "tap",
    tutorial: true, // has a ctx.tutorial script

    start(ctx) {
      injectCss();
      const speed = ctx.speed || 1;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const { tone, sweep, noise } = ctx.sfx;
      const C = ctx.choiceRows(1, EXIT_COLS.length, { lowercase: true });
      const exitOpts = ctx.shuffle(C.rows[0].slice());
      const rightCol = EXIT_COLS[exitOpts.findIndex((o) => o.right)];
      const pace = 0.6 + 0.4 * speed;
      const nWander = speed >= 1.5 ? 3 : 2;

      const key = (c, r) => r * COLS + c;
      const inside = (c, r) => c >= 0 && c < COLS && r >= 0 && r < ROWS;
      const moves = (c, r) => [[c, r - 1], [c, r + 1], [c - 1, r], [c + 1, r]].filter(([x, y]) => inside(x, y));
      const startCol = Math.floor(Math.random() * COLS);

      // ---------- DOM ----------
      const wrap = document.createElement("div");
      wrap.className = "mz";
      const card = document.createElement("button");
      card.className = "mz-card";
      card.setAttribute("aria-label", TEXT.cardLabel);
      card.innerHTML = '<span class="ct"></span>';
      card.firstChild.textContent = C.cardText;
      if (ctx.canSpeak && !C.listen) card.insertAdjacentHTML("beforeend", '<span class="spk">🔊</span>');
      card.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });
      const mazeEl = document.createElement("div");
      mazeEl.className = "mz-maze";
      const board = document.createElement("div");
      board.className = "mz-board";
      const fx = document.createElement("div");
      fx.className = "mz-fx";
      mazeEl.append(board, fx);
      wrap.append(card, mazeEl);
      ctx.root.appendChild(wrap);

      const rooms = [];
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const el = document.createElement("button");
        el.className = "mz-room";
        el.setAttribute("aria-label", TEXT.roomLabel);
        el.innerHTML = '<div class="mz-floor"></div>';
        el.addEventListener("pointerdown", (e) => { e.preventDefault(); tapRoom(c, r); });
        el.addEventListener("click", (e) => { if (e.detail === 0) tapRoom(c, r); });
        board.appendChild(el);
        rooms[key(c, r)] = { el, c, r };
      }
      ["left:-2px;top:-6px", "right:-2px;top:-6px"].forEach((p) => {
        const l = document.createElement("div");
        l.className = "mz-lantern"; l.textContent = "🏮"; l.style.cssText = p;
        board.appendChild(l);
      });
      const exits = EXIT_COLS.map((c, i) => {
        const opt = exitOpts[i];
        const el = document.createElement("button");
        el.className = "mz-exit";
        el.setAttribute("aria-label", TEXT.exitLabel(opt.spoken));
        el.innerHTML = `<div class="mz-out ${opt.right ? "garden" : "water"}"></div><div class="mz-panel"><span class="mz-sign"></span></div>`;
        el.querySelector(".mz-sign").textContent = opt.text;
        el.addEventListener("pointerdown", (e) => { e.preventDefault(); tapExit(c); });
        el.addEventListener("click", (e) => { if (e.detail === 0) tapExit(c); });
        board.appendChild(el);
        return { el, c, opt };
      });
      const exitAt = (c) => exits.find((x) => x.c === c);
      const wall = document.createElement("div");
      wall.className = "mz-wall";
      wall.textContent = "🏮";
      board.appendChild(wall);
      const me = document.createElement("div");
      me.className = "mz-me";
      me.innerHTML = '<div class="mz-mb"></div><i class="l"></i><i class="r"></i><b></b>';
      board.appendChild(me);
      const oniHtml = '<div class="mz-mb"></div><i class="l"></i><i class="r"></i><b></b>';

      // ---------- The wandering monsters: start in the middle rows, away from you ----------
      const wanderers = [];
      for (let tries = 0; wanderers.length < nWander && tries < 200; tries++) {
        const c = Math.floor(Math.random() * COLS), r = 1 + Math.floor(Math.random() * (ROWS - 2));
        if (Math.abs(c - startCol) + r < 3 || wanderers.some((w) => w.c === c && w.r === r)) continue;
        const el = document.createElement("div");
        el.className = "mz-oni";
        el.innerHTML = oniHtml;
        board.appendChild(el);
        wanderers.push({ el, c, r, to: null, dir: [0, 0] });
      }
      const chaser = document.createElement("div");
      chaser.className = "mz-oni";
      chaser.innerHTML = oniHtml;
      chaser.style.display = "none";
      board.appendChild(chaser);

      // ---------- Layout: 5 room rows, then the row of exits ----------
      let cs = 70, es = 60, pz = 40;
      function layout() {
        const W = mazeEl.clientWidth - 16, H = mazeEl.clientHeight - 14;
        cs = Math.floor(Math.max(48, Math.min(W / COLS, H / (ROWS + 0.85))));
        es = Math.round(cs * 0.85);
        pz = Math.round(cs * 0.54);
        mazeEl.style.setProperty("--cs", `${cs}px`); mazeEl.style.setProperty("--es", `${es}px`); mazeEl.style.setProperty("--pz", `${pz}px`);
        mazeEl.style.setProperty("--bw", `${cs * COLS}px`); mazeEl.style.setProperty("--bh", `${cs * ROWS + es}px`);
        rooms.forEach((rm) => { rm.el.style.left = `${rm.c * cs}px`; rm.el.style.top = `${rm.r * cs}px`; });
        exits.forEach((x) => {
          x.el.style.left = `${x.c * cs + 3}px`; x.el.style.top = `${ROWS * cs + 4}px`;
          const sg = x.el.querySelector(".mz-sign");
          // Words: a first guess from the door's inside (Arial Black is wide, about 0.72 em a letter),
          // then measured and shrunk until they really fit.
          sg.style.fontSize = x.opt.kind === "word" ? `${Math.min(es * 0.34, (cs - 26) / (x.opt.text.length * 0.72))}px` : "";
          for (let k = 0; k < 10 && x.opt.kind === "word" && sg.scrollWidth > sg.clientWidth + 1; k++) sg.style.fontSize = `${parseFloat(sg.style.fontSize) * 0.9}px`;
        });
        Object.assign(wall.style, { left: `${2 * cs + 3}px`, top: `${ROWS * cs + 4}px`, width: `${cs - 14}px`, height: `${es - 18}px` });
        place(me, pos.c, pos.r);
        wanderers.forEach((w) => place(w.el, w.c, w.r));
        if (chaseAt) place(chaser, chaseAt.c, chaseAt.r);
      }
      const centre = (c, r) => ({ x: c * cs + cs / 2, y: r * cs + cs / 2 });
      function place(el, c, r) { const p = centre(c, r); const t = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px)`; el.style.transform = t; el.style.setProperty("--at", t); }
      function walk(el, from, to, ms, then) {
        const a = centre(from.c, from.r), b = centre(to.c, to.r), t0 = performance.now();
        (function go(now) {
          const k = Math.min(1, (now - t0) / ms), e = k * k * (3 - 2 * k);
          const t = `translate(${(a.x + (b.x - a.x) * e).toFixed(1)}px, ${(a.y + (b.y - a.y) * e).toFixed(1)}px)`;
          el.style.transform = t; el.style.setProperty("--at", t);
          if (k < 1) { ctx.raf(go); return; }
          then();
        })(t0);
      }

      // ---------- Moving ----------
      let pos = { c: startCol, r: 0 }, target = null, done = false, busy = false;
      const path = [{ c: startCol, r: 0 }];
      const monsterIn = (c, r) => wanderers.some((w) => (w.c === c && w.r === r) || (w.to && w.to.c === c && w.to.r === r));
      const adjacent = (c, r) => moves(pos.c, pos.r).some(([x, y]) => x === c && y === r);
      function markNext() {
        rooms.forEach((rm) => rm.el.classList.toggle("next", !done && !busy && adjacent(rm.c, rm.r) && !monsterIn(rm.c, rm.r)));
        exits.forEach((x) => x.el.classList.toggle("next", !done && !busy && pos.r === ROWS - 1 && x.c === pos.c));
      }
      function tapRoom(c, r) {
        if (done || busy || ctx.ended || !adjacent(c, r)) return;
        busy = true; target = { c, r }; markNext();
        startChase();
        tone(500 + r * 50, 0.05, "square", 0.06); // patter
        walk(me, pos, target, reduceMotion ? 1 : 250, () => {
          pos = target; target = null;
          path.push({ ...pos });
          rooms[key(pos.c, pos.r)].el.classList.add("seen");
          // A monster in this room (and staying), or one stepping into it right now (the teacher hit a monster arriving
          // at the same moment that didn't count; one already stepping OUT doesn't count either).
          const hit = wanderers.find((w) => (w.to ? w.to.c === pos.c && w.to.r === pos.r : w.c === pos.c && w.r === pos.r));
          if (hit) { caught(TEXT.bump, { el: hit.el, c: hit.c, r: hit.r }); return; }  // walked into one
          if (chaseAt && chaseAt.c === pos.c && chaseAt.r === pos.r) { caught(TEXT.caught, { el: chaser, ...chaseAt }); return; }
          busy = false; markNext();
        });
      }

      // The wanderers amble a room at a time, never into your room or the room you're walking to,
      // never into each other, and they like to keep going the way they were going.
      const wanderMs = 1700 / pace;
      function wander() {
        if (done || ctx.ended) return;
        wanderers.forEach((w) => {
          if (w.to) return;
          const options = moves(w.c, w.r).filter(([x, y]) =>
            !(x === pos.c && y === pos.r) && !(target && x === target.c && y === target.r) &&
            !wanderers.some((o) => o !== w && ((o.c === x && o.r === y) || (o.to && o.to.c === x && o.to.r === y))));
          if (!options.length) return;
          const ahead = options.find(([x, y]) => x - w.c === w.dir[0] && y - w.r === w.dir[1]);
          const [x, y] = ahead && Math.random() < 0.6 ? ahead : options[Math.floor(Math.random() * options.length)];
          w.dir = [x - w.c, y - w.r];
          w.to = { c: x, r: y };
          walk(w.el, w, w.to, reduceMotion ? 1 : 520, () => {
            w.c = x; w.r = y; w.to = null;
            if (!done && !busy && x === pos.c && y === pos.r) { caught(TEXT.bump, { el: w.el, c: x, r: y }); return; } // (it stepped onto you)
            markNext();
          });
        });
        markNext();
        ctx.later(wander, wanderMs * (0.8 + Math.random() * 0.4));
      }

      // ---------- The chaser: follows your path a room at a time once you start ----------
      let chaseAt = null, chaseStep = 0, chasing = false;
      const chaseMs = 1900 / pace;
      function startChase() {
        if (chasing) return;
        chasing = true;
        ctx.later(() => {
          if (done) return;
          chaseAt = { ...path[0] };
          chaser.style.display = "";
          place(chaser, chaseAt.c, chaseAt.r);
          tone(110, 0.2, "sawtooth", 0.08); // it's coming
          ctx.later(chase, chaseMs);
        }, 2000 / pace);
      }
      function chase() {
        if (done || ctx.ended) return;
        if (chaseStep + 1 < path.length) {
          const from = path[chaseStep], to = path[chaseStep + 1];
          chaseStep++;
          walk(chaser, from, to, reduceMotion ? 1 : 360, () => {
            chaseAt = { ...to };
            if (!busy && chaseAt.c === pos.c && chaseAt.r === pos.r) caught(TEXT.caught, { el: chaser, ...chaseAt });
          });
        }
        ctx.later(chase, chaseMs);
      }

      // Board px → fx-layer px (the fx layer covers the whole maze area; the board has a 6 px frame).
      function toFx(p) {
        const b = board.getBoundingClientRect(), m = mazeEl.getBoundingClientRect();
        return { x: b.left - m.left + 6 + p.x, y: b.top - m.top + 6 + p.y };
      }
      // The monster nearest to you (for a timeout): the chaser if it's in, else the closest wanderer.
      function nearestMonster() {
        const all = wanderers.map((w) => ({ el: w.el, c: w.c, r: w.r }));
        if (chaseAt) all.push({ el: chaser, ...chaseAt });
        return all.sort((a, b) => (Math.abs(a.c - pos.c) + Math.abs(a.r - pos.r)) - (Math.abs(b.c - pos.c) + Math.abs(b.r - pos.r)))[0];
      }
      // Caught: the monster roars with laughter, and yours bursts into tears and runs off the board.
      function caught(text, catcher) {
        if (done) return;
        done = true;
        ctx.lose();
        markNext();
        tone(120, 0.3, "sawtooth", 0.12); noise(0.1, "lowpass", 1200, 300, 0.4);
        word(centre(pos.c, pos.r), text, "bad");
        laughAndRun(catcher || nearestMonster());
        ctx.later(() => { showRight(); ctx.say(C.answer); }, 500);
      }
      function laughAndRun(m) {
        if (m) {
          m.el.style.display = "";
          m.el.classList.add("laugh");
          ctx.later(() => word(centre(m.c, m.r - 0.6), TEXT.haha, "laughw"), 150);
          [0, 0.16, 0.32, 0.48].forEach((t) => { tone(330, 0.1, "square", 0.09, t); tone(262, 0.1, "square", 0.07, t + 0.08); }); // HA-HA-HA-HA
        }
        me.classList.add("cry");
        sweep(500, 220, 0.7, "triangle", 0.12, 0.15); // waaah
        const from = centre(pos.c, pos.r), away = { x: pos.c < COLS / 2 ? -cs * 1.4 : cs * (COLS + 1.4), y: from.y };
        const t0 = performance.now() + 250, ms = reduceMotion ? 1 : 900;
        let lastTear = 0;
        (function run(now) {
          const k = Math.max(0, Math.min(1, (now - t0) / ms));
          const x = from.x + (away.x - from.x) * k, y = from.y - Math.abs(Math.sin(k * Math.PI * 5)) * cs * 0.18; // hop-hop-hop away
          const t = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
          me.style.transform = t; me.style.setProperty("--at", t);
          if (!reduceMotion && now - lastTear > 110) { lastTear = now; tear(toFx({ x, y })); }
          if (k < 1) ctx.raf(run);
        })(performance.now());
      }
      function tear(at) {
        const d = document.createElement("div");
        d.className = "mz-tear"; d.textContent = "💧";
        d.style.left = `${at.x + (Math.random() - 0.5) * pz * 0.6}px`; d.style.top = `${at.y - pz * 0.2}px`;
        fx.appendChild(d);
        d.animate([{ transform: "translate(-50%, 0)", opacity: 1 }, { transform: `translate(${-50 + (Math.random() - 0.5) * 120}%, ${pz * 0.9}px)`, opacity: 0 }], { duration: 600, easing: "ease-in", fill: "forwards" });
        ctx.later(() => d.remove(), 650);
      }

      // ---------- The exits ----------
      function tapExit(c) {
        const x = exitAt(c);
        if (!x || done || busy || ctx.ended || pos.r !== ROWS - 1 || c !== pos.c) return;
        busy = true; done = true; markNext();
        ctx.freezeTimer(); // reported when the door opens, so the frame doesn't move on before it's seen
        x.el.classList.add("open");
        noise(0.25, "bandpass", 1200, 800, 0.25); // the shoji slides
        const below = { x: c * cs + cs / 2, y: ROWS * cs + es * 0.5 };
        ctx.later(() => {
          const a = centre(pos.c, pos.r), t0 = performance.now(), ms = reduceMotion ? 1 : 300;
          (function go(now) {
            const k = Math.min(1, (now - t0) / ms);
            const t = `translate(${(a.x + (below.x - a.x) * k).toFixed(1)}px, ${(a.y + (below.y - a.y) * k).toFixed(1)}px)`;
            me.style.transform = t; me.style.setProperty("--at", t);
            if (k < 1) { ctx.raf(go); return; }
            if (x.opt.right) escape(); else splash(x);
          })(t0);
        }, reduceMotion ? 10 : 320);
      }
      function escape() {
        ctx.win();
        // Every monster explodes in confetti!
        const all = wanderers.map((w) => ({ el: w.el, c: w.c, r: w.r }));
        if (chaseAt && chaser.style.display !== "none") all.push({ el: chaser, ...chaseAt });
        all.forEach((m, i) => ctx.later(() => {
          const at = toFx(centre(m.c, m.r));
          ctx.confetti(fx, at.x, at.y, { count: 70 });
          m.el.animate([{ transform: m.el.style.transform + " scale(1)" }, { transform: m.el.style.transform + " scale(1.7)", opacity: 1, offset: 0.4 }, { transform: m.el.style.transform + " scale(0)", opacity: 0 }],
            { duration: reduceMotion ? 1 : 350, fill: "forwards" });
          noise(0.15, "bandpass", 1400, 500, 0.5); tone(880 + i * 220, 0.1, "square", 0.08); // POP!
          word(centre(m.c, m.r), TEXT.pop, "");
        }, 150 + i * 180));
        word({ x: cs * COLS / 2, y: cs * 1.2 }, TEXT.out, "");
        [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, "triangle", 0.12, i * 0.09));
        const H = mazeEl.clientHeight;
        for (let k = 0; k < (reduceMotion ? 6 : 36); k++) {
          const p = document.createElement("div");
          p.className = "mz-petal"; p.textContent = "🌸";
          p.style.left = `${Math.random() * 100}%`;
          fx.appendChild(p);
          const drift = (Math.random() - 0.5) * 120;
          p.animate([{ transform: "translate(0, 0) rotate(0)" }, { transform: `translate(${drift}px, ${H + 60}px) rotate(${(Math.random() - 0.5) * 540}deg)` }],
            { duration: 1400 + Math.random() * 900, delay: Math.random() * 500, easing: "ease-in", fill: "both" });
        }
        ctx.say(C.answer);
      }
      // A wrong door: a huge splash bursts out of it, droplets fly everywhere, the water floods up over
      // most of the maze and the screen shakes.
      function splash(x) {
        ctx.lose();
        me.classList.add("sink");
        noise(0.9, "lowpass", 2200, 150, 0.9); sweep(700, 100, 0.6, "sine", 0.2); noise(0.6, "highpass", 3000, 1500, 0.3, 0.2); // SPLOOSH
        const at = toFx({ x: x.c * cs + cs / 2, y: ROWS * cs + es * 0.4 });
        const burst = document.createElement("div");
        burst.className = "mz-burst";
        burst.style.left = `${at.x}px`; burst.style.top = `${at.y}px`;
        fx.appendChild(burst);
        const b = board.getBoundingClientRect(), m = mazeEl.getBoundingClientRect();
        const flood = document.createElement("div");
        flood.className = "mz-flood";
        Object.assign(flood.style, { left: `${b.left - m.left}px`, top: `${b.top - m.top}px`, width: `${b.width}px`, height: `${b.height}px` });
        flood.innerHTML = '<div class="mz-water"></div>';
        fx.appendChild(flood);
        for (let k = 0; k < (reduceMotion ? 4 : 28); k++) {
          const d = document.createElement("div");
          d.className = "mz-tear"; d.textContent = "💧";
          d.style.left = `${at.x}px`; d.style.top = `${at.y}px`; d.style.fontSize = `${pz * (0.35 + Math.random() * 0.35)}px`;
          fx.appendChild(d);
          const ang = -Math.PI / 2 + (Math.random() - 0.5) * 2.6, v = b.height * (0.4 + Math.random() * 0.5);
          d.animate([{ transform: "translate(-50%, -50%)" }, { transform: `translate(calc(-50% + ${Math.cos(ang) * v * 0.6}px), calc(-50% + ${Math.sin(ang) * v}px))`, offset: 0.5 },
            { transform: `translate(calc(-50% + ${Math.cos(ang) * v}px), calc(-50% + ${Math.sin(ang) * v * 0.3 + b.height * 0.3}px))`, opacity: 0 }],
            { duration: 900 + Math.random() * 400, easing: "ease-out", fill: "forwards" });
        }
        wrap.classList.add("shake");
        word({ x: cs * COLS / 2, y: cs * (ROWS * 0.45) }, TEXT.splash, "water huge");
        ctx.later(() => { showRight(); ctx.say(C.answer); }, 600);
      }
      function showRight() { exits.forEach((x) => x.el.classList.add(x.opt.right ? "right" : "dim")); }

      function word(at, text, cls) {
        const w = document.createElement("div");
        w.className = "mz-word" + (cls ? ` ${cls}` : "");
        w.textContent = text;
        const b = board.getBoundingClientRect(), m = mazeEl.getBoundingClientRect();
        w.style.left = `${b.left - m.left + Math.max(70, Math.min(cs * COLS - 70, at.x))}px`; w.style.top = `${b.top - m.top + at.y}px`;
        fx.appendChild(w);
      }
      function replay() { if (!done) ctx.say(C.prompt); }

      ctx.onTimeout(() => { done = true; markNext(); laughAndRun(nearestMonster()); showRight(); ctx.say(C.answer); }); // the nearest monster gets you
      function onKey(e) {
        const m = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] }[e.key];
        if (m) { e.preventDefault(); if (pos.r === ROWS - 1 && e.key === "ArrowDown") tapExit(pos.c); else tapRoom(pos.c + m[0], pos.r + m[1]); }
        else if (e.key === " ") { e.preventDefault(); replay(); }
      }
      document.addEventListener("keydown", onKey);

      layout();
      rooms[key(startCol, 0)].el.classList.add("seen");
      markNext();
      const ro = new ResizeObserver(layout);
      ro.observe(mazeEl);
      ctx.say(C.prompt);
      // Show the target big in the middle for a moment before play starts (ctx.reveal); the wanderers wait for it.
      const revealMs = ctx.reveal(card);
      ctx.later(wander, revealMs + 600);

      // Tutorial: point at the card and the right exit, then step by step take the shortest way there that
      // avoids the monsters (worked out again before every step, since they move), and go out.
      ctx.tutorial(C.target, async (f) => {
        function nextStep() {
          const blocked = (c, r) => monsterIn(c, r) || (chaseAt && chaseAt.c === c && chaseAt.r === r);
          const goal = key(rightCol, ROWS - 1), from = key(pos.c, pos.r);
          const prev = new Map([[from, null]]), q = [[pos.c, pos.r]];
          while (q.length) {
            const [c, r] = q.shift();
            if (key(c, r) === goal) break;
            for (const [x, y] of moves(c, r)) { const k = key(x, y); if (!prev.has(k) && !blocked(x, y)) { prev.set(k, key(c, r)); q.push([x, y]); } }
          }
          if (!prev.has(goal)) return null;
          let k = goal; while (prev.get(k) !== from) k = prev.get(k);
          return k;
        }
        await f.point(card, 900);
        await f.point(exitAt(rightCol).el, 800);
        for (let n = 0; n < 30 && !done; n++) {
          await f.until(() => !busy || done, 3000);
          if (done) break;
          if (pos.r === ROWS - 1 && pos.c === rightCol) { await f.tap(exitAt(rightCol).el); break; }
          const k = nextStep();
          if (k === null) { await f.wait(400); continue; } // boxed in for a moment: wait for a monster to move
          const rm = rooms[k];
          await f.move(rm.el, 380);
          if (monsterIn(rm.c, rm.r) || !adjacent(rm.c, rm.r)) continue; // a monster wandered in meanwhile: think again
          await f.tapNow(rm.el);
        }
        await f.until(() => done && ctx.ended, 2500);
      });

      return () => { done = true; ro.disconnect(); document.removeEventListener("keydown", onKey); };
    },
  });
})();
