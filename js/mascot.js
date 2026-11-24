// CHARACTERS: "you". The player picks a character the first time (and can change it from the title menu's
// 👤 button); it's purely cosmetic, and shows up wherever "you" appear: between rounds, in the boss battles'
// YOU panel, on the results screen with a victory cheer, and in the games that draw you (Tug of War, Lake
// Leap, Chicken Choir…). Games and scenes draw the chosen one with Mascot.el(size) and set a mood with
// Mascot.mood(el, m): "cheer" (arms up, hopping), "pull" (leaning back: Tug of War), "eat" (chomping), "sad"
// (frown and tears), or null. Add "muddy" as a class for mud splotches.
//
// The characters (the teacher's idea): Blitz, the orange monster, and LETTER MONSTERS: a big chunky capital
// letter dressed up as its word (A is an apple, B a ball…), with googly eyes, arms and legs, so each one
// is a little phonics lesson ("A for apple!"). A–F are there from the start; the rest are unlocked by
// playing (Fun, Endless, Boss Battle), beating a boss unlocks that boss as a character, and beating each
// Adventure island's boss unlocks V–Z.
(function () {
  const C = () => window.Core;
  const CHAR_KEY = "wwe.char", UNLOCK_KEY = "wwe.chars", PLAYED_KEY = "wwe.played";
  // id, name, letter (none for Blitz and the bosses), word, colour, and how it's unlocked (none: a starter).
  const CHARS = [
    { id: "blitz", name: "Blitz", color: "#ff8a1f", line: "I'm Blitz!" },
    { id: "apple", name: "Apple", letter: "A", word: "apple", color: "#e8173c" },
    { id: "ball", name: "Ball", letter: "B", word: "ball", color: "#ff8a00" },
    { id: "cat", name: "Cat", letter: "C", word: "cat", color: "#ffb02e" },
    { id: "dinosaur", name: "Dinosaur", letter: "D", word: "dinosaur", color: "#3fb54a" },
    { id: "elephant", name: "Elephant", letter: "E", word: "elephant", color: "#9aa3b5" },
    { id: "flower", name: "Flower", letter: "F", word: "flower", color: "#ff6fb0" },
    // Unlockables (the teacher's plan; P to Z come later). Fun mode: your score out of 10.
    { id: "guitar", name: "Guitar", letter: "G", word: "guitar", color: "#d9822b", unlock: "fun", at: 3, hint: "Score 3 in Fun mode!" },
    { id: "helicopter", name: "Helicopter", letter: "H", word: "helicopter", color: "#2f8fe0", unlock: "fun", at: 5, hint: "Score 5 in Fun mode!" },
    { id: "iguana", name: "Iguana", letter: "I", word: "iguana", color: "#5cc94a", unlock: "fun", at: 7, hint: "Score 7 in Fun mode!" },
    { id: "jellybaby", name: "Jelly Baby", letter: "J", word: "jelly baby", color: "#ff4fa0", unlock: "fun", at: 10, hint: "Score 10/10 in Fun mode!" },
    // Endless mode: games cleared in one run.
    { id: "lion", name: "Lion", letter: "L", word: "lion", color: "#ffc233", unlock: "endless", at: 5, hint: "Clear 5 in Endless mode!" },
    { id: "monkey", name: "Monkey", letter: "M", word: "monkey", color: "#a8652f", unlock: "endless", at: 10, hint: "Clear 10 in Endless mode!" },
    { id: "ninja", name: "Ninja", letter: "N", word: "ninja", color: "#3a3f4a", unlock: "endless", at: 15, hint: "Clear 15 in Endless mode!" },
    { id: "orange", name: "Orange", letter: "O", word: "orange", color: "#ff8c1a", unlock: "endless", at: 20, hint: "Clear 20 in Endless mode!" },
    // …and every 5 more up to 50 (the teacher's plan)
    { id: "pirate", name: "Pirate", letter: "P", word: "pirate", color: "#e8173c", unlock: "endless", at: 25, hint: "Clear 25 in Endless mode!" },
    { id: "queen", name: "Queen", letter: "Q", word: "queen", color: "#c04dd9", unlock: "endless", at: 30, hint: "Clear 30 in Endless mode!" },
    { id: "rabbit", name: "Rabbit", letter: "R", word: "rabbit", color: "#d9d9e6", unlock: "endless", at: 35, hint: "Clear 35 in Endless mode!" },
    { id: "snake", name: "Snake", letter: "S", word: "snake", color: "#46b84a", unlock: "endless", at: 40, hint: "Clear 40 in Endless mode!" },
    { id: "tiger", name: "Tiger", letter: "T", word: "tiger", color: "#ff8c1a", unlock: "endless", at: 45, hint: "Clear 45 in Endless mode!" },
    { id: "umbrella", name: "Umbrella", letter: "U", word: "umbrella", color: "#2f8fe0", unlock: "endless", at: 50, hint: "Clear 50 in Endless mode!" },
    // Adventure (the teacher's plan): beat an island's boss for its letter, V to Z in island order.
    { id: "volcano", name: "Volcano", letter: "V", word: "volcano", color: "#8a5a3c", unlock: "island", island: "jungle", hint: "Beat 🌴 JUNGLE in Adventure!" },
    { id: "watermelon", name: "Watermelon", letter: "W", word: "watermelon", color: "#ff4f6d", unlock: "island", island: "ninja", hint: "Beat 🏯 NINJA CASTLE in Adventure!" },
    { id: "fox", name: "Fox", letter: "X", word: "fox", color: "#ff7a1a", unlock: "island", island: "funfair", line: "X is in fox!", hint: "Beat 🎡 ROBOT FUNFAIR in Adventure!" },
    { id: "yarn", name: "Yarn", letter: "Y", word: "yarn", color: "#c04dd9", unlock: "island", island: "nursery", hint: "Beat 🧸 TOY NURSERY in Adventure!" },
    { id: "zombie", name: "Zombie", letter: "Z", word: "zombie", color: "#8fd16a", unlock: "island", island: "cottage", hint: "Beat 🏡 COSY COTTAGE in Adventure!" },
    // Boss Battle: beat a boss to play as it; beat all four for King.
    { id: "king", name: "King", letter: "K", word: "king", color: "#9c6bff", unlock: "allBosses", hint: "Beat 4 bosses!" },
    { id: "banana", name: "Banana Boss", boss: true, unlock: "boss", hint: "Beat Banana Boss!" },
    { id: "baby", name: "Baby Boss", boss: true, unlock: "boss", hint: "Beat Baby Boss!" },
    { id: "robot", name: "Robot Boss", boss: true, unlock: "boss", hint: "Beat Robot Boss!" },
    { id: "gorilla", name: "Gorilla Boss", boss: true, unlock: "boss", hint: "Beat Gorilla Boss!" },
    { id: "kitty", name: "Kitty Boss", boss: true, unlock: "boss", hint: "Beat Kitty Boss!" },
  ];
  const byId = (id) => CHARS.find((c) => c.id === id);

  const CSS = `
  .ms { position:relative; width:var(--mz); height:var(--mz); flex:none; }
  .ms * { box-sizing:border-box; }
  .ms-in { position:absolute; inset:0; transform-origin:50% 100%; animation:ms-bob .9s ease-in-out infinite alternate; }
  .ms-leg { position:absolute; bottom:0; width:13%; height:22%; background:var(--cc); border:calc(var(--mz) * .03) solid #111; border-radius:99px 99px 40% 40%; }
  .ms-leg.l { left:31%; } .ms-leg.r { right:31%; }
  .ms-arm { position:absolute; top:46%; width:30%; height:12%; background:var(--cc); border:calc(var(--mz) * .03) solid #111; border-radius:99px; z-index:1; transition:transform .15s; }
  .ms-arm.l { left:0; transform-origin:100% 50%; transform:rotate(-25deg); } .ms-arm.r { right:0; transform-origin:0 50%; transform:rotate(25deg); }
  .ms-body { position:absolute; left:18%; right:18%; top:8%; bottom:16%; background:var(--cc); border:calc(var(--mz) * .035) solid #111; border-radius:46% 46% 40% 40%; z-index:2;
    box-shadow:inset calc(var(--mz) * -.05) calc(var(--mz) * -.04) 0 rgba(0,0,0,.12); }
  /* A letter monster's body: the big letter itself */
  .ms-glyph { position:absolute; left:0; right:0; top:-2%; height:86%; z-index:2; display:flex; align-items:center; justify-content:center; font-family:"Arial Black", system-ui, sans-serif;
    font-weight:900; font-size:calc(var(--mz) * .86); line-height:1; color:var(--cc); -webkit-text-stroke:calc(var(--mz) * .035) #111; paint-order:stroke fill;
    text-shadow:0 calc(var(--mz) * .04) 0 rgba(0,0,0,.25); }
  .ms-face { position:absolute; left:0; right:0; top:0; bottom:0; z-index:3; }
  .ms-eye { position:absolute; top:16%; width:30%; aspect-ratio:1; background:#fff; border:calc(var(--mz) * .025) solid #111; border-radius:50%; overflow:hidden; z-index:3; }
  .ms-eye.l { left:16%; } .ms-eye.r { right:16%; width:25%; top:20%; }
  .ms-eye i { position:absolute; left:28%; top:30%; width:46%; aspect-ratio:1; background:#111; border-radius:50%; animation:ms-roll 1.3s ease-in-out infinite alternate; }
  .ms-eye.r i { animation-delay:-.6s; }
  .ms-mouth { position:absolute; left:30%; right:30%; top:48%; height:20%; background:#5a0f1e; border:calc(var(--mz) * .022) solid #111; border-radius:10% 10% 50% 50% / 14% 14% 86% 86%;
    overflow:hidden; z-index:3; }
  .ms-mouth::before { content:""; position:absolute; left:6%; right:6%; top:0; height:30%; background:repeating-linear-gradient(90deg, #fff 0 22%, #ddd 22% 25%); }
  .ms-mouth::after { content:""; position:absolute; left:28%; width:44%; bottom:-14%; height:48%; border-radius:50%; background:#ff6f91; }
  .ms-tear { position:absolute; top:38%; width:7%; height:0; background:#5ec8ff; border-radius:0 0 99px 99px; z-index:4; opacity:0; }
  .ms-tear.l { left:24%; } .ms-tear.r { right:24%; }
  .ms-d { position:absolute; z-index:1; pointer-events:none; line-height:1; }
  .ms-mud { position:absolute; inset:0; z-index:5; pointer-events:none; opacity:0;
    background:radial-gradient(circle at 30% 30%, #6b4320 0 9%, transparent 10%), radial-gradient(circle at 70% 55%, #6b4320 0 12%, transparent 13%),
      radial-gradient(circle at 45% 80%, #6b4320 0 10%, transparent 11%), radial-gradient(circle at 20% 65%, #6b4320 0 7%, transparent 8%); }
  .ms.muddy .ms-mud { opacity:.9; }
  .ms-boss { position:absolute; left:0; top:0; }

  /* Letter monsters: the letter must stay readable (the point of them), so the eyes perch on top of it and the
     grin is small and low */
  .ms:not(.ms-blitz) .ms-eye.l { left:24%; top:-6%; width:24%; } .ms:not(.ms-blitz) .ms-eye.r { right:24%; top:-4%; width:20%; }
  .ms:not(.ms-blitz) .ms-mouth { left:38%; right:38%; top:56%; height:13%; }
  .ms:not(.ms-blitz) .ms-tear { top:14%; }
  .ms-glyph { top:4%; height:84%; font-size:calc(var(--mz) * .92); }
  .ms-elephant .ms-d.trunk { top:22%; height:26%; }
  .ms-elephant .ms-mouth { top:60% !important; }
  .ms-apple .ms-d.stalk { top:2%; } .ms-apple .ms-d.leaf { top:4%; }   /* planted on the A's point (top ~15%) */
  /* Blitz: the orange monster (its own round body; the face sits on it) */
  .ms-blitz .ms-face { left:18%; right:18%; top:8%; bottom:16%; }
  .ms-blitz .ms-eye.l { left:10%; width:34%; top:16%; } .ms-blitz .ms-eye.r { right:8%; width:28%; top:20%; }
  .ms-blitz .ms-mouth { left:22%; right:22%; top:58%; height:24%; }
  .ms-blitz .ms-tear { top:44%; }
  /* A for apple: a red A with a stalk and a leaf */
  .ms-apple .ms-d.stalk { left:47%; top:-10%; width:7%; height:16%; background:#6b4a1f; border:calc(var(--mz) * .02) solid #111; border-radius:4px; transform:rotate(10deg); }
  .ms-apple .ms-d.leaf { left:53%; top:-10%; width:22%; height:12%; background:#3fb54a; border:calc(var(--mz) * .02) solid #111; border-radius:0 80% 0 80%; transform:rotate(-12deg); }
  /* B for ball: a bouncy B with a ball's seams */
  .ms-ball .ms-in { animation:ms-bounce .5s cubic-bezier(.3,.1,.6,1) infinite alternate; }
  /* B for ball: the B's two bumps are balls (the teacher's idea): a tennis ball on top, a soccer ball below */
  .ms-ball .ms-d.tennis, .ms-ball .ms-d.soccer { z-index:3; border:calc(var(--mz) * .03) solid #111; border-radius:50%; overflow:hidden; }
  .ms-ball .ms-d.tennis { left:37%; top:11%; width:38%; height:38%; background:#d4f03c; }
  .ms-ball .ms-d.tennis::before, .ms-ball .ms-d.tennis::after { content:""; position:absolute; top:8%; width:70%; height:84%; border:calc(var(--mz) * .018) solid #fff; border-radius:50%; }
  .ms-ball .ms-d.tennis::before { left:-46%; } .ms-ball .ms-d.tennis::after { right:-46%; }
  .ms-ball .ms-d.soccer { left:36%; top:40%; width:46%; height:46%; background:#fff;
    background-image:radial-gradient(circle at 50% 48%, #111 0 15%, transparent 16%), radial-gradient(circle at 50% -4%, #111 0 14%, transparent 15%),
      radial-gradient(circle at -2% 55%, #111 0 14%, transparent 15%), radial-gradient(circle at 102% 55%, #111 0 14%, transparent 15%),
      radial-gradient(circle at 22% 102%, #111 0 13%, transparent 14%), radial-gradient(circle at 78% 102%, #111 0 13%, transparent 14%); }
  .ms-ball .ms-mouth { top:60% !important; height:10% !important; }
  /* C for cat: ears, whiskers and a curly tail */
  /* (positions are against the letter itself: a capital spans about 18%–84% across and 15%–83% down) */
  .ms-cat .ms-d.ear { top:-12%; width:26%; height:26%; background:var(--cc); border:calc(var(--mz) * .025) solid #111; clip-path:polygon(50% 0, 100% 100%, 0 100%); }
  .ms-cat .ms-d.ear::after { content:""; position:absolute; left:30%; right:30%; top:38%; bottom:8%; background:#ff9cc0; clip-path:polygon(50% 0, 100% 100%, 0 100%); }
  .ms-cat .ms-d.ear.l { left:16%; top:-4%; transform:rotate(-22deg); } .ms-cat .ms-d.ear.r { left:58%; top:-4%; transform:rotate(22deg); }
  .ms-cat .ms-d.tail { left:66%; top:50%; width:30%; height:38%; border:calc(var(--mz) * .05) solid #111; border-color:transparent #111 #111 transparent; border-radius:50%; transform-origin:15% 85%; /* (the arc's end on the C: it wags from there) */
    animation:ms-tail .6s ease-in-out infinite alternate; }
  .ms-cat .ms-d.whisk { left:10%; right:10%; top:42%; height:12%; z-index:4; border-top:2px solid #111; border-bottom:2px solid #111; }
  /* D for dinosaur: spikes down its back and a tail */
  /* D for dinosaur: spikes down the D's curved back, a tail from the bottom of its straight side */
  .ms-dinosaur .ms-d.spk { width:15%; height:15%; margin:-7.5% 0 0 -7.5%; background:#1f7a2a; border:0; clip-path:polygon(50% 0, 100% 100%, 0 100%); transform:rotate(var(--a)) translateY(-45%); }
  .ms-dinosaur .ms-d.tail { left:0; top:64%; width:30%; height:15%; background:var(--cc); border:calc(var(--mz) * .025) solid #111; border-radius:99px 20% 20% 99px;
    transform-origin:100% 50%; transform:rotate(-24deg); }
  /* E for elephant: big round ears and a trunk */
  .ms-elephant .ms-d.ear { top:6%; width:34%; height:40%; background:#b8c0cf; border:calc(var(--mz) * .03) solid #111; border-radius:50%;
    box-shadow:inset 0 0 0 calc(var(--mz) * .05) #ffb3c7; }
  .ms-elephant .ms-d.ear.l { left:-14%; } .ms-elephant .ms-d.ear.r { right:-14%; }
  .ms-elephant .ms-d.trunk { left:44%; top:38%; width:13%; height:30%; z-index:4; background:var(--cc); border:calc(var(--mz) * .025) solid #111; border-radius:40% 40% 99px 99px;
    transform-origin:50% 0; animation:ms-trunk .7s ease-in-out infinite alternate; }
  .ms-elephant .ms-mouth { top:58%; }
  /* F for flower: a big flower blooming on top, and a leaf */
  .ms-flower .ms-leg.l, .ms-pirate .ms-leg.l { left:24%; } .ms-flower .ms-leg.r, .ms-pirate .ms-leg.r { right:auto; left:38%; }   /* under the F's stem */
  .ms-flower .ms-d.bloom { left:76%; top:4%; transform:translateX(-50%); font-size:calc(var(--mz) * .3); animation:ms-spin 4s linear infinite; z-index:3; }  /* on the end of the F's top bar */
  .ms-flower .ms-d.leaf { left:8%; top:58%; width:24%; height:14%; background:#3fb54a; border:calc(var(--mz) * .02) solid #111; border-radius:0 80% 0 80%; }
  /* G for guitar: a neck with tuning pegs sticking up, a sound hole, a floating note */
  .ms-guitar .ms-d.neck { left:66%; top:-14%; width:10%; height:44%; background:#5a3510; border:calc(var(--mz) * .02) solid #111; border-radius:3px; transform-origin:50% 100%; transform:rotate(24deg);
    box-shadow:inset 0 calc(var(--mz) * .06) 0 #222; }
  .ms-guitar .ms-d.hole { left:56%; top:56%; width:14%; aspect-ratio:1; z-index:3; background:#3a2208; border:calc(var(--mz) * .02) solid #111; border-radius:50%; }
  .ms-guitar .ms-d.note { right:-14%; top:-10%; font-size:calc(var(--mz) * .2); animation:ms-twinkle .5s ease-in-out infinite alternate; }
  /* H for helicopter: a spinning rotor on top and a tail rotor; it hovers */
  /* (the mast rises from the H's crossbar through the gap; the tail rotor sits on a boom off the right post) */
  .ms-helicopter .ms-d.mast { left:47%; top:-12%; width:6%; height:58%; background:#555; border:calc(var(--mz) * .015) solid #111; }
  .ms-helicopter .ms-d.rotor { left:4%; right:4%; top:-15%; height:5%; background:#333; border-radius:99px; animation:ms-rotor .18s linear infinite; }
  .ms-helicopter .ms-d.boom { left:80%; top:33%; width:14%; height:6%; background:#555; border:calc(var(--mz) * .015) solid #111; border-radius:0 99px 99px 0; }
  .ms-helicopter .ms-d.tailr { left:86%; top:25%; width:20%; aspect-ratio:1; border-radius:50%; border:calc(var(--mz) * .025) dashed #333; animation:ms-spin2 .3s linear infinite; }
  .ms-helicopter .ms-in { animation:ms-hover 1s ease-in-out infinite alternate; }
  /* I for iguana: a spiky crest down its back and a long curly tail */
  .ms-iguana .ms-d.crest { left:28%; width:12%; top:2%; height:76%; background:#2f8a2a; clip-path:polygon(100% 0, 0 8%, 100% 16%, 0 24%, 100% 32%, 0 40%, 100% 48%, 0 56%, 100% 64%, 0 72%, 100% 80%, 100% 100%); }
  .ms-iguana .ms-d.tail { left:50%; top:52%; width:44%; height:30%; transform-origin:15% 85%; border:calc(var(--mz) * .045) solid #2f8a2a; border-color:transparent #2f8a2a #2f8a2a transparent; border-radius:50%;
    animation:ms-tail .7s ease-in-out infinite alternate; }
  /* J for jelly baby: shiny, see-through and wobbly, like the sweet */
  .ms-jellybaby .ms-glyph { opacity:.9; text-shadow:0 0 calc(var(--mz) * .08) rgba(255,255,255,.9); }
  .ms-jellybaby .ms-in { animation:ms-jelly .4s ease-in-out infinite alternate; }
  .ms-jellybaby .ms-d.shine { left:56%; top:14%; width:7%; height:24%; z-index:4; background:rgba(255,255,255,.9); border-radius:99px; transform:rotate(8deg); }
  /* L for lion: a big shaggy mane behind it and a tufted tail */
  .ms-lion .ms-d.mane { left:-6%; right:-6%; top:-12%; height:96%; z-index:0; border-radius:50%;
    background:repeating-conic-gradient(#e07a1c 0 14deg, #b85a10 14deg 28deg); border:calc(var(--mz) * .03) solid #111; }
  .ms-lion .ms-d.tuft { left:80%; top:62%; width:16%; aspect-ratio:1; background:#b85a10; border:calc(var(--mz) * .02) solid #111; border-radius:50% 50% 50% 0; }
  /* M for monkey: round ears, a tan muzzle and a curly tail */
  .ms-monkey .ms-d.ear { top:2%; width:24%; aspect-ratio:1; background:#a8652f; border:calc(var(--mz) * .03) solid #111; border-radius:50%; box-shadow:inset 0 0 0 calc(var(--mz) * .04) #f0c48a; }
  .ms-monkey .ms-d.ear.l { left:2%; } .ms-monkey .ms-d.ear.r { right:2%; }
  .ms-monkey .ms-d.patch { left:34%; right:34%; top:50%; height:24%; z-index:2; background:#f0c48a; border:calc(var(--mz) * .02) solid #111; border-radius:50%; }
  .ms-monkey .ms-d.tail { left:2%; bottom:14%; width:34%; height:30%; border:calc(var(--mz) * .045) solid #111; border-color:#111 transparent transparent #111; border-radius:50%; transform-origin:85% 15%; animation:ms-tail .6s ease-in-out infinite alternate; }
  /* N for ninja: a red headband with flapping tails, and a sword on its back */
  .ms-ninja .ms-d.band { left:6%; right:6%; top:14%; height:10%; z-index:2; background:#e8173c; border:calc(var(--mz) * .02) solid #111; }
  .ms-ninja .ms-d.tails { right:-12%; top:12%; width:22%; height:16%; background:#e8173c; border:calc(var(--mz) * .02) solid #111; clip-path:polygon(0 20%, 100% 0, 60% 50%, 100% 100%, 0 80%);
    transform-origin:0 50%; animation:ms-flap .3s ease-in-out infinite alternate; }
  .ms-ninja .ms-d.sword { left:6%; top:-12%; width:7%; height:60%; background:linear-gradient(#e6e6e6 68%, #5a3510 68%); border:calc(var(--mz) * .015) solid #111; transform:rotate(-26deg); }
  /* O for orange: a stalk and a leaf on top, and dimpled peel */
  .ms-orange .ms-d.stalk { left:47%; top:6%; width:7%; height:12%; background:#6b4a1f; border:calc(var(--mz) * .015) solid #111; border-radius:3px; z-index:1; }
  .ms-orange .ms-d.leaf { left:52%; top:3%; width:20%; height:10%; background:#3fb54a; border:calc(var(--mz) * .02) solid #111; border-radius:0 80% 0 80%; transform:rotate(-14deg); z-index:1; }
  /* P for pirate: a black pirate hat with a skull, and an eye patch over its right eye */
  .ms-pirate .ms-d.hat { left:14%; top:-26%; width:72%; height:22%; background:#111; border-radius:50% 50% 12% 12% / 80% 80% 20% 20%; z-index:1;
    display:flex; align-items:center; justify-content:center; font-size:calc(var(--mz) * .12); line-height:1; }
  .ms-pirate .ms-eye.r { background:#111 !important; } .ms-pirate .ms-eye.r i { display:none; }
  .ms-pirate .ms-d.strap { left:30%; right:16%; top:2%; height:3%; background:#111; transform:rotate(-10deg); z-index:4; }
  /* Q for queen: a golden tiara with a gem, and a pearl necklace */
  .ms-queen .ms-d.tiara { left:30%; top:-15%; width:40%; height:16%; background:#ffd400; border:calc(var(--mz) * .018) solid #111; z-index:1;
    clip-path:polygon(0 100%, 0 40%, 20% 70%, 35% 10%, 50% 60%, 65% 10%, 80% 70%, 100% 40%, 100% 100%); }
  .ms-queen .ms-d.gem { left:46%; top:-9%; width:8%; height:8%; background:#ff4fa0; border:2px solid #111; border-radius:50%; z-index:2; }
  .ms-queen .ms-d.pearls { left:30%; right:30%; top:70%; height:7%; z-index:3; background:radial-gradient(circle, #fff 0 40%, #111 42% 55%, transparent 57%) 0 0 / 20% 100%; }
  /* R for rabbit: long ears (one flopped), buck teeth, a fluffy tail */
  .ms-rabbit .ms-d.ear { top:-40%; width:16%; height:44%; background:var(--cc); border:calc(var(--mz) * .025) solid #111; border-radius:50%; z-index:1; transform-origin:50% 100%; }
  .ms-rabbit .ms-d.ear::after { content:""; position:absolute; left:28%; right:28%; top:14%; bottom:14%; background:#ff9cc0; border-radius:50%; }
  .ms-rabbit .ms-d.ear.l { left:28%; transform:rotate(-10deg); } .ms-rabbit .ms-d.ear.r { left:54%; transform:rotate(38deg); animation:ms-flop 1s ease-in-out infinite alternate; }
  .ms-rabbit .ms-d.teeth { left:44%; top:64%; width:12%; height:9%; z-index:4; background:#fff; border:2px solid #111; border-top:0; border-radius:0 0 4px 4px;
    background-image:linear-gradient(90deg, transparent 46%, #111 46% 54%, transparent 54%); }
  .ms-rabbit .ms-d.puff { left:10%; top:66%; width:18%; height:18%; background:#fff; border:calc(var(--mz) * .02) solid #111; border-radius:50%; }
  /* S for snake: a flicking forked tongue and a little rattle */
  .ms-snake .ms-d.tongue { left:46%; top:66%; width:8%; height:16%; z-index:4; background:#e8173c; transform-origin:50% 0;
    clip-path:polygon(30% 0, 70% 0, 70% 70%, 100% 100%, 50% 80%, 0 100%, 30% 70%); animation:ms-tongue .5s ease-in-out infinite alternate; }
  /* T for tiger: black stripes on the letter and round ears */
  .ms-tiger .ms-d.stripe { z-index:3; background:#111; border-radius:99px; }
  .ms-tiger .ms-d.stripe.a { left:24%; top:18%; width:4%; height:14%; transform:rotate(14deg); } .ms-tiger .ms-d.stripe.b { left:72%; top:18%; width:4%; height:14%; transform:rotate(-14deg); }
  .ms-tiger .ms-d.stripe.c { left:41%; top:48%; width:18%; height:3.5%; transform:rotate(-12deg); } .ms-tiger .ms-d.stripe.d { left:41%; top:72%; width:18%; height:3.5%; transform:rotate(12deg); }
  .ms-tiger .ms-d.ear { top:4%; width:20%; height:20%; background:var(--cc); border:calc(var(--mz) * .025) solid #111; border-radius:50%; box-shadow:inset 0 0 0 calc(var(--mz) * .035) #ffe0b0; }
  .ms-tiger .ms-d.ear.l { left:12%; } .ms-tiger .ms-d.ear.r { right:12%; }
  /* U for umbrella: a striped canopy over its head (the U is the handle), and a raindrop */
  .ms-umbrella .ms-d.canopy { left:4%; right:4%; top:-36%; height:30%; z-index:1; border:calc(var(--mz) * .025) solid #111; border-radius:100% 100% 0 0 / 100% 100% 0 0;
    background:repeating-conic-gradient(from -90deg at 50% 100%, #e8173c 0 22.5deg, #fff 22.5deg 45deg); }
  .ms-umbrella .ms-d.pole { left:48.5%; top:-8%; width:3%; height:70%; background:#111; z-index:1; }  /* down to the U's curve */
  .ms-umbrella .ms-d.drop { right:-8%; top:-30%; font-size:calc(var(--mz) * .16); animation:ms-drip 1.2s ease-in infinite; }
  @keyframes ms-flop { from { transform:rotate(30deg); } to { transform:rotate(48deg); } }
  @keyframes ms-tongue { from { transform:scaleY(.3); } to { transform:scaleY(1); } }
  @keyframes ms-drip { from { translate:0 0; opacity:1; } to { translate:0 calc(var(--mz) * .6); opacity:0; } }
  /* V for volcano: lava bubbling up in the V's crater, spurting blobs, lava dribbling over both rims, smoke */
  .ms-volcano .ms-d.lava { left:39%; top:12%; width:24%; height:34%; z-index:1; background:radial-gradient(circle at 50% 30%, #fff36b 0 18%, #ffb000 30%, #ff4a00 70%);
    border-radius:50% 50% 40% 40%; box-shadow:0 0 calc(var(--mz) * .08) #ff7a00; animation:ms-glowp .5s ease-in-out infinite alternate; }
  .ms-volcano .ms-d.blob { left:45%; top:8%; width:12%; aspect-ratio:1; z-index:4; background:#ff6a00; border:calc(var(--mz) * .015) solid #111; border-radius:50%;
    animation:ms-spurt 1.1s ease-out infinite; }
  .ms-volcano .ms-d.blob.b { animation-delay:-.4s; --dx:-1; } .ms-volcano .ms-d.blob.c { animation-delay:-.75s; --dx:1.2; width:7%; }
  .ms-volcano .ms-d.smoke { left:30%; top:-40%; width:44%; height:30%; z-index:0; animation:ms-smoke 2s ease-out infinite;
    background:radial-gradient(circle at 30% 65%, #9a9aa6 0 24%, transparent 25%), radial-gradient(circle at 55% 40%, #b4b4c0 0 28%, transparent 29%),
      radial-gradient(circle at 76% 64%, #8a8a96 0 22%, transparent 23%); }
  .ms-volcano .ms-d.drip { z-index:3; top:13%; width:15%; height:14%; background:#ff5a00; border:calc(var(--mz) * .018) solid #111; border-top:0;
    border-radius:0 0 40% 60% / 0 0 100% 70%; }
  .ms-volcano .ms-d.drip.l { left:17%; } .ms-volcano .ms-d.drip.r { left:69%; border-radius:0 0 60% 40% / 0 0 70% 100%; }
  @keyframes ms-glowp { to { filter:brightness(1.25); } }
  @keyframes ms-spurt { 0% { transform:translate(0, 60%) scale(.6); opacity:0; } 15% { opacity:1; } 100% { transform:translate(calc(var(--dx, .6) * 120%), -260%) scale(1); opacity:0; } }
  @keyframes ms-smoke { from { transform:translateY(30%) scale(.6); opacity:.9; } to { transform:translateY(-40%) scale(1.3); opacity:0; } }
  /* W for watermelon: the letter itself is the fruit (red flesh with black seeds, a green rind along the top), so
     nothing floats off the strokes */
  .ms-watermelon .ms-glyph, .ms-yarn .ms-glyph { color:transparent; -webkit-background-clip:text; background-clip:text; text-shadow:none; }
  /* (the seeds are a repeating pattern, so wherever the strokes fall they get seeds) */
  .ms-watermelon .ms-glyph { background-color:#ff4f6d;
    background-image:linear-gradient(#1f7a2a 0 22%, #8fe36b 22% 27%, #fff4f0 27% 31%, transparent 31%),
      radial-gradient(ellipse 16% 24% at 50% 50%, #111 85%, transparent 100%), radial-gradient(ellipse 16% 24% at 50% 50%, #111 85%, transparent 100%);
    background-size:100% 100%, 13% 14%, 13% 14%; background-position:0 0, 0 0, 6.5% 7%; background-repeat:no-repeat, repeat, repeat; }
  /* X is in fox: pointy ears on the top tips, a bushy white-tipped tail, white cheeks and a black nose */
  .ms-fox .ms-d.ear { top:-12%; width:24%; height:30%; background:var(--cc); border:calc(var(--mz) * .025) solid #111; clip-path:polygon(50% 0, 100% 100%, 0 100%); }
  .ms-fox .ms-d.ear::after { content:""; position:absolute; left:28%; right:28%; top:40%; bottom:6%; background:#3a2208; clip-path:polygon(50% 0, 100% 100%, 0 100%); }
  .ms-fox .ms-d.ear.l { left:6%; transform:rotate(-24deg); } .ms-fox .ms-d.ear.r { left:70%; transform:rotate(24deg); }
  .ms-fox .ms-d.tail { left:72%; top:52%; width:34%; height:24%; z-index:1; border:calc(var(--mz) * .025) solid #111; border-radius:30% 80% 80% 30% / 50%;
    background:linear-gradient(90deg, var(--cc) 62%, #fff 62%); transform-origin:0 70%; animation:ms-wag .5s ease-in-out infinite alternate; }
  .ms-fox .ms-d.nose { left:45%; top:47%; width:10%; height:8%; z-index:4; background:#111; border-radius:50% 50% 60% 60%; }
  .ms-fox .ms-d.nose::after { content:""; position:absolute; left:20%; top:18%; width:30%; height:30%; background:#fff; border-radius:50%; opacity:.7; }
  @keyframes ms-wag { from { transform:rotate(-14deg); } to { transform:rotate(18deg); } }
  /* Y for yarn: woolly stripes on the letter, two knitting needles stuck in its fork, a loose strand */
  .ms-yarn .ms-glyph { background-image:repeating-linear-gradient(60deg, #c04dd9 0 6%, #e07cf0 6% 9%, #9a2fb3 9% 11%); }
  /* a ball of wool sitting in the Y's fork, two knitting needles stuck through it */
  .ms-yarn .ms-d.ball { left:37%; top:19%; width:26%; aspect-ratio:1; z-index:4; border:calc(var(--mz) * .022) solid #111; border-radius:50%;
    background:repeating-linear-gradient(-35deg, #ff6fb0 0 12%, #ffa3cf 12% 18%), #ff6fb0; overflow:visible; }
  .ms-yarn .ms-d.needle { left:-60%; top:40%; width:220%; height:17%; z-index:5; background:#b9c2d6; border:calc(var(--mz) * .012) solid #111; border-radius:99px; }
  .ms-yarn .ms-d.needle::before { content:""; position:absolute; right:-8%; top:50%; height:200%; aspect-ratio:1; transform:translateY(-50%); background:#ffd400; border:calc(var(--mz) * .012) solid #111; border-radius:50%; }
  .ms-yarn .ms-d.needle.a { transform:rotate(-28deg); } .ms-yarn .ms-d.needle.b { transform:rotate(28deg) scaleX(-1); } .ms-yarn .ms-d.needle.b::before { background:#4dd3ff; }
  .ms-yarn .ms-d.strand { left:50%; top:70%; width:42%; height:26%; border:calc(var(--mz) * .03) solid #c04dd9; border-color:transparent transparent #c04dd9 #c04dd9; border-radius:0 0 0 70%;
    transform-origin:0 0; animation:ms-strand .8s ease-in-out infinite alternate; }
  .ms-yarn .ms-d.strand::after { content:""; position:absolute; right:-14%; bottom:-30%; width:28%; aspect-ratio:1; border:calc(var(--mz) * .03) solid #c04dd9; border-radius:50%; }
  @keyframes ms-strand { from { transform:rotate(-6deg); } to { transform:rotate(10deg); } }
  /* Z for zombie: pale green, messy hair, a stitched scar, arms stuck straight out in front, a lurching shuffle */
  .ms-zombie .ms-in { animation:ms-lurch 1.1s ease-in-out infinite alternate; }
  .ms.ms-zombie .ms-arm.l, .ms.ms-zombie .ms-arm.r, .ms.ms-zombie.cheer .ms-arm.l, .ms.ms-zombie.cheer .ms-arm.r { left:auto; transform-origin:0 50%; z-index:3; }
  .ms.ms-zombie .ms-arm.l { right:-8%; top:28%; transform:rotate(-4deg); }
  .ms.ms-zombie .ms-arm.r { right:-10%; top:68%; transform:rotate(4deg); }   /* (on the Z's bottom bar: the diagonal doesn't reach out there) */
  .ms.ms-zombie.cheer .ms-arm.l { right:-8%; top:28%; transform:rotate(-30deg); } .ms.ms-zombie.cheer .ms-arm.r { right:-10%; top:68%; transform:rotate(-20deg); }
  .ms-zombie .ms-d.hair { left:22%; top:-12%; width:56%; height:16%; z-index:1; background:#2d3a1f;
    clip-path:polygon(0 100%, 6% 20%, 16% 70%, 26% 0, 38% 60%, 50% 10%, 60% 70%, 72% 0, 82% 60%, 94% 15%, 100% 100%); }
  .ms-zombie .ms-d.scar { left:28%; top:22%; width:30%; height:1.5%; z-index:4; background:#111; transform:rotate(-8deg); }
  .ms-zombie .ms-d.scar::before { content:""; position:absolute; left:0; right:0; top:-250%; bottom:-250%; background:repeating-linear-gradient(90deg, transparent 0 15%, #111 15% 21%); }
  .ms.ms-zombie .ms-eye.r { width:15%; top:2%; }  /* one eye small and droopy */
  .ms-zombie .ms-eye.l i { animation-duration:2.4s; }
  .ms-zombie .ms-d.drool { left:56%; top:66%; width:3.5%; height:10%; z-index:4; background:#bff0ff; border:1px solid #111; border-radius:0 0 99px 99px;
    transform-origin:50% 0; animation:ms-drool 1.6s ease-in-out infinite; }
  @keyframes ms-lurch { from { transform:rotate(-5deg) translateX(-2%); } to { transform:rotate(5deg) translateX(2%); } }
  @keyframes ms-drool { 0%, 100% { transform:scaleY(.4); } 60% { transform:scaleY(1.3); } }
  /* K for king: a crown and a red cape */
  .ms-king .ms-d.crown { left:50%; top:-28%; transform:translateX(-50%) rotate(-8deg); font-size:calc(var(--mz) * .34); z-index:4; }
  .ms-king .ms-d.cape { left:10%; right:10%; top:22%; bottom:10%; background:#e8173c; border:calc(var(--mz) * .025) solid #111; border-radius:30% 30% 10% 10%; z-index:0; }

  /* moods */
  .ms.cheer .ms-in { animation:ms-hop .35s cubic-bezier(.2,1.6,.4,1) infinite alternate; }
  .ms.cheer .ms-arm.l { transform:rotate(55deg); } .ms.cheer .ms-arm.r { transform:rotate(-55deg); }
  .ms.pull .ms-in { animation:none; transform:rotate(-14deg) translateX(-6%); }
  .ms.pull .ms-arm.l, .ms.pull .ms-arm.r { transform:rotate(0deg); }
  .ms.pull.heave .ms-in { transform:rotate(-24deg) translateX(-10%); transition:transform .12s; }
  .ms.eat .ms-mouth { animation:ms-chomp .22s ease-in-out infinite alternate; }
  .ms.eat .ms-in { animation:ms-hop .45s ease-in-out infinite alternate; }
  .ms.sad .ms-mouth { top:60%; height:12%; border-radius:50% 50% 12% 12% / 86% 86% 14% 14%; }
  .ms.sad .ms-mouth::before, .ms.sad .ms-mouth::after { display:none; }
  .ms.sad .ms-eye i { top:52%; }
  .ms.sad .ms-tear { opacity:1; animation:ms-tear .5s linear infinite; }
  .ms.sad .ms-tear.r { animation-delay:.25s; }
  .ms.locked { filter:brightness(0) drop-shadow(0 0 8px rgba(255,255,255,.6)); }
  .ms.locked .ms-in, .ms.locked * { animation:none !important; }
  @keyframes ms-bob { to { transform:translateY(-4%) scale(1.02, .98); } }
  @keyframes ms-bounce { from { transform:translateY(0) scale(1.06, .92); } to { transform:translateY(-12%) scale(.96, 1.04); } }
  @keyframes ms-hop { to { transform:translateY(-14%); } }
  @keyframes ms-roll { 0% { transform:translate(-30%, -20%); } 100% { transform:translate(30%, 20%); } }
  @keyframes ms-chomp { from { transform:scaleY(1); } to { transform:scaleY(.35); } }
  @keyframes ms-tear { 0% { height:0; opacity:1; } 80% { height:40%; opacity:1; } 100% { height:44%; opacity:0; } }
  @keyframes ms-tail { from { transform:rotate(20deg); } to { transform:rotate(45deg); } }
  @keyframes ms-trunk { from { transform:rotate(-12deg); } to { transform:rotate(14deg); } }
  @keyframes ms-spin { to { transform:translateX(-50%) rotate(360deg); } }
  @keyframes ms-twinkle { from { transform:scale(.7); opacity:.6; } to { transform:scale(1.15); opacity:1; } }
  @keyframes ms-rotor { 50% { transform:scaleX(.15); } }
  @keyframes ms-spin2 { to { transform:rotate(360deg); } }
  @keyframes ms-hover { to { transform:translateY(-8%); } }
  @keyframes ms-jelly { from { transform:scale(1.05, .95); } to { transform:scale(.96, 1.05); } }
  @keyframes ms-flap { from { transform:rotate(-12deg); } to { transform:rotate(14deg); } }
  @media (prefers-reduced-motion: reduce) { .ms-in, .ms-eye i, .ms.cheer .ms-in, .ms.eat .ms-mouth, .ms.eat .ms-in, .ms.sad .ms-tear, .ms-d { animation:none !important; } }

  /* The character picker (a pop-up, like 👀 Watch first?) */
  .ms-pick { position:fixed; inset:0; z-index:110; display:flex; align-items:flex-start; justify-content:center; padding:16px; overflow-y:auto; background:rgba(0,0,0,.55); }
  .ms-pick-card { width:min(100%, 560px); display:flex; flex-direction:column; align-items:center; gap:10px; text-align:center; margin:auto 0; }
  .ms-pick-card h2 { margin:0; font-size:clamp(1.8rem, 8vw, 2.8rem); line-height:1; white-space:pre-line; }
  .ms-hero { display:flex; flex-direction:column; align-items:center; gap:2px; min-height:calc(var(--hz) + 46px); }
  .ms-hero .nm { font-size:clamp(1.3rem, 6vw, 1.8rem); }
  .ms-hero .ln { font-size:1rem; opacity:.75; font-family:system-ui, sans-serif; font-weight:700; }
  .ms-grid { display:grid; grid-template-columns:repeat(4, 1fr); gap:8px; width:100%; }
  .ms-tile { display:flex; flex-direction:column; align-items:center; gap:2px; padding:6px 2px; border:4px solid #111; border-radius:14px; background:#fff; box-shadow:0 5px 0 #111;
    font:inherit; font-size:.72rem; line-height:1.05; cursor:pointer; touch-action:manipulation; min-width:0; }
  .ms-tile.on { background:#ffe066; box-shadow:0 0 0 4px #fff, 0 0 0 8px #ff8a00, 0 5px 0 #111; }
  .ms-tile.locked { background:#ddd; cursor:default; }
  .ms-tile .hint { font-family:system-ui, sans-serif; font-weight:700; font-size:.62rem; opacity:.8; }
  .ms-go { width:100%; font-size:clamp(1.4rem, 7vw, 2rem) !important; padding:12px 18px !important; background:#4dd36b !important; }
  /* NEW CHARACTER! */
  .ms-new { position:fixed; inset:0; z-index:120; display:flex; align-items:center; justify-content:center; padding:16px; background:rgba(0,0,0,.6); }
  .ms-new-card { position:relative; display:flex; flex-direction:column; align-items:center; gap:8px; text-align:center; padding:18px 22px; background:#fff;
    border:5px solid #111; border-radius:22px; box-shadow:0 8px 0 #111; width:min(100%, 340px); animation:ms-newin .5s cubic-bezier(.2,1.6,.4,1) both; }
  .ms-new-card h2 { margin:0; font-size:clamp(1.6rem, 7.5vw, 2.3rem); line-height:1; }
  .ms-new-rays { position:absolute; left:50%; top:50%; margin:calc(min(90vw, 520px) / -2) 0 0 calc(min(90vw, 520px) / -2); width:min(90vw, 520px); aspect-ratio:1; border-radius:50%; z-index:-1;
    background:repeating-conic-gradient(rgba(255,224,102,.55) 0 12deg, transparent 12deg 24deg); animation:ms-rays 8s linear infinite; }
  @keyframes ms-newin { from { transform:scale(.3); opacity:0; } }
  @keyframes ms-rays { to { transform:rotate(360deg); } }
  `;
  let cssDone = false;
  function injectCss() {
    if (cssDone) return;
    cssDone = true;
    const s = document.createElement("style");
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  // ---------- Saved state ----------
  const store = (k, v) => { try { C().storage.set(k, v); } catch (err) { /* private mode */ } };
  const load = (k, d) => { try { return C().storage.get(k, d); } catch (err) { return d; } };
  const unlockedSet = () => new Set(load(UNLOCK_KEY, []) || []);
  const isUnlocked = (id) => { const c = byId(id); return !!c && (!c.unlock || unlockedSet().has(id)); };
  const chosen = () => load(CHAR_KEY, null);                       // null: never picked (the first run)
  const current = () => { const id = chosen(); return id && isUnlocked(id) ? id : "blitz"; };
  function choose(id) { if (isUnlocked(id)) store(CHAR_KEY, id); }
  // Unlock a character; returns it if it's new (for the NEW CHARACTER! celebration).
  function unlock(id) {
    const c = byId(id), set = unlockedSet();
    if (!c || !c.unlock || set.has(id)) return null;
    set.add(id); store(UNLOCK_KEY, [...set]);
    return c;
  }
  // Games played (for Zebra).
  function played(gameId) {
    const set = new Set(load(PLAYED_KEY, []) || []);
    if (set.has(gameId)) return;
    set.add(gameId); store(PLAYED_KEY, [...set]);
  }
  // After a run: what it unlocked. `run`: { mode, stars, score, bossWon, bossesBeaten (array) }.
  function checkUnlocks(run) {
    const out = [];
    const add = (id) => { const c = unlock(id); if (c) out.push(c); };
    CHARS.forEach((c) => {
      if (c.unlock === "fun" && run.mode === "fun" && run.cleared >= c.at) add(c.id);
      if (c.unlock === "endless" && run.mode === "challenge" && run.cleared >= c.at) add(c.id);
    });
    if (run.bossWon) add(run.bossWon);
    // 🗺️ Adventure islands beaten (read from the save, so islands beaten before V–Z existed count too)
    const isles = window.Adventure && window.Adventure.beaten ? window.Adventure.beaten() : [];
    CHARS.forEach((c) => { if (c.unlock === "island" && isles.includes(c.island)) add(c.id); });
    if (run.bossesBeaten && run.bossesBeaten.length >= 4) add("king"); // (any 4 of the 5 bosses: the teacher kept it at 4)
    return out;
  }
  function reset() { store(UNLOCK_KEY, []); store(PLAYED_KEY, []); C().storage.remove(CHAR_KEY); }
  const lineOf = (c) => c.line || (c.letter ? `${c.letter} for ${c.word}!` : `I'm ${c.name}!`);

  // ---------- Drawing ----------
  const DECO = {
    apple: '<div class="ms-d stalk"></div><div class="ms-d leaf"></div>',
    ball: '<div class="ms-d tennis"></div><div class="ms-d soccer"></div>',
    cat: '<div class="ms-d ear l"></div><div class="ms-d ear r"></div><div class="ms-d tail"></div>',
    // (spikes down the D's straight left side, its back, pointing left; the teacher found them odd on the curve)
    dinosaur: '<div class="ms-d tail"></div>' + [[19, 24, -90], [19, 39, -90], [19, 54, -90], [19, 69, -90]].map(([x, y, a]) =>
      `<div class="ms-d spk" style="left:${x}%;top:${y}%;--a:${a}deg"></div>`).join(""),
    elephant: '<div class="ms-d ear l"></div><div class="ms-d ear r"></div>',
    flower: '<div class="ms-d bloom">🌸</div><div class="ms-d leaf"></div>',
    guitar: '<div class="ms-d neck"></div>',
    helicopter: '<div class="ms-d mast"></div><div class="ms-d rotor"></div><div class="ms-d boom"></div><div class="ms-d tailr"></div>',
    iguana: '<div class="ms-d crest"></div><div class="ms-d tail"></div>',
    jellybaby: '',
    lion: '<div class="ms-d mane"></div><div class="ms-d tuft"></div>',
    monkey: '<div class="ms-d ear l"></div><div class="ms-d ear r"></div><div class="ms-d tail"></div>',
    ninja: '<div class="ms-d sword"></div>',
    orange: '<div class="ms-d stalk"></div><div class="ms-d leaf"></div>',
    king: '<div class="ms-d cape"></div><div class="ms-d crown">👑</div>',
    pirate: '<div class="ms-d hat">☠️</div>',
    queen: '<div class="ms-d tiara"></div><div class="ms-d gem"></div>',
    rabbit: '<div class="ms-d ear l"></div><div class="ms-d ear r"></div><div class="ms-d puff"></div>',
    tiger: '<div class="ms-d ear l"></div><div class="ms-d ear r"></div>',
    umbrella: '<div class="ms-d pole"></div><div class="ms-d canopy"></div><div class="ms-d drop">💧</div>',
    volcano: '<div class="ms-d smoke">💨</div><div class="ms-d lava"></div><div class="ms-d blob"></div><div class="ms-d blob b"></div><div class="ms-d blob c"></div>',
    fox: '<div class="ms-d ear l"></div><div class="ms-d ear r"></div><div class="ms-d tail"></div>',
    yarn: '<div class="ms-d strand"></div>',
    zombie: '<div class="ms-d hair"></div>',
  };
  const OVER = { // drawn over the face
    elephant: '<div class="ms-d trunk"></div>', guitar: '<div class="ms-d hole"></div>', jellybaby: '<div class="ms-d shine"></div>',
    monkey: '<div class="ms-d patch"></div>', ninja: '<div class="ms-d band"></div><div class="ms-d tails"></div>',
    pirate: '<div class="ms-d strap"></div>', queen: '<div class="ms-d pearls"></div>', rabbit: '<div class="ms-d teeth"></div>', snake: '<div class="ms-d tongue"></div>',
    volcano: '<div class="ms-d drip l"></div><div class="ms-d drip r"></div>',
    fox: '<div class="ms-d nose"></div>',
    zombie: '<div class="ms-d scar"></div><div class="ms-d drool"></div>',
    yarn: '<div class="ms-d ball"><div class="ms-d needle a"></div><div class="ms-d needle b"></div></div>',
    tiger: '<div class="ms-d stripe a"></div><div class="ms-d stripe b"></div><div class="ms-d stripe c"></div><div class="ms-d stripe d"></div>',
  };
  // `size`: px (a number) or any CSS length. `id`: a character (the chosen one if left out).
  function el(size, id) {
    injectCss();
    const c = byId(id || current()) || CHARS[0];
    const d = document.createElement("div");
    d.className = `ms ms-${c.id}`;
    d.style.setProperty("--mz", typeof size === "number" ? `${Math.round(size)}px` : size);
    d.style.setProperty("--cc", c.color || "#ff8a1f");
    d.setAttribute("aria-hidden", "true");
    if (c.boss && window.Boss) { // a boss: its own drawing (moods move the whole thing)
      d.innerHTML = '<div class="ms-in"></div><div class="ms-mud"></div>';
      const b = window.Boss.el(c.id, "var(--mz)");
      b.classList.add("ms-boss");
      d.firstChild.appendChild(b);
      return d;
    }
    const face = '<div class="ms-face"><div class="ms-eye l"><i></i></div><div class="ms-eye r"><i></i></div><div class="ms-mouth"></div>' +
      '<div class="ms-tear l"></div><div class="ms-tear r"></div></div>';
    const body = c.letter ? `<div class="ms-glyph">${c.letter}</div>` : '<div class="ms-body"></div>';
    d.innerHTML = `<div class="ms-in">${DECO[c.id] || ""}<div class="ms-leg l"></div><div class="ms-leg r"></div><div class="ms-arm l"></div><div class="ms-arm r"></div>` +
      `${body}${face}${OVER[c.id] || ""}<div class="ms-mud"></div></div>`;
    return d;
  }
  function mood(d, m) {
    d.classList.remove("cheer", "pull", "eat", "sad", "heave");
    if (m) d.classList.add(m);
    // A boss character uses its own moods: cheering laughs, sad sulks (Gorilla Boss cries).
    const b = d.querySelector(".bx-boss");
    if (b && window.Boss) window.Boss.setMood(b, m === "cheer" ? "laugh" : m === "sad" ? (b.classList.contains("bx-gorilla") ? "cry" : "angry") : null);
  }

  // ---------- The picker: "CHOOSE YOUR CHARACTER!" ----------
  // A pop-up with the chosen one big at the top (it cheers and says its line), a grid of every character
  // (locked ones as black silhouettes with how to unlock them), and LET'S GO!. `onDone` when it closes.
  function openPicker(opts = {}) {
    injectCss();
    const T = window.TEXT || {};
    const wrap = document.createElement("div");
    wrap.className = "ms-pick";
    wrap.setAttribute("role", "dialog");
    wrap.innerHTML = `<div class="ms-pick-card card"><h2 class="shout">${T.pickChar || "CHOOSE YOUR\nCHARACTER!"}</h2><div class="ms-hero"></div><div class="ms-grid"></div>` +
      `<button class="chunky ms-go">${T.letsGo || "LET'S GO!"}</button></div>`;
    const hero = wrap.querySelector(".ms-hero"), grid = wrap.querySelector(".ms-grid");
    let sel = current();
    function showHero(id, speak) {
      const c = byId(id);
      hero.style.setProperty("--hz", "110px");
      hero.innerHTML = "";
      const m = el(110, id);
      mood(m, "cheer");
      hero.appendChild(m);
      hero.insertAdjacentHTML("beforeend", `<div class="nm shout"></div><div class="ln"></div>`);
      hero.querySelector(".nm").textContent = c.name;
      hero.querySelector(".ln").textContent = lineOf(c);
      if (speak && C()) {
        C().sfx.tone(660, 0.08, "triangle", 0.1); C().sfx.tone(990, 0.12, "triangle", 0.1, 0.08);
        C().say(lineOf(c));
      }
    }
    CHARS.forEach((c) => {
      const t = document.createElement("button");
      const open = isUnlocked(c.id);
      t.className = "ms-tile" + (open ? "" : " locked") + (c.id === sel ? " on" : "");
      const m = el(52, c.id);
      if (!open) m.classList.add("locked");
      t.appendChild(m);
      t.insertAdjacentHTML("beforeend", `<span>${open ? c.name : "???"}</span>${open ? "" : `<span class="hint">${c.hint}</span>`}`);
      t.addEventListener("click", () => {
        if (!open) { if (C()) C().sfx.tone(200, 0.1, "square", 0.08); return; }
        sel = c.id;
        grid.querySelectorAll(".ms-tile").forEach((x) => x.classList.remove("on"));
        t.classList.add("on");
        showHero(c.id, true);
      });
      grid.appendChild(t);
    });
    showHero(sel, false);
    wrap.querySelector(".ms-go").addEventListener("click", () => {
      choose(sel);
      wrap.remove();
      if (opts.onDone) opts.onDone(sel);
    });
    document.body.appendChild(wrap);
  }

  // ---------- NEW CHARACTER! ----------
  function celebrate(list, onDone) {
    if (!list.length) { if (onDone) onDone(); return; }
    injectCss();
    const T = window.TEXT || {};
    const c = list[0];
    const wrap = document.createElement("div");
    wrap.className = "ms-new";
    wrap.innerHTML = `<div class="ms-new-rays"></div><div class="ms-new-card"><h2 class="shout">${T.newChar || "NEW CHARACTER!"}</h2></div>`;
    const card = wrap.lastChild;
    const m = el(150, c.id);
    mood(m, "cheer");
    card.appendChild(m);
    card.insertAdjacentHTML("beforeend", `<div class="shout" style="font-size:1.8rem"></div><div class="ln" style="font-weight:700;opacity:.75"></div><button class="chunky ms-go">${T.yay || "YAY!"}</button>`);
    card.querySelector("div.shout").textContent = c.name;
    card.querySelector(".ln").textContent = lineOf(c);
    document.body.appendChild(wrap);
    if (C()) {
      [523, 659, 784, 1047, 1319].forEach((f, i) => C().sfx.tone(f, 0.14, "triangle", 0.1, i * 0.08));
      C().say(`${T.newCharSay || "New character!"} ${lineOf(c)}`);
      C().confetti && C().confetti(wrap, window.innerWidth / 2, window.innerHeight * 0.4, { count: 120 });
    }
    wrap.querySelector(".ms-go").addEventListener("click", () => { wrap.remove(); celebrate(list.slice(1), onDone); });
  }

  window.Mascot = { el, mood, injectCss, CHARS, current, chosen, choose, isUnlocked, unlock, played, checkUnlocks, reset, openPicker, celebrate, lineOf };
})();
