/**
 * 重构后的游戏入口文件
 * 保持与原版game.js的兼容性，但使用新的模块化架构
 */

(function setupDragonHunter(global) {
    const canRequire = typeof module === 'object' && module && !module.__browser && module.exports && typeof require === 'function';
    const existing = global && global.DragonHunterGame;

    if (existing && !canRequire) {
        if (typeof module === 'object' && module && module.exports) {
            module.exports = existing;
        }
        return;
    }

    // 导入所有必要的模块
    // 注意：在浏览器环境中，这些文件需要按顺序加载
    const ResolvedGameController = canRequire
        ? require('./core/GameController.js')
        : (typeof GameController !== 'undefined' ? GameController : null);

    if (!ResolvedGameController) {
        throw new Error('GameController module is not available');
    }

    /**
     * 数字龙猎游戏类 - 重构版本
     * 兼容原有接口，使用新架构实现
     */
    class DragonHunterGame {
    constructor(canvas = null) {
        console.log('初始化重构版游戏...');
        
        // 初始化游戏控制器
        this.gameController = new ResolvedGameController(canvas);
        
        // 保持兼容性的属性映射
        this.setupCompatibilityLayer();
        
        console.log('重构版游戏初始化完成');
    }

    /**
     * 设置兼容性层，保持原有接口
     */
    setupCompatibilityLayer() {
        // 基本属性映射
        Object.defineProperty(this, 'canvas', {
            get: () => this.gameController.canvas
        });
        
        Object.defineProperty(this, 'ctx', {
            get: () => this.gameController.ctx
        });
        
        Object.defineProperty(this, 'width', {
            get: () => this.gameController.width
        });
        
        Object.defineProperty(this, 'height', {
            get: () => this.gameController.height
        });

        // 游戏状态映射
        Object.defineProperty(this, 'gameStarted', {
            get: () => this.gameController.gameState.gameStarted,
            set: (value) => this.gameController.gameState.setGameState('started', value)
        });
        
        Object.defineProperty(this, 'gameOver', {
            get: () => this.gameController.gameState.gameOver,
            set: (value) => this.gameController.gameState.setGameState('over', value)
        });
        
        Object.defineProperty(this, 'isPaused', {
            get: () => this.gameController.gameState.isPaused,
            set: (value) => this.gameController.gameState.setGameState('paused', value)
        });
        
        Object.defineProperty(this, 'score', {
            get: () => this.gameController.gameState.getScore(),
            set: (value) => this.gameController.gameState.score = value
        });
        
        Object.defineProperty(this, 'lives', {
            get: () => this.gameController.gameState.lives,
            set: (value) => this.gameController.gameState.lives = value
        });
        
        Object.defineProperty(this, 'wave', {
            get: () => this.gameController.gameState.getWave(),
            set: (value) => this.gameController.gameState.wave = value
        });
        
        Object.defineProperty(this, 'kills', {
            get: () => this.gameController.gameState.kills,
            set: (value) => this.gameController.gameState.kills = value
        });

        // 玩家属性映射
        Object.defineProperty(this, 'player', {
            get: () => this.gameController.gameState.player,
            set: (value) => this.gameController.gameState.setPlayer(value)
        });

        // 实体数组映射
        Object.defineProperty(this, 'bullets', {
            get: () => this.gameController.gameState.getBullets()
        });
        
        Object.defineProperty(this, 'stoneDragon', {
            get: () => this.gameController.gameState.stoneDragon,
            set: (value) => this.gameController.gameState.stoneDragon = value
        });
        
        Object.defineProperty(this, 'dragons', {
            get: () => this.gameController.gameState.dragons
        });
        
        Object.defineProperty(this, 'loot', {
            get: () => this.gameController.gameState.getLoot()
        });
        
        Object.defineProperty(this, 'damageNumbers', {
            get: () => this.gameController.gameState.getDamageNumbers()
        });
        
        Object.defineProperty(this, 'particles', {
            get: () => this.gameController.gameState.getParticles()
        });

        Object.defineProperty(this, 'enhancementSystem', {
            get: () => this.gameController.enhancementSystem
        });

        Object.defineProperty(this, 'resourceSystem', {
            get: () => this.gameController.resourceSystem
        });

        Object.defineProperty(this, 'shopSystem', {
            get: () => this.gameController.shopSystem
        });

        Object.defineProperty(this, 'eventSystem', {
            get: () => this.gameController.eventSystem
        });

        Object.defineProperty(this, 'resources', {
            get: () => this.gameController.gameState.getResources()
        });

        Object.defineProperty(this, 'abilitySystem', {
            get: () => this.gameController.abilitySystem
        });

        Object.defineProperty(this, 'abilities', {
            get: () => this.gameController.abilitySystem
                ? this.gameController.abilitySystem.getAbilityStatus()
                : []
        });

        Object.defineProperty(this, 'skillSystem', {
            get: () => null,
            set: () => {}
        });

        // 系统设置映射
        Object.defineProperty(this, 'soundEnabled', {
            get: () => this.gameController.gameState.soundEnabled,
            set: (value) => this.gameController.gameState.soundEnabled = value
        });

        // 配置映射 - 为了兼容性保留
        this.dragonElements = this.gameController.elementSystem.getAllElements();
        
        // 成就系统映射
        Object.defineProperty(this, 'achievements', {
            get: () => {
                const unlockedAchievements = this.gameController.gameState.getUnlockedAchievements();
                const achievementMap = new Map();
                unlockedAchievements.forEach(achievement => {
                    achievementMap.set(achievement.id, achievement);
                });
                return achievementMap;
            }
        });
    }

    // ==================== 兼容性方法 ====================

    /**
     * 开始游戏 - 兼容接口
     */
    startGame() {
        this.gameController.start();
    }

    /**
     * 原版别名：start()
     */
    start() {
        return this.startGame();
    }

    /**
     * 设置难度（暴露给外部入口）
     */
    setDifficulty(difficulty = 'normal', options = {}) {
        this.endlessDifficulty = difficulty;
        if (this.gameController && typeof this.gameController.setDifficulty === 'function') {
            this.gameController.setDifficulty(difficulty, options);
        }
    }

    configureAdventureLevel(levelConfig = null) {
        if (this.gameController && typeof this.gameController.configureAdventureLevel === 'function') {
            this.gameController.configureAdventureLevel(levelConfig);
        }
    }

    /**
     * 暂停游戏 - 兼容接口
     */
    pauseGame() {
        this.gameController.pause();
    }

    /**
     * 恢复游戏 - 兼容接口
     */
    resumeGame() {
        this.gameController.resume();
    }

    /**
     * 重启游戏 - 兼容接口
     */
    restartGame() {
        this.gameController.restart();
    }

    /**
     * 原版别名：restart()
     */
    restart() {
        return this.restartGame();
    }

    /**
     * 游戏循环 - 兼容接口
     */
    gameLoop(currentTime) {
        this.gameController.gameLoop(currentTime);
    }

    /**
     * 更新游戏逻辑 - 兼容接口
     */
    update(deltaTime) {
        this.gameController.update(deltaTime);
    }

    /**
     * 渲染游戏 - 兼容接口
     */
    render() {
        this.gameController.render();
    }

    /**
     * 处理输入 - 兼容接口
     */
    handleInput(inputData) {
        this.gameController.handleInput(inputData);
    }

    // ==================== 元素相关兼容方法 ====================

    /**
     * 获取随机元素类型 - 兼容接口
     */
    getRandomDragonType(waveNumber = 1) {
        return this.gameController.elementSystem.getRandomElement(waveNumber);
    }

    /**
     * 计算元素伤害 - 兼容接口
     */
    calculateElementalDamage(attackerElement, targetElement, baseDamage) {
        const effectiveness = this.gameController.elementSystem.getEffectiveness(attackerElement, targetElement);
        return baseDamage * effectiveness;
    }

    /**
     * 应用元素效果 - 兼容接口
     */
    applyElementEffect(target, element, strength = 1.0) {
        this.gameController.elementSystem.applyElementEffect(target, element, strength);
    }

    // ==================== 龙相关兼容方法 ====================

    /**
     * 生成石龙 - 兼容接口
     */
    spawnStoneDragon() {
        const dragon = this.gameController.createDragon('stone');
        this.gameController.gameState.addDragon(dragon);
        return dragon;
    }

    /**
     * 生成普通龙 - 兼容接口
     */
    spawnDragon(element = null) {
        const wave = this.gameController.gameState.getWave();
        const dragonType = element || this.getRandomDragonType(wave);
        const dragon = this.gameController.createDragon(dragonType);
        this.gameController.gameState.addDragon(dragon);
        return dragon;
    }

    /**
     * 创建多元素龙 - 兼容接口
     */
    createMultiElementDragon(element, x, y) {
        const dragon = this.gameController.createDragon(element);
        dragon.x = x;
        dragon.y = y;
        return dragon;
    }

    // ==================== 战斗相关兼容方法 ====================

    /**
     * 子弹击中龙 - 兼容接口
     */
    bulletHitDragon(bullet, dragon) {
        this.gameController.handleBulletHit(bullet, dragon);
    }

    /**
     * 玩家攻击 - 兼容接口
     */
    playerAttack() {
        this.gameController.playerAttack(this.player);
    }

    /**
     * 兼容旧版 shoot 接口
     * @param {number} targetX
     * @param {number} targetY
     */
    shoot(targetX = null, targetY = null) {
        const player = this.player;
        if (!player) {
            return null;
        }

        if (typeof targetX === 'number' && typeof targetY === 'number') {
            const element = player.weaponElement || player.element || 'normal';
            return this.createBullet(player.x, player.y, targetX, targetY, player.damage, element);
        }

        this.playerAttack();
        return null;
    }

    /**
     * 检查碰撞 - 兼容接口
     */
    checkCollisions() {
        this.gameController.handleCollisions();
    }

    /**
     * 创建子弹 - 兼容接口
     */
    createBullet(x, y, targetX, targetY, damage = 30, element = 'normal') {
        const angle = Math.atan2(targetY - y, targetX - x);
        const bullet = {
            id: Date.now() + Math.random(),
            x: x,
            y: y,
            vx: Math.cos(angle) * 400,
            vy: Math.sin(angle) * 400,
            damage: damage,
            element: element,
            radius: 3,
            life: 2.0
        };
        
        this.gameController.gameState.addBullet(bullet);
        return bullet;
    }

    // ==================== UI相关兼容方法 ====================

    /**
     * 添加伤害数字 - 兼容接口
     */
    addDamageNumber(x, y, damage, isPlayer = false, isUpgrade = false) {
        let effectiveness = 1.0;
        if (isUpgrade) effectiveness = 2.0; // 升级用金色显示
        
        this.gameController.addDamageNumber(x, y, damage, effectiveness, isPlayer);
    }

    /**
     * 创建粒子 - 兼容接口
     */
    createParticles(x, y, count = 10, color = '#FFFFFF') {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = 50 + Math.random() * 100;
            
            const particle = {
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                size: 2 + Math.random() * 4,
                life: 1.0 + Math.random() * 1.0,
                maxLife: 2.0,
                gravity: 50
            };
            
            this.gameController.gameState.addParticle(particle);
        }
    }

    // ==================== 音效相关兼容方法 ====================

    /**
     * 播放音效 - 兼容接口
     */
    playSound(soundName) {
        this.gameController.eventSystem.emit('SOUND_PLAY', {
            name: soundName,
            volume: this.soundEnabled ? 1.0 : 0.0
        });
    }

    // ==================== 成就相关兼容方法 ====================

    /**
     * 检查成就 - 兼容接口
     */
    checkAchievements() {
        // 通过事件系统触发成就检查
        this.gameController.eventSystem.emit('CHECK_ACHIEVEMENTS', {
            gameState: this.gameController.gameState.getSnapshot()
        });
    }

    /**
     * 解锁成就 - 兼容接口
     */
    unlockAchievement(achievementId, achievementData) {
        this.gameController.gameState.unlockAchievement(achievementId, achievementData);
    }

    // ==================== 塔相关兼容方法 ====================

    /**
     * 建造塔 - 兼容接口
     */
    buildTower(x, y, type = 'basic') {
        const tower = {
            id: Date.now() + Math.random(),
            x: x,
            y: y,
            type: type,
            level: 1,
            damage: 20,
            range: 100,
            attackSpeed: 1.0,
            element: 'normal',
            lastAttackTime: 0,
            size: 15
        };
        
        this.gameController.gameState.addTower(tower);
        return tower;
    }

    /**
     * 升级塔 - 兼容接口
     */
    upgradeTower(tower) {
        if (!tower) return false;
        
        const upgradeCost = tower.level * 100;
        if (this.score >= upgradeCost) {
            tower.level++;
            tower.damage *= 1.2;
            tower.range *= 1.1;
            tower.attackSpeed *= 1.1;
            tower.size = Math.min(tower.size * 1.1, 20);
            
            this.gameController.gameState.updateScore(-upgradeCost);
            this.gameController.gameState.recordTowerUpgrade();
            
            this.addDamageNumber(tower.x, tower.y, `升级! Lv.${tower.level}`, false, true);
            this.playSound('upgrade');
            
            this.gameController.eventSystem.emit('TOWER_UPGRADE', tower);
            return true;
        }
        
        return false;
    }

    // ==================== 工具方法 ====================

    /**
     * 计算距离 - 兼容接口
     */
    getDistance(obj1, obj2) {
        return Math.sqrt(Math.pow(obj2.x - obj1.x, 2) + Math.pow(obj2.y - obj1.y, 2));
    }

    /**
     * 检查碰撞 - 兼容接口
     */
    checkCollision(obj1, obj2) {
        const distance = this.getDistance(obj1, obj2);
        return distance <= (obj1.radius + obj2.radius);
    }

    /**
     * 获取游戏统计 - 兼容接口
     */
    getGameStatistics() {
        return this.gameController.getStatistics();
    }

    /**
     * 获取完整游戏状态 - 兼容旧版
     */
    getGameState() {
        if (typeof this.gameController.getState === 'function') {
            return this.gameController.getState();
        }
        return this.gameController.gameState.getSnapshot();
    }

    /**
     * 保存游戏状态 - 兼容接口
     */
    saveGameState() {
        const state = this.gameController.getState();
        localStorage.setItem('dragonHunterSave', JSON.stringify(state));
        return state;
    }

    /**
     * 加载游戏状态 - 兼容接口
     */
    loadGameState() {
        try {
            const savedState = localStorage.getItem('dragonHunterSave');
            if (savedState) {
                const state = JSON.parse(savedState);
                this.gameController.setState(state);
                return true;
            }
        } catch (error) {
            console.error('加载游戏状态失败:', error);
        }
        return false;
    }

    // ==================== 扩展功能 ====================

    /**
     * 获取元素克制信息 - 新功能
     */
    getElementEffectiveness(attackElement, targetElement) {
        return this.gameController.elementSystem.getEffectiveness(attackElement, targetElement);
    }

    /**
     * 获取元素配置 - 新功能
     */
    getElementConfig(elementType) {
        return this.gameController.elementSystem.getElement(elementType);
    }

    /**
     * 获取活跃元素效果 - 新功能
     */
    getActiveElementEffects() {
        return this.gameController.elementSystem.activeEffects;
    }

    /**
     * 强制触发事件 - 新功能
     */
    triggerEvent(eventName, data) {
        this.gameController.eventSystem.emit(eventName, data);
    }

    /**
     * 注册事件监听器 - 新功能
     */
    addEventListener(eventName, callback) {
        this.gameController.eventSystem.on(eventName, callback);
    }

    /**
     * 移除事件监听器 - 新功能
     */
    removeEventListener(eventName, callback) {
        this.gameController.eventSystem.off(eventName, callback);
    }

    /**
     * 获取系统引用 - 新功能（用于高级用法）
     */
    getSystem(systemName) {
        switch (systemName) {
            case 'element':
                return this.gameController.elementSystem;
            case 'event':
                return this.gameController.eventSystem;
            case 'state':
                return this.gameController.gameState;
            case 'enhancement':
                return this.gameController.enhancementSystem;
            case 'controller':
                return this.gameController;
            default:
                return null;
        }
    }

    // ==================== 调试方法 ====================

    /**
     * 调试信息 - 新功能
     */
    getDebugInfo() {
        return {
            version: '2.0.0-refactored',
            architecture: 'modular',
            systems: Object.keys(this.gameController.systems),
            gameState: this.gameController.gameState.getSnapshot(),
            performance: {
                entities: {
                    dragons: this.dragons.length,
                    bullets: this.bullets.length,
                    particles: this.particles.length,
                    damageNumbers: this.damageNumbers.length
                }
            }
        };
    }

    /**
     * 性能监控 - 新功能
     */
    getPerformanceStats() {
        return {
            frameTime: this.gameController.deltaTime,
            entityCount: this.dragons.length + this.bullets.length + this.particles.length,
            activeEffects: this.gameController.elementSystem.activeEffects.size,
            eventListeners: this.gameController.eventSystem.getListenerCount('*')
        };
    }
    }

    // 为了兼容性，也创建旧的类名别名
    if (global) {
        global.DragonHunterGame = DragonHunterGame;
    }

    // 导出模块
    if (typeof module === 'object' && module && module.exports) {
        module.exports = DragonHunterGame;
    }
}(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this)));
