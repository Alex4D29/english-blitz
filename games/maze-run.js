// MAZE RUN — a Japanese-themed room maze, seen from above (an original design: tatami rooms, paper
// lanterns, shoji doors, a torii garden, cherry blossoms). The card at the top shows the target (letter;
// phonics letter; CVC word; HFW 🔊) and the voice says it. A 4×4 grid of rooms; your monster comes in at
// the top, into one of the top rooms. The rooms you can move into (left, right or down) glow: tap one to
// walk there. Under the bottom row are four exit doors, one per column, each with an option (one row of
// ctx.choiceRows): from a bottom room, tap the exit below you. The right exit opens onto a garden and a
// shower of cherry blossoms. A wrong exit opens onto a pool of water: SPLASH, and the right exit glows.
// Two rooms (three from 1.5×) are dark with eyes peeking out: walk in and a monster jumps out (BOO!) and
// you run back where you came from (it only costs time); there's always a clear way to every exit. Once
// you start, a red horned monster comes in at the top and follows your path a room at a time; if it
// reaches your room, you're caught.
(function () {
  const TEXT = {
    name: { en: "Maze Run" },
    icon: "🏯",
    howTo: (list) => ({ en: {
      steps: [
        list.type === "hfw" ? ["👂", "Listen to the word, like \"the\"."] : ["👀", "Look at the card at the top."],
        ["🟨", "Tap a glowing room to walk there. Work your way down!"],
        ["🚪", "At the bottom, tap the door with the same one."],
        ["🌸", "The right door: you're out! The wrong door: SPLASH!"],
      ],
      tips: [
        "Dark rooms with eyes hide a monster. BOO! You run back.",
        "Hurry: a red monster follows you once you start.",
        "Tap the card to hear it again.",
      ],
    } }),
    instruction: { en: "ESCAPE THE\nMAZE!" },
    cardLabel: "Hear it again",
    roomLabel: "Walk into this room",
    exitLabel: (t) => `Go out the door to ${t}`,
    splash: "SPLASH!",
    boo: "BOO!",
    caught: "CAUGHT!",
    out: "YOU MADE IT!",
  };

  const COLS = 4, ROWS = 4;
  const CSS = `
  .mz { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:8px; padding-bottom:8px; }
  .mz-card { flex:none; min-width:84px; height:68px; padding:0 18px; border-radius:18px; font:inherit; font-size:2.5rem; line-height:1; background:#fff; color:#111;
    border:5px solid #111; box-shadow:0 6px 0 #111; display:flex; align-items:center; justify-content:center; gap:8px; cursor:pointer; touch-action:manipulation; }
  .mz-card .spk { font-size:1.3rem; opacity:.6; }
  .mz-maze { position:relative; flex:1; min-height:0; width:100%; max-width:520px; touch-action:manipulation; }
  .mz-board { position:absolute; left:50%; top:0; transform:translateX(-50%); width:var(--bw); height:var(--bh); background:#5a3a1e; border:6px solid #111; border-radius:12px;
    box-shadow:0 7px 0 #111; }
  .mz-fx { position:absolute; inset:0; pointer-events:none; overflow:visible; z-index:9; }
  /* A room: a tatami floor inside dark wooden walls (the board's colour shows between rooms) */
  .mz-room { position:absolute; width:var(--cs); height:var(--cs); padding:0; border:0; background:none; font:inherit; cursor:pointer; touch-action:manipulation; }
  .mz-floor { position:absolute; inset:5px; border-radius:4px; background:#d8c98a;
    background-image:linear-gradient(90deg, #3d5a1e 3px, transparent 3px), linear-gradient(0deg, #3d5a1e 3px, transparent 3px), repeating-linear-gradient(90deg, rgba(120,150,60,.2) 0 2px, transparent 2px 7px);
    background-size:50% 50%, 50% 50%, auto; transition:filter .2s; }
  .mz-room.next .mz-floor { box-shadow:0 0 0 5px #ffd400, 0 0 16px 4px rgba(255,212,0,.8); animation:mz-glow 1s ease-in-out infinite; }
  .mz-room.seen .mz-floor { filter:brightness(.92) saturate(.8); }
  .mz-room.dark .mz-floor { background:#2a1a0e; }
  .mz-room.dark .mz-floor::after { content:"👀"; position:absolute; left:50%; top:50%; transform:translate(-50%, -50%); font-size:calc(var(--cs) * .38); animation:mz-peek 1.6s ease-in-out infinite; }
  .mz-room.dark.next .mz-floor { box-shadow:0 0 0 5px #a06bff; }
  .mz-lurker { position:absolute; left:50%; top:50%; width:70%; aspect-ratio:1; transform:translate(-50%, -50%) scale(0); border-radius:50%; background:#6b3fa0; border:4px solid #111;
    transition:transform .2s cubic-bezier(.2,1.8,.4,1); z-index:3; }
  .mz-lurker::before, .mz-lurker::after { content:""; position:absolute; top:26%; width:28%; aspect-ratio:1; background:#fff; border:3px solid #111; border-radius:50%;
    background-image:radial-gradient(circle, #111 0 38%, transparent 40%); }
  .mz-lurker::before { left:14%; } .mz-lurker::after { right:14%; }
  .mz-room.boo .mz-lurker { transform:translate(-50%, -50%) scale(1.2); }
  .mz-lantern { position:absolute; font-size:calc(var(--cs) * .32); line-height:1; pointer-events:none; z-index:2; }
  /* The exits: shoji doors under the bottom row, each with an option */
  .mz-exit { position:absolute; width:calc(var(--cs) - 12px); height:calc(var(--es) - 10px); padding:0; border:4px solid #111; border-radius:6px; background:#2a1a0e; overflow:hidden;
    font:inherit; cursor:pointer; touch-action:manipulation; }
  .mz-out { position:absolute; inset:0; }
  .mz-out.water { background:radial-gradient(ellipse at 50% 60%, #7fd3ff 0 30%, #2d8ee0 60%, #1b5fa8 100%); }
  .mz-out.garden { background:linear-gradient(180deg, #ffd6e8, #c8f0a8); }
  .mz-out.garden::after { content:"⛩️"; position:absolute; left:50%; top:50%; transform:translate(-50%, -50%); font-size:calc(var(--es) * .55); }
  .mz-panel { position:absolute; inset:0; background:#fff7e0; border:3px solid #8b5a2b; display:flex; align-items:center; justify-content:center; transition:transform .35s ease-in-out;
    background-image:linear-gradient(90deg, rgba(139,90,43,.45) 2px, transparent 2px), linear-gradient(0deg, rgba(139,90,43,.45) 2px, transparent 2px); background-size:25% 33%; }
  .mz-sign { padding:2px 6px; min-width:62%; background:#fff; border:4px solid #111; border-radius:10px; font-size:calc(var(--es) * .5); line-height:1.05; color:#111; white-space:nowrap; text-align:center; }
  .mz-exit.open .mz-panel { transform:translateX(90%); }
  .mz-exit.next { box-shadow:0 0 0 5px #ffd400, 0 0 16px 4px rgba(255,212,0,.8); animation:mz-glow 1s ease-in-out infinite; }
  .mz-exit.right { box-shadow:0 0 0 5px #fff, 0 0 0 10px #00b86b; }
  .mz-exit.dim { opacity:.5; }
  /* Your monster and the chaser, seen from above. --pz is their size */
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
  .mz-me.scared b, .mz-me.caught b { border-radius:50%; left:40%; right:40%; }
  .mz-word { position:absolute; transform:translate(-50%, -50%) rotate(-8deg); z-index:10; pointer-events:none; font-size:2.2rem; color:#ffd400; -webkit-text-stroke:2px #111;
    paint-order:stroke fill; text-shadow:0 4px 0 #111; white-space:nowrap; animation:mz-pop .35s cubic-bezier(.2,1.8,.4,1) both; }
  .mz-word.bad { color:#7fd3ff; } .mz-word.boo { color:#c9a2ff; font-size:1.8rem; }
  .mz-petal { position:absolute; top:-30px; font-size:1.6rem; pointer-events:none; z-index:10; }
  @keyframes mz-glow { 50% { filter:brightness(1.12); } }
  @keyframes mz-peek { 0%, 70%, 100% { opacity:1; } 80% { opacity:.2; } }
  @keyframes mz-goggle { 0%, 100% { transform:translate(-16%, 0); } 50% { transform:translate(16%, -12%); } }
  @keyframes mz-sink { to { transform:var(--at) scale(.2); opacity:.2; } }
  @keyframes mz-pop { from { transform:translate(-50%, -50%) rotate(-8deg) scale(.2); } }
  @media (prefers-reduced-motion: reduce) { .mz-room.next .mz-floor, .mz-exit.next, .mz-room.dark .mz-floor::after, .mz-me i::after, .mz-oni i::after { animation:none !important; } }`;

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
    duration: 16000,
    input: "tap",
    tutorial: true, // has a ctx.tutorial script

    start(ctx) {
      injectCss();
      const speed = ctx.speed || 1;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const { tone, sweep, noise } = ctx.sfx;
      const C = ctx.choiceRows(1, COLS, { lowercase: true });
      const exitsOpt = ctx.shuffle(C.rows[0].slice()); // one option per column
      const rightCol = exitsOpt.findIndex((o) => o.right);
      const pace = 0.6 + 0.4 * speed;

      // ---------- The maze: a start column, and dark rooms that never block the way ----------
      const startCol = Math.floor(Math.random() * COLS);
      const key = (c, r) => r * COLS + c;
      // Rooms you can reach from (c, r): left, right, down.
      const moves = (c, r) => [[c - 1, r], [c + 1, r], [c, r + 1]].filter(([x, y]) => x >= 0 && x < COLS && y < ROWS);
      function reachesAll(dark) { // every bottom room reachable from the start without dark rooms?
        const seen = new Set([key(startCol, 0)]), q = [[startCol, 0]];
        while (q.length) { const [c, r] = q.shift(); for (const [x, y] of moves(c, r)) { const k = key(x, y); if (!seen.has(k) && !dark.has(k)) { seen.add(k); q.push([x, y]); } } }
        return [...Array(COLS)].every((_, c) => seen.has(key(c, ROWS - 1)));
      }
      let dark = new Set();
      const nDark = speed >= 1.5 ? 3 : 2;
      for (let tries = 0; tries < 60; tries++) {
        const d = new Set();
        while (d.size < nDark) { const c = Math.floor(Math.random() * COLS), r = 1 + Math.floor(Math.random() * (ROWS - 1)); d.add(key(c, r)); }
        if (reachesAll(d)) { dark = d; break; }
      }

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
        el.className = "mz-room" + (dark.has(key(c, r)) ? " dark" : "");
        el.setAttribute("aria-label", TEXT.roomLabel);
        el.innerHTML = '<div class="mz-floor"></div>' + (dark.has(key(c, r)) ? '<div class="mz-lurker"></div>' : "");
        el.addEventListener("pointerdown", (e) => { e.preventDefault(); tapRoom(c, r); });
        el.addEventListener("click", (e) => { if (e.detail === 0) tapRoom(c, r); });
        board.appendChild(el);
        rooms[key(c, r)] = { el, c, r };
      }
      // Two paper lanterns on the top corners, for the look.
      ["left:-2px;top:-6px", "right:-2px;top:-6px"].forEach((pos) => {
        const l = document.createElement("div");
        l.className = "mz-lantern"; l.textContent = "🏮"; l.style.cssText = pos;
        board.appendChild(l);
      });
      const exits = exitsOpt.map((opt, c) => {
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
      const me = document.createElement("div");
      me.className = "mz-me";
      me.innerHTML = '<div class="mz-mb"></div><i class="l"></i><i class="r"></i><b></b>';
      board.appendChild(me);
      const oni = document.createElement("div");
      oni.className = "mz-oni";
      oni.innerHTML = '<div class="mz-mb"></div><i class="l"></i><i class="r"></i><b></b>';
      oni.style.display = "none";
      board.appendChild(oni);

      // ---------- Layout: 4 room rows, then the row of exits (a little shorter) ----------
      let cs = 80, es = 64, pz = 44;
      function layout() {
        const W = mazeEl.clientWidth - 16, H = mazeEl.clientHeight - 14;
        cs = Math.floor(Math.max(54, Math.min(W / COLS, H / (ROWS + 0.85))));
        es = Math.round(cs * 0.85);
        pz = Math.round(cs * 0.52);
        mazeEl.style.setProperty("--cs", `${cs}px`); mazeEl.style.setProperty("--es", `${es}px`); mazeEl.style.setProperty("--pz", `${pz}px`);
        mazeEl.style.setProperty("--bw", `${cs * COLS}px`); mazeEl.style.setProperty("--bh", `${cs * ROWS + es}px`);
        rooms.forEach((rm) => { rm.el.style.left = `${rm.c * cs}px`; rm.el.style.top = `${rm.r * cs}px`; });
        exits.forEach((x) => {
          x.el.style.left = `${x.c * cs + 6}px`; x.el.style.top = `${ROWS * cs + 4}px`;
          const sg = x.el.querySelector(".mz-sign");
          sg.style.fontSize = x.opt.kind === "word" ? `${Math.min(es * 0.34, (cs * 0.8) / (x.opt.text.length * 0.6))}px` : "";
        });
        place(me, pos.c, pos.r);
        if (oniAt) place(oni, oniAt.c, oniAt.r);
      }
      const centre = (c, r) => ({ x: c * cs + cs / 2, y: r * cs + cs / 2 });
      function place(el, c, r) { const p = centre(c, r); const t = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px)`; el.style.transform = t; el.style.setProperty("--at", t); }

      // ---------- Moving ----------
      let pos = { c: startCol, r: 0 }, done = false, busy = false, path = [{ c: startCol, r: 0 }];
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
      const canMoveTo = (c, r) => moves(pos.c, pos.r).some(([x, y]) => x === c && y === r);
      function markNext() {
        rooms.forEach((rm) => rm.el.classList.toggle("next", !done && !busy && canMoveTo(rm.c, rm.r)));
        exits.forEach((x) => x.el.classList.toggle("next", !done && !busy && pos.r === ROWS - 1 && x.c === pos.c));
      }
      function tapRoom(c, r) {
        if (done || busy || ctx.ended || !canMoveTo(c, r)) return;
        busy = true; markNext();
        startChase();
        const from = { ...pos };
        tone(500 + r * 60, 0.05, "square", 0.06); // patter
        walk(me, from, { c, r }, reduceMotion ? 1 : 260, () => {
          if (dark.has(key(c, r))) { boo(c, r, from); return; }
          pos = { c, r };
          path.push({ c, r });
          rooms[key(c, r)].el.classList.add("seen");
          if (caughtCheck()) return;
          busy = false; markNext();
        });
      }
      function boo(c, r, from) {
        // A monster jumps out: run back to the room you came from (it only costs time).
        const rm = rooms[key(c, r)].el;
        rm.classList.add("boo");
        me.classList.add("scared");
        sweep(300, 900, 0.2, "square", 0.1); tone(140, 0.3, "sawtooth", 0.12, 0.05); // BOO
        word(centre(c, r), TEXT.boo, "boo");
        ctx.later(() => {
          walk(me, { c, r }, from, reduceMotion ? 1 : 240, () => {
            me.classList.remove("scared");
            rm.classList.remove("boo");
            if (caughtCheck()) return;
            busy = false; markNext();
          });
        }, reduceMotion ? 10 : 380);
      }
      function tapExit(c) {
        if (done || busy || ctx.ended || pos.r !== ROWS - 1 || c !== pos.c) return;
        busy = true; done = true; markNext();
        const x = exits[c];
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
            if (x.opt.right) escape(x); else splash(x);
          })(t0);
        }, reduceMotion ? 10 : 320);
      }
      function escape(x) {
        ctx.win();
        oni.style.display = "none";
        word({ x: cs * COLS / 2, y: cs * 1.2 }, TEXT.out, "");
        [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, "triangle", 0.12, i * 0.09));
        for (let k = 0; k < (reduceMotion ? 6 : 36); k++) {
          const p = document.createElement("div");
          p.className = "mz-petal"; p.textContent = "🌸";
          p.style.left = `${Math.random() * 100}%`;
          fx.appendChild(p);
          const drift = (Math.random() - 0.5) * 120, H = mazeEl.clientHeight;
          p.animate([{ transform: "translate(0, 0) rotate(0)" }, { transform: `translate(${drift}px, ${H + 60}px) rotate(${(Math.random() - 0.5) * 540}deg)` }],
            { duration: 1400 + Math.random() * 900, delay: Math.random() * 500, easing: "ease-in", fill: "both" });
        }
        ctx.say(C.answer);
      }
      function splash(x) {
        ctx.lose();
        me.classList.add("sink");
        noise(0.5, "lowpass", 1500, 200, 0.6); sweep(600, 150, 0.4, "sine", 0.12); // SPLASH
        word({ x: x.c * cs + cs / 2, y: ROWS * cs }, TEXT.splash, "bad");
        ctx.later(() => { showRight(); ctx.say(C.answer); }, 450);
      }
      function showRight() { exits.forEach((x) => x.el.classList.add(x.opt.right ? "right" : "dim")); }

      // ---------- The chaser: follows your path a room at a time once you start ----------
      let oniAt = null, oniStep = 0, chasing = false;
      const chaseMs = 1500 / pace;
      function startChase() {
        if (chasing) return;
        chasing = true;
        ctx.later(() => {
          if (done) return;
          oniAt = { ...path[0] };
          oni.style.display = "";
          place(oni, oniAt.c, oniAt.r);
          tone(110, 0.2, "sawtooth", 0.08); // it's coming
          ctx.later(chaseStep, chaseMs);
        }, 1200 / pace);
      }
      function chaseStep() {
        if (done || ctx.ended) return;
        if (!busy && caughtCheck()) return;   // it's in your room (say, after a BOO! sent you back)
        if (oniStep + 1 < path.length) {
          const from = path[oniStep], to = path[oniStep + 1];
          oniStep++;
          walk(oni, from, to, reduceMotion ? 1 : 320, () => { oniAt = { ...to }; if (!busy) caughtCheck(); });
        }
        ctx.later(chaseStep, chaseMs);
      }
      function caughtCheck() {
        // Called when you've just arrived somewhere, or (not while you're walking) when the chaser moves.
        if (done || !oniAt || oniAt.c !== pos.c || oniAt.r !== pos.r) return false;
        caught();
        return true;
      }
      function caught() {
        done = true;
        ctx.lose();
        me.classList.add("caught");
        tone(120, 0.3, "sawtooth", 0.12);
        word(centre(pos.c, pos.r), TEXT.caught, "bad");
        markNext();
        ctx.later(() => { showRight(); ctx.say(C.answer); }, 400);
      }

      function word(at, text, cls) {
        const w = document.createElement("div");
        w.className = "mz-word" + (cls ? ` ${cls}` : "");
        w.textContent = text;
        const b = board.getBoundingClientRect(), m = mazeEl.getBoundingClientRect();
        w.style.left = `${b.left - m.left + Math.max(70, Math.min(cs * COLS - 70, at.x))}px`; w.style.top = `${b.top - m.top + at.y}px`;
        fx.appendChild(w);
      }
      function replay() { if (!done) ctx.say(C.prompt); }

      ctx.onTimeout(() => {
        done = true;
        me.classList.add("caught");
        markNext();
        showRight();
        ctx.say(C.answer);
      });
      function onKey(e) {
        const m = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowDown: [0, 1] }[e.key];
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
      // Show the target big in the middle for a moment before play starts (ctx.reveal).
      ctx.reveal(card);

      // Tutorial: point at the card and the right exit, then walk the shortest safe way there and go out.
      ctx.tutorial(C.target, async (f) => {
        // Shortest route from the start to the bottom room above the right exit, around the dark rooms.
        const prev = new Map([[key(startCol, 0), null]]), q = [[startCol, 0]];
        while (q.length) { const [c, r] = q.shift(); for (const [x, y] of moves(c, r)) { const k = key(x, y); if (!prev.has(k) && !dark.has(k)) { prev.set(k, key(c, r)); q.push([x, y]); } } }
        const route = [];
        for (let k = key(rightCol, ROWS - 1); k !== null && k !== undefined; k = prev.get(k)) route.unshift(k);
        await f.point(card, 900);
        await f.point(exits[rightCol].el, 800);
        for (const k of route.slice(1)) {
          if (done) break;
          await f.until(() => !busy, 3000);
          await f.tap(rooms[k].el);
        }
        await f.until(() => !busy, 3000);
        await f.tap(exits[rightCol].el);
        await f.until(() => done && ctx.ended, 2500);
      });

      return () => { done = true; ro.disconnect(); document.removeEventListener("keydown", onKey); };
    },
  });
})();
