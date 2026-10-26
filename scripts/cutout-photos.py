"""Cut the people out of the entry photos (kind "cutout" in scripts/photo-sources.json).

For each one: download the Unsplash original once (into .cache/photos), find the person with
BiRefNet (MIT licence), firm up the matte, drop leftover specks of background, re-estimate the
colours along the edge so no background colour shows through (no halos), crop to the person and
write a transparent PNG to .cache/cutouts/<key>.png. Then run `node scripts/build-photos.mjs`,
which makes the AVIF/WebP/PNG sizes the site serves.

Setup (once, any Python 3.10+):  pip install "rembg[cpu]==2.0.67"
Run:                             python scripts/cutout-photos.py
The model (~1 GB) downloads on first run into ~/.u2net, or wherever U2NET_HOME points. On Windows
with a long path, set NUMBA_CACHE_DIR to a short folder if pymatting fails to import.
"""
import json
import os
import urllib.request

import cv2
import numpy as np
from PIL import Image
from pymatting import estimate_foreground_ml
from rembg import new_session, remove

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PHOTOS = os.path.join(ROOT, '.cache', 'photos')
CUTOUTS = os.path.join(ROOT, '.cache', 'cutouts')


def original(photo: dict) -> Image.Image:
    path = os.path.join(PHOTOS, f"{photo['key']}.jpg")
    if not os.path.exists(path):
        url = f"https://images.unsplash.com/photo-{photo['id']}?h=2600&q=95&fm=jpg&fit=max"
        request = urllib.request.Request(url, headers={'User-Agent': 'agorax-build'})
        with open(path, 'wb') as f:
            f.write(urllib.request.urlopen(request, timeout=120).read())
    return Image.open(path).convert('RGB')


def cut(img: Image.Image, session) -> Image.Image:
    a = np.asarray(remove(img, session=session, only_mask=True), dtype=np.float64) / 255.0
    # Drop faint noise and make the solid core fully opaque.
    a = np.clip((a - 0.06) / (0.94 - 0.06), 0, 1)
    # Keep the person and what they hold (the largest region, plus regions at least 2% of its size);
    # isolated specks of background go.
    solid = (a > 0.5).astype(np.uint8)
    count, labels, stats, _ = cv2.connectedComponentsWithStats(solid, connectivity=8)
    if count > 1:
        areas = stats[1:, cv2.CC_STAT_AREA]
        keep = [i + 1 for i, area in enumerate(areas) if area >= areas.max() * 0.02]
        near = cv2.dilate(np.isin(labels, keep).astype(np.uint8), np.ones((9, 9), np.uint8)) > 0
        a = np.where(near, a, 0)
    # The person's own colours along the edge, without the background mixed in.
    fg = estimate_foreground_ml(np.asarray(img, dtype=np.float64) / 255.0, a)
    rgba = (np.dstack([np.clip(fg, 0, 1), a]) * 255 + 0.5).astype(np.uint8)
    out = Image.fromarray(rgba, 'RGBA')
    left, top, right, bottom = out.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
    pad = 8
    return out.crop((max(left - pad, 0), max(top - pad, 0), min(right + pad, out.width), min(bottom + pad, out.height)))


def main() -> None:
    os.makedirs(PHOTOS, exist_ok=True)
    os.makedirs(CUTOUTS, exist_ok=True)
    with open(os.path.join(ROOT, 'scripts', 'photo-sources.json'), encoding='utf-8') as f:
        photos = [p for p in json.load(f)['photos'] if p['kind'] == 'cutout']
    session = new_session('birefnet-general')
    for photo in photos:
        result = cut(original(photo), session)
        result.save(os.path.join(CUTOUTS, f"{photo['key']}.png"), optimize=True)
        print(photo['key'], result.size)


if __name__ == '__main__':
    main()
