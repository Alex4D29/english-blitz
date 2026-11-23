// PIZZA CHEF — a hungry monster is waiting for its pizza. Each step there's a row of topping boxes, each
// with a sign. Tap the right box: it pops open and copies of what's on its sign — the letters, words or
// pictures themselves — fly onto the pizza as toppings (letters and words in a colour per step). A wrong
// box's thing lands on the pizza in sickly olive, the monster goes green ("EWW!"), the round is lost and
// the right box glows. After the last topping the
// monster gobbles the whole pizza in one bite (BURP!). Content comes from ctx.choiceRows (ABC: half the
// rounds are capital → lowercase). 3 toppings, 4 from 1.5×; 4 boxes from 2×.
(function () {
  const TEXT = {
    name: { en: "Pizza Chef" },
    icon: "🍕",
    howTo: (list) => ({ en: {
      steps: [
        list.type === "hfw" ? ["👂", "Listen to the word, like \"the\"."] : ["👀", "Look at the card at the top."],
        ["📦", "Tap the box with the same one. It goes on the pizza as a topping!"],
        ["🔁", "Then the card changes: find the new one. Topping by topping, make the pizza for the hungry monster!"],
      ],
      tips: [
        "Tap the card to hear it again.",
        "Put a wrong one on the pizza and the monster says EWW! The right one glows.",
        "When the game speeds up, the pizza needs more toppings.",
      ],
    } }),
    instruction: { en: "MAKE THE\nPIZZA!" },
    eww: "EWW!",
    burp: "BURP!",
    cardLabel: "Hear it again",
    boxLabel: (t) => `Open the box ${t}`,
  };
  // Letters and words go on the pizza as toppings, one colour per step (pepperoni red, basil green…).
  const SAUCE = ["#e8173c", "#1f9d3a", "#ff8a00", "#8a2be2"];

  const CSS = `
  .pz { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:8px; padding-bottom:10px; }
  .pz-top { flex:none; display:flex; align-items:flex-end; gap:12px; }
  .pz-card { min-width:84px; height:72px; padding:0 18px; border-radius:18px; font:inherit; font-size:2.6rem; line-height:1; background:#fff; color:#111;
    border:5px solid #111; box-shadow:0 6px 0 #111; display:flex; align-items:center; justify-content:center; gap:8px; cursor:pointer; touch-action:manipulation; }
  .pz-card .spk { font-size:1.3rem; opacity:.6; }
  .pz-card.next { animation:pz-next .45s cubic-bezier(.2,1.8,.4,1); }   /* a new target each step */
  @keyframes pz-next { 0% { transform:scale(.4) rotate(-10deg); } 60% { transform:scale(1.25) rotate(4deg); } 100% { transform:none; } }
  .pz-mon { position:relative; width:84px; height:80px; }
  .pz-mbody { position:absolute; inset:0; background:#ff8a00; border:5px solid #111; border-radius:50% 50% 40% 40%; box-shadow:inset -6px -6px 0 rgba(0,0,0,.15); transition:background .2s; }
  .pz-meye { position:absolute; top:22%; width:22%; height:26%; background:#fff; border:3px solid #111; border-radius:50%; }
  .pz-meye::after { content:""; position:absolute; left:28%; top:34%; width:46%; height:46%; background:#111; border-radius:50%; }
  .pz-meye.l { left:20%; } .pz-meye.r { right:20%; }
  .pz-mmouth { position:absolute; left:50%; top:58%; width:44%; height:20%; margin-left:-22%; background:#4a0d1a; border:3px solid #111; border-radius:0 0 99px 99px; transition:all .2s; }
  .pz-mon .pz-drool { position:absolute; left:58%; top:76%; width:7px; height:12px; background:#bfe6ff; border:2px solid #111; border-radius:0 0 99px 99px; }
  .pz-mon.eww .pz-mbody { background:#8fd14f; }
  .pz-mon.eww .pz-mmouth { height:8%; top:66%; border-radius:99px; }
  .pz-mon.eww .pz-drool { display:none; }
  .pz-mon.gulp .pz-mmouth { width:80%; margin-left:-40%; height:42%; top:44%; border-radius:40% 40% 50% 50%; }
  .pz-mon.happy { animation:pz-hop .35s cubic-bezier(.2,1.6,.4,1) 3; }
  .pz-say { position:absolute; left:100%; top:-6px; margin-left:-10px; padding:2px 8px; background:#fff; border:4px solid #111; border-radius:99px; font-size:1.1rem;
    white-space:nowrap; z-index:3; animation:pz-pop .25s cubic-bezier(.2,1.8,.4,1); }

  .pz-counter { position:relative; flex:1; min-height:0; width:100%; max-width:520px; display:flex; align-items:center; justify-content:center; overflow:visible;
    background:radial-gradient(ellipse at 50% 55%, #fff 0 46%, transparent 47%), repeating-conic-gradient(#e8173c 0 25%, #fff 0 50%) 0 0 / 44px 44px;
    border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111; }
  .pz-pizza { position:relative; width:var(--pz); height:var(--pz); border-radius:50%; background:#e9b462; border:6px solid #111; box-shadow:inset 0 0 0 calc(var(--pz) * .06) #d79a45;
    transition:transform .35s ease-in, opacity .35s; }
  .pz-pizza::before { content:""; position:absolute; inset:9%; border-radius:50%; background:#d9372a; }
  .pz-pizza::after { content:""; position:absolute; inset:15%; border-radius:46% 54% 50% 50%; background:#ffe08a; opacity:.9; }
  .pz-pizza.gone { transform:translateY(-120%) scale(.2); opacity:0; }
  .pz-top-piece { position:absolute; font-size:calc(var(--pz) * .13); line-height:1; transform:translate(-50%, -50%); z-index:2; white-space:nowrap; }
  .pz-top-piece.letter, .pz-fly.letter { font-size:calc(var(--pz) * .17); font-weight:900; color:var(--tc); -webkit-text-stroke:3px #111; paint-order:stroke fill; }
  .pz-top-piece.word, .pz-fly.word { font-size:calc(var(--pz) * .085); font-weight:900; color:var(--tc); -webkit-text-stroke:2px #111; paint-order:stroke fill; }
  .pz-fly.letter { font-size:2.4rem; } .pz-fly.word { font-size:1.3rem; }
  .pz-tray { flex:none; display:flex; gap:10px; justify-content:center; width:100%; padding:0 10px; }
  .pz-box { position:relative; width:var(--bx); height:calc(var(--bx) * .86); padding:0; border:5px solid #111; border-radius:8px; background:#e2b878; font:inherit; color:#111;
    box-shadow:0 6px 0 #111; cursor:pointer; touch-action:manipulation; display:flex; align-items:center; justify-content:center; animation:pz-in .3s cubic-bezier(.2,1.8,.4,1) both; }
  .pz-box::before { content:""; position:absolute; left:-5px; right:-5px; top:-5px; height:24%; background:#d19f5c; border:5px solid #111; border-radius:8px 8px 0 0;
    transform-origin:50% 0; transition:transform .25s; }
  .pz-box.open::before { transform:perspective(200px) rotateX(70deg) translateY(-10px); }
  .pz-lbl { position:relative; top:8%; min-width:70%; padding:0 4px; background:#fff; border:3px solid #111; border-radius:8px; font-size:calc(var(--bx) * .36); line-height:1.1;
    white-space:nowrap; }
  .pz-box.right { box-shadow:0 0 0 5px #fff, 0 0 0 10px #00b86b; animation:pz-wiggle .4s ease-in-out 3; }
  .pz-box.dim { opacity:.45; }
  .pz-fly { position:fixed; z-index:50; font-size:2rem; line-height:1; pointer-events:none; transform:translate(-50%, -50%); }
  .pz-fx { position:absolute; inset:0; pointer-events:none; overflow:visible; z-index:6; }
  /* Boss Battle showdown: your pizza on the left, the boss makes its own on the right */
  .pz-counter.vs { gap:4%; }
  .pz-boss { position:absolute; right:4px; top:4px; z-index:4; pointer-events:none; }
  .pz-boss.toss .bx-boss { animation:pz-hop .3s ease-out; }

  @keyframes pz-hop { 50% { transform:translateY(-14%); } }
  @keyframes pz-pop { from { transform:scale(.3); } }
  @keyframes pz-in { from { transform:scale(.4); opacity:0; } }
  @keyframes pz-wiggle { 25% { transform:rotate(-7deg) scale(1.05); } 75% { transform:rotate(7deg) scale(1.05); } }
  @media (prefers-reduced-motion: reduce) { .pz-mon.happy, .pz-box, .pz-box.right, .pz-say { animation:none !important; } }`;

  function injectCss() {
    if (document.getElementById("pz-css")) return;
    const style = document.createElement("style");
    style.id = "pz-css";
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  registerMicrogame({
    id: "pizza-chef",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 10000,
    input: "tap",
    tutorial: true, // has a ctx.tutorial script
    bossRival: true, // Boss Battle showdown: the boss makes its own pizza

    start(ctx) {
      injectCss();
      const speed = ctx.speed || 1;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const R = speed >= 1.5 ? 4 : 3, N = speed >= 2 ? 4 : 3;
      const { tone, sweep, noise } = ctx.sfx;
      // Each step has a NEW target ("A"… pick a… "B"… pick b…), with a beat in between where the clock stops
      // while the next one is shown and said (the teacher's idea, like the rhythm games).
      const S = ctx.choiceSteps(R, N, { lowercase: true });
      let C = S[0];
      const BEAT_MS = 800;
      // The beat: the clock stops, the card pops to the next target and the voice says it.
      function nextTarget(saidWord) {
        ctx.pauseTimer(BEAT_MS);
        C = S[step];
        card.firstChild.textContent = C.cardText;
        card.classList.remove("next"); void card.offsetWidth; card.classList.add("next");
        ctx.sfx.tone(98, 0.08, "square", 0.1); ctx.sfx.tone(98, 0.08, "square", 0.1, 0.16);
        ctx.later(() => { if (!done) ctx.say(C.prompt); }, saidWord ? 350 : 0);
      }

      const wrap = document.createElement("div");
      wrap.className = "pz";
      const top = document.createElement("div");
      top.className = "pz-top";
      const card = document.createElement("button");
      card.className = "pz-card";
      card.setAttribute("aria-label", TEXT.cardLabel);
      card.innerHTML = '<span class="ct"></span>';
      card.firstChild.textContent = C.cardText;
      if (ctx.canSpeak && !C.listen) card.insertAdjacentHTML("beforeend", '<span class="spk">🔊</span>');
      card.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });
      const mon = document.createElement("div");
      mon.className = "pz-mon";
      mon.innerHTML = '<div class="pz-mbody"></div><div class="pz-meye l"></div><div class="pz-meye r"></div><div class="pz-mmouth"></div><div class="pz-drool"></div>';
      top.append(mon, card);
      const counter = document.createElement("div");
      counter.className = "pz-counter";
      counter.innerHTML = '<div class="pz-pizza"></div><div class="pz-fx"></div>';
      const pizza = counter.querySelector(".pz-pizza"), fx = counter.querySelector(".pz-fx");

      // Boss Battle showdown: the boss makes its own pizza beside yours (mushrooms, peppers, olives… a
      // handful at a time) and gobbles it up just as time runs out.
      const rv = window.Boss && Boss.rival(ctx);
      let bpizza = null, bossBox = null;
      if (rv) {
        counter.classList.add("vs");
        bpizza = document.createElement("div");
        bpizza.className = "pz-pizza";
        bossBox = document.createElement("div");
        bossBox.className = "pz-boss";
        bossBox.appendChild(rv.el("var(--bbs)"));
        counter.insertBefore(bpizza, fx);
        counter.appendChild(bossBox);
      }
      const tray = document.createElement("div");
      tray.className = "pz-tray";
      wrap.append(top, counter, tray);
      ctx.root.appendChild(wrap);

      function measure() {
        const r = counter.getBoundingClientRect();
        const pz = rv ? Math.max(90, Math.min(r.width * 0.44, r.height * 0.7)) : Math.max(120, Math.min(r.width * 0.78, r.height * 0.84)); // (two pizzas in the showdown)
        counter.style.setProperty("--pz", `${pz}px`);
        if (rv) counter.style.setProperty("--bbs", `${Math.max(48, Math.min(pz * 0.55, r.height * 0.4, 86))}px`);
        tray.style.setProperty("--bx", `${Math.min(96, (tray.clientWidth - 20 - 10 * (N - 1)) / N)}px`);
      }
      measure();

      let step = 0, done = false, busy = false, boxes = [];
      function showStep() {
        tray.innerHTML = "";
        const bx = parseFloat(tray.style.getPropertyValue("--bx")) || 90;
        boxes = C.row.map((item, i) => {
          const b = document.createElement("button");
          b.className = "pz-box";
          b.style.animationDelay = `${i * 0.06}s`;
          b.setAttribute("aria-label", TEXT.boxLabel(item.spoken));
          b.innerHTML = '<span class="pz-lbl"></span>';
          const l = b.firstChild;
          l.textContent = item.text;
          if (item.kind === "word") l.style.fontSize = `${Math.min(bx * 0.3, (bx * 0.8) / (item.text.length * 0.6))}px`;
          b.addEventListener("pointerdown", (e) => { e.preventDefault(); choose(i); });
          b.addEventListener("click", (e) => { if (e.detail === 0) choose(i); });
          tray.appendChild(b);
          return { el: b, item };
        });
      }

      // Throw copies of `item` (its letter, word or picture) from the box onto the pizza `count` times;
      // each lands somewhere on the cheese. Letters and words are "sauce" coloured: a colour per step.
      function throwOnto(fromEl, item, count, color, then) {
        const emoji = item.text;
        const style = (el) => { el.classList.add(item.kind); el.style.setProperty("--tc", color); };
        const fr = fromEl.getBoundingClientRect(), pr = pizza.getBoundingClientRect();
        let landed = 0;
        for (let k = 0; k < count; k++) {
          const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * 0.3;
          const tx = 0.5 + Math.cos(a) * d, ty = 0.5 + Math.sin(a) * d; // fraction of the pizza
          const f = document.createElement("div");
          f.className = "pz-fly";
          f.textContent = emoji;
          style(f);
          f.style.left = `${fr.left + fr.width / 2}px`; f.style.top = `${fr.top + fr.height / 2}px`;
          document.body.appendChild(f);
          const dx = pr.left + pr.width * tx - (fr.left + fr.width / 2), dy = pr.top + pr.height * ty - (fr.top + fr.height / 2);
          const ms = reduceMotion ? 1 : 420 + k * 70;
          f.animate([{ transform: "translate(-50%, -50%) scale(.6)" },
            { transform: `translate(calc(-50% + ${dx * 0.5}px), calc(-50% + ${dy * 0.5 - 60}px)) scale(1.2)`, offset: 0.5 },
            { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${(Math.random() - 0.5) * 120}deg)` }],
          { duration: ms, easing: "ease-in", fill: "forwards" });
          // Land on a frame timer, not the animation's finish event (that can stall in a throttled tab).
          ctx.later(() => {
            f.remove();
            const p = document.createElement("div");
            p.className = "pz-top-piece";
            p.textContent = emoji;
            style(p);
            p.style.left = `${tx * 100}%`; p.style.top = `${ty * 100}%`;
            p.style.transform = `translate(-50%, -50%) rotate(${(Math.random() - 0.5) * (item.kind === "pic" ? 120 : 50)}deg)`; // letters stay readable
            pizza.appendChild(p);
            noise(0.04, "bandpass", 1200, 800, 0.15); // plop
            if (++landed === count && then) then();
          }, ms);
          ctx.later(() => f.remove(), 2000); // never leave one behind if the frame clears the round
        }
      }

      function choose(i) {
        if (done || busy || ctx.ended) return;
        busy = true;
        const b = boxes[i];
        b.el.classList.add("open");
        noise(0.08, "highpass", 1500, 3000, 0.2); // box flap
        if (b.item.right) {
          if (b.item.kind === "pic") ctx.say(b.item.spoken);
          throwOnto(b.el, b.item, b.item.kind === "word" ? 3 : 4, SAUCE[step % SAUCE.length], () => {
            if (done || ctx.ended) return; // time ran out mid-throw
            step++;
            busy = false;
            tone(784, 0.06, "triangle", 0.1);
            if (step >= R) win(); else { nextTarget(b.item.kind === "pic"); showStep(); }
          });
        } else {
          done = true;
          ctx.lose();
          throwOnto(b.el, b.item, 2, "#7f8c3a", () => { // the wrong one, in a sickly olive
            mon.classList.add("eww");
            say(TEXT.eww);
            sweep(500, 200, 0.4, "sawtooth", 0.12); // eww
            ctx.later(() => { showRight(); ctx.say(C.answer); }, 350);
          });
        }
      }

      function say(text) {
        const s = document.createElement("div");
        s.className = "pz-say";
        s.textContent = text;
        mon.appendChild(s);
      }

      function win() {
        done = true;
        ctx.win();
        tray.innerHTML = "";
        mon.classList.add("gulp");
        tone(196, 0.3, "sawtooth", 0.08); // aaah
        ctx.later(() => {
          pizza.classList.add("gone");
          noise(0.2, "lowpass", 600, 200, 0.6); // GULP
        }, 250);
        ctx.later(() => {
          mon.classList.remove("gulp");
          mon.classList.add("happy");
          say(TEXT.burp);
          sweep(140, 90, 0.35, "sawtooth", 0.15); // BURP
          ctx.confetti(fx, counter.clientWidth / 2, counter.clientHeight / 2);
        }, 650);
        ctx.say(C.answer);
      }
      function showRight() { boxes.forEach((b) => { b.el.disabled = true; b.el.classList.add(b.item.right ? "right" : "dim"); }); }
      function replay() { if (!done) ctx.say(C.prompt); }

      // The boss's pizza: a handful of toppings at a time, then it gobbles it up at time up.
      const BTOP = ["🍄", "🫑", "🫒", "🧀", "🍅"];
      function bossTopping(k) {
        const e = BTOP[k % BTOP.length];
        for (let n = 0; n < 3; n++) {
          const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * 0.3;
          const p = document.createElement("div");
          p.className = "pz-top-piece";
          p.textContent = e;
          p.style.left = `${(0.5 + Math.cos(a) * d) * 100}%`; p.style.top = `${(0.5 + Math.sin(a) * d) * 100}%`;
          bpizza.appendChild(p);
          p.animate([{ transform: "translate(-50%, -260%) scale(1.4)", opacity: 0 }, { transform: "translate(-50%, -50%)", opacity: 1 }], { duration: reduceMotion ? 1 : 300, delay: n * 70, fill: "backwards", easing: "ease-in" });
        }
        bossBox.classList.remove("toss"); void bossBox.offsetWidth; bossBox.classList.add("toss");
        ctx.later(() => noise(0.04, "bandpass", 1200, 800, 0.12), 320);
      }
      if (rv) {
        rv.tries(R - 1, bossTopping);
        rv.onTimeUp(() => {
          bossTopping(R - 1);
          ctx.later(() => { bpizza.classList.add("gone"); noise(0.2, "lowpass", 600, 200, 0.5); }, 450); // GULP
          ctx.later(() => rv.bubble(TEXT.burp, 1300), 850);
        });
      }

      ctx.onTimeout(() => { done = true; showRight(); ctx.say(C.answer); });
      function onKey(e) {
        const i = parseInt(e.key, 10) - 1;
        if (i >= 0 && i < N) { e.preventDefault(); choose(i); }
        else if (e.key === " ") { e.preventDefault(); replay(); }
      }
      document.addEventListener("keydown", onKey);

      showStep();
      ctx.say(C.prompt);
      // Show the target big in the middle for a moment before play starts (ctx.reveal).
      ctx.reveal(card);

      // Tutorial: point at the card, then at each step tap the right one once the game is ready for it.
      ctx.tutorial(S.map((s) => s.target), async (f) => {
        await f.point(card);
        for (let r = 0; r < R; r++) {
          await f.until(() => !busy && step === r && boxes.length && S[r].row.includes(boxes[0].item) && boxes[0].el.isConnected, 5000);
          if (r) await f.point(card, 500); // the new one
          await f.tap(() => boxes.find((o) => o.item.right).el);
        }
      });
      return () => { done = true; document.querySelectorAll(".pz-fly").forEach((f) => f.remove()); document.removeEventListener("keydown", onKey); };
    },
  });
})();
