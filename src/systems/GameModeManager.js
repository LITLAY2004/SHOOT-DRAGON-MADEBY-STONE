/**
 * 游戏模式管理器
 * 处理不同游戏模式的逻辑和状态管理
 */

class GameModeManager {
    constructor(game) {
        this.game = game;
        this.currentMode = null;
        this.currentLevel = null;
        this.levelProgress = {};
        this.endlessWave = 1;
        this.objectives = {};
        this.completedLevels = this.loadProgress();
        
        // 补充闯关状态（供测试使用）
        this.currentKills = 0;
        this.deaths = 0;
        this.levelStartTime = null;
        
        // 绑定事件
        this.setupEventListeners();
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 监听敌人击败事件
        if (this.game && this.game.eventSystem) {
            this.game.eventSystem.on('enemy_killed', (enemy) => {
                this.onEnemyKilled(enemy);
            });
            
            this.game.eventSystem.on('player_died', () => {
                this.onPlayerDied();
            });
            
            this.game.eventSystem.on('wave_complete', (waveNumber) => {
                this.onWaveComplete(waveNumber);
            });
            
            // 游戏结束事件（用于清理状态）
            this.game.eventSystem.on('game_over', () => {
                this.stopCurrentMode();
            });
        }
    }

    /**
     * 启动指定游戏模式
     */
    startMode(mode, levelId = null) {
        this.currentMode = mode;
        
        switch (mode) {
            case LevelConfig.GAME_MODES.ADVENTURE:
                return this.startAdventureMode(levelId);
            case LevelConfig.GAME_MODES.ENDLESS:
                return this.startEndlessMode();
            case LevelConfig.GAME_MODES.SURVIVAL:
                return this.startSurvivalMode();
            default:
                console.error('未知的游戏模式:', mode);
                return false;
        }
    }

    /**
     * 启动闯关模式
     */
    startAdventureMode(levelId) {
        if (!LevelConfig.isLevelUnlocked(levelId, this.completedLevels)) {
            console.warn('关卡未解锁:', levelId);
            return false;
        }

        const levelConfig = LevelConfig.getLevel(levelId);
        if (!levelConfig) {
            console.error('关卡配置不存在:', levelId);
            return false;
        }

        this.currentMode = LevelConfig.GAME_MODES.ADVENTURE;
        this.currentLevel = levelConfig;
        
        // 初始化闯关状态
        this.currentKills = 0;
        this.deaths = 0;
        this.levelStartTime = Date.now();
        this.setupLevelObjectives(levelConfig);
        this.setupLevelEnvironment(levelConfig);
        this.setupLevelEnemies(levelConfig);
        
        // UI 更新
        if (this.game.ui) {
            if (typeof this.game.ui.updateObjectives === 'function') {
                this.game.ui.updateObjectives(this.objectives);
            }
            if (typeof this.game.ui.hideModeSelection === 'function') {
                this.game.ui.hideModeSelection();
            }
        }
        
        // 发送模式开始事件
        if (this.game.eventSystem) {
            try {
                this.game.eventSystem.emit('mode_started', {
                    mode: this.currentMode,
                    level: this.currentLevel
                });
            } catch (e) {
                // 测试里可能会模拟错误
            }
        }
        
        console.log(`开始关卡: ${levelConfig.name}`);
        return true;
    }

    /**
     * 启动无限模式
     */
    startEndlessMode(difficulty = 'normal') {
        console.log('🌊 启动无限模式');
        
        // 清理闯关模式临时状态
        this.currentKills = 0;
        this.deaths = 0;
        this.levelStartTime = null;
        
        // 重置游戏环境（空值安全）
        if (this.game && this.game.waveManager && typeof this.game.waveManager.clearEnemies === 'function') {
            this.game.waveManager.clearEnemies();
        }
        if (this.game && this.game.towerManager && typeof this.game.towerManager.clearTowers === 'function') {
            this.game.towerManager.clearTowers();
        }
        
        this.currentMode = LevelConfig.GAME_MODES.ENDLESS;
        this.currentLevel = null;
        this.endlessWave = 1;
        
        // 设置游戏为无限模式
        this.game.isEndlessMode = true;
        
        // 初始化无限模式
        if (typeof EndlessMode !== 'undefined') {
            // 复用外部注入的实例，或创建新实例
            this.endlessMode = this.endlessMode || new EndlessMode(this.game);
            const ok = this.endlessMode.start(difficulty || this.game.endlessDifficulty || 'normal');
            if (!ok) {
                console.error('无限模式启动失败');
                this.currentMode = null;
                return false;
            }
            
            // 显示无限模式UI
            const endlessUI = document.getElementById('endlessModeUI');
            if (endlessUI) {
                endlessUI.classList.remove('hidden');
            }
        } else {
            console.error('EndlessMode 类未找到');
            return false;
        }
        
        this.setupEndlessMode();
        
        // 发送模式开始事件
        if (this.game.eventSystem) {
            try {
                this.game.eventSystem.emit('mode_started', {
                    mode: this.currentMode,
                    level: null
                });
            } catch (e) {}
        }
        
        return true;
    }

    /**
     * 启动生存模式
     */
    startSurvivalMode() {
        this.currentLevel = null;
        const config = LevelConfig.SURVIVAL_MODE_CONFIG;
        this.setupSurvivalMode(config);
        
        console.log('开始生存模式');
        return true;
    }

    /**
     * 设置关卡目标
     */
    setupLevelObjectives(levelConfig) {
        this.objectives = {
            killCount: 0,
            targetKills: levelConfig.objectives.killCount,
            surviveTime: 0,
            targetSurviveTime: levelConfig.objectives.surviveTime,
            deaths: 0,
            maxDeaths: levelConfig.objectives.maxDeaths,
            specialConditions: {},
            completed: false
        };

        // 设置特殊条件
        levelConfig.objectives.specialConditions.forEach(condition => {
            this.objectives.specialConditions[condition] = false;
        });

        // 启动生存时间计时器
        this.survivalTimer = setInterval(() => {
            this.objectives.surviveTime++;
            this.checkObjectives();
        }, 1000);
    }

    /**
     * 设置关卡环境
     */
    setupLevelEnvironment(levelConfig) {
        const env = levelConfig.environment;
        
        // 设置背景主题
        if (this.game.backgroundEffects) {
            this.game.backgroundEffects.setTheme(env.backgroundTheme);
        }
        
        // 设置环境效果
        if (env.ambientEffects && this.game.particleSystem) {
            env.ambientEffects.forEach(effect => {
                this.game.particleSystem.addAmbientEffect(effect);
            });
        }
        
        // 设置音乐（如果有音频系统）
        if (this.game.audioSystem) {
            this.game.audioSystem.playBackgroundMusic(env.musicTrack);
        }
    }

    /**
     * 设置关卡敌人配置
     */
    setupLevelEnemies(levelConfig) {
        const enemies = levelConfig.enemyWaves;
        
        // 设置敌人生成参数
        this.game.enemySpawnRate = enemies.spawnRate;
        this.game.maxConcurrentEnemies = enemies.maxConcurrent;
        this.game.totalWaves = enemies.totalWaves;
        this.game.currentWave = 1;
        
        // 设置可生成的敌人类型
        this.game.availableEnemyTypes = enemies.types;
        
        // 设置Boss波
        if (enemies.bossWave) {
            this.game.bossWaveConfig = enemies.bossWave;
        }
        
        // 设置环境危险
        if (enemies.environmentalHazards) {
            this.setupEnvironmentalHazards(enemies.environmentalHazards);
        }
    }

    /**
     * 设置无限模式
     */
    setupEndlessMode() {
        const config = LevelConfig.ENDLESS_MODE_CONFIG;
        
        // 初始化基础配置
        this.game.enemySpawnRate = 2000;
        this.game.maxConcurrentEnemies = 3;
        this.game.availableEnemyTypes = ['basic'];
        
        // 设置环境
        if (this.game.backgroundEffects) {
            this.game.backgroundEffects.setTheme(config.environment.backgroundTheme);
        }
        
        // 启动波次缩放系统
        this.startEndlessScaling();
    }

    /**
     * 启动无限模式缩放系统
     */
    startEndlessScaling() {
        this.game.eventSystem.on('wave_complete', (waveNumber) => {
            this.scaleEndlessMode(waveNumber);
        });
    }

    /**
     * 缩放无限模式难度
     */
    scaleEndlessMode(waveNumber) {
        this.endlessWave = waveNumber;
        
        // 计算新的敌人属性
        const baseStats = {
            health: 50,
            damage: 15,
            speed: 60,
            spawnRate: this.game.enemySpawnRate,
            maxEnemies: this.game.maxConcurrentEnemies
        };
        
        const scaledStats = LevelConfig.calculateEndlessWaveStats(waveNumber, baseStats);
        
        // 应用缩放后的属性
        this.game.enemySpawnRate = scaledStats.spawnRate;
        this.game.maxConcurrentEnemies = scaledStats.maxEnemies;
        
        // 更新敌人模板属性
        this.updateEnemyTemplateStats(scaledStats);
        
        // 检查特殊波次
        const specialWave = LevelConfig.getSpecialWaveType(waveNumber);
        if (specialWave) {
            this.handleSpecialWave(specialWave, waveNumber);
        }
        
        // 给予奖励
        this.giveEndlessRewards(waveNumber);
    }

    /**
     * 更新敌人模板属性
     */
    updateEnemyTemplateStats(scaledStats) {
        // 更新所有敌人类型的基础属性
        Object.keys(this.game.enemyTypes || {}).forEach(type => {
            const template = this.game.enemyTypes[type];
            template.health = Math.floor(template.baseHealth * (scaledStats.health / 50));
            template.damage = Math.floor(template.baseDamage * (scaledStats.damage / 15));
            template.speed = Math.floor(template.baseSpeed * (scaledStats.speed / 60));
        });
    }

    /**
     * 处理特殊波次
     */
    handleSpecialWave(specialWave, waveNumber) {
        console.log(`特殊波次 ${waveNumber}: ${specialWave.type}`);
        
        switch (specialWave.type) {
            case 'boss_wave':
                this.spawnEndlessBoss(specialWave.multiplier);
                break;
            case 'elemental_chaos':
                this.enableElementalChaos();
                break;
            case 'speed_demon':
                this.enableSpeedMode(specialWave.multiplier);
                break;
            case 'ultimate_boss':
                this.spawnUltimateBoss();
                break;
        }
    }

    /**
     * 事件处理：敌人被击败
     */
    onEnemyKilled(enemy) {
        if (this.currentMode === LevelConfig.GAME_MODES.ADVENTURE && this.objectives) {
            this.objectives.killCount++;
            this.currentKills = (this.currentKills || 0) + 1;
            
            // 检查特殊击败条件
            if (enemy.type === 'fire_dragon') {
                this.objectives.specialConditions['defeat_fire_dragon'] = true;
            } else if (enemy.type === 'ancient_dragon') {
                this.objectives.specialConditions['defeat_ancient_dragon'] = true;
            }
            
            this.checkObjectives();
        }
    }

    /**
     * 事件处理：玩家死亡
     */
    onPlayerDied() {
        if (this.currentMode === LevelConfig.GAME_MODES.ADVENTURE && this.objectives) {
            this.objectives.deaths++;
            this.deaths = (this.deaths || 0) + 1;
            
            if (this.objectives.deaths >= this.objectives.maxDeaths) {
                this.failLevel();
            }
        }
    }

    /**
     * 事件处理：波次完成
     */
    onWaveComplete(waveNumber) {
        if (this.currentMode === LevelConfig.GAME_MODES.ADVENTURE) {
            if (waveNumber >= this.currentLevel.enemyWaves.totalWaves) {
                // 检查是否完成了所有目标
                this.checkObjectives();
            }
        }
    }

    /**
     * 获取当前关卡生存时间（单位：秒）
     */
    getSurvivalTime() {
        if (!this.levelStartTime) return 0;
        return Math.floor((Date.now() - this.levelStartTime) / 1000);
    }

    /**
     * 检查关卡目标（供测试）
     */
    checkLevelObjectives() {
        if (!this.currentLevel) return false;
        const obj = this.currentLevel.objectives;
        const killsOk = (this.currentKills || 0) >= obj.killCount;
        const timeOk = this.getSurvivalTime() >= obj.surviveTime;
        const lifeOk = (this.deaths || 0) <= obj.maxDeaths;
        return killsOk && timeOk && lifeOk;
    }

    /**
     * 是否关卡失败（供测试）
     */
    isLevelFailed() {
        if (!this.currentLevel) return false;
        const obj = this.currentLevel.objectives;
        return (this.deaths || 0) > obj.maxDeaths;
    }

    /**
     * 完成关卡并发放奖励（供测试）
     */
    completeLevelWithRewards(levelId) {
        const level = LevelConfig.getLevel(levelId);
        if (!level || !this.progressionSystem) return false;
        
        // 更新进度系统数据
        const data = this.progressionSystem.data || { completedLevels: [], totalMoney: 0, totalKills: 0, gamesPlayed: 0 };
        if (!data.completedLevels.includes(levelId)) {
            data.completedLevels.push(levelId);
        }
        data.totalMoney = (data.totalMoney || 0) + (level.rewards.coins || 0);
        data.totalKills = (data.totalKills || 0) + (this.currentKills || 0);
        data.gamesPlayed = (data.gamesPlayed || 0) + 1;
        
        this.progressionSystem.data = data;
        try { this.progressionSystem.saveProgress(); } catch (e) {}
        
        return true;
    }

    /**
     * 显示关卡完成界面（供测试）
     */
    onLevelComplete() {
        if (this.game && this.game.ui && typeof this.game.ui.showLevelComplete === 'function') {
            this.game.ui.showLevelComplete();
        }
    }

    /**
     * 停止当前模式（供测试/切换使用）
     */
    stopCurrentMode() {
        // 清理计时器
        if (this.survivalTimer) {
            clearInterval(this.survivalTimer);
            this.survivalTimer = null;
        }
        
        // 停止无限模式
        if (this.currentMode === LevelConfig.GAME_MODES.ENDLESS && this.endlessMode && typeof this.endlessMode.stop === 'function') {
            this.endlessMode.stop();
        }
        
        const prevMode = this.currentMode;
        this.currentMode = null;
        this.currentLevel = null;
        
        if (this.game && this.game.eventSystem) {
            try { this.game.eventSystem.emit('mode_stopped', { mode: prevMode }); } catch (e) {}
        }
    }

    /**
     * 检查关卡目标是否完成
     */
    checkObjectives() {
        if (!this.objectives || this.objectives.completed) return;
        
        const obj = this.objectives;
        let allCompleted = true;
        
        // 检查击杀数量
        if (obj.killCount < obj.targetKills) {
            allCompleted = false;
        }
        
        // 检查生存时间
        if (obj.surviveTime < obj.targetSurviveTime) {
            allCompleted = false;
        }
        
        // 检查特殊条件
        Object.values(obj.specialConditions).forEach(completed => {
            if (!completed) allCompleted = false;
        });
        
        if (allCompleted) {
            this.completeLevel();
        }
    }

    /**
     * 完成关卡
     */
    completeLevel() {
        if (!this.currentLevel) return;
        
        this.objectives.completed = true;
        
        // 清理计时器
        if (this.survivalTimer) {
            clearInterval(this.survivalTimer);
        }
        
        // 记录完成的关卡
        if (!this.completedLevels.includes(this.currentLevel.id)) {
            this.completedLevels.push(this.currentLevel.id);
            this.saveProgress();
        }
        
        // 给予奖励
        this.giveRewards(this.currentLevel.rewards);
        
        // 触发完成事件
        if (this.game.eventSystem) {
            this.game.eventSystem.emit('level_completed', {
                levelId: this.currentLevel.id,
                level: this.currentLevel,
                objectives: this.objectives
            });
        }
        
        console.log(`关卡完成: ${this.currentLevel.name}`);
    }

    /**
     * 关卡失败
     */
    failLevel() {
        // 清理计时器
        if (this.survivalTimer) {
            clearInterval(this.survivalTimer);
        }
        
        // 触发失败事件
        if (this.game.eventSystem) {
            this.game.eventSystem.emit('level_failed', {
                levelId: this.currentLevel?.id,
                objectives: this.objectives
            });
        }
        
        console.log('关卡失败');
    }

    /**
     * 给予奖励
     */
    giveRewards(rewards) {
        if (rewards.coins && this.game.gameState) {
            this.game.gameState.money += rewards.coins;
        }
        
        if (rewards.experience && this.game.player) {
            this.game.player.experience += rewards.experience;
        }
        
        if (rewards.skillPoints && this.game.skillSystem) {
            this.game.skillSystem.skillPoints += rewards.skillPoints;
        }
        
        // 特殊奖励处理
        if (rewards.specialReward) {
            this.handleSpecialReward(rewards.specialReward);
        }
    }

    /**
     * 给予无限模式奖励
     */
    giveEndlessRewards(waveNumber) {
        const config = LevelConfig.ENDLESS_MODE_CONFIG.rewards;
        
        // 基础奖励
        const coins = config.baseCoinsPerWave * waveNumber;
        const experience = config.baseExperiencePerWave * waveNumber;
        
        this.giveRewards({ coins, experience });
        
        // 里程碑奖励
        const milestoneReward = config.milestoneRewards[waveNumber];
        if (milestoneReward) {
            this.giveRewards(milestoneReward);
            console.log(`里程碑奖励！波次 ${waveNumber}`);
        }
    }

    /**
     * 处理特殊奖励
     */
    handleSpecialReward(rewardType) {
        switch (rewardType) {
            case 'fire_skill_unlock':
                // 解锁火元素技能
                break;
            case 'ice_skill_unlock':
                // 解锁冰元素技能
                break;
            case 'lightning_skill_unlock':
                // 解锁雷电技能
                break;
            case 'ancient_power_unlock':
                // 解锁古老力量
                break;
        }
    }

    /**
     * 获取当前进度信息
     */
    getProgressInfo() {
        return {
            currentMode: this.currentMode,
            currentLevel: this.currentLevel?.id || null,
            completedLevels: [...this.completedLevels],
            objectives: this.objectives,
            endlessWave: this.endlessWave
        };
    }

    /**
     * 保存进度
     */
    saveProgress() {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('tower_defense_progress', JSON.stringify(this.completedLevels));
        }
    }

    /**
     * 加载进度
     */
    loadProgress() {
        if (typeof localStorage !== 'undefined') {
            const saved = localStorage.getItem('tower_defense_progress');
            return saved ? JSON.parse(saved) : [];
        }
        return [];
    }

    /**
     * 重置进度
     */
    resetProgress() {
        this.completedLevels = [];
        this.saveProgress();
    }

    /**
     * 获取可用关卡列表
     */
    getAvailableLevels() {
        return LevelConfig.getAllLevels().map(level => ({
            ...level,
            unlocked: LevelConfig.isLevelUnlocked(level.id, this.completedLevels),
            completed: this.completedLevels.includes(level.id)
        }));
    }
    
    /**
     * 重置游戏模式管理器
     * 在游戏重启时调用
     */
    reset() {
        // 重置当前状态
        this.currentMode = null;
        this.currentLevel = null;
        this.levelProgress = {};
        this.endlessWave = 1;
        this.objectives = {};
        
        // 重置游戏模式标志
        if (this.game) {
            this.game.isEndlessMode = false;
            this.game.isSurvivalMode = false;
            this.game.isAdventureMode = false;
        }
        
        console.log('🔄 GameModeManager: 游戏模式管理器已重置');
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameModeManager;
} else if (typeof window !== 'undefined') {
    window.GameModeManager = GameModeManager;
}
