"""Bind staged sprite PNGs to the archived atlas snapshot used to bake them."""

from hashlib import sha256
import json


RECEIPT = 'paint-receipt.json'


def digest(data):
    return sha256(data).hexdigest()


def read_source_page(source, page):
    path = source / page['file']
    data = path.read_bytes()
    if digest(data) != page['sha256']:
        raise ValueError(f'{path}: source page checksum differs')
    return data


def write_receipt(output, source_manifest, painted_hashes):
    (output / RECEIPT).write_text(json.dumps({
        'sourceManifestSha256': digest(source_manifest),
        'pages': painted_hashes,
    }, indent=2) + '\n', encoding='utf-8')


def read_receipt(output, source_manifest, pages):
    path = output / RECEIPT
    try:
        receipt = json.loads(path.read_bytes())
    except (FileNotFoundError, ValueError) as exc:
        raise ValueError(f'{path}: missing or invalid paint receipt. Bake the pack again.') from exc
    if not isinstance(receipt, dict) or receipt.get('sourceManifestSha256') != digest(source_manifest):
        raise ValueError(f'{path}: source manifest changed since the bake. Bake the pack again.')
    hashes = receipt.get('pages')
    if not isinstance(hashes, dict) or hashes.keys() != {page['file'] for page in pages}:
        raise ValueError(f'{path}: painted page list differs from the source manifest')
    return hashes
