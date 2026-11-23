// BOSS BATTLE: the three bosses (drawn in CSS, big and silly), what each one fights with, and the
// cut-scenes the frame plays between rounds (the boss appearing, the showdown score, the boss being
// hit or laughing, the final defeat or gloat). The round loop itself lives in js/frame.js.
//
// A run: 10 normal levels → 💥 a random boss appears → SHOWDOWN: best of 3 rounds of a game the boss
// plays too, inside the game (its own boat, pads, hoop…: beat the game before time runs out and it gets there) → win 2 and it's
// the FINAL BATTLE: the boss has 3 HP and you have 3 hearts; each stage is a different battle game
// (faster each time), a stage won knocks off an HP, a stage lost costs a heart and is replayed.
(function () {
  const TEXT = {
    warning: "WARNING!",
    appears: "A BOSS APPEARS!",
    showdown: (n) => `SHOWDOWN ${n}`,
    finalBattle: "FINAL BATTLE!",
    stage: (n) => `STAGE ${n}!`,
    you: "YOU",
    haha: "HA HA HA!",
    ouch: ["OUCH!", "OOF!", "ARGH!"],
    bossWins: "BOSS WINS!",
    grr: "GRRR!",
    miss: ["OOPS!", "NOO!", "MISSED!", "ARGH!"],   // the boss's tries in a showdown game
    done: "I WIN!",                                // …and when it gets there first
  };

  // Battle stages: each a list of games to choose from (the first one that can use the content in play).
  const BOSSES = {
    banana: {
      id: "banana", icon: "🍌", name: "BANANA BOSS", color: "#ffd000", dark: "#a87b00",
      intro: "I am Banana Boss! You can't slice me!",
      taunt: "Ha ha ha! Too slow!",
      angry: "Grr! Lucky shot!",
      battleLine: "Slice me if you can!",
      defeatLine: "Nooo! I'm a banana split!",
      defeatWord: "SLICED!",
      hitWord: "SLICE!",
      // Fight the boss itself: slice banana clones, throw shurikens at flying bananas, and the finale, Shield
      // Breaker: smash its banana shields and slice it in two (the teacher's design).
      stages: [["samurai-slice", "shuriken-toss"], ["shuriken-toss", "whack-a-mole", "samurai-slice"], ["shield-breaker", "whack-a-mole"]],
    },
    baby: {
      id: "baby", icon: "👶", name: "BABY BOSS", color: "#ff9ccf", dark: "#b0457e",
      intro: "Waaah! I am Baby Boss! I want my milk!",
      taunt: "Waaah ha ha!",
      angry: "Waaah! Not fair!",
      battleLine: "Find my milk! Waaah!",
      defeatLine: "Yawn... night night.",
      defeatWord: "SHHH... ZZZ",
      hitWord: "GULP!",
      // Hungry → hungrier → sleepy (the teacher's story): ghosts have stolen its milk (Ghost Hunt), then it
      // wants its baby food (Feed Me: spoons into its mouth), then Rock-a-Bye (Bongo Bash in a nursery: rock it
      // to sleep). It's never hurt: each game draws the baby itself (bossArt).
      instruction: ["FIND THE\nMILK! 🍼", "FEED THE\nBABY! 🥄", "ROCK-A-\nBYE! 🌙"], // one per stage
      stages: [["ghost-hunt", "window-wiper"], ["feed-me", "egg-shuffle"], ["bongo-bash"]],
    },
    robot: {
      id: "robot", icon: "🤖", name: "ROBOT BOSS", color: "#7fd3ff", dark: "#2d6f99",
      intro: "Beep boop! I am Robot Boss! Dance battle!",
      taunt: "Beep beep! Ha ha ha!",
      angry: "Error! Error!",
      battleLine: "Dance battle! Beep boop!",
      defeatLine: "Beep... boop... you win!",
      defeatWord: "KA-BOOM!",
      hitWord: "BZZT!",
      instruction: ["DANCE\nBATTLE!", null, null], // one per stage (Boxing and the wires keep their own)
      // A dance battle, then box the robot (Boxing is a listening game: Dance Off again if those are off), then
      // the finale: cut the wires plugged into it until it blows up (Wire Cut's robot version; the teacher's design).
      stages: [["dance-off"], ["monster-boxing", "dance-off"], ["wire-cut", "dance-off"]],
    },
  };
  const IDS = Object.keys(BOSSES);
  // Games the boss plays alongside you in the showdown, drawn into the game itself (each has `bossRival`:
  // see rival() below). It never really scores: it only gets there first if you run out of time.
  const SHOWDOWN = ["fishing", "froggy-hop", "monkey-swing", "archery", "hoop-shot", "track-switch", "bunny-burrow",
    "snowman", "pizza-chef", "whack-a-mole", "monster-golf", "shuriken-toss", "pachinko", "dance-off", "treasure-dig"];
  const SPEED = { showdown: 1.25, stages: [1.5, 1.75, 2] };
  const HP = 3, HEARTS = 3, LEVELS = 10;

  const CSS = `
  /* ---------- A boss (size --bs) ---------- */
  .bx-boss { --bw:max(2px, calc(var(--bs) * .028)); position:relative; width:var(--bs); height:var(--bs); flex:none; }
  .bx-boss * { box-sizing:border-box; }
  .bx-in { position:absolute; inset:0; animation:bx-bob 1.1s ease-in-out infinite alternate; transform-origin:50% 100%; }
  .bx-boss.laugh .bx-in { animation:bx-laugh .2s ease-in-out infinite alternate; }
  .bx-boss.hurt .bx-in { animation:bx-hurt .09s linear 8; filter:brightness(1.8) saturate(.4); }
  .bx-boss.angry .bx-in { animation:bx-angry .07s linear infinite; filter:hue-rotate(-25deg) saturate(1.6); }
  .bx-boss.mini .bx-in { animation:none; }
  .bx-seat { position:absolute; right:4px; top:4px; z-index:15; display:flex; flex-direction:column; align-items:center; gap:3px; padding:4px 6px 6px;
    background:rgba(255,255,255,.88); border:4px solid #111; border-radius:16px; box-shadow:0 4px 0 #111; pointer-events:none; }
  .bx-race { display:flex; gap:3px; }
  .bx-race span { width:15px; height:12px; border:3px solid #111; border-radius:4px; background:#e6e6e6; transition:background .2s; }
  .bx-race span.on { background:#ff4d6d; }
  .bx-want { font-size:15px; line-height:1; }
  .bx-carrier { position:absolute; left:50%; top:0; transform:translate(-50%, -58%); z-index:-1; pointer-events:none; }
  .bx-boss.dead .bx-in { animation:none; }
  .bx-rival { pointer-events:none; }
  .bx-bub { position:absolute; left:50%; bottom:96%; transform:translateX(-50%); z-index:40; white-space:nowrap; pointer-events:none;
    font-size:max(12px, calc(var(--bs) * .2)); line-height:1; padding:.25em .45em; color:#111; background:#fff; border:3px solid #111;
    border-radius:.6em; box-shadow:0 3px 0 #111; animation:bx-bub .25s cubic-bezier(.2,1.8,.4,1) both; }
  @keyframes bx-bub { from { transform:translateX(-50%) scale(0); } to { transform:translateX(-50%) scale(1); } }
  .bx-eye { position:absolute; width:22%; height:22%; border-radius:50%; background:#fff; border:var(--bw) solid #111; overflow:hidden; z-index:3; }
  .bx-eye i { position:absolute; left:30%; top:30%; width:46%; height:46%; border-radius:50%; background:#111; animation:bx-roll 1.6s ease-in-out infinite alternate; }
  .bx-eye.big { width:27%; height:27%; }
  .bx-eye.big i { animation-duration:1.1s; animation-direction:alternate-reverse; }
  .bx-brow { position:absolute; width:22%; height:6%; background:#111; border-radius:99px; z-index:4; }
  .bx-mouth { position:absolute; left:50%; width:44%; height:20%; transform:translateX(-50%); background:#5a0f1e; border:var(--bw) solid #111;
    border-radius:10% 10% 50% 50% / 14% 14% 86% 86%; overflow:hidden; z-index:3; }
  .bx-mouth::before { content:""; position:absolute; left:6%; right:6%; top:0; height:30%; background:repeating-linear-gradient(90deg, #fff 0 22%, #ddd 22% 25%); }
  .bx-mouth::after { content:""; position:absolute; left:28%; width:44%; bottom:-14%; height:48%; border-radius:50%; background:#ff6f91; }
  .bx-boss.laugh .bx-mouth { height:28%; }
  .bx-word { position:absolute; left:50%; top:50%; transform:translate(-50%, -50%); font-size:2.6rem; color:#fff; -webkit-text-stroke:2px #111;
    text-shadow:0 5px 0 #111; white-space:nowrap; pointer-events:none; z-index:30; animation:bx-word .9s ease-out forwards; }
  .bx-word.bad { color:#ff4d6d; }
  .bx-word.big { font-size:3.4rem; animation-duration:2.4s; }

  /* Banana Boss: a curvy banana with a crown, angry brows and flexing arms */
  .bx-banana .bx-body { position:absolute; left:24%; top:10%; width:52%; height:84%; transform:rotate(14deg); border:var(--bw) solid #111;
    background:linear-gradient(90deg, #ffe866, #ffd000 55%, #e3a800); border-radius:50% 50% 46% 46% / 62% 62% 38% 38%; box-shadow:inset calc(var(--bs) * -.06) 0 0 rgba(0,0,0,.08); }
  .bx-banana .bx-body::before { content:""; position:absolute; left:40%; top:-9%; width:18%; height:12%; background:#6b4a1f; border:var(--bw) solid #111; border-radius:30% 30% 10% 10%; }
  .bx-banana .bx-body::after { content:""; position:absolute; left:40%; bottom:-4%; width:20%; height:6%; background:#4a2f10; border-radius:50%; }
  .bx-banana .bx-eye.l { left:30%; top:30%; } .bx-banana .bx-eye.r { left:52%; top:27%; }
  .bx-banana .bx-brow.l { left:28%; top:23%; transform:rotate(22deg); } .bx-banana .bx-brow.r { left:54%; top:20%; transform:rotate(-14deg); }
  .bx-banana .bx-mouth { left:52%; top:54%; transform:translateX(-50%) rotate(10deg); }
  .bx-banana .bx-crown { position:absolute; left:46%; top:-6%; font-size:calc(var(--bs) * .26); line-height:1; transform:rotate(16deg); z-index:5; }
  .bx-banana .bx-arm { position:absolute; top:46%; width:22%; height:9%; background:#ffd000; border:var(--bw) solid #111; border-radius:99px; z-index:2; }
  .bx-banana .bx-arm::after { content:""; position:absolute; top:-60%; width:52%; height:210%; border-radius:50%; background:#fff; border:var(--bw) solid #111; }
  .bx-banana .bx-arm.l { left:8%; transform:rotate(-35deg); } .bx-banana .bx-arm.l::after { left:-30%; }
  .bx-banana .bx-arm.r { right:6%; transform:rotate(30deg); } .bx-banana .bx-arm.r::after { right:-30%; }

  /* Baby Boss: a giant crying baby with one curl, a bib and streaming tears */
  .bx-baby .bx-body { position:absolute; left:28%; top:66%; width:44%; height:32%; background:#8fd3ff; border:var(--bw) solid #111; border-radius:40% 40% 30% 30%; }
  .bx-baby .bx-body::after { content:""; position:absolute; left:20%; top:-6%; width:60%; height:52%; background:#fff; border:var(--bw) solid #111; border-radius:10% 10% 50% 50%; }
  .bx-baby .bx-head { position:absolute; left:10%; top:2%; width:80%; height:70%; background:#ffd6b8; border:var(--bw) solid #111; border-radius:50%; z-index:2; }
  .bx-baby .bx-head::before { content:""; position:absolute; left:42%; top:-10%; width:18%; height:18%; border:var(--bw) solid #111; border-color:#111 #111 transparent transparent; border-radius:50%; transform:rotate(-30deg); }
  .bx-baby .bx-ear { position:absolute; top:28%; width:14%; height:18%; background:#ffd6b8; border:var(--bw) solid #111; border-radius:50%; z-index:1; }
  .bx-baby .bx-ear.l { left:4%; } .bx-baby .bx-ear.r { right:4%; }
  .bx-baby .bx-eye.l { left:24%; top:22%; } .bx-baby .bx-eye.r { left:52%; top:20%; }
  .bx-baby .bx-mouth { left:50%; top:46%; width:30%; height:22%; border-radius:50%; animation:bx-wail .3s ease-in-out infinite alternate; }
  .bx-baby .bx-mouth::before { display:none; }
  .bx-baby .bx-cheek { position:absolute; top:42%; width:13%; height:9%; border-radius:50%; background:#ff9ab1; z-index:3; }
  .bx-baby .bx-cheek.l { left:16%; } .bx-baby .bx-cheek.r { right:16%; }
  .bx-baby .bx-tear { position:absolute; top:38%; width:6%; height:0; background:#5ec8ff; border-radius:0 0 99px 99px; z-index:4; animation:bx-tear .5s linear infinite; }
  .bx-baby .bx-tear.l { left:26%; } .bx-baby .bx-tear.r { left:68%; animation-delay:.25s; }
  /* Happy (fed): no tears, a big smile, a little bounce. Sleepy (being rocked): heavy eyelids, a yawn, no tears. */
  .bx-baby.happy .bx-tear, .bx-baby.sleepy .bx-tear { display:none; }
  .bx-baby.happy .bx-mouth { animation:none; width:34%; height:16%; top:48%; border-radius:4px 4px 99px 99px; }
  .bx-baby.happy .bx-in { animation:bx-laugh .3s ease-in-out infinite alternate; }
  .bx-baby.sleepy .bx-eye { height:13%; top:26%; border-radius:0 0 99px 99px; }
  .bx-baby.sleepy .bx-eye i { top:0; }
  .bx-baby.sleepy .bx-mouth { animation:none; width:16%; height:14%; border-radius:50%; }
  .bx-baby.sleepier .bx-eye { height:7%; top:30%; }
  .bx-baby.sleepier .bx-in { animation:bx-sleep 2.4s ease-in-out infinite alternate; }
  .bx-baby.calm .bx-tear { display:none; }
  .bx-baby.calm .bx-mouth { width:16%; height:8%; border-radius:0 0 99px 99px; animation:none; background:#111; }
  .bx-baby.calm .bx-eye { height:4%; top:30%; border-radius:99px; background:#111; }
  .bx-baby.calm .bx-eye i { display:none; }
  .bx-baby.calm .bx-in { animation:bx-sleep 2.4s ease-in-out infinite alternate; }

  /* Robot Boss: a tin robot with an antenna, googly eyes in yellow sockets and a grille grin */
  .bx-robot .bx-body { position:absolute; left:26%; top:62%; width:48%; height:34%; background:linear-gradient(90deg, #b8c4cf, #8a98a6); border:var(--bw) solid #111; border-radius:12%; }
  .bx-robot .bx-body::after { content:""; position:absolute; left:20%; top:22%; width:60%; height:30%; border-radius:8px; border:var(--bw) solid #111;
    background:radial-gradient(circle at 20% 50%, #ff4d6d 14%, transparent 16%), radial-gradient(circle at 50% 50%, #ffd400 14%, transparent 16%), radial-gradient(circle at 80% 50%, #4dd36b 14%, transparent 16%), #333;
    animation:bx-blink .5s steps(2) infinite; }
  .bx-robot .bx-head { position:absolute; left:14%; top:12%; width:72%; height:52%; z-index:2; border:var(--bw) solid #111; border-radius:16%;
    background:radial-gradient(circle at 8% 12%, #555 3%, transparent 4%), radial-gradient(circle at 92% 12%, #555 3%, transparent 4%), radial-gradient(circle at 8% 88%, #555 3%, transparent 4%), radial-gradient(circle at 92% 88%, #555 3%, transparent 4%), linear-gradient(180deg, #e2e9ef, #9eacb8); }
  .bx-robot .bx-head::before { content:""; position:absolute; left:47%; top:-26%; width:6%; height:26%; background:#555; border:var(--bw) solid #111; border-bottom:0; }
  .bx-robot .bx-head::after { content:""; position:absolute; left:39%; top:-44%; width:22%; height:22%; border-radius:50%; background:#ff4d6d; border:var(--bw) solid #111; animation:bx-blink .7s steps(2) infinite; }
  .bx-robot .bx-eye { border-color:#ffd400; outline:var(--bw) solid #111; }
  .bx-robot .bx-eye.l { left:26%; top:24%; } .bx-robot .bx-eye.r { left:52%; top:22%; }
  .bx-robot .bx-mouth { top:46%; width:46%; height:14%; border-radius:6px 6px 40% 40%; background:repeating-linear-gradient(90deg, #fff 0 14%, #111 14% 18%); }
  .bx-robot .bx-mouth::before, .bx-robot .bx-mouth::after { display:none; }
  .bx-robot .bx-arm { position:absolute; top:66%; width:20%; height:8%; background:#8a98a6; border:var(--bw) solid #111; border-radius:99px; z-index:1; transform-origin:100% 50%; }
  .bx-robot .bx-arm.l { left:10%; animation:bx-dance-l .4s ease-in-out infinite alternate; }
  .bx-robot .bx-arm.r { right:10%; transform-origin:0 50%; animation:bx-dance-r .4s ease-in-out infinite alternate; }

  /* Dead: X eyes */
  .bx-boss.dead .bx-eye { background:#fff; }
  .bx-boss.dead .bx-eye i { left:12%; top:42%; width:76%; height:16%; border-radius:2px; transform:rotate(45deg); animation:none; box-shadow:none; }
  .bx-boss.dead .bx-eye::after { content:""; position:absolute; left:12%; top:42%; width:76%; height:16%; background:#111; transform:rotate(-45deg); }
  .bx-baby.calm.dead .bx-eye::after { display:none; }

  /* ---------- A cut-scene over the game area ---------- */
  .bx-scene { position:absolute; inset:0; z-index:20; overflow:hidden; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px;
    background:radial-gradient(circle at 50% 45%, var(--bc) 0, var(--bd) 55%, #1a0d2e 100%); border-radius:18px; }
  .bx-scene::before { content:""; position:absolute; inset:-50%; background:repeating-conic-gradient(rgba(255,255,255,.12) 0 10deg, transparent 10deg 20deg); animation:bx-spin 14s linear infinite; }
  .bx-scene > * { position:relative; }
  .bx-scene .bx-stagewrap { position:relative; }
  .bx-name { font-size:clamp(1.6rem, 7vw, 2.6rem); color:#fff; -webkit-text-stroke:2px #111; text-shadow:0 5px 0 #111; letter-spacing:1px; text-align:center; }
  .bx-warn { position:absolute; left:-10%; right:-10%; height:46px; display:flex; align-items:center; justify-content:center; font-size:1.7rem; color:#111;
    background:repeating-linear-gradient(-45deg, #ffd400 0 22px, #111 22px 44px); border-block:4px solid #111; z-index:2; }
  .bx-warn span { background:#ffd400; padding:0 12px; border:4px solid #111; border-radius:10px; animation:bx-flash .3s steps(2) infinite; }
  .bx-warn.top { top:6%; } .bx-warn.bot { bottom:6%; }
  .bx-drop { animation:bx-drop .7s cubic-bezier(.5,0,.75,.6) both; }
  .bx-hp { display:flex; align-items:center; gap:8px; padding:6px 10px; background:#fff; border:4px solid #111; border-radius:14px; box-shadow:0 5px 0 #111; z-index:3; }
  .bx-hp .seg { width:clamp(34px, 9vw, 52px); height:22px; border:3px solid #111; border-radius:6px; background:linear-gradient(#ff6f6f, #e01b3c); transition:background .3s, transform .3s; }
  .bx-hp .seg.gone { background:#ddd; transform:scale(.8); }
  .bx-hp .seg.hit { animation:bx-seg .6s ease-out forwards; }
  .bx-hp .ico { font-size:1.4rem; }
  .bx-hearts { display:flex; gap:6px; font-size:1.9rem; z-index:3; }
  .bx-hearts .broke { animation:bx-broke .6s ease-out; }
  .bx-score { display:flex; align-items:center; gap:14px; padding:8px 16px; background:#fff; border:5px solid #111; border-radius:18px; box-shadow:0 6px 0 #111; font-size:2.4rem; z-index:3; }
  .bx-score .side { display:flex; flex-direction:column; align-items:center; font-size:.9rem; gap:2px; }
  .bx-score .pips { display:flex; gap:4px; }
  .bx-score .pip { width:22px; height:22px; border-radius:50%; border:3px solid #111; background:#eee; }
  .bx-score .pip.on { background:#4dd36b; } .bx-score .side.boss .pip.on { background:#ff4d6d; }
  .bx-score .pip.new { animation:bx-pip .5s ease-out; }
  .bx-slash { position:absolute; left:50%; top:50%; width:150%; height:12px; margin:-6px 0 0 -75%; background:#fff; border-radius:99px; box-shadow:0 0 18px #fff, 0 0 4px #9ff;
    transform:rotate(-30deg) scaleX(0); animation:bx-slash .35s ease-out forwards; z-index:6; }
  .bx-fly { position:absolute; left:50%; top:50%; font-size:var(--fs, 2rem); line-height:1; pointer-events:none; z-index:7; transform:translate(-50%, -50%); }
  .bx-half { position:absolute; inset:0; }

  @keyframes bx-bob { from { transform:translateY(0) scale(1, 1); } to { transform:translateY(-4%) scale(.97, 1.03); } }
  @keyframes bx-laugh { from { transform:translateY(0) rotate(-6deg) scale(1.02); } to { transform:translateY(-6%) rotate(6deg) scale(1.1); } }
  @keyframes bx-hurt { 0%, 100% { transform:translateX(0); } 25% { transform:translateX(-6%) rotate(-4deg); } 75% { transform:translateX(6%) rotate(4deg); } }
  @keyframes bx-angry { 0%, 100% { transform:translate(0, 0); } 25% { transform:translate(-2%, 1%); } 75% { transform:translate(2%, -1%); } }
  @keyframes bx-sleep { from { transform:rotate(-3deg); } to { transform:rotate(3deg) translateY(2%); } }
  @keyframes bx-roll { 0% { transform:translate(-30%, -20%); } 50% { transform:translate(30%, 10%); } 100% { transform:translate(0, 30%); } }
  @keyframes bx-wail { from { transform:translateX(-50%) scale(1, .85); } to { transform:translateX(-50%) scale(1.1, 1.15); } }
  @keyframes bx-tear { 0% { height:0; opacity:1; } 80% { height:46%; opacity:1; } 100% { height:50%; opacity:0; } }
  @keyframes bx-blink { 50% { filter:brightness(1.8); } }
  @keyframes bx-dance-l { from { transform:rotate(-40deg); } to { transform:rotate(30deg); } }
  @keyframes bx-dance-r { from { transform:rotate(40deg); } to { transform:rotate(-30deg); } }
  @keyframes bx-word { from { opacity:1; transform:translate(-50%, -50%) rotate(-8deg) scale(.4); } 25% { transform:translate(-50%, -60%) rotate(-8deg) scale(1.15); }
    75% { opacity:1; } to { opacity:0; transform:translate(-50%, -90%) rotate(-8deg) scale(1); } }
  @keyframes bx-spin { to { transform:rotate(360deg); } }
  @keyframes bx-flash { 50% { background:#ff4d6d; color:#fff; } }
  @keyframes bx-drop { 0% { transform:translateY(-160%) scale(.6); } 75% { transform:translateY(0) scale(1.15, .85); } 100% { transform:none; } }
  @keyframes bx-seg { 0% { transform:scale(1.3); background:#fff; } 100% { transform:scale(.8); background:#ddd; } }
  @keyframes bx-broke { 0% { transform:scale(1.6) rotate(-20deg); } 100% { transform:none; } }
  @keyframes bx-pip { 0% { transform:scale(2); } 100% { transform:none; } }
  @keyframes bx-slash { 60% { transform:rotate(-30deg) scaleX(1); opacity:1; } 100% { transform:rotate(-30deg) scaleX(1); opacity:0; } }
  @media (prefers-reduced-motion: reduce) { .bx-in, .bx-scene::before, .bx-eye i, .bx-tear, .bx-drop, .bx-robot .bx-arm { animation:none !important; } }
  `;
  let cssDone = false;
  function injectCss() {
    if (cssDone) return;
    cssDone = true;
    const s = document.createElement("style");
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  const PARTS = {
    banana: '<div class="bx-arm l"></div><div class="bx-arm r"></div><div class="bx-body"></div><div class="bx-crown">👑</div>' +
      '<div class="bx-brow l"></div><div class="bx-brow r"></div><div class="bx-eye l"><i></i></div><div class="bx-eye r big"><i></i></div><div class="bx-mouth"></div>',
    baby: '<div class="bx-body"></div><div class="bx-ear l"></div><div class="bx-ear r"></div><div class="bx-head"></div>' +
      '<div class="bx-eye l big"><i></i></div><div class="bx-eye r"><i></i></div><div class="bx-cheek l"></div><div class="bx-cheek r"></div>' +
      '<div class="bx-mouth"></div><div class="bx-tear l"></div><div class="bx-tear r"></div>',
    robot: '<div class="bx-arm l"></div><div class="bx-arm r"></div><div class="bx-body"></div><div class="bx-head"></div>' +
      '<div class="bx-eye l big"><i></i></div><div class="bx-eye r"><i></i></div><div class="bx-mouth"></div>',
  };
  // A boss character, `size` px square (a number), or any CSS length ("1.3em", "var(--mz)").
  function el(id, size) {
    injectCss();
    const d = document.createElement("div");
    d.className = `bx-boss bx-${id}`;
    d.style.setProperty("--bs", typeof size === "number" ? `${Math.round(size)}px` : size);
    d.innerHTML = `<div class="bx-in">${PARTS[id]}</div>`;
    d.setAttribute("aria-hidden", "true");
    return d;
  }
  // A little boss holding up a game's sign or target (Boss versions of the battle games): it sits behind
  // the sign (z-index -1 in the target's stacking context), with its head above it.
  function carrier(id, size) {
    const b = el(id, size);
    b.classList.add("bx-carrier");
    return b;
  }
  // The boss version of a battle game is on (the game draws the boss itself): the boss's id in the final
  // battle. (Baby Boss is never hit: its games feed it and rock it to sleep.)
  function fighting(ctx) {
    return ctx && ctx.boss && ctx.boss.phase === "battle" ? ctx.boss.id : null;
  }
  function setMood(b, mood) {
    b.classList.remove("laugh", "hurt", "angry", "dead", "happy");
    if (mood) { void b.offsetWidth; b.classList.add(mood); }
  }

  // ---------- The boss's seat: the boss in the corner of the game while you play ----------
  // race: true (the showdown) — it plays the same game: its bar fills a third at a time (a hop and a
  // ding each time it "gets one"), and full means it got there first (that's the time limit).
  // race: false (a battle game that doesn't draw the boss itself, e.g. Baby Boss's milk hunt) — it just
  // watches, wailing; find the answer and a 🍼 flies to it.
  function seat(parent, id, race, sfx) {
    injectCss();
    const s = document.createElement("div");
    s.className = "bx-seat" + (race ? " race" : "");
    s.setAttribute("aria-hidden", "true");
    const b = el(id, 62);
    s.appendChild(b);
    const segs = [];
    if (race) {
      const bar = document.createElement("div");
      bar.className = "bx-race";
      for (let i = 0; i < 3; i++) { const g = document.createElement("span"); bar.appendChild(g); segs.push(g); }
      s.appendChild(bar);
    } else if (id === "baby") {
      s.insertAdjacentHTML("beforeend", '<div class="bx-want">🍼❓</div>');
    }
    parent.appendChild(s);
    let filled = 0, over = false;
    return {
      // f: how far through the time limit (0..1)
      progress(f) {
        if (!race || over) return;
        const n = Math.min(3, Math.floor(f * 3 + 1e-6));
        while (filled < n) {
          segs[filled].classList.add("on");
          filled++;
          b.animate([{ transform: "translateY(0)" }, { transform: "translateY(-14px)" }, { transform: "translateY(0)" }], { duration: 300 });
          if (filled < 3) { sfx.tone(660 + filled * 110, 0.06, "square", 0.05); sfx.tone(990 + filled * 110, 0.08, "square", 0.04, 0.06); }
        }
      },
      result(won) {
        over = true;
        if (id === "baby" && won && !race) {
          const m = document.createElement("div");
          m.className = "bx-fly"; m.textContent = "🍼"; m.style.setProperty("--fs", "34px");
          s.appendChild(m);
          m.animate([{ transform: "translate(-50%, 120px) scale(1.4)" }, { transform: "translate(-50%, -60%) scale(.8)" }], { duration: 500, easing: "ease-out", fill: "forwards" });
          setTimeout(() => { b.classList.add("calm"); m.remove(); const w = s.querySelector(".bx-want"); if (w) w.textContent = "😋"; }, 520);
          return;
        }
        setMood(b, won ? "angry" : "laugh");
      },
      remove() { s.remove(); },
    };
  }

  // ---------- The boss as a rival inside a showdown game ----------
  // Showdown games (`bossRival: true`) draw the boss into their own scene, playing the same game beside
  // you: fishing from its own boat, hopping its own pads, shooting and missing. It never really scores
  // and never gets in your way; its tries all miss until time runs out, and then it gets there first
  // (each game's onTimeUp: the boss pulls up a fish, finishes its snowman…). Returns null outside the
  // showdown (and in tutorials).
  //   const rv = Boss.rival(ctx);
  //   rv.el(size)            the boss character (Boss.el), size a px number or CSS length
  //   rv.frac()              how far through the time limit, 0..1 (pace the boss on this)
  //   rv.loop(fn)            fn(frac) every frame until the round ends
  //   rv.tries(n, fn)        fn(i) n times, evenly spread through the time limit (its misses)
  //   rv.onTimeUp(fn)        time ran out: the boss's winning move
  //   rv.mood(m), rv.bubble(text, ms)   a mood on every boss drawn; a speech bubble over the first
  // Its reaction to the result is automatic: angry if you win, laughing if you don't.
  function rival(ctx) {
    if (!ctx || !ctx.boss || ctx.boss.phase !== "showdown" || ctx.demo) return null;
    injectCss();
    const id = ctx.boss.id, bosses = [], timeUp = [];
    const r = {
      id, info: BOSSES[id], bosses,
      el(size) { const b = el(id, size); b.classList.add("bx-rival"); bosses.push(b); return b; },
      frac: () => (ctx.timeFrac ? ctx.timeFrac() : 0),
      loop(fn) {
        const step = () => { if (ctx.ended) return; fn(r.frac()); ctx.raf(step); };
        ctx.raf(step);
      },
      tries(n, fn) {
        let i = 0;
        r.loop((f) => { while (i < n && f >= (i + 1) / (n + 1)) fn(i++); });
      },
      onTimeUp(fn) { timeUp.push(fn); },
      mood(m) { bosses.forEach((b) => setMood(b, m)); },
      bubble(text, ms = 900) {
        const b = bosses[0];
        if (!b) return;
        const old = b.querySelector(".bx-bub");
        if (old) old.remove();
        const s = document.createElement("div");
        s.className = "bx-bub";
        s.textContent = text;
        b.appendChild(s);
        ctx.later(() => s.remove(), ms);
      },
    };
    ctx.onEnd((won, timedOut) => {
      if (timedOut) timeUp.forEach((fn) => { try { fn(); } catch (err) { console.error("boss rival:", err); } });
      r.mood(won ? "angry" : "laugh");
      if (!timedOut) r.bubble(won ? TEXT.grr : TEXT.haha, 1400);
    });
    return r;
  }

  // ---------- Cut-scenes ----------
  // Each builds a scene inside `root` (#game, which the frame empties between rounds) and returns how
  // long it lasts in ms. `env`: { later, sfx, say, confetti }.
  function scene(root, boss) {
    injectCss();
    const s = document.createElement("div");
    s.className = "bx-scene";
    s.style.setProperty("--bc", boss.color);
    s.style.setProperty("--bd", boss.dark);
    root.appendChild(s);
    const W = root.clientWidth || 360, H = root.clientHeight || 500;
    return { s, W, H, size: Math.max(140, Math.min(W * 0.62, H * 0.5, 280)) };
  }
  function word(parent, text, cls, at) {
    const w = document.createElement("div");
    w.className = "bx-word" + (cls ? ` ${cls}` : "");
    w.textContent = text;
    if (at) { w.style.left = at.x; w.style.top = at.y; }
    parent.appendChild(w);
    return w;
  }
  function hpBar(boss, hp, hitNow) {
    const d = document.createElement("div");
    d.className = "bx-hp";
    d.innerHTML = `<span class="ico">${boss.icon}</span>` + [...Array(HP)].map((_, i) =>
      `<span class="seg${i >= hp ? (hitNow && i === hp ? " hit" : " gone") : ""}"></span>`).join("");
    return d;
  }
  function hearts(n, brokeNow) {
    const d = document.createElement("div");
    d.className = "bx-hearts";
    d.innerHTML = [...Array(HEARTS)].map((_, i) => `<span class="${brokeNow && i === n ? "broke" : ""}">${i < n ? "❤️" : "🖤"}</span>`).join("");
    return d;
  }
  function fly(parent, emoji, from, to, ms, env, size = "2.4rem") {
    const f = document.createElement("div");
    f.className = "bx-fly"; f.textContent = emoji; f.style.setProperty("--fs", size);
    parent.appendChild(f);
    f.animate([{ transform: `translate(calc(-50% + ${from.x}px), calc(-50% + ${from.y}px)) rotate(0)` },
      { transform: `translate(calc(-50% + ${to.x}px), calc(-50% + ${to.y}px)) rotate(${(Math.random() - 0.5) * 720}deg)`, opacity: to.fade ? 0 : 1 }],
      { duration: ms, easing: to.ease || "ease-in-out", fill: "forwards" });
    return f;
  }

  // 💥 The boss appears after level 10: warning stripes and a siren, it drops in, says who it is.
  function intro(root, boss, env) {
    const { s, size } = scene(root, boss);
    const { tone, sweep } = env.sfx;
    s.insertAdjacentHTML("beforeend", `<div class="bx-warn top"><span>⚠️ ${TEXT.warning} ⚠️</span></div><div class="bx-warn bot"><span>⚠️ ${TEXT.warning} ⚠️</span></div>`);
    for (let i = 0; i < 4; i++) sweep(500, 900, 0.3, "square", 0.06, i * 0.35); // the siren
    const b = el(boss.id, size);
    b.style.visibility = "hidden";
    const name = document.createElement("div");
    name.className = "bx-name"; name.textContent = TEXT.appears;
    s.append(b, name);
    env.later(() => {
      b.style.visibility = ""; b.classList.add("bx-drop");
      sweep(1400, 200, 0.6, "sine", 0.08);
    }, 1300);
    env.later(() => {
      tone(70, 0.3, "square", 0.18); env.sfx.noise(0.3, "lowpass", 500, 80, 0.8); // THUD
      s.animate([{ transform: "translate(0,0)" }, { transform: "translate(-8px,4px)" }, { transform: "translate(8px,-4px)" }, { transform: "translate(0,0)" }], { duration: 240, iterations: 2 });
      name.textContent = boss.name;
      setMood(b, "laugh");
      env.say(boss.intro);
    }, 2000);
    return 4400;
  }

  // The showdown score after each round: the boss laughs if it took the round, gets angry if you did.
  function score(root, boss, you, them, youWon, env) {
    const { s, size } = scene(root, boss);
    const b = el(boss.id, size * 0.8);
    const sc = document.createElement("div");
    sc.className = "bx-score";
    const pips = (n, isNew) => [0, 1].map((i) => `<span class="pip${i < n ? " on" : ""}${isNew && i === n - 1 ? " new" : ""}"></span>`).join("");
    sc.innerHTML = `<div class="side"><span>${TEXT.you}</span><div class="pips">${pips(you, youWon)}</div></div><span>VS</span>` +
      `<div class="side boss"><span>${boss.icon}</span><div class="pips">${pips(them, !youWon)}</div></div>`;
    s.append(b, sc);
    setMood(b, youWon ? "angry" : "laugh");
    if (youWon) { env.say(boss.angry); env.sfx.tone(140, 0.4, "sawtooth", 0.1); }
    else { env.say(boss.taunt); [0, 0.15, 0.3].forEach((t) => env.sfx.tone(330, 0.1, "square", 0.08, t)); word(s, TEXT.haha, "bad", { x: "50%", y: "18%" }); }
    return 2300;
  }

  // FINAL BATTLE! The boss gets angry; its HP bar and your hearts appear.
  function battleStart(root, boss, env) {
    const { s, size } = scene(root, boss);
    const b = el(boss.id, size * 0.85);
    const name = document.createElement("div");
    name.className = "bx-name"; name.textContent = TEXT.finalBattle;
    s.append(hpBar(boss, HP), b, name, hearts(HEARTS));
    setMood(b, "angry");
    [196, 233, 262, 311].forEach((f, i) => env.sfx.tone(f, 0.18, "sawtooth", 0.1, i * 0.16));
    env.say(boss.battleLine);
    return 2800;
  }

  // A stage won: the boss takes a hit (sliced / gulps milk / shorts out), and loses an HP.
  function hit(root, boss, hp, stageNext, env) {
    const { s, size } = scene(root, boss);
    const wrap = document.createElement("div");
    wrap.className = "bx-stagewrap";
    const b = el(boss.id, size * 0.85);
    wrap.appendChild(b);
    const name = document.createElement("div");
    name.className = "bx-name"; name.textContent = boss.name; // (STAGE n follows on the round banner)
    name.style.visibility = "hidden";
    s.append(hpBar(boss, hp, true), wrap, name);
    const { tone, noise, sweep } = env.sfx;
    if (boss.id === "banana") {
      const sl = document.createElement("div"); sl.className = "bx-slash"; wrap.appendChild(sl);
      noise(0.2, "highpass", 3000, 6000, 0.3); sweep(1600, 400, 0.2, "sawtooth", 0.08);
    } else if (boss.id === "baby") {
      fly(wrap, stageNext >= 3 ? "🥄" : "🍼", { x: 0, y: size * 0.9 }, { x: 0, y: -size * 0.05, fade: true }, 600, env, `${size * 0.25}px`); // milk after stage 1, baby food after stage 2
      env.later(() => { [0, 0.18, 0.36].forEach((t) => tone(300, 0.1, "sine", 0.1, t)); b.classList.add("calm"); }, 550);
      env.later(() => b.classList.remove("calm"), 1300);
    } else {
      for (let i = 0; i < 8; i++) {
        const a = Math.random() * 6.28;
        fly(wrap, "⚡", { x: 0, y: 0 }, { x: Math.cos(a) * size * 0.7, y: Math.sin(a) * size * 0.7, fade: true }, 600, env, `${size * 0.16}px`);
      }
      for (let i = 0; i < 6; i++) tone(200 + Math.random() * 1600, 0.05, "square", 0.07, i * 0.06);
    }
    setMood(b, "hurt");
    tone(110, 0.25, "square", 0.12, 0.1);
    word(wrap, boss.hitWord, "", null);
    env.later(() => { word(wrap, TEXT.ouch[hp % 3], "bad", { x: "50%", y: "10%" }); env.say(TEXT.ouch[hp % 3].toLowerCase()); }, 500);
    env.later(() => { name.style.visibility = ""; setMood(b, "angry"); env.sfx.whoosh && env.sfx.whoosh(); }, 1300);
    return 2300;
  }

  // A stage lost: the boss laughs and you lose a heart; the stage is played again.
  function miss(root, boss, hp, heartsLeft, env) {
    const { s, size } = scene(root, boss);
    const b = el(boss.id, size * 0.85);
    s.append(hpBar(boss, hp), b, hearts(heartsLeft, true));
    setMood(b, "laugh");
    word(s, TEXT.haha, "bad", { x: "50%", y: "22%" });
    [0, 0.15, 0.3, 0.45].forEach((t) => { env.sfx.tone(330, 0.1, "square", 0.09, t); env.sfx.tone(262, 0.1, "square", 0.07, t + 0.07); });
    env.say(boss.taunt);
    return 2200;
  }

  // Banana Boss sliced in two: two halves (cut along a diagonal) of a `size` px boss fall apart inside
  // `wrap` (a positioned box the boss's size). `ms` 0 puts them straight where they end up.
  const HALVES = [["polygon(0 0, 100% 0, 100% 22%, 0 80%)", -1], ["polygon(0 80%, 100% 22%, 100% 100%, 0 100%)", 1]];
  function split(wrap, id, size, ms = 900) {
    return HALVES.map(([clip, dir]) => {
      const h = el(id, size); h.classList.add("dead", "bx-half"); h.style.clipPath = clip;
      wrap.appendChild(h);
      const end = `translate(${dir * size * 0.5}px, ${dir * size * 0.35}px) rotate(${dir * 35}deg)`;
      if (ms) h.animate([{ transform: "none" }, { transform: end, opacity: 0.9 }], { duration: ms, easing: "ease-in", fill: "forwards" });
      else { h.style.transform = end; h.style.opacity = "0.9"; }
      return h;
    });
  }

  // The boss is beaten: Banana Boss is sliced in two, Baby Boss drinks its milk and falls asleep,
  // Robot Boss shorts out and explodes. Confetti either way. `opts.sliced`: Banana Boss was already
  // sliced in two in the game (Shield Breaker's finale), so its halves are lying there already. Likewise `opts.finished` for
  // Robot Boss: it already blew up in the game (its Wire Cut), so only its nuts and bolts are left.
  function defeat(root, boss, env, opts = {}) {
    const { s, size, W, H } = scene(root, boss);
    const wrap = document.createElement("div");
    wrap.className = "bx-stagewrap";
    wrap.style.width = wrap.style.height = `${size}px`;
    const b = el(boss.id, size);
    b.classList.add("dead");
    wrap.appendChild(b);
    s.append(hpBar(boss, 0), wrap);
    const { tone, noise, sweep } = env.sfx;
    const burst = (n = 120) => env.confetti(s, W / 2, H * 0.45, { count: n });
    if (boss.id === "banana" && (opts.sliced || opts.finished)) {
      b.remove();
      split(wrap, boss.id, size, 0);
      tone(90, 0.3, "square", 0.15); burst();
      for (let i = 0; i < 10; i++) fly(s, "🍌", { x: 0, y: 0 }, { x: (Math.random() - 0.5) * W, y: (Math.random() - 0.7) * H, fade: true }, 1100, env, "2rem");
    } else if (boss.id === "robot" && opts.finished) {
      b.remove();
      [["🔩", -0.3, 0.3], ["⚙️", 0.05, 0.38], ["🔧", 0.32, 0.28], ["⚙️", -0.12, 0.12], ["🔩", 0.22, 0.05]].forEach(([e, x, y]) => {
        const p = document.createElement("div");
        p.className = "bx-fly"; p.textContent = e; p.style.setProperty("--fs", `${size * 0.2}px`);
        p.style.transform = `translate(calc(-50% + ${x * size}px), calc(-50% + ${y * size}px)) rotate(${Math.round(Math.random() * 80 - 40)}deg)`;
        wrap.appendChild(p);
      });
      for (let i = 0; i < 5; i++) env.later(() => fly(wrap, "💨", { x: (Math.random() - 0.5) * size * 0.5, y: size * 0.2 }, { x: (Math.random() - 0.5) * size * 0.6, y: -size * 0.6, fade: true, ease: "ease-out" }, 1200, env, `${size * 0.18}px`), i * 250);
      tone(90, 0.3, "square", 0.12); burst();
    } else if (boss.id === "banana") {
      const sl = document.createElement("div"); sl.className = "bx-slash"; wrap.appendChild(sl);
      noise(0.25, "highpass", 3000, 6000, 0.35);
      env.later(() => {
        // Two halves cut along the slash fall apart.
        b.remove();
        split(wrap, boss.id, size);
        tone(90, 0.3, "square", 0.15); burst();
        for (let i = 0; i < 10; i++) fly(s, "🍌", { x: 0, y: 0 }, { x: (Math.random() - 0.5) * W, y: (Math.random() - 0.7) * H, fade: true }, 1100, env, "2rem");
      }, 400);
    } else if (boss.id === "baby" && opts.finished) {
      // Rock-a-Bye already sent it to sleep: it's snoozing, with a lullaby and 💤.
      b.classList.add("calm", "dead");
      [523, 659, 784, 659, 523].forEach((f, i) => tone(f, 0.3, "sine", 0.08, i * 0.32));
      for (let i = 0; i < 5; i++) env.later(() => fly(wrap, "💤", { x: size * 0.3, y: -size * 0.2 }, { x: size * 0.55, y: -size * 0.75, fade: true, ease: "ease-out" }, 1400, env, `${size * 0.16}px`), i * 450);
      for (let i = 0; i < 6; i++) fly(s, "💖", { x: (Math.random() - 0.5) * size, y: size * 0.2 }, { x: (Math.random() - 0.5) * W * 0.8, y: -H * 0.45, fade: true }, 1600, env, "1.8rem");
      burst(80);
    } else if (boss.id === "baby") {
      b.classList.remove("dead");
      fly(wrap, "🍼", { x: 0, y: size * 0.9 }, { x: 0, y: size * 0.02 }, 700, env, `${size * 0.3}px`);
      env.later(() => { for (let i = 0; i < 5; i++) tone(320, 0.1, "sine", 0.1, i * 0.22); }, 700); // gulp gulp gulp
      env.later(() => {
        b.classList.add("calm", "dead");
        wrap.querySelector(".bx-fly").remove();
        [523, 659, 784, 659, 523].forEach((f, i) => tone(f, 0.3, "sine", 0.08, i * 0.32)); // lullaby
        for (let i = 0; i < 4; i++) env.later(() => fly(wrap, "💤", { x: size * 0.3, y: -size * 0.2 }, { x: size * 0.55, y: -size * 0.75, fade: true, ease: "ease-out" }, 1400, env, `${size * 0.16}px`), i * 450);
        for (let i = 0; i < 6; i++) fly(s, "💖", { x: (Math.random() - 0.5) * size, y: size * 0.2 }, { x: (Math.random() - 0.5) * W * 0.8, y: -H * 0.45, fade: true }, 1600, env, "1.8rem");
        burst(80);
      }, 1900);
    } else {
      for (let i = 0; i < 14; i++) env.later(() => {
        const a = Math.random() * 6.28;
        fly(wrap, "⚡", { x: 0, y: 0 }, { x: Math.cos(a) * size * 0.6, y: Math.sin(a) * size * 0.6, fade: true }, 400, env, `${size * 0.14}px`);
        tone(300 + Math.random() * 1800, 0.05, "square", 0.07);
      }, i * 90);
      setMood(b, "angry");
      env.later(() => {
        b.animate([{ transform: "scale(1)" }, { transform: "scale(1.4)", opacity: 1 }, { transform: "scale(0)", opacity: 0 }], { duration: 400, fill: "forwards" });
        noise(0.8, "lowpass", 1500, 100, 0.9); tone(60, 0.5, "square", 0.18);
        burst(160);
        for (let i = 0; i < 12; i++) fly(s, ["🔩", "⚙️", "🔧"][i % 3], { x: 0, y: 0 }, { x: (Math.random() - 0.5) * W, y: (Math.random() - 0.6) * H, fade: true }, 1200, env, "2rem");
        s.animate([{ transform: "translate(0,0)" }, { transform: "translate(-10px,5px)" }, { transform: "translate(10px,-5px)" }, { transform: "translate(0,0)" }], { duration: 200, iterations: 3 });
      }, 1300);
    }
    env.later(() => { word(s, boss.defeatWord, "big", { x: "50%", y: "82%" }); env.say(boss.defeatLine); }, boss.id === "baby" ? 2000 : 1400);
    return 5200;
  }

  // You lost: the boss towers over you, laughing.
  function gloat(root, boss, env) {
    const { s, size } = scene(root, boss);
    const b = el(boss.id, size * 1.1);
    s.appendChild(b);
    setMood(b, "laugh");
    word(s, TEXT.haha, "bad big", { x: "50%", y: "16%" });
    for (let i = 0; i < 6; i++) { env.sfx.tone(330, 0.1, "square", 0.1, i * 0.15); env.sfx.tone(262, 0.1, "square", 0.08, i * 0.15 + 0.07); }
    env.say(boss.taunt);
    return 2800;
  }

  window.Boss = { TEXT, BOSSES, IDS, SHOWDOWN, SPEED, HP, HEARTS, LEVELS, el, carrier, fighting, seat, rival, split, setMood, injectCss, intro, score, battleStart, hit, miss, defeat, gloat };
})();
