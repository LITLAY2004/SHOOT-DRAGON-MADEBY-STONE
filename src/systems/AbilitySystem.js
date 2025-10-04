/**
 * 主动技能系统：管理技能定义、资源消耗与冷却
 */
class AbilitySystem {
    constructor(eventSystem, gameState, options = {}) {
        if (!eventSystem || !gameState) {
            throw new Error('AbilitySystem requires eventSystem and gameState');
        }

        this.eventSystem = eventSystem;
        this.gameState = gameState;

        const abilityList = Array.isArray(options.abilities) && options.abilities.length
            ? options.abilities
            : AbilitySystem.getDefaultAbilities();

        this.abilities = new Map();
        abilityList.forEach((ability) => {
            if (ability && ability.id) {
                this.abilities.set(ability.id, { ...ability });
            }
        });

        this.cooldowns = new Map();
        this.syncTimer = 0;
        this.syncInterval = options.syncInterval || 0.25;
    }

    static getDefaultAbilities() {
        return [
            {
                id: 'rapid_fire',
                name: '快速射击',
                description: '在短时间内大幅提升射速。',
                type: 'attack_buff',
                hotkey: '1',
                cost: { crystals: 12 },
                cooldown: 12,
                duration: 3,
                fireRateMultiplier: 3,
                sound: 'ability_rapid_fire'
            },
            {
                id: 'guardian_shield',
                name: '守护屏障',
                description: '生成护盾吸收伤害并提供短暂无敌。',
                type: 'shield',
                hotkey: '2',
                cost: { crystals: 14 },
                cooldown: 18,
                shieldAmount: 180,
                duration: 6,
                sound: 'ability_guardian_shield'
            },
            {
                id: 'dragon_slayer',
                name: '屠龙斩',
                description: '削减场上所有龙的生命值。',
                type: 'dragon_slayer',
                hotkey: '3',
                cost: { crystals: 18 },
                cooldown: 22,
                reductionPercent: 0.5,
                sound: 'ability_dragon_slayer'
            },
            {
                id: 'healing_wave',
                name: '生命波动',
                description: '立即恢复一定生命值。',
                type: 'heal',
                hotkey: '4',
                cost: { crystals: 10 },
                cooldown: 14,
                healAmount: 30,
                sound: 'ability_healing_wave'
            }
        ];
    }

    getAbility(id) {
        return this.abilities.get(id) || null;
    }

    getAbilities() {
        return Array.from(this.abilities.values());
    }

    getCooldown(id) {
        return Math.max(0, this.cooldowns.get(id) || 0);
    }

    canActivate(id) {
        const ability = this.getAbility(id);
        if (!ability) {
            return { success: false, reason: 'unknown_ability' };
        }

        if (this.getCooldown(id) > 0) {
            return { success: false, reason: 'cooldown' };
        }

        const resources = this.gameState.getResources();
        const cost = ability.cost || {};
        for (const [type, amount] of Object.entries(cost)) {
            if ((resources[type] || 0) < amount) {
                return { success: false, reason: 'insufficient_resource', resource: type };
            }
        }

        return { success: true };
    }

    activate(id, context = {}) {
        const ability = this.getAbility(id);
        if (!ability) {
            return { success: false, reason: 'unknown_ability' };
        }

        const check = this.canActivate(id);
        if (!check.success) {
            return { success: false, reason: check.reason, resource: check.resource };
        }

        const cost = ability.cost || {};
        for (const [type, amount] of Object.entries(cost)) {
            if (amount > 0) {
                const spent = this.gameState.spendResource(type, amount);
                if (!spent) {
                    return { success: false, reason: 'spend_failed', resource: type };
                }
            }
        }

        this.cooldowns.set(id, ability.cooldown || 0);
        this.eventSystem.emit('ABILITY_CAST', {
            ability: { ...ability },
            context: {
                ...context,
                castAt: this.gameState.getGameTime()
            }
        });

        this.eventSystem.emit('ABILITY_COOLDOWN_START', {
            id,
            cooldown: ability.cooldown || 0
        });

        return { success: true, ability, cooldown: ability.cooldown || 0 };
    }

    update(deltaTime) {
        if (typeof deltaTime !== 'number' || deltaTime <= 0) {
            return;
        }

        let changed = false;
        this.cooldowns.forEach((value, id) => {
            if (value > 0) {
                const next = Math.max(0, value - deltaTime);
                if (next !== value) {
                    this.cooldowns.set(id, next);
                    changed = true;
                    if (next === 0) {
                        this.eventSystem.emit('ABILITY_READY', { id });
                    }
                }
            }
        });

        if (!changed) {
            this.syncTimer = Math.max(0, this.syncTimer - deltaTime);
            return;
        }

        this.syncTimer -= deltaTime;
        if (this.syncTimer <= 0) {
            this.syncTimer = this.syncInterval;
            this.eventSystem.emit('ABILITY_STATUS_UPDATE', {
                abilities: this.getAbilityStatus()
            });
        }
    }

    getAbilityStatus() {
        return this.getAbilities().map((ability) => {
            const remaining = this.getCooldown(ability.id);
            return {
                id: ability.id,
                name: ability.name,
                hotkey: ability.hotkey || null,
                cooldown: ability.cooldown || 0,
                remaining,
                ready: remaining === 0,
                cost: ability.cost || {}
            };
        });
    }

    reset() {
        this.cooldowns.clear();
        this.syncTimer = 0;
        this.eventSystem.emit('ABILITY_STATUS_UPDATE', {
            abilities: this.getAbilityStatus()
        });
    }
}

if (typeof module === 'object' && module && module.exports) {
    module.exports = AbilitySystem;
}
if (typeof globalThis !== 'undefined') {
    globalThis.AbilitySystem = AbilitySystem;
}
