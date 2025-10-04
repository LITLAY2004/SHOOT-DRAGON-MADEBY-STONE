const EventSystem = require('../../src/core/EventSystem.js');
const GameState = require('../../src/core/GameState.js');
const ResourceSystem = require('../../src/systems/ResourceSystem.js');

function createRandomStub(values) {
  let index = 0;
  const sequence = values.slice();
  return () => {
    if (!sequence.length) {
      return 0.1;
    }
    const value = sequence[index] !== undefined ? sequence[index] : sequence[sequence.length - 1];
    index += 1;
    return value;
  };
}

describe('ResourceSystem', () => {
  let eventSystem;
  let gameState;

  beforeEach(() => {
    eventSystem = new EventSystem();
    gameState = new GameState(eventSystem);
  });

  test('handleDragonDeath 应生成代币和水晶掉落', () => {
    const random = createRandomStub(new Array(8).fill(0.01));
    const resourceSystem = new ResourceSystem(eventSystem, gameState, { random });

    const drops = resourceSystem.handleDragonDeath(
      { x: 120, y: 140, element: 'fire' },
      { combo: { count: 6, best: 10 } }
    );

    expect(drops.length).toBe(2);
    const types = drops.map((drop) => drop.type);
    expect(types).toContain('shop_token');
    expect(types).toContain('crystals');
    expect(gameState.loot.length).toBe(2);
  });

  test('update 应在玩家收集掉落时增加资源并触发事件', () => {
    const random = createRandomStub(new Array(10).fill(0.01));
    const resourceSystem = new ResourceSystem(eventSystem, gameState, { random });

    const crystalsCollected = [];
    const tokensCollected = [];
    eventSystem.on('LOOT_COLLECTED', (payload) => crystalsCollected.push(payload));
    eventSystem.on('SHOP_TOKEN_COLLECTED', (payload) => tokensCollected.push(payload));

    const player = gameState.player;
    resourceSystem.handleDragonDeath(
      { x: player.x, y: player.y, element: 'stone' },
      { combo: { count: 0, best: 0 } }
    );

    expect(gameState.loot.length).toBeGreaterThan(0);

    const initialCrystals = gameState.getResources().crystals;
    resourceSystem.update(0.016, player);

    expect(gameState.loot.length).toBe(0);
    expect(gameState.getResources().crystals).toBeGreaterThan(initialCrystals);
    expect(crystalsCollected.length).toBeGreaterThan(0);
    expect(tokensCollected.length).toBeGreaterThan(0);
  });
});
