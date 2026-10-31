// capture.mjs — render a preview MP4 from the REAL shipped realization
// in demo mode. Usage: node tools/capture.mjs <level 0..2> <seed>
// Steps at 16 ms, samples every 6th step (~10 fps) for 12 s. Levels run
// longer than 12 s at canon durations; the preview shows the opening —
// the rise through the first tiers — by design (see README).
import { mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createGame } from "../web/game.mjs";
import { rasterise, writePNG } from "./raster.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const [levelArg, seedArg, outArg] = process.argv.slice(2);
const level = Number(levelArg ?? 0);
const seed = Number(seedArg ?? 20266);
const girls = [0, 1, 2];
const out = outArg ?? join(root, `docs/previews/level-${level + 1}-crescendo.mp4`);

const game = await createGame(null, { seed, level, demo: true, girl: girls[level] });
game.startLevel(level);
const framesDir = join(root, ".capture-frames");
rmSync(framesDir, { recursive: true, force: true });
mkdirSync(framesDir, { recursive: true });
const totalSteps = 60 * 12;
let shot = 0;
for (let s = 0; s <= totalSteps; s++) {
  game.step(0);
  if (s % 6 === 0) {
    const px = rasterise(game.frame());
    writePNG(join(framesDir, `f${String(shot).padStart(4, "0")}.png`), px, 480, 480);
    shot++;
  }
}
mkdirSync(dirname(out), { recursive: true });
const ff = spawnSync("/usr/bin/ffmpeg", [
  "-y", "-framerate", "10", "-i", join(framesDir, "f%04d.png"),
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "26", "-movflags", "+faststart", out,
], { stdio: "inherit" });
rmSync(framesDir, { recursive: true, force: true });
if (ff.status !== 0) process.exit(ff.status ?? 1);
console.log(`captured level ${level + 1}: ${shot} frames -> ${out}`);
