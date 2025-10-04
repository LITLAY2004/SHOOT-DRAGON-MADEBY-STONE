#!/usr/bin/env node

/**
 * 验证游戏启动修复
 * 直接测试关键功能是否正常工作
 */

// Mock DOM环境
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><body><canvas id="gameCanvas"></canvas></body></html>');
global.document = dom.window.document;
global.window = dom.window;
global.HTMLCanvasElement = dom.window.HTMLCanvasElement;
global.CanvasRenderingContext2D = dom.window.CanvasRenderingContext2D;
global.Image = dom.window.Image;
global.performance = {
    now: () => Date.now()
};

// Mock canvas方法
require('jest-canvas-mock');

const GameController = require('./src/core/GameController.js');

console.log('='.repeat(60));
console.log('🧪 游戏启动修复验证');
console.log('='.repeat(60));

// 创建canvas
const canvas = document.createElement('canvas');
canvas.width = 800;
canvas.height = 600;

try {
    // 1. 测试GameController创建
    console.log('\n✓ 测试 1/7: 创建GameController...');
    const gameController = new GameController(canvas);
    console.log('  ✅ GameController创建成功');

    // 2. 测试方法存在性
    console.log('\n✓ 测试 2/7: 检查关键方法...');
    const methods = [
        'spawnStoneEnhancementSegment',
        'handleEnhancementSegmentDestroyed',
        'render',
        'renderGame',
        'renderPlayer',
        'renderDragons',
        'start',
        'createDragon'
    ];
    
    for (const method of methods) {
        if (typeof gameController[method] !== 'function') {
            throw new Error(`方法 ${method} 不存在`);
        }
        console.log(`  ✅ ${method} 存在`);
    }

    // 3. 测试创建石龙
    console.log('\n✓ 测试 3/7: 创建石龙...');
    const stoneDragon = gameController.createDragon('stone');
    if (!stoneDragon) {
        throw new Error('创建石龙失败');
    }
    console.log(`  ✅ 石龙创建成功: ${stoneDragon.id}`);
    console.log(`     类型: ${stoneDragon.type}`);
    console.log(`     强化段数组: ${Array.isArray(stoneDragon.enhancementSegments)}`);
    console.log(`     初始强化段数量: ${stoneDragon.enhancementSegments.length}`);

    // 4. 测试强化段创建
    console.log('\n✓ 测试 4/7: 创建强化段...');
    const initialSegments = stoneDragon.enhancementSegments.length;
    gameController.spawnStoneEnhancementSegment(stoneDragon);
    if (stoneDragon.enhancementSegments.length !== initialSegments + 1) {
        throw new Error('强化段创建失败');
    }
    const segment = stoneDragon.enhancementSegments[stoneDragon.enhancementSegments.length - 1];
    console.log(`  ✅ 强化段创建成功: ${segment.id}`);
    console.log(`     生命值: ${segment.health}/${segment.maxHealth}`);
    console.log(`     半径: ${segment.radius}`);
    console.log(`     颜色: ${segment.color}`);

    // 5. 测试强化段销毁
    console.log('\n✓ 测试 5/7: 销毁强化段...');
    const beforeDestroy = stoneDragon.enhancementSegments.length;
    gameController.handleEnhancementSegmentDestroyed(stoneDragon, segment);
    if (stoneDragon.enhancementSegments.length !== beforeDestroy - 1) {
        throw new Error('强化段销毁失败');
    }
    console.log(`  ✅ 强化段销毁成功`);
    console.log(`     销毁前数量: ${beforeDestroy}`);
    console.log(`     销毁后数量: ${stoneDragon.enhancementSegments.length}`);

    // 6. 测试游戏启动
    console.log('\n✓ 测试 6/7: 启动游戏...');
    gameController.start();
    if (!gameController.gameState.gameStarted) {
        throw new Error('游戏启动状态未设置');
    }
    console.log(`  ✅ 游戏启动成功`);
    console.log(`     gameStarted: ${gameController.gameState.gameStarted}`);
    console.log(`     gameOver: ${gameController.gameState.gameOver}`);
    console.log(`     玩家位置: (${gameController.gameState.player.x}, ${gameController.gameState.player.y})`);
    
    const dragons = gameController.gameState.getDragons();
    console.log(`     龙的数量: ${dragons.length}`);
    if (dragons.length > 0) {
        console.log(`     第一只龙类型: ${dragons[0].type}`);
        console.log(`     第一只龙强化段: ${dragons[0].enhancementSegments ? dragons[0].enhancementSegments.length : 'N/A'}`);
    }

    // 7. 测试渲染
    console.log('\n✓ 测试 7/7: 渲染游戏画面...');
    gameController.render();
    console.log(`  ✅ 渲染成功（无异常抛出）`);

    // 测试非石龙拒绝
    console.log('\n✓ 额外测试: 非石龙拒绝...');
    const fireDragon = {
        id: 'fire-test',
        type: 'fire',
        enhancementSegments: []
    };
    gameController.spawnStoneEnhancementSegment(fireDragon);
    if (fireDragon.enhancementSegments.length !== 0) {
        throw new Error('非石龙应该被拒绝创建强化段');
    }
    console.log(`  ✅ 非石龙正确被拒绝`);

    // 成功总结
    console.log('\n' + '='.repeat(60));
    console.log('🎉 所有测试通过！');
    console.log('='.repeat(60));
    console.log('\n✅ 修复内容总结:');
    console.log('   1. ✅ spawnStoneEnhancementSegment 方法已添加');
    console.log('   2. ✅ handleEnhancementSegmentDestroyed 方法已添加');
    console.log('   3. ✅ 石龙能够创建和管理强化段');
    console.log('   4. ✅ 游戏能够正常启动');
    console.log('   5. ✅ 渲染方法正常工作');
    console.log('   6. ✅ 非石龙正确被拒绝');
    console.log('\n💡 建议:');
    console.log('   - 在浏览器中测试游戏以确保完整功能');
    console.log('   - 检查控制台是否有其他错误信息');
    console.log('   - 验证无限模式和闯关模式的UI显示');
    console.log('\n' + '='.repeat(60));
    
    process.exit(0);
} catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ 测试失败！');
    console.error('='.repeat(60));
    console.error(`\n错误: ${error.message}`);
    console.error(`\n堆栈跟踪:`);
    console.error(error.stack);
    console.error('\n' + '='.repeat(60));
    process.exit(1);
}

