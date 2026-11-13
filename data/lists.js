// Word lists shared by all microgames. Content only — no game logic here.
// Loaded as a classic <script> so it works from file:// as well as a server.
//
// `tricky` names other items in the same list that make good distractors:
// look-alike lowercase shapes (b/d/p/q, m/n/w, i/l/j) and sounds Japanese
// learners mix up (L/R, B/V, F/H).
window.WORD_LISTS = [
  {
    id: "letters-az",
    type: "letter",
    items: [
      { text: "A", word: "apple",    say: "Ay", emoji: "🍎", tricky: ["E", "O"] },
      { text: "B", word: "ball",     emoji: "⚽", tricky: ["D", "P", "Q", "V"] },
      { text: "C", word: "cat",      emoji: "🐱", tricky: ["O", "E"] },
      { text: "D", word: "dog",      emoji: "🐶", tricky: ["B", "P", "Q"] },
      { text: "E", word: "egg",      emoji: "🥚", tricky: ["A", "C"] },
      { text: "F", word: "fish",     emoji: "🐟", tricky: ["T", "H"] },
      { text: "G", word: "goat",     emoji: "🐐", tricky: ["Q", "J"] },
      { text: "H", word: "hat",      emoji: "🎩", tricky: ["N", "F"] },
      { text: "I", word: "igloo",    emoji: "🧊", tricky: ["J", "T"] }, // not L: "I" and "l" look identical
      { text: "J", word: "jam",      emoji: "🍯", tricky: ["I", "G"] },
      { text: "K", word: "kite",     emoji: "🪁", tricky: ["X", "H"] },
      { text: "L", word: "lion",     emoji: "🦁", tricky: ["R", "T"] },
      { text: "M", word: "moon",     emoji: "🌙", tricky: ["N", "W"] },
      { text: "N", word: "nest",     emoji: "🪺", tricky: ["M", "U", "H"] },
      { text: "O", word: "octopus",  emoji: "🐙", tricky: ["C", "A"] },
      { text: "P", word: "pig",      emoji: "🐷", tricky: ["Q", "B", "D"] },
      { text: "Q", word: "queen",    emoji: "👑", tricky: ["P", "G", "B"] },
      { text: "R", word: "rabbit",   emoji: "🐰", tricky: ["L", "N"] },
      { text: "S", word: "sun",      emoji: "☀️", tricky: ["Z"] },
      { text: "T", word: "tiger",    emoji: "🐯", tricky: ["F", "L"] },
      { text: "U", word: "umbrella", emoji: "☂️", tricky: ["N", "V"] },
      { text: "V", word: "van",      emoji: "🚐", tricky: ["U", "W", "B"] },
      { text: "W", word: "window",   emoji: "🪟", tricky: ["M", "V"] },
      { text: "X", word: "fox",      emoji: "🦊", tricky: ["K"] },
      { text: "Y", word: "yo-yo",    emoji: "🪀", tricky: ["V", "J"] },
      { text: "Z", word: "zebra",    emoji: "🦓", tricky: ["S"] },
    ],
  },
  {
    id: "cvc-short-a",
    type: "cvc",
    items: [
      { text: "cat", sounds: ["c", "a", "t"], emoji: "🐱", tricky: ["cap", "can", "hat"] },
      { text: "hat", sounds: ["h", "a", "t"], emoji: "🎩", tricky: ["cat", "ham"] },
      { text: "bat", sounds: ["b", "a", "t"], emoji: "🦇", tricky: ["bag", "van"] },
      { text: "rat", sounds: ["r", "a", "t"], emoji: "🐀", tricky: ["cat", "hat"] },
      { text: "cap", sounds: ["c", "a", "p"], emoji: "🧢", tricky: ["cat", "map"] },
      { text: "map", sounds: ["m", "a", "p"], emoji: "🗺️", tricky: ["cap", "ham"] },
      { text: "van", sounds: ["v", "a", "n"], emoji: "🚐", tricky: ["pan", "can", "bat"] },
      { text: "pan", sounds: ["p", "a", "n"], emoji: "🍳", tricky: ["can", "van"] },
      { text: "jam", sounds: ["j", "a", "m"], emoji: "🍯", tricky: ["ham"] },
      { text: "bag", sounds: ["b", "a", "g"], emoji: "👜", tricky: ["bat"] },
      { text: "ham", sounds: ["h", "a", "m"], emoji: "🍖", tricky: ["jam", "hat"] },
      { text: "can", sounds: ["c", "a", "n"], emoji: "🥫", tricky: ["cap", "pan"] },
    ],
  },
];
