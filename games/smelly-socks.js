// SMELLY SOCKS — a tap game (Claude's idea, named by the teacher). Socks flap on a windy washing line, each with
// an answer. A barefoot monster sits below holding up a sign with what it wants, wiggling two bare feet: find
// THE PAIR (two socks on the line match the sign; phonics: two different pictures that start with the letter).
// A right sock flies down onto a foot (it wiggles its toes: COMFY!). A wrong one is a STINKY sock: a green
// cloud, the monster turns green and gags (PEE-YEW!), and the round is lost. Both feet socked: it dances.
(function () {
  const TEXT = {
    name: { en: "Smelly Socks" },
    icon: "🧦",
    howTo: { en: {
      steps: [
        ["👀", "The monster's sign shows what it wants."],
        ["🧦", "Find the PAIR: tap the two socks that match the sign."],
        ["🦶", "Each one goes on a bare foot. Two socks on and it dances!"],
      ],
      tips: ["A wrong sock is a stinky sock. PEE-YEW! That's the end of the round.", "Tap the sign to hear it again.", "When the game speeds up, there are more socks and the wind blows harder."],
    } },
    instruction: { en: "FIND THE\nPAIR!" },
    cardLabel: "The sign. Tap to hear it again.",
    sockLabel: (t) => `Sock ${t}`,
    comfy: ["COMFY!", "AHHH!"],
    stinky: "PEE-YEW!",
    yay: "TOASTY TOES!",
  };
  const COLORS = ["#ff5a6e", "#3d8bfd", "#ffd400", "#4dd36b", "#c04dd9", "#ff8a1f"];

  const CSS = `
  .sox { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; }
  .sox-yard { position:relative; flex:1; min-height:0; width:100%; max-width:620px; overflow:hidden; border:5px solid #111; border-radius:16px; box-shadow:0 7px 0 #111;
    background:linear-gradient(180deg, #9fe0ff 0 62%, #7fd36b 62%); }
  .sox-cloud { position:absolute; width:90px; height:30px; background:#fff; border-radius:99px; opacity:.85; animation:sox-drift 9s linear infinite alternate; }
  .sox-cloud::before { content:""; position:absolute; left:20px; top:-16px; width:44px; height:40px; background:#fff; border-radius:50%; }
  .sox-post { position:absolute; top:6%; width:12px; height:var(--lineY); background:#8a5a3c; border:3px solid #111; }
  .sox-post.l { left:3%; } .sox-post.r { right:3%; }
  .sox-line { position:absolute; left:3%; top:calc(6% + 6px); width:94%; height:40px; pointer-events:none; overflow:visible; }
  .sox-line path { fill:none; stroke:#fff; stroke-width:4; }
  /* A sock hangs from its peg on the line: --sz is its size; --c its colour */
  .sox-sock { position:absolute; width:var(--sz); height:calc(var(--sz) * 1.45); margin-left:calc(var(--sz) / -2); padding:0; border:0; background:none; font:inherit; cursor:pointer;
    touch-action:manipulation; transform-origin:50% 0; animation:sox-flap var(--fl, 1.2s) ease-in-out infinite alternate; z-index:2; }
  .sox-peg { position:absolute; left:42%; top:-8%; width:16%; height:20%; background:#d9a066; border:3px solid #111; border-radius:4px; z-index:3; }
  /* (a tube leg with a striped cuff, bending into a foot that points right, with a paler heel and toe) */
  .sox-leg { position:absolute; left:10%; width:58%; top:4%; height:70%; z-index:1; background:var(--c); border:4px solid #111; border-bottom:0; border-radius:6px 6px 0 0;
    background-image:linear-gradient(rgba(255,255,255,.8) 0 9%, transparent 9% 15%, rgba(255,255,255,.8) 15% 22%, transparent 22%); }
  .sox-foot { position:absolute; left:10%; width:90%; top:58%; height:38%; background:var(--c); border:4px solid #111; border-radius:0 50% 50% 40% / 0 60% 60% 60%; overflow:hidden; }
  .sox-foot::before { content:""; position:absolute; left:-6%; bottom:-20%; width:36%; height:70%; background:rgba(0,0,0,.18); border-radius:50%; }   /* heel */
  .sox-foot::after { content:""; position:absolute; right:-8%; top:-10%; width:32%; height:120%; background:rgba(0,0,0,.18); border-radius:50%; }      /* toe */
  .sox-lbl { position:absolute; left:42%; top:38%; transform:translate(-50%, -50%); z-index:2; padding:1px 5px; background:#fff; border:3px solid #111; border-radius:8px;
    font-size:calc(var(--sz) * .36); line-height:1.1; white-space:nowrap; color:#111; }
  .sox-sock.taken { visibility:hidden; }
  .sox-sock.right { filter:drop-shadow(0 0 8px #ffd400) drop-shadow(0 0 4px #fff); }
  .sox-sock.dim { opacity:.4; }
  /* The barefoot monster (--mz): a fat purple blob sitting on the grass, a sign up on a stick, two bare feet */
  .sox-mon { position:absolute; left:50%; bottom:3%; width:var(--mz); height:var(--mz); margin-left:calc(var(--mz) / -2); z-index:3; }
  .sox-mon > * { position:absolute; box-sizing:border-box; }
  .sox-body { left:12%; right:12%; top:26%; bottom:16%; background:#9a5cf0; border:5px solid #111; border-radius:50% 50% 42% 42%; transition:background .2s; }
  .sox-mon.gag .sox-body { background:#8fd16a; }
  .sox-eye { top:34%; width:22%; aspect-ratio:1; background:#fff; border:4px solid #111; border-radius:50%; overflow:hidden; z-index:2; }
  .sox-eye.l { left:26%; } .sox-eye.r { right:24%; width:18%; top:37%; }
  .sox-eye i { position:absolute; left:28%; top:30%; width:46%; aspect-ratio:1; background:#111; border-radius:50%; animation:sox-roll 1.2s ease-in-out infinite alternate; }
  .sox-mouth { left:34%; right:34%; top:58%; height:13%; background:#5a0f1e; border:4px solid #111; border-radius:10% 10% 50% 50% / 14% 14% 86% 86%; z-index:2; overflow:hidden; }
  .sox-mouth::before { content:""; position:absolute; left:6%; right:6%; top:0; height:32%; background:#fff; }
  .sox-mon.gag .sox-mouth { border-radius:50%; height:16%; left:40%; right:40%; }
  .sox-mon.gag .sox-eye i { animation:sox-dizzy .4s linear infinite; }
  .sox-cheek { top:54%; width:12%; height:7%; background:#ff8fb8; border-radius:50%; opacity:.8; z-index:2; } .sox-cheek.l { left:18%; } .sox-cheek.r { right:18%; }
  .sox-arm { top:38%; width:12%; height:34%; background:#9a5cf0; border:4px solid #111; border-radius:99px; transform-origin:50% 10%; }
  .sox-arm.l { left:4%; transform:rotate(30deg); } .sox-arm.r { right:2%; top:30%; transform:rotate(-160deg); }   /* (holding the stick up) */
  .sox-mon.gag .sox-arm { background:#8fd16a; }
  .sox-feet { left:6%; right:6%; bottom:0; height:22%; z-index:3; }
  .sox-ft { position:absolute; bottom:0; width:40%; height:100%; background:#ffc9a8; border:4px solid #111; border-radius:50% 50% 30% 30%; animation:sox-wiggle .5s ease-in-out infinite alternate; }
  .sox-ft.l { left:0; transform-origin:80% 100%; } .sox-ft.r { right:0; transform-origin:20% 100%; animation-delay:-.25s; }
  .sox-ft::before { content:""; position:absolute; left:8%; right:8%; top:-4%; height:34%; background:radial-gradient(circle, #ffc9a8 0 40%, #111 42% 52%, transparent 54%) 0 0 / 20% 100%; }   /* toes */
  .sox-ft.on { background:var(--c); animation:sox-wiggle .2s ease-in-out infinite alternate; }
  .sox-ft.on::before { background:none; }
  .sox-ft.on::after { content:""; position:absolute; left:8%; right:8%; top:20%; height:16%; background:rgba(255,255,255,.7); border-radius:99px; }
  .sox-mon.yay { animation:sox-dance .3s ease-in-out infinite alternate; }
  /* The sign, held up on a stick */
  .sox-stick { left:92%; top:-34%; width:5%; height:56%; background:#8a5a3c; border:3px solid #111; z-index:1; }
  .sox-card { position:absolute; left:94%; top:-74%; transform:translateX(-50%); z-index:4; min-width:calc(var(--mz) * .62); padding:4px 10px; background:#fff; border:5px solid #111;
    border-radius:14px; box-shadow:0 5px 0 #111; font:inherit; font-size:calc(var(--mz) * .26); line-height:1.05; color:#111; cursor:pointer; touch-action:manipulation; white-space:nowrap;
    display:flex; align-items:center; justify-content:center; gap:4px; }
  .sox-card .spk { font-size:.5em; }
  .sox-fx { position:absolute; inset:0; pointer-events:none; z-index:8; overflow:visible; }
  .sox-pop { position:absolute; line-height:1; transform:translate(-50%, -50%); pointer-events:none; }
  .sox-word { position:absolute; transform:translate(-50%, -50%) rotate(-8deg); font-size:2rem; color:#ffd400; -webkit-text-stroke:2px #111; paint-order:stroke fill;
    text-shadow:0 4px 0 #111; white-space:nowrap; animation:sox-word 1s ease-out forwards; z-index:9; }
  .sox-word.bad { color:#8fd16a; }
  .sox-stink { position:absolute; border-radius:50%; background:radial-gradient(circle, rgba(143,209,106,.9) 0 40%, rgba(143,209,106,0) 70%); pointer-events:none; }
  @keyframes sox-flap { from { transform:rotate(calc(var(--sw, 8deg) * -1)); } to { transform:rotate(var(--sw, 8deg)); } }
  @keyframes sox-drift { to { translate:60px 0; } }
  @keyframes sox-roll { from { transform:translate(-25%, -15%); } to { transform:translate(25%, 15%); } }
  @keyframes sox-dizzy { from { transform:rotate(0) translateX(25%); } to { transform:rotate(360deg) translateX(25%); } }
  @keyframes sox-wiggle { from { transform:rotate(-5deg); } to { transform:rotate(5deg); } }
  @keyframes sox-dance { from { transform:rotate(-6deg) translateY(0); } to { transform:rotate(6deg) translateY(-6%); } }
  @keyframes sox-word { from { opacity:1; scale:.5; } 25% { scale:1.15; } 75% { opacity:1; } to { opacity:0; translate:0 -40px; } }
  @media (prefers-reduced-motion: reduce) { .sox-sock, .sox-cloud, .sox-eye i, .sox-ft, .sox-mon.yay, .sox-word { animation:none !important; } }
  `;
  function injectCss() { if (document.getElementById("sox-css")) return; const s = document.createElement("style"); s.id = "sox-css"; s.textContent = CSS; document.head.appendChild(s); }

  registerMicrogame({
    id: "smelly-socks",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 9000,
    input: "tap",
    tutorial: true,

    start(ctx) {
      injectCss();
      const speed = ctx.speed || 1;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const { tone, sweep, noise } = ctx.sfx;
      const N = speed >= 2 ? 6 : speed >= 1.5 ? 5 : 4;   // socks on the line (2 of them the pair)
      // Two rows: each has one right answer, so the pair is row 0's and row 1's (phonics: two pictures of the letter).
      const C = ctx.choiceRows(2, N - 1, { lowercase: true });
      const pair = [C.rows[0].find((o) => o.right), C.rows[1].find((o) => o.right)];
      const wrongs = C.rows[0].filter((o) => !o.right).slice(0, N - 2);
      const opts = ctx.shuffle([...pair, ...wrongs]);

      const wrap = document.createElement("div");
      wrap.className = "sox";
      const yard = document.createElement("div");
      yard.className = "sox-yard";
      yard.innerHTML = '<div class="sox-cloud" style="left:12%;top:14%"></div><div class="sox-cloud" style="left:60%;top:24%;animation-delay:-4s"></div>' +
        '<div class="sox-post l"></div><div class="sox-post r"></div><svg class="sox-line" preserveAspectRatio="none" viewBox="0 0 100 40"><path d="M0 4 Q50 36 100 4"/></svg>';
      const mon = document.createElement("div");
      mon.className = "sox-mon";
      mon.innerHTML = '<div class="sox-stick"></div><div class="sox-arm l"></div><div class="sox-arm r"></div><div class="sox-body"></div><div class="sox-cheek l"></div><div class="sox-cheek r"></div>' +
        '<div class="sox-eye l"><i></i></div><div class="sox-eye r"><i></i></div><div class="sox-mouth"></div><div class="sox-feet"><div class="sox-ft l"></div><div class="sox-ft r"></div></div>';
      const card = document.createElement("button");
      card.className = "sox-card";
      card.setAttribute("aria-label", TEXT.cardLabel);
      card.innerHTML = '<span class="ct"></span>';
      card.firstChild.textContent = C.cardText;
      if (ctx.canSpeak && !C.listen) card.insertAdjacentHTML("beforeend", '<span class="spk">🔊</span>');
      card.addEventListener("pointerdown", (e) => { e.preventDefault(); replay(); });
      mon.appendChild(card);
      const fx = document.createElement("div");
      fx.className = "sox-fx";
      yard.append(mon, fx);
      wrap.appendChild(yard);
      ctx.root.appendChild(wrap);
      const feet = [...mon.querySelectorAll(".sox-ft")];

      const socks = opts.map((o, i) => {
        const b = document.createElement("button");
        b.className = "sox-sock";
        b.style.setProperty("--c", COLORS[i % COLORS.length]);
        b.style.setProperty("--fl", `${(1.3 / (0.6 + 0.4 * speed) + i * 0.07).toFixed(2)}s`);
        b.style.setProperty("--sw", `${(5 + 5 * speed).toFixed(1)}deg`);
        b.style.animationDelay = `${-i * 0.37}s`;
        b.setAttribute("aria-label", TEXT.sockLabel(o.spoken || o.text));
        b.innerHTML = '<div class="sox-leg"></div><div class="sox-foot"></div><div class="sox-peg"></div><span class="sox-lbl"></span>';
        b.querySelector(".sox-lbl").textContent = o.text;
        b.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); pick(s); });
        yard.insertBefore(b, mon);
        const s = { b, o, taken: false };
        return s;
      });

      // ---------- Layout ----------
      let W = 0, H = 0, sz = 60, mz = 150;
      function layout() {
        W = yard.clientWidth; H = yard.clientHeight;
        sz = Math.max(46, Math.min((W * 0.88) / N - 10, H * 0.2, 96));
        mz = Math.max(100, Math.min(H * 0.36, W * 0.42, 210));
        yard.style.setProperty("--sz", `${sz}px`);
        yard.style.setProperty("--mz", `${mz}px`);
        const lineY = H * 0.06 + 6;
        yard.style.setProperty("--lineY", `${sz * 0.6}px`);
        socks.forEach((s, i) => {
          const k = (i + 0.5) / N, x = W * (0.03 + 0.94 * k);
          const sag = Math.sin(k * Math.PI) * 30;   // (the line sags in the middle)
          s.b.style.left = `${x}px`; s.b.style.top = `${lineY + sag + 2}px`;
          const lbl = s.b.querySelector(".sox-lbl");
          lbl.style.fontSize = s.o.kind === "word" ? `${Math.min(sz * 0.34, (sz * 1.05) / ([...s.o.text].length * 0.62))}px` : "";
        });
        card.style.fontSize = C.cardText && [...C.cardText].length > 3 ? `${Math.min(mz * 0.26, (mz * 1.2) / ([...C.cardText].length * 0.6))}px` : "";
      }

      let got = 0, done = false, busy = false;
      function pick(s) {
        if (done || busy || ctx.ended || s.taken) return;
        if (s.o.right) putOn(s); else stinky(s);
      }
      // A right sock: off the peg, down onto the next bare foot, and the toes wiggle (COMFY!).
      function putOn(s) {
        busy = true;
        s.taken = true;
        const foot = feet[got];
        got++;
        const yr = yard.getBoundingClientRect(), a = s.b.getBoundingClientRect(), f = foot.getBoundingClientRect();
        const ghost = s.b.cloneNode(true);
        ghost.style.animation = "none"; ghost.style.left = `${a.left - yr.left + a.width / 2}px`; ghost.style.top = `${a.top - yr.top}px`; ghost.style.zIndex = 7;
        fx.appendChild(ghost);
        s.b.classList.add("taken");
        tone(880, 0.06, "square", 0.06); sweep(500, 1200, 0.25, "triangle", 0.07);   // pop off the peg, whee
        ghost.animate([{ transform: "none" }, { transform: `translate(${f.left - a.left}px, ${f.top - a.top - a.height * 0.4}px) rotate(200deg) scale(.7)` }],
          { duration: reduceMotion ? 1 : 520, easing: "ease-in", fill: "forwards" });
        ctx.later(() => {
          ghost.remove();
          foot.style.setProperty("--c", s.b.style.getPropertyValue("--c"));
          foot.classList.add("on");
          tone(660, 0.08, "triangle", 0.1); tone(990, 0.12, "triangle", 0.1, 0.08);
          word(TEXT.comfy[got - 1] || TEXT.comfy[0], false, f.left - yr.left + f.width / 2, f.top - yr.top - 30);
          if (s.o.kind === "pic") ctx.say(s.o.spoken);
          if (got >= 2) { done = true; ctx.win(); party(); return; }
          busy = false;
        }, reduceMotion ? 20 : 530);
      }
      function party() {
        mon.classList.add("yay");
        [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, "triangle", 0.1, 0.2 + i * 0.08));
        word(TEXT.yay, false, W / 2, H * 0.42);
        ctx.confetti(fx, W / 2, H * 0.5, { count: 80 });
        ctx.later(() => ctx.say(C.answer), 500);
      }
      // A wrong sock: STINKY. A green cloud, the monster gags, and the round is lost.
      function stinky(s) {
        done = true;
        ctx.lose();
        s.b.classList.add("dim");
        const yr = yard.getBoundingClientRect(), a = s.b.getBoundingClientRect(), m = mon.getBoundingClientRect();
        const cx = a.left - yr.left + a.width / 2, cy = a.top - yr.top + a.height / 2;
        for (let k = 0; k < 4; k++) {
          const c = document.createElement("div");
          c.className = "sox-stink";
          const r = sz * (0.9 + k * 0.25);
          c.style.width = c.style.height = `${r}px`; c.style.left = `${cx - r / 2}px`; c.style.top = `${cy - r / 2}px`;
          fx.appendChild(c);
          c.animate([{ transform: "scale(.3)", opacity: 1 }, { transform: `translate(${(m.left - a.left) * 0.6}px, ${(m.top - a.top) * 0.6}px) scale(1.6)`, opacity: 0 }],
            { duration: reduceMotion ? 1 : 1100, delay: k * 120, easing: "ease-out", fill: "forwards" });
        }
        ["💨", "🤢", "💨"].forEach((e, k) => {
          const p = document.createElement("div");
          p.className = "sox-pop"; p.textContent = e; p.style.fontSize = `${sz * 0.6}px`;
          p.style.left = `${m.left - yr.left + m.width * (0.2 + k * 0.3)}px`; p.style.top = `${m.top - yr.top + m.height * 0.2}px`;
          fx.appendChild(p);
          p.animate([{ translate: "0 0", opacity: 1 }, { translate: "0 -50px", opacity: 0 }], { duration: 1200, delay: 300 + k * 100, fill: "forwards" });
        });
        noise(0.5, "lowpass", 500, 200, 0.3); sweep(220, 90, 0.6, "sawtooth", 0.1, 0.1);   // phhhbbbt
        ctx.later(() => { mon.classList.add("gag"); sweep(700, 300, 0.4, "square", 0.07); word(TEXT.stinky, true, W / 2, H * 0.4); }, 350);
        ctx.later(() => { socks.forEach((x) => { if (!x.taken && x !== s) x.b.classList.add(x.o.right ? "right" : "dim"); }); ctx.say(C.answer); }, 900);
      }
      function word(text, bad, x, y) {
        const w = document.createElement("div");
        w.className = "sox-word" + (bad ? " bad" : "");
        w.textContent = text;
        w.style.left = `${Math.max(70, Math.min(W - 70, x))}px`; w.style.top = `${Math.max(30, y)}px`;
        fx.appendChild(w);
        ctx.later(() => w.remove(), 1000);
      }
      function replay() { if (!done) ctx.say(C.prompt); }

      ctx.onTimeout(() => { done = true; socks.forEach((x) => { if (!x.taken) x.b.classList.add(x.o.right ? "right" : "dim"); }); ctx.say(C.answer); });
      function onKey(e) {
        const i = parseInt(e.key, 10) - 1;
        if (i >= 0 && i < socks.length) { e.preventDefault(); pick(socks[i]); }
        else if (e.key === " ") { e.preventDefault(); replay(); }
      }
      document.addEventListener("keydown", onKey);

      layout();
      const ro = new ResizeObserver(layout);
      ro.observe(yard);
      ctx.say(C.prompt);
      ctx.reveal(card);

      // Tutorial: point at the sign, then tap both socks of the pair.
      ctx.tutorial(C.target, async (f) => {
        await f.point(card, 900);
        for (let n = 0; n < 2 && !done; n++) {
          await f.until(() => !busy, 2000);
          const s = socks.find((x) => x.o.right && !x.taken);
          if (!s) break;
          await f.tap(s.b);
          await f.until(() => got > n || done, 1500);
        }
      });
      return () => { done = true; ro.disconnect(); document.removeEventListener("keydown", onKey); };
    },
  });
})();
