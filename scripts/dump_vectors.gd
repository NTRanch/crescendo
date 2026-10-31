## scripts/dump_vectors.gd — dump conformance/vectors.json from the
## GDScript core. Run: godot --headless --path . --script scripts/dump_vectors.gd
## Scenarios mirror tools/scenarios.mjs exactly.
extends SceneTree

const Core = preload("res://scripts/crescendo_core.gd")


func _sample(c, step: int) -> Array:
	return [step, c.tier(), c.phase(), c.face_state(), c.weather_state(), c.culminations(), c.screen(), c.progress_ms(), c.edge_ms()]


func _final(c, steps: int) -> Dictionary:
	return {"screen": c.screen(), "culm": c.culminations(), "slips": c.slips(), "elapsed": c.elapsed_ms(), "steps": steps}


func _run_demo(level: int, seed_value: int, girl: int, every: int) -> Dictionary:
	var c = Core.new()
	c.init_game(seed_value, level, true, girl)
	c.start_level(level)
	var samples: Array = []
	var steps: int = 0
	while c.screen() != 6 and c.screen() != 7 and steps < 20000:
		c.step(16, 0)
		steps += 1
		if steps % every == 0:
			samples.append(_sample(c, steps))
	return {"samples": samples, "final": _final(c, steps)}


func _run_pattern(level: int, seed_value: int, girl: int) -> Dictionary:
	var c = Core.new()
	c.init_game(seed_value, level, false, girl)
	c.start_level(level)
	var samples: Array = []
	for step in range(1, 4001):
		var bits: int = Core.IN_HOLD if (step / 250) % 2 == 0 else 0
		c.step(16, bits)
		if step % 50 == 0:
			samples.append(_sample(c, step))
	return {"samples": samples, "final": _final(c, 4000)}


func _run_hold_forever(level: int, seed_value: int, girl: int) -> Dictionary:
	var c = Core.new()
	c.init_game(seed_value, level, false, girl)
	c.start_level(level)
	var samples: Array = []
	var steps: int = 0
	while c.screen() != 7 and steps < 20000:
		c.step(16, Core.IN_HOLD)
		steps += 1
		if steps % 200 == 0:
			samples.append(_sample(c, steps))
	return {"samples": samples, "final": _final(c, steps)}


func _scenario(name: String, body: Dictionary) -> Dictionary:
	return {"name": name, "samples": body["samples"], "final": body["final"]}


func _initialize() -> void:
	var scenarios: Array = [
		_scenario("demo-l1", _run_demo(0, 101, 0, 100)),
		_scenario("demo-l3", _run_demo(2, 7, 0, 100)),
		_scenario("pattern-l2", _run_pattern(1, 5, 0)),
		_scenario("hold-forever-l1", _run_hold_forever(0, 3, 0)),
		_scenario("girls-prima", _run_demo(1, 42, 0, 100)),
		_scenario("girls-yui", _run_demo(1, 42, 1, 100)),
		_scenario("girls-alma", _run_demo(1, 42, 2, 100)),
	]
	var doc: Dictionary = {"scenarios": scenarios}
	var f := FileAccess.open("res://conformance/vectors.json", FileAccess.WRITE)
	if f == null:
		printerr("dump: cannot open conformance/vectors.json for writing")
		quit(1)
		return
	f.store_string(JSON.stringify(doc))
	f.close()
	print("dump: wrote conformance/vectors.json (%d scenarios)" % scenarios.size())
	quit(0)
