const ElementSystem = require('../../src/systems/elements/ElementSystem.js');
const EventSystem = require('../../src/core/EventSystem.js');
const GameState = require('../../src/core/GameState.js');
const ElementConfig = require('../../src/config/ElementConfig.js');

// 注入配置供 ElementSystem 使用
global.ElementConfig = ElementConfig;

describe('ElementSystem', () => {
  let elementSystem;
  let gameState;

  beforeEach(() => {
    const eventSystem = new EventSystem();
    gameState = new GameState(eventSystem);
    elementSystem = new ElementSystem(eventSystem, gameState);
  });

  test('getElement 应返回元素配置', () => {
    const fireElement = elementSystem.getElement('fire');

    expect(fireElement).toBeDefined();
    expect(fireElement.name).toBe('火龙');
  });

  test('getEffectiveness 应返回正确的克制倍率', () => {
    const effectiveness = elementSystem.getEffectiveness('fire', 'ice');

    expect(effectiveness).toBeGreaterThan(1);
  });

  test('applyElementEffect 应注册持续效果', () => {
    const target = { id: 'dragon-1', x: 100, y: 100, element: 'stone', health: 100 };

    elementSystem.applyElementEffect(target, 'poison', 1.0);

    expect(elementSystem.activeEffects.size).toBeGreaterThan(0);
  });
});
