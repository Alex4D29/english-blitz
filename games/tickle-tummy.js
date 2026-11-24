// TICKLE TUMMY — a rhythm game (the teacher's idea: "tickle the cat's belly without getting scratched";
// Kitty Boss's finale, and a normal game with a big fat monster). It lies on its back, legs in the air, its
// huge round tummy covered in fluffy patches, each with an option. The card at the top shows the target:
// RUB the right patch back and forth (a feather follows your finger; a tap tickles a little too) until its
// ring fills: it giggles and kicks its legs (a 🤭 pip), then a beat and a new target. Rub a wrong patch and
// SCRATCH! — claw marks rip across the screen (✕); 3 scratches and you lose. At 2× and up it sometimes gets
// GRUMPY (💢, eyes narrow, a ⚠️): rub then and it scratches too, so wait for it to calm down.
// Boss Battle: Kitty Boss's finale (bossArt): the kitten lies there instead, tail swishing.
(function () {
  const TEXT = {
    name: { en: "Tickle Tummy" },
    icon: "🤭",
    howTo: (list) => ({ en: {
      steps: [
        list.type === "hfw" ? ["👂", "Listen to the word, like \"the\". It's on the card too."] : ["👀", "Look at the card at the top."],
        ["🪶", "Find the same one on the monster's tummy and RUB it, back and forth!"],
        ["🤭", "It giggles! Then the card changes. Tickle 3 times!"],
      ],
      tips: [
        "Rub the wrong spot and it SCRATCHES! 3 scratches and it's over.",
        "When it looks grumpy (💢), stop and wait, or it scratches!",
        "Tap the card to hear it again.",
      ],
    } }),
    instruction: { en: "TICKLE THE\nTUMMY!" },
    cardLabel: "Hear it again",
    giggle: ["HEE HEE!", "HA HA HA!", "HO HO!", "TEE HEE!", "HA HA!"],
    scratch: "SCRATCH!",
    grumpy: "GRRR!",
    laugh: "HA HA HA HA!",
    hmph: "HMPH!",
  };
  const BEAT_MS = 800, NEED = 7, WRONG_AT = 0.3; // rubbing distance to fill a patch, in patch radii; a wrong patch scratches at 30%

  const CSS = `
  .tt { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:8px; padding-bottom:6px; }
  .tt-top { flex:none; display:flex; align-items:center; gap:10px; flex-wrap:wrap; justify-content:center; }
  .tt-card { min-width:84px; height:70px; padding:0 16px; border-radius:18px; font:inherit; font-size:2.5rem; line-height:1; background:#fff; color:#111;
    border:5px solid #111; box-shadow:0 6px 0 #111; display:flex; align-items:center; justify-content:center; gap:8px; cursor:pointer; touch-action:manipulation; }
  .tt-card .spk { font-size:1.2rem; opacity:.6; }
  .tt-card.next { animation:tt-next .45s cubic-bezier(.2,1.8,.4,1); }
  .tt-pips { display:flex; gap:4px; }
  .tt-pip { width:24px; height:24px; border:3px solid #111; border-radius:50%; background:#fff; display:flex; align-items:center; justify-content:center; font-size:13px; line-height:1; }
  .tt-pip.on { background:#ffd400; } .tt-pip.on::after { content:"🤭"; }
  .tt-pip.x { background:#ff5a6e; } .tt-pip.x::after { content:"✕"; color:#fff; font-size:14px; }

  .tt-stage { position:relative; flex:1; min-height:0; width:100%; max-width:600px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111;
    background:radial-gradient(ellipse at 50% 70%, #fff6c9 0 30%, transparent 70%), repeating-linear-gradient(45deg, #ffd9ec 0 18px, #ffc6e2 18px 36px);
    touch-action:none; user-select:none; -webkit-user-select:none; }
  .tt-stage.shake { animation:tt-shake .3s linear; }
  .tt-pillow { position:absolute; border-radius:40%; background:#fff; border:5px solid #111; box-shadow:inset 0 -8px 0 #e6e6f2; }
  /* The creature (lying on its back): colours from --bc (body) and --pc (tummy) */
  .tt-mon { position:absolute; left:0; top:0; width:100%; height:100%; pointer-events:none; }
  .tt-mon > * { position:absolute; box-sizing:border-box; }
  .tt-leg { width:var(--lw); height:calc(var(--lw) * 1.5); background:var(--bc); border:5px solid #111; border-radius:50% 50% 40% 40%; transform-origin:50% 100%;
    animation:tt-kick .5s ease-in-out infinite alternate; }
  .tt-leg::after { content:""; position:absolute; left:10%; right:10%; top:-4%; height:34%; background:var(--pc); border-radius:50%; border:4px solid #111; }   /* foot pads */
  .tt-leg.b { animation-delay:-.25s; }
  .tt-mon.giggle .tt-leg { animation-duration:.12s; }
  .tt-tail { width:var(--lw); height:calc(var(--lw) * 2.4); border:calc(var(--lw) * .3) solid #111; border-color:transparent transparent #111 #111; border-radius:50%; display:none;
    transform-origin:100% 0; animation:tt-swish .7s ease-in-out infinite alternate; }
  .tt-body { background:var(--bc); border:6px solid #111; border-radius:50%; box-shadow:inset -14px -12px 0 rgba(0,0,0,.12); }
  .tt-tummy { background:var(--pc); border-radius:50%; }
  .tt-mon.giggle .tt-body, .tt-mon.giggle .tt-tummy, .tt-mon.giggle .tt-patch { animation:tt-jiggle .1s linear infinite alternate; }
  .tt-head { background:var(--bc); border:6px solid #111; border-radius:50% 50% 46% 46%; z-index:2; }
  .tt-horn { width:calc(var(--hz) * .16); height:calc(var(--hz) * .24); background:#ffd400; border:4px solid #111; clip-path:polygon(50% 0, 100% 100%, 0 100%); z-index:1; }
  .tt-ear { width:calc(var(--hz) * .34); height:calc(var(--hz) * .34); background:#111; clip-path:polygon(50% 0, 100% 100%, 0 100%); z-index:1; display:none; }
  .tt-ear::after { content:""; position:absolute; inset:7px 9px 0; background:var(--bc); clip-path:polygon(50% 0, 100% 100%, 0 100%); }
  .tt-eye { width:calc(var(--hz) * .3); height:calc(var(--hz) * .3); background:#fff; border:5px solid #111; border-radius:50%; z-index:3; overflow:hidden; transition:height .15s; }
  .tt-eye i { position:absolute; left:28%; top:30%; width:46%; height:46%; background:#111; border-radius:50%; animation:tt-look 1.3s ease-in-out infinite alternate; }
  .tt-eye.r { animation-delay:-.6s; }
  .tt-brow { width:calc(var(--hz) * .3); height:calc(var(--hz) * .07); background:#111; border-radius:9px; z-index:4; opacity:0; transition:opacity .15s; }
  .tt-mouth { width:calc(var(--hz) * .34); height:calc(var(--hz) * .14); background:#5a0f1e; border:4px solid #111; border-radius:10% 10% 50% 50% / 14% 14% 86% 86%; z-index:3; overflow:hidden; transition:height .12s; }
  .tt-mouth::before { content:""; position:absolute; left:6%; right:6%; top:0; height:32%; background:repeating-linear-gradient(90deg, #fff 0 22%, #ddd 22% 25%); }
  .tt-whisk { width:calc(var(--hz) * .3); height:calc(var(--hz) * .1); border-top:3px solid #111; border-bottom:3px solid #111; z-index:4; display:none; }
  .tt-collar { height:calc(var(--hz) * .12); background:#e8173c; border:4px solid #111; border-radius:99px; z-index:2; display:none; text-align:center; font-size:calc(var(--hz) * .14); line-height:1; }
  .tt-mon.giggle .tt-mouth { height:calc(var(--hz) * .26); }
  .tt-mon.giggle .tt-eye { height:calc(var(--hz) * .09); }
  .tt-mon.giggle .tt-eye i { display:none; }
  .tt-mon.grumpy .tt-eye { height:calc(var(--hz) * .16); }
  .tt-mon.grumpy .tt-brow { opacity:1; }
  .tt-mon.grumpy .tt-mouth { height:calc(var(--hz) * .07); }
  .tt-mon.grumpy .tt-leg { animation-play-state:paused; }
  .tt-mon.grumpy .tt-tail { animation-duration:.18s; }
  .tt-mon.sad .tt-mouth { height:calc(var(--hz) * .06); border-radius:50% 50% 10% 10%; }
  /* The kitten version (Kitty Boss) */
  .tt-mon.kitty .tt-horn { display:none; } .tt-mon.kitty .tt-ear, .tt-mon.kitty .tt-whisk, .tt-mon.kitty .tt-collar, .tt-mon.kitty .tt-tail { display:block; }
  .tt-mon.kitty .tt-head::before { content:""; position:absolute; left:34%; right:34%; top:0; height:24%; background:repeating-linear-gradient(90deg, #d9731f 0 14%, transparent 14% 28%); }
  .tt-mon.kitty .tt-mouth { width:calc(var(--hz) * .22); }
  .tt-mon.kitty .tt-leg::before { content:""; position:absolute; left:8%; right:8%; top:-22%; height:18%; opacity:0; transition:opacity .1s;
    background:linear-gradient(90deg, transparent 10%, #fff 10% 22%, transparent 22% 44%, #fff 44% 56%, transparent 56% 78%, #fff 78% 90%, transparent 90%); clip-path:polygon(0 100%, 16% 0, 33% 100%, 50% 0, 66% 100%, 84% 0, 100% 100%); }
  .tt-mon.kitty.claws .tt-leg::before { opacity:1; }   /* claws out! */
  .tt-mood { font-size:calc(var(--hz) * .34); line-height:1; z-index:5; opacity:0; transition:opacity .15s; }
  .tt-mon.grumpy .tt-mood { opacity:1; animation:tt-pulse .3s ease-in-out infinite alternate; }

  /* The fluffy patches (the answers) */
  .tt-patch { position:absolute; left:0; top:0; width:var(--pr2); height:var(--pr2); margin:calc(var(--pr2) / -2) 0 0 calc(var(--pr2) / -2); border-radius:50%; z-index:3;
    background:conic-gradient(#ffd400 calc(var(--f) * 360deg), transparent 0); padding:7px; pointer-events:none; }
  .tt-patch b { display:flex; align-items:center; justify-content:center; width:100%; height:100%; border-radius:50%; background:#fff; border:4px dashed #111;
    font-weight:900; color:#111; line-height:1; white-space:nowrap; box-shadow:inset 0 -6px 0 rgba(0,0,0,.08); }
  .tt-patch.rub b { background:#fffbe0; }
  .tt-patch.right b { box-shadow:0 0 0 6px #ffd400, 0 0 26px 12px #ffd400; }
  .tt-patch.bad b { background:#ff5a6e; color:#fff; }
  .tt-patch.dim { opacity:.4; }
  .tt-feather { position:absolute; left:0; top:0; font-size:46px; line-height:1; margin:-38px 0 0 -8px; z-index:7; pointer-events:none; display:none; transform-origin:20% 90%; }
  .tt-feather.on { display:block; animation:tt-feather .18s ease-in-out infinite alternate; }
  .tt-claws { position:absolute; inset:0; z-index:9; pointer-events:none; }
  .tt-claw { position:absolute; left:-10%; width:120%; height:14px; margin-top:-7px; background:#fff; border:4px solid #b0002a; border-radius:99px; transform-origin:0 50%;
    box-shadow:0 0 0 3px rgba(255,255,255,.5); animation:tt-claw .22s ease-out both; }
  .tt-warn { position:absolute; left:50%; top:8px; transform:translateX(-50%); z-index:8; font-size:1.3rem; padding:4px 12px; background:#ffd400; border:4px solid #111; border-radius:99px;
    box-shadow:0 4px 0 #111; white-space:nowrap; display:none; pointer-events:none; }
  .tt-stage.grumpy .tt-warn { display:block; animation:tt-pulse .3s ease-in-out infinite alternate; }
  .tt-fx { position:absolute; inset:0; pointer-events:none; z-index:8; overflow:visible; }
  .tt-word { position:absolute; transform:translate(-50%, -50%) rotate(-8deg); font-size:2.1rem; color:#ffd400; -webkit-text-stroke:2px #111; paint-order:stroke fill;
    text-shadow:0 4px 0 #111; white-space:nowrap; pointer-events:none; animation:tt-word 1s ease-out forwards; }
  .tt-word.bad { color:#ff4d6d; }
  @keyframes tt-next { 0% { transform:scale(.4) rotate(-10deg); } 60% { transform:scale(1.25) rotate(4deg); } 100% { transform:none; } }
  @keyframes tt-kick { from { rotate:-14deg; } to { rotate:14deg; } }
  @keyframes tt-swish { from { rotate:-10deg; } to { rotate:22deg; } }
  @keyframes tt-jiggle { from { translate:-3px 1px; } to { translate:3px -2px; } }
  @keyframes tt-look { 0% { transform:translate(-30%, -10%); } 100% { transform:translate(30%, 10%); } }
  @keyframes tt-feather { from { rotate:-20deg; } to { rotate:20deg; } }
  @keyframes tt-claw { from { clip-path:inset(0 100% 0 0); } to { clip-path:inset(0 0 0 0); } }
  @keyframes tt-shake { 25% { transform:translate(-8px, 4px); } 50% { transform:translate(8px, -4px); } 75% { transform:translate(-6px, 2px); } }
  @keyframes tt-pulse { to { scale:1.15; } }
  @keyframes tt-word { from { opacity:1; scale:.5; } 25% { scale:1.15; } 75% { opacity:1; } to { opacity:0; translate:0 -40px; } }
  @media (prefers-reduced-motion: reduce) { .tt-leg, .tt-tail, .tt-eye i, .tt-card.next, .tt-word, .tt-feather.on, .tt-mon.giggle *, .tt-stage.shake { animation:none !important; } }
  `;
  function injectCss() {
    if (document.getElementById("tt-css")) return;
    const s = document.createElement("style"); s.id = "tt-css"; s.textContent = CSS; document.head.appendChild(s);
  }

  registerMicrogame({
    id: "tickle-tummy",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 14000,       // 3 tickles (the beats don't count)
    input: "drag",
    tutorial: true,
    bossArt: true,         // Boss Battle: Kitty Boss's finale (the kitten lies there)
    bossDuration: 36000,   // (18 s at the stage's 2×)

    start(ctx) {
      injectCss();
      const speed = ctx.speed || 1;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const { tone, sweep, noise } = ctx.sfx;
      const kitty = !!(window.Boss && window.Boss.fighting(ctx) === "kitty");
      const GOAL = 3, MISSES = 3;
      const N = speed >= 1.75 ? 4 : 3;
      const S = ctx.choiceSteps(GOAL, N, { lowercase: true });
      let si = 0, C = S[0];
      const grumpyOn = speed >= 2 && !ctx.demo; // the twist: only when it's fast

      // ---------- DOM ----------
      const wrap = document.createElement("div");
      wrap.className = "tt";
      const top = document.createElement("div");
      top.className = "tt-top";
      const card = document.createElement("button");
      card.className = "tt-card";
      card.setAttribute("aria-label", TEXT.cardLabel);
      card.innerHTML = '<span class="ct"></span>';
      const cardText = () => (C.listen ? C.target.text : C.cardText);
      card.firstChild.textContent = cardText();
      if (ctx.canSpeak) card.insertAdjacentHTML("beforeend", '<span class="spk">🔊</span>');
      card.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });
      const pips = document.createElement("div");
      pips.className = "tt-pips";
      pips.innerHTML = '<span class="tt-pip"></span>'.repeat(GOAL);
      const miss = document.createElement("div");
      miss.className = "tt-pips";
      miss.innerHTML = '<span class="tt-pip"></span>'.repeat(MISSES);
      top.append(pips, card, miss);
      const stage = document.createElement("div");
      stage.className = "tt-stage";
      const mon = document.createElement("div");
      mon.className = "tt-mon" + (kitty ? " kitty" : "");
      mon.style.setProperty("--bc", kitty ? "#ffa94d" : "#3ccfc0");
      mon.style.setProperty("--pc", kitty ? "#fff3dc" : "#dffaf0");
      mon.innerHTML = '<div class="tt-pillow"></div><div class="tt-tail"></div><div class="tt-leg a"></div><div class="tt-leg b"></div><div class="tt-leg b"></div><div class="tt-leg a"></div>' +
        '<div class="tt-body"></div><div class="tt-tummy"></div><div class="tt-ear l"></div><div class="tt-ear r"></div><div class="tt-horn l"></div><div class="tt-horn r"></div>' +
        '<div class="tt-head"></div><div class="tt-eye l"><i></i></div><div class="tt-eye r"><i></i></div><div class="tt-brow l"></div><div class="tt-brow r"></div>' +
        '<div class="tt-mouth"></div><div class="tt-whisk l"></div><div class="tt-whisk r"></div><div class="tt-collar">💎</div><div class="tt-mood">💢</div>';
      const q = (s) => mon.querySelector(s), qa = (s) => [...mon.querySelectorAll(s)];
      const feather = document.createElement("div");
      feather.className = "tt-feather"; feather.textContent = "🪶";
      const claws = document.createElement("div");
      claws.className = "tt-claws";
      const warn = document.createElement("div");
      warn.className = "tt-warn"; warn.textContent = "⚠️ 💢";
      const fx = document.createElement("div");
      fx.className = "tt-fx";
      stage.append(mon, feather, claws, warn, fx);
      wrap.append(top, stage);
      ctx.root.appendChild(wrap);

      // ---------- Layout ----------
      let W = 0, H = 0, bw = 200, bh = 140, cx = 0, cy = 0, pr = 40, hz = 80;
      const put = (el, x, y, w, h, rot) => {
        el.style.left = `${x - w / 2}px`; el.style.top = `${y - h / 2}px`; el.style.width = `${w}px`; el.style.height = `${h}px`;
        if (rot != null) el.style.transform = `rotate(${rot}deg)`;
      };
      function layout() {
        W = stage.clientWidth; H = stage.clientHeight;
        bw = Math.min(W * 0.84, H * 1.15, 520);
        bh = Math.min(bw * 0.7, H * 0.56);
        hz = Math.min(bw * 0.44, H * 0.34);
        cx = W / 2; cy = H - bh / 2 - Math.max(16, H * 0.11); // (room for the bottom legs)
        const headY = cy - bh / 2 - hz * 0.1;
        mon.style.setProperty("--hz", `${hz}px`);
        mon.style.setProperty("--lw", `${Math.max(26, bw * 0.12)}px`);
        put(q(".tt-pillow"), cx, headY - hz * 0.05, hz * 1.9, hz * 0.8);
        put(q(".tt-body"), cx, cy, bw, bh);
        put(q(".tt-tummy"), cx, cy + bh * 0.04, bw * 0.8, bh * 0.76);
        const lw = Math.max(26, bw * 0.12);
        const legs = qa(".tt-leg");
        // Each leg grows out of the edge of the round body: its base sits just inside the ellipse at angle t (from
        // straight up), pointing outward (they used to float off the body: the teacher).
        [-52, 52, -132, 132].forEach((t, i) => {
          const r = t * Math.PI / 180, bx = cx + Math.sin(r) * bw * 0.44, by = cy - Math.cos(r) * bh * 0.44;
          const l = legs[i];
          l.style.left = `${bx - lw / 2}px`; l.style.top = `${by - lw * 1.5}px`; l.style.width = `${lw}px`; l.style.height = `${lw * 1.5}px`;
          l.style.transform = `rotate(${t}deg)`;
        });
        put(q(".tt-tail"), cx + bw * 0.5, cy + bh * 0.15, lw, lw * 2.4);
        put(q(".tt-head"), cx, headY, hz, hz * 0.9);
        put(q(".tt-ear.l"), cx - hz * 0.3, headY - hz * 0.42, hz * 0.34, hz * 0.34, -18);
        put(q(".tt-ear.r"), cx + hz * 0.3, headY - hz * 0.42, hz * 0.34, hz * 0.34, 18);
        put(q(".tt-horn.l"), cx - hz * 0.22, headY - hz * 0.5, hz * 0.16, hz * 0.24, -14);
        put(q(".tt-horn.r"), cx + hz * 0.22, headY - hz * 0.5, hz * 0.16, hz * 0.24, 14);
        put(q(".tt-eye.l"), cx - hz * 0.19, headY - hz * 0.1, hz * 0.3, hz * 0.3);
        put(q(".tt-eye.r"), cx + hz * 0.19, headY - hz * 0.1, hz * 0.26, hz * 0.26);
        put(q(".tt-brow.l"), cx - hz * 0.19, headY - hz * 0.3, hz * 0.3, hz * 0.07, 18);
        put(q(".tt-brow.r"), cx + hz * 0.19, headY - hz * 0.3, hz * 0.3, hz * 0.07, -18);
        const m = q(".tt-mouth"); m.style.left = `${cx - hz * (kitty ? 0.11 : 0.17)}px`; m.style.top = `${headY + hz * 0.16}px`;
        put(q(".tt-whisk.l"), cx - hz * 0.42, headY + hz * 0.1, hz * 0.3, hz * 0.1, 8);
        put(q(".tt-whisk.r"), cx + hz * 0.42, headY + hz * 0.1, hz * 0.3, hz * 0.1, -8);
        put(q(".tt-collar"), cx, headY + hz * 0.46, hz * 0.7, hz * 0.12);
        put(q(".tt-mood"), cx + hz * 0.55, headY - hz * 0.4, hz * 0.34, hz * 0.34);
        // The patches: a row of 3 across the tummy, or 2 × 2.
        pr = N === 3 ? Math.min(bw * 0.13, bh * 0.25) : Math.min(bw * 0.13, bh * 0.19);
        stage.style.setProperty("--pr2", `${pr * 2}px`);
        const spots = N === 3 ? [[-0.27, 0.06], [0, 0.06], [0.27, 0.06]] : [[-0.18, -0.15], [0.18, -0.15], [-0.18, 0.23], [0.18, 0.23]];
        patches.forEach((p, i) => {
          p.x = cx + spots[i][0] * bw; p.y = cy + spots[i][1] * bh;
          p.el.style.left = `${p.x}px`; p.el.style.top = `${p.y}px`;
          sizeText(p);
        });
      }

      // ---------- The patches ----------
      let patches = [];
      function deal() {
        patches.forEach((p) => p.el.remove());
        patches = ctx.shuffle(C.row.slice()).map((o) => {
          const el = document.createElement("div");
          el.className = "tt-patch";
          el.style.setProperty("--f", 0);
          el.innerHTML = "<b></b>";
          el.firstChild.textContent = o.text;
          stage.insertBefore(el, feather);
          return { o, el, f: 0, x: 0, y: 0 };
        });
        layout();
      }
      function sizeText(p) {
        const len = Math.max(1, [...p.o.text].length);
        p.el.firstChild.style.fontSize = p.o.kind === "word" ? `${Math.min(pr * 0.62, (pr * 1.7) / (len * 0.6))}px` : `${pr * 0.9}px`;
      }
      const patchAt = (x, y) => patches.find((p) => Math.hypot(p.x - x, p.y - y) < pr * 1.15);

      // ---------- Rubbing ----------
      let hits = 0, scratches = 0, done = false, busy = false, grumpy = false, last = null, lastGig = 0;
      const local = (e) => { const r = stage.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
      stage.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        if (done || ctx.ended) return;
        last = local(e);
        feather.classList.add("on");
        moveFeather(last);
        if (!busy) { const p = patchAt(last.x, last.y); if (p) rub(p, pr * 0.85); } // a tap tickles a little
      });
      stage.addEventListener("pointermove", (e) => {
        if (!last) return;
        const p0 = local(e);
        const d = Math.hypot(p0.x - last.x, p0.y - last.y);
        last = p0;
        moveFeather(p0);
        if (done || busy || ctx.ended) return;
        const p = patchAt(p0.x, p0.y);
        if (p && d > 0) rub(p, Math.min(d, pr));
      });
      const up = () => { last = null; feather.classList.remove("on"); patches.forEach((p) => p.el.classList.remove("rub")); };
      stage.addEventListener("pointerup", up);
      stage.addEventListener("pointercancel", up);
      function moveFeather(p) { feather.style.transform = `translate(${p.x}px, ${p.y}px)`; }

      function rub(p, d) {
        if (grumpy) { scratch(p, true); return; }       // it was grumpy: SCRATCH
        p.f = Math.min(1, p.f + d / (pr * NEED));
        p.el.style.setProperty("--f", p.f.toFixed(3));
        patches.forEach((x) => x.el.classList.toggle("rub", x === p));
        const now = performance.now();
        if (p.o.right) {
          if (now - lastGig > 140) { lastGig = now; tone(600 + p.f * 700 + Math.random() * 120, 0.06, "triangle", 0.07); } // tee-hee-hee, rising
          mon.classList.add("giggle");
          clearTimeout(p.gt); p.gt = setTimeout(() => { if (!done && !busy) mon.classList.remove("giggle"); }, 220);
          if (p.f >= 1) tickled(p);
        } else if (p.f >= WRONG_AT) {
          scratch(p, false);
        } else if (now - lastGig > 200) { lastGig = now; tone(200, 0.05, "square", 0.05); } // hmm…
      }
      function tickled(p) {
        busy = true;
        const final = hits + 1 >= GOAL;
        if (final) ctx.freezeTimer();
        mon.classList.add("giggle");
        [0, 0.1, 0.2, 0.3, 0.4, 0.5].forEach((t, i) => tone(700 + (i % 2) * 220, 0.08, "triangle", 0.09, t)); // HEE HEE HEE
        word(TEXT.giggle[hits % TEXT.giggle.length], false, p.x, p.y - pr * 1.4);
        ctx.confetti(fx, p.x, p.y, { count: 30 });
        if (p.o.kind === "pic") ctx.say(p.o.spoken);
        pips.children[hits].classList.add("on");
        hits++;
        if (final) {
          done = true;
          ctx.win();
          up();
          ctx.later(() => {
            word(TEXT.laugh, false, cx, cy - bh * 0.7);
            for (let i = 0; i < 12; i++) tone(650 + (i % 3) * 180, 0.07, "triangle", 0.08, i * 0.11);
            if (!reduceMotion) mon.animate([{ rotate: "0deg" }, { rotate: "-10deg" }, { rotate: "10deg" }, { rotate: "0deg" }], { duration: 500, iterations: 3 });
            ctx.confetti(fx, W / 2, H * 0.4, { count: 90 });
          }, 400);
          return;
        }
        ctx.later(next, 650);
      }
      function scratch(p, wasGrumpy) {
        busy = true;
        const final = scratches + 1 >= MISSES;
        if (final) ctx.freezeTimer();
        up();
        mon.classList.remove("giggle");
        mon.classList.add("grumpy", "claws");
        if (!wasGrumpy) p.el.classList.add("bad");
        // Three claw marks rip across the screen.
        claws.innerHTML = "";
        const ang = -18 + Math.random() * 36, y0 = H * (0.3 + Math.random() * 0.2);
        for (let k = 0; k < 3; k++) {
          const c = document.createElement("div");
          c.className = "tt-claw";
          c.style.top = `${y0 + k * 30}px`;
          c.style.transform = `rotate(${ang}deg)`;
          c.style.animationDelay = `${k * 0.04}s`;
          claws.appendChild(c);
        }
        stage.classList.remove("shake"); void stage.offsetWidth; stage.classList.add("shake");
        noise(0.25, "highpass", 2500, 5000, 0.5); sweep(1400, 300, 0.25, "sawtooth", 0.09); // SCRRRATCH
        sweep(900, 500, 0.3, "sawtooth", 0.06, 0.15);                                      // hiss
        word(TEXT.scratch, true, cx, cy - bh * 0.5);
        miss.children[scratches].classList.add("x");
        scratches++;
        if (final) {
          done = true; ctx.lose();
          ctx.later(() => { claws.innerHTML = ""; showRight(); }, 700);
          ctx.say(C.answer);
          return;
        }
        ctx.later(() => {
          claws.innerHTML = "";
          mon.classList.remove("claws");
          if (!grumpy) mon.classList.remove("grumpy");
          patches.forEach((x) => { x.f = 0; x.el.style.setProperty("--f", 0); x.el.classList.remove("bad"); });
          busy = false;
        }, 800);
      }
      // The beat: the clock stops, the card pops to the next target, the voice says it, fresh patches.
      function next() {
        if (done) return;
        ctx.pauseTimer(BEAT_MS);
        C = S[++si];
        card.firstChild.textContent = cardText();
        card.classList.remove("next"); void card.offsetWidth; card.classList.add("next");
        tone(98, 0.08, "square", 0.1); tone(98, 0.08, "square", 0.1, 0.16);
        ctx.later(() => { if (!done) ctx.say(C.prompt); }, 150);
        mon.classList.remove("giggle");
        up();
        deal();
        ctx.later(() => { busy = false; }, 250);
      }
      // At 2× and up: now and then it gets GRUMPY for a moment (warned with ⚠️ 💢). Rubbing then = scratch.
      function grumpLoop(first) {
        if (done || ctx.ended) return;
        ctx.later(() => {
          if (done || ctx.ended) return;
          if (busy) { grumpLoop(false); return; }
          grumpy = true;
          mon.classList.add("grumpy"); stage.classList.add("grumpy");
          tone(150, 0.25, "sawtooth", 0.08); tone(140, 0.25, "sawtooth", 0.08, 0.2); // grrr
          word(TEXT.grumpy, true, cx + hz * 0.6, cy - bh * 0.8);
          ctx.later(() => {
            grumpy = false;
            stage.classList.remove("grumpy");
            if (!busy) mon.classList.remove("grumpy");
            grumpLoop(false);
          }, 1100);
        }, (first ? 2600 : 2400 + Math.random() * 1800));
      }
      function showRight() { patches.forEach((p) => p.el.classList.add(p.o.right ? "right" : "dim")); }
      function word(text, bad, x, y) {
        const w = document.createElement("div");
        w.className = "tt-word" + (bad ? " bad" : "");
        w.textContent = text;
        w.style.left = `${Math.max(60, Math.min(W - 60, x))}px`; w.style.top = `${Math.max(26, y)}px`;
        fx.appendChild(w);
        ctx.later(() => w.remove(), 1000);
      }
      function replay() { if (!done) ctx.say(C.prompt); }

      ctx.onTimeout(() => { done = true; up(); mon.classList.remove("giggle", "grumpy"); stage.classList.remove("grumpy"); mon.classList.add("sad"); word(TEXT.hmph, true, cx, cy - bh * 0.6); showRight(); ctx.say(C.answer); });
      function onKey(e) {
        const i = parseInt(e.key, 10) - 1;
        if (i >= 0 && i < patches.length && !busy && !done) { e.preventDefault(); rub(patches[i], pr * 1.2); }
        else if (e.key === " ") { e.preventDefault(); replay(); }
      }
      document.addEventListener("keydown", onKey);

      deal();
      const ro = new ResizeObserver(layout);
      ro.observe(stage);
      ctx.say(C.prompt);
      const rev = ctx.reveal(card) || 0;
      if (grumpyOn) ctx.later(() => grumpLoop(true), rev);
      // A small finger-only rub along the bottom of the tummy (never on a patch).
      ctx.later(() => ctx.hint({ x: cx - pr, y: cy + bh * 0.42 }, { x: cx + pr, y: cy + bh * 0.42 }, { small: true }), rev + 120);

      // Tutorial: point at the card, then rub the right patch back and forth (the card changes each time).
      ctx.tutorial(S.map((s) => s.target), async (f) => {
        const rootPt = (p, dx) => () => {
          const rr = ctx.root.getBoundingClientRect(), sr = stage.getBoundingClientRect();
          return { x: sr.left - rr.left + p.x + dx, y: sr.top - rr.top + p.y };
        };
        await f.point(card, 800);
        for (let n = 0; n < GOAL && !done; n++) {
          await f.until(() => !busy && hits === n, 3000);
          if (n) await f.point(card, 500);
          const p = patches.find((x) => x.o.right);
          const a = rootPt(p, -pr * 0.7), b = rootPt(p, pr * 0.7);
          await f.path([a, b, a, b, a, b, a, b, a], 130);
          await f.until(() => hits > n || done, 1500);
        }
      });
      return () => { done = true; ro.disconnect(); document.removeEventListener("keydown", onKey); patches.forEach((p) => clearTimeout(p.gt)); };
    },
  });
})();
