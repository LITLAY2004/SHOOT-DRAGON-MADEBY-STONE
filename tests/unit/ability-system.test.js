const EventSystem = require('../../src/core/EventSystem.js');
const GameState = require('../../src/core/GameState.js');
const AbilitySystem = require('../../src/systems/AbilitySystem.js');

describe('AbilitySystem', () => {
  let eventSystem;
  let gameState;
  let abilitySystem;

  beforeEach(() => {
    eventSystem = new EventSystem();
    gameState = new GameState(eventSystem);
    abilitySystem = new AbilitySystem(eventSystem, gameState);
  });

  test('activate 应因资源不足而失败', () => {
    const current = gameState.getResources().crystals;
    if (current > 0) {
      gameState.addResource('crystals', -current);
    }

    const result = abilitySystem.activate('rapid_fire', {
      player: gameState.getPlayer(),
      target: { x: 0, y: 0 }
    });

    expect(result.success).toBe(false);
    expect(result.reason).toBe('insufficient_resource');
  });

  test('激活后应消耗水晶并进入冷却', () => {
    const current = gameState.getResources().crystals;
    if (current > 0) {
      gameState.addResource('crystals', -current);
    }
    gameState.addResource('crystals', 20);

    const payloads = [];
    eventSystem.on('ABILITY_CAST', (payload) => payloads.push(payload));

    const result = abilitySystem.activate('rapid_fire', {
      player: gameState.getPlayer(),
      target: { x: 100, y: 120 }
    });

    expect(result.success).toBe(true);
    expect(gameState.getResources().crystals).toBe(8);
    expect(gameState.getPlayer().mana).toBe(8);
    expect(payloads.length).toBe(1);
    expect(abilitySystem.getCooldown('rapid_fire')).toBeGreaterThan(0);

    abilitySystem.update(4);
    expect(abilitySystem.getCooldown('rapid_fire')).toBeGreaterThan(0);

    let readyEventCount = 0;
    eventSystem.on('ABILITY_READY', () => readyEventCount++);

    abilitySystem.update(10);
    expect(abilitySystem.getCooldown('rapid_fire')).toBe(0);
    expect(readyEventCount).toBeGreaterThanOrEqual(1);
  });

  test('reset 应清除冷却并同步状态', () => {
    const current = gameState.getResources().crystals;
    if (current > 0) {
      gameState.addResource('crystals', -current);
    }
    gameState.addResource('crystals', 20);
    abilitySystem.activate('rapid_fire', {
      player: gameState.getPlayer(),
      target: { x: 50, y: 60 }
    });
    expect(abilitySystem.getCooldown('rapid_fire')).toBeGreaterThan(0);

    abilitySystem.reset();
    expect(abilitySystem.getCooldown('rapid_fire')).toBe(0);
  });

  test('默认应包含守护与回复类技能', () => {
    expect(abilitySystem.getAbility('guardian_shield')).toBeTruthy();
    expect(abilitySystem.getAbility('healing_wave')).toBeTruthy();
  });
});
