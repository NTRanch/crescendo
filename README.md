# Crescendo

**Nice Thoughts Ranch** · Torogao Jam Program week 6 (Wave B — Sound) · The engine, cast-rotating · **GDScript / Godot**

arousal-engine/1, run honestly — the same build selectable with three girls' face sets.

An 18+ game built for the weekly Gameotron jam on itch.io (NTRanch), as one
rung of the 14-week Torogao system-validation program (D-333/D-334/D-335/D-336).
The full planning book lives in [`book/`](book/) (mdBook, NTRanch theme);
this repo's bloch roadmap is [`.ai/roadmap.md`](.ai/roadmap.md).

## Play

Open `web/index.html` (one self-contained file, works offline). Confirm
the 18+ gate, pick a girl and a level on the title, and play:

- **HOLD** SPACE (or press and hold) to build each tier's **rise**.
- **RELEASE** at the **edge** — holding there strains her; 1200 ms of
  strain is a slip back to half rise, and three slips end the session.
- Tiers run at canon tempo: **T1 4+4 s, T2 7+6 s, T3 11+9 s, T4 16+12 s**
  (rise+hold). Weather shifts at every tier boundary.
- Reach the level's target tier and the culmination package runs:
  anticipation at the edge (**F-03**), the peak (**F-05**, solid heart
  pupils) — exactly **once**, latched — then the daze after (**F-10**).
- The session clock is the other opponent: idle or slip too long and
  the session ends.

The three girls — **Prima, Yui, Alma** — are parameter sets only:
palette, blush, gaze. Swapping the girl changes the performance and
nothing else; the engine state traces are bit-identical across girls
(proven by the conformance suite, not asserted).

## Levels

1. **First Swell** — target T2, 90 s clock. The two-tempo lesson.
2. **The Long Rise** — target T3, 120 s clock.
3. **Full Crescendo** — the full T4 arc, 150 s clock.

## Previews

Rendered from the shipped build's demo mode (`tools/capture.mjs`).
Levels run 30–78 s at canon durations, longer than a 12 s preview:
each video shows the **opening 12 s** — the rise through the first
tiers — which is the preview's job.

- [Level 1 — First Swell](docs/previews/level-1-crescendo.mp4)
- [Level 2 — The Long Rise](docs/previews/level-2-crescendo.mp4)
- [Level 3 — Full Crescendo](docs/previews/level-3-crescendo.mp4)

## Build & verify

The native core is GDScript (`scripts/crescendo_core.gd`, a pure
RefCounted class — no scene tree), verified headless under Godot
4.7.2. The shipped page is the JS realization of the same core
(`web/core.mjs`), gated **exactly** by conformance vectors dumped
from the GDScript core (`conformance/vectors.json`). Godot's own web
export is a primo follow-up (see `docs/BREAKAGE-LOG.md`) — the jam
contract's engine-week seam, never faked.

```
just check     # all gates (see justfile; sandbox runs them directly)
just previews  # re-render the three preview MP4s
just book      # build the planning book
```

Gates at v1.0.0: GDScript headless suite 28/28 · JS unit tests 26/26 ·
conformance 7/7 scenarios exact (242 samples) · demo playtest
3 levels × 3 girls, culmination exactly once every run · step+draw
0.015 ms/step · page 27,340 bytes.

- **Cast/art law (D-292):** abstract-symbolic staging only — drawn
  shapes, light, typography. No generated characters.
- **Audio:** generated WebAudio answering input only; nothing is ever
  played aloud by an agent; the Owner presses play.

Status: **v1.0.0** — see `CHANGELOG.md`, `docs/PLAYTEST-2026-10-30.md`,
`docs/PORT-BACK.md`.
