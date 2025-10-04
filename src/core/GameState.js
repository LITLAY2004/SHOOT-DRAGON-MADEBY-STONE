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
        const playerConfig = (typeof BalanceConfig !== 'undefined' && BalanceConfig.PLAYER) ? BalanceConfig.PLAYER : null;
        const startMana = playerConfig?.startMana ?? 100;
        const maxMana = playerConfig?.maxMana ?? 100;
        const manaRegenRate = playerConfig?.manaRegenRate ?? 10;

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
            experienceToNext: 100,
            mana: startMana,
            maxMana,
            manaRegenRate,
            shield: null,
            invulnerableTimer: 0,
            lastDashDirection: null
        };

        this.permanentUpgrades = {
            attackBonus: 0,
            maxHealthBonus: 0,
            manaRegenBonus: 0,
            skillMasteryLevel: 0,
            skillMasteryBonus: 0,
            attackSpeedBonus: 0,
            movementBonus: 0,
            attackBonusFromRewards: 0,
            manaBonus: 0
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

        // 资源状态
        this.resources = {
            crystals: startMana
        };

        // 连击与增益状态
        this.combo = {
            count: 0,
            best: 0,
            timeRemaining: 0,
            window: 6,
            multiplier: 1,
            experienceMultiplier: 1
        };
        this.waveModifier = null;
        this.perks = [];

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
     * 获取玩家数据（返回引用，允许直接修改）
     */
    getPlayer() {
        return this.player;
    }

    /**
     * 获取所有龙
     */
    getDragons() {
        if (this.stoneDragon) {
            const nonStone = this.dragons.filter(dragon => dragon !== this.stoneDragon);
            return [this.stoneDragon, ...nonStone];
        }
        return [...this.dragons];
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

    /**
     * 获取资源信息
     */
    getResources() {
        return { ...this.resources };
    }

    getComboState() {
        return { ...this.combo };
    }

    setComboState(state) {
        this.combo = {
            ...this.combo,
            ...(state || {})
        };
        this.notifyChange('combo', { ...this.combo });
    }

    getWaveModifier() {
        return this.waveModifier ? { ...this.waveModifier } : null;
    }

    setWaveModifier(modifier) {
        this.waveModifier = modifier ? { ...modifier } : null;
        this.notifyChange('waveModifier', this.waveModifier);
    }

    getPerks() {
        return [...this.perks];
    }

    addPerk(perk) {
        if (!perk) {
            return;
        }
        this.perks.push(perk);
        this.notifyChange('perks', [...this.perks]);
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
        if (!dragon) {
            return;
        }

        if (dragon.type === 'stone') {
            this.stoneDragon = dragon;
        }

        if (!this.dragons.includes(dragon)) {
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
        }
        // 从dragons数组中移除(包括石龙)
        const index = this.dragons.indexOf(dragon);
        if (index !== -1) {
            this.dragons.splice(index, 1);
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

    addLoot(loot) {
        if (!loot) {
            return;
        }
        this.loot.push(loot);
        this.notifyChange('loot', this.getLoot());
    }

    removeLoot(loot) {
        const index = this.loot.indexOf(loot);
        if (index !== -1) {
            this.loot.splice(index, 1);
            this.notifyChange('loot', this.getLoot());
        }
    }

    updateLoot(loot, updates) {
        if (!loot || !updates) {
            return;
        }
        const index = this.loot.indexOf(loot);
        if (index === -1) {
            return;
        }
        this.loot[index] = {
            ...this.loot[index],
            ...updates
        };
        this.notifyChange('loot', this.getLoot());
    }

    collectLoot(loot) {
        if (!loot) {
            return null;
        }
        this.removeLoot(loot);
        if (loot.type && loot.type !== 'ability_upgrade') {
            this.addResource(loot.type, loot.value || 0);
        }
        return this.getResources();
    }

    addResource(type, amount) {
        if (!type || typeof amount !== 'number') {
            return this.getResources();
        }

        if (typeof this.resources[type] !== 'number') {
            this.resources[type] = 0;
        }

        this.resources[type] = Math.max(0, this.resources[type] + amount);
        this.syncResourceToPlayer(type);
        this.notifyChange('resources', this.getResources());
        this.eventSystem.emit('RESOURCE_UPDATE', {
            type,
            amount,
            total: this.resources[type],
            resources: this.getResources()
        });
        return this.getResources();
    }

    spendResource(type, amount) {
        if (typeof amount !== 'number' || amount <= 0) {
            return false;
        }
        if (typeof this.resources[type] !== 'number') {
            return false;
        }
        if (this.resources[type] < amount) {
            return false;
        }

        this.resources[type] -= amount;
        this.resources[type] = Math.max(0, this.resources[type]);
        this.syncResourceToPlayer(type);
        this.notifyChange('resources', this.getResources());
        this.eventSystem.emit('RESOURCE_UPDATE', {
            type,
            amount: -amount,
            total: this.resources[type],
            resources: this.getResources()
        });
        return true;
    }

    syncResourceToPlayer(type) {
        if (type !== 'crystals' || !this.player) {
            return;
        }

        const maxMana = typeof this.player.maxMana === 'number' ? this.player.maxMana : undefined;
        let manaValue = this.resources.crystals;
        if (!Number.isFinite(manaValue)) {
            manaValue = 0;
        }
        if (typeof maxMana === 'number' && Number.isFinite(maxMana)) {
            manaValue = Math.min(maxMana, manaValue);
        }
        manaValue = Math.max(0, manaValue);
        this.player.mana = manaValue;
        this.notifyChange('player', this.player);
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

    calculateExperienceForLevel(level) {
        const exp = 100 * Math.pow(1.35, Math.max(0, level - 1));
        return Math.max(50, Math.floor(exp));
    }

    addExperience(amount) {
        if (typeof amount !== 'number' || amount <= 0) {
            return { levelUps: [] };
        }

        const player = this.player;
        player.experience += amount;
        this.notifyChange('experience', player.experience);

        const levelUps = [];
        while (player.experience >= player.experienceToNext) {
            player.experience -= player.experienceToNext;
            player.level += 1;
            player.experienceToNext = this.calculateExperienceForLevel(player.level);
            levelUps.push(player.level);
        }

        if (levelUps.length) {
            this.notifyChange('player', this.player);
            levelUps.forEach(level => {
                this.eventSystem.emit('PLAYER_LEVEL_UP', {
                    level,
                    player: { ...this.player }
                });
            });
        }

        return { levelUps };
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
            combo: { ...this.combo },
            waveModifier: this.waveModifier ? { ...this.waveModifier } : null,
            perks: [...this.perks],
            resources: { ...this.resources },
            statistics: { ...this.statistics },
            achievements: Array.from(this.achievements.entries())
        };
    }

    /**
     * 序列化游戏状态（测试所需）
     * @returns {Object}
     */
    serialize() {
        return this.getSnapshot();
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
        this.combo = snapshot.combo ? { ...snapshot.combo } : this.combo;
        this.waveModifier = snapshot.waveModifier ? { ...snapshot.waveModifier } : null;
        this.perks = Array.isArray(snapshot.perks) ? [...snapshot.perks] : [];
        if (snapshot.resources) {
            this.resources = { ...this.resources, ...snapshot.resources };
        }
    }
}

// 导出模块
if (typeof module === 'object' && module && module.exports) {
    module.exports = GameState;
}
if (typeof globalThis !== 'undefined') {
    globalThis.GameState = GameState;
}
