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
  const INSTRUCTION_MS = 1300;  // the game's icon and instruction
  const START_LOCK_MS = 500;    // taps are ignored this long when a game starts, so a child already tapping from the banner doesn't hit an answer by accident
  const REVEAL_MS = 1400;       // ctx.reveal: the target card big in the middle, then back into place (touches locked, clock waiting)
  const COACH_MS = 2400;        // how long ctx.hint's in-game TAP! / DRAG! stays up
  const STAMP_DELAY_MS = 250;   // let the game's own win/lose effect land first
  const FEEDBACK_MS = 1400;
  const SPEECH_WAIT_MS = 2500;  // max extra wait for speech to finish after feedback
  const END_MS = 1500;
  // Tutorial (see runDemo): WATCH! banner → the game plays itself → YOUR TURN! banner → the real round.
  const WATCH_MS = 1300;
  const TURN_MS = 1800;
  const DEMO_AFTER_MS = 1500;   // after the demo's win, let the game's own celebration play
  const DEMO_MAX_MS = 24000;    // give up on a demo that never reports (a script that missed)
  const DEMO_POINTER = 4242;    // pointerId of the ghost finger's events
  const TUTORIAL_KEY = "wwe.tutorial";               // localStorage: the last 👀 Watch first? answer
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
    askWatch: $("#askWatch"), watchYes: $("#watchYes"), watchNo: $("#watchNo"),
    funBtn: $("#funBtn"), challengeBtn: $("#challengeBtn"), practiceBtn: $("#practiceBtn"),
    settingsBtn: $("#settingsBtn"), loading: $("#loading"),
    backBtn: $("#backBtn"), quitBtn: $("#quitBtn"), helpBtn: $("#helpBtn"),
    practiceGrid: $("#practiceGrid"), practiceBackBtn: $("#practiceBackBtn"),
    pickerTitle: $("#pickerTitle"), pickerNote: $("#pickerNote"),
    tutorialsBtn: $("#tutorialsBtn"), howtoWatchBtn: $("#howtoWatchBtn"),
    howtoIcon: $("#howtoIcon"), howtoName: $("#howtoName"), howtoSteps: $("#howtoSteps"),
    howtoTipsBox: $("#howtoTipsBox"), howtoTips: $("#howtoTips"),
    howtoPlayBtn: $("#howtoPlayBtn"), howtoBackBtn: $("#howtoBackBtn"),
    status: $("#status"), roundPill: $("#roundPill"), bar: $("#bar"),
    game: $("#game"), banner: $("#banner"), stamp: $("#stamp"),
    resTitle: $("#resTitle"), stars: $("#stars"), resStats: $("#resStats"), record: $("#record"),
    againBtn: $("#againBtn"), menuBtn: $("#menuBtn"),
  };

  const state = {
    screen: "title",
    mode: null,
    practiceGame: null,         // the game Practice mode is playing
    types: loadTypes(),         // content types ticked on the picker: "letter", "phonics", "cvc", "hfw"
    pendingMode: null,          // the mode button pressed before the content picker
    tutorial: C.storage.get(TUTORIAL_KEY, true) !== false, // show each game once before it's played (Fun, Challenge)
    seen: new Set(),            // games whose tutorial this run has already shown
    forceDemo: null,            // a game id whose tutorial the next round must show (Tutorials menu)
    picker: "practice",         // what the game grid is for: "practice" or "tutorial"
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
    els.askWatch.hidden = true;
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
    if (state.phase === "demo") { // the game is playing itself: say so where the round number usually is
      els.roundPill.hidden = false;
      els.roundPill.textContent = T.watchPill;
    }
    els.roundPill.classList.toggle("watch", state.phase === "demo");
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
    document.body.classList.remove("demo");
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

    // Tutorial: the first time a run meets a game, it plays itself once before the child's turn.
    const demo = !!game.tutorial && (state.forceDemo === game.id || (state.tutorial && !isPractice() && !state.seen.has(game.id)));
    state.forceDemo = null;

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
      if (demo) runDemo(game, list); else startGame(game, list);
    }, t);
  }

  // ---------- Tutorial ----------
  // WATCH! → the game starts at 1× with touches locked, and its `tutorial(ctx, f)` script drives a
  // ghost finger (f) that points at the prompt and does the right move with real pointer events,
  // so the game's own code wins the round → YOUR TURN! → the real round, with a different answer.
  function runDemo(game, list) {
    state.seen.add(game.id);
    els.banner.querySelector(".banner-icon").textContent = "👀";
    shout(els.banner, T.watch, "watch");
    restartAnim(els.banner.querySelector(".banner-icon"));
    C.sfx.whoosh();
    C.say(T.spoken.watch);
    later(() => {
      els.banner.hidden = true;
      startGame(game, list, { demo: true });
    }, WATCH_MS);
  }

  function finishDemo(game, list, avoid) {
    endGame();
    state.phase = "transition";
    renderHud();
    setBar(1);
    // A loud, obvious switch: 🙋 YOUR TURN! with a flash and a fanfare.
    els.banner.querySelector(".banner-icon").textContent = "🙋";
    shout(els.banner, T.yourTurn, "turn");
    restartAnim(els.banner.querySelector(".banner-icon"));
    document.body.classList.add("flash");
    C.sfx.speedUp();
    C.say(T.spoken.yourTurn);
    later(() => document.body.classList.remove("flash"), 400);
    later(() => {
      els.banner.hidden = true;
      startGame(game, list, { avoid });
    }, TURN_MS);
  }

  // The ghost finger for one demo round. Targets are an element, { x, y } px inside #game,
  // or a function returning either (read every frame, so the finger follows moving things).
  function demoFinger(ctx) {
    const finger = document.createElement("div");
    finger.className = "demo-finger";
    finger.setAttribute("aria-hidden", "true");
    finger.innerHTML = `<span>${T.inputIcon}</span>`;
    let at = null; // where the fingertip is, px inside #game
    let ring = null, ringOn = null;

    const gameBox = () => els.game.getBoundingClientRect();
    const resolve = (t) => {
      const v = typeof t === "function" ? t() : t;
      if (!v) return null;
      if (v.getBoundingClientRect) {
        const r = v.getBoundingClientRect(), g = gameBox();
        return { x: r.left + r.width / 2 - g.left, y: r.top + r.height / 2 - g.top };
      }
      return typeof v.x === "number" ? { x: v.x, y: v.y } : null;
    };
    const elementOf = (t) => { const v = typeof t === "function" ? t() : t; return v && v.getBoundingClientRect ? v : null; };
    const place = () => {
      if (!at) return;
      if (!finger.isConnected) els.game.appendChild(finger);
      finger.style.left = `${Math.round(at.x)}px`;
      finger.style.top = `${Math.round(at.y)}px`;
    };
    // A glowing ring that hugs an element (and follows it).
    const showRing = (t) => {
      ringOn = t;
      if (!ring) { ring = document.createElement("div"); ring.className = "demo-ring"; ring.setAttribute("aria-hidden", "true"); }
      els.game.appendChild(ring);
      const track = () => {
        if (ringOn !== t || !ring.isConnected) return;
        const el = elementOf(t);
        if (el) {
          const r = el.getBoundingClientRect(), g = gameBox();
          Object.assign(ring.style, {
            left: `${r.left - g.left - 8}px`, top: `${r.top - g.top - 8}px`,
            width: `${r.width + 16}px`, height: `${r.height + 16}px`,
          });
        }
        ctx.raf(track);
      };
      track();
    };
    const hideRing = () => { ringOn = null; if (ring) ring.remove(); };
    const wait = (ms) => new Promise((done) => ctx.later(done, ms));
    // Glide the fingertip to a (possibly moving) target over `ms`.
    const glide = (t, ms) => new Promise((done) => {
      const p0 = at || (() => { const g = gameBox(); return { x: g.width * 0.5, y: g.height + 40 }; })();
      const t0 = performance.now();
      const step = () => {
        const p1 = resolve(t) || p0;
        const k = Math.min(1, (performance.now() - t0) / ms);
        const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; // ease in-out
        at = { x: p0.x + (p1.x - p0.x) * e, y: p0.y + (p1.y - p0.y) * e };
        place();
        if (k < 1) ctx.raf(step); else done();
      };
      step();
    });
    // Real pointer events, so the game reacts exactly as it would to a child. Like a real touch,
    // every event goes to the element the press started on.
    let down = null;
    const fire = (type, el, p) => {
      const g = gameBox();
      el.dispatchEvent(new PointerEvent(type, {
        bubbles: true, cancelable: true, composed: true, pointerId: DEMO_POINTER, pointerType: "touch", isPrimary: true,
        clientX: g.left + p.x, clientY: g.top + p.y, button: 0, buttons: type === "pointerup" ? 0 : 1,
        width: 20, height: 20, pressure: type === "pointerup" ? 0 : 0.5,
      }));
    };
    const hitAt = (p, fallback) => {
      const g = gameBox();
      els.game.classList.remove("locked"); // a locked #game is invisible to elementFromPoint
      finger.hidden = true;
      if (ring) ring.hidden = true;
      const el = document.elementFromPoint(g.left + p.x, g.top + p.y);
      finger.hidden = false;
      if (ring) ring.hidden = false;
      els.game.classList.add("locked");
      return el && els.game.contains(el) && el !== els.game ? el : fallback || el;
    };
    const press = (t) => {
      at = resolve(t) || at;
      place();
      finger.classList.add("press");
      const ripple = document.createElement("div");
      ripple.className = "demo-ripple";
      ripple.style.left = `${at.x}px`;
      ripple.style.top = `${at.y}px`;
      els.game.appendChild(ripple);
      ctx.later(() => ripple.remove(), 500);
      down = hitAt(at, elementOf(t));
      if (down) fire("pointerdown", down, at);
    };
    const release = () => {
      finger.classList.remove("press");
      if (down) fire("pointerup", down, at);
      down = null;
    };
    // Drag from where the finger is to t over ms, with a pointermove every frame.
    const sweep = (t, ms) => new Promise((done) => {
      const p0 = at, t0 = performance.now();
      const step = () => {
        const p1 = resolve(t) || p0;
        const k = Math.min(1, (performance.now() - t0) / ms);
        const e = k * k * (3 - 2 * k);
        at = { x: p0.x + (p1.x - p0.x) * e, y: p0.y + (p1.y - p0.y) * e };
        place();
        if (down) fire("pointermove", down, at);
        if (k < 1) ctx.raf(step); else done();
      };
      ctx.raf(step);
    });

    return {
      wait,
      // Point at something (the prompt, the answer) with a glowing ring around it.
      async point(t, ms = 1100) {
        await glide(t, 550);
        if (elementOf(t)) showRing(t);
        await wait(ms);
        hideRing();
      },
      async tap(t) {
        if (elementOf(t)) showRing(t);
        await glide(t, 600);
        await wait(250);
        press(t);
        await wait(140);
        release();
        hideRing();
        await wait(300);
      },
      // Drag `from` onto `to` (a tile into a mouth, a letter into a box). `hold`: keep the finger
      // down on `to` that long, still following it (Ghost Hunt's beam on a drifting ghost).
      async drag(from, to, ms = 1000, hold = 150) {
        if (elementOf(from)) showRing(from);
        await glide(from, 600);
        await wait(250);
        press(from);
        hideRing();
        await wait(150);
        await sweep(to, ms);
        await sweep(to, hold);
        release();
        await wait(300);
      },
      // Press at the first point and drag through the rest (tracing a letter, scrubbing a window).
      // `ms` per segment.
      async path(points, ms = 300) {
        if (!points.length) return;
        await glide(points[0], 600);
        await wait(200);
        press(points[0]);
        for (const p of points.slice(1)) await sweep(p, ms);
        release();
        await wait(250);
      },
      // Ride along on a moving target, ringed, until test() is true (or `max` ms): "watch this one".
      async follow(t, test, max = 10000) {
        await glide(t, 450);
        if (elementOf(t)) showRing(t);
        const t0 = performance.now();
        await new Promise((done) => {
          const step = () => {
            const p = resolve(t);
            if (p) { at = p; place(); }
            let ok = false;
            try { ok = !!test(); } catch (err) { ok = false; }
            if (ok || performance.now() - t0 > max) done(); else ctx.raf(step);
          };
          step();
        });
        hideRing();
      },
      // Press right now, where the finger already is (move it there first): for timing (Claw Catch's STOP).
      async tapNow(t) {
        press(t);
        await wait(120);
        release();
      },
      // Glide somewhere without touching (to wait beside the action).
      async move(t, ms = 500) { await glide(t, ms); },
      // Wait until test() is true (checked every frame), or `max` ms. Resolves to whether it happened.
      until(test, max = 8000) {
        return new Promise((done) => {
          const t0 = performance.now();
          const check = () => {
            let ok = false;
            try { ok = !!test(); } catch (err) { ok = false; }
            if (ok) done(true);
            else if (performance.now() - t0 > max) done(false);
            else ctx.raf(check);
          };
          check();
        });
      },
      // A quick swipe from one point to another (Samurai Slice).
      async slice(from, to, ms = 260) {
        await glide(from, 600);
        await wait(300);
        press(from);
        await sweep(to, ms);
        release();
        await wait(300);
      },
      hide() { hideRing(); finger.remove(); },
    };
  }

  // ctx.reveal: zoom the target card up to the middle of #game, hold it, then fly it back.
  // It animates the card itself (so the game's own styles stay), on top of its own transform,
  // and a huge spread shadow dims everything else.
  function revealCard(card, later) {
    const g = els.game.getBoundingClientRect(), r = card.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const cs = getComputedStyle(card);
    const base = cs.transform === "none" ? "" : cs.transform;
    const s = Math.max(1, Math.min(3.2, (g.width * 0.62) / r.width, (g.height * 0.42) / r.height));
    const dx = g.left + g.width / 2 - (r.left + r.width / 2);
    const dy = g.top + g.height * 0.45 - (r.top + r.height / 2);
    const big = (k) => `translate(${dx}px, ${dy}px) ${base} scale(${s * k})`;
    const own = cs.boxShadow === "none" ? "" : `, ${cs.boxShadow}`;
    const dim = `0 0 0 200vmax rgba(0, 0, 0, .55)${own}`, clear = `0 0 0 200vmax rgba(0, 0, 0, 0)${own}`;
    if (cs.position === "static") card.style.position = "relative"; // so z-index applies
    card.classList.add("fx-reveal");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const anim = card.animate([
      { transform: big(reduce ? 1 : 0.4), boxShadow: clear, opacity: reduce ? 1 : 0, offset: 0 },
      { transform: big(1.08), boxShadow: dim, opacity: 1, offset: 0.12 },
      { transform: big(1), boxShadow: dim, offset: 0.2 },
      { transform: big(1), boxShadow: dim, offset: 0.72 },
      { transform: base || "none", boxShadow: clear, offset: 1 },
    ], { duration: REVEAL_MS, easing: "ease-in-out" });
    C.sfx.tone(660, 0.1, "triangle", 0.12);
    C.sfx.tone(990, 0.12, "triangle", 0.1, 0.08);
    // Ended on a timer, not the animation's finish event (which stalls in throttled tabs), so the
    // card can never be left big or untappable.
    later(() => { if (anim.playState !== "finished") anim.cancel(); card.classList.remove("fx-reveal"); }, REVEAL_MS + 30);
  }

  function startGame(game, list, opts = {}) {
    const token = ++state.token;
    const alive = () => token === state.token;
    const demo = !!opts.demo;
    const speed = demo ? 1 : state.speed; // demos always play at 1×, so they're easy to follow
    const paceMs = Math.round((game.duration || BASE_MS) / speed);
    const timeLimit = demo ? Math.max(paceMs, 20000) : Math.max(paceMs, warmupMsFor(state.round));
    state.reported = false;
    state.gameActive = true;
    state.phase = demo ? "demo" : "playing";
    // The clock starts after the start lock, so the lock doesn't eat into the time limit.
    state.current = { game, timeLimit, t0: performance.now() + START_LOCK_MS, onTimeout: null, demo };

    // Items with several pictures (`pics`) get one picked at random for this round,
    // so "A" can be apple, ant or arrow. pickOptions uses these same objects.
    let items = C.shuffle(list.items.map((it) => (it.pics && it.pics.length ? { ...it, ...C.pick(it.pics) } : it)));
    // After a demo, the demo's answer goes to the back, so the child's round has a different one
    // (games take their target from the front of ctx.items).
    if (opts.avoid && opts.avoid.size) items = [...items.filter((it) => !opts.avoid.has(it.text)), ...items.filter((it) => opts.avoid.has(it.text))];
    const ctx = {
      root: els.game,
      items,
      list: { id: list.id, type: list.type },
      speed,
      timeLimit,
      demo,         // true while the game plays itself in the tutorial
      // Show 👆 TAP! / DRAG! over the game for a moment (see showCoach). Drag games pass a target too.
      // Never during a demo: the ghost finger does the showing.
      hint: (from, to, opts) => { if (alive() && !state.reported && !demo) showCoach(game, from, to, opts, ctx.later); },
      paceMs,       // the normal time limit; only differs from timeLimit in the Challenge warm-up
      // Tutorial script (games with `tutorial: true` call it at the end of start; it does nothing
      // outside a demo). `answer`: the item (or items) this round is about, so the child's round
      // gets a different one. `run(f)`: async, drives the ghost finger: f.point(t), f.tap(t),
      // f.drag(from, to), f.slice(from, to), f.wait(ms). See demoFinger.
      tutorial: (answer, run) => { if (demo && alive()) demoScript = { answer, run }; },
      // For games with one target shown in a card: call once at the end of start with that card.
      // The card zooms up big in the middle (everything else dimmed), holds, then flies back into
      // place. Touches stay locked and the clock waits until it's done. Returns its length in ms,
      // so the game can hold back anything that would start moving (the first shot, mole, mouse).
      reveal: (card) => {
        if (!alive() || revealMs || !card) return 0;
        revealMs = REVEAL_MS;
        ctx.raf(() => revealCard(card, ctx.later));
        return REVEAL_MS;
      },
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

    // Start lock (see START_LOCK_MS): the game is on screen but ignores touches for a moment
    // (longer when it reveals its target). A demo stays locked throughout: only the ghost finger plays.
    els.game.classList.add("locked");

    let demoScript = null, revealMs = 0;
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
    const lockMs = Math.max(START_LOCK_MS, revealMs ? revealMs + 60 : 0); // the reveal starts a frame late and ends on a timer
    state.current.t0 = performance.now() + lockMs; // the clock starts once the lock (and reveal) is over
    if (!demo) ctx.later(() => { if (!state.reported) els.game.classList.remove("locked"); }, lockMs);

    if (demo) {
      // The demo's answer (by text) is kept out of the front of the child's round.
      const answers = demoScript ? [].concat(demoScript.answer || []) : [];
      const avoid = new Set(answers.filter(Boolean).map((it) => it.text));
      state.current.finish = () => finishDemo(game, list, avoid);
      if (!demoScript) { // the game has no script after all: straight to the child's turn
        console.error(`${game.id} tutorial: no script`);
        return state.current.finish();
      }
      document.body.classList.add("demo");
      renderHud();
      setBar(1);
      const f = demoFinger(ctx);
      ctx.later(async () => {
        try { await demoScript.run(f); } catch (err) { console.error(`${game.id} tutorial:`, err); }
        if (alive() && !state.reported) ctx.later(() => report(token, false), 3500); // the script missed (or the outcome is still animating)
      }, Math.max(450, revealMs + 200));
      ctx.later(() => report(token, false), DEMO_MAX_MS);
      return; // no clock in a demo
    }
    if (state.reported) return; // the game reported straight away

    let lastSec = Infinity;
    const tick = () => {
      if (!alive() || state.reported || state.current.frozenAt) return;
      const elapsed = performance.now() - state.current.t0;
      setBar(Math.min(1, 1 - elapsed / timeLimit));
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
    if (state.current.demo) { // a demo round: no score, no lives, no stamp
      const finish = state.current.finish;
      if (won) C.sfx.happy();
      later(() => whenQuiet(finish), won ? DEMO_AFTER_MS : 300);
      return;
    }
    const { game, timeLimit, t0, onTimeout } = state.current;
    const timeMs = Math.max(0, Math.round(Math.min((state.current.frozenAt || performance.now()) - t0, timeLimit)));
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
      mode, round: 0, lives: mode.lives, speed: 1, results: [], lastGame: null, phase: "transition", seen: new Set(),
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

  // ---------- 👀 Watch first? (Fun and Challenge, every time PLAY or PLAY AGAIN is pressed) ----------
  // A pop-up with two big buttons: 👀 WATCH FIRST (new games show their tutorial) or 🙈 JUST PLAY.
  // The last choice pulses, and the voice asks, for children who can't read.
  function askWatch(modeId) {
    C.unlock();
    state.askMode = modeId;
    els.watchYes.classList.toggle("hot", state.tutorial);
    els.watchNo.classList.toggle("hot", !state.tutorial);
    els.askWatch.hidden = false;
    restartAnim(els.askWatch.querySelector(".ask-card"));
    C.say(T.spoken.askWatch);
  }
  function answerWatch(yes) {
    if (els.askWatch.hidden) return;
    els.askWatch.hidden = true;
    state.tutorial = yes;
    C.storage.set(TUTORIAL_KEY, yes);
    startMode(state.askMode || "fun");
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
    if (state.pendingMode === "practice") showPractice("practice");
    else askWatch(state.pendingMode || "fun");
  }

  // ---------- Practice: pick a game, read how to play, then play it on repeat ----------
  // The game grid, for Practice (then the How to play card) or for Tutorials (straight to the demo).
  function showPractice(kind = state.picker) {
    clearRound();
    state.phase = "idle";
    state.picker = kind;
    const tut = kind === "tutorial";
    setTheme(tut ? 5 : 2);
    els.pickerTitle.textContent = tut ? T.tutorials : T.practice;
    els.pickerNote.textContent = tut ? T.pickTutorial : T.pickGame;
    els.practiceGrid.innerHTML = "";
    C.MICROGAMES.filter((g) => !state.broken.has(g.id) && listsFor(g).length && (!tut || g.tutorial)).forEach((game) => {
      const b = document.createElement("button");
      b.className = "game-card";
      const ico = document.createElement("span");
      ico.className = "ico";
      ico.setAttribute("aria-hidden", "true");
      ico.textContent = game.icon || "🎮";
      const name = document.createElement("span");
      name.textContent = nameFor(game);
      b.append(ico, name);
      b.addEventListener("click", () => (tut ? watchTutorial(game) : showHowTo(game)));
      els.practiceGrid.appendChild(b);
    });
    showScreen("practice");
  }

  // Play a game's tutorial right now (Tutorials menu, or 👀 WATCH on the How to play card),
  // then let the child carry on with it in Practice. ✕ goes back to the grid it came from.
  function watchTutorial(game) {
    C.unlock();
    state.practiceGame = game.id;
    state.forceDemo = game.id;
    startMode("practice");
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
    els.howtoWatchBtn.hidden = !game.tutorial;
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
      if (state.phase === "transition" || state.phase === "playing" || state.phase === "demo") {
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
  els.watchYes.addEventListener("click", () => answerWatch(true));
  els.watchNo.addEventListener("click", () => answerWatch(false));
  els.contentBackBtn.addEventListener("click", goTitle);
  els.practiceBackBtn.addEventListener("click", () => (listParam || state.picker === "tutorial" ? goTitle() : chooseContent("practice")));
  els.tutorialsBtn.addEventListener("click", () => { C.unlock(); showPractice("tutorial"); });
  els.howtoWatchBtn.addEventListener("click", () => {
    const game = C.MICROGAMES.find((g) => g.id === state.practiceGame);
    if (game) watchTutorial(game);
  });
  els.howtoPlayBtn.addEventListener("click", () => startMode("practice"));
  els.howtoBackBtn.addEventListener("click", () => showPractice());
  els.helpBtn.addEventListener("click", practiceHelp);
  els.settingsBtn.addEventListener("click", () => showScreen("settings"));
  els.backBtn.addEventListener("click", () => showScreen("title"));
  els.quitBtn.addEventListener("click", quitPlay);
  els.againBtn.addEventListener("click", () => (state.mode.id === "practice" ? startMode("practice") : askWatch(state.mode.id)));
  els.menuBtn.addEventListener("click", goTitle);

  // ---------- Boot: load the games listed in games/manifest.js ----------
  function ready() {
    els.loading.hidden = true;
    if (!C.MICROGAMES.length) {
      els.loading.textContent = T.noGames;
      els.loading.hidden = false;
      return;
    }
    els.funBtn.disabled = els.challengeBtn.disabled = els.practiceBtn.disabled = els.tutorialsBtn.disabled = false;
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
