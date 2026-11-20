// Shared core: the microgame registry, audio unlock + synth SFX, speech,
// storage and small helpers. Loaded before any game file.
// Classic script (no modules) so the app still runs from file://.
(function () {
  "use strict";

  // ---------- Microgame registry ----------
  const MICROGAMES = [];
  window.registerMicrogame = function (game) {
    if (!game || !game.id || typeof game.start !== "function") {
      console.error("registerMicrogame: needs at least { id, start }", game);
      return;
    }
    if (MICROGAMES.some((g) => g.id === game.id)) {
      console.error("registerMicrogame: duplicate id", game.id);
      return;
    }
    MICROGAMES.push(game);
  };

  // ---------- Helpers ----------
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // Do two words look alike? One letter different (cat/cot), the same letters
  // reordered (was/saw, on/no), or one inside the other (of/off, the/then).
  function looksAlike(a, b) {
    a = String(a).toLowerCase();
    b = String(b).toLowerCase();
    if (a === b || a.length < 2 || b.length < 2) return false;
    if (a.length === b.length) {
      let same = 0;
      for (let i = 0; i < a.length; i++) if (a[i] === b[i]) same++;
      if (same >= a.length - 1) return true;
      return [...a].sort().join("") === [...b].sort().join("");
    }
    return Math.abs(a.length - b.length) === 1 && (a.includes(b) || b.includes(a));
  }

  // The target plus n-1 distractors from the same pool, shuffled. Its hand-picked
  // `tricky` items come first, then look-alike words. At least one distractor is
  // random when there's room, so a round isn't only near-misses.
  function pickOptions(pool, target, n) {
    const byText = new Map(pool.map((it) => [it.text, it]));
    const tricky = shuffle((target.tricky || []).map((t) => byText.get(t)).filter((it) => it && it !== target));
    const near = shuffle(pool.filter((it) => it !== target && !tricky.includes(it) && looksAlike(it.text, target.text)));
    const rest = shuffle(pool.filter((it) => it !== target && !tricky.includes(it) && !near.includes(it)));
    const close = [...tricky, ...near].slice(0, n > 2 ? n - 2 : n - 1);
    const others = [...rest, ...tricky, ...near].filter((it) => !close.includes(it));
    return shuffle([target, ...close, ...others].slice(0, n));
  }

  // ---------- Phonics (first sounds) ----------
  // A picture "starts with" a letter when its word does: B → ball, bee. X → none (fox, box, six).
  const firstLetter = (word) => String(word || "").charAt(0).toUpperCase();
  function startPics(item) {
    const all = item.pics || (item.emoji ? [{ word: item.word, emoji: item.emoji }] : []);
    return all.filter((p) => p.emoji && firstLetter(p.word) === item.text.toUpperCase());
  }
  // For a target letter: up to nRight pictures that start with it, and nWrong pictures that
  // don't, one per other letter, from its `tricky` letters first (B → D, P, Q, V pictures).
  // Every picture is { word, emoji, letter } and no emoji appears twice.
  function phonicsSet(pool, target, nRight, nWrong) {
    const L = target.text.toUpperCase();
    const right = shuffle(startPics(target)).slice(0, nRight).map((p) => ({ ...p, letter: target.text }));
    const byText = new Map(pool.map((it) => [it.text, it]));
    const tricky = shuffle((target.tricky || []).map((t) => byText.get(t)).filter((it) => it && it !== target));
    const rest = shuffle(pool.filter((it) => it !== target && !tricky.includes(it)));
    const seen = new Set(right.map((p) => p.emoji));
    const wrong = [];
    for (const it of [...tricky, ...rest]) {
      if (wrong.length >= nWrong) break;
      const all = it.pics || (it.emoji ? [{ word: it.word, emoji: it.emoji }] : []);
      const p = shuffle(all.filter((q) => q.emoji && firstLetter(q.word) !== L && !seen.has(q.emoji)))[0];
      if (!p) continue;
      seen.add(p.emoji);
      wrong.push({ ...p, letter: it.text });
    }
    return { right, wrong };
  }

  // ---------- Lowercase look-alikes ----------
  // `tricky` is about capitals and sounds; these are lowercase shapes that look alike (a/o, b/d, m/n…),
  // for games that show lowercase letters.
  const LOWER_LOOKALIKE = {
    a: "oed", b: "dph", c: "oe", d: "bq", e: "cao", f: "t", g: "qy", h: "nb", i: "j", j: "i", k: "hx", l: "t", m: "nw",
    n: "mhu", o: "ac", p: "qb", q: "pg", r: "n", s: "z", t: "f", u: "nv", v: "wy", w: "vm", x: "k", y: "vg", z: "s",
  };
  // Letter items from the pool whose lowercase looks like the target's, shuffled. I and l are never paired.
  function lowerLookalikes(pool, target) {
    const shapes = (LOWER_LOOKALIKE[target.text.toLowerCase()] || "").split("");
    const notIL = (o) => [o.text, target.text].map((x) => x.toUpperCase()).sort().join("") !== "IL";
    return shuffle(pool.filter((o) => o !== target && shapes.includes(o.text.toLowerCase()) && notIL(o)));
  }

  // ---------- Audio ----------
  // The AudioContext can only be created/resumed inside a user tap (iOS), so
  // the frame calls unlock() from the mode buttons.
  let actx = null;
  function unlock() {
    try {
      if (!actx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) actx = new AC();
      }
      if (actx && actx.state === "suspended") actx.resume();
    } catch (err) {
      console.error("audio unlock:", err);
    }
  }

  function tone(freq, dur, type = "square", vol = 0.1, delay = 0) {
    if (!actx) return;
    try {
      const t = actx.currentTime + delay;
      const o = actx.createOscillator();
      const g = actx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g).connect(actx.destination);
      o.start(t);
      o.stop(t + dur + 0.02);
    } catch (err) {
      console.error("sfx tone:", err);
    }
  }

  function sweep(from, to, dur, type = "sine", vol = 0.2, delay = 0) {
    if (!actx) return;
    try {
      const t = actx.currentTime + delay;
      const o = actx.createOscillator();
      const g = actx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(from, t);
      o.frequency.exponentialRampToValueAtTime(to, t + dur);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g).connect(actx.destination);
      o.start(t);
      o.stop(t + dur + 0.02);
    } catch (err) {
      console.error("sfx sweep:", err);
    }
  }

  function noise(dur, filterType, from, to, vol, delay = 0) {
    if (!actx) return;
    try {
      const t = actx.currentTime + delay;
      const buf = actx.createBuffer(1, Math.ceil(actx.sampleRate * dur), actx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const src = actx.createBufferSource();
      src.buffer = buf;
      const f = actx.createBiquadFilter();
      f.type = filterType;
      f.frequency.setValueAtTime(from, t);
      f.frequency.exponentialRampToValueAtTime(to, t + dur);
      const g = actx.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      src.connect(f).connect(g).connect(actx.destination);
      src.start(t);
    } catch (err) {
      console.error("sfx noise:", err);
    }
  }

  const sfx = {
    tone, sweep, noise,
    happy() {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.2, "square", 0.1, i * 0.08));
      tone(1568, 0.3, "triangle", 0.12, 0.32);
    },
    buzz() { tone(110, 0.5, "sawtooth", 0.18); tone(117, 0.5, "sawtooth", 0.15); },
    tick() { tone(880, 0.05, "square", 0.05); },
    whoosh() { noise(0.25, "bandpass", 400, 3000, 0.25); },
    slam() { sweep(300, 80, 0.18, "square", 0.12); noise(0.12, "lowpass", 2000, 200, 0.3); },
    speedUp() { [392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.12, "square", 0.08, i * 0.06)); },
    star(i) { tone(880 + i * 220, 0.18, "triangle", 0.18); tone(1760 + i * 440, 0.12, "sine", 0.06, 0.05); },
    fanfare() {
      [[523, 0], [659, 0.12], [784, 0.24], [1047, 0.36], [784, 0.52], [1047, 0.64]]
        .forEach(([f, d]) => tone(f, 0.25, "square", 0.08, d));
    },
  };

  // ---------- Speech ----------
  const canSpeak = "speechSynthesis" in window;
  let voice = null;
  function pickVoice() {
    try {
      const voices = speechSynthesis.getVoices();
      voice = voices.find((v) => /^en[-_](US|GB)/i.test(v.lang) && v.localService)
           || voices.find((v) => /^en[-_](US|GB)/i.test(v.lang))
           || voices.find((v) => /^en/i.test(v.lang))
           || null;
    } catch (err) {
      console.error("speech voices:", err);
    }
  }
  if (canSpeak) {
    pickVoice();
    speechSynthesis.addEventListener?.("voiceschanged", pickVoice);
  }

  function say(text) {
    if (!canSpeak || !text) return;
    try {
      speechSynthesis.cancel();
      // Some voices (iOS especially) read a lone capital as "capital E", so send single
      // letters in lowercase. Not "A": a lone "a" is read as "uh" (letters spell it "Ay").
      const u = new SpeechSynthesisUtterance(String(text).replace(/\b[B-Z]\b/g, (c) => c.toLowerCase()));
      if (voice) u.voice = voice;
      u.lang = voice ? voice.lang : "en-US";
      u.rate = 0.9;
      u.pitch = 1.1;
      u.onerror = (e) => {
        if (e.error !== "interrupted" && e.error !== "canceled") console.error("speech:", e.error);
      };
      speechSynthesis.speak(u);
    } catch (err) {
      console.error("speech:", err);
    }
  }
  function isSpeaking() {
    if (!canSpeak) return false;
    try { return speechSynthesis.speaking || speechSynthesis.pending; } catch (err) { return false; }
  }

  function stopSpeech() {
    if (!canSpeak) return;
    try { speechSynthesis.cancel(); } catch (err) { console.error("speech cancel:", err); }
  }

  // ---------- Visual effects ----------
  const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const CONFETTI_COLORS = ["#ff2e88", "#1e6bff", "#ffd400", "#1fd65f", "#ff8a00", "#b04dff", "#00d4ff"];

  // Burst of confetti from (x, y), in px relative to `layer` (a positioned element, ideally
  // pointer-events:none). Pieces fly up, then fall past the layer's bottom.
  function confetti(layer, x, y, { count = 70 } = {}) {
    if (reduceMotion()) return;
    try {
      const box = layer.getBoundingClientRect();
      for (let i = 0; i < count; i++) {
        const c = document.createElement("div");
        c.style.cssText =
          `position:absolute;left:${x}px;top:${y}px;width:12px;height:18px;margin:-9px 0 0 -6px;` +
          `border:2px solid #111;border-radius:${Math.random() < 0.3 ? "50%" : "3px"};` +
          `background:${pick(CONFETTI_COLORS)};pointer-events:none;`;
        layer.appendChild(c);
        const dx = (Math.random() - 0.5) * box.width * 1.3;
        const up = -(80 + Math.random() * 160);
        const fall = box.height - y + 40 + Math.random() * box.height * 0.4;
        const spin = (Math.random() - 0.5) * 1440;
        c.animate(
          [{ transform: "translate(0,0) rotate(0) scale(.4)" },
           { transform: `translate(${dx * 0.6}px,${up}px) rotate(${spin * 0.4}deg) scale(1)`, offset: 0.3 },
           { transform: `translate(${dx}px,${fall}px) rotate(${spin}deg) scale(1)` }],
          { duration: 1100 + Math.random() * 500, easing: "cubic-bezier(.2,.6,.4,1)", fill: "forwards" });
      }
    } catch (err) {
      console.error("confetti:", err);
    }
  }

  // ---------- Storage (never throws: private mode / blocked storage just means no saving) ----------
  const storage = {
    get(key, fallback = null) {
      try {
        const v = localStorage.getItem(key);
        return v == null ? fallback : JSON.parse(v);
      } catch (err) {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (err) {
        console.error("storage:", err);
      }
    },
  };

  window.Core = {
    MICROGAMES,
    shuffle, pick, pickOptions,
    startPics, phonicsSet, lowerLookalikes,
    unlock, audioCtx: () => actx, sfx,
    canSpeak, say, stopSpeech, isSpeaking,
    confetti,
    storage,
  };
})();
