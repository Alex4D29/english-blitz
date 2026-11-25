// ITEMS (the teacher's idea; Endless first, Versus has its own silly ones in js/versus.js). A ❓ ITEM BOX pops up
// in Endless every 5 points: tap it (or wait) and it spins like a slot machine and lands on an item, which flies
// into one of 3 SLOTS at the top of the screen (saved per player: `wwe.items` is a per-player key). Tap a slot to
// use it; the safety items work by themselves when they're needed:
//   ⏰ TIME BONUS   +50% time on the game you're playing           (tap)
//   🐢 SLOW-MO      this game again at slow speed (mid-game), or the next game     (tap)
//   💡 50/50        this game again with fewer wrong answers, or the next game     (tap; games that pick answers with the shared helpers)
//   🎲 RE-ROLL      skip this game for a different one, no penalty   (tap, during a game)
//   🛡️ SHIELD       your next mistake doesn't cost a heart           (automatic)
//   🔄 CONTINUE     out of hearts? keep going, once                  (automatic)
//   ❤️ EXTRA HEART  +1 heart straight away                           (instant: never stored)
// The frame does the effects (FrameAPI hooks via Items.bind); Settings can switch items off (`wwe.items.on`).
//   ✨ MAGIC GLOW   the right answer sparkles (this game, or the next) (tap; it runs the game's tutorial script: glowFinger in frame.js)
(function () {
  const C = () => window.Core;
  const KEY = "wwe.items", ON_KEY = "wwe.items.on", SLOTS = 3;
  const ITEMS = {
    time: { icon: "⏰", name: "TIME BONUS", say: "Time bonus!", tap: true, w: 20 },
    slow: { icon: "🐢", name: "SLOW-MO", say: "Slow motion!", tap: true, w: 14 },
    fifty: { icon: "💡", name: "50/50", say: "Fewer answers!", tap: true, w: 14 },
    reroll: { icon: "🎲", name: "RE-ROLL", say: "New game!", tap: true, w: 10 },
    shield: { icon: "🛡️", name: "SHIELD", say: "Shield!", auto: true, w: 16 },
    cont: { icon: "🔄", name: "CONTINUE", say: "Continue!", auto: true, w: 8 },
    glow: { icon: "✨", name: "MAGIC GLOW", say: "Magic glow!", tap: true, w: 14 },
    heart: { icon: "❤️", name: "EXTRA HEART", say: "Extra heart!", instant: true, w: 16 },
  };
  const CSS = `
  .it-bar { display:flex; gap:6px; align-items:center; }
  .it-slot { width:40px; height:40px; border:3px solid #111; border-radius:50%; background:#fff; font:inherit; font-size:1.35rem; line-height:1; display:flex; align-items:center;
    justify-content:center; padding:0; cursor:pointer; touch-action:manipulation; position:relative; }
  .it-slot.empty { background:rgba(255,255,255,.45); border-style:dashed; cursor:default; }
  .it-slot.auto::after { content:"AUTO"; position:absolute; bottom:-9px; left:50%; transform:translateX(-50%); font-size:.5rem; padding:1px 3px; background:#4dd36b; color:#fff; border:2px solid #111; border-radius:6px; }
  .it-slot.new { animation:it-pop .5s cubic-bezier(.2,1.8,.4,1); }
  .it-slot.armed { box-shadow:0 0 0 3px #ffd400, 0 0 12px #ffd400; }
  .it-box { position:fixed; inset:0; z-index:130; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; background:rgba(0,0,0,.55); cursor:pointer; }
  .it-box .cube { width:min(40vw, 200px); aspect-ratio:1; display:flex; align-items:center; justify-content:center; font-size:min(24vw, 120px); line-height:1; border:7px solid #111; border-radius:28px;
    background:repeating-linear-gradient(45deg, #ffd400 0 18px, #ffb800 18px 36px); box-shadow:0 10px 0 #111; animation:it-shake .3s ease-in-out infinite alternate; }
  .it-box .cube.spin { animation:none; background:#fff; }
  .it-box .cube.got { animation:it-pop .5s cubic-bezier(.2,1.8,.4,1); background:#b8ffcf; }
  .it-box .t { font-size:clamp(1.6rem, 7vw, 2.6rem); color:#fff; -webkit-text-stroke:2px #111; paint-order:stroke fill; text-shadow:0 5px 0 #111; text-align:center; line-height:1.05; white-space:pre-line; }
  .it-toast { position:fixed; left:50%; top:22%; transform:translateX(-50%); z-index:135; padding:10px 20px; background:#fff; border:5px solid #111; border-radius:20px; box-shadow:0 6px 0 #111;
    font-size:clamp(1.3rem, 6vw, 2rem); white-space:nowrap; pointer-events:none; animation:it-toast 1.6s ease-out forwards; }
  @keyframes it-shake { from { transform:rotate(-6deg) scale(1); } to { transform:rotate(6deg) scale(1.06); } }
  @keyframes it-pop { from { transform:scale(.3); } 60% { transform:scale(1.25); } to { transform:none; } }
  @keyframes it-toast { 0% { opacity:0; transform:translateX(-50%) scale(.5); } 15% { opacity:1; transform:translateX(-50%) scale(1.1); } 80% { opacity:1; } 100% { opacity:0; transform:translateX(-50%) translateY(-30px); } }
  @media (prefers-reduced-motion: reduce) { .it-box .cube, .it-slot.new, .it-toast { animation:none !important; } }
  `;
  let cssDone = false;
  function injectCss() { if (cssDone) return; cssDone = true; const s = document.createElement("style"); s.textContent = CSS; document.head.appendChild(s); }

  // ---------- The slots (per player) ----------
  const on = () => C().storage.get(ON_KEY, true) !== false;
  const slots = () => { const s = C().storage.get(KEY, []); return Array.isArray(s) ? s.filter((id) => ITEMS[id]).slice(0, SLOTS) : []; };
  const save = (s) => C().storage.set(KEY, s);
  const has = (id) => slots().includes(id);
  function take(id) { const s = slots(), k = s.indexOf(id); if (k < 0) return false; s.splice(k, 1); save(s); render(); return true; }
  const full = () => slots().length >= SLOTS;

  // ---------- The bar of slots (in the play screen's header) ----------
  let bar = null, hooks = {}, fresh = -1;
  function bind(el, h) { bar = el; hooks = h || {}; injectCss(); render(); }
  function render() {
    if (!bar) return;
    bar.innerHTML = "";
    bar.classList.add("it-bar");
    const s = slots();
    for (let k = 0; k < SLOTS; k++) {
      const id = s[k], d = ITEMS[id];
      const b = document.createElement("button");
      b.className = "it-slot" + (!d ? " empty" : d.auto ? " auto" : "") + (k === fresh ? " new" : "") + (d && hooks.armed && hooks.armed(id) ? " armed" : "");
      b.textContent = d ? d.icon : "";
      b.setAttribute("aria-label", d ? d.name : "Empty item slot");
      if (d && d.tap) b.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); use(id); });
      bar.appendChild(b);
    }
    fresh = -1;
  }
  // Tap an item: the frame decides if it can be used right now (hooks.use returns true when it was).
  function use(id) {
    if (!hooks.use || !hooks.use(id)) { C().sfx.tone(200, 0.08, "square", 0.06); return; }
    take(id);
    toast(`${ITEMS[id].icon} ${ITEMS[id].name}!`);
    C().say(ITEMS[id].say);
    [660, 880, 1100].forEach((f, k) => C().sfx.tone(f, 0.08, "triangle", 0.08, k * 0.06));
  }
  // The automatic ones: the frame asks when it needs one (true: it was used up).
  function useAuto(id) {
    if (!on() || !take(id)) return false;
    toast(`${ITEMS[id].icon} ${ITEMS[id].name}!`);
    C().say(ITEMS[id].say);
    [523, 784].forEach((f, k) => C().sfx.tone(f, 0.1, "triangle", 0.09, k * 0.08));
    return true;
  }
  function toast(text) {
    injectCss();
    const t = document.createElement("div");
    t.className = "it-toast"; t.textContent = text;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 1700);
  }
  function roll(skip = []) {
    const ids = Object.keys(ITEMS).filter((id) => !skip.includes(id)), total = ids.reduce((n, id) => n + ITEMS[id].w, 0);
    let r = Math.random() * total;
    for (const id of ids) { r -= ITEMS[id].w; if (r <= 0) return id; }
    return ids[0];
  }

  // ---------- ❓ The item box: tap (or wait), it spins, lands on an item ----------
  // (skip: item ids that can't come out here, e.g. ❤️ and 🔄 in Boss Battle, which has no hearts to add)
  function box(onDone, skip = []) {
    injectCss();
    const w = document.createElement("div");
    w.className = "it-box";
    w.innerHTML = '<div class="t">ITEM BOX!</div><div class="cube">❓</div><div class="t" style="font-size:1.2rem">TAP!</div>';
    document.body.appendChild(w);
    const cube = w.querySelector(".cube"), title = w.firstChild, hint = w.lastChild;
    C().sfx.tone(523, 0.1, "square", 0.07); C().sfx.tone(784, 0.12, "square", 0.07, 0.1);
    C().say("Item box!");
    let opened = false;
    const open = () => {
      if (opened) return;
      opened = true;
      hint.textContent = "";
      cube.classList.add("spin");
      const ids = Object.keys(ITEMS).filter((id) => !skip.includes(id)), got = roll(skip);
      let n = 0;
      (function spin() {
        cube.textContent = ITEMS[ids[n % ids.length]].icon;
        C().sfx.tone(600 + (n % 5) * 80, 0.04, "square", 0.05);
        n++;
        if (n < 16) { setTimeout(spin, 60 + n * 12); return; }
        cube.textContent = ITEMS[got].icon;
        cube.classList.remove("spin"); cube.classList.add("got");
        title.textContent = `${ITEMS[got].name}!`;
        C().say(ITEMS[got].say);
        [523, 659, 784, 1047].forEach((f, k) => C().sfx.tone(f, 0.1, "triangle", 0.09, k * 0.07));
        if (ITEMS[got].instant) { if (hooks.instant) hooks.instant(got); }
        else { const s = slots(); s.push(got); save(s); fresh = s.length - 1; render(); }
        setTimeout(() => { w.remove(); onDone(); }, 1300);
      })();
    };
    w.addEventListener("pointerdown", (e) => { e.preventDefault(); open(); });
    setTimeout(open, 2200); // (it opens by itself too)
  }

  window.Items = { ITEMS, on, slots, has, take, full, bind, render, useAuto, box, toast, SLOTS, ON_KEY };
})();
