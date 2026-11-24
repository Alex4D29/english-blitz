// 🗺️ ADVENTURE — the teacher's idea: a map of themed islands. Each island is a winding path of 7 levels and its
// boss. A level is 3 of that island's games (any content in play) for 0–3 stars; a star or more opens the next
// one. The boss level is that boss's final battle; beat it and the next island opens. Progress is the active
// player's (js/players.js: `wwe.adventure` is a per-player key): { stars: { "jungle-0": 3, … } }.
// The frame plays the levels (FrameAPI.playLevel / playBoss, mode "adventure") and calls record() with the
// stars; the results screen's MAP button comes back here, and your character hops to the next level.
(function () {
  const KEY = "wwe.adventure";
  const ISLANDS = [
    { id: "jungle", name: "JUNGLE", icon: "🌴", boss: "gorilla", bg: ["#8fe36b", "#3fae4a"], deco: ["🌴", "🌿", "🦜", "🍌", "🌺", "🐒"],
      games: ["monkey-swing", "froggy-hop", "lake-leap", "bongo-bash", "tug-of-war", "balloon-pop", "chicken-choir"] },
    { id: "ninja", name: "NINJA CASTLE", icon: "🏯", boss: "banana", bg: ["#ffc2dc", "#e86aa6"], deco: ["🏯", "🌸", "⛩️", "🎋", "🌸", "🗻"],
      games: ["samurai-slice", "shuriken-toss", "maze-run", "whack-a-mole", "shield-breaker", "egg-shuffle", "spot-imposter"] },
    { id: "funfair", name: "ROBOT FUNFAIR", icon: "🎡", boss: "robot", bg: ["#c7a8ff", "#7a4fe0"], deco: ["🎡", "🎪", "🎠", "🎈", "🍿", "⚙️"],
      games: ["wire-cut", "pachinko", "dance-off", "monster-boxing", "strength-test", "claw-catch", "hoop-shot"] },
    { id: "nursery", name: "TOY NURSERY", icon: "🧸", boss: "baby", bg: ["#ffe0b8", "#f5a95c"], deco: ["🧸", "🪀", "🧩", "🍼", "🚂", "🎈"],
      games: ["feed-me", "clean-room", "ghost-hunt", "find-my-baby", "stop-sneeze", "train-builder", "window-wiper"] },
    { id: "cottage", name: "COSY COTTAGE", icon: "🏡", boss: "kitty", bg: ["#bfe9ff", "#4aa8e8"], deco: ["🏡", "🐟", "🧶", "🌻", "🐔", "🦜"],
      games: ["fishing", "mouse-trap", "yarn-chase", "polly-crackers", "tickle-tummy", "chicken-choir", "pizza-chef"] },
  ];
  const LEVELS = 8;                                    // 7 levels + the boss (the last)
  const SPEEDS = [1, 1, 1.1, 1.1, 1.2, 1.25, 1.3];     // a little faster along the path
  const SPOTS = [[18, 88], [46, 80], [78, 71], [62, 58], [30, 50], [20, 36], [52, 27], [50, 10]]; // % of the map: bottom → top
  const TEXT = {
    locked: (boss) => `🔒 Beat ${boss} to get here!`,
    stars: (n, of) => `⭐ ${n} / ${of}`,
    say: (name) => `${name.toLowerCase()}!`,
    sailing: (name) => `SAILING TO\n${name}!`,
    worldTitle: "🌍 ADVENTURE",
    worldSay: "Where shall we sail?",
  };

  const CSS = `
  #adventure { position:fixed; inset:0; z-index:60; display:flex; flex-direction:column; background:transparent;
    padding:max(6px, env(safe-area-inset-top)) max(6px, env(safe-area-inset-right)) max(6px, env(safe-area-inset-bottom)) max(6px, env(safe-area-inset-left)); }
  #adventure[hidden] { display:none; }
  .ad-top { flex:none; display:flex; align-items:center; gap:8px; padding-bottom:6px; }
  .ad-x { flex:none; width:46px; height:46px; border-radius:50%; border:4px solid #111; background:#fff; font:inherit; font-size:1.2rem; cursor:pointer; }
  .ad-title { flex:1; display:flex; align-items:center; justify-content:center; gap:8px; min-width:0; }
  .ad-title .nm { font-size:clamp(1.3rem, 6vw, 2.2rem); line-height:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .ad-arrow { flex:none; width:50px; height:50px; border-radius:50%; border:4px solid #111; background:#ffd400; box-shadow:0 4px 0 #111; font:inherit; font-size:1.4rem; cursor:pointer; touch-action:manipulation; }
  .ad-arrow:disabled { opacity:.3; }
  .ad-total { flex:none; padding:4px 12px; background:#fff; border:4px solid #111; border-radius:99px; font-size:1.05rem; white-space:nowrap; }
  .ad-map { position:relative; flex:1; min-height:0; border:5px solid #111; border-radius:24px; overflow:hidden; box-shadow:0 7px 0 #111;
    background:radial-gradient(ellipse 80% 60% at 50% 55%, var(--b1) 0 60%, var(--b2) 100%); }
  .ad-map::before { content:""; position:absolute; inset:0; background:repeating-radial-gradient(circle at 30% 20%, rgba(255,255,255,.08) 0 18px, transparent 18px 40px); }
  .ad-deco { position:absolute; font-size:clamp(1.6rem, 6vw, 2.6rem); line-height:1; opacity:.9; pointer-events:none; transform:translate(-50%, -50%); }
  .ad-path { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; }
  .ad-node { position:absolute; width:var(--nz); height:var(--nz); margin:calc(var(--nz) / -2) 0 0 calc(var(--nz) / -2); border-radius:50%; border:5px solid #111; background:#fff;
    box-shadow:0 6px 0 #111; font:inherit; font-size:calc(var(--nz) * .42); line-height:1; cursor:pointer; touch-action:manipulation; z-index:2; display:flex; align-items:center; justify-content:center; }
  .ad-node.done { background:#ffe066; }
  .ad-node.next { animation:ad-pulse .8s ease-in-out infinite alternate; background:#fff; }
  .ad-node.locked { background:#bbb; color:#777; cursor:default; box-shadow:0 4px 0 #555; }
  .ad-node .st { position:absolute; left:50%; top:100%; transform:translateX(-50%); margin-top:6px; font-size:calc(var(--nz) * .26); white-space:nowrap; letter-spacing:-1px;
    color:#ffd400; -webkit-text-stroke:1px #111; paint-order:stroke fill; }
  .ad-node .st i { font-style:normal; color:rgba(0,0,0,.25); -webkit-text-stroke:0; }
  .ad-boss { --nz:calc(var(--bz)); width:var(--bz); height:var(--bz); margin:calc(var(--bz) / -2) 0 0 calc(var(--bz) / -2); border-radius:24px; background:rgba(255,255,255,.55); }
  .ad-boss .bx-boss { position:absolute; inset:6%; width:auto !important; height:auto !important; }
  .ad-boss.locked .bx-boss, .ad-boss.dark .bx-boss { filter:brightness(0); }
  .ad-boss .crown { position:absolute; right:-14px; top:-18px; font-size:calc(var(--bz) * .3); }
  .ad-me { position:absolute; left:0; top:0; z-index:3; pointer-events:none; }
  .ad-me .ms { margin:calc(var(--mz) * -1.05) 0 0 calc(var(--mz) * -.5); }
  .ad-lock { position:absolute; inset:0; z-index:4; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,.45); }
  .ad-lock span { padding:12px 18px; background:#fff; border:5px solid #111; border-radius:18px; font-size:clamp(1.1rem, 5vw, 1.6rem); text-align:center; }
  /* 🌍 The world map: the sea, the islands on a dotted route, your ship */
  .aw-sea { position:relative; flex:1; min-height:0; border:5px solid #111; border-radius:24px; overflow:hidden; box-shadow:0 7px 0 #111;
    background:radial-gradient(circle at 20% 30%, rgba(255,255,255,.18) 0 8%, transparent 9%) 0 0 / 120px 90px,
      radial-gradient(circle at 70% 60%, rgba(255,255,255,.12) 0 6%, transparent 7%) 0 0 / 90px 70px, linear-gradient(#5cc4ff, #1e7fd6); }
  .aw-fish { font-size:clamp(1.2rem, 4vw, 1.8rem); opacity:.7; animation:aw-swim 2.4s ease-in-out infinite alternate; }
  .aw-isle { position:absolute; width:var(--iz); height:var(--iz); margin:calc(var(--iz) / -2) 0 0 calc(var(--iz) / -2); border:0; padding:0; background:none; font:inherit;
    cursor:pointer; touch-action:manipulation; z-index:2; }
  .aw-isle .land { position:absolute; inset:14% 0 6%; border-radius:50%; border:5px solid #111; box-shadow:0 6px 0 rgba(0,0,0,.3);
    background:radial-gradient(ellipse at 50% 35%, var(--g1) 0 46%, var(--g2) 60%, #f4d28a 61% 78%, #e6bd6e 79%); }
  .aw-isle .ic { position:absolute; left:50%; top:30%; transform:translate(-50%, -50%); font-size:calc(var(--iz) * .5); line-height:1; }
  .aw-isle .lbl { position:absolute; left:50%; top:96%; transform:translateX(-50%); white-space:nowrap; font-size:clamp(.8rem, 2.8vw, 1.1rem); padding:2px 8px;
    background:#fff; color:#111; border:3px solid #111; border-radius:99px; -webkit-text-stroke:0; text-shadow:none; }
  .aw-isle .st { position:absolute; left:50%; top:70%; transform:translateX(-50%); font-size:calc(var(--iz) * .16); white-space:nowrap; color:#fff; -webkit-text-stroke:1px #111; paint-order:stroke fill; font-weight:900; }
  .aw-isle .crown { position:absolute; right:0; top:0; font-size:calc(var(--iz) * .32); }
  .aw-isle.locked .land, .aw-isle.locked .ic { filter:grayscale(1) brightness(.85); }
  .aw-isle.locked .lock { position:absolute; left:50%; top:34%; transform:translate(-50%, -50%); font-size:calc(var(--iz) * .26); white-space:nowrap; }
  .aw-isle:not(.locked):active { transform:scale(.95); }
  .aw-ship { position:absolute; left:0; top:0; z-index:3; pointer-events:none; --sz:calc(var(--iz) * .7); --mez:calc(var(--sz) * .5); width:var(--sz); height:var(--sz);
    margin:calc(var(--sz) / -1.2) 0 0 calc(var(--sz) / -2); }
  .aw-ship > * { position:absolute; }
  .aw-ship .hull { left:0; right:0; bottom:0; height:30%; background:linear-gradient(#b8743a 0 50%, #8f5526 50%); border:4px solid #111; clip-path:polygon(0 0, 100% 0, 86% 100%, 14% 100%); }
  .aw-ship .sail { left:44%; bottom:28%; width:46%; height:58%; border:4px solid #111; border-radius:4px 20px 4px 4px; background:repeating-linear-gradient(180deg, #fff 0 18%, #e8173c 18% 30%); }
  .aw-ship .me { left:0; bottom:24%; }
  .aw-ship > * { animation:aw-bob 1.1s ease-in-out infinite alternate; } /* (on the parts: the ship itself is placed with transform) */
  @keyframes aw-bob { from { translate:0 0; rotate:-3deg; } to { translate:0 -6%; rotate:3deg; } }
  @keyframes aw-swim { to { translate:16px -6px; } }
  /* ⛵ Sailing to an island: sky, sea, the island growing on the horizon, your ship bobbing over the waves */
  .ad-sail { --shz:min(46vw, 38vh, 260px); --mez:calc(var(--shz) * .44); position:relative; flex:1; min-height:0; overflow:hidden; border:5px solid #111; border-radius:24px;
    box-shadow:0 7px 0 #111; background:linear-gradient(#7fd4ff 0 58%, #2f8fe0 58%); cursor:pointer; }
  .ad-sail .sun { position:absolute; left:12%; top:8%; width:14%; aspect-ratio:1; border-radius:50%; background:#fff3a8; box-shadow:0 0 40px 14px rgba(255,240,150,.8); }
  .ad-sail .gull { position:absolute; left:30%; top:16%; font-size:2rem; animation:ad-gull 1.6s ease-in-out infinite alternate; }
  .ad-sail .isle { position:absolute; left:78%; top:60%; width:min(40vw, 300px); transform-origin:50% 100%; }
  .ad-sail .mound { width:100%; aspect-ratio:3; border-radius:50% 50% 0 0 / 100% 100% 0 0; background:#f4d28a; border:5px solid #111; border-bottom:0; }
  .ad-sail .ic { position:absolute; left:50%; bottom:40%; transform:translateX(-50%); font-size:min(22vw, 170px); line-height:1; }
  .ad-sail .ship { position:absolute; left:-30%; bottom:22%; width:var(--shz); height:var(--shz); animation:ad-bob 1.1s ease-in-out infinite alternate; transform-origin:50% 90%; }
  .ad-sail .hull { position:absolute; left:0; right:0; bottom:0; height:30%; background:linear-gradient(#b8743a 0 50%, #8f5526 50%); border:5px solid #111;
    clip-path:polygon(0 0, 100% 0, 86% 100%, 14% 100%); z-index:3; }
  .ad-sail .hull::after { content:""; position:absolute; left:10%; right:10%; top:22%; height:12%; background:#ffd400; }
  .ad-sail .mast { position:absolute; left:58%; bottom:26%; width:5%; height:70%; background:#6b4a1f; border:3px solid #111; z-index:1; }
  .ad-sail .sail { position:absolute; left:32%; bottom:36%; width:52%; height:52%; z-index:2; border:5px solid #111; border-radius:6px 30px 6px 6px;
    background:repeating-linear-gradient(180deg, #fff 0 18%, #e8173c 18% 30%); animation:ad-billow 1.4s ease-in-out infinite alternate; transform-origin:100% 50%; }
  .ad-sail .flag { position:absolute; left:61%; bottom:92%; width:16%; height:9%; background:#ffd400; border:3px solid #111; clip-path:polygon(0 0, 100% 50%, 0 100%); animation:ad-flap .25s ease-in-out infinite alternate; transform-origin:0 50%; }
  .ad-sail .me { position:absolute; left:6%; bottom:24%; z-index:2; }
  .ad-sail .waves { position:absolute; left:0; right:-120px; bottom:0; height:30%; z-index:4; pointer-events:none;
    background:radial-gradient(circle at 30px 0, transparent 26px, #2f8fe0 27px) 0 0 / 60px 100%; border-top:0; animation:ad-waves 1.4s linear infinite; opacity:.95; }
  .ad-sail .waves::before { content:""; position:absolute; left:0; right:0; top:0; height:10px; background:radial-gradient(circle at 30px -14px, transparent 28px, #fff 29px 34px, transparent 35px) 0 0 / 60px 20px; }
  .ad-sail .waves.b { height:14%; z-index:5; animation-duration:1s; filter:brightness(.85); }
  .ad-sail .say { position:absolute; left:50%; top:6%; transform:translateX(-50%); z-index:6; font-size:clamp(1.8rem, 8vw, 3rem); line-height:1; text-align:center; white-space:pre-line; color:#fff;
    -webkit-text-stroke:2px #111; paint-order:stroke fill; text-shadow:0 5px 0 #111; animation:ad-say .6s cubic-bezier(.2,1.8,.4,1) both; }
  @keyframes ad-bob { from { transform:translateY(0) rotate(-4deg); } to { transform:translateY(-6%) rotate(4deg); } }
  @keyframes ad-billow { to { transform:scaleX(.92); } }
  @keyframes ad-flap { to { transform:scaleY(.6); } }
  @keyframes ad-waves { to { transform:translateX(-60px); } }
  @keyframes ad-gull { to { transform:translate(30px, -10px); } }
  @keyframes ad-say { from { transform:translateX(-50%) scale(.3); opacity:0; } }
  @media (prefers-reduced-motion: reduce) { .ad-sail * { animation:none !important; } }
  @keyframes ad-pulse { from { transform:scale(1); box-shadow:0 6px 0 #111, 0 0 0 0 rgba(255,212,0,.9); } to { transform:scale(1.1); box-shadow:0 6px 0 #111, 0 0 0 12px rgba(255,212,0,.25); } }
  /* 🏪 the item shop */
  .ad-shop { position:absolute; z-index:3; width:calc(var(--nz) * 1.15); height:calc(var(--nz) * 1.15); transform:translate(-50%, -50%); border:4px solid #111; border-radius:18px;
    background:repeating-linear-gradient(90deg, #ff5a5a 0 12px, #fff 12px 24px) top / 100% 34% no-repeat, #ffe9a8; box-shadow:0 5px 0 #111; cursor:pointer; padding:0; display:flex; align-items:flex-end; justify-content:center; }
  .ad-shop .aw { font-size:calc(var(--nz) * .62); line-height:1; margin-bottom:4px; }
  .ad-shop:not(.locked) { animation:ad-shopb 1s ease-in-out infinite alternate; }
  .ad-shop.locked { filter:grayscale(1) brightness(.75); }
  @keyframes ad-shopb { to { transform:translate(-50%, -50%) scale(1.08) rotate(3deg); } }
  .ad-shopwin { position:absolute; inset:0; z-index:20; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,.55); padding:10px; }
  .ad-shopwin .box { position:relative; width:min(560px, 100%); max-height:100%; overflow:auto; background:#fff3cf; border:6px solid #111; border-radius:24px; box-shadow:0 8px 0 #111;
    display:flex; flex-direction:column; align-items:center; gap:8px; padding:0 12px 14px; animation:ad-shopin .4s cubic-bezier(.2,1.6,.4,1); }
  .ad-shopwin .awn { align-self:stretch; height:26px; margin:0 -12px; background:repeating-linear-gradient(90deg, #ff5a5a 0 26px, #fff 26px 52px); border-bottom:4px solid #111;
    border-radius:18px 18px 0 0; -webkit-mask:radial-gradient(circle at 13px 26px, transparent 0, #000 0); }
  .ad-shopwin .keeper { position:relative; width:96px; height:92px; margin-top:4px; }
  .ad-shopwin .keeper .hd { position:absolute; left:8px; top:0; width:80px; height:76px; border-radius:50% 50% 46% 46%; background:#5fd07a; border:4px solid #111; }
  .ad-shopwin .keeper .hd i { position:absolute; top:14px; width:24px; height:24px; border-radius:50%; background:#fff; border:3px solid #111; }
  .ad-shopwin .keeper .hd i::after { content:""; position:absolute; width:10px; height:10px; border-radius:50%; background:#111; left:7px; top:8px; animation:ad-look 2.4s ease-in-out infinite; }
  .ad-shopwin .keeper .hd i:first-child { left:8px; } .ad-shopwin .keeper .hd i:nth-child(2) { right:6px; width:28px; height:28px; top:10px; }
  .ad-shopwin .keeper .hd b { position:absolute; left:50%; top:42px; width:50px; height:16px; transform:translateX(-50%); border-radius:50% 50% 40% 40%; background:#6b3a12;
    -webkit-mask:radial-gradient(circle at 25% 100%, transparent 7px, #000 8px), radial-gradient(circle at 75% 100%, transparent 7px, #000 8px); -webkit-mask-composite:source-in; mask-composite:intersect; }
  .ad-shopwin .keeper .hd u { position:absolute; left:50%; top:58px; width:26px; height:10px; transform:translateX(-50%); border:3px solid #111; border-top:none; border-radius:0 0 14px 14px; background:#c0392b; }
  .ad-shopwin .keeper .apr { position:absolute; left:20px; top:68px; width:56px; height:24px; border:3px solid #111; border-radius:6px 6px 14px 14px;
    background:repeating-linear-gradient(90deg, #3d8bfd 0 8px, #fff 8px 16px); }
  .ad-shopwin .keeper.yay { animation:ad-yay .5s ease-out; } .ad-shopwin .keeper.no { animation:ad-no .4s ease-in-out; }
  .ad-shopwin .say { font-size:clamp(1.1rem, 5vw, 1.6rem); text-align:center; line-height:1.1; }
  .ad-shopwin .purse { font-size:clamp(1.4rem, 6vw, 2rem); background:#fff; border:4px solid #111; border-radius:16px; padding:2px 14px; }
  .ad-shopwin .mine { display:flex; gap:8px; }
  .ad-shopwin .mine .sl { width:44px; height:44px; border:3px solid #111; border-radius:50%; background:#fff; display:flex; align-items:center; justify-content:center; font-size:1.5rem; }
  .ad-shopwin .mine .sl.empty { border-style:dashed; background:rgba(255,255,255,.5); }
  .ad-shopwin .stock { display:grid; grid-template-columns:repeat(3, 1fr); gap:8px; width:100%; }
  .ad-shopwin .it { font:inherit; border:4px solid #111; border-radius:16px; background:#fff; box-shadow:0 4px 0 #111; padding:6px 4px; cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:2px; touch-action:manipulation; }
  .ad-shopwin .it .ic { font-size:2rem; line-height:1; } .ad-shopwin .it .nm { font-size:.7rem; } .ad-shopwin .it .pr { font-size:1rem; background:#ffd400; border:2px solid #111; border-radius:10px; padding:0 6px; }
  .ad-shopwin .it.no { opacity:.5; }
  .ad-shopwin .it:active { transform:translateY(3px); box-shadow:0 1px 0 #111; }
  .ad-shopwin .bye { font:inherit; font-size:1.3rem; border:4px solid #111; border-radius:16px; background:#4dd36b; color:#fff; -webkit-text-stroke:1px #111; box-shadow:0 5px 0 #111; padding:8px 22px; cursor:pointer; }
  @keyframes ad-shopin { from { transform:scale(.4); } }
  @keyframes ad-look { 50% { transform:translateX(-4px); } }
  @keyframes ad-yay { 40% { transform:translateY(-16px) rotate(-6deg); } }
  @keyframes ad-no { 25% { transform:rotate(-8deg); } 75% { transform:rotate(8deg); } }
  `;
  let cssDone = false;
  function injectCss() { if (cssDone) return; cssDone = true; const s = document.createElement("style"); s.textContent = CSS; document.head.appendChild(s); }

  const C = () => window.Core;
  const F = () => window.FrameAPI;
  const load = () => { const p = C().storage.get(KEY, null) || {}; return { ...p, stars: p.stars || {}, at: p.at, spent: p.spent || 0, shops: p.shops || {} }; }; // spent: ⭐ spent in the item shops; shops: { jungle: true } once a shop has popped up // at: the island your ship is at
  const starsOf = (p, i, j) => p.stars[`${ISLANDS[i].id}-${j}`] || 0;
  const islandOpen = (p, i) => i === 0 || starsOf(p, i - 1, LEVELS - 1) > 0;
  const levelOpen = (p, i, j) => islandOpen(p, i) && (j === 0 || starsOf(p, i, j - 1) > 0);
  // The level to play next on an island (the first not yet passed), or the boss once all are.
  const nextLevel = (p, i) => { for (let j = 0; j < LEVELS; j++) if (!starsOf(p, i, j)) return j; return LEVELS - 1; };

  let root = null, shown = 0, hop = null, quiet = false, sailTo = null;

  // The frame reports a level's stars (best kept). A first pass makes your character hop on next time.
  function record(adv, stars) {
    const p = load();
    const k = `${adv.island}-${adv.level}`;
    const before = p.stars[k] || 0;
    if (stars > before) p.stars[k] = stars;
    C().storage.set(KEY, p);
    if (!before && stars) hop = { island: adv.island, from: adv.level };
    // A boss beaten for the first time: next time the map opens, you sail to the next island.
    const i = ISLANDS.findIndex((x) => x.id === adv.island);
    if (adv.level === LEVELS - 1 && !before && stars && i + 1 < ISLANDS.length) sailTo = i + 1;
  }

  // opts.sail: start with the ship sailing to the island (starting Adventure from the title menu).
  function open(islandId, opts = {}) {
    injectCss();
    if (!root) { root = document.createElement("div"); root.id = "adventure"; document.body.appendChild(root); }
    root.hidden = false;
    F().hideAll();
    if (window.Music) Music.play("menu");
    const p = load();
    // Show the island just played, else the furthest one that's open.
    // A boss just beaten: the world map, and the ship sets off to the next island by itself.
    if (sailTo != null) { const t = sailTo; sailTo = null; world({ autoTo: t }); return; }
    // From the title menu: the world map.
    if (!islandId) { world({}); return; }
    let i = ISLANDS.findIndex((x) => x.id === (islandId || (hop && hop.island)));
    if (i < 0) i = 0;
    shown = i;
    if (opts.sail) sail(i, render); else render();
    void p;
  }

  // 🌍 THE WORLD MAP (the teacher's idea): the sea with all the islands on a dotted route, your character on
  // their ship beside the island they're at. Tap an open island: the ship sails there, then the close-up
  // SAILING TO… scene, then that island's map. Locked islands are grey under clouds with a 🔒.
  const WORLD = [[16, 74], [42, 56], [76, 70], [70, 26], [30, 24]]; // % positions, in route order
  function world(opts) {
    const p = load();
    let at = typeof p.at === "number" && islandOpen(p, p.at) ? p.at : 0;
    if (typeof p.at !== "number") { while (at + 1 < ISLANDS.length && islandOpen(p, at + 1)) at++; }
    F().setTheme(1);
    root.innerHTML = "";
    const top = document.createElement("div");
    top.className = "ad-top";
    const x = document.createElement("button"); x.className = "ad-x"; x.textContent = "✕"; x.setAttribute("aria-label", "Back");
    x.addEventListener("click", close);
    const title = document.createElement("div"); title.className = "ad-title";
    title.innerHTML = '<div class="nm shout"></div>';
    title.firstChild.textContent = TEXT.worldTitle;
    let total = 0;
    ISLANDS.forEach((_, a) => { for (let j = 0; j < LEVELS; j++) total += Math.min(3, starsOf(p, a, j)); });
    const tot = document.createElement("div"); tot.className = "ad-total shout"; tot.textContent = TEXT.stars(total, ISLANDS.length * LEVELS * 3);
    top.append(x, title, tot);
    const sea = document.createElement("div");
    sea.className = "aw-sea";
    root.append(top, sea);
    const W = sea.clientWidth, H = sea.clientHeight;
    const iz = Math.max(70, Math.min(W * 0.2, H * 0.26, 150));
    sea.style.setProperty("--iz", `${iz}px`);
    const pt = (k) => ({ x: (WORLD[k][0] / 100) * W, y: (WORLD[k][1] / 100) * H });
    // The sea route between the islands.
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "ad-path");
    let d = `M${pt(0).x} ${pt(0).y}`;
    for (let k = 1; k < ISLANDS.length; k++) { const a = pt(k - 1), b = pt(k); d += ` Q${(a.x + b.x) / 2} ${(a.y + b.y) / 2 + (k % 2 ? 50 : -50)} ${b.x} ${b.y}`; }
    svg.innerHTML = `<path d="${d}" fill="none" stroke="#fff" stroke-width="7" stroke-dasharray="4 16" stroke-linecap="round" opacity=".85"/>`;
    sea.appendChild(svg);
    ["🐟", "🐳", "⛵", "🐙", "🦈"].forEach((e, k) => {
      const f = document.createElement("div"); f.className = "ad-deco aw-fish"; f.textContent = e;
      f.style.left = `${[55, 90, 8, 48, 92][k]}%`; f.style.top = `${[88, 46, 38, 12, 90][k]}%`;
      f.style.animationDelay = `${-k * 0.7}s`;
      sea.appendChild(f);
    });
    ISLANDS.forEach((isl, k) => {
      const open = islandOpen(p, k);
      let s = 0;
      for (let j = 0; j < LEVELS; j++) s += Math.min(3, starsOf(p, k, j));
      const b = document.createElement("button");
      b.className = "aw-isle" + (open ? "" : " locked") + (starsOf(p, k, LEVELS - 1) ? " beaten" : "");
      b.style.setProperty("--g1", isl.bg[0]); b.style.setProperty("--g2", isl.bg[1]);
      const c = pt(k);
      b.style.left = `${c.x}px`; b.style.top = `${c.y}px`;
      b.innerHTML = `<div class="land"></div><div class="ic"></div><div class="lbl shout"></div><div class="st"></div>${open ? "" : '<div class="lock">☁️🔒☁️</div>'}` +
        (starsOf(p, k, LEVELS - 1) ? '<div class="crown">👑</div>' : "");
      b.querySelector(".ic").textContent = isl.icon;
      b.querySelector(".lbl").textContent = isl.name;
      b.querySelector(".st").textContent = open ? `⭐ ${s}` : "";
      b.setAttribute("aria-label", open ? isl.name : `${isl.name}, locked`);
      b.addEventListener("click", () => {
        C().unlock();
        if (!open) { C().sfx.tone(200, 0.1, "square", 0.08); b.animate([{ rotate: "0deg" }, { rotate: "-6deg" }, { rotate: "6deg" }, { rotate: "0deg" }], { duration: 300 }); return; }
        go(k);
      });
      sea.appendChild(b);
    });
    // Your ship, moored beside the island you're at.
    const ship = document.createElement("div");
    ship.className = "aw-ship";
    ship.innerHTML = '<div class="sail"></div><div class="me"></div><div class="hull"></div>';
    ship.querySelector(".me").appendChild(window.Mascot.el("var(--mez)"));
    sea.appendChild(ship);
    const dock = (k) => { const c = pt(k); return { x: c.x - iz * 0.75, y: c.y + iz * 0.3 }; };
    const place = (q) => { ship.style.transform = `translate(${q.x}px, ${q.y}px)`; };
    place(dock(at));
    let busy = false;
    function go(k) {
      if (busy) return;
      busy = true;
      const q = load();
      q.at = k;
      C().storage.set(KEY, { ...q, at: k });
      if (k === at) { shown = k; render(); return; } // already docked there: straight to the island (no sailing again)
      // Sail along the route to the island, then the close-up.
      const a = dock(at), b = dock(k);
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 + 40 };
      ship.classList.add("go");
      ship.animate([{ transform: `translate(${a.x}px, ${a.y}px)` }, { transform: `translate(${mid.x}px, ${mid.y}px)`, offset: 0.5 }, { transform: `translate(${b.x}px, ${b.y}px)` }],
        { duration: reduce() ? 1 : 1600, easing: "ease-in-out", fill: "forwards" });
      C().sfx.tone(196, 0.3, "square", 0.08); C().sfx.tone(196, 0.3, "square", 0.08, 0.35); // toot toot
      for (let n = 0; n < 2; n++) C().sfx.noise(0.8, "lowpass", 600, 300, 0.22, n * 0.8);
      setTimeout(() => { at = k; place(b); sail(k, () => { shown = k; render(); }); }, reduce() ? 20 : 1700);
    }
    if (opts.autoTo != null) setTimeout(() => { if (root.contains(ship)) go(opts.autoTo); }, 900);
    C().say(TEXT.worldSay);
  }

  // ⛵ Your character on a little sailing ship, bobbing over the waves towards the island as it grows on the
  // horizon (the teacher's idea); then the map. A tap skips it.
  function sail(i, then) {
    const isl = ISLANDS[i];
    F().setTheme(1);
    root.innerHTML = "";
    const sc = document.createElement("div");
    sc.className = "ad-sail";
    sc.innerHTML = `<div class="sun"></div><div class="gull">🐦</div><div class="isle"><div class="mound"></div><div class="ic"></div></div>` +
      `<div class="ship"><div class="mast"></div><div class="sail"></div><div class="flag"></div><div class="me"></div><div class="hull"></div></div>` +
      `<div class="waves"></div><div class="waves b"></div><div class="say shout"></div>`;
    sc.querySelector(".ic").textContent = isl.icon;
    sc.querySelector(".say").textContent = TEXT.sailing(isl.name);
    const me = window.Mascot.el("var(--mez)");
    window.Mascot.mood(me, "cheer");
    sc.querySelector(".me").appendChild(me);
    root.appendChild(sc);
    const isle = sc.querySelector(".isle"), ship = sc.querySelector(".ship");
    const ms = reduce() ? 1 : 3600;
    isle.animate([{ transform: "translate(-50%, -100%) scale(.25)" }, { transform: "translate(-50%, -100%) scale(1)" }], { duration: ms, easing: "ease-in", fill: "forwards" });
    ship.animate([{ left: "-30%" }, { left: "32%" }], { duration: ms, easing: "ease-out", fill: "forwards" });
    const { tone, noise, sweep } = C().sfx;
    [0, 0.35].forEach((t) => tone(196, 0.3, "square", 0.08, t)); // toot toot!
    for (let k = 0; k < 4; k++) noise(0.8, "lowpass", 600, 300, 0.25, k * 0.9); // whoosh of the waves
    sweep(1800, 2400, 0.15, "sine", 0.05, 1.2); sweep(2200, 1700, 0.15, "sine", 0.05, 1.4); // a gull
    C().say(TEXT.sailing(isl.name).replace("\n", " ").toLowerCase());
    let left = false;
    const go = () => { if (left) return; left = true; clearTimeout(t); sc.removeEventListener("pointerdown", go); tone(523, 0.1, "triangle", 0.1); tone(784, 0.14, "triangle", 0.1, 0.1); then(); };
    const t = setTimeout(go, ms + 700);
    sc.addEventListener("pointerdown", go);
  }
  const reduce = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function close() {
    if (root) { root.hidden = true; root.innerHTML = ""; }
    F().goTitle();
  }

  function render() {
    const p = load(), i = shown, isl = ISLANDS[i];
    const B = window.Boss.BOSSES[isl.boss];
    root.innerHTML = "";
    F().setTheme(i + 1);
    // Top bar: ✕, ◀ island ▶, total stars.
    const top = document.createElement("div");
    top.className = "ad-top";
    const x = document.createElement("button"); x.className = "ad-x"; x.textContent = "✕"; x.setAttribute("aria-label", "Back");
    x.addEventListener("click", () => { C().unlock(); world({}); }); // (back to the world map)
    const title = document.createElement("div"); title.className = "ad-title";
    const prev = document.createElement("button"); prev.className = "ad-arrow"; prev.textContent = "◀"; prev.disabled = i === 0;
    const next = document.createElement("button"); next.className = "ad-arrow"; next.textContent = "▶"; next.disabled = i === ISLANDS.length - 1;
    prev.addEventListener("click", () => { C().unlock(); shown = Math.max(0, i - 1); hop = null; render(); });
    next.addEventListener("click", () => { C().unlock(); shown = Math.min(ISLANDS.length - 1, i + 1); hop = null; render(); });
    const nm = document.createElement("div"); nm.className = "nm shout"; nm.textContent = `${isl.icon} ${isl.name}`;
    title.append(nm); // (islands are chosen on the world map now)
    void prev; void next;
    let total = 0;
    ISLANDS.forEach((_, a) => { for (let j = 0; j < LEVELS; j++) total += Math.min(3, starsOf(p, a, j)); });
    const tot = document.createElement("div"); tot.className = "ad-total shout"; tot.textContent = TEXT.stars(total, ISLANDS.length * LEVELS * 3);
    top.append(x, title, tot);

    // The map: decorations, the dotted path, the level buttons, the boss, and you.
    const map = document.createElement("div");
    map.className = "ad-map";
    map.style.setProperty("--b1", isl.bg[0]); map.style.setProperty("--b2", isl.bg[1]);
    root.append(top, map);
    const W = map.clientWidth, H = map.clientHeight;
    const nz = Math.max(48, Math.min(W * 0.14, H * 0.1, 76));
    map.style.setProperty("--nz", `${nz}px`);
    map.style.setProperty("--bz", `${nz * 1.7}px`);
    [[8, 12], [88, 22], [10, 62], [86, 46], [70, 90], [36, 18], [90, 84], [8, 96]].forEach(([dx, dy], k) => {
      const d = document.createElement("div"); d.className = "ad-deco"; d.textContent = isl.deco[k % isl.deco.length];
      d.style.left = `${dx}%`; d.style.top = `${dy}%`;
      map.appendChild(d);
    });
    const pt = (j) => ({ x: (SPOTS[j][0] / 100) * W, y: (SPOTS[j][1] / 100) * H });
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "ad-path");
    let d = `M${pt(0).x} ${pt(0).y}`;
    for (let j = 1; j < LEVELS; j++) { const a = pt(j - 1), b = pt(j); d += ` Q${(a.x + b.x) / 2 + (j % 2 ? 40 : -40)} ${(a.y + b.y) / 2} ${b.x} ${b.y}`; }
    svg.innerHTML = `<path d="${d}" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="16" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#fff8d6" stroke-width="9" stroke-dasharray="2 18" stroke-linecap="round"/>`;
    map.appendChild(svg);
    const nextJ = nextLevel(p, i);
    for (let j = 0; j < LEVELS; j++) {
      const isBoss = j === LEVELS - 1;
      const open = levelOpen(p, i, j), s = starsOf(p, i, j);
      const n = document.createElement("button");
      n.className = "ad-node" + (isBoss ? " ad-boss" : "") + (!open ? " locked" : s ? " done" : j === nextJ ? " next" : "");
      const at = pt(j);
      n.style.left = `${at.x}px`; n.style.top = `${at.y}px`;
      if (isBoss) {
        n.appendChild(window.Boss.el(isl.boss, nz * 1.5));
        if (!open) n.classList.add("dark");
        if (s) n.insertAdjacentHTML("beforeend", '<span class="crown">👑</span>');
        n.setAttribute("aria-label", open ? B.name : "Locked boss");
      } else {
        n.textContent = open ? j + 1 : "🔒";
        if (open) n.insertAdjacentHTML("beforeend", `<span class="st">${"★".repeat(s)}<i>${"★".repeat(3 - s)}</i></span>`);
        n.setAttribute("aria-label", `Level ${j + 1}${open ? `, ${s} stars` : ", locked"}`);
      }
      n.addEventListener("click", () => {
        C().unlock();
        if (!open || !islandOpen(p, i)) { C().sfx.tone(200, 0.1, "square", 0.08); return; }
        hop = null;
        root.hidden = true;
        play(advFor(i, j));
      });
      map.appendChild(n);
    }
    // You: on the next level (hopping there from the one just passed).
    const me = document.createElement("div");
    me.className = "ad-me";
    const mz = nz * 1.1;
    me.style.setProperty("--mz", `${mz}px`);
    const fig = window.Mascot.el(mz);
    me.appendChild(fig);
    map.appendChild(me);
    const place = (j) => { const a = pt(j); me.style.transform = `translate(${a.x}px, ${a.y - nz * 0.35}px)`; };
    if (hop && hop.island === isl.id && hop.from < LEVELS - 1 && islandOpen(p, i)) {
      const from = hop.from, to = Math.min(from + 1, LEVELS - 1);
      place(from);
      hop = null;
      window.Mascot.mood(fig, "cheer");
      const a = pt(from), b = pt(to);
      setTimeout(() => {
        me.animate([{ transform: `translate(${a.x}px, ${a.y - nz * 0.35}px)` }, { transform: `translate(${(a.x + b.x) / 2}px, ${Math.min(a.y, b.y) - nz * 1.4}px)`, offset: 0.5 },
          { transform: `translate(${b.x}px, ${b.y - nz * 0.35}px)` }], { duration: 650, easing: "ease-in-out", fill: "forwards" });
        C().sfx.sweep(300, 900, 0.3, "triangle", 0.1);
        setTimeout(() => { place(to); window.Mascot.mood(fig, null); C().sfx.tone(880, 0.1, "triangle", 0.1); }, 660);
      }, 500);
    } else place(islandOpen(p, i) ? nextJ : 0);
    // A locked island: which boss to beat first.
    if (!islandOpen(p, i)) {
      const lock = document.createElement("div");
      lock.className = "ad-lock";
      lock.innerHTML = "<span></span>";
      lock.firstChild.textContent = TEXT.locked(window.Boss.BOSSES[ISLANDS[i - 1].boss].name);
      map.appendChild(lock);
    }
    // 🏪 THE ITEM SHOP (the teacher's idea), halfway along the path (between levels 4 and 5): it opens once
    // level 4 is passed, pops up by itself the first time, and can be tapped any time after that.
    const shopOpen = starsOf(p, i, SHOP_AFTER) > 0 && islandOpen(p, i);
    const sh = document.createElement("button");
    sh.className = "ad-shop" + (shopOpen ? "" : " locked");
    sh.style.left = `${(SHOP_AT[0] / 100) * W}px`; sh.style.top = `${(SHOP_AT[1] / 100) * H}px`;
    sh.innerHTML = '<span class="aw">🏪</span>';
    sh.setAttribute("aria-label", shopOpen ? "Item shop" : "Item shop, locked");
    sh.addEventListener("click", () => { C().unlock(); if (!shopOpen) { C().sfx.tone(200, 0.1, "square", 0.08); return; } shop(isl); });
    map.appendChild(sh);
    if (shopOpen && !p.shops[isl.id] && window.Items && window.Items.on()) {
      const q = load(); q.shops[isl.id] = true; C().storage.set(KEY, q);
      setTimeout(() => { if (root && !root.hidden && shown === i) shop(isl, true); }, hop ? 1500 : 500);
    }
    if (!quiet) C().say(TEXT.say(isl.name));
  }

  // 🏪 The shop: a silly shopkeeper (an original: a round green monster in a striped apron with a curly moustache
  // and googly eyes) behind a counter of items with ⭐ prices. Stars come from every star earned in Adventure,
  // less what's been spent (`spent`); an item goes into your 3 item slots (js/items.js), used in Adventure levels
  // and island boss battles. Shield and Continue work in island boss battles (they have hearts).
  const SHOP_AFTER = 3;                  // the shop opens once level 4 (index 3) is passed
  const SHOP_AT = [40, 63];              // where it stands on the map (%), beside the path between levels 4 and 5
  const STOCK = [["time", 2], ["slow", 2], ["reroll", 2], ["fifty", 3], ["shield", 3], ["glow", 4]];
  const wallet = (p) => {
    let n = 0;
    ISLANDS.forEach((_, a) => { for (let j = 0; j < LEVELS; j++) n += Math.min(3, starsOf(p, a, j)); });
    return Math.max(0, n - (p.spent || 0));
  };
  function shop(isl, first) {
    const I = window.Items;
    if (!I) return;
    const w = document.createElement("div");
    w.className = "ad-shopwin";
    w.innerHTML = `<div class="box"><div class="awn"></div><div class="keeper"><div class="hd"><i></i><i></i><b></b><u></u></div><div class="apr"></div></div>
      <div class="say shout"></div><div class="purse shout"></div><div class="mine"></div><div class="stock"></div><button class="bye">BYE BYE! 👋</button></div>`;
    root.appendChild(w);
    const say = w.querySelector(".say"), purse = w.querySelector(".purse"), mine = w.querySelector(".mine"), stock = w.querySelector(".stock");
    const keeper = w.querySelector(".keeper");
    const line = (t, spoken) => { say.textContent = t; if (spoken) C().say(spoken); };
    const draw = () => {
      const p = load(), money = wallet(p), slots = I.slots();
      purse.textContent = `⭐ ${money}`;
      mine.innerHTML = "";
      for (let k = 0; k < I.SLOTS; k++) {
        const d = I.ITEMS[slots[k]], s = document.createElement("span");
        s.className = "sl" + (d ? "" : " empty"); s.textContent = d ? d.icon : "";
        mine.appendChild(s);
      }
      stock.innerHTML = "";
      STOCK.forEach(([id, price]) => {
        const d = I.ITEMS[id], b = document.createElement("button");
        const can = money >= price && !I.full();
        b.className = "it" + (can ? "" : " no");
        b.innerHTML = `<span class="ic">${d.icon}</span><span class="nm">${d.name}</span><span class="pr">⭐ ${price}</span>`;
        b.addEventListener("click", () => {
          C().unlock();
          if (I.full()) { line("Your bag is full!", "Your bag is full!"); C().sfx.tone(200, 0.1, "square", 0.08); keeper.classList.remove("no"); void keeper.offsetWidth; keeper.classList.add("no"); return; }
          if (price > wallet(load())) { line("Not enough stars!", "Not enough stars!"); C().sfx.tone(200, 0.1, "square", 0.08); keeper.classList.remove("no"); void keeper.offsetWidth; keeper.classList.add("no"); return; }
          const q = load(); q.spent = (q.spent || 0) + price; C().storage.set(KEY, q);
          const s = I.slots(); s.push(id); C().storage.set("wwe.items", s);
          line(`${d.icon} ${d.name}! THANK YOU!`, `${d.say} Thank you!`);
          [523, 659, 784, 1047].forEach((f, k) => C().sfx.tone(f, 0.09, "triangle", 0.09, k * 0.06));
          C().sfx.noise(0.15, "highpass", 3000, 2000, 0.25); // ka-ching
          keeper.classList.remove("yay"); void keeper.offsetWidth; keeper.classList.add("yay");
          draw();
        });
        stock.appendChild(b);
      });
    };
    draw();
    line(first ? "WELCOME TO MY SHOP!" : "HELLO AGAIN!", first ? "Welcome to my shop! Spend your stars!" : "Hello again!");
    C().sfx.tone(988, 0.12, "triangle", 0.09); C().sfx.tone(1319, 0.2, "triangle", 0.09, 0.12); // ding-dong
    w.querySelector(".bye").addEventListener("click", () => { C().unlock(); C().say("Bye bye!"); w.remove(); });
    void isl;
  }

  // Turning the iPad redraws the map.
  window.addEventListener("resize", () => { if (root && !root.hidden && root.querySelector(".ad-map")) { /* (not mid-sail) */ const h = hop; hop = null; quiet = true; render(); quiet = false; hop = h; } });
  // A level to play (the boss level is the last), and playing it.
  function advFor(i, j) {
    const isl = ISLANDS[i], isBoss = j === LEVELS - 1;
    return { island: isl.id, level: j, games: isl.games, speed: SPEEDS[Math.min(j, SPEEDS.length - 1)], boss: isBoss ? isl.boss : null };
  }
  function play(adv) { if (adv.boss) F().playBoss(adv); else F().playLevel(adv); }
  // ▶ NEXT on the results screen (the teacher asked for it): the level after `adv` if it's open now, else null.
  // Not straight past level 4 the first time, so the item shop still gets to pop up on the map.
  function nextOf(adv) {
    if (!adv) return null;
    const p = load(), i = ISLANDS.findIndex((x) => x.id === adv.island), j = adv.level + 1;
    if (i < 0 || j >= LEVELS || !levelOpen(p, i, j)) return null;
    if (adv.level === SHOP_AFTER && !p.shops[adv.island] && window.Items && window.Items.on()) return null;
    return advFor(i, j);
  }
  function playNext(adv) { const n = nextOf(adv); if (!n) return false; hop = null; play(n); return true; }
  // Islands whose boss the active player has beaten (the V–Z characters: js/mascot.js).
  function beaten() { const p = load(); return ISLANDS.filter((_, i) => starsOf(p, i, LEVELS - 1) > 0).map((x) => x.id); }
  window.Adventure = { open, close, record, beaten, nextOf, playNext, ISLANDS };
})();
