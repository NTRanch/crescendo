// core.test.mjs — JS realization unit tests: half validation, half
// adversarial (estate split). Run: node tests/core.test.mjs
import { createCore, IN, PHASE, FACE } from "../web/core.mjs";

let passed = 0;
function ok(cond, name) {
  if (!cond) { console.error(`FAIL: ${name}`); process.exit(1); }
  passed++; console.log(`ok ${passed} - ${name}`);
}
function fresh(level = 0, girl = 0, demo = false, seed = 11) {
  const c = createCore();
  if (c.init(seed, level, demo, girl) !== 0) throw new Error("init failed");
  return c;
}
function runTo(c, targetScreen, maxSteps = 30000) {
  let n = 0;
  while (c.screen() !== targetScreen && n < maxSteps) { c.step(16, 0); n++; }
  return n;
}

// --- validation ---
{ // 1: T1 rise is exactly 4000 ms of holding (250 steps at 16 ms)
  const c = fresh(0); c.startLevel(0);
  for (let i = 0; i < 249; i++) c.step(16, IN.HOLD);
  ok(c.phase() === PHASE.RISE, "T1 still rising at 3984 ms held");
  c.step(16, IN.HOLD);
  ok(c.phase() === PHASE.EDGE && c.face() === FACE.EDGE, "T1 edge (F-03) at exactly 4000 ms held");
}
{ // 2: T1 edge is exactly 4000 ms released, then tier 2 + weather shift
  const c = fresh(0); c.startLevel(0);
  for (let i = 0; i < 250; i++) c.step(16, IN.HOLD);
  ok(c.weather() === 0, "weather 0 in tier 1");
  for (let i = 0; i < 250; i++) c.step(16, 0);
  ok(c.tier() === 2 && c.weather() === 1 && c.phase() === PHASE.RISE, "tier 2 + weather 1 after exact edge");
}
{ // 3: demo completes every level with culmination exactly once
  for (let l = 0; l < 3; l++) {
    const c = fresh(l, 0, true);
    c.startLevel(l);
    runTo(c, 6);
    ok(c.screen() === 6 && c.culminations() === 1, `demo level ${l + 1} victory, culmination exactly once`);
  }
}
{ // 4: face sequence F-03 -> F-05 -> F-10 in order, weather 4 then 5
  const c = fresh(2, 0, true); c.startLevel(2);
  const first = {};
  let n = 0;
  while (c.screen() !== 6 && n < 30000) {
    c.step(16, 0); n++;
    const f = c.face();
    if (!(f in first)) first[f] = n;
    if (c.phase() === PHASE.PEAK && !("wp" in first)) first.wp = c.weather();
    if (c.phase() === PHASE.DAZE && !("wd" in first)) first.wd = c.weather();
  }
  ok(first[FACE.EDGE] < first[FACE.PEAK] && first[FACE.PEAK] < first[FACE.DAZE], "face order F-03 < F-05 < F-10");
  ok(first.wp === 4 && first.wd === 5, "weather 4 at peak, 5 in daze");
}
{ // 5: PEAK lasts 3000 ms, DAZE 6000 ms (188 / 375 steps at 16 ms)
  const c = fresh(0, 0, true); c.startLevel(0);
  let guard = 0;
  while (c.phase() !== PHASE.PEAK && guard++ < 20000) c.step(16, 0);
  for (let i = 0; i < 187; i++) c.step(16, 0);
  ok(c.phase() === PHASE.PEAK, "still peak at 2992 ms");
  c.step(16, 0);
  ok(c.phase() === PHASE.DAZE, "daze at 3008 ms (>= 3000)");
  for (let i = 0; i < 374; i++) c.step(16, 0);
  ok(c.phase() === PHASE.DAZE, "still daze at +5984 ms");
  c.step(16, 0);
  ok(c.phase() === PHASE.DONE && c.screen() === 6, "victory at daze end (>= 6000 ms)");
}
{ // 6: girl decoupling — identical state traces for all three girls
  const traces = [];
  for (let g = 0; g < 3; g++) {
    const c = fresh(1, g, true, 42); c.startLevel(1);
    const tr = [];
    let n = 0;
    while (c.screen() !== 6 && n < 20000) {
      c.step(16, 0); n++;
      if (n % 50 === 0) tr.push([c.tier(), c.phase(), c.face(), c.weather(), c.culminations()]);
    }
    traces.push(JSON.stringify(tr));
  }
  ok(traces[0] === traces[1] && traces[1] === traces[2], "girl swap changes no engine state");
}
{ // 7: settings + records bridges round-trip
  const c = fresh(0);
  c.applySettings(true, true);
  c.applyRecords(5, 3);
  ok(c.settingsBits() === 3 && c.recordsWins() === 5 && c.recordsBest() === 3, "bridges round-trip");
}

// --- adversarial ---
{ // 8: holding forever never culminates; three slips end the session
  const c = fresh(0); c.startLevel(0);
  let n = 0;
  while (c.screen() !== 7 && n < 20000) { c.step(16, IN.HOLD); n++; }
  ok(c.screen() === 7 && c.culminations() === 0 && c.slips() >= 3, "hold-forever: 0 culminations, failed by slips");
}
{ // 9: one edge slip — 1200 ms held at the edge returns to half rise
  const c = fresh(0); c.startLevel(0);
  for (let i = 0; i < 250; i++) c.step(16, IN.HOLD);
  for (let i = 0; i < 74; i++) c.step(16, IN.HOLD);
  ok(c.phase() === PHASE.EDGE, "no slip before 1200 ms strain");
  c.step(16, IN.HOLD);
  ok(c.phase() === PHASE.RISE && c.progressMs() === 2000 && c.slips() === 1, "slip at 1200 ms strain, rise halved");
}
{ // 10: holding through the peak cannot re-fire culmination
  const c = fresh(0); c.startLevel(0);
  let guard = 0; // manual demo policy until peak
  while (c.phase() !== PHASE.PEAK && guard++ < 20000) c.step(16, c.phase() === PHASE.RISE ? IN.HOLD : 0);
  for (let i = 0; i < 2000; i++) c.step(16, IN.HOLD); // hold through peak + daze
  ok(c.culminations() === 1 && c.screen() === 6, "held through peak: still exactly one culmination");
}
{ // 11: the session clock ends an idle session (L1 limit 90000 ms)
  const c = fresh(0); c.startLevel(0);
  let n = 0;
  while (c.screen() !== 7 && n < 20000) { c.step(16, 0); n++; }
  ok(c.screen() === 7 && c.elapsedMs() > 90000, "idle session fails on the clock");
}
{ // 12: invalid level/girl rejected; bridges clamp hostile values
  const c = createCore();
  ok(c.init(1, 9, false, 0) !== 0 && c.init(1, 0, false, 7) !== 0, "init rejects bad level and girl");
  const d = fresh(0);
  ok(d.startLevel(9) !== 0 && d.startLevel(-1) !== 0, "start_level rejects out-of-range levels");
  d.applyRecords(100000, -5);
  ok(d.recordsWins() === 999 && d.recordsBest() === 0, "records clamp hostile values");
}
{ // 13: hostile step inputs are bounded (dt clamp, bit mask)
  const c = fresh(0); c.startLevel(0);
  c.step(100000, 0xffffff);
  ok(c.progressMs() <= 50, "dt clamped to 50 ms under hostile step");
  const e = fresh(0); e.startLevel(0);
  e.step(-16, IN.HOLD);
  ok(e.progressMs() === 0, "negative dt clamps to zero");
}
{ // 14: determinism — same seed and inputs, byte-identical draw lists
  const a = fresh(2, 1, true, 99); a.startLevel(2);
  const b = fresh(2, 1, true, 99); b.startLevel(2);
  let same = true;
  for (let i = 0; i < 3000; i++) {
    a.step(16, 0); b.step(16, 0);
    if (i % 250 === 0 && a.draw() !== b.draw()) same = false;
  }
  ok(same, "identical seed + inputs => identical draw lists");
}
console.log(`core.test: ${passed} checks passed`);
