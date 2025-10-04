/**
 * 元素系统 - 管理元素属性、克制关系和效果
 */
class ElementSystem {
    constructor(eventSystem, gameState) {
        this.eventSystem = eventSystem;
        this.gameState = gameState;
        this.elementConfig = null;
        this.activeEffects = new Map(); // 活跃的元素效果
        
        this.initialize();
    }

    /**
     * 初始化元素系统
     */
    initialize() {
        // 动态加载ElementConfig（避免循环依赖）
        if (typeof ElementConfig !== 'undefined') {
            this.elementConfig = ElementConfig;
        } else {
            // 如果无法加载，使用基础配置
            console.warn('ElementConfig未加载，使用基础配置');
            this.elementConfig = this.createBasicConfig();
        }

        // 注册事件监听器
        this.setupEventListeners();
    }

    /**
     * 创建基础元素配置（备用）
     */
    createBasicConfig() {
        const config = {
            ELEMENTS: {
                normal: { name: '普通', color: '#FFFFFF', damageMultiplier: 1.0 },
                fire: { name: '火', color: '#FF4500', damageMultiplier: 1.3 },
                ice: { name: '冰', color: '#87CEEB', damageMultiplier: 1.0 },
                thunder: { name: '雷', color: '#9370DB', damageMultiplier: 1.2 },
                poison: { name: '毒', color: '#32CD32', damageMultiplier: 1.15 },
                dark: { name: '暗', color: '#2F2F2F', damageMultiplier: 1.25 },
                stone: { name: '石', color: '#8B7355', damageMultiplier: 1.1 }
            },
            EFFECTIVENESS: {
                fire: { ice: 2.0, thunder: 0.7, poison: 1.5 },
                ice: { thunder: 2.0, fire: 0.5, poison: 1.3 },
                thunder: { dark: 2.0, stone: 1.5, ice: 0.5 },
                poison: { stone: 2.0, thunder: 1.5, fire: 0.7 },
                dark: { fire: 1.5, thunder: 0.5 },
                stone: { poison: 0.5, thunder: 0.7 },
                normal: {}
            }
        };

        config.getElement = (type) => config.ELEMENTS[type] || config.ELEMENTS.normal;
        config.getEffectiveness = (attack, target) => {
            const table = config.EFFECTIVENESS[attack];
            return table && target in table ? table[target] : 1.0;
        };

        return config;
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 监听伤害事件，应用元素效果
        this.eventSystem.on('DAMAGE_DEALT', this.onDamageDealt.bind(this));
        
        // 监听实体死亡事件，清理效果
        this.eventSystem.on('ENTITY_DEATH', this.onEntityDeath.bind(this));
    }

    /**
     * 获取元素配置
     * @param {string} elementType - 元素类型
     * @returns {Object} 元素配置
     */
    getElement(elementType) {
        return this.elementConfig.getElement ? 
               this.elementConfig.getElement(elementType) : 
               this.elementConfig.ELEMENTS[elementType] || this.elementConfig.ELEMENTS.normal;
    }

    /**
     * 获取所有元素
     * @returns {Object} 所有元素配置
     */
    getAllElements() {
        return this.elementConfig.ELEMENTS || {};
    }

    /**
     * 通过名称获取元素
     * @param {string} name - 元素名称
     * @returns {Object|null} 元素配置
     */
    getElementByName(name) {
        const elements = this.getAllElements();
        for (const [type, config] of Object.entries(elements)) {
            if (config.name === name) {
                return { type, ...config };
            }
        }
        return null;
    }

    /**
     * 获取元素克制效果
     * @param {string} attackElement - 攻击元素
     * @param {string} targetElement - 目标元素
     * @returns {number} 效果倍率
     */
    getEffectiveness(attackElement, targetElement) {
        if (this.elementConfig.getEffectiveness) {
            return this.elementConfig.getEffectiveness(attackElement, targetElement);
        }
        return this.elementConfig.EFFECTIVENESS[attackElement]?.[targetElement] || 1.0;
    }

    /**
     * 获取伤害倍率
     * @param {Object} attacker - 攻击者对象
     * @param {Object} target - 目标对象
     * @returns {number} 伤害倍率
     */
    getDamageMultiplier(attacker, target) {
        const attackElement = attacker.element || attacker.weaponElement || 'normal';
        const targetElement = target.element || 'normal';
        
        return this.getEffectiveness(attackElement, targetElement);
    }

    /**
     * 获取元素抗性
     * @param {string} element - 元素类型
     * @param {string} damageType - 伤害类型
     * @returns {number} 抗性值 (0-1)
     */
    getResistance(element, damageType) {
        // 同元素攻击有50%抗性
        if (element === damageType) {
            return 0.5;
        }
        
        // 根据克制关系计算抗性
        const effectiveness = this.getEffectiveness(damageType, element);
        if (effectiveness < 1.0) {
            return 1.0 - effectiveness; // 被克制时的抗性
        }
        
        return 0; // 没有抗性
    }

    /**
     * 应用元素效果
     * @param {Object} target - 目标对象
     * @param {string} element - 元素类型
     * @param {number} strength - 效果强度
     * @param {Object} source - 效果来源
     */
    applyElementEffect(target, element, strength = 1.0, source = null) {
        if (!target || element === 'normal') return;

        const elementConfig = this.getElement(element);
        const abilityType = elementConfig.specialAbility;
        
        if (abilityType && abilityType !== 'none') {
            this.applySpecialAbility(target, abilityType, strength, source);
        }

        // 创建视觉效果
        this.createElementParticles(target.x, target.y, element);
        
        // 播放音效
        this.playElementSound(element, 'ability');
        
        // 触发事件
        this.eventSystem.emit('ELEMENT_EFFECT_APPLY', {
            target,
            element,
            strength,
            source
        });
    }

    /**
     * 应用特殊能力
     * @param {Object} target - 目标对象
     * @param {string} abilityType - 能力类型
     * @param {number} strength - 效果强度
     * @param {Object} source - 效果来源
     */
    applySpecialAbility(target, abilityType, strength, source) {
        const abilityConfig = this.elementConfig.getSpecialAbility ? 
                              this.elementConfig.getSpecialAbility(abilityType) : null;
        
        if (!abilityConfig) return;

        const effectId = `${target.id || target}_${abilityType}_${Date.now()}`;
        const effect = {
            id: effectId,
            type: abilityType,
            target,
            source,
            strength,
            config: abilityConfig,
            startTime: Date.now(),
            lastTick: Date.now()
        };

        // 根据能力类型应用效果
        switch (abilityType) {
            case 'burn':
                this.applyBurnEffect(effect);
                break;
            case 'freeze':
                this.applyFreezeEffect(effect);
                break;
            case 'poison':
                this.applyPoisonEffect(effect);
                break;
            case 'chain':
                this.applyChainEffect(effect);
                break;
            case 'phase':
                this.applyPhaseEffect(effect);
                break;
            case 'armor':
                this.applyArmorEffect(effect);
                break;
        }

        // 如果是持续效果，添加到活跃效果列表
        if (abilityConfig.duration > 0) {
            this.activeEffects.set(effectId, effect);
        }
    }

    /**
     * 应用燃烧效果
     */
    applyBurnEffect(effect) {
        const { target, config, strength } = effect;
        
        // 设置燃烧状态
        target.isBurning = true;
        target.burnDamage = config.dps * strength;
        target.burnTickInterval = config.tickInterval;
        
        console.log(`${target.element || '实体'}开始燃烧，每秒造成${target.burnDamage}伤害`);
    }

    /**
     * 应用冰冻效果
     */
    applyFreezeEffect(effect) {
        const { target, config, strength } = effect;
        
        // 保存原始速度
        if (!target.originalSpeed) {
            target.originalSpeed = target.speed;
        }
        
        // 应用减速
        const slowMultiplier = 1 - (config.slowPercent * strength);
        target.speed = target.originalSpeed * slowMultiplier;
        target.isFrozen = true;
        
        console.log(`${target.element || '实体'}被冰冻，速度降低${(config.slowPercent * strength * 100).toFixed(1)}%`);
    }

    /**
     * 应用中毒效果
     */
    applyPoisonEffect(effect) {
        const { target, config, strength } = effect;
        
        target.isPoisoned = true;
        target.poisonDamage = config.dps * strength;
        target.poisonTickInterval = config.tickInterval;
        
        console.log(`${target.element || '实体'}中毒，每秒造成${target.poisonDamage}伤害`);
    }

    /**
     * 应用连锁效果
     */
    applyChainEffect(effect) {
        const { target, config, strength, source } = effect;
        
        // 立即执行连锁攻击
        this.executeChainLightning(source, target, config, strength);
    }

    /**
     * 应用相位效果
     */
    applyPhaseEffect(effect) {
        const { target, config } = effect;
        
        target.isInvulnerable = true;
        target.phaseStartTime = Date.now();
        
        console.log(`${target.element || '实体'}进入相位状态，免疫所有伤害`);
    }

    /**
     * 应用护甲效果
     */
    applyArmorEffect(effect) {
        const { target, config } = effect;
        
        if (!target.damageReduction) {
            target.damageReduction = 0;
        }
        target.damageReduction += config.damageReduction;
        
        console.log(`${target.element || '实体'}获得护甲，减少${(config.damageReduction * 100).toFixed(1)}%伤害`);
    }

    /**
     * 执行连锁闪电
     */
    executeChainLightning(source, initialTarget, config, strength) {
        const targets = [initialTarget];
        const chainedTargets = new Set([initialTarget]);
        let currentTarget = initialTarget;
        
        // 查找连锁目标
        for (let i = 0; i < config.maxChains && currentTarget; i++) {
            const nearbyTargets = this.findNearbyTargets(currentTarget, config.chainRange);
            let nextTarget = null;
            
            // 找到最近的未被连锁的目标
            for (const target of nearbyTargets) {
                if (!chainedTargets.has(target)) {
                    nextTarget = target;
                    break;
                }
            }
            
            if (nextTarget) {
                targets.push(nextTarget);
                chainedTargets.add(nextTarget);
                currentTarget = nextTarget;
            } else {
                break;
            }
        }
        
        // 对所有目标造成伤害
        let damage = source.damage || 20;
        for (let i = 0; i < targets.length; i++) {
            const target = targets[i];
            const chainDamage = damage * Math.pow(config.chainDamage, i) * strength;
            
            // 造成伤害
            this.dealElementalDamage(target, chainDamage, 'thunder', source);
            
            // 创建闪电特效
            if (i > 0) {
                this.createLightningEffect(targets[i-1], target);
            }
        }
    }

    /**
     * 查找附近目标
     */
    findNearbyTargets(center, range) {
        const targets = [];
        const allEntities = [
            ...this.gameState.getDragons(),
            ...this.gameState.getTowers()
        ];
        
        if (this.gameState.player) {
            allEntities.push(this.gameState.player);
        }
        
        for (const entity of allEntities) {
            if (entity !== center) {
                const distance = Math.sqrt(
                    Math.pow(entity.x - center.x, 2) + 
                    Math.pow(entity.y - center.y, 2)
                );
                if (distance <= range) {
                    targets.push(entity);
                }
            }
        }
        
        return targets.sort((a, b) => {
            const distA = Math.sqrt(Math.pow(a.x - center.x, 2) + Math.pow(a.y - center.y, 2));
            const distB = Math.sqrt(Math.pow(b.x - center.x, 2) + Math.pow(b.y - center.y, 2));
            return distA - distB;
        });
    }

    /**
     * 造成元素伤害
     */
    dealElementalDamage(target, damage, element, source) {
        if (!target || target.health === undefined) return;
        
        const effectiveness = this.getEffectiveness(element, target.element || 'normal');
        const finalDamage = damage * effectiveness;
        
        // 应用护甲减免
        let actualDamage = finalDamage;
        if (target.damageReduction) {
            actualDamage *= (1 - target.damageReduction);
        }
        
        // 造成伤害
        target.health -= actualDamage;
        
        // 触发伤害事件
        this.eventSystem.emit('DAMAGE_DEALT', {
            target,
            damage: actualDamage,
            element,
            source,
            effectiveness
        });
        
        return actualDamage;
    }

    /**
     * 更新所有活跃效果
     * @param {number} deltaTime - 时间增量
     */
    updateActiveEffects(deltaTime) {
        const currentTime = Date.now();
        const expiredEffects = [];
        
        for (const [effectId, effect] of this.activeEffects) {
            const { target, config, startTime, lastTick } = effect;
            const elapsedTime = currentTime - startTime;
            
            // 检查效果是否过期
            if (elapsedTime >= config.duration) {
                expiredEffects.push(effectId);
                this.removeEffect(target, effect.type);
                continue;
            }
            
            // 处理持续伤害效果
            if ((effect.type === 'burn' || effect.type === 'poison') && 
                currentTime - lastTick >= config.tickInterval) {
                
                const tickDamage = effect.type === 'burn' ? target.burnDamage : target.poisonDamage;
                this.dealElementalDamage(target, tickDamage, effect.type, effect.source);
                effect.lastTick = currentTime;
            }
            
            // 处理相位效果
            if (effect.type === 'phase' && elapsedTime >= config.duration) {
                target.isInvulnerable = false;
                expiredEffects.push(effectId);
            }
        }
        
        // 移除过期效果
        for (const effectId of expiredEffects) {
            this.activeEffects.delete(effectId);
        }
    }

    /**
     * 移除效果
     */
    removeEffect(target, effectType) {
        switch (effectType) {
            case 'burn':
                target.isBurning = false;
                delete target.burnDamage;
                delete target.burnTickInterval;
                break;
            case 'freeze':
                target.isFrozen = false;
                if (target.originalSpeed) {
                    target.speed = target.originalSpeed;
                    delete target.originalSpeed;
                }
                break;
            case 'poison':
                target.isPoisoned = false;
                delete target.poisonDamage;
                delete target.poisonTickInterval;
                break;
            case 'phase':
                target.isInvulnerable = false;
                delete target.phaseStartTime;
                break;
        }
        
        this.eventSystem.emit('ELEMENT_EFFECT_REMOVE', { target, effectType });
    }

    /**
     * 清除所有效果
     */
    clearAllEffects(target) {
        // 找到目标相关的所有效果
        const effectsToRemove = [];
        for (const [effectId, effect] of this.activeEffects) {
            if (effect.target === target) {
                effectsToRemove.push(effectId);
                this.removeEffect(target, effect.type);
            }
        }
        
        // 移除效果
        for (const effectId of effectsToRemove) {
            this.activeEffects.delete(effectId);
        }
    }

    /**
     * 创建元素粒子效果
     */
    createElementParticles(x, y, element) {
        this.eventSystem.emit('PARTICLE_CREATE', {
            type: 'element',
            element,
            x,
            y,
            count: 10
        });
    }

    /**
     * 创建闪电特效
     */
    createLightningEffect(from, to) {
        this.eventSystem.emit('EFFECT_CREATE', {
            type: 'lightning',
            from: { x: from.x, y: from.y },
            to: { x: to.x, y: to.y },
            duration: 200
        });
    }

    /**
     * 播放元素音效
     */
    playElementSound(element, action) {
        this.eventSystem.emit('SOUND_PLAY', {
            type: 'element',
            element,
            action
        });
    }

    /**
     * 根据波次获取随机元素
     */
    getRandomElement(waveNumber) {
        const weights = this.elementConfig.getWaveElementWeights ? 
                       this.elementConfig.getWaveElementWeights(waveNumber) : 
                       { stone: 30, fire: 25, ice: 25, thunder: 15, poison: 20, dark: 5 };
        
        const elements = Object.keys(weights);
        const weightArray = Object.values(weights);
        
        return this.weightedRandomChoice(elements, weightArray);
    }

    /**
     * 根据权重随机选择
     */
    weightedRandomChoice(items, weights) {
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < items.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return items[i];
            }
        }
        
        return items[items.length - 1];
    }

    /**
     * 事件处理：伤害造成时
     */
    onDamageDealt(data) {
        const { target, element, effectiveness } = data;
        
        // 记录元素效果统计
        if (!this.gameState.statistics.elementEffectiveness) {
            this.gameState.statistics.elementEffectiveness = {};
        }
        if (!this.gameState.statistics.elementEffectiveness[element]) {
            this.gameState.statistics.elementEffectiveness[element] = { total: 0, count: 0 };
        }
        
        this.gameState.statistics.elementEffectiveness[element].total += effectiveness;
        this.gameState.statistics.elementEffectiveness[element].count++;
    }

    /**
     * 事件处理：实体死亡时
     */
    onEntityDeath(entity) {
        this.clearAllEffects(entity);
    }

    /**
     * 获取元素使用统计
     */
    getElementUsageStats() {
        return this.gameState.statistics.elementsKilled || {};
    }

    /**
     * 获取元素效果统计
     */
    getElementEffectivenessStats() {
        const stats = this.gameState.statistics.elementEffectiveness || {};
        const result = {};
        
        for (const [element, data] of Object.entries(stats)) {
            result[element] = data.count > 0 ? data.total / data.count : 1.0;
        }
        
        return result;
    }
}

// 导出模块
if (typeof module === 'object' && module && module.exports) {
    module.exports = ElementSystem;
}
if (typeof globalThis !== 'undefined') {
    globalThis.ElementSystem = ElementSystem;
}
