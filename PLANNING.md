# Planning — Crescendo

- **Program:** Torogao Jam Program (D-333), week 6 of 14, Wave B — Sound
- **Cast:** The engine, cast-rotating
- **Language:** GDScript / Godot (tiger-style-gdscript)
- **Canon core:** arousal-engine/1, run honestly — the same build selectable with three girls' face sets.

## Mechanism group (D-334: primary + coupled + persistence/revelation + feel)

- Tiers T1–T4 at their canon durations
- Exactly-once culmination
- Face coupling (F-03 at edge, F-05 at peak, F-10 in the daze after)
- The culmination package end-to-end
- Weather shift at tier boundaries
- Engine/girl decoupling — swapping the girl changes the performance and nothing else

## Validates

The engine's pacing in a player's hands — the package is 15/15 on tests; this is whether it plays — and whether the engine's spec (not its Rust code) is complete enough to re-implement faithfully in GDScript. Divergence between the two implementations is a spec finding, filed as such.

## Port-back

Tier-feel findings to the engine's tuning constants; per-girl face-coupling deltas; spec-divergence list; GDScript verdict.

## Delivery

Godot 4 web export with a single-file template (.pck embedded). Named seam: the fiddliest packaging in the program; the preflight proves the template before any game work starts. Toolchain home: primo (Godot lives there).

## Open preflight items

- GJ-06-class start gate for this week's toolchain (later weeks gate their
  own preflight; only W1's gate covers the program start).
- GJ-07: 18+ flag, content warnings listed, itch ToS screen — verified live
  at entry (the NSFW allowance clause is Owner-reported; re-verify on page).
- Engine-research chapter in the book: confirm the pinned library versions
  before the first build commit.
