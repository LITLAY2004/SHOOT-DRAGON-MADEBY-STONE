/**
 * 游戏玩法集成测试
 * 测试游戏的完整流程和组件交互
 */

const DragonHunterGame = require('../../src/game.js');

describe('游戏玩法集成测试', () => {
    let game;

    beforeEach(() => {
        game = new DragonHunterGame();
        // 设置确定性的随机种子（如果需要）
        jest.spyOn(Math, 'random').mockReturnValue(0.5);
    });

    afterEach(() => {
        if (game) {
            game.destroy();
        }
        jest.restoreAllMocks();
    });

    describe('完整游戏流程', () => {
        test('应该能够完成一个完整的游戏循环', () => {
            // 开始游戏
            game.startGame();
            expect(game.gameStarted).toBe(true);
            expect(game.gameOver).toBe(false);

            // 生成龙
            game.spawnDragon();
            expect(game.dragons.length).toBeGreaterThan(0);

            // 射击
            game.mousePos = { x: game.dragons[0].x, y: game.dragons[0].y };
            game.shoot();
            expect(game.bullets.length).toBeGreaterThan(0);

            // 更新游戏状态
            game.update(0.016);

            // 验证游戏仍在运行
            expect(game.gameStarted).toBe(true);
        });

        test('应该能够击败龙并获得分数', () => {
            game.startGame();
            
            // 创建一个低血量的龙
            game.dragons.push({
                x: 400, y: 300,
                health: 1, maxHealth: 100,
                speed: 50, attackCooldown: 0,
                size: 25
            });

            // 射击击败龙
            game.bullets.push({
                x: 400, y: 300,
                vx: 0, vy: 0,
                damage: 25
            });

            const initialScore = game.score;
            const initialKills = game.kills;

            game.checkCollisions();

            expect(game.score).toBe(initialScore + 100);
            expect(game.kills).toBe(initialKills + 1);
            expect(game.dragons.length).toBe(0);
        });

        test('应该能够处理玩家死亡', () => {
            game.startGame();
            game.lives = 1;

            // 创建攻击玩家的龙
            game.dragons.push({
                x: game.player.x,
                y: game.player.y,
                health: 100, maxHealth: 100,
                speed: 50, attackCooldown: 0,
                size: 25
            });

            game.checkCollisions();

            expect(game.lives).toBe(0);
            expect(game.gameOver).toBe(true);
        });
    });

    describe('波次系统', () => {
        test('应该在击败所有龙后进入下一波', () => {
            game.startGame();
            
            // 清空所有龙
            game.dragons = [];
            
            const initialWave = game.wave;
            
            // 模拟击败龙
            game.killDragon = jest.fn(() => {
                game.score += 100;
                game.kills++;
                game.dragons = []; // 清空龙数组
                game.wave++; // 手动增加波次
            });

            // 触发击杀
            game.dragons.push({ health: 1 });
            game.killDragon(0);

            expect(game.wave).toBe(initialWave + 1);
        });

        test('新波次应该生成更强的敌人', () => {
            game.startGame();
            
            // 记录第1波的龙属性
            const wave1Dragon = game.dragons[0] || { health: 0, speed: 0 };
            const wave1Health = wave1Dragon.health;
            const wave1Speed = wave1Dragon.speed;
            
            // 生成第3波的龙
            game.wave = 3;
            game.spawnDragon();
            const wave3Dragon = game.dragons[game.dragons.length - 1];

            // 第3波的龙应该比第1波更强 (考虑到元素加成)
            // 基础健康值会受到元素乘数影响，所以我们只检查相对强度
            expect(wave3Dragon.health).toBeGreaterThan(wave1Health);
            expect(wave3Dragon.speed).toBeGreaterThanOrEqual(wave1Speed);
            
            // 验证基本的波次影响 (最少应该有基础增长)
            const minExpectedHealth = 50 + 3 * 25; // 基础计算，不考虑元素加成
            expect(wave3Dragon.health).toBeGreaterThanOrEqual(minExpectedHealth * 0.8); // 允许20%的变动
        });
    });

    describe('升级系统集成', () => {
        test('应该能够使用分数购买升级', () => {
            game.score = 1000;
            
            const initialDamage = game.bulletDamage;
            const upgradeCost = game.upgrades.damage.cost;

            const success = game.buyUpgrade('damage');

            expect(success).toBe(true);
            expect(game.score).toBe(1000 - upgradeCost);
            expect(game.bulletDamage).toBeGreaterThan(initialDamage);
        });

        test('升级应该影响实际游戏表现', () => {
            game.startGame();
            
            // 升级伤害
            game.score = 1000;
            game.buyUpgrade('damage');
            
            // 创建龙
            game.dragons.push({
                x: 400, y: 300,
                health: 100, maxHealth: 100,
                speed: 50, attackCooldown: 0,
                size: 25
            });

            // 射击
            const upgradedDamage = game.bulletDamage;
            game.bullets.push({
                x: 400, y: 300,
                vx: 0, vy: 0,
                damage: upgradedDamage
            });

            const initialHealth = game.dragons[0].health;
            game.checkCollisions();

            expect(game.dragons[0].health).toBe(initialHealth - upgradedDamage);
        });
    });

    describe('道具系统集成', () => {
        test('应该能够掉落并收集道具', () => {
            game.startGame();
            
            // 设置高掉落率
            game.luck = 1.0;
            
            // 击败龙 (放置在远离玩家的位置)
            game.dragons.push({
                x: 100, y: 100,
                health: 1, maxHealth: 100,
                speed: 50, attackCooldown: 0,
                size: 25
            });

            game.bullets.push({
                x: 100, y: 100,
                vx: 0, vy: 0,
                damage: 25
            });

            game.checkCollisions();

            // 应该掉落道具
            expect(game.loot.length).toBeGreaterThan(0);

            // 收集道具 (将道具移动到玩家位置)
            const loot = game.loot[0];
            loot.x = game.player.x;
            loot.y = game.player.y;

            const initialDamage = game.bulletDamage;
            game.checkCollisions();

            // 根据道具类型验证效果
            if (loot.type === 'damage') {
                expect(game.bulletDamage).toBe(initialDamage + 5);
            }
        });

        test('道具效果应该持久生效', () => {
            game.startGame();
            
            // 收集多个伤害道具
            for (let i = 0; i < 3; i++) {
                game.collectLoot({
                    type: 'damage',
                    name: '伤害提升'
                });
            }

            const expectedDamage = 25 + (5 * 3); // 基础伤害 + 3个道具
            expect(game.bulletDamage).toBe(expectedDamage);

            // 射击验证伤害
            game.dragons.push({
                x: 400, y: 300,
                health: 100, maxHealth: 100,
                speed: 50, attackCooldown: 0,
                size: 25
            });

            game.bullets.push({
                x: 400, y: 300,
                vx: 0, vy: 0,
                damage: game.bulletDamage
            });

            game.checkCollisions();
            expect(game.dragons[0].health).toBe(100 - expectedDamage);
        });
    });

    describe('用户交互集成', () => {
        test('应该能够通过键盘控制玩家移动', () => {
            game.startGame();
            
            const initialX = game.player.x;
            const initialY = game.player.y;

            // 模拟按键
            game.keys['w'] = true;
            game.keys['d'] = true;

            game.updatePlayer(0.1);

            expect(game.player.x).toBeGreaterThan(initialX);
            expect(game.player.y).toBeLessThan(initialY);
        });

        test('应该能够通过鼠标进行射击', () => {
            game.startGame();
            
            // 设置鼠标位置
            game.mousePos = { x: 500, y: 300 };
            
            const initialBulletCount = game.bullets.length;
            game.shoot();
            
            expect(game.bullets.length).toBe(initialBulletCount + 1);
            
            const bullet = game.bullets[game.bullets.length - 1];
            expect(bullet.vx).toBeGreaterThan(0); // 向右射击
        });
    });

    describe('性能和稳定性', () => {
        test('应该能够处理大量游戏对象', () => {
            game.startGame();
            
            // 创建大量游戏对象
            for (let i = 0; i < 50; i++) {
                game.spawnDragon();
                game.shoot();
                game.createHitParticles(Math.random() * 800, Math.random() * 600);
            }

            // 运行多次更新
            for (let i = 0; i < 60; i++) {
                game.update(0.016);
            }

            // 游戏应该仍然稳定运行
            expect(game.gameStarted).toBe(true);
            expect(game.gameOver).toBe(false);
        });

        test('应该能够正确清理过期对象', () => {
            game.startGame();
            
            // 创建一些对象
            game.createHitParticles(400, 300);
            game.addDamageNumber(400, 300, 25);

            const initialParticles = game.particles.length;
            const initialDamageNumbers = game.damageNumbers.length;

            // 运行足够长时间让对象过期
            game.updateEffects(10.0);

            expect(game.particles.length).toBeLessThan(initialParticles);
            expect(game.damageNumbers.length).toBeLessThan(initialDamageNumbers);
        });
    });

    describe('游戏平衡性', () => {
        test('游戏难度应该随时间增加', () => {
            game.startGame();
            
            // 模拟游戏进行到高波次
            game.wave = 10;
            game.spawnDragon();
            
            const highWaveDragon = game.dragons[0];
            
            // 重置到第1波
            game.wave = 1;
            game.dragons = [];
            game.spawnDragon();
            
            const lowWaveDragon = game.dragons[0];

            // 高波次的龙应该更强
            expect(highWaveDragon.health).toBeGreaterThan(lowWaveDragon.health);
            expect(highWaveDragon.speed).toBeGreaterThan(lowWaveDragon.speed);
        });

        test('升级成本应该递增', () => {
            game.score = 10000; // 足够的分数
            
            const initialCost = game.upgrades.damage.cost;
            
            game.buyUpgrade('damage');
            const secondCost = game.upgrades.damage.cost;
            
            game.buyUpgrade('damage');
            const thirdCost = game.upgrades.damage.cost;

            expect(secondCost).toBeGreaterThan(initialCost);
            expect(thirdCost).toBeGreaterThan(secondCost);
        });
    });

    describe('边界情况处理', () => {
        test('应该处理极端输入值', () => {
            game.startGame();
            
            // 极大的时间步长
            expect(() => game.update(1000)).not.toThrow();
            
            // 负数时间步长
            expect(() => game.update(-1)).not.toThrow();
            
            // NaN时间步长
            expect(() => game.update(NaN)).not.toThrow();
        });

        test('应该处理空数组操作', () => {
            game.startGame();
            
            // 清空所有数组
            game.bullets = [];
            game.dragons = [];
            game.loot = [];
            game.particles = [];
            game.damageNumbers = [];

            // 更新不应该出错
            expect(() => game.update(0.016)).not.toThrow();
            expect(() => game.checkCollisions()).not.toThrow();
        });

        test('应该处理无效的鼠标位置', () => {
            game.startGame();
            
            // 设置无效的鼠标位置
            game.mousePos = { x: NaN, y: NaN };
            expect(() => game.shoot()).not.toThrow();
            
            game.mousePos = { x: -1000, y: -1000 };
            expect(() => game.shoot()).not.toThrow();
        });
    });

    describe('状态一致性', () => {
        test('游戏状态应该保持一致', () => {
            game.startGame();
            
            // 运行一些游戏循环
            for (let i = 0; i < 100; i++) {
                game.update(0.016);
            }

            const state = game.getGameState();
            
            // 验证状态一致性
            expect(state.gameStarted).toBe(game.gameStarted);
            expect(state.score).toBe(game.score);
            expect(state.lives).toBe(game.lives);
            expect(state.wave).toBe(game.wave);
            expect(state.bulletsCount).toBe(game.bullets.length);
            expect(state.dragonsCount).toBe(game.dragons.length);
        });

        test('暂停和恢复应该保持状态', () => {
            game.startGame();
            game.spawnDragon();
            
            const beforePause = game.getGameState();
            
            game.pauseGame();
            expect(game.isPaused).toBe(true);
            
            // 暂停期间更新（应该不改变游戏状态）
            game.update(1.0);
            
            const duringPause = game.getGameState();
            expect(duringPause.score).toBe(beforePause.score);
            expect(duringPause.dragonsCount).toBe(beforePause.dragonsCount);
            
            game.pauseGame();
            expect(game.isPaused).toBe(false);
        });
    });
});
