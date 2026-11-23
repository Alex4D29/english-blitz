// GHOST HUNT — the room is dark. A card at the top shows what to find (a letter, a word, or 🔊 for a
// sight word) and the voice says it. The player drags a flashlight beam around (it follows the finger
// with a little lag). Ghosts drift about; only their glowing eyes show in the dark, and the beam shows
// what's on their bellies. A wrong ghost gets scared when the beam hits it and runs off the screen
// (no penalty). Hold the beam on the right ghost: a ring fills, and when it's full the ghost POPS.
//
// Letter list: the ghosts carry letters. Phonics: the card is a letter, the ghosts carry pictures,
// one starts with it ("B for ball"). CVC: the card is a word, the ghosts carry pictures. HFW: the card
// is 🔊, the ghosts carry words.
// Nothing reacts to the beam until the player first moves it, so a ghost drifting into the starting
// beam can't win or flee by itself. Faster speeds add ghosts (3, 4 from 1.5×, 5 from 2×) and make them
// drift faster.
(function () {
  const TEXT = {
    name: { en: "Ghost Hunt" },
    icon: "👻",
    howTo: (list) => {
      const what = {
        letter: ["🔤", "Look at the letter at the top, like \"B\"."],
        phonics: ["🔤", "Look at the letter at the top, like \"B\". Find a picture that starts with it: ball, bee…"],
        cvc: ["📝", "Look at the word at the top, like \"cat\". Find its picture!"],
        hfw: ["👂", "Listen to the word, like \"the\"."],
      }[list.type] || ["👀", "Look at the card at the top."];
      return { en: {
        steps: [
          what,
          ["🔦", "It's dark! Drag your finger to move the flashlight."],
          ["👻", "Shine the light on the ghosts to see what they have."],
          ["✨", "Found it? Keep the light on that ghost until it POPS!"],
        ],
        tips: [
          "Tap the card at the top to hear it again.",
          "Wrong ghosts get scared and run away. That's OK, keep looking!",
          "When the game speeds up, there are more ghosts and they move faster.",
        ],
      } };
    },
    instruction: { en: "FIND THE\nGHOST!" },
    listen: "🔊",
    answer: (letter, word) => `${letter} for ${word}`,
    cardLabel: "Hear it again",
  };

  const CSS = `
  .gh { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:8px; }
  .gh-card { flex:none; position:relative; z-index:6; min-width:84px; height:72px; padding:0 18px; border-radius:18px; font:inherit;
    font-size:2.6rem; line-height:1; background:#fff; color:#111; border:5px solid #111; box-shadow:0 6px 0 #111;
    display:flex; align-items:center; justify-content:center; gap:8px; cursor:pointer; touch-action:manipulation;
    animation:gh-in .3s cubic-bezier(.2,1.8,.4,1) both; }
  .gh-card .gh-spk { font-size:1.4rem; opacity:.7; }
  .gh-card:active { transform:translateY(4px); box-shadow:0 2px 0 #111; }
  .gh-room { position:relative; flex:1; min-height:0; width:100%; overflow:hidden; touch-action:none; cursor:crosshair;
    border-top:5px solid #111; background:#5b3f8f; }
  .gh-wall { position:absolute; inset:0 0 28% 0;
    background:repeating-linear-gradient(90deg, #6d4fa6 0 22px, #5e4294 22px 44px); }
  .gh-floor { position:absolute; left:0; right:0; bottom:0; height:28%; border-top:8px solid #2b1a10;
    background:repeating-linear-gradient(90deg, #8a5a32 0 58px, #7a4d29 58px 62px); }
  .gh-window { position:absolute; left:8%; top:10%; width:24%; aspect-ratio:.8; background:#1b2a5e; border:6px solid #2b1a10; border-radius:8px; }
  .gh-window::before { content:""; position:absolute; left:50%; top:0; bottom:0; width:6px; margin-left:-3px; background:#2b1a10; }
  .gh-window::after { content:""; position:absolute; right:14%; top:12%; width:32%; aspect-ratio:1; border-radius:50%; background:#fff4b8; box-shadow:-6px 4px 0 -2px #1b2a5e inset; }
  .gh-frame { position:absolute; right:12%; top:14%; width:20%; aspect-ratio:1.2; background:#c98bd6; border:6px solid #c9962e; border-radius:4px; }

  .gh-ghosts, .gh-faces, .gh-fx { position:absolute; inset:0; pointer-events:none; }
  .gh-faces { z-index:3; }
  .gh-fx { z-index:4; overflow:visible; }
  .gh-dark { position:absolute; inset:0; z-index:2; pointer-events:none; transition:opacity .5s ease-out; }
  .gh-dark.on { opacity:0; }

  .gh-g { position:absolute; left:0; top:0; width:var(--gw); height:calc(var(--gw) * 1.15); will-change:transform; }
  .gh-body { position:absolute; inset:0; overflow:visible; filter:drop-shadow(0 6px 0 rgba(0,0,0,.3)); }
  .gh-tag { position:absolute; left:8%; right:8%; top:50%; height:38%; display:flex; align-items:center; justify-content:center;
    color:#111; font-size:calc(var(--gw) * .4); line-height:1; white-space:nowrap; }
  .gh-tag.pic { font-size:calc(var(--gw) * .36); }
  .gh-g.scared .gh-in, .gh-f.scared .gh-in { animation:gh-shake .12s linear infinite; }
  .gh-g.answer .gh-body path { fill:#fff6a8; }
  .gh-g.answer .gh-in { animation:gh-wiggle .4s ease-in-out infinite; }
  .gh-g.dim, .gh-f.dim { opacity:.35; }
  .gh-in { position:absolute; inset:0; }
  .gh-g.pop .gh-in, .gh-f.pop .gh-in { animation:gh-pop .35s ease-in forwards; }

  .gh-f { position:absolute; left:0; top:0; width:var(--gw); height:calc(var(--gw) * 1.15); will-change:transform; }
  /* The eyes only show in the beam, or once the lights are on: glowing eyes in the dark gave the ghosts away */
  .gh-f .gh-eye { opacity:0; transition:opacity .15s; }
  .gh-f.seen .gh-eye, .gh-dark.on ~ .gh-faces .gh-eye, .gh-room.eyes .gh-eye { opacity:1; }
  .gh-eye { position:absolute; top:22%; width:16%; height:20%; border-radius:50%; background:#111;
    box-shadow:0 0 0 3px #fff8c4, 0 0 14px 6px rgba(255,248,196,.75); }
  .gh-eye::after { content:""; position:absolute; left:22%; top:16%; width:38%; height:34%; border-radius:50%; background:#fff; }
  .gh-eye.l { left:30%; } .gh-eye.r { right:30%; }
  .gh-mouth { position:absolute; left:50%; top:42%; width:14%; height:7%; margin-left:-7%; border-radius:0 0 99px 99px; background:#111; opacity:0; }
  .gh-f.scared .gh-eye { transform:scale(1.35); }
  .gh-f.scared .gh-eye::after { left:34%; top:30%; width:30%; height:30%; }
  .gh-f.scared .gh-mouth { opacity:1; top:40%; width:16%; height:12%; margin-left:-8%; border-radius:50%; }
  .gh-f.lit .gh-mouth { opacity:1; }
  .gh-ring { position:absolute; left:50%; top:50%; width:160%; aspect-ratio:1; transform:translate(-50%, -50%);
    border-radius:50%; opacity:0; transition:opacity .12s;
    background:conic-gradient(#ffd60a calc(var(--p, 0) * 360deg), rgba(255,255,255,.28) 0);
    -webkit-mask:radial-gradient(farthest-side, transparent calc(100% - 11px), #000 calc(100% - 10px));
            mask:radial-gradient(farthest-side, transparent calc(100% - 11px), #000 calc(100% - 10px)); }
  .gh-f.charge .gh-ring { opacity:1; }
  .gh-poof { position:absolute; font-size:2.4rem; line-height:1; transform:translate(-50%, -50%); animation:gh-poof .7s ease-out forwards; }
  /* Baby Boss's milk hunt: every ghost clutches a stolen 🍼, and Baby wails in its cot in the corner, lit by a night-light */
  .gh-milk { position:absolute; right:-16%; top:40%; font-size:calc(var(--gw) * .36); line-height:1; transform:rotate(22deg); }
  .gh-cot { position:absolute; right:3%; bottom:2%; z-index:3; pointer-events:none; width:var(--cz); height:var(--cz); }
  .gh-cot::before { content:""; position:absolute; inset:-30%; border-radius:50%; background:radial-gradient(circle, rgba(255,230,150,.5), transparent 65%); z-index:-1; }
  .gh-cot .bx-boss { position:absolute; left:0; top:-12%; }
  .gh-cot::after { content:""; position:absolute; left:-8%; right:-8%; bottom:0; height:40%; border:5px solid #111; border-radius:10px; z-index:2;
    background:repeating-linear-gradient(90deg, #f0c27a 0 10px, transparent 10px 24px), linear-gradient(#f0c27a 0 16%, transparent 16% 84%, #f0c27a 84%); }   /* the cot's bars */
  .gh-fly { position:absolute; font-size:calc(var(--gw) * .5); line-height:1; transform:translate(-50%, -50%); z-index:5; pointer-events:none; }

  @keyframes gh-in     { from { transform:scale(.6); opacity:0; } }
  @keyframes gh-shake  { 0%, 100% { transform:translateX(0); } 25% { transform:translateX(-5%); } 75% { transform:translateX(5%); } }
  @keyframes gh-wiggle { 25% { transform:rotate(-8deg) scale(1.06); } 75% { transform:rotate(8deg) scale(1.06); } }
  @keyframes gh-pop    { 40% { transform:scale(1.3); opacity:1; } 100% { transform:scale(1.7); opacity:0; } }
  @keyframes gh-poof   { to { transform:translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(.4); opacity:0; } }
  @media (prefers-reduced-motion: reduce) {
    .gh-card, .gh-g.answer .gh-in, .gh-g.scared .gh-in, .gh-f.scared .gh-in, .gh-poof { animation:none; }
  }`;

  // The sheet: round top, wavy hem. viewBox 0 0 100 115.
  const BODY = '<svg class="gh-body" viewBox="0 0 100 115" preserveAspectRatio="none"><path d="M10 52 A40 40 0 0 1 90 52 L90 104 ' +
    'Q82 114 74 104 Q66 94 58 104 Q50 114 42 104 Q34 94 26 104 Q18 114 10 104 Z" fill="#fff" stroke="#111" stroke-width="5" ' +
    'stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>';

  function injectCss() {
    if (document.getElementById("gh-css")) return;
    const style = document.createElement("style");
    style.id = "gh-css";
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  registerMicrogame({
    id: "ghost-hunt",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 10000,
    bossArt: true, // Boss Battle: Baby Boss's milk hunt (the ghosts have stolen its milk; Baby wails in its cot)
    input: "drag",
    tutorial: true, // has a ctx.tutorial script

    start(ctx) {
      injectCss();
      const type = ctx.list.type;
      const speed = ctx.speed || 1;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const n = speed >= 2 ? 5 : speed >= 1.5 ? 4 : 3;
      const letterName = (it) => it.say || it.text.toUpperCase();
      const { tone, sweep, noise } = ctx.sfx;

      // ---------- Content ----------
      // tags: { text, kind: "letter" | "pic" | "word", right }
      let cardText, prompt, answer, tags, answerItem; // answerItem: the list item the round is about (tutorial)
      if (type === "phonics") {
        const letter = ctx.items.find((it) => ctx.phonics.pics(it).length) || ctx.items[0];
        answerItem = letter;
        const set = ctx.phonics.set(letter, 1, n - 1);
        const right = set.right[0];
        cardText = letter.text.toUpperCase();
        prompt = letterName(letter);
        answer = TEXT.answer(letterName(letter), right.word);
        tags = [right, ...set.wrong].map((p) => ({ text: p.emoji, kind: "pic", right: p === right }));
      } else if (type === "cvc") {
        const pool = ctx.items.filter((it) => it.emoji);
        const target = pool[0];
        answerItem = target;
        const picks = [];
        for (const o of [...ctx.pickOptions(target, 12), ...ctx.shuffle(pool.slice())]) {
          if (picks.length >= n - 1) break;
          if (o !== target && o.emoji && !picks.includes(o)) picks.push(o);
        }
        cardText = target.text;
        prompt = answer = target.say || target.text;
        tags = [target, ...picks].map((o) => ({ text: o.emoji, kind: "pic", right: o === target }));
      } else if (type === "hfw") {
        const target = ctx.items[0];
        answerItem = target;
        cardText = ctx.canSpeak ? TEXT.listen : target.text;
        prompt = answer = target.say || target.text;
        const others = ctx.pickOptions(target, n + 1).filter((o) => o !== target).slice(0, n - 1);
        tags = [target, ...others].map((o) => ({ text: o.text, kind: "word", right: o === target }));
      } else {
        const target = ctx.items[0];
        answerItem = target;
        cardText = target.text;
        prompt = letterName(target);
        answer = target.word ? TEXT.answer(letterName(target), target.word) : prompt;
        tags = ctx.pickOptions(target, n).map((o) => ({ text: o.text, kind: "letter", right: o === target }));
      }
      tags = ctx.shuffle(tags);

      // ---------- DOM ----------
      const wrap = document.createElement("div");
      wrap.className = "gh";
      const card = document.createElement("button");
      card.className = "gh-card";
      card.setAttribute("aria-label", TEXT.cardLabel);
      card.innerHTML = '<span class="gh-ct"></span>';
      card.querySelector(".gh-ct").textContent = cardText;
      if (ctx.canSpeak && cardText !== TEXT.listen) card.insertAdjacentHTML("beforeend", '<span class="gh-spk">🔊</span>');
      card.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });
      card.addEventListener("click", (e) => { if (e.detail === 0) replay(); });
      const room = document.createElement("div");
      room.className = "gh-room" + ((ctx.speed || 1) >= 1.75 ? " eyes" : ""); // eyes glow in the dark again when it's fast (too tricky without)
      room.innerHTML = '<div class="gh-wall"></div><div class="gh-floor"></div><div class="gh-window"></div><div class="gh-frame"></div>' +
        '<div class="gh-ghosts"></div><div class="gh-dark"></div><div class="gh-faces"></div><div class="gh-fx"></div>';
      const dark = room.querySelector(".gh-dark");
      const fx = room.querySelector(".gh-fx");
      // Boss Battle: Baby Boss wails in its cot in the corner (lit by a night-light); the ghosts stole its milk.
      const babyMode = !!(window.Boss && window.Boss.fighting(ctx) === "baby");
      let baby = null;
      if (babyMode) {
        const cot = document.createElement("div");
        cot.className = "gh-cot";
        baby = window.Boss.el("baby", "var(--cz)");
        cot.appendChild(baby);
        room.insertBefore(cot, fx);
      }
      wrap.append(card, room);
      ctx.root.appendChild(wrap);

      const ghosts = tags.map((tag) => {
        const el = document.createElement("div");
        el.className = "gh-g";
        el.innerHTML = `<div class="gh-in">${BODY}<div class="gh-tag"></div>${babyMode ? '<div class="gh-milk">🍼</div>' : ""}</div>`;
        const t = el.querySelector(".gh-tag");
        t.textContent = tag.text;
        if (tag.kind === "pic") t.classList.add("pic");
        const face = document.createElement("div");
        face.className = "gh-f";
        face.innerHTML = '<div class="gh-in"><div class="gh-ring"></div><div class="gh-eye l"></div><div class="gh-eye r"></div><div class="gh-mouth"></div></div>';
        room.querySelector(".gh-ghosts").appendChild(el);
        room.querySelector(".gh-faces").appendChild(face);
        return { el, face, tagEl: t, tag, x: 0, y: 0, vx: 0, vy: 0, ang: Math.random() * 6.28, ph: Math.random() * 6.28,
          state: "roam", litT: 0, stateT: 0, p: 0 };
      });

      // ---------- Layout ----------
      let w = 0, h = 0, gw = 0, gh = 0, R = 0;
      function measure() {
        const r = room.getBoundingClientRect();
        w = r.width; h = r.height;
        const k = n >= 5 ? [0.2, 0.16] : n >= 4 ? [0.22, 0.17] : [0.24, 0.19]; // (a bit smaller than at first: the teacher found it too easy)
        gw = Math.max(48, Math.min(w * k[0], h * k[1]));
        gh = gw * 1.15;
        R = Math.max(70, gw * 0.95);
        room.style.setProperty("--gw", `${gw}px`);
        if (babyMode) room.style.setProperty("--cz", `${Math.max(70, Math.min(w * 0.24, h * 0.3, 140))}px`);
        ghosts.forEach((g) => {
          if (g.tag.kind !== "word") return;
          g.tagEl.style.fontSize = `${Math.min(gw * 0.3, (gw * 0.84) / (g.tag.text.length * 0.6))}px`;
        });
      }
      measure();
      const minX = () => gw / 2, maxX = () => w - gw / 2, minY = () => gh / 2, maxY = () => h - gh / 2;

      // The beam starts in the middle; ghosts start away from it and from each other.
      const light = { x: w / 2, y: h / 2 }, aim = { x: w / 2, y: h / 2 };
      ghosts.forEach((g, i) => {
        let best = null, bestScore = -1;
        for (let tries = 0; tries < 40; tries++) {
          const x = minX() + Math.random() * Math.max(1, maxX() - minX());
          const y = minY() + Math.random() * Math.max(1, maxY() - minY());
          const dL = Math.hypot(x - light.x, y - light.y) - (R + gw * 0.6);
          const dG = Math.min(Infinity, ...ghosts.slice(0, i).map((o) => Math.hypot(x - o.x, y - o.y) - gw * 1.2));
          const score = Math.min(dL, dG);
          if (score > bestScore) { bestScore = score; best = { x, y }; }
          if (score > 0) break;
        }
        g.x = best.x; g.y = best.y;
      });
      const v0 = reduceMotion ? 0 : gw * (0.35 + 0.35 * (speed - 1)); // px per second

      // ---------- Input: the beam follows the finger (a little above it on touch) ----------
      let active = false, done = false, dragId = null, lastPlip = 0;
      function setAim(e) {
        const r = room.getBoundingClientRect();
        const lift = e.pointerType === "touch" ? R * 0.5 : 0; // keep the finger from covering the beam
        aim.x = Math.max(0, Math.min(w, e.clientX - r.left));
        aim.y = Math.max(0, Math.min(h, e.clientY - r.top - lift));
      }
      room.addEventListener("pointerdown", (e) => {
        if (done) return;
        e.preventDefault();
        dragId = e.pointerId;
        try { room.setPointerCapture(e.pointerId); } catch (err) { /* capture is a nicety */ }
        active = true;
        setAim(e);
      });
      room.addEventListener("pointermove", (e) => {
        if (done) return;
        if (e.pointerId === dragId || e.pointerType === "mouse") { active = true; setAim(e); }
      });
      const endDrag = (e) => { if (e.pointerId === dragId) dragId = null; };
      room.addEventListener("pointerup", endDrag);
      room.addEventListener("pointercancel", endDrag);

      function onKey(e) {
        if (done) return;
        const d = 40, k = { ArrowLeft: [-d, 0], ArrowRight: [d, 0], ArrowUp: [0, -d], ArrowDown: [0, d] }[e.key];
        if (e.key === " ") { e.preventDefault(); replay(); return; }
        if (!k) return;
        e.preventDefault();
        active = true;
        aim.x = Math.max(0, Math.min(w, aim.x + k[0]));
        aim.y = Math.max(0, Math.min(h, aim.y + k[1]));
      }
      document.addEventListener("keydown", onKey);

      // ---------- Loop ----------
      const HOLD = 1.3; // seconds of beam on the right ghost to pop it
      let last = 0, t = 0, lightsOn = false;
      function drawDark() {
        if (lightsOn) return;
        const x = light.x.toFixed(1), y = light.y.toFixed(1);
        dark.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,240,170,.18) 0px, rgba(255,240,170,.07) ${(R * 0.62).toFixed(1)}px, rgb(8,6,24) ${R.toFixed(1)}px)`;
      }
      function render() {
        ghosts.forEach((g) => {
          if (g.state === "gone") return;
          const bob = reduceMotion ? 0 : Math.sin(t * 2.2 + g.ph) * gw * 0.05;
          const tr = `translate(${(g.x - gw / 2).toFixed(1)}px, ${(g.y - gh / 2 + bob).toFixed(1)}px)`;
          g.el.style.transform = tr;
          g.face.style.transform = tr;
        });
      }

      function step(dt) {
        t += dt;
        const f = 1 - Math.exp(-7 * dt); // the beam's lag
        light.x += (aim.x - light.x) * f;
        light.y += (aim.y - light.y) * f;

        ghosts.forEach((g) => {
          if (g.state === "gone" || g.state === "pop") return;
          g.stateT += dt;
          const lit = active && !done && Math.hypot(g.x - light.x, g.y - light.y) < R * 0.72;
          g.face.classList.toggle("lit", lit && g.tag.right);
          g.face.classList.toggle("seen", lit); // eyes show only in the beam

          if (g.state === "flee") {
            g.x += g.vx * dt; g.y += g.vy * dt;
            if (g.x < -gw || g.x > w + gw || g.y < -gh || g.y > h + gh) {
              g.state = "gone"; g.el.remove(); g.face.remove();
            }
            return;
          }
          if (g.state === "scared") {
            if (g.stateT > 0.35) {
              g.state = "flee";
              let dx = g.x - light.x, dy = g.y - light.y;
              const d = Math.hypot(dx, dy) || 1;
              dx /= d; dy /= d;
              const sp = gw * 6;
              g.vx = dx * sp; g.vy = dy * sp;
            }
            return;
          }

          if (!g.tag.right) {
            g.litT = lit ? g.litT + dt : 0;
            if (g.litT > 0.12) scare(g);
          } else if (!done) {
            if (lit) {
              g.p = Math.min(1, g.p + dt / HOLD);
              const now = performance.now();
              if (now - lastPlip > 140) { lastPlip = now; tone(420 + g.p * 700, 0.06, "triangle", 0.09); }
            } else {
              g.p = Math.max(0, g.p - (dt / HOLD) * 1.5);
            }
            g.face.classList.toggle("charge", g.p > 0);
            g.face.style.setProperty("--p", g.p.toFixed(3));
            if (g.p >= 1) { popGhost(g); return; }
          }

          if (done) return; // the round is over: everyone left stays put
          // Drift: a slow, wandering heading; a ghost in the beam (the right one, charging) stops.
          const slow = g.tag.right && g.p > 0 ? 0 : 1;
          g.ang += (Math.random() - 0.5) * dt * 2.4;
          const sp = v0 * slow;
          g.vx = Math.cos(g.ang) * sp; g.vy = Math.sin(g.ang) * sp;
          g.x += g.vx * dt; g.y += g.vy * dt;
          if (g.x < minX()) { g.x = minX(); g.ang = Math.PI - g.ang; }
          if (g.x > maxX()) { g.x = maxX(); g.ang = Math.PI - g.ang; }
          if (g.y < minY()) { g.y = minY(); g.ang = -g.ang; }
          if (g.y > maxY()) { g.y = maxY(); g.ang = -g.ang; }
        });
        // Ghosts drift apart instead of stacking.
        const live = ghosts.filter((g) => g.state === "roam");
        for (let i = 0; i < live.length; i++) {
          for (let j = i + 1; j < live.length; j++) {
            const a = live[i], b = live[j];
            const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.01, min = gw * 1.05;
            if (d >= min) continue;
            const push = (min - d) / 2, nx = dx / d, ny = dy / d;
            a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push;
          }
        }
      }

      function frame(ts) {
        const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0;
        last = ts;
        step(dt);
        render();
        drawDark();
        if (ghosts.some((g) => g.state !== "gone" && g.state !== "pop") || !lightsOn) ctx.raf(frame);
      }
      render();
      drawDark();
      ctx.raf(frame);

      const ro = new ResizeObserver(() => {
        measure();
        ghosts.forEach((g) => {
          if (g.state !== "roam") return;
          g.x = Math.min(maxX(), Math.max(minX(), g.x));
          g.y = Math.min(maxY(), Math.max(minY(), g.y));
        });
        aim.x = Math.min(aim.x, w); aim.y = Math.min(aim.y, h);
        render();
        drawDark();
      });
      ro.observe(room);

      // A small finger-only hint: drag from the beam out to the side.
      ctx.later(() => {
        const g = ctx.root.getBoundingClientRect(), r = room.getBoundingClientRect();
        const ox = r.left - g.left, oy = r.top - g.top;
        ctx.hint({ x: ox + light.x, y: oy + light.y + R * 0.2 }, { x: ox + light.x + w * 0.28, y: oy + light.y + R * 0.2 },
          { noWord: true, scale: 0.7 });
      }, 80);

      // ---------- Events ----------
      function replay() { if (!done) ctx.say(prompt); }

      function scare(g) {
        g.state = "scared";
        g.stateT = 0;
        g.el.classList.add("scared");
        g.face.classList.add("scared");
        sweep(500, 1500, 0.18, "square", 0.07);
        sweep(1500, 900, 0.12, "square", 0.05, 0.18);
      }

      function lightsUp() {
        lightsOn = true;
        dark.classList.add("on");
      }

      function popGhost(g) {
        if (done || ctx.ended) return;
        done = true;
        g.state = "pop";
        g.face.classList.remove("charge", "lit");
        g.el.classList.add("pop");
        g.face.classList.add("pop");
        ctx.win();
        lightsUp();
        noise(0.12, "highpass", 800, 4000, 0.6);
        sweep(300, 1200, 0.15, "triangle", 0.15);
        ctx.later(() => ctx.sfx.happy && ctx.sfx.happy(), 120);
        ctx.confetti(fx, g.x, g.y);
        if (!reduceMotion) {
          ["✨", "💨", "✨", "⭐", "💨", "✨"].forEach((s, i) => {
            const p = document.createElement("div");
            p.className = "gh-poof";
            p.textContent = s;
            const a = (i / 6) * Math.PI * 2;
            p.style.cssText = `left:${g.x}px;top:${g.y}px;--dx:${Math.cos(a) * gw * 0.9}px;--dy:${Math.sin(a) * gw * 0.9}px;`;
            fx.appendChild(p);
          });
        }
        ctx.say(answer);
        if (babyMode) milkToBaby(g);
        // The others flee from the noise.
        ghosts.forEach((o) => { if (o !== g && o.state === "roam") { o.stateT = 0; scare(o); } });
      }

      // Baby Boss's milk: the bottle the right ghost was holding flies to the baby, who gulps it down and cheers up.
      function milkToBaby(g) {
        const b = room.querySelector(".gh-cot").getBoundingClientRect(), r = room.getBoundingClientRect();
        const to = { x: b.left - r.left + b.width * 0.5, y: b.top - r.top + b.height * 0.35 };
        const m = document.createElement("div");
        m.className = "gh-fly";
        m.textContent = "🍼";
        fx.appendChild(m);
        m.animate([{ left: `${g.x}px`, top: `${g.y}px`, transform: "translate(-50%, -50%) rotate(0)" },
          { left: `${(g.x + to.x) / 2}px`, top: `${Math.min(g.y, to.y) - gw}px`, transform: "translate(-50%, -50%) rotate(200deg)", offset: 0.5 },
          { left: `${to.x}px`, top: `${to.y}px`, transform: "translate(-50%, -50%) rotate(380deg) scale(.7)" }],
        { duration: reduceMotion ? 1 : 650, easing: "ease-in-out", fill: "forwards" });
        ctx.later(() => {
          m.remove();
          window.Boss.setMood(baby, "happy");
          [0, 0.18, 0.36].forEach((d) => tone(330, 0.1, "sine", 0.12, d)); // gulp gulp gulp
        }, reduceMotion ? 10 : 660);
      }

      ctx.onTimeout(() => {
        done = true;
        if (baby) window.Boss.setMood(baby, "angry"); // waaah!
        lightsUp();
        ghosts.forEach((g) => {
          g.face.classList.remove("charge", "lit");
          if (g.tag.right) g.el.classList.add("answer");
          else if (g.state === "roam") { g.el.classList.add("dim"); g.face.classList.add("dim"); }
        });
        ctx.say(answer);
      });

      ctx.say(prompt);
      // Show the target big in the middle for a moment before play starts (ctx.reveal).
      ctx.reveal(card);


      // Tutorial: point at the card, then drag the beam onto the right ghost and hold it there until
      // it pops. (On touch the beam sits half a beam above the finger, so the finger aims below it.)
      ctx.tutorial(answerItem, async (f) => {
        const tg = ghosts.find((g) => g.tag.right);
        const at = (p) => () => {
          const r = room.getBoundingClientRect(), g0 = ctx.root.getBoundingClientRect();
          return { x: r.left - g0.left + p().x, y: r.top - g0.top + p().y + R * 0.5 };
        };
        await f.point(card);
        await f.drag(at(() => light), at(() => tg), 1300, 3600); // (finger times run 1.5× fast: this holds about 2.4 s)
      });

      return function cleanup() {
        done = true;
        ro.disconnect();
        document.removeEventListener("keydown", onKey);
      };
    },
  });
})();
