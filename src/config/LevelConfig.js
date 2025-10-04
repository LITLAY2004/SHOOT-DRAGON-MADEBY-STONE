/**
 * 关卡配置系统
 * 定义闯关模式和无限模式的配置
 */

class LevelConfig {
    /**
     * 关卡类型定义
     */
    static GAME_MODES = {
        ADVENTURE: 'adventure',    // 闯关模式
        ENDLESS: 'endless',        // 无限模式
        SURVIVAL: 'survival'       // 生存模式
    };

    /**
     * 闯关模式关卡配置
     * 每个关卡都有特定的目标和奖励
     */
    static ADVENTURE_LEVELS = {
        1: {
            id: 1,
            name: "新手试炼",
            description: "学习基本操作，击败10个敌人",
            difficulty: "easy",
            objectives: {
                killCount: 10,
                surviveTime: 60,        // 秒
                maxDeaths: 3,
                specialConditions: []
            },
            enemyWaves: {
                spawnRate: 2000,        // 毫秒
                maxConcurrent: 3,
                types: ['basic'],
                totalWaves: 3
            },
            rewards: {
                tokens: 50,
                experience: 100,
                skillPoints: 1,
                unlocksLevel: 2
            },
            environment: {
                backgroundTheme: 'forest',
                ambientEffects: ['particles'],
                musicTrack: 'calm'
            }
        },
        
        2: {
            id: 2,
            name: "元素觉醒",
            description: "掌握元素技能，击败火元素龙",
            difficulty: "easy",
            objectives: {
                killCount: 15,
                surviveTime: 90,
                maxDeaths: 3,
                specialConditions: ['defeat_fire_dragon']
            },
            enemyWaves: {
                spawnRate: 1800,
                maxConcurrent: 4,
                types: ['basic', 'fire'],
                totalWaves: 4,
                bossWave: {
                    wave: 4,
                    boss: {
                        type: 'fire_dragon',
                        health: 200,
                        damage: 30,
                        element: 'fire'
                    }
                }
            },
            rewards: {
                tokens: 100,
                experience: 200,
                skillPoints: 2,
                unlocksLevel: 3,
                specialReward: 'fire_skill_unlock'
            },
            environment: {
                backgroundTheme: 'volcano',
                ambientEffects: ['fire_particles', 'heat_waves'],
                musicTrack: 'intense'
            }
        },

        3: {
            id: 3,
            name: "双元素冲突",
            description: "在火与冰的战场中生存120秒",
            difficulty: "medium",
            objectives: {
                killCount: 25,
                surviveTime: 120,
                maxDeaths: 2,
                specialConditions: ['use_elemental_combos']
            },
            enemyWaves: {
                spawnRate: 1500,
                maxConcurrent: 5,
                types: ['fire', 'ice', 'basic'],
                totalWaves: 5,
                elementalConflict: true
            },
            rewards: {
                tokens: 150,
                experience: 300,
                skillPoints: 3,
                unlocksLevel: 4,
                specialReward: 'ice_skill_unlock'
            },
            environment: {
                backgroundTheme: 'elemental_battlefield',
                ambientEffects: ['fire_particles', 'ice_crystals', 'elemental_clash'],
                musicTrack: 'epic_battle'
            }
        },

        4: {
            id: 4,
            name: "雷电风暴",
            description: "在雷电风暴中证明你的实力",
            difficulty: "medium",
            objectives: {
                killCount: 30,
                surviveTime: 150,
                maxDeaths: 2,
                specialConditions: ['survive_lightning_storm']
            },
            enemyWaves: {
                spawnRate: 1200,
                maxConcurrent: 6,
                types: ['lightning', 'wind', 'basic'],
                totalWaves: 6,
                environmentalHazards: ['lightning_strikes', 'wind_gusts']
            },
            rewards: {
                tokens: 200,
                experience: 400,
                skillPoints: 4,
                unlocksLevel: 5,
                specialReward: 'lightning_skill_unlock'
            },
            environment: {
                backgroundTheme: 'storm',
                ambientEffects: ['lightning', 'rain', 'wind_effects'],
                musicTrack: 'storm_symphony'
            }
        },

        5: {
            id: 5,
            name: "古龙苏醒",
            description: "面对传说中的古龙，终极挑战",
            difficulty: "hard",
            objectives: {
                killCount: 50,
                surviveTime: 300,
                maxDeaths: 1,
                specialConditions: ['defeat_ancient_dragon']
            },
            enemyWaves: {
                spawnRate: 1000,
                maxConcurrent: 8,
                types: ['fire', 'ice', 'lightning', 'earth', 'basic'],
                totalWaves: 8,
                bossWave: {
                    wave: 8,
                    boss: {
                        type: 'ancient_dragon',
                        health: 1000,
                        damage: 50,
                        element: 'all',
                        phases: 3,
                        specialAbilities: ['elemental_breath', 'ground_slam', 'flight_mode']
                    }
                }
            },
            rewards: {
                tokens: 500,
                experience: 1000,
                skillPoints: 10,
                unlocksLevel: 6,
                specialReward: 'ancient_power_unlock',
                achievementTitle: 'Dragon Slayer'
            },
            environment: {
                backgroundTheme: 'ancient_ruins',
                ambientEffects: ['ancient_magic', 'floating_runes', 'energy_streams'],
                musicTrack: 'final_boss'
            }
        },

        6: {
            id: 6,
            name: "暗影迷宫",
            description: "在暗影迷宫中寻找出路",
            difficulty: "hard",
            objectives: {
                killCount: 40,
                surviveTime: 180,
                maxDeaths: 1,
                specialConditions: ['navigate_maze']
            },
            enemyWaves: {
                spawnRate: 900,
                maxConcurrent: 7,
                types: ['shadow', 'dark', 'basic'],
                totalWaves: 7,
                environmentalHazards: ['shadow_traps', 'maze_walls']
            },
            rewards: {
                tokens: 300,
                experience: 600,
                skillPoints: 5,
                unlocksLevel: 7,
                specialReward: 'shadow_skill_unlock'
            },
            environment: {
                backgroundTheme: 'shadow_maze',
                ambientEffects: ['shadow_particles', 'maze_effects'],
                musicTrack: 'mysterious'
            }
        },

        7: {
            id: 7,
            name: "元素融合",
            description: "掌握所有元素的力量",
            difficulty: "hard",
            objectives: {
                killCount: 60,
                surviveTime: 240,
                maxDeaths: 1,
                specialConditions: ['use_all_elements']
            },
            enemyWaves: {
                spawnRate: 800,
                maxConcurrent: 9,
                types: ['fire', 'ice', 'lightning', 'earth', 'shadow', 'light'],
                totalWaves: 9,
                elementalFusion: true
            },
            rewards: {
                tokens: 400,
                experience: 800,
                skillPoints: 6,
                unlocksLevel: 8,
                specialReward: 'elemental_mastery'
            },
            environment: {
                backgroundTheme: 'elemental_nexus',
                ambientEffects: ['elemental_fusion', 'energy_vortex'],
                musicTrack: 'elemental_harmony'
            }
        },

        8: {
            id: 8,
            name: "时空裂隙",
            description: "在时空裂隙中战斗",
            difficulty: "extreme",
            objectives: {
                killCount: 80,
                surviveTime: 300,
                maxDeaths: 1,
                specialConditions: ['survive_time_rifts']
            },
            enemyWaves: {
                spawnRate: 600,
                maxConcurrent: 12,
                types: ['temporal', 'void', 'chaos'],
                totalWaves: 10,
                timeDistortion: true
            },
            rewards: {
                tokens: 600,
                experience: 1200,
                skillPoints: 8,
                unlocksLevel: 9,
                specialReward: 'time_manipulation'
            },
            environment: {
                backgroundTheme: 'time_rift',
                ambientEffects: ['time_distortion', 'void_energy'],
                musicTrack: 'temporal_chaos'
            }
        },

        9: {
            id: 9,
            name: "虚空之王",
            description: "面对虚空之王的挑战",
            difficulty: "extreme",
            objectives: {
                killCount: 100,
                surviveTime: 360,
                maxDeaths: 1,
                specialConditions: ['defeat_void_king']
            },
            enemyWaves: {
                spawnRate: 500,
                maxConcurrent: 15,
                types: ['void', 'chaos', 'nightmare'],
                totalWaves: 12,
                bossWave: {
                    wave: 12,
                    boss: {
                        type: 'void_king',
                        health: 2000,
                        damage: 80,
                        element: 'void',
                        phases: 4,
                        specialAbilities: ['void_tear', 'reality_warp', 'summon_minions']
                    }
                }
            },
            rewards: {
                tokens: 800,
                experience: 1600,
                skillPoints: 10,
                unlocksLevel: 10,
                specialReward: 'void_resistance'
            },
            environment: {
                backgroundTheme: 'void_realm',
                ambientEffects: ['void_tears', 'reality_distortion'],
                musicTrack: 'void_king_theme'
            }
        },

        10: {
            id: 10,
            name: "终极试炼",
            description: "最终的考验，证明你是真正的英雄",
            difficulty: "legendary",
            objectives: {
                killCount: 150,
                surviveTime: 600,
                maxDeaths: 0,
                specialConditions: ['perfect_victory', 'use_ultimate_combo']
            },
            enemyWaves: {
                spawnRate: 400,
                maxConcurrent: 20,
                types: ['legendary', 'mythical', 'ultimate'],
                totalWaves: 15,
                finalBattle: true,
                bossWave: {
                    wave: 15,
                    boss: {
                        type: 'ultimate_destroyer',
                        health: 5000,
                        damage: 100,
                        element: 'ultimate',
                        phases: 5,
                        specialAbilities: ['ultimate_blast', 'dimension_shift', 'army_summon', 'reality_break']
                    }
                }
            },
            rewards: {
                tokens: 1500,
                experience: 3000,
                skillPoints: 20,
                unlocksLevel: null,
                specialReward: 'legendary_title',
                achievementTitle: 'Ultimate Hero'
            },
            environment: {
                backgroundTheme: 'ultimate_battlefield',
                ambientEffects: ['ultimate_energy', 'dimensional_tears', 'epic_atmosphere'],
                musicTrack: 'ultimate_trial'
            }
        }
    };

    /**
     * 无限模式配置
     */
    static ENDLESS_MODE_CONFIG = {
        name: "无限挑战",
        description: "坚持得越久，奖励越丰厚",
        scalingRules: {
            // 每5波增加难度
            difficultyIncreaseInterval: 5,
            
            // 敌人属性缩放
            enemyHealthScale: 1.15,     // 每波血量增加15%
            enemyDamageScale: 1.1,      // 每波伤害增加10%
            enemySpeedScale: 1.05,      // 每波速度增加5%
            
            // 生成频率变化
            spawnRateDecrease: 0.95,    // 每波生成间隔减少5%
            maxEnemiesIncrease: 1,      // 每5波最大敌人数+1
            
            // 特殊波次规则
            specialWaves: {
                10: { type: 'boss_wave', multiplier: 2 },
                20: { type: 'elemental_chaos', multiplier: 1.5 },
                30: { type: 'speed_demon', multiplier: 1.3 },
                50: { type: 'ultimate_boss', multiplier: 3 }
            }
        },
        
        rewards: {
            // 基础奖励（每波）
            baseTokensPerWave: 10,
            baseExperiencePerWave: 20,
            
            // 里程碑奖励
            milestoneRewards: {
                10: { tokens: 100, experience: 200, skillPoints: 1 },
                25: { tokens: 250, experience: 500, skillPoints: 2 },
                50: { tokens: 500, experience: 1000, skillPoints: 5 },
                100: { tokens: 1000, experience: 2000, skillPoints: 10 }
            }
        },
        
        environment: {
            backgroundTheme: 'void',
            ambientEffects: ['cosmic_particles', 'void_energy'],
            musicTrack: 'endless_struggle',
            dynamicEffects: true // 根据波次变化环境
        }
    };

    /**
     * 生存模式配置（额外模式）
     */
    static SURVIVAL_MODE_CONFIG = {
        name: "最后的守护者",
        description: "保护你的基地，坚持到最后",
        gameplayType: 'tower_defense',
        
        baseStats: {
            baseHealth: 1000,
            maxTurrets: 10,
            startingResources: 500
        },
        
        waveConfig: {
            totalWaves: 20,
            enemiesPerWave: [5, 8, 12, 15, 20], // 前5波的敌人数量，之后递增
            bossWaves: [10, 20], // Boss波
            specialWaves: {
                5: 'air_assault',
                15: 'tank_rush'
            }
        },
        
        rewards: {
            baseTokensPerWave: 50,
            baseExperiencePerWave: 100,
            survivalBonus: 1000 // 完成所有波次的奖励
        }
    };

    /**
     * 获取指定关卡配置
     */
    static getLevel(levelId) {
        return this.ADVENTURE_LEVELS[levelId] || null;
    }

    /**
     * 获取所有可用关卡
     */
    static getAllLevels() {
        return Object.values(this.ADVENTURE_LEVELS);
    }

    /**
     * 获取下一个关卡ID
     */
    static getNextLevel(currentLevelId) {
        const currentLevel = this.getLevel(currentLevelId);
        return currentLevel?.rewards?.unlocksLevel || null;
    }

    /**
     * 检查关卡是否已解锁
     */
    static isLevelUnlocked(levelId, completedLevels = []) {
        if (levelId === 1) return true; // 第一关总是解锁的
        
        const previousLevelId = levelId - 1;
        return completedLevels.includes(previousLevelId);
    }

    /**
     * 获取模式配置
     */
    static getModeConfig(mode) {
        switch (mode) {
            case this.GAME_MODES.ADVENTURE:
                return { type: 'level_based', levels: this.ADVENTURE_LEVELS };
            case this.GAME_MODES.ENDLESS:
                return this.ENDLESS_MODE_CONFIG;
            case this.GAME_MODES.SURVIVAL:
                return this.SURVIVAL_MODE_CONFIG;
            default:
                return null;
        }
    }

    /**
     * 计算无限模式当前波次的敌人属性
     */
    static calculateEndlessWaveStats(waveNumber, baseStats) {
        const config = this.ENDLESS_MODE_CONFIG.scalingRules;
        const difficultyMultiplier = Math.floor(waveNumber / config.difficultyIncreaseInterval);
        
        return {
            health: Math.floor(baseStats.health * Math.pow(config.enemyHealthScale, difficultyMultiplier)),
            damage: Math.floor(baseStats.damage * Math.pow(config.enemyDamageScale, difficultyMultiplier)),
            speed: Math.floor(baseStats.speed * Math.pow(config.enemySpeedScale, difficultyMultiplier)),
            spawnRate: Math.floor(baseStats.spawnRate * Math.pow(config.spawnRateDecrease, difficultyMultiplier)),
            maxEnemies: baseStats.maxEnemies + Math.floor(difficultyMultiplier / 5) * config.maxEnemiesIncrease
        };
    }

    /**
     * 检查是否是特殊波次
     */
    static getSpecialWaveType(waveNumber) {
        const specialWaves = this.ENDLESS_MODE_CONFIG.scalingRules.specialWaves;
        return specialWaves[waveNumber] || null;
    }

    /**
     * 章节内关卡（用于进度系统的章节判定，默认全部归为第1章）
     */
    static getLevelsByChapter(chapter) {
        const all = Object.values(this.ADVENTURE_LEVELS);
        if (chapter === 1) return all;
        return [];
    }
}

// 导出配置
if (typeof module === 'object' && module && module.exports) {
    module.exports = LevelConfig;
} else if (typeof window !== 'undefined') {
    window.LevelConfig = LevelConfig;
}
