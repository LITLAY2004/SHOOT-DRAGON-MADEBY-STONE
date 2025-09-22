/**
 * 游戏平衡配置
 * 统一管理所有数值平衡参数
 */
class BalanceConfig {
    /**
     * 玩家相关配置
     */
    static PLAYER = {
        // 基础属性
        baseHealth: 100,
        baseDamage: 25, // 降低基础伤害，增强技能重要性
        baseSpeed: 180, // 略微降低移动速度
        baseFireRate: 300, // 降低基础射速（毫秒间隔）
        
        // 升级成长
        healthPerLevel: 15,
        damagePerLevel: 3,
        speedPerLevel: 8,
        fireRateImprovement: 0.9, // 每级射速提升10%
        
        // 生存性
        startLives: 3,
        maxLives: 5,
        invincibilityFrames: 1000, // 受伤后无敌时间（毫秒）
        
        // 资源系统
        startMana: 50,
        maxMana: 150,
        manaRegenRate: 12, // 每秒回复法力
    };

    /**
     * 敌人基础配置
     */
    static ENEMIES = {
        dragon: {
            // 基础属性（第1波）
            baseHealth: 45,
            baseDamage: 15,
            baseSpeed: 35,
            baseReward: 80,
            
            // 每波成长率（调整为更平衡的成长）
            healthGrowth: 15, // 每波+15血量（降低）
            damageGrowth: 2,  // 每波+2伤害（降低）
            speedGrowth: 1.5, // 每波+1.5速度（降低）
            rewardGrowth: 18, // 每波+18分数（提高）
            
            // 成长上限
            maxSpeed: 120,
            maxDamage: 80,
            
            // 特殊配置
            segmentHealthRatio: 0.8, // 龙段血量为头部的80%
            segmentDamageRatio: 0.6, // 龙段伤害为头部的60%
            
            // 龙技能系统配置
            skills: {
                // 激光扫射技能
                laserSweep: {
                    cooldown: 8.0,      // 冷却时间（秒）
                    duration: 2.0,      // 持续时间（秒）
                    damage: 35,         // 激光伤害
                    sweepAngle: Math.PI / 3, // 扫射角度（60度）
                    sweepSpeed: Math.PI / 2, // 扫射速度（90度/秒）
                    laserWidth: 15,     // 激光宽度
                    range: 400,         // 激光射程
                    triggerChance: 0.25 // 触发概率（25%）
                },
                
                // 冲撞攻击技能
                chargeAttack: {
                    cooldown: 12.0,     // 冷却时间（秒）
                    chargeDuration: 1.5, // 冲撞持续时间（秒）
                    chargeSpeed: 3.0,   // 冲撞速度倍数
                    damage: 50,         // 冲撞伤害
                    knockback: 120,     // 击退距离
                    shockwaveRadius: 80, // 冲击波半径
                    triggerChance: 0.2  // 触发概率（20%）
                },
                
                // 技能使用AI配置
                aiConfig: {
                    skillCheckInterval: 2.0, // 每2秒检查一次是否使用技能
                    playerDistanceThreshold: 200, // 玩家距离阈值
                    minHealthPercent: 0.3,    // 低于30%血量时更频繁使用技能
                    lowHealthSkillBonus: 1.5  // 低血量技能使用频率加成
                }
            }
        }
    };

    /**
     * 武器与射击配置
     */
    static WEAPONS = {
        // 子弹属性
        bullet: {
            baseSpeed: 450,
            baseLifetime: 3.5, // 秒
            basePenetration: 0,
            
            // 升级改进
            speedPerUpgrade: 30,
            lifetimePerUpgrade: 0.3,
            penetrationCost: 400, // 穿透升级成本
        },
        
        // 射击机制
        firing: {
            baseSpread: 0.02, // 基础散射角度
            maxSpread: 0.15,  // 最大散射角度
            accuracyRecovery: 0.8, // 每秒准确度恢复
        }
    };

    /**
     * 升级系统配置
     */
    static UPGRADES = {
        // 基础升级
        damage: {
            baseCost: 80,
            costMultiplier: 1.4,
            effectPerLevel: 5, // 每级+5伤害（提高）
            maxLevel: 15
        },
        
        fireRate: {
            baseCost: 100,
            costMultiplier: 1.45,
            effectPerLevel: 0.12, // 每级射速提升12%（提高）
            maxLevel: 12
        },
        
        health: {
            baseCost: 90,
            costMultiplier: 1.35,
            effectPerLevel: 25, // 每级+25最大生命值（提高）
            maxLevel: 8
        },
        
        speed: {
            baseCost: 50,
            costMultiplier: 1.25,
            effectPerLevel: 12, // 每级+12移动速度
            maxLevel: 12
        },
        
        // 高级升级
        penetration: {
            baseCost: 300,
            costMultiplier: 2.0,
            effectPerLevel: 1, // 每级+1穿透
            maxLevel: 5
        },
        
        critChance: {
            baseCost: 200,
            costMultiplier: 1.6,
            effectPerLevel: 0.05, // 每级+5%暴击率
            maxLevel: 8
        },
        
        manaCapacity: {
            baseCost: 150,
            costMultiplier: 1.5,
            effectPerLevel: 20, // 每级+20最大法力
            maxLevel: 6
        }
    };

    /**
     * 波次系统配置
     */
    static WAVES = {
        // 基础配置
        baseWaveTime: 30000, // 30秒基础波次时间
        timeReduction: 1000,  // 每波减少1秒
        minWaveTime: 15000,   // 最短15秒
        
        // 敌人数量
        baseDragonCount: 1,
        dragonIncrement: 0.3, // 每波增加0.3只龙（累积）
        maxDragonsPerWave: 8,
        
        // Boss波次
        bossWaveInterval: 10, // 每10波一个Boss
        bossHealthMultiplier: 3.0,
        bossDamageMultiplier: 1.5,
        bossRewardMultiplier: 5.0,
        
        // 精英敌人
        eliteChance: 0.15, // 15%概率出现精英
        eliteHealthMultiplier: 2.0,
        eliteDamageMultiplier: 1.3,
        eliteRewardMultiplier: 2.5
    };

    /**
     * 道具掉落配置
     */
    static LOOT = {
        // 基础掉落率
        baseDropChance: 0.25,
        eliteDropChance: 0.6,
        bossDropChance: 1.0,
        
        // 道具类型权重
        dropWeights: {
            health: 30,      // 回血道具
            mana: 25,        // 法力道具
            damage: 20,      // 临时伤害提升
            speed: 15,       // 临时速度提升
            rare: 10         // 稀有道具
        },
        
        // 道具效果
        effects: {
            health: { value: 25, duration: 0 },           // 立即回复25血
            mana: { value: 30, duration: 0 },             // 立即回复30法力
            damage: { multiplier: 1.5, duration: 15000 }, // 15秒内伤害+50%
            speed: { multiplier: 1.3, duration: 10000 },  // 10秒内速度+30%
            rare: { scoreMultiplier: 2.0, duration: 20000 } // 20秒双倍分数
        }
    };

    /**
     * 元素系统平衡
     */
    static ELEMENTS = {
        // 元素权重调整（基于波次）
        waveWeightModifiers: {
            early: { // 1-5波
                normal: 50,
                fire: 25,
                ice: 20,
                stone: 15,
                thunder: 5,
                poison: 3,
                dark: 0
            },
            mid: { // 6-15波
                normal: 20,
                fire: 25,
                ice: 25,
                stone: 20,
                thunder: 15,
                poison: 12,
                dark: 3
            },
            late: { // 16+波
                normal: 10,
                fire: 20,
                ice: 20,
                stone: 15,
                thunder: 20,
                poison: 18,
                dark: 12
            }
        },
        
        // 克制效果强度调整
        effectivenessModifier: 0.8, // 降低克制效果，避免过于极端
        
        // 特殊能力冷却时间
        abilityCooldowns: {
            armor: 0,        // 被动能力
            burn: 8000,      // 8秒
            freeze: 6000,    // 6秒
            chain: 10000,    // 10秒
            poison: 12000,   // 12秒
            phase: 20000     // 20秒
        }
    };

    /**
     * 技能系统平衡
     */
    static SKILLS = {
        // 全局技能修正
        globalCooldownReduction: 0.9, // 技能冷却时间90%
        globalManaCostReduction: 0.85, // 技能法力消耗85%
        
        // 技能解锁条件
        unlockRequirements: {
            volley: { wave: 1, cost: 0 },
            burst: { wave: 3, cost: 150 },
            shield: { wave: 5, cost: 400 },
            timeWarp: { wave: 7, cost: 700 },
            elementalStorm: { wave: 10, cost: 1200 },
            dragonSlayer: { wave: 15, cost: 2500 }
        },
        
        // 被动技能解锁
        passiveUnlocks: {
            quickReload: { wave: 2, cost: 100 },
            doubleShot: { wave: 4, cost: 250 },
            magicArmor: { wave: 6, cost: 500 },
            manaEfficiency: { wave: 8, cost: 800 },
            criticalHit: { wave: 9, cost: 1000 },
            vampiric: { wave: 12, cost: 1800 }
        }
    };

    /**
     * 难度曲线配置
     */
    static DIFFICULTY = {
        // 难度递增曲线
        playerPowerGrowth: 1.15,  // 玩家每波实力增长15%
        enemyPowerGrowth: 1.18,   // 敌人每波实力增长18%
        
        // 平衡点调整
        balancePoints: [
            { wave: 5, playerBonus: 1.1 },   // 第5波给玩家10%加成
            { wave: 10, playerBonus: 1.15 }, // 第10波给玩家15%加成
            { wave: 20, playerBonus: 1.2 }   // 第20波给玩家20%加成
        ],
        
        // 难度限制
        maxEnemyHealthMultiplier: 10.0,
        maxEnemySpeedMultiplier: 3.0,
        maxEnemyDamageMultiplier: 5.0
    };

    /**
     * 经济系统配置
     */
    static ECONOMY = {
        // 分数获得
        baseKillReward: 50,
        segmentReward: 15,
        waveCompleteBonus: 100,
        survivalBonus: 10, // 每秒生存奖励
        
        // 分数倍率
        difficultyMultiplier: 1.0,
        comboMultiplier: 1.05, // 连续击杀5%加成
        elementalBonusMultiplier: 1.2, // 元素克制20%加成
        
        // 通胀控制
        inflationRate: 1.02, // 每波成本增加2%
        maxInflation: 3.0    // 最大通胀倍率
    };

    /**
     * 计算升级成本
     * @param {string} upgradeType - 升级类型
     * @param {number} currentLevel - 当前等级
     * @param {number} waveNumber - 当前波次
     * @returns {number} 升级成本
     */
    static getUpgradeCost(upgradeType, currentLevel = 0, waveNumber = 1) {
        const config = this.UPGRADES[upgradeType];
        if (!config) return 999999;
        
        if (currentLevel >= config.maxLevel) return 999999;
        
        const baseCost = config.baseCost;
        const levelCost = baseCost * Math.pow(config.costMultiplier, currentLevel);
        const inflationMultiplier = Math.min(
            Math.pow(this.ECONOMY.inflationRate, waveNumber - 1),
            this.ECONOMY.maxInflation
        );
        
        return Math.floor(levelCost * inflationMultiplier);
    }

    /**
     * 计算敌人属性
     * @param {number} waveNumber - 波次
     * @param {string} enemyType - 敌人类型
     * @returns {Object} 敌人属性
     */
    static getEnemyStats(waveNumber, enemyType = 'dragon') {
        const config = this.ENEMIES[enemyType];
        const wave = Math.max(1, waveNumber);
        
        // 基础属性计算
        const health = config.baseHealth + (wave - 1) * config.healthGrowth;
        const damage = Math.min(
            config.baseDamage + (wave - 1) * config.damageGrowth,
            config.maxDamage
        );
        const speed = Math.min(
            config.baseSpeed + (wave - 1) * config.speedGrowth,
            config.maxSpeed
        );
        const reward = config.baseReward + (wave - 1) * config.rewardGrowth;
        
        return {
            health: Math.floor(health),
            damage: Math.floor(damage),
            speed: Math.floor(speed),
            reward: Math.floor(reward)
        };
    }

    /**
     * 获取当前波次的元素权重
     * @param {number} waveNumber - 波次
     * @returns {Object} 元素权重配置
     */
    static getElementWeights(waveNumber) {
        if (waveNumber <= 5) {
            return this.ELEMENTS.waveWeightModifiers.early;
        } else if (waveNumber <= 15) {
            return this.ELEMENTS.waveWeightModifiers.mid;
        } else {
            return this.ELEMENTS.waveWeightModifiers.late;
        }
    }

    /**
     * 计算技能实际效果
     * @param {string} skillId - 技能ID
     * @param {number} playerLevel - 玩家等级
     * @returns {Object} 技能效果数据
     */
    static getSkillEffects(skillId, playerLevel = 1) {
        const levelBonus = 1 + (playerLevel - 1) * 0.05; // 每级5%加成
        
        // 基础技能效果会在这里根据玩家等级调整
        return {
            levelBonus: levelBonus,
            cooldownReduction: this.SKILLS.globalCooldownReduction,
            manaCostReduction: this.SKILLS.globalManaCostReduction
        };
    }

    /**
     * 获取推荐难度曲线检查点
     * @param {number} waveNumber - 波次
     * @returns {Object} 难度检查点数据
     */
    static getDifficultyCheckpoint(waveNumber) {
        const checkpoint = this.DIFFICULTY.balancePoints.find(
            point => point.wave === waveNumber
        );
        
        return checkpoint || { wave: waveNumber, playerBonus: 1.0 };
    }

    /**
     * 验证游戏平衡性
     * @param {Object} gameState - 当前游戏状态
     * @returns {Object} 平衡性分析结果
     */
    static analyzeBalance(gameState) {
        const { wave, playerStats, enemyStats } = gameState;
        
        const playerPower = this.calculatePlayerPower(playerStats);
        const enemyPower = this.calculateEnemyPower(enemyStats, wave);
        
        const powerRatio = playerPower / enemyPower;
        
        return {
            powerRatio: powerRatio,
            balance: powerRatio >= 0.8 && powerRatio <= 1.2 ? 'balanced' : 
                    powerRatio < 0.8 ? 'too_hard' : 'too_easy',
            recommendations: this.getBalanceRecommendations(powerRatio, wave)
        };
    }

    /**
     * 计算玩家综合实力
     */
    static calculatePlayerPower(playerStats) {
        const { damage, fireRate, health, speed, skills } = playerStats;
        
        const dps = damage * (1000 / fireRate); // 每秒伤害
        const survivability = health * speed / 100; // 生存能力
        const skillPower = Object.keys(skills || {}).length * 50; // 技能加成
        
        return dps + survivability + skillPower;
    }

    /**
     * 计算敌人综合实力
     */
    static calculateEnemyPower(enemyStats, wave) {
        const { health, damage, speed, count } = enemyStats;
        
        const threat = (health * damage * speed / 1000) * count;
        const waveMultiplier = 1 + (wave - 1) * 0.1;
        
        return threat * waveMultiplier;
    }

    /**
     * 获取平衡性建议
     */
    static getBalanceRecommendations(powerRatio, wave) {
        if (powerRatio < 0.6) {
            return {
                type: 'buff_player',
                suggestions: [
                    '降低升级成本',
                    '增加道具掉落率',
                    '提供临时加成道具'
                ]
            };
        } else if (powerRatio > 1.5) {
            return {
                type: 'buff_enemies',
                suggestions: [
                    '增加敌人血量',
                    '提高敌人移动速度',
                    '增加精英敌人出现率'
                ]
            };
        }
        
        return {
            type: 'balanced',
            suggestions: ['当前难度平衡良好']
        };
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BalanceConfig;
}
