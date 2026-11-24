// WHACK-A-MOLE — the target letter (or word) sits in a card at the top, and the
// voice says it. Moles pop out of their holes for a couple of seconds, each
// holding a sign on its belly. Whack 3 moles with the target to win.
// Whack 3 wrong moles and the bomb's fuse burns down: BOOM, you lose.
//
// Phonics list: the card shows a letter (B), and the moles hold pictures. Whack 3 that start
// with B (all its pictures take turns). Each whack says the picture's word.
// Tapping an empty hole just whiffs the mallet (no penalty).
// Faster speeds: moles stay up for less time, pop up more often, and more of
// them can be up at once. Letter lists use a 3×3 field; word lists use 2×3 so
// the moles are wide enough for "there".
(function () {
  const TEXT = {
    name: { en: "Whack-a-Mole" },
    icon: "🔨",
    // Practice mode's "How to play" card: steps (icon + sentence) and tips.
    howTo: (list) => {
      const thing = list.type === "letter" ? "letter" : "word";
      if (list.type === "phonics") return { en: {
        steps: [
          ["👂", "Look at the letter on the card at the top and listen, like \"B\"."],
          ["🐹", "Moles pop up holding pictures."],
          ["🔨", "Whack the moles with a picture that starts with B: ball, bee, bear… Whack 3 to win! ⭐⭐⭐"],
        ],
        tips: [
          "Don't whack the wrong moles! Three wrong whacks and the 💣 explodes.",
          "Tap the card at the top to hear the letter again.",
          "When the game speeds up, the moles hide faster and more pop up at once.",
        ],
      } };
      return { en: {
        steps: [
          ["👂", `Look at the card at the top and listen. That's your ${thing}.`],
          ["🐹", `Moles pop up holding ${thing}s.`],
          ["🔨", `Whack the moles holding your ${thing}. Whack 3 to win! ⭐⭐⭐`],
        ],
        tips: [
          "Don't whack the wrong moles! Three wrong whacks and the 💣 explodes.",
          "Tap the card at the top to hear it again.",
          "When the game speeds up, the moles hide faster and more pop up at once.",
        ],
      } };
    },
    instruction: (list) => ({ en: list.type === "letter" ? "WHACK THE\nLETTER!" : list.type === "phonics" ? "WHACK THE\nPICTURES!" : "WHACK THE\nWORD!" }),
    prompt: (spoken, word) => (word ? `${spoken} for ${word}` : spoken),
    targetLabel: (spoken) => `Target: ${spoken}. Hear it again`,
    holeLabel: (spoken) => (spoken ? `Whack ${spoken}` : "Empty hole"),
    goodIcon: "⭐",
    badIcon: "💣",
    goodMark: "✓",
    badMark: "✕",
  };

  const NEED = 3;     // correct whacks to win
  const STRIKES = 3;  // wrong whacks to explode
  const SVG_NS = "http://www.w3.org/2000/svg";

  const CSS = `
  .wm { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:8px; }
  .wm-fx { position:absolute; inset:0; pointer-events:none; z-index:5; overflow:hidden; }

  /* ---- top bar: hits | target | strikes ---- */
  .wm-top { flex:none; width:100%; display:flex; align-items:center; justify-content:space-between; gap:6px; }
  .wm-side { flex:none; display:flex; flex-direction:column; align-items:center; gap:2px; width:84px; }
  .wm-icon { font-size:1.6rem; line-height:1; transition:transform .15s; }
  .wm-pips { display:flex; gap:4px; }
  .wm-pip { width:24px; height:24px; border-radius:50%; background:#fff; border:4px solid #111; box-shadow:0 3px 0 #111;
    display:flex; align-items:center; justify-content:center; color:#fff; font-size:.85rem; line-height:1; }
  .wm-pip.on { animation:wm-pip .3s cubic-bezier(.2,1.8,.4,1); }
  .wm-good .wm-pip.on { background:#22c55e; }
  .wm-bad .wm-pip.on { background:#e8173c; }
  .wm-bad[data-s="1"] .wm-icon { transform:scale(1.15); }
  .wm-bad[data-s="2"] .wm-icon { transform:scale(1.35); animation:wm-tremble .1s linear infinite alternate; }
  .wm-target { flex:0 1 auto; min-width:0; min-height:64px; padding:2px 14px; display:flex; align-items:center; justify-content:center; gap:8px;
    background:#fff; border:5px solid #111; border-radius:18px; box-shadow:0 6px 0 #111; font:inherit; color:#111;
    touch-action:manipulation; animation:wm-in .35s cubic-bezier(.2,1.8,.4,1) both; }
  .wm-target:active { transform:translateY(4px); box-shadow:0 2px 0 #111; }
  .wm-tt { font-size:3rem; line-height:1; white-space:nowrap; }
  .wm-target.word .wm-tt { font-size:2.2rem; }
  .wm-spk { font-size:1.3rem; line-height:1; }
  .wm-target.bump { animation:wm-bump .25s ease-out; }

  /* ---- the lawn ---- */
  .wm-field { position:relative; flex:1; min-height:0; width:100%; display:grid;
    grid-template-columns:repeat(var(--cols), 1fr); grid-template-rows:repeat(var(--rows), 1fr); gap:2px 6px; padding:6px 8px;
    background:#5ccf3c repeating-linear-gradient(100deg, rgba(255,255,255,.08) 0 18px, transparent 18px 36px);
    border:5px solid #111; border-radius:24px; box-shadow:0 6px 0 #111; overflow:hidden; touch-action:none; }
  .wm-hole { position:relative; min-width:0; min-height:0; padding:0; margin:0; border:0; background:none; font:inherit;
    cursor:pointer; touch-action:none; -webkit-tap-highlight-color:transparent; }
  .wm-pit { position:absolute; left:50%; bottom:4%; width:min(94%, calc(var(--ch) * 1.15)); height:24%; transform:translateX(-50%);
    border-radius:50%; background:#2a1708; border:5px solid #111; box-shadow:inset 0 8px 0 rgba(0,0,0,.45), 0 4px 0 rgba(0,0,0,.2); }
  .wm-clip { position:absolute; left:-6%; right:-6%; top:-6%; bottom:16%; overflow:hidden; pointer-events:none; }

  /* ---- the mole ---- */
  .wm-mole { position:absolute; left:50%; bottom:-8px; width:var(--mw); height:94%; transform:translate(-50%, 106%);
    transform-origin:50% 100%; transition:transform .16s cubic-bezier(.3,1.6,.5,1), scale .08s ease-out;
    background:#9a6234; border:5px solid #111; border-radius:50% 50% 14% 14% / 36% 36% 10% 10%;
    box-shadow:inset calc(var(--mw) * -.08) 0 0 rgba(0,0,0,.18); }
  .wm-hole.up .wm-mole { transform:translate(-50%, 0); }
  /* Boss Battle: no mole, the boss (behind the sign) pops up instead */
  .wm-hole.bossy .wm-mole { background:none; border-color:transparent; box-shadow:none; }
  .wm-hole.bossy .wm-face, .wm-hole.bossy .wm-paw { display:none; }
  .wm-hole.bossy .bx-carrier { transform:translate(-50%, -2%); }
  .wm-hole.leaving .wm-mole { transition:transform .2s ease-in, scale .08s ease-out; }
  .wm-face { position:absolute; left:0; right:0; top:6%; height:38%; }
  .wm-eye { position:absolute; top:8%; width:21%; aspect-ratio:1; background:#fff; border:4px solid #111; border-radius:50%; }
  .wm-eye::after { content:""; position:absolute; left:30%; top:30%; width:46%; height:46%; background:#111; border-radius:50%; }
  .wm-eye.l { left:22%; } .wm-eye.r { right:22%; }
  .wm-nose { position:absolute; left:50%; top:44%; width:24%; height:26%; transform:translateX(-50%);
    background:#ff7aa8; border:4px solid #111; border-radius:50%; z-index:1; }
  .wm-mouth { position:absolute; left:50%; top:70%; width:16%; height:24%; transform:translateX(-50%);
    background:#fff; border:3px solid #111; border-radius:0 0 5px 5px;
    background-image:linear-gradient(90deg, transparent 46%, #111 46% 54%, transparent 54%); }
  .wm-belly { position:absolute; left:9%; right:9%; bottom:7%; height:46%; display:flex; align-items:center; justify-content:center;
    background:#fff3d6; border:4px solid #111; border-radius:28% 28% 16px 16px / 34% 34% 16px 16px;
    color:#111; font-size:var(--fs); line-height:1; white-space:nowrap; overflow:visible; }
  .wm-probe { position:absolute; left:0; top:0; visibility:hidden; pointer-events:none; white-space:nowrap; font-size:100px; line-height:1; }
  .wm-paw { position:absolute; top:-10%; width:22%; height:26%; background:#9a6234; border:4px solid #111; border-radius:50%; }
  .wm-paw.l { left:-9%; } .wm-paw.r { right:-9%; }
  .wm-stars { position:absolute; left:50%; top:-14%; transform:translateX(-50%); font-size:calc(var(--mw) * .28); line-height:1;
    opacity:0; pointer-events:none; }

  /* bonked: squashed, eyes squeezed shut, dizzy stars */
  .wm-hole.bonk .wm-mole { scale:1.18 .72; }
  .wm-hole.bonk .wm-eye { height:0; aspect-ratio:auto; top:26%; border-width:3px; border-radius:3px; }
  .wm-hole.bonk .wm-eye::after { display:none; }
  .wm-hole.bonk .wm-stars { opacity:1; animation:wm-spin .5s linear infinite; }
  /* wrong: it laughs at you */
  .wm-hole.laugh .wm-mole { animation:wm-laugh .11s ease-in-out infinite alternate; }
  .wm-hole.laugh .wm-mouth { width:28%; height:34%; background:#c2185b; border-radius:0 0 50% 50%; }
  .wm-hole.laugh .wm-eye { height:0; aspect-ratio:auto; top:22%; border-width:3px; border-radius:50% 50% 0 0; border-bottom:0; width:21%; padding-top:6%; background:none; }
  .wm-hole.laugh .wm-eye::after { display:none; }
  /* after the explosion: sooty */
  .wm.charred .wm-field { filter:brightness(.55) saturate(.4); transition:filter .3s; }
  .wm-hole.soot .wm-mole { background:#3a3a3a; }
  .wm-hole.soot .wm-belly { background:#777; color:transparent; }
  .wm-hole.soot .wm-word { opacity:0; } /* emoji ignore color:transparent */
  .wm-hole.soot .wm-paw { background:#3a3a3a; }
  .wm-hole.soot .wm-nose { background:#666; }
  .wm-hole.soot .wm-eye { animation:wm-blink 1.2s steps(1) infinite; }

  /* ---- effects ---- */
  /* Boss Battle showdown: the boss stands on a hole of its own, whacking it (and missing) */
  .wm-rival { position:absolute; left:0; top:0; z-index:2; pointer-events:none; transition:transform .3s cubic-bezier(.3,.7,.4,1); }
  .wm-rival .bx-boss { margin:calc(var(--bbs) * -1) 0 0 calc(var(--bbs) * -.5); }
  .wm-mallet { position:absolute; font-size:var(--mallet); line-height:1; transform-origin:82% 82%;
    animation:wm-swing .26s cubic-bezier(.5,0,.8,.4) forwards; }
  .wm-pow { position:absolute; width:var(--s); height:var(--s); margin:calc(var(--s) / -2) 0 0 calc(var(--s) / -2);
    background:#ffd400; border:0; clip-path:polygon(50% 0,61% 33%,96% 20%,72% 50%,98% 78%,62% 68%,50% 100%,38% 68%,2% 78%,28% 50%,4% 20%,39% 33%);
    animation:wm-pow .35s ease-out forwards; }
  .wm-x { position:absolute; font-size:var(--s); line-height:1; color:#e8173c; -webkit-text-stroke:4px #111; paint-order:stroke fill;
    transform:translate(-50%, -50%); animation:wm-x .55s ease-out forwards; }
  .wm-flash { position:absolute; inset:0; background:#fff; animation:wm-flash .6s ease-out forwards; }
  .wm-blast { position:absolute; overflow:visible; animation:wm-blast .7s cubic-bezier(.2,.9,.3,1) forwards; }
  .wm-smoke { position:absolute; border-radius:50%; background:#555; border:4px solid #111; opacity:.9; }
  .wm.shake { animation:wm-shake .45s linear; }

  @keyframes wm-in      { from { transform:scale(.6); opacity:0; } }
  @keyframes wm-bump    { 50% { transform:scale(1.12); } }
  @keyframes wm-pip     { from { transform:scale(.3); } }
  @keyframes wm-tremble { from { rotate:-8deg; } to { rotate:8deg; } }
  @keyframes wm-spin    { to { transform:translateX(-50%) rotate(360deg); } }
  @keyframes wm-laugh   { from { rotate:-6deg; } to { rotate:6deg; } }
  @keyframes wm-blink   { 0%, 80% { opacity:1; } 85% { opacity:0; } }
  @keyframes wm-swing   { 0% { transform:rotate(60deg); opacity:1; } 55% { transform:rotate(-12deg); opacity:1; } 100% { transform:rotate(-8deg); opacity:0; } }
  @keyframes wm-pow     { 0% { transform:scale(.2) rotate(0); opacity:1; } 100% { transform:scale(1.3) rotate(25deg); opacity:0; } }
  @keyframes wm-x       { 0% { transform:translate(-50%,-50%) scale(.3); opacity:1; } 30% { transform:translate(-50%,-50%) scale(1.15); } 100% { transform:translate(-50%,-50%) scale(1); opacity:0; } }
  @keyframes wm-flash   { 0% { opacity:1; } 100% { opacity:0; } }
  @keyframes wm-blast   { 0% { transform:scale(.1); opacity:1; } 70% { opacity:1; } 100% { transform:scale(1.1); opacity:0; } }
  @keyframes wm-shake   { 0%,100% { transform:none; } 15% { transform:translate(-10px,6px); } 30% { transform:translate(9px,-8px); }
    45% { transform:translate(-7px,-5px); } 60% { transform:translate(6px,7px); } 80% { transform:translate(-3px,2px); } }
  @media (prefers-reduced-motion: reduce) {
    .wm-target, .wm-pip.on, .wm-hole.laugh .wm-mole, .wm-hole.bonk .wm-stars, .wm.shake, .wm-bad .wm-icon,
    .wm-hole.soot .wm-eye { animation:none; }
    .wm-mole { transition:none; }
  }`;

  function injectCss() {
    if (document.getElementById("wm-css")) return;
    const style = document.createElement("style");
    style.id = "wm-css";
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  registerMicrogame({
    id: "whack-a-mole",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 11000,
    input: "tap",
    tutorial: true,
    bossArt: true, // Boss Battle: draws the boss itself when it's fought (ctx.boss, Boss.fighting) // has a ctx.tutorial script
    bossRival: true, // Boss Battle showdown: the boss whacks along, on a hole of its own

    start(ctx) {
      const bossId = window.Boss ? window.Boss.fighting(ctx) : null; // Boss Battle: the boss pops out of the holes
      injectCss();
      const isLetter = ctx.list.type === "letter";
      const isPhonics = ctx.list.type === "phonics";
      const square = isLetter || isPhonics; // one letter or one picture per sign: 3×3 field
      const speed = ctx.speed || 1;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const spoken = (it) => it.say || it.text;
      // `target` is what the card shows. Moles hold `rights` (whack these) and `distractors`.
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
      const { tone, sweep, noise } = ctx.sfx;

      // Pace: "a couple of seconds" up at 1×, quicker at higher speeds.
      const pace = 0.6 + 0.4 * speed;               // 1 at 1×, 1.6 at 2.5×
      const upMs = 2000 / pace;
      const gapMs = 850 / pace;
      const maxUp = speed >= 1.5 ? 3 : 2;
      const cols = square ? 3 : 2, rows = 3;

      let done = false, hits = 0, strikes = 0, sinceTarget = 0;
      const startedAt = performance.now();

      // ---------- DOM ----------
      const wrap = document.createElement("div");
      wrap.className = "wm";

      const top = document.createElement("div");
      top.className = "wm-top";
      const side = (cls, icon) => {
        const el = document.createElement("div");
        el.className = "wm-side " + cls;
        el.innerHTML = `<div class="wm-icon" aria-hidden="true"></div><div class="wm-pips"></div>`;
        el.querySelector(".wm-icon").textContent = icon;
        const pips = [];
        for (let i = 0; i < 3; i++) {
          const p = document.createElement("div");
          p.className = "wm-pip";
          el.querySelector(".wm-pips").appendChild(p);
          pips.push(p);
        }
        return { el, pips };
      };
      const good = side("wm-good", TEXT.goodIcon);
      const bad = side("wm-bad", TEXT.badIcon);

      const card = document.createElement("button");
      card.className = "wm-target" + (square ? "" : " word");
      card.setAttribute("aria-label", TEXT.targetLabel(spoken(target)));
      const tt = document.createElement("span");
      tt.className = "wm-tt";
      tt.textContent = target.text;
      card.appendChild(tt);
      const spk = document.createElement("span");
      spk.className = "wm-spk";
      spk.setAttribute("aria-hidden", "true");
      spk.textContent = ctx.canSpeak ? "🔊" : (!isPhonics && target.emoji) || "";
      if (spk.textContent) card.appendChild(spk);
      card.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });
      card.addEventListener("click", (e) => { if (e.detail === 0) replay(); });

      top.append(good.el, card, bad.el);

      const field = document.createElement("div");
      field.className = "wm-field";
      field.style.setProperty("--cols", cols);
      field.style.setProperty("--rows", rows);

      const fx = document.createElement("div");
      fx.className = "wm-fx";
      wrap.append(top, field, fx);
      ctx.root.appendChild(wrap);
      const holes = [];
      for (let i = 0; i < cols * rows; i++) {
        const el = document.createElement("button");
        el.className = "wm-hole";
        el.setAttribute("aria-label", TEXT.holeLabel(""));
        el.innerHTML =
          '<div class="wm-pit"></div><div class="wm-clip"><div class="wm-mole">' +
          '<div class="wm-stars" aria-hidden="true">💫</div>' +
          '<div class="wm-face"><div class="wm-eye l"></div><div class="wm-eye r"></div><div class="wm-nose"></div><div class="wm-mouth"></div></div>' +
          '<div class="wm-belly"><div class="wm-paw l"></div><div class="wm-paw r"></div><span class="wm-word"></span></div>' +
          "</div></div>";
        // Boss Battle: the mole is the boss, holding its sign (the mole's fur, face and paws are hidden).
        let boss = null;
        if (bossId) { el.classList.add("bossy"); boss = window.Boss.carrier(bossId, "calc(var(--mw) * 1.1)"); el.querySelector(".wm-mole").prepend(boss); }
        const h = { el, boss, word: el.querySelector(".wm-word"), item: null, state: "empty", token: 0 };
        el.addEventListener("click", (e) => { if (e.detail === 0) whack(h, null); }); // keyboard / assistive
        field.appendChild(el);
        holes.push(h);
      }

      // One pointer handler for the whole lawn, so misses still swing the mallet.
      field.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        const holeEl = e.target.closest(".wm-hole");
        const h = holeEl && holes.find((x) => x.el === holeEl);
        whack(h, e);
      });

      // ---------- Sizing ----------
      let cw = 0, ch = 0, mw = 0;
      // Measure the widest sign text at 100px in the real font, so every word fits its belly.
      const probe = document.createElement("span");
      probe.className = "wm-probe";
      field.appendChild(probe);
      function textRatio() {
        let widest = 0;
        [...rights, ...distractors].forEach((it) => {
          probe.textContent = it.text;
          widest = Math.max(widest, probe.getBoundingClientRect().width);
        });
        return Math.max(0.5, widest / 100);
      }
      function measure() {
        const r = holes[0].el.getBoundingClientRect();
        cw = r.width; ch = r.height;
        mw = Math.max(40, Math.min(cw * 0.86, ch * (square ? 0.95 : 1.25)));
        const bellyW = mw * 0.82 - 18, bellyH = ch * 0.85 * 0.46 - 8;
        const fs = Math.max(12, Math.min(bellyH * 0.82, bellyW / textRatio()));
        field.style.setProperty("--ch", `${ch}px`);
        field.style.setProperty("--mw", `${mw}px`);
        field.style.setProperty("--fs", `${fs}px`);
        fx.style.setProperty("--mallet", `${Math.max(48, Math.min(96, mw * 0.7))}px`);
      }
      measure();
      const ro = new ResizeObserver(measure);
      ro.observe(field);

      // ---------- Moles ----------
      const isUp = (h) => h.state === "up";

      // The next right picture: one that isn't already up, taking turns through them.
      let rightTurn = 0;
      function nextRight() {
        for (let k = 0; k < rights.length; k++) {
          const it = rights[(rightTurn + k) % rights.length];
          if (!holes.some((h) => isUp(h) && h.item === it)) { rightTurn += k + 1; return it; }
        }
        return rights[rightTurn++ % rights.length];
      }

      function chooseItem() {
        const targetUp = holes.some((h) => isUp(h) && isTarget(h.item));
        const pool = distractors.filter((d) => !holes.some((h) => isUp(h) && h.item === d));
        // Catch-up: running short of time with no target showing → always send one.
        const msLeft = ctx.timeLimit - (performance.now() - startedAt);
        const behind = !targetUp && msLeft < (NEED - hits) * (1500 / pace);
        let wantTarget = !pool.length || sinceTarget >= 2 || behind || Math.random() < (targetUp ? 0.25 : 0.6);
        if (wantTarget && targetUp && pool.length && sinceTarget < 2) wantTarget = false; // one target at a time mostly
        if (wantTarget) { sinceTarget = 0; return nextRight(); }
        sinceTarget++;
        return ctx.pick(pool);
      }

      let lastHole = null;
      function spawn() {
        if (done || ctx.ended) return;
        const upCount = holes.filter(isUp).length;
        const empties = holes.filter((h) => h.state === "empty" && h !== lastHole);
        if (upCount < maxUp && empties.length) {
          const h = ctx.pick(empties);
          lastHole = h;
          show(h, chooseItem());
        }
        ctx.later(spawn, gapMs * (0.7 + Math.random() * 0.6));
      }

      function show(h, item) {
        h.item = item;
        h.word.textContent = item.text;
        h.el.setAttribute("aria-label", TEXT.holeLabel(spoken(item)));
        h.el.classList.remove("leaving", "bonk", "laugh");
        if (h.boss) window.Boss.setMood(h.boss, null);
        h.el.classList.add("up");
        h.state = "up";
        const t = ++h.token;
        sweep(320, 620, 0.08, "sine", 0.08);
        ctx.later(() => { if (h.token === t && isUp(h)) hide(h); }, upMs * (0.85 + Math.random() * 0.3));
      }

      function hide(h, delay = 0) {
        const t = ++h.token;
        const go = () => {
          if (h.token !== t) return;
          h.state = "leaving";
          h.el.classList.remove("up");
          h.el.classList.add("leaving");
          ctx.later(() => {
            if (h.token !== t) return;
            h.state = "empty";
            h.item = null;
            h.el.classList.remove("leaving", "bonk", "laugh");
            h.el.setAttribute("aria-label", TEXT.holeLabel(""));
          }, 230);
        };
        if (delay) { h.state = "busy"; ctx.later(go, delay); } else go();
      }

      // ---------- Whacking ----------
      function replay() {
        if (done) return;
        ctx.say(prompt);
        card.classList.remove("bump");
        void card.offsetWidth;
        card.classList.add("bump");
      }

      function pointIn(layer, e, el) {
        const f = layer.getBoundingClientRect();
        if (e && e.clientX !== undefined) return { x: e.clientX - f.left, y: e.clientY - f.top };
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2 - f.left, y: r.top + r.height * 0.45 - f.top };
      }

      function mallet(at) {
        if (reduceMotion) return;
        const m = document.createElement("div");
        m.className = "wm-mallet";
        m.textContent = "🔨";
        const size = parseFloat(fx.style.getPropertyValue("--mallet")) || 64;
        m.style.left = `${at.x - size * 0.3}px`;
        m.style.top = `${at.y - size * 0.4}px`;
        fx.appendChild(m);
        ctx.later(() => m.remove(), 320);
      }

      function whack(h, e) {
        if (done || ctx.ended) return;
        const at = pointIn(fx, e, h ? h.el : field);
        mallet(at);
        if (!h || !isUp(h)) { whiffSound(); return; }

        if (isTarget(h.item)) {
          if (isPhonics) ctx.say(spoken(h.item)); // "bee!"
          hits++;
          fill(good.pips[hits - 1], TEXT.goodMark);
          h.el.classList.add("bonk");
          if (h.boss) window.Boss.setMood(h.boss, "hurt");
          bonkSound();
          pow(at);
          hide(h, 380);
          if (hits >= NEED) {
            done = true;
            ctx.win();
            ctx.confetti(fx, at.x, at.y);
            holes.forEach((x) => { if (x !== h && isUp(x)) hide(x); });
          }
        } else {
          strikes++;
          if (isPhonics) ctx.say(spoken(h.item)); // "duck" — not a B word
          fill(bad.pips[strikes - 1], TEXT.badMark);
          bad.el.dataset.s = String(strikes);
          h.el.classList.add("laugh");
          if (h.boss) window.Boss.setMood(h.boss, "laugh");
          redX(at);
          if (strikes >= STRIKES) {
            done = true;
            ctx.lose();
            explode();
          } else {
            wrongSound();
            hide(h, 550);
          }
        }
      }

      function fill(pip, mark) {
        pip.textContent = mark;
        pip.classList.add("on");
      }

      function pow(at) {
        if (reduceMotion) return;
        const p = document.createElement("div");
        p.className = "wm-pow";
        p.style.cssText = `left:${at.x}px;top:${at.y}px;--s:${mw * 0.9}px;`;
        fx.appendChild(p);
        ctx.later(() => p.remove(), 400);
        ctx.confetti(fx, at.x, at.y, { count: 18 });
      }

      function redX(at) {
        const x = document.createElement("div");
        x.className = "wm-x";
        x.textContent = "✕";
        x.style.cssText = `left:${at.x}px;top:${at.y}px;--s:${mw * 0.8}px;`;
        fx.appendChild(x);
        ctx.later(() => x.remove(), 600);
      }

      // Third strike: the bomb goes off. Flash, blast, shake, then every mole
      // pops up covered in soot and blinks.
      function explode() {
        boomSound();
        holes.forEach((h) => { h.token++; });
        const f = fx.getBoundingClientRect();
        const cx = f.width / 2, cy = f.height * 0.55;

        const flash = document.createElement("div");
        flash.className = "wm-flash";
        fx.appendChild(flash);

        const s = Math.max(f.width, f.height) * 1.3;
        const svg = document.createElementNS(SVG_NS, "svg");
        svg.setAttribute("class", "wm-blast");
        svg.setAttribute("viewBox", "-100 -100 200 200");
        svg.style.cssText = `left:${cx - s / 2}px;top:${cy - s / 2}px;width:${s}px;height:${s}px;`;
        const star = (spikes, outer, inner, rot) => {
          const pts = [];
          for (let i = 0; i < spikes * 2; i++) {
            const r = i % 2 ? inner : outer * (0.85 + Math.random() * 0.3);
            const a = (i / (spikes * 2)) * Math.PI * 2 + rot;
            pts.push(`${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`);
          }
          return pts.join(" ");
        };
        svg.innerHTML =
          `<polygon points="${star(14, 96, 58, 0)}" fill="#ff3b1f" stroke="#111" stroke-width="5" stroke-linejoin="round"/>` +
          `<polygon points="${star(12, 70, 40, 0.3)}" fill="#ff9a00" stroke="#111" stroke-width="4" stroke-linejoin="round"/>` +
          `<polygon points="${star(10, 44, 24, 0.1)}" fill="#ffe600" stroke="#111" stroke-width="3" stroke-linejoin="round"/>`;
        fx.appendChild(svg);

        if (!reduceMotion) {
          wrap.classList.add("shake");
          for (let i = 0; i < 7; i++) {
            const p = document.createElement("div");
            p.className = "wm-smoke";
            const size = mw * (0.35 + Math.random() * 0.4);
            p.style.cssText = `width:${size}px;height:${size}px;left:${cx - size / 2}px;top:${cy - size / 2}px;`;
            fx.appendChild(p);
            const ang = Math.random() * Math.PI * 2;
            const d = f.width * (0.2 + Math.random() * 0.25);
            p.animate(
              [{ transform: "translate(0,0) scale(.3)", opacity: 0.9 },
               { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d - f.height * 0.25}px) scale(1.6)`, opacity: 0 }],
              { duration: 1100 + Math.random() * 400, easing: "cubic-bezier(.2,.7,.4,1)", fill: "forwards" });
          }
        }

        ctx.later(() => {
          wrap.classList.add("charred");
          holes.forEach((h) => {
            h.state = "busy";
            h.el.classList.remove("bonk", "laugh", "leaving");
            h.el.classList.add("soot");
          });
          holes.forEach((h, i) => ctx.later(() => h.el.classList.add("up"), 60 + i * 50));
          coughSound();
        }, 380);
      }

      ctx.onTimeout(() => {
        done = true;
        holes.forEach((h) => {
          if (isUp(h)) { h.el.classList.add("laugh"); hide(h, 700); }
        });
      });

      // Boss Battle showdown: the boss stands on a hole of its own (no mole comes up there while it does),
      // hopping to another empty hole now and then and whacking it: nothing there, a miss every time.
      // At time up it bonks a mole.
      const rv = window.Boss && Boss.rival(ctx);
      let rival = null, bossHole = null;
      function bossTo(h) {
        if (bossHole && bossHole.state === "boss") bossHole.state = "empty";
        bossHole = h;
        if (h.state === "empty") h.state = "boss";
        const f = fx.getBoundingClientRect(), r = h.el.getBoundingClientRect();
        rival.style.transform = `translate(${r.left + r.width / 2 - f.left}px, ${r.bottom - f.top - 4}px)`;
      }
      if (rv) {
        rival = document.createElement("div");
        rival.className = "wm-rival";
        rival.appendChild(rv.el("var(--bbs)"));
        fx.style.setProperty("--bbs", `${Math.max(44, Math.min(mw * 0.95, 110))}px`);
        fx.appendChild(rival);
        rival.style.transition = "none";
        bossTo(ctx.pick(holes));
        void rival.offsetWidth;
        rival.style.transition = "";
        rv.tries(5, () => {
          if (done) return;
          const empties = holes.filter((h) => h.state === "empty" && h !== bossHole);
          if (!empties.length) return;
          bossTo(ctx.pick(empties));
          ctx.later(() => {
            if (done) return;
            mallet(pointIn(fx, null, bossHole.el));
            whiffSound();
            rv.bubble(ctx.pick(window.Boss.TEXT.miss));
          }, 350);
        });
        rv.onTimeUp(() => {
          const h = holes.find((x) => x.el.classList.contains("up")) || bossHole; // (it swings from where it stands, so the mole stays in sight)
          ctx.later(() => {
            const at = pointIn(fx, null, h.el);
            mallet(at);
            bonkSound();
            pow(at);
            h.el.classList.remove("laugh");
            h.el.classList.add("bonk");
            rv.bubble(window.Boss.TEXT.done, 1400);
          }, 330);
        });
      }

      // ---------- Sound effects ----------
      const whiffSound = () => noise(0.08, "highpass", 900, 2600, 0.25);
      const bonkSound = () => {
        noise(0.09, "lowpass", 2400, 300, 0.7);
        tone(1046, 0.08, "square", 0.08, 0.04);
        tone(1568, 0.14, "square", 0.08, 0.1);
      };
      const wrongSound = () => {
        sweep(420, 160, 0.25, "sawtooth", 0.12);
        noise(0.4, "highpass", 3000, 7000, 0.18, 0.05); // fuse sizzle
      };
      const boomSound = () => {
        noise(1.0, "lowpass", 1600, 50, 0.95);
        sweep(130, 30, 0.8, "sine", 0.65);
      };
      const coughSound = () => {
        [0, 0.22, 0.4].forEach((d) => noise(0.12, "bandpass", 700, 400, 0.35, 0.3 + d));
      };

      // Desktop keyboard: type a letter to whack an up mole with it, space to replay.
      function onKey(e) {
        if (done) return;
        if (e.key === " ") { e.preventDefault(); replay(); return; }
        if (!isLetter || e.key.length !== 1) return;
        const h = holes.find((x) => isUp(x) && x.item.text.toUpperCase() === e.key.toUpperCase());
        if (h) whack(h, null);
      }
      document.addEventListener("keydown", onKey);

      ctx.say(prompt);
      // Show the target big in the middle for a moment before play starts (ctx.reveal).
      ctx.later(spawn, 450 + ctx.reveal(card)); // the first mole waits for it


      // Tutorial: point at the card, then whack 3 target moles as they pop up.
      ctx.tutorial(target, async (f) => {
        await f.point(card);
        await f.move(field, 400);
        const upTarget = () => holes.find((h) => isUp(h) && isTarget(h.item));
        for (let n = 0; n < 8 && hits < 3 && !done; n++) { // (a mole can duck before the finger lands)
          if (!(await f.until(upTarget, 6000))) break;
          await f.tap(upTarget().el);
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
