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

  function endRound(all) {
    if (!match) return;
    cancelAnimationFrame(match.raf);
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
