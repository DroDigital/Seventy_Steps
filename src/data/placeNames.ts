/**
 * The names of the world's lesser places (playtest round 18: groves, graveyards, stone rings, ruins,
 * outcrops, camps and the far realms' landmarks had none, so wandering added up to nothing): each
 * realm names them in its own words, "The {adjective} {noun}", with a few named for what the stories
 * tell of them, given first. world/namedPlaces.ts deals them out. Data only.
 */

import type { FeatureKind } from '../world/features';

export interface Lexicon {
  adjectives: readonly string[];
  nouns: Readonly<Partial<Record<FeatureKind, readonly string[]>>>;
}

const NEW_ENGLAND: Lexicon = {
  adjectives: ['Old', 'Hanging', 'Blasted', 'Whispering', 'Crooked', 'Black', 'Hollow', 'Weeping', 'Bleak', 'Burnt', 'Sunken', 'Shunned', 'Lonely', 'Silent', 'Rotting', 'Forsaken'],
  nouns: {
    grove: ['Wood', 'Copse', 'Thicket', 'Stand', 'Wold', 'Grove'],
    graveyard: ['Burying Ground', 'Churchyard', 'Acre', 'Plot'],
    circle: ['Stones', 'Ring', 'Watchers'],
    ruin: ['Farm', 'Mill', 'Chapel', 'Homestead', 'Barn', 'Tavern', 'Cottage'],
    outcrop: ['Rock', 'Ledge', 'Knob', 'Tor', 'Crag'],
    camp: ['Camp', 'Fire', 'Hearth'],
    landmark: ['Stone', 'Pillar'],
  },
};

const LEXICONS: Readonly<Record<string, Lexicon>> = {
  hub: NEW_ENGLAND,
  arkham: NEW_ENGLAND,
  dunwich: NEW_ENGLAND,
  innsmouth: { ...NEW_ENGLAND, adjectives: ['Drowned', 'Salt', 'Weed-Hung', 'Rotting', 'Shuttered', 'Grey', 'Sunken', 'Tide-Worn', 'Shunned', 'Black', 'Lonely', 'Crooked'] },
  providence: NEW_ENGLAND,
  vermont: { ...NEW_ENGLAND, adjectives: ['Dark', 'Whispering', 'Pine', 'Hollow', 'Lonely', 'High', 'Crooked', 'Silent', 'Buzzing', 'Black', 'Old', 'Cold'] },
  mountains: {
    adjectives: ['Frozen', 'Windswept', 'Shattered', 'Silent', 'Buried', 'Five-Pointed', 'Slanting', 'Eroded', 'Primal', 'Glassy'],
    nouns: { ruin: ['Hall', 'Terrace', 'Vault', 'Colonnade'], outcrop: ['Ridge', 'Scarp', 'Spur', 'Crag'], camp: ['Camp', 'Cache', 'Bivouac'], landmark: ['Cone', 'Spire', 'Pinnacle'], circle: ['Ring'] },
  },
  pnakotus: {
    adjectives: ['Buried', 'Sand-Choked', 'Basalt', 'Titan', 'Ancient', 'Sunken', 'Cyclopean', 'Wind-Scoured', 'Nameless'],
    nouns: { ruin: ['Archive', 'Colonnade', 'Causeway', 'Hall'], outcrop: ['Scarp', 'Ridge', 'Dune'], camp: ['Camp', 'Dig'], landmark: ['Blocks', 'Monolith'], circle: ['Ring'] },
  },
  kn_yan: {
    adjectives: ['Blue-Lit', 'Sunken', 'Serpent', 'Toad', 'Glowing', 'Nameless', 'Silent', 'Echoing', 'Sealed'],
    nouns: { ruin: ['Shrine', 'Hall', 'Colonnade', 'Stair'], outcrop: ['Shelf', 'Ledge'], camp: ['Camp'], landmark: ['Pyramid', 'Ziggurat'], circle: ['Ring'] },
  },
  dreamlands: {
    adjectives: ['Moonlit', 'Silver', 'Singing', 'Sleeping', 'Lotus', 'Twilight', 'Onyx', 'Ivory', 'Carven', 'Dreaming', 'Amber', 'Whispering', 'Hidden', 'Fragrant'],
    nouns: { grove: ['Glade', 'Wood', 'Bower', 'Grove'], graveyard: ['Tombs'], circle: ['Ring', 'Stones'], ruin: ['Temple', 'Arch', 'Hall', 'Fane'], outcrop: ['Crag', 'Tor', 'Rock'], camp: ['Camp', 'Fire'] },
  },
  rlyeh: {
    adjectives: ['Drowned', 'Slimed', 'Tilted', 'Weed-Hung', 'Wrong-Angled', 'Dripping', 'Titan', 'Green', 'Leaning'],
    nouns: { ruin: ['Vault', 'Portal', 'Terrace', 'Stair'], outcrop: ['Reef', 'Shelf'], circle: ['Ring'], camp: ['Camp'], landmark: ['Spire', 'Monolith'] },
  },
  yuggoth: {
    adjectives: ['Fungoid', 'Humming', 'Black', 'Windowless', 'Terraced', 'Pitch', 'Crusted', 'Dim'],
    nouns: { ruin: ['Hive', 'Tower', 'Terrace'], outcrop: ['Ridge', 'Crust'], circle: ['Ring'], camp: ['Camp'], landmark: ['Tower', 'Spire'] },
  },
  beyond: {
    adjectives: ['Nameless', 'Endless', 'Shifting', 'Ultimate', 'Crawling', 'Formless', 'Dim', 'Hollow'],
    nouns: { ruin: ['Arch', 'Throne', 'Pedestal'], outcrop: ['Shelf'], circle: ['Circle', 'Pedestals'], camp: ['Camp'], landmark: ['Orb', 'Sphere'] },
  },
  // The Outer Dark (round 73)
  cloud_summit: {
    adjectives: ['Windswept', 'Gilded', 'High', 'Thin', 'Aurora-Lit', 'Listening', 'Barren', 'Unsheltered'],
    nouns: { ruin: ['Ledge', 'Altar', 'Stair'], outcrop: ['Crag', 'Shelf', 'Tor'], circle: ['Floor', 'Ring'], camp: ['Camp'], landmark: ['Horn', 'Spire'] },
  },
  black_wood: {
    adjectives: ['Black', 'Counted', 'Thousand-Footed', 'Soft', 'Breathing', 'Hoofed', 'Teeming', 'Wet', 'Many'],
    nouns: { grove: ['Wood', 'Thicket', 'Dam', 'Brood'], graveyard: ['Fold'], circle: ['Altar', 'Stones'], ruin: ['Lodge', 'Hollow'], outcrop: ['Rock', 'Knoll'], camp: ['Camp', 'Fire'] },
  },
  pale_lattice: {
    adjectives: ['Pale', 'Stilled', 'Faceted', 'Waiting', 'Clear', 'Unmoving', 'Patient', 'Bright', 'Ancient'],
    nouns: { ruin: ['Facet', 'Court', 'Hall'], outcrop: ['Prism', 'Shard'], circle: ['Ring', 'Lattice'], camp: ['Camp'], landmark: ['Prism', 'Vertex'] },
  },
  piping_dark: {
    adjectives: ['Thin', 'Monotonous', 'Reedy', 'Droning', 'Hollow', 'Ceaseless', 'Cracked', 'Muted', 'Unmeasured'],
    nouns: { ruin: ['Stair', 'Gallery', 'Pit'], outcrop: ['Shelf', 'Ledge'], circle: ['Ring', 'Dance'], camp: ['Camp'], landmark: ['Pipe', 'Reed'] },
  },
  spheres: {
    adjectives: ['Iridescent', 'Many-Faced', 'Hovering', 'Clustered', 'Shimmering', 'Open', 'Keyed', 'Glassy', 'Everywhere'],
    nouns: { ruin: ['Threshold', 'Door', 'Arch'], outcrop: ['Shelf', 'Rim'], circle: ['Basin', 'Ring'], camp: ['Camp'], landmark: ['Globe', 'Orb', 'Sphere'] },
  },
  court_centre: {
    adjectives: ['Blind', 'Blasphemous', 'Unnoticed', 'Boiling', 'Black', 'Idiot', 'Final', 'Unheard', 'Central'],
    nouns: { ruin: ['Hall', 'Gallery', 'Gate'], outcrop: ['Step', 'Shelf'], circle: ['Dance', 'Ring'], camp: ['Camp'], landmark: ['Block', 'Throne'] },
  },
};

/** The first names given, as the stories tell of those places, by region and kind. */
export const TOLD: Readonly<Record<string, Readonly<Partial<Record<FeatureKind, readonly string[]>>>>> = {
  arkham: { graveyard: ['Christchurch Cemetery', 'Hill Street Burying Ground'], ruin: ["Nahum Gardner's Farm"] },
  dunwich: { circle: ["The Devil's Hop Yard"], graveyard: ['The Dunwich Churchyard'], ruin: ['The Old Bishop Farm'] },
  innsmouth: { ruin: ['The Marsh Refinery', 'The Gilman House'], graveyard: ['The Marsh Family Plot'] },
  providence: { graveyard: ['North Burial Ground', 'Swan Point'] },
  vermont: { outcrop: ['Round Hill Ledge'] },
  dreamlands: { circle: ["The Zoogs' Ring"], ruin: ["The Cats' Terrace"] },
};

/** How a region names its places. */
export const lexiconOf = (region: string): Lexicon => LEXICONS[region] ?? NEW_ENGLAND;
