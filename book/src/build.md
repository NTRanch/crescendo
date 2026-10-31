# Build & Delivery — Crescendo

**Language:** GDScript / Godot (tiger-style-gdscript)

**Delivery shape (as built, v1.0.0):** per the program contract's
engine-week rule, the shipped artefact is the tested native core plus
a JS realization of the same core sharing behaviour through
conformance vectors: `scripts/crescendo_core.gd` (pure RefCounted,
headless-verified under Godot 4.7.2 in the sandbox) +
`web/core.mjs`, gated exactly by `conformance/vectors.json`, in the
single self-contained `web/index.html`. The Godot 4 web export with
a single-file template (.pck embedded) remains the named seam and a
primo follow-up — export templates are not installed in the sandbox;
filed as breakage B-2, never faked.

**Jam rule:** one self-contained `index.html`, ≥6 screens (Title / Pause /
How to Play / Gameplay / Settings / Game Over-or-Victory), documented
process (GAMEOTRON orchestrates; the language build chain is part of the
documentation).

**Book:** `mdbook build book` renders this planning book to `book/html/`
with the NTRanch theme (dark background, hot pink).
