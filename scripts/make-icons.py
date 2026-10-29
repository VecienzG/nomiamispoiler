"""Genera le icone: tramonto Miami + scudo con occhio barrato. python3 scripts/make-icons.py"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

S = 512
OUT = Path(__file__).resolve().parent.parent / "extension" / "icons"
OUT.mkdir(parents=True, exist_ok=True)

# Tramonto: pesca in alto, rosa, lilla, cielo in basso
SKY = [(255, 212, 168), (255, 194, 208), (161, 121, 152), (106, 159, 184)]
NAVY = (30, 23, 40)
PEACH, AMBER = (255, 212, 168), (255, 173, 54)


def sky(t):
    t = max(0.0, min(1.0, t)) * (len(SKY) - 1)
    i = min(int(t), len(SKY) - 2)
    return lerp(SKY[i], SKY[i + 1], t - i)


def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def draw_icon():
    # sfondo: tramonto in verticale
    grad = Image.new("RGB", (S, S))
    gd = ImageDraw.Draw(grad)
    for y in range(S):
        gd.line([(0, y), (S, y)], fill=sky(y / S))

    # strisce del sole anni '80 nella parte bassa
    stripes = ImageDraw.Draw(grad)
    y, h = 330, 10
    while y < S:
        stripes.rectangle([0, y, S, y + h], fill=sky(y / S - 0.25))
        y += h + 22
        h += 4

    mask = Image.new("L", (S, S), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, S - 1, S - 1], radius=56, fill=255)
    icon = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    icon.paste(grad, (0, 0), mask)

    # scudo
    shield = [
        (256, 70), (410, 128), (400, 280), (350, 380), (256, 448),
        (162, 380), (112, 280), (102, 128),
    ]
    shadow = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).polygon([(x, y + 14) for x, y in shield], fill=(30, 23, 40, 120))
    icon.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(10)))
    d = ImageDraw.Draw(icon)
    d.polygon(shield, fill=NAVY)

    # occhio barrato
    cx, cy = 256, 248
    d.ellipse([cx - 92, cy - 52, cx + 92, cy + 52], outline=(255, 255, 255), width=20)
    d.ellipse([cx - 30, cy - 30, cx + 30, cy + 30], fill=PEACH)
    d.line([(cx - 105, cy + 95), (cx + 105, cy - 95)], fill=NAVY, width=44)
    d.line([(cx - 100, cy + 90), (cx + 100, cy - 90)], fill=AMBER, width=22)
    return icon


icon = draw_icon()
for size in (16, 32, 48, 128):
    icon.resize((size, size), Image.LANCZOS).save(OUT / f"icon-{size}.png")
icon.save(OUT.parent.parent / "store" / "icon-512.png")
print("ok", OUT)
