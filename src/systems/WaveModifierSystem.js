/**
 * 波次修正系统：为每一波敌人添加随机增益或惩罚以提升可玩性
 */
class WaveModifierSystem {
    constructor(eventSystem, gameState, options = {}) {
        if (!eventSystem || !gameState) {
            throw new Error('WaveModifierSystem requires eventSystem and gameState');
        }

        this.eventSystem = eventSystem;
        this.gameState = gameState;
        this.random = typeof options.random === 'function' ? options.random : Math.random;
        this.modifiers = Array.isArray(options.modifiers) && options.modifiers.length
            ? options.modifiers
            : WaveModifierSystem.getDefaultModifiers();

        this.activeModifier = null;

        this.eventSystem.on('WAVE_START', (wave) => this.initializeWave(wave));
    }

    static getDefaultModifiers() {
        return [
            {
                id: 'frenzy',
                name: '疾风狂潮',
                description: '敌人移动更快，得分与经验略有提升。',
                unlockWave: 1,
                effects: {
                    speedMultiplier: 1.25,
                    damageMultiplier: 1.05
                },
                rewards: {
                    scoreMultiplier: 1.1,
                    experienceMultiplier: 1.05
                }
            },
            {
                id: 'ironwall',
                name: '钢铁洪流',
                description: '敌人生命显著提高，但击杀奖励更多分数。',
                unlockWave: 2,
                effects: {
                    healthMultiplier: 1.35
                },
                rewards: {
                    scoreMultiplier: 1.15
                },
                killBonuses: {
                    bonusScoreFlat: 40
                }
            },
            {
                id: 'bounty',
                name: '丰收猎季',
                description: '敌人更脆弱，击杀奖励额外经验并提高强化掉落概率。',
                unlockWave: 1,
                effects: {
                    healthMultiplier: 0.9,
                    damageMultiplier: 0.95
                },
                rewards: {
                    scoreMultiplier: 1.05,
                    experienceMultiplier: 1.2
                },
                killBonuses: {
                    bonusExperienceFlat: 15,
                    extraEnhancementChance: 0.25
                }
            },
            {
                id: 'arcane_storm',
                name: '奥能风暴',
                description: '敌人攻击更具威胁，强化掉落概率提升。',
                unlockWave: 3,
                effects: {
                    damageMultiplier: 1.2
                },
                rewards: {
                    scoreMultiplier: 1.08,
                    experienceMultiplier: 1.1
                },
                killBonuses: {
                    extraEnhancementChance: 0.15,
                    bonusScoreFlat: 20
                }
            }
        ];
    }

    initializeWave(wave = this.gameState.getWave()) {
        if (!this.modifiers.length) {
            this.activeModifier = null;
            return this.syncState();
        }

        const available = this.modifiers.filter((modifier) => {
            const unlockWave = modifier.unlockWave || 1;
            return wave >= unlockWave;
        });

        if (!available.length) {
            this.activeModifier = null;
            return this.syncState();
        }

        const chosen = this.pickModifier(available);
        this.activeModifier = { ...chosen, wave };
        this.syncState();
        this.eventSystem.emit('WAVE_MODIFIER_APPLIED', this.activeModifier);
        return this.activeModifier;
    }

    pickModifier(candidateList) {
        const index = Math.min(
            candidateList.length - 1,
            Math.floor(this.random() * candidateList.length)
        );
        return candidateList[index];
    }

    applyToDragon(dragon) {
        if (!dragon || !this.activeModifier) {
            return dragon;
        }

        const effects = this.activeModifier.effects || {};

        if (effects.healthMultiplier) {
            const factor = Math.max(0.3, effects.healthMultiplier);
            dragon.health = Math.max(1, Math.floor(dragon.health * factor));
            dragon.maxHealth = Math.max(1, Math.floor(dragon.maxHealth * factor));
        }

        if (effects.speedMultiplier) {
            dragon.speed *= effects.speedMultiplier;
        }

        if (effects.damageMultiplier) {
            dragon.damage = Math.max(1, Math.floor(dragon.damage * effects.damageMultiplier));
        }

        dragon.waveModifierId = this.activeModifier.id;
        return dragon;
    }

    getRewardModifiers() {
        const rewards = this.activeModifier?.rewards || {};
        return {
            scoreMultiplier: rewards.scoreMultiplier || 1,
            experienceMultiplier: rewards.experienceMultiplier || 1,
            flatScoreBonus: rewards.flatScoreBonus || 0,
            flatExperienceBonus: rewards.flatExperienceBonus || 0
        };
    }

    handleDragonDeath() {
        const bonuses = this.activeModifier?.killBonuses;
        if (!bonuses) {
            return {
                bonusScore: 0,
                bonusExperience: 0,
                extraEnhancement: null
            };
        }

        const result = {
            bonusScore: bonuses.bonusScoreFlat || 0,
            bonusExperience: bonuses.bonusExperienceFlat || 0,
            extraEnhancement: null
        };

        if (bonuses.extraEnhancementChance && this.random() < bonuses.extraEnhancementChance) {
            result.extraEnhancement = bonuses.buffType || 'random';
        }

        return result;
    }

    getActiveModifier() {
        return this.activeModifier;
    }

    syncState() {
        if (typeof this.gameState.setWaveModifier === 'function') {
            this.gameState.setWaveModifier(this.activeModifier);
        }
        return this.activeModifier;
    }
}

if (typeof module === 'object' && module && module.exports) {
    module.exports = WaveModifierSystem;
}
if (typeof globalThis !== 'undefined') {
    globalThis.WaveModifierSystem = WaveModifierSystem;
}
