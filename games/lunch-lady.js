// LUNCH LADY — a quick-sort game (Claude's idea, named by the teacher; groups from `ctx.sortSets`). Two picky
// monsters sit at the cafeteria table, one each side, each with a bib that says what it eats (B and D; -at and
// -ig…). Trays come out of the kitchen hatch one at a time, each with a letter, picture or word. Flick the tray to
// the monster that eats it (or tap the monster, or ← →): CHOMP, its tummy gets rounder. A wrong tray: EWW! It
// flings the food back and it SPLATS on the screen, ✕. Feed every tray to win; 3 food fights lose.
(function () {
  const TEXT = {
    name: { en: "Lunch Lady" },
    icon: "🍱",
    howTo: { en: {
      steps: [
        ["👹", "Two picky monsters! Each one only eats what's on its bib."],
        ["🍱", "A tray comes out. Flick it to the monster that eats it (or tap the monster)."],
        ["😋", "Feed them every tray!"],
      ],
      tips: ["The wrong monster yells EWW! and flings the food. Three food fights and it's over.", "Arrow keys work too.", "When the game speeds up, there are more trays."],
    } },
    instruction: { en: "LUNCH TIME!" },
    monLabel: (t) => `Monster that eats ${t}`,
    yum: ["CHOMP!", "YUM!", "MMM!", "GULP!"],
    eww: "EWW!",
    full: "SO FULL!",
  };
  const MISSES = 3;
  const SPLATS = ["#8fd16a", "#ff8a1f", "#e8173c"];

  const CSS = `
  .lch { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:6px; padding-bottom:6px; }
  .lch-top { flex:none; display:flex; gap:12px; align-items:center; min-height:28px; }
  .lch-left { font-size:1.1rem; padding:2px 10px; background:#fff; border:3px solid #111; border-radius:99px; }
  .lch-pips { display:flex; gap:5px; }
  .lch-pip { width:24px; height:24px; border:3px solid #111; border-radius:50%; background:#fff; }
  .lch-pip.x { background:#8fd16a; } .lch-pip.x::after { content:"🤢"; display:block; text-align:center; font-size:13px; line-height:18px; }
  .lch-room { position:relative; flex:1; min-height:0; width:100%; max-width:620px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111;
    background:linear-gradient(180deg, #c9f0e0 0 64%, #e8d2a8 64%), repeating-linear-gradient(90deg, rgba(0,0,0,.05) 0 40px, transparent 40px 80px); touch-action:none; }
  .lch-hatch { position:absolute; left:50%; top:0; width:calc(var(--tz) * 1.5); height:22%; margin-left:calc(var(--tz) * -.75); background:#4a3020; border:5px solid #111; border-top:0;
    border-radius:0 0 12px 12px; }
  .lch-hatch::after { content:""; position:absolute; left:-10%; right:-10%; top:0; height:24%; background:repeating-linear-gradient(90deg, #e8173c 0 14px, #fff 14px 28px); border-bottom:4px solid #111; }
  .lch-table { position:absolute; left:0; right:0; top:64%; height:8%; background:#a86a35; border-top:5px solid #111; border-bottom:5px solid #111; }
  .lch-arrow { position:absolute; top:46%; font-size:2.4rem; color:rgba(0,0,0,.22); font-weight:900; animation:lch-nudge .6s ease-in-out infinite alternate; }
  .lch-arrow.l { left:28%; } .lch-arrow.r { right:28%; animation-direction:alternate-reverse; }
  /* A tray (--tz) with the food's label */
  .lch-tray { position:absolute; left:50%; top:0; width:var(--tz); height:calc(var(--tz) * .7); margin-left:calc(var(--tz) / -2); z-index:4; pointer-events:none;
    background:#9aa3b5; border:4px solid #111; border-radius:10px; box-shadow:inset 0 0 0 6px #c4ccd6, 0 5px 0 rgba(0,0,0,.3); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; }
  .lch-tray b { padding:2px 8px; background:#fff; border:3px solid #111; border-radius:8px; font-weight:900; color:#111; line-height:1.1; white-space:nowrap; }
  .lch-tray i { font-style:normal; line-height:1; }
  /* A picky monster (--mz): a fat body, googly eyes, a big mouth, a bib with what it eats, a tummy that grows */
  .lch-mon { position:absolute; top:calc(64% - var(--mz) * .95); width:var(--mz); height:var(--mz); z-index:3; cursor:pointer; touch-action:none; }
  .lch-mon.l { left:4%; } .lch-mon.r { right:4%; }
  .lch-mon > * { position:absolute; box-sizing:border-box; pointer-events:none; }
  .lch-body { left:6%; right:6%; top:4%; bottom:0; background:var(--c); border:4px solid #111; border-radius:50% 50% 40% 40%; transition:transform .3s; transform-origin:50% 100%; }
  .lch-mon .lch-body { transform:scaleX(calc(1 + var(--fat, 0) * .05)); }
  .lch-eye { top:12%; width:22%; aspect-ratio:1; background:#fff; border:3px solid #111; border-radius:50%; overflow:hidden; z-index:2; }
  .lch-eye.l { left:24%; } .lch-eye.r { right:24%; width:18%; top:14%; }
  .lch-eye i { position:absolute; left:28%; top:30%; width:46%; aspect-ratio:1; background:#111; border-radius:50%; animation:lch-roll 1.2s ease-in-out infinite alternate; }
  .lch-mouth { left:30%; right:30%; top:34%; height:14%; background:#5a0f1e; border:3px solid #111; border-radius:30% 30% 50% 50%; z-index:2; }
  .lch-mon.chomp .lch-mouth { animation:lch-chomp .12s ease-in-out 6 alternate; }
  .lch-mon.eww .lch-mouth { border-radius:50%; left:38%; right:38%; }
  .lch-mon.eww .lch-body { background:#a8d68a; }
  .lch-mon.eww { animation:lch-shake .08s linear 6 alternate; }
  .lch-bib { left:20%; right:20%; top:54%; bottom:8%; background:#fff; border:3px solid #111; border-radius:6px 6px 40% 40%; z-index:3;
    display:flex; align-items:center; justify-content:center; font-weight:900; color:#111; line-height:1; white-space:nowrap; }
  .lch-mon.hint .lch-bib { box-shadow:0 0 0 4px #fff, 0 0 0 8px #00b86b; }
  .lch-splat { position:absolute; z-index:9; border-radius:46% 54% 40% 60% / 50% 40% 60% 50%; border:3px solid #111; pointer-events:none; }
  .lch-fx { position:absolute; inset:0; pointer-events:none; z-index:8; overflow:visible; }
  .lch-word { position:absolute; transform:translate(-50%, -50%) rotate(-8deg); font-size:1.9rem; color:#ffd400; -webkit-text-stroke:2px #111; paint-order:stroke fill;
    text-shadow:0 4px 0 #111; white-space:nowrap; animation:lch-word 1s ease-out forwards; }
  .lch-word.bad { color:#8fd16a; }
  @keyframes lch-nudge { to { translate:-8px 0; } }
  @keyframes lch-roll { from { transform:translate(-25%, -15%); } to { transform:translate(25%, 15%); } }
  @keyframes lch-chomp { to { transform:scaleY(.3); } }
  @keyframes lch-shake { from { rotate:-5deg; } to { rotate:5deg; } }
  @keyframes lch-word { from { opacity:1; scale:.5; } 25% { scale:1.15; } 75% { opacity:1; } to { opacity:0; translate:0 -40px; } }
  @media (prefers-reduced-motion: reduce) { .lch-arrow, .lch-eye i, .lch-mon.chomp .lch-mouth, .lch-mon.eww, .lch-word { animation:none !important; } }
  `;
  function injectCss() { if (document.getElementById("lch-css")) return; const s = document.createElement("style"); s.id = "lch-css"; s.textContent = CSS; document.head.appendChild(s); }

  registerMicrogame({
    id: "lunch-lady",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 18000,
    input: "slice",
    tutorial: true,

    start(ctx) {
      injectCss();
      const speed = ctx.speed || 1;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const { tone, sweep, noise } = ctx.sfx;
      const G = ctx.sortSets(speed >= 1.5 ? 8 : 6);
      const queue = G.items.slice();

      const wrap = document.createElement("div");
      wrap.className = "lch";
      wrap.innerHTML = `<div class="lch-top"><span class="lch-left">🍱 <b>${queue.length}</b></span><div class="lch-pips">${'<span class="lch-pip"></span>'.repeat(MISSES)}</div></div>`;
      const room = document.createElement("div");
      room.className = "lch-room";
      room.innerHTML = '<div class="lch-table"></div><div class="lch-hatch"></div><div class="lch-arrow l">◀</div><div class="lch-arrow r">▶</div>';
      const mons = G.bins.map((b, i) => {
        const el = document.createElement("div");
        el.className = `lch-mon ${i ? "r" : "l"}`;
        el.style.setProperty("--c", i ? "#c04dd9" : "#ff8a1f");
        el.setAttribute("aria-label", TEXT.monLabel(b.say));
        el.innerHTML = '<div class="lch-body"></div><div class="lch-eye l"><i></i></div><div class="lch-eye r"><i></i></div><div class="lch-mouth"></div><div class="lch-bib"></div>';
        el.querySelector(".lch-bib").textContent = b.text;
        room.appendChild(el);
        el.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); send(i); });
        return { el, fat: 0 };
      });
      const tray = document.createElement("div");
      tray.className = "lch-tray";
      const fx = document.createElement("div");
      fx.className = "lch-fx";
      room.append(tray, fx);
      wrap.appendChild(room);
      ctx.root.appendChild(wrap);
      const leftEl = wrap.querySelector(".lch-left b"), missPips = wrap.querySelector(".lch-pips").children;

      let W = 0, H = 0, tz = 100, mz = 130;
      function layout() {
        W = room.clientWidth; H = room.clientHeight;
        tz = Math.max(76, Math.min(W * 0.26, H * 0.26, 140));
        mz = Math.max(100, Math.min(W * 0.3, H * 0.44, 190));
        room.style.setProperty("--tz", `${tz}px`); room.style.setProperty("--mz", `${mz}px`);
        mons.forEach((m, i) => { m.el.querySelector(".lch-bib").style.fontSize = `${Math.min(mz * 0.22, (mz * 0.5) / ([...G.bins[i].text].length * 0.62))}px`; });
        if (cur) dress();
        if (cur && !busy) tray.style.transform = `translateY(${restY()}px)`;
      }
      const restY = () => H * 0.64 - tz * 0.7 - 6;

      let cur = null, done = false, busy = true, missN = 0, fed = 0;
      function dress() {
        const b = tray.querySelector("b"), i = tray.querySelector("i");
        b.textContent = cur.text;
        b.style.fontSize = `${cur.kind === "pic" ? tz * 0.34 : Math.min(tz * 0.3, (tz * 0.84) / ([...cur.text].length * 0.62))}px`;
        i.textContent = cur.kind === "word" && cur.pic ? cur.pic : "";
        i.style.fontSize = `${tz * 0.2}px`;
      }
      function next() {
        cur = queue.shift();
        if (!cur) return;
        tray.innerHTML = "<b></b><i></i>";
        dress();
        tray.style.opacity = "1";
        tray.animate([{ transform: `translateY(${H * 0.05}px) scale(.4)`, opacity: 0 }, { transform: `translateY(${restY()}px)`, opacity: 1 }], { duration: reduceMotion ? 1 : 420, easing: "ease-out", fill: "forwards" });
        tone(523, 0.05, "triangle", 0.05);   // ding! order up
        ctx.later(() => { busy = false; if (cur && cur.kind !== "letter") ctx.say(cur.spoken); }, reduceMotion ? 10 : 430);
      }
      function send(i) {
        if (done || busy || ctx.ended || !cur) return;
        busy = true;
        const m = mons[i], mr = m.el.getBoundingClientRect(), rr = room.getBoundingClientRect();
        const dx = mr.left - rr.left + mr.width / 2 - W / 2, dy = mr.top - rr.top + mr.height * 0.4 - restY() - tz * 0.35;
        tray.animate([{ transform: `translateY(${restY()}px)` }, { transform: `translate(${dx}px, ${restY() + dy}px) scale(.55) rotate(${i ? 25 : -25}deg)` }], { duration: reduceMotion ? 1 : 360, easing: "ease-in", fill: "forwards" });
        sweep(500, 900, 0.15, "triangle", 0.06);
        ctx.later(() => { if (cur.bin === i) chomp(m, i); else eww(m, i, dx, dy); }, reduceMotion ? 10 : 370);
      }
      function chomp(m, i) {
        tray.style.opacity = "0";
        m.el.classList.remove("chomp"); void m.el.offsetWidth; m.el.classList.add("chomp");
        m.fat++; m.el.style.setProperty("--fat", m.fat);
        [0, 0.12, 0.24].forEach((t) => noise(0.06, "lowpass", 700, 300, 0.3, t));   // nom nom nom
        word(TEXT.yum[fed % TEXT.yum.length], false, i ? W * 0.78 : W * 0.22, H * 0.18);
        fed++;
        leftEl.textContent = queue.length;
        if (!queue.length) { done = true; ctx.win(); full(); return; }
        ctx.later(next, 250);
      }
      // A wrong tray: EWW! The monster flings the food back and it splats on the screen.
      function eww(m, i, dx, dy) {
        m.el.classList.remove("eww"); void m.el.offsetWidth; m.el.classList.add("eww");
        sweep(700, 250, 0.4, "square", 0.07); noise(0.2, "lowpass", 500, 200, 0.3, 0.15);
        word(TEXT.eww, true, i ? W * 0.78 : W * 0.22, H * 0.18);
        if (cur.kind !== "letter") ctx.say(cur.spoken);
        if (!reduceMotion) for (let k = 0; k < 3; k++) {
          const s = document.createElement("div");
          s.className = "lch-splat";
          const z = 30 + Math.random() * 40;
          s.style.width = `${z}px`; s.style.height = `${z * 0.8}px`; s.style.background = SPLATS[k % SPLATS.length];
          s.style.left = `${W * (0.3 + Math.random() * 0.4)}px`; s.style.top = `${H * (0.15 + Math.random() * 0.4)}px`;
          fx.appendChild(s);
          s.animate([{ transform: "scale(0)" }, { transform: "scale(1.2)", offset: 0.3 }, { transform: "scale(1)", offset: 0.4 }, { transform: "scale(1)", opacity: 1, offset: 0.8 }, { opacity: 0 }], { duration: 1200, fill: "forwards" });
          ctx.later(() => s.remove(), 1250);
        }
        missPips[missN].classList.add("x");
        missN++;
        tray.animate([{ transform: `translate(${dx}px, ${restY() + dy}px) scale(.55)` }, { transform: `translateY(${restY()}px)` }], { duration: reduceMotion ? 1 : 450, easing: "ease-out", fill: "forwards" });
        ctx.later(() => m.el.classList.remove("eww"), 600);
        if (missN >= MISSES) { done = true; ctx.lose(); ctx.later(showAnswer, 500); return; }
        ctx.later(() => { busy = false; }, 470);
      }
      function full() {
        [523, 659, 784, 1047].forEach((f, k) => tone(f, 0.12, "triangle", 0.1, 0.2 + k * 0.08));
        word(TEXT.full, false, W / 2, H * 0.34);
        ctx.confetti(fx, W / 2, H * 0.4, { count: 80 });
        ctx.later(() => sweep(200, 120, 0.4, "sawtooth", 0.08), 500);   // a big burp
      }
      function showAnswer() { if (cur) mons[cur.bin].el.classList.add("hint"); }
      function word(text, bad, x, y) {
        const w = document.createElement("div");
        w.className = "lch-word" + (bad ? " bad" : "");
        w.textContent = text;
        w.style.left = `${Math.max(80, Math.min(W - 80, x))}px`; w.style.top = `${Math.max(26, y)}px`;
        fx.appendChild(w);
        ctx.later(() => w.remove(), 1000);
      }

      let start = null;
      room.addEventListener("pointerdown", (e) => { e.preventDefault(); start = { x: e.clientX, y: e.clientY }; });
      room.addEventListener("pointermove", (e) => {
        if (!start) return;
        const dx = e.clientX - start.x;
        if (Math.abs(dx) > 30) { start = null; send(dx < 0 ? 0 : 1); }
      });
      room.addEventListener("pointerup", () => { start = null; });
      function onKey(e) {
        if (e.key === "ArrowLeft") { e.preventDefault(); send(0); } else if (e.key === "ArrowRight") { e.preventDefault(); send(1); }
        else if (e.key === " ") { e.preventDefault(); if (cur) ctx.say(cur.spoken); }
      }
      document.addEventListener("keydown", onKey);

      ctx.onTimeout(() => { done = true; showAnswer(); });

      layout();
      const ro = new ResizeObserver(layout);
      ro.observe(room);
      ctx.say(`${G.bins[0].say}, ${G.bins[1].say}`);
      ctx.later(next, 300);
      ctx.later(() => ctx.hint({ x: room.offsetLeft + W * 0.5, y: room.offsetTop + H * 0.8 }, { x: room.offsetLeft + W * 0.3, y: room.offsetTop + H * 0.8 }, { small: true }), 900);

      // Tutorial: tap the monster that eats each tray.
      ctx.tutorial(null, async (f) => {
        for (let n = 0; n < G.items.length && !done; n++) {
          await f.until(() => !busy && cur, 3000);
          const c = cur;
          await f.tap(mons[c.bin].el);
          await f.until(() => cur !== c || done, 2000);
        }
      });
      return () => { done = true; ro.disconnect(); document.removeEventListener("keydown", onKey); };
    },
  });
})();
