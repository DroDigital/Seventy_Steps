# Three surface studies

Three optional rendering directions, informed by the material relief experiment in [PR #230](https://github.com/DroDigital/Seventy_Steps/pull/230). They work in the world material rather than deriving height from the illuminated picture. The regular game still selects the original renderer.

Run `npm run dev`, then open:

- **Live comparison:** `http://localhost:5173/?fresh&trailer&hold=0&still&studies&study=carved`
- **Carved:** `http://localhost:5173/?fresh&study=carved`
- **Ceramic:** `http://localhost:5173/?fresh&study=ceramic`
- **Facets:** `http://localhost:5173/?fresh&study=facets`

`&studies` adds buttons that change the technique immediately on the current view. `&still` holds the trailer camera. Omit `study`, or use `study=off`, for the original. These choices do not write settings or select a permanent art direction. `fresh` is the existing new-game testing route; use a separate browser profile to keep an existing save.

| Direction | What makes the image | Improvement over picture-derived relief |
| --- | --- | --- |
| Carved | Filtered height from the surface's own texture, bounded normals, rough light and restrained glints | Joints catch real light without turning a lamp's painted pool into a ridge |
| Ceramic | Shallow relief, smoother pigment, wrapped diffuse lighting, a broad highlight with a smaller glaze highlight | Broad form reads through less texture noise; highlights follow the camera and light |
| Facets | Actual triangle normals, three directional lighting bands, simplified material texture, matte finish | Shape comes from the mesh and light rather than embossing every painted detail |

The height sampler uses the same primary, road, patch and region-border texture mixture as the surface. Its gradients are filtered through mipmaps; relief fades with distance and minification and has a hard slope limit. Diffuse and specular use the existing moon, lantern and lamps, including shadow maps, window opening masks, falloff and overlap limits. There is no added light source, replacement palette, screen grain or screen-wide pattern.

Solid terrain and architecture participate. Characters, sprites, emissive objects, glass, wax, liquids, mirrors and swaying plants retain their existing materials. The sky and depth buffer need no new classification. Fog, bloom, injury/sanity effects and the fall-to-black fade remain downstream of the material changes.

## Capture and verify

With the development server running:

```sh
node tools/surface_studies.mjs http://127.0.0.1:5173 --scenes 0,3,4
node tools/surface_probe.mjs http://127.0.0.1:5173
```

The script requires Playwright and Chromium; `PLAYWRIGHT_MODULE` and `CHROMIUM` select installed copies. Each scene loads once. The existing effects lab holds the simulation, animation and light clocks; the script completes remaining streaming jobs and switches the shared mode uniform to photograph the original plus all three treatments from the same view. Untouched browser screenshots and shader/runtime diagnostics go to `store/surface-studies/` (ignored by Git).

The probe renders the actual shaders on a small controlled scene and checks that the three outputs differ, excluded materials and runtime hit flashes stay unchanged, float colors remain finite, complete darkness and fall fades remain black, and comparison buttons leave saved settings untouched.

These are surface-rendering studies, so they do not replace geometry or add parallax displacement. Texture brightness remains an approximate material height, even though it no longer contains scene illumination. Per-pixel relighting and extra filtered texture samples cost more than the original vertex-lit path; software-rendered captures establish appearance and shader compatibility, not a hardware frame-rate target.
