// TRAIN BUILDER — a steam engine waits on the track with empty carriages
// behind it. Tap the carriages in the tray to hook them on in order.
//
// Letter lists: the engine shows a letter (M), and the player adds the next
// three (N, O, P). The engine can start anywhere from A to W.
// Word lists: the engine shows the picture (🐱), the voice says "cat", and the
// player spells it c-a-t. Words with no picture show the word on the engine.
//
// Phonics list: the engine shows a letter (C). Tap the 3 carriages with pictures that start
// with C, in any order. There is 1 wrong picture in the tray (2 from 1.5×).
// Right carriage: it rolls up and couples on with a clunk, and the voice names
// it. Train complete: toot toot, and it steams off the screen.
// Wrong carriage: it shakes and flashes grey, the empty slot bumps, and play
// goes on (no penalty). Out of time: the right carriages roll into place.
// Tap the engine to hear the prompt again.
// Faster speeds add look-alike carriages to the tray (1 at 1.5×, 2 at 2.25×).
(function () {
  const TEXT = {
    name: { en: "Train Builder" },
    icon: "🚂",
    // Practice mode's "How to play" card: steps (icon + sentence) and tips.
    howTo: (list) => (list.type === "phonics" ? TEXT.phonicsHowTo : list.type === "letter"
      ? { en: {
          steps: [
            ["🚂", "The engine shows a letter, like M."],
            ["🔤", "What comes next in the alphabet? M… N, O, P!"],
            ["👆", "Tap the carriages in order: N, then O, then P."],
          ],
          tips: [
            "A wrong carriage just shakes. Try another one!",
            "Tap the engine to hear the letter again.",
            "When the game speeds up, extra carriages try to trick you.",
          ],
        } }
      : { en: {
          steps: [
            list.type === "hfw"
              ? ["👂", "The engine shows a word, and the voice says it, like \"the\"."]
              : ["👂", "The engine shows a picture, and the voice says the word, like \"cat\"."],
            list.type === "hfw" ? ["🔤", "Spell it! T… H… E."] : ["🔤", "Spell it! C… A… T."],
            ["👆", "Tap the letter carriages in order to spell the word."],
          ],
          tips: [
            "A wrong carriage just shakes. Try another one!",
            "Tap the engine to hear the word again.",
            "When the game speeds up, extra carriages try to trick you.",
          ],
        } }),
    phonicsHowTo: { en: {
      steps: [
        ["🚂", "The engine shows a letter, like C."],
        ["🔍", "Find the pictures that start with C. Cat… cake… cow!"],
        ["👆", "Tap them to hook them onto the train. Fill all 3 carriages!"],
      ],
      tips: [
        "Any order is fine.",
        "A picture that doesn't start with the letter just shakes. Try another one!",
        "Tap the engine to hear the letter again.",
        "When the game speeds up, there are more wrong pictures.",
      ],
    } },
    instruction: (list) => ({ en: list.type === "letter" || list.type === "phonics" ? "BUILD THE\nTRAIN!" : "SPELL THE\nTRAIN!" }),
    next: "?",
    engineLabel: (what) => `Engine ${what}. Tap to hear it again.`,
    carLabel: (spoken) => `Add ${spoken}`,
    slotLabel: "Empty carriage",
  };

  const CAR_COLORS = ["#1e6bff", "#ff8a00", "#1fd65f", "#b04dff", "#ff2e88", "#00b5d8"];
  const RUN = 3;      // carriages to add after the engine letter
  const MAX_WORD = 5; // longest word that fits on one track

  const CSS = `
  .tb { position:absolute; inset:0; display:flex; flex-direction:column; overflow:hidden; }
  .tb-scene { position:relative; flex:1; min-height:0; display:flex; flex-direction:column; align-items:center; justify-content:center;
    container-type:inline-size; }
  .tb-train { --u:min(calc((100vw - 32px) / (var(--n) * 1.14 + 1.8)), 120px);
    position:relative; z-index:1; display:flex; align-items:flex-end; gap:calc(var(--u) * .14); }
  @supports (width:1cqw) { .tb-train { --u:min(calc((100cqw - 24px) / (var(--n) * 1.14 + 1.8)), 120px); } }
  .tb-track { width:100%; height:18px; margin-top:-4px; border-top:6px solid #111;
    background:repeating-linear-gradient(90deg, #6b3a12 0 14px, transparent 14px 34px); }

  /* engine: faces left, so the letters read left to right from the front */
  .tb-engine { position:relative; flex:none; width:calc(var(--u) * 1.6); height:calc(var(--u) * 1.25); cursor:pointer; touch-action:manipulation; }
  .tb-cab { position:absolute; right:0; bottom:calc(var(--u) * .2); width:calc(var(--u) * .95); height:calc(var(--u) * .9);
    background:#e8173c; border:4px solid #111; border-radius:8px 8px 4px 4px; box-shadow:inset 0 -6px 0 rgba(0,0,0,.2);
    display:flex; align-items:center; justify-content:center; }
  .tb-roof { position:absolute; left:-10%; right:-10%; top:calc(var(--u) * -.16); height:calc(var(--u) * .18);
    background:#111; border-radius:6px; }
  .tb-face { width:82%; height:76%; background:#fff; border:4px solid #111; border-radius:8px;
    display:flex; align-items:center; justify-content:center; line-height:1;
    font-size:calc(var(--u) * .58); color:#111; }
  .tb-face.pic { font-size:calc(var(--u) * .56); }
  .tb-face.word { font-size:calc(var(--u) * .28); }
  .tb.pics .tb-box { font-size:calc(var(--u) * .5); -webkit-text-stroke:0; text-shadow:none; } /* emoji carriages (phonics) */
  .tb.pics .tb-car.next .tb-box { -webkit-text-stroke:3px #111; }
  .tb-boiler { position:absolute; left:calc(var(--u) * .14); bottom:calc(var(--u) * .2); width:calc(var(--u) * .62); height:calc(var(--u) * .58);
    background:#e8173c; border:4px solid #111; border-right:0; border-radius:calc(var(--u) * .3) 0 0 calc(var(--u) * .3);
    box-shadow:inset 0 -6px 0 rgba(0,0,0,.2); }
  .tb-boiler::after { content:""; position:absolute; left:28%; top:-4px; bottom:-4px; width:10%; background:#ffd400; border:3px solid #111; border-top:0; border-bottom:0; }
  .tb-chimney { position:absolute; left:calc(var(--u) * .24); bottom:calc(var(--u) * .74); width:calc(var(--u) * .2); height:calc(var(--u) * .3);
    background:#333; border:4px solid #111; border-bottom:0; }
  .tb-chimney::before { content:""; position:absolute; left:-40%; right:-40%; top:-30%; height:35%; background:#333; border:4px solid #111; border-radius:4px; }
  .tb-catcher { position:absolute; left:0; bottom:calc(var(--u) * .08); width:calc(var(--u) * .26); height:calc(var(--u) * .24);
    background:#ffd400; clip-path:polygon(100% 0, 100% 100%, 0 100%); }
  .tb-smoke { position:absolute; left:calc(var(--u) * .2); bottom:calc(var(--u) * 1.05); width:calc(var(--u) * .3); height:calc(var(--u) * .3);
    background:#fff; border:3px solid #111; border-radius:50%; opacity:0; animation:tb-puff 1.2s ease-out infinite; }
  .tb-smoke.b { animation-delay:.6s; }

  .tb-wheel { position:absolute; bottom:0; width:calc(var(--u) * .34); height:calc(var(--u) * .34); border:4px solid #111; border-radius:50%;
    background:conic-gradient(#555 0 25%, #ddd 0 50%, #555 0 75%, #ddd 0); box-sizing:border-box; }
  .tb-wheel.big { width:calc(var(--u) * .44); height:calc(var(--u) * .44); }

  /* carriages (on the train and in the tray share the same look) */
  .tb-car { position:relative; flex:none; width:var(--u); height:calc(var(--u) * 1.02); }
  .tb-box { position:absolute; left:0; right:0; top:0; bottom:calc(var(--u) * .2); background:var(--c, #1e6bff);
    border:4px solid #111; border-radius:8px; box-shadow:inset 0 -6px 0 rgba(0,0,0,.2);
    display:flex; align-items:center; justify-content:center; line-height:1;
    font-size:calc(var(--u) * .62); color:#fff; -webkit-text-stroke:3px #111; paint-order:stroke fill; text-shadow:0 3px 0 #111; }
  .tb-car .tb-wheel { left:12%; }
  .tb-car .tb-wheel + .tb-wheel { left:auto; right:12%; }
  .tb-train .tb-car::before { content:""; position:absolute; left:calc(var(--u) * -.2); bottom:calc(var(--u) * .3);
    width:calc(var(--u) * .26); height:calc(var(--u) * .1); background:#111; border-radius:3px; }
  .tb-car.empty .tb-box { background:rgba(255,255,255,.35); border-style:dashed; box-shadow:none; color:transparent; -webkit-text-stroke:0; text-shadow:none; }
  .tb-car.empty .tb-wheel { opacity:.35; }
  .tb-car.next .tb-box { color:#111; animation:tb-pulse .6s ease-in-out infinite alternate; }
  .tb-car.answer .tb-box { box-shadow:0 0 0 5px #fff, 0 0 0 9px #111; animation:tb-pulse .3s ease-in-out 4; }

  .tb-tray { flex:none; position:relative; z-index:2; display:flex; flex-wrap:wrap; justify-content:center; gap:12px 14px;
    padding:8px 8px 6px; --t:clamp(68px, 24vw, 112px); }
  .tb-tray.many { --t:clamp(58px, 19vw, 96px); gap:10px; }
  .tb-tile { --u:var(--t); padding:0; margin:0; border:0; background:none; font:inherit; cursor:pointer; touch-action:manipulation;
    transition:transform .08s; }
  .tb-tile:active:not(:disabled) { transform:translateY(4px); }
  .tb-tile:disabled { cursor:default; }
  .tb-tile.gone { visibility:hidden; }
  .tb-tile.wrong { animation:tb-shake .4s linear; }
  .tb-tile.wrong .tb-box { background:#888; }
  .tb-car.bump { animation:tb-bump .4s ease-out; }
  .tb-tile.dim { opacity:.45; }

  .tb.go .tb-wheel { animation:tb-spin .25s linear infinite; }
  .tb.go .tb-smoke { animation-duration:.5s; }
  .tb.sad .tb-smoke { animation:none; opacity:0; }
  .tb.sad .tb-face { filter:grayscale(.6); }

  @keyframes tb-puff  { 0% { transform:translate(0,0) scale(.4); opacity:.9; } 100% { transform:translate(calc(var(--u) * .5), calc(var(--u) * -.7)) scale(1.4); opacity:0; } }
  @keyframes tb-pulse { from { transform:scale(1); } to { transform:scale(1.07); } }
  @keyframes tb-spin  { to { transform:rotate(-360deg); } }
  @keyframes tb-bump  { 30% { transform:translateY(-8%) rotate(-5deg); } 60% { transform:translateY(0) rotate(4deg); } }
  @keyframes tb-shake { 20%,60% { transform:translateX(-10px) rotate(-6deg); } 40%,80% { transform:translateX(10px) rotate(6deg); } }
  @media (prefers-reduced-motion: reduce) {
    .tb-smoke, .tb-car.next .tb-box, .tb-car.answer .tb-box, .tb.go .tb-wheel, .tb-tile.wrong, .tb-car.bump { animation:none !important; }
  }`;

  function injectCss() {
    if (document.getElementById("tb-css")) return;
    const style = document.createElement("style");
    style.id = "tb-css";
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  // How the voice says a single letter: use the letter list's `say` spelling when there is one ("Ay").
  function letterSay(ch) {
    const up = ch.toUpperCase();
    const letters = (window.WORD_LISTS || []).find((l) => l.type === "letter");
    const item = letters && letters.items.find((it) => it.text === up);
    return (item && item.say) || up;
  }

  const carHtml = `<div class="tb-box"></div><div class="tb-wheel"></div><div class="tb-wheel"></div>`;

  registerMicrogame({
    id: "train-builder",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 7000, // three or more taps, so a little longer than the others
    input: "tap",
    tutorial: true, // has a ctx.tutorial script

    start(ctx) {
      injectCss();
      const speed = ctx.speed || 1;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const later = ctx.later;
      const isLetter = ctx.list.type === "letter";
      const isPhonics = ctx.list.type === "phonics";
      const spoken = (it) => it.say || it.text;
      let done = false;

      // ---------- Content ----------
      // engine: what the engine shows; needed: [{ text, say }] in order; extras: distractor carriages.
      // Phonics: any order — a right picture fills the next slot (see tap()).
      let engine, needed, extras, prompt, finale, answerItem; // answerItem: the list item the round is about (tutorial)
      const extraCount = speed >= 2.25 ? 2 : speed >= 1.5 ? 1 : 0;

      if (isPhonics) {
        // The engine shows a letter (C); the tray has 3 pictures that start with it, plus 1 wrong
        // picture (2 from 1.5×). Letters with fewer than 3 such pictures (X) are skipped.
        const head = ctx.items.find((it) => ctx.phonics.pics(it).length >= RUN) || ctx.items[0];
        const set = ctx.phonics.set(head, RUN, speed >= 1.5 ? 2 : 1);
        engine = { text: head.text, kind: "letter" };
        answerItem = head;
        needed = set.right.map((p) => ({ text: p.emoji, say: p.word }));
        extras = set.wrong.map((p) => ({ text: p.emoji, say: p.word }));
        prompt = spoken(head);
        finale = `${prompt}! ${needed.map((c) => c.say).join(", ")}`;
      } else if (isLetter) {
        const abc = [...ctx.items].sort((a, b) => a.text.localeCompare(b.text));
        const run = Math.min(RUN, abc.length - 1);
        const at = Math.floor(Math.random() * (abc.length - run)); // A..W for a full alphabet
        const head = abc[at];
        const seq = abc.slice(at + 1, at + 1 + run);
        const used = new Set([head, ...seq]);
        engine = { text: head.text, kind: "letter" };
        answerItem = head;
        needed = seq.map((it) => ({ text: it.text, say: spoken(it) }));
        // Best distractors: the letter just after the run (jumping ahead), then look-alikes.
        const byText = new Map(abc.map((it) => [it.text, it]));
        const tricky = ctx.shuffle(seq.flatMap((it) => (it.tricky || []).map((t) => byText.get(t))));
        const pool = [abc[at + 1 + run], ...tricky, ...ctx.shuffle(abc.slice())].filter((it) => it && !used.has(it));
        extras = [...new Set(pool)].slice(0, extraCount).map((it) => ({ text: it.text, say: spoken(it) }));
        prompt = spoken(head);
        finale = [head, ...seq].map(spoken).join(", ");
      } else {
        const ok = (it) => /^[a-z]+$/i.test(it.text) && it.text.length >= 2 && it.text.length <= MAX_WORD;
        const target = ctx.items.find((it) => ok(it) && it.emoji) || ctx.items.find(ok) || ctx.items[0];
        const letters = target.text.slice(0, MAX_WORD).split("");
        answerItem = target;
        engine = target.emoji ? { text: target.emoji, kind: "pic" } : { text: target.text, kind: "word" };
        needed = letters.map((ch) => ({ text: ch, say: letterSay(ch) }));
        // Distractors: letters from other words in the list that aren't in this word, tricky words first.
        const byText = new Map(ctx.items.map((it) => [it.text, it]));
        const near = (target.tricky || []).map((t) => byText.get(t)).filter(Boolean);
        const inWord = new Set(letters.map((c) => c.toLowerCase()));
        const pool = [...near, ...ctx.items].flatMap((it) => ctx.shuffle(it.text.toLowerCase().split("")))
          .filter((c) => /[a-z]/.test(c) && !inWord.has(c));
        extras = [...new Set(pool)].slice(0, extraCount).map((ch) => ({ text: ch, say: letterSay(ch) }));
        prompt = spoken(target);
        finale = prompt;
      }

      // ---------- DOM ----------
      const wrap = document.createElement("div");
      wrap.className = "tb" + (isPhonics ? " pics" : "");
      wrap.innerHTML = `
        <div class="tb-scene">
          <div class="tb-train" style="--n:${needed.length}">
            <div class="tb-engine" role="button" tabindex="0">
              <div class="tb-smoke"></div><div class="tb-smoke b"></div>
              <div class="tb-chimney"></div>
              <div class="tb-boiler"></div>
              <div class="tb-cab"><div class="tb-roof"></div><div class="tb-face"></div></div>
              <div class="tb-catcher"></div>
              <div class="tb-wheel" style="left:12%"></div>
              <div class="tb-wheel" style="left:36%"></div>
              <div class="tb-wheel big" style="right:12%"></div>
            </div>
          </div>
          <div class="tb-track"></div>
        </div>
        <div class="tb-tray"></div>`;
      const train = wrap.querySelector(".tb-train");
      const engineEl = wrap.querySelector(".tb-engine");
      const face = wrap.querySelector(".tb-face");
      const tray = wrap.querySelector(".tb-tray");
      face.textContent = engine.text;
      if (engine.kind !== "letter") face.classList.add(engine.kind);
      engineEl.setAttribute("aria-label", TEXT.engineLabel(prompt));

      const slots = needed.map(() => {
        const s = document.createElement("div");
        s.className = "tb-car empty";
        s.innerHTML = carHtml;
        s.setAttribute("aria-label", TEXT.slotLabel);
        train.appendChild(s);
        return s;
      });

      const cards = ctx.shuffle([...needed, ...extras]);
      if (cards.length >= 5) tray.classList.add("many");
      const tiles = cards.map((card, i) => {
        const b = document.createElement("button");
        b.className = "tb-tile";
        b.innerHTML = `<div class="tb-car">${carHtml}</div>`;
        b.querySelector(".tb-box").textContent = card.text;
        b.style.setProperty("--c", CAR_COLORS[i % CAR_COLORS.length]);
        b.setAttribute("aria-label", TEXT.carLabel(card.say));
        b.tbCard = card;
        b.addEventListener("pointerdown", (e) => { e.preventDefault(); tap(b); });
        b.addEventListener("click", (e) => { if (e.detail === 0) tap(b); }); // keyboard
        tray.appendChild(b);
        return b;
      });
      ctx.root.appendChild(wrap);
      // 👆 TAP! in the gap between the track and the carriages, with the word beside the finger.
      ctx.later(() => {
        const g = ctx.root.getBoundingClientRect(), t = tray.getBoundingClientRect();
        const k = wrap.querySelector(".tb-track").getBoundingClientRect();
        ctx.hint({ x: t.left + t.width / 2 - 30 - g.left, y: (k.bottom + t.top) / 2 - g.top }, null,
          { scale: 0.65, side: true, center: true });
      }, 80);
      // A sight word on the engine ("about") shrinks until it fits the cab window.
      // Measured after layout; a face without a size yet is left alone.
      if (engine.kind === "word") ctx.raf(() => {
        if (!face.clientWidth) return;
        const range = document.createRange();
        range.selectNodeContents(face);
        const tooWide = () => range.getBoundingClientRect().width > face.clientWidth * 0.9;
        let px = parseFloat(getComputedStyle(face).fontSize);
        for (let i = 0; i < 12 && tooWide() && px > 9; i++) {
          px *= 0.9;
          face.style.fontSize = `${px}px`;
        }
      });

      let pos = 0; // index of the next empty slot
      const markNext = () => slots.forEach((s, i) => {
        if (!s.classList.contains("empty")) return;
        s.classList.toggle("next", i === pos);
        s.querySelector(".tb-box").textContent = i === pos ? TEXT.next : "";
      });
      markNext();

      const replay = (e) => { if (e) e.preventDefault(); if (!done) ctx.say(prompt); };
      engineEl.addEventListener("pointerdown", replay);
      engineEl.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") replay(e); });
      ctx.say(prompt);

      // ---------- Play ----------
      // Letters match by text, not by tile, so a word with a repeated letter takes either copy.
      const same = (a, b) => a.toLowerCase() === b.toLowerCase();

      function tap(tile) {
        if (done || ctx.ended || tile.disabled) return;
        if (isPhonics) {
          // Any right picture goes next: move it to this slot's place in `needed`, so the
          // pictures still to come (and the timeout reveal) are the ones left in the tray.
          const at = needed.findIndex((c, i) => i >= pos && c.text === tile.tbCard.text);
          if (at < 0) return miss(tile);
          [needed[pos], needed[at]] = [needed[at], needed[pos]];
        }
        const want = needed[pos];
        if (!same(tile.tbCard.text, want.text)) return miss(tile);

        tile.disabled = true;
        attach(slots[pos], tile.tbCard.text, tile.style.getPropertyValue("--c"), tile);
        tile.classList.add("gone");
        pos++;
        if (pos < needed.length) {
          markNext();
          ctx.say(want.say);
          return;
        }
        done = true;
        tiles.forEach((t) => { t.disabled = true; });
        ctx.win();
        ctx.say(finale);
        later(depart, 300);
      }

      // Forgiving: a wrong carriage bounces back to the tray and play goes on.
      // (In word mode it may be needed later, so it stays tappable.)
      function miss(tile) {
        restartClass(tile, "wrong");
        restartClass(slots[pos], "bump");
        clunkSound(true);
      }
      function restartClass(el, cls) {
        el.classList.remove(cls);
        void el.offsetWidth;
        el.classList.add(cls);
        later(() => el.classList.remove(cls), 420);
      }

      // Fill the slot and fly it in from where the tray tile was.
      function attach(slot, text, color, fromTile) {
        slot.classList.remove("empty", "next");
        slot.querySelector(".tb-box").textContent = text;
        slot.style.setProperty("--c", color);
        clunkSound(false);
        if (reduceMotion) return;
        if (fromTile) {
          const a = fromTile.getBoundingClientRect(), b = slot.getBoundingClientRect();
          const k = a.width / b.width;
          slot.animate(
            [{ transform: `translate(${a.left - b.left}px, ${a.top - b.top}px) scale(${k})`, transformOrigin: "0 0" },
             { transform: "translate(0,0) scale(1)", transformOrigin: "0 0" }],
            { duration: 220, easing: "cubic-bezier(.3,1.3,.6,1)" });
        }
        train.animate([{ transform: "translateX(0)" }, { transform: "translateX(-4px)" }, { transform: "translateX(0)" }],
          { duration: 160, delay: fromTile ? 200 : 0 });
      }

      // After a miss or timeout: the right carriages roll on one by one.
      function reveal() {
        const right = new Set();
        slots.forEach((slot, i) => {
          if (i < pos) return;
          const tile = tiles.find((t) => !right.has(t) && !t.classList.contains("gone") && same(t.tbCard.text, needed[i].text));
          if (tile) right.add(tile);
          later(() => {
            attach(slot, needed[i].text, tile ? tile.style.getPropertyValue("--c") : CAR_COLORS[i % CAR_COLORS.length], null);
            slot.classList.add("answer");
            if (tile) tile.classList.add("gone");
          }, (i - pos) * 180);
        });
        tiles.forEach((t) => { if (!right.has(t) && !t.classList.contains("gone") && !t.classList.contains("wrong")) t.classList.add("dim"); });
        ctx.say(finale);
      }

      function depart() {
        wrap.classList.add("go");
        tootSound();
        chugSound();
        if (reduceMotion) return;
        const r = train.getBoundingClientRect();
        train.animate(
          [{ transform: "translateX(0)" }, { transform: "translateX(12px)", offset: 0.15 }, { transform: `translateX(${-(r.right + 40)}px)` }],
          { duration: 1100, easing: "cubic-bezier(.5,0,.9,.5)", fill: "forwards" });
      }

      ctx.onTimeout(() => {
        done = true;
        tiles.forEach((t) => { t.disabled = true; });
        wrap.classList.add("sad");
        slots.forEach((s) => s.classList.remove("next"));
        reveal();
      });

      // Tutorial: point at the engine, then tap the carriages in order.
      ctx.tutorial(answerItem, async (f) => {
        await f.point(engineEl);
        for (let n = 0; n < 8 && pos < needed.length && !done; n++) {
          const live = tiles.filter((t) => !t.disabled && !t.classList.contains("gone"));
          const t = isPhonics ? live.find((x) => needed.slice(pos).some((c) => c.text === x.tbCard.text))
            : live.find((x) => same(x.tbCard.text, needed[pos].text));
          if (!t) break;
          await f.tap(t);
        }
      });

      // ---------- Sound effects ----------
      const { tone, sweep, noise } = ctx.sfx;
      function clunkSound(bad) {
        if (bad) { sweep(220, 90, 0.3, "square", 0.12); noise(0.15, "lowpass", 1200, 200, 0.3); return; }
        tone(180, 0.08, "square", 0.12);
        noise(0.08, "bandpass", 2400, 900, 0.35, 0.02);
        tone(620, 0.06, "triangle", 0.1, 0.06);
      }
      function tootSound() {
        [0, 0.32].forEach((d) => {
          tone(466, 0.26, "square", 0.07, d);
          tone(587, 0.26, "square", 0.06, d);
          tone(698, 0.26, "triangle", 0.06, d);
        });
      }
      function chugSound() {
        for (let i = 0; i < 6; i++) noise(0.09, "bandpass", 900, 300, 0.35, 0.15 + i * 0.16 * (1 - i * 0.08));
      }

      return function cleanup() { done = true; };
    },
  });
})();
