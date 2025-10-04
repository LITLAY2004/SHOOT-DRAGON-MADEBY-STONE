/**
 * 事件系统 - 负责游戏内的事件通信
 * 提供发布-订阅模式的事件管理
 */
class EventSystem {
    constructor() {
        this.listeners = new Map();
        this.onceListeners = new Map();
    }

    /**
     * 注册事件监听器
     * @param {string} event - 事件名称
     * @param {Function} callback - 回调函数
     * @param {Object} context - 上下文对象
     */
    on(event, callback, context = null) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push({ callback, context });
    }

    /**
     * 注册一次性事件监听器
     * @param {string} event - 事件名称
     * @param {Function} callback - 回调函数
     * @param {Object} context - 上下文对象
     */
    once(event, callback, context = null) {
        if (!this.onceListeners.has(event)) {
            this.onceListeners.set(event, []);
        }
        this.onceListeners.get(event).push({ callback, context });
    }

    /**
     * 移除事件监听器
     * @param {string} event - 事件名称
     * @param {Function} callback - 回调函数
     * @param {Object} context - 上下文对象
     */
    off(event, callback, context = null) {
        if (this.listeners.has(event)) {
            const listeners = this.listeners.get(event);
            const index = listeners.findIndex(l => l.callback === callback && l.context === context);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        }
    }

    /**
     * 触发事件
     * @param {string} event - 事件名称
     * @param {...any} args - 传递给监听器的参数
     */
    emit(event, ...args) {
        // 触发普通监听器
        if (this.listeners.has(event)) {
            const listeners = this.listeners.get(event);
            for (const { callback, context } of listeners) {
                try {
                    if (context) {
                        callback.call(context, ...args);
                    } else {
                        callback(...args);
                    }
                } catch (error) {
                    console.error(`事件监听器执行错误 [${event}]:`, error);
                }
            }
        }

        // 触发一次性监听器
        if (this.onceListeners.has(event)) {
            const listeners = this.onceListeners.get(event);
            for (const { callback, context } of listeners) {
                try {
                    if (context) {
                        callback.call(context, ...args);
                    } else {
                        callback(...args);
                    }
                } catch (error) {
                    console.error(`一次性事件监听器执行错误 [${event}]:`, error);
                }
            }
            // 清除一次性监听器
            this.onceListeners.delete(event);
        }
    }

    /**
     * 异步触发事件
     * @param {string} event - 事件名称
     * @param {...any} args - 传递给监听器的参数
     */
    async emitAsync(event, ...args) {
        return new Promise((resolve) => {
            setTimeout(() => {
                this.emit(event, ...args);
                resolve();
            }, 0);
        });
    }

    /**
     * 清除所有事件监听器
     */
    clear() {
        this.listeners.clear();
        this.onceListeners.clear();
    }

    /**
     * 清除指定事件的监听器
     * @param {string} event - 事件名称
     */
    clearEvent(event) {
        this.listeners.delete(event);
        this.onceListeners.delete(event);
    }

    /**
     * 检查是否有指定事件的监听器
     * @param {string} event - 事件名称
     * @returns {boolean}
     */
    hasListeners(event) {
        return (this.listeners.has(event) && this.listeners.get(event).length > 0) ||
               (this.onceListeners.has(event) && this.onceListeners.get(event).length > 0);
    }

    /**
     * 获取指定事件的监听器数量
     * @param {string} event - 事件名称
     * @returns {number}
     */
    getListenerCount(event) {
        let count = 0;
        if (this.listeners.has(event)) {
            count += this.listeners.get(event).length;
        }
        if (this.onceListeners.has(event)) {
            count += this.onceListeners.get(event).length;
        }
        return count;
    }

    /**
     * 预定义的游戏事件常量
     */
    static EVENTS = {
        // 游戏流程事件
        GAME_START: 'game_start',
        GAME_PAUSE: 'game_pause',
        GAME_RESUME: 'game_resume',
        GAME_OVER: 'game_over',
        WAVE_START: 'wave_start',
        WAVE_COMPLETE: 'wave_complete',
        
        // 实体事件
        PLAYER_MOVE: 'player_move',
        PLAYER_ATTACK: 'player_attack',
        PLAYER_DAMAGE: 'player_damage',
        PLAYER_HEAL: 'player_heal',
        
        DRAGON_SPAWN: 'dragon_spawn',
        DRAGON_DEATH: 'dragon_death',
        DRAGON_ATTACK: 'dragon_attack',
        
        TOWER_BUILD: 'tower_build',
        TOWER_UPGRADE: 'tower_upgrade',
        TOWER_ATTACK: 'tower_attack',
        
        BULLET_FIRE: 'bullet_fire',
        BULLET_HIT: 'bullet_hit',
        
        // 系统事件
        ACHIEVEMENT_UNLOCK: 'achievement_unlock',
        SCORE_UPDATE: 'score_update',
        LEVEL_UP: 'level_up',
        
        // 效果事件
        EFFECT_CREATE: 'effect_create',
        PARTICLE_CREATE: 'particle_create',
        SOUND_PLAY: 'sound_play',
        
        // 元素事件
        ELEMENT_EFFECT_APPLY: 'element_effect_apply',
        ELEMENT_EFFECT_REMOVE: 'element_effect_remove',
        
        // UI事件
        UI_UPDATE: 'ui_update',
        NOTIFICATION_SHOW: 'notification_show'
    };
}

// 导出模块
if (typeof module === 'object' && module && module.exports) {
    module.exports = EventSystem;
}
if (typeof globalThis !== 'undefined') {
    globalThis.EventSystem = EventSystem;
}
