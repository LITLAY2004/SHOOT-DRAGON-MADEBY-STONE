/**
 * 资源与战利品系统
 * 管理金币、水晶掉落、收集以及锻造升级逻辑
 */
class ResourceSystem {
    constructor(eventSystem, gameState, options = {}) {
        if (!eventSystem || !gameState) {
            throw new Error('ResourceSystem requires eventSystem and gameState');
        }

        this.eventSystem = eventSystem;
        this.gameState = gameState;
        this.random = typeof options.random === 'function' ? options.random : Math.random;
        this.enhancementSystem = options.enhancementSystem || null;

        this.config = {
            tokenRange: options.tokenRange || [3, 5],
            tokenWaveBonus: options.tokenWaveBonus || 1,
            tokenComboBonus: options.tokenComboBonus || 0.1,
            crystalDropChance: options.crystalDropChance || 0.08,
            crystalComboBonus: options.crystalComboBonus || 0.04,
            crystalWaveBonus: options.crystalWaveBonus || 0.01,
            lootLifetime: options.lootLifetime || 7.5,
            autoMagnetDelay: options.autoMagnetDelay || 2.0,
            collectDistance: options.collectDistance || 40,
            magnetDistance: options.magnetDistance || 160,
            magnetSpeed: options.magnetSpeed || 260,
            gravity: options.gravity || 420,
            drag: options.drag || 0.88,
            syncInterval: options.syncInterval || 0.2
        };

        this.baseConfig = { ...this.config };
        this.difficultyModifiers = {
            tokenDrop: 1,
            crystalChance: 1,
            lootValue: 1,
            lootLifetime: 1,
            magnetRange: 1,
            collectRange: 1,
            autoMagnetDelay: 1
        };

        this.needsSync = false;
        this.syncTimer = 0;
    }

    setDifficultyModifiers(modifiers = {}) {
        if (!this.baseConfig) {
            this.baseConfig = { ...this.config };
        }

        const normalized = {
            tokenDrop: typeof modifiers.tokenDrop === 'number' ? modifiers.tokenDrop : (this.difficultyModifiers.tokenDrop ?? 1),
            crystalChance: typeof modifiers.crystalChance === 'number' ? modifiers.crystalChance : (this.difficultyModifiers.crystalChance ?? 1),
            lootValue: typeof modifiers.lootValue === 'number' ? modifiers.lootValue : (this.difficultyModifiers.lootValue ?? 1),
            lootLifetime: typeof modifiers.lootLifetime === 'number' ? modifiers.lootLifetime : (this.difficultyModifiers.lootLifetime ?? 1),
            magnetRange: typeof modifiers.magnetRange === 'number' ? modifiers.magnetRange : (this.difficultyModifiers.magnetRange ?? 1),
            collectRange: typeof modifiers.collectRange === 'number' ? modifiers.collectRange : (this.difficultyModifiers.collectRange ?? 1),
            autoMagnetDelay: typeof modifiers.autoMagnetDelay === 'number' ? modifiers.autoMagnetDelay : (this.difficultyModifiers.autoMagnetDelay ?? 1)
        };

        normalized.tokenDrop = Math.max(0, normalized.tokenDrop);
        normalized.crystalChance = Math.max(0, normalized.crystalChance);
        normalized.lootValue = Math.max(0.1, normalized.lootValue);
        normalized.lootLifetime = Math.max(0.2, normalized.lootLifetime);
        normalized.magnetRange = Math.max(0.25, normalized.magnetRange);
        normalized.collectRange = Math.max(0.25, normalized.collectRange);
        normalized.autoMagnetDelay = Math.max(0.2, normalized.autoMagnetDelay);

        this.difficultyModifiers = normalized;

        const clamp = (value, min) => Math.max(min, value);
        this.config.lootLifetime = clamp(this.baseConfig.lootLifetime * normalized.lootLifetime, 1.0);
        this.config.autoMagnetDelay = clamp(this.baseConfig.autoMagnetDelay * normalized.autoMagnetDelay, 0.5);
        this.config.magnetDistance = clamp(this.baseConfig.magnetDistance * normalized.magnetRange, 40);
        this.config.collectDistance = clamp(this.baseConfig.collectDistance * normalized.collectRange, 10);
    }

    onGameStart() {}

    handleDragonDeath(dragon, context = {}) {
        if (!dragon) {
            return [];
        }

        const drops = [];
        const wave = Math.max(1, this.gameState.getWave());
        const combo = context.combo || {};

        const tokenAmount = this.calculateTokenDrop(wave, combo);
        if (tokenAmount > 0) {
            drops.push(this.spawnLoot(dragon, 'shop_token', tokenAmount));
        }

        if (this.shouldDropCrystal(wave, combo)) {
            const crystals = this.calculateCrystalDrop(wave, combo);
            drops.push(this.spawnLoot(dragon, 'crystals', crystals));
        }

        return drops;
    }

    update(deltaTime, player) {
        if (!player) {
            return;
        }

        const lootList = this.gameState.loot;
        if (!Array.isArray(lootList) || lootList.length === 0) {
            this.syncTimer = Math.max(0, this.syncTimer - deltaTime);
            return;
        }

        for (let i = lootList.length - 1; i >= 0; i -= 1) {
            const loot = lootList[i];
            loot.age = (loot.age || 0) + deltaTime;

            const dx = player.x - loot.x;
            const dy = player.y - loot.y;
            const distanceSq = dx * dx + dy * dy;
            const collectDistanceSq = this.config.collectDistance * this.config.collectDistance;
            const magnetDistanceSq = this.config.magnetDistance * this.config.magnetDistance;

            if (distanceSq <= collectDistanceSq) {
                this.collectLoot(loot);
                continue;
            }

            if (loot.age >= this.config.lootLifetime) {
                this.gameState.removeLoot(loot);
                this.needsSync = true;
                continue;
            }

            const magnetized = loot.magnetized || false;
            if (!magnetized && (distanceSq <= magnetDistanceSq || loot.age >= this.config.autoMagnetDelay)) {
                loot.magnetized = true;
                this.needsSync = true;
            }

            if (loot.magnetized) {
                const distance = Math.sqrt(distanceSq) || 1;
                const speed = this.config.magnetSpeed;
                loot.x += (dx / distance) * speed * deltaTime;
                loot.y += (dy / distance) * speed * deltaTime;
            } else {
                loot.vx = (loot.vx || 0) * this.config.drag;
                loot.vy = (loot.vy || 0) + this.config.gravity * deltaTime;
                loot.x += loot.vx * deltaTime;
                loot.y += loot.vy * deltaTime;
            }

            // 缓慢旋转效果
            loot.rotation = (loot.rotation || 0) + deltaTime * 2.5;
        }

        this.syncTimer -= deltaTime;
        if (this.needsSync && this.syncTimer <= 0) {
            this.syncTimer = this.config.syncInterval;
            this.needsSync = false;
            this.gameState.notifyChange('loot', this.gameState.getLoot());
        }
    }

    collectLoot(loot) {
        if (!loot) {
            return;
        }

        if (loot.type === 'ability_upgrade') {
            this.gameState.removeLoot(loot);
            this.needsSync = true;
            if (loot.value) {
                this.eventSystem.emit('ABILITY_UPGRADE_LOOT', {
                    abilityId: loot.value,
                    loot
                });
            }
            return;
        }

        if (loot.type === 'shop_token') {
            this.gameState.removeLoot(loot);
            this.needsSync = true;
            const amount = Math.max(1, Math.floor(loot.value || 1));
            this.eventSystem.emit('SHOP_TOKEN_COLLECTED', {
                amount,
                loot
            });
            return;
        }

        if (loot.type === 'reward_bonus') {
            this.gameState.removeLoot(loot);
            this.needsSync = true;
            const bonusValue = (loot.value && typeof loot.value === 'object')
                ? { ...loot.value }
                : (loot.bonus ? { ...loot.bonus } : loot.value);
            this.eventSystem.emit('REWARD_BONUS_LOOT_COLLECTED', {
                bonus: bonusValue,
                loot
            });
            return;
        }

        const resources = this.gameState.collectLoot(loot);
        this.needsSync = true;
        this.eventSystem.emit('LOOT_COLLECTED', {
            loot,
            resources
        });
    }

    spawnLoot(source, type, value) {
        const radiusMap = {
            ability_upgrade: 14,
            crystals: 12,
            reward_bonus: 16,
            shop_token: 10
        };
        const baseRadius = radiusMap[type] || 10;
        const payloadValue = (value && typeof value === 'object') ? { ...value } : value;
        const horizontalSpeed = type === 'reward_bonus' ? 120 : 90;
        const verticalBase = type === 'reward_bonus' ? 120 : 80;
        const loot = {
            id: `loot-${Date.now()}-${Math.floor(this.random() * 1e6)}`,
            type,
            value: payloadValue,
            x: source.x,
            y: source.y,
            vx: (this.random() - 0.5) * horizontalSpeed,
            vy: -verticalBase - this.random() * (verticalBase + 40),
            radius: baseRadius,
            age: 0,
            magnetized: false,
            rotation: 0
        };

        if (type === 'reward_bonus' && payloadValue) {
            loot.bonus = (payloadValue && typeof payloadValue === 'object') ? { ...payloadValue } : payloadValue;
        }

        this.gameState.addLoot(loot);
        this.needsSync = true;
        this.eventSystem.emit('LOOT_SPAWNED', loot);
        return loot;
    }

    calculateTokenDrop(wave, combo) {
        const [minTokens, maxTokens] = this.config.tokenRange;
        const base = minTokens + this.random() * (maxTokens - minTokens);
        const waveBonus = Math.max(0, wave - 1) * this.config.tokenWaveBonus;
        const comboBonus = (combo.count || 0) * this.config.tokenComboBonus;
        const multiplier = this.difficultyModifiers.tokenDrop ?? 1;
        return Math.max(0, Math.round((base + waveBonus + comboBonus) * multiplier));
    }

    shouldDropCrystal(wave, combo) {
        const chance = this.config.crystalDropChance +
            (combo.count >= 4 ? this.config.crystalComboBonus : 0) +
            (wave * this.config.crystalWaveBonus);
        const multiplier = this.difficultyModifiers.crystalChance ?? 1;
        return this.random() < Math.min(0.6, chance * multiplier);
    }

    calculateCrystalDrop(wave, combo) {
        let amount = 1;
        if (wave >= 7) {
            amount += 1;
        }
        if (combo.best >= 10) {
            amount += 1;
        }
        const multiplier = this.difficultyModifiers.lootValue ?? 1;
        return Math.max(1, Math.round(amount * multiplier));
    }

}

if (typeof module === 'object' && module && module.exports) {
    module.exports = ResourceSystem;
}
if (typeof globalThis !== 'undefined') {
    globalThis.ResourceSystem = ResourceSystem;
}
