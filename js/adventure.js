// 🗺️ ADVENTURE — the teacher's idea: a map of themed islands. Each island is a winding path of 7 levels and its
// boss. A level is 3 of that island's games (any content in play) for 0–3 stars; a star or more opens the next
// one. The boss level is that boss's final battle; beat it and the next island opens. Progress is the active
// player's (js/players.js: `wwe.adventure` is a per-player key): { stars: { "jungle-0": 3, … } }.
// The frame plays the levels (FrameAPI.playLevel / playBoss, mode "adventure") and calls record() with the
// stars; the results screen's MAP button comes back here, and your character hops to the next level.
(function () {
  const KEY = "wwe.adventure";
  const ISLANDS = [
    { id: "jungle", name: "JUNGLE", icon: "🌴", boss: "gorilla", bg: ["#8fe36b", "#3fae4a"], deco: ["🌴", "🌿", "🦜", "🍌", "🌺", "🐒"],
      games: ["monkey-swing", "froggy-hop", "lake-leap", "bongo-bash", "tug-of-war", "balloon-pop", "chicken-choir"] },
    { id: "ninja", name: "NINJA CASTLE", icon: "🏯", boss: "banana", bg: ["#ffc2dc", "#e86aa6"], deco: ["🏯", "🌸", "⛩️", "🎋", "🌸", "🗻"],
      games: ["samurai-slice", "shuriken-toss", "maze-run", "whack-a-mole", "shield-breaker", "egg-shuffle", "spot-imposter"] },
    { id: "funfair", name: "ROBOT FUNFAIR", icon: "🎡", boss: "robot", bg: ["#c7a8ff", "#7a4fe0"], deco: ["🎡", "🎪", "🎠", "🎈", "🍿", "⚙️"],
      games: ["wire-cut", "pachinko", "dance-off", "monster-boxing", "strength-test", "claw-catch", "hoop-shot"] },
    { id: "nursery", name: "TOY NURSERY", icon: "🧸", boss: "baby", bg: ["#ffe0b8", "#f5a95c"], deco: ["🧸", "🪀", "🧩", "🍼", "🚂", "🎈"],
      games: ["feed-me", "clean-room", "ghost-hunt", "find-my-baby", "stop-sneeze", "train-builder", "window-wiper"] },
    { id: "cottage", name: "COSY COTTAGE", icon: "🏡", boss: "kitty", bg: ["#bfe9ff", "#4aa8e8"], deco: ["🏡", "🐟", "🧶", "🌻", "🐔", "🦜"],
      games: ["fishing", "mouse-trap", "yarn-chase", "polly-crackers", "tickle-tummy", "chicken-choir", "pizza-chef"] },
  ];
  const LEVELS = 8;                                    // 7 levels + the boss (the last)
  const SPEEDS = [1, 1, 1.1, 1.1, 1.2, 1.25, 1.3];     // a little faster along the path
  const SPOTS = [[18, 88], [46, 80], [78, 71], [62, 58], [30, 50], [20, 36], [52, 27], [50, 10]]; // % of the map: bottom → top
  const TEXT = {
    locked: (boss) => `🔒 Beat ${boss} to get here!`,
    stars: (n, of) => `⭐ ${n} / ${of}`,
    say: (name) => `${name.toLowerCase()}!`,
  };

  const CSS = `
  #adventure { position:fixed; inset:0; z-index:60; display:flex; flex-direction:column; background:transparent;
    padding:max(6px, env(safe-area-inset-top)) max(6px, env(safe-area-inset-right)) max(6px, env(safe-area-inset-bottom)) max(6px, env(safe-area-inset-left)); }
  #adventure[hidden] { display:none; }
  .ad-top { flex:none; display:flex; align-items:center; gap:8px; padding-bottom:6px; }
  .ad-x { flex:none; width:46px; height:46px; border-radius:50%; border:4px solid #111; background:#fff; font:inherit; font-size:1.2rem; cursor:pointer; }
  .ad-title { flex:1; display:flex; align-items:center; justify-content:center; gap:8px; min-width:0; }
  .ad-title .nm { font-size:clamp(1.3rem, 6vw, 2.2rem); line-height:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .ad-arrow { flex:none; width:50px; height:50px; border-radius:50%; border:4px solid #111; background:#ffd400; box-shadow:0 4px 0 #111; font:inherit; font-size:1.4rem; cursor:pointer; touch-action:manipulation; }
  .ad-arrow:disabled { opacity:.3; }
  .ad-total { flex:none; padding:4px 12px; background:#fff; border:4px solid #111; border-radius:99px; font-size:1.05rem; white-space:nowrap; }
  .ad-map { position:relative; flex:1; min-height:0; border:5px solid #111; border-radius:24px; overflow:hidden; box-shadow:0 7px 0 #111;
    background:radial-gradient(ellipse 80% 60% at 50% 55%, var(--b1) 0 60%, var(--b2) 100%); }
  .ad-map::before { content:""; position:absolute; inset:0; background:repeating-radial-gradient(circle at 30% 20%, rgba(255,255,255,.08) 0 18px, transparent 18px 40px); }
  .ad-deco { position:absolute; font-size:clamp(1.6rem, 6vw, 2.6rem); line-height:1; opacity:.9; pointer-events:none; transform:translate(-50%, -50%); }
  .ad-path { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; }
  .ad-node { position:absolute; width:var(--nz); height:var(--nz); margin:calc(var(--nz) / -2) 0 0 calc(var(--nz) / -2); border-radius:50%; border:5px solid #111; background:#fff;
    box-shadow:0 6px 0 #111; font:inherit; font-size:calc(var(--nz) * .42); line-height:1; cursor:pointer; touch-action:manipulation; z-index:2; display:flex; align-items:center; justify-content:center; }
  .ad-node.done { background:#ffe066; }
  .ad-node.next { animation:ad-pulse .8s ease-in-out infinite alternate; background:#fff; }
  .ad-node.locked { background:#bbb; color:#777; cursor:default; box-shadow:0 4px 0 #555; }
  .ad-node .st { position:absolute; left:50%; top:100%; transform:translateX(-50%); margin-top:6px; font-size:calc(var(--nz) * .26); white-space:nowrap; letter-spacing:-1px;
    color:#ffd400; -webkit-text-stroke:1px #111; paint-order:stroke fill; }
  .ad-node .st i { font-style:normal; color:rgba(0,0,0,.25); -webkit-text-stroke:0; }
  .ad-boss { --nz:calc(var(--bz)); width:var(--bz); height:var(--bz); margin:calc(var(--bz) / -2) 0 0 calc(var(--bz) / -2); border-radius:24px; background:rgba(255,255,255,.55); }
  .ad-boss .bx-boss { position:absolute; inset:6%; width:auto !important; height:auto !important; }
  .ad-boss.locked .bx-boss, .ad-boss.dark .bx-boss { filter:brightness(0); }
  .ad-boss .crown { position:absolute; right:-14px; top:-18px; font-size:calc(var(--bz) * .3); }
  .ad-me { position:absolute; left:0; top:0; z-index:3; pointer-events:none; }
  .ad-me .ms { margin:calc(var(--mz) * -1.05) 0 0 calc(var(--mz) * -.5); }
  .ad-lock { position:absolute; inset:0; z-index:4; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,.45); }
  .ad-lock span { padding:12px 18px; background:#fff; border:5px solid #111; border-radius:18px; font-size:clamp(1.1rem, 5vw, 1.6rem); text-align:center; }
  @keyframes ad-pulse { from { transform:scale(1); box-shadow:0 6px 0 #111, 0 0 0 0 rgba(255,212,0,.9); } to { transform:scale(1.1); box-shadow:0 6px 0 #111, 0 0 0 12px rgba(255,212,0,.25); } }
  `;
  let cssDone = false;
  function injectCss() { if (cssDone) return; cssDone = true; const s = document.createElement("style"); s.textContent = CSS; document.head.appendChild(s); }

  const C = () => window.Core;
  const F = () => window.FrameAPI;
  const load = () => { const p = C().storage.get(KEY, null) || {}; return { stars: p.stars || {} }; };
  const starsOf = (p, i, j) => p.stars[`${ISLANDS[i].id}-${j}`] || 0;
  const islandOpen = (p, i) => i === 0 || starsOf(p, i - 1, LEVELS - 1) > 0;
  const levelOpen = (p, i, j) => islandOpen(p, i) && (j === 0 || starsOf(p, i, j - 1) > 0);
  // The level to play next on an island (the first not yet passed), or the boss once all are.
  const nextLevel = (p, i) => { for (let j = 0; j < LEVELS; j++) if (!starsOf(p, i, j)) return j; return LEVELS - 1; };

  let root = null, shown = 0, hop = null, quiet = false;

  // The frame reports a level's stars (best kept). A first pass makes your character hop on next time.
  function record(adv, stars) {
    const p = load();
    const k = `${adv.island}-${adv.level}`;
    const before = p.stars[k] || 0;
    if (stars > before) p.stars[k] = stars;
    C().storage.set(KEY, p);
    if (!before && stars) hop = { island: adv.island, from: adv.level };
  }

  function open(islandId) {
    injectCss();
    if (!root) { root = document.createElement("div"); root.id = "adventure"; document.body.appendChild(root); }
    root.hidden = false;
    F().hideAll();
    if (window.Music) Music.play("menu");
    const p = load();
    // Show the island just played, else the furthest one that's open.
    let i = ISLANDS.findIndex((x) => x.id === (islandId || (hop && hop.island)));
    if (i < 0) { i = 0; while (i + 1 < ISLANDS.length && islandOpen(p, i + 1)) i++; }
    shown = i;
    render();
  }
  function close() {
    if (root) { root.hidden = true; root.innerHTML = ""; }
    F().goTitle();
  }

  function render() {
    const p = load(), i = shown, isl = ISLANDS[i];
    const B = window.Boss.BOSSES[isl.boss];
    root.innerHTML = "";
    F().setTheme(i + 1);
    // Top bar: ✕, ◀ island ▶, total stars.
    const top = document.createElement("div");
    top.className = "ad-top";
    const x = document.createElement("button"); x.className = "ad-x"; x.textContent = "✕"; x.setAttribute("aria-label", "Back");
    x.addEventListener("click", close);
    const title = document.createElement("div"); title.className = "ad-title";
    const prev = document.createElement("button"); prev.className = "ad-arrow"; prev.textContent = "◀"; prev.disabled = i === 0;
    const next = document.createElement("button"); next.className = "ad-arrow"; next.textContent = "▶"; next.disabled = i === ISLANDS.length - 1;
    prev.addEventListener("click", () => { C().unlock(); shown = Math.max(0, i - 1); hop = null; render(); });
    next.addEventListener("click", () => { C().unlock(); shown = Math.min(ISLANDS.length - 1, i + 1); hop = null; render(); });
    const nm = document.createElement("div"); nm.className = "nm shout"; nm.textContent = `${isl.icon} ${isl.name}`;
    title.append(prev, nm, next);
    let total = 0;
    ISLANDS.forEach((_, a) => { for (let j = 0; j < LEVELS; j++) total += Math.min(3, starsOf(p, a, j)); });
    const tot = document.createElement("div"); tot.className = "ad-total shout"; tot.textContent = TEXT.stars(total, ISLANDS.length * LEVELS * 3);
    top.append(x, title, tot);

    // The map: decorations, the dotted path, the level buttons, the boss, and you.
    const map = document.createElement("div");
    map.className = "ad-map";
    map.style.setProperty("--b1", isl.bg[0]); map.style.setProperty("--b2", isl.bg[1]);
    root.append(top, map);
    const W = map.clientWidth, H = map.clientHeight;
    const nz = Math.max(48, Math.min(W * 0.14, H * 0.1, 76));
    map.style.setProperty("--nz", `${nz}px`);
    map.style.setProperty("--bz", `${nz * 1.7}px`);
    [[8, 12], [88, 22], [10, 62], [86, 46], [70, 90], [36, 18], [90, 84], [8, 96]].forEach(([dx, dy], k) => {
      const d = document.createElement("div"); d.className = "ad-deco"; d.textContent = isl.deco[k % isl.deco.length];
      d.style.left = `${dx}%`; d.style.top = `${dy}%`;
      map.appendChild(d);
    });
    const pt = (j) => ({ x: (SPOTS[j][0] / 100) * W, y: (SPOTS[j][1] / 100) * H });
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "ad-path");
    let d = `M${pt(0).x} ${pt(0).y}`;
    for (let j = 1; j < LEVELS; j++) { const a = pt(j - 1), b = pt(j); d += ` Q${(a.x + b.x) / 2 + (j % 2 ? 40 : -40)} ${(a.y + b.y) / 2} ${b.x} ${b.y}`; }
    svg.innerHTML = `<path d="${d}" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="16" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#fff8d6" stroke-width="9" stroke-dasharray="2 18" stroke-linecap="round"/>`;
    map.appendChild(svg);
    const nextJ = nextLevel(p, i);
    for (let j = 0; j < LEVELS; j++) {
      const isBoss = j === LEVELS - 1;
      const open = levelOpen(p, i, j), s = starsOf(p, i, j);
      const n = document.createElement("button");
      n.className = "ad-node" + (isBoss ? " ad-boss" : "") + (!open ? " locked" : s ? " done" : j === nextJ ? " next" : "");
      const at = pt(j);
      n.style.left = `${at.x}px`; n.style.top = `${at.y}px`;
      if (isBoss) {
        n.appendChild(window.Boss.el(isl.boss, nz * 1.5));
        if (!open) n.classList.add("dark");
        if (s) n.insertAdjacentHTML("beforeend", '<span class="crown">👑</span>');
        n.setAttribute("aria-label", open ? B.name : "Locked boss");
      } else {
        n.textContent = open ? j + 1 : "🔒";
        if (open) n.insertAdjacentHTML("beforeend", `<span class="st">${"★".repeat(s)}<i>${"★".repeat(3 - s)}</i></span>`);
        n.setAttribute("aria-label", `Level ${j + 1}${open ? `, ${s} stars` : ", locked"}`);
      }
      n.addEventListener("click", () => {
        C().unlock();
        if (!open || !islandOpen(p, i)) { C().sfx.tone(200, 0.1, "square", 0.08); return; }
        hop = null;
        const adv = { island: isl.id, level: j, games: isl.games, speed: SPEEDS[Math.min(j, SPEEDS.length - 1)], boss: isBoss ? isl.boss : null };
        root.hidden = true;
        if (isBoss) F().playBoss(adv); else F().playLevel(adv);
      });
      map.appendChild(n);
    }
    // You: on the next level (hopping there from the one just passed).
    const me = document.createElement("div");
    me.className = "ad-me";
    const mz = nz * 1.1;
    me.style.setProperty("--mz", `${mz}px`);
    const fig = window.Mascot.el(mz);
    me.appendChild(fig);
    map.appendChild(me);
    const place = (j) => { const a = pt(j); me.style.transform = `translate(${a.x}px, ${a.y - nz * 0.35}px)`; };
    if (hop && hop.island === isl.id && hop.from < LEVELS - 1 && islandOpen(p, i)) {
      const from = hop.from, to = Math.min(from + 1, LEVELS - 1);
      place(from);
      hop = null;
      window.Mascot.mood(fig, "cheer");
      const a = pt(from), b = pt(to);
      setTimeout(() => {
        me.animate([{ transform: `translate(${a.x}px, ${a.y - nz * 0.35}px)` }, { transform: `translate(${(a.x + b.x) / 2}px, ${Math.min(a.y, b.y) - nz * 1.4}px)`, offset: 0.5 },
          { transform: `translate(${b.x}px, ${b.y - nz * 0.35}px)` }], { duration: 650, easing: "ease-in-out", fill: "forwards" });
        C().sfx.sweep(300, 900, 0.3, "triangle", 0.1);
        setTimeout(() => { place(to); window.Mascot.mood(fig, null); C().sfx.tone(880, 0.1, "triangle", 0.1); }, 660);
      }, 500);
    } else place(islandOpen(p, i) ? nextJ : 0);
    // A locked island: which boss to beat first.
    if (!islandOpen(p, i)) {
      const lock = document.createElement("div");
      lock.className = "ad-lock";
      lock.innerHTML = "<span></span>";
      lock.firstChild.textContent = TEXT.locked(window.Boss.BOSSES[ISLANDS[i - 1].boss].name);
      map.appendChild(lock);
    }
    if (!quiet) C().say(TEXT.say(isl.name));
  }

  // Turning the iPad redraws the map.
  window.addEventListener("resize", () => { if (root && !root.hidden && root.firstChild) { const h = hop; hop = null; quiet = true; render(); quiet = false; hop = h; } });
  window.Adventure = { open, close, record, ISLANDS };
})();
