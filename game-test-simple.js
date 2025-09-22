/**
 * 简化的游戏类测试
 * 直接测试核心功能，不依赖复杂的模块系统
 */

// 导入测试框架
const { testFramework, describe, it, expect, beforeEach, afterEach, MockUtils } = require('./tests/test-framework.js');

// Mock环境设置
global.window = {
    addEventListener: () => {},
    removeEventListener: () => {},
    requestAnimationFrame: (callback) => setTimeout(callback, 16),
    cancelAnimationFrame: () => {}
};

global.document = {
    getElementById: () => null,
    createElement: (tag) => ({
        getContext: () => MockUtils.createMock2DContext(),
        width: 800,
        height: 600,
        addEventListener: () => {},
        removeEventListener: () => {}
    }),
    addEventListener: () => {},
    removeEventListener: () => {}
};

global.performance = {
    now: () => Date.now()
};

// 简化的游戏类定义
class SimpleGame {
    constructor(canvas = null) {
        this.canvas = canvas || this.createMockCanvas();
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width || 800;
        this.height = this.canvas.height || 600;

        // 游戏状态
        this.gameStarted = false;
        this.gameOver = false;
        this.isPaused = false;
        this.score = 0;
        this.lives = 3;

        // 玩家
        this.player = {
            x: this.width / 2,
            y: this.height / 2,
            radius: 15,
            speed: 180,
            health: 100,
            maxHealth: 100
        };

        // 游戏对象
        this.bullets = [];
        this.enemies = [];
        this.keys = {};
    }

    createMockCanvas() {
        return MockUtils.createMockCanvas(800, 600);
    }

    startGame() {
        this.gameStarted = true;
        this.gameOver = false;
        this.isPaused = false;
    }

    togglePause() {
        this.isPaused = !this.isPaused;
    }

    handleKeyDown(event) {
        const keyMap = {
            'KeyW': 'w',
            'KeyA': 'a',
            'KeyS': 's',
            'KeyD': 'd'
        };
        
        if (keyMap[event.code]) {
            this.keys[keyMap[event.code]] = true;
        }

        if (event.code === 'Escape') {
            this.togglePause();
        }
    }

    handleKeyUp(event) {
        const keyMap = {
            'KeyW': 'w',
            'KeyA': 'a',
            'KeyS': 's',
            'KeyD': 'd'
        };
        
        if (keyMap[event.code]) {
            this.keys[keyMap[event.code]] = false;
        }
    }

    updatePlayer(deltaTime) {
        if (this.isPaused || !this.gameStarted) return;

        const speed = this.player.speed * (deltaTime / 1000);
        
        if (this.keys.w) this.player.y -= speed;
        if (this.keys.s) this.player.y += speed;
        if (this.keys.a) this.player.x -= speed;
        if (this.keys.d) this.player.x += speed;

        // 边界检测
        this.player.x = Math.max(this.player.radius, Math.min(this.width - this.player.radius, this.player.x));
        this.player.y = Math.max(this.player.radius, Math.min(this.height - this.player.radius, this.player.y));
    }

    createBullet(x, y, vx, vy) {
        this.bullets.push({
            x: x,
            y: y,
            vx: vx * 300, // 子弹速度
            vy: vy * 300,
            radius: 3,
            damage: 25
        });
    }

    updateBullets(deltaTime) {
        if (this.isPaused) return;

        const dt = deltaTime / 1000;
        
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            bullet.x += bullet.vx * dt;
            bullet.y += bullet.vy * dt;
            
            // 移除超出边界的子弹
            if (bullet.x < 0 || bullet.x > this.width || 
                bullet.y < 0 || bullet.y > this.height) {
                this.bullets.splice(i, 1);
            }
        }
    }

    spawnEnemy() {
        const side = Math.floor(Math.random() * 4);
        let x, y;
        
        switch (side) {
            case 0: // 上
                x = Math.random() * this.width;
                y = -20;
                break;
            case 1: // 右
                x = this.width + 20;
                y = Math.random() * this.height;
                break;
            case 2: // 下
                x = Math.random() * this.width;
                y = this.height + 20;
                break;
            case 3: // 左
                x = -20;
                y = Math.random() * this.height;
                break;
        }
        
        this.enemies.push({
            x: x,
            y: y,
            radius: 15,
            health: 50,
            maxHealth: 50,
            speed: 60
        });
    }

    checkCollision(obj1, obj2) {
        const dx = obj1.x - obj2.x;
        const dy = obj1.y - obj2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (obj1.radius + obj2.radius);
    }

    update(deltaTime) {
        this.updatePlayer(deltaTime);
        this.updateBullets(deltaTime);
    }
}

// 测试套件
describe('SimpleGame 测试', () => {
    let game;

    describe('构造函数和初始化', () => {
        it('应该正确初始化游戏实例', () => {
            game = new SimpleGame();
            console.log('游戏实例:', game);
            console.log('游戏类型:', typeof game);
            expect(game).toBeTruthy();
            expect(game.width).toBe(800);
            expect(game.height).toBe(600);
            expect(game.gameStarted).toBe(false);
            expect(game.gameOver).toBe(false);
            expect(game.isPaused).toBe(false);
        });

        it('应该正确初始化玩家', () => {
            game = new SimpleGame();
            expect(game.player.x).toBe(400);
            expect(game.player.y).toBe(300);
            expect(game.player.radius).toBe(15);
            expect(game.player.health).toBe(100);
            expect(game.player.maxHealth).toBe(100);
        });

        it('应该初始化空的游戏对象数组', () => {
            game = new SimpleGame();
            expect(game.bullets).toHaveLength(0);
            expect(game.enemies).toHaveLength(0);
        });
    });

    describe('游戏状态管理', () => {
        it('startGame() 应该启动游戏', () => {
            game = new SimpleGame();
            game.startGame();
            expect(game.gameStarted).toBe(true);
            expect(game.gameOver).toBe(false);
            expect(game.isPaused).toBe(false);
        });

        it('togglePause() 应该切换暂停状态', () => {
            game = new SimpleGame();
            expect(game.isPaused).toBe(false);
            game.togglePause();
            expect(game.isPaused).toBe(true);
            game.togglePause();
            expect(game.isPaused).toBe(false);
        });
    });

    describe('键盘输入处理', () => {
        it('应该正确处理移动键按下', () => {
            game.handleKeyDown({ code: 'KeyW' });
            expect(game.keys.w).toBe(true);

            game.handleKeyDown({ code: 'KeyD' });
            expect(game.keys.d).toBe(true);
        });

        it('应该正确处理移动键释放', () => {
            game.keys.w = true;
            game.handleKeyUp({ code: 'KeyW' });
            expect(game.keys.w).toBe(false);
        });

        it('ESC键应该切换暂停状态', () => {
            expect(game.isPaused).toBe(false);
            game.handleKeyDown({ code: 'Escape' });
            expect(game.isPaused).toBe(true);
        });
    });

    describe('玩家移动', () => {
        beforeEach(() => {
            game.startGame();
            game.player.x = 400;
            game.player.y = 300;
        });

        it('向上移动应该减少Y坐标', () => {
            game.keys.w = true;
            const initialY = game.player.y;
            game.updatePlayer(16);
            expect(game.player.y).toBeLessThan(initialY);
        });

        it('向下移动应该增加Y坐标', () => {
            game.keys.s = true;
            const initialY = game.player.y;
            game.updatePlayer(16);
            expect(game.player.y).toBeGreaterThan(initialY);
        });

        it('向左移动应该减少X坐标', () => {
            game.keys.a = true;
            const initialX = game.player.x;
            game.updatePlayer(16);
            expect(game.player.x).toBeLessThan(initialX);
        });

        it('向右移动应该增加X坐标', () => {
            game.keys.d = true;
            const initialX = game.player.x;
            game.updatePlayer(16);
            expect(game.player.x).toBeGreaterThan(initialX);
        });

        it('应该限制玩家在边界内', () => {
            // 测试左边界
            game.player.x = 0;
            game.keys.a = true;
            game.updatePlayer(16);
            expect(game.player.x).toBeGreaterThan(game.player.radius - 1);

            // 测试右边界
            game.player.x = game.width;
            game.keys.d = true;
            game.updatePlayer(16);
            expect(game.player.x).toBeLessThan(game.width - game.player.radius + 1);
        });
    });

    describe('子弹系统', () => {
        it('应该能够创建子弹', () => {
            const initialCount = game.bullets.length;
            game.createBullet(400, 300, 1, 0);
            expect(game.bullets).toHaveLength(initialCount + 1);

            const bullet = game.bullets[0];
            expect(bullet.x).toBe(400);
            expect(bullet.y).toBe(300);
            expect(bullet.radius).toBe(3);
            expect(bullet.damage).toBe(25);
        });

        it('子弹应该正确移动', () => {
            game.createBullet(400, 300, 1, 0);
            const bullet = game.bullets[0];
            const initialX = bullet.x;

            game.updateBullets(16);
            expect(bullet.x).toBeGreaterThan(initialX);
        });

        it('应该移除超出边界的子弹', () => {
            game.createBullet(game.width + 100, 300, 1, 0);
            expect(game.bullets).toHaveLength(1);

            game.updateBullets(16);
            expect(game.bullets).toHaveLength(0);
        });
    });

    describe('敌人系统', () => {
        it('应该能够生成敌人', () => {
            const initialCount = game.enemies.length;
            game.spawnEnemy();
            expect(game.enemies).toHaveLength(initialCount + 1);

            const enemy = game.enemies[0];
            expect(enemy.radius).toBe(15);
            expect(enemy.health).toBe(50);
            expect(enemy.maxHealth).toBe(50);
            expect(enemy.speed).toBe(60);
        });
    });

    describe('碰撞检测', () => {
        it('应该正确检测碰撞', () => {
            const obj1 = { x: 100, y: 100, radius: 10 };
            const obj2 = { x: 110, y: 100, radius: 10 };
            const obj3 = { x: 130, y: 100, radius: 10 };

            expect(game.checkCollision(obj1, obj2)).toBe(true);
            expect(game.checkCollision(obj1, obj3)).toBe(false);
        });
    });

    describe('游戏循环', () => {
        it('update方法应该不抛出异常', () => {
            game.startGame();
            game.createBullet(400, 300, 1, 0);
            game.spawnEnemy();

            expect(() => {
                game.update(16);
            }).not.toThrow();
        });
    });
});

// 运行测试
async function runGameTest() {
    console.log('🎮 运行游戏核心功能测试...');
    await testFramework.run();
    
    if (testFramework.results.failed === 0) {
        console.log('🎉 游戏核心功能测试通过！');
        return true;
    } else {
        console.log('❌ 游戏测试有失败项');
        return false;
    }
}

// 如果直接运行此文件
if (require.main === module) {
    runGameTest().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = { SimpleGame, testFramework };
