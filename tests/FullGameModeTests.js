/**
 * 全量模式回归测试（复现黑屏并验证修复）
 */

describe('完整游戏模式启动与渲染', () => {
    let mockGame, gameModeManager, endlessMode;

    beforeEach(() => {
        mockGame = createMock({
            eventSystem: createMock({ emit: () => {}, on: () => {}, off: () => {} }),
            ui: createMock({ updateObjectives: () => {}, hideModeSelection: () => {}, updateEndlessStats: () => {} }),
            waveManager: createMock({ clearEnemies: () => {} }),
            towerManager: createMock({ clearTowers: () => {} }),
            canvas: { width: 800, height: 600 },
            startGame: createSpy(() => { mockGame.gameStarted = true; })
        });

        endlessMode = new EndlessMode(mockGame);
        gameModeManager = new GameModeManager(mockGame);
        gameModeManager.endlessMode = endlessMode;
    });

    it('闯关模式启动时应触发 game.startGame 防止黑屏', () => {
        // 解锁第1关
        gameModeManager.completedLevels = [];
        const ok = gameModeManager.startAdventureMode(1);
        expect(ok).toBeTruthy();
        expect(mockGame.startGame.callCount).toBeGreaterThanOrEqual(1);
        expect(mockGame.gameStarted).toBeTruthy();
        expect(gameModeManager.currentMode).toBe('adventure');
    });

    it('无限模式启动时应触发 game.startGame 并显示UI', () => {
        const ok = gameModeManager.startEndlessMode('normal');
        expect(ok).toBeTruthy();
        expect(mockGame.startGame.callCount).toBeGreaterThanOrEqual(1);
        expect(mockGame.gameStarted).toBeTruthy();
        expect(gameModeManager.currentMode).toBe('endless');
    });

    it('无限模式应能推进波次并更新分数', () => {
        gameModeManager.startEndlessMode('normal');
        endlessMode.startNextWave();
        const initialScore = endlessMode.score;
        endlessMode.onEnemyKilled('basic');
        expect(endlessMode.score).toBeGreaterThan(initialScore);
    });
});


