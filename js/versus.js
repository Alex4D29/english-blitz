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
    splash: "SPLASH!",
    wins: (n) => `PLAYER ${n}\nWINS!`,
    again: "🔁 PLAY AGAIN",
    menu: "🏠 MENU",
    quit: "Quit",
    say: { go: "Ready? Go!", point: (n) => `Point for player ${n}!`, win: (n) => `Player ${n} wins!` },
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
  function open() {
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
    const h = el("h1", "shout"); h.textContent = TEXT.setup;
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
    const go = el("button", "chunky vs-go"); go.textContent = TEXT.fight;
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
    box.append(h, pickers, goals, go, back);
    r.appendChild(box);
  }

  // ---------- The match ----------
  function startMatch() {
    const r = shell();
    match = { score: [0, 0], round: 0, played: new Set(), token: 0, timers: [], rafs: [], sides: null, over: false };
    const top = el("div", "vs-top");
    const quit = el("button", "vs-quit"); quit.textContent = "✕"; quit.setAttribute("aria-label", TEXT.quit);
    quit.addEventListener("click", close);
    const score = el("div", "vs-score");
    score.innerHTML = '<span class="f0"></span><span class="n s0">0</span><span class="vs shout">VS</span><span class="n s1">0</span><span class="f1"></span>';
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
    if (SHARED[game.id]) { SHARED[game.id](game, list, alive); return; } // (a shared-screen versus game)
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
    later(nextRound, 1900);
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

  window.Versus = { open, close, SKIP: VERSUS_SKIP };
})();
