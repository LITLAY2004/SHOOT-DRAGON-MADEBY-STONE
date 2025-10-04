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
            
            // 龙身体段配置 - 新系统
            body: {
                // 初始段数（波次1）
                initialSegments: 3,
                // 每波增加的段数
                segmentsPerWave: 1,
                // 最大段数
                maxSegments: 20,
                // 每段血量计算：基础血量 * (1 + 段索引 * 增长系数)
                segmentHealthBase: 30,  // 基础血量
                segmentHealthGrowth: 0.15, // 每节递增15%
                // 段生长间隔（秒）(P0修复: 从4.5秒降低到3.5秒,确保后期龙段能完全生长)
                growthInterval: 3.5,
                // 段间距
                spacing: 20,
                // 段半径系数
                radiusRatio: 0.85
            },
            
            // 特殊配置
            segmentHealthRatio: 0.8, // 龙段血量为头部的80%
            segmentDamageRatio: 0.6, // 龙段伤害为头部的60%
            
            // 龙技能系统配置
            skills: {
                // 激光能量球技能
                laserSweep: {
                    cooldown: 8.0,          // 冷却时间（秒）
                    duration: 0.75,         // 能量球蓄力结束后停顿时间（秒）
                    telegraphDuration: 1.1, // 预警时间（秒）
                    recoveryDuration: 0.8,  // 收招时间（秒）
                    damage: 40,             // 能量球命中伤害
                    projectileSpeed: 320,   // 能量球速度
                    projectileRadius: 16,   // 能量球半径
                    range: 420,             // 能量球射程
                    triggerChance: 0.25     // 触发概率（25%）
                },
                
                // 冲撞攻击技能
                chargeAttack: {
                    cooldown: 12.0,     // 冷却时间（秒）
                    chargeDuration: 1.5, // 冲撞持续时间（秒）
                    chargeSpeed: 3.0,   // 冲撞速度倍数
                    damage: 50,         // 冲撞伤害
                    knockback: 120,     // 击退距离
                    shockwaveRadius: 80, // 冲击波半径
                    telegraphDuration: 0.9, // 预警时间（秒）
                    recoveryDuration: 0.6,  // 收招时间（秒）
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
        minWaveTime: 18000,   // 最短18秒 (P0修复: 从15秒提升,缓解后期时间压力)
        
        // 敌人数量
        baseDragonCount: 1,
        dragonIncrement: 0.25, // 每波增加0.25只龙（累积）(P0修复: 从0.3降低,减少后期龙数量)
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
     * 道具掉落配置 - 与技能系统配套
     */
    static LOOT = {
        // 龙身体段掉落率（每段必掉）
        segmentDropChance: 1.0,
        // 龙头部掉落率
        dragonHeadDropChance: 1.0,
        
        // 掉落类型权重（针对技能系统）
        dropWeights: {
            rapidFire: 25,      // 快速射击增强
            scatter: 25,        // 散射增强
            damageBoost: 25,    // 伤害增强
            attackSpeed: 25,    // 射速提升（永久）
            health: 15,         // 生命回复
            mana: 15,           // 法力回复
            coin: 30            // 金币
        },
        
        // 道具效果
        effects: {
            // 技能增强道具
            rapidFire: { 
                type: 'skill_enhance',
                description: '快速射击冷却-10%',
                cooldownReduction: 0.1 
            },
            scatter: { 
                type: 'skill_enhance',
                description: '散射子弹+1',
                bulletBonus: 1 
            },
            damageBoost: { 
                type: 'skill_enhance',
                description: '伤害增强持续+1秒',
                durationBonus: 1000 
            },
            attackSpeed: { 
                type: 'permanent',
                description: '永久射速+10%',
                fireRateBonus: 0.1,
                maxStacks: 10
            },
            // 基础道具
            health: { value: 25, duration: 0 },
            mana: { value: 30, duration: 0 },
            coin: { value: 50, duration: 0 }
        },
        
        // 段掉落递增（后面的段掉落更好的东西）
        segmentQualityScale: 0.1  // 每段增加10%掉落稀有物品概率
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
     * 技能系统平衡 - 简化版本（4个核心技能）
     */
    static SKILLS = {
        // 主动技能配置
        active: {
            // 1. 快速射击 - 短时间内大幅提升射速
            rapidFire: {
                id: 'rapidFire',
                name: '快速射击',
                icon: '⚡',
                description: '3秒内射速提升200%',
                cooldown: 8000,      // 8秒冷却
                duration: 3000,      // 持续3秒
                fireRateBonus: 2.0,  // 射速+200%
                manaCost: 20
            },
            
            // 2. 散射 - 一次发射多个子弹
            scatter: {
                id: 'scatter',
                name: '散射',
                icon: '💥',
                description: '发射5发扇形子弹',
                cooldown: 6000,       // 6秒冷却
                bulletCount: 5,       // 5发子弹
                spreadAngle: 30,      // 扇形30度
                damageMultiplier: 0.7, // 每发伤害70%
                manaCost: 25
            },
            
            // 3. 伤害增强 - 提升伤害
            damageBoost: {
                id: 'damageBoost',
                name: '伤害增强',
                icon: '🔥',
                description: '5秒内伤害提升150%',
                cooldown: 12000,      // 12秒冷却
                duration: 5000,       // 持续5秒
                damageBonus: 1.5,     // 伤害+150%
                manaCost: 30
            },
            
            // 4. 射速提升 - 永久提升
            attackSpeedUp: {
                id: 'attackSpeedUp',
                name: '射速提升',
                icon: '⏱️',
                description: '永久提升射速10%（可叠加）',
                cooldown: 0,          // 无冷却
                fireRateBonus: 0.1,   // 每次+10%
                maxStacks: 10,        // 最多10层
                manaCost: 0,          // 通过掉落获得
                stackable: true
            }
        },
        
        // 全局技能修正
        globalCooldownReduction: 0.9,
        globalManaCostReduction: 0.85,
        
        // 技能解锁条件（全部初始解锁）
        unlockRequirements: {
            rapidFire: { wave: 1, cost: 0 },
            scatter: { wave: 1, cost: 0 },
            damageBoost: { wave: 1, cost: 0 },
            attackSpeedUp: { wave: 1, cost: 0 }
        }
    };

    /**
     * 难度曲线配置
     */
    static DIFFICULTY = {
        // 难度递增曲线 (P0修复: 缩小成长率差距,避免后期难度失控)
        playerPowerGrowth: 1.16,  // 玩家每波实力增长16% (从1.15提升)
        enemyPowerGrowth: 1.17,   // 敌人每波实力增长17% (从1.18降低)
        
        // 平衡点调整 (P0修复: 增加后期平衡点加成)
        balancePoints: [
            { wave: 5, playerBonus: 1.1 },   // 第5波给玩家10%加成
            { wave: 10, playerBonus: 1.15 }, // 第10波给玩家15%加成
            { wave: 15, playerBonus: 1.25 }, // 第15波给玩家25%加成 (新增)
            { wave: 20, playerBonus: 1.35 }, // 第20波给玩家35%加成 (从1.2提升)
            { wave: 25, playerBonus: 1.45 }  // 第25波给玩家45%加成 (新增)
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
     * 计算龙身体段配置
     * @param {number} waveNumber - 波次
     * @returns {Object} 龙段配置
     */
    static getDragonBodyConfig(waveNumber) {
        const config = this.ENEMIES.dragon;
        const bodyConfig = config.body;
        const wave = Math.max(1, waveNumber);
        
        // 计算当前波次的段数
        const segmentCount = Math.min(
            bodyConfig.initialSegments + Math.floor((wave - 1) / 2) * bodyConfig.segmentsPerWave,
            bodyConfig.maxSegments
        );
        
        return {
            segmentCount,
            spacing: bodyConfig.spacing,
            radiusRatio: bodyConfig.radiusRatio,
            growthInterval: bodyConfig.growthInterval
        };
    }

    /**
     * 计算龙身体段的血量
     * @param {number} waveNumber - 波次
     * @param {number} segmentIndex - 段索引（0开始，0=最老的段/尾部）
     * @param {number} totalSegments - 总段数
     * @returns {number} 该段的血量
     */
    static getDragonSegmentHealth(waveNumber, segmentIndex, totalSegments) {
        const config = this.ENEMIES.dragon.body;
        const wave = Math.max(1, waveNumber);
        
        // 基础血量随波次增长
        const waveMultiplier = 1 + (wave - 1) * 0.2; // 每波+20%
        const baseHealth = config.segmentHealthBase * waveMultiplier;
        
        // 段索引越大（越靠近头部），血量越高
        const segmentMultiplier = 1 + (segmentIndex / Math.max(1, totalSegments - 1)) * config.segmentHealthGrowth;
        
        return Math.floor(baseHealth * segmentMultiplier);
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
if (typeof module === 'object' && module && module.exports) {
    module.exports = BalanceConfig;
}
if (typeof globalThis !== 'undefined') {
    globalThis.BalanceConfig = BalanceConfig;
}
