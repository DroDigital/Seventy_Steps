"""Register material coordinates to an idle pose before baking an animation."""

import numpy as np
from scipy.ndimage import gaussian_filter, map_coordinates

LUMA = np.array([.25, .64, .11], dtype=np.float32)


def coverage(rgba):
    alpha = rgba[..., 3]
    solid = alpha > 32
    # A soft pose may have no fully modeled texels but still has a silhouette.
    return solid if np.any(solid) else alpha > 0


def extent(mask):
    y, x = np.nonzero(mask)
    return x.min(), y.min(), x.max() + 1, y.max() + 1


def features(rgba, mask):
    # The silhouette helps with thin appendages. Luma still matches ridges,
    # joints and clothes independently of the silhouette's outer motion.
    lum = rgba[..., :3].astype(np.float32) @ LUMA / 255
    return gaussian_filter(lum * mask, .65), gaussian_filter(mask.astype(np.float32), .72)


def align(ref_lum, ref_alpha, lum, alpha, u, v, stride):
    # Match local patches at two scales. A small movement penalty keeps quiet
    # areas near their existing coordinates when several matches look alike.
    best = np.full(lum.shape, np.inf, dtype=np.float32)
    offset_u = np.zeros(lum.shape, dtype=np.float32)
    offset_v = np.zeros_like(offset_u)
    for dy in (0, -stride, stride):
        for dx in (0, -stride, stride):
            coordinates = (v + dy, u + dx)
            a = map_coordinates(ref_alpha, coordinates, order=1, mode='constant', prefilter=False)
            value = map_coordinates(ref_lum, coordinates, order=1, mode='constant', prefilter=False)
            residual = (alpha - a) ** 2 * .43 + (lum - value) ** 2
            cost = gaussian_filter(residual, 1.8) + .0025 * (abs(dx) + abs(dy)) / stride
            chosen = cost < best
            offset_u[chosen] = dx
            offset_v[chosen] = dy
            best[chosen] = cost[chosen]
    # Let neighboring texels move together while still allowing separate body
    # parts to shear. Where no match is convincing, retain the initial fit.
    confidence = np.clip(1 - best * 9, 0, 1) * alpha
    neighbors = gaussian_filter(confidence, 1.45)
    return (
        u + gaussian_filter(offset_u * confidence, 1.45) / np.maximum(neighbors, .33),
        v + gaussian_filter(offset_v * confidence, 1.45) / np.maximum(neighbors, .33),
    )


def register(reference_rgba, current_rgba):
    """Map current texels to absolute (x, y) coordinates in the source idle."""
    y, x = np.indices(current_rgba.shape[:2], dtype=np.float32)
    if np.array_equal(reference_rgba, current_rgba):
        return x, y

    reference = coverage(reference_rgba)
    current = coverage(current_rgba)
    rx, ry, rr, rb = extent(reference)
    cx, cy, cr, cb = extent(current)
    rw, rh = rr - rx, rb - ry
    cw, ch = cr - cx, cb - cy
    if (rw, rh) == (cw, ch) and np.array_equal(
        reference_rgba[ry:rb, rx:rr], current_rgba[cy:cb, cx:cr]
    ):
        return x + (rx - cx), y + (ry - cy)

    # Fit the whole pose first, then let texture coordinates follow smaller
    # changes where the source has a match. Alpha in the output is untouched.
    u = rx - .5 + (x - cx + .5) * (rw / cw)
    v = ry - .5 + (y - cy + .5) * (rh / ch)
    ref_lum, ref_alpha = features(reference_rgba, reference)
    lum, alpha = features(current_rgba, current)
    stride = np.clip(round(rh / 17), 2, 7)
    u, v = align(ref_lum, ref_alpha, lum, alpha, u, v, stride)
    return align(ref_lum, ref_alpha, lum, alpha, u, v, max(1, stride // 2))
