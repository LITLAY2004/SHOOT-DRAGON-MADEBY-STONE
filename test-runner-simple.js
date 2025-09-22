/**
 * 简单的测试运行器
 * 用于快速验证测试修复效果
 */

// 加载测试修复
require('./tests/test-fixes.js');

// 简单的测试框架
let testResults = {
    passed: 0,
    failed: 0,
    total: 0
};

function runTest(name, testFn) {
    testResults.total++;
    try {
        testFn();
        console.log(`✅ ${name}`);
        testResults.passed++;
    } catch (error) {
        console.log(`❌ ${name}: ${error.message}`);
        testResults.failed++;
    }
}

function expect(actual) {
    return {
        toBe: (expected) => {
            if (actual !== expected) {
                throw new Error(`Expected ${actual} to be ${expected}`);
            }
        },
        toBeTruthy: () => {
            if (!actual) {
                throw new Error(`Expected ${actual} to be truthy`);
            }
        },
        toBeFalsy: () => {
            if (actual) {
                throw new Error(`Expected ${actual} to be falsy`);
            }
        },
        toHaveProperty: (prop) => {
            if (typeof actual !== 'object' || actual === null || !(prop in actual)) {
                throw new Error(`Expected object to have property ${prop}`);
            }
        },
        toBeGreaterThan: (expected) => {
            if (actual <= expected) {
                throw new Error(`Expected ${actual} to be greater than ${expected}`);
            }
        },
        toBeGreaterThanOrEqual: (expected) => {
            if (actual < expected) {
                throw new Error(`Expected ${actual} to be greater than or equal to ${expected}`);
            }
        },
        toContain: (expected) => {
            if (!Array.isArray(actual) || !actual.includes(expected)) {
                throw new Error(`Expected array to contain ${expected}`);
            }
        }
    };
}

function createMock(properties = {}) {
    return createSafeMock(properties);
}

// 模拟localStorage
global.localStorage = {
    data: {},
    getItem: function(key) {
        return this.data[key] || null;
    },
    setItem: function(key, value) {
        this.data[key] = value;
    },
    removeItem: function(key) {
        delete this.data[key];
    },
    clear: function() {
        this.data = {};
    }
};

console.log('🚀 运行简单测试套件...\n');

// 基础依赖测试
console.log('📋 基础依赖测试:');
runTest('LevelConfig 应该可用', () => {
    expect(typeof LevelConfig).toBe('object');
    expect(LevelConfig.GAME_MODES.ADVENTURE).toBe('adventure');
});

runTest('ProgressionSystem 应该可用', () => {
    expect(typeof ProgressionSystem).toBe('function');
    const ps = new ProgressionSystem();
    expect(ps.data).toHaveProperty('completedLevels');
});

runTest('GameModeManager 应该可用', () => {
    expect(typeof GameModeManager).toBe('function');
    const mockGame = createMock({
        eventSystem: createMock({ emit: () => {} })
    });
    const gmm = new GameModeManager(mockGame);
    expect(gmm.startAdventureMode(1)).toBeTruthy();
});

runTest('EndlessMode 应该可用', () => {
    expect(typeof EndlessMode).toBe('function');
    const mockGame = createMock({});
    const em = new EndlessMode(mockGame);
    expect(em.difficultyConfig).toHaveProperty('normal');
});

// 关卡配置测试
console.log('\n📋 关卡配置测试:');
runTest('游戏模式定义正确', () => {
    expect(LevelConfig.GAME_MODES.ADVENTURE).toBe('adventure');
    expect(LevelConfig.GAME_MODES.ENDLESS).toBe('endless');
    expect(LevelConfig.GAME_MODES.SURVIVAL).toBe('survival');
});

runTest('关卡数据结构正确', () => {
    const level1 = LevelConfig.getLevel(1);
    expect(level1).toHaveProperty('id');
    expect(level1).toHaveProperty('name');
    expect(level1).toHaveProperty('objectives');
    expect(level1.objectives).toHaveProperty('killCount');
});

runTest('关卡解锁逻辑正确', () => {
    expect(LevelConfig.isLevelUnlocked(1, [])).toBeTruthy();
    expect(LevelConfig.isLevelUnlocked(2, [1])).toBeTruthy();
    expect(LevelConfig.isLevelUnlocked(3, [1])).toBeFalsy();
});

// 进度系统测试
console.log('\n📋 进度系统测试:');
runTest('进度系统初始化', () => {
    const ps = new ProgressionSystem();
    ps.loadProgress();
    expect(ps.data.completedLevels).toContain(1);
});

runTest('关卡完成功能', () => {
    const ps = new ProgressionSystem();
    ps.completeLevel(2);
    expect(ps.data.completedLevels).toContain(2);
});

// 游戏模式管理器测试
console.log('\n📋 游戏模式管理器测试:');
runTest('闯关模式启动', () => {
    const mockGame = createMock({
        eventSystem: createMock({ emit: () => {} })
    });
    const gmm = new GameModeManager(mockGame);
    const result = gmm.startAdventureMode(1);
    expect(result).toBeTruthy();
    expect(gmm.currentMode).toBe('adventure');
});

runTest('未解锁关卡拒绝', () => {
    const mockGame = createMock({});
    const gmm = new GameModeManager(mockGame);
    gmm.completedLevels = [1];
    const result = gmm.startAdventureMode(5);
    expect(result).toBeFalsy();
});

// 无限模式测试
console.log('\n📋 无限模式测试:');
runTest('无限模式初始化', () => {
    const mockGame = createMock({});
    const em = new EndlessMode(mockGame);
    expect(em.isActive).toBeFalsy();
    expect(em.difficulty).toBe('normal');
});

runTest('难度配置完整', () => {
    const mockGame = createMock({});
    const em = new EndlessMode(mockGame);
    expect(em.difficultyConfig).toHaveProperty('normal');
    expect(em.difficultyConfig).toHaveProperty('hard');
    expect(em.difficultyConfig).toHaveProperty('nightmare');
});

runTest('无限模式启动', () => {
    const mockGame = createMock({});
    const em = new EndlessMode(mockGame);
    const result = em.start('normal');
    expect(result).toBeTruthy();
    expect(em.isActive).toBeTruthy();
});

runTest('波次统计计算', () => {
    const mockGame = createMock({});
    const em = new EndlessMode(mockGame);
    const stats = em.calculateWaveStats(5);
    expect(stats).toHaveProperty('enemyCount');
    expect(stats.enemyCount).toBeGreaterThan(0);
});

// 集成测试
console.log('\n📋 集成测试:');
runTest('模式切换功能', () => {
    const mockGame = createMock({
        eventSystem: createMock({ emit: () => {} })
    });
    const gmm = new GameModeManager(mockGame);
    
    // 启动闯关模式
    expect(gmm.startAdventureMode(1)).toBeTruthy();
    expect(gmm.currentMode).toBe('adventure');
    
    // 切换到无限模式
    expect(gmm.startEndlessMode('normal')).toBeTruthy();
    expect(gmm.currentMode).toBe('endless');
});

runTest('数据持久化', () => {
    const ps = new ProgressionSystem();
    ps.completeLevel(3);
    ps.saveProgress();
    
    const ps2 = new ProgressionSystem();
    ps2.loadProgress();
    expect(ps2.data.completedLevels).toContain(3);
});

// 输出结果
console.log('\n📊 测试结果:');
console.log(`总计: ${testResults.total}`);
console.log(`✅ 通过: ${testResults.passed}`);
console.log(`❌ 失败: ${testResults.failed}`);
console.log(`成功率: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

if (testResults.failed === 0) {
    console.log('\n🎉 所有测试通过！测试修复成功。');
    process.exit(0);
} else {
    console.log('\n⚠️  部分测试失败，需要进一步修复。');
    process.exit(1);
}
