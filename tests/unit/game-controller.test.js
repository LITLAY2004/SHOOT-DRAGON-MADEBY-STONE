const GameController = require('../../src/core/GameController.js');
const ElementConfig = require('../../src/config/ElementConfig.js');
const PersistentStorage = require('../../src/services/PersistentStorage.js');

// 为测试环境提供最小的 requestAnimationFrame/cancelAnimationFrame 实现
beforeAll(() => {
  global.ElementConfig = ElementConfig;
  global.requestAnimationFrame = (cb) => {
    return setTimeout(() => cb(performance.now()), 0);
  };
  global.cancelAnimationFrame = (id) => clearTimeout(id);
});

afterAll(() => {
  delete global.requestAnimationFrame;
  delete global.cancelAnimationFrame;
});

describe('GameController', () => {
  let controller;

  beforeEach(() => {
    PersistentStorage.memoryStore = {};
    controller = new GameController();
    const current = controller.gameState.getResources().crystals;
    if (current > 0) {
      controller.gameState.addResource('crystals', -current);
    }
  });

  test('initializeGame 应该设置玩家并生成初始敌人', () => {
    controller.initializeGame();

    expect(controller.gameState.player.x).toBe(controller.width / 2);
    expect(controller.gameState.getDragons().length).toBeGreaterThan(0);
  });

  test('handleBulletHit 击杀敌人后应增加分数并移除敌人', () => {
    controller.initializeGame();

    const dragon = controller.createDragon('stone');
    const player = controller.gameState.player;
    dragon.x = player.x;
    dragon.y = player.y;
    controller.gameState.addDragon(dragon);

    const bullet = {
      x: dragon.x,
      y: dragon.y,
      radius: 5,
      damage: dragon.health,
      element: 'normal'
    };

    const initialScore = controller.gameState.getScore();

    controller.handleBulletHit(bullet, dragon);

    expect(controller.gameState.getScore()).toBeGreaterThan(initialScore);
    expect(controller.gameState.getDragons()).not.toContain(dragon);
    expect(controller.gameState.loot.length).toBeGreaterThan(0);

    const initialCrystals = controller.gameState.getResources().crystals;
    const tokenEvents = [];
    controller.eventSystem.on('SHOP_TOKEN_COLLECTED', (payload) => tokenEvents.push(payload));

    for (let i = 0; i < 60 && controller.gameState.loot.length > 0; i++) {
      controller.systems.resource.update(0.1, controller.gameState.player);
    }
    expect(controller.gameState.loot.length).toBe(0);
    expect(controller.gameState.getResources().crystals).toBeGreaterThanOrEqual(initialCrystals);
    expect(tokenEvents.length).toBeGreaterThan(0);
  });

  test('屠龙斩应削减龙血量并消耗水晶', () => {
    controller.initializeGame();
    controller.gameState.addResource('crystals', 30);

    const dragon = controller.createDragon('stone');
    const player = controller.gameState.player;
    dragon.x = player.x + 30;
    dragon.y = player.y + 30;
    controller.gameState.addDragon(dragon);

    const initialHead = dragon.headHealth;
    const result = controller.abilitySystem.activate('dragon_slayer', {
      player: { ...player }
    });

    expect(result.success).toBe(true);
    expect(controller.gameState.getResources().crystals).toBe(12);
    expect(controller.abilitySystem.getCooldown('dragon_slayer')).toBeGreaterThan(0);
    expect(dragon.headHealth).toBeLessThan(initialHead);
  });

  test('快速射击应临时提升攻击速度', () => {
    controller.initializeGame();
    controller.gameState.addResource('crystals', 20);

    const baseInterval = controller.getCurrentAttackInterval();
    const result = controller.abilitySystem.activate('rapid_fire', {
      player: { ...controller.gameState.player }
    });

    expect(result.success).toBe(true);
    expect(controller.getAttackSpeedMultiplier()).toBeGreaterThan(1);
    expect(controller.getCurrentAttackInterval()).toBeLessThan(baseInterval);
    expect(controller.attackBuff.remaining).toBeGreaterThan(0);
  });

  test('守护屏障应生成护盾并吸收伤害', () => {
    controller.initializeGame();
    controller.gameState.addResource('crystals', 20);

    const result = controller.abilitySystem.activate('guardian_shield', {
      player: controller.gameState.getPlayer()
    });

    expect(result.success).toBe(true);
    const shield = controller.gameState.player.shield;
    expect(shield).toBeTruthy();
    const initialShield = shield.value;

    controller.gameState.player.invulnerableTimer = 0;

    controller.applyDamageToPlayer(initialShield - 30, { source: null, type: 'test' });
    expect(controller.gameState.player.shield.value).toBeGreaterThan(0);
    expect(controller.gameState.player.health).toBe(controller.gameState.player.maxHealth);

    controller.applyDamageToPlayer(60, { source: null, type: 'test' });
    expect(controller.gameState.player.health).toBeLessThan(controller.gameState.player.maxHealth);
  });

  test('生命波动应恢复玩家生命', () => {
    controller.initializeGame();
    controller.gameState.player.health = 50;
    controller.gameState.addResource('crystals', 15);

    const result = controller.abilitySystem.activate('healing_wave', {
      player: controller.gameState.getPlayer()
    });

    expect(result.success).toBe(true);
    expect(controller.gameState.player.health).toBeGreaterThan(50);
    expect(controller.gameState.player.health).toBeLessThanOrEqual(controller.gameState.player.maxHealth);
  });

  test('点击技能栏应触发技能施放', () => {
    controller.initializeGame();
    controller.gameState.addResource('crystals', 30);
    controller.gameState.setGameState('started', true);

    const status = controller.abilitySystem.getAbilityStatus();
    controller.renderAbilityBar(status);
    const hotspot = controller.abilityHotspots.find((slot) => slot.id === 'rapid_fire');
    expect(hotspot).toBeDefined();

    controller.handleMouseDown({ clientX: hotspot.x + 5, clientY: hotspot.y + 5 });

    expect(controller.abilitySystem.getCooldown('rapid_fire')).toBeGreaterThan(0);
    expect(controller.mouse.isDown).toBe(false);
  });

  test('技能强化应提升屠龙斩效果', () => {
    controller.initializeGame();
    controller.gameState.dragons = [];
    controller.gameState.stoneDragon = null;

    const spawnDragon = () => {
      const dragon = controller.createDragon('fire');
      dragon.x = controller.width / 2 + 30;
      dragon.y = controller.height / 2;
      dragon.headHealth = 300;
      dragon.headMaxHealth = 300;
      controller.gameState.dragons = [dragon];
      return dragon;
    };

    const dragonA = spawnDragon();
    controller.gameState.addResource('crystals', 40);
    controller.abilitySystem.activate('dragon_slayer', {
      player: controller.gameState.getPlayer()
    });
    const remainingA = dragonA.headHealth;

    controller.abilitySystem.update(30);

    const dragonB = spawnDragon();
    controller.applyAbilityUpgrade('dragon_slayer');
    controller.abilitySystem.activate('dragon_slayer', {
      player: controller.gameState.getPlayer()
    });
    const remainingB = dragonB.headHealth;

    expect(remainingB).toBeLessThan(remainingA);
  });

  test('收集商店代币应累积货币', () => {
    controller.initializeGame();
    expect(controller.shopSystem.getCurrency()).toBe(0);

    controller.onShopTokenCollected({ amount: 7 });
    expect(controller.shopSystem.getCurrency()).toBe(7);
  });

  test('商店升级应即时提升玩家基础属性', () => {
    controller.initializeGame();
    const baseDamage = controller.gameState.player.damage;

    controller.shopSystem.addCurrency(500);
    controller.shopSystem.purchase('attack_power');

    expect(controller.gameState.player.damage).toBe(baseDamage + 5);
    expect(controller.gameState.permanentUpgrades.attackBonus).toBe(5);
  });

  test('技能传承应强化主动技能效果', () => {
    controller.initializeGame();
    controller.gameState.player.health = 40;
    controller.shopSystem.addCurrency(1000);
    controller.shopSystem.purchase('skill_mastery');
    controller.shopSystem.purchase('skill_mastery');

    controller.gameState.addResource('crystals', 20);
    const result = controller.abilitySystem.activate('healing_wave', {
      player: controller.gameState.getPlayer()
    });

    expect(result.success).toBe(true);
    expect(controller.gameState.permanentUpgrades.skillMasteryBonus).toBeCloseTo(0.16);
    expect(controller.gameState.player.health).toBe(75);
  });

  test('pause 和 resume 应正确切换暂停状态', () => {
    controller.gameState.setGameState('started', true);

    controller.pause();
    expect(controller.gameState.isPaused).toBe(true);

    controller.resume();
    expect(controller.gameState.isPaused).toBe(false);
  });
});
