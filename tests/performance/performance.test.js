/**
 * 游戏性能测试套件
 * 测试各种场景下的性能表现
 */

// 导入测试框架
if (typeof require !== 'undefined') {
    const { TestFramework, MockUtils } = require('../test-framework.js');
    global.TestFramework = TestFramework;
    global.MockUtils = MockUtils;
}

const testFramework = new TestFramework();
const { describe, it, expect, beforeEach, afterEach } = testFramework;

describe('游戏性能测试', () => {
    let game;
    let mockCanvas;
    let mockContext;

    beforeEach(() => {
        mockCanvas = MockUtils.createMockCanvas(800, 600);
        mockContext = mockCanvas.getContext('2d');
        game = new DragonHunterGame(mockCanvas);
        game.startGame();
    });

    afterEach(() => {
        game = null;
        mockCanvas = null;
        mockContext = null;
    });

    describe('基础性能测试', () => {
        it('游戏初始化性能', async () => {
            const result = await testFramework.benchmark(
                '游戏初始化',
                () => {
                    const newGame = new DragonHunterGame(mockCanvas);
                    newGame.startGame();
                },
                100
            );

            expect(result.avg).toBeLessThan(10); // 应该在10ms内完成
            console.log(`游戏初始化平均耗时: ${result.avg.toFixed(2)}ms`);
        });

        it('单帧更新性能', async () => {
            const result = await testFramework.benchmark(
                '单帧更新',
                () => {
                    game.update(16.67); // 60FPS
                },
                1000
            );

            expect(result.avg).toBeLessThan(16); // 应该在16ms内完成（60FPS要求）
            console.log(`单帧更新平均耗时: ${result.avg.toFixed(2)}ms`);
        });

        it('单帧渲染性能', async () => {
            const result = await testFramework.benchmark(
                '单帧渲染',
                () => {
                    game.render();
                },
                1000
            );

            expect(result.avg).toBeLessThan(16); // 应该在16ms内完成
            console.log(`单帧渲染平均耗时: ${result.avg.toFixed(2)}ms`);
        });

        it('完整游戏循环性能', async () => {
            const result = await testFramework.benchmark(
                '完整游戏循环',
                () => {
                    game.update(16.67);
                    game.render();
                },
                500
            );

            expect(result.avg).toBeLessThan(16); // 总时间应该在16ms内
            console.log(`完整游戏循环平均耗时: ${result.avg.toFixed(2)}ms`);
        });
    });

    describe('对象数量性能测试', () => {
        it('大量子弹性能测试', async () => {
            // 创建大量子弹
            for (let i = 0; i < 200; i++) {
                game.createBullet(
                    400 + (i % 20) * 10,
                    300 + Math.floor(i / 20) * 10,
                    Math.random() - 0.5,
                    Math.random() - 0.5
                );
            }

            expect(game.bullets.length).toBe(200);

            const result = await testFramework.benchmark(
                '200个子弹更新',
                () => {
                    game.updateBullets(16.67);
                },
                100
            );

            expect(result.avg).toBeLessThan(5); // 应该在5ms内完成
            console.log(`200个子弹更新平均耗时: ${result.avg.toFixed(2)}ms`);
        });

        it('大量敌人性能测试', async () => {
            // 创建大量敌人
            for (let i = 0; i < 50; i++) {
                game.spawnDragon();
            }

            expect(game.dragons.length).toBe(50);

            const result = await testFramework.benchmark(
                '50个敌人更新',
                () => {
                    game.updateDragons(16.67);
                },
                100
            );

            expect(result.avg).toBeLessThan(8); // 应该在8ms内完成
            console.log(`50个敌人更新平均耗时: ${result.avg.toFixed(2)}ms`);
        });

        it('大量粒子效果性能测试', async () => {
            // 创建大量粒子
            for (let i = 0; i < 300; i++) {
                game.particles.push({
                    x: Math.random() * 800,
                    y: Math.random() * 600,
                    vx: (Math.random() - 0.5) * 100,
                    vy: (Math.random() - 0.5) * 100,
                    life: 1.0,
                    maxLife: 1.0,
                    size: Math.random() * 5 + 1,
                    color: `hsl(${Math.random() * 360}, 100%, 50%)`
                });
            }

            expect(game.particles.length).toBe(300);

            const result = await testFramework.benchmark(
                '300个粒子更新',
                () => {
                    game.updateParticles(16.67);
                },
                100
            );

            expect(result.avg).toBeLessThan(3); // 应该在3ms内完成
            console.log(`300个粒子更新平均耗时: ${result.avg.toFixed(2)}ms`);
        });

        it('混合大量对象性能测试', async () => {
            // 创建混合场景
            for (let i = 0; i < 100; i++) {
                game.createBullet(400, 300, Math.random() - 0.5, Math.random() - 0.5);
            }
            for (let i = 0; i < 30; i++) {
                game.spawnDragon();
            }
            for (let i = 0; i < 150; i++) {
                game.particles.push({
                    x: Math.random() * 800,
                    y: Math.random() * 600,
                    vx: (Math.random() - 0.5) * 100,
                    vy: (Math.random() - 0.5) * 100,
                    life: 1.0,
                    maxLife: 1.0,
                    size: Math.random() * 5 + 1,
                    color: `hsl(${Math.random() * 360}, 100%, 50%)`
                });
            }

            const result = await testFramework.benchmark(
                '混合场景更新 (100子弹+30敌人+150粒子)',
                () => {
                    game.update(16.67);
                },
                50
            );

            expect(result.avg).toBeLessThan(16); // 应该在16ms内完成
            console.log(`混合场景更新平均耗时: ${result.avg.toFixed(2)}ms`);
        });
    });

    describe('碰撞检测性能测试', () => {
        it('子弹-敌人碰撞检测性能', async () => {
            // 创建测试场景
            for (let i = 0; i < 100; i++) {
                game.createBullet(400, 300, Math.random() - 0.5, Math.random() - 0.5);
            }
            for (let i = 0; i < 50; i++) {
                game.spawnDragon();
            }

            const result = await testFramework.benchmark(
                '子弹-敌人碰撞检测 (100x50)',
                () => {
                    game.checkBulletDragonCollisions();
                },
                100
            );

            expect(result.avg).toBeLessThan(10); // 应该在10ms内完成
            console.log(`碰撞检测平均耗时: ${result.avg.toFixed(2)}ms`);
        });

        it('玩家-敌人碰撞检测性能', async () => {
            // 创建大量敌人
            for (let i = 0; i < 100; i++) {
                game.spawnDragon();
            }

            const result = await testFramework.benchmark(
                '玩家-敌人碰撞检测 (100个敌人)',
                () => {
                    game.checkPlayerDragonCollisions();
                },
                200
            );

            expect(result.avg).toBeLessThan(2); // 应该在2ms内完成
            console.log(`玩家碰撞检测平均耗时: ${result.avg.toFixed(2)}ms`);
        });

        it('优化碰撞检测性能对比', async () => {
            // 创建测试数据
            const bullets = [];
            const dragons = [];
            
            for (let i = 0; i < 50; i++) {
                bullets.push({
                    x: Math.random() * 800,
                    y: Math.random() * 600,
                    radius: 3
                });
            }
            
            for (let i = 0; i < 25; i++) {
                dragons.push({
                    x: Math.random() * 800,
                    y: Math.random() * 600,
                    radius: 15
                });
            }

            // 朴素算法
            const naiveResult = await testFramework.benchmark(
                '朴素碰撞检测',
                () => {
                    for (let i = 0; i < bullets.length; i++) {
                        for (let j = 0; j < dragons.length; j++) {
                            const dx = bullets[i].x - dragons[j].x;
                            const dy = bullets[i].y - dragons[j].y;
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            const collision = distance < (bullets[i].radius + dragons[j].radius);
                        }
                    }
                },
                500
            );

            // 优化算法（避免开方）
            const optimizedResult = await testFramework.benchmark(
                '优化碰撞检测',
                () => {
                    for (let i = 0; i < bullets.length; i++) {
                        for (let j = 0; j < dragons.length; j++) {
                            const dx = bullets[i].x - dragons[j].x;
                            const dy = bullets[i].y - dragons[j].y;
                            const distanceSquared = dx * dx + dy * dy;
                            const radiusSum = bullets[i].radius + dragons[j].radius;
                            const collision = distanceSquared < (radiusSum * radiusSum);
                        }
                    }
                },
                500
            );

            console.log(`朴素算法平均耗时: ${naiveResult.avg.toFixed(2)}ms`);
            console.log(`优化算法平均耗时: ${optimizedResult.avg.toFixed(2)}ms`);
            console.log(`性能提升: ${((naiveResult.avg - optimizedResult.avg) / naiveResult.avg * 100).toFixed(1)}%`);

            expect(optimizedResult.avg).toBeLessThan(naiveResult.avg);
        });
    });

    describe('技能系统性能测试', () => {
        it('技能激活性能', async () => {
            game.skillSystem.resources.mana = game.skillSystem.resources.maxMana;

            const result = await testFramework.benchmark(
                '技能激活',
                () => {
                    game.skillSystem.cooldowns = {}; // 重置冷却
                    game.skillSystem.resources.mana = game.skillSystem.resources.maxMana;
                    game.skillSystem.activateSkill('volley');
                },
                200
            );

            expect(result.avg).toBeLessThan(2); // 应该在2ms内完成
            console.log(`技能激活平均耗时: ${result.avg.toFixed(2)}ms`);
        });

        it('技能冷却更新性能', async () => {
            // 激活所有技能
            Object.keys(game.skillSystem.ACTIVE_SKILLS).forEach(skillId => {
                game.skillSystem.cooldowns[skillId] = 5000;
            });

            const result = await testFramework.benchmark(
                '技能冷却更新',
                () => {
                    game.skillSystem.updateCooldowns(16.67);
                },
                1000
            );

            expect(result.avg).toBeLessThan(1); // 应该在1ms内完成
            console.log(`技能冷却更新平均耗时: ${result.avg.toFixed(2)}ms`);
        });

        it('持续技能效果更新性能', async () => {
            // 激活所有持续技能
            game.skillSystem.activateSkill('burst');
            game.skillSystem.activateSkill('shield');

            const result = await testFramework.benchmark(
                '持续技能效果更新',
                () => {
                    game.skillSystem.updateActiveSkills(16.67);
                },
                1000
            );

            expect(result.avg).toBeLessThan(1); // 应该在1ms内完成
            console.log(`持续技能效果更新平均耗时: ${result.avg.toFixed(2)}ms`);
        });
    });

    describe('渲染性能测试', () => {
        it('基础图形渲染性能', async () => {
            const result = await testFramework.benchmark(
                '基础图形渲染',
                () => {
                    game.renderPlayer();
                    game.renderUI();
                },
                500
            );

            expect(result.avg).toBeLessThan(5); // 应该在5ms内完成
            console.log(`基础图形渲染平均耗时: ${result.avg.toFixed(2)}ms`);
        });

        it('大量对象渲染性能', async () => {
            // 创建大量可视对象
            for (let i = 0; i < 100; i++) {
                game.createBullet(400, 300, Math.random() - 0.5, Math.random() - 0.5);
            }
            for (let i = 0; i < 30; i++) {
                game.spawnDragon();
            }

            const result = await testFramework.benchmark(
                '大量对象渲染',
                () => {
                    game.renderBullets();
                    game.renderDragons();
                },
                100
            );

            expect(result.avg).toBeLessThan(10); // 应该在10ms内完成
            console.log(`大量对象渲染平均耗时: ${result.avg.toFixed(2)}ms`);
        });

        it('特效渲染性能', async () => {
            // 创建大量特效
            for (let i = 0; i < 200; i++) {
                game.particles.push({
                    x: Math.random() * 800,
                    y: Math.random() * 600,
                    vx: (Math.random() - 0.5) * 100,
                    vy: (Math.random() - 0.5) * 100,
                    life: 1.0,
                    maxLife: 1.0,
                    size: Math.random() * 5 + 1,
                    color: `hsl(${Math.random() * 360}, 100%, 50%)`
                });
            }

            const result = await testFramework.benchmark(
                '特效渲染',
                () => {
                    game.renderParticles();
                },
                100
            );

            expect(result.avg).toBeLessThan(8); // 应该在8ms内完成
            console.log(`特效渲染平均耗时: ${result.avg.toFixed(2)}ms`);
        });
    });

    describe('内存使用性能测试', () => {
        it('内存泄漏检测', async () => {
            const initialObjectCount = game.bullets.length + game.dragons.length + game.particles.length;

            // 运行大量游戏循环
            for (let i = 0; i < 1000; i++) {
                // 创建对象
                if (Math.random() < 0.1) game.createBullet(400, 300, 1, 0);
                if (Math.random() < 0.05) game.spawnDragon();
                
                // 更新游戏
                game.update(16.67);
                
                // 清理超出边界的对象
                game.cleanupObjects();
            }

            const finalObjectCount = game.bullets.length + game.dragons.length + game.particles.length;
            const objectGrowth = finalObjectCount - initialObjectCount;

            console.log(`初始对象数量: ${initialObjectCount}`);
            console.log(`最终对象数量: ${finalObjectCount}`);
            console.log(`对象增长: ${objectGrowth}`);

            // 对象增长应该在合理范围内
            expect(objectGrowth).toBeLessThan(100);
        });

        it('对象池性能测试', async () => {
            // 测试对象创建性能
            const directCreationResult = await testFramework.benchmark(
                '直接创建对象',
                () => {
                    const bullet = {
                        x: 400,
                        y: 300,
                        vx: 100,
                        vy: 0,
                        damage: 25,
                        radius: 3
                    };
                },
                10000
            );

            // 模拟对象池
            const bulletPool = [];
            for (let i = 0; i < 100; i++) {
                bulletPool.push({
                    x: 0, y: 0, vx: 0, vy: 0,
                    damage: 0, radius: 0, active: false
                });
            }

            const poolResult = await testFramework.benchmark(
                '对象池创建',
                () => {
                    const bullet = bulletPool.find(b => !b.active);
                    if (bullet) {
                        bullet.x = 400;
                        bullet.y = 300;
                        bullet.vx = 100;
                        bullet.vy = 0;
                        bullet.damage = 25;
                        bullet.radius = 3;
                        bullet.active = true;
                    }
                },
                10000
            );

            console.log(`直接创建平均耗时: ${directCreationResult.avg.toFixed(4)}ms`);
            console.log(`对象池平均耗时: ${poolResult.avg.toFixed(4)}ms`);

            expect(poolResult.avg).toBeLessThan(directCreationResult.avg);
        });
    });

    describe('算法优化性能测试', () => {
        it('数组操作优化', async () => {
            const testArray = [];
            for (let i = 0; i < 1000; i++) {
                testArray.push({ id: i, active: Math.random() > 0.5 });
            }

            // 使用filter删除元素
            const filterResult = await testFramework.benchmark(
                'Array.filter删除',
                () => {
                    const filtered = testArray.filter(item => item.active);
                },
                1000
            );

            // 使用索引倒序删除
            const indexResult = await testFramework.benchmark(
                '索引倒序删除',
                () => {
                    const array = [...testArray];
                    for (let i = array.length - 1; i >= 0; i--) {
                        if (!array[i].active) {
                            array.splice(i, 1);
                        }
                    }
                },
                1000
            );

            console.log(`filter方法平均耗时: ${filterResult.avg.toFixed(4)}ms`);
            console.log(`索引删除平均耗时: ${indexResult.avg.toFixed(4)}ms`);
        });

        it('数学运算优化', async () => {
            const testData = [];
            for (let i = 0; i < 1000; i++) {
                testData.push({
                    x: Math.random() * 800,
                    y: Math.random() * 600
                });
            }

            // 使用Math.sqrt计算距离
            const sqrtResult = await testFramework.benchmark(
                'Math.sqrt距离计算',
                () => {
                    for (let i = 0; i < testData.length; i++) {
                        const dx = testData[i].x - 400;
                        const dy = testData[i].y - 300;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                    }
                },
                500
            );

            // 使用平方距离比较
            const squaredResult = await testFramework.benchmark(
                '平方距离比较',
                () => {
                    for (let i = 0; i < testData.length; i++) {
                        const dx = testData[i].x - 400;
                        const dy = testData[i].y - 300;
                        const distanceSquared = dx * dx + dy * dy;
                    }
                },
                500
            );

            console.log(`开方计算平均耗时: ${sqrtResult.avg.toFixed(4)}ms`);
            console.log(`平方比较平均耗时: ${squaredResult.avg.toFixed(4)}ms`);

            expect(squaredResult.avg).toBeLessThan(sqrtResult.avg);
        });
    });

    describe('实际游戏场景性能测试', () => {
        it('高强度战斗场景', async () => {
            // 创建高强度战斗场景
            for (let i = 0; i < 50; i++) {
                game.spawnDragon();
            }

            const result = await testFramework.benchmark(
                '高强度战斗场景',
                () => {
                    // 玩家快速射击
                    for (let i = 0; i < 5; i++) {
                        game.createBullet(400, 300, Math.random() - 0.5, Math.random() - 0.5);
                    }
                    
                    // 激活技能
                    if (Math.random() < 0.1) {
                        game.skillSystem.cooldowns = {};
                        game.skillSystem.resources.mana = game.skillSystem.resources.maxMana;
                        game.skillSystem.activateSkill('volley');
                    }
                    
                    // 更新游戏
                    game.update(16.67);
                    game.render();
                },
                100
            );

            expect(result.avg).toBeLessThan(20); // 应该在20ms内完成
            console.log(`高强度战斗场景平均耗时: ${result.avg.toFixed(2)}ms`);
        });

        it('Boss战性能测试', async () => {
            // 创建Boss
            game.spawnBoss();
            
            // 创建Boss战环境
            for (let i = 0; i < 20; i++) {
                game.spawnDragon(); // 小兵
            }

            const result = await testFramework.benchmark(
                'Boss战场景',
                () => {
                    // Boss攻击
                    if (game.stoneDragon) {
                        game.updateBoss(16.67);
                    }
                    
                    // 玩家攻击
                    for (let i = 0; i < 3; i++) {
                        game.createBullet(400, 300, Math.random() - 0.5, Math.random() - 0.5);
                    }
                    
                    // 更新游戏
                    game.update(16.67);
                    game.render();
                },
                50
            );

            expect(result.avg).toBeLessThan(25); // Boss战可以稍微放宽要求
            console.log(`Boss战场景平均耗时: ${result.avg.toFixed(2)}ms`);
        });
    });

    describe('性能回归测试', () => {
        it('性能基准测试', async () => {
            // 记录基准性能数据
            const benchmarks = {
                gameInit: 0,
                singleFrame: 0,
                collision: 0,
                rendering: 0
            };

            // 游戏初始化基准
            const initResult = await testFramework.benchmark(
                '初始化基准',
                () => {
                    const newGame = new DragonHunterGame(mockCanvas);
                    newGame.startGame();
                },
                50
            );
            benchmarks.gameInit = initResult.avg;

            // 单帧更新基准
            const frameResult = await testFramework.benchmark(
                '单帧基准',
                () => {
                    game.update(16.67);
                },
                500
            );
            benchmarks.singleFrame = frameResult.avg;

            // 碰撞检测基准
            for (let i = 0; i < 50; i++) {
                game.createBullet(400, 300, Math.random() - 0.5, Math.random() - 0.5);
                game.spawnDragon();
            }
            const collisionResult = await testFramework.benchmark(
                '碰撞基准',
                () => {
                    game.checkBulletDragonCollisions();
                },
                200
            );
            benchmarks.collision = collisionResult.avg;

            // 渲染基准
            const renderResult = await testFramework.benchmark(
                '渲染基准',
                () => {
                    game.render();
                },
                200
            );
            benchmarks.rendering = renderResult.avg;

            console.log('性能基准数据:');
            console.log(`游戏初始化: ${benchmarks.gameInit.toFixed(2)}ms`);
            console.log(`单帧更新: ${benchmarks.singleFrame.toFixed(2)}ms`);
            console.log(`碰撞检测: ${benchmarks.collision.toFixed(2)}ms`);
            console.log(`渲染: ${benchmarks.rendering.toFixed(2)}ms`);

            // 所有基准测试都应该通过
            expect(benchmarks.gameInit).toBeLessThan(50);
            expect(benchmarks.singleFrame).toBeLessThan(16);
            expect(benchmarks.collision).toBeLessThan(10);
            expect(benchmarks.rendering).toBeLessThan(16);
        });
    });
});

// 如果在浏览器环境中，自动运行测试
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        setTimeout(() => testFramework.run(), 500);
    });
} else if (typeof module !== 'undefined') {
    module.exports = { testFramework };
}
