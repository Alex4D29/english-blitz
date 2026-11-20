// Game modes and scoring. The frame reads these; change the numbers here.
//
// A mode:
//   totalGames    – games per run (Infinity = until lives run out)
//   lives         – 0 = no lives / no game over
//   speedUpEvery  – speed goes up after this many games played (0 = never)
//   speedStep     – how much it goes up each time
//   maxSpeed      – speed cap
//   warmup        – optional [{ games, ms }, …]: the first rounds stay at 1× with at least
//                   `ms` to play; speed-ups only start counting after the last warm-up round
window.MODES = {
  fun: {
    id: "fun",
    totalGames: 10,
    lives: 0,
    speedUpEvery: 0,
    speedStep: 0,
    maxSpeed: 1,
  },
  challenge: {
    id: "challenge",
    totalGames: Infinity,
    lives: 4,
    speedUpEvery: 5,
    speedStep: 0.25,
    maxSpeed: 2.5,
    // Rounds 1–5 get 20 s, 6–10 get 15 s, then the normal 1× start and speed-ups from round 16.
    warmup: [{ games: 5, ms: 20000 }, { games: 5, ms: 15000 }],
    highScoreKey: "wwe.challenge.best",
  },
  // One chosen game, over and over, at 1×, until the player leaves. No results screen.
  practice: {
    id: "practice",
    totalGames: Infinity,
    lives: 0,
    speedUpEvery: 0,
    speedStep: 0,
    maxSpeed: 1,
  },
};

// Each round result is { gameId, won, timedOut, timeMs, timeLimit, speed }.
window.SCORING = {
  accuracy(results) {
    if (!results.length) return 0;
    return Math.round((100 * results.filter((r) => r.won).length) / results.length);
  },
  // Fun mode: everyone gets at least one star.
  stars(cleared, total) {
    const ratio = cleared / total;
    if (ratio >= 0.9) return 3;
    if (ratio >= 0.6) return 2;
    return 1;
  },
  // Challenge mode: 10–100 points per cleared game, more for clearing it fast.
  // The time limit shrinks with speed, so later rounds are already harder.
  speedPoints(r) {
    if (!r.won) return 0;
    return Math.max(10, Math.round(100 * (1 - r.timeMs / r.timeLimit)));
  },
  speedScore(results) {
    return results.reduce((sum, r) => sum + this.speedPoints(r), 0);
  },
};
