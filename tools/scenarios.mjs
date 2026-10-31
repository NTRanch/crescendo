// scenarios.mjs — the conformance scenario definitions, shared by the
// JS conformance check. The GDScript dump tool (scripts/dump_vectors.gd)
// implements the identical scenarios; any drift is a spec finding.
import { createCore, IN } from "../web/core.mjs";

export function sample(c, step) {
  return [step, c.tier(), c.phase(), c.face(), c.weather(), c.culminations(), c.screen(), c.progressMs(), c.edgeMs()];
}
export function finalOf(c, steps) {
  return { screen: c.screen(), culm: c.culminations(), slips: c.slips(), elapsed: c.elapsedMs(), steps };
}
export function runDemo(core, level, seed, girl, every, maxSteps = 20000) {
  if (core.init(seed, level, true, girl) !== 0) throw new Error("init failed");
  core.startLevel(level);
  const samples = [];
  let steps = 0;
  while (core.screen() !== 6 && core.screen() !== 7 && steps < maxSteps) {
    core.step(16, 0); steps++;
    if (steps % every === 0) samples.push(sample(core, steps));
  }
  return { samples, final: finalOf(core, steps) };
}
export function runPattern(core, level, seed, girl) {
  if (core.init(seed, level, false, girl) !== 0) throw new Error("init failed");
  core.startLevel(level);
  const samples = [];
  for (let step = 1; step <= 4000; step++) {
    const bits = Math.floor(step / 250) % 2 === 0 ? IN.HOLD : 0;
    core.step(16, bits);
    if (step % 50 === 0) samples.push(sample(core, step));
  }
  return { samples, final: finalOf(core, 4000) };
}
export function runHoldForever(core, level, seed, girl) {
  if (core.init(seed, level, false, girl) !== 0) throw new Error("init failed");
  core.startLevel(level);
  const samples = [];
  let steps = 0;
  while (core.screen() !== 7 && steps < 20000) {
    core.step(16, IN.HOLD); steps++;
    if (steps % 200 === 0) samples.push(sample(core, steps));
  }
  return { samples, final: finalOf(core, steps) };
}
export function runAll(makeCore) {
  return {
    scenarios: [
      { name: "demo-l1", ...runDemo(makeCore(), 0, 101, 0, 100) },
      { name: "demo-l3", ...runDemo(makeCore(), 2, 7, 0, 100) },
      { name: "pattern-l2", ...runPattern(makeCore(), 1, 5, 0) },
      { name: "hold-forever-l1", ...runHoldForever(makeCore(), 0, 3, 0) },
      { name: "girls-prima", ...runDemo(makeCore(), 1, 42, 0, 100) },
      { name: "girls-yui", ...runDemo(makeCore(), 1, 42, 1, 100) },
      { name: "girls-alma", ...runDemo(makeCore(), 1, 42, 2, 100) },
    ],
  };
}
export function makeJsCore() { return createCore(); }
