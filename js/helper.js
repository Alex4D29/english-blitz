// DRAW HINTS — a little "this is how you play" animation at the start of the drawing games (the teacher: the 5-year-olds
// didn't get that you draw). A finger circles a dashed ring (the Carve It Out cutting games) or zig-zags along a dashed
// line (the tracing games) for a few seconds, then fades. It never takes touches, so it can't get in the way.
//   DrawHint.circle(ctx, parent, x, y, size?)   a ring centred on x, y (px inside `parent`, a positioned box)
//   DrawHint.zigzag(ctx, parent)                a zig-zag across the bottom of `parent`
(function () {
  const CSS = `
  .dh { position:absolute; z-index:30; pointer-events:none; transition:opacity .4s; }
  .dh.out { opacity:0; }
  .dh-ring { border:4px dashed #111; border-radius:50%; background:rgba(255,255,255,.85); box-sizing:border-box; }
  .dh-ring i { position:absolute; inset:-4px; animation:dh-spin 1.2s linear infinite; }
  .dh-ring b, .dh-zz b { position:absolute; font-style:normal; font-size:1.8rem; line-height:1; }
  .dh-ring b { left:50%; top:0; transform:translate(-30%, -10%) rotate(-20deg); }
  .dh-zz { left:18%; right:18%; bottom:2%; height:15%; min-height:56px; border-radius:16px; background:rgba(255,255,255,.7); }
  .dh-zz svg { position:absolute; inset:0; width:100%; height:100%; }
  .dh-zz b { left:0; top:0; transform:translate(-30%, -10%) rotate(-20deg); }
  @keyframes dh-spin { to { transform:rotate(360deg); } }
  @media (prefers-reduced-motion: reduce) { .dh-ring i { animation:none !important; } }
  `;
  function css() { if (document.getElementById("dh-css")) return; const s = document.createElement("style"); s.id = "dh-css"; s.textContent = CSS; document.head.appendChild(s); }
  function life(ctx, el, ms) { ctx.later(() => el.classList.add("out"), ms); ctx.later(() => el.remove(), ms + 500); }

  function circle(ctx, parent, x, y, size = 56) {
    if (ctx.demo) return null; // (the tutorial's ghost finger does the showing)
    css();
    const el = document.createElement("div");
    el.className = "dh dh-ring"; el.setAttribute("aria-hidden", "true");
    el.style.cssText = `width:${size}px; height:${size}px; left:${x - size / 2}px; top:${y - size / 2}px;`;
    el.innerHTML = "<i><b>👆</b></i>";
    parent.appendChild(el);
    life(ctx, el, 3600);
    return el;
  }

  function zigzag(ctx, parent) {
    if (ctx.demo) return null;
    css();
    const el = document.createElement("div");
    el.className = "dh dh-zz"; el.setAttribute("aria-hidden", "true");
    const pts = [[8, 80], [24, 20], [40, 80], [56, 20], [72, 80], [88, 20], [96, 50]];
    el.innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points="${pts.map((p) => p.join(",")).join(" ")}" fill="none" stroke="#111" stroke-width="3" stroke-dasharray="6 5" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg><b>👆</b>`;
    parent.appendChild(el);
    const f = el.querySelector("b");
    if (f.animate && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // (the finger's offsets are fractions of the box, so it follows the line at any size)
      requestAnimationFrame(() => {
        const w = el.clientWidth, h = el.clientHeight;
        f.animate(pts.map((p, k) => ({ left: `${p[0] / 100 * w}px`, top: `${p[1] / 100 * h}px`, offset: k / (pts.length - 1) })), { duration: 1300, iterations: 3, easing: "linear" });
      });
    }
    life(ctx, el, 4000);
    return el;
  }

  window.DrawHint = { circle, zigzag };
})();
