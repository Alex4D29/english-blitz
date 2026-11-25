// TEST YOUR STRENGTH — a power-bar game (js/power.js), fairground hammer style. The card at the top
// shows the target (letter; phonics letter; CVC word; HFW 🔊) and the voice says it. A macho purple
// monster (bare muscles: pecs and a silly six-pack, big arms, googly eyes) holds a giant mallet beside a tall striker tower. The tower
// has three bands with options: bottom (green), middle (yellow) and top (red), like the power bar, and a
// bell on top. Charge the power bar (press and hold, or tap, tap): the monster raises the mallet, then
// slams it down, and the puck shoots up to the band for that power. One hit decides. Right: DING! (the
// band lights up, the bell rings when it's the top), the monster flexes, confetti. Wrong: the puck flops
// at the wrong band, the monster is embarrassed (💦), and the right band glows.
(function () {
  const TEXT = {
    name: { en: "Test Your Strength" },
    icon: "💪", // (Whack-a-Mole is 🔨)
    howTo: (list) => ({ en: {
      steps: [
        list.type === "hfw" ? ["👂", "Listen to the word, like \"the\"."] : ["👀", "Look at the card at the top."],
        ["🔔", "Find it on the tower. Green is low, yellow is in the middle, red is at the top."],
        ["💪", "Hold to fill the power bar, then let go to SMASH! (Or tap, then tap again.)"],
      ],
      tips: [
        "Green power sends the puck to the green part, yellow to yellow, red all the way up to red.",
        "Tap the card to hear it again.",
      ],
    } }),
    instruction: { en: "TEST YOUR\nSTRENGTH!" },
    cardLabel: "Hear it again",
    ding: "DING!",
    flop: "OOPS!",
    gorillaDing: "OOH OOH!",   // Gorilla Boss rings the bell first…
    yourTurn: "YOUR TURN!",    // …then it's you
  };

  // (band colours are the power bar's: PowerBar.colors, bottom to top)
  const CSS = `
  .ts { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:8px; padding-bottom:8px; }
  .ts-card { flex:none; min-width:84px; height:72px; padding:0 18px; border-radius:18px; font:inherit; font-size:2.6rem; line-height:1; background:#fff; color:#111;
    border:5px solid #111; box-shadow:0 6px 0 #111; display:flex; align-items:center; justify-content:center; gap:8px; cursor:pointer; touch-action:manipulation; }
  .ts-card .spk { font-size:1.3rem; opacity:.6; }
  .ts-fair { position:relative; flex:1; min-height:0; width:100%; max-width:560px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111;
    background:repeating-linear-gradient(90deg, #ff6f91 0 40px, #fff 40px 80px); touch-action:none; cursor:pointer; }
  .ts-fair::after { content:""; position:absolute; left:0; right:0; bottom:0; height:14%; background:#c98a4b; border-top:5px solid #111; }
  .ts-fx { position:absolute; inset:0; pointer-events:none; overflow:visible; z-index:8; }
  /* The tower: a tall post with three bands, a bell on top, a pad at the bottom */
  .ts-tower { position:absolute; width:var(--tw); transform:translateX(-50%); z-index:2; pointer-events:none; }
  .ts-post { position:absolute; left:12%; right:12%; top:var(--bell); bottom:0; background:#fff; border:5px solid #111; border-radius:10px; display:flex; flex-direction:column-reverse; overflow:hidden; }
  .ts-band { flex:1; position:relative; border-top:4px solid #111; display:flex; align-items:center; justify-content:center; }
  .ts-band:first-child { border-top:0; }
  .ts-sign { padding:2px 4px; min-width:80%; max-width:96%; box-sizing:border-box; background:#fff; border:4px solid #111; border-radius:10px; font-size:calc(var(--tw) * .36); line-height:1.05; color:#111; white-space:nowrap; text-align:center; }
  .ts-band.lit { filter:brightness(1.25); box-shadow:inset 0 0 0 6px #fff; }
  .ts-band.right .ts-sign { box-shadow:0 0 0 5px #fff, 0 0 0 10px #00b86b; }
  .ts-band.dim { opacity:.5; }
  .ts-bell { position:absolute; left:50%; top:0; width:calc(var(--tw) * .6); height:var(--bell); transform:translateX(-50%); background:#ffd400; border:5px solid #111;
    border-radius:50% 50% 10% 10% / 70% 70% 10% 10%; }
  .ts-bell.ring { animation:ts-ring .12s linear 6; }
  .ts-pad { position:absolute; left:-10%; right:-10%; bottom:-8px; height:14px; background:#e8173c; border:4px solid #111; border-radius:6px; }
  /* The puck rides a rail up the left side of the post, so it never covers an answer (it used to slide up the middle and sat on the bottom one) */
  .ts-rail { position:absolute; left:2%; width:6%; top:var(--bell); bottom:0; background:#bbb; border:3px solid #111; border-radius:4px; }
  .ts-puck { position:absolute; left:-4%; width:18%; height:calc(var(--tw) * .16); background:#444; border:4px solid #111;
    border-radius:8px; z-index:3; }
  /* The macho monster: purple, a tank top, big arms, a giant mallet. Anchor: feet. --mz is its height */
  .ts-mon { position:absolute; left:0; top:0; width:calc(var(--mz) * .9); height:var(--mz); margin:calc(var(--mz) * -1) 0 0 calc(var(--mz) * -.45); z-index:5; pointer-events:none; }
  .ts-body { position:absolute; left:14%; right:14%; top:14%; bottom:0; background:#9c6bff; border:5px solid #111; border-radius:44% 44% 30% 30%; }
  /* Bare muscles (the teacher found the tank top a bit weird): two big pecs, a silly bumpy six-pack, a belly button */
  .ts-top { position:absolute; left:24%; right:24%; top:49%; bottom:9%; display:grid; grid-template-columns:1fr 1fr; grid-template-rows:1.3fr 1fr 1fr 1fr; gap:4% 6%; }
  .ts-top i { background:#b894ff; border:3px solid #111; border-radius:40%; box-shadow:inset -3px -3px 0 rgba(0,0,0,.12); }
  .ts-top i.pec { border-radius:30% 30% 50% 50%; }
  .ts-top::after { content:""; position:absolute; left:50%; bottom:-9%; width:9%; aspect-ratio:1; transform:translateX(-50%); background:#5a3a9e; border-radius:50%; }   /* belly button */
  .ts-mon.flex .ts-top i { animation:ts-ripple .15s ease-in-out infinite alternate; }
  .ts-mon.flex .ts-top i:nth-child(odd) { animation-delay:-.07s; }
  @keyframes ts-ripple { to { transform:scale(1.12); } }
  /* The fist that grips the mallet (drawn over the handle) */
  .ts-fist { position:absolute; left:73%; top:45%; width:15%; aspect-ratio:1; background:#7d4fe0; border:4px solid #111; border-radius:45%; z-index:5;
    background-image:repeating-linear-gradient(90deg, transparent 0 22%, rgba(0,0,0,.45) 22% 28%); }   /* darker, with knuckles, so it reads as a hand */
  .ts-arm { position:absolute; top:36%; width:30%; height:26%; background:#9c6bff; border:5px solid #111; border-radius:50%; z-index:1; }
  .ts-arm.l { left:-6%; } .ts-arm.r { right:-6%; }
  .ts-eye { position:absolute; top:22%; width:22%; aspect-ratio:1; background:#fff; border:3px solid #111; border-radius:50%; z-index:2; }
  .ts-eye.l { left:28%; } .ts-eye.r { right:28%; width:18%; top:24%; }
  .ts-eye i { position:absolute; left:28%; top:30%; width:46%; aspect-ratio:1; background:#111; border-radius:50%; animation:ts-goggle 1.1s ease-in-out infinite; }
  .ts-brow { position:absolute; top:17%; width:22%; height:4%; background:#111; border-radius:9px; z-index:3; }
  .ts-brow.l { left:28%; transform:rotate(-10deg); } .ts-brow.r { right:28%; transform:rotate(10deg); }
  .ts-mouth { position:absolute; left:36%; right:36%; top:36%; height:8%; z-index:2; background:#6b1020; border:3px solid #111; border-radius:4px 4px 999px 999px; }
  /* The mallet, gripped in the right fist (its pivot, at the bottom: 80% across, 48% up). At rest it's held up proudly (not across the face), it tips back behind the head while charging, and
     the slam swings it over onto the pad at the foot of the tower
     (the monster is placed so the mallet head lands there), so it never sits over the answers. */
  .ts-mallet { position:absolute; left:73.5%; bottom:48%; width:13%; height:80%; z-index:4; transform-origin:50% 100%; transform:rotate(-6deg); transition:transform .2s; }
  .ts-mallet::before { content:""; position:absolute; left:32%; right:32%; top:18%; bottom:0; background:#8b5a2b; border:3px solid #111; border-radius:3px; }
  .ts-mallet::after { content:""; position:absolute; left:-110%; right:-110%; top:0; height:22%; background:#e8173c; border:4px solid #111; border-radius:8px; }
  .ts-mon.raise .ts-mallet { transform:rotate(-60deg); transition:transform .5s; }
  .ts-mon.slam .ts-mallet { transform:rotate(130deg); transition:transform .14s ease-in; }
  .ts-mon.flex { animation:ts-flex .3s ease-in-out infinite alternate; }
  .ts-mon.flex .ts-arm { transform:translateY(-40%) scale(1.25); }
  .ts-mon.oops .ts-mouth { border-radius:999px 999px 4px 4px; height:5%; top:40%; }
  .ts-word { position:absolute; transform:translate(-50%, -50%) rotate(-8deg); z-index:9; pointer-events:none; font-size:2.4rem; color:#ffd400; -webkit-text-stroke:2px #111;
    paint-order:stroke fill; text-shadow:0 4px 0 #111; white-space:nowrap; animation:ts-pop .35s cubic-bezier(.2,1.8,.4,1) both; }
  .ts-word.bad { color:#fff; font-size:1.8rem; }
  /* Gorilla Boss's strength contest: the champ on his podium, pips for your hits and misses, a card that changes */
  .ts-gor { position:absolute; left:0; top:0; z-index:4; pointer-events:none; display:flex; flex-direction:column; align-items:center; }
  .ts-gor.go .bx-boss { animation:ts-gslam .45s ease-out; }
  /* His mallet: pivots in his left fist, held up over his shoulder; the swing brings it down to the left onto the pad */
  .ts-gmallet { position:absolute; left:8%; bottom:42%; width:12px; height:var(--gl); margin-left:-6px; z-index:5; transform-origin:50% 100%; transform:rotate(18deg); transition:transform .15s; }
  .ts-gmallet::before { content:""; position:absolute; left:0; right:0; top:14%; bottom:0; background:#8b5a2b; border:3px solid #111; border-radius:3px; }
  .ts-gmallet::after { content:""; position:absolute; left:-180%; right:-180%; top:0; height:max(18px, calc(var(--gz) * .16)); background:#e8173c; border:4px solid #111; border-radius:8px; }
  .ts-gor.wind .ts-gmallet { transform:rotate(55deg); transition:transform .35s; }
  .ts-gor.go .ts-gmallet { transform:rotate(-112deg); transition:transform .14s ease-in; }
  .ts-pips { position:absolute; left:50%; top:6px; transform:translateX(-50%); z-index:6; display:flex; gap:4px; pointer-events:none; }
  .ts-pip { width:22px; height:22px; border:3px solid #111; border-radius:50%; background:#fff; display:flex; align-items:center; justify-content:center; font-size:12px; line-height:1; }
  .ts-pip.on { background:#ffd400; } .ts-pip.on::after { content:"💪"; }
  .ts-pip.x.on { background:#444; } .ts-pip.x.on::after { content:"✕"; color:#fff; font-weight:900; }
  .ts-gap { width:8px; }
  .ts-drop { position:absolute; font-size:1.4rem; pointer-events:none; animation:ts-drip .9s ease-in forwards; }
  .ts-card.next { animation:ts-next .45s cubic-bezier(.2,1.8,.4,1); }
  @keyframes ts-gslam { 40% { transform:translateY(-14%) scale(1.05); } 70% { transform:translateY(4%) scale(1.08, .9); } }
  @keyframes ts-drip { to { transform:translateY(40px); opacity:0; } }
  @keyframes ts-next { 0% { transform:scale(.4) rotate(-10deg); } 60% { transform:scale(1.25) rotate(4deg); } 100% { transform:none; } }
  @keyframes ts-ring { 50% { rotate:-14deg; } }
  @keyframes ts-goggle { 0%, 100% { transform:translate(-16%, 0); } 50% { transform:translate(16%, -12%); } }
  @keyframes ts-flex { from { rotate:-5deg; } to { rotate:5deg; } }
  @keyframes ts-pop { from { transform:translate(-50%, -50%) rotate(-8deg) scale(.2); } }
  @media (prefers-reduced-motion: reduce) { .ts-eye i, .ts-mon.flex, .ts-bell.ring { animation:none !important; } }`;

  function injectCss() {
    if (document.getElementById("ts-css")) return;
    const style = document.createElement("style");
    style.id = "ts-css";
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  registerMicrogame({
    id: "strength-test",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 10000,
    input: "tap",
    tutorial: true, // has a ctx.tutorial script
    bossArt: true,        // Boss Battle: Gorilla Boss's strength contest (he rings the bell first, then you: 3 hits)
    bossDuration: 20000,

    start(ctx) {
      injectCss();
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const { tone, sweep, noise } = ctx.sfx;
      // Bands = power bands: 3 at normal speed, 4 from 1.75× (Practice MEDIUM), 5 from 2.5× (HARD).
      const NZ = window.PowerBar.zoneCount(ctx.speed), BANDS = window.PowerBar.colors(NZ);
      // Gorilla Boss's strength contest: 3 hits, each with a new target (a rhythm game), against the champ.
      const gorillaMode = !!(window.Boss && window.Boss.fighting(ctx) === "gorilla");
      const GN = 3, S = gorillaMode ? ctx.choiceSteps(GN, NZ, { lowercase: true }) : null;
      let C = S ? S[0] : ctx.choiceRows(1, NZ, { lowercase: true });
      const row = ctx.shuffle((S ? C.row : C.rows[0]).slice());

      const wrap = document.createElement("div");
      wrap.className = "ts";
      const card = document.createElement("button");
      card.className = "ts-card";
      card.setAttribute("aria-label", TEXT.cardLabel);
      card.innerHTML = '<span class="ct"></span>';
      card.firstChild.textContent = C.cardText;
      if (ctx.canSpeak && !C.listen) card.insertAdjacentHTML("beforeend", '<span class="spk">🔊</span>');
      card.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });
      const fair = document.createElement("div");
      fair.className = "ts-fair";
      const fx = document.createElement("div");
      fx.className = "ts-fx";
      fair.appendChild(fx);
      wrap.append(card, fair);
      ctx.root.appendChild(wrap);

      const tower = document.createElement("div");
      tower.className = "ts-tower";
      tower.innerHTML = '<div class="ts-bell"></div><div class="ts-post">' +
        row.map((o, i) => `<div class="ts-band" style="background:${BANDS[i]}"><div class="ts-sign"></div></div>`).join("") +
        '</div><div class="ts-rail"></div><div class="ts-pad"></div><div class="ts-puck"></div>';
      fair.appendChild(tower);
      const bands = [...tower.querySelectorAll(".ts-band")].map((el, i) => ({ el, i, opt: row[i], sign: el.querySelector(".ts-sign") }));
      bands.forEach((b) => { b.sign.textContent = b.opt.text; });
      const puck = tower.querySelector(".ts-puck"), bell = tower.querySelector(".ts-bell");
      const mon = document.createElement("div");
      mon.className = "ts-mon";
      mon.innerHTML = '<div class="ts-body"></div><div class="ts-top"><i class="pec"></i><i class="pec"></i><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="ts-arm l"></div><div class="ts-arm r"></div><div class="ts-brow l"></div><div class="ts-brow r"></div>' +
        '<div class="ts-eye l"><i></i></div><div class="ts-eye r"><i></i></div><div class="ts-mouth"></div><div class="ts-mallet"></div><div class="ts-fist"></div>';
      fair.appendChild(mon);
      // Gorilla Boss watches from his champion's podium, up above you.
      let gor = null, gorBox = null;
      if (gorillaMode) {
        gorBox = document.createElement("div");
        gorBox.className = "ts-gor";
        gor = window.Boss.el("gorilla", "var(--gz)");
        gorBox.insertAdjacentHTML("beforeend", '<div class="ts-gmallet"></div>'); // his own giant mallet, swung from the right
        gorBox.appendChild(gor);
        fair.insertBefore(gorBox, fx);
      }

      let W = 0, H = 0, tw = 90, th = 300, bellH = 40, tx = 0;
      function layout() {
        W = fair.clientWidth; H = fair.clientHeight;
        tw = Math.max(86, Math.min(W * 0.3, 150));
        bellH = tw * 0.42;
        th = H * 0.86 - 16;
        // (the gorilla contest: you and the machine move left, so Gorilla Boss can stand to its right)
        tx = gorillaMode ? Math.max(W * 0.46, Math.min(W * 0.62, W - tw * 0.5 - Math.min(H * 0.42, W * 0.3, 150) - 8)) : W * 0.62;
        tower.style.cssText = `left:${tx}px;top:${H * 0.86 - th}px;height:${th}px;--tw:${tw}px;--bell:${bellH}px;`;
        const mz = Math.max(100, Math.min(H * 0.42, 170));
        fair.style.setProperty("--mz", `${mz}px`);
        // Its mallet pivots in its fist, 0.27 mz right of its middle, and the head lands 0.545 mz further at the slam,
        // so stand it there to bring the mallet down on the pad (the tower's middle).
        mon.style.transform = `translate(${Math.max(mz * 0.5, tx - mz * 0.815)}px, ${H * 0.86 + 2}px)`;
        if (gorBox) { // on the ground to the right of the machine, his mallet over his shoulder
          const gz = Math.max(70, Math.min(H * 0.42, W * 0.3, 150));
          const gx = Math.min(W - gz * 0.5 - 4, tx + tw * 0.5 + gz * 0.55);
          fair.style.setProperty("--gz", `${gz}px`);
          fair.style.setProperty("--gl", `${Math.max(30, gx - gz * 0.42 - tx)}px`); // mallet length: its head lands on the pad
          gorBox.style.transform = `translate(${gx - gz * 0.5}px, ${H * 0.86 - gz + 2}px)`;
        }
        // Words are sized to the post (76% of the tower), so long sight words fit.
        // (and to the band height, which shrinks with 4 or 5 bands)
        const bandH = (th - bellH) / NZ;
        bands.forEach((b) => { b.sign.style.fontSize = `${b.opt.kind === "word" ? Math.min(tw * 0.3, bandH * 0.5, (tw * 0.76 * 0.86) / (b.opt.text.length * 0.62)) : Math.min(tw * 0.36, bandH * 0.56)}px`; });
        setPuck(0);
      }
      // The puck's height: 0 = on the pad, 1 = up at the bell. Band i spans (i/NZ .. (i+1)/NZ) of the post.
      function setPuck(f) {
        const post = th - bellH, ph = tw * 0.16;   // f = 0: at the foot of the rail; otherwise centred on that height
        puck.style.top = `${(f > 0 ? bellH + post * (1 - f) - ph / 2 : th - ph - 2).toFixed(1)}px`;
      }

      let done = false;
      const bar = ctx.powerBar({
        parent: fair, press: fair, icon: "💪", zones: NZ,
        onStart: () => mon.classList.add("raise"),
        onRelease: (zone) => smash(bands[zone]),
      });
      bar.el.style.right = "8px"; bar.el.style.top = "10px"; bar.el.style.bottom = gorillaMode ? "58%" : "16%"; // (shorter in the gorilla contest: he stands below it)

      let busy = gorillaMode, hits = 0, misses = 0; // (Gorilla Boss goes first)
      function smash(b) {
        if (done || busy || ctx.ended) return;
        if (!gorillaMode) done = true;
        busy = true;
        bar.lock();
        mon.classList.remove("raise", "flex", "oops"); mon.classList.add("slam");
        noise(0.12, "lowpass", 800, 100, 0.8); tone(90, 0.12, "square", 0.15); // WHAM on the pad
        const right = b.opt.right;
        // Reported when the puck arrives, so the frame doesn't move on before it's seen (the gorilla contest:
        // only on the hit that decides it).
        if (!gorillaMode || (right ? hits + 1 >= GN : misses + 1 >= 3)) ctx.freezeTimer();
        const goal = (b.i + 0.5) / NZ, t0 = performance.now(), ms = reduceMotion ? 1 : 520;
        sweep(200, 200 + goal * 900, 0.5, "square", 0.06); // the puck whizzes up
        (function rise(now) {
          const k = Math.min(1, (now - t0) / ms), e = 1 - (1 - k) * (1 - k);
          setPuck(goal * e);
          if (k < 1) { ctx.raf(rise); return; }
          if (gorillaMode) { if (right) gDing(b); else gFlop(b); return; }
          if (right) ding(b); else flop(b);
        })(t0);
      }

      // ---------- Gorilla Boss's strength contest ----------
      const pips = gorillaMode ? document.createElement("div") : null;
      if (pips) {
        pips.className = "ts-pips";
        pips.innerHTML = '<span class="ts-pip"></span>'.repeat(GN) + '<span class="ts-gap"></span>' + '<span class="ts-pip x"></span>'.repeat(3);
        fair.insertBefore(pips, fx);
      }
      const sweat = () => {
        const r = gorBox.getBoundingClientRect(), f0 = fair.getBoundingClientRect();
        const s = document.createElement("div");
        s.className = "ts-drop"; s.textContent = "💦";
        s.style.left = `${r.left - f0.left + r.width * 0.75}px`; s.style.top = `${r.top - f0.top + r.height * 0.1}px`;
        fx.appendChild(s);
        ctx.later(() => s.remove(), 900);
      };
      // He goes first: WHAM, the puck flies right up to the bell, DING!, and he pounds his chest.
      function gorillaTurn() {
        bar.lock();
        gorBox.classList.add("wind");                       // he hoists his mallet…
        ctx.later(gorillaSlam, 420);
      }
      function gorillaSlam() {
        gorBox.classList.remove("wind");
        gorBox.classList.add("go");                         // …and brings it down on the pad
        noise(0.15, "lowpass", 700, 90, 0.9); tone(70, 0.15, "square", 0.15); // WHAM
        const t0 = performance.now(), ms = reduceMotion ? 1 : 450;
        (function up(now) {
          const k = Math.min(1, (now - t0) / ms);
          setPuck(Math.min(0.99, (1 - (1 - k) * (1 - k)) * 1.02));
          if (k < 1) { ctx.raf(up); return; }
          bell.classList.remove("ring"); void bell.offsetWidth; bell.classList.add("ring");
          [0, 0.1, 0.2].forEach((d) => tone(1568, 0.4, "triangle", 0.15, d)); // DING DING
          word(tx, H * 0.18, TEXT.gorillaDing, true);
          window.Boss.setMood(gor, "laugh");
          [0, 0.12, 0.24, 0.36].forEach((d) => tone(150, 0.08, "sine", 0.2, d + 0.3)); // chest pounding
        })(t0);
        ctx.later(() => {
          if (done) return;
          gorBox.classList.remove("go");
          setPuck(0);
          bell.classList.remove("ring");
          window.Boss.setMood(gor, null);
          word(tx, H * 0.18, TEXT.yourTurn, false);
          bar.reset();
          busy = false;
        }, 1700);
      }
      function gDing(b) {
        b.el.classList.add("lit");
        if (b.i === NZ - 1) bell.classList.add("ring");
        [0, 0.1].forEach((d) => tone(1568, 0.4, "triangle", 0.15, d)); // DING
        word(tx, H * 0.2, TEXT.ding, false);
        mon.classList.remove("slam"); mon.classList.add("flex");
        if (b.opt.kind === "pic") ctx.say(b.opt.spoken);
        pips.children[hits].classList.add("on");
        hits++;
        window.Boss.setMood(gor, hits >= GN ? "cry" : "hurt"); // he's getting worried…
        sweat();
        if (hits >= GN) { done = true; ctx.win(); ctx.confetti(fx, tx, H * 0.3, { count: 80 }); ctx.say(C.answer); return; }
        ctx.later(() => {
          if (done) return;
          // The beat: the clock stops, the card pops to the next target, the voice says it, new bands.
          ctx.pauseTimer(800);
          C = S[hits];
          card.firstChild.textContent = C.cardText;
          card.classList.remove("next"); void card.offsetWidth; card.classList.add("next");
          tone(98, 0.08, "square", 0.1); tone(98, 0.08, "square", 0.1, 0.16);
          ctx.later(() => { if (!done) ctx.say(C.prompt); }, b.opt.kind === "pic" ? 350 : 0);
          const nr = ctx.shuffle(C.row.slice());
          bands.forEach((x, i) => { x.opt = nr[i]; x.sign.textContent = x.opt.text; x.el.classList.remove("lit"); });
          layout();
          bell.classList.remove("ring");
          mon.classList.remove("flex");
          window.Boss.setMood(gor, null);
          bar.reset();
          busy = false;
        }, 750);
      }
      function gFlop(b) {
        sweep(400, 120, 0.4, "sawtooth", 0.1); // flop
        word(tx, H * 0.2, TEXT.flop, true);
        mon.classList.remove("slam"); mon.classList.add("oops");
        window.Boss.setMood(gor, "laugh");
        [0, 0.15, 0.3].forEach((d) => tone(330, 0.1, "square", 0.07, d)); // ha ha ha
        pips.children[GN + 1 + misses].classList.add("on");
        misses++;
        if (misses >= 3) { done = true; ctx.lose(); ctx.later(() => { bands.forEach((x) => x.el.classList.add(x.opt.right ? "right" : "dim")); ctx.say(C.answer); }, 350); return; }
        ctx.later(() => {
          if (done) return;
          setPuck(0);
          mon.classList.remove("oops");
          window.Boss.setMood(gor, null);
          bar.reset();
          busy = false;
        }, 800);
      }
      function ding(b) {
        ctx.win();
        b.el.classList.add("lit");
        if (b.i === 2) bell.classList.add("ring");
        [0, 0.1].forEach((d) => tone(1568, 0.4, "triangle", 0.15, d)); // DING
        word(tx, H * 0.2, TEXT.ding, false);
        mon.classList.remove("slam"); mon.classList.add("flex");
        ctx.confetti(fx, tx, H * 0.3, { count: 80 });
        ctx.say(C.answer);
      }
      function flop(b) {
        ctx.lose();
        sweep(400, 120, 0.4, "sawtooth", 0.1); // flop
        word(tx, H * 0.2, TEXT.flop, true);
        mon.classList.remove("slam"); mon.classList.add("oops");
        const s = document.createElement("div");
        s.textContent = "💦"; s.style.cssText = "position:absolute;font-size:1.6rem;";
        const r = mon.getBoundingClientRect(), f0 = fair.getBoundingClientRect();
        s.style.left = `${r.right - f0.left - 20}px`; s.style.top = `${r.top - f0.top}px`;
        fx.appendChild(s);
        ctx.later(() => { bands.forEach((x) => x.el.classList.add(x.opt.right ? "right" : "dim")); ctx.say(C.answer); }, 350);
      }
      function word(x, y, text, bad) {
        const w = document.createElement("div");
        w.className = "ts-word" + (bad ? " bad" : "");
        w.textContent = text;
        w.style.left = `${Math.max(70, Math.min(W - 70, x))}px`; w.style.top = `${y}px`;
        fx.appendChild(w);
        if (gorillaMode) ctx.later(() => w.remove(), 900); // (several in a contest)
      }
      function replay() { if (!done) ctx.say(C.prompt); }

      ctx.onTimeout(() => { done = true; bar.lock(); mon.classList.remove("raise"); bands.forEach((x) => x.el.classList.add(x.opt.right ? "right" : "dim")); ctx.say(C.answer); });
      function onKey(e) { if (e.key === " ") { e.preventDefault(); replay(); } }
      document.addEventListener("keydown", onKey);

      layout();
      const ro = new ResizeObserver(layout);
      ro.observe(fair);
      ctx.say(C.prompt);
      // Show the target big in the middle for a moment before play starts (ctx.reveal).
      const revealMs = ctx.reveal(card);
      if (gorillaMode) { // the champ goes first (the clock waits for him)
        ctx.pauseTimer(2350); // (his wind-up, slam and DING)
        ctx.later(gorillaTurn, revealMs + 80);
      }
      ctx.later(() => ctx.hint(bar.el.querySelector(".pwb-btn"), null, { scale: 0.7 }), 80);

      // Tutorial: point at the card, then the right band, then charge to its colour and smash.
      ctx.tutorial(C.target, async (f) => {
        const btn = bar.el.querySelector(".pwb-btn"), b = bands.find((x) => x.opt.right);
        await f.point(card, 900);
        await f.point(b.sign, 700);
        await f.move(btn, 400);
        await f.tapNow(btn);
        await f.until(() => bar.charging && Math.abs(bar.level - bar.zoneCenter(b.i)) < 0.06, 6000);
        await f.tapNow(btn);
        await f.until(() => ctx.ended, 2000);
      });

      return () => { done = true; ro.disconnect(); document.removeEventListener("keydown", onKey); };
    },
  });
})();
