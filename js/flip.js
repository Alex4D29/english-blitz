// FLIP CARDS — the shared engine for the memory-pairs games (Magic Hats, Peekaboo Park, Alien Twins, Glove Hunt;
// like js/power.js for the power bar). A grid of things that hide something (hats, bushes, pods, gloves); tap one
// and it opens to show its half of a pair (`ctx.matchPairs`: B and b, B and 🐝, cat and 🐱, said and said); tap a
// second: a pair stays open (the game's own celebration), not a pair and both close again after a moment (the
// game's own silly "nope"). Find every pair to win; it's a memory game, so a wrong pair costs nothing but time.
// Each game is a "skin": its own CSS, scene and cell drawing, and hooks for what happens.
//
//   FlipCards.start(ctx, skin) → api
//   skin = {
//     cls,            // the game's CSS prefix (the cells get `${cls}-cell`, the stage `${cls}-stage`)
//     scene(stage),   // draw the background into the stage (optional)
//     cell(i),        // the HTML inside a closed cell (the hat, the bush…); the engine adds `.fc-face` with the label
//     onOpen(cell), onClose(cell), onMatch(a, b, api), onMiss(a, b, api), onWin(api)   // (optional)
//     text: { found: [...], nope: "…", win: "…" }, cols(n) (optional), topPad (px, room for something above the grid)
//   }
//   api = { stage, fx, cells, W, H, word(text, bad, x, y), pop(emoji, x, y, size), centre(cell) }
(function () {
  const CSS = `
  .fc { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:6px; padding-bottom:6px; }
  .fc-top { flex:none; display:flex; gap:8px; align-items:center; min-height:30px; }
  .fc-pip { width:26px; height:26px; border:3px solid #111; border-radius:50%; background:#fff; display:flex; align-items:center; justify-content:center; font-size:14px; line-height:1; }
  .fc-pip.on { background:#ffd400; } .fc-pip.on::after { content:"✔"; color:#111; font-weight:900; }
  .fc-stage { position:relative; flex:1; min-height:0; width:100%; max-width:640px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111; touch-action:manipulation; }
  .fc-grid { position:absolute; display:grid; gap:var(--fg); }
  .fc-cell { position:relative; padding:0; border:0; background:none; font:inherit; cursor:pointer; touch-action:manipulation; width:var(--cz); height:var(--cz); }
  .fc-cell > * { pointer-events:none; }
  .fc-face { position:absolute; left:50%; top:50%; transform:translate(-50%, -50%) scale(0); z-index:5; padding:2px 8px; background:#fff; border:4px solid #111; border-radius:12px;
    box-shadow:0 4px 0 #111; font-weight:900; color:#111; line-height:1.1; white-space:nowrap; transition:transform .25s cubic-bezier(.2,1.6,.4,1); }
  .fc-cell.open .fc-face, .fc-cell.matched .fc-face { transform:translate(-50%, -50%) scale(1); }
  .fc-cell.matched .fc-face { box-shadow:0 0 0 4px #fff, 0 0 0 8px #00b86b; }
  .fc-cell.hint .fc-face { transform:translate(-50%, -50%) scale(1); box-shadow:0 0 0 4px #fff, 0 0 0 8px #ffd400; }
  .fc-fx { position:absolute; inset:0; pointer-events:none; z-index:9; overflow:visible; }
  .fc-pop { position:absolute; line-height:1; transform:translate(-50%, -50%); pointer-events:none; }
  .fc-word { position:absolute; transform:translate(-50%, -50%) rotate(-8deg); font-size:2rem; color:#ffd400; -webkit-text-stroke:2px #111; paint-order:stroke fill;
    text-shadow:0 4px 0 #111; white-space:nowrap; animation:fc-word 1s ease-out forwards; z-index:10; }
  .fc-word.bad { color:#ff5a6e; }
  @keyframes fc-word { from { opacity:1; scale:.5; } 25% { scale:1.15; } 75% { opacity:1; } to { opacity:0; translate:0 -40px; } }
  @media (prefers-reduced-motion: reduce) { .fc-word { animation:none !important; } .fc-face { transition:none; } }
  `;
  function injectCss() { if (document.getElementById("fc-css")) return; const s = document.createElement("style"); s.id = "fc-css"; s.textContent = CSS; document.head.appendChild(s); }

  function start(ctx, skin) {
    injectCss();
    const speed = ctx.speed || 1;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const { tone, sweep } = ctx.sfx;
    const N = speed >= 1.5 ? 4 : 3;   // pairs: 6 cards, 8 from 1.5×
    const P = ctx.matchPairs(N);
    const halves = ctx.shuffle(P.flatMap((p, k) => [{ ...p.a, pair: k, p }, { ...p.b, pair: k, p }]));

    const wrap = document.createElement("div");
    wrap.className = "fc";
    wrap.innerHTML = `<div class="fc-top">${'<span class="fc-pip"></span>'.repeat(P.length)}</div>`;
    const stage = document.createElement("div");
    stage.className = `fc-stage ${skin.cls}-stage`;
    if (skin.scene) skin.scene(stage);
    const grid = document.createElement("div");
    grid.className = "fc-grid";
    const fx = document.createElement("div");
    fx.className = "fc-fx";
    stage.append(grid, fx);
    wrap.appendChild(stage);
    ctx.root.appendChild(wrap);
    const pips = wrap.querySelector(".fc-top").children;

    const cells = halves.map((h, i) => {
      const el = document.createElement("button");
      el.className = `fc-cell ${skin.cls}-cell`;
      el.setAttribute("aria-label", `Card ${i + 1}`);
      el.innerHTML = skin.cell(i) + '<span class="fc-face"></span>';
      el.querySelector(".fc-face").textContent = h.text;
      const c = { el, h, i, state: "closed" };
      el.addEventListener("pointerdown", (e) => { e.preventDefault(); tap(c); });
      grid.appendChild(el);
      return c;
    });

    const api = { stage, fx, cells, W: 0, H: 0, word, pop, centre };
    const cols = skin.cols ? skin.cols(cells.length) : cells.length <= 6 ? 3 : 4;
    const rows = Math.ceil(cells.length / cols);
    function layout() {
      const W = stage.clientWidth, H = stage.clientHeight, top = skin.topPad ? skin.topPad(H) : 0;
      api.W = W; api.H = H;
      const g = 12, cz = Math.max(60, Math.min((W - 24 - g * (cols - 1)) / cols, (H - top - 24 - g * (rows - 1)) / rows, 150));
      stage.style.setProperty("--cz", `${cz}px`); stage.style.setProperty("--fg", `${g}px`);
      grid.style.gridTemplateColumns = `repeat(${cols}, ${cz}px)`;
      const gw = cols * cz + (cols - 1) * g, gh = rows * cz + (rows - 1) * g;
      grid.style.left = `${(W - gw) / 2}px`; grid.style.top = `${top + (H - top - gh) / 2}px`;
      cells.forEach((c) => { const f = c.el.querySelector(".fc-face"); f.style.fontSize = `${c.h.kind === "pic" ? cz * 0.36 : Math.min(cz * 0.32, (cz * 0.86) / ([...c.h.text].length * 0.62))}px`; });
    }

    let first = null, busy = false, done = false, found = 0;
    function tap(c) {
      if (done || busy || ctx.ended || c.state !== "closed") return;
      c.state = "open";
      c.el.classList.add("open");
      if (skin.onOpen) skin.onOpen(c, api);
      tone(520 + (first ? 140 : 0), 0.06, "triangle", 0.07);
      ctx.say(c.h.spoken);
      if (!first) { first = c; return; }
      const a = first; first = null;
      busy = true;
      if (a.h.pair === c.h.pair) {
        ctx.later(() => {
          a.state = c.state = "matched";
          a.el.classList.add("matched"); c.el.classList.add("matched");
          pips[found].classList.add("on");
          found++;
          [523, 659, 784].forEach((f, k) => tone(f, 0.09, "triangle", 0.09, k * 0.07));
          const m = centre(c);
          word(skin.text.found[(found - 1) % skin.text.found.length], false, m.x, m.y - 40);
          if (skin.onMatch) skin.onMatch(a, c, api);
          ctx.later(() => ctx.say(a.h.p.say), 350);
          busy = false;
          if (found >= P.length) {
            done = true;
            ctx.win();
            ctx.later(() => { if (skin.onWin) skin.onWin(api); word(skin.text.win, false, api.W / 2, api.H * 0.2); ctx.confetti(fx, api.W / 2, api.H * 0.4, { count: 100 }); }, 400);
          }
        }, 300);
      } else {
        ctx.later(() => {
          sweep(400, 200, 0.25, "square", 0.06);
          const m = centre(c);
          word(skin.text.nope, true, m.x, m.y - 40);
          if (skin.onMiss) skin.onMiss(a, c, api);
        }, 450);
        ctx.later(() => {
          [a, c].forEach((x) => { x.state = "closed"; x.el.classList.remove("open"); if (skin.onClose) skin.onClose(x, api); });
          busy = false;
        }, reduceMotion ? 900 : 1300);
      }
    }
    function centre(c) { const r = c.el.getBoundingClientRect(), s = stage.getBoundingClientRect(); return { x: r.left - s.left + r.width / 2, y: r.top - s.top + r.height / 2 }; }
    function word(text, bad, x, y) {
      const w = document.createElement("div");
      w.className = "fc-word" + (bad ? " bad" : "");
      w.textContent = text;
      w.style.left = `${Math.max(90, Math.min(api.W - 90, x))}px`; w.style.top = `${Math.max(28, y)}px`;
      fx.appendChild(w);
      ctx.later(() => w.remove(), 1000);
    }
    function pop(e, x, y, size = 30, dx = 0, dy = -80, ms = 900) {
      if (reduceMotion) return;
      const p = document.createElement("div");
      p.className = "fc-pop"; p.textContent = e; p.style.fontSize = `${size}px`;
      p.style.left = `${x}px`; p.style.top = `${y}px`;
      fx.appendChild(p);
      p.animate([{ transform: "translate(-50%, -50%) scale(.4)", opacity: 1 }, { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1.1)`, opacity: 0 }], { duration: ms, easing: "ease-out", fill: "forwards" });
      ctx.later(() => p.remove(), ms + 20);
    }

    ctx.onTimeout(() => {
      done = true;
      cells.forEach((c) => { if (c.state !== "matched") { c.el.classList.add("hint"); if (skin.onOpen) skin.onOpen(c, api); } });
    });

    layout();
    const ro = new ResizeObserver(layout);
    ro.observe(stage);

    // Tutorial: open each pair in turn (the ghost finger knows where they are).
    ctx.tutorial(P.map((p) => p.item), async (f) => {
      for (let k = 0; k < P.length && !done; k++) {
        const two = cells.filter((c) => c.h.pair === k);
        await f.until(() => !busy, 3000);
        await f.tap(two[0].el);
        await f.until(() => !busy, 1000);
        await f.tap(two[1].el);
        await f.until(() => two[1].state === "matched" || done, 2000);
      }
    });
    api.cleanup = () => { done = true; ro.disconnect(); };
    return api;
  }

  window.FlipCards = { start };
})();
