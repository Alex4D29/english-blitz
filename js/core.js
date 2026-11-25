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
  // Words that SOUND the same: never one as the target with the other among the answers (the listening games
  // would have two right answers). The teacher asked for "two"/"to" and "four"/"for"; the rest are here so
  // more can be added to the lists safely.
  const SOUND_ALIKE = [["to", "two", "too"], ["for", "four"], ["no", "know"], ["there", "their"], ["one", "won"], ["eight", "ate"],
    ["by", "buy", "bye"], ["see", "sea"], ["here", "hear"], ["red", "read"], ["right", "write"], ["our", "hour"], ["new", "knew"], ["be", "bee"]];
  const soundMap = new Map();
  SOUND_ALIKE.forEach((g) => g.forEach((w) => soundMap.set(w, g)));
  const soundsLike = (a, b) => a !== b && !!soundMap.get(String(a).toLowerCase()) && soundMap.get(String(a).toLowerCase()).includes(String(b).toLowerCase());

  function pickOptions(pool, target, n) {
    pool = pool.filter((it) => !soundsLike(it.text, target.text)); // (never "two" with "to")
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

  // ---------- Choice rows (sequence games: Froggy Hop, Monkey Swing, Snowman…) ----------
  // R rows of N options, each row with exactly one right option, for a target from the pool.
  // Returns { cardText, listen, prompt, answer, rows }, where rows[r] is a shuffled array of
  // { text, kind: "letter" | "pic" | "word", right, spoken }.
  // Also `target`: the list item the round is about (for ctx.tutorial).
  //   letter:  same-case look-alikes, or (when opts.lowercase and a coin flip) capital card → lowercase options
  //   phonics: the card is a letter; each row has a different picture that starts with it
  //   cvc:     the card is the word; the options are pictures
  //   hfw:     the card is 🔊 (`listen` true) when there's speech, else the word; the options are words
  function choiceRows(pool, type, R, N, opts = {}) {
    if (window.Core && window.Core.fewer) N = Math.max(2, 1 + Math.ceil((N - 1) / 2)); // 💡 50/50 (an item): fewer wrong answers
    const letterName = (it) => it.say || it.text.toUpperCase();
    const forWord = (l, w) => `${l} for ${w}`;
    const rows = [];
    const out = { listen: false, rows };
    if (type === "phonics") {
      const letter = pool.find((it) => startPics(it).length) || pool[0];
      const set = phonicsSet(pool, letter, R, (N - 1) * R);
      const rights = [...Array(R)].map((_, i) => set.right[i % set.right.length]);
      out.target = letter;
      out.cardText = letter.text.toUpperCase();
      out.prompt = letterName(letter);
      out.answer = forWord(letterName(letter), rights[0].word);
      for (let r = 0; r < R; r++) {
        const wrong = set.wrong.slice(r * (N - 1), (r + 1) * (N - 1));
        const extra = wrong.length < N - 1 ? shuffle(set.wrong.slice()).slice(0, N - 1 - wrong.length) : [];
        rows.push(shuffle([rights[r], ...wrong, ...extra].map((p) => ({ text: p.emoji, kind: "pic", right: p === rights[r], spoken: p.word }))));
      }
    } else if (type === "cvc") {
      const pics = pool.filter((it) => it.emoji);
      const target = pics[0] || pool[0];
      out.target = target;
      out.cardText = target.text;
      out.prompt = out.answer = target.say || target.text;
      const others = shuffle(pics.filter((o) => o !== target && o.emoji !== target.emoji));
      const close = pickOptions(pool, target, 12).filter((o) => o !== target && o.emoji && o.emoji !== target.emoji);
      for (let r = 0; r < R; r++) {
        const wrong = [];
        for (const o of [...shuffle(close.slice()), ...others]) { if (wrong.length >= N - 1) break; if (!wrong.includes(o)) wrong.push(o); }
        rows.push(shuffle([target, ...wrong].map((o) => ({ text: o.emoji, kind: "pic", right: o === target, spoken: o.say || o.text }))));
      }
    } else if (type === "letter" && opts.lowercase && (opts.forceLower !== undefined ? opts.forceLower : Math.random() < 0.5)) {
      const target = pool[0];
      out.target = target;
      out.cardText = target.text.toUpperCase();
      out.prompt = letterName(target);
      out.answer = target.word ? forWord(letterName(target), target.word) : out.prompt;
      const notIL = (o) => [o.text, target.text].map((x) => x.toUpperCase()).sort().join("") !== "IL";
      for (let r = 0; r < R; r++) {
        const wrong = [];
        for (const o of [...lowerLookalikes(pool, target), ...pickOptions(pool, target, N + 4)]) {
          if (wrong.length >= N - 1) break;
          if (o !== target && notIL(o) && o.text.toLowerCase() !== target.text.toLowerCase() && !wrong.includes(o)) wrong.push(o);
        }
        rows.push(shuffle([target, ...wrong].map((o) => ({ text: o.text.toLowerCase(), kind: "letter", right: o === target, spoken: letterName(o) }))));
      }
    } else {
      const target = pool[0];
      const isHfw = type === "hfw";
      out.listen = isHfw && !!opts.canSpeak;
      out.target = target;
      out.cardText = out.listen ? "🔊" : target.text;
      out.prompt = isHfw ? target.say || target.text : letterName(target);
      out.answer = !isHfw && target.word ? forWord(letterName(target), target.word) : out.prompt;
      for (let r = 0; r < R; r++) {
        const wrong = pickOptions(pool, target, N + 3).filter((o) => o !== target && o.text !== target.text).slice(0, N - 1);
        rows.push(shuffle([target, ...wrong].map((o) => ({ text: o.text, kind: isHfw ? "word" : "letter", right: o === target, spoken: isHfw ? o.say || o.text : letterName(o) }))));
      }
    }
    return out;
  }
  // ---------- Matching pairs (the draw-a-line games: Spaghetti Slurp, Plug It In, Flying Kites) ----------
  // N pairs to join up, look-alikes together on purpose (that's the point of matching). Each pair is
  // { item, a, b, say }: `a` goes on the left, `b` on the right ({ text, kind, spoken }), `say` is spoken on a match.
  //   letter:  capital → lowercase (b, d, p together; never I with l)
  //   phonics: letter → a picture that starts with it (one picture each, no emoji twice)
  //   cvc:     word → its picture
  function matchPairs(pool, type, N) {
    const letterName = (it) => it.say || it.text.toUpperCase();
    const picked = [];
    const take = (cands, ok) => { for (const o of cands) { if (picked.length >= N) break; if (!picked.includes(o) && ok(o)) picked.push(o); } };
    const first = type === "phonics" ? pool.find((it) => startPics(it).length) : type === "cvc" ? pool.find((it) => it.emoji) : pool[0];
    if (!first) return [];
    picked.push(first);
    if (type === "letter") {
      const notIL = (o) => !picked.some((p) => [o.text, p.text].map((x) => x.toUpperCase()).sort().join("") === "IL");
      const uniq = (o) => !picked.some((p) => p.text.toLowerCase() === o.text.toLowerCase());
      take([...lowerLookalikes(pool, first), ...pickOptions(pool, first, N + 6), ...shuffle(pool.slice())], (o) => notIL(o) && uniq(o));
      return picked.map((o) => ({ item: o, a: { text: o.text.toUpperCase(), kind: "letter", spoken: letterName(o) }, b: { text: o.text.toLowerCase(), kind: "letter", spoken: letterName(o) },
        say: o.word ? `${letterName(o)} for ${o.word}` : letterName(o) }));
    }
    if (type === "phonics") {
      take([...pickOptions(pool, first, N + 6), ...shuffle(pool.slice())], (o) => startPics(o).length > 0);
      const used = new Set();
      return picked.map((o) => {
        const p = shuffle(startPics(o)).find((x) => !used.has(x.emoji)) || startPics(o)[0];
        used.add(p.emoji);
        return { item: o, a: { text: o.text.toUpperCase(), kind: "letter", spoken: letterName(o) }, b: { text: p.emoji, kind: "pic", spoken: p.word }, say: `${letterName(o)} for ${p.word}` };
      });
    }
    if (type === "hfw") { // (the flip-card games: a sight word matches the same word; look-alike words together)
      take([...pickOptions(pool, first, N + 8), ...shuffle(pool.slice())], (o) => !picked.some((p) => p.text === o.text || soundsLike(p.text, o.text)));
      return picked.map((o) => { const w = { text: o.text, kind: "word", spoken: o.say || o.text }; return { item: o, a: w, b: { ...w }, say: w.spoken }; });
    }
    // cvc (words and their pictures)
    const emo = (o) => o.emoji && !picked.some((p) => p.emoji === o.emoji);
    take([...pickOptions(pool, first, N + 8), ...shuffle(pool.slice())], emo);
    return picked.map((o) => ({ item: o, a: { text: o.text, kind: "word", spoken: o.say || o.text }, b: { text: o.emoji, kind: "pic", spoken: o.say || o.text }, say: o.say || o.text }));
  }
  // ---------- Two groups to sort (the quick-sort games: Post Office, Lunch Lady, Recycling Robot) ----------
  // { bins: [bin, bin], items } with about n items, half for each bin, shuffled. A bin is { text, kind, say };
  // an item is { text, kind, spoken, bin (0 or 1), pic? }. The two groups are ones that get mixed up:
  //   letter:  two look-alike letters (B and D), the items both cases of each
  //   phonics: two letters (sound-alikes first: B and V, L and R), the items pictures that start with each
  //   cvc:     two word families (-at and -ig), the items words (with their picture when there is one)
  //   hfw:     two first letters (t… and w…), the items sight words
  function sortSets(pool, type, n) {
    const half = Math.max(2, Math.floor(n / 2));
    const letterName = (it) => it.say || it.text.toUpperCase();
    const pack = (bins, groups) => {
      const k = Math.min(half, groups[0].length, groups[1].length);
      const items = shuffle([...groups[0].slice(0, k).map((x) => ({ ...x, bin: 0 })), ...groups[1].slice(0, k).map((x) => ({ ...x, bin: 1 }))]);
      return { bins, items };
    };
    if (type === "phonics" || type === "letter") {
      const ok = (o) => (type === "phonics" ? startPics(o).length >= Math.min(half, 2) : true);
      const a = pool.find(ok) || pool[0];
      const notIL = (o) => [o.text, a.text].map((x) => x.toUpperCase()).sort().join("") !== "IL";
      const cands = type === "letter" ? [...lowerLookalikes(pool, a), ...pickOptions(pool, a, 8)] : [...pickOptions(pool, a, 8), ...shuffle(pool.slice())];
      const b = cands.find((o) => o !== a && o.text.toLowerCase() !== a.text.toLowerCase() && notIL(o) && ok(o)) || pool.find((o) => o !== a && ok(o));
      const bins = [a, b].map((o) => ({ text: o.text.toUpperCase(), kind: "letter", say: letterName(o) }));
      if (type === "letter") {
        const forms = (o) => [o.text.toUpperCase(), o.text.toLowerCase(), o.text.toLowerCase(), o.text.toUpperCase()].map((t) => ({ text: t, kind: "letter", spoken: letterName(o) }));
        return pack(bins, [forms(a), forms(b)]);
      }
      const pics = (o) => shuffle(startPics(o)).map((p) => ({ text: p.emoji, kind: "pic", spoken: p.word }));
      return pack(bins, [pics(a), pics(b)]);
    }
    // cvc: word families by their ending (c-at, h-at, m-at…); hfw: by first letter. The pool's front item picks the first group.
    const keyOf = type === "cvc" ? (o) => o.text.slice(1) : (o) => o.text[0].toLowerCase();
    const fams = {};
    pool.forEach((o) => { (fams[keyOf(o)] = fams[keyOf(o)] || []).push(o); });
    const big = (k) => fams[k] && fams[k].length >= 2;
    const k1 = big(keyOf(pool[0])) ? keyOf(pool[0]) : Object.keys(fams).sort((x, y) => fams[y].length - fams[x].length)[0];
    const k2 = shuffle(Object.keys(fams).filter((k) => k !== k1 && big(k))).sort((x, y) => Math.min(fams[y].length, half) - Math.min(fams[x].length, half))[0];
    const label = (k) => (type === "cvc" ? `-${k}` : k);
    const bins = [k1, k2].map((k) => ({ text: label(k), kind: "word", say: type === "cvc" ? k : letterName({ text: k }) }));
    const words = (k) => shuffle(fams[k].slice()).map((o) => ({ text: o.text, kind: "word", spoken: o.say || o.text, pic: o.emoji }));
    return pack(bins, [words(k1), words(k2)]);
  }
  // R one-row steps, each with a DIFFERENT target (rhythm games: "A"… tap a… "B"… tap b…). Each step is
  // what choiceRows(…, 1, N) gives (cardText, prompt, answer, target, listen) plus `row`. ABC games stay
  // all same-case or all capital → lowercase for the whole round.
  function choiceSteps(pool, type, R, N, opts = {}) {
    const o = { ...opts, forceLower: opts.lowercase ? Math.random() < 0.5 : false };
    const used = new Set(), steps = [];
    // ⭐ MY WORDS (the frame sets Core.focus): the chosen words come round again before any others.
    const FS = window.Core && window.Core.focus, F = FS && pool.some((it) => FS.has(it.text)) ? FS : null;
    for (let s = 0; s < R; s++) {
      const fresh = pool.filter((it) => !used.has(it.text)), old = pool.filter((it) => used.has(it.text));
      const mine = (a) => (F ? a.filter((it) => F.has(it.text)) : []), rest = (a) => (F ? a.filter((it) => !F.has(it.text)) : a);
      const order = F ? [...shuffle(mine(fresh)), ...shuffle(mine(old)), ...rest(fresh), ...rest(old)] : fresh.length ? [...fresh, ...old] : pool;
      const c = choiceRows(order, type, opts.rowsPer || 1, N, o); // the target comes from the front
      used.add(c.target.text);
      steps.push({ ...c, row: c.rows[0] }); // (opts.rowsPer: several rows for that target, in `rows`: Monkey Swing's race sections)
    }
    return steps;
  }

  // ---------- FILL THE GAP (the gap games: Robot Repair, Bridge Builder, Burger Stack, Rocket Fix, Cookie Cutter) ----------
  // R steps, each a word (or run of letters) with ONE letter missing, and N letters to choose from:
  //   CVC      the word with its first, middle or last letter missing (c_t), the picture, and the voice says it.
  //   ABC      a run of three letters with one missing (M _ O); nothing is said (it would give it away).
  //   PHONICS  a picture and its word with the first letter missing (🐶 _og); the voice says the word.
  //   HFW      the teacher's sight-word rules: the whole word shows FIRST (`showFirst`: look, then cover), then a
  //            FAIR letter flies out: the first one, except where it's odd (who, one, eight: GAP_FAIR); the wrong
  //            letters never make another real word, and never b/d/p/q look-alikes at the slow speed.
  // Each step: { target, cells: [letters], gap, answer, options: [letters], pic, prompt, answer: spoken word,
  //              say (what to say when it's right), showFirst, kind }.
  const VOWELS = ["a", "e", "i", "o", "u"], CONSONANTS = "bcdfghjklmnprstvwyz".split("");
  const GAP_FAIR = { who: 1, one: 1, eight: 4 }; // sight words whose first letter isn't the sound you hear
  const BDPQ = ["b", "d", "p", "q"];
  function gapSteps(pool, type, R, N, opts = {}) {
    if (window.Core && window.Core.fewer) N = Math.max(2, 1 + Math.ceil((N - 1) / 2)); // 💡 50/50 (an item)
    const steps = [];
    const FS = window.Core && window.Core.focus, F = FS && pool.some((it) => FS.has(it.text)) ? FS : null;
    const words = new Set(pool.map((it) => String(it.text).toLowerCase()));
    const used = new Set();
    // Targets from the front of the pool (MY WORDS first), fresh ones before repeats.
    const order = () => {
      const fresh = pool.filter((it) => !used.has(it.text)), old = pool.filter((it) => used.has(it.text));
      const mine = (a) => (F ? a.filter((it) => F.has(it.text)) : []), rest = (a) => (F ? a.filter((it) => !F.has(it.text)) : a);
      return F ? [...shuffle(mine(fresh)), ...shuffle(mine(old)), ...rest(fresh), ...rest(old)] : [...fresh, ...old];
    };
    const kind = !!opts.slow; // (slow speed: no b/d/p/q look-alikes among the wrong letters)
    function wrongLetters(answer, n, isVowelSlot, makesWord) {
      const base = isVowelSlot ? VOWELS : type === "letter" ? "ABCDEFGHIJKLMNOPRSTUVWYZ".split("") : CONSONANTS;
      let cands = shuffle(base.filter((l) => l.toLowerCase() !== answer.toLowerCase()));
      if (kind) cands = cands.filter((l) => !(BDPQ.includes(l.toLowerCase()) && BDPQ.includes(answer.toLowerCase())));
      if (makesWord) cands = cands.filter((l) => !makesWord(l)); // (sight words: never another real word)
      if (cands.length < n) cands = shuffle(base.filter((l) => l.toLowerCase() !== answer.toLowerCase()));
      return cands.slice(0, n);
    }
    for (let s = 0; s < R; s++) {
      const list = order();
      let st = null;
      if (type === "letter") {
        // A run of three: the target letter and its neighbours (never at the very ends of the alphabet).
        const it = list.find((x) => /^[B-Y]$/i.test(x.text)) || list[0];
        const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ", k = Math.max(1, Math.min(24, A.indexOf(it.text.toUpperCase())));
        const lower = false; // capitals: alphabet order is about the sequence (a lowercase f looked like r on the rocket: the teacher saw "rgh")
        const run = [A[k - 1], A[k], A[k + 1]].map((l) => (lower ? l.toLowerCase() : l));
        const gap = Math.floor(Math.random() * 3);
        const answer = run[gap];
        const wrong = wrongLetters(answer, N - 1, false).map((l) => (lower ? l.toLowerCase() : l.toUpperCase())).filter((l) => !run.includes(l)).slice(0, N - 1);
        st = { target: it, cells: run, gap, answer, pic: null, prompt: "", say: answer.toUpperCase(), spoken: answer.toUpperCase(), showFirst: false, kind: "letter", wrong };
      } else if (type === "phonics") {
        const it = list.find((x) => startPics(x).some((p) => p.word.length <= 6)) || list.find((x) => startPics(x).length) || list[0];
        const pics = shuffle(startPics(it).filter((p) => p.word.length <= 6));
        const p = pics[0] || startPics(it)[0] || { word: it.word || it.text, emoji: it.emoji };
        const cells = p.word.toLowerCase().split("");
        st = { target: it, cells, gap: 0, answer: cells[0], pic: p.emoji, prompt: p.word, say: p.word, spoken: p.word, showFirst: false, kind: "word",
          wrong: wrongLetters(cells[0], N - 1, false) };
      } else if (type === "cvc") {
        const it = list[0];
        const cells = it.text.toLowerCase().split("");
        const gap = typeof opts.gap === "number" ? opts.gap : Math.floor(Math.random() * cells.length);
        st = { target: it, cells, gap, answer: cells[gap], pic: it.emoji || null, prompt: it.say || it.text, say: it.say || it.text, spoken: it.text, showFirst: false, kind: "word",
          wrong: wrongLetters(cells[gap], N - 1, VOWELS.includes(cells[gap])) };
      } else {
        const it = list.find((x) => x.text.length >= 2) || list[0];
        const w = it.text.toLowerCase(), cells = w.split("");
        const gap = GAP_FAIR[w] != null ? GAP_FAIR[w] : 0;
        const makesWord = (l) => { const t = cells.slice(); t[gap] = l.toLowerCase(); const ww = t.join(""); return ww !== w && (words.has(ww) || soundMap.has(ww)); };
        st = { target: it, cells, gap, answer: cells[gap], pic: null, prompt: it.say || it.text, say: it.say || it.text, spoken: it.text, showFirst: true, kind: "word",
          wrong: wrongLetters(cells[gap], N - 1, VOWELS.includes(cells[gap]), makesWord) };
      }
      used.add(st.target.text);
      st.options = shuffle([st.answer, ...st.wrong.slice(0, N - 1)]);
      delete st.wrong;
      steps.push(st);
    }
    return steps;
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

  // iOS Safari often silently drops an utterance that's spoken right after cancel(), so when
  // something is still speaking (the last answer, "Your turn!") the new line waits a moment.
  let sayToken = 0;
  function say(text) {
    if (!canSpeak || !text) return;
    try {
      const busy = speechSynthesis.speaking || speechSynthesis.pending;
      speechSynthesis.cancel();
      const token = ++sayToken;
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
      const go = () => { if (token === sayToken) speechSynthesis.speak(u); }; // a newer say() wins
      if (busy) setTimeout(go, 90); else go();
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
  // PLAYER SAVES (js/players.js; the teacher: up to 10 children share one iPad): these keys are kept per
  // player (`key@p3`), everything else (settings, MY WORDS…) belongs to the iPad. storage.player is the
  // active save's id; the frame and games don't need to know.
  const PER_PLAYER = ["wwe.char", "wwe.chars", "wwe.played", "wwe.boss.beaten", "wwe.challenge.best", "wwe.adventure", "wwe.items"];
  const keyOf = (key) => (storage.player && PER_PLAYER.includes(key) ? `${key}@${storage.player}` : key);
  const storage = {
    player: null,
    PER_PLAYER,
    get(key, fallback = null) {
      try {
        const v = localStorage.getItem(keyOf(key));
        return v == null ? fallback : JSON.parse(v);
      } catch (err) {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(keyOf(key), JSON.stringify(value));
      } catch (err) {
        console.error("storage:", err);
      }
    },
    remove(key) {
      try { localStorage.removeItem(keyOf(key)); } catch (err) { /* blocked storage */ }
    },
    // Raw access to the whole iPad's storage (players.js: migrating and deleting saves).
    raw: {
      get(k) { try { return localStorage.getItem(k); } catch (err) { return null; } },
      set(k, v) { try { localStorage.setItem(k, v); } catch (err) { /* blocked */ } },
      remove(k) { try { localStorage.removeItem(k); } catch (err) { /* blocked */ } },
    },
  };

  window.Core = {
    MICROGAMES,
    shuffle, pick, pickOptions,
    startPics, phonicsSet, lowerLookalikes, choiceRows, choiceSteps, matchPairs, sortSets, soundsLike, gapSteps,
    unlock, audioCtx: () => actx, sfx,
    canSpeak, say, stopSpeech, isSpeaking,
    confetti,
    storage,
  };
})();
