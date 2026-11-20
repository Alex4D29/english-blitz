// FROGGY HOP — a frog sits on the near bank of a river; rows of lily pads cross to the far bank, where
// a fly buzzes. A card at the top shows the target and the voice says it. In every row one pad has the
// target: tap it and the frog hops on (ribbit). Cross every row and the frog's tongue shoots out and
// snaps the fly. A wrong pad sinks — SPLASH — the frog is left soggy and sad, and the right pad glows.
// Only the next row is live (its pads glow softly); taps on other rows are ignored.
//
// Letter list: pads are letters (look-alikes, fresh ones each row). Phonics: the card is a letter and
// each row has a different picture that starts with it (ball, then bee…). CVC: the card is a word, the
// pads are pictures. HFW: the card is 🔊, the pads are words. Faster speeds: 3 rows, 4 from 1.5× (with
// pads drifting on the current), 4 pads a row from 2×.
(function () {
  const TEXT = {
    name: { en: "Froggy Hop" },
    icon: "🐸",
    howTo: (list) => {
      const what = {
        letter: ["🔤", "Look at the card, like \"B\". Hop on the lily pads with B!"],
        phonics: ["🔤", "Look at the letter, like \"B\". Hop on the pictures that start with it: ball, bee…"],
        cvc: ["📝", "Look at the word, like \"cat\". Hop on the cat pictures!"],
        hfw: ["👂", "Listen to the word, like \"the\". Hop on that word!"],
      }[list.type] || ["👀", "Look at the card."];
      return { en: {
        steps: [
          ["🐸", "Help the frog cross the river to catch the fly!"],
          what,
          ["👆", "Tap the right lily pad in the next row. Row by row, all the way across!"],
        ],
        tips: [
          "Tap the card to hear it again.",
          "A wrong lily pad sinks… SPLASH! The right one glows.",
          "When the game speeds up, there are more rows and the lily pads float side to side.",
        ],
      } };
    },
    instruction: { en: "HOP\nACROSS!" },
    listen: "🔊",
    answer: (letter, word) => `${letter} for ${word}`,
    cardLabel: "Hear it again",
    padLabel: (t) => `Hop to ${t}`,
  };

  const CSS = `
  .fh { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:8px; padding-bottom:8px; }
  .fh-card { flex:none; position:relative; min-width:84px; height:72px; padding:0 18px; border-radius:18px; font:inherit; font-size:2.6rem; line-height:1;
    background:#fff; color:#111; border:5px solid #111; box-shadow:0 6px 0 #111; display:flex; align-items:center; justify-content:center; gap:8px;
    cursor:pointer; touch-action:manipulation; animation:fh-in .3s cubic-bezier(.2,1.8,.4,1) both; }
  .fh-card .spk { font-size:1.3rem; opacity:.6; }
  .fh-river { position:relative; flex:1; min-height:0; width:100%; max-width:520px; overflow:hidden; border:5px solid #111; border-radius:16px;
    background:linear-gradient(180deg, #2fa3e6, #1f7fd0); box-shadow:0 7px 0 #111; touch-action:manipulation; }
  .fh-river::before { content:""; position:absolute; inset:0; opacity:.35;
    background:repeating-linear-gradient(170deg, transparent 0 26px, rgba(255,255,255,.5) 26px 29px, transparent 29px 60px);
    animation:fh-flow 3s linear infinite; }
  .fh-bank { position:absolute; left:0; right:0; height:var(--bank); background:#6cc04a; z-index:1;
    background-image:radial-gradient(circle, #8fd66a 3px, transparent 4px); background-size:22px 22px; }
  .fh-bank.top { top:0; border-bottom:5px solid #111; }
  .fh-bank.bot { bottom:0; border-top:5px solid #111; }
  .fh-flower { position:absolute; font-size:1.3rem; z-index:2; }
  .fh-fly { position:absolute; left:50%; top:calc(var(--bank) * .5); font-size:1.8rem; line-height:1; transform:translate(-50%, -50%); z-index:3;
    animation:fh-buzz .5s ease-in-out infinite alternate; }
  .fh-fly.gone { opacity:0; transition:opacity .1s .25s; }

  .fh-pad { position:absolute; left:0; top:0; width:var(--ps); height:calc(var(--ps) * .86); margin:calc(var(--ps) * -.43) 0 0 calc(var(--ps) * -.5);
    padding:0; border:0; background:none; font:inherit; cursor:pointer; touch-action:manipulation; z-index:2; will-change:transform; }
  .fh-leaf { position:absolute; inset:0; background:#3fb54a; border:5px solid #111; border-radius:50%;
    box-shadow:inset -6px -6px 0 rgba(0,0,0,.18), 0 5px 0 rgba(0,0,0,.25); }
  .fh-leaf::before { content:""; position:absolute; left:50%; top:-5px; width:16%; height:22%; margin-left:-8%; background:#1f7fd0;
    clip-path:polygon(0 0, 100% 0, 50% 100%); }
  .fh-tag { position:absolute; inset:16% 8% 10%; display:flex; align-items:center; justify-content:center; color:#fff; font-size:calc(var(--ps) * .42);
    line-height:1; -webkit-text-stroke:4px #111; paint-order:stroke fill; white-space:nowrap; }
  .fh-tag.pic { -webkit-text-stroke:0; font-size:calc(var(--ps) * .4); filter:drop-shadow(0 2px 0 rgba(0,0,0,.4)); }
  .fh-pad.live .fh-leaf { box-shadow:0 0 0 5px rgba(255,255,255,.75), inset -6px -6px 0 rgba(0,0,0,.18); animation:fh-live 1s ease-in-out infinite alternate; }
  .fh-pad.done .fh-leaf { background:#2e8f38; }
  .fh-pad.dim { opacity:.5; }
  .fh-pad.sink { transition:transform .5s ease-in, opacity .5s ease-in; opacity:.15; }
  .fh-pad.sink .fh-leaf { background:#2a6d3a; }
  .fh-pad.right .fh-leaf { background:#7ff08a; box-shadow:0 0 0 6px #fff, 0 0 0 11px #00b86b; }
  .fh-pad.right { animation:fh-wiggle .4s ease-in-out 3; }

  .fh-frog { position:absolute; left:0; top:0; width:var(--fs); height:calc(var(--fs) * .82); margin:calc(var(--fs) * -.56) 0 0 calc(var(--fs) * -.5); z-index:5;
    will-change:transform; pointer-events:none; }
  .fh-fbody { position:absolute; left:4%; right:4%; top:30%; bottom:0; background:#5fd35a; border:4px solid #111; border-radius:50% 50% 44% 44%;
    box-shadow:inset -5px -5px 0 rgba(0,0,0,.15); }
  .fh-belly { position:absolute; left:28%; right:28%; bottom:6%; height:36%; background:#d9f7a8; border-radius:50%; }
  .fh-feye { position:absolute; top:0; width:34%; height:44%; background:#5fd35a; border:4px solid #111; border-radius:50%; }
  .fh-feye::after { content:""; position:absolute; left:20%; top:18%; width:60%; height:60%; background:#fff; border:3px solid #111; border-radius:50%;
    background-image:radial-gradient(circle at 50% 55%, #111 0 30%, transparent 32%); }
  .fh-feye.l { left:6%; } .fh-feye.r { right:6%; }
  .fh-fmouth { position:absolute; left:28%; right:28%; top:52%; height:14%; border-bottom:4px solid #111; border-radius:0 0 50% 50%; }
  .fh-frog.sad .fh-fmouth { border-bottom:0; border-top:4px solid #111; border-radius:50% 50% 0 0; top:58%; }
  .fh-frog.sad .fh-feye::after { background-image:radial-gradient(circle at 50% 75%, #111 0 30%, transparent 32%); }
  .fh-frog.wet { filter:saturate(.6) brightness(.9); }
  .fh-tongue { position:absolute; left:50%; top:58%; width:8px; margin-left:-4px; height:0; background:#ff4d7a; border:3px solid #111; border-radius:99px;
    transform-origin:50% 100%; transform:translateY(-100%); }
  .fh-splash { position:absolute; width:20px; height:20px; margin:-10px 0 0 -10px; border:4px solid #fff; border-radius:50%; z-index:4;
    animation:fh-ring .7s ease-out forwards; pointer-events:none; }
  .fh-drop { position:absolute; width:12px; height:12px; margin:-6px 0 0 -6px; background:#bfe6ff; border:3px solid #111; border-radius:50%; z-index:6; pointer-events:none; }
  .fh-fx { position:absolute; inset:0; pointer-events:none; overflow:visible; z-index:7; }

  @keyframes fh-in { from { transform:scale(.5); opacity:0; } }
  @keyframes fh-flow { from { background-position:0 0; } to { background-position:0 60px; } }
  @keyframes fh-buzz { from { transform:translate(-62%, -58%) rotate(-10deg); } to { transform:translate(-38%, -42%) rotate(10deg); } }
  @keyframes fh-live { from { box-shadow:0 0 0 3px rgba(255,255,255,.5), inset -6px -6px 0 rgba(0,0,0,.18); } to { box-shadow:0 0 0 7px rgba(255,255,255,.9), inset -6px -6px 0 rgba(0,0,0,.18); } }
  @keyframes fh-wiggle { 25% { rotate:-8deg; } 75% { rotate:8deg; } }
  @keyframes fh-ring { from { transform:scale(.4); opacity:1; } to { transform:scale(4.5); opacity:0; } }
  @media (prefers-reduced-motion: reduce) {
    .fh-card, .fh-river::before, .fh-fly, .fh-pad.live .fh-leaf, .fh-pad.right, .fh-splash { animation:none !important; }
  }`;

  function injectCss() {
    if (document.getElementById("fh-css")) return;
    const style = document.createElement("style");
    style.id = "fh-css";
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  registerMicrogame({
    id: "froggy-hop",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 10000,
    input: "tap",

    start(ctx) {
      injectCss();
      const type = ctx.list.type;
      const speed = ctx.speed || 1;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const R = speed >= 1.5 ? 4 : 3;           // rows to cross
      const N = speed >= 2 ? 4 : 3;             // pads per row
      const drift = speed >= 1.5 && !reduceMotion;
      const letterName = (it) => it.say || it.text.toUpperCase();
      const { tone, sweep, noise } = ctx.sfx;

      // ---------- Content: rows[r] = [{ text, kind, right, spoken }] (ABC: half the rounds are capital → lowercase) ----------
      const { cardText, prompt, answer, rows } = ctx.choiceRows(R, N, { lowercase: true });

      // ---------- DOM ----------
      const wrap = document.createElement("div");
      wrap.className = "fh";
      const card = document.createElement("button");
      card.className = "fh-card";
      card.setAttribute("aria-label", TEXT.cardLabel);
      card.innerHTML = '<span class="ct"></span>';
      card.firstChild.textContent = cardText;
      if (ctx.canSpeak && cardText !== TEXT.listen) card.insertAdjacentHTML("beforeend", '<span class="spk">🔊</span>');
      card.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });
      card.addEventListener("click", (e) => { if (e.detail === 0) replay(); });
      const river = document.createElement("div");
      river.className = "fh-river";
      river.innerHTML = '<div class="fh-bank top"></div><div class="fh-bank bot"></div><div class="fh-fly">🪰</div><div class="fh-fx"></div>';
      ["🌼", "🌷", "🌼"].forEach((f, i) => {
        const el = document.createElement("div");
        el.className = "fh-flower";
        el.textContent = f;
        el.style.cssText = `left:${[8, 78, 88][i]}%;top:${[6, 12, 4][i]}px;`;
        river.appendChild(el);
      });
      const fly = river.querySelector(".fh-fly");
      const fx = river.querySelector(".fh-fx");
      wrap.append(card, river);
      ctx.root.appendChild(wrap);

      const pads = rows.map((row, r) => row.map((item, i) => {
        const b = document.createElement("button");
        b.className = "fh-pad";
        b.setAttribute("aria-label", TEXT.padLabel(item.spoken));
        b.innerHTML = '<div class="fh-leaf"></div><div class="fh-tag"></div>';
        const tag = b.querySelector(".fh-tag");
        tag.textContent = item.text;
        if (item.kind === "pic") tag.classList.add("pic");
        b.addEventListener("pointerdown", (e) => { e.preventDefault(); hop(r, i); });
        b.addEventListener("click", (e) => { if (e.detail === 0) hop(r, i); });
        river.appendChild(b);
        return { el: b, tag, item, x: 0, y: 0, r, i };
      }));
      const frog = document.createElement("div");
      frog.className = "fh-frog";
      frog.innerHTML = '<div class="fh-tongue"></div><div class="fh-fbody"><div class="fh-belly"></div></div><div class="fh-feye l"></div><div class="fh-feye r"></div><div class="fh-fmouth"></div>';
      river.appendChild(frog);

      // ---------- Layout ----------
      let W = 0, H = 0, bank = 40, ps = 70, rowY = [], startY = 0, endY = 0;
      const phase = [...Array(R)].map(() => Math.random() * 6.28);
      function layout() {
        W = river.clientWidth; H = river.clientHeight;
        bank = Math.max(40, Math.min(64, H * 0.11));
        const span = H - bank * 2;
        rowY = [...Array(R)].map((_, r) => H - bank - span * ((r + 0.5) / R)); // row 0 nearest the frog
        ps = Math.max(46, Math.min(W / (N + 0.6), (span / R) * 0.86, 120));
        river.style.setProperty("--bank", `${bank}px`);
        river.style.setProperty("--ps", `${ps}px`);
        river.style.setProperty("--fs", `${ps * 0.62}px`);
        startY = H - bank * 0.55; endY = bank * 0.62;
        pads.flat().forEach((p) => {
          if (p.item.kind === "word") p.tag.style.fontSize = `${Math.min(ps * 0.36, (ps * 0.84) / (p.item.text.length * 0.6))}px`;
        });
      }
      const amp = () => (drift ? Math.min(W * 0.08, ps * 0.4) : 0);
      function padX(r, i, t) {
        const gap = W / N;
        return gap * (i + 0.5) + Math.sin(t * 0.0011 * (0.8 + 0.4 * speed) + phase[r]) * amp() * (r % 2 ? -1 : 1);
      }

      // ---------- Frog state ----------
      let row = -1;              // the row the frog is on (-1 = start bank)
      let onPad = null;          // the pad it's standing on
      let jump = null;           // { from:{x,y}, to: () => {x,y}, t0, ms, then }
      let done = false;
      let frogPos = { x: 0, y: 0 };
      function setLive() {
        pads.forEach((rowPads, r) => rowPads.forEach((p) => p.el.classList.toggle("live", !done && r === row + 1 && !jump)));
      }

      function frame(now) {
        pads.forEach((rowPads, r) => rowPads.forEach((p) => {
          if (p.sunk) return;
          p.x = padX(r, p.i, now); p.y = rowY[r];
          p.el.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px)`;
        }));
        if (jump) {
          const k = Math.min(1, (now - jump.t0) / jump.ms);
          const to = jump.to();
          const x = jump.from.x + (to.x - jump.from.x) * k;
          const y = jump.from.y + (to.y - jump.from.y) * k - Math.sin(k * Math.PI) * ps * 0.55;
          frogPos = { x, y };
          frog.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${1 + Math.sin(k * Math.PI) * 0.2})`;
          if (k >= 1) { const then = jump.then; jump = null; then(); }
        } else {
          if (onPad && !onPad.sunk) frogPos = { x: onPad.x, y: onPad.y };
          frog.style.transform = `translate(${frogPos.x.toFixed(1)}px, ${frogPos.y.toFixed(1)}px)`;
        }
        ctx.raf(frame);
      }
      layout();
      frogPos = { x: W / 2, y: startY };
      setLive();
      ctx.raf(frame);
      const ro = new ResizeObserver(() => {
        layout();
        if (row < 0 && !jump) frogPos = { x: W / 2, y: startY };
      });
      ro.observe(river);

      // ---------- Hopping ----------
      function hop(r, i) {
        if (done || ctx.ended || jump || r !== row + 1) return;
        const p = pads[r][i];
        sweep(300, 700, 0.15, "square", 0.07); // boing
        jump = { from: { ...frogPos }, to: () => ({ x: p.x, y: p.y }), t0: performance.now(), ms: 330, then: () => land(p) };
        onPad = null;
        setLive();
      }

      function land(p) {
        if (!p.item.right) { splash(p); return; }
        row = p.r;
        onPad = p;
        p.el.classList.add("done");
        // ribbit!
        tone(220, 0.07, "square", 0.08); tone(180, 0.09, "square", 0.08, 0.08);
        if (type === "phonics" || type === "cvc") ctx.say(p.item.spoken);
        if (row === R - 1) {
          // Last row: one more hop onto the far bank, then the tongue gets the fly.
          ctx.later(() => {
            jump = { from: { ...frogPos }, to: () => ({ x: W / 2, y: endY + ps * 0.28 }), t0: performance.now(), ms: 330, then: catchFly };
            onPad = null;
            sweep(300, 700, 0.15, "square", 0.07);
          }, 160);
        }
        setLive();
      }

      function catchFly() {
        done = true;
        ctx.win();
        setLive();
        const tongue = frog.querySelector(".fh-tongue");
        tongue.animate([{ height: "0px" }, { height: `${ps * 0.5}px` }, { height: "0px" }], { duration: 260, easing: "ease-out" });
        fly.classList.add("gone");
        sweep(1800, 300, 0.12, "sine", 0.1);
        ctx.later(() => {
          tone(660, 0.08, "triangle", 0.12); tone(880, 0.08, "triangle", 0.12, 0.08); tone(1320, 0.14, "triangle", 0.12, 0.16);
          ctx.confetti(fx, frogPos.x, frogPos.y);
        }, 230);
        ctx.say(answer);
      }

      function splash(p) {
        done = true;
        ctx.lose();
        p.sunk = true;
        p.el.classList.add("sink");
        p.el.style.transform = `translate(${p.x.toFixed(1)}px, ${(p.y + ps * 0.25).toFixed(1)}px) scale(.6)`;
        frog.classList.add("sad", "wet");
        frogPos = { x: p.x, y: p.y + ps * 0.12 };
        noise(0.45, "lowpass", 1800, 200, 0.7); // SPLASH
        sweep(500, 150, 0.4, "sine", 0.12, 0.05);
        if (!reduceMotion) {
          [0, 0.15, 0.3].forEach((d) => {
            const s = document.createElement("div");
            s.className = "fh-splash";
            s.style.left = `${p.x}px`; s.style.top = `${p.y}px`;
            s.style.animationDelay = `${d}s`;
            fx.appendChild(s);
          });
          for (let k = 0; k < 8; k++) {
            const d = document.createElement("div");
            d.className = "fh-drop";
            d.style.left = `${p.x}px`; d.style.top = `${p.y}px`;
            fx.appendChild(d);
            const a = Math.PI + (k / 7) * Math.PI, r = ps * (0.6 + Math.random() * 0.5);
            d.animate([{ transform: "translate(0,0)" }, { transform: `translate(${Math.cos(a) * r}px, ${Math.sin(a) * r}px)`, offset: 0.5 },
              { transform: `translate(${Math.cos(a) * r * 1.3}px, ${ps * 0.3}px)`, opacity: 0 }], { duration: 650, easing: "ease-out", fill: "forwards" });
          }
        }
        ctx.later(() => { showRight(p.r); ctx.say(answer); }, 450);
        setLive();
      }

      function showRight(r) {
        pads[r].forEach((q) => { if (q.item.right) q.el.classList.add("right"); else if (!q.sunk) q.el.classList.add("dim"); });
      }

      function replay() { if (!done) ctx.say(prompt); }

      ctx.onTimeout(() => {
        done = true;
        frog.classList.add("sad");
        setLive();
        if (row + 1 < R) showRight(row + 1);
        ctx.say(answer);
      });

      function onKey(e) {
        const i = parseInt(e.key, 10) - 1;
        if (i >= 0 && i < N) { e.preventDefault(); hop(row + 1, i); }
        else if (e.key === " ") { e.preventDefault(); replay(); }
      }
      document.addEventListener("keydown", onKey);

      ctx.say(prompt);

      return function cleanup() {
        done = true;
        ro.disconnect();
        document.removeEventListener("keydown", onKey);
      };
    },
  });
})();
