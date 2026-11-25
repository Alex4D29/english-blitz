// ALIEN TWINS — reworked (the teacher found the first version, UFO pods that open like Magic Hats' hats, too alike).
// Now it's a moving-pairs game, not a memory one: a flying saucer hovers over a bumpy moon, and little aliens wander
// about on the moon below, each holding up half of a pair (`ctx.matchPairs`: B and b, B and 🐝, cat and 🐱, said and
// said), always in view; every alien is a random colour, so only the signs tell you who's a twin. Tap an alien: the
// saucer's tractor beam grabs it and it floats up in the light. Tap its twin: both get sucked up into the saucer
// (BEAM ME UP!), which wobbles happily. The wrong one: the beam fizzles, ZAP!, both drop back down with frizzy hair
// and run about in a panic for a moment, ✕. Beam up every pair (3, 4 from 1.5×) and the saucer zooms off; 3 zaps lose.
// They wander faster with speed.
(function () {
  const TEXT = {
    name: { en: "Alien Twins" },
    icon: "👽",
    howTo: { en: {
      steps: [
        ["👽", "Aliens wander on the moon, each with a card."],
        ["🛸", "Tap one: the flying saucer grabs it with its beam!"],
        ["👯", "Now tap its twin, the one with the matching card. Beam them up!"],
      ],
      tips: ["The wrong twin? ZAP! Three zaps and it's over.", "The colours are just for fun: look at the cards.", "When the game speeds up, there are more aliens and they wander faster."],
    } },
    instruction: { en: "BEAM UP\nTHE TWINS!" },
    alienLabel: (t) => `An alien holding ${t}`,
    found: ["BEAM ME UP!", "TWINS!", "ZOOP!", "WHEEE!"],
    zap: "ZAP!",
    win: "TAKE OFF!",
  };
  const MISSES = 3;
  const SKINS = ["#7dff6a", "#6ad7ff", "#ff8af0", "#ffd84d", "#b28aff", "#ff9a5c", "#6affc8", "#ff6a8a"];

  const CSS = `
  .alt { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:6px; padding-bottom:6px; }
  .alt-top { flex:none; display:flex; gap:12px; align-items:center; min-height:28px; }
  .alt-pips { display:flex; gap:5px; }
  .alt-pip { width:24px; height:24px; border:3px solid #111; border-radius:50%; background:#fff; display:flex; align-items:center; justify-content:center; font-size:13px; line-height:1; }
  .alt-pip.on { background:#7dff6a; } .alt-pip.on::after { content:"👯"; }
  .alt-pip.x.on { background:#ff5a6e; } .alt-pip.x.on::after { content:"⚡"; }
  .alt-sky { position:relative; flex:1; min-height:0; width:100%; max-width:640px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111; touch-action:none; cursor:pointer;
    background:radial-gradient(circle, #fff 0 1px, transparent 2px) 0 0 / 46px 40px, radial-gradient(circle at 12% 16%, #6ad7ff 0 5%, #2a7ab0 5.5% 6.5%, transparent 7%), linear-gradient(180deg, #140a3a, #3a1f7a); }
  /* The moon's surface (from --my down): grey, with craters */
  .alt-moon { position:absolute; left:-10%; right:-10%; top:var(--my); bottom:-10%; border-top:5px solid #111; border-radius:50% 50% 0 0 / 40px 40px 0 0;
    background:radial-gradient(ellipse 34px 14px at 20% 30%, #8d93a3 0 90%, transparent 100%), radial-gradient(ellipse 50px 18px at 70% 55%, #8d93a3 0 90%, transparent 100%),
      radial-gradient(ellipse 26px 10px at 45% 80%, #8d93a3 0 90%, transparent 100%), #b9bfcc; }
  /* The flying saucer (--uz): a silver disc with blinking lights and a glass dome with a tiny pilot */
  .alt-ufo { position:absolute; left:50%; top:3%; width:var(--uz); height:calc(var(--uz) * .5); margin-left:calc(var(--uz) / -2); z-index:5; pointer-events:none; animation:alt-hover 1.4s ease-in-out infinite alternate; }
  .alt-ufo > * { position:absolute; box-sizing:border-box; }
  .alt-dome { left:28%; right:28%; top:0; height:56%; background:rgba(190,235,255,.75); border:4px solid #111; border-bottom:0; border-radius:50% 50% 0 0 / 90% 90% 0 0; overflow:hidden; }
  .alt-pilot { left:38%; right:38%; top:22%; height:60%; background:#7dff6a; border:3px solid #111; border-radius:50% 50% 30% 30%; }
  .alt-pilot::before, .alt-pilot::after { content:""; position:absolute; top:26%; width:30%; aspect-ratio:1; background:#fff; border:2px solid #111; border-radius:50%; }
  .alt-pilot::before { left:8%; } .alt-pilot::after { right:8%; }
  .alt-disc { left:0; right:0; top:42%; height:40%; background:linear-gradient(#e8edf3, #8a96a6); border:4px solid #111; border-radius:50%; }
  .alt-disc::after { content:""; position:absolute; left:10%; right:10%; top:36%; height:28%; background:radial-gradient(circle, #ffd400 0 40%, transparent 44%) 0 0 / 20% 100%; animation:alt-blink .5s steps(2) infinite; }
  .alt-belly { left:34%; right:34%; top:74%; height:18%; background:#ffe066; border:3px solid #111; border-radius:0 0 50% 50%; }
  .alt-ufo.happy { animation:alt-wobble .14s ease-in-out 6 alternate; }
  .alt-ufo.go { animation:none; transition:transform 1.1s ease-in; transform:translate(120%, -200%) rotate(-20deg); }
  /* The tractor beam: a cone of yellow light from the saucer's belly to the grabbed alien */
  .alt-beam { position:absolute; left:0; top:0; width:var(--bw); margin-left:calc(var(--bw) / -2); z-index:2; pointer-events:none; transform-origin:50% 0; opacity:0; transition:opacity .15s;
    background:repeating-linear-gradient(180deg, rgba(255,240,120,.65) 0 12px, rgba(255,240,120,.4) 12px 24px); clip-path:polygon(38% 0, 62% 0, 100% 100%, 0 100%); }
  .alt-beam.on { opacity:1; }
  .alt-beam.fizz { opacity:1; animation:alt-fizz .06s steps(2) 8; }
  /* An alien (--az, --ac): a blob with three googly eyes, a bobbly antenna and little legs, holding its sign up */
  .alt-al { position:absolute; left:0; top:0; width:var(--az); height:var(--az); z-index:3; pointer-events:none; }
  .alt-in { position:absolute; inset:0; }
  .alt-in > * { position:absolute; box-sizing:border-box; }
  .alt-al.walk .alt-in { animation:alt-bob .22s ease-in-out infinite alternate; }
  .alt-body { left:16%; right:16%; top:14%; bottom:12%; background:var(--ac); border:3px solid #111; border-radius:50% 50% 40% 40%; }
  .alt-ant { left:48%; top:2%; width:5%; height:14%; background:#111; }
  .alt-ant::after { content:""; position:absolute; left:-110%; top:-70%; width:320%; aspect-ratio:1; border-radius:50%; background:var(--ac); border:2px solid #111; }
  .alt-eye { top:22%; width:18%; aspect-ratio:1; background:#fff; border:2px solid #111; border-radius:50%; overflow:hidden; z-index:2; }
  .alt-eye.a { left:22%; } .alt-eye.b { left:41%; top:17%; width:20%; } .alt-eye.c { right:22%; }
  .alt-eye i { position:absolute; left:28%; top:28%; width:46%; aspect-ratio:1; border-radius:50%; background:#111; animation:alt-roll .9s ease-in-out infinite alternate; }
  .alt-leg { bottom:2%; width:12%; height:14%; background:var(--ac); border:2px solid #111; border-radius:40%; } .alt-leg.l { left:30%; } .alt-leg.r { right:30%; }
  .alt-al.walk .alt-leg.l { animation:alt-step .22s ease-in-out infinite alternate; } .alt-al.walk .alt-leg.r { animation:alt-step .22s ease-in-out infinite alternate-reverse; }
  .alt-frizz { left:12%; right:12%; top:2%; height:16%; opacity:0; background:#111; clip-path:polygon(0 100%, 8% 0, 16% 100%, 24% 0, 32% 100%, 40% 0, 48% 100%, 56% 0, 64% 100%, 72% 0, 80% 100%, 88% 0, 100% 100%); }
  .alt-al.zapped .alt-frizz { opacity:1; }
  .alt-al.zapped .alt-body { filter:brightness(.7); }
  .alt-sign { left:50%; top:62%; transform:translate(-50%, -50%); padding:1px 7px; background:#fff; border:3px solid #111; border-radius:9px; font-weight:900; color:#111; line-height:1.1; white-space:nowrap; z-index:3; }
  .alt-al.grab .alt-sign { box-shadow:0 0 0 4px #fff, 0 0 0 8px #ffd400; }
  .alt-al.hint .alt-sign { box-shadow:0 0 0 4px #fff, 0 0 0 8px #00b86b; }
  .alt-fx { position:absolute; inset:0; pointer-events:none; z-index:8; overflow:visible; }
  .alt-word { position:absolute; transform:translate(-50%, -50%) rotate(-8deg); font-size:1.8rem; color:#7dff6a; -webkit-text-stroke:2px #111; paint-order:stroke fill;
    text-shadow:0 4px 0 #111; white-space:nowrap; animation:alt-word 1s ease-out forwards; }
  .alt-word.bad { color:#ffd400; }
  .alt-pop { position:absolute; transform:translate(-50%, -50%); line-height:1; pointer-events:none; }
  @keyframes alt-hover { from { translate:0 -4px; } to { translate:0 4px; } }
  @keyframes alt-wobble { from { rotate:-8deg; } to { rotate:8deg; } }
  @keyframes alt-blink { 50% { filter:hue-rotate(140deg); } }
  @keyframes alt-fizz { 50% { opacity:.15; } }
  @keyframes alt-bob { to { transform:translateY(-5%); } }
  @keyframes alt-step { to { transform:translateY(-30%); } }
  @keyframes alt-roll { from { transform:translate(-25%, -15%); } to { transform:translate(25%, 15%); } }
  @keyframes alt-word { from { opacity:1; scale:.5; } 25% { scale:1.15; } 75% { opacity:1; } to { opacity:0; translate:0 -40px; } }
  @media (prefers-reduced-motion: reduce) { .alt-ufo, .alt-disc::after, .alt-eye i, .alt-al.walk .alt-in, .alt-al.walk .alt-leg, .alt-beam.fizz, .alt-word { animation:none !important; } }
  `;
  function injectCss() { if (document.getElementById("alt2-css")) return; const s = document.createElement("style"); s.id = "alt2-css"; s.textContent = CSS; document.head.appendChild(s); }

  registerMicrogame({
    id: "alien-twins",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 20000,
    input: "tap",
    tutorial: true,

    start(ctx) {
      injectCss();
      const speed = ctx.speed || 1, pace = 0.6 + 0.4 * speed;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const { tone, sweep, noise } = ctx.sfx;
      const P = ctx.matchPairs(speed >= 1.5 ? 4 : 3);
      const N = P.length;

      const wrap = document.createElement("div");
      wrap.className = "alt";
      wrap.innerHTML = `<div class="alt-top"><div class="alt-pips hits">${'<span class="alt-pip"></span>'.repeat(N)}</div><div class="alt-pips miss">${'<span class="alt-pip x"></span>'.repeat(MISSES)}</div></div>`;
      const sky = document.createElement("div");
      sky.className = "alt-sky";
      sky.innerHTML = '<div class="alt-moon"></div><div class="alt-beam"></div>' +
        '<div class="alt-ufo"><div class="alt-dome"><div class="alt-pilot"></div></div><div class="alt-disc"></div><div class="alt-belly"></div></div>';
      const fx = document.createElement("div");
      fx.className = "alt-fx";
      sky.appendChild(fx);
      wrap.appendChild(sky);
      ctx.root.appendChild(wrap);
      const ufo = sky.querySelector(".alt-ufo"), beam = sky.querySelector(".alt-beam");
      const hitPips = wrap.querySelector(".hits").children, missPips = wrap.querySelector(".miss").children;

      // ---------- The aliens (each half of each pair, a random colour each) ----------
      const cols = ctx.shuffle(SKINS.slice());
      const halves = ctx.shuffle(P.flatMap((p, pi) => [{ pi, h: p.a }, { pi, h: p.b }]));
      const als = halves.map((x, i) => {
        const el = document.createElement("div");
        el.className = "alt-al walk";
        el.style.setProperty("--ac", cols[i % cols.length]);
        el.style.animationDelay = `${-Math.random()}s`;
        el.innerHTML = '<div class="alt-in"><div class="alt-ant"></div><div class="alt-leg l"></div><div class="alt-leg r"></div><div class="alt-body"></div><div class="alt-frizz"></div>' +
          '<div class="alt-eye a"><i></i></div><div class="alt-eye b"><i></i></div><div class="alt-eye c"><i></i></div><span class="alt-sign"></span></div>';
        el.querySelector(".alt-sign").textContent = x.h.text;
        el.setAttribute("aria-label", TEXT.alienLabel(x.h.spoken || x.h.text));
        sky.insertBefore(el, fx);
        const a = Math.random() * Math.PI * 2;
        return { el, pi: x.pi, h: x.h, x: 0, y: 0, dx: Math.cos(a), dy: Math.sin(a), lift: 0, state: "walk", panic: 0 };
      });

      let W = 0, H = 0, az = 80, uz = 160, my = 0;
      const ufoPt = () => ({ x: W / 2, y: H * 0.03 + uz * 0.46 });
      function layout() {
        const first = !W;
        W = sky.clientWidth; H = sky.clientHeight;
        uz = Math.max(110, Math.min(W * 0.34, H * 0.36, 200));
        az = Math.max(62, Math.min(H * 0.21, W / (N + 1.6), 104));
        my = H * 0.03 + uz * 0.62;
        sky.style.setProperty("--uz", `${uz}px`); sky.style.setProperty("--az", `${az}px`); sky.style.setProperty("--my", `${my}px`); sky.style.setProperty("--bw", `${az * 1.3}px`);
        als.forEach((a, i) => {
          a.el.querySelector(".alt-sign").style.fontSize = `${a.h.kind === "pic" ? az * 0.32 : Math.min(az * 0.32, (az * 0.92) / ([...a.h.text].length * 0.62))}px`;
          if (first) {   // spread out over the moon to start
            const c = Math.ceil(als.length / 2), r = Math.floor(i / c), k = i % c;
            a.x = (W / (c + 1)) * (k + 1) + (Math.random() - 0.5) * az * 0.4;
            a.y = my + az * 0.6 + r * ((H - my - az * 1.2) * 0.75) + (Math.random() - 0.5) * az * 0.2;
          }
          clamp(a);
        });
      }
      function clamp(a) {
        const x0 = az * 0.55, x1 = W - az * 0.55, y0 = my + az * 0.45, y1 = H - az * 0.55;
        if (a.x < x0) { a.x = x0; a.dx = Math.abs(a.dx); } if (a.x > x1) { a.x = x1; a.dx = -Math.abs(a.dx); }
        if (a.y < y0) { a.y = y0; a.dy = Math.abs(a.dy); } if (a.y > y1) { a.y = y1; a.dy = -Math.abs(a.dy); }
      }

      // ---------- Moving and drawing ----------
      let last = null, started = false, sel = null, busy = false, done = false, found = 0, missN = 0;
      function frame(ts) {
        const dt = last == null ? 0 : Math.min(50, ts - last) / 1000;
        last = ts;
        const v = az * 0.55 * pace;
        for (const a of als) {
          if (a.state === "walk" && started && !done) {
            const sp = v * (a.panic > 0 ? 3 : 1);
            if (a.panic > 0) a.panic -= dt;
            if (Math.random() < dt * 0.4) { const t = Math.random() * Math.PI * 2; a.dx = Math.cos(t); a.dy = Math.sin(t); }   // wander
            a.x += a.dx * sp * dt; a.y += a.dy * sp * dt * 0.6;
            // keep a little apart
            for (const b of als) if (b !== a && b.state === "walk") { const ex = a.x - b.x, ey = a.y - b.y, d = Math.hypot(ex, ey); if (d > 0 && d < az * 0.95) { a.x += (ex / d) * (az * 0.95 - d) * 0.5; a.y += (ey / d) * (az * 0.95 - d) * 0.3; } }
            clamp(a);
          }
          if (a.state === "grab") a.lift = Math.min(az * 0.6, a.lift + dt * az * 2);
          else if (a.state === "walk") a.lift = Math.max(0, a.lift - dt * az * 4);
          if (a.state !== "up") a.el.style.transform = `translate(${a.x - az / 2}px, ${a.y - az / 2 - a.lift}px)`;
        }
        // The beam points at the grabbed alien.
        if (sel) aimBeam(sel);
        ctx.raf(frame);
      }
      function aimBeam(a) {
        const u = ufoPt(), tx = a.x, ty = a.y - a.lift + az * 0.3;
        const d = Math.hypot(tx - u.x, ty - u.y), ang = Math.atan2(tx - u.x, ty - u.y);
        beam.style.left = `${u.x}px`; beam.style.top = `${u.y}px`; beam.style.height = `${d}px`;
        beam.style.transform = `rotate(${-ang}rad)`;
      }

      // ---------- Tapping ----------
      function nearest(cx, cy) {
        let best = null, bd = Infinity;
        for (const a of als) { if (a.state === "up") continue; const d = Math.hypot(a.x - cx, a.y - a.lift - cy); if (d < bd) { bd = d; best = a; } }
        return bd < az * 0.75 ? best : null;
      }
      sky.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        const r = sky.getBoundingClientRect();
        const a = nearest(e.clientX - r.left, e.clientY - r.top);
        if (a) pick(a);
      });
      function pick(a) {
        if (done || busy || ctx.ended || a.state === "up") return;
        ctx.say(a.h.spoken || a.h.text);
        if (!sel) {
          sel = a; a.state = "grab"; a.el.classList.remove("walk"); a.el.classList.add("grab");
          aimBeam(a); beam.className = "alt-beam on";
          sweep(500, 1100, 0.25, "sine", 0.06);   // bweee
          return;
        }
        if (a === sel) { release(a); beam.className = "alt-beam"; sel = null; return; }   // let go again
        if (a.pi === sel.pi) beamUp(sel, a); else zap(sel, a);
      }
      function release(a) { a.state = "walk"; a.el.classList.remove("grab"); a.el.classList.add("walk"); }

      function beamUp(a, b) {
        busy = true;
        b.state = "grab"; b.el.classList.remove("walk"); b.el.classList.add("grab");
        sweep(300, 1600, 0.9, "sine", 0.07);
        word(TEXT.found[found % TEXT.found.length], false, (a.x + b.x) / 2, Math.min(a.y, b.y) - az);
        const u = ufoPt();
        [a, b].forEach((x) => {
          x.state = "up";
          const from = `translate(${x.x - az / 2}px, ${x.y - az / 2 - x.lift}px)`;
          x.el.animate([{ transform: from }, { transform: `translate(${u.x - az / 2}px, ${u.y - az / 2}px) scale(.2) rotate(360deg)`, opacity: 0.2 }], { duration: reduceMotion ? 1 : 750, easing: "ease-in", fill: "forwards" });
        });
        beam.style.left = `${u.x}px`;
        hitPips[found].classList.add("on");
        found++;
        ctx.later(() => {
          [a, b].forEach((x) => x.el.remove());
          beam.className = "alt-beam"; sel = null;
          ufo.classList.remove("happy"); void ufo.offsetWidth; ufo.classList.add("happy");
          [659, 880].forEach((f, k) => tone(f, 0.1, "triangle", 0.08, k * 0.08));
          ctx.say(P[a.pi].say);
          if (found >= N) {
            done = true; ctx.win();
            ctx.later(() => { ufo.classList.add("go"); sweep(200, 1400, 1.1, "sine", 0.08); word(TEXT.win, false, W / 2, H * 0.3); ctx.confetti(fx, W / 2, H * 0.3, { count: 90 }); }, 300);
          } else busy = false;
        }, reduceMotion ? 20 : 780);
      }
      function zap(a, b) {
        busy = true;
        beam.className = "alt-beam fizz";
        noise(0.25, "highpass", 2000, 5000, 0.35); sweep(900, 200, 0.3, "sawtooth", 0.06);
        word(TEXT.zap, true, (a.x + b.x) / 2, Math.min(a.y, b.y) - az * 0.8);
        [a, b].forEach((x) => { x.el.classList.add("zapped"); pop("⚡", x.x, x.y - az * 0.6); });
        missPips[missN].classList.add("on");
        missN++;
        ctx.later(() => {
          beam.className = "alt-beam"; sel = null;
          [a, b].forEach((x) => { release(x); x.panic = 1.2; const t = Math.random() * Math.PI * 2; x.dx = Math.cos(t); x.dy = Math.sin(t); });
          if (missN >= MISSES) { done = true; ctx.lose(); showPair(); return; }
          busy = false;
        }, 520);
        ctx.later(() => [a, b].forEach((x) => x.el.classList.remove("zapped")), 1700);
      }
      function showPair() { const p = als.find((x) => x.state !== "up"); if (p) als.filter((x) => x.pi === p.pi).forEach((x) => x.el.classList.add("hint")); }
      function pop(e, x, y) {
        const p = document.createElement("div");
        p.className = "alt-pop"; p.textContent = e; p.style.fontSize = "30px";
        p.style.left = `${x}px`; p.style.top = `${y}px`;
        fx.appendChild(p);
        p.animate([{ opacity: 1, transform: "translate(-50%, -50%) scale(.5)" }, { opacity: 0, transform: "translate(-50%, -120%) scale(1.3)" }], { duration: 600, fill: "forwards" });
        ctx.later(() => p.remove(), 620);
      }
      function word(text, bad, x, y) {
        const w = document.createElement("div");
        w.className = "alt-word" + (bad ? " bad" : "");
        w.textContent = text;
        w.style.left = `${Math.max(100, Math.min(W - 100, x))}px`; w.style.top = `${Math.max(26, y)}px`;
        fx.appendChild(w);
        ctx.later(() => w.remove(), 1000);
      }

      ctx.onTimeout(() => { done = true; showPair(); });

      layout();
      const ro = new ResizeObserver(layout);
      ro.observe(sky);
      ctx.raf(frame);
      ctx.later(() => { started = true; }, 300);

      // Tutorial: grab one of each pair, then its twin (following them as they wander).
      const at = (a) => () => { const rr = ctx.root.getBoundingClientRect(), r = sky.getBoundingClientRect(); return { x: r.left - rr.left + a.x, y: r.top - rr.top + a.y - a.lift }; };
      ctx.tutorial(P.map((p) => p.item), async (f) => {
        for (let pi = 0; pi < N && !done; pi++) {
          const [a, b] = als.filter((x) => x.pi === pi);
          await f.until(() => !busy, 3000);
          await f.tap(at(a));
          await f.until(() => sel === a, 1500);
          await f.tap(at(b));
          await f.until(() => found > pi || done, 2500);
        }
      });
      return () => { done = true; ro.disconnect(); };
    },
  });
})();
