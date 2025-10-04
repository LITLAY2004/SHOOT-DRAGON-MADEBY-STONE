/**
 * 测试修复补丁
 * 为缺失的依赖提供mock实现
 */

// 全局mock对象工厂
function createSafeMock(properties = {}) {
    const mock = {
        calls: [],
        callCount: 0,
        calledOnce: false,
        calledWith: () => false,
        ...properties
    };

    // 为所有方法添加调用跟踪
    Object.keys(mock).forEach(key => {
        if (typeof mock[key] === 'function') {
            const originalFn = mock[key];
            mock[key] = function(...args) {
                mock.calls.push(args);
                mock.callCount++;
                mock.calledOnce = mock.callCount === 1;
                mock.calledWith = (expectedArg) => {
                    return mock.calls.some(call => call[0] === expectedArg);
                };
                return originalFn.apply(this, args);
            };
        }
    });

    return mock;
}

// 安全的LevelConfig mock
const LevelConfigMock = {
    GAME_MODES: {
        ADVENTURE: 'adventure',
        ENDLESS: 'endless',
        SURVIVAL: 'survival'
    },
    
    ADVENTURE_LEVELS: {
        1: {
            id: 1,
            name: "新手试炼",
            description: "学习基本操作",
            difficulty: "easy",
            objectives: {
                killCount: 10,
                surviveTime: 60,
                maxDeaths: 3,
                specialConditions: []
            },
            rewards: {
                tokens: 50,
                experience: 100,
                skillPoints: 1,
                unlocksLevel: 2
            },
            enemyWaves: {
                spawnRate: 2000,
                maxConcurrent: 3,
                types: ['basic'],
                totalWaves: 3
            }
        },
        2: {
            id: 2,
            name: "元素觉醒",
            description: "掌握元素技能",
            difficulty: "easy",
            objectives: {
                killCount: 15,
                surviveTime: 90,
                maxDeaths: 3,
                specialConditions: ['defeat_fire_dragon']
            },
            rewards: {
                tokens: 100,
                experience: 200,
                skillPoints: 2,
                unlocksLevel: 3
            },
            enemyWaves: {
                spawnRate: 1800,
                maxConcurrent: 4,
                types: ['basic', 'fire'],
                totalWaves: 4
            }
        }
    },
    
    isLevelUnlocked: (levelId, completedLevels) => {
        if (levelId === 1) return true;
        return completedLevels.includes(levelId - 1);
    },
    
    getLevel: (levelId) => {
        return LevelConfigMock.ADVENTURE_LEVELS[levelId] || null;
    },
    
    getAllLevels: () => {
        return Object.values(LevelConfigMock.ADVENTURE_LEVELS);
    }
};

// 安全的ProgressionSystem mock
const ProgressionSystemMock = function() {
    this.data = {
        completedLevels: [1],
        endlessRecords: {
            bestWave: 0,
            bestTime: 0,
            bestScore: 0
        },
        playerStats: {
            totalKills: 0,
            totalScore: 0,
            totalPlayTime: 0
        },
        totalTokens: 0,
        totalKills: 0,
        gamesPlayed: 0
    };
    
    this.loadProgress = () => {
        // 模拟从localStorage加载
        try {
            const saved = localStorage.getItem('towerDefenseProgress');
            if (saved) {
                this.data = { ...this.data, ...JSON.parse(saved) };
            }
        } catch (e) {
            // 忽略错误，使用默认数据
        }
    };
    
    this.saveProgress = () => {
        try {
            localStorage.setItem('towerDefenseProgress', JSON.stringify(this.data));
        } catch (e) {
            // 忽略错误
        }
    };
    
    this.isLevelUnlocked = (levelId) => {
        return LevelConfigMock.isLevelUnlocked(levelId, this.data.completedLevels);
    };
    
    this.completeLevel = (levelId, rewards = {}) => {
        if (!this.data.completedLevels.includes(levelId)) {
            this.data.completedLevels.push(levelId);
        }
        this.saveProgress();
    };
    
    this.completeLevelWithRewards = this.completeLevel;
};

// 安全的GameModeManager mock
const GameModeManagerMock = function(gameInstance) {
    this.game = gameInstance;
    this.currentMode = null;
    this.currentLevel = null;
    this.progressionSystem = null;
    this.completedLevels = [1];
    
    this.startAdventureMode = (levelId) => {
        if (LevelConfigMock.isLevelUnlocked(levelId, this.completedLevels)) {
            this.currentMode = LevelConfigMock.GAME_MODES.ADVENTURE;
            this.currentLevel = LevelConfigMock.getLevel(levelId);
            
            if (this.game && this.game.eventSystem && this.game.eventSystem.emit) {
                this.game.eventSystem.emit('mode_started', { mode: 'adventure', level: levelId });
            }
            
            if (this.setupLevelObjectives) {
                this.setupLevelObjectives(this.currentLevel);
            }
            
            return true;
        }
        return false;
    };
    
    this.startEndlessMode = (difficulty = 'normal') => {
        this.currentMode = LevelConfigMock.GAME_MODES.ENDLESS;
        this.currentLevel = null;
        
        if (this.game && this.game.eventSystem && this.game.eventSystem.emit) {
            this.game.eventSystem.emit('mode_started', { mode: 'endless', difficulty });
        }
        
        return true;
    };
    
    this.setupLevelObjectives = () => {};
    this.setupLevelEnemies = () => {};
    this.setupLevelEnvironment = () => {};
};

// 安全的EndlessMode mock
const EndlessModeMock = function(gameInstance) {
    this.game = gameInstance;
    this.isActive = false;
    this.difficulty = 'normal';
    this.currentWave = 0;
    this.totalKills = 0;
    this.score = 0;
    this.survivalTime = 0;
    
    this.difficultyConfig = {
        normal: {
            healthMultiplier: 1.0,
            speedMultiplier: 1.0,
            damageMultiplier: 1.0,
            countMultiplier: 1.0,
            bossFrequency: 5,
            specialEnemyChance: 0.1,
            enemyHealthMultiplier: 1.0,
            enemySpeedMultiplier: 1.0
        },
        hard: {
            healthMultiplier: 1.5,
            speedMultiplier: 1.2,
            damageMultiplier: 1.3,
            countMultiplier: 1.2,
            bossFrequency: 4,
            specialEnemyChance: 0.15,
            enemyHealthMultiplier: 1.5,
            enemySpeedMultiplier: 1.2
        },
        nightmare: {
            healthMultiplier: 2.0,
            speedMultiplier: 1.5,
            damageMultiplier: 1.8,
            countMultiplier: 1.5,
            bossFrequency: 3,
            specialEnemyChance: 0.2,
            enemyHealthMultiplier: 2.0,
            enemySpeedMultiplier: 1.5
        }
    };
    
    this.start = (difficulty = 'normal') => {
        this.isActive = true;
        this.difficulty = difficulty;
        this.currentWave = 1;
        this.score = 0;
        this.totalKills = 0;
        this.survivalTime = 0;
        return true;
    };
    
    this.stop = () => {
        this.isActive = false;
    };
    
    this.update = () => {
        if (this.isActive) {
            this.survivalTime += 16; // 假设16ms更新间隔
        }
    };
    
    this.render = () => {
        // 模拟渲染
    };
    
    this.onEnemyKilled = (enemyType) => {
        this.totalKills++;
        this.score += (enemyType === 'boss') ? 100 : 10;
    };
    
    this.calculateWaveStats = (wave) => {
        return {
            enemyCount: Math.min(5 + Math.floor(wave / 5), 20),
            enemyTypes: ['basic', 'fire', 'ice']
        };
    };
    
    this.saveHighScore = () => {
        try {
            const leaderboard = this.getLeaderboard();
            leaderboard.push({
                score: this.score,
                wave: this.currentWave,
                time: this.survivalTime,
                difficulty: this.difficulty,
                date: new Date().toISOString()
            });
            leaderboard.sort((a, b) => b.score - a.score);
            leaderboard.splice(10); // 保持前10名
            localStorage.setItem('endlessLeaderboard', JSON.stringify(leaderboard));
        } catch (e) {
            // 忽略错误
        }
    };
    
    this.getLeaderboard = () => {
        try {
            return JSON.parse(localStorage.getItem('endlessLeaderboard') || '[]');
        } catch (e) {
            return [];
        }
    };
};

// 提供全局访问
if (typeof global !== 'undefined') {
    // 如果真实类不存在，提供mock版本
    if (!global.LevelConfig) global.LevelConfig = LevelConfigMock;
    if (!global.ProgressionSystem) global.ProgressionSystem = ProgressionSystemMock;
    if (!global.GameModeManager) global.GameModeManager = GameModeManagerMock;
    if (!global.EndlessMode) global.EndlessMode = EndlessModeMock;
    
    global.createSafeMock = createSafeMock;
}

if (typeof window !== 'undefined') {
    // 浏览器环境
    if (!window.LevelConfig) window.LevelConfig = LevelConfigMock;
    if (!window.ProgressionSystem) window.ProgressionSystem = ProgressionSystemMock;
    if (!window.GameModeManager) window.GameModeManager = GameModeManagerMock;
    if (!window.EndlessMode) window.EndlessMode = EndlessModeMock;
    
    window.createSafeMock = createSafeMock;
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        LevelConfigMock,
        ProgressionSystemMock,
        GameModeManagerMock,
        EndlessModeMock,
        createSafeMock
    };
}
