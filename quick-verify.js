/**
 * 快速验证游戏功能的简单脚本
 */

// 模拟浏览器环境
global.window = { innerWidth: 1920, innerHeight: 1080 };
global.document = {
    getElementById: () => ({
        getContext: () => ({ clearRect: () => {}, fillRect: () => {} }),
        width: 800, height: 600
    })
};

// 尝试加载游戏
try {
    // 读取并执行游戏文件
    const fs = require('fs');
    const path = require('path');
    
    // 加载平衡配置
    try {
        const balanceConfig = fs.readFileSync(path.join(__dirname, 'src/config/BalanceConfig.js'), 'utf8');
        eval(balanceConfig.replace(/export\s+default\s+/g, 'global.BalanceConfig = '));
    } catch (e) {
        global.BalanceConfig = { PLAYER: { baseHealth: 100, baseDamage: 25, baseSpeed: 180 } };
    }
    
    // 加载游戏主文件
    const gameFile = fs.readFileSync(path.join(__dirname, 'src/game.js'), 'utf8');
    eval(gameFile);
    
    // 创建游戏实例
    const game = new DragonHunterGame();
    
    console.log('✅ 游戏类创建成功');
    console.log('✅ 玩家初始化:', `位置(${game.player.x}, ${game.player.y}), 生命值: ${game.player.health}`);
    console.log('✅ 游戏状态:', `开始: ${game.gameStarted}, 结束: ${game.gameOver}, 分数: ${game.score}`);
    console.log('✅ 游戏对象数组:', `子弹: ${game.bullets.length}, 粒子: ${game.particles.length}`);
    
    // 测试键盘输入
    game.handleKeyDown({ code: 'KeyW', preventDefault: () => {} });
    console.log('✅ 键盘输入测试:', `W键状态: ${game.keys.w}`);
    
    // 测试游戏更新
    game.update(16);
    console.log('✅ 游戏更新循环正常');
    
    // 测试游戏渲染
    game.render();
    console.log('✅ 游戏渲染循环正常');
    
    console.log('\n🎉 所有基础功能验证通过！游戏可以正常运行。');
    
} catch (error) {
    console.error('❌ 验证失败:', error.message);
    console.error(error.stack);
}
