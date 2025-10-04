/**
 * 无限模式单元测试
 * 测试无限波次、难度递增、特殊事件、排行榜等核心功能
 */

// 加载测试依赖
if (typeof require !== 'undefined') {
    require('./test-dependencies.js');
}

describe('无限模式测试', () => {
    let mockGame;
    let endlessMode;

    beforeEach(() => {
        // 检查依赖是否可用
        if (typeof TestDependencies !== 'undefined' && !TestDependencies.checkDependencies()) {
            console.warn('Some test dependencies are missing');
        }

        // 创建模拟游戏实例
        mockGame = createMock({
            eventSystem: createMock({
                emit: () => {},
                on: () => {},
                off: () => {}
            }),
            enemies: [],
            towers: [],
            resources: {
                tokens: 1000,
                lives: 20
            },
            shopSystem: {
                currency: 1000,
                addCurrency(amount) {
                    this.currency += amount;
                }
            },
            waveManager: createMock({
                startWave: () => {},
                stopWave: () => {},
                getCurrentWave: () => 1,
                spawnEnemies: () => {}
            }),
            ui: createMock({
                updateEndlessStats: () => {},
                showSpecialEvent: () => {},
                updateLeaderboard: () => {}
            }),
            canvas: {
                width: 800,
                height: 600
            },
            ctx: createMock({
                fillRect: () => {},
                fillText: () => {},
                strokeRect: () => {}
            })
        });

        // 创建无限模式实例
        try {
            if (typeof TestDependencies !== 'undefined') {
                endlessMode = TestDependencies.createEndlessMode(mockGame);
            } else if (typeof EndlessMode !== 'undefined') {
                endlessMode = new EndlessMode(mockGame);
            } else {
                // 创建一个基本的模拟实例
                endlessMode = createMock({
                    isActive: false,
                    difficulty: 'normal',
                    difficultyConfig: {
                        normal: { enemyHealthMultiplier: 1.0, enemySpeedMultiplier: 1.0 },
                        hard: { enemyHealthMultiplier: 1.5, enemySpeedMultiplier: 1.2 },
                        nightmare: { enemyHealthMultiplier: 2.0, enemySpeedMultiplier: 1.5 }
                    },
                    score: 0,
                    currentWave: 1,
                    survivalTime: 0,
                    start: () => true,
                    stop: () => {},
                    update: () => {},
                    render: () => {},
                    onEnemyKilled: () => {},
                    calculateWaveStats: () => ({ enemyCount: 5, enemyTypes: ['basic'] }),
                    saveHighScore: () => {},
                    getLeaderboard: () => []
                });
            }
        } catch (error) {
            console.warn('Failed to create EndlessMode:', error.message);
            endlessMode = createMock({
                isActive: false,
                difficulty: 'normal',
                difficultyConfig: {
                    normal: { enemyHealthMultiplier: 1.0, enemySpeedMultiplier: 1.0 },
                    hard: { enemyHealthMultiplier: 1.5, enemySpeedMultiplier: 1.2 },
                    nightmare: { enemyHealthMultiplier: 2.0, enemySpeedMultiplier: 1.5 }
                },
                score: 0,
                currentWave: 1,
                survivalTime: 0,
                start: () => true,
                stop: () => {},
                update: () => {},
                render: () => {},
                onEnemyKilled: () => {},
                calculateWaveStats: () => ({ enemyCount: 5, enemyTypes: ['basic'] }),
                saveHighScore: () => {},
                getLeaderboard: () => []
            });
        }
    });

    afterEach(() => {
        // 清理测试环境
        if (endlessMode && endlessMode.isActive) {
            endlessMode.stop();
        }
        localStorage.removeItem('endlessLeaderboard');
    });

    describe('无限模式初始化', () => {
        it('应该正确初始化默认状态', () => {
            expect(endlessMode.isActive).toBeFalsy();
            expect(endlessMode.currentWave).toBe(0);
            expect(endlessMode.totalKills).toBe(0);
            expect(endlessMode.score).toBe(0);
            expect(endlessMode.difficulty).toBe('normal');
        });

        it('应该包含所有难度配置', () => {
            expect(endlessMode.difficultyConfig).toHaveProperty('normal');
            expect(endlessMode.difficultyConfig).toHaveProperty('hard');
            expect(endlessMode.difficultyConfig).toHaveProperty('nightmare');
        });

        it('每个难度都应该有完整的配置', () => {
            const difficulties = ['normal', 'hard', 'nightmare'];
            
            difficulties.forEach(difficulty => {
                const config = endlessMode.difficultyConfig[difficulty];
                
                expect(config).toHaveProperty('healthMultiplier');
                expect(config).toHaveProperty('speedMultiplier');
                expect(config).toHaveProperty('damageMultiplier');
                expect(config).toHaveProperty('countMultiplier');
                expect(config).toHaveProperty('bossFrequency');
                expect(config).toHaveProperty('specialEnemyChance');
                
                // 检查数值合理性
                expect(config.healthMultiplier).toBeGreaterThan(1);
                expect(config.speedMultiplier).toBeGreaterThan(1);
                expect(config.bossFrequency).toBeGreaterThan(0);
            });
        });

        it('难度应该递增', () => {
            const normal = endlessMode.difficultyConfig.normal;
            const hard = endlessMode.difficultyConfig.hard;
            const nightmare = endlessMode.difficultyConfig.nightmare;
            
            expect(hard.healthMultiplier).toBeGreaterThan(normal.healthMultiplier);
            expect(nightmare.healthMultiplier).toBeGreaterThan(hard.healthMultiplier);
            
            expect(hard.damageMultiplier).toBeGreaterThan(normal.damageMultiplier);
            expect(nightmare.damageMultiplier).toBeGreaterThan(hard.damageMultiplier);
        });
    });

    describe('模式启动和停止', () => {
        it('应该能够启动无限模式', () => {
            const result = endlessMode.start('normal');
            
            expect(result).toBeTruthy();
            expect(endlessMode.isActive).toBeTruthy();
            expect(endlessMode.difficulty).toBe('normal');
            expect(endlessMode.startTime).toBeTruthy();
        });

        it('应该能够停止无限模式', () => {
            endlessMode.start('normal');
            endlessMode.stop();
            
            expect(endlessMode.isActive).toBeFalsy();
        });

        it('重复启动应该重置状态', () => {
            endlessMode.start('normal');
            endlessMode.currentWave = 5;
            endlessMode.score = 1000;
            
            endlessMode.start('hard');
            
            expect(endlessMode.currentWave).toBe(0);
            expect(endlessMode.score).toBe(0);
            expect(endlessMode.difficulty).toBe('hard');
        });

        it('应该正确处理无效难度', () => {
            const result = endlessMode.start('invalid');
            
            expect(result).toBeFalsy();
            expect(endlessMode.isActive).toBeFalsy();
        });
    });

    describe('波次管理', () => {
        beforeEach(() => {
            endlessMode.start('normal');
        });

        it('应该正确开始下一波', () => {
            const initialWave = endlessMode.currentWave;
            endlessMode.startNextWave();
            
            expect(endlessMode.currentWave).toBe(initialWave + 1);
        });

        it('应该根据波次计算敌人属性', () => {
            const baseStats = { health: 100, speed: 1, damage: 10, count: 5 };
            
            // 第1波
            const wave1Stats = endlessMode.calculateWaveStats(1, baseStats);
            expect(wave1Stats.health).toBe(baseStats.health);
            
            // 第5波应该有更高的属性
            const wave5Stats = endlessMode.calculateWaveStats(5, baseStats);
            expect(wave5Stats.health).toBeGreaterThan(wave1Stats.health);
            expect(wave5Stats.speed).toBeGreaterThan(wave1Stats.speed);
            expect(wave5Stats.count).toBeGreaterThan(wave1Stats.count);
        });

        it('Boss波次应该正确识别', () => {
            const normalFreq = endlessMode.difficultyConfig.normal.bossFrequency;
            
            expect(endlessMode.isBossWave(normalFreq)).toBeTruthy();
            expect(endlessMode.isBossWave(normalFreq * 2)).toBeTruthy();
            expect(endlessMode.isBossWave(normalFreq - 1)).toBeFalsy();
        });

        it('应该正确生成敌人配置', () => {
            const waveConfig = endlessMode.generateWaveEnemies(5);
            
            expect(waveConfig).toBeTruthy();
            expect(waveConfig.length).toBeGreaterThan(0);
            
            waveConfig.forEach(enemy => {
                expect(enemy).toHaveProperty('type');
                expect(enemy).toHaveProperty('count');
                expect(enemy).toHaveProperty('health');
                expect(enemy).toHaveProperty('speed');
            });
        });
    });

    describe('计分系统', () => {
        beforeEach(() => {
            endlessMode.start('normal');
        });

        it('应该正确计算击杀得分', () => {
            const initialScore = endlessMode.score;
            endlessMode.onEnemyKilled('normal');
            
            const expectedScore = initialScore + endlessMode.scoreMultipliers.kill;
            expect(endlessMode.score).toBe(expectedScore);
            expect(endlessMode.totalKills).toBe(1);
        });

        it('Boss击杀应该给予更多分数', () => {
            const initialScore = endlessMode.score;
            endlessMode.onEnemyKilled('boss');
            
            const expectedScore = initialScore + endlessMode.scoreMultipliers.bossKill;
            expect(endlessMode.score).toBe(expectedScore);
        });

        it('应该正确计算波次完成奖励', () => {
            const initialScore = endlessMode.score;
            endlessMode.onWaveComplete();
            
            const expectedScore = initialScore + endlessMode.scoreMultipliers.waveComplete;
            expect(endlessMode.score).toBe(expectedScore);
        });

        it('连击系统应该正确工作', () => {
            // 快速连续击杀
            endlessMode.onEnemyKilled('normal');
            endlessMode.onEnemyKilled('normal');
            
            expect(endlessMode.killCombo).toBe(2);
            
            // 等待连击重置（模拟时间过去）
            endlessMode.lastKillTime = Date.now() - 6000; // 6秒前
            endlessMode.onEnemyKilled('normal');
            
            expect(endlessMode.killCombo).toBe(1); // 应该重置
        });

        it('应该正确计算生存时间奖励', () => {
            endlessMode.startTime = Date.now() - 10000; // 10秒前开始
            const survivalScore = endlessMode.calculateSurvivalBonus();
            
            expect(survivalScore).toBeGreaterThan(8); // 至少8分
            expect(survivalScore).toBeLessThan(12);   // 最多12分
        });
    });

    describe('特殊事件系统', () => {
        beforeEach(() => {
            endlessMode.start('normal');
        });

        it('应该包含所有特殊事件类型', () => {
            expect(endlessMode.specialEvents).toHaveProperty('lightning_storm');
            expect(endlessMode.specialEvents).toHaveProperty('time_warp');
            expect(endlessMode.specialEvents).toHaveProperty('blessing_rain');
        });

        it('每个特殊事件都应该有完整配置', () => {
            Object.values(endlessMode.specialEvents).forEach(event => {
                expect(event).toHaveProperty('name');
                expect(event).toHaveProperty('description');
                expect(event).toHaveProperty('duration');
                expect(event).toHaveProperty('effect');
                expect(event).toHaveProperty('probability');
                
                expect(typeof event.effect).toBe('function');
                expect(event.duration).toBeGreaterThan(0);
            });
        });

        it('应该能够触发特殊事件', () => {
            // 强制触发事件
            endlessMode.triggerSpecialEvent('lightning_storm');
            
            expect(endlessMode.activeEvent).toBeTruthy();
            expect(endlessMode.activeEvent.type).toBe('lightning_storm');
        });

        it('事件应该在持续时间后结束', () => {
            endlessMode.triggerSpecialEvent('lightning_storm');
            const event = endlessMode.activeEvent;
            
            // 模拟时间过去
            event.startTime = Date.now() - (event.duration + 1000);
            endlessMode.updateSpecialEvent();
            
            expect(endlessMode.activeEvent).toBeFalsy();
        });

        it('雷电风暴事件应该造成伤害', () => {
            const originalDamageEnemies = endlessMode.damageAllEnemies;
            const damageSpy = createSpy();
            endlessMode.damageAllEnemies = damageSpy;
            
            endlessMode.triggerSpecialEvent('lightning_storm');
            endlessMode.updateSpecialEvent(); // 触发效果
            
            expect(damageSpy.callCount).toBeGreaterThan(0);
            
            endlessMode.damageAllEnemies = originalDamageEnemies;
        });

        it('时间扭曲事件应该减慢敌人', () => {
            const originalSlowEnemies = endlessMode.slowAllEnemies;
            const slowSpy = createSpy();
            endlessMode.slowAllEnemies = slowSpy;
            
            endlessMode.triggerSpecialEvent('time_warp');
            endlessMode.updateSpecialEvent();
            
            expect(slowSpy.callCount).toBeGreaterThan(0);
            
            endlessMode.slowAllEnemies = originalSlowEnemies;
        });

        it('祝福之雨事件应该给予奖励', () => {
            const initialTokens = mockGame.shopSystem.currency;

            endlessMode.triggerSpecialEvent('blessing_rain');
            endlessMode.updateSpecialEvent();

            expect(mockGame.shopSystem.currency).toBeGreaterThan(initialTokens);
        });
    });

    describe('排行榜系统', () => {
        it('应该正确保存高分记录', () => {
            endlessMode.score = 5000;
            endlessMode.currentWave = 15;
            endlessMode.totalKills = 150;
            
            endlessMode.saveHighScore();
            
            const leaderboard = endlessMode.getLeaderboard();
            expect(leaderboard.length).toBeGreaterThan(0);
            
            const latestScore = leaderboard[0];
            expect(latestScore.score).toBe(5000);
            expect(latestScore.wave).toBe(15);
            expect(latestScore.kills).toBe(150);
        });

        it('应该按分数排序排行榜', () => {
            // 添加多个分数
            endlessMode.score = 1000;
            endlessMode.saveHighScore();
            
            endlessMode.score = 3000;
            endlessMode.saveHighScore();
            
            endlessMode.score = 2000;
            endlessMode.saveHighScore();
            
            const leaderboard = endlessMode.getLeaderboard();
            
            expect(leaderboard[0].score).toBe(3000);
            expect(leaderboard[1].score).toBe(2000);
            expect(leaderboard[2].score).toBe(1000);
        });

        it('应该限制排行榜条目数量', () => {
            // 添加大量记录
            for (let i = 0; i < 15; i++) {
                endlessMode.score = i * 100;
                endlessMode.saveHighScore();
            }
            
            const leaderboard = endlessMode.getLeaderboard();
            expect(leaderboard.length).toBeLessThanOrEqual(10); // 最多10条记录
        });

        it('应该正确检测新纪录', () => {
            // 清空排行榜
            localStorage.removeItem('endlessLeaderboard');
            
            endlessMode.score = 1000;
            const isNewRecord1 = endlessMode.isNewRecord();
            expect(isNewRecord1).toBeTruthy(); // 第一个记录总是新纪录
            
            endlessMode.saveHighScore();
            
            endlessMode.score = 500;
            const isNewRecord2 = endlessMode.isNewRecord();
            expect(isNewRecord2).toBeFalsy(); // 分数更低，不是新纪录
            
            endlessMode.score = 2000;
            const isNewRecord3 = endlessMode.isNewRecord();
            expect(isNewRecord3).toBeTruthy(); // 分数更高，是新纪录
        });
    });

    describe('状态更新和渲染', () => {
        beforeEach(() => {
            endlessMode.start('normal');
        });

        it('应该正确更新生存时间', () => {
            endlessMode.startTime = Date.now() - 5000; // 5秒前
            endlessMode.update();
            
            expect(endlessMode.survivalTime).toBeGreaterThan(4);
            expect(endlessMode.survivalTime).toBeLessThan(6);
        });

        it('应该定期更新分数', () => {
            const initialScore = endlessMode.score;
            endlessMode.startTime = Date.now() - 5000;
            endlessMode.update();
            
            // 生存奖励应该被添加
            expect(endlessMode.score).toBeGreaterThan(initialScore);
        });

        it('应该渲染统计信息', () => {
            endlessMode.render();
            
            // 检查UI更新是否被调用
            expect(mockGame.ui.updateEndlessStats.callCount).toBeGreaterThan(0);
        });

        it('渲染时应该显示当前状态', () => {
            endlessMode.currentWave = 5;
            endlessMode.score = 1500;
            endlessMode.totalKills = 50;
            
            endlessMode.render();
            
            const statsCall = mockGame.ui.updateEndlessStats.calls[0];
            expect(statsCall).toBeTruthy();
            
            const stats = statsCall[0];
            expect(stats.wave).toBe(5);
            expect(stats.score).toBe(1500);
            expect(stats.kills).toBe(50);
        });
    });

    describe('游戏结束处理', () => {
        beforeEach(() => {
            endlessMode.start('normal');
        });

        it('应该正确处理游戏结束', () => {
            endlessMode.score = 2500;
            endlessMode.currentWave = 12;
            
            endlessMode.onGameOver();
            
            expect(endlessMode.isActive).toBeFalsy();
            
            // 检查是否尝试保存高分
            const leaderboard = endlessMode.getLeaderboard();
            expect(leaderboard.length).toBeGreaterThan(0);
        });

        it('新纪录时应该触发特殊事件', () => {
            // 清空排行榜确保是新纪录
            localStorage.removeItem('endlessLeaderboard');
            
            endlessMode.score = 5000;
            endlessMode.onGameOver();
            
            expect(mockGame.eventSystem.emit.callCount).toBeGreaterThan(0);
            
            const newRecordCall = mockGame.eventSystem.emit.calls.find(call => 
                call[0] === 'new_endless_record'
            );
            expect(newRecordCall).toBeTruthy();
        });
    });

    describe('性能测试', () => {
        it('模式启动应该高效', () => {
            const startTime = performance.now();
            
            endlessMode.start('normal');
            
            const endTime = performance.now();
            expect(endTime - startTime).toBeLessThan(50); // 50ms内完成
        });

        it('更新循环应该高效', () => {
            endlessMode.start('normal');
            
            const startTime = performance.now();
            
            // 运行多次更新
            for (let i = 0; i < 100; i++) {
                endlessMode.update();
            }
            
            const endTime = performance.now();
            expect(endTime - startTime).toBeLessThan(100); // 100次更新在100ms内
        });

        it('大波次计算应该保持高效', () => {
            const startTime = performance.now();
            
            // 计算高波次的敌人属性
            for (let wave = 1; wave <= 100; wave++) {
                endlessMode.calculateWaveStats(wave, { health: 100, speed: 1, damage: 10, count: 5 });
            }
            
            const endTime = performance.now();
            expect(endTime - startTime).toBeLessThan(50);
        });
    });

    describe('边界条件测试', () => {
        it('应该处理极大的波次数', () => {
            const largeWave = 1000;
            const stats = endlessMode.calculateWaveStats(largeWave, { health: 100, speed: 1, damage: 10, count: 5 });
            
            // 确保数值不会溢出或变成NaN
            expect(isNaN(stats.health)).toBeFalsy();
            expect(isNaN(stats.speed)).toBeFalsy();
            expect(stats.health).toBeGreaterThan(0);
            expect(stats.speed).toBeGreaterThan(0);
        });

        it('应该处理零值输入', () => {
            const stats = endlessMode.calculateWaveStats(1, { health: 0, speed: 0, damage: 0, count: 0 });
            
            expect(stats.health).toBeGreaterThanOrEqual(0);
            expect(stats.speed).toBeGreaterThanOrEqual(0);
        });

        it('应该处理负值波次', () => {
            const stats = endlessMode.calculateWaveStats(-1, { health: 100, speed: 1, damage: 10, count: 5 });
            
            // 应该使用默认值或基础值
            expect(stats.health).toBeGreaterThan(0);
            expect(stats.speed).toBeGreaterThan(0);
        });
    });

    describe('事件系统集成', () => {
        beforeEach(() => {
            endlessMode.start('normal');
        });

        it('应该正确发送波次开始事件', () => {
            endlessMode.startNextWave();
            
            expect(mockGame.eventSystem.emit.callCount).toBeGreaterThan(0);
            
            const waveStartCall = mockGame.eventSystem.emit.calls.find(call => 
                call[0] === 'endless_wave_start'
            );
            expect(waveStartCall).toBeTruthy();
        });

        it('应该正确发送击杀事件', () => {
            endlessMode.onEnemyKilled('normal');
            
            const killCall = mockGame.eventSystem.emit.calls.find(call => 
                call[0] === 'endless_enemy_killed'
            );
            expect(killCall).toBeTruthy();
        });

        it('应该正确发送特殊事件通知', () => {
            endlessMode.triggerSpecialEvent('lightning_storm');
            
            const eventCall = mockGame.eventSystem.emit.calls.find(call => 
                call[0] === 'endless_special_event'
            );
            expect(eventCall).toBeTruthy();
        });
    });
});
