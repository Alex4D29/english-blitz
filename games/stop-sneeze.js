// STOP THE SNEEZE — a monster is about to sneeze ("Ah… ah… AH…"). It wears a sign with what it needs,
// and tissues at the bottom carry answers. Drag the right tissue onto its nose (or just tap it) to
// block the sneeze: the tissue covers the nose, a muffled "choo", phew. A wrong tissue, or running out
// of time, and it's ACHOO! all over the screen (green spray, shake), then the right tissue glows.
//
// Letter list: the sign is a capital (A) and the tissues are lowercase (a, e, o), look-alikes first.
// I and l are never together. Phonics: the sign is a letter, the tissues carry pictures, one starts
// with it ("A for apple"). CVC: the sign shows the picture (when there is one) and the word with its
// vowel missing (c _ t), the voice says "cat", and the tissues carry vowels. HFW: the sign is 🔊, the
// voice says the word, the tissues carry words.
// The sneeze builds on the real time limit (stages at 35%, 60%, 82%), so it lands when time runs out.
// Faster speeds: 4 tissues from 1.5×.
(function () {
  const TEXT = {
    name: { en: "Stop the Sneeze" },
    icon: "🤧",
    howTo: (list) => {
      const what = {
        letter: ["🔠", "The monster has a big letter, like \"A\". It needs the small letter: a!"],
        phonics: ["🔤", "The monster has a letter, like \"A\". It needs a picture that starts with it: apple!"],
        cvc: ["📝", "The monster's word is missing a letter, like \"c _ t\". Listen: \"cat\". Which letter is missing?"],
        hfw: ["👂", "Listen to the word the monster needs, like \"the\"."],
      }[list.type] || ["👀", "Look at the monster's sign."];
      return { en: {
        steps: [
          ["🤧", "Oh no! The monster is going to sneeze!"],
          what,
          ["🧻", "Drag the right tissue to its nose (or tap it) to stop the sneeze!"],
        ],
        tips: [
          "Tap the monster to hear it again.",
          "You get one try. A wrong tissue (or too slow) and… ACHOO!",
          "When the game speeds up, there are more tissues.",
        ],
      } };
    },
    instruction: { en: "STOP THE\nSNEEZE!" },
    listen: "🔊",
    ah: ["Ah…", "Ah… ah…", "AH… AH…"],
    achoo: "ACHOO!",
    phew: "😌",
    answer: (letter, word) => `${letter} for ${word}`,
    monsterLabel: "Hear it again",
    tissueLabel: (s) => `Tissue ${s}`,
  };

  const MONSTER_COLORS = ["#ff8a00", "#8a2be2", "#00b86b", "#1e6bff", "#ff2e88"];
  const TISSUE_INK = ["#e8173c", "#1e6bff", "#00a35a", "#8a2be2"];
  const SNOT = "#9be22d";
  const VOWELS = ["a", "e", "i", "o", "u"];

  const CSS = `
  .sn { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; overflow:hidden; }
  .sn.shake { animation:sn-shake .4s linear; }
  .sn-stage { position:relative; flex:1; min-height:0; width:100%; display:flex; align-items:center; justify-content:center; container-type:size; }
  .sn-mon { --S:min(72vw, 40vh); position:relative; width:var(--S); height:calc(var(--S) * 1.05); font-size:var(--S); cursor:pointer;
    touch-action:manipulation; transform-origin:50% 90%; transition:transform .5s ease-out; }
  @supports (width:1cqw) { .sn-mon { --S:min(78cqw, 76cqh); } }
  .sn-head { position:absolute; left:.07em; top:.04em; width:.86em; height:.86em; border-radius:50% 50% 46% 46%; background:var(--mc);
    border:.028em solid #111; box-shadow:inset -.06em -.05em 0 rgba(0,0,0,.18), 0 .03em 0 #111; }
  .sn-ear { position:absolute; top:.02em; width:.2em; height:.24em; background:var(--mc); border:.028em solid #111; border-radius:50% 50% 30% 30%; }
  .sn-ear.l { left:.1em; transform:rotate(-24deg); } .sn-ear.r { right:.1em; transform:rotate(24deg); }
  .sn-eye { position:absolute; top:.22em; width:.17em; height:.17em; border-radius:50%; background:#fff; border:.02em solid #111; overflow:hidden; transition:height .2s, top .2s; }
  .sn-eye::after { content:""; position:absolute; left:30%; top:30%; width:44%; height:44%; border-radius:50%; background:#111; }
  .sn-eye.l { left:.24em; } .sn-eye.r { right:.24em; }
  .sn-nose { position:absolute; left:50%; top:.33em; width:.3em; height:.25em; margin-left:-.15em; border-radius:50% 50% 46% 46%; background:#ff5c6c;
    border:.022em solid #111; box-shadow:inset -.04em -.03em 0 rgba(0,0,0,.2); z-index:2; }
  .sn-nose::before { content:""; position:absolute; left:20%; top:16%; width:26%; height:22%; border-radius:50%; background:rgba(255,255,255,.7); }
  .sn-nose::after { content:""; position:absolute; left:24%; right:24%; bottom:14%; height:16%;   /* nostrils */
    background:radial-gradient(circle at 20% 50%, #7a1020 0 28%, transparent 30%), radial-gradient(circle at 80% 50%, #7a1020 0 28%, transparent 30%); }
  .sn-snot { position:absolute; left:.44em; top:.53em; width:.14em; height:.14em; border-radius:50%; z-index:3; transform-origin:25% 0; transform:scale(0);
    background:radial-gradient(circle at 34% 34%, rgba(255,255,255,.95) 0 14%, rgba(196,245,92,.78) 16%); border:.012em solid #4c7a00; pointer-events:none; }
  .sn-mouth { position:absolute; left:50%; top:.64em; width:.2em; height:.07em; margin-left:-.1em; background:#3a0010; border:.018em solid #111;
    border-radius:0 0 .1em .1em; transition:all .25s; }
  .sn-sign { position:absolute; left:50%; bottom:0; min-width:.5em; height:.3em; transform:translateX(-50%) rotate(-3deg); padding:0 .05em;
    background:#fff; border:.025em solid #111; border-radius:.05em; box-shadow:0 .025em 0 #111; display:flex; align-items:center; justify-content:center;
    gap:.03em; color:#111; font-size:1em; line-height:1; white-space:nowrap; z-index:3; }
  .sn-sign .big { font-size:.24em; }
  .sn-sign .pic { font-size:.17em; }
  .sn-sign .word { font-size:.14em; letter-spacing:.04em; }
  .sn-sign .blank { display:inline-block; min-width:.7em; border-bottom:.12em solid #111; color:#00a35a; text-align:center; }
  .sn-bubble { position:absolute; left:-.06em; top:-.1em; padding:.25em .5em; background:#fff; border:4px solid #111; border-radius:.6em;
    box-shadow:0 4px 0 #111; font-size:.075em; line-height:1.1; white-space:nowrap; color:#111; transform:rotate(-6deg); display:none; z-index:4; }
  .sn-bubble.show { display:block; animation:sn-pop .25s cubic-bezier(.2,1.8,.4,1); }
  .sn-bubble.big { font-size:.17em; padding:.1em .3em; left:50%; top:-.14em; transform:translateX(-50%) rotate(-6deg); color:${SNOT}; -webkit-text-stroke:2px #111; paint-order:stroke fill; }

  .sn-mon.ah1 .sn-nose { animation:sn-twitch .5s ease-in-out infinite; }
  .sn-mon.ah2 { transform:rotate(-5deg); }
  .sn-mon.ah2 .sn-nose { animation:sn-twitch .3s ease-in-out infinite; }
  .sn-mon.ah2 .sn-eye { height:.1em; top:.25em; }
  .sn-mon.ah2 .sn-mouth { height:.11em; border-radius:50%; }
  .sn-mon.ah3 { transform:rotate(-10deg) translateY(-2%); }
  .sn-mon.ah3 .sn-nose { animation:sn-twitch .16s ease-in-out infinite; }
  .sn-mon.ah3 .sn-eye { height:.04em; top:.28em; }
  .sn-mon.ah3 .sn-mouth { height:.15em; width:.16em; margin-left:-.08em; border-radius:50%; }
  .sn-mon.achoo { transform:rotate(8deg) scale(1.08); transition:transform .12s ease-in; }
  .sn-mon.achoo .sn-eye { height:.03em; top:.28em; }
  .sn-mon.achoo .sn-mouth { height:.18em; width:.26em; margin-left:-.13em; border-radius:40% 40% 50% 50%; }
  .sn-mon.covered { transform:scale(.96, 1.04); transition:transform .15s; }
  .sn-mon.happy { transform:none; }
  .sn-mon.happy .sn-eye { height:.06em; top:.27em; border-radius:.1em .1em 0 0; }
  .sn-mon.happy .sn-eye::after { display:none; }
  .sn-mon.happy .sn-mouth { height:.06em; border-radius:0 0 .12em .12em; }

  .sn-tray { flex:none; position:relative; z-index:5; display:flex; gap:12px; justify-content:center; width:100%; padding:6px 12px 14px; }
  .sn-tissue { --t:min(calc((100vw - 60px) / var(--n)), 112px); position:relative; width:var(--t); height:calc(var(--t) * .95); padding:0; margin:0;
    border:0; background:none; font:inherit; color:var(--ink); cursor:grab; touch-action:none; will-change:transform; z-index:1; }
  .sn-tray.wide { gap:8px; padding-left:8px; padding-right:8px; }
  .sn-tissue.wide { --t:min(calc((100vw - 16px - (var(--n) - 1) * 8px) / var(--n)), 160px); height:calc(var(--t) * .78); }
  .sn-tissue.wide .sn-paper::before { width:26%; margin-left:-13%; }
  .sn-tissue.wide .sn-ttxt { inset:20% 6% 6% 6%; }
  .sn-tissue.drag { z-index:10; cursor:grabbing; }
  .sn-tissue.fly { transition:transform .28s cubic-bezier(.3,.7,.4,1); z-index:10; }
  .sn-tissue.back { transition:transform .25s cubic-bezier(.2,1.4,.4,1); }
  .sn-paper { position:absolute; inset:12% 0 0 0; background:#fff; border:5px solid #111; border-radius:10px 10px 14px 14px;
    box-shadow:0 6px 0 #111, inset 0 -8px 0 #e3f1ff; }
  .sn-paper::before { content:""; position:absolute; left:50%; top:-24%; width:36%; height:36%; margin-left:-18%; background:#fff;
    border:5px solid #111; border-bottom:0; border-radius:50% 50% 0 0 / 80% 80% 0 0; }
  .sn-ttxt { position:absolute; inset:16% 4% 4% 4%; display:flex; align-items:center; justify-content:center; font-size:calc(var(--t) * .52);
    line-height:1; white-space:nowrap; }
  .sn-ttxt.pic { font-size:calc(var(--t) * .46); }
  .sn-tissue.right .sn-paper { background:#d6ffe2; box-shadow:0 0 0 6px #00b86b, 0 6px 0 #111; }
  .sn-tissue.right { animation:sn-wiggle .4s ease-in-out 3; }
  .sn-tissue.dim { opacity:.4; }
  .sn-tissue.blown { transition:transform .6s ease-in, opacity .6s; opacity:0; }

  .sn-fx { position:absolute; inset:0; pointer-events:none; z-index:20; overflow:hidden; }
  .sn-drop { position:absolute; border-radius:50% 50% 50% 50% / 60% 60% 40% 40%; background:${SNOT}; border:4px solid #111; }
  .sn-puff { position:absolute; font-size:1.8rem; transform:translate(-50%, -50%); animation:sn-puff .6s ease-out forwards; }

  @keyframes sn-shake { 10%, 50%, 90% { transform:translate(-6px, 3px); } 30%, 70% { transform:translate(6px, -3px); } }
  @keyframes sn-twitch { 50% { transform:scale(1.15, .9) translateY(4%); } }
  @keyframes sn-pop { from { transform:scale(.3); } }
  @keyframes sn-wiggle { 25% { transform:rotate(-7deg) scale(1.06); } 75% { transform:rotate(7deg) scale(1.06); } }
  @keyframes sn-puff { to { transform:translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(1.4); opacity:0; } }
  @media (prefers-reduced-motion: reduce) {
    .sn.shake, .sn-mon .sn-nose, .sn-tissue.right, .sn-bubble.show, .sn-puff { animation:none !important; }
  }`;

  function injectCss() {
    if (document.getElementById("sn-css")) return;
    const style = document.createElement("style");
    style.id = "sn-css";
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  registerMicrogame({
    id: "stop-sneeze",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 8000,
    input: "drag",
    tutorial: true, // has a ctx.tutorial script

    start(ctx) {
      injectCss();
      const type = ctx.list.type;
      const speed = ctx.speed || 1;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const n = speed >= 1.5 ? 4 : 3;
      const letterName = (it) => it.say || it.text.toUpperCase();
      const { sweep, noise, tone } = ctx.sfx;

      // ---------- Content ----------
      // sign: HTML for the monster's sign. tissues: [{ text, kind, right }]. fill: the CVC blank's letter.
      const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
      let sign, prompt, answer, tissues, fill = null, answerItem = null; // answerItem: the list item the round is about (tutorial)
      if (type === "phonics") {
        const letter = ctx.items.find((it) => ctx.phonics.pics(it).length) || ctx.items[0];
        answerItem = letter;
        const set = ctx.phonics.set(letter, 1, n - 1);
        const right = set.right[0];
        sign = `<span class="big">${esc(letter.text.toUpperCase())}</span>`;
        prompt = letterName(letter);
        answer = TEXT.answer(letterName(letter), right.word);
        tissues = [right, ...set.wrong].map((p) => ({ text: p.emoji, kind: "pic", right: p === right }));
      } else if (type === "cvc") {
        const pool = ctx.items.filter((it) => /[aeiou]/.test(it.text));
        const target = pool.find((it) => it.emoji) || pool[0] || ctx.items[0];
        answerItem = target;
        const vi = target.text.search(/[aeiou]/);
        fill = target.text[vi];
        const before = esc(target.text.slice(0, vi)), after = esc(target.text.slice(vi + 1));
        sign = (target.emoji ? `<span class="pic">${esc(target.emoji)}</span>` : "") +
          `<span class="word">${before}<span class="blank">&nbsp;</span>${after}</span>`;
        prompt = answer = target.say || target.text;
        const others = ctx.shuffle(VOWELS.filter((v) => v !== fill)).slice(0, n - 1);
        tissues = [fill, ...others].map((v) => ({ text: v, kind: "letter", right: v === fill }));
      } else if (type === "hfw") {
        const target = ctx.items[0];
        answerItem = target;
        sign = `<span class="big">${esc(ctx.canSpeak ? TEXT.listen : target.text)}</span>`;
        if (!ctx.canSpeak) sign = `<span class="word">${esc(target.text)}</span>`;
        prompt = answer = target.say || target.text;
        const others = ctx.pickOptions(target, n + 1).filter((o) => o !== target).slice(0, n - 1);
        tissues = [target, ...others].map((o) => ({ text: o.text, kind: "word", right: o === target }));
      } else {
        const target = ctx.items[0];
        answerItem = target;
        const il = (a, b) => [a, b].map((x) => x.text.toUpperCase()).sort().join("") === "IL";
        const others = ctx.pickOptions(target, n + 2).filter((o) => o !== target && !il(o, target)).slice(0, n - 1);
        sign = `<span class="big">${esc(target.text.toUpperCase())}</span>`;
        prompt = answer = letterName(target);
        tissues = [target, ...others].map((o) => ({ text: o.text.toLowerCase(), kind: "letter", right: o === target }));
      }
      tissues = ctx.shuffle(tissues);

      // ---------- DOM ----------
      const wrap = document.createElement("div");
      wrap.className = "sn";
      const stage = document.createElement("div");
      stage.className = "sn-stage";
      const mon = document.createElement("div");
      mon.className = "sn-mon";
      mon.setAttribute("role", "button");
      mon.setAttribute("tabindex", "0");
      mon.setAttribute("aria-label", TEXT.monsterLabel);
      mon.style.setProperty("--mc", ctx.pick(MONSTER_COLORS));
      mon.innerHTML = '<div class="sn-ear l"></div><div class="sn-ear r"></div><div class="sn-head">' +
        '<div class="sn-eye l"></div><div class="sn-eye r"></div><div class="sn-nose"></div><div class="sn-snot"></div><div class="sn-mouth"></div></div>' +
        `<div class="sn-sign">${sign}</div><div class="sn-bubble"></div>`;
      const nose = mon.querySelector(".sn-nose");
      const bubble = mon.querySelector(".sn-bubble");
      const blank = mon.querySelector(".sn-sign .blank");
      mon.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });
      mon.addEventListener("keydown", (e) => { if (e.key === "Enter") replay(); });
      stage.appendChild(mon);
      const tray = document.createElement("div");
      tray.className = "sn-tray";
      tray.style.setProperty("--n", n);
      const fx = document.createElement("div");
      fx.className = "sn-fx";
      wrap.append(stage, tray, fx);
      ctx.root.appendChild(wrap);

      const tEls = tissues.map((t, i) => {
        const b = document.createElement("button");
        b.className = "sn-tissue";
        b.style.setProperty("--ink", t.kind === "word" ? "#111" : TISSUE_INK[i % TISSUE_INK.length]);
        b.setAttribute("aria-label", TEXT.tissueLabel(t.text));
        b.innerHTML = '<div class="sn-paper"></div><div class="sn-ttxt"></div>';
        const txt = b.querySelector(".sn-ttxt");
        txt.textContent = t.text;
        if (t.kind === "pic") txt.classList.add("pic");
        b.snT = t;
        tray.appendChild(b);
        return b;
      });
      // Sight words: wider tissues, and one font size for all of them, shrunk until the longest word fits.
      const wordy = tissues.some((t) => t.kind === "word");
      if (wordy) { tray.classList.add("wide"); tEls.forEach((b) => b.classList.add("wide")); }
      function fitWords() {
        if (!wordy) return;
        const txts = tEls.map((b) => b.querySelector(".sn-ttxt"));
        const tw = tEls[0].clientWidth;
        if (!tw) return;
        let size = tw * 0.36;
        const over = () => txts.some((x) => x.scrollWidth > x.clientWidth + 1);
        txts.forEach((x) => { x.style.fontSize = `${size}px`; });
        for (let i = 0; i < 30 && over() && size > 10; i++) {
          size *= 0.92;
          txts.forEach((x) => { x.style.fontSize = `${size}px`; });
        }
      }
      fitWords();
      const ro = new ResizeObserver(fitWords);
      ro.observe(tray);

      // ---------- The sneeze builds ----------
      let done = false;
      const T = ctx.timeLimit;
      [[0.35, 1], [0.6, 2], [0.82, 3]].forEach(([at, k]) => ctx.later(() => {
        if (done) return;
        mon.classList.remove("ah1", "ah2", "ah3");
        mon.classList.add("ah" + k);
        say(TEXT.ah[k - 1]);
        noise(0.35 + k * 0.1, "bandpass", 600, 1600 + k * 500, 0.12 + k * 0.06); // breathing in
      }, T * at));
      // From the first moment: a snot bubble swells out of the nose and gets sucked back in (twice, the
      // second bigger), then from 25% the monster reels back and forth, further and faster, until the end.
      const snot = mon.querySelector(".sn-snot");
      let building = !reduceMotion, bt0 = 0, blast = 0, ph = 0, nextBubble = 0;
      function buildFrame(now) {
        if (!building) return;
        if (!bt0) bt0 = blast = now;
        const dt = Math.min(0.05, (now - blast) / 1000);
        blast = now;
        const p = Math.min(1, (now - bt0) / T);
        // Snot bubble: two out-and-back-in blows over the first 30%.
        if (p < 0.3) {
          const k = p / 0.3, cyc = k * 2, s = Math.max(0, Math.sin((cyc % 1) * Math.PI));
          const size = cyc < 1 ? 0.8 : 1.25;
          snot.style.transform = `scale(${(s * size).toFixed(3)})`;
          if (Math.floor(cyc) >= nextBubble) { nextBubble++; sweep(180, 420, T * 0.15 / 1000, "sine", 0.08); } // a wet inflate
        } else snot.style.transform = "scale(0)";
        // Reeling: q goes 0 → 1 from 25% to the end.
        const q = Math.max(0, Math.min(1, (p - 0.25) / 0.75));
        ph += dt * (0.5 + 3.5 * q) * Math.PI * 2;
        const tilt = -(Math.pow(q, 1.3) * 9) + Math.sin(ph) * (q > 0 ? 1 + 5 * q : 0);
        const breathe = 1 + 0.035 * q * Math.max(0, Math.sin(ph * 0.5));
        mon.style.transform = `rotate(${tilt.toFixed(2)}deg) translateY(${(-2 * q).toFixed(2)}%) scale(${(2 - breathe).toFixed(3)}, ${breathe.toFixed(3)})`;
        ctx.raf(buildFrame);
      }
      function stopBuild() {
        building = false;
        mon.style.transition = "";
        mon.style.transform = "";
        snot.style.transform = "scale(0)";
      }
      if (building) { mon.style.transition = "none"; ctx.raf(buildFrame); }

      function say(text, big) {
        bubble.textContent = text;
        bubble.classList.toggle("big", !!big);
        bubble.classList.remove("show");
        void bubble.offsetWidth;
        bubble.classList.add("show");
      }

      // ---------- Dragging (or tapping) a tissue ----------
      let drag = null;
      tEls.forEach((b) => {
        b.addEventListener("pointerdown", (e) => {
          if (done || ctx.ended || drag) return;
          e.preventDefault();
          try { b.setPointerCapture(e.pointerId); } catch (err) { /* capture is a nicety */ }
          drag = { b, id: e.pointerId, x0: e.clientX, y0: e.clientY, t0: performance.now(), moved: false };
          b.classList.remove("back");
          b.classList.add("drag");
        });
        b.addEventListener("pointermove", (e) => {
          if (!drag || drag.b !== b || e.pointerId !== drag.id) return;
          const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
          if (Math.hypot(dx, dy) > 10) drag.moved = true;
          b.style.transform = `translate(${dx}px, ${dy}px) scale(1.08)`;
        });
        const up = (e) => {
          if (!drag || drag.b !== b || e.pointerId !== drag.id) return;
          const d = drag;
          drag = null;
          b.classList.remove("drag");
          if (done || ctx.ended) return;
          if (!d.moved) { give(b); return; } // a tap sends it to the nose
          const r = mon.querySelector(".sn-head").getBoundingClientRect();
          const pad = 24;
          const onFace = e.clientX > r.left - pad && e.clientX < r.right + pad && e.clientY > r.top - pad && e.clientY < r.bottom + pad;
          if (onFace) give(b);
          else { b.classList.add("back"); b.style.transform = ""; }
        };
        b.addEventListener("pointerup", up);
        b.addEventListener("pointercancel", (e) => { if (drag && drag.b === b) { drag = null; b.classList.remove("drag"); b.classList.add("back"); b.style.transform = ""; } });
        b.addEventListener("click", (e) => { if (e.detail === 0) give(b); }); // keyboard
      });

      // The tissue flies onto the nose, then we see whether it was the right one.
      function give(b) {
        if (done || ctx.ended) return;
        done = true;
        building = false; // freeze mid-sway so the tissue lands where the nose is
        tEls.forEach((x) => { x.disabled = true; });
        const br = b.getBoundingClientRect(), nr = nose.getBoundingClientRect();
        const cur = new DOMMatrixReadOnly(getComputedStyle(b).transform === "none" ? undefined : getComputedStyle(b).transform);
        const dx = nr.left + nr.width / 2 - (br.left + br.width / 2) + cur.m41;
        const dy = nr.top + nr.height / 2 - (br.top + br.height / 2) + cur.m42 + br.height * 0.15;
        b.classList.remove("back");
        b.classList.add("fly");
        b.style.transform = `translate(${dx}px, ${dy}px) scale(.9)`;
        if (b.snT.right) ctx.later(() => block(b), 280);
        else ctx.later(() => achoo(b), 280);
      }

      function block(b) {
        ctx.win();
        mon.classList.remove("ah1", "ah2", "ah3");
        mon.classList.add("covered");
        if (blank) blank.textContent = fill;
        noise(0.18, "lowpass", 500, 200, 0.4); // a muffled "choo"
        sweep(260, 140, 0.15, "sine", 0.2);
        say("choo…");
        const at = center(nose);
        if (!reduceMotion) {
          [[-1, -0.3], [1, -0.3], [-1, 0.4], [1, 0.4]].forEach(([sx, sy]) => {
            const p = document.createElement("div");
            p.className = "sn-puff";
            p.textContent = "💨";
            p.style.cssText = `left:${at.x + sx * 40}px;top:${at.y + sy * 20}px;--dx:${sx * 40}px;--dy:${sy * 20}px;` + (sx < 0 ? "transform:translate(-50%,-50%) scaleX(-1);" : "");
            fx.appendChild(p);
          });
        }
        ctx.later(() => {
          stopBuild();
          mon.classList.remove("covered");
          mon.classList.add("happy");
          say(TEXT.phew);
          ctx.confetti(fx, at.x, at.y - 30);
          tone(1046, 0.08, "triangle", 0.12);
          tone(1318, 0.12, "triangle", 0.12, 0.09);
        }, 320);
        ctx.say(answer);
      }

      // ACHOO: the wrong tissue (if any) is blown away and green spray covers the screen.
      function achoo(wrong) {
        if (wrong) ctx.lose();
        done = true;
        stopBuild();
        tEls.forEach((x) => { x.disabled = true; });
        mon.classList.remove("ah1", "ah2", "ah3");
        mon.classList.add("ah3");
        ctx.later(() => {
          mon.classList.remove("ah3");
          mon.classList.add("achoo");
          say(TEXT.achoo, true);
          noise(0.6, "lowpass", 3000, 300, 0.9);
          sweep(700, 120, 0.5, "sawtooth", 0.18);
          if (!reduceMotion) { wrap.classList.remove("shake"); void wrap.offsetWidth; wrap.classList.add("shake"); }
          if (wrong) {
            const m = new DOMMatrixReadOnly(getComputedStyle(wrong).transform);
            wrong.classList.remove("fly");
            wrong.classList.add("blown");
            wrong.style.transform = `translate(${m.m41 + 120}px, ${m.m42 + 260}px) rotate(200deg)`;
          }
          spray();
        }, wrong ? 120 : 0);
        ctx.later(() => {
          tEls.forEach((x) => { if (x.snT.right) x.classList.add("right"); else if (x !== wrong) x.classList.add("dim"); });
          ctx.say(answer);
        }, 700);
      }

      function spray() {
        const at = center(nose);
        const W = fx.clientWidth, H = fx.clientHeight;
        const count = reduceMotion ? 10 : 22;
        for (let i = 0; i < count; i++) {
          const d = document.createElement("div");
          d.className = "sn-drop";
          const s = 18 + Math.random() * 46;
          d.style.cssText = `width:${s}px;height:${s * 1.1}px;left:${at.x - s / 2}px;top:${at.y - s / 2}px;`;
          fx.appendChild(d);
          const tx = Math.random() * W - at.x, ty = (Math.random() * 1.1 - 0.05) * H - at.y;
          if (reduceMotion) { d.style.transform = `translate(${tx}px, ${ty}px)`; continue; }
          d.animate([{ transform: "translate(0,0) scale(.3)" }, { transform: `translate(${tx}px, ${ty}px) scale(1.25, 1)` }],
            { duration: 260 + Math.random() * 220, easing: "cubic-bezier(.2,.7,.4,1)", fill: "forwards" });
        }
      }

      function center(el) {
        const r = el.getBoundingClientRect(), f = fx.getBoundingClientRect();
        return { x: r.left + r.width / 2 - f.left, y: r.top + r.height / 2 - f.top };
      }

      function replay() { if (!done) ctx.say(prompt); }

      ctx.onTimeout(() => { if (!done) achoo(null); });

      // A small finger-only hint: from between the tissues up to the nose.
      ctx.later(() => {
        const g = ctx.root.getBoundingClientRect(), t = tray.getBoundingClientRect();
        ctx.hint({ x: t.left + t.width / 2 - g.left, y: t.top - 26 - g.top }, nose, { noWord: true, scale: 0.6, center: true });
      }, 80);

      function onKey(e) {
        const i = parseInt(e.key, 10) - 1;
        if (i >= 0 && i < tEls.length) { e.preventDefault(); give(tEls[i]); }
        else if (e.key === " ") { e.preventDefault(); replay(); }
      }
      document.addEventListener("keydown", onKey);

      ctx.say(prompt);


      // Tutorial: point at the monster's sign, then drag the right tissue onto its nose.
      ctx.tutorial(answerItem, async (f) => {
        await f.point(mon.querySelector(".sn-sign") || mon, 1000);
        await f.drag(tEls.find((x) => x.snT.right), nose, 1000);
      });

      return function cleanup() {
        done = true;
        ro.disconnect();
        document.removeEventListener("keydown", onKey);
      };
    },
  });
})();
