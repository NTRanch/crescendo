# Crescendo — task recipes (wired at the v1.0 build, 2026-10-30).
# Godot 4.7.2 lives at ~/workspace/tools/godot in the sandbox; on primo
# use the toolchain of record for the estate. NOTE: the sandbox has no
# `just` binary — every recipe below was gate-verified by running its
# commands directly (see docs/PLAYTEST-2026-10-30.md).

GODOT := env_var_or_default("GODOT", join(home_dir(), "workspace/tools/godot/Godot_v4.7.2-stable_linux.x86_64"))

# Assemble the single-file jam entry (JS realization into web/index.html)
build:
    node tools/assemble.mjs

# Run every gate: GDScript parse + headless suite, JS unit tests,
# conformance against the GDScript vectors, bridges, perf, playtest
check:
    {{GODOT}} --headless --check-only --script scripts/crescendo_core.gd
    {{GODOT}} --headless --path . --script tests/run_tests.gd
    node tests/core.test.mjs
    node tools/assemble.mjs
    node tools/conformance.mjs
    node tools/settings-check.mjs
    node tools/perf.mjs
    node tools/playtest.mjs

# Re-dump the conformance vectors from the GDScript core of record
vectors:
    {{GODOT}} --headless --path . --script scripts/dump_vectors.gd

# Render the per-level preview videos from the shipped build (demo mode)
previews:
    node tools/capture.mjs 0 20266
    node tools/capture.mjs 1 20266
    node tools/capture.mjs 2 20266

# Build the planning book
book:
    mdbook build book
