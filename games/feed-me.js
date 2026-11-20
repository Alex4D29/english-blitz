// FEED ME! — a hungry picture (🍎 with crazy eyes and a big mouth) wants its
// letter. The voice only says the word ("apple"), so the player has to work
// out the first letter and drag the A into the apple's mouth.
// Word lists work the same way: 🐱 says "cat" and wants "cat".
//
// Drop the right tile in the mouth: CHOMP, yum. Drop a wrong one: it gets spat
// out. Dropping anywhere else just springs the tile back (no penalty).
// Tapping a tile without dragging wiggles it and the mouth says "AHH" as a hint.
// Tapping the creature repeats the voice prompt.
// Faster speeds add a 4th tile, then the creature starts swaying side to side.
(function () {
  const TEXT = {
    name: { en: "Feed Me" },
    icon: "😋",
    // Practice mode's "How to play" card: steps (icon + sentence) and tips.
    howTo: (list) => ({ en: {
      steps: [
        ["👂", "A hungry picture says its name, like \"apple\"."],
        ["🔤", list.type === "phonics" ? "Which letter does it start with? Apple starts with A!" : "Find the word that matches the picture."],
        ["👆", "Drag that tile into its mouth. Yum!"],
      ],
      tips: [
        "Tap the picture to hear it again.",
        "Feed it the wrong tile and it spits it out, then the voice tells you the answer.",
        "Dropping a tile somewhere else is OK. It just bounces back.",
        "When the game speeds up, there are more tiles and the picture sways.",
      ],
    } }),
    instruction: { en: "FEED ME!" },
    answer: (spoken, word) => (word ? `${spoken} for ${word}` : spoken), // said after a miss
    yum: "Yummy!",
    yuck: "Yuck!",
    creatureLabel: (word) => `Hungry ${word}. Tap to hear it again.`,
    tileLabel: (spoken) => `Feed ${spoken}`,
  };

  const TILE_COLORS = ["#ff2e3b", "#1e6bff", "#1fd65f", "#b04dff", "#ff8a00"];

  const CSS = `
  .fm { position:absolute; inset:0; display:flex; flex-direction:column; }
  .fm-area { position:relative; flex:1; min-height:0; display:flex; align-items:center; justify-content:center; container-type:size; }
  .fm-creature { --s:min(80vw, 40vh); position:relative; width:var(--s); height:var(--s); font-size:var(--s); cursor:pointer; touch-action:manipulation; }
  @supports (width:1cqw) { .fm-creature { --s:min(86cqw, 96cqh); } }
  .fm-body { position:absolute; inset:0; }
  .fm.sway .fm-body { animation:fm-sway var(--fm-sway, 1.6s) ease-in-out infinite alternate; }
  .fm-emoji { position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
    font-size:.82em; line-height:1; filter:drop-shadow(0 .03em 0 #111); animation:fm-breathe .6s ease-in-out infinite alternate; }

  .fm-eye { position:absolute; background:#fff; border:.018em solid #111; border-radius:50%;
    box-shadow:0 .012em 0 #111; overflow:hidden; transition:transform .15s; }
  .fm-eye.l { left:21%; top:24%; width:.25em; height:.25em; }
  .fm-eye.r { left:55%; top:28%; width:.19em; height:.19em; }
  .fm-look { position:absolute; inset:0; transition:transform .08s linear; }
  .fm-pupil { position:absolute; left:50%; top:50%; width:46%; height:46%; margin:-23% 0 0 -23%;
    background:#111; border-radius:50%; animation:fm-crazy .9s ease-in-out infinite; }
  .fm-pupil::after { content:""; position:absolute; left:20%; top:18%; width:30%; height:30%; background:#fff; border-radius:50%; }
  .fm-eye.r .fm-pupil { animation-duration:.55s; animation-direction:reverse; }

  .fm-mouth { position:absolute; left:28%; top:58%; width:.44em; height:.26em; background:#3a0010;
    border:.02em solid #111; border-radius:30% 30% 50% 50% / 25% 25% 75% 75%; overflow:hidden;
    box-shadow:0 .014em 0 #111; transform-origin:50% 20%; animation:fm-gnash .5s ease-in-out infinite alternate; }
  .fm-teeth { position:absolute; left:6%; right:6%; top:-2%; height:28%; background:#fff;
    clip-path:polygon(0 0,100% 0,100% 30%,91% 100%,82% 30%,73% 100%,64% 30%,55% 100%,46% 30%,37% 100%,28% 30%,19% 100%,10% 30%,0 100%); }
  .fm-tongue { position:absolute; left:22%; right:22%; bottom:-20%; height:55%; background:#ff5c8a; border-radius:50% 50% 0 0;
    border:.012em solid #111; }

  .fm.near .fm-mouth { animation:none; transform:scale(1.25, 1.35); }
  .fm.near .fm-eye { transform:scale(1.2); }
  .fm.chomp .fm-mouth { animation:fm-chomp .45s ease-in-out; }
  .fm.happy .fm-eye { transform:scaleY(.25); }
  .fm.happy .fm-emoji { animation:fm-bounce .5s cubic-bezier(.2,1.8,.4,1) 2; }
  .fm.sick .fm-emoji { filter:drop-shadow(0 .03em 0 #111) hue-rotate(80deg) saturate(1.6); }
  .fm.sick .fm-look { animation:fm-spin .5s linear infinite; transform:translate(22%, 0); }
  .fm.sick .fm-pupil, .fm.happy .fm-pupil { animation:none; }
  .fm.shake .fm-area { animation:fm-shake .4s linear; }
  .fm.ahh .fm-mouth { animation:fm-ahh .5s ease-in-out; }

  .fm-tray { flex:none; position:relative; z-index:2; display:flex; justify-content:center; gap:12px; padding:6px 0 4px;
    --t:clamp(72px, 26vw, 120px); }
  .fm-tray.n4 { --t:clamp(62px, 20vw, 100px); gap:10px; }
  .fm-tile { position:relative; width:var(--t); height:var(--t); padding:0; font:inherit; cursor:grab;
    background:#fff; border:5px solid currentColor; border-radius:20px; box-shadow:0 7px 0 #111;
    font-size:calc(var(--t) * .62); line-height:1; display:flex; align-items:center; justify-content:center;
    -webkit-text-stroke:2px #111; paint-order:stroke fill; touch-action:none; }
  .fm-tile.word { font-size:calc(var(--t) * .34); }
  .fm-tile.lifted { z-index:5; cursor:grabbing; box-shadow:0 14px 0 rgba(0,0,0,.35); }
  .fm-tile.wiggle { animation:fm-wiggle .4s ease-in-out; }
  .fm-tile.answer { background:#1fd65f; animation:fm-pulse .3s ease-in-out 4; }
  .fm-tile:disabled { cursor:default; }
  .fm-crumb { position:absolute; width:12px; height:12px; border:2px solid #111; border-radius:3px; pointer-events:none; z-index:6; }

  @keyframes fm-breathe { to { transform:scale(1.04, .97); } }
  @keyframes fm-crazy  { 0% { transform:translate(-18%, -10%); } 33% { transform:translate(20%, 14%); } 66% { transform:translate(-8%, 22%); } 100% { transform:translate(-18%, -10%); } }
  @keyframes fm-gnash  { from { transform:scale(1, .55); } to { transform:scale(1.05, 1); } }
  @keyframes fm-chomp  { 0%,50%,100% { transform:scale(1.1, 1.2); } 25%,75% { transform:scale(1.1, .08); } }
  @keyframes fm-ahh    { 50% { transform:scale(1.3, 1.4); } }
  @keyframes fm-bounce { 40% { transform:translateY(-12%) scale(1.1); } }
  @keyframes fm-spin   { from { transform:rotate(0) translate(22%, 0); } to { transform:rotate(360deg) translate(22%, 0); } }
  @keyframes fm-sway   { from { transform:translateX(-22%) rotate(-6deg); } to { transform:translateX(22%) rotate(6deg); } }
  @keyframes fm-shake  { 20%,60% { transform:translate(-10px, 4px); } 40%,80% { transform:translate(10px, -4px); } }
  @keyframes fm-wiggle { 25% { transform:rotate(-12deg); } 75% { transform:rotate(12deg); } }
  @keyframes fm-pulse  { 50% { transform:scale(1.12); } }
  @media (prefers-reduced-motion: reduce) {
    .fm-emoji, .fm-pupil, .fm-mouth, .fm.sway .fm-body, .fm.sick .fm-look, .fm.shake .fm-area { animation:none !important; }
  }`;

  function injectCss() {
    if (document.getElementById("fm-css")) return;
    const style = document.createElement("style");
    style.id = "fm-css";
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  registerMicrogame({
    id: "feed-me",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["phonics", "cvc"], // needs a picture for every item
    duration: 6000,
    input: "drag", // frame shows DRAG! under the instruction

    start(ctx) {
      injectCss();
      const speed = ctx.speed || 1;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const later = ctx.later;
      let done = false;
      let drag = null;

      const isWord = ctx.list.type !== "phonics";
      // For letters, the word must start with that letter ("X for fox" can't be found from "fox").
      const fits = (it) => it.emoji && (isWord || (it.word || "").charAt(0).toUpperCase() === it.text.toUpperCase());
      const target = ctx.items.find(fits) || ctx.items.find((it) => it.emoji) || ctx.items[0];
      const n = Math.min(speed >= 1.5 ? 4 : 3, ctx.items.length);
      const options = ctx.pickOptions(target, n);
      const spoken = (it) => it.say || it.text;
      const prompt = isWord ? spoken(target) : target.word || spoken(target); // just the word: "zebra"
      const answer = isWord ? spoken(target) : TEXT.answer(spoken(target), target.word);

      // ---------- DOM ----------
      const wrap = document.createElement("div");
      wrap.className = "fm";
      if (speed >= 1.75 && !reduceMotion) {
        wrap.classList.add("sway");
        wrap.style.setProperty("--fm-sway", `${1.8 / speed}s`);
      }
      wrap.innerHTML = `
        <div class="fm-area">
          <div class="fm-creature" role="button" tabindex="0">
            <div class="fm-body">
              <div class="fm-emoji"></div>
              <div class="fm-eye l"><div class="fm-look"><div class="fm-pupil"></div></div></div>
              <div class="fm-eye r"><div class="fm-look"><div class="fm-pupil"></div></div></div>
              <div class="fm-mouth"><div class="fm-teeth"></div><div class="fm-tongue"></div></div>
            </div>
          </div>
        </div>
        <div class="fm-tray${n >= 4 ? " n4" : ""}"></div>`;
      const creature = wrap.querySelector(".fm-creature");
      const body = wrap.querySelector(".fm-body");
      const tray = wrap.querySelector(".fm-tray");
      const looks = [...wrap.querySelectorAll(".fm-look")];
      wrap.querySelector(".fm-emoji").textContent = target.emoji || target.text;
      creature.setAttribute("aria-label", TEXT.creatureLabel(target.word || target.text));
      ctx.root.appendChild(wrap);
      ctx.later(() => ctx.hint([...tray.children], wrap.querySelector(".fm-mouth"), { gap: true }), 80); // 👆 DRAG! from between the tiles to the mouth

      const tiles = options.map((item, i) => {
        const b = document.createElement("button");
        b.className = "fm-tile" + (isWord ? " word" : "");
        b.textContent = item.text;
        b.style.color = TILE_COLORS[i % TILE_COLORS.length];
        b.setAttribute("aria-label", TEXT.tileLabel(spoken(item)));
        b.fmItem = item;
        b.addEventListener("pointerdown", (e) => grab(e, b));
        b.addEventListener("pointermove", move);
        b.addEventListener("pointerup", drop);
        b.addEventListener("pointercancel", cancel);
        b.addEventListener("lostpointercapture", cancel);
        // Keyboard / assistive tech: activating a tile feeds it straight in.
        b.addEventListener("click", (e) => { if (e.detail === 0 && !done) feed(b, 0, 0); });
        tray.appendChild(b);
        return b;
      });

      const replay = (e) => { if (e) e.preventDefault(); if (!done) ctx.say(prompt); };
      creature.addEventListener("pointerdown", replay);
      creature.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") replay(e); });
      ctx.say(prompt);

      // ---------- Geometry ----------
      // Mouth position comes from the body box (the mouth itself is always animating its scale).
      function mouthCenter() {
        const r = body.getBoundingClientRect();
        return { x: r.left + r.width * 0.5, y: r.top + r.height * 0.71, r: r.width * 0.3 };
      }
      function center(el) {
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width };
      }
      function overMouth(tile) {
        const m = mouthCenter(), t = center(tile);
        return Math.hypot(t.x - m.x, t.y - m.y) < m.r + t.w * 0.45;
      }
      function lookAt(x, y) {
        looks.forEach((l) => {
          const c = center(l.parentElement);
          const dx = x - c.x, dy = y - c.y;
          const len = Math.hypot(dx, dy) || 1;
          const k = Math.min(1, len / 120) * 26; // percent of the eye
          l.style.transform = `translate(${(dx / len) * k}%, ${(dy / len) * k}%)`;
        });
      }
      const lookReset = () => looks.forEach((l) => { l.style.transform = ""; });

      // ---------- Dragging ----------
      function grab(e, tile) {
        e.preventDefault();
        if (done || drag || ctx.ended) return;
        try { tile.setPointerCapture(e.pointerId); } catch (err) { /* capture is a nicety */ }
        drag = { tile, id: e.pointerId, x0: e.clientX, y0: e.clientY, dx: 0, dy: 0, moved: false };
        tile.getAnimations().forEach((a) => a.cancel());
        tile.classList.add("lifted");
        tile.style.transform = "scale(1.12)";
        sweep(380, 760, 0.07, "square", 0.06);
      }
      function move(e) {
        if (!drag || e.pointerId !== drag.id || done) return;
        drag.dx = e.clientX - drag.x0;
        drag.dy = e.clientY - drag.y0;
        if (Math.hypot(drag.dx, drag.dy) > 10) drag.moved = true;
        drag.tile.style.transform = `translate(${drag.dx}px, ${drag.dy}px) scale(1.12) rotate(${Math.max(-12, Math.min(12, drag.dx / 12))}deg)`;
        const t = center(drag.tile);
        lookAt(t.x, t.y);
        wrap.classList.toggle("near", overMouth(drag.tile));
      }
      function drop(e) {
        if (!drag || e.pointerId !== drag.id) return;
        const d = drag;
        drag = null;
        wrap.classList.remove("near");
        if (done) return;
        if (!d.moved) return hint(d.tile);
        if (overMouth(d.tile)) return feed(d.tile, d.dx, d.dy);
        springBack(d.tile, d.dx, d.dy);
      }
      function cancel(e) {
        if (!drag || e.pointerId !== drag.id) return;
        const d = drag;
        drag = null;
        wrap.classList.remove("near");
        springBack(d.tile, d.dx, d.dy);
      }
      function springBack(tile, dx, dy) {
        tile.classList.remove("lifted");
        tile.style.transform = "";
        lookReset();
        if (!reduceMotion && (dx || dy)) {
          tile.animate([{ transform: `translate(${dx}px, ${dy}px) scale(1.12)` }, { transform: "none" }],
            { duration: 280, easing: "cubic-bezier(.3,1.6,.5,1)" });
        }
        sweep(620, 300, 0.1, "square", 0.05);
      }
      function hint(tile) {
        springBack(tile, 0, 0);
        restartClass(tile, "wiggle");
        restartClass(wrap, "ahh");
        sweep(220, 520, 0.18, "sine", 0.2);
      }
      function restartClass(el, cls) {
        el.classList.remove(cls);
        void el.offsetWidth;
        el.classList.add(cls);
        later(() => el.classList.remove(cls), 600);
      }

      // ---------- Eating ----------
      function feed(tile, dx, dy) {
        if (done || ctx.ended) return;
        done = true;
        tiles.forEach((t) => { t.disabled = true; });
        lookReset();
        const right = tile.fmItem === target;
        const m = mouthCenter(), t = center(tile);
        const tx = dx + m.x - t.x, ty = dy + m.y - t.y;
        tile.classList.add("lifted");
        tile.style.transform = "";
        const gulp = tile.animate(
          [{ transform: `translate(${dx}px, ${dy}px) scale(1.12)` },
           { transform: `translate(${tx}px, ${ty}px) scale(.15) rotate(25deg)` }],
          { duration: reduceMotion ? 1 : 180, easing: "ease-in", fill: "forwards" });
        wrap.classList.add("chomp");
        crunchSound();
        crumbs(m, tile.style.color);

        if (right) {
          ctx.win();
          later(() => { wrap.classList.add("happy"); yumSound(); ctx.say(TEXT.yum); }, 250);
        } else {
          ctx.lose();
          later(() => {
            wrap.classList.add("sick", "shake");
            blehSound();
            gulp.cancel();
            // Spit it out, then show which tile it wanted.
            const away = (Math.random() < 0.5 ? -1 : 1) * (window.innerWidth * 0.6);
            if (!reduceMotion) {
              tile.animate(
                [{ transform: `translate(${tx}px, ${ty}px) scale(.3)` },
                 { transform: `translate(${tx + away * 0.5}px, ${ty - 120}px) scale(1) rotate(${away > 0 ? 200 : -200}deg)`, offset: 0.4 },
                 { transform: `translate(${tx + away}px, ${ty + 400}px) scale(1) rotate(${away > 0 ? 540 : -540}deg)` }],
                { duration: 900, easing: "ease-out", fill: "forwards" });
            } else {
              tile.style.visibility = "hidden";
            }
            const answer = tiles.find((x) => x.fmItem === target);
            answer.classList.add("answer");
            ctx.say(`${TEXT.yuck} ${answer}!`);
          }, 450);
        }
      }

      // Out of time: drop whatever is held and show the tile it wanted.
      ctx.onTimeout(() => {
        done = true;
        if (drag) {
          const d = drag;
          drag = null;
          wrap.classList.remove("near");
          springBack(d.tile, d.dx, d.dy);
        }
        tiles.forEach((t) => { t.disabled = true; });
        lookReset();
        wrap.classList.add("sick");
        tiles.find((x) => x.fmItem === target).classList.add("answer");
        ctx.say(answer);
      });

      function crumbs(at, color) {
        if (reduceMotion) return;
        const box = wrap.getBoundingClientRect();
        for (let i = 0; i < 12; i++) {
          const c = document.createElement("div");
          c.className = "fm-crumb";
          c.style.left = at.x - box.left + "px";
          c.style.top = at.y - box.top + "px";
          c.style.background = i % 2 ? color : "#fff";
          wrap.appendChild(c);
          const ang = Math.PI * (1.1 + Math.random() * 0.8); // mostly upward
          const dist = 50 + Math.random() * 70;
          c.animate(
            [{ transform: "translate(0,0) rotate(0)", opacity: 1 },
             { transform: `translate(${Math.cos(ang) * dist}px, ${Math.sin(ang) * dist + 90}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }],
            { duration: 600 + Math.random() * 300, delay: 120, easing: "cubic-bezier(.2,.6,.5,1)", fill: "both" });
        }
      }

      // ---------- Sound effects (Web Audio; silent when there is no audio context) ----------
      const { noise, sweep } = ctx.sfx;
      const crunchSound = () => [0, 0.1, 0.2, 0.3].forEach((d) => noise(0.07, "bandpass", 2600, 700, 0.6, d));
      const yumSound = () => { sweep(330, 440, 0.18, "sine", 0.25); sweep(440, 660, 0.25, "sine", 0.25, 0.2); };
      const blehSound = () => { sweep(280, 70, 0.5, "sawtooth", 0.18); noise(0.25, "highpass", 1500, 5000, 0.4, 0.15); };

      return function cleanup() {
        done = true;
        drag = null;
      };
    },
  });
})();
