/**
 * 元素配置文件
 * 定义所有元素的属性、克制关系和特效配置
 */
class ElementConfig {
    /**
     * 元素基础配置
     */
    static ELEMENTS = {
        stone: {
            name: '石龙',
            color: '#8B7355',
            glowColor: '#A0956B',
            baseHealth: 80,
            healthMultiplier: 1.15,
            damageMultiplier: 1.1,
            speedMultiplier: 1.0,
            specialAbility: 'armor',
            description: '坚硬的石龙，拥有强大的防御力',
            weight: 30
        },
        fire: {
            name: '火龙',
            color: '#FF4500',
            glowColor: '#FF6B35',
            baseHealth: 70,
            healthMultiplier: 1.1,
            damageMultiplier: 1.3,
            speedMultiplier: 1.1,
            specialAbility: 'burn',
            description: '炽热的火龙，攻击带有燃烧效果',
            weight: 25
        },
        ice: {
            name: '冰龙',
            color: '#87CEEB',
            glowColor: '#B0E0E6',
            baseHealth: 90,
            healthMultiplier: 1.2,
            damageMultiplier: 1.0,
            speedMultiplier: 0.8,
            specialAbility: 'freeze',
            description: '寒冰巨龙，能够冰冻敌人',
            weight: 25
        },
        thunder: {
            name: '雷龙',
            color: '#9370DB',
            glowColor: '#BA55D3',
            baseHealth: 65,
            healthMultiplier: 1.05,
            damageMultiplier: 1.2,
            speedMultiplier: 1.3,
            specialAbility: 'chain',
            description: '雷电之龙，攻击可以链式传导',
            weight: 15
        },
        poison: {
            name: '毒龙',
            color: '#32CD32',
            glowColor: '#7FFF00',
            baseHealth: 75,
            healthMultiplier: 1.1,
            damageMultiplier: 1.15,
            speedMultiplier: 0.9,
            specialAbility: 'poison',
            description: '剧毒巨龙，攻击带有持续毒素伤害',
            weight: 20
        },
        dark: {
            name: '暗龙',
            color: '#2F2F2F',
            glowColor: '#4A4A4A',
            baseHealth: 120,
            healthMultiplier: 1.4,
            damageMultiplier: 1.25,
            speedMultiplier: 0.7,
            specialAbility: 'phase',
            description: '神秘的暗影龙，拥有阶段性无敌能力',
            weight: 5
        },
        normal: {
            name: '普通',
            color: '#FFFFFF',
            glowColor: '#DDDDDD',
            baseHealth: 50,
            healthMultiplier: 1.0,
            damageMultiplier: 1.0,
            speedMultiplier: 1.0,
            specialAbility: 'none',
            description: '普通攻击，无特殊效果',
            weight: 0
        }
    };

    /**
     * 元素克制关系表
     * 格式: 攻击元素 -> { 被攻击元素: 效果倍率 }
     * 倍率 > 1 表示克制，< 1 表示被克制，= 1 表示普通
     */
    static EFFECTIVENESS = {
        fire: {
            ice: 2.0,      // 火克冰（强克制）
            poison: 1.5,   // 火克毒（中等克制）
            thunder: 0.7,  // 火被雷克制
            dark: 0.8,     // 火被暗克制
            stone: 1.0,    // 普通效果
            fire: 0.5,     // 同元素抗性
            normal: 1.0
        },
        ice: {
            thunder: 2.0,  // 冰克雷（强克制）
            fire: 0.5,     // 冰被火克制
            poison: 1.3,   // 冰克毒（中等克制）
            dark: 1.2,     // 冰对暗有轻微优势
            stone: 0.9,    // 冰对石效果略差
            ice: 0.5,      // 同元素抗性
            normal: 1.0
        },
        thunder: {
            dark: 2.0,     // 雷克暗（强克制）
            stone: 1.5,    // 雷克石（中等克制）
            ice: 0.5,      // 雷被冰克制
            fire: 1.3,     // 雷克火（中等克制）
            poison: 0.8,   // 雷被毒克制
            thunder: 0.5,  // 同元素抗性
            normal: 1.0
        },
        poison: {
            stone: 2.0,    // 毒克石（强克制）
            thunder: 1.5,  // 毒克雷（中等克制）
            fire: 0.7,     // 毒被火克制
            ice: 0.8,      // 毒被冰克制
            dark: 1.1,     // 毒对暗轻微优势
            poison: 0.5,   // 同元素抗性
            normal: 1.0
        },
        dark: {
            fire: 1.5,     // 暗克火（中等克制）
            ice: 0.8,      // 暗被冰克制
            thunder: 0.5,  // 暗被雷克制
            poison: 0.9,   // 暗被毒克制
            stone: 1.2,    // 暗对石轻微优势
            dark: 0.3,     // 同元素强抗性
            normal: 1.0
        },
        stone: {
            fire: 0.8,     // 石被火克制
            ice: 1.1,      // 石对冰轻微优势
            thunder: 0.7,  // 石被雷克制
            poison: 0.5,   // 石被毒克制
            dark: 0.8,     // 石被暗克制
            stone: 0.5,    // 同元素抗性
            normal: 1.0
        },
        normal: {
            fire: 1.0,
            ice: 1.0,
            thunder: 1.0,
            poison: 1.0,
            dark: 1.0,
            stone: 1.0,
            normal: 1.0
        }
    };

    /**
     * 特殊能力配置
     */
    static SPECIAL_ABILITIES = {
        armor: {
            name: '护甲',
            description: '减少受到的伤害',
            damageReduction: 0.2,
            duration: 0,
            cooldown: 0
        },
        burn: {
            name: '燃烧',
            description: '造成持续火焰伤害',
            dps: 10,
            duration: 3000,
            tickInterval: 500,
            cooldown: 5000
        },
        freeze: {
            name: '冰冻',
            description: '减缓目标移动速度',
            slowPercent: 0.5,
            duration: 2000,
            cooldown: 4000
        },
        chain: {
            name: '连锁闪电',
            description: '攻击可以跳跃到附近敌人',
            chainRange: 100,
            chainDamage: 0.7,
            maxChains: 3,
            cooldown: 3000
        },
        poison: {
            name: '中毒',
            description: '造成持续毒素伤害',
            dps: 8,
            duration: 4000,
            tickInterval: 1000,
            cooldown: 6000
        },
        phase: {
            name: '相位',
            description: '短时间内免疫所有伤害',
            duration: 1000,
            cooldown: 10000,
            invulnerabilityFrames: true
        }
    };

    /**
     * 元素粒子效果配置
     */
    static PARTICLE_EFFECTS = {
        fire: {
            count: 15,
            colors: ['#FF4500', '#FF6B35', '#FF8C42', '#FFA500'],
            size: { min: 2, max: 6 },
            speed: { min: 50, max: 150 },
            life: { min: 0.5, max: 1.5 },
            gravity: -20,
            spread: Math.PI / 3
        },
        ice: {
            count: 12,
            colors: ['#87CEEB', '#B0E0E6', '#E0F6FF', '#FFFFFF'],
            size: { min: 1, max: 4 },
            speed: { min: 30, max: 100 },
            life: { min: 1.0, max: 2.0 },
            gravity: 10,
            spread: Math.PI / 4
        },
        thunder: {
            count: 8,
            colors: ['#9370DB', '#BA55D3', '#DDA0DD', '#FFFFFF'],
            size: { min: 1, max: 3 },
            speed: { min: 100, max: 300 },
            life: { min: 0.2, max: 0.8 },
            gravity: 0,
            spread: Math.PI * 2,
            lightning: true
        },
        poison: {
            count: 10,
            colors: ['#32CD32', '#7FFF00', '#ADFF2F', '#90EE90'],
            size: { min: 2, max: 5 },
            speed: { min: 20, max: 80 },
            life: { min: 1.5, max: 3.0 },
            gravity: -5,
            spread: Math.PI / 2,
            floating: true
        },
        dark: {
            count: 20,
            colors: ['#2F2F2F', '#4A4A4A', '#696969', '#000000'],
            size: { min: 3, max: 8 },
            speed: { min: 10, max: 60 },
            life: { min: 2.0, max: 4.0 },
            gravity: 0,
            spread: Math.PI * 2,
            void: true
        },
        stone: {
            count: 8,
            colors: ['#8B7355', '#A0956B', '#D2B48C', '#DEB887'],
            size: { min: 2, max: 5 },
            speed: { min: 40, max: 120 },
            life: { min: 1.0, max: 2.5 },
            gravity: 30,
            spread: Math.PI / 6
        }
    };

    /**
     * 元素音效配置
     */
    static SOUND_EFFECTS = {
        fire: {
            attack: 'fire_attack',
            death: 'fire_death',
            spawn: 'fire_spawn',
            ability: 'fire_burn'
        },
        ice: {
            attack: 'ice_attack',
            death: 'ice_death',
            spawn: 'ice_spawn',
            ability: 'ice_freeze'
        },
        thunder: {
            attack: 'thunder_attack',
            death: 'thunder_death',
            spawn: 'thunder_spawn',
            ability: 'thunder_chain'
        },
        poison: {
            attack: 'poison_attack',
            death: 'poison_death',
            spawn: 'poison_spawn',
            ability: 'poison_cloud'
        },
        dark: {
            attack: 'dark_attack',
            death: 'dark_death',
            spawn: 'dark_spawn',
            ability: 'dark_phase'
        },
        stone: {
            attack: 'stone_attack',
            death: 'stone_death',
            spawn: 'stone_spawn',
            ability: 'stone_armor'
        }
    };

    /**
     * 获取元素配置
     * @param {string} elementType - 元素类型
     * @returns {Object} 元素配置
     */
    static getElement(elementType) {
        return this.ELEMENTS[elementType] || this.ELEMENTS.normal;
    }

    /**
     * 获取所有元素类型
     * @returns {Array<string>} 元素类型数组
     */
    static getAllElements() {
        return Object.keys(this.ELEMENTS);
    }

    /**
     * 获取元素克制效果
     * @param {string} attackElement - 攻击元素
     * @param {string} targetElement - 目标元素
     * @returns {number} 效果倍率
     */
    static getEffectiveness(attackElement, targetElement) {
        if (!this.EFFECTIVENESS[attackElement] || !this.EFFECTIVENESS[attackElement][targetElement]) {
            return 1.0;
        }
        return this.EFFECTIVENESS[attackElement][targetElement];
    }

    /**
     * 获取特殊能力配置
     * @param {string} abilityType - 能力类型
     * @returns {Object} 能力配置
     */
    static getSpecialAbility(abilityType) {
        return this.SPECIAL_ABILITIES[abilityType] || null;
    }

    /**
     * 获取粒子效果配置
     * @param {string} elementType - 元素类型
     * @returns {Object} 粒子效果配置
     */
    static getParticleEffect(elementType) {
        return this.PARTICLE_EFFECTS[elementType] || this.PARTICLE_EFFECTS.stone;
    }

    /**
     * 获取音效配置
     * @param {string} elementType - 元素类型
     * @param {string} action - 动作类型
     * @returns {string} 音效名称
     */
    static getSoundEffect(elementType, action) {
        const sounds = this.SOUND_EFFECTS[elementType];
        return sounds ? sounds[action] : null;
    }

    /**
     * 根据波次调整元素权重
     * @param {number} waveNumber - 波次数
     * @returns {Object} 调整后的权重配置
     */
    static getWaveElementWeights(waveNumber) {
        const weights = {};
        
        for (const [element, config] of Object.entries(this.ELEMENTS)) {
            if (element === 'normal') continue;
            
            let weight = config.weight;
            
            // 根据波次调整权重
            if (element === 'dark') {
                // 暗龙在高波次出现更频繁
                weight = Math.max(1, weight + Math.floor(waveNumber / 10) * 2);
            } else if (element === 'thunder' || element === 'poison') {
                // 高级元素在中后期增加权重
                weight = weight + Math.floor(waveNumber / 5) * 1;
            }
            
            weights[element] = weight;
        }
        
        return weights;
    }

    /**
     * 检查元素组合是否有特殊效果
     * @param {string} element1 - 第一个元素
     * @param {string} element2 - 第二个元素
     * @returns {Object|null} 特殊效果配置
     */
    static getElementCombo(element1, element2) {
        const combos = {
            'fire_ice': {
                name: '蒸汽爆炸',
                effect: 'steam_explosion',
                damageMultiplier: 1.5,
                radius: 80
            },
            'thunder_poison': {
                name: '电解毒云',
                effect: 'electric_poison',
                damageMultiplier: 1.3,
                duration: 3000
            },
            'ice_dark': {
                name: '绝对零度',
                effect: 'absolute_zero',
                slowMultiplier: 2.0,
                duration: 2000
            }
        };
        
        const key1 = `${element1}_${element2}`;
        const key2 = `${element2}_${element1}`;
        
        return combos[key1] || combos[key2] || null;
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ElementConfig;
}
