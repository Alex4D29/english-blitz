// MOUSE TRAP — a wire cage hangs on a rope above a piece of cheese. A card at the top shows the target
// and the voice says it. Mice scurry in one at a time (random order), each holding up a little sign,
// stop to nibble the cheese for a moment, then run off the other side. Press the big red button (or
// Space, or tap the trap) to drop the cage. Catch the right mouse: it sits in the cage looking shocked,
// confetti, cheering. Catch a wrong one: it cries in the cage and the round is lost. Slam on nothing:
// the cage lifts back up (it only costs time). The order repeats (reshuffled) until time runs out, so
// a missed target comes round again; it's never the very first mouse.
//
// Letter list: the signs are letters (look-alikes). Phonics: the card is a letter, the signs are
// pictures, one starts with it. CVC: the card is a word, the signs are pictures. HFW: the card is 🔊,
// the signs are words. Faster speeds: mice scurry and nibble faster, 4 wrong mice from 1.5× (3 before).
(function () {
  const TEXT = {
    name: { en: "Mouse Trap" },
    icon: "🪤",
    howTo: (list) => {
      const what = {
        letter: ["🔤", "Look at the card, like \"B\". Wait for the mouse with B!"],
        phonics: ["🔤", "Look at the letter, like \"B\". Wait for the mouse with a picture that starts with it: ball, bee…"],
        cvc: ["📝", "Look at the word, like \"cat\". Wait for the mouse with the cat picture!"],
        hfw: ["👂", "Listen to the word, like \"the\". Wait for the mouse with that word!"],
      }[list.type] || ["👀", "Look at the card."];
      return { en: {
        steps: [
          ["🧀", "Mice come one by one to eat the cheese."],
          what,
          ["🔴", "When it's eating the cheese, press the red button to catch it!"],
        ],
        tips: [
          "Tap the card to hear it again.",
          "Catch the wrong mouse and it's game over for this round. If the trap catches nothing, it opens again.",
          "Missed it? It will come back!",
          "When the game speeds up, the mice are faster.",
        ],
      } };
    },
    instruction: { en: "CATCH THE\nMOUSE!" },
    listen: "🔊",
    answer: (letter, word) => `${letter} for ${word}`,
    cardLabel: "Hear it again",
    buttonLabel: "Drop the trap",
  };

  const MOUSE_TINTS = ["#b9b9c4", "#c9a98b", "#9fa6b2", "#d6c3b0", "#a99c8d"];

  const CSS = `
  .mt { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:8px; padding-bottom:12px; }
  .mt-card { flex:none; position:relative; min-width:84px; height:74px; padding:0 18px; border-radius:18px; font:inherit; font-size:2.6rem; line-height:1;
    background:#fff; color:#111; border:5px solid #111; box-shadow:0 6px 0 #111; display:flex; align-items:center; justify-content:center; gap:8px;
    cursor:pointer; touch-action:manipulation; animation:mt-in .3s cubic-bezier(.2,1.8,.4,1) both; }
  .mt-card .spk { font-size:1.3rem; opacity:.6; }
  .mt-scene { position:relative; flex:1; min-height:0; width:100%; overflow:hidden; cursor:pointer; touch-action:manipulation; }
  .mt-floor { position:absolute; left:0; right:0; bottom:0; height:28%; background:repeating-linear-gradient(90deg, #b5773e 0 64px, #a86c36 64px 68px);
    border-top:6px solid #111; }
  .mt-hole { position:absolute; bottom:28%; width:12%; aspect-ratio:1/1.1; background:#2a1a10; border:5px solid #111; border-bottom:0;
    border-radius:50% 50% 0 0; }
  .mt-hole.l { left:-2%; } .mt-hole.r { right:-2%; }
  .mt-cheese { position:absolute; left:50%; bottom:calc(28% - 6px); transform:translateX(-50%); font-size:calc(var(--ms) * .62); line-height:1; z-index:1; }
  .mt-rope { position:absolute; left:50%; top:0; width:5px; margin-left:-2.5px; background:#6b4a2b; border-left:1px solid #111; border-right:1px solid #111; z-index:3; }
  .mt-cage { position:absolute; left:50%; width:var(--cw); height:var(--chh); margin-left:calc(var(--cw) * -.5); z-index:4;
    transition:transform .12s cubic-bezier(.6,0,1,1); }
  .mt-cage.up { transition:transform .45s cubic-bezier(.2,.8,.3,1); }
  .mt-bars { position:absolute; inset:0; border:6px solid #111; border-radius:16px 16px 4px 4px;
    background:repeating-linear-gradient(90deg, transparent 0 14px, #8d98a6 14px 19px, #111 19px 21px); }
  .mt-bars::before { content:""; position:absolute; left:-6px; right:-6px; top:-6px; height:18%; background:#c33; border:6px solid #111; border-radius:16px 16px 6px 6px; }
  .mt-bars::after { content:""; position:absolute; left:50%; top:-26px; width:30px; height:24px; margin-left:-15px; border:6px solid #111; border-bottom:0; border-radius:16px 16px 0 0; }
  .mt-btn { flex:none; width:clamp(96px, 28vw, 130px); height:clamp(96px, 28vw, 130px); border-radius:50%; font:inherit; font-size:3.4rem; line-height:1; color:#fff;
    background:radial-gradient(circle at 38% 32%, #ff8a8a 0 12%, #ff2e2e 28%, #c40000 80%); border:7px solid #111; box-shadow:0 10px 0 #111, inset 0 -8px 0 rgba(0,0,0,.25);
    cursor:pointer; touch-action:manipulation; -webkit-text-stroke:2px #111; paint-order:stroke fill; animation:mt-pulse 1s ease-in-out infinite; }
  .mt-btn:active, .mt-btn.press { transform:translateY(8px); box-shadow:0 2px 0 #111, inset 0 -4px 0 rgba(0,0,0,.25); animation:none; }
  .mt-btn:disabled { filter:grayscale(.6) brightness(.85); animation:none; cursor:default; }
  .mt-fx { position:absolute; inset:0; pointer-events:none; overflow:visible; z-index:6; }

  /* A mouse: --ms is its size. Facing right by default; .left flips the body (not the sign). */
  .mt-m { position:absolute; left:0; bottom:calc(28% - 4px); width:var(--ms); height:var(--ms); margin-left:calc(var(--ms) * -.5); z-index:2; will-change:transform; }
  .mt-body { position:absolute; inset:30% 0 0 0; }
  .mt-m.left .mt-body { transform:scaleX(-1); }
  .mt-m.walk .mt-body { animation:mt-scurry .14s ease-in-out infinite alternate; }
  .mt-m.nibble .mt-body { animation:mt-nibble .22s ease-in-out infinite alternate; }
  .mt-torso { position:absolute; left:10%; right:14%; top:28%; bottom:4%; background:var(--mc); border:4px solid #111; border-radius:55% 70% 40% 45% / 60% 70% 40% 40%; }
  .mt-head { position:absolute; right:-4%; top:16%; width:44%; height:52%; background:var(--mc); border:4px solid #111; border-radius:40% 70% 60% 40%; }
  .mt-ear { position:absolute; top:-2%; right:22%; width:34%; height:40%; background:#ffb3c7; border:4px solid #111; border-radius:50%; box-shadow:inset 0 0 0 4px var(--mc); }
  .mt-eye { position:absolute; right:26%; top:38%; width:12%; height:14%; background:#111; border-radius:50%; }
  .mt-nose { position:absolute; right:-6%; top:50%; width:12%; height:12%; background:#ff5c8a; border:3px solid #111; border-radius:50%; }
  .mt-tail { position:absolute; left:-26%; top:52%; width:40%; height:30%; border:4px solid #111; border-color:#111 transparent transparent transparent; border-radius:50%; transform:rotate(-20deg); }
  .mt-feet { position:absolute; left:28%; right:30%; bottom:-6%; height:10%; border-left:8px solid #111; border-right:8px solid #111; }
  .mt-sign { position:absolute; left:50%; bottom:68%; transform:translateX(-50%); min-width:calc(var(--ms) * .7); height:calc(var(--ms) * .56); padding:0 6px;
    background:#fff; border:4px solid #111; border-radius:10px; display:flex; align-items:center; justify-content:center; color:#111;
    font-size:calc(var(--ms) * .4); line-height:1; white-space:nowrap; box-shadow:0 4px 0 rgba(0,0,0,.3); }
  .mt-sign::after { content:""; position:absolute; left:50%; top:100%; width:4px; height:calc(var(--ms) * .12); margin-left:-2px; background:#111; }
  .mt-sign.pic { font-size:calc(var(--ms) * .4); }
  .mt-m.caught.right .mt-eye { height:22%; width:18%; background:#fff; border:3px solid #111; }
  .mt-m.caught.wrong .mt-eye { height:5%; top:44%; }
  .mt-m.answer .mt-sign { box-shadow:0 0 0 5px #fff, 0 0 0 9px #00b86b; }
  .mt-tear { position:absolute; font-size:1.1rem; animation:mt-tear .6s ease-in infinite; }
  .mt-pop { position:absolute; transform:translate(-50%, -100%) rotate(-5deg); padding:3px 12px; background:#fff; border:4px solid #111; border-radius:99px;
    box-shadow:0 4px 0 #111; font-size:1.4rem; white-space:nowrap; animation:mt-in .25s cubic-bezier(.2,1.8,.4,1); }

  @keyframes mt-in { from { transform:scale(.5); opacity:0; } }
  @keyframes mt-pulse { 50% { transform:scale(1.05); } }
  @keyframes mt-scurry { from { transform:translateY(0) rotate(-3deg); } to { transform:translateY(-6%) rotate(3deg); } }
  @keyframes mt-nibble { from { transform:rotate(0); } to { transform:rotate(6deg) translateY(4%); } }
  @keyframes mt-tear { from { transform:translateY(0); opacity:1; } to { transform:translateY(150%); opacity:0; } }
  .mt-m.left.walk .mt-body { animation-name:mt-scurry-l; } .mt-m.left.nibble .mt-body { animation-name:mt-nibble-l; }
  @keyframes mt-scurry-l { from { transform:scaleX(-1) translateY(0) rotate(-3deg); } to { transform:scaleX(-1) translateY(-6%) rotate(3deg); } }
  @keyframes mt-nibble-l { from { transform:scaleX(-1) rotate(0); } to { transform:scaleX(-1) rotate(6deg) translateY(4%); } }
  @media (prefers-reduced-motion: reduce) {
    .mt-card, .mt-btn, .mt-m .mt-body, .mt-tear, .mt-pop { animation:none !important; }
  }`;

  function injectCss() {
    if (document.getElementById("mt-css")) return;
    const style = document.createElement("style");
    style.id = "mt-css";
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  registerMicrogame({
    id: "mouse-trap",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 11000,
    input: "tap",

    start(ctx) {
      injectCss();
      const type = ctx.list.type;
      const speed = ctx.speed || 1;
      const nWrong = speed >= 1.5 ? 4 : 3;
      const pace = 0.6 + 0.4 * speed;
      const letterName = (it) => it.say || it.text.toUpperCase();
      const { tone, sweep, noise } = ctx.sfx;

      // ---------- Content ----------
      let cardText, prompt, answer, signs;
      if (type === "phonics") {
        const letter = ctx.items.find((it) => ctx.phonics.pics(it).length) || ctx.items[0];
        const set = ctx.phonics.set(letter, 1, nWrong);
        const right = set.right[0];
        cardText = letter.text.toUpperCase();
        prompt = letterName(letter);
        answer = TEXT.answer(letterName(letter), right.word);
        signs = [right, ...set.wrong].map((p) => ({ text: p.emoji, kind: "pic", right: p === right }));
      } else if (type === "cvc") {
        const pool = ctx.items.filter((it) => it.emoji);
        const target = pool[0];
        const picks = [];
        for (const o of [...ctx.pickOptions(target, 12), ...ctx.shuffle(pool.slice())]) {
          if (picks.length >= nWrong) break;
          if (o !== target && o.emoji && o.emoji !== target.emoji && !picks.includes(o)) picks.push(o);
        }
        cardText = target.text;
        prompt = answer = target.say || target.text;
        signs = [target, ...picks].map((o) => ({ text: o.emoji, kind: "pic", right: o === target }));
      } else if (type === "hfw") {
        const target = ctx.items[0];
        cardText = ctx.canSpeak ? TEXT.listen : target.text;
        prompt = answer = target.say || target.text;
        const others = ctx.pickOptions(target, nWrong + 2).filter((o) => o !== target).slice(0, nWrong);
        signs = [target, ...others].map((o) => ({ text: o.text, kind: "word", right: o === target }));
      } else {
        const target = ctx.items[0];
        cardText = target.text;
        prompt = letterName(target);
        answer = target.word ? TEXT.answer(letterName(target), target.word) : prompt;
        const others = ctx.pickOptions(target, nWrong + 2).filter((o) => o !== target && o.text !== target.text).slice(0, nWrong);
        signs = [target, ...others].map((o) => ({ text: o.text, kind: "letter", right: o === target }));
      }

      // ---------- DOM ----------
      const wrap = document.createElement("div");
      wrap.className = "mt";
      const card = document.createElement("button");
      card.className = "mt-card";
      card.setAttribute("aria-label", TEXT.cardLabel);
      card.innerHTML = '<span class="ct"></span>';
      card.firstChild.textContent = cardText;
      if (ctx.canSpeak && cardText !== TEXT.listen) card.insertAdjacentHTML("beforeend", '<span class="spk">🔊</span>');
      card.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });
      card.addEventListener("click", (e) => { if (e.detail === 0) replay(); });
      const scene = document.createElement("div");
      scene.className = "mt-scene";
      scene.innerHTML = '<div class="mt-floor"></div><div class="mt-hole l"></div><div class="mt-hole r"></div><div class="mt-cheese">🧀</div>' +
        '<div class="mt-rope"></div><div class="mt-cage"><div class="mt-bars"></div></div><div class="mt-fx"></div>';
      const cage = scene.querySelector(".mt-cage");
      const rope = scene.querySelector(".mt-rope");
      const fx = scene.querySelector(".mt-fx");
      const btn = document.createElement("button");
      btn.className = "mt-btn";
      btn.textContent = "🪤";
      btn.setAttribute("aria-label", TEXT.buttonLabel);
      btn.addEventListener("pointerdown", (e) => { e.preventDefault(); snap(); });
      btn.addEventListener("click", (e) => { if (e.detail === 0) snap(); });
      scene.addEventListener("pointerdown", (e) => { e.preventDefault(); snap(); }); // tapping the trap works too
      wrap.append(card, scene, btn);
      ctx.root.appendChild(wrap);

      // ---------- Layout ----------
      let W = 0, H = 0, ms = 60, cw = 100, chh = 90, floorY = 0, cageUpY = 0, cageDownY = 0;
      function layout() {
        W = scene.clientWidth; H = scene.clientHeight;
        floorY = H * 0.72;
        // Mice as big as fit: the raised cage has to clear a mouse and its sign (about 1.4 mouse heights).
        ms = Math.max(40, Math.min(W * 0.25, H * 0.28, (floorY - 8) / (1.3 + 1.4)));
        cw = ms * 1.9; chh = ms * 1.3;
        scene.style.setProperty("--ms", `${ms}px`);
        scene.style.setProperty("--cw", `${cw}px`);
        scene.style.setProperty("--chh", `${chh}px`);
        cageDownY = floorY - chh + 4;
        cageUpY = Math.max(4, cageDownY - ms * 1.4);  // high enough for a mouse and its sign to pass under
        cage.style.top = "0px";
        if (!cageDown) cage.style.transform = `translateY(${cageUpY}px)`;
        rope.style.height = `${Math.max(0, (cageDown ? cageDownY : cageUpY) - 20)}px`;
        mice.forEach((m) => { if (m.kind === "word") m.signEl.style.fontSize = `${Math.min(ms * 0.36, (ms * 1.6) / (m.sign.text.length * 0.62))}px`; });
      }

      // ---------- Mice ----------
      // Each mouse: enters from one side, nibbles at the cheese (centre), leaves by the other side.
      const walkS = 1.0 / pace, nibbleS = 1.4 / pace;
      const mice = [];
      function makeMouse(sign) {
        const el = document.createElement("div");
        el.className = "mt-m walk";
        el.style.setProperty("--mc", ctx.pick(MOUSE_TINTS));
        el.innerHTML = '<div class="mt-body"><div class="mt-tail"></div><div class="mt-torso"></div><div class="mt-feet"></div>' +
          '<div class="mt-head"><div class="mt-ear"></div><div class="mt-eye"></div><div class="mt-nose"></div></div></div><div class="mt-sign"></div>';
        const s = el.querySelector(".mt-sign");
        s.textContent = sign.text;
        if (sign.kind === "pic") s.classList.add("pic");
        scene.insertBefore(el, cage);
        const fromLeft = Math.random() < 0.5;
        if (!fromLeft) el.classList.add("left");
        const m = { el, signEl: s, sign, kind: sign.kind, fromLeft, t0: performance.now(), x: 0, phase: "walk", caught: false };
        if (sign.kind === "word") s.style.fontSize = `${Math.min(ms * 0.36, (ms * 1.6) / (sign.text.length * 0.62))}px`;
        mice.push(m);
        squeak();
        return m;
      }
      // The order: the target is never first, and the list reshuffles when it runs out.
      let queue = [];
      function nextSign() {
        if (!queue.length) {
          queue = ctx.shuffle(signs.slice());
          if (!mice.length && queue[0].right) queue.push(queue.shift());
        }
        return queue.shift();
      }
      const edge = () => -ms * 0.8, far = () => W + ms * 0.8;
      function mousePos(m, now) {
        const t = (now - m.t0) / 1000;
        const a = m.fromLeft ? edge() : far(), b = m.fromLeft ? far() : edge(), c = W / 2;
        if (t < walkS) return { x: a + (c - a) * (t / walkS), phase: "walk" };
        if (t < walkS + nibbleS) return { x: c, phase: "nibble" };
        const k = (t - walkS - nibbleS) / walkS;
        return { x: c + (b - c) * Math.min(1, k), phase: k >= 1 ? "gone" : "walk" };
      }

      // ---------- Loop ----------
      let done = false, cageDown = false, busyUntil = 0, nextSpawn = performance.now() + 250;
      layout();
      function frame(now) {
        if (!done && now >= nextSpawn) {
          makeMouse(nextSign());
          nextSpawn = now + (walkS + nibbleS) * 1000; // the next one comes in as this one leaves
        }
        for (const m of mice) {
          if (m.caught || m.phase === "gone") continue;
          const p = mousePos(m, now);
          m.x = p.x;
          if (p.phase !== m.phase) {
            m.phase = p.phase;
            m.el.classList.toggle("walk", p.phase === "walk");
            m.el.classList.toggle("nibble", p.phase === "nibble");
            if (p.phase === "nibble") tone(1500, 0.04, "square", 0.04);
            if (p.phase === "gone") m.el.remove();
          }
          m.el.style.transform = `translateX(${m.x.toFixed(1)}px)`;
        }
        if (!done) ctx.raf(frame);
      }
      ctx.raf(frame);
      const ro = new ResizeObserver(layout);
      ro.observe(scene);

      // ---------- The trap ----------
      function snap() {
        if (done || ctx.ended || cageDown || performance.now() < busyUntil) return;
        cageDown = true;
        btn.classList.add("press");
        cage.classList.remove("up");
        cage.style.transform = `translateY(${cageDownY}px)`;
        rope.style.height = `${Math.max(0, cageDownY - 20)}px`;
        noise(0.08, "lowpass", 2000, 400, 0.6, 0.1); // SLAM
        tone(110, 0.12, "square", 0.15, 0.1);
        // Who's under it? Any mouse whose middle is inside the cage.
        const under = mice.filter((m) => !m.caught && m.phase !== "gone" && Math.abs(m.x - W / 2) < cw * 0.42)
          .sort((a, b) => Math.abs(a.x - W / 2) - Math.abs(b.x - W / 2))[0];
        ctx.later(() => {
          if (under) caught(under);
          else empty();
        }, 120);
      }

      function popText(text, x, y) {
        const p = document.createElement("div");
        p.className = "mt-pop";
        p.textContent = text;
        p.style.left = `${x}px`; p.style.top = `${y}px`;
        fx.appendChild(p);
        return p;
      }

      function caught(m) {
        done = true;
        m.caught = true;
        m.x = W / 2;
        m.el.style.transform = `translateX(${m.x}px)`;
        m.el.classList.remove("walk", "nibble");
        m.el.classList.add("caught");
        btn.disabled = true;
        // Everyone else scatters.
        mice.forEach((o) => { if (o !== m && o.phase !== "gone") { o.el.classList.add("walk"); o.el.style.transition = "transform .5s ease-in"; o.el.style.transform = `translateX(${o.x < W / 2 ? edge() : far()}px)`; } });
        if (m.sign.right) {
          m.el.classList.add("right");
          ctx.win();
          popText("GOTCHA!", W / 2, cageDownY - 14);
          [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.1, "triangle", 0.12, i * 0.07));
          ctx.confetti(fx, W / 2, cageDownY + chh * 0.4);
          ctx.say(answer);
        } else {
          m.el.classList.add("wrong");
          ctx.lose();
          [0.1, 0.4].forEach((d) => sweep(900, 600, 0.25, "sine", 0.08, d)); // sad squeaks
          ["💧", "💧"].forEach((s, i) => {
            const t = document.createElement("div");
            t.className = "mt-tear";
            t.textContent = s;
            t.style.left = `${W / 2 + (i ? ms * 0.25 : -ms * 0.05)}px`;
            t.style.top = `${floorY - ms * 0.55}px`;
            t.style.animationDelay = `${i * 0.3}s`;
            fx.appendChild(t);
          });
          ctx.later(() => { showRight(); ctx.say(answer); }, 500);
        }
      }

      function empty() {
        // Nothing caught: a "clunk", then the cage lifts back up.
        sweep(300, 200, 0.15, "triangle", 0.1);
        busyUntil = performance.now() + 750;
        ctx.later(() => {
          if (done) return;
          cageDown = false;
          btn.classList.remove("press");
          cage.classList.add("up");
          cage.style.transform = `translateY(${cageUpY}px)`;
          rope.style.height = `${Math.max(0, cageUpY - 20)}px`;
          sweep(200, 500, 0.3, "sine", 0.06);
        }, 450);
      }

      // The right mouse pops out of its hole with its sign glowing, so the answer is seen.
      function showRight() {
        const r = signs.find((s) => s.right);
        const m = makeMouse(r);
        m.el.classList.add("answer");
        m.el.classList.remove("walk");
        m.x = m.fromLeft ? ms * 0.8 : W - ms * 0.8;
        m.caught = true; // freeze it there
        m.el.style.transform = `translateX(${m.x}px)`;
      }

      const squeak = () => { tone(2200 + Math.random() * 600, 0.04, "sine", 0.05); tone(2600 + Math.random() * 600, 0.05, "sine", 0.05, 0.06); };

      function replay() { if (!done) ctx.say(prompt); }

      ctx.onTimeout(() => {
        done = true;
        btn.disabled = true;
        mice.forEach((m) => { if (!m.caught && m.phase !== "gone") m.el.classList.remove("walk", "nibble"); });
        const live = mice.find((m) => !m.caught && m.phase !== "gone" && m.sign.right);
        if (live) live.el.classList.add("answer");
        else showRight();
        ctx.say(answer);
      });

      function onKey(e) {
        if (e.key === " " || e.key === "Enter") { e.preventDefault(); snap(); }
      }
      document.addEventListener("keydown", onKey);

      ctx.say(prompt);

      return function cleanup() {
        done = true;
        ro.disconnect();
        document.removeEventListener("keydown", onKey);
      };
    },
  });
})();
