// The shared frame: screens, the round loop (transition → game → feedback),
// the timer bar, lives/progress HUD, results and high score.
// Microgames only render into #game and call ctx.win()/ctx.lose().
//
// Test options: ?game=wire-cut  (only play that game)   ?list=cvc-short-a  (word list)
(function () {
  "use strict";
  const C = window.Core;
  const T = window.TEXT;

  const BASE_MS = 5000;         // time limit for games that don't declare `duration`
  const START_DELAY_MS = 500;
  const SPEEDUP_MS = 1100;
  const ROUND_MS = 700;
  const INSTRUCTION_MS = 1300;  // long enough to see the TAP! / DRAG! hint move
  const COACH_MS = 2400;        // how long ctx.hint's in-game TAP! / DRAG! stays up
  const STAMP_DELAY_MS = 250;   // let the game's own win/lose effect land first
  const FEEDBACK_MS = 1400;
  const SPEECH_WAIT_MS = 2500;  // max extra wait for speech to finish after feedback
  const END_MS = 1500;
  const CONTENT_TYPES = ["letter", "phonics", "cvc", "hfw"];   // content picker order
  const DEFAULT_TYPES = ["letter", "phonics"];
  const TYPES_KEY = "wwe.content.v2";                // localStorage: the last ticked types
  const OLD_TYPES_KEY = "wwe.content";               // before PHONICS split off from ABC
  const THEMES = [
    ["#ffd400", "#ffb800"], ["#00d4ff", "#00b4f0"], ["#ff6fb0", "#ff4f9a"],
    ["#7cf04f", "#5fd932"], ["#ff9a1f", "#ff7f00"], ["#b388ff", "#9c6bff"],
  ];

  const params = new URLSearchParams(location.search);
  const onlyGame = params.get("game");
  const listParam = params.get("list"); // skips the content picker

  function loadTypes() {
    let saved = C.storage.get(TYPES_KEY, null);
    if (!Array.isArray(saved)) {
      // ABC used to include the picture games, so anyone who had it ticked gets PHONICS too.
      const old = C.storage.get(OLD_TYPES_KEY, null);
      if (Array.isArray(old)) saved = old.includes("letter") ? [...old, "phonics"] : old;
    }
    const ok = Array.isArray(saved) ? saved.filter((t) => CONTENT_TYPES.includes(t)) : [];
    return ok.length ? ok : [...DEFAULT_TYPES];
  }

  const $ = (s) => document.querySelector(s);
  const els = {
    title: $("#title"), settings: $("#settings"), play: $("#play"), results: $("#results"),
    practice: $("#practice"), howto: $("#howto"), content: $("#content"),
    contentGrid: $("#contentGrid"), contentGoBtn: $("#contentGoBtn"), contentBackBtn: $("#contentBackBtn"),
    funBtn: $("#funBtn"), challengeBtn: $("#challengeBtn"), practiceBtn: $("#practiceBtn"),
    settingsBtn: $("#settingsBtn"), loading: $("#loading"),
    backBtn: $("#backBtn"), quitBtn: $("#quitBtn"), helpBtn: $("#helpBtn"),
    practiceGrid: $("#practiceGrid"), practiceBackBtn: $("#practiceBackBtn"),
    howtoIcon: $("#howtoIcon"), howtoName: $("#howtoName"), howtoSteps: $("#howtoSteps"),
    howtoTipsBox: $("#howtoTipsBox"), howtoTips: $("#howtoTips"),
    howtoPlayBtn: $("#howtoPlayBtn"), howtoBackBtn: $("#howtoBackBtn"),
    status: $("#status"), roundPill: $("#roundPill"), bar: $("#bar"),
    game: $("#game"), banner: $("#banner"), stamp: $("#stamp"), hint: $("#banner .hint"),
    resTitle: $("#resTitle"), stars: $("#stars"), resStats: $("#resStats"), record: $("#record"),
    againBtn: $("#againBtn"), menuBtn: $("#menuBtn"),
  };

  const state = {
    screen: "title",
    mode: null,
    practiceGame: null,         // the game Practice mode is playing
    types: loadTypes(),         // content types ticked on the picker: "letter", "phonics", "cvc", "hfw"
    pendingMode: null,          // the mode button pressed before the content picker
    phase: "idle",              // idle | transition | playing | feedback | over | paused
    round: 0,
    lives: 0,
    speed: 1,
    results: [],
    lastGame: null,
    broken: new Set(),          // games that threw on start; skipped for this session
    theme: 0,
    // current game
    token: 0,                   // bumps whenever a game starts or ends; stale ctx calls are ignored
    reported: true,
    gameActive: false,
    current: null,              // { game, timeLimit, t0, onTimeout }
    cleanup: null,
    timerRaf: 0,
    // tracked timers
    timers: [],                 // frame's own (transitions, feedback)
    gameTimers: [],             // ctx.later
    gameRafs: [],               // ctx.raf
    coach: null,                // the in-game TAP! / DRAG! element (ctx.hint)
  };

  // ---------- Static text ----------
  document.querySelectorAll("[data-text]").forEach((el) => {
    const v = T[el.dataset.text];
    if (typeof v === "string") el.textContent = v;
  });
  document.querySelectorAll("[data-label]").forEach((el) => {
    const v = T[el.dataset.label];
    if (typeof v === "string") el.setAttribute("aria-label", v);
  });

  // ---------- Small helpers ----------
  function guard(label, fn, arg) {
    try { fn(arg); } catch (err) { console.error(`${label}:`, err); }
  }
  function later(fn, ms) {
    state.timers.push(setTimeout(() => guard("frame", fn), ms));
  }
  function showScreen(name) {
    ["title", "settings", "content", "practice", "howto", "play", "results"].forEach((n) => { els[n].hidden = n !== name; });
    state.screen = name;
    if (name !== "play") els[name].scrollTop = 0;
  }
  function restartAnim(el) {
    el.style.animation = "none";
    void el.offsetWidth;
    el.style.animation = "";
  }
  function shout(el, text, cls) {
    const inner = el.querySelector(".shout");
    inner.textContent = text;
    el.className = cls || "";
    el.hidden = false;
    restartAnim(inner);
  }
  function setBar(f) {
    els.bar.style.transform = `scaleX(${Math.max(0, Math.min(1, f))})`;
    els.bar.classList.toggle("mid", f <= 0.6 && f > 0.3);
    els.bar.classList.toggle("low", f <= 0.3);
  }
  function setTheme(i) {
    state.theme = i % THEMES.length;
    const [a, b] = THEMES[state.theme];
    document.documentElement.style.setProperty("--bg", a);
    document.documentElement.style.setProperty("--bg2", b);
    document.querySelector('meta[name="theme-color"]').content = a;
  }
  function vibrate(pattern) {
    try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (err) { /* optional */ }
  }

  // ---------- Choosing what to play ----------
  // The lists in play: the ?list= one when given, otherwise one list per type ticked on the content picker.
  function listsInPlay() {
    const lists = window.WORD_LISTS || [];
    if (listParam) return lists.filter((l) => l.id === listParam);
    return CONTENT_TYPES.filter((t) => state.types.includes(t))
      .map((t) => lists.find((l) => l.type === t)).filter(Boolean);
  }
  function listsFor(game) {
    const types = game.contentTypes || [];
    return listsInPlay().filter((l) => types.includes(l.type));
  }
  const isPractice = () => !!state.mode && state.mode.id === "practice";
  // Pick the content type first, so each ticked type comes up about equally often,
  // then a game that can use it (never the same game twice in a row when there's a choice).
  function chooseRound() {
    const only = isPractice() ? state.practiceGame : onlyGame;
    const usable = (g) => (!only || g.id === only) && !state.broken.has(g.id);
    const gamesFor = (list) => C.MICROGAMES.filter((g) => usable(g) && (g.contentTypes || []).includes(list.type));
    const lists = listsInPlay().filter((l) => gamesFor(l).length);
    if (!lists.length) return null;
    const list = C.pick(lists);
    const playable = gamesFor(list);
    const fresh = playable.filter((g) => g.id !== state.lastGame);
    const game = C.pick(fresh.length ? fresh : playable);
    state.lastGame = game.id;
    return { game, list };
  }
  function instructionFor(game, list) {
    const ins = typeof game.instruction === "function" ? game.instruction(list) : game.instruction;
    return (ins && ins.en) || "";
  }
  function nameFor(game) {
    return (game.name && game.name.en) || game.id;
  }
  // { steps: [[icon, text], …], tips: [text, …] } or null if the game has none.
  function howToFor(game, list) {
    const h = typeof game.howTo === "function" ? game.howTo(list) : game.howTo;
    return (h && h.en) || null;
  }
  // Challenge warm-up: the first rounds get a long, fixed time limit at 1×,
  // and the normal speed-ups only start counting after them.
  function warmupRounds() {
    return (state.mode.warmup || []).reduce((n, w) => n + w.games, 0);
  }
  function warmupMsFor(round) {
    let n = 0;
    for (const w of state.mode.warmup || []) {
      n += w.games;
      if (round <= n) return w.ms;
    }
    return 0;
  }
  function speedFor(round) {
    const m = state.mode;
    if (!m.speedUpEvery) return 1;
    const r = round - warmupRounds();
    if (r < 1) return 1;
    return Math.min(m.maxSpeed, 1 + Math.floor((r - 1) / m.speedUpEvery) * m.speedStep);
  }
  // The TAP! / DRAG! hint under the instruction, from the game's `input`.
  function setHint(game) {
    const kind = T.input[game.input] ? game.input : "";   // "tap", "drag" or "slice"
    els.hint.hidden = !kind;
    if (!kind) return;
    els.hint.className = "hint " + kind;
    els.hint.querySelector(".hint-icon").textContent = T.inputIcon;
    els.hint.querySelector(".hint-word").textContent = T.input[kind];
  }

  // ---------- In-game coach (ctx.hint) ----------
  // A big 👆 TAP! / DRAG! shown for a moment over the game itself, where the
  // game points it. It vanishes after COACH_MS or as soon as the player touches.
  // A point is an element, an array of elements (their combined box), or
  // { x, y } in px inside #game. Options:
  //   gap: true      – for an array of answer options: point at the gap between the two options
  //                    nearest the middle, never at one option (a child would take it as "tap this one")
  //   edge: "bottom" – use the bottom edge instead of the middle
  //   small: true    – half size, finger only (no word), for tight spots (Samurai Slice: on the samurai)
  //   noWord: true   – finger only, no TAP!/DRAG! word (Find My Baby, Claw Catch, Feed Me)
  //   scale: n       – shrink the whole hint around its point (Clean the Room, Feed Me, Train Builder, Egg Shuffle)
  //   side: true     – the word sits to the right of the finger, not under it (fits a narrow horizontal gap)
  //   center: true   – the point is the middle of the finger, not the fingertip (to sit it inside a gap)
  function coachPoint(t, opts = {}) {
    if (!t) return null;
    const list = Array.isArray(t) ? t : [t];
    if (!list[0] || !list[0].getBoundingClientRect) return typeof t.x === "number" ? t : null;
    const g = els.game.getBoundingClientRect();
    let rects = list.map((el) => el.getBoundingClientRect()).filter((q) => q.width || q.height);
    if (!rects.length) return null;
    const box = (rs) => {
      const l = Math.min(...rs.map((q) => q.left)), r = Math.max(...rs.map((q) => q.right));
      const top = Math.min(...rs.map((q) => q.top)), b = Math.max(...rs.map((q) => q.bottom));
      return { l, r, top, b, cx: (l + r) / 2, cy: (top + b) / 2 };
    };
    let all = box(rects);
    if (opts.gap && rects.length >= 2) {
      const d = (q) => Math.hypot(q.left + q.width / 2 - all.cx, q.top + q.height / 2 - all.cy);
      const two = rects.slice().sort((p, q) => d(p) - d(q)).slice(0, 2);
      const c = (q) => ({ x: q.left + q.width / 2, y: q.top + q.height / 2 });
      const [p, q] = two.map(c);
      all = { ...box(two), cx: (p.x + q.x) / 2, cy: (p.y + q.y) / 2 };
    }
    return { x: all.cx - g.left, y: (opts.edge === "bottom" ? all.b : all.cy) - g.top };
  }
  function showCoach(game, from, to, opts, later) {
    const kind = game.input;
    if (!T.input[kind]) return;
    const a = coachPoint(from, opts || {});
    const b = kind === "drag" ? coachPoint(to) : null;
    if (!a || (kind === "drag" && !b)) return;
    hideCoach();
    // Near the bottom, the word goes above the fingertip and the finger is kept on screen.
    const H = els.game.clientHeight;
    const low = opts && opts.small ? a.y > H - 60 : a.y > H * 0.62;  // a small hint has room below
    const o = opts || {};
    const sc = o.scale || (o.small ? 0.5 : 1);
    a.y = Math.min(a.y, H - 80 * sc);  // keep the whole finger on screen
    const el = document.createElement("div");
    el.className = "coach " + kind + (low ? " low" : "") + (o.small ? " small" : "") +
      (o.noWord ? " noword" : "") + (o.side ? " side" : "");
    if (o.scale) el.style.transform = `scale(${o.scale})`;
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = '<div class="coach-move"><span class="coach-icon"></span></div><span class="coach-word"></span>';
    el.querySelector(".coach-icon").textContent = T.inputIcon;
    el.querySelector(".coach-word").textContent = T.input[kind];
    el.style.left = `${Math.round(a.x)}px`;
    el.style.top = `${Math.round(a.y)}px`;
    if (b) {
      el.style.setProperty("--dx", `${Math.round(b.x - a.x)}px`);
      el.style.setProperty("--dy", `${Math.round(b.y - a.y)}px`);
    }
    els.game.appendChild(el);
    if (o.center) { // move up by half the drawn finger, so its middle sits on the point
      const h = el.querySelector(".coach-icon").offsetHeight * sc;
      el.style.top = `${Math.round(Math.min(a.y - h / 2, H - 80 * sc))}px`;
    }
    state.coach = el;
    later(hideCoach, COACH_MS);
  }
  function hideCoach() {
    if (state.coach) state.coach.remove();
    state.coach = null;
  }

  // ---------- HUD ----------
  function renderHud(heartBroke) {
    const m = state.mode;
    if (!m) return;
    els.helpBtn.hidden = !isPractice();
    if (isPractice()) {
      const won = state.results.filter((r) => r.won).length;
      const played = state.results.length;
      els.status.textContent = T.practiceScore(won, played);
      els.status.setAttribute("aria-label", T.practiceScoreLabel(won, played));
      els.roundPill.hidden = true;
    } else if (m.lives) {
      let html = "";
      for (let i = 0; i < m.lives; i++) {
        const alive = i < state.lives;
        const cls = "heart" + (alive ? "" : " lost") + (heartBroke && i === state.lives ? " broke" : "");
        html += `<span class="${cls}">${alive ? "❤️" : "🖤"}</span>`;
      }
      els.status.innerHTML = html;
      els.status.setAttribute("aria-label", T.livesLabel(state.lives));
      els.roundPill.hidden = false;
      els.roundPill.textContent = T.roundPill(Math.max(1, state.round));
    } else {
      let html = "";
      for (let i = 0; i < m.totalGames; i++) {
        const r = state.results[i];
        const cls = r ? (r.won ? "win" : "miss") : i === state.round - 1 ? "now" : "";
        html += `<span class="pip ${cls}"></span>`;
      }
      els.status.innerHTML = `<span class="pips">${html}</span>`;
      els.status.setAttribute("aria-label", T.progressLabel(Math.max(1, state.round), m.totalGames));
      els.roundPill.hidden = true; // the pips already show progress
    }
  }

  // ---------- Round loop ----------
  function endGame() {
    state.token++;
    state.reported = true;
    cancelAnimationFrame(state.timerRaf);
    if (state.cleanup) guard("cleanup", state.cleanup);
    state.cleanup = null;
    state.gameTimers.forEach(clearTimeout);
    state.gameRafs.forEach(cancelAnimationFrame);
    state.gameTimers = [];
    state.gameRafs = [];
    if (state.gameActive) C.stopSpeech();
    state.gameActive = false;
    state.current = null;
    state.coach = null;
    els.game.innerHTML = "";
    els.game.classList.remove("locked");
  }

  function clearRound() {
    state.timers.forEach(clearTimeout);
    state.timers = [];
    endGame();
    els.banner.hidden = true;
    els.stamp.hidden = true;
    document.body.classList.remove("flash");
  }

  function isOver() {
    const m = state.mode;
    return (m.lives && state.lives <= 0) || state.results.length >= m.totalGames;
  }

  function nextRound() {
    clearRound();
    if (state.screen !== "play") return;
    if (isOver()) return finishRun();
    if (document.hidden) { state.phase = "paused"; return; }

    const choice = chooseRound();
    if (!choice) {
      console.error("frame: no playable microgames", { onlyGame, list: listParam, types: state.types });
      return goTitle();
    }
    const { game, list } = choice;
    state.round++;
    const speed = speedFor(state.round);
    const speedUp = speed > state.speed;
    state.speed = speed;
    state.phase = "transition";
    setTheme(state.theme + 1);
    setBar(1);
    renderHud();

    let t = 0;
    if (speedUp) {
      later(() => { shout(els.banner, T.speedUp, "speed"); C.sfx.speedUp(); }, t);
      t += SPEEDUP_MS;
    }
    if (!isPractice()) { // round numbers mean nothing when replaying one game
      later(() => { shout(els.banner, T.round(state.round), "round"); C.sfx.whoosh(); }, t);
      t += ROUND_MS;
    }
    later(() => {
      setHint(game);
      // The game's picture above its title, so non-readers can tell which game is coming.
      els.banner.querySelector(".banner-icon").textContent = game.icon || "";
      shout(els.banner, instructionFor(game, list), "instruction");
      restartAnim(els.banner.querySelector(".banner-icon"));
      document.body.classList.add("flash");
      C.sfx.slam();
    }, t);
    t += INSTRUCTION_MS;
    later(() => {
      document.body.classList.remove("flash");
      els.banner.hidden = true;
      startGame(game, list);
    }, t);
  }

  function startGame(game, list) {
    const token = ++state.token;
    const alive = () => token === state.token;
    const paceMs = Math.round((game.duration || BASE_MS) / state.speed);
    const timeLimit = Math.max(paceMs, warmupMsFor(state.round));
    state.reported = false;
    state.gameActive = true;
    state.phase = "playing";
    state.current = { game, timeLimit, t0: performance.now(), onTimeout: null };

    // Items with several pictures (`pics`) get one picked at random for this round,
    // so "A" can be apple, ant or arrow. pickOptions uses these same objects.
    const items = C.shuffle(list.items.map((it) => (it.pics && it.pics.length ? { ...it, ...C.pick(it.pics) } : it)));
    const ctx = {
      root: els.game,
      items,
      list: { id: list.id, type: list.type },
      speed: state.speed,
      timeLimit,
      // Show 👆 TAP! / DRAG! over the game for a moment (see showCoach). Drag games pass a target too.
      hint: (from, to, opts) => { if (alive() && !state.reported) showCoach(game, from, to, opts, ctx.later); },
      paceMs,       // the normal time limit; only differs from timeLimit in the Challenge warm-up
      audio: C.audioCtx(),
      canSpeak: C.canSpeak,
      get ended() { return !alive() || state.reported; },
      say: (text) => { if (alive()) C.say(text); },
      sfx: C.sfx,
      win: () => report(token, true),
      lose: () => report(token, false),
      onTimeout: (fn) => { if (alive() && state.current) state.current.onTimeout = fn; },
      // Stop the clock: the player's choice is made and the game is only animating the outcome
      // (Pachinko's falling ball). The game must still call win() or lose() itself.
      freezeTimer: () => {
        if (!alive() || state.reported || !state.current || state.current.frozenAt) return;
        state.current.frozenAt = performance.now();
        cancelAnimationFrame(state.timerRaf);
      },
      later: (fn, ms) => {
        if (!alive()) return 0;
        const id = setTimeout(() => { if (alive()) guard(game.id, fn); }, ms);
        state.gameTimers.push(id);
        return id;
      },
      raf: (fn) => {
        if (!alive()) return 0;
        const id = requestAnimationFrame((ts) => { if (alive()) guard(game.id, fn, ts); });
        state.gameRafs.push(id);
        return id;
      },
      confetti: C.confetti,
      shuffle: C.shuffle,
      pick: C.pick,
      pickOptions: (target, n) => C.pickOptions(items, target, n),
      lowerLookalikes: (target) => C.lowerLookalikes(items, target), // letters whose lowercase looks like target's (b → d, p, h)
      // R rows of N options, one right per row (sequence games). See Core.choiceRows.
      choiceRows: (R, N, opts = {}) => C.choiceRows(items, list.type, R, N, { canSpeak: C.canSpeak, ...opts }),
      // Phonics: pictures that start with a letter, and wrong pictures from other letters.
      phonics: {
        pics: C.startPics,                                     // (item) => [{ word, emoji }] starting with item.text
        set: (target, nRight, nWrong) => C.phonicsSet(items, target, nRight, nWrong), // => { right, wrong }
      },
    };

    try {
      state.cleanup = game.start(ctx) || null;
    } catch (err) {
      // Skip a broken game without costing a life, and don't pick it again.
      console.error(`${game.id} start:`, err);
      state.broken.add(game.id);
      endGame();
      state.round--;
      later(nextRound, 300);
      return;
    }
    if (state.reported) return; // the game reported straight away

    let lastSec = Infinity;
    const tick = () => {
      if (!alive() || state.reported || state.current.frozenAt) return;
      const elapsed = performance.now() - state.current.t0;
      setBar(1 - elapsed / timeLimit);
      const secs = Math.ceil((timeLimit - elapsed) / 1000);
      if (secs < lastSec && secs <= 2 && secs > 0) C.sfx.tick();
      lastSec = secs;
      if (elapsed >= timeLimit) { report(token, false, true); return; }
      state.timerRaf = requestAnimationFrame(tick);
    };
    state.timerRaf = requestAnimationFrame(tick);
  }

  function report(token, won, timedOut = false) {
    if (token !== state.token || state.reported || !state.current) return;
    state.reported = true;
    state.phase = "feedback";
    cancelAnimationFrame(state.timerRaf);
    hideCoach();
    const { game, timeLimit, t0, onTimeout } = state.current;
    const timeMs = Math.round(Math.min((state.current.frozenAt || performance.now()) - t0, timeLimit));
    els.game.classList.add("locked");
    state.results.push({ gameId: game.id, won, timedOut, timeMs, timeLimit, speed: state.speed });
    if (timedOut) {
      setBar(0);
      if (onTimeout) guard(`${game.id} onTimeout`, onTimeout);
    }

    const loseLife = !won && state.mode.lives > 0;
    if (loseLife) state.lives--;
    if (won) C.sfx.happy(); else C.sfx.buzz();
    vibrate(won ? 30 : [60, 40, 60]);
    renderHud(loseLife);

    later(() => shout(els.stamp, won ? T.correct : timedOut ? T.timeout : T.wrong, won ? "good" : "bad"), STAMP_DELAY_MS);
    later(() => whenQuiet(nextRound), FEEDBACK_MS);
  }

  // Let the game's last line ("A for apple") finish before the next round cuts it off.
  // Capped, because some browsers leave `speaking` stuck on true.
  function whenQuiet(fn) {
    const until = performance.now() + SPEECH_WAIT_MS;
    const check = () => (C.isSpeaking() && performance.now() < until ? later(check, 100) : fn());
    check();
  }

  function finishRun() {
    state.phase = "over";
    const dead = state.mode.lives > 0 && state.lives <= 0;
    shout(els.banner, dead ? T.gameOver : T.finish, "end");
    if (dead) C.sfx.buzz(); else C.sfx.fanfare();
    later(showResults, END_MS);
  }

  // ---------- Results ----------
  function statRow(icon, label, value, extra = "") {
    return `<div class="stat ${extra}"><span class="ico">${icon}</span><span class="lbl">${label}</span><span class="val">${value}</span></div>`;
  }

  function showResults() {
    clearRound();
    state.phase = "idle";
    const m = state.mode;
    const results = state.results;
    const cleared = results.filter((r) => r.won).length;
    const accuracy = window.SCORING.accuracy(results);
    showScreen("results");
    els.record.hidden = true;
    els.stars.hidden = true;

    if (m.id === "fun") {
      const stars = window.SCORING.stars(cleared, m.totalGames);
      els.resTitle.textContent = T.funTitle[stars];
      els.stars.hidden = false;
      els.stars.setAttribute("aria-label", T.starsLabel(stars));
      els.stars.innerHTML = [0, 1, 2]
        .map((i) => `<span class="star ${i < stars ? "on" : "off"}" style="animation-delay:${0.3 + i * 0.3}s">★</span>`)
        .join("");
      for (let i = 0; i < stars; i++) later(() => C.sfx.star(i), 300 + i * 300);
      els.resStats.innerHTML =
        statRow("✅", T.stats.cleared, `${cleared} / ${m.totalGames}`) +
        statRow("🎯", T.stats.accuracy, `${accuracy}%`);
      C.say(T.spoken.stars[stars]);
    } else {
      const score = window.SCORING.speedScore(results);
      const best = C.storage.get(m.highScoreKey, null);
      const bestScore = (best && best.score) || 0;
      const isRecord = score > bestScore;
      if (isRecord) C.storage.set(m.highScoreKey, { score, cleared, date: new Date().toISOString() });
      els.resTitle.textContent = T.challengeTitle;
      els.resStats.innerHTML =
        statRow("✅", T.stats.cleared, cleared) +
        statRow("🎯", T.stats.accuracy, `${accuracy}%`) +
        statRow("⚡", T.stats.speed, score) +
        statRow("🏆", T.stats.best, Math.max(score, bestScore), "best");
      if (isRecord) {
        els.record.textContent = T.newRecord;
        els.record.hidden = false;
        restartAnim(els.record);
        later(C.sfx.fanfare, 400);
      }
      C.say(isRecord ? T.spoken.record : T.spoken.done);
    }
    restartAnim(els.resTitle);
  }

  // ---------- Navigation ----------
  function startMode(id) {
    C.unlock();
    C.say(T.spoken.ready); // also unlocks speech on iOS (must happen inside a tap)
    clearRound();
    const mode = window.MODES[id];
    Object.assign(state, {
      mode, round: 0, lives: mode.lives, speed: 1, results: [], lastGame: null, phase: "transition",
    });
    showScreen("play");
    setBar(1);
    renderHud();
    later(nextRound, START_DELAY_MS);
  }

  function goTitle() {
    clearRound();
    state.phase = "idle";
    setTheme(0);
    showScreen("title");
  }

  // ---------- What to play: tick letters, phonics, CVC words and/or sight words ----------
  // Shown after a mode button. ?list= skips it and plays just that list.
  function chooseContent(modeId) {
    state.pendingMode = modeId;
    if (listParam) return contentGo();
    clearRound();
    state.phase = "idle";
    setTheme(1);
    renderContent();
    showScreen("content");
  }

  function renderContent() {
    const lists = window.WORD_LISTS || [];
    els.contentGrid.innerHTML = "";
    CONTENT_TYPES.filter((t) => lists.some((l) => l.type === t)).forEach((type) => {
      const info = T.content[type];
      const b = document.createElement("button");
      b.className = `content-btn ${type}${info.name.length > 4 ? " long" : ""}`;
      b.setAttribute("aria-pressed", String(state.types.includes(type)));
      b.setAttribute("aria-label", `${info.name}: ${info.label}`);
      b.innerHTML = `<span class="tick" aria-hidden="true">✔</span>
        <span class="what"><span class="nm"></span><span class="lbl"></span></span>
        <span class="sample" aria-hidden="true"></span>`;
      b.querySelector(".nm").textContent = info.name;
      b.querySelector(".lbl").textContent = info.label;
      b.querySelector(".sample").textContent = info.sample;
      b.addEventListener("click", () => toggleType(type, b));
      els.contentGrid.appendChild(b);
    });
  }

  function toggleType(type, btn) {
    C.unlock();
    const on = state.types.includes(type);
    if (on && state.types.length === 1) { // at least one stays ticked
      btn.classList.remove("nope");
      void btn.offsetWidth;
      btn.classList.add("nope");
      C.sfx.buzz();
      return;
    }
    state.types = on ? state.types.filter((t) => t !== type) : [...state.types, type];
    btn.setAttribute("aria-pressed", String(!on));
    C.sfx.tone(on ? 440 : 660, 0.08);
    C.storage.set(TYPES_KEY, state.types);
  }

  function contentGo() {
    if (state.pendingMode === "practice") showPractice();
    else startMode(state.pendingMode || "fun");
  }

  // ---------- Practice: pick a game, read how to play, then play it on repeat ----------
  function showPractice() {
    clearRound();
    state.phase = "idle";
    setTheme(2);
    els.practiceGrid.innerHTML = "";
    C.MICROGAMES.filter((g) => !state.broken.has(g.id) && listsFor(g).length).forEach((game) => {
      const b = document.createElement("button");
      b.className = "game-card";
      const ico = document.createElement("span");
      ico.className = "ico";
      ico.setAttribute("aria-hidden", "true");
      ico.textContent = game.icon || "🎮";
      const name = document.createElement("span");
      name.textContent = nameFor(game);
      b.append(ico, name);
      b.addEventListener("click", () => showHowTo(game));
      els.practiceGrid.appendChild(b);
    });
    showScreen("practice");
  }

  function showHowTo(game) {
    clearRound();
    state.phase = "idle";
    state.practiceGame = game.id;
    const list = listsFor(game)[0];
    const howTo = howToFor(game, list) || { steps: [["👀", instructionFor(game, list).replace(/\n/g, " ")]] };
    els.howtoIcon.textContent = game.icon || "🎮";
    els.howtoName.textContent = nameFor(game);
    els.howtoSteps.innerHTML = "";
    (howTo.steps || []).forEach(([icon, text]) => {
      const li = document.createElement("li");
      const ico = document.createElement("span");
      ico.className = "ico";
      ico.setAttribute("aria-hidden", "true");
      ico.textContent = icon;
      const txt = document.createElement("span");
      txt.textContent = text;
      li.append(ico, txt);
      els.howtoSteps.appendChild(li);
    });
    const tips = howTo.tips || [];
    els.howtoTipsBox.hidden = !tips.length;
    els.howtoTips.innerHTML = "";
    tips.forEach((tip) => {
      const li = document.createElement("li");
      li.textContent = tip;
      els.howtoTips.appendChild(li);
    });
    showScreen("howto");
  }

  function quitPlay() {
    if (isPractice()) showPractice(); else goTitle();
  }
  function practiceHelp() {
    const game = C.MICROGAMES.find((g) => g.id === state.practiceGame);
    if (game) showHowTo(game); else showPractice();
  }

  // Leaving the tab mid-round cancels that round (no penalty); it's replayed on return.
  document.addEventListener("visibilitychange", () => {
    if (state.screen !== "play") return;
    if (document.hidden) {
      if (state.phase === "transition" || state.phase === "playing") {
        clearRound();
        if (state.round > state.results.length) state.round--;
        state.phase = "paused";
      }
    } else if (state.phase === "paused") {
      C.unlock(); // iOS may have suspended audio
      state.phase = "transition";
      later(nextRound, 400);
    }
  });

  els.game.addEventListener("pointerdown", hideCoach, true); // the first touch clears the in-game hint
  els.funBtn.addEventListener("click", () => chooseContent("fun"));
  els.challengeBtn.addEventListener("click", () => chooseContent("challenge"));
  els.practiceBtn.addEventListener("click", () => chooseContent("practice"));
  els.contentGoBtn.addEventListener("click", contentGo);
  els.contentBackBtn.addEventListener("click", goTitle);
  els.practiceBackBtn.addEventListener("click", () => (listParam ? goTitle() : chooseContent("practice")));
  els.howtoPlayBtn.addEventListener("click", () => startMode("practice"));
  els.howtoBackBtn.addEventListener("click", showPractice);
  els.helpBtn.addEventListener("click", practiceHelp);
  els.settingsBtn.addEventListener("click", () => showScreen("settings"));
  els.backBtn.addEventListener("click", () => showScreen("title"));
  els.quitBtn.addEventListener("click", quitPlay);
  els.againBtn.addEventListener("click", () => startMode(state.mode.id));
  els.menuBtn.addEventListener("click", goTitle);

  // ---------- Boot: load the games listed in games/manifest.js ----------
  function ready() {
    els.loading.hidden = true;
    if (!C.MICROGAMES.length) {
      els.loading.textContent = T.noGames;
      els.loading.hidden = false;
      return;
    }
    els.funBtn.disabled = els.challengeBtn.disabled = els.practiceBtn.disabled = false;
  }
  const files = window.GAME_FILES || [];
  let pending = files.length;
  if (!pending) ready();
  files.forEach((name) => {
    const s = document.createElement("script");
    s.src = `games/${name}.js`;
    s.async = false; // keep manifest order
    s.onload = s.onerror = (e) => {
      if (e.type === "error") console.error("load game:", s.src);
      if (--pending === 0) ready();
    };
    document.body.appendChild(s);
  });
  showScreen("title");
})();
