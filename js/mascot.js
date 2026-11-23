// THE MASCOT: "you" — a chunky orange monster with big mismatched googly eyes, a toothy grin and stubby
// arms and legs (the same one you play as in Dance Off, Penalty Kick and Maze Run; the teacher agreed it
// should be the game's character). Games and scenes draw it with Mascot.el(size) and set a mood with
// Mascot.mood(el, m): "cheer" (arms up, hopping), "pull" (leaning back, arms out: Tug of War), "eat"
// (chomping), "sad" (frown and tears), or null. Add "muddy" as a class for mud splotches.
(function () {
  const CSS = `
  .ms { position:relative; width:var(--mz); height:var(--mz); flex:none; }
  .ms * { box-sizing:border-box; }
  .ms-in { position:absolute; inset:0; transform-origin:50% 100%; animation:ms-bob .9s ease-in-out infinite alternate; }
  .ms-leg { position:absolute; bottom:0; width:13%; height:22%; background:#ff8a1f; border:calc(var(--mz) * .03) solid #111; border-radius:99px 99px 40% 40%; }
  .ms-leg.l { left:31%; } .ms-leg.r { right:31%; }
  .ms-arm { position:absolute; top:46%; width:30%; height:12%; background:#ff8a1f; border:calc(var(--mz) * .03) solid #111; border-radius:99px; z-index:1; transition:transform .15s; }
  .ms-arm.l { left:0; transform-origin:100% 50%; transform:rotate(-25deg); } .ms-arm.r { right:0; transform-origin:0 50%; transform:rotate(25deg); }
  .ms-body { position:absolute; left:18%; right:18%; top:8%; bottom:16%; background:#ff8a1f; border:calc(var(--mz) * .035) solid #111; border-radius:46% 46% 40% 40%; z-index:2;
    box-shadow:inset calc(var(--mz) * -.05) calc(var(--mz) * -.04) 0 rgba(0,0,0,.12); }
  .ms-eye { position:absolute; top:16%; width:34%; aspect-ratio:1; background:#fff; border:calc(var(--mz) * .025) solid #111; border-radius:50%; overflow:hidden; z-index:3; }
  .ms-eye.l { left:10%; } .ms-eye.r { right:8%; width:28%; top:20%; }
  .ms-eye i { position:absolute; left:28%; top:30%; width:46%; aspect-ratio:1; background:#111; border-radius:50%; animation:ms-roll 1.3s ease-in-out infinite alternate; }
  .ms-eye.r i { animation-delay:-.6s; }
  .ms-mouth { position:absolute; left:22%; right:22%; top:58%; height:24%; background:#5a0f1e; border:calc(var(--mz) * .022) solid #111; border-radius:10% 10% 50% 50% / 14% 14% 86% 86%;
    overflow:hidden; z-index:3; }
  .ms-mouth::before { content:""; position:absolute; left:6%; right:6%; top:0; height:30%; background:repeating-linear-gradient(90deg, #fff 0 22%, #ddd 22% 25%); }
  .ms-mouth::after { content:""; position:absolute; left:28%; width:44%; bottom:-14%; height:48%; border-radius:50%; background:#ff6f91; }
  .ms-tear { position:absolute; top:44%; width:7%; height:0; background:#5ec8ff; border-radius:0 0 99px 99px; z-index:4; opacity:0; }
  .ms-tear.l { left:22%; } .ms-tear.r { right:22%; }
  .ms-mud { position:absolute; inset:0; z-index:5; pointer-events:none; opacity:0;
    background:radial-gradient(circle at 30% 30%, #6b4320 0 9%, transparent 10%), radial-gradient(circle at 70% 55%, #6b4320 0 12%, transparent 13%),
      radial-gradient(circle at 45% 80%, #6b4320 0 10%, transparent 11%), radial-gradient(circle at 20% 65%, #6b4320 0 7%, transparent 8%); }
  .ms.muddy .ms-mud { opacity:.9; }
  /* moods */
  .ms.cheer .ms-in { animation:ms-hop .35s cubic-bezier(.2,1.6,.4,1) infinite alternate; }
  .ms.cheer .ms-arm.l { transform:rotate(55deg); } .ms.cheer .ms-arm.r { transform:rotate(-55deg); }
  .ms.pull .ms-in { animation:none; transform:rotate(-14deg) translateX(-6%); }
  .ms.pull .ms-arm.l, .ms.pull .ms-arm.r { transform:rotate(0deg); }
  .ms.pull.heave .ms-in { transform:rotate(-24deg) translateX(-10%); transition:transform .12s; }
  .ms.eat .ms-mouth { animation:ms-chomp .22s ease-in-out infinite alternate; }
  .ms.eat .ms-in { animation:ms-hop .45s ease-in-out infinite alternate; }
  .ms.sad .ms-mouth { top:66%; height:12%; border-radius:50% 50% 12% 12% / 86% 86% 14% 14%; }
  .ms.sad .ms-mouth::before, .ms.sad .ms-mouth::after { display:none; }
  .ms.sad .ms-eye i { top:52%; }
  .ms.sad .ms-tear { opacity:1; animation:ms-tear .5s linear infinite; }
  .ms.sad .ms-tear.r { animation-delay:.25s; }
  @keyframes ms-bob { to { transform:translateY(-4%) scale(1.02, .98); } }
  @keyframes ms-hop { to { transform:translateY(-14%); } }
  @keyframes ms-roll { 0% { transform:translate(-30%, -20%); } 100% { transform:translate(30%, 20%); } }
  @keyframes ms-chomp { from { transform:scaleY(1); } to { transform:scaleY(.35); } }
  @keyframes ms-tear { 0% { height:0; opacity:1; } 80% { height:40%; opacity:1; } 100% { height:44%; opacity:0; } }
  @media (prefers-reduced-motion: reduce) { .ms-in, .ms-eye i, .ms.cheer .ms-in, .ms.eat .ms-mouth, .ms.eat .ms-in, .ms.sad .ms-tear { animation:none !important; } }
  `;
  let cssDone = false;
  function injectCss() {
    if (cssDone) return;
    cssDone = true;
    const s = document.createElement("style");
    s.textContent = CSS;
    document.head.appendChild(s);
  }
  // `size`: px (a number) or any CSS length.
  function el(size) {
    injectCss();
    const d = document.createElement("div");
    d.className = "ms";
    d.style.setProperty("--mz", typeof size === "number" ? `${Math.round(size)}px` : size);
    d.innerHTML = '<div class="ms-in"><div class="ms-leg l"></div><div class="ms-leg r"></div><div class="ms-arm l"></div><div class="ms-arm r"></div>' +
      '<div class="ms-body"><div class="ms-eye l"><i></i></div><div class="ms-eye r"><i></i></div><div class="ms-mouth"></div>' +
      '<div class="ms-tear l"></div><div class="ms-tear r"></div></div><div class="ms-mud"></div></div>';
    d.setAttribute("aria-hidden", "true");
    return d;
  }
  function mood(d, m) {
    d.classList.remove("cheer", "pull", "eat", "sad", "heave");
    if (m) d.classList.add(m);
  }
  window.Mascot = { el, mood, injectCss };
})();
