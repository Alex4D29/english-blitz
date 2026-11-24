// FOSSIL DIG — the teacher's design. A desert dig site: an archaeologist monster (green, googly eyes behind
// round glasses, a bushy moustache, a khaki explorer's hat and a brush) stands at the top beside the card
// with the target. Stone slabs with the answers are half-buried in the sand: only their top half shows, so
// you read the shape. RUB one (back and forth, a 🖌️ follows your finger; a tap digs a little too) and the
// sand sinks as grains fly. Dig out the right one: it bursts out of the sand, FOSSIL!, bones and sparkles,
// the archaeologist cheers. Dig out a wrong one and it's JUNK (an old boot, a sock, a tin can): it only
// costs time.
(function () {
  const TEXT = {
    name: { en: "Fossil Dig" },
    icon: "🦴",
    howTo: (list) => ({ en: {
      steps: [
        list.type === "hfw" ? ["👂", "Listen to the word, like \"the\". It's on the card too."] : ["👀", "Look at the card at the top."],
        ["🏜️", "Stone fossils are buried in the sand. You can only see the top half!"],
        ["🖌️", "Find the one that matches and RUB it, back and forth, to dig it out!"],
      ],
      tips: [
        "Dig up the wrong one and it's just junk, like an old boot. Keep digging!",
        "Tap the card to hear it again.",
      ],
    } }),
    instruction: { en: "DIG FOR\nFOSSILS!" },
    cardLabel: "Hear it again",
    fossil: "FOSSIL!",
    junk: "JUNK!",
    hmm: "HMM…",
  };
  const NEED = 9;           // rubbing distance to dig one out, in slab heights
  const JUNK = ["🥾", "🧦", "🥫", "🩴", "🧸", "🔩"];
  const SLABS = ["#e9dcc3", "#ddd0b8", "#efe3cc", "#e2d4bc"];

  const CSS = `
  .fd { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:6px; padding-bottom:6px; }
  .fd-top { flex:none; display:flex; align-items:flex-end; justify-content:center; gap:10px; }
  .fd-card { min-width:84px; height:70px; padding:0 16px; margin-bottom:6px; border-radius:18px; font:inherit; font-size:2.5rem; line-height:1; background:#fff; color:#111;
    border:5px solid #111; box-shadow:0 6px 0 #111; display:flex; align-items:center; justify-content:center; gap:8px; cursor:pointer; touch-action:manipulation; }
  .fd-card .spk { font-size:1.2rem; opacity:.6; }
  /* The archaeologist (--az) */
  .fd-arch { position:relative; width:var(--az); height:var(--az); flex:none; }
  .fd-arch .in > * { position:absolute; box-sizing:border-box; }
  .fd-arch .in { position:absolute; }
  .fd-arch .in { inset:0; transform-origin:50% 100%; animation:fd-bob .9s ease-in-out infinite alternate; }
  .fd-arch.cheer .in { animation:fd-hop .3s ease-in-out infinite alternate; }
  .fd-arch.shrug .in { animation:fd-shrug .5s ease-in-out 2; }
  .fd-abody { left:18%; right:18%; top:34%; bottom:0; background:#5cc94a; border:4px solid #111; border-radius:46% 46% 30% 30%; }
  .fd-abody::after { content:""; position:absolute; left:22%; right:22%; top:30%; height:34%; background:#c9a86b; border:3px solid #111; border-radius:6px; }   /* a khaki vest pocket */
  .fd-ahead { left:16%; right:16%; top:16%; height:48%; background:#5cc94a; border:4px solid #111; border-radius:50%; z-index:1; }
  .fd-hat { left:4%; right:4%; top:0; height:30%; z-index:3; }
  .fd-hat::before { content:""; position:absolute; left:18%; right:18%; top:0; bottom:28%; background:#c9a86b; border:4px solid #111; border-radius:50% 50% 10% 10%; }
  .fd-hat::after { content:""; position:absolute; left:0; right:0; bottom:0; height:34%; background:#b08d4f; border:4px solid #111; border-radius:50%; }
  .fd-eye { top:30%; width:22%; height:22%; background:#fff; border:4px solid #111; border-radius:50%; overflow:hidden; z-index:2; box-shadow:0 0 0 3px #8a6a2f; }   /* round glasses */
  .fd-eye.l { left:26%; } .fd-eye.r { right:26%; width:19%; height:19%; top:31%; }
  .fd-eye i { position:absolute; left:28%; top:30%; width:46%; height:46%; background:#111; border-radius:50%; animation:fd-look 1.2s ease-in-out infinite alternate; }
  .fd-stache { left:32%; right:32%; top:51%; height:9%; z-index:3; background:#6b4a1f; border:3px solid #111; border-radius:50% 50% 40% 40% / 70% 70% 30% 30%; }
  .fd-amouth { left:40%; right:40%; top:58%; height:6%; z-index:2; background:#5a0f1e; border:3px solid #111; border-radius:10% 10% 50% 50%; }
  .fd-arch.cheer .fd-amouth { height:10%; }
  .fd-brush { right:0; top:46%; font-size:calc(var(--az) * .26); line-height:1; z-index:4; transform:rotate(30deg); }
  /* The dig site */
  .fd-site { position:relative; flex:1; min-height:0; width:100%; max-width:600px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111;
    background:linear-gradient(180deg, #ffd98a 0 18%, #f4c46a 18%); touch-action:none; user-select:none; -webkit-user-select:none; }
  .fd-site::before { content:""; position:absolute; left:0; right:0; top:10%; height:16%; background:radial-gradient(ellipse 30% 100% at 20% 100%, #eab35a 98%, transparent 100%),
    radial-gradient(ellipse 34% 100% at 75% 100%, #e6ad55 98%, transparent 100%); }   /* far dunes */
  .fd-sun { position:absolute; right:6%; top:2%; width:12%; aspect-ratio:1; border-radius:50%; background:#fff3a8; box-shadow:0 0 30px 10px rgba(255,240,150,.8); }
  .fd-cactus { position:absolute; font-size:2.2rem; line-height:1; bottom:4%; }
  .fd-slot { position:absolute; left:0; top:0; width:var(--sw); height:var(--sh); margin:calc(var(--sh) / -2) 0 0 calc(var(--sw) / -2); }
  .fd-slab { position:absolute; inset:0; background:var(--sc); border:5px solid #111; border-radius:22% 22% 12% 12% / 26% 26% 10% 10%;
    box-shadow:inset -8px -8px 0 rgba(0,0,0,.12); display:flex; align-items:center; justify-content:center; font-weight:900; color:#6b4a1f; line-height:1;
    text-shadow:2px 2px 0 rgba(255,255,255,.6); white-space:nowrap; transition:transform .1s; }
  .fd-slab::before { content:""; position:absolute; left:8%; top:10%; width:20%; height:12%; border-radius:50%; background:rgba(255,255,255,.35); }
  .fd-slot.dig .fd-slab { animation:fd-jiggle .1s linear infinite alternate; }
  /* The sand over it: sinks as you rub (--d: how far dug, 0..1) */
  .fd-sand { position:absolute; left:-14%; right:-14%; bottom:-8%; height:calc((1 - var(--d)) * 52% + 8%); /* (about the bottom half is buried: the top half shows) */ z-index:2;
    background:radial-gradient(ellipse 60% 26% at 50% 0, #f0bd60 98%, transparent 100%) top / 100% 40% no-repeat, linear-gradient(transparent 18%, #f0bd60 18%);
    pointer-events:none; }
  .fd-sand::after { content:""; position:absolute; inset:18% 0 0; background-image:radial-gradient(circle, rgba(140,90,30,.35) 0 2px, transparent 3px); background-size:14px 12px; }
  .fd-slot.out .fd-slab { box-shadow:0 0 0 6px #ffd400, 0 0 28px 12px #ffd400; }
  .fd-slot.answer .fd-slab { box-shadow:0 0 0 6px #ffd400, 0 0 28px 12px #ffd400; animation:fd-jiggle .25s linear infinite alternate; }
  .fd-slot.junk .fd-slab { opacity:.45; }
  .fd-pop { position:absolute; left:50%; top:30%; font-size:calc(var(--sh) * .6); line-height:1; z-index:5; transform:translate(-50%, -50%); pointer-events:none; }
  .fd-brushcur { position:absolute; left:0; top:0; font-size:44px; line-height:1; margin:-36px 0 0 -10px; z-index:8; pointer-events:none; display:none; transform-origin:20% 90%; }
  .fd-brushcur.on { display:block; animation:fd-brushing .14s ease-in-out infinite alternate; }
  .fd-grain { position:absolute; width:8px; height:8px; margin:-4px 0 0 -4px; border-radius:50%; background:#d99a3c; border:2px solid #8a5a22; z-index:6; pointer-events:none; }
  .fd-fx { position:absolute; inset:0; pointer-events:none; z-index:7; overflow:visible; }
  .fd-word { position:absolute; transform:translate(-50%, -50%) rotate(-8deg); font-size:2rem; color:#ffd400; -webkit-text-stroke:2px #111; paint-order:stroke fill;
    text-shadow:0 4px 0 #111; white-space:nowrap; pointer-events:none; animation:fd-word 1s ease-out forwards; }
  .fd-word.bad { color:#ff7a3d; }
  @keyframes fd-bob { to { transform:translateY(-4%); } }
  @keyframes fd-hop { to { transform:translateY(-16%); } }
  @keyframes fd-shrug { 50% { transform:rotate(-8deg) translateY(-4%); } }
  @keyframes fd-look { 0% { transform:translate(-30%, -10%); } 100% { transform:translate(30%, 15%); } }
  @keyframes fd-jiggle { from { translate:-2px 0; } to { translate:2px -1px; } }
  @keyframes fd-brushing { from { rotate:-25deg; } to { rotate:20deg; } }
  @keyframes fd-word { from { opacity:1; scale:.5; } 25% { scale:1.15; } 75% { opacity:1; } to { opacity:0; translate:0 -40px; } }
  @media (prefers-reduced-motion: reduce) { .fd-arch .in, .fd-eye i, .fd-slot.dig .fd-slab, .fd-brushcur.on, .fd-word, .fd-slot.answer .fd-slab { animation:none !important; } }
  `;
  function injectCss() {
    if (document.getElementById("fd-css")) return;
    const s = document.createElement("style"); s.id = "fd-css"; s.textContent = CSS; document.head.appendChild(s);
  }

  registerMicrogame({
    id: "fossil-dig",
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
      const N = speed >= 1.5 ? 4 : 3;
      const C = ctx.choiceRows(1, N, { lowercase: true });
      const row = C.rows[0];

      // ---------- DOM ----------
      const wrap = document.createElement("div");
      wrap.className = "fd";
      const top = document.createElement("div");
      top.className = "fd-top";
      const arch = document.createElement("div");
      arch.className = "fd-arch";
      arch.innerHTML = '<div class="in"><div class="fd-abody"></div><div class="fd-ahead"></div><div class="fd-hat"></div><div class="fd-eye l"><i></i></div>' +
        '<div class="fd-eye r"><i></i></div><div class="fd-stache"></div><div class="fd-amouth"></div><div class="fd-brush">🖌️</div></div>';
      const card = document.createElement("button");
      card.className = "fd-card";
      card.setAttribute("aria-label", TEXT.cardLabel);
      card.innerHTML = '<span class="ct"></span>';
      card.firstChild.textContent = C.listen ? C.target.text : C.cardText; // always shown (sight words too)
      if (ctx.canSpeak) card.insertAdjacentHTML("beforeend", '<span class="spk">🔊</span>');
      card.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });
      arch.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });
      top.append(arch, card);
      const site = document.createElement("div");
      site.className = "fd-site";
      site.innerHTML = '<div class="fd-sun"></div><div class="fd-cactus" style="left:3%">🌵</div><div class="fd-cactus" style="right:4%;font-size:1.6rem">🌵</div>';
      const brush = document.createElement("div");
      brush.className = "fd-brushcur"; brush.textContent = "🖌️";
      const fx = document.createElement("div");
      fx.className = "fd-fx";
      wrap.append(top, site);
      ctx.root.appendChild(wrap);

      const slots = ctx.shuffle(row.slice()).map((o, i) => {
        const el = document.createElement("div");
        el.className = "fd-slot";
        el.style.setProperty("--sc", SLABS[i % SLABS.length]);
        el.style.setProperty("--d", 0);
        el.innerHTML = '<div class="fd-slab"></div><div class="fd-sand"></div>';
        el.firstChild.textContent = o.text;
        site.appendChild(el);
        return { o, el, slab: el.firstChild, d: 0, x: 0, y: 0, done: false };
      });
      site.append(brush, fx);

      // ---------- Layout ----------
      let W = 0, H = 0, sw = 100, sh = 80;
      function layout() {
        W = site.clientWidth; H = site.clientHeight;
        const cols = N === 3 ? 3 : 2, rows = N === 3 ? 1 : 2;
        sw = Math.min((W - 24) / cols - 14, 170);
        sh = Math.min(sw * 0.8, (H * 0.78) / rows - 12);
        sw = Math.min(sw, sh * 1.35);
        site.style.setProperty("--sw", `${sw}px`);
        site.style.setProperty("--sh", `${sh}px`);
        slots.forEach((s, i) => {
          const c = i % cols, r = Math.floor(i / cols);
          s.x = W * (c + 0.5) / cols;
          s.y = rows === 1 ? H * 0.6 : H * (0.36 + r * 0.38);
          s.el.style.left = `${s.x}px`; s.el.style.top = `${s.y}px`;
          const len = Math.max(1, [...s.o.text].length);
          s.slab.style.fontSize = s.o.kind === "word" ? `${Math.min(sh * 0.5, (sw * 0.86) / (len * 0.62))}px` : `${sh * 0.62}px`;
        });
      }

      // ---------- Digging ----------
      let done = false, last = null, lastScrape = 0;
      const local = (e) => { const r = site.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
      const slotAt = (p) => slots.find((s) => !s.done && Math.abs(p.x - s.x) < sw * 0.62 && Math.abs(p.y - s.y) < sh * 0.7);
      site.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        if (done || ctx.ended) return;
        last = local(e);
        brush.classList.add("on");
        moveBrush(last);
        const s = slotAt(last);
        if (s) dig(s, sh * 0.7); // a tap digs a little
      });
      site.addEventListener("pointermove", (e) => {
        if (!last) return;
        const p = local(e);
        const d = Math.hypot(p.x - last.x, p.y - last.y);
        last = p;
        moveBrush(p);
        if (done || ctx.ended) return;
        const s = slotAt(p);
        if (s && d > 0) dig(s, Math.min(d, sh));
      });
      const up = () => { last = null; brush.classList.remove("on"); slots.forEach((s) => s.el.classList.remove("dig")); };
      site.addEventListener("pointerup", up);
      site.addEventListener("pointercancel", up);
      function moveBrush(p) { brush.style.transform = `translate(${p.x}px, ${p.y}px)`; }

      function dig(s, d) {
        s.d = Math.min(1, s.d + d / (sh * NEED));
        s.el.style.setProperty("--d", s.d.toFixed(3));
        slots.forEach((x) => x.el.classList.toggle("dig", x === s));
        const now = performance.now();
        if (now - lastScrape > 70) {
          lastScrape = now;
          noise(0.06, "bandpass", 1400 + s.d * 1600, 900, 0.25); // scritch scratch
          grains(s);
        }
        if (s.d >= 1) dugOut(s);
      }
      function grains(s) {
        if (reduceMotion) return;
        for (let k = 0; k < 3; k++) {
          const g = document.createElement("div");
          g.className = "fd-grain";
          const x = s.x + (Math.random() - 0.5) * sw, y = s.y + sh * (0.5 - s.d * 0.4);
          g.style.left = `${x}px`; g.style.top = `${y}px`;
          fx.appendChild(g);
          const dx = (Math.random() - 0.5) * sw * 1.2, dy = -sh * (0.4 + Math.random() * 0.5);
          g.animate([{ transform: "translate(0,0)" }, { transform: `translate(${dx * 0.6}px, ${dy}px)`, offset: 0.45 }, { transform: `translate(${dx}px, ${sh * 0.4}px)`, opacity: 0 }],
            { duration: 550, easing: "ease-out", fill: "forwards" });
          ctx.later(() => g.remove(), 560);
        }
      }
      function dugOut(s) {
        s.done = true;
        s.el.classList.remove("dig");
        if (s.o.right) {
          done = true;
          ctx.win();
          up();
          s.el.classList.add("out");
          s.el.animate([{ translate: "0 0" }, { translate: `0 ${-sh * 0.35}px`, scale: "1.12" }, { translate: `0 ${-sh * 0.25}px`, scale: "1.05" }],
            { duration: reduceMotion ? 1 : 500, easing: "cubic-bezier(.2,1.6,.4,1)", fill: "forwards" });
          arch.classList.add("cheer");
          [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, "triangle", 0.1, i * 0.09));
          word(TEXT.fossil, false, s.x, s.y - sh);
          ctx.confetti(fx, s.x, s.y - sh * 0.3, { count: 60 });
          if (!reduceMotion) ["🦴", "✨", "🦴", "✨", "🦕"].forEach((e, i) => {
            const p = document.createElement("div");
            p.className = "fd-pop"; p.textContent = e; p.style.fontSize = `${sh * 0.35}px`;
            p.style.left = `${s.x}px`; p.style.top = `${s.y}px`;
            fx.appendChild(p);
            const a = -Math.PI / 2 + (i - 2) * 0.5;
            p.animate([{ transform: "translate(-50%,-50%) scale(.3)" }, { transform: `translate(calc(-50% + ${Math.cos(a) * sh * 1.2}px), calc(-50% + ${Math.sin(a) * sh * 1.2}px)) scale(1)`, opacity: 0 }],
              { duration: 900, easing: "ease-out", fill: "forwards" });
          });
          ctx.say(C.answer);
          return;
        }
        // JUNK! Something silly pops out; it only costs time.
        s.el.classList.add("junk");
        const j = document.createElement("div");
        j.className = "fd-pop"; j.textContent = JUNK[Math.floor(Math.random() * JUNK.length)];
        s.el.appendChild(j);
        j.animate([{ transform: "translate(-50%,-10%) scale(.3) rotate(0)" }, { transform: "translate(-50%,-90%) scale(1.1) rotate(-20deg)" }, { transform: "translate(-50%,-70%) scale(1) rotate(10deg)" }],
          { duration: reduceMotion ? 1 : 500, easing: "ease-out", fill: "forwards" });
        sweep(400, 300, 0.2, "sawtooth", 0.07); sweep(300, 220, 0.3, "sawtooth", 0.07, 0.22); sweep(220, 140, 0.45, "sawtooth", 0.07, 0.5); // wah wah waaah
        word(TEXT.junk, true, s.x, s.y - sh);
        arch.classList.remove("shrug"); void arch.offsetWidth; arch.classList.add("shrug");
        if (s.o.kind === "pic") ctx.say(s.o.spoken);
      }
      function word(text, bad, x, y) {
        const w = document.createElement("div");
        w.className = "fd-word" + (bad ? " bad" : "");
        w.textContent = text;
        w.style.left = `${Math.max(60, Math.min(W - 60, x))}px`; w.style.top = `${Math.max(26, y)}px`;
        fx.appendChild(w);
        ctx.later(() => w.remove(), 1000);
      }
      function replay() { if (!done) ctx.say(C.prompt); }

      ctx.onTimeout(() => {
        done = true; up();
        slots.forEach((s) => { if (s.o.right) { s.el.classList.add("answer"); s.el.style.setProperty("--d", 0.75); } });
        word(TEXT.hmm, true, W / 2, H * 0.2);
        ctx.say(C.answer);
      });
      function onKey(e) {
        const i = parseInt(e.key, 10) - 1;
        if (i >= 0 && i < slots.length && !done && !slots[i].done) { e.preventDefault(); dig(slots[i], sh * 2.5); }
        else if (e.key === " ") { e.preventDefault(); replay(); }
      }
      document.addEventListener("keydown", onKey);

      wrap.style.setProperty("--az", `${Math.max(64, Math.min(110, ctx.root.clientHeight * 0.17))}px`); // (once: setting it in layout resized the site under the observer)
      layout();
      const ro = new ResizeObserver(layout);
      ro.observe(site);
      ctx.say(C.prompt);
      ctx.reveal(card);

      // Tutorial: point at the card, then rub the right fossil back and forth until it's out.
      ctx.tutorial(C.target, async (f) => {
        const s = slots.find((x) => x.o.right);
        const pt = (dx) => () => {
          const rr = ctx.root.getBoundingClientRect(), sr = site.getBoundingClientRect();
          return { x: sr.left - rr.left + s.x + dx, y: sr.top - rr.top + s.y + sh * 0.1 };
        };
        await f.point(card, 800);
        const a = pt(-sw * 0.35), b = pt(sw * 0.35);
        for (let k = 0; k < 3 && !done; k++) await f.path([a, b, a, b, a, b, a, b, a], 110);
      });
      return () => { done = true; ro.disconnect(); document.removeEventListener("keydown", onKey); };
    },
  });
})();
