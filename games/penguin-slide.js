// PENGUIN SLIDE — a two-lane runner (Claude's idea, named by the teacher). A silly penguin belly-slides down an icy
// slope in one of two lanes; the card shows one target. Fish slide toward it in both lanes, all alike, each with a
// sign. Tap the top or bottom half (or swipe, or ↑ ↓) to switch lanes: catch the right fish (GULP!) and dodge the
// wrong ones (catch one and it turns into a stinky old boot: BLEH!, the penguin spins, ✕). Catch 4 to win; 3 boots
// lose. A missed fish just slides by (more come).
(function () {
  const TEXT = {
    name: { en: "Penguin Slide" },
    icon: "🐧",
    howTo: { en: {
      steps: [
        ["👀", "Look at the card."],
        ["🐧", "Tap the top or bottom to slide into that lane."],
        ["🐟", "Catch the fish that match the card. Dodge the wrong ones!"],
      ],
      tips: ["Catch 4 fish to win. A wrong fish is really a stinky boot! Three boots and it's over.", "Missed one? More are coming.", "Tap the card to hear it again."],
    } },
    instruction: { en: "CATCH THE\nFISH!" },
    cardLabel: "The card. Tap to hear it again.",
    gulp: ["GULP!", "YUM!", "FISHY!", "MMM!"],
    bleh: "BLEH!",
  };
  const GOAL = 4, MISSES = 3;

  const CSS = `
  .png { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:6px; padding-bottom:6px; }
  .png-top { flex:none; display:flex; align-items:center; gap:10px; }
  .png-card { padding:4px 16px; background:#fff; border:5px solid #111; border-radius:16px; box-shadow:0 5px 0 #111; font:inherit; color:#111; font-size:clamp(1.8rem, 8vw, 2.8rem);
    line-height:1.05; cursor:pointer; touch-action:manipulation; display:flex; align-items:center; gap:6px; white-space:nowrap; }
  .png-card .spk { font-size:.45em; }
  .png-pips { display:flex; flex-direction:column; gap:4px; }
  .png-row { display:flex; gap:4px; }
  .png-pip { width:22px; height:22px; border:3px solid #111; border-radius:50%; background:#fff; display:flex; align-items:center; justify-content:center; font-size:12px; line-height:1; }
  .png-pip.on { background:#8fd3ff; } .png-pip.on::after { content:"🐟"; }
  .png-pip.x.on { background:#a86a35; } .png-pip.x.on::after { content:"👢"; }
  .png-ice { position:relative; flex:1; min-height:0; width:100%; max-width:640px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111;
    background:linear-gradient(180deg, #bfe9ff 0 18%, #e9f8ff 18%); touch-action:none; cursor:pointer; }
  .png-hills { position:absolute; left:0; right:0; top:4%; height:18%; background:radial-gradient(ellipse 60px 40px at 50% 100%, #fff 0 98%, transparent 100%) 0 100% / 120px 100% repeat-x; opacity:.9; }
  .png-lane { position:absolute; left:0; right:0; height:var(--lh); margin-top:calc(var(--lh) / -2); background:repeating-linear-gradient(90deg, rgba(120,190,230,.25) 0 40px, transparent 40px 80px);
    border-top:3px dashed rgba(120,170,210,.7); border-bottom:3px dashed rgba(120,170,210,.7); }
  /* The penguin (--pz): lying on its tummy, sliding (black back, white tummy, orange beak and feet, googly eyes) */
  .png-pen { position:absolute; left:0; top:0; width:calc(var(--pz) * 1.4); height:var(--pz); z-index:4; pointer-events:none; transition:none; }
  .png-pen > * { position:absolute; box-sizing:border-box; }
  .png-back { left:4%; right:10%; top:22%; bottom:8%; background:#222; border:4px solid #111; border-radius:50% 60% 50% 46%; }
  .png-belly { left:12%; right:22%; top:50%; bottom:10%; background:#fff; border-radius:50%; z-index:1; }
  .png-head { right:0; top:6%; width:46%; height:72%; background:#222; border:4px solid #111; border-radius:50%; z-index:2; }
  .png-face { right:6%; top:18%; width:32%; height:50%; background:#fff; border-radius:50%; z-index:3; }
  .png-eye { top:24%; width:14%; aspect-ratio:1; background:#fff; border:3px solid #111; border-radius:50%; z-index:4; overflow:hidden; }
  .png-eye.l { right:24%; } .png-eye.r { right:8%; width:12%; top:28%; }
  .png-eye i { position:absolute; left:28%; top:30%; width:46%; aspect-ratio:1; background:#111; border-radius:50%; animation:png-roll 1s ease-in-out infinite alternate; }
  .png-beak { right:-12%; top:44%; width:22%; height:16%; background:#ff8a1f; border:3px solid #111; border-radius:20% 80% 80% 20%; z-index:4; }
  .png-pen.eat .png-beak { animation:png-chomp .1s ease-in-out 6 alternate; }
  .png-feet { left:-6%; top:40%; width:16%; height:30%; background:#ff8a1f; border:3px solid #111; border-radius:50% 10% 10% 50%; }
  .png-flip { left:30%; top:26%; width:30%; height:18%; background:#222; border:3px solid #111; border-radius:99px; z-index:2; transform-origin:0 50%; animation:png-flap .3s ease-in-out infinite alternate; }
  .png-spray { left:-30%; top:60%; width:30%; height:40%; background:radial-gradient(circle, #fff 0 30%, transparent 32%) 0 0 / 33% 50%; opacity:.9; animation:png-spray .2s linear infinite; }
  .png-pen.spin { animation:png-spin .6s ease-in-out; }
  /* A fish (--fz) with a sign; a wrong one becomes a boot when caught */
  .png-fish { position:absolute; left:0; top:0; width:var(--fz); height:var(--fz); z-index:3; pointer-events:none; }
  .png-body { position:absolute; left:6%; right:24%; top:24%; bottom:24%; background:#ff8fb8; border:4px solid #111; border-radius:50%; }
  .png-tail { position:absolute; right:2%; top:28%; width:28%; height:44%; background:#ff8fb8; border:4px solid #111; clip-path:polygon(0 50%, 100% 0, 100% 100%); }
  .png-feye { position:absolute; left:18%; top:36%; width:12%; aspect-ratio:1; background:#111; border-radius:50%; box-shadow:0 0 0 3px #fff; }
  .png-sign { position:absolute; left:46%; top:50%; transform:translate(-50%, -50%); padding:1px 5px; background:#fff; border:3px solid #111; border-radius:8px; font-weight:900; color:#111; line-height:1.1; white-space:nowrap; z-index:2; }
  .png-fish.right .png-sign { box-shadow:0 0 0 4px #fff, 0 0 0 8px #00b86b; }
  .png-fish.gone { opacity:0; transition:opacity .25s; }
  .png-fx { position:absolute; inset:0; pointer-events:none; z-index:8; overflow:visible; }
  .png-boot { position:absolute; line-height:1; pointer-events:none; }
  .png-word { position:absolute; transform:translate(-50%, -50%) rotate(-8deg); font-size:1.9rem; color:#3d8bfd; -webkit-text-stroke:2px #111; paint-order:stroke fill;
    text-shadow:0 4px 0 #111; white-space:nowrap; animation:png-word 1s ease-out forwards; }
  .png-word.bad { color:#a86a35; }
  @keyframes png-roll { from { transform:translate(-25%, -15%); } to { transform:translate(25%, 15%); } }
  @keyframes png-chomp { to { transform:scaleY(.4); } }
  @keyframes png-flap { from { transform:rotate(-20deg); } to { transform:rotate(20deg); } }
  @keyframes png-spray { to { background-position:-20px 0; } }
  @keyframes png-spin { to { rotate:360deg; } }
  @keyframes png-word { from { opacity:1; scale:.5; } 25% { scale:1.15; } 75% { opacity:1; } to { opacity:0; translate:0 -40px; } }
  @media (prefers-reduced-motion: reduce) { .png-eye i, .png-flip, .png-spray, .png-pen.spin, .png-word { animation:none !important; } }
  `;
  function injectCss() { if (document.getElementById("png-css")) return; const s = document.createElement("style"); s.id = "png-css"; s.textContent = CSS; document.head.appendChild(s); }

  registerMicrogame({
    id: "penguin-slide",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 22000,
    input: "tap",
    tutorial: true,

    start(ctx) {
      injectCss();
      const speed = ctx.speed || 1, pace = 0.6 + 0.4 * speed;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const { tone, sweep, noise } = ctx.sfx;
      const C = ctx.choiceRows(GOAL + 3, 3, { lowercase: true });
      let rowI = 0;
      const stream = [];
      function refill() {
        const row = C.rows[rowI++ % C.rows.length];
        stream.push(...ctx.shuffle([row.find((o) => o.right), ctx.pick(row.filter((o) => !o.right))]));
      }

      const wrap = document.createElement("div");
      wrap.className = "png";
      const top = document.createElement("div");
      top.className = "png-top";
      const card = document.createElement("button");
      card.className = "png-card";
      card.setAttribute("aria-label", TEXT.cardLabel);
      card.innerHTML = '<span class="ct"></span>';
      card.firstChild.textContent = C.listen ? C.target.text : C.cardText;
      if (ctx.canSpeak) card.insertAdjacentHTML("beforeend", '<span class="spk">🔊</span>');
      card.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); ctx.say(C.prompt); });
      const pips = document.createElement("div");
      pips.className = "png-pips";
      pips.innerHTML = `<div class="png-row hits">${'<span class="png-pip"></span>'.repeat(GOAL)}</div><div class="png-row">${'<span class="png-pip x"></span>'.repeat(MISSES)}</div>`;
      top.append(card, pips);
      const ice = document.createElement("div");
      ice.className = "png-ice";
      ice.innerHTML = '<div class="png-hills"></div><div class="png-lane a"></div><div class="png-lane b"></div>';
      const pen = document.createElement("div");
      pen.className = "png-pen";
      pen.innerHTML = '<div class="png-spray"></div><div class="png-feet"></div><div class="png-back"></div><div class="png-belly"></div><div class="png-flip"></div><div class="png-head"></div>' +
        '<div class="png-face"></div><div class="png-eye l"><i></i></div><div class="png-eye r"><i></i></div><div class="png-beak"></div>';
      const fx = document.createElement("div");
      fx.className = "png-fx";
      ice.append(pen, fx);
      wrap.append(top, ice);
      ctx.root.appendChild(wrap);
      const hitPips = pips.querySelector(".hits").children, missPips = pips.children[1].children;
      const lanes = ice.querySelectorAll(".png-lane");

      let W = 0, H = 0, pz = 60, fz = 70, px = 0, laneY = [0, 0];
      function layout() {
        W = ice.clientWidth; H = ice.clientHeight;
        pz = Math.max(46, Math.min(H * 0.17, W * 0.12, 84));
        fz = Math.max(56, Math.min(H * 0.22, W * 0.16, 100));
        laneY = [H * 0.42, H * 0.76]; px = W * 0.2;
        ice.style.setProperty("--pz", `${pz}px`); ice.style.setProperty("--fz", `${fz}px`); ice.style.setProperty("--lh", `${H * 0.26}px`);
        lanes[0].style.top = `${laneY[0]}px`; lanes[1].style.top = `${laneY[1]}px`;
      }

      // ---------- Switching lanes ----------
      let lane = 1, py = null;
      function go(l) {
        if (done || ctx.ended || l === lane) return;
        lane = l;
        sweep(l ? 700 : 400, l ? 400 : 700, 0.12, "triangle", 0.06);   // whee
      }
      let sy = null;
      ice.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        const r = ice.getBoundingClientRect();
        sy = e.clientY;
        go(e.clientY - r.top < (laneY[0] + laneY[1]) / 2 ? 0 : 1);
      });
      ice.addEventListener("pointermove", (e) => { if (sy == null) return; const dy = e.clientY - sy; if (Math.abs(dy) > 30) { go(dy < 0 ? 0 : 1); sy = null; } });
      ice.addEventListener("pointerup", () => { sy = null; });
      function onKey(e) {
        if (e.key === "ArrowUp") { e.preventDefault(); go(0); } else if (e.key === "ArrowDown") { e.preventDefault(); go(1); }
        else if (e.key === " ") { e.preventDefault(); ctx.say(C.prompt); }
      }
      document.addEventListener("keydown", onKey);

      // ---------- Fish ----------
      const fish = [];
      const cross = 2.8 / pace, gap = 1.3 / pace;
      function spawn() {
        if (!stream.length) refill();
        const o = stream.shift();
        const el = document.createElement("div");
        el.className = "png-fish";
        el.innerHTML = '<div class="png-tail"></div><div class="png-body"></div><div class="png-feye"></div><span class="png-sign"></span>';
        const sg = el.querySelector(".png-sign");
        sg.textContent = o.text;
        sg.style.fontSize = `${o.kind === "word" ? Math.min(fz * 0.34, (fz * 1.1) / ([...o.text].length * 0.62)) : fz * 0.38}px`;
        ice.insertBefore(el, pen);
        // Right fish come in the lane you're NOT in more often, so you have to move; wrong ones the lane you're in.
        const l = Math.random() < 0.7 ? (o.right ? 1 - lane : lane) : Math.floor(Math.random() * 2);
        fish.push({ o, el, x: W + fz, lane: l, judged: false });
      }

      let hits = 0, missN = 0, done = false, started = false, last = null, nextAt = 0, spin = 0;
      function frame(ts) {
        const dt = last == null ? 0 : Math.min(50, ts - last) / 1000;
        last = ts;
        const now = performance.now();
        const v = (W + fz - px) / cross;
        if (started && !done && now >= nextAt) { spawn(); nextAt = now + gap * 1000; }
        // The penguin glides to its lane.
        const want = laneY[lane] - pz / 2;
        py = py == null ? want : py + (want - py) * Math.min(1, dt * 12);
        pen.style.transform = `translate(${px - pz * 0.7}px, ${py}px)`;
        if (spin > 0) spin -= dt;
        for (let i = fish.length - 1; i >= 0; i--) {
          const f = fish[i];
          if (started && !done) f.x -= v * dt;
          f.el.style.transform = `translate(${f.x - fz / 2}px, ${laneY[f.lane] - fz / 2}px)`;
          if (!f.judged && f.x <= px + pz * 0.6) judge(f);
          if (f.x < -fz * 2) { f.el.remove(); fish.splice(i, 1); }
        }
        if (!ctx.ended || fish.length) ctx.raf(frame);
      }
      function judge(f) {
        f.judged = true;
        if (done || ctx.ended || f.lane !== lane || Math.abs(py - (laneY[lane] - pz / 2)) > pz * 0.6) return;   // (another lane, or still switching)
        f.el.classList.add("gone");
        if (f.o.right) gulp(f); else boot(f);
      }
      function gulp(f) {
        pen.classList.remove("eat"); void pen.offsetWidth; pen.classList.add("eat");
        [0, 0.1].forEach((t) => noise(0.05, "lowpass", 800, 300, 0.3, t)); tone(880, 0.08, "triangle", 0.1, 0.15);
        word(TEXT.gulp[hits % TEXT.gulp.length], false, px + pz, laneY[lane] - pz);
        if (f.o.kind === "pic") ctx.say(f.o.spoken);
        hitPips[hits].classList.add("on");
        hits++;
        if (hits >= GOAL) { done = true; ctx.win(); ctx.confetti(fx, px, laneY[lane] - pz, { count: 90 }); ctx.say(C.answer); }
      }
      // A wrong fish turns into a stinky old boot; the penguin spins.
      function boot(f) {
        const b = document.createElement("div");
        b.className = "png-boot"; b.textContent = "👢"; b.style.fontSize = `${fz * 0.6}px`;
        b.style.left = `${px}px`; b.style.top = `${laneY[lane] - fz * 0.4}px`;
        fx.appendChild(b);
        b.animate([{ transform: "scale(.4) rotate(0)" }, { transform: `translate(${-fz}px, ${-fz * 1.2}px) scale(1.2) rotate(-200deg)`, opacity: 0 }], { duration: 800, fill: "forwards" });
        ctx.later(() => b.remove(), 820);
        pen.classList.remove("spin"); void pen.offsetWidth; pen.classList.add("spin");
        sweep(400, 150, 0.4, "sawtooth", 0.08); noise(0.1, "lowpass", 500, 200, 0.3);   // BLEH
        word(TEXT.bleh, true, px + pz, laneY[lane] - pz);
        if (f.o.kind === "pic") ctx.say(f.o.spoken);
        missPips[missN].classList.add("on");
        missN++;
        if (missN >= MISSES) { done = true; ctx.lose(); ctx.later(() => ctx.say(C.answer), 400); }
      }
      function word(text, bad, x, y) {
        const w = document.createElement("div");
        w.className = "png-word" + (bad ? " bad" : "");
        w.textContent = text;
        w.style.left = `${Math.max(80, Math.min(W - 80, x))}px`; w.style.top = `${Math.max(26, y)}px`;
        fx.appendChild(w);
        ctx.later(() => w.remove(), 1000);
      }

      ctx.onTimeout(() => { done = true; fish.forEach((f) => { if (f.o.right && !f.judged) f.el.classList.add("right"); }); ctx.say(C.answer); });

      layout();
      const ro = new ResizeObserver(layout);
      ro.observe(ice);
      ctx.say(C.prompt);
      const rev = ctx.reveal(card);
      ctx.later(() => { started = true; nextAt = performance.now(); }, (rev || 0) + 200);
      ctx.raf(frame);

      // Tutorial: move into the lane of each right fish as it comes (and out of the way of wrong ones).
      ctx.tutorial(C.target, async (f) => {
        const laneAt = (l) => () => { const rr = ctx.root.getBoundingClientRect(), r = ice.getBoundingClientRect(); return { x: r.left - rr.left + W * 0.6, y: r.top - rr.top + laneY[l] }; };
        await f.point(card, 800);
        while (!done) {
          // The next fish that matters: the nearest unjudged one.
          const ok = await f.until(() => fish.some((x) => !x.judged && x.x - px < W * 0.5), 9000);
          if (!ok || done) break;
          const nx = fish.filter((x) => !x.judged).sort((a, b) => a.x - b.x)[0];
          const want = nx.o.right ? nx.lane : 1 - nx.lane;
          if (want !== lane) await f.tapNow(laneAt(want));
          await f.until(() => nx.judged || done, 4000);
        }
      });
      return () => { done = true; ro.disconnect(); document.removeEventListener("keydown", onKey); };
    },
  });
})();
