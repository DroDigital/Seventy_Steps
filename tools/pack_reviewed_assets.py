#!/usr/bin/env python3
"""Pack registered artwork without drawing, trimming, scaling, or changing pixels.

Each creature stays on one nearest-filter atlas page. The JSON records the
complete source canvas and directional mirroring; it does not infer glow from
transparency. Run with the bundled Python runtime (Pillow required).
"""
from __future__ import annotations

import argparse
from collections import OrderedDict
from concurrent.futures import ThreadPoolExecutor
import hashlib
import io
import json
from pathlib import Path
from PIL import Image


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def read_source(source: Path, path: str, expected: str) -> dict:
    full_path = (source / path).resolve()
    if not full_path.is_relative_to(source.resolve()):
        raise ValueError(f"Source escapes the asset folder: {path}")
    data = full_path.read_bytes()
    actual = sha256(data)
    if actual != expected:
        raise ValueError(f"Registered source hash differs: {path}")
    with Image.open(io.BytesIO(data)) as original:
        rgba = original.convert("RGBA")
        alpha = rgba.getchannel("A")
        bbox = alpha.getbbox()
        if bbox is None:
            raise ValueError(f"Empty registered frame: {path}")
        return {
            "source": path,
            "sourceSha256": actual,
            "pixelSha256": sha256(rgba.tobytes()),
            "width": rgba.width,
            "height": rgba.height,
            "bounds": list(bbox),
            "image": rgba,
        }


def cursor_after(cursor: tuple[int, int, int], frames: list[dict], limit: int, gutter: int):
    x, y, row = cursor
    positions = []
    for frame in frames:
        width = frame["width"] + gutter * 2
        height = frame["height"] + gutter * 2
        if width > limit or height > limit:
            raise ValueError(f"Frame larger than atlas limit: {frame['source']}")
        if x + width > limit:
            x, y, row = 0, y + row, 0
        positions.append((x + gutter, y + gutter))
        x += width
        row = max(row, height)
    return (x, y, row), positions


def export(source: Path, output: Path, limit: int = 2048, gutter: int = 1) -> dict:
    index_bytes = (source / "CURRENT-GAME-ANIMATIONS.json").read_bytes()
    source_index = json.loads(index_bytes)
    entries = source_index["entities"]
    if len(entries) != source_index["entity_count"] or len({e["key"] for e in entries}) != len(entries):
        raise ValueError("Source index entity count or keys are invalid")
    references = OrderedDict()
    for entity in entries:
        if set(entity["directions"]) != {"front", "back", "left", "right"}:
            raise ValueError(f"Missing directional registration: {entity['key']}")
        for direction in entity["directions"].values():
            for action in direction["actions"].values():
                if action["frame_count"] != len(action["frames"]):
                    raise ValueError(f"Frame count differs: {entity['key']}")
                for frame in action["frames"]:
                    previous = references.setdefault(frame["path"], frame["sha256"])
                    if previous != frame["sha256"]:
                        raise ValueError(f"Conflicting source hash: {frame['path']}")
    if len(references) != source_index["unique_png_count"]:
        raise ValueError("Registered PNG count differs")
    with ThreadPoolExecutor(max_workers=16) as pool:
        loaded = list(pool.map(lambda p: read_source(source, *p), references.items()))
    frames_by_source = {frame["source"]: frame for frame in loaded}
    groups, owners = [], {}
    for entity in entries:
        paths = list(dict.fromkeys(
            frame["path"] for direction in entity["directions"].values()
            for action in direction["actions"].values() for frame in action["frames"]
        ))
        for path in paths:
            previous = owners.setdefault(path, entity["key"])
            if previous != entity["key"]:
                raise ValueError(f"A frame is shared by distinct creatures: {path}")
        group_frames = [frames_by_source[p] for p in paths]
        if len({(f["width"], f["height"]) for f in group_frames}) != 1:
            raise ValueError(f"Source canvas varies within creature: {entity['key']}")
        groups.append((entity, group_frames))
    # Tall bosses first, followed by square bosses, then the 64px creatures.
    # Stable sorting keeps the index order within each size class.
    groups.sort(key=lambda group: (
        -max(f["height"] for f in group[1]), -max(f["width"] for f in group[1])
    ))
    pages, entity_page = [[]], {}
    cursor = (0, 0, 0)
    for entity, group_frames in groups:
        next_cursor, positions = cursor_after(cursor, group_frames, limit, gutter)
        if next_cursor[1] + next_cursor[2] > limit:
            pages.append([])
            cursor = (0, 0, 0)
            next_cursor, positions = cursor_after(cursor, group_frames, limit, gutter)
        if next_cursor[1] + next_cursor[2] > limit:
            raise ValueError(f"Creature cannot fit on one atlas page: {entity['key']}")
        page = len(pages) - 1
        entity_page[entity["key"]] = page
        for frame, (x, y) in zip(group_frames, positions):
            frame.update(page=page, x=x, y=y)
            pages[-1].append(frame)
        cursor = next_cursor
    output.mkdir(parents=True, exist_ok=True)
    atlas_pages = []
    roundtrips = 0
    for page, page_frames in enumerate(pages):
        width = max(f["x"] + f["width"] + gutter for f in page_frames)
        height = max(f["y"] + f["height"] + gutter for f in page_frames)
        canvas = Image.new("RGBA", (width, height))
        for frame in page_frames:
            # No alpha mask: paste all original RGBA channels exactly.
            canvas.paste(frame["image"], (frame["x"], frame["y"]))
        name = f"creatures-{page}.png"
        target = output / name
        canvas.save(target, optimize=True)
        encoded = target.read_bytes()
        with Image.open(io.BytesIO(encoded)) as decoded:
            if decoded.mode != "RGBA":
                raise ValueError(f"Atlas output lost RGBA mode: {name}")
            for frame in page_frames:
                rect = (frame["x"], frame["y"], frame["x"] + frame["width"], frame["y"] + frame["height"])
                restored = decoded.crop(rect).tobytes()
                if sha256(restored) != frame["pixelSha256"]:
                    raise ValueError(f"Atlas pixels differ: {frame['source']}")
                roundtrips += 1
        atlas_pages.append({
            "file": name, "width": width, "height": height,
            "sha256": sha256(encoded), "pngBytes": len(encoded),
        })
    frame_ids = {f["source"]: index for index, f in enumerate(loaded)}
    manifest_frames = [{k: v for k, v in f.items() if k != "image"} for f in loaded]
    manifest_entities = {}
    for entity in entries:
        directions = {}
        for name, direction in entity["directions"].items():
            directions[name] = {
                "sourceDirection": direction["source_direction"],
                "mirror": direction["mirror_horizontal"],
                "actions": {
                    action: [frame_ids[f["path"]] for f in registration["frames"]]
                    for action, registration in direction["actions"].items()
                },
            }
        manifest_entities[entity["key"]] = {
            "id": entity["id"], "name": entity["display_name"],
            "assetGroup": entity["asset_group"], "scale": entity["sprite_scale"],
            "scaleUnit": entity["scale_unit"], "page": entity_page[entity["key"]],
            "directions": directions,
        }
    manifest = {
        "format": "seventy-steps-reviewed-atlas-v1",
        "sourceIndexSha256": sha256(index_bytes),
        "entityCount": len(entries), "frameCount": len(loaded),
        "filter": "nearest", "mipmaps": False, "gutter": gutter,
        "coordinateOrigin": "top-left", "pages": atlas_pages,
        "frames": manifest_frames, "entities": manifest_entities,
    }
    (output / "index.json").write_text(json.dumps(manifest, separators=(",", ":")) + "\n")
    (output / "source-index.json").write_bytes(index_bytes)
    verification = {
        "entityCount": len(entries), "uniqueRegisteredPngs": len(loaded),
        "sourceHashesVerified": len(loaded), "pixelRoundtripsVerified": roundtrips,
        "pageCount": len(atlas_pages), "maxTextureDimension": max(max(p["width"], p["height"]) for p in atlas_pages),
        "decodedRgbaBytes": sum(p["width"] * p["height"] * 4 for p in atlas_pages),
        "encodedPngBytes": sum(p["pngBytes"] for p in atlas_pages),
        "sourcePixelsChanged": 0, "sourceFilesChanged": 0,
        "pages": atlas_pages,
    }
    (output / "PACK-VERIFICATION.json").write_text(json.dumps(verification, indent=2) + "\n")
    return verification


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--limit", type=int, default=2048)
    parser.add_argument("--gutter", type=int, default=1)
    args = parser.parse_args()
    print(json.dumps(export(args.source, args.output, args.limit, args.gutter), indent=2))
