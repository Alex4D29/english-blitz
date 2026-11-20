// CLEAN THE ROOM! — lowercase letters are scattered over a messy bedroom
// floor, and a cardboard box with a capital letter on it (A) is waiting.
// Something with googly eyes lives in the box. Drag every little a into box A.
// From 1.5× there are two boxes, usually look-alikes (B and D), and the letters
// have to be sorted.
//
// Right letter: it drops into the box, which gulps it down and says its name.
// When every box is full, a broom sweeps the leftover letters off the floor.
// Wrong letter: the box goes "BLEH!" and spits it back onto the floor. That
// only costs time. Dropping a letter anywhere else just puts it down.
// Tap a letter to hear its name; tap a box to hear its letter.
// Letters lie at small tilts only, never more than 18°, so b/d/p/q stay themselves.
(function () {
  const TEXT = {
    name: { en: "Clean the Room" },
    icon: "📦",
    howTo: { en: {
      steps: [
        ["📦", "Look at the big letter on the box, like A."],
        ["🔍", "Find the small letters that match it on the floor. Big A takes little a."],
        ["👆", "Drag every one into the box!"],
      ],
      tips: [
        "Tap a letter to hear its name. Tap the box to hear its letter.",
        "The dots on the box show how many letters are left.",
        "A wrong letter gets spat back out. Just try again!",
        "When the game speeds up, there are two boxes. Put each letter in the right one.",
      ],
    } },
    instruction: { en: "CLEAN THE\nROOM!" },
    prompt: (names) => names.join(" and "),
    boxLabel: (spoken) => `Box ${spoken}. Tap to hear it.`,
    letterLabel: (spoken) => `Little ${spoken}`,
    bleh: "BLEH!",
  };

  const BOX_INK = ["#1e6bff", "#ff2e88"];
  // No blue or pink: those are the box colors, and a matching color would hint at a box.
  const LETTER_COLORS = ["#ff2e3b", "#1fd65f", "#ff8a00", "#b04dff", "#00c2c7", "#ffd400", "#8ee000"];

  const CSS = `
  .cr { position:absolute; inset:0; overflow:hidden; touch-action:none; }
  .cr-wall { position:absolute; left:0; right:0; top:0; height:36%;
    background:repeating-linear-gradient(90deg, #ffe9a8 0 22px, #fff3c9 22px 44px); border-bottom:5px solid #111; }
  .cr-window { position:absolute; left:6%; top:12%; width:18%; aspect-ratio:1; max-width:90px; background:#8fd8ff; border:5px solid #111; border-radius:8px;
    box-shadow:inset 0 0 0 4px #fff; }
  .cr-window::before, .cr-window::after { content:""; position:absolute; background:#111; }
  .cr-window::before { left:50%; top:0; bottom:0; width:4px; margin-left:-2px; }
  .cr-window::after { top:50%; left:0; right:0; height:4px; margin-top:-2px; }
  .cr-floor { position:absolute; left:0; right:0; top:36%; bottom:0;
    background:repeating-linear-gradient(0deg, #d9925a 0 34px, #c98247 34px 37px); }
  .cr-rug { position:absolute; left:8%; right:8%; top:48%; bottom:5%; border-radius:50%; background:#ff9ec7; border:5px solid #111;
    box-shadow:inset 0 0 0 10px #ffc4dd; opacity:.85; }

  .cr-boxes { position:absolute; left:0; right:0; top:3%; height:42%; display:flex; align-items:flex-end; justify-content:space-evenly; pointer-events:none; }
  .cr-box { --W:min(40vw, 24vh); position:relative; width:var(--W); height:calc(var(--W) * .8); pointer-events:auto; cursor:pointer;
    touch-action:manipulation; transform-origin:50% 100%; }
  .cr.two .cr-box { --W:min(36vw, 21vh); }
  .cr-back { position:absolute; left:6%; right:6%; top:-2%; height:30%; background:#a8652c; border:5px solid #111; border-radius:6px 6px 0 0; }
  .cr-hole { position:absolute; left:3%; right:3%; top:14%; height:16%; background:#2a1405; border:5px solid #111; border-radius:8px; overflow:hidden; }
  .cr-eyes { position:absolute; left:50%; top:50%; transform:translate(-50%, -50%); display:flex; gap:12%; width:56%; justify-content:center; }
  .cr-eye { position:relative; width:calc(var(--W) * .13); height:calc(var(--W) * .13); flex:none; background:#fff; border:3px solid #111; border-radius:50%;
    animation:cr-blink 3.2s infinite; }
  .cr-eye::after { content:""; position:absolute; left:28%; top:28%; width:46%; height:46%; background:#111; border-radius:50%;
    transform:translate(var(--px, 0), var(--py, 0)); transition:transform .1s linear; }
  .cr-flap { position:absolute; top:12%; width:42%; height:22%; background:#e0a466; border:5px solid #111; }
  .cr-flap.l { left:-22%; transform:rotate(-24deg); transform-origin:100% 100%; border-radius:8px 0 0 8px; }
  .cr-flap.r { right:-22%; transform:rotate(24deg); transform-origin:0 100%; border-radius:0 8px 8px 0; }
  .cr-front { position:absolute; left:0; right:0; top:26%; bottom:0; background:#d4914d; border:5px solid #111; border-radius:4px 4px 10px 10px;
    box-shadow:inset 0 -10px 0 rgba(0,0,0,.15), 0 6px 0 rgba(0,0,0,.25); display:flex; flex-direction:column; align-items:center; justify-content:center; }
  .cr-front::before { content:""; position:absolute; left:42%; right:42%; top:-5px; height:30%; background:rgba(255,255,255,.35); border-radius:0 0 3px 3px; }
  .cr-big { position:relative; font-size:calc(var(--W) * .4); line-height:1; color:var(--bc); -webkit-text-stroke:4px #111; paint-order:stroke fill;
    text-shadow:0 4px 0 #111; user-select:none; }
  .cr-pips { display:flex; gap:5px; margin-top:4px; }
  .cr-pip { width:12px; height:12px; border-radius:50%; border:3px solid #111; background:#fff; }
  .cr-pip.on { background:#1fd65f; animation:cr-pop .3s cubic-bezier(.2,1.8,.4,1); }
  .cr-bubble { position:absolute; left:50%; bottom:100%; transform:translate(-50%, -10%); padding:4px 10px; background:#fff; border:4px solid #111;
    border-radius:14px; box-shadow:0 4px 0 #111; font-size:1.2rem; white-space:nowrap; opacity:0; pointer-events:none; }

  .cr-box.near { transform:scale(1.1); }
  .cr-box.near .cr-hole { top:10%; height:24%; }
  .cr-box.gulp { animation:cr-gulp .4s cubic-bezier(.2,1.6,.4,1); }
  .cr-box.gulp .cr-eye { animation:none; height:calc(var(--W) * .05); border-radius:99px 99px 0 0; margin-top:calc(var(--W) * .04); }
  .cr-box.gulp .cr-eye::after { display:none; }
  .cr-box.bleh { animation:cr-bleh .45s ease-in-out; }
  .cr-box.bleh .cr-hole { background:#7a0f1f; }
  .cr-box.bleh .cr-bubble { animation:cr-bub .8s ease-out; }
  .cr-box.done .cr-hole { height:8%; top:22%; }
  .cr-box.done .cr-eyes { opacity:0; }
  .cr-box.done .cr-flap.l { transform:rotate(-4deg); }
  .cr-box.done .cr-flap.r { transform:rotate(4deg); }
  .cr-box.done { animation:cr-gulp .45s cubic-bezier(.2,1.6,.4,1) 2; }

  .cr-let { --L:clamp(58px, 17vw, 88px); position:absolute; left:0; top:0; width:var(--L); height:var(--L); margin:calc(var(--L) * -.5) 0 0 calc(var(--L) * -.5);
    cursor:grab; touch-action:none; z-index:5; will-change:transform; }
  .cr-let::before { content:""; position:absolute; left:14%; right:14%; bottom:2%; height:14%; border-radius:50%; background:rgba(0,0,0,.22); }
  .cr-glyph { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:calc(var(--L) * .95); line-height:1;
    padding-bottom:12%; color:var(--c); -webkit-text-stroke:5px #111; paint-order:stroke fill; text-shadow:0 5px 0 #111; user-select:none;
    transform:rotate(var(--rot, 0deg)); transition:transform .12s ease-out; }
  .cr-let.lifted { z-index:9; cursor:grabbing; }
  .cr-let.lifted::before { transform:translateY(18px) scale(.8); opacity:.6; }
  .cr-let.lifted .cr-glyph { transform:scale(1.2) rotate(var(--tilt, 0deg)); }
  .cr-let.say .cr-glyph { animation:cr-hop .4s cubic-bezier(.2,1.8,.4,1); }
  .cr-let.answer .cr-glyph { animation:cr-glow .45s ease-in-out infinite alternate; }
  .cr-let.gone { visibility:hidden; pointer-events:none; }
  .cr-broom { position:absolute; z-index:10; font-size:80px; line-height:1; pointer-events:none; }
  .cr-spark { position:absolute; z-index:10; font-size:30px; line-height:1; pointer-events:none; }

  @keyframes cr-blink { 0%, 92%, 100% { transform:scaleY(1); } 95% { transform:scaleY(.1); } }
  @keyframes cr-pop   { from { transform:scale(.3); } }
  @keyframes cr-gulp  { 30% { transform:scale(1.15, .85); } 60% { transform:scale(.95, 1.1); } }
  @keyframes cr-bleh  { 20% { transform:rotate(-8deg) scale(1.08); } 40% { transform:rotate(8deg); } 60% { transform:rotate(-6deg); } 80% { transform:rotate(4deg); } }
  @keyframes cr-bub   { 0% { opacity:0; transform:translate(-50%, 20%) scale(.5); } 20% { opacity:1; transform:translate(-50%, -10%) scale(1.1); } 80% { opacity:1; } 100% { opacity:0; } }
  @keyframes cr-hop   { 40% { transform:translateY(-25%) scale(1.15); } }
  @keyframes cr-glow  { from { transform:scale(1); filter:drop-shadow(0 0 0 #fff); } to { transform:scale(1.2); filter:drop-shadow(0 0 10px #fff) drop-shadow(0 0 4px #fff); } }
  @media (prefers-reduced-motion: reduce) {
    .cr-eye, .cr-box.gulp, .cr-box.bleh, .cr-box.done, .cr-let.say .cr-glyph, .cr-let.answer .cr-glyph, .cr-pip.on { animation:none; }
    .cr-box.bleh .cr-bubble { opacity:1; }
  }`;

  function injectCss() {
    if (document.getElementById("cr-css")) return;
    const style = document.createElement("style");
    style.id = "cr-css";
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  // A lowercase l is drawn just like a capital I, so never put "l" beside box I.
  const clash = (letterText, boxText) => letterText.toUpperCase() === "L" && boxText.toUpperCase() === "I";

  registerMicrogame({
    id: "clean-room",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter"],
    duration: 10000,
    input: "drag", // frame shows DRAG! under the instruction

    start(ctx) {
      injectCss();
      const speed = ctx.speed || 1;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const later = ctx.later;
      const { sweep, tone, noise } = ctx.sfx;
      const spoken = (it) => it.say || it.text.toUpperCase(); // letter names: TTS reads "a" as "uh"
      let done = false;
      let drag = null;

      // ---------- Content ----------
      const two = speed >= 1.5;
      const copies = two ? 2 : 3;
      const nDecoys = speed >= 2 ? 3 : two ? 2 : 3;
      const first = ctx.items[0];
      const boxItems = [first];
      if (two) {
        // The second box is a look-alike when the list has one (B with D), otherwise anything.
        const byText = new Map(ctx.items.map((it) => [it.text, it]));
        const tricky = ctx.shuffle((first.tricky || []).map((t) => byText.get(t)).filter((it) => it && it !== first));
        boxItems.push(tricky[0] || ctx.items.find((it) => it !== first && !clash(it.text, first.text) && !clash(first.text, it.text)));
      }
      const usable = (it) => !boxItems.includes(it) && !boxItems.some((b) => clash(it.text, b.text));
      const decoys = [];
      boxItems.forEach((b) => ctx.pickOptions(b, nDecoys + boxItems.length + 1).forEach((it) => {
        if (usable(it) && !decoys.includes(it)) decoys.push(it);
      }));
      // Look-alikes first: interleave so both boxes get some.
      const decoyPick = ctx.shuffle(decoys).sort((a, b) => tricky2(b) - tricky2(a)).slice(0, nDecoys);
      function tricky2(it) { return boxItems.some((b) => (b.tricky || []).includes(it.text)) ? 1 : 0; }
      for (const it of ctx.items) { // tiny lists: top up with anything usable
        if (decoyPick.length >= nDecoys) break;
        if (usable(it) && !decoyPick.includes(it)) decoyPick.push(it);
      }

      // ---------- DOM ----------
      const wrap = document.createElement("div");
      wrap.className = "cr" + (two ? " two" : "");
      wrap.innerHTML = '<div class="cr-wall"><div class="cr-window"></div></div><div class="cr-floor"></div><div class="cr-rug"></div><div class="cr-boxes"></div>';
      const floor = wrap.querySelector(".cr-rug");
      const boxRow = wrap.querySelector(".cr-boxes");
      ctx.root.appendChild(wrap);
      ctx.later(() => ctx.hint(floor, boxes[0].el, { scale: 0.65 }), 80); // 👆 DRAG! from the rug into the box

      const boxes = boxItems.map((item, i) => {
        const el = document.createElement("div");
        el.className = "cr-box";
        el.setAttribute("role", "button");
        el.setAttribute("tabindex", "0");
        el.setAttribute("aria-label", TEXT.boxLabel(spoken(item)));
        el.style.setProperty("--bc", BOX_INK[i % BOX_INK.length]);
        el.innerHTML =
          '<div class="cr-back"></div>' +
          '<div class="cr-hole"><div class="cr-eyes"><div class="cr-eye"></div><div class="cr-eye"></div></div></div>' +
          '<div class="cr-flap l"></div><div class="cr-flap r"></div>' +
          '<div class="cr-front"><div class="cr-big"></div><div class="cr-pips"></div></div>' +
          `<div class="cr-bubble">${TEXT.bleh}</div>`;
        el.querySelector(".cr-big").textContent = item.text.toUpperCase();
        const pips = [];
        for (let k = 0; k < copies; k++) {
          const p = document.createElement("div");
          p.className = "cr-pip";
          el.querySelector(".cr-pips").appendChild(p);
          pips.push(p);
        }
        el.querySelectorAll(".cr-eye").forEach((e) => { e.style.animationDelay = `${-Math.random() * 3}s`; });
        const box = { el, item, pips, got: 0, eyes: [...el.querySelectorAll(".cr-eye")] };
        const hear = (e) => { e.preventDefault(); if (!done) ctx.say(spoken(item)); };
        el.addEventListener("pointerdown", hear);
        el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") hear(e); });
        boxRow.appendChild(el);
        return box;
      });

      const tiles = [];
      boxItems.forEach((it) => { for (let k = 0; k < copies; k++) tiles.push(it); });
      tiles.push(...decoyPick);
      const colors = ctx.shuffle(LETTER_COLORS.slice());
      const letters = ctx.shuffle(tiles).map((item, i) => {
        const el = document.createElement("div");
        el.className = "cr-let";
        el.setAttribute("role", "button");
        el.setAttribute("tabindex", "0");
        el.setAttribute("aria-label", TEXT.letterLabel(spoken(item)));
        el.innerHTML = '<div class="cr-glyph"></div>';
        el.querySelector(".cr-glyph").textContent = item.text.toLowerCase();
        el.style.setProperty("--c", colors[i % colors.length]);
        el.style.setProperty("--rot", `${Math.round((Math.random() - 0.5) * 36)}deg`);
        wrap.appendChild(el);
        const l = { el, item, x: 0, y: 0, home: false };
        el.addEventListener("pointerdown", (e) => grab(e, l));
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerup", drop);
        el.addEventListener("pointercancel", cancel);
        el.addEventListener("lostpointercapture", cancel);
        // Keyboard: Enter / 1 puts it in the first box, 2 in the second.
        el.addEventListener("keydown", (e) => {
          if (done) return;
          const k = e.key === "Enter" || e.key === "1" ? 0 : e.key === "2" ? 1 : -1;
          if (k >= 0 && boxes[k]) { e.preventDefault(); deliver(l, boxes[k]); }
        });
        return l;
      });

      ctx.say(TEXT.prompt(boxItems.map(spoken)));

      // ---------- Geometry (px, relative to wrap) ----------
      function rel(el) {
        const w = wrap.getBoundingClientRect(), r = el.getBoundingClientRect();
        return { x: r.left - w.left, y: r.top - w.top, w: r.width, h: r.height };
      }
      const place = (l) => { l.el.style.transform = `translate(${l.x}px, ${l.y}px)`; };
      function floorBounds() {
        const f = rel(floor), half = letters[0].el.offsetWidth * 0.5;
        return { x0: Math.max(half, f.x), x1: Math.min(rel(wrap).w - half, f.x + f.w), y0: f.y, y1: f.y + f.h - half * 0.4 };
      }
      function overBox(l) {
        return boxes.find((b) => {
          const r = rel(b.el), pad = r.w * 0.2;
          return l.x > r.x - pad && l.x < r.x + r.w + pad && l.y > r.y - pad && l.y < r.y + r.h + pad;
        }) || null;
      }
      function randomSpot() {
        const B = floorBounds();
        return { x: B.x0 + Math.random() * (B.x1 - B.x0), y: B.y0 + Math.random() * (B.y1 - B.y0) };
      }

      // Scatter on a jittered grid over the rug so letters don't pile up.
      function scatter() {
        const B = floorBounds();
        const cols = letters.length > 6 ? 4 : 3, rows = Math.ceil(letters.length / cols);
        const cells = ctx.shuffle([...Array(cols * rows).keys()]);
        letters.forEach((l, i) => {
          if (l.home) return;
          const c = cells[i], cx = c % cols, cy = Math.floor(c / cols);
          l.x = B.x0 + (B.x1 - B.x0) * ((cx + 0.3 + Math.random() * 0.4) / cols);
          l.y = B.y0 + (B.y1 - B.y0) * ((cy + 0.3 + Math.random() * 0.4) / rows);
          place(l);
        });
      }
      scatter();
      const ro = new ResizeObserver(() => { if (!drag && !done) scatter(); });
      ro.observe(wrap);

      // ---------- Dragging ----------
      function grab(e, l) {
        e.preventDefault();
        if (done || drag || ctx.ended || l.home) return;
        try { l.el.setPointerCapture(e.pointerId); } catch (err) { /* capture is a nicety */ }
        const w = wrap.getBoundingClientRect();
        drag = { l, id: e.pointerId, ox: l.x - (e.clientX - w.left), oy: l.y - (e.clientY - w.top), sx: e.clientX, sy: e.clientY, moved: false };
        l.el.classList.add("lifted");
        sweep(600, 900, 0.08, "sine", 0.08);
      }
      function move(e) {
        if (!drag || e.pointerId !== drag.id || done) return;
        const w = wrap.getBoundingClientRect(), l = drag.l;
        if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 10) drag.moved = true;
        const nx = Math.max(0, Math.min(w.width, e.clientX - w.left + drag.ox));
        const ny = Math.max(0, Math.min(w.height, e.clientY - w.top + drag.oy));
        l.el.style.setProperty("--tilt", `${Math.max(-15, Math.min(15, (nx - l.x) * 1.5))}deg`);
        l.x = nx; l.y = ny;
        place(l);
        const near = overBox(l);
        boxes.forEach((b) => { b.el.classList.toggle("near", b === near); look(b, l.x, l.y); });
      }
      function drop(e) {
        if (!drag || e.pointerId !== drag.id) return;
        const d = drag;
        drag = null;
        release(d.l);
        if (done) return;
        if (!d.moved) return hearLetter(d.l);
        const b = overBox(d.l);
        if (b) deliver(d.l, b);
        else keepOnFloor(d.l);
      }
      function cancel(e) {
        if (!drag || e.pointerId !== drag.id) return;
        const d = drag;
        drag = null;
        release(d.l);
      }
      function release(l) {
        l.el.classList.remove("lifted");
        boxes.forEach((b) => { b.el.classList.remove("near"); b.eyes.forEach((e) => { e.style.removeProperty("--px"); e.style.removeProperty("--py"); }); });
      }
      function keepOnFloor(l) { // dropped on the wall: slide down onto the floor
        const B = floorBounds();
        const ty = Math.max(B.y0, Math.min(B.y1, l.y)), tx = Math.max(B.x0, Math.min(B.x1, l.x));
        if (tx !== l.x || ty !== l.y) glide(l, tx, ty, 250);
      }
      function look(b, x, y) { // the eyes in the box follow the letter
        b.eyes.forEach((e) => {
          const r = rel(e), dx = x - (r.x + r.w / 2), dy = y - (r.y + r.h / 2), len = Math.hypot(dx, dy) || 1;
          e.style.setProperty("--px", `${(dx / len) * 30}%`);
          e.style.setProperty("--py", `${(dy / len) * 30}%`);
        });
      }
      function restartClass(el, cls, ms) {
        el.classList.remove(cls);
        void el.offsetWidth;
        el.classList.add(cls);
        later(() => el.classList.remove(cls), ms);
      }
      function hearLetter(l) {
        restartClass(l.el, "say", 450);
        ctx.say(spoken(l.item));
      }

      // ---------- Into the box ----------
      function deliver(l, b) {
        if (done || ctx.ended || l.home) return;
        if (l.item === b.item) {
          l.home = true;
          const r = rel(b.el.querySelector(".cr-hole"));
          const fx = l.x, fy = l.y;
          l.x = r.x + r.w / 2; l.y = r.y + r.h / 2;
          if (!reduceMotion) {
            l.el.animate([
              { transform: `translate(${fx}px, ${fy}px) scale(1.1)` },
              { transform: `translate(${(fx + l.x) / 2}px, ${Math.min(fy, l.y) - 50}px) scale(.9)`, offset: 0.55 },
              { transform: `translate(${l.x}px, ${l.y}px) scale(.25)` },
            ], { duration: 260, easing: "ease-in" });
          }
          place(l);
          later(() => {
            l.el.classList.add("gone");
            b.pips[b.got].classList.add("on");
            b.got++;
            restartClass(b.el, "gulp", 420);
            gulpSound();
            ctx.say(spoken(l.item));
            if (boxes.every((x) => x.got >= copies)) cleaned();
          }, reduceMotion ? 0 : 250);
        } else {
          // BLEH! Spat back onto the floor. Costs nothing but time.
          restartClass(b.el, "bleh", 800);
          blehSound();
          const s = randomSpot();
          glide(l, s.x, s.y, 450, true);
        }
      }

      function cleaned() {
        done = true;
        ctx.win();
        boxes.forEach((b) => b.el.classList.add("done"));
        happySound();
        boxes.forEach((b) => {
          const r = rel(b.el);
          ctx.confetti(wrap, r.x + r.w / 2, r.y, { count: 30 });
        });
        broom();
      }

      // A broom swishes across the floor and the leftover letters go flying off the right edge.
      function broom() {
        const left = letters.filter((l) => !l.home);
        const W = rel(wrap).w, B = floorBounds();
        sweepSound();
        if (reduceMotion) { left.forEach((l) => l.el.classList.add("gone")); return; }
        const br = document.createElement("div");
        br.className = "cr-broom";
        br.textContent = "🧹";
        wrap.appendChild(br);
        const by = (B.y0 + B.y1) / 2 - 40;
        const dur = 700;
        br.animate([
          { transform: `translate(-100px, ${by}px) rotate(-30deg)` },
          { transform: `translate(${W * 0.5}px, ${by + 20}px) rotate(10deg)`, offset: 0.5 },
          { transform: `translate(${W + 40}px, ${by}px) rotate(-30deg)` },
        ], { duration: dur, easing: "ease-in-out", fill: "forwards" });
        left.forEach((l) => {
          const delay = Math.max(0, (l.x / W) * dur * 0.9);
          l.el.animate([
            { transform: `translate(${l.x}px, ${l.y}px)` },
            { transform: `translate(${W + 120}px, ${l.y - 60}px) rotate(540deg) scale(.6)` },
          ], { duration: 420, delay, easing: "ease-in", fill: "forwards" });
        });
        for (let i = 0; i < 6; i++) {
          const s = document.createElement("div");
          s.className = "cr-spark";
          s.textContent = "✨";
          const x = B.x0 + Math.random() * (B.x1 - B.x0), y = B.y0 + Math.random() * (B.y1 - B.y0);
          s.style.left = `${x}px`;
          s.style.top = `${y}px`;
          wrap.appendChild(s);
          s.animate([{ transform: "scale(0)", opacity: 1 }, { transform: "scale(1.4) rotate(90deg)", opacity: 0 }],
            { duration: 600, delay: 300 + (x / W) * dur * 0.7, fill: "both" });
        }
      }

      function glide(l, tx, ty, ms, spin) {
        const fx = l.x, fy = l.y;
        l.x = tx; l.y = ty;
        place(l);
        if (reduceMotion) return;
        const hop = Math.min(fy, ty) - 70;
        l.el.animate([
          { transform: `translate(${fx}px, ${fy}px)` },
          { transform: `translate(${(fx + tx) / 2}px, ${hop}px) rotate(${spin ? 200 : 0}deg)`, offset: 0.5 },
          { transform: `translate(${tx}px, ${ty}px) rotate(${spin ? 360 : 0}deg)` },
        ], { duration: ms, easing: "ease-out" });
      }

      ctx.onTimeout(() => {
        done = true;
        if (drag) { const d = drag; drag = null; release(d.l); }
        letters.forEach((l) => { if (!l.home && boxItems.includes(l.item)) l.el.classList.add("answer"); });
        boxes.forEach((b) => { if (b.got < copies) restartClass(b.el, "bleh", 800); });
      });

      // ---------- Sound effects ----------
      const gulpSound = () => { sweep(500, 160, 0.14, "sine", 0.3); tone(880, 0.08, "triangle", 0.1, 0.12); };
      const blehSound = () => {
        sweep(300, 120, 0.3, "sawtooth", 0.14);
        sweep(200, 600, 0.12, "sine", 0.2, 0.22); // boing
        sweep(600, 250, 0.15, "sine", 0.15, 0.34);
      };
      const sweepSound = () => { noise(0.5, "bandpass", 800, 3500, 0.25); noise(0.35, "bandpass", 3000, 900, 0.2, 0.3); };
      const happySound = () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.14, "triangle", 0.12, i * 0.07));

      return function cleanup() {
        done = true;
        drag = null;
        ro.disconnect();
      };
    },
  });
})();
