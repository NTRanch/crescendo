## tests/run_tests.gd — headless engine-law suite for the GDScript core.
## Run: godot --headless --path . --script tests/run_tests.gd
## Half validation, half adversarial (estate split). Prints one line per
## check and quits non-zero if any check failed.
extends SceneTree

const Core = preload("res://scripts/crescendo_core.gd")

var _passed: int = 0
var _failed: int = 0


func _ok(cond: bool, name: String) -> void:
	if cond:
		_passed += 1
		print("ok %d - %s" % [_passed + _failed, name])
	else:
		_failed += 1
		printerr("FAIL - %s" % name)


func _fresh(level: int = 0, girl: int = 0, demo: bool = false, seed_value: int = 11) -> RefCounted:
	var c = Core.new()
	if c.init_game(seed_value, level, demo, girl) != 0:
		printerr("init failed")
		quit(2)
	return c


func _run_to(c, target: int, max_steps: int = 30000) -> int:
	var n: int = 0
	while c.screen() != target and n < max_steps:
		c.step(16, 0)
		n += 1
	return n


func _t_rise_exact() -> void:
	var c = _fresh(0)
	c.start_level(0)
	for i in range(249):
		c.step(16, Core.IN_HOLD)
	_ok(c.phase() == Core.PHASE_RISE, "T1 still rising at 3984 ms held")
	c.step(16, Core.IN_HOLD)
	_ok(c.phase() == Core.PHASE_EDGE and c.face_state() == Core.FACE_EDGE, "T1 edge (F-03) at exactly 4000 ms")


func _t_edge_exact_weather() -> void:
	var c = _fresh(0)
	c.start_level(0)
	for i in range(250):
		c.step(16, Core.IN_HOLD)
	_ok(c.weather_state() == 0, "weather 0 in tier 1")
	for i in range(250):
		c.step(16, 0)
	_ok(c.tier() == 2 and c.weather_state() == 1 and c.phase() == Core.PHASE_RISE, "tier 2 + weather 1 after exact edge")


func _t_all_tiers_exact() -> void:
	var c = _fresh(2)
	c.start_level(2)
	var expect: Array = [[250, 250], [438, 375], [688, 563], [1000, 750]]
	var exact: bool = true
	for t in range(4):
		var rise_steps: int = 0
		while c.phase() == Core.PHASE_RISE and rise_steps < 2000:
			c.step(16, Core.IN_HOLD)
			rise_steps += 1
		if rise_steps != expect[t][0]:
			exact = false
		var edge_steps: int = 0
		while c.phase() == Core.PHASE_EDGE and edge_steps < 2000:
			c.step(16, 0)
			edge_steps += 1
		if edge_steps != expect[t][1]:
			exact = false
	_ok(exact, "all four tiers: rise+hold steps exact (250/250, 438/375, 688/563, 1000/750)")
	_ok(c.phase() == Core.PHASE_PEAK, "target tier edge ends in peak")


func _t_demo_levels() -> void:
	for l in range(3):
		var c = _fresh(l, 0, true)
		c.start_level(l)
		_run_to(c, 6)
		_ok(c.screen() == 6 and c.culminations() == 1, "demo level %d victory, culmination exactly once" % (l + 1))


func _t_face_order_weather() -> void:
	var c = _fresh(2, 0, true)
	c.start_level(2)
	var first: Dictionary = {}
	var n: int = 0
	while c.screen() != 6 and n < 30000:
		c.step(16, 0)
		n += 1
		if not first.has(c.face_state()):
			first[c.face_state()] = n
		if c.phase() == Core.PHASE_PEAK and not first.has("wp"):
			first["wp"] = c.weather_state()
		if c.phase() == Core.PHASE_DAZE and not first.has("wd"):
			first["wd"] = c.weather_state()
	_ok(first[Core.FACE_EDGE] < first[Core.FACE_PEAK] and first[Core.FACE_PEAK] < first[Core.FACE_DAZE], "face order F-03 < F-05 < F-10")
	_ok(first["wp"] == 4 and first["wd"] == 5, "weather 4 at peak, 5 in daze")


func _t_peak_daze_durations() -> void:
	var c = _fresh(0, 0, true)
	c.start_level(0)
	var guard: int = 0
	while c.phase() != Core.PHASE_PEAK and guard < 20000:
		c.step(16, 0)
		guard += 1
	for i in range(187):
		c.step(16, 0)
	_ok(c.phase() == Core.PHASE_PEAK, "still peak at 2992 ms")
	c.step(16, 0)
	_ok(c.phase() == Core.PHASE_DAZE, "daze at 3008 ms")
	for i in range(374):
		c.step(16, 0)
	_ok(c.phase() == Core.PHASE_DAZE, "still daze at +5984 ms")
	c.step(16, 0)
	_ok(c.phase() == Core.PHASE_DONE and c.screen() == 6, "victory at daze end")


func _t_girl_decoupling() -> void:
	var traces: Array = []
	for g in range(3):
		var c = _fresh(1, g, true, 42)
		c.start_level(1)
		var tr: Array = []
		var n: int = 0
		while c.screen() != 6 and n < 20000:
			c.step(16, 0)
			n += 1
			if n % 50 == 0:
				tr.append([c.tier(), c.phase(), c.face_state(), c.weather_state(), c.culminations()])
		traces.append(JSON.stringify(tr))
	_ok(traces[0] == traces[1] and traces[1] == traces[2], "girl traces identical (GDScript)")


func _t_bridges() -> void:
	var c = _fresh(0)
	c.apply_settings(true, true)
	c.apply_records(5, 3)
	_ok(c.settings_bits() == 3 and c.records_wins() == 5 and c.records_best() == 3, "bridges round-trip")


func _t_hold_forever() -> void:
	var c = _fresh(0)
	c.start_level(0)
	var n: int = 0
	while c.screen() != 7 and n < 20000:
		c.step(16, Core.IN_HOLD)
		n += 1
	_ok(c.screen() == 7 and c.culminations() == 0 and c.slips() >= 3, "hold-forever: 0 culminations, failed by slips")


func _t_slip_exact() -> void:
	var c = _fresh(0)
	c.start_level(0)
	for i in range(250):
		c.step(16, Core.IN_HOLD)
	for i in range(74):
		c.step(16, Core.IN_HOLD)
	_ok(c.phase() == Core.PHASE_EDGE, "no slip before 1200 ms strain")
	c.step(16, Core.IN_HOLD)
	_ok(c.phase() == Core.PHASE_RISE and c.progress_ms() == 2000 and c.slips() == 1, "slip at 1200 ms, rise halved")


func _t_hold_through_peak() -> void:
	var c = _fresh(0)
	c.start_level(0)
	var guard: int = 0
	while c.phase() != Core.PHASE_PEAK and guard < 20000:
		c.step(16, Core.IN_HOLD if c.phase() == Core.PHASE_RISE else 0)
		guard += 1
	for i in range(2000):
		c.step(16, Core.IN_HOLD)
	_ok(c.culminations() == 1 and c.screen() == 6, "held through peak: exactly one culmination")


func _t_idle_clock() -> void:
	var c = _fresh(0)
	c.start_level(0)
	var n: int = 0
	while c.screen() != 7 and n < 20000:
		c.step(16, 0)
		n += 1
	_ok(c.screen() == 7 and c.elapsed_ms() > 90000, "idle session fails on the clock")


func _t_hostile_inputs() -> void:
	var c = Core.new()
	_ok(c.init_game(1, 9, false, 0) != 0 and c.init_game(1, 0, false, 7) != 0, "init rejects bad level and girl")
	var d = _fresh(0)
	_ok(d.start_level(9) != 0 and d.start_level(-1) != 0, "start_level rejects out-of-range")
	d.apply_records(100000, -5)
	_ok(d.records_wins() == 999 and d.records_best() == 0, "records clamp hostile values")
	var e = _fresh(0)
	e.start_level(0)
	e.step(100000, 0xFFFFFF)
	_ok(e.progress_ms() <= 50, "dt clamped under hostile step")
	var f2 = _fresh(0)
	f2.start_level(0)
	f2.step(-16, Core.IN_HOLD)
	_ok(f2.progress_ms() == 0, "negative dt clamps to zero")


func _t_determinism() -> void:
	var a = _fresh(2, 1, true, 99)
	a.start_level(2)
	var b = _fresh(2, 1, true, 99)
	b.start_level(2)
	var same: bool = true
	for i in range(3000):
		a.step(16, 0)
		b.step(16, 0)
		if i % 250 == 0 and a.draw() != b.draw():
			same = false
	_ok(same, "identical seed + inputs => identical draw lists (GDScript)")


func _initialize() -> void:
	_t_rise_exact()
	_t_edge_exact_weather()
	_t_all_tiers_exact()
	_t_demo_levels()
	_t_face_order_weather()
	_t_peak_daze_durations()
	_t_girl_decoupling()
	_t_bridges()
	_t_hold_forever()
	_t_slip_exact()
	_t_hold_through_peak()
	_t_idle_clock()
	_t_hostile_inputs()
	_t_determinism()
	print("gd-tests: %d passed, %d failed" % [_passed, _failed])
	quit(1 if _failed > 0 else 0)
