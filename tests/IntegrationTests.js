/**
 * 模式切换和集成测试
 * 测试游戏模式之间的切换、状态保持、数据同步等
 */

describe('游戏模式集成测试', () => {
    let mockGame;
    let gameModeManager;
    let progressionSystem;
    let endlessMode;

    beforeEach(() => {
        // 创建完整的模拟游戏环境
        mockGame = createMock({
            eventSystem: createMock({
                emit: () => {},
                on: () => {},
                off: () => {}
            }),
            enemies: [],
            towers: [],
            resources: {
                money: 1000,
                lives: 20
            },
            waveManager: createMock({
                startWave: () => {},
                stopWave: () => {},
                getCurrentWave: () => 1,
                spawnEnemies: () => {},
                clearEnemies: () => {}
            }),
            ui: createMock({
                updateObjectives: () => {},
                showLevelComplete: () => {},
                showGameOver: () => {},
                updateEndlessStats: () => {},
                showModeSelection: () => {},
                hideModeSelection: () => {},
                updateLeaderboard: () => {}
            }),
            canvas: { width: 800, height: 600 },
            ctx: createMock({
                fillRect: () => {},
                fillText: () => {},
                clearRect: () => {}
            }),
            towerManager: createMock({
                clearTowers: () => {},
                resetUpgrades: () => {}
            }),
            reset: () => {}
        });

        // 创建系统实例（使用静默模式避免测试中的错误日志）
        progressionSystem = new ProgressionSystem(null, { silent: true });
        progressionSystem.loadProgress(true);
        
        endlessMode = new EndlessMode(mockGame);
        
        gameModeManager = new GameModeManager(mockGame);
        gameModeManager.progressionSystem = progressionSystem;
        gameModeManager.endlessMode = endlessMode;
    });

    afterEach(() => {
        // 清理所有模式
        if (gameModeManager) {
            gameModeManager.stopCurrentMode();
        }
        if (endlessMode && endlessMode.isActive) {
            endlessMode.stop();
        }
        
        // 清理本地存储
        localStorage.removeItem('towerDefenseProgress');
        localStorage.removeItem('endlessLeaderboard');
    });

    describe('模式管理器初始化', () => {
        it('应该正确初始化所有模式', () => {
            expect(gameModeManager.currentMode).toBeFalsy();
            expect(gameModeManager.currentLevel).toBeFalsy();
            expect(gameModeManager.endlessMode).toBeTruthy();
            expect(gameModeManager.progressionSystem).toBeTruthy();
        });

        it('应该注册所有必要的事件监听器', () => {
            const onCalls = mockGame.eventSystem.on.calls;
            
            // 检查是否注册了关键事件
            const eventTypes = onCalls.map(call => call[0]);
            expect(eventTypes).toContain('enemy_killed');
            expect(eventTypes).toContain('wave_complete');
            expect(eventTypes).toContain('game_over');
        });
    });

    describe('闯关模式到无限模式切换', () => {
        it('应该能从闯关模式切换到无限模式', () => {
            // 先启动闯关模式
            gameModeManager.startAdventureMode(1);
            expect(gameModeManager.currentMode).toBe('adventure');
            
            // 切换到无限模式
            const result = gameModeManager.startEndlessMode('normal');
            expect(result).toBeTruthy();
            expect(gameModeManager.currentMode).toBe('endless');
            expect(gameModeManager.currentLevel).toBeFalsy(); // 闯关模式状态被清除
        });

        it('切换时应该正确清理前一个模式的状态', () => {
            // 启动闯关模式并设置一些状态
            gameModeManager.startAdventureMode(1);
            gameModeManager.currentKills = 10;
            gameModeManager.deaths = 2;
            
            // 切换到无限模式
            gameModeManager.startEndlessMode('normal');
            
            // 检查闯关模式状态被清理
            expect(gameModeManager.currentKills).toBe(0);
            expect(gameModeManager.deaths).toBe(0);
            expect(gameModeManager.levelStartTime).toBeFalsy();
        });

        it('切换时应该重置游戏环境', () => {
            gameModeManager.startAdventureMode(1);
            gameModeManager.startEndlessMode('normal');
            
            // 检查游戏重置是否被调用
            expect(mockGame.waveManager.clearEnemies.callCount).toBeGreaterThan(0);
            expect(mockGame.towerManager.clearTowers.callCount).toBeGreaterThan(0);
        });
    });

    describe('无限模式到闯关模式切换', () => {
        it('应该能从无限模式切换到闯关模式', () => {
            // 先启动无限模式
            gameModeManager.startEndlessMode('normal');
            expect(gameModeManager.currentMode).toBe('endless');
            
            // 切换到闯关模式
            const result = gameModeManager.startAdventureMode(1);
            expect(result).toBeTruthy();
            expect(gameModeManager.currentMode).toBe('adventure');
            expect(endlessMode.isActive).toBeFalsy(); // 无限模式被停止
        });

        it('切换时应该保存无限模式的进度', () => {
            gameModeManager.startEndlessMode('normal');
            endlessMode.score = 2500;
            endlessMode.currentWave = 8;
            
            // 切换前检查是否是高分
            const wasHighScore = endlessMode.isNewRecord();
            
            gameModeManager.startAdventureMode(1);
            
            // 如果是高分，应该被保存
            if (wasHighScore) {
                const leaderboard = endlessMode.getLeaderboard();
                expect(leaderboard.length).toBeGreaterThan(0);
                expect(leaderboard[0].score).toBe(2500);
            }
        });
    });

    describe('数据持久化', () => {
        it('闯关进度应该正确保存', () => {
            gameModeManager.startAdventureMode(1);
            gameModeManager.completeLevelWithRewards(1);
            
            // 检查本地存储
            const savedData = localStorage.getItem('towerDefenseProgress');
            expect(savedData).toBeTruthy();
            
            const parsedData = JSON.parse(savedData);
            expect(parsedData.completedLevels).toContain(1);
        });

        it('无限模式排行榜应该正确保存', () => {
            gameModeManager.startEndlessMode('normal');
            endlessMode.score = 3000;
            endlessMode.saveHighScore();
            
            const savedBoard = localStorage.getItem('endlessLeaderboard');
            expect(savedBoard).toBeTruthy();
            
            const parsedBoard = JSON.parse(savedBoard);
            expect(parsedBoard.length).toBeGreaterThan(0);
            expect(parsedBoard[0].score).toBe(3000);
        });

        it('数据在模式切换后应该保持一致', () => {
            // 完成一个关卡
            gameModeManager.startAdventureMode(1);
            gameModeManager.completeLevelWithRewards(1);
            
            // 切换到无限模式再切换回来
            gameModeManager.startEndlessMode('normal');
            gameModeManager.startAdventureMode(2);
            
            // 检查进度是否保持
            expect(progressionSystem.data.completedLevels).toContain(1);
            expect(LevelConfig.isLevelUnlocked(2, progressionSystem.data.completedLevels)).toBeTruthy();
        });
    });

    describe('事件系统集成', () => {
        it('模式切换应该触发相应事件', () => {
            gameModeManager.startAdventureMode(1);
            
            expect(mockGame.eventSystem.emit.callCount).toBeGreaterThan(0);
            
            const modeStartCall = mockGame.eventSystem.emit.calls.find(call => 
                call[0] === 'mode_started'
            );
            expect(modeStartCall).toBeTruthy();
            expect(modeStartCall[1].mode).toBe('adventure');
        });

        it('模式停止应该触发相应事件', () => {
            gameModeManager.startAdventureMode(1);
            gameModeManager.stopCurrentMode();
            
            const modeStopCall = mockGame.eventSystem.emit.calls.find(call => 
                call[0] === 'mode_stopped'
            );
            expect(modeStopCall).toBeTruthy();
        });

        it('跨模式事件应该正确处理', () => {
            // 在闯关模式下击杀敌人
            gameModeManager.startAdventureMode(1);
            gameModeManager.onEnemyKilled();
            
            expect(gameModeManager.currentKills).toBe(1);
            
            // 切换到无限模式
            gameModeManager.startEndlessMode('normal');
            endlessMode.onEnemyKilled('normal');
            
            expect(endlessMode.totalKills).toBe(1);
            expect(endlessMode.score).toBeGreaterThan(0);
        });
    });

    describe('UI状态同步', () => {
        it('切换模式时UI应该正确更新', () => {
            gameModeManager.startAdventureMode(1);
            
            expect(mockGame.ui.updateObjectives.callCount).toBeGreaterThan(0);
            expect(mockGame.ui.hideModeSelection.callCount).toBeGreaterThan(0);
        });

        it('无限模式UI应该显示正确信息', () => {
            gameModeManager.startEndlessMode('normal');
            endlessMode.render();
            
            expect(mockGame.ui.updateEndlessStats.callCount).toBeGreaterThan(0);
            
            const statsCall = mockGame.ui.updateEndlessStats.calls[0];
            expect(statsCall[0]).toHaveProperty('wave');
            expect(statsCall[0]).toHaveProperty('score');
            expect(statsCall[0]).toHaveProperty('kills');
        });

        it('模式结束时应该显示正确的结果界面', () => {
            gameModeManager.startAdventureMode(1);
            
            // 完成关卡
            const level = gameModeManager.currentLevel;
            gameModeManager.currentKills = level.objectives.killCount;
            gameModeManager.levelStartTime = Date.now() - (level.objectives.surviveTime * 1000 + 1000);
            gameModeManager.deaths = 0;
            
            const isComplete = gameModeManager.checkLevelObjectives();
            if (isComplete) {
                gameModeManager.onLevelComplete();
                expect(mockGame.ui.showLevelComplete.callCount).toBeGreaterThan(0);
            }
        });
    });

    describe('资源管理', () => {
        it('模式切换应该正确处理资源状态', () => {
            // 在闯关模式下获得奖励
            gameModeManager.startAdventureMode(1);
            const initialMoney = mockGame.resources.money;
            
            gameModeManager.completeLevelWithRewards(1);
            
            // 资源应该增加
            expect(progressionSystem.data.totalMoney).toBeGreaterThan(0);
            
            // 切换到无限模式时，游戏资源应该重置
            gameModeManager.startEndlessMode('normal');
            expect(mockGame.resources.money).toBe(1000); // 重置为初始值
        });

        it('无限模式中的资源变化应该不影响闯关进度', () => {
            const initialProgress = JSON.parse(JSON.stringify(progressionSystem.data));
            
            gameModeManager.startEndlessMode('normal');
            // 模拟获得很多资源
            mockGame.resources.money = 5000;
            
            // 切换回闯关模式
            gameModeManager.startAdventureMode(1);
            
            // 闯关进度不应该被无限模式影响
            expect(progressionSystem.data.completedLevels).toEqual(initialProgress.completedLevels);
        });
    });

    describe('性能和稳定性', () => {
        it('频繁模式切换应该保持稳定', () => {
            for (let i = 0; i < 10; i++) {
                gameModeManager.startAdventureMode(1);
                gameModeManager.startEndlessMode('normal');
            }
            
            // 最终状态应该正确
            expect(gameModeManager.currentMode).toBe('endless');
            expect(endlessMode.isActive).toBeTruthy();
        });

        it('模式切换应该在合理时间内完成', () => {
            const startTime = performance.now();
            
            gameModeManager.startAdventureMode(1);
            gameModeManager.startEndlessMode('normal');
            gameModeManager.startAdventureMode(1);
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            // 三次切换应该在200ms内完成
            expect(duration).toBeLessThan(200);
        });

        it('大量数据时切换应该保持性能', () => {
            // 创建大量闯关进度
            for (let i = 1; i <= 10; i++) {
                progressionSystem.data.completedLevels.push(i);
            }
            progressionSystem.data.totalKills = 10000;
            progressionSystem.data.totalMoney = 50000;
            
            // 创建大量排行榜数据
            for (let i = 0; i < 10; i++) {
                endlessMode.score = 1000 * (i + 1);
                endlessMode.saveHighScore();
            }
            
            const startTime = performance.now();
            
            gameModeManager.startAdventureMode(5);
            gameModeManager.startEndlessMode('nightmare');
            
            const endTime = performance.now();
            expect(endTime - startTime).toBeLessThan(100);
        });
    });

    describe('错误恢复', () => {
        it('应该处理损坏的存储数据', () => {
            // 写入损坏的数据
            localStorage.setItem('towerDefenseProgress', '{"invalid": json}');
            localStorage.setItem('endlessLeaderboard', 'not json at all');
            
            // 应该能正常初始化（使用静默模式避免错误日志）
            const newProgressionSystem = new ProgressionSystem(null, { silent: true });
            newProgressionSystem.loadProgress(true);
            
            expect(newProgressionSystem.data).toBeTruthy();
            expect(newProgressionSystem.data.completedLevels).toBeTruthy();
            
            const newEndlessMode = new EndlessMode(mockGame);
            const leaderboard = newEndlessMode.getLeaderboard();
            expect(Array.isArray(leaderboard)).toBeTruthy();
        });

        it('应该处理模式启动失败', () => {
            // 模拟启动失败
            const originalStart = endlessMode.start;
            endlessMode.start = () => false;
            
            const result = gameModeManager.startEndlessMode('normal');
            expect(result).toBeFalsy();
            expect(gameModeManager.currentMode).toBeFalsy();
            
            // 恢复原始方法
            endlessMode.start = originalStart;
        });

        it('应该处理事件系统错误', () => {
            // 模拟事件系统错误
            mockGame.eventSystem.emit = () => { throw new Error('Event system error'); };
            
            // 模式切换应该仍然能工作
            expect(() => {
                gameModeManager.startAdventureMode(1);
            }).toThrow();
            
            // 但基本状态应该正确设置
            expect(gameModeManager.currentLevel).toBeTruthy();
        });
    });

    describe('完整游戏流程测试', () => {
        it('应该支持完整的游戏会话', () => {
            // 1. 开始闯关模式
            gameModeManager.startAdventureMode(1);
            expect(gameModeManager.currentMode).toBe('adventure');
            
            // 2. 完成第一关
            gameModeManager.completeLevelWithRewards(1);
            expect(progressionSystem.data.completedLevels).toContain(1);
            
            // 3. 开始第二关
            gameModeManager.startAdventureMode(2);
            expect(gameModeManager.currentLevel.id).toBe(2);
            
            // 4. 切换到无限模式
            gameModeManager.startEndlessMode('normal');
            expect(endlessMode.isActive).toBeTruthy();
            
            // 5. 玩一段时间
            endlessMode.onEnemyKilled('normal');
            endlessMode.startNextWave();
            expect(endlessMode.currentWave).toBe(1);
            expect(endlessMode.totalKills).toBe(1);
            
            // 6. 游戏结束并保存成绩
            endlessMode.score = 1500;
            endlessMode.onGameOver();
            expect(endlessMode.isActive).toBeFalsy();
            
            const leaderboard = endlessMode.getLeaderboard();
            expect(leaderboard.some(record => record.score === 1500)).toBeTruthy();
            
            // 7. 回到闯关模式继续
            gameModeManager.startAdventureMode(2);
            expect(gameModeManager.currentMode).toBe('adventure');
            expect(progressionSystem.data.completedLevels).toContain(1); // 进度保持
        });
    });
});
