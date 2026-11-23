// BONGO BASH — a rhythm game (the teacher's design). A silly gorilla sits behind a pair of bongos. The
// card at the top shows the target (letter; phonics letter; CVC word; HFW 🔊) and the voice says it.
// Notes (round discs with letters, pictures or words) slide along a track across the screen, right to left,
// on the beat, and never stop. A glowing ring on the track sits right above the bongos: when a note with the
// target is in the ring, hit the bongo (tap anywhere on the stage, or Space). Like Mouse Trap, except the
// notes keep moving. Right: BONGO!, the note bursts into a ⭐, the gorilla bashes the drums, a pip. Wrong
// note in the ring: a sour BOING, it turns red, a ✕ pip. Nothing in the ring: just a dull thud (no penalty).
// Hit 5 to win: the gorilla pounds its chest, confetti. 3 wrong ones lose (the gorilla is confused, the
// right notes glow). A right note that slides past comes round again later.
(function () {
  const TEXT = {
    name: { en: "Bongo Bash" },
    icon: "🪘",
    howTo: (list) => ({ en: {
      steps: [
        list.type === "hfw" ? ["👂", "Listen to the word, like \"the\"."] : ["👀", "Look at the card at the top."],
        ["➡️", "Notes slide across to the gorilla's bongos."],
        ["🪘", "When a note with the same one is in the ring, tap to hit the bongo! Hit 5 to win."],
      ],
      tips: [
        "Tap anywhere on the stage to hit the bongo (or press Space).",
        "Hit the wrong note and it goes BOING. Three of those and the gorilla gets confused: game over.",
        "Missed one? Don't worry, it comes round again.",
        "When the game speeds up, the notes slide faster.",
      ],
    } }),
    instruction: { en: "BONGO\nBASH!" },
    cardLabel: "Hear it again",
    stageLabel: "Bongos. Tap to hit them when the right note is in the ring.",
    good: ["BONGO!", "YEAH!", "GROOVY!"],
    boing: "BOING!",
    yawn: ["YAWN…", "SHHH…", "ZZZ…"],   // Rock-a-Bye (Baby Boss)
    waah: "WAAAH!",
  };
  const NEED = 5, MISSES = 3;   // 5 to win (3 felt like waiting around for a gorilla)
  const NOTE_COLORS = ["#ff4d6d", "#4d9dff", "#4dd36b", "#ffd400", "#b04dff", "#ff8a1f"];

  const CSS = `
  .bg { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:8px; padding-bottom:8px; }
  .bg-top { flex:none; display:flex; align-items:center; gap:12px; }
  .bg-card { min-width:84px; height:72px; padding:0 18px; border-radius:18px; font:inherit; font-size:2.6rem; line-height:1; background:#fff; color:#111;
    border:5px solid #111; box-shadow:0 6px 0 #111; display:flex; align-items:center; justify-content:center; gap:8px; cursor:pointer; touch-action:manipulation; }
  .bg-card .spk { font-size:1.3rem; opacity:.6; }
  .bg-pips { display:flex; flex-direction:column; gap:6px; }
  .bg-row { display:flex; gap:5px; }
  .bg-pip { width:24px; height:24px; border:3px solid #111; border-radius:50%; background:#fff; display:flex; align-items:center; justify-content:center; font-size:13px; line-height:1; }
  .bg-pip.on { background:#ffd400; } .bg-pip.on::after { content:"⭐"; }
  .bg-pip.miss { background:#444; } .bg-pip.miss::after { content:"✕"; color:#fff; font-weight:900; }

  /* The stage: a jungle at night with a wooden track for the notes */
  .bg-stage { position:relative; flex:1; min-height:0; width:100%; max-width:560px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111;
    background:radial-gradient(ellipse at 50% 110%, #5cc055 0 30%, transparent 31%), linear-gradient(180deg, #1d6b3a, #0f4a28); touch-action:none; cursor:pointer; }
  .bg-stage::before { content:""; position:absolute; inset:0; opacity:.35;
    background:radial-gradient(circle at 10% 20%, #3fb54a 0 8%, transparent 9%), radial-gradient(circle at 85% 12%, #3fb54a 0 10%, transparent 11%), radial-gradient(circle at 70% 40%, #2e8f38 0 6%, transparent 7%); }
  .bg-track { position:absolute; left:0; right:0; top:var(--ty); height:var(--th); margin-top:calc(var(--th) / -2); background:repeating-linear-gradient(90deg, #a8703a 0 36px, #8b5a2b 36px 40px);
    border-block:5px solid #111; }
  .bg-zone { position:absolute; left:50%; top:var(--ty); width:calc(var(--ns) * 1.3); height:calc(var(--ns) * 1.3); transform:translate(-50%, -50%); border-radius:50%; z-index:2;
    border:6px solid #fff; box-shadow:0 0 0 4px #111, inset 0 0 0 4px #111, 0 0 22px 6px rgba(255,255,255,.6); pointer-events:none; }
  .bg-zone.thump { animation:bg-thump .2s ease-out; }
  .bg-arrow { position:absolute; left:50%; top:calc(var(--ty) + var(--ns) * .72); transform:translateX(-50%); font-size:calc(var(--ns) * .4); line-height:1; z-index:2; pointer-events:none;
    animation:bg-bob .5s ease-in-out infinite alternate; }

  /* A note: --ns is its size */
  .bg-note { position:absolute; left:0; top:var(--ty); width:var(--ns); height:var(--ns); margin:calc(var(--ns) * -.5) 0 0 calc(var(--ns) * -.5); border-radius:50%; z-index:3;
    background:#fff; border:5px solid #111; box-shadow:inset 0 0 0 6px var(--nc), 0 4px 0 rgba(0,0,0,.35); display:flex; align-items:center; justify-content:center;
    font-size:calc(var(--ns) * .5); line-height:1; color:#111; white-space:nowrap; pointer-events:none; will-change:transform; }
  .bg-note.word { width:calc(var(--ns) * 1.7); margin-left:calc(var(--ns) * -.85); border-radius:999px; font-size:calc(var(--ns) * .36); }
  .bg-note.pic { font-size:calc(var(--ns) * .54); }
  .bg-note.bad { background:#ff5a6e; color:#fff; -webkit-text-stroke:2px #111; paint-order:stroke fill; }
  .bg-note.glow { box-shadow:inset 0 0 0 6px var(--nc), 0 0 0 6px #ffd400, 0 0 24px 10px #ffd400; }
  .bg-note.pop { animation:bg-pop .35s ease-out forwards; }

  /* The gorilla: --gz is its size. Anchor: its bottom middle. Big and silly: grey fur, a tan face with
     googly eyes (one bigger), huge nostrils and a toothy grin, long arms with big hands over the bongos. */
  .bg-gor { position:absolute; left:50%; bottom:0; width:var(--gz); height:var(--gz); margin-left:calc(var(--gz) * -.5); z-index:4; pointer-events:none; }
  .bg-gbody { position:absolute; left:14%; right:14%; top:30%; bottom:-6%; background:#4a4a55; border:5px solid #111; border-radius:46% 46% 20% 20%; }
  .bg-gbody::after { content:""; position:absolute; left:24%; right:24%; top:24%; height:40%; background:#7a7a88; border-radius:50%; }   /* chest */
  .bg-ghead { position:absolute; left:24%; right:24%; top:0; height:44%; background:#4a4a55; border:5px solid #111; border-radius:50% 50% 42% 42%; z-index:2; }
  .bg-gface { position:absolute; left:10%; right:10%; top:30%; bottom:4%; background:#d9a66b; border:4px solid #111; border-radius:46% 46% 50% 50%; }
  .bg-geye { position:absolute; top:18%; width:30%; aspect-ratio:1; background:#fff; border:3px solid #111; border-radius:50%; z-index:3; }
  .bg-geye.l { left:12%; } .bg-geye.r { right:14%; width:25%; top:22%; }
  .bg-geye i { position:absolute; left:28%; top:30%; width:46%; aspect-ratio:1; background:#111; border-radius:50%; animation:bg-goggle 1.1s ease-in-out infinite; }
  .bg-geye.r i { animation-delay:-.45s; }
  .bg-gbrow { position:absolute; left:6%; right:6%; top:12%; height:12%; background:#2c2c34; border-radius:99px; z-index:4; }
  .bg-gnose { position:absolute; left:50%; top:48%; width:30%; height:14%; margin-left:-15%; z-index:3;
    background:radial-gradient(circle at 30% 50%, #111 0 22%, transparent 24%), radial-gradient(circle at 70% 50%, #111 0 22%, transparent 24%); }
  .bg-gmouth { position:absolute; left:20%; right:20%; top:64%; height:24%; background:#6b1020; border:3px solid #111; border-radius:4px 4px 999px 999px; overflow:hidden; z-index:3; }
  .bg-gmouth::before { content:""; position:absolute; left:0; right:0; top:0; height:36%; background:#fff; border-bottom:2px solid #111; }
  .bg-arm { position:absolute; top:38%; width:20%; height:44%; background:#4a4a55; border:5px solid #111; border-radius:99px; transform-origin:50% 8%; z-index:5; }
  .bg-arm.l { left:6%; transform:rotate(-24deg); } .bg-arm.r { right:6%; transform:rotate(24deg); }
  .bg-arm::after { content:""; position:absolute; left:-14%; right:-14%; bottom:-8%; height:30%; background:#2c2c34; border:4px solid #111; border-radius:50%; }   /* big hands */
  .bg-gor.bash .bg-arm.l { animation:bg-bash-l .18s ease-out 2 alternate; } .bg-gor.bash .bg-arm.r { animation:bg-bash-r .18s ease-out 2 alternate; }
  .bg-gor.thud .bg-arm.l { animation:bg-bash-l .2s ease-out; }
  .bg-gor.yay { animation:bg-hop .35s cubic-bezier(.2,1.6,.4,1) 4; }
  .bg-gor.yay .bg-arm.l { transform:rotate(30deg) translateY(-30%); } .bg-gor.yay .bg-arm.r { transform:rotate(-30deg) translateY(-30%); }   /* chest pounding */
  .bg-gor.huh .bg-geye i { animation:bg-dizzy .45s linear infinite; }
  .bg-gor.huh .bg-gmouth { left:38%; right:38%; height:12%; top:70%; border-radius:50%; }
  .bg-gor.huh .bg-gmouth::before { display:none; }
  /* The bongos: two drums side by side, in front of the gorilla, under the ring */
  .bg-bongos { position:absolute; left:50%; bottom:2%; width:calc(var(--gz) * .9); height:calc(var(--gz) * .34); margin-left:calc(var(--gz) * -.45); z-index:6; pointer-events:none; display:flex; gap:4%; }
  .bg-drum { flex:1; position:relative; background:linear-gradient(90deg, #c46a2b, #e8914a 45%, #b55a1f); border:5px solid #111; border-radius:10% 10% 30% 30%; }
  .bg-drum.small { flex:.8; margin-top:10%; }
  .bg-drum::before { content:""; position:absolute; left:-6%; right:-6%; top:-16%; height:30%; background:#f3e2bd; border:5px solid #111; border-radius:50%; }   /* the drum head */
  .bg-drum::after { content:""; position:absolute; left:0; right:0; top:44%; height:10%; background:#ffd400; border-block:3px solid #111; }
  .bg-bongos.hit .bg-drum::before { animation:bg-skin .18s ease-out; }
  .bg-fx { position:absolute; inset:0; pointer-events:none; z-index:9; overflow:visible; }
  .bg-word { position:absolute; left:50%; transform:translate(-50%, -50%) rotate(-8deg); font-size:2rem; color:#ffd400; -webkit-text-stroke:2px #111; paint-order:stroke fill;
    text-shadow:0 4px 0 #111; white-space:nowrap; pointer-events:none; animation:bg-word .8s ease-out forwards; }
  .bg-word.bad { color:#ff4d6d; }

  /* Rock-a-Bye (Baby Boss's finale): a dark nursery, a cloud for the track, stars for notes, a cradle */
  /* (the teacher found the first nursery too bright to feel like night: now it's a dark bedroom, the whole screen
     goes navy (ctx.nightTheme), with a moonlit window, a night lamp, and a cot with a pillow and a blanket) */
  .bg.baby .bg-stage { background:linear-gradient(180deg, #05071a 0, #0c1030 72%, #1c140e 72%); }
  .bg.baby .bg-stage::before { opacity:.5; background:radial-gradient(circle at 12% 15%, #9fb0ff 0 1.5px, transparent 2.5px), radial-gradient(circle at 34% 8%, #9fb0ff 0 1.5px, transparent 2.5px),
    radial-gradient(circle at 58% 20%, #9fb0ff 0 1.5px, transparent 2.5px), radial-gradient(circle at 90% 40%, #9fb0ff 0 1.5px, transparent 2.5px), radial-gradient(circle at 22% 56%, #9fb0ff 0 1.5px, transparent 2.5px),
    radial-gradient(circle at 76% 62%, #9fb0ff 0 1.5px, transparent 2.5px); }   /* little stars on the wallpaper */
  .bg.baby .bg-track { background:rgba(160,180,255,.1); border-color:rgba(200,210,255,.3); border-radius:999px; }
  .bg-win { position:absolute; left:4%; top:calc(var(--ty) + var(--ns) * .85); width:calc(var(--gz) * .5); aspect-ratio:.85; z-index:1; pointer-events:none; border:6px solid #3b2a1a; border-radius:8px;
    background:radial-gradient(circle at 66% 32%, #fff6c8 0 13%, rgba(255,246,200,.35) 15%, transparent 30%), linear-gradient(#0a1a4a, #1b2f6e); box-shadow:0 0 30px 6px rgba(150,170,255,.18); }
  .bg-win::before { content:""; position:absolute; left:50%; top:0; bottom:0; width:6px; margin-left:-3px; background:#3b2a1a; }
  .bg-win::after { content:""; position:absolute; left:0; right:0; top:50%; height:6px; margin-top:-3px; background:#3b2a1a; }
  .bg-lamp { position:absolute; right:6%; bottom:24%; width:calc(var(--gz) * .22); height:calc(var(--gz) * .3); z-index:1; pointer-events:none; }
  .bg-lamp::before { content:""; position:absolute; inset:-120%; border-radius:50%; background:radial-gradient(circle, rgba(255,200,110,.35), transparent 60%); }   /* its glow */
  .bg-lamp::after { content:""; position:absolute; left:10%; right:10%; top:0; height:60%; background:#ffcf7a; border:4px solid #111; border-radius:40% 40% 10% 10%;
    box-shadow:0 calc(var(--gz) * .13) 0 -2px #6b4a2b; }   /* shade (and its little stand) */
  .bg.baby .bg-note { background:#fff8d6; box-shadow:inset 0 0 0 6px #ffd400, 0 0 18px 6px rgba(255,230,120,.6); }
  .bg.baby .bg-zone { border-color:#ffe9a8; box-shadow:0 0 0 4px #111, inset 0 0 0 4px #111, 0 0 26px 10px rgba(255,233,168,.6); }
  .bg.baby .bg-pip.on { background:#fff3b0; } .bg.baby .bg-pip.on::after { content:"🌙"; }
  /* The cot: a pillow behind Baby's head, a starry blanket tucked up to its chin, wooden bars in front, rockers below */
  .bg-cradle { gap:0; height:var(--gz); width:var(--gz); margin-left:calc(var(--gz) * -.5); bottom:0; }
  .bg-rocker { position:relative; width:100%; height:100%; transform-origin:50% 100%; }
  .bg-rocker .bx-boss { position:absolute; left:10%; top:0; z-index:2; }
  .bg-pillow { position:absolute; left:16%; right:16%; top:20%; height:30%; z-index:1; background:#f4f0ff; border:4px solid #111; border-radius:40%; }
  .bg-blanket { position:absolute; left:8%; right:8%; top:55%; bottom:14%; z-index:3; border:4px solid #111; border-radius:30% 30% 8px 8px / 40% 40% 8px 8px;
    background:radial-gradient(circle at 25% 40%, #fff7c2 0 5%, transparent 6%), radial-gradient(circle at 60% 70%, #fff7c2 0 5%, transparent 6%), radial-gradient(circle at 80% 35%, #fff7c2 0 4%, transparent 5%), #7fa8e8; }
  .bg-bars { position:absolute; left:2%; right:2%; top:64%; bottom:12%; z-index:4; border:5px solid #111; border-radius:8px;
    background:repeating-linear-gradient(90deg, #e8b878 0 10px, transparent 10px 26px), linear-gradient(#e8b878 0 16%, transparent 16% 84%, #e8b878 84%); }
  .bg-rocker::before { content:""; position:absolute; left:0; right:0; bottom:0; height:14%; z-index:5; border:5px solid #111; border-top:0; border-radius:0 0 50% 50% / 0 0 100% 100%; }   /* its rockers */
  .bg-cradle.bash .bg-rocker { animation:bg-rock .8s ease-in-out; }
  .bg.asleep .bg-stage::after { content:""; position:absolute; inset:0; background:rgba(5,5,30,.45); z-index:7; pointer-events:none; transition:opacity .6s; }
  .bg-zzz { position:absolute; left:55%; bottom:55%; font-size:calc(var(--gz) * .18); line-height:1; animation:bg-zzz 1.6s ease-out forwards; }
  @keyframes bg-rock { 25% { transform:rotate(-9deg); } 75% { transform:rotate(9deg); } }
  @keyframes bg-zzz { from { transform:translate(0, 0) scale(.5); opacity:1; } to { transform:translate(30%, -160%) scale(1.3); opacity:0; } }

  @keyframes bg-thump { 50% { transform:translate(-50%, -50%) scale(1.25); } }
  @keyframes bg-bob { to { transform:translate(-50%, 6px); } }
  @keyframes bg-pop { to { transform:var(--at) scale(1.8); opacity:0; } }
  @keyframes bg-goggle { 0%, 100% { transform:translate(-16%, 0); } 50% { transform:translate(16%, -12%); } }
  @keyframes bg-dizzy { from { transform:rotate(0) translate(30%); } to { transform:rotate(360deg) translate(30%); } }
  @keyframes bg-bash-l { to { transform:rotate(-4deg) translateY(12%); } }
  @keyframes bg-bash-r { to { transform:rotate(4deg) translateY(12%); } }
  @keyframes bg-hop { 50% { transform:translateY(-10%); } }
  @keyframes bg-skin { 50% { transform:scaleY(.6); } }
  @keyframes bg-word { from { opacity:1; transform:translate(-50%, -50%) rotate(-8deg) scale(.5); } 30% { transform:translate(-50%, -70%) rotate(-8deg) scale(1.15); }
    to { opacity:0; transform:translate(-50%, -120%) rotate(-8deg); } }
  @media (prefers-reduced-motion: reduce) { .bg-arrow, .bg-geye i, .bg-gor.yay, .bg-word, .bg-note.pop { animation:none !important; } }
  `;
  function injectCss() {
    if (document.getElementById("bg-css")) return;
    const s = document.createElement("style");
    s.id = "bg-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  registerMicrogame({
    id: "bongo-bash",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 16000, // 5 hits
    input: "tap",
    tutorial: true,
    bossArt: true,         // Boss Battle: Baby Boss's finale, Rock-a-Bye (rock the cradle to put it to sleep)
    bossDuration: 32000,   // 16 s at 2× (the stars drift slowly whatever the speed: it's a lullaby; 5 right stars take about 12 s)

    start(ctx) {
      injectCss();
      const speed = ctx.speed || 1;
      // Rock-a-Bye (the teacher's idea): Baby Boss in a cradle in its dark nursery instead of the gorilla; stars
      // drift across the sky at a slow, dreamy pace whatever the speed. Each right one rocks the cradle and the
      // baby yawns and gets sleepier; a wrong one and it wriggles and cries; 5 and it's fast asleep.
      const babyMode = !!(window.Boss && window.Boss.fighting(ctx) === "baby");
      const pace = babyMode ? 0.85 : 0.6 + 0.4 * speed;  // 1 at 1×, 1.6 at 2.5×
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const { tone, sweep, noise } = ctx.sfx;
      // The notes: rows of 2 (one right in each), shuffled and strung together, so about every other note is a
      // right one (every third was too few: kids sat waiting). ABC picks capital → lowercase (or not) once for the whole round.
      const forceLower = Math.random() < 0.5;
      const rowsOf = () => ctx.choiceRows(4, 2, { lowercase: true, forceLower }).rows;
      const C = ctx.choiceRows(1, 2, { lowercase: true, forceLower });
      let queue = [];
      const nextOpt = () => {
        if (!queue.length) queue = rowsOf().flatMap((r) => ctx.shuffle(r.slice()));
        return queue.shift();
      };

      // ---------- DOM ----------
      const wrap = document.createElement("div");
      wrap.className = "bg";
      const top = document.createElement("div");
      top.className = "bg-top";
      const card = document.createElement("button");
      card.className = "bg-card";
      card.setAttribute("aria-label", TEXT.cardLabel);
      card.innerHTML = '<span class="ct"></span>';
      // Always SHOWN, sight words too (it's too fast to play from listening alone; the teacher asked).
      card.firstChild.textContent = C.listen ? C.target.text : C.cardText;
      if (ctx.canSpeak) card.insertAdjacentHTML("beforeend", '<span class="spk">🔊</span>');
      card.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); replay(); });
      const pips = document.createElement("div");
      pips.className = "bg-pips";
      pips.innerHTML = `<div class="bg-row hits">${'<span class="bg-pip"></span>'.repeat(NEED)}</div><div class="bg-row misses">${'<span class="bg-pip"></span>'.repeat(MISSES)}</div>`;
      top.append(card, pips);
      const stage = document.createElement("div");
      stage.className = "bg-stage";
      stage.setAttribute("role", "button");
      stage.setAttribute("aria-label", TEXT.stageLabel);
      stage.innerHTML = '<div class="bg-track"></div><div class="bg-zone"></div><div class="bg-arrow">⬇️</div>' +
        '<div class="bg-gor"><div class="bg-gbody"></div><div class="bg-ghead"><div class="bg-gbrow"></div><div class="bg-gface"></div>' +
        '<div class="bg-geye l"><i></i></div><div class="bg-geye r"><i></i></div><div class="bg-gnose"></div><div class="bg-gmouth"></div></div>' +
        '<div class="bg-arm l"></div><div class="bg-arm r"></div></div>' +
        '<div class="bg-bongos"><div class="bg-drum"></div><div class="bg-drum small"></div></div><div class="bg-fx"></div>';
      let baby = null;
      if (babyMode) {
        // The nursery: the gorilla and bongos make way for a cradle with Baby Boss in it.
        wrap.classList.add("baby");
        stage.querySelector(".bg-gor").remove();
        stage.querySelector(".bg-bongos").outerHTML = '<div class="bg-bongos bg-cradle"><div class="bg-rocker"><div class="bg-pillow"></div>' +
          '<div class="bg-blanket"></div><div class="bg-bars"></div></div></div>';
        baby = window.Boss.el("baby", "calc(var(--gz) * .8)");
        stage.querySelector(".bg-pillow").after(baby);
        stage.insertAdjacentHTML("afterbegin", '<div class="bg-win"></div><div class="bg-lamp"></div>');
        ctx.nightTheme(); // the whole screen goes dark for bedtime
      }
      wrap.append(top, stage);
      ctx.root.appendChild(wrap);
      const zone = stage.querySelector(".bg-zone"), bongos = stage.querySelector(".bg-bongos"), fx = stage.querySelector(".bg-fx");
      const gor = stage.querySelector(".bg-gor") || bongos; // (the cradle stands in for the gorilla too)

      // ---------- Layout ----------
      let W = 0, H = 0, ns = 70, ty = 0, gap = 150, v = 100;
      function layout() {
        W = stage.clientWidth; H = stage.clientHeight;
        ns = Math.max(54, Math.min(W * 0.17, H * 0.2, 96));
        ty = Math.max(ns * 0.9, H * 0.3);
        gap = ns * (C.rows[0][0].kind === "word" ? 2.4 : 1.9);   // notes are evenly spaced: on the beat
        v = (W * 0.36) * pace;                                    // px a second: a note crosses in under 3 s at 1×
        stage.style.setProperty("--ns", `${ns}px`);
        stage.style.setProperty("--ty", `${ty}px`);
        stage.style.setProperty("--th", `${ns * 1.15}px`);
        stage.style.setProperty("--gz", `${Math.max(120, Math.min(H - ty - ns * 0.9, W * 0.55, 250))}px`);
      }
      layout();
      const ro = new ResizeObserver(layout);
      ro.observe(stage);

      // ---------- Notes ----------
      const notes = [];
      let colorN = 0;
      function spawn(x) {
        const opt = nextOpt();
        const el = document.createElement("div");
        el.className = "bg-note" + (opt.kind === "pic" ? " pic" : opt.kind === "word" ? " word" : "");
        el.style.setProperty("--nc", NOTE_COLORS[colorN++ % NOTE_COLORS.length]);
        el.textContent = opt.text;
        if (opt.kind === "word") el.style.fontSize = `${Math.min(ns * 0.36, (ns * 1.45) / (opt.text.length * 0.6))}px`;
        stage.insertBefore(el, fx);
        const n = { el, opt, x, done: false };
        notes.push(n);
        placeNote(n);
      }
      const placeNote = (n) => { n.el.style.transform = `translateX(${n.x.toFixed(1)}px)`; };
      let started = false, holdUntil = 0, last = 0, done = false, hits = 0, misses = 0, lastHit = 0;
      function frame(now) {
        const dt = last ? Math.min(50, now - last) / 1000 : 0;
        last = now;
        if (!started && performance.now() >= holdUntil) {
          started = true;
          // The first notes are already on their way in from the right.
          for (let x = W + ns; x < W + ns + gap * 2; x += gap) spawn(x);
        }
        if (started && !done) {
          notes.forEach((n) => { if (!n.done) { n.x -= v * dt; placeNote(n); } });
          // Off the left edge: gone. A new note comes in on the right on the beat.
          for (let i = notes.length - 1; i >= 0; i--) if (notes[i].x < -ns * 1.2 && !notes[i].done) { notes[i].el.remove(); notes.splice(i, 1); }
          const rightmost = notes.filter((n) => !n.done).reduce((m, n) => Math.max(m, n.x), -Infinity);
          if (rightmost < W + ns - gap) spawn(rightmost + gap);
        }
        if (!ctx.ended || !done) ctx.raf(frame);
      }
      ctx.raf(frame);

      // The note in the ring, if any (within about half a note of its middle).
      const inZone = () => {
        const zx = W / 2, win = ns * 0.62;
        return notes.filter((n) => !n.done && Math.abs(n.x - zx) < win).sort((a, b) => Math.abs(a.x - zx) - Math.abs(b.x - zx))[0] || null;
      };

      // ---------- Hitting the bongo ----------
      function hit() {
        if (done || ctx.ended || !started) return;
        const now = performance.now();
        if (now - lastHit < 180) return;                    // (one hit per bash)
        lastHit = now;
        bash(true);
        const n = inZone();
        if (!n) { // nothing there: just a thud
          tone(110, 0.08, "sine", 0.12); noise(0.05, "lowpass", 600, 200, 0.2);
          return;
        }
        n.done = true;
        if (n.opt.right) {
          if (babyMode) { // a soft chime, and a big yawn
            [784, 988, 1175].forEach((f, i) => tone(f, 0.25, "sine", 0.07, i * 0.09));
            sweep(520, 260, 0.6, "sine", 0.09, 0.25);
          } else { tone(220, 0.1, "sine", 0.2); tone(330, 0.1, "sine", 0.16, 0.06); noise(0.06, "bandpass", 900, 500, 0.3); } // BONG-a
          n.el.style.setProperty("--at", n.el.style.transform);
          n.el.classList.add("pop");
          if (!babyMode) ctx.confetti(fx, W / 2, ty, { count: 24 });
          word((babyMode ? TEXT.yawn : TEXT.good)[hits % 3], false);
          if (n.opt.kind === "pic") ctx.say(n.opt.spoken);
          hits++;
          pips.querySelector(".hits").children[hits - 1].classList.add("on");
          ctx.later(() => n.el.remove(), 360);
          if (babyMode) sleepy();
          if (hits >= NEED) win();
        } else {
          sweep(500, 180, 0.3, "sawtooth", 0.08); // BOING
          n.el.classList.add("bad");
          word(babyMode ? TEXT.waah : TEXT.boing, true);
          if (babyMode) { baby.classList.remove("sleepy", "sleepier"); window.Boss.setMood(baby, "angry"); } // wide awake: it wriggles and cries
          gor.classList.remove("huh"); void gor.offsetWidth; gor.classList.add("huh");
          misses++;
          pips.querySelector(".misses").children[misses - 1].classList.add("miss");
          // the wrong note drops off the track
          n.el.animate([{ transform: n.el.style.transform }, { transform: `${n.el.style.transform} translateY(${H * 0.6}px) rotate(40deg)`, opacity: 0 }],
            { duration: reduceMotion ? 1 : 500, easing: "ease-in", fill: "forwards" });
          ctx.later(() => n.el.remove(), 520);
          if (misses >= MISSES) lose();
          else ctx.later(() => { if (!done) { gor.classList.remove("huh"); sleepy(); } }, 700);
        }
      }
      // Rock-a-Bye: how sleepy the baby is, from the stars so far (heavy eyelids, then nodding off).
      function sleepy() {
        if (!baby || done) return;
        window.Boss.setMood(baby, null);
        baby.classList.toggle("sleepy", hits >= 1);
        baby.classList.toggle("sleepier", hits >= 3);
      }
      function bash(drum) {
        gor.classList.remove("bash", "thud"); void gor.offsetWidth; gor.classList.add("bash");
        bongos.classList.remove("hit"); void bongos.offsetWidth; bongos.classList.add("hit");
        zone.classList.remove("thump"); void zone.offsetWidth; zone.classList.add("thump");
      }
      function win() {
        done = true;
        ctx.win();
        if (babyMode) { // fast asleep: the lights go down, a lullaby, 💤
          baby.classList.remove("sleepy", "sleepier");
          window.Boss.setMood(baby, null);
          baby.classList.add("calm");
          wrap.classList.add("asleep");
          [523, 659, 784, 659, 523].forEach((f, i) => tone(f, 0.3, "sine", 0.08, i * 0.3));
          for (let i = 0; i < 4; i++) ctx.later(() => {
            const z = document.createElement("div");
            z.className = "bg-zzz"; z.textContent = "💤";
            fx.appendChild(z);
          }, i * 300);
          ctx.say(C.answer);
          return;
        }
        gor.classList.remove("bash", "huh");
        gor.classList.add("yay");
        [0, 0.12, 0.24, 0.36].forEach((d) => tone(150, 0.08, "sine", 0.2, d)); // chest pounding: bom bom bom bom
        [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, "triangle", 0.1, 0.5 + i * 0.08));
        ctx.confetti(fx, W / 2, H * 0.4, { count: 100 });
        ctx.say(C.answer);
      }
      function lose() {
        done = true;
        ctx.lose();
        gor.classList.add("huh");
        if (baby) { baby.classList.remove("sleepy", "sleepier"); window.Boss.setMood(baby, "angry"); } // wide awake and wailing
        ctx.later(() => { showRight(); ctx.say(C.answer); }, 400);
      }
      function showRight() { notes.forEach((n) => { if (!n.done && n.opt.right) n.el.classList.add("glow"); }); }
      function word(text, bad) {
        const w = document.createElement("div");
        w.className = "bg-word" + (bad ? " bad" : "");
        w.textContent = text;
        w.style.top = `${Math.max(30, ty - ns * 0.9)}px`;
        fx.appendChild(w);
        ctx.later(() => w.remove(), 820);
      }
      function replay() { if (!done) ctx.say(C.prompt); }

      stage.addEventListener("pointerdown", (e) => { e.preventDefault(); hit(); });
      ctx.onTimeout(() => {
        if (baby) { baby.classList.remove("sleepy", "sleepier"); window.Boss.setMood(baby, "angry"); }
        done = true; gor.classList.add("huh"); showRight(); ctx.say(C.answer);
      });
      function onKey(e) {
        if (e.key === " " || e.key === "Enter") { e.preventDefault(); hit(); }
      }
      document.addEventListener("keydown", onKey);

      ctx.say(C.prompt);
      holdUntil = performance.now() + ctx.reveal(card) + 300; // the notes wait for the reveal
      // 👆 TAP! on the bongos (never on a note).
      ctx.later(() => ctx.hint(bongos, null, { scale: 0.7 }), 80);

      // Tutorial: point at the card, then each time a right note slides into the ring, hit the bongo.
      ctx.tutorial(C.target, async (f) => {
        await f.point(card, 900);
        await f.move(bongos, 400);
        for (let k = 0; k < 14 && hits < NEED && !done; k++) {
          if (!(await f.until(() => { const n = inZone(); return n && n.opt.right && Math.abs(n.x - W / 2) < ns * 0.25; }, 8000))) break;
          await f.tapNow(bongos);
          await f.until(() => !inZone() || !inZone().opt.right, 1500);
        }
      });

      return () => { done = true; ro.disconnect(); document.removeEventListener("keydown", onKey); };
    },
  });
})();
