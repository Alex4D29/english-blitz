// GONE FISHING — a letter monster (a big orange A with googly eyes) stands on
// a dock with a fishing rod and says "I want A!". Fish swim around the pond
// below, each carrying a picture (🍎 🐶 ⚽ …) or a word on its side.
//
// Swipe (or tap) into the pond to cast: the bobber lands where the finger
// lets go. Fish near the bobber come over one at a time to nibble. While one
// is biting (the bobber dips and ❗ pops up), tap it to reel it in.
// Right fish: the monster holds it up, hearts, "A for apple". That's the win.
// Wrong fish: the monster is sad, tosses it back, and the player can cast
// again while time is left. A fish that isn't tapped swims off after a moment
// and the next nearby fish comes. Out of time: the right fish glows.
//
// Letter lists: fish carry pictures whose word starts with the letter (X/fox
// items are never the target, and no other fish starts with the letter).
// CVC lists: the monster holds the word ("cat") and wants its picture (🐱).
// HFW lists: a plain blob monster with a 🔊 bubble says the word, and the fish
// carry words (look-alike distractors first).
// Faster speeds: fish swim faster, bites are shorter, 5 fish from 1.5×, 6 from 2×.
(function () {
  const TEXT = {
    name: { en: "Gone Fishing" },
    icon: "🎣",
    // Practice mode's "How to play" card: steps (icon + sentence) and tips.
    howTo: (list) => {
      const first = list.type === "phonics"
        ? ["👂", "The monster says its letter, like \"A\". It wants a fish with something that starts with A! 🍎"]
        : list.type === "cvc"
          ? ["👂", "The monster holds a word, like \"cat\", and says it. It wants the fish with that picture! 🐱"]
          : ["👂", "Listen to the word, like \"the\". Find the fish with that word on it!"];
      return { en: {
        steps: [
          first,
          ["👆", "Swipe into the water to throw the fishing line. It lands where your finger stops."],
          ["🐟", "Fish near the float come to bite. When the float bobs and ❗ pops up, tap the fish!"],
        ],
        tips: [
          "Throw the line close to the fish you want.",
          "Caught the wrong fish? The monster is sad and throws it back. Try again!",
          "If you don't tap, the fish swims away and another one comes.",
          "Tap the monster to hear it again.",
          "When the game speeds up, the fish swim faster and bite for less time.",
        ],
      } };
    },
    instruction: { en: "CATCH IT!" },
    prompt: (spoken) => `I want ${spoken}!`,
    answer: (spoken, word) => (word ? `${spoken} for ${word}` : spoken),
    bubble: "❓",
    bubbleListen: "🔊",
    bubbleHappy: "❤️",
    bubbleSad: "😢",
    alert: "❗",
    ghost: "👆",
    heart: "❤️",
    monsterLabel: "Monster. Tap to hear it again.",
    pondLabel: "Pond. Swipe or tap to throw the line. Tap a biting fish to catch it.",
  };

  const MONSTER_COLORS = ["#ff8a00", "#1fd65f", "#1e9bff", "#b04dff", "#ff2e88"];
  const FISH_COLORS = ["#ff8a00", "#ff4fa3", "#1e9bff", "#b04dff", "#1fd65f", "#ffd400"];
  const HIT_SLOP = 28;        // px around a biting fish that still counts as a tap on it
  const DEG = Math.PI / 180;

  const CSS = `
  .fi { position:absolute; inset:0; overflow:visible; touch-action:none; user-select:none; -webkit-user-select:none; }
  .fi-shore { position:absolute; left:0; right:0; top:0; height:var(--shore); pointer-events:none; }
  .fi-pond { position:absolute; left:8px; right:8px; top:var(--shore); bottom:8px; z-index:0; cursor:crosshair;
    border:5px solid #111; border-radius:30px; box-shadow:0 6px 0 #111; overflow:hidden;
    background:radial-gradient(ellipse at 50% 120%, #0b5fb8 0 30%, transparent 70%), linear-gradient(#2fb4ff, #1479e0); }
  .fi-pond::before { content:""; position:absolute; inset:0; opacity:.35;
    background:radial-gradient(ellipse 22px 6px at 20% 30%, #fff 60%, transparent 64%),
               radial-gradient(ellipse 30px 7px at 72% 22%, #fff 60%, transparent 64%),
               radial-gradient(ellipse 26px 6px at 60% 62%, #fff 60%, transparent 64%),
               radial-gradient(ellipse 18px 5px at 28% 80%, #fff 60%, transparent 64%),
               radial-gradient(ellipse 24px 6px at 86% 86%, #fff 60%, transparent 64%);
    animation:fi-drift 3s ease-in-out infinite alternate; }
  .fi-dock { position:absolute; z-index:1; pointer-events:none; left:var(--dl); width:var(--dw); top:calc(var(--shore) - 14px); height:34px;
    background:repeating-linear-gradient(90deg, #b8743a 0 22px, #8f5526 22px 25px); border:5px solid #111; border-radius:8px;
    box-shadow:0 6px 0 rgba(0,0,0,.35); }

  /* ---- the monster ---- */
  .fi-mon { --S:min(30vw, 17dvh, 140px); position:absolute; z-index:3; left:var(--ml); top:calc(var(--shore) - var(--S) * .9);
    width:var(--S); height:var(--S); font-size:var(--S); padding:0; margin:0; border:0; background:none; font-family:inherit;
    cursor:pointer; touch-action:manipulation; }
  .fi-body { position:absolute; inset:0; transform-origin:50% 100%; animation:fi-bob .9s ease-in-out infinite alternate; }
  .fi-glyph { position:absolute; left:-60%; right:-60%; top:0; line-height:1; text-align:center; z-index:1; color:var(--mc);
    -webkit-text-stroke:.045em #111; paint-order:stroke fill; text-shadow:0 .035em 0 #111; }
  .fi-mon.word .fi-glyph { font-size:.55em; top:.42em; }
  .fi-blob { position:absolute; left:8%; right:8%; top:10%; bottom:0; z-index:1; background:var(--mc);
    border:.04em solid #111; border-radius:50% 50% 44% 44% / 60% 60% 40% 40%; box-shadow:0 .035em 0 #111; }
  .fi-blob::before, .fi-blob::after { content:""; position:absolute; top:-12%; width:16%; height:24%; background:var(--mc);
    border:.03em solid #111; border-radius:50% 50% 20% 20%; }
  .fi-blob::before { left:14%; transform:rotate(-18deg); }
  .fi-blob::after { right:14%; transform:rotate(18deg); }
  .fi-eyes { position:absolute; left:50%; top:-.1em; transform:translateX(-50%); display:flex; gap:.03em; z-index:3; }
  .fi-mon.blob .fi-eyes { top:.24em; }
  .fi-eye { position:relative; width:.25em; height:.25em; background:#fff; border:.03em solid #111; border-radius:50%; }
  .fi-eye::after { content:""; position:absolute; left:28%; top:42%; width:46%; height:46%; background:#111; border-radius:50%; transition:top .2s, left .2s; }
  .fi-mouth { position:absolute; left:50%; top:52%; width:.3em; height:.17em; margin-left:-.15em; z-index:3; overflow:hidden;
    background:#3a0010; border:.03em solid #111; border-radius:20% 20% 50% 50% / 10% 10% 90% 90%; transition:border-radius .15s, height .15s; }
  .fi-mouth::after { content:""; position:absolute; left:25%; right:25%; bottom:-10%; height:45%; background:#ff5c8a; border-radius:50% 50% 0 0; }
  .fi-tear { position:absolute; top:.12em; width:.07em; height:.1em; z-index:4; background:#5cc8ff; border:.015em solid #111;
    border-radius:50% 50% 50% 50% / 60% 60% 40% 40%; opacity:0; }
  .fi-tear.l { left:30%; } .fi-tear.r { right:30%; }
  .fi-mon.blob .fi-tear { top:.46em; }
  .fi-bubble { position:absolute; left:88%; top:-.05em; z-index:4; font-size:.22em; padding:.1em .22em; line-height:1; white-space:nowrap;
    background:#fff; border:.07em solid #111; border-radius:.5em; box-shadow:0 .07em 0 #111; animation:fi-bob .7s ease-in-out infinite alternate; }
  .fi-mon.happy .fi-body { animation:fi-jump .4s cubic-bezier(.2,1.8,.4,1) 3; }
  .fi-mon.happy .fi-eye::after { top:22%; }
  .fi-mon.watch .fi-eye::after { top:56%; left:46%; }
  .fi-mon.sad .fi-body { animation:fi-no .45s ease-in-out 2; }
  .fi-mon.sad .fi-eye::after { top:58%; }
  .fi-mon.sad .fi-mouth { height:.09em; top:60%; border-radius:50% 50% 15% 15% / 90% 90% 10% 10%; }
  .fi-mon.sad .fi-tear { animation:fi-tear .6s ease-in infinite; }
  .fi-mon.sad .fi-tear.r { animation-delay:.3s; }

  /* ---- fish ---- */
  .fi-fish { position:absolute; left:0; top:0; width:var(--fw); height:var(--fh); margin:calc(var(--fh) / -2) 0 0 calc(var(--fw) / -2);
    z-index:2; pointer-events:none; will-change:transform; }
  .fi-flip { position:absolute; inset:0; }
  .fi-fish.left .fi-flip { transform:scaleX(-1); }
  .fi-tail { position:absolute; left:0; top:14%; width:30%; height:72%; background:#111; clip-path:polygon(0 0, 100% 50%, 0 100%); }
  .fi-tail::after { content:""; position:absolute; inset:9px 6px 9px 4px; background:var(--fc); clip-path:polygon(0 0, 100% 50%, 0 100%); }
  .fi-fish .fi-tail { animation:fi-wag .35s ease-in-out infinite alternate; transform-origin:100% 50%; }
  .fi-fbody { position:absolute; left:18%; right:0; top:0; bottom:0; background:var(--fc); border:4px solid #111; border-radius:55% 48% 48% 55% / 50%;
    box-shadow:inset 0 -6px 0 rgba(0,0,0,.15); }
  .fi-fin { position:absolute; left:46%; top:-14%; width:26%; height:26%; background:var(--fc); border:4px solid #111; border-bottom:0;
    border-radius:80% 20% 0 0; z-index:-1; }
  .fi-feye { position:absolute; right:9%; top:22%; width:13%; aspect-ratio:1; background:#fff; border:3px solid #111; border-radius:50%; }
  .fi-feye::after { content:""; position:absolute; right:12%; top:22%; width:50%; height:50%; background:#111; border-radius:50%; }
  .fi-tag { position:absolute; left:23%; right:27%; top:12%; bottom:12%; display:flex; align-items:center; justify-content:center;
    background:#fff; border:3px solid #111; border-radius:999px; line-height:1; color:#111; font-weight:900; white-space:nowrap; overflow:visible; }
  .fi-fish.left .fi-tag { left:27%; right:23%; }
  .fi-alert { position:absolute; left:50%; top:-58%; font-size:calc(var(--fh) * .5); line-height:1; transform:translateX(-50%) scale(0);
    transition:transform .15s cubic-bezier(.2,1.8,.4,1); }
  .fi-fish.bite .fi-alert { transform:translateX(-50%) scale(1); animation:fi-pulse .3s ease-in-out infinite alternate; }
  .fi-fish.bite .fi-flip { animation:fi-nibble .18s ease-in-out infinite alternate; }
  .fi-fish.hooked { z-index:8; }
  .fi-fish.hooked .fi-flip { animation:fi-flop .14s ease-in-out infinite alternate; }
  .fi-fish.answer .fi-fbody { box-shadow:0 0 0 6px #ffd400, 0 0 26px 12px #ffd400; }
  .fi-fish.answer .fi-flip { animation:fi-flop .3s ease-in-out 4 alternate; }

  /* ---- rod, line, bobber ---- */
  .fi-svg { position:absolute; inset:0; width:100%; height:100%; z-index:4; pointer-events:none; overflow:visible; }
  .fi-bob { position:absolute; left:0; top:0; width:22px; height:22px; margin:-11px 0 0 -11px; z-index:5; pointer-events:none;
    border:4px solid #111; border-radius:50%; background:linear-gradient(#ff2e4d 0 48%, #111 48% 56%, #fff 56%); will-change:transform; }
  .fi-bob.dip { animation:fi-dip .38s ease-in-out infinite; }
  .fi-bob.hide { visibility:hidden; }
  .fi-fx { position:absolute; inset:0; pointer-events:none; z-index:9; overflow:visible; }
  .fi-ripple { position:absolute; width:60px; height:24px; margin:-12px 0 0 -30px; border:4px solid rgba(255,255,255,.85); border-radius:50%; z-index:1;
    animation:fi-ripple .6s ease-out forwards; pointer-events:none; }
  .fi-ghost { position:absolute; z-index:6; font-size:46px; line-height:1; pointer-events:none; animation:fi-ghost 1.6s ease-in-out infinite; }
  .fi-heart { position:absolute; font-size:30px; line-height:1; }

  @keyframes fi-bob    { to { transform:translateY(-6%); } }
  @keyframes fi-jump   { 50% { transform:translateY(-22%) scale(1.08); } }
  @keyframes fi-no     { 25% { transform:rotate(-10deg); } 75% { transform:rotate(10deg); } }
  @keyframes fi-tear   { 0% { opacity:1; transform:translateY(0); } 100% { opacity:0; transform:translateY(.25em); } }
  @keyframes fi-drift  { to { transform:translateX(12px); } }
  @keyframes fi-wag    { from { transform:scaleY(.8); } to { transform:scaleY(1.1); } }
  @keyframes fi-nibble { from { translate:-3px 0; } to { translate:4px 0; } }
  @keyframes fi-flop   { from { rotate:-14deg; } to { rotate:14deg; } }
  @keyframes fi-pulse  { to { scale:1.25; } }
  @keyframes fi-dip    { 0%, 100% { translate:0 0; } 45% { translate:0 9px; scale:.8; } }
  @keyframes fi-ripple { from { transform:scale(.3); opacity:1; } to { transform:scale(1.6); opacity:0; } }
  @keyframes fi-ghost  { 0% { transform:translate(-40px, -70px); opacity:0; } 15% { opacity:1; } 70% { transform:translate(30px, 40px); opacity:1; } 100% { transform:translate(30px, 40px); opacity:0; } }
  @media (prefers-reduced-motion: reduce) {
    .fi-pond::before, .fi-body, .fi-bubble, .fi-fish .fi-tail, .fi-fish.bite .fi-flip, .fi-fish.hooked .fi-flip, .fi-fish.answer .fi-flip,
    .fi-fish.bite .fi-alert, .fi-mon.happy .fi-body, .fi-mon.sad .fi-body, .fi-ghost { animation:none !important; }
  }`;

  function injectCss() {
    if (document.getElementById("fi-css")) return;
    const style = document.createElement("style");
    style.id = "fi-css";
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  const svgEl = (tag, attrs) => {
    const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  };
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  registerMicrogame({
    id: "fishing",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["phonics", "cvc", "hfw"],
    duration: 12000, // cast, wait for a bite, maybe a wrong fish and a second cast

    start(ctx) {
      injectCss();
      const type = ctx.list.type;
      const isLetter = type === "phonics"; // a letter with first-sound pictures
      const isHfw = type === "hfw";
      const speed = ctx.speed || 1;
      const pace = 0.6 + 0.4 * speed;               // 1 at 1×, 1.6 at 2.5×
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const later = ctx.later;
      const { tone, sweep, noise } = ctx.sfx;
      const spoken = (it) => it.say || it.text;
      const firstLetter = (it) => (it.word || "").charAt(0).toUpperCase();

      // ---------- Content ----------
      // Letters: the picture's word must start with the letter ("X for fox" can't work).
      const fits = (it) => (isHfw ? true : it.emoji && (!isLetter || firstLetter(it) === it.text.toUpperCase()));
      const target = ctx.items.find(fits) || ctx.items[0];
      const nFish = speed >= 2 ? 6 : speed >= 1.5 ? 5 : 4;
      let others;
      if (isHfw) {
        others = ctx.pickOptions(target, nFish).filter((it) => it !== target && it.text !== target.text);
      } else {
        // Never another picture that would also be right.
        others = ctx.pickOptions(target, ctx.items.length).filter((it) =>
          it !== target && it.emoji && it.emoji !== target.emoji &&
          (!isLetter || firstLetter(it) !== target.text.toUpperCase()));
      }
      const catchItems = ctx.shuffle([target, ...others.slice(0, nFish - 1)]);
      const prompt = isHfw ? spoken(target) : TEXT.prompt(spoken(target));
      const answer = isLetter ? TEXT.answer(spoken(target), target.word) : spoken(target);

      // ---------- DOM ----------
      const wrap = document.createElement("div");
      wrap.className = "fi";
      const shore = document.createElement("div");
      shore.className = "fi-shore";
      const pond = document.createElement("div");
      pond.className = "fi-pond";
      pond.setAttribute("aria-label", TEXT.pondLabel);
      const dock = document.createElement("div");
      dock.className = "fi-dock";

      const mon = document.createElement("button");
      mon.className = "fi-mon" + (isHfw ? " blob" : isLetter ? "" : " word");
      mon.style.setProperty("--mc", ctx.pick(MONSTER_COLORS));
      mon.setAttribute("aria-label", TEXT.monsterLabel);
      mon.innerHTML =
        '<div class="fi-body">' + (isHfw ? '<div class="fi-blob"></div>' : '<div class="fi-glyph"></div>') +
        '<div class="fi-eyes"><div class="fi-eye"></div><div class="fi-eye"></div></div>' +
        '<div class="fi-tear l"></div><div class="fi-tear r"></div>' +
        '<div class="fi-mouth"></div><div class="fi-bubble"></div></div>';
      if (!isHfw) mon.querySelector(".fi-glyph").textContent = target.text;
      const bubble = mon.querySelector(".fi-bubble");
      const restBubble = isHfw ? TEXT.bubbleListen : TEXT.bubble;
      bubble.textContent = restBubble;
      mon.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); replay(); });
      mon.addEventListener("click", (e) => { if (e.detail === 0) replay(); });

      const svg = svgEl("svg", { class: "fi-svg", "aria-hidden": "true" });
      const aimPath = svgEl("path", { fill: "none", stroke: "#fff", "stroke-width": 4, "stroke-dasharray": "2 10", "stroke-linecap": "round", opacity: 0 });
      const aimRing = svgEl("ellipse", { fill: "rgba(255,255,255,.25)", stroke: "#fff", "stroke-width": 4, rx: 26, ry: 12, opacity: 0 });
      const linePath = svgEl("path", { fill: "none", stroke: "#111", "stroke-width": 2.5 });
      const rodOut = svgEl("path", { fill: "none", stroke: "#111", "stroke-width": 10, "stroke-linecap": "round" });
      const rodIn = svgEl("path", { fill: "none", stroke: "#e0a050", "stroke-width": 5, "stroke-linecap": "round" });
      const reel = svgEl("circle", { r: 7, fill: "#9aa6b8", stroke: "#111", "stroke-width": 3 });
      svg.append(aimRing, aimPath, linePath, rodOut, rodIn, reel);

      const bob = document.createElement("div");
      bob.className = "fi-bob";
      const fx = document.createElement("div");
      fx.className = "fi-fx";
      const ghost = document.createElement("div");
      ghost.className = "fi-ghost";
      ghost.textContent = TEXT.ghost;

      wrap.append(shore, pond, dock);
      const fish = catchItems.map((item, i) => {
        const el = document.createElement("div");
        el.className = "fi-fish";
        el.style.setProperty("--fc", FISH_COLORS[i % FISH_COLORS.length]);
        el.innerHTML =
          '<div class="fi-flip"><div class="fi-tail"></div><div class="fi-fin"></div><div class="fi-fbody"></div><div class="fi-feye"></div></div>' +
          '<div class="fi-tag"></div><div class="fi-alert"></div>';
        el.querySelector(".fi-tag").textContent = isHfw ? item.text : item.emoji;
        el.querySelector(".fi-alert").textContent = TEXT.alert;
        wrap.appendChild(el);
        return {
          item, el, tag: el.querySelector(".fi-tag"),
          nx: 0, ny: 0, baseNy: 0,                 // position as a fraction of the pond
          dir: Math.random() < 0.5 ? 1 : -1,
          sp: (0.09 + Math.random() * 0.06) * pace, // pond widths per second
          ph: Math.random() * 6.28,
          state: "roam", fleeT: 0, triedUntil: 0,
        };
      });
      wrap.append(mon, svg, bob, ghost, fx);
      ctx.root.appendChild(wrap);

      // Fish start in evenly spaced lanes, scattered across.
      const lanes = ctx.shuffle(fish.map((_, i) => i));
      fish.forEach((f, i) => {
        f.ny = f.baseNy = 0.16 + (lanes[i] / Math.max(1, fish.length - 1)) * 0.7;
        f.nx = 0.15 + Math.random() * 0.7;
      });

      // ---------- Geometry ----------
      let W = 0, P = { l: 0, t: 0, w: 1, h: 1 }, S = 100, base = { x: 0, y: 0 }, FW = 100, FH = 58;
      function measure() {
        const wr = wrap.getBoundingClientRect();
        W = wr.width;
        wrap.style.setProperty("--shore", `${clamp(wr.height * 0.27, 120, 200)}px`);
        const pr = pond.getBoundingClientRect();
        P = { l: pr.left - wr.left + 5, t: pr.top - wr.top + 5, w: pr.width - 10, h: pr.height - 10 };
        S = mon.getBoundingClientRect().width || 100;
        const monLeft = clamp(W * 0.1, 12, 60);
        mon.style.setProperty("--ml", `${monLeft}px`);
        wrap.style.setProperty("--dl", `${monLeft - 16}px`);
        wrap.style.setProperty("--dw", `${S + 32}px`);
        const mr = mon.getBoundingClientRect();
        base = { x: mr.left - wr.left + S * 0.86, y: mr.top - wr.top + S * 0.66 };
        FW = clamp(P.w * 0.33, 100, 170);
        FH = FW * 0.58;
        wrap.style.setProperty("--fw", `${FW}px`);
        wrap.style.setProperty("--fh", `${FH}px`);
        fish.forEach((f) => {
          const tagW = FW * 0.5, tagH = FH * 0.76 - 6;
          if (isHfw) {
            const len = f.item.text.length;
            f.tag.style.fontSize = `${Math.min(tagH * 0.75, (tagW - 8) / (len * 0.58))}px`;
          } else {
            f.tag.style.fontSize = `${tagH * 0.9}px`;
          }
        });
        // The ghost finger shows a swipe into the middle of the pond.
        ghost.style.left = `${P.l + P.w * 0.55 - 23}px`;
        ghost.style.top = `${P.t + P.h * 0.4}px`;
      }
      measure();
      const ro = new ResizeObserver(measure);
      ro.observe(wrap);

      const toPx = (nx, ny) => ({ x: P.l + nx * P.w, y: P.t + ny * P.h });
      const fishPx = (f) => toPx(f.nx, f.ny);
      const minNx = () => FW / 2 / P.w + 0.01, maxNx = () => 1 - FW / 2 / P.w - 0.01;
      const minNy = () => FH / 2 / P.h + 0.02, maxNy = () => 1 - FH / 2 / P.h - 0.02;

      // ---------- State ----------
      // state: ready (line at the rod), aim (finger down), fly (bobber in the air),
      // fish (bobber in the water), reel (pulling a fish up), over
      let state = "ready", done = false, aim = null, aimId = null;
      let bait = null;                 // { nx, ny } while the bobber is in the water
      let flight = null;               // { from, to, t0, dur }
      let active = null;               // the fish coming to / biting the bait
      let biteEnd = 0, nextBiteAt = 0, nextPlip = 0;
      let hooked = null;               // { f, from, to, t0, dur, back } while reeling or tossing back
      let rodA = 40, rodBend = 0, lastTs = null;
      let ghostShown = true;

      // ---------- Rod and line ----------
      const rodLen = () => S * 0.95;
      function rodTip() {
        const L = rodLen();
        return { x: base.x + L * Math.cos(rodA * DEG), y: base.y - L * Math.sin(rodA * DEG) };
      }
      function drawRod() {
        const T = rodTip();
        const mx = (base.x + T.x) / 2, my = (base.y + T.y) / 2;
        // Bend sideways (clockwise from the rod direction = towards the water).
        const nx = Math.sin(rodA * DEG), ny = Math.cos(rodA * DEG);
        const k = rodBend * rodLen() * 0.35;
        const d = `M${base.x},${base.y} Q${mx + nx * k},${my + ny * k} ${T.x + nx * k * 0.6},${T.y + ny * k * 0.6}`;
        rodOut.setAttribute("d", d);
        rodIn.setAttribute("d", d);
        reel.setAttribute("cx", base.x + (T.x - base.x) * 0.12);
        reel.setAttribute("cy", base.y + (T.y - base.y) * 0.12 + 6);
        return { x: T.x + nx * k * 0.6, y: T.y + ny * k * 0.6 };
      }
      function drawLine(tip, end, sag) {
        const mx = (tip.x + end.x) / 2, my = (tip.y + end.y) / 2 + sag;
        linePath.setAttribute("d", `M${tip.x},${tip.y} Q${mx},${my} ${end.x},${end.y}`);
      }
      const placeBob = (p) => { bob.style.transform = `translate(${p.x}px,${p.y}px)`; };
      const mouthOf = (f) => {
        const p = fishPx(f);
        return { x: p.x + f.dir * FW * 0.47, y: p.y };
      };

      // ---------- Fish movement ----------
      function moveFish(f, dt, t) {
        if (f.state === "roam" || f.state === "flee") {
          const v = f.state === "flee" ? f.sp * 2.6 : f.sp;
          f.nx += f.dir * v * dt;
          if (f.nx > maxNx()) { f.nx = maxNx(); f.dir = -1; }
          if (f.nx < minNx()) { f.nx = minNx(); f.dir = 1; }
          f.ny = clamp(f.baseNy + Math.sin(t * 1.4 + f.ph) * 0.03, minNy(), maxNy());
          if (f.state === "flee" && (f.fleeT -= dt) <= 0) { f.state = "roam"; f.baseNy = f.ny; }
        } else if (f.state === "approach" || f.state === "bite") {
          const b = toPx(bait.nx, bait.ny);
          const tx = b.x - f.dir * FW * 0.45, ty = b.y + FH * 0.08;
          const p = fishPx(f);
          if (f.state === "approach") {
            const dx = tx - p.x, dy = ty - p.y, dist = Math.hypot(dx, dy);
            const step = P.w * 0.32 * pace * dt;
            if (dist <= step) { f.nx = (tx - P.l) / P.w; f.ny = (ty - P.t) / P.h; startBite(f); }
            else { f.nx += dx / dist * step / P.w; f.ny += dy / dist * step / P.h; }
          } else {
            f.nx = (tx - P.l) / P.w;
            f.ny = (ty - P.t) / P.h;
          }
        }
      }
      function placeFish(f) {
        if (f.state === "reel" || f.state === "held" || f.state === "toss") return;
        const p = fishPx(f);
        f.el.style.transform = `translate(${p.x}px,${p.y}px)`;
        f.el.classList.toggle("left", f.dir < 0);
      }

      // Nearest fish (not just tried) within reach of the bait comes over.
      function callFish(now) {
        const b = toPx(bait.nx, bait.ny);
        const reach = Math.max(120, P.w * 0.45);
        let best = null, bestD = Infinity;
        fish.forEach((f) => {
          if (f.state !== "roam" || f.triedUntil > now) return;
          const p = fishPx(f);
          const d = Math.hypot(p.x - b.x, p.y - b.y);
          if (d < reach && d < bestD) { best = f; bestD = d; }
        });
        if (!best) return;
        active = best;
        best.state = "approach";
        best.dir = b.x >= fishPx(best).x ? 1 : -1; // face the bait
      }
      function startBite(f) {
        f.state = "bite";
        f.el.classList.add("bite");
        bob.classList.add("dip");
        biteEnd = performance.now() + 1500 / pace;
        nextPlip = 0;
        mon.classList.add("watch");
      }
      function sendAway(f, now) {
        f.el.classList.remove("bite");
        f.state = "flee";
        f.dir = -f.dir;
        f.fleeT = 0.6;
        f.triedUntil = now + 2500;
        if (active === f) active = null;
        bob.classList.remove("dip");
        mon.classList.remove("watch");
      }

      // ---------- Main loop ----------
      function frame(ts) {
        const dt = lastTs == null ? 0 : Math.min(50, ts - lastTs) / 1000;
        lastTs = ts;
        const now = performance.now();
        const t = now / 1000;

        fish.forEach((f) => { moveFish(f, dt, t); placeFish(f); });

        if (state === "fish" && !done) {
          if (!active && now >= nextBiteAt) callFish(now);
          if (active && active.state === "bite") {
            if (now >= nextPlip) { nextPlip = now + 380; plipSound(); ripple(toPx(bait.nx, bait.ny), true); }
            if (now >= biteEnd) { sendAway(active, now); nextBiteAt = now + 450; }
          }
        }

        // Rod angle and bend ease towards the state's pose.
        const pose = {
          ready: [40, 0], aim: [66, -0.15], fly: [18, 0.1], fish: [30, 0.12], reel: [72, 0.55], over: [36, 0.08],
        }[state] || [40, 0];
        let [wantA, wantBend] = pose;
        if (state === "fish" && active && active.state === "bite") { wantA = 24; wantBend = 0.3; }
        const k = Math.min(1, dt * (state === "fly" ? 24 : 12));
        rodA += (wantA - rodA) * k;
        rodBend += (wantBend - rodBend) * k;
        const tip = drawRod();

        // Line and bobber.
        if (hooked) {
          const p = stepHooked(now);
          drawLine(tip, p, 0);
        } else if (state === "fly" && flight) {
          const u = Math.min(1, (now - flight.t0) / flight.dur);
          const from = flight.from, to = flight.to;
          const p = { x: lerp(from.x, to.x, u), y: lerp(from.y, to.y, u) - Math.sin(u * Math.PI) * 70 };
          placeBob(p);
          drawLine(tip, p, 10);
          if (u >= 1) land();
        } else if (bait && (state === "fish" || state === "aim" || state === "over")) {
          const b = toPx(bait.nx, bait.ny);
          placeBob(b);
          drawLine(tip, b, active && active.state === "bite" ? 6 : 28);
        } else {
          const p = { x: tip.x, y: tip.y + S * 0.4 };
          placeBob(p);
          drawLine(tip, p, 0);
        }

        if (state === "aim" && aim) {
          const T = tip;
          aimPath.setAttribute("d", `M${T.x},${T.y} Q${(T.x + aim.x) / 2},${Math.min(T.y, aim.y) - 60} ${aim.x},${aim.y}`);
          aimRing.setAttribute("cx", aim.x);
          aimRing.setAttribute("cy", aim.y);
          aimPath.setAttribute("opacity", 1);
          aimRing.setAttribute("opacity", 1);
        } else {
          aimPath.setAttribute("opacity", 0);
          aimRing.setAttribute("opacity", 0);
        }

        ctx.raf(frame);
      }

      // ---------- Input ----------
      const local = (e) => {
        const wr = wrap.getBoundingClientRect();
        return { x: e.clientX - wr.left, y: e.clientY - wr.top };
      };
      const clampToPond = (p) => ({
        x: clamp(p.x, P.l + 24, P.l + P.w - 24),
        y: clamp(p.y, P.t + 24, P.t + P.h - 24),
      });
      function hitsFish(f, p) {
        const c = fishPx(f);
        const b = bait ? toPx(bait.nx, bait.ny) : c;
        return (Math.abs(p.x - c.x) <= FW / 2 + HIT_SLOP && Math.abs(p.y - c.y) <= FH / 2 + HIT_SLOP) ||
          Math.hypot(p.x - b.x, p.y - b.y) <= 60;
      }

      wrap.addEventListener("pointerdown", (e) => {
        if (done || ctx.ended || e.target.closest(".fi-mon")) return;
        e.preventDefault();
        const p = local(e);
        if (state === "fish" && active && active.state === "bite" && hitsFish(active, p)) { pull(active); return; }
        if (state !== "ready" && state !== "fish") return;
        // A tap on a fish that's on its way to the bait shouldn't scare it off.
        if (state === "fish" && active && active.state === "approach" && hitsFish(active, p)) return;
        if (p.y < P.t - 40) return; // up on the shore
        state = "aim";
        aimId = e.pointerId;
        aim = clampToPond(p);
        try { wrap.setPointerCapture(e.pointerId); } catch (err) { /* old browsers */ }
      });
      wrap.addEventListener("pointermove", (e) => {
        if (state !== "aim" || e.pointerId !== aimId) return;
        aim = clampToPond(local(e));
      });
      wrap.addEventListener("pointerup", (e) => {
        if (state !== "aim" || e.pointerId !== aimId) return;
        cast(clampToPond(local(e)));
      });
      wrap.addEventListener("pointercancel", (e) => {
        if (state !== "aim" || e.pointerId !== aimId) return;
        aim = null;
        state = bait ? "fish" : "ready";
      });

      // ---------- Actions ----------
      function cast(to) {
        if (done) return;
        const now = performance.now();
        if (active) sendAway(active, now);
        bait = null;
        aim = null;
        state = "fly";
        if (ghostShown) { ghostShown = false; ghost.remove(); }
        const T = rodTip();
        const from = { x: T.x, y: T.y + S * 0.4 };
        const dist = Math.hypot(to.x - from.x, to.y - from.y);
        flight = { from, to, t0: now, dur: clamp(dist * 1.3, 280, 520) };
        castSound();
      }
      function land() {
        const to = flight.to;
        flight = null;
        bait = { nx: (to.x - P.l) / P.w, ny: (to.y - P.t) / P.h };
        state = "fish";
        nextBiteAt = performance.now() + 350;
        ripple(to);
        plopSound();
      }

      // Tap on a biting fish: reel it up to the monster.
      function pull(f) {
        const won = f.item === target;
        if (won) { done = true; ctx.win(); }
        const now = performance.now();
        f.el.classList.remove("bite");
        f.el.classList.add("hooked");
        bob.classList.remove("dip");
        bob.classList.add("hide");
        mon.classList.remove("watch");
        active = null;
        bait = null;
        state = "reel";
        f.state = "reel";
        const T = rodTip();
        hooked = { f, from: fishPx(f), to: { x: T.x + 10, y: T.y + S * 0.55 }, t0: now, dur: 520, back: false, won };
        reelSound();
        ripple(fishPx(f));
      }

      // Moves the hooked fish along its arc; returns where the line ends.
      function stepHooked(now) {
        const h = hooked;
        const u = Math.min(1, (now - h.t0) / h.dur);
        const e = h.back ? u : 1 - (1 - u) * (1 - u);
        const x = lerp(h.from.x, h.to.x, e);
        const y = lerp(h.from.y, h.to.y, e) - Math.sin(u * Math.PI) * (h.back ? 80 : 50);
        h.f.el.style.transform = `translate(${x}px,${y}px)`;
        if (u >= 1 && !h.arrived) {
          h.arrived = true;
          if (h.back) splashBack(h.f);
          else if (h.won) landed(h.f);
          else wrongFish(h.f);
        }
        if (h.back) return { x: rodTip().x, y: rodTip().y + S * 0.4 };
        return { x: x + h.f.dir * FW * 0.47, y };
      }

      function landed(f) {
        f.state = "held";
        bubble.textContent = TEXT.bubbleHappy;
        mon.classList.add("happy");
        ctx.say(answer);
        const p = { x: hooked.to.x, y: hooked.to.y };
        ctx.confetti(fx, p.x, p.y, { count: 30 });
        hearts(p.x, p.y);
      }

      function wrongFish(f) {
        f.state = "held";
        mon.classList.add("sad");
        bubble.textContent = TEXT.bubbleSad;
        sadSound();
        later(() => {                                   // toss it back
          const T = rodTip();
          f.el.classList.remove("hooked");
          f.dir = Math.random() < 0.5 ? 1 : -1;
          const nx = minNx() + Math.random() * (maxNx() - minNx());
          const ny = minNy() + (0.35 + Math.random() * 0.6) * (maxNy() - minNy());
          f.nx = nx; f.ny = f.baseNy = ny;
          hooked = { f, from: { x: T.x + 10, y: T.y + S * 0.55 }, to: toPx(nx, ny), t0: performance.now(), dur: 420, back: true };
          f.state = "toss";
          state = "ready";
          bob.classList.remove("hide");
          tossSound();
        }, 700);
        later(() => {
          if (done || ctx.ended) return;
          mon.classList.remove("sad");
          bubble.textContent = restBubble;
          ctx.say(prompt);
        }, 1300);
      }

      function splashBack(f) {
        hooked = null;
        f.state = "roam";
        f.triedUntil = performance.now() + 3500;
        ripple(fishPx(f));
        plopSound();
      }

      function ripple(p, small) {
        if (reduceMotion) return;
        const r = document.createElement("div");
        r.className = "fi-ripple";
        r.style.left = `${p.x}px`;
        r.style.top = `${p.y}px`;
        if (small) r.style.scale = ".6";
        fx.appendChild(r);
        later(() => r.remove(), 650);
      }

      function hearts(x, y) {
        if (reduceMotion) return;
        for (let i = 0; i < 5; i++) {
          const h = document.createElement("div");
          h.className = "fi-heart";
          h.textContent = TEXT.heart;
          fx.appendChild(h);
          const dx = (Math.random() - 0.5) * 160;
          h.animate(
            [{ transform: `translate(${x}px,${y}px) translate(-50%,-50%) scale(.4)`, opacity: 1 },
             { transform: `translate(${x + dx}px,${y - 90 - Math.random() * 60}px) translate(-50%,-50%) scale(1.2)`, opacity: 0 }],
            { duration: 800 + Math.random() * 300, easing: "ease-out", fill: "forwards" });
        }
      }

      function replay() {
        if (done) return;
        ctx.say(prompt);
      }

      ctx.onTimeout(() => {
        done = true;
        if (state === "aim") state = bait ? "fish" : "ready";
        if (active && active.state === "bite") sendAway(active, performance.now());
        if (state !== "reel") state = "over";
        mon.classList.remove("watch", "happy");
        mon.classList.add("sad");
        bubble.textContent = TEXT.bubbleSad;
        const f = fish.find((x) => x.item === target);
        if (f) f.el.classList.add("answer");
        ctx.say(answer);
      });

      // ---------- Sound effects ----------
      const castSound = () => { sweep(260, 1300, 0.22, "triangle", 0.12); noise(0.18, "bandpass", 1800, 4000, 0.15); };
      const plopSound = () => { sweep(900, 180, 0.12, "sine", 0.2); noise(0.08, "lowpass", 900, 200, 0.3, 0.02); };
      const plipSound = () => tone(1300, 0.05, "sine", 0.12);
      const reelSound = () => { for (let i = 0; i < 8; i++) noise(0.025, "bandpass", 3200, 2800, 0.3, i * 0.055); sweep(300, 900, 0.45, "square", 0.05); };
      const sadSound = () => { sweep(520, 260, 0.35, "sawtooth", 0.08); sweep(400, 180, 0.4, "sawtooth", 0.07, 0.3); };
      const tossSound = () => sweep(500, 1100, 0.2, "triangle", 0.1);

      measure();
      ctx.say(prompt);
      ctx.raf(frame);

      return function cleanup() {
        done = true;
        ro.disconnect();
      };
    },
  });
})();
