// SPIDER SWING — the teacher's idea: web-slinging through a city. A silly purple spider monster starts on the
// street at the bottom left; two round signs hang ahead, each with an answer (`ctx.choiceSteps`: every swing has a
// NEW target on the card). Tap the right one: a web shoots out, sticks, and he swings across while the city pans
// left; two new signs pop in ahead, and he keeps swinging gently on his web while you choose (no rush). A wrong
// sign: the web flops and he staggers (WHOA!) but recovers; that sign greys out. A second miss: he plummets and
// lands flat on his face (SPLAT!). Five right swings: he lets go, lands on a burglar's head and webs him up
// (GOTCHA!).
(function () {
  const TEXT = {
    name: { en: "Spider Swing" },
    icon: "🕷️",
    howTo: { en: {
      steps: [
        ["👀", "Look at the card."],
        ["🕸️", "Tap the sign that matches. The spider shoots a web and swings to it!"],
        ["🔁", "Then the card changes: pick the next sign. 5 swings and he catches the bad guy!"],
      ],
      tips: ["A wrong sign and the spider wobbles. Two wrong signs and he falls flat on his face!", "Take your time: he keeps swinging while you choose.", "Tap the card to hear it again."],
    } },
    instruction: { en: "SWING!" },
    cardLabel: "The card. Tap to hear it again.",
    signLabel: (t) => `Sign ${t}`,
    thwip: ["THWIP!", "SWING!", "WHEEE!", "THWIP!"],
    whoa: "WHOA!",
    splat: "SPLAT!",
    gotcha: "GOTCHA!",
  };
  const GOAL = 5, MISSES = 2;

  const CSS = `
  .ssw { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:6px; padding-bottom:6px; }
  .ssw-top { flex:none; display:flex; align-items:center; gap:10px; }
  .ssw-card { padding:4px 16px; background:#fff; border:5px solid #111; border-radius:16px; box-shadow:0 5px 0 #111; font:inherit; color:#111; font-size:clamp(1.8rem, 8vw, 2.8rem);
    line-height:1.05; cursor:pointer; touch-action:manipulation; display:flex; align-items:center; gap:6px; white-space:nowrap; }
  .ssw-card .spk { font-size:.45em; }
  .ssw-card.next { animation:ssw-next .35s cubic-bezier(.2,1.8,.4,1); }
  .ssw-pips { display:flex; flex-direction:column; gap:4px; }
  .ssw-row { display:flex; gap:4px; }
  .ssw-pip { width:22px; height:22px; border:3px solid #111; border-radius:50%; background:#fff; display:flex; align-items:center; justify-content:center; font-size:12px; line-height:1; }
  .ssw-pip.on { background:#c38bff; } .ssw-pip.on::after { content:"🕸️"; }
  .ssw-pip.x.on { background:#ff5a6e; } .ssw-pip.x.on::after { content:"✕"; color:#fff; font-weight:900; }
  /* The city at dusk: the sky stays put, the world (buildings, signs, the street) pans */
  .ssw-city { position:relative; flex:1; min-height:0; width:100%; max-width:640px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111;
    background:linear-gradient(180deg, #2a1b5e 0%, #7a3fa8 45%, #ff8a5c 100%); touch-action:manipulation; }
  .ssw-moon { position:absolute; right:12%; top:8%; width:9%; aspect-ratio:1; border-radius:50%; background:#fff6c9; box-shadow:0 0 30px 8px rgba(255,246,201,.5); }
  .ssw-world { position:absolute; left:0; top:0; bottom:0; width:1px; will-change:transform; }
  .ssw-bld { position:absolute; bottom:0; background:#3a2a5e; border:3px solid #111; border-bottom:0;
    background-image:linear-gradient(#ffe066 0 0); background-size:0 0; }
  .ssw-bld::after { content:""; position:absolute; inset:10% 14% 12%; background:radial-gradient(circle, #ffe066 0 30%, transparent 34%) 0 0 / 30% 16%; opacity:.75; }   /* lit windows */
  .ssw-street { position:absolute; left:-2000px; width:20000px; bottom:0; height:var(--sh); background:#555; border-top:4px solid #111;
    background-image:linear-gradient(90deg, #ffd400 0 40px, transparent 40px 90px); background-size:90px 6px; background-repeat:repeat-x; background-position:0 50%; }
  /* A hanging sign (--az): a ring on a wire from the top, the answer on a round board */
  .ssw-sign { position:absolute; width:var(--az); height:var(--az); margin:calc(var(--az) / -2) 0 0 calc(var(--az) / -2); padding:0; border:0; background:none; font:inherit;
    cursor:pointer; touch-action:manipulation; z-index:3; animation:ssw-in .35s cubic-bezier(.2,1.6,.4,1) both; }
  .ssw-sign .pole { position:absolute; left:50%; top:96%; width:8%; height:44%; margin-left:-4%; background:#8a96a6; border:3px solid #111; border-top:0; }
  /* A sign's own tall building (from the street up to just under the pole), with lit windows and a roof ledge */
  .ssw-tower { position:absolute; bottom:var(--sh); z-index:1; border:4px solid #111; border-bottom:0; border-radius:4px 4px 0 0; }
  .ssw-tower::before { content:""; position:absolute; left:-8%; right:-8%; top:-4px; height:10px; background:#2a1d4a; border:3px solid #111; border-radius:3px; }
  .ssw-tower::after { content:""; position:absolute; inset:14px 12% 8px; background:radial-gradient(circle, #ffe066 0 30%, transparent 34%) 0 0 / 34% 46px; opacity:.85; }
  .ssw-sign .ring { position:absolute; left:50%; top:-14%; width:24%; height:24%; margin-left:-12%; border:4px solid #c9d1d9; border-radius:50%; box-shadow:0 0 0 2px #111; }
  .ssw-sign .bd { position:absolute; inset:0; border-radius:50%; background:#fff; border:5px solid #111; box-shadow:0 5px 0 #111, inset 0 0 0 5px #c38bff;
    display:flex; align-items:center; justify-content:center; font-size:calc(var(--az) * .42); line-height:1; color:#111; white-space:nowrap; }
  .ssw-sign.used { opacity:0; pointer-events:none; transition:opacity .3s; }
  .ssw-sign.bad { filter:grayscale(1); opacity:.45; pointer-events:none; }
  .ssw-sign.right .bd { box-shadow:0 0 0 5px #fff, 0 0 0 10px #00b86b; }
  .ssw-sign.live .bd { animation:ssw-pulse .8s ease-in-out infinite alternate; }
  .ssw-web { position:absolute; left:0; top:0; height:4px; transform-origin:0 50%; z-index:2; pointer-events:none;
    background:repeating-linear-gradient(90deg, #fff 0 10px, #dfe6ee 10px 12px); border-radius:2px; box-shadow:0 0 0 1px rgba(0,0,0,.35); }
  .ssw-web.flop { transition:opacity .4s; opacity:0; }
  /* The spider (--sz): purple, yellow spots, big googly eyes (and two little ones), a fangy grin, 8 wiggly legs */
  .ssw-spi { position:absolute; left:0; top:0; width:var(--sz); height:var(--sz); z-index:4; pointer-events:none; }
  .ssw-in { position:absolute; inset:0; }
  .ssw-in > * { position:absolute; box-sizing:border-box; }
  .ssw-leg { top:46%; width:42%; height:7%; background:#111; border-radius:99px; transform-origin:0 50%; }
  .ssw-leg.l { left:50%; } .ssw-leg.r { left:50%; }
  .ssw-leg::after { content:""; position:absolute; right:-2%; top:0; width:44%; height:100%; background:#111; border-radius:99px; transform-origin:0 50%; transform:rotate(55deg); left:96%; }
  .ssw-leg.a { transform:rotate(200deg); } .ssw-leg.b { transform:rotate(170deg); } .ssw-leg.c { transform:rotate(145deg); } .ssw-leg.d { transform:rotate(120deg); }
  .ssw-leg.e { transform:rotate(-20deg); } .ssw-leg.f { transform:rotate(10deg); } .ssw-leg.g { transform:rotate(35deg); } .ssw-leg.h { transform:rotate(60deg); }
  .ssw-leg.l::after { transform:rotate(-55deg); }
  .ssw-spi.swing .ssw-leg { animation:ssw-wig .25s ease-in-out infinite alternate; }
  .ssw-body { left:14%; right:14%; top:14%; bottom:10%; border-radius:50%; border:4px solid #111; z-index:2;
    background:radial-gradient(circle at 26% 70%, #ffd400 0 7%, transparent 8%), radial-gradient(circle at 74% 74%, #ffd400 0 6%, transparent 7%), radial-gradient(circle at 50% 88%, #ffd400 0 5%, transparent 6%), #7a4fe0; }
  .ssw-eye { top:26%; width:28%; aspect-ratio:1; background:#fff; border:3px solid #111; border-radius:50%; overflow:hidden; z-index:3; }
  .ssw-eye.l { left:20%; } .ssw-eye.r { right:20%; width:24%; top:28%; }
  .ssw-eye.s { width:11%; top:16%; } .ssw-eye.s1 { left:35%; } .ssw-eye.s2 { right:35%; }
  .ssw-eye i { position:absolute; left:28%; top:30%; width:46%; aspect-ratio:1; background:#111; border-radius:50%; animation:ssw-roll 1.1s ease-in-out infinite alternate; }
  .ssw-mouth { left:32%; right:32%; top:58%; height:13%; background:#5a0f1e; border:3px solid #111; border-radius:10% 10% 50% 50% / 14% 14% 86% 86%; z-index:3; }
  .ssw-mouth::before, .ssw-mouth::after { content:""; position:absolute; top:-2px; width:22%; height:46%; background:#fff; clip-path:polygon(0 0, 100% 0, 50% 100%); }
  .ssw-mouth::before { left:14%; } .ssw-mouth::after { right:14%; }
  .ssw-spi.stagger .ssw-in { animation:ssw-wobble .12s ease-in-out 6 alternate; }
  .ssw-spi.stagger .ssw-eye i, .ssw-spi.splat .ssw-eye i { animation:ssw-dizzy .4s linear infinite; }
  .ssw-spi.splat .ssw-mouth { border-radius:50%; left:40%; right:40%; }
  .ssw-spi.yay .ssw-in { animation:ssw-hop .3s ease-in-out infinite alternate; }
  /* The burglar (--vz): a grumpy grey monster in a black mask and a striped top, with a swag bag */
  .ssw-bad { position:absolute; left:0; top:0; width:var(--vz); height:var(--vz); z-index:3; pointer-events:none; }
  .ssw-bin { position:absolute; inset:0; transform-origin:50% 100%; }
  .ssw-bin > * { position:absolute; box-sizing:border-box; }   /* (the burglar's parts: animations go on this inner layer, not on .ssw-bad, which is placed with a transform) */
  .ssw-bbody { left:12%; right:12%; top:16%; bottom:4%; border:4px solid #111; border-radius:46% 46% 30% 30%; background:linear-gradient(180deg, #9aa3b5 0 46%, #fff 46% 54%, #111 54% 62%, #fff 62% 70%, #111 70% 78%, #fff 78% 86%, #111 86%); }
  .ssw-mask { left:16%; right:16%; top:28%; height:16%; background:#111; border-radius:40%; z-index:2; }
  .ssw-beye { top:30%; width:18%; aspect-ratio:1; background:#fff; border-radius:50%; z-index:3; }
  .ssw-beye.l { left:28%; } .ssw-beye.r { right:28%; }
  .ssw-beye::after { content:""; position:absolute; left:30%; top:30%; width:45%; aspect-ratio:1; border-radius:50%; background:#111; }
  .ssw-bbrow { top:22%; width:22%; height:6%; background:#111; z-index:3; } .ssw-bbrow.l { left:26%; transform:rotate(20deg); } .ssw-bbrow.r { right:26%; transform:rotate(-20deg); }
  .ssw-bmouth { left:38%; right:38%; top:46%; height:5%; background:#111; border-radius:99px; z-index:3; }
  .ssw-bag { right:-24%; top:34%; font-size:calc(var(--vz) * .42); line-height:1; }
  .ssw-bad.webbed .ssw-wrap { opacity:1; }
  .ssw-wrap { inset:-6%; z-index:5; opacity:0; transition:opacity .3s; border-radius:40%;
    background:repeating-linear-gradient(35deg, transparent 0 12%, rgba(255,255,255,.95) 12% 15%), repeating-linear-gradient(-35deg, transparent 0 12%, rgba(255,255,255,.95) 12% 15%), rgba(255,255,255,.25); }
  .ssw-bad.webbed .ssw-bin { animation:ssw-struggle .5s ease-in-out infinite alternate; }   /* (a slow wriggle: the fast wobble looked like a glitch) */
  @keyframes ssw-struggle { from { rotate:-5deg; scale:1 1; } to { rotate:5deg; scale:1.04 .97; } }
  .ssw-fx { position:absolute; inset:0; pointer-events:none; z-index:8; overflow:visible; }
  .ssw-word { position:absolute; transform:translate(-50%, -50%) rotate(-8deg); font-size:2rem; color:#fff; -webkit-text-stroke:2px #111; paint-order:stroke fill;
    text-shadow:0 4px 0 #111; white-space:nowrap; animation:ssw-word 1s ease-out forwards; }
  .ssw-word.bad { color:#ff5a6e; } .ssw-word.big { font-size:2.6rem; color:#ffd400; }
  @keyframes ssw-in { from { scale:.3; opacity:0; } }
  @keyframes ssw-pulse { to { box-shadow:0 5px 0 #111, inset 0 0 0 9px #c38bff; } }
  @keyframes ssw-next { from { scale:.6; } }
  @keyframes ssw-wig { to { rotate:14deg; } }
  @keyframes ssw-roll { from { transform:translate(-25%, -15%); } to { transform:translate(25%, 15%); } }
  @keyframes ssw-dizzy { from { transform:rotate(0) translateX(25%); } to { transform:rotate(360deg) translateX(25%); } }
  @keyframes ssw-wobble { from { rotate:-16deg; } to { rotate:16deg; } }
  @keyframes ssw-hop { to { translate:0 -14%; } }
  @keyframes ssw-word { from { opacity:1; scale:.5; } 25% { scale:1.15; } 75% { opacity:1; } to { opacity:0; translate:0 -40px; } }
  @media (prefers-reduced-motion: reduce) { .ssw-sign, .ssw-sign.live .bd, .ssw-eye i, .ssw-leg, .ssw-word, .ssw-bad.webbed { animation:none !important; } }
  `;
  function injectCss() { if (document.getElementById("ssw-css")) return; const s = document.createElement("style"); s.id = "ssw-css"; s.textContent = CSS; document.head.appendChild(s); }

  registerMicrogame({
    id: "spider-swing",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 22000,   // 5 swings (he waits while you choose)
    input: "tap",
    tutorial: true,

    start(ctx) {
      injectCss();
      const speed = ctx.speed || 1, pace = 0.6 + 0.4 * speed;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const { tone, sweep, noise } = ctx.sfx;
      const N = speed >= 2 ? 3 : 2;
      const S = ctx.choiceSteps(GOAL, N, { lowercase: true });
      let si = 0, st = S[0];

      // ---------- DOM ----------
      const wrap = document.createElement("div");
      wrap.className = "ssw";
      const top = document.createElement("div");
      top.className = "ssw-top";
      const card = document.createElement("button");
      card.className = "ssw-card";
      card.setAttribute("aria-label", TEXT.cardLabel);
      card.innerHTML = '<span class="ct"></span>';
      card.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });
      const pips = document.createElement("div");
      pips.className = "ssw-pips";
      pips.innerHTML = `<div class="ssw-row hits">${'<span class="ssw-pip"></span>'.repeat(GOAL)}</div><div class="ssw-row">${'<span class="ssw-pip x"></span>'.repeat(MISSES)}</div>`;
      top.append(card, pips);
      const city = document.createElement("div");
      city.className = "ssw-city";
      city.innerHTML = '<div class="ssw-moon"></div>';
      const world = document.createElement("div");
      world.className = "ssw-world";
      world.innerHTML = '<div class="ssw-street"></div>';
      const web = document.createElement("div");
      web.className = "ssw-web"; web.hidden = true;
      const spi = document.createElement("div");
      spi.className = "ssw-spi";
      spi.innerHTML = '<div class="ssw-in">' + "abcd".split("").map((k) => `<div class="ssw-leg l ${k}"></div>`).join("") + "efgh".split("").map((k) => `<div class="ssw-leg r ${k}"></div>`).join("") +
        '<div class="ssw-body"></div><div class="ssw-eye s s1"><i></i></div><div class="ssw-eye s s2"><i></i></div><div class="ssw-eye l"><i></i></div><div class="ssw-eye r"><i></i></div><div class="ssw-mouth"></div></div>';
      world.append(web, spi);
      const fx = document.createElement("div");
      fx.className = "ssw-fx";
      city.append(world, fx);
      wrap.append(top, city);
      ctx.root.appendChild(wrap);
      const hitPips = pips.querySelector(".hits").children, missPips = pips.children[1].children;

      // ---------- Layout ----------
      let W = 0, H = 0, sz = 70, az = 70, gy = 0, vz = 90;
      function layout() {
        W = city.clientWidth; H = city.clientHeight;
        sz = Math.max(50, Math.min(H * 0.15, W * 0.15, 90));
        az = Math.max(56, Math.min(H * 0.17, W * 0.18, 92));
        vz = sz * 1.35;
        gy = H * 0.9;
        city.style.setProperty("--sz", `${sz}px`); city.style.setProperty("--az", `${az}px`);
        city.style.setProperty("--vz", `${vz}px`); city.style.setProperty("--sh", `${H - gy}px`);
        signs.forEach(place);
        if (bad) placeBad();
      }

      // Buildings along the way (a little skyline that pans with the world).
      function skyline(x0, x1) {
        for (let x = x0; x < x1;) {
          const w = 60 + Math.random() * 70, h = 0.25 + Math.random() * 0.35;
          const b = document.createElement("div");
          b.className = "ssw-bld";
          b.style.left = `${x}px`; b.style.width = `${w}px`; b.style.height = `${h * 100}%`; b.style.bottom = `${10}%`;
          b.style.background = ["#3a2a5e", "#46306e", "#2f2350"][Math.floor(Math.random() * 3)];
          world.insertBefore(b, world.firstChild);   // (behind the street and everything else)
          x += w + 4;
        }
      }

      // ---------- The signs ----------
      let signs = [];
      const place = (s) => {
        s.el.style.left = `${s.x}px`; s.el.style.top = `${s.y}px`;
        if (s.tower) {   // (the roof is just below the sign's pole)
          const w = az * 1.5;
          s.tower.style.left = `${s.x - w / 2}px`; s.tower.style.width = `${w}px`;
          s.tower.style.top = `${s.y + az * 0.5 + az * 0.4}px`;
        }
      };
      // A new pair (or three) of signs ahead of x: one high and near, one lower and further (shuffled).
      function deal(x) {
        card.firstChild.textContent = st.cardText;
        card.querySelector(".spk")?.remove();
        if (ctx.canSpeak && !st.listen) card.insertAdjacentHTML("beforeend", '<span class="spk">🔊</span>');
        const spots = [[0.24, 0.17], [0.44, 0.33], [0.6, 0.2]].slice(0, N);
        const row = ctx.shuffle(st.row.slice());
        signs = row.map((o, i) => {
          const b = document.createElement("button");
          b.className = "ssw-sign live";
          b.style.animationDelay = `${i * 0.08}s`;
          b.setAttribute("aria-label", TEXT.signLabel(o.spoken || o.text));
          b.innerHTML = '<span class="pole"></span><span class="ring"></span><span class="bd"></span>';
          b.querySelector(".bd").textContent = o.text;
          if (o.kind === "word") b.querySelector(".bd").style.fontSize = `${Math.min(az * 0.36, (az * 0.86) / ([...o.text].length * 0.6))}px`;
          // Each sign stands on a pole on the roof of its own tall building (the teacher: not floating in the sky).
          const tower = document.createElement("div");
          tower.className = "ssw-tower";
          tower.style.background = ["#4a3478", "#3e2c66", "#55408a"][i % 3];
          const street = world.querySelector(".ssw-street");
          world.insertBefore(tower, street.nextSibling);
          const s = { el: b, o, x: x + W * spots[i][0], y: H * spots[i][1], dead: false, tower };
          b.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); pick(s); });
          world.appendChild(b);
          place(s);
          return s;
        });
        skyline(x + W * 0.2, x + W * 1.4);
      }

      // ---------- The spider ----------
      const me = { x: 0, y: 0, mode: "ground" };   // mode: ground, reel, swing, hang, fly, fall, done
      // hold: the point you swing from; aim: where the web is shooting
      let hold = null, aim = null, theta = 0, th0 = 0, th1 = 0, r = 0, t0 = 0, swingMs = 900, cam = 0;
      let focus = 0;   // where the camera looks: the end of the last swing (not the spider, who swings back and forth)
      const omega = () => (Math.PI * 2) / (2300 / pace);   // the hanging pendulum's speed
      function drawSpider() {
        spi.style.transform = `translate(${(me.x - sz / 2).toFixed(1)}px, ${(me.y - sz / 2).toFixed(1)}px) rotate(${(me.rot || 0).toFixed(1)}deg)`;
        const to = aim || hold;
        if (to && !web.hidden) {
          const dx = to.x - me.x, dy = to.y - me.y;
          web.style.width = `${Math.hypot(dx, dy) * (web.k ?? 1)}px`;
          web.style.transform = `translate(${me.x}px, ${me.y - 2}px) rotate(${Math.atan2(dy, dx)}rad)`;
        }
      }

      let hits = 0, missN = 0, done = false, busy = false;
      function pick(s) {
        if (done || busy || ctx.ended || s.dead || !["ground", "hang"].includes(me.mode)) return;
        busy = true;
        shoot(s);
      }
      // The web shoots out to the sign (a fast THWIP).
      function shoot(s) {
        aim = { x: s.x, y: s.y - az * 0.5 };
        web.hidden = false; web.classList.remove("flop");
        sweep(2400, 900, 0.12, "sawtooth", 0.06);   // thwip
        const tStart = performance.now(), ms = reduceMotion ? 1 : 170;
        (function grow(now) {
          web.k = Math.min(1, (now - tStart) / ms);
          drawSpider();
          if (web.k < 1) { ctx.raf(grow); return; }
          if (s.o.right) attach(s); else flop(s);
        })(tStart);
      }
      function attach(s) {
        s.el.classList.remove("live");
        signs.forEach((x) => { x.dead = true; if (x !== s) x.el.classList.add("used"); });
        hitPips[hits].classList.add("on");
        hits++;
        word(TEXT.thwip[(hits - 1) % TEXT.thwip.length], false, s.x - cam, s.y + az);
        if (s.o.kind === "pic") ctx.say(s.o.spoken);
        // Swing: pull in a little if the web is too long to clear the street, then swing across.
        hold = aim; aim = null;
        r = Math.min(Math.hypot(me.x - hold.x, me.y - hold.y), gy - sz * 0.7 - hold.y);
        th0 = Math.atan2(me.x - hold.x, me.y - hold.y);
        if (th0 > -0.35) th0 = -0.35;   // (always swing from the left, so you go right)
        th1 = Math.min(0.62, -th0 * 0.95);   // (a gentler swing, so the next signs stay on screen)
        focus = hold.x + r * Math.sin(th1);
        t0 = performance.now(); swingMs = (reduceMotion ? 1 : 1000) / pace;
        me.mode = "swing"; me.rot = 0;
        spi.classList.add("swing");
        if (hits >= GOAL) { done = true; ctx.freezeTimer(); return; }   // (the last swing flies on to the burglar)
        // The next target: the card pops, new signs ahead.
        ctx.later(() => {
          st = S[++si];
          card.classList.remove("next"); void card.offsetWidth; card.classList.add("next");
          tone(98, 0.08, "square", 0.1); tone(147, 0.08, "square", 0.1, 0.16);
          deal(focus);
          if (hits === GOAL - 1) spawnBad();
          ctx.say(st.prompt);
        }, swingMs * 0.6);
      }
      // A wrong sign: the web flops, the spider staggers (or, the second time, falls).
      function flop(s) {
        s.dead = true; s.el.classList.add("bad");
        web.classList.add("flop");
        missPips[missN].classList.add("on");
        missN++;
        tone(300, 0.1, "square", 0.08); sweep(500, 200, 0.3, "sawtooth", 0.07);
        if (missN >= MISSES) {
          done = true; ctx.freezeTimer();
          ctx.later(() => { aim = null; hold = null; web.hidden = true; fall(); }, 250);
          return;
        }
        spi.classList.remove("stagger"); void spi.offsetWidth; spi.classList.add("stagger");
        word(TEXT.whoa, true, me.x - cam, me.y - sz);
        ctx.later(() => { aim = null; web.classList.remove("flop"); web.hidden = !hold; spi.classList.remove("stagger"); busy = false; }, 600);
      }
      function fall() {
        me.mode = "fall"; me.vy = 0; spi.classList.remove("swing");
        spi.classList.add("splat");
        sweep(900, 200, 0.6, "sine", 0.07);   // a falling whistle
      }
      function land() {
        me.mode = "done"; me.y = gy - sz * 0.28; me.rot = 90;
        noise(0.15, "lowpass", 600, 200, 0.5); tone(90, 0.2, "square", 0.12);   // SPLAT
        city.animate([{ translate: "0 0" }, { translate: "-6px 4px" }, { translate: "6px -4px" }, { translate: "0 0" }], { duration: 300 });
        word(TEXT.splat, true, me.x - cam, me.y - sz * 1.2);
        ctx.lose();
        ctx.later(() => { signs.forEach((x) => { if (!x.el.classList.contains("bad") && !x.el.classList.contains("used")) x.el.classList.add(x.o.right ? "right" : "used"); }); ctx.say(st.answer); }, 400);
      }

      // ---------- The burglar ----------
      let bad = null;
      function spawnBad() {
        bad = document.createElement("div");
        bad.className = "ssw-bad";
        bad.innerHTML = '<div class="ssw-bin"><div class="ssw-bbody"></div><div class="ssw-mask"></div><div class="ssw-beye l"></div><div class="ssw-beye r"></div><div class="ssw-bbrow l"></div><div class="ssw-bbrow r"></div>' +
          '<div class="ssw-bmouth"></div><div class="ssw-bag">💰</div><div class="ssw-wrap"></div></div>';
        bad.bx = Math.max(...signs.map((s) => s.x)) + W * 0.3;
        world.appendChild(bad);
        placeBad();
      }
      function placeBad() { bad.style.transform = `translate(${bad.bx - vz / 2}px, ${gy - vz}px)`; }
      function finale() {
        // Let go at the top of the swing and drop onto the burglar's head, then web him up.
        me.mode = "fly"; web.hidden = true; hold = null;
        const a = { x: me.x, y: me.y }, b = { x: bad.bx, y: gy - vz - sz * 0.35 }, tS = performance.now(), ms = reduceMotion ? 1 : 800;
        sweep(400, 1200, 0.4, "triangle", 0.08);
        (function fly(now) {
          const k = Math.min(1, (now - tS) / ms);
          me.x = a.x + (b.x - a.x) * k; me.y = a.y + (b.y - a.y) * k - Math.sin(k * Math.PI) * H * 0.2;
          me.rot = k * 360;
          if (k < 1) { ctx.raf(fly); return; }
          me.rot = 0; me.mode = "done";
          spi.classList.remove("swing"); spi.classList.add("yay");
          bad.classList.add("webbed");
          noise(0.08, "lowpass", 800, 300, 0.4);   // bonk
          [0, 0.1, 0.2, 0.3].forEach((t) => sweep(2400, 900, 0.1, "sawtooth", 0.05, t));   // thwip thwip thwip
          [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, "triangle", 0.1, 0.4 + i * 0.08));
          word(TEXT.gotcha, false, bad.bx - cam, gy - vz * 1.6, true);
          ctx.confetti(fx, bad.bx - cam, gy - vz, { count: 90 });
          ctx.win();
          ctx.say(st.answer);
        })(tS);
      }

      // ---------- The loop: swinging, hanging, falling, and the camera ----------
      let last = null;
      function frame(ts) {
        const dt = last == null ? 0 : Math.min(50, ts - last) / 1000;
        last = ts;
        const now = performance.now();
        if (me.mode === "swing") {
          const k = Math.min(1, (now - t0) / swingMs), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
          theta = th0 + (th1 - th0) * e;
          me.x = hold.x + r * Math.sin(theta); me.y = hold.y + r * Math.cos(theta);
          if (k >= 1) {
            if (hits >= GOAL) finale();
            else { me.mode = "hang"; t0 = now; busy = false; }
          }
        } else if (me.mode === "hang" && hold) {
          theta = th1 * Math.cos(omega() * (now - t0));   // keeps swinging gently while you choose
          me.x = hold.x + r * Math.sin(theta); me.y = hold.y + r * Math.cos(theta);
        } else if (me.mode === "fall") {
          me.vy += H * 3.2 * dt; me.y += me.vy * dt; me.rot = Math.min(90, (me.rot || 0) + 260 * dt);
          if (me.y >= gy - sz * 0.28) land();
        }
        // The camera keeps the spider about a third of the way across.
        const want = Math.max(0, (me.mode === "fly" || me.mode === "done" || me.mode === "fall" ? me.x : focus) - W * 0.3);
        cam += (want - cam) * Math.min(1, dt * 3.5);
        world.style.transform = `translateX(${(-cam).toFixed(1)}px)`;
        drawSpider();
        if (!ctx.ended || me.mode === "fly" || me.mode === "fall") ctx.raf(frame);
      }

      function word(text, bad, x, y, big) {
        const w = document.createElement("div");
        w.className = "ssw-word" + (bad ? " bad" : "") + (big ? " big" : "");
        w.textContent = text;
        w.style.left = `${Math.max(80, Math.min(W - 80, x))}px`; w.style.top = `${Math.max(30, Math.min(H - 30, y))}px`;
        fx.appendChild(w);
        ctx.later(() => w.remove(), 1000);
      }
      function replay() { if (!done) ctx.say(st.prompt); }

      ctx.onTimeout(() => { done = true; spi.classList.add("stagger"); signs.forEach((x) => { if (!x.dead) x.el.classList.add(x.o.right ? "right" : "used"); }); ctx.say(st.answer); });
      function onKey(e) {
        const i = parseInt(e.key, 10) - 1;
        if (i >= 0 && i < signs.length) { e.preventDefault(); pick(signs[i]); }
        else if (e.key === " ") { e.preventDefault(); replay(); }
      }
      document.addEventListener("keydown", onKey);

      layout();
      me.x = sz * 0.9; me.y = gy - sz * 0.5; focus = me.x;
      skyline(-200, 0);
      deal(me.x);
      const ro = new ResizeObserver(layout);
      ro.observe(city);
      ctx.say(st.prompt);
      ctx.reveal(card);
      ctx.raf(frame);

      // Tutorial: each swing, point at the card, then tap the right sign.
      ctx.tutorial(S.map((s) => s.target), async (f) => {
        for (let n = 0; n < GOAL && !done; n++) {
          await f.until(() => !busy && si === n && signs.some((x) => !x.dead), 5000);
          await f.point(card, n ? 450 : 900);
          await f.tap(() => (signs.find((x) => x.o.right && !x.dead) || signs[0]).el);
          await f.until(() => hits > n || done, 3000);
        }
        await f.until(() => ctx.ended, 3000);
      });
      return () => { done = true; ro.disconnect(); document.removeEventListener("keydown", onKey); };
    },
  });
})();
