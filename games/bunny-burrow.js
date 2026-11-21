// BUNNY BURROW — a bunny runs through underground tunnels to a carrot. At each junction there's a row
// of round burrow doors, each with a sign. Tap the right door: the bunny hops to it, the door swings
// open and the bunny dives in (whoosh) to the next junction. A wrong door has a grumpy mole behind it
// ("HEY!"): the bunny leaps back scared, the round is lost and the right door glows. Through the last
// door: a sunny carrot patch, and the bunny munches a big carrot. Carrot pips at the top show the
// progress. Content comes from ctx.choiceRows (ABC: half the rounds are capital → lowercase).
// 3 junctions, 4 from 1.5×; 4 doors from 2×.
(function () {
  const TEXT = {
    name: { en: "Bunny Burrow" },
    icon: "🐰",
    howTo: (list) => ({ en: {
      steps: [
        list.type === "hfw" ? ["👂", "Listen to the word, like \"the\"."] : ["👀", "Look at the card at the top."],
        ["🚪", "Tap the door with the same one. The bunny runs through!"],
        ["🥕", "Door by door, find the way to the carrot!"],
      ],
      tips: [
        "Tap the card to hear it again.",
        "A grumpy mole lives behind the wrong door! The right one glows.",
        "When the game speeds up, there are more doors to go through.",
      ],
    } }),
    instruction: { en: "FIND THE\nCARROT!" },
    hey: "HEY!",
    cardLabel: "Hear it again",
    doorLabel: (t) => `Open the door ${t}`,
  };

  const CSS = `
  .bn { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:8px; padding-bottom:8px; }
  .bn-top { flex:none; display:flex; align-items:center; gap:12px; }
  .bn-card { min-width:84px; height:72px; padding:0 18px; border-radius:18px; font:inherit; font-size:2.6rem; line-height:1; background:#fff; color:#111;
    border:5px solid #111; box-shadow:0 6px 0 #111; display:flex; align-items:center; justify-content:center; gap:8px; cursor:pointer; touch-action:manipulation; }
  .bn-card .spk { font-size:1.3rem; opacity:.6; }
  .bn-pips { display:flex; gap:2px; font-size:1.5rem; }
  .bn-pip { filter:grayscale(1) opacity(.35); } .bn-pip.on { filter:none; }
  .bn-dirt { position:relative; flex:1; min-height:0; width:100%; max-width:520px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111;
    background:#7a4d29; background-image:radial-gradient(circle at 20% 30%, #8b5a2b 0 6px, transparent 7px), radial-gradient(circle at 70% 60%, #6b4222 0 5px, transparent 6px),
      radial-gradient(circle at 40% 80%, #8b5a2b 0 4px, transparent 5px); background-size:90px 80px; }
  .bn-dirt::before { content:""; position:absolute; left:0; right:0; top:58%; height:22%; background:#4a2d17; border-top:4px solid #111; border-bottom:4px solid #111; opacity:.6; }
  .bn-dirt.whoosh { animation:bn-whoosh .45s ease-in-out; }
  .bn-dirt.sunny { background:linear-gradient(180deg, #8fd3ff, #b8f0a0 60%, #6cc04a 60%); }
  .bn-dirt.sunny::before { display:none; }
  .bn-door { position:absolute; width:var(--dz); height:calc(var(--dz) * 1.1); transform:translate(-50%, -100%); padding:0; border:0; background:none; font:inherit;
    cursor:pointer; touch-action:manipulation; }
  .bn-hole { position:absolute; inset:0; background:#1a0f08; border:5px solid #111; border-radius:50% 50% 8px 8px; }
  .bn-leaf { position:absolute; inset:0; background:#c98a4b; border:5px solid #111; border-radius:50% 50% 8px 8px; transform-origin:0 50%; transition:transform .35s ease-in;
    background-image:repeating-linear-gradient(90deg, transparent 0 20px, rgba(0,0,0,.18) 20px 24px); display:flex; align-items:center; justify-content:center; }
  .bn-leaf::after { content:""; position:absolute; right:12%; top:78%; width:10px; height:10px; background:#ffd60a; border:2px solid #111; border-radius:50%; }
  .bn-sign { position:relative; min-width:70%; height:44%; padding:0 4px; background:#fff; border:4px solid #111; border-radius:10px; color:#111; display:flex;
    align-items:center; justify-content:center; font-size:calc(var(--dz) * .36); line-height:1; white-space:nowrap; }
  .bn-door.open .bn-leaf { transform:perspective(300px) rotateY(-75deg); }
  .bn-door.live .bn-leaf { box-shadow:0 0 0 4px rgba(255,255,255,.6); }
  .bn-door.right .bn-leaf { box-shadow:0 0 0 6px #fff, 0 0 0 11px #00b86b; animation:bn-wiggle .4s ease-in-out 3; }
  .bn-door.dim { opacity:.5; }
  .bn-mole { position:absolute; left:50%; bottom:6%; width:70%; height:70%; transform:translate(-50%, 30%) scale(.4); opacity:0; transition:transform .25s cubic-bezier(.2,1.8,.4,1), opacity .1s; }
  .bn-door.mole .bn-mole { transform:translate(-50%, 0) scale(1); opacity:1; }
  .bn-mbody { position:absolute; inset:10% 6% 0; background:#4a4a55; border:4px solid #111; border-radius:50% 50% 40% 40%; }
  .bn-mbrow { position:absolute; top:26%; width:24%; height:7%; background:#111; border-radius:99px; }
  .bn-mbrow.l { left:20%; transform:rotate(22deg); } .bn-mbrow.r { right:20%; transform:rotate(-22deg); }
  .bn-mnose { position:absolute; left:50%; top:46%; width:22%; height:18%; margin-left:-11%; background:#ff7aa2; border:3px solid #111; border-radius:50%; }
  .bn-hey { position:absolute; left:50%; bottom:100%; transform:translate(-50%, -6px) rotate(-6deg); padding:2px 10px; background:#fff; border:4px solid #111; border-radius:99px;
    font-size:1.3rem; white-space:nowrap; color:#e8173c; box-shadow:0 3px 0 #111; }

  .bn-bunny { position:absolute; left:0; top:0; width:var(--bz); height:calc(var(--bz) * 1.2); margin:calc(var(--bz) * -1.2) 0 0 calc(var(--bz) * -.5); z-index:4;
    pointer-events:none; will-change:transform; }
  .bn-ear { position:absolute; top:0; width:22%; height:48%; background:#fff; border:4px solid #111; border-radius:50%; }
  .bn-ear::after { content:""; position:absolute; inset:18% 26%; background:#ffb3c7; border-radius:50%; }
  .bn-ear.l { left:24%; transform:rotate(-10deg); } .bn-ear.r { right:24%; transform:rotate(10deg); }
  .bn-bbody { position:absolute; left:10%; right:10%; top:36%; bottom:0; background:#fff; border:4px solid #111; border-radius:50% 50% 44% 44%; }
  .bn-beye { position:absolute; top:52%; width:12%; height:12%; background:#111; border-radius:50%; }
  .bn-beye.l { left:32%; } .bn-beye.r { right:32%; }
  .bn-bnose { position:absolute; left:50%; top:64%; width:12%; height:8%; margin-left:-6%; background:#ff7aa2; border:2px solid #111; border-radius:50%; }
  .bn-bunny.scared .bn-ear { transform:rotate(0) scaleY(1.15); }
  .bn-bunny.scared .bn-beye { height:16%; width:16%; background:#fff; border:3px solid #111; }
  .bn-bunny.happy { animation:bn-hop .35s cubic-bezier(.2,1.6,.4,1) 4; }
  .bn-carrot { position:absolute; left:50%; top:30%; font-size:var(--cz); line-height:1; transform:translate(-50%, -50%) rotate(30deg); }
  .bn-carrot.eat { animation:bn-eat .9s steps(3) forwards; }
  .bn-fx { position:absolute; inset:0; pointer-events:none; overflow:visible; z-index:6; }

  @keyframes bn-whoosh { 50% { filter:brightness(0); transform:scale(1.08); } }
  @keyframes bn-wiggle { 25% { rotate:-6deg; } 75% { rotate:6deg; } }
  @keyframes bn-hop { 50% { translate:0 -14%; } }
  @keyframes bn-eat { to { clip-path:inset(0 0 0 100%); } }
  @media (prefers-reduced-motion: reduce) { .bn-dirt.whoosh, .bn-door.right .bn-leaf, .bn-bunny.happy { animation:none !important; } }`;

  function injectCss() {
    if (document.getElementById("bn-css")) return;
    const style = document.createElement("style");
    style.id = "bn-css";
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  registerMicrogame({
    id: "bunny-burrow",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 10000,
    input: "tap",
    tutorial: true, // has a ctx.tutorial script

    start(ctx) {
      injectCss();
      const speed = ctx.speed || 1;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const R = speed >= 1.5 ? 4 : 3, N = speed >= 2 ? 4 : 3;
      const { tone, sweep, noise } = ctx.sfx;
      const C = ctx.choiceRows(R, N, { lowercase: true });

      const wrap = document.createElement("div");
      wrap.className = "bn";
      const top = document.createElement("div");
      top.className = "bn-top";
      const card = document.createElement("button");
      card.className = "bn-card";
      card.setAttribute("aria-label", TEXT.cardLabel);
      card.innerHTML = '<span class="ct"></span>';
      card.firstChild.textContent = C.cardText;
      if (ctx.canSpeak && !C.listen) card.insertAdjacentHTML("beforeend", '<span class="spk">🔊</span>');
      card.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });
      const pips = document.createElement("div");
      pips.className = "bn-pips";
      pips.innerHTML = '<span class="bn-pip">🥕</span>'.repeat(R);
      top.append(card, pips);
      const dirt = document.createElement("div");
      dirt.className = "bn-dirt";
      dirt.innerHTML = '<div class="bn-fx"></div>';
      const fx = dirt.firstChild;
      const bunny = document.createElement("div");
      bunny.className = "bn-bunny";
      bunny.innerHTML = '<div class="bn-ear l"></div><div class="bn-ear r"></div><div class="bn-bbody"></div><div class="bn-beye l"></div><div class="bn-beye r"></div><div class="bn-bnose"></div>';
      dirt.appendChild(bunny);
      wrap.append(top, dirt);
      ctx.root.appendChild(wrap);

      let W = 0, H = 0, dz = 80, doorY = 0, homeY = 0;
      function measure() {
        W = dirt.clientWidth; H = dirt.clientHeight;
        dz = Math.max(56, Math.min((W - 20) / N - 14, H * 0.32, 120));
        dirt.style.setProperty("--dz", `${dz}px`);
        dirt.style.setProperty("--bz", `${Math.max(44, dz * 0.62)}px`);
        dirt.style.setProperty("--cz", `${Math.min(W * 0.4, H * 0.4, 170)}px`);
        doorY = H * 0.58; homeY = H - 12;
      }
      measure();
      let pos = { x: 0, y: 0 };
      function setBunny(x, y, ms) {
        pos = { x, y };
        bunny.style.transition = ms ? `transform ${ms}ms cubic-bezier(.3,.7,.4,1)` : "";
        bunny.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      }

      let step = 0, done = false, busy = false, doors = [];
      function buildDoors(r) {
        doors.forEach((d) => d.el.remove());
        doors = C.rows[r].map((item, i) => {
          const b = document.createElement("button");
          b.className = "bn-door live";
          b.style.left = `${(W / N) * (i + 0.5)}px`;
          b.style.top = `${doorY}px`;
          b.setAttribute("aria-label", TEXT.doorLabel(item.spoken));
          b.innerHTML = '<div class="bn-hole"></div><div class="bn-mole"><div class="bn-mbody"></div><div class="bn-mbrow l"></div><div class="bn-mbrow r"></div><div class="bn-mnose"></div></div>' +
            '<div class="bn-leaf"><div class="bn-sign"></div></div>';
          const s = b.querySelector(".bn-sign");
          s.textContent = item.text;
          if (item.kind === "word") s.style.fontSize = `${Math.min(dz * 0.3, (dz * 0.66) / (item.text.length * 0.6))}px`;
          b.addEventListener("pointerdown", (e) => { e.preventDefault(); choose(i); });
          b.addEventListener("click", (e) => { if (e.detail === 0) choose(i); });
          dirt.insertBefore(b, bunny);
          return { el: b, item, x: (W / N) * (i + 0.5) };
        });
      }

      function choose(i) {
        if (done || busy || ctx.ended) return;
        busy = true;
        const d = doors[i];
        doors.forEach((x) => x.el.classList.remove("live"));
        sweep(400, 700, 0.12, "square", 0.06); // hop
        setBunny(d.x, doorY + dz * 0.15, reduceMotion ? 0 : 300);
        ctx.later(() => {
          d.el.classList.add("open");
          noise(0.15, "bandpass", 500, 900, 0.3); // creak
          if (d.item.right) ctx.later(() => through(d), 280);
          else ctx.later(() => mole(d), 200);
        }, reduceMotion ? 10 : 320);
      }

      function through(d) {
        if (d.item.kind === "pic") ctx.say(d.item.spoken);
        pips.children[step].classList.add("on");
        sweep(900, 200, 0.35, "sine", 0.1); // whoosh down the hole
        bunny.style.opacity = "0";
        step++;
        dirt.classList.remove("whoosh"); void dirt.offsetWidth; dirt.classList.add("whoosh");
        ctx.later(() => {
          bunny.style.opacity = "";
          setBunny(W / 2, homeY, 0);
          if (step >= R) { win(); return; }
          buildDoors(step);
          busy = false;
        }, reduceMotion ? 10 : 230);
      }

      function win() {
        done = true;
        ctx.win();
        doors.forEach((x) => x.el.remove());
        dirt.classList.add("sunny");
        const c = document.createElement("div");
        c.className = "bn-carrot";
        c.textContent = "🥕";
        dirt.insertBefore(c, bunny);
        setBunny(W / 2, H * 0.62, reduceMotion ? 0 : 300);
        bunny.classList.add("happy");
        ctx.later(() => c.classList.add("eat"), 350);
        [0.35, 0.65, 0.95].forEach((t) => noise(0.08, "bandpass", 1000, 1500, 0.3, t)); // crunch crunch crunch
        ctx.later(() => ctx.confetti(fx, W / 2, H * 0.3), 300);
        ctx.say(C.answer);
      }

      function mole(d) {
        done = true;
        ctx.lose();
        d.el.classList.add("mole");
        const h = document.createElement("div");
        h.className = "bn-hey";
        h.textContent = TEXT.hey;
        d.el.querySelector(".bn-mole").appendChild(h);
        sweep(300, 180, 0.25, "sawtooth", 0.12); // grumpy
        bunny.classList.add("scared");
        sweep(900, 1600, 0.15, "sine", 0.08, 0.1); // eek
        setBunny(d.x, homeY, reduceMotion ? 0 : 300);
        ctx.later(() => { showRight(); ctx.say(C.answer); }, 500);
      }
      function showRight() { doors.forEach((x) => { if (!x.el.classList.contains("mole")) x.el.classList.add(x.item.right ? "right" : "dim"); x.el.classList.remove("live"); }); }
      function replay() { if (!done) ctx.say(C.prompt); }

      ctx.onTimeout(() => { done = true; bunny.classList.add("scared"); showRight(); ctx.say(C.answer); });
      function onKey(e) {
        const i = parseInt(e.key, 10) - 1;
        if (i >= 0 && i < N) { e.preventDefault(); choose(i); }
        else if (e.key === " ") { e.preventDefault(); replay(); }
      }
      document.addEventListener("keydown", onKey);

      buildDoors(0);
      setBunny(W / 2, homeY, 0);
      ctx.say(C.prompt);
      // Show the target big in the middle for a moment before play starts (ctx.reveal).
      ctx.reveal(card);

      // Tutorial: point at the card, then at each step tap the right one once the game is ready for it.
      ctx.tutorial(C.target, async (f) => {
        await f.point(card);
        for (let r = 0; r < R; r++) {
          await f.until(() => !busy && step === r && doors.length && C.rows[r].includes(doors[0].item) && doors[0].el.isConnected, 5000);
          await f.tap(() => doors.find((o) => o.item.right).el);
        }
      });
      return () => { done = true; document.removeEventListener("keydown", onKey); };
    },
  });
})();
