# Build & Delivery — Crescendo

**Language:** GDScript / Godot (tiger-style-gdscript)

**Delivery shape:** Godot 4 web export with a single-file template (.pck embedded). Named seam: the fiddliest packaging in the program; the preflight proves the template before any game work starts. Toolchain home: primo (Godot lives there).

**Jam rule:** one self-contained `index.html`, ≥6 screens (Title / Pause /
How to Play / Gameplay / Settings / Game Over-or-Victory), documented
process (GAMEOTRON orchestrates; the language build chain is part of the
documentation).

**Book:** `mdbook build book` renders this planning book to `book/html/`
with the NTRanch theme (dark background, hot pink).
