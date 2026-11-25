// POST OFFICE — a quick-sort game (Claude's idea, named by the teacher; groups from `ctx.sortSets`). Two delivery
// vans wait at the bottom, one each side, each with a label (B and D; -at and -ig…). Parcels come down the belt one
// at a time, each with a letter, picture or word. Flick the parcel left or right (or tap a van, or ← →): the right
// van catches it (BEEP BEEP!); a wrong van HONKs and spits it back onto the belt, ✕. Sort every parcel to win:
// the vans drive off. 3 honks lose. Great for b/d, B/V, L/R.
(function () {
  const TEXT = {
    name: { en: "Post Office" },
    icon: "📦",
    howTo: { en: {
      steps: [
        ["🚚", "Look at the two vans. Each one takes a different letter."],
        ["📦", "A parcel comes down. Flick it to the van it belongs in (or tap the van)."],
        ["✅", "Sort all the parcels!"],
      ],
      tips: ["The wrong van HONKS and spits the parcel back. Three honks and it's over.", "Arrow keys work too.", "When the game speeds up, there are more parcels."],
    } },
    instruction: { en: "SORT THE\nPARCELS!" },
    vanLabel: (t) => `Van for ${t}`,
    beep: ["BEEP BEEP!", "THANKS!", "IN YOU GO!"],
    honk: "HONK!",
    bye: "DELIVERY TIME!",
  };
  const MISSES = 3;

  const CSS = `
  .pst { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:6px; padding-bottom:6px; }
  .pst-top { flex:none; display:flex; gap:12px; align-items:center; min-height:28px; }
  .pst-left { font-size:1.1rem; padding:2px 10px; background:#fff; border:3px solid #111; border-radius:99px; }
  .pst-pips { display:flex; gap:5px; }
  .pst-pip { width:24px; height:24px; border:3px solid #111; border-radius:50%; background:#fff; }
  .pst-pip.x { background:#ff5a6e; } .pst-pip.x::after { content:"✕"; display:block; text-align:center; color:#fff; font-weight:900; font-size:14px; line-height:18px; }
  .pst-room { position:relative; flex:1; min-height:0; width:100%; max-width:620px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111;
    background:linear-gradient(180deg, #ffe9c2 0 62%, #9aa3b5 62%); touch-action:none; }
  .pst-room::before { content:"📮"; position:absolute; left:5%; top:5%; font-size:2rem; }
  .pst-belt { position:absolute; left:50%; top:0; width:var(--pz); height:62%; margin-left:calc(var(--pz) / -2); background:repeating-linear-gradient(0deg, #444 0 16px, #555 16px 32px);
    border-left:5px solid #111; border-right:5px solid #111; animation:pst-belt .6s linear infinite; }
  .pst-arrow { position:absolute; top:44%; font-size:2.4rem; color:rgba(0,0,0,.25); font-weight:900; animation:pst-nudge .6s ease-in-out infinite alternate; }
  .pst-arrow.l { left:24%; } .pst-arrow.r { right:24%; animation-direction:alternate-reverse; }
  /* A parcel (--pz): a brown box with tape and a label */
  .pst-parcel { position:absolute; left:50%; top:0; width:var(--pz); height:calc(var(--pz) * .86); margin-left:calc(var(--pz) / -2); z-index:4; pointer-events:none;
    background:linear-gradient(90deg, transparent 44%, #e0b86a 44% 56%, transparent 56%), #c98a4b; border:4px solid #111; border-radius:8px; box-shadow:0 5px 0 rgba(0,0,0,.3);
    display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; }
  .pst-parcel b { padding:2px 8px; background:#fff; border:3px solid #111; border-radius:8px; font-weight:900; color:#111; line-height:1.1; white-space:nowrap; }
  .pst-parcel i { font-style:normal; line-height:1; }
  /* A van (--vz): a red body with a label on the side, a windscreen, wheels, a little face */
  .pst-van { position:absolute; bottom:4%; width:var(--vz); height:calc(var(--vz) * .7); z-index:3; cursor:pointer; touch-action:none; }
  .pst-van > * { position:absolute; box-sizing:border-box; pointer-events:none; }
  .pst-van.l { left:3%; } .pst-van.r { right:3%; }
  .pst-body { left:0; right:22%; top:0; bottom:18%; background:var(--c); border:4px solid #111; border-radius:10px 4px 6px 6px; }
  .pst-cab { right:0; width:28%; top:22%; bottom:18%; background:var(--c); border:4px solid #111; border-radius:4px 16px 6px 4px; }
  .pst-van.l .pst-body { left:22%; right:0; border-radius:4px 10px 6px 6px; } .pst-van.l .pst-cab { left:0; right:auto; border-radius:16px 4px 4px 6px; }
  .pst-win { right:4%; width:18%; top:30%; height:24%; background:#bfe9ff; border:3px solid #111; border-radius:4px 10px 4px 4px; z-index:2; }
  .pst-van.l .pst-win { left:4%; right:auto; border-radius:10px 4px 4px 4px; }
  .pst-eye { top:36%; width:9%; aspect-ratio:1; background:#111; border-radius:50%; z-index:3; } .pst-eye.a { right:13%; } .pst-eye.b { right:7%; }
  .pst-van.l .pst-eye.a { left:7%; right:auto; } .pst-van.l .pst-eye.b { left:13%; right:auto; }
  .pst-wheel { bottom:0; width:24%; aspect-ratio:1; background:radial-gradient(circle, #bbb 0 25%, #222 27%); border:3px solid #111; border-radius:50%; }
  .pst-wheel.a { left:10%; } .pst-wheel.b { right:10%; }
  .pst-tag { left:22%; right:30%; top:12%; bottom:30%; background:#fff; border:3px solid #111; border-radius:8px; display:flex; align-items:center; justify-content:center;
    font-weight:900; color:#111; line-height:1; white-space:nowrap; z-index:2; }
  .pst-van.l .pst-tag { left:30%; right:6%; }
  .pst-van.hop { animation:pst-hop .25s ease-in-out 2 alternate; }
  .pst-van.honk { animation:pst-shake .08s linear 6 alternate; }
  .pst-van.go { transition:transform 1s ease-in; }
  .pst-fx { position:absolute; inset:0; pointer-events:none; z-index:8; overflow:visible; }
  .pst-word { position:absolute; transform:translate(-50%, -50%) rotate(-8deg); font-size:1.9rem; color:#ffd400; -webkit-text-stroke:2px #111; paint-order:stroke fill;
    text-shadow:0 4px 0 #111; white-space:nowrap; animation:pst-word 1s ease-out forwards; }
  .pst-word.bad { color:#ff5a6e; }
  @keyframes pst-belt { to { background-position:0 32px; } }
  @keyframes pst-nudge { to { translate:-8px 0; } }
  @keyframes pst-hop { to { translate:0 -10%; } }
  @keyframes pst-shake { from { rotate:-4deg; } to { rotate:4deg; } }
  @keyframes pst-word { from { opacity:1; scale:.5; } 25% { scale:1.15; } 75% { opacity:1; } to { opacity:0; translate:0 -40px; } }
  @media (prefers-reduced-motion: reduce) { .pst-belt, .pst-arrow, .pst-van.hop, .pst-van.honk, .pst-word { animation:none !important; } }
  `;
  function injectCss() { if (document.getElementById("pst-css")) return; const s = document.createElement("style"); s.id = "pst-css"; s.textContent = CSS; document.head.appendChild(s); }

  registerMicrogame({
    id: "post-office",
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
      wrap.className = "pst";
      wrap.innerHTML = `<div class="pst-top"><span class="pst-left">📦 <b>${queue.length}</b></span><div class="pst-pips">${'<span class="pst-pip"></span>'.repeat(MISSES)}</div></div>`;
      const room = document.createElement("div");
      room.className = "pst-room";
      room.innerHTML = '<div class="pst-belt"></div><div class="pst-arrow l">◀</div><div class="pst-arrow r">▶</div>';
      const vans = G.bins.map((b, i) => {
        const el = document.createElement("div");
        el.className = `pst-van ${i ? "r" : "l"}`;
        el.style.setProperty("--c", i ? "#3d8bfd" : "#e8173c");
        el.setAttribute("aria-label", TEXT.vanLabel(b.say));
        el.innerHTML = '<div class="pst-body"></div><div class="pst-cab"></div><div class="pst-win"></div><div class="pst-eye a"></div><div class="pst-eye b"></div><div class="pst-wheel a"></div><div class="pst-wheel b"></div><div class="pst-tag"></div>';
        el.querySelector(".pst-tag").textContent = b.text;
        room.appendChild(el);
        el.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); send(i); });
        return el;
      });
      const parcel = document.createElement("div");
      parcel.className = "pst-parcel";
      const fx = document.createElement("div");
      fx.className = "pst-fx";
      room.append(parcel, fx);
      wrap.appendChild(room);
      ctx.root.appendChild(wrap);
      const leftEl = wrap.querySelector(".pst-left b"), missPips = wrap.querySelector(".pst-pips").children;

      let W = 0, H = 0, pz = 90, vz = 150;
      function layout() {
        W = room.clientWidth; H = room.clientHeight;
        pz = Math.max(70, Math.min(W * 0.24, H * 0.26, 130));
        vz = Math.max(110, Math.min(W * 0.38, H * 0.42, 220));
        room.style.setProperty("--pz", `${pz}px`); room.style.setProperty("--vz", `${vz}px`);
        vans.forEach((v, i) => { const tag = v.querySelector(".pst-tag"); tag.style.fontSize = `${Math.min(vz * 0.2, (vz * 0.44) / ([...G.bins[i].text].length * 0.62))}px`; });
        if (cur) dress();
        if (cur && !busy) parcel.style.transform = `translateY(${restY()}px)`;
      }
      const restY = () => H * 0.62 - pz * 0.86 - 10;

      // ---------- Parcels ----------
      let cur = null, done = false, busy = true, missN = 0, sorted = 0;
      function dress() {
        const b = parcel.querySelector("b"), i = parcel.querySelector("i");
        b.textContent = cur.text;
        b.style.fontSize = `${cur.kind === "pic" ? pz * 0.36 : Math.min(pz * 0.34, (pz * 0.84) / ([...cur.text].length * 0.62))}px`;
        i.textContent = cur.kind === "word" && cur.pic ? cur.pic : "";
        i.style.fontSize = `${pz * 0.22}px`;
      }
      function next() {
        cur = queue.shift();
        if (!cur) return;
        parcel.innerHTML = "<b></b><i></i>";
        dress();
        parcel.style.opacity = "1";
        parcel.animate([{ transform: `translateY(${-pz}px)` }, { transform: `translateY(${restY()}px)` }], { duration: reduceMotion ? 1 : 450, easing: "ease-out", fill: "forwards" });
        tone(330, 0.05, "triangle", 0.05);
        ctx.later(() => { busy = false; if (cur && cur.kind !== "letter") ctx.say(cur.spoken); }, reduceMotion ? 10 : 460);
      }
      // Into a van (i: 0 left, 1 right).
      function send(i) {
        if (done || busy || ctx.ended || !cur) return;
        busy = true;
        const v = vans[i], vr = v.getBoundingClientRect(), rr = room.getBoundingClientRect();
        const dx = vr.left - rr.left + vr.width / 2 - W / 2, dy = vr.top - rr.top + vr.height * 0.3 - restY() - pz * 0.4;
        const fly = parcel.animate([{ transform: `translateY(${restY()}px)` }, { transform: `translate(${dx * 0.6}px, ${restY() - pz * 0.4}px) rotate(${i ? 20 : -20}deg)`, offset: 0.4 },
          { transform: `translate(${dx}px, ${restY() + dy}px) scale(.5) rotate(${i ? 40 : -40}deg)` }], { duration: reduceMotion ? 1 : 420, easing: "ease-in", fill: "forwards" });
        sweep(500, 900, 0.15, "triangle", 0.06);
        ctx.later(() => { void fly; if (cur.bin === i) caught(v); else honk(v, dx, dy, i); }, reduceMotion ? 10 : 430);
      }
      function caught(v) {
        parcel.style.opacity = "0";
        v.classList.remove("hop"); void v.offsetWidth; v.classList.add("hop");
        tone(880, 0.07, "square", 0.07); tone(880, 0.07, "square", 0.07, 0.12);   // beep beep
        word(TEXT.beep[sorted % TEXT.beep.length], false, v === vans[0] ? W * 0.22 : W * 0.78, H * 0.5);
        sorted++;
        leftEl.textContent = queue.length;
        if (!queue.length) { done = true; ctx.win(); driveOff(); return; }
        ctx.later(next, 200);
      }
      function honk(v, dx, dy, i) {
        v.classList.remove("honk"); void v.offsetWidth; v.classList.add("honk");
        sweep(260, 220, 0.35, "sawtooth", 0.12); tone(330, 0.3, "square", 0.06);   // HONK
        word(TEXT.honk, true, i ? W * 0.78 : W * 0.22, H * 0.5);
        if (cur.kind !== "letter") ctx.say(cur.spoken);
        missPips[missN].classList.add("x");
        missN++;
        // Spat back out onto the belt.
        parcel.animate([{ transform: `translate(${dx}px, ${restY() + dy}px) scale(.5)` }, { transform: `translate(${dx * 0.5}px, ${restY() - pz * 0.6}px) rotate(${i ? -30 : 30}deg)`, offset: 0.5 }, { transform: `translateY(${restY()}px)` }],
          { duration: reduceMotion ? 1 : 500, easing: "ease-out", fill: "forwards" });
        if (missN >= MISSES) { done = true; ctx.lose(); ctx.later(showAnswer, 520); return; }
        ctx.later(() => { busy = false; }, 520);
      }
      function driveOff() {
        [523, 659, 784, 1047].forEach((f, k) => tone(f, 0.12, "triangle", 0.1, 0.2 + k * 0.08));
        word(TEXT.bye, false, W / 2, H * 0.3);
        ctx.confetti(fx, W / 2, H * 0.4, { count: 80 });
        vans.forEach((v, k) => ctx.later(() => { v.classList.add("go"); v.style.transform = `translateX(${k ? W : -W}px)`; }, 500));
      }
      function showAnswer() { if (cur) { vans[cur.bin].classList.add("hop"); word("👉", false, cur.bin ? W * 0.62 : W * 0.38, H * 0.45); } }
      function word(text, bad, x, y) {
        const w = document.createElement("div");
        w.className = "pst-word" + (bad ? " bad" : "");
        w.textContent = text;
        w.style.left = `${Math.max(80, Math.min(W - 80, x))}px`; w.style.top = `${Math.max(26, y)}px`;
        fx.appendChild(w);
        ctx.later(() => w.remove(), 1000);
      }

      // ---------- Flicking ----------
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
      ctx.later(() => ctx.hint({ x: room.offsetLeft + W * 0.5, y: room.offsetTop + H * 0.72 }, { x: room.offsetLeft + W * 0.26, y: room.offsetTop + H * 0.72 }, { small: true }), 900);

      // Tutorial: tap the right van for each parcel.
      ctx.tutorial(null, async (f) => {   // (no single answer item: the child's round gets a new pair of groups anyway)
        for (let n = 0; n < G.items.length && !done; n++) {
          await f.until(() => !busy && cur, 3000);
          const c = cur;
          await f.tap(vans[c.bin]);
          await f.until(() => cur !== c || done, 2000);
        }
      });
      return () => { done = true; ro.disconnect(); document.removeEventListener("keydown", onKey); };
    },
  });
})();
