## crescendo/scripts/crescendo_core.gd — Crescendo (GDScript, Godot 4.7.2).
## arousal-engine/1 re-implemented FROM SPEC as a pure RefCounted class:
## no scene tree, no engine services, integer milliseconds only, seeded
## RNG injected at init. The JS realization (web/core.mjs) is a
## line-for-line port of this file, gated by conformance/vectors.json
## dumped from this core by scripts/dump_vectors.gd.
##
## Engine law (canon numbers): tiers T1..T4 rise+hold seconds
## 4+4, 7+6, 11+9, 16+12. RISE accrues while HELD, decays at dt/4
## released. EDGE accrues while RELEASED; holding adds strain —
## 1200 ms of strain is a SLIP back to half rise; three slips fail.
## Target tier's edge ends in PEAK: culmination fires EXACTLY ONCE
## (latched). PEAK 3000 ms (F-05), DAZE 6000 ms (F-10), then victory.
## Weather index == tier-1 in RISE/EDGE, 4 at PEAK, 5 in DAZE.
## Girls are draw parameter sets only; they never touch this machine.
class_name CrescendoCore
extends RefCounted

const TIERS: Array = [[4000, 4000], [7000, 6000], [11000, 9000], [16000, 12000]]
const LEVEL_NAMES: Array = ["FIRST SWELL", "THE LONG RISE", "FULL CRESCENDO"]
const LEVEL_TARGETS: Array = [2, 3, 4]
const LEVEL_LIMITS_MS: Array = [90000, 120000, 150000]
const GIRL_NAMES: Array = ["PRIMA", "YUI", "ALMA"]
const GIRL_ACCENT: Array = [1, 8, 5]
const GIRL_BLUSH_R: Array = [26, 20, 32]
const GIRL_GAZE_DY: Array = [0, 4, -3]
const GIRL_HAIR: Array = [4, 7, 3]
const PEAK_MS: int = 3000
const DAZE_MS: int = 6000
const STRAIN_MAX_MS: int = 1200
const SLIPS_MAX: int = 3
const DT_MAX_MS: int = 50
const MENU_ROWS: int = 5

const PHASE_RISE: int = 0
const PHASE_EDGE: int = 1
const PHASE_PEAK: int = 2
const PHASE_DAZE: int = 3
const PHASE_DONE: int = 4
const PHASE_FAILED: int = 5

const FACE_REST: int = 0
const FACE_BUILD: int = 1
const FACE_EDGE: int = 2
const FACE_PEAK: int = 3
const FACE_DAZE: int = 4

const EV_TIER: int = 1
const EV_PEAK: int = 2
const EV_DAZE: int = 4
const EV_VICTORY: int = 8
const EV_FAILED: int = 16
const EV_SLIP: int = 32
const EV_WEATHER: int = 64

const IN_HOLD: int = 1
const IN_CONFIRM: int = 2
const IN_BACK: int = 4
const IN_PAUSE: int = 8
const IN_UP: int = 16
const IN_DOWN: int = 32
const IN_LEFT: int = 64
const IN_RIGHT: int = 128

var _seed: int = 1
var _rng: int = 1
var _level: int = 0
var _girl: int = 0
var _demo: bool = false
var _screen: int = 0
var _menu_row: int = 0
var _settings_row: int = 0
var _weather_reduced: bool = false
var _text_large: bool = false
var _wins: int = 0
var _best_tier: int = 0
var _tier: int = 1
var _phase: int = PHASE_RISE
var _progress_ms: int = 0
var _edge_ms: int = 0
var _strain_ms: int = 0
var _phase_ms: int = 0
var _elapsed_ms: int = 0
var _slips: int = 0
var _culminations: int = 0
var _peak_latched: bool = false
var _frame: int = 0
var _last_event: int = 0
var _prev_bits: int = 0


func _rng_next() -> int:
	_rng = ((_rng * 1664525) + 1013904223) & 0xFFFFFFFF
	return _rng


func face_state() -> int:
	if _phase == PHASE_EDGE:
		return FACE_EDGE
	if _phase == PHASE_PEAK:
		return FACE_PEAK
	if _phase == PHASE_DAZE or _phase == PHASE_DONE:
		return FACE_DAZE
	if _phase == PHASE_RISE and _progress_ms * 2 >= TIERS[_tier - 1][0]:
		return FACE_BUILD
	return FACE_REST


func weather_state() -> int:
	if _phase == PHASE_PEAK:
		return 4
	if _phase == PHASE_DAZE or _phase == PHASE_DONE:
		return 5
	return _tier - 1


func _reset_run() -> void:
	_tier = 1
	_phase = PHASE_RISE
	_progress_ms = 0
	_edge_ms = 0
	_strain_ms = 0
	_phase_ms = 0
	_elapsed_ms = 0
	_slips = 0
	_culminations = 0
	_peak_latched = false


## Returns 0 on success, 1 for a bad level, 2 for a bad girl.
func init_game(seed_value: int, level: int, demo: bool, girl: int) -> int:
	if level < 0 or level >= LEVEL_NAMES.size():
		return 1
	if girl < 0 or girl >= GIRL_NAMES.size():
		return 2
	_seed = seed_value & 0xFFFFFFFF
	_rng = _seed
	if _rng == 0:
		_rng = 1
	_level = level
	_girl = girl
	_demo = demo
	_frame = 0
	_prev_bits = 0
	_last_event = 0
	_menu_row = 0
	_settings_row = 0
	_reset_run()
	_screen = 3 if _demo else 0
	return 0


func start_level(l: int) -> int:
	if l < 0 or l >= LEVEL_NAMES.size():
		return 1
	_level = l
	_reset_run()
	_screen = 3
	return 0


func set_girl(g: int) -> int:
	if g < 0 or g >= GIRL_NAMES.size():
		return 1
	_girl = g
	return 0


func _enter_peak(ev: int) -> int:
	if _peak_latched:
		return ev
	_peak_latched = true
	_culminations = 1
	_phase = PHASE_PEAK
	_phase_ms = 0
	return ev | EV_PEAK | EV_WEATHER


func _step_engine(dt: int, held: bool) -> int:
	var ev: int = 0
	var rise_ms: int = TIERS[_tier - 1][0]
	var hold_ms: int = TIERS[_tier - 1][1]
	if _phase == PHASE_RISE or _phase == PHASE_EDGE:
		_elapsed_ms += dt
		if _elapsed_ms > LEVEL_LIMITS_MS[_level]:
			_phase = PHASE_FAILED
			_screen = 7
			return EV_FAILED
	if _phase == PHASE_RISE:
		if held:
			_progress_ms += dt
		else:
			_progress_ms = maxi(0, _progress_ms - (dt >> 2))
		if _progress_ms >= rise_ms:
			_progress_ms = rise_ms
			_phase = PHASE_EDGE
			_edge_ms = 0
			_strain_ms = 0
			ev |= EV_TIER
	elif _phase == PHASE_EDGE:
		if held:
			_strain_ms += dt
			if _strain_ms >= STRAIN_MAX_MS:
				_slips += 1
				if _slips >= SLIPS_MAX:
					_phase = PHASE_FAILED
					_screen = 7
					return ev | EV_FAILED
				_phase = PHASE_RISE
				_progress_ms = rise_ms >> 1
				_strain_ms = 0
				_edge_ms = 0
				ev |= EV_SLIP
		else:
			_edge_ms += dt
			if _edge_ms >= hold_ms:
				if _tier >= LEVEL_TARGETS[_level]:
					ev = _enter_peak(ev)
				else:
					_tier += 1
					_phase = PHASE_RISE
					_progress_ms = 0
					_edge_ms = 0
					_strain_ms = 0
					if _tier > _best_tier:
						_best_tier = _tier
					ev |= EV_TIER | EV_WEATHER
	elif _phase == PHASE_PEAK:
		_phase_ms += dt
		if _phase_ms >= PEAK_MS:
			_phase = PHASE_DAZE
			_phase_ms = 0
			ev |= EV_DAZE | EV_WEATHER
	elif _phase == PHASE_DAZE:
		_phase_ms += dt
		if _phase_ms >= DAZE_MS:
			_phase = PHASE_DONE
			_screen = 6
			_wins = mini(999, _wins + 1)
			if _tier > _best_tier:
				_best_tier = _tier
			ev |= EV_VICTORY
	return ev


func _pressed(bits: int, bit: int) -> bool:
	return (bits & bit) != 0 and (_prev_bits & bit) == 0


## One fixed step. dt_ms is clamped to [0, DT_MAX_MS]; bits are masked
## to the eight defined inputs. Returns the event mask for the step.
func step(dt_ms: int, bits: int) -> int:
	var dt: int = clampi(dt_ms, 0, DT_MAX_MS)
	bits = bits & 0xFF
	_rng_next()
	_frame += 1
	var ev: int = 0
	if _screen == 0:
		if _pressed(bits, IN_CONFIRM):
			_screen = 1
	elif _screen == 1:
		if _pressed(bits, IN_UP):
			_menu_row = (_menu_row + MENU_ROWS - 1) % MENU_ROWS
		if _pressed(bits, IN_DOWN):
			_menu_row = (_menu_row + 1) % MENU_ROWS
		if _menu_row == 0 and (_pressed(bits, IN_LEFT) or _pressed(bits, IN_RIGHT) or _pressed(bits, IN_CONFIRM)):
			var dg: int = 2 if _pressed(bits, IN_LEFT) else 1
			_girl = (_girl + dg) % GIRL_NAMES.size()
		elif _menu_row == 1 and (_pressed(bits, IN_LEFT) or _pressed(bits, IN_RIGHT) or _pressed(bits, IN_CONFIRM)):
			var dl: int = 2 if _pressed(bits, IN_LEFT) else 1
			_level = (_level + dl) % LEVEL_NAMES.size()
		elif _pressed(bits, IN_CONFIRM):
			if _menu_row == 2:
				start_level(_level)
			elif _menu_row == 3:
				_screen = 2
			elif _menu_row == 4:
				_screen = 5
	elif _screen == 2:
		if _pressed(bits, IN_CONFIRM) or _pressed(bits, IN_BACK):
			_screen = 1
	elif _screen == 3:
		if _pressed(bits, IN_PAUSE):
			_screen = 4
		else:
			var held: bool = (_phase == PHASE_RISE) if _demo else (bits & IN_HOLD) != 0
			ev = _step_engine(dt, held)
	elif _screen == 4:
		if _pressed(bits, IN_PAUSE) or _pressed(bits, IN_CONFIRM):
			_screen = 3
		elif _pressed(bits, IN_BACK):
			_screen = 1
	elif _screen == 5:
		if _pressed(bits, IN_UP) or _pressed(bits, IN_DOWN):
			_settings_row = 1 - _settings_row
		if _pressed(bits, IN_LEFT) or _pressed(bits, IN_RIGHT) or _pressed(bits, IN_CONFIRM):
			if _settings_row == 0:
				_weather_reduced = not _weather_reduced
			else:
				_text_large = not _text_large
		if _pressed(bits, IN_BACK):
			_screen = 1
	elif _screen == 6 or _screen == 7:
		if _pressed(bits, IN_CONFIRM) or _pressed(bits, IN_BACK):
			_screen = 1
	_prev_bits = bits
	_last_event = ev
	return ev


func screen() -> int:
	return _screen


func level_idx() -> int:
	return _level


func girl_idx() -> int:
	return _girl


func tier() -> int:
	return _tier


func phase() -> int:
	return _phase


func culminations() -> int:
	return _culminations


func slips() -> int:
	return _slips


func elapsed_ms() -> int:
	return _elapsed_ms


func progress_ms() -> int:
	return _progress_ms


func edge_ms() -> int:
	return _edge_ms


func last_event() -> int:
	return _last_event


func apply_settings(weather_reduced: bool, text_large: bool) -> void:
	_weather_reduced = weather_reduced
	_text_large = text_large


func settings_bits() -> int:
	return (1 if _weather_reduced else 0) | (2 if _text_large else 0)


func apply_records(wins: int, best_tier: int) -> void:
	_wins = clampi(wins, 0, 999)
	_best_tier = clampi(best_tier, 0, 4)


func records_wins() -> int:
	return _wins


func records_best() -> int:
	return _best_tier


# ---- draw list (line protocol; identical strings in web/core.mjs) ----

func draw() -> String:
	var out: Array = []
	_r(out, 0, 0, 960, 960, 0)
	var body: int = 20 if _text_large else 16
	if _screen == 0:
		_t(out, 300, 300, 40, 1, "CRESCENDO")
		_t(out, 330, 380, body, 2, "AN AROUSAL ENGINE STUDY")
		_t(out, 240, 460, body, 5, "18+ ONLY - ADULTS ONLY BEYOND THIS GATE")
		_t(out, 240, 500, body, 3, "CONTAINS EROTIC THEMES AND SUGGESTIVE PLAY")
		_t(out, 330, 580, body, 8, "PRESS ENTER TO CONFIRM 18+")
		return "\n".join(out)
	if _screen == 1:
		_t(out, 300, 90, 40, 1, "CRESCENDO")
		_t(out, 330, 160, body, 3, "AROUSAL-ENGINE/1 - RUN HONESTLY")
		var rows: Array = [
			"GIRL  < %s >" % GIRL_NAMES[_girl],
			"LEVEL < %s >" % LEVEL_NAMES[_level],
			"PLAY", "HOW TO PLAY", "SETTINGS",
		]
		for i in range(rows.size()):
			var y: int = 260 + i * 64
			if i == _menu_row:
				_r(out, 190, y - 6, 580, 40, 4)
				_t(out, 210, y, 20, 8, ">")
			_t(out, 250, y, 20, 2 if i == _menu_row else 3, rows[i])
		_t(out, 250, 640, body, 3, "SESSIONS WON %d - BEST TIER %d" % [_wins, _best_tier])
		_t(out, 250, 680, body, 3, "ARROWS CHOOSE - ENTER CONFIRMS")
		_t(out, 250, 720, body, 3, "THE GIRL CHANGES THE PERFORMANCE ONLY")
		_draw_face(out, 480, 850, 44)
		return "\n".join(out)
	if _screen == 2:
		_t(out, 330, 90, 28, 1, "HOW TO PLAY")
		var lines: Array = [
			"HOLD SPACE OR PRESS TO BUILD THE RISE",
			"RELEASE AT THE EDGE - HOLDING SLIPS HER",
			"FOUR TIERS - EACH WITH ITS OWN TEMPO",
			"REACH THE TARGET TIER TO CULMINATE",
			"CULMINATION COMES EXACTLY ONCE",
			"THEN REST IN THE DAZE - SESSION WON",
			"THREE SLIPS OR THE CLOCK ENDS IT",
			"P PAUSES - HER FACE TELLS THE TIER",
		]
		for i in range(lines.size()):
			_t(out, 170, 190 + i * 52, body, 2, lines[i])
		_t(out, 300, 680, body, 8, "ENTER RETURNS TO TITLE")
		return "\n".join(out)
	if _screen == 5:
		_t(out, 350, 90, 28, 1, "SETTINGS")
		var srows: Array = [
			"WEATHER  %s" % ("REDUCED" if _weather_reduced else "FULL"),
			"TEXT     %s" % ("LARGE" if _text_large else "NORMAL"),
		]
		for i in range(srows.size()):
			var y2: int = 260 + i * 64
			if i == _settings_row:
				_r(out, 190, y2 - 6, 580, 40, 4)
				_t(out, 210, y2, 20, 8, ">")
			_t(out, 250, y2, 20, 2 if i == _settings_row else 3, srows[i])
		_t(out, 250, 480, body, 3, "LEFT OR RIGHT CHANGES - ESC RETURNS")
		_t(out, 250, 520, body, 3, "SETTINGS ARE NEVER GATED BY PLAY")
		return "\n".join(out)
	_draw_weather(out)
	_draw_face(out, 480, 470, 170)
	var f: int = face_state()
	var face_name: String = ["REST", "BUILDING", "F-03 EDGE", "F-05 PEAK", "F-10 DAZE"][f]
	var phase_name: String = ["RISE", "EDGE", "PEAK", "DAZE", "DONE", "ENDED"][_phase]
	_t(out, 40, 40, 20, 2, "%s - %s" % [LEVEL_NAMES[_level], GIRL_NAMES[_girl]])
	_t(out, 40, 76, body, 3, "TIER %d OF %d - %s - %s" % [_tier, LEVEL_TARGETS[_level], phase_name, face_name])
	var rise_ms: int = TIERS[_tier - 1][0]
	var hold_ms: int = TIERS[_tier - 1][1]
	var frac: float = 1.0
	if _phase == PHASE_RISE:
		frac = float(_progress_ms) / float(rise_ms)
	elif _phase == PHASE_EDGE:
		frac = float(_edge_ms) / float(hold_ms)
	_r(out, 40, 880, 880, 18, 4)
	_r(out, 40, 880, clampi(int(round(880.0 * frac)), 0, 880), 18, 8 if _phase == PHASE_EDGE else 1)
	var remain: int = maxi(0, LEVEL_LIMITS_MS[_level] - _elapsed_ms)
	_t(out, 40, 916, body, 3, "TIME %dS - SLIPS %d - WEATHER %d" % [int(round(float(remain) / 1000.0)), _slips, weather_state()])
	if _phase == PHASE_RISE:
		_t(out, 300, 830, body, 8, "HOLD TO BUILD THE RISE")
	if _phase == PHASE_EDGE:
		_t(out, 270, 830, body, 8, "RELEASE - HOLDING SLIPS HER")
	if _screen == 4:
		_r(out, 230, 330, 500, 260, 9)
		_t(out, 390, 400, 28, 1, "PAUSED")
		_t(out, 320, 470, body, 2, "ENTER RESUMES - ESC TO TITLE")
	if _screen == 6:
		_r(out, 180, 300, 600, 300, 9)
		_t(out, 330, 370, 28, 1, "CRESCENDO")
		_t(out, 280, 440, body, 2, "CULMINATION - EXACTLY ONCE")
		_t(out, 300, 480, body, 3, "TARGET TIER %d REACHED" % LEVEL_TARGETS[_level])
		_t(out, 330, 540, body, 8, "ENTER RETURNS TO TITLE")
	if _screen == 7:
		_r(out, 180, 300, 600, 300, 9)
		_t(out, 340, 370, 28, 5, "SESSION ENDED")
		_t(out, 300, 440, body, 2, "THREE SLIPS SPENT HER" if _slips >= SLIPS_MAX else "THE CLOCK RAN OUT")
		_t(out, 330, 540, body, 8, "ENTER RETURNS TO TITLE")
	return "\n".join(out)


func _draw_face(out: Array, cx: int, cy: int, r: int) -> void:
	var f: int = face_state()
	var big: bool = r > 100
	_c(out, cx, cy - int(round(r * 0.08)), int(round(r * 1.12)), GIRL_HAIR[_girl])
	_c(out, cx, cy, r, 2)
	var blush_r: int = int(round(GIRL_BLUSH_R[_girl] * (1.0 if big else 0.3) * (0.5 + _tier * 0.18)))
	if blush_r > 3:
		_c(out, cx - int(round(r * 0.52)), cy + int(round(r * 0.24)), blush_r, 5)
		_c(out, cx + int(round(r * 0.52)), cy + int(round(r * 0.24)), blush_r, 5)
	var eye_y: int = cy - int(round(r * 0.12)) + (GIRL_GAZE_DY[_girl] if big else 0)
	var eye_dx: int = int(round(r * 0.36))
	var eye_r: int = int(round(r * 0.16))
	for sx in [-1, 1]:
		var ex: int = cx + sx * eye_dx
		_c(out, ex, eye_y, eye_r, 6)
		if f == FACE_PEAK:
			var hr: int = maxi(3, int(round(eye_r * 0.42)))
			_c(out, ex - hr, eye_y - hr, hr, GIRL_ACCENT[_girl])
			_c(out, ex + hr, eye_y - hr, hr, GIRL_ACCENT[_girl])
			_p(out, ex - hr * 2, eye_y - hr, ex + hr * 2, eye_y - hr, ex, eye_y + hr * 2, GIRL_ACCENT[_girl])
		else:
			var pr: int = maxi(2, int(round(eye_r * (0.34 if f == FACE_EDGE else 0.5))))
			_c(out, ex, eye_y + (2 if f == FACE_DAZE else 0), pr, GIRL_ACCENT[_girl])
		if f == FACE_DAZE:
			_r(out, ex - eye_r, eye_y - eye_r, eye_r * 2, eye_r, 0)
		var brow_tilt: int = -6 if f == FACE_EDGE else (-9 if f == FACE_PEAK else 0)
		_l(out, ex - eye_r, eye_y - eye_r - 8, ex + eye_r, eye_y - eye_r - 8 + sx * brow_tilt, 4, 7)
	var my: int = cy + int(round(r * 0.42))
	if f == FACE_EDGE or f == FACE_PEAK:
		_c(out, cx, my, int(round(r * (0.1 if f == FACE_PEAK else 0.06))), 4)
	else:
		_l(out, cx - int(round(r * 0.14)), my, cx + int(round(r * 0.14)), my, 4, 7)


func _draw_weather(out: Array) -> void:
	var w: int = weather_state()
	var counts: Array = [10, 18, 28, 40, 30, 12]
	var speeds: Array = [1, 2, 3, 4, 2, 1]
	var count: int = counts[w]
	if _weather_reduced:
		count = int(ceil(float(count) / 2.0))
	var speed: int = speeds[w]
	for i in range(count):
		var hx: int = ((i * 197 + 61) * 2654435761) & 0xFFFFFFFF
		var x: int = hx % 960
		var y: int = ((hx >> 8) % 700 + _frame * speed * 3) % 760
		if w == 4:
			_c(out, x, y, 4, 8)
		elif w == 5:
			_c(out, x, y + 60, 3, 3)
		else:
			_l(out, x, y, x - 4, y + 14 + w * 3, 2, 1 if w >= 2 else 7)


func _r(out: Array, x: int, y: int, w: int, h: int, c: int) -> void:
	out.append("r %d %d %d %d %d" % [x, y, w, h, c])


func _c(out: Array, x: int, y: int, r: int, c: int) -> void:
	out.append("c %d %d %d %d" % [x, y, r, c])


func _l(out: Array, x1: int, y1: int, x2: int, y2: int, w: int, c: int) -> void:
	out.append("l %d %d %d %d %d %d" % [x1, y1, x2, y2, w, c])


func _p(out: Array, x1: int, y1: int, x2: int, y2: int, x3: int, y3: int, c: int) -> void:
	out.append("p %d %d %d %d %d %d %d" % [x1, y1, x2, y2, x3, y3, c])


func _t(out: Array, x: int, y: int, size: int, c: int, text: String) -> void:
	out.append("t %d %d %d %d %s" % [x, y, size, c, text])
