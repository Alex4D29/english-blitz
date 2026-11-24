// DOORBELL DASH — a listening game (Claude's idea, named by the teacher; like Polly's Crackers: the target is only
// heard). A delivery monster with a parcel stands in a street of front doors, each with a sign. The voice says
// the address (only heard; shown in the 🔊 bubble when listening games are off). Tap a door: the monster dashes
// over, DING-DONG, the door opens. The right door: a happy letter monster takes the parcel (THANK YOU!), then a
// new parcel and a new address (`ctx.choiceSteps`). A wrong door: a big silly dog bursts out barking (WOOF!) and
// the monster runs back, ✕. 3 deliveries win; 3 dogs lose.
(function () {
  const TEXT = {
    name: { en: "Doorbell Dash" },
    icon: "🛎️",
    howTo: { en: {
      steps: [
        ["👂", "Listen! The delivery monster says where the parcel goes."],
        ["🚪", "Tap the door with what you heard. DING-DONG!"],
        ["📦", "The right house takes the parcel. Deliver 3 parcels!"],
      ],
      tips: ["The wrong door has a barking dog! Three dogs and it's over.", "Tap the delivery monster to hear it again.", "When the game speeds up, there are more doors."],
    } },
    instruction: { en: "DELIVER\nIT!" },
    monLabel: "Delivery monster. Tap to hear it again.",
    doorLabel: (t) => `Door ${t}`,
    thanks: ["THANK YOU!", "YAY!", "MY PARCEL!"],
    woof: "WOOF! WOOF!",
    listen: "🔊",
    dingdong: "DING-DONG!",
  };
  const GOAL = 3, MISSES = 3, BEAT_MS = 900;
  const WALLS = ["#ff8fa3", "#8fd3ff", "#ffe066", "#a8e6a1", "#d2b3ff"];
  const STARTERS = ["apple", "ball", "cat", "dinosaur", "elephant", "flower"];

  const CSS = `
  .db { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:6px; padding-bottom:6px; }
  .db-pips { flex:none; display:flex; gap:14px; min-height:30px; align-items:center; }
  .db-row { display:flex; gap:5px; }
  .db-pip { width:24px; height:24px; border:3px solid #111; border-radius:50%; background:#fff; display:flex; align-items:center; justify-content:center; font-size:13px; line-height:1; }
  .db-pip.on { background:#ffd400; } .db-pip.on::after { content:"📦"; }
  .db-pip.x.on { background:#a86a35; } .db-pip.x.on::after { content:"🐾"; }
  .db-street { position:relative; flex:1; min-height:0; width:100%; max-width:640px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111;
    background:linear-gradient(180deg, #9fe0ff 0 12%, transparent 12%), linear-gradient(180deg, transparent 0 calc(var(--hy) + var(--hz) * 1.25), #b9b9c4 calc(var(--hy) + var(--hz) * 1.25) calc(var(--hy) + var(--hz) * 1.36), #7a7a86 calc(var(--hy) + var(--hz) * 1.36)), #9fe0ff; }
  /* A house (--hz wide): a wall, a roof, a window, a door with its sign above */
  .db-house { position:absolute; top:var(--hy); width:var(--hz); height:calc(var(--hz) * 1.25); margin-left:calc(var(--hz) / -2); z-index:1; }
  .db-roof { position:absolute; left:-8%; right:-8%; top:-34%; height:36%; background:#c0392b; border:4px solid #111; clip-path:polygon(50% 0, 100% 100%, 0 100%); }
  .db-roof::after { content:""; position:absolute; inset:5px; background:#e05a4a; clip-path:polygon(50% 4%, 96% 100%, 4% 100%); }
  .db-wall { position:absolute; inset:0; background:var(--wc); border:4px solid #111; border-bottom:0; }
  .db-win { position:absolute; left:10%; top:8%; width:26%; height:22%; background:#bfe9ff; border:3px solid #111; border-radius:4px;
    background-image:linear-gradient(90deg, transparent 46%, #111 46% 54%, transparent 54%), linear-gradient(transparent 46%, #111 46% 54%, transparent 54%); }
  .db-sign { position:absolute; left:58%; top:4%; transform:translateX(-50%); min-width:52%; padding:1px 4px; background:#fff; border:3px solid #111; border-radius:8px;
    font-size:calc(var(--hz) * .27); line-height:1.1; text-align:center; white-space:nowrap; color:#111; z-index:2; }
  .db-hole { position:absolute; left:32%; width:46%; bottom:0; height:58%; background:#2a1a10; border:4px solid #111; border-bottom:0; border-radius:40% 40% 0 0 / 22% 22% 0 0; overflow:hidden; }
  .db-door { position:absolute; left:32%; width:46%; bottom:0; height:58%; padding:0; border:4px solid #111; border-bottom:0; border-radius:40% 40% 0 0 / 22% 22% 0 0; cursor:pointer; touch-action:manipulation;
    background:linear-gradient(90deg, rgba(0,0,0,.12) 0 8%, transparent 8%), #8a5a3c; transform-origin:0 50%; transition:transform .35s ease-in; z-index:2; }
  .db-door::after { content:""; position:absolute; right:12%; top:52%; width:12%; aspect-ratio:1; border-radius:50%; background:#ffd400; border:2px solid #111; }   /* knob */
  .db-house.open .db-door { transform:perspective(300px) rotateY(-80deg); }
  .db-house.right .db-sign { box-shadow:0 0 0 4px #fff, 0 0 0 8px #00b86b; }
  .db-house.dim { opacity:.4; }
  .db-who { position:absolute; left:50%; bottom:-4%; transform:translateX(-50%) translateY(100%); transition:transform .3s cubic-bezier(.2,1.6,.4,1); }
  .db-house.out .db-who { transform:translateX(-50%) translateY(0); }
  /* The barking dog (inside the doorway) */
  .db-house.out .db-hole { overflow:visible; z-index:3; }   /* (whoever answers pops out bigger than the doorway) */
  .db-dog { position:relative; width:calc(var(--hz) * .62); height:calc(var(--hz) * .58); }
  .db-dog > * { position:absolute; box-sizing:border-box; }
  .db-dhead { left:8%; right:8%; top:8%; bottom:0; background:#c98a4b; border:3px solid #111; border-radius:46% 46% 40% 40%; }
  .db-dear { top:6%; width:28%; height:62%; background:#6b3f1d; border:3px solid #111; border-radius:40% 40% 60% 60%; z-index:1; }
  .db-dear.l { left:-6%; transform:rotate(18deg); } .db-dear.r { right:-6%; transform:rotate(-18deg); }
  .db-house.out .db-dear { animation:db-flap .12s ease-in-out infinite alternate; }
  .db-deye { top:24%; width:24%; aspect-ratio:1; background:#fff; border:3px solid #111; border-radius:50%; z-index:2; }
  .db-deye.l { left:24%; } .db-deye.r { right:22%; width:20%; }
  .db-deye::after { content:""; position:absolute; left:30%; top:30%; width:44%; aspect-ratio:1; border-radius:50%; background:#111; }
  .db-dnose { left:40%; top:50%; width:20%; height:13%; background:#111; border-radius:50%; z-index:3; }
  .db-dmouth { left:30%; right:30%; top:64%; height:30%; background:#5a0f1e; border:3px solid #111; border-radius:30% 30% 50% 50%; z-index:2; animation:db-bark .15s ease-in-out infinite alternate; transform-origin:50% 0; }
  .db-dmouth::after { content:""; position:absolute; left:30%; right:30%; bottom:-2px; height:40%; background:#ff6f91; border-radius:50% 50% 0 0; }
  /* The delivery monster (--dz): teal, a red cap, googly eyes, a grin, a parcel in its arms */
  .db-mon { position:absolute; left:0; top:0; width:var(--dz); height:var(--dz); z-index:4; cursor:pointer; touch-action:manipulation; }
  .db-mon > * { position:absolute; box-sizing:border-box; }
  .db-mbody { left:10%; right:10%; top:14%; bottom:8%; background:#2ec4b6; border:4px solid #111; border-radius:46% 46% 40% 40%; }
  .db-cap { left:20%; right:20%; top:6%; height:20%; background:#e8173c; border:4px solid #111; border-radius:50% 50% 10% 10% / 90% 90% 10% 10%; z-index:2; }
  .db-cap::after { content:""; position:absolute; right:-40%; bottom:-4px; width:50%; height:30%; background:#e8173c; border:3px solid #111; border-radius:0 99px 99px 0; }
  .db-meye { top:28%; width:22%; aspect-ratio:1; background:#fff; border:3px solid #111; border-radius:50%; overflow:hidden; z-index:2; }
  .db-meye.l { left:24%; } .db-meye.r { right:22%; width:18%; top:31%; }
  .db-meye i { position:absolute; left:28%; top:30%; width:46%; aspect-ratio:1; background:#111; border-radius:50%; animation:db-roll 1.1s ease-in-out infinite alternate; }
  .db-mmouth { left:34%; right:34%; top:52%; height:12%; background:#5a0f1e; border:3px solid #111; border-radius:10% 10% 50% 50% / 14% 14% 86% 86%; z-index:2; }
  .db-mon.scared .db-mmouth { border-radius:50%; left:40%; right:40%; height:16%; }
  .db-mon.scared .db-meye i { width:24%; left:38%; top:38%; }
  .db-leg { bottom:0; width:16%; height:14%; background:#2ec4b6; border:3px solid #111; border-radius:40%; } .db-leg.l { left:26%; } .db-leg.r { right:26%; }
  .db-mon.run .db-leg.l { animation:db-run .12s ease-in-out infinite alternate; } .db-mon.run .db-leg.r { animation:db-run .12s ease-in-out infinite alternate-reverse; }
  .db-box { left:22%; right:22%; top:58%; height:32%; z-index:3; display:flex; align-items:center; justify-content:center; font-size:calc(var(--dz) * .36); line-height:1; }
  .db-mon.empty .db-box { visibility:hidden; }
  .db-say { position:absolute; left:84%; top:-6%; padding:2px 8px; background:#fff; border:4px solid #111; border-radius:12px; font-size:calc(var(--dz) * .22); line-height:1.1;
    white-space:nowrap; z-index:5; animation:db-pop .25s cubic-bezier(.2,1.8,.4,1) both; }
  .db-fx { position:absolute; inset:0; pointer-events:none; z-index:8; overflow:visible; }
  .db-word { position:absolute; transform:translate(-50%, -50%) rotate(-8deg); font-size:1.9rem; color:#ffd400; -webkit-text-stroke:2px #111; paint-order:stroke fill;
    text-shadow:0 4px 0 #111; white-space:nowrap; animation:db-word 1s ease-out forwards; }
  .db-word.bad { color:#ff8a1f; }
  @keyframes db-roll { from { transform:translate(-25%, -15%); } to { transform:translate(25%, 15%); } }
  @keyframes db-run { from { transform:rotate(-30deg); } to { transform:rotate(30deg); } }
  @keyframes db-bark { to { transform:scaleY(.5); } }
  @keyframes db-flap { to { rotate:14deg; } }
  @keyframes db-pop { from { transform:scale(.3); } }
  @keyframes db-word { from { opacity:1; scale:.5; } 25% { scale:1.15; } 75% { opacity:1; } to { opacity:0; translate:0 -40px; } }
  @media (prefers-reduced-motion: reduce) { .db-meye i, .db-dmouth, .db-dear, .db-leg, .db-word { animation:none !important; } }
  `;
  function injectCss() { if (document.getElementById("db-css")) return; const s = document.createElement("style"); s.id = "db-css"; s.textContent = CSS; document.head.appendChild(s); }

  registerMicrogame({
    id: "doorbell-dash",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 14000,   // 3 deliveries (the beats between them don't count)
    input: "tap",
    tutorial: true,
    listening: true,   // the address is only ever heard (left out when listening games are off)

    start(ctx) {
      injectCss();
      const speed = ctx.speed || 1;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const { tone, sweep, noise } = ctx.sfx;
      const N = speed >= 2 ? 4 : 3;
      const S = ctx.choiceSteps(GOAL, N, { lowercase: true });
      let si = 0, st = S[0];
      const M = window.Mascot;
      const pool = (() => {
        if (!M) return [];
        const ids = M.CHARS.filter((c) => c.letter && M.isUnlocked(c.id)).map((c) => c.id);
        return ids.length ? ids : STARTERS;
      })();

      const wrap = document.createElement("div");
      wrap.className = "db";
      wrap.innerHTML = `<div class="db-pips"><div class="db-row hits">${'<span class="db-pip"></span>'.repeat(GOAL)}</div><div class="db-row">${'<span class="db-pip x"></span>'.repeat(MISSES)}</div></div>`;
      const street = document.createElement("div");
      street.className = "db-street";
      const mon = document.createElement("div");
      mon.className = "db-mon";
      mon.setAttribute("role", "button");
      mon.setAttribute("aria-label", TEXT.monLabel);
      mon.innerHTML = '<div class="db-leg l"></div><div class="db-leg r"></div><div class="db-mbody"></div><div class="db-cap"></div><div class="db-meye l"><i></i></div>' +
        '<div class="db-meye r"><i></i></div><div class="db-mmouth"></div><div class="db-box">📦</div>';
      mon.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });
      const fx = document.createElement("div");
      fx.className = "db-fx";
      street.append(mon, fx);
      wrap.appendChild(street);
      ctx.root.appendChild(wrap);
      const hitPips = wrap.querySelector(".hits").children, missPips = wrap.querySelector(".db-pips").children[1].children;

      const houses = [...Array(N)].map((_, i) => {
        const h = document.createElement("div");
        h.className = "db-house";
        h.style.setProperty("--wc", WALLS[i % WALLS.length]);
        h.innerHTML = '<div class="db-roof"></div><div class="db-wall"></div><div class="db-win"></div><div class="db-hole"><div class="db-who"></div></div><button class="db-door"></button><span class="db-sign"></span>';
        street.insertBefore(h, mon);
        const o = { h, door: h.querySelector(".db-door"), sign: h.querySelector(".db-sign"), who: h.querySelector(".db-who"), opt: null, x: 0 };
        o.door.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); pick(o); });
        h.addEventListener("pointerdown", (e) => { e.preventDefault(); pick(o); });
        return o;
      });

      let W = 0, H = 0, hz = 100, dz = 90, home = { x: 0, y: 0 }, at = null;
      function layout() {
        W = street.clientWidth; H = street.clientHeight;
        hz = Math.max(70, Math.min((W - 20) / N - 16, H * 0.4, 150));
        dz = Math.max(70, Math.min(H * 0.3, W * 0.24, 130));
        street.style.setProperty("--hz", `${hz}px`); street.style.setProperty("--dz", `${dz}px`);
        const hy = Math.max(hz * 0.4, H * 0.1);
        street.style.setProperty("--hy", `${hy}px`);
        houses.forEach((o, i) => {
          o.x = W * (i + 0.5) / N;
          o.h.style.left = `${o.x}px`;
          if (o.opt) o.sign.style.fontSize = o.opt.kind === "word" ? `${Math.min(hz * 0.24, (hz * 0.9) / ([...o.opt.text].length * 0.62))}px` : "";
        });
        home = { x: W / 2 - dz / 2, y: H - dz - 8 };
        if (!at) placeMon(home);
      }
      function placeMon(p) { mon.style.transform = `translate(${p.x}px, ${p.y}px)`; }
      function doorSpot(o) { return { x: o.x - dz / 2, y: Math.min(H - dz - 8, parseFloat(getComputedStyle(street).getPropertyValue("--hy")) + hz * 1.3 - dz * 0.7) }; }

      // A new parcel: the signs change, and the monster says the address.
      function deal() {
        st = S[si];
        const row = ctx.shuffle(st.row.slice());
        houses.forEach((o, i) => {
          o.opt = row[i];
          o.sign.textContent = o.opt.text;
          o.door.setAttribute("aria-label", TEXT.doorLabel(o.opt.spoken || o.opt.text));
          o.h.classList.remove("open", "out", "right", "dim");
          o.who.innerHTML = "";
        });
        mon.classList.remove("empty", "scared");
        if (W) layout();
        speak();
      }
      function speak() {
        mon.querySelector(".db-say")?.remove();
        const b = document.createElement("div");
        b.className = "db-say";
        b.textContent = ctx.canSpeak ? TEXT.listen : st.cardText;
        mon.appendChild(b);
        ctx.say(st.prompt);
      }

      let hits = 0, missN = 0, done = false, busy = false;
      function pick(o) {
        if (done || busy || ctx.ended || !o.opt) return;
        busy = true;
        // Dash to the door, ring the bell, the door opens.
        mon.classList.add("run");
        at = o;
        const to = doorSpot(o), from = home;
        mon.animate([{ transform: `translate(${from.x}px, ${from.y}px)` }, { transform: `translate(${to.x}px, ${to.y}px)` }], { duration: reduceMotion ? 1 : 380, easing: "ease-out", fill: "forwards" });
        ctx.later(() => {
          mon.classList.remove("run");
          tone(988, 0.25, "sine", 0.12); tone(784, 0.35, "sine", 0.12, 0.25);   // ding-dong
          o.h.classList.add("open");
        }, reduceMotion ? 10 : 400);
        ctx.later(() => { if (o.opt.right) deliver(o); else dog(o); }, reduceMotion ? 30 : 900);
      }
      function back() {
        const p = at ? doorSpot(at) : home;
        mon.classList.add("run");
        mon.animate([{ transform: `translate(${p.x}px, ${p.y}px)` }, { transform: `translate(${home.x}px, ${home.y}px)` }], { duration: reduceMotion ? 1 : 420, easing: "ease-in-out", fill: "forwards" });
        ctx.later(() => { mon.classList.remove("run"); at = null; }, 430);
      }
      // The right door: a happy letter monster pops out and takes the parcel.
      function deliver(o) {
        const who = M ? M.el(hz * 0.6, pool[Math.floor(Math.random() * pool.length)]) : document.createElement("div");
        if (M) M.mood(who, "cheer");
        o.who.appendChild(who);
        o.h.classList.add("out");
        mon.classList.add("empty");
        [523, 659, 784].forEach((f, k) => tone(f, 0.1, "triangle", 0.1, k * 0.08));
        word(TEXT.thanks[hits % TEXT.thanks.length], false, o.x, parseFloat(getComputedStyle(street).getPropertyValue("--hy")) - 10);
        if (o.opt.kind === "pic") ctx.say(o.opt.spoken); else ctx.say(st.answer);
        hitPips[hits].classList.add("on");
        hits++;
        if (hits >= GOAL) {
          done = true; ctx.win();
          ctx.later(() => { back(); ctx.confetti(fx, W / 2, H * 0.4, { count: 90 }); [523, 659, 784, 1047].forEach((f, k) => tone(f, 0.12, "triangle", 0.1, k * 0.08)); }, 500);
          return;
        }
        ctx.later(() => {
          if (done) return;
          back();
          ctx.pauseTimer(BEAT_MS);
          si++;
          ctx.later(() => { deal(); busy = false; }, 450);
        }, 800);
      }
      // A wrong door: a dog bursts out barking, and the monster runs back scared.
      function dog(o) {
        o.who.innerHTML = '<div class="db-dog"><div class="db-dear l"></div><div class="db-dear r"></div><div class="db-dhead"></div><div class="db-deye l"></div><div class="db-deye r"></div><div class="db-dnose"></div><div class="db-dmouth"></div></div>';
        o.h.classList.add("out");
        mon.classList.add("scared");
        [0, 0.22].forEach((t) => { sweep(500, 260, 0.12, "sawtooth", 0.12, t); noise(0.1, "bandpass", 700, 400, 0.3, t); });   // WOOF WOOF
        word(TEXT.woof, true, o.x, parseFloat(getComputedStyle(street).getPropertyValue("--hy")) - 10);
        missPips[missN].classList.add("on");
        missN++;
        ctx.later(back, 300);
        if (missN >= MISSES) { done = true; ctx.lose(); ctx.later(showAnswer, 700); return; }
        ctx.later(() => { o.h.classList.remove("open", "out"); o.who.innerHTML = ""; mon.classList.remove("scared"); busy = false; speak(); }, 1100);
      }
      function showAnswer() { houses.forEach((o) => o.h.classList.add(o.opt.right ? "right" : "dim")); ctx.say(st.answer); }
      function word(text, bad, x, y) {
        const w = document.createElement("div");
        w.className = "db-word" + (bad ? " bad" : "");
        w.textContent = text;
        w.style.left = `${Math.max(120, Math.min(W - 120, x))}px`; w.style.top = `${Math.max(34, y)}px`;
        fx.appendChild(w);
        ctx.later(() => w.remove(), 1000);
      }
      function replay() { if (!done && !busy) speak(); }

      ctx.onTimeout(() => { done = true; mon.classList.add("scared"); showAnswer(); });
      function onKey(e) {
        const i = parseInt(e.key, 10) - 1;
        if (i >= 0 && i < houses.length) { e.preventDefault(); pick(houses[i]); }
        else if (e.key === " ") { e.preventDefault(); replay(); }
      }
      document.addEventListener("keydown", onKey);

      layout();
      const ro = new ResizeObserver(layout);
      ro.observe(street);
      deal();

      // Tutorial: point at the monster (listen!), then tap the right door, three times.
      ctx.tutorial(S.map((s) => s.target), async (f) => {
        for (let n = 0; n < GOAL && !done; n++) {
          await f.until(() => !busy && si === n, 4000);
          await f.point(mon, n ? 500 : 900);
          await f.tap(() => (houses.find((o) => o.opt && o.opt.right) || houses[0]).door);
          await f.until(() => hits > n || done, 3000);
        }
      });
      return () => { done = true; ro.disconnect(); document.removeEventListener("keydown", onKey); };
    },
  });
})();
