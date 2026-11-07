/** Shared instanced billboard buffers for the procedural fallback and reviewed PNG pages. */
import * as THREE from 'three';
import { SPRITE_FRAG, SPRITE_VERT } from '../shaders/sprite';
import { worldUniforms } from '../worldMaterial';

export function spriteBatch(scene: THREE.Scene, texture: THREE.Texture, capacity: number, reviewed = false) {
  const material = new THREE.ShaderMaterial({
    uniforms: { ...worldUniforms, uAtlas: { value: texture }, uReviewed: { value: reviewed ? 1 : 0 } },
    vertexShader: SPRITE_VERT, fragmentShader: SPRITE_FRAG,
  });
  const geo = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0);
  const attr = (size: number): THREE.InstancedBufferAttribute =>
    new THREE.InstancedBufferAttribute(new Float32Array(capacity * size), size).setUsage(THREE.DynamicDrawUsage);
  const cells = attr(4), info = attr(4), fx = attr(4), wound = attr(4), glint = attr(4), tone = attr(4), cut = attr(4), piece = attr(4), ground = attr(4);
  geo.setAttribute('aCell', cells);
  geo.setAttribute('aInfo', info);
  geo.setAttribute('aFx', fx); // how far gone, in what style, how worn, a seed (shaders/spriteFx.ts; round 83)
  geo.setAttribute('aWound', wound); // where the last blow fell, its flash; w how far it slips (round 113: the attributes are at the GPU's most)
  const weird = { setX: (i: number, v: number) => void wound.setW(i, v), needsUpdate: false };
  geo.setAttribute('aGlint', glint); // the colour of its marks that keep their light in the dark, and how much (reviewedLook.ts)
  geo.setAttribute('aTone', tone); // how its form is recoloured to the realm (spriteTone.ts)
  geo.setAttribute('aCut', cut); // a killing cut, and which side of it this billboard is (spriteFx.ts; round 113)
  geo.setAttribute('aPiece', piece); // a severed piece's middle and turn, and the blood
  geo.setAttribute('aGround', ground); // the sea it wades in and the ground its feet sink into (render/bodyGround.ts)
  const mesh = new THREE.InstancedMesh(geo, material, capacity);
  mesh.frustumCulled = false;
  mesh.count = 0;
  scene.add(mesh);
  return {
    mesh, cells, info, weird, fx, wound, glint, tone, cut, piece, ground,
    finish(count: number) {
      mesh.count = count;
      mesh.instanceMatrix.needsUpdate = true;
      cells.needsUpdate = info.needsUpdate = fx.needsUpdate = wound.needsUpdate = glint.needsUpdate = tone.needsUpdate = cut.needsUpdate = piece.needsUpdate = ground.needsUpdate = true;
    },
  };
}

export function reviewedTextures(images: readonly HTMLImageElement[]): THREE.Texture[] {
  return images.map((image) => {
    const texture = new THREE.Texture(image);
    texture.magFilter = texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    // Metadata and authored RGBA rows both start at the top; match the procedural DataTexture.
    texture.flipY = false;
    texture.premultiplyAlpha = false;
    texture.colorSpace = THREE.NoColorSpace;
    texture.needsUpdate = true;
    return texture;
  });
}
