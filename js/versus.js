// ⚔️ VERSUS — two players on one iPad, side by side (the teacher's idea). Each player picks a character,
// then every round the SAME game runs twice, once in each half of the screen, with the same target and
// the same starting board (both start from the same random seed). First to win the round scores a point;
// a mistake knocks that player out of the round (the other can still win it). First to 5 points wins.
// Every game is used (each draws inside its own half and tracks each finger separately). ?vsgame=<id> plays
// only that game (testing). The frame hands over what to play (js/frame.js: window.FrameAPI).
(function () {
  const TEXT = {
    setup: "WHO'S\nPLAYING?",
    p: (n) => `PLAYER ${n}`,
    fight: "⚔️ GO!",
    firstTo: "FIRST TO",
    back: "⬅️ BACK",
    round: (n) => `ROUND ${n}`,
    point: "POINT!",
    out: "OOPS!",
    slow: "TOO SLOW!",
    nobody: "NOBODY!",
    heave: "HEAVE!",
    // Team Up
    teamTitle: "TEAM\nUP!",
    teamGo: "🤝 GO!",
    yourTurn: "👉 YOUR TURN!",
    teamWin: "TEAM WIN!",
    ohNo: "OH NO! 💔",
    teamDone: "TEAM\nWIN! 🎉",
    teamLost: "SO\nCLOSE!",
    team: "TEAM",
    bothDone: "DONE! ✔",
    waitFriend: "Help your friend!",
    splash: "SPLASH!",
    wins: (n) => `PLAYER ${n}\nWINS!`,
    again: "🔁 PLAY AGAIN",
    menu: "🏠 MENU",
    quit: "Quit",
    say: { go: "Ready? Go!", point: (n) => `Point for player ${n}!`, win: (n) => `Player ${n} wins!`, team: "Great teamwork!", teamDone: "You did it together!", teamLost: "So close! Try again!" },
  };
  const GOALS = [3, 5, 7];   // points to win the match: a choice on the setup screen (the teacher asked)
  const GOAL_KEY = "wwe.vs.goal";
  let goal = 5;
  try { const g = JSON.parse(localStorage.getItem(GOAL_KEY)); if (GOALS.includes(g)) goal = g; } catch (err) { /* ok */ }
  const START_LOCK = 500;
  // Every game works in a half: they all draw inside their own root and track each finger separately, so two
  // players can drag at the same time (the teacher's wish list had drag and slice games too). VERSUS_SKIP leaves any out.
  const VERSUS_SKIP = [];
  const COLORS = ["#3d8bff", "#ff4d6d"];
  const P2_KEY = "wwe.vs.p2";

  const CSS = `
  #versus { position:fixed; inset:0; z-index:60; display:flex; flex-direction:column; background:transparent; /* (the sunburst shows through) */
    padding:max(6px, env(safe-area-inset-top)) max(6px, env(safe-area-inset-right)) max(6px, env(safe-area-inset-bottom)) max(6px, env(safe-area-inset-left)); }
  #versus[hidden] { display:none; }
  .vs-top { flex:none; display:flex; align-items:center; justify-content:center; gap:10px; padding:2px 0 6px; position:relative; }
  .vs-quit { position:absolute; left:0; top:0; width:44px; height:44px; border-radius:50%; border:4px solid #111; background:#fff; font:inherit; font-size:1.2rem; cursor:pointer; }
  .vs-score { display:flex; align-items:center; gap:8px; padding:4px 14px; background:#fff; border:4px solid #111; border-radius:99px; box-shadow:0 4px 0 #111; }
  .vs-score .n { font-size:1.8rem; min-width:1.2em; text-align:center; }
  .vs-score .n.pop { animation:vs-pop .5s cubic-bezier(.2,1.8,.4,1); }
  .vs-score .vs { font-size:1rem; opacity:.7; }
  .vs-sides { flex:1; min-height:0; display:flex; gap:8px; }
  .vs-side { position:relative; flex:1; min-width:0; display:flex; flex-direction:column; border:5px solid var(--pc); border-radius:18px; overflow:hidden; background:rgba(255,255,255,.18); }
  .vs-head { flex:none; display:flex; align-items:center; justify-content:center; gap:8px; padding:3px 6px; background:var(--pc); color:#fff; font-size:1.1rem;
    -webkit-text-stroke:1px #111; paint-order:stroke fill; }
  .vs-bar { flex:none; height:10px; background:rgba(0,0,0,.2); }
  .vs-bar i { display:block; height:100%; background:#4dd36b; transform-origin:0 50%; }
  .vs-bar i.low { background:#ff4d6d; }
  .vs-game { position:relative; flex:1; min-height:0; }
  .vs-game.locked { pointer-events:none; }
  .vs-cover { position:absolute; inset:0; z-index:50; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; pointer-events:none;
    background:rgba(0,0,0,.35); }
  .vs-cover .w { font-size:clamp(1.8rem, 7vw, 3rem); color:#fff; -webkit-text-stroke:2px #111; paint-order:stroke fill; text-shadow:0 5px 0 #111; animation:vs-pop .5s cubic-bezier(.2,1.8,.4,1); white-space:pre-line; text-align:center; }
  .vs-cover.win { background:rgba(255,212,0,.35); }
  .vs-cover.win .w { color:#ffd400; }
  .vs-banner { position:absolute; inset:0; z-index:70; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; pointer-events:none; }
  .vs-banner .ico { font-size:clamp(3rem, 14vw, 5rem); line-height:1; animation:vs-pop .5s cubic-bezier(.2,1.8,.4,1); }
  .vs-banner .w { font-size:clamp(2rem, 9vw, 3.6rem); color:#fff; -webkit-text-stroke:2px #111; paint-order:stroke fill; text-shadow:0 6px 0 #111; white-space:pre-line; text-align:center; line-height:1;
    padding:10px 22px; background:rgba(0,0,0,.25); border-radius:20px; animation:vs-pop .5s cubic-bezier(.2,1.8,.4,1); }
  .vs-banner .sub { font-size:clamp(1.3rem, 6vw, 2.2rem); }
  /* Setup: each player picks a character */
  .vs-setup { flex:1; min-height:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; overflow-y:auto; }
  .vs-setup h1 { margin:0; font-size:clamp(2rem, 9vw, 3.4rem); line-height:1; text-align:center; white-space:pre-line; }
  .vs-pickers { display:flex; gap:12px; width:min(100%, 700px); }
  .vs-picker { flex:1; display:flex; flex-direction:column; align-items:center; gap:6px; padding:10px 6px; background:#fff; border:5px solid var(--pc); border-radius:20px; box-shadow:0 6px 0 #111; }
  .vs-picker .who { font-size:1.3rem; color:var(--pc); -webkit-text-stroke:1px #111; paint-order:stroke fill; }
  .vs-picker .row { display:flex; align-items:center; gap:6px; }
  .vs-picker .arrow { width:46px; height:46px; border-radius:50%; border:4px solid #111; background:var(--pc); color:#fff; font:inherit; font-size:1.3rem; cursor:pointer; touch-action:manipulation; }
  .vs-picker .nm { font-size:1.1rem; }
  .vs-goal { display:flex; align-items:center; gap:10px; }
  .vs-goal .shout { font-size:clamp(1.3rem, 5.5vw, 1.8rem); }
  .vs-goal button { min-width:64px; height:58px; border-radius:14px; border:4px solid #111; background:#fff; box-shadow:0 4px 0 #111; font:inherit; font-size:1.6rem; cursor:pointer; touch-action:manipulation; }
  .vs-goal button[aria-pressed="true"] { background:#ffd400; transform:translateY(2px); box-shadow:0 2px 0 #111; }
  .vs-go { font-size:clamp(1.6rem, 7vw, 2.4rem) !important; padding:12px 30px !important; background:#4dd36b !important; }
  .vs-end-buttons { display:flex; gap:12px; flex-wrap:wrap; justify-content:center; }
  .vs-champ { display:flex; align-items:flex-end; gap:20px; }
  .vs-crown { font-size:3rem; text-align:center; line-height:1; animation:vs-pop .6s cubic-bezier(.2,1.8,.4,1); }
  /* Shared-screen Tug of War: the field across the top, each player's buttons in their half below */
  .vs-sides { position:relative; }
  .vs-sides.shared > .vs-side { visibility:hidden; }
  .vs-shared { position:absolute; inset:0; display:flex; flex-direction:column; gap:8px; }
  .vt-field { position:relative; flex:1.3; min-height:0; overflow:hidden; border:5px solid #111; border-radius:18px; --tz:min(18vw, 22vh, 120px);
    background:linear-gradient(180deg, #8fd3ff 0 58%, #6cc04a 58%); }
  .vt-mud { position:absolute; left:50%; top:78%; width:28%; height:22%; transform:translate(-50%, -50%); border-radius:50%; border:5px solid #111;
    background:radial-gradient(ellipse at 40% 40%, #8a5a2b 0 30%, #6b4320 60%, #553417 100%); }
  .vt-group { position:absolute; inset:0; transition:transform .35s cubic-bezier(.3,1.4,.5,1); }
  .vt-rope { position:absolute; left:14%; right:14%; top:66%; height:12px; margin-top:-6px; border:3px solid #111; border-radius:99px;
    background:repeating-linear-gradient(60deg, #d8a865 0 8px, #b98a4a 8px 14px); }
  .vt-flag { position:absolute; left:50%; top:66%; width:18px; height:30px; margin:-2px 0 0 -9px; background:#e8173c; border:3px solid #111; clip-path:polygon(0 0, 100% 0, 100% 100%, 50% 75%, 0 100%); }
  .vt-me { position:absolute; top:calc(66% - var(--tz) * .78); width:var(--tz); height:var(--tz); }
  .vt-me.l { left:6%; } .vt-me.r { right:6%; transform:scaleX(-1); }
  .vt-me .ms.heave .ms-in { transform:rotate(-26deg) translateX(-10%); }
  .vt-card { position:absolute; left:50%; top:8%; transform:translateX(-50%); min-width:74px; height:62px; padding:0 14px; border-radius:16px; background:#fff; border:5px solid #111;
    box-shadow:0 5px 0 #111; font:inherit; font-size:2.2rem; line-height:1; color:#111; z-index:3; cursor:pointer; }
  .vt-card.next { animation:vs-pop .4s cubic-bezier(.2,1.8,.4,1); }
  .vt-bar { position:absolute; left:0; right:0; bottom:0; height:8px; background:rgba(0,0,0,.2); } .vt-bar i { display:block; height:100%; background:#4dd36b; transform-origin:0 50%; }
  .vt-fx { position:absolute; inset:0; pointer-events:none; z-index:6; overflow:visible; }
  .vt-word { position:absolute; top:34%; transform:translate(-50%, -50%) rotate(-8deg); font-size:2rem; color:#ffd400; -webkit-text-stroke:2px #111; paint-order:stroke fill;
    text-shadow:0 4px 0 #111; white-space:nowrap; animation:vs-pop .4s ease-out; }
  .vt-word.big { left:50%; font-size:2.8rem; }
  .vt-pads { flex:1; min-height:0; display:flex; gap:8px; }
  .vt-pad { flex:1; min-width:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; border:5px solid var(--pc); border-radius:18px;
    background:rgba(255,255,255,.25); transition:filter .2s; }
  .vt-pad .who { font-size:1rem; color:#fff; background:var(--pc); padding:2px 10px; border-radius:99px; -webkit-text-stroke:1px #111; paint-order:stroke fill; }
  .vt-pad .btns { display:flex; gap:8px; flex-wrap:wrap; justify-content:center; padding:0 6px; }
  .vt-btn { min-width:64px; height:60px; padding:0 8px; border:5px solid #111; border-radius:16px; box-shadow:0 5px 0 #111; background:#fff; font:inherit; font-size:1.8rem; line-height:1;
    color:#111; cursor:pointer; touch-action:manipulation; }
  .vt-btn.bad { background:#ff5a6e; color:#fff; }
  .vt-pad.dizzy { filter:grayscale(1) brightness(.8); animation:vs-dizzy .3s linear infinite; }
  .vt-pad.wait { pointer-events:none; opacity:.6; }
  @keyframes vs-dizzy { 25% { transform:rotate(-1.5deg); } 75% { transform:rotate(1.5deg); } }
  /* Shared-screen Wire Cut: the bomb in the middle, wires down to each half */
  .vw-field { position:relative; flex:1.3; min-height:0; overflow:hidden; border:5px solid #111; border-radius:18px; --bz:min(30vw, 26vh, 170px);
    background:linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px) 0 0 / 24px 24px, linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px) 0 0 / 24px 24px, #1d2a3a; }
  .vw-wires { position:absolute; inset:0; width:100%; height:100%; }
  .vw-bomb { position:absolute; left:50%; top:46%; width:var(--bz); height:var(--bz); transform:translate(-50%, -50%); border-radius:50%; background:radial-gradient(circle at 35% 30%, #555, #111 70%);
    border:5px solid #000; animation:vw-throb 1s ease-in-out infinite alternate; z-index:2; }
  .vw-bomb.hurry { animation-duration:.25s; }
  .vw-bomb .fuse { position:absolute; left:58%; top:-14%; width:8%; height:20%; background:#c9a86b; border:3px solid #111; transform:rotate(20deg); }
  .vw-bomb .spark { position:absolute; left:64%; top:-26%; font-size:calc(var(--bz) * .2); animation:vw-fizz .15s steps(2) infinite; }
  .vw-bomb .eye { position:absolute; top:22%; width:20%; aspect-ratio:1; background:#fff; border:3px solid #000; border-radius:50%; overflow:hidden; } .vw-bomb .eye.l { left:24%; } .vw-bomb .eye.r { right:24%; width:16%; }
  .vw-bomb .eye i { position:absolute; left:28%; top:30%; width:46%; aspect-ratio:1; background:#111; border-radius:50%; }
  .vw-screen { position:absolute; left:20%; right:20%; top:48%; height:30%; border:4px solid #000; border-radius:10px; background:#7cf0ff; font:inherit; font-size:calc(var(--bz) * .2); line-height:1;
    color:#111; display:flex; align-items:center; justify-content:center; cursor:pointer; white-space:nowrap; overflow:hidden; }
  .vw-screen.next { animation:vs-pop .35s cubic-bezier(.2,1.8,.4,1); }
  .vw-bomb.phew { animation:none; } .vw-bomb.phew .spark { display:none; } .vw-bomb.phew .vw-screen { background:#4dd36b; }
  .vw-bomb.gone { animation:vw-boom .4s ease-out forwards; }
  .vw-plug { border-color:#111; background:linear-gradient(var(--wc) 0 22%, #fff 22%); }
  .vw-plug.snipped:not(.bad) { opacity:.5; }
  .vt-pad.sooty { background:#333; filter:saturate(.3); }
  .vt-pad.sooty .vt-btn { background:#555; color:#999; }
  @keyframes vw-throb { to { transform:translate(-50%, -50%) scale(1.06); } }
  @keyframes vw-fizz { 50% { opacity:.4; transform:scale(1.3); } }
  /* Shared races (Boxing, Dance Off, Hoop Shot, Puzzle Reveal) */
  .vx-field { position:relative; flex:1.3; min-height:0; overflow:hidden; border:5px solid #111; border-radius:18px; }
  .vx-card { position:absolute; left:50%; top:6%; transform:translateX(-50%); min-width:74px; height:62px; padding:0 14px; border-radius:16px; background:#fff; border:5px solid #111;
    box-shadow:0 5px 0 #111; font:inherit; font-size:2.2rem; line-height:1; color:#111; z-index:4; cursor:pointer; white-space:nowrap; }
  .vx-card.next { animation:vs-pop .4s cubic-bezier(.2,1.8,.4,1); }
  .vx-p { position:absolute; bottom:8%; width:var(--pz); height:var(--pz); z-index:3; transition:transform .2s; }
  .vx-p.l { left:16%; } .vx-p.r { right:16%; } .vx-p.r > .ms { transform:scaleX(-1); }
  .vx-p .glove { position:absolute; top:34%; font-size:calc(var(--pz) * .34); } .vx-p.l .glove { right:-14%; } .vx-p.r .glove { left:-14%; transform:scaleX(-1); }
  .vx-p.l.punch { transform:translateX(40%); } .vx-p.r.punch { transform:translateX(-40%); }
  .vx-p.ouch { animation:vx-ouch .4s ease-out; filter:brightness(1.6); }
  .vx-p.ko { transform:rotate(-90deg) translateX(-30%); transform-origin:50% 100%; transition:transform .4s cubic-bezier(.5,0,.8,.6); }
  .vx-p.r.ko { transform:rotate(90deg) translateX(30%); }
  .vx-p.ko::after { content:"💫"; position:absolute; left:30%; top:-20%; font-size:calc(var(--pz) * .3); animation:vx-spin 1s linear infinite; }
  .vx-ring { background:linear-gradient(#5b3f8f 0 60%, #e9e2d0 60%); }
  .vx-ropes { position:absolute; left:4%; right:4%; top:34%; height:26%; border-top:6px solid #e8173c; border-bottom:6px solid #e8173c; }
  .vx-ropes::after { content:""; position:absolute; left:0; right:0; top:45%; border-top:6px solid #fff; }
  .vx-hp { position:absolute; top:8%; font-size:1.3rem; z-index:4; } .vx-hp.l { left:3%; } .vx-hp.r { right:3%; }
  .vx-disco { background:radial-gradient(ellipse at 50% 110%, #ff9ce0 0 30%, transparent 60%), linear-gradient(#2a1b5e, #6a2c8f); }
  .vx-floor { position:absolute; left:0; right:0; bottom:0; height:22%; background:repeating-linear-gradient(90deg, #ff4fa0 0 50px, #ffd400 50px 100px, #4dd36b 100px 150px, #2f8fe0 150px 200px); border-top:5px solid #111; }
  .vx-ball { position:absolute; left:50%; top:-2%; transform:translateX(-50%); font-size:3rem; animation:vx-spin 3s linear infinite; }
  .vx-meter { position:absolute; left:30%; right:30%; top:30%; height:16px; border:4px solid #111; border-radius:99px; background:linear-gradient(90deg, #3d8bff, #fff, #ff4d6d); z-index:4; }
  .vx-meter i { position:absolute; left:50%; top:-10px; width:8px; height:28px; margin-left:-4px; background:#ffd400; border:3px solid #111; border-radius:4px; transition:left .35s cubic-bezier(.3,1.5,.5,1); }
  .vx-p.groove > .ms { animation:vx-groove .45s ease-in-out infinite alternate; }
  .vx-p.r.groove > .ms { animation-name:vx-groove-r; }
  .vx-p.move0 { transform:translateY(-18%) rotate(-8deg); } .vx-p.move1 { transform:rotate(14deg) scale(1.08); } .vx-p.move2 { transform:scale(1.15, .85); } .vx-p.move3 { transform:translateY(-12%) rotate(-14deg); }
  .vx-court { background:linear-gradient(#3d6fd6 0 64%, #d9a46a 64%); }
  .vx-hoop { position:absolute; left:50%; top:32%; width:min(26vw, 150px); height:min(20vw, 110px); transform:translateX(-50%); z-index:2; }
  .vx-hoop .board { position:absolute; inset:0 0 30%; background:#fff; border:5px solid #111; border-radius:8px; }
  .vx-hoop .board::after { content:""; position:absolute; left:30%; right:30%; top:30%; bottom:4%; border:4px solid #e8173c; }
  .vx-hoop .rim { position:absolute; left:22%; right:22%; top:66%; height:8%; background:#ff7a00; border:3px solid #111; border-radius:99px; z-index:2; }
  .vx-hoop .net { position:absolute; left:26%; right:26%; top:72%; height:30%; border:3px solid #fff; border-top:0; clip-path:polygon(0 0, 100% 0, 80% 100%, 20% 100%);
    background:repeating-linear-gradient(45deg, transparent 0 6px, #fff 6px 8px); }
  .vx-hoop.swish .net { animation:vx-swish .4s ease-out; }
  .vx-hball { position:absolute; left:0; top:0; font-size:2.6rem; line-height:1; margin:-20px 0 0 -20px; z-index:3; pointer-events:none; }
  .vx-puzzle { background:#6a2c8f; display:flex; align-items:center; justify-content:center; }
  .vx-pz { position:relative; height:86%; aspect-ratio:1.2; background:#fff; border:5px solid #111; border-radius:12px; overflow:hidden; }
  .vx-pz .hid { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:min(14vw, 16vh, 7rem); font-weight:900; color:#111; line-height:1; white-space:nowrap; }
  .vx-pz .tiles { position:absolute; inset:0; display:grid; grid-template-columns:repeat(3, 1fr); grid-template-rows:repeat(3, 1fr); }
  .vx-pz .tile { background:#ffd400; border:3px solid #111; display:flex; align-items:center; justify-content:center; font-size:1.6rem; color:rgba(0,0,0,.25); transition:transform .4s ease-in, opacity .4s; }
  .vx-pz .tile:nth-child(even) { background:#ff9f43; }
  .vx-pz .tile.off { transform:translateY(-120%) rotate(30deg); opacity:0; }
  @keyframes vx-ouch { 25% { translate:-10px 0; } 75% { translate:10px 0; } }
  @keyframes vx-spin { to { transform:translateX(-50%) rotate(360deg); } }
  @keyframes vx-groove { from { transform:rotate(-6deg); } to { transform:rotate(6deg) translateY(-6%); } }
  @keyframes vx-groove-r { from { transform:scaleX(-1) rotate(-6deg); } to { transform:scaleX(-1) rotate(6deg) translateY(-6%); } }
  @keyframes vx-swish { 50% { transform:scaleY(1.4); } }
  /* 🤝 Team Up */
  .vs-score .hearts { font-size:1.2rem; } .vs-score .rnd { font-size:1.1rem; padding:0 6px; }
  .vs-stars { font-size:3rem; letter-spacing:6px; }
  .vt-pad.myturn { box-shadow:0 0 0 4px #fff, 0 0 24px 8px var(--pc); animation:vx-turn .6s ease-in-out infinite alternate; }
  .vt-pad.notturn { opacity:.45; filter:grayscale(.6); }
  .vt-pad.myturn .who { font-size:1.15rem; }
  .vx-mate { position:absolute; top:calc(66% - var(--tz) * .78); width:var(--tz); height:var(--tz); z-index:2; }
  .vx-mate.m0 { left:4%; } .vx-mate.m1 { left:19%; }
  .vx-foe { position:absolute; right:6%; top:calc(66% - var(--tz) * .85); width:var(--tz); height:var(--tz); z-index:2; }
  .vx-p.tag.t0 { left:4%; } .vx-p.tag.t1 { left:22%; }
  .vx-meter.team { left:20%; right:20%; background:#fff; overflow:hidden; } .vx-meter.team i { left:0; top:0; height:100%; width:0; margin:0; border:0; border-radius:0; background:linear-gradient(90deg, #ffd400, #ff4fa0); transition:width .35s; }
  .vx-split { background:linear-gradient(#ffe9c9, #ffd6a0); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; }
  .vx-ico { position:absolute; left:10px; top:8px; font-size:2.4rem; }
  .vx-pic { font-size:min(14vw, 13vh, 5rem); line-height:1; min-height:1em; cursor:pointer; }
  .vx-word { display:flex; gap:8px; justify-content:center; }
  .vx-cell { width:min(14vw, 12vh, 76px); height:min(14vw, 12vh, 76px); display:flex; align-items:center; justify-content:center; background:#fff; border:5px solid #111; border-radius:14px;
    box-shadow:0 5px 0 #111; font-size:min(9vw, 8vh, 3rem); font-weight:900; line-height:1; color:#111; }
  .vx-cell.gap { background:#ffe066; border-style:dashed; animation:vx-turn .5s ease-in-out infinite alternate; }
  @keyframes vx-turn { to { filter:brightness(1.15); } }
  /* 😈 Versus items */
  .vt-pad { position:relative; }
  .vs-item { position:fixed; top:calc(max(6px, env(safe-area-inset-top)) + 56px); z-index:80; width:62px; height:62px; border-radius:50%; border:5px solid #111; background:#ffd400;
    box-shadow:0 5px 0 #111; font:inherit; font-size:2rem; line-height:1; cursor:pointer; touch-action:manipulation; animation:vs-itemp .6s ease-in-out infinite alternate; }
  .vs-item.l { left:14px; } .vs-item.r { right:14px; }
  .vfx-slip { animation:vfx-slip .25s ease-in-out infinite alternate; pointer-events:none; }
  .vfx-flip .vs-game { transform:scaleX(-1); }
  .vfx-spin { animation:vfx-spin .6s ease-in-out; }
  .vfx-ink { position:absolute; inset:0; z-index:60; pointer-events:none; }
  .vfx-ink .b { position:absolute; border-radius:50%; background:#1a1030; animation:vs-pop .3s ease-out; }
  .vfx-ink .b1 { left:10%; top:15%; width:55%; height:55%; } .vfx-ink .b2 { left:40%; top:35%; width:50%; height:50%; } .vfx-ink .b3 { left:20%; top:50%; width:30%; height:30%; }
  .vfx-ice { position:absolute; inset:0; z-index:61; background:rgba(180,230,255,.75); border:5px solid #9fdcff; border-radius:16px; display:flex; align-items:center; justify-content:center; font-size:4rem; }
  @keyframes vs-itemp { to { transform:scale(1.1); } }
  @keyframes vfx-slip { from { transform:rotate(-3deg) translateX(-8px); } to { transform:rotate(3deg) translateX(8px); } }
  @keyframes vfx-spin { 50% { transform:rotate(8deg) scale(.95); } }
  /* The co-op split scenes look like their games (the teacher found a plain one confusing) */
  .vx-deco { position:absolute; pointer-events:none; }
  .th-rocket-fix { background:radial-gradient(circle at 20% 20%, #fff 0 1px, transparent 2px) 0 0 / 60px 50px, linear-gradient(#1b1f4d, #3b3f8f 70%, #6b5fb0); flex-direction:row; gap:30px; }
  .th-rocket-fix .vx-word { flex-direction:column; gap:0; position:relative; }
  .th-rocket-fix .vx-cell { width:min(16vw, 12vh, 80px); height:min(10vw, 9vh, 56px); border-radius:6px; margin-top:-4px; background:#e8f0ff; box-shadow:none; }
  .th-rocket-fix .vx-cell:first-child { border-radius:50% 50% 8% 8% / 80% 80% 20% 20%; height:min(13vw, 11vh, 70px); background:#e8173c; color:#fff; }
  .th-rocket-fix .vx-cell:last-child { position:relative; background:#2f8fe0; color:#fff; }
  .th-rocket-fix .vx-cell:last-child::before, .th-rocket-fix .vx-cell:last-child::after { content:""; position:absolute; bottom:-4px; width:40%; height:100%; background:#e8173c; border:4px solid #111; z-index:-1; }
  .th-rocket-fix .vx-cell:last-child::before { left:-34%; clip-path:polygon(100% 0, 100% 100%, 0 100%); } .th-rocket-fix .vx-cell:last-child::after { right:-34%; clip-path:polygon(0 0, 100% 100%, 0 100%); }
  .th-rocket-fix .vx-cell.gap { background:rgba(255,255,255,.25); border-color:#fff; }
  .th-rocket-fix .vx-deco { left:0; right:0; bottom:0; height:7%; background:#666; border-top:4px solid #111; }
  .th-rocket-fix .vx-word.go::after { content:"🔥"; position:absolute; left:50%; top:100%; transform:translateX(-50%) rotate(180deg); font-size:3rem; }
  .th-rocket-fix .vx-pic { order:2; background:#fff; border:4px solid #111; border-radius:16px; padding:6px 10px; }
  .th-burger-stack { background:linear-gradient(#ffe9c9 0 70%, #d24b3f 70% 72%, #b9e3ff 72%); flex-direction:row; gap:30px; }
  .th-burger-stack .vx-word { flex-direction:column; gap:0; }
  .th-burger-stack .vx-cell { width:min(30vw, 22vh, 150px); height:min(8vw, 7vh, 44px); margin-top:-4px; border-radius:24px; box-shadow:none; color:#fff; -webkit-text-stroke:1.5px #111; paint-order:stroke fill; }
  .th-burger-stack .vx-cell:nth-child(odd) { background:#3b2a1a; } .th-burger-stack .vx-cell:nth-child(even) { background:#ffd400; }
  .th-burger-stack .vx-cell:nth-child(3n) { background:#4dd36b; }
  .th-burger-stack .vx-cell:first-child { background:#f0a64a; height:min(10vw, 9vh, 56px); border-radius:50% 50% 12% 12% / 70% 70% 30% 30%; }
  .th-burger-stack .vx-cell:last-child { background:#e89a3c; border-radius:12% 12% 40% 40%; }
  .th-burger-stack .vx-cell.gap { background:rgba(255,255,255,.6); }
  .th-burger-stack .vx-pic { order:2; background:#fff; border:4px solid #111; border-radius:20px; padding:4px 10px; }
  .th-robot-repair { background:linear-gradient(180deg, #c9d3e0 0 70%, #8d99a8 70%); }
  .th-robot-repair .vx-deco { left:50%; top:50%; width:min(46vw, 40vh, 260px); height:min(40vw, 34vh, 220px); transform:translate(-50%, -46%); background:#9fb3c8; border:5px solid #111; border-radius:24px; }
  .th-robot-repair .vx-deco::before { content:""; position:absolute; left:50%; top:-12%; width:6%; height:14%; background:#555; }
  .th-robot-repair .vx-deco.dance { animation:vx-dance .3s ease-in-out infinite alternate; }
  .th-robot-repair .vx-word, .th-robot-repair .vx-pic { position:relative; z-index:1; }
  .th-robot-repair .vx-word { background:#1d2a3a; padding:8px; border:4px solid #111; border-radius:12px; }
  .th-robot-repair .vx-pic { background:#1d2a3a; border:4px solid #111; border-radius:12px; padding:4px 12px; }
  .th-bridge-builder { background:linear-gradient(#8fd8ff 0 42%, #6cc04a 42%); }
  .th-bridge-builder .vx-deco { left:14%; right:14%; top:52%; bottom:0; background:repeating-linear-gradient(180deg, #2f8fe0 0 20px, #3a9cf0 20px 40px); border-left:6px solid #3d8a2a; border-right:6px solid #3d8a2a; }
  .th-bridge-builder .vx-word { position:relative; z-index:1; gap:0; }
  .th-bridge-builder .vx-cell { background:linear-gradient(#c98a4b, #a86d34); color:#fff; -webkit-text-stroke:1.5px #111; paint-order:stroke fill; border-radius:6px; margin:0 -2px; box-shadow:none; }
  .th-bridge-builder .vx-cell.gap { background:transparent; border-color:#fff; }
  .th-bridge-builder .vx-pic { position:relative; z-index:1; }
  .th-cookie-cutter { background:repeating-linear-gradient(45deg, #ffe0ef 0 22px, #fff 22px 44px); }
  .th-cookie-cutter .vx-deco { left:50%; top:52%; width:min(56vw, 46vh, 300px); aspect-ratio:1; transform:translate(-50%, -50%); border-radius:50%; border:6px solid #111;
    background:radial-gradient(circle at 25% 30%, #5a3510 0 4%, transparent 5%), radial-gradient(circle at 70% 25%, #5a3510 0 3.5%, transparent 4.5%), radial-gradient(circle at 65% 78%, #5a3510 0 4%, transparent 5%), radial-gradient(circle, #e8b26a 0 60%, #c98a4b 100%); }
  .th-cookie-cutter .vx-word, .th-cookie-cutter .vx-pic { position:relative; z-index:1; }
  .th-cookie-cutter .vx-cell { background:transparent; border:0; box-shadow:none; color:#ff6fb0; -webkit-text-stroke:2px #111; paint-order:stroke fill; }
  .th-cookie-cutter .vx-cell.gap { background:#5a3510; border-radius:50%; box-shadow:inset 0 6px 10px rgba(0,0,0,.6); }
  .th-train-builder .vx-word .vx-cell { border-radius:10px 10px 4px 4px; background:#ffd400; }
  @keyframes vx-dance { from { transform:translate(-50%, -46%) rotate(-4deg); } to { transform:translate(-50%, -50%) rotate(4deg); } }
  @keyframes vw-boom { 40% { transform:translate(-50%, -50%) scale(1.5); filter:brightness(3); } 100% { transform:translate(-50%, -50%) scale(0); opacity:0; } }
  @keyframes vs-pop { from { transform:scale(.3); opacity:0; } }
  `;
  let cssDone = false;
  function injectCss() {
    if (cssDone) return;
    cssDone = true;
    const s = document.createElement("style"); s.textContent = CSS; document.head.appendChild(s);
  }

  // A small seeded random, so both halves build the same board (same target, same layout).
  function seeded(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const C = () => window.Core;
  const F = () => window.FrameAPI;
  let root = null, players = [], match = null;

  function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function shell() {
    injectCss();
    if (!root) { root = el("div"); root.id = "versus"; document.body.appendChild(root); }
    root.hidden = false;
    root.innerHTML = "";
    F().hideAll();
    return root;
  }
  function close() {
    endRound(true);
    match = null;
    if (root) { root.hidden = true; root.innerHTML = ""; }
    F().goTitle();
  }

  // ---------- Setup: who's playing? ----------
  let mode = "versus"; // or "coop" (🤝 Team Up)
  function open(m) {
    mode = m === "coop" ? "coop" : "versus";
    const r = shell();
    F().setTheme(5);
    if (window.Music) Music.play("menu");
    const chars = window.Mascot.CHARS.filter((c) => window.Mascot.isUnlocked(c.id));
    const p1 = window.Mascot.current();
    let p2 = null;
    try { p2 = JSON.parse(localStorage.getItem(P2_KEY)); } catch (err) { /* ok */ }
    if (!p2 || p2 === p1 || !chars.some((c) => c.id === p2)) p2 = (chars.find((c) => c.id !== p1) || chars[0]).id;
    players = [{ char: p1 }, { char: p2 }];
    const box = el("div", "vs-setup");
    const h = el("h1", "shout"); h.textContent = mode === "coop" ? TEXT.teamTitle : TEXT.setup;
    const pickers = el("div", "vs-pickers");
    players.forEach((p, i) => {
      const pk = el("div", "vs-picker");
      pk.style.setProperty("--pc", COLORS[i]);
      pk.innerHTML = `<div class="who shout">${TEXT.p(i + 1)}</div><div class="row"><button class="arrow" aria-label="previous">◀</button><div class="fig"></div><button class="arrow" aria-label="next">▶</button></div><div class="nm shout"></div>`;
      const fig = pk.querySelector(".fig"), nm = pk.querySelector(".nm");
      const show = () => {
        fig.innerHTML = "";
        const m = window.Mascot.el(Math.min(130, innerWidth * 0.22), p.char);
        window.Mascot.mood(m, "cheer");
        fig.appendChild(m);
        nm.textContent = (window.Mascot.CHARS.find((c) => c.id === p.char) || {}).name || "";
      };
      const step = (d) => {
        C().unlock();
        let k = chars.findIndex((c) => c.id === p.char);
        do { k = (k + d + chars.length) % chars.length; } while (chars.length > 2 && chars[k].id === players[1 - i].char);
        p.char = chars[k].id;
        C().sfx.tone(i ? 520 : 660, 0.06);
        show();
      };
      const [prev, next] = pk.querySelectorAll(".arrow");
      prev.addEventListener("click", () => step(-1));
      next.addEventListener("click", () => step(1));
      show();
      pickers.appendChild(pk);
    });
    const go = el("button", "chunky vs-go"); go.textContent = mode === "coop" ? TEXT.teamGo : TEXT.fight;
    go.addEventListener("click", () => {
      C().unlock();
      C().say(TEXT.say.go);
      try { localStorage.setItem(P2_KEY, JSON.stringify(players[1].char)); } catch (err) { /* ok */ }
      startMatch();
    });
    const back = el("button", "chunky"); back.textContent = TEXT.back;
    back.addEventListener("click", close);
    // FIRST TO 3 / 5 / 7 points.
    const goals = el("div", "vs-goal", '<span class="shout">' + TEXT.firstTo + "</span>");
    GOALS.forEach((g) => {
      const b = el("button"); b.textContent = g; b.setAttribute("aria-pressed", String(g === goal));
      b.addEventListener("click", () => {
        goal = g;
        try { localStorage.setItem(GOAL_KEY, JSON.stringify(g)); } catch (err) { /* ok */ }
        goals.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        C().sfx.tone(500 + g * 40, 0.06);
      });
      goals.appendChild(b);
    });
    box.append(h, pickers, ...(mode === "coop" ? [] : [goals]), go, back); // (Team Up: no first-to choice)
    r.appendChild(box);
  }

  // ---------- The match ----------
  function startMatch() {
    const r = shell();
    match = { score: [0, 0], round: 0, played: new Set(), token: 0, timers: [], rafs: [], sides: null, over: false, coop: mode === "coop", hearts: COOP_HEARTS };
    const top = el("div", "vs-top");
    const quit = el("button", "vs-quit"); quit.textContent = "✕"; quit.setAttribute("aria-label", TEXT.quit);
    quit.addEventListener("click", close);
    const score = el("div", "vs-score");
    score.innerHTML = match.coop ? '<span class="f0"></span><span class="vs shout">🤝</span><span class="hearts"></span><span class="rnd"></span><span class="f1"></span>' // (Team Up: team hearts, round n/8)
      : '<span class="f0"></span><span class="n s0">0</span><span class="vs shout">VS</span><span class="n s1">0</span><span class="f1"></span>';
    score.querySelector(".f0").appendChild(window.Mascot.el(36, players[0].char));
    score.querySelector(".f1").appendChild(window.Mascot.el(36, players[1].char));
    top.append(quit, score);
    const sides = el("div", "vs-sides");
    match.sideEls = [0, 1].map((i) => {
      const s = el("div", "vs-side");
      s.style.setProperty("--pc", COLORS[i]);
      s.innerHTML = `<div class="vs-head shout"><span class="fig"></span>${TEXT.p(i + 1)}</div><div class="vs-bar"><i></i></div><div class="vs-game"></div>`;
      s.querySelector(".fig").appendChild(window.Mascot.el(28, players[i].char));
      sides.appendChild(s);
      return { box: s, game: s.querySelector(".vs-game"), bar: s.querySelector(".vs-bar i") };
    });
    match.scoreEl = score;
    r.append(top, sides);
    later(nextRound, 600);
  }
  const later = (fn, ms) => { const id = setTimeout(fn, ms); if (match) match.timers.push(id); return id; };

  function pickGame() {
    const lists = F().listsInPlay();
    const usable = (g) => !VERSUS_SKIP.includes(g.id) && F().allowed(g) && lists.some((l) => (g.contentTypes || []).includes(l.type));
    const only = new URLSearchParams(location.search).get("vsgame");
    let pool = C().MICROGAMES.filter((g) => usable(g) && (!only || g.id === only));
    if (!pool.length) return null;
    let fresh = pool.filter((g) => !match.played.has(g.id));
    if (!fresh.length) { match.played.clear(); fresh = pool.filter((g) => g.id !== match.last); }
    const game = C().pick(fresh.length ? fresh : pool);
    match.played.add(game.id); match.last = game.id;
    const list = C().pick(lists.filter((l) => (game.contentTypes || []).includes(l.type)));
    return { game, list };
  }

  // ROUND n: the game's icon and instruction across both halves, then both games start together.
  function nextRound() {
    if (!match || match.over) return;
    endRound(false);
    const pick = pickGame();
    if (!pick) { close(); return; }
    match.round++;
    if (match.coop) drawTeam();
    F().setTheme(match.round);
    const ins = typeof pick.game.instruction === "function" ? pick.game.instruction(pick.list) : pick.game.instruction;
    const ban = el("div", "vs-banner", `<div class="ico">${pick.game.icon || "🎮"}</div><div class="w"><span class="sub">${TEXT.round(match.round)}</span>\n${(ins && ins.en) || ""}</div>`);
    root.appendChild(ban);
    if (window.Music) { Music.play(null); Music.jingle(match.round - 1); }
    later(() => { ban.remove(); startRound(pick.game, pick.list); }, 1700);
  }

  function startRound(game, list) {
    const token = ++match.token;
    const alive = () => match && token === match.token;
    if (window.Music) Music.play(game.id);
    match.result = null; // (a fresh round: also for the shared games, which return early)
    if (match.coop) { // 🤝 Team Up: take turns on the shared games; split the answers on Train Builder and the gap games; else both finish
      if (COOP_TURNS[game.id]) { race(game, list, alive, COOP_TURNS[game.id]()); return; }
      if (game.id === "train-builder" || SPLIT_GAP.includes(game.id)) { split(game, list, alive); return; }
    } else {
      if (SHARED[game.id]) { SHARED[game.id](game, list, alive); return; } // (a shared-screen versus game)
      if (RACES[game.id]) { RACES[game.id](game, list, alive); return; }
    }
    const items = F().prepItems(list);
    const paceMs = game.duration || 5000;
    const seed = Math.floor(Math.random() * 1e9);
    match.result = null;
    match.sides = match.sideEls.map((S, i) => {
      const side = { i, S, state: "playing", t0: performance.now() + START_LOCK, pauseFrom: 0, pauseTo: 0, paused: 0, frozenAt: 0, onTimeout: [], onEnd: [], cleanup: null, timers: [], rafs: [] };
      const sideAlive = () => alive() && side.state === "playing";
      const elapsed = (now) => {
        let p = side.paused;
        if (side.pauseTo) p += Math.max(0, Math.min(now, side.pauseTo) - side.pauseFrom);
        return Math.max(0, now - side.t0 - p);
      };
      side.elapsed = elapsed;
      S.game.innerHTML = "";
      S.game.classList.add("locked");
      S.box.querySelectorAll(".vs-cover").forEach((x) => x.remove());
      const ctx = {
        root: S.game,
        items: items.slice(),
        list: { id: list.id, type: list.type },
        speed: 1, timeLimit: paceMs, paceMs, demo: false, boss: null,
        hint: () => {}, tutorial: () => {}, reveal: () => 0, nightTheme: () => {},
        audio: C().audioCtx(),
        canSpeak: F().canSpeak(),
        get ended() { return !alive() || side.state !== "playing"; },
        say: (text) => { if (alive() && i === 0) C().say(text); }, // (one voice: player 1's game speaks for both)
        sfx: C().sfx,
        win: () => result(side, true),
        lose: () => result(side, false),
        onTimeout: (fn) => side.onTimeout.push(fn),
        onEnd: (fn) => side.onEnd.push(fn),
        timeFrac: () => Math.max(0, Math.min(1, elapsed(side.frozenAt || performance.now()) / paceMs)),
        pauseTimer: (ms) => {
          if (!sideAlive() || side.frozenAt) return;
          const now = performance.now();
          if (side.pauseTo) { side.paused += Math.max(0, Math.min(now, side.pauseTo) - side.pauseFrom); }
          side.pauseFrom = now; side.pauseTo = now + ms;
        },
        freezeTimer: () => { if (sideAlive() && !side.frozenAt) side.frozenAt = performance.now(); },
        later: (fn, ms) => { if (!alive()) return 0; const id = setTimeout(() => { if (alive()) guard(game, fn); }, ms); side.timers.push(id); return id; },
        raf: (fn) => { if (!alive()) return 0; const id = requestAnimationFrame((ts) => { if (alive()) guard(game, fn, ts); }); side.rafs.push(id); return id; },
        powerBar: (o) => window.PowerBar.create({ raf: ctx.raf, sfx: C().sfx, speed: 1, ended: () => ctx.ended, ...o }),
        confetti: C().confetti, shuffle: C().shuffle, pick: C().pick,
        pickOptions: (t, n) => C().pickOptions(ctx.items, t, n),
        lowerLookalikes: (t) => C().lowerLookalikes(ctx.items, t),
        choiceRows: (R, N, o = {}) => C().choiceRows(ctx.items, list.type, R, N, { canSpeak: F().canSpeak(), ...o }),
        choiceSteps: (R, N, o = {}) => C().choiceSteps(ctx.items, list.type, R, N, { canSpeak: F().canSpeak(), ...o }),
        gapSteps: (R, N, o = {}) => C().gapSteps(ctx.items, list.type, R, N, { slow: true, ...o }),
        phonics: { pics: C().startPics, set: (t, a, b) => C().phonicsSet(ctx.items, t, a, b) },
      };
      // Same seed for both halves: the same target and board.
      const rnd = Math.random;
      Math.random = seeded(seed);
      try { side.cleanup = game.start(ctx) || null; } catch (err) { console.error(`versus ${game.id} start:`, err); side.state = "broken"; }
      finally { Math.random = rnd; }
      setTimeout(() => { if (alive()) S.game.classList.remove("locked"); }, START_LOCK);
      return side;
    });
    if (match.sides.some((s) => s.state === "broken")) { later(nextRound, 300); return; }
    // The clocks (one per side: rhythm games pause their own between targets).
    const tick = () => {
      if (!alive()) return;
      const now = performance.now();
      match.sides.forEach((side) => {
        if (side.state !== "playing") return;
        const f = Math.max(0, 1 - side.elapsed(side.frozenAt || now) / paceMs);
        side.S.bar.style.transform = `scaleX(${f.toFixed(3)})`;
        side.S.bar.classList.toggle("low", f < 0.3);
        if (f <= 0 && !side.frozenAt) timeUp(side);
      });
      match.raf = requestAnimationFrame(tick);
    };
    match.raf = requestAnimationFrame(tick);
  }
  function guard(game, fn, ts) { try { fn(ts); } catch (err) { console.error(`versus ${game.id}:`, err); } }

  function timeUp(side) {
    if (side.state !== "playing") return;
    side.state = "timeout";
    side.onTimeout.forEach((fn) => { try { fn(); } catch (err) { console.error("versus timeout:", err); } });
    cover(side, TEXT.slow, false);
    settle();
  }
  // A side's result: the first to win takes the point (the other side is stopped); a loss knocks that
  // side out, and when both are out nobody scores.
  function result(side, won) {
    if (!match || side.state !== "playing" || match.over) return;
    side.state = won ? "won" : "lost";
    side.onEnd.forEach((fn) => { try { fn(won, false); } catch (err) { /* ok */ } });
    if (match.coop) { // Team Up: the round counts when BOTH have won
      if (won) { C().sfx.happy && C().sfx.happy(); cover(side, TEXT.bothDone, true); }
      else { C().sfx.buzz && C().sfx.buzz(); cover(side, TEXT.out, false); }
      settle();
      return;
    }
    if (won && !match.result) {
      match.result = side.i;
      const other = match.sides[1 - side.i];
      if (other.state === "playing") { other.state = "beaten"; cover(other, TEXT.slow, false); }
      C().sfx.happy && C().sfx.happy();
      later(() => { cover(side, TEXT.point, true); scorePoint(side.i); }, 900);
      return;
    }
    if (!won) { C().sfx.buzz && C().sfx.buzz(); cover(side, TEXT.out, false); }
    settle();
  }
  function settle() {
    if (match.result != null) return;
    if (match.coop) {
      if (match.sides.every((s) => s.state !== "playing")) { match.result = 0; const ok = match.sides.every((s) => s.state === "won"); later(() => teamRound(ok), 900); }
      return;
    }
    if (match.sides.every((s) => s.state !== "playing")) {
      match.result = -1;
      later(() => { banner(TEXT.nobody); later(nextRound, 1500); }, 900);
    }
  }
  function cover(side, text, win) {
    const c = el("div", "vs-cover" + (win ? " win" : ""), `<div class="w shout"></div>`);
    c.firstChild.textContent = text;
    if (win) {
      const m = window.Mascot.el(Math.min(120, side.S.box.clientWidth * 0.4), players[side.i].char);
      window.Mascot.mood(m, "cheer");
      c.prepend(m);
    }
    side.S.box.appendChild(c);
  }
  function banner(text) {
    const b = el("div", "vs-banner", `<div class="w"></div>`);
    b.firstChild.textContent = text;
    root.appendChild(b);
    later(() => b.remove(), 1400);
  }
  function scorePoint(i) {
    match.score[i]++;
    const n = match.scoreEl.querySelector(`.s${i}`);
    n.textContent = match.score[i];
    n.classList.remove("pop"); void n.offsetWidth; n.classList.add("pop");
    [523, 659, 784].forEach((f, k) => C().sfx.tone(f, 0.1, "triangle", 0.09, k * 0.08));
    C().say(TEXT.say.point(i + 1));
    if (match.score[i] >= goal) { later(() => champion(i), 1800); return; }
    giveCatchUp(1 - i);
    later(nextRound, 1900);
  }

  // ---------- 😈 Silly Versus items (the teacher's idea; Settings → Items) ----------
  // Whoever's BEHIND gets an item box after a point (a catch-up: it keeps it close): it appears as a big pulsing
  // button at the top of their side; tap it during a round to mess with the other player:
  //   🍌 BANANA PEEL  their buttons slip and wobble (no tapping) for 2 s
  //   🐙 INK SPLAT    a blob of ink covers their screen for 3 s
  //   🌪️ SHUFFLE STORM their answers swap places (a shared game) or their screen flips round (3 s)
  //   🧊 FREEZE RAY   they turn to ice for 1.6 s (no tapping)
  const VITEMS = [
    { id: "banana", icon: "🍌", name: "BANANA PEEL" }, { id: "ink", icon: "🐙", name: "INK SPLAT" },
    { id: "storm", icon: "🌪️", name: "SHUFFLE STORM" }, { id: "freeze", icon: "🧊", name: "FREEZE RAY" },
  ];
  function giveCatchUp(t) {
    if (!window.Items || !window.Items.on() || match.coop) return;
    if (match.score[t] >= match.score[1 - t]) return;           // only whoever's behind
    match.vitems = match.vitems || [null, null];
    if (match.vitems[t]) return;                                  // one at a time
    const it = C().pick(VITEMS);
    match.vitems[t] = it;
    later(() => { window.Items.toast(`🎁 ${TEXT.p(t + 1)}: ${it.icon} ${it.name}!`); drawVItems(); }, 700);
  }
  function drawVItems() {
    root.querySelectorAll(".vs-item").forEach((x) => x.remove());
    (match.vitems || []).forEach((it, i) => {
      if (!it) return;
      const b = el("button", `vs-item ${i ? "r" : "l"}`);
      b.textContent = it.icon;
      b.setAttribute("aria-label", it.name);
      b.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); useVItem(i); });
      root.appendChild(b);
    });
  }
  function useVItem(i) {
    const it = match.vitems && match.vitems[i];
    const inRound = (match.sides || match.shared) && match.result == null;
    if (!it || !inRound) { C().sfx.tone(200, 0.08, "square", 0.06); return; }
    match.vitems[i] = null;
    drawVItems();
    const o = 1 - i;
    const target = match.shared ? match.shared.querySelector(o ? ".vt-pad.r" : ".vt-pad.l") : match.sideEls[o].box;
    if (!target) return;
    window.Items.toast(`${it.icon} ${it.name}!`);
    C().say(it.name.toLowerCase() + "!");
    const fx = (cls, ms, html) => {
      const ov = html ? el("div", cls, html) : null;
      if (ov) target.appendChild(ov); else target.classList.add(cls);
      setTimeout(() => { if (ov) ov.remove(); else target.classList.remove(cls); }, ms);
    };
    if (it.id === "banana") { fx("vfx-slip", 2000); C().sfx.sweep(900, 200, 0.4, "sine", 0.1); }
    if (it.id === "ink") { fx("vfx-ink", 3000, '<div class="b b1"></div><div class="b b2"></div><div class="b b3"></div>'); C().sfx.noise(0.3, "lowpass", 600, 200, 0.5); }
    if (it.id === "storm") {
      const btns = target.querySelector(".btns");
      if (btns) { [...btns.children].sort(() => Math.random() - 0.5).forEach((c) => btns.appendChild(c)); fx("vfx-spin", 600); }
      else fx("vfx-flip", 3000);
      C().sfx.sweep(300, 1200, 0.5, "sawtooth", 0.06);
    }
    if (it.id === "freeze") { fx("vfx-ice", 1600, "<span>🧊</span>"); C().sfx.sweep(2000, 600, 0.4, "triangle", 0.08); }
  }

  // ---------- A RACE on one shared screen (Boxing, Dance Off, Puzzle Reveal, Hoop Shot) ----------
  // The shared part: a field across the top (the game draws it: cfg.field(box) returns { card, fx, ... }), each
  // player's own answer buttons in their half below (same target, shuffled separately), a wrong tap makes that
  // player dizzy for a moment, one clock. The first to tap the right answer: cfg.hit(i, o) (returns true when
  // that ends the round: cfg.win(i) plays the ending, then the point); then a new target for both
  // (cfg.oneTarget: no new target, the round is that one question: Puzzle Reveal). Out of time: cfg.timeUp()
  // returns the winner (or -1: nobody).
  function race(game, list, alive, cfg) {
    const items = F().prepItems(list);
    const N = cfg.N || 3, DIZZY = 1200;
    const steps = C().choiceSteps(items, list.type, 12, N, { lowercase: true, canSpeak: F().canSpeak() });
    let si = 0, step = steps[0], over = false;
    const sides = root.querySelector(".vs-sides");
    sides.classList.add("shared");
    const box = el("div", "vs-shared", `<div class="vx-field ${cfg.cls}"><div class="vt-bar"><i></i></div><div class="vt-fx"></div></div>` +
      `<div class="vt-pads"><div class="vt-pad l" style="--pc:${COLORS[0]}"></div><div class="vt-pad r" style="--pc:${COLORS[1]}"></div></div>`);
    sides.appendChild(box);
    match.shared = box;
    const field = box.querySelector(".vx-field"), bar = box.querySelector(".vt-bar i"), fx = box.querySelector(".vt-fx");
    const pads = [box.querySelector(".vt-pad.l"), box.querySelector(".vt-pad.r")];
    const api = { field, fx, step: () => step, later, word, chars: players.map((p) => p.char), say: (t) => C().say(t) };
    const g = cfg.field(api);
    if (g.card) g.card.addEventListener("pointerdown", (e) => { e.preventDefault(); if (!over) C().say(step.prompt); });
    const dizzy = [0, 0];
    let turn = 0; // (cfg.turns, Team Up: whose go it is)
    function deal() {
      if (g.card) { g.card.textContent = step.listen ? step.target.text : step.cardText; g.card.classList.remove("next"); void g.card.offsetWidth; g.card.classList.add("next"); }
      if (cfg.show) cfg.show(step);
      pads.forEach((pad, i) => {
        pad.innerHTML = `<div class="who">${TEXT.p(i + 1)}${cfg.score ? " " + cfg.score(i) : ""}${cfg.turns && i === turn ? " " + TEXT.yourTurn : ""}</div><div class="btns"></div>`;
        if (cfg.turns) { pad.classList.toggle("myturn", i === turn); pad.classList.toggle("notturn", i !== turn); }
        C().shuffle(step.row.slice()).forEach((o) => {
          const b = el("button", "vt-btn");
          b.textContent = o.text;
          if (o.kind === "word") b.style.fontSize = `${Math.min(30, 120 / (o.text.length * 0.6))}px`;
          b.addEventListener("pointerdown", (e) => { e.preventDefault(); tap(i, b, o); });
          pad.lastChild.appendChild(b);
        });
      });
      if (!cfg.silent) C().say(step.prompt);
    }
    function tap(i, b, o) {
      if (over || !alive() || performance.now() < dizzy[i]) return;
      if (cfg.turns && i !== turn) { C().sfx.tone(200, 0.06, "square", 0.05); return; } // (not your go: wait for your friend)
      if (!o.right && cfg.turns) { // Team Up: a wrong one passes the go to your friend (same question)
        b.classList.add("bad");
        C().sfx.sweep(500, 160, 0.3, "sawtooth", 0.08);
        if (cfg.miss) cfg.miss(i);
        pads.forEach((pad) => pad.classList.add("wait"));
        later(() => { if (!over) { pads.forEach((pad) => pad.classList.remove("wait")); turn = 1 - turn; deal(); } }, 700);
        return;
      }
      if (!o.right) {
        b.classList.add("bad");
        dizzy[i] = performance.now() + DIZZY;
        pads[i].classList.add("dizzy");
        C().sfx.sweep(500, 160, 0.3, "sawtooth", 0.08);
        if (cfg.miss) cfg.miss(i);
        later(() => pads[i] && pads[i].classList.remove("dizzy"), DIZZY);
        return;
      }
      if (o.kind === "pic") C().say(o.spoken);
      if (cfg.hit(i, o)) { finish(i); return; }
      if (cfg.oneTarget) return;
      if (cfg.turns) turn = 1 - turn;
      si++; step = steps[si % steps.length];
      pads.forEach((pad) => pad.classList.add("wait"));
      later(() => { if (!over) { pads.forEach((pad) => pad.classList.remove("wait")); deal(); } }, 600);
    }
    function word(text, at, big) {
      const w = el("div", "vt-word" + (big ? " big" : ""));
      w.textContent = text;
      w.style.left = typeof at === "number" ? (at === 0 ? "26%" : at === 1 ? "74%" : "50%") : at || "50%";
      fx.appendChild(w);
      later(() => w.remove(), big ? 1600 : 900);
    }
    function finish(winner) {
      if (over) return;
      over = true;
      cancelAnimationFrame(match.sharedRaf);
      if (match.coop) { // Team Up: the team did it (or ran out of time)
        if (winner < 0) { if (cfg.nobody) cfg.nobody(); later(() => teamRound(false), 700); return; }
        if (cfg.win) cfg.win(winner);
        later(() => C().confetti(fx, fx.clientWidth / 2, fx.clientHeight * 0.35, { count: 80 }), 400);
        later(() => teamRound(true), 1300);
        return;
      }
      if (winner < 0) { match.result = -1; if (cfg.nobody) cfg.nobody(); later(() => { banner(TEXT.nobody); later(nextRound, 1500); }, 700); return; }
      if (cfg.win) cfg.win(winner);
      later(() => { C().confetti(fx, winner ? fx.clientWidth * 0.75 : fx.clientWidth * 0.25, fx.clientHeight * 0.35, { count: 70 }); }, 400);
      match.result = winner;
      later(() => scorePoint(winner), 1300);
    }
    const T0 = performance.now() + 500, LIMIT = (cfg.limit || game.duration || 12000) * 1.25;
    (function tick() {
      if (!alive() || over) return;
      const f = Math.max(0, 1 - (performance.now() - T0) / LIMIT);
      bar.style.transform = `scaleX(${f.toFixed(3)})`;
      if (cfg.tick) cfg.tick(1 - f);
      if (f <= 0) { finish(cfg.timeUp ? cfg.timeUp() : -1); return; }
      match.sharedRaf = requestAnimationFrame(tick);
    })();
    deal();
  }
  // Two fighters / dancers / shooters: the players' characters, facing each other.
  function duo(field, size) {
    return [0, 1].map((i) => {
      const h = el("div", `vx-p ${i ? "r" : "l"}`);
      h.style.setProperty("--pz", size);
      const f = window.Mascot.el("var(--pz)", players[i].char);
      h.appendChild(f);
      field.appendChild(h);
      return { h, f };
    });
  }
  const bump = (n, cls, ms) => { n.classList.remove(cls); void n.offsetWidth; n.classList.add(cls); setTimeout(() => n.classList.remove(cls), ms); };

  const RACES = {
    // MONSTER BOXING: your two characters box each other in a ring. The first right answer lands a punch (POW!);
    // 3 punches: K.O.: the loser flops onto the canvas with stars circling, the winner cheers.
    "monster-boxing": (game, list, alive) => {
      const hp = [3, 3];
      let P = null;
      race(game, list, alive, {
        cls: "vx-ring",
        field(api) {
          api.field.insertAdjacentHTML("afterbegin", '<div class="vx-ropes"></div><button class="vx-card"></button><div class="vx-hp l"></div><div class="vx-hp r"></div>');
          P = duo(api.field, "min(22vw, 24vh, 130px)");
          P.forEach((p) => p.h.insertAdjacentHTML("beforeend", '<div class="glove">🥊</div>'));
          this.api = api;
          hpDraw();
          return { card: api.field.querySelector(".vx-card") };
        },
        hit(i) {
          const o = 1 - i;
          hp[o]--;
          hpDraw();
          bump(P[i].h, "punch", 300);
          bump(P[o].h, "ouch", 400);
          this.api.word(["POW!", "BAM!", "WHAM!"][2 - hp[o]], o);
          C().sfx.noise(0.12, "lowpass", 1200, 200, 0.6); C().sfx.tone(110, 0.15, "square", 0.12);
          return hp[o] <= 0;
        },
        win(i) {
          const o = 1 - i;
          P[o].h.classList.add("ko");
          window.Mascot.mood(P[o].f, "sad");
          window.Mascot.mood(P[i].f, "cheer");
          this.api.word("K.O.!", "50%", true);
          [0, 0.25, 0.5].forEach((t) => C().sfx.tone(1200, 0.25, "triangle", 0.1, t)); // ding ding ding
        },
        timeUp: () => (hp[0] === hp[1] ? -1 : hp[0] > hp[1] ? 0 : 1),
      });
      function hpDraw() {
        const f = root.querySelector(".vx-ring");
        if (!f) return;
        ["l", "r"].forEach((s, i) => { f.querySelector(`.vx-hp.${s}`).textContent = "❤️".repeat(Math.max(0, hp[i])) + "🖤".repeat(3 - Math.max(0, hp[i])); });
      }
    },
    // DANCE OFF: a dance battle on one disco floor. The first right answer busts a move and the crowd cheers for
    // that dancer; the crowd meter tips their way. First to 3 moves wins the crowd; the other sulks.
    "dance-off": (game, list, alive) => {
      const moves = [0, 0];
      let P = null;
      race(game, list, alive, {
        cls: "vx-disco",
        score: (i) => "🕺".repeat(moves[i]),
        field(api) {
          api.field.insertAdjacentHTML("afterbegin", '<div class="vx-ball">🪩</div><div class="vx-floor"></div><button class="vx-card"></button><div class="vx-meter"><i></i></div>');
          P = duo(api.field, "min(22vw, 26vh, 140px)");
          P.forEach((p) => p.h.classList.add("groove"));
          this.api = api;
          return { card: api.field.querySelector(".vx-card") };
        },
        hit(i) {
          moves[i]++;
          const k = moves[0] + moves[1];
          P[i].h.className = `vx-p ${i ? "r" : "l"} move${k % 4}`;
          setTimeout(() => P[i].h.classList.add("groove"), 500);
          window.Mascot.mood(P[i].f, "cheer"); setTimeout(() => window.Mascot.mood(P[i].f, null), 600);
          this.api.word(["GROOVY!", "FUNKY!", "WOW!", "NICE!"][k % 4], i);
          const m = root.querySelector(".vx-meter i");
          if (m) m.style.left = `${50 + (moves[1] - moves[0]) * 14}%`;
          [523, 659, 784].forEach((f, n) => C().sfx.tone(f, 0.08, "square", 0.07, n * 0.06));
          C().sfx.noise(0.3, "bandpass", 2000, 1500, 0.15); // the crowd
          return moves[i] >= 3;
        },
        win(i) {
          window.Mascot.mood(P[i].f, "cheer");
          window.Mascot.mood(P[1 - i].f, "sad");
          P[1 - i].h.classList.remove("groove");
          this.api.word("👏 WINNER! 👏", i, true);
          C().sfx.noise(1.2, "bandpass", 2500, 1200, 0.25); // the crowd goes wild
        },
        timeUp: () => (moves[0] === moves[1] ? -1 : moves[0] > moves[1] ? 0 : 1),
      });
    },
    // HOOP SHOT: one hoop on the wall between them. The first right answer shoots from that side: SWISH! First to
    // 3 baskets wins.
    "hoop-shot": (game, list, alive) => {
      const pts = [0, 0];
      let P = null;
      race(game, list, alive, {
        cls: "vx-court",
        score: (i) => "🏀".repeat(pts[i]),
        field(api) {
          api.field.insertAdjacentHTML("afterbegin", '<div class="vx-hoop"><div class="board"></div><div class="rim"></div><div class="net"></div></div><button class="vx-card"></button>');
          P = duo(api.field, "min(18vw, 22vh, 110px)");
          this.api = api;
          return { card: api.field.querySelector(".vx-card") };
        },
        hit(i) {
          pts[i]++;
          const fld = this.api.field, hoop = fld.querySelector(".vx-hoop").getBoundingClientRect(), fr = fld.getBoundingClientRect(), pr = P[i].h.getBoundingClientRect();
          const ball = el("div", "vx-hball"); ball.textContent = "🏀"; fld.appendChild(ball);
          const a = { x: pr.left - fr.left + pr.width / 2, y: pr.top - fr.top }, b = { x: hoop.left - fr.left + hoop.width / 2, y: hoop.top - fr.top + hoop.height * 0.55 };
          ball.animate([{ transform: `translate(${a.x}px, ${a.y}px)` }, { transform: `translate(${(a.x + b.x) / 2}px, ${Math.min(a.y, b.y) - 80}px) rotate(200deg)`, offset: 0.55 },
            { transform: `translate(${b.x}px, ${b.y}px) rotate(400deg) scale(.8)` }, { transform: `translate(${b.x}px, ${b.y + 70}px) scale(.8)`, opacity: 0 }], { duration: 750, easing: "ease-in-out", fill: "forwards" });
          setTimeout(() => ball.remove(), 800);
          C().sfx.sweep(300, 900, 0.3, "triangle", 0.08);
          setTimeout(() => { C().sfx.noise(0.2, "bandpass", 3000, 2000, 0.3); this.api.word("SWISH!", i); bump(fld.querySelector(".vx-hoop"), "swish", 400); }, 560);
          window.Mascot.mood(P[i].f, "cheer"); setTimeout(() => window.Mascot.mood(P[i].f, null), 700);
          return pts[i] >= 3;
        },
        miss(i) { this.api.word("CLANG!", i); C().sfx.tone(180, 0.15, "square", 0.1); },
        win(i) { window.Mascot.mood(P[i].f, "cheer"); window.Mascot.mood(P[1 - i].f, "sad"); this.api.word("🏆 CHAMPION!", i, true); },
        timeUp: () => (pts[0] === pts[1] ? -1 : pts[0] > pts[1] ? 0 : 1),
      });
    },
    // PUZZLE REVEAL: one picture uncovering piece by piece in the middle; both watch and race to answer with their
    // own buttons. One question per round: the first right answer wins it.
    "puzzle-reveal": (game, list, alive) => {
      let tiles = [], T = 0;
      race(game, list, alive, {
        cls: "vx-puzzle",
        oneTarget: true, silent: true, // (nothing said: the voice would give it away)
        limit: 12000,
        field(api) {
          api.field.insertAdjacentHTML("afterbegin", '<div class="vx-pz"><div class="hid"></div><div class="tiles"></div></div>');
          const t = api.field.querySelector(".tiles");
          tiles = [...Array(9)].map(() => { const d = el("div", "tile"); d.textContent = "?"; t.appendChild(d); return d; });
          tiles = C().shuffle(tiles);
          this.api = api;
          return { card: null };
        },
        show(step) { const h = root.querySelector(".vx-pz .hid"); h.textContent = step.listen ? step.target.text : step.cardText; },
        tick(f) {
          // A piece lifts off every so often; the last one never does.
          const n = Math.min(8, Math.floor(f / 0.85 * 9));
          for (; T < n; T++) { tiles[T].classList.add("off"); C().sfx.tone(500 + T * 60, 0.05, "triangle", 0.05); }
        },
        hit(i) { tiles.forEach((t) => t.classList.add("off")); this.api.word("GOT IT!", i, true); C().sfx.happy && C().sfx.happy(); return true; },
        nobody() { tiles.forEach((t) => t.classList.add("off")); },
      });
    },
  };

  // =====================================================================================================
  // 🤝 TEAM UP (co-op; the teacher's design): the two players work together. 3 team hearts, 8 rounds, no boss.
  //   BOTH FINISH (most games): two copies like Versus, but the round only counts when BOTH win.
  //   TAKE TURNS (the shared-screen games): one shared scene, the players take turns (the glowing side's go),
  //     team vs a goal: pull the Gorilla into the mud, knock out Robot Boss, fill the crowd meter, sink 4
  //     baskets, defuse the bomb, guess the puzzle. A wrong answer passes the go to your friend.
  //   SPLIT THE ANSWERS (Train Builder and the gap games): one puzzle on top, the answer cards split between the
  //     two players, so you have to work out whose card it is ("is it yours or mine?").
  // A round lost costs a heart; no hearts left, game over. All 8 rounds: TEAM WIN! with stars for hearts left.
  // =====================================================================================================
  const COOP_ROUNDS = 8, COOP_HEARTS = 3;
  const SPLIT_GAP = ["robot-repair", "burger-stack", "bridge-builder", "cookie-cutter", "rocket-fix"];
  function teamRound(ok) {
    if (!match || match.over) return;
    if (ok) {
      banner(TEXT.teamWin);
      [523, 659, 784, 1047].forEach((f, k) => C().sfx.tone(f, 0.1, "triangle", 0.09, k * 0.08));
      C().say(TEXT.say.team);
    } else {
      match.hearts--;
      banner(TEXT.ohNo);
      C().sfx.sweep(500, 200, 0.5, "sawtooth", 0.07);
    }
    drawTeam();
    if (match.hearts <= 0) { later(() => coopEnd(false), 1600); return; }
    if (match.round >= COOP_ROUNDS) { later(() => coopEnd(true), 1600); return; }
    later(nextRound, 1700);
  }
  function drawTeam() {
    if (!match.scoreEl) return;
    match.scoreEl.querySelector(".hearts").textContent = "❤️".repeat(Math.max(0, match.hearts)) + "🖤".repeat(COOP_HEARTS - Math.max(0, match.hearts));
    match.scoreEl.querySelector(".rnd").textContent = `${Math.min(match.round, COOP_ROUNDS)}/${COOP_ROUNDS}`;
  }
  // The end: both characters cheering (stars for hearts left), or sad: SO CLOSE!
  function coopEnd(won) {
    endRound(true);
    match.over = true;
    const r = shell();
    if (window.Music) Music.play("menu");
    const box = el("div", "vs-setup");
    const h = el("h1", "shout"); h.textContent = won ? TEXT.teamDone : TEXT.teamLost;
    const champ = el("div", "vs-champ");
    players.forEach((p) => { const m = window.Mascot.el(130, p.char); window.Mascot.mood(m, won ? "cheer" : "sad"); champ.appendChild(m); });
    const stars = el("div", "vs-stars"); stars.textContent = won ? "⭐".repeat(Math.max(1, match.hearts)) + "☆".repeat(COOP_HEARTS - Math.max(1, match.hearts)) : "";
    const btns = el("div", "vs-end-buttons");
    const again = el("button", "chunky hot"); again.textContent = TEXT.again;
    again.addEventListener("click", () => { C().unlock(); startMatch(); });
    const menu = el("button", "chunky"); menu.textContent = TEXT.menu;
    menu.addEventListener("click", close);
    btns.append(again, menu);
    box.append(h, champ, stars, btns);
    r.appendChild(box);
    if (won) {
      [392, 523, 659, 784, 1047].forEach((f, k) => C().sfx.tone(f, 0.14, "square", 0.07, k * 0.1));
      setTimeout(() => C().confetti(r, r.clientWidth / 2, r.clientHeight * 0.35, { count: 140 }), 200);
    }
    C().say(won ? TEXT.say.teamDone : TEXT.say.teamLost);
  }

  // TAKE TURNS: the shared games, team against a goal (cfg for race() with turns: true).
  const COOP_TURNS = {
    // Both pull the rope together against Gorilla Boss; 4 heaves and he's in the mud.
    "tug-of-war": () => {
      let p = 0, G = null, P = null;
      return {
        cls: "vt-field vx-team", turns: true, score: () => "",
        field(api) {
          api.field.insertAdjacentHTML("afterbegin", '<div class="vt-mud"></div><div class="vt-group"><div class="vt-rope"></div><div class="vt-flag"></div></div><button class="vx-card"></button>');
          const grp = api.field.querySelector(".vt-group");
          P = players.map((pl, i) => { const h = el("div", `vx-mate m${i}`); const f = window.Mascot.el("var(--tz)", pl.char); window.Mascot.mood(f, "pull"); h.appendChild(f); grp.appendChild(h); return f; });
          G = el("div", "vx-foe"); G.appendChild(window.Boss.el("gorilla", "var(--tz)")); grp.appendChild(G);
          this.api = api; this.grp = grp;
          return { card: api.field.querySelector(".vx-card") };
        },
        hit(i) {
          p++;
          this.grp.style.transform = `translateX(${-p * 6}%)`;
          bump(P[i], "heave", 300);
          window.Boss.setMood(G.firstChild, "hurt");
          this.api.word("HEAVE!", i);
          C().sfx.sweep(200, 420, 0.2, "square", 0.07);
          return p >= 4;
        },
        win() {
          G.animate([{ transform: "none" }, { transform: "translateX(-60%) rotate(-75deg)" }], { duration: 420, fill: "forwards" });
          setTimeout(() => { G.firstChild.classList.add("muddy"); window.Boss.setMood(G.firstChild, "cry"); P.forEach((f) => window.Mascot.mood(f, "cheer")); this.api.word("SPLASH!", "50%", true); C().sfx.noise(0.5, "lowpass", 1200, 150, 0.7); }, 420);
        },
      };
    },
    // Tag team boxing against Robot Boss: 4 punches and it's K.O.
    "monster-boxing": () => {
      let hp = 4, R = null, P = null;
      return {
        cls: "vx-ring vx-team", turns: true,
        field(api) {
          api.field.insertAdjacentHTML("afterbegin", '<div class="vx-ropes"></div><button class="vx-card"></button><div class="vx-hp r"></div>');
          P = players.map((pl, i) => { const h = el("div", `vx-p l tag t${i}`); h.style.setProperty("--pz", "min(18vw, 22vh, 110px)"); h.appendChild(window.Mascot.el("var(--pz)", pl.char)); h.insertAdjacentHTML("beforeend", '<div class="glove">🥊</div>'); api.field.appendChild(h); return h; });
          R = el("div", "vx-p r"); R.style.setProperty("--pz", "min(24vw, 28vh, 150px)"); R.appendChild(window.Boss.el("robot", "var(--pz)")); api.field.appendChild(R);
          this.api = api; this.hpDraw = () => { api.field.querySelector(".vx-hp.r").textContent = "❤️".repeat(hp) + "🖤".repeat(4 - hp); }; this.hpDraw();
          return { card: api.field.querySelector(".vx-card") };
        },
        hit(i) {
          hp--; this.hpDraw();
          bump(P[i], "punch", 300); bump(R, "ouch", 400);
          window.Boss.setMood(R.firstChild, "hurt");
          this.api.word(["POW!", "BAM!", "WHAM!", "BOOM!"][3 - hp], 1);
          C().sfx.noise(0.12, "lowpass", 1200, 200, 0.6); C().sfx.tone(110, 0.15, "square", 0.12);
          return hp <= 0;
        },
        win() { R.classList.add("ko"); window.Boss.setMood(R.firstChild, "dead"); this.api.word("K.O.!", "50%", true); [0, 0.25, 0.5].forEach((t) => C().sfx.tone(1200, 0.25, "triangle", 0.1, t)); },
      };
    },
    // Dance in sync: every right move fills the team's crowd meter; full = the crowd goes wild.
    "dance-off": () => {
      let n = 0, P = null;
      return {
        cls: "vx-disco vx-team", turns: true,
        field(api) {
          api.field.insertAdjacentHTML("afterbegin", '<div class="vx-ball">🪩</div><div class="vx-floor"></div><button class="vx-card"></button><div class="vx-meter team"><i></i></div>');
          P = duo(api.field, "min(22vw, 26vh, 140px)");
          P.forEach((p) => p.h.classList.add("groove"));
          this.api = api;
          return { card: api.field.querySelector(".vx-card") };
        },
        hit(i) {
          n++;
          const m = this.api.field.querySelector(".vx-meter i"); if (m) m.style.width = `${n * 25}%`;
          P.forEach((p) => { p.h.className = `vx-p ${p.h.classList.contains("r") ? "r" : "l"} move${n % 4}`; setTimeout(() => p.h.classList.add("groove"), 500); });
          this.api.word(["GROOVY!", "FUNKY!", "WOW!", "YEAH!"][n % 4], i);
          [523, 659, 784].forEach((f, k) => C().sfx.tone(f, 0.08, "square", 0.07, k * 0.06));
          return n >= 4;
        },
        win() { P.forEach((p) => window.Mascot.mood(p.f, "cheer")); this.api.word("👏 THE CROWD GOES WILD! 👏", "50%", true); C().sfx.noise(1.2, "bandpass", 2500, 1200, 0.25); },
      };
    },
    // Pass and shoot: 4 baskets together.
    "hoop-shot": () => {
      let n = 0, P = null;
      return {
        cls: "vx-court vx-team", turns: true, score: () => "",
        field(api) {
          api.field.insertAdjacentHTML("afterbegin", '<div class="vx-hoop"><div class="board"></div><div class="rim"></div><div class="net"></div></div><button class="vx-card"></button><div class="vx-hp r"></div>');
          P = duo(api.field, "min(18vw, 22vh, 110px)");
          this.api = api; this.draw = () => { api.field.querySelector(".vx-hp.r").textContent = "🏀".repeat(n) + "⚪".repeat(4 - n); }; this.draw();
          return { card: api.field.querySelector(".vx-card") };
        },
        hit(i) {
          n++; this.draw();
          bump(this.api.field.querySelector(".vx-hoop"), "swish", 400);
          this.api.word("SWISH!", i);
          C().sfx.noise(0.2, "bandpass", 3000, 2000, 0.3);
          window.Mascot.mood(P[i].f, "cheer"); setTimeout(() => window.Mascot.mood(P[i].f, null), 600);
          return n >= 4;
        },
        win() { P.forEach((p) => window.Mascot.mood(p.f, "cheer")); this.api.word("🏆 TEAM CHAMPS!", "50%", true); },
      };
    },
    // Take turns cutting: 3 right wires and it's defused. Out of time: BOOM.
    "wire-cut": () => {
      let n = 0;
      return {
        cls: "vw-field vx-team", turns: true,
        field(api) {
          api.field.insertAdjacentHTML("afterbegin", '<div class="vw-bomb"><div class="fuse"></div><div class="spark">✨</div><div class="eye l"><i></i></div><div class="eye r"><i></i></div><button class="vw-screen"></button></div>');
          this.api = api;
          return { card: api.field.querySelector(".vw-screen") };
        },
        hit(i) { n++; this.api.word("SNIP! ✂️", i); [660, 880].forEach((f, k) => C().sfx.tone(f, 0.07, "square", 0.07, k * 0.06)); return n >= 3; },
        win() { this.api.field.querySelector(".vw-bomb").classList.add("phew"); this.api.word("PHEW!", "50%", true); C().sfx.sweep(800, 300, 0.4, "sine", 0.08); },
        nobody() { this.api.field.querySelector(".vw-bomb").classList.add("gone"); C().sfx.noise(0.8, "lowpass", 1500, 100, 0.9); },
        tick(f) { const b = this.api && this.api.field.querySelector(".vw-bomb"); if (b) b.classList.toggle("hurry", f > 0.7); },
      };
    },
    // Take turns guessing what's under the puzzle.
    "puzzle-reveal": () => {
      let tiles = [], T = 0;
      return {
        cls: "vx-puzzle vx-team", turns: true, oneTarget: true, silent: true, limit: 14000,
        field(api) {
          api.field.insertAdjacentHTML("afterbegin", '<div class="vx-pz"><div class="hid"></div><div class="tiles"></div></div>');
          const t = api.field.querySelector(".tiles");
          tiles = C().shuffle([...Array(9)].map(() => { const d = el("div", "tile"); d.textContent = "?"; t.appendChild(d); return d; }));
          this.api = api;
          return { card: null };
        },
        show(step) { const h = root.querySelector(".vx-pz .hid"); if (h) h.textContent = step.listen ? step.target.text : step.cardText; },
        tick(f) { const n = Math.min(8, Math.floor(f / 0.85 * 9)); for (; T < n; T++) tiles[T].classList.add("off"); },
        hit(i) { tiles.forEach((t) => t.classList.add("off")); this.api.word("GOT IT!", i, true); return true; },
        nobody() { tiles.forEach((t) => t.classList.add("off")); },
      };
    },
  };

  // SPLIT THE ANSWERS: one puzzle on top, the cards split between the players ("is it yours or mine?").
  //   gap games: the word with a missing letter (Core.gapSteps), 3 words; the 4 letters are split 2 and 2,
  //     only one of them is right (so one of you has it!).
  //   train-builder: build the train in order; the cards are split between you; take the next one, whoever has it.
  function split(game, list, alive) {
    const items = F().prepItems(list);
    const isTrain = game.id === "train-builder";
    const sides = root.querySelector(".vs-sides");
    sides.classList.add("shared");
    const box = el("div", "vs-shared", `<div class="vx-field vx-split th-${game.id}"><div class="vx-deco"></div><div class="vx-pic"></div><div class="vx-word"></div>` +
      `<div class="vt-bar"><i></i></div><div class="vt-fx"></div></div><div class="vt-pads"><div class="vt-pad l" style="--pc:${COLORS[0]}"></div><div class="vt-pad r" style="--pc:${COLORS[1]}"></div></div>`);
    sides.appendChild(box);
    match.shared = box;
    const pic = box.querySelector(".vx-pic"), wordEl = box.querySelector(".vx-word"), bar = box.querySelector(".vt-bar i"), fx = box.querySelector(".vt-fx");
    const pads = [box.querySelector(".vt-pad.l"), box.querySelector(".vt-pad.r")];
    let over = false, cells = [], need = [], si = 0, steps = null, prompt = "";
    const say = (t) => { if (t) C().say(t); };
    pic.addEventListener("pointerdown", (e) => { e.preventDefault(); say(prompt); });
    function cardsFor(letters) {
      // Deal the cards out between the two players: as even as possible, mixed up.
      const all = C().shuffle(letters.map((l, k) => ({ l, k })));
      return [all.filter((_, n) => n % 2 === 0), all.filter((_, n) => n % 2 === 1)];
    }
    function drawPads(hands, onTap) {
      pads.forEach((pad, i) => {
        pad.innerHTML = `<div class="who">${TEXT.p(i + 1)}</div><div class="btns"></div>`;
        hands[i].forEach((c) => {
          const b = el("button", "vt-btn");
          b.textContent = c.l;
          b.addEventListener("pointerdown", (e) => { e.preventDefault(); onTap(i, b, c); });
          pad.lastChild.appendChild(b);
        });
      });
    }
    function drawWord(letters, gapAt) {
      wordEl.innerHTML = "";
      cells = letters.map((l, k) => { const c = el("div", "vx-cell" + (gapAt.includes(k) ? " gap" : "")); c.textContent = gapAt.includes(k) ? "" : l; wordEl.appendChild(c); return c; });
    }
    if (isTrain) {
      // The train: the engine shows where it starts; the carriages in order, split between you.
      const type = list.type;
      let letters, start;
      if (type === "cvc" || type === "hfw") {
        const it = items.find((x) => x.text.length >= 3 && x.text.length <= 5) || items[0];
        letters = it.text.split(""); start = it.emoji || "🚂"; prompt = it.say || it.text;
      } else {
        const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ", it = items.find((x) => /^[A-V]$/i.test(x.text)) || items[0];
        const k = Math.max(0, Math.min(21, A.indexOf(it.text.toUpperCase())));
        start = A[k]; letters = A.slice(k + 1, k + 5).split(""); prompt = A[k];
      }
      pic.textContent = start === "🚂" ? "🚂" : `🚂 ${start}`;
      drawWord(letters, letters.map((_, k) => k));
      need = letters.slice();
      let at = 0;
      drawPads(cardsFor(letters), (i, b, c) => {
        if (over || !alive()) return;
        if (c.k !== at) { b.animate([{ translate: "0 0" }, { translate: "-6px 0" }, { translate: "6px 0" }, { translate: "0 0" }], { duration: 250 }); C().sfx.tone(200, 0.08, "square", 0.06); return; }
        b.style.visibility = "hidden";
        cells[at].classList.remove("gap"); cells[at].textContent = c.l;
        C().sfx.tone(300 + at * 120, 0.08, "square", 0.08); // clunk
        at++;
        if (at >= need.length) done(true);
      });
      say(prompt);
    } else {
      // The gap games: 3 words, each with a letter missing; 2 cards each, only one right.
      steps = C().gapSteps(items, list.type, 3, 4, { lowercase: true, slow: true });
      const next = () => {
        const st = steps[si];
        prompt = st.prompt;
        pic.textContent = st.pic || (st.kind === "letter" ? "🔤" : "🔊") /* (🔤: alphabet order) */;
        drawWord(st.cells, [st.gap]);
        drawPads(cardsFor(st.options), (i, b, c) => {
          if (over || !alive()) return;
          if (c.l !== st.answer) { b.classList.add("bad"); C().sfx.sweep(500, 160, 0.25, "sawtooth", 0.07); word("NOPE!", i); return; }
          cells[st.gap].classList.remove("gap"); cells[st.gap].textContent = st.answer;
          word("YES!", i); C().sfx.tone(880, 0.1, "triangle", 0.1); say(st.say);
          si++;
          if (si >= steps.length) { done(true); return; }
          pads.forEach((p) => p.classList.add("wait"));
          later(() => { pads.forEach((p) => p.classList.remove("wait")); if (!over) next(); }, 900);
        });
        say(prompt);
      };
      next();
    }
    function word(text, i) {
      const w = el("div", "vt-word");
      w.textContent = text;
      w.style.left = i === 0 ? "26%" : i === 1 ? "74%" : "50%"; // (2: the middle)
      fx.appendChild(w);
      later(() => w.remove(), 900);
    }
    function done(ok) {
      if (over) return;
      over = true;
      cancelAnimationFrame(match.sharedRaf);
      if (ok) {
        // Each game's own finish (the teacher: the co-op scenes should look like the games).
        const fin = {
          "train-builder": () => { wordEl.animate([{ transform: "none" }, { transform: "translateX(120%)" }], { duration: 900, easing: "ease-in", fill: "forwards" }); C().sfx.tone(392, 0.2, "square", 0.08); C().sfx.tone(392, 0.25, "square", 0.08, 0.3); },
          "rocket-fix": () => { wordEl.classList.add("go"); wordEl.animate([{ transform: "none" }, { transform: "translateY(20px)", offset: 0.15 }, { transform: "translateY(-160%)" }], { duration: 1000, easing: "cubic-bezier(.6,0,.9,.4)", fill: "forwards" }); C().sfx.noise(1.2, "lowpass", 800, 150, 0.6); C().sfx.sweep(200, 1200, 1.1, "sawtooth", 0.07); word("BLAST OFF!", 2); },
          "burger-stack": () => { wordEl.animate([{ transform: "none" }, { transform: "scale(.1)", opacity: 0 }], { duration: 700, delay: 300, easing: "ease-in", fill: "forwards" }); [0, 0.15, 0.3].forEach((t) => C().sfx.noise(0.06, "bandpass", 900, 600, 0.45, t)); word("CHOMP! BURP!", 2); },
          "cookie-cutter": () => { wordEl.parentElement.querySelector(".vx-deco").animate([{ transform: "translate(-50%, -50%)" }, { transform: "translate(-50%, -50%) scale(.1)", opacity: 0 }], { duration: 900, delay: 300, fill: "forwards" }); wordEl.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 600, delay: 400, fill: "forwards" }); word("YUM!", 2); },
          "robot-repair": () => { wordEl.parentElement.querySelector(".vx-deco").classList.add("dance"); [523, 659, 784, 1047].forEach((f, n) => C().sfx.tone(f, 0.09, "square", 0.07, n * 0.07)); word("BEEP BOOP!", 2); },
          "bridge-builder": () => { word("MADE IT!", 2); },
        }[game.id];
        if (fin) fin();
        C().confetti(fx, fx.clientWidth / 2, fx.clientHeight * 0.4, { count: 80 });
      }
      later(() => teamRound(ok), 1200);
    }
    const T0 = performance.now() + 500, LIMIT = (game.duration || 12000) * 1.4;
    (function tick() {
      if (!alive() || over) return;
      const f = Math.max(0, 1 - (performance.now() - T0) / LIMIT);
      bar.style.transform = `scaleX(${f.toFixed(3)})`;
      if (f <= 0) { done(false); return; }
      match.sharedRaf = requestAnimationFrame(tick);
    })();
  }

  // ---------- Shared-screen versus games (the teacher's idea) ----------
  // TUG OF WAR: one rope across the top of the screen, player 1's character on the left and player 2's on the
  // right, the card in the middle; each player has their own answer buttons in their half below. Both get the
  // same target: the first to tap the right one HEAVES the rope their way, then a new target for both. A wrong
  // tap makes that player dizzy for a moment (their buttons lock). Three heaves ahead and the other character
  // is dragged face-first into the mud: the point. Out of time: whoever's ahead takes it.
  const SHARED = {
    "tug-of-war": (game, list, alive) => {
      const items = F().prepItems(list);
      const N = 3, GOALP = 3, DIZZY = 1200;
      const steps = C().choiceSteps(items, list.type, 12, N, { lowercase: true, canSpeak: F().canSpeak() });
      let si = 0, step = steps[0], p = 0, over = false;             // p: -GOALP (player 1 wins) … +GOALP (player 2 wins)
      const sides = root.querySelector(".vs-sides");
      sides.classList.add("shared");
      const box = el("div", "vs-shared", `<div class="vt-field"><div class="vt-mud"></div><div class="vt-group"><div class="vt-rope"></div><div class="vt-flag"></div>` +
        `<div class="vt-me l"></div><div class="vt-me r"></div></div><button class="vt-card"></button><div class="vt-bar"><i></i></div><div class="vt-fx"></div></div>` +
        `<div class="vt-pads"><div class="vt-pad l" style="--pc:${COLORS[0]}"></div><div class="vt-pad r" style="--pc:${COLORS[1]}"></div></div>`);
      sides.appendChild(box);
      match.shared = box;
      const card = box.querySelector(".vt-card"), group = box.querySelector(".vt-group"), bar = box.querySelector(".vt-bar i"), fx = box.querySelector(".vt-fx");
      const pads = [box.querySelector(".vt-pad.l"), box.querySelector(".vt-pad.r")];
      const mes = [box.querySelector(".vt-me.l"), box.querySelector(".vt-me.r")].map((m, i) => {
        const f = window.Mascot.el("var(--tz)", players[i].char);
        window.Mascot.mood(f, "pull");
        m.appendChild(f);
        return f;
      });
      card.addEventListener("pointerdown", (e) => { e.preventDefault(); if (!over) C().say(step.prompt); });
      const dizzy = [0, 0];
      function deal() {
        card.textContent = step.listen ? step.target.text : step.cardText;
        card.classList.remove("next"); void card.offsetWidth; card.classList.add("next");
        pads.forEach((pad, i) => {
          pad.innerHTML = `<div class="who">${TEXT.p(i + 1)}</div><div class="btns"></div>`;
          C().shuffle(step.row.slice()).forEach((o) => {
            const b = el("button", "vt-btn");
            b.textContent = o.text;
            if (o.kind === "word") b.style.fontSize = `${Math.min(30, 120 / (o.text.length * 0.6))}px`;
            b.addEventListener("pointerdown", (e) => { e.preventDefault(); tap(i, b, o); });
            pad.lastChild.appendChild(b);
          });
        });
        C().say(step.prompt);
      }
      function setP() { group.style.transform = `translateX(${(p / GOALP) * 22}%)`; } // (−: towards player 1)
      function tap(i, b, o) {
        if (over || !alive() || performance.now() < dizzy[i]) return;
        if (!o.right) {
          b.classList.add("bad");
          dizzy[i] = performance.now() + DIZZY;
          pads[i].classList.add("dizzy");
          C().sfx.sweep(500, 160, 0.3, "sawtooth", 0.08);
          later(() => pads[i] && pads[i].classList.remove("dizzy"), DIZZY);
          return;
        }
        // HEAVE! towards player i.
        p += i === 0 ? -1 : 1;
        setP();
        mes[i].classList.add("heave"); later(() => mes[i].classList.remove("heave"), 300);
        [0, 0.08].forEach((d) => C().sfx.noise(0.1, "lowpass", 900, 300, 0.4, d)); C().sfx.sweep(200, 420, 0.2, "square", 0.07);
        word(TEXT.heave, i);
        if (o.kind === "pic") C().say(o.spoken);
        if (Math.abs(p) >= GOALP) { finish(i); return; }
        si++; step = steps[si % steps.length];
        pads.forEach((pad) => pad.classList.add("wait"));
        later(() => { if (!over) { pads.forEach((pad) => pad.classList.remove("wait")); deal(); } }, 500);
      }
      function word(text, i) {
        const w = el("div", "vt-word");
        w.textContent = text;
        w.style.left = i === 0 ? "28%" : "72%";
        fx.appendChild(w);
        later(() => w.remove(), 900);
      }
      // The winner pulls the other face-first into the mud.
      function finish(winner) {
        if (over) return;
        over = true;
        cancelAnimationFrame(match.sharedRaf);
        const loser = 1 - winner;
        // (the character itself, not its holder: player 2's holder is mirrored)
        mes[loser].animate([{ transform: "none" }, { transform: "translateX(60%) rotate(75deg)" }], { duration: 420, easing: "cubic-bezier(.5,0,.9,.5)", fill: "forwards" });
        later(() => {
          C().sfx.noise(0.5, "lowpass", 1200, 150, 0.7); C().sfx.sweep(500, 120, 0.4, "sine", 0.12); // SPLOSH
          mes[loser].classList.add("muddy"); window.Mascot.mood(mes[loser], "sad");
          window.Mascot.mood(mes[winner], "cheer");
          const w = el("div", "vt-word big"); w.textContent = TEXT.splash; fx.appendChild(w);
          C().confetti(fx, winner ? fx.clientWidth * 0.75 : fx.clientWidth * 0.25, fx.clientHeight * 0.3, { count: 80 });
          match.result = winner;
          later(() => scorePoint(winner), 900);
        }, 420);
      }
      // The clock (one for both). Out of time: whoever's ahead wins; level: nobody.
      const T0 = performance.now() + 500, LIMIT = (game.duration || 12000) * 1.25;
      (function tick() {
        if (!alive() || over) return;
        const f = Math.max(0, 1 - (performance.now() - T0) / LIMIT);
        bar.style.transform = `scaleX(${f.toFixed(3)})`;
        if (f <= 0) {
          if (p) finish(p < 0 ? 0 : 1);
          else { over = true; match.result = -1; banner(TEXT.nobody); later(nextRound, 1500); }
          return;
        }
        match.sharedRaf = requestAnimationFrame(tick);
      })();
      setP();
      deal();
    },
    // WIRE CUT: one bomb in the middle of the top half, its screen showing the target, wires running down to each
    // player's half; each has their own plugs. First to cut the right wire gets a ✂️ and the screen flips to a new
    // target; a wrong cut zaps that player (dizzy). First to 3 defuses it (PHEW!) and it blows up on the other
    // side (BOOM, sooty): the point. Out of time: more cuts wins; level, it blows up on both.
    "wire-cut": (game, list, alive) => {
      const items = F().prepItems(list);
      const N = 3, GOALP = 3, DIZZY = 1200;
      const WIRES = ["#ff3b3b", "#2f8fe0", "#ffd400", "#4dd36b"];
      const steps = C().choiceSteps(items, list.type, 12, N, { lowercase: true, canSpeak: F().canSpeak() });
      let si = 0, step = steps[0], over = false;
      const cuts = [0, 0];
      const sides = root.querySelector(".vs-sides");
      sides.classList.add("shared");
      const box = el("div", "vs-shared", `<div class="vw-field"><svg class="vw-wires" viewBox="0 0 100 100" preserveAspectRatio="none"></svg>` +
        `<div class="vw-bomb"><div class="fuse"></div><div class="spark">✨</div><div class="eye l"><i></i></div><div class="eye r"><i></i></div><button class="vw-screen"></button></div>` +
        `<div class="vt-bar"><i></i></div><div class="vt-fx"></div></div>` +
        `<div class="vt-pads"><div class="vt-pad l" style="--pc:${COLORS[0]}"></div><div class="vt-pad r" style="--pc:${COLORS[1]}"></div></div>`);
      sides.appendChild(box);
      match.shared = box;
      const screen = box.querySelector(".vw-screen"), bomb = box.querySelector(".vw-bomb"), svg = box.querySelector(".vw-wires"), bar = box.querySelector(".vt-bar i"), fx = box.querySelector(".vt-fx");
      const pads = [box.querySelector(".vt-pad.l"), box.querySelector(".vt-pad.r")];
      screen.addEventListener("pointerdown", (e) => { e.preventDefault(); if (!over) C().say(step.prompt); });
      // Decorative wires from the bomb down to each player's half.
      svg.innerHTML = [0, 1].map((side) => WIRES.slice(0, N).map((c, k) => {
        const x0 = 50 + (side ? 4 : -4), x1 = side ? 60 + k * 12 : 40 - k * 12;
        return `<path d="M${x0} 55 C${x0} 80, ${x1} 70, ${x1} 100" fill="none" stroke="#111" stroke-width="2.6" vector-effect="non-scaling-stroke"/>` +
          `<path d="M${x0} 55 C${x0} 80, ${x1} 70, ${x1} 100" fill="none" stroke="${c}" stroke-width="1.6" vector-effect="non-scaling-stroke"/>`;
      }).join("")).join("");
      const dizzy = [0, 0];
      function deal() {
        screen.textContent = step.listen ? step.target.text : step.cardText;
        screen.classList.remove("next"); void screen.offsetWidth; screen.classList.add("next");
        pads.forEach((pad, i) => {
          pad.innerHTML = `<div class="who">${TEXT.p(i + 1)} ${"✂️".repeat(cuts[i])}${"⚪".repeat(GOALP - cuts[i])}</div><div class="btns"></div>`;
          C().shuffle(step.row.slice()).forEach((o, k) => {
            const b = el("button", "vt-btn vw-plug");
            b.style.setProperty("--wc", WIRES[k % WIRES.length]);
            b.textContent = o.text;
            if (o.kind === "word") b.style.fontSize = `${Math.min(30, 120 / (o.text.length * 0.6))}px`;
            b.addEventListener("pointerdown", (e) => { e.preventDefault(); cut(i, b, o); });
            pad.lastChild.appendChild(b);
          });
        });
        C().say(step.prompt);
      }
      function cut(i, b, o) {
        if (over || !alive() || performance.now() < dizzy[i]) return;
        b.classList.add("snipped");
        C().sfx.noise(0.06, "highpass", 3000, 5000, 0.4); // snip
        if (!o.right) {
          b.classList.add("bad");
          dizzy[i] = performance.now() + DIZZY;
          pads[i].classList.add("dizzy");
          C().sfx.sweep(900, 200, 0.3, "sawtooth", 0.08); // ZAP
          word("⚡ ZAP!", i);
          later(() => pads[i] && pads[i].classList.remove("dizzy"), DIZZY);
          return;
        }
        cuts[i]++;
        word("SNIP! ✂️", i);
        [660, 880].forEach((f, k) => C().sfx.tone(f, 0.07, "square", 0.07, k * 0.06));
        if (o.kind === "pic") C().say(o.spoken);
        if (cuts[i] >= GOALP) { finish(i); return; }
        si++; step = steps[si % steps.length];
        pads.forEach((pad) => pad.classList.add("wait"));
        later(() => { if (!over) { pads.forEach((pad) => pad.classList.remove("wait")); deal(); } }, 500);
      }
      function word(text, i) {
        const w = el("div", "vt-word");
        w.textContent = text;
        w.style.left = i === 0 ? "24%" : "76%";
        fx.appendChild(w);
        later(() => w.remove(), 900);
      }
      // Defused by the winner… and it blows up on the other side.
      function finish(winner) {
        if (over) return;
        over = true;
        cancelAnimationFrame(match.sharedRaf);
        bomb.classList.add("phew");
        const w = el("div", "vt-word big"); w.textContent = "PHEW!"; w.style.left = winner ? "76%" : "24%"; fx.appendChild(w);
        C().sfx.sweep(800, 300, 0.4, "sine", 0.08);
        later(() => boom([1 - winner], winner), 700);
      }
      function boom(losers, winner) {
        bomb.classList.add("gone");
        C().sfx.noise(0.8, "lowpass", 1500, 100, 0.9); C().sfx.tone(60, 0.5, "square", 0.18); // BOOM
        losers.forEach((i) => {
          pads[i].classList.add("sooty");
          const b = el("div", "vt-word big"); b.textContent = "💥 BOOM!"; b.style.left = i ? "76%" : "24%"; b.style.top = "70%"; fx.appendChild(b);
        });
        box.animate([{ transform: "none" }, { transform: "translate(-8px,4px)" }, { transform: "translate(8px,-4px)" }, { transform: "none" }], { duration: 200, iterations: 3 });
        if (winner != null) {
          C().confetti(fx, winner ? fx.clientWidth * 0.75 : fx.clientWidth * 0.25, fx.clientHeight * 0.4, { count: 70 });
          match.result = winner;
          later(() => scorePoint(winner), 1000);
        } else { match.result = -1; later(() => { banner(TEXT.nobody); later(nextRound, 1500); }, 800); }
      }
      // The clock: out of time, more cuts wins; level, it blows up on both.
      const T0 = performance.now() + 500, LIMIT = (game.duration || 12000) * 1.25;
      (function tick() {
        if (!alive() || over) return;
        const f = Math.max(0, 1 - (performance.now() - T0) / LIMIT);
        bar.style.transform = `scaleX(${f.toFixed(3)})`;
        bomb.classList.toggle("hurry", f < 0.3);
        if (f <= 0) {
          if (cuts[0] !== cuts[1]) finish(cuts[0] > cuts[1] ? 0 : 1);
          else { over = true; boom([0, 1], null); }
          return;
        }
        match.sharedRaf = requestAnimationFrame(tick);
      })();
      deal();
    },
  };

  function endRound(all) {
    if (!match) return;
    cancelAnimationFrame(match.raf);
    cancelAnimationFrame(match.sharedRaf);
    if (match.shared) { match.shared.remove(); match.shared = null; }
    const sidesEl = root && root.querySelector(".vs-sides");
    if (sidesEl) sidesEl.classList.remove("shared");
    (match.sides || []).forEach((side) => {
      side.timers.forEach(clearTimeout); side.rafs.forEach(cancelAnimationFrame);
      try { if (side.cleanup) side.cleanup(); } catch (err) { console.error("versus cleanup:", err); }
      side.S.game.innerHTML = "";
      side.S.box.querySelectorAll(".vs-cover").forEach((x) => x.remove());
    });
    match.sides = null;
    match.token++;
    C().focus = null;
    if (all) { match.timers.forEach(clearTimeout); match.timers = []; }
  }

  // PLAYER n WINS! The winner cheers with a crown, the other is sad; a victory cheer and confetti.
  function champion(i) {
    endRound(true);
    match.over = true;
    const r = shell();
    if (window.Music) Music.play("menu");
    const box = el("div", "vs-setup");
    const h = el("h1", "shout"); h.textContent = TEXT.wins(i + 1); h.style.color = COLORS[i];
    const champ = el("div", "vs-champ");
    [i, 1 - i].forEach((k) => {
      const col = el("div");
      const m = window.Mascot.el(k === i ? 150 : 90, players[k].char);
      window.Mascot.mood(m, k === i ? "cheer" : "sad");
      if (k === i) col.appendChild(el("div", "vs-crown", "👑"));
      col.appendChild(m);
      champ.appendChild(col);
    });
    const sc = el("div", "vs-score", `<span class="n">${match.score[0]}</span><span class="vs shout">VS</span><span class="n">${match.score[1]}</span>`);
    const btns = el("div", "vs-end-buttons");
    const again = el("button", "chunky hot"); again.textContent = TEXT.again;
    again.addEventListener("click", () => { C().unlock(); startMatch(); });
    const menu = el("button", "chunky"); menu.textContent = TEXT.menu;
    menu.addEventListener("click", close);
    btns.append(again, menu);
    box.append(h, champ, sc, btns);
    r.appendChild(box);
    [392, 523, 659, 784, 1047].forEach((f, k) => C().sfx.tone(f, 0.14, "square", 0.07, k * 0.1));
    setTimeout(() => C().confetti(r, r.clientWidth / 2, r.clientHeight * 0.35, { count: 140 }), 200);
    C().say(TEXT.say.win(i + 1));
  }

  window.Versus = { open, close, SKIP: VERSUS_SKIP, openCoop: () => open("coop") };
})();
