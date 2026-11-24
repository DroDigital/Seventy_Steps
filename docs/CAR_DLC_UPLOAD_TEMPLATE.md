# Seventy Steps — The Brassbound Motor Car (DLC Upload Template)

Copy-paste-ready store listing, asset manifest, and Steamworks / itch.io upload guide for the **Brassbound Motor Car** optional cosmetic mount DLC.

To regenerate all 1920 × 1080 screenshots and composited covers/capsules locally (into git-ignored `store/dlc-car/`):

```bash
npm run dev
node tools/dlc_car_art.mjs
```

---

## 1. Store Identity & Metadata

| Field | Value |
| --- | --- |
| **DLC Title (Steam)** | `Seventy Steps — The Brassbound Motor Car` |
| **DLC Title (itch.io)** | `The Brassbound Motor Car (Cosmetic Mount DLC)` |
| **Short Tagline (itch.io / Subtitle)** | `Drive a circa-1914 brass-era touring motorcar across Arkham and the dreaming lands. Cosmetic only.` |
| **Type / Classification** | Downloadable Content (Cosmetic Mount Appearance) |
| **Base Game Required** | `Seventy Steps` |
| **Suggested Price** | Set in Steamworks / itch.io only (no price is displayed inside the game UI) |
| **Gameplay Impact** | **None (100% cosmetic)** — identical speed, acceleration, stamina, footprint, and traversal rules as the included horse-drawn Chariot (`MOUNT_TRAVERSAL`). Unlocked by the same early quest (*The Borrowed Reins*). |
| **Tags (Steam / itch.io)** | `Cosmetic`, `Lovecraftian`, `Retro`, `Low Poly`, `Atmospheric`, `Open World`, `Souls-like`, `Horror`, `Singleplayer`, `1920s` |

---

## 2. Short Description (Steam: max 300 characters)

> Trade the reins for a circa-1914 touring motorcar in black enamel and aged brass, complete with glowing acetylene headlamps, wooden artillery wheels, lively suspension, and a hand-crafted four-cylinder engine soundscape. Purely cosmetic — handles identically to the included chariot.

*(283 characters — fits comfortably inside Steam's 300-character limit.)*

---

## 3. Full Description — "About This Content" (Steam & itch.io)

### Markdown (itch.io / Docs)

**The Brassbound Motor Car** adds an optional circa-1914 brass-era touring automobile appearance for your mount in **Seventy Steps** — built in the game's retro-3D aesthetic to look, move, and sound like a period machine out of Arkham's foggy back roads.

#### What's Included
- **Hand-crafted circa-1914 touring coachwork:** Sweeping S-curve fenders, a tapered louvered bonnet, chamfered brass radiator with a winged Moto-Meter and spinning cooling fan, rounded rear tonneau, diamond-tufted oxblood-leather benches, mahogany dashboard with brass-bezel gauges, four-spoke steering wheel, coiled brass bulb horn, running-board Prest-O-Lite acetylene cylinder and strapped touring luggage chest, rear-mounted spare artillery wheel, and a folding canvas canopy with an open rear window for an unobstructed driving sightline.
- **Lively mechanical animation & lighting:** Damped four-degree-of-freedom suspension that squats on launch, dives under braking, leans into corners, shudders gently at idle, and lurches between gears; spinning radiator fan, articulated front steering tie-rod, animated brass gear-shift lever, steering driver hands, subtle tailpipe exhaust puffs, volumetric acetylene headlamp beams, warm cowl-lantern halos, and a brake-reactive ruby tail-lamp.
- **Overhauled vintage engine audio:** A warm four-cylinder engine soundscape that lopes at idle, pulls harder under throttle, shifts across four gears with mechanical clunks and low-gear planetary hum, starts with a multi-stroke hand crank, brakes with mechanical scrub, and pops softly on overrun deceleration.

#### Purely Cosmetic — No Advantage, No Shortcut
- **Identical traversal:** The Brassbound Motor Car shares the exact same speed, turning, stamina use, collision footprint, and rules as the horse-drawn Chariot included in the base game.
- **Earned the same way:** Complete the early errand *The Borrowed Reins* to unlock mounts, then switch between the included Chariot and the Brassbound Motor Car at any Elder Sign's **Mounts** tab.
- **No separate download required:** Assets are already included in the base game; owning and enabling this DLC unlocks the appearance in-game automatically on Steam.

---

### Steam BBCode Version (Ready to Paste into Steamworks)

```bbcode
[b]The Brassbound Motor Car[/b] adds an optional circa-1914 brass-era touring automobile appearance for your mount in [b]Seventy Steps[/b] — built in the game's retro-3D aesthetic to look, move, and sound like a period machine out of Arkham's foggy back roads.

[h2]What's Included[/h2]
[list]
[*][b]Hand-crafted circa-1914 touring coachwork:[/b] Sweeping S-curve fenders, a tapered louvered bonnet, chamfered brass radiator with a winged Moto-Meter and spinning cooling fan, rounded rear tonneau, diamond-tufted oxblood-leather benches, mahogany dashboard with brass-bezel gauges, four-spoke steering wheel, coiled brass bulb horn, running-board Prest-O-Lite acetylene cylinder and strapped touring luggage chest, rear-mounted spare artillery wheel, and a folding canvas canopy with an open rear window.
[*][b]Lively mechanical animation & lighting:[/b] Damped suspension with launch squat, brake dive, cornering body roll, gear-shift lurch, and subtle idle shudder; spinning cooling fan, articulated tie-rod and gear-shift lever, steering driver hands, tailpipe exhaust puffs, volumetric acetylene headlamp beams, warm cowl-lantern halos, and a brake-reactive ruby tail-lamp.
[*][b]Vintage four-cylinder engine audio:[/b] Warm four-cylinder bed that lopes at idle, pulls under throttle, shifts across four gears with mechanical clunks and low-gear planetary hum, cranks to life on summon, brakes with mechanical scrub, and burbles on overrun deceleration.
[/list]

[h2]Purely Cosmetic — No Gameplay Advantage[/h2]
[list]
[*][b]Identical traversal:[/b] Shares the exact same speed, stamina cost, collision footprint, and rules as the horse-drawn Chariot included in the base game.
[*][b]Same early unlock:[/b] Complete [i]The Borrowed Reins[/i] to unlock mounts, then switch freely between the Chariot and the Brassbound Motor Car at any Elder Sign's [b]Mounts[/b] tab.
[*][b]No extra download:[/b] The appearance ships inside the base game; enabling this DLC unlocks it immediately through Steam.
[/list]
```

---

## 4. Languages, Content Notes & AI Disclosure

- **Languages:** Interface in English, German, French, and Spanish (matches base game; the DLC introduces no new spoken dialogue).
- **Content Notes:** Same rating/advisories as the base game (`Seventy Steps`). No additional violence, gore, or flashing effects beyond base-game settings (FX intensity cap remains respected).
- **AI-Generated Content Disclosure (Steam & itch.io):**
  - **This DLC itself contains zero AI-generated assets:** the Brassbound Motor Car's 3D geometry, animations, volumetric lamp shaders, exhaust particles, and synthesized mechanical audio are 100% procedural code written specifically for the game.
  - **Base game disclosure:** Keep aligned with `docs/STORE_PAGE.md` (base game uses ElevenLabs voices, Suno music, AI-assisted code/text, and AI-assisted creature sprite bases).

---

## 5. Store Asset Manifest (Generated into `store/dlc-car/`)

### Covers & Capsules (`store/dlc-car/covers/`)

| File | Dimensions | Target Slot |
| --- | --- | --- |
| `itch-cover-630x500.png` | 630 × 500 | itch.io Cover Image |
| `itch-social-1200x630.png` | 1200 × 630 | itch.io Social / Open Graph preview |
| `itch-wide-banner-2100x900.png` | 2100 × 900 | itch.io Page Header / Promo Banner (21:9) |
| `steam-header-460x215.png` | 460 × 215 | Steam DLC Header Capsule |
| `steam-main-616x353.png` | 616 × 353 | Steam DLC Main Capsule |
| `steam-small-231x87.png` | 231 × 87 | Steam DLC Small Capsule |
| `steam-vertical-374x448.png` | 374 × 448 | Steam DLC Vertical Capsule |
| `steam-library-600x900.png` | 600 × 900 | Steam DLC Library Capsule |

### 1920 × 1080 Screenshots (`store/dlc-car/screenshots/`)

| File | Dimensions | Recommended Store Caption |
| --- | --- | --- |
| `01-hero-three-quarter.png` | 1920 × 1080 | *Circa-1914 black enamel and aged brass coachwork, wooden artillery wheels, and glowing acetylene headlamps.* |
| `02-rear-three-quarter.png` | 1920 × 1080 | *Rounded rear tonneau, strapped spare artillery wheel, ruby oil tail-lamp, and open rear sightline window.* |
| `03-side-profile.png` | 1920 × 1080 | *Continuous swept S-curve fenders, brass-trimmed running boards, strapped mahogany touring chest, and folding canvas canopy.* |
| `04-arkham-night-drive.png` | 1920 × 1080 | *Cruising Arkham's foggy night roads with volumetric acetylene headlamp beams and soft tailpipe exhaust.* |
| `05-elder-sign-mounts-tab.png` | 1920 × 1080 | *Switch seamlessly between the included Chariot and the Brassbound Motor Car at any Elder Sign.* |
| `06-investigator-at-the-wheel.png` | 1920 × 1080 | *Seated left-hand drive with animated steering wheel, front tie-rod, brass gear lever, and active suspension.* |

---

## 6. Steamworks & Release Checklist

1. Create the DLC App under the `Seventy Steps` base App in Steamworks.
2. Upload the 5 Steam capsules (`460×215`, `616×353`, `231×87`, `374×448`, `600×900`) and at least 5 of the `1920×1080` screenshots above.
3. Paste the **Short Description** and **BBCode About This Content** above, select languages & tags, and set regional pricing in Steamworks.
4. Configure the DLC as entitlement-only (no separate depot required; the assets ship in the base build and unlock when `apps.isSubscribedApp(id) && apps.isDlcInstalled(id)` both return `true`).
5. Record the live DLC App ID in `package.json` under `steam.automobileDlcAppId` (distinct from `steam.appId`), pack a Steam test build, and verify owned, unowned, disabled, offline, and refunded states via the Elder Sign **Mounts** tab.
