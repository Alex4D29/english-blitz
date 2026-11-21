// Every piece of UI text the frame shows or says, keyed so a Japanese (`ja`)
// version can be added later. Microgames keep their own TEXT objects.
// Static markup gets its text from `data-text="key"` (and aria labels from `data-label="key"`).
window.TEXT = {
  title: "ENGLISH\nBLITZ!",            // working title — rename freely
  fun: "FUN\nMODE",
  challenge: "CHALLENGE\nMODE",
  practice: "PRACTICE",
  tutorials: "TUTORIALS",
  pickTutorial: "Pick a game to watch!",
  pickGame: "Pick a game!",
  whatToPlay: "WHAT TO\nPLAY?",
  pickContent: "Pick one or more!",
  // Content picker: one toggle per list type, in this order.
  content: {
    letter: { name: "ABC", sample: "A b C", label: "Letters" },
    phonics: { name: "PHONICS", sample: "a 🍎", label: "First sounds" },
    cvc: { name: "CVC", sample: "cat 🐱", label: "CVC words" },
    hfw: { name: "HFW", sample: "the", label: "Sight words" },
  },
  // Tutorial toggle on the content picker (Fun and Challenge only): new games are shown first.
  tutorial: { name: "TUTORIAL", label: "Watch new games first", sample: "👀" },
  watch: "WATCH!",                    // banner before a game's tutorial
  watchPill: "👀 TUTORIAL 👀",         // fills the top bar while the game plays itself
  yourTurn: "YOUR\nTURN!",             // banner after it
  howToPlay: "HOW TO PLAY",
  tips: "Tips",
  play: "PLAY",
  helpLabel: "How to play",
  practiceScore: (won, played) => `✅ ${won} / ${played}`,
  practiceScoreLabel: (won, played) => `${won} cleared out of ${played}`,
  settings: "SETTINGS",
  settingsSoon: "Coming soon! 🛠️",
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
  stats: { cleared: "Cleared", accuracy: "Accuracy", speed: "Speed", best: "Best" },

  spoken: {
    ready: "Let's go!",
    watch: "Watch me!",
    yourTurn: "Your turn!",
    stars: { 1: "Good try!", 2: "Great job!", 3: "Amazing!" },
    done: "Well done!",
    record: "New high score!", // not "new record": TTS stresses "record" like the verb
  },
};
