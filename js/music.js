// Chiptune background music, made in code with Web Audio (no audio files): a hand-written menu theme,
// and a loop for every game, generated from a style that suits it (sporty, sneaky, spooky, pirate,
// chill, march, bouncy) plus its own key, tempo and melody worked out from its id. So every game sounds
// different, and the same game always sounds the same.
//
// It's kept quiet (the listening games need the voice to be heard): its own volume and mute (Settings,
// saved in localStorage), and it ducks to a quarter while the voice is speaking.
//
// Music.play("menu" | gameId | null), Music.setVolume(0..1), Music.setMuted(bool), Music.volume, Music.muted.
(function () {
  "use strict";
  const C = window.Core;
  const VOL_KEY = "wwe.music.vol", MUTE_KEY = "wwe.music.muted";
  const MAX_GAIN = 0.16;          // the loudest the music can be (volume 100%), far under the sound effects
  const DUCK = 0.25;              // while the voice speaks
  const LOOKAHEAD = 0.15;         // seconds of notes scheduled ahead

  let volume = Number(C.storage.get(VOL_KEY, 0.4));
  if (!(volume >= 0 && volume <= 1)) volume = 0.4;
  let muted = C.storage.get(MUTE_KEY, false) === true;

  // ---------- Small helpers ----------
  const midiHz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  function hash(s) { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { // mulberry32
    let a = seed >>> 0;
    return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const SCALES = {
    major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10],
    majPent: [0, 2, 4, 7, 9], minPent: [0, 3, 5, 7, 10], mixo: [0, 2, 4, 5, 7, 9, 10],
  };
  // A pattern string per bar of 16 steps: x = hit, . = rest.
  const pat = (s) => s.replace(/\s/g, "").split("").map((c) => c !== ".");

  // ---------- Styles ----------
  // prog: scale degrees (0-based) of each bar's chord. lead: which 16th steps play a melody note
  // (per bar, cycled). bass: steps the bass plays (root, with the 5th on "f"). drums: kick/snare/hat.
  const STYLES = {
    bouncy: { bpm: 132, scale: "major", prog: [0, 4, 5, 3], lead: ["x.x.x..xx.x.x...", "x.x.x.x.x..xx..."], bass: "x...x.f.x...x.f.",
      kick: "x.......x.......", snare: "....x.......x...", hat: "..x...x...x...x.", leadWave: "square", arp: true },
    sporty: { bpm: 150, scale: "mixo", prog: [0, 3, 4, 3], lead: ["x.xxx.x.x.xxx...", "xx..x.x.xx..x.x."], bass: "x.x.x.x.x.x.x.x.",
      kick: "x...x...x...x...", snare: "....x.......x.x.", hat: "x.x.x.x.x.x.x.x.", leadWave: "square", arp: false },
    sneaky: { bpm: 118, scale: "minPent", prog: [0, 5, 6, 0], lead: ["x..x..x...x..x..", "x.x...x..x.x...."], bass: "x..x..x.x..x..x.",
      kick: "x.....x...x.....", snare: "....x.......x...", hat: ".x.x.x.x.x.x.x.x", leadWave: "square", arp: false, stacc: true },
    spooky: { bpm: 96, scale: "minor", prog: [0, 3, 4, 0], lead: ["x.....x...x.....", "x...x.....x..x.."], bass: "x.......x.......",
      kick: "x.......x.......", snare: "............x...", hat: "..x...x...x...x.", leadWave: "triangle", arp: true },
    pirate: { bpm: 140, scale: "minor", prog: [0, 6, 5, 6], lead: ["x..x..x.x..x..x.", "x..x..xxx..x...."], bass: "x..x..x.x..x..x.",
      kick: "x.....x.x.....x.", snare: "...x.....x....x.", hat: "x.xx.xx.xx.xx.x.", leadWave: "square", arp: false },
    chill: { bpm: 108, scale: "majPent", prog: [0, 2, 3, 4], lead: ["x...x.x...x.....", "x.x...x...x.x..."], bass: "x.......x...x...",
      kick: "x.......x.......", snare: "....x.......x...", hat: "..x...x...x...x.", leadWave: "triangle", arp: true },
    march: { bpm: 126, scale: "major", prog: [0, 3, 0, 4], lead: ["x...x...x.x.x...", "x.x.x...x...x..."], bass: "x...f...x...f...",
      kick: "x...x...x...x...", snare: "..x...x...x...x.", hat: "x.x.x.x.x.x.x.x.", leadWave: "square", arp: false },
  };
  const GAME_STYLE = {
    "balloon-pop": "bouncy", "wire-cut": "sneaky", "feed-me": "bouncy", "train-builder": "march", "trace-monster": "spooky",
    "whack-a-mole": "sporty", "find-my-baby": "chill", "shuriken-toss": "sneaky", "claw-catch": "bouncy", "fishing": "chill",
    "egg-shuffle": "sneaky", "clean-room": "chill", "samurai-slice": "sneaky", "ghost-hunt": "spooky", "puzzle-reveal": "chill",
    "stop-sneeze": "bouncy", "spot-imposter": "sneaky", "window-wiper": "chill", "sack-man": "spooky", "pachinko": "bouncy",
    "mouse-trap": "sneaky", "froggy-hop": "bouncy", "monkey-swing": "pirate", "snowman": "chill", "track-switch": "march",
    "bunny-burrow": "bouncy", "pizza-chef": "march", "treasure-dig": "pirate", "hoop-shot": "sporty", "penalty-kick": "sporty",
    "monster-boxing": "sporty", "archery": "march", "monster-golf": "chill", "strength-test": "sporty", "maze-run": "sneaky", "dance-off": "bouncy", "shield-breaker": "march", "bongo-bash": "bouncy",
    "boss-banana": "pirate", "boss-baby": "spooky", "boss-robot": "march", "boss-gorilla": "sporty", "boss-kitty": "bouncy", "yarn-chase": "sneaky", "tickle-tummy": "bouncy", "fossil-dig": "chill", "robot-repair": "march", "burger-stack": "bouncy", "rocket-fix": "march", "bridge-builder": "chill", "cookie-cutter": "bouncy", "chicken-banana": "bouncy", "six-seven-seesaw": "bouncy", "tug-of-war": "sporty", "lake-leap": "chill", "baseball-bash": "sporty", "chicken-choir": "bouncy", "polly-crackers": "pirate",
    "smelly-socks": "bouncy", "bubblegum-blow": "chill", "conga-line": "bouncy", "doorbell-dash": "march", "belly-flop": "sporty", "dangerous-dentist": "spooky",
    "scratch-sniff": "chill", "shopping-sweep": "sneaky", "spider-swing": "sneaky", "spaghetti-slurp": "bouncy", "plug-it-in": "march", "flying-kites": "chill", "post-office": "march", "lunch-lady": "bouncy", "recycling-robot": "march",
  };

  // ---------- The menu theme (hand-written) ----------
  // 8th notes per bar ("-" holds the last note, "." rests), C major, I–vi–IV–V.
  const MENU = {
    bpm: 126,
    lead: ["E5 G5 C6 - B5 G5 A5 G5", "E5 - C5 E5 A5 - G5 E5", "F5 A5 C6 A5 G5 - E5 C5", "D5 E5 F5 G5 B5 - G5 ."],
    bass: [36, 45, 41, 43], // C, A, F, G
    style: "bouncy",
  };
  const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const noteMidi = (n) => { const m = /^([A-G])(#?)(\d)$/.exec(n); return m ? 12 * (Number(m[3]) + 1) + NOTE[m[1]] + (m[2] ? 1 : 0) : null; };

  // A song: { stepDur, length (steps), events: per step [{ ch, midi, len (steps) }] }.
  function buildMenu() {
    const st = STYLES[MENU.style], steps = 64, ev = [...Array(steps)].map(() => []);
    MENU.lead.forEach((bar, b) => {
      const toks = bar.split(/\s+/);
      toks.forEach((t, i) => {
        if (t === "-" || t === ".") return;
        let len = 2; for (let j = i + 1; j < toks.length && toks[j] === "-"; j++) len += 2;
        ev[b * 16 + i * 2].push({ ch: "lead", midi: noteMidi(t), len });
      });
      for (let s = 0; s < 16; s++) {
        const root = MENU.bass[b];
        if (pat(st.bass)[s]) ev[b * 16 + s].push({ ch: "bass", midi: st.bass[s] === "f" ? root + 7 : root, len: 1 });
        if (s % 2 === 0) ev[b * 16 + s].push({ ch: "arp", midi: root + 24 + [0, 4, 7, 12][(s / 2) % 4] + (b === 1 ? -1 : 0), len: 1 });
      }
    });
    drums(st, ev);
    return { stepDur: 60 / MENU.bpm / 4, length: steps, events: ev, wave: st.leadWave };
  }

  // A game's loop: its style, plus a key, tempo and melody from its id.
  function buildGame(id) {
    const r = rng(hash(id));
    const st = STYLES[GAME_STYLE[id]] || STYLES[Object.keys(STYLES)[hash(id) % Object.keys(STYLES).length]];
    const scale = SCALES[st.scale];
    const root = [57, 58, 60, 62, 63, 65][Math.floor(r() * 6)];       // A3..F4
    const bpm = st.bpm + Math.round((r() - 0.5) * 12);
    const steps = 64, ev = [...Array(steps)].map(() => []);
    const deg = (d) => { const o = Math.floor(d / scale.length); return root + 12 * o + scale[((d % scale.length) + scale.length) % scale.length]; };
    // Melody: a random walk over the scale that leans on each bar's chord tones, ending on the root.
    let cur = 7 + Math.floor(r() * 3);
    for (let b = 0; b < 4; b++) {
      const chord = st.prog[b], rhythm = pat(st.lead[(b + Math.floor(r() * 2)) % st.lead.length]);
      for (let s = 0; s < 16; s++) {
        if (!rhythm[s]) continue;
        const strong = s % 4 === 0;
        if (strong && r() < 0.6) {
          const tones = [chord, chord + 2, chord + 4].map((d) => d + 7);
          cur = tones.reduce((a, t) => (Math.abs(t - cur) < Math.abs(a - cur) ? t : a), tones[0]);
        } else cur += [-2, -1, -1, 1, 1, 2, 0][Math.floor(r() * 7)];
        cur = Math.max(4, Math.min(13, cur));
        let len = 1; while (s + len < 16 && !rhythm[s + len] && len < 4) len++;
        if (st.stacc) len = 1;
        const last = b === 3 && s >= 12;
        ev[b * 16 + s].push({ ch: "lead", midi: deg(last ? 7 : cur), len });
      }
      for (let s = 0; s < 16; s++) {
        const p = st.bass[s];
        if (p !== ".") ev[b * 16 + s].push({ ch: "bass", midi: deg(chord) - 24 + (p === "f" ? 7 : 0), len: 1 });
        if (st.arp && s % 2 === 0) ev[b * 16 + s].push({ ch: "arp", midi: deg(chord + [0, 2, 4, 7][(s / 2) % 4]) + 12, len: 1 });
      }
    }
    drums(st, ev);
    return { stepDur: 60 / bpm / 4, length: steps, events: ev, wave: st.leadWave };
  }
  function drums(st, ev) {
    const k = pat(st.kick), sn = pat(st.snare), h = pat(st.hat);
    for (let s = 0; s < ev.length; s++) {
      const i = s % 16;
      if (k[i]) ev[s].push({ ch: "kick" });
      if (sn[i]) ev[s].push({ ch: "snare" });
      if (h[i]) ev[s].push({ ch: "hat" });
    }
  }

  // ---------- Playing ----------
  let ac = null, out = null, noiseBuf = null;
  let song = null, current = null, wanted = null, step = 0, nextTime = 0;
  function ensure() {
    const a = C.audioCtx && C.audioCtx();
    if (!a) return null;
    if (a !== ac) {
      ac = a;
      out = ac.createGain();
      out.gain.value = 0;
      out.connect(ac.destination);
      noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.3, ac.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    return ac;
  }
  function tone(type, midi, t, dur, gain, dst = out) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type;
    o.frequency.value = midiHz(midi);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.006);
    g.gain.setValueAtTime(gain * 0.8, t + Math.max(0.01, dur * 0.6));
    g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(g); g.connect(dst);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(t, dur, filterType, freq, gain, dst = out) {
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf; f.type = filterType; f.frequency.value = freq;
    g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(dst);
    s.start(t); s.stop(t + dur + 0.02);
  }
  function kick(t, dst = out) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    o.connect(g); g.connect(dst);
    o.start(t); o.stop(t + 0.16);
  }
  function playStep(evs, t, sd, wave) {
    for (const e of evs) {
      if (e.ch === "lead") tone(wave, e.midi, t, e.len * sd * 0.92, 0.32);
      else if (e.ch === "bass") tone("triangle", e.midi, t, sd * 0.9, 0.55);
      else if (e.ch === "arp") tone("square", e.midi, t, sd * 0.5, 0.08);
      else if (e.ch === "kick") kick(t);
      else if (e.ch === "snare") noise(t, 0.12, "bandpass", 1800, 0.35);
      else if (e.ch === "hat") noise(t, 0.035, "highpass", 7000, 0.18);
    }
  }
  function startWanted() {
    if (!wanted || !ensure()) return;
    current = wanted;
    song = wanted === "menu" ? buildMenu() : buildGame(wanted);
    step = 0;
    nextTime = ac.currentTime + 0.06;
  }
  function tick() {
    if (!song && wanted) startWanted();
    if (!ac || !out) return;
    const level = muted || document.hidden || !song ? 0 : MAX_GAIN * volume * (C.isSpeaking && C.isSpeaking() ? DUCK : 1);
    out.gain.setTargetAtTime(level, ac.currentTime, 0.08);
    if (!song || document.hidden || ac.state !== "running") return;
    if (nextTime < ac.currentTime - 0.5) nextTime = ac.currentTime + 0.05; // after a pause, don't rush to catch up
    while (nextTime < ac.currentTime + LOOKAHEAD) {
      playStep(song.events[step], nextTime, song.stepDur, song.wave);
      nextTime += song.stepDur;
      step = (step + 1) % song.length;
    }
  }
  setInterval(tick, 30);

  // ---------- The "get ready" jingle between rounds (Fun and Challenge) ----------
  // About a second of snappy chiptune at 168 bpm, on its own output (so the loop's ducking doesn't touch
  // it). Three patterns and three keys take turns, so it stays fresh. It follows the music volume, and
  // still plays quietly with the music off, because it's the signal to get ready.
  // Steps are 16ths: [step, semitones above the key's C, length in steps]; drums: [step, "k"|"s"|"c"].
  const JINGLES = [
    { lead: [[0, 0, 1], [1, 4, 1], [2, 7, 1], [3, 12, 1], [5, 7, 1], [6, 12, 4]], drums: [[0, "k"], [2, "s"], [3, "k"], [5, "s"], [6, "c"]] }, // up to a ding
    { lead: [[0, 7, 1], [1, 7, 1], [2, 7, 1], [3, 12, 5]], drums: [[0, "k"], [1, "k"], [2, "k"], [3, "c"]] },                                // ta-ta-ta-TAA
    { lead: [[0, 0, 1], [1, 2, 1], [2, 4, 1], [3, 5, 1], [4, 7, 1], [5, 9, 1], [6, 11, 1], [7, 12, 4]], drums: [[0, "k"], [4, "s"], [7, "c"]] }, // a quick run up
  ];
  function jingle(n = 0) {
    if (!ensure() || ac.state !== "running") return;
    const j = JINGLES[n % JINGLES.length], key = 72 + [0, 2, 5][Math.floor(n / JINGLES.length) % 3];
    const sd = 60 / 168 / 4, t0 = ac.currentTime + 0.03;
    const bus = ac.createGain();
    bus.gain.value = MAX_GAIN * 1.6 * (muted ? 0.3 : Math.max(0.3, volume));
    bus.connect(ac.destination);
    for (const [s, semi, len] of j.lead) {
      tone("square", key + semi, t0 + s * sd, len * sd * 0.95, 0.34, bus);
      tone("square", key + semi - 12, t0 + s * sd, len * sd * 0.95, 0.12, bus); // an octave below, for weight
    }
    for (const [s, d] of j.drums) {
      const t = t0 + s * sd;
      if (d === "k") kick(t, bus);
      else if (d === "s") noise(t, 0.12, "bandpass", 1800, 0.4, bus);
      else noise(t, 0.5, "highpass", 5000, 0.3, bus); // crash
    }
  }

  window.Music = {
    // "menu", a game id, or null (silence). The same song keeps playing without restarting.
    play(id) {
      wanted = id || null;
      if (wanted === current) return;
      song = null; current = null;
      if (wanted) startWanted();
    },
    // The quick "get ready" jingle between rounds (n: the round number, to vary it).
    jingle,
    setVolume(v) { volume = Math.max(0, Math.min(1, v)); C.storage.set(VOL_KEY, volume); },
    setMuted(m) { muted = !!m; C.storage.set(MUTE_KEY, muted); },
    get volume() { return volume; },
    get muted() { return muted; },
  };
})();
