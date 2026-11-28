// SNEAKY THIEF — the teacher's idea (an animation-heavy game like Go-Kart Race / Space Blitz / Beam Knight): a thief monster
// grabs a gold coin from a pedestal and walks away down a fancy hall. Three hiding places pop up (a fancy statue, a fancy vase
// on a stand, a fancy painting on the wall), each with an answer, and TIME SLOWS. The card names the target: tap the right
// hiding place and the thief ducks behind it; the other two vanish and two security guards stroll past (HMM?) and carry on.
// Wrong place: the guards find him, a siren goes off and a cage drops on him (loss). Three safe hides: the thief spots the
// door at the end of the hall, runs for it gleefully with the coin, and the guards chase, fall behind and cry (win).
(function () {
  const TEXT = {
    name: { en: "Sneaky Thief" },
    icon: "🪙",
    howTo: { en: {
      steps: [
        ["👀", "Look at the card."],
        ["🪙", "The thief stole a coin! Tap the hiding place that matches!"],
        ["🚨", "The guards walk past. Pick wrong and they catch him!"],
      ],
      tips: ["Three good hiding places and the thief escapes!", "Wrong place: siren and a cage 🚨", "Tap the card to hear it again."],
    } },
    instruction: { en: "HIDE THE THIEF!" },
    cardLabel: "The card. Tap to hear it again.",
    itemLabel: (t) => `Hiding place ${t}`,
    mine: "MINE!", hmm: "HMM…", phew: "PHEW!", found: "THERE!", siren: "WEE-OO WEE-OO!", caught: "CAUGHT!", door: "A DOOR!", yay: "WHEEE!", cry: "WAAAH!", stop: "STOP!",
  };
  const GOAL = 3;

  const CSS = `
  .thf { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:6px; padding-bottom:6px; }
  .thf-top { flex:none; display:flex; align-items:center; gap:10px; }
  .thf-card { padding:4px 16px; background:#fff; border:5px solid #111; border-radius:16px; box-shadow:0 5px 0 #111; font:inherit; color:#111; font-size:clamp(1.8rem, 8vw, 2.8rem);
    line-height:1.05; cursor:pointer; touch-action:manipulation; display:flex; align-items:center; gap:6px; white-space:nowrap; }
  .thf-card .spk { font-size:.45em; }
  .thf-card.next { animation:thf-next .35s cubic-bezier(.2,1.8,.4,1); }
  .thf-pips { display:flex; gap:4px; }
  .thf-pip { width:30px; height:30px; border:3px solid #111; border-radius:50%; background:#ffe27a; display:flex; align-items:center; justify-content:center; font-size:16px; line-height:1; transition:all .25s; }
  .thf-pip.off { filter:grayscale(1); opacity:.35; background:#fff; }
  .thf-view { position:relative; flex:1; min-height:0; width:100%; max-width:760px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111; background:#2a1018; touch-action:manipulation; }
  .thf-bg { position:absolute; inset:0; width:100%; height:100%; display:block; }
  .thf-deco, .thf-world, .thf-fx { position:absolute; inset:0; pointer-events:none; }
  .thf-fx { z-index:100000; overflow:hidden; }
  .thf-deco > *, .thf-world > * { position:absolute; left:0; top:0; }
  /* The door at the end of the hall */
  .thf-door { width:calc(var(--u) * .95); height:calc(var(--u) * 1.5); }
  .thf-door .lt { position:absolute; inset:6% 4% 0; border-radius:50% 50% 0 0 / 30% 30% 0 0; background:radial-gradient(circle at 50% 60%, #fff 0 20%, #ffe98a 45%, #ffb347 100%); opacity:0; transition:opacity .4s; }
  .thf-door .dl, .thf-door .dr { position:absolute; top:6%; bottom:0; width:48%; background:linear-gradient(90deg, #c9961f, #f4d05a 50%, #c9961f); border:3px solid #111;
    transition:scale .7s cubic-bezier(.3,1.2,.4,1); }
  .thf-door .dl { left:4%; transform-origin:0 50%; border-radius:50% 0 0 0 / 22% 0 0 0; }
  .thf-door .dr { right:4%; transform-origin:100% 50%; border-radius:0 50% 0 0 / 0 22% 0 0; }
  .thf-door .dl::after, .thf-door .dr::after { content:""; position:absolute; left:18%; right:18%; top:22%; bottom:12%; border:3px solid #8a5f0e; border-radius:30% 30% 4% 4%; }
  .thf-door .kn { position:absolute; top:56%; width:9%; aspect-ratio:1; border-radius:50%; background:#fff6c4; border:2px solid #111; z-index:3; }
  .thf-door .kn.a { left:36%; } .thf-door .kn.b { right:36%; }
  .thf-door.open .dl, .thf-door.open .dr { scale:.12 1; }
  .thf-door.open .lt, .thf-door.glow .lt { opacity:1; }
  .thf-door.glow { filter:drop-shadow(0 0 10px #ffe14d) drop-shadow(0 0 22px #ffb347); }
  .thf-door .ex { position:absolute; left:14%; right:14%; top:-14%; height:11%; background:#14a85a; border:3px solid #111; border-radius:6px; color:#fff; font-size:calc(var(--u) * .13); display:flex; align-items:center; justify-content:center; letter-spacing:1px; line-height:1; }
  .thf-door.glow .ex { animation:thf-blink .3s steps(1) infinite alternate; }
  /* Chandeliers */
  .thf-ch { width:calc(var(--u) * 1); height:calc(var(--u) * 1.4); transform-origin:50% 0; animation:thf-sway 3.4s ease-in-out infinite alternate; }
  .thf-ch i { position:absolute; display:block; }
  .thf-ch .cn { left:49%; width:2%; top:0; height:34%; background:#7a5a1a; }
  .thf-ch .cr { left:30%; width:40%; top:32%; height:10%; background:linear-gradient(90deg,#b8860b,#ffe27a 50%,#b8860b); border:2px solid #111; border-radius:30% 30% 50% 50%; }
  .thf-ch .ar { left:6%; width:88%; top:40%; height:14%; border:3px solid #b8860b; border-top:0; border-radius:0 0 50% 50%; }
  .thf-ch .bl { top:30%; width:16%; aspect-ratio:1; border-radius:50%; background:radial-gradient(circle,#fff 0 30%,#ffe98a 60%,#ffd23f); box-shadow:0 0 14px 6px rgba(255,220,100,.6); }
  .thf-ch .bl.a { left:0; top:44%; } .thf-ch .bl.b { left:42%; top:52%; } .thf-ch .bl.c { right:0; top:44%; } .thf-ch .bl.d { left:21%; top:50%; } .thf-ch .bl.e { right:21%; top:50%; }
  /* The coin and its pedestal */
  .thf-ped { width:calc(var(--u) * 1.1); height:calc(var(--u) * 1.15); }
  .thf-ped .pb { position:absolute; left:6%; right:6%; bottom:0; height:70%; background:linear-gradient(90deg,#d8cdb4,#f6efde 45%,#cfc3a6); border:4px solid #111; border-radius:6% 6% 3% 3%; }
  .thf-ped .pt { position:absolute; left:0; right:0; bottom:66%; height:9%; background:linear-gradient(180deg,#fff,#d8cdb4); border:4px solid #111; border-radius:20%; }
  .thf-ped .cu { position:absolute; left:20%; right:20%; bottom:73%; height:11%; background:#c0182c; border:3px solid #111; border-radius:50% 50% 20% 20%; }
  .thf-coin, .thf-ped .pc { position:absolute; width:calc(var(--u) * .4); height:calc(var(--u) * .4); border-radius:50%; background:radial-gradient(circle at 36% 30%, #fff8c8 0 14%, #ffd23f 42%, #d69a0a); border:3px solid #111; box-shadow:0 0 12px 3px rgba(255,220,80,.8); }
  .thf-coin::after, .thf-ped .pc::after { content:""; position:absolute; inset:20%; border:3px solid #a8730a; border-radius:50%; }
  .thf-ped .pc { left:calc(50% - var(--u) * .2); bottom:calc(var(--u) * .93); animation:thf-glint .7s ease-in-out infinite alternate; }
  .thf-ped .pc.gone { display:none; }
  /* The hiding places. Each box is 1.7 s wide and 2.6 s tall (s = the item's size at its depth). */
  .thf-it { width:calc(var(--s) * 1.7); height:calc(var(--s) * 2.6); transform-origin:50% 100%; padding:0; border:0; background:none; font:inherit; cursor:pointer; touch-action:manipulation; pointer-events:none; will-change:transform; }
  .thf-it.live { pointer-events:auto; }
  .thf-it .in { position:absolute; inset:0; transform-origin:50% 100%; animation:thf-pop .5s cubic-bezier(.2,1.8,.4,1) both, thf-float 2.6s ease-in-out .5s infinite alternate; }
  .thf-it .in > *, .thf-pfr .in > * { position:absolute; box-sizing:border-box; }
  .thf-it.gone .in { animation:thf-vanish .45s ease-in both; }
  .thf-it.right .in { filter:drop-shadow(0 0 6px #fff) drop-shadow(0 0 14px #2fe07a); }
  .thf-it .pl { background:#fff; border:3px solid #111; border-radius:12%; box-shadow:0 0 0 3px #d9a520; display:flex; align-items:center; justify-content:center; color:#111; line-height:1; white-space:nowrap; z-index:5; }
  .thf-it.flip .pl { animation:thf-flip .35s ease-out; }
  /* statue */
  .st-pd { left:12%; width:76%; bottom:0; height:26%; background:linear-gradient(90deg,#d6cdb8,#f7f1e2 45%,#cdc1a4); border:4px solid #111; border-radius:4%; }
  .st-pt { left:6%; width:88%; bottom:24%; height:6%; background:linear-gradient(180deg,#fff,#d6cdb8); border:4px solid #111; border-radius:20%; z-index:1; }
  .st-bd { left:30%; width:40%; bottom:30%; height:30%; background:linear-gradient(100deg,#dcd5c6,#fbf7ec 40%,#cfc7b3); border:4px solid #111; border-radius:30% 30% 10% 10%; }
  .st-bd::after { content:""; position:absolute; left:10%; right:-8%; top:34%; height:18%; background:rgba(0,0,0,.12); rotate:-24deg; border-radius:40%; }
  .st-a1 { left:10%; width:24%; bottom:50%; height:12%; background:#efe9da; border:4px solid #111; border-radius:50%; rotate:-52deg; }
  .st-a2 { right:10%; width:24%; bottom:42%; height:12%; background:#efe9da; border:4px solid #111; border-radius:50%; rotate:34deg; }
  .st-hr { left:33%; width:34%; bottom:76%; height:14%; background:#cfc7b3; border:4px solid #111; border-radius:50%; }
  .st-hd { left:35%; width:30%; bottom:62%; height:20%; background:linear-gradient(100deg,#ddd6c7,#fbf7ec 40%,#d0c8b4); border:4px solid #111; border-radius:46% 46% 50% 50%; z-index:1; }
  .st-ey { top:26%; width:26%; aspect-ratio:1; background:#fff; border:3px solid #111; border-radius:50%; overflow:hidden; }
  .st-ey.a { left:12%; } .st-ey.b { right:12%; top:34%; width:20%; }
  .st-ey i { position:absolute; left:34%; top:12%; width:44%; aspect-ratio:1; background:#111; border-radius:50%; }
  .st-mo { left:20%; right:20%; bottom:12%; height:20%; background:#8f8672; border:3px solid #111; border-radius:30% 30% 60% 60%; }
  .st-pd .pl, .pt-pl { }
  .st-plq { left:20%; width:60%; bottom:3.5%; height:15%; }
  /* vase on a stand */
  .vs-lg { bottom:0; height:30%; width:5%; background:linear-gradient(90deg,#b8860b,#ffe27a,#b8860b); border:3px solid #111; }
  .vs-lg.a { left:24%; rotate:6deg; } .vs-lg.b { left:47.5%; } .vs-lg.c { right:24%; rotate:-6deg; }
  .vs-tb { left:16%; width:68%; bottom:27%; height:5%; background:linear-gradient(180deg,#ffe27a,#b8860b); border:4px solid #111; border-radius:20%; z-index:1; }
  .vs-h { width:22%; height:26%; border:6px solid #e0a82a; border-radius:50%; bottom:56%; z-index:0; }
  .vs-h.a { left:-1%; } .vs-h.b { right:-1%; }
  .vs-bd { left:8%; width:84%; bottom:32%; height:54%; background:radial-gradient(circle at 34% 24%, #fff 0 12%, #eef3ff 40%, #b3c4ee); border:4px solid #111; border-radius:50% 50% 46% 46% / 62% 62% 38% 38%; z-index:2; overflow:hidden; }
  .vs-bd::before { content:""; position:absolute; left:0; right:0; top:14%; height:12%; background:repeating-linear-gradient(90deg,#2e55c8 0 14%,#fff 14% 20%); border-block:3px solid #d9a520; }
  .vs-bd::after { content:""; position:absolute; left:0; right:0; bottom:10%; height:14%; background:repeating-linear-gradient(90deg,#2e55c8 0 10%,#fff 10% 20%); border-block:3px solid #d9a520; }
  .vs-nk { left:36%; width:28%; bottom:82%; height:12%; background:linear-gradient(90deg,#c6d4f4,#fff 50%,#b3c4ee); border:4px solid #111; border-radius:10%; z-index:1; }
  .vs-rm { left:28%; width:44%; bottom:92%; height:6%; background:linear-gradient(180deg,#ffe27a,#b8860b); border:4px solid #111; border-radius:30%; z-index:1; }
  .vs-plq { left:24%; width:52%; bottom:52%; height:17%; z-index:3; }
  /* painting (the frame is a separate layer so the thief can stand between canvas and frame) */
  .pt-cv { left:8%; width:84%; bottom:26%; height:70%; background:radial-gradient(circle at 70% 26%, #fff6a8 0 9%, #ffd23f 10% 14%, transparent 15%), linear-gradient(180deg,#8fd0ff 0 56%, #5cb85c 56%); border:3px solid #111; overflow:hidden; }
  .pt-cv::before { content:""; position:absolute; left:-10%; width:80%; bottom:0; height:34%; background:#3f9a49; border-radius:50% 50% 0 0; }
  .pt-cv::after { content:""; position:absolute; right:-14%; width:70%; bottom:0; height:26%; background:#2f7f3b; border-radius:50% 50% 0 0; }
  .pt-plq { left:22%; width:56%; bottom:2%; height:16%; }
  .thf-pfr { width:calc(var(--s) * 1.7); height:calc(var(--s) * 2.6); transform-origin:50% 100%; pointer-events:none; }
  .thf-pfr .fr { left:0; width:100%; bottom:24%; height:76%; border:calc(var(--s) * .17) solid; border-color:#f6d65a #b8860b #f6d65a #b8860b; border-radius:4%; box-shadow:0 0 0 3px #111, inset 0 0 0 3px #111, 0 6px 0 3px rgba(0,0,0,.35); }
  .thf-pfr .fc { width:16%; aspect-ratio:1; background:radial-gradient(circle at 35% 30%,#fff2a0,#d9a520); border:3px solid #111; border-radius:50%; }
  .thf-pfr .fc.a { left:-5%; bottom:calc(100% - 26% - 7%); } .thf-pfr .fc.b { right:-5%; bottom:calc(100% - 26% - 7%); }
  .thf-pfr .fc.c { left:-5%; bottom:17%; } .thf-pfr .fc.d { right:-5%; bottom:17%; }
  .thf-pfr .in { position:absolute; inset:0; animation:thf-pop .5s cubic-bezier(.2,1.8,.4,1) both, thf-float 2.6s ease-in-out .5s infinite alternate; transform-origin:50% 100%; }
  .thf-pfr.gone .in { animation:thf-vanish .45s ease-in both; }
  .thf-pfr.static .in { animation:none; }
  /* Sprites */
  .thf-sp .in, .thf-sp .in > * { box-sizing:border-box; }
  .thf-sp { transform-origin:50% 100%; }
  .thf-sp .in { position:absolute; inset:0; transform-origin:50% 100%; }
  .thf-sp .in > * { position:absolute; }
  .thf-sp .hd > *, .thf-sp .fc > * { position:absolute; box-sizing:border-box; }
  .thf-sp .fc { inset:0; }
  .thf-sp.back .fc, .thf-sp:not(.back) .bk { display:none; }
  /* The thief: a green monster in a striped top, a beanie and an eye mask */
  .thf-th { width:calc(var(--u) * 1.2); height:calc(var(--u) * 1.5); }
  .thf-th .lg { bottom:0; width:22%; height:20%; background:#2a2438; border:3px solid #111; border-radius:40% 40% 30% 30%; }
  .thf-th .lg.a { left:26%; } .thf-th .lg.b { right:26%; }
  .thf-th .bd { left:16%; right:16%; top:40%; bottom:14%; background:repeating-linear-gradient(180deg,#1d1b27 0 calc(var(--u) * .1),#f1f1f1 calc(var(--u) * .1) calc(var(--u) * .2)); border:4px solid #111; border-radius:30% 30% 18% 18%; z-index:2; }
  .thf-th .ar { top:44%; width:17%; height:34%; background:#2a2a38; border:3px solid #111; border-radius:40%; transform-origin:50% 12%; z-index:3; }
  .thf-th .ar::after { content:""; position:absolute; left:8%; right:8%; bottom:-14%; aspect-ratio:1; background:#6bcf5a; border:3px solid #111; border-radius:50%; }
  .thf-th .ar.l { left:1%; } .thf-th .ar.r { right:1%; }
  .thf-th .ar { transition:rotate .3s; }
  .thf-th.up .ar.r, .thf-th.up.walk .ar.r { rotate:-155deg; animation:none; }
  .thf-th.reach .ar.r { rotate:-85deg; }
  .thf-th .sk { left:52%; width:48%; top:36%; height:42%; background:#b98a54; border:3px solid #111; border-radius:40% 40% 30% 30%; z-index:3; display:flex; align-items:center; justify-content:center; font-size:calc(var(--u) * .3); color:#4a2f10; }
  .thf-th:not(.back) .sk { display:none; }
  .thf-th .hd { left:8%; width:84%; top:2%; height:46%; background:radial-gradient(ellipse at 36% 28%, #a9ec96, #6bcf5a 55%, #4cae45); border:4px solid #111; border-radius:50% 50% 44% 44%; z-index:4; }
  .thf-th .cp { left:-2%; width:104%; top:-6%; height:34%; background:#23202e; border:4px solid #111; border-radius:50% 50% 12% 12%; z-index:3; }
  .thf-th .pp { left:40%; width:20%; aspect-ratio:1; top:-30%; background:#ff5a6e; border:3px solid #111; border-radius:50%; }
  .thf-th .mk { left:4%; right:4%; top:34%; height:30%; background:#16141c; border-radius:42%; }
  .thf-th .ey { top:30%; width:32%; aspect-ratio:1; background:#fff; border:3px solid #111; border-radius:50%; overflow:hidden; z-index:2; }
  .thf-th .ey.a { left:10%; } .thf-th .ey.b { right:10%; top:36%; width:26%; }
  .thf-th .ey i { position:absolute; left:30%; top:30%; width:44%; aspect-ratio:1; background:#111; border-radius:50%; }
  .thf-th.look .ey i { animation:thf-look .9s ease-in-out infinite alternate; }
  .thf-th .mo { left:26%; width:48%; bottom:7%; height:20%; background:#6a1a2a; border:3px solid #111; border-radius:20% 20% 60% 60%; z-index:2; }
  .thf-th.grin .mo { height:26%; background:#fff; }
  .thf-th .bs { left:0; right:0; top:36%; height:10%; background:#16141c; z-index:1; }
  .thf-th .ar .cn { position:absolute; left:50%; top:100%; width:calc(var(--u) * .38); aspect-ratio:1; margin:calc(var(--u) * -.19) 0 0 calc(var(--u) * -.19); border-radius:50%; background:radial-gradient(circle at 36% 30%, #fff8c8 0 14%, #ffd23f 42%, #d69a0a); border:3px solid #111; box-shadow:0 0 12px 3px rgba(255,220,80,.8); display:none; z-index:7; animation:thf-glint .7s ease-in-out infinite alternate; }
  .thf-th.has .cn { display:block; }
  .thf-th .trs { display:none; }
  .thf-th.sad .trs, .thf-g.cry .trs { display:block; }
  .trs b { position:absolute; top:46%; width:9%; height:30%; background:#5ac8ff; border:2px solid #111; border-radius:50%; animation:thf-tear .7s linear infinite; z-index:6; }
  .thf-th .trs b.a { left:17%; } .thf-th .trs b.b { right:17%; animation-delay:-.3s; }
  .thf-th.sad .mo { height:14%; border-radius:60% 60% 20% 20%; background:#6a1a2a; }
  .thf-th.walk .in { animation:thf-bob .34s ease-in-out infinite alternate; }
  .thf-th.walk .lg.a, .thf-g.walk .lg.a { animation:thf-step .34s ease-in-out infinite alternate; }
  .thf-th.walk .lg.b, .thf-g.walk .lg.b { animation:thf-step .34s ease-in-out infinite alternate-reverse; }
  .thf-th.walk .ar.l { animation:thf-swing .34s ease-in-out infinite alternate; } .thf-th.walk .ar.r { animation:thf-swing .34s ease-in-out infinite alternate-reverse; }
  .thf-th.run .in, .thf-g.run .in { animation-duration:.2s; }
  .thf-th.run .lg.a, .thf-th.run .lg.b, .thf-g.run .lg.a, .thf-g.run .lg.b { animation-duration:.2s; }
  .thf-th.joy .in { animation:thf-hop .24s ease-in-out infinite alternate; }
  .thf-th.walk.joy .in { animation:thf-hop .24s ease-in-out infinite alternate; }
  .thf-th.shk .in, .thf-g.shk .in { animation:thf-shake .06s linear infinite alternate; }
  .thf-th.wait .in { animation:thf-hop .9s ease-in-out infinite alternate; }
  .thf-th.hide .in { scale:1 .86; }
  /* The guards: tall, navy, a handlebar moustache and a flashlight */
  .thf-g { width:calc(var(--u) * 1.3); height:calc(var(--u) * 1.95); }
  .thf-g .lg { bottom:0; width:22%; height:22%; background:linear-gradient(180deg,#26346b 0 60%,#111 60%); border:3px solid #111; border-radius:30%; }
  .thf-g .lg.a { left:24%; } .thf-g .lg.b { right:24%; }
  .thf-g .bd { left:12%; right:12%; top:38%; bottom:16%; background:linear-gradient(90deg,#26346b,#3a4c9a 45%,#26346b); border:4px solid #111; border-radius:28% 28% 14% 14%; z-index:2; }
  .thf-g .blt { left:12%; right:12%; top:72%; height:6%; background:#111; z-index:3; }
  .thf-g .blt::after { content:""; position:absolute; left:42%; width:16%; top:-20%; bottom:-20%; background:#ffd23f; border:2px solid #111; }
  .thf-g .bn { width:6%; aspect-ratio:1; background:#ffd23f; border:2px solid #111; border-radius:50%; z-index:3; left:62%; }
  .thf-g .bn.a { top:50%; } .thf-g .bn.b { top:60%; }
  .thf-g .bgd { left:24%; top:46%; width:15%; aspect-ratio:1; background:#ffd23f; clip-path:polygon(50% 0,62% 36%,100% 38%,70% 60%,80% 100%,50% 76%,20% 100%,30% 60%,0 38%,38% 36%); z-index:3; }
  .thf-g .ar { top:41%; width:15%; height:34%; background:#2f3f86; border:3px solid #111; border-radius:40%; transform-origin:50% 12%; z-index:3; }
  .thf-g .ar::after { content:""; position:absolute; left:4%; right:4%; bottom:-12%; aspect-ratio:1; background:#fff; border:3px solid #111; border-radius:50%; }
  .thf-g .ar.l { left:0; } .thf-g .ar.r { right:0; }
  .thf-g .fl { left:93%; top:68%; width:20%; height:8%; background:#222; border:3px solid #111; border-radius:30%; z-index:6; }
  .thf-g .fl::before { content:""; position:absolute; right:-14%; top:-14%; bottom:-14%; width:28%; background:#fff6a0; border:2px solid #111; border-radius:30%; }
  .thf-g .bm { position:absolute; left:100%; top:50%; width:calc(var(--u) * 2.1); height:calc(var(--u) * 1.1); margin-top:calc(var(--u) * -.55); transform-origin:0 50%; rotate:14deg;
    background:linear-gradient(90deg, rgba(255,250,170,.85), rgba(255,250,170,0)); clip-path:polygon(0 46%,100% 0,100% 100%,0 54%); animation:thf-sweep 1.1s ease-in-out infinite alternate; pointer-events:none; }
  .thf-g.lock .bm { animation:none; rotate:4deg; filter:brightness(1.4); }
  .thf-g.back .bm, .thf-g.nobeam .bm { display:none; }
  .thf-g .hd { left:12%; width:76%; top:6%; height:40%; background:radial-gradient(ellipse at 36% 28%, #ffe0bc, #f0c08f 60%, #d9a06c); border:4px solid #111; border-radius:50% 50% 46% 46%; z-index:4; }
  .thf-g .cp { left:-6%; width:112%; top:-10%; height:34%; background:linear-gradient(180deg,#3a4c9a,#26346b); border:4px solid #111; border-bottom:6px solid #ffd23f; border-radius:44% 44% 8% 8%; z-index:3; }
  .thf-g .cb { left:42%; width:16%; aspect-ratio:1; top:30%; background:#ffd23f; border:2px solid #111; clip-path:none; border-radius:50%; z-index:4; }
  .thf-g .vz { left:-4%; width:108%; top:21%; height:9%; background:#111; border-radius:50%; z-index:5; }
  .thf-g .ey { top:36%; width:26%; aspect-ratio:1; background:#fff; border:3px solid #111; border-radius:50%; overflow:hidden; z-index:2; }
  .thf-g .ey.a { left:15%; } .thf-g .ey.b { right:15%; top:40%; width:22%; }
  .thf-g .ey i { position:absolute; left:32%; top:30%; width:42%; aspect-ratio:1; background:#111; border-radius:50%; }
  .thf-g .br { top:31%; width:30%; height:6%; background:#111; border-radius:20%; z-index:3; }
  .thf-g .br.a { left:12%; rotate:14deg; } .thf-g .br.b { right:12%; rotate:-14deg; }
  .thf-g .ns { left:40%; width:20%; aspect-ratio:1; top:52%; background:#f08a8a; border:3px solid #111; border-radius:50%; z-index:3; }
  .thf-g .mu { top:66%; width:44%; height:16%; background:#5b5a63; border:3px solid #111; border-radius:50%; z-index:3; }
  .thf-g .mu.a { left:6%; rotate:12deg; } .thf-g .mu.b { right:6%; rotate:-12deg; }
  .thf-g .mo { left:36%; width:28%; bottom:2%; height:11%; background:#6a1a2a; border:3px solid #111; border-radius:30% 30% 60% 60%; z-index:2; }
  .thf-g .hr { left:6%; width:88%; top:30%; height:30%; background:#6c6a74; border-radius:30%; }
  .thf-g .hmmx { display:none; }
  .thf-g.alert .ey { scale:1.2; } .thf-g.alert .ey i { scale:.5; } .thf-g.alert .mo { height:24%; border-radius:50%; }
  .thf-g.hmm .hd { rotate:-8deg; } .thf-g.hmm .br.a { rotate:-6deg; translate:0 -30%; }
  .thf-g.laugh .in { animation:thf-hop .22s ease-in-out infinite alternate; } .thf-g.laugh .mo { height:22%; background:#fff; }
  .thf-g.shrug .ar { rotate:150deg; }
  .thf-g .trs b { top:48%; } .thf-g .trs b.a { left:20%; } .thf-g .trs b.b { right:20%; animation-delay:-.3s; }
  .thf-g .trs { display:none; }
  .thf-g.cry .ey { aspect-ratio:auto; height:9%; top:44%; } .thf-g.cry .ey i { display:none; }
  .thf-g.cry .mo { height:24%; border-radius:50%; background:#6a1a2a; animation:thf-wail .3s ease-in-out infinite alternate; }
  .thf-g.cry .br.a { rotate:-18deg; } .thf-g.cry .br.b { rotate:18deg; }
  .thf-g .swt { display:none; position:absolute; right:-4%; top:6%; font-size:calc(var(--u) * .4); z-index:8; animation:thf-hop .3s ease-in-out infinite alternate; }
  .thf-g.tired .swt { display:block; }
  .thf-g.walk .in { animation:thf-bob .34s ease-in-out infinite alternate; }
  .thf-g.walk .ar.l { animation:thf-swing .34s ease-in-out infinite alternate; } .thf-g.walk .ar.r { animation:thf-swing .34s ease-in-out infinite alternate-reverse; }
  .thf-g.slump .in { rotate:-6deg; }
  /* the cage */
  .thf-cage { width:calc(var(--u) * 1.5); height:calc(var(--u) * 1.75); transform-origin:50% 100%; }
  .thf-cage::before { content:""; position:absolute; inset:0 0 4%; border:6px solid #4d5566; border-bottom:0; border-radius:14% 14% 0 0; background:repeating-linear-gradient(90deg, #5d667a 0 7px, transparent 7px calc(100% / 6)); box-shadow:inset 0 0 0 2px #111, 0 0 0 2px #111; }
  .thf-cage::after { content:""; position:absolute; left:-4%; right:-4%; bottom:0; height:6%; background:#4d5566; border:3px solid #111; border-radius:20%; }
  /* effects */
  .thf-slow { position:absolute; inset:0; z-index:90000; pointer-events:none; opacity:0; transition:opacity .5s; background:radial-gradient(ellipse at 50% 58%, rgba(40,60,170,0) 38%, rgba(30,40,140,.5) 100%); }
  .thf-view.slow .thf-slow { opacity:1; animation:thf-slowp 1.6s ease-in-out infinite alternate; }
  .thf-siren { position:absolute; inset:0; z-index:95000; pointer-events:none; display:none; }
  .thf-view.sir .thf-siren { display:block; animation:thf-sir .5s steps(1) infinite; }
  .thf-flash { position:absolute; inset:0; z-index:99000; pointer-events:none; opacity:0; background:#fff; }
  .thf-word { position:absolute; transform:translate(-50%, -50%) rotate(-7deg); font-size:2.1rem; color:#fff; -webkit-text-stroke:2px #111; paint-order:stroke fill; text-shadow:0 4px 0 #111; white-space:nowrap; animation:thf-word 1.2s ease-out forwards; }
  .thf-word.bad { color:#ff5a6e; } .thf-word.big { font-size:2.8rem; color:#ffd400; } .thf-word.bad.big { color:#ff4d5e; } .thf-word.keep { animation:thf-wordk .35s ease-out both; }
  .thf-p { position:absolute; border-radius:50%; }
  .thf-mote { position:absolute; width:4px; height:4px; border-radius:50%; background:#ffe9a0; opacity:.5; animation:thf-mote 7s linear infinite; pointer-events:none; }
  @keyframes thf-next { from { scale:.6; } }
  @keyframes thf-blink { from { opacity:1; } to { opacity:.35; } }
  @keyframes thf-sway { from { rotate:-2.5deg; } to { rotate:2.5deg; } }
  @keyframes thf-glint { from { filter:brightness(1); } to { filter:brightness(1.35); } }
  @keyframes thf-pop { from { scale:0; rotate:-12deg; } }
  @keyframes thf-vanish { to { scale:0; rotate:18deg; opacity:0; } }
  @keyframes thf-float { to { translate:0 -3%; } }
  @keyframes thf-flip { from { scale:1 0; } }
  @keyframes thf-look { from { translate:-26% 0; } to { translate:26% 6%; } }
  @keyframes thf-bob { to { translate:0 -4%; } }
  @keyframes thf-step { from { translate:0 0; } to { translate:0 -26%; } }
  @keyframes thf-swing { from { rotate:-22deg; } to { rotate:22deg; } }
  @keyframes thf-hop { to { translate:0 -9%; } }
  @keyframes thf-shake { from { translate:-3% 0; } to { translate:3% 0; } }
  @keyframes thf-tear { from { translate:0 0; opacity:1; } to { translate:0 60%; opacity:0; } }
  @keyframes thf-wail { to { height:32%; } }
  @keyframes thf-sweep { from { rotate:-4deg; } to { rotate:30deg; } }
  @keyframes thf-slowp { from { opacity:.7; } to { opacity:1; } }
  @keyframes thf-sir { 0% { background:radial-gradient(ellipse at 50% 50%, rgba(255,0,30,0) 30%, rgba(255,0,30,.55) 100%); } 50% { background:radial-gradient(ellipse at 50% 50%, rgba(0,80,255,0) 30%, rgba(0,80,255,.5) 100%); } }
  @keyframes thf-word { from { opacity:1; scale:.5; } 25% { scale:1.15; } 75% { opacity:1; } to { opacity:0; translate:0 -40px; } }
  @keyframes thf-wordk { from { opacity:0; scale:.4; } }
  @keyframes thf-mote { from { translate:0 0; opacity:0; } 20% { opacity:.6; } to { translate:18px -70px; opacity:0; } }
  @media (prefers-reduced-motion: reduce) { .thf-it .in, .thf-pfr .in, .thf-ch, .thf-mote, .thf-g .bm { animation:none !important; } }
  `;
  function injectCss() { if (document.getElementById("thf-css")) return; const s = document.createElement("style"); s.id = "thf-css"; s.textContent = CSS; document.head.appendChild(s); }

  // The fancy hall, drawn once as a stretched SVG: one-point perspective, vanishing point at (50, 50), the far wall at x 38..62
  const HALL = (() => {
    const X = (k) => 38 * (1 - k), YF = (k) => 50 + 50 * k, YC = (k) => 22 * (1 - k);
    let s = '<svg class="thf-bg" viewBox="0 0 100 100" preserveAspectRatio="none">';
    s += '<defs><linearGradient id="thf-wl" x1="0" x2="1"><stop offset="0" stop-color="#4a1426"/><stop offset="1" stop-color="#85304a"/></linearGradient>' +
      '<linearGradient id="thf-wr" x1="1" x2="0"><stop offset="0" stop-color="#4a1426"/><stop offset="1" stop-color="#85304a"/></linearGradient></defs>';
    s += '<rect width="100" height="100" fill="#8a2c44"/>';
    s += '<polygon points="0,0 100,0 62,22 38,22" fill="#f1dca6"/>';
    s += '<polygon points="38,22 62,22 62,50 38,50" fill="#a23352"/>';
    s += '<polygon points="0,0 38,22 38,50 0,100" fill="url(#thf-wl)"/><polygon points="100,0 62,22 62,50 100,100" fill="url(#thf-wr)"/>';
    s += '<polygon points="0,100 100,100 62,50 38,50" fill="#f3e9d3"/>';
    // wainscot and gold rails
    s += `<polygon points="0,100 0,80 38,44.4 38,50" fill="#3a1a14"/><polygon points="100,100 100,80 62,44.4 62,50" fill="#3a1a14"/>`;
    s += '<polyline points="0,80 38,44.4" fill="none" stroke="#e0b43a" stroke-width="2.4" vector-effect="non-scaling-stroke"/><polyline points="100,80 62,44.4" fill="none" stroke="#e0b43a" stroke-width="2.4" vector-effect="non-scaling-stroke"/>';
    s += '<polyline points="0,0 38,22" fill="none" stroke="#e0b43a" stroke-width="4" vector-effect="non-scaling-stroke"/><polyline points="100,0 62,22" fill="none" stroke="#e0b43a" stroke-width="4" vector-effect="non-scaling-stroke"/>';
    // ceiling beams
    [[20, 0], [40, 0], [60, 0], [80, 0]].forEach(([x]) => { s += `<line x1="${x}" y1="0" x2="${38 + (x / 100) * 24}" y2="22" stroke="#caa95a" stroke-width="1.4" vector-effect="non-scaling-stroke"/>`; });
    [0.3, 0.55, 0.78].forEach((k) => { s += `<line x1="${X(k)}" y1="${YC(k)}" x2="${100 - X(k)}" y2="${YC(k)}" stroke="#caa95a" stroke-width="1.4" vector-effect="non-scaling-stroke"/>`; });
    // marble floor lines
    for (let i = 0; i <= 8; i++) s += `<line x1="50" y1="50" x2="${i * 12.5}" y2="100" stroke="#cdbb92" stroke-width="1" vector-effect="non-scaling-stroke"/>`;
    [54, 58.5, 64, 71, 80, 91].forEach((y) => { s += `<line x1="0" y1="${y}" x2="100" y2="${y}" stroke="#cdbb92" stroke-width="1" vector-effect="non-scaling-stroke"/>`; });
    // the red carpet with its gold edges
    s += '<polygon points="27,100 73,100 55,50 45,50" fill="#d9a520"/><polygon points="30,100 70,100 53,50 47,50" fill="#b3202e"/>';
    s += '<polygon points="34,100 66,100 52,50 48,50" fill="none" stroke="#e8b84a" stroke-width="1.4" vector-effect="non-scaling-stroke"/>';
    // columns on both walls
    [0.1, 0.32, 0.56, 0.8].forEach((k) => {
      const w = 1 + 4.2 * k, yc = YC(k), yf = YF(k), cap = 1.6 + 3 * k;
      [[X(k), 1], [100 - X(k) - w, 0]].forEach(([x]) => {
        s += `<rect x="${x}" y="${yc}" width="${w}" height="${yf - yc}" fill="#efe3c8" stroke="#6a4a1a" stroke-width="1.2" vector-effect="non-scaling-stroke"/>`;
        s += `<rect x="${x - w * 0.22}" y="${yc}" width="${w * 1.44}" height="${cap}" fill="#e0b43a" stroke="#6a4a1a" stroke-width="1.2" vector-effect="non-scaling-stroke"/>`;
        s += `<rect x="${x - w * 0.22}" y="${yf - cap}" width="${w * 1.44}" height="${cap}" fill="#e0b43a" stroke="#6a4a1a" stroke-width="1.2" vector-effect="non-scaling-stroke"/>`;
      });
    });
    return s + "</svg>";
  })();

  const slotFrac = { statue: 0.17, vase: 0.5, painting: 0.84 };
  const IK = [0.66, 0.55, 0.46];                    // the depth of the row of hiding places in each round
  const scOf = (k) => 0.55 + 0.45 * k;
  const TYPES = ["statue", "vase", "painting"];

  registerMicrogame({
    id: "sneaky-thief",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 20000,   // the clock only runs while the thief walks in; it waits for everything else
    input: "tap",
    tutorial: true,

    start(ctx) {
      injectCss();
      const speed = ctx.speed || 1, pace = 0.75 + 0.25 * speed;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const { tone, sweep, noise } = ctx.sfx;
      const S = ctx.choiceSteps(GOAL, 3, { lowercase: true });
      let si = 0, st = S[0];

      // ---------- DOM ----------
      const wrap = document.createElement("div");
      wrap.className = "thf";
      const top = document.createElement("div");
      top.className = "thf-top";
      const card = document.createElement("button");
      card.className = "thf-card";
      card.setAttribute("aria-label", TEXT.cardLabel);
      card.innerHTML = '<span class="ct"></span>';
      card.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });
      const pips = document.createElement("div");
      pips.className = "thf-pips";
      pips.innerHTML = '<span class="thf-pip off">🪙</span>'.repeat(GOAL);
      top.append(card, pips);
      const view = document.createElement("div");
      view.className = "thf-view";
      view.innerHTML = HALL + '<div class="thf-deco"></div><div class="thf-world"></div><div class="thf-fx"></div><div class="thf-slow"></div><div class="thf-siren"></div><div class="thf-flash"></div>';
      wrap.append(top, view);
      ctx.root.appendChild(wrap);
      const deco = view.querySelector(".thf-deco"), world = view.querySelector(".thf-world"), fx = view.querySelector(".thf-fx"), flashEl = view.querySelector(".thf-flash");
      const pipEls = [...pips.querySelectorAll(".thf-pip")];

      // ---------- Layout ----------
      let W = 0, H = 0, u = 80;
      const yOf = (k) => H * (0.5 + 0.5 * k);
      const hallL = (k) => W * 0.38 * (1 - k);
      function layout() {
        const oW = W || 1, oH = H || 1;
        W = view.clientWidth; H = view.clientHeight;
        u = Math.max(46, Math.min(H * 0.19, W * 0.12, 96));
        view.style.setProperty("--u", `${u}px`);
        // the door and the chandeliers
        const dh = Math.min(H * 0.26, u * 1.5);
        door.style.setProperty("--u", `${dh / 1.5}px`);
        door.style.transform = `translate(${W / 2 - dh * 0.95 / 1.5 / 2}px, ${H * 0.5 - dh}px)`;
        chans.forEach((c) => {
          const sc = 0.4 + 0.9 * c.k, size = u * sc;
          c.el.style.setProperty("--u", `${size}px`);
          c.el.style.transform = `translate(${W / 2 - size / 2}px, ${H * 0.22 * (1 - c.k)}px)`;
        });
        ped.style.transform = `translate(${W / 2 - u * 0.55}px, ${H * 0.995 - u * 1.15}px)`;
        ped.style.zIndex = Math.round(H * 0.995 * 10);
        [thief, ...guards].forEach((sp) => {
          sp.w = sp.kind === "g" ? u * 1.3 : u * 1.2; sp.h = sp.kind === "g" ? u * 1.95 : u * 1.5;
          put(sp, sp.x * W / oW, sp.y * H / oH, sp.sc);
        });
        items.forEach(placeItem);
        if (cage) putCage(cage.x * W / oW, cage.y * H / oH, cage.sc);
      }

      // ---------- Scenery ----------
      const door = document.createElement("div");
      door.className = "thf-door";
      door.innerHTML = '<div class="lt"></div><div class="dl"></div><div class="dr"></div><i class="kn a"></i><i class="kn b"></i><div class="ex">EXIT</div>';
      deco.appendChild(door);
      const chans = [0.3, 0.55, 0.8].map((k) => {
        const el = document.createElement("div");
        el.className = "thf-ch"; el.style.animationDelay = `${-k * 3}s`;
        el.innerHTML = '<i class="cn"></i><i class="ar"></i><i class="cr"></i><i class="bl a"></i><i class="bl b"></i><i class="bl c"></i><i class="bl d"></i><i class="bl e"></i>';
        deco.appendChild(el);
        return { el, k };
      });
      for (let i = 0; i < 14; i++) { const m = document.createElement("i"); m.className = "thf-mote"; m.style.cssText = `left:${10 + Math.random() * 80}%;top:${25 + Math.random() * 70}%;animation-delay:${-Math.random() * 7}s;`; deco.appendChild(m); }
      const ped = document.createElement("div");
      ped.className = "thf-ped";
      ped.innerHTML = '<div class="pb"></div><div class="pt"></div><div class="cu"></div><div class="pc"></div>';
      world.appendChild(ped);
      const pedCoin = ped.querySelector(".pc");

      // ---------- Sprites: the thief and the guards ----------
      function put(sp, x, y, sc) {
        sp.x = x; sp.y = y; sp.sc = sc;
        sp.el.style.transform = `translate(${(x - sp.w / 2).toFixed(1)}px, ${(y - sp.h).toFixed(1)}px) scale(${sc.toFixed(3)})`;
        sp.el.style.zIndex = sp.zFix != null ? sp.zFix : Math.round(y * 10) + (sp.zo || 0);
      }
      function glide(sp, x, y, sc, ms, cb, ease) {
        const tf = (px, py, ps) => `translate(${(px - sp.w / 2).toFixed(1)}px, ${(py - sp.h).toFixed(1)}px) scale(${ps.toFixed(3)})`;
        let an = null;
        if (!reduce && ms > 0) an = sp.el.animate([{ transform: tf(sp.x, sp.y, sp.sc) }, { transform: tf(x, y, sc) }], { duration: ms, easing: ease || "linear", fill: "forwards" });
        ctx.later(() => { put(sp, x, y, sc); if (an) an.cancel(); if (cb) cb(); }, Math.max(0, ms));
      }
      const mkSprite = (kind, cls, html) => {
        const el = document.createElement("div");
        el.className = `thf-sp thf-${kind === "g" ? "g" : "th"} ${cls || ""}`;
        el.innerHTML = html;
        world.appendChild(el);
        return { el, kind, x: 0, y: 0, sc: 1, w: kind === "g" ? u * 1.3 : u * 1.2, h: kind === "g" ? u * 1.95 : u * 1.5 };
      };
      const THIEF = '<div class="in"><i class="lg a"></i><i class="lg b"></i><i class="ar l"></i><i class="ar r"><i class="cn"></i></i><i class="bd"></i><i class="sk bk">$</i>' +
        '<div class="hd"><i class="cp"></i><i class="pp"></i><i class="bs bk"></i><div class="fc"><i class="mk"></i><div class="ey a"><i></i></div><div class="ey b"><i></i></div><i class="mo"></i></div>' +
        '<span class="trs"><b class="a"></b><b class="b"></b></span></div></div>';
      const GUARD = '<div class="in"><i class="lg a"></i><i class="lg b"></i><i class="ar l"></i><i class="ar r"></i><i class="bd"></i><i class="blt"></i><i class="bn a"></i><i class="bn b"></i><i class="bgd"></i>' +
        '<i class="fl"><i class="bm"></i></i><div class="hd"><i class="hr bk"></i><i class="cp"></i><i class="cb"></i><i class="vz"></i>' +
        '<div class="fc"><div class="ey a"><i></i></div><div class="ey b"><i></i></div><i class="br a"></i><i class="br b"></i><i class="ns"></i><i class="mu a"></i><i class="mu b"></i><i class="mo"></i></div>' +
        '<span class="trs"><b class="a"></b><b class="b"></b></span></div><span class="swt">💧</span></div>';
      const thief = mkSprite("t", "", THIEF);
      let guards = [], cage = null, cageEl = null;
      const mkGuard = (cls) => { const g = mkSprite("g", cls || "", GUARD); guards.push(g); return g; };
      const delGuards = () => { guards.forEach((g) => g.el.remove()); guards = []; };
      const tc = (c, on) => (on === false ? thief.el.classList.remove(c) : thief.el.classList.add(c));

      // ---------- Hiding places ----------
      let items = [], chosen = null, rightItem = null;
      const ART = {
        statue: '<i class="st-pd"></i><i class="st-pt"></i><div class="pl st-plq"></div><i class="st-a1"></i><i class="st-a2"></i><i class="st-bd"></i><i class="st-hr"></i><div class="st-hd"><div class="st-ey a"><i></i></div><div class="st-ey b"><i></i></div><i class="st-mo"></i></div>',
        vase: '<i class="vs-lg a"></i><i class="vs-lg b"></i><i class="vs-lg c"></i><i class="vs-tb"></i><i class="vs-h a"></i><i class="vs-h b"></i><i class="vs-bd"></i><i class="vs-nk"></i><i class="vs-rm"></i><div class="pl vs-plq"></div>',
        painting: '<i class="pt-cv"></i><div class="pl pt-plq"></div>',
      };
      function mkItem(type, o, k) {
        const el = document.createElement("button");
        el.className = "thf-it";
        el.innerHTML = `<div class="in">${ART[type]}</div>`;
        const it = { el, type, o, k, x: 0, base: 0, s: 0, fr: null, dead: false };
        if (type === "painting") {
          const fr = document.createElement("div");
          fr.className = "thf-pfr";
          fr.innerHTML = '<div class="in"><i class="fr"></i><i class="fc a"></i><i class="fc b"></i><i class="fc c"></i><i class="fc d"></i></div>';
          it.fr = fr;
          world.appendChild(fr);
        }
        el.setAttribute("aria-label", TEXT.itemLabel(o.spoken || o.text));
        const pl = el.querySelector(".pl");
        pl.textContent = o.text;
        const len = [...o.text].length;
        pl.style.fontSize = `calc(var(--s) * ${Math.min(0.36, 1.0 / (len * 0.62)).toFixed(3)})`;
        el.addEventListener("pointerdown", (ev) => { ev.preventDefault(); ev.stopPropagation(); pick(it); });
        world.appendChild(el);
        return it;
      }
      function placeItem(it) {
        const { l, r } = { l: hallL(it.k), r: W - hallL(it.k) };
        it.x = l + (r - l) * slotFrac[it.type];
        it.base = yOf(it.k);
        it.s = u * scOf(it.k) * 1.2;
        [it.el, it.fr].forEach((e, i) => {
          if (!e) return;
          e.style.setProperty("--s", `${it.s.toFixed(1)}px`);
          e.style.transform = `translate(${(it.x - 0.85 * it.s).toFixed(1)}px, ${(it.base - 2.6 * it.s).toFixed(1)}px)`;
          e.style.zIndex = Math.round(it.base * 10) + (i ? 3 : 0);
        });
      }
      function showItems() {
        const set = ctx.shuffle(st.row.slice());
        items = TYPES.map((t, i) => mkItem(t, set[i], IK[si]));
        items.forEach(placeItem);
        rightItem = items.find((it) => it.o.right);
        items.forEach((it, i) => {
          [it.el, it.fr].forEach((e) => { if (e) e.querySelector(".in").style.animationDelay = `${i * 130 / pace}ms, ${500 + i * 130 / pace}ms`; });
          ctx.later(() => { tone(520 + i * 160, 0.09, "triangle", 0.09); sweep(200, 800, 0.15, "sine", 0.05); }, i * 130 / pace);
        });
      }
      const dropItem = (it) => { it.dead = true; it.el.classList.add("gone"); it.el.classList.remove("live"); if (it.fr) it.fr.classList.add("gone"); ctx.later(() => { it.el.remove(); if (it.fr) it.fr.remove(); }, 600); };
      const hidePlace = (it) => {
        // where the thief ducks: behind the statue or the vase (a bit of him still sticks out), or inside the painting's frame
        const s = it.s, sc = scOf(it.k);
        if (it.type === "statue") return { x: it.x + 0.4 * s, y: it.base - 0.02 * H, sc: sc * 0.84, z: Math.round(it.base * 10) - 5 };
        if (it.type === "vase") return { x: it.x - 0.55 * s, y: it.base - 0.02 * H, sc: sc * 0.84, z: Math.round(it.base * 10) - 5 };
        return { x: it.x, y: it.base - 0.8 * s, sc: (1.42 * s) / (1.5 * u), z: Math.round(it.base * 10) + 1 };
      };

      // ---------- State ----------
      let phase = "intro", hits = 0, done = false, finalWon = false, heldFor = 0, holdUntil = 0;
      const rowY = () => yOf(IK[si] + 0.15);
      const thiefHome = (r) => ({ x: W / 2, y: yOf(IK[r] + 0.15), sc: scOf(IK[r] + 0.15) });

      // ---------- Effects ----------
      function word(text, bad, x, y, big, keep) {
        const w = document.createElement("div");
        w.className = "thf-word" + (bad ? " bad" : "") + (big ? " big" : "") + (keep ? " keep" : "");
        w.textContent = text;
        w.style.left = `${Math.max(80, Math.min(W - 80, x))}px`; w.style.top = `${Math.max(30, Math.min(H - 30, y))}px`;
        fx.appendChild(w);
        if (!keep) ctx.later(() => w.remove(), 1200);
        return w;
      }
      function burst(x, y, cols, n, dist, size, ms) {
        const ps = [];
        for (let i = 0; i < n; i++) {
          const p = document.createElement("div");
          p.className = "thf-p"; p.style.cssText = `left:${x}px;top:${y}px;width:${size}px;height:${size}px;background:${cols[i % cols.length]};`;
          fx.appendChild(p); ps.push(p);
          if (reduce) continue;
          const a = Math.random() * 6.283, d = dist * (0.45 + Math.random() * 0.75);
          p.animate([{ transform: "translate(-50%,-50%) scale(1)", opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d}px)) scale(.2)`, opacity: 0 }],
            { duration: ms * (0.7 + Math.random() * 0.6), easing: "cubic-bezier(.1,.7,.3,1)", fill: "forwards" });
        }
        ctx.later(() => ps.forEach((p) => p.remove()), ms * 1.5);
      }
      const flash = (color, ms) => { flashEl.style.background = color; if (!reduce) flashEl.animate([{ opacity: 0.9 }, { opacity: 0 }], { duration: ms, easing: "ease-out" }); };
      function shake(ms, amt) {
        if (reduce) return;
        const a = amt || 7;
        view.animate([{ translate: "0 0" }, { translate: `${-a}px ${a * 0.6}px` }, { translate: `${a}px ${-a * 0.6}px` }, { translate: `${-a * 0.6}px ${-a * 0.4}px` }, { translate: "0 0" }], { duration: ms });
      }
      const steps = (n, gap, heavy) => { for (let i = 0; i < n; i++) ctx.later(() => noise(0.05, "lowpass", heavy ? 400 : 700, 180, heavy ? 0.22 : 0.12), (i * gap) / pace); };
      const stage = (el, on, cls) => el.classList[on ? "add" : "remove"](cls);
      const say = () => ctx.say(chosen && chosen.o ? chosen.o.spoken || chosen.o.text : st.answer);

      // ---------- The card ----------
      function setCard() {
        card.firstChild.textContent = st.cardText;
        card.querySelector(".spk")?.remove();
        if (ctx.canSpeak && !st.listen) card.insertAdjacentHTML("beforeend", '<span class="spk">🔊</span>');
        card.classList.remove("next"); void card.offsetWidth; card.classList.add("next");
      }
      function replay() { if (!done || phase === "final") ctx.say(st.prompt); }

      // ---------- Intro: the thief creeps in from the side, takes the coin and walks away up the hall holding it ----------
      function intro(delay) {
        phase = "intro";
        const t0 = thiefHome(0), py = H * 0.955, sx = W / 2 - 1.1 * u;
        put(thief, -u * 1.2, py, 0.97);
        ctx.later(() => {
          if (done) return;
          tc("walk"); steps(5, 300, false);
          glide(thief, sx, py, 0.97, 1500 / pace, () => {
            tc("walk", false); tc("look");
            ctx.later(() => {
              if (done) return;
              tc("look", false); tc("reach"); tone(500, 0.2, "triangle", 0.07);
              ctx.later(grabbed, 450 / pace);
            }, 800 / pace);
          }, "ease-out");
        }, delay / pace);
        function grabbed() {
          if (done) return;
          const cx = W / 2, cy = H * 0.995 - u * 1.13;
          pedCoin.classList.add("gone"); tc("has"); tc("grin");
          tone(1568, 0.1, "square", 0.09); sweep(400, 1600, 0.3, "triangle", 0.08); tone(2093, 0.18, "triangle", 0.1, 0.1);
          burst(cx, cy, ["#ffe14d", "#fff", "#ffd23f"], 10, u * 0.7, u * 0.08, 500);
          word(TEXT.mine, false, W / 2, H * 0.5, true); ctx.say(st.prompt);
          // the coin is in his hand now: he lifts it up, turns round (a squash through the middle) and walks off up the carpet
          ctx.later(() => { tc("reach", false); tc("up"); }, 500 / pace);
          ctx.later(() => {
            if (done) return;
            const inn = thief.el.querySelector(".in");
            if (!reduce) inn.animate([{ scale: "1 1" }, { scale: "0.05 1" }, { scale: "1 1" }], { duration: 380 });
            ctx.later(() => { tc("back"); tc("grin", false); }, 190);
          }, 1500 / pace);
          ctx.later(() => {
            if (done) return;
            tc("walk");
            ped.style.transition = "opacity .8s"; ctx.later(() => { ped.style.opacity = "0"; }, 700);
            steps(8, 300, false);
            glide(thief, t0.x, t0.y, t0.sc, 2400 / pace, () => { tc("walk", false); tc("wait"); offer(); }, "ease-in-out");
          }, 2000 / pace);
        }
      }

      // ---------- Round: the choices pop up and time slows ----------
      function offer() {
        if (done) return;
        phase = "pop";
        showItems();
        ctx.later(() => {
          if (done) return;
          phase = "choose";
          items.forEach((it) => it.el.classList.add("live"));
          view.classList.add("slow");
          sweep(900, 160, 0.7, "sine", 0.08); tone(98, 0.5, "sine", 0.1);
          ctx.say(st.prompt);
          beat();
        }, (3 * 130 + 350) / pace);
      }
      function beat() {   // a slow heartbeat while time is slowed
        if (phase !== "choose" || done) return;
        tone(70, 0.14, "sine", 0.14); tone(62, 0.16, "sine", 0.12, 0.2);
        ctx.later(beat, 1100);
      }
      function pick(it) {
        if (phase !== "choose" || done || ctx.ended || it.dead) return;
        phase = "hide"; chosen = it;
        view.classList.remove("slow");
        items.forEach((q) => { q.el.classList.remove("live"); });
        items.filter((q) => q !== it).forEach(dropItem);
        sweep(200, 1200, 0.3, "sawtooth", 0.06); tone(880, 0.06, "square", 0.08);
        // the thief ducks behind the one you tapped
        const h = hidePlace(it);
        tc("wait", false); tc("back", false); tc("hide"); tc("look"); tc("has", true);
        thief.zFix = h.z;
        if (it.fr) it.fr.classList.add("static");
        steps(3, 150, false);
        tc("walk");
        glide(thief, h.x, h.y, h.sc, 520 / pace, () => { tc("walk", false); tc("shk"); guardsEnter(); }, "ease-out");
      }

      // ---------- The guards stroll past ----------
      function guardsEnter() {
        if (done) return;
        phase = "guards";
        tone(110, 0.2, "square", 0.08); tone(98, 0.2, "square", 0.08, 0.3);
        const it = chosen, gy = yOf(it.k + 0.07), gsc = scOf(it.k + 0.07);
        const A = mkGuard("walk"), B = mkGuard("walk");
        const gap = u * 1.55 * gsc;
        const stopX = Math.max(it.x - 0.95 * it.s, gap + u * 0.9 * gsc);
        const wallL = hallL(it.k + 0.07), startX = wallL - u * 0.1;
        A.zo = 1; B.zo = 0; put(A, startX, gy, gsc); put(B, startX - gap, gy, gsc);
        const spd = (u * 2.5) / 1000 * pace;   // px per ms
        // they step out from between the columns on the left wall
        [A, B].forEach((g) => { g.el.style.transition = "opacity .3s"; g.el.style.opacity = "0"; ctx.later(() => { g.el.style.opacity = "1"; }, Math.max(20, (wallL - g.x) / spd)); });
        const dur = Math.max(300, (stopX - startX) / spd);
        steps(Math.round(dur / 340), 340, true);
        glide(A, stopX, gy, gsc, dur, null);
        glide(B, stopX - gap, gy, gsc, dur, () => {
          A.el.classList.remove("walk"); B.el.classList.remove("walk");
          if (chosen.o.right) guardsLook(A, B, gy, gsc, spd); else guardsFind(A, B);
        });
      }
      function guardsLook(A, B, gy, gsc, spd) {
        // HMM? ... nothing here. And on they go.
        A.el.classList.add("hmm");
        word(TEXT.hmm, false, A.x, A.y - u * 2.3 * gsc, false);
        tone(300, 0.3, "triangle", 0.1); tone(260, 0.3, "triangle", 0.1, 0.25);
        ctx.later(() => { A.el.classList.remove("hmm"); A.el.classList.add("shrug"); B.el.classList.add("hmm"); tone(200, 0.4, "sawtooth", 0.06); }, 1000 / pace);
        ctx.later(() => {
          A.el.classList.remove("shrug"); B.el.classList.remove("hmm"); A.el.classList.add("walk"); B.el.classList.add("walk");
          const wallR = W - hallL(chosen.k + 0.07), endA = wallR + u * 1.2 * gsc, dur = Math.max(300, (endA - A.x) / spd);
          [A, B].forEach((g) => ctx.later(() => { g.el.style.opacity = "0"; }, Math.max(0, (wallR - g.x) / spd)));
          steps(Math.round(dur / 340), 340, true);
          glide(A, endA, gy, gsc, dur, null);
          glide(B, endA - (A.x - B.x), gy, gsc, dur, () => { delGuards(); relief(); });
        }, 1800 / pace);
      }
      function relief() {
        if (done) return;
        phase = "relief";
        hits++;
        pipEls[hits - 1] && pipEls[hits - 1].classList.remove("off");
        tc("shk", false); tc("grin");
        say();
        word(TEXT.phew, false, thief.x, thief.y - u * 1.9 * thief.sc, true);
        tone(523, 0.1, "triangle", 0.1); tone(659, 0.1, "triangle", 0.1, 0.1); tone(784, 0.2, "triangle", 0.1, 0.2); sweep(900, 300, 0.4, "sine", 0.07);
        burst(thief.x, thief.y - u * 0.8 * thief.sc, ["#ffe14d", "#fff", "#7be39a", "#ff9ad0"], 14, u * 1.2, u * 0.09, 700);
        if (hits >= GOAL) ctx.later(escape, 1100 / pace);
        else ctx.later(nextRound, 1300 / pace);
      }
      function nextRound() {
        if (done) return;
        dropItem(chosen); chosen = null;
        si++; st = S[si];
        thief.zFix = null; tc("hide", false); tc("look", false); tc("grin", false); tc("back"); tc("walk"); tc("has", true);
        setCard();
        tone(98, 0.08, "square", 0.1); tone(147, 0.08, "square", 0.1, 0.16);
        const h = thiefHome(si);
        steps(6, 300, false);
        glide(thief, h.x, h.y, h.sc, 1700 / pace, () => { tc("walk", false); tc("wait"); offer(); }, "ease-in-out");
      }

      // ---------- Caught: siren, then a cage ----------
      function guardsFind(A, B) {
        A.el.classList.add("alert", "lock"); B.el.classList.add("alert");
        word("!", true, A.x, A.y - u * 2.3 * A.sc, true);
        word(TEXT.found, true, A.x + u * 0.6, A.y - u * 1.4 * A.sc, false);
        tone(1200, 0.25, "square", 0.12); noise(0.2, "highpass", 2000, 2000, 0.2);
        tc("look", false); tc("shk");
        ctx.later(() => {
          view.classList.add("sir");
          ctx.freezeTimer();
          for (let i = 0; i < 6; i++) ctx.later(() => sweep(i % 2 ? 1100 : 700, i % 2 ? 700 : 1100, 0.45, "sawtooth", 0.09), i * 460);
          word(TEXT.siren, true, W / 2, H * 0.18, true, true);
          shake(500, 6);
          // the thief is pulled out into the open
          thief.zFix = null; tc("hide", false); tc("shk", false);
          const it = chosen, ty = it.base + 0.07 * H, tsc = scOf(it.k + 0.2);
          glide(thief, it.x, ty, tsc, 420, () => { tc("shk"); dropCage(it.x, ty, tsc); }, "ease-out");
        }, 700 / pace);
      }
      function putCage(x, y, sc) {
        cage = { x, y, sc };
        cageEl.style.transform = `translate(${(x - u * 0.75).toFixed(1)}px, ${(y - u * 1.75).toFixed(1)}px) scale(${(sc * 1.05).toFixed(3)})`;
        cageEl.style.zIndex = Math.round(y * 10) + 5;
      }
      function dropCage(x, y, sc) {
        cageEl = document.createElement("div");
        cageEl.className = "thf-cage";
        cageEl.style.setProperty("--u", `${u}px`);
        world.appendChild(cageEl);
        putCage(x, y, sc);
        const tf = (dy) => `translate(${(x - u * 0.75).toFixed(1)}px, ${(y - u * 1.75 + dy).toFixed(1)}px) scale(${(sc * 1.05).toFixed(3)})`;
        if (!reduce) cageEl.animate([{ transform: tf(-H) }, { transform: tf(0), offset: 0.6 }, { transform: tf(-u * 0.25), offset: 0.78 }, { transform: tf(0) }], { duration: 650, easing: "cubic-bezier(.5,0,1,.6)" });
        sweep(1400, 200, 0.5, "sawtooth", 0.1);
        ctx.later(() => {
          noise(0.35, "bandpass", 1200, 400, 0.5); tone(180, 0.3, "square", 0.14); tone(2400, 0.08, "square", 0.08);
          flash("#fff", 240); shake(450, 9);
          tc("shk", false); tc("back", false); tc("grin", false); tc("sad"); tc("has", false);
          word(TEXT.caught, true, W / 2, H * 0.4, true);
          guards.forEach((g, i) => { g.el.classList.remove("alert", "lock"); g.el.classList.add("laugh"); });
          tone(330, 0.12, "square", 0.09, 0.2); tone(330, 0.12, "square", 0.09, 0.4); tone(392, 0.2, "square", 0.09, 0.6);
        }, 560);
        // the right place glows, then it's over
        ctx.later(() => {
          if (done && phase !== "final") return;
          const r = rightItem;
          if (r && r !== chosen && r.dead) {
            const it2 = mkItem(r.type, r.o, r.k); placeItem(it2); it2.el.classList.add("right"); items.push(it2);
          }
          ctx.say(st.answer);
        }, 1700);
        ctx.later(() => { if (!finalWon) ctx.lose(); }, 3300);
        done = true; phase = "final";
      }

      // ---------- Escape: the thief finds the door and runs ----------
      function escape() {
        if (done) return;
        done = true; phase = "final"; ctx.freezeTimer();
        dropItem(chosen);
        thief.zFix = null; tc("hide", false); tc("look", false); tc("shk", false); tc("back"); tc("grin", false); tc("has", true); tc("up");
        const h = thiefHome(2), mid = { x: W / 2, y: yOf(0.5), sc: scOf(0.5) };
        tc("walk");
        steps(4, 300, false);
        glide(thief, mid.x, mid.y, mid.sc, 1200 / pace, () => {
          tc("walk", false); tc("joy");
          // there it is: a door!
          door.classList.add("glow");
          word("!", false, W / 2, mid.y - u * 2 * mid.sc, true);
          word(TEXT.door, false, W / 2, H * 0.3, false);
          tone(784, 0.1, "triangle", 0.1); tone(988, 0.1, "triangle", 0.1, 0.1); tone(1319, 0.3, "triangle", 0.12, 0.2); noise(0.2, "highpass", 4000, 4000, 0.1);
          ctx.later(run, 1100 / pace);
        }, "ease-out");
      }
      function run() {
        tc("joy", false); tc("walk"); tc("run");
        steps(10, 190, false);
        word(TEXT.yay, false, W / 2, H * 0.62, true);
        const d = { x: W / 2, y: yOf(0) + 2, sc: scOf(0) * 0.9 };
        glide(thief, d.x, d.y, d.sc, 1900 / pace, () => {
          // the door swings open and he's through
          door.classList.add("open"); sweep(200, 500, 0.5, "sawtooth", 0.06); tone(1568, 0.3, "triangle", 0.1, 0.3); flash("#fff6c0", 400);
          tc("walk", false); tc("run", false); tc("joy");
          ctx.later(() => {
            glide(thief, d.x, d.y - H * 0.03, d.sc * 0.3, 500, () => { thief.el.style.opacity = "0"; }, "ease-in");
            burst(d.x, d.y - u * 0.5, ["#ffe14d", "#fff", "#ffb347"], 16, u * 1.4, u * 0.1, 800);
            tone(2093, 0.4, "triangle", 0.1);
          }, 500);
        }, "ease-in");
        // the guards burst in and chase him
        ctx.later(() => {
          const gsc0 = scOf(0.95), gy0 = H * 1.12;
          const A = mkGuard("walk run back"), B = mkGuard("walk run back");
          A.zo = 1;
          put(A, W / 2 - u * 0.5, gy0, gsc0); put(B, W / 2 + u * 0.6, gy0 + u * 0.2, gsc0);
          word(TEXT.stop, true, W / 2, H * 0.78, true);
          steps(8, 180, true); tone(220, 0.1, "square", 0.09);
          const mid = { y: yOf(0.42), sc: scOf(0.42) };
          glide(A, W / 2 - u * 0.4 * mid.sc, mid.y, mid.sc, 1900 / pace, () => tire(A, B, mid), "cubic-bezier(.1,.8,.4,1)");
          glide(B, W / 2 + u * 0.55 * mid.sc, mid.y + u * 0.15, mid.sc, 2000 / pace, null, "cubic-bezier(.1,.8,.4,1)");
        }, 1000 / pace);
      }
      function tire(A, B, mid) {
        // they run out of puff, turn round... and cry
        A.el.classList.remove("run"); B.el.classList.remove("run");
        A.el.classList.add("tired"); B.el.classList.add("tired");
        sweep(400, 120, 0.6, "sawtooth", 0.07);
        ctx.later(() => {
          [A, B].forEach((g) => { g.el.classList.remove("walk", "back", "tired"); g.el.classList.add("cry", "nobeam", "slump"); });
          word(TEXT.cry, true, W / 2, H * 0.34, true);
          [330, 294, 262].forEach((f, i) => tone(f, 0.35, "triangle", 0.1, i * 0.3));
          sweep(700, 300, 0.9, "sawtooth", 0.06);
        }, 1000 / pace);
        ctx.later(() => { if (!finalWon) { finalWon = true; ctx.win(); ctx.say(st.answer); } }, 2900 / pace);
      }

      // ---------- The loop (the clock only runs while the thief walks in; it waits while you choose) ----------
      function frame() {
        const now = performance.now();
        if (phase !== "intro" && !ctx.demo && !ctx.ended) {
          if (phase !== "choose" || heldFor < 25) {
            if (now >= holdUntil) { ctx.pauseTimer(300); holdUntil = now + 300; }
            if (phase === "choose") heldFor += 0.016;
          }
        }
        ctx.raf(frame);
      }

      // ---------- Go ----------
      ctx.onTimeout(() => {
        if (finalWon) return;
        done = true;
        view.classList.remove("slow");
        items.forEach((it) => { it.el.classList.remove("live"); if (it === rightItem) it.el.classList.add("right"); });
        ctx.say(st.answer);
      });
      function onKey(e) {
        const live = items.filter((q) => !q.dead), i = parseInt(e.key, 10) - 1;
        if (i >= 0 && i < live.length) { e.preventDefault(); pick(live[i]); }
        else if (e.key === " ") { e.preventDefault(); replay(); }
      }
      document.addEventListener("keydown", onKey);

      layout();
      setCard();
      const ro = new ResizeObserver(layout);
      ro.observe(view);
      const revealMs = ctx.reveal(card) || 0;
      intro(300 + revealMs * pace);
      ctx.raf(frame);

      // Tutorial: point at the card, then tap the right hiding place, three times.
      ctx.tutorial(S.map((s) => s.target), async (f) => {
        for (let n = 0; n < GOAL && !finalWon; n++) {
          await f.until(() => phase === "choose" && hits === n && !!rightItem, 12000);
          await f.point(card, n ? 450 : 800);
          await f.tap(() => (rightItem || { el: card }).el);
          await f.until(() => hits > n || finalWon, 9000);
        }
        await f.until(() => ctx.ended, 14000);
      });
      return () => { done = true; ro.disconnect(); document.removeEventListener("keydown", onKey); };
    },
  });
})();
