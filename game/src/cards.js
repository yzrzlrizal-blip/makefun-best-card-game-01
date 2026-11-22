// Ember Court — the cards: every card in the game, the four suits and the deck.
// A card is { id, name, suit, cost, power, effect, heal, text }.
//   effect: 'strike'  deals power damage to the rival
//           'siphon'  deals power damage, then heals you for `heal`
//           'guard'   gains power shield (shield soaks damage first)
//           'mend'    heals power life
//           'rally'   draws power cards from your deck
// Suits are told apart by colour AND shape, never by text alone:
//   ember = flame, tide = wave, thorn = leaf, stone = mountain.

export const SUITS = {
  ember: { name: 'Ember', glyph: '▲', colour: '#e5484d', soft: '#f5a3a6', dark: '#5c1a1c' },
  tide: { name: 'Tide', glyph: '≈', colour: '#3e8fd9', soft: '#a8d0f0', dark: '#123a5c' },
  thorn: { name: 'Thorn', glyph: '✦', colour: '#46a758', soft: '#a9d8b2', dark: '#123f1e' },
  stone: { name: 'Stone', glyph: '◆', colour: '#9b8a7a', soft: '#d8cfc4', dark: '#3d342c' },
};

export const MAX_LIFE = 16; // games run ~13 turns: damage decides, fatigue rarely does
export const MAX_MANA = 8;
export const START_HAND = 4;
export const HAND_LIMIT = 7;
export const FATIGUE_DAMAGE = 2;

// The deck: 24 cards, six per suit. Names, art and numbers are original.
export const CARD_DEFS = [
  // Ember — strikes, pure damage.
  { id: 'spark-imp', name: 'Spark Imp', suit: 'ember', cost: 1, power: 2, effect: 'strike', text: 'Deal 2 damage.' },
  { id: 'cinder-fox', name: 'Cinder Fox', suit: 'ember', cost: 2, power: 4, effect: 'strike', text: 'Deal 4 damage.' },
  { id: 'flame-lash', name: 'Flame Lash', suit: 'ember', cost: 2, power: 3, effect: 'strike', text: 'Deal 3 damage.' },
  { id: 'ash-phoenix', name: 'Ash Phoenix', suit: 'ember', cost: 3, power: 5, effect: 'strike', text: 'Deal 5 damage.' },
  { id: 'ember-drake', name: 'Ember Drake', suit: 'ember', cost: 3, power: 6, effect: 'strike', text: 'Deal 6 damage.' },
  { id: 'wildfire', name: 'Wildfire', suit: 'ember', cost: 4, power: 8, effect: 'strike', text: 'Deal 8 damage.' },
  // Tide — siphons, damage that heals you back.
  { id: 'foam-nymph', name: 'Foam Nymph', suit: 'tide', cost: 1, power: 1, effect: 'siphon', heal: 2, text: 'Deal 1 damage. Heal 2.' },
  { id: 'tidepool-sprite', name: 'Tidepool Sprite', suit: 'tide', cost: 1, power: 2, effect: 'siphon', heal: 2, text: 'Deal 2 damage. Heal 2.' },
  { id: 'river-serpent', name: 'River Serpent', suit: 'tide', cost: 2, power: 3, effect: 'siphon', heal: 2, text: 'Deal 3 damage. Heal 2.' },
  { id: 'mist-heron', name: 'Mist Heron', suit: 'tide', cost: 2, power: 4, effect: 'siphon', heal: 3, text: 'Deal 4 damage. Heal 3.' },
  { id: 'storm-kelpie', name: 'Storm Kelpie', suit: 'tide', cost: 3, power: 5, effect: 'siphon', heal: 3, text: 'Deal 5 damage. Heal 3.' },
  { id: 'deep-leviathan', name: 'Deep Leviathan', suit: 'tide', cost: 4, power: 7, effect: 'siphon', heal: 4, text: 'Deal 7 damage. Heal 4.' },
  // Thorn — mends and guards, the slow game.
  { id: 'briar-sprout', name: 'Briar Sprout', suit: 'thorn', cost: 1, power: 3, effect: 'mend', text: 'Heal 3 life.' },
  { id: 'vine-snare', name: 'Vine Snare', suit: 'thorn', cost: 1, power: 3, effect: 'guard', text: 'Gain 3 shield.' },
  { id: 'thorn-witch', name: 'Thorn Witch', suit: 'thorn', cost: 2, power: 4, effect: 'mend', text: 'Heal 4 life.' },
  { id: 'moss-guardian', name: 'Moss Guardian', suit: 'thorn', cost: 2, power: 5, effect: 'guard', text: 'Gain 5 shield.' },
  { id: 'bloom-dryad', name: 'Bloom Dryad', suit: 'thorn', cost: 3, power: 6, effect: 'mend', text: 'Heal 6 life.' },
  { id: 'elder-oak', name: 'Elder Oak', suit: 'thorn', cost: 3, power: 7, effect: 'guard', text: 'Gain 7 shield.' },
  // Stone — guards and rallies, the engine suit.
  { id: 'pebble-golem', name: 'Pebble Golem', suit: 'stone', cost: 1, power: 3, effect: 'guard', text: 'Gain 3 shield.' },
  { id: 'lodestone', name: 'Lodestone', suit: 'stone', cost: 1, power: 1, effect: 'rally', text: 'Draw 1 card.' },
  { id: 'granite-warden', name: 'Granite Warden', suit: 'stone', cost: 2, power: 5, effect: 'guard', text: 'Gain 5 shield.' },
  { id: 'flint-hawk', name: 'Flint Hawk', suit: 'stone', cost: 2, power: 3, effect: 'strike', text: 'Deal 3 damage.' },
  { id: 'rune-mason', name: 'Rune Mason', suit: 'stone', cost: 3, power: 2, effect: 'rally', text: 'Draw 2 cards.' },
  { id: 'quarry-giant', name: 'Quarry Giant', suit: 'stone', cost: 3, power: 8, effect: 'guard', text: 'Gain 8 shield.' },
];

/** A fresh copy of one card definition, with a unique instance id. */
export function makeCard(def, instance) {
  return { ...def, instance };
}

/** A shuffled deck: one of each card, in random order. */
export function buildDeck(random = Math.random) {
  const deck = CARD_DEFS.map((def, i) => makeCard(def, i));
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/** A short, readable label for a card's effect, for the log and the card face. */
export function effectLabel(card) {
  switch (card.effect) {
    case 'strike': return `⚔ ${card.power} damage`;
    case 'siphon': return `⚔ ${card.power} · ✚ ${card.heal}`;
    case 'guard': return `⛨ ${card.power} shield`;
    case 'mend': return `✚ ${card.power} heal`;
    case 'rally': return `⇪ draw ${card.power}`;
    default: return '';
  }
}
