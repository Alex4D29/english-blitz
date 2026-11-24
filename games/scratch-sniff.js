// SCRATCH 'N' SNIFF — a rub game (Claude's idea, named by the teacher; like Fossil Dig: rub to choose). A sniffy
// monster with a GIANT pink nose sits beside the card. Below, a sheet of scratch-and-sniff stickers, each with an
// answer. Rub a sticker (a fingernail follows the finger, a ring fills up): the right one smells lovely: flowers
// drift up to the nose and the monster goes MMMM! A wrong one is a stinky sticker: a green cloud, the nose
// shrivels (PEE-YEW!), and that sticker is used up; it only costs time.
(function () {
  const TEXT = {
    name: { en: "Scratch 'n' Sniff" },
    icon: "👃",
    howTo: { en: {
      steps: [
        ["👀", "Look at the card."],
        ["👆", "Rub the sticker with the same thing: back and forth, back and forth!"],
        ["🌸", "The right one smells lovely. MMMM!"],
      ],
      tips: ["A wrong sticker is STINKY! Try another one, quick.", "Tap the card or the monster to hear it again.", "When the game speeds up, there are 6 stickers."],
    } },
    instruction: { en: "SCRATCH\n'N' SNIFF!" },
    cardLabel: "The card. Tap to hear it again.",
    mmm: "MMMM!",
    stinky: "PEE-YEW!",
    rub: "RUB!",
  };
  const NEED = 6;   // sticker diameters of rubbing to finish one (about a second and a half of quick rubbing)
  const STICK = ["#ff8fb8", "#8fd3ff", "#ffe066", "#a8e6a1", "#d2b3ff", "#ffb36b"];

  const CSS = `
  .snf { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:6px; padding-bottom:6px; }
  .snf-top { flex:none; display:flex; align-items:flex-end; gap:12px; height:var(--az); }
  .snf-card { padding:4px 14px; background:#fff; border:5px solid #111; border-radius:16px; box-shadow:0 5px 0 #111; font:inherit; color:#111; font-size:clamp(1.8rem, 8vw, 2.8rem);
    line-height:1.05; cursor:pointer; touch-action:manipulation; display:flex; align-items:center; gap:6px; white-space:nowrap; margin-bottom:6px; }
  .snf-card .spk { font-size:.45em; }
  /* The sniffer (--az): a round yellow monster, googly eyes, and a GIANT pink nose */
  .snf-mon { position:relative; width:var(--az); height:var(--az); cursor:pointer; }
  .snf-mon > * { position:absolute; box-sizing:border-box; }
  .snf-head { left:6%; right:6%; top:8%; bottom:0; background:#ffd84d; border:4px solid #111; border-radius:50% 50% 44% 44%; }
  .snf-eye { top:18%; width:22%; aspect-ratio:1; background:#fff; border:3px solid #111; border-radius:50%; overflow:hidden; z-index:2; }
  .snf-eye.l { left:22%; } .snf-eye.r { right:22%; width:18%; top:21%; }
  .snf-eye i { position:absolute; left:28%; top:30%; width:46%; aspect-ratio:1; background:#111; border-radius:50%; animation:snf-roll 1.2s ease-in-out infinite alternate; }
  .snf-nose { left:30%; right:30%; top:40%; height:34%; z-index:3; background:radial-gradient(circle at 34% 30%, #fff 0 10%, transparent 11%), #ff7aa8; border:4px solid #111;
    border-radius:50% 50% 46% 46%; animation:snf-sniff .5s ease-in-out infinite alternate; transform-origin:50% 20%; transition:background .2s; }
  .snf-nose::before, .snf-nose::after { content:""; position:absolute; bottom:12%; width:18%; height:22%; background:#5a0f1e; border-radius:50%; }
  .snf-nose::before { left:22%; } .snf-nose::after { right:22%; }
  .snf-mouth { left:40%; right:40%; top:80%; height:9%; background:#5a0f1e; border:3px solid #111; border-radius:0 0 50% 50%; z-index:2; }
  .snf-mon.happy .snf-nose { animation:snf-sniff .18s ease-in-out infinite alternate; background:radial-gradient(circle at 34% 30%, #fff 0 10%, transparent 11%), #ff4f8b; }
  .snf-mon.happy .snf-eye i { height:16%; top:44%; border-radius:99px; animation:none; }
  .snf-mon.yuck .snf-nose { animation:none; transform:scale(.62) rotate(8deg); background:#8fd16a; }
  .snf-mon.yuck .snf-head { background:#c9e27a; }
  .snf-mon.yuck .snf-eye i { animation:snf-dizzy .4s linear infinite; }
  /* The sticker sheet */
  .snf-sheet { position:relative; flex:1; min-height:0; width:100%; max-width:600px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111;
    background:#fffdf4; background-image:linear-gradient(rgba(0,0,0,.04) 1px, transparent 1px); background-size:100% 26px; touch-action:none; }
  .snf-sheet::before { content:""; position:absolute; inset:10px; border:3px dashed #c9b79a; border-radius:12px; pointer-events:none; }
  .snf-stk { position:absolute; width:var(--sz); height:var(--sz); margin:calc(var(--sz) / -2) 0 0 calc(var(--sz) / -2); border-radius:50%; border:4px solid #111;
    background:radial-gradient(circle, var(--c) 0 58%, #fff 59% 64%, var(--c) 65%); box-shadow:0 5px 0 #111; display:flex; align-items:center; justify-content:center; }
  .snf-stk b { position:relative; z-index:2; padding:1px 6px; background:#fff; border:3px solid #111; border-radius:10px; font-size:calc(var(--sz) * .32); line-height:1.1; white-space:nowrap; color:#111; }
  /* The scratch ring: fills as you rub */
  .snf-stk::after { content:""; position:absolute; inset:-10px; border-radius:50%; background:conic-gradient(#ffd400 calc(var(--p, 0) * 360deg), transparent 0);
    -webkit-mask:radial-gradient(closest-side, transparent 84%, #000 86%); mask:radial-gradient(closest-side, transparent 84%, #000 86%); }
  .snf-stk.rub { animation:snf-jiggle .08s linear infinite alternate; }
  .snf-stk.used { filter:grayscale(1) brightness(.85); opacity:.55; }
  .snf-stk.right { box-shadow:0 0 0 6px #fff, 0 0 0 11px #00b86b; }
  .snf-nail { position:absolute; left:0; top:0; z-index:6; font-size:2.2rem; line-height:1; pointer-events:none; opacity:0; transform-origin:30% 80%; }
  .snf-nail.on { opacity:1; }
  .snf-fx { position:absolute; inset:0; pointer-events:none; z-index:7; overflow:visible; }
  .snf-pop { position:absolute; line-height:1; transform:translate(-50%, -50%); pointer-events:none; }
  .snf-cloud { position:absolute; border-radius:50%; background:radial-gradient(circle, rgba(143,209,106,.9) 0 40%, rgba(143,209,106,0) 70%); pointer-events:none; }
  .snf-word { position:absolute; transform:translate(-50%, -50%) rotate(-8deg); font-size:2rem; color:#ff7aa8; -webkit-text-stroke:2px #111; paint-order:stroke fill;
    text-shadow:0 4px 0 #111; white-space:nowrap; animation:snf-word 1s ease-out forwards; z-index:9; }
  .snf-word.bad { color:#8fd16a; }
  @keyframes snf-roll { from { transform:translate(-25%, -15%); } to { transform:translate(25%, 15%); } }
  @keyframes snf-dizzy { from { transform:rotate(0) translateX(25%); } to { transform:rotate(360deg) translateX(25%); } }
  @keyframes snf-sniff { from { transform:scale(1); } to { transform:scale(1.08, .94); } }
  @keyframes snf-jiggle { from { translate:-2px 0; } to { translate:2px 0; } }
  @keyframes snf-word { from { opacity:1; scale:.5; } 25% { scale:1.15; } 75% { opacity:1; } to { opacity:0; translate:0 -40px; } }
  @media (prefers-reduced-motion: reduce) { .snf-eye i, .snf-nose, .snf-stk.rub, .snf-word { animation:none !important; } }
  `;
  function injectCss() { if (document.getElementById("snf-css")) return; const s = document.createElement("style"); s.id = "snf-css"; s.textContent = CSS; document.head.appendChild(s); }

  registerMicrogame({
    id: "scratch-sniff",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 11000,
    input: "drag",
    tutorial: true,

    start(ctx) {
      injectCss();
      const speed = ctx.speed || 1;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const { tone, sweep, noise } = ctx.sfx;
      const N = speed >= 1.5 ? 6 : 4;
      const C = ctx.choiceRows(1, N, { lowercase: true });

      const wrap = document.createElement("div");
      wrap.className = "snf";
      const top = document.createElement("div");
      top.className = "snf-top";
      const mon = document.createElement("div");
      mon.className = "snf-mon";
      mon.innerHTML = '<div class="snf-head"></div><div class="snf-eye l"><i></i></div><div class="snf-eye r"><i></i></div><div class="snf-mouth"></div><div class="snf-nose"></div>';
      const card = document.createElement("button");
      card.className = "snf-card";
      card.setAttribute("aria-label", TEXT.cardLabel);
      card.innerHTML = '<span class="ct"></span>';
      card.firstChild.textContent = C.listen ? C.target.text : C.cardText;   // (always shown, sight words too: rubbing is slow)
      if (ctx.canSpeak) card.insertAdjacentHTML("beforeend", '<span class="spk">🔊</span>');
      card.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });
      mon.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });
      top.append(mon, card);
      const sheet = document.createElement("div");
      sheet.className = "snf-sheet";
      const nail = document.createElement("div");
      nail.className = "snf-nail"; nail.textContent = "☝️";
      const fx = document.createElement("div");
      fx.className = "snf-fx";
      wrap.append(top, sheet);
      ctx.root.appendChild(wrap);
      // (the clouds and flowers fly up to the nose, so the effects layer covers the whole game)
      wrap.appendChild(fx);
      fx.style.position = "absolute";

      const stickers = ctx.shuffle(C.rows[0].slice()).map((o, i) => {
        const el = document.createElement("div");
        el.className = "snf-stk";
        el.style.setProperty("--c", STICK[i % STICK.length]);
        el.innerHTML = "<b></b>";
        el.firstChild.textContent = o.text;
        sheet.appendChild(el);
        return { o, el, p: 0, x: 0, y: 0, done: false };
      });
      sheet.appendChild(nail);

      let W = 0, H = 0, sz = 100;
      function layout() {
        W = sheet.clientWidth; H = sheet.clientHeight;
        const cols = N === 6 ? 3 : 2, rows = 2;
        sz = Math.max(70, Math.min((W - 30) / cols - 26, (H - 30) / rows - 26, 160));
        sheet.style.setProperty("--sz", `${sz}px`);
        stickers.forEach((s, i) => {
          const c = i % cols, r = Math.floor(i / cols);
          s.x = W * (c + 0.5) / cols; s.y = H * (r + 0.5) / rows;
          s.el.style.left = `${s.x}px`; s.el.style.top = `${s.y}px`;
          s.el.firstChild.style.fontSize = s.o.kind === "word" ? `${Math.min(sz * 0.3, (sz * 0.86) / ([...s.o.text].length * 0.62))}px` : "";
        });
      }

      // ---------- Rubbing ----------
      let done = false, last = null, lastScratch = 0;
      const local = (e) => { const r = sheet.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
      const stickerAt = (p) => stickers.find((s) => !s.done && Math.hypot(p.x - s.x, p.y - s.y) < sz * 0.62);
      sheet.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        if (done || ctx.ended) return;
        last = local(e);
        nail.classList.add("on");
        moveNail(last);
        const s = stickerAt(last);
        if (s) rub(s, sz * 0.4);   // a tap scratches a little
      });
      sheet.addEventListener("pointermove", (e) => {
        if (!last) return;
        const p = local(e);
        const d = Math.hypot(p.x - last.x, p.y - last.y);
        last = p;
        moveNail(p);
        if (done || ctx.ended) return;
        const s = stickerAt(p);
        if (s && d > 0) rub(s, Math.min(d, sz));
      });
      const up = () => { last = null; nail.classList.remove("on"); stickers.forEach((s) => s.el.classList.remove("rub")); };
      sheet.addEventListener("pointerup", up);
      sheet.addEventListener("pointercancel", up);
      function moveNail(p) { nail.style.transform = `translate(${p.x - 12}px, ${p.y - 30}px) rotate(${Math.sin(performance.now() / 40) * 10}deg)`; }

      function rub(s, d) {
        s.p = Math.min(1, s.p + d / (sz * NEED));
        s.el.style.setProperty("--p", s.p.toFixed(3));
        stickers.forEach((x) => x.el.classList.toggle("rub", x === s));
        const now = performance.now();
        if (now - lastScratch > 70) { lastScratch = now; noise(0.05, "bandpass", 3000 + s.p * 2000, 1500, 0.2); }   // scritch
        if (s.p >= 1) sniff(s);
      }
      const nose = () => { const r = mon.querySelector(".snf-nose").getBoundingClientRect(), w = wrap.getBoundingClientRect(); return { x: r.left - w.left + r.width / 2, y: r.top - w.top + r.height / 2 }; };
      const at = (s) => { const r = s.el.getBoundingClientRect(), w = wrap.getBoundingClientRect(); return { x: r.left - w.left + r.width / 2, y: r.top - w.top + r.height / 2 }; };
      function sniff(s) {
        s.done = true;
        s.el.classList.remove("rub");
        const a = at(s), n = nose();
        if (s.o.right) {
          done = true;
          ctx.win();
          up();
          mon.classList.add("happy");
          // Flowers drift up to the nose: MMMM!
          ["🌸", "🌷", "🌼", "🌸", "🌺"].forEach((e, k) => {
            const f = document.createElement("div");
            f.className = "snf-pop"; f.textContent = e; f.style.fontSize = `${sz * 0.32}px`;
            f.style.left = `${a.x}px`; f.style.top = `${a.y}px`;
            fx.appendChild(f);
            f.animate([{ transform: "translate(-50%, -50%) scale(.3)" }, { transform: `translate(calc(-50% + ${(n.x - a.x) * 0.5 + (k - 2) * 30}px), calc(-50% + ${(n.y - a.y) * 0.5}px)) scale(1)`, offset: 0.5 },
              { transform: `translate(calc(-50% + ${n.x - a.x}px), calc(-50% + ${n.y - a.y}px)) scale(.4)`, opacity: 0 }], { duration: reduceMotion ? 1 : 1100, delay: k * 90, easing: "ease-in-out", fill: "forwards" });
          });
          ctx.later(() => {
            [0, 0.15, 0.3].forEach((t) => noise(0.12, "highpass", 2500, 800, 0.2, t));   // sniff sniff sniff
            sweep(300, 600, 0.6, "sine", 0.1, 0.4);   // mmmm
            word(TEXT.mmm, false, n.x, n.y - 20);
            ctx.confetti(fx, a.x, a.y, { count: 60 });
            ctx.say(C.answer);
          }, reduceMotion ? 10 : 700);
          return;
        }
        // A stinky sticker: a green cloud up to the nose, which shrivels. It only costs time.
        s.el.classList.add("used");
        for (let k = 0; k < 3; k++) {
          const c = document.createElement("div");
          c.className = "snf-cloud";
          const r = sz * (0.8 + k * 0.3);
          c.style.width = c.style.height = `${r}px`; c.style.left = `${a.x - r / 2}px`; c.style.top = `${a.y - r / 2}px`;
          fx.appendChild(c);
          c.animate([{ transform: "scale(.3)", opacity: 1 }, { transform: `translate(${n.x - a.x}px, ${n.y - a.y}px) scale(1.3)`, opacity: 0 }], { duration: reduceMotion ? 1 : 900, delay: k * 120, fill: "forwards" });
          ctx.later(() => c.remove(), 1200);
        }
        noise(0.5, "lowpass", 500, 200, 0.3); sweep(220, 90, 0.5, "sawtooth", 0.1, 0.1);
        ctx.later(() => {
          mon.classList.add("yuck");
          sweep(700, 300, 0.4, "square", 0.07);
          word(TEXT.stinky, true, n.x + 40, n.y);
          if (s.o.kind === "pic") ctx.say(s.o.spoken);
        }, reduceMotion ? 10 : 500);
        ctx.later(() => mon.classList.remove("yuck"), 1500);
      }
      function word(text, bad, x, y) {
        const w = document.createElement("div");
        w.className = "snf-word" + (bad ? " bad" : "");
        w.textContent = text;
        const ww = wrap.clientWidth;
        w.style.left = `${Math.max(90, Math.min(ww - 90, x))}px`; w.style.top = `${Math.max(30, y)}px`;
        fx.appendChild(w);
        ctx.later(() => w.remove(), 1000);
      }
      function replay() { if (!done) ctx.say(C.prompt); }

      ctx.onTimeout(() => { done = true; up(); stickers.forEach((s) => { if (s.o.right) { s.el.classList.add("right"); s.el.style.setProperty("--p", 0.7); } }); ctx.say(C.answer); });
      function onKey(e) {
        const i = parseInt(e.key, 10) - 1;
        if (i >= 0 && i < stickers.length && !done && !stickers[i].done) { e.preventDefault(); rub(stickers[i], sz * 3); }
        else if (e.key === " ") { e.preventDefault(); replay(); }
      }
      document.addEventListener("keydown", onKey);

      wrap.style.setProperty("--az", `${Math.max(80, Math.min(140, ctx.root.clientHeight * 0.22))}px`);
      layout();
      const ro = new ResizeObserver(layout);
      ro.observe(sheet);
      ctx.say(C.prompt);
      ctx.reveal(card);
      ctx.later(() => { const s = stickers[0]; ctx.hint({ x: W * 0.5 - sz * 0.6, y: sheet.offsetTop + H * 0.5 }, { x: W * 0.5 + sz * 0.6, y: sheet.offsetTop + H * 0.5 }, { small: true }); void s; }, 80);

      // Tutorial: point at the card, then rub the right sticker back and forth until it's done.
      ctx.tutorial(C.target, async (f) => {
        const s = stickers.find((x) => x.o.right);
        const pt = (dx) => () => {
          const rr = ctx.root.getBoundingClientRect(), sr = sheet.getBoundingClientRect();
          return { x: sr.left - rr.left + s.x + dx, y: sr.top - rr.top + s.y };
        };
        await f.point(card, 800);
        const a = pt(-sz * 0.35), b = pt(sz * 0.35);
        for (let k = 0; k < 10 && !done; k++) await f.path([a, b, a, b, a, b], 80);
      });
      return () => { done = true; ro.disconnect(); document.removeEventListener("keydown", onKey); };
    },
  });
})();
