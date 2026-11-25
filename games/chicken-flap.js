// CHICKEN FLAP — the first FLAP game (the teacher's idea, "flappy bird inspired"; our own look: a farm sky, hay-bale
// columns and hoops). A big silly chicken flies along on its own; tap anywhere to flap up, and it slowly falls in
// between. Columns of hay bales roll in, each with 2 gaps (3 from 1.75×), and a hoop with a sign in every gap. The card
// shows one target, and every column has exactly one right hoop. Fly through the right one: DING, corn bursts, a pip.
// Fly through a wrong one: POOF, the chicken's feathers fly off (PLUCKED!) and it's bald for a moment, ✕. The bales are
// soft: hit one and you're squished into the nearest gap. The ground is safe (it just runs along it). 4 right hoops win
// (it lays a golden egg); 3 wrong ones lose. No gravity until the first flap, so it waits in the middle.
(function () {
  const TEXT = {
    name: { en: "Chicken Flap" },
    icon: "🐓",
    howTo: { en: {
      steps: [
        ["👀", "Look at the card."],
        ["👆", "Tap to flap! The chicken goes up, then falls down slowly."],
        ["⭕", "Fly through the hoop that matches the card. Keep away from the wrong ones!"],
      ],
      tips: ["Fly through 4 right hoops to win. Three wrong hoops and it's over.", "Bumping the hay is OK: it squishes you into a gap.", "Tap the card to hear it again."],
    } },
    instruction: { en: "FLAP\nTHROUGH!" },
    cardLabel: "The card. Tap to hear it again.",
    skyLabel: "The sky. Tap to flap.",
    good: ["BAWK!", "WHEE!", "FLAP-TASTIC!", "YES!"],
    bad: "PLUCKED!",
    win: "EGG-CELLENT!",
  };
  const GOAL = 4, MISSES = 3;

  const CSS = `
  .chk { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:6px; padding-bottom:6px; }
  .chk-top { flex:none; display:flex; align-items:center; gap:10px; }
  .chk-card { padding:4px 16px; background:#fff; border:5px solid #111; border-radius:16px; box-shadow:0 5px 0 #111; font:inherit; color:#111; font-size:clamp(1.8rem, 8vw, 2.8rem);
    line-height:1.05; cursor:pointer; touch-action:manipulation; display:flex; align-items:center; gap:6px; white-space:nowrap; }
  .chk-card .spk { font-size:.45em; }
  .chk-pips { display:flex; flex-direction:column; gap:4px; }
  .chk-row { display:flex; gap:4px; }
  .chk-pip { width:22px; height:22px; border:3px solid #111; border-radius:50%; background:#fff; display:flex; align-items:center; justify-content:center; font-size:12px; line-height:1; }
  .chk-pip.on { background:#ffd84d; } .chk-pip.on::after { content:"🌽"; }
  .chk-pip.x.on { background:#ffb3c1; } .chk-pip.x.on::after { content:"✕"; font-weight:900; color:#c0143c; }
  .chk-sky { position:relative; flex:1; min-height:0; width:100%; max-width:640px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111;
    background:linear-gradient(180deg, #7fd3ff, #c9efff 70%); touch-action:none; cursor:pointer; }
  /* Scenery (scrolled in the frame loop): clouds, far hills with a red barn now and then, the grass */
  .chk-clouds { position:absolute; left:0; right:0; top:4%; height:40%; pointer-events:none; opacity:.95;
    background:radial-gradient(ellipse 34px 16px at 50% 60%, #fff 0 97%, transparent 100%) 0 0 / 230px 60px repeat-x,
      radial-gradient(ellipse 22px 12px at 50% 50%, #fff 0 97%, transparent 100%) 90px 70px / 310px 60px repeat-x; }
  .chk-hills { position:absolute; left:0; right:0; bottom:var(--gh); height:18%; pointer-events:none;
    background:radial-gradient(ellipse 90px 60px at 50% 100%, #8fd16a 0 98%, transparent 100%) 0 100% / 170px 100% repeat-x; }
  .chk-barn { position:absolute; bottom:var(--gh); width:64px; height:52px; pointer-events:none; background:#d8402f; border:3px solid #111; border-bottom:none;
    clip-path:polygon(0 35%, 50% 0, 100% 35%, 100% 100%, 0 100%); }
  .chk-barn::after { content:""; position:absolute; left:34%; right:34%; bottom:0; height:46%; background:#fff; border:3px solid #111; border-bottom:none; }
  .chk-ground { position:absolute; left:0; right:0; bottom:0; height:var(--gh); border-top:4px solid #111; pointer-events:none;
    background:linear-gradient(90deg, #5cb83a 0 30px, #6cc847 30px 60px) 0 0 / 60px 100% repeat-x; }
  /* A column: hay bales with gaps; each gap has a hoop and a sign */
  .chk-col { position:absolute; left:0; top:0; width:var(--cw); pointer-events:none; z-index:2; }
  .chk-bale { position:absolute; left:0; right:0; border:4px solid #111; border-radius:10px; box-sizing:border-box;
    background:repeating-linear-gradient(170deg, #f2c94c 0 7px, #e0b33a 7px 10px, #f2c94c 10px 16px); box-shadow:inset 0 -6px 0 rgba(150,100,20,.35); }
  .chk-bale::after { content:""; position:absolute; left:0; right:0; top:50%; height:5px; margin-top:-2px; background:#a0522d; }
  .chk-ring { position:absolute; left:50%; width:calc(var(--cw) * .55); border:7px solid #ffb300; border-radius:50%; box-sizing:border-box; transform:translate(-50%, -50%);
    box-shadow:0 0 0 3px #111, inset 0 0 0 3px #111; }
  .chk-sign { position:absolute; left:50%; transform:translate(-50%, -50%); padding:1px 6px; background:#fff; border:3px solid #111; border-radius:9px; font-weight:900; color:#111;
    line-height:1.1; white-space:nowrap; z-index:1; }
  .chk-gap.good .chk-ring { border-color:#2fd16b; } .chk-gap.good .chk-sign { background:#c8ffd9; }
  .chk-gap.bad .chk-ring { border-color:#ff3b5c; } .chk-gap.bad .chk-sign { background:#ffd0d8; }
  .chk-gap.right .chk-sign { box-shadow:0 0 0 4px #fff, 0 0 0 8px #00b86b; }
  /* The chicken (--cz): a round white blob, red comb, googly eyes, a big open beak, dangling legs */
  .chk-hen { position:absolute; left:0; top:0; width:var(--cz); height:var(--cz); z-index:4; pointer-events:none; }
  .chk-tilt { position:absolute; inset:0; }   /* (tilt and squash on this inner layer: .chk-hen is placed with a transform) */
  .chk-tilt > * { position:absolute; box-sizing:border-box; }
  .chk-leg { top:78%; width:6%; height:22%; background:#ff9d1f; border:2px solid #111; border-radius:4px; }
  .chk-leg.a { left:36%; } .chk-leg.b { left:52%; }
  .chk-leg::after { content:""; position:absolute; left:-80%; bottom:-14%; width:260%; height:30%; background:#ff9d1f; border:2px solid #111; border-radius:4px; }
  .chk-tail { left:-8%; top:22%; width:30%; height:34%; background:#fff; border:4px solid #111; border-radius:60% 20% 30% 60%; transform:rotate(-20deg); }
  .chk-body { left:4%; right:6%; top:10%; bottom:16%; background:#fff; border:4px solid #111; border-radius:50% 50% 46% 46%; }
  .chk-comb { left:40%; top:-8%; width:36%; height:24%; z-index:1;
    background:radial-gradient(circle at 18% 70%, #ff2d3c 0 30%, transparent 32%), radial-gradient(circle at 50% 45%, #ff2d3c 0 34%, transparent 36%), radial-gradient(circle at 82% 70%, #ff2d3c 0 30%, transparent 32%);
    filter:drop-shadow(2px 0 0 #111) drop-shadow(-2px 0 0 #111) drop-shadow(0 -2px 0 #111); }
  .chk-eye { width:24%; aspect-ratio:1; background:#fff; border:3px solid #111; border-radius:50%; overflow:hidden; z-index:2; }
  .chk-eye.l { left:36%; top:8%; width:32%; } .chk-eye.r { left:64%; top:16%; width:24%; }
  .chk-eye i { position:absolute; left:28%; top:28%; width:46%; aspect-ratio:1; background:#111; border-radius:50%; animation:chk-roll .8s ease-in-out infinite alternate; }
  .chk-beak { left:80%; top:40%; width:30%; height:12%; background:#ffc61a; border:3px solid #111; border-radius:4px 60% 10% 4px; z-index:2; transform-origin:0 100%; rotate:-14deg; }
  .chk-beak.lo { top:51%; height:10%; border-radius:4px 10% 60% 4px; rotate:16deg; transform-origin:0 0; }
  .chk-wattle { left:80%; top:58%; width:11%; height:16%; background:#ff2d3c; border:2px solid #111; border-radius:40% 40% 50% 50%; z-index:1; }
  .chk-cheek { left:44%; top:46%; width:16%; height:11%; background:#ff9db3; border-radius:50%; z-index:1; opacity:.85; }
  .chk-wing { left:14%; top:38%; width:44%; height:30%; background:#fff; border:4px solid #111; border-radius:50% 50% 60% 40%; z-index:2; transform-origin:85% 20%; }
  .chk-hen.flap .chk-wing { animation:chk-flap .22s ease-out; }
  .chk-hen.flap .chk-tilt { animation:chk-squash .22s ease-out; }
  .chk-hen.bald .chk-body, .chk-hen.bald .chk-wing { background:#ffb3c1; } .chk-hen.bald .chk-tail { opacity:0; }
  .chk-hen.sad .chk-eye i { animation:none; left:27%; top:46%; }
  .chk-hen.sad .chk-beak { rotate:10deg; } .chk-hen.sad .chk-beak.lo { rotate:-4deg; }
  .chk-hen.sad .chk-tilt::after { content:"💧"; position:absolute; left:40%; top:38%; font-size:calc(var(--cz) * .22); animation:chk-tear .8s ease-in infinite; }
  .chk-hen.party .chk-tilt { animation:chk-loop .7s ease-in-out; }
  .chk-fx { position:absolute; inset:0; pointer-events:none; z-index:8; overflow:visible; }
  .chk-feather { position:absolute; width:16px; height:7px; background:#fff; border:2px solid #111; border-radius:50%; }
  .chk-corn { position:absolute; line-height:1; }
  .chk-egg { position:absolute; width:calc(var(--cz) * .6); height:calc(var(--cz) * .78); border:4px solid #111; border-radius:50% 50% 46% 46% / 60% 60% 40% 40%;
    background:radial-gradient(circle at 34% 30%, #fff8c4 0 14%, #ffd700 30%, #e0a800 100%); box-shadow:0 0 22px #ffe45c; z-index:3; }
  .chk-word { position:absolute; transform:translate(-50%, -50%) rotate(-8deg); font-size:1.9rem; color:#ffcc00; -webkit-text-stroke:2px #111; paint-order:stroke fill;
    text-shadow:0 4px 0 #111; white-space:nowrap; animation:chk-word 1s ease-out forwards; }
  .chk-word.bad { color:#ff6b8a; }
  .chk-word.big { font-size:2.6rem; animation-duration:1.8s; }
  @keyframes chk-roll { from { transform:translate(-30%, -20%); } to { transform:translate(30%, 20%); } }
  @keyframes chk-flap { 0% { transform:rotate(0); } 40% { transform:rotate(-70deg); } 100% { transform:rotate(0); } }
  @keyframes chk-squash { 0% { scale:1 1; } 35% { scale:1.1 .88; } 100% { scale:1 1; } }
  @keyframes chk-tear { from { transform:translateY(0); opacity:1; } to { transform:translateY(calc(var(--cz) * .5)); opacity:0; } }
  @keyframes chk-loop { to { rotate:-360deg; } }
  @keyframes chk-word { from { opacity:1; scale:.5; } 25% { scale:1.15; } 75% { opacity:1; } to { opacity:0; translate:0 -40px; } }
  @media (prefers-reduced-motion: reduce) { .chk-eye i, .chk-hen.flap .chk-wing, .chk-hen.flap .chk-tilt, .chk-hen.party .chk-tilt, .chk-word { animation:none !important; } }
  `;
  function injectCss() { if (document.getElementById("chk-css")) return; const s = document.createElement("style"); s.id = "chk-css"; s.textContent = CSS; document.head.appendChild(s); }

  registerMicrogame({
    id: "chicken-flap",
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
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const { tone, sweep, noise } = ctx.sfx;
      const C = ctx.choiceRows(10, N, { lowercase: true });
      let rowI = 0;

      const wrap = document.createElement("div");
      wrap.className = "chk";
      const top = document.createElement("div");
      top.className = "chk-top";
      const card = document.createElement("button");
      card.className = "chk-card";
      card.setAttribute("aria-label", TEXT.cardLabel);
      card.innerHTML = '<span class="ct"></span>';
      card.firstChild.textContent = C.listen ? C.target.text : C.cardText;
      if (ctx.canSpeak) card.insertAdjacentHTML("beforeend", '<span class="spk">🔊</span>');
      card.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); ctx.say(C.prompt); });
      const pips = document.createElement("div");
      pips.className = "chk-pips";
      pips.innerHTML = `<div class="chk-row hits">${'<span class="chk-pip"></span>'.repeat(GOAL)}</div><div class="chk-row">${'<span class="chk-pip x"></span>'.repeat(MISSES)}</div>`;
      top.append(card, pips);
      const sky = document.createElement("div");
      sky.className = "chk-sky";
      sky.setAttribute("aria-label", TEXT.skyLabel);
      sky.innerHTML = '<div class="chk-clouds"></div><div class="chk-hills"></div><div class="chk-barn"></div><div class="chk-ground"></div>';
      const hen = document.createElement("div");
      hen.className = "chk-hen";
      hen.innerHTML = '<div class="chk-tilt"><div class="chk-leg a"></div><div class="chk-leg b"></div><div class="chk-tail"></div><div class="chk-body"></div><div class="chk-comb"></div>' +
        '<div class="chk-cheek"></div><div class="chk-eye l"><i></i></div><div class="chk-eye r"><i></i></div><div class="chk-wattle"></div><div class="chk-beak"></div><div class="chk-beak lo"></div>' +
        '<div class="chk-wing"></div></div>';
      const fx = document.createElement("div");
      fx.className = "chk-fx";
      sky.append(hen, fx);
      wrap.append(top, sky);
      ctx.root.appendChild(wrap);
      const hitPips = pips.querySelector(".hits").children, missPips = pips.children[1].children;
      const clouds = sky.querySelector(".chk-clouds"), hills = sky.querySelector(".chk-hills"), barn = sky.querySelector(".chk-barn"), ground = sky.querySelector(".chk-ground");
      const tilt = hen.querySelector(".chk-tilt");

      // F: the height you can fly in (above the grass). Gaps: N slots down the column, a gap in the middle of each.
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
          g.className = "chk-gap" + (c.gaps[k].state ? ` ${c.gaps[k].state}` : "");
          const ring = document.createElement("div");
          ring.className = "chk-ring";
          ring.style.top = `${gapY(k)}px`; ring.style.height = `${gapH * 0.96}px`;
          const sg = document.createElement("span");
          sg.className = "chk-sign";
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
        d.className = "chk-bale";
        d.style.top = `${a}px`; d.style.height = `${b - a}px`;
        parent.appendChild(d);
      }
      function spawn(x) {
        const row = C.rows[rowI++ % C.rows.length];
        const el = document.createElement("div");
        el.className = "chk-col";
        sky.insertBefore(el, hen);
        const c = { el, x, judged: false, gaps: ctx.shuffle(row.slice()).map((o) => ({ o, state: "" })) };
        build(c);
        cols.push(c);
        return c;
      }

      // ---------- Flapping ----------
      let y = null, vy = 0, flying = false;
      const G = () => F * 1.6, FLAP = () => -F * 0.62, MAXFALL = () => F * 0.85;
      function flap() {
        if (done || ctx.ended) return;
        flying = true;
        vy = FLAP();
        hen.classList.remove("flap"); void hen.offsetWidth; hen.classList.add("flap");
        sweep(500, 900, 0.09, "triangle", 0.06);   // flap
        noise(0.05, "highpass", 2000, 1200, 0.12);
      }
      sky.addEventListener("pointerdown", (e) => { e.preventDefault(); flap(); });
      function onKey(e) {
        if (e.key === " " || e.key === "ArrowUp" || e.key === "Enter") { e.preventDefault(); flap(); }
      }
      document.addEventListener("keydown", onKey);

      let hits = 0, missN = 0, done = false, won = false, started = false, last = null, scroll = 0, bob = 0, bald = 0;
      const cross = 4.2 / pace, every = 2.4 / pace;   // a column crosses the sky in `cross` s; one every `every` s
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
        clouds.style.backgroundPositionX = `${-scroll * 0.15}px, ${90 - scroll * 0.25}px`;
        hills.style.backgroundPositionX = `${-scroll * 0.35}px`;
        ground.style.backgroundPositionX = `${-scroll}px`;
        barn.style.left = `${W - (((scroll * 0.35) + W * 0.3) % (W + 300))}px`;
        // The chicken: hovers (bobbing) until the first flap, then falls and flaps.
        if (y == null) y = F * 0.45;
        if (flying && !done) {
          vy = Math.min(MAXFALL(), vy + G() * dt);
          y += vy * dt;
          if (y < cz * 0.5) { y = cz * 0.5; vy = Math.max(vy, 0); }
          if (y > F - cz * 0.5) { y = F - cz * 0.5; vy = 0; }
        } else if (!flying) { bob += dt; }
        if (done && won) { vy = 0; }
        else if (done && !won) { y = Math.min(F - cz * 0.5, y + F * 0.9 * dt); }   // a sad flop to the ground
        const hy = y + (flying ? 0 : Math.sin(bob * 4) * cz * 0.08);
        hen.style.transform = `translate(${hx - cz / 2}px, ${hy - cz / 2}px)`;
        tilt.style.rotate = done ? "0deg" : `${Math.max(-25, Math.min(35, (vy / F) * 40))}deg`;
        if (bald > 0) { bald -= dt; if (bald <= 0 && !(done && !won)) hen.classList.remove("bald"); }
        for (let i = cols.length - 1; i >= 0; i--) {
          const c = cols[i];
          if (moving) c.x -= v * dt;
          c.el.style.transform = `translate(${c.x - cw / 2}px, 0)`;
          if (!c.judged && c.x <= hx) judge(c);
          if (c.x < -cw * 2) { c.el.remove(); cols.splice(i, 1); }
        }
        if (!ctx.ended) ctx.raf(frame);
      }
      // A column reaches the chicken: which gap is it in? (In the hay: squished into the nearest gap.)
      function judge(c) {
        c.judged = true;
        if (done || ctx.ended) return;
        let k = 0;
        for (let j = 1; j < N; j++) if (Math.abs(gapY(j) - y) < Math.abs(gapY(k) - y)) k = j;
        const lim = gapH / 2 - cz * 0.3;
        if (Math.abs(y - gapY(k)) > lim) {   // the soft hay squishes you in (a boing, no penalty)
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
        corn(hx, y);
        hitPips[hits].classList.add("on");
        hits++;
        if (hits >= GOAL) {
          done = true; won = true;
          ctx.win();
          hen.classList.remove("flap"); hen.classList.add("party");
          ctx.later(layEgg, 500);
          ctx.say(C.answer);
        }
      }
      function bad() {
        hen.classList.add("bald");
        bald = 1.2;
        feathers(hx, y);
        noise(0.25, "bandpass", 1400, 500, 0.3);   // POOF
        sweep(700, 300, 0.25, "square", 0.07, 0.05);   // BAWK?!
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
      function layEgg() {
        const e = document.createElement("div");
        e.className = "chk-egg";
        e.style.left = `${hx - cz * 0.3}px`; e.style.top = `${y}px`;
        fx.appendChild(e);
        const fall = F - cz * 0.78 - y;
        e.animate([{ transform: "translateY(0) scale(.3)" }, { transform: `translateY(${fall}px) scale(1)`, offset: 0.7 }, { transform: `translateY(${fall}px) scale(1.15, .9)` }, { transform: `translateY(${fall}px) scale(1)` }],
          { duration: 700, easing: "ease-in", fill: "forwards" });
        tone(523, 0.1, "square", 0.08); tone(659, 0.1, "square", 0.08, 0.1); tone(1047, 0.25, "triangle", 0.1, 0.25);
        ctx.later(() => {
          word(TEXT.win, false, W / 2, F * 0.3, true);
          ctx.confetti(fx, hx, F - cz * 0.4, { count: 90 });
        }, 600);
      }
      function corn(x, yy) {
        for (let i = 0; i < 6; i++) {
          const k = document.createElement("div");
          k.className = "chk-corn"; k.textContent = i % 2 ? "✨" : "🌽";
          k.style.fontSize = `${cz * 0.32}px`; k.style.left = `${x}px`; k.style.top = `${yy}px`;
          fx.appendChild(k);
          const a = (i / 6) * Math.PI * 2;
          k.animate([{ transform: "translate(-50%, -50%) scale(.4)" }, { transform: `translate(calc(-50% + ${Math.cos(a) * cz * 1.2}px), calc(-50% + ${Math.sin(a) * cz * 1.2}px)) scale(1)`, opacity: 0 }],
            { duration: 600, easing: "ease-out", fill: "forwards" });
          ctx.later(() => k.remove(), 620);
        }
      }
      function feathers(x, yy) {
        for (let i = 0; i < 9; i++) {
          const f = document.createElement("div");
          f.className = "chk-feather";
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
        w.className = "chk-word" + (isBad ? " bad" : "") + (big ? " big" : "");
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
      // The first column starts part of the way in, so the first hoop isn't a long wait.
      ctx.later(() => { started = true; spawn(W * 0.9); }, (rev || 0) + 200);
      ctx.raf(frame);

      // Tutorial: flap whenever the chicken is falling below the next column's right hoop.
      ctx.tutorial(C.target, async (f) => {
        // (tap the empty sky behind the chicken, never on a hoop: a finger on an answer reads as "tap this one")
        const flapAt = () => { const rr = ctx.root.getBoundingClientRect(), r = sky.getBoundingClientRect(); return { x: r.left - rr.left + W * 0.1, y: r.top - rr.top + F * 0.8 }; };
        await f.point(card, 800);
        while (!done) {
          const nx = cols.find((c) => !c.judged);
          if (!nx) { if (!(await f.until(() => done || cols.some((c) => !c.judged), 6000))) break; continue; }
          const k = nx.gaps.findIndex((g) => g.o.right);
          const need = () => !flying || (y > gapY(k) + gapH * 0.08 && vy >= 0);
          await f.until(() => done || nx.judged || need(), 5000);
          if (done) break;
          if (nx.judged) continue;
          if (need()) { await f.tapNow(flapAt); await f.wait(180); }
        }
      });
      return () => { done = true; ro.disconnect(); document.removeEventListener("keydown", onKey); };
    },
  });
})();
