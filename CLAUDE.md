# WarioWare English

A WarioWare-style collection of fast English microgames for Japanese kids learning the alphabet, phonics and reading. Each microgame lasts a few seconds: flash an instruction, the player acts, win or lose, then the next game starts, a little faster.

Audience: young Japanese children, many of whom can't read English yet (and some can't read much Japanese either). Design for kids: big targets, very little reading needed to play, instant and obvious feedback.

## Current state

- `index.html` holds one standalone microgame, **Letter Dash** ("TAP THE LETTER!"): the browser speaks "B for ball" and the player taps the right one of four letters within 5 s. The game ends at 10 points.
- `games/wire-cut.js` is **Wire Cut** ("CUT THE WRONG WIRE!"), the first microgame written to the contract below. Pairs (A—a, or 🐱—cat for word lists) are wired to a bomb, and one pair is wrong. Cutting it gives confetti; cutting a good wire sets off an explosion. Faster speeds add a 4th pair and cross the wires.
- `games/feed-me.js` is **Feed Me** ("FEED ME!"). A picture from the list (🍎) gets crazy eyes and a big mouth, the voice says "A for apple", and the player drags the right tile into its mouth. A wrong tile gets spat out. Dropping it anywhere else just snaps it back. Faster speeds add a 4th tile, then make the creature sway. It needs `emoji`, so it only takes letter and cvc lists.
- `stand.html` is a **temporary test stand** that runs registered microgames (`?game=wire-cut`, `?list=cvc-short-a`). It's a minimal stand-in for the frame and should be replaced by it.
- `data/lists.js` holds the shared word lists (`letters-az`, `cvc-short-a`) as `window.WORD_LISTS`. Items can have `tricky: [...]` naming preferred distractors from the same list.
- Contract additions used by Wire Cut: a game may declare `duration` (base ms before speed-up), and `ctx.audio` is the shared, already-unlocked `AudioContext` (or null) for game-specific SFX.
- Letter Dash came before the shared frame. It has its own timer, score and game-over screen, and no lives or speed-up. Once the frame exists, rebuild it as the first microgame that plugs into the frame.

## Architecture (target)

A single-page web app. Plain HTML/CSS/JS with no build step and no framework unless we decide otherwise. It must keep working when you open `index.html` directly or serve it from any static host.

### The shared frame

All microgames run inside one frame. **Only the frame** handles:

- **Instruction flash:** a short shouted command ("TAP THE LETTER!") with a slam-in animation and a background flash, about 1 s.
- **Timer:** one timer bar for every game, green → orange → red, with ticks near the end.
- **Lives:** missing or running out of time costs a life. Game over when lives reach 0.
- **Speed-up:** after every N cleared games, the timer gets shorter and the game is told to play faster.
- **Between-game feedback:** happy sound or buzz, a YES!/NOPE! stamp, score and streak.
- **Audio unlock:** a start screen tap creates the `AudioContext` and calls `speechSynthesis`. iOS blocks sound until the first tap.
- **Picking the next microgame** and the word list it uses.

A microgame never draws its own timer, lives, score or result screens. It reports win or lose to the frame.

### Microgame contract

Each microgame is one self-contained module that registers itself with the frame. Roughly:

```js
registerMicrogame({
  id: "tap-the-letter",
  instruction: { en: "TAP THE LETTER!" },   // shown in the flash
  contentTypes: ["letter", "cvc", "hfw", "phonics"], // which word lists it can use
  start(ctx) {
    // ctx.root      – element to render into (the frame clears it afterwards)
    // ctx.items     – items picked from the current word list
    // ctx.list      – the list's metadata (type, id)
    // ctx.speed     – 1, 1.25, 1.5…  scale animations/difficulty with it
    // ctx.say(text) – speak through the shared voice
    // ctx.win() / ctx.lose() – call exactly once
    // return an optional cleanup function
  },
});
```

Rules:
- Call `ctx.win()` or `ctx.lose()` once. If you call neither, the timer runs out and counts as a loss.
- Ignore input after the result has been reported.
- Don't hard-code content. Everything the player sees or hears comes from `ctx.items`.
- The game must be playable without reading the instruction: use icons, speech and an obvious goal.

### Word lists

Content lives in data files, separate from game code, so one game can run with letter, CVC, HFW and phonics versions. Each list has a `type`, and items share a common core:

```js
{ id: "letters-az", type: "letter",  items: [{ text: "A", word: "apple", say: "Ay", emoji: "🍎" }, …] }
{ id: "cvc-short-a", type: "cvc",    items: [{ text: "cat", sounds: ["c", "a", "t"], emoji: "🐱" }, …] }
{ id: "hfw-set-1",  type: "hfw",     items: [{ text: "the" }, { text: "and" }, …] }
{ id: "digraphs",   type: "phonics", items: [{ text: "sh", word: "ship", audio: "audio/sh.mp3", emoji: "🚢" }, …] }
```

- `text`: what appears on screen. `say` (optional): how to spell it for the voice when TTS misreads it (a lone "A" can come out as "uh", so it's spelled "Ay").
- `emoji` or an image is how pre-readers get the meaning. Prefer it to words wherever you can.
- Pick distractors from the same list. Prefer ones that are tricky for Japanese learners: L/R, B/V, S/TH, F/H, and b/d/p/q letter shapes.

## Speech and audio

- Use the Web Speech API (`speechSynthesis`) for letter names, words and sentences. Pick an `en-US`/`en-GB` voice, and prefer local voices.
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
- Keep each microgame small and independent. If two games need the same helper, move it into the frame, not into another game.

## Testing

No test setup yet. Check changes by opening `index.html` in a desktop browser and on a real phone (iOS Safari and Android Chrome). Speech, audio unlock and touch behavior differ there in ways desktop won't show.
