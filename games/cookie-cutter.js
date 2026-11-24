// COOKIE CUTTER — a gap game (the teacher's idea; Core.gapSteps). A big cookie has the word piped on it in
// icing, with one letter missing: a round hole. A picture card sits beside it. Chocolate letters slide back
// and forth on a tray below: drag the right one into the hole (or tap it). It fits, the cookie is done and a
// big monster mouth takes bites out of it (CHOMP!), then the next cookie. A wrong letter doesn't fit: it
// bounces back out (✕). 3 cookies win; 3 bounces and you lose.
(function () {
  const TEXT = {
    name: { en: "Cookie Cutter" },
    icon: "🍪",
    howTo: { en: {
      steps: [
        ["🍪", "The cookie has a word on it, but one letter is missing: there's a hole!"],
        ["👂", "Look at the picture and listen to the word."],
        ["👆", "Drag the chocolate letter that fits into the hole (or tap it). Finish 3 cookies!"],
      ],
      tips: ["A wrong letter won't fit and bounces out. 3 of those and it's over.", "Sight words show the whole word first: watch which letter flies out!"],
    } },
    instruction: { en: "FINISH THE\nCOOKIE!" },
    chomp: ["CHOMP!", "YUM!", "MUNCH!"],
    nope: "DOESN'T FIT!",
    missing: "What's missing?",
  };
  const GOAL = 3, MISSES = 3, BEAT_MS = 900;
  const ICING = ["#ff6fb0", "#2f8fe0", "#ffffff", "#4dd36b", "#b04dff"];

  const CSS = `
  .ck { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:6px; padding-bottom:6px; }
  .ck-top { flex:none; display:flex; gap:10px; }
  .ck-pips { display:flex; gap:4px; }
  .ck-pip { width:24px; height:24px; border:3px solid #111; border-radius:50%; background:#fff; display:flex; align-items:center; justify-content:center; font-size:13px; line-height:1; }
  .ck-pip.on { background:#ffd400; } .ck-pip.on::after { content:"🍪"; } .ck-pip.x { background:#ff5a6e; } .ck-pip.x::after { content:"✕"; color:#fff; }
  .ck-table { position:relative; flex:1; min-height:0; width:100%; max-width:600px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111;
    background:repeating-linear-gradient(45deg, #ffe0ef 0 22px, #fff 22px 44px); touch-action:none; }
  .ck-cookie { position:absolute; left:42%; top:48%; width:var(--kz); height:var(--kz); transform:translate(-50%, -50%); border-radius:50%; border:6px solid #111;
    background:radial-gradient(circle at 25% 30%, #5a3510 0 4%, transparent 5%), radial-gradient(circle at 70% 25%, #5a3510 0 3.5%, transparent 4.5%), radial-gradient(circle at 65% 75%, #5a3510 0 4%, transparent 5%),
      radial-gradient(circle at 30% 72%, #5a3510 0 3%, transparent 4%), radial-gradient(circle, #e8b26a 0 60%, #c98a4b 100%);
    display:flex; align-items:center; justify-content:center; gap:4px; box-shadow:0 8px 0 rgba(0,0,0,.25); }
  .ck-l { width:var(--lz); height:var(--lz); display:flex; align-items:center; justify-content:center; font-size:calc(var(--lz) * .82); font-weight:900; line-height:1; color:var(--ic);
    -webkit-text-stroke:2px #111; paint-order:stroke fill; text-shadow:0 3px 0 rgba(0,0,0,.3); }
  .ck-l.hole { border-radius:50%; background:#5a3510; box-shadow:inset 0 6px 10px rgba(0,0,0,.6); border:3px dashed #fff3; }
  .ck-l.hole.hot { box-shadow:inset 0 6px 10px rgba(0,0,0,.6), 0 0 0 5px #ffd400; }
  .ck-l.choc { color:#6b3e1a; -webkit-text-stroke:2px #2b1608; }
  .ck-l.answer { box-shadow:0 0 0 5px #ffd400, 0 0 18px 8px #ffd400; border-radius:50%; }
  .ck-bite { position:absolute; width:34%; aspect-ratio:1; border-radius:50%; background:#fff; z-index:2; pointer-events:none; }
  .ck-pic { position:absolute; right:4%; top:8%; padding:6px 12px; background:#fff; border:4px solid #111; border-radius:18px; font-size:calc(var(--kz) * .22); line-height:1; z-index:2; }
  /* The tray of chocolate letters */
  .ck-tray { position:relative; flex:none; width:100%; max-width:600px; height:78px; background:#c0c0c8; border:5px solid #111; border-radius:16px; overflow:hidden; touch-action:none; }
  .ck-choc { position:absolute; top:6px; width:62px; height:56px; display:flex; align-items:center; justify-content:center; background:radial-gradient(circle at 30% 30%, #8a5a2b, #5a3510);
    border:4px solid #111; border-radius:50%; font-size:2rem; font-weight:900; color:#ffe8c4; line-height:1; cursor:grab; touch-action:none; }
  .ck-choc.drag { position:fixed; z-index:200; pointer-events:none; }
  .ck-choc.gone { visibility:hidden; }
  .ck-fx { position:absolute; inset:0; pointer-events:none; z-index:8; overflow:visible; }
  .ck-word { position:absolute; transform:translate(-50%, -50%) rotate(-8deg); font-size:2rem; color:#ffd400; -webkit-text-stroke:2px #111; paint-order:stroke fill; text-shadow:0 4px 0 #111;
    white-space:nowrap; animation:ck-word 1s ease-out forwards; }
  .ck-word.bad { color:#ff4d6d; }
  .ck-me { position:absolute; z-index:7; pointer-events:none; }
  .ck-crumb { position:absolute; width:10px; height:8px; border-radius:40%; background:#c98a4b; border:2px solid #5a3510; z-index:6; pointer-events:none; }
  .ck-mouth { position:absolute; width:calc(var(--kz) * .7); height:calc(var(--kz) * .5); z-index:7; pointer-events:none; border-radius:50% 50% 45% 45%; background:#5a0f1e; border:6px solid #111; }
  .ck-mouth::before { content:""; position:absolute; left:5%; right:5%; top:0; height:24%; background:repeating-linear-gradient(90deg, #fff 0 18%, #ddd 18% 22%); }
  @keyframes ck-word { from { opacity:1; scale:.5; } 25% { scale:1.15; } 75% { opacity:1; } to { opacity:0; translate:0 -40px; } }
  @media (prefers-reduced-motion: reduce) { .ck-word { animation:none !important; } }
  `;
  function injectCss() { if (document.getElementById("ck-css")) return; const s = document.createElement("style"); s.id = "ck-css"; s.textContent = CSS; document.head.appendChild(s); }

  registerMicrogame({
    id: "cookie-cutter",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 16000,
    input: "drag",
    tutorial: true,

    start(ctx) {
      injectCss();
      const speed = ctx.speed || 1, pace = 0.6 + 0.4 * speed;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const { tone, sweep, noise } = ctx.sfx;
      const N = speed >= 1.75 ? 4 : 3;
      const S = ctx.gapSteps(GOAL, N, { lowercase: true });
      let si = 0, st = S[0], hits = 0, missN = 0, done = false, busy = true;

      const wrap = document.createElement("div");
      wrap.className = "ck";
      wrap.innerHTML = `<div class="ck-top"><div class="ck-pips hits">${'<span class="ck-pip"></span>'.repeat(GOAL)}</div><div class="ck-pips miss">${'<span class="ck-pip"></span>'.repeat(MISSES)}</div></div>` +
        '<div class="ck-table"><div class="ck-cookie"></div><div class="ck-pic"></div><div class="ck-fx"></div></div><div class="ck-tray"></div>';
      ctx.root.appendChild(wrap);
      const table = wrap.querySelector(".ck-table"), cookie = wrap.querySelector(".ck-cookie"), pic = wrap.querySelector(".ck-pic"), tray = wrap.querySelector(".ck-tray"), fx = wrap.querySelector(".ck-fx");
      const hitPips = wrap.querySelector(".hits").children, missPips = wrap.querySelector(".miss").children;
      pic.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });

      let W = 0, H = 0, kz = 200;
      function layout() {
        W = table.clientWidth; H = table.clientHeight;
        kz = Math.max(140, Math.min(H * 0.9, W * 0.62, 340));
        table.style.setProperty("--kz", `${kz}px`);
        table.style.setProperty("--lz", `${Math.min(kz * 0.24, (kz * 0.78) / st.cells.length)}px`);
      }

      let ls = [], chocs = [];
      function showStep() {
        cookie.innerHTML = "";
        cookie.getAnimations().forEach((a) => a.cancel());
        cookie.style.transition = "none"; cookie.style.transform = ""; // (a whole new cookie)
        const ic = ICING[si % ICING.length];
        ls = st.cells.map((l) => {
          const el = document.createElement("div");
          el.className = "ck-l";
          el.style.setProperty("--ic", ic);
          el.textContent = l;
          cookie.appendChild(el);
          return el;
        });
        pic.textContent = st.pic || (st.kind === "letter" ? "🔤" : "🔊") /* (🔤: alphabet order) */;
        layout();
        tray.innerHTML = "";
        chocs = st.options.map((l, k) => {
          const el = document.createElement("div");
          el.className = "ck-choc";
          el.textContent = l;
          el.addEventListener("pointerdown", (e) => startDrag(e, c));
          tray.appendChild(el);
          const c = { el, l, x: 20 + k * 90, dir: k % 2 ? -1 : 1 };
          return c;
        });
        busy = true;
        const openGap = () => { const g = ls[st.gap]; g.textContent = ""; g.classList.add("hole"); busy = false; };
        if (st.showFirst) {
          ctx.pauseTimer(1500);
          ctx.later(() => {
            if (!reduceMotion) ls[st.gap].animate([{ transform: "none" }, { transform: "translateY(-160%) rotate(40deg) scale(.6)", opacity: 0 }], { duration: 450, easing: "ease-in" });
            sweep(600, 1400, 0.25, "triangle", 0.07);
            ctx.later(openGap, 430);
          }, 1050);
        } else openGap();
        if (st.prompt) ctx.say(st.prompt); else if (si === 0) ctx.say(TEXT.missing);
      }

      // The chocolates slide back and forth on the tray.
      let last = null;
      function frame(ts) {
        const dt = last == null ? 0 : Math.min(50, ts - last) / 1000;
        last = ts;
        const TW = tray.clientWidth, v = 50 * pace;
        chocs.forEach((c) => {
          if (drag && drag.c === c) return;
          c.x += c.dir * v * dt;
          if (c.x < 6) { c.x = 6; c.dir = 1; }
          if (c.x > TW - 74) { c.x = TW - 74; c.dir = -1; }
          c.el.style.left = `${c.x}px`;
        });
        if (!ctx.ended) ctx.raf(frame);
      }

      // ---------- Dragging a chocolate (a tap counts too) ----------
      let drag = null;
      function startDrag(e, c) {
        e.preventDefault();
        if (done || busy || ctx.ended || drag) return;
        const r = c.el.getBoundingClientRect();
        drag = { c, id: e.pointerId, x0: e.clientX, y0: e.clientY, dx: e.clientX - r.left, dy: e.clientY - r.top, moved: false, ghost: null };
        try { c.el.setPointerCapture(e.pointerId); } catch (err) { /* ok */ }
      }
      tray.addEventListener("pointermove", (e) => {
        if (!drag || e.pointerId !== drag.id) return;
        if (!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 8) {
          drag.moved = true;
          drag.ghost = drag.c.el.cloneNode(true);
          drag.ghost.classList.add("drag");
          document.body.appendChild(drag.ghost);
          drag.c.el.classList.add("gone");
        }
        if (drag.ghost) {
          drag.ghost.style.left = `${e.clientX - drag.dx}px`; drag.ghost.style.top = `${e.clientY - drag.dy}px`;
          ls[st.gap].classList.toggle("hot", overHole(e.clientX, e.clientY));
        }
      });
      tray.addEventListener("pointerup", (e) => {
        if (!drag || e.pointerId !== drag.id) return;
        const d = drag; drag = null;
        if (d.ghost) d.ghost.remove();
        ls[st.gap].classList.remove("hot");
        if (!d.moved || overHole(e.clientX, e.clientY)) choose(d.c);
        else d.c.el.classList.remove("gone");
      });
      tray.addEventListener("pointercancel", (e) => { if (drag && e.pointerId === drag.id) { if (drag.ghost) drag.ghost.remove(); drag.c.el.classList.remove("gone"); drag = null; } });
      const overHole = (x, y) => { const g = ls[st.gap].getBoundingClientRect(); return x > g.left - 50 && x < g.right + 50 && y > g.top - 60 && y < g.bottom + 60; };

      function choose(c) {
        if (done || busy || ctx.ended) return;
        busy = true;
        c.el.classList.add("gone");
        if (c.l === st.answer) eat(); else bounce(c);
      }
      // It fits! Then a big mouth takes three bites out of the cookie.
      function eat() {
        const g = ls[st.gap];
        g.classList.remove("hole"); g.classList.add("choc");
        g.textContent = st.answer;
        tone(700, 0.06, "sine", 0.1); tone(1000, 0.08, "sine", 0.1, 0.06); // pop in
        hitPips[hits].classList.add("on");
        hits++;
        ctx.say(st.say);
        const cr = cookie.getBoundingClientRect(), tr = table.getBoundingClientRect();
        const cx = cr.left - tr.left + cr.width / 2, cy = cr.top - tr.top + cr.height / 2;
        // Your character pops up beside the cookie and munches it: it shrinks with each bite, crumbs fly (the
        // teacher found the floating mouth weird).
        const me = document.createElement("div");
        me.className = "ck-me";
        const fig = window.Mascot.el(kz * 0.55);
        window.Mascot.mood(fig, "eat");
        me.appendChild(fig);
        me.style.left = `${cx + kz * 0.36}px`; me.style.top = `${cy - kz * 0.42}px`; // (beside the cookie, munching from the right)
        fx.appendChild(me);
        if (!reduceMotion) me.animate([{ transform: "translate(60%, 40%) scale(.3)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 300, easing: "cubic-bezier(.2,1.6,.4,1)" });
        ctx.later(() => me.remove(), 1700);
        [0.72, 0.44, 0.12].forEach((sc, k) => ctx.later(() => {
          if (!reduceMotion) me.animate([{ translate: "0 0" }, { translate: `${-kz * 0.18}px 0` }, { translate: "0 0" }], { duration: 220 }); // lean in, CHOMP
          cookie.style.transition = "transform .15s"; cookie.style.transform = `translate(-50%, -50%) scale(${sc})`;
          noise(0.08, "bandpass", 900, 500, 0.5); tone(120, 0.06, "square", 0.08);
          word(TEXT.chomp[k], false, cx, cy - kz * 0.6);
          for (let n = 0; n < 6 && !reduceMotion; n++) {
            const c = document.createElement("div");
            c.className = "ck-crumb";
            c.style.left = `${cx + kz * 0.25}px`; c.style.top = `${cy}px`;
            fx.appendChild(c);
            const a = Math.random() * Math.PI * 2, d = kz * (0.2 + Math.random() * 0.3);
            c.animate([{ transform: "translate(0,0)" }, { transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d + kz * 0.3}px)`, opacity: 0 }], { duration: 600, fill: "forwards" });
            ctx.later(() => c.remove(), 620);
          }
        }, 450 + k * 380));
        ctx.later(() => ctx.confetti(fx, cx, cy, { count: 30 }), 1600);
        if (hits >= GOAL) { done = true; ctx.win(); return; }
        ctx.pauseTimer(1800 + BEAT_MS);
        ctx.later(() => {
          st = S[++si];
          tone(98, 0.08, "square", 0.1); tone(98, 0.08, "square", 0.1, 0.16);
          showStep();
        }, 1900);
      }
      // It doesn't fit: it bounces back out onto the tray.
      function bounce(c) {
        missPips[missN].classList.add("x");
        missN++;
        const g = ls[st.gap];
        if (!reduceMotion) g.animate([{ transform: "none" }, { transform: "scale(1.3)" }, { transform: "none" }], { duration: 250 });
        sweep(300, 600, 0.12, "square", 0.08); sweep(600, 250, 0.2, "square", 0.08, 0.12); // boing-oing
        const gr = g.getBoundingClientRect(), tr = table.getBoundingClientRect();
        word(TEXT.nope, true, gr.left - tr.left + gr.width / 2, gr.top - tr.top - 30);
        if (missN >= MISSES) { done = true; ctx.lose(); showAnswer(); ctx.say(st.say); return; }
        ctx.later(() => { c.el.classList.remove("gone"); busy = false; }, 500);
      }
      function showAnswer() { const g = ls[st.gap]; g.classList.remove("hole"); g.classList.add("answer"); g.textContent = st.answer; }
      function word(text, bad, x, y) {
        const w = document.createElement("div");
        w.className = "ck-word" + (bad ? " bad" : "");
        w.textContent = text;
        w.style.left = `${Math.max(70, Math.min(W - 70, x))}px`; w.style.top = `${Math.max(24, y)}px`;
        fx.appendChild(w);
        ctx.later(() => w.remove(), 1000);
      }
      function replay() { if (!done && st.prompt) ctx.say(st.prompt); }

      ctx.onTimeout(() => { done = true; showAnswer(); ctx.say(st.say); });
      const ro = new ResizeObserver(layout);
      ro.observe(table);
      showStep();
      ctx.raf(frame);

      // Tutorial: drag the right chocolate into the hole, three times.
      ctx.tutorial(S.map((s) => s.target), async (f) => {
        for (let n = 0; n < GOAL && !done; n++) {
          await f.until(() => !busy && si === n, 5000);
          await f.point(cookie, 600);
          await f.drag(() => (chocs.find((c) => c.l === st.answer) || chocs[0]).el, () => ls[st.gap], 700);
          await f.until(() => hits > n || done, 3500);
        }
      });
      return () => { done = true; ro.disconnect(); if (drag && drag.ghost) drag.ghost.remove(); };
    },
  });
})();
