/**
 * 游戏进度和解锁系统
 * 负责管理关卡进度、成就、解锁内容等
 */

class ProgressionSystem {
    constructor(gameInstance, options = {}) {
        this.game = gameInstance;
        this.silent = options.silent || false;
        
        // 默认玩家数据结构（需先初始化，供后续加载逻辑使用）
        this.defaultPlayerData = {
            // 基础信息
            playerLevel: 1,
            totalExperience: 0,
            totalPlayTime: 0,
            
            // 关卡进度
            completedLevels: [],
            levelStats: {}, // 每关的详细统计
            currentChapter: 1,
            unlockedChapters: [1],
            
            // 无限模式记录
            endlessRecords: {
                bestWave: 0,
                bestScore: 0,
                bestTime: 0,
                bestCombo: 0,
                totalRuns: 0,
                totalKills: 0
            },
            
            // 技能解锁
            unlockedSkills: ['basic_shot', 'fireball'],
            skillUpgrades: {},
            availableSkillPoints: 0,
            
            // 成就系统
            achievements: [],
            achievementProgress: {},
            
            // 装备和物品
            unlockedEquipment: [],
            currentLoadout: {
                weapon: 'basic_blaster',
                armor: 'basic_suit',
                accessory: null
            },
            
            // 设置和偏好
            settings: {
                difficulty: 'normal',
                soundVolume: 0.8,
                musicVolume: 0.6,
                showDamageNumbers: true,
                autoUpgrade: false
            },
            
            // 统计数据
            statistics: {
                totalKills: 0,
                totalDamageDealt: 0,
                totalDamageTaken: 0,
                totalGamesPlayed: 0,
                totalTimePlayed: 0,
                favoriteSkill: null,
                highestLevel: 1
            }
        };
        
        // 兼容测试所需的进度数据结构（legacy）
        // tests 期望存在 progressionSystem.data 以及 loadProgress/saveProgress 接口
        this.data = {
            completedLevels: [],
            totalMoney: 0,
            totalKills: 0,
            gamesPlayed: 0
        };

        // 先加载玩家数据与测试期望的进度数据
        this.playerData = this.loadPlayerData();
        this.loadProgress(this.silent);

        // 确保数据完整性
        this.validatePlayerData();
        
        // 成就定义
        this.achievements = [
            {
                id: 'first_kill',
                name: '初次击杀',
                description: '击败你的第一个敌人',
                icon: '💀',
                requirements: { totalKills: 1 },
                rewards: { experience: 50, skillPoints: 1 }
            },
            {
                id: 'level_5',
                name: '新手猎手',
                description: '达到5级',
                icon: '⭐',
                requirements: { playerLevel: 5 },
                rewards: { experience: 100, skillPoints: 2 }
            },
            {
                id: 'complete_tutorial',
                name: '教程完成',
                description: '完成新手教程',
                icon: '🎓',
                requirements: { completedLevels: ['tutorial'] },
                rewards: { experience: 200, skillPoints: 3 }
            },
            {
                id: 'hundred_kills',
                name: '屠夫',
                description: '累计击杀100个敌人',
                icon: '🔥',
                requirements: { totalKills: 100 },
                rewards: { experience: 500, skillPoints: 5 }
            },
            {
                id: 'endless_wave_10',
                name: '生存专家',
                description: '在无限模式中坚持到第10波',
                icon: '🌊',
                requirements: { endlessBestWave: 10 },
                rewards: { experience: 300, skillPoints: 3 }
            },
            {
                id: 'perfect_level',
                name: '完美执行',
                description: '在任意关卡中无伤通关',
                icon: '💎',
                requirements: { perfectLevelClears: 1 },
                rewards: { experience: 400, skillPoints: 4 }
            },
            {
                id: 'skill_master',
                name: '技能大师',
                description: '解锁所有技能',
                icon: '🧙‍♂️',
                requirements: { unlockedSkillsCount: 12 },
                rewards: { experience: 1000, skillPoints: 10 }
            },
            {
                id: 'chapter_1_complete',
                name: '第一章征服者',
                description: '完成第一章所有关卡',
                icon: '🏆',
                requirements: { chaptersCompleted: [1] },
                rewards: { experience: 800, skillPoints: 8 }
            }
        ];
        
        this.setupEventListeners();
    }

    /**
     * 加载玩家数据
     */
    loadPlayerData() {
        try {
            const saved = localStorage.getItem('tower_defense_player_data');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (error) {
            console.error('加载玩家数据失败:', error);
        }
        
        return { ...this.defaultPlayerData };
    }

    /**
     * 保存玩家数据
     */
    savePlayerData() {
        try {
            localStorage.setItem('tower_defense_player_data', JSON.stringify(this.playerData));
            console.log('💾 玩家数据已保存');
            return true;
        } catch (error) {
            console.error('保存玩家数据失败:', error);
            return false;
        }
    }

    /**
     * 验证和修复玩家数据
     */
    validatePlayerData() {
        // 深度合并默认数据，确保所有字段存在
        this.playerData = this.deepMerge(this.defaultPlayerData, this.playerData);
        
        // 数据验证和修复
        if (this.playerData.playerLevel < 1) {
            this.playerData.playerLevel = 1;
        }
        
        if (!Array.isArray(this.playerData.completedLevels)) {
            this.playerData.completedLevels = [];
        }
        
        if (!Array.isArray(this.playerData.achievements)) {
            this.playerData.achievements = [];
        }
        
        // 保存修复后的数据
        this.savePlayerData();
    }

    /**
     * 兼容测试：加载关卡与统计进度（legacy API）
     * localStorage key: 'towerDefenseProgress'
     * @param {boolean} silent - 是否静默模式（不输出错误日志）
     */
    loadProgress(silent = false) {
        try {
            const saved = localStorage.getItem('towerDefenseProgress');
            if (saved) {
                const parsed = JSON.parse(saved);
                // 兜底默认结构
                this.data = {
                    completedLevels: Array.isArray(parsed.completedLevels) ? parsed.completedLevels : [],
                    totalMoney: Number(parsed.totalMoney || 0),
                    totalKills: Number(parsed.totalKills || 0),
                    gamesPlayed: Number(parsed.gamesPlayed || 0)
                };
            } else {
                // 无存档时初始化默认
                this.data = {
                    completedLevels: [],
                    totalMoney: 0,
                    totalKills: 0,
                    gamesPlayed: 0
                };
            }
        } catch (e) {
            // 只在非静默模式下输出错误信息
            if (!silent) {
                console.error('加载关卡进度失败:', e);
            }
            this.data = {
                completedLevels: [],
                totalMoney: 0,
                totalKills: 0,
                gamesPlayed: 0
            };
        }
        return this.data;
    }

    /**
     * 兼容测试：保存关卡与统计进度（legacy API）
     */
    saveProgress() {
        try {
            localStorage.setItem('towerDefenseProgress', JSON.stringify(this.data));
            return true;
        } catch (e) {
            console.error('保存关卡进度失败:', e);
            return false;
        }
    }

    /**
     * 深度合并对象
     */
    deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(target[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }

    /**
     * 设置事件监听
     */
    setupEventListeners() {
        if (this.game && this.game.eventSystem) {
            this.game.eventSystem.on('enemy_killed', (enemy) => {
                this.onEnemyKilled(enemy);
            });
            
            this.game.eventSystem.on('level_completed', (levelData) => {
                this.onLevelCompleted(levelData);
            });
            
            this.game.eventSystem.on('player_level_up', (newLevel) => {
                this.onPlayerLevelUp(newLevel);
            });
            
            this.game.eventSystem.on('skill_unlocked', (skillId) => {
                this.onSkillUnlocked(skillId);
            });
            
            this.game.eventSystem.on('endless_mode_ended', (stats) => {
                this.onEndlessModeEnded(stats);
            });
            
            this.game.eventSystem.on('player_damaged', (damage) => {
                this.onPlayerDamaged(damage);
            });
        }
    }

    /**
     * 关卡完成处理
     */
    onLevelCompleted(levelData) {
        const { levelId, stats, rewards, perfect } = levelData;
        
        // 记录关卡完成
        if (!this.playerData.completedLevels.includes(levelId)) {
            this.playerData.completedLevels.push(levelId);
            console.log(`🎯 关卡 ${levelId} 首次完成！`);
        }
        
        // 更新关卡统计
        if (!this.playerData.levelStats[levelId]) {
            this.playerData.levelStats[levelId] = {
                completions: 0,
                bestTime: Infinity,
                bestScore: 0,
                perfectClears: 0,
                totalAttempts: 0
            };
        }
        
        const levelStats = this.playerData.levelStats[levelId];
        levelStats.completions++;
        levelStats.totalAttempts++;
        
        if (stats.time < levelStats.bestTime) {
            levelStats.bestTime = stats.time;
        }
        
        if (stats.score > levelStats.bestScore) {
            levelStats.bestScore = stats.score;
        }
        
        if (perfect) {
            levelStats.perfectClears++;
            this.updateAchievementProgress('perfectLevelClears', 1);
        }
        
        // 奖励经验和技能点
        this.addExperience(rewards.experience || 0);
        this.addSkillPoints(rewards.skillPoints || 0);
        
        // 检查章节解锁
        this.checkChapterUnlocks();
        
        // 检查成就
        this.checkAchievements();
        
        this.savePlayerData();
    }

    /**
     * 敌人击杀处理
     */
    onEnemyKilled(enemy) {
        this.playerData.statistics.totalKills++;
        this.updateAchievementProgress('totalKills', 1);
        
        // 添加经验值
        const experience = enemy.experience || 5;
        this.addExperience(experience);
        
        // 检查成就
        this.checkAchievements();
    }

    /**
     * 玩家升级处理
     */
    onPlayerLevelUp(newLevel) {
        this.playerData.playerLevel = newLevel;
        this.playerData.statistics.highestLevel = Math.max(
            this.playerData.statistics.highestLevel, 
            newLevel
        );
        
        // 每次升级奖励技能点
        this.addSkillPoints(1);
        
        // 检查等级相关成就
        this.updateAchievementProgress('playerLevel', newLevel);
        this.checkAchievements();
        
        this.savePlayerData();
    }

    /**
     * 技能解锁处理
     */
    onSkillUnlocked(skillId) {
        if (!this.playerData.unlockedSkills.includes(skillId)) {
            this.playerData.unlockedSkills.push(skillId);
            console.log(`✨ 技能解锁: ${skillId}`);
            
            // 检查技能相关成就
            this.updateAchievementProgress('unlockedSkillsCount', this.playerData.unlockedSkills.length);
            this.checkAchievements();
            
            this.savePlayerData();
        }
    }

    /**
     * 无限模式结束处理
     */
    onEndlessModeEnded(stats) {
        const records = this.playerData.endlessRecords;
        
        // 更新最佳记录
        if (stats.wave > records.bestWave) {
            records.bestWave = stats.wave;
        }
        
        if (stats.score > records.bestScore) {
            records.bestScore = stats.score;
        }
        
        if (stats.survivalTime > records.bestTime) {
            records.bestTime = stats.survivalTime;
        }
        
        if (stats.maxCombo > records.bestCombo) {
            records.bestCombo = stats.maxCombo;
        }
        
        records.totalRuns++;
        records.totalKills += stats.kills;
        
        // 检查无限模式成就
        this.updateAchievementProgress('endlessBestWave', records.bestWave);
        this.checkAchievements();
        
        this.savePlayerData();
    }

    /**
     * 玩家受伤处理
     */
    onPlayerDamaged(damage) {
        this.playerData.statistics.totalDamageTaken += damage;
    }

    /**
     * 添加经验值
     */
    addExperience(amount) {
        this.playerData.totalExperience += amount;
        
        // 触发经验值更新事件
        if (this.game.eventSystem) {
            this.game.eventSystem.emit('experience_gained', {
                amount: amount,
                total: this.playerData.totalExperience
            });
        }
    }

    /**
     * 添加技能点
     */
    addSkillPoints(amount) {
        this.playerData.availableSkillPoints += amount;
        
        if (this.game.eventSystem) {
            this.game.eventSystem.emit('skill_points_gained', {
                amount: amount,
                total: this.playerData.availableSkillPoints
            });
        }
    }

    /**
     * 检查章节解锁
     */
    checkChapterUnlocks() {
        // 获取当前章节的所有关卡
        const chapter1Levels = LevelConfig.getLevelsByChapter(1);
        const chapter1Complete = chapter1Levels.every(level => 
            this.playerData.completedLevels.includes(level.id)
        );
        
        if (chapter1Complete && !this.playerData.unlockedChapters.includes(2)) {
            this.playerData.unlockedChapters.push(2);
            this.updateAchievementProgress('chaptersCompleted', [1]);
            
            console.log('🎉 第二章已解锁！');
            
            if (this.game.eventSystem) {
                this.game.eventSystem.emit('chapter_unlocked', { chapter: 2 });
            }
        }
    }

    /**
     * 更新成就进度
     */
    updateAchievementProgress(key, value) {
        if (typeof value === 'number') {
            this.playerData.achievementProgress[key] = 
                (this.playerData.achievementProgress[key] || 0) + value;
        } else {
            this.playerData.achievementProgress[key] = value;
        }
    }

    /**
     * 检查成就
     */
    checkAchievements() {
        for (const achievement of this.achievements) {
            // 跳过已获得的成就
            if (this.playerData.achievements.includes(achievement.id)) {
                continue;
            }
            
            // 检查成就条件
            let unlocked = true;
            
            for (const [reqKey, reqValue] of Object.entries(achievement.requirements)) {
                const playerValue = this.getPlayerValue(reqKey);
                
                if (Array.isArray(reqValue)) {
                    // 数组类型要求（如章节完成）
                    if (!Array.isArray(playerValue) || 
                        !reqValue.every(val => playerValue.includes(val))) {
                        unlocked = false;
                        break;
                    }
                } else if (typeof reqValue === 'number') {
                    // 数值类型要求
                    if (playerValue < reqValue) {
                        unlocked = false;
                        break;
                    }
                } else {
                    // 其他类型要求
                    if (playerValue !== reqValue) {
                        unlocked = false;
                        break;
                    }
                }
            }
            
            if (unlocked) {
                this.unlockAchievement(achievement);
            }
        }
    }

    /**
     * 获取玩家数据值
     */
    getPlayerValue(key) {
        switch (key) {
            case 'totalKills':
                return this.playerData.statistics.totalKills;
            case 'playerLevel':
                return this.playerData.playerLevel;
            case 'completedLevels':
                return this.playerData.completedLevels;
            case 'endlessBestWave':
                return this.playerData.endlessRecords.bestWave;
            case 'perfectLevelClears':
                return this.playerData.achievementProgress.perfectLevelClears || 0;
            case 'unlockedSkillsCount':
                return this.playerData.unlockedSkills.length;
            case 'chaptersCompleted':
                return this.playerData.achievementProgress.chaptersCompleted || [];
            default:
                return this.playerData.achievementProgress[key] || 0;
        }
    }

    /**
     * 解锁成就
     */
    unlockAchievement(achievement) {
        this.playerData.achievements.push(achievement.id);
        
        // 给予奖励
        if (achievement.rewards.experience) {
            this.addExperience(achievement.rewards.experience);
        }
        
        if (achievement.rewards.skillPoints) {
            this.addSkillPoints(achievement.rewards.skillPoints);
        }
        
        console.log(`🏆 成就解锁: ${achievement.name} - ${achievement.description}`);
        
        // 触发成就解锁事件
        if (this.game.eventSystem) {
            this.game.eventSystem.emit('achievement_unlocked', achievement);
        }
        
        this.savePlayerData();
    }

    /**
     * 检查关卡是否解锁
     */
    isLevelUnlocked(levelId) {
        const level = LevelConfig.getLevel(levelId);
        if (!level) return false;
        
        // 第一关总是解锁的
        if (levelId === 1) return true;
        
        // 检查前置关卡
        if (level.prerequisites) {
            return level.prerequisites.every(reqId => 
                this.playerData.completedLevels.includes(reqId)
            );
        }
        
        // 默认检查上一关
        return this.playerData.completedLevels.includes(levelId - 1);
    }

    /**
     * 检查章节是否解锁
     */
    isChapterUnlocked(chapter) {
        return this.playerData.unlockedChapters.includes(chapter);
    }

    /**
     * 获取关卡统计
     */
    getLevelStats(levelId) {
        return this.playerData.levelStats[levelId] || {
            completions: 0,
            bestTime: 0,
            bestScore: 0,
            perfectClears: 0,
            totalAttempts: 0
        };
    }

    /**
     * 获取玩家数据
     */
    getPlayerData() {
        return { ...this.playerData };
    }

    /**
     * 获取成就列表
     */
    getAchievements() {
        return this.achievements.map(achievement => ({
            ...achievement,
            unlocked: this.playerData.achievements.includes(achievement.id),
            progress: this.getAchievementProgress(achievement)
        }));
    }

    /**
     * 获取成就进度
     */
    getAchievementProgress(achievement) {
        const progress = {};
        
        for (const [reqKey, reqValue] of Object.entries(achievement.requirements)) {
            const playerValue = this.getPlayerValue(reqKey);
            
            if (typeof reqValue === 'number') {
                progress[reqKey] = {
                    current: playerValue,
                    required: reqValue,
                    percentage: Math.min(100, (playerValue / reqValue) * 100)
                };
            }
        }
        
        return progress;
    }

    /**
     * 重置玩家数据（仅开发模式）
     */
    resetPlayerData() {
        if (confirm('确定要重置所有进度吗？此操作不可撤销！')) {
            this.playerData = { ...this.defaultPlayerData };
            this.savePlayerData();
            console.log('🔄 玩家数据已重置');
            
            if (this.game.eventSystem) {
                this.game.eventSystem.emit('player_data_reset');
            }
        }
    }

    /**
     * 导出玩家数据
     */
    exportPlayerData() {
        const data = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            data: this.playerData
        };
        
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `tower_defense_save_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        console.log('💾 玩家数据已导出');
    }

    /**
     * 导入玩家数据
     */
    importPlayerData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                
                if (imported.version && imported.data) {
                    this.playerData = imported.data;
                    this.validatePlayerData();
                    console.log('📥 玩家数据导入成功');
                    
                    if (this.game.eventSystem) {
                        this.game.eventSystem.emit('player_data_imported');
                    }
                } else {
                    throw new Error('无效的存档文件格式');
                }
            } catch (error) {
                console.error('导入玩家数据失败:', error);
                alert('导入失败：' + error.message);
            }
        };
        
        reader.readAsText(file);
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProgressionSystem;
} else if (typeof window !== 'undefined') {
    window.ProgressionSystem = ProgressionSystem;
}
