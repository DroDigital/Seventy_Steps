/**
 * What the dungeons' models are made of when it is not stone (round 77: the brief asked for glass, liquid, reflection and wax, and a mirror was a framed dark
 * panel): the world fragment shader's last word on a face, chosen by a define. Glass is clear until it is seen aslant or catches a lamp, and a pale band
 * crosses it as the eye moves; liquid is lit from within, rippling at its top, with bubbles rising through it; wax takes the lamps through itself in a
 * warm glow at its edges; a mirror is the room drawn again from behind it (render/mirrorView.ts), dimmed, cooled and a little tarnished, and a dark
 * silvered panel where none is drawn. Each reads `n`, `toEye`, `streak` (the lamps' sheen), `lamp`, `col` and `alpha` of the world shader's main().
 */

export const SURFACE_UNIFORMS = /* glsl */ `
#ifdef SURF_MIRROR
uniform sampler2D uMirrorMap; // the room drawn from behind the mirror, and the matrix that takes a world point to it (mirrorMath.ts)
uniform mat4 uMirrorMat;
uniform vec4 uMirrorPlane; // the plane of the mirror that is drawn: the normal toward the room, and its offset
uniform float uMirrorOn;
uniform float uMirrorGain;
#endif
`;

export const SURFACE_APPLY = /* glsl */ `
#ifdef SURF_GLASS
  {
    float fres = pow(1.0 - abs(dot(n, toEye)), 3.0);
    float spec = pow(max(dot(reflect(-toEye, n), uLightDir), 0.0), 40.0);
    float sweep = fract(dot(vWorld, vec3(0.7, 0.9, 0.7)) * 0.9 + dot(toEye, vec3(0.8, 0.0, 0.6)) * 1.3);
    float band = smoothstep(0.0, 0.07, 0.5 - abs(sweep - 0.5)); // a pale band across old glass that moves as the eye does
    col += (streak * 1.8 + uLightColor * spec * 0.9) * (0.4 + fres) + fres * uFogColor * 0.5 + vec3(0.55, 0.62, 0.66) * band * 0.11 * (0.4 + fres);
    alpha = clamp(alpha + 0.5 * fres + 0.55 * spec + 0.5 * length(streak) + 0.05 * band, 0.0, 0.92);
  }
#endif
#ifdef SURF_LIQUID
  {
    float up = smoothstep(0.6, 0.95, n.y); // its surface
    float rip = 0.6 * vnoise(vWorld.xz * 9.0 + vec2(uTime * 0.55, -uTime * 0.4)) + 0.4 * vnoise(vWorld.xz * 17.0 - vec2(uTime * 0.45, -uTime * 0.3));
    float current = 0.7 + 0.5 * vnoise(vec2(vWorld.y * 6.0 - uTime * 0.35, dot(vWorld.xz, vec2(0.7, 0.7)) * 4.0)); // slow turnings within
    float bubble = step(0.965, vnoise(vec2(dot(vWorld.xz, vec2(5.0, 7.0)), vWorld.y * 14.0 - uTime * 1.6))); // and the odd bubble rising
    float fres = pow(1.0 - abs(dot(n, toEye)), 2.5);
    col = col * (1.25 + 0.55 * rip * up) * current + streak * 0.8 * up + bubble * 0.45 * vec3(0.75, 0.9, 0.85) + fres * 0.18 * col;
    alpha = clamp(alpha + 0.3 * fres + 0.35 * up, 0.0, 0.9);
  }
#endif
#ifdef SURF_WAX
  {
    float rim = pow(1.0 - max(dot(n, toEye), 0.0), 1.6);
    vec3 warm = vec3(1.0, 0.8, 0.52);
    col = col * mix(vec3(1.0), warm * 1.15, 0.28) + (lamp * 0.7 + 0.04) * warm * rim * 0.9 + streak * 0.35; // lit through itself, soft at its edges
  }
#endif
#ifdef SURF_MIRROR
  {
    vec4 mc = uMirrorMat * vec4(vWorld, 1.0);
    vec2 muv = mc.xy / max(mc.w, 1e-4);
    float shown = uMirrorOn * (1.0 - smoothstep(0.08, 0.16, abs(dot(vWorld, uMirrorPlane.xyz) + uMirrorPlane.w))) * step(0.0, mc.w);
    muv += 0.0025 * vec2(sin(vWorld.y * 21.0 + uTime * 0.6), cos(vWorld.x * 17.0 + vWorld.z * 13.0 - uTime * 0.5)); // the faint swim of old glass
    vec3 seen = texture2D(uMirrorMap, clamp(muv, 0.002, 0.998)).rgb * vec3(0.78, 0.9, 0.9) * uMirrorGain + vec3(0.02, 0.026, 0.03);
    seen *= 0.8 + 0.12 * vnoise(vWorld.xy * 5.0 + vWorld.z * 5.0 + 3.0); // tarnish
    col = mix(col * 0.35, seen, shown) + streak * 1.2;
  }
#endif
`;
