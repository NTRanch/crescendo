// game.mjs — Crescendo wrapper. Shared by the shipped page (inlined by
// tools/assemble.mjs) and the node capture/playtest/conformance tools.
// The realization of record is web/core.mjs; this wrapper only adapts
// its API to the estate harness shape.
import { createCore, IN } from "./core.mjs";

export const PALETTE = [
  "#0d0208", "#ff2e88", "#f8f0ed", "#ac9393", "#540e46",
  "#ec8584", "#eaeaea", "#68636c", "#ffd166", "#1a0510",
];
export const INPUT = {
  hold: IN.HOLD, confirm: IN.CONFIRM, back: IN.BACK, pause: IN.PAUSE,
  up: IN.UP, down: IN.DOWN, left: IN.LEFT, right: IN.RIGHT,
};

export function parseDrawList(text) {
  const ops = [];
  for (const line of text.split("\n")) {
    if (!line) continue;
    const kind = line[0];
    if (kind === "t") {
      const parts = line.split(" ");
      ops.push(["t", +parts[1], +parts[2], +parts[3], +parts[4], parts.slice(5).join(" ")]);
    } else {
      const parts = line.split(" ").map(Number);
      ops.push([kind, ...parts.slice(1)]);
    }
  }
  return ops;
}

export async function createGame(_ignored, { seed = 1, level = 0, demo = false, girl = 0 } = {}) {
  const core = createCore();
  const status = core.init(seed, level, demo, girl);
  if (status !== 0) throw new Error(`core init rejected level ${level} girl ${girl} (status ${status})`);
  return {
    core,
    startLevel(l) {
      const s = core.startLevel(l);
      if (s !== 0) throw new Error(`core start_level rejected ${l}`);
    },
    step(inputBits) { core.step(16, inputBits >>> 0); },
    screen: () => core.screen(),
    levelIdx: () => core.levelIdx(),
    girlIdx: () => core.girlIdx(),
    tier: () => core.tier(),
    phase: () => core.phase(),
    face: () => core.face(),
    weather: () => core.weather(),
    culminations: () => core.culminations(),
    slips: () => core.slips(),
    elapsedMs: () => core.elapsedMs(),
    progressMs: () => core.progressMs(),
    edgeMs: () => core.edgeMs(),
    event: () => core.event(),
    applySettings(w, t) { core.applySettings(w, t); },
    settingsBits: () => core.settingsBits(),
    applyRecords(w, b) { core.applyRecords(w, b); },
    recordsWins: () => core.recordsWins(),
    recordsBest: () => core.recordsBest(),
    frameText: () => core.draw(),
    frame() { return { palette: PALETTE, ops: parseDrawList(this.frameText()) }; },
  };
}
