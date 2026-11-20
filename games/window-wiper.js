// WINDOW WIPER — a bucket-of-water monster with a cloth shows a card (the target) and the voice says
// it. Below is a big, filthy window of panes, each with a little character hiding behind the grime.
// Drag back and forth to scrub: each pass only takes some of the dirt off (the amount depends on how
// far the finger travels, so a pane takes about 1–2 s of quick wiping). When a pane is mostly clean
// its character is seen: the right one makes the whole window sparkle clean (win); a wrong one says
// "Not me!" and runs off (no penalty, just time).
//
// Letter list: panes hold letters. Phonics: the card is a letter, the panes hold pictures, one
// starts with it. CVC: the card is a word, the panes hold pictures. HFW: the card is 🔊, the panes
// hold words. Faster speeds: 4 panes (2×2), 6 (2×3) from 1.5×.
(function () {
  const TEXT = {
    name: { en: "Window Wiper" },
    icon: "🪟",
    howTo: (list) => {
      const what = {
        letter: ["🔤", "Look at the card, like \"B\". Find the B behind the dirty window."],
        phonics: ["🔤", "Look at the letter on the card, like \"B\". Find a picture that starts with it: ball, bee…"],
        cvc: ["📝", "Look at the word on the card, like \"cat\". Find its picture!"],
        hfw: ["👂", "Listen to the word, like \"the\". Find it behind the window."],
      }[list.type] || ["👀", "Look at the card."];
      return { en: {
        steps: [
          what,
          ["🧽", "The window is so dirty! Rub it fast, back and forth, to clean it."],
          ["✨", "Found the right one? The whole window sparkles clean!"],
        ],
        tips: [
          "Tap the card to hear it again.",
          "A wrong one says \"Not me!\" and runs away. Keep wiping!",
          "When the game speeds up, there are more windows to clean.",
        ],
      } };
    },
    instruction: { en: "WIPE THE\nWINDOW!" },
    listen: "🔊",
    notMe: "Not me!",
    answer: (letter, word) => `${letter} for ${word}`,
    cardLabel: "Hear it again",
  };

  const RIMS = ["#ff2e88", "#1e6bff", "#ff8a00", "#00b86b", "#8a2be2", "#e8173c"];

  const CSS = `
  .wp { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; gap:8px; padding:0 10px 10px; }
  .wp-top { flex:none; display:flex; align-items:flex-end; justify-content:center; gap:14px; }
  .wp-bucket { width:clamp(76px, 22vw, 100px); height:clamp(84px, 24vw, 110px); overflow:visible; }
  .wp-bucket .cloth { transform-origin:84px 46px; animation:wp-scrub .5s ease-in-out infinite alternate; }
  .wp-bucket.happy { animation:wp-hop .4s cubic-bezier(.2,1.6,.4,1) 2; }
  .wp-card { position:relative; min-width:84px; height:76px; padding:0 18px; border-radius:18px; font:inherit; font-size:2.7rem; line-height:1;
    background:#fff; color:#111; border:5px solid #111; box-shadow:0 6px 0 #111; display:flex; align-items:center; justify-content:center; gap:8px;
    margin-bottom:8px; cursor:pointer; touch-action:manipulation; animation:wp-in .3s cubic-bezier(.2,1.8,.4,1) both; }
  .wp-card .spk { font-size:1.3rem; opacity:.6; }
  .wp-card:active { transform:translateY(4px); box-shadow:0 2px 0 #111; }

  .wp-frame { position:relative; flex:1; min-height:0; width:100%; max-width:520px; background:#c98a4b; border:6px solid #111; border-radius:14px;
    box-shadow:0 8px 0 #111, inset 0 0 0 6px #e0a866; padding:14px; }
  .wp-frame::after { content:""; position:absolute; left:-12px; right:-12px; bottom:-18px; height:16px; background:#c98a4b; border:5px solid #111; border-radius:6px; }
  .wp-glass { position:relative; width:100%; height:100%; border:5px solid #111; border-radius:4px; overflow:hidden; touch-action:none; cursor:grab;
    background:linear-gradient(160deg, #bfe9ff 0%, #8fd3ff 60%, #b6f0c8 100%); }
  .wp-items, .wp-mull, .wp-fx { position:absolute; inset:0; pointer-events:none; }
  .wp-dirt { position:absolute; left:0; top:0; width:100%; height:100%; transition:opacity .45s ease-out; }
  .wp-dirt.gone { opacity:0; }
  .wp-mull { z-index:3; }
  .wp-mull i { position:absolute; background:#c98a4b; border:4px solid #111; }
  .wp-fx { z-index:4; overflow:visible; }

  .wp-it { position:absolute; left:0; top:0; width:var(--is); height:var(--is); transform:translate(-50%, -50%); }
  .wp-it.word { width:calc(var(--is) * 1.5); height:calc(var(--is) * .8); }
  .wp-body { position:absolute; inset:0; background:#fff; border:5px solid #111; border-radius:50%; box-shadow:inset 0 0 0 6px var(--rim), 0 5px 0 rgba(0,0,0,.25); }
  .wp-it.word .wp-body { border-radius:999px; }
  .wp-eye { position:absolute; top:-8%; width:22%; aspect-ratio:1; background:#fff; border:4px solid #111; border-radius:50%; z-index:2; }
  .wp-eye::after { content:""; position:absolute; left:28%; top:30%; width:44%; height:44%; background:#111; border-radius:50%; }
  .wp-eye.l { left:22%; } .wp-eye.r { right:22%; }
  .wp-it.word .wp-eye { width:15%; top:-14%; }
  .wp-tag { position:absolute; inset:14%; display:flex; align-items:center; justify-content:center; color:#111; font-size:calc(var(--is) * .52);
    line-height:1; white-space:nowrap; }
  .wp-tag.pic { font-size:calc(var(--is) * .46); }
  .wp-leg { position:absolute; bottom:-14%; width:12%; height:20%; background:#111; border-radius:99px; opacity:0; transform-origin:50% 0; }
  .wp-leg.l { left:32%; } .wp-leg.r { right:32%; }
  .wp-it.run .wp-leg { opacity:1; animation:wp-step .12s ease-in-out infinite alternate; }
  .wp-it.run .wp-leg.r { animation-delay:-.12s; }
  .wp-it.run { transition:left .7s ease-in, top .7s ease-in; }
  .wp-it.yay { animation:wp-yay .45s cubic-bezier(.2,1.6,.4,1) 2; }
  .wp-it.answer .wp-body { box-shadow:0 0 0 6px #fff, 0 0 0 11px #00b86b; }
  .wp-it.answer { animation:wp-wiggle .4s ease-in-out infinite; }
  .wp-it.dim { opacity:.4; }

  .wp-say { position:absolute; transform:translate(-50%, -100%) rotate(-5deg); padding:4px 12px; background:#fff; border:4px solid #111; border-radius:99px;
    box-shadow:0 4px 0 #111; font-size:1.2rem; white-space:nowrap; color:#111; animation:wp-pop .25s cubic-bezier(.2,1.8,.4,1); z-index:5; }
  .wp-cloth { position:absolute; width:58px; height:44px; margin:-22px 0 0 -29px; background:#ffd60a; border:4px solid #111; border-radius:12px;
    box-shadow:inset 0 -6px 0 #f0a800; transform:rotate(-10deg); opacity:0; transition:opacity .15s; z-index:6; }
  .wp-cloth::before { content:""; position:absolute; inset:6px 8px; border-top:3px dashed rgba(0,0,0,.25); border-bottom:3px dashed rgba(0,0,0,.25); }
  .wp-cloth.on { opacity:1; }
  .wp-spark { position:absolute; font-size:1.8rem; transform:translate(-50%, -50%); animation:wp-spark .8s ease-out forwards; }

  @keyframes wp-in { from { transform:scale(.6); opacity:0; } }
  @keyframes wp-scrub { from { transform:rotate(-12deg); } to { transform:rotate(12deg); } }
  @keyframes wp-hop { 50% { transform:translateY(-14%); } }
  @keyframes wp-step { from { transform:rotate(-30deg); } to { transform:rotate(30deg); } }
  @keyframes wp-yay { 50% { transform:translate(-50%, -64%) scale(1.1); } }
  @keyframes wp-wiggle { 25% { transform:translate(-50%, -50%) rotate(-7deg); } 75% { transform:translate(-50%, -50%) rotate(7deg); } }
  @keyframes wp-pop { from { transform:translate(-50%, -100%) scale(.3); } }
  @keyframes wp-spark { 0% { transform:translate(-50%, -50%) scale(.2); opacity:0; } 30% { opacity:1; } 100% { transform:translate(-50%, -80%) scale(1.3); opacity:0; } }
  @media (prefers-reduced-motion: reduce) {
    .wp-bucket .cloth, .wp-bucket.happy, .wp-card, .wp-it.yay, .wp-it.answer, .wp-it.run .wp-leg, .wp-say, .wp-spark { animation:none !important; }
  }`;

  // The cleaner: a metal pail full of water with a face, holding a yellow cloth.
  const BUCKET = '<svg class="wp-bucket" viewBox="0 0 110 110" aria-hidden="true">' +
    '<path d="M18 34 Q50 -6 82 34" fill="none" stroke="#111" stroke-width="5"/>' +
    '<path d="M14 36 L86 36 L76 104 L24 104 Z" fill="#9fb3c8" stroke="#111" stroke-width="5" stroke-linejoin="round"/>' +
    '<path d="M20 52 L80 52 M22 88 L78 88" stroke="#7d91a6" stroke-width="5"/>' +
    '<ellipse cx="50" cy="36" rx="36" ry="9" fill="#3fa9ff" stroke="#111" stroke-width="5"/>' +
    '<ellipse cx="38" cy="33" rx="8" ry="2.5" fill="#bfe6ff"/>' +
    '<circle cx="38" cy="66" r="8" fill="#fff" stroke="#111" stroke-width="4"/><circle cx="40" cy="67" r="3.5" fill="#111"/>' +
    '<circle cx="62" cy="66" r="8" fill="#fff" stroke="#111" stroke-width="4"/><circle cx="64" cy="67" r="3.5" fill="#111"/>' +
    '<path d="M40 80 Q50 90 60 80" fill="none" stroke="#111" stroke-width="4" stroke-linecap="round"/>' +
    '<path d="M80 62 Q92 56 88 46" fill="none" stroke="#111" stroke-width="5" stroke-linecap="round"/>' +
    '<g class="cloth"><rect x="76" y="24" width="28" height="22" rx="6" fill="#ffd60a" stroke="#111" stroke-width="4"/>' +
    '<path d="M80 31 L100 31 M80 38 L100 38" stroke="#f0a800" stroke-width="3"/></g>' +
    '<circle cx="12" cy="20" r="4" fill="#bfe6ff" stroke="#111" stroke-width="2"/><circle cx="22" cy="12" r="3" fill="#bfe6ff" stroke="#111" stroke-width="2"/>' +
    '</svg>';

  function injectCss() {
    if (document.getElementById("wp-css")) return;
    const style = document.createElement("style");
    style.id = "wp-css";
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  registerMicrogame({
    id: "window-wiper",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 11000,
    input: "drag",

    start(ctx) {
      injectCss();
      const type = ctx.list.type;
      const speed = ctx.speed || 1;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const n = speed >= 1.5 ? 6 : 4;
      const cols = 2, rows = n / cols;
      const letterName = (it) => it.say || it.text.toUpperCase();
      const { sweep, noise, tone } = ctx.sfx;

      // ---------- Content ----------
      let cardText, prompt, answer, tags;
      if (type === "phonics") {
        const letter = ctx.items.find((it) => ctx.phonics.pics(it).length) || ctx.items[0];
        const set = ctx.phonics.set(letter, 1, n - 1);
        const right = set.right[0];
        cardText = letter.text.toUpperCase();
        prompt = letterName(letter);
        answer = TEXT.answer(letterName(letter), right.word);
        tags = [right, ...set.wrong].map((p) => ({ text: p.emoji, kind: "pic", right: p === right }));
      } else if (type === "cvc") {
        const pool = ctx.items.filter((it) => it.emoji);
        const target = pool[0];
        const picks = [];
        for (const o of [...ctx.pickOptions(target, 12), ...ctx.shuffle(pool.slice())]) {
          if (picks.length >= n - 1) break;
          if (o !== target && o.emoji && !picks.includes(o)) picks.push(o);
        }
        cardText = target.text;
        prompt = answer = target.say || target.text;
        tags = [target, ...picks].map((o) => ({ text: o.emoji, kind: "pic", right: o === target }));
      } else if (type === "hfw") {
        const target = ctx.items[0];
        cardText = ctx.canSpeak ? TEXT.listen : target.text;
        prompt = answer = target.say || target.text;
        const others = ctx.pickOptions(target, n + 1).filter((o) => o !== target).slice(0, n - 1);
        tags = [target, ...others].map((o) => ({ text: o.text, kind: "word", right: o === target }));
      } else {
        const target = ctx.items[0];
        cardText = target.text;
        prompt = letterName(target);
        answer = target.word ? TEXT.answer(letterName(target), target.word) : prompt;
        tags = ctx.pickOptions(target, n).map((o) => ({ text: o.text, kind: "letter", right: o === target }));
      }
      tags = ctx.shuffle(tags);

      // ---------- DOM ----------
      const wrap = document.createElement("div");
      wrap.className = "wp";
      const top = document.createElement("div");
      top.className = "wp-top";
      top.innerHTML = BUCKET;
      const bucket = top.querySelector(".wp-bucket");
      const card = document.createElement("button");
      card.className = "wp-card";
      card.setAttribute("aria-label", TEXT.cardLabel);
      card.innerHTML = '<span class="ct"></span>';
      card.firstChild.textContent = cardText;
      if (ctx.canSpeak && cardText !== TEXT.listen) card.insertAdjacentHTML("beforeend", '<span class="spk">🔊</span>');
      card.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });
      card.addEventListener("click", (e) => { if (e.detail === 0) replay(); });
      top.appendChild(card);
      const frame = document.createElement("div");
      frame.className = "wp-frame";
      const glass = document.createElement("div");
      glass.className = "wp-glass";
      glass.innerHTML = '<div class="wp-items"></div><canvas class="wp-dirt"></canvas><div class="wp-mull"></div><div class="wp-fx"></div>';
      frame.appendChild(glass);
      wrap.append(top, frame);
      ctx.root.appendChild(wrap);
      const itemsEl = glass.querySelector(".wp-items");
      const canvas = glass.querySelector(".wp-dirt");
      const mull = glass.querySelector(".wp-mull");
      const fx = glass.querySelector(".wp-fx");
      const cloth = document.createElement("div");
      cloth.className = "wp-cloth";
      fx.appendChild(cloth);

      const panes = tags.map((tag, i) => {
        const el = document.createElement("div");
        el.className = "wp-it" + (tag.kind === "word" ? " word" : "");
        el.style.setProperty("--rim", RIMS[i % RIMS.length]);
        el.innerHTML = '<div class="wp-leg l"></div><div class="wp-leg r"></div><div class="wp-body"></div>' +
          '<div class="wp-eye l"></div><div class="wp-eye r"></div><div class="wp-tag"></div>';
        const t = el.querySelector(".wp-tag");
        t.textContent = tag.text;
        if (tag.kind === "pic") t.classList.add("pic");
        itemsEl.appendChild(el);
        return { el, tagEl: t, tag, col: i % cols, row: Math.floor(i / cols), state: "dirty", r: null };
      });

      // ---------- Layout + grime ----------
      const g2 = canvas.getContext("2d", { willReadFrequently: true });
      let W = 0, H = 0, brush = 40, isz = 60;
      const MULL = 10; // mullion thickness, px
      function layout() {
        W = glass.clientWidth; H = glass.clientHeight;
        const pw = (W - MULL * (cols - 1)) / cols, ph = (H - MULL * (rows - 1)) / rows;
        isz = Math.max(44, Math.min(pw * (tags[0].kind === "word" ? 0.6 : 0.68), ph * 0.66));
        brush = Math.max(34, Math.min(pw, ph) * 0.42);
        glass.style.setProperty("--is", `${isz}px`);
        panes.forEach((p) => {
          p.r = { x: p.col * (pw + MULL), y: p.row * (ph + MULL), w: pw, h: ph };
          if (p.state !== "gone") {
            p.el.style.left = `${p.r.x + pw / 2}px`;
            p.el.style.top = `${p.r.y + ph / 2}px`;
          }
          if (p.tag.kind === "word") p.tagEl.style.fontSize = `${Math.min(isz * 0.42, (isz * 1.5 * 0.8) / (p.tag.text.length * 0.6))}px`;
        });
        mull.innerHTML = "";
        for (let c = 1; c < cols; c++) {
          const m = document.createElement("i");
          m.style.cssText = `left:${c * (pw + MULL) - MULL - 2}px;top:-4px;bottom:-4px;width:${MULL + 4}px;`;
          mull.appendChild(m);
        }
        for (let r = 1; r < rows; r++) {
          const m = document.createElement("i");
          m.style.cssText = `top:${r * (ph + MULL) - MULL - 2}px;left:-4px;right:-4px;height:${MULL + 4}px;`;
          mull.appendChild(m);
        }
      }
      function paintGrime() {
        canvas.width = Math.max(1, Math.round(W));
        canvas.height = Math.max(1, Math.round(H));
        const c = g2;
        c.globalCompositeOperation = "source-over";
        c.fillStyle = "rgba(122, 101, 70, .95)";
        c.fillRect(0, 0, W, H);
        // Smudges, muck and splats.
        const blobs = Math.round((W * H) / 900);
        for (let i = 0; i < blobs; i++) {
          const x = Math.random() * W, y = Math.random() * H, r = 6 + Math.random() * 34;
          const dark = Math.random() < 0.55;
          c.fillStyle = dark ? `rgba(70, 55, 35, ${0.15 + Math.random() * 0.3})` : `rgba(170, 150, 110, ${0.1 + Math.random() * 0.25})`;
          c.beginPath();
          c.ellipse(x, y, r, r * (0.5 + Math.random() * 0.7), Math.random() * 3, 0, Math.PI * 2);
          c.fill();
        }
        // Drips running down.
        for (let i = 0; i < Math.round(W / 26); i++) {
          const x = Math.random() * W, y = Math.random() * H * 0.6, len = 30 + Math.random() * 90, w = 4 + Math.random() * 7;
          c.fillStyle = `rgba(80, 62, 38, ${0.35 + Math.random() * 0.3})`;
          c.fillRect(x - w / 2, y, w, len);
          c.beginPath(); c.arc(x, y + len, w * 0.8, 0, Math.PI * 2); c.fill();
        }
      }
      layout();
      paintGrime();
      const ro = new ResizeObserver(() => {
        const oldW = W, oldH = H;
        layout();
        if (Math.abs(W - oldW) < 1 && Math.abs(H - oldH) < 1) return;
        // Keep the wiping done so far: stretch the old dirt onto the new size.
        const tmp = document.createElement("canvas");
        tmp.width = canvas.width; tmp.height = canvas.height;
        tmp.getContext("2d").drawImage(canvas, 0, 0);
        canvas.width = Math.max(1, Math.round(W)); canvas.height = Math.max(1, Math.round(H));
        g2.drawImage(tmp, 0, 0, canvas.width, canvas.height);
      });
      ro.observe(glass);

      // ---------- Wiping ----------
      // Each bit of wiping removes dirt in proportion to the distance moved (not the number of move
      // events), so it takes several quick back-and-forth passes to clean a spot.
      const WIPE = 0.5; // strength per brush-width of travel (tuned: ~1.5 s of quick scrubbing per pane)
      let done = false, wiping = null, lastCheck = 0, lastSqueak = 0;
      const local = (e) => { const r = glass.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
      function wipe(a, b) {
        const len = Math.hypot(b.x - a.x, b.y - a.y);
        if (len < 0.5) return;
        g2.globalCompositeOperation = "destination-out";
        g2.lineCap = "round";
        g2.lineWidth = brush;
        g2.strokeStyle = `rgba(0,0,0,${Math.min(0.6, Math.max(0.004, (WIPE * len) / brush))})`;
        g2.beginPath();
        g2.moveTo(a.x, a.y);
        g2.lineTo(b.x, b.y);
        g2.stroke();
        const now = performance.now();
        if (now - lastSqueak > 110 && len > 4) {
          lastSqueak = now;
          noise(0.08, "bandpass", 2600 + Math.random() * 1500, 3500, 0.12);
          if (Math.random() < 0.25) sweep(1400, 2200, 0.06, "sine", 0.05);
        }
        if (now - lastCheck > 110) { lastCheck = now; checkPanes(); }
      }
      glass.addEventListener("pointerdown", (e) => {
        if (done || ctx.ended) return;
        e.preventDefault();
        try { glass.setPointerCapture(e.pointerId); } catch (err) { /* capture is a nicety */ }
        const p = local(e);
        wiping = { id: e.pointerId, last: p };
        moveCloth(p, true);
      });
      glass.addEventListener("pointermove", (e) => {
        if (!wiping || e.pointerId !== wiping.id || done) return;
        const p = local(e);
        wipe(wiping.last, p);
        wiping.last = p;
        moveCloth(p, true);
      });
      const end = (e) => {
        if (!wiping || e.pointerId !== wiping.id) return;
        wiping = null;
        moveCloth(null, false);
        if (!done) checkPanes();
      };
      glass.addEventListener("pointerup", end);
      glass.addEventListener("pointercancel", end);
      function moveCloth(p, on) {
        cloth.classList.toggle("on", !!on && !done);
        if (p) { cloth.style.left = `${p.x}px`; cloth.style.top = `${p.y}px`; }
      }

      // How clean is each pane (the middle 70%, where the character is)? Mostly clean → reveal it.
      function cleanFraction(p) {
        const ix = Math.round(p.r.x + p.r.w * 0.15), iy = Math.round(p.r.y + p.r.h * 0.15);
        const iw = Math.max(1, Math.round(p.r.w * 0.7)), ih = Math.max(1, Math.round(p.r.h * 0.7));
        const data = g2.getImageData(ix, iy, iw, ih).data;
        let clean = 0, total = 0;
        const step = 5;
        for (let y = 0; y < ih; y += step) {
          for (let x = 0; x < iw; x += step) {
            total++;
            if (data[(y * iw + x) * 4 + 3] < 95) clean++;
          }
        }
        return total ? clean / total : 0;
      }
      function checkPanes() {
        if (done) return;
        for (const p of panes) {
          if (p.state !== "dirty") continue;
          if (cleanFraction(p) < 0.58) continue;
          reveal(p);
          if (done) return;
        }
      }

      function reveal(p) {
        if (p.tag.right) { win(p); return; }
        p.state = "gone";
        // "Not me!" — then it runs off the side of the window.
        const say = document.createElement("div");
        say.className = "wp-say";
        say.textContent = TEXT.notMe;
        const cx = p.r.x + p.r.w / 2, cy = p.r.y + p.r.h / 2;
        say.style.left = `${Math.min(W - 50, Math.max(50, cx))}px`;
        say.style.top = `${Math.max(30, cy - isz * 0.6)}px`;
        fx.appendChild(say);
        sweep(700, 950, 0.1, "square", 0.06);
        sweep(950, 600, 0.12, "square", 0.06, 0.11);
        ctx.later(() => {
          say.remove();
          p.el.classList.add("run");
          const dir = p.col === 0 ? -1 : 1;
          p.el.style.left = `${cx + dir * (W * 0.6 + isz)}px`;
          noise(0.3, "bandpass", 1200, 600, 0.12);
        }, 650);
      }

      function sparkleAll() {
        if (reduceMotion) return;
        for (let i = 0; i < 12; i++) {
          const s = document.createElement("div");
          s.className = "wp-spark";
          s.textContent = i % 3 ? "✨" : "⭐";
          s.style.cssText = `left:${Math.random() * W}px;top:${Math.random() * H}px;animation-delay:${(Math.random() * 0.3).toFixed(2)}s;`;
          fx.appendChild(s);
        }
      }

      function win(p) {
        if (done || ctx.ended) return;
        done = true;
        p.state = "found";
        ctx.win();
        canvas.classList.add("gone");
        moveCloth(null, false);
        bucket.classList.add("happy");
        p.el.classList.add("yay");
        sparkleAll();
        [1318, 1568, 2093].forEach((f, i) => tone(f, 0.12, "triangle", 0.12, i * 0.07)); // squeaky clean "ting-ting-ting"
        ctx.confetti(fx, p.r.x + p.r.w / 2, p.r.y + p.r.h / 2);
        ctx.say(answer);
      }

      ctx.onTimeout(() => {
        done = true;
        canvas.classList.add("gone");
        moveCloth(null, false);
        panes.forEach((p) => {
          if (p.tag.right) p.el.classList.add("answer");
          else if (p.state === "dirty") p.el.classList.add("dim");
        });
        ctx.say(answer);
      });

      function replay() { if (!done) ctx.say(prompt); }

      // A small finger-only hint: a wipe along the middle bar of the window (never over one pane's centre).
      ctx.later(() => {
        const gr = ctx.root.getBoundingClientRect(), r = glass.getBoundingClientRect();
        const y = r.top - gr.top + H / rows - MULL / 2; // on the first horizontal bar
        ctx.hint({ x: r.left - gr.left + W * 0.2, y }, { x: r.left - gr.left + W * 0.8, y }, { noWord: true, scale: 0.7 });
      }, 80);

      // Keyboard: 1–6 wipes that pane clean at once; space repeats the word.
      function onKey(e) {
        if (done) return;
        if (e.key === " ") { e.preventDefault(); replay(); return; }
        const i = parseInt(e.key, 10) - 1;
        const p = panes[i];
        if (!p || p.state !== "dirty") return;
        e.preventDefault();
        g2.globalCompositeOperation = "destination-out";
        g2.fillStyle = "#000";
        g2.fillRect(p.r.x, p.r.y, p.r.w, p.r.h);
        reveal(p);
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
