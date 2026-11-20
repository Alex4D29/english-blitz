// TRACK SWITCH — a little train chugs up to a junction where the track fans out into several branches,
// each ending at a sign. Tap the branch (or its sign) with the target: the points switch, the train
// chugs along it, and the next junction slides in. A wrong branch ends at a buffer stop: BONK, a puff
// of steam, the round is lost and the right branch glows. After the last junction the train pulls
// into the station: toot toot, flags, confetti. Content comes from ctx.choiceRows (ABC: half the rounds
// are capital → lowercase). 3 junctions, 4 from 1.5×; 4 branches from 2×.
(function () {
  const TEXT = {
    name: { en: "Train Tracks" },
    icon: "🚂",
    howTo: (list) => ({ en: {
      steps: [
        list.type === "hfw" ? ["👂", "Listen to the word, like \"the\"."] : ["👀", "Look at the card at the top."],
        ["🛤️", "The track splits! Tap the track with the same one."],
        ["🚂", "Junction by junction, get the train to the station!"],
      ],
      tips: [
        "Tap the card to hear it again.",
        "A wrong track ends at a stop… BONK! The right one glows.",
        "When the game speeds up, there are more junctions and more tracks.",
      ],
    } }),
    instruction: { en: "SWITCH THE\nTRACKS!" },
    cardLabel: "Hear it again",
    signLabel: (t) => `Take the track to ${t}`,
  };

  const SVG_NS = "http://www.w3.org/2000/svg";
  const CSS = `
  .tk { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:8px; padding-bottom:8px; }
  .tk-card { flex:none; min-width:84px; height:72px; padding:0 18px; border-radius:18px; font:inherit; font-size:2.6rem; line-height:1; background:#fff; color:#111;
    border:5px solid #111; box-shadow:0 6px 0 #111; display:flex; align-items:center; justify-content:center; gap:8px; cursor:pointer; touch-action:manipulation; }
  .tk-card .spk { font-size:1.3rem; opacity:.6; }
  .tk-scene { position:relative; flex:1; min-height:0; width:100%; max-width:520px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111;
    background:#7ccf5a; background-image:radial-gradient(circle, #93dd72 3px, transparent 4px); background-size:28px 28px; touch-action:manipulation; }
  .tk-layer { position:absolute; inset:0; transition:transform .55s cubic-bezier(.4,0,.2,1), opacity .4s; }
  .tk-layer svg { position:absolute; inset:0; width:100%; height:100%; overflow:visible; }
  .tk-layer.out { opacity:0; transform:translateY(40%); }
  .tk-layer.in { transform:translateY(-100%); }
  .tk-pick { filter:drop-shadow(0 0 6px #fff) brightness(1.15); }
  .tk-sign { position:absolute; transform:translate(-50%, -100%); min-width:var(--sz); height:calc(var(--sz) * .8); padding:0 6px; border:4px solid #111; border-radius:12px;
    background:#fff; color:#111; font:inherit; font-size:calc(var(--sz) * .5); line-height:1; display:flex; align-items:center; justify-content:center; white-space:nowrap;
    box-shadow:0 4px 0 #111; cursor:pointer; touch-action:manipulation; z-index:3; }
  .tk-sign::after { content:""; position:absolute; left:50%; top:100%; width:6px; height:14px; margin-left:-3px; background:#6b4a2b; border:2px solid #111; }
  .tk-sign.pic { font-size:calc(var(--sz) * .48); }
  .tk-sign.right { background:#b8ffcf; box-shadow:0 0 0 5px #fff, 0 0 0 10px #00b86b; animation:tk-wiggle .4s ease-in-out 3; }
  .tk-sign.dim { opacity:.5; }
  .tk-stop { position:absolute; width:calc(var(--sz) * .9); height:16px; transform:translate(-50%, -50%); border:3px solid #111; border-radius:4px; z-index:2;
    background:repeating-linear-gradient(45deg, #e8173c 0 8px, #fff 8px 16px); animation:tk-in .25s cubic-bezier(.2,1.8,.4,1); }
  .tk-station { position:absolute; left:50%; top:4px; transform:translateX(-50%); padding:6px 16px; background:#fff3d6; border:5px solid #111; border-radius:12px 12px 0 0;
    font-size:1.6rem; line-height:1; z-index:2; box-shadow:0 5px 0 #111; white-space:nowrap; }
  .tk-train { position:absolute; left:0; top:0; font-size:var(--tz); line-height:1; transform-origin:50% 60%; z-index:4; pointer-events:none; will-change:transform;
    filter:drop-shadow(0 4px 0 rgba(0,0,0,.3)); }
  .tk-train span { display:block; transform:translate(-50%, -60%); }
  .tk-train.bonk span { animation:tk-bonk .4s ease-out; }
  .tk-puff { position:absolute; font-size:1.4rem; transform:translate(-50%, -50%); animation:tk-puff .9s ease-out forwards; z-index:5; pointer-events:none; }
  .tk-fx { position:absolute; inset:0; pointer-events:none; overflow:visible; z-index:6; }

  @keyframes tk-wiggle { 25% { transform:translate(-50%, -100%) rotate(-7deg); } 75% { transform:translate(-50%, -100%) rotate(7deg); } }
  @keyframes tk-in { from { transform:translate(-50%, -50%) scale(.2); } }
  @keyframes tk-bonk { 30% { transform:translate(-50%, -40%) rotate(10deg); } 60% { transform:translate(-50%, -64%) rotate(-6deg); } }
  @keyframes tk-puff { from { opacity:.9; transform:translate(-50%, -50%) scale(.5); } to { opacity:0; transform:translate(-50%, -160%) scale(1.8); } }
  @media (prefers-reduced-motion: reduce) { .tk-sign.right, .tk-puff, .tk-train.bonk span { animation:none !important; } .tk-layer { transition:none; } }`;

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
      scene.innerHTML = '<div class="tk-fx"></div>';
      const fx = scene.firstChild;
      const train = document.createElement("div");
      train.className = "tk-train";
      train.innerHTML = "<span>🚂</span>";
      scene.appendChild(train);
      wrap.append(card, scene);
      ctx.root.appendChild(wrap);

      let W = 0, H = 0, sz = 56, jx = 0, jy = 0, ey = 0;
      function measure() {
        W = scene.clientWidth; H = scene.clientHeight;
        sz = Math.max(40, Math.min(W / (N + 1), 70));
        scene.style.setProperty("--sz", `${sz}px`);
        scene.style.setProperty("--tz", `${Math.max(40, sz * 0.9)}px`);
        jx = W / 2; jy = H - 34; ey = sz * 1.5 + 14;
      }
      measure();

      // ---------- One junction: a layer with N branches and their signs ----------
      const branchPath = (i) => {
        const ex = (W / N) * (i + 0.5), dy = jy - ey;
        return `M${jx} ${jy} C${jx} ${jy - dy * 0.45} ${ex} ${ey + dy * 0.45} ${ex} ${ey}`;
      };
      let step = 0, done = false, busy = false, layer = null, branches = [];
      function buildLayer(r) {
        const L = document.createElement("div");
        L.className = "tk-layer";
        const svg = document.createElementNS(SVG_NS, "svg");
        const paths = C.rows[r].map((_, i) => branchPath(i));
        // Ballast, sleepers, then two rails (a light stroke with a ballast-coloured middle).
        svg.innerHTML = paths.map((d) => `<path d="${d}" fill="none" stroke="#b9a58c" stroke-width="34" stroke-linecap="round"/>`).join("") +
          paths.map((d) => `<path d="${d}" fill="none" stroke="#6b4a2b" stroke-width="28" stroke-dasharray="6 9"/>`).join("") +
          paths.map((d, i) => `<g class="tk-rail" data-i="${i}"><path class="tk-hit" d="${d}" fill="none" stroke="#5d6670" stroke-width="20"/>` +
            `<path d="${d}" fill="none" stroke="#b9a58c" stroke-width="11"/></g>`).join("");
        L.appendChild(svg);
        const items = C.rows[r].map((item, i) => {
          const s = document.createElement("button");
          s.className = "tk-sign" + (item.kind === "pic" ? " pic" : "");
          s.textContent = item.text;
          s.style.left = `${(W / N) * (i + 0.5)}px`;
          s.style.top = `${ey - 16}px`;
          s.setAttribute("aria-label", TEXT.signLabel(item.spoken));
          if (item.kind === "word") s.style.fontSize = `${Math.min(sz * 0.42, (sz * 1.6) / (item.text.length * 0.6))}px`;
          s.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); choose(i); });
          s.addEventListener("click", (e) => { if (e.detail === 0) choose(i); });
          L.appendChild(s);
          return { item, sign: s, path: svg.querySelectorAll(".tk-hit")[i], rail: svg.querySelectorAll(".tk-rail")[i], x: (W / N) * (i + 0.5) };
        });
        scene.insertBefore(L, train);
        return { el: L, items };
      }
      function setTrain(x, y) { train.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`; }

      // A tap anywhere on the tracks picks the nearest branch.
      scene.addEventListener("pointerdown", (e) => {
        if (done || busy || !layer) return;
        const r = scene.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
        let best = -1, bd = Infinity;
        layer.items.forEach((b, i) => {
          const len = b.path.getTotalLength();
          for (let k = 0; k <= 40; k++) { const p = b.path.getPointAtLength((len * k) / 40); const d = Math.hypot(p.x - x, p.y - y); if (d < bd) { bd = d; best = i; } }
        });
        if (best >= 0 && bd < W / N / 2) { e.preventDefault(); choose(best); }
      });

      function choose(i) {
        if (done || busy || ctx.ended) return;
        busy = true;
        const b = layer.items[i];
        b.rail.classList.add("tk-pick");
        tone(1200, 0.04, "square", 0.08); tone(900, 0.05, "square", 0.08, 0.05); // clack of the points
        const len = b.path.getTotalLength(), t0 = performance.now(), ms = reduceMotion ? 1 : 900;
        let lastChuff = 0, lastPuff = 0;
        function run(now) {
          const k = Math.min(1, (now - t0) / ms), e = k * k * (3 - 2 * k);
          const p = b.path.getPointAtLength(len * e);
          setTrain(p.x, p.y);
          if (now - lastChuff > 160) { lastChuff = now; noise(0.06, "bandpass", 700, 400, 0.2); }
          if (!reduceMotion && now - lastPuff > 260) { lastPuff = now; puff(p.x + sz * 0.2, p.y - sz * 0.5); }
          if (k < 1) { ctx.raf(run); return; }
          if (b.item.right) arrive(b); else crash(b);
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
        if (b.item.kind === "pic") ctx.say(b.item.spoken);
        step++;
        if (step >= R) { win(b); return; }
        // Slide the old junction away, the new one in, and roll the train back to the bottom.
        const old = layer.el;
        old.classList.add("out");
        ctx.later(() => old.remove(), 600);
        layer = buildLayer(step);
        layer.el.classList.add("in");
        void layer.el.offsetWidth;
        layer.el.classList.remove("in");
        train.style.transition = reduceMotion ? "" : "transform .55s cubic-bezier(.4,0,.2,1)";
        setTrain(jx, jy);
        ctx.later(() => { train.style.transition = ""; busy = false; }, reduceMotion ? 10 : 560);
      }

      function win(b) {
        done = true;
        ctx.win();
        const st = document.createElement("div");
        st.className = "tk-station";
        st.textContent = "🏁 🎉 🏁";
        scene.appendChild(st);
        train.style.transition = "transform .5s ease-out";
        setTrain(W / 2, ey - sz * 0.1);
        [0, 0.35].forEach((d) => { tone(587, 0.25, "square", 0.08, d); tone(740, 0.25, "square", 0.06, d); }); // toot toot
        ctx.later(() => ctx.confetti(fx, W / 2, ey), 300);
        ctx.say(C.answer);
      }

      function crash(b) {
        done = true;
        ctx.lose();
        const stop = document.createElement("div");
        stop.className = "tk-stop";
        stop.style.left = `${b.x}px`; stop.style.top = `${ey - 4}px`;
        layer.el.appendChild(stop);
        train.classList.add("bonk");
        noise(0.2, "lowpass", 1500, 200, 0.6);
        tone(150, 0.15, "square", 0.12); // BONK
        sweep(800, 300, 0.5, "sine", 0.06, 0.15); // pfff
        if (!reduceMotion) [0, 1, 2].forEach((k) => ctx.later(() => puff(b.x + (k - 1) * 18, ey - sz * 0.6), k * 90));
        ctx.later(() => { showRight(); ctx.say(C.answer); }, 450);
      }
      function showRight() {
        if (!layer) return;
        layer.items.forEach((b) => { b.sign.classList.add(b.item.right ? "right" : "dim"); if (b.item.right) b.rail.classList.add("tk-pick"); });
      }
      function replay() { if (!done) ctx.say(C.prompt); }

      ctx.onTimeout(() => { done = true; showRight(); ctx.say(C.answer); });
      function onKey(e) {
        const i = parseInt(e.key, 10) - 1;
        if (i >= 0 && i < N) { e.preventDefault(); choose(i); }
        else if (e.key === " ") { e.preventDefault(); replay(); }
      }
      document.addEventListener("keydown", onKey);

      layer = buildLayer(0);
      setTrain(jx, jy);
      ctx.say(C.prompt);
      return () => { done = true; document.removeEventListener("keydown", onKey); };
    },
  });
})();
