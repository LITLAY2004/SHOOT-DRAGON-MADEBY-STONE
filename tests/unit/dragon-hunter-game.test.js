/**
 * DragonHunterGame 类的详细单元测试
 */

// 导入测试框架
if (typeof require !== 'undefined') {
    const { testFramework, describe, it, expect, beforeEach, afterEach, MockUtils } = require('../test-framework.js');
    global.testFramework = testFramework;
    global.describe = describe;
    global.it = it;
    global.expect = expect;
    global.beforeEach = beforeEach;
    global.afterEach = afterEach;
    global.MockUtils = MockUtils;
}

// 在浏览器环境中，测试方法已经是全局的

describe('DragonHunterGame 单元测试', () => {
    let game;
    let mockCanvas;
    let mockContext;

    beforeEach(() => {
        // 创建mock canvas和context
        mockCanvas = MockUtils.createMockCanvas(800, 600);
        mockContext = mockCanvas.getContext('2d');
        
        // 创建游戏实例
        game = new DragonHunterGame(mockCanvas);
    });

    afterEach(() => {
        // 清理
        game = null;
        mockCanvas = null;
        mockContext = null;
    });

    describe('构造函数测试', () => {
        it('应该正确初始化游戏实例', () => {
            expect(game).toBeInstanceOf(DragonHunterGame);
            expect(game.canvas).toBe(mockCanvas);
            expect(game.ctx).toBe(mockContext);
            expect(game.width).toBe(800);
            expect(game.height).toBe(600);
        });

        it('应该正确初始化游戏状态', () => {
            expect(game.gameStarted).toBe(false);
            expect(game.gameOver).toBe(false);
            expect(game.isPaused).toBe(false);
            expect(game.score).toBe(0);
            expect(game.lives).toBe(3);
            expect(game.wave).toBe(1);
            expect(game.kills).toBe(0);
        });

        it('应该正确初始化玩家属性', () => {
            expect(game.player).toHaveProperty('x');
            expect(game.player).toHaveProperty('y');
            expect(game.player).toHaveProperty('radius');
            expect(game.player).toHaveProperty('speed');
            expect(game.player).toHaveProperty('damage');
            expect(game.player).toHaveProperty('health');
            expect(game.player).toHaveProperty('maxHealth');
            
            expect(game.player.x).toBe(400); // width / 2
            expect(game.player.y).toBe(300); // height / 2
            expect(game.player.radius).toBe(15);
            expect(game.player.level).toBe(1);
            expect(game.player.experience).toBe(0);
        });

        it('应该正确初始化游戏对象数组', () => {
            expect(game.bullets).toHaveLength(0);
            expect(game.dragons).toHaveLength(0);
            expect(game.loot).toHaveLength(0);
            expect(game.damageNumbers).toHaveLength(0);
            expect(game.particles).toHaveLength(0);
        });

        it('应该在没有canvas时创建mock canvas', () => {
            const gameWithoutCanvas = new DragonHunterGame();
            expect(gameWithoutCanvas.canvas).toBeTruthy();
            expect(gameWithoutCanvas.ctx).toBeTruthy();
        });
    });

    describe('游戏状态管理', () => {
        it('startGame() 应该正确启动游戏', () => {
            expect(game.gameStarted).toBe(false);
            
            game.startGame();
            
            expect(game.gameStarted).toBe(true);
            expect(game.gameOver).toBe(false);
            expect(game.isPaused).toBe(false);
        });

        it('togglePause() 应该正确切换暂停状态', () => {
            game.startGame();
            expect(game.isPaused).toBe(false);
            
            game.togglePause();
            expect(game.isPaused).toBe(true);
            
            game.togglePause();
            expect(game.isPaused).toBe(false);
        });

        it('gameOver() 应该正确结束游戏', () => {
            game.startGame();
            expect(game.gameStarted).toBe(true);
            expect(game.gameOver).toBe(false);
            
            // 模拟游戏结束条件
            game.lives = 0;
            game.endGame();
            
            expect(game.gameOver).toBe(true);
        });
    });

    describe('玩家移动系统', () => {
        beforeEach(() => {
            game.startGame();
            // 重置玩家位置到中心
            game.player.x = 400;
            game.player.y = 300;
        });

        it('应该正确处理向上移动', () => {
            const initialY = game.player.y;
            game.keys = { w: true };
            
            // 模拟一帧更新
            game.updatePlayer(16); // 16ms = ~60fps
            
            expect(game.player.y).toBeLessThan(initialY);
        });

        it('应该正确处理向下移动', () => {
            const initialY = game.player.y;
            game.keys = { s: true };
            
            game.updatePlayer(16);
            
            expect(game.player.y).toBeGreaterThan(initialY);
        });

        it('应该正确处理向左移动', () => {
            const initialX = game.player.x;
            game.keys = { a: true };
            
            game.updatePlayer(16);
            
            expect(game.player.x).toBeLessThan(initialX);
        });

        it('应该正确处理向右移动', () => {
            const initialX = game.player.x;
            game.keys = { d: true };
            
            game.updatePlayer(16);
            
            expect(game.player.x).toBeGreaterThan(initialX);
        });

        it('应该正确处理对角线移动', () => {
            const initialX = game.player.x;
            const initialY = game.player.y;
            game.keys = { w: true, d: true };
            
            game.updatePlayer(16);
            
            expect(game.player.x).toBeGreaterThan(initialX);
            expect(game.player.y).toBeLessThan(initialY);
        });

        it('应该限制玩家在画布边界内', () => {
            // 测试左边界
            game.player.x = 0;
            game.keys = { a: true };
            game.updatePlayer(16);
            expect(game.player.x).toBeGreaterThan(game.player.radius);
            
            // 测试右边界
            game.player.x = game.width;
            game.keys = { d: true };
            game.updatePlayer(16);
            expect(game.player.x).toBeLessThan(game.width - game.player.radius);
            
            // 测试上边界
            game.player.y = 0;
            game.keys = { w: true };
            game.updatePlayer(16);
            expect(game.player.y).toBeGreaterThan(game.player.radius);
            
            // 测试下边界
            game.player.y = game.height;
            game.keys = { s: true };
            game.updatePlayer(16);
            expect(game.player.y).toBeLessThan(game.height - game.player.radius);
        });
    });

    describe('子弹系统', () => {
        beforeEach(() => {
            game.startGame();
            game.bullets = []; // 清空子弹数组
        });

        it('应该能够创建子弹', () => {
            const initialBulletCount = game.bullets.length;
            
            game.createBullet(400, 300, 0, 1); // 向右发射
            
            expect(game.bullets).toHaveLength(initialBulletCount + 1);
            
            const bullet = game.bullets[game.bullets.length - 1];
            expect(bullet).toHaveProperty('x');
            expect(bullet).toHaveProperty('y');
            expect(bullet).toHaveProperty('vx');
            expect(bullet).toHaveProperty('vy');
            expect(bullet).toHaveProperty('damage');
        });

        it('子弹应该正确移动', () => {
            game.createBullet(400, 300, 1, 0); // 向右发射
            const bullet = game.bullets[0];
            const initialX = bullet.x;
            
            game.updateBullets(16);
            
            expect(bullet.x).toBeGreaterThan(initialX);
        });

        it('应该移除超出边界的子弹', () => {
            // 创建一个会超出边界的子弹
            game.createBullet(game.width + 100, 300, 1, 0);
            expect(game.bullets).toHaveLength(1);
            
            game.updateBullets(16);
            
            expect(game.bullets).toHaveLength(0);
        });

        it('应该正确计算子弹方向', () => {
            const angle = Math.PI / 4; // 45度
            game.createBullet(400, 300, Math.cos(angle), Math.sin(angle));
            
            const bullet = game.bullets[0];
            expect(bullet.vx).toBeCloseTo(Math.cos(angle) * game.bulletSpeed, 2);
            expect(bullet.vy).toBeCloseTo(Math.sin(angle) * game.bulletSpeed, 2);
        });
    });

    describe('敌人系统', () => {
        beforeEach(() => {
            game.startGame();
            game.dragons = [];
        });

        it('应该能够生成敌人', () => {
            const initialDragonCount = game.dragons.length;
            
            game.spawnDragon();
            
            expect(game.dragons).toHaveLength(initialDragonCount + 1);
            
            const dragon = game.dragons[game.dragons.length - 1];
            expect(dragon).toHaveProperty('x');
            expect(dragon).toHaveProperty('y');
            expect(dragon).toHaveProperty('health');
            expect(dragon).toHaveProperty('maxHealth');
            expect(dragon).toHaveProperty('element');
        });

        it('敌人应该有不同的元素类型', () => {
            // 生成多个敌人来测试元素多样性
            for (let i = 0; i < 10; i++) {
                game.spawnDragon();
            }
            
            const elements = game.dragons.map(d => d.element);
            const uniqueElements = [...new Set(elements)];
            
            expect(uniqueElements.length).toBeGreaterThan(1);
        });

        it('敌人应该向玩家移动', () => {
            game.spawnDragon();
            const dragon = game.dragons[0];
            
            // 设置敌人在玩家左侧
            dragon.x = game.player.x - 100;
            dragon.y = game.player.y;
            
            const initialX = dragon.x;
            game.updateDragons(16);
            
            expect(dragon.x).toBeGreaterThan(initialX);
        });

        it('应该移除死亡的敌人', () => {
            game.spawnDragon();
            const dragon = game.dragons[0];
            dragon.health = 0;
            
            game.updateDragons(16);
            
            expect(game.dragons).toHaveLength(0);
        });
    });

    describe('碰撞检测', () => {
        beforeEach(() => {
            game.startGame();
        });

        it('应该正确检测圆形碰撞', () => {
            const obj1 = { x: 100, y: 100, radius: 10 };
            const obj2 = { x: 110, y: 100, radius: 10 };
            const obj3 = { x: 130, y: 100, radius: 10 };
            
            expect(game.checkCollision(obj1, obj2)).toBe(true);
            expect(game.checkCollision(obj1, obj3)).toBe(false);
        });

        it('应该正确处理子弹击中敌人', () => {
            game.spawnDragon();
            const dragon = game.dragons[0];
            const initialHealth = dragon.health;
            
            game.createBullet(dragon.x, dragon.y, 0, 0);
            const bullet = game.bullets[0];
            
            game.checkBulletDragonCollisions();
            
            expect(dragon.health).toBeLessThan(initialHealth);
            expect(game.bullets).toHaveLength(0); // 子弹应该被移除
        });

        it('应该正确处理敌人撞击玩家', () => {
            game.spawnDragon();
            const dragon = game.dragons[0];
            const initialLives = game.lives;
            
            // 将敌人移动到玩家位置
            dragon.x = game.player.x;
            dragon.y = game.player.y;
            
            game.checkPlayerDragonCollisions();
            
            expect(game.lives).toBeLessThan(initialLives);
        });
    });

    describe('技能系统集成', () => {
        beforeEach(() => {
            game.startGame();
        });

        it('应该正确初始化技能系统', () => {
            expect(game.skillSystem).toBeTruthy();
            expect(game.skillSystem).toHaveProperty('activateSkill');
            expect(game.skillSystem).toHaveProperty('resources');
        });

        it('应该能够激活技能', () => {
            const initialBulletCount = game.bullets.length;
            
            // 激活齐射技能
            game.skillSystem.activateSkill('volley');
            
            expect(game.bullets.length).toBeGreaterThan(initialBulletCount);
        });

        it('技能冷却应该正常工作', () => {
            // 激活技能
            game.skillSystem.activateSkill('volley');
            expect(game.skillSystem.cooldowns['volley']).toBeGreaterThan(0);
            
            // 立即再次激活应该失败
            const result = game.skillSystem.activateSkill('volley');
            expect(result).toBe(false);
        });
    });

    describe('游戏循环和渲染', () => {
        beforeEach(() => {
            game.startGame();
        });

        it('update方法应该更新所有游戏对象', () => {
            // 添加一些游戏对象
            game.createBullet(400, 300, 1, 0);
            game.spawnDragon();
            
            const spy = MockUtils.spy(game, 'updatePlayer');
            
            game.update(16);
            
            expect(spy.calls).toHaveLength(1);
            spy.restore();
        });

        it('render方法应该调用所有绘制方法', () => {
            const context = game.ctx;
            const clearRectSpy = MockUtils.spy(context, 'clearRect');
            
            game.render();
            
            expect(clearRectSpy.calls.length).toBeGreaterThan(0);
            clearRectSpy.restore();
        });

        it('应该正确计算帧率', () => {
            game.frameCount = 0;
            game.lastFPSUpdate = Date.now() - 1000; // 1秒前
            
            for (let i = 0; i < 60; i++) {
                game.gameLoop();
            }
            
            expect(game.fps).toBeCloseTo(60, 0);
        });
    });

    describe('得分和等级系统', () => {
        beforeEach(() => {
            game.startGame();
        });

        it('击杀敌人应该增加得分', () => {
            const initialScore = game.score;
            const initialKills = game.kills;
            
            game.spawnDragon();
            const dragon = game.dragons[0];
            dragon.health = 1;
            
            game.createBullet(dragon.x, dragon.y, 0, 0);
            game.checkBulletDragonCollisions();
            
            expect(game.score).toBeGreaterThan(initialScore);
            expect(game.kills).toBe(initialKills + 1);
        });

        it('应该正确处理波次推进', () => {
            const initialWave = game.wave;
            
            // 模拟击杀足够的敌人来推进波次
            game.kills = game.killsForNextWave;
            game.checkWaveProgression();
            
            expect(game.wave).toBe(initialWave + 1);
        });

        it('玩家应该能够升级', () => {
            const initialLevel = game.player.level;
            
            // 给玩家足够的经验值
            game.player.experience = game.getExperienceForLevel(2);
            game.checkPlayerLevelUp();
            
            expect(game.player.level).toBe(initialLevel + 1);
        });
    });

    describe('边界情况和错误处理', () => {
        it('应该处理空的游戏对象数组', () => {
            game.bullets = [];
            game.dragons = [];
            
            expect(() => {
                game.updateBullets(16);
                game.updateDragons(16);
            }).not.toThrow();
        });

        it('应该处理无效的技能激活', () => {
            expect(() => {
                game.skillSystem.activateSkill('invalid_skill');
            }).not.toThrow();
        });

        it('应该处理极端的deltaTime值', () => {
            expect(() => {
                game.update(0); // 零时间
                game.update(1000); // 很大的时间间隔
                game.update(-16); // 负时间
            }).not.toThrow();
        });

        it('应该处理canvas上下文为null的情况', () => {
            const gameWithNullContext = new DragonHunterGame();
            gameWithNullContext.ctx = null;
            
            expect(() => {
                gameWithNullContext.render();
            }).not.toThrow();
        });
    });
});

// 如果在浏览器环境中，自动运行测试
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        setTimeout(() => window.testFramework.run(), 100);
    });
} else if (typeof module !== 'undefined') {
    module.exports = { testFramework: global.testFramework };
}
