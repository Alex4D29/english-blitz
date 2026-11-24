// BASEBALL BASH — a listening game (the teacher's design). First person at home plate, bat in hand. Out on
// the mound, a silly pitcher monster winds up and SAYS the target as it throws (only heard: the target is
// never shown, unless listening games are off). The answers are three big buttons BELOW the
// field (they used to be signs on the outfield fence, but kids thought they had to tap where the ball was going:
// the teacher). The ball takes a couple of seconds to reach you (less when it's faster); when it gets close (the
// zone turns green), tap the button with what you heard and you hit it out. The right one: CRACK, HOME RUN!, it flies
// out over the fence. The wrong one, or no swing in time: STRIKE! Each pitch has a new target. 2 home runs win;
// 3 strikes and you're out.
(function () {
  const TEXT = {
    name: { en: "Baseball Bash" },
    icon: "⚾",
    howTo: (list) => ({ en: {
      steps: [
        ["👂", "Listen! The pitcher shouts what to hit as it throws the ball."],
        ["⚾", "Wait for the ball to reach you (the plate lights up)…"],
        ["🏏", "…then tap the button below with what you heard. The right one is a HOME RUN! Hit 2 to win."],
      ],
      tips: [
        "Too early? Wait for the ball!",
        "The wrong button, or no swing, is a STRIKE. Three strikes and you're out!",
        "Tap the pitcher to hear it again.",
        "When the game speeds up, the ball comes faster.",
      ],
    } }),
    instruction: { en: "HIT A\nHOME RUN!" },
    pitcherLabel: "Pitcher. Tap to hear it again.",
    signLabel: (t) => `Hit it to ${t}`,
    homer: "HOME RUN!",
    strike: "STRIKE!",
    out: "STRIKE OUT!",
    wait: "WAIT FOR IT!",
    zoneWait: "WAIT…",   // on the hit zone while the ball is on its way (red)
    zoneHit: "HIT!",     // …and when it's in range (green)
    listen: "🔊",
  };
  const GOAL = 2, STRIKES = 3;

  const CSS = `
  .bb { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:6px; padding-bottom:8px; }
  .bb-pips { flex:none; display:flex; gap:14px; align-items:center; min-height:30px; }
  .bb-row { display:flex; gap:5px; }
  .bb-pip { width:24px; height:24px; border:3px solid #111; border-radius:50%; background:#fff; display:flex; align-items:center; justify-content:center; font-size:13px; line-height:1; }
  .bb-pip.on { background:#ffd400; } .bb-pip.on::after { content:"⚾"; }
  .bb-pip.k.on { background:#444; } .bb-pip.k.on::after { content:"K"; color:#fff; font-weight:900; }
  /* The ballpark from home plate: sky, a fence with three signs, the outfield, the infield dirt, the mound */
  .bb-park { position:relative; flex:1; min-height:0; width:100%; max-width:560px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111; touch-action:none;
    background:linear-gradient(180deg, #8fd3ff 0 26%, #2f7a2f 26% 27%, #c98a4b 27% 31%, transparent 31%), repeating-linear-gradient(90deg, #5cc34a 0 44px, #4fb23f 44px 88px); }   /* sky, the fence's foot, the warning track, mown grass */
  /* The infield: a brown square (a diamond, seen from home plate) with chalk base lines, the mound in the middle */
  .bb-diamond { position:absolute; left:4%; width:92%; top:34%; height:70%; /* (an explicit width: an svg doesn't stretch between left and right, so it sat off centre) */ z-index:1; overflow:visible; pointer-events:none; }
  /* The hit zone round home plate: red while the ball's on its way, GREEN when it's in range (the teacher asked for it) */
  .bb-zone { position:absolute; left:50%; bottom:0; width:56%; height:24%; transform:translateX(-50%); z-index:2; pointer-events:none; border:5px solid #e8173c; border-bottom:0;
    border-radius:50% 50% 0 0 / 70% 70% 0 0; background:rgba(255,77,109,.45); display:flex; justify-content:center; align-items:flex-start; padding-top:4px; transition:background .1s, border-color .1s; }
  .bb-zone::after { content:attr(data-wait); font-size:1.1rem; color:#fff; -webkit-text-stroke:1.5px #111; paint-order:stroke fill; }
  .bb-park.ready .bb-zone { background:rgba(60,220,100,.6); border-color:#00b86b; box-shadow:0 0 24px 8px rgba(80,255,130,.6); }
  .bb-park.ready .bb-zone::after { content:attr(data-hit); font-size:1.5rem; color:#fff; }
  .bb-park.idle .bb-zone { opacity:.35; }
  /* The answers: big buttons below the field (not on the fence: kids tapped where the ball was going) */
  .bb-opts { flex:none; display:flex; gap:10px; justify-content:center; width:100%; max-width:560px; padding:0 8px; }
  .bb-sign { flex:1; max-width:150px; height:var(--sh); padding:0 6px; font:inherit; cursor:pointer; touch-action:manipulation;
    background:#fff; color:#111; border:5px solid #111; border-radius:16px; box-shadow:0 6px 0 #111; display:flex; align-items:center; justify-content:center; line-height:1; white-space:nowrap; overflow:hidden; }
  .bb-sign .tx { font-size:var(--sf); }
  .bb.ready .bb-sign { box-shadow:0 0 0 5px #ffd400, 0 5px 0 #111; animation:bb-ready .3s ease-in-out infinite alternate; }
  .bb-sign.right { background:#b8ffcf; box-shadow:0 0 0 5px #fff, 0 0 0 10px #00b86b; }
  .bb-sign.bad { background:#ff5a6e; color:#fff; }
  .bb-plate { position:absolute; left:50%; bottom:5%; width:70px; height:24px; transform:translateX(-50%); background:#fff; border:4px solid #111; clip-path:polygon(0 0, 100% 0, 100% 55%, 50% 100%, 0 55%); z-index:2; }
  .bb-park.ready .bb-plate { background:#b8ffcf; }
  .bb-plate { z-index:3; }
  /* The pitcher: a round blue monster in a red cap, on the mound. --pz is its size */
  .bb-pitcher { position:absolute; left:50%; top:var(--py); width:var(--pz); height:var(--pz); transform:translate(-50%, -100%); z-index:3; cursor:pointer; }
  .bb-pbody { position:absolute; left:12%; right:12%; top:20%; bottom:0; background:#3d7bff; border:4px solid #111; border-radius:46% 46% 34% 34%; }
  .bb-pcap { position:absolute; left:14%; right:14%; top:8%; height:22%; background:#e8173c; border:4px solid #111; border-radius:50% 50% 8% 8%; z-index:2; }
  .bb-pcap::after { content:""; position:absolute; left:-26%; bottom:-4px; width:40%; height:34%; background:#e8173c; border:4px solid #111; border-radius:50% 0 0 50%; }
  .bb-peye { position:absolute; top:34%; width:24%; aspect-ratio:1; background:#fff; border:3px solid #111; border-radius:50%; z-index:1; }
  .bb-peye.l { left:24%; } .bb-peye.r { right:22%; width:20%; top:36%; }
  .bb-peye i { position:absolute; left:28%; top:30%; width:46%; aspect-ratio:1; background:#111; border-radius:50%; animation:bb-goggle 1.1s ease-in-out infinite; }
  .bb-pmouth { position:absolute; left:32%; right:32%; top:62%; height:16%; background:#5a0f1e; border:3px solid #111; border-radius:4px 4px 99px 99px; z-index:1; }
  .bb-parm { position:absolute; right:-6%; top:40%; width:30%; height:12%; background:#3d7bff; border:4px solid #111; border-radius:99px; transform-origin:0 50%; transform:rotate(-30deg); }
  .bb-pitcher.windup .bb-parm { transform:rotate(-150deg); transition:transform .35s; }
  .bb-pitcher.throw .bb-parm { transform:rotate(40deg); transition:transform .12s; }
  .bb-pitcher.laugh { animation:bb-laugh .2s ease-in-out infinite alternate; }
  .bb-pitcher.sad .bb-pmouth { border-radius:99px 99px 4px 4px; height:9%; top:66%; }
  .bb-say { position:absolute; left:84%; top:-6%; padding:2px 8px; background:#fff; border:4px solid #111; border-radius:12px; font-size:calc(var(--pz) * .26); line-height:1.1; white-space:nowrap;
    z-index:4; animation:bb-pop .25s cubic-bezier(.2,1.8,.4,1) both; }
  /* The ball, coming at you (it grows as it gets close), and your bat in the corner */
  .bb-ball { position:absolute; left:0; top:0; width:26px; height:26px; margin:-13px 0 0 -13px; z-index:6; border-radius:50%; pointer-events:none; visibility:hidden;
    background:radial-gradient(circle at 35% 35%, #fff 0 45%, #e8e8e8 70%); border:2px solid #111;
    box-shadow:inset 6px 0 0 -3px #e8173c, inset -6px 0 0 -3px #e8173c; will-change:transform; }
  .bb-bat { position:absolute; right:6%; bottom:-4%; width:var(--bw); height:calc(var(--bw) * 5); z-index:7; pointer-events:none; transform-origin:50% 92%; transform:rotate(-38deg);
    background:linear-gradient(90deg, #a8692e, #d9a066 50%, #a8692e); border:4px solid #111; border-radius:40% 40% 12px 12px / 12% 12% 4% 4%; transition:transform .12s ease-out; }
  .bb-bat::after { content:""; position:absolute; left:15%; right:15%; bottom:4%; height:22%; background:repeating-linear-gradient(0deg, #222 0 5px, #444 5px 9px); border-radius:6px; }   /* the grip */
  .bb-bat.l { transform:rotate(-115deg); } .bb-bat.c { transform:rotate(-80deg); } .bb-bat.r { transform:rotate(-60deg) translateX(-30%); }
  .bb-fx { position:absolute; inset:0; pointer-events:none; z-index:9; overflow:visible; }
  .bb-word { position:absolute; left:50%; top:42%; transform:translate(-50%, -50%) rotate(-8deg); font-size:2.6rem; color:#ffd400; -webkit-text-stroke:2px #111; paint-order:stroke fill;
    text-shadow:0 4px 0 #111; white-space:nowrap; pointer-events:none; animation:bb-word 1s ease-out forwards; }
  .bb-word.bad { color:#fff; } .bb-word.small { font-size:1.6rem; }
  @keyframes bb-ready { to { transform:translateX(-50%) scale(1.06); } }
  @keyframes bb-goggle { 0%, 100% { transform:translate(-16%, 0); } 50% { transform:translate(16%, -12%); } }
  @keyframes bb-laugh { from { transform:translate(-50%, -100%) rotate(-5deg); } to { transform:translate(-50%, -106%) rotate(5deg); } }
  @keyframes bb-pop { from { transform:scale(.3); } }
  @keyframes bb-word { from { opacity:1; transform:translate(-50%, -50%) rotate(-8deg) scale(.5); } 25% { transform:translate(-50%, -60%) rotate(-8deg) scale(1.15); }
    75% { opacity:1; } to { opacity:0; transform:translate(-50%, -100%) rotate(-8deg); } }
  @media@media (prefers-reduced-motion: reduce) { .bb-peye i, .bb.ready .bb-sign, .bb-word, .bb-pitcher.laugh { animation:none !important; } }
  `;
  function injectCss() {
    if (document.getElementById("bb-css")) return;
    const s = document.createElement("style"); s.id = "bb-css"; s.textContent = CSS; document.head.appendChild(s);
  }

  registerMicrogame({
    id: "baseball-bash",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 20000,   // pitch after pitch: 2 home runs (the beats between pitches don't count)
    input: "tap",
    tutorial: true,
    listening: true,   // the target is only ever heard (left out when listening games are off)

    start(ctx) {
      injectCss();
      const speed = ctx.speed || 1;
      const pace = 0.6 + 0.4 * speed;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const { tone, sweep, noise } = ctx.sfx;
      const S = ctx.choiceSteps(GOAL + STRIKES, 3, { lowercase: true }); // a new target every pitch
      let pi = 0, C = S[0];
      const SIDES = ["l", "c", "r"];

      const wrap = document.createElement("div");
      wrap.className = "bb";
      const pips = document.createElement("div");
      pips.className = "bb-pips";
      pips.innerHTML = `<div class="bb-row hr">${'<span class="bb-pip"></span>'.repeat(GOAL)}</div><div class="bb-row ks">${'<span class="bb-pip k"></span>'.repeat(STRIKES)}</div>`;
      const park = document.createElement("div");
      park.className = "bb-park";
      // The infield (a brown diamond in perspective: home at the bottom, second base at the top), chalk lines
      // from home to first and third, the mound in the middle; the hit zone round home plate.
      park.innerHTML = '<svg class="bb-diamond" viewBox="0 0 100 100" preserveAspectRatio="none">' +
        '<polygon points="50,100 97,54 50,0 3,54" fill="#c98a4b" stroke="#111" stroke-width="4" vector-effect="non-scaling-stroke"/>' +
        '<polyline points="9,55 50,96 91,55" fill="none" stroke="#fff" stroke-width="4" vector-effect="non-scaling-stroke"/>' +
        '<ellipse cx="50" cy="50" rx="11" ry="8" fill="#b5773b" stroke="#111" stroke-width="3" vector-effect="non-scaling-stroke"/>' +
        '<rect x="47" y="1" width="6" height="5" fill="#fff" stroke="#111" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>' +
        '<div class="bb-zone"></div><div class="bb-plate"></div>';
      park.querySelector(".bb-zone").dataset.wait = TEXT.zoneWait;
      park.querySelector(".bb-zone").dataset.hit = TEXT.zoneHit;
      const opts = document.createElement("div");
      opts.className = "bb-opts";
      const signs = SIDES.map((side, i) => {
        const b = document.createElement("button");
        b.className = `bb-sign ${side}`;
        b.innerHTML = '<span class="tx"></span>';
        b.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); swing(i); });
        opts.appendChild(b);
        return { el: b, tx: b.firstChild, opt: null, i };
      });
      const pitcher = document.createElement("div");
      pitcher.className = "bb-pitcher";
      pitcher.setAttribute("aria-label", TEXT.pitcherLabel);
      pitcher.innerHTML = '<div class="bb-pbody"></div><div class="bb-pcap"></div><div class="bb-peye l"><i></i></div><div class="bb-peye r"><i></i></div><div class="bb-pmouth"></div><div class="bb-parm"></div>';
      pitcher.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); replay(); });
      const ball = document.createElement("div"); ball.className = "bb-ball";
      const bat = document.createElement("div"); bat.className = "bb-bat";
      const fx = document.createElement("div"); fx.className = "bb-fx";
      park.append(pitcher, ball, bat, fx);
      park.addEventListener("pointerdown", (e) => e.preventDefault()); // (tapping the field does nothing: the answers are the buttons below)
      wrap.append(pips, park, opts);
      ctx.root.appendChild(wrap);

      // ---------- Layout ----------
      let W = 0, H = 0, pz = 80;
      function layout() {
        W = park.clientWidth; H = park.clientHeight;
        pz = Math.max(60, Math.min(H * 0.22, W * 0.2, 110));
        park.style.setProperty("--pz", `${pz}px`);
        park.style.setProperty("--py", `${H * 0.68}px`); // on the mound, in the middle of the infield
        park.style.setProperty("--bw", `${Math.max(22, Math.min(W * 0.06, 34))}px`);
        const bh = Math.max(56, Math.min(84, (opts.clientWidth - 20) / 3 * 0.62));
        wrap.style.setProperty("--sh", `${bh}px`);
        const sw = Math.min(150, (opts.clientWidth - 20) / 3) - 18, sh = bh - 14;
        signs.forEach((s) => {
          if (!s.opt) return;
          const len = s.opt.text.length;
          s.tx.style.fontSize = `${s.opt.kind === "word" ? Math.min(sh * 0.6, sw / (len * 0.6)) : Math.min(sh * 0.72, sw * 0.6)}px`;
        });
      }
      function deal() {
        const row = ctx.shuffle(C.row.slice());
        signs.forEach((s, i) => {
          s.opt = row[i];
          s.tx.textContent = s.opt.text;
          s.el.setAttribute("aria-label", TEXT.signLabel(s.opt.spoken));
          s.el.classList.remove("right", "bad");
        });
        layout();
      }

      // ---------- A pitch ----------
      // state: wind (winding up, saying it), fly (ball on its way; `ready` near the plate), done
      let state = "wind", hits = 0, strikes = 0, done = false, t0 = 0, flyMs = 0, swung = false;
      const plate = () => ({ x: W / 2, y: H * 0.9 });
      const hand = () => ({ x: W / 2 + pz * 0.35, y: H * 0.68 - pz * 0.6 });
      function say() {
        pitcher.querySelector(".bb-say")?.remove();
        const b = document.createElement("div");
        b.className = "bb-say";
        b.textContent = ctx.canSpeak ? TEXT.listen : C.cardText; // (listening games off: show it)
        pitcher.appendChild(b);
        ctx.say(C.prompt);
      }
      function pitch() {
        if (done || ctx.ended) return;
        state = "wind"; swung = false;
        bat.className = "bb-bat";
        pitcher.classList.remove("laugh", "throw");
        pitcher.classList.add("windup");
        say();
        ctx.later(() => {
          if (done || ctx.ended) return;
          pitcher.classList.remove("windup"); pitcher.classList.add("throw");
          noise(0.08, "bandpass", 1500, 2500, 0.2); // whoosh
          state = "fly"; t0 = performance.now(); flyMs = (reduceMotion ? 1800 : 2000) / pace;
          ball.style.visibility = "visible";
          ctx.raf(fly);
        }, 700);
      }
      function fly(now) {
        if (state !== "fly") return;
        const k = (now - t0) / flyMs, a = hand(), b = plate();
        const kk = Math.min(1, k), e = kk * kk; // speeds up as it comes
        ball.style.transform = `translate(${(a.x + (b.x - a.x) * e).toFixed(1)}px, ${(a.y + (b.y - a.y) * e - Math.sin(kk * Math.PI) * H * 0.06).toFixed(1)}px) scale(${(0.5 + 2.6 * e).toFixed(2)})`;
        park.classList.toggle("ready", k >= 0.62 && k <= 1.25);
        wrap.classList.toggle("ready", park.classList.contains("ready")); // (the buttons light up too) // the hit window: the plate (and signs) light up
        if (k > 1.25) { if (!swung) strike(true); return; } // too late
        ctx.raf(fly);
      }
      function swing(i) {
        if (done || ctx.ended || swung) return;
        if (state !== "fly" || (performance.now() - t0) / flyMs < 0.62) { // too early: no penalty
          if (state === "fly") word(TEXT.wait, true, true);
          return;
        }
        swung = true;
        state = "hit";
        park.classList.remove("ready"); wrap.classList.remove("ready");
        bat.classList.add(SIDES[i]);
        const s = signs[i];
        if (s.opt.right) homeRun(s); else { s.el.classList.add("bad"); strike(false); }
      }
      function homeRun(s) {
        noise(0.08, "highpass", 2500, 6000, 0.5); tone(1200, 0.05, "square", 0.12); // CRACK
        const from = plate(), to = { x: W * [0.17, 0.5, 0.83][s.i], y: -H * 0.25 }, ts = performance.now(), ms = reduceMotion ? 1 : 750;
        (function away(now) {
          const k = Math.min(1, (now - ts) / ms);
          ball.style.transform = `translate(${from.x + (to.x - from.x) * k}px, ${from.y + (to.y - from.y) * k}px) scale(${3 - 2.6 * k})`;
          if (k < 1) ctx.raf(away); else ball.style.visibility = "hidden";
        })(ts);
        s.el.classList.add("right");
        word(TEXT.homer, false);
        pitcher.classList.add("sad");
        [0, 0.15, 0.3].forEach((d) => noise(0.3, "bandpass", 2000, 1200, 0.15, d)); // the crowd roars
        if (s.opt.kind === "pic") ctx.say(s.opt.spoken);
        ctx.confetti(fx, to.x, H * 0.15, { count: 60 });
        pips.querySelector(".hr").children[hits].classList.add("on");
        hits++;
        if (hits >= GOAL) {
          done = true; ctx.win();
          [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, "triangle", 0.1, 0.3 + i * 0.08));
          return;
        }
        next();
      }
      function strike(late) {
        state = "hit";
        park.classList.remove("ready"); wrap.classList.remove("ready");
        if (late) ball.style.visibility = "hidden"; // past you, into the catcher's glove
        else { sweep(500, 200, 0.25, "triangle", 0.08); ball.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: "forwards" }); }
        noise(0.05, "lowpass", 600, 200, 0.4); // thwack (the glove)
        pitcher.classList.remove("throw"); pitcher.classList.add("laugh");
        pips.querySelector(".ks").children[strikes].classList.add("on");
        strikes++;
        if (strikes >= STRIKES) {
          done = true; ctx.lose();
          word(TEXT.out, true);
          ctx.later(() => { signs.forEach((s) => { if (s.opt.right) s.el.classList.add("right"); }); ctx.say(C.answer); }, 400);
          return;
        }
        word(TEXT.strike, true);
        ctx.later(() => { signs.forEach((s) => { if (s.opt.right) s.el.classList.add("right"); }); }, 200); // that's what it was
        next();
      }
      // The beat between pitches: the clock stops, new signs, the next pitch.
      function next() {
        ctx.later(() => {
          if (done) return;
          ctx.pauseTimer(1500);
          pitcher.classList.remove("sad", "laugh");
          ball.style.visibility = "hidden"; ball.getAnimations().forEach((a) => a.cancel());
          C = S[++pi];
          deal();
          pitch();
        }, 1000);
      }
      function word(text, bad, small) {
        const w = document.createElement("div");
        w.className = "bb-word" + (bad ? " bad" : "") + (small ? " small" : "");
        w.textContent = text;
        fx.appendChild(w);
        ctx.later(() => w.remove(), 1000);
      }
      function replay() { if (!done && state !== "hit") ctx.say(C.prompt); }

      ctx.onTimeout(() => { done = true; state = "hit"; park.classList.remove("ready"); wrap.classList.remove("ready"); pitcher.classList.add("laugh"); signs.forEach((s) => { if (s.opt.right) s.el.classList.add("right"); }); ctx.say(C.answer); });
      function onKey(e) {
        const i = { 1: 0, 2: 1, 3: 2, ArrowLeft: 0, ArrowUp: 1, ArrowRight: 2 }[e.key];
        if (i !== undefined) { e.preventDefault(); swing(i); }
        else if (e.key === " ") { e.preventDefault(); replay(); }
      }
      document.addEventListener("keydown", onKey);

      deal();
      const ro = new ResizeObserver(layout);
      ro.observe(park);
      ctx.later(pitch, 500);

      // Tutorial: wait for the ball to get close, then hit the right sign; twice.
      ctx.tutorial(S.slice(0, GOAL).map((s) => s.target), async (f) => {
        await f.point(pitcher, 900);
        for (let n = 0; n < GOAL && !done; n++) {
          await f.until(() => state === "fly" && hits === n, 6000);
          const s = signs.find((x) => x.opt.right);
          await f.move(s.el, 400);
          await f.until(() => state === "fly" && (performance.now() - t0) / flyMs >= 0.75, 4000);
          await f.tapNow(s.el);
          await f.until(() => hits > n || done, 2500);
        }
      });
      return () => { done = true; ro.disconnect(); document.removeEventListener("keydown", onKey); };
    },
  });
})();
