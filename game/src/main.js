// Ember Court — the table's host: boots the game, wires clicks and keys,
// runs the Warden's turn card by card, and sets up the screenshot states.
// `?shot=play|win|loss` jumps straight to a staged table for screenshots.

import { newGame, playCard, endTurn, startTurn } from './state.js';
import { planTurn, pickTaunt } from './ai.js';
import { renderGame, showTitle, showEnd, hideOverlays } from './render.js';
import {
  unlockAudio, setMuted, isMuted,
  sfxPlay, sfxHit, sfxHeal, sfxDraw, sfxTurn, sfxWin, sfxLose,
} from './audio.js';
import { CARD_DEFS } from './cards.js';

const $ = (id) => document.getElementById(id);
const AI_STEP_MS = 750;

let state = null;
let aiBusy = false;
let started = false;

function soundFor(card) {
  if (card.effect === 'strike' || card.effect === 'siphon') sfxHit();
  else if (card.effect === 'mend' || card.effect === 'guard') sfxHeal();
  else sfxDraw();
}

function afterPlay() {
  renderGame(state, handlers);
  if (state.phase === 'over') {
    finishGame();
  }
}

/** The Warden takes its turn, one card at a time so the player can follow. */
async function runAiTurn() {
  aiBusy = true;
  renderGame(state, handlers);
  await sleep(650);
  if (state.phase !== 'ai') {
    aiBusy = false;
    return;
  }
  const plan = planTurn(state);
  for (const step of plan) {
    if (state.phase !== 'ai') break;
    const idx = state.ai.hand.indexOf(step.card);
    if (idx < 0) continue;
    const played = playCard(state, 'ai', idx);
    if (played) soundFor(played.card);
    renderGame(state, handlers);
    await sleep(AI_STEP_MS);
    if (state.phase === 'over') break;
  }
  aiBusy = false;
  if (state.phase === 'over') {
    finishGame();
    return;
  }
  if (Math.random() < 0.35) state.log.push(pickTaunt());
  endTurn(state); // back to the player
  sfxTurn();
  renderGame(state, handlers);
}

function finishGame() {
  renderGame(state, handlers);
  if (state.winner === 'player') sfxWin();
  else sfxLose();
  setTimeout(() => showEnd(state), 650);
}

const handlers = {
  onPlayCard(i) {
    if (!started || aiBusy || state.phase !== 'player') return;
    unlockAudio();
    const played = playCard(state, 'player', i);
    if (!played) return;
    sfxPlay();
    soundFor(played.card);
    afterPlay();
  },
  onEndTurn() {
    if (!started || aiBusy || state.phase !== 'player') return;
    unlockAudio();
    endTurn(state);
    sfxTurn();
    renderGame(state, handlers);
    if (state.phase === 'ai') runAiTurn();
    else if (state.phase === 'over') finishGame();
  },
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function startNewGame() {
  state = newGame();
  started = true;
  aiBusy = false;
  hideOverlays();
  startTurn(state, 'player');
  renderGame(state, handlers);
  window.__emberCourt = state;
}

/** Find a card definition by id, for staging screenshot tables. */
function defById(id) {
  return CARD_DEFS.find((d) => d.id === id);
}

function stageCard(id) {
  const def = defById(id);
  return { ...def, instance: `shot-${id}` };
}

/**
 * Stage a mid-game table for the `play` screenshot: both hands dealt, cards
 * on the table, life totals dented, a resonance chain live. Built from the
 * same state the real game uses, so the shot is the game itself.
 */
function stagePlayTable() {
  state = newGame(() => 0.5);
  started = true;
  state.turn = 6;
  state.phase = 'player';
  state.player.life = 13;
  state.player.shield = 3;
  state.player.mana = 5;
  state.player.maxMana = 6;
  state.player.hand = ['cinder-fox', 'ember-drake', 'mist-heron', 'moss-guardian', 'rune-mason'].map(stageCard);
  state.player.deck = state.player.deck.slice(0, 14);
  state.ai.life = 11;
  state.ai.shield = 2;
  state.ai.mana = 4;
  state.ai.maxMana = 6;
  state.ai.hand = [stageCard('spark-imp'), stageCard('tidepool-sprite'), stageCard('pebble-golem'), stageCard('flame-lash'), stageCard('briar-sprout')];
  state.ai.deck = state.ai.deck.slice(0, 12);
  state.lastPlayed.player = { ...stageCard('flame-lash'), power: 3, bonus: 0 };
  state.lastPlayed.ai = { ...stageCard('moss-guardian'), power: 5, bonus: 0 };
  state.resonance.player = 'ember';
  state.log = [
    'The court is seated. You hold the first turn.',
    'You play Cinder Fox and deal 4 damage.',
    'The Warden plays Moss Guardian and raises 5 shield.',
    'You play Flame Lash — resonance! +2 — and deal 5 damage.',
    'The Warden plays Storm Kelpie and deals 5 damage.',
    '— Your turn 6 —',
  ];
  window.__emberCourt = state;
}

/** Stage a finished game for the win / loss screenshots. */
function stageEndTable(winner) {
  state = newGame(() => 0.5);
  started = true;
  state.phase = 'over';
  state.winner = winner;
  state.turn = 9;
  state.stats = { turns: 9, cardsPlayed: 23 };
  state.player.damageDealt = 31;
  if (winner === 'player') {
    state.player.life = 7;
    state.ai.life = 0;
    state.log.push('You play Wildfire — resonance! +2 — and deal 10 damage.');
    state.log.push('The Warden falls. The Ember Court is yours!');
  } else {
    state.player.life = 0;
    state.ai.life = 11;
    state.log.push('The Warden plays Deep Leviathan and deals 7 damage.');
    state.log.push('Your ember gutters out. The Warden keeps the court.');
  }
  window.__emberCourt = state;
  renderGame(state, handlers);
  showEnd(state);
}

function boot() {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  $('start-btn').addEventListener('click', () => {
    unlockAudio();
    sfxTurn();
    startNewGame();
  });
  $('end-again').addEventListener('click', () => {
    unlockAudio();
    startNewGame();
  });
  $('end-turn').addEventListener('click', () => handlers.onEndTurn());
  $('mute-btn').addEventListener('click', () => {
    unlockAudio();
    setMuted(!isMuted());
    $('mute-btn').textContent = isMuted() ? '🔇 Muted' : '🔊 Sound';
  });
  $('restart-btn').addEventListener('click', () => {
    unlockAudio();
    startNewGame();
  });
  document.addEventListener('keydown', (e) => {
    if (!started) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        $('start-btn').click();
      }
      return;
    }
    if (e.key >= '1' && e.key <= '7') {
      handlers.onPlayCard(Number(e.key) - 1);
    } else if (e.key === 'Enter' || e.key.toLowerCase() === 'e') {
      handlers.onEndTurn();
    } else if (e.key.toLowerCase() === 'm') {
      $('mute-btn').click();
    }
  });

  if (shot === 'play') {
    stagePlayTable();
    hideOverlays();
    renderGame(state, handlers);
  } else if (shot === 'win') {
    stageEndTable('player');
  } else if (shot === 'loss') {
    stageEndTable('ai');
  } else {
    state = newGame();
    showTitle();
    renderGame(state, handlers);
  }
  window.__emberCourt = state;
}

boot();
