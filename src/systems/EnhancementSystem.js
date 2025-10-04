/**
 * 玩家强化系统
 * 管理石龙掉落的强化效果并为攻击/伤害提供加成
 */
class EnhancementSystem {
    constructor(options = {}) {
        this.config = {
            maxDamageMultiplier: options.maxDamageMultiplier || 3.0,
            maxFireRateModifier: options.maxFireRateModifier || 4.0,
            maxExtraProjectiles: options.maxExtraProjectiles || 4,
            baseDamageStep: options.baseDamageStep || 0.2,
            baseFireRateStep: options.baseFireRateStep || 0.25
        };

        this.availableBuffs = Array.isArray(options.availableBuffs) && options.availableBuffs.length
            ? [...options.availableBuffs]
            : ['damage', 'fire_rate', 'multi_shot'];

        this.reset();
    }

    reset() {
        this.damageMultiplier = 1.0;
        this.fireRateModifier = 1.0; // 值越大，攻击间隔越短
        this.extraProjectiles = 0;   // 额外子弹数量
        this.buffHistory = [];
    }

    /**
     * 获取随机强化类型
     */
    getRandomBuffType() {
        // 简单加权：优先平均分配
        if (this.buffHistory.length < this.availableBuffs.length) {
            const missing = this.availableBuffs.filter(type => !this.buffHistory.includes(type));
            if (missing.length > 0) {
                return missing[Math.floor(Math.random() * missing.length)];
            }
        }
        return this.availableBuffs[Math.floor(Math.random() * this.availableBuffs.length)];
    }

    /**
     * 应用强化效果
     */
    applyEnhancement(type) {
        switch (type) {
            case 'damage':
                this.damageMultiplier = Math.min(
                    this.damageMultiplier + this.config.baseDamageStep,
                    this.config.maxDamageMultiplier
                );
                break;
            case 'fire_rate':
                this.fireRateModifier = Math.min(
                    this.fireRateModifier + this.config.baseFireRateStep,
                    this.config.maxFireRateModifier
                );
                break;
            case 'multi_shot':
                this.extraProjectiles = Math.min(
                    this.extraProjectiles + 1,
                    this.config.maxExtraProjectiles
                );
                break;
            default:
                return null;
        }
        this.buffHistory.push(type);
        return {
            type,
            damageMultiplier: this.damageMultiplier,
            fireRateModifier: this.fireRateModifier,
            extraProjectiles: this.extraProjectiles
        };
    }

    /**
     * 计算当前攻击间隔
     */
    getAttackInterval(baseIntervalMs) {
        const interval = baseIntervalMs / Math.max(this.fireRateModifier, 1);
        return Math.max(180, interval); // 限制最小间隔
    }

    /**
     * 获取伤害加成
     */
    getDamageMultiplier() {
        return this.damageMultiplier;
    }

    /**
     * 获取额外子弹数量
     */
    getExtraProjectiles() {
        return this.extraProjectiles;
    }

    /**
     * 获取当前系统状态
     */
    getState() {
        return {
            damageMultiplier: this.damageMultiplier,
            fireRateModifier: this.fireRateModifier,
            extraProjectiles: this.extraProjectiles,
            buffs: [...this.buffHistory]
        };
    }

    getBuffHistory() {
        return [...this.buffHistory];
    }
}

if (typeof module === 'object' && module && module.exports) {
    module.exports = EnhancementSystem;
}
if (typeof globalThis !== 'undefined') {
    globalThis.EnhancementSystem = EnhancementSystem;
}
