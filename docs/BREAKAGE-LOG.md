# Breakage log — Crescendo

Every breakage found in playtest or build lands here with: what broke, the
evidence, the bloch attempt id, and the fix or the filed finding. Copied to
bloch at the week's close (the log is the input, bloch is the record).

## B-1 — Conformance harness: JSON key order is not an engine invariant
- **What:** First conformance run reported all 7 scenarios divergent
  while every sample array and every final *value* was identical.
- **Evidence:** Godot's `JSON.stringify` emits dictionary keys
  alphabetically (`culm, elapsed, screen, slips, steps`); JS kept
  insertion order. Diff was confined to the `final` record's key order.
- **Fix:** `tools/conformance.mjs` compares finals through a canonical
  key-sorted form; sample arrays still compare exactly. Re-run:
  7/7 exact, 242 samples. Filed in PORT-BACK as a portability finding.

## B-2 — Godot web export not attempted in the sandbox (engine-week seam)
- **What:** The PLANNING delivery line names a Godot 4 web export with
  a single-file template. The sandbox Godot 4.7.2 is the editor binary;
  export templates are not installed here, and the program contract
  (PLAN.md engine-week rule) assigns engine-native packaging to a
  primo follow-up.
- **Evidence:** `~/workspace/tools/godot/` contains only the editor
  binary; no `export_templates/` present. The shipped artefact is
  therefore the contract's sanctioned shape: the tested GDScript core
  (headless-verified 28/28) + the JS realization of the same core,
  conformance-exact, in the single `web/index.html`.
- **Disposition:** FILED, not faked. Primo follow-up: install export
  templates, prove the single-file template on this project, compare.

## B-3 — GJ-07 live itch verification (R-904) stays OPEN
- **What:** The 18+ flag, content warnings and itch ToS screen can only
  be verified live at entry time on the itch project page.
- **Disposition:** OPEN by design; the in-game 18+ gate is screen 0 and
  ships in the build. R-904 is not flipped.

## B-4 — Seahawk playtest (R-905's primo leg) deferred
- **What:** R-905 is flipped on the sandbox playtest of record
  (`docs/PLAYTEST-2026-10-30.md`); the seahawk pass on primo rides
  tunnel recovery, like every other game in the program.
- **Disposition:** Sandbox evidence stands; primo leg queued.

## Notes (not breakage)
- The sandbox has no `just` binary; justfile recipes were verified by
  running their commands directly, in order, at gate time.
- Sandbox clock reads 2026-10-31 UTC; records are dated by the
  program's local date, 2026-10-30 PDT, matching the sibling games.
