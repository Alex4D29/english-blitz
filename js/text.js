// Every piece of UI text the frame shows or says, keyed so a Japanese (`ja`)
// version can be added later. Microgames keep their own TEXT objects.
// Static markup gets its text from `data-text="key"` (and aria labels from `data-label="key"`).
window.TEXT = {
  title: "ENGLISH\nBLITZ!",            // working title — rename freely
  fun: "FUN\nMODE",
  challenge: "CHALLENGE\nMODE",
  boss: "BOSS\nBATTLE",
  practice: "PICK A GAME",              // (Practice mode in the code)
  // One line under each title-menu button
  funDesc: "10 games, no pressure",
  challengeDesc: "4 lives. It gets faster!",
  bossDesc: "10 games, then beat a boss!",
  practiceDesc: "Play one game you like",
  tutorialsDesc: "Watch how each game works",
  tutorials: "TUTORIALS",
  pickTutorial: "Pick a game to watch!",
  pickGame: "Tap a game to play it!",
  bossSection: "👑 BOSS BATTLE",       // PICK A GAME: a section with one card per boss (its final battle)
  whatToPlay: "WHAT TO\nPLAY?",
  pickContent: "Pick one or more!",
  // Content picker: one toggle per list type, in this order.
  content: {
    letter: { name: "ABC", sample: "A b C", label: "Letters" },
    phonics: { name: "PHONICS", sample: "a 🍎", label: "First sounds" },
    cvc: { name: "CVC", sample: "cat 🐱", label: "CVC words" },
    hfw: { name: "HFW", sample: "the", label: "Sight words" },
  },

  // 👀 Watch first? pop-up after PLAY in Fun and Challenge.
  askWatch: "WATCH\nFIRST?",
  watchYes: "WATCH FIRST",
  watchNo: "JUST PLAY",
  watch: "WATCH!",                    // banner before a game's tutorial
  watchPill: "👀 TUTORIAL 👀",         // fills the top bar while the game plays itself
  yourTurn: "YOUR\nTURN!",             // banner after it
  howToPlay: "HOW TO PLAY",
  tips: "Tips",
  play: "PLAY",
  helpLabel: "How to play",
  practiceScore: (won, played) => `✅ ${won} / ${played}`,
  practiceScoreLabel: (won, played) => `${won} cleared out of ${played}`,
  // Practice difficulty (speeds from Challenge mode: it starts at 1× and tops out at 2.5×)
  diffLabel: "How fast?",
  diff: [
    { icon: "🐢", name: "EASY", speed: 1 },
    { icon: "🐇", name: "MEDIUM", speed: 1.75 },
    { icon: "🚀", name: "HARD", speed: 2.5 },
  ],
  settings: "SETTINGS",
  musicLabel: "Music",
  musicVolLabel: "Music volume",
  listeningLabel: "Listening games",
  listeningNote: "Off: games where you only hear the answer (Treasure Dig, Penalty Kick, Monster Boxing) are left out, and the other games show the answer instead of only saying it. Good for a noisy room or no speakers.",
  on: "ON",
  off: "OFF",
  back: "BACK",
  loading: "Loading…",
  noGames: "No games found 😢",
  quit: "Back to menu",

  round: (n) => `ROUND\n${n}`,
  roundPill: (n) => `🏁 ${n}`,
  speedUp: "SPEED\nUP!",
  finish: "FINISH!",
  gameOver: "GAME\nOVER!",
  correct: "YES!",
  wrong: "NOPE!",
  timeout: "TOO\nSLOW!",
  livesLabel: (n) => `${n} lives left`,
  progressLabel: (n, total) => `Game ${n} of ${total}`,
  // Shown under each game's instruction so kids know whether to tap or drag.
  input: { tap: "TAP!", drag: "DRAG!", slice: "SLICE!" },
  inputIcon: "👆",

  again: "PLAY AGAIN",
  menu: "MENU",
  funTitle: { 1: "GOOD\nTRY!", 2: "GREAT!", 3: "AMAZING!" },
  challengeTitle: "WELL\nDONE!",
  newRecord: "NEW HIGH SCORE!",
  starsLabel: (n) => `${n} of 3 stars`,
  stats: { cleared: "Cleared", accuracy: "Accuracy", speed: "Speed", best: "Best", levels: "Levels", showdown: "Showdown", bosses: "Bosses beaten" },
  // Boss Battle (js/boss.js has the bosses' own lines)
  bossWin: "BOSS\nBEATEN!",
  bossLose: "THE BOSS\nWINS!",
  bossResWin: (name) => `YOU BEAT\n${name}!`,
  bossResLose: "SO\nCLOSE!",
  bossWinsStamp: "BOSS\nWINS!",
  bossShowdownLabel: (you, them) => `You ${you}, boss ${them}`,
  bossBattleLabel: (hearts, hp) => `${hearts} hearts left, boss has ${hp} left`,

  spoken: {
    ready: "Let's go!",
    watch: "Watch me!",
    yourTurn: "Your turn!",
    askWatch: "Do you want to watch first?",
    stars: { 1: "Good try!", 2: "Great job!", 3: "Amazing!" },
    done: "Well done!",
    record: "New high score!", // not "new record": TTS stresses "record" like the verb
    bossWin: "You beat the boss! Amazing!",
    bossLose: "So close! Try again!",
  },
};
