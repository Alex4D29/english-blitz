// MONKEY SWING — a monkey climbs a jungle, level by level, to a comically BIG banana at the top. Each
// level has a row of swinging vines, each holding a sign; tap the vine with the target and the monkey
// leaps up and grabs it (it swings with the vine). A wrong vine snaps and the monkey drops into the
// bush below (BONK, dizzy stars). After the last level it leaps onto the top branch and munches the
// giant banana. Only the next level is live. Content comes from ctx.choiceRows (ABC: half the rounds
// are capital → lowercase). 3 levels, 4 from 1.5×; 4 vines a level from 2×; vines swing faster with speed.
(function () {
  const TEXT = {
    name: { en: "Monkey Swing" },
    icon: "🐒",
    howTo: (list) => ({ en: {
      steps: [
        ["🍌", "The monkey wants the GIANT banana at the top!"],
        list.type === "hfw" ? ["👂", "Listen to the word, like \"the\"."] : ["👀", "Look at the card at the top."],
        ["🐒", "Tap the vine with the same one. The monkey jumps up and grabs it!"],
        ["⬆️", "Vine by vine, all the way up!"],
      ],
      tips: [
        "Tap the card to hear it again.",
        "A wrong vine snaps… BONK! The right one glows.",
        "When the game speeds up, there are more vines and they swing faster.",
      ],
    } }),
    instruction: { en: "SWING TO\nTHE BANANA!" },
    cardLabel: "Hear it again",
    vineLabel: (t) => `Grab ${t}`,
  };

  const CSS = `
  .mk { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:8px; padding-bottom:8px; }
  .mk-card { flex:none; min-width:84px; height:72px; padding:0 18px; border-radius:18px; font:inherit; font-size:2.6rem; line-height:1; background:#fff; color:#111;
    border:5px solid #111; box-shadow:0 6px 0 #111; display:flex; align-items:center; justify-content:center; gap:8px; cursor:pointer; touch-action:manipulation; }
  .mk-card .spk { font-size:1.3rem; opacity:.6; }
  .mk-jungle { position:relative; flex:1; min-height:0; width:100%; max-width:520px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111;
    background:linear-gradient(180deg, #7fd6ff 0%, #b8f0a0 45%, #4fae4a 100%); }
  .mk-leaves { position:absolute; left:-10%; right:-10%; top:-30px; height:70px; border-radius:0 0 50% 50%; background:#2e8f38; border-bottom:5px solid #111; z-index:1; }
  .mk-top { position:absolute; left:8%; right:8%; height:14px; background:#7a4d29; border:4px solid #111; border-radius:99px; z-index:2; }
  .mk-banana { position:absolute; left:50%; font-size:var(--bn); line-height:1; transform:translate(-50%, -88%) rotate(-12deg); z-index:3;
    filter:drop-shadow(0 6px 0 rgba(0,0,0,.3)); animation:mk-shine 1.2s ease-in-out infinite alternate; }
  .mk-banana.eat { animation:mk-eat .9s steps(3) forwards; }
  .mk-bush { position:absolute; left:50%; bottom:-30px; width:70%; height:90px; margin-left:-35%; background:#3f9d3c; border:5px solid #111; border-radius:50% 50% 0 0; z-index:1;
    box-shadow:inset 0 10px 0 #5cc055; }
  .mk-branch { position:absolute; left:4%; right:4%; height:10px; background:#8b5a2b; border:3px solid #111; border-radius:99px; z-index:2; }
  .mk-vine { position:absolute; left:0; top:0; width:0; z-index:3; }
  .mk-rope { position:absolute; left:-4px; top:0; width:8px; background:repeating-linear-gradient(180deg, #3e9a3a 0 10px, #2b7a28 10px 14px); border:2px solid #111; border-radius:4px; }
  .mk-sign { position:absolute; left:0; transform:translate(-50%, 0); min-width:var(--sz); height:calc(var(--sz) * .8); padding:0 6px; border:4px solid #111; border-radius:12px;
    background:#fff6d6; color:#111; font:inherit; font-size:calc(var(--sz) * .5); line-height:1; display:flex; align-items:center; justify-content:center; white-space:nowrap;
    box-shadow:0 4px 0 #111; cursor:pointer; touch-action:manipulation; }
  .mk-sign.pic { font-size:calc(var(--sz) * .48); }
  .mk-vine.live .mk-sign { box-shadow:0 0 0 4px #fff, 0 4px 0 4px #111; animation:mk-live .8s ease-in-out infinite alternate; }
  .mk-vine.snap .mk-low { animation:mk-fall .6s ease-in forwards; }
  .mk-vine.right .mk-sign { background:#b8ffcf; box-shadow:0 0 0 5px #fff, 0 0 0 10px #00b86b; }
  .mk-vine.dim { opacity:.5; }
  .mk-monkey { position:absolute; left:0; top:0; width:var(--mz); height:var(--mz); margin:calc(var(--mz) * -.15) 0 0 calc(var(--mz) * -.5); z-index:5; pointer-events:none; will-change:transform; }
  .mk-arm { position:absolute; top:-6%; width:14%; height:44%; background:#8b5a2b; border:3px solid #111; border-radius:99px; }
  .mk-arm.l { left:22%; transform:rotate(-14deg); } .mk-arm.r { right:22%; transform:rotate(14deg); }
  .mk-body { position:absolute; left:26%; right:26%; top:52%; bottom:0; background:#8b5a2b; border:3px solid #111; border-radius:45%; }
  .mk-head { position:absolute; left:14%; right:14%; top:14%; height:52%; background:#8b5a2b; border:3px solid #111; border-radius:50%; }
  .mk-face { position:absolute; left:16%; right:16%; top:30%; bottom:8%; background:#f2c99a; border-radius:50% 50% 46% 46%; }
  .mk-ear { position:absolute; top:26%; width:22%; height:30%; background:#f2c99a; border:3px solid #111; border-radius:50%; }
  .mk-ear.l { left:4%; } .mk-ear.r { right:4%; }
  .mk-eye { position:absolute; top:34%; width:14%; height:16%; background:#111; border-radius:50%; }
  .mk-eye.l { left:32%; } .mk-eye.r { right:32%; }
  .mk-mouth { position:absolute; left:38%; right:38%; top:50%; height:8%; border-bottom:3px solid #111; border-radius:0 0 50% 50%; }
  .mk-monkey.dizzy .mk-eye { height:5%; top:40%; }
  .mk-monkey.dizzy .mk-mouth { border-bottom:0; border-top:3px solid #111; border-radius:50% 50% 0 0; top:56%; }
  .mk-monkey.happy .mk-mouth { height:12%; background:#c0392b; border:3px solid #111; }
  .mk-stars { position:absolute; left:50%; top:0; transform:translateX(-50%); font-size:1.2rem; animation:mk-spin 1s linear infinite; white-space:nowrap; }
  .mk-fx { position:absolute; inset:0; pointer-events:none; overflow:visible; z-index:6; }

  @keyframes mk-shine { from { filter:drop-shadow(0 6px 0 rgba(0,0,0,.3)) brightness(1); } to { filter:drop-shadow(0 6px 0 rgba(0,0,0,.3)) drop-shadow(0 0 12px #fff27a) brightness(1.1); } }
  @keyframes mk-eat { 0% { clip-path:inset(0 0 0 0); } 100% { clip-path:inset(0 100% 0 0); } }
  @keyframes mk-live { from { transform:translate(-50%, 0) scale(1); } to { transform:translate(-50%, 0) scale(1.07); } }
  @keyframes mk-fall { to { transform:translateY(240px) rotate(40deg); opacity:0; } }
  @keyframes mk-spin { from { transform:translateX(-50%) rotate(0); } to { transform:translateX(-50%) rotate(360deg); } }
  @media (prefers-reduced-motion: reduce) { .mk-banana, .mk-vine.live .mk-sign, .mk-stars { animation:none !important; } }`;

  function injectCss() {
    if (document.getElementById("mk-css")) return;
    const style = document.createElement("style");
    style.id = "mk-css";
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  registerMicrogame({
    id: "monkey-swing",
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
      wrap.className = "mk";
      const card = document.createElement("button");
      card.className = "mk-card";
      card.setAttribute("aria-label", TEXT.cardLabel);
      card.innerHTML = '<span class="ct"></span>';
      card.firstChild.textContent = C.cardText;
      if (ctx.canSpeak && !C.listen) card.insertAdjacentHTML("beforeend", '<span class="spk">🔊</span>');
      card.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });
      const jungle = document.createElement("div");
      jungle.className = "mk-jungle";
      jungle.innerHTML = '<div class="mk-leaves"></div><div class="mk-top"></div><div class="mk-banana">🍌</div><div class="mk-bush"></div><div class="mk-fx"></div>';
      const topBar = jungle.querySelector(".mk-top"), banana = jungle.querySelector(".mk-banana"), fx = jungle.querySelector(".mk-fx");
      wrap.append(card, jungle);
      ctx.root.appendChild(wrap);

      const branches = [...Array(R)].map(() => { const b = document.createElement("div"); b.className = "mk-branch"; jungle.appendChild(b); return b; });
      const vines = C.rows.map((row, r) => row.map((item, i) => {
        const v = document.createElement("div");
        v.className = "mk-vine";
        v.innerHTML = '<div class="mk-low"><div class="mk-rope"></div><button class="mk-sign"></button></div>';
        const sign = v.querySelector(".mk-sign");
        sign.textContent = item.text;
        if (item.kind === "pic") sign.classList.add("pic");
        sign.setAttribute("aria-label", TEXT.vineLabel(item.spoken));
        sign.addEventListener("pointerdown", (e) => { e.preventDefault(); grab(r, i); });
        sign.addEventListener("click", (e) => { if (e.detail === 0) grab(r, i); });
        jungle.appendChild(v);
        return { el: v, rope: v.querySelector(".mk-rope"), sign, item, r, i, ph: Math.random() * 6.28, ax: 0, ay: 0, L: 0, ang: 0 };
      }));
      const monkey = document.createElement("div");
      monkey.className = "mk-monkey";
      monkey.innerHTML = '<div class="mk-arm l"></div><div class="mk-arm r"></div><div class="mk-body"></div><div class="mk-head"><div class="mk-ear l"></div><div class="mk-ear r"></div>' +
        '<div class="mk-face"></div><div class="mk-eye l"></div><div class="mk-eye r"></div><div class="mk-mouth"></div></div>';
      jungle.appendChild(monkey);

      // ---------- Layout ----------
      let W = 0, H = 0, sz = 56, topY = 0, groundY = 0;
      function layout() {
        W = jungle.clientWidth; H = jungle.clientHeight;
        topY = Math.max(96, H * 0.22);
        groundY = H - 46;
        const gap = (groundY - topY) / (R + 0.3);
        sz = Math.max(42, Math.min(W / (N + 1), gap * 0.5, 76));
        jungle.style.setProperty("--sz", `${sz}px`);
        jungle.style.setProperty("--mz", `${sz * 1.35}px`);
        jungle.style.setProperty("--bn", `${Math.min(W * 0.55, topY * 1.9, 210)}px`); // comically BIG
        topBar.style.top = `${topY}px`;
        banana.style.top = `${topY + 4}px`;
        branches.forEach((b, r) => {
          const ay = groundY - gap * (r + 1) - sz * 0.2;
          b.style.top = `${ay - 6}px`;
          vines[r].forEach((v) => {
            v.ax = (W / N) * (v.i + 0.5); v.ay = ay; v.L = gap * 0.5;
            v.el.style.left = `${v.ax}px`; v.el.style.top = `${v.ay}px`;
            v.rope.style.height = `${v.L}px`;
            v.sign.style.top = `${v.L}px`;
            if (v.item.kind === "word") v.sign.style.fontSize = `${Math.min(sz * 0.42, (sz * 1.5) / (v.item.text.length * 0.6))}px`;
          });
        });
      }
      const swingAmp = reduceMotion ? 0 : 0.16 + 0.05 * (speed - 1);
      const swingRate = 0.0018 * (0.8 + 0.35 * speed);
      // The monkey hangs just under the sign, so the sign stays readable.
      const handOf = (v) => { const l = v.L + sz * 0.8; return { x: v.ax + Math.sin(v.ang) * l, y: v.ay + Math.cos(v.ang) * l }; };

      let level = -1, onVine = null, jump = null, done = false, pos = { x: 0, y: 0 };
      function setLive() { vines.forEach((row, r) => row.forEach((v) => v.el.classList.toggle("live", !done && !jump && r === level + 1))); }
      function frame(now) {
        vines.flat().forEach((v) => {
          if (v.snapped) return;
          v.ang = Math.sin(now * swingRate + v.ph) * swingAmp;
          v.el.firstChild.style.transform = `rotate(${(-v.ang * 180) / Math.PI}deg)`;
          v.el.firstChild.style.transformOrigin = "0 0";
        });
        if (jump) {
          const k = Math.min(1, (now - jump.t0) / jump.ms), to = jump.to();
          pos = { x: jump.from.x + (to.x - jump.from.x) * k, y: jump.from.y + (to.y - jump.from.y) * k - Math.sin(k * Math.PI) * sz * 0.9 };
          if (k >= 1) { const then = jump.then; jump = null; then(); }
        } else if (onVine) pos = handOf(onVine);
        monkey.style.transform = `translate(${pos.x.toFixed(1)}px, ${pos.y.toFixed(1)}px) rotate(${onVine && !jump ? (-onVine.ang * 180) / Math.PI : 0}deg)`;
        ctx.raf(frame);
      }
      layout();
      pos = { x: W / 2, y: groundY - sz * 0.9 };
      setLive();
      ctx.raf(frame);
      const ro = new ResizeObserver(() => { layout(); if (level < 0 && !jump) pos = { x: W / 2, y: groundY - sz * 0.9 }; });
      ro.observe(jungle);

      function grab(r, i) {
        if (done || ctx.ended || jump || r !== level + 1) return;
        const v = vines[r][i];
        sweep(300, 800, 0.18, "square", 0.07); // whoop
        onVine = null;
        jump = { from: { ...pos }, to: () => handOf(v), t0: performance.now(), ms: 360, then: () => land(v) };
        setLive();
      }
      function land(v) {
        if (!v.item.right) { snap(v); return; }
        level = v.r; onVine = v;
        tone(880, 0.06, "square", 0.07); tone(1175, 0.08, "square", 0.07, 0.07); // ooh-ooh
        if (v.item.kind === "pic") ctx.say(v.item.spoken);
        if (level === R - 1) {
          ctx.later(() => {
            onVine = null;
            sweep(300, 900, 0.2, "square", 0.07);
            jump = { from: { ...pos }, to: () => ({ x: W / 2 - sz * 0.9, y: topY - sz * 0.6 }), t0: performance.now(), ms: 380, then: win };
          }, 180);
        }
        setLive();
      }
      function win() {
        done = true;
        ctx.win();
        setLive();
        monkey.classList.add("happy");
        banana.classList.add("eat");
        [0, 0.3, 0.6].forEach((d) => noise(0.08, "bandpass", 900, 1400, 0.3, d)); // munch munch munch
        ctx.later(() => ctx.confetti(fx, W / 2, topY), 300);
        ctx.say(C.answer);
      }
      function snap(v) {
        done = true;
        ctx.lose();
        v.snapped = true;
        v.el.classList.add("snap");
        noise(0.06, "highpass", 2000, 4000, 0.4); // snap
        // The monkey drops into the bush.
        const from = { ...pos };
        jump = { from, to: () => ({ x: from.x, y: H - 56 }), t0: performance.now(), ms: 420, then: () => {
          monkey.classList.add("dizzy");
          noise(0.15, "lowpass", 800, 200, 0.6);
          tone(180, 0.12, "square", 0.1); // BONK
          const s = document.createElement("div");
          s.className = "mk-stars";
          s.textContent = "💫⭐💫";
          monkey.appendChild(s);
          ctx.later(() => { showRight(v.r); ctx.say(C.answer); }, 250);
        } };
        setLive();
      }
      function showRight(r) { vines[r].forEach((q) => q.el.classList.add(q.item.right ? "right" : "dim")); }
      function replay() { if (!done) ctx.say(C.prompt); }

      ctx.onTimeout(() => {
        done = true;
        setLive();
        monkey.classList.add("dizzy");
        if (level + 1 < R) showRight(level + 1);
        ctx.say(C.answer);
      });
      function onKey(e) {
        const i = parseInt(e.key, 10) - 1;
        if (i >= 0 && i < N) { e.preventDefault(); grab(level + 1, i); }
        else if (e.key === " ") { e.preventDefault(); replay(); }
      }
      document.addEventListener("keydown", onKey);
      ctx.say(C.prompt);
      return () => { done = true; ro.disconnect(); document.removeEventListener("keydown", onKey); };
    },
  });
})();
