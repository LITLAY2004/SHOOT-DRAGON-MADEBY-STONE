/**
 * 测试依赖加载器
 * 确保所有测试需要的类和模块都被正确加载
 */

// 检查是否在Node.js环境中
const isNode = typeof module !== 'undefined' && module.exports;

// 加载核心依赖类
let LevelConfig, ProgressionSystem, GameModeManager, EndlessMode, BalanceConfig;

if (isNode) {
    // Node.js环境 - 使用require
    try {
        LevelConfig = require('../src/config/LevelConfig.js');
        ProgressionSystem = require('../src/systems/ProgressionSystem.js');
        GameModeManager = require('../src/systems/GameModeManager.js');
        EndlessMode = require('../src/modes/EndlessMode.js');
        BalanceConfig = require('../src/config/BalanceConfig.js');
    } catch (error) {
        console.warn('Failed to load some dependencies in Node.js:', error.message);
    }
} else if (typeof window !== 'undefined') {
    // 浏览器环境 - 从全局对象获取
    LevelConfig = window.LevelConfig;
    ProgressionSystem = window.ProgressionSystem;
    GameModeManager = window.GameModeManager;
    EndlessMode = window.EndlessMode;
    BalanceConfig = window.BalanceConfig;
}

// 创建全局可访问的类引用
if (typeof global !== 'undefined') {
    global.LevelConfig = LevelConfig;
    global.ProgressionSystem = ProgressionSystem;
    global.GameModeManager = GameModeManager;
    global.EndlessMode = EndlessMode;
    global.BalanceConfig = BalanceConfig;
}

// 为测试提供安全的类实例化工具
const TestDependencies = {
    LevelConfig,
    ProgressionSystem,
    GameModeManager,
    EndlessMode,
    BalanceConfig,
    
    // 安全创建实例的方法
    createProgressionSystem: () => {
        if (!ProgressionSystem) {
            throw new Error('ProgressionSystem not available');
        }
        return new ProgressionSystem(null, { silent: true });
    },
    
    createGameModeManager: (gameInstance) => {
        if (!GameModeManager) {
            throw new Error('GameModeManager not available');
        }
        return new GameModeManager(gameInstance);
    },
    
    createEndlessMode: (gameInstance) => {
        if (!EndlessMode) {
            throw new Error('EndlessMode not available');
        }
        return new EndlessMode(gameInstance);
    },
    
    // 检查依赖是否可用
    checkDependencies: () => {
        const missing = [];
        if (!LevelConfig) missing.push('LevelConfig');
        if (!ProgressionSystem) missing.push('ProgressionSystem');
        if (!GameModeManager) missing.push('GameModeManager');
        if (!EndlessMode) missing.push('EndlessMode');
        if (!BalanceConfig) missing.push('BalanceConfig');
        
        if (missing.length > 0) {
            console.warn('Missing dependencies:', missing);
            return false;
        }
        return true;
    }
};

// 导出模块
if (isNode) {
    module.exports = TestDependencies;
} else if (typeof window !== 'undefined') {
    window.TestDependencies = TestDependencies;
}

// 提供全局访问
if (typeof global !== 'undefined') {
    global.TestDependencies = TestDependencies;
}
