# crescendo/scripts/main.gd — Crescendo (GDScript, Godot 4).
# Tiger Style (tiger-style-gdscript): static typing, bounded frame work,
# signal/scene-tree ownership discipline.
# The scene shell only hosts the pure core (scripts/crescendo_core.gd)
# in demo mode and reports its state; the scored game ships as the JS
# realization in web/index.html, conformance-gated against this core.
extends Node2D

const Core = preload("res://scripts/crescendo_core.gd")

var _core: RefCounted = null
var _report_accum_ms: int = 0


func _ready() -> void:
	_core = Core.new()
	if _core.init_game(20266, 2, true, 0) == 0:
		_core.start_level(2)
		print("crescendo: core booted in demo mode (FULL CRESCENDO)")


func _physics_process(delta: float) -> void:
	if _core == null:
		return
	_core.step(16, 0)
	_report_accum_ms += int(round(delta * 1000.0))
	if _report_accum_ms >= 5000:
		_report_accum_ms = 0
		print("crescendo: screen=%d tier=%d phase=%d face=%d culm=%d" % [
			_core.screen(), _core.tier(), _core.phase(), _core.face_state(), _core.culminations()])
