// FIND MY BABY! — a big capital-letter monster (A) is crying for its lowercase
// baby (a). Little lowercase babies wander around the bottom of the screen,
// sobbing. The player drags the right baby up to the monster.
//
// Right baby: it jumps into the monster's arms, hearts burst out, both stop crying.
// Wrong baby: the monster shakes its head, the baby is tossed back, and the
// real baby glows. Dropping a baby anywhere else just lets it go (no penalty).
// Tapping a baby makes it cry its letter name; tapping the monster repeats the prompt.
// Faster speeds add babies (5 at 1.5×, 6 at 2×) and make them wander faster.
(function () {
  const TEXT = {
    name: { en: "Find My Baby" },
    icon: "👶",
    // Practice mode's "How to play" card: steps (icon + sentence) and tips.
    howTo: { en: {
      steps: [
        ["😭", "A big capital-letter monster has lost its baby, like big M."],
        ["🔍", "Find its baby: the small letter that matches. Big M's baby is little m."],
        ["👆", "Drag the baby up to the big monster."],
      ],
      tips: [
        "Tap a baby to hear its letter. Tap the big monster to hear it again.",
        "Watch out for look-alikes, like m, n and w.",
        "Dropping a baby somewhere else is OK. Just try again.",
        "When the game speeds up, there are more babies and they move faster.",
      ],
    } },
    instruction: { en: "FIND MY BABY!" },
    prompt: (spoken) => `Where is my baby? ${spoken}!`,
    found: "My baby!",
    no: "No!",
    answer: (spoken) => `There! Little ${spoken}!`,
    monsterLabel: (spoken) => `Big ${spoken} is crying. Tap to hear it again.`,
    babyLabel: (spoken) => `Baby ${spoken}`,
  };

  const MONSTER_COLOR = "#b04dff";
  const BABY_COLORS = ["#ff2e3b", "#1e6bff", "#1fd65f", "#ff8a00", "#ff4fb3", "#00c2c7", "#ffd400"];

  const CSS = `
  .mb { position:absolute; inset:0; overflow:hidden; touch-action:none; }
  .mb-top { position:absolute; left:0; right:0; top:0; height:50%; display:flex; align-items:flex-end; justify-content:center; padding-bottom:2%; }
  .mb-ground { position:absolute; left:4%; right:4%; top:50%; bottom:2%; border-radius:28px;
    background:rgba(255,255,255,.22); border:4px dashed rgba(17,17,17,.25); }

  .mb-mon { --S:min(46vw, 27vh); position:relative; width:var(--S); height:var(--S); font-size:var(--S); cursor:pointer; touch-action:manipulation; }
  .mb-mon-body { position:absolute; inset:0; transform-origin:50% 90%; animation:mb-sob 1.1s ease-in-out infinite; }
  .mb-glyph { position:absolute; left:-50%; right:-50%; top:0; line-height:1; text-align:center; z-index:2;
    -webkit-text-stroke:.045em #111; paint-order:stroke fill; text-shadow:0 .035em 0 #111; user-select:none; }

  .mb-stalk { position:absolute; bottom:45%; width:.05em; height:.6em; margin-left:-.025em; background:#111; border-radius:.03em; z-index:1;
    transform-origin:50% 100%; }
  .mb-stalk.l { left:36%; transform:rotate(-14deg); }
  .mb-stalk.r { left:64%; transform:rotate(14deg); }
  .mb-eye { position:absolute; left:50%; top:-.11em; width:.22em; height:.22em; margin-left:-.11em; background:#fff;
    border:.025em solid #111; border-radius:50%; overflow:visible; }
  .mb-look { position:absolute; inset:0; transition:transform .1s linear; }
  .mb-pupil { position:absolute; left:50%; top:50%; width:44%; height:44%; margin:-22% 0 0 -22%; background:#111; border-radius:50%;
    animation:mb-search 2.4s ease-in-out infinite; }
  .mb-pupil::after { content:""; position:absolute; left:18%; top:16%; width:32%; height:32%; background:#fff; border-radius:50%; }
  .mb-brow { position:absolute; left:-10%; width:120%; top:-28%; height:18%; background:#111; border-radius:99px; }
  .mb-stalk.l .mb-brow { transform:rotate(22deg); }
  .mb-stalk.r .mb-brow { transform:rotate(-22deg); }
  .mb-tear { position:absolute; left:21.5%; top:4%; width:.09em; height:.12em; margin-left:-.045em; background:#5cc8ff;
    border:.012em solid #111; border-radius:50% 50% 50% 50% / 60% 60% 40% 40%; opacity:0; z-index:4; pointer-events:none;
    animation:mb-drip 1s ease-in infinite; }
  .mb-tear.r { left:78.5%; }
  .mb-tear.t2 { animation-delay:.5s; margin-left:-.005em; }

  .mb-mouth { position:absolute; left:50%; top:52%; width:.3em; height:.2em; margin-left:-.15em; z-index:3; background:#3a0010;
    border:.025em solid #111; border-radius:50% 50% 20% 20% / 90% 90% 10% 10%; overflow:hidden; animation:mb-wail .55s ease-in-out infinite alternate; }
  .mb-mouth::after { content:""; position:absolute; left:25%; right:25%; bottom:-10%; height:40%; background:#ff5c8a; border-radius:50% 50% 0 0; }
  .mb-feet { position:absolute; left:20%; right:20%; top:82%; height:.13em; display:flex; justify-content:space-between; z-index:1; }
  .mb-foot { width:.24em; height:.13em; background:${MONSTER_COLOR}; border:.025em solid #111; border-radius:50% 50% 30% 30%; box-shadow:0 .02em 0 #111; }

  .mb-bubble { position:absolute; left:100%; top:8%; z-index:4; font-size:.2em; padding:.15em .25em; background:#fff; border:.07em solid #111;
    border-radius:.5em; box-shadow:0 .08em 0 #111; line-height:1; animation:mb-bob .8s ease-in-out infinite alternate; white-space:nowrap; }

  .mb.near .mb-mon-body { animation:none; transform:scale(1.08); }
  .mb.near .mb-eye { transform:scale(1.25); }
  .mb.happy .mb-mon-body { animation:mb-jump .45s cubic-bezier(.2,1.8,.4,1) 3; }
  .mb.happy .mb-tear, .mb.happy .mb-bubble { display:none; }
  .mb.happy .mb-brow { top:-40%; transform:none !important; }
  .mb.happy .mb-pupil { animation:none; height:20%; margin-top:-10%; border-radius:99px 99px 0 0; }
  .mb.happy .mb-pupil::after { display:none; }
  .mb.happy .mb-mouth { animation:none; border-radius:15% 15% 50% 50% / 10% 10% 90% 90%; transform:scale(1.2); }
  .mb.nope .mb-mon-body { animation:mb-no .5s ease-in-out 2; }

  .mb-baby { --B:clamp(64px, 19vw, 96px); position:absolute; left:0; top:0; width:var(--B); height:var(--B); font-size:var(--B);
    margin:calc(var(--B) * -.5) 0 0 calc(var(--B) * -.5); cursor:grab; touch-action:none; z-index:5; will-change:transform; }
  .mb-baby .mb-baby-body { position:absolute; inset:0; animation:mb-wobble .5s ease-in-out infinite alternate; }
  .mb-baby .mb-glyph { -webkit-text-stroke:.07em #111; text-shadow:0 .05em 0 #111; top:-.08em; }
  .mb-baby .mb-stalk { bottom:55%; height:.42em; width:.06em; margin-left:-.03em; }
  .mb-baby .mb-stalk.l { left:40%; } .mb-baby .mb-stalk.r { left:60%; }
  .mb-baby .mb-eye { width:.24em; height:.24em; margin-left:-.12em; top:-.12em; border-width:.035em; }
  .mb-baby .mb-tear { left:30%; top:10%; width:.11em; height:.14em; margin-left:-.055em; border-width:.022em; animation-duration:.7s; }
  .mb-baby .mb-tear.r { left:70%; }
  .mb-baby .mb-tear.t2 { animation-delay:.35s; margin-left:-.03em; }
  .mb-baby .mb-mouth { top:50%; width:.2em; height:.14em; margin-left:-.1em; border-width:.03em; animation-duration:.35s; }
  .mb-baby.lifted { z-index:8; cursor:grabbing; }
  .mb-baby.lifted .mb-baby-body { animation:none; transform:scale(1.18) rotate(var(--tilt, 0deg)); filter:drop-shadow(0 12px 0 rgba(0,0,0,.3)); }
  .mb-baby.say .mb-baby-body { animation:mb-hop .4s cubic-bezier(.2,1.8,.4,1); }
  .mb-baby.home .mb-baby-body { animation:mb-jump .45s cubic-bezier(.2,1.8,.4,1) 3; }
  .mb-baby.home .mb-tear { display:none; }
  .mb-baby.home .mb-brow { top:-40%; transform:none !important; }
  .mb-baby.home .mb-mouth { animation:none; border-radius:15% 15% 50% 50% / 10% 10% 90% 90%; }
  .mb-baby.answer .mb-baby-body { animation:mb-glow .45s ease-in-out infinite alternate; }
  .mb-heart { position:absolute; z-index:9; pointer-events:none; font-size:34px; line-height:1; }

  @keyframes mb-sob    { 0%,100% { transform:scale(1, 1); } 30% { transform:scale(1.03, .95); } 45% { transform:scale(.98, 1.03); } }
  @keyframes mb-search { 0%,100% { transform:translate(-30%, 25%); } 25% { transform:translate(30%, 30%); } 50% { transform:translate(25%, -15%); } 75% { transform:translate(-25%, 10%); } }
  @keyframes mb-drip   { 0% { transform:translateY(0) scale(.5); opacity:0; } 15% { opacity:1; } 100% { transform:translateY(.5em) scale(1); opacity:0; } }
  @keyframes mb-wail   { from { transform:scale(1, .7); } to { transform:scale(1.1, 1.15); } }
  @keyframes mb-bob    { to { transform:translateY(-12%) rotate(4deg); } }
  @keyframes mb-jump   { 40% { transform:translateY(-14%) scale(1.06); } }
  @keyframes mb-no     { 25% { transform:rotate(-9deg); } 75% { transform:rotate(9deg); } }
  @keyframes mb-wobble { from { transform:rotate(-7deg) translateY(0); } to { transform:rotate(7deg) translateY(-4%); } }
  @keyframes mb-hop    { 40% { transform:translateY(-25%) scale(1.15); } }
  @keyframes mb-glow   { from { transform:scale(1); filter:drop-shadow(0 0 0 #fff); } to { transform:scale(1.2); filter:drop-shadow(0 0 10px #fff) drop-shadow(0 0 4px #fff); } }
  @media (prefers-reduced-motion: reduce) {
    .mb-mon-body, .mb-pupil, .mb-tear, .mb-mouth, .mb-bubble, .mb-baby .mb-baby-body { animation:none !important; }
    .mb-tear { opacity:1; }
  }`;

  function injectCss() {
    if (document.getElementById("mb-css")) return;
    const style = document.createElement("style");
    style.id = "mb-css";
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  // Eyes on stalks, sad brows, tears and a wailing mouth. Shared by the monster and the babies.
  const FACE = `
    <div class="mb-stalk l"><div class="mb-eye"><div class="mb-brow"></div><div class="mb-look"><div class="mb-pupil"></div></div></div></div>
    <div class="mb-stalk r"><div class="mb-eye"><div class="mb-brow"></div><div class="mb-look"><div class="mb-pupil"></div></div></div></div>
    <div class="mb-glyph"></div>
    <div class="mb-mouth"></div>
    <div class="mb-tear l"></div><div class="mb-tear l t2"></div><div class="mb-tear r"></div><div class="mb-tear r t2"></div>`;

  registerMicrogame({
    id: "find-my-baby",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter"],
    duration: 7000,
    input: "drag",
    tutorial: true, // has a ctx.tutorial script

    start(ctx) {
      injectCss();
      const speed = ctx.speed || 1;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const later = ctx.later;
      const { sweep, tone, noise } = ctx.sfx;
      let done = false;
      let drag = null;

      const target = ctx.items[0];
      const n = Math.min(speed >= 2 ? 6 : speed >= 1.5 ? 5 : 4, ctx.items.length);
      const options = ctx.shuffle(ctx.pickOptions(target, n));
      const spoken = (it) => it.say || it.text.toUpperCase(); // letter *names*: TTS reads "a" as "uh"
      const big = target.text.toUpperCase();

      // ---------- DOM ----------
      const wrap = document.createElement("div");
      wrap.className = "mb";
      wrap.innerHTML = `
        <div class="mb-ground"></div>
        <div class="mb-top">
          <div class="mb-mon" role="button" tabindex="0">
            <div class="mb-mon-body">
              ${FACE}
              <div class="mb-feet"><div class="mb-foot"></div><div class="mb-foot"></div></div>
              <div class="mb-bubble">👶❓</div>
            </div>
          </div>
        </div>`;
      const mon = wrap.querySelector(".mb-mon");
      const monGlyph = mon.querySelector(".mb-glyph");
      monGlyph.textContent = big;
      monGlyph.style.color = MONSTER_COLOR;
      mon.setAttribute("aria-label", TEXT.monsterLabel(spoken(target)));
      const monLooks = [...mon.querySelectorAll(".mb-look")];
      const ground = wrap.querySelector(".mb-ground");
      ctx.root.appendChild(wrap);
      ctx.later(() => ctx.hint(ground, mon, { noWord: true }), 80); // 👆 just the finger, from the babies up to the monster

      const colors = ctx.shuffle(BABY_COLORS.slice());
      const babies = options.map((item, i) => {
        const el = document.createElement("div");
        el.className = "mb-baby";
        el.setAttribute("role", "button");
        el.setAttribute("tabindex", "0");
        el.setAttribute("aria-label", TEXT.babyLabel(spoken(item)));
        el.innerHTML = `<div class="mb-baby-body">${FACE}</div>`;
        const g = el.querySelector(".mb-glyph");
        g.textContent = item.text.toLowerCase();
        g.style.color = colors[i % colors.length];
        el.querySelector(".mb-baby-body").style.animationDelay = `${-Math.random()}s`;
        wrap.appendChild(el);
        const b = { el, item, x: 0, y: 0, vx: 0, vy: 0, turn: 0, free: true };
        el.addEventListener("pointerdown", (e) => grab(e, b));
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerup", drop);
        el.addEventListener("pointercancel", cancel);
        el.addEventListener("lostpointercapture", cancel);
        el.addEventListener("keydown", (e) => {
          if ((e.key === "Enter" || e.key === " ") && !done) { e.preventDefault(); deliver(b); }
        });
        return b;
      });

      const replay = (e) => { if (e) e.preventDefault(); if (!done) ctx.say(TEXT.prompt(spoken(target))); };
      mon.addEventListener("pointerdown", replay);
      mon.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") replay(e); });
      ctx.say(TEXT.prompt(spoken(target)));

      // ---------- Geometry (px, relative to wrap) ----------
      function rel(el) {
        const w = wrap.getBoundingClientRect(), r = el.getBoundingClientRect();
        return { x: r.left - w.left, y: r.top - w.top, w: r.width, h: r.height };
      }
      function bounds() {
        const g = rel(ground), half = babies[0].el.offsetWidth * 0.5;
        return { x0: g.x + half, x1: g.x + g.w - half, y0: g.y + half + 10, y1: g.y + g.h - half };
      }
      function place(b) { b.el.style.transform = `translate(${b.x}px, ${b.y}px)`; }
      function overMonster(b) {
        const m = rel(mon), pad = m.w * 0.25;
        return b.x > m.x - pad && b.x < m.x + m.w + pad && b.y > m.y - pad && b.y < m.y + m.h + pad;
      }
      function lookAt(looks, x, y) {
        const w = wrap.getBoundingClientRect();
        looks.forEach((l) => {
          const r = l.getBoundingClientRect();
          const dx = x - (r.left - w.left + r.width / 2), dy = y - (r.top - w.top + r.height / 2);
          const len = Math.hypot(dx, dy) || 1, k = Math.min(1, len / 100) * 28;
          l.style.transform = `translate(${(dx / len) * k}%, ${(dy / len) * k}%)`;
        });
      }

      // Spread the babies over a grid of cells so nobody starts on top of anybody.
      const B0 = bounds();
      const cols = n <= 4 ? 2 : 3, rows = Math.ceil(n / cols);
      const cells = ctx.shuffle([...Array(cols * rows).keys()]);
      const baseSpeed = (reduceMotion ? 0 : 38) * speed; // px/s
      babies.forEach((b, i) => {
        const c = cells[i], cx = c % cols, cy = Math.floor(c / cols);
        b.x = B0.x0 + (B0.x1 - B0.x0) * ((cx + 0.3 + Math.random() * 0.4) / cols);
        b.y = B0.y0 + (B0.y1 - B0.y0) * ((cy + 0.3 + Math.random() * 0.4) / rows);
        const a = Math.random() * Math.PI * 2;
        b.vx = Math.cos(a) * baseSpeed;
        b.vy = Math.sin(a) * baseSpeed;
        place(b);
      });

      // ---------- Wandering ----------
      let last = performance.now();
      function step(now) {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        const B = bounds();
        const free = babies.filter((b) => b.free && b !== (drag && drag.b));
        free.forEach((b) => {
          b.turn -= dt;
          if (b.turn <= 0) { // amble off in a new direction now and then
            const a = Math.atan2(b.vy, b.vx) + (Math.random() - 0.5) * 2.2;
            b.vx = Math.cos(a) * baseSpeed;
            b.vy = Math.sin(a) * baseSpeed;
            b.turn = 0.8 + Math.random() * 1.4;
          }
          // Gentle push apart so the letters stay readable.
          free.forEach((o) => {
            if (o === b) return;
            const dx = b.x - o.x, dy = b.y - o.y, d = Math.hypot(dx, dy) || 1, min = b.el.offsetWidth * 1.15;
            if (d < min) { b.x += (dx / d) * (min - d) * 0.08; b.y += (dy / d) * (min - d) * 0.08; }
          });
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          if (b.x < B.x0) { b.x = B.x0; b.vx = Math.abs(b.vx); }
          if (b.x > B.x1) { b.x = B.x1; b.vx = -Math.abs(b.vx); }
          if (b.y < B.y0) { b.y = B.y0; b.vy = Math.abs(b.vy); }
          if (b.y > B.y1) { b.y = B.y1; b.vy = -Math.abs(b.vy); }
          place(b);
        });
        if (!done) ctx.raf(step);
      }
      ctx.raf(step);

      // Quiet baby sobs while the round is on.
      function sob() {
        if (done) return;
        const f = 520 + Math.random() * 200;
        sweep(f, f * 0.75, 0.22, "triangle", 0.035);
        sweep(f * 0.95, f * 0.7, 0.18, "triangle", 0.03, 0.26);
        later(sob, 900 + Math.random() * 700);
      }
      later(sob, 1300);

      // ---------- Dragging ----------
      function grab(e, b) {
        e.preventDefault();
        if (done || drag || ctx.ended || !b.free) return;
        try { b.el.setPointerCapture(e.pointerId); } catch (err) { /* capture is a nicety */ }
        const w = wrap.getBoundingClientRect();
        drag = { b, id: e.pointerId, ox: b.x - (e.clientX - w.left), oy: b.y - (e.clientY - w.top), sx: e.clientX, sy: e.clientY, moved: false };
        b.el.classList.add("lifted");
        sweep(600, 900, 0.08, "sine", 0.08);
      }
      function move(e) {
        if (!drag || e.pointerId !== drag.id || done) return;
        const w = wrap.getBoundingClientRect(), b = drag.b;
        if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 10) drag.moved = true;
        const nx = Math.max(0, Math.min(w.width, e.clientX - w.left + drag.ox));
        const ny = Math.max(0, Math.min(w.height, e.clientY - w.top + drag.oy));
        b.el.style.setProperty("--tilt", `${Math.max(-15, Math.min(15, (nx - b.x) * 1.5))}deg`);
        b.x = nx; b.y = ny;
        place(b);
        lookAt(monLooks, b.x, b.y);
        wrap.classList.toggle("near", overMonster(b));
      }
      function drop(e) {
        if (!drag || e.pointerId !== drag.id) return;
        const d = drag;
        drag = null;
        release(d.b);
        if (done) return;
        if (!d.moved) return cry(d.b);
        if (overMonster(d.b)) deliver(d.b);
      }
      function cancel(e) {
        if (!drag || e.pointerId !== drag.id) return;
        const d = drag;
        drag = null;
        release(d.b);
      }
      function release(b) {
        b.el.classList.remove("lifted");
        wrap.classList.remove("near");
        monLooks.forEach((l) => { l.style.transform = ""; });
      }
      function restartClass(el, cls, ms) {
        el.classList.remove(cls);
        void el.offsetWidth;
        el.classList.add(cls);
        later(() => el.classList.remove(cls), ms);
      }
      function cry(b) { // a tap: the baby hops and cries its own name
        restartClass(b.el, "say", 450);
        ctx.say(spoken(b.item));
      }

      // ---------- Reunion ----------
      function deliver(b) {
        if (done || ctx.ended) return;
        done = true;
        release(b);
        const m = rel(mon);
        if (b.item === target) {
          ctx.win();
          b.free = false;
          const tx = m.x + m.w * 1.02, ty = m.y + m.h * 0.78; // tucked in beside the big letter
          glide(b, tx, ty, 260, 0.75);
          wrap.classList.add("happy");
          later(() => {
            b.el.classList.add("home");
            hugSound();
            hearts(tx - m.w * 0.4, m.y + m.h * 0.3);
            ctx.confetti(wrap, m.x + m.w / 2, m.y + m.h * 0.3, { count: 40 });
            ctx.say(TEXT.found);
          }, 260);
        } else {
          ctx.lose();
          wrap.classList.add("nope");
          noSound();
          ctx.say(TEXT.no);
          // Toss the stranger back down, then point out the real baby.
          const B = bounds();
          glide(b, B.x0 + Math.random() * (B.x1 - B.x0), B.y0 + (B.y1 - B.y0) * (0.4 + Math.random() * 0.6), 500, 1);
          later(revealAnswer, 650);
        }
      }
      function revealAnswer() {
        const real = babies.find((x) => x.item === target);
        real.free = false;
        real.el.classList.add("answer");
        lookAt(monLooks, real.x, real.y);
        ctx.say(TEXT.answer(spoken(target)));
      }
      function glide(b, tx, ty, ms, scale) {
        const fx = b.x, fy = b.y;
        b.x = tx; b.y = ty;
        b.el.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
        if (reduceMotion) return;
        const hop = Math.min(fy, ty) - 80;
        b.el.animate([
          { transform: `translate(${fx}px, ${fy}px) scale(1.1)` },
          { transform: `translate(${(fx + tx) / 2}px, ${hop}px) scale(${(1.1 + scale) / 2}) rotate(180deg)`, offset: 0.5 },
          { transform: `translate(${tx}px, ${ty}px) scale(${scale}) rotate(360deg)` },
        ], { duration: ms, easing: "ease-out" });
      }

      ctx.onTimeout(() => {
        done = true;
        if (drag) { const d = drag; drag = null; release(d.b); }
        wrap.classList.add("nope");
        revealAnswer();
      });

      function hearts(x, y) {
        if (reduceMotion) return;
        for (let i = 0; i < 8; i++) {
          const h = document.createElement("div");
          h.className = "mb-heart";
          h.textContent = i % 3 ? "❤️" : "💖";
          h.style.left = x + "px";
          h.style.top = y + "px";
          wrap.appendChild(h);
          const dx = (Math.random() - 0.5) * 220, dy = -90 - Math.random() * 120;
          h.animate([
            { transform: "translate(-50%, -50%) scale(.3)", opacity: 1 },
            { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1.2) rotate(${dx / 6}deg)`, opacity: 0 },
          ], { duration: 900 + Math.random() * 400, delay: i * 50, easing: "cubic-bezier(.2,.7,.4,1)", fill: "both" });
        }
      }

      // ---------- Sound effects ----------
      const hugSound = () => { [523, 659, 784].forEach((f, i) => tone(f, 0.16, "triangle", 0.12, i * 0.09)); sweep(784, 1175, 0.3, "sine", 0.15, 0.28); };
      const noSound = () => { tone(200, 0.16, "square", 0.12); tone(150, 0.25, "square", 0.12, 0.18); noise(0.15, "lowpass", 900, 200, 0.2); };


      // Tutorial: point at the big monster's letter, then drag the right baby up to it.
      ctx.tutorial(target, async (f) => {
        await f.point(mon);
        await f.drag(babies.find((b) => b.item === target).el, mon, 1100);
      });

      return function cleanup() {
        done = true;
        drag = null;
      };
    },
  });
})();
