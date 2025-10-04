const EventSystem = require('../../src/core/EventSystem.js');
const GameState = require('../../src/core/GameState.js');

describe('GameState', () => {
  let eventSystem;
  let gameState;

  beforeEach(() => {
    eventSystem = new EventSystem();
    gameState = new GameState(eventSystem);
  });

  test('getDragons 应避免重复返回石龙', () => {
    const stoneDragon = { type: 'stone', id: 'stone-1' };
    const fireDragon = { type: 'fire', id: 'fire-1' };

    gameState.addDragon(stoneDragon);
    gameState.addDragon(fireDragon);

    const dragons = gameState.getDragons();

    const stoneCount = dragons.filter((dragon) => dragon === stoneDragon).length;
    expect(stoneCount).toBe(1);
    expect(dragons).toHaveLength(2);
  });
});
