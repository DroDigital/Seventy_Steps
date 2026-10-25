import { SPILL } from '../../data/mistLight';

const gl = (n: number): string => n.toFixed(6);

/** The window's soft projection belongs to the receiving surface, before its texture and normal take the light. */
export const WINDOW_LIGHT_GLSL = /* glsl */ `
float windowBar(float x, float at, float width, float penumbra) {
  return 1.0 - smoothstep(width * 0.4, width * penumbra, abs(x - at));
}

float windowLightAt(vec3 p, vec3 source, vec4 window) {
  if (window.w <= 0.0) return 1.0; // ordinary lamps keep their original light
  vec2 normal = window.xy;
  vec2 fromGlass = p.xz - (source.xz - normal * window.z);
  float forward = dot(fromGlass, normal);
  float outward = smoothstep(0.0, 0.3, forward);
  if (outward <= 0.0) return 0.0; // a window cannot illuminate the far side of its wall
  float side = dot(fromGlass, vec2(-normal.y, normal.x));

  // Continue the pane-to-surface ray down to the ground. A raised rock or body
  // receives the same projection on its own surface instead of a patch beneath it.
  float height = window.w;
  float projection = height / max(source.y - p.y, height * 0.08);
  float reach = ${gl(SPILL.reach)} * (0.75 + ${gl(SPILL.tall)} * height);
  float along = forward * projection / reach;
  float width = 0.5 * mix(${gl(SPILL.near)}, ${gl(SPILL.far)}, clamp(along, 0.0, 1.0));
  float across = side * projection / width;
  float edge = 1.0 - smoothstep(0.35, 1.0, abs(across));
  float onset = smoothstep(0.0, ${gl(SPILL.soft)}, along);
  float fall = pow(max(1.0 - along, 0.0), ${gl(SPILL.fall)});
  float penumbra = mix(1.2, 2.8, clamp(along, 0.0, 1.0));
  float bars = max(windowBar(across, 0.0, ${gl(SPILL.bars[0])}, penumbra), windowBar(along, ${gl(SPILL.bars[1])}, ${gl(SPILL.bars[2])}, penumbra));
  float pattern = edge * onset * fall * (1.0 - (1.0 - ${gl(SPILL.bars[3])}) * bars);

  // A room is an extended source: retain a faint, broad fill near and above the
  // pane, with a softer shaped component below it. Existing distance falloff,
  // surface colour, normals and shadows still determine the resulting light.
  float broad = 1.0 - smoothstep(0.4, 1.2, abs(side) / (${gl(SPILL.near)} + forward * 0.8));
  return outward * (0.28 * broad + ${gl(SPILL.gain)} * pattern);
}
`;
