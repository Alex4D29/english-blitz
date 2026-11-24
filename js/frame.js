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
  // The teacher found tutorials slow in Challenge, so everything a tutorial controls runs 1.5× faster:
  // these banners, and every glide, pause, drag and swipe of the ghost finger (DEMO_PACE, in demoFinger).
  // The games' own animations keep their normal speed.
  const DEMO_PACE = 1.5;
  const WATCH_MS = 870;
  const TURN_MS = 1200;
  const DEMO_AFTER_MS = 1000;   // after the demo's win, let the game's own celebration play
  const DEMO_MAX_MS = 24000;    // give up on a demo that never reports (a script that missed)
  const DEMO_POINTER = 4242;    // pointerId of the ghost finger's events
  const TUTORIAL_KEY = "wwe.tutorial";               // localStorage: the last 👀 Watch first? answer
  const LISTENING_KEY = "wwe.listening";             // localStorage: listening games on/off (Settings)
  const PRACTICE_SPEED_KEY = "wwe.practice.speed";   // localStorage: the Practice difficulty
  const BOSS_KEY = "wwe.boss.beaten";                // localStorage: the bosses beaten so far (Boss Battle)
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
  // ⭐ MY WORDS (Word of the Week): the words chosen per list type, and whether it's switched on.
  const MYWORDS_KEY = "wwe.mywords";
  function loadMyWords() {
    const s = C.storage.get(MYWORDS_KEY, null) || {};
    const arr = (a) => (Array.isArray(a) ? a.filter((x) => typeof x === "string") : []);
    return { on: !!s.on, letter: arr(s.letter), cvc: arr(s.cvc), hfw: arr(s.hfw) };
  }
  const saveMyWords = () => C.storage.set(MYWORDS_KEY, state.myWords);
  const chosenFor = (type) => state.myWords[type === "phonics" ? "letter" : type] || [];
  const chosenCount = () => ["letter", "cvc", "hfw"].reduce((n, t) => n + state.myWords[t].length, 0);
  const myWordsOn = () => !listParam && state.myWords.on && chosenCount() > 0;

  const $ = (s) => document.querySelector(s);
  const els = {
    title: $("#title"), settings: $("#settings"), play: $("#play"), results: $("#results"),
    practice: $("#practice"), howto: $("#howto"), content: $("#content"),
    contentGrid: $("#contentGrid"), contentGoBtn: $("#contentGoBtn"), contentBackBtn: $("#contentBackBtn"),
    askWatch: $("#askWatch"), watchYes: $("#watchYes"), watchNo: $("#watchNo"),
    funBtn: $("#funBtn"), challengeBtn: $("#challengeBtn"), practiceBtn: $("#practiceBtn"), versusBtn: $("#versusBtn"), adventureBtn: $("#adventureBtn"),
    bossBtn: $("#bossBtn"),
    settingsBtn: $("#settingsBtn"), loading: $("#loading"),
    words: $("#words"), wordsGrid: $("#wordsGrid"), wordsCount: $("#wordsCount"), wordsDoneBtn: $("#wordsDoneBtn"), wordsClearBtn: $("#wordsClearBtn"),
    myWordsNote: $("#myWordsNote"), myWordsBtn: $("#myWordsBtn"), wordsEditBtn: $("#wordsEditBtn"), myWordsSetNote: $("#myWordsSetNote"),
    playerBtn: $("#playerBtn"), playersBox: $("#playersBox"),
    charBtn: $("#charBtn"), resChar: $("#resChar"), resetCharsBtn: $("#resetCharsBtn"),
    backBtn: $("#backBtn"), quitBtn: $("#quitBtn"), helpBtn: $("#helpBtn"),
    practiceGrid: $("#practiceGrid"), practiceBackBtn: $("#practiceBackBtn"),
    pickerTitle: $("#pickerTitle"), pickerNote: $("#pickerNote"),
    tutorialsBtn: $("#tutorialsBtn"), howtoWatchBtn: $("#howtoWatchBtn"),
    diffRow: $("#diffRow"),
    howtoIcon: $("#howtoIcon"), howtoName: $("#howtoName"), howtoSteps: $("#howtoSteps"),
    howtoTipsBox: $("#howtoTipsBox"), howtoTips: $("#howtoTips"),
    howtoPlayBtn: $("#howtoPlayBtn"), howtoBackBtn: $("#howtoBackBtn"),
    status: $("#status"), roundPill: $("#roundPill"), bar: $("#bar"), timer: $("#timer"),
    game: $("#game"), banner: $("#banner"), stamp: $("#stamp"),
    resTitle: $("#resTitle"), stars: $("#stars"), resStats: $("#resStats"), record: $("#record"),
    againBtn: $("#againBtn"), menuBtn: $("#menuBtn"),
  };

  const state = {
    screen: "title",
    mode: null,
    practiceGame: null,         // the game Practice mode is playing
    types: loadTypes(),         // content types ticked on the picker: "letter", "phonics", "cvc", "hfw"
    myWords: loadMyWords(),     // ⭐ MY WORDS: { on, letter: [texts], cvc: [...], hfw: [...] } (Word of the Week)
    pendingMode: null,          // the mode button pressed before the content picker
    tutorial: C.storage.get(TUTORIAL_KEY, true) !== false, // show each game once before it's played (Fun, Challenge)
    seen: new Set(),            // games whose tutorial this run has already shown
    played: new Set(),          // games played this run (no repeats: chooseRound)
    forceDemo: null,            // a game id whose tutorial the next round must show (Tutorials menu)
    picker: "practice",         // what the game grid is for: "practice" or "tutorial"
    practiceSpeed: Number(C.storage.get(PRACTICE_SPEED_KEY, 1)) || 1, // Practice difficulty (1, 1.75 or 2.5)
    bossPick: null,             // a boss picked in PICK A GAME (its final battle only); null = the full run
    adv: null,                  // 🗺️ Adventure: the level being played { island, level, games, speed, boss } (js/adventure.js)
    boss: null,                 // Boss Battle: { id, phase: levels | showdown | battle, you, them, stage, hp, hearts, last, done, scened }
    listening: C.storage.get(LISTENING_KEY, true) !== false, // listening games on (Settings)
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
    ["title", "settings", "content", "words", "practice", "howto", "play", "results"].forEach((n) => { els[n].hidden = n !== name; });
    els.askWatch.hidden = true;
    state.screen = name;
    if (name !== "play") els[name].scrollTop = 0;
    requestAnimationFrame(updateScrollbar);
    if (name !== "play" && window.Music) Music.play("menu"); // in play, each game starts its own loop (startGame)
  }

  // ---------- A scroll bar you can see ----------
  // iPad Safari hides scroll bars until you scroll, so menu screens that scroll get their own: a track
  // and thumb down the right edge, and a bouncing ⬇️ at the bottom while there's more below (tap it
  // to scroll down a screenful).
  const scrollbar = document.createElement("div");
  scrollbar.className = "scrollbar";
  scrollbar.setAttribute("aria-hidden", "true");
  scrollbar.innerHTML = '<div class="scrollthumb"></div>';
  const scrollHint = document.createElement("button");
  scrollHint.className = "scrollhint";
  scrollHint.textContent = "⬇️";
  scrollHint.setAttribute("aria-label", "Scroll down");
  document.body.append(scrollbar, scrollHint);
  function updateScrollbar() {
    const el = els[state.screen];
    const can = !!el && el.classList.contains("scroll") && !el.hidden && el.scrollHeight > el.clientHeight + 4;
    scrollbar.hidden = !can;
    scrollHint.hidden = !can || el.scrollTop >= el.scrollHeight - el.clientHeight - 24;
    if (!can) return;
    const track = scrollbar.clientHeight, thumbH = Math.max(40, (track * el.clientHeight) / el.scrollHeight);
    const y = ((track - thumbH) * el.scrollTop) / (el.scrollHeight - el.clientHeight);
    const thumb = scrollbar.firstChild;
    thumb.style.height = `${thumbH}px`;
    thumb.style.transform = `translateY(${y.toFixed(1)}px)`;
  }
  document.querySelectorAll(".screen.scroll").forEach((s) => s.addEventListener("scroll", updateScrollbar, { passive: true }));
  window.addEventListener("resize", updateScrollbar);
  scrollHint.addEventListener("click", () => {
    const el = els[state.screen];
    if (el) el.scrollBy({ top: el.clientHeight * 0.7, behavior: "smooth" });
  });
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
  // Night (ctx.nightTheme: Rock-a-Bye): a deep navy sunburst for this round only; endGame puts the theme back.
  function setNight() {
    state.night = true;
    document.documentElement.style.setProperty("--bg", "#151a45");
    document.documentElement.style.setProperty("--bg2", "#0d1133");
    document.querySelector('meta[name="theme-color"]').content = "#151a45";
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
    // MY WORDS: the types that have chosen words (letters count for ABC and PHONICS).
    if (myWordsOn()) return CONTENT_TYPES.filter((t) => chosenFor(t).length).map((t) => lists.find((l) => l.type === t)).filter(Boolean);
    return CONTENT_TYPES.filter((t) => state.types.includes(t))
      .map((t) => lists.find((l) => l.type === t)).filter(Boolean);
  }
  function listsFor(game) {
    const types = game.contentTypes || [];
    return listsInPlay().filter((l) => types.includes(l.type));
  }
  const isPractice = () => !!state.mode && state.mode.id === "practice";
  const isBoss = () => !!state.mode && state.mode.id === "boss" && !!state.boss;
  const bossFight = () => isBoss() && state.boss.phase !== "levels"; // the showdown or the final battle
  // Listening games off (Settings): games whose target is only ever spoken are left out everywhere.
  const allowed = (g) => state.listening || !g.listening;
  // Pick the content type first, so each ticked type comes up about equally often,
  // then a game that can use it (never the same game twice in a row when there's a choice).
  function chooseRound() {
    const only = isPractice() ? state.practiceGame : onlyGame;
    // 🗺️ Adventure: only that island's games (any game, if none of them can use the content in play).
    let island = state.mode && state.mode.id === "adventure" && state.adv ? state.adv.games : null;
    const usable = (g) => (!only || g.id === only) && !state.broken.has(g.id) && allowed(g) && (!island || island.includes(g.id));
    const gamesFor = (list) => C.MICROGAMES.filter((g) => usable(g) && (g.contentTypes || []).includes(list.type));
    let lists = listsInPlay().filter((l) => gamesFor(l).length);
    if (!lists.length && island) { island = null; lists = listsInPlay().filter((l) => gamesFor(l).length); }
    if (!lists.length) return null;
    // Boss Battle: the showdown picks from the games the boss can race in, and each battle stage
    // from its own short list (in order of preference), as long as the content in play suits it.
    if (bossFight()) {
      const b = state.boss, B = window.Boss.BOSSES[b.id];
      // (the showdown prefers games not played yet this run)
      const sd = C.shuffle(window.Boss.SHOWDOWN.filter((id) => id !== state.lastGame));
      const ids = b.phase === "showdown" ? [...sd.filter((id) => !state.played.has(id)), ...sd.filter((id) => state.played.has(id))] : B.stages[Math.min(2, b.stage)];
      for (const id of ids) {
        const g = C.MICROGAMES.find((x) => x.id === id);
        // (a boss version can take more content than the game itself: `bossContentTypes`, e.g. Feed Me)
        const types = (b.phase === "battle" && g && g.bossContentTypes) || (g && g.contentTypes) || [];
        const ls = g && usable(g) ? listsInPlay().filter((l) => types.includes(l.type)) : [];
        if (ls.length) { state.lastGame = g.id; state.played.add(g.id); return { game: g, list: C.pick(ls) }; }
      }
    }
    // No game twice in a run (the teacher: there are enough games now). Endless mode starts over once every game
    // has been played; elsewhere, if the content in play runs out of new games, a repeat is allowed (never the last one).
    const unplayed = (gs) => gs.filter((g) => !state.played.has(g.id));
    let freshLists = lists.filter((l) => unplayed(gamesFor(l)).length);
    if (!freshLists.length && state.mode && state.mode.id === "challenge") { state.played.clear(); freshLists = lists; }
    const list = C.pick(freshLists.length ? freshLists : lists);
    const playable = gamesFor(list);
    let fresh = unplayed(playable);
    if (!fresh.length) fresh = playable.filter((g) => g.id !== state.lastGame);
    const game = C.pick(fresh.length ? fresh : playable);
    state.lastGame = game.id;
    state.played.add(game.id);
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
    if (isPractice()) return state.practiceSpeed; // the difficulty chosen on the How to play card
    if (bossFight()) return state.boss.phase === "showdown" ? window.Boss.SPEED.showdown : window.Boss.SPEED.stages[Math.min(2, state.boss.stage)];
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
      // The difficulty shows where the round number usually is.
      const lv = T.diff.find((d) => d.speed === state.practiceSpeed) || T.diff[0];
      els.roundPill.hidden = false;
      els.roundPill.textContent = `${lv.icon} ${lv.name}`;
    } else if (bossFight()) {
      // Showdown: your wins vs the boss's. Battle: your hearts and the boss's HP.
      const b = state.boss, B = window.Boss.BOSSES[b.id];
      const dots = (n, cls) => [0, 1].map((i) => `<span class="dot${i < n ? ` ${cls}` : ""}"></span>`).join("");
      if (b.phase === "showdown") {
        els.status.innerHTML = `<span class="bs-hud">😀 ${dots(b.you, "win")} <b>VS</b> ${dots(b.them, "miss")} ${B.icon}</span>`;
        els.status.setAttribute("aria-label", T.bossShowdownLabel(b.you, b.them));
      } else {
        const hearts = [...Array(window.Boss.HEARTS)].map((_, i) => (i < b.hearts ? "❤️" : "🖤")).join("");
        const hp = [...Array(window.Boss.HP)].map((_, i) => `<span class="seg${i < b.hp ? "" : " gone"}"></span>`).join("");
        // Two separate chips, well apart: yours (YOU + red hearts) and the boss's (its icon + a bar in its colour).
        els.status.innerHTML = `<span class="bs-hud"><span class="bs-side you"><small>${T.bossYou}</small>${hearts}</span> <b>VS</b> ` +
          `<span class="bs-side boss" style="--hc:${B.color}">${B.icon}${hp}</span></span>`;
        els.status.setAttribute("aria-label", T.bossBattleLabel(b.hearts, b.hp));
      }
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
      els.roundPill.textContent = T.pointsPill(state.results.filter((r) => r.won).length); // (Endless: points, not rounds)
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
    if (state.night) { state.night = false; setTheme(state.theme); } // a night-time game (ctx.nightTheme) is over
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
    if (state.seat) { state.seat.remove(); state.seat = null; } // Boss Battle: the boss in the corner
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
    if (isBoss()) return !!state.boss.done;
    return (m.lives && state.lives <= 0) || state.results.length >= m.totalGames;
  }

  function nextRound() {
    clearRound();
    if (state.screen !== "play") return;
    if (document.hidden) { state.phase = "paused"; return; }
    if (isBoss() && !state.boss.scened && !isOver()) { // the boss's cut-scenes come before the next round
      const scenes = bossScenes();
      if (scenes.length) return playScenes(scenes);
    }
    if (isBoss()) state.boss.scened = false;
    if (isOver()) return finishRun();

    const choice = chooseRound();
    if (!choice) {
      console.error("frame: no playable microgames", { onlyGame, list: listParam, types: state.types });
      return goTitle();
    }
    const { game, list } = choice;
    state.round++;
    const speed = speedFor(state.round);
    const speedUp = speed > state.speed && !bossFight(); // boss rounds have their own SHOWDOWN / STAGE banners
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
      // Between rounds the game's loop stops and a quick "get ready" jingle plays with the ROUND banner
      // (the next game's loop starts with the round, in startGame).
      if (window.Music) Music.play(null);
      // Boss Battle: SHOWDOWN n / STAGE n instead of the round number.
      const b = state.boss, BT = window.Boss && window.Boss.TEXT;
      // Endless mode: ONE POINT! / TWO POINTS! after a win, TRY AGAIN! after a miss (GET READY! first).
      const wins = state.results.filter((r) => r.won).length, prev = state.results[state.results.length - 1];
      const endless = state.mode && state.mode.id === "challenge";
      const label = endless && !bossFight() ? (!prev ? T.getReady : prev.won ? T.points(wins) : T.tryAgain)
        : !bossFight() ? T.round(state.round) : b.phase === "showdown" ? BT.showdown(b.you + b.them + 1) : BT.stage(b.stage + 1);
      later(() => {
        // Your character pops up beside ROUND n, cheering (js/mascot.js).
        const bc = els.banner.querySelector(".banner-char");
        bc.innerHTML = "";
        if (window.Mascot) { const m = window.Mascot.el(76); window.Mascot.mood(m, "cheer"); bc.appendChild(m); }
        shout(els.banner, label, "round");
        if (window.Music) Music.jingle(state.round - 1); else C.sfx.whoosh();
      }, t);
      t += ROUND_MS;
    }
    // In the final battle a boss can have its own instruction for each stage (Baby Boss: FIND THE MILK!),
    // or null to keep the game's.
    const bi = bossFight() && state.boss.phase === "battle" && window.Boss.BOSSES[state.boss.id].instruction;
    const bossIns = Array.isArray(bi) ? bi[Math.min(2, state.boss.stage)] : bi;
    later(() => {
      // The game's picture above its title, so non-readers can tell which game is coming.
      els.banner.querySelector(".banner-icon").textContent = game.icon || "";
      shout(els.banner, bossIns || instructionFor(game, list), "instruction");
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

  // ---------- Boss Battle cut-scenes (js/boss.js) ----------
  // What to show before the next round, from what just happened (state.boss.last, set in report).
  // Also moves the run on: levels → showdown → battle, and sets `done` when it's won or lost.
  function bossScenes() {
    const b = state.boss, B = window.Boss.BOSSES[b.id], Bs = window.Boss;
    const env = { later, sfx: C.sfx, say: C.say, confetti: C.confetti };
    const last = b.last;
    b.last = null;
    const out = [];
    if (b.picked && !b.introDone) { // picked from PICK A GAME: it appears, then FINAL BATTLE!
      b.introDone = true;
      out.push((r) => Bs.intro(r, B, env), (r) => Bs.battleStart(r, B, env));
    } else if (b.phase === "levels" && !b.teased && b.levels > 0 && !state.results.length) {
      // The very start of a run: the boss you'll face is a mystery silhouette (the teacher's idea).
      b.teased = true;
      out.push((r) => Bs.tease(r, B, env));
    } else if (b.phase === "levels" && state.results.length >= b.levels) {
      b.phase = "showdown";
      out.push((r) => Bs.intro(r, B, env));
    } else if (last && last.phase === "showdown") {
      out.push((r) => Bs.score(r, B, b.you, b.them, last.won, env));
      if (b.you >= 2) { b.phase = "battle"; out.push((r) => Bs.battleStart(r, B, env)); }
      else if (b.them >= 2) { b.done = "lost"; out.push((r) => Bs.gloat(r, B, env)); }
    } else if (last && last.phase === "battle") {
      if (last.won && b.hp <= 0) { b.done = "won"; const finished = (b.id === "gorilla" && state.lastGame === "tug-of-war") || (b.id === "banana" && state.lastGame === "shield-breaker") || (b.id === "robot" && state.lastGame === "wire-cut") || (b.id === "baby" && state.lastGame === "bongo-bash"); out.push((r) => Bs.defeat(r, B, env, { finished })); } // (the finale game already sliced Banana Boss in two / blew Robot Boss up)
      else if (last.won) out.push((r) => Bs.hit(r, B, b.hp, b.stage + 1, env));
      else {
        out.push((r) => Bs.miss(r, B, b.hp, b.hearts, env));
        if (b.hearts <= 0) { b.done = "lost"; out.push((r) => Bs.gloat(r, B, env)); }
      }
    }
    return out;
  }
  function playScenes(scenes) {
    state.phase = "transition";
    setBar(1);
    renderHud();
    if (window.Music) Music.play(`boss-${state.boss.id}`);
    // One after another; then on to the round (or the end of the run).
    const queue = scenes.slice();
    function next() {
      if (state.screen !== "play") return;
      const s = queue.shift();
      if (!s) { state.boss.scened = true; return nextRound(); }
      els.game.innerHTML = "";
      let ms = 1500;
      try { ms = s(els.game); } catch (err) { console.error("boss scene:", err); }
      later(() => whenQuiet(next), ms); // let the boss finish its line first (it used to be cut off)
    }
    next();
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
    const wait = (ms) => new Promise((done) => ctx.later(done, ms / DEMO_PACE));
    // Glide the fingertip to a (possibly moving) target over `ms`.
    const glide = (t, ms) => new Promise((done) => {
      ms /= DEMO_PACE;
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
      // A named element always gets the press, even if something else is under the fingertip for a
      // moment (a sign mid-flip, a moving target): the demo must never miss what it means to hit.
      const target = elementOf(t);
      down = hitAt(at, target);
      if (target && !(down && target.contains(down))) down = target;
      if (down) fire("pointerdown", down, at);
    };
    const release = () => {
      finger.classList.remove("press");
      if (down) fire("pointerup", down, at);
      down = null;
    };
    // Drag from where the finger is to t over ms, with a pointermove every frame.
    const sweep = (t, ms) => new Promise((done) => {
      ms /= DEMO_PACE;
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

  // Time used so far in the round, leaving out any pause (ctx.pauseTimer): during a pause it holds still,
  // and once the pause is over its length is added to t0 for good.
  function settlePause(c, now) {
    if (c.pauseTo && now >= c.pauseTo) { c.t0 += c.pauseTo - c.pauseFrom; c.pauseTo = 0; }
  }
  function elapsedOf(c, now) {
    settlePause(c, now);
    return (c.pauseTo ? c.pauseFrom : now) - c.t0;
  }

  // A round's items: shuffled, with one picture picked for items that have several (`pics`), so "A" can be
  // apple, ant or arrow (pickOptions uses these same objects).
  // ⭐ MY WORDS: the chosen words go first, so every target is one of them (games take targets from the
  // front); the rest of the list stays behind them for the wrong answers. C.focus lets choiceSteps reuse
  // the chosen words before it reaches the others. (Versus uses this too.)
  function prepItems(list) {
    let items = C.shuffle(list.items.map((it) => (it.pics && it.pics.length ? { ...it, ...C.pick(it.pics) } : it)));
    C.focus = null;
    if (myWordsOn()) {
      const mine = new Set(chosenFor(list.type));
      if (mine.size) {
        items = [...items.filter((it) => mine.has(it.text)), ...items.filter((it) => !mine.has(it.text))];
        C.focus = mine;
      }
    }
    return items;
  }

  function startGame(game, list, opts = {}) {
    const token = ++state.token;
    const alive = () => token === state.token;
    const demo = !!opts.demo;
    const speed = demo ? 1 : state.speed; // demos always play at 1×, so they're easy to follow
    // A boss version of a game can have its own time limit (`bossDuration`: Wire Cut's robot finale needs 3 cuts).
    const bossDur = !demo && bossFight() && state.boss.phase === "battle" && game.bossDuration;
    const paceMs = Math.round((bossDur || game.duration || BASE_MS) / speed);
    const timeLimit = demo ? Math.max(paceMs, 20000) : Math.max(paceMs, warmupMsFor(state.round));
    state.reported = false;
    state.gameActive = true;
    state.phase = demo ? "demo" : "playing";
    if (window.Music) Music.play(game.id); // its own chiptune loop (js/music.js)
    // The clock starts after the start lock, so the lock doesn't eat into the time limit.
    state.current = { game, timeLimit, t0: performance.now() + START_LOCK_MS, onTimeout: [], onEnd: [], demo };

    // Items with several pictures (`pics`) get one picked at random for this round,
    // so "A" can be apple, ant or arrow. pickOptions uses these same objects.
    let items = prepItems(list);
    // After a demo, the demo's answer goes to the back, so the child's round has a different one
    // (games take their target from the front of ctx.items).
    if (opts.avoid && opts.avoid.size) {
      const keep = items.filter((it) => !opts.avoid.has(it.text)), back = items.filter((it) => opts.avoid.has(it.text));
      // (with MY WORDS, the demo's word only goes behind the other chosen words, not behind the whole list)
      const nMine = C.focus ? keep.filter((it) => C.focus.has(it.text)).length : keep.length;
      items = C.focus && nMine ? [...keep.slice(0, nMine), ...back, ...keep.slice(nMine)] : [...keep, ...back];
    }
    const ctx = {
      root: els.game,
      items,
      list: { id: list.id, type: list.type },
      speed,
      timeLimit,
      demo,         // true while the game plays itself in the tutorial
      boss: bossFight() ? { id: state.boss.id, phase: state.boss.phase } : null, // Boss Battle (Dance Off shows the robot)
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
      canSpeak: C.canSpeak && state.listening, // listening games off (Settings): games show their target instead of only saying it
      get ended() { return !alive() || state.reported; },
      say: (text) => { if (alive()) C.say(text); },
      sfx: C.sfx,
      win: () => report(token, true),
      lose: () => report(token, false),
      onTimeout: (fn) => { if (alive() && state.current) state.current.onTimeout.push(fn); },
      // Called once with (won, timedOut) when the result is in (Boss.rival uses it for the boss's reaction).
      onEnd: (fn) => { if (alive() && state.current) state.current.onEnd.push(fn); },
      // How far through the time limit we are, 0..1 (0 during the start lock and the reveal; stops at a freeze).
      timeFrac: () => {
        const c = state.current;
        if (!alive() || !c || demo) return 0;
        return Math.max(0, Math.min(1, elapsedOf(c, c.frozenAt || performance.now()) / c.timeLimit));
      },
      // Stop the clock: the player's choice is made and the game is only animating the outcome
      // (Pachinko's falling ball). The game must still call win() or lose() itself.
      // Stop the clock for a beat (ms), then let it carry on: rhythm games use it between targets, while
      // the next one is shown and said. The timer bar holds still meanwhile.
      pauseTimer: (ms) => {
        const c = state.current;
        if (!alive() || state.reported || !c || c.frozenAt || demo) return;
        const now = performance.now();
        settlePause(c, now);
        c.pauseFrom = now; c.pauseTo = now + ms;
      },
      // A night-time round (Rock-a-Bye): the whole screen goes dark navy until the round ends.
      nightTheme: () => { if (alive()) setNight(); },
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
      // The power bar (js/power.js): press and hold (or tap, tap) to shoot with short / medium / strong power.
      // opts: { parent, press, onRelease(zone, level), onStart, icon }. Cleared with the round (ctx.raf).
      powerBar: (o) => window.PowerBar.create({ raf: ctx.raf, sfx: C.sfx, speed, ended: () => ctx.ended, ...o }),
      confetti: C.confetti,
      shuffle: C.shuffle,
      pick: C.pick,
      pickOptions: (target, n) => C.pickOptions(items, target, n),
      lowerLookalikes: (target) => C.lowerLookalikes(items, target), // letters whose lowercase looks like target's (b → d, p, h)
      // R rows of N options, one right per row (sequence games). See Core.choiceRows.
      choiceRows: (R, N, opts = {}) => C.choiceRows(items, list.type, R, N, { canSpeak: C.canSpeak && state.listening, ...opts }),
      // R steps of N options, each step with a different target (rhythm games). See Core.choiceSteps.
      choiceSteps: (R, N, opts = {}) => C.choiceSteps(items, list.type, R, N, { canSpeak: C.canSpeak && state.listening, ...opts }),
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
      }, Math.max(300, revealMs + 150));
      ctx.later(() => report(token, false), DEMO_MAX_MS);
      return; // no clock in a demo
    }
    if (state.reported) return; // the game reported straight away

    // Boss Battle: in the showdown the game puts the boss into its own scene (`bossRival`: Boss.rival);
    // a game without that gets the boss in the corner with a race bar (a third of the time at a time;
    // full = it got there first). In a battle game that doesn't draw the boss itself (`bossArt`), it
    // watches from the corner: Baby Boss wails until a 🍼 flies to it.
    let seat = null;
    const showdown = bossFight() && state.boss.phase === "showdown";
    if (bossFight() && (showdown ? !game.bossRival : !(game.bossArt && window.Boss.fighting(ctx)))) {
      seat = window.Boss.seat(els.game.parentElement, state.boss.id, state.boss.phase === "showdown", C.sfx);
      state.seat = seat;
    }
    let lastSec = Infinity;
    const tick = () => {
      if (!alive() || state.reported || state.current.frozenAt) return;
      const elapsed = elapsedOf(state.current, performance.now());
      setBar(Math.min(1, 1 - elapsed / timeLimit));
      if (seat) seat.progress(elapsed / timeLimit);
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
    const { game, timeLimit, t0, onTimeout, onEnd } = state.current;
    const timeMs = Math.max(0, Math.round(Math.min(elapsedOf(state.current, state.current.frozenAt || performance.now()), timeLimit)));
    els.game.classList.add("locked");
    state.results.push({ gameId: game.id, won, timedOut, timeMs, timeLimit, speed: state.speed });
    if (window.Mascot) window.Mascot.played(game.id); // (Zebra: play lots of different games)
    // Boss Battle: keep the showdown score / the battle's HP and hearts (the cut-scenes follow in nextRound).
    const bossRound = bossFight();
    if (bossRound) {
      const b = state.boss;
      b.last = { phase: b.phase, won };
      if (b.phase === "showdown") { if (won) b.you++; else b.them++; }
      else if (won) { b.hp--; b.stage++; }
      else b.hearts--;
      if (state.seat) { if (timedOut) state.seat.progress(1); state.seat.result(won); }
    }
    if (timedOut) {
      setBar(0);
      onTimeout.forEach((fn) => guard(`${game.id} onTimeout`, fn));
    }
    onEnd.forEach((fn) => guard(`${game.id} onEnd`, () => fn(won, timedOut)));

    const loseLife = !won && state.mode.lives > 0;
    if (loseLife) state.lives--;
    if (won) C.sfx.happy(); else C.sfx.buzz();
    vibrate(won ? 30 : [60, 40, 60]);
    renderHud(loseLife);

    later(() => shout(els.stamp, won ? T.correct : timedOut ? (bossRound ? T.bossWinsStamp : T.timeout) : T.wrong, won ? "good" : "bad"), STAMP_DELAY_MS);
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
    if (isBoss()) {
      const won = state.boss.done === "won";
      els.game.innerHTML = "";
      shout(els.banner, won ? T.bossWin : T.bossLose, "end");
      if (won) C.sfx.fanfare(); else C.sfx.buzz();
      later(showResults, END_MS);
      return;
    }
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
    const run = { mode: m.id, cleared }; // what this run did, for character unlocks (js/mascot.js)
    let happyEnd = true;         // your character cheers (or is sad, after a lost boss battle)

    if (m.id === "fun") {
      const stars = window.SCORING.stars(cleared, m.totalGames);
      run.stars = stars;
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
    } else if (m.id === "adventure") {
      // 🗺️ An Adventure level: a star per game won (0 means try again), saved on the player's map.
      const stars = Math.min(3, cleared);
      els.resTitle.textContent = stars ? T.funTitle[stars] : T.advRetry;
      els.stars.hidden = false;
      els.stars.setAttribute("aria-label", T.starsLabel(stars));
      els.stars.innerHTML = [0, 1, 2].map((i) => `<span class="star ${i < stars ? "on" : "off"}" style="animation-delay:${0.3 + i * 0.3}s">★</span>`).join("");
      for (let i = 0; i < stars; i++) later(() => C.sfx.star(i), 300 + i * 300);
      els.resStats.innerHTML = statRow("✅", T.stats.cleared, `${cleared} / ${m.totalGames}`);
      if (state.adv && window.Adventure) window.Adventure.record(state.adv, stars);
      happyEnd = stars > 0;
      C.say(stars ? T.spoken.stars[stars] : T.spoken.advRetry);
    } else if (m.id === "boss") {
      // Boss Battle: levels cleared, the showdown score, and the collection of bosses beaten so far.
      const b = state.boss, B = window.Boss.BOSSES[b.id], won = b.done === "won";
      const beaten = new Set(C.storage.get(BOSS_KEY, []) || []);
      if (won) { beaten.add(b.id); C.storage.set(BOSS_KEY, [...beaten]); }
      if (won) run.bossWon = b.id;
      if (won && state.adv && window.Adventure) window.Adventure.record(state.adv, 3); // 🗺️ an island's boss beaten
      run.bossesBeaten = [...beaten];
      happyEnd = won;
      const levels = results.slice(0, b.levels).filter((r) => r.won).length;
      els.resTitle.textContent = won ? T.bossResWin(B.name) : T.bossResLose;
      const shelf = window.Boss.IDS.map((id) => (beaten.has(id) ? window.Boss.BOSSES[id].icon : "❔")).join("");
      els.resStats.innerHTML =
        (b.picked ? "" : statRow("✅", T.stats.levels, `${levels} / ${b.levels}`)) +
        (b.you + b.them ? statRow("⚔️", T.stats.showdown, `${b.you} – ${b.them}`) : "") +
        statRow("👑", T.stats.bosses, `<span class="res-bosses">${shelf}</span>`);
      if (won) later(C.sfx.fanfare, 400);
      C.say(won ? T.spoken.bossWin : T.spoken.bossLose);
    } else {
      const score = window.SCORING.speedScore(results);
      run.score = score;
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
    // (🗺️ Adventure: MAP instead of MENU)
    els.menuBtn.innerHTML = state.adv ? `🗺️ <span>${T.map}</span>` : `🏠 <span>${T.menu}</span>`;
    restartAnim(els.resTitle);
    // Your character at the top: the victory cheer at the end of every run (the teacher asked for it), then any
    // new characters this run unlocked (NEW CHARACTER!).
    els.resChar.innerHTML = "";
    if (window.Mascot) {
      const me = window.Mascot.el(Math.min(96, innerHeight * 0.13));
      window.Mascot.mood(me, happyEnd ? "cheer" : "sad");
      els.resChar.appendChild(me);
      if (happyEnd) later(() => {
        [392, 523, 659, 784].forEach((f, i) => C.sfx.tone(f, 0.12, "square", 0.07, i * 0.09));
        C.sfx.tone(1047, 0.35, "triangle", 0.09, 0.36);
        C.confetti(els.results, els.results.clientWidth / 2, 120, { count: 80 });
      }, 250);
      const fresh = window.Mascot.checkUnlocks(run);
      if (fresh.length) later(() => window.Mascot.celebrate(fresh, renderCharBtn), 2600);
    }
  }

  // ---------- Navigation ----------
  function startMode(id) {
    C.unlock();
    C.say(T.spoken.ready); // also unlocks speech on iOS (must happen inside a tap)
    clearRound();
    const mode = window.MODES[id];
    Object.assign(state, {
      mode, round: 0, lives: mode.lives, speed: 1, results: [], lastGame: null, phase: "transition", seen: new Set(), played: new Set(),
    });
    if (id === "adventure" && state.adv) state.speed = state.adv.speed || 1; // (later levels on an island are a bit faster)
    // Boss Battle: a random boss waits at the end (?boss=banana|baby|robot picks one, for testing).
    const q = new URLSearchParams(location.search), bossParam = q.get("boss");
    state.boss = id !== "boss" ? null : {
      id: window.Boss.IDS.includes(bossParam) ? bossParam : C.pick(window.Boss.IDS),
      levels: Math.max(0, parseInt(new URLSearchParams(location.search).get("levels"), 10)) || window.Boss.LEVELS, // ?levels=1 for testing
      phase: q.get("phase") === "battle" ? "battle" : "levels", // ?phase=battle&stage=2 starts in the final battle (testing)
      you: 0, them: 0, stage: Math.min(2, Math.max(0, (parseInt(q.get("stage"), 10) || 1) - 1)), hp: 0,  hearts: window.Boss.HEARTS, last: null, done: null, scened: false,
    };
    if (state.boss) state.boss.hp = window.Boss.HP - state.boss.stage; // (a battle started at stage 2 has already lost one)
    if (state.boss && q.get("phase") === "showdown") state.boss.levels = 0; // ?phase=showdown (testing; add &game=fishing for one game)
    // PICK A GAME → BOSS BATTLE: that boss, straight into its final battle (no levels, no showdown).
    if (state.boss && state.bossPick) Object.assign(state.boss, { id: state.bossPick, phase: "battle", stage: 0, hp: window.Boss.HP, picked: true });
    showScreen("play");
    setBar(1);
    renderHud();
    later(nextRound, START_DELAY_MS);
  }

  function goTitle() {
    clearRound();
    state.adv = null;
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
      if (myWordsOn()) { b.classList.add("by-words"); b.disabled = true; } // (MY WORDS decides the types)
      els.contentGrid.appendChild(b);
    });
    renderMyWordsBox();
  }

  // ---------- ⭐ MY WORDS (Word of the Week) ----------
  // In Settings (the teacher moved it there, so kids don't switch it by accident): a MY WORDS switch and CHOOSE
  // WORDS. While it's on, every target comes from the chosen words; the content picker only shows a note and
  // greys the type toggles (the chosen words decide which types play).
  function renderMyWordsBox() {
    els.myWordsNote.hidden = !myWordsOn();
    els.myWordsNote.textContent = `⭐ ${T.myWordsOn} (${T.wordsCount(chosenCount())})`;
  }
  function renderMyWordsSetting() {
    const on = myWordsOn(), n = chosenCount();
    els.myWordsBtn.setAttribute("aria-pressed", String(on));
    els.myWordsBtn.textContent = on ? T.on : T.off;
    els.myWordsSetNote.textContent = n ? `${T.myWords.label} · ${T.wordsCount(n)}` : T.wordsNone;
  }
  els.myWordsBtn.addEventListener("click", () => {
    C.unlock();
    if (!chosenCount()) { showWords(); return; } // nothing chosen yet: choose some first
    state.myWords.on = !state.myWords.on;
    saveMyWords();
    C.sfx.tone(state.myWords.on ? 660 : 440, 0.08);
    renderMyWordsSetting();
  });
  els.wordsEditBtn.addEventListener("click", () => { C.unlock(); showWords(); });
  // The word chooser: every letter, CVC word and sight word as a chip to tick.
  function showWords() {
    const lists = window.WORD_LISTS || [];
    els.wordsGrid.innerHTML = "";
    // QUICK SETS (T.wordsSetGroups): tricky sounds (L vs R…: every letter, CVC word and sight word starting with
    // those letters), word groups (numbers, colours, action words…: named words from any list) and CVC words by
    // vowel. One tap adds the whole set; a tap when it's all in takes it out again.
    const setWords = (s) => ["letter", "cvc", "hfw"].map((type) => {
      const list = lists.find((l) => l.type === type);
      const fits = (it) => (s.letters ? s.letters.includes(it.text.charAt(0).toUpperCase())
        : s.vowel ? type === "cvc" && it.text.charAt(1) === s.vowel
        : type !== "letter" && s.words.includes(it.text));
      return [type, list ? list.items.filter(fits).map((it) => it.text) : []];
    });
    const setOn = (s) => { const all = setWords(s); return all.some(([, ws]) => ws.length) && all.every(([type, ws]) => ws.every((w) => state.myWords[type].includes(w))); };
    T.wordsSetGroups.forEach((g) => {
      const sh = document.createElement("h2");
      sh.className = "grid-head";
      sh.textContent = g.head;
      const sets = document.createElement("div");
      sets.className = "words-grid sets";
      g.sets.forEach((s) => {
        const b = document.createElement("button");
        b.className = "word-chip set";
        b.textContent = s.name;
        b.setAttribute("aria-pressed", String(setOn(s)));
        b.addEventListener("click", () => {
          const on = setOn(s);
          setWords(s).forEach(([type, ws]) => {
            state.myWords[type] = on ? state.myWords[type].filter((w) => !ws.includes(w)) : [...new Set([...state.myWords[type], ...ws])];
          });
          if (!on) state.myWords.on = true;
          C.sfx.tone(on ? 420 : 700, 0.08);
          saveMyWords();
          const y = els.words.scrollTop;
          showWords();
          els.words.scrollTop = y;
        });
        sets.appendChild(b);
      });
      els.wordsGrid.append(sh, sets);
    });
    ["letter", "cvc", "hfw"].forEach((type) => {
      const list = lists.find((l) => l.type === type);
      if (!list) return;
      const head = document.createElement("h2");
      head.className = "grid-head";
      head.textContent = T.wordsSections[type];
      const grid = document.createElement("div");
      grid.className = `words-grid ${type}`;
      list.items.forEach((it) => {
        const c = document.createElement("button");
        c.className = "word-chip";
        const on = state.myWords[type].includes(it.text);
        c.setAttribute("aria-pressed", String(on));
        c.textContent = type === "letter" ? `${it.text} ${it.text.toLowerCase()}` : it.text;
        if (type === "cvc" && it.emoji) c.insertAdjacentHTML("afterbegin", `<span class="em" aria-hidden="true">${it.emoji}</span>`);
        else if (type === "cvc") c.title = T.wordsNoPic;
        c.addEventListener("click", () => {
          const set = state.myWords[type];
          const i = set.indexOf(it.text);
          if (i >= 0) set.splice(i, 1); else set.push(it.text);
          c.setAttribute("aria-pressed", String(i < 0));
          if (i < 0) { state.myWords.on = true; C.say(it.say || it.text); }
          C.sfx.tone(i < 0 ? 700 : 420, 0.06);
          saveMyWords();
          updateWordsCount();
        });
        grid.appendChild(c);
      });
      els.wordsGrid.append(head, grid);
    });
    updateWordsCount();
    showScreen("words");
  }
  function updateWordsCount() { els.wordsCount.textContent = T.wordsCount(chosenCount()); }
  els.wordsDoneBtn.addEventListener("click", () => { renderSettings(); showScreen("settings"); }); // (back to Settings)
  els.wordsClearBtn.addEventListener("click", () => {
    state.myWords.letter = []; state.myWords.cvc = []; state.myWords.hfw = []; state.myWords.on = false;
    saveMyWords();
    showWords();
  });

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
    else if (state.pendingMode === "versus") { clearRound(); window.Versus.open(); }
    else if (state.pendingMode === "adventure") { clearRound(); window.Adventure.open(); } // (🌍 the world map)
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
    C.MICROGAMES.filter((g) => !state.broken.has(g.id) && allowed(g) && listsFor(g).length && (!tut || g.tutorial)).forEach((game) => {
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
    // PICK A GAME: a Boss Battle section, one card per boss, straight into that boss's final battle.
    if (!tut && window.Boss) {
      const head = document.createElement("h2");
      head.className = "grid-head";
      head.textContent = T.bossSection;
      els.practiceGrid.appendChild(head);
      window.Boss.IDS.forEach((id) => {
        const B = window.Boss.BOSSES[id];
        const b = document.createElement("button");
        b.className = "game-card boss-card";
        b.style.setProperty("--bc", B.color);
        const ico = window.Boss.el(id, 64);
        ico.classList.add("mini");
        const name = document.createElement("span");
        name.textContent = B.name;
        b.append(ico, name);
        b.addEventListener("click", () => { state.bossPick = id; startMode("boss"); });
        els.practiceGrid.appendChild(b);
      });
    }
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
    renderDiff();
    showScreen("howto");
  }


  // ---------- Practice difficulty: three speeds from Challenge mode ----------
  function renderDiff() {
    els.diffRow.setAttribute("aria-label", T.diffLabel);
    els.diffRow.innerHTML = "";
    T.diff.forEach((d) => {
      const b = document.createElement("button");
      b.className = "diff-btn";
      b.setAttribute("aria-pressed", String(d.speed === state.practiceSpeed));
      b.innerHTML = `<span class="ico" aria-hidden="true">${d.icon}</span><span></span>`;
      b.lastChild.textContent = d.name;
      b.addEventListener("click", () => {
        C.unlock();
        state.practiceSpeed = d.speed;
        C.storage.set(PRACTICE_SPEED_KEY, d.speed);
        C.sfx.tone(440 + d.speed * 160, 0.08);
        renderDiff();
      });
      els.diffRow.appendChild(b);
    });
  }
  function quitPlay() {
    if (state.adv && window.Adventure) { clearRound(); window.Adventure.open(state.adv.island); return; } // 🗺️ back to the map
    if (isPractice() || (isBoss() && state.boss.picked)) showPractice("practice"); else goTitle();
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
  // Any tap unlocks (or resumes) audio: iOS needs a real tap, and can suspend audio in the background.
  document.addEventListener("pointerdown", () => C.unlock(), { capture: true });
  els.funBtn.addEventListener("click", () => chooseContent("fun"));
  els.bossBtn.addEventListener("click", () => { state.bossPick = null; chooseContent("boss"); }); // the full run, with a random boss
  els.challengeBtn.addEventListener("click", () => chooseContent("challenge"));
  els.practiceBtn.addEventListener("click", () => chooseContent("practice"));
  els.versusBtn.addEventListener("click", () => chooseContent("versus")); // ⚔️ two players, side by side (js/versus.js)
  els.adventureBtn.addEventListener("click", () => chooseContent("adventure")); // 🗺️ the map (js/adventure.js)
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
  // ---------- Settings: music on/off and volume, listening games on/off ----------
  const musicBtn = $("#musicBtn"), musicVol = $("#musicVol"), listeningBtn = $("#listeningBtn");
  function renderSettings() {
    const musicOn = !(window.Music && Music.muted);
    musicBtn.setAttribute("aria-pressed", String(musicOn));
    musicBtn.textContent = musicOn ? T.on : T.off;
    musicVol.value = String(Math.round((window.Music ? Music.volume : 0.4) * 100));
    musicVol.disabled = !musicOn;
    listeningBtn.setAttribute("aria-pressed", String(state.listening));
    listeningBtn.textContent = state.listening ? T.on : T.off;
    if (window.Players) window.Players.renderManager(els.playersBox, renderCharBtn);
    renderMyWordsSetting();
  }
  musicBtn.addEventListener("click", () => {
    C.unlock();
    if (window.Music) Music.setMuted(!Music.muted);
    C.sfx.tone(660, 0.08);
    renderSettings();
  });
  musicVol.addEventListener("input", () => { if (window.Music) Music.setVolume(Number(musicVol.value) / 100); });
  listeningBtn.addEventListener("click", () => {
    state.listening = !state.listening;
    C.storage.set(LISTENING_KEY, state.listening);
    C.sfx.tone(state.listening ? 660 : 440, 0.08);
    renderSettings();
  });
  els.settingsBtn.addEventListener("click", () => { renderSettings(); showScreen("settings"); });
  // ---------- Characters (js/mascot.js) ----------
  // The title menu's 👤 button shows your character; tap it to choose another.
  function renderCharBtn() {
    if (!window.Mascot) return;
    // The title menu's player chip: who's playing (tap to switch). Only when there's more than one save.
    if (window.Players) {
      const p = window.Players.active();
      els.playerBtn.hidden = !p; // (always: it's also how a new player is added)
      if (p) {
        const fig = els.playerBtn.querySelector(".fig");
        fig.innerHTML = "";
        fig.appendChild(window.Mascot.el(34));
        els.playerBtn.querySelector(".nm").textContent = p.name;
      }
    }
    const mini = els.charBtn.querySelector(".char-mini");
    mini.innerHTML = "";
    mini.appendChild(window.Mascot.el(38));
  }
  els.playerBtn.addEventListener("click", () => { C.unlock(); window.Players.openPicker({ onDone: playerReady }); });
  // After WHO'S PLAYING?: their character on the menu; a brand-new player picks one first.
  function playerReady() {
    renderCharBtn();
    if (window.Mascot && !window.Mascot.chosen()) window.Mascot.openPicker({ onDone: renderCharBtn });
  }
  els.charBtn.addEventListener("click", () => { C.unlock(); window.Mascot.openPicker({ onDone: renderCharBtn }); });
  els.resetCharsBtn.addEventListener("click", () => { // Settings: start the characters over (unlocks and the choice)
    window.Mascot.reset();
    renderCharBtn();
    els.resetCharsBtn.textContent = T.resetCharsDone;
    later(() => { els.resetCharsBtn.textContent = T.resetChars; }, 1800);
  });
  els.backBtn.addEventListener("click", () => showScreen("title"));
  els.quitBtn.addEventListener("click", quitPlay);
  els.againBtn.addEventListener("click", () => (state.mode.id === "practice" ? startMode("practice") : askWatch(state.mode.id)));
  // (🗺️ Adventure: MAP goes back to the map instead)
  els.menuBtn.addEventListener("click", () => { if (state.adv && window.Adventure) { clearRound(); window.Adventure.open(); } else goTitle(); });


  // ---------- No accidental zooming ----------
  // iPad Safari ignores user-scalable=no, so block its pinch gestures, double-tap zoom and
  // two-finger zoom in code (touch-action: manipulation in the CSS covers the rest).
  ["gesturestart", "gesturechange", "gestureend"].forEach((t) => document.addEventListener(t, (e) => e.preventDefault(), { passive: false }));
  document.addEventListener("dblclick", (e) => e.preventDefault(), { passive: false });
  document.addEventListener("touchmove", (e) => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
  let lastTouchEnd = 0;
  document.addEventListener("touchend", (e) => {
    const now = Date.now();
    if (now - lastTouchEnd < 300 && !e.target.closest("input, select, textarea")) e.preventDefault(); // a quick second tap: no zoom
    lastTouchEnd = now;
  }, { passive: false });
  // ---------- Boot: load the games listed in games/manifest.js ----------
  function ready() {
    els.loading.hidden = true;
    if (!C.MICROGAMES.length) {
      els.loading.textContent = T.noGames;
      els.loading.hidden = false;
      return;
    }
    els.funBtn.disabled = els.bossBtn.disabled = els.challengeBtn.disabled = els.practiceBtn.disabled = els.tutorialsBtn.disabled = els.versusBtn.disabled = els.adventureBtn.disabled = false;
    // WHO'S PLAYING? when the iPad has more than one save; a new player (or the very first run) picks a character.
    if (window.Players && window.Players.list().length > 1) window.Players.openPicker({ onDone: playerReady });
    else playerReady();
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
  // For js/versus.js: what to play, and the screens.
  window.FrameAPI = {
    listsInPlay, allowed, prepItems, showScreen, setTheme, goTitle, renderCharBtn,
    // 🗺️ Adventure: play a level (3 of the island's games) or its boss (that boss's final battle).
    playLevel: (adv) => { state.adv = adv; state.bossPick = null; startMode("adventure"); },
    playBoss: (adv) => { state.adv = adv; state.bossPick = adv.boss; startMode("boss"); },
    canSpeak: () => C.canSpeak && state.listening,
    hideAll: () => { ["title", "settings", "content", "words", "practice", "howto", "play", "results"].forEach((n) => { els[n].hidden = true; }); state.screen = "versus"; updateScrollbar(); },
  };
  showScreen("title");
})();
