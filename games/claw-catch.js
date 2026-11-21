// CLAW CATCH — a hungry letter monster (a big green B with googly eyes) waits
// beside a claw machine and says "I want B!". The machine is seen from above:
// a floor of picture prizes (⚽ 🐶 🐷 …) with a claw hanging over it.
//
// Step 1: the claw slides up and down. Press STOP (or tap the machine).
// Step 2: it slides left and right. Press STOP again.
// The claw drops and grabs the prize under it. The prize under the claw glows
// the whole time, so the player can see what they'll get.
// Right prize (ball for B): the claw lifts it, carries it to the monster, CHOMP.
// Wrong prize: it slips out of the claw, the monster shakes its head, and the
// right prize glows. Out of time: the right prize glows.
//
// Letter lists: the monster is the letter, and it wants a picture whose word
// starts with it (items like X/fox are skipped). The voice says "B for ball" after.
// Word lists: the monster holds the word ("cat") and wants its picture (🐱).
// The claw starts in a lane at the left side, so it never hides a picture while
// it slides up and down. The row it's level with glows softly; once it slides
// across, only the prize under it glows.
// Faster speeds: the claw moves faster, and there are 6 prizes from 1.5× (4 at 1×).
(function () {
  const TEXT = {
    name: { en: "Claw Catch" },
    icon: "🧸",
    // Practice mode's "How to play" card: steps (icon + sentence) and tips.
    howTo: (list) => (list.type === "phonics"
      ? { en: {
          steps: [
            ["👂", "The monster says its letter, like \"B\". It wants something that starts with B!"],
            ["↕️", "The claw moves up and down. Press STOP when it's on the right row."],
            ["↔️", "Then it moves side to side. Press STOP on the right prize. B… ball! ⚽"],
          ],
          tips: [
            "The prize under the claw glows, so you can see what you'll grab.",
            "You can tap the machine to stop, too.",
            "Tap the monster to hear its letter again.",
            "When the game speeds up, the claw moves faster and there are more prizes.",
          ],
        } }
      : { en: {
          steps: [
            ["👂", "The monster holds a word, like \"cat\", and says it. It wants that picture! 🐱"],
            ["↕️", "The claw moves up and down. Press STOP when it's on the right row."],
            ["↔️", "Then it moves side to side. Press STOP on the right picture."],
          ],
          tips: [
            "The prize under the claw glows, so you can see what you'll grab.",
            "You can tap the machine to stop, too.",
            "Tap the monster to hear the word again.",
            "When the game speeds up, the claw moves faster and there are more prizes.",
          ],
        } }),
    instruction: { en: "CATCH IT!" },
    prompt: (spoken) => `I want ${spoken}!`,
    answer: (spoken, word) => (word ? `${spoken} for ${word}` : spoken),
    stop: "STOP!",
    arrowY: "↕️",
    arrowX: "↔️",
    bubble: "❓",
    bubbleHappy: "❤️",
    monsterLabel: (spoken) => `Monster ${spoken}. Tap to hear it again.`,
    machineLabel: "Claw machine. Tap to stop the claw.",
  };

  const MONSTER_COLORS = ["#1fd65f", "#ff8a00", "#1e9bff", "#b04dff", "#ff2e88"];
  const STOP_GAP_MS = 250; // ignore a second STOP this soon (a double tap shouldn't skip a step)
  const LANE = 0.9;        // width of the claw's starting lane at the left, in cells

  const CSS = `
  .cc { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:10px; }
  .cc-fx { position:absolute; inset:0; pointer-events:none; z-index:6; overflow:visible; }

  /* ---- the monster ---- */
  .cc-top { flex:none; width:100%; height:clamp(124px, 28%, 210px); display:flex; align-items:flex-end; justify-content:center; padding-top:18px; }
  .cc-mon { --S:min(36vw, 22dvh, 170px); position:relative; width:var(--S); height:var(--S); font-size:var(--S);
    padding:0; margin:0; border:0; background:none; font-family:inherit; cursor:pointer; touch-action:manipulation; }
  .cc-body { position:absolute; inset:0; transform-origin:50% 100%; animation:cc-bob .9s ease-in-out infinite alternate; }
  .cc-glyph { position:absolute; left:-60%; right:-60%; top:0; line-height:1; text-align:center; z-index:1; color:var(--mc);
    -webkit-text-stroke:.045em #111; paint-order:stroke fill; text-shadow:0 .035em 0 #111; }
  .cc-mon.word .cc-glyph { font-size:.55em; top:.42em; }
  .cc-eyes { position:absolute; left:50%; top:-.1em; transform:translateX(-50%); display:flex; gap:.03em; z-index:3; }
  .cc-eye { position:relative; width:.25em; height:.25em; background:#fff; border:.03em solid #111; border-radius:50%; }
  .cc-eye::after { content:""; position:absolute; left:28%; top:42%; width:46%; height:46%; background:#111; border-radius:50%; transition:top .2s; }
  .cc-mouth { position:absolute; left:50%; top:46%; width:.32em; height:.2em; margin-left:-.16em; z-index:3; overflow:hidden;
    background:#3a0010; border:.03em solid #111; border-radius:20% 20% 50% 50% / 10% 10% 90% 90%; transform-origin:50% 0; }
  .cc-mouth::after { content:""; position:absolute; left:25%; right:25%; bottom:-10%; height:45%; background:#ff5c8a; border-radius:50% 50% 0 0; }
  .cc-bubble { position:absolute; left:92%; top:-.05em; z-index:4; font-size:.22em; padding:.1em .22em; line-height:1; white-space:nowrap;
    background:#fff; border:.07em solid #111; border-radius:.5em; box-shadow:0 .07em 0 #111; animation:cc-bob .7s ease-in-out infinite alternate; }
  .cc-mon.happy .cc-body { animation:cc-jump .4s cubic-bezier(.2,1.8,.4,1) 3; }
  .cc-mon.happy .cc-eye::after { top:22%; }
  .cc-mon.chomp .cc-mouth { animation:cc-chomp .12s ease-in-out 6 alternate; }
  .cc-mon.nope .cc-body { animation:cc-no .45s ease-in-out 2; }
  .cc-mon.nope .cc-mouth { height:.07em; top:52%; border-radius:99px; }

  /* ---- the machine (seen from above) ---- */
  .cc-machine { position:relative; flex:1; min-height:0; width:100%; display:flex; padding:10px;
    background:#ff4fa3; border:5px solid #111; border-radius:26px; box-shadow:0 6px 0 #111; touch-action:none; cursor:pointer; }
  .cc-machine::before { content:""; position:absolute; left:16px; right:16px; top:3px; height:4px; border-radius:4px;
    background:repeating-linear-gradient(90deg, #fff 0 8px, #ffd400 8px 16px); opacity:.9; }
  .cc-floor { position:relative; flex:1; border:4px solid #111; border-radius:14px;
    background:repeating-conic-gradient(#c6ecff 0 25%, #ade0fa 0 50%) 0 0 / 44px 44px; }
  .cc-floor::after { content:""; position:absolute; inset:0; border-radius:10px; pointer-events:none; z-index:5;
    background:linear-gradient(115deg, transparent 20%, rgba(255,255,255,.35) 22% 30%, transparent 32% 60%, rgba(255,255,255,.2) 62% 65%, transparent 67%); }
  .cc-prize { position:absolute; width:var(--cell); height:var(--cell); margin:calc(var(--cell) / -2) 0 0 calc(var(--cell) / -2);
    display:flex; align-items:center; justify-content:center; font-size:calc(var(--cell) * .6); line-height:1; border-radius:50%; z-index:1;
    filter:drop-shadow(0 4px 0 rgba(0,0,0,.25)); transition:transform .12s, background-color .12s, box-shadow .12s; }
  .cc-prize.row { background:rgba(255,255,255,.4); box-shadow:0 0 0 3px rgba(255,212,0,.6); }
  .cc-prize.hover { background:rgba(255,255,255,.75); box-shadow:0 0 0 5px #ffd400; transform:scale(1.08); }
  .cc-lane { position:absolute; left:0; top:0; bottom:0; width:var(--lane); border-radius:10px 0 0 10px; pointer-events:none;
    background:rgba(17,17,17,.1); border-right:4px dashed rgba(17,17,17,.3); }
  .cc-prize.answer { background:#fff; box-shadow:0 0 0 6px #ffd400, 0 0 26px 12px #ffd400; animation:cc-wiggle .3s ease-in-out 4; }
  .cc-prize.slip { animation:cc-slip .45s cubic-bezier(.3,1.6,.5,1); }
  .cc-head .cc-prize { left:50%; top:50%; transform:scale(.8); background:none; box-shadow:none; }
  .cc-bar { position:absolute; left:-4px; right:-4px; height:14px; margin-top:-7px; z-index:0; pointer-events:none; /* under the prizes */
    background:#ffd400; border-top:4px solid #111; border-bottom:4px solid #111; box-shadow:0 5px 0 rgba(0,0,0,.18); }
  .cc-bar.lit { background:#fff36b; }

  /* ---- the claw (from above: hub, three prongs, shadow) ---- */
  .cc-claw { position:absolute; width:calc(var(--cell) * .7); height:calc(var(--cell) * .7); transform:translate(-50%, -50%);
    z-index:3; pointer-events:none; }
  .cc-claw.snap { transition:left .14s ease-out, top .14s ease-out; }
  .cc-claw.carry, .cc-bar.carry { transition:left .26s ease-in-out, top .26s ease-in-out; }
  .cc-shadow { position:absolute; inset:5%; border-radius:50%; background:rgba(0,0,0,.25); transform:translate(16%, 24%);
    transition:transform .18s ease-in, opacity .18s; }
  .cc-head { position:absolute; inset:0; transition:transform .18s ease-in; }
  .cc-claw.down .cc-head { transform:scale(.7); }
  .cc-claw.down .cc-shadow { transform:translate(0, 0) scale(.75); opacity:.7; }
  .cc-prong { position:absolute; left:50%; top:50%; width:20%; height:52%; margin-left:-10%; z-index:1;
    background:#d5dce6; border:4px solid #111; border-radius:6px 6px 50% 50%; transform-origin:50% 0;
    transform:rotate(var(--a)) translateY(14%); transition:transform .14s ease-out; }
  .cc-claw.open .cc-prong { transform:rotate(var(--a)) translateY(42%) scaleY(1.1); }
  .cc-hub { position:absolute; left:28%; top:28%; width:44%; height:44%; z-index:2; border-radius:50%;
    background:radial-gradient(circle at 35% 35%, #fff 0 12%, #9aa6b8 14%); border:4px solid #111; }

  /* ---- STOP button ---- */
  .cc-stop { flex:none; width:min(82%, 320px); min-height:clamp(64px, 11dvh, 84px); display:flex; align-items:center; justify-content:center; gap:12px;
    background:#e8173c; color:#fff; border:6px solid #111; border-radius:999px; box-shadow:0 8px 0 #111;
    font:inherit; font-size:clamp(1.8rem, 9vw, 2.6rem); line-height:1; -webkit-text-stroke:2px #111; paint-order:stroke fill;
    touch-action:manipulation; animation:cc-pulse .9s ease-in-out infinite; }
  .cc-stop.press { animation:none; transform:translateY(6px); box-shadow:0 2px 0 #111; }
  .cc-stop:disabled { animation:none; filter:grayscale(.7) brightness(.9); }
  .cc-arrow { display:inline-block; -webkit-text-stroke:0; font-size:.85em; animation:cc-nudge-y .45s ease-in-out infinite alternate; }
  .cc-stop.x .cc-arrow { animation-name:cc-nudge-x; }

  .cc-fly { position:absolute; left:0; top:0; line-height:1; z-index:7; }
  .cc-heart { position:absolute; font-size:30px; line-height:1; z-index:7; }

  @keyframes cc-bob     { to { transform:translateY(-6%); } }
  @keyframes cc-jump    { 50% { transform:translateY(-22%) scale(1.08); } }
  @keyframes cc-chomp   { to { transform:scaleY(.25); } }
  @keyframes cc-no      { 25% { transform:rotate(-10deg); } 75% { transform:rotate(10deg); } }
  @keyframes cc-pulse   { 50% { transform:scale(1.04); } }
  @keyframes cc-nudge-y { from { transform:translateY(-12%); } to { transform:translateY(12%); } }
  @keyframes cc-nudge-x { from { transform:translateX(-14%); } to { transform:translateX(14%); } }
  @keyframes cc-wiggle  { 25% { rotate:-12deg; } 75% { rotate:12deg; } }
  @keyframes cc-slip    { 0% { transform:scale(.8) translateY(-20%); } 60% { transform:scale(1.05) translateY(4%); } 100% { transform:none; } }
  @media (prefers-reduced-motion: reduce) {
    .cc-body, .cc-bubble, .cc-stop, .cc-arrow, .cc-prize.answer, .cc-prize.slip,
    .cc-mon.happy .cc-body, .cc-mon.nope .cc-body { animation:none !important; }
  }`;

  function injectCss() {
    if (document.getElementById("cc-css")) return;
    const style = document.createElement("style");
    style.id = "cc-css";
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  registerMicrogame({
    id: "claw-catch",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["phonics", "cvc"], // needs a picture for every item
    duration: 9000, // two timed stops
    input: "tap",
    tutorial: true, // has a ctx.tutorial script

    start(ctx) {
      injectCss();
      const isWord = ctx.list.type !== "phonics";
      const speed = ctx.speed || 1;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const later = ctx.later;
      const { tone, sweep, noise } = ctx.sfx;
      const spoken = (it) => it.say || it.text;
      const firstLetter = (it) => (it.word || "").charAt(0).toUpperCase();

      // For letters, the picture's word must start with the letter ("X for fox" can't work).
      const fits = (it) => it.emoji && (isWord || firstLetter(it) === it.text.toUpperCase());
      const target = ctx.items.find(fits) || ctx.items.find((it) => it.emoji) || ctx.items[0];
      const prompt = TEXT.prompt(spoken(target));
      const answer = isWord ? spoken(target) : TEXT.answer(spoken(target), target.word);

      const cols = speed >= 1.5 ? 3 : 2;               // 4 prizes at 1×, 6 from 1.5×
      const rows = 2;
      const across = LANE + cols;                      // floor width in cells, lane included
      // Distractor pictures: never another picture that would also be right.
      const others = ctx.pickOptions(target, ctx.items.length).filter((it) =>
        it !== target && it.emoji && it.emoji !== target.emoji &&
        (isWord || firstLetter(it) !== target.text.toUpperCase()));
      const prizes = [target, ...others.slice(0, cols * rows - 1)];
      const cells = ctx.shuffle([...prizes, ...Array(cols * rows - prizes.length).fill(null)]);

      // Claw speed: time for one end-to-end sweep.
      const pace = 0.6 + 0.4 * speed;               // 1 at 1×, 1.6 at 2.5×
      const vy = 1 / (1300 / pace);                 // cells per ms
      const vx = 1 / (850 / pace);

      let done = false, phase = "y", lastTs = null, lastStop = 0;
      let cx = LANE / 2, cy = 0.5, dir = 1; // claw position in cells; starts in the lane

      // ---------- DOM ----------
      const wrap = document.createElement("div");
      wrap.className = "cc";

      const top = document.createElement("div");
      top.className = "cc-top";
      const mon = document.createElement("button");
      mon.className = "cc-mon" + (isWord ? " word" : "");
      mon.style.setProperty("--mc", ctx.pick(MONSTER_COLORS));
      mon.setAttribute("aria-label", TEXT.monsterLabel(spoken(target)));
      mon.innerHTML =
        '<div class="cc-body"><div class="cc-glyph"></div>' +
        '<div class="cc-eyes"><div class="cc-eye"></div><div class="cc-eye"></div></div>' +
        '<div class="cc-mouth"></div><div class="cc-bubble"></div></div>';
      mon.querySelector(".cc-glyph").textContent = target.text;
      const bubble = mon.querySelector(".cc-bubble");
      bubble.textContent = TEXT.bubble;
      mon.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });
      mon.addEventListener("click", (e) => { if (e.detail === 0) replay(); });
      top.appendChild(mon);

      const machine = document.createElement("div");
      machine.className = "cc-machine";
      machine.setAttribute("aria-label", TEXT.machineLabel);
      const floor = document.createElement("div");
      floor.className = "cc-floor";
      machine.appendChild(floor);

      const prizeEls = cells.map((item, i) => {
        if (!item) return null;
        const el = document.createElement("div");
        el.className = "cc-prize";
        el.textContent = item.emoji;
        el.style.left = `${(LANE + (i % cols) + 0.5) / across * 100}%`;
        el.style.top = `${(Math.floor(i / cols) + 0.5) / rows * 100}%`;
        floor.appendChild(el);
        return el;
      });

      const lane = document.createElement("div");
      lane.className = "cc-lane";
      lane.style.setProperty("--lane", `${LANE / across * 100}%`);
      floor.insertBefore(lane, floor.firstChild);
      const bar = document.createElement("div");
      bar.className = "cc-bar lit";
      const claw = document.createElement("div");
      claw.className = "cc-claw";
      claw.innerHTML =
        '<div class="cc-shadow"></div><div class="cc-head">' +
        '<div class="cc-prong" style="--a:60deg"></div><div class="cc-prong" style="--a:180deg"></div>' +
        '<div class="cc-prong" style="--a:300deg"></div><div class="cc-hub"></div></div>';
      const head = claw.querySelector(".cc-head");
      floor.append(bar, claw);

      const stopBtn = document.createElement("button");
      stopBtn.className = "cc-stop";
      stopBtn.innerHTML = '<span class="cc-arrow" aria-hidden="true"></span><span class="cc-label"></span>';
      const arrow = stopBtn.querySelector(".cc-arrow");
      arrow.textContent = TEXT.arrowY;
      stopBtn.querySelector(".cc-label").textContent = TEXT.stop;
      stopBtn.addEventListener("pointerdown", (e) => { e.preventDefault(); stop(); });
      stopBtn.addEventListener("click", (e) => { if (e.detail === 0) stop(); });
      machine.addEventListener("pointerdown", (e) => { e.preventDefault(); stop(); });

      const fx = document.createElement("div");
      fx.className = "cc-fx";
      wrap.append(top, machine, stopBtn, fx);
      ctx.root.appendChild(wrap);
      // 👆 just the finger, pressing the right end of STOP (beside the word, so it stays readable).
      ctx.later(() => {
        const g = ctx.root.getBoundingClientRect(), r = stopBtn.getBoundingClientRect();
        ctx.hint({ x: r.right - 34 - g.left, y: r.top + r.height / 2 - g.top }, null, { noWord: true, scale: 0.75 });
      }, 80);

      // Cell size drives the prize and claw size.
      function measure() {
        const r = floor.getBoundingClientRect();
        floor.style.setProperty("--cell", `${Math.min(r.width / across, r.height / rows)}px`);
      }
      measure();
      const ro = new ResizeObserver(measure);
      ro.observe(floor);

      // ---------- The claw ----------
      function placeClaw() {
        claw.style.left = `${cx / across * 100}%`;
        claw.style.top = `${cy / rows * 100}%`;
        bar.style.top = claw.style.top;
      }
      const colIndex = () => Math.max(0, Math.min(cols - 1, Math.floor(cx - LANE)));
      const rowIndex = () => Math.max(0, Math.min(rows - 1, Math.floor(cy)));
      const cellIndex = () => rowIndex() * cols + colIndex();
      // In the lane: the whole row it's level with glows softly. Over the prizes: just the one below.
      function hover(clear) {
        const r = rowIndex();
        const c = cx < LANE ? -1 : colIndex();
        prizeEls.forEach((el, i) => {
          if (!el) return;
          const inRow = !clear && Math.floor(i / cols) === r;
          el.classList.toggle("row", inRow && c < 0);
          el.classList.toggle("hover", inRow && i % cols === c);
        });
      }

      function frame(ts) {
        if (phase === "y" || phase === "x") {
          const dt = lastTs == null ? 0 : Math.min(50, ts - lastTs);
          lastTs = ts;
          if (phase === "y") {
            cy += dir * vy * dt;
            if (cy >= rows - 0.5) { cy = rows - 0.5; dir = -1; }
            if (cy <= 0.5) { cy = 0.5; dir = 1; }
          } else {
            // Leaves the lane once, then sweeps between the first and last column.
            cx += dir * vx * dt;
            if (cx >= across - 0.5) { cx = across - 0.5; dir = -1; }
            if (dir < 0 && cx <= LANE + 0.5) { cx = LANE + 0.5; dir = 1; }
          }
          placeClaw();
          hover();
          ctx.raf(frame);
        }
      }

      function replay() {
        if (done) return;
        ctx.say(prompt);
      }

      function stop() {
        if (done || ctx.ended) return;
        const now = performance.now();
        if (now - lastStop < STOP_GAP_MS) return;
        lastStop = now;
        stopBtn.classList.add("press");
        later(() => stopBtn.classList.remove("press"), 120);
        stopSound();
        if (phase === "y") {
          phase = "x";
          dir = 1;
          bar.classList.remove("lit");
          stopBtn.classList.add("x");
          arrow.textContent = TEXT.arrowX;
        } else if (phase === "x") {
          grab();
        }
      }

      // Second STOP: the result is decided now, then the claw plays it out.
      function grab() {
        phase = "grab";
        done = true;
        stopBtn.disabled = true;
        const i = cellIndex();
        const el = prizeEls[i];
        const won = cells[i] === target;
        if (won) ctx.win(); else ctx.lose();

        // Snap to the middle of the cell (from the lane too, if STOP came that early), open, drop.
        hover(true);
        cx = LANE + (i % cols) + 0.5;
        cy = Math.floor(i / cols) + 0.5;
        claw.classList.add("snap", "open");
        placeClaw();
        later(() => { claw.classList.add("down"); dropSound(); }, 100);
        later(() => {                                   // close on it
          claw.classList.remove("open");
          clankSound();
        }, 260);
        later(() => {                                   // lift it
          if (el) {
            el.classList.remove("hover");
            head.insertBefore(el, head.firstChild);
          }
          claw.classList.remove("down");
          liftSound();
          if (won) ctx.say(answer);
        }, 330);

        if (won) {
          later(() => {                                 // carry it up towards the monster
            claw.classList.remove("snap");
            claw.classList.add("carry");
            bar.classList.add("carry");
            claw.style.left = "50%";
            claw.style.top = "-4%";
            bar.style.top = "-4%";
          }, 480);
          later(() => feed(el), 720);
        } else {
          later(() => {                                 // it slips out
            if (el) {
              floor.insertBefore(el, bar);
              el.classList.add("slip");
              slipSound();
            }
            mon.classList.add("nope");
            nopeSound();
            showAnswer();
            ctx.say(answer);
          }, el ? 520 : 440);
        }
      }

      // The prize flies from the claw into the monster's mouth.
      function feed(el) {
        const w = wrap.getBoundingClientRect();
        const from = el.getBoundingClientRect();
        const mouth = mon.querySelector(".cc-mouth").getBoundingClientRect();
        const fly = document.createElement("div");
        fly.className = "cc-fly";
        fly.textContent = el.textContent;
        fly.style.fontSize = getComputedStyle(el).fontSize;
        el.style.visibility = "hidden";
        fx.appendChild(fly);
        const fw = from.width, fh = from.height;
        const x0 = from.left - w.left + fw / 2, y0 = from.top - w.top + fh / 2;
        const x1 = mouth.left - w.left + mouth.width / 2, y1 = mouth.top - w.top + mouth.height / 2;
        fly.animate(
          [{ transform: `translate(${x0}px,${y0}px) translate(-50%,-50%) scale(.8)` },
           { transform: `translate(${(x0 + x1) / 2}px,${Math.min(y0, y1) - 40}px) translate(-50%,-50%) scale(1)`, offset: 0.5 },
           { transform: `translate(${x1}px,${y1}px) translate(-50%,-50%) scale(.3)`, opacity: 0.4 }],
          { duration: 220, easing: "ease-in", fill: "forwards" });
        later(() => {
          fly.remove();
          bubble.textContent = TEXT.bubbleHappy;
          mon.classList.add("happy", "chomp");
          chompSound();
          hearts(x1, y1);
        }, 210);
      }

      function hearts(x, y) {
        ctx.confetti(fx, x, y, { count: 30 });
        if (reduceMotion) return;
        for (let i = 0; i < 5; i++) {
          const h = document.createElement("div");
          h.className = "cc-heart";
          h.textContent = "❤️";
          fx.appendChild(h);
          const dx = (Math.random() - 0.5) * 160;
          h.animate(
            [{ transform: `translate(${x}px,${y}px) translate(-50%,-50%) scale(.4)`, opacity: 1 },
             { transform: `translate(${x + dx}px,${y - 90 - Math.random() * 60}px) translate(-50%,-50%) scale(1.2)`, opacity: 0 }],
            { duration: 800 + Math.random() * 300, easing: "ease-out", fill: "forwards" });
        }
      }

      function showAnswer() {
        const el = prizeEls[cells.indexOf(target)];
        if (el) el.classList.add("answer");
      }

      ctx.onTimeout(() => {
        done = true;
        phase = "over";
        stopBtn.disabled = true;
        hover(true);
        mon.classList.add("nope");
        showAnswer();
        ctx.say(answer);
      });

      // ---------- Sound effects ----------
      const stopSound = () => { tone(660, 0.06, "square", 0.08); tone(990, 0.08, "square", 0.06, 0.05); };
      const dropSound = () => sweep(700, 280, 0.2, "triangle", 0.14);
      const clankSound = () => { noise(0.06, "bandpass", 2600, 1400, 0.4); tone(1800, 0.05, "square", 0.05); };
      const liftSound = () => sweep(280, 720, 0.22, "triangle", 0.12);
      const slipSound = () => { sweep(900, 200, 0.25, "sine", 0.15); noise(0.08, "lowpass", 600, 150, 0.4, 0.22); };
      const nopeSound = () => sweep(400, 150, 0.3, "sawtooth", 0.1, 0.1);
      const chompSound = () => [0, 0.13, 0.26].forEach((d) => noise(0.06, "lowpass", 1400, 300, 0.45, d));

      // Desktop keyboard: space or Enter presses STOP.
      function onKey(e) {
        if (e.key === " " || e.key === "Enter") { e.preventDefault(); stop(); }
      }
      document.addEventListener("keydown", onKey);

      placeClaw();
      hover();
      ctx.say(prompt);
      ctx.raf(frame);


      // Tutorial: point at the monster, then at the prize it wants, then STOP when the claw is level
      // with it, and STOP again when it's right above it.
      ctx.tutorial(target, async (f) => {
        const ti = cells.indexOf(target), tr = Math.floor(ti / cols), tc = ti % cols;
        await f.point(mon, 900);
        await f.point(prizeEls[ti], 900);
        await f.move(stopBtn, 500);
        if (!(await f.until(() => phase === "y" && Math.abs(cy - (tr + 0.5)) < 0.12, 6000))) return;
        await f.tapNow(stopBtn);
        await f.until(() => phase === "x" && performance.now() - lastStop > STOP_GAP_MS + 50 && Math.abs(cx - (LANE + tc + 0.5)) < 0.12, 6000);
        await f.tapNow(stopBtn);
      });

      return function cleanup() {
        done = true;
        ro.disconnect();
        document.removeEventListener("keydown", onKey);
      };
    },
  });
})();
