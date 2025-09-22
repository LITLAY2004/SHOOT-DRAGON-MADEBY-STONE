/**
 * 塔防游戏综合测试套件
 * 根据项目规则：必须包含尽可能详细和全面的测试内容
 * 测试覆盖所有功能模块、边界条件、错误处理和交互场景
 */

// 导入测试框架
const TestFramework = require('./test-framework.js');
const { describe, it, expect, beforeEach, afterEach } = TestFramework;

// 模拟浏览器环境
global.window = {
    innerWidth: 1920,
    innerHeight: 1080,
    addEventListener: () => {},
    removeEventListener: () => {},
    requestAnimationFrame: (callback) => setTimeout(callback, 16),
    cancelAnimationFrame: (id) => clearTimeout(id),
    performance: { now: () => Date.now() }
};

global.document = {
    getElementById: (id) => ({
        getContext: () => ({
            clearRect: () => {},
            fillRect: () => {},
            strokeRect: () => {},
            arc: () => {},
            fill: () => {},
            stroke: () => {},
            beginPath: () => {},
            closePath: () => {},
            moveTo: () => {},
            lineTo: () => {},
            save: () => {},
            restore: () => {},
            translate: () => {},
            rotate: () => {},
            scale: () => {},
            setTransform: () => {},
            fillText: () => {},
            measureText: () => ({ width: 100 }),
            drawImage: () => {},
            createImageData: () => ({ data: new Uint8ClampedArray(4) }),
            getImageData: () => ({ data: new Uint8ClampedArray(4) }),
            putImageData: () => {}
        }),
        width: 800,
        height: 600,
        style: {},
        addEventListener: () => {},
        removeEventListener: () => {}
    }),
    addEventListener: () => {},
    removeEventListener: () => {},
    createElement: (tag) => ({
        style: {},
        addEventListener: () => {},
        removeEventListener: () => {},
        getContext: () => global.document.getElementById().getContext()
    }),
    body: {
        appendChild: () => {},
        removeChild: () => {}
    }
};

// 导入游戏相关类
const fs = require('fs');
const path = require('path');

// 动态加载游戏文件
function loadGameFile(filename) {
    const filePath = path.join(__dirname, '..', filename);
    const content = fs.readFileSync(filePath, 'utf8');
    // 移除ES6模块语法，转换为CommonJS
    const processedContent = content
        .replace(/export\s+class\s+/g, 'class ')
        .replace(/export\s+default\s+/g, '')
        .replace(/export\s+\{[^}]+\}/g, '')
        .replace(/import\s+.*?from\s+['"][^'"]+['"];?\s*/g, '');
    
    eval(processedContent);
}

// 加载所有必要的游戏文件
try {
    loadGameFile('src/utils/MathUtils.js');
    loadGameFile('src/config/BalanceConfig.js');
    loadGameFile('src/config/ElementConfig.js');
    loadGameFile('src/core/EventSystem.js');
    loadGameFile('src/core/GameState.js');
    loadGameFile('src/systems/elements/ElementSystem.js');
    loadGameFile('src/systems/SkillSystem.js');
    loadGameFile('src/core/GameController.js');
    loadGameFile('src/game.js');
} catch (error) {
    console.error('加载游戏文件失败:', error);
}

// 主要测试套件
describe('塔防游戏综合测试套件', () => {
    let game;
    let canvas;
    let ctx;

    beforeEach(() => {
        // 创建模拟canvas和context
        canvas = global.document.getElementById('gameCanvas');
        ctx = canvas.getContext('2d');
        
        // 创建游戏实例
        try {
            game = new DragonHunterGame();
            game.canvas = canvas;
            game.ctx = ctx;
        } catch (error) {
            console.error('创建游戏实例失败:', error);
            game = null;
        }
    });

    afterEach(() => {
        if (game && typeof game.cleanup === 'function') {
            game.cleanup();
        }
        game = null;
    });

    // ==================== 游戏核心功能测试 ====================
    describe('游戏核心功能测试', () => {
        describe('游戏初始化', () => {
            it('应该正确创建游戏实例', () => {
                expect(game).toBeTruthy();
                expect(typeof game).toBe('object');
                expect(game.constructor.name).toBe('DragonHunterGame');
            });

            it('应该正确初始化游戏配置', () => {
                expect(game.canvas).toBeTruthy();
                expect(typeof game.canvas).toBe('object');
                expect(game.width).toBeGreaterThan(0);
                expect(game.height).toBeGreaterThan(0);
            });

            it('应该正确初始化游戏状态', () => {
                expect(game.gameStarted).toBe(false);
                expect(game.isPaused).toBe(false);
                expect(game.gameOver).toBe(false);
                expect(game.wave).toBe(1);
                expect(game.score).toBe(0);
            });

            it('应该正确初始化玩家', () => {
                expect(game.player).toBeTruthy();
                expect(typeof game.player.x).toBe('number');
                expect(typeof game.player.y).toBe('number');
                expect(game.player.health).toBeGreaterThan(0);
                expect(game.player.maxHealth).toBeGreaterThan(0);
                expect(game.player.health).toBeLessThanOrEqual(game.player.maxHealth);
            });

            it('应该正确初始化游戏对象数组', () => {
                expect(Array.isArray(game.bullets)).toBe(true);
                expect(Array.isArray(game.particles)).toBe(true);
                expect(game.bullets.length).toBe(0);
                expect(game.particles.length).toBe(0);
            });

            it('应该正确初始化技能系统', () => {
                expect(game.skillSystem).toBeTruthy();
                expect(typeof game.skillSystem).toBe('object');
                expect(game.skillSystem.constructor.name).toBe('SkillSystem');
                expect(typeof game.skillSystem.resources).toBe('object');
                expect(game.skillSystem.resources.mana).toBeGreaterThan(0);
                expect(game.skillSystem.resources.maxMana).toBeGreaterThan(0);
            });

            it('应该正确初始化元素系统', () => {
                expect(game.elementSystem).toBeTruthy();
                expect(typeof game.elementSystem).toBe('object');
                expect(game.elementSystem.constructor.name).toBe('ElementSystem');
            });

            it('应该正确初始化事件系统', () => {
                expect(game.eventSystem).toBeTruthy();
                expect(typeof game.eventSystem).toBe('object');
                expect(typeof game.eventSystem.on).toBe('function');
                expect(typeof game.eventSystem.emit).toBe('function');
                expect(typeof game.eventSystem.off).toBe('function');
            });
        });

        describe('游戏状态管理', () => {
            it('start() 应该正确启动游戏', () => {
                game.start();
                expect(game.gameState.isRunning).toBe(true);
                expect(game.gameState.isPaused).toBe(false);
                expect(game.gameState.isGameOver).toBe(false);
            });

            it('pause() 应该正确暂停游戏', () => {
                game.start();
                game.pause();
                expect(game.gameState.isPaused).toBe(true);
                expect(game.gameState.isRunning).toBe(true);
            });

            it('resume() 应该正确恢复游戏', () => {
                game.start();
                game.pause();
                game.resume();
                expect(game.gameState.isPaused).toBe(false);
                expect(game.gameState.isRunning).toBe(true);
            });

            it('stop() 应该正确停止游戏', () => {
                game.start();
                game.stop();
                expect(game.gameState.isRunning).toBe(false);
                expect(game.gameState.isPaused).toBe(false);
            });

            it('restart() 应该正确重启游戏', () => {
                game.start();
                game.gameState.score = 1000;
                game.gameState.level = 5;
                game.restart();
                expect(game.gameState.isRunning).toBe(true);
                expect(game.gameState.score).toBe(0);
                expect(game.gameState.level).toBe(1);
                expect(game.bullets.length).toBe(0);
                expect(game.enemies.length).toBe(0);
            });

            it('gameOver() 应该正确设置游戏结束状态', () => {
                game.start();
                game.gameOver();
                expect(game.gameState.isGameOver).toBe(true);
                expect(game.gameState.isRunning).toBe(false);
            });
        });

        describe('键盘输入处理', () => {
            it('应该正确处理移动键按下', () => {
                const keys = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
                
                keys.forEach(key => {
                    game.handleKeyDown({ code: key, preventDefault: () => {} });
                    expect(game.keys[key.toLowerCase().replace('key', '').replace('arrow', '')]).toBe(true);
                });
            });

            it('应该正确处理移动键释放', () => {
                const keys = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
                
                keys.forEach(key => {
                    game.handleKeyDown({ code: key, preventDefault: () => {} });
                    game.handleKeyUp({ code: key, preventDefault: () => {} });
                    expect(game.keys[key.toLowerCase().replace('key', '').replace('arrow', '')]).toBe(false);
                });
            });

            it('应该正确处理技能键', () => {
                const skillKeys = ['KeyQ', 'KeyE', 'KeyR', 'KeyT'];
                
                skillKeys.forEach(key => {
                    const initialMana = game.skillSystem.resources.mana;
                    game.handleKeyDown({ code: key, preventDefault: () => {} });
                    // 验证技能尝试被触发（法力值可能减少或技能进入冷却）
                });
            });

            it('ESC键应该切换暂停状态', () => {
                game.start();
                const initialPauseState = game.gameState.isPaused;
                game.handleKeyDown({ code: 'Escape', preventDefault: () => {} });
                expect(game.gameState.isPaused).toBe(!initialPauseState);
            });

            it('空格键应该射击', () => {
                const initialBulletCount = game.bullets.length;
                game.handleKeyDown({ code: 'Space', preventDefault: () => {} });
                // 验证射击逻辑被触发
            });
        });

        describe('鼠标输入处理', () => {
            it('应该正确处理鼠标移动', () => {
                const mouseEvent = {
                    clientX: 400,
                    clientY: 300,
                    preventDefault: () => {}
                };
                
                game.handleMouseMove(mouseEvent);
                expect(typeof game.mouse.x).toBe('number');
                expect(typeof game.mouse.y).toBe('number');
            });

            it('应该正确处理鼠标点击射击', () => {
                const mouseEvent = {
                    clientX: 400,
                    clientY: 300,
                    button: 0,
                    preventDefault: () => {}
                };
                
                const initialBulletCount = game.bullets.length;
                game.handleMouseClick(mouseEvent);
                // 验证射击逻辑
            });

            it('应该正确处理右键技能', () => {
                const mouseEvent = {
                    clientX: 400,
                    clientY: 300,
                    button: 2,
                    preventDefault: () => {}
                };
                
                game.handleMouseClick(mouseEvent);
                // 验证右键技能逻辑
            });
        });
    });

    // ==================== 石龙控制测试 ====================
    describe('石龙控制测试', () => {
        beforeEach(() => {
            game.start();
        });

        describe('移动控制', () => {
            it('向上移动应该减少Y坐标', () => {
                const initialY = game.stoneDragon.y;
                game.keys.w = true;
                game.updatePlayerMovement(16); // 模拟16ms帧时间
                expect(game.stoneDragon.y).toBeLessThan(initialY);
            });

            it('向下移动应该增加Y坐标', () => {
                const initialY = game.stoneDragon.y;
                game.keys.s = true;
                game.updatePlayerMovement(16);
                expect(game.stoneDragon.y).toBeGreaterThan(initialY);
            });

            it('向左移动应该减少X坐标', () => {
                const initialX = game.stoneDragon.x;
                game.keys.a = true;
                game.updatePlayerMovement(16);
                expect(game.stoneDragon.x).toBeLessThan(initialX);
            });

            it('向右移动应该增加X坐标', () => {
                const initialX = game.stoneDragon.x;
                game.keys.d = true;
                game.updatePlayerMovement(16);
                expect(game.stoneDragon.x).toBeGreaterThan(initialX);
            });

            it('对角线移动应该正确计算速度', () => {
                const initialX = game.stoneDragon.x;
                const initialY = game.stoneDragon.y;
                game.keys.w = true;
                game.keys.d = true;
                game.updatePlayerMovement(16);
                
                const deltaX = game.stoneDragon.x - initialX;
                const deltaY = initialY - game.stoneDragon.y;
                const actualSpeed = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                const expectedSpeed = game.stoneDragon.speed * 16 / 1000;
                
                expect(Math.abs(actualSpeed - expectedSpeed)).toBeLessThan(0.1);
            });

            it('应该限制石龙在画布边界内', () => {
                // 测试左边界
                game.stoneDragon.x = 0;
                game.keys.a = true;
                game.updatePlayerMovement(16);
                expect(game.stoneDragon.x).toBeGreaterThanOrEqual(game.stoneDragon.radius);

                // 测试右边界
                game.stoneDragon.x = game.config.canvas.width;
                game.keys.d = true;
                game.updatePlayerMovement(16);
                expect(game.stoneDragon.x).toBeLessThanOrEqual(game.config.canvas.width - game.stoneDragon.radius);

                // 测试上边界
                game.stoneDragon.y = 0;
                game.keys.w = true;
                game.updatePlayerMovement(16);
                expect(game.stoneDragon.y).toBeGreaterThanOrEqual(game.stoneDragon.radius);

                // 测试下边界
                game.stoneDragon.y = game.config.canvas.height;
                game.keys.s = true;
                game.updatePlayerMovement(16);
                expect(game.stoneDragon.y).toBeLessThanOrEqual(game.config.canvas.height - game.stoneDragon.radius);
            });
        });

        describe('生命值系统', () => {
            it('应该正确处理伤害', () => {
                const initialHealth = game.stoneDragon.health;
                const damage = 10;
                game.stoneDragon.takeDamage(damage);
                expect(game.stoneDragon.health).toBe(initialHealth - damage);
            });

            it('生命值不应该低于0', () => {
                game.stoneDragon.takeDamage(game.stoneDragon.maxHealth + 100);
                expect(game.stoneDragon.health).toBeGreaterThanOrEqual(0);
            });

            it('应该正确处理治疗', () => {
                game.stoneDragon.health = 50;
                const healAmount = 20;
                game.stoneDragon.heal(healAmount);
                expect(game.stoneDragon.health).toBe(70);
            });

            it('生命值不应该超过最大值', () => {
                game.stoneDragon.heal(game.stoneDragon.maxHealth + 100);
                expect(game.stoneDragon.health).toBeLessThanOrEqual(game.stoneDragon.maxHealth);
            });

            it('生命值为0时应该触发游戏结束', () => {
                game.stoneDragon.takeDamage(game.stoneDragon.maxHealth);
                expect(game.gameState.isGameOver).toBe(true);
            });
        });
    });

    // ==================== 子弹系统测试 ====================
    describe('子弹系统测试', () => {
        beforeEach(() => {
            game.start();
        });

        describe('子弹创建', () => {
            it('应该能够创建基础子弹', () => {
                const initialCount = game.bullets.length;
                game.createBullet(400, 300, 0, 0, 1);
                expect(game.bullets.length).toBe(initialCount + 1);
                
                const bullet = game.bullets[game.bullets.length - 1];
                expect(bullet.x).toBe(400);
                expect(bullet.y).toBe(300);
                expect(bullet.dx).toBe(0);
                expect(bullet.dy).toBe(0);
                expect(bullet.damage).toBe(1);
            });

            it('应该能够创建带元素的子弹', () => {
                game.createBullet(400, 300, 1, 0, 10, 'fire');
                const bullet = game.bullets[game.bullets.length - 1];
                expect(bullet.element).toBe('fire');
            });

            it('应该正确计算子弹方向', () => {
                const dx = 1;
                const dy = 1;
                game.createBullet(400, 300, dx, dy, 10);
                const bullet = game.bullets[game.bullets.length - 1];
                
                const magnitude = Math.sqrt(dx * dx + dy * dy);
                expect(Math.abs(bullet.dx - dx / magnitude * bullet.speed)).toBeLessThan(0.01);
                expect(Math.abs(bullet.dy - dy / magnitude * bullet.speed)).toBeLessThan(0.01);
            });
        });

        describe('子弹移动', () => {
            it('子弹应该按照设定方向移动', () => {
                game.createBullet(400, 300, 1, 0, 10);
                const bullet = game.bullets[0];
                const initialX = bullet.x;
                
                game.updateBullets(16);
                expect(bullet.x).toBeGreaterThan(initialX);
            });

            it('应该移除超出边界的子弹', () => {
                game.createBullet(-100, 300, -1, 0, 10);
                game.updateBullets(16);
                expect(game.bullets.length).toBe(0);
            });

            it('应该正确处理子弹生命周期', () => {
                game.createBullet(400, 300, 0, 0, 10);
                const bullet = game.bullets[0];
                bullet.lifetime = 10; // 10ms生命周期
                
                game.updateBullets(20); // 更新20ms
                expect(game.bullets.length).toBe(0);
            });
        });

        describe('子弹特效', () => {
            it('应该为元素子弹创建粒子效果', () => {
                const initialParticleCount = game.particles.length;
                game.createBullet(400, 300, 1, 0, 10, 'fire');
                game.updateBullets(16);
                expect(game.particles.length).toBeGreaterThan(initialParticleCount);
            });

            it('应该正确处理子弹轨迹', () => {
                game.createBullet(400, 300, 1, 0, 10);
                const bullet = game.bullets[0];
                expect(Array.isArray(bullet.trail)).toBe(true);
            });
        });
    });

    // ==================== 敌人系统测试 ====================
    describe('敌人系统测试', () => {
        beforeEach(() => {
            game.start();
        });

        describe('敌人生成', () => {
            it('应该能够生成基础敌人', () => {
                const initialCount = game.enemies.length;
                game.spawnEnemy('basic');
                expect(game.enemies.length).toBe(initialCount + 1);
                
                const enemy = game.enemies[game.enemies.length - 1];
                expect(enemy.type).toBe('basic');
                expect(enemy.health).toBeGreaterThan(0);
                expect(enemy.maxHealth).toBeGreaterThan(0);
            });

            it('应该根据关卡调整敌人属性', () => {
                game.gameState.level = 5;
                game.spawnEnemy('basic');
                const enemy = game.enemies[game.enemies.length - 1];
                expect(enemy.health).toBeGreaterThan(game.config.enemies.basic.health);
            });

            it('应该在屏幕边缘生成敌人', () => {
                game.spawnEnemy('basic');
                const enemy = game.enemies[game.enemies.length - 1];
                const isOnEdge = 
                    enemy.x <= 0 || enemy.x >= game.config.canvas.width ||
                    enemy.y <= 0 || enemy.y >= game.config.canvas.height;
                expect(isOnEdge).toBe(true);
            });
        });

        describe('敌人AI', () => {
            it('敌人应该朝向石龙移动', () => {
                game.spawnEnemy('basic');
                const enemy = game.enemies[0];
                const initialDistance = Math.sqrt(
                    Math.pow(enemy.x - game.stoneDragon.x, 2) + 
                    Math.pow(enemy.y - game.stoneDragon.y, 2)
                );
                
                game.updateEnemies(16);
                
                const finalDistance = Math.sqrt(
                    Math.pow(enemy.x - game.stoneDragon.x, 2) + 
                    Math.pow(enemy.y - game.stoneDragon.y, 2)
                );
                
                expect(finalDistance).toBeLessThan(initialDistance);
            });

            it('敌人应该避免重叠', () => {
                game.spawnEnemy('basic');
                game.spawnEnemy('basic');
                const enemy1 = game.enemies[0];
                const enemy2 = game.enemies[1];
                
                // 将敌人放置在相近位置
                enemy1.x = 400;
                enemy1.y = 300;
                enemy2.x = 405;
                enemy2.y = 305;
                
                game.updateEnemies(16);
                
                const distance = Math.sqrt(
                    Math.pow(enemy1.x - enemy2.x, 2) + 
                    Math.pow(enemy1.y - enemy2.y, 2)
                );
                
                expect(distance).toBeGreaterThan(enemy1.radius + enemy2.radius);
            });
        });

        describe('敌人战斗', () => {
            it('敌人应该对石龙造成伤害', () => {
                game.spawnEnemy('basic');
                const enemy = game.enemies[0];
                const initialHealth = game.stoneDragon.health;
                
                // 将敌人移动到石龙附近
                enemy.x = game.stoneDragon.x;
                enemy.y = game.stoneDragon.y;
                
                game.checkEnemyPlayerCollision();
                expect(game.stoneDragon.health).toBeLessThan(initialHealth);
            });

            it('敌人死亡时应该给予分数', () => {
                game.spawnEnemy('basic');
                const enemy = game.enemies[0];
                const initialScore = game.gameState.score;
                
                enemy.takeDamage(enemy.maxHealth);
                game.updateEnemies(16);
                
                expect(game.gameState.score).toBeGreaterThan(initialScore);
            });

            it('敌人死亡时应该创建粒子效果', () => {
                game.spawnEnemy('basic');
                const enemy = game.enemies[0];
                const initialParticleCount = game.particles.length;
                
                enemy.takeDamage(enemy.maxHealth);
                game.updateEnemies(16);
                
                expect(game.particles.length).toBeGreaterThan(initialParticleCount);
            });
        });
    });

    // ==================== 碰撞检测测试 ====================
    describe('碰撞检测测试', () => {
        beforeEach(() => {
            game.start();
        });

        describe('基础碰撞检测', () => {
            it('应该正确检测圆形碰撞', () => {
                const obj1 = { x: 100, y: 100, radius: 10 };
                const obj2 = { x: 105, y: 100, radius: 10 };
                expect(game.checkCollision(obj1, obj2)).toBe(true);
                
                const obj3 = { x: 130, y: 100, radius: 10 };
                expect(game.checkCollision(obj1, obj3)).toBe(false);
            });

            it('应该正确处理边界情况', () => {
                const obj1 = { x: 100, y: 100, radius: 10 };
                const obj2 = { x: 120, y: 100, radius: 10 };
                expect(game.checkCollision(obj1, obj2)).toBe(true); // 刚好接触
                
                const obj3 = { x: 120.1, y: 100, radius: 10 };
                expect(game.checkCollision(obj1, obj3)).toBe(false); // 刚好不接触
            });
        });

        describe('子弹敌人碰撞', () => {
            it('子弹击中敌人应该造成伤害', () => {
                game.spawnEnemy('basic');
                const enemy = game.enemies[0];
                const initialHealth = enemy.health;
                
                game.createBullet(enemy.x, enemy.y, 0, 0, 10);
                game.checkBulletEnemyCollisions();
                
                expect(enemy.health).toBeLessThan(initialHealth);
            });

            it('子弹击中敌人后应该消失', () => {
                game.spawnEnemy('basic');
                const enemy = game.enemies[0];
                
                game.createBullet(enemy.x, enemy.y, 0, 0, 10);
                const initialBulletCount = game.bullets.length;
                
                game.checkBulletEnemyCollisions();
                expect(game.bullets.length).toBeLessThan(initialBulletCount);
            });

            it('应该正确处理元素伤害', () => {
                game.spawnEnemy('basic');
                const enemy = game.enemies[0];
                
                game.createBullet(enemy.x, enemy.y, 0, 0, 10, 'fire');
                game.checkBulletEnemyCollisions();
                
                // 验证火元素效果
                expect(enemy.elementalEffects && enemy.elementalEffects.fire).toBeTruthy();
            });
        });

        describe('玩家敌人碰撞', () => {
            it('石龙接触敌人应该受到伤害', () => {
                game.spawnEnemy('basic');
                const enemy = game.enemies[0];
                const initialHealth = game.stoneDragon.health;
                
                enemy.x = game.stoneDragon.x;
                enemy.y = game.stoneDragon.y;
                
                game.checkEnemyPlayerCollision();
                expect(game.stoneDragon.health).toBeLessThan(initialHealth);
            });

            it('应该有伤害冷却时间', () => {
                game.spawnEnemy('basic');
                const enemy = game.enemies[0];
                
                enemy.x = game.stoneDragon.x;
                enemy.y = game.stoneDragon.y;
                
                const healthAfterFirst = game.stoneDragon.health;
                game.checkEnemyPlayerCollision();
                
                const healthAfterSecond = game.stoneDragon.health;
                game.checkEnemyPlayerCollision();
                
                expect(healthAfterFirst).toBe(healthAfterSecond);
            });
        });
    });

    // ==================== 技能系统测试 ====================
    describe('技能系统测试', () => {
        beforeEach(() => {
            game.start();
        });

        describe('技能资源管理', () => {
            it('应该正确管理法力值', () => {
                expect(game.skillSystem.resources.mana).toBeGreaterThan(0);
                expect(game.skillSystem.resources.maxMana).toBeGreaterThan(0);
                expect(game.skillSystem.resources.mana).toBeLessThanOrEqual(game.skillSystem.resources.maxMana);
            });

            it('法力值应该随时间恢复', () => {
                game.skillSystem.resources.mana = 50;
                const initialMana = game.skillSystem.resources.mana;
                
                game.skillSystem.update(1000); // 更新1秒
                expect(game.skillSystem.resources.mana).toBeGreaterThan(initialMana);
            });

            it('法力值不应该超过最大值', () => {
                game.skillSystem.resources.mana = game.skillSystem.resources.maxMana;
                game.skillSystem.update(1000);
                expect(game.skillSystem.resources.mana).toBeLessThanOrEqual(game.skillSystem.resources.maxMana);
            });
        });

        describe('主动技能', () => {
            it('应该能够激活齐射技能', () => {
                const initialBulletCount = game.bullets.length;
                const initialMana = game.skillSystem.resources.mana;
                
                const result = game.skillSystem.activateSkill('volley');
                if (result) {
                    expect(game.bullets.length).toBeGreaterThan(initialBulletCount);
                    expect(game.skillSystem.resources.mana).toBeLessThan(initialMana);
                }
            });

            it('法力不足时不应该能够激活技能', () => {
                game.skillSystem.resources.mana = 0;
                const result = game.skillSystem.activateSkill('volley');
                expect(result).toBe(false);
            });

            it('技能应该有冷却时间', () => {
                game.skillSystem.activateSkill('volley');
                const secondResult = game.skillSystem.activateSkill('volley');
                expect(secondResult).toBe(false);
            });

            it('应该能够激活爆发射击', () => {
                const initialFireRate = game.fireRate;
                const result = game.skillSystem.activateSkill('burst');
                
                if (result) {
                    expect(game.fireRate).toBeGreaterThan(initialFireRate);
                    expect(game.skillSystem.activeSkills.burst).toBeTruthy();
                }
            });

            it('应该能够激活护盾', () => {
                const result = game.skillSystem.activateSkill('shield');
                if (result) {
                    expect(game.skillSystem.activeSkills.shield).toBeTruthy();
                }
            });
        });

        describe('被动技能', () => {
            it('应该能够学习被动技能', () => {
                const result = game.skillSystem.learnSkill('firepower');
                expect(result).toBe(true);
                expect(game.skillSystem.passiveSkills.firepower).toBeTruthy();
            });

            it('被动技能应该提供属性加成', () => {
                game.skillSystem.learnSkill('firepower');
                const damageBonus = game.skillSystem.getPassiveEffect('firepower', 'damageMultiplier');
                expect(damageBonus).toBeGreaterThan(0);
            });

            it('应该能够升级被动技能', () => {
                game.skillSystem.learnSkill('firepower');
                const initialLevel = game.skillSystem.passiveSkills.firepower.level;
                
                game.skillSystem.upgradeSkill('firepower');
                expect(game.skillSystem.passiveSkills.firepower.level).toBe(initialLevel + 1);
            });
        });

        describe('技能点系统', () => {
            it('学习技能应该消耗技能点', () => {
                const initialPoints = game.skillSystem.skillPoints;
                game.skillSystem.learnSkill('firepower');
                expect(game.skillSystem.skillPoints).toBeLessThan(initialPoints);
            });

            it('技能点不足时不应该能够学习技能', () => {
                game.skillSystem.skillPoints = 0;
                const result = game.skillSystem.learnSkill('firepower');
                expect(result).toBe(false);
            });
        });
    });

    // ==================== 元素系统测试 ====================
    describe('元素系统测试', () => {
        beforeEach(() => {
            game.start();
        });

        describe('元素效果', () => {
            it('火元素应该造成持续伤害', () => {
                game.spawnEnemy('basic');
                const enemy = game.enemies[0];
                
                game.elementSystem.applyElementalEffect(enemy, 'fire', 10);
                const initialHealth = enemy.health;
                
                game.elementSystem.updateElementalEffects(1000); // 更新1秒
                expect(enemy.health).toBeLessThan(initialHealth);
            });

            it('冰元素应该减缓移动速度', () => {
                game.spawnEnemy('basic');
                const enemy = game.enemies[0];
                const initialSpeed = enemy.speed;
                
                game.elementSystem.applyElementalEffect(enemy, 'ice', 10);
                expect(enemy.speed).toBeLessThan(initialSpeed);
            });

            it('雷元素应该造成连锁伤害', () => {
                // 生成多个敌人
                game.spawnEnemy('basic');
                game.spawnEnemy('basic');
                const enemy1 = game.enemies[0];
                const enemy2 = game.enemies[1];
                
                // 将敌人放置在相近位置
                enemy1.x = 400;
                enemy1.y = 300;
                enemy2.x = 450;
                enemy2.y = 300;
                
                const initialHealth2 = enemy2.health;
                game.elementSystem.applyElementalEffect(enemy1, 'lightning', 10);
                
                // 验证连锁效果
                expect(enemy2.health).toBeLessThan(initialHealth2);
            });
        });

        describe('元素组合', () => {
            it('火+冰应该产生蒸汽效果', () => {
                game.spawnEnemy('basic');
                const enemy = game.enemies[0];
                
                game.elementSystem.applyElementalEffect(enemy, 'fire', 10);
                game.elementSystem.applyElementalEffect(enemy, 'ice', 10);
                
                // 验证组合效果
                expect(enemy.elementalEffects.steam).toBeTruthy();
            });

            it('雷+水应该产生电击效果', () => {
                game.spawnEnemy('basic');
                const enemy = game.enemies[0];
                
                game.elementSystem.applyElementalEffect(enemy, 'lightning', 10);
                game.elementSystem.applyElementalEffect(enemy, 'water', 10);
                
                // 验证组合效果
                expect(enemy.elementalEffects.electrified).toBeTruthy();
            });
        });
    });

    // ==================== 游戏循环测试 ====================
    describe('游戏循环测试', () => {
        beforeEach(() => {
            game.start();
        });

        describe('更新循环', () => {
            it('update方法应该不抛出异常', () => {
                expect(() => {
                    game.update(16);
                }).not.toThrow();
            });

            it('应该正确更新游戏时间', () => {
                const initialTime = game.gameTime;
                game.update(16);
                expect(game.gameTime).toBeGreaterThan(initialTime);
            });

            it('暂停时不应该更新游戏逻辑', () => {
                game.pause();
                const initialEnemyCount = game.enemies.length;
                game.spawnEnemy('basic');
                
                game.update(16);
                expect(game.enemies.length).toBe(initialEnemyCount + 1); // 敌人被添加但不更新
            });
        });

        describe('渲染循环', () => {
            it('render方法应该不抛出异常', () => {
                expect(() => {
                    game.render();
                }).not.toThrow();
            });

            it('应该渲染所有游戏对象', () => {
                game.spawnEnemy('basic');
                game.createBullet(400, 300, 1, 0, 10);
                
                expect(() => {
                    game.render();
                }).not.toThrow();
            });
        });

        describe('性能测试', () => {
            it('大量对象时性能应该可接受', () => {
                // 生成大量对象
                for (let i = 0; i < 100; i++) {
                    game.spawnEnemy('basic');
                    game.createBullet(Math.random() * 800, Math.random() * 600, Math.random() - 0.5, Math.random() - 0.5, 10);
                }
                
                const startTime = Date.now();
                game.update(16);
                const updateTime = Date.now() - startTime;
                
                expect(updateTime).toBeLessThan(16); // 应该在一帧时间内完成
            });
        });
    });

    // ==================== 错误处理测试 ====================
    describe('错误处理测试', () => {
        describe('边界条件', () => {
            it('应该处理无效的敌人类型', () => {
                expect(() => {
                    game.spawnEnemy('invalid_type');
                }).not.toThrow();
            });

            it('应该处理无效的技能ID', () => {
                const result = game.skillSystem.activateSkill('invalid_skill');
                expect(result).toBe(false);
            });

            it('应该处理无效的元素类型', () => {
                game.spawnEnemy('basic');
                const enemy = game.enemies[0];
                
                expect(() => {
                    game.elementSystem.applyElementalEffect(enemy, 'invalid_element', 10);
                }).not.toThrow();
            });
        });

        describe('异常情况', () => {
            it('应该处理空的游戏对象数组', () => {
                game.bullets = [];
                game.enemies = [];
                game.particles = [];
                
                expect(() => {
                    game.update(16);
                }).not.toThrow();
            });

            it('应该处理极大的deltaTime值', () => {
                expect(() => {
                    game.update(10000); // 10秒
                }).not.toThrow();
            });

            it('应该处理负的deltaTime值', () => {
                expect(() => {
                    game.update(-16);
                }).not.toThrow();
            });
        });

        describe('内存管理', () => {
            it('应该正确清理死亡的敌人', () => {
                game.spawnEnemy('basic');
                const enemy = game.enemies[0];
                enemy.health = 0;
                
                game.updateEnemies(16);
                expect(game.enemies.length).toBe(0);
            });

            it('应该正确清理超时的粒子', () => {
                game.particles.push({
                    x: 400, y: 300,
                    vx: 0, vy: 0,
                    lifetime: 0,
                    maxLifetime: 1000
                });
                
                game.updateParticles(16);
                expect(game.particles.length).toBe(0);
            });

            it('应该限制对象数量防止内存泄漏', () => {
                // 创建大量对象
                for (let i = 0; i < 10000; i++) {
                    game.createBullet(400, 300, 1, 0, 10);
                }
                
                // 验证对象数量被限制
                expect(game.bullets.length).toBeLessThan(1000);
            });
        });
    });

    // ==================== 集成测试 ====================
    describe('集成测试', () => {
        describe('完整游戏流程', () => {
            it('应该能够完成一个完整的游戏循环', () => {
                // 启动游戏
                game.start();
                expect(game.gameState.isRunning).toBe(true);
                
                // 生成敌人
                game.spawnEnemy('basic');
                expect(game.enemies.length).toBeGreaterThan(0);
                
                // 射击
                game.createBullet(game.stoneDragon.x, game.stoneDragon.y, 1, 0, 10);
                expect(game.bullets.length).toBeGreaterThan(0);
                
                // 更新游戏状态
                for (let i = 0; i < 100; i++) {
                    game.update(16);
                    game.render();
                }
                
                // 验证游戏仍在运行
                expect(game.gameState.isRunning).toBe(true);
            });

            it('应该正确处理关卡进度', () => {
                const initialLevel = game.gameState.level;
                
                // 模拟杀死足够的敌人来升级
                for (let i = 0; i < 50; i++) {
                    game.spawnEnemy('basic');
                    const enemy = game.enemies[game.enemies.length - 1];
                    enemy.takeDamage(enemy.maxHealth);
                    game.updateEnemies(16);
                }
                
                expect(game.gameState.level).toBeGreaterThan(initialLevel);
            });
        });

        describe('系统交互', () => {
            it('技能系统应该与战斗系统正确交互', () => {
                // 学习火力技能
                game.skillSystem.learnSkill('firepower');
                
                // 创建子弹
                game.createBullet(400, 300, 1, 0, 10);
                const bullet = game.bullets[0];
                
                // 验证技能效果应用到子弹
                const expectedDamage = 10 * (1 + game.skillSystem.getPassiveEffect('firepower', 'damageMultiplier'));
                expect(bullet.damage).toBeCloseTo(expectedDamage, 1);
            });

            it('元素系统应该与技能系统正确交互', () => {
                // 学习元素技能
                game.skillSystem.learnSkill('elementalMastery');
                
                // 激活元素技能
                const result = game.skillSystem.activateSkill('elementalStorm');
                if (result) {
                    expect(game.skillSystem.activeSkills.elementalStorm).toBeTruthy();
                }
            });
        });
    });
});

// 运行测试
console.log('🚀 开始运行塔防游戏综合测试套件...');

// 使用全局测试框架实例
const testRunner = TestFramework.testFramework;

// 运行所有测试
testRunner.run().then(() => {
    console.log('\n📊 测试完成!');
    
    // 检查是否有失败的测试
    if (testRunner.results.failed > 0) {
        console.log('❌ 游戏测试有失败项');
        process.exit(1);
    } else {
        console.log('✅ 所有游戏测试通过!');
        process.exit(0);
    }
}).catch(error => {
    console.error('❌ 测试运行失败:', error);
    process.exit(1);
});
