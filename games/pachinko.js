// PACHINKO — a monster at the top holds a ball. Colour-coded tubes run from funnels at the top down to
// answer slots at the bottom, swapping lanes and crossing on the way (a braid of adjacent swaps), so
// the player follows the right slot's colour back up and taps that funnel. The ball drops in, the
// clock stops (`ctx.freezeTimer`), and the ball rides the tube down while the machine's bulbs flash
// and it boings and pings. Right slot: JACKPOT — a burst of silver balls flies off the screen, plus
// confetti. Wrong slot: the monster cries and the right slot glows.
//
// Letter list: the ball is a lowercase letter (a), and the slots are capitals (A, look-alikes).
// Phonics: the ball is a picture, the slots are letters (where does 🍎 go? A). CVC: the ball is a
// picture, the slots are words. HFW: a plain silver ball, the voice says the word, the slots are words.
// Faster speeds: 4 lanes from 1.5× (3 before), and 5 rows of swaps from 2× (4 before).
(function () {
  const TEXT = {
    name: { en: "Pachinko" },
    icon: "🎰",
    howTo: (list) => {
      const what = {
        letter: ["🔤", "The ball has a small letter, like \"a\". It needs to land on the big A."],
        phonics: ["🍎", "The ball has a picture, like an apple. Which letter does it start with? A!"],
        cvc: ["🐱", "The ball has a picture, like a cat. Find the word \"cat\" at the bottom."],
        hfw: ["👂", "Listen to the word, like \"the\". Find it at the bottom."],
      }[list.type] || ["👀", "Look at the ball."];
      return { en: {
        steps: [
          what,
          ["🌈", "Follow that slot's color up the tube to the top."],
          ["👆", "Tap the funnel with the same color to drop the ball!"],
        ],
        tips: [
          "Tap the monster to hear it again.",
          "Once the ball drops, the clock stops. Watch it go!",
          "When the game speeds up, there are more tubes and more crossings.",
        ],
      } };
    },
    instruction: { en: "DROP\nTHE BALL!" },
    listen: "🔊",
    answer: (letter, word) => `${letter} for ${word}`,
    funnelLabel: (i) => `Drop into tube ${i + 1}`,
    monsterLabel: "Hear it again",
  };

  const TUBE_COLORS = ["#ff2e88", "#1e6bff", "#ffb800", "#00b86b", "#8a2be2"];
  const SVG_NS = "http://www.w3.org/2000/svg";
  const PENTA = [523, 587, 659, 784, 880, 1047, 1175, 1319];

  const CSS = `
  .pk { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; padding:0 10px 10px; }
  .pk-top { flex:none; position:relative; height:clamp(86px, 15dvh, 110px); width:100%; display:flex; align-items:flex-end; justify-content:center; }
  .pk-mon { position:relative; width:clamp(70px, 20vw, 92px); height:clamp(64px, 18vw, 84px); cursor:pointer; touch-action:manipulation;
    transition:transform .3s cubic-bezier(.3,1.5,.5,1); z-index:3; }
  .pk-mbody { position:absolute; inset:0; background:#7ac943; border:5px solid #111; border-radius:50% 50% 40% 40%; box-shadow:inset -6px -6px 0 rgba(0,0,0,.15); }
  .pk-meye { position:absolute; top:28%; width:20%; height:24%; background:#fff; border:3px solid #111; border-radius:50%; }
  .pk-meye::after { content:""; position:absolute; left:28%; top:34%; width:46%; height:46%; background:#111; border-radius:50%; }
  .pk-meye.l { left:22%; } .pk-meye.r { right:22%; }
  .pk-mmouth { position:absolute; left:50%; top:62%; width:30%; height:16%; margin-left:-15%; background:#4a0d1a; border:3px solid #111; border-radius:0 0 99px 99px; }
  .pk-mon.sad .pk-mmouth { border-radius:99px 99px 0 0; height:10%; top:68%; }
  .pk-mon.sad .pk-meye::after { top:52%; }
  .pk-mon.sad .pk-mbody { animation:pk-sob .3s ease-in-out infinite alternate; }
  .pk-mon.happy { animation:pk-hop .4s cubic-bezier(.2,1.6,.4,1) 3; }
  .pk-tear { position:absolute; top:44%; font-size:1.2rem; animation:pk-tear .6s ease-in infinite; }
  .pk-say { position:absolute; left:100%; top:0; margin-left:-6px; padding:2px 8px; background:#fff; border:3px solid #111; border-radius:12px; font-size:1.3rem; }

  .pk-machine { position:relative; flex:1; min-height:0; width:100%; max-width:520px; background:linear-gradient(180deg, #2a1a5e, #4a2a8e);
    border:6px solid #111; border-radius:22px 22px 14px 14px; box-shadow:0 8px 0 #111, inset 0 0 0 6px #c0c6d0; overflow:hidden; }
  .pk-machine::before { content:""; position:absolute; inset:14px; border-radius:12px;
    background-image:radial-gradient(circle, rgba(255,255,255,.35) 2px, transparent 2.5px); background-size:26px 26px; opacity:.6; }
  .pk-svg { position:absolute; inset:0; width:100%; height:100%; overflow:visible; }
  .pk-bulb { position:absolute; width:10px; height:10px; margin:-5px 0 0 -5px; border-radius:50%; background:#5a4a2a; border:2px solid #111; z-index:2; }
  .pk-machine.lit .pk-bulb { animation:pk-blink .35s steps(1) infinite; animation-delay:var(--d); }
  .pk-machine.jackpot .pk-bulb { animation:pk-blink .12s steps(1) infinite; animation-delay:var(--d); }
  .pk-funnel { position:absolute; top:0; height:58px; padding:0; border:0; background:none; cursor:pointer; touch-action:manipulation; z-index:3; }
  .pk-funnel i { position:absolute; left:50%; top:6px; width:68%; height:40px; transform:translateX(-50%); background:var(--c); border:4px solid #111;
    clip-path:polygon(0 0, 100% 0, 66% 100%, 34% 100%); }
  .pk-funnel::after { content:""; position:absolute; left:50%; top:6px; width:68%; height:40px; transform:translateX(-50%);
    background:linear-gradient(90deg, transparent 20%, rgba(255,255,255,.4) 30%, transparent 40%); clip-path:polygon(0 0, 100% 0, 66% 100%, 34% 100%); }
  .pk-funnel.pick i { filter:brightness(1.3); }
  .pk-funnel:disabled { cursor:default; }
  .pk-slots { position:absolute; left:0; right:0; bottom:0; height:var(--sh); z-index:2; }
  .pk-slot { position:absolute; bottom:8px; height:calc(var(--sh) - 14px); display:flex; align-items:center; justify-content:center; background:#fff;
    border:5px solid var(--c); border-top-width:9px; border-radius:6px 6px 14px 14px; box-shadow:0 0 0 3px #111; color:#111; font-size:clamp(1.8rem, 9vw, 2.6rem);
    line-height:1; white-space:nowrap; }
  .pk-slot.right { background:#b8ffcf; box-shadow:0 0 0 3px #111, 0 0 0 9px #00b86b; animation:pk-wiggle .4s ease-in-out 3; }
  .pk-slot.wrong { background:#ffc2c2; }
  .pk-ball { position:absolute; left:0; top:0; width:var(--bs); height:var(--bs); margin:calc(var(--bs) * -.5) 0 0 calc(var(--bs) * -.5); border-radius:50%;
    background:radial-gradient(circle at 34% 30%, #fff 0 18%, #e6e9ee 26%, #9aa3ad 70%, #6d7680 100%); border:3px solid #111; z-index:4;
    display:flex; align-items:center; justify-content:center; font-size:calc(var(--bs) * .5); line-height:1; color:#111; will-change:transform; }
  .pk-ball.content { background:radial-gradient(circle at 34% 30%, #fff 0 60%, #e8ecf2 100%); }
  .pk-shot { position:absolute; width:18px; height:18px; margin:-9px 0 0 -9px; border-radius:50%; border:2px solid #111; z-index:6;
    background:radial-gradient(circle at 34% 30%, #fff 0 18%, #d8dde3 30%, #8a939d 100%); }
  .pk-fx { position:absolute; inset:0; pointer-events:none; overflow:visible; z-index:5; }

  @keyframes pk-blink { 0% { background:#ffe14d; box-shadow:0 0 10px 3px #ffe14d; } 50% { background:#ff2e88; box-shadow:0 0 10px 3px #ff2e88; } }
  @keyframes pk-hop { 50% { transform:translateY(-18%); } }
  @keyframes pk-sob { from { transform:scaleY(1); } to { transform:scaleY(.94) translateY(3%); } }
  @keyframes pk-tear { from { transform:translateY(0); opacity:1; } to { transform:translateY(160%); opacity:0; } }
  @keyframes pk-wiggle { 25% { transform:rotate(-5deg) scale(1.05); } 75% { transform:rotate(5deg) scale(1.05); } }
  @media (prefers-reduced-motion: reduce) {
    .pk-machine.lit .pk-bulb, .pk-machine.jackpot .pk-bulb, .pk-mon.happy, .pk-mon.sad .pk-mbody, .pk-tear, .pk-slot.right { animation:none !important; }
  }`;

  function injectCss() {
    if (document.getElementById("pk-css")) return;
    const style = document.createElement("style");
    style.id = "pk-css";
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  registerMicrogame({
    id: "pachinko",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 8000,
    input: "tap",

    start(ctx) {
      injectCss();
      const type = ctx.list.type;
      const speed = ctx.speed || 1;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const n = speed >= 1.5 ? 4 : 3;
      const LEVELS = speed >= 2 ? 5 : 4;
      const letterName = (it) => it.say || it.text.toUpperCase();
      const { tone, sweep, noise } = ctx.sfx;

      // ---------- Content ----------
      // ball: what the ball shows ("" = plain silver). slots: [{ text, right }]
      let ball, prompt, answer, slots, slotKind = "letter";
      if (type === "phonics") {
        const letter = ctx.items.find((it) => ctx.phonics.pics(it).length) || ctx.items[0];
        const pic = ctx.pick(ctx.phonics.pics(letter));
        ball = pic.emoji;
        prompt = pic.word;
        answer = TEXT.answer(letterName(letter), pic.word);
        slots = ctx.pickOptions(letter, n).map((o) => ({ text: o.text.toUpperCase(), right: o === letter }));
      } else if (type === "cvc") {
        const target = ctx.items.find((it) => it.emoji) || ctx.items[0];
        ball = target.emoji;
        prompt = answer = target.say || target.text;
        slots = ctx.pickOptions(target, n).map((o) => ({ text: o.text, right: o === target }));
        slotKind = "word";
      } else if (type === "hfw") {
        const target = ctx.items[0];
        ball = "";
        prompt = answer = target.say || target.text;
        slots = ctx.pickOptions(target, n).map((o) => ({ text: o.text, right: o === target }));
        slotKind = "word";
      } else {
        const target = ctx.items[0];
        const il = (o) => [o, target].map((x) => x.text.toUpperCase()).sort().join("") !== "IL";
        ball = target.text.toLowerCase();
        prompt = letterName(target);
        answer = prompt;
        slots = [target, ...ctx.pickOptions(target, n + 2).filter((o) => o !== target && il(o)).slice(0, n - 1)]
          .map((o) => ({ text: o.text.toUpperCase(), right: o === target }));
      }
      slots = ctx.shuffle(slots);

      // ---------- The braid ----------
      // swaps[k] lists the left lanes of the adjacent pairs that swap at level k. Every level swaps
      // something, and no funnel drops straight into its own slot (so the colours have to be followed).
      let swaps, endLane;
      for (let tries = 0; tries < 50; tries++) {
        swaps = [...Array(LEVELS)].map(() => {
          const s = [];
          for (let i = 0; i < n - 1; i++) if (Math.random() < 0.55 && !s.includes(i - 1)) s.push(i);
          if (!s.length) s.push(Math.floor(Math.random() * (n - 1)));
          return s;
        });
        endLane = [...Array(n)].map((_, start) => trace(start).at(-1));
        if (endLane.every((e, s) => e !== s)) break;
      }
      // The lane a ball from funnel `start` is in at each level boundary (LEVELS + 1 entries).
      function trace(start) {
        const lanes = [start];
        let cur = start;
        for (const s of swaps) {
          if (s.includes(cur)) cur += 1;
          else if (s.includes(cur - 1)) cur -= 1;
          lanes.push(cur);
        }
        return lanes;
      }
      const paths = [...Array(n)].map((_, i) => trace(i));
      const slotOfFunnel = endLane;                      // funnel i lands in slot endLane[i]
      const colorOfSlot = [];
      slotOfFunnel.forEach((s, f) => { colorOfSlot[s] = TUBE_COLORS[f]; });

      // ---------- DOM ----------
      const wrap = document.createElement("div");
      wrap.className = "pk";
      const top = document.createElement("div");
      top.className = "pk-top";
      const mon = document.createElement("div");
      mon.className = "pk-mon";
      mon.setAttribute("role", "button");
      mon.setAttribute("aria-label", TEXT.monsterLabel);
      mon.innerHTML = '<div class="pk-mbody"></div><div class="pk-meye l"></div><div class="pk-meye r"></div><div class="pk-mmouth"></div>' +
        (ball ? "" : `<div class="pk-say">${TEXT.listen}</div>`);
      mon.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });
      top.appendChild(mon);
      const machine = document.createElement("div");
      machine.className = "pk-machine";
      const svg = document.createElementNS(SVG_NS, "svg");
      svg.setAttribute("class", "pk-svg");
      const slotsEl = document.createElement("div");
      slotsEl.className = "pk-slots";
      const fx = document.createElement("div");
      fx.className = "pk-fx";
      machine.append(svg, slotsEl, fx);
      wrap.append(top, machine);
      ctx.root.appendChild(wrap);

      const ballEl = document.createElement("div");
      ballEl.className = "pk-ball" + (ball ? " content" : "");
      ballEl.textContent = ball;
      wrap.appendChild(ballEl);

      const funnels = [...Array(n)].map((_, i) => {
        const b = document.createElement("button");
        b.className = "pk-funnel";
        b.style.setProperty("--c", TUBE_COLORS[i]);
        b.setAttribute("aria-label", TEXT.funnelLabel(i));
        b.innerHTML = "<i></i>";
        b.addEventListener("pointerdown", (e) => { e.preventDefault(); drop(i); });
        b.addEventListener("click", (e) => { if (e.detail === 0) drop(i); });
        machine.appendChild(b);
        return b;
      });
      const slotEls = slots.map((s, i) => {
        const el = document.createElement("div");
        el.className = "pk-slot";
        el.textContent = s.text;
        el.style.setProperty("--c", colorOfSlot[i]);
        slotsEl.appendChild(el);
        return el;
      });
      // Bulbs round the edge of the machine.
      const bulbs = [];
      for (let i = 0; i < 26; i++) { const b = document.createElement("div"); b.className = "pk-bulb"; machine.appendChild(b); bulbs.push(b); }

      // ---------- Layout ----------
      let MW = 0, MH = 0, laneW = 0, yTop = 0, yBot = 0, pathEls = [];
      const laneX = (i) => laneW * (i + 0.5);
      function layout() {
        MW = machine.clientWidth; MH = machine.clientHeight;
        laneW = MW / n;
        const sh = Math.max(58, Math.min(84, MH * 0.17));
        machine.style.setProperty("--sh", `${sh}px`);
        yTop = 46; yBot = MH - sh - 4;
        const bs = Math.max(34, Math.min(58, laneW * 0.5));
        wrap.style.setProperty("--bs", `${bs}px`);
        machine.style.setProperty("--bs", `${bs}px`);
        funnels.forEach((f, i) => { f.style.left = `${laneW * i}px`; f.style.width = `${laneW}px`; });
        slotEls.forEach((el, i) => {
          el.style.left = `${laneW * i + 5}px`;
          el.style.width = `${laneW - 10}px`;
          if (slotKind === "word") el.style.fontSize = `${Math.min(36, (laneW - 22) / (slots[i].text.length * 0.62))}px`;
        });
        // Tubes: a dark outline under a coloured core, level by level, with S-bends where lanes swap.
        const dy = (yBot - yTop) / LEVELS;
        const d = paths.map((lanes) => {
          let s = `M${laneX(lanes[0]).toFixed(1)} ${yTop}`;
          lanes.slice(1).forEach((ln, k) => {
            const y0 = yTop + dy * k, y1 = y0 + dy, x0 = laneX(lanes[k]), x1 = laneX(ln);
            s += ` C${x0.toFixed(1)} ${(y0 + dy * 0.5).toFixed(1)} ${x1.toFixed(1)} ${(y0 + dy * 0.5).toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
          });
          return s + ` L${laneX(lanes.at(-1)).toFixed(1)} ${yBot + 6}`;
        });
        const tw = Math.max(10, Math.min(18, laneW * 0.16));
        svg.innerHTML = d.map((p) => `<path d="${p}" fill="none" stroke="#111" stroke-width="${tw + 8}" stroke-linecap="round"/>`).join("") +
          d.map((p, i) => `<path class="tube" d="${p}" fill="none" stroke="${TUBE_COLORS[i]}" stroke-width="${tw}" stroke-linecap="round"/>` +
            `<path d="${p}" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="${tw * 0.3}" stroke-linecap="round" transform="translate(${-tw * 0.18} 0)"/>`).join("");
        pathEls = [...svg.querySelectorAll(".tube")];
        // Bulbs: evenly round the border.
        const per = 2 * (MW + MH);
        bulbs.forEach((b, i) => {
          let p = (i / bulbs.length) * per, x, y;
          if (p < MW) { x = p; y = 7; } else if ((p -= MW) < MH) { x = MW - 7; y = p; } else if ((p -= MH) < MW) { x = MW - p; y = MH - 7; } else { x = 7; y = MH - (p - MW); }
          b.style.left = `${x}px`; b.style.top = `${y}px`;
          b.style.setProperty("--d", `${(-(i % 6) * 0.06).toFixed(2)}s`);
        });
        if (!dropped) placeBallInHands();
      }
      // The monster holds the ball out at its side (so it doesn't hide its face).
      const handPos = () => {
        const w = wrap.getBoundingClientRect(), m = mon.getBoundingClientRect();
        return { x: m.right - w.left + 8, y: m.top - w.top + m.height * 0.42 };
      };
      function placeBallInHands() { const p = handPos(); moveBall(p.x, p.y); }
      function moveBall(x, y) { ballEl.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`; }

      let done = false, dropped = false;
      layout();
      const ro = new ResizeObserver(() => { if (!dropped) layout(); });
      ro.observe(machine);

      // ---------- Dropping ----------
      function drop(i) {
        if (done || dropped || ctx.ended) return;
        dropped = true;
        ctx.freezeTimer();
        funnels.forEach((f) => { f.disabled = true; });
        funnels[i].classList.add("pick");
        const w = wrap.getBoundingClientRect(), mr = machine.getBoundingClientRect(), m = mon.getBoundingClientRect();
        const ox = mr.left - w.left + 6, oy = mr.top - w.top + 6; // machine content box inside the wrap
        // The monster leans over and tosses the ball into the funnel.
        const tx = ox + laneX(i);
        mon.style.transform = `translateX(${(tx - (m.left - w.left + m.width / 2)) * 0.5}px) rotate(${tx > m.left - w.left + m.width / 2 ? 10 : -10}deg)`;
        sweep(300, 900, 0.18, "square", 0.08); // boing
        const from = handPos(), to = { x: tx, y: oy + 18 };
        const tossMs = reduceMotion ? 1 : 380;
        const path = pathEls[i], len = path.getTotalLength();
        const fallMs = reduceMotion ? 1 : 2300;
        const t0 = performance.now();
        machine.classList.add("lit");
        let lastPing = 0, pi = 0;
        function anim(now) {
          const t = now - t0;
          if (t < tossMs) {
            const k = t / tossMs;
            moveBall(from.x + (to.x - from.x) * k, from.y + (to.y - from.y) * k - Math.sin(k * Math.PI) * 50);
          } else {
            const k = Math.min(1, (t - tossMs) / fallMs);
            const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; // ease in-out
            const p = path.getPointAtLength(len * e);
            moveBall(ox + p.x + Math.sin(k * 40) * 3 * (1 - k), oy + p.y);
            if (now - lastPing > 130) { lastPing = now; tone(PENTA[(pi++ * 3) % PENTA.length], 0.05, "square", 0.06); }
            if (k >= 1) { land(slotOfFunnel[i]); return; }
          }
          ctx.raf(anim);
        }
        ctx.raf(anim);
        // A slide whistle on the way down.
        ctx.later(() => sweep(1400, 500, fallMs / 1000, "sine", 0.05), tossMs);
      }

      function land(slot) {
        done = true;
        machine.classList.remove("lit");
        const right = slots[slot].right;
        if (right) {
          ctx.win();
          machine.classList.add("jackpot");
          slotEls[slot].classList.add("right");
          mon.style.transform = "";
          mon.classList.add("happy");
          [523, 659, 784, 1047, 1319, 1568].forEach((f, k) => tone(f, 0.1, "square", 0.08, k * 0.06)); // JACKPOT
          noise(0.6, "highpass", 3000, 8000, 0.15, 0.3); // coins
          const sr = slotEls[slot].getBoundingClientRect(), fr = fx.getBoundingClientRect();
          const sx = sr.left - fr.left + sr.width / 2, sy = sr.top - fr.top;
          ctx.confetti(fx, sx, sy);
          burst(sx, sy);
          ctx.say(answer);
        } else {
          ctx.lose();
          slotEls[slot].classList.add("wrong");
          mon.style.transform = "";
          mon.classList.add("sad");
          tears();
          [0, 0.3, 0.6].forEach((d, k) => sweep(392 - k * 40, 330 - k * 40, 0.28, "sawtooth", 0.08, d)); // wah wah wahhh
          ctx.later(() => {
            slots.forEach((s, k) => { if (s.right) slotEls[k].classList.add("right"); });
            ctx.say(answer);
          }, 500);
        }
      }

      // Silver balls fly up out of the slot and off the screen.
      function burst(x, y) {
        if (reduceMotion) return;
        const H = fx.clientHeight;
        for (let i = 0; i < 40; i++) {
          const b = document.createElement("div");
          b.className = "pk-shot";
          b.style.left = `${x}px`; b.style.top = `${y}px`;
          fx.appendChild(b);
          const vx = (Math.random() - 0.5) * 520, up = H * (0.6 + Math.random() * 0.7);
          b.animate([
            { transform: "translate(0,0)" },
            { transform: `translate(${vx * 0.5}px, ${-up}px)`, offset: 0.45 },
            { transform: `translate(${vx}px, ${H * 0.6}px)` },
          ], { duration: 1100 + Math.random() * 500, easing: "cubic-bezier(.2,.6,.6,1)", fill: "forwards", delay: Math.random() * 250 });
        }
      }
      function tears() {
        [0.18, 0.7].forEach((x, k) => {
          const t = document.createElement("div");
          t.className = "pk-tear";
          t.textContent = "💧";
          t.style.left = `${x * 100}%`;
          t.style.animationDelay = `${k * 0.3}s`;
          mon.appendChild(t);
        });
      }

      function replay() { if (!dropped) ctx.say(prompt); }

      ctx.onTimeout(() => {
        done = true;
        funnels.forEach((f) => { f.disabled = true; });
        mon.classList.add("sad");
        tears();
        slots.forEach((s, k) => { if (s.right) slotEls[k].classList.add("right"); });
        ctx.say(answer);
      });

      function onKey(e) {
        const i = parseInt(e.key, 10) - 1;
        if (i >= 0 && i < n) { e.preventDefault(); drop(i); }
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
