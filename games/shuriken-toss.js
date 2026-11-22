// SHURIKEN TOSS — the target letter (or word) sits in a card at the top, and the
// voice says it. A cannon on the left fires letter balls in slow arcs across a
// dusk sky. Tap a ball and the ninja on the right throws a homing shuriken at
// it (no need to lead the target). Slice 3 target balls to win.
//
// Right ball: SHING, it's sliced in half and the halves fall away.
// Wrong ball: the shuriken clinks off, the ball turns red and drops. Three wrong
// hits and the ninja is knocked out: you lose. Tapping empty sky is a free miss.
// Balls that fly off the right edge cost nothing.
// Phonics list: the card shows a letter (B), and the balls carry pictures. Hit 3 that start
// with B. Each hit says the picture's word.
// The first shot is always a target, so there's something to hit straight away.
// Faster speeds: balls fly faster and are fired more often, 4 in the air from 1.5×,
// and from 1.75× a target is fired at least every other shot.
(function () {
  const TEXT = {
    name: { en: "Shuriken Toss" },
    icon: "🥷",
    // Practice mode's "How to play" card: steps (icon + sentence) and tips.
    howTo: (list) => {
      const thing = list.type === "letter" ? "letter" : "word";
      if (list.type === "phonics") return { en: {
        steps: [
          ["👂", "Look at the letter on the card at the top and listen, like \"B\"."],
          ["💥", "A cannon shoots pictures across the sky."],
          ["👆", "Tap a picture that starts with B (ball, bee, bear…) and the ninja throws a shuriken at it. Hit 3 to win! ⭐⭐⭐"],
        ],
        tips: [
          "Only hit pictures that start with the letter! Three wrong hits and the ninja gets knocked out.",
          "Missing is OK. Tapping the empty sky costs nothing.",
          "Tap the card at the top to hear the letter again.",
          "When the game speeds up, the cannon shoots faster.",
        ],
      } };
      return { en: {
        steps: [
          ["👂", `Look at the card at the top and listen. That's your ${thing}.`],
          ["💥", `A cannon shoots ${thing}s across the sky.`],
          ["👆", `Tap your ${thing} and the ninja throws a shuriken at it. Hit 3 to win! ⭐⭐⭐`],
        ],
        tips: [
          `Only hit your ${thing}! Three wrong hits and the ninja gets knocked out.`,
          "Missing is OK. Tapping the empty sky costs nothing.",
          "Tap the card at the top to hear it again.",
          "When the game speeds up, the cannon shoots faster.",
        ],
      } };
    },
    instruction: (list) => ({ en: list.type === "letter" ? "HIT THE\nLETTER!" : list.type === "phonics" ? "HIT THE\nPICTURES!" : "HIT THE\nWORD!" }),
    prompt: (spoken, word) => (word ? `${spoken} for ${word}` : spoken),
    targetLabel: (spoken) => `Target: ${spoken}. Hear it again`,
    fieldLabel: "Sky. Tap a flying letter to throw a shuriken at it.",
    ninja: "🥷",
    ninjaKo: "😵",
    goodIcon: "⭐",
    badIcon: "💥",
    goodMark: "✓",
    badMark: "✕",
  };

  const NEED = 3;        // target hits to win
  const STRIKES = 3;     // wrong hits to lose
  const STAR_MS = 210;   // shuriken flight time
  const SLOP = 22;       // px of forgiveness around a ball when tapping
  const RINGS = ["#ff2e88", "#1e6bff", "#1fd65f", "#ff8a00", "#b04dff", "#00b5d8"];
  const STAR_SVG =
    '<svg viewBox="-55 -55 110 110" aria-hidden="true">' +
    '<polygon points="0,-50 13,-13 50,0 13,13 0,50 -13,13 -50,0 -13,-13" fill="#d5dce6" stroke="#111" stroke-width="7" stroke-linejoin="round"/>' +
    '<circle r="8" fill="#3b2a6a" stroke="#111" stroke-width="4"/></svg>';

  const CSS = `
  .st { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:8px; }

  /* ---- top bar: hits | target | strikes ---- */
  .st-top { flex:none; width:100%; display:flex; align-items:center; justify-content:space-between; gap:6px; }
  .st-side { flex:none; display:flex; flex-direction:column; align-items:center; gap:2px; width:84px; }
  .st-icon { font-size:1.6rem; line-height:1; transition:transform .15s; }
  .st-pips { display:flex; gap:4px; }
  .st-pip { width:24px; height:24px; border-radius:50%; background:#fff; border:4px solid #111; box-shadow:0 3px 0 #111;
    display:flex; align-items:center; justify-content:center; color:#fff; font-size:.85rem; line-height:1; }
  .st-pip.on { animation:st-pip .3s cubic-bezier(.2,1.8,.4,1); }
  .st-good .st-pip.on { background:#22c55e; }
  .st-bad .st-pip.on { background:#e8173c; }
  .st-bad[data-s="1"] .st-icon { transform:scale(1.15); }
  .st-bad[data-s="2"] .st-icon { transform:scale(1.35); animation:st-tremble .1s linear infinite alternate; }
  .st-target { flex:0 1 auto; min-width:0; min-height:64px; padding:2px 14px; display:flex; align-items:center; justify-content:center; gap:8px;
    background:#fff; border:5px solid #111; border-radius:18px; box-shadow:0 6px 0 #111; font:inherit; color:#111;
    touch-action:manipulation; animation:st-in .35s cubic-bezier(.2,1.8,.4,1) both; }
  .st-target:active { transform:translateY(4px); box-shadow:0 2px 0 #111; }
  .st-tt { font-size:3rem; line-height:1; white-space:nowrap; }
  .st-target.word .st-tt { font-size:2.2rem; }
  .st-spk { font-size:1.3rem; line-height:1; }
  .st-target.bump { animation:st-bump .25s ease-out; }

  /* ---- the sky ---- */
  .st-field { position:relative; flex:1; min-height:0; width:100%; overflow:hidden; touch-action:none; cursor:crosshair;
    background:linear-gradient(#24175a, #6a2f9a 55%, #ff8f5a);
    border:5px solid #111; border-radius:24px; box-shadow:0 6px 0 #111; }
  .st-moon { position:absolute; right:9%; top:7%; width:17%; max-width:90px; aspect-ratio:1; border-radius:50%;
    background:#fff6c8; border:4px solid #111; box-shadow:0 0 30px 8px rgba(255,246,200,.35); }
  .st-ground { position:absolute; left:0; right:0; bottom:0; height:12%; background:#8a5a2b; border-top:5px solid #111;
    background-image:repeating-linear-gradient(90deg, transparent 0 38px, rgba(0,0,0,.25) 38px 42px); }

  /* ---- the cannon ---- */
  .st-cannon { position:absolute; left:2%; bottom:6%; width:calc(var(--d) * 1.7); height:calc(var(--d) * 1.3); pointer-events:none; }
  .st-barrel { position:absolute; left:16%; bottom:32%; width:92%; height:42%; transform-origin:12% 50%; transform:rotate(-38deg);
    background:#3b3b4a; border:5px solid #111; border-radius:40% 8px 8px 40%; }
  .st-barrel::after { content:""; position:absolute; right:-12px; top:-9px; bottom:-9px; width:16px;
    background:#5a5a72; border:5px solid #111; border-radius:6px; }
  .st-muzzle { position:absolute; right:-6px; top:50%; width:2px; height:2px; }
  .st-cannon.fire .st-barrel { animation:st-recoil .25s ease-out; }
  .st-wheel { position:absolute; left:20%; bottom:0; width:50%; aspect-ratio:1; border-radius:50%;
    background:#a0662e; border:5px solid #111; box-shadow:inset 0 0 0 calc(var(--d) * .1) #7a4a1c; }
  .st-smoke { position:absolute; left:0; top:0; border-radius:50%; background:#eee; border:4px solid #111; pointer-events:none; }

  /* ---- the ninja ---- */
  /* The ninja, drawn in CSS so it can have silly googly eyes: a black hood with a skin-coloured eye slit,
     big mismatched rolling eyes, a red headband with two flapping tails. */
  .st-ninja { position:absolute; right:3%; bottom:5%; width:calc(var(--d) * 1.45); height:calc(var(--d) * 1.6); transform-origin:50% 100%;
    pointer-events:none; filter:drop-shadow(0 4px 0 rgba(0,0,0,.35)); }
  .st-nbody { position:absolute; inset:0; background:#2a2a35; border:4px solid #111; border-radius:46% 46% 30% 30%; }
  .st-nslit { position:absolute; left:6%; right:6%; top:24%; height:40%; background:#ffcf9e; border:3px solid #111; border-radius:40%; }
  .st-neye { position:absolute; top:18%; width:46%; aspect-ratio:1; background:#fff; border:3px solid #111; border-radius:50%; z-index:1; }
  .st-neye.l { left:4%; } .st-neye.r { right:6%; width:37%; top:23%; }
  .st-neye i { position:absolute; left:28%; top:30%; width:46%; aspect-ratio:1; background:#111; border-radius:50%; animation:st-goggle 1.1s ease-in-out infinite; }
  .st-neye.r i { animation-delay:-.45s; }
  .st-nband { position:absolute; left:-2%; right:-2%; top:12%; height:12%; background:#e8173c; border:3px solid #111; border-radius:6px; z-index:2; }
  .st-ntail { position:absolute; left:-30%; top:13%; width:34%; height:9%; background:#e8173c; border:3px solid #111; border-radius:6px; transform-origin:100% 50%;
    animation:st-flap .5s ease-in-out infinite alternate; z-index:0; }
  .st-ntail.b { top:20%; width:28%; animation-delay:-.25s; }
  .st-ninja.dazed .st-neye i { display:none; }
  .st-ninja.dazed .st-neye::before, .st-ninja.dazed .st-neye::after { content:""; position:absolute; left:14%; right:14%; top:42%; height:16%; background:#111; border-radius:9px; }
  .st-ninja.dazed .st-neye::before { transform:rotate(45deg); } .st-ninja.dazed .st-neye::after { transform:rotate(-45deg); }
  @keyframes st-goggle { 0%, 100% { transform:translate(-16%, 0); } 50% { transform:translate(16%, -12%); } }
  @keyframes st-flap { from { transform:rotate(-14deg); } to { transform:rotate(10deg); } }
  .st-ninja.throw { animation:st-throw .2s ease-out; }
  .st-ninja.cheer { animation:st-cheer .45s cubic-bezier(.2,1.8,.4,1) 3; }
  .st-ninja.ko { animation:st-ko .6s ease-out forwards; }

  /* ---- letter balls ---- */
  .st-fly { position:absolute; left:0; top:0; display:flex; align-items:center; justify-content:center;
    width:var(--d); height:var(--d); border-radius:50%; background:#fff; color:#111;
    border:5px solid #111; box-shadow:inset 0 0 0 5px var(--ring), 0 5px 0 rgba(0,0,0,.35);
    font-size:calc(var(--d) * .56); line-height:1; pointer-events:none; will-change:transform; }
  .st-fly.word { width:auto; height:calc(var(--d) * .8); padding:0 .45em; border-radius:999px; font-size:calc(var(--d) * .44); white-space:nowrap; }
  .st-fly.pic { font-size:calc(var(--d) * .6); }
  .st-fly.pic.wrong { -webkit-text-stroke:0; }
  .st-fly.wrong { background:#ff5a6e; color:#fff; -webkit-text-stroke:2px #111; paint-order:stroke fill; }
  .st-fly.glow { box-shadow:inset 0 0 0 5px var(--ring), 0 0 0 6px #ffd400, 0 0 26px 12px #ffd400; }
  /* Boss Battle: the ball's face moves to ::before, so the boss (z -2) can sit behind it and above the ball's own box */
  .st-fly.bossy { background:none; border-color:transparent; box-shadow:none; }
  .st-fly.bossy::before { content:""; position:absolute; inset:-5px; z-index:-1; border-radius:inherit; background:#fff; border:5px solid #111; box-shadow:inset 0 0 0 5px var(--ring), 0 5px 0 rgba(0,0,0,.35); }
  .st-fly.bossy .bx-carrier { z-index:-2; transform:translate(-50%, -62%); }
  .st-fly.bossy.wrong::before { background:#ff5a6e; }
  .st-fly.bossy.glow::before { box-shadow:inset 0 0 0 5px var(--ring), 0 0 0 6px #ffd400, 0 0 26px 12px #ffd400; }

  /* ---- shuriken and effects ---- */
  .st-star { position:absolute; left:0; top:0; width:calc(var(--d) * .55); height:calc(var(--d) * .55); pointer-events:none; z-index:3; }
  .st-star svg { width:100%; height:100%; display:block; animation:st-spin .22s linear infinite; }
  .st-slash { position:absolute; left:0; top:0; height:9px; background:#fff; border:3px solid #111; border-radius:9px;
    pointer-events:none; z-index:2; animation:st-slash .3s ease-out forwards; }
  .st-pow { position:absolute; width:var(--s); height:var(--s); margin:calc(var(--s) / -2) 0 0 calc(var(--s) / -2);
    background:#ffd400; pointer-events:none; z-index:1;
    clip-path:polygon(50% 0,61% 33%,96% 20%,72% 50%,98% 78%,62% 68%,50% 100%,38% 68%,2% 78%,28% 50%,4% 20%,39% 33%);
    animation:st-pow .35s ease-out forwards; }
  .st-x { position:absolute; font-size:var(--s); line-height:1; color:#e8173c; -webkit-text-stroke:4px #111; paint-order:stroke fill;
    transform:translate(-50%, -50%); pointer-events:none; z-index:4; animation:st-x .55s ease-out forwards; }
  .st.shake { animation:st-shake .45s linear; }

  @keyframes st-in      { from { transform:scale(.6); opacity:0; } }
  @keyframes st-bump    { 50% { transform:scale(1.12); } }
  @keyframes st-pip     { from { transform:scale(.3); } }
  @keyframes st-tremble { from { rotate:-8deg; } to { rotate:8deg; } }
  @keyframes st-recoil  { 30% { transform:rotate(-38deg) translateX(-14%); } }
  @keyframes st-throw   { 40% { transform:rotate(-16deg) scale(1.1); } }
  @keyframes st-cheer   { 50% { transform:translateY(-30%) rotate(10deg); } }
  @keyframes st-ko      { 30% { transform:rotate(-20deg); } 100% { transform:rotate(85deg) translateY(12%); } }
  @keyframes st-spin    { to { transform:rotate(360deg); } }
  @keyframes st-slash   { 0% { scale:0 1; opacity:1; } 55% { scale:1 1; opacity:1; } 100% { scale:1 1; opacity:0; } }
  @keyframes st-pow     { 0% { transform:scale(.2) rotate(0); opacity:1; } 100% { transform:scale(1.3) rotate(25deg); opacity:0; } }
  @keyframes st-x       { 0% { transform:translate(-50%,-50%) scale(.3); opacity:1; } 30% { transform:translate(-50%,-50%) scale(1.15); } 100% { transform:translate(-50%,-50%) scale(1); opacity:0; } }
  @keyframes st-shake   { 0%,100% { transform:none; } 15% { transform:translate(-10px,6px); } 30% { transform:translate(9px,-8px); }
    45% { transform:translate(-7px,-5px); } 60% { transform:translate(6px,7px); } 80% { transform:translate(-3px,2px); } }
  @media (prefers-reduced-motion: reduce) {
    .st-target, .st-pip.on, .st-bad .st-icon, .st-cannon.fire .st-barrel, .st-ninja.throw, .st-ninja.cheer, .st-neye i, .st-ntail,
    .st.shake, .st-star svg { animation:none; }
  }`;

  function injectCss() {
    if (document.getElementById("st-css")) return;
    const style = document.createElement("style");
    style.id = "st-css";
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  registerMicrogame({
    id: "shuriken-toss",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 13000, // needs 3 hits, and targets have to be fired first
    input: "tap",
    tutorial: true,
    bossArt: true, // Boss Battle: draws the boss itself when it's fought (ctx.boss, Boss.fighting) // has a ctx.tutorial script

    start(ctx) {
      const bossId = window.Boss ? window.Boss.fighting(ctx) : null; // Boss Battle: the balls are carried by boss clones
      injectCss();
      const isLetter = ctx.list.type === "letter";
      const isPhonics = ctx.list.type === "phonics";
      const round = isLetter || isPhonics; // a letter or a picture fits a round ball
      const speed = ctx.speed || 1;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const spoken = (it) => it.say || it.text;
      // `target` is what the card shows. Balls carry `rights` (hit these) and `distractors`.
      // Phonics: the card is a letter (B), rights are all its pictures (⚽ 🐝 🍌 🐻, taking turns),
      // distractors are pictures that start with other letters. Pictures are { text: emoji, say: word }.
      let target, rights, distractors, prompt;
      if (isPhonics) {
        target = ctx.items.find((it) => ctx.phonics.pics(it).length >= 2) || ctx.items[0];
        const set = ctx.phonics.set(target, 4, 6);
        const asItem = (p) => ({ text: p.emoji, say: p.word });
        rights = set.right.map(asItem);
        distractors = set.wrong.map(asItem);
        prompt = spoken(target);
      } else {
        target = ctx.items[0];
        rights = [target];
        distractors = ctx.pickOptions(target, Math.min(7, ctx.items.length)).filter((it) => it !== target);
        prompt = isLetter ? TEXT.prompt(spoken(target), target.word) : spoken(target);
      }
      const isTarget = (it) => rights.includes(it);
      let rightTurn = 0;
      const nextRight = () => rights[rightTurn++ % rights.length];
      const { tone, sweep, noise } = ctx.sfx;

      // Pace: slow, lazy arcs at 1×, quicker at higher speeds.
      const pace = 0.6 + 0.4 * speed;              // 1 at 1×, 1.6 at 2.5×
      const flightMs = 4200 / pace;
      const gapMs = 1000 / pace;
      const maxAir = speed >= 1.5 ? 4 : 3;
      const forceAfter = speed >= 1.75 ? 1 : 2;    // non-targets in a row before a target is forced

      let done = false, hits = 0, strikes = 0, sinceTarget = 0, lastItem = null;
      const flyers = [];   // letter balls
      const stars = [];    // shurikens in flight

      // ---------- DOM ----------
      const wrap = document.createElement("div");
      wrap.className = "st";

      const top = document.createElement("div");
      top.className = "st-top";
      const side = (cls, icon) => {
        const el = document.createElement("div");
        el.className = "st-side " + cls;
        el.innerHTML = `<div class="st-icon" aria-hidden="true"></div><div class="st-pips"></div>`;
        el.querySelector(".st-icon").textContent = icon;
        const pips = [];
        for (let i = 0; i < 3; i++) {
          const p = document.createElement("div");
          p.className = "st-pip";
          el.querySelector(".st-pips").appendChild(p);
          pips.push(p);
        }
        return { el, pips };
      };
      const good = side("st-good", TEXT.goodIcon);
      const bad = side("st-bad", TEXT.badIcon);

      const card = document.createElement("button");
      card.className = "st-target" + (round ? "" : " word");
      card.setAttribute("aria-label", TEXT.targetLabel(spoken(target)));
      const tt = document.createElement("span");
      tt.className = "st-tt";
      tt.textContent = target.text;
      card.appendChild(tt);
      const spk = document.createElement("span");
      spk.className = "st-spk";
      spk.setAttribute("aria-hidden", "true");
      spk.textContent = ctx.canSpeak ? "🔊" : (!isPhonics && target.emoji) || "";
      if (spk.textContent) card.appendChild(spk);
      card.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });
      card.addEventListener("click", (e) => { if (e.detail === 0) replay(); });
      top.append(good.el, card, bad.el);

      const field = document.createElement("div");
      field.className = "st-field";
      field.setAttribute("aria-label", TEXT.fieldLabel);
      field.innerHTML =
        '<div class="st-moon"></div><div class="st-ground"></div>' +
        '<div class="st-cannon"><div class="st-barrel"><div class="st-muzzle"></div></div><div class="st-wheel"></div></div>' +
        '<div class="st-ninja" aria-hidden="true"><div class="st-ntail"></div><div class="st-ntail b"></div><div class="st-nbody"></div><div class="st-nslit"></div>' +
        '<div class="st-nband"></div><div class="st-neye l"><i></i></div><div class="st-neye r"><i></i></div></div>';
      const cannon = field.querySelector(".st-cannon");
      const muzzle = field.querySelector(".st-muzzle");
      const ninja = field.querySelector(".st-ninja");


      wrap.append(top, field);
      ctx.root.appendChild(wrap);
      // ---------- Sizing ----------
      let fw = 0, fh = 0, d = 70;
      function measure() {
        const r = field.getBoundingClientRect();
        fw = r.width; fh = r.height;
        d = Math.max(54, Math.min(92, fw * 0.19, fh * 0.16));
        field.style.setProperty("--d", `${d}px`);
      }
      measure();
      const ro = new ResizeObserver(measure);
      ro.observe(field);

      // Centre of an element, in field coordinates.
      function centre(el) {
        const f = field.getBoundingClientRect(), r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2 - f.left, y: r.top + r.height / 2 - f.top };
      }
      const restart = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };

      // ---------- The cannon ----------
      function chooseItem() {
        const pool = distractors.filter((it) => it !== lastItem);
        const want = !pool.length || lastItem === null || sinceTarget >= forceAfter || Math.random() < 0.5;
        const it = want ? nextRight() : ctx.pick(pool);
        sinceTarget = want ? 0 : sinceTarget + 1;
        lastItem = it;
        return it;
      }

      function fire() {
        if (done || ctx.ended) return;
        if (flyers.filter((f) => !f.gone).length < maxAir) launch(chooseItem());
        ctx.later(fire, gapMs * (0.8 + Math.random() * 0.4));
      }

      function launch(item) {
        const m = centre(muzzle);
        const el = document.createElement("div");
        el.className = "st-fly" + (isPhonics ? " pic" : isLetter ? "" : " word");
        el.textContent = item.text;
        el.style.setProperty("--ring", ctx.pick(RINGS));
        // Boss Battle: each ball is held up by a flying clone of the boss (the slice cuts both in half).
        let boss = null;
        if (bossId) { el.classList.add("bossy"); boss = window.Boss.carrier(bossId, "calc(var(--d) * 1.25)"); el.prepend(boss); }
        field.insertBefore(el, cannon); // starts behind the barrel
        const f = {
          el, item, boss, t0: performance.now(), dur: flightMs * (0.9 + Math.random() * 0.2),
          x0f: m.x / fw, y0f: m.y / fh,                 // start: the muzzle
          y1f: 0.15 + Math.random() * 0.45,             // where it leaves the right edge
          apexf: 0.1 + Math.random() * 0.25,            // how high the arc goes
          wobble: (Math.random() - 0.5) * 24,
          x: m.x, y: m.y, base: "", claimed: false, gone: false,
        };
        flyers.push(f);
        place(f, f.t0);
        restart(cannon, "fire");
        boomSound();
        puff(m);
      }

      // Position along the arc. Stored as fractions so a resize doesn't throw balls around.
      function place(f, now) {
        const t = (now - f.t0) / f.dur;
        if (t >= 1) { f.gone = true; f.el.remove(); return; }
        const x0 = f.x0f * fw, y0 = f.y0f * fh, x1 = fw + d * 1.2, y1 = f.y1f * fh;
        const apex = Math.max(d / 2 + 6, f.apexf * fh);
        const h = (y0 + y1) / 2 - apex;
        f.x = x0 + (x1 - x0) * t;
        f.y = y0 + (y1 - y0) * t - 4 * h * t * (1 - t);
        f.base = `translate(${f.x}px,${f.y}px) translate(-50%,-50%) rotate(${f.wobble * Math.sin(t * Math.PI * 2)}deg)`;
        f.el.style.transform = `${f.base} scale(${Math.min(1, 0.35 + t * 8)})`;
      }

      function puff(at) {
        if (reduceMotion) return;
        for (let i = 0; i < 3; i++) {
          const p = document.createElement("div");
          p.className = "st-smoke";
          const s = d * (0.3 + Math.random() * 0.25);
          p.style.width = p.style.height = `${s}px`;
          field.appendChild(p);
          const dx = d * (0.3 + Math.random() * 0.5), dy = -d * (0.3 + Math.random() * 0.5);
          p.animate(
            [{ transform: `translate(${at.x - s / 2}px,${at.y - s / 2}px) scale(.4)`, opacity: 0.9 },
             { transform: `translate(${at.x - s / 2 + dx}px,${at.y - s / 2 + dy}px) scale(1.5)`, opacity: 0 }],
            { duration: 550 + Math.random() * 250, easing: "ease-out", fill: "forwards" });
          ctx.later(() => p.remove(), 850);
        }
      }

      // ---------- Throwing ----------
      function replay() {
        if (done) return;
        ctx.say(prompt);
        restart(card, "bump");
      }

      // The ball under (or near) the tap, if any. Balls already being aimed at are skipped.
      function nearest(p) {
        let best = null, bd = Infinity;
        flyers.forEach((f) => {
          if (f.gone || f.claimed) return;
          const r = f.el.getBoundingClientRect();
          const dx = Math.abs(p.x - f.x), dy = Math.abs(p.y - f.y);
          if (dx <= r.width / 2 + SLOP && dy <= r.height / 2 + SLOP) {
            const dd = dx * dx + dy * dy;
            if (dd < bd) { bd = dd; best = f; }
          }
        });
        return best;
      }

      // Throw at ball `f` (homing), or at point `p` when there's no ball (a free miss).
      function throwAt(f, p) {
        if (done || ctx.ended) return;
        const o = centre(ninja);
        o.y -= d * 0.25;
        restart(ninja, "throw");
        throwSound();
        const el = document.createElement("div");
        el.className = "st-star";
        el.innerHTML = STAR_SVG;
        field.appendChild(el);
        const s = { el, ox: o.x, oy: o.y, t0: performance.now(), f, px: p ? p.x : o.x, py: p ? p.y : o.y, done: false };
        if (f) f.claimed = true;
        stars.push(s);
        stepStar(s, s.t0);
      }

      function stepStar(s, now) {
        if (s.done) return;
        const t = Math.min(1, (now - s.t0) / STAR_MS);
        if (s.f && !s.f.gone) { s.px = s.f.x; s.py = s.f.y; } // home in on the ball
        const e = 1 - (1 - t) * (1 - t);
        s.x = s.ox + (s.px - s.ox) * e;
        s.y = s.oy + (s.py - s.oy) * e;
        s.el.style.transform = `translate(${s.x}px,${s.y}px) translate(-50%,-50%)`;
        if (t >= 1) { s.done = true; arrive(s); }
      }

      function arrive(s) {
        const f = s.f;
        if (!f || f.gone || done || ctx.ended) {
          thunkSound();
          s.el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: "forwards" });
          ctx.later(() => s.el.remove(), 320);
          return;
        }
        if (isTarget(f.item)) {
          if (isPhonics) ctx.say(spoken(f.item)); // "bee!"
          hits++;
          fill(good.pips[hits - 1], TEXT.goodMark);
          s.el.remove();
          slice(f);
          sliceSound();
          if (hits >= NEED) {
            done = true;
            ctx.win();
            ctx.confetti(field, f.x, f.y);
            restart(ninja, "cheer");
            flyers.forEach((x) => { if (!x.gone) drop(x); });
          }
        } else {
          strikes++;
          if (isPhonics) ctx.say(spoken(f.item)); // "duck" — not a B word
          fill(bad.pips[strikes - 1], TEXT.badMark);
          bad.el.dataset.s = String(strikes);
          f.el.classList.add("wrong");
          if (f.boss) window.Boss.setMood(f.boss, "laugh"); // the wrong boss laughs as it falls
          redX(f);
          bounceOff(s);
          drop(f);
          if (strikes >= STRIKES) {
            done = true;
            ctx.lose();
            knockOut();
          } else {
            clinkSound();
          }
        }
      }

      function fill(pip, mark) {
        pip.textContent = mark;
        pip.classList.add("on");
      }

      // Cut in two along the diagonal; the halves fly apart and fall.
      function slice(f) {
        f.gone = true;
        const at = { x: f.x, y: f.y };
        if (!reduceMotion) {
          [-1, 1].forEach((side) => {
            const half = f.el.cloneNode(true);
            half.style.clipPath = side < 0 ? "polygon(0 0,100% 0,0 100%)" : "polygon(100% 0,100% 100%,0 100%)";
            field.insertBefore(half, f.el);
            half.animate(
              [{ transform: f.el.style.transform, opacity: 1 },
               { transform: `${f.base} translate(${side * d * 0.9}px,${fh * 0.5}px) rotate(${side * 60}deg)`, opacity: 0 }],
              { duration: 750, easing: "cubic-bezier(.4,0,.8,.6)", fill: "forwards" });
            ctx.later(() => half.remove(), 800);
          });
          const sl = document.createElement("div");
          sl.className = "st-slash";
          const w = d * 1.6;
          sl.style.width = `${w}px`;
          sl.style.transform = `translate(${at.x - w / 2}px,${at.y - 4}px) rotate(-45deg)`;
          field.appendChild(sl);
          ctx.later(() => sl.remove(), 350);
          const p = document.createElement("div");
          p.className = "st-pow";
          p.style.cssText = `left:${at.x}px;top:${at.y}px;--s:${d * 1.3}px;`;
          field.insertBefore(p, f.el);
          ctx.later(() => p.remove(), 400);
          ctx.confetti(field, at.x, at.y, { count: 16 });
        }
        f.el.remove();
      }

      // Stop flying and tumble off the bottom.
      function drop(f) {
        f.gone = true;
        f.el.animate(
          [{ transform: f.el.style.transform },
           { transform: `${f.base} translate(0,${fh}px) rotate(140deg)` }],
          { duration: 900, easing: "cubic-bezier(.5,0,.9,.5)", fill: "forwards" });
        ctx.later(() => f.el.remove(), 950);
      }

      function bounceOff(s) {
        const away = s.x < s.ox ? -1 : 1;
        s.el.animate(
          [{ transform: s.el.style.transform, opacity: 1 },
           { transform: `translate(${s.x + away * d}px,${s.y + d * 1.5}px) translate(-50%,-50%) rotate(200deg)`, opacity: 0 }],
          { duration: 450, easing: "ease-in", fill: "forwards" });
        ctx.later(() => s.el.remove(), 480);
      }

      function redX(f) {
        const x = document.createElement("div");
        x.className = "st-x";
        x.textContent = "✕";
        x.style.cssText = `left:${f.x}px;top:${f.y}px;--s:${d * 0.9}px;`;
        field.appendChild(x);
        ctx.later(() => x.remove(), 600);
      }

      // Third wrong hit: POW, the ninja is knocked flat and everything falls.
      function knockOut() {
        koSound();
        const at = centre(ninja);
        const p = document.createElement("div");
        p.className = "st-pow";
        p.style.cssText = `left:${at.x}px;top:${at.y}px;--s:${d * 2}px;`;
        field.insertBefore(p, ninja);
        ctx.later(() => p.remove(), 400);
        ninja.classList.add("dazed"); // X eyes
        ninja.classList.add("ko");
        if (!reduceMotion) wrap.classList.add("shake");
        flyers.forEach((x) => { if (!x.gone) drop(x); });
      }

      ctx.onTimeout(() => {
        done = true;
        flyers.forEach((f) => { if (!f.gone && isTarget(f.item)) f.el.classList.add("glow"); });
      });

      // ---------- Input ----------
      field.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        if (done || ctx.ended) return;
        const r = field.getBoundingClientRect();
        const p = { x: e.clientX - r.left, y: e.clientY - r.top };
        throwAt(nearest(p), p);
      });

      // Desktop keyboard: type a letter to throw at a ball with it, space to replay.
      function onKey(e) {
        if (done) return;
        if (e.key === " ") { e.preventDefault(); replay(); return; }
        if (!isLetter || e.key.length !== 1) return;
        const f = flyers.find((x) => !x.gone && !x.claimed && x.item.text.toUpperCase() === e.key.toUpperCase());
        if (f) throwAt(f, null);
      }
      document.addEventListener("keydown", onKey);

      // ---------- Loop ----------
      function frame() {
        const now = performance.now();
        flyers.forEach((f) => { if (!f.gone) place(f, now); });
        stars.forEach((s) => stepStar(s, now));
        for (let i = flyers.length - 1; i >= 0; i--) if (flyers[i].gone) flyers.splice(i, 1);
        for (let i = stars.length - 1; i >= 0; i--) if (stars[i].done) stars.splice(i, 1);
        ctx.raf(frame);
      }

      // ---------- Sound effects ----------
      const boomSound = () => { noise(0.22, "lowpass", 1200, 90, 0.45); sweep(160, 55, 0.18, "sine", 0.35); };
      const throwSound = () => noise(0.12, "bandpass", 1800, 5000, 0.2);
      const sliceSound = () => {
        noise(0.08, "highpass", 3000, 8000, 0.35);
        tone(1318, 0.08, "square", 0.07, 0.03);
        tone(1760, 0.14, "square", 0.07, 0.09);
      };
      const clinkSound = () => {
        tone(2400, 0.06, "square", 0.08);
        tone(3100, 0.12, "triangle", 0.08, 0.03);
        sweep(420, 160, 0.25, "sawtooth", 0.1, 0.06);
      };
      const thunkSound = () => noise(0.06, "lowpass", 800, 200, 0.3);
      const koSound = () => {
        tone(2400, 0.06, "square", 0.08);
        noise(0.3, "lowpass", 900, 100, 0.5, 0.04);
        sweep(600, 90, 0.6, "square", 0.1, 0.08);
      };

      ctx.say(prompt);
      // Show the target big in the middle for a moment before play starts (ctx.reveal).
      ctx.later(fire, 500 + ctx.reveal(card)); // the first shot waits for it
      ctx.raf(frame);


      // Tutorial: point at the card, then tap 3 target balls in flight (early enough to catch them).
      ctx.tutorial(target, async (f) => {
        await f.point(card);
        await f.move(field, 400);
        const live = () => flyers.find((b) => !b.gone && !b.claimed && rights.includes(b.item) && b.x > fw * 0.12 && b.x < fw * 0.55);
        for (let n = 0; n < 8 && hits < 3 && !done; n++) {
          if (!(await f.until(live, 7000))) break;
          const b = live(), before = hits;
          await f.tap(() => (b.gone ? null : b.el));
          await f.until(() => hits > before || b.gone, 2000); // let the shuriken land
        }
      });

      return function cleanup() {
        done = true;
        ro.disconnect();
        document.removeEventListener("keydown", onKey);
      };
    },
  });
})();
