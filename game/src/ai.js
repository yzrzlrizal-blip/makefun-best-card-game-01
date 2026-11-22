// Ember Court — the Warden: the AI rival. It reads the table, weighs each card
// it can afford, and plays the best one, favouring resonance chains and lethal.
// Deliberately readable: a human can see why it played what it played.

import { canPlay, resonanceBonus } from './state.js';
import { MAX_LIFE } from './cards.js';

/**
 * Score one card in the Warden's hand, in this position. Higher is better.
 * Damage is worth most when it threatens lethal; healing and shield matter
 * most when the Warden is hurt; drawing matters most with an empty hand.
 */
export function scoreCard(state, card, index) {
  const me = state.ai;
  const foe = state.player;
  const bonus = resonanceBonus(state, 'ai', card);
  const power = card.power + bonus;
  const missingLife = MAX_LIFE - me.life;
  let score = 0;
  switch (card.effect) {
    case 'strike':
      score = Math.min(power, foe.life) * 1.0;
      if (power >= foe.life) score += 50; // lethal
      if (foe.shield > 0) score -= Math.min(foe.shield, power) * 0.3;
      break;
    case 'siphon':
      score = Math.min(power, foe.life) * 0.9 + Math.min(card.heal, missingLife) * 0.8;
      if (power >= foe.life) score += 50;
      break;
    case 'guard':
      score = me.life <= 10 ? power * 1.3 : me.life <= 16 ? power * 0.8 : power * 0.35;
      if (foe.life <= 6) score *= 0.5; // press the attack instead
      break;
    case 'mend':
      score = Math.min(power, missingLife) * 1.1;
      if (missingLife === 0) score = 0.1;
      break;
    case 'rally':
      score = me.hand.length <= 2 ? 6 + power : 2 + power * 0.5;
      break;
    default:
      score = 0;
  }
  // Resonance chains are worth chasing: same suit as the last card played.
  if (bonus > 0) score += 2.5;
  // Cheap cards are efficient; a card that eats the whole mana pool must earn it.
  score -= card.cost * 0.15;
  return score;
}

/**
 * The Warden's plan for its turn: a list of hand indexes to play, in order.
 * It keeps playing while a card is worth more than passing (score > 1),
 * re-scoring after every play, since resonance and mana change the table.
 */
export function planTurn(state, random = Math.random) {
  const plan = [];
  // Simulate on a light copy of the hand/mana so scoring sees the chain.
  const hand = [...state.ai.hand];
  let mana = state.ai.mana;
  let lastSuit = null;
  const played = [];
  for (;;) {
    let best = -1;
    let bestScore = 1.0; // below this, the Warden passes
    for (let i = 0; i < hand.length; i++) {
      const card = hand[i];
      if (card.cost > mana) continue;
      // Score against a pretend state that carries the chain so far.
      const pretend = {
        ...state,
        ai: { ...state.ai, hand, mana },
        resonance: { ...state.resonance, ai: lastSuit },
      };
      let s = scoreCard(pretend, card, i);
      // A little wobble so the Warden is not a metronome.
      s += random() * 0.8;
      if (s > bestScore) {
        bestScore = s;
        best = i;
      }
    }
    if (best < 0) break;
    const card = hand[best];
    plan.push({ handIndex: state.ai.hand.indexOf(card), card });
    played.push(card);
    mana -= card.cost;
    lastSuit = card.suit;
    hand.splice(best, 1);
  }
  return plan;
}

/** A taunt the Warden speaks when it plays, for flavour in the log. */
export const TAUNTS = [
  'The Warden smiles. "The court remembers every ember."',
  '"A brave play," the Warden murmurs. "Bravery burns fast."',
  '"You play like the tide," says the Warden. "It always comes back."',
  'The Warden taps the table. "Again. The court enjoys a game."',
];

export function pickTaunt(random = Math.random) {
  return TAUNTS[Math.floor(random() * TAUNTS.length)];
}
