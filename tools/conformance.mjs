// conformance.mjs — the JS realization must reproduce the GDScript
// core's dumped vectors EXACTLY (integer state traces), and the three
// girl traces must be identical to each other (decoupling law).
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runAll, makeJsCore } from "./scenarios.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const expected = JSON.parse(readFileSync(join(root, "conformance/vectors.json"), "utf8"));
const actual = runAll(makeJsCore);

// Godot's JSON.stringify emits dictionary keys alphabetically; JS keeps
// insertion order. Samples (arrays) compare exactly as-is; the final
// record compares through a canonical key-sorted form.
function canon(v) {
  if (Array.isArray(v)) return v.map(canon);
  if (v && typeof v === "object") {
    return Object.fromEntries(Object.keys(v).sort().map((k) => [k, canon(v[k])]));
  }
  return v;
}

let failures = 0;
for (let i = 0; i < expected.scenarios.length; i++) {
  const e = expected.scenarios[i], a = actual.scenarios[i];
  if (JSON.stringify(canon(e)) !== JSON.stringify(canon(a))) {
    failures++;
    console.error(`conformance: scenario ${e.name} diverges`);
    const n = Math.max(e.samples.length, a.samples.length);
    for (let j = 0; j < n; j++) {
      if (JSON.stringify(e.samples[j]) !== JSON.stringify(a.samples[j])) {
        console.error(`  first sample drift at ${j}: gd=${JSON.stringify(e.samples[j])} js=${JSON.stringify(a.samples[j])}`);
        break;
      }
    }
    console.error(`  final gd=${JSON.stringify(e.final)} js=${JSON.stringify(a.final)}`);
  } else {
    console.log(`conformance: ${e.name} exact (${e.samples.length} samples)`);
  }
}
const girls = actual.scenarios.slice(4);
if (JSON.stringify(girls[0].samples) !== JSON.stringify(girls[1].samples)
  || JSON.stringify(girls[1].samples) !== JSON.stringify(girls[2].samples)) {
  failures++;
  console.error("conformance: girl traces diverge — decoupling law broken");
} else {
  console.log("conformance: girl traces identical across Prima/Yui/Alma");
}
if (failures) process.exit(1);
console.log("conformance: JS realization == GDScript core on all vectors");
