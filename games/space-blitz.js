// SPACE BLITZ — the teacher's idea: a Star Fox / space-battle take on Go-Kart Race. Your ship (your chosen character
// in the cockpit) flies through space; every few seconds 3 silly enemy ships glide in from the right, each wearing an
// answer plate. Tap one (`ctx.choiceSteps`: every wave has a NEW target on the card).
//   Right: 1st 🔫 your lasers blast it out of the way, 2nd 🛡️ the enemies close ranks, your shield goes up and you
//          burst through them, 3rd 🚀 a rocket explodes the whole fleet and you barrel-roll (= win).
//   Wrong: 1st ⚡ the enemy fires first and hits you, 2nd 💥 it crashes into you, 3rd 🎯 a missile hits: your ship
//          explodes and your character flies off into space (= lose).
(function () {
  const TEXT = {
    name: { en: "Space Blitz" },
    icon: "🛸",
    howTo: { en: {
      steps: [
        ["👀", "Look at the card."],
        ["🛸", "Three enemy ships fly in. Tap the ship that matches!"],
        ["🔫", "Right answers: lasers 🔫, a shield 🛡️, then a ROCKET 🚀 to win!"],
      ],
      tips: ["Wrong answers: the enemy shoots you ⚡, crashes into you 💥, then fires a missile 🎯!", "Take your time: space goes slow while you choose.", "Tap the card to hear it again."],
    } },
    instruction: { en: "BLAST THEM!" },
    cardLabel: "The card. Tap to hear it again.",
    shipLabel: (t) => `Enemy ship ${t}`,
    pew: "PEW PEW!", blast: "BLASTED!", shield: "SHIELD UP!", smash: "SMASH!", rocket: "ROCKET!", win: "YOU WIN!",
    hit: "OUCH!", crash: "CRASH!", missile: "MISSILE!", oops: "OH NO!", boom: "BOOM!", watch: "WATCH OUT!",
  };
  const GOAL = 3;

  const CSS = `
  .sbz { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:6px; padding-bottom:6px; }
  .sbz-top { flex:none; display:flex; align-items:center; gap:10px; }
  .sbz-card { padding:4px 16px; background:#fff; border:5px solid #111; border-radius:16px; box-shadow:0 5px 0 #111; font:inherit; color:#111; font-size:clamp(1.8rem, 8vw, 2.8rem);
    line-height:1.05; cursor:pointer; touch-action:manipulation; display:flex; align-items:center; gap:6px; white-space:nowrap; }
  .sbz-card .spk { font-size:.45em; }
  .sbz-card.next { animation:sbz-next .35s cubic-bezier(.2,1.8,.4,1); }
  .sbz-pips { display:flex; flex-direction:column; gap:4px; }
  .sbz-row { display:flex; gap:4px; }
  .sbz-pip { width:30px; height:30px; border:3px solid #111; border-radius:50%; background:#fff; display:flex; align-items:center; justify-content:center; font-size:17px; line-height:1;
    filter:grayscale(1); opacity:.45; transition:all .25s; }
  .sbz-pip.on { filter:none; opacity:1; scale:1.12; }
  .sbz-row.g .sbz-pip.on { background:#b8f5c8; } .sbz-row.b .sbz-pip.on { background:#ffc4c4; }
  .sbz-view { position:relative; flex:1; min-height:0; width:100%; max-width:760px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111;
    background:linear-gradient(180deg, #05061f 0%, #14104a 58%, #2b1670 100%); touch-action:manipulation; --bx:0px; }
  .sbz-bg { position:absolute; inset:0; background-repeat:repeat; pointer-events:none; }
  .sbz-neb { background-image:radial-gradient(ellipse 260px 120px at 120px 90px, rgba(160,80,255,.35), transparent 70%), radial-gradient(ellipse 300px 140px at 520px 260px, rgba(40,200,220,.28), transparent 70%);
    background-size:760px 100%; background-repeat:repeat-x; }
  .sbz-s1 { background-image:radial-gradient(1px 1px at 20px 30px, #cde, transparent), radial-gradient(1px 1px at 110px 90px, #fff, transparent), radial-gradient(1px 1px at 70px 150px, #dde, transparent), radial-gradient(1px 1px at 160px 40px, #cde, transparent);
    background-size:190px 180px; }
  .sbz-s2 { background-image:radial-gradient(1.6px 1.6px at 40px 60px, #fff, transparent), radial-gradient(1.6px 1.6px at 170px 120px, #ffe9a8, transparent), radial-gradient(1.4px 1.4px at 100px 20px, #fff, transparent);
    background-size:230px 200px; }
  .sbz-s3 { background-image:radial-gradient(2.4px 2.4px at 60px 70px, #fff, transparent), radial-gradient(2.2px 2.2px at 200px 150px, #aef, transparent);
    background-size:280px 230px; }
  .sbz-planet { position:absolute; border-radius:50%; pointer-events:none; }
  .sbz-planet.a { background:radial-gradient(circle at 32% 30%, #ffe2a8, #ec9a45 45%, #8e3f2b 80%); box-shadow:inset -14px -10px 0 rgba(0,0,0,.28); border:4px solid #111; }
  .sbz-planet.a::after { content:""; position:absolute; left:-34%; right:-34%; top:38%; height:24%; border:5px solid rgba(255,232,170,.85); border-radius:50%; rotate:-14deg; }
  .sbz-planet.b { background:radial-gradient(circle at 34% 30%, #bff3ff, #3aa5e6 50%, #1b3f9e 85%); box-shadow:inset -8px -6px 0 rgba(0,0,0,.28); border:3px solid #111; }
  .sbz-world, .sbz-fx { position:absolute; inset:0; pointer-events:none; }
  .sbz-fx { z-index:80; overflow:hidden; }
  .sbz-world > * { position:absolute; left:0; top:0; }
  /* The player's ship (top-down, pointing right). Positioned by a transform, so animations go on inner layers. */
  .sbz-k { width:var(--sw); height:var(--sh); will-change:transform; }
  .sbz-in { position:absolute; inset:0; transform-origin:50% 50%; }
  .sbz-roll, .sbz-bank { position:absolute; inset:0; transform-origin:50% 50%; }
  .sbz-roll > * { position:absolute; box-sizing:border-box; }
  .sbz-wg { left:14%; width:50%; height:50%; background:linear-gradient(90deg, #e63946 0 42%, #e6edff 42% 100%); filter:drop-shadow(0 0 1px #111) drop-shadow(0 0 1px #111) drop-shadow(0 0 1px #111); z-index:1; }
  .sbz-wg.t { top:0; clip-path:polygon(76% 100%, 44% 2%, 22% 8%, 30% 100%); }
  .sbz-wg.b { bottom:0; clip-path:polygon(76% 0, 44% 98%, 22% 92%, 30% 0); }
  .sbz-fu { left:8%; right:2%; top:35%; height:30%; background:linear-gradient(180deg, #fafcff, #aebcdc); border:4px solid #111; border-radius:20% 50% 50% 20% / 50%; z-index:2; box-shadow:inset 0 -5px 0 rgba(0,0,0,.12); }
  .sbz-nz { right:0; top:41%; width:17%; height:18%; background:#e63946; border:3px solid #111; border-radius:30% 100% 100% 30% / 50%; z-index:3; }
  .sbz-cn { width:10%; height:13%; background:#8a93a6; border:3px solid #111; border-radius:30%; z-index:3; left:34%; }
  .sbz-cn.t { top:-1%; } .sbz-cn.b { bottom:-1%; }
  .sbz-eng { left:2%; width:12%; height:13%; background:#8a93a6; border:3px solid #111; border-radius:20%; z-index:3; }
  .sbz-eng.t { top:35%; } .sbz-eng.b { top:52%; }
  .sbz-fl { right:100%; margin-right:-4%; width:30%; height:11%; z-index:0; transform-origin:100% 50%; clip-path:polygon(100% 0, 0 50%, 100% 100%); animation:sbz-flame .09s linear infinite alternate;
    background:linear-gradient(270deg, #fff 0, #ffe14d 26%, #ff8a1f 60%, rgba(255,60,30,0)); transition:width .2s; left:auto; }
  .sbz-fl.t { top:36%; } .sbz-fl.b { top:53%; }
  .sbz-fl { right:auto; left:-26%; margin:0; }
  .sbz-k.boost .sbz-fl { width:56%; left:-52%; }
  .sbz-dr { left:calc(38% + var(--dz) * .125); top:50%; width:var(--dz); height:var(--dz); margin-top:calc(var(--dz) * -.5); z-index:3; position:absolute; }
  .sbz-gl { position:absolute; left:38%; top:50%; width:calc(var(--dz) * 1.25); height:calc(var(--dz) * 1.25); margin-top:calc(var(--dz) * -.625); border-radius:50%; border:3px solid #111; z-index:4; pointer-events:none;
    background:radial-gradient(circle at 34% 26%, rgba(255,255,255,.9) 0 10%, rgba(140,225,255,.3) 38%, rgba(70,160,255,.28)); }
  .sbz-sh { position:absolute; left:-8%; right:-10%; top:-20%; bottom:-20%; border-radius:50%; border:4px solid #8ff; z-index:5; pointer-events:none; opacity:0; scale:.4; transition:opacity .25s, scale .3s cubic-bezier(.3,1.7,.5,1);
    background:radial-gradient(ellipse, rgba(120,255,255,.06) 52%, rgba(120,255,255,.6)); box-shadow:0 0 22px 6px rgba(120,255,255,.7); }
  .sbz-k.shield .sbz-sh { opacity:1; scale:1; animation:sbz-pulse .35s ease-in-out infinite alternate; }
  .sbz-k.roll .sbz-roll { animation:sbz-roll 1.4s ease-in-out both; }
  .sbz-k.roll .sbz-in { animation:sbz-lift 1.4s ease-in-out both; }
  .sbz-k.spin .sbz-in { animation:sbz-spin 1.1s ease-in-out both; }
  .sbz-k.zapped .sbz-in { animation:sbz-zap .06s linear infinite alternate; }
  .sbz-k.dmg .sbz-roll { filter:brightness(.78) sepia(.25); }
  .sbz-k.dz .ms-eye i { animation:sbz-dizzy .4s linear infinite; }
  /* Enemy ships: silly googly-eyed alien ships, facing left, with the answer on a plate across the hull */
  .sbz-en { width:var(--ew); height:var(--eh); padding:0; border:0; background:none; font:inherit; cursor:pointer; touch-action:manipulation; pointer-events:none; will-change:transform; }
  .sbz-en.live { pointer-events:auto; }
  .sbz-en .in { position:absolute; inset:0; animation:sbz-hover .8s ease-in-out infinite alternate; }
  .sbz-en .in > * { position:absolute; box-sizing:border-box; }
  .sbz-en .sw { left:34%; width:36%; height:34%; background:var(--ed); z-index:0; filter:drop-shadow(0 0 1px #111) drop-shadow(0 0 1px #111) drop-shadow(0 0 1px #111); }
  .sbz-en .sw.t { top:-20%; clip-path:polygon(0 100%, 55% 0, 100% 0, 100% 100%); } .sbz-en .sw.b { bottom:-20%; clip-path:polygon(0 0, 100% 0, 100% 100%, 55% 100%); }
  .sbz-en .hl { left:5%; right:9%; top:12%; bottom:12%; border:4px solid #111; border-radius:48% / 50%; z-index:1; box-shadow:inset -5px -6px 0 rgba(0,0,0,.2);
    background:radial-gradient(ellipse at 38% 22%, rgba(255,255,255,.55), transparent 46%), var(--ec); }
  .sbz-en .pl { left:27%; right:17%; top:27%; bottom:22%; background:#fff; border:3px solid #111; border-radius:14%; display:flex; align-items:center; justify-content:center; color:#111; line-height:1; white-space:nowrap; z-index:2; }
  .sbz-en .ey { top:-9%; width:21%; aspect-ratio:1; background:#fff; border:3px solid #111; border-radius:50%; overflow:hidden; z-index:3; }
  .sbz-en .ey.a { left:15%; } .sbz-en .ey.b { left:41%; width:16%; top:-3%; }
  .sbz-en .ey i { position:absolute; left:28%; top:30%; width:46%; aspect-ratio:1; background:#111; border-radius:50%; animation:sbz-roll2 1s ease-in-out infinite alternate; }
  .sbz-en .mo { left:-5%; top:40%; width:17%; height:32%; border:3px solid #111; border-radius:60% 20% 20% 60%; z-index:3; background:linear-gradient(180deg, #fff 0 24%, #5a0f1e 24% 76%, #fff 76%); }
  .sbz-en .hn { top:-5%; width:9%; height:24%; background:#f6f0cf; z-index:0; display:none; clip-path:polygon(50% 0, 100% 100%, 0 100%); filter:drop-shadow(0 0 1px #111) drop-shadow(0 0 1px #111); }
  .sbz-en .hn.a { left:62%; } .sbz-en .hn.b { left:74%; }
  .sbz-en .fl { left:92%; top:36%; width:22%; height:28%; z-index:0; clip-path:polygon(0 0, 100% 50%, 0 100%); animation:sbz-flame .09s linear infinite alternate; transform-origin:0 50%;
    background:linear-gradient(90deg, #fff 0, #ffe14d 26%, #ff8a1f 60%, rgba(255,60,30,0)); }
  .sbz-en.e2 .ey.b { display:none; } .sbz-en.e2 .ey.a { left:20%; width:30%; top:-14%; }
  .sbz-en.e3 .hn { display:block; }
  .sbz-en.mini .pl, .sbz-en.mini .mo { display:none; }
  .sbz-en.tgt::after { content:""; position:absolute; inset:-14% -10%; border:4px dashed #8ff; border-radius:50%; animation:sbz-spinr 1.2s linear infinite; filter:drop-shadow(0 0 4px #8ff); }
  .sbz-en.bad { filter:grayscale(1); opacity:.55; pointer-events:none; }
  .sbz-en.right .hl { box-shadow:inset -5px -6px 0 rgba(0,0,0,.2), 0 0 0 6px #fff, 0 0 0 12px #00d27a; }
  .sbz-en.rev .in { animation:sbz-rev .07s linear infinite alternate; }
  .sbz-en.hurt .hl { background:#ff5a5a; }
  /* Effects */
  .sbz-item { position:absolute; font-size:calc(var(--u) * .8); line-height:1; transform:translate(-50%, -50%); animation:sbz-item 1s ease-out forwards; filter:drop-shadow(0 4px 0 rgba(0,0,0,.4)); }
  .sbz-word { position:absolute; transform:translate(-50%, -50%) rotate(-7deg); font-size:2.1rem; color:#fff; -webkit-text-stroke:2px #111; paint-order:stroke fill;
    text-shadow:0 4px 0 #111; white-space:nowrap; animation:sbz-word 1.1s ease-out forwards; }
  .sbz-word.bad { color:#ff5a6e; } .sbz-word.big { font-size:2.8rem; color:#ffd400; }
  .sbz-p { position:absolute; border-radius:50%; }
  .sbz-boom { position:absolute; transform:translate(-50%, -50%); }
  .sbz-flash { position:absolute; inset:0; z-index:90; pointer-events:none; opacity:0; background:#fff; }
  .sbz-siren { position:absolute; inset:0; z-index:85; pointer-events:none; opacity:0; box-shadow:inset 0 0 90px 30px rgba(255,30,30,.8); }
  .sbz-siren.on { animation:sbz-siren .45s ease-in-out infinite alternate; }
  .sbz-sl { position:absolute; height:3px; border-radius:3px; background:rgba(255,255,255,.85); animation:sbz-sl .3s linear infinite; z-index:70; }
  .sbz-bolt { position:absolute; left:0; top:0; width:calc(var(--u) * .46); height:calc(var(--u) * .08); border-radius:99px; transform-origin:0 50%; z-index:72;
    background:linear-gradient(90deg, var(--bc), #fff 50%, var(--bc)); box-shadow:0 0 9px 3px var(--bc); }
  .sbz-ms { position:absolute; left:0; top:0; width:calc(var(--u) * .86); height:calc(var(--u) * .3); z-index:75; }
  .sbz-ms .i { position:absolute; inset:0; }
  .sbz-ms.rev .i { rotate:180deg; }
  .sbz-ms .i > * { position:absolute; box-sizing:border-box; }
  .sbz-ms .bd { left:14%; right:16%; top:14%; bottom:14%; background:linear-gradient(180deg, #fff, #c9d1e0); border:3px solid #111; border-radius:30% / 50%; }
  .sbz-ms .bd::after { content:""; position:absolute; left:34%; width:16%; top:0; bottom:0; background:var(--mc); }
  .sbz-ms .nose { right:0; top:14%; width:20%; height:72%; background:var(--mc); border:3px solid #111; border-radius:20% 100% 100% 20% / 50%; }
  .sbz-ms .fin { left:14%; width:22%; height:100%; background:var(--mc); clip-path:polygon(0 0, 100% 36%, 100% 64%, 0 100%); }
  .sbz-ms .fl { right:86%; top:22%; width:34%; height:56%; clip-path:polygon(100% 0, 0 50%, 100% 100%); animation:sbz-flame .08s linear infinite alternate; transform-origin:100% 50%;
    background:linear-gradient(270deg, #fff, #ffe14d 30%, #ff5a1f 70%, rgba(255,60,30,0)); }
  .sbz-warn { position:absolute; font-size:calc(var(--u) * .55); transform:translate(-50%, -50%); z-index:84; animation:sbz-warn .22s ease-in-out infinite alternate; }
  .sbz-eject { position:absolute; left:0; top:0; width:var(--dz); height:var(--dz); z-index:88; }
  .sbz-deb { position:absolute; left:0; top:0; width:calc(var(--u) * .3); height:calc(var(--u) * .2); background:#c9d1e0; border:3px solid #111; z-index:86; clip-path:polygon(0 10%, 70% 0, 100% 60%, 30% 100%); }
  @keyframes sbz-next { from { scale:.6; } }
  @keyframes sbz-hover { to { translate:0 4%; } }
  @keyframes sbz-flame { from { scale:1 .75; } to { scale:1.2 1.1; } }
  @keyframes sbz-pulse { to { scale:1.06; } }
  @keyframes sbz-roll { 0%, 50%, 100% { scale:1 1; } 12.5%, 37.5%, 62.5%, 87.5% { scale:1 .08; } 25%, 75% { scale:1 -1; } }
  @keyframes sbz-lift { 0%, 100% { translate:0 0; } 50% { translate:0 -6%; } }
  @keyframes sbz-spin { 0% { rotate:0deg; translate:0 0; } 45% { rotate:360deg; translate:-10% -22%; } 100% { rotate:720deg; translate:0 0; } }
  @keyframes sbz-zap { from { translate:-3% 0; } to { translate:3% 0; } }
  @keyframes sbz-rev { from { translate:-2% -1%; } to { translate:2% 1%; } }
  @keyframes sbz-dizzy { from { transform:rotate(0) translateX(25%); } to { transform:rotate(360deg) translateX(25%); } }
  @keyframes sbz-roll2 { from { transform:translate(-25%, -15%); } to { transform:translate(25%, 15%); } }
  @keyframes sbz-spinr { to { rotate:360deg; } }
  @keyframes sbz-item { 0% { scale:0; opacity:0; } 22% { scale:1.4; opacity:1; } 45% { scale:1; } 80% { opacity:1; } 100% { translate:0 -50%; opacity:0; } }
  @keyframes sbz-word { from { opacity:1; scale:.5; } 25% { scale:1.15; } 75% { opacity:1; } to { opacity:0; translate:0 -40px; } }
  @keyframes sbz-sl { from { translate:0 0; } to { translate:-140vw 0; } }
  @keyframes sbz-siren { to { opacity:1; } }
  @keyframes sbz-warn { from { scale:1; } to { scale:1.3; } }
  @media (prefers-reduced-motion: reduce) { .sbz-en .in, .sbz-en .ey i, .sbz-sl, .sbz-warn, .sbz-siren.on, .sbz-k.shield .sbz-sh, .sbz-en.tgt::after { animation:none !important; } }
  `;
  function injectCss() { if (document.getElementById("sbz-css")) return; const s = document.createElement("style"); s.id = "sbz-css"; s.textContent = CSS; document.head.appendChild(s); }

  const STAR = (() => { const p = []; for (let i = 0; i < 26; i++) { const r = i % 2 ? 0.64 : 1, a = (i / 26) * Math.PI * 2; p.push(`${(50 + Math.cos(a) * 50 * r).toFixed(1)}% ${(50 + Math.sin(a) * 50 * r).toFixed(1)}%`); } return `polygon(${p.join(",")})`; })();
  const COLORS = [["#6ad06a", "#3d9a3d"], ["#b36bff", "#7a3fc4"], ["#ff9a45", "#c4661f"], ["#3ec9d6", "#1f8f9c"], ["#ff6b9a", "#c43f6c"]];

  registerMicrogame({
    id: "space-blitz",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 18000,   // the clock only really runs while the next wave flies in (it waits while you choose)
    input: "tap",
    tutorial: true,

    start(ctx) {
      injectCss();
      const speed = ctx.speed || 1, pace = 0.75 + 0.25 * speed;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const { tone, sweep, noise } = ctx.sfx;
      const S = ctx.choiceSteps(5, 3, { lowercase: true });   // at most 5 waves: 3 right or 3 wrong ends it
      let si = 0, st = S[0];

      // ---------- DOM ----------
      const wrap = document.createElement("div");
      wrap.className = "sbz";
      const top = document.createElement("div");
      top.className = "sbz-top";
      const card = document.createElement("button");
      card.className = "sbz-card";
      card.setAttribute("aria-label", TEXT.cardLabel);
      card.innerHTML = '<span class="ct"></span>';
      card.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });
      const pips = document.createElement("div");
      pips.className = "sbz-pips";
      pips.innerHTML = '<div class="sbz-row g"><span class="sbz-pip">🔫</span><span class="sbz-pip">🛡️</span><span class="sbz-pip">🚀</span></div>' +
        '<div class="sbz-row b"><span class="sbz-pip">⚡</span><span class="sbz-pip">💥</span><span class="sbz-pip">🎯</span></div>';
      top.append(card, pips);
      const view = document.createElement("div");
      view.className = "sbz-view";
      view.innerHTML = '<div class="sbz-bg sbz-neb"></div><div class="sbz-bg sbz-s1"></div><div class="sbz-bg sbz-s2"></div><div class="sbz-planet a"></div><div class="sbz-planet b"></div><div class="sbz-bg sbz-s3"></div>' +
        '<div class="sbz-world"></div><div class="sbz-fx"></div><div class="sbz-flash"></div><div class="sbz-siren"></div>';
      wrap.append(top, view);
      ctx.root.appendChild(wrap);
      const world = view.querySelector(".sbz-world"), fx = view.querySelector(".sbz-fx"), flashEl = view.querySelector(".sbz-flash"), siren = view.querySelector(".sbz-siren");
      const layers = [[".sbz-neb", 0.03], [".sbz-s1", 0.08], [".sbz-s2", 0.2], [".sbz-s3", 0.5]].map(([q, f]) => [view.querySelector(q), f]);
      const planA = view.querySelector(".sbz-planet.a"), planB = view.querySelector(".sbz-planet.b");
      const pipEls = [...pips.querySelectorAll(".sbz-pip")];

      // ---------- Layout ----------
      let W = 0, H = 0, u = 80, sw = 140, sh = 76, ew = 120, eh = 66;
      const LANES = [0.2, 0.5, 0.8];
      const laneY = (l) => H * LANES[l];
      function layout() {
        W = view.clientWidth; H = view.clientHeight;
        u = Math.max(50, Math.min(H * 0.21, W * 0.15, 112));
        sw = u * 1.75; sh = u * 0.95; ew = u * 1.5; eh = u * 0.82;
        const set = (k, v) => view.style.setProperty(k, `${v}px`);
        set("--u", u); set("--dz", u * 0.5); set("--sw", sw); set("--sh", sh); set("--ew", ew); set("--eh", eh);
        planA.style.cssText = `width:${H * 0.34}px;height:${H * 0.34}px;top:${H * 0.12}px;`;
        planB.style.cssText = `width:${H * 0.12}px;height:${H * 0.12}px;top:${H * 0.68}px;`;
      }
      const restX = () => W * 0.2;

      // ---------- The player's ship ----------
      const shipEl = document.createElement("div");
      shipEl.className = "sbz-k";
      shipEl.innerHTML = '<div class="sbz-in"><div class="sbz-bank"><div class="sbz-roll"><i class="sbz-fl t"></i><i class="sbz-fl b"></i><i class="sbz-wg t"></i><i class="sbz-wg b"></i>' +
        '<i class="sbz-cn t"></i><i class="sbz-cn b"></i><i class="sbz-eng t"></i><i class="sbz-eng b"></i><i class="sbz-fu"></i><i class="sbz-nz"></i></div>' +
        '<div class="sbz-dr"></div><i class="sbz-gl"></i></div><i class="sbz-sh"></i></div>';
      world.appendChild(shipEl);
      const mascot = window.Mascot ? window.Mascot.el("var(--dz)") : document.createElement("div");
      const drEl = shipEl.querySelector(".sbz-dr");
      drEl.appendChild(mascot);
      const inEl = shipEl.querySelector(".sbz-in"), bankEl = shipEl.querySelector(".sbz-bank");
      const P = { el: shipEl, x: 0, y: 0, tx: 0, rate: 4, lane: 1, sx: 0, sy: 0, dash: false, dead: false, dmg: 0 };
      const mood = (m) => { if (window.Mascot && window.Mascot.mood) window.Mascot.mood(mascot, m); };

      // ---------- State ----------
      let cam = 0, ts = 1, tsT = 1, camV = 1;
      let phase = "intro";   // intro, cruise, choose, approach, event, final
      let hits = 0, misses = 0, done = false, chosen = null, EN = [], finalWon = false, heldFor = 0, holdUntil = 0, ejected = false;

      // ---------- Helpers ----------
      function word(text, bad, x, y, big) {
        const w = document.createElement("div");
        w.className = "sbz-word" + (bad ? " bad" : "") + (big ? " big" : "");
        w.textContent = text;
        w.style.left = `${Math.max(80, Math.min(W - 80, x))}px`; w.style.top = `${Math.max(30, Math.min(H - 30, y))}px`;
        fx.appendChild(w);
        ctx.later(() => w.remove(), 1100);
      }
      function itemPop(emoji) {
        const e = document.createElement("div");
        e.className = "sbz-item"; e.textContent = emoji;
        e.style.left = `${P.sx}px`; e.style.top = `${Math.max(u * 0.5, P.sy - u * 0.95)}px`;
        fx.appendChild(e);
        ctx.later(() => e.remove(), 1050);
      }
      function burst(x, y, cols, n, dist, size, ms) {
        const ps = [];
        for (let i = 0; i < n; i++) {
          const p = document.createElement("div");
          p.className = "sbz-p"; p.style.cssText = `left:${x}px;top:${y}px;width:${size}px;height:${size}px;background:${cols[i % cols.length]};`;
          fx.appendChild(p); ps.push(p);
          if (reduce) continue;
          const a = Math.random() * 6.283, d = dist * (0.45 + Math.random() * 0.75);
          p.animate([{ transform: "translate(-50%,-50%) scale(1)", opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d}px)) scale(.2)`, opacity: 0 }],
            { duration: ms * (0.7 + Math.random() * 0.6), easing: "cubic-bezier(.1,.7,.3,1)", fill: "forwards" });
        }
        ctx.later(() => ps.forEach((p) => p.remove()), ms * 1.5);
      }
      function smoke(x, y, n, small) {
        const ps = [];
        for (let i = 0; i < n; i++) {
          const p = document.createElement("div");
          const sz = u * (small ? 0.14 : 0.22) * (0.8 + Math.random() * 0.5);
          p.className = "sbz-p"; p.style.cssText = `left:${x + (Math.random() - 0.5) * u * 0.5}px;top:${y}px;width:${sz}px;height:${sz}px;background:#6a6a78;border:3px solid #111;`;
          fx.appendChild(p); ps.push(p);
          if (!reduce) p.animate([{ transform: "translate(-50%,-50%) scale(.4)", opacity: 0.9 }, { transform: `translate(calc(-50% - ${u * (0.5 + Math.random() * 0.8)}px), calc(-50% - ${u * (0.1 + Math.random() * 0.4)}px)) scale(1.5)`, opacity: 0 }],
            { duration: 900 + Math.random() * 500, delay: i * 80, easing: "ease-out", fill: "both" });
        }
        ctx.later(() => ps.forEach((p) => p.remove()), 1800 + n * 80);
      }
      function boom(x, y, size) {
        const mk = (sz, bg, delay, rot) => {
          const b = document.createElement("div");
          b.className = "sbz-boom"; b.style.cssText = `left:${x}px;top:${y}px;width:${sz}px;height:${sz}px;background:${bg};clip-path:${STAR};`;
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
      function speedLines(ms) {
        const ls = [];
        for (let i = 0; i < 12; i++) {
          const l = document.createElement("div");
          l.className = "sbz-sl";
          l.style.cssText = `left:${W * (0.1 + Math.random() * 0.9)}px;top:${H * (0.06 + Math.random() * 0.88)}px;width:${W * (0.12 + Math.random() * 0.22)}px;animation-delay:${-Math.random() * 0.3}s;`;
          fx.appendChild(l); ls.push(l);
        }
        ctx.later(() => ls.forEach((l) => l.remove()), ms);
      }
      // A laser bolt from (x1,y1) to (x2,y2); `done` runs when it lands.
      function bolt(x1, y1, x2, y2, color, ms, onLand) {
        const b = document.createElement("div");
        b.className = "sbz-bolt"; b.style.setProperty("--bc", color);
        const a = Math.atan2(y2 - y1, x2 - x1) * 57.2958;
        const tf = (x, y) => `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${a.toFixed(1)}deg)`;
        b.style.transform = tf(x1, y1);
        fx.appendChild(b);
        if (!reduce) b.animate([{ transform: tf(x1, y1) }, { transform: tf(x2, y2) }], { duration: ms, easing: "linear", fill: "forwards" });
        ctx.later(() => { b.remove(); if (onLand) onLand(); }, ms);
      }
      // A missile (mine points right, an enemy's points left) with a smoke trail.
      function missile(x1, y1, x2, y2, ms, rev, color, onLand) {
        const m = document.createElement("div");
        m.className = "sbz-ms" + (rev ? " rev" : ""); m.style.setProperty("--mc", color);
        m.innerHTML = '<div class="i"><i class="fl"></i><i class="fin"></i><i class="bd"></i><i class="nose"></i></div>';
        const a = Math.atan2(y2 - y1, x2 - x1) * 57.2958 + (rev ? 180 : 0);
        const ox = u * 0.43, oy = u * 0.15;
        const tf = (x, y) => `translate(${(x - ox).toFixed(1)}px, ${(y - oy).toFixed(1)}px) rotate(${a.toFixed(1)}deg)`;
        m.style.transform = tf(x1, y1);
        fx.appendChild(m);
        if (!reduce) m.animate([{ transform: tf(x1, y1) }, { transform: tf(x2, y2) }], { duration: ms, easing: "cubic-bezier(.55,0,1,.8)", fill: "forwards" });
        const n = Math.floor(ms / 55);
        for (let i = 1; i < n; i++) {
          const k = Math.pow(i / n, 1.6);
          ctx.later(() => burst(x1 + (x2 - x1) * k, y1 + (y2 - y1) * k, ["#fff", "#cfd6e6", "#ffb35a"], 1, u * 0.25, u * 0.14, 500), i * 55);
        }
        ctx.later(() => { m.remove(); if (onLand) onLand(); }, ms);
      }
      const setPip = (i) => pipEls[i].classList.add("on");

      // ---------- Enemy ships ----------
      function mkEnemy(o, lane, mini) {
        const pair = COLORS[Math.floor(Math.random() * COLORS.length)];
        const b = document.createElement(mini ? "div" : "button");
        b.className = "sbz-en e" + (1 + Math.floor(Math.random() * 3)) + (mini ? " mini" : "");
        b.style.setProperty("--ec", pair[0]); b.style.setProperty("--ed", pair[1]);
        if (!mini) b.setAttribute("aria-label", TEXT.shipLabel(o.spoken || o.text));
        b.innerHTML = '<div class="in"><i class="fl"></i><i class="sw t"></i><i class="sw b"></i><i class="hn a"></i><i class="hn b"></i><i class="hl"></i><i class="mo"></i><div class="pl"></div>' +
          '<div class="ey a"><i></i></div><div class="ey b"><i></i></div></div>';
        if (mini) b.style.scale = "0.55";
        const pl = b.querySelector(".pl");
        if (o) {
          pl.textContent = o.text;
          const len = [...o.text].length;
          pl.style.fontSize = `calc(var(--u) * ${Math.min(0.34, 1.0 / (len * 0.66)).toFixed(3)})`;
        }
        const e = { el: b, o, lane, x: W + ew * 1.2, y: laneY(lane), tx: W, ty: laneY(lane), rate: 2.4, dead: false, bob: Math.random() * 6, charging: false };
        if (!mini) b.addEventListener("pointerdown", (ev) => { ev.preventDefault(); ev.stopPropagation(); pick(e); });
        world.appendChild(b);
        return e;
      }
      function killEnemy(e) { e.dead = true; e.el.remove(); }
      function retreat(delay) {
        ctx.later(() => EN.forEach((e) => { if (!e.dead) { e.tx = W + ew * 2.2; e.rate = 2.6; e.el.classList.remove("live"); } }), delay || 0);
        ctx.later(() => EN.forEach((e) => { if (e.tx > W) killEnemy(e); }), (delay || 0) + 1700);
      }

      // ---------- The card and the question flow ----------
      function setCard() {
        card.firstChild.textContent = st.cardText;
        card.querySelector(".spk")?.remove();
        if (ctx.canSpeak && !st.listen) card.insertAdjacentHTML("beforeend", '<span class="spk">🔊</span>');
        card.classList.remove("next"); void card.offsetWidth; card.classList.add("next");
      }
      function replay() { if (!done) ctx.say(st.prompt); }
      function startQuestion(delay) {
        phase = "cruise"; tsT = 1;
        ctx.later(spawnWave, delay / pace);
      }
      function spawnWave() {
        if (done) return;
        const row = ctx.shuffle(st.row.slice());
        EN = row.map((o, i) => {
          const e = mkEnemy(o, i, false);
          e.tx = W * (0.56 + 0.065 * i); e.ty = laneY(i);
          return e;
        });
        sweep(200, 700, 0.5, "sine", 0.05);
        ctx.later(() => {
          if (done) return;
          phase = "choose"; tsT = 0.12;
          EN.forEach((e) => e.el.classList.add("live"));
          tone(659, 0.08, "triangle", 0.09); tone(880, 0.1, "triangle", 0.09, 0.09);
          ctx.say(st.prompt);
        }, 1100 / pace);
      }
      function pick(e) {
        if (phase !== "choose" || done || ctx.ended || e.dead) return;
        phase = "approach"; chosen = e; tsT = 1;
        EN.forEach((q) => q.el.classList.remove("live"));
        e.el.classList.add("tgt");
        P.lane = e.lane; P.rate = 6;
        tone(880, 0.06, "square", 0.08); sweep(300, 900, 0.3, "sawtooth", 0.06);
        ctx.later(resolve, 520 / pace);
      }
      function resolve() {
        if (done || ctx.ended) return;
        phase = "event";
        chosen.el.classList.remove("tgt");
        if (chosen.o.right) onRight(); else onWrong();
      }
      function nextQuestion() {
        if (done) return;
        si++; st = S[si];
        mood(null);
        EN = EN.filter((e) => !e.dead); P.lane = 1; P.rate = 4;
        setCard();
        tone(98, 0.08, "square", 0.1); tone(147, 0.08, "square", 0.1, 0.16);
        startQuestion(500);
      }

      // ---------- Right answers ----------
      function onRight() {
        hits++; setPip(hits - 1);
        if (chosen.o.kind === "pic") ctx.say(chosen.o.spoken);
        mood("cheer");
        if (hits === 1) lasers(); else if (hits === 2) shieldBurst(); else rocketFinale();
      }
      function lasers() {
        itemPop("🔫"); word(TEXT.pew, false, P.sx + u * 0.6, P.sy - u * 1.1);
        const e = chosen, tgt = () => ({ x: e.x, y: e.y });
        for (let v = 0; v < 3; v++) {
          ctx.later(() => {
            [-1, 1].forEach((s) => {
              const t = tgt();
              bolt(P.sx + sw * 0.18, P.sy + s * sh * 0.4, t.x - ew * 0.3, t.y, "#5dff7a", 260 / pace, v === 2 && s === 1 ? hitIt : (v < 2 ? () => hurtIt(e) : null));
            });
            tone(1300 - v * 100, 0.07, "square", 0.08); sweep(1800, 500, 0.12, "sawtooth", 0.06);
          }, (v * 170) / pace);
        }
        function hurtIt(en) { en.el.classList.add("hurt"); ctx.later(() => en.el.classList.remove("hurt"), 90); burst(en.x - ew * 0.3, en.y, ["#5dff7a", "#fff"], 4, u * 0.4, u * 0.07, 300); }
        function hitIt() {
          boom(e.x, e.y, u * 2.1); shake(300, 5); flash("#e9fff0", 240);
          word(TEXT.blast, false, e.x, e.y - u * 0.9, true);
          killEnemy(e);
          EN.forEach((q) => { if (q !== e) { q.el.classList.add("hurt"); } });
          retreat(150);
          ctx.later(nextQuestion, 1500 / pace);
        }
      }
      function shieldBurst() {
        itemPop("🛡️"); word(TEXT.shield, false, P.sx + u * 0.8, P.sy - u * 1.1);
        shipEl.classList.add("shield");
        [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.1, "triangle", 0.09, i * 0.06));
        // The fleet closes ranks in front of you (the one you picked in the middle) ...
        const order = [EN.find((q) => q !== chosen), chosen, EN.filter((q) => q !== chosen)[1]];
        order.forEach((q, i) => { q.tx = W * (0.62 + (i === 1 ? 0 : 0.045)); q.ty = laneY(P.lane) + (i - 1) * eh * 0.78; q.rate = 5; });
        // ... and you burst right through them.
        ctx.later(() => {
          P.dash = true; P.tx = W + sw * 1.4; P.rate = 4.5;
          speedLines(1100 / pace); sweep(180, 1500, 0.8, "sawtooth", 0.08); noise(0.7, "bandpass", 700, 2600, 0.12);
        }, 750 / pace);
      }
      function smash(e) {
        boom(e.x, e.y, u * 1.7);
        burst(e.x, e.y, ["#8ff", "#fff"], 8, u * 0.9, u * 0.09, 600);
        killEnemy(e);
        if (!EN.some((q) => !q.dead)) { word(TEXT.smash, false, W * 0.55, P.sy - u * 0.9, true); shake(350, 7); flash("#dffcff", 260); }
      }
      function dashDone() {
        P.dash = false; P.x = -sw * 1.2; P.tx = restX(); P.rate = 3.2;
        ctx.later(() => shipEl.classList.remove("shield"), 1100 / pace);
        ctx.later(nextQuestion, 1500 / pace);
      }
      function rocketFinale() {
        done = true; phase = "final"; ctx.freezeTimer();
        itemPop("🚀"); word(TEXT.rocket, false, P.sx + u * 0.8, P.sy - u * 1.1);
        [523, 659, 784].forEach((f, i) => tone(f, 0.1, "triangle", 0.1, i * 0.08));
        // The whole fleet shows up ...
        const fleet = [];
        for (let i = 0; i < 6; i++) {
          ctx.later(() => {
            const e = mkEnemy(null, 1, true);
            e.tx = W * (0.5 + Math.random() * 0.42); e.ty = H * (0.1 + Math.random() * 0.8); e.rate = 3; e.x = W + ew; e.y = e.ty;
            EN.push(e); fleet.push(e);
          }, (i * 90) / pace);
        }
        // ... and one rocket blows them all up.
        ctx.later(() => {
          const tx = W * 0.7, ty = H * 0.5;
          sweep(200, 1400, 0.7, "sawtooth", 0.08); noise(0.7, "bandpass", 600, 2200, 0.12);
          missile(P.sx + sw * 0.45, P.sy, tx, ty, 700 / pace, false, "#e63946", () => {
            flash("#fff", 900); shake(900, 12);
            boom(tx, ty, u * 6);
            word(TEXT.boom, false, tx, ty - u * 1.4, true);
            EN.forEach((q, i) => {
              if (q.dead) return;
              ctx.later(() => { if (!q.dead) { boom(q.x, q.y, u * (q.o ? 2 : 1.3)); killEnemy(q); } }, 60 + i * 70);
            });
            ctx.later(celebrate, 650);
          });
        }, 800 / pace);
      }
      function celebrate() {
        shipEl.classList.add("roll"); mood("cheer"); speedLines(900);
        sweep(300, 1300, 1.0, "triangle", 0.09);
        ctx.later(winSpace, 450);
      }
      function winSpace() {
        finalWon = true;
        ctx.win();
        word(TEXT.win, false, W * 0.5, H * 0.3, true);
        ctx.confetti(fx, W * 0.5, H * 0.3, { count: 110 });
        [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.14, "triangle", 0.12, i * 0.09));
        ctx.say(st.answer);
      }

      // ---------- Wrong answers ----------
      function onWrong() {
        misses++; setPip(3 + misses - 1);
        mood("sad");
        ctx.say(st.answer);
        if (misses === 1) laserHit(); else if (misses === 2) crash(); else missileDeath();
      }
      function damage(level) {
        P.dmg = level; shipEl.classList.add("dmg");
      }
      function laserHit() {
        itemPop("⚡"); word(TEXT.hit, true, P.sx + u * 0.4, P.sy - u * 1.1);
        const e = chosen;
        [0, 1].forEach((v) => ctx.later(() => {
          bolt(e.x - ew * 0.55, e.y + (v ? 6 : -6), P.sx + sw * 0.35, P.sy + (v ? 5 : -5), "#ff3b4a", 380 / pace, v ? hitMe : null);
          tone(420, 0.08, "square", 0.09); sweep(900, 250, 0.2, "sawtooth", 0.07);
        }, (v * 220) / pace));
        function hitMe() {
          flash("#ff3b30", 380); shake(450, 8);
          burst(P.sx + sw * 0.3, P.sy, ["#ffe14d", "#ff8a1f", "#fff"], 14, u * 0.9, u * 0.09, 600);
          noise(0.3, "highpass", 1500, 600, 0.4); sweep(2200, 120, 0.4, "sawtooth", 0.1);
          shipEl.classList.add("zapped", "dz"); damage(1);
          ctx.later(() => shipEl.classList.remove("zapped"), 600);
          ctx.later(() => shipEl.classList.remove("dz"), 2200);
          smoke(P.sx, P.sy, 4, true);
          retreat(500);
          ctx.later(nextQuestion, 1900 / pace);
        }
      }
      function crash() {
        itemPop("💥"); word(TEXT.watch, true, W * 0.5, H * 0.18);
        const e = chosen;
        // It revs up, then rams you.
        e.el.classList.add("rev");
        sweep(300, 900, 0.4, "sawtooth", 0.07);
        ctx.later(() => {
          e.el.classList.remove("rev"); e.charging = true; e.tx = P.x - sw * 0.3; e.rate = 5;
          EN.forEach((q) => { if (q !== e && !q.dead) { q.tx = W + ew * 2.2; q.rate = 2.6; } });
          ctx.later(() => EN.forEach((q) => { if (q !== e && q.tx > W) killEnemy(q); }), 1700);
          sweep(500, 150, 0.5, "sawtooth", 0.07);
        }, 600 / pace);
      }
      function crashHit(e) {
        e.charging = false;
        const x = (e.x + P.x) / 2 + sw * 0.1, y = (e.y + P.y) / 2;
        boom(x, y, u * 2.6); flash("#fff6c9", 400); shake(600, 10);
        word(TEXT.crash, true, x, y - u * 1.1, true);
        killEnemy(e);
        shipEl.classList.add("spin", "dz"); damage(2);
        ctx.later(() => shipEl.classList.remove("spin"), 1200);
        ctx.later(() => shipEl.classList.remove("dz"), 2500);
        smoke(P.sx, P.sy, 6, false);
        ctx.later(nextQuestion, 2000 / pace);
      }
      function missileDeath() {
        done = true; phase = "final"; ctx.freezeTimer();
        itemPop("🎯"); word(TEXT.missile, true, W * 0.5, H * 0.2, true);
        siren.classList.add("on");
        const e = chosen;
        EN.forEach((q) => { if (q !== e) { q.tx = W + ew * 2.2; q.rate = 2.4; } });
        const wn = document.createElement("div");
        wn.className = "sbz-warn"; wn.textContent = "⚠️"; wn.style.cssText = `left:${P.sx}px;top:${Math.max(u * 0.4, P.sy - sh * 0.8)}px;`;
        fx.appendChild(wn);
        for (let i = 0; i < 4; i++) { tone(1000, 0.1, "square", 0.09, i * 0.22); tone(750, 0.1, "square", 0.09, i * 0.22 + 0.11); }
        e.el.classList.add("rev");
        ctx.later(() => {
          e.el.classList.remove("rev");
          sweep(1600, 300, 0.7, "sawtooth", 0.07);
          missile(e.x - ew * 0.5, e.y, P.sx + sw * 0.25, P.sy, 800 / pace, true, "#ffb300", () => {
            wn.remove(); siren.classList.remove("on");
            explodeShip();
          });
        }, 1000 / pace);
      }
      function explodeShip() {
        const v = view.getBoundingClientRect(), r = drEl.getBoundingClientRect();
        const ex = r.left - v.left, ey = r.top - v.top;
        boom(P.sx, P.sy, u * 4.8); flash("#fff", 700); shake(900, 13);
        ctx.later(() => boom(P.sx + u * 0.5, P.sy - u * 0.4, u * 3), 150);
        ctx.later(() => boom(P.sx - u * 0.4, P.sy + u * 0.3, u * 2.4), 300);
        word(TEXT.oops, true, W * 0.5, H * 0.28, true);
        // The hull breaks into pieces ...
        for (let i = 0; i < 9; i++) {
          const d = document.createElement("div");
          d.className = "sbz-deb"; d.style.left = `${P.sx - u * 0.15}px`; d.style.top = `${P.sy - u * 0.1}px`;
          if (i % 3 === 0) d.style.background = "#e63946";
          fx.appendChild(d);
          const a = Math.random() * 6.283, dist = u * (1.5 + Math.random() * 2.5);
          if (!reduce) d.animate([{ transform: "translate(0,0) rotate(0)", opacity: 1 }, { transform: `translate(${Math.cos(a) * dist}px, ${Math.sin(a) * dist}px) rotate(${(Math.random() - 0.5) * 1500}deg)`, opacity: 0 }],
            { duration: 1500 + Math.random() * 700, easing: "cubic-bezier(.1,.7,.3,1)", fill: "forwards" });
          ctx.later(() => d.remove(), 2300);
        }
        P.dead = true; shipEl.style.visibility = "hidden";
        // ... and your character is blasted out into space!
        const ej = document.createElement("div");
        ej.className = "sbz-eject"; ej.style.left = `${ex}px`; ej.style.top = `${ey}px`;
        ej.appendChild(mascot);
        fx.appendChild(ej);
        ejected = true;
        mood("sad");
        if (!reduce) ej.animate([
          { transform: "translate(0,0) rotate(0deg) scale(1)", opacity: 1 },
          { transform: `translate(${W * 0.12}px, ${-H * 0.22}px) rotate(540deg) scale(.9)`, opacity: 1, offset: 0.2 },
          { transform: `translate(${W * 0.4}px, ${-H * 0.05}px) rotate(1260deg) scale(.6)`, opacity: 1, offset: 0.55 },
          { transform: `translate(${W * 0.9}px, ${-H * 0.5}px) rotate(2160deg) scale(.15)`, opacity: 0.2 },
        ], { duration: 2800, easing: "ease-out", fill: "forwards" });
        sweep(900, 120, 1.6, "sine", 0.1); tone(180, 0.5, "triangle", 0.1, 0.6); tone(150, 0.6, "triangle", 0.1, 1.1);
        ctx.later(lose, 2700);
      }
      function lose() {
        if (finalWon || ctx.ended) return;
        ctx.lose();
        ctx.say(st.answer);
      }

      // ---------- The loop ----------
      let last = null;
      function frame(t) {
        const now = performance.now();
        const dt = last == null ? 0 : Math.min(0.05, (t - last) / 1000);
        last = t;
        ts += (tsT - ts) * Math.min(1, dt * 5);
        cam += 520 * ts * camV * dt;
        // keep the clock still while you choose and while things happen; a 25 s cap so a nap still times out
        if ((phase === "choose" || phase === "approach" || phase === "event" || phase === "final") && !ctx.demo && !ctx.ended) {
          if (phase !== "choose" || heldFor < 25) {
            if (now >= holdUntil) { ctx.pauseTimer(300); holdUntil = now + 300; }
            if (phase === "choose") heldFor += dt;
          }
        }
        // the background drifts past
        layers.forEach(([el, f]) => { el.style.backgroundPosition = `${((-cam * f) % 4000).toFixed(1)}px 0`; });
        planA.style.left = `${(((W * 1.1 - cam * 0.035) % (W * 2.4)) + W * 2.4) % (W * 2.4) - W * 0.5}px`;
        planB.style.left = `${(((W * 0.35 - cam * 0.07) % (W * 1.9)) + W * 1.9) % (W * 1.9) - W * 0.3}px`;
        // your ship
        P.x += (P.tx - P.x) * Math.min(1, dt * P.rate);
        const ty = laneY(P.lane) + (P.dash ? 0 : Math.sin(now / 420) * H * 0.012);
        P.y += (ty - P.y) * Math.min(1, dt * 7);
        P.sx = P.x; P.sy = P.y;
        if (!P.dead) {
          shipEl.style.transform = `translate(${(P.x - sw / 2).toFixed(1)}px, ${(P.y - sh / 2).toFixed(1)}px)`;
          bankEl.style.rotate = `${Math.max(-12, Math.min(12, (ty - P.y) * 0.18)).toFixed(1)}deg`;
          shipEl.classList.toggle("boost", P.dash || (P.tx - P.x) > u * 0.8);
          if (P.dmg && Math.random() < 0.05 * P.dmg && !done) smoke(P.sx, P.sy, 1, true);
        }
        if (P.dash) {
          EN.forEach((e) => { if (!e.dead && P.x + sw * 0.42 >= e.x - ew * 0.3) smash(e); });
          if (P.x >= W + sw * 1.1) dashDone();
        }
        // the enemies
        EN.forEach((e) => {
          if (e.dead) return;
          e.x += (e.tx - e.x) * Math.min(1, dt * e.rate);
          e.y += (e.ty - e.y) * Math.min(1, dt * 5);
          const bob = e.charging ? 0 : Math.sin(now / 520 + e.bob) * H * 0.012;
          e.el.style.transform = `translate(${(e.x - ew / 2).toFixed(1)}px, ${(e.y + bob - eh / 2).toFixed(1)}px)`;
          e.el.style.visibility = e.x < W + ew * 0.9 ? "visible" : "hidden";
          if (e.charging && e.x - P.x <= sw * 0.42 + ew * 0.38) crashHit(e);
        });
        ctx.raf(frame);
      }

      // ---------- Go ----------
      ctx.onTimeout(() => {
        done = true;
        EN.forEach((e) => { if (!e.dead && e.o) e.el.classList.add(e.o.right ? "right" : "bad"); });
        shipEl.classList.add("dz"); mood("sad");
        ctx.say(st.answer);
      });
      function onKey(e) {
        const i = parseInt(e.key, 10) - 1;
        if (i >= 0 && i < EN.length && EN[i].o) { e.preventDefault(); pick(EN[i]); }
        else if (e.key === " ") { e.preventDefault(); replay(); }
      }
      document.addEventListener("keydown", onKey);

      layout();
      P.x = restX(); P.tx = P.x; P.y = laneY(1); P.lane = 1;
      setCard();
      const ro = new ResizeObserver(layout);
      ro.observe(view);
      const revealMs = ctx.reveal(card) || 0;
      startQuestion(700 + revealMs * pace);
      ctx.raf(frame);

      // Tutorial: each time the ships fly in, point at the card, then tap the right one.
      ctx.tutorial(S.map((s) => s.target), async (f) => {
        for (let n = 0; n < GOAL && !finalWon; n++) {
          await f.until(() => phase === "choose" && si === n && EN.length > 0, 9000);
          await f.point(card, n ? 450 : 800);
          await f.tap(() => (EN.find((q) => q.o && q.o.right && !q.dead) || EN[0] || { el: card }).el);
          await f.until(() => hits > n || finalWon, 5000);
        }
        await f.until(() => ctx.ended, 6000);
      });
      return () => { done = true; ro.disconnect(); document.removeEventListener("keydown", onKey); };
    },
  });
})();
