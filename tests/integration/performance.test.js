/**
 * 性能测试
 * 测试游戏在各种负载条件下的性能表现
 */

const DragonHunterGame = require('../../src/game.js');

describe('性能测试', () => {
    let game;

    beforeEach(() => {
        game = new DragonHunterGame();
        jest.spyOn(performance, 'now').mockImplementation(() => Date.now());
    });

    afterEach(() => {
        if (game) {
            game.destroy();
        }
        jest.restoreAllMocks();
    });

    describe('游戏循环性能', () => {
        test('单次游戏更新应该在合理时间内完成', () => {
            game.startGame();
            
            const startTime = Date.now();
            game.update(0.016); // 60FPS的一帧
            const endTime = Date.now();
            
            const updateTime = endTime - startTime;
            
            // 更新时间应该小于16ms（60FPS的预算）
            expect(updateTime).toBeLessThan(50); // 给一些余量用于测试环境
        });

        test('连续游戏更新应该保持稳定性能', () => {
            game.startGame();
            
            const updateTimes = [];
            
            for (let i = 0; i < 100; i++) {
                const startTime = Date.now();
                game.update(0.016);
                const endTime = Date.now();
                
                updateTimes.push(endTime - startTime);
            }
            
            // 计算平均更新时间
            const averageTime = updateTimes.reduce((sum, time) => sum + time, 0) / updateTimes.length;
            
            // 平均更新时间应该合理
            expect(averageTime).toBeLessThan(20);
            
            // 最大更新时间不应该过长
            const maxTime = Math.max(...updateTimes);
            expect(maxTime).toBeLessThan(100);
        });

        test('渲染性能应该稳定', () => {
            game.startGame();
            
            // 添加一些游戏对象
            for (let i = 0; i < 10; i++) {
                game.spawnDragon();
                game.shoot();
                game.createHitParticles(Math.random() * 800, Math.random() * 600);
            }
            
            const renderTimes = [];
            
            for (let i = 0; i < 50; i++) {
                const startTime = Date.now();
                game.render();
                const endTime = Date.now();
                
                renderTimes.push(endTime - startTime);
            }
            
            const averageRenderTime = renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length;
            
            // 平均渲染时间应该合理（考虑到我们使用的是模拟Canvas）
            expect(averageRenderTime).toBeLessThan(30);
        });
    });

    describe('大量对象性能', () => {
        test('大量子弹的更新性能', () => {
            game.startGame();
            
            // 创建1000个子弹
            for (let i = 0; i < 1000; i++) {
                game.bullets.push({
                    x: Math.random() * game.width,
                    y: Math.random() * game.height,
                    vx: (Math.random() - 0.5) * 400,
                    vy: (Math.random() - 0.5) * 400,
                    damage: 25
                });
            }
            
            const startTime = Date.now();
            game.updateBullets(0.016);
            const endTime = Date.now();
            
            const updateTime = endTime - startTime;
            
            // 1000个子弹的更新应该在合理时间内完成
            expect(updateTime).toBeLessThan(100);
            
            // 验证子弹数量（一些可能被移除）
            expect(game.bullets.length).toBeLessThanOrEqual(1000);
        });

        test('大量龙的更新性能', () => {
            game.startGame();
            
            // 创建100个龙
            for (let i = 0; i < 100; i++) {
                game.dragons.push({
                    x: Math.random() * game.width,
                    y: Math.random() * game.height,
                    health: 100,
                    maxHealth: 100,
                    speed: 50,
                    attackCooldown: Math.random() * 5,
                    size: 25
                });
            }
            
            const startTime = Date.now();
            game.updateDragons(0.016);
            const endTime = Date.now();
            
            const updateTime = endTime - startTime;
            
            // 100个龙的更新应该在合理时间内完成
            expect(updateTime).toBeLessThan(50);
        });

        test('大量粒子的更新性能', () => {
            game.startGame();
            
            // 创建大量粒子
            for (let i = 0; i < 50; i++) {
                game.createHitParticles(Math.random() * 800, Math.random() * 600);
            }
            
            const initialParticleCount = game.particles.length;
            expect(initialParticleCount).toBe(50 * 8); // 每次爆炸8个粒子
            
            const startTime = Date.now();
            game.updateEffects(0.016);
            const endTime = Date.now();
            
            const updateTime = endTime - startTime;
            
            // 大量粒子的更新应该在合理时间内完成
            expect(updateTime).toBeLessThan(30);
        });
    });

    describe('碰撞检测性能', () => {
        test('大量碰撞检测的性能', () => {
            game.startGame();
            
            // 创建大量对象
            for (let i = 0; i < 50; i++) {
                game.bullets.push({
                    x: Math.random() * game.width,
                    y: Math.random() * game.height,
                    vx: 100, vy: 0,
                    damage: 25
                });
                
                game.dragons.push({
                    x: Math.random() * game.width,
                    y: Math.random() * game.height,
                    health: 100, maxHealth: 100,
                    speed: 50, attackCooldown: 0,
                    size: 25
                });
                
                game.loot.push({
                    x: Math.random() * game.width,
                    y: Math.random() * game.height,
                    type: 'damage',
                    name: '伤害提升',
                    createdTime: Date.now(),
                    bobOffset: 0
                });
            }
            
            const startTime = Date.now();
            game.checkCollisions();
            const endTime = Date.now();
            
            const collisionTime = endTime - startTime;
            
            // 碰撞检测应该在合理时间内完成
            expect(collisionTime).toBeLessThan(100);
        });

        test('优化的碰撞检测算法', () => {
            // 测试O(n²)复杂度的碰撞检测是否可接受
            const objectCounts = [10, 25, 50];
            const timings = [];
            
            objectCounts.forEach(count => {
                game = new DragonHunterGame();
                game.startGame();
                
                // 创建指定数量的对象
                for (let i = 0; i < count; i++) {
                    game.bullets.push({
                        x: Math.random() * game.width,
                        y: Math.random() * game.height,
                        vx: 100, vy: 0, damage: 25
                    });
                    
                    game.dragons.push({
                        x: Math.random() * game.width,
                        y: Math.random() * game.height,
                        health: 100, maxHealth: 100,
                        speed: 50, attackCooldown: 0, size: 25
                    });
                }
                
                const startTime = Date.now();
                game.checkCollisions();
                const endTime = Date.now();
                
                timings.push({
                    count: count,
                    time: endTime - startTime
                });
                
                game.destroy();
            });
            
            // 验证时间复杂度是否合理
            timings.forEach(timing => {
                expect(timing.time).toBeLessThan(timing.count * 2); // 线性增长上限
            });
        });
    });

    describe('内存使用性能', () => {
        test('长时间运行不应该造成内存泄漏', () => {
            game.startGame();
            
            // 模拟长时间游戏运行
            for (let i = 0; i < 1000; i++) {
                // 添加对象
                if (Math.random() < 0.3) {
                    game.spawnDragon();
                }
                if (Math.random() < 0.5) {
                    game.shoot();
                }
                if (Math.random() < 0.2) {
                    game.createHitParticles(Math.random() * 800, Math.random() * 600);
                }
                
                // 更新游戏
                game.update(0.016);
                
                // 定期检查对象数量
                if (i % 100 === 0) {
                    // 对象数量不应该无限增长
                    expect(game.bullets.length).toBeLessThan(200);
                    expect(game.particles.length).toBeLessThan(500);
                    expect(game.damageNumbers.length).toBeLessThan(100);
                }
            }
        });

        test('对象清理应该及时', () => {
            game.startGame();
            
            // 创建一些临时对象
            game.createHitParticles(400, 300);
            game.addDamageNumber(400, 300, 25);
            
            const initialParticles = game.particles.length;
            const initialDamageNumbers = game.damageNumbers.length;
            
            // 运行足够长时间让对象过期
            game.updateEffects(5.0);
            
            // 过期对象应该被清理
            expect(game.particles.length).toBeLessThan(initialParticles);
            expect(game.damageNumbers.length).toBeLessThan(initialDamageNumbers);
        });

        test('数组操作性能', () => {
            game.startGame();
            
            // 测试大量数组插入和删除
            const startTime = Date.now();
            
            for (let i = 0; i < 1000; i++) {
                // 添加对象
                game.bullets.push({
                    x: i, y: i, vx: 100, vy: 0, damage: 25
                });
            }
            
            // 过滤数组（模拟对象移除）
            game.bullets = game.bullets.filter((bullet, index) => index % 2 === 0);
            
            const endTime = Date.now();
            const operationTime = endTime - startTime;
            
            // 数组操作应该高效
            expect(operationTime).toBeLessThan(50);
            expect(game.bullets.length).toBe(500);
        });
    });

    describe('帧率稳定性', () => {
        test('应该维持稳定的帧率', () => {
            game.startGame();
            
            // 添加一些游戏对象增加负载
            for (let i = 0; i < 20; i++) {
                game.spawnDragon();
            }
            
            const frameTimes = [];
            let lastTime = 0;
            
            // 模拟60帧
            for (let frame = 0; frame < 60; frame++) {
                const currentTime = frame * 16.67; // 60FPS
                const deltaTime = (currentTime - lastTime) / 1000;
                
                const frameStart = Date.now();
                game.update(deltaTime);
                game.render();
                const frameEnd = Date.now();
                
                frameTimes.push(frameEnd - frameStart);
                lastTime = currentTime;
            }
            
            // 计算帧率统计
            const averageFrameTime = frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length;
            const maxFrameTime = Math.max(...frameTimes);
            const minFrameTime = Math.min(...frameTimes);
            
            // 帧时间应该稳定
            expect(averageFrameTime).toBeLessThan(16); // 60FPS预算
            expect(maxFrameTime).toBeLessThan(50); // 最大帧时间
            expect(maxFrameTime - minFrameTime).toBeLessThan(30); // 帧时间变化不应该太大
        });

        test('高负载下的性能降级', () => {
            game.startGame();
            
            // 创建极高负载
            for (let i = 0; i < 200; i++) {
                game.spawnDragon();
                game.shoot();
            }
            
            for (let i = 0; i < 100; i++) {
                game.createHitParticles(Math.random() * 800, Math.random() * 600);
            }
            
            const startTime = Date.now();
            
            // 运行10帧
            for (let frame = 0; frame < 10; frame++) {
                game.update(0.016);
                game.render();
            }
            
            const endTime = Date.now();
            const totalTime = endTime - startTime;
            const averageFrameTime = totalTime / 10;
            
            // 即使在高负载下，平均帧时间也应该可接受
            expect(averageFrameTime).toBeLessThan(100); // 10FPS下限
        });
    });

    describe('资源优化', () => {
        test('字符串拼接性能', () => {
            const iterations = 10000;
            
            // 测试字符串拼接（模拟UI更新）
            const startTime = Date.now();
            
            for (let i = 0; i < iterations; i++) {
                const scoreText = `分数: ${i}`;
                const livesText = `生命: ${3}`;
                const waveText = `波次: ${Math.floor(i / 100)}`;
                
                // 模拟DOM更新
                const combinedText = `${scoreText} | ${livesText} | ${waveText}`;
                expect(combinedText.length).toBeGreaterThan(0);
            }
            
            const endTime = Date.now();
            const stringTime = endTime - startTime;
            
            // 字符串操作应该高效
            expect(stringTime).toBeLessThan(100);
        });

        test('数学计算性能', () => {
            const iterations = 100000;
            
            // 测试游戏中常用的数学计算
            const startTime = Date.now();
            
            for (let i = 0; i < iterations; i++) {
                const x1 = Math.random() * 800;
                const y1 = Math.random() * 600;
                const x2 = Math.random() * 800;
                const y2 = Math.random() * 600;
                
                // 距离计算
                const dx = x2 - x1;
                const dy = y2 - y1;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // 角度计算
                const angle = Math.atan2(dy, dx);
                
                // 三角函数
                const cos = Math.cos(angle);
                const sin = Math.sin(angle);
                
                expect(distance).toBeGreaterThanOrEqual(0);
                expect(cos).toBeGreaterThanOrEqual(-1);
                expect(sin).toBeGreaterThanOrEqual(-1);
            }
            
            const endTime = Date.now();
            const mathTime = endTime - startTime;
            
            // 数学计算应该高效
            expect(mathTime).toBeLessThan(200);
        });

        test('对象创建和销毁性能', () => {
            const iterations = 10000;
            
            const startTime = Date.now();
            
            for (let i = 0; i < iterations; i++) {
                // 创建游戏对象（模拟子弹创建）
                const bullet = {
                    x: Math.random() * 800,
                    y: Math.random() * 600,
                    vx: Math.random() * 400,
                    vy: Math.random() * 400,
                    damage: 25,
                    life: 1.0
                };
                
                // 模拟对象使用
                bullet.x += bullet.vx * 0.016;
                bullet.y += bullet.vy * 0.016;
                bullet.life -= 0.016;
                
                // 对象销毁（垃圾回收）
                // JavaScript会自动处理
            }
            
            const endTime = Date.now();
            const objectTime = endTime - startTime;
            
            // 对象操作应该高效
            expect(objectTime).toBeLessThan(100);
        });
    });
});
