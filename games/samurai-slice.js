// SAMURAI SLICE! — a samurai stands in the middle, surrounded by bandits.
// The samurai's chest plate shows what to find; each bandit holds an answer.
// The player swipes across the right bandit to slice it.
//
//   ABC:     the samurai is a capital (B) and the bandits are lowercase, or the other way round.
//   PHONICS: the samurai is a letter (B) and the bandits hold pictures; slice one that starts with it (⚽).
//   CVC:     the samurai holds a word (cat) and the bandits hold pictures; slice 🐱.
//   HFW:     the samurai shows 🔊 and says a word; the bandits hold words; slice that word.
//
// Right slice: the bandit splits in two along the swipe, with a confetti explosion.
// Wrong slice: the sword clangs off, that bandit goes sad (droops, cries) and the right one glows.
// Slice 3 to win (⭐ pips, top left): the target stays the same and each slice brings a fresh wave of
// bandits (a wrong slice still loses). A tap doesn't slice: it shows the SLICE! hint again where the finger landed.
// Tap the samurai to hear it again. Faster speeds add bandits (5 at 1.5×, 6 at 2×), and from
// 1.5× they slowly circle the samurai.
(function () {
  const TEXT = {
    name: { en: "Samurai Slice" },
    icon: "⚔️",
    // Practice mode's "How to play" card: steps (icon + sentence) and tips.
    howTo: (list) => {
      const find = {
        letter: [["👂", "The samurai has a letter, like big B, and says it."],
          ["🔍", "Bandits are all around! Find the bandit with the matching letter: little b. (If the samurai has little b, find big B!)"]],
        phonics: [["👂", "The samurai has a letter, like B, and says it."],
          ["🔍", "Bandits are all around! Find the bandit holding a picture that starts with B, like ⚽ ball."]],
        cvc: [["👂", "The samurai has a word, like cat, and says it."],
          ["🔍", "Bandits are all around! Find the bandit holding that picture: 🐱."]],
        hfw: [["👂", "Listen! The samurai says a word, like \"the\"."],
          ["🔍", "Bandits are all around! Find the bandit holding that word."]],
      }[list.type] || [];
      return { en: {
        steps: [...find, ["⚔️", "Swipe your finger across that bandit to slice it! Slice 3 to win. ⭐⭐⭐"]],
        tips: [
          "Tapping doesn't slice. Swipe right across the bandit!",
          "Slice 3 bandits to win: after each one, a new gang rushes in. Slice a wrong bandit and it gets sad, the right one glows, and the game is over.",
          "Tap the samurai to hear it again.",
          "When the game speeds up, there are more bandits and they circle around.",
        ],
      } };
    },
    instruction: (list) => ({ en: list.type === "letter" ? "SLICE THE\nMATCH!" : list.type === "hfw" ? "SLICE THE\nWORD!" : "SLICE THE\nPICTURE!" }),
    answer: (spoken, word) => (word ? `${spoken} for ${word}` : spoken),
    listen: "🔊",
    tear: "💧",
    samuraiLabel: "Samurai. Tap to hear it again.",
    foeLabel: (spoken) => `Bandit with ${spoken}. Press Enter to slice.`,
  };

  const SAMURAI_COLORS = ["#1e6bff", "#b04dff", "#00b37a", "#ff8a00"];
  const FOE_COLORS = ["#ff2e3b", "#1e9bff", "#1fd65f", "#ff8a00", "#b04dff", "#ff4fb3"];
  const SLICE_MIN = 22; // px a finger must travel before it counts as a slice, not a tap
  const NEED = 3;     // right slices to win (each brings a fresh wave of bandits)

  const CSS = `
  .ss { position:absolute; inset:0; overflow:hidden; touch-action:none; user-select:none; -webkit-user-select:none; }
  .ss-ring { position:absolute; border-radius:50%; background:rgba(255,255,255,.2); border:4px dashed rgba(17,17,17,.22); pointer-events:none; }

  /* The samurai: font-size is its size, everything inside is in em */
  .ss-sam { position:absolute; width:1em; height:1em; margin:-.5em 0 0 -.5em; font-size:var(--S); z-index:4; cursor:pointer; }
  .ss-sam-in { position:absolute; inset:0; animation:ss-breathe 1.1s ease-in-out infinite alternate; transform-origin:50% 100%; }
  .ss-body { position:absolute; inset:0; background:var(--sc); border:.04em solid #111; border-radius:.26em; box-shadow:0 .05em 0 #111; }
  .ss-band { position:absolute; left:-.03em; right:-.03em; top:.09em; height:.12em; background:#e8202a; border:.03em solid #111; border-radius:.03em; z-index:2; }
  .ss-band::before { content:""; position:absolute; left:46%; top:20%; width:.1em; height:.1em; margin-top:-.02em; background:#fff; border-radius:50%;
    box-shadow:inset 0 0 0 .025em #e8202a; }
  .ss-tail { position:absolute; left:94%; top:.11em; width:.24em; height:.065em; background:#e8202a; border:.022em solid #111; border-radius:.03em;
    transform-origin:0 50%; z-index:1; animation:ss-flap .28s ease-in-out infinite alternate; }
  .ss-tail.b { top:.17em; width:.2em; animation-delay:-.14s; --r:28deg; }
  .ss-eye { position:absolute; top:.25em; width:.17em; height:.17em; background:#fff; border:.03em solid #111; border-radius:50%; z-index:2; }
  .ss-eye.l { left:.22em; } .ss-eye.r { right:.22em; }
  .ss-eye::after { content:""; position:absolute; left:28%; top:30%; width:46%; height:46%; background:#111; border-radius:50%; }
  .ss-eye::before { content:""; position:absolute; left:-20%; right:-20%; top:-34%; height:24%; background:#111; border-radius:99px; z-index:1; }
  .ss-eye.l::before { transform:rotate(18deg); } .ss-eye.r::before { transform:rotate(-18deg); }
  .ss-plate { position:absolute; left:.12em; right:.12em; top:.47em; bottom:.09em; background:#fff; border:.03em solid #111; border-radius:.12em;
    display:flex; align-items:center; justify-content:center; overflow:hidden; z-index:2; }
  .ss-ptxt { font-size:.36em; line-height:1; color:var(--sc); -webkit-text-stroke:.05em #111; paint-order:stroke fill; white-space:nowrap; }
  .ss-ptxt.word { font-size:calc(.36em * var(--fit, 1)); }
  .ss-ptxt.listen { -webkit-text-stroke:0; font-size:.3em; animation:ss-listen .7s ease-in-out infinite alternate; }
  .ss-sword { position:absolute; left:.86em; top:.5em; width:.09em; height:.95em; z-index:0; transform-origin:50% 92%;
    transform:translateY(-92%) rotate(22deg); }
  .ss-blade { position:absolute; left:0; right:0; top:0; height:72%; background:linear-gradient(90deg,#f4f7fb 0 55%,#b8c2cf 55%);
    border:.02em solid #111; border-radius:50% 50% .01em .01em / 18% 18% 0 0; }
  .ss-guard { position:absolute; left:-.06em; right:-.06em; top:70%; height:.05em; background:#ffc107; border:.02em solid #111; border-radius:.03em; }
  .ss-hilt { position:absolute; left:.005em; right:.005em; top:75%; bottom:0; border:.02em solid #111; border-radius:.02em;
    background:repeating-linear-gradient(45deg,#2b2b2b 0 .03em,#7a1f1f .03em .06em); }
  .ss-sweat { position:absolute; left:-.12em; top:.1em; font-size:.22em; opacity:0; z-index:3; }
  .ss.strike .ss-sam-in { animation:ss-dash .32s cubic-bezier(.2,1.6,.4,1); }
  .ss.strike .ss-sword { animation:ss-swing .32s ease-out; }
  .ss.won .ss-sam-in { animation:ss-jump .45s cubic-bezier(.2,1.8,.4,1) 3; }
  .ss.oops .ss-sam-in { animation:ss-no .45s ease-in-out 2; }
  .ss.oops .ss-sweat { opacity:1; animation:ss-drip .8s ease-in infinite; }

  /* Bandits */
  .ss-foe { position:absolute; left:0; top:0; width:1em; height:1em; margin:-.5em 0 0 -.5em; font-size:var(--E); z-index:5; will-change:transform; }
  .ss-bod { position:absolute; inset:0; animation:ss-hop .45s ease-in-out infinite alternate; animation-delay:var(--d, 0s); }
  .ss-disc { position:absolute; inset:0; background:#fff; border:.08em solid var(--c); border-radius:50%;
    box-shadow:0 0 0 .035em #111, 0 .06em 0 .035em #111; display:flex; align-items:center; justify-content:center; overflow:hidden; }
  .ss-txt { font-size:.6em; line-height:1; color:var(--c); -webkit-text-stroke:.06em #111; paint-order:stroke fill; white-space:nowrap; }
  .ss-txt.pic { font-size:.56em; -webkit-text-stroke:0; }
  .ss-txt.word { font-size:var(--fs, .46em); color:#111; -webkit-text-stroke:0; }
  /* Sight-word bandits are wide pills, so even "because" fits at a readable size */
  .ss-foe.word { width:1.8em; height:.86em; margin:-.43em 0 0 -.9em; }
  .ss-foe.word .ss-disc { border-radius:.43em; }
  .ss-foe.word .ss-feyes { left:31%; right:31%; top:-26%; height:52%; }
  .ss-feyes { position:absolute; left:16%; right:16%; top:-16%; height:30%; display:flex; justify-content:space-between; z-index:2; }
  .ss-feye { position:relative; width:.27em; height:.27em; background:#fff; border:.04em solid #111; border-radius:50%; }
  .ss-feye::after { content:""; position:absolute; left:26%; top:34%; width:48%; height:48%; background:#111; border-radius:50%; transition:top .2s; }
  .ss-feye::before { content:""; position:absolute; left:-18%; right:-18%; top:-32%; height:26%; background:#111; border-radius:99px; z-index:1; transition:transform .2s; }
  .ss-feye.l::before { transform:rotate(24deg); } .ss-feye.r::before { transform:rotate(-24deg); }
  .ss-ftear { position:absolute; left:14%; top:16%; font-size:.26em; opacity:0; z-index:3; }
  .ss-foe.sad { z-index:6; }
  .ss-foe.sad .ss-bod { animation:ss-sad .6s ease-out forwards; }
  .ss-foe.sad .ss-disc { filter:saturate(.35); }
  .ss-foe.sad .ss-feye.l::before { transform:rotate(-26deg); } .ss-foe.sad .ss-feye.r::before { transform:rotate(26deg); }
  .ss-foe.sad .ss-feye::after { top:48%; }
  .ss-foe.sad .ss-ftear { opacity:1; animation:ss-drip .7s ease-in infinite; }
  .ss-foe.answer { z-index:6; }
  .ss-foe.answer .ss-bod { animation:ss-glow .4s ease-in-out infinite alternate; }
  .ss-foe.cut .ss-bod { visibility:hidden; }
  .ss-halves { position:absolute; inset:0; pointer-events:none; }
  .ss-half { position:absolute; inset:0; }
  .ss-half.top { clip-path:inset(-60% -60% 50% -60%); }
  .ss-half.bot { clip-path:inset(50% -60% -60% -60%); }
  .ss-foe.cut .ss-half > .ss-bod { animation:none; visibility:visible; }

  .ss-fx { position:absolute; inset:0; pointer-events:none; z-index:8; overflow:visible; }
  /* 3 to slice: ⭐ pips in the top-left corner; the rest of a wave run away before the next rushes in */
  .ss-pips { position:absolute; left:8px; top:8px; display:flex; gap:5px; z-index:7; pointer-events:none; }
  .ss-pip { width:26px; height:26px; border:3px solid #111; border-radius:50%; background:#fff; box-shadow:0 3px 0 #111; display:flex; align-items:center; justify-content:center; font-size:15px; line-height:1; }
  .ss-pip.on { background:#ffd400; } .ss-pip.on::after { content:"⭐"; }
  .ss-foe.flee { transition:opacity .35s ease-in; opacity:0; }
  .ss-slash { position:absolute; height:12px; margin-top:-6px; border-radius:99px; background:#fff; border:4px solid #111; transform-origin:0 50%; }
  .ss-trail { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; z-index:9; overflow:visible; }

  @keyframes ss-breathe { from { transform:scale(1, 1); } to { transform:scale(1.03, .97); } }
  @keyframes ss-flap    { from { transform:rotate(var(--r, 12deg)); } to { transform:rotate(calc(var(--r, 12deg) - 22deg)); } }
  @keyframes ss-listen  { to { transform:scale(1.15) rotate(-6deg); } }
  @keyframes ss-dash    { 40% { transform:scale(1.12) rotate(-8deg); } }
  @keyframes ss-swing   { 0% { transform:translateY(-92%) rotate(22deg); } 45% { transform:translateY(-92%) rotate(-140deg); } 100% { transform:translateY(-92%) rotate(22deg); } }
  @keyframes ss-jump    { 40% { transform:translateY(-16%) scale(1.06); } }
  @keyframes ss-no      { 25% { transform:rotate(-8deg); } 75% { transform:rotate(8deg); } }
  @keyframes ss-drip    { 0% { transform:translateY(0) scale(.6); opacity:0; } 20% { opacity:1; } 100% { transform:translateY(.8em) scale(1); opacity:0; } }
  @keyframes ss-hop     { from { transform:translateY(0) rotate(-5deg); } to { transform:translateY(-7%) rotate(5deg); } }
  @keyframes ss-sad     { 30% { transform:translateX(-8%) rotate(-10deg); } 55% { transform:translateX(6%) rotate(6deg); } 100% { transform:translateY(12%) scale(.9) rotate(-6deg); } }
  @keyframes ss-glow    { from { transform:scale(1); filter:drop-shadow(0 0 0 #fff); } to { transform:scale(1.18); filter:drop-shadow(0 0 10px #fff) drop-shadow(0 0 4px #fff); } }
  @media (prefers-reduced-motion: reduce) {
    .ss-sam-in, .ss-tail, .ss-bod, .ss-ptxt.listen, .ss-sword, .ss-sweat, .ss-ftear { animation:none !important; }
    .ss-foe.sad .ss-bod { transform:translateY(12%) scale(.9); }
  }`;

  function injectCss() {
    if (document.getElementById("ss-css")) return;
    const style = document.createElement("style");
    style.id = "ss-css";
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  // Distance from point p to the segment a–b.
  function segDist(p, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const len2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2));
    return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
  }

  // Shrink factor so a word fits: 1 for up to 3 letters, smaller after that.
  const fitFor = (text) => Math.min(1, 3.2 / Math.max(1, text.length)).toFixed(3);

  registerMicrogame({
    id: "samurai-slice",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 12000, // 3 bandits to slice (it used to be one, which was over too quickly)
    input: "slice",
    tutorial: true,
    bossArt: true, // Boss Battle: draws the boss itself when it's fought (ctx.boss, Boss.fighting) // has a ctx.tutorial script

    start(ctx) {
      injectCss();
      const type = ctx.list.type;
      const speed = ctx.speed || 1;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const n = speed >= 2 ? 6 : speed >= 1.5 ? 5 : 4;
      const orbit = speed >= 1.5 && !reduceMotion ? 0.12 * (speed - 1) : 0; // radians per second
      const letterName = (it) => it.say || it.text.toUpperCase(); // TTS reads a lone "a" as "uh"
      let done = false, hits = 0;

      // ---------- Content: what the samurai shows and what each bandit holds ----------
      // foe: { text, kind: "letter" | "pic" | "word", right, spoken }
      // Slice 3 to win (the teacher found one slice over too quickly): the target stays the same, and each
      // slice brings a fresh wave of bandits (new distractors; phonics: a different picture of the letter).
      let samText, samKind, prompt, answer, answerItem; // answerItem: the list item this round is about
      let makeFoes;                                     // (w) => the bandits of wave w
      if (type === "letter") {
        const target = ctx.items[0];
        answerItem = target;
        const upper = Math.random() < 0.5; // samurai capital → bandits lowercase, and vice versa
        // I and l look the same across cases, so never put them together.
        const il = (a, b) => [a, b].map((x) => x.text.toUpperCase()).sort().join("") === "IL";
        samText = upper ? target.text.toUpperCase() : target.text.toLowerCase();
        samKind = "letter";
        prompt = answer = letterName(target);
        makeFoes = () => {
          const others = ctx.pickOptions(target, n + 2).filter((o) => o !== target && !il(o, target));
          const opts = [target, ...others.slice(0, n - 1)]; // the right answer always makes the cut
          return opts.map((o) => ({ text: upper ? o.text.toLowerCase() : o.text.toUpperCase(), kind: "letter", right: o === target, spoken: letterName(o) }));
        };
      } else if (type === "phonics") {
        const pool = ctx.items.filter((it) => ctx.phonics.pics(it).length);
        const target = pool[0];
        answerItem = target;
        const set = ctx.phonics.set(target, NEED, (n - 1) * NEED);
        samText = target.text.toUpperCase();
        samKind = "letter";
        prompt = letterName(target);
        answer = TEXT.answer(letterName(target), set.right[0].word);
        makeFoes = (w) => {
          const right = set.right[w % set.right.length];
          let wrong = set.wrong.slice(w * (n - 1), (w + 1) * (n - 1));
          if (wrong.length < n - 1) wrong = ctx.shuffle(set.wrong.slice()).slice(0, n - 1);
          return [right, ...wrong].map((p) => ({ text: p.emoji, kind: "pic", right: p === right, spoken: p.word }));
        };
      } else if (type === "cvc") {
        const pool = ctx.items.filter((it) => it.emoji);
        const target = pool[0];
        answerItem = target;
        samText = target.text;
        samKind = "word";
        prompt = answer = target.say || target.text;
        makeFoes = () => {
          const picks = [];
          for (const o of [...ctx.pickOptions(target, 12), ...ctx.shuffle(pool.slice())]) {
            if (picks.length >= n - 1) break;
            if (o !== target && o.emoji && !picks.includes(o)) picks.push(o);
          }
          return [target, ...picks].map((o) => ({ text: o.emoji, kind: "pic", right: o === target, spoken: o.say || o.text }));
        };
      } else { // hfw: the samurai only hears the word
        const target = ctx.items[0];
        answerItem = target;
        samText = ctx.canSpeak ? TEXT.listen : target.text; // listening games off: show the word
        samKind = ctx.canSpeak ? "listen" : "word";
        prompt = answer = target.say || target.text;
        makeFoes = () => [target, ...ctx.pickOptions(target, n + 1).filter((o) => o !== target).slice(0, n - 1)]
          .map((o) => ({ text: o.text, kind: "word", right: o === target, spoken: o.say || o.text }));
      }
      const bossId = window.Boss ? window.Boss.fighting(ctx) : null; // Boss Battle: the bandits are boss clones

      // ---------- DOM ----------
      const wrap = document.createElement("div");
      wrap.className = "ss";
      const ring = document.createElement("div");
      ring.className = "ss-ring";
      const sam = document.createElement("div");
      sam.className = "ss-sam";
      sam.setAttribute("role", "button");
      sam.setAttribute("tabindex", "0");
      sam.setAttribute("aria-label", TEXT.samuraiLabel);
      sam.style.setProperty("--sc", ctx.pick(SAMURAI_COLORS));
      sam.innerHTML =
        '<div class="ss-sam-in">' +
        '<div class="ss-sword"><div class="ss-blade"></div><div class="ss-guard"></div><div class="ss-hilt"></div></div>' +
        '<div class="ss-body"></div><div class="ss-tail"></div><div class="ss-tail b"></div><div class="ss-band"></div>' +
        '<div class="ss-eye l"></div><div class="ss-eye r"></div>' +
        '<div class="ss-plate"><span class="ss-ptxt"></span></div><div class="ss-sweat">💦</div></div>';
      const ptxt = sam.querySelector(".ss-ptxt");
      ptxt.textContent = samText;
      if (samKind !== "letter") ptxt.classList.add(samKind);
      if (samKind === "word") ptxt.style.setProperty("--fit", fitFor(samText));

      const fx = document.createElement("div");
      fx.className = "ss-fx";
      const trailSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      trailSvg.setAttribute("class", "ss-trail");
      trailSvg.innerHTML =
        '<path fill="none" stroke="#111" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<path fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>';
      const trailPaths = [...trailSvg.querySelectorAll("path")];
      wrap.append(ring, sam);

      const pips = document.createElement("div");
      pips.className = "ss-pips";
      pips.innerHTML = '<span class="ss-pip"></span>'.repeat(NEED);
      wrap.appendChild(pips);

      // A wave of bandits (they go in before the effects layers, so slashes draw on top).
      let items = [], wave = 0;
      const buildWave = (w) => ctx.shuffle(makeFoes(w)).map((f, i) => {
        const el = document.createElement("div");
        el.className = "ss-foe";
        el.setAttribute("role", "button");
        el.setAttribute("tabindex", "0");
        el.setAttribute("aria-label", TEXT.foeLabel(f.spoken));
        el.style.setProperty("--c", FOE_COLORS[i % FOE_COLORS.length]);
        el.innerHTML =
          `<div class="ss-bod" style="--d:${(-Math.random() * 0.45).toFixed(2)}s">` +
          '<div class="ss-disc"><span class="ss-txt"></span></div>' +
          '<div class="ss-feyes"><div class="ss-feye l"></div><div class="ss-feye r"></div></div>' +
          `<div class="ss-ftear">${TEXT.tear}</div></div>`;
        const txt = el.querySelector(".ss-txt");
        txt.textContent = f.text;
        if (f.kind !== "letter") txt.classList.add(f.kind);
        if (f.kind === "word") {
          el.classList.add("word");
          // A first guess from the length (in em of the bandit size); fitWords() checks it after layout.
          txt.style.setProperty("--fs", `${Math.min(0.46, 2.5 / f.text.length).toFixed(3)}em`);
        }
        el.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); slice(foe, -0.7); }
        });
        // Boss Battle: every bandit is a clone of the boss, holding its sign up (the halves of a cut one
        // fall apart with the boss in them).
        let boss = null;
        if (bossId) {
          el.querySelector(".ss-feyes").remove();
          el.querySelector(".ss-ftear").remove();
          boss = window.Boss.carrier(bossId, "1.3em");
          el.querySelector(".ss-bod").prepend(boss);
        }
        wrap.insertBefore(el, fx.isConnected ? fx : null);
        const foe = { ...f, el, txt, boss, x: 0, y: 0, hw: 40, hh: 40, alive: true }; // hw/hh: half size in px
        return foe;
      });
      items = buildWave(0);
      wrap.append(fx, trailSvg);
      ctx.root.appendChild(wrap);

      // ---------- Layout: samurai in the middle, bandits on an ellipse around it ----------
      let W = 0, H = 0, cx = 0, cy = 0, E = 80, S = 120, rx = 100, ry = 100;
      const base = -Math.PI / 2 + (Math.random() - 0.5) * 0.6;
      function measure() {
        const r = wrap.getBoundingClientRect();
        W = r.width; H = r.height;
        if (!W || !H) return;
        const m = Math.min(W, H);
        E = Math.max(58, Math.min(100, m * (n >= 6 ? 0.2 : 0.23)));
        S = Math.max(96, Math.min(170, m * 0.32));
        cx = W / 2; cy = H / 2;
        items.forEach((f) => {
          f.hw = f.kind === "word" ? E * 0.9 : E * 0.5;
          f.hh = f.kind === "word" ? E * 0.43 : E * 0.5;
        });
        const hw = Math.max(...items.map((f) => f.hw));
        rx = Math.max(S * 0.5 + hw * 1.1, W / 2 - hw - E * 0.12);
        ry = Math.max(S * 0.5 + E * 0.6, H / 2 - E * 0.7);
        ctx.raf(fitWords);
        wrap.style.setProperty("--E", `${E}px`);
        wrap.style.setProperty("--S", `${S}px`);
        sam.style.left = `${cx}px`; sam.style.top = `${cy}px`;
        Object.assign(ring.style, { left: `${cx - rx}px`, top: `${cy - ry}px`, width: `${rx * 2}px`, height: `${ry * 2}px` });
      }
      // Shrink any word that still overflows its pill (wide letters like "w" and "m").
      function fitWords() {
        items.forEach((f) => {
          if (f.kind !== "word") return;
          const room = f.el.querySelector(".ss-disc").clientWidth * 0.84;
          if (!room) return;
          let fs = parseFloat(getComputedStyle(f.txt).fontSize);
          for (let i = 0; i < 12 && f.txt.scrollWidth > room && fs > 9; i++) {
            fs *= 0.9;
            f.txt.style.setProperty("--fs", `${fs}px`);
          }
        });
      }
      measure();
      const ro = new ResizeObserver(measure);
      ro.observe(wrap);

      let t0 = performance.now(); // (reset for each wave, so it rushes in)
      function place(now) {
        const t = (now - t0) / 1000;
        // Rush in from outside for the first 0.4 s, then creep slowly closer as time runs out.
        const enter = reduceMotion ? 1 : Math.min(1, t / 0.4);
        const creep = 1 - 0.1 * Math.min(1, (now - t0) / ctx.timeLimit);
        const k = (1 + (1 - enter) * (1 - enter) * 0.9) * creep;
        items.forEach((f, i) => {
          if (!f.alive) return;
          const p = ringPos(i, t, k);
          f.x = p.x; f.y = p.y;
          f.el.style.transform = `translate(${f.x}px, ${f.y}px)`;
        });
      }
      // Where bandit i stands on the ring at t seconds, at k × the ring size.
      function ringPos(i, t, k) {
        const a = base + (i / items.length) * Math.PI * 2 + orbit * t;
        return { x: cx + Math.cos(a) * rx * k, y: cy + Math.sin(a) * ry * k };
      }
      place(t0);

      // ---------- Swipe trail ----------
      let trail = []; // { x, y, t }
      function drawTrail(now) {
        trail = trail.filter((p) => now - p.t < 170);
        const d = trail.length > 1 ? "M" + trail.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" L") : "";
        trailPaths.forEach((p) => p.setAttribute("d", d));
      }

      function loop(now) {
        if (!done) place(now);
        drawTrail(now);
        if (!ctx.ended || trail.length) ctx.raf(loop);
      }
      ctx.raf(loop);

      // ---------- Input: swipe to slice; a tap shows the hint again ----------
      const local = (e) => {
        const r = wrap.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
      };
      // How close the swipe a–b comes to a bandit, measured in its own half-sizes, so a
      // circle and a wide pill are both hit when the result is ≤ 1.
      const hitDist = (f, a, b) => {
        const nrm = (q) => ({ x: (q.x - f.x) / f.hw, y: (q.y - f.y) / f.hh });
        return segDist({ x: 0, y: 0 }, nrm(a), nrm(b));
      };
      let stroke = null; // { id, last, dist, start, whooshed }
      let lastTapHint = 0;
      wrap.addEventListener("pointerdown", (e) => {
        if (done || ctx.ended) return;
        e.preventDefault();
        const p = local(e);
        stroke = { id: e.pointerId, last: p, start: p, dist: 0, whooshed: false };
        try { wrap.setPointerCapture(e.pointerId); } catch (err) { /* synthetic pointers can't be captured */ }
        trail.push({ ...p, t: performance.now() });
      });
      wrap.addEventListener("pointermove", (e) => {
        if (!stroke || e.pointerId !== stroke.id) return;
        const p = local(e);
        trail.push({ ...p, t: performance.now() });
        if (done) { stroke.last = p; return; }
        const a = stroke.last;
        stroke.dist += Math.hypot(p.x - a.x, p.y - a.y);
        stroke.last = p;
        if (stroke.dist < SLICE_MIN) return;
        if (!stroke.whooshed) { stroke.whooshed = true; whoosh(); }
        // Check from the swipe's start on the first long-enough move, so a short flick still counts.
        const from = stroke.checked ? a : stroke.start;
        stroke.checked = true;
        const hit = items
          .filter((f) => f.alive && hitDist(f, from, p) <= 1)
          .sort((f, g) => hitDist(f, from, p) - hitDist(g, from, p))[0];
        if (hit) slice(hit, Math.atan2(p.y - from.y, p.x - from.x));
      });
      const endStroke = (e) => {
        if (!stroke || e.pointerId !== stroke.id) return;
        const s = stroke;
        stroke = null;
        if (done || ctx.ended || s.dist >= SLICE_MIN) return;
        // A tap: on the samurai it replays the prompt; anywhere else it shows how to slice.
        const p = s.start;
        if (Math.hypot(p.x - cx, p.y - cy) < S * 0.55) { ctx.say(prompt); return; }
        const now = performance.now();
        if (now - lastTapHint > 1200) { lastTapHint = now; ctx.hint(p); }
      };
      wrap.addEventListener("pointerup", endStroke);
      wrap.addEventListener("pointercancel", (e) => { if (stroke && e.pointerId === stroke.id) stroke = null; });
      sam.addEventListener("keydown", (e) => {
        if ((e.key === "Enter" || e.key === " ") && !done) { e.preventDefault(); ctx.say(prompt); }
      });

      ctx.say(prompt);
      // A small 👆 SLICE! on the samurai's lower edge, once the bandits have rushed in. It belongs to the
      // samurai, never sits next to a bandit, so it can't look like it means one of them. (Spots out on the
      // ring always ended up near some bandit on a crowded board.)
      ctx.later(() => {
        if (!done) ctx.hint({ x: cx, y: cy + S * 0.5 }, null, { small: true }); // bottom edge, below the plate
      }, 450);

      // ---------- Slicing ----------
      function slice(f, angle) {
        if (done || ctx.ended || !f.alive) return;
        done = true;
        wrap.classList.add("strike");
        slashAt(f, angle);
        if (f.right) {
          f.alive = false;
          splitFoe(f, angle);
          shing();
          hits++;
          pips.children[hits - 1].classList.add("on");
          if (hits < NEED) { nextWave(f); return; }
          ctx.later(() => { ctx.confetti(fx, f.x, f.y, { count: 90 }); popSound(); }, 60);
          ctx.later(() => { wrap.classList.remove("strike"); wrap.classList.add("won"); }, 320);
          ctx.say(answer);
          ctx.win();
        } else {
          clank();
          f.el.classList.add("sad");
          if (f.boss) window.Boss.setMood(f.boss, "laugh"); // the wrong boss laughs at you
          ctx.later(() => { wrap.classList.remove("strike"); wrap.classList.add("oops"); sadSound(); }, 260);
          showAnswer();
          ctx.say(answer);
          ctx.lose();
        }
      }
      // Not the last one yet: a little confetti, the others run away, and a fresh wave rushes in.
      function nextWave(f) {
        ctx.later(() => { ctx.confetti(fx, f.x, f.y, { count: 30 }); popSound(); }, 60);
        if (f.kind === "pic") ctx.say(f.spoken); // "ball!"
        items.forEach((g) => {
          if (!g.alive) return;
          g.alive = false;
          const dx = g.x - cx, dy = g.y - cy, len = Math.hypot(dx, dy) || 1;
          g.el.classList.add("flee");
          g.el.animate([{ transform: g.el.style.transform }, { transform: `translate(${g.x + (dx / len) * W * 0.6}px, ${g.y + (dy / len) * H * 0.6}px)` }],
            { duration: reduceMotion ? 1 : 380, easing: "ease-in", fill: "forwards" });
        });
        ctx.later(() => wrap.classList.remove("strike"), 320);
        ctx.later(() => {
          if (ctx.ended) return;
          items.forEach((g) => g.el.remove());
          wave++;
          items = buildWave(wave);
          measure();
          t0 = performance.now();
          place(t0);
          done = false;
          ctx.say(prompt); // the target again for the new wave (sight words are only heard)
        }, 650);
      }
      function showAnswer() {
        const r = items.find((f) => f.right);
        if (r) r.el.classList.add("answer");
      }

      ctx.onTimeout(() => {
        done = true;
        wrap.classList.add("oops");
        showAnswer();
        ctx.say(answer);
      });

      // A white slash flashes across the bandit along the swipe.
      function slashAt(f, angle) {
        const len = Math.max(f.hw, f.hh) * 3.8;
        const s = document.createElement("div");
        s.className = "ss-slash";
        s.style.left = `${f.x - Math.cos(angle) * len / 2}px`;
        s.style.top = `${f.y - Math.sin(angle) * len / 2}px`;
        s.style.width = `${len}px`;
        const rot = `rotate(${angle}rad)`;
        s.style.transform = `${rot} scaleX(0)`;
        fx.appendChild(s);
        s.animate(
          [{ transform: `${rot} scaleX(0)`, opacity: 1 }, { transform: `${rot} scaleX(1)`, opacity: 1, offset: 0.4 }, { transform: `${rot} scaleX(1)`, opacity: 0 }],
          { duration: reduceMotion ? 1 : 380, easing: "ease-out", fill: "forwards" });
      }

      // The bandit falls apart in two halves, cut along the swipe.
      function splitFoe(f, angle) {
        const bod = f.el.querySelector(".ss-bod");
        const deg = (angle * 180) / Math.PI;
        const halves = document.createElement("div");
        halves.className = "ss-halves";
        halves.style.transform = `rotate(${deg}deg)`;
        const parts = ["top", "bot"].map((side) => {
          const h = document.createElement("div");
          h.className = `ss-half ${side}`;
          const copy = bod.cloneNode(true);
          copy.style.transform = `rotate(${-deg}deg)`;
          h.appendChild(copy);
          halves.appendChild(h);
          return h;
        });
        f.el.appendChild(halves);
        f.el.classList.add("cut");
        if (reduceMotion) { halves.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: "forwards" }); return; }
        const fly = (dir) => [
          { transform: "translate(0,0) rotate(0deg)", opacity: 1 },
          { transform: `translate(${dir * 6}px, ${dir * 0.55}em) rotate(${dir * 18}deg)`, opacity: 1, offset: 0.35 },
          { transform: `translate(${dir * 14}px, ${dir * 1.4}em) rotate(${dir * 40}deg)`, opacity: 0 },
        ];
        parts[0].animate(fly(-1), { duration: 700, easing: "cubic-bezier(.2,.8,.4,1)", fill: "forwards" });
        parts[1].animate(fly(1), { duration: 700, easing: "cubic-bezier(.2,.8,.4,1)", fill: "forwards" });
      }

      // ---------- Sound effects (Web Audio; silent when there is no audio context) ----------
      const { noise, sweep, tone } = ctx.sfx;
      const whoosh = () => noise(0.16, "bandpass", 700, 2600, 0.22);
      const shing = () => { noise(0.22, "highpass", 4500, 9000, 0.28); sweep(1700, 3600, 0.25, "sine", 0.1); };
      const popSound = () => { [0, 0.06, 0.13].forEach((d) => noise(0.08, "bandpass", 1800, 600, 0.35, d)); };
      const clank = () => { tone(880, 0.07, "square", 0.12); tone(622, 0.16, "square", 0.1, 0.05); noise(0.06, "highpass", 3000, 2000, 0.25); };
      const sadSound = () => sweep(520, 220, 0.5, "triangle", 0.14);

      // Tutorial: point at the samurai's plate, then swipe through the right bandit, straight out from
      // the samurai. (Neighbours sit beside it on the ring, so a swipe across the ring can catch one first.)
      let rightFoe = items.find((x) => x.right);                 // (the current wave's)
      const across = (k) => () => { // a point on the swipe line, k = -1 (inner end) … 1 (outer end), in ctx.root px
        const w = wrap.getBoundingClientRect(), g = ctx.root.getBoundingClientRect();
        const dx = rightFoe.x - cx, dy = rightFoe.y - cy, len = Math.hypot(dx, dy) || 1;
        const r = Math.max(rightFoe.hw, rightFoe.hh) * 1.4;
        return { x: w.left - g.left + rightFoe.x + (dx / len) * r * k, y: w.top - g.top + rightFoe.y + (dy / len) * r * k };
      };
      ctx.tutorial(answerItem, async (f) => {
        await f.point(sam.querySelector(".ss-plate"));
        for (let n = 0; n < NEED && !ctx.ended; n++) {               // one bandit a wave, three waves
          await f.until(() => !done && hits === n && items.some((x) => x.right && x.alive), 3000);
          rightFoe = items.find((x) => x.right && x.alive);
          await f.wait(450);                                       // let the wave rush in
          await f.point(rightFoe.el, 600);
          await f.slice(across(-1), across(1));
          await f.until(() => hits > n || ctx.ended, 2000);
        }
      });

      return function cleanup() {
        done = true;
        ro.disconnect();
      };
    },
  });
})();
