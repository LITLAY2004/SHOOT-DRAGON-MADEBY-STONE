const StorageProvider = (typeof require === 'function')
    ? require('../services/PersistentStorage.js')
    : (typeof globalThis !== 'undefined' ? globalThis.PersistentStorage : null);

class ShopSystem {
    constructor(eventSystem, options = {}) {
        if (!eventSystem || !StorageProvider) {
            throw new Error('ShopSystem requires eventSystem and PersistentStorage');
        }

        this.eventSystem = eventSystem;
        this.storageKey = options.storageKey || 'TD_SHOP_DATA';
        this.catalog = this.buildCatalog(options.catalog);
        this.data = this.load();
        this.lastApplied = {
            attackBonus: 0,
            maxHealthBonus: 0,
            manaRegenBonus: 0,
            skillMasteryLevel: 0,
            skillMasteryBonus: 0
        };
    }

    buildCatalog(customCatalog) {
        if (customCatalog) {
            return customCatalog;
        }

        return {
            attack_power: {
                id: 'attack_power',
                name: '锋刃强化',
                description: '永久提升基础伤害。',
                baseCost: 120,
                costGrowth: 1.4,
                effectPerLevel: 5
            },
            max_health: {
                id: 'max_health',
                name: '巨龙抗性',
                description: '永久提升最大生命值。',
                baseCost: 140,
                costGrowth: 1.45,
                effectPerLevel: 25
            },
            mana_regen: {
                id: 'mana_regen',
                name: '法力涌动',
                description: '永久提升法力回复速度。',
                baseCost: 110,
                costGrowth: 1.35,
                effectPerLevel: 2
            },
            skill_mastery: {
                id: 'skill_mastery',
                name: '技能传承',
                description: '加强主动技能效果。',
                baseCost: 180,
                costGrowth: 1.5,
                effectPerLevel: 0.08
            }
        };
    }

    load() {
        const stored = StorageProvider.read(this.storageKey, null);
        if (stored && typeof stored === 'object') {
            return stored;
        }
        return {
            currency: 0,
            upgrades: {
                attack_power: 0,
                max_health: 0,
                mana_regen: 0,
                skill_mastery: 0
            }
        };
    }

    save() {
        StorageProvider.write(this.storageKey, this.data);
    }

    getCurrency() {
        return this.data.currency || 0;
    }

    addCurrency(amount) {
        if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
            return this.getCurrency();
        }
        this.data.currency = Math.max(0, (this.data.currency || 0) + Math.floor(amount));
        this.save();
        this.eventSystem.emit('SHOP_UPDATED', {
            currency: this.getCurrency(),
            upgrades: { ...this.data.upgrades }
        });
        return this.getCurrency();
    }

    getUpgradeLevel(id) {
        return this.data.upgrades?.[id] || 0;
    }

    getUpgradeCost(id) {
        const entry = this.catalog[id];
        if (!entry) {
            return Infinity;
        }
        const level = this.getUpgradeLevel(id);
        const base = entry.baseCost || 100;
        const growth = entry.costGrowth || 1.3;
        return Math.round(base * Math.pow(growth, level));
    }

    canPurchase(id) {
        const cost = this.getUpgradeCost(id);
        return this.getCurrency() >= cost;
    }

    purchase(id) {
        if (!this.catalog[id]) {
            return { success: false, reason: 'unknown_upgrade' };
        }
        const cost = this.getUpgradeCost(id);
        if (this.getCurrency() < cost) {
            return { success: false, reason: 'insufficient_currency', cost };
        }

        this.data.currency -= cost;
        this.data.upgrades[id] = (this.data.upgrades[id] || 0) + 1;
        this.save();

        const result = {
            success: true,
            upgradeId: id,
            level: this.data.upgrades[id],
            remainingCurrency: this.getCurrency()
        };

        this.eventSystem.emit('SHOP_PURCHASED', result);
        this.eventSystem.emit('SHOP_UPDATED', {
            currency: this.getCurrency(),
            upgrades: { ...this.data.upgrades }
        });

        return result;
    }

    applyUpgrades(gameState) {
        if (!gameState || !gameState.player) {
            return;
        }

        const upgrades = this.data.upgrades || {};
        const attackBonus = (upgrades.attack_power || 0) * (this.catalog.attack_power.effectPerLevel || 0);
        const maxHealthBonus = (upgrades.max_health || 0) * (this.catalog.max_health.effectPerLevel || 0);
        const manaRegenBonus = (upgrades.mana_regen || 0) * (this.catalog.mana_regen.effectPerLevel || 0);
        const masteryLevel = upgrades.skill_mastery || 0;
        const masteryBonus = masteryLevel * (this.catalog.skill_mastery.effectPerLevel || 0);

        const player = gameState.getPlayer ? gameState.getPlayer() : gameState.player;
        if (!player) {
            return;
        }

        const baseDamage = Math.max(0, (player.damage || 0) - (this.lastApplied.attackBonus || 0));
        const baseMaxHealth = Math.max(1, (player.maxHealth || 1) - (this.lastApplied.maxHealthBonus || 0));
        const baseManaRegen = Math.max(0, (player.manaRegenRate || 0) - (this.lastApplied.manaRegenBonus || 0));

        const newDamage = baseDamage + attackBonus;
        const newMaxHealth = baseMaxHealth + maxHealthBonus;
        const previousMaxHealth = player.maxHealth || baseMaxHealth;
        const healthDelta = newMaxHealth - previousMaxHealth;
        let newHealth = player.health || newMaxHealth;
        if (healthDelta > 0) {
            newHealth = Math.min(newMaxHealth, newHealth + healthDelta);
        } else if (newHealth > newMaxHealth) {
            newHealth = newMaxHealth;
        }

        const newManaRegen = baseManaRegen + manaRegenBonus;

        gameState.setPlayer({
            damage: newDamage,
            maxHealth: newMaxHealth,
            health: newHealth,
            manaRegenRate: newManaRegen
        });

        const permanent = {
            attackBonus,
            maxHealthBonus,
            manaRegenBonus,
            skillMasteryLevel: masteryLevel,
            skillMasteryBonus: masteryBonus
        };

        gameState.permanentUpgrades = {
            ...(gameState.permanentUpgrades || {}),
            ...permanent
        };
        this.lastApplied = { ...permanent };
    }

    getSkillMasteryBonus() {
        const entry = this.catalog.skill_mastery;
        return (this.data.upgrades?.skill_mastery || 0) * (entry.effectPerLevel || 0);
    }

    getState() {
        return {
            currency: this.getCurrency(),
            upgrades: { ...this.data.upgrades }
        };
    }

    listUpgrades() {
        return Object.values(this.catalog).map((entry) => ({
            id: entry.id,
            name: entry.name,
            description: entry.description,
            cost: this.getUpgradeCost(entry.id),
            level: this.getUpgradeLevel(entry.id)
        }));
    }
}

if (typeof module === 'object' && module && module.exports) {
    module.exports = ShopSystem;
}
if (typeof globalThis !== 'undefined') {
    globalThis.ShopSystem = ShopSystem;
}
