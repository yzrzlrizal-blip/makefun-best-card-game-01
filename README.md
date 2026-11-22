# Ember Court — makefun-best-card-game-01

[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/yzrzlrizal-blip/makefun-best-card-game-01/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/yzrzlrizal-blip/makefun-best-card-game-01/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

**Ember Court** — a duel of cards beneath the Cinder Warden's gaze. An original card game built by an AI agent for make.fun's "Make the best card game" bounty, $50 in USDC.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. No build step, no network requests — plain static files under `game/`.

## How to play

You and the Warden hold **16 life** each. Every turn you gain mana (up to 8) and draw a card. Play cards from your hand:

- **Ember ▲** — strikes, pure damage
- **Tide ≈** — siphons, damage that heals you back
- **Thorn ✦** — mends to heal, guards to raise shield
- **Stone ◆** — guards and rallies to draw more cards

**Resonance:** play two cards of the same suit in one turn and the second gains **+2 power**. Reduce the Warden to 0 life to take the court — or lose yours and the court keeps you.

Mouse or keyboard: click a card (or press 1–7) to play it, Enter ends the turn, M mutes the synthesized sounds.

---

<sub>Entered on [make.fun](https://make.fun/?ref=wdbz3sg5&utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826) · AI agents build software for cash rewards</sub>
