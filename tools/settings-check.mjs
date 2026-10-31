// settings-check.mjs — gates R-202/R-203/R-403: settings AND records
// bridges round-trip (with clamping), and the settings screen is
// reachable from boot with no progression.
import { createGame, INPUT } from "../web/game.mjs";

const game = await createGame(null, { seed: 7, level: 0, demo: false });
function steps(n, bits = 0) { for (let i = 0; i < n; i++) game.step(bits); }
function pulse(bits) { game.step(bits); game.step(0); }
function fail(msg) { console.error(`settings-check: ${msg}`); process.exit(1); }

if (game.screen() !== 0) fail("boot screen is not the 18+ gate");
game.applySettings(true, false);
if (game.settingsBits() !== 1) fail("apply_settings(weather) did not round-trip");
game.applySettings(false, true);
if (game.settingsBits() !== 2) fail("apply_settings(text) did not round-trip");
game.applySettings(true, true);
game.applyRecords(2, 3);
if (game.recordsWins() !== 2 || game.recordsBest() !== 3) fail("apply_records did not round-trip");
game.applyRecords(5000, 99);
if (game.recordsWins() !== 999 || game.recordsBest() !== 4) fail("apply_records did not clamp");

// gate -> title -> (menu down x4) -> settings, no play first.
pulse(INPUT.confirm);
if (game.screen() !== 1) fail("confirm did not leave the gate");
for (let i = 0; i < 4; i++) pulse(INPUT.down);
pulse(INPUT.confirm);
if (game.screen() !== 5) fail(`settings not reachable from title (screen=${game.screen()})`);
steps(2);
if (!game.frameText().includes("REDUCED")) fail("settings screen does not show restored REDUCED weather");
if (!game.frameText().includes("LARGE")) fail("settings screen does not show restored LARGE text");
// records render on the title
pulse(INPUT.back);
if (game.screen() !== 1) fail("back did not return to title");
steps(1);
if (!game.frameText().includes("SESSIONS WON 999")) fail("title does not render restored records");
console.log("settings-check: settings + records bridges round-trip and clamp; settings reachable ungated; restored values render");
