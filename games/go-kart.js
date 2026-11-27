// GO-KART RACE — the teacher's idea: you (the character you picked) drive a go-kart down a race track, the screen
// panning left. Every few seconds 3 item boxes roll in, each with an answer, and TIME SLOWS so you can choose
// (`ctx.choiceSteps`: every box set has a NEW target on the card). Tap a box: you steer into it.
//   Right: 1st 🚀 rocket boost (you overtake), 2nd 🍌 banana (dropped behind you: the driver behind slips and
//   falls back), 3rd ⭐ star (sparkly, you zoom over the finish line = win).
//   Wrong: 1st 💣 bomb (explodes at once: you spin and slow), 2nd ⚡ lightning (you shrink for a bit), 3rd 🔵 blue
//   rocket (a huge explosion: every rival overtakes you just before the finish line = lose).
(function () {
  const TEXT = {
    name: { en: "Go-Kart Race" },
    icon: "🏎️",
    howTo: { en: {
      steps: [
        ["👀", "Look at the card."],
        ["📦", "Three item boxes roll in and time goes slow. Tap the box that matches!"],
        ["🚀", "Right answers give you a rocket 🚀, a banana 🍌, then a STAR ⭐ to win the race!"],
      ],
      tips: ["Wrong answers give you a bomb 💣, lightning ⚡ and then a blue rocket 🔵: the others zoom past you!", "Take your time: the race goes slow while you choose.", "Tap the card to hear it again."],
    } },
    instruction: { en: "RACE!" },
    cardLabel: "The card. Tap to hear it again.",
    boxLabel: (t) => `Item box ${t}`,
    rocket: "ROCKET!", zoom: "ZOOOM!", banana: "BANANA!", whoa: "WHOA!", star: "STAR POWER!",
    bomb: "BOMB!", boom: "BOOM!", zap: "ZAP!", blue: "BLUE ROCKET!", oops: "OH NO!", win: "WINNER!",
    places: ["1ST!", "2ND!", "3RD!"],
  };
  const GOAL = 3, MISSES = 3;

  const CSS = `
  .gk { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:6px; padding-bottom:6px; }
  .gk-top { flex:none; display:flex; align-items:center; gap:10px; }
  .gk-card { padding:4px 16px; background:#fff; border:5px solid #111; border-radius:16px; box-shadow:0 5px 0 #111; font:inherit; color:#111; font-size:clamp(1.8rem, 8vw, 2.8rem);
    line-height:1.05; cursor:pointer; touch-action:manipulation; display:flex; align-items:center; gap:6px; white-space:nowrap; }
  .gk-card .spk { font-size:.45em; }
  .gk-card.next { animation:gk-next .35s cubic-bezier(.2,1.8,.4,1); }
  .gk-pips { display:flex; flex-direction:column; gap:4px; }
  .gk-row { display:flex; gap:4px; }
  .gk-pip { width:30px; height:30px; border:3px solid #111; border-radius:50%; background:#fff; display:flex; align-items:center; justify-content:center; font-size:17px; line-height:1;
    filter:grayscale(1); opacity:.45; transition:all .25s; }
  .gk-pip.on { filter:none; opacity:1; scale:1.12; }
  .gk-row.g .gk-pip.on { background:#b8f5c8; } .gk-row.b .gk-pip.on { background:#ffc4c4; }
  .gk-view { position:relative; flex:1; min-height:0; width:100%; max-width:760px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111;
    background:linear-gradient(180deg, #4cb8ff 0%, #bfeaff 48%); touch-action:manipulation; --bx:0px; }
  .gk-sun { position:absolute; right:9%; top:7%; width:11%; aspect-ratio:1; border-radius:50%; background:#fff3a0; box-shadow:0 0 0 6px rgba(255,243,160,.5), 0 0 40px 12px rgba(255,243,160,.6); }
  .gk-bg { position:absolute; left:0; right:0; background-repeat:repeat-x; background-position-x:var(--bx); pointer-events:none; }
  .gk-clouds { top:5%; height:20%; background-image:radial-gradient(ellipse 54px 20px at 90px 50%, #fff 0 98%, transparent), radial-gradient(ellipse 38px 16px at 120px 38%, #fff 0 98%, transparent),
    radial-gradient(ellipse 66px 22px at 340px 60%, #fff 0 98%, transparent), radial-gradient(ellipse 42px 16px at 372px 46%, #fff 0 98%, transparent); background-size:520px 100%; }
  .gk-hills { top:14%; height:38%; background-image:radial-gradient(ellipse at 50% 100%, #5fc055 0 60%, transparent 61%), radial-gradient(ellipse at 50% 100%, #7bd36a 0 62%, transparent 63%);
    background-size:360px 70%, 440px 100%; background-position:210px 100%, 0 100%; background-position-x:calc(var(--bx) + 210px), var(--bx); }
  .gk-trees { top:36%; height:16%; background-image:radial-gradient(circle at 50% 64%, #2f9e44 0 38%, transparent 40%), radial-gradient(circle at 50% 100%, #7a4a22 0 6%, transparent 7%);
    background-size:74px 100%; background-position:0 100%; }
  /* The stands beside the track: rows of cheering heads in coloured shirts */
  .gk-stands { height:11%; border-top:4px solid #111; background-color:#6b5bd2;
    background-image:radial-gradient(circle at 50% 30%, #ffd0a0 0 17%, transparent 19%), radial-gradient(circle at 50% 100%, #ff4d6d 0 34%, transparent 36%),
      radial-gradient(circle at 50% 30%, #f3b98a 0 17%, transparent 19%), radial-gradient(circle at 50% 100%, #ffd23f 0 34%, transparent 36%);
    background-size:34px 50%, 34px 50%, 34px 50%, 34px 50%; background-position:0 0, 0 100%, 17px 100%, 17px 0; background-position-x:var(--bx), var(--bx), calc(var(--bx) + 17px), calc(var(--bx) + 17px); }
  .gk-track { position:absolute; left:0; right:0; bottom:0; background-color:#4d5160; border-top:4px solid #111;
    background-image:linear-gradient(90deg, #e63946 0 50%, #fff 50% 100%), linear-gradient(90deg, #fff 0 46px, transparent 46px 100px), linear-gradient(90deg, #fff 0 46px, transparent 46px 100px);
    background-size:70px 14px, 100px 5px, 100px 5px; background-repeat:repeat-x; background-position:0 0, 0 41%, 0 76%; background-position-x:var(--bx), var(--bx), var(--bx); }
  .gk-world, .gk-fx { position:absolute; inset:0; pointer-events:none; }
  .gk-fx { z-index:80; overflow:hidden; }
  .gk-world > * { position:absolute; left:0; top:0; }
  /* The item boxes: a shimmering rainbow cube with the answer on a white plate */
  .gk-box { width:var(--bz); height:var(--bz); padding:0; border:0; background:none; font:inherit; cursor:pointer; touch-action:manipulation; pointer-events:auto; animation:gk-boxin .4s cubic-bezier(.2,1.6,.4,1) both; }
  .gk-box .bob { position:absolute; inset:0; animation:gk-bob .7s ease-in-out infinite alternate; }
  .gk-box .cube { position:absolute; inset:0; border:5px solid #111; border-radius:20%; box-shadow:0 5px 0 #111, 0 0 18px 4px rgba(255,255,255,.7);
    background:conic-gradient(from 0deg, #ff4d6d, #ffd23f, #5ee07a, #3ac8ff, #a06bff, #ff4d6d); animation:gk-hue 1.2s linear infinite; }
  .gk-box .pl { position:absolute; left:14%; right:14%; top:14%; bottom:14%; border:3px solid #111; border-radius:18%; background:#fff; display:flex; align-items:center; justify-content:center;
    font-size:calc(var(--bz) * .46); line-height:1; color:#111; white-space:nowrap; }
  .gk-box .q { position:absolute; width:22%; aspect-ratio:1; background:#fff; border:3px solid #111; border-radius:50%; font-size:calc(var(--bz) * .17); font-weight:900; display:flex; align-items:center; justify-content:center; color:#111; z-index:2; }
  .gk-box .q.a { left:-9%; top:-9%; } .gk-box .q.b { right:-9%; bottom:-9%; }
  .gk-box.used { opacity:0; scale:.4; transition:all .3s; pointer-events:none; }
  .gk-box.bad { filter:grayscale(1); opacity:.5; pointer-events:none; }
  .gk-box.right .cube { box-shadow:0 5px 0 #111, 0 0 0 6px #fff, 0 0 0 12px #00b86b; }
  .gk-box.pop { animation:gk-boxpop .35s ease-out forwards; }
  /* A kart (--u wide): positioned by a transform, so every animation goes on an inner layer */
  .gk-k { width:var(--u); height:var(--u); will-change:transform; }
  .gk-sc { position:absolute; inset:0; transform-origin:50% 100%; transition:scale .25s cubic-bezier(.3,1.7,.5,1); }
  .gk-k.small .gk-sc { scale:.42; }
  .gk-in, .gk-rb { position:absolute; inset:0; transform-origin:50% 80%; }
  .gk-rb { animation:gk-rump .17s ease-in-out infinite alternate; }
  .gk-rb > * { position:absolute; box-sizing:border-box; }
  .gk-bd { left:2%; right:0; bottom:15%; height:34%; background:var(--kc); border:4px solid #111; border-radius:20% 50% 18% 18% / 40% 70% 22% 22%; z-index:3;
    box-shadow:inset 0 -6px 0 rgba(0,0,0,.18), inset 0 6px 0 rgba(255,255,255,.28); }
  .gk-bd::before { content:""; position:absolute; left:8%; right:22%; top:36%; height:20%; background:#fff; border-radius:99px; opacity:.9; }
  .gk-bd::after { content:"★"; position:absolute; right:8%; top:8%; font-size:calc(var(--u) * .13); line-height:1; color:#ffe14d; -webkit-text-stroke:1px #111; }
  .gk-wh { z-index:4; aspect-ratio:1; border-radius:50%; background:radial-gradient(circle, #e8e8ee 0 20%, #777 22% 30%, #222 32%); border:4px solid #111; bottom:0; }
  .gk-wh::before { content:""; position:absolute; inset:18%; border-radius:50%; background:conic-gradient(#222 0 12%, #bbb 12% 25%, #222 25% 37%, #bbb 37% 50%, #222 50% 62%, #bbb 62% 75%, #222 75% 87%, #bbb 87%); opacity:.9; }
  .gk-wh::after { content:""; position:absolute; inset:38%; border-radius:50%; background:#ddd; border:2px solid #111; }
  .gk-bw { left:3%; width:36%; } .gk-fw { right:2%; width:30%; }
  .gk-sp { left:-3%; bottom:42%; width:15%; height:22%; background:#222; border:3px solid #111; border-radius:6px 6px 0 0; z-index:2; box-shadow:inset 0 5px 0 var(--kc); }
  .gk-ex { left:-9%; bottom:26%; width:14%; height:9%; background:#9aa1ad; border:3px solid #111; border-radius:6px; z-index:2; }
  .gk-dr { left:22%; bottom:34%; width:var(--dz); height:var(--dz); z-index:2; }
  .gk-fl { right:100%; left:auto; bottom:12%; width:46%; height:24%; margin-right:-9%; z-index:1; display:none; transform-origin:100% 50%; animation:gk-flame .09s linear infinite alternate;
    background:linear-gradient(270deg, #fff 0, #ffe14d 24%, #ff8a1f 58%, rgba(255,60,30,0)); clip-path:polygon(100% 0, 0 50%, 100% 100%); }
  .gk-k.boost .gk-fl { display:block; }
  .gk-k.star .gk-rb { animation:gk-rump .12s ease-in-out infinite alternate, gk-rainbow .55s linear infinite; }
  .gk-k.char .gk-rb { filter:brightness(.35) sepia(.5); animation:none; }
  .gk-k.spin .gk-in { animation:gk-spin .95s ease-in-out both; }
  .gk-k.slip .gk-in { animation:gk-spin 1s ease-in-out both; }
  .gk-k.blown .gk-in { animation:gk-blown 1.5s cubic-bezier(.3,.6,.5,1) both; }
  .gk-k.dz .ms-eye i, .gk-k.dz .gk-rv .ey i { animation:gk-dizzy .4s linear infinite; }
  .gk-k.zapped .gk-rb { animation:gk-zap .06s linear infinite alternate; }
  /* The rival drivers: silly round monsters (googly eyes, big grins), each with its own hat */
  .gk-rv { position:relative; width:100%; height:100%; }
  .gk-rv > * { position:absolute; box-sizing:border-box; }
  .gk-rv .hd { left:0; right:0; top:8%; bottom:0; background:var(--rc); border:4px solid #111; border-radius:50%; box-shadow:inset -4px -5px 0 rgba(0,0,0,.14); }
  .gk-rv .ey { top:26%; width:31%; aspect-ratio:1; background:#fff; border:3px solid #111; border-radius:50%; overflow:hidden; z-index:2; }
  .gk-rv .ey.l { left:13%; } .gk-rv .ey.r { right:13%; width:24%; top:30%; }
  .gk-rv .ey i { position:absolute; left:28%; top:30%; width:46%; aspect-ratio:1; background:#111; border-radius:50%; animation:gk-roll 1s ease-in-out infinite alternate; }
  .gk-rv .mo { left:22%; right:22%; top:56%; height:30%; background:#5a0f1e; border:3px solid #111; border-radius:10% 10% 50% 50% / 14% 14% 86% 86%; overflow:hidden; z-index:2; }
  .gk-rv .mo::before { content:""; position:absolute; left:6%; right:6%; top:0; height:34%; background:repeating-linear-gradient(90deg, #fff 0 24%, #ddd 24% 27%); }
  .gk-rv .mo::after { content:""; position:absolute; left:26%; width:48%; bottom:-14%; height:50%; border-radius:50%; background:#ff6f91; }
  .gk-rv .ck { top:56%; width:15%; aspect-ratio:1; background:#ff8fb1; border-radius:50%; opacity:.8; z-index:1; } .gk-rv .ck.l { left:3%; } .gk-rv .ck.r { right:3%; }
  .gk-rv.h1::before { content:""; left:6%; right:6%; top:-3%; height:38%; background:#e63946; border:3px solid #111; border-radius:60% 60% 8% 8%; z-index:3; }
  .gk-rv.h1::after { content:""; left:46%; width:60%; top:24%; height:11%; background:#e63946; border:3px solid #111; border-radius:99px; z-index:3; }
  .gk-rv.h2::before, .gk-rv.h2::after { content:""; top:-12%; width:24%; height:34%; background:#f6f0cf; z-index:0; clip-path:polygon(50% 0, 100% 100%, 0 100%);
    filter:drop-shadow(0 0 1px #111) drop-shadow(0 0 1px #111); }
  .gk-rv.h2::before { left:10%; transform:rotate(-14deg); } .gk-rv.h2::after { right:10%; transform:rotate(14deg); }
  .gk-rv.h3::before { content:""; left:14%; right:14%; top:-6%; height:34%; background:#3a86ff; border:3px solid #111; border-radius:60% 60% 10% 10%; z-index:3; }
  .gk-rv.h3::after { content:""; left:50%; margin-left:-30%; top:-16%; width:60%; height:10%; background:#ff3b30; border:3px solid #111; border-radius:99px; z-index:3; animation:gk-prop .16s linear infinite alternate; }
  /* The banana you drop, the finish line */
  .gk-ban { font-size:calc(var(--u) * .46); line-height:1; filter:drop-shadow(0 3px 0 rgba(0,0,0,.45)); }
  .gk-ban.peel { animation:gk-peel .7s ease-out forwards; }
  .gk-fin { width:calc(var(--u) * 2.6); height:100%; }
  .gk-fin .ln { position:absolute; left:50%; margin-left:calc(var(--u) * -.2); width:calc(var(--u) * .4); top:var(--ty); bottom:0;
    background:repeating-conic-gradient(#111 0 25%, #fff 0 50%) 0 0 / calc(var(--u) * .2) calc(var(--u) * .2); border:3px solid #111; }
  .gk-fin .pole { position:absolute; width:calc(var(--u) * .12); background:#c9d1d9; border:3px solid #111; top:calc(var(--ty) - var(--u) * 1.05); height:calc(var(--u) * 1.05); }
  .gk-fin .pole.l { left:2%; } .gk-fin .pole.r { right:2%; }
  .gk-fin .bn { position:absolute; left:0; right:0; top:calc(var(--ty) - var(--u) * 1.0); height:calc(var(--u) * .46); border:4px solid #111; border-radius:10px; display:flex; align-items:center; justify-content:center;
    font-size:calc(var(--u) * .3); font-weight:900; letter-spacing:.06em; color:#fff; -webkit-text-stroke:2px #111; paint-order:stroke fill;
    background:repeating-conic-gradient(#111 0 25%, #e63946 0 50%) 0 0 / calc(var(--u) * .23) calc(var(--u) * .23); }
  /* Effects */
  .gk-item { position:absolute; font-size:calc(var(--u) * .8); line-height:1; transform:translate(-50%, -50%); animation:gk-item 1s ease-out forwards; filter:drop-shadow(0 4px 0 rgba(0,0,0,.4)); }
  .gk-word { position:absolute; transform:translate(-50%, -50%) rotate(-7deg); font-size:2.1rem; color:#fff; -webkit-text-stroke:2px #111; paint-order:stroke fill;
    text-shadow:0 4px 0 #111; white-space:nowrap; animation:gk-word 1.1s ease-out forwards; }
  .gk-word.bad { color:#ff5a6e; } .gk-word.big { font-size:2.8rem; color:#ffd400; }
  .gk-p { position:absolute; border-radius:50%; }
  .gk-boom { position:absolute; transform:translate(-50%, -50%); }
  .gk-flash { position:absolute; inset:0; z-index:90; pointer-events:none; opacity:0; background:#fff; }
  .gk-siren { position:absolute; inset:0; z-index:85; pointer-events:none; opacity:0; box-shadow:inset 0 0 90px 30px rgba(255,30,30,.8); }
  .gk-siren.on { animation:gk-siren .45s ease-in-out infinite alternate; }
  .gk-sl { position:absolute; height:3px; border-radius:3px; background:rgba(255,255,255,.85); animation:gk-sl .32s linear infinite; z-index:70; }
  .gk-bolt { position:absolute; transform:translateX(-50%); background:linear-gradient(90deg, #ffe14d, #fff 50%, #ffe14d); filter:drop-shadow(0 0 10px #ffe14d);
    clip-path:polygon(40% 0, 82% 0, 58% 34%, 90% 34%, 30% 100%, 44% 52%, 14% 52%); animation:gk-bolt .5s linear forwards; }
  .gk-br { position:absolute; width:calc(var(--u) * 1.5); height:calc(var(--u) * .56); transform-origin:50% 50%; z-index:84; }
  .gk-br > * { position:absolute; box-sizing:border-box; }
  .gk-br .bd { inset:0 0 0 14%; background:linear-gradient(180deg, #7ab8ff 0, #2a6df4 50%, #1743b8); border:4px solid #111; border-radius:40% 90% 90% 40% / 50%; }
  .gk-br .bd::after { content:""; position:absolute; left:52%; top:-2px; bottom:-2px; width:10%; background:#fff; opacity:.9; }
  .gk-br .nose { right:-4%; top:20%; width:20%; height:60%; background:#eef4ff; border:4px solid #111; border-radius:30% 100% 100% 30% / 50%; }
  .gk-br .fin { left:14%; width:26%; height:36%; background:#14338f; filter:drop-shadow(0 0 1px #111) drop-shadow(0 0 1px #111); }
  .gk-br .fin.a { top:-24%; clip-path:polygon(0 100%, 100% 100%, 0 0); } .gk-br .fin.b { bottom:-24%; clip-path:polygon(0 0, 100% 0, 0 100%); }
  .gk-br .fl { left:-14%; top:18%; width:34%; height:64%; background:linear-gradient(270deg, #fff, #ffe14d 30%, #ff5a1f 70%, rgba(255,60,30,0)); clip-path:polygon(100% 0, 0 50%, 100% 100%); animation:gk-flame .08s linear infinite alternate; transform-origin:100% 50%; }
  .gk-br .ey { top:16%; width:22%; aspect-ratio:1; background:#fff; border:3px solid #111; border-radius:50%; z-index:2; } .gk-br .ey.l { left:42%; } .gk-br .ey.r { left:62%; width:18%; top:20%; }
  .gk-br .ey::after { content:""; position:absolute; right:14%; top:30%; width:44%; aspect-ratio:1; background:#111; border-radius:50%; }
  .gk-br .mo { left:52%; width:30%; top:56%; height:24%; background:#5a0f1e; border:3px solid #111; border-radius:10% 10% 50% 50%; overflow:hidden; z-index:2; }
  .gk-br .mo::before { content:""; position:absolute; left:6%; right:6%; top:0; height:40%; background:#fff; }
  .gk-br .br { top:6%; width:24%; height:7%; background:#111; z-index:3; } .gk-br .br.l { left:40%; transform:rotate(18deg); } .gk-br .br.r { left:62%; transform:rotate(-18deg); }
  .gk-shadow { position:absolute; transform:translate(-50%, -50%); border-radius:50%; background:rgba(0,0,0,.4); z-index:1; }
  .gk-warn { position:absolute; transform:translate(-50%, -50%); font-size:calc(var(--u) * .7); animation:gk-warn .3s steps(2) infinite; filter:drop-shadow(0 3px 0 #111); }
  @keyframes gk-next { from { scale:.6; } }
  @keyframes gk-boxin { from { scale:.2; opacity:0; } }
  @keyframes gk-bob { to { translate:0 -9%; } }
  @keyframes gk-hue { to { filter:hue-rotate(360deg); } }
  @keyframes gk-boxpop { 0% { scale:1; } 40% { scale:1.5; opacity:1; } 100% { scale:2.2; opacity:0; } }
  @keyframes gk-rump { from { translate:0 0; } to { translate:0 -2.5%; } }
  @keyframes gk-flame { from { scale:1 .8; } to { scale:1.2 1.1; } }
  @keyframes gk-rainbow { from { filter:hue-rotate(0deg) saturate(1.8) drop-shadow(0 0 7px #fff) drop-shadow(0 0 14px #ffe14d); } to { filter:hue-rotate(360deg) saturate(1.8) drop-shadow(0 0 7px #fff) drop-shadow(0 0 14px #ffe14d); } }
  @keyframes gk-spin { 0% { rotate:0deg; translate:0 0; } 45% { rotate:360deg; translate:0 -34%; } 100% { rotate:720deg; translate:0 0; } }
  @keyframes gk-blown { 0% { rotate:0deg; translate:0 0; } 28% { rotate:520deg; translate:-8% -280%; } 62% { rotate:880deg; translate:-18% -90%; } 100% { rotate:1080deg; translate:-14% 0; } }
  @keyframes gk-zap { from { translate:-3% 0; } to { translate:3% 0; } }
  @keyframes gk-dizzy { from { transform:rotate(0) translateX(25%); } to { transform:rotate(360deg) translateX(25%); } }
  @keyframes gk-roll { from { transform:translate(-25%, -15%); } to { transform:translate(25%, 15%); } }
  @keyframes gk-prop { from { scale:1 1; } to { scale:.15 1; } }
  @keyframes gk-peel { 0% { translate:0 0; rotate:0deg; opacity:1; } 100% { translate:30px -150px; rotate:540deg; opacity:0; } }
  @keyframes gk-item { 0% { scale:0; opacity:0; } 22% { scale:1.4; opacity:1; } 45% { scale:1; } 80% { opacity:1; } 100% { translate:0 -50%; opacity:0; } }
  @keyframes gk-word { from { opacity:1; scale:.5; } 25% { scale:1.15; } 75% { opacity:1; } to { opacity:0; translate:0 -40px; } }
  @keyframes gk-sl { from { translate:0 0; } to { translate:-140vw 0; } }
  @keyframes gk-siren { to { opacity:1; } }
  @keyframes gk-warn { from { scale:1; } to { scale:1.25; } }
  @keyframes gk-bolt { 0%, 40% { opacity:1; } 20%, 60% { opacity:.3; } 100% { opacity:0; } }
  @media (prefers-reduced-motion: reduce) { .gk-box .cube, .gk-box .bob, .gk-rb, .gk-sl, .gk-rv .ey i, .gk-warn, .gk-siren.on { animation:none !important; } }
  `;
  function injectCss() { if (document.getElementById("gk-css")) return; const s = document.createElement("style"); s.id = "gk-css"; s.textContent = CSS; document.head.appendChild(s); }

  // A spiky cartoon explosion outline
  const STAR = (() => { const p = []; for (let i = 0; i < 26; i++) { const r = i % 2 ? 0.64 : 1, a = (i / 26) * Math.PI * 2; p.push(`${(50 + Math.cos(a) * 50 * r).toFixed(1)}% ${(50 + Math.sin(a) * 50 * r).toFixed(1)}%`); } return `polygon(${p.join(",")})`; })();
  const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);

  registerMicrogame({
    id: "go-kart",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 18000,   // the clock only really runs while the track is at full speed (it crawls while you choose)
    input: "tap",
    tutorial: true,

    start(ctx) {
      injectCss();
      const speed = ctx.speed || 1, pace = 0.75 + 0.25 * speed;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const { tone, sweep, noise } = ctx.sfx;
      const S = ctx.choiceSteps(5, 3, { lowercase: true });   // at most 5 sets: 3 right or 3 wrong ends it
      let si = 0, st = S[0];

      // ---------- DOM ----------
      const wrap = document.createElement("div");
      wrap.className = "gk";
      const top = document.createElement("div");
      top.className = "gk-top";
      const card = document.createElement("button");
      card.className = "gk-card";
      card.setAttribute("aria-label", TEXT.cardLabel);
      card.innerHTML = '<span class="ct"></span>';
      card.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });
      const pips = document.createElement("div");
      pips.className = "gk-pips";
      pips.innerHTML = '<div class="gk-row g"><span class="gk-pip">🚀</span><span class="gk-pip">🍌</span><span class="gk-pip">⭐</span></div>' +
        '<div class="gk-row b"><span class="gk-pip">💣</span><span class="gk-pip">⚡</span><span class="gk-pip">🔵</span></div>';
      top.append(card, pips);
      const view = document.createElement("div");
      view.className = "gk-view";
      view.innerHTML = '<i class="gk-sun"></i><div class="gk-bg gk-clouds"></div><div class="gk-bg gk-hills"></div><div class="gk-bg gk-trees"></div>' +
        '<div class="gk-bg gk-stands"></div><div class="gk-track"></div><div class="gk-world"></div><div class="gk-fx"></div><div class="gk-flash"></div><div class="gk-siren"></div>';
      wrap.append(top, view);
      ctx.root.appendChild(wrap);
      const world = view.querySelector(".gk-world"), fx = view.querySelector(".gk-fx"), flashEl = view.querySelector(".gk-flash"), siren = view.querySelector(".gk-siren");
      const sky = [".gk-clouds", ".gk-hills", ".gk-trees", ".gk-stands"].map((q) => [view.querySelector(q), q]);
      const pipEls = [...pips.querySelectorAll(".gk-pip")];

      // ---------- Layout ----------
      let W = 0, H = 0, u = 80, ty = 0;
      const LANES = [0.7, 0.845, 0.975];
      const laneY = (l) => H * LANES[l];
      function layout() {
        W = view.clientWidth; H = view.clientHeight;
        u = Math.max(54, Math.min(H * 0.25, W * 0.2, 130));
        ty = H * 0.5;
        view.style.setProperty("--u", `${u}px`); view.style.setProperty("--dz", `${u * 0.62}px`); view.style.setProperty("--bz", `${u * 0.66}px`); view.style.setProperty("--ty", `${ty}px`);
        const stands = view.querySelector(".gk-stands"), track = view.querySelector(".gk-track");
        stands.style.top = `${ty - H * 0.11}px`; track.style.top = `${ty}px`;
      }

      // ---------- Karts ----------
      const rivalDriver = (color, hat) => {
        const d = document.createElement("div");
        d.className = `gk-rv ${hat}`; d.style.setProperty("--rc", color);
        d.innerHTML = '<div class="hd"></div><div class="ey l"><i></i></div><div class="ey r"><i></i></div><div class="mo"></div><div class="ck l"></div><div class="ck r"></div>';
        return d;
      };
      function mkKart(kc, driver) {
        const el = document.createElement("div");
        el.className = "gk-k"; el.style.setProperty("--kc", kc);
        el.innerHTML = '<div class="gk-sc"><div class="gk-in"><div class="gk-rb"><div class="gk-fl"></div><div class="gk-sp"></div><div class="gk-ex"></div><div class="gk-dr"></div>' +
          '<div class="gk-bd"></div><div class="gk-wh gk-bw"></div><div class="gk-wh gk-fw"></div></div></div></div>';
        el.querySelector(".gk-dr").appendChild(driver);
        world.appendChild(el);
        return { el, wheels: [...el.querySelectorAll(".gk-wh")], x: 0, y: 0, lane: 1, rel: 0, off: 0, pen: 0, mode: "follow", crossed: false, sx: 0, sy: 0 };
      }
      const mascot = window.Mascot ? window.Mascot.el("var(--dz)") : document.createElement("div");
      const P = mkKart("#e63946", mascot);
      const RIV = [["#2bb673", "#ff7ab8", "h1", -0.3, 2], ["#8b4fe0", "#3fd0d4", "h2", 0.22, 0], ["#ffc21a", "#9ae04a", "h3", 0.42, 1]].map(([kc, dc, hat, o, lane]) => {
        const r = mkKart(kc, rivalDriver(dc, hat)); r.base = o; r.lane = lane; return r;
      });
      const [RA, RB, RC] = RIV;
      const mood = (m) => { if (window.Mascot && window.Mascot.mood) window.Mascot.mood(mascot, m); };

      // ---------- State ----------
      let px = 0, cam = 0, pm = 1, pmT = 1, ts = 1, tsT = 1, wheelA = 0, kr = 1.6;
      let phase = "intro";   // intro, cruise, choose, approach, event, final
      let hits = 0, misses = 0, done = false, chosen = null, boxes = [], ban = null, fin = null, smallUntil = 0, place = 0, finalWon = false;
      const V = () => W * 0.5;
      const setRanks = () => {
        const s = hits - misses;
        RIV.forEach((r) => { r.off = (r.base - 0.22 * s) * W; });
      };

      // ---------- Helpers ----------
      const sx = (x) => x - cam;
      function word(text, bad, x, y, big) {
        const w = document.createElement("div");
        w.className = "gk-word" + (bad ? " bad" : "") + (big ? " big" : "");
        w.textContent = text;
        w.style.left = `${Math.max(80, Math.min(W - 80, x))}px`; w.style.top = `${Math.max(30, Math.min(H - 30, y))}px`;
        fx.appendChild(w);
        ctx.later(() => w.remove(), 1100);
      }
      function itemPop(emoji) {
        const e = document.createElement("div");
        e.className = "gk-item"; e.textContent = emoji;
        e.style.left = `${P.sx}px`; e.style.top = `${P.sy - u * 1.15}px`;
        fx.appendChild(e);
        ctx.later(() => e.remove(), 1050);
      }
      function burst(x, y, cols, n, dist, size, ms) {
        const ps = [];
        for (let i = 0; i < n; i++) {
          const p = document.createElement("div");
          p.className = "gk-p"; p.style.cssText = `left:${x}px;top:${y}px;width:${size}px;height:${size}px;background:${cols[i % cols.length]};`;
          fx.appendChild(p); ps.push(p);
          if (reduce) continue;
          const a = Math.random() * 6.283, d = dist * (0.45 + Math.random() * 0.75);
          p.animate([{ transform: "translate(-50%,-50%) scale(1)", opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d}px)) scale(.2)`, opacity: 0 }],
            { duration: ms * (0.7 + Math.random() * 0.6), easing: "cubic-bezier(.1,.7,.3,1)", fill: "forwards" });
        }
        ctx.later(() => ps.forEach((p) => p.remove()), ms * 1.5);
      }
      function smoke(x, y, n) {
        const ps = [];
        for (let i = 0; i < n; i++) {
          const p = document.createElement("div");
          const sz = u * (0.22 + Math.random() * 0.2);
          p.className = "gk-p"; p.style.cssText = `left:${x + (Math.random() - 0.5) * u * 0.6}px;top:${y}px;width:${sz}px;height:${sz}px;background:#5b5b66;border:3px solid #111;`;
          fx.appendChild(p); ps.push(p);
          if (!reduce) p.animate([{ transform: "translate(-50%,-50%) scale(.4)", opacity: 0.9 }, { transform: `translate(-50%, calc(-50% - ${u * (0.8 + Math.random() * 0.8)}px)) scale(1.6)`, opacity: 0 }],
            { duration: 1100 + Math.random() * 700, delay: i * 90, easing: "ease-out", fill: "both" });
        }
        ctx.later(() => ps.forEach((p) => p.remove()), 2400 + n * 90);
      }
      function boom(x, y, size) {
        const mk = (sz, bg, delay, rot) => {
          const b = document.createElement("div");
          b.className = "gk-boom"; b.style.cssText = `left:${x}px;top:${y}px;width:${sz}px;height:${sz}px;background:${bg};clip-path:${STAR};`;
          fx.appendChild(b);
          if (!reduce) b.animate([{ transform: "translate(-50%,-50%) scale(.1) rotate(0)", opacity: 1 }, { transform: `translate(-50%,-50%) scale(1) rotate(${rot}deg)`, opacity: 1, offset: 0.35 }, { transform: `translate(-50%,-50%) scale(1.15) rotate(${rot * 1.4}deg)`, opacity: 0 }],
            { duration: 700, delay, easing: "ease-out", fill: "both" });
          ctx.later(() => b.remove(), 900 + delay);
        };
        mk(size, "radial-gradient(circle, #fff 0 14%, #ffe14d 16% 34%, #ff8a1f 36% 60%, #e0331f 62%)", 0, 40);
        mk(size * 0.62, "radial-gradient(circle, #fff 0 24%, #ffe14d 26%)", 70, -50);
        burst(x, y, ["#ffe14d", "#ff8a1f", "#e0331f", "#333"], 14, size * 0.9, Math.max(8, size * 0.09), 800);
        noise(0.5, "lowpass", 1600, 120, 0.55); tone(70, 0.4, "square", 0.14); sweep(220, 40, 0.5, "sawtooth", 0.1);
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
        for (let i = 0; i < 9; i++) {
          const l = document.createElement("div");
          l.className = "gk-sl";
          l.style.cssText = `left:${W * (0.2 + Math.random() * 0.9)}px;top:${H * (0.12 + Math.random() * 0.8)}px;width:${W * (0.12 + Math.random() * 0.2)}px;animation-delay:${-Math.random() * 0.3}s;`;
          fx.appendChild(l); ls.push(l);
        }
        ctx.later(() => ls.forEach((l) => l.remove()), ms);
      }
      function sparkles(n) {
        for (let i = 0; i < n; i++) {
          ctx.later(() => {
            if (phase === "done" && !finalWon) return;
            burst(P.sx + (Math.random() - 0.5) * u * 1.1, P.sy - u * (0.2 + Math.random() * 0.7), ["#fff", "#ffe14d", "#ff6fd8", "#6fe3ff"], 2, u * 0.4, u * 0.1, 600);
          }, i * 55);
        }
      }
      const toast = (cls, on, ms) => { P.el.classList.add(cls); if (on !== false) ctx.later(() => P.el.classList.remove(cls), ms); };
      const setPip = (i) => pipEls[i].classList.add("on");

      // ---------- The card and the question flow ----------
      function setCard() {
        card.firstChild.textContent = st.cardText;
        card.querySelector(".spk")?.remove();
        if (ctx.canSpeak && !st.listen) card.insertAdjacentHTML("beforeend", '<span class="spk">🔊</span>');
        card.classList.remove("next"); void card.offsetWidth; card.classList.add("next");
      }
      function replay() { if (!done) ctx.say(st.prompt); }
      function startQuestion(delay) {
        phase = "cruise"; tsT = 1; pmT = 1; kr = 1.6;
        ctx.later(spawnBoxes, delay / pace);
      }
      function spawnBoxes() {
        if (done) return;
        phase = "choose"; tsT = 0.1;
        const row = ctx.shuffle(st.row.slice());
        const bx = px + W * 0.62;
        boxes = row.map((o, i) => {
          const b = document.createElement("button");
          b.className = "gk-box";
          b.style.animationDelay = `${i * 0.07}s`;
          b.setAttribute("aria-label", TEXT.boxLabel(o.spoken || o.text));
          b.innerHTML = '<div class="bob"><div class="cube"></div><div class="pl"></div><span class="q a">?</span><span class="q b">?</span></div>';
          const pl = b.querySelector(".pl");
          pl.textContent = o.text;
          if (o.kind === "word") pl.style.fontSize = `calc(var(--bz) * ${Math.min(0.4, 0.66 / ([...o.text].length * 0.62)).toFixed(3)})`;
          const bo = { el: b, o, lane: i, x: bx + i * W * 0.07, dead: false };
          b.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); pick(bo); });
          world.appendChild(b);
          return bo;
        });
        sweep(900, 220, 0.45, "sine", 0.06);   // time slows down
        tone(659, 0.08, "triangle", 0.09); tone(880, 0.1, "triangle", 0.09, 0.09);
        ctx.say(st.prompt);
      }
      function pick(b) {
        if (phase !== "choose" || done || ctx.ended || b.dead) return;
        phase = "approach"; chosen = b;
        boxes.forEach((o) => { o.dead = true; if (o !== b) o.el.classList.add("used"); });
        P.lane = b.lane; tsT = 1; pmT = 2.2; kr = 2.4;
        sweep(300, 950, 0.4, "sawtooth", 0.07);
      }
      function hitBox() {
        const b = chosen;
        phase = "event"; pmT = 1; tsT = 1;
        b.el.classList.add("pop");
        burst(sx(b.x), laneY(b.lane) - u * 0.5, ["#ff4d6d", "#ffd23f", "#5ee07a", "#3ac8ff", "#a06bff"], 16, u * 0.9, u * 0.12, 700);
        tone(784, 0.08, "triangle", 0.1); tone(1175, 0.12, "triangle", 0.1, 0.07);
        ctx.later(() => b.el.remove(), 380);
        boxes.forEach((o) => { if (o !== b) ctx.later(() => o.el.remove(), 300); });
        if (b.o.right) { onRight(); } else { onWrong(); }
      }
      function nextQuestion() {
        if (done) return;
        si++; st = S[si];
        mood(null);
        setCard();
        tone(98, 0.08, "square", 0.1); tone(147, 0.08, "square", 0.1, 0.16);
        startQuestion(700);
      }

      // ---------- The good items ----------
      function onRight() {
        hits++; setPip(hits - 1);
        if (chosen.o.kind === "pic") ctx.say(chosen.o.spoken);
        setRanks(); mood("cheer");
        if (hits === 1) rocket(); else if (hits === 2) banana(); else star();
      }
      function rocket() {
        itemPop("🚀"); word(TEXT.rocket, false, P.sx, P.sy - u * 1.6);
        [523, 659, 784].forEach((f, i) => tone(f, 0.1, "triangle", 0.1, i * 0.08));
        ctx.later(() => {
          P.el.classList.add("boost"); pmT = 3.2; kr = 3.4; speedLines(1300 / pace);
          sweep(180, 1400, 0.9, "sawtooth", 0.08); noise(0.9, "bandpass", 600, 2400, 0.14);
          word(TEXT.zoom, false, P.sx + u * 1.2, P.sy - u * 1.2, true);
        }, 450 / pace);
        ctx.later(() => { pmT = 1; kr = 1.6; }, 1500 / pace);
        ctx.later(() => P.el.classList.remove("boost"), 1900 / pace);
        ctx.later(nextQuestion, 2100 / pace);
      }
      function banana() {
        itemPop("🍌"); word(TEXT.banana, false, P.sx, P.sy - u * 1.6);
        [523, 659].forEach((f, i) => tone(f, 0.1, "triangle", 0.1, i * 0.09));
        ctx.later(() => {
          // Toss the peel out behind you; the driver behind comes up fast and slips on it.
          const b = document.createElement("div");
          b.className = "gk-ban"; b.textContent = "🍌";
          world.appendChild(b);
          ban = { el: b, t0: performance.now(), dur: 450 / pace, fx: px - u * 0.2, fy: P.y - u * 0.8, x: px - u * 0.25, landed: false };
          sweep(500, 250, 0.3, "triangle", 0.08);
          tsT = 0.15;
          RA.mode = "script"; RA.lane = P.lane; RA.rel = -W * 0.27; RA.relFrom = RA.rel; RA.sT = performance.now() + 250 / pace; RA.sDur = 600 / pace;
        }, 500 / pace);
      }
      function bananaHit() {
        RA.mode = "follow"; RA.off = RA.rel; RA.pen = 0; kr = 1.0; ctx.later(() => { RA.pen = -W * 1.2; kr = 0.9; }, 1300 / pace);
        RA.el.classList.add("slip", "dz");
        if (ban) { ban.el.classList.add("peel"); const e = ban.el; ctx.later(() => e.remove(), 800); ban = null; }
        word(TEXT.whoa, true, sx(RA.x), RA.sy - u * 1.2, true);
        burst(sx(RA.x), RA.sy - u * 0.6, ["#ffe14d", "#fff", "#ff6fd8"], 10, u * 0.9, u * 0.1, 800);
        sweep(900, 200, 0.7, "sine", 0.08); noise(0.1, "lowpass", 800, 300, 0.4);
        tsT = 1;
        ctx.later(() => RA.el.classList.remove("slip"), 1100);
        ctx.later(() => RA.el.classList.remove("dz"), 2300);
        ctx.later(() => { kr = 1.6; }, 3200);
        ctx.later(nextQuestion, 1300 / pace);
      }
      function star() {
        done = true; phase = "final"; ctx.freezeTimer();
        P.el.classList.remove("small"); smallUntil = 0;
        itemPop("⭐"); word(TEXT.star, false, P.sx, P.sy - u * 1.7, true);
        [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.12, "triangle", 0.1, i * 0.07));
        fin = mkFinish(px + W * 1.2);
        ctx.later(() => {
          P.el.classList.add("star", "boost"); pmT = 2.6; kr = 3; speedLines(2400 / pace); sparkles(40);
          sweep(200, 1600, 1.2, "sawtooth", 0.07);
        }, 600 / pace);
      }
      function winRace() {
        finalWon = true; pmT = 0.7; mood("cheer");
        ctx.win();
        word(TEXT.win, false, W * 0.5, H * 0.3, true);
        ctx.confetti(fx, W * 0.5, H * 0.3, { count: 110 });
        [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.14, "triangle", 0.12, i * 0.09));
        ctx.say(st.answer);
        ctx.later(() => { pmT = 0; }, 1000);
      }

      // ---------- The bad items ----------
      function onWrong() {
        misses++; setPip(3 + misses - 1);
        setRanks(); mood("sad");
        ctx.say(st.answer);
        boxes.forEach((o) => { if (o.o.right && o !== chosen) { /* (the right box already vanished) */ } });
        if (misses === 1) bomb(); else if (misses === 2) lightning(); else blueRocket();
      }
      function bomb() {
        itemPop("💣"); word(TEXT.bomb, true, P.sx, P.sy - u * 1.7);
        tone(880, 0.05, "square", 0.08); tone(880, 0.05, "square", 0.08, 0.12);
        ctx.later(() => {
          boom(P.sx, P.sy - u * 0.5, u * 2.1); shake(450, 7); flash("#fff6c9", 300);
          P.el.classList.add("spin", "dz"); pmT = 0.15; kr = 2.4;
          word(TEXT.boom, true, P.sx + u * 0.4, P.sy - u * 1.5, true);
          smoke(P.sx, P.sy - u * 0.5, 4);
        }, 380 / pace);
        ctx.later(() => { P.el.classList.remove("spin"); pmT = 1; }, 1450 / pace);
        ctx.later(() => P.el.classList.remove("dz"), 2000 / pace);
        ctx.later(() => { kr = 1.6; nextQuestion(); }, 1900 / pace);
      }
      function lightning() {
        itemPop("⚡"); word(TEXT.zap, true, P.sx, P.sy - u * 1.7);
        tone(1200, 0.05, "sawtooth", 0.08); tone(1200, 0.05, "sawtooth", 0.08, 0.1);
        ctx.later(() => {
          const bolt = document.createElement("div");
          bolt.className = "gk-bolt"; bolt.style.cssText = `left:${P.sx}px;top:0;width:${u * 0.9}px;height:${P.sy - u * 0.2}px;`;
          fx.appendChild(bolt); ctx.later(() => bolt.remove(), 520);
          flash("#fff", 350); shake(350, 6);
          noise(0.35, "highpass", 1500, 600, 0.45); sweep(2400, 120, 0.4, "sawtooth", 0.12);
          P.el.classList.add("zapped", "dz");
          burst(P.sx, P.sy - u * 0.5, ["#ffe14d", "#fff"], 14, u * 0.9, u * 0.1, 600);
          ctx.later(() => P.el.classList.remove("zapped"), 450);
          ctx.later(() => { P.el.classList.add("small"); sweep(900, 200, 0.35, "sine", 0.08); pmT = 0.6; }, 450);
          smallUntil = performance.now() + 3000 / pace;
        }, 400 / pace);
        ctx.later(nextQuestion, 1500 / pace);
      }
      function blueRocket() {
        done = true; phase = "final"; ctx.freezeTimer();
        pmT = 1; tsT = 0.5;
        word(TEXT.blue, true, W * 0.5, H * 0.3, true);
        siren.classList.add("on");
        fin = mkFinish(px + W * 0.62);
        // Beep beep: a warning, the shadow grows on you, then the blue rocket drops.
        const wn = document.createElement("div"); wn.className = "gk-warn"; wn.textContent = "⚠️"; wn.style.cssText = `left:${P.sx}px;top:${P.sy - u * 1.35}px;`; fx.appendChild(wn);
        const sh = document.createElement("div"); sh.className = "gk-shadow"; sh.style.cssText = `left:${P.sx}px;top:${P.sy - u * 0.05}px;width:${u * 0.3}px;height:${u * 0.1}px;`; fx.appendChild(sh);
        if (!reduce) sh.animate([{ width: `${u * 0.3}px`, height: `${u * 0.1}px` }, { width: `${u * 1.5}px`, height: `${u * 0.4}px` }], { duration: 1000 / pace, easing: "ease-in", fill: "forwards" });
        for (let i = 0; i < 4; i++) { tone(1000, 0.1, "square", 0.09, i * 0.22); tone(750, 0.1, "square", 0.09, i * 0.22 + 0.11); }
        const br = document.createElement("div");
        br.className = "gk-br";
        br.innerHTML = '<i class="fl"></i><i class="fin a"></i><i class="fin b"></i><div class="bd"></div><i class="nose"></i><i class="ey l"></i><i class="ey r"></i><i class="br l"></i><i class="br r"></i><i class="mo"></i>';
        const bw = u * 1.5, bh = u * 0.56, fallMs = 650 / pace, startAt = performance.now() + 750 / pace;
        br.style.cssText = `left:${P.sx - bw / 2}px;top:${-bw}px;rotate:90deg;opacity:0;`;
        fx.appendChild(br);
        sweep(1800, 300, 0.8, "sawtooth", 0.07, 0.7 / pace);
        ctx.later(() => {
          br.style.opacity = "1";
          const t0 = performance.now(), y0 = -bw, y1 = P.sy - u * 0.45 - bw / 2 + bh * 0;
          (function fall(now) {
            const k = Math.min(1, (now - t0) / fallMs);
            br.style.top = `${y0 + (y1 - y0) * k * k}px`;
            br.style.left = `${P.sx - bw / 2}px`;
            if (k < 1) { ctx.raf(fall); return; }
            br.remove(); wn.remove(); sh.remove(); siren.classList.remove("on");
            impact();
          })(t0);
        }, 750 / pace);
      }
      function impact() {
        boom(P.sx, P.sy - u * 0.5, u * 4.6); flash("#fff", 700); shake(900, 12);
        ctx.later(() => boom(P.sx + u * 0.4, P.sy - u * 0.9, u * 2.8), 160);
        P.el.classList.remove("small", "boost", "star"); P.el.classList.add("blown", "dz");
        ctx.later(() => { P.el.classList.add("char"); P.el.classList.remove("dz"); smoke(P.sx, P.sy - u * 0.6, 8); }, 1400);
        pmT = 0; tsT = 1; smallUntil = 0;
        word(TEXT.oops, true, W * 0.5, H * 0.28, true);
        // Everybody zooms past, and over the finish line.
        ctx.later(() => {
          kr = 2.6;
          RA.off = W * 1.15; RB.off = W * 1.55; RC.off = W * 1.95;
          RA.pen = 0; RB.pen = 0; RC.pen = 0;
          sweep(300, 1000, 0.9, "sawtooth", 0.07);
          ctx.later(() => sweep(300, 1000, 0.9, "sawtooth", 0.07), 220);
        }, 900 / pace);
        ctx.later(() => { pmT = 0.28; }, 2400 / pace);
      }
      function lose() {
        if (finalWon || ctx.ended) return;
        mood("sad");
        ctx.lose();
        ctx.say(st.answer);
      }

      // ---------- The finish line ----------
      function mkFinish(x) {
        const el = document.createElement("div");
        el.className = "gk-fin";
        el.innerHTML = '<div class="pole l"></div><div class="pole r"></div><div class="bn">FINISH</div><div class="ln"></div>';
        world.insertBefore(el, world.firstChild);
        return { el, x };
      }

      // ---------- The loop ----------
      let last = null, bgx = 0, holdUntil = 0, heldFor = 0;
      function frame(t) {
        const now = performance.now();
        const dt = last == null ? 0 : Math.min(0.05, (t - last) / 1000);
        last = t;
        // time slows while you choose
        if (phase === "choose" && boxes.length) tsT = Math.min(...boxes.map((q) => q.x)) - px > W * 0.36 ? 0.1 : 0;
        ts += (tsT - ts) * Math.min(1, dt * 5);
        pm += (pmT - pm) * Math.min(1, dt * 4);
        const dx = V() * pm * ts * dt;
        px += dx;
        wheelA += (Math.max(dx, V() * 0.06 * dt) / (u * 0.17)) * 57;
        cam += (px - W * 0.3 - cam) * Math.min(1, dt * 8);
        // keep the clock (nearly) still while you choose and while things happen; a 25 s cap so a nap still times out
        if ((phase === "choose" || phase === "approach" || phase === "event" || phase === "final") && !ctx.demo && !ctx.ended) {
          if (phase !== "choose" || heldFor < 25) {
            if (now >= holdUntil) { ctx.pauseTimer(300); holdUntil = now + 300; }
            if (phase === "choose") heldFor += dt;
          }
        }
        // background layers
        bgx = -cam;
        view.style.setProperty("--bx", `${(bgx % 5000).toFixed(1)}px`);
        sky.forEach(([el, q]) => { const f = q === ".gk-clouds" ? 0.05 : q === ".gk-hills" ? 0.12 : q === ".gk-trees" ? 0.3 : 0.7; el.style.setProperty("--bx", `${((-cam * f) % 5000).toFixed(1)}px`); });
        // you
        P.x = px;
        // small again?
        if (smallUntil && now > smallUntil && P.el.classList.contains("small")) { smallUntil = 0; P.el.classList.remove("small", "dz"); pmT = 1; sweep(300, 900, 0.3, "sine", 0.08); mood(null); }
        // rivals
        RIV.forEach((r) => {
          if (r.mode === "script") {
            const k = Math.max(0, Math.min(1, (now - r.sT) / r.sDur));
            const tgtRel = (ban ? ban.x : px - u) - px;
            r.rel = r.relFrom + (tgtRel - r.relFrom) * ease(k);
            if (k >= 1) { bananaHit(); }
          } else {
            r.rel += (r.off + r.pen - r.rel) * Math.min(1, dt * kr);
          }
          r.x = px + r.rel;
        });
        // lanes
        [P, ...RIV].forEach((k, i) => {
          const wob = i ? Math.sin(now / 700 + i * 2) * H * 0.008 : 0;
          k.y += (laneY(k.lane) + wob - k.y) * Math.min(1, dt * 7);
          k.sx = sx(k.x); k.sy = k.y;
          const vis = k.sx > -u * 1.5 && k.sx < W + u * 1.5;
          k.el.style.visibility = vis ? "visible" : "hidden";
          if (vis) {
            k.el.style.transform = `translate(${(k.sx - u / 2).toFixed(1)}px, ${(k.y - u * 0.97).toFixed(1)}px)`;
            k.el.style.zIndex = String(Math.round(k.y));
            k.wheels.forEach((w) => { w.style.rotate = `${wheelA.toFixed(1)}deg`; });
          }
        });
        // item boxes
        boxes.forEach((b) => {
          b.el.style.transform = `translate(${(sx(b.x) - u * 0.33).toFixed(1)}px, ${(laneY(b.lane) - u * 0.12 - u * 0.66).toFixed(1)}px)`;
          b.el.style.zIndex = String(Math.round(laneY(b.lane)) - 1);
        });
        if (phase === "approach" && chosen && chosen.x - px <= u * 0.45) hitBox();
        // the banana
        if (ban) {
          if (!ban.landed) {
            const k = Math.min(1, (now - ban.t0) / ban.dur), gy = laneY(P.lane) - u * 0.12;
            const x = ban.fx + (ban.x - ban.fx) * k, y = ban.fy + (gy - ban.fy) * k - Math.sin(k * Math.PI) * u * 0.9;
            ban.el.style.transform = `translate(${(sx(x) - u * 0.23).toFixed(1)}px, ${(y - u * 0.4).toFixed(1)}px) rotate(${(k * 540).toFixed(0)}deg)`;
            ban.cy = gy; if (k >= 1) ban.landed = true;
          } else ban.el.style.transform = `translate(${(sx(ban.x) - u * 0.23).toFixed(1)}px, ${(ban.cy - u * 0.4).toFixed(1)}px)`;
          ban.el.style.zIndex = String(Math.round(ban.cy || 0) - 2);
        }
        // the finish line
        if (fin) {
          fin.el.style.transform = `translate(${(sx(fin.x) - u * 1.3).toFixed(1)}px, 0)`;
          if (!finalWon && done && px >= fin.x && P.el.classList.contains("star")) winRace();
          if (phase === "final" && !P.el.classList.contains("star")) {
            RIV.forEach((r) => {
              if (!r.crossed && r.x >= fin.x) {
                r.crossed = true;
                word(TEXT.places[Math.min(2, place)], true, sx(fin.x), H * 0.3, false); place++;
                tone(660 - place * 80, 0.12, "triangle", 0.1);
                if (RIV.every((q) => q.crossed)) ctx.later(lose, 900);
              }
            });
          }
        }
        // sparkles on the star kart
        if (P.el.classList.contains("star") && Math.random() < 0.5) burst(P.sx + (Math.random() - 0.5) * u, P.sy - u * (0.2 + Math.random() * 0.7), ["#fff", "#ffe14d", "#ff6fd8", "#6fe3ff"], 1, u * 0.3, u * 0.1, 500);
        ctx.raf(frame);
      }

      // ---------- Go ----------
      ctx.onTimeout(() => {
        done = true;
        boxes.forEach((b) => { if (!b.dead || true) b.el.classList.add(b.o.right ? "right" : "bad"); });
        P.el.classList.add("dz"); mood("sad");
        ctx.say(st.answer);
      });
      function onKey(e) {
        const i = parseInt(e.key, 10) - 1;
        if (i >= 0 && i < boxes.length) { e.preventDefault(); pick(boxes[i]); }
        else if (e.key === " ") { e.preventDefault(); replay(); }
      }
      document.addEventListener("keydown", onKey);

      layout();
      px = W * 0.3; cam = 0; P.x = px; P.lane = 1; P.y = laneY(1);
      RIV.forEach((r) => { r.y = laneY(r.lane); });
      setRanks(); RIV.forEach((r) => { r.rel = r.off; });
      setCard();
      const ro = new ResizeObserver(layout);
      ro.observe(view);
      const revealMs = ctx.reveal(card) || 0;
      startQuestion(900 + revealMs * pace);
      ctx.raf(frame);

      // Tutorial: each time the boxes roll in, point at the card, then tap the right box.
      ctx.tutorial(S.map((s) => s.target), async (f) => {
        for (let n = 0; n < GOAL && !finalWon; n++) {
          await f.until(() => phase === "choose" && si === n && boxes.length > 0, 9000);
          await f.point(card, n ? 450 : 800);
          await f.tap(() => (boxes.find((b) => b.o.right && !b.dead) || boxes[0] || { el: card }).el);
          await f.until(() => hits > n || finalWon, 4000);
        }
        await f.until(() => ctx.ended, 5000);
      });
      return () => { done = true; ro.disconnect(); document.removeEventListener("keydown", onKey); };
    },
  });
})();
