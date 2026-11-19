# WarioWare English

A WarioWare-style collection of fast English microgames for Japanese kids learning the alphabet, phonics and reading. Each microgame lasts a few seconds: flash an instruction, the player acts, win or lose, then the next game starts, a little faster.

Audience: young Japanese children, many of whom can't read English yet (and some can't read much Japanese either). Design for kids: big targets, very little reading needed to play, instant and obvious feedback.

## Current state

The shared frame is built and twelve microgames plug into it:

- **Balloon Pop** (`games/balloon-pop.js`, "POP THE LETTER!" / "POP THE WORD!"): the voice says "B for ball" and letter balloons drift around, bouncing off each other. The player pops the right one. A right pop gives confetti and the rest float away. A wrong pop bursts into green slime, then the right balloon wiggles. Faster speeds make the balloons drift faster, with 6 balloons at 2× and up. Words longer than 4 letters shrink to fit the balloon. Phonics list ("POP THE PICTURE!"): the button at the top shows the letter (B 🔊) and the voice says just the letter. One balloon carries a picture that starts with it, and the others carry pictures from other letters (look-alike letters first). After the pop, or the reveal, the voice says "B for ball". Takes letter, phonics, cvc and hfw lists.
- **Wire Cut** (`games/wire-cut.js`, "CUT THE WRONG WIRE!"): pairs (A—a, 🐱—cat, THE—the) are wired to a bomb, and one pair is wrong. The player cuts the wrong wire. The decoy is a look-alike (B—d, 🐱—cot, WAS—saw). CVC rounds use only words with pictures. Sight words have no pictures, so they pair CAPITALS with lowercase, like letters. Words longer than 5 letters are left out, and word text shrinks to fit its tile. Faster speeds add a 4th pair and cross the wires. Phonics list: letter—picture pairs (B—⚽, with the picture on the right). The wrong pair has a picture from another letter, a look-alike when there is one (B—🦆 duck), and that letter is kept off the board. Cutting says "B... duck". Takes letter, phonics, cvc and hfw lists.
- **Feed Me** (`games/feed-me.js`, "FEED ME!"): a hungry picture (🍎) wants its letter or word, and the player drags the right tile into its mouth. The voice says only the word ("apple"), so the player has to find the first letter. After a miss, it says "A for apple". With the phonics list it skips items whose word doesn't start with the letter (X/fox). Faster speeds add a 4th tile, then the creature sways. It needs `emoji`, so it only takes phonics and cvc lists.
- **Train Builder** (`games/train-builder.js`, "BUILD THE TRAIN!" / "SPELL THE TRAIN!"): a steam engine shows a letter (M) and the player taps carriages to hook on the next three in order (N, O, P). The engine starts anywhere from A to W. With word lists, the engine shows the picture (or, for sight words, the word itself), the voice says "cat", and the player spells it c-a-t (words up to 5 letters). A wrong carriage shakes and play goes on (no penalty). On timeout the right ones roll into place. When the train is complete it toots and steams off. Faster speeds add distractor carriages: the letter just after the run, then look-alikes. Time limit is 7 s. Phonics list ("BUILD THE TRAIN!"): the engine shows a letter (C), and the tray has 3 pictures that start with it plus 1 wrong picture (2 from 1.5×). Right pictures can go on in any order: a tapped right picture is swapped into the next slot's place in `needed`, so the timeout reveal still fills the rest. Letters with fewer than 3 such pictures (X) are never the engine. Takes letter, phonics, cvc and hfw lists.
- **Trace Monster** (`games/trace-monster.js`, "TRACE THE MONSTER!"): a fat monster shaped like a letter, capital or lowercase (googly eyes, toothy grin) appears and the voice says the letter. The player drags over it, and dots along each stroke light up. A dot lights when the finger passes within 11 units of it (the letter box is 100). When every stroke is 90% lit, the monster swells and pops into goo, and its eyeballs bounce away. Stroke order isn't shown or enforced, because schools teach it differently. A ghost 👆 slides along one stroke to show what to do. A list item written in lowercase is always lowercase; otherwise the case is a coin flip. During the round the monster gets fatter and its mouth wider. On timeout it lunges and CHOMPs the screen. Letter shapes are polylines in `LETTERS` (A–Z and a–z, lowercase on handwriting lines). Faster speeds tighten the tolerance, and at 1.75× and up the dotted guide is hidden. Time limit is 7 s. Takes letter lists only.
- **Whack-a-Mole** (`games/whack-a-mole.js`, "WHACK THE LETTER!" / "WHACK THE WORD!"): the target sits in a card at the top (tap it to hear it again), and the voice says it. Moles pop out of holes for about 2 s, each holding its letter or word on its belly. Some have the target and some don't. Whack 3 targets to win (⭐ pips, top left). Whack 3 wrong moles and they laugh, the 💣 swells (pips top right), and on the third the bomb explodes: flash, blast, shake, and every mole pops up covered in soot. Tapping an empty hole just whiffs the 🔨. Letter lists use a 3×3 field, word lists a 2×3 field with wider moles, and the sign text is measured so the longest word fits. A target is forced after 2 non-targets in a row, and also whenever no target is showing and time is short (less than 1.5 s / pace left per remaining hit). Faster speeds shorten how long moles stay up, spawn them more often, and allow 3 up at once from 1.5×. Time limit is 11 s (it needs 3 hits). Phonics list ("WHACK THE PICTURES!"): the card shows the letter (B), and the moles hold pictures on a 3×3 field. Any picture that starts with B counts. All of the letter's pictures take turns (⚽ 🐝 🍌 🐻), and the 6 wrong ones come from other letters. Every whack, right or wrong, says the picture's word. Sooty moles hide their emoji (emoji ignore `color:transparent`). Takes letter, phonics, cvc and hfw lists.
- **Find My Baby** (`games/find-my-baby.js`, "FIND MY BABY!"): a big capital-letter monster (M) with eyes on stalks sobs for its baby, with a 👶❓ bubble, and the voice says "Where is my baby? M!". Lowercase babies (m, n, w, v) wander around the bottom, crying, with tears and quiet synth sobs. The player drags the right baby up to the monster: it hops in beside the big letter, both stop crying, and hearts and confetti burst out. A wrong baby makes the monster shake its head ("No!"), the baby is tossed back, and the real one glows. Dropping a baby anywhere else is free. Tapping a baby makes it say its letter name, and tapping the monster repeats the prompt. Faster speeds add babies (5 at 1.5×, 6 at 2×) and make them wander faster. Time limit is 7 s. Takes letter lists only.
- **Shuriken Toss** (`games/shuriken-toss.js`, "HIT THE LETTER!" / "HIT THE WORD!"): the target sits in a card at the top (tap it to hear it again), and the voice says it. A cannon on the left fires letter balls in slow arcs across a dusk sky (about 4 s to cross at 1×). Tapping a ball makes the ninja (bottom right) throw a homing shuriken at it, so the player never has to lead a moving target. Taps get 22 px of slop, and balls already aimed at are skipped. Tapping empty sky is a free miss, and balls that fly off cost nothing. A target ball is sliced in half diagonally and the halves fall. Slice 3 to win (⭐ pips). A wrong ball clinks the shuriken off, turns red and drops (💥 pips). On the third wrong hit the ninja is knocked out (😵) and everything falls. The first shot is always a target, then 50% odds, and a target is forced after 2 non-targets in a row (1 from 1.75×). Faster speeds fly and fire faster, with 4 balls in the air from 1.5×. Time limit is 13 s. Phonics list ("HIT THE PICTURES!"): like Whack-a-Mole's phonics mode. The card shows a letter, the balls carry pictures, and you hit 3 that start with it. Each hit says the word. Takes letter, phonics, cvc and hfw lists.
- **Claw Catch** (`games/claw-catch.js`, "CATCH IT!"): a hungry letter monster (big colored B, googly eyes, open mouth) above a top-down claw machine says "I want B!" (tap it to hear it again). The floor is a grid of picture prizes, with exactly one right answer: a picture whose word starts with the letter (X/fox-style items are never the target, and no distractor starts with the letter). The claw starts in a dashed lane at the left side of the floor, so it never covers a picture while it slides up and down along a yellow gantry bar (the bar runs under the prizes). Meanwhile the whole row it's level with glows softly. The player presses the big red STOP button (or taps the machine, or Space/Enter). Then the claw leaves the lane and sweeps left and right over the prizes (never back into the lane), and the player presses STOP again. The prize under it glows. A second STOP within 250 ms is ignored, so a double tap can't skip the second step. The result is reported the moment of the second STOP, and the claw grabs the nearest prize in its cell. Then the claw snaps to the cell centre, opens, drops (shrinks, shadow merges), closes and lifts. A right prize is carried up and flies into the monster's mouth: chomp, hearts, "B for ball" (it chomps at about 0.94 s, before the frame clears at 1.4 s, so keep that sequence short). A wrong prize slips back with a bounce, the monster shakes its head and the right prize glows. Word lists: the monster holds the word ("cat") and wants its picture. Faster speeds move the claw faster, with 4 prizes (2×2) at 1× and 6 (3×2) from 1.5×. The claw steps by frame time, capped at 50 ms per frame. Time limit is 9 s. Needs `emoji`, so phonics and cvc lists only.
- **Gone Fishing** (`games/fishing.js`, "CATCH IT!"): a monster with a fishing rod stands on a dock above a pond. Phonics list: the monster is the letter (A), says "I want A!" and wants the fish carrying a picture that starts with it (🍎; X/fox-style items are never the target, and no other fish starts with the letter). CVC lists: the monster holds the word ("cat") and wants the 🐱 fish. HFW lists: a plain blob monster with a 🔊 bubble says the word, and the fish carry words, with look-alikes first (into: it, to, here). Tap the monster to hear it again. The player swipes into the pond (or just taps it). A dotted arc and ring show the aim, and the bobber lands where the finger lets go, clamped inside the pond. A ghost 👆 shows the swipe until the first cast. The nearest fish within about 45% of the pond width comes over to the bait, one at a time. While it bites (the bobber dips, ❗ pops up, plip sounds) the player taps it (28 px slop, or within 60 px of the bobber) to reel it up to the monster. A right fish wins the moment it's tapped. Then the monster jumps, with hearts and confetti, and says "A for apple". A wrong fish makes the monster cry (😢, tears, head shake). It's tossed back after 0.7 s, then the prompt repeats and the player can cast again (no penalty other than time). An untapped biter swims off after 1.5 s and the next nearby fish comes (one that just bit waits 2.5 s). Casting again sends the current fish away. Taps on a fish that's on its way to the bait are ignored, so they don't scare it off. On timeout the monster cries and the right fish glows. Fish carry pictures for phonics and cvc lists (sized to about a third of the pond width), and words for HFW (shrunk to fit). Faster speeds make fish swim and come faster, shorten the bite (1.5 s / pace, where pace is 0.6 + 0.4 × speed), and add fish: 4 at 1×, 5 from 1.5×, 6 from 2×. Time limit is 12 s. Takes phonics, cvc and hfw lists.
- **Egg Shuffle** (`games/egg-shuffle.js`, "WATCH THE EGGS!"): letters or words stand in a row as little characters (colored body, googly eyes, legs). Giant speckled eggs drop over them with a thud, and the letters are hidden once the eggs land. Then the eggs shuffle with swaps: one egg hops over, the other ducks under. The first swap always moves the target's egg, and the same pair never swaps twice in a row. While this happens the card at the top shows 👀. After the last swap the card slams in with the target, the voice says it ("B for ball" / "cat"), and the eggs start wobbling. Only now can they be tapped (keys 1–4 also work, left to right). Tap the card to hear it again. A right egg cracks along a zigzag, the top half flies off, and the letter hops out onto the bottom shell, with cheeps and confetti. Then the other eggs crack, dimmed, so the player sees what was where. A wrong egg is rotten: green shell, stink waves, 💨 and a rude noise. Then the right egg cracks open and glows. On timeout every egg cracks and the right one glows. All the eggs look the same, speckles included. The watching part (stand, drop, swaps) is fitted into about 60% of the time limit, and choosing gets the rest (never less than 1.8 s). Swaps are capped at 0.8 s each. Faster speeds squeeze the watching part, and from 2× there are 4 eggs and 4 swaps (3 of each before that). Words are capped at 5 letters (4 when there are 4 eggs). Time limit is 10 s. Takes letter, cvc and hfw lists.
- **Clean the Room** (`games/clean-room.js`, "CLEAN THE ROOM!"): a messy bedroom (striped wallpaper, window, wood floor, pink rug). Lowercase letters lie on the rug at small tilts (never more than 18°, so b/d/p/q stay themselves). A cardboard box with a capital letter on it (A) stands against the wall, and googly eyes peer out of its opening and follow a dragged letter. The voice says the box letter ("A", or "B and D"). The player drags every lowercase a into box A. 3 copies are on the floor, plus 3 decoys (`tricky` look-alikes first). A right letter arcs into the box: gulp, a green pip on the box, and the voice says its name. A wrong letter makes the box shake, say "BLEH!" and spit it back onto the rug with a spin. That only costs time. A letter dropped on the wall slides back down onto the floor, and anywhere else it just stays put. Tap a letter to hear its name, and tap a box to hear its letter. When every box is full, the boxes close, confetti flies, and a 🧹 swishes across the floor and sends the leftover letters flying off the right edge, with ✨. On timeout the uncollected letters glow and the boxes shake. From 1.5× there are two boxes, usually a look-alike pair from `tricky` (B and D, M and N), each needing 2 letters, plus 2 decoys (3 from 2×). Box ink is blue or pink, and the letters never use those colors so color can't hint at a box. A lowercase l is never put beside box I. Keyboard: Enter or 1 puts the focused letter in the first box, 2 in the second. Time limit is 10 s. Takes letter lists only.
- **What to play?** (after any mode button): four big toggles, **ABC** (letter recognition: shapes, capital/lowercase, order, tracing), **PHONICS** (first sounds: which picture starts with B?), **CVC** (CVC words) and **HFW** (sight words). ABC and PHONICS are on by default, at least one must stay on, and the choice is saved in `localStorage` under `wwe.content.v2`. A selection saved under the old `wwe.content` key (from before PHONICS split off from ABC) is carried over, with PHONICS added if ABC was ticked. Names longer than 4 letters (PHONICS) get a smaller font so they fit beside the sample at 360 px. PLAY then starts the mode. Every round picks one of the ticked types at random, then a game that can use it, so a run can mix letters and words.
- **Practice** (title menu, green button, then the content picker): a grid of every game that can use at least one ticked type. Picking one opens a **How to play** card (the game's icon, name, numbered steps with an emoji each, and tips), then PLAY runs that game on repeat. See Modes below.
- **Settings** is an empty placeholder screen.
- The title text "ENGLISH BLITZ!" is a working name. Change it in `js/text.js`.

## Architecture

A single-page web app in plain HTML/CSS/JS, with no build step and no framework. Everything is a classic `<script>`, because ES modules don't load from `file://`. It must keep working when you open `index.html` directly or serve it from any static host.

```
index.html          screens markup + script tags (no inline logic)
css/frame.css       frame styles
js/text.js          TEXT: all frame UI strings
js/core.js          registerMicrogame(), audio unlock + SFX, speech, storage, helpers (window.Core)
js/modes.js         MODES (fun, challenge, practice) and SCORING
js/frame.js         screens, round loop, timer, HUD, results, game loading
data/lists.js       word lists (window.WORD_LISTS)
games/manifest.js   GAME_FILES: the list of microgames to load
games/*.js          one file per microgame
```

Test URLs: `index.html?game=wire-cut` plays only that game (the content picker still shows). `?list=cvc` plays only that list and skips the content picker (lists: `letters-az`, `phonics-az`, `cvc`, `hfw`). They can be combined.

### Modes (`js/modes.js`)

- **FUN MODE:** 10 games, no lives, speed stays at 1×. A miss only lowers accuracy. Results show games cleared out of 10, accuracy, and 1–3 stars (≥90% gets 3 stars, ≥60% gets 2, otherwise 1).
- **CHALLENGE MODE:** 4 lives, and a lost game costs one. Speed goes up by 0.25 every 5 games played, up to 2.5×. The run lasts until the lives run out. Results show games cleared, accuracy and a speed score. Each cleared game scores 10–100 points: `100 × (1 − timeMs / timeLimit)`, with a minimum of 10. The best speed score is saved in `localStorage` under `wwe.challenge.best`.
- **PRACTICE:** one chosen game, over and over, at 1×, with no lives and no end. The "ROUND n" banner is skipped. The HUD shows `✅ cleared / played` and a ❓ button that goes back to the How to play card. ✕ goes back to the game picker. There's no results screen.
- Fun and Challenge pick a ticked content type at random each round, then a game that can use it, never the same game twice in a row.

### The shared frame (`js/frame.js`)

**Only the frame** handles:

- **The transition:** "SPEED UP!" when the speed changes, then "ROUND n", then the game's instruction slams in with a background flash. A new color theme each round.
- **The timer bar:** green → orange → red, with ticks in the last 2 s. Running out of time counts as a loss.
- **Lives and progress:** hearts in Challenge, 10 progress pips in Fun.
- **Feedback between games:** happy sound or buzz, vibration, and a YES! / NOPE! / TOO SLOW! stamp. After the 1.4 s feedback, the next round waits for any speech still playing ("A for apple") to finish, up to 2.5 s more (`whenQuiet`).
- **Audio unlock:** tapping a mode button or a content toggle creates the `AudioContext`, and PLAY calls `speechSynthesis`. iOS blocks sound until the first tap.
- **Results, high score, PLAY AGAIN and MENU.**
- **Clearing every timer** a game started, through `ctx.later` / `ctx.raf`, between games.

Robustness:
- If a game throws in `start()`, it's logged and skipped for the session, and the round is replayed with no penalty.
- Leaving the tab mid-round cancels that round, and it's replayed when the player comes back.

A microgame never draws its own timer, lives, score or result screens.

### Microgame contract

```js
registerMicrogame({
  id: "my-game",
  name: { en: "Tap It" },                    // shown in the Practice picker
  icon: "👆",                                // one emoji for the Practice picker and How to play card
  howTo: { en: {                             // Practice mode's How to play card; or (list) => ({ en: … })
    steps: [["👂", "Listen to the word."], ["👆", "Tap it!"]],   // [emoji, short sentence], 2–4 of them
    tips: ["Tap 🔊 to hear it again."],      // optional: hints, what a mistake does, what speeding up changes
  } },
  instruction: { en: "TAP IT!" },            // or (list) => ({ en: … }) to vary by list type
  contentTypes: ["letter", "cvc"],           // which list types it can use
  duration: 5000,                            // base time limit in ms at speed 1 (default 5000)
  start(ctx) {
    // …build the game in ctx.root…
    return () => { /* optional cleanup: remove document listeners, observers */ };
  },
});
```

`ctx` contains:

| field | meaning |
|---|---|
| `root` | element to render into. The frame empties it afterwards. |
| `items` | the current list's items, freshly shuffled. An item with `pics` arrives with one picked at random already copied into `word` / `emoji`; the full `pics` array is still there. |
| `list` | `{ id, type }` of the current list |
| `speed` | 1, 1.25 … 2.5. Scale difficulty with it. |
| `timeLimit` | ms for this round (`duration / speed`) |
| `win()` / `lose()` | report the result. Only the first call counts. The frame measures the time taken. |
| `ended` | true once a result is in, including a timeout. Check it in input handlers. |
| `onTimeout(fn)` | optional: called when time runs out, so the game can reveal the answer |
| `say(text)`, `canSpeak` | shared voice. Without speech, show an emoji/text cue instead. |
| `later(fn, ms)`, `raf(fn)` | timers the frame clears between games. Use these instead of `setTimeout`/`requestAnimationFrame`. |
| `sfx` | `tone`, `sweep`, `noise` synth helpers (plus `happy`, `buzz`…). `audio` is the raw `AudioContext` or null. |
| `confetti(layer, x, y, {count})` | confetti burst at (x, y) px inside a positioned layer. Skipped with reduced motion. |
| `shuffle`, `pick`, `pickOptions(target, n)` | helpers. `pickOptions` returns the target + n−1 distractors from the list: `tricky` first, then look-alike words (one letter different: cat/cot; reversed: was/saw, on/no; one inside the other: of/off). At least one distractor is random when n > 2. |
| `phonics.pics(item)`, `phonics.set(letter, nRight, nWrong)` | phonics helpers (`Core.startPics` / `Core.phonicsSet`). `pics` lists a letter item's pictures whose word starts with it (B → ball, bee…; X → none). `set` returns `{ right, wrong }`: up to nRight of those, and nWrong pictures that don't start with the letter, one per other letter, from its `tricky` letters first. Each picture is `{ word, emoji, letter }`, and no emoji repeats. Use these rather than `item.emoji`, which may not start with the letter (X: fox). |

Rules:
- Report win or lose once. If the game reports nothing, the timer runs out and counts as a loss. The game's own win/lose animation can keep playing for about 1.4 s afterwards.
- Ignore input after the result is in (`ctx.ended`, or your own `done` flag).
- Don't hard-code content. Everything the player sees or hears comes from `ctx.items`.
- The game must be playable without reading the instruction: use icons, speech and an obvious goal.
- Inject your own CSS once, with a unique class prefix (`bp-`, `wc-`, `fm-`).

### Adding a microgame

1. Create `games/<name>.js`. Copy the shape of `games/balloon-pop.js`: an IIFE with its own `TEXT` and `CSS`, then `registerMicrogame({...})`. Put `name`, `icon` and `howTo` in `TEXT` too. The How to play steps are written for whoever reads them to the child: short, concrete, one action each, and they must match what the code actually does (what a wrong answer costs, what can be tapped to replay).
2. Add `"<name>"` to `GAME_FILES` in `games/manifest.js`.
3. Test it alone with `index.html?game=<id>`, and with each list it supports (`&list=…`).

You don't need to touch `index.html` or the frame.

### Word lists

Content lives in data files, separate from game code, so one game can run with letter, CVC, HFW and phonics versions. Each list has a `type`, and items share a common core:

```js
{ id: "letters-az", type: "letter",  items: [{ text: "A", word: "apple", say: "Ay", emoji: "🍎", pics: [{ word: "apple", emoji: "🍎" }, { word: "ant", emoji: "🐜" }, …] }, …] }
{ id: "cvc",         type: "cvc",    items: [{ text: "cat", sounds: ["c", "a", "t"], emoji: "🐱" }, …] }
{ id: "hfw",         type: "hfw",     items: [{ text: "the" }, { text: "and" }, …] }
{ id: "phonics-az", type: "phonics", items: /* the same item objects as letters-az */ }
```

- `text`: what appears on screen. `say` (optional): how to spell it for the voice when TTS misreads it (a lone "A" can come out as "uh", so it's spelled "Ay").
- `emoji` or an image is how pre-readers get the meaning. Prefer it to words wherever you can.
- Pick distractors from the same list. Prefer ones that are tricky for Japanese learners: L/R, B/V, S/TH, F/H, and b/d/p/q letter shapes.
- `pics` (letters): 3–4 pictures per letter (A: apple, ant, arrow, axe). Each round the frame picks one per item and copies it into `word` / `emoji`, so existing games get variety without knowing about `pics`. A game that wants several pictures of one letter (e.g. "find all the A things") can read `item.pics` directly. Rules for adding one: a clear emoji, not used by any other letter, and not easily named with another letter's word (no 🚌 bus with 🚐 van, no 🎁 "present", no 🐂 "cow").
- The lists today: `letters-az` (26, 93 pictures), `phonics-az` (the same 26 letters and pictures, shared by reference, added at the bottom of `data/lists.js`), `cvc` (142 short-vowel words, 65 with a picture: a picture is only given when it's clear and no other word in the list uses it) and `hfw` (100 Dolch/Fry sight words). No word is in both `cvc` and `hfw`: words that look CVC but don't sound it out (was, his, has) are sight words. The HFW list has no homophones (to/two/too, there/their, no/know), because the listening games would then have two right answers. Keep it that way when adding words.
- **ABC vs PHONICS.** Both use the same letters, but they teach different things, so they're separate types. `letter` (ABC) games are about letter shapes and names: Balloon Pop, Wire Cut, Train Builder, Trace Monster, Whack-a-Mole, Find My Baby, Shuriken Toss, Egg Shuffle and Clean the Room. `phonics` games link a letter to the first sound of a picture's word: Feed Me, Claw Catch, Gone Fishing, and the phonics modes of Balloon Pop, Wire Cut, Train Builder, Whack-a-Mole and Shuriken Toss. In a phonics mode the screen shows the letter and the player picks pictures, with `ctx.phonics` supplying the right and wrong pictures. A new game that asks "which picture starts with B?" takes `phonics`, and one that only needs the letter itself takes `letter`. TTS still can't make letter sounds, so phonics games say letter names and words ("B… ball"). A future list of recorded sounds (digraphs: sh, ch with `audio` clips) would also be type `phonics`.
- Games that need pictures (Feed Me, Claw Catch, and Wire Cut's picture rounds) use only the items that have `emoji`.

## Speech and audio

- Use the Web Speech API (`speechSynthesis`) for letter names, words and sentences. Pick an `en-US`/`en-GB` voice, and prefer local voices.
- `Core.say` lowercases lone capital letters B–Z before speaking, because some voices (iOS) read "E" as "capital E". "A" is left alone, since a lone "a" reads as "uh".
- **TTS can't make phonics sounds** (/b/, /sh/). Phonics content needs recorded clips (`audio` field). Don't try to fake phonemes with TTS.
- Sound effects are synthesized with Web Audio (oscillators). No audio files are needed for SFX.
- If speech isn't available, show a text or emoji cue so the game is still playable.

## Look and feel

- Bright, bold, loud: saturated colors, thick black outlines, hard drop shadows, chunky heavy type, a spinning sunburst background, a new color theme each round.
- Snappy motion: slam, pop, bounce and shake. Respect `prefers-reduced-motion`.
- Mobile first: works one-handed in portrait at about 360 px wide. Tap targets are big (around 1/4 of the screen for answer buttons). Handle input on `pointerdown` so taps feel instant. Use `100dvh` and safe-area insets. No pinch-zoom or double-tap delays.
- Light haptics (`navigator.vibrate`) on result when available.

## Conventions

- **Localization:** all UI text goes in a `TEXT` object or strings file, never inline in markup or logic. English content is what's being taught. UI and instruction text may get a Japanese (`ja`) version later, so keep them keyed.
- **Errors:** log with `console.error("context:", err)`. Don't log expected speech interruptions (`interrupted`/`canceled`). Never let an error stop the game loop: fall back and keep going.
- **Timers:** keep track of every `setTimeout`/`requestAnimationFrame` a game or round starts, so the frame can clear them between games. Stale timers from a finished game are the most likely source of bugs.
- Keep each microgame small and independent. If two games need the same helper, move it into `js/core.js` and expose it on `ctx`, not into another game.

## Testing

There's no test setup yet. Check changes by opening `index.html` in a desktop browser (use `?game=` to focus on one game) and on a real phone (iOS Safari and Android Chrome). Speech, audio unlock and touch behavior differ there in ways desktop won't show.

Speech only works after a real tap. If a script clicks the start button, you'll see `speech: not-allowed` errors, and that's expected.

Browser automation tabs are often throttled to about 2 animation frames a second when the window is covered, so games that step by frame time (Claw Catch) barely move. For scripted tests, run `window.requestAnimationFrame = (cb) => setTimeout(() => cb(performance.now()), 16)` in the page before starting.
