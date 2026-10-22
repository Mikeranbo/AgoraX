"""
Generates the sketchbook doodle layers behind the app (src/assets/doodles-*.svg).

Two seamless tiles of different, unrelated sizes are layered with an offset in index.css, so the
repeat never lines up. Large drawings carry detail (spokes, strings, windows), small ones are a
few strokes. Everything is hand-wobbled with an SVG displacement filter.

Run: python scripts/make-doodles.py
"""
import math
import random
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "src" / "assets"

# Light tints of the brand colours: indigo, violet, purple, and a little cyan.
INK = ["#a5b4fc", "#a5b4fc", "#c4b5fd", "#c4b5fd", "#d8b4fe", "#818cf8", "#67e8f9"]


def c(x, y, r):
    return f'<circle cx="{x}" cy="{y}" r="{r}"/>'


def p(d):
    return f'<path d="{d}"/>'


# ------------------------------------------------------------------ large, detailed (~200-260 units)

def bicycle():
    out = []
    for cx in (40, 160):
        out += [c(cx, 85, 34), c(cx, 85, 30), c(cx, 85, 4)]
        out.append(p(" ".join(
            f"M{cx + 4 * math.cos(a):.1f} {85 + 4 * math.sin(a):.1f} L{cx + 30 * math.cos(a):.1f} {85 + 30 * math.sin(a):.1f}"
            for a in (i * math.pi / 8 for i in range(16)))))
    out += [
        p("M40 85 L92 88 L80 40 Z M80 40 L146 36 M92 88 L150 52 M146 36 L150 52 Q158 70 160 85"),
        c(92, 88, 9), p("M92 79 L40 81 M92 97 L40 89 M92 88 L101 104 M94 104 H108"),
        p("M66 37 Q80 29 94 36 L89 40 Q80 37 70 40 Z M80 40 V36"),
        p("M146 36 L144 25 Q136 20 127 27 M127 27 L122 29"), c(133, 25, 2),
        p("M150 30 H186 L181 52 H155 Z M159 30 L161 52 M168 30 V52 M177 30 L175 52 M152 41 H184"),
        p("M6 79 A36 36 0 0 1 62 55 M126 79 A36 36 0 0 1 190 66"),
    ]
    return out, (100, 62), 115


def martinitoren():
    out = [
        p("M10 260 V170 H70 V260 M4 170 H76 M6 180 H74 M0 260 H80"),
        p("M32 260 V238 Q40 226 48 238 V260"),
        p("M18 216 V198 Q23 190 28 198 V216 Z M52 216 V198 Q57 190 62 198 V216 Z M23 192 V216 M57 192 V216"),
        p("M14 230 H22 M58 232 H66 M16 246 H26 M54 248 H64 M36 200 H44 M30 186 H38 M44 222 H50"),
        p("M16 170 V110 H64 V170 M12 110 H68 M14 116 H66"),
        p("M24 152 V132 Q29 124 34 132 V152 Z M46 152 V132 Q51 124 56 132 V152 Z M29 126 V152 M51 126 V152"),
        p("M12 110 L16 100 L20 110 M60 110 L64 100 L68 110 M10 170 L14 160 L18 170 M62 170 L66 160 L70 170"),
        p("M22 110 V62 H58 V110 M19 62 H61"), c(40, 85, 11), c(40, 85, 1.5),
        p("M40 74 V77 M40 93 V96 M29 85 H32 M48 85 H51 M40 85 L40 78 M40 85 L46 88"),
        p("M27 62 V32 H53 V62 M33 58 V38 Q35 35 37 38 V58 M43 58 V38 Q45 35 47 38 V58 M24 32 H56"),
        p("M27 32 Q40 14 53 32 M40 21 V6"), c(40, 12, 2.5), p("M40 6 L47 3 L40 1"),
    ]
    return out, (40, 130), 135


def guitar():
    strings_top = [46.5, 48.3, 50.1, 51.9, 53.7, 55.5]
    strings_bottom = [43, 46, 49, 52, 55, 58]
    out = [
        p("M50 126 C28 126 20 146 26 166 C29 176 24 184 20 196 C14 214 24 244 50 244 "
          "C76 244 86 214 80 196 C76 184 71 176 74 166 C80 146 72 126 50 126 Z"),
        c(50, 178, 10), c(50, 178, 13),
        p("M40 214 H60 V221 H40 Z M42 217 H58"),
        p("M45 126 V30 M55 126 V30 " + " ".join(f"M45 {y} H55" for y in (40, 52, 63, 73, 82, 91, 99, 107, 114, 121))),
        c(50, 68, 1.2), c(50, 95, 1.2),
        p("M44 30 L42 4 Q50 0 58 4 L56 30 Z"),
        p("M38 10 H43 M38 18 H43 M38 26 H44 M62 10 H57 M62 18 H57 M62 26 H56"),
        c(36, 10, 2), c(36, 18, 2), c(36, 26, 2), c(64, 10, 2), c(64, 18, 2), c(64, 26, 2),
        p(" ".join(f"M{t} 30 L{b} 217" for t, b in zip(strings_top, strings_bottom))),
        p("M60 188 Q69 188 68 198 Q64 206 57 200"),
    ]
    return out, (50, 124), 125


def canal_houses():
    out = [
        p("M0 140 V60 H8 V50 H16 V40 L25 31 L34 40 V50 H42 V60 H50 V140"),
        p("M50 140 V62 Q57 60 58 50 L62 30 Q75 17 88 30 L92 50 Q93 60 100 62 V140"),
        p("M100 140 V72 Q110 68 110 56 Q125 28 140 56 Q140 68 150 72 V140"),
        p("M-6 140 H156 M-4 150 q8 -4 16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0"),
    ]
    for x0, ys in ((8, (70, 92, 114)), (58, (68, 90, 112)), (108, (80, 100, 120))):
        for y in ys:
            out.append(p(f"M{x0} {y} h12 v12 h-12 Z M{x0 + 6} {y} v12 M{x0 + 22} {y} h12 v12 h-12 Z M{x0 + 28} {y} v12"))
    out += [p("M21 140 V128 Q25 123 29 128 V140 M71 140 V126 Q75 121 79 126 V140 M121 140 V128 Q125 123 129 128 V140"),
            p("M75 32 V22 M70 40 h10 v8 h-10 Z M121 46 h8 v8 h-8 Z M25 36 V44")]
    return out, (75, 85), 90


LARGE = [bicycle, martinitoren, guitar, canal_houses]


# ------------------------------------------------------------------ medium (~50-90 units)

def bridge():
    return [p("M0 28 H64 M2 18 H62 M6 28 V18 M16 28 V18 M26 28 V18 M38 28 V18 M48 28 V18 M58 28 V18"),
            p("M8 28 Q32 58 56 28 M14 50 Q32 64 50 50"),
            p("M-4 60 q5 -4 10 0 t10 0 t10 0 t10 0 t10 0 t10 0 t10 0")], (32, 35), 38


def football():
    return [c(22, 22, 20), p("M22 14 L30 19 L27 28 H17 L14 19 Z M22 14 V2 M30 19 L41 15 M27 28 L33 38 M17 28 L11 38 M14 19 L3 15"),
            p("M48 40 q6 -2 10 2")], (24, 22), 28


def rook():
    return [p("M8 70 H52 V62 H46 L42 30 H18 L14 62 H8 Z M14 30 V18 H22 V24 H28 V18 H34 V24 H40 V18 H46 V30 M18 44 H42")], (30, 44), 32


def pawn():
    return [c(16, 9, 7), p("M9 20 H23 M12 20 Q9 34 5 42 H27 Q23 34 20 20 M1 42 H31 V48 H1 Z")], (16, 26), 27


def hold():
    return [p("M5 20 Q0 4 18 4 Q36 0 41 16 Q45 33 26 36 Q8 40 5 20 Z"), c(22, 20, 3.5), p("M8 46 l3 -3 M16 48 l2 -4 M30 44 l3 2")], (22, 24), 26


def brush():
    return [p("M2 52 L30 24 M28 20 L35 13 M33 25 L40 18 M35 13 Q48 -1 52 2 Q55 6 40 18"), c(48, 28, 2.5), c(52, 36, 1.5)], (27, 27), 33


def cup():
    return [p("M0 22 H32 V36 Q32 49 16 49 Q0 49 0 36 Z M32 26 Q42 26 42 32 Q42 38 32 38 M-4 54 H36"),
            p("M9 15 q-4 -5 0 -10 M17 15 q-4 -5 0 -10 M25 15 q-4 -5 0 -10")], (18, 30), 30


def tent():
    return [p("M0 52 L29 8 L58 52 Z M22 52 L29 32 L36 52 M29 8 V1 M-6 52 H64 M-2 52 L-8 58 M60 52 L66 58"),
            p("M70 6 A8 8 0 1 0 78 18 A6 6 0 1 1 70 6 Z")], (32, 30), 40


def cat():
    return [c(22, 28, 17), p("M9 17 L7 4 L18 12 M35 17 L37 4 L26 12 M20 33 H24 L22 35 Z M3 33 H12 M32 33 H41 M2 37 L12 35 M32 35 L42 37"),
            c(16, 27, 1.6), c(28, 27, 1.6)], (22, 26), 26


def bird():
    return [p("M0 20 Q10 0 30 10 Q38 14 44 10 L40 18 Q30 30 12 28 Q2 26 0 20 Z M44 10 L51 12 L44 15 M14 16 Q22 23 30 16 M18 28 V35 M25 28 V35 M8 36 H40"),
            c(27, 12, 1.5)], (24, 20), 28


def fish():
    return [p("M0 12 Q14 0 28 12 Q14 24 0 12 Z M28 12 L38 4 V20 Z M14 6 Q17 12 14 18"), c(8, 10, 1.5)], (19, 12), 21


def duck():
    return [p("M0 30 Q0 48 28 48 H52 Q66 48 66 36 Q66 28 56 30 L50 30 Q55 16 46 10 Q38 5 33 13 Q30 22 36 30 Z M33 13 L25 15 L32 18 M14 36 Q26 42 40 36"),
            c(41, 14, 1.5), p("M-6 54 q6 -3 12 0 t12 0 t12 0 t12 0 t12 0 t12 0")], (30, 30), 38


def books():
    return [p("M0 44 h48 v11 h-48 Z M5 33 h42 v11 h-42 Z M2 22 h40 v11 h-40 Z M10 22 V33 M38 44 V55"),
            p("M8 12 Q20 4 30 12 Q40 4 52 12 V20 Q40 13 30 20 Q20 13 8 20 Z M30 12 V20")], (26, 30), 32


def headphones():
    return [p("M6 34 V24 Q6 4 28 4 Q50 4 50 24 V34"), p("M2 32 h10 v18 h-10 Z M44 32 h10 v18 h-10 Z")], (28, 28), 30


def camera():
    return [p("M0 14 H14 L19 6 H35 L40 14 H54 V44 H0 Z"), c(27, 28, 11), c(27, 28, 6), p("M44 20 h5")], (27, 25), 30


def dice():
    return [p("M0 12 L20 0 L42 10 L22 22 Z M0 12 V36 L22 48 V22 M42 10 V34 L22 48"),
            c(21, 11, 1.8), c(9, 24, 1.8), c(14, 34, 1.8), c(31, 26, 1.8), c(36, 20, 1.8)], (21, 24), 27


def controller():
    return [p("M10 6 H50 Q62 6 64 22 Q66 40 56 40 Q50 40 46 32 H14 Q10 40 4 40 Q-6 40 -4 22 Q-2 6 10 6 Z M12 16 V28 M6 22 H18"),
            c(46, 18, 2.5), c(52, 25, 2.5)], (30, 23), 36


def mic():
    return [p("M14 4 Q24 4 24 14 V26 Q24 36 14 36 Q4 36 4 26 V14 Q4 4 14 4 Z M4 18 H24 M4 24 H24 M-2 24 Q-2 44 14 44 Q30 44 30 24 M14 44 V56 M4 56 H24")], (14, 30), 30


def clapper():
    return [p("M0 18 H56 V52 H0 Z M0 18 L4 4 L58 0 L56 14 M14 3 L10 17 M28 2 L24 16 M42 1 L38 15 M0 28 H56")], (28, 26), 32


def racket():
    return [p("M20 2 Q38 2 38 22 Q38 40 22 42 Q4 42 4 22 Q4 2 20 2 Z M21 42 L24 62 M18 62 H30"),
            c(14, 16, 1.5), c(26, 14, 1.5), c(20, 26, 1.5), c(30, 28, 1.5), c(12, 30, 1.5), c(48, 52, 6)], (24, 32), 34


def basketball():
    return [c(24, 24, 22), p("M2 24 H46 M24 2 V46 M8 8 Q20 24 8 40 M40 8 Q28 24 40 40")], (24, 24), 26


def pine():
    return [p("M20 0 L32 18 H26 L36 32 H28 L40 48 H0 L12 32 H4 L14 18 H8 Z M20 48 V58 M50 58 L62 30 L74 58 M46 58 H80")], (38, 30), 42


def mountain():
    return [p("M0 50 L22 14 L34 32 L44 20 L66 50 Z M16 24 L22 14 L28 24 L24 22 L20 26 Z"), c(56, 10, 7),
            p("M56 -2 V0 M68 10 H66 M64 2 L62 4")], (33, 26), 38


def paddle_wave():
    return [p("M0 40 L60 4 M54 0 Q66 -4 66 6 Q64 12 58 10 M6 44 Q-6 48 -6 38 Q-4 32 2 34"),
            p("M-8 54 q8 -6 16 0 t16 0 t16 0 t16 0 t16 0")], (30, 26), 40


def surfboard():
    return [p("M30 0 Q46 30 36 70 Q30 78 24 70 Q14 30 30 0 Z M30 10 V66"), p("M-6 74 q8 -8 16 0 t16 0 t16 0 t16 0")], (30, 38), 40


def vase():
    return [p("M16 0 H34 M18 0 Q18 10 12 18 Q0 34 8 52 Q14 60 25 60 Q36 60 42 52 Q50 34 38 18 Q32 10 32 0 M10 30 Q25 36 40 30")], (25, 30), 32


def laptop():
    return [p("M6 4 H58 V40 H6 Z M0 40 H64 L60 46 H4 Z M22 16 L16 22 L22 28 M42 16 L48 22 L42 28 M35 14 L29 30")], (32, 25), 36


def bubbles():
    return [p("M4 4 H40 Q46 4 46 10 V24 Q46 30 40 30 H18 L10 38 V30 H4 Q-2 30 -2 24 V10 Q-2 4 4 4 Z"),
            p("M30 36 H60 Q66 36 66 42 V54 Q66 60 60 60 H58 V68 L50 60 H30 Q24 60 24 54 V42 Q24 36 30 36 Z M8 14 H36 M8 21 H28")], (32, 36), 40


def hanger():
    return [p("M28 14 Q28 4 34 4 Q40 4 40 10 Q40 16 34 18 L34 22 L4 42 H64 L34 22")], (34, 24), 34


def pencil():
    return [p("M0 54 L6 40 L46 0 L56 10 L16 50 Z M6 40 L16 50 M40 6 L50 16 M0 54 L3 47"), p("M60 40 q6 4 2 10 q-4 6 4 10")], (30, 30), 36


def pan():
    return [p("M30 20 m-24 0 a24 24 0 1 0 48 0 a24 24 0 1 0 -48 0 M54 20 H86"), p("M22 12 Q30 4 38 12 Q46 22 36 28 Q26 32 20 24 Q16 18 22 12 Z"), c(30, 19, 5)], (44, 20), 46


def notes():
    return [p("M8 40 V8 L34 2 V34"), c(4, 40, 5), c(30, 34, 5), p("M8 16 L34 10")], (19, 22), 26


MEDIUM = [bridge, football, rook, pawn, hold, brush, cup, tent, cat, bird, fish, duck, books, headphones,
          camera, dice, controller, mic, clapper, racket, basketball, pine, mountain, paddle_wave, surfboard,
          vase, laptop, bubbles, hanger, pencil, pan, notes]


# ------------------------------------------------------------------ small (a few strokes)

def star():
    return [p("M10 0 L12.5 7.5 L20 10 L12.5 12.5 L10 20 L7.5 12.5 L0 10 L7.5 7.5 Z")], (10, 10), 11


def sparkle():
    return [p("M10 0 V20 M0 10 H20 M3 3 L17 17 M17 3 L3 17")], (10, 10), 11


def dot():
    return [c(3, 3, 2.5)], (3, 3), 4


def ring():
    return [c(6, 6, 5)], (6, 6), 7


def spiral():
    pts = []
    for i in range(40):
        a = i * 0.45
        r = 1 + i * 0.32
        pts.append(f"{10 + r * math.cos(a):.1f} {10 + r * math.sin(a):.1f}")
    return [p("M" + " L".join(pts))], (10, 10), 14


def heart():
    return [p("M10 18 Q-2 8 4 3 Q8 0 10 5 Q12 0 16 3 Q22 8 10 18 Z")], (10, 9), 11


def note():
    return [p("M6 18 V2 Q12 4 14 8"), c(3, 18, 3)], (7, 10), 11


def plus():
    return [p("M6 0 V12 M0 6 H12")], (6, 6), 7


def squiggle():
    return [p("M0 6 q4 -8 8 0 t8 0 t8 0 t8 0")], (16, 6), 17


def zigzag():
    return [p("M0 8 L5 0 L10 8 L15 0 L20 8 L25 0")], (12, 4), 14


def leaf():
    return [p("M0 18 Q2 2 18 0 Q16 16 0 18 Z M0 18 L12 6")], (9, 9), 11


def cloud():
    return [p("M4 16 Q0 16 0 12 Q0 7 6 8 Q8 2 14 3 Q20 2 21 8 Q26 8 26 13 Q26 16 22 16 Z")], (13, 9), 14


def arrow():
    return [p("M0 14 Q10 0 22 6 M16 2 L22 6 L18 12")], (11, 7), 13


def triangle():
    return [p("M7 0 L14 12 H0 Z")], (7, 6), 8


def lightning():
    return [p("M10 0 L2 12 H9 L5 22 L16 8 H9 L13 0 Z")], (9, 11), 12


SMALL = [star, star, sparkle, dot, dot, dot, ring, spiral, heart, note, plus, plus, squiggle, zigzag, leaf, cloud,
         arrow, triangle, lightning]


# ------------------------------------------------------------------ layout

def emit(fn, x, y, rot, scale, ink, width, size_tile, sketchy=False):
    parts, (ax, ay), radius = fn()
    body = "".join(parts)
    out = []
    W, H = size_tile
    r = radius * scale
    xs = [x] + ([x + W] if x - r < 0 else []) + ([x - W] if x + r > W else [])
    ys = [y] + ([y + H] if y - r < 0 else []) + ([y - H] if y + r > H else [])
    for xx in xs:
        for yy in ys:
            t = f"translate({xx:.1f} {yy:.1f}) rotate({rot:.1f}) scale({scale:.2f}) translate({-ax} {-ay})"
            out.append(f'<g transform="{t}" stroke="{ink}" stroke-width="{width}">{body}</g>')
            if sketchy:  # a second, slightly shifted pass, like a pencil going over the line again
                t2 = f"translate({xx + 1.3:.1f} {yy + 0.9:.1f}) rotate({rot + 0.8:.1f}) scale({scale:.2f}) translate({-ax} {-ay})"
                out.append(f'<g transform="{t2}" stroke="{ink}" stroke-width="{width * 0.6:.1f}" opacity="0.55">{body}</g>')
    return out


def place(rng, placed, radius, W, H, overlap, tries=400):
    """Random spot whose circle overlaps earlier ones by at most `overlap` (0..1) of the smaller radius."""
    best = None
    for _ in range(tries):
        x, y = rng.uniform(0, W), rng.uniform(0, H)
        ok = True
        for (px, py, pr) in placed:
            dx = min(abs(x - px), W - abs(x - px))
            dy = min(abs(y - py), H - abs(y - py))
            if math.hypot(dx, dy) < (radius + pr) - overlap * min(radius, pr):
                ok = False
                break
        if ok:
            best = (x, y)
            break
    if best is None:
        best = (rng.uniform(0, W), rng.uniform(0, H))
    placed.append((best[0], best[1], radius))
    return best


def tile(seed, W, H, n_large, n_medium, n_small, large_scale, medium_scale):
    rng = random.Random(seed)
    placed, out = [], []
    large = rng.sample(LARGE, k=n_large)
    for fn in large:
        s = rng.uniform(*large_scale)
        x, y = place(rng, placed, fn()[2] * s, W, H, overlap=0.1)
        out += emit(fn, x, y, rng.uniform(-18, 18), s, rng.choice(INK[:5]), 2.4, (W, H), sketchy=True)
    mediums = [rng.choice(MEDIUM) for _ in range(n_medium)]
    for fn in mediums:
        s = rng.uniform(*medium_scale)
        x, y = place(rng, placed, fn()[2] * s, W, H, overlap=rng.choice([0.15, 0.3, 0.55]))
        out += emit(fn, x, y, rng.uniform(-35, 35), s, rng.choice(INK), 2.1, (W, H), sketchy=rng.random() < 0.3)
    for _ in range(n_small):
        fn = rng.choice(SMALL)
        s = rng.uniform(0.7, 1.5)
        x, y = place(rng, placed, fn()[2] * s, W, H, overlap=0.6, tries=60)
        out += emit(fn, x, y, rng.uniform(-60, 60), s, rng.choice(INK), 1.8, (W, H))
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" fill="none" '
        'stroke-linecap="round" stroke-linejoin="round">'
        '<style>path,circle{vector-effect:non-scaling-stroke}</style>'
        '<filter id="hand" x="-2%" y="-2%" width="104%" height="104%">'
        f'<feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="{seed}"/>'
        '<feDisplacementMap in="SourceGraphic" scale="3.5"/></filter>'
        f'<g filter="url(#hand)">{"".join(out)}</g></svg>'
    )


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "doodles-a.svg").write_text(tile(11, 1400, 1400, 4, 30, 120, (1.25, 1.6), (0.9, 1.6)), encoding="utf-8")
    (OUT / "doodles-b.svg").write_text(tile(29, 1130, 1130, 2, 22, 90, (0.9, 1.1), (0.7, 1.2)), encoding="utf-8")
    old = OUT / "doodles.svg"
    if old.exists():
        old.unlink()
    print("ok", [f.stat().st_size for f in sorted(OUT.glob("doodles-*.svg"))])
