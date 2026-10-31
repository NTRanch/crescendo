// playtest.mjs — the demo policy plays every level to victory against
// the shipped JS realization; face visitation (F-03, F-05, F-10) and
// exactly-once culmination are asserted on every level.
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createGame } from "../web/game.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
void root;
const SCREENS = ["gate", "title", "howto", "play", "pause", "settings", "victory", "gameover"];
let failures = 0;
for (let level = 0; level < 3; level++) {
  for (const girl of [0, 1, 2]) {
    const game = await createGame(null, { seed: 9000 + level, level, demo: true, girl });
    game.startLevel(level);
    const faces = new Set();
    let steps = 0;
    const maxSteps = (200 * 1000) / 16;
    while (game.screen() !== 6 && steps < maxSteps) {
      game.step(0);
      faces.add(game.face());
      steps++;
    }
    const won = game.screen() === 6;
    const ok = won && game.culminations() === 1 && faces.has(2) && faces.has(3) && faces.has(4);
    console.log(`level ${level + 1} girl ${girl}: screen=${SCREENS[game.screen()]} steps=${steps} culm=${game.culminations()} faces=${[...faces].sort().join(",")} ${ok ? "VICTORY" : "FAIL"}`);
    if (!ok) failures++;
  }
}
if (failures) { console.error(`playtest: ${failures} run(s) failed`); process.exit(1); }
console.log("playtest: all 3 levels x 3 girls completed, culmination exactly once, F-03/F-05/F-10 visited");
