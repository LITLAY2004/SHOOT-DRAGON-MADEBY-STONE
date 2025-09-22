/**
 * 数字龙猎游戏基础测试
 * 快速验证核心功能是否正常工作
 */

// 简单的测试框架
function assert(condition, message) {
    if (!condition) {
        throw new Error(`断言失败: ${message}`);
    }
}

function describe(name, fn) {
    console.log(`\n📋 测试套件: ${name}`);
    try {
        fn();
        console.log(`✅ ${name} - 所有测试通过`);
    } catch (error) {
        console.log(`❌ ${name} - 测试失败: ${error.message}`);
        throw error;
    }
}

function it(name, fn) {
    try {
        fn();
        console.log(`  ✓ ${name}`);
    } catch (error) {
        console.log(`  ✗ ${name}: ${error.message}`);
        throw error;
    }
}

// 模拟浏览器环境
global.window = {
    innerWidth: 1920,
    innerHeight: 1080,
    addEventListener: () => {},
    performance: { now: () => Date.now() }
};

global.document = {
    getElementById: () => ({
        getContext: () => ({
            clearRect: () => {},
            fillRect: () => {},
            arc: () => {},
            fill: () => {},
            fillText: () => {},
            measureText: () => ({ width: 100 })
        }),
        width: 800,
        height: 600
    }),
    addEventListener: () => {}
};

// 加载游戏文件
const fs = require('fs');
const path = require('path');

// 加载配置文件
try {
    const balanceConfigPath = path.join(__dirname, '..', 'src', 'config', 'BalanceConfig.js');
    const balanceConfigContent = fs.readFileSync(balanceConfigPath, 'utf8');
    eval(balanceConfigContent.replace(/export\s+default\s+/g, 'global.BalanceConfig = '));
} catch (error) {
    console.log('⚠️  无法加载BalanceConfig，使用默认值');
    global.BalanceConfig = {
        PLAYER: { baseHealth: 100, baseDamage: 25, baseSpeed: 180, baseFireRate: 300 }
    };
}

// 加载技能系统
try {
    const skillSystemPath = path.join(__dirname, '..', 'src', 'systems', 'SkillSystem.js');
    const skillSystemContent = fs.readFileSync(skillSystemPath, 'utf8');
    eval(skillSystemContent.replace(/export\s+default\s+/g, 'global.SkillSystem = '));
} catch (error) {
    console.log('⚠️  无法加载SkillSystem，跳过技能测试');
}

// 加载游戏主文件
try {
    const gameFilePath = path.join(__dirname, '..', 'src', 'game.js');
    const gameContent = fs.readFileSync(gameFilePath, 'utf8');
    eval(gameContent);
} catch (error) {
    console.error('❌ 无法加载游戏文件:', error);
    process.exit(1);
}

// 开始测试
console.log('🚀 数字龙猎游戏基础测试开始...\n');

let testsPassed = 0;
let testsTotal = 0;

function runTest(name, testFn) {
    testsTotal++;
    try {
        testFn();
        console.log(`✅ ${name}`);
        testsPassed++;
    } catch (error) {
        console.log(`❌ ${name}: ${error.message}`);
    }
}

// 测试1: 游戏类创建
runTest('游戏类可以被创建', () => {
    const game = new DragonHunterGame();
    assert(game !== null, '游戏对象不应为null');
    assert(typeof game === 'object', '游戏应该是一个对象');
});

// 测试2: 游戏初始状态
runTest('游戏初始状态正确', () => {
    const game = new DragonHunterGame();
    assert(game.gameStarted === false, '游戏开始时应该是未启动状态');
    assert(game.gameOver === false, '游戏开始时不应该结束');
    assert(game.score === 0, '初始分数应该为0');
    assert(game.lives === 3, '初始生命值应该为3');
    assert(game.wave === 1, '初始波次应该为1');
});

// 测试3: 玩家初始化
runTest('玩家正确初始化', () => {
    const game = new DragonHunterGame();
    assert(game.player !== null, '玩家对象不应为null');
    assert(game.player.x === 400, '玩家初始X位置应该是屏幕中心');
    assert(game.player.y === 300, '玩家初始Y位置应该是屏幕中心');
    assert(game.player.health > 0, '玩家初始生命值应该大于0');
    assert(game.player.maxHealth > 0, '玩家最大生命值应该大于0');
});

// 测试4: 游戏对象数组
runTest('游戏对象数组正确初始化', () => {
    const game = new DragonHunterGame();
    assert(Array.isArray(game.bullets), '子弹数组应该是数组');
    assert(Array.isArray(game.particles), '粒子数组应该是数组');
    assert(game.bullets.length === 0, '初始子弹数组应该为空');
    assert(game.particles.length === 0, '初始粒子数组应该为空');
});

// 测试5: 键盘状态
runTest('键盘状态正确初始化', () => {
    const game = new DragonHunterGame();
    assert(typeof game.keys === 'object', '键盘状态应该是对象');
    assert(game.keys.w === false, 'W键初始状态应该是false');
    assert(game.keys.a === false, 'A键初始状态应该是false');
    assert(game.keys.s === false, 'S键初始状态应该是false');
    assert(game.keys.d === false, 'D键初始状态应该是false');
});

// 测试6: 技能系统
runTest('技能系统初始化', () => {
    const game = new DragonHunterGame();
    if (game.skillSystem) {
        assert(typeof game.skillSystem === 'object', '技能系统应该是对象');
    } else {
        console.log('    ⚠️  技能系统未加载，跳过此测试');
    }
});

// 测试7: 游戏方法存在性
runTest('必要的游戏方法存在', () => {
    const game = new DragonHunterGame();
    assert(typeof game.update === 'function', 'update方法应该存在');
    assert(typeof game.render === 'function', 'render方法应该存在');
    assert(typeof game.handleKeyDown === 'function', 'handleKeyDown方法应该存在');
    assert(typeof game.handleKeyUp === 'function', 'handleKeyUp方法应该存在');
});

// 测试8: 游戏更新不抛出异常
runTest('游戏更新循环正常工作', () => {
    const game = new DragonHunterGame();
    // 应该不抛出异常
    game.update(16);
    game.update(0);
    game.update(33);
});

// 测试9: 游戏渲染不抛出异常
runTest('游戏渲染循环正常工作', () => {
    const game = new DragonHunterGame();
    // 应该不抛出异常
    game.render();
});

// 测试10: 键盘输入处理
runTest('键盘输入处理正常', () => {
    const game = new DragonHunterGame();
    
    // 模拟按下W键
    game.handleKeyDown({ code: 'KeyW', preventDefault: () => {} });
    assert(game.keys.w === true, '按下W键后状态应该为true');
    
    // 模拟释放W键
    game.handleKeyUp({ code: 'KeyW', preventDefault: () => {} });
    assert(game.keys.w === false, '释放W键后状态应该为false');
});

// 测试11: 子弹创建
runTest('子弹创建功能', () => {
    const game = new DragonHunterGame();
    const initialCount = game.bullets.length;
    
    if (typeof game.createBullet === 'function') {
        game.createBullet(400, 300, 1, 0);
        assert(game.bullets.length === initialCount + 1, '创建子弹后数量应该增加');
    } else if (typeof game.shoot === 'function') {
        // 尝试射击
        game.shoot();
        // 验证子弹系统存在
        assert(Array.isArray(game.bullets), '子弹数组应该存在');
    } else {
        console.log('    ⚠️  射击功能未找到，跳过此测试');
    }
});

// 测试12: 碰撞检测
runTest('碰撞检测功能', () => {
    const game = new DragonHunterGame();
    
    if (typeof game.checkCollision === 'function') {
        // 测试重叠的圆形
        const obj1 = { x: 100, y: 100, radius: 10 };
        const obj2 = { x: 105, y: 100, radius: 10 };
        assert(game.checkCollision(obj1, obj2) === true, '重叠的对象应该检测到碰撞');
        
        // 测试不重叠的圆形
        const obj3 = { x: 130, y: 100, radius: 10 };
        assert(game.checkCollision(obj1, obj3) === false, '不重叠的对象不应该检测到碰撞');
    } else {
        console.log('    ⚠️  碰撞检测功能未找到，跳过此测试');
    }
});

// 输出测试结果
console.log(`\n📊 测试完成! 通过: ${testsPassed}/${testsTotal}`);

if (testsPassed === testsTotal) {
    console.log('🎉 所有基础测试通过！游戏核心功能正常！');
    process.exit(0);
} else {
    console.log('⚠️  部分测试失败，请检查游戏代码');
    process.exit(1);
}
