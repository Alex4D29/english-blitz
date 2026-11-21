// MAZE RUN — a Japanese-themed door maze (an original design: shoji doors, tatami rooms, a torii gate,
// cherry blossoms). The card at the top shows the target (letter; phonics letter; CVC word; HFW 🔊) and
// the voice says it. Seen from above, your monster stands in a tatami room whose far wall has three
// sliding shoji doors, each with an option (a row from ctx.choiceRows). Tap a door: your monster walks
// up and the door slides open. The right door leads to the next room (the view follows you up the
// maze); after the last, a garden with a torii gate and a shower of cherry blossoms. A wrong door hides
// a pool of water (SPLASH, you fall in) or a monster lurking behind it (BOO!): the round is lost and the
// right door glows. Once you start, a red horned monster comes in behind you and creeps closer; it
// catches you exactly when time runs out. 3 rooms, 4 from 1.5×.
(function () {
  const TEXT = {
    name: { en: "Maze Run" },
    icon: "🏯",
    howTo: (list) => ({ en: {
      steps: [
        list.type === "hfw" ? ["👂", "Listen to the word, like \"the\"."] : ["👀", "Look at the card at the top."],
        ["🚪", "Tap the door with the same one. Your monster runs through!"],
        ["🌸", "Room by room, get out of the maze!"],
      ],
      tips: [
        "Wrong doors hide a pool of water… or a monster!",
        "Hurry: a red monster chases you once you start.",
        "Tap the card to hear it again.",
      ],
    } }),
    instruction: { en: "ESCAPE THE\nMAZE!" },
    cardLabel: "Hear it again",
    doorLabel: (t) => `Open the door to ${t}`,
    splash: "SPLASH!",
    boo: "BOO!",
    out: "YOU MADE IT!",
  };

  const CSS = `
  .mz { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:8px; padding-bottom:8px; }
  .mz-card { flex:none; min-width:84px; height:72px; padding:0 18px; border-radius:18px; font:inherit; font-size:2.6rem; line-height:1; background:#fff; color:#111;
    border:5px solid #111; box-shadow:0 6px 0 #111; display:flex; align-items:center; justify-content:center; gap:8px; cursor:pointer; touch-action:manipulation; }
  .mz-card .spk { font-size:1.3rem; opacity:.6; }
  .mz-maze { position:relative; flex:1; min-height:0; width:100%; max-width:520px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111;
    background:#3a2a1a; touch-action:manipulation; }
  .mz-world { position:absolute; left:0; top:0; width:100%; height:100%; will-change:transform; }
  .mz-fx { position:absolute; inset:0; pointer-events:none; overflow:visible; z-index:8; }
  /* A room seen from above: dark wooden walls, a tatami floor, three shoji doors in the far wall */
  .mz-room { position:absolute; left:0; width:100%; box-sizing:border-box; border:10px solid #5a3a1e; border-top-width:0;
    background:#d8c98a; background-image:linear-gradient(90deg, #3d5a1e 5px, transparent 5px), linear-gradient(0deg, #3d5a1e 5px, transparent 5px), repeating-linear-gradient(90deg, rgba(120,150,60,.18) 0 3px, transparent 3px 9px);
    background-size:50% 33.4%, 50% 33.4%, auto; }
  .mz-room::before, .mz-room::after { content:"🏮"; position:absolute; top:calc(var(--dh) + 6px); font-size:calc(var(--pz) * .6); line-height:1; z-index:1; }
  .mz-room::before { left:6px; } .mz-room::after { right:6px; }   /* paper lanterns */
  .mz-wall { position:absolute; left:-10px; right:-10px; top:0; height:var(--dh); background:#5a3a1e; border-bottom:5px solid #111; }
  .mz-door { position:absolute; top:6px; width:var(--dw); height:calc(var(--dh) - 12px); transform:translateX(-50%); padding:0; border:4px solid #111; border-radius:4px;
    background:#2a1a0e; font:inherit; cursor:pointer; touch-action:manipulation; overflow:hidden; z-index:2; }
  .mz-behind { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:calc(var(--dw) * .5); }
  .mz-behind.water { background:radial-gradient(ellipse at 50% 60%, #7fd3ff 0 30%, #2d8ee0 60%, #1b5fa8 100%); }
  .mz-behind.lurk { background:#2a1a0e; }
  .mz-panel { position:absolute; inset:0; background:#fff7e0; border:4px solid #8b5a2b; display:flex; align-items:center; justify-content:center;
    background-image:linear-gradient(90deg, rgba(139,90,43,.5) 2px, transparent 2px), linear-gradient(0deg, rgba(139,90,43,.5) 2px, transparent 2px); background-size:25% 25%;
    transition:transform .35s ease-in-out; }
  .mz-sign { padding:2px 6px; min-width:64%; background:#fff; border:4px solid #111; border-radius:10px; font-size:calc(var(--dw) * .3); line-height:1.05; color:#111; white-space:nowrap; text-align:center; }
  .mz-door.open .mz-panel { transform:translateX(88%); }
  .mz-door.right { box-shadow:0 0 0 5px #fff, 0 0 0 10px #00b86b; }
  .mz-door.dim { opacity:.5; }
  .mz-door.live:not(.open) { animation:mz-glow 1.4s ease-in-out infinite; }
  .mz-lurker { width:70%; aspect-ratio:1; border-radius:50%; background:#6b3fa0; border:4px solid #111; position:relative; transform:scale(0); transition:transform .2s cubic-bezier(.2,1.8,.4,1); }
  .mz-lurker::before, .mz-lurker::after { content:""; position:absolute; top:28%; width:26%; aspect-ratio:1; background:#fff; border:3px solid #111; border-radius:50%;
    background-image:radial-gradient(circle, #111 0 38%, transparent 40%); }
  .mz-lurker::before { left:16%; } .mz-lurker::after { right:16%; }
  .mz-door.open .mz-lurker { transform:scale(1.15); }
  /* The garden at the end: a red torii gate and a cherry tree */
  .mz-garden { position:absolute; left:0; width:100%; background:linear-gradient(180deg, #ffd6e8, #c8f0a8 60%); display:flex; align-items:center; justify-content:center; }
  .mz-torii { position:relative; width:46%; height:40%; }
  .mz-torii::before { content:""; position:absolute; left:-8%; right:-8%; top:0; height:14%; background:#e8173c; border:4px solid #111; border-radius:40% 40% 6px 6px; }
  .mz-torii::after { content:""; position:absolute; left:6%; right:6%; top:26%; height:10%; background:#e8173c; border:4px solid #111; }
  .mz-post { position:absolute; top:10%; bottom:0; width:12%; background:#e8173c; border:4px solid #111; }
  .mz-post.l { left:12%; } .mz-post.r { right:12%; }
  /* Your monster (from above) and the chaser. --pz is their size */
  .mz-me, .mz-oni { position:absolute; left:0; top:0; width:var(--pz); height:var(--pz); margin:calc(var(--pz) * -.5) 0 0 calc(var(--pz) * -.5); z-index:5; pointer-events:none; will-change:transform; }
  .mz-me { z-index:6; }
  .mz-mb { position:absolute; inset:0; border-radius:50%; background:#ff8a1f; border:4px solid #111; }
  .mz-oni .mz-mb { background:#e8173c; }
  .mz-oni .mz-mb::before, .mz-oni .mz-mb::after { content:""; position:absolute; top:-18%; width:22%; height:30%; background:#fff3d6; border:3px solid #111; border-radius:50% 50% 10% 10%; }
  .mz-oni .mz-mb::before { left:16%; transform:rotate(-20deg); } .mz-oni .mz-mb::after { right:16%; transform:rotate(20deg); }   /* little horns */
  .mz-me i, .mz-oni i { position:absolute; top:22%; width:32%; aspect-ratio:1; background:#fff; border:3px solid #111; border-radius:50%; }
  .mz-me i.l, .mz-oni i.l { left:14%; } .mz-me i.r, .mz-oni i.r { right:14%; width:27%; top:25%; }
  .mz-me i::after, .mz-oni i::after { content:""; position:absolute; left:28%; top:30%; width:46%; aspect-ratio:1; background:#111; border-radius:50%; animation:mz-goggle 1.1s ease-in-out infinite; }
  .mz-me b, .mz-oni b { position:absolute; left:30%; right:30%; top:62%; height:16%; background:#6b1020; border:3px solid #111; border-radius:4px 4px 999px 999px; }
  .mz-oni b { background:#fff; background-image:repeating-linear-gradient(90deg, #fff 0 22%, #111 22% 28%); }
  .mz-me.sink { animation:mz-sink .6s ease-in forwards; }
  .mz-me.scared b, .mz-me.caught b { border-radius:50%; left:40%; right:40%; }
  .mz-word { position:absolute; transform:translate(-50%, -50%) rotate(-8deg); z-index:9; pointer-events:none; font-size:2.2rem; color:#ffd400; -webkit-text-stroke:2px #111;
    paint-order:stroke fill; text-shadow:0 4px 0 #111; white-space:nowrap; animation:mz-pop .35s cubic-bezier(.2,1.8,.4,1) both; }
  .mz-word.bad { color:#7fd3ff; }
  .mz-petal { position:absolute; top:-30px; font-size:1.6rem; pointer-events:none; z-index:9; }
  @keyframes mz-glow { 50% { box-shadow:0 0 0 4px rgba(255,255,255,.7); } }
  @keyframes mz-goggle { 0%, 100% { transform:translate(-16%, 0); } 50% { transform:translate(16%, -12%); } }
  @keyframes mz-sink { to { transform:var(--at) scale(.2); opacity:.2; } }
  @keyframes mz-pop { from { transform:translate(-50%, -50%) rotate(-8deg) scale(.2); } }
  @media (prefers-reduced-motion: reduce) { .mz-door.live, .mz-me i::after, .mz-oni i::after { animation:none !important; } }`;

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
    duration: 12000,
    input: "tap",
    tutorial: true, // has a ctx.tutorial script

    start(ctx) {
      injectCss();
      const speed = ctx.speed || 1;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const { tone, sweep, noise } = ctx.sfx;
      const R = speed >= 1.5 ? 4 : 3, N = 3;
      const C = ctx.choiceRows(R, N, { lowercase: true });

      const wrap = document.createElement("div");
      wrap.className = "mz";
      const card = document.createElement("button");
      card.className = "mz-card";
      card.setAttribute("aria-label", TEXT.cardLabel);
      card.innerHTML = '<span class="ct"></span>';
      card.firstChild.textContent = C.cardText;
      if (ctx.canSpeak && !C.listen) card.insertAdjacentHTML("beforeend", '<span class="spk">🔊</span>');
      card.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });
      const maze = document.createElement("div");
      maze.className = "mz-maze";
      const world = document.createElement("div");
      world.className = "mz-world";
      const fx = document.createElement("div");
      fx.className = "mz-fx";
      maze.append(world, fx);
      wrap.append(card, maze);
      ctx.root.appendChild(wrap);

      // Rooms stacked upwards: room k sits one maze-height above room k−1; the garden is above the last.
      const rooms = C.rows.map((row, k) => {
        const el = document.createElement("div");
        el.className = "mz-room";
        el.innerHTML = '<div class="mz-wall"></div>';
        world.appendChild(el);
        const doors = ctx.shuffle(row.slice()).map((opt, i) => {
          const d = document.createElement("button");
          d.className = "mz-door" + (k === 0 ? " live" : "");
          d.setAttribute("aria-label", TEXT.doorLabel(opt.spoken));
          // Behind a wrong door: a pool of water or a lurking monster.
          const behind = opt.right ? "" : Math.random() < 0.5 ? "water" : "lurk";
          d.innerHTML = `<div class="mz-behind ${behind}">${behind === "lurk" ? '<div class="mz-lurker"></div>' : ""}</div><div class="mz-panel"><span class="mz-sign"></span></div>`;
          d.querySelector(".mz-sign").textContent = opt.text;
          d.addEventListener("pointerdown", (e) => { e.preventDefault(); if (k === step) choose(i); });
          d.addEventListener("click", (e) => { if (e.detail === 0 && k === step) choose(i); });
          el.appendChild(d);
          return { el: d, opt, i, behind };
        });
        return { el, doors };
      });
      const garden = document.createElement("div");
      garden.className = "mz-garden";
      garden.innerHTML = '<div class="mz-torii"><div class="mz-post l"></div><div class="mz-post r"></div></div>';
      world.appendChild(garden);
      const me = document.createElement("div");
      me.className = "mz-me";
      me.innerHTML = '<div class="mz-mb"></div><i class="l"></i><i class="r"></i><b></b>';
      world.appendChild(me);
      const oni = document.createElement("div");
      oni.className = "mz-oni";
      oni.innerHTML = '<div class="mz-mb"></div><i class="l"></i><i class="r"></i><b></b>';
      oni.style.display = "none";
      maze.appendChild(oni);

      // ---------- Layout ----------
      let W = 0, H = 0, dw = 100, dh = 120, pz = 60;
      const roomTop = (k) => -k * H;
      const doorX = (i) => (W / N) * (i + 0.5);
      function layout() {
        W = maze.clientWidth; H = maze.clientHeight;
        dw = Math.max(70, Math.min(W / N - 18, 140)); dh = Math.max(90, Math.min(H * 0.32, 150));
        pz = Math.max(52, Math.min(W * 0.18, H * 0.19, 90));
        maze.style.setProperty("--dw", `${dw}px`); maze.style.setProperty("--dh", `${dh}px`); maze.style.setProperty("--pz", `${pz}px`);
        rooms.forEach((r, k) => {
          r.el.style.top = `${roomTop(k)}px`; r.el.style.height = `${H}px`;
          r.doors.forEach((d) => {
            d.el.style.left = `${doorX(d.i)}px`;
            const sg = d.el.querySelector(".mz-sign");
            sg.style.fontSize = d.opt.kind === "word" ? `${Math.min(dw * 0.28, (dw * 0.85) / (d.opt.text.length * 0.6))}px` : "";
          });
        });
        garden.style.top = `${roomTop(R)}px`; garden.style.height = `${H}px`;
        if (!busy) setMe(W / 2, roomTop(step) + H - pz * 0.9);
        setCam(step * H);
      }
      let cam = 0;
      function setCam(c) { cam = c; world.style.transform = `translateY(${c.toFixed(1)}px)`; }
      let meAt = { x: 0, y: 0 };
      function setMe(x, y) { meAt = { x, y }; const t = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`; me.style.transform = t; me.style.setProperty("--at", t); }
      function glide(to, ms, then, camTo) {
        const from = { ...meAt }, c0 = cam, t0 = performance.now();
        (function go(now) {
          const k = Math.min(1, (now - t0) / ms), e = k * k * (3 - 2 * k);
          setMe(from.x + (to.x - from.x) * e, from.y + (to.y - from.y) * e);
          if (camTo !== undefined) setCam(c0 + (camTo - c0) * e);
          if (k < 1) { ctx.raf(go); return; }
          then();
        })(t0);
      }

      // ---------- The chaser: comes in behind you once you start, and catches you at timeout ----------
      let chaseFrom = 0, deadline = 0;
      function chase(now) {
        if (!chaseFrom || ctx.ended) return;
        const p = Math.min(1, (now - chaseFrom) / Math.max(500, deadline - chaseFrom));
        const meScreenY = meAt.y + cam;
        const y = H + pz - (H + pz - (meScreenY + pz * 0.9)) * p;
        oni.style.transform = `translate(${(W / 2 + Math.sin(now * 0.006) * pz * 0.3).toFixed(1)}px, ${y.toFixed(1)}px)`;
        ctx.raf(chase);
      }

      // ---------- Doors ----------
      let step = 0, done = false, busy = false;
      function choose(i) {
        if (done || busy || ctx.ended) return;
        busy = true;
        if (!chaseFrom) { chaseFrom = performance.now(); oni.style.display = ""; ctx.raf(chase); }
        const d = rooms[step].doors[i];
        rooms[step].doors.forEach((x) => x.el.classList.remove("live"));
        sweep(500, 700, 0.1, "square", 0.05); // patter
        glide({ x: doorX(i), y: roomTop(step) + dh + pz * 0.6 }, reduceMotion ? 1 : 320, () => {
          d.el.classList.add("open");
          noise(0.25, "bandpass", 1200, 800, 0.25); // the shoji slides
          ctx.later(() => (d.opt.right ? through(d) : trap(d)), reduceMotion ? 10 : 300);
        });
      }
      function through(d) {
        if (d.opt.kind === "pic") ctx.say(d.opt.spoken);
        step++;
        const last = step >= R;
        // Through the door, up into the next room (the view follows), to its bottom middle.
        glide({ x: doorX(d.i), y: roomTop(step - 1) - pz * 0.4 }, reduceMotion ? 1 : 260, () => {
          glide({ x: W / 2, y: roomTop(step) + H * (last ? 0.62 : 1) - pz * (last ? 0 : 0.9) }, reduceMotion ? 1 : 500, () => {
            if (last) { win(); return; }
            rooms[step].doors.forEach((x) => x.el.classList.add("live"));
            busy = false;
          }, step * H);
        });
      }
      function trap(d) {
        done = true;
        ctx.lose();
        if (d.behind === "water") {
          glide({ x: doorX(d.i), y: roomTop(step) + dh * 0.45 }, reduceMotion ? 1 : 220, () => {
            me.classList.add("sink");
            noise(0.5, "lowpass", 1500, 200, 0.6); sweep(600, 150, 0.4, "sine", 0.12); // SPLASH
            word(doorX(d.i), dh * 0.6, TEXT.splash, true);
          });
        } else {
          me.classList.add("scared");
          sweep(300, 900, 0.2, "square", 0.1); tone(140, 0.3, "sawtooth", 0.12, 0.05); // BOO
          word(doorX(d.i), dh * 0.6, TEXT.boo, false);
          glide({ x: meAt.x, y: meAt.y + pz * 1.2 }, reduceMotion ? 1 : 250, () => {}); // jumps back
        }
        ctx.later(() => { showRight(); ctx.say(C.answer); }, 500);
      }
      function win() {
        done = true;
        ctx.win();
        oni.style.display = "none";
        word(W / 2, H * 0.25, TEXT.out, false);
        [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, "triangle", 0.12, i * 0.09));
        // A shower of cherry blossoms.
        for (let k = 0; k < (reduceMotion ? 6 : 34); k++) {
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
      function showRight() {
        const row = rooms[Math.min(step, R - 1)].doors;
        row.forEach((d) => d.el.classList.add(d.opt.right ? "right" : "dim"));
      }
      function word(x, y, text, bad) {
        const w = document.createElement("div");
        w.className = "mz-word" + (bad ? " bad" : "");
        w.textContent = text;
        w.style.left = `${Math.max(80, Math.min(W - 80, x))}px`; w.style.top = `${y}px`;
        fx.appendChild(w);
      }
      function replay() { if (!done) ctx.say(C.prompt); }

      ctx.onTimeout(() => {
        done = true;
        // The chaser catches you.
        oni.style.display = "";
        oni.style.transform = `translate(${meAt.x}px, ${meAt.y + cam + pz * 0.6}px)`;
        me.classList.add("caught");
        tone(120, 0.3, "sawtooth", 0.12);
        showRight();
        ctx.say(C.answer);
      });
      function onKey(e) {
        const i = parseInt(e.key, 10) - 1;
        if (i >= 0 && i < N) { e.preventDefault(); choose(i); }
        else if (e.key === " ") { e.preventDefault(); replay(); }
      }
      document.addEventListener("keydown", onKey);

      layout();
      const ro = new ResizeObserver(layout);
      ro.observe(maze);
      ctx.say(C.prompt);
      // Show the target big in the middle for a moment before play starts (ctx.reveal).
      const revealMs = ctx.reveal(card);
      deadline = performance.now() + Math.max(500, revealMs + 60) + ctx.timeLimit;

      // Tutorial: point at the card, then open the right door in each room.
      ctx.tutorial(C.target, async (f) => {
        await f.point(card, 900);
        for (let k = 0; k < R && !done; k++) {
          await f.until(() => !busy && step === k, 4000);
          await f.tap(rooms[k].doors.find((d) => d.opt.right).el);
        }
        await f.until(() => done, 3000);
      });

      return () => { done = true; ro.disconnect(); document.removeEventListener("keydown", onKey); };
    },
  });
})();
