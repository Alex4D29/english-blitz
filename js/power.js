// THE POWER BAR — a shared mechanic for games where you shoot or swing with a chosen strength
// (Archery, Monster Golf, Test Your Strength). Games use it through ctx.powerBar(opts).
//
// A vertical gauge with three coloured bands, bottom to top: green (short), yellow (medium), red
// (strong). Games colour their targets the same way (near = green, middle = yellow, far = red), so
// children can see which power reaches which target. A needle rises and falls (it ping-pongs, slowly
// enough for 5-year-olds) while you charge. Two ways to play, both anywhere on the `press` element:
//   hold:  press and hold to charge, let go to shoot (a press longer than HOLD_MS);
//   tap:   tap once to start charging, tap again to shoot.
// Releasing calls onRelease(zone, level): zone 0 .. zones-1 (the band the needle is in), level 0..1.
// opts.zones: how many bands (3, 4 or 5: PowerBar.zoneCount(speed)); PowerBar.colors(n) gives their colours.
//
// PowerBar.create({ parent, press, raf, later, sfx, speed, onRelease, onStart }) → bar
//   bar.el, bar.level, bar.charging, bar.locked, bar.reset() (ready for another shot), bar.lock()
(function () {
  "use strict";
  const HOLD_MS = 260;            // a press longer than this is "hold" (let go to shoot); shorter is a tap
  // Bands, weakest first. 3 at normal speed; the teacher wanted more at Practice MEDIUM (4, from 1.75×) and
  // HARD (5, from 2.5×) to make the timing harder (zoneCount). Games colour their targets the same way.
  const PALETTES = {
    3: ["#2fd15b", "#ffd400", "#ff4d6d"],
    4: ["#2fd15b", "#ffd400", "#ff8a1f", "#ff4d6d"],
    5: ["#4d9dff", "#2fd15b", "#ffd400", "#ff8a1f", "#ff4d6d"],
  };
  const zoneCount = (speed) => ((speed || 1) >= 2.5 ? 5 : (speed || 1) >= 1.75 ? 4 : 3);
  const colors = (n) => PALETTES[n] || PALETTES[3];
  const ZONES = [
    { color: "#2fd15b", name: "short" },
    { color: "#ffd400", name: "medium" },
    { color: "#ff4d6d", name: "strong" },
  ];
  const CSS = `
  .pwb { position:absolute; z-index:7; width:58px; display:flex; flex-direction:column; align-items:center; gap:6px; pointer-events:none; }
  .pwb-tube { position:relative; width:42px; height:100%; flex:1; min-height:120px; border:5px solid #111; border-radius:16px; overflow:hidden; background:#fff;
    box-shadow:0 5px 0 #111; display:flex; flex-direction:column-reverse; }
  .pwb-band { flex:1; border-top:3px solid rgba(0,0,0,.35); opacity:.55; transition:opacity .15s; }
  .pwb-band:first-child { border-top:0; }
  .pwb-band.on { opacity:1; }
  .pwb-needle { position:absolute; left:-4px; right:-4px; bottom:0; height:0; border-top:6px solid #111; }
  .pwb-needle::after { content:""; position:absolute; right:-14px; top:-12px; border:9px solid transparent; border-right:12px solid #111; }
  .pwb-btn { width:58px; height:58px; border-radius:50%; background:#ff8a1f; border:5px solid #111; box-shadow:0 4px 0 #111; display:flex; align-items:center;
    justify-content:center; font-size:1.6rem; line-height:1; animation:pwb-pulse 1s ease-in-out infinite; }
  .pwb.charging .pwb-btn { animation:none; transform:scale(.9); background:#ffd400; }
  .pwb.locked .pwb-btn { animation:none; opacity:.5; }
  @keyframes pwb-pulse { 50% { transform:scale(1.08); } }
  @media (prefers-reduced-motion: reduce) { .pwb-btn { animation:none; } }`;

  function injectCss() {
    if (document.getElementById("pwb-css")) return;
    const s = document.createElement("style");
    s.id = "pwb-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function create(o) {
    injectCss();
    const el = document.createElement("div");
    el.className = "pwb";
    el.setAttribute("aria-hidden", "true");
    const N = o.zones || 3; // how many bands (zoneCount(speed) in the games)
    el.innerHTML = '<div class="pwb-tube">' + colors(N).map((c) => `<div class="pwb-band" style="background:${c}"></div>`).join("") +
      '<div class="pwb-needle"></div></div><div class="pwb-btn">' + (o.icon || "💪") + "</div>";
    o.parent.appendChild(el);
    const bands = [...el.querySelectorAll(".pwb-band")], needle = el.querySelector(".pwb-needle");
    // One full rise-and-fall takes this long: slow at 1×, a little quicker at higher speeds.
    const period = 2600 / (0.8 + 0.2 * (o.speed || 1));
    const bar = { el, level: 0, charging: false, locked: false, zone: 0 };
    let t0 = 0, downAt = 0, mode = null, lastBeep = 0;

    const zoneOf = (lv) => Math.min(N - 1, Math.floor(lv * N));
    function show() {
      needle.style.bottom = `${(bar.level * 100).toFixed(1)}%`;
      bar.zone = zoneOf(bar.level);
      bands.forEach((b, i) => b.classList.toggle("on", bar.charging && i === bar.zone));
    }
    function step(now) {
      if (!bar.charging) return;
      const ph = ((now - t0) % period) / period;            // 0..1
      bar.level = ph < 0.5 ? ph * 2 : 2 - ph * 2;           // up, then down
      show();
      if (o.sfx && now - lastBeep > 90) { lastBeep = now; o.sfx.tone(260 + bar.level * 700, 0.04, "square", 0.04); } // the rising whine
      o.raf(step);
    }
    function start() {
      bar.charging = true; mode = null;
      t0 = performance.now(); downAt = t0;
      el.classList.add("charging");
      if (o.onStart) o.onStart();
      o.raf(step);
    }
    function release() {
      if (!bar.charging) return;
      bar.charging = false; bar.locked = true;
      el.classList.remove("charging");
      el.classList.add("locked");
      show();
      bands[zoneOf(bar.level)].classList.add("on");
      if (o.onRelease) o.onRelease(zoneOf(bar.level), bar.level);
    }
    o.press.addEventListener("pointerdown", (e) => {
      if (bar.locked || (o.ended && o.ended())) return;
      e.preventDefault();
      if (!bar.charging) start();
      else if (mode === "tap") release();                    // the second tap shoots
    });
    const up = () => {
      if (!bar.charging || mode) return;
      if (performance.now() - downAt > HOLD_MS) release();   // held, then let go: shoot
      else mode = "tap";                                     // a quick tap: keep charging until the next tap
    };
    o.press.addEventListener("pointerup", up);
    o.press.addEventListener("pointercancel", up);

    bar.reset = () => { bar.charging = false; bar.locked = false; bar.level = 0; mode = null; el.classList.remove("locked", "charging"); bands.forEach((b) => b.classList.remove("on")); show(); };
    bar.lock = () => { bar.charging = false; bar.locked = true; el.classList.add("locked"); };
    bar.zoneCenter = (z) => (z + 0.5) / N;
    bar.zones = N;
    show();
    return bar;
  }

  window.PowerBar = { create, ZONES, zoneCount, colors };
})();
