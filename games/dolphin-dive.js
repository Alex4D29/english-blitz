// DOLPHIN DIVE — the second FLAP game, Chicken Flap upside down (the teacher's idea: "the dolphin drifts upwards and
// tapping makes it go down"). A big silly googly-eyed dolphin swims along on its own and drifts UP like a bubble; tap
// anywhere to dive down. Columns of coral roll in, each with 2 gaps (3 from 1.75×), and a bubble ring with a sign in
// every gap. The card shows one target, and every column has exactly one right ring. Swim through the right one: DING,
// fish burst, a pip. Through a wrong one: an octopus inks you (INKED!) and the dolphin is purple for a moment, ✕. The
// coral is springy: hit it and you're boinged into the nearest gap. The surface and the sand are safe. 4 right rings
// win (it spits out a golden pearl); 3 wrong ones lose. No drifting until the first tap, so it waits in the middle.
(function () {
  const TEXT = {
    name: { en: "Dolphin Dive" },
    icon: "🐬",
    howTo: { en: {
      steps: [
        ["👀", "Look at the card."],
        ["👆", "Tap to dive! The dolphin goes down, then drifts up slowly."],
        ["⭕", "Swim through the ring that matches the card. Keep away from the wrong ones!"],
      ],
      tips: ["Swim through 4 right rings to win. Three wrong rings and it's over.", "Bumping the coral is OK: it boings you into a gap.", "Tap the card to hear it again."],
    } },
    instruction: { en: "DIVE\nTHROUGH!" },
    cardLabel: "The card. Tap to hear it again.",
    skyLabel: "The sea. Tap to dive.",
    good: ["SPLASH!", "WHEE!", "FLIPPER-TASTIC!", "YES!"],
    bad: "INKED!",
    win: "PEARL-FECT!",
  };
  const GOAL = 4, MISSES = 3;

  const CSS = `
  .dlp { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:6px; padding-bottom:6px; }
  .dlp-top { flex:none; display:flex; align-items:center; gap:10px; }
  .dlp-card { padding:4px 16px; background:#fff; border:5px solid #111; border-radius:16px; box-shadow:0 5px 0 #111; font:inherit; color:#111; font-size:clamp(1.8rem, 8vw, 2.8rem);
    line-height:1.05; cursor:pointer; touch-action:manipulation; display:flex; align-items:center; gap:6px; white-space:nowrap; }
  .dlp-card .spk { font-size:.45em; }
  .dlp-pips { display:flex; flex-direction:column; gap:4px; }
  .dlp-row { display:flex; gap:4px; }
  .dlp-pip { width:22px; height:22px; border:3px solid #111; border-radius:50%; background:#fff; display:flex; align-items:center; justify-content:center; font-size:12px; line-height:1; }
  .dlp-pip.on { background:#9fe3ff; } .dlp-pip.on::after { content:"🐟"; }
  .dlp-pip.x.on { background:#ffb3c1; } .dlp-pip.x.on::after { content:"✕"; font-weight:900; color:#c0143c; }
  .dlp-sky { position:relative; flex:1; min-height:0; width:100%; max-width:640px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111;
    background:linear-gradient(180deg, #7fe8ff, #1fa5e0 55%, #0b5fa8); touch-action:none; cursor:pointer; }
  /* Scenery (scrolled in the frame loop): bubbles, far seaweed hills with a sunken chest now and then, the sand */
  .dlp-clouds { position:absolute; left:0; right:0; top:6%; height:80%; pointer-events:none; opacity:.55;
    background:radial-gradient(circle at 50% 50%, transparent 0 55%, #fff 58% 70%, transparent 74%) 0 0 / 150px 190px repeat-x,
      radial-gradient(circle at 50% 50%, transparent 0 55%, #fff 58% 70%, transparent 74%) 60px 70px / 90px 120px repeat-x; }
  .dlp-hills { position:absolute; left:0; right:0; bottom:var(--gh); height:18%; pointer-events:none;
    background:radial-gradient(ellipse 60px 60px at 50% 100%, #1f9d8a 0 98%, transparent 100%) 0 100% / 130px 100% repeat-x; }
  .dlp-barn { position:absolute; bottom:var(--gh); width:60px; height:38px; pointer-events:none; background:#9a5b2a; border:3px solid #111; border-bottom:none; border-radius:30px 30px 0 0; }
  .dlp-barn::after { content:""; position:absolute; left:0; right:0; top:40%; height:6px; background:#ffd84d; border-top:3px solid #111; border-bottom:3px solid #111; }
  .dlp-ground { position:absolute; left:0; right:0; bottom:0; height:var(--gh); border-top:4px solid #111; pointer-events:none;
    background:linear-gradient(90deg, #f2d98a 0 30px, #e8cb73 30px 60px) 0 0 / 60px 100% repeat-x; }
  /* A column: coral with gaps; each gap has a bubble ring and a sign */
  .dlp-col { position:absolute; left:0; top:0; width:var(--cw); pointer-events:none; z-index:2; }
  .dlp-bale { position:absolute; left:0; right:0; border:4px solid #111; border-radius:10px; box-sizing:border-box;
    background:repeating-radial-gradient(circle at 30% 20%, #ff8fa3 0 8px, #ff6f91 8px 14px); box-shadow:inset 0 -6px 0 rgba(150,20,60,.3); }
  .dlp-ring { position:absolute; left:50%; width:calc(var(--cw) * .55); border:7px solid #d6f6ff; border-radius:50%; box-sizing:border-box; transform:translate(-50%, -50%);
    box-shadow:0 0 0 3px #111, inset 0 0 0 3px #111; }
  .dlp-sign { position:absolute; left:50%; transform:translate(-50%, -50%); padding:1px 6px; background:#fff; border:3px solid #111; border-radius:9px; font-weight:900; color:#111;
    line-height:1.1; white-space:nowrap; z-index:1; }
  .dlp-gap.good .dlp-ring { border-color:#2fd16b; } .dlp-gap.good .dlp-sign { background:#c8ffd9; }
  .dlp-gap.bad .dlp-ring { border-color:#ff3b5c; } .dlp-gap.bad .dlp-sign { background:#ffd0d8; }
  .dlp-gap.right .dlp-sign { box-shadow:0 0 0 4px #fff, 0 0 0 8px #00b86b; }
  /* The dolphin (--cz): a long blue blob, pale belly, dorsal fin, tail flukes, googly eyes, a big open smile */
  .dlp-hen { position:absolute; left:0; top:0; width:var(--cz); height:var(--cz); z-index:4; pointer-events:none; }
  .dlp-tilt { position:absolute; inset:0; }   /* (tilt and squash on this inner layer: .dlp-hen is placed with a transform) */
  .dlp-tilt > * { position:absolute; box-sizing:border-box; }
  .dlp-tail { left:-26%; top:30%; width:34%; height:36%; background:#5a9be0; border:4px solid #111; border-radius:80% 10% 80% 10%; transform:rotate(25deg); }
  .dlp-body { left:2%; right:8%; top:18%; bottom:18%; background:#5a9be0; border:4px solid #111; border-radius:50% 55% 50% 50%; overflow:hidden; }
  .dlp-body::after { content:""; position:absolute; left:-5%; right:-5%; top:62%; bottom:-10%; background:#e6f4ff; border-top:3px solid #111; border-radius:50%; }
  .dlp-fin { left:30%; top:-2%; width:26%; height:30%; background:#5a9be0; border:4px solid #111; border-radius:90% 0 0 0; transform:skewX(-25deg); z-index:0; }
  .dlp-snout { left:84%; top:46%; width:26%; height:16%; background:#5a9be0; border:4px solid #111; border-radius:6px 70% 70% 6px; z-index:1; }
  .dlp-mouth { left:78%; top:58%; width:30%; height:10%; background:#e6f4ff; border:3px solid #111; border-radius:4px 8px 70% 70%; z-index:2; rotate:8deg; }
  .dlp-eye { width:24%; aspect-ratio:1; background:#fff; border:3px solid #111; border-radius:50%; overflow:hidden; z-index:2; }
  .dlp-eye.l { left:52%; top:22%; width:32%; } .dlp-eye.r { left:70%; top:30%; width:24%; }
  .dlp-eye i { position:absolute; left:28%; top:28%; width:46%; aspect-ratio:1; background:#111; border-radius:50%; animation:dlp-roll .8s ease-in-out infinite alternate; }
  .dlp-cheek { left:62%; top:55%; width:14%; height:10%; background:#ff9db3; border-radius:50%; z-index:1; opacity:.85; }
  .dlp-wing { left:30%; top:56%; width:30%; height:26%; background:#4a86cc; border:4px solid #111; border-radius:10% 80% 70% 30%; z-index:2; transform-origin:20% 10%; }
  .dlp-hen.flap .dlp-wing { animation:dlp-flap .22s ease-out; }
  .dlp-hen.flap .dlp-tilt { animation:dlp-squash .22s ease-out; }
  .dlp-hen.bald .dlp-body, .dlp-hen.bald .dlp-snout, .dlp-hen.bald .dlp-tail, .dlp-hen.bald .dlp-fin { background:#7d4ea0; }
  .dlp-hen.bald .dlp-wing { background:#6a3f8c; }
  .dlp-hen.sad .dlp-eye i { animation:none; left:27%; top:46%; }
  .dlp-hen.sad .dlp-mouth { rotate:-8deg; }
  .dlp-hen.sad .dlp-tilt::after { content:"💧"; position:absolute; left:55%; top:38%; font-size:calc(var(--cz) * .22); animation:dlp-tear .8s ease-in infinite; }
  .dlp-hen.party .dlp-tilt { animation:dlp-loop .7s ease-in-out; }
  .dlp-fx { position:absolute; inset:0; pointer-events:none; z-index:8; overflow:visible; }
  .dlp-feather { position:absolute; width:18px; height:18px; background:#2b1a4a; border:2px solid #111; border-radius:50% 50% 50% 8%; }
  .dlp-corn { position:absolute; line-height:1; }
  .dlp-egg { position:absolute; width:calc(var(--cz) * .6); height:calc(var(--cz) * .6); border:4px solid #111; border-radius:50%;
    background:radial-gradient(circle at 34% 30%, #fff 0 14%, #ffeaf6 30%, #e7a8d8 100%); box-shadow:0 0 22px #fff; z-index:3; }
  .dlp-word { position:absolute; transform:translate(-50%, -50%) rotate(-8deg); font-size:1.9rem; color:#ffcc00; -webkit-text-stroke:2px #111; paint-order:stroke fill;
    text-shadow:0 4px 0 #111; white-space:nowrap; animation:dlp-word 1s ease-out forwards; }
  .dlp-word.bad { color:#c9a0ff; }
  .dlp-word.big { font-size:2.6rem; animation-duration:1.8s; }
  @keyframes dlp-roll { from { transform:translate(-30%, -20%); } to { transform:translate(30%, 20%); } }
  @keyframes dlp-flap { 0% { transform:rotate(0); } 40% { transform:rotate(60deg); } 100% { transform:rotate(0); } }
  @keyframes dlp-squash { 0% { scale:1 1; } 35% { scale:1.1 .88; } 100% { scale:1 1; } }
  @keyframes dlp-tear { from { transform:translateY(0); opacity:1; } to { transform:translateY(calc(var(--cz) * .5)); opacity:0; } }
  @keyframes dlp-loop { to { rotate:-360deg; } }
  @keyframes dlp-word { from { opacity:1; scale:.5; } 25% { scale:1.15; } 75% { opacity:1; } to { opacity:0; translate:0 -40px; } }
  @media (prefers-reduced-motion: reduce) { .dlp-eye i, .dlp-hen.flap .dlp-wing, .dlp-hen.flap .dlp-tilt, .dlp-hen.party .dlp-tilt, .dlp-word { animation:none !important; } }
  `;
  function injectCss() { if (document.getElementById("dlp-css")) return; const s = document.createElement("style"); s.id = "dlp-css"; s.textContent = CSS; document.head.appendChild(s); }

  registerMicrogame({
    id: "dolphin-dive",
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
      const N = speed >= 1.75 ? 3 : 2;   // gaps per column
      const { tone, sweep, noise } = ctx.sfx;
      const C = ctx.choiceRows(10, N, { lowercase: true });
      let rowI = 0;

      const wrap = document.createElement("div");
      wrap.className = "dlp";
      const top = document.createElement("div");
      top.className = "dlp-top";
      const card = document.createElement("button");
      card.className = "dlp-card";
      card.setAttribute("aria-label", TEXT.cardLabel);
      card.innerHTML = '<span class="ct"></span>';
      card.firstChild.textContent = C.listen ? C.target.text : C.cardText;
      if (ctx.canSpeak) card.insertAdjacentHTML("beforeend", '<span class="spk">🔊</span>');
      card.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); ctx.say(C.prompt); });
      const pips = document.createElement("div");
      pips.className = "dlp-pips";
      pips.innerHTML = `<div class="dlp-row hits">${'<span class="dlp-pip"></span>'.repeat(GOAL)}</div><div class="dlp-row">${'<span class="dlp-pip x"></span>'.repeat(MISSES)}</div>`;
      top.append(card, pips);
      const sky = document.createElement("div");
      sky.className = "dlp-sky";
      sky.setAttribute("aria-label", TEXT.skyLabel);
      sky.innerHTML = '<div class="dlp-clouds"></div><div class="dlp-hills"></div><div class="dlp-barn"></div><div class="dlp-ground"></div>';
      const hen = document.createElement("div");
      hen.className = "dlp-hen";
      hen.innerHTML = '<div class="dlp-tilt"><div class="dlp-tail"></div><div class="dlp-fin"></div><div class="dlp-body"></div>' +
        '<div class="dlp-snout"></div><div class="dlp-mouth"></div><div class="dlp-cheek"></div><div class="dlp-eye l"><i></i></div><div class="dlp-eye r"><i></i></div>' +
        '<div class="dlp-wing"></div></div>';
      const fx = document.createElement("div");
      fx.className = "dlp-fx";
      sky.append(hen, fx);
      wrap.append(top, sky);
      ctx.root.appendChild(wrap);
      const hitPips = pips.querySelector(".hits").children, missPips = pips.children[1].children;
      const clouds = sky.querySelector(".dlp-clouds"), hills = sky.querySelector(".dlp-hills"), barn = sky.querySelector(".dlp-barn"), ground = sky.querySelector(".dlp-ground");
      const tilt = hen.querySelector(".dlp-tilt");

      // F: the height you can swim in (above the sand). Gaps: N slots down the column, a gap in the middle of each.
      let W = 0, H = 0, F = 0, cz = 60, cw = 80, hx = 0, gapH = 60;
      const gapY = (k) => (F / N) * (k + 0.5);
      function layout() {
        W = sky.clientWidth; H = sky.clientHeight;
        const gh = Math.max(18, H * 0.1);
        F = H - gh;
        cz = Math.max(48, Math.min(F * (N === 3 ? 0.15 : 0.2), W * 0.17, 112));
        cw = Math.max(56, Math.min(W * 0.15, 96));
        gapH = Math.max(cz * 1.5, (F / N) * 0.62);
        hx = W * 0.24;
        sky.style.setProperty("--gh", `${gh}px`); sky.style.setProperty("--cz", `${cz}px`); sky.style.setProperty("--cw", `${cw}px`);
        cols.forEach(build);
      }

      // ---------- Columns ----------
      const cols = [];
      function build(c) {
        c.el.innerHTML = "";
        c.el.style.height = `${F}px`;
        let y0 = 0;
        for (let k = 0; k < N; k++) {
          const top = gapY(k) - gapH / 2;
          if (top > y0 + 2) bale(c.el, y0, top);
          y0 = top + gapH;
          const g = document.createElement("div");
          g.className = "dlp-gap" + (c.gaps[k].state ? ` ${c.gaps[k].state}` : "");
          const ring = document.createElement("div");
          ring.className = "dlp-ring";
          ring.style.top = `${gapY(k)}px`; ring.style.height = `${gapH * 0.96}px`;
          const sg = document.createElement("span");
          sg.className = "dlp-sign";
          const o = c.gaps[k].o;
          sg.textContent = o.text;
          sg.style.top = `${gapY(k)}px`;
          sg.style.fontSize = `${o.kind === "word" ? Math.min(gapH * 0.26, (cw * 1.5) / ([...o.text].length * 0.62)) : Math.min(gapH * 0.34, cw * 0.5)}px`;
          g.append(ring, sg);
          c.el.appendChild(g);
          c.gaps[k].el = g;
        }
        if (F > y0 + 2) bale(c.el, y0, F);
      }
      function bale(parent, a, b) {
        const d = document.createElement("div");
        d.className = "dlp-bale";
        d.style.top = `${a}px`; d.style.height = `${b - a}px`;
        parent.appendChild(d);
      }
      function spawn(x) {
        const row = C.rows[rowI++ % C.rows.length];
        const el = document.createElement("div");
        el.className = "dlp-col";
        sky.insertBefore(el, hen);
        const c = { el, x, judged: false, gaps: ctx.shuffle(row.slice()).map((o) => ({ o, state: "" })) };
        build(c);
        cols.push(c);
        return c;
      }

      // ---------- Diving ----------
      // G is buoyancy: it pulls the dolphin UP. A tap kicks it DOWN (positive vy = down, like the chicken's fall).
      let y = null, vy = 0, flying = false;
      const G = () => F * 1.6, DIVE = () => F * 0.62, MAXRISE = () => F * 0.85;
      function dive() {
        if (done || ctx.ended) return;
        flying = true;
        vy = DIVE();
        hen.classList.remove("flap"); void hen.offsetWidth; hen.classList.add("flap");
        sweep(700, 300, 0.12, "sine", 0.07);   // bloop down
        noise(0.08, "lowpass", 900, 400, 0.12);
      }
      sky.addEventListener("pointerdown", (e) => { e.preventDefault(); dive(); });
      function onKey(e) {
        if (e.key === " " || e.key === "ArrowDown" || e.key === "Enter") { e.preventDefault(); dive(); }
      }
      document.addEventListener("keydown", onKey);

      let hits = 0, missN = 0, done = false, won = false, started = false, last = null, scroll = 0, bob = 0, inked = 0;
      const cross = 4.2 / pace, every = 2.4 / pace;   // a column crosses the sea in `cross` s; one every `every` s
      let sinceSpawn = 0;
      function frame(ts) {
        const dt = last == null ? 0 : Math.min(50, ts - last) / 1000;
        last = ts;
        const v = (W + cw) / cross;
        const moving = started && !done;
        if (moving) {
          scroll += v * dt;
          sinceSpawn += dt;
          if (sinceSpawn >= every) { sinceSpawn = 0; spawn(W + cw / 2); }
        }
        clouds.style.backgroundPositionX = `${-scroll * 0.15}px, ${60 - scroll * 0.25}px`;
        hills.style.backgroundPositionX = `${-scroll * 0.35}px`;
        ground.style.backgroundPositionX = `${-scroll}px`;
        barn.style.left = `${W - (((scroll * 0.35) + W * 0.3) % (W + 300))}px`;
        // The dolphin: hovers (bobbing) until the first tap, then drifts up and dives.
        if (y == null) y = F * 0.45;
        if (flying && !done) {
          vy = Math.max(-MAXRISE(), vy - G() * dt);
          y += vy * dt;
          if (y < cz * 0.5) { y = cz * 0.5; vy = 0; }   // the surface is safe
          if (y > F - cz * 0.5) { y = F - cz * 0.5; vy = Math.min(vy, 0); }   // so is the sand
        } else if (!flying) { bob += dt; }
        if (done && won) { vy = 0; }
        else if (done && !won) { y = Math.min(F - cz * 0.5, y + F * 0.9 * dt); }   // a sad sink to the sand
        const hy = y + (flying ? 0 : Math.sin(bob * 4) * cz * 0.08);
        hen.style.transform = `translate(${hx - cz / 2}px, ${hy - cz / 2}px)`;
        tilt.style.rotate = done ? "0deg" : `${Math.max(-25, Math.min(35, (vy / F) * 40))}deg`;   // diving = nose down
        if (inked > 0) { inked -= dt; if (inked <= 0 && !(done && !won)) hen.classList.remove("bald"); }
        for (let i = cols.length - 1; i >= 0; i--) {
          const c = cols[i];
          if (moving) c.x -= v * dt;
          c.el.style.transform = `translate(${c.x - cw / 2}px, 0)`;
          if (!c.judged && c.x <= hx) judge(c);
          if (c.x < -cw * 2) { c.el.remove(); cols.splice(i, 1); }
        }
        if (!ctx.ended) ctx.raf(frame);
      }
      // A column reaches the dolphin: which gap is it in? (In the coral: boinged into the nearest gap.)
      function judge(c) {
        c.judged = true;
        if (done || ctx.ended) return;
        let k = 0;
        for (let j = 1; j < N; j++) if (Math.abs(gapY(j) - y) < Math.abs(gapY(k) - y)) k = j;
        const lim = gapH / 2 - cz * 0.3;
        if (Math.abs(y - gapY(k)) > lim) {   // the springy coral boings you in (no penalty)
          y = gapY(k) + Math.sign(y - gapY(k)) * lim;
          vy = 0;
          sweep(260, 520, 0.12, "sine", 0.06);
        }
        const g = c.gaps[k];
        g.state = g.o.right ? "good" : "bad";
        g.el.classList.add(g.state);
        if (g.o.kind === "pic") ctx.say(g.o.spoken);
        if (g.o.right) good(); else bad();
      }
      function good() {
        [784, 1047, 1319].forEach((f, k) => tone(f, 0.09, "triangle", 0.09, k * 0.06));   // ding-ding-ding
        word(TEXT.good[hits % TEXT.good.length], false, hx + cz, y - cz);
        fish(hx, y);
        hitPips[hits].classList.add("on");
        hits++;
        if (hits >= GOAL) {
          done = true; won = true;
          ctx.win();
          hen.classList.remove("flap"); hen.classList.add("party");
          ctx.later(spitPearl, 500);
          ctx.say(C.answer);
        }
      }
      function bad() {
        hen.classList.add("bald");   // (purple: inked)
        inked = 1.2;
        ink(hx, y);
        noise(0.3, "lowpass", 700, 200, 0.3);   // SPLORT
        sweep(600, 250, 0.3, "sawtooth", 0.06, 0.05);   // eek!
        word(TEXT.bad, true, hx + cz, y - cz);
        missPips[missN].classList.add("on");
        missN++;
        if (missN >= MISSES) {
          done = true;
          hen.classList.add("sad");
          ctx.lose();
          showRight();
          ctx.later(() => ctx.say(C.answer), 400);
        }
      }
      function spitPearl() {
        const e = document.createElement("div");
        e.className = "dlp-egg";
        e.style.left = `${hx - cz * 0.3}px`; e.style.top = `${y}px`;
        fx.appendChild(e);
        const fall = F - cz * 0.6 - y;
        e.animate([{ transform: "translateY(0) scale(.3)" }, { transform: `translateY(${fall}px) scale(1)`, offset: 0.7 }, { transform: `translateY(${fall}px) scale(1.15, .9)` }, { transform: `translateY(${fall}px) scale(1)` }],
          { duration: 700, easing: "ease-in", fill: "forwards" });
        tone(523, 0.1, "triangle", 0.08); tone(659, 0.1, "triangle", 0.08, 0.1); tone(1047, 0.25, "triangle", 0.1, 0.25);
        ctx.later(() => {
          word(TEXT.win, false, W / 2, F * 0.3, true);
          ctx.confetti(fx, hx, F - cz * 0.4, { count: 90 });
        }, 600);
      }
      function fish(x, yy) {
        for (let i = 0; i < 6; i++) {
          const k = document.createElement("div");
          k.className = "dlp-corn"; k.textContent = i % 2 ? "✨" : "🐟";
          k.style.fontSize = `${cz * 0.32}px`; k.style.left = `${x}px`; k.style.top = `${yy}px`;
          fx.appendChild(k);
          const a = (i / 6) * Math.PI * 2;
          k.animate([{ transform: "translate(-50%, -50%) scale(.4)" }, { transform: `translate(calc(-50% + ${Math.cos(a) * cz * 1.2}px), calc(-50% + ${Math.sin(a) * cz * 1.2}px)) scale(1)`, opacity: 0 }],
            { duration: 600, easing: "ease-out", fill: "forwards" });
          ctx.later(() => k.remove(), 620);
        }
      }
      function ink(x, yy) {   // dark ink blobs squirt out
        for (let i = 0; i < 9; i++) {
          const f = document.createElement("div");
          f.className = "dlp-feather";
          f.style.left = `${x}px`; f.style.top = `${yy}px`;
          fx.appendChild(f);
          const dx = (Math.random() - 0.5) * cz * 3, up = cz * (0.4 + Math.random() * 0.8);
          f.animate([{ transform: "translate(0, 0) rotate(0)" }, { transform: `translate(${dx * 0.6}px, ${-up}px) rotate(${Math.random() * 360}deg)`, offset: 0.3 },
            { transform: `translate(${dx}px, ${cz * 1.2}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }], { duration: 1300, easing: "ease-out", fill: "forwards" });
          ctx.later(() => f.remove(), 1320);
        }
      }
      function showRight() { cols.forEach((c) => { if (!c.judged) c.gaps.forEach((g) => { if (g.o.right) { g.state = "right"; g.el.classList.add("right"); } }); }); }
      function word(text, isBad, x, yy, big) {
        const w = document.createElement("div");
        w.className = "dlp-word" + (isBad ? " bad" : "") + (big ? " big" : "");
        w.textContent = text;
        w.style.left = `${Math.max(90, Math.min(W - 90, x))}px`; w.style.top = `${Math.max(26, yy)}px`;
        fx.appendChild(w);
        ctx.later(() => w.remove(), big ? 1800 : 1000);
      }

      ctx.onTimeout(() => { done = true; hen.classList.add("sad"); showRight(); ctx.say(C.answer); });

      layout();
      const ro = new ResizeObserver(layout);
      ro.observe(sky);
      ctx.say(C.prompt);
      const rev = ctx.reveal(card);
      // The first column starts part of the way in, so the first ring isn't a long wait.
      ctx.later(() => { started = true; spawn(W * 0.9); }, (rev || 0) + 200);
      ctx.raf(frame);

      // Tutorial: dive whenever the dolphin has drifted above the next column's right ring.
      ctx.tutorial(C.target, async (f) => {
        // (tap the empty water behind the dolphin, never on a ring: a finger on an answer reads as "tap this one")
        const diveAt = () => { const rr = ctx.root.getBoundingClientRect(), r = sky.getBoundingClientRect(); return { x: r.left - rr.left + W * 0.1, y: r.top - rr.top + F * 0.8 }; };
        await f.point(card, 800);
        while (!done) {
          const nx = cols.find((c) => !c.judged);
          if (!nx) { if (!(await f.until(() => done || cols.some((c) => !c.judged), 6000))) break; continue; }
          const k = nx.gaps.findIndex((g) => g.o.right);
          const need = () => !flying || (y < gapY(k) - gapH * 0.08 && vy <= 0);
          await f.until(() => done || nx.judged || need(), 5000);
          if (done) break;
          if (nx.judged) continue;
          if (need()) { await f.tapNow(diveAt); await f.wait(180); }
        }
      });
      return () => { done = true; ro.disconnect(); document.removeEventListener("keydown", onKey); };
    },
  });
})();
