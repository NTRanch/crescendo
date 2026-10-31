# Port-Back — Crescendo

Filed at the week's close (v1.0.0, 2026-10-30). The full note lives
in `docs/PORT-BACK.md`; this chapter is its book form.

- **Verdict:** It plays. The canon tempos (T1 4+4 / T2 7+6 /
  T3 11+9 / T4 16+12 s) resolve to step counts 250/250, 438/375,
  688/563, 1000/750 at 16 ms steps; the edge verb pair (hold the
  rise, release the edge) is legible from the face alone; demo
  runs complete all three levels for all three girls with
  culmination exactly once every time.
- **Numbers:** GDScript suite 28/28 · JS suite 26/26 ·
  conformance 7/7 scenarios, 242 samples, zero drift · playtest
  9/9 victories (30.0 s / 50.0 s / 78.0 s) · 0.015 ms/step ·
  page 27,340 bytes · previews 3 × 12.1 s, ~22 KB each.
- **Tier-feel findings:** sub-step quantisation on T2/T3 is
  <16 ms and should be documented, not hidden; session clocks at
  ~2× the perfect run are the right pressure; the edge needs a
  named verb in the spec (slip at 1200 ms strain here).
- **Per-girl face-coupling deltas:** blush gain is the strongest
  per-girl channel; gaze deltas under ~8 px at 960-logical scale
  do not read; pupil accent swaps read instantly.
- **Spec-divergence list:** six findings (D-1…D-6 in
  `docs/PORT-BACK.md`) — peak/daze durations, the edge verb, rise
  decay, the culmination trigger, the weather map, and the lose
  condition were all unstated in the spec as written. Timings and
  exactly-once were fully specified. The spec is ~80% complete;
  the interaction layer is the missing 20%.
- **Language verdict (GDScript / Godot):** the headless pure-core
  loop is the cheapest in the program — parse check, 28-check
  suite, and vector dump all from `godot --headless --script`.
  Costs: `JSON.stringify` sorts dictionary keys (canonicalise in
  consumers), and test scaffolding is hand-rolled. GDScript stays
  in the rotation; for spec-honesty weeks it may be the best seat
  in the house.
- **Breakage:** `docs/BREAKAGE-LOG.md` (B-1 key-order harness fix;
  B-2 Godot web export = primo follow-up, filed not faked;
  B-3 GJ-07 live check open; B-4 seahawk primo leg deferred).
- **§9 transfer filing:** tier quantisation note, edge-verb
  pattern, clock-ratio rule, blush-gain coupling, and the
  conformance-harness shape are SFW technique, filed for
  transfer. Session scripts, face staging as shipped, and the
  girl parameter sets are NSFW-pure and stay in this lane.
