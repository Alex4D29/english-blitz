// BURGER STACK — a gap game (the teacher's idea; Core.gapSteps). The word is stacked as a burger, one letter
// per layer, read top to bottom (bun "c", patty "a", bun "t"), with one layer missing (a dashed slot). A hungry
// customer monster waits beside it, dreaming of the picture. Tap the right ingredient tile: it drops into the
// slot, the burger is done, the customer gobbles it (CHOMP!) and BURPS, then the next order. A wrong tile turns
// into a 🥦 that the customer spits out (BLEH!, ✕). 3 burgers win; 3 broccolis and you lose.
(function () {
  const TEXT = {
    name: { en: "Burger Stack" },
    icon: "🍔",
    howTo: { en: {
      steps: [
        ["🍔", "The word is a burger, one letter on each layer. One layer is missing!"],
        ["👂", "Look at the picture and listen to the word."],
        ["👆", "Tap the layer that finishes the word. Make 3 burgers!"],
      ],
      tips: ["The wrong one turns into broccoli and gets spat out! 3 and it's over.", "Sight words show the whole word first: watch which letter flies out!"],
    } },
    instruction: { en: "MAKE THE\nBURGER!" },
    yum: ["CHOMP!", "YUM!", "BURP!"],
    bleh: "BLEH!",
    missing: "What's missing?",
  };
  const GOAL = 3, MISSES = 3, BEAT_MS = 900;
  // Filling colours (between the buns), by position
  const FILL = [["#3b2a1a", "#6b4520"], ["#ffd400", "#e6b800"], ["#4dd36b", "#2fa84a"], ["#e8173c", "#b0102c"], ["#ff9f43", "#d97a1f"]];

  const CSS = `
  .bu { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:6px; padding-bottom:6px; }
  .bu-top { flex:none; display:flex; gap:10px; }
  .bu-pips { display:flex; gap:4px; }
  .bu-pip { width:24px; height:24px; border:3px solid #111; border-radius:50%; background:#fff; display:flex; align-items:center; justify-content:center; font-size:13px; line-height:1; }
  .bu-pip.on { background:#ffd400; } .bu-pip.on::after { content:"🍔"; } .bu-pip.x { background:#ff5a6e; } .bu-pip.x::after { content:"🥦"; }
  .bu-diner { position:relative; flex:1; min-height:0; width:100%; max-width:600px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111;
    background:linear-gradient(180deg, #ffe9c9 0 62%, #d24b3f 62% 65%, #fff 65% 66%, #d24b3f 66% 69%, #b9e3ff 69%); }
  .bu-diner::before { content:""; position:absolute; left:0; right:0; top:0; height:12%; background:repeating-linear-gradient(90deg, #e8173c 0 30px, #fff 30px 60px); border-bottom:4px solid #111; }
  .bu-stack { position:absolute; left:30%; top:16%; width:var(--lw); transform:translateX(-50%); display:flex; flex-direction:column; align-items:center; }
  .bu-layer { position:relative; width:100%; height:var(--lh); margin-top:-4px; display:flex; align-items:center; justify-content:center; border:4px solid #111;
    font-size:calc(var(--lh) * .62); font-weight:900; color:#fff; -webkit-text-stroke:1.5px #111; paint-order:stroke fill; line-height:1; }
  .bu-layer.bun-t { height:calc(var(--lh) * 1.25); border-radius:50% 50% 12% 12% / 70% 70% 30% 30%; background:radial-gradient(circle at 30% 30%, #fff 0 4%, transparent 5%) 0 0 / 22% 50%, #f0a64a; }
  .bu-layer.bun-b { border-radius:12% 12% 30% 30% / 20% 20% 60% 60%; background:#e89a3c; }
  .bu-layer.fill { width:110%; border-radius:30px; background:linear-gradient(var(--f1), var(--f2)); }
  .bu-layer.gap { background:rgba(255,255,255,.5); border-style:dashed; animation:bu-gap .5s ease-in-out infinite alternate; color:transparent; -webkit-text-stroke:0; }
  .bu-layer.gap::after { content:"?"; color:#111; opacity:.5; }
  .bu-layer.answer { box-shadow:0 0 0 5px #ffd400, 0 0 20px 8px #ffd400; }
  .bu-plate { width:130%; height:calc(var(--lh) * .4); margin-top:-2px; border:4px solid #111; border-radius:50%; background:#fff; }
  /* The customer (--cz) and its thought bubble */
  .bu-cust { position:absolute; right:6%; top:18%; width:var(--cz); height:var(--cz); }
  .bu-cust > * { position:absolute; box-sizing:border-box; }
  .bu-cust .bd { left:10%; right:10%; top:22%; bottom:0; background:#b04dff; border:5px solid #111; border-radius:46% 46% 30% 30%; }
  .bu-cust .ey { top:30%; width:24%; aspect-ratio:1; background:#fff; border:4px solid #111; border-radius:50%; overflow:hidden; } .bu-cust .ey.l { left:24%; } .bu-cust .ey.r { right:24%; width:20%; }
  .bu-cust .ey i { position:absolute; left:28%; top:30%; width:46%; aspect-ratio:1; background:#111; border-radius:50%; animation:bu-look 1.1s ease-in-out infinite alternate; }
  .bu-cust .mo { left:30%; right:30%; top:58%; height:16%; background:#5a0f1e; border:4px solid #111; border-radius:10% 10% 50% 50%; overflow:hidden; }
  .bu-cust .mo::before { content:""; position:absolute; left:0; right:0; top:0; height:30%; background:#fff; }
  .bu-cust .drool { left:56%; top:70%; width:8%; height:12%; background:#8fd3ff; border-radius:0 0 99px 99px; animation:bu-drool 1s ease-in infinite; }
  .bu-cust.eat .mo { animation:bu-chomp .15s ease-in-out infinite alternate; }
  .bu-cust.yuck .bd { background:#7cbf4a; } .bu-cust.yuck { animation:bu-shake .3s linear 2; }
  .bu-bubble { position:absolute; right:calc(6% + var(--cz) * .6); top:2%; padding:4px 10px; background:#fff; border:4px solid #111; border-radius:20px; font-size:calc(var(--cz) * .32); line-height:1; z-index:2; }
  /* The ingredient tiles */
  .bu-tiles { flex:none; display:flex; gap:10px; justify-content:center; flex-wrap:wrap; padding:0 8px; }
  .bu-tile { min-width:74px; height:64px; padding:0 10px; border:5px solid #111; border-radius:22px; box-shadow:0 6px 0 #111; background:linear-gradient(var(--f1), var(--f2));
    font:inherit; font-size:2.2rem; font-weight:900; color:#fff; -webkit-text-stroke:1.5px #111; paint-order:stroke fill; line-height:1; cursor:pointer; touch-action:manipulation; }
  .bu-tile:active { transform:translateY(4px); box-shadow:0 2px 0 #111; }
  .bu-tile.used { visibility:hidden; }
  .bu-fly { position:absolute; z-index:9; pointer-events:none; font-size:2.4rem; line-height:1; }
  .bu-fx { position:absolute; inset:0; pointer-events:none; z-index:8; overflow:visible; }
  .bu-word { position:absolute; transform:translate(-50%, -50%) rotate(-8deg); font-size:2rem; color:#ffd400; -webkit-text-stroke:2px #111; paint-order:stroke fill; text-shadow:0 4px 0 #111;
    white-space:nowrap; animation:bu-word 1s ease-out forwards; }
  .bu-word.bad { color:#7cbf4a; }
  @keyframes bu-gap { to { background:rgba(255,230,120,.7); } }
  @keyframes bu-look { 0% { transform:translate(-30%, 0); } 100% { transform:translate(30%, 20%); } }
  @keyframes bu-drool { 0% { height:0; } 80% { height:14%; } 100% { height:16%; opacity:0; } }
  @keyframes bu-chomp { from { transform:scaleY(1); } to { transform:scaleY(.3); } }
  @keyframes bu-shake { 25% { translate:-8px 0; } 75% { translate:8px 0; } }
  @keyframes bu-word { from { opacity:1; scale:.5; } 25% { scale:1.15; } 75% { opacity:1; } to { opacity:0; translate:0 -40px; } }
  @media (prefers-reduced-motion: reduce) { .bu-layer.gap, .bu-cust *, .bu-word { animation:none !important; } }
  `;
  function injectCss() { if (document.getElementById("bu-css")) return; const s = document.createElement("style"); s.id = "bu-css"; s.textContent = CSS; document.head.appendChild(s); }

  registerMicrogame({
    id: "burger-stack",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 15000,
    input: "tap",
    tutorial: true,

    start(ctx) {
      injectCss();
      const speed = ctx.speed || 1;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const { tone, sweep, noise } = ctx.sfx;
      const N = speed >= 1.75 ? 4 : 3;
      const S = ctx.gapSteps(GOAL, N, { lowercase: true });
      let si = 0, st = S[0], hits = 0, missN = 0, done = false, busy = true;

      const wrap = document.createElement("div");
      wrap.className = "bu";
      wrap.innerHTML = `<div class="bu-top"><div class="bu-pips hits">${'<span class="bu-pip"></span>'.repeat(GOAL)}</div><div class="bu-pips miss">${'<span class="bu-pip"></span>'.repeat(MISSES)}</div></div>` +
        '<div class="bu-diner"><div class="bu-stack"></div><div class="bu-bubble"></div><div class="bu-cust"><div class="bd"></div><div class="ey l"><i></i></div><div class="ey r"><i></i></div><div class="mo"></div><div class="drool"></div></div><div class="bu-fx"></div></div>' +
        '<div class="bu-tiles"></div>';
      ctx.root.appendChild(wrap);
      const diner = wrap.querySelector(".bu-diner"), stack = wrap.querySelector(".bu-stack"), bubble = wrap.querySelector(".bu-bubble"), cust = wrap.querySelector(".bu-cust");
      const tilesEl = wrap.querySelector(".bu-tiles"), fx = wrap.querySelector(".bu-fx");
      const hitPips = wrap.querySelector(".hits").children, missPips = wrap.querySelector(".miss").children;
      bubble.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });
      cust.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });

      let W = 0, H = 0;
      function layout() {
        W = diner.clientWidth; H = diner.clientHeight;
        const n = st.cells.length;
        const lh = Math.max(26, Math.min((H * 0.66) / (n + 1), 64));
        diner.style.setProperty("--lh", `${lh}px`);
        diner.style.setProperty("--lw", `${Math.min(W * 0.42, lh * 3.6)}px`);
        diner.style.setProperty("--cz", `${Math.max(80, Math.min(W * 0.3, H * 0.42, 150))}px`);
      }

      // ---------- An order ----------
      let layers = [], tiles = [];
      const layerKind = (i, n) => (i === 0 ? "bun-t" : i === n - 1 ? "bun-b" : "fill");
      function paint(el, i, n) {
        const k = layerKind(i, n);
        el.className = "bu-layer " + k;
        if (k === "fill") { const f = FILL[(i - 1) % FILL.length]; el.style.setProperty("--f1", f[0]); el.style.setProperty("--f2", f[1]); }
      }
      function tileColors(el) {
        const k = layerKind(st.gap, st.cells.length);
        const f = k === "fill" ? FILL[(st.gap - 1) % FILL.length] : k === "bun-t" ? ["#f6b860", "#e89a3c"] : ["#f0a64a", "#d98a2c"];
        el.style.setProperty("--f1", f[0]); el.style.setProperty("--f2", f[1]);
      }
      function showStep() {
        const n = st.cells.length;
        stack.innerHTML = "";
        layers = st.cells.map((l, i) => {
          const el = document.createElement("div");
          paint(el, i, n);
          el.textContent = l;
          stack.appendChild(el);
          return el;
        });
        stack.insertAdjacentHTML("beforeend", '<div class="bu-plate"></div>');
        bubble.textContent = st.pic || (st.kind === "letter" ? "❓" : "🔊");
        cust.className = "bu-cust";
        layout();
        tilesEl.innerHTML = "";
        tiles = st.options.map((l) => {
          const b = document.createElement("button");
          b.className = "bu-tile";
          b.textContent = l;
          tileColors(b);
          b.addEventListener("pointerdown", (e) => { e.preventDefault(); pick(b, l); });
          tilesEl.appendChild(b);
          return { b, l };
        });
        busy = true;
        const openGap = () => { const g = layers[st.gap]; g.classList.add("gap"); busy = false; };
        if (st.showFirst) {
          ctx.pauseTimer(1500);
          ctx.later(() => {
            if (!reduceMotion) layers[st.gap].animate([{ transform: "none" }, { transform: "translateX(-140%) rotate(-30deg)", opacity: 0.2 }, { transform: "none", opacity: 1 }], { duration: 460 });
            sweep(600, 1400, 0.25, "triangle", 0.07);
            ctx.later(openGap, 300);
          }, 1050);
        } else openGap();
        if (st.prompt) ctx.say(st.prompt); else if (si === 0) ctx.say(TEXT.missing);
      }

      // ---------- Choosing ----------
      function pick(b, l) {
        if (done || busy || ctx.ended) return;
        busy = true;
        b.classList.add("used");
        const br = b.getBoundingClientRect(), gr = layers[st.gap].getBoundingClientRect(), dr = diner.getBoundingClientRect();
        const f = document.createElement("div");
        f.className = "bu-fly"; f.textContent = l;
        diner.appendChild(f);
        f.animate([{ transform: `translate(${br.left - dr.left}px, ${br.top - dr.top}px)` }, { transform: `translate(${gr.left - dr.left + gr.width / 2 - 14}px, ${gr.top - dr.top - 10}px)` }],
          { duration: reduceMotion ? 1 : 320, easing: "ease-in", fill: "forwards" });
        sweep(800, 300, 0.2, "triangle", 0.07); // whee… plop
        ctx.later(() => { f.remove(); if (l === st.answer) right(); else wrong(b); }, reduceMotion ? 20 : 330);
      }
      function right() {
        const g = layers[st.gap];
        g.classList.remove("gap");
        g.textContent = st.answer;
        tone(300, 0.08, "sine", 0.1); // plop
        hitPips[hits].classList.add("on");
        hits++;
        ctx.say(st.say);
        // The customer gobbles it up.
        ctx.later(() => {
          cust.classList.add("eat");
          [0, 0.15, 0.3].forEach((t) => noise(0.06, "bandpass", 900, 600, 0.45, t)); // chomp chomp
          if (!reduceMotion) stack.animate([{ transform: "translateX(-50%) scale(1)" }, { transform: "translateX(40%) scale(.2)", opacity: 0 }], { duration: 500, easing: "ease-in", fill: "forwards" });
          word(TEXT.yum[(hits - 1) % TEXT.yum.length], false);
        }, 450);
        ctx.later(() => { sweep(160, 90, 0.35, "sawtooth", 0.1); word(TEXT.yum[2], false); ctx.confetti(fx, W * 0.75, H * 0.35, { count: 30 }); }, 1050); // BURP
        if (hits >= GOAL) { done = true; ctx.win(); return; }
        ctx.later(() => {
          ctx.pauseTimer(BEAT_MS);
          st = S[++si];
          stack.getAnimations().forEach((a) => a.cancel());
          tone(98, 0.08, "square", 0.1); tone(98, 0.08, "square", 0.1, 0.16);
          showStep();
        }, 1400);
      }
      function wrong(b) {
        missPips[missN].classList.add("x");
        missN++;
        cust.classList.remove("yuck"); void cust.offsetWidth; cust.classList.add("yuck");
        const br = cust.getBoundingClientRect(), dr = diner.getBoundingClientRect();
        const f = document.createElement("div");
        f.className = "bu-fly"; f.textContent = "🥦";
        diner.appendChild(f);
        const x = br.left - dr.left + br.width * 0.4, y = br.top - dr.top + br.height * 0.5;
        f.animate([{ transform: `translate(${x}px, ${y}px) scale(.5)` }, { transform: `translate(${x - 120}px, ${y - 80}px) rotate(-200deg)`, offset: 0.5 }, { transform: `translate(${x - 200}px, ${H}px) rotate(-400deg)` }],
          { duration: reduceMotion ? 1 : 800, easing: "ease-out", fill: "forwards" });
        ctx.later(() => f.remove(), 820);
        noise(0.2, "lowpass", 900, 200, 0.4); sweep(500, 200, 0.3, "sawtooth", 0.08); // PTOO
        word(TEXT.bleh, true);
        if (missN >= MISSES) { done = true; ctx.lose(); showAnswer(); ctx.say(st.say); return; }
        ctx.later(() => { b.classList.remove("used"); cust.classList.remove("yuck"); busy = false; }, 600);
      }
      function showAnswer() { const g = layers[st.gap]; g.classList.remove("gap"); g.classList.add("answer"); g.textContent = st.answer; }
      function word(text, bad) {
        const w = document.createElement("div");
        w.className = "bu-word" + (bad ? " bad" : "");
        w.textContent = text;
        w.style.left = `${W * 0.72}px`; w.style.top = `${H * 0.16}px`;
        fx.appendChild(w);
        ctx.later(() => w.remove(), 1000);
      }
      function replay() { if (!done && st.prompt) ctx.say(st.prompt); }

      ctx.onTimeout(() => { done = true; showAnswer(); ctx.say(st.say); });
      const ro = new ResizeObserver(layout);
      ro.observe(diner);
      showStep();

      ctx.tutorial(S.map((s) => s.target), async (f) => {
        for (let n = 0; n < GOAL && !done; n++) {
          await f.until(() => !busy && si === n, 4000);
          await f.point(stack, 600);
          await f.tap(() => (tiles.find((t) => t.l === st.answer) || tiles[0]).b);
          await f.until(() => hits > n || done, 3000);
        }
      });
      return () => { done = true; ro.disconnect(); };
    },
  });
})();
