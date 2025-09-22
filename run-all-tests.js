/**
 * 主测试入口文件
 * 加载并运行所有测试套件
 */

// 检查运行环境
const isNode = typeof require !== 'undefined';
const isBrowser = typeof window !== 'undefined';

console.log('🚀 塔防游戏测试套件启动...');
console.log(`📍 运行环境: ${isNode ? 'Node.js' : 'Browser'}`);

if (isNode) {
    // Node.js 环境
    runNodeTests();
} else if (isBrowser) {
    // 浏览器环境
    runBrowserTests();
}

async function runNodeTests() {
    try {
        // 导入必要的模块
        const path = require('path');
        const fs = require('fs');
        
        // 导入测试框架和运行器
        const { TestRunner } = require('./tests/test-runner.js');
        const { TestFramework } = require('./tests/test-framework.js');
        
        // 导入游戏类（需要先设置全局环境）
        setupNodeEnvironment();
        
        // 动态导入游戏代码
        const DragonHunterGame = require('./src/game.js');
        const SkillSystem = require('./src/systems/SkillSystem.js');
        
        // 设置全局变量
        global.DragonHunterGame = DragonHunterGame;
        global.SkillSystem = SkillSystem;
        
        // 创建测试运行器
        const testRunner = new TestRunner();
        
        // 配置测试运行器
        testRunner.configure({
            parallel: false,
            timeout: 30000,
            verbose: true,
            generateReport: true,
            reportFormat: 'html'
        });
        
        // 加载并添加测试套件
        console.log('📂 加载测试套件...');
        
        // 单元测试
        try {
            const unitTests = require('./tests/unit/dragon-hunter-game.test.js');
            testRunner.addTestSuite('DragonHunterGame 单元测试', unitTests);
            console.log('✅ 已加载: DragonHunterGame 单元测试');
        } catch (error) {
            console.warn('⚠️ 无法加载 DragonHunterGame 单元测试:', error.message);
        }
        
        try {
            const skillTests = require('./tests/unit/skill-system.test.js');
            testRunner.addTestSuite('SkillSystem 单元测试', skillTests);
            console.log('✅ 已加载: SkillSystem 单元测试');
        } catch (error) {
            console.warn('⚠️ 无法加载 SkillSystem 单元测试:', error.message);
        }
        
        // 集成测试
        try {
            const integrationTests = require('./tests/integration/game-systems.test.js');
            testRunner.addTestSuite('游戏系统集成测试', integrationTests);
            console.log('✅ 已加载: 游戏系统集成测试');
        } catch (error) {
            console.warn('⚠️ 无法加载游戏系统集成测试:', error.message);
        }
        
        try {
            const uiTests = require('./tests/integration/ui-interaction.test.js');
            testRunner.addTestSuite('UI交互测试', uiTests);
            console.log('✅ 已加载: UI交互测试');
        } catch (error) {
            console.warn('⚠️ 无法加载UI交互测试:', error.message);
        }
        
        // 性能测试
        try {
            const performanceTests = require('./tests/performance/performance.test.js');
            testRunner.addTestSuite('性能测试', performanceTests);
            console.log('✅ 已加载: 性能测试');
        } catch (error) {
            console.warn('⚠️ 无法加载性能测试:', error.message);
        }
        
        // 运行所有测试
        console.log('\n🎯 开始运行测试...');
        const results = await testRunner.runAll();
        
        // 退出进程
        process.exit(results.failed > 0 ? 1 : 0);
        
    } catch (error) {
        console.error('❌ 测试运行失败:', error);
        console.error(error.stack);
        process.exit(1);
    }
}

function runBrowserTests() {
    // 等待页面加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initBrowserTests);
    } else {
        initBrowserTests();
    }
}

async function initBrowserTests() {
    try {
        console.log('🌐 浏览器测试环境初始化...');
        
        // 创建测试容器
        const testContainer = document.createElement('div');
        testContainer.id = 'test-container';
        testContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            color: white;
            font-family: monospace;
            font-size: 14px;
            padding: 20px;
            box-sizing: border-box;
            overflow-y: auto;
            z-index: 10000;
        `;
        
        document.body.appendChild(testContainer);
        
        // 重定向console输出
        const originalLog = console.log;
        console.log = function(...args) {
            originalLog.apply(console, args);
            const logDiv = document.createElement('div');
            logDiv.textContent = args.join(' ');
            testContainer.appendChild(logDiv);
            testContainer.scrollTop = testContainer.scrollHeight;
        };
        
        // 创建测试运行器
        const testRunner = new TestRunner();
        
        // 配置测试运行器
        testRunner.configure({
            parallel: false,
            timeout: 30000,
            verbose: true,
            generateReport: true,
            reportFormat: 'html'
        });
        
        // 检查必要的类是否可用
        if (typeof DragonHunterGame === 'undefined') {
            console.log('⚠️ DragonHunterGame 类未找到，请确保游戏脚本已加载');
        }
        
        if (typeof SkillSystem === 'undefined') {
            console.log('⚠️ SkillSystem 类未找到，请确保技能系统脚本已加载');
        }
        
        // 添加测试套件（简化版，因为在浏览器中模块加载较复杂）
        console.log('📂 准备测试套件...');
        
        // 创建简化的测试套件
        const quickTests = createQuickTestSuite();
        testRunner.addTestSuite('快速验证测试', { testFramework: quickTests });
        
        // 运行测试
        console.log('\n🎯 开始运行浏览器测试...');
        const results = await testRunner.runAll();
        
        // 显示完成信息
        console.log('\n✨ 浏览器测试完成！');
        console.log('💡 提示: 查看生成的HTML报告获取详细信息');
        
    } catch (error) {
        console.error('❌ 浏览器测试失败:', error);
    }
}

function createQuickTestSuite() {
    const framework = new TestFramework();
    
    framework.describe('快速验证测试', () => {
        framework.it('应该能够创建游戏实例', () => {
            if (typeof DragonHunterGame !== 'undefined') {
                const canvas = document.createElement('canvas');
                canvas.width = 800;
                canvas.height = 600;
                const game = new DragonHunterGame(canvas);
                framework.expect(game).toBeTruthy();
                framework.expect(game.width).toBe(800);
                framework.expect(game.height).toBe(600);
            } else {
                throw new Error('DragonHunterGame 类未定义');
            }
        });
        
        framework.it('应该能够启动游戏', () => {
            if (typeof DragonHunterGame !== 'undefined') {
                const canvas = document.createElement('canvas');
                const game = new DragonHunterGame(canvas);
                game.startGame();
                framework.expect(game.gameStarted).toBe(true);
            } else {
                throw new Error('DragonHunterGame 类未定义');
            }
        });
        
        framework.it('应该能够创建技能系统', () => {
            if (typeof DragonHunterGame !== 'undefined' && typeof SkillSystem !== 'undefined') {
                const canvas = document.createElement('canvas');
                const game = new DragonHunterGame(canvas);
                framework.expect(game.skillSystem).toBeTruthy();
                framework.expect(game.skillSystem).toBeInstanceOf(SkillSystem);
            } else {
                throw new Error('必要的类未定义');
            }
        });
        
        framework.it('应该能够处理键盘输入', () => {
            if (typeof DragonHunterGame !== 'undefined') {
                const canvas = document.createElement('canvas');
                const game = new DragonHunterGame(canvas);
                game.startGame();
                
                const initialX = game.player.x;
                game.handleKeyDown({ code: 'KeyD' });
                game.updatePlayer(16);
                
                framework.expect(game.player.x).toBeGreaterThan(initialX);
            } else {
                throw new Error('DragonHunterGame 类未定义');
            }
        });
        
        framework.it('应该能够创建和更新子弹', () => {
            if (typeof DragonHunterGame !== 'undefined') {
                const canvas = document.createElement('canvas');
                const game = new DragonHunterGame(canvas);
                game.startGame();
                
                const initialBulletCount = game.bullets.length;
                game.createBullet(400, 300, 1, 0);
                
                framework.expect(game.bullets.length).toBe(initialBulletCount + 1);
                
                const bullet = game.bullets[game.bullets.length - 1];
                const initialX = bullet.x;
                game.updateBullets(16);
                
                framework.expect(bullet.x).toBeGreaterThan(initialX);
            } else {
                throw new Error('DragonHunterGame 类未定义');
            }
        });
    });
    
    return framework;
}

function setupNodeEnvironment() {
    // 设置Node.js环境的全局变量和Mock
    global.window = {
        addEventListener: () => {},
        removeEventListener: () => {},
        requestAnimationFrame: (callback) => setTimeout(callback, 16),
        cancelAnimationFrame: () => {}
    };
    
    global.document = {
        getElementById: () => null,
        createElement: (tag) => ({
            getContext: () => ({
                fillRect: () => {},
                strokeRect: () => {},
                clearRect: () => {},
                arc: () => {},
                beginPath: () => {},
                closePath: () => {},
                fill: () => {},
                stroke: () => {},
                fillStyle: '#000000',
                strokeStyle: '#000000',
                lineWidth: 1
            }),
            width: 800,
            height: 600,
            addEventListener: () => {},
            removeEventListener: () => {}
        }),
        addEventListener: () => {},
        removeEventListener: () => {}
    };
    
    // 设置性能API
    if (typeof performance === 'undefined') {
        global.performance = {
            now: () => Date.now()
        };
    }
}

// 命令行参数处理
if (isNode && process.argv.length > 2) {
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
🎮 塔防游戏测试套件

使用方法:
  node run-all-tests.js [选项]

选项:
  --help, -h        显示此帮助信息
  --suite <name>    运行特定的测试套件
  --parallel        并行运行测试套件
  --json            生成JSON格式报告
  --no-report       不生成测试报告
  --timeout <ms>    设置测试超时时间

示例:
  node run-all-tests.js                    # 运行所有测试
  node run-all-tests.js --parallel         # 并行运行测试
  node run-all-tests.js --suite "单元测试" # 运行特定套件
  node run-all-tests.js --json             # 生成JSON报告
        `);
        process.exit(0);
    }
}
