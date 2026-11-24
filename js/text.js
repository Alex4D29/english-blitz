// Every piece of UI text the frame shows or says, keyed so a Japanese (`ja`)
// version can be added later. Microgames keep their own TEXT objects.
// Static markup gets its text from `data-text="key"` (and aria labels from `data-label="key"`).
window.TEXT = {
  title: "ENGLISH\nBLITZ!",            // working title — rename freely
  fun: "FUN\nMODE",
  challenge: "ENDLESS\nMODE",           // (was CHALLENGE MODE; the code still says challenge)
  boss: "BOSS\nBATTLE",
  practice: "PICK A GAME",              // (Practice mode in the code)
  versus: "VERSUS",                    // ⚔️ two players side by side (js/versus.js)
  // One line under each title-menu button
  funDesc: "10 games, no pressure",
  challengeDesc: "4 lives. How far can you go?",
  versusDesc: "2 players, side by side!",
  itemsLabel: "Items",                  // 🎁 item boxes in Endless and Versus (Settings)
  coop: "TEAM UP",                       // 🤝 two players working together (js/versus.js)
  coopDesc: "2 players, work together!",
  bossDesc: "10 games, then beat a boss!",
  practiceDesc: "Play one game you like",
  tutorialsDesc: "Watch how each game works",
  tutorials: "TUTORIALS",
  // Characters (js/mascot.js): pick one the first time; change it from the title menu
  character: "CHARACTER",
  pickChar: "CHOOSE YOUR\nCHARACTER!",
  letsGo: "LET'S GO!",
  newChar: "NEW CHARACTER!",
  newCharSay: "New character!",
  yay: "YAY!",
  resetCharsLabel: "Characters",
  playersLabel: "Players",
  playersNote: "Up to 10 players. Each has their own characters, bosses and adventure map. Tap a name to change it; 🗑️ twice to delete.",
  resetChars: "RESET",
  resetCharsDone: "Characters reset!",
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
  // ⭐ MY WORDS (Word of the Week, the teacher's idea): every target comes from the words you choose
  myWords: { name: "MY WORDS", sample: "⭐", label: "Only the words you choose" },
  myWordsOn: "Playing MY WORDS: the targets are only your words.",
  myWordsLabel: "My words",
  editWords: "CHOOSE WORDS",
  wordsTitle: "MY WORDS",
  wordsNote: "Tap to add or remove. Start with a few new ones, then add more week by week!",
  wordsCount: (n) => (n === 1 ? "1 chosen" : `${n} chosen`),
  wordsClear: "CLEAR ALL",
  wordsDone: "DONE",
  wordsNone: "Choose some words first!",
  wordsSections: { letter: "ABC + PHONICS (letters)", cvc: "CVC WORDS", hfw: "SIGHT WORDS" },
  wordsNoPic: "(no picture: used in word games only)",
  // Quick sets in the word chooser: one tap adds a whole group (the teacher asked for each of these).
  // A set picks words by `letters` (starting with), `vowel` (CVC words with that middle vowel) or `words` (any list).
  wordsSetGroups: [
    { head: "TRICKY SOUNDS (for Japanese learners)", sets: [
      { name: "L vs R", letters: ["L", "R"] }, { name: "B vs V", letters: ["B", "V"] }, { name: "F vs H", letters: ["F", "H"] }] },
    { head: "WORD GROUPS", sets: [
      { name: "🔢 Numbers", words: ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"] },
      { name: "🎨 Colours", words: ["red", "blue", "yellow", "green", "brown", "black", "white"] },
      { name: "🏃 Action words", words: ["go", "come", "see", "look", "play", "run", "jump", "eat", "make", "help", "ride", "walk", "sing", "sleep",
        "draw", "drink", "wash", "find", "take", "give", "think", "say", "laugh", "fly", "call", "tell", "work", "want", "like", "sit", "hop", "dig", "hug"] },
      { name: "🏠 Things", words: ["day", "school", "house", "water", "friend"] },
      { name: "🙋 Pronouns", words: ["he", "she", "we", "me", "you", "they", "them", "her", "his", "my", "your", "our", "it"] },
      { name: "✨ Describing words", words: ["good", "new", "old", "little", "funny", "pretty", "small", "fast", "cold", "long", "big", "hot", "sad", "mad", "wet", "fat"] },
      { name: "❓ Question words", words: ["what", "when", "where", "who", "why", "how", "which"] },
      { name: "📍 Position words", words: ["in", "on", "up", "down", "under", "over", "into", "out", "off", "around", "here", "there"] }] },
    { head: "CVC BY VOWEL", sets: [
      { name: "_a_", vowel: "a" }, { name: "_e_", vowel: "e" }, { name: "_i_", vowel: "i" }, { name: "_o_", vowel: "o" }, { name: "_u_", vowel: "u" }] },
  ],

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
  listeningNote: "Off: games where you only hear the answer (Treasure Dig, Penalty Kick, Monster Boxing, Baseball Bash, Polly's Crackers) are left out, and the other games show the answer instead of only saying it. Good for a noisy room or no speakers.",
  on: "ON",
  off: "OFF",
  back: "BACK",
  loading: "Loading…",
  noGames: "No games found 😢",
  quit: "Back to menu",

  round: (n) => `ROUND\n${n}`,
  roundPill: (n) => `🏁 ${n}`,
  // Endless mode: the banner between games counts points instead of rounds (the teacher: rounds counted the misses too)
  points: (n) => {
    const W = ["ZERO", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE", "TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN",
      "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN", "NINETEEN", "TWENTY"];
    return `${W[n] || n}\n${n === 1 ? "POINT" : "POINTS"}!`;
  },
  tryAgain: "TRY\nAGAIN!",
  getReady: "GET\nREADY!",
  pointsPill: (n) => `⭐ ${n}`,
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
  // 🗺️ Adventure
  map: "MAP",
  next: "NEXT",
  advRetry: "TRY\nAGAIN!",
  adventure: "ADVENTURE",
  adventureDesc: "Explore the islands, beat the bosses!",
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
  bossYou: "YOU",                       // on your hearts in the final battle's top bar

  spoken: {
    ready: "Let's go!",
    watch: "Watch me!",
    yourTurn: "Your turn!",
    askWatch: "Do you want to watch first?",
    cheer: "Hooray!",            // the victory cheer at the end of every run
    stars: { 1: "Good try!", 2: "Great job!", 3: "Amazing!" },
    advRetry: "So close! Try again!",
    done: "Well done!",
    record: "New high score!", // not "new record": TTS stresses "record" like the verb
    bossWin: "You beat the boss! Amazing!",
    bossLose: "So close! Try again!",
  },
};
