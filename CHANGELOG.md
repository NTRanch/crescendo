# Changelog — Crescendo

All notable changes, newest first. Format: Keep a Changelog.

## [1.0.0] — 2026-10-30

- arousal-engine/1 implemented from spec in GDScript
  (`scripts/crescendo_core.gd`, pure RefCounted, integer-ms) and
  realized line-for-line in JS (`web/core.mjs`); conformance vectors
  dumped from the GDScript core gate the realization exactly
  (7 scenarios, 242 samples, zero drift).
- The full mechanism group playable in one self-contained
  `web/index.html`: tiers T1–T4 at canon durations (4+4 / 7+6 /
  11+9 / 16+12 s), edge/slip play (release at the edge; 1200 ms
  strain slips; three slips end it), exactly-once latched
  culmination, F-03 edge / F-05 peak (solid heart pupils) / F-10
  daze face coupling, weather shifting at tier boundaries.
- Three levels (First Swell → T2, The Long Rise → T3, Full
  Crescendo → T4) with session clocks; eight screens (18+ gate,
  title, how-to, play, pause, settings, victory, game over).
- Girl select (Prima / Yui / Alma) as parameter sets only —
  engine traces identical across girls, asserted in both suites.
- Settings (weather density, text size) and session records
  (wins, best tier) persist through core bridges + localStorage.
- Demo mode (`?demo=<level>&seed=<n>`) completes every level for
  every girl; preview MP4 per level in `docs/previews/`.
- Tests: GDScript headless suite 28 checks, JS suite 26 checks —
  each half validation, half adversarial (hold-forever,
  hold-through-peak, hostile dt/inputs, clock death).
- Spec-divergence findings filed in `docs/PORT-BACK.md` (the spec
  as written left peak/daze durations, edge play, and decay
  unstated; the resolutions are recorded there).

## [Unreleased]

- Repo scaffolded 2026-10-30: bloch roadmap (kind=game, lane=restricted),
  planning, per-game skill, baseline GDScript / Godot config, NTRanch-themed mdBook,
  brand-asset slots.
