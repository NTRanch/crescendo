// core.mjs — Crescendo arousal-engine/1, JS realization.
// The GDScript core (scripts/crescendo_core.gd) is the native build of
// record; this file is its line-for-line realization, gated exactly by
// conformance/vectors.json (dumped from the GDScript core headless).
// Integer milliseconds only — no floats in the state machine — so the
// two implementations agree step for step.
//
// Engine law (arousal-engine/1, canon numbers, do not improvise):
//   tiers T1..T4 rise+hold seconds: 4+4, 7+6, 11+9, 16+12.
//   RISE: progress accrues while the stimulus is HELD; released, it
//     decays at dt/4. progress == rise_ms enters EDGE.
//   EDGE: the timer accrues while RELEASED; holding adds strain.
//     strain >= 1200 ms in one edge is a SLIP: back to RISE at half
//     progress. Three slips fail the session.
//   Tier complete -> next tier (weather shifts at the boundary), or,
//   at the level's target tier, PEAK: culmination fires EXACTLY ONCE
//   (a latch; no path re-enters PEAK). PEAK 3000 ms (face F-05),
//   DAZE 6000 ms (face F-10), then victory.
//   Face: RISE early = REST, RISE late = BUILD, EDGE = F-03,
//     PEAK = F-05 (solid heart pupils), DAZE = F-10.
//   Weather: index == tier-1 in RISE/EDGE, 4 at PEAK, 5 in DAZE.
//   Session clock runs in RISE/EDGE only; over the level limit = fail.
//   Girls are parameter sets (palette/geometry for the performance);
//   they never touch the state machine (girl-decoupling law).

export const TIERS = [
  [4000, 4000],
  [7000, 6000],
  [11000, 9000],
  [16000, 12000],
];
export const LEVELS = [
  { name: "FIRST SWELL", target: 2, limitMs: 90000 },
  { name: "THE LONG RISE", target: 3, limitMs: 120000 },
  { name: "FULL CRESCENDO", target: 4, limitMs: 150000 },
];
export const GIRLS = [
  { name: "PRIMA", accent: 1, blushR: 26, gazeDy: 0, hair: 4 },
  { name: "YUI", accent: 8, blushR: 20, gazeDy: 4, hair: 7 },
  { name: "ALMA", accent: 5, blushR: 32, gazeDy: -3, hair: 3 },
];
export const PEAK_MS = 3000;
export const DAZE_MS = 6000;
export const STRAIN_MAX_MS = 1200;
export const SLIPS_MAX = 3;
export const PHASE = { RISE: 0, EDGE: 1, PEAK: 2, DAZE: 3, DONE: 4, FAILED: 5 };
export const FACE = { REST: 0, BUILD: 1, EDGE: 2, PEAK: 3, DAZE: 4 };
export const EVENT = { TIER: 1, PEAK: 2, DAZE: 4, VICTORY: 8, FAILED: 16, SLIP: 32, WEATHER: 64 };
export const IN = { HOLD: 1, CONFIRM: 2, BACK: 4, PAUSE: 8, UP: 16, DOWN: 32, LEFT: 64, RIGHT: 128 };

const DT_MAX_MS = 50;
const MENU_ROWS = 5; // GIRL, LEVEL, PLAY, HOW TO, SETTINGS

export function createCore() {
  const s = {
    seed: 1, rng: 1, level: 0, girl: 0, demo: false,
    screen: 0, menuRow: 0, settingsRow: 0,
    weatherReduced: false, textLarge: false,
    wins: 0, bestTier: 0,
    // engine state
    tier: 1, phase: PHASE.RISE, progressMs: 0, edgeMs: 0, strainMs: 0,
    phaseMs: 0, elapsedMs: 0, slips: 0, culminations: 0, peakLatched: false,
    frame: 0, lastEvent: 0, prevBits: 0,
  };

  function rngNext() {
    s.rng = (Math.imul(s.rng, 1664525) + 1013904223) >>> 0;
    return s.rng;
  }
  function face() {
    if (s.phase === PHASE.EDGE) return FACE.EDGE;
    if (s.phase === PHASE.PEAK) return FACE.PEAK;
    if (s.phase === PHASE.DAZE || s.phase === PHASE.DONE) return FACE.DAZE;
    if (s.phase === PHASE.RISE && s.progressMs * 2 >= TIERS[s.tier - 1][0]) return FACE.BUILD;
    return FACE.REST;
  }
  function weather() {
    if (s.phase === PHASE.PEAK) return 4;
    if (s.phase === PHASE.DAZE || s.phase === PHASE.DONE) return 5;
    return s.tier - 1;
  }
  function resetRun() {
    s.tier = 1; s.phase = PHASE.RISE; s.progressMs = 0; s.edgeMs = 0;
    s.strainMs = 0; s.phaseMs = 0; s.elapsedMs = 0; s.slips = 0;
    s.culminations = 0; s.peakLatched = false;
  }
  function startLevel(l) {
    if (!Number.isInteger(l) || l < 0 || l >= LEVELS.length) return 1;
    s.level = l; resetRun(); s.screen = 3;
    return 0;
  }
  function enterPeak(ev) {
    if (s.peakLatched) return ev; // exactly-once: no re-entry, no re-fire
    s.peakLatched = true; s.culminations = 1;
    s.phase = PHASE.PEAK; s.phaseMs = 0;
    return ev | EVENT.PEAK | EVENT.WEATHER;
  }
  function stepEngine(dt, held) {
    let ev = 0;
    const riseMs = TIERS[s.tier - 1][0];
    const holdMs = TIERS[s.tier - 1][1];
    if (s.phase === PHASE.RISE || s.phase === PHASE.EDGE) {
      s.elapsedMs += dt;
      if (s.elapsedMs > LEVELS[s.level].limitMs) {
        s.phase = PHASE.FAILED; s.screen = 7;
        return EVENT.FAILED;
      }
    }
    if (s.phase === PHASE.RISE) {
      if (held) s.progressMs += dt;
      else s.progressMs = Math.max(0, s.progressMs - (dt >> 2));
      if (s.progressMs >= riseMs) {
        s.progressMs = riseMs; s.phase = PHASE.EDGE; s.edgeMs = 0; s.strainMs = 0;
        ev |= EVENT.TIER;
      }
    } else if (s.phase === PHASE.EDGE) {
      if (held) {
        s.strainMs += dt;
        if (s.strainMs >= STRAIN_MAX_MS) {
          s.slips += 1;
          if (s.slips >= SLIPS_MAX) {
            s.phase = PHASE.FAILED; s.screen = 7;
            return ev | EVENT.FAILED;
          }
          s.phase = PHASE.RISE; s.progressMs = riseMs >> 1; s.strainMs = 0; s.edgeMs = 0;
          ev |= EVENT.SLIP;
        }
      } else {
        s.edgeMs += dt;
        if (s.edgeMs >= holdMs) {
          if (s.tier >= LEVELS[s.level].target) {
            ev = enterPeak(ev);
          } else {
            s.tier += 1; s.phase = PHASE.RISE; s.progressMs = 0; s.edgeMs = 0; s.strainMs = 0;
            if (s.tier > s.bestTier) s.bestTier = s.tier;
            ev |= EVENT.TIER | EVENT.WEATHER;
          }
        }
      }
    } else if (s.phase === PHASE.PEAK) {
      s.phaseMs += dt;
      if (s.phaseMs >= PEAK_MS) { s.phase = PHASE.DAZE; s.phaseMs = 0; ev |= EVENT.DAZE | EVENT.WEATHER; }
    } else if (s.phase === PHASE.DAZE) {
      s.phaseMs += dt;
      if (s.phaseMs >= DAZE_MS) {
        s.phase = PHASE.DONE; s.screen = 6; s.wins = Math.min(999, s.wins + 1);
        if (s.tier > s.bestTier) s.bestTier = s.tier;
        ev |= EVENT.VICTORY;
      }
    }
    return ev;
  }
  function demoHeld() {
    return s.phase === PHASE.RISE;
  }
  function pressed(bits, bit) {
    return (bits & bit) !== 0 && (s.prevBits & bit) === 0;
  }

  const api = {
    init(seed, level, demo, girl) {
      if (!Number.isInteger(level) || level < 0 || level >= LEVELS.length) return 1;
      if (!Number.isInteger(girl) || girl < 0 || girl >= GIRLS.length) return 2;
      s.seed = seed >>> 0; s.rng = (seed >>> 0) || 1;
      s.level = level; s.girl = girl; s.demo = !!demo;
      s.frame = 0; s.prevBits = 0; s.lastEvent = 0;
      s.menuRow = 0; s.settingsRow = 0;
      resetRun();
      s.screen = s.demo ? 3 : 0;
      if (s.demo) s.screen = 3;
      return 0;
    },
    startLevel,
    setGirl(g) {
      if (!Number.isInteger(g) || g < 0 || g >= GIRLS.length) return 1;
      s.girl = g; return 0;
    },
    step(dtMs, bits) {
      const dt = Math.max(0, Math.min(DT_MAX_MS, dtMs | 0));
      bits = bits & 0xff;
      rngNext();
      s.frame += 1;
      let ev = 0;
      if (s.screen === 0) { // gate
        if (pressed(bits, IN.CONFIRM)) s.screen = 1;
      } else if (s.screen === 1) { // title
        if (pressed(bits, IN.UP)) s.menuRow = (s.menuRow + MENU_ROWS - 1) % MENU_ROWS;
        if (pressed(bits, IN.DOWN)) s.menuRow = (s.menuRow + 1) % MENU_ROWS;
        if (s.menuRow === 0 && (pressed(bits, IN.LEFT) || pressed(bits, IN.RIGHT) || pressed(bits, IN.CONFIRM))) {
          const d = pressed(bits, IN.LEFT) ? GIRLS.length - 1 : 1;
          if (pressed(bits, IN.LEFT) || pressed(bits, IN.RIGHT) || pressed(bits, IN.CONFIRM)) s.girl = (s.girl + d) % GIRLS.length;
        } else if (s.menuRow === 1 && (pressed(bits, IN.LEFT) || pressed(bits, IN.RIGHT) || pressed(bits, IN.CONFIRM))) {
          const d = pressed(bits, IN.LEFT) ? LEVELS.length - 1 : 1;
          s.level = (s.level + d) % LEVELS.length;
        } else if (pressed(bits, IN.CONFIRM)) {
          if (s.menuRow === 2) startLevel(s.level);
          else if (s.menuRow === 3) s.screen = 2;
          else if (s.menuRow === 4) s.screen = 5;
        }
      } else if (s.screen === 2) { // howto
        if (pressed(bits, IN.CONFIRM) || pressed(bits, IN.BACK)) s.screen = 1;
      } else if (s.screen === 3) { // play
        if (pressed(bits, IN.PAUSE)) { s.screen = 4; }
        else {
          const held = s.demo ? demoHeld() : (bits & IN.HOLD) !== 0;
          ev = stepEngine(dt, held);
        }
      } else if (s.screen === 4) { // pause
        if (pressed(bits, IN.PAUSE) || pressed(bits, IN.CONFIRM)) s.screen = 3;
        else if (pressed(bits, IN.BACK)) { s.screen = 1; }
      } else if (s.screen === 5) { // settings
        if (pressed(bits, IN.UP) || pressed(bits, IN.DOWN)) s.settingsRow = 1 - s.settingsRow;
        if (pressed(bits, IN.LEFT) || pressed(bits, IN.RIGHT) || pressed(bits, IN.CONFIRM)) {
          if (s.settingsRow === 0) s.weatherReduced = !s.weatherReduced;
          else s.textLarge = !s.textLarge;
        }
        if (pressed(bits, IN.BACK)) s.screen = 1;
      } else if (s.screen === 6 || s.screen === 7) { // victory / gameover
        if (pressed(bits, IN.CONFIRM) || pressed(bits, IN.BACK)) s.screen = 1;
      }
      s.prevBits = bits;
      s.lastEvent = ev;
      return ev;
    },
    screen: () => s.screen,
    levelIdx: () => s.level,
    girlIdx: () => s.girl,
    tier: () => s.tier,
    phase: () => s.phase,
    face: () => face(),
    weather: () => weather(),
    culminations: () => s.culminations,
    slips: () => s.slips,
    elapsedMs: () => s.elapsedMs,
    progressMs: () => s.progressMs,
    edgeMs: () => s.edgeMs,
    event: () => s.lastEvent,
    frameCount: () => s.frame,
    applySettings(weatherReduced, textLarge) {
      s.weatherReduced = !!weatherReduced; s.textLarge = !!textLarge;
    },
    settingsBits: () => (s.weatherReduced ? 1 : 0) | (s.textLarge ? 2 : 0),
    applyRecords(wins, bestTier) {
      s.wins = Math.max(0, Math.min(999, wins | 0));
      s.bestTier = Math.max(0, Math.min(4, bestTier | 0));
    },
    recordsWins: () => s.wins,
    recordsBest: () => s.bestTier,
    draw: () => drawList(s, face, weather),
  };
  return api;
}

// ---- draw list (line protocol; identical strings in GDScript) ----
function drawList(s, faceFn, weatherFn) {
  const out = [];
  const R = (x, y, w, h, c) => out.push(`r ${x|0} ${y|0} ${w|0} ${h|0} ${c}`);
  const C = (x, y, r, c) => out.push(`c ${x|0} ${y|0} ${r|0} ${c}`);
  const L = (x1, y1, x2, y2, w, c) => out.push(`l ${x1|0} ${y1|0} ${x2|0} ${y2|0} ${w|0} ${c}`);
  const P = (x1, y1, x2, y2, x3, y3, c) => out.push(`p ${x1|0} ${y1|0} ${x2|0} ${y2|0} ${x3|0} ${y3|0} ${c}`);
  const T = (x, y, size, c, str) => out.push(`t ${x|0} ${y|0} ${size|0} ${c} ${str}`);
  const body = s.textLarge ? 20 : 16;
  const girl = GIRLS[s.girl];
  R(0, 0, 960, 960, 0);
  if (s.screen === 0) {
    T(300, 300, 40, 1, "CRESCENDO");
    T(330, 380, body, 2, "AN AROUSAL ENGINE STUDY");
    T(240, 460, body, 5, "18+ ONLY - ADULTS ONLY BEYOND THIS GATE");
    T(240, 500, body, 3, "CONTAINS EROTIC THEMES AND SUGGESTIVE PLAY");
    T(330, 580, body, 8, "PRESS ENTER TO CONFIRM 18+");
    return out.join("\n");
  }
  if (s.screen === 1) {
    T(300, 90, 40, 1, "CRESCENDO");
    T(330, 160, body, 3, "AROUSAL-ENGINE/1 - RUN HONESTLY");
    const rows = [
      `GIRL  < ${girl.name} >`,
      `LEVEL < ${LEVELS[s.level].name} >`,
      "PLAY",
      "HOW TO PLAY",
      "SETTINGS",
    ];
    rows.forEach((r, i) => {
      const y = 260 + i * 64;
      if (i === s.menuRow) { R(190, y - 6, 580, 40, 4); T(210, y, 20, 8, ">"); }
      T(250, y, 20, i === s.menuRow ? 2 : 3, r);
    });
    T(250, 640, body, 3, `SESSIONS WON ${s.wins} - BEST TIER ${s.bestTier}`);
    T(250, 680, body, 3, "ARROWS CHOOSE - ENTER CONFIRMS");
    T(250, 720, body, 3, "THE GIRL CHANGES THE PERFORMANCE ONLY");
    drawFace(out, s, faceFn, 480, 850, 44);
    return out.join("\n");
  }
  if (s.screen === 2) {
    T(330, 90, 28, 1, "HOW TO PLAY");
    const lines = [
      "HOLD SPACE OR PRESS TO BUILD THE RISE",
      "RELEASE AT THE EDGE - HOLDING SLIPS HER",
      "FOUR TIERS - EACH WITH ITS OWN TEMPO",
      "REACH THE TARGET TIER TO CULMINATE",
      "CULMINATION COMES EXACTLY ONCE",
      "THEN REST IN THE DAZE - SESSION WON",
      "THREE SLIPS OR THE CLOCK ENDS IT",
      "P PAUSES - HER FACE TELLS THE TIER",
    ];
    lines.forEach((t, i) => T(170, 190 + i * 52, body, 2, t));
    T(300, 680, body, 8, "ENTER RETURNS TO TITLE");
    return out.join("\n");
  }
  if (s.screen === 5) {
    T(350, 90, 28, 1, "SETTINGS");
    const rows = [
      `WEATHER  ${s.weatherReduced ? "REDUCED" : "FULL"}`,
      `TEXT     ${s.textLarge ? "LARGE" : "NORMAL"}`,
    ];
    rows.forEach((r, i) => {
      const y = 260 + i * 64;
      if (i === s.settingsRow) { R(190, y - 6, 580, 40, 4); T(210, y, 20, 8, ">"); }
      T(250, y, 20, i === s.settingsRow ? 2 : 3, r);
    });
    T(250, 480, body, 3, "LEFT OR RIGHT CHANGES - ESC RETURNS");
    T(250, 520, body, 3, "SETTINGS ARE NEVER GATED BY PLAY");
    return out.join("\n");
  }
  // play / pause / victory / gameover share the stage
  drawWeather(out, s, weatherFn);
  drawFace(out, s, faceFn, 480, 470, 170);
  const f = faceFn();
  const faceName = ["REST", "BUILDING", "F-03 EDGE", "F-05 PEAK", "F-10 DAZE"][f];
  const phaseName = ["RISE", "EDGE", "PEAK", "DAZE", "DONE", "ENDED"][s.phase];
  T(40, 40, 20, 2, `${LEVELS[s.level].name} - ${girl.name}`);
  T(40, 76, body, 3, `TIER ${s.tier} OF ${LEVELS[s.level].target} - ${phaseName} - ${faceName}`);
  const riseMs = TIERS[s.tier - 1][0], holdMs = TIERS[s.tier - 1][1];
  const frac = s.phase === PHASE.RISE ? s.progressMs / riseMs : s.phase === PHASE.EDGE ? s.edgeMs / holdMs : 1;
  R(40, 880, 880, 18, 4);
  R(40, 880, Math.max(0, Math.min(880, Math.round(880 * frac))), 18, s.phase === PHASE.EDGE ? 8 : 1);
  const remain = Math.max(0, LEVELS[s.level].limitMs - s.elapsedMs);
  T(40, 916, body, 3, `TIME ${(remain / 1000).toFixed(0)}S - SLIPS ${s.slips} - WEATHER ${weatherFn()}`);
  if (s.phase === PHASE.RISE) T(300, 830, body, 8, "HOLD TO BUILD THE RISE");
  if (s.phase === PHASE.EDGE) T(270, 830, body, 8, "RELEASE - HOLDING SLIPS HER");
  if (s.screen === 4) {
    R(230, 330, 500, 260, 9);
    T(390, 400, 28, 1, "PAUSED");
    T(320, 470, body, 2, "ENTER RESUMES - ESC TO TITLE");
  }
  if (s.screen === 6) {
    R(180, 300, 600, 300, 9);
    T(330, 370, 28, 1, "CRESCENDO");
    T(280, 440, body, 2, "CULMINATION - EXACTLY ONCE");
    T(300, 480, body, 3, `TARGET TIER ${LEVELS[s.level].target} REACHED`);
    T(330, 540, body, 8, "ENTER RETURNS TO TITLE");
  }
  if (s.screen === 7) {
    R(180, 300, 600, 300, 9);
    T(340, 370, 28, 5, "SESSION ENDED");
    T(300, 440, body, 2, s.slips >= SLIPS_MAX ? "THREE SLIPS SPENT HER" : "THE CLOCK RAN OUT");
    T(330, 540, body, 8, "ENTER RETURNS TO TITLE");
  }
  return out.join("\n");
}

function drawFace(out, s, faceFn, cx, cy, r) {
  const C = (x, y, rr, c) => out.push(`c ${x|0} ${y|0} ${rr|0} ${c}`);
  const L = (x1, y1, x2, y2, w, c) => out.push(`l ${x1|0} ${y1|0} ${x2|0} ${y2|0} ${w|0} ${c}`);
  const P = (x1, y1, x2, y2, x3, y3, c) => out.push(`p ${x1|0} ${y1|0} ${x2|0} ${y2|0} ${x3|0} ${y3|0} ${c}`);
  const girl = GIRLS[s.girl];
  const f = faceFn();
  const big = r > 100;
  // hair + head (abstract-symbolic staging, D-292: shapes only)
  C(cx, cy - Math.round(r * 0.08), Math.round(r * 1.12), girl.hair);
  C(cx, cy, r, 2);
  // blush, scaled by tier and the girl's own radius
  const blushR = Math.round(girl.blushR * (big ? 1 : 0.3) * (0.5 + s.tier * 0.18));
  if (blushR > 3) {
    C(cx - Math.round(r * 0.52), cy + Math.round(r * 0.24), blushR, 5);
    C(cx + Math.round(r * 0.52), cy + Math.round(r * 0.24), blushR, 5);
  }
  const eyeY = cy - Math.round(r * 0.12) + girl.gazeDy * (big ? 1 : 0);
  const eyeDx = Math.round(r * 0.36), eyeR = Math.round(r * 0.16);
  for (const sx of [-1, 1]) {
    const ex = cx + sx * eyeDx;
    C(ex, eyeY, eyeR, 6);
    if (f === FACE.PEAK) {
      // F-05: solid heart pupils
      const hr = Math.max(3, Math.round(eyeR * 0.42));
      C(ex - hr, eyeY - hr, hr, girl.accent);
      C(ex + hr, eyeY - hr, hr, girl.accent);
      P(ex - hr * 2, eyeY - hr, ex + hr * 2, eyeY - hr, ex, eyeY + hr * 2, girl.accent);
    } else {
      const pr = Math.max(2, Math.round(eyeR * (f === FACE.EDGE ? 0.34 : 0.5)));
      C(ex, eyeY + (f === FACE.DAZE ? 2 : 0), pr, girl.accent);
    }
    if (f === FACE.DAZE) { // F-10: heavy lids over the top of the eye
      out.push(`r ${ex - eyeR} ${eyeY - eyeR} ${eyeR * 2} ${eyeR} 0`);
    }
    // brow
    const browTilt = f === FACE.EDGE ? -6 : f === FACE.PEAK ? -9 : 0;
    L(ex - eyeR, eyeY - eyeR - 8, ex + eyeR, eyeY - eyeR - 8 + sx * browTilt, 4, 7);
  }
  // mouth: rest line, edge open, peak open wider, daze soft
  const my = cy + Math.round(r * 0.42);
  if (f === FACE.EDGE || f === FACE.PEAK) C(cx, my, f === FACE.PEAK ? Math.round(r * 0.1) : Math.round(r * 0.06), 4);
  else L(cx - Math.round(r * 0.14), my, cx + Math.round(r * 0.14), my, 4, 7);
}

function drawWeather(out, s, weatherFn) {
  const w = weatherFn();
  const C = (x, y, rr, c) => out.push(`c ${x|0} ${y|0} ${rr|0} ${c}`);
  const L = (x1, y1, x2, y2, ww, c) => out.push(`l ${x1|0} ${y1|0} ${x2|0} ${y2|0} ${ww|0} ${c}`);
  let count = [10, 18, 28, 40, 30, 12][w];
  if (s.weatherReduced) count = Math.ceil(count / 2);
  const speed = [1, 2, 3, 4, 2, 1][w];
  for (let i = 0; i < count; i++) {
    const hx = ((i * 197 + 61) * 2654435761) >>> 0;
    const x = hx % 960;
    const y = ((hx >> 8) % 700 + s.frame * speed * 3) % 760;
    if (w === 4) C(x, y, 4, 8);            // peak: gold sparks
    else if (w === 5) C(x, y + 60, 3, 3); // daze: slow motes
    else L(x, y, x - 4, y + 14 + w * 3, 2, w >= 2 ? 1 : 7); // rising rain
  }
}
