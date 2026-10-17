/** One batched spectral-fire draw: rising tongues, trailing streamers and hoof embers. */
import * as THREE from 'three';
import { worldUniforms } from './worldMaterial';

export interface MountFire { material: THREE.ShaderMaterial; update(time: number, speed: number): void }
export function mountFire(parent: THREE.Object3D): MountFire {
  const positions: number[] = [], uv: number[] = [], seeds: number[] = [];
  const ribbon = (x: number, y: number, z: number, height: number, width: number, seed: number, yaw: number): void => {
    const point = (u: number, v: number): void => {
      const w = (u - 0.5) * width * (1 - v * 0.88);
      positions.push(x + Math.cos(yaw) * w, y + v * height, z + Math.sin(yaw) * w); uv.push(u, v); seeds.push(seed);
    };
    for (let j = 0; j < 6; j++) {
      const a = j / 6, b = (j + 1) / 6;
      point(0, a); point(1, a); point(1, b); point(0, a); point(1, b); point(0, b);
    }
  };
  let seed = 0;
  for (const side of [-1, 1]) {
    for (let i = 0; i < 9; i++) ribbon(side * (0.77 + Math.sin(i * 2) * 0.1), 0.04, -1.7 + i * 0.38, 0.38 + (i % 3) * 0.17, 0.43, seed++, side * 0.4);
    for (let i = 0; i < 10; i++) ribbon(side * 0.67, 1.42 + i * 0.06, 2.15 + i * 0.13, 0.38 + (i % 4) * 0.07, 0.36, seed++, Math.PI / 2);
    for (let i = 0; i < 7; i++) ribbon(side * 0.67 + Math.sin(i * 3) * 0.21, 0.06, 2.04 + i * 0.22, 0.3 + (i % 3) * 0.1, 0.36, seed++, i);
    for (let i = 0; i < 5; i++) ribbon(side * 0.74, 2.65, -1.75 + i * 0.29, 0.34 + (i % 2) * 0.18, 0.29, seed++, Math.PI / 2);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geometry.setAttribute('aSeed', new THREE.Float32BufferAttribute(seeds, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uSpeed: { value: 0 }, uGhost: { value: 0 }, uFogColor: worldUniforms.uFogColor, uFogNear: worldUniforms.uFogNear, uFogFar: worldUniforms.uFogFar, uFogAmount: worldUniforms.uFogAmount },
    vertexShader: `attribute float aSeed;
      uniform float uTime; uniform float uSpeed;
      varying vec2 vUv; varying float vSeed; varying float vDistance;
      void main(){ vUv=uv; vSeed=aSeed; vec3 p=position;
        float t=uTime*3.5+aSeed*1.73;
        p.x+=sin(t+p.y*5.)*.08*uv.y; p.y+=sin(t*1.7)*.055*uv.y;
        p.z-=uv.y*uv.y*(.12+uSpeed*.045); p.z+=sin(t*.8+p.y*4.)*.055*uv.y;
        vec4 view=modelViewMatrix*vec4(p,1.); vDistance=length(view.xyz); gl_Position=projectionMatrix*view;
      }`,
    fragmentShader: `precision highp float;
      uniform float uTime; uniform float uGhost; uniform vec3 uFogColor; uniform float uFogNear; uniform float uFogFar; uniform float uFogAmount;
      varying vec2 vUv; varying float vSeed; varying float vDistance;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
      void main(){
        vec2 p=vUv; float t=uTime*2.+vSeed*.71;
        float n=noise(vec2(p.x*4.+vSeed,p.y*6.-t));
        float edge=abs(p.x-.5)*2.; float width=(1.-p.y)*(.62+.35*n);
        float alpha=smoothstep(width+.15,width-.12,edge)*smoothstep(1.,.3,p.y)*(.3+n*.48);
        alpha*=smoothstep(0.,.09,p.y); if(alpha<.02)discard;
        vec3 purple=mix(vec3(.31,.025,.63),vec3(.85,.07,.94),n);
        vec3 col=mix(purple,vec3(.88,.5,1.),pow(1.-edge,7.)*(1.-p.y)*.55);
        float fog=smoothstep(uFogNear,uFogFar,vDistance)*uFogAmount;
        gl_FragColor=vec4(mix(col,uFogColor,fog),alpha*(1.-fog)*(1.-uGhost)*.7);
      }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material); mesh.frustumCulled = false; mesh.renderOrder = 2; parent.add(mesh);
  return { material, update(time, speed) { material.uniforms.uTime.value = time; material.uniforms.uSpeed.value = speed; } };
}
