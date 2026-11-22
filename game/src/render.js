// Ember Court — the table: everything the player sees, drawn from state.
// No game logic lives here; it only turns a state into DOM and back.

import { SUITS, effectLabel, MAX_LIFE } from './cards.js';

const $ = (id) => document.getElementById(id);

/** A life bar: a number, a bar, and a shield badge when shield is up. */
function lifeHtml(life, shield) {
  const pct = Math.max(0, Math.min(100, (life / MAX_LIFE) * 100));
  const shieldBadge = shield > 0 ? `<span class="shield-badge">⛨ ${shield}</span>` : '';
  return `<span class="life-num">♥ ${life}</span>
    <span class="life-bar"><span class="life-fill" style="width:${pct}%"></span></span>${shieldBadge}`;
}

/** Mana as filled and empty crystals. */
function manaHtml(mana, maxMana) {
  let crystals = '';
  for (let i = 0; i < maxMana; i++) {
    crystals += `<span class="crystal ${i < mana ? 'full' : ''}">◆</span>`;
  }
  return crystals || '<span class="crystal empty">—</span>';
}

/** One face-up card. `opts.playable` dims it when it cannot be played. */
export function cardElement(card, opts = {}) {
  const suit = SUITS[card.suit];
  const el = document.createElement('button');
  el.className = 'card';
  el.type = 'button';
  el.style.setProperty('--suit', suit.colour);
  el.style.setProperty('--suit-soft', suit.soft);
  el.style.setProperty('--suit-dark', suit.dark);
  if (opts.playable === false) el.classList.add('unplayable');
  if (opts.justPlayed) el.classList.add('just-played');
  if (opts.small) el.classList.add('small');
  const bonus = opts.bonus ? `<span class="bonus">+${opts.bonus} resonance</span>` : '';
  el.innerHTML = `
    <span class="card-cost">${card.cost}</span>
    <span class="card-suit" title="${suit.name}">${suit.glyph}</span>
    <span class="card-name">${card.name}</span>
    <span class="card-power">${effectLabel({ ...card, power: opts.power ?? card.power })}</span>
    <span class="card-text">${card.text}</span>
    ${bonus}`;
  if (opts.onClick) el.addEventListener('click', opts.onClick);
  return el;
}

/** One face-down card back for the Warden's hand. */
export function cardBackElement() {
  const el = document.createElement('div');
  el.className = 'card card-back';
  el.innerHTML = `<span class="back-glyph">▲</span><span class="back-word">EMBER<br>COURT</span>`;
  return el;
}

/** The last card a side played, shown face-up in the middle of the table. */
function playedSlot(state, side) {
  const slot = $(side === 'player' ? 'played-you' : 'played-foe');
  slot.innerHTML = '';
  const last = state.lastPlayed[side];
  if (!last) {
    slot.innerHTML = `<div class="played-empty">${side === 'player' ? 'Your last card' : "The Warden's last card"}</div>`;
    return;
  }
  slot.appendChild(cardElement(last, { small: true, justPlayed: true, power: last.power, bonus: last.bonus }));
}

/** The running log, newest at the bottom. */
function renderLog(state) {
  const log = $('log');
  const lines = state.log.slice(-6); // the box fits six lines; more would clip mid-line
  log.innerHTML = lines.map((l) => `<div class="log-line">${l}</div>`).join('');
  log.scrollTop = log.scrollHeight;
}

/** The resonance banner: which suit is hot for each side this turn. */
function renderResonance(state) {
  const banner = $('resonance');
  const hot = state.resonance.player;
  if (hot) {
    const suit = SUITS[hot];
    banner.innerHTML = `Resonance: play another <b style="color:${suit.colour}">${suit.glyph} ${suit.name}</b> card for +2 power`;
    banner.classList.add('on');
  } else {
    banner.textContent = 'Play two cards of the same suit in one turn for +2 power — resonance.';
    banner.classList.remove('on');
  }
}

/** Draw the whole table from the state. Call after every change. */
export function renderGame(state, handlers) {
  const p = state.player;
  const a = state.ai;

  $('turn-label').textContent =
    state.phase === 'over'
      ? state.winner === 'player'
        ? 'Victory'
        : 'Defeat'
      : state.phase === 'player'
        ? `Your turn — turn ${state.turn}`
        : 'The Warden is thinking…';

  $('foe-life').innerHTML = lifeHtml(a.life, a.shield);
  $('foe-mana').innerHTML = manaHtml(a.mana, a.maxMana);
  $('foe-deck').textContent = `Deck ${a.deck.length}`;
  $('you-life').innerHTML = lifeHtml(p.life, p.shield);
  $('you-mana').innerHTML = manaHtml(p.mana, p.maxMana);
  $('you-deck').textContent = `Deck ${p.deck.length}`;

  const foeHand = $('foe-hand');
  foeHand.innerHTML = '';
  for (let i = 0; i < a.hand.length; i++) foeHand.appendChild(cardBackElement());

  const youHand = $('you-hand');
  youHand.innerHTML = '';
  p.hand.forEach((card, i) => {
    const affordable = state.phase === 'player' && p.mana >= card.cost;
    const el = cardElement(card, {
      playable: affordable,
      onClick: () => handlers.onPlayCard(i),
    });
    el.title = affordable ? `Play ${card.name} (or press ${i + 1})` : `Needs ${card.cost} mana — you have ${p.mana}`;
    youHand.appendChild(el);
  });

  playedSlot(state, 'player');
  playedSlot(state, 'ai');
  renderResonance(state);
  renderLog(state);

  const endBtn = $('end-turn');
  endBtn.disabled = state.phase !== 'player';
  endBtn.textContent = state.phase === 'player' ? 'End turn  ⏎' : 'The Warden plays…';
  $('hand-count').textContent = `${p.hand.length} card${p.hand.length === 1 ? '' : 's'} in hand`;
}

/** The title screen. */
export function showTitle() {
  $('title-overlay').classList.remove('hidden');
  $('end-overlay').classList.add('hidden');
}

/** The win or loss screen, with the game's final numbers. */
export function showEnd(state) {
  const win = state.winner === 'player';
  $('title-overlay').classList.add('hidden');
  const overlay = $('end-overlay');
  overlay.classList.remove('hidden');
  overlay.classList.toggle('win', win);
  overlay.classList.toggle('loss', !win);
  $('end-title').textContent = win ? '👑 Victory!' : '🕯 Defeat';
  $('end-sub').textContent = win
    ? 'The Ember Court is yours. The Warden bows, and the table is yours to keep.'
    : 'Your ember gutters out. The Warden keeps the court — for now.';
  $('end-stats').innerHTML = `
    <div><b>${state.stats.turns}</b> turns</div>
    <div><b>${state.stats.cardsPlayed}</b> cards played</div>
    <div><b>${state.player.damageDealt}</b> damage dealt</div>
    <div><b>${Math.max(0, state.player.life)}</b> life remaining</div>`;
  $('end-again').focus();
}

/** Hide every overlay and show the table. */
export function hideOverlays() {
  $('title-overlay').classList.add('hidden');
  $('end-overlay').classList.add('hidden');
}
