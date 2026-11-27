// CARVE IT OUT — the shared engine for the cutting games (Ice Sculptor, Gem Miner, Cartoon Saw, Laser Rescue; the
// teacher's idea: "more uses of tracing"). The card shows a target; N round pieces (3, 4 from 1.75×), each with an
// answer, sit inside dotted rings. Drag around a ring to cut it (a saw / drill / laser follows the finger, the dashes
// light up as you go); once most of the ring (80%) is cut, the piece comes free. The right one: the game's own
// celebration, then a beat and a new target (`ctx.choiceSteps`, 3 of them). A wrong one: the game's own silly
// "nope", ✕; 2 lose. Like js/power.js and js/flip.js, each game is a skin:
//
//   CarveOut.start(ctx, skin) → api
//   skin = {
//     cls, tool,               // CSS prefix; the cutting tool that follows the finger (an emoji: 🪚 ⛏️ …)
//     scene(stage, api),       // draw the background (optional)
//     piece(i),                // the HTML inside a piece (the frozen animal, the gem, the trapdoor, the hatch)
//     spots(n, W, H),          // optional: piece centres [{x, y}] (default: a row, or 2×2)
//     onCut(p, api),           // optional: each bit of cutting (sounds are the engine's)
//     onRight(p, api), onWrong(p, api), onWin(api), onStep(api),   // what happens
//     text: { cut: [...], nope: "…", win: "…" }, sound: "saw" | "drill" | "laser"
//   }
//   api = { stage, fx, pieces, W, H, R, word(text, bad, x, y), pop(emoji, x, y, size, dx, dy, ms) }
(function () {
  const BUCKETS = 36, DONE = 0.8, GOAL = 3, MISSES = 2;
  const CSS = `
  .co { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:6px; padding-bottom:6px; }
  .co-top { flex:none; display:flex; align-items:center; gap:10px; }
  .co-card { padding:4px 16px; background:#fff; border:5px solid #111; border-radius:16px; box-shadow:0 5px 0 #111; font:inherit; color:#111; font-size:clamp(1.8rem, 8vw, 2.8rem);
    line-height:1.05; cursor:pointer; touch-action:manipulation; display:flex; align-items:center; gap:6px; white-space:nowrap; }
  .co-card .spk { font-size:.45em; }
  .co-card.next { animation:co-next .35s cubic-bezier(.2,1.8,.4,1); }
  /* A helper at the start: a finger draws a circle in the top corner (out of the way of the pieces) for a few seconds */
  .co-help { position:relative; flex:none; width:54px; height:54px; border:4px dashed #111; border-radius:50%; background:rgba(255,255,255,.85); pointer-events:none; transition:opacity .4s; }
  .co-help.out { opacity:0; }
  .co-help i { position:absolute; inset:-4px; animation:co-help-spin 1.2s linear infinite; }
  .co-help i b { position:absolute; left:50%; top:0; font-style:normal; font-size:1.7rem; line-height:1; transform:translate(-30%, -10%) rotate(-20deg); }
  @keyframes co-help-spin { to { transform:rotate(360deg); } }
  .co-pips { display:flex; flex-direction:column; gap:4px; }
  .co-row { display:flex; gap:4px; }
  .co-pip { width:22px; height:22px; border:3px solid #111; border-radius:50%; background:#fff; display:flex; align-items:center; justify-content:center; font-size:12px; line-height:1; }
  .co-pip.on { background:#ffd400; } .co-pip.on::after { content:"✔"; font-weight:900; }
  .co-pip.x.on { background:#ff5a6e; } .co-pip.x.on::after { content:"✕"; color:#fff; }
  .co-stage { position:relative; flex:1; min-height:0; width:100%; max-width:640px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111; touch-action:none; }
  /* A piece (--pr: its ring's radius): the skin's drawing, the label, and a ring of dashes to cut */
  .co-piece { position:absolute; width:calc(var(--pr) * 2); height:calc(var(--pr) * 2); margin:calc(var(--pr) * -1) 0 0 calc(var(--pr) * -1); z-index:2; pointer-events:none; }
  .co-in { position:absolute; inset:8%; border-radius:50%; overflow:visible; }
  .co-lbl { position:absolute; left:50%; top:50%; transform:translate(-50%, -50%); z-index:4; padding:2px 8px; background:#fff; border:4px solid #111; border-radius:12px;
    box-shadow:0 4px 0 #111; font-weight:900; color:#111; line-height:1.1; white-space:nowrap; }
  .co-dash { position:absolute; left:50%; top:50%; width:calc(var(--pr) * .16); height:5px; margin:-2.5px 0 0 calc(var(--pr) * -.08); border-radius:3px; z-index:5;
    background:rgba(255,255,255,.95); box-shadow:0 0 0 2px #111; }
  .co-dash.cut { background:var(--cut, #ffd400); box-shadow:0 0 0 2px #111, 0 0 8px 2px var(--cut, #ffd400); }
  .co-piece.free { z-index:6; }
  .co-piece.free .co-dash, .co-piece.dud .co-dash { opacity:0; transition:opacity .2s; }
  .co-piece.dud { filter:grayscale(.8) brightness(.8); }
  .co-piece.right .co-lbl { box-shadow:0 0 0 4px #fff, 0 0 0 8px #00b86b; }
  .co-tool { position:absolute; left:0; top:0; z-index:8; font-size:2.4rem; line-height:1; pointer-events:none; opacity:0; transform-origin:30% 70%; }
  .co-tool.on { opacity:1; }
  .co-fx { position:absolute; inset:0; pointer-events:none; z-index:9; overflow:visible; }
  .co-pop { position:absolute; line-height:1; transform:translate(-50%, -50%); pointer-events:none; }
  .co-word { position:absolute; transform:translate(-50%, -50%) rotate(-8deg); font-size:2rem; color:#ffd400; -webkit-text-stroke:2px #111; paint-order:stroke fill;
    text-shadow:0 4px 0 #111; white-space:nowrap; animation:co-word 1s ease-out forwards; z-index:10; }
  .co-word.bad { color:#ff5a6e; }
  @keyframes co-next { from { scale:.6; } }
  @keyframes co-word { from { opacity:1; scale:.5; } 25% { scale:1.15; } 75% { opacity:1; } to { opacity:0; translate:0 -40px; } }
  @media (prefers-reduced-motion: reduce) { .co-word, .co-card.next { animation:none !important; } }
  `;
  function injectCss() { if (document.getElementById("co-css")) return; const s = document.createElement("style"); s.id = "co-css"; s.textContent = CSS; document.head.appendChild(s); }

  function start(ctx, skin) {
    injectCss();
    const speed = ctx.speed || 1;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const { tone, sweep, noise } = ctx.sfx;
    const N = speed >= 1.75 ? 4 : 3;
    const S = ctx.choiceSteps(GOAL, N, { lowercase: true });
    let si = 0, st = S[0];

    const wrap = document.createElement("div");
    wrap.className = "co";
    const top = document.createElement("div");
    top.className = "co-top";
    const card = document.createElement("button");
    card.className = "co-card";
    card.setAttribute("aria-label", "The card. Tap to hear it again.");
    card.innerHTML = '<span class="ct"></span>';
    card.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); if (!done) ctx.say(st.prompt); });
    const pips = document.createElement("div");
    pips.className = "co-pips";
    pips.innerHTML = `<div class="co-row hits">${'<span class="co-pip"></span>'.repeat(GOAL)}</div><div class="co-row">${'<span class="co-pip x"></span>'.repeat(MISSES)}</div>`;
    top.append(card, pips);
    const help = document.createElement("div");
    help.className = "co-help"; help.setAttribute("aria-hidden", "true");
    help.innerHTML = "<i><b>👆</b></i>";
    top.append(help);
    ctx.later(() => help.classList.add("out"), 3600);
    ctx.later(() => help.remove(), 4100);
    const stage = document.createElement("div");
    stage.className = `co-stage ${skin.cls}-stage`;
    const fx = document.createElement("div");
    fx.className = "co-fx";
    const tool = document.createElement("div");
    tool.className = "co-tool"; tool.textContent = skin.tool || "🪚";
    const api = { stage, fx, pieces: [], W: 0, H: 0, R: 50, word, pop };
    if (skin.scene) skin.scene(stage, api);
    stage.append(tool, fx);
    wrap.append(top, stage);
    ctx.root.appendChild(wrap);
    const hitPips = pips.querySelector(".hits").children, missPips = pips.children[1].children;

    function spots(n, W, H) {
      if (skin.spots) return skin.spots(n, W, H);
      if (n <= 3) return [...Array(n)].map((_, i) => ({ x: W * (i + 0.5) / n, y: H * 0.56 }));
      return [...Array(n)].map((_, i) => ({ x: W * (0.27 + 0.46 * (i % 2)), y: H * (0.32 + 0.42 * Math.floor(i / 2)) }));
    }
    function layout() {
      const W = stage.clientWidth, H = stage.clientHeight;
      api.W = W; api.H = H;
      api.R = Math.max(42, Math.min(W / (skin.cols || (N <= 3 ? N : 2)) * (skin.rW || 0.36), H * (skin.rH || (N <= 3 ? 0.3 : 0.19)), 110));
      stage.style.setProperty("--pr", `${api.R}px`);
      const sp = spots(N, W, H);
      api.pieces.forEach((p, i) => { p.x = sp[i].x; p.y = sp[i].y; p.el.style.left = `${p.x}px`; p.el.style.top = `${p.y}px`; sizeLbl(p); });
    }
    function sizeLbl(p) { const l = p.el.querySelector(".co-lbl"); l.style.fontSize = `${p.o.kind === "pic" ? api.R * 0.6 : Math.min(api.R * 0.66, (api.R * 1.4) / ([...p.o.text].length * 0.62))}px`; }

    // ---------- The pieces for a step ----------
    function deal() {
      api.pieces.forEach((p) => p.el.remove());
      card.firstChild.textContent = st.cardText;
      card.querySelector(".spk")?.remove();
      if (ctx.canSpeak && !st.listen) card.insertAdjacentHTML("beforeend", '<span class="spk">🔊</span>');
      api.pieces = ctx.shuffle(st.row.slice()).map((o, i) => {
        const el = document.createElement("div");
        el.className = `co-piece ${skin.cls}-piece`;
        el.innerHTML = `<div class="co-in">${skin.piece(i)}</div><span class="co-lbl"></span>` +
          [...Array(BUCKETS)].map((_, k) => `<i class="co-dash" style="transform:rotate(${k * (360 / BUCKETS) + 5}deg) translateX(var(--pr)) rotate(90deg)"></i>`).join("");
        el.querySelector(".co-lbl").textContent = o.text;
        stage.insertBefore(el, tool);
        return { el, o, i, x: 0, y: 0, cut: new Set(), lastB: null, state: "whole" };
      });
      if (api.W) layout();
      if (skin.onStep) skin.onStep(api);
    }

    // ---------- Cutting ----------
    let done = false, busy = true, hits = 0, missN = 0, last = null, lastSnd = 0;
    const local = (e) => { const r = stage.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    stage.addEventListener("pointerdown", (e) => { e.preventDefault(); last = local(e); tool.classList.add("on"); moveTool(last); api.pieces.forEach((p) => (p.lastB = null)); cutAt(last); });
    stage.addEventListener("pointermove", (e) => { if (!last) return; const p = local(e); moveTool(p); cutAt(p); last = p; });
    const up = () => { last = null; tool.classList.remove("on"); };
    stage.addEventListener("pointerup", up);
    stage.addEventListener("pointercancel", up);
    function moveTool(p) { tool.style.transform = `translate(${p.x - 12}px, ${p.y - 34}px) rotate(${Math.sin(performance.now() / 50) * 12}deg)`; }
    function cutAt(pt) {
      if (done || busy || ctx.ended) return;
      for (const p of api.pieces) {
        if (p.state !== "whole") continue;
        const d = Math.hypot(pt.x - p.x, pt.y - p.y);
        if (Math.abs(d - api.R) > api.R * 0.34) { p.lastB = null; continue; }
        let a = Math.atan2(pt.y - p.y, pt.x - p.x) * 180 / Math.PI;
        if (a < 0) a += 360;
        const b = Math.floor(a / (360 / BUCKETS)) % BUCKETS;
        const mark = (k) => { if (!p.cut.has(k)) { p.cut.add(k); p.el.querySelectorAll(".co-dash")[k].classList.add("cut"); } };
        // Fill in the dashes between this one and the last (a quick drag can skip a few), the short way round.
        if (p.lastB != null && p.lastB !== b) {
          let diff = (b - p.lastB + BUCKETS) % BUCKETS, dir = 1;
          if (diff > BUCKETS / 2) { diff = BUCKETS - diff; dir = -1; }
          if (diff <= 6) for (let k = 1; k < diff; k++) mark((p.lastB + dir * k + BUCKETS) % BUCKETS);
        }
        mark(b);
        p.lastB = b;
        const now = performance.now();
        if (now - lastSnd > 70) {
          lastSnd = now;
          const f = 400 + (p.cut.size / BUCKETS) * 900;
          if (skin.sound === "laser") tone(f * 2, 0.06, "sine", 0.05);
          else if (skin.sound === "drill") noise(0.06, "bandpass", f * 2, 1200, 0.18);
          else noise(0.06, "highpass", 2200, f * 3, 0.2);
          if (skin.onCut) skin.onCut(p, api);
        }
        if (p.cut.size >= BUCKETS * DONE) free(p);
        break;
      }
    }
    function free(p) {
      busy = true;
      up();
      if (p.o.right) {
        p.state = "free";
        p.el.classList.add("free");
        hitPips[hits].classList.add("on");
        hits++;
        word(skin.text.cut[(hits - 1) % skin.text.cut.length], false, p.x, p.y - api.R - 10);
        [523, 659, 784].forEach((f, k) => tone(f, 0.09, "triangle", 0.09, k * 0.07));
        // (onRight may return extra ms its celebration needs, e.g. Cartoon Saw's burglar walking over to the hole: the
        // clock waits for it, the beat comes that much later, and the last one is reported when it's over)
        const extra = (skin.onRight && +skin.onRight(p, api)) || 0;
        ctx.say(p.o.kind === "pic" ? p.o.spoken : st.answer);
        if (extra && hits < GOAL) ctx.pauseTimer(extra);
        if (hits >= GOAL) {
          done = true;
          if (extra) { ctx.freezeTimer(); ctx.later(() => ctx.win(), extra); } else ctx.win();
          ctx.later(() => { word(skin.text.win, false, api.W / 2, api.H * 0.18); ctx.confetti(fx, api.W / 2, api.H * 0.4, { count: 100 }); if (skin.onWin) skin.onWin(api); }, 700 + extra);
          return;
        }
        // The beat: the clock stops, the card pops to the next target, new pieces.
        ctx.later(() => {
          if (done) return;
          ctx.pauseTimer(900);
          st = S[++si];
          card.classList.remove("next"); void card.offsetWidth; card.classList.add("next");
          tone(98, 0.08, "square", 0.1); tone(147, 0.08, "square", 0.1, 0.16);
          deal();
          ctx.say(st.prompt);
          ctx.later(() => { busy = false; }, 300);
        }, 1300 + extra);
      } else {
        p.state = "dud";
        p.el.classList.add("dud");
        missPips[missN].classList.add("on");
        missN++;
        word(skin.text.nope, true, p.x, p.y - api.R - 10);
        sweep(500, 150, 0.4, "sawtooth", 0.08);
        if (skin.onWrong) skin.onWrong(p, api);
        if (p.o.kind === "pic") ctx.say(p.o.spoken);
        if (missN >= MISSES) { done = true; ctx.lose(); ctx.later(showAnswer, 700); return; }
        ctx.later(() => { busy = false; }, 700);
      }
    }
    function showAnswer() { api.pieces.forEach((p) => { if (p.o.right) p.el.classList.add("right"); }); ctx.say(st.answer); }
    function word(text, bad, x, y) {
      const w = document.createElement("div");
      w.className = "co-word" + (bad ? " bad" : "");
      w.textContent = text;
      w.style.left = `${Math.max(90, Math.min(api.W - 90, x))}px`; w.style.top = `${Math.max(28, y)}px`;
      fx.appendChild(w);
      ctx.later(() => w.remove(), 1000);
    }
    function pop(e, x, y, size = 30, dx = 0, dy = -80, ms = 900) {
      if (reduceMotion) return;
      const el = document.createElement("div");
      el.className = "co-pop"; el.textContent = e; el.style.fontSize = `${size}px`;
      el.style.left = `${x}px`; el.style.top = `${y}px`;
      fx.appendChild(el);
      el.animate([{ transform: "translate(-50%, -50%) scale(.4)", opacity: 1 }, { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1.1)`, opacity: 0 }], { duration: ms, easing: "ease-out", fill: "forwards" });
      ctx.later(() => el.remove(), ms + 20);
    }

    ctx.onTimeout(() => { done = true; up(); showAnswer(); });

    deal();
    layout();
    const ro = new ResizeObserver(layout);
    ro.observe(stage);
    ctx.say(st.prompt);
    const rev = ctx.reveal(card);
    ctx.later(() => { busy = false; }, (rev || 0) + 100);

    // Tutorial: point at the card, then cut round the right piece.
    ctx.tutorial(S.map((s) => s.target), async (f) => {
      const around = (p, k) => () => { const rr = ctx.root.getBoundingClientRect(), sr = stage.getBoundingClientRect(), a = (k / 12) * Math.PI * 2;
        return { x: sr.left - rr.left + p.x + Math.cos(a) * api.R, y: sr.top - rr.top + p.y + Math.sin(a) * api.R }; };
      for (let n = 0; n < GOAL && !done; n++) {
        await f.until(() => !busy && si === n, 9000);   // (a skin's celebration can hold up the next step: Cartoon Saw)
        await f.point(card, n ? 450 : 900);
        const p = api.pieces.find((x) => x.o.right);
        await f.path([...Array(13)].map((_, k) => around(p, k)), 70);
        if (p.state === "whole") await f.path([...Array(13)].map((_, k) => around(p, k)), 70);
        await f.until(() => hits > n || done, 2500);
      }
    });
    api.cleanup = () => { done = true; ro.disconnect(); };
    return api;
  }

  window.CarveOut = { start };
})();
