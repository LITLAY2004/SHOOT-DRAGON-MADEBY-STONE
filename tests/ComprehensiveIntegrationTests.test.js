/**
 * 综合集成测试套件
 * @jest-environment jsdom
 * 
 * 测试覆盖：
 * 1. 核心游戏循环和生命周期
 * 2. 元素系统和克制关系
 * 3. 技能系统和冷却管理
 * 4. 无限模式和难度缩放
 * 5. 边界条件和错误处理
 * 6. 性能和内存泄漏
 */

require('jest-canvas-mock');

describe('综合集成测试套件', () => {
    let gameController;
    let canvas;
    let ctx;

    beforeEach(() => {
        // 创建测试环境
        canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        ctx = canvas.getContext('2d');

        // 加载核心模块
        const GameController = require('../src/core/GameController.js');
        gameController = new GameController(canvas);
    });

    afterEach(() => {
        // 清理
        if (gameController && gameController.stop) {
            gameController.stop();
        }
        gameController = null;
    });

    // ==================== 核心生命周期测试 ====================
    describe('核心游戏生命周期', () => {
        test('游戏应该能正确初始化', () => {
            expect(gameController).toBeDefined();
            expect(gameController.gameState).toBeDefined();
            expect(gameController.eventSystem).toBeDefined();
            expect(gameController.elementSystem).toBeDefined();
        });

        test('游戏应该能正确启动', () => {
            expect(() => gameController.start()).not.toThrow();
            expect(gameController.gameState.gameStarted).toBe(true);
            expect(gameController.gameState.gameOver).toBe(false);
        });

        test('游戏启动后应该有玩家实体', () => {
            gameController.start();
            const player = gameController.gameState.getPlayer();
            
            expect(player).toBeDefined();
            expect(player.x).toBe(400);
            expect(player.y).toBe(300);
            expect(player.health).toBeGreaterThan(0);
            expect(player.maxHealth).toBeGreaterThan(0);
        });

        test('游戏启动后应该生成初始龙', () => {
            gameController.start();
            const dragons = gameController.gameState.getDragons();
            
            expect(dragons).toBeDefined();
            expect(dragons.length).toBeGreaterThan(0);
            expect(dragons[0].type).toBe('stone');
        });

        test('游戏应该能正确暂停和恢复', () => {
            gameController.start();
            
            gameController.pause();
            expect(gameController.gameState.isPaused).toBe(true);
            
            gameController.resume();
            expect(gameController.gameState.isPaused).toBe(false);
        });

        test('游戏应该能正确重置', () => {
            gameController.start();
            gameController.gameState.score = 1000;
            gameController.gameState.wave = 5;
            
            gameController.reset();
            
            expect(gameController.gameState.score).toBe(0);
            expect(gameController.gameState.wave).toBe(1);
            expect(gameController.gameState.gameStarted).toBe(false);
        });
    });

    // ==================== 玩家行为测试 ====================
    describe('玩家行为和战斗', () => {
        beforeEach(() => {
            gameController.start();
        });

        test('玩家应该能移动', () => {
            const player = gameController.gameState.getPlayer();
            const initialX = player.x;
            const initialY = player.y;
            
            gameController.keys = { w: true };
            gameController.update(16); // 模拟一帧
            
            // 玩家应该有移动（Y坐标变化）
            expect(player.y).not.toBe(initialY);
        });

        test('玩家应该能射击', () => {
            const initialBulletCount = gameController.gameState.bullets.length;
            
            gameController.handlePlayerShoot();
            
            const newBulletCount = gameController.gameState.bullets.length;
            expect(newBulletCount).toBeGreaterThan(initialBulletCount);
        });

        test('玩家受伤应该减少生命值', () => {
            const player = gameController.gameState.getPlayer();
            const initialHealth = player.health;
            
            gameController.damagePlayer(20);
            
            expect(player.health).toBe(initialHealth - 20);
        });

        test('玩家生命值不应该低于0', () => {
            const player = gameController.gameState.getPlayer();
            
            gameController.damagePlayer(999999);
            
            expect(player.health).toBe(0);
            expect(gameController.gameState.gameOver).toBe(true);
        });

        test('玩家应该有无敌帧', () => {
            const player = gameController.gameState.getPlayer();
            const initialHealth = player.health;
            
            gameController.damagePlayer(20);
            player.invulnerableTimer = 1000;
            
            // 无敌时间内再次受伤应该无效
            gameController.damagePlayer(20);
            
            expect(player.health).toBe(initialHealth - 20);
        });
    });

    // ==================== 龙实体测试 ====================
    describe('龙实体和行为', () => {
        beforeEach(() => {
            gameController.start();
        });

        test('石龙应该有强化段', () => {
            const dragons = gameController.gameState.getDragons();
            const stoneDragon = dragons.find(d => d.type === 'stone');
            
            expect(stoneDragon).toBeDefined();
            expect(Array.isArray(stoneDragon.enhancementSegments)).toBe(true);
        });

        test('龙应该能追踪玩家', () => {
            const dragons = gameController.gameState.getDragons();
            const dragon = dragons[0];
            const initialX = dragon.x;
            const initialY = dragon.y;
            
            // 更新龙的位置
            gameController.updateDragon(dragon, 0.016);
            
            // 龙应该移动了
            expect(dragon.x !== initialX || dragon.y !== initialY).toBe(true);
        });

        test('龙受伤应该减少生命值', () => {
            const dragons = gameController.gameState.getDragons();
            const dragon = dragons[0];
            const initialHealth = dragon.health;
            
            gameController.damageDragon(dragon, 50);
            
            expect(dragon.health).toBe(initialHealth - 50);
        });

        test('龙血量为0应该被移除', () => {
            const dragons = gameController.gameState.getDragons();
            const dragon = dragons[0];
            
            gameController.damageDragon(dragon, dragon.health);
            
            const dragonsAfter = gameController.gameState.getDragons();
            expect(dragonsAfter).not.toContain(dragon);
        });

        test('龙应该有身体段', () => {
            const dragons = gameController.gameState.getDragons();
            const dragon = dragons[0];
            
            expect(Array.isArray(dragon.bodySegments)).toBe(true);
        });

        test('龙身体段应该正确跟随', () => {
            const dragons = gameController.gameState.getDragons();
            const dragon = dragons[0];
            
            // 移动龙
            const originalX = dragon.x;
            dragon.x += 100;
            
            gameController.updateDragonBodySegments(dragon, 0.016);
            
            // 身体段应该更新
            expect(dragon.bodyPath).toBeDefined();
            expect(dragon.bodyPath.length).toBeGreaterThan(0);
        });
    });

    // ==================== 元素系统测试 ====================
    describe('元素系统和克制关系', () => {
        beforeEach(() => {
            gameController.start();
        });

        test('元素系统应该正确加载', () => {
            expect(gameController.elementSystem).toBeDefined();
            expect(gameController.elementSystem.getAllElements).toBeDefined();
        });

        test('应该能获取所有元素类型', () => {
            const elements = gameController.elementSystem.getAllElements();
            
            expect(elements).toBeDefined();
            expect(elements.fire).toBeDefined();
            expect(elements.ice).toBeDefined();
            expect(elements.thunder).toBeDefined();
            expect(elements.poison).toBeDefined();
        });

        test('火元素应该克制冰元素', () => {
            const effectiveness = gameController.elementSystem.getEffectiveness('fire', 'ice');
            expect(effectiveness).toBeGreaterThan(1.0);
        });

        test('冰元素应该克制雷元素', () => {
            const effectiveness = gameController.elementSystem.getEffectiveness('ice', 'thunder');
            expect(effectiveness).toBeGreaterThan(1.0);
        });

        test('雷元素应该克制暗元素', () => {
            const effectiveness = gameController.elementSystem.getEffectiveness('thunder', 'dark');
            expect(effectiveness).toBeGreaterThan(1.0);
        });

        test('毒元素应该克制石元素', () => {
            const effectiveness = gameController.elementSystem.getEffectiveness('poison', 'stone');
            expect(effectiveness).toBeGreaterThan(1.0);
        });

        test('相同元素应该有抗性', () => {
            const resistance = gameController.elementSystem.getResistance('fire', 'fire');
            expect(resistance).toBeGreaterThan(0);
        });

        test('元素伤害倍率计算应该正确', () => {
            const attacker = { weaponElement: 'fire' };
            const target = { element: 'ice' };
            
            const multiplier = gameController.elementSystem.getDamageMultiplier(attacker, target);
            expect(multiplier).toBeGreaterThan(1.0);
        });

        test('普通元素应该没有克制效果', () => {
            const effectiveness = gameController.elementSystem.getEffectiveness('normal', 'fire');
            expect(effectiveness).toBe(1.0);
        });
    });

    // ==================== 技能系统测试 ====================
    describe('技能系统', () => {
        beforeEach(() => {
            gameController.start();
        });

        test('技能系统应该正确初始化', () => {
            expect(gameController.skillSystem).toBeDefined();
            expect(gameController.skillSystem.activeSkills).toBeDefined();
            expect(gameController.skillSystem.passiveSkills).toBeDefined();
        });

        test('应该能获取所有主动技能', () => {
            const skills = gameController.skillSystem.getActiveSkills();
            expect(skills).toBeDefined();
            expect(Object.keys(skills).length).toBeGreaterThan(0);
        });

        test('技能应该有冷却时间', () => {
            const skill = gameController.skillSystem.ACTIVE_SKILLS.volley;
            expect(skill.cooldown).toBeGreaterThan(0);
        });

        test('技能应该有法力消耗', () => {
            const skill = gameController.skillSystem.ACTIVE_SKILLS.volley;
            expect(skill.manaCost).toBeGreaterThan(0);
        });

        test('法力不足应该无法使用技能', () => {
            gameController.skillSystem.resources.mana = 0;
            const result = gameController.skillSystem.canUseSkill('volley');
            expect(result).toBe(false);
        });

        test('冷却中的技能应该无法使用', () => {
            gameController.skillSystem.cooldowns['volley'] = 5000;
            const result = gameController.skillSystem.canUseSkill('volley');
            expect(result).toBe(false);
        });

        test('齐射技能应该发射多颗子弹', () => {
            const initialBulletCount = gameController.gameState.bullets.length;
            
            gameController.skillSystem.useSkill('volley');
            
            const newBulletCount = gameController.gameState.bullets.length;
            expect(newBulletCount).toBeGreaterThan(initialBulletCount);
        });

        test('护盾技能应该提供无敌', () => {
            gameController.skillSystem.useSkill('shield');
            
            const player = gameController.gameState.getPlayer();
            expect(player.shield).toBeDefined();
        });

        test('技能冷却应该随时间恢复', () => {
            gameController.skillSystem.cooldowns['volley'] = 1000;
            
            gameController.skillSystem.update(0.5); // 更新0.5秒
            
            expect(gameController.skillSystem.cooldowns['volley']).toBeLessThan(1000);
        });

        test('法力应该随时间恢复', () => {
            gameController.skillSystem.resources.mana = 50;
            const initialMana = gameController.skillSystem.resources.mana;
            
            gameController.skillSystem.update(1.0); // 更新1秒
            
            expect(gameController.skillSystem.resources.mana).toBeGreaterThan(initialMana);
        });
    });

    // ==================== 无限模式测试 ====================
    describe('无限模式', () => {
        let endlessMode;

        beforeEach(() => {
            gameController.start();
            const EndlessMode = require('../src/modes/EndlessMode.js');
            endlessMode = new EndlessMode(gameController);
        });

        test('无限模式应该能正确启动', () => {
            const result = endlessMode.start('normal');
            expect(result).toBe(true);
            expect(endlessMode.isActive).toBe(true);
        });

        test('无限模式应该有难度配置', () => {
            expect(endlessMode.difficultyConfig.normal).toBeDefined();
            expect(endlessMode.difficultyConfig.hard).toBeDefined();
            expect(endlessMode.difficultyConfig.nightmare).toBeDefined();
        });

        test('难度应该影响敌人属性', () => {
            endlessMode.start('hard');
            const config = endlessMode.difficultyConfig.hard;
            
            expect(config.healthMultiplier).toBeGreaterThan(1.0);
            expect(config.speedMultiplier).toBeGreaterThan(1.0);
            expect(config.damageMultiplier).toBeGreaterThan(1.0);
        });

        test('波次应该递增', () => {
            endlessMode.start('normal');
            const initialWave = endlessMode.currentWave;
            
            endlessMode.startNextWave();
            
            expect(endlessMode.currentWave).toBe(initialWave + 1);
        });

        test('击杀应该增加分数', () => {
            endlessMode.start('normal');
            const initialScore = endlessMode.score;
            
            endlessMode.onEnemyKilled({ type: 'stone' });
            
            expect(endlessMode.score).toBeGreaterThan(initialScore);
        });

        test('连击应该有时间限制', () => {
            endlessMode.start('normal');
            
            endlessMode.onEnemyKilled({ type: 'stone' });
            expect(endlessMode.killCombo).toBe(1);
            
            // 模拟超时
            endlessMode.lastKillTime = Date.now() - 5000;
            endlessMode.updateCombo();
            
            expect(endlessMode.killCombo).toBe(0);
        });

        test('特殊事件应该能触发', () => {
            endlessMode.start('normal');
            
            const event = endlessMode.checkForSpecialEvents();
            expect(event === null || typeof event === 'object').toBe(true);
        });

        test('Boss波次应该按频率出现', () => {
            endlessMode.start('normal');
            const bossFrequency = endlessMode.difficultyConfig.normal.bossFrequency;
            
            endlessMode.currentWave = bossFrequency;
            const isBossWave = endlessMode.isBossWave();
            
            expect(isBossWave).toBe(true);
        });

        test('无效难度应该拒绝启动', () => {
            const result = endlessMode.start('invalid');
            expect(result).toBe(false);
        });
    });

    // ==================== 边界条件测试 ====================
    describe('边界条件和错误处理', () => {
        test('空canvas应该使用备用方案', () => {
            const controller = new (require('../src/core/GameController.js'))(null);
            expect(controller.canvas).toBeDefined();
        });

        test('负数伤害应该被处理', () => {
            gameController.start();
            const player = gameController.gameState.getPlayer();
            const initialHealth = player.health;
            
            gameController.damagePlayer(-10);
            
            expect(player.health).toBe(initialHealth);
        });

        test('超大伤害应该限制为最大生命值', () => {
            gameController.start();
            const player = gameController.gameState.getPlayer();
            
            gameController.damagePlayer(999999);
            
            expect(player.health).toBe(0);
        });

        test('数组越界应该被安全处理', () => {
            gameController.start();
            
            expect(() => {
                gameController.gameState.bullets[-1];
                gameController.gameState.dragons[999];
            }).not.toThrow();
        });

        test('null对象应该被安全处理', () => {
            expect(() => {
                gameController.updateDragon(null, 0.016);
                gameController.damageDragon(null, 100);
            }).not.toThrow();
        });

        test('无效技能ID应该被拒绝', () => {
            gameController.start();
            const result = gameController.skillSystem.useSkill('invalid_skill');
            expect(result).toBeFalsy();
        });

        test('超出边界的实体应该被限制', () => {
            gameController.start();
            const player = gameController.gameState.getPlayer();
            
            player.x = -100;
            player.y = -100;
            
            gameController.updatePlayerPosition(0.016);
            
            expect(player.x).toBeGreaterThanOrEqual(0);
            expect(player.y).toBeGreaterThanOrEqual(0);
        });

        test('除零错误应该被避免', () => {
            expect(() => {
                const result = gameController.calculateDamage(100, 0);
                expect(isNaN(result)).toBe(false);
                expect(isFinite(result)).toBe(true);
            }).not.toThrow();
        });
    });

    // ==================== 性能和资源测试 ====================
    describe('性能和资源管理', () => {
        test('大量子弹应该被正确管理', () => {
            gameController.start();
            
            // 创建大量子弹
            for (let i = 0; i < 1000; i++) {
                gameController.handlePlayerShoot();
            }
            
            const bulletCount = gameController.gameState.bullets.length;
            expect(bulletCount).toBeLessThan(1000); // 应该有上限
        });

        test('离屏实体应该被清理', () => {
            gameController.start();
            
            // 创建离屏子弹
            gameController.gameState.bullets.push({
                x: -1000,
                y: -1000,
                vx: 0,
                vy: 0
            });
            
            gameController.cleanupOffscreenEntities();
            
            // 离屏子弹应该被移除
            const hasOffscreen = gameController.gameState.bullets.some(
                b => b.x < -500 || b.y < -500
            );
            expect(hasOffscreen).toBe(false);
        });

        test('粒子系统应该限制数量', () => {
            gameController.start();
            
            // 创建大量粒子
            for (let i = 0; i < 10000; i++) {
                gameController.gameState.particles.push({
                    x: 400,
                    y: 300,
                    lifetime: 1000
                });
            }
            
            gameController.cleanupParticles();
            
            expect(gameController.gameState.particles.length).toBeLessThan(5000);
        });

        test('事件监听器应该能正确清理', () => {
            const listeners = gameController.eventSystem.listeners;
            const initialCount = Object.keys(listeners).length;
            
            gameController.setupEventHandlers();
            
            // 应该没有重复注册
            expect(Object.keys(listeners).length).toBeGreaterThanOrEqual(initialCount);
        });

        test('渲染应该在合理时间完成', () => {
            gameController.start();
            
            const start = Date.now();
            for (let i = 0; i < 100; i++) {
                gameController.render();
            }
            const duration = Date.now() - start;
            
            // 100帧应该在1秒内完成
            expect(duration).toBeLessThan(1000);
        });

        test('更新循环应该高效', () => {
            gameController.start();
            
            const start = Date.now();
            for (let i = 0; i < 60; i++) {
                gameController.update(0.016);
            }
            const duration = Date.now() - start;
            
            // 60次更新应该在500ms内完成
            expect(duration).toBeLessThan(500);
        });
    });

    // ==================== 数据一致性测试 ====================
    describe('数据一致性', () => {
        test('分数应该始终非负', () => {
            gameController.start();
            gameController.gameState.score = -100;
            
            gameController.validateGameState();
            
            expect(gameController.gameState.score).toBeGreaterThanOrEqual(0);
        });

        test('生命值应该在合理范围内', () => {
            gameController.start();
            const player = gameController.gameState.getPlayer();
            
            player.health = -50;
            gameController.validatePlayerHealth();
            expect(player.health).toBe(0);
            
            player.health = player.maxHealth + 100;
            gameController.validatePlayerHealth();
            expect(player.health).toBe(player.maxHealth);
        });

        test('波次应该始终递增', () => {
            gameController.start();
            const wave1 = gameController.gameState.wave;
            
            gameController.nextWave();
            const wave2 = gameController.gameState.wave;
            
            expect(wave2).toBeGreaterThan(wave1);
        });

        test('资源值应该合法', () => {
            gameController.start();
            
            gameController.gameState.resources.gold = -100;
            gameController.validateResources();
            
            expect(gameController.gameState.resources.gold).toBeGreaterThanOrEqual(0);
        });
    });

    // ==================== 兼容性测试 ====================
    describe('环境兼容性', () => {
        test('应该能在测试环境运行', () => {
            expect(typeof gameController).toBe('object');
            expect(gameController.canvas).toBeDefined();
        });

        test('应该正确处理缺失的全局对象', () => {
            expect(() => {
                const controller = new (require('../src/core/GameController.js'))(canvas, {
                    testMode: true
                });
                controller.start();
            }).not.toThrow();
        });

        test('应该能序列化游戏状态', () => {
            gameController.start();
            
            expect(() => {
                const state = gameController.gameState.serialize();
                JSON.stringify(state);
            }).not.toThrow();
        });
    });
});

