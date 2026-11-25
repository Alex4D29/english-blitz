// LUNCH LADY — the teacher's design. A cheerful lunch lady stands behind the school canteen counter (a hairnet, an
// apron, a ladle) with two trays of food in front of her, each labelled with an answer (3 from 2×). A hungry little
// monster walks up to the counter and asks for something (a speech bubble with the target, and the voice says it;
// `ctx.choiceSteps`: a new customer, a new order). Tap (or flick) the right tray: she slides it across, the customer
// says YUM! and walks off happily with it, and the next customer comes. A wrong tray: EWW! NO THANKS!, it's pushed
// back, ✕. Feed 4 customers to win; 3 wrong trays lose.
(function () {
  const TEXT = {
    name: { en: "Lunch Lady" },
    icon: "🍱",
    howTo: { en: {
      steps: [
        ["👹", "A hungry customer walks up and asks for something."],
        ["🍱", "Tap the tray with what they asked for. The lunch lady serves it!"],
        ["😋", "Feed 4 customers!"],
      ],
      tips: ["The wrong tray? EWW! Three of those and it's over.", "Tap the customer to hear the order again.", "When the game speeds up, there are 3 trays."],
    } },
    instruction: { en: "LUNCH TIME!" },
    trayLabel: (t) => `Tray with ${t}`,
    custLabel: "The customer. Tap to hear the order again.",
    yum: ["YUM!", "THANK YOU!", "MMM!", "DELICIOUS!"],
    eww: "EWW! NO THANKS!",
    win: "EVERYONE'S FED!",
  };
  const GOAL = 4, MISSES = 3, BEAT_MS = 900;
  const CUSTOMERS = ["#ff8a1f", "#c04dd9", "#2ec4b6", "#ff6fb0", "#4dd36b", "#3d8bfd"];
  const FOODS = [["#f6e7b4", "#e8c860"], ["#ff8a5c", "#d9622e"], ["#8fd16a", "#5aa83a"], ["#ffd84d", "#e0a800"]];   // mash, stew, peas, custard

  const CSS = `
  .lch { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:6px; padding-bottom:6px; }
  .lch-top { flex:none; display:flex; gap:12px; align-items:center; min-height:28px; }
  .lch-pips { display:flex; gap:5px; }
  .lch-pip { width:24px; height:24px; border:3px solid #111; border-radius:50%; background:#fff; display:flex; align-items:center; justify-content:center; font-size:13px; line-height:1; }
  .lch-pip.on { background:#ffd400; } .lch-pip.on::after { content:"😋"; }
  .lch-pip.x.on { background:#8fd16a; } .lch-pip.x.on::after { content:"🤢"; }
  .lch-room { position:relative; flex:1; min-height:0; width:100%; max-width:640px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111; touch-action:none;
    background:linear-gradient(180deg, #e9f5ee 0 var(--cy), #d9c7a8 var(--cy)), repeating-linear-gradient(90deg, rgba(0,0,0,.04) 0 40px, transparent 40px 80px); }
  .lch-room::before { content:""; position:absolute; left:0; right:0; top:0; height:calc(var(--cy) * .5); background:repeating-linear-gradient(90deg, #fff 0 30px, #cde8d8 30px 60px); opacity:.6; }   /* wall tiles */
  /* The lunch lady (--lz), behind the counter: a hairnet, googly eyes, a big smile, an apron, a ladle */
  .lch-lady { position:absolute; left:50%; top:calc(var(--cy) - var(--lz) * .92); width:var(--lz); height:var(--lz); margin-left:calc(var(--lz) / -2); z-index:1; }
  .lch-lady > * { position:absolute; box-sizing:border-box; }
  .lch-lbody { left:14%; right:14%; top:46%; bottom:0; background:#fff; border:4px solid #111; border-radius:40% 40% 10% 10%; }
  .lch-apron { left:30%; right:30%; top:56%; bottom:0; background:#ff8fb8; border:3px solid #111; border-bottom:0; border-radius:10px 10px 0 0; }
  .lch-head { left:24%; right:24%; top:6%; height:50%; background:#ffc9a8; border:4px solid #111; border-radius:50%; }
  .lch-net { left:20%; right:20%; top:0; height:26%; background:repeating-linear-gradient(45deg, transparent 0 5px, rgba(255,255,255,.9) 5px 7px), repeating-linear-gradient(-45deg, transparent 0 5px, rgba(255,255,255,.9) 5px 7px), #9a7a5a;
    border:3px solid #111; border-radius:50% 50% 20% 20%; z-index:2; }
  .lch-eye { top:24%; width:14%; aspect-ratio:1; background:#fff; border:3px solid #111; border-radius:50%; overflow:hidden; z-index:3; }
  .lch-eye.l { left:34%; } .lch-eye.r { right:34%; width:12%; top:26%; }
  .lch-eye i { position:absolute; left:28%; top:30%; width:46%; aspect-ratio:1; background:#111; border-radius:50%; animation:lch-roll 1.2s ease-in-out infinite alternate; }
  .lch-smile { left:38%; right:38%; top:40%; height:9%; background:#5a0f1e; border:3px solid #111; border-radius:0 0 99px 99px; z-index:3; }
  .lch-cheek { top:36%; width:9%; height:6%; background:#ff9cc0; border-radius:50%; z-index:3; } .lch-cheek.l { left:28%; } .lch-cheek.r { right:28%; }
  .lch-ladle { right:-4%; top:30%; width:8%; height:44%; background:#9aa3b5; border:3px solid #111; border-radius:4px; transform:rotate(18deg); }
  .lch-ladle::after { content:""; position:absolute; left:-110%; bottom:-14%; width:320%; aspect-ratio:1; background:#9aa3b5; border:3px solid #111; border-radius:0 0 50% 50%; }
  .lch-lady.serve { animation:lch-scoop .35s ease-in-out 2 alternate; }
  /* The counter, and the trays on it (--tz) */
  .lch-counter { position:absolute; left:0; right:0; top:var(--cy); height:calc(var(--tz) * .7); background:linear-gradient(#c4ccd6, #9aa3b5); border-top:5px solid #111; border-bottom:5px solid #111; z-index:2; }
  .lch-tray { position:absolute; top:calc(var(--cy) - var(--tz) * .4); width:var(--tz); height:calc(var(--tz) * .8); margin-left:calc(var(--tz) / -2); padding:0; z-index:3; font:inherit; cursor:pointer;
    touch-action:none; background:#9aa3b5; border:4px solid #111; border-radius:10px; box-shadow:inset 0 0 0 6px #c4ccd6, 0 5px 0 #111; animation:lch-in .3s cubic-bezier(.2,1.6,.4,1) both; }
  .lch-food { position:absolute; left:16%; right:16%; top:10%; height:40%; border:3px solid #111; border-radius:50% 50% 40% 40%; background:radial-gradient(circle at 35% 35%, var(--f1) 0 45%, var(--f2) 100%); }
  .lch-lbl { position:absolute; left:50%; bottom:6%; transform:translateX(-50%); padding:1px 8px; background:#fff; border:3px solid #111; border-radius:9px; font-weight:900; color:#111; line-height:1.1; white-space:nowrap; }
  .lch-tray.right .lch-lbl { box-shadow:0 0 0 4px #fff, 0 0 0 8px #00b86b; }
  .lch-tray.nope { animation:lch-shake .08s linear 6 alternate; }
  /* A customer (--uz): a little round monster that walks up to the counter; the order in a speech bubble */
  .lch-cust { position:absolute; left:0; top:0; width:var(--uz); height:var(--uz); z-index:4; cursor:pointer; touch-action:none; }
  .lch-cin { position:absolute; inset:0; }
  .lch-cin > * { position:absolute; box-sizing:border-box; }
  .lch-cbody { left:12%; right:12%; top:6%; bottom:14%; background:var(--c); border:4px solid #111; border-radius:50% 50% 42% 42%; }
  .lch-ceye { top:20%; width:24%; aspect-ratio:1; background:#fff; border:3px solid #111; border-radius:50%; overflow:hidden; z-index:2; }
  .lch-ceye.l { left:24%; } .lch-ceye.r { right:24%; width:20%; top:22%; }
  .lch-ceye i { position:absolute; left:28%; top:24%; width:46%; aspect-ratio:1; background:#111; border-radius:50%; }   /* looking up at the counter */
  .lch-cmouth { left:36%; right:36%; top:50%; height:12%; background:#5a0f1e; border:3px solid #111; border-radius:10% 10% 50% 50% / 14% 14% 86% 86%; z-index:2; }
  .lch-cust.eww .lch-cmouth { border-radius:50%; left:40%; right:40%; }
  .lch-cust.eww .lch-cbody { background:#a8d68a; }
  .lch-cleg { bottom:0; width:16%; height:18%; background:var(--c); border:3px solid #111; border-radius:40%; } .lch-cleg.l { left:28%; } .lch-cleg.r { right:28%; }
  .lch-cust.walk .lch-cleg.l { animation:lch-step .16s ease-in-out infinite alternate; } .lch-cust.walk .lch-cleg.r { animation:lch-step .16s ease-in-out infinite alternate-reverse; }
  .lch-cust.walk .lch-cin { animation:lch-bob .16s ease-in-out infinite alternate; }
  .lch-held { position:absolute; left:10%; top:-30%; width:80%; height:44%; z-index:3; display:none; background:#9aa3b5; border:3px solid #111; border-radius:6px; }
  .lch-cust.has .lch-held { display:block; }
  .lch-bub { position:absolute; left:70%; bottom:96%; padding:2px 10px; background:#fff; border:4px solid #111; border-radius:14px; font-weight:900; color:#111; line-height:1.1; white-space:nowrap; z-index:5;
    animation:lch-pop .25s cubic-bezier(.2,1.8,.4,1) both; }
  .lch-bub::after { content:""; position:absolute; left:10%; top:100%; width:14px; height:12px; background:#fff; border:4px solid #111; border-top:0; border-right:0; transform:skewX(30deg); margin-top:-3px; }
  .lch-fx { position:absolute; inset:0; pointer-events:none; z-index:8; overflow:visible; }
  .lch-word { position:absolute; transform:translate(-50%, -50%) rotate(-8deg); font-size:1.8rem; color:#ffd400; -webkit-text-stroke:2px #111; paint-order:stroke fill;
    text-shadow:0 4px 0 #111; white-space:nowrap; animation:lch-word 1s ease-out forwards; }
  .lch-word.bad { color:#8fd16a; }
  @keyframes lch-roll { from { transform:translate(-25%, -15%); } to { transform:translate(25%, 15%); } }
  @keyframes lch-scoop { to { rotate:-6deg; translate:0 4%; } }
  @keyframes lch-in { from { scale:.4; opacity:0; } }
  @keyframes lch-shake { from { rotate:-5deg; } to { rotate:5deg; } }
  @keyframes lch-step { from { transform:translateY(0); } to { transform:translateY(-30%); } }
  @keyframes lch-bob { to { transform:translateY(-4%); } }
  @keyframes lch-pop { from { transform:scale(.3); } }
  @keyframes lch-word { from { opacity:1; scale:.5; } 25% { scale:1.15; } 75% { opacity:1; } to { opacity:0; translate:0 -40px; } }
  @media (prefers-reduced-motion: reduce) { .lch-eye i, .lch-lady.serve, .lch-tray, .lch-tray.nope, .lch-cust.walk .lch-cin, .lch-cust.walk .lch-cleg, .lch-word { animation:none !important; } }
  `;
  function injectCss() { if (document.getElementById("lch2-css")) return; const s = document.createElement("style"); s.id = "lch2-css"; s.textContent = CSS; document.head.appendChild(s); }

  registerMicrogame({
    id: "lunch-lady",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 20000,   // 4 customers (the beats between them don't count)
    input: "tap",
    tutorial: true,

    start(ctx) {
      injectCss();
      const speed = ctx.speed || 1;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const { tone, sweep, noise } = ctx.sfx;
      const N = speed >= 2 ? 3 : 2;
      const S = ctx.choiceSteps(GOAL, N, { lowercase: true });
      let si = 0, st = S[0];

      const wrap = document.createElement("div");
      wrap.className = "lch";
      wrap.innerHTML = `<div class="lch-top"><div class="lch-pips hits">${'<span class="lch-pip"></span>'.repeat(GOAL)}</div><div class="lch-pips miss">${'<span class="lch-pip x"></span>'.repeat(MISSES)}</div></div>`;
      const room = document.createElement("div");
      room.className = "lch-room";
      room.innerHTML = '<div class="lch-lady"><div class="lch-ladle"></div><div class="lch-lbody"></div><div class="lch-apron"></div><div class="lch-head"></div><div class="lch-net"></div>' +
        '<div class="lch-eye l"><i></i></div><div class="lch-eye r"><i></i></div><div class="lch-cheek l"></div><div class="lch-cheek r"></div><div class="lch-smile"></div></div><div class="lch-counter"></div>';
      const fx = document.createElement("div");
      fx.className = "lch-fx";
      room.appendChild(fx);
      wrap.appendChild(room);
      ctx.root.appendChild(wrap);
      const lady = room.querySelector(".lch-lady");
      const hitPips = wrap.querySelector(".hits").children, missPips = wrap.querySelector(".miss").children;

      let W = 0, H = 0, tz = 100, uz = 100, cy = 0;
      function layout() {
        W = room.clientWidth; H = room.clientHeight;
        tz = Math.max(78, Math.min((W - 40) / N - 20, H * 0.24, 140));
        uz = Math.max(70, Math.min(H * 0.26, W * 0.22, 130));
        cy = H * 0.44;
        room.style.setProperty("--tz", `${tz}px`); room.style.setProperty("--uz", `${uz}px`); room.style.setProperty("--cy", `${cy}px`);
        room.style.setProperty("--lz", `${Math.max(90, Math.min(H * 0.36, W * 0.3, 170))}px`);
        trays.forEach((t, i) => { t.x = W * (i + 0.5) / N; t.el.style.left = `${t.x}px`; t.el.querySelector(".lch-lbl").style.fontSize = sizeOf(t.o); });
        if (cust && !walking && !cust.classList.contains("walk")) placeCust(W / 2);
        const bub = cust && cust.querySelector(".lch-bub");
        if (bub) bub.style.fontSize = `${Math.min(uz * 0.34, 34)}px`;
      }
      const sizeOf = (o) => `${o.kind === "pic" ? tz * 0.34 : Math.min(tz * 0.3, (tz * 0.9) / ([...o.text].length * 0.62))}px`;
      const custY = () => H - uz - 8;
      function placeCust(x) { cust.style.transform = `translate(${x - uz / 2}px, ${custY()}px)`; cust.dataset.x = x; }

      // ---------- The trays (new labels for each order) ----------
      let trays = [];
      function setTrays() {
        trays.forEach((t) => t.el.remove());
        trays = ctx.shuffle(st.row.slice()).map((o, i) => {
          const el = document.createElement("button");
          el.className = "lch-tray";
          el.style.animationDelay = `${i * 0.06}s`;
          const f = FOODS[(si + i) % FOODS.length];
          el.style.setProperty("--f1", f[0]); el.style.setProperty("--f2", f[1]);
          el.setAttribute("aria-label", TEXT.trayLabel(o.spoken || o.text));
          el.innerHTML = '<div class="lch-food"></div><span class="lch-lbl"></span>';
          el.querySelector(".lch-lbl").textContent = o.text;
          const t = { el, o, x: 0 };
          el.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); serve(t); });
          room.insertBefore(el, fx);
          return t;
        });
        if (W) layout();
      }

      // ---------- The customers ----------
      let cust = null, walking = false;
      function newCustomer() {
        cust = document.createElement("div");
        cust.className = "lch-cust walk";
        cust.style.setProperty("--c", CUSTOMERS[si % CUSTOMERS.length]);
        cust.setAttribute("role", "button");
        cust.setAttribute("aria-label", TEXT.custLabel);
        cust.innerHTML = '<div class="lch-cin"><div class="lch-cleg l"></div><div class="lch-cleg r"></div><div class="lch-cbody"></div><div class="lch-ceye l"><i></i></div>' +
          '<div class="lch-ceye r"><i></i></div><div class="lch-cmouth"></div><div class="lch-held"></div></div>';
        cust.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); if (!done && !walking) ctx.say(st.prompt); });
        room.insertBefore(cust, fx);
        // In from the left, up to the counter.
        walking = true;
        const from = -uz, to = W / 2, t0 = performance.now(), ms = reduceMotion ? 1 : 900;
        (function walk(now) {
          const k = Math.min(1, (now - t0) / ms);
          placeCust(from + (to - from) * k);
          if (k < 1) { ctx.raf(walk); return; }
          walking = false;
          cust.classList.remove("walk");
          ask();
        })(t0);
      }
      function ask() {
        const b = document.createElement("div");
        b.className = "lch-bub";
        b.textContent = st.cardText;
        b.style.fontSize = `${Math.min(uz * 0.34, 34)}px`;
        cust.appendChild(b);
        tone(660, 0.06, "triangle", 0.06); tone(880, 0.08, "triangle", 0.06, 0.08);
        ctx.say(st.prompt);
        busy = false;
      }
      function leave(c) {
        c.classList.add("walk");
        c.querySelector(".lch-bub")?.remove();
        const from = parseFloat(c.dataset.x), to = W + uz, t0 = performance.now(), ms = reduceMotion ? 1 : 800;
        (function walk(now) {
          const k = Math.min(1, (now - t0) / ms);
          c.style.transform = `translate(${from + (to - from) * k - uz / 2}px, ${custY()}px)`;
          if (k < 1) { ctx.raf(walk); return; }
          c.remove();
        })(t0);
      }

      // ---------- Serving ----------
      let hits = 0, missN = 0, done = false, busy = true;
      function serve(t) {
        if (done || busy || walking || ctx.ended || !cust) return;
        busy = true;
        lady.classList.remove("serve"); void lady.offsetWidth; lady.classList.add("serve");
        // The tray slides across the counter, down to the customer.
        const cx = parseFloat(cust.dataset.x);
        const a = t.el.animate([{ transform: "none" }, { transform: `translate(${cx - t.x}px, ${custY() - (cy - tz * 0.4) - uz * 0.2}px) scale(.7)` }], { duration: reduceMotion ? 1 : 420, easing: "ease-in", fill: "forwards" });
        sweep(500, 800, 0.2, "triangle", 0.05);
        ctx.later(() => { if (t.o.right) yum(t); else eww(t, a); }, reduceMotion ? 10 : 430);
      }
      function yum(t) {
        t.el.style.visibility = "hidden";
        const c = cust;
        c.classList.add("has");
        [523, 659, 784].forEach((f, k) => tone(f, 0.09, "triangle", 0.09, k * 0.07));
        word(TEXT.yum[hits % TEXT.yum.length], false, parseFloat(c.dataset.x), custY() - 20);
        if (t.o.kind === "pic") ctx.say(t.o.spoken); else ctx.say(st.answer);
        hitPips[hits].classList.add("on");
        hits++;
        ctx.later(() => leave(c), 500);
        if (hits >= GOAL) { done = true; ctx.win(); ctx.later(() => { word(TEXT.win, false, W / 2, H * 0.2); ctx.confetti(fx, W / 2, H * 0.4, { count: 90 }); }, 700); return; }
        // The beat: the next customer walks up with a new order; new trays.
        ctx.later(() => {
          if (done) return;
          ctx.pauseTimer(BEAT_MS);
          st = S[++si];
          setTrays();
          newCustomer();
        }, 900);
      }
      function eww(t, a) {
        cust.classList.add("eww");
        sweep(700, 250, 0.4, "square", 0.07); noise(0.2, "lowpass", 500, 200, 0.3, 0.15);
        word(TEXT.eww, true, W / 2, custY() - 30);
        if (t.o.kind === "pic") ctx.say(t.o.spoken);
        missPips[missN].classList.add("on");
        missN++;
        // Pushed back onto the counter.
        ctx.later(() => { a.cancel(); t.el.classList.add("nope"); cust.classList.remove("eww"); }, 500);
        ctx.later(() => t.el.classList.remove("nope"), 1000);
        if (missN >= MISSES) { done = true; ctx.lose(); ctx.later(() => { trays.forEach((x) => { if (x.o.right) x.el.classList.add("right"); }); ctx.say(st.answer); }, 600); return; }
        ctx.later(() => { busy = false; }, 650);
      }
      function word(text, bad, x, y) {
        const w = document.createElement("div");
        w.className = "lch-word" + (bad ? " bad" : "");
        w.textContent = text;
        w.style.left = `${Math.max(110, Math.min(W - 110, x))}px`; w.style.top = `${Math.max(26, y)}px`;
        fx.appendChild(w);
        ctx.later(() => w.remove(), 1000);
      }

      // Flicking works too: a flick towards a tray serves it (for the 5-year-olds who swipe everything).
      let sx = null;
      room.addEventListener("pointerdown", (e) => { sx = e.clientX; });
      room.addEventListener("pointerup", (e) => {
        if (sx == null) return;
        const dx = e.clientX - sx; sx = null;
        if (Math.abs(dx) > 40 && trays.length === 2) serve(trays[dx < 0 ? 0 : 1]);
      });
      function onKey(e) {
        const i = parseInt(e.key, 10) - 1;
        if (i >= 0 && i < trays.length) { e.preventDefault(); serve(trays[i]); }
        else if (e.key === "ArrowLeft" && trays.length === 2) { e.preventDefault(); serve(trays[0]); }
        else if (e.key === "ArrowRight" && trays.length === 2) { e.preventDefault(); serve(trays[1]); }
        else if (e.key === " ") { e.preventDefault(); if (!done) ctx.say(st.prompt); }
      }
      document.addEventListener("keydown", onKey);

      ctx.onTimeout(() => { done = true; trays.forEach((x) => { if (x.o.right) x.el.classList.add("right"); }); ctx.say(st.answer); });

      layout();
      const ro = new ResizeObserver(layout);
      ro.observe(room);
      setTrays();
      ctx.later(newCustomer, 200);

      // Tutorial: for each customer, point at them (the order), then tap the right tray.
      ctx.tutorial(S.map((s) => s.target), async (f) => {
        for (let n = 0; n < GOAL && !done; n++) {
          await f.until(() => !busy && !walking && si === n && cust, 5000);
          await f.point(() => cust, n ? 400 : 800);
          await f.tap(() => (trays.find((x) => x.o.right) || trays[0]).el);
          await f.until(() => hits > n || done, 2500);
        }
      });
      return () => { done = true; ro.disconnect(); document.removeEventListener("keydown", onKey); };
    },
  });
})();
