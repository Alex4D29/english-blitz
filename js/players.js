// PLAYER SAVES — up to 10 children share one iPad (the teacher's idea). Each save keeps its own character,
// unlocked characters, bosses beaten, Endless best and Adventure map: Core.storage namespaces those keys per
// player (PER_PLAYER in js/core.js), so the games don't need to know. Settings, MY WORDS and the rest belong
// to the iPad. When there's more than one save, WHO'S PLAYING? asks at start (and from the title menu's
// player chip); Settings has a list to rename or delete saves. Anything saved before saves existed becomes
// PLAYER 1.
(function () {
  const TEXT = {
    who: "WHO'S\nPLAYING?",
    add: "NEW\nPLAYER",
    addBtn: "＋ ADD PLAYER",
    name: (n) => `PLAYER ${n}`,
    hi: (name) => `Hi ${name}!`,
    go: "Let's play!",
    del: "🗑️",
    sure: "SURE?",
    full: "10 players is the most.",
  };
  const LIST_KEY = "wwe.players", ACTIVE_KEY = "wwe.player", MAX = 10;
  const C = () => window.Core;
  const S = () => window.Core.storage;

  const CSS = `
  .pl-pick { position:fixed; inset:0; z-index:115; display:flex; align-items:flex-start; justify-content:center; padding:16px; overflow-y:auto; background:rgba(0,0,0,.55); }
  .pl-card { width:min(100%, 620px); display:flex; flex-direction:column; align-items:center; gap:12px; text-align:center; margin:auto 0; }
  .pl-card h2 { margin:0; font-size:clamp(1.8rem, 8vw, 2.8rem); line-height:1; white-space:pre-line; }
  .pl-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(100px, 1fr)); gap:10px; width:100%; }
  .pl-slot { display:flex; flex-direction:column; align-items:center; gap:4px; padding:8px 4px; border:4px solid #111; border-radius:16px; background:#fff; box-shadow:0 5px 0 #111;
    font:inherit; font-size:.95rem; line-height:1.05; cursor:pointer; touch-action:manipulation; min-width:0; overflow-wrap:anywhere; }
  .pl-slot.on { background:#ffe066; }
  .pl-slot.add { background:#e6f9ff; border-style:dashed; justify-content:center; font-size:1rem; white-space:pre-line; }
  .pl-slot.add .plus { font-size:2.6rem; line-height:1; }
  /* Settings: the list of saves */
  .pl-manage { display:flex; flex-direction:column; gap:8px; width:100%; }
  .pl-row { display:flex; align-items:center; gap:8px; }
  .pl-row input { flex:1; min-width:0; font:inherit; font-size:1.1rem; padding:8px 10px; border:3px solid #111; border-radius:10px; }
  .pl-row .del { flex:none; width:52px; height:44px; border:3px solid #111; border-radius:10px; background:#fff; font:inherit; font-size:1.1rem; cursor:pointer; }
  .pl-row .del.sure { background:#ff5a6e; color:#fff; font-size:.85rem; }
  .pl-add { align-self:center; font-size:1.2rem !important; padding:10px 18px !important; background:#e6f9ff !important; }
  .pl-row.on input { background:#fff6c2; font-weight:700; }
  `;
  let cssDone = false;
  function injectCss() { if (cssDone) return; cssDone = true; const s = document.createElement("style"); s.textContent = CSS; document.head.appendChild(s); }

  // ---------- The saves ----------
  const list = () => (S().get(LIST_KEY, []) || []).filter((p) => p && p.id);
  const saveList = (l) => S().set(LIST_KEY, l);
  const active = () => list().find((p) => p.id === S().player) || null;
  function use(id) {
    S().player = id;
    S().set(ACTIVE_KEY, id);
  }
  function create() {
    const l = list();
    if (l.length >= MAX) return null;
    let n = 1;
    while (l.some((p) => p.id === `p${n}`)) n++;
    const p = { id: `p${n}`, name: TEXT.name(n) };
    l.push(p);
    saveList(l);
    return p;
  }
  function rename(id, name) {
    const l = list();
    const p = l.find((x) => x.id === id);
    if (p) { p.name = String(name).slice(0, 14) || p.name; saveList(l); }
  }
  function remove(id) {
    S().PER_PLAYER.forEach((k) => S().raw.remove(`${k}@${id}`));
    saveList(list().filter((p) => p.id !== id));
    if (S().player === id) {
      const first = list()[0] || create();
      use(first.id);
    }
  }
  const charOf = (id) => { try { return JSON.parse(S().raw.get(`wwe.char@${id}`)) || "blitz"; } catch (err) { return "blitz"; } };

  // First run with saves: everything saved so far (one shared iPad) becomes PLAYER 1.
  function init() {
    let l = list();
    if (!l.length) {
      const p = create();
      S().PER_PLAYER.forEach((k) => {
        const v = S().raw.get(k);
        if (v != null && S().raw.get(`${k}@${p.id}`) == null) S().raw.set(`${k}@${p.id}`, v);
        S().raw.remove(k);
      });
      l = list();
    }
    const want = S().get(ACTIVE_KEY, null);
    use(l.some((p) => p.id === want) ? want : l[0].id);
  }

  // ---------- WHO'S PLAYING? ----------
  // A card per save (its character and name) and NEW PLAYER (then that child picks a character).
  function openPicker(opts = {}) {
    injectCss();
    const wrap = document.createElement("div");
    wrap.className = "pl-pick";
    wrap.setAttribute("role", "dialog");
    wrap.innerHTML = `<div class="pl-card card"><h2 class="shout"></h2><div class="pl-grid"></div></div>`;
    wrap.querySelector("h2").textContent = TEXT.who;
    const grid = wrap.querySelector(".pl-grid");
    const done = (isNew) => { wrap.remove(); if (opts.onDone) opts.onDone(isNew); };
    list().forEach((p) => {
      const b = document.createElement("button");
      b.className = "pl-slot" + (p.id === S().player ? " on" : "");
      b.appendChild(window.Mascot.el(64, charOf(p.id)));
      b.insertAdjacentHTML("beforeend", "<span></span>");
      b.lastChild.textContent = p.name;
      b.addEventListener("click", () => {
        C().unlock();
        use(p.id);
        C().sfx.tone(660, 0.08); C().sfx.tone(880, 0.1, "triangle", 0.08, 0.08);
        C().say(/^player [0-9]+$/i.test(p.name) ? TEXT.go : TEXT.hi(p.name));
        done(false);
      });
      grid.appendChild(b);
    });
    if (list().length < MAX) {
      const add = document.createElement("button");
      add.className = "pl-slot add";
      add.innerHTML = `<span class="plus">＋</span><span></span>`;
      add.lastChild.textContent = TEXT.add;
      add.addEventListener("click", () => {
        C().unlock();
        const p = create();
        if (!p) return;
        use(p.id);
        wrap.remove();
        window.Mascot.openPicker({ onDone: () => { if (opts.onDone) opts.onDone(true); } }); // the new child picks a character
      });
      grid.appendChild(add);
    }
    document.body.appendChild(wrap);
  }

  // ---------- Settings: rename or delete saves ----------
  function renderManager(box, onChange) {
    injectCss();
    box.innerHTML = "";
    const m = document.createElement("div");
    m.className = "pl-manage";
    list().forEach((p) => {
      const row = document.createElement("div");
      row.className = "pl-row" + (p.id === S().player ? " on" : ""); // (the one playing now is highlighted)
      row.appendChild(window.Mascot.el(40, charOf(p.id)));
      const inp = document.createElement("input");
      inp.type = "text"; inp.maxLength = 14; inp.value = p.name; inp.setAttribute("aria-label", "Player name");
      inp.addEventListener("change", () => { rename(p.id, inp.value.trim()); if (onChange) onChange(); });
      const del = document.createElement("button");
      del.className = "del"; del.textContent = TEXT.del; del.setAttribute("aria-label", `Delete ${p.name}`);
      let armed = null;
      del.addEventListener("click", () => {
        if (!armed) { // two taps: the first asks SURE?
          del.classList.add("sure"); del.textContent = TEXT.sure;
          armed = setTimeout(() => { armed = null; del.classList.remove("sure"); del.textContent = TEXT.del; }, 2500);
          return;
        }
        clearTimeout(armed);
        remove(p.id);
        renderManager(box, onChange);
        if (onChange) onChange();
      });
      row.append(inp, del);
      m.appendChild(row);
    });
    // ＋ ADD PLAYER (the teacher couldn't find a way to add one): a new save, which picks its character now.
    if (list().length < MAX) {
      const add = document.createElement("button");
      add.className = "chunky pl-add";
      add.textContent = TEXT.addBtn;
      add.addEventListener("click", () => {
        C().unlock();
        const p = create();
        if (!p) return;
        use(p.id);
        window.Mascot.openPicker({ onDone: () => { renderManager(box, onChange); if (onChange) onChange(); } });
      });
      m.appendChild(add);
    }
    box.appendChild(m);
  }

  init(); // (straight away: everything else reads the active player's saves)
  window.Players = { init, list, active, use, create, rename, remove, charOf, openPicker, renderManager, MAX };
})();
