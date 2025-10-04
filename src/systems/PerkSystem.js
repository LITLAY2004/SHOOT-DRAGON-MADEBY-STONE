/**
 * 等级奖励系统：当玩家升级时授予随机特权以拓展玩法
 */
class PerkSystem {
    constructor(eventSystem, gameState, options = {}) {
        if (!eventSystem || !gameState) {
            throw new Error('PerkSystem requires eventSystem and gameState');
        }

        this.eventSystem = eventSystem;
        this.gameState = gameState;
        this.enhancementSystem = options.enhancementSystem || null;
        this.comboSystem = options.comboSystem || null;
        this.random = typeof options.random === 'function' ? options.random : Math.random;

        this.perks = Array.isArray(options.perks) && options.perks.length
            ? options.perks
            : PerkSystem.getDefaultPerks();
    }

    static getDefaultPerks() {
        return [
            {
                id: 'vital_surge',
                name: '活力涌动',
                description: '最大生命值提升并立即治愈一部分生命。',
                unlockLevel: 1,
                unique: true,
                payload: { heal: 25, bonusHealth: 25 }
            },
            {
                id: 'weapon_mastery',
                name: '武器专精',
                description: '基础伤害永久提升15%。',
                unlockLevel: 1,
                unique: false,
                payload: { damageMultiplier: 1.15 }
            },
            {
                id: 'rapid_reload',
                name: '迅捷装填',
                description: '射速强化提升，经常触发连射。',
                unlockLevel: 2,
                unique: false,
                payload: { buffType: 'fire_rate' }
            },
            {
                id: 'multi_vector',
                name: '多向打击',
                description: '获得一次额外齐射强化。',
                unlockLevel: 3,
                unique: false,
                payload: { buffType: 'multi_shot' }
            },
            {
                id: 'combo_extension',
                name: '连击节奏',
                description: '连击保持时间延长1.5秒。',
                unlockLevel: 2,
                unique: true,
                payload: { windowBonus: 1.5 }
            },
            {
                id: 'elemental_alignment',
                name: '元素调谐',
                description: '切换武器至随机高阶元素，强化克制效果。',
                unlockLevel: 3,
                unique: false
            },
            {
                id: 'swift_step',
                name: '迅捷步伐',
                description: '移动速度提升12%。',
                unlockLevel: 1,
                unique: false,
                payload: { speedMultiplier: 1.12 }
            },
            {
                id: 'veteran_instinct',
                name: '老练直觉',
                description: '综合提升伤害与移动速度。',
                unlockLevel: 5,
                unique: true,
                payload: { damageMultiplier: 1.1, speedMultiplier: 1.05 }
            }
        ];
    }

    getAvailablePerks(level) {
        const unlocked = this.gameState.getPerks ? this.gameState.getPerks() : [];
        const claimedIds = new Set(unlocked.map((perk) => perk.id));

        return this.perks.filter((perk) => {
            const unlockLevel = perk.unlockLevel || 1;
            if (level < unlockLevel) {
                return false;
            }
            if (perk.unique && claimedIds.has(perk.id)) {
                return false;
            }
            return true;
        });
    }

    grantPerk(context = {}) {
        const level = context.level || this.gameState.player.level;
        const available = this.getAvailablePerks(level);

        if (!available.length) {
            return null;
        }

        const chosen = this.pickPerk(available);
        if (!chosen) {
            return null;
        }

        this.applyPerk(chosen);
        if (typeof this.gameState.addPerk === 'function') {
            this.gameState.addPerk({
                id: chosen.id,
                name: chosen.name,
                level,
                grantedAt: Date.now()
            });
        }

        this.eventSystem.emit('PERK_GRANTED', {
            perk: chosen,
            level
        });

        return chosen;
    }

    pickPerk(candidateList) {
        const index = Math.min(
            candidateList.length - 1,
            Math.floor(this.random() * candidateList.length)
        );
        return candidateList[index];
    }

    applyPerk(perk) {
        const player = this.gameState.player;
        const payload = perk.payload || {};
        const updates = {};

        switch (perk.id) {
            case 'vital_surge':
                updates.maxHealth = player.maxHealth + (payload.bonusHealth || 20);
                updates.health = Math.min(
                    updates.maxHealth,
                    player.health + (payload.heal || 20)
                );
                break;
            case 'weapon_mastery':
                updates.damage = Math.max(1, Math.round(player.damage * (payload.damageMultiplier || 1.15)));
                break;
            case 'rapid_reload':
            case 'multi_vector':
                if (this.enhancementSystem && payload.buffType) {
                    this.enhancementSystem.applyEnhancement(payload.buffType);
                }
                break;
            case 'combo_extension':
                if (this.comboSystem && payload.windowBonus) {
                    this.comboSystem.extendWindow(payload.windowBonus);
                }
                break;
            case 'elemental_alignment':
                updates.weaponElement = this.pickElement(player.weaponElement);
                break;
            case 'swift_step':
                updates.speed = Math.round(player.speed * (payload.speedMultiplier || 1.12));
                break;
            case 'veteran_instinct':
                updates.damage = Math.max(1, Math.round(player.damage * (payload.damageMultiplier || 1.1)));
                updates.speed = Math.round(player.speed * (payload.speedMultiplier || 1.05));
                break;
            default:
                break;
        }

        if (Object.keys(updates).length) {
            this.gameState.setPlayer(updates);
        }
    }

    pickElement(currentElement) {
        const elements = ['fire', 'ice', 'thunder', 'poison', 'dark'];
        if (!elements.length) {
            return currentElement || 'fire';
        }

        let index = Math.floor(this.random() * elements.length);
        index = Math.min(elements.length - 1, index);

        let chosen = elements[index];
        if (chosen === currentElement) {
            chosen = elements[(index + 1) % elements.length];
        }
        return chosen;
    }
}

if (typeof module === 'object' && module && module.exports) {
    module.exports = PerkSystem;
}
if (typeof globalThis !== 'undefined') {
    globalThis.PerkSystem = PerkSystem;
}
