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
    // `pics`: 3–4 pictures per letter. Each round the frame picks one per item and copies
    // it into `word` / `emoji`, so games only ever read those (see Core.roundItems).
    // `word` / `emoji` start as the first picture, for code that reads the raw list.
    // A picture must be a clear emoji, used by no other letter, and not easily called by
    // another letter's word: no 🚌 bus beside 🚐 van, no 🎁 "present", no 🐂 ox kids call "cow".
    // X has no easy X- words, so its pictures end in X; first-letter games skip it.
    items: letterItems([
      { text: "A", say: "Ay", tricky: ["E", "O"],      pics: pics("apple 🍎", "ant 🐜", "arrow ➡️", "axe 🪓") },
      { text: "B", tricky: ["D", "P", "Q", "V"],       pics: pics("ball ⚽", "bee 🐝", "banana 🍌", "bear 🐻") },
      { text: "C", tricky: ["O", "E"],                 pics: pics("cat 🐱", "cake 🎂", "cow 🐮", "carrot 🥕") },
      { text: "D", tricky: ["B", "P", "Q"],            pics: pics("dog 🐶", "duck 🦆", "door 🚪", "dinosaur 🦕") },
      { text: "E", say: "Ee", tricky: ["A", "C"],                 pics: pics("egg 🥚", "elephant 🐘", "envelope ✉️") },
      { text: "F", tricky: ["T", "H"],                 pics: pics("fish 🐟", "frog 🐸", "fire 🔥", "fork 🍴") },
      { text: "G", tricky: ["Q", "J"],                 pics: pics("goat 🐐", "grapes 🍇", "guitar 🎸", "gorilla 🦍") },
      { text: "H", tricky: ["N", "F"],                 pics: pics("hat 🎩", "horse 🐴", "house 🏠", "hippo 🦛") },
      { text: "I", tricky: ["J", "T"], /* not L: "I" and "l" look identical */ pics: pics("insect 🐛", "iguana 🦎", "injection 💉") },
      { text: "J", tricky: ["I", "G"],                 pics: pics("juice 🧃", "jeans 👖", "jellyfish 🪼") },
      { text: "K", tricky: ["X", "H"],                 pics: pics("kite 🪁", "key 🔑", "kangaroo 🦘") },
      { text: "L", tricky: ["R", "T"],                 pics: pics("lion 🦁", "lemon 🍋", "leaf 🍃", "lollipop 🍭") },
      { text: "M", tricky: ["N", "W"],                 pics: pics("moon 🌙", "monkey 🐵", "mouse 🐭", "milk 🥛") },
      { text: "N", tricky: ["M", "U", "H"],            pics: pics("nest 🪺", "nose 👃", "nut 🥜", "nine 9️⃣") },
      { text: "O", tricky: ["C", "A"],                 pics: pics("octopus 🐙", "orange 🍊", "owl 🦉") },
      { text: "P", tricky: ["Q", "B", "D"],            pics: pics("pig 🐷", "pizza 🍕", "penguin 🐧", "pear 🍐") },
      { text: "Q", tricky: ["P", "G", "B"],            pics: pics("queen 👑", "question ❓", "quiet 🤫") },
      { text: "R", tricky: ["L", "N"],                 pics: pics("rabbit 🐰", "rainbow 🌈", "robot 🤖", "rocket 🚀") },
      { text: "S", tricky: ["Z"],                      pics: pics("sun ☀️", "snake 🐍", "sock 🧦", "spider 🕷️") },
      { text: "T", tricky: ["F", "L"],                 pics: pics("tiger 🐯", "tomato 🍅", "turtle 🐢", "tree 🌳") },
      { text: "U", tricky: ["N", "V"],                 pics: pics("umbrella ☂️", "up ⬆️", "underwear 🩲") },
      { text: "V", tricky: ["U", "W", "B"],            pics: pics("van 🚐", "violin 🎻", "volcano 🌋") },
      { text: "W", tricky: ["M", "V"],                 pics: pics("window 🪟", "watermelon 🍉", "watch ⌚", "worm 🪱") },
      { text: "X", tricky: ["K"],                      pics: pics("fox 🦊", "box 📦", "six 6️⃣") },
      { text: "Y", tricky: ["V", "J"],                 pics: pics("yo-yo 🪀", "yarn 🧶", "yawn 🥱") },
      { text: "Z", tricky: ["S"],                      pics: pics("zebra 🦓", "zombie 🧟", "zipper 🤐") },
    ]),
  },
  // CVC words: consonant, short vowel, consonant. Only words a child can sound out
  // letter by letter (not "was", "his", "put": those are in the HFW list).
  // `emoji` only where the picture is clear and unique in this list. The picture
  // games (Feed Me, Claw Catch) use only those; every other game uses all of them.
  // Look-alike distractors (cat → hat, cap, cot) come from Core.pickOptions.
  {
    id: "cvc",
    type: "cvc",
    items: [
      // short a
      ...cvcWords("cat 🐱", "hat 🎩", "bat 🦇", "rat 🐀", "cap 🧢", "map 🗺️", "van 🚐", "pan 🍳", "yam 🍠", "bag 👜",
        "ham 🍖", "can 🥫", "man 👨", "ram 🐏", "sad 😢", "mad 😠", "nap 😴", "tag 🏷️", "cab 🚕", "gas ⛽",
        "zap ⚡", "tap 🚰", "dad", "fan", "jam", "mat", "pad", "fat", "sat", "wag", "lap", "rag", "had", "ran",
        "wax", "gap", "lab", "tan"),
      // short e
      ...cvcWords("bed 🛏️", "hen 🐔", "pen 🖊️", "net 🥅", "jet ✈️", "web 🕸️", "leg 🦵", "ten 🔟", "wet 💦", "red 🔴",
        "gem 💎", "pet", "vet", "men", "get", "let", "set", "met", "fed", "beg", "peg", "den", "yes", "yet"),
      // short i
      ...cvcWords("pig 🐷", "pin 📌", "bin 🗑️", "lip 👄", "zip 🤐", "six 6️⃣", "dig ⛏️", "kid 🧒", "fix 🔧", "win 🏆",
        "wig", "lid", "fin", "fig", "sip", "dip", "hit", "sit", "bib", "rib", "hip", "kit", "tip", "him", "big",
        "did", "mix", "pit", "rip"),
      // short o
      ...cvcWords("dog 🐶", "log 🪵", "pot 🍲", "fox 🦊", "box 📦", "mop 🧹", "hot 🔥", "cob 🌽", "jog 🏃", "rod 🎣",
        "hog 🐗", "mom", "top", "got", "not", "lot", "nod", "pop", "cod", "dot", "cot", "hop", "sob", "job"),
      // short u
      ...cvcWords("sun ☀️", "bus 🚌", "cup 🥤", "bug 🐛", "mug ☕", "hug 🤗", "nut 🥜", "cut ✂️", "hut 🛖", "tub 🛁",
        "yum 😋", "run", "bun", "fun", "rug", "jug", "cub", "pup", "gum", "mud", "bud", "dug", "rub", "hum",
        "tug", "but", "sum"),
    ],
  },
  // High-frequency / sight words (Dolch and Fry), none of them CVC. Words that sound the same (to/two,
  // for/four) are kept apart by Core.soundsLike (SOUND_ALIKE in js/core.js): one is never a wrong answer
  // to the other, so a game that says a word never has two right answers. Add new pairs there.
  {
    id: "hfw",
    type: "hfw",
    items: hfwWords(
      "the", "to", "and", "is", "in", "it", "you", "of", "was", "said",
      "he", "she", "we", "me", "be", "my", "by", "they", "are", "all",
      "as", "at", "on", "no", "so", "go", "do", "up", "an", "am",
      "if", "or", "for", "with", "have", "this", "that", "what", "when", "where",
      "who", "why", "there", "here", "from", "look", "like", "come", "some", "one",
      "three", "see", "saw", "play", "went", "into", "out", "down", "our", "your",
      "her", "them", "then", "little", "want", "were", "will", "make", "about", "could",
      "would", "because", "very", "good", "new", "now", "how", "old", "over", "after",
      "again", "off", "away", "came", "any", "many", "help", "jump", "please", "eat",
      "give", "day", "going", "has", "his", "just", "first", "only", "every", "school",
      // More (the teacher asked for a few more): colours, then common Dolch / Fry words. Still no sound-alikes
      // (two/too, know, read, eight) and nothing that's in the CVC list.
      "blue", "yellow", "green", "brown", "black", "white", "funny", "find", "pretty", "ride",
      "say", "soon", "under", "ask", "fly", "live", "once", "open", "put", "stop",
      "take", "thank", "think", "walk", "always", "around", "before", "both", "call", "cold",
      "does", "fast", "found", "made", "sing", "sleep", "tell", "these", "wash", "which",
      "work", "clean", "draw", "drink", "laugh", "light", "long", "small", "today", "friend",
      "house", "water",
      // Numbers (for the Numbers group). "two" and "four" sound like "to" and "for": Core.soundsLike keeps them
      // from ever being the wrong answers to each other (and vice versa).
      "two", "four", "five", "seven", "eight", "nine"),
  },
];

// Famous sight-word mix-ups (reversals, near twins) that spelling similarity alone
// won't always put first. Added both ways as `tricky`.
[["was", "saw"], ["on", "no"], ["how", "who"], ["of", "off"], ["of", "for"], ["there", "three"],
  ["there", "where"], ["then", "them"], ["went", "want"], ["come", "came"], ["were", "where"], ["from", "for"],
  ["was", "has"], ["his", "has"], ["now", "new"], ["any", "many"], ["what", "that"], ["when", "then"],
  ["think", "thank"], ["find", "found"], ["once", "one"], ["walk", "work"], ["live", "like"], ["black", "blue"], ["which", "white"],
].forEach(([a, b]) => {
  const items = window.WORD_LISTS.find((l) => l.id === "hfw").items;
  const A = items.find((it) => it.text === a);
  const B = items.find((it) => it.text === b);
  if (!A || !B) return console.error("lists: unknown tricky pair", a, b);
  (A.tricky = A.tricky || []).push(b);
  (B.tricky = B.tricky || []).push(a);
});

// Shorthand used above (function declarations, so they're ready before the list is built).
// "cat 🐱" → { text: "cat", sounds: ["c", "a", "t"], emoji: "🐱" }
function cvcWords(...entries) {
  return entries.map((e) => {
    const [text, emoji] = e.split(" ");
    const item = { text, sounds: text.split("") };
    if (emoji) item.emoji = emoji;
    return item;
  });
}
// pics("apple 🍎", "ice cream 🍦") → [{ word: "apple", emoji: "🍎" }, { word: "ice cream", emoji: "🍦" }]
// The emoji is after the last space, so a word can have spaces.
function pics(...entries) {
  return entries.map((e) => {
    const i = e.lastIndexOf(" ");
    return { word: e.slice(0, i), emoji: e.slice(i + 1) };
  });
}
// Default `word` / `emoji` = the first picture.
function letterItems(items) {
  return items.map((it) => ({ ...it, word: it.pics[0].word, emoji: it.pics[0].emoji }));
}
function hfwWords(...words) {
  return words.map((text) => ({ text }));
}

// Phonics (first sounds): the same 26 letters and pictures as `letters-az`, but its
// own type, so the content picker can split letter recognition (ABC: A/a, A-B-C order,
// tracing) from first sounds (PHONICS: A for 🍎, which picture starts with B?).
// Picture games take "phonics"; letter-shape games take "letter".
window.WORD_LISTS.splice(1, 0, { id: "phonics-az", type: "phonics", items: window.WORD_LISTS[0].items });
