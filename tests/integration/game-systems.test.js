/**
 * 游戏系统集成测试
 * 测试各个系统之间的交互和协作
 */

// 导入测试框架
if (typeof require !== 'undefined') {
    const { TestFramework, MockUtils } = require('../test-framework.js');
    global.TestFramework = TestFramework;
    global.MockUtils = MockUtils;
}

const testFramework = new TestFramework();
const { describe, it, expect, beforeEach, afterEach } = testFramework;

describe('游戏系统集成测试', () => {
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

    describe('玩家-敌人战斗系统集成', () => {
        it('完整的战斗流程应该正常工作', () => {
            // 1. 生成敌人
            game.spawnDragon();
            expect(game.dragons).toHaveLength(1);
            
            const dragon = game.dragons[0];
            const initialDragonHealth = dragon.health;
            const initialScore = game.score;
            const initialKills = game.kills;
            
            // 2. 玩家射击
            game.createBullet(dragon.x, dragon.y, 0, 0);
            expect(game.bullets).toHaveLength(1);
            
            // 3. 子弹击中敌人
            game.checkBulletDragonCollisions();
            
            // 4. 验证战斗结果
            expect(dragon.health).toBeLessThan(initialDragonHealth);
            expect(game.bullets).toHaveLength(0); // 子弹被消耗
            
            // 5. 如果敌人死亡，检查得分和击杀数
            if (dragon.health <= 0) {
                game.updateDragons(16); // 清理死亡敌人
                expect(game.dragons).toHaveLength(0);
                expect(game.score).toBeGreaterThan(initialScore);
                expect(game.kills).toBe(initialKills + 1);
            }
        });

        it('敌人攻击玩家应该正确处理', () => {
            game.spawnDragon();
            const dragon = game.dragons[0];
            const initialLives = game.lives;
            const initialHealth = game.player.health;
            
            // 将敌人移动到玩家位置
            dragon.x = game.player.x;
            dragon.y = game.player.y;
            
            // 检查碰撞
            game.checkPlayerDragonCollisions();
            
            // 验证玩家受到伤害
            expect(game.player.health < initialHealth || game.lives < initialLives).toBe(true);
        });

        it('玩家死亡应该正确处理游戏结束', () => {
            // 设置玩家为濒死状态
            game.lives = 1;
            game.player.health = 1;
            
            // 生成敌人并让其攻击玩家
            game.spawnDragon();
            const dragon = game.dragons[0];
            dragon.x = game.player.x;
            dragon.y = game.player.y;
            dragon.damage = 100; // 足以杀死玩家
            
            game.checkPlayerDragonCollisions();
            
            // 检查游戏是否结束
            expect(game.lives === 0 || game.gameOver).toBe(true);
        });
    });

    describe('技能系统与战斗系统集成', () => {
        beforeEach(() => {
            // 确保有足够的法力值
            game.skillSystem.resources.mana = game.skillSystem.resources.maxMana;
            game.skillSystem.cooldowns = {};
        });

        it('齐射技能应该与敌人碰撞检测正常工作', () => {
            // 生成多个敌人
            for (let i = 0; i < 5; i++) {
                game.spawnDragon();
            }
            
            const initialDragonCount = game.dragons.length;
            const initialBulletCount = game.bullets.length;
            
            // 激活齐射技能
            game.skillSystem.activateSkill('volley');
            
            // 验证子弹被创建
            expect(game.bullets.length).toBeGreaterThan(initialBulletCount);
            
            // 模拟子弹命中敌人
            game.dragons.forEach(dragon => {
                dragon.x = game.player.x + 50;
                dragon.y = game.player.y;
            });
            
            game.checkBulletDragonCollisions();
            
            // 验证敌人受到伤害
            let damagedDragons = 0;
            game.dragons.forEach(dragon => {
                if (dragon.health < dragon.maxHealth) {
                    damagedDragons++;
                }
            });
            
            expect(damagedDragons).toBeGreaterThan(0);
        });

        it('爆发射击技能应该增加射击频率', () => {
            const originalFireRate = game.fireRate;
            
            // 激活爆发射击
            game.skillSystem.activateSkill('burst');
            
            // 验证射击频率增加
            expect(game.fireRate).toBeLessThan(originalFireRate);
            
            // 模拟技能持续时间结束
            const duration = game.skillSystem.ACTIVE_SKILLS.burst.duration;
            game.skillSystem.updateActiveSkills(duration + 100);
            
            // 验证射击频率恢复
            expect(game.fireRate).toBe(originalFireRate);
        });

        it('护盾技能应该减少受到的伤害', () => {
            // 激活护盾
            game.skillSystem.activateSkill('shield');
            expect(game.player.shielded).toBe(true);
            
            // 生成敌人并攻击玩家
            game.spawnDragon();
            const dragon = game.dragons[0];
            dragon.x = game.player.x;
            dragon.y = game.player.y;
            
            const initialShieldHealth = game.player.shieldHealth;
            const initialPlayerHealth = game.player.health;
            
            game.checkPlayerDragonCollisions();
            
            // 护盾应该承受伤害，玩家血量不变或减少较少
            expect(game.player.shieldHealth).toBeLessThan(initialShieldHealth);
            expect(game.player.health).toBe(initialPlayerHealth);
        });

        it('治疗技能应该与玩家血量系统正确集成', () => {
            // 减少玩家血量
            game.player.health = 50;
            const initialHealth = game.player.health;
            
            // 激活治疗技能
            game.skillSystem.activateSkill('heal');
            
            // 验证血量恢复
            expect(game.player.health).toBeGreaterThan(initialHealth);
            expect(game.player.health).toBeLessThan(game.player.maxHealth + 1);
        });

        it('冰冻技能应该影响敌人AI和移动', () => {
            // 生成敌人
            game.spawnDragon();
            const dragon = game.dragons[0];
            
            // 设置敌人在玩家左侧
            dragon.x = game.player.x - 100;
            dragon.y = game.player.y;
            
            const originalSpeed = dragon.speed;
            
            // 激活冰冻技能
            game.skillSystem.activateSkill('freeze');
            
            // 验证敌人被冰冻
            expect(dragon.frozen).toBe(true);
            expect(dragon.speed).toBeLessThan(originalSpeed);
            
            // 更新敌人位置
            const initialX = dragon.x;
            game.updateDragons(16);
            
            // 验证敌人移动速度减慢
            const distanceMoved = Math.abs(dragon.x - initialX);
            expect(distanceMoved).toBeLessThan(originalSpeed * 0.016); // 16ms
        });
    });

    describe('得分系统与游戏进度集成', () => {
        it('击杀敌人应该增加得分和推进波次', () => {
            const initialScore = game.score;
            const initialWave = game.wave;
            const initialKills = game.kills;
            
            // 生成并击杀足够的敌人来推进波次
            const killsNeeded = game.killsForNextWave - game.kills;
            
            for (let i = 0; i < killsNeeded; i++) {
                game.spawnDragon();
                const dragon = game.dragons[game.dragons.length - 1];
                dragon.health = 1; // 设置为低血量
                
                // 创建子弹击杀敌人
                game.createBullet(dragon.x, dragon.y, 0, 0);
                game.checkBulletDragonCollisions();
                game.updateDragons(16); // 清理死亡敌人
            }
            
            // 检查波次推进
            game.checkWaveProgression();
            
            expect(game.score).toBeGreaterThan(initialScore);
            expect(game.kills).toBe(initialKills + killsNeeded);
            expect(game.wave).toBe(initialWave + 1);
        });

        it('波次推进应该增加敌人难度', () => {
            const initialWave = game.wave;
            
            // 推进到下一波
            game.kills = game.killsForNextWave;
            game.checkWaveProgression();
            
            expect(game.wave).toBe(initialWave + 1);
            
            // 生成新波次的敌人
            game.spawnDragon();
            const newWaveDragon = game.dragons[game.dragons.length - 1];
            
            // 验证敌人属性有所增强
            expect(newWaveDragon.health).toBeGreaterThan(50); // 基础血量应该有所提升
        });

        it('玩家升级应该增强属性', () => {
            const initialLevel = game.player.level;
            const initialDamage = game.player.damage;
            const initialHealth = game.player.maxHealth;
            
            // 给予足够的经验值升级
            game.player.experience = game.getExperienceForLevel(initialLevel + 1);
            game.checkPlayerLevelUp();
            
            expect(game.player.level).toBe(initialLevel + 1);
            expect(game.player.damage).toBeGreaterThan(initialDamage);
            expect(game.player.maxHealth).toBeGreaterThan(initialHealth);
        });
    });

    describe('UI系统与游戏状态集成', () => {
        it('UI应该正确反映游戏状态', () => {
            // 模拟UI更新
            const uiState = game.getUIState();
            
            expect(uiState).toHaveProperty('health');
            expect(uiState).toHaveProperty('maxHealth');
            expect(uiState).toHaveProperty('score');
            expect(uiState).toHaveProperty('lives');
            expect(uiState).toHaveProperty('wave');
            expect(uiState).toHaveProperty('level');
            expect(uiState).toHaveProperty('experience');
            
            expect(uiState.health).toBe(game.player.health);
            expect(uiState.maxHealth).toBe(game.player.maxHealth);
            expect(uiState.score).toBe(game.score);
            expect(uiState.lives).toBe(game.lives);
            expect(uiState.wave).toBe(game.wave);
        });

        it('技能UI应该正确反映技能状态', () => {
            // 激活一个技能
            game.skillSystem.activateSkill('volley');
            
            const skillsUI = game.skillSystem.getAllSkillsUIInfo();
            const volleySkill = skillsUI.find(skill => skill.id === 'volley');
            
            expect(volleySkill.ready).toBe(false);
            expect(volleySkill.cooldown).toBeGreaterThan(0);
        });

        it('法力值UI应该正确更新', () => {
            const initialMana = game.skillSystem.resources.mana;
            
            // 激活技能消耗法力值
            game.skillSystem.activateSkill('volley');
            
            const uiState = game.getUIState();
            expect(uiState.mana).toBeLessThan(initialMana);
            expect(uiState.maxMana).toBe(game.skillSystem.resources.maxMana);
        });
    });

    describe('音效系统与游戏事件集成', () => {
        it('游戏事件应该触发相应音效', () => {
            // 模拟音效播放监听
            let soundsPlayed = [];
            game.playSound = (soundName) => {
                soundsPlayed.push(soundName);
            };
            
            // 射击应该播放射击音效
            game.createBullet(400, 300, 1, 0);
            expect(soundsPlayed).toContain('shoot');
            
            soundsPlayed = [];
            
            // 敌人死亡应该播放死亡音效
            game.spawnDragon();
            const dragon = game.dragons[0];
            dragon.health = 1;
            
            game.createBullet(dragon.x, dragon.y, 0, 0);
            game.checkBulletDragonCollisions();
            
            expect(soundsPlayed).toContain('enemy_death');
        });
    });

    describe('粒子效果系统集成', () => {
        it('战斗事件应该创建粒子效果', () => {
            const initialParticleCount = game.particles.length;
            
            // 生成敌人并击杀
            game.spawnDragon();
            const dragon = game.dragons[0];
            dragon.health = 1;
            
            game.createBullet(dragon.x, dragon.y, 0, 0);
            game.checkBulletDragonCollisions();
            
            // 应该创建击中粒子效果
            expect(game.particles.length).toBeGreaterThan(initialParticleCount);
        });

        it('技能使用应该创建特效', () => {
            const initialParticleCount = game.particles.length;
            
            // 激活齐射技能
            game.skillSystem.activateSkill('volley');
            
            // 应该创建技能特效
            expect(game.particles.length).toBeGreaterThan(initialParticleCount);
        });
    });

    describe('存档系统集成', () => {
        it('应该能够保存和加载游戏状态', () => {
            // 修改游戏状态
            game.score = 1000;
            game.wave = 5;
            game.player.level = 3;
            game.player.experience = 500;
            
            // 保存游戏状态
            const saveData = game.getSaveData();
            
            expect(saveData).toHaveProperty('score');
            expect(saveData).toHaveProperty('wave');
            expect(saveData).toHaveProperty('playerLevel');
            expect(saveData).toHaveProperty('playerExperience');
            
            // 创建新游戏实例并加载存档
            const newGame = new DragonHunterGame(mockCanvas);
            newGame.loadSaveData(saveData);
            
            expect(newGame.score).toBe(1000);
            expect(newGame.wave).toBe(5);
            expect(newGame.player.level).toBe(3);
            expect(newGame.player.experience).toBe(500);
        });
    });

    describe('性能集成测试', () => {
        it('游戏循环应该在合理时间内完成', async () => {
            // 创建复杂的游戏场景
            for (let i = 0; i < 10; i++) {
                game.spawnDragon();
                game.createBullet(400 + i * 10, 300, 1, 0);
            }
            
            // 激活多个技能
            game.skillSystem.activateSkill('volley');
            game.skillSystem.activateSkill('burst');
            
            const result = await testFramework.benchmark(
                '复杂场景游戏循环',
                () => {
                    game.update(16);
                    game.render();
                },
                60 // 模拟1秒的游戏运行
            );
            
            expect(result.avg).toBeLessThan(16); // 应该在16ms内完成（60FPS）
        });

        it('大量对象的碰撞检测应该高效', async () => {
            // 创建大量游戏对象
            for (let i = 0; i < 50; i++) {
                game.spawnDragon();
            }
            for (let i = 0; i < 100; i++) {
                game.createBullet(400, 300, Math.random() - 0.5, Math.random() - 0.5);
            }
            
            const result = await testFramework.benchmark(
                '大量对象碰撞检测',
                () => {
                    game.checkBulletDragonCollisions();
                    game.checkPlayerDragonCollisions();
                },
                100
            );
            
            expect(result.avg).toBeLessThan(5); // 应该在5ms内完成
        });
    });

    describe('错误恢复和鲁棒性', () => {
        it('应该能够从异常状态恢复', () => {
            // 创建异常状态
            game.player.health = -100;
            game.score = -50;
            game.bullets = null;
            game.dragons = null;
            
            expect(() => {
                game.update(16);
                game.render();
            }).not.toThrow();
            
            // 验证游戏状态被修正
            expect(game.player.health).toBeGreaterThan(0);
            expect(game.score).toBeGreaterThan(0);
            expect(Array.isArray(game.bullets)).toBe(true);
            expect(Array.isArray(game.dragons)).toBe(true);
        });

        it('应该处理缺失的技能系统', () => {
            game.skillSystem = null;
            
            expect(() => {
                game.update(16);
                game.render();
            }).not.toThrow();
        });

        it('应该处理损坏的游戏对象', () => {
            // 添加损坏的游戏对象
            game.bullets.push(null);
            game.bullets.push({ x: null, y: undefined });
            game.dragons.push(null);
            game.dragons.push({ health: 'invalid' });
            
            expect(() => {
                game.update(16);
                game.checkBulletDragonCollisions();
            }).not.toThrow();
        });
    });

    describe('多线程和异步操作集成', () => {
        it('异步资源加载应该不影响游戏运行', async () => {
            let loadingComplete = false;
            
            // 模拟异步资源加载
            const loadPromise = new Promise(resolve => {
                setTimeout(() => {
                    loadingComplete = true;
                    resolve();
                }, 100);
            });
            
            // 游戏应该能够在资源加载期间正常运行
            for (let i = 0; i < 10; i++) {
                game.update(16);
                game.render();
                await new Promise(resolve => setTimeout(resolve, 10));
            }
            
            await loadPromise;
            expect(loadingComplete).toBe(true);
        });
    });
});

// 如果在浏览器环境中，自动运行测试
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        setTimeout(() => testFramework.run(), 300);
    });
} else if (typeof module !== 'undefined') {
    module.exports = { testFramework };
}
