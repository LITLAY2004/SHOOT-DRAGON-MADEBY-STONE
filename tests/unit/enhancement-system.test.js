const EnhancementSystem = require('../../src/systems/EnhancementSystem.js');

describe('EnhancementSystem', () => {
  let system;

  beforeEach(() => {
    system = new EnhancementSystem();
  });

  test('applyEnhancement 增加伤害倍率', () => {
    const before = system.getDamageMultiplier();
    const state = system.applyEnhancement('damage');

    expect(system.getDamageMultiplier()).toBeGreaterThan(before);
    expect(state.type).toBe('damage');
  });

  test('攻击间隔会随射速强化减少但保持下限', () => {
    const base = 600;
    const initial = system.getAttackInterval(base);

    system.applyEnhancement('fire_rate');
    const faster = system.getAttackInterval(base);

    expect(faster).toBeLessThan(initial);
    expect(system.getAttackInterval(50)).toBeGreaterThanOrEqual(180);
  });

  test('齐射强化会增加额外子弹数量并有上限', () => {
    expect(system.getExtraProjectiles()).toBe(0);

    system.applyEnhancement('multi_shot');
    expect(system.getExtraProjectiles()).toBe(1);

    for (let i = 0; i < 10; i++) {
      system.applyEnhancement('multi_shot');
    }
    expect(system.getExtraProjectiles()).toBeLessThanOrEqual(4);
  });
});
