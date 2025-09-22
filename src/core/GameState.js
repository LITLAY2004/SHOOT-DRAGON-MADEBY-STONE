/**
 * 游戏状态管理器
 * 负责管理所有游戏数据和状态
 */
class GameState {
    constructor(eventSystem) {
        this.eventSystem = eventSystem;
        this.reset();
    }

    /**
     * 重置游戏状态到初始状态
     */
    reset() {
        // 游戏基础状态
        this.gameStarted = false;
        this.gameOver = false;
        this.isPaused = false;
        this.score = 0;
        this.lives = 3;
        this.wave = 1;
        this.kills = 0;
        this.gameTime = 0;

        // 玩家状态
        this.player = {
            x: 400,
            y: 300,
            radius: 15,
            speed: 200,
            damage: 30,
            health: 100,
            maxHealth: 100,
            weaponElement: 'normal',
            level: 1,
            experience: 0,
            experienceToNext: 100
        };

        // 游戏对象集合
        this.bullets = [];
        this.stoneDragon = null;
        this.dragons = [];
        this.towers = [];
        this.loot = [];
        this.damageNumbers = [];
        this.particles = [];
        this.statusEffects = [];

        // 系统状态
        this.soundEnabled = true;
        this.renderQuality = 'high';
        
        // 成就和统计
        this.achievements = new Map();
        this.statistics = {
            totalKills: 0,
            totalDamageDealt: 0,
            totalDamageTaken: 0,
            elementsKilled: {},
            towersBuilt: 0,
            towersUpgraded: 0
        };

        // 元素击杀统计初始化
        const elements = ['stone', 'fire', 'ice', 'thunder', 'poison', 'dark'];
        elements.forEach(element => {
            this.statistics.elementsKilled[element] = 0;
        });
    }

    // =============== Getters ===============

    /**
     * 获取玩家数据
     */
    getPlayer() {
        return { ...this.player };
    }

    /**
     * 获取所有龙
     */
    getDragons() {
        const allDragons = [];
        if (this.stoneDragon) {
            allDragons.push(this.stoneDragon);
        }
        allDragons.push(...this.dragons);
        return allDragons;
    }

    /**
     * 获取所有塔
     */
    getTowers() {
        return [...this.towers];
    }

    /**
     * 获取所有子弹
     */
    getBullets() {
        return [...this.bullets];
    }

    /**
     * 获取当前分数
     */
    getScore() {
        return this.score;
    }

    /**
     * 获取当前波次
     */
    getWave() {
        return this.wave;
    }

    /**
     * 获取游戏时间
     */
    getGameTime() {
        return this.gameTime;
    }

    /**
     * 获取游戏统计数据
     */
    getStatistics() {
        return { ...this.statistics };
    }

    /**
     * 获取粒子系统数据
     */
    getParticles() {
        return [...this.particles];
    }

    /**
     * 获取伤害数字
     */
    getDamageNumbers() {
        return [...this.damageNumbers];
    }

    /**
     * 获取战利品
     */
    getLoot() {
        return [...this.loot];
    }

    // =============== Setters ===============

    /**
     * 设置玩家数据
     * @param {Object} playerData - 玩家数据
     */
    setPlayer(playerData) {
        this.player = { ...this.player, ...playerData };
        this.notifyChange('player', this.player);
    }

    /**
     * 更新分数
     * @param {number} points - 增加的分数
     */
    updateScore(points) {
        this.score += points;
        this.notifyChange('score', this.score);
        this.eventSystem.emit('SCORE_UPDATE', this.score, points);
    }

    /**
     * 增加波次
     */
    incrementWave() {
        this.wave++;
        this.notifyChange('wave', this.wave);
        this.eventSystem.emit('WAVE_START', this.wave);
    }

    /**
     * 更新游戏时间
     * @param {number} deltaTime - 时间增量
     */
    updateGameTime(deltaTime) {
        this.gameTime += deltaTime;
        this.notifyChange('gameTime', this.gameTime);
    }

    /**
     * 设置游戏状态
     * @param {string} state - 状态类型 ('started', 'paused', 'over')
     * @param {boolean} value - 状态值
     */
    setGameState(state, value) {
        switch (state) {
            case 'started':
                this.gameStarted = value;
                break;
            case 'paused':
                this.isPaused = value;
                break;
            case 'over':
                this.gameOver = value;
                break;
        }
        this.notifyChange(state, value);
    }

    // =============== 实体管理 ===============

    /**
     * 添加龙
     * @param {Object} dragon - 龙对象
     */
    addDragon(dragon) {
        if (dragon.type === 'stone') {
            this.stoneDragon = dragon;
        } else {
            this.dragons.push(dragon);
        }
        this.notifyChange('dragons', this.getDragons());
    }

    /**
     * 移除龙
     * @param {Object} dragon - 龙对象
     */
    removeDragon(dragon) {
        if (dragon === this.stoneDragon) {
            this.stoneDragon = null;
        } else {
            const index = this.dragons.indexOf(dragon);
            if (index !== -1) {
                this.dragons.splice(index, 1);
            }
        }
        this.notifyChange('dragons', this.getDragons());
    }

    /**
     * 添加塔
     * @param {Object} tower - 塔对象
     */
    addTower(tower) {
        this.towers.push(tower);
        this.statistics.towersBuilt++;
        this.notifyChange('towers', this.towers);
    }

    /**
     * 移除塔
     * @param {Object} tower - 塔对象
     */
    removeTower(tower) {
        const index = this.towers.indexOf(tower);
        if (index !== -1) {
            this.towers.splice(index, 1);
            this.notifyChange('towers', this.towers);
        }
    }

    /**
     * 添加子弹
     * @param {Object} bullet - 子弹对象
     */
    addBullet(bullet) {
        this.bullets.push(bullet);
    }

    /**
     * 移除子弹
     * @param {Object} bullet - 子弹对象
     */
    removeBullet(bullet) {
        const index = this.bullets.indexOf(bullet);
        if (index !== -1) {
            this.bullets.splice(index, 1);
        }
    }

    /**
     * 添加粒子
     * @param {Object} particle - 粒子对象
     */
    addParticle(particle) {
        this.particles.push(particle);
    }

    /**
     * 清理死亡粒子
     */
    cleanupParticles() {
        this.particles = this.particles.filter(p => p.life > 0);
    }

    /**
     * 添加伤害数字
     * @param {Object} damageNumber - 伤害数字对象
     */
    addDamageNumber(damageNumber) {
        this.damageNumbers.push(damageNumber);
    }

    /**
     * 清理过期的伤害数字
     */
    cleanupDamageNumbers() {
        this.damageNumbers = this.damageNumbers.filter(dn => dn.life > 0);
    }

    // =============== 统计数据管理 ===============

    /**
     * 记录击杀
     * @param {string} dragonType - 龙类型
     */
    recordKill(dragonType) {
        this.kills++;
        this.statistics.totalKills++;
        if (this.statistics.elementsKilled[dragonType] !== undefined) {
            this.statistics.elementsKilled[dragonType]++;
        }
        this.notifyChange('kills', this.kills);
    }

    /**
     * 记录伤害
     * @param {number} damage - 伤害值
     * @param {string} type - 伤害类型 ('dealt' 或 'taken')
     */
    recordDamage(damage, type) {
        if (type === 'dealt') {
            this.statistics.totalDamageDealt += damage;
        } else if (type === 'taken') {
            this.statistics.totalDamageTaken += damage;
        }
    }

    /**
     * 记录塔升级
     */
    recordTowerUpgrade() {
        this.statistics.towersUpgraded++;
    }

    // =============== 成就管理 ===============

    /**
     * 解锁成就
     * @param {string} achievementId - 成就ID
     * @param {Object} achievementData - 成就数据
     */
    unlockAchievement(achievementId, achievementData) {
        if (!this.achievements.has(achievementId)) {
            this.achievements.set(achievementId, {
                ...achievementData,
                unlockedAt: Date.now()
            });
            this.notifyChange('achievements', this.achievements);
            this.eventSystem.emit('ACHIEVEMENT_UNLOCK', achievementId, achievementData);
        }
    }

    /**
     * 检查成就是否已解锁
     * @param {string} achievementId - 成就ID
     * @returns {boolean}
     */
    isAchievementUnlocked(achievementId) {
        return this.achievements.has(achievementId);
    }

    /**
     * 获取已解锁的成就
     * @returns {Array}
     */
    getUnlockedAchievements() {
        return Array.from(this.achievements.entries()).map(([id, data]) => ({
            id,
            ...data
        }));
    }

    // =============== 内部方法 ===============

    /**
     * 通知状态变更
     * @param {string} key - 变更的键
     * @param {any} value - 新值
     */
    notifyChange(key, value) {
        this.eventSystem.emit('STATE_CHANGE', key, value);
    }

    /**
     * 获取完整状态快照
     * @returns {Object}
     */
    getSnapshot() {
        return {
            gameStarted: this.gameStarted,
            gameOver: this.gameOver,
            isPaused: this.isPaused,
            score: this.score,
            lives: this.lives,
            wave: this.wave,
            kills: this.kills,
            gameTime: this.gameTime,
            player: { ...this.player },
            statistics: { ...this.statistics },
            achievements: Array.from(this.achievements.entries())
        };
    }

    /**
     * 从快照恢复状态
     * @param {Object} snapshot - 状态快照
     */
    restoreFromSnapshot(snapshot) {
        Object.assign(this, snapshot);
        this.achievements = new Map(snapshot.achievements);
        this.bullets = [];
        this.dragons = [];
        this.towers = [];
        this.particles = [];
        this.damageNumbers = [];
        this.loot = [];
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameState;
}
