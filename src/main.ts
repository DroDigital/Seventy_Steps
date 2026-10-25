/**
 * Entry: the title screen, then the open world (saved to localStorage; `?fresh` skips the title and
 * starts anew), the combat arena (`?arena`, or `?spawn=<id>[&variant=eldritch|boss]` to add a roster
 * creature), `?bestiary`, or the `?look` test. `?debug` shows the debug panel (as the arena does)
 * and exposes the game on `window`. Settings, the audio engine and the veil outlive the title
 * screen (shell.ts); the world is made under the veil in steps, a frame drawn between them so its
 * sign breathes and its line fills (loading.ts), and every long jump after passes under it (journeys.ts).
 */

import { t } from './core/i18n';
import { PerspectiveCamera, Vector3 } from 'three';
import { createInput, emptyInput } from './core/input';
import { startLoop } from './core/loop';
import { darkOf, phaseOf } from './systems/clock';
import { waterAbout } from './render/reflection';
import { CLOCK, LIGHT, RENDER, SIM, type DifficultyId } from './data/tuning';
import type { Variant } from './data/registry';
import { EDITION } from './data/edition';
import { cameraModeOf } from './data/cameraModes';
import { setCameraMode } from './systems/camera';
import { createActorViews } from './render/actorViews';
import { createGameAudio } from './render/audio/gameAudio';
import { playMenuMusic } from './render/audio/music';
import { createBossFx } from './render/bossFx';
import { createCinema } from './render/cinema';
import { createDirector, wakeKneeling } from './render/cinemaDirector';
import { createCombatFx } from './render/combatFx';
import { createHoofFx } from './render/hoofFx';
import { createEchoFx } from './render/echoFx';
import { createImpactFx } from './render/impactFx';
import { createShadows } from './render/shadows';
import { createSignViews } from './render/signViews';
import { createPortalViews } from './render/portalViews';
import { createRealmLook } from './render/realmLook';
import { createSky } from './render/sky';
import { courtAt } from './render/courtMist';
import { createVolumetricFog, woodOf } from './render/volumetricFog';
import { createWorldLife } from './render/worldLife';
import { weatherHaze } from './render/weather';
import { createGroundFx } from './render/groundFx';
import { createWorldLights } from './render/worldLights';
import { createHurtFx } from './render/hurtFx';
import { createParticles } from './render/particles';
import { createPipeSmoke } from './render/pipeSmoke';
import { createCreatureViews } from './render/creatureViews';
import { createFightViews } from './render/fightViews';
import { fovOf, nearLens, placeCamera } from './render/followCamera';
import { allEffectsOn, computeFx, lensAt, type FxState } from './render/fx';
import { createFxController } from './render/fxController';
import { createHiddenViews } from './render/hiddenViews';
import { createWorldScene } from './render/worldScene';
import { lightNight, placeLantern } from './render/lantern';
import { lanternGain } from './render/lanternLife';
import { applyLens } from './render/lens';
import { ANOMALY } from './render/palette';
import { createPipeline } from './render/pipeline';
import { updatePostUniforms } from './render/postPass';
import { applyReality, lightReality } from './render/realityFx';
import { updateWorldUniforms, worldUniforms } from './render/worldMaterial';
import { FEEL, HEART } from './render/feel';
import { createGame, createWorldGame, stepGame } from './systems/game';
import { clearSave, loadSave, takeRecovery } from './systems/save';
import { haltAutosave, saveNow, startAutosave } from './ui/autosave';
import { createExtras } from './ui/runExtras';
import { showCrash } from './ui/crashScreen';
import { startBestiary } from './ui/bestiary';
import { HINTS, panelOptions, playerStats, spawnHint, worldStats } from './ui/debugHooks';
import { createCinemaUi } from './ui/cinemaUi';
import { createDebugPanel } from './ui/debugPanel';
import { createEndingCard, NEW_GAME_FLAG } from './ui/endingCard';
import { createDemoEnd } from './ui/demoEnd';
import { createHud } from './ui/hud';
import { createPhoto } from './ui/photo';
import { startLookTest } from './ui/lookTest';
import { loadModels } from './render/modelKit';
import { nextFrame, spriteAtlas } from './ui/loading';
import { installGameEvidence } from './ui/gameEvidence';
import { installFxLab } from './ui/fxLab';
import { createMapPainter } from './ui/mapPainter';
import { createMapScreen } from './ui/mapScreen';
import { noteLockAsked } from './core/mouseLock';
import { menuOpen, onMenusClear } from './ui/menuKit';
import { createPauseMenu } from './ui/pauseMenu';
import { createDialogue } from './ui/dialogue';
import { showIntro, type Intro } from './ui/intro';
import { journalPage } from './ui/journal';
import { armsPage } from './ui/armsPage';
import { createJourneys } from './ui/journeys';
import { createShell, type Shell } from './ui/shell';
import { createSignMenu, type SignMenu } from './ui/signMenu';
import { createSkyline } from './render/skyline';
import { achievementsPage, watchAchievements } from './ui/achievements';
import { createShopMenu } from './ui/shopMenu';
import { createFindCard } from './ui/findCard';
import { newFinds } from './systems/finds';
import { createRiseMenu } from './ui/riseMenu';
import { takeCarry } from './systems/records';
import { takeFlag, title } from './ui/titleFlow';
import { createArenaScene } from './world/arenaScene';
import { adapted, darkShare, gloomAt } from './world/gloom';
import { roofedAt } from './world/terrain';
import { refreshMountEntitlement } from './ui/mounts';
import { startMountGallery } from './ui/mountGallery';

const INTERACT_GRACE_MS = 350; // after a talk or a menu closes, E is held back this long

interface StartOptions {
  debug: boolean; // exposes the game (and the world scene) on `window` for console poking and scripted checks
  arena: boolean; // the combat arena instead of the open world
  fresh?: boolean; // the open world: forget the save and start anew
  intro?: boolean; // show the new game's opening first (not with ?fresh, which is for testing)
  difficulty?: DifficultyId; // a new game's, chosen at the title (round 38)
  creature?: string;
  variant?: Variant;
  bench?: boolean; // the benchmark (ui/bench.ts): the busiest places, measured
  perf?: boolean; // the frame meter shown from the start (F3 toggles it)
  trailer?: boolean; // the picture alone, turning about the dream's best places (ui/trailer.ts)
  hold?: number; // with the trailer: stay at this place
}

async function startGame(opts: StartOptions, shell: Shell): Promise<void> {
  const { debug, creature, variant } = opts;
  const { settings, veil } = shell;
  if (!veil.covered) veil.darken(); // the world is made out of sight
  const made = (share: number): Promise<void> => (veil.progress(share), nextFrame());
  const state: FxState = { sanity: 100, cap: settings.fxCap, anomalyProximity: 0, enabled: allEffectsOn() };
  let pipeline: ReturnType<typeof createPipeline>;
  try {
    pipeline = createPipeline(document.body);
  } catch (e) {
    return showCrash('webgl', e instanceof Error ? e.message : String(e)); // no WebGL 2: say so, rather than black
  }
  const canvas = pipeline.renderer.domElement;
  canvas.addEventListener('webglcontextlost', (e) => (e.preventDefault(), saveNow(), showCrash('lost')));
  const store = opts.arena ? null : shell.store;
  if (store && opts.fresh) clearSave(store);
  const carry = store && opts.fresh ? takeCarry(store) : null; // a new journey, begun from an ending (NG+)
  const game = opts.arena ? createGame({ creature, variant }) : createWorldGame({ save: (store && loadSave(store)) ?? undefined, carry: carry ?? undefined, difficulty: opts.difficulty, demo: EDITION === 'demo' });
  void refreshMountEntitlement(game);
  addEventListener('focus', () => void refreshMountEntitlement(game));
  if (!opts.arena && takeRecovery()) setTimeout(() => game.events.emit('Notice', { text: t('n.recovered') }), 6000); // (systems/save.ts)
  if (opts.intro && !opts.arena) wakeKneeling(game); // the wake (render/cinema.ts) begins on one knee
  const capture = (): void => {
    noteLockAsked();
    try {
      const r: unknown = canvas.requestPointerLock();
      if (r instanceof Promise) r.catch(() => undefined);
    } catch {
      // No pointer lock: a click on the canvas captures the mouse, as ever.
    }
  };
  onMenusClear(capture); // however a menu was left (a key, a click), the game takes the mouse again at once, with no click on the world (round 39)
  let spawned = false; // the world's own sound (ambience, drones, the realm's music) waits for the spawn: until then the theme plays on alone (round 29)
  const reveal = (): void => {
    spawned = true;
    shell.music?.fadeOut(); // the title's theme plays on until the world shows, then sinks away under its ambience
    shell.music = undefined;
    if (opts.intro) director.wake(); // a new game: the investigator wakes in the dream (round 20)
  };
  const journeys = createJourneys(game, veil, () => pipeline.warm(scene, camera).then(nextFrame)); // before the veil lifts, once the GPU has caught up
  const intro: Intro | null = opts.intro ? showIntro(() => (capture(), journeys.arrive(reveal)), shell.engine) : null; // the world is made behind it
  if (!intro) journeys.arrive(reveal); // names where the investigator wakes while the world is made
  await made(0.1);
  const lights = createWorldLights(() => game.world); // what the eye can see of them stops at a wall (rounds 36 and 37: render/lightSight.ts)
  const world = opts.arena ? null : createWorldScene(lights);
  const scene = world?.scene ?? createArenaScene();
  scene.add(lights.halos);
  scene.add(lights.flames);
  const menu: SignMenu | null = opts.arena ? null : createSignMenu(game, journeys.go);
  const ending = createEndingCard(game, store, () => (shell.music = playMenuMusic(shell.engine, settings.volume))); // the title's theme again, under an ending
  let building = true; // until the loop starts
  const pause = createPauseMenu({
    settings,
    change: shell.change,
    saveKeys: shell.saveKeys,
    resume: capture,
    map: opts.arena ? undefined : () => map.show(),
    journal: opts.arena ? undefined : (back, show) => journalPage(game, back, show),
    arms: (back, show) => armsPage(game, back, show),
    news: () => newFinds(game),
    achievements: opts.arena ? undefined : (back) => achievementsPage(store, back),
    quit: () => void veil.cover('', 0.8).then(() => (location.href = location.pathname)),
    held: () => building || cinema.active || journeys.busy, // check building first: cinema is not made yet while the sprites load; leaving during loading or a cutscene must not pause
  });
  if (store) startAutosave(game, store);
  if (!opts.arena) watchAchievements(game, store);
  const views = createActorViews(scene, game);
  await loadModels(); // the arenas' models, read before the world is built about them
  const creatures = createCreatureViews(scene, game, await spriteAtlas((p) => veil.progress(0.1 + 0.4 * p)));
  const fights = createFightViews(scene, game);
  const fxController = createFxController(game);
  const audio = createGameAudio(shell.engine, shell.drones, game);
  audio.warm(); // the realm's track decoded while the theme plays, to come in as it sinks
  const particles = createParticles(scene, (x, z) => game.world.ground(x, z)); // what falls from a blow rests on the ground under it (round 60)
  const hidden = createHiddenViews(scene, game, { audio, particles }); // the secret passages open with dust, light and the sound of stone (round 61)
  const pipeSmoke = createPipeSmoke(particles); // a smoker's thread and breath (round 39)
  const combatFx = createCombatFx(game, particles, () => views.muzzle);
  const hoofFx = createHoofFx(game, particles); // round 50: the dust, spray and sparks of a ride, on the gait's own footfalls
  const impactFx = createImpactFx(game, particles); // round 20: the weight of the investigator's blows
  const echoFx = createEchoFx(game, particles, audio); // round 20: a slain foe's Echoes leave the body and are drawn into the investigator
  const cinema = createCinema(game, createCinemaUi(), audio, particles, { enabled: () => settings.cutscenes > 0.5, rise: views.rise, figure: creatures.figure }); // round 20: wake, arrivals, falls, endings
  const director = createDirector(game, cinema, (id) => ending.show(id));
  const demoEnd = game.demo ? createDemoEnd(game, () => cinema.active || journeys.busy) : null; // round 56: the demo's end, once Keziah Mason has fallen
  const signs = createSignViews(scene, game, particles, lights);
  const portals = createPortalViews(scene, game, particles); // round 60: the gates' veils, walked through
  const ground = createGroundFx(); // what blows and bolts leave on the ground and send along it, shared by the horrors' attacks and the storm's (round 51, 52)
  const bossFx = createBossFx(scene, game, particles, ground);
  const shadows = createShadows(scene, game);
  const look = createRealmLook(pipeline.post); // round 32: each realm's own colours
  const sky = createSky(look);
  const mist = createVolumetricFog(pipeline.post); // round 16
  const skyline = createSkyline(scene, look);
  const life = createWorldLife(scene, game, audio, { sky: sky.mesh, post: pipeline.post, sheet: creatures.sheet, skyline, particles, lights, ground, beams: bossFx.beams }); // round 18: the world's own life
  scene.add(sky.mesh);
  const hurt = createHurtFx(game);
  const camera = new PerspectiveCamera(RENDER.fovDeg, RENDER.width / RENDER.height, RENDER.near, RENDER.far);
  const input = createInput(canvas, () => !menuOpen());
  const dialogue = createDialogue(game);
  const shop = createShopMenu(game);
  const finds = opts.arena ? null : createFindCard(game, () => dialogue.open || ending.open || !!intro?.open || !!demoEnd?.open || cinema.active || journeys.busy); // round 60: a weapon or a relic found says so, and what to do with it
  const rise = opts.arena ? null : createRiseMenu(game); // where to rise, when a lit candle reaches a fall (round 45)
  const painter = createMapPainter(game);
  const hud = createHud(game, canvas, painter, echoFx.pending, () => settings.questTracker > 0.5, { held: () => veil.active || cinema.active || journeys.busy, quiet: () => settings.quietWalk > 0.5 }); // round 80: the cards wait for the veil; the quiet walk
  const photo = createPhoto(game, canvas, () => audio.sample('clang', { gain: 0.4, pitch: 1.6 })); // round 26: P keeps a picture
  const map = createMapScreen(game, painter, capture, journeys.go);
  const panel = debug || opts.arena ? createDebugPanel(state, [...HINTS, ...(opts.arena ? spawnHint(creature, variant) : [])], panelOptions(game, settings, shell.change)) : null;
  lightNight();
  worldUniforms.uGlowColor.value.set(...ANOMALY.green).multiplyScalar(LIGHT.echoGlowIntensity); // Echo drops glow
  worldUniforms.uGlowRange.value = LIGHT.echoGlowRange;
  const noGlow = new Vector3(0, -1e4, 0);
  if (debug) Object.assign(window, { game, world, audio: shell.engine, life, cinema, pipeline, sky, scene, camera, settings, look, mist, creatures });
  if (debug) installGameEvidence(game, creatures);
  setCameraMode(game.camera, cameraModeOf(settings.camera)); // the look chosen in Settings › Play (round 77)
  placeCamera(camera, game, 1);
  void pipeline.compile(scene, camera); // compiling while the chunks are built (in parallel, where the browser can)
  await made(0.55);

  let lowRes = state.enabled.pixelate;
  let scale = settings.resolution;
  const resize = (): void => pipeline.resize(lowRes, scale);
  resize();
  addEventListener('resize', resize);

  const extras = createExtras(game, shell, store, opts, () => input.describe()); // the frame meter (with what the input hears), the first launch's picture, the benchmark, the trailer (round 46)
  let simTime = 0;
  const labHold = { on: false }; // the effects lab (?debug, ui/fxLab.ts) holds the world still and steps it by hand
  installFxLab(game, camera, { hold: labHold, step(n) { for (let i = 0; i < n; i++) { simTime += 1 / SIM.hz; stepGame(game, emptyInput()); } } });
  game.lit = (p) => lights.lightAt(p.x, p.y, p.z, simTime); // the mind mends faster in lamplight (round 22: sanity.ts)
  game.seaTime = () => simTime; // a body that falls into the sea meets the wave that is drawn (round 55: waterFall.ts)
  let frames = 0;
  let statsAt = performance.now();

  building = false;
  let waterNow = false;
  let heldAt = 0; // when a talk or a menu last held the investigator
  let wasPaused = false;
  startLoop(
    {
      step(dt) {
        setCameraMode(game.camera, cameraModeOf(settings.camera)); // (a change in the pause menu shows behind it at once)
        const frame = input.poll(); // polled even when unused, so no press is left latched for later
        if (pause.open && !wasPaused) input.reset(); // pausing lets go of every key and button and sets a drifted stick right: the way out of an input that has stuck (round 49)
        wasPaused = pause.open;
        finds?.update();
        if (menu?.open || shop.open || dialogue.open || pause.open || map.open || finds?.open) heldAt = performance.now();
        else if (performance.now() - heldAt < INTERACT_GRACE_MS) frame.pressed.interact = false; // E mashed through a talk does not rest at the sign behind it (round 17)
        const through = pause.open || map.open || finds?.open || dialogue.reading || intro?.open || demoEnd?.open ? null : journeys.before(frame); // (the demo's end card holds the world still, as the pause does)
        if (!through || labHold.on) return; // the world stands still
        simTime += dt;
        if (!cinema.step(dt)) return; // a cutscene: the world stands still, or takes only some of its steps
        const held = menu?.open || shop.open || rise?.open || ending.open || cinema.active;
        game.sheltered = dialogue.open || shop.open || !!menu?.open; // a dialogue, a trade or a sign's rest is open: nothing reaches the investigator, and the foes let go of them (targets.ts, brain.ts)
        stepGame(game, held ? emptyInput() : dialogue.talking ? { ...emptyInput(), lookX: through.lookX, lookY: through.lookY } : through); // talking, the world goes on while the investigator listens, and the camera is theirs to turn (round 68)
      },
      render(blend) {
        const still = pause.open || map.open || !!finds?.open || dialogue.reading || !!intro?.open || !!demoEnd?.open || journeys.still || labHold.on;
        const alpha = still || cinema.frozen ? 1 : cinema.alpha(blend);
        const time = simTime + (cinema.frozen && !still ? blend : alpha) / SIM.hz; // (a cutscene that stands the world still still runs its clocks smoothly: the rise and the sway)
        extras.tick();
        input.sensitivity = settings.sensitivity;
        input.invertY = settings.invertY > 0.5;
        [FEEL.shake, FEEL.flashes] = [settings.shake, settings.flashes];
        pipeline.post.uniforms.uGamma.value = 1 / settings.brightness;
        state.cap = settings.fxCap;
        if (lowRes !== state.enabled.pixelate || scale !== settings.resolution) {
          [lowRes, scale] = [state.enabled.pixelate, settings.resolution];
          resize();
        }
        placeCamera(camera, game, alpha, still || extras.hidesHud ? 0 : hud.calm); // (round 80: the quiet walk draws the camera back a little)
        cinema.update(camera, still ? 0 : blend); // over the follow camera's pose
        hud.hide(cinema.active || extras.hidesHud);
        const enclosed = !!world && roofedAt(camera.position.x, camera.position.z); // open ruins keep the sky (round 13)
        const lantern = lanternGain(game, alpha); // (the eye widens where it has gone out: world/gloom.ts)
        const gloom = enclosed ? gloomAt(camera.position.x, camera.position.z) : 0; // how dark the room under a roof is kept: the lantern is what is walked by (round 58)
        look.update(time, game.overworld?.region ?? null, enclosed, camera.position, false, game.overworld ? adapted(enclosed ? darkOf(CLOCK.start) * darkShare(gloom) : darkOf(phaseOf(time)), lantern) : 0);
        sky.update(camera, time, game.overworld?.region ?? null, enclosed);
        const feet = game.ecs.c.transform.get(game.player.id)!.pos.y;
        mist.update(camera, time, { region: game.overworld?.region ?? null, enclosed, ground: feet, stress: Math.min(1 - game.mind.sanity / 100, settings.fxCap), setting: settings.fog, wood: world ? woodOf(game.overworld?.region ?? null, camera.position.x, camera.position.z) : 0, court: world && !enclosed ? courtAt(camera.position.x, camera.position.z) : null, dark: look.dark });
        skyline.update(camera, time, game.overworld?.region ?? null, enclosed);
        const health = game.ecs.c.health.get(game.player.id);
        HEART.update(time, health ? health.hp / health.max : 1); // near death: the sound, the picture's edge and the health bar keep to it (round 23)
        hurt.update(pipeline.post, camera, time);
        impactFx.update(camera, time);
        const at = game.ecs.c.transform.get(game.player.id)!.pos;
        world?.update(at.x, at.z, journeys.budget);
        journeys.update(world?.pending ?? 0);
        views.update(alpha, time);
        placeLantern(game, alpha);
        if (game.player.mount.active && views.flame) worldUniforms.uLanternPos.value.copy(views.flame);
        lights.update(camera.position, time, views.flame, { x: at.x, y: at.y + 1.25, z: at.z }, 1 - (1 - views.flameCover(camera.position)) * lantern); // (a flame gone dark has no halo)
        pipeline.reflection.enabled = !!world && (frames % 30 === 0 ? (waterNow = waterAbout(game.world.ground, camera.position.x, camera.position.z)) : waterNow); // mirrored only where the sea is about (round 35)
        pipeline.lamps.enabled = !!world && settings.shadows > 0.5;
        pipeline.lamps.update(lights.casters, 1 / 60); // which lamps cast this frame, before they are drawn (round 35)
        creatures.update(alpha, time, camera);
        hidden.update(time);
        fights.update(alpha, time);
        combatFx.update();
        hoofFx.update(time);
        echoFx.update(time);
        signs.update(time, camera.position);
        portals.update(time, camera.position, veil.active);
        bossFx.update(alpha, time, camera);
        shadows.update(alpha);
        pipeSmoke.update(camera, time, views.smokers);
        particles.update(time, camera);
        fxController.update(state, camera.position, time);
        const fx = computeFx(state);
        sky.strange(fx.strange);
        look.apply(fx);
        applyReality(fx, game.reality);
        weatherHaze(fx, game.overworld?.weather, enclosed); // round 52: rain and storm close the world in
        lightReality(game.reality);
        life.update(camera, time, enclosed, alpha, gloom); // after the night's light: the lightning adds to it
        if (spawned) audio.update(fx, time, camera, still, cinema.active, cinema.active ? undefined : nearLens(camera, game));
        const lens = lensAt(fx, time, fovOf(game, alpha));
        applyLens(camera, cinema.lensFov(lens.fovDeg), lens.skew);
        updateWorldUniforms(fx, time, cinema.active ? camera.position : nearLens(camera, game), views.glow ?? noGlow, pipeline.size);
        updatePostUniforms(pipeline.post, fx, time, pipeline.size);
        if (!veil.covered) (pipeline.render(scene, camera, world && settings.shadows > 0.5 ? at : null, !enclosed), photo.after()); // nothing shows under the veil: its frames go to the making
        hud.update(camera);
        extras.update(pipeline.renderer.info.render.calls, pipeline.renderer.info.render.triangles);
        if (!panel) return;
        panel.refresh();
        frames++;
        const now = performance.now();
        if (now - statsAt >= 500) {
          const fps = Math.round((frames * 1000) / (now - statsAt));
          panel.setStats(`${fps} fps · ${pipeline.renderer.info.render.calls} draws\n${playerStats(game)}${world ? worldStats(game, world) : ''}`);
          [frames, statsAt] = [0, now];
        }
      },
    },
    SIM.hz,
    SIM.maxFrameSeconds,
    (e) => (console.error(e), haltAutosave(), showCrash('error', e instanceof Error ? e.message : String(e))), // a frame threw: stop, and say so
  );
}

const failedStart = (error: unknown): void => {
  console.error(error);
  haltAutosave();
  showCrash('error', error instanceof Error ? error.message : String(error));
};
const launch = (opts: StartOptions, shell: Shell): void => void startGame(opts, shell).catch(failedStart);

const params = new URLSearchParams(location.search);
const variant = params.get('variant');
if (params.has('mounts')) void startMountGallery().catch(failedStart);
else if (params.has('look')) startLookTest();
else if (params.has('bestiary')) void startBestiary().catch(failedStart);
else {
  const opts: StartOptions = {
    debug: params.has('debug'),
    arena: params.has('arena') || params.has('spawn'),
    fresh: params.has('fresh'),
    creature: params.get('spawn') ?? undefined,
    variant: variant === 'eldritch' || variant === 'boss' ? variant : undefined,
    bench: params.has('bench'),
    perf: params.has('perf'),
    trailer: params.has('trailer'),
    hold: params.has('hold') ? Number(params.get('hold')) : undefined,
  };
  if (opts.arena || opts.fresh) launch(opts, createShell());
  else if (takeFlag(NEW_GAME_FLAG)) launch({ ...opts, fresh: true, intro: true }, createShell()); // begun anew from an ending
  else {
    const shell = createShell();
    title(shell, (fresh, difficulty) => launch({ ...opts, fresh, intro: fresh, difficulty }, shell));
  }
}
