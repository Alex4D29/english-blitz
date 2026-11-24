// BRIDGE BUILDER — a gap game (the teacher's idea; Core.gapSteps). Your character stands on a riverbank; a
// bridge of letter planks spells the word across the water, one plank missing. The far bank's sign shows
// the picture. Drag the right plank from the pile into the gap (or just tap it): it slots in and your
// character trots across, then a beat and the next river. A wrong plank cracks and your character falls in:
// SPLASH (✕), and climbs back. 3 crossings win; 3 splashes and you lose.
(function () {
  const TEXT = {
    name: { en: "Bridge Builder" },
    icon: "🌉",
    howTo: { en: {
      steps: [
        ["🌉", "The bridge spells a word, but one plank is missing!"],
        ["👂", "Look at the picture and listen to the word."],
        ["👆", "Drag the plank that fixes the word into the gap (or tap it). Cross 3 rivers!"],
      ],
      tips: ["A wrong plank cracks, SPLASH! 3 splashes and it's over.", "Sight words show the whole word first: watch which letter flies out!"],
    } },
    instruction: { en: "BUILD THE\nBRIDGE!" },
    across: ["MADE IT!", "HOORAY!", "ACROSS!"],
    splash: "SPLASH!",
    missing: "What's missing?",
  };
  const GOAL = 3, MISSES = 3, BEAT_MS = 900;

  const CSS = `
  .bd { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:6px; padding-bottom:6px; }
  .bd-top { flex:none; display:flex; gap:10px; }
  .bd-pips { display:flex; gap:4px; }
  .bd-pip { width:24px; height:24px; border:3px solid #111; border-radius:50%; background:#fff; display:flex; align-items:center; justify-content:center; font-size:13px; line-height:1; }
  .bd-pip.on { background:#ffd400; } .bd-pip.on::after { content:"🌉"; } .bd-pip.x { background:#5ec8ff; } .bd-pip.x::after { content:"💦"; }
  .bd-scene { position:relative; flex:1; min-height:0; width:100%; max-width:600px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111;
    background:linear-gradient(#8fd8ff 0 40%, #6cc04a 40%); touch-action:none; }
  .bd-river { position:absolute; left:var(--rl); right:var(--rl); top:40%; bottom:0; background:repeating-linear-gradient(180deg, #2f8fe0 0 20px, #3a9cf0 20px 40px); border-left:6px solid #3d8a2a;
    border-right:6px solid #3d8a2a; animation:bd-flow 1s linear infinite; }
  .bd-sign { position:absolute; right:3%; top:16%; padding:4px 10px; background:#f4d28a; border:4px solid #111; border-radius:10px; font-size:calc(var(--pz) * .9); line-height:1; z-index:2; }
  .bd-sign::after { content:""; position:absolute; left:45%; top:100%; width:10%; height:60%; background:#6b4a1f; border:3px solid #111; z-index:-1; }
  .bd-bridge { position:absolute; left:var(--rl); right:var(--rl); top:calc(40% - var(--pz) * .5); height:var(--pz); display:flex; z-index:2; }
  .bd-plank { flex:1; height:100%; margin:0 -2px; display:flex; align-items:center; justify-content:center; background:linear-gradient(#c98a4b, #a86d34); border:4px solid #111; border-radius:6px;
    font-size:calc(var(--pz) * .6); font-weight:900; color:#fff; -webkit-text-stroke:1.5px #111; paint-order:stroke fill; line-height:1; }
  .bd-plank.gap { background:transparent; border-style:dashed; border-color:#fff; color:transparent; -webkit-text-stroke:0; animation:bd-gap .5s ease-in-out infinite alternate; }
  .bd-plank.gap.hot { background:rgba(255,230,120,.5); }
  .bd-plank.answer { box-shadow:0 0 0 5px #ffd400, 0 0 18px 8px #ffd400; }
  .bd-me { position:absolute; left:0; top:0; z-index:3; pointer-events:none; }
  .bd-me .ms { margin:calc(var(--mez) * -1) 0 0 calc(var(--mez) * -.5); }
  /* The pile of planks to choose from */
  .bd-pile { flex:none; display:flex; gap:10px; justify-content:center; padding:0 8px; min-height:66px; }
  .bd-pick { width:84px; height:58px; display:flex; align-items:center; justify-content:center; background:linear-gradient(#c98a4b, #a86d34); border:5px solid #111; border-radius:10px;
    box-shadow:0 5px 0 #111; font-size:2rem; font-weight:900; color:#fff; -webkit-text-stroke:1.5px #111; paint-order:stroke fill; line-height:1; touch-action:none; cursor:grab; }
  .bd-pick.drag { position:fixed; z-index:200; pointer-events:none; box-shadow:0 12px 0 rgba(0,0,0,.4); }
  .bd-pick.gone { visibility:hidden; }
  .bd-fx { position:absolute; inset:0; pointer-events:none; z-index:8; overflow:visible; }
  .bd-word { position:absolute; transform:translate(-50%, -50%) rotate(-8deg); font-size:2rem; color:#ffd400; -webkit-text-stroke:2px #111; paint-order:stroke fill; text-shadow:0 4px 0 #111;
    white-space:nowrap; animation:bd-word 1s ease-out forwards; }
  .bd-word.bad { color:#5ec8ff; }
  .bd-drop { position:absolute; width:12px; height:12px; margin:-6px 0 0 -6px; background:#bfe6ff; border:2px solid #111; border-radius:50%; }
  @keyframes bd-flow { to { background-position:0 40px; } }
  @keyframes bd-gap { to { border-color:#ffd400; } }
  @keyframes bd-word { from { opacity:1; scale:.5; } 25% { scale:1.15; } 75% { opacity:1; } to { opacity:0; translate:0 -40px; } }
  @media (prefers-reduced-motion: reduce) { .bd-river, .bd-plank.gap, .bd-word { animation:none !important; } }
  `;
  function injectCss() { if (document.getElementById("bd-css")) return; const s = document.createElement("style"); s.id = "bd-css"; s.textContent = CSS; document.head.appendChild(s); }

  registerMicrogame({
    id: "bridge-builder",
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
      const speed = ctx.speed || 1;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const { tone, sweep, noise } = ctx.sfx;
      const N = speed >= 1.75 ? 4 : 3;
      const S = ctx.gapSteps(GOAL, N, { lowercase: true });
      let si = 0, st = S[0], hits = 0, missN = 0, done = false, busy = true;

      const wrap = document.createElement("div");
      wrap.className = "bd";
      wrap.innerHTML = `<div class="bd-top"><div class="bd-pips hits">${'<span class="bd-pip"></span>'.repeat(GOAL)}</div><div class="bd-pips miss">${'<span class="bd-pip"></span>'.repeat(MISSES)}</div></div>` +
        '<div class="bd-scene"><div class="bd-river"></div><div class="bd-sign"></div><div class="bd-bridge"></div><div class="bd-me"></div><div class="bd-fx"></div></div><div class="bd-pile"></div>';
      ctx.root.appendChild(wrap);
      const scene = wrap.querySelector(".bd-scene"), bridge = wrap.querySelector(".bd-bridge"), sign = wrap.querySelector(".bd-sign"), meBox = wrap.querySelector(".bd-me");
      const pile = wrap.querySelector(".bd-pile"), fx = wrap.querySelector(".bd-fx");
      const hitPips = wrap.querySelector(".hits").children, missPips = wrap.querySelector(".miss").children;
      sign.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });
      const me = window.Mascot.el("var(--mez)");
      meBox.appendChild(me);

      let W = 0, H = 0, rl = 60, pz = 50;
      function layout() {
        W = scene.clientWidth; H = scene.clientHeight;
        rl = Math.max(50, W * 0.16);
        pz = Math.max(34, Math.min((W - rl * 2) / (st.cells.length + 0.3), H * 0.2, 80));
        scene.style.setProperty("--rl", `${rl}px`); scene.style.setProperty("--pz", `${pz}px`);
        scene.style.setProperty("--mez", `${Math.max(50, Math.min(rl * 1.1, H * 0.3, 100))}px`);
        if (!walking) placeMe(rl * 0.55);
      }
      let walking = false;
      const placeMe = (x, y) => { meBox.style.transform = `translate(${x}px, ${y != null ? y : H * 0.4 - pz * 0.5}px)`; };

      let planks = [], picks = [];
      function showStep() {
        bridge.innerHTML = "";
        planks = st.cells.map((l) => {
          const p = document.createElement("div");
          p.className = "bd-plank";
          p.textContent = l;
          bridge.appendChild(p);
          return p;
        });
        sign.textContent = st.pic || (st.kind === "letter" ? "❓" : "🔊");
        window.Mascot.mood(me, null);
        walking = false;
        layout();
        pile.innerHTML = "";
        picks = st.options.map((l) => {
          const b = document.createElement("div");
          b.className = "bd-pick";
          b.textContent = l;
          b.addEventListener("pointerdown", (e) => startDrag(e, b, l));
          pile.appendChild(b);
          return { b, l };
        });
        busy = true;
        const openGap = () => { planks[st.gap].classList.add("gap"); busy = false; };
        if (st.showFirst) {
          ctx.pauseTimer(1500);
          ctx.later(() => {
            if (!reduceMotion) planks[st.gap].animate([{ transform: "none" }, { transform: "translateY(160%) rotate(30deg)", opacity: 0.2 }, { transform: "none", opacity: 1 }], { duration: 460 });
            sweep(600, 1400, 0.25, "triangle", 0.07);
            ctx.later(openGap, 300);
          }, 1050);
        } else openGap();
        if (st.prompt) ctx.say(st.prompt); else if (si === 0) ctx.say(TEXT.missing);
      }

      // ---------- Dragging a plank (a tap counts too) ----------
      let drag = null;
      function startDrag(e, b, l) {
        e.preventDefault();
        if (done || busy || ctx.ended || drag) return;
        const r = b.getBoundingClientRect();
        drag = { b, l, id: e.pointerId, x0: e.clientX, y0: e.clientY, dx: e.clientX - r.left, dy: e.clientY - r.top, moved: false, ghost: null };
        try { b.setPointerCapture(e.pointerId); } catch (err) { /* ok */ }
      }
      function moveDrag(e) {
        if (!drag || e.pointerId !== drag.id) return;
        if (!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 8) {
          drag.moved = true;
          drag.ghost = drag.b.cloneNode(true);
          drag.ghost.classList.add("drag");
          document.body.appendChild(drag.ghost);
          drag.b.classList.add("gone");
        }
        if (drag.ghost) {
          drag.ghost.style.left = `${e.clientX - drag.dx}px`; drag.ghost.style.top = `${e.clientY - drag.dy}px`;
          planks[st.gap].classList.toggle("hot", overGap(e.clientX, e.clientY));
        }
      }
      function endDrag(e) {
        if (!drag || e.pointerId !== drag.id) return;
        const d = drag; drag = null;
        if (d.ghost) d.ghost.remove();
        planks[st.gap].classList.remove("hot");
        if (!d.moved || overGap(e.clientX, e.clientY)) choose(d.b, d.l);
        else d.b.classList.remove("gone"); // dropped somewhere else: back to the pile
      }
      const overGap = (x, y) => { const g = planks[st.gap].getBoundingClientRect(); return x > g.left - 40 && x < g.right + 40 && y > g.top - 60 && y < g.bottom + 60; };
      pile.addEventListener("pointermove", moveDrag);
      pile.addEventListener("pointerup", endDrag);
      pile.addEventListener("pointercancel", (e) => { if (drag && e.pointerId === drag.id) { if (drag.ghost) drag.ghost.remove(); drag.b.classList.remove("gone"); drag = null; } });

      function choose(b, l) {
        if (done || busy || ctx.ended) return;
        busy = true;
        b.classList.add("gone");
        const g = planks[st.gap];
        g.classList.remove("gap");
        g.textContent = l;
        tone(220, 0.08, "square", 0.1); // clunk
        if (l === st.answer) cross(); else crack(b);
      }
      // Your character trots across.
      function cross() {
        hitPips[hits].classList.add("on");
        hits++;
        ctx.say(st.say);
        walking = true;
        window.Mascot.mood(me, "cheer");
        const y = H * 0.4 - pz * 0.5;
        if (!reduceMotion) meBox.animate([{ transform: `translate(${rl * 0.55}px, ${y}px)` }, { transform: `translate(${W - rl * 0.55}px, ${y}px)` }], { duration: 900, easing: "ease-in-out", fill: "forwards" });
        for (let k = 0; k < 6; k++) tone(500 + k * 60, 0.05, "square", 0.05, k * 0.14); // patter
        ctx.later(() => { word(TEXT.across[(hits - 1) % TEXT.across.length], false, W - rl, H * 0.25); ctx.confetti(fx, W - rl * 0.6, H * 0.3, { count: 40 }); }, 900);
        if (hits >= GOAL) { done = true; ctx.win(); return; }
        ctx.pauseTimer(1400 + BEAT_MS);
        ctx.later(() => {
          meBox.getAnimations().forEach((a) => a.cancel());
          st = S[++si];
          tone(98, 0.08, "square", 0.1); tone(98, 0.08, "square", 0.1, 0.16);
          showStep();
        }, 1500);
      }
      // CRACK… SPLASH: your character falls in, climbs back out.
      function crack(b) {
        missPips[missN].classList.add("x");
        missN++;
        const g = planks[st.gap];
        const y = H * 0.4 - pz * 0.5, gx = g.getBoundingClientRect().left - scene.getBoundingClientRect().left + g.clientWidth / 2;
        noise(0.15, "highpass", 2000, 3000, 0.4); // crack
        walking = true;
        if (!reduceMotion) {
          meBox.animate([{ transform: `translate(${rl * 0.55}px, ${y}px)` }, { transform: `translate(${gx}px, ${y}px)`, offset: 0.5 }, { transform: `translate(${gx}px, ${H * 0.75}px)` }], { duration: 700, easing: "ease-in", fill: "forwards" });
          g.animate([{ transform: "none" }, { transform: "translateY(300%) rotate(60deg)", opacity: 0 }], { duration: 600, delay: 300, fill: "forwards" });
        }
        ctx.later(() => {
          noise(0.5, "lowpass", 1400, 200, 0.6); sweep(500, 150, 0.4, "sine", 0.1); // SPLASH
          window.Mascot.mood(me, "sad");
          word(TEXT.splash, true, gx, H * 0.55);
          for (let k = 0; k < 10 && !reduceMotion; k++) {
            const d = document.createElement("div"); d.className = "bd-drop";
            d.style.left = `${gx}px`; d.style.top = `${H * 0.7}px`;
            fx.appendChild(d);
            const a = Math.PI + (k / 9) * Math.PI;
            d.animate([{ transform: "translate(0,0)" }, { transform: `translate(${Math.cos(a) * 80}px, ${Math.sin(a) * 80}px)`, opacity: 0 }], { duration: 600, fill: "forwards" });
            ctx.later(() => d.remove(), 620);
          }
        }, 700);
        if (missN >= MISSES) { ctx.later(() => { done = true; ctx.lose(); showAnswer(); ctx.say(st.say); }, 750); return; }
        ctx.later(() => {
          meBox.getAnimations().forEach((a) => a.cancel());
          g.getAnimations().forEach((a) => a.cancel());
          walking = false;
          placeMe(rl * 0.55);
          window.Mascot.mood(me, null);
          g.textContent = "";
          g.classList.add("gap");
          b.classList.remove("gone");
          busy = false;
        }, 1500);
      }
      function showAnswer() { const g = planks[st.gap]; g.getAnimations().forEach((a) => a.cancel()); g.classList.remove("gap"); g.classList.add("answer"); g.textContent = st.answer; }
      function word(text, bad, x, y) {
        const w = document.createElement("div");
        w.className = "bd-word" + (bad ? " bad" : "");
        w.textContent = text;
        w.style.left = `${Math.max(60, Math.min(W - 60, x))}px`; w.style.top = `${y}px`;
        fx.appendChild(w);
        ctx.later(() => w.remove(), 1000);
      }
      function replay() { if (!done && st.prompt) ctx.say(st.prompt); }

      ctx.onTimeout(() => { done = true; showAnswer(); window.Mascot.mood(me, "sad"); ctx.say(st.say); });
      const ro = new ResizeObserver(layout);
      ro.observe(scene);
      showStep();

      // Tutorial: drag the right plank into the gap, three times.
      ctx.tutorial(S.map((s) => s.target), async (f) => {
        for (let n = 0; n < GOAL && !done; n++) {
          await f.until(() => !busy && si === n, 5000);
          await f.point(bridge, 600);
          await f.drag(() => (picks.find((p) => p.l === st.answer) || picks[0]).b, () => planks[st.gap], 700);
          await f.until(() => hits > n || done, 3000);
        }
      });
      return () => { done = true; ro.disconnect(); if (drag && drag.ghost) drag.ghost.remove(); };
    },
  });
})();
