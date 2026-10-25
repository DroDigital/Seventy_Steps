/**
 * Round 80, atmosphere: specks hung in the lantern's light (render/lanternAir.ts): a few of dust and spores in the pool of it outdoors,
 * more, and falling, in a crypt's still air. They make the lantern's light a thing in the air and give the third-person view its parallax.
 * They thin out in a gale and are not born when the flame is out or guttering. Data only.
 */

export const LANTERN_MOTES = {
  rate: { open: 5, roofed: 9 }, // specks a second
  reach: [0.8, 5.5] as readonly [number, number], // metres from the lantern
  lens: 1, // metres: none within this of the lens
  size: [0.02, 0.035] as readonly [number, number],
  life: [6, 10] as readonly [number, number],
  drift: [0.04, 0.15] as readonly [number, number], // m/s
  rise: -0.02, // gravity: they hang and lift a little in the open air...
  fall: 0.03, // ...and settle in a crypt's
  alpha: 0.8,
  color: [0.95, 0.9, 0.78] as readonly [number, number, number], // warm bone
  windOff: 1.6, // none are born when the wind (uWind) is past this
  dim: 0.35, // none when the lantern's light (its colour's red, 1.15 at its steadiest) is below this
};
