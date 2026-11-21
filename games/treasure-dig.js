// TREASURE DIG — a listening game. A treasure map at the top has a 🔊 button; the voice says the
// target ("B for ball", "cat"; phonics: just "B"), and the target is never shown. On a sandy beach
// there are three red X marks, each with a sign: a letter (ABC), a picture (phonics: the one that
// starts with the letter), or a word (CVC, HFW). Tap an X over and over to dig (about 10 quick taps,
// a couple of seconds of frantic tapping): sand flies, the hole gets deeper and the dig sound rises.
// Dig the right X all the way: a shiny treasure chest pops up, the lid flies open and dozens of
// bananas burst out. Dig a wrong X all the way: a bomb comes up, its fuse fizzes, it shakes… BOOM
// (flash, shake), and the right X glows. Each X keeps its own depth, so switching is allowed, but the
// first X dug all the way decides the round. Faster speeds: more taps to dig, and 4 X marks from 2×.
(function () {
  const TEXT = {
    name: { en: "Treasure Dig" },
    icon: "🏴‍☠️",
    howTo: (list) => {
      const what = list.type === "phonics" ? "a picture that starts with that letter"
        : list.type === "letter" ? "that letter" : "that word";
      return { en: {
        steps: [
          ["👂", list.type === "phonics" ? "Listen to the letter, like \"B\"." : list.type === "letter" ? "Listen to the letter, like \"B for ball\"." : "Listen to the word, like \"cat\"."],
          ["❌", `Find the X with ${what}.`],
          ["👆", "Tap it again and again to dig. Faster, faster!"],
          ["💰", "Treasure! Full of bananas!"],
        ],
        tips: [
          "Tap the map to hear it again.",
          "Dig the wrong X and you find a bomb… BOOM! Then the right X glows.",
          "When the game speeds up, digging takes more taps.",
        ],
      } };
    },
    instruction: { en: "DIG FOR\nTREASURE!" },
    mapLabel: "Hear it again",
    spotLabel: (t) => `Dig at ${t}`,
    answer: (spoken, word) => (word ? `${spoken} for ${word}` : spoken),
    boom: "BOOM!",
  };

  const CSS = `
  .td { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:8px; padding-bottom:8px; }
  /* The treasure map: parchment, a dotted path to a red X, and a big 🔊 */
  .td-map { flex:none; position:relative; width:min(78%, 260px); height:78px; padding:0; border:5px solid #111; border-radius:12px; cursor:pointer; touch-action:manipulation;
    background:#f3d9a4; background-image:radial-gradient(circle at 20% 30%, rgba(160,110,50,.25) 0 10%, transparent 11%), radial-gradient(circle at 80% 70%, rgba(160,110,50,.2) 0 12%, transparent 13%);
    box-shadow:0 6px 0 #111; transform:rotate(-2deg); font:inherit; }
  .td-map svg { position:absolute; inset:6px; width:calc(100% - 12px); height:calc(100% - 12px); }
  .td-map .spk { position:absolute; left:50%; top:50%; transform:translate(-50%, -50%); width:56px; height:56px; border-radius:50%; background:#fff; border:4px solid #111;
    display:flex; align-items:center; justify-content:center; font-size:1.7rem; box-shadow:0 3px 0 #111; }
  .td-beach { position:relative; flex:1; min-height:0; width:100%; max-width:560px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111;
    background:#f7d488; background-image:radial-gradient(circle, #e9bf6a 2px, transparent 3px), radial-gradient(circle, #fbe3a8 2px, transparent 3px);
    background-size:26px 26px, 34px 34px; background-position:0 0, 13px 17px; touch-action:manipulation; }
  .td-beach::before { content:""; position:absolute; left:-5%; right:-5%; top:-30px; height:62px; background:#3fb6e8; border-bottom:5px solid #fff;
    border-radius:0 0 50% 50% / 0 0 40% 40%; }   /* a strip of sea at the top */
  .td-fx { position:absolute; inset:0; pointer-events:none; overflow:visible; z-index:8; }

  /* An X spot: its sign on a stake, the painted X, the hole, a pile of sand */
  .td-spot { position:absolute; width:var(--sp); height:calc(var(--sp) * 1.5); transform:translate(-50%, -100%); padding:0; border:0; background:none; font:inherit;
    cursor:pointer; touch-action:manipulation; }
  .td-sign { position:absolute; left:50%; top:0; transform:translateX(-50%) rotate(var(--tilt, -3deg)); min-width:80%; height:44%; padding:0 6px; background:#fff;
    border:4px solid #111; border-radius:10px; box-shadow:0 4px 0 #111; color:#111; display:flex; align-items:center; justify-content:center; white-space:nowrap;
    font-size:calc(var(--sp) * .36); line-height:1; z-index:3; }
  .td-sign.pic { font-size:calc(var(--sp) * .34); }
  .td-sign::after { content:""; position:absolute; left:50%; top:100%; width:7px; height:calc(var(--sp) * .2); margin-left:-3.5px; background:#8b5a2b; border:2px solid #111; z-index:-1; }
  .td-ground { position:absolute; left:0; right:0; bottom:0; height:42%; }
  .td-x { position:absolute; inset:8% 14%; transition:opacity .2s, transform .2s; }
  .td-x::before, .td-x::after { content:""; position:absolute; left:50%; top:50%; width:110%; height:22%; background:#e8173c; border:3px solid #111; border-radius:8px; }
  .td-x::before { transform:translate(-50%, -50%) rotate(28deg); } .td-x::after { transform:translate(-50%, -50%) rotate(-28deg); }
  .td-hole { position:absolute; left:50%; top:52%; width:96%; height:70%; transform:translate(-50%, -50%) scale(var(--d, 0)); border-radius:50%;
    background:radial-gradient(ellipse at 50% 60%, #3a2410 0 35%, #6b4520 60%, #a87a3c 100%); border:4px solid #111; transition:transform .08s ease-out; }
  .td-pile { position:absolute; right:-24%; bottom:4%; width:46%; height:calc(60% * var(--d, 0)); background:#e3b660; border:3px solid #111; border-bottom:0;
    border-radius:50% 50% 0 0; transition:height .08s; }
  .td-spot:not(.digging) .td-pile { display:none; }
  .td-spot.live:not(.digging) .td-x { animation:td-pulse 1.4s ease-in-out infinite; }
  .td-spot.thud .td-ground { animation:td-thud .12s ease-out; }
  .td-spot.dim { opacity:.45; }
  .td-spot.right .td-sign { background:#b8ffcf; box-shadow:0 0 0 5px #fff, 0 0 0 10px #00b86b; animation:td-wiggle .4s ease-in-out 3; }
  .td-shovel { position:absolute; font-size:calc(var(--sp) * .5); line-height:1; transform:translate(-30%, -80%) rotate(-30deg); pointer-events:none; z-index:6; }
  .td-shovel.dig { animation:td-dig .16s ease-in-out; }
  .td-grain { position:absolute; width:9px; height:9px; margin:-4.5px 0 0 -4.5px; background:#d9a84f; border:2px solid #111; border-radius:50%; pointer-events:none; }

  /* The treasure chest (CSS): a brown box with gold bands; the lid flips open */
  .td-chest { position:absolute; left:50%; bottom:30%; width:calc(var(--sp) * 1.05); height:calc(var(--sp) * .78); transform:translateX(-50%); z-index:5; pointer-events:none; }
  .td-cbox { position:absolute; left:0; right:0; bottom:0; height:60%; background:#a0612a; border:4px solid #111; border-radius:4px 4px 8px 8px;
    background-image:linear-gradient(90deg, transparent 0 14%, #f5c518 14% 22%, transparent 22% 78%, #f5c518 78% 86%, transparent 86%); }
  .td-cbox::after { content:""; position:absolute; left:50%; top:-14%; width:18%; height:40%; margin-left:-9%; background:#f5c518; border:3px solid #111; border-radius:4px; }
  .td-clid { position:absolute; left:-2%; right:-2%; bottom:56%; height:46%; background:#b8733a; border:4px solid #111; border-radius:50% 50% 4px 4px / 80% 80% 4px 4px;
    background-image:linear-gradient(90deg, transparent 0 14%, #f5c518 14% 22%, transparent 22% 78%, #f5c518 78% 86%, transparent 86%);
    transform-origin:50% 100%; transition:transform .3s cubic-bezier(.3,1.6,.5,1); }
  .td-chest.open .td-clid { transform:translateY(-30%) rotate(-28deg) translateX(-30%); }
  .td-glow { position:absolute; left:50%; bottom:40%; width:180%; height:180%; transform:translate(-50%, 50%) scale(0); border-radius:50%;
    background:radial-gradient(circle, rgba(255,240,140,.95) 0 30%, rgba(255,220,60,0) 70%); transition:transform .3s; }
  .td-chest.open .td-glow { transform:translate(-50%, 50%) scale(1); }
  .td-chest.rise { animation:td-rise .35s cubic-bezier(.2,1.6,.4,1) both; }
  .td-sparkle { position:absolute; font-size:1.3rem; pointer-events:none; animation:td-spark .8s ease-out forwards; }
  .td-banana { position:absolute; left:0; top:0; font-size:calc(var(--sp) * .42); line-height:1; pointer-events:none; }

  /* The bomb (CSS): a black ball with a shine, a fuse and a fizzing spark */
  .td-bomb { position:absolute; left:50%; bottom:30%; width:calc(var(--sp) * .78); height:calc(var(--sp) * .78); transform:translateX(-50%); z-index:5; pointer-events:none; }
  .td-bomb .ball { position:absolute; inset:16% 0 0; background:radial-gradient(circle at 35% 35%, #666 0 12%, #222 30%, #000 70%); border:4px solid #111; border-radius:50%; }
  .td-bomb .cap { position:absolute; left:50%; top:6%; width:28%; height:16%; margin-left:-14%; background:#444; border:3px solid #111; border-radius:4px; }
  .td-bomb .fuse { position:absolute; left:58%; top:-10%; width:24%; height:22%; border:4px solid #8b5a2b; border-color:#8b5a2b transparent transparent #8b5a2b; border-radius:50% 0 0 0; }
  .td-bomb .spark { position:absolute; left:82%; top:-18%; width:26%; height:26%; background:radial-gradient(circle, #fff 0 20%, #ffd400 40%, #ff6a00 70%, transparent 72%);
    border-radius:50%; animation:td-fizz .12s steps(2) infinite; }
  .td-bomb.rise { animation:td-rise .35s cubic-bezier(.2,1.6,.4,1) both; }
  .td-bomb.shake { animation:td-shake .08s linear infinite; }
  .td-boom { position:absolute; width:calc(var(--sp) * 3); height:calc(var(--sp) * 3); transform:translate(-50%, -50%) scale(.2); z-index:9; pointer-events:none;
    background:radial-gradient(circle, #fff 0 18%, #ffd400 32%, #ff6a00 55%, #e8173c 70%, transparent 71%);
    clip-path:polygon(50% 0, 61% 30%, 95% 15%, 72% 45%, 100% 55%, 70% 64%, 85% 95%, 55% 75%, 40% 100%, 36% 72%, 5% 88%, 26% 58%, 0 40%, 30% 35%, 15% 8%, 42% 26%);
    animation:td-boom .5s ease-out forwards; }
  .td-boomtxt { position:absolute; transform:translate(-50%, -50%) rotate(-8deg); z-index:10; pointer-events:none; font-size:calc(var(--sp) * .6); color:#ffd400;
    -webkit-text-stroke:3px #111; paint-order:stroke fill; text-shadow:0 5px 0 #111; animation:td-pop .3s cubic-bezier(.2,1.8,.4,1) both; }
  .td-beach.flash::after { content:""; position:absolute; inset:0; background:#fff; z-index:11; animation:td-flash .35s ease-out forwards; pointer-events:none; }
  .td.shake { animation:td-shake .07s linear 6; }
  .td-spot.sooty .td-sign { filter:brightness(.35); }

  @keyframes td-pulse { 50% { transform:scale(1.08); } }
  @keyframes td-thud { 50% { transform:translateY(3px) scaleY(.94); } }
  @keyframes td-dig { 0% { transform:translate(-30%, -80%) rotate(-30deg); } 50% { transform:translate(-20%, -40%) rotate(10deg); } 100% { transform:translate(-30%, -80%) rotate(-30deg); } }
  @keyframes td-wiggle { 25% { rotate:-6deg; } 75% { rotate:6deg; } }
  @keyframes td-rise { from { transform:translateX(-50%) translateY(60%) scale(.3); } }
  @keyframes td-spark { from { opacity:1; transform:scale(.4); } to { opacity:0; transform:scale(1.6) translateY(-30px); } }
  @keyframes td-fizz { 50% { transform:scale(1.4) rotate(40deg); } }
  @keyframes td-shake { 25% { translate:-4px 1px; } 75% { translate:4px -1px; } }
  @keyframes td-boom { 60% { transform:translate(-50%, -50%) scale(1.1); opacity:1; } to { transform:translate(-50%, -50%) scale(1.3); opacity:0; } }
  @keyframes td-pop { from { transform:translate(-50%, -50%) scale(.2) rotate(-8deg); } }
  @keyframes td-flash { from { opacity:.9; } to { opacity:0; } }
  @media (prefers-reduced-motion: reduce) {
    .td-spot.live .td-x, .td-spot.right .td-sign, .td-bomb .spark, .td-bomb.shake, .td.shake, .td-shovel.dig, .td-chest.rise, .td-bomb.rise { animation:none !important; }
  }`;

  function injectCss() {
    if (document.getElementById("td-css")) return;
    const style = document.createElement("style");
    style.id = "td-css";
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  registerMicrogame({
    id: "treasure-dig",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 9000,
    input: "tap",
    tutorial: true, // has a ctx.tutorial script

    start(ctx) {
      injectCss();
      const speed = ctx.speed || 1;
      const type = ctx.list.type;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const { tone, sweep, noise } = ctx.sfx;
      const n = speed >= 2 ? 4 : 3;
      const TAPS = speed >= 2 ? 13 : speed >= 1.5 ? 12 : 10;  // taps to dig all the way (a couple of seconds)
      const letterName = (it) => it.say || it.text.toUpperCase();

      // ---------- Content: spots = [{ text, kind: "letter" | "pic" | "word", right }] ----------
      let prompt, answer, spots, answerItem;
      if (type === "phonics") {
        const letter = ctx.items.find((it) => ctx.phonics.pics(it).length) || ctx.items[0];
        answerItem = letter;
        const set = ctx.phonics.set(letter, 1, n - 1);
        const right = set.right[0];
        prompt = letterName(letter);
        answer = TEXT.answer(letterName(letter), right.word);
        spots = [right, ...set.wrong].map((p) => ({ text: p.emoji, kind: "pic", right: p === right }));
      } else if (type === "letter") {
        const target = ctx.items[0];
        answerItem = target;
        prompt = answer = TEXT.answer(letterName(target), target.word);
        spots = ctx.pickOptions(target, n).map((o) => ({ text: o.text.toUpperCase(), kind: "letter", right: o === target }));
      } else {
        const ok = (it) => it.text.length <= 6;
        const target = ctx.items.find(ok) || ctx.items[0];
        answerItem = target;
        prompt = answer = target.say || target.text;
        spots = ctx.pickOptions(target, n + 2).filter((o) => o === target || ok(o)).slice(0, n)
          .map((o) => ({ text: o.text, kind: "word", right: o === target }));
        if (!spots.some((s) => s.right)) spots[0] = { text: target.text, kind: "word", right: true };
      }
      spots = ctx.shuffle(spots);

      // ---------- DOM ----------
      const wrap = document.createElement("div");
      wrap.className = "td";
      const map = document.createElement("button");
      map.className = "td-map";
      map.setAttribute("aria-label", TEXT.mapLabel);
      map.innerHTML = '<svg viewBox="0 0 200 60" preserveAspectRatio="none" aria-hidden="true">' +
        '<path d="M10 48 C40 10 70 55 100 30 S150 8 170 22" fill="none" stroke="#7a4a1c" stroke-width="3" stroke-dasharray="6 6"/>' +
        '<path d="M176 14 l14 14 M190 14 l-14 14" stroke="#e8173c" stroke-width="5" stroke-linecap="round"/></svg>' +
        '<span class="spk">🔊</span>';
      map.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });
      const beach = document.createElement("div");
      beach.className = "td-beach";
      const fx = document.createElement("div");
      fx.className = "td-fx";
      beach.appendChild(fx);
      wrap.append(map, beach);
      ctx.root.appendChild(wrap);

      const tilts = ["-4deg", "3deg", "-2deg", "4deg"];
      const holes = spots.map((s, i) => {
        const el = document.createElement("button");
        el.className = "td-spot live";
        el.setAttribute("aria-label", TEXT.spotLabel(s.text));
        el.style.setProperty("--tilt", tilts[i % tilts.length]);
        el.innerHTML = '<div class="td-sign"></div><div class="td-ground"><div class="td-pile"></div><div class="td-hole"></div><div class="td-x"></div></div>';
        const sign = el.querySelector(".td-sign");
        sign.textContent = s.text;
        if (s.kind === "pic") sign.classList.add("pic");
        el.addEventListener("pointerdown", (e) => { e.preventDefault(); dig(h); });
        el.addEventListener("click", (e) => { if (e.detail === 0) dig(h); }); // keyboard
        beach.appendChild(el);
        const h = { el, sign, s, depth: 0, x: 0, y: 0, ground: el.querySelector(".td-ground") };
        return h;
      });

      // ---------- Layout ----------
      let W = 0, H = 0, sp = 90;
      function layout() {
        W = beach.clientWidth; H = beach.clientHeight;
        sp = Math.max(64, Math.min((W - 24) / n - 14, H * 0.46, 150));
        beach.style.setProperty("--sp", `${sp}px`);
        holes.forEach((h, i) => {
          h.x = (W / n) * (i + 0.5);
          h.y = H * (n === 4 ? (i % 2 ? 0.86 : 0.74) : 0.8) + (i === 1 && n === 3 ? H * 0.06 : 0);
          h.el.style.left = `${h.x}px`;
          h.el.style.top = `${Math.min(H - 6, h.y)}px`;
          h.sign.style.fontSize = h.s.kind === "word" ? `${Math.min(sp * 0.34, (sp * 1.1) / (h.s.text.length * 0.6))}px` : "";
        });
      }
      layout();
      const ro = new ResizeObserver(layout);
      ro.observe(beach);

      // ---------- Digging ----------
      let done = false;
      const centerOf = (el) => { const r = el.getBoundingClientRect(), b = beach.getBoundingClientRect(); return { x: r.left + r.width / 2 - b.left, y: r.top + r.height / 2 - b.top }; };
      function dig(h) {
        if (done || ctx.ended) return;
        h.depth = Math.min(TAPS, h.depth + 1);
        const d = h.depth / TAPS;
        h.el.classList.add("digging");
        h.el.style.setProperty("--d", (0.25 + d * 0.75).toFixed(3));
        h.el.querySelector(".td-x").style.opacity = String(Math.max(0, 1 - d * 1.6));
        h.el.classList.remove("thud"); void h.el.offsetWidth; h.el.classList.add("thud");
        // The dig sound rises as the hole gets deeper.
        noise(0.05, "bandpass", 500 + d * 900, 800, 0.35);
        tone(200 + d * 500, 0.05, "square", 0.05);
        shovel(h);
        if (!reduceMotion) sand(h, 4);
        if (h.depth >= TAPS) found(h);
      }
      function shovel(h) {
        let s = h.el.querySelector(".td-shovel");
        if (!s) {
          s = document.createElement("div");
          s.className = "td-shovel";
          s.textContent = "🪏";
          s.style.left = "62%"; s.style.top = "62%";
          h.el.appendChild(s);
        }
        s.classList.remove("dig"); void s.offsetWidth; s.classList.add("dig");
      }
      function sand(h, count) {
        const c = centerOf(h.ground);
        for (let k = 0; k < count; k++) {
          const g = document.createElement("div");
          g.className = "td-grain";
          g.style.left = `${c.x}px`; g.style.top = `${c.y}px`;
          fx.appendChild(g);
          const dx = (Math.random() - 0.5) * sp * 1.4, up = sp * (0.4 + Math.random() * 0.5);
          g.animate([{ transform: "translate(0,0)" }, { transform: `translate(${dx / 2}px, ${-up}px)`, offset: 0.45 }, { transform: `translate(${dx}px, ${sp * 0.2}px)`, opacity: 0 }],
            { duration: 420 + Math.random() * 200, easing: "ease-out", fill: "forwards" });
          ctx.later(() => g.remove(), 700);
        }
      }

      function found(h) {
        done = true;
        holes.forEach((x) => { x.el.classList.remove("live"); x.el.disabled = true; x.el.querySelector(".td-shovel")?.remove(); });
        if (h.s.right) treasure(h); else bomb(h);
      }

      function treasure(h) {
        ctx.win();
        const chest = document.createElement("div");
        chest.className = "td-chest rise";
        chest.innerHTML = '<div class="td-glow"></div><div class="td-cbox"></div><div class="td-clid"></div>';
        h.el.appendChild(chest);
        tone(523, 0.1, "triangle", 0.12); tone(784, 0.14, "triangle", 0.12, 0.08);
        ctx.later(() => {
          chest.classList.add("open");
          [0, 0.07, 0.14, 0.21].forEach((t, i) => tone(784 + i * 196, 0.12, "triangle", 0.1, t)); // ta-da-da-da
          noise(0.4, "highpass", 3000, 6000, 0.15); // shimmer
          bananas(h, reduceMotion ? 8 : 36);
          sparkles(h);
          ctx.confetti(fx, h.x, h.y - sp * 0.6, { count: 70 });
        }, reduceMotion ? 10 : 380);
        ctx.say(answer);
      }
      function bananas(h, count) {
        const c = centerOf(h.el.querySelector(".td-chest"));
        for (let k = 0; k < count; k++) {
          const b = document.createElement("div");
          b.className = "td-banana";
          b.textContent = "🍌";
          fx.appendChild(b);
          const ang = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
          const v = sp * (1.4 + Math.random() * 1.6);
          const dx = Math.cos(ang) * v, up = -Math.sin(ang) * v;
          const spin = (Math.random() - 0.5) * 900;
          const at = (x, y, r) => `translate(${(c.x + x).toFixed(1)}px, ${(c.y + y).toFixed(1)}px) translate(-50%, -50%) rotate(${r}deg)`;
          b.animate([
            { transform: at(0, 0, 0) },
            { transform: at(dx * 0.55, -up, spin * 0.5), offset: 0.45 },
            { transform: at(dx, H, spin) },
          ], { duration: 1100 + Math.random() * 600, delay: k * 18, easing: "cubic-bezier(.25,.6,.5,1)", fill: "both" });
          ctx.later(() => b.remove(), 2400);
        }
      }
      function sparkles(h) {
        const c = centerOf(h.el.querySelector(".td-chest"));
        for (let k = 0; k < 6; k++) {
          const s = document.createElement("div");
          s.className = "td-sparkle";
          s.textContent = "✨";
          s.style.left = `${c.x + (Math.random() - 0.5) * sp * 1.4}px`;
          s.style.top = `${c.y + (Math.random() - 0.7) * sp}px`;
          s.style.animationDelay = `${k * 60}ms`;
          fx.appendChild(s);
          ctx.later(() => s.remove(), 1200);
        }
      }

      function bomb(h) {
        ctx.lose();
        const b = document.createElement("div");
        b.className = "td-bomb rise";
        b.innerHTML = '<div class="ball"></div><div class="cap"></div><div class="fuse"></div><div class="spark"></div>';
        h.el.appendChild(b);
        noise(0.6, "highpass", 4000, 2500, 0.12); // fizz
        ctx.later(() => { b.classList.remove("rise"); b.classList.add("shake"); sweep(400, 1200, 0.4, "square", 0.05); }, reduceMotion ? 10 : 350);
        ctx.later(() => explode(h, b), reduceMotion ? 20 : 800);
        ctx.later(() => { showRight(); ctx.say(answer); }, reduceMotion ? 30 : 1050);
      }
      function explode(h, b) {
        const c = centerOf(b);
        b.remove();
        const boom = document.createElement("div");
        boom.className = "td-boom";
        boom.style.left = `${c.x}px`; boom.style.top = `${c.y}px`;
        fx.appendChild(boom);
        const t = document.createElement("div");
        t.className = "td-boomtxt";
        t.textContent = TEXT.boom;
        t.style.left = `${Math.max(sp * 1.1, Math.min(W - sp * 1.1, c.x))}px`; // kept on screen
        t.style.top = `${Math.max(sp * 0.5, c.y - sp * 0.6)}px`;
        fx.appendChild(t);
        if (!reduceMotion) { beach.classList.add("flash"); wrap.classList.add("shake"); sand(h, 14); }
        h.el.classList.add("sooty");
        noise(0.9, "lowpass", 1500, 60, 0.9); sweep(120, 35, 0.7, "sine", 0.6); // BOOM
      }
      function showRight() {
        holes.forEach((x) => x.el.classList.add(x.s.right ? "right" : "dim"));
      }
      function replay() { if (!done) ctx.say(prompt); }

      ctx.onTimeout(() => { done = true; holes.forEach((x) => { x.el.classList.remove("live"); x.el.disabled = true; }); showRight(); ctx.say(answer); });
      function onKey(e) {
        const i = parseInt(e.key, 10) - 1;
        if (i >= 0 && i < holes.length) { e.preventDefault(); dig(holes[i]); }
        else if (e.key === " ") { e.preventDefault(); replay(); }
      }
      document.addEventListener("keydown", onKey);

      ctx.say(prompt);
      // 👆 TAP! between the X marks (never on one), since "tap again and again" isn't obvious.
      ctx.later(() => ctx.hint(holes.map((h) => h.ground), null, { gap: true, scale: 0.7 }), 80);

      // Tutorial: point at the map (listen!), then at the right X, then dig it with quick taps.
      ctx.tutorial(answerItem, async (f) => {
        const h = holes.find((x) => x.s.right);
        await f.point(map, 1000);
        await f.point(h.sign, 900);
        await f.move(h.ground, 450);
        for (let k = 0; k < TAPS + 2 && !done; k++) {
          await f.tapNow(h.ground);
          await f.wait(90);
        }
        await f.until(() => done, 1000);
      });

      return () => { done = true; ro.disconnect(); document.removeEventListener("keydown", onKey); };
    },
  });
})();
