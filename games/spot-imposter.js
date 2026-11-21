// SPOT THE IMPOSTER — a policeman holds up a sign, and a parade of little walkers marches across the
// screen in lanes. They all match the sign except ONE look-alike imposter. Tap the imposter and the
// policeman catches it (whistle, a cage drops on it, GOTCHA!). Tap an innocent walker and it cries,
// while the imposter laughs villainously (MWAHAHA!) and glows.
//
// Letter list: the sign is a capital (A), the walkers are lowercase a, and the imposter is a lowercase
// look-alike (o), from `tricky` first. I and l are never paired. Phonics: the sign is a letter, the
// walkers carry pictures that start with it, the imposter's picture starts with another letter.
// CVC: the sign is a picture (🐱), the walkers say "cat", the imposter "cot" (a one-letter look-alike).
// HFW: the sign is 🔊 (the voice says "what"), the walkers say "what", the imposter "why".
// Taps hit the nearest walker within reach, so moving targets are easy to hit. Faster speeds: more
// walkers (6, 8 from 1.5×, 10 from 2×) marching faster.
(function () {
  const TEXT = {
    name: { en: "Spot the Imposter" },
    icon: "👮",
    howTo: (list) => {
      const what = {
        letter: ["🚶", "Lots of a's are marching… but one is an o, hiding in the crowd!"],
        phonics: ["🚶", "The pictures all start with A… but one doesn't!"],
        cvc: ["🚶", "Everyone says \"cat\"… but one says \"cot\"!"],
        hfw: ["🚶", "Everyone says \"what\"… but one says \"why\"!"],
      }[list.type] || ["🚶", "Everyone is the same… except one!"];
      return { en: {
        steps: [
          ["👮", "The policeman is looking for an imposter."],
          ["❌", "The WANTED poster shows the imposter."],
          what,
          ["👆", "Find it in the parade and tap it to catch it!"],
        ],
        tips: [
          "Tap the policeman to hear the imposter's name again.",
          "You get one try. Tap the wrong one and the imposter laughs at you!",
          "When the game speeds up, there are more walkers and they march faster.",
        ],
      } };
    },
    instruction: { en: "SPOT THE\nIMPOSTER!" },
    listen: "🔊",
    wanted: "WANTED",
    gotcha: "GOTCHA!",
    laugh: "MWAHAHA!",
    copLabel: "Hear it again",
    answer: (letter, word) => `${letter} for ${word}`,
  };

  const WALKER_COLORS =["#ff8a00", "#8a2be2", "#00b86b", "#ff2e88", "#1e6bff", "#e8173c"];

  const CSS = `
  .sp { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:6px; overflow:hidden; }
  .sp-top { flex:none; display:flex; align-items:flex-end; justify-content:center; gap:10px; padding-top:4px; cursor:pointer; touch-action:manipulation; }
  .sp-cop { --C:clamp(68px, 20vw, 96px); position:relative; width:var(--C); height:calc(var(--C) * 1.12); font-size:var(--C); }
  .sp-cop-body { position:absolute; left:.08em; right:.08em; top:.3em; bottom:0; background:#2457d6; border:.045em solid #111; border-radius:46% 46% 30% 30%; }
  .sp-cop-face { position:absolute; left:.16em; right:.16em; top:.26em; height:.5em; background:#ffd2a8; border:.04em solid #111; border-radius:50%; }
  .sp-cop-hat { position:absolute; left:.1em; right:.1em; top:.02em; height:.3em; background:#1b2b6b; border:.045em solid #111; border-radius:50% 50% 12% 12%; }
  .sp-cop-hat::after { content:"⭐"; position:absolute; left:50%; top:46%; transform:translate(-50%, -50%); font-size:.16em; }
  .sp-cop-brim { position:absolute; left:.06em; right:.06em; top:.27em; height:.08em; background:#111; border-radius:99px; }
  .sp-cop-eye { position:absolute; top:.42em; width:.09em; height:.11em; background:#111; border-radius:50%; }
  .sp-cop-eye.l { left:.34em; } .sp-cop-eye.r { right:.34em; }
  .sp-cop-stache { position:absolute; left:50%; top:.58em; width:.3em; height:.08em; margin-left:-.15em; background:#5b3a1a; border-radius:99px 99px 40% 40%; }
  .sp-cop.angry .sp-cop-eye { height:.06em; }
  .sp-cop.happy { animation:sp-jump .45s cubic-bezier(.2,1.6,.4,1) 2; }
  .sp-cop.sad .sp-cop-eye { height:.05em; top:.45em; }
  .sp-sign { position:relative; min-width:clamp(80px, 24vw, 108px); height:clamp(70px, 20vw, 92px); padding:0 12px; background:#fff; color:#111; border:5px solid #111;
    border-radius:14px; box-shadow:0 6px 0 #111; display:flex; align-items:center; justify-content:center; gap:4px; transform:rotate(3deg);
    font-size:clamp(2.6rem, 13vw, 3.6rem); line-height:1; white-space:nowrap; margin-bottom:10px; }
  .sp-sign.word { font-size:clamp(1.7rem, 8vw, 2.3rem); }
  /* The WANTED poster: a header, the imposter big, and a big red X badge. */
  .sp-sign.bad { flex-direction:column; gap:2px; min-width:clamp(130px, 40vw, 170px); height:auto; padding:6px 16px 10px; background:#fff4d6;
    border:7px solid #e8173c; box-shadow:0 0 0 3px #111, 0 7px 0 3px #111; transform:rotate(-3deg); font-size:clamp(3rem, 15vw, 4.2rem); }
  .sp-sign.bad.word { font-size:clamp(2rem, 9vw, 2.6rem); }
  .sp-wanted { font-size:clamp(1rem, 5vw, 1.35rem); letter-spacing:.08em; color:#e8173c; -webkit-text-stroke:1px #111; }
  .sp-x { position:absolute; right:-20px; top:-20px; width:46px; height:46px; border-radius:50%; background:#e8173c; border:4px solid #111;
    box-shadow:0 4px 0 #111; color:#fff; font-size:2rem; line-height:38px; text-align:center; transform:rotate(8deg); -webkit-text-stroke:1px #111; }
  .sp-bubble { position:absolute; left:50%; top:92%; transform:translateX(-50%) rotate(-5deg); padding:4px 12px; background:#fff; border:4px solid #111;
    border-radius:99px; box-shadow:0 4px 0 #111; font-size:1.3rem; white-space:nowrap; color:#111; display:none; z-index:6; }
  .sp-bubble.show { display:block; animation:sp-pop .25s cubic-bezier(.2,1.8,.4,1); }
  .sp-top { position:relative; z-index:6; }
  .sp-laugh { position:absolute; transform:translate(-50%, -100%) rotate(-6deg); padding:3px 10px; background:#2b0a3d; color:#fff; border:4px solid #111;
    border-radius:99px; box-shadow:0 4px 0 #111; font-size:1.2rem; white-space:nowrap; animation:sp-pop2 .25s cubic-bezier(.2,1.8,.4,1); }

  .sp-field { position:relative; flex:1; min-height:0; width:100%; overflow:hidden; touch-action:manipulation; cursor:pointer;
    background:repeating-linear-gradient(0deg, rgba(255,255,255,.12) 0 2px, transparent 2px var(--lane, 100px)); }
  .sp-fx { position:absolute; inset:0; pointer-events:none; overflow:visible; z-index:5; }
  .sp-w { position:absolute; left:0; top:0; width:var(--ww); height:calc(var(--wh) * 1.18); will-change:transform; pointer-events:none; }
  .sp-w.word { width:calc(var(--ww) * 1.6); }
  .sp-wi { position:absolute; inset:0; }
  .sp-wbody { position:absolute; left:0; right:0; top:0; height:var(--wh); background:var(--c); border:4px solid #111; border-radius:40% 40% 28% 28%;
    box-shadow:inset -6px -5px 0 rgba(0,0,0,.18); }
  .sp-w.word .sp-wbody { border-radius:26px 26px 18px 18px; }
  .sp-weye { position:absolute; top:10%; width:20%; aspect-ratio:1; background:#fff; border:3px solid #111; border-radius:50%; }
  .sp-w.word .sp-weye { width:13%; }
  .sp-weye::after { content:""; position:absolute; left:30%; top:30%; width:45%; height:45%; background:#111; border-radius:50%; }
  .sp-weye.l { left:24%; } .sp-weye.r { right:24%; }
  .sp-brow { position:absolute; top:3%; width:24%; height:6%; background:#111; border-radius:99px; opacity:0; }
  .sp-w.word .sp-brow { width:15%; }
  .sp-brow.l { left:22%; transform:rotate(20deg); } .sp-brow.r { right:22%; transform:rotate(-20deg); }
  .sp-wtag { position:absolute; left:6%; right:6%; top:36%; bottom:6%; display:flex; align-items:center; justify-content:center; color:#fff;
    font-size:calc(var(--wh) * .5); line-height:1; -webkit-text-stroke:3px #111; paint-order:stroke fill; white-space:nowrap; }
  .sp-wtag.pic { font-size:calc(var(--wh) * .44); -webkit-text-stroke:0; }
  .sp-wtag.word { font-size:calc(var(--wh) * .34); }
  .sp-leg { position:absolute; bottom:0; width:12%; height:20%; background:#111; border-radius:99px; transform-origin:50% 0; animation:sp-step .4s ease-in-out infinite alternate; }
  .sp-leg.l { left:28%; } .sp-leg.r { right:28%; animation-delay:-.4s; }
  .sp-w.stop .sp-leg { animation:none; }
  .sp-w .sp-wi { animation:sp-bob .4s ease-in-out infinite alternate; }
  .sp-w.stop .sp-wi { animation:none; }

  .sp-w.caught .sp-wbody::after { content:""; position:absolute; inset:-10% -8%; border:4px solid #111; border-radius:8px;
    background:repeating-linear-gradient(90deg, #555 0 6px, transparent 6px 20px); animation:sp-cage .25s ease-in both; }
  .sp-w.caught .sp-brow { opacity:1; transform:none; }
  .sp-w.sad .sp-brow { opacity:1; }
  .sp-w.sad .sp-brow.l { transform:rotate(-20deg); } .sp-w.sad .sp-brow.r { transform:rotate(20deg); }
  .sp-w.sad .sp-weye::after { top:50%; }
  .sp-w.sad .sp-wi::after { content:"💧"; position:absolute; left:16%; top:24%; font-size:calc(var(--wh) * .22); animation:sp-tear .7s ease-in infinite; }
  .sp-w.evil .sp-brow { opacity:1; }
  .sp-w.evil .sp-wi { animation:sp-laugh .18s ease-in-out infinite alternate; }
  .sp-w.evil .sp-wbody { box-shadow:0 0 0 6px #fff, 0 0 0 10px #111, inset -6px -5px 0 rgba(0,0,0,.18); }
  .sp-w.evil .sp-wi::before { content:"😈"; position:absolute; right:-14%; top:-22%; font-size:calc(var(--wh) * .36); z-index:2; }
  .sp-w.dim { opacity:.4; }

  @keyframes sp-step { from { transform:rotate(-24deg); } to { transform:rotate(24deg); } }
  @keyframes sp-bob { from { transform:translateY(0); } to { transform:translateY(-6%); } }
  @keyframes sp-jump { 50% { transform:translateY(-16%); } }
  @keyframes sp-pop { from { transform:translateX(-50%) scale(.3); } }
  @keyframes sp-pop2 { from { transform:translate(-50%, -100%) scale(.3); } }
  @keyframes sp-cage { from { transform:translateY(-140%); } }
  @keyframes sp-tear { from { transform:translateY(0); opacity:1; } to { transform:translateY(180%); opacity:0; } }
  @keyframes sp-laugh { from { transform:rotate(-6deg) scale(1.04); } to { transform:rotate(6deg) scale(1.08); } }
  @media (prefers-reduced-motion: reduce) {
    .sp-leg, .sp-w .sp-wi, .sp-cop.happy, .sp-w.evil .sp-wi, .sp-w.sad .sp-wi::after, .sp-bubble.show, .sp-w.caught .sp-wbody::after { animation:none !important; }
  }`;

  function injectCss() {
    if (document.getElementById("sp-css")) return;
    const style = document.createElement("style");
    style.id = "sp-css";
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  registerMicrogame({
    id: "spot-imposter",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 9000,
    input: "tap",
    tutorial: true, // has a ctx.tutorial script

    start(ctx) {
      injectCss();
      const type = ctx.list.type;
      const speed = ctx.speed || 1;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const N = speed >= 2 ? 13 : speed >= 1.5 ? 11 : 9;
      const letterName = (it) => it.say || it.text.toUpperCase();
      const { tone, sweep, noise } = ctx.sfx;

      // ---------- Content ----------
      // walkers: [{ text, kind, odd }]; exactly one is odd.
      const lookAlike = (target, ok = () => true) =>
        ctx.pickOptions(target, 6).find((o) => o !== target && ok(o)) || ctx.items.find((o) => o !== target && ok(o));
      // Words: how alike two spellings look. Edit distance, plus a point if the first letters differ
      // (what/why scores 2, cat/cot 1, very/look 5).
      const lev = (a, b) => {
        const m = [...Array(b.length + 1).keys()];
        for (let i = 1; i <= a.length; i++) {
          let prev = m[0]; m[0] = i;
          for (let j = 1; j <= b.length; j++) {
            const tmp = m[j];
            m[j] = Math.min(m[j] + 1, m[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
            prev = tmp;
          }
        }
        return m[b.length];
      };
      const alike = (a, b) => lev(a.text, b.text) + (a.text[0] === b.text[0] ? 0 : 1);
      // A target (from the shuffled pool) that has a close twin in the list, and that twin.
      function twins(pool, all) {
        let best = null;
        for (const t of pool.slice(0, 30)) {
          const others = ctx.shuffle(all.filter((o) => o !== t && o.text !== t.text));
          for (const o of others) {
            const s = alike(t, o);
            if (!best || s < best[2]) best = [t, o, s];
          }
          if (best && best[2] <= 2) break;
        }
        return best ? [best[0], best[1]] : [pool[0], lookAlike(pool[0])];
      }
      let signText, signKind = "", prompt, oddSpoken, walkers, answerItem; // answerItem: the list item the round is about (tutorial)
      if (type === "phonics") {
        const letter = ctx.items.find((it) => ctx.phonics.pics(it).length) || ctx.items[0];
        answerItem = letter;
        const set = ctx.phonics.set(letter, N - 1, 1);
        const pics = ctx.phonics.pics(letter);
        const good = [...Array(N - 1)].map((_, i) => (set.right[i] || pics[i % pics.length]));
        const odd = set.wrong[0];
        signText = letter.text.toUpperCase();
        prompt = letterName(letter);
        oddSpoken = odd.word;
        walkers = [...good.map((p) => ({ text: p.emoji, kind: "pic", odd: false })), { text: odd.emoji, kind: "pic", odd: true }];
      } else if (type === "cvc") {
        const pool = ctx.items.filter((it) => it.emoji);
        const [target, odd] = twins(pool.length ? pool : ctx.items, ctx.items);
        answerItem = odd;
        signText = target.emoji || target.text;
        prompt = target.say || target.text;
        oddSpoken = odd.say || odd.text;
        walkers = [...Array(N - 1)].map(() => ({ text: target.text, kind: "word", odd: false })).concat({ text: odd.text, kind: "word", odd: true });
      } else if (type === "hfw") {
        const [target, odd] = twins(ctx.items, ctx.items);
        answerItem = odd;
        signText = target.text;
        signKind = "word";
        prompt = target.say || target.text;
        oddSpoken = odd.say || odd.text;
        walkers = [...Array(N - 1)].map(() => ({ text: target.text, kind: "word", odd: false })).concat({ text: odd.text, kind: "word", odd: true });
      } else {
        const target = ctx.items[0];
        answerItem = target;
        const il = (o) => [o, target].map((x) => x.text.toUpperCase()).sort().join("") !== "IL";
        // The imposter must look different in lowercase too.
        // Lowercase shapes that look alike (a/o, b/d, m/n…); fall back to the list's own look-alikes.
        const odd = ctx.lowerLookalikes(target)[0] || lookAlike(target, (o) => il(o) && o.text.toLowerCase() !== target.text.toLowerCase());
        signText = target.text.toUpperCase();
        prompt = letterName(target);
        oddSpoken = letterName(odd);
        walkers = [...Array(N - 1)].map(() => ({ text: target.text.toLowerCase(), kind: "letter", odd: false }))
          .concat({ text: odd.text.toLowerCase(), kind: "letter", odd: true });
      }
      // Two signs: the allowed one (green circle ✅) and a WANTED one (red ❌) showing the imposter exactly
      // as it walks. Playtesting showed kids tap whatever matches the one sign they see, so the thing to
      // tap must be on a sign too. The voice says the imposter, to match.
      const oddW = walkers.find((w) => w.odd);
      prompt = oddSpoken;
      walkers = ctx.shuffle(walkers);
      const isWord = walkers[0].kind === "word";

      // ---------- DOM ----------
      const wrap = document.createElement("div");
      wrap.className = "sp";
      const top = document.createElement("div");
      top.className = "sp-top";
      top.setAttribute("role", "button");
      top.setAttribute("aria-label", TEXT.copLabel);
      // Just the policeman and a WANTED poster of the imposter. (A green "allowed" sign was tried and
      // confused players, so it's gone.)
      top.innerHTML = '<div class="sp-cop"><div class="sp-cop-body"></div><div class="sp-cop-face"></div><div class="sp-cop-hat"></div>' +
        '<div class="sp-cop-brim"></div><div class="sp-cop-eye l"></div><div class="sp-cop-eye r"></div><div class="sp-cop-stache"></div>' +
        '<div class="sp-bubble"></div></div>' +
        `<div class="sp-sign bad"><span class="sp-wanted">${TEXT.wanted}</span><span class="sp-st"></span><span class="sp-x">✕</span></div>`;
      const cop = top.querySelector(".sp-cop");
      const bubble = top.querySelector(".sp-bubble");
      const badSign = top.querySelector(".sp-sign.bad");
      const badText = badSign.querySelector(".sp-st");
      badText.textContent = oddW.text;
      if (oddW.kind === "word") {
        badSign.classList.add("word");
        badText.style.fontSize = `min(clamp(2rem, 9vw, 2.6rem), ${(118 / (oddW.text.length * 0.62)).toFixed(1)}px)`;
      }
      top.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });
      const field = document.createElement("div");
      field.className = "sp-field";
      const fx = document.createElement("div");
      fx.className = "sp-fx";
      field.appendChild(fx);
      wrap.append(top, field);
      ctx.root.appendChild(wrap);

      const rows = N >= 11 ? 4 : 3;
      const ws = walkers.map((w, i) => {
        const el = document.createElement("div");
        el.className = "sp-w" + (isWord ? " word" : "");
        el.style.setProperty("--c", WALKER_COLORS[i % WALKER_COLORS.length]);
        el.innerHTML = '<div class="sp-wi"><div class="sp-wbody"><div class="sp-weye l"></div><div class="sp-weye r"></div>' +
          '<div class="sp-brow l"></div><div class="sp-brow r"></div><div class="sp-wtag"></div></div>' +
          '<div class="sp-leg l"></div><div class="sp-leg r"></div></div>';
        const tag = el.querySelector(".sp-wtag");
        tag.textContent = w.text;
        if (w.kind !== "letter") tag.classList.add(w.kind);
        el.querySelector(".sp-leg.l").style.animationDelay = `${(-Math.random() * 0.4).toFixed(2)}s`;
        field.appendChild(el);
        return { el, w, row: i % rows, slot: Math.floor(i / rows), x: 0, y: 0 };
      });

      // ---------- Layout + marching ----------
      // Each lane is a loop a bit wider than the field; walkers are spaced evenly and wrap around.
      let W = 0, H = 0, ww = 0, wh = 0, wwide = 0, loop = 0, laneH = 0;
      const perRow = (r) => ws.filter((x) => x.row === r).length;
      const rowOffset = [...Array(rows)].map(() => Math.random());
      function measure() {
        const r = field.getBoundingClientRect();
        W = r.width; H = r.height;
        laneH = H / rows;
        wh = Math.max(36, Math.min(laneH * 0.72, W * (isWord ? 0.14 : 0.2)));
        ww = wh;
        wwide = isWord ? ww * 1.6 : ww;
        loop = W + wwide * 1.4;
        field.style.setProperty("--ww", `${ww}px`);
        field.style.setProperty("--wh", `${wh}px`);
        field.style.setProperty("--lane", `${laneH}px`);
        if (isWord) {
          const longest = Math.max(...walkers.map((w) => w.text.length));
          const fs = Math.min(wh * 0.38, (wwide * 0.84) / (longest * 0.62));
          ws.forEach((x) => { x.el.querySelector(".sp-wtag").style.fontSize = `${fs}px`; });
        }
      }
      measure();
      const v = reduceMotion ? 0 : ww * (0.55 + 0.4 * (speed - 1)); // px per second
      let t = 0, last = 0, marching = true;
      function place() {
        ws.forEach((x) => {
          if (x.stopped) return;
          const dir = x.row % 2 ? -1 : 1;
          const k = perRow(x.row);
          let p = ((x.slot + rowOffset[x.row]) / k) * loop + dir * v * t;
          p = ((p % loop) + loop) % loop;
          x.x = p - wwide * 0.7 + wwide / 2;          // centre x
          x.y = (x.row + 0.5) * laneH;                // centre y
          x.el.style.transform = `translate(${(x.x - wwide / 2).toFixed(1)}px, ${(x.y - wh * 0.62).toFixed(1)}px)` + (dir < 0 ? "" : "");
        });
      }
      function frame(ts) {
        if (!marching) return;
        const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0;
        last = ts;
        t += dt;
        place();
        ctx.raf(frame);
      }
      place();
      ctx.raf(frame);
      const ro = new ResizeObserver(() => { measure(); place(); });
      ro.observe(field);

      // ---------- Tapping ----------
      let done = false;
      field.addEventListener("pointerdown", (e) => {
        if (done || ctx.ended) return;
        e.preventDefault();
        const r = field.getBoundingClientRect();
        const px = e.clientX - r.left, py = e.clientY - r.top;
        let best = null, bd = Infinity;
        ws.forEach((x) => {
          if (x.x < -wwide / 2 || x.x > W + wwide / 2) return; // off screen
          const d = Math.hypot((px - x.x) / (wwide / ww), py - x.y);
          if (d < bd) { bd = d; best = x; }
        });
        if (best && bd < ww * 0.85) choose(best);
      });

      function say(text) {
        bubble.textContent = text;
        bubble.classList.remove("show");
        void bubble.offsetWidth;
        bubble.classList.add("show");
      }

      function stopAll() {
        marching = false;
        ws.forEach((x) => x.el.classList.add("stop"));
      }

      function choose(x) {
        done = true;
        stopAll();
        if (x.w.odd) {
          ctx.win();
          x.el.classList.add("caught");
          cop.classList.add("happy");
          say(TEXT.gotcha);
          whistle();
          ctx.later(() => { noise(0.15, "lowpass", 900, 300, 0.5); tone(220, 0.1, "square", 0.08); }, 250); // CLANG of the cage
          ctx.confetti(fx, x.x, x.y);
          ctx.say(oddSpoken);
        } else {
          ctx.lose();
          x.el.classList.add("sad");
          sweep(500, 300, 0.4, "sine", 0.15);
          ctx.later(() => villain(), 350);
        }
      }

      function villain() {
        const odd = ws.find((x) => x.w.odd);
        odd.el.classList.add("evil");
        cop.classList.add("sad");
        // "MWA-HA-HA": three falling square-wave laughs.
        [0, 0.18, 0.36].forEach((d, i) => sweep(420 - i * 40, 260 - i * 40, 0.14, "square", 0.08, d));
        // Make sure the whole imposter (and its 😈) is on screen to be seen.
        const m = wwide * 0.7;
        if (odd.x < m || odd.x > W - m) {
          odd.stopped = true;
          odd.x = Math.min(W - m, Math.max(m, odd.x));
          odd.el.style.transform = `translate(${(odd.x - wwide / 2).toFixed(1)}px, ${(odd.y - wh * 0.62).toFixed(1)}px)`;
        }
        const lb = document.createElement("div");
        lb.className = "sp-laugh";
        lb.textContent = TEXT.laugh;
        lb.style.left = `${Math.min(W - 70, Math.max(70, odd.x))}px`;
        lb.style.top = `${Math.max(34, odd.y - wh * 0.7)}px`;
        fx.appendChild(lb);
        ws.forEach((x) => { if (!x.w.odd && !x.el.classList.contains("sad")) x.el.classList.add("dim"); });
        ctx.later(() => ctx.say(oddSpoken), 500);
      }

      const whistle = () => {
        tone(2100, 0.12, "sine", 0.18);
        tone(2400, 0.22, "sine", 0.18, 0.13);
      };

      function replay() { if (!done) ctx.say(prompt); }

      ctx.onTimeout(() => {
        done = true;
        stopAll();
        villain();
      });

      function onKey(e) { if (e.key === " ") { e.preventDefault(); replay(); } }
      document.addEventListener("keydown", onKey);

      ctx.say(prompt);


      // Tutorial: point at the WANTED poster, then tap the imposter once it's well on screen.
      ctx.tutorial(answerItem, async (f) => {
        const imp = ws.find((x) => x.w.odd);
        await f.point(badSign, 1100);
        await f.until(() => imp.x > W * 0.2 && imp.x < W * 0.7, 8000);
        await f.tap(imp.el);
      });

      return function cleanup() {
        done = true;
        marching = false;
        ro.disconnect();
        document.removeEventListener("keydown", onKey);
      };
    },
  });
})();
