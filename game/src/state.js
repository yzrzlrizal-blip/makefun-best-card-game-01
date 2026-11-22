// Ember Court — the rules: turns, mana, resonance, damage, shield, fatigue, winning.
// Pure logic, no DOM: render.js draws whatever this module returns, ai.js reads it.

import { buildDeck, MAX_LIFE, MAX_MANA, START_HAND, HAND_LIMIT, FATIGUE_DAMAGE } from './cards.js';

/** One side of the table: life, shield, mana, hand, deck, cards played this turn. */
function newSide(deck) {
  return {
    life: MAX_LIFE,
    shield: 0,
    mana: 0,
    maxMana: 0,
    deck,
    hand: [],
    playedThisTurn: [],
    cardsPlayed: 0,
    damageDealt: 0,
    healed: 0,
  };
}

/** A fresh game: both sides draw their opening hands. */
export function newGame(random = Math.random) {
  const state = {
    turn: 1,
    phase: 'player', // 'player' | 'ai' | 'over'
    winner: null, // 'player' | 'ai' | null
    player: newSide(buildDeck(random)),
    ai: newSide(buildDeck(random)),
    log: [],
    lastPlayed: { player: null, ai: null },
    resonance: { player: null, ai: null },
    stats: { turns: 0, cardsPlayed: 0 },
  };
  // The challenger opens with one extra card: the Warden answers every play,
  // so the first seat needs the edge. The Warden draws the usual four.
  drawCards(state, 'player', START_HAND + 1, random);
  drawCards(state, 'ai', START_HAND, random);
  state.log.push('The court is seated. You hold the first turn.');
  return state;
}

/** Draw n cards for a side; an empty deck deals fatigue damage instead. */
export function drawCards(state, side, n, random = Math.random) {
  const s = state[side];
  for (let i = 0; i < n; i++) {
    if (s.deck.length === 0) {
      s.life -= FATIGUE_DAMAGE;
      state.log.push(`${side === 'player' ? 'You' : 'The Warden'} run dry — fatigue bites for ${FATIGUE_DAMAGE}.`);
      checkEnd(state);
      if (state.phase === 'over') return;
      continue;
    }
    if (s.hand.length >= HAND_LIMIT) {
      const lost = s.deck.pop();
      state.log.push(`${side === 'player' ? 'Your' : "The Warden's"} hand is full — ${lost.name} is discarded.`);
      continue;
    }
    s.hand.push(s.deck.pop());
  }
}

/** Damage soaks shield first, then life. Returns the life lost. */
export function dealDamage(state, side, amount) {
  const s = state[side];
  const soaked = Math.min(s.shield, amount);
  s.shield -= soaked;
  const lifeLost = amount - soaked;
  s.life -= lifeLost;
  return lifeLost;
}

/** Heal up to max life. Returns the life actually restored. */
export function heal(state, side, amount) {
  const s = state[side];
  const healed = Math.min(amount, MAX_LIFE - s.life);
  s.life += healed;
  s.healed += healed;
  return healed;
}

/** Resonance: a card played after another of the same suit this turn gains +2 power. */
export function resonanceBonus(state, side, card) {
  return state.resonance[side] === card.suit ? 2 : 0;
}

/** Can this side afford and play this card right now? */
export function canPlay(state, side, index) {
  if (state.phase === 'over') return false;
  if (side === 'player' && state.phase !== 'player') return false;
  if (side === 'ai' && state.phase !== 'ai') return false;
  const s = state[side];
  const card = s.hand[index];
  if (!card) return false;
  return s.mana >= card.cost;
}

/**
 * Play a card from a side's hand. Applies resonance, moves the card to the
 * table, and resolves its effect. Returns a description of what happened,
 * or null when the card cannot be played.
 */
export function playCard(state, side, index) {
  if (!canPlay(state, side, index)) return null;
  const me = state[side];
  const foe = state[side === 'player' ? 'ai' : 'player'];
  const card = me.hand[index];
  const bonus = resonanceBonus(state, side, card);
  const power = card.power + bonus;
  me.mana -= card.cost;
  me.hand.splice(index, 1);
  me.playedThisTurn.push(card);
  me.cardsPlayed++;
  state.stats.cardsPlayed++;
  state.resonance[side] = card.suit;
  state.lastPlayed[side] = { ...card, power, bonus };

  let result = '';
  switch (card.effect) {
    case 'strike': {
      const lost = dealDamage(state, side === 'player' ? 'ai' : 'player', power);
      me.damageDealt += power;
      result = `deals ${power} damage${lost < power ? ` (${power - lost} soaked by shield)` : ''}`;
      break;
    }
    case 'siphon': {
      const lost = dealDamage(state, side === 'player' ? 'ai' : 'player', power);
      me.damageDealt += power;
      const healed = heal(state, side, card.heal);
      result = `deals ${power} damage and drinks back ${healed} life`;
      break;
    }
    case 'guard': {
      me.shield += power;
      result = `raises ${power} shield`;
      break;
    }
    case 'mend': {
      const healed = heal(state, side, power);
      result = `mends ${healed} life`;
      break;
    }
    case 'rally': {
      drawCards(state, side, power);
      result = `draws ${power} card${power > 1 ? 's' : ''}`;
      break;
    }
    default:
      result = 'does nothing';
  }
  const who = side === 'player' ? 'You play' : 'The Warden plays';
  const res = bonus > 0 ? ` — resonance! +${bonus}` : '';
  state.log.push(`${who} ${card.name}${res} and ${result}.`);
  checkEnd(state);
  return { card, power, bonus, result };
}

/** Start a side's turn: +1 max mana, refill mana, draw a card. */
export function startTurn(state, side) {
  const s = state[side];
  s.maxMana = Math.min(MAX_MANA, s.maxMana + 1);
  s.mana = s.maxMana;
  s.playedThisTurn = [];
  state.resonance[side] = null;
  state.phase = side;
  if (side === 'player') state.stats.turns++;
  drawCards(state, side, 1);
  if (state.phase !== 'over') {
    state.log.push(side === 'player' ? `— Your turn ${state.turn} —` : `— The Warden's turn —`);
  }
}

/** End the current side's turn and hand the table to the other side. */
export function endTurn(state) {
  if (state.phase === 'over') return;
  if (state.phase === 'player') {
    startTurn(state, 'ai');
  } else {
    state.turn++;
    startTurn(state, 'player');
  }
}

/** A side has won when the other's life reaches zero. */
export function checkEnd(state) {
  if (state.phase === 'over') return;
  if (state.ai.life <= 0) {
    state.phase = 'over';
    state.winner = 'player';
    state.log.push('The Warden falls. The Ember Court is yours!');
  } else if (state.player.life <= 0) {
    state.phase = 'over';
    state.winner = 'ai';
    state.log.push('Your ember gutters out. The Warden keeps the court.');
  }
}

/** A one-line summary of a side for the HUD. */
export function sideSummary(state, side) {
  const s = state[side];
  return {
    life: Math.max(0, s.life),
    shield: s.shield,
    mana: s.mana,
    maxMana: s.maxMana,
    deck: s.deck.length,
    hand: s.hand.length,
  };
}
