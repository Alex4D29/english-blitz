// TRACK SWITCH — a silly-faced little engine sits at the bottom of a railway line. Ahead, the track
// splits into several branches, each passing a sign, and the branches merge again further up into the
// next junction, and so on up to the station. Tap the branch (or its sign) with the target: the points
// clack and the engine drives up that branch, with the camera following it, so the next junction rolls
// into view (one continuous line: nothing ends and reappears). A wrong branch has a buffer stop just
// past its sign: BONK, steam, dizzy eyes, the round is lost and the right branch glows. After the last
// junction the engine pulls into the station: toot toot, confetti. Content comes from ctx.choiceRows
// (ABC: half the rounds are capital → lowercase). 3 junctions, 4 from 1.5×; 4 branches from 2×.
(function () {
  const TEXT = {
    name: { en: "Train Tracks" },
    icon: "🚂",
    howTo: (list) => ({ en: {
      steps: [
        list.type === "hfw" ? ["👂", "Listen to the word, like \"the\"."] : ["👀", "Look at the card at the top."],
        ["🛤️", "The track splits! Tap the track with the same one."],
        ["🚂", "Junction by junction, drive the train to the station!"],
      ],
      tips: [
        "Tap the card to hear it again.",
        "A wrong track has a stop… BONK! The right one glows.",
        "When the game speeds up, there are more junctions and more tracks.",
      ],
    } }),
    instruction: { en: "SWITCH THE\nTRACKS!" },
    cardLabel: "Hear it again",
    signLabel: (t) => `Take the track to ${t}`,
    station: "🏁 🎉 🏁",
  };

  const SVG_NS = "http://www.w3.org/2000/svg";
  const CSS = `
  .tk { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:8px; padding-bottom:8px; }
  .tk-card { flex:none; min-width:84px; height:72px; padding:0 18px; border-radius:18px; font:inherit; font-size:2.6rem; line-height:1; background:#fff; color:#111;
    border:5px solid #111; box-shadow:0 6px 0 #111; display:flex; align-items:center; justify-content:center; gap:8px; cursor:pointer; touch-action:manipulation; }
  .tk-card .spk { font-size:1.3rem; opacity:.6; }
  .tk-scene { position:relative; flex:1; min-height:0; width:100%; max-width:520px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111;
    background:#7ccf5a; background-image:radial-gradient(circle, #93dd72 3px, transparent 4px); background-size:28px 28px; touch-action:manipulation; }
  /* The world scrolls under the camera; it's drawn in screen px at camera 0, junctions stacked upwards */
  .tk-world { position:absolute; left:0; top:0; width:100%; height:100%; will-change:transform; }
  .tk-world svg { position:absolute; left:0; top:0; width:100%; height:100%; overflow:visible; }
  .tk-pick { filter:drop-shadow(0 0 6px #fff) brightness(1.15); }
  .tk-sign { position:absolute; transform:translate(-50%, -100%); min-width:var(--sz); height:calc(var(--sz) * .8); padding:0 6px; border:4px solid #111; border-radius:12px;
    background:#fff; color:#111; font:inherit; font-size:calc(var(--sz) * .5); line-height:1; display:flex; align-items:center; justify-content:center; white-space:nowrap;
    box-shadow:0 4px 0 #111; cursor:pointer; touch-action:manipulation; z-index:3; }
  .tk-sign::after { content:""; position:absolute; left:50%; top:100%; width:6px; height:14px; margin-left:-3px; background:#6b4a2b; border:2px solid #111; }
  .tk-sign.pic { font-size:calc(var(--sz) * .48); }
  .tk-sign.right { background:#b8ffcf; box-shadow:0 0 0 5px #fff, 0 0 0 10px #00b86b; animation:tk-wiggle .4s ease-in-out 3; }
  .tk-sign.dim { opacity:.5; }
  .tk-sign.past { opacity:.55; }
  .tk-stop { position:absolute; width:calc(var(--sz) * .9); height:16px; transform:translate(-50%, -50%); border:3px solid #111; border-radius:4px; z-index:2;
    background:repeating-linear-gradient(45deg, #e8173c 0 8px, #fff 8px 16px); animation:tk-in .25s cubic-bezier(.2,1.8,.4,1); }
  .tk-station { position:absolute; transform:translate(-50%, -100%); padding:6px 16px; background:#fff3d6; border:5px solid #111; border-radius:12px 12px 0 0;
    font-size:1.6rem; line-height:1; z-index:2; box-shadow:0 5px 0 #111; white-space:nowrap; }
  /* The big trophy at the end of the line, in the space above the station, in front of spinning rays */
  .tk-rays { position:absolute; width:calc(var(--ty) * 1.9); height:calc(var(--ty) * 1.9); transform:translate(-50%, -50%); border-radius:50%; z-index:1; pointer-events:none;
    background:repeating-conic-gradient(#ffe066 0 12deg, #fff7c2 12deg 24deg); border:5px solid #111; opacity:.9; animation:tk-spin 9s linear infinite; }
  .tk-trophy { position:absolute; transform:translate(-50%, -50%); font-size:var(--ty); line-height:1; z-index:2; pointer-events:none; filter:drop-shadow(0 6px 0 rgba(0,0,0,.3)); }
  .tk-trophy.yay { animation:tk-trophy .5s cubic-bezier(.2,1.8,.4,1) 3; }
  .tk-sparkle { position:absolute; font-size:1.6rem; pointer-events:none; z-index:7; animation:tk-sparkle .8s ease-out forwards; }
  .tk-station::before { content:""; position:absolute; left:-14px; right:-14px; top:-16px; height:14px; background:#e8173c; border:4px solid #111; border-radius:8px 8px 0 0; }

  /* The engine: front view, a big silly face. --tz is its width. Its anchor is the track point under it. */
  .tk-train { position:absolute; left:0; top:0; z-index:4; pointer-events:none; will-change:transform; }
  .tk-eng { position:absolute; left:0; top:0; width:var(--tz); height:calc(var(--tz) * 1.15); transform:translate(-50%, -88%);
    filter:drop-shadow(0 5px 0 rgba(0,0,0,.3)); }
  .tk-chim { position:absolute; left:50%; top:0; width:28%; height:24%; margin-left:-14%; background:#333; border:4px solid #111; border-radius:6px 6px 2px 2px; }
  .tk-chim::before { content:""; position:absolute; left:-22%; right:-22%; top:-26%; height:34%; background:#333; border:4px solid #111; border-radius:6px; }
  .tk-body { position:absolute; left:4%; right:4%; top:20%; height:62%; background:#ff7a1a; border:5px solid #111; border-radius:30% 30% 14% 14%;
    background-image:radial-gradient(circle at 18% 22%, #ffb36b 0 9%, transparent 10%), radial-gradient(circle at 84% 70%, #e85d00 0 7%, transparent 8%); }
  .tk-face { position:absolute; inset:4% 4% 8%; }  /* the face sits straight on the body, like the game's monsters */
  .tk-eye { position:absolute; top:4%; width:40%; aspect-ratio:1; background:#fff; border:4px solid #111; border-radius:50%; }
  .tk-eye.l { left:4%; transform:rotate(-8deg); } .tk-eye.r { right:4%; width:34%; top:8%; }
  .tk-eye i { position:absolute; left:30%; top:34%; width:46%; aspect-ratio:1; background:#111; border-radius:50%; animation:tk-goggle 1.1s ease-in-out infinite; }
  .tk-eye.r i { animation-delay:-.4s; }
  .tk-mouth { position:absolute; left:16%; right:16%; top:54%; height:38%; background:#7a1020; border:3px solid #111; border-radius:0 0 999px 999px; overflow:hidden; }
  .tk-mouth::before { content:""; position:absolute; left:0; right:0; top:0; height:34%; background:#fff; border-bottom:2px solid #111; }
  .tk-mouth::after { content:""; position:absolute; left:30%; right:30%; bottom:-20%; height:55%; background:#ff6f91; border-radius:50%; }
  .tk-bump { position:absolute; left:0; right:0; bottom:6%; height:14%; background:#ffd400; border:4px solid #111; border-radius:6px; }
  .tk-wheel { position:absolute; bottom:0; width:24%; aspect-ratio:1; background:#333; border:4px solid #111; border-radius:50%; }
  .tk-wheel.l { left:2%; } .tk-wheel.r { right:2%; }
  .tk-train.go .tk-eng { animation:tk-chug .22s ease-in-out infinite; }
  .tk-train.bonk .tk-eng { animation:tk-bonk .45s ease-out; }
  .tk-train.bonk .tk-eye i { animation:tk-dizzy .5s linear infinite; }
  .tk-train.bonk .tk-mouth { height:12%; top:66%; border-radius:999px; }
  .tk-train.yay .tk-eng { animation:tk-hop .45s ease-out 2; }
  .tk-puff { position:absolute; font-size:1.4rem; transform:translate(-50%, -50%); animation:tk-puff .9s ease-out forwards; z-index:5; pointer-events:none; }
  .tk-fx { position:absolute; inset:0; pointer-events:none; overflow:visible; z-index:6; }

  @keyframes tk-wiggle { 25% { transform:translate(-50%, -100%) rotate(-7deg); } 75% { transform:translate(-50%, -100%) rotate(7deg); } }
  @keyframes tk-in { from { transform:translate(-50%, -50%) scale(.2); } }
  @keyframes tk-spin { to { transform:translate(-50%, -50%) rotate(360deg); } }
  @keyframes tk-trophy { 50% { transform:translate(-50%, -62%) scale(1.15) rotate(-6deg); } }
  @keyframes tk-sparkle { from { opacity:1; transform:scale(.4); } to { opacity:0; transform:scale(1.6) translateY(-30px); } }
  @keyframes tk-goggle { 0%, 100% { transform:translate(-18%, 0); } 50% { transform:translate(18%, -10%); } }
  @keyframes tk-dizzy { from { transform:rotate(0) translate(30%); } to { transform:rotate(360deg) translate(30%); } }
  @keyframes tk-chug { 50% { transform:translate(-50%, -91%) scaleY(1.04); } }
  @keyframes tk-bonk { 30% { transform:translate(-50%, -80%) rotate(12deg); } 60% { transform:translate(-50%, -92%) rotate(-8deg); } }
  @keyframes tk-hop { 40% { transform:translate(-50%, -120%) rotate(-6deg); } }
  @keyframes tk-puff { from { opacity:.9; transform:translate(-50%, -50%) scale(.5); } to { opacity:0; transform:translate(-50%, -160%) scale(1.8); } }
  @media (prefers-reduced-motion: reduce) {
    .tk-sign.right, .tk-puff, .tk-train .tk-eng, .tk-eye i, .tk-rays, .tk-trophy.yay { animation:none !important; }
  }`;

  function injectCss() {
    if (document.getElementById("tk-css")) return;
    const style = document.createElement("style");
    style.id = "tk-css";
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  registerMicrogame({
    id: "track-switch",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 10000,
    input: "tap",
    tutorial: true, // has a ctx.tutorial script

    start(ctx) {
      injectCss();
      const speed = ctx.speed || 1;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const R = speed >= 1.5 ? 4 : 3, N = speed >= 2 ? 4 : 3;
      const { tone, sweep, noise } = ctx.sfx;
      const C = ctx.choiceRows(R, N, { lowercase: true });

      const wrap = document.createElement("div");
      wrap.className = "tk";
      const card = document.createElement("button");
      card.className = "tk-card";
      card.setAttribute("aria-label", TEXT.cardLabel);
      card.innerHTML = '<span class="ct"></span>';
      card.firstChild.textContent = C.cardText;
      if (ctx.canSpeak && !C.listen) card.insertAdjacentHTML("beforeend", '<span class="spk">🔊</span>');
      card.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });
      const scene = document.createElement("div");
      scene.className = "tk-scene";
      const world = document.createElement("div");
      world.className = "tk-world";
      const svg = document.createElementNS(SVG_NS, "svg");
      world.appendChild(svg);
      const fx = document.createElement("div");
      fx.className = "tk-fx";
      world.appendChild(fx);
      const train = document.createElement("div");
      train.className = "tk-train";
      train.innerHTML = '<div class="tk-eng"><div class="tk-chim"></div><div class="tk-body"><div class="tk-face">' +
        '<div class="tk-eye l"><i></i></div><div class="tk-eye r"><i></i></div><div class="tk-mouth"></div></div></div>' +
        '<div class="tk-bump"></div><div class="tk-wheel l"></div><div class="tk-wheel r"></div></div>';
      world.appendChild(train);
      scene.appendChild(world);
      wrap.append(card, scene);
      ctx.root.appendChild(wrap);

      // ---------- Geometry ----------
      // Junction k (k = 0 … R−1) has its root at (W/2, rootY(k)). Branch i runs up to its sign at
      // (xOf(i), rootY(k) − A), then curves back to the next root at rootY(k) − 2A. The camera keeps
      // the engine at the bottom (JY) while it drives, so the world scrolls down under it.
      let W = 0, H = 0, sz = 56, tz = 64, JY = 0, A = 0;
      function measure() {
        W = scene.clientWidth; H = scene.clientHeight;
        sz = Math.max(40, Math.min(W / (N + 1), 70));
        tz = Math.max(60, Math.min(sz * 1.6, H * 0.32, 112));
        scene.style.setProperty("--sz", `${sz}px`);
        scene.style.setProperty("--tz", `${tz}px`);
        JY = H - 10;                        // the engine's wheels sit here
        const signY = sz * 0.8 + 30;        // a sign's foot, near the top
        A = Math.max(tz * 1.2, JY - signY);
      }
      measure();
      const rootY = (k) => JY - k * 2 * A;
      const xOf = (i) => (W / N) * (i + 0.5);
      const branchD = (k, i) => {
        const y0 = rootY(k), ys = y0 - A, y1 = y0 - 2 * A, cx = W / 2, x = xOf(i);
        return `M${cx} ${y0} C${cx} ${y0 - A * 0.45} ${x} ${ys + A * 0.45} ${x} ${ys}` +
               ` C${x} ${ys - A * 0.45} ${cx} ${y1 + A * 0.45} ${cx} ${y1}`;
      };

      // ---------- The whole line, drawn once ----------
      // Ballast, sleepers, then two rails (a light stroke with a ballast-coloured middle), for every
      // branch of every junction, plus a short stretch below the start and into the station.
      const allD = [];
      for (let k = 0; k < R; k++) for (let i = 0; i < N; i++) allD.push({ k, i, d: branchD(k, i) });
      const lead = `M${W / 2} ${JY + 60} L${W / 2} ${rootY(0)}`;
      const tail = `M${W / 2} ${rootY(R)} L${W / 2} ${rootY(R) - tz * 0.6}`;
      const ds = [lead, tail, ...allD.map((b) => b.d)];
      svg.innerHTML =
        ds.map((d) => `<path d="${d}" fill="none" stroke="#b9a58c" stroke-width="34" stroke-linecap="round"/>`).join("") +
        ds.map((d) => `<path d="${d}" fill="none" stroke="#6b4a2b" stroke-width="28" stroke-dasharray="6 9"/>`).join("") +
        ds.map((d, n) => `<g class="tk-rail" data-n="${n}"><path class="tk-hit" d="${d}" fill="none" stroke="#5d6670" stroke-width="20"/>` +
          `<path d="${d}" fill="none" stroke="#b9a58c" stroke-width="11"/></g>`).join("");
      const rails = [...svg.querySelectorAll(".tk-rail")];
      const junctions = C.rows.map((row, k) => row.map((item, i) => {
        const n = 2 + k * N + i; // index in ds
        const s = document.createElement("button");
        s.className = "tk-sign" + (item.kind === "pic" ? " pic" : "");
        s.textContent = item.text;
        s.style.left = `${xOf(i)}px`;
        s.style.top = `${rootY(k) - A - 14}px`;
        s.setAttribute("aria-label", TEXT.signLabel(item.spoken));
        if (item.kind === "word") s.style.fontSize = `${Math.min(sz * 0.42, (sz * 1.6) / (item.text.length * 0.6))}px`;
        s.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); if (k === step) choose(i); });
        s.addEventListener("click", (e) => { if (e.detail === 0 && k === step) choose(i); });
        world.appendChild(s);
        return { item, sign: s, rail: rails[n], path: rails[n].querySelector(".tk-hit"), x: xOf(i), k };
      }));
      const station = document.createElement("div");
      station.className = "tk-station";
      station.textContent = TEXT.station;
      station.style.left = `${W / 2}px`;
      station.style.top = `${rootY(R) - tz * 1.05}px`;
      world.appendChild(station);
      // A big trophy fills the empty space above the station (at the finish the engine sits at the
      // bottom of the view, so everything above the station would be bare grass).
      const topOfView = rootY(R) - JY, stationTop = rootY(R) - tz * 1.05 - 56;
      const room = Math.max(60, stationTop - topOfView);
      const ty = Math.max(56, Math.min(room * 0.6, W * 0.42, 190));
      const cy = topOfView + room * 0.5;
      const rays = document.createElement("div"), trophy = document.createElement("div");
      rays.className = "tk-rays"; trophy.className = "tk-trophy";
      trophy.textContent = "🏆";
      [rays, trophy].forEach((el) => { el.style.left = `${W / 2}px`; el.style.top = `${cy}px`; el.style.setProperty("--ty", `${ty}px`); world.appendChild(el); });

      let cam = 0;
      function setCam(c) { cam = c; world.style.transform = `translateY(${c.toFixed(1)}px)`; }
      function setTrain(x, y, tilt = 0) { train.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${tilt.toFixed(1)}deg)`; }

      let step = 0, done = false, busy = false;

      // A tap anywhere on the current junction's tracks picks the nearest branch (up to its sign).
      scene.addEventListener("pointerdown", (e) => {
        if (done || busy) return;
        const r = scene.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top - cam;
        let best = -1, bd = Infinity;
        junctions[step].forEach((b, i) => {
          const half = b.path.getTotalLength() / 2;
          for (let k = 4; k <= 24; k++) { const p = b.path.getPointAtLength((half * k) / 24); const d = Math.hypot(p.x - x, p.y - y); if (d < bd) { bd = d; best = i; } }
        });
        if (best >= 0 && bd < W / N / 2) { e.preventDefault(); choose(best); }
      });

      function choose(i) {
        if (done || busy || ctx.ended) return;
        busy = true;
        const b = junctions[step][i];
        b.rail.classList.add("tk-pick");
        tone(1200, 0.04, "square", 0.08); tone(900, 0.05, "square", 0.08, 0.05); // clack of the points
        const len = b.path.getTotalLength();
        const right = b.item.right;
        const until = right ? 1 : 0.44;              // a wrong branch: stop just short of the buffer
        const ms = reduceMotion ? 1 : right ? 1500 : 750;
        const t0 = performance.now();
        let lastChuff = 0, lastPuff = 0, passed = false;
        train.classList.add("go");
        function run(now) {
          const k = Math.min(1, (now - t0) / ms), e = k * k * (3 - 2 * k);
          const at = len * until * e;
          const p = b.path.getPointAtLength(at), q = b.path.getPointAtLength(Math.min(len, at + 4));
          setTrain(p.x, p.y, Math.max(-18, Math.min(18, Math.atan2(q.x - p.x, p.y - q.y) * 57.3)));
          setCam(JY - p.y);                          // the camera follows the engine up the line
          if (right && !passed && at > len * 0.5) { passed = true; if (b.item.kind === "pic") ctx.say(b.item.spoken); }
          if (now - lastChuff > 160) { lastChuff = now; noise(0.06, "bandpass", 700, 400, 0.2); }
          if (!reduceMotion && now - lastPuff > 260) { lastPuff = now; puff(p.x + tz * 0.1, p.y - tz * 1.1); }
          if (k < 1) { ctx.raf(run); return; }
          train.classList.remove("go");
          if (right) arrive(b); else crash(b);
        }
        ctx.raf(run);
      }

      function puff(x, y) {
        const p = document.createElement("div");
        p.className = "tk-puff";
        p.textContent = "💨";
        p.style.left = `${x}px`; p.style.top = `${y}px`;
        fx.appendChild(p);
        ctx.later(() => p.remove(), 900);
      }

      function arrive(b) {
        junctions[step].forEach((x) => x.sign.classList.add("past"));
        step++;
        if (step >= R) { win(); return; }
        busy = false;
      }

      function win() {
        done = true;
        ctx.win();
        train.classList.add("yay");
        [0, 0.35].forEach((d) => { tone(587, 0.25, "square", 0.08, d); tone(740, 0.25, "square", 0.06, d); }); // toot toot
        trophy.classList.add("yay");
        ctx.later(() => ctx.confetti(fx, W / 2, cy, { count: 110 }), 200);
        for (let k = 0; k < 6; k++) {
          const s = document.createElement("div");
          s.className = "tk-sparkle"; s.textContent = "✨";
          s.style.left = `${W / 2 + (Math.random() - 0.5) * ty * 1.6}px`; s.style.top = `${cy + (Math.random() - 0.5) * ty * 1.2}px`;
          s.style.animationDelay = `${k * 80}ms`;
          fx.appendChild(s);
        }
        ctx.say(C.answer);
      }

      function crash(b) {
        done = true;
        ctx.lose();
        const p = b.path.getPointAtLength(b.path.getTotalLength() * 0.5);
        const stop = document.createElement("div");
        stop.className = "tk-stop";
        stop.style.left = `${p.x}px`; stop.style.top = `${p.y + 6}px`;
        world.appendChild(stop);
        train.classList.add("bonk");
        noise(0.2, "lowpass", 1500, 200, 0.6);
        tone(150, 0.15, "square", 0.12); // BONK
        sweep(800, 300, 0.5, "sine", 0.06, 0.15); // pfff
        if (!reduceMotion) [0, 1, 2].forEach((k) => ctx.later(() => puff(p.x + (k - 1) * 18, p.y - tz * 0.4), k * 90));
        ctx.later(() => { showRight(); ctx.say(C.answer); }, 450);
      }
      function showRight() {
        const row = junctions[Math.min(step, R - 1)];
        row.forEach((b) => { b.sign.classList.add(b.item.right ? "right" : "dim"); if (b.item.right) b.rail.classList.add("tk-pick"); });
      }
      function replay() { if (!done) ctx.say(C.prompt); }

      ctx.onTimeout(() => { done = true; showRight(); ctx.say(C.answer); });
      function onKey(e) {
        const i = parseInt(e.key, 10) - 1;
        if (i >= 0 && i < N) { e.preventDefault(); choose(i); }
        else if (e.key === " ") { e.preventDefault(); replay(); }
      }
      document.addEventListener("keydown", onKey);

      setCam(0);
      setTrain(W / 2, JY);
      ctx.say(C.prompt);
      // Show the target big in the middle for a moment before play starts (ctx.reveal).
      ctx.reveal(card);

      // Tutorial: point at the card, then at each junction tap the right sign and wait for the drive.
      ctx.tutorial(C.target, async (f) => {
        await f.point(card);
        for (let k = 0; k < R; k++) {
          const b = junctions[k].find((x) => x.item.right);
          await f.tap(b.sign);
          await f.until(() => !busy || done, 4000);
        }
      });

      return () => { done = true; document.removeEventListener("keydown", onKey); };
    },
  });
})();
