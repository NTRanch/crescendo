// perf.mjs — gates R-401: step+draw must stay far inside the 16 ms
// step budget; the assembled single file stays under 512 KB.
import { statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createGame } from "../web/game.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const game = await createGame(null, { seed: 31, level: 2, demo: true });
game.startLevel(2);
const t0 = performance.now();
for (let i = 0; i < 10_000; i++) { game.step(0); game.frameText(); }
const ms = performance.now() - t0;
const pageSize = statSync(join(root, "web/index.html")).size;
console.log(`perf: 10000 step+draw pairs in ${ms.toFixed(1)} ms (${(ms / 10000).toFixed(3)} ms/step); page ${pageSize} bytes`);
if (ms >= 5000) { console.error("perf: step budget exceeded"); process.exit(1); }
if (pageSize >= 524288) { console.error("perf: page size budget exceeded"); process.exit(1); }
console.log("perf: within budget");
