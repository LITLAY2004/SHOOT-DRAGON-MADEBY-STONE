/**
 * 连击系统：根据连续击杀提供得分与经验加成
 */
class ComboSystem {
    constructor(eventSystem, gameState, options = {}) {
        if (!eventSystem || !gameState) {
            throw new Error('ComboSystem requires eventSystem and gameState');
        }

        this.eventSystem = eventSystem;
        this.gameState = gameState;
        this.options = options;

        this.baseWindow = Math.max(1, options.comboWindow || 6);
        this.windowBonus = 0;
        this.currentCombo = 0;
        this.bestCombo = 0;
        this.timer = 0;
        this.lastKillTime = null;
        this.multiplier = 1;
        this.experienceMultiplier = 1;

        this.syncState();
    }

    getWindow() {
        return this.baseWindow + this.windowBonus;
    }

    extendWindow(amount) {
        if (typeof amount !== 'number' || amount <= 0) {
            return this.getState();
        }
        this.windowBonus = Math.max(0, this.windowBonus + amount);
        return this.syncState();
    }

    registerKill(context = {}) {
        const now = typeof context.gameTime === 'number'
            ? context.gameTime
            : this.gameState.getGameTime();

        if (this.lastKillTime !== null && now - this.lastKillTime <= this.getWindow()) {
            this.currentCombo += 1;
        } else {
            this.currentCombo = 1;
        }

        this.lastKillTime = now;
        this.timer = this.getWindow();

        this.multiplier = 1 + Math.floor((this.currentCombo - 1) / 3) * 0.25;
        this.experienceMultiplier = 1 + Math.floor((this.currentCombo - 1) / 4) * 0.1;

        if (this.currentCombo > this.bestCombo) {
            this.bestCombo = this.currentCombo;
        }

        const bonusScore = this.currentCombo > 0 && this.currentCombo % 5 === 0
            ? 40 * (this.currentCombo / 5)
            : 0;
        const bonusExperience = this.currentCombo > 3
            ? 5 * (this.currentCombo - 3)
            : 0;

        const state = this.syncState();
        const payload = {
            ...state,
            multiplier: this.multiplier,
            experienceMultiplier: this.experienceMultiplier,
            bonusScore,
            bonusExperience
        };

        this.eventSystem.emit('COMBO_UPDATED', payload);
        return payload;
    }

    update(deltaTime) {
        if (this.currentCombo === 0 || typeof deltaTime !== 'number') {
            return;
        }

        this.timer = Math.max(0, this.timer - deltaTime);
        if (this.timer === 0) {
            this.reset('timeout');
        } else {
            this.syncState();
        }
    }

    reset(reason = 'manual') {
        this.currentCombo = 0;
        this.timer = 0;
        this.lastKillTime = null;
        this.multiplier = 1;
        this.experienceMultiplier = 1;

        const state = this.syncState();
        this.eventSystem.emit('COMBO_RESET', { reason, state });
        return state;
    }

    getState() {
        return {
            count: this.currentCombo,
            best: this.bestCombo,
            timeRemaining: this.timer,
            window: this.getWindow(),
            multiplier: this.multiplier,
            experienceMultiplier: this.experienceMultiplier
        };
    }

    syncState() {
        const snapshot = this.getState();
        if (typeof this.gameState.setComboState === 'function') {
            this.gameState.setComboState(snapshot);
        }
        return snapshot;
    }
}

if (typeof module === 'object' && module && module.exports) {
    module.exports = ComboSystem;
}
if (typeof globalThis !== 'undefined') {
    globalThis.ComboSystem = ComboSystem;
}
