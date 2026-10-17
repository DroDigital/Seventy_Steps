/**
 * Lightning where storms roll (playtest round 18; LIGHTNING in tuning): over Dunwich's round hills,
 * Innsmouth's sea, R'lyeh and the mountains, during spells of rain or gale, and (round 52) in every thunderstorm, anywhere, the sky flickers white and the world with
 * it, a forked bolt is seen on the far ground (`onFlash`), and the thunder rolls after, later and duller the farther the strike (under a dungeon's roof,
 * only the thunder is heard). Updated each frame once the night's light is set (main.ts), it adds its
 * flash to the moon, the ambient light, the sky's haze and the mist.
 */

import type * as THREE from 'three';
import { LIGHTNING } from '../data/tuning';
import type { Weather } from '../systems/weather';
import { FEEL } from './feel';
import type { PostPass } from './postPass';
import { worldUniforms } from './worldMaterial';

export interface Lightning {
  update(time: number, region: string | null, hidden: boolean, weather: Weather | undefined): void;
  /** A strike now, `far` of the way to the horizon (0: overhead, its thunder at once; 1: far off): a bolt on the ground that the weather did not roll (systems/skyStrikes.ts). */
  strikeNow(far: number): void;
}

const between = ([lo, hi]: readonly [number, number]): number => lo + (hi - lo) * Math.random();

/** A strike's light `t` seconds in: three quick pulses, dying away; `flashes` below 1 dims it and melts the pulses into one soft swell (the Flashes setting, round 47). */
export function flicker(t: number, flashes = 1): number {
  if (t < 0 || t >= LIGHTNING.flash || flashes <= 0) return 0;
  const pulse = t < 0.06 ? 1 : t < 0.12 ? 0.2 : t < 0.2 ? 0.75 : t < 0.27 ? 0.15 : 0.45;
  const swell = 0.55 * Math.sin(Math.PI * Math.min(1, t / LIGHTNING.flash)) ** 2;
  const k = Math.min(1, flashes);
  return (swell + (pulse - swell) * k * k) * k * (1 - t / LIGHTNING.flash);
}

/** `onFlash`: told of each strike the sky rolls on its own, how far (0..1) it is, for the bolt to be drawn on the far ground. */
export function createLightning(sky: THREE.Mesh, post: PostPass, thunder: (gain: number) => void, onFlash: (far: number) => void = () => undefined): Lightning {
  const flash = (sky.material as THREE.ShaderMaterial).uniforms.uFlash; // the sky's own flash (shaders/sky.ts)
  let [next, struck, strength] = [NaN, -Infinity, 0];
  let rumbles: { when: number; gain: number }[] = []; // thunder on its way: a ground strike's can fall between a flash and its own
  let place: string | null = null;
  let now = 0;
  const strike = (far: number, at: number): void => {
    [struck, strength] = [at, 1 - 0.65 * far];
    rumbles.push({ when: at + (far < 0.02 ? 0.04 : LIGHTNING.delay[0] + (LIGHTNING.delay[1] - LIGHTNING.delay[0]) * far), gain: 1 - 0.6 * far });
  };
  return {
    strikeNow(far) {
      strike(far, now);
    },
    update(time, region, hidden, weather) {
      now = time;
      if (region !== place) {
        place = region;
        [next, struck] = [NaN, -Infinity];
        rumbles = []; // a journey cannot bring the last region's strike and thunder with it
      }
      const storm = weather && (((weather.kind === 'rain' || weather.kind === 'gale') && weather.amount >= LIGHTNING.storm) || (weather.kind === 'storm' && weather.amount >= LIGHTNING.stormGather));
      const every = region && storm ? (weather.kind === 'storm' ? LIGHTNING.stormEvery : LIGHTNING.every[region]) : undefined;
      if (!every) next = NaN;
      else if (Number.isNaN(next)) next = time + between(every) * 0.5;
      else if (time >= next) {
        next = time + between(every);
        const far = Math.random(); // 0: overhead, 1: on the horizon
        strike(far, time);
        if (!hidden) onFlash(far);
      }
      for (const r of rumbles.filter((x) => time >= x.when)) thunder(r.gain * (hidden ? LIGHTNING.inside : 1));
      rumbles = rumbles.filter((x) => time < x.when);
      const f = hidden ? 0 : flicker(time - struck, FEEL.flashes) * strength;
      flash.value = 0.085 * LIGHTNING.sky * f; // what the sky's haze took of it before the realms had their own skies (round 32)
      if (f <= 0) return;
      worldUniforms.uLightColor.value.addScalar(LIGHTNING.light * f);
      worldUniforms.uAmbient.value.addScalar(LIGHTNING.light * 0.5 * f);
      post.uniforms.uFogColor.value.addScalar(LIGHTNING.mist * f);
    },
  };
}
