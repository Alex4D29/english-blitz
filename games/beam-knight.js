// BEAM KNIGHT — the teacher's idea: a hooded "jedi" style knight with a glowing beam sword stands in the middle. 5 silly
// flying droids pop out around the knight, each wearing an answer plate, and the card announces a target. Tap the droid
// with the right answer: the knight swings the beam sword at it and DEFLECTS its laser into one of the other droids,
// which explodes for the rest of the game (5 droids, then 4, 3, 2). With one droid left, the knight slices it in half.
// Tap a wrong droid and the right droid's laser hits the knight (shocked; 3 hits and the knight collapses and smokes).
// Win: the knight throws the beam sword in the air, watches it spin, it slowly falls back, he looks scared, and the game
// suddenly ends.
(function () {
  const TEXT = {
    name: { en: "Beam Knight" },
    icon: "⚔️",
    howTo: { en: {
      steps: [
        ["👀", "Look at the card."],
        ["🤖", "Flying droids pop out. Tap the droid that matches!"],
        ["⚔️", "The knight bounces its laser back and blows up another droid!"],
      ],
      tips: ["Wrong answer: you get zapped ⚡. Three zaps and the knight falls down!", "Take your time while you choose.", "Tap the card to hear it again."],
    } },
    instruction: { en: "DEFLECT IT!" },
    cardLabel: "The card. Tap to hear it again.",
    droidLabel: (t) => `Droid ${t}`,
    clang: "CLANG!", boom: "BOOM!", slice: "SLICE!", zap: "ZAP!", ouch: "OUCH!", oops: "OH NO!", win: "YOU WIN!", eek: "EEK!",
  };
  const GOAL = 5;   // 4 deflections, then the slice

  const CSS = `
  .jd { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:6px; padding-bottom:6px; }
  .jd-top { flex:none; display:flex; align-items:center; gap:10px; }
  .jd-card { padding:4px 16px; background:#fff; border:5px solid #111; border-radius:16px; box-shadow:0 5px 0 #111; font:inherit; color:#111; font-size:clamp(1.8rem, 8vw, 2.8rem);
    line-height:1.05; cursor:pointer; touch-action:manipulation; display:flex; align-items:center; gap:6px; white-space:nowrap; }
  .jd-card .spk { font-size:.45em; }
  .jd-card.next { animation:jd-next .35s cubic-bezier(.2,1.8,.4,1); }
  .jd-pips { display:flex; flex-direction:column; gap:4px; }
  .jd-row { display:flex; gap:3px; }
  .jd-pip { width:26px; height:26px; border:3px solid #111; border-radius:50%; background:#fff; display:flex; align-items:center; justify-content:center; font-size:14px; line-height:1; transition:all .25s; }
  .jd-pip.off { filter:grayscale(1); opacity:.35; }
  .jd-pip.hurt { background:#ffc4c4; filter:grayscale(1); opacity:.6; }
  .jd-view { position:relative; flex:1; min-height:0; width:100%; max-width:760px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111;
    background:radial-gradient(ellipse at 50% 58%, #4a3a86 0, #271c58 48%, #120d33 100%); touch-action:manipulation; }
  .jd-floor { position:absolute; left:50%; top:50%; width:calc(var(--u) * 5.4); height:calc(var(--u) * 2.2); margin:calc(var(--u) * .78) 0 0 calc(var(--u) * -2.7); border-radius:50%;
    background:radial-gradient(ellipse, rgba(140,110,255,.5), rgba(140,110,255,0) 70%); pointer-events:none; }
  .jd-star { position:absolute; width:3px; height:3px; border-radius:50%; background:#fff; opacity:.7; animation:jd-tw 2s ease-in-out infinite alternate; pointer-events:none; }
  .jd-world, .jd-fx { position:absolute; inset:0; pointer-events:none; }
  .jd-fx { z-index:80; overflow:hidden; }
  .jd-world > * { position:absolute; }
  /* The knight (all sizes from --u). The box is centred on the stage by JS. */
  .jd-k { width:calc(var(--u) * 1.5); height:calc(var(--u) * 2.05); left:0; top:0; z-index:5; --robe:linear-gradient(90deg, #8d6a45, #b48a5c 50%, #8d6a45); }
  .jd-in { position:absolute; inset:0; transform-origin:50% 92%; }
  .jd-in > * { position:absolute; box-sizing:border-box; }
  .jd-rb { left:12%; width:76%; top:36%; bottom:3%; background:var(--robe); border:4px solid #111; border-radius:38% 38% 10% 10% / 22% 22% 6% 6%; }
  .jd-bt { left:12%; width:76%; top:66%; height:7%; background:#3a2a1a; border:3px solid #111; z-index:1; }
  .jd-bk { left:44%; width:12%; top:64.5%; height:10%; background:#ffd400; border:3px solid #111; border-radius:20%; z-index:2; }
  .jd-ft { bottom:-1%; width:24%; height:8%; background:#3a2a1a; border:3px solid #111; border-radius:50%; z-index:0; }
  .jd-ft.a { left:22%; } .jd-ft.b { right:22%; }
  .jd-hd { left:17%; width:66%; top:2%; height:46%; background:linear-gradient(90deg, #9a7650, #c29a68 50%, #9a7650); border:4px solid #111; border-radius:50% 50% 44% 44%; z-index:3; }
  .jd-hd::before { content:""; position:absolute; left:26%; top:-24%; width:48%; aspect-ratio:1; background:linear-gradient(135deg, #c29a68, #9a7650); border:4px solid #111; border-right:0; border-bottom:0; rotate:45deg; border-radius:14% 0 0 0; z-index:-1; }
  .jd-fc { position:absolute; left:11%; right:11%; top:20%; bottom:8%; background:radial-gradient(ellipse at 50% 40%, #3b2850, #170f24); border-radius:48%; }
  .jd-ey { position:absolute; top:26%; width:34%; aspect-ratio:1; background:#fff; border:3px solid #111; border-radius:50%; overflow:hidden; z-index:2; }
  .jd-ey.a { left:12%; } .jd-ey.b { right:12%; width:28%; top:32%; }
  .jd-ey i { position:absolute; left:26%; top:28%; width:48%; aspect-ratio:1; background:#111; border-radius:50%; animation:jd-look 1.3s ease-in-out infinite alternate; transition:scale .2s; }
  .jd-mo { position:absolute; left:34%; width:32%; bottom:16%; height:12%; border:3px solid #111; background:#7a2a3a; border-radius:20% 20% 60% 60%; z-index:2; transition:all .15s; }
  .jd-k.ch .jd-mo { height:22%; bottom:12%; background:#fff; }
  .jd-k.sc .jd-mo { left:41%; width:18%; height:24%; border-radius:50%; bottom:10%; }
  .jd-k.sc .jd-ey i { scale:.4; animation:jd-shiv .09s linear infinite alternate; }
  .jd-k.sc .jd-ey { scale:1.18; }
  .jd-k.lk .jd-ey i { animation:none; translate:0 -34%; }
  .jd-k.sk .jd-ey i, .jd-k.co .jd-ey i { animation:jd-spin .5s linear infinite; }
  .jd-k.co .jd-mo { height:22%; border-radius:50%; }
  .jd-sw { position:absolute; left:50%; top:46%; width:0; height:0; z-index:6; rotate:-52deg; transition:rotate .26s cubic-bezier(.3,1.5,.5,1); }
  .jd-ar { position:absolute; left:0; top:calc(var(--u) * -.11); width:calc(var(--u) * .5); height:calc(var(--u) * .22); background:var(--robe); border:4px solid #111; border-radius:40%; }
  .jd-hn { position:absolute; left:calc(var(--u) * .43); top:calc(var(--u) * -.08); width:calc(var(--u) * .16); height:calc(var(--u) * .16); background:#e8b88c; border:3px solid #111; border-radius:50%; z-index:2; }
  .jd-hilt { position:absolute; left:calc(var(--u) * .45); top:calc(var(--u) * -.07); width:calc(var(--u) * .3); height:calc(var(--u) * .14); background:linear-gradient(180deg, #e3e8f2, #8993a8); border:3px solid #111; border-radius:20%; z-index:3; }
  .jd-bl, .jd-tbl { position:absolute; left:calc(var(--u) * .72); top:calc(var(--u) * -.08); width:calc(var(--u) * 1.2); height:calc(var(--u) * .16); border-radius:99px; transform-origin:0 50%; z-index:3;
    background:linear-gradient(180deg, #8ff 0, #fff 40% 60%, #8ff); box-shadow:0 0 10px 3px #3ee7ff, 0 0 26px 8px rgba(60,200,255,.55); animation:jd-on .35s cubic-bezier(.2,1.6,.4,1) both, jd-hum .12s linear .4s infinite alternate; }
  .jd-sw.off .jd-bl { display:none; }
  .jd-sw.swing { animation:jd-swing .4s ease-in-out; }
  .jd-k.sk .jd-in { animation:jd-zap .06s linear infinite alternate; filter:brightness(1.8) saturate(.4); }
  .jd-k.burn1 .jd-rb, .jd-k.burn1 .jd-hd { filter:brightness(.8) sepia(.3); }
  .jd-k.burn2 .jd-rb, .jd-k.burn2 .jd-hd { filter:brightness(.6) sepia(.5); }
  .jd-k.ch .jd-in { animation:jd-hop .4s ease-in-out infinite alternate; }
  .jd-k.co .jd-in { transition:rotate .5s cubic-bezier(.6,0,1,.6), translate .5s; rotate:90deg; translate:8% 3%; filter:brightness(.55); }
  .jd-k.co .jd-sw { display:none; }
  .jd-sweat { position:absolute; right:6%; top:6%; font-size:calc(var(--u) * .4); display:none; z-index:7; animation:jd-hop .25s ease-in-out infinite alternate; }
  .jd-k.sc .jd-sweat { display:block; }
  /* The droids: round flying robots with a big googly eye, a propeller and an answer plate */
  .jd-en { width:calc(var(--u) * 1.3); height:calc(var(--u) * 1.3); left:0; top:0; padding:0; border:0; background:none; font:inherit; cursor:pointer; touch-action:manipulation; pointer-events:none; will-change:transform; }
  .jd-en.live { pointer-events:auto; }
  .jd-en .in { position:absolute; inset:0; animation:jd-hover .8s ease-in-out infinite alternate; }
  .jd-en.pop .in { animation:jd-pop .55s cubic-bezier(.2,1.8,.4,1) both, jd-hover .8s ease-in-out .55s infinite alternate; }
  .jd-en .in > * { position:absolute; box-sizing:border-box; }
  .jd-en .pr { left:24%; width:52%; top:-4%; height:9%; background:#d6dbe8; border:3px solid #111; border-radius:50%; animation:jd-prop .08s linear infinite alternate; }
  .jd-en .an { left:49%; width:3%; top:2%; height:12%; background:#111; z-index:0; }
  .jd-en .bd { left:6%; right:6%; top:10%; bottom:2%; border:4px solid #111; border-radius:50%; background:radial-gradient(ellipse at 36% 22%, rgba(255,255,255,.6), transparent 44%), var(--ec); box-shadow:inset -6px -8px 0 rgba(0,0,0,.2); }
  .jd-en .ey { left:28%; top:15%; width:44%; aspect-ratio:1; background:#fff; border:3px solid #111; border-radius:50%; overflow:hidden; z-index:2; }
  .jd-en .ey i { position:absolute; left:30%; top:30%; width:42%; aspect-ratio:1; background:#111; border-radius:50%; translate:var(--px) var(--py); }
  .jd-en .pl { left:12%; right:12%; top:55%; height:30%; background:#fff; border:3px solid #111; border-radius:16%; display:flex; align-items:center; justify-content:center; color:#111; line-height:1; white-space:nowrap; z-index:3; }
  .jd-en .gn { left:40%; width:20%; bottom:-6%; height:12%; background:#555; border:3px solid #111; border-radius:30%; z-index:0; }
  .jd-en.tgt::after { content:""; position:absolute; inset:-8%; border:4px dashed #ffe14d; border-radius:50%; animation:jd-spinr 1.2s linear infinite; }
  .jd-en.chg .bd { background:radial-gradient(circle at 50% 50%, #fff, #ff5a5a 50%), var(--ec); }
  .jd-en.chg .gn { background:#ff3b4a; box-shadow:0 0 12px 5px #ff3b4a; }
  .jd-en.flip .pl { animation:jd-flip .35s ease-out; }
  .jd-en.bad { filter:grayscale(1); opacity:.55; }
  .jd-en.right .bd { box-shadow:inset -6px -8px 0 rgba(0,0,0,.2), 0 0 0 6px #fff, 0 0 0 12px #00d27a; }
  .jd-half { pointer-events:none; }
  /* Effects */
  .jd-word { position:absolute; transform:translate(-50%, -50%) rotate(-7deg); font-size:2.1rem; color:#fff; -webkit-text-stroke:2px #111; paint-order:stroke fill;
    text-shadow:0 4px 0 #111; white-space:nowrap; animation:jd-word 1.1s ease-out forwards; }
  .jd-word.bad { color:#ff5a6e; } .jd-word.big { font-size:2.8rem; color:#ffd400; }
  .jd-p { position:absolute; border-radius:50%; }
  .jd-boom { position:absolute; transform:translate(-50%, -50%); }
  .jd-flash { position:absolute; inset:0; z-index:90; pointer-events:none; opacity:0; background:#fff; }
  .jd-bolt { position:absolute; left:0; top:0; width:calc(var(--u) * .5); height:calc(var(--u) * .09); border-radius:99px; transform-origin:0 50%; z-index:72;
    background:linear-gradient(90deg, var(--bc), #fff 50%, var(--bc)); box-shadow:0 0 9px 3px var(--bc); }
  .jd-zp { position:absolute; width:calc(var(--u) * .16); height:calc(var(--u) * .5); background:#ffe14d; clip-path:polygon(60% 0, 10% 55%, 45% 55%, 25% 100%, 95% 40%, 55% 40%); z-index:60; animation:jd-zp .12s linear infinite alternate; }
  .jd-smk { position:absolute; border-radius:50%; background:#6a6a78; border:3px solid #111; z-index:60; }
  .jd-tsw { position:absolute; left:0; top:0; width:calc(var(--u) * 1.9); height:calc(var(--u) * .2); margin:calc(var(--u) * -.1) 0 0 calc(var(--u) * -.95); z-index:82; }
  .jd-tsw .jd-hilt { left:calc(var(--u) * .45); top:calc(var(--u) * .03); }
  .jd-tsw .jd-tbl { left:calc(var(--u) * .74); top:calc(var(--u) * .02); width:calc(var(--u) * 1.1); animation:jd-hum .12s linear infinite alternate; }
  @keyframes jd-next { from { scale:.6; } }
  @keyframes jd-tw { to { opacity:.15; } }
  @keyframes jd-look { from { translate:-24% -10%; } to { translate:24% 12%; } }
  @keyframes jd-shiv { from { translate:-20% 0; } to { translate:20% 0; } }
  @keyframes jd-spin { from { transform:rotate(0) translateX(25%); } to { transform:rotate(360deg) translateX(25%); } }
  @keyframes jd-on { from { scale:0 1; } }
  @keyframes jd-hum { from { opacity:1; } to { opacity:.82; } }
  @keyframes jd-swing { 0%,100% { translate:0 0; } 50% { translate:0 -3px; } }
  @keyframes jd-zap { from { translate:-4% 0; } to { translate:4% 0; } }
  @keyframes jd-hop { from { translate:0 0; } to { translate:0 -6%; } }
  @keyframes jd-hover { to { translate:0 5%; } }
  @keyframes jd-pop { from { scale:0; rotate:-90deg; } }
  @keyframes jd-prop { from { scale:1 1; } to { scale:.6 1; } }
  @keyframes jd-spinr { to { rotate:360deg; } }
  @keyframes jd-flip { from { scale:1 0; } }
  @keyframes jd-zp { from { opacity:1; } to { opacity:.35; } }
  @keyframes jd-word { from { opacity:1; scale:.5; } 25% { scale:1.15; } 75% { opacity:1; } to { opacity:0; translate:0 -40px; } }
  @media (prefers-reduced-motion: reduce) { .jd-en .in, .jd-en .pr, .jd-star, .jd-k .jd-ey i, .jd-en.tgt::after, .jd-k.ch .jd-in { animation:none !important; } }
  `;
  function injectCss() { if (document.getElementById("jd-css")) return; const s = document.createElement("style"); s.id = "jd-css"; s.textContent = CSS; document.head.appendChild(s); }

  const STAR = (() => { const p = []; for (let i = 0; i < 26; i++) { const r = i % 2 ? 0.64 : 1, a = (i / 26) * Math.PI * 2; p.push(`${(50 + Math.cos(a) * 50 * r).toFixed(1)}% ${(50 + Math.sin(a) * 50 * r).toFixed(1)}%`); } return `polygon(${p.join(",")})`; })();
  const COLORS = ["#6ad06a", "#b36bff", "#ff9a45", "#3ec9d6", "#ff6b9a", "#ffd23f"];
  const SLOT_DEG = [-90, -18, 54, 126, 198];   // top, upper right, lower right, lower left, upper left

  registerMicrogame({
    id: "beam-knight",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 20000,   // the clock only really runs while droids pop in (it waits while you choose)
    input: "tap",
    tutorial: true,

    start(ctx) {
      injectCss();
      const speed = ctx.speed || 1, pace = 0.75 + 0.25 * speed;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const { tone, sweep, noise } = ctx.sfx;
      const S = ctx.choiceSteps(7, 5, { lowercase: true });   // 5 right + at most 2 wrong (the 3rd wrong ends it)
      let si = 0, st = S[0];

      // ---------- DOM ----------
      const wrap = document.createElement("div");
      wrap.className = "jd";
      const top = document.createElement("div");
      top.className = "jd-top";
      const card = document.createElement("button");
      card.className = "jd-card";
      card.setAttribute("aria-label", TEXT.cardLabel);
      card.innerHTML = '<span class="ct"></span>';
      card.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });
      const pips = document.createElement("div");
      pips.className = "jd-pips";
      pips.innerHTML = '<div class="jd-row d">' + "<span class=\"jd-pip\">🤖</span>".repeat(5) + '</div><div class="jd-row h">' + "<span class=\"jd-pip\">❤️</span>".repeat(3) + "</div>";
      top.append(card, pips);
      const view = document.createElement("div");
      view.className = "jd-view";
      view.innerHTML = '<div class="jd-floor"></div><div class="jd-world"></div><div class="jd-fx"></div><div class="jd-flash"></div>';
      for (let i = 0; i < 22; i++) { const s = document.createElement("i"); s.className = "jd-star"; s.style.cssText = `left:${Math.random() * 100}%;top:${Math.random() * 100}%;animation-delay:${-Math.random() * 2}s;`; view.prepend(s); }
      wrap.append(top, view);
      ctx.root.appendChild(wrap);
      const world = view.querySelector(".jd-world"), fx = view.querySelector(".jd-fx"), flashEl = view.querySelector(".jd-flash");
      const dPips = [...pips.querySelectorAll(".d .jd-pip")], hPips = [...pips.querySelectorAll(".h .jd-pip")];

      // ---------- Layout ----------
      let W = 0, H = 0, u = 80, CX = 0, CY = 0, RX = 0, RY = 0;
      function layout() {
        W = view.clientWidth; H = view.clientHeight;
        u = Math.max(46, Math.min(H * 0.2, W * 0.13, 100));
        CX = W / 2; CY = H * 0.54; RX = W * 0.36; RY = H * 0.37;
        view.style.setProperty("--u", `${u}px`);
        knight.style.transform = `translate(${CX - u * 0.75}px, ${CY - u * 1.0}px)`;
        EN.forEach((e) => { const p = slotPos(e.slot); e.x = p.x; e.y = p.y; place(e); });
      }
      const slotPos = (i) => { const a = SLOT_DEG[i] * Math.PI / 180; return { x: CX + Math.cos(a) * RX, y: CY + Math.sin(a) * RY * (i === 0 ? 0.95 : 1) }; };
      const SHX = () => CX, SHY = () => CY - u * 0.08;   // the sword shoulder
      const place = (e) => { e.el.style.transform = `translate(${(e.x - u * 0.65).toFixed(1)}px, ${(e.y - u * 0.65).toFixed(1)}px)`; };

      // ---------- The knight ----------
      const knight = document.createElement("div");
      knight.className = "jd-k";
      knight.innerHTML = '<div class="jd-in"><i class="jd-ft a"></i><i class="jd-ft b"></i><i class="jd-rb"></i><i class="jd-bt"></i><i class="jd-bk"></i>' +
        '<div class="jd-hd"><div class="jd-fc"></div><div class="jd-ey a"><i></i></div><div class="jd-ey b"><i></i></div><i class="jd-mo"></i></div>' +
        '<div class="jd-sw"><i class="jd-ar"></i><i class="jd-hilt"></i><i class="jd-bl"></i><i class="jd-hn"></i></div></div><span class="jd-sweat">💧</span>';
      world.appendChild(knight);
      const swordEl = knight.querySelector(".jd-sw");
      const inEl = knight.querySelector(".jd-in");
      let restDeg = -52;
      const aim = (deg) => { swordEl.style.rotate = `${deg}deg`; };
      const angleTo = (x, y) => Math.atan2(y - SHY(), x - SHX()) * 57.2958;
      const bladeTip = (deg, r) => ({ x: SHX() + Math.cos(deg / 57.2958) * u * r, y: SHY() + Math.sin(deg / 57.2958) * u * r });
      const kmood = (m) => { ["ch", "sc", "sk", "co", "lk"].forEach((c) => knight.classList.remove(c)); if (m) knight.classList.add(m); };
      // the sword arm sits inside .jd-in, which is 1.5u wide: its pivot (left 50%, top 46%) is the shoulder
      aim(restDeg);

      // ---------- State ----------
      let phase = "intro";   // intro, choose, approach, event, final
      let hits = 0, misses = 0, done = false, chosen = null, EN = [], finalWon = false, heldFor = 0, holdUntil = 0, rightDroid = null;

      // ---------- Helpers ----------
      function word(text, bad, x, y, big) {
        const w = document.createElement("div");
        w.className = "jd-word" + (bad ? " bad" : "") + (big ? " big" : "");
        w.textContent = text;
        w.style.left = `${Math.max(80, Math.min(W - 80, x))}px`; w.style.top = `${Math.max(30, Math.min(H - 30, y))}px`;
        fx.appendChild(w);
        ctx.later(() => w.remove(), 1100);
      }
      function burst(x, y, cols, n, dist, size, ms) {
        const ps = [];
        for (let i = 0; i < n; i++) {
          const p = document.createElement("div");
          p.className = "jd-p"; p.style.cssText = `left:${x}px;top:${y}px;width:${size}px;height:${size}px;background:${cols[i % cols.length]};`;
          fx.appendChild(p); ps.push(p);
          if (reduce) continue;
          const a = Math.random() * 6.283, d = dist * (0.45 + Math.random() * 0.75);
          p.animate([{ transform: "translate(-50%,-50%) scale(1)", opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d}px)) scale(.2)`, opacity: 0 }],
            { duration: ms * (0.7 + Math.random() * 0.6), easing: "cubic-bezier(.1,.7,.3,1)", fill: "forwards" });
        }
        ctx.later(() => ps.forEach((p) => p.remove()), ms * 1.5);
      }
      function smoke(x, y, n) {
        for (let i = 0; i < n; i++) {
          const p = document.createElement("div");
          const sz = u * 0.2 * (0.8 + Math.random() * 0.5);
          p.className = "jd-smk"; p.style.cssText = `left:${x + (Math.random() - 0.5) * u * 0.5}px;top:${y}px;width:${sz}px;height:${sz}px;`;
          fx.appendChild(p);
          if (!reduce) p.animate([{ transform: "translate(-50%,-50%) scale(.4)", opacity: 0.9 }, { transform: `translate(calc(-50% + ${(Math.random() - 0.5) * u * 0.6}px), calc(-50% - ${u * (0.9 + Math.random() * 0.8)}px)) scale(1.6)`, opacity: 0 }],
            { duration: 1400 + Math.random() * 600, delay: i * 120, easing: "ease-out", fill: "both" });
          ctx.later(() => p.remove(), 2200 + i * 120);
        }
      }
      function boom(x, y, size) {
        const mk = (sz, bg, delay, rot) => {
          const b = document.createElement("div");
          b.className = "jd-boom"; b.style.cssText = `left:${x}px;top:${y}px;width:${sz}px;height:${sz}px;background:${bg};clip-path:${STAR};`;
          fx.appendChild(b);
          if (!reduce) b.animate([{ transform: "translate(-50%,-50%) scale(.1) rotate(0)", opacity: 1 }, { transform: `translate(-50%,-50%) scale(1) rotate(${rot}deg)`, opacity: 1, offset: 0.35 }, { transform: `translate(-50%,-50%) scale(1.15) rotate(${rot * 1.4}deg)`, opacity: 0 }],
            { duration: 700, delay, easing: "ease-out", fill: "both" });
          ctx.later(() => b.remove(), 900 + delay);
        };
        mk(size, "radial-gradient(circle, #fff 0 14%, #ffe14d 16% 34%, #ff8a1f 36% 60%, #e0331f 62%)", 0, 40);
        mk(size * 0.62, "radial-gradient(circle, #fff 0 24%, #ffe14d 26%)", 70, -50);
        burst(x, y, ["#ffe14d", "#ff8a1f", "#e0331f", "#9ff"], 14, size * 0.9, Math.max(8, size * 0.09), 800);
        noise(0.5, "lowpass", 1600, 120, 0.5); tone(70, 0.4, "square", 0.13); sweep(220, 40, 0.5, "sawtooth", 0.1);
      }
      function flash(color, ms) {
        flashEl.style.background = color;
        if (!reduce) flashEl.animate([{ opacity: 0.9 }, { opacity: 0 }], { duration: ms, easing: "ease-out" });
      }
      function shake(ms, amt) {
        if (reduce) return;
        const a = amt || 7;
        view.animate([{ translate: "0 0" }, { translate: `${-a}px ${a * 0.6}px` }, { translate: `${a}px ${-a * 0.6}px` }, { translate: `${-a * 0.6}px ${-a * 0.4}px` }, { translate: "0 0" }], { duration: ms });
      }
      function bolt(x1, y1, x2, y2, color, ms, onLand) {
        const b = document.createElement("div");
        b.className = "jd-bolt"; b.style.setProperty("--bc", color);
        const a = Math.atan2(y2 - y1, x2 - x1) * 57.2958;
        const tf = (x, y) => `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${a.toFixed(1)}deg)`;
        b.style.transform = tf(x1, y1);
        fx.appendChild(b);
        if (!reduce) b.animate([{ transform: tf(x1, y1) }, { transform: tf(x2, y2) }], { duration: ms, easing: "linear", fill: "forwards" });
        ctx.later(() => { b.remove(); if (onLand) onLand(); }, ms);
      }
      const killPip = (i) => dPips[i] && dPips[i].classList.add("off");

      // ---------- Droids ----------
      function mkDroid(slot) {
        const b = document.createElement("button");
        b.className = "jd-en pop";
        b.style.setProperty("--ec", COLORS[Math.floor(Math.random() * COLORS.length)]);
        b.innerHTML = '<div class="in"><i class="an"></i><i class="pr"></i><i class="gn"></i><i class="bd"></i><div class="ey"><i></i></div><div class="pl"></div></div>';
        const p = slotPos(slot);
        const dx = CX - p.x, dy = CY - p.y, len = Math.hypot(dx, dy) || 1;
        b.style.setProperty("--px", `${(dx / len * 28).toFixed(0)}%`); b.style.setProperty("--py", `${(dy / len * 28).toFixed(0)}%`);
        const e = { el: b, slot, x: p.x, y: p.y, o: null, dead: false };
        b.addEventListener("pointerdown", (ev) => { ev.preventDefault(); ev.stopPropagation(); pick(e); });
        world.appendChild(b); place(e);
        return e;
      }
      function setPlate(e, o) {
        e.o = o;
        e.el.setAttribute("aria-label", TEXT.droidLabel(o.spoken || o.text));
        const pl = e.el.querySelector(".pl");
        pl.textContent = o.text;
        const len = [...o.text].length;
        pl.style.fontSize = `calc(var(--u) * ${Math.min(0.32, 1.0 / (len * 0.62)).toFixed(3)})`;
        e.el.classList.remove("flip"); void e.el.offsetWidth; e.el.classList.add("flip");
      }
      const alive = () => EN.filter((e) => !e.dead);
      function killDroid(e) { e.dead = true; e.el.remove(); const k = EN.indexOf(e); killPip(k); }

      // ---------- The card and the round flow ----------
      function setCard() {
        card.firstChild.textContent = st.cardText;
        card.querySelector(".spk")?.remove();
        if (ctx.canSpeak && !st.listen) card.insertAdjacentHTML("beforeend", '<span class="spk">🔊</span>');
        card.classList.remove("next"); void card.offsetWidth; card.classList.add("next");
      }
      function replay() { if (!done) ctx.say(st.prompt); }
      function dealPlates() {
        const live = alive();
        const right = st.row.find((o) => o.right);
        const wrong = ctx.shuffle(st.row.filter((o) => !o.right)).slice(0, live.length - 1);
        const set = ctx.shuffle([right, ...wrong]);
        live.forEach((e, i) => { setPlate(e, set[i]); e.el.classList.remove("tgt", "chg", "bad", "right", "pop"); });
        rightDroid = live.find((e) => e.o.right);
      }
      function startRound(delay) {
        phase = "intro";
        ctx.later(() => {
          if (done) return;
          dealPlates();
          ctx.later(() => {
            if (done) return;
            phase = "choose";
            alive().forEach((e) => e.el.classList.add("live"));
            tone(659, 0.08, "triangle", 0.09); tone(880, 0.1, "triangle", 0.09, 0.09);
            ctx.say(st.prompt);
          }, 350 / pace);
        }, delay / pace);
      }
      function popAll() {
        // 5 droids pop out around the knight, one after another
        for (let i = 0; i < 5; i++) {
          ctx.later(() => { EN.push(mkDroid(i)); tone(500 + i * 120, 0.08, "triangle", 0.08); sweep(200, 700, 0.15, "sine", 0.05); }, i * 130 / pace);
        }
      }
      function nextRound() {
        if (done) return;
        si++; st = S[si];
        kmood(null); aim(restDeg);
        knight.classList.remove("sc");
        setCard();
        tone(98, 0.08, "square", 0.1); tone(147, 0.08, "square", 0.1, 0.16);
        startRound(450);
      }
      function pick(e) {
        if (phase !== "choose" || done || ctx.ended || e.dead) return;
        phase = "approach"; chosen = e;
        alive().forEach((q) => q.el.classList.remove("live"));
        e.el.classList.add("tgt");
        aim(angleTo(e.x, e.y));
        tone(880, 0.06, "square", 0.08); sweep(300, 900, 0.3, "sawtooth", 0.06);
        if (chosen.o.right && alive().length === 1) ctx.later(sliceLast, 420 / pace);
        else ctx.later(fire, 450 / pace);
      }

      // ---------- The right droid fires ----------
      function fire() {
        if (done || ctx.ended) return;
        phase = "event";
        const sh = rightDroid; sh.el.classList.add("chg");
        sweep(300, 1200, 0.35, "sawtooth", 0.06);
        ctx.later(() => {
          tone(420, 0.08, "square", 0.09); sweep(900, 250, 0.2, "sawtooth", 0.07);
          if (chosen === rightDroid) {
            // the sword is in the way: bounce it back
            const deg = angleTo(sh.x, sh.y), tip = bladeTip(deg, 1.2);
            bolt(sh.x, sh.y, tip.x, tip.y, "#ff3b4a", 330 / pace, () => deflect(sh, tip));
          } else {
            // the knight is swinging at the wrong droid: ZAP
            bolt(sh.x, sh.y, CX, CY - u * 0.2, "#ff3b4a", 360 / pace, () => zapped());
          }
        }, 450 / pace);
      }
      function deflect(sh, tip) {
        hits++;
        ctx.say(chosen.o.spoken || chosen.o.text);
        kmood("ch");
        word(TEXT.clang, false, tip.x, tip.y - u * 0.5);
        burst(tip.x, tip.y, ["#8ff", "#fff", "#ffe14d"], 12, u * 0.8, u * 0.08, 450);
        flash("#dffcff", 200);
        tone(1568, 0.1, "square", 0.1); tone(2093, 0.14, "triangle", 0.1, 0.05); noise(0.15, "highpass", 3000, 3000, 0.25);
        const vs = alive().filter((q) => q !== sh);
        const v = vs[Math.floor(Math.random() * vs.length)];
        ctx.later(() => {
          bolt(tip.x, tip.y, v.x, v.y, "#5ad2ff", 380 / pace, () => {
            boom(v.x, v.y, u * 2.2); shake(300, 6);
            word(TEXT.boom, false, v.x, v.y - u * 0.9, true);
            killDroid(v);
            sh.el.classList.remove("chg", "tgt");
          });
        }, 120);
        ctx.later(nextRound, 1900 / pace);
      }
      function zapped() {
        misses++;
        ctx.say(st.answer);
        const hp = hPips[misses - 1]; if (hp) hp.classList.add("hurt");
        flash("#ff3b30", 380); shake(450, 8);
        word(TEXT.zap, true, CX, CY - u * 1.3, true);
        burst(CX, CY - u * 0.2, ["#ffe14d", "#fff", "#8ff"], 16, u * 1.0, u * 0.09, 600);
        noise(0.3, "highpass", 1500, 600, 0.4); sweep(2200, 120, 0.4, "sawtooth", 0.1);
        sparks(1100);
        kmood("sk");
        rightDroid.el.classList.remove("chg"); chosen.el.classList.remove("tgt");
        if (misses >= 3) { ctx.later(collapse, 1100); return; }
        knight.classList.add("burn" + misses);
        ctx.later(() => { kmood("sc"); aim(restDeg); }, 1100);
        ctx.later(nextRound, 2100 / pace);
      }
      function sparks(ms) {
        const zs = [];
        for (let i = 0; i < 7; i++) {
          const z = document.createElement("div");
          z.className = "jd-zp";
          z.style.left = `${CX + (Math.random() - 0.5) * u * 1.6}px`; z.style.top = `${CY + (Math.random() - 0.5) * u * 1.8}px`;
          z.style.rotate = `${Math.random() * 360}deg`;
          fx.appendChild(z); zs.push(z);
        }
        ctx.later(() => zs.forEach((z) => z.remove()), ms);
      }

      // ---------- Last droid: sliced in half ----------
      function sliceLast() {
        if (done || ctx.ended) return;
        phase = "event"; done = true; ctx.freezeTimer();
        const e = chosen, deg = angleTo(e.x, e.y);
        ctx.say(e.o.spoken || e.o.text);
        tone(300, 0.1, "sawtooth", 0.08); sweep(300, 1600, 0.3, "sawtooth", 0.08);
        const dx = (e.x - CX) * 0.62, dy = (e.y - CY) * 0.62;
        if (!reduce) knight.animate([{ translate: "0 0" }, { translate: `${dx}px ${dy}px`, offset: 0.5 }, { translate: `${dx}px ${dy}px`, offset: 0.7 }, { translate: "0 0" }], { duration: 750, easing: "ease-in-out" });
        ctx.later(() => {
          noise(0.3, "bandpass", 2000, 4000, 0.3); tone(1900, 0.1, "square", 0.1);
          flash("#fff", 260); shake(380, 8);
          word(TEXT.slice, false, e.x, e.y - u * 0.9, true);
          // two halves fall apart
          const ang = (deg + 90 + 180) % 180;
          [0, 1].forEach((s) => {
            const h = e.el.cloneNode(true); h.classList.add("jd-half"); h.classList.remove("tgt", "live");
            h.style.clipPath = s ? "polygon(0 0, 100% 0, 100% 50%, 0 50%)" : "polygon(0 50%, 100% 50%, 100% 100%, 0 100%)";
            h.style.rotate = "0deg";
            world.appendChild(h);
            if (!reduce) h.animate([{ translate: "0 0", rotate: "0deg", opacity: 1 }, { translate: `${(s ? 1 : -1) * u * 0.5}px ${u * (s ? -0.15 : 0.35)}px`, rotate: `${(s ? 1 : -1) * 25}deg`, opacity: 1, offset: 0.6 }, { translate: `${(s ? 1 : -1) * u * 0.7}px ${u * 1.2}px`, rotate: `${(s ? 1 : -1) * 55}deg`, opacity: 0 }], { duration: 1100, easing: "ease-in", fill: "forwards" });
            ctx.later(() => h.remove(), 1200);
          });
          killDroid(e);
          boom(e.x, e.y, u * 1.8);
          hits++;
        }, 350);
        ctx.later(throwSword, 1500);
      }

      // ---------- Victory: throw the sword, watch it, look scared, SUDDEN END ----------
      function throwSword() {
        kmood("ch");
        sweep(300, 1300, 0.8, "triangle", 0.09);
        const hand = bladeTip(restDeg, 0.9);
        const sw = document.createElement("div");
        sw.className = "jd-tsw";
        sw.innerHTML = '<i class="jd-hilt"></i><i class="jd-tbl"></i>';
        fx.appendChild(sw);
        swordEl.classList.add("off");
        const topY = Math.max(u * 0.7, CY - u * 2.5), landY = CY - u * 1.25;
        const T = 6200;   // up 1.1 s, spins 1.5 s, then falls slowly for 3.6 s
        sw.style.transform = `translate(${hand.x}px, ${hand.y}px)`;
        const tf = (x, y, r) => `translate(${x}px, ${y}px) rotate(${r}deg)`;
        if (!reduce) sw.animate([
          { transform: tf(hand.x, hand.y, -52), easing: "cubic-bezier(.1,.7,.3,1)" },
          { transform: tf(CX, topY, 900), offset: 0.18, easing: "linear" },
          { transform: tf(CX, topY - u * 0.12, 1700), offset: 0.42, easing: "ease-in" },
          { transform: tf(CX, landY, 2500) },
        ], { duration: T, fill: "forwards" });
        else sw.style.transform = tf(CX, topY, 0);
        // he watches it go up
        ctx.later(() => { kmood("lk"); }, 500);
        ctx.later(() => sweep(500, 900, 1.2, "sine", 0.04), 1100);
        // ... and it starts coming down
        ctx.later(() => { kmood("sc"); word(TEXT.eek, true, CX + u * 0.9, CY - u * 1.9, true); tone(900, 0.2, "triangle", 0.1); tone(700, 0.3, "triangle", 0.1, 0.2); }, T * 0.42 + 300);
        // the game ends before it lands
        ctx.later(() => { if (!finalWon) { finalWon = true; ctx.win(); ctx.say(st.answer); } }, T - 950);
        phase = "final";
      }

      // ---------- Defeat ----------
      function collapse() {
        done = true; phase = "final"; ctx.freezeTimer();
        kmood("co");
        word(TEXT.oops, true, W * 0.5, H * 0.2, true);
        tone(300, 0.4, "triangle", 0.1); sweep(500, 80, 1.2, "sine", 0.1); noise(0.4, "lowpass", 800, 200, 0.3);
        ctx.later(() => { flash("#222", 300); smoke(CX + u * 0.2, CY + u * 0.4, 6); }, 600);
        ctx.later(() => smoke(CX + u * 0.2, CY + u * 0.2, 5), 1500);
        ctx.later(lose, 2600);
      }
      function lose() {
        if (finalWon || ctx.ended) return;
        ctx.lose();
        ctx.say(st.answer);
      }

      // ---------- The loop (keeps the clock still while you choose and while things happen) ----------
      function frame() {
        const now = performance.now();
        if ((phase === "choose" || phase === "approach" || phase === "event" || phase === "final") && !ctx.demo && !ctx.ended) {
          if (phase !== "choose" || heldFor < 25) {
            if (now >= holdUntil) { ctx.pauseTimer(300); holdUntil = now + 300; }
            if (phase === "choose") heldFor += 0.016;
          }
        }
        ctx.raf(frame);
      }

      // ---------- Go ----------
      ctx.onTimeout(() => {
        done = true;
        alive().forEach((e) => e.el.classList.add(e.o && e.o.right ? "right" : "bad"));
        kmood("sc");
        ctx.say(st.answer);
      });
      function onKey(e) {
        const live = alive(), i = parseInt(e.key, 10) - 1;
        if (i >= 0 && i < live.length) { e.preventDefault(); pick(live[i]); }
        else if (e.key === " ") { e.preventDefault(); replay(); }
      }
      document.addEventListener("keydown", onKey);

      layout();
      setCard();
      const ro = new ResizeObserver(layout);
      ro.observe(view);
      const revealMs = ctx.reveal(card) || 0;
      ctx.later(popAll, (300 + revealMs * pace) / pace);
      startRound(300 + revealMs * pace + 900);
      ctx.raf(frame);

      // Tutorial: point at the card, then tap the right droid, again and again.
      ctx.tutorial(S.map((s) => s.target), async (f) => {
        for (let n = 0; n < GOAL && !finalWon; n++) {
          await f.until(() => phase === "choose" && hits === n && alive().length > 0, 9000);
          await f.point(card, n ? 450 : 800);
          await f.tap(() => (alive().find((q) => q.o && q.o.right) || alive()[0] || { el: card }).el);
          await f.until(() => hits > n || finalWon, 5000);
        }
        await f.until(() => ctx.ended, 9000);
      });
      return () => { done = true; ro.disconnect(); document.removeEventListener("keydown", onKey); };
    },
  });
})();
