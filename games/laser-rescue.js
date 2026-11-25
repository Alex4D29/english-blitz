// CRAB KAIJU (id "laser-rescue": it used to be Laser Rescue, robots behind hatches; the teacher's rework: "you are
// fighting a big robot monster and need to cut out the weak parts… a robot crab… city sized kaiju"). A carve-it-out
// game on js/carve.js. A giant red robot crab towers over a tiny city at night (one huge googly eye on a stalk, a grille
// mouth, huge claws up over the skyline, legs planted between the buildings), stomping. Its weak points are glowing
// cores in hazard-striped rings on its claws and belly, each with an answer: laser-cut round the one that matches the
// card and it explodes (WEAK POINT! / MASSIVE DAMAGE! / CRITICAL HIT!) and the crab takes damage: first its eye cracks
// and it smokes, then its antenna snaps and it lists; the third: KAIJU DOWN, it keels over with X eyes in a shower of
// bolts. A wrong core is just armour plate: TOO TOUGH!, and the crab zaps back (a red flash). (Keep it original: our
// own crab, not any film's monster.)
(function () {
  const TEXT = {
    name: { en: "Crab Kaiju" },
    icon: "🦀",
    howTo: { en: {
      steps: [
        ["🦀", "A giant robot crab is attacking the city!"],
        ["🔦", "Laser-cut all the way round the glowing weak point with the card's answer."],
        ["💥", "Massive damage! Hit 3 weak points to knock it down."],
      ],
      tips: ["Cut round the dotted circle: the dashes glow as you go.", "A wrong one is just armour. TOO TOUGH! Two of those and it's over.", "Tap the card to hear it again."],
    } },
    instruction: { en: "HIT THE\nWEAK POINT!" },
    cut: ["WEAK POINT!", "MASSIVE DAMAGE!", "CRITICAL HIT!"],
    nope: "TOO TOUGH!",
    win: "KAIJU DOWN!",
  };

  const CSS = `
  .lzr-stage { background:radial-gradient(circle at 88% 12%, #fff6c9 0 4%, transparent 4.5%), radial-gradient(circle, #fff 0 1px, transparent 2px) 0 0 / 50px 44px,
    linear-gradient(180deg, #1b1446, #4a2a6e 70%, #6a3a5e); --cut:#ff3d6d; }
  /* The crab (behind everything), all in % of the stage */
  .lzr-crab { position:absolute; inset:0; z-index:0; pointer-events:none; animation:lzr-stomp 1.1s ease-in-out infinite alternate; }
  .lzr-crab > * { position:absolute; box-sizing:border-box; }
  .lzr-leg { width:24%; height:5%; background:#c43c1c; border:4px solid #111; border-radius:99px; transform-origin:0 50%; }
  .lzr-leg.l1 { left:30%; top:62%; rotate:140deg; } .lzr-leg.l2 { left:32%; top:66%; rotate:118deg; } .lzr-leg.l3 { left:36%; top:68%; rotate:100deg; }
  .lzr-leg.r1 { left:70%; top:62%; rotate:40deg; } .lzr-leg.r2 { left:68%; top:66%; rotate:62deg; } .lzr-leg.r3 { left:64%; top:68%; rotate:80deg; }
  .lzr-arm { width:20%; height:7%; background:#c43c1c; border:4px solid #111; border-radius:99px; }
  .lzr-arm.l { left:14%; top:40%; rotate:-38deg; } .lzr-arm.r { right:14%; top:40%; rotate:38deg; }
  .lzr-claw { top:6%; width:30%; height:42%; background:radial-gradient(circle at 40% 35%, #ff7a4a 0 30%, #e2552b 70%); border:5px solid #111;
    clip-path:polygon(0 30%, 10% 6%, 34% 0, 58% 8%, 64% 34%, 40% 44%, 96% 40%, 100% 64%, 80% 92%, 46% 100%, 14% 92%, 0 66%); }
  .lzr-claw.l { left:2%; } .lzr-claw.r { right:2%; transform:scaleX(-1); }
  .lzr-claw.l { animation:lzr-snap .5s ease-in-out infinite alternate; } .lzr-claw.r { animation:lzr-snapr .5s ease-in-out infinite alternate .25s; }
  .lzr-body { left:24%; right:24%; top:34%; height:40%; border:6px solid #111; border-radius:50% 50% 42% 42% / 64% 64% 36% 36%;
    background:radial-gradient(circle, #8a2a12 0 4px, transparent 5px) 0 0 / 34px 30px, radial-gradient(ellipse at 40% 30%, #ff7a4a 0 30%, #e2552b 70%, #b8401c); box-shadow:inset -14px -14px 0 rgba(0,0,0,.18); }
  .lzr-mouth { left:40%; right:40%; top:52%; height:10%; background:repeating-linear-gradient(90deg, #fff 0 12%, #111 12% 18%); border:4px solid #111; border-radius:6px; z-index:1; }
  .lzr-stalk { left:48.5%; width:3%; top:16%; height:22%; background:#9aa3b5; border:3px solid #111; }
  .lzr-ant { left:57%; top:20%; width:1.6%; height:16%; background:#111; rotate:20deg; transform-origin:50% 100%; }
  .lzr-ant::after { content:""; position:absolute; left:-110%; top:-30%; width:320%; aspect-ratio:1; border-radius:50%; background:#ff3d3d; box-shadow:0 0 10px 4px #ff3d3d; animation:lzr-blink .6s steps(2) infinite; }
  .lzr-eye { left:50%; top:3%; height:22%; aspect-ratio:1; translate:-50% 0; background:#fff; border:5px solid #111; border-radius:50%; overflow:hidden; z-index:1; }
  .lzr-eye i { position:absolute; left:28%; top:30%; width:44%; aspect-ratio:1; border-radius:50%; background:radial-gradient(circle, #ff3d3d 0 30%, #111 32%); animation:lzr-look 1.6s ease-in-out infinite alternate; }
  .lzr-eye::after { content:""; position:absolute; inset:0; opacity:0; background:linear-gradient(60deg, transparent 46%, #111 46% 50%, transparent 50%), linear-gradient(-30deg, transparent 56%, #111 56% 59%, transparent 59%); }
  /* the tiny city in front of its legs, and a little helicopter */
  .lzr-city { position:absolute; left:0; right:0; bottom:0; height:20%; z-index:1; pointer-events:none;
    background:radial-gradient(circle, #ffe066 0 2px, transparent 3px) 4px 6px / 12px 14px, linear-gradient(0deg, #2a2050, #2a2050) 0 100% / 100% 40% no-repeat,
      repeating-linear-gradient(90deg, #3a2f6e 0 34px, transparent 34px 40px, #2f2560 40px 62px, transparent 62px 70px, #443a7a 70px 96px, transparent 96px 104px);
    -webkit-mask:linear-gradient(0deg, #000 0 40%, transparent 40%), repeating-linear-gradient(90deg, #000 0 34px, transparent 34px 40px, #000 40px 62px, transparent 62px 70px, #000 70px 96px, transparent 96px 104px);
    -webkit-mask-composite:source-over; mask:linear-gradient(0deg, #000 0 40%, transparent 40%), repeating-linear-gradient(90deg, #000 0 34px, transparent 34px 40px, #000 40px 62px, transparent 62px 70px, #000 70px 96px, transparent 96px 104px); }
  .lzr-heli { position:absolute; top:12%; left:0; font-size:1.4rem; z-index:1; pointer-events:none; animation:lzr-heli 7s linear infinite; }
  /* damage: 1 = cracked eye and smoke; 2 = antenna snapped, listing; ko = keels over with X eyes */
  .lzr-crab.d1 .lzr-eye::after { opacity:1; }
  .lzr-crab.d2 .lzr-ant { rotate:110deg; } .lzr-crab.d2 { rotate:-4deg; }
  .lzr-crab.hit { animation:lzr-reel .12s linear 6 alternate; }
  .lzr-crab.ko { animation:lzr-ko 1.2s ease-in forwards; }
  .lzr-crab.ko .lzr-eye i { background:none; animation:none; } .lzr-crab.ko .lzr-eye i::before { content:"✕"; position:absolute; inset:-30%; font:900 2.2rem/1 sans-serif; color:#111; display:flex; align-items:center; justify-content:center; }
  .lzr-flash { position:absolute; inset:0; z-index:7; pointer-events:none; background:rgba(255,40,40,.45); opacity:0; }
  .lzr-flash.on { animation:lzr-flash .45s ease-out; }
  /* A weak point: a glowing core in a hazard-striped ring; a wrong one turns out to be armour plate */
  .lzr-ring { position:absolute; inset:0; border-radius:50%; background:repeating-conic-gradient(#ffd400 0 15deg, #111 15deg 30deg); border:4px solid #111; }
  .lzr-core { position:absolute; inset:14%; border-radius:50%; background:radial-gradient(circle, #fff 0 18%, #7cf0ff 40%, #2a9dff 75%); border:4px solid #111; box-shadow:0 0 22px 8px rgba(124,240,255,.7);
    animation:lzr-pulse .7s ease-in-out infinite alternate; }
  .lzr-piece.free .lzr-core { animation:lzr-burst .5s ease-out forwards; }
  .lzr-piece.free .lzr-ring, .lzr-piece.free .co-lbl { animation:lzr-gone .5s ease-out .15s forwards; }
  .lzr-piece.dud .lzr-core { animation:none; box-shadow:none; background:radial-gradient(circle, #555 0 5%, transparent 6%) 50% 10% / 14% 14% no-repeat, radial-gradient(circle, #555 0 5%, transparent 6%) 50% 90% / 14% 14% no-repeat,
    radial-gradient(circle at 35% 30%, #e3e9f0 0 20%, #9aa3b5 70%); }
  .lzr-piece.dud .lzr-ring { background:#6a7482; }
  /* Our hero (--rz): a little yellow robot on a rooftop with a chunky laser blaster (the teacher's idea); the beam goes
     from its gun to your finger while you cut */
  .lzr-hero { position:absolute; left:2%; bottom:2%; width:var(--rz); height:calc(var(--rz) * 1.2); z-index:3; pointer-events:none; }
  .lzr-hin { position:absolute; inset:0; }
  .lzr-hin > * { position:absolute; box-sizing:border-box; border:3px solid #111; }
  .lzr-hleg { bottom:0; width:18%; height:20%; background:#555; } .lzr-hleg.l { left:24%; } .lzr-hleg.r { right:30%; }
  .lzr-hbody { left:16%; right:22%; top:44%; bottom:16%; background:#ffd400; border-radius:8px; }
  .lzr-hhead { left:12%; right:18%; top:10%; height:38%; background:#ffd400; border-radius:10px; z-index:1; }
  .lzr-hant { left:40%; top:0; width:6%; height:14%; background:#111; border:0; }
  .lzr-hant::after { content:""; position:absolute; left:-120%; top:-40%; width:340%; aspect-ratio:1; border-radius:50%; background:#7cf0ff; border:2px solid #111; }
  .lzr-heye { top:20%; width:22%; aspect-ratio:1; background:#fff; border-radius:50%; overflow:hidden; z-index:2; } .lzr-heye.l { left:22%; } .lzr-heye.r { left:50%; width:19%; top:22%; }
  .lzr-heye i { position:absolute; left:38%; top:18%; width:50%; aspect-ratio:1; border-radius:50%; background:#111; border:0; }   /* (looking up at the crab) */
  .lzr-hmouth { left:30%; right:36%; top:38%; height:6%; background:#111; border:0; border-radius:0 0 99px 99px; z-index:2; }
  .lzr-gun { left:54%; top:46%; width:56%; height:16%; background:linear-gradient(180deg, #9aa3b5, #6a7482); border-radius:4px 10px 10px 4px; z-index:3; rotate:-28deg; transform-origin:10% 50%; }
  .lzr-gun::after { content:""; position:absolute; right:-14%; top:14%; width:16%; height:60%; background:#ff3d6d; border:2px solid #111; border-radius:3px; }   /* the muzzle */
  .lzr-hero.firing .lzr-hin { animation:lzr-recoil .06s linear infinite alternate; }
  .lzr-hero.yay .lzr-hin { animation:lzr-hop .18s ease-in-out 4 alternate; }
  .lzr-hero.zapped .lzr-hin { animation:lzr-recoil .05s linear 10 alternate; filter:grayscale(.8) brightness(.7); }
  .lzr-beam { position:absolute; left:0; top:0; height:8px; margin-top:-4px; z-index:6; pointer-events:none; transform-origin:0 50%; border-radius:99px; opacity:0;
    background:linear-gradient(180deg, #ff3d6d, #fff 45% 55%, #ff3d6d); box-shadow:0 0 14px 4px rgba(255,61,109,.8); }
  .lzr-beam.on { opacity:1; }
  @keyframes lzr-recoil { from { translate:-1px 1px; } to { translate:1px -1px; } }
  @keyframes lzr-hop { to { translate:0 -14%; } }
  @keyframes lzr-stomp { from { translate:0 0; } to { translate:0 1.5%; } }
  @keyframes lzr-snap { from { rotate:-4deg; } to { rotate:6deg; } }
  @keyframes lzr-snapr { from { transform:scaleX(-1) rotate(-4deg); } to { transform:scaleX(-1) rotate(6deg); } }
  @keyframes lzr-look { from { transform:translate(-30%, -10%); } to { transform:translate(30%, 20%); } }
  @keyframes lzr-blink { 50% { opacity:.3; } }
  @keyframes lzr-heli { from { translate:-60px 0; } to { translate:110vw 20px; } }
  @keyframes lzr-reel { from { translate:-8px 0; rotate:-2deg; } to { translate:8px 0; rotate:2deg; } }
  @keyframes lzr-ko { 30% { rotate:-8deg; } 100% { rotate:16deg; translate:0 40%; } }
  @keyframes lzr-flash { from { opacity:1; } to { opacity:0; } }
  @keyframes lzr-pulse { from { scale:.94; } to { scale:1.04; } }
  @keyframes lzr-burst { to { scale:1.8; opacity:0; } }
  @keyframes lzr-gone { to { scale:.3; opacity:0; } }
  @media (prefers-reduced-motion: reduce) { .lzr-crab, .lzr-claw, .lzr-eye i, .lzr-ant::after, .lzr-heli, .lzr-core { animation:none !important; } }
  `;
  function injectCss() { if (document.getElementById("lzr2-css")) return; const s = document.createElement("style"); s.id = "lzr2-css"; s.textContent = CSS; document.head.appendChild(s); }

  registerMicrogame({
    id: "laser-rescue",
    name: TEXT.name,
    icon: TEXT.icon,
    howTo: TEXT.howTo,
    instruction: TEXT.instruction,
    contentTypes: ["letter", "phonics", "cvc", "hfw"],
    duration: 26000,
    input: "drag",
    tutorial: true,

    start(ctx) {
      injectCss();
      const { tone, sweep, noise } = ctx.sfx;
      let crab = null, flash = null, hero = null, beam = null, dmg = 0;
      const mood = (m, ms) => { hero.classList.remove("yay", "zapped"); void hero.offsetWidth; hero.classList.add(m); ctx.later(() => hero.classList.remove(m), ms); };
      const api = window.CarveOut.start(ctx, {
        cls: "lzr", tool: "✨", sound: "laser", text: TEXT,
        scene: (stage) => {
          crab = document.createElement("div");
          crab.className = "lzr-crab";
          crab.innerHTML = ["l1", "l2", "l3", "r1", "r2", "r3"].map((k) => `<div class="lzr-leg ${k}"></div>`).join("") +
            '<div class="lzr-arm l"></div><div class="lzr-arm r"></div><div class="lzr-claw l"></div><div class="lzr-claw r"></div><div class="lzr-stalk"></div><div class="lzr-ant"></div>' +
            '<div class="lzr-body"></div><div class="lzr-mouth"></div><div class="lzr-eye"><i></i></div>';
          const city = document.createElement("div"); city.className = "lzr-city";
          const heli = document.createElement("div"); heli.className = "lzr-heli"; heli.textContent = "🚁";
          flash = document.createElement("div"); flash.className = "lzr-flash";
          hero = document.createElement("div"); hero.className = "lzr-hero";
          hero.innerHTML = '<div class="lzr-hin"><div class="lzr-hleg l"></div><div class="lzr-hleg r"></div><div class="lzr-hbody"></div><div class="lzr-hant"></div><div class="lzr-hhead"></div>' +
            '<div class="lzr-heye l"><i></i></div><div class="lzr-heye r"><i></i></div><div class="lzr-hmouth"></div><div class="lzr-gun"></div></div>';
          beam = document.createElement("div"); beam.className = "lzr-beam";
          stage.append(crab, city, heli, hero, beam, flash);
          const size = () => stage.style.setProperty("--rz", `${Math.round(Math.max(48, Math.min(stage.clientHeight * 0.2, stage.clientWidth * 0.14, 92)))}px`);
          size(); new ResizeObserver(size).observe(stage);
        },
        // The weak points: on the claws and the belly.
        spots: (n, W, H) => (n <= 3 ? [{ x: W * 0.17, y: H * 0.27 }, { x: W * 0.83, y: H * 0.27 }, { x: W * 0.5, y: H * 0.6 }]
          : [{ x: W * 0.17, y: H * 0.27 }, { x: W * 0.83, y: H * 0.27 }, { x: W * 0.37, y: H * 0.6 }, { x: W * 0.63, y: H * 0.6 }]),
        piece: () => '<div class="lzr-ring"></div><div class="lzr-core"></div>',
        onRight: (p, api) => {
          noise(0.5, "lowpass", 1200, 200, 0.4); tone(80, 0.4, "sawtooth", 0.1);   // KABOOM
          api.pop("💥", p.x, p.y, 70, 0, 0, 600);
          for (let k = 0; k < 4; k++) api.pop(["⚡", "🔩", "💨", "⚙️"][k], p.x, p.y, 28, (k - 1.5) * 50, -60 - k * 10, 800);
          dmg++;
          crab.classList.remove("hit"); void crab.offsetWidth; crab.classList.add("hit");
          ctx.later(() => crab.classList.remove("hit"), 750);
          if (dmg >= 1) crab.classList.add("d1");
          if (dmg >= 2) { crab.classList.add("d2"); }
          ctx.later(() => api.pop("💨", api.W * 0.5, api.H * 0.2, 34, 20, -60, 1200), 300);
          mood("yay", 800);
        },
        onWrong: () => {
          tone(1800, 0.06, "square", 0.08); tone(1400, 0.08, "square", 0.06, 0.06);   // PING off the armour
          ctx.later(() => { flash.classList.remove("on"); void flash.offsetWidth; flash.classList.add("on"); sweep(1600, 300, 0.4, "sawtooth", 0.07); mood("zapped", 600); }, 250);   // it zaps back
        },
        onWin: (api) => {
          crab.classList.add("ko");
          hero.classList.remove("zapped"); hero.classList.add("yay");
          noise(1.2, "lowpass", 600, 100, 0.5); tone(60, 1, "sawtooth", 0.1);
          for (let k = 0; k < 10; k++) ctx.later(() => api.pop(["💥", "🔩", "⚙️", "🔧"][k % 4], api.W * (0.2 + Math.random() * 0.6), api.H * (0.3 + Math.random() * 0.4), 30 + Math.random() * 30, (Math.random() - 0.5) * 120, -80, 900), k * 90);
        },
      });
      // The beam: from the blaster's muzzle to the finger while it's down.
      const st = api.stage;
      let firing = false;
      function aim(e) {
        const sr = st.getBoundingClientRect(), g = hero.querySelector(".lzr-gun").getBoundingClientRect();
        const gx = g.right - sr.left - 4, gy = g.top - sr.top + 6, tx = e.clientX - sr.left, ty = e.clientY - sr.top;
        beam.style.left = `${gx}px`; beam.style.top = `${gy}px`;
        beam.style.width = `${Math.hypot(tx - gx, ty - gy)}px`;
        beam.style.transform = `rotate(${Math.atan2(ty - gy, tx - gx)}rad)`;
      }
      st.addEventListener("pointerdown", (e) => { if (ctx.ended) return; firing = true; beam.classList.add("on"); hero.classList.add("firing"); aim(e); });
      st.addEventListener("pointermove", (e) => { if (firing) aim(e); });
      const stop = () => { firing = false; beam.classList.remove("on"); hero.classList.remove("firing"); };
      st.addEventListener("pointerup", stop);
      st.addEventListener("pointercancel", stop);
      ctx.onEnd(stop);
      return () => api.cleanup();
    },
  });
})();
