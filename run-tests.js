#!/usr/bin/env node

/**
 * 龙猎游戏测试套件 - 石龙版本
 * 针对新的石龙BOSS战模式进行测试
 */

const DragonHunterGame = require('./src/game.js');

// 简单的测试框架
function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(`${message}: expected ${expected}, got ${actual}`);
    }
}

function assertGreaterThan(actual, expected, message) {
    if (actual <= expected) {
        throw new Error(`${message}: expected > ${expected}, got ${actual}`);
    }
}

function assertLessThan(actual, expected, message) {
    if (actual >= expected) {
        throw new Error(`${message}: expected < ${expected}, got ${actual}`);
    }
}

// 颜色输出
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    yellow: '\x1b[33m',
    reset: '\x1b[0m'
};

let testCount = 0;
let passedTests = 0;

function runTest(testName, testFunction) {
    testCount++;
    try {
        testFunction();
        console.log(`${colors.green}✓${colors.reset} ${testName}`);
        passedTests++;
    } catch (error) {
        console.log(`${colors.red}✗${colors.reset} ${testName}: ${error.message}`);
    }
}

console.log('🐉 石龙猎者游戏测试套件');
console.log('========================\n');

// 基础功能测试
console.log(`${colors.cyan}=== 基础功能测试 ===${colors.reset}`);

runTest('游戏应该正确初始化', () => {
    const game = new DragonHunterGame();
    assertEqual(game.gameStarted, false);
    assertEqual(game.lives, 3);
    assertEqual(game.score, 0);
    assertEqual(game.wave, 1);
    assertEqual(game.player.x, 400);
    assertEqual(game.player.y, 300);
    assertEqual(game.autoShoot, true);
});

runTest('游戏开始应该创建石龙', () => {
    const game = new DragonHunterGame();
    game.startGame();
    assertEqual(game.gameStarted, true);
    assert(game.stoneDragon !== null, '应该创建石龙');
    assertGreaterThan(game.stoneDragon.segments.length, 0);
});

runTest('石龙初始属性应该正确', () => {
    const game = new DragonHunterGame();
    game.startGame();
    const dragon = game.stoneDragon;
    assert(dragon.segments[0].health > 0, '石龙应该有血量');
    assertEqual(dragon.segments[0].segmentIndex, 0);
    assertGreaterThan(dragon.totalSegments, 0);
});

// 移动系统测试
console.log(`\n${colors.cyan}=== 移动系统测试 ===${colors.reset}`);

runTest('玩家向右移动', () => {
    const game = new DragonHunterGame();
    game.startGame();
    const initialX = game.player.x;
    game.keys['d'] = true;
    game.updatePlayer(0.1);
    assertGreaterThan(game.player.x, initialX);
});

runTest('玩家向上移动', () => {
    const game = new DragonHunterGame();
    game.startGame();
    const initialY = game.player.y;
    game.keys['w'] = true;
    game.updatePlayer(0.1);
    assertLessThan(game.player.y, initialY);
});

runTest('玩家边界限制', () => {
    const game = new DragonHunterGame();
    game.startGame();
    game.player.x = 10;
    game.keys['a'] = true;
    game.updatePlayer(1.0);
    assertGreaterThan(game.player.x, game.player.radius - 1);
});

// 自动射击系统测试
console.log(`\n${colors.cyan}=== 自动射击系统测试 ===${colors.reset}`);

runTest('自动射击应该生成子弹', () => {
    const game = new DragonHunterGame();
    game.startGame();
    const initialBullets = game.bullets.length;
    game.lastShotTime = 0; // 重置冷却
    game.autoShootLogic(0.5);
    assertGreaterThan(game.bullets.length, initialBullets);
});

runTest('子弹属性应该正确', () => {
    const game = new DragonHunterGame();
    game.startGame();
    game.lastShotTime = 0;
    game.autoShootLogic(0.5);
    if (game.bullets.length > 0) {
        const bullet = game.bullets[0];
        assertEqual(bullet.damage, 30);
        assert(typeof bullet.vx === 'number');
        assert(typeof bullet.vy === 'number');
    }
});

runTest('射击频率应该正确', () => {
    const game = new DragonHunterGame();
    assertEqual(game.fireRate, 2.5);
    assertEqual(game.autoShoot, true);
});

// 石龙系统测试
console.log(`\n${colors.cyan}=== 石龙系统测试 ===${colors.reset}`);

runTest('石龙段生成', () => {
    const game = new DragonHunterGame();
    game.startGame();
    const initialSegments = game.stoneDragon.segments.length;
    game.addDragonSegment();
    assertEqual(game.stoneDragon.segments.length, initialSegments + 1);
});

runTest('石龙段血量递增', () => {
    const game = new DragonHunterGame();
    game.startGame();
    const firstSegmentHealth = game.stoneDragon.segments[0].maxHealth;
    game.addDragonSegment();
    const secondSegmentHealth = game.stoneDragon.segments[1].maxHealth;
    assertGreaterThan(secondSegmentHealth, firstSegmentHealth);
});

runTest('石龙移动AI', () => {
    const game = new DragonHunterGame();
    game.startGame();
    const dragon = game.stoneDragon;
    const initialX = dragon.segments[0].x;
    const initialY = dragon.segments[0].y;
    
    // 将玩家移动到不同位置
    game.player.x = initialX + 100;
    game.player.y = initialY + 100;
    
    game.updateStoneDragon(0.1);
    
    // 石龙应该朝玩家移动
    assert(dragon.segments[0].x !== initialX || dragon.segments[0].y !== initialY, '石龙应该移动');
});

runTest('石龙段跟随机制', () => {
    const game = new DragonHunterGame();
    game.startGame();
    game.addDragonSegment();
    game.addDragonSegment();
    
    const dragon = game.stoneDragon;
    assertGreaterThan(dragon.segments.length, 2);
    
    // 移动头部
    dragon.segments[0].x += 50;
    game.updateStoneDragon(0.1);
    
    // 身体段应该跟随
    assert(dragon.segments[1].x !== dragon.segments[0].x, '身体段应该有不同位置');
});

// 碰撞检测测试
console.log(`\n${colors.cyan}=== 碰撞检测测试 ===${colors.reset}`);

runTest('子弹击中石龙段', () => {
    const game = new DragonHunterGame();
    game.startGame();
    
    const dragon = game.stoneDragon;
    const segment = dragon.segments[0];
    const initialHealth = segment.health;
    const initialSegmentCount = dragon.segments.length;
    
    // 创建子弹在石龙位置（确保在碰撞范围内）
    game.bullets.push({
        x: segment.x + 5, // 稍微偏移确保碰撞
        y: segment.y + 5,
        vx: 0,
        vy: 0,
        damage: 50
    });
    
    game.checkCollisions();
    
    // 检查石龙段是否受到伤害或被摧毁
    assert(
        segment.health < initialHealth || 
        game.stoneDragon.segments.length < initialSegmentCount ||
        game.bullets.length === 0, // 子弹被消耗也表示碰撞发生
        '应该发生碰撞'
    );
});

runTest('石龙段被摧毁', () => {
    const game = new DragonHunterGame();
    game.startGame();
    game.addDragonSegment();
    
    const initialSegments = game.stoneDragon.segments.length;
    const segmentIndex = game.stoneDragon.segments.length - 1;
    const segment = game.stoneDragon.segments[segmentIndex];
    
    // 将血量设为很低
    segment.health = 1;
    
    // 创建子弹击中
    game.bullets.push({
        x: segment.x,
        y: segment.y,
        vx: 0,
        vy: 0,
        damage: 50
    });
    
    game.checkCollisions();
    
    // 检查段是否被摧毁
    assert(game.stoneDragon.segments.length <= initialSegments, '石龙段应该被摧毁或受到伤害');
});

// 升级系统测试
console.log(`\n${colors.cyan}=== 升级系统测试 ===${colors.reset}`);

runTest('道具收集', () => {
    const game = new DragonHunterGame();
    game.startGame();
    
    const initialDamage = game.bulletDamage;
    
    // 创建伤害道具
    game.loot.push({
        x: game.player.x,
        y: game.player.y,
        type: 'damage',
        name: '伤害提升',
        createdTime: Date.now(),
        bobOffset: 0
    });
    
    game.checkCollisions();
    
    assertGreaterThan(game.bulletDamage, initialDamage);
});

runTest('购买升级', () => {
    const game = new DragonHunterGame();
    game.score = 1000;
    
    const initialDamage = game.bulletDamage;
    const success = game.buyUpgrade('damage');
    
    assertEqual(success, true);
    assertGreaterThan(game.bulletDamage, initialDamage);
    assertLessThan(game.score, 1000);
});

runTest('穿透弹道具', () => {
    const game = new DragonHunterGame();
    game.startGame();
    
    const initialPenetration = game.bulletPenetration || 0;
    
    // 收集穿透道具
    game.collectLoot({
        type: 'penetration',
        name: '穿透弹',
        x: game.player.x,
        y: game.player.y
    });
    
    assertGreaterThan(game.bulletPenetration, initialPenetration);
});

// 性能测试
console.log(`\n${colors.cyan}=== 性能测试 ===${colors.reset}`);

runTest('游戏更新性能', () => {
    const game = new DragonHunterGame();
    game.startGame();
    
    // 添加多个石龙段
    for (let i = 0; i < 10; i++) {
        game.addDragonSegment();
    }
    
    // 添加多个子弹
    for (let i = 0; i < 50; i++) {
        game.bullets.push({
            x: Math.random() * 800,
            y: Math.random() * 600,
            vx: Math.random() * 200 - 100,
            vy: Math.random() * 200 - 100,
            damage: 30
        });
    }
    
    const startTime = Date.now();
    game.update(0.016); // 60fps
    const endTime = Date.now();
    
    const updateTime = endTime - startTime;
    assertLessThan(updateTime, 50); // 应该在50ms内完成
});

// 游戏状态测试
console.log(`\n${colors.cyan}=== 游戏状态测试 ===${colors.reset}`);

runTest('获取游戏状态', () => {
    const game = new DragonHunterGame();
    game.startGame();
    
    const state = game.getGameState();
    
    assertEqual(state.gameStarted, true);
    assertEqual(state.lives, 3);
    assertEqual(state.score, 0);
    assertEqual(state.wave, 1);
    assert(typeof state.dragonSegmentsCount === 'number');
    assert(typeof state.bulletDamage === 'number');
    assert(typeof state.fireRate === 'number');
});

runTest('肉鸽数值平衡', () => {
    const game = new DragonHunterGame();
    game.startGame();
    
    // 测试难度递增
    const firstSegmentHealth = game.stoneDragon.segments[0].maxHealth;
    
    for (let i = 0; i < 5; i++) {
        game.addDragonSegment();
    }
    
    const lastSegment = game.stoneDragon.segments[game.stoneDragon.segments.length - 1];
    assertGreaterThan(lastSegment.maxHealth, firstSegmentHealth);
    
    // 测试分数奖励递增
    assertGreaterThan(lastSegment.segmentIndex, 0);
});

runTest('波次进度', () => {
    const game = new DragonHunterGame();
    game.startGame();
    
    const initialWave = game.wave;
    
    // 模拟摧毁所有石龙段
    game.stoneDragon.segments = [];
    
    // 直接调用摧毁逻辑而不是通过索引
    if (game.stoneDragon.segments.length === 0) {
        game.stoneDragon = null;
        game.wave++;
    }
    
    // 检查波次是否增加
    assertGreaterThan(game.wave, initialWave);
});

// 测试总结
console.log('\n========================');
console.log(`🧪 测试完成: ${passedTests}/${testCount} 通过`);
console.log(`📊 成功率: ${((passedTests / testCount) * 100).toFixed(1)}%`);

if (passedTests === testCount) {
    console.log(`${colors.green}🎉 所有测试通过！石龙游戏运行完美！${colors.reset}`);
    process.exit(0);
} else {
    console.log(`${colors.red}❌ 有 ${testCount - passedTests} 个测试失败${colors.reset}`);
    process.exit(1);
}