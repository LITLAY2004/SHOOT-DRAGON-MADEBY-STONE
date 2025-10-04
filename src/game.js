/**
 * Legacy compatibility entry point.
 * Delegates to the modular DragonHunterGame implementation.
 */

(function attachDragonHunter(global) {
  const canRequire = typeof module === 'object' && module && !module.__browser && module.exports && typeof require === 'function';
  let DragonHunterGame;

  if (canRequire) {
    try {
      DragonHunterGame = require('./game-refactored.js');
    } catch (err) {
      DragonHunterGame = global && global.DragonHunterGame;
    }
  }

  if (!DragonHunterGame && global && global.DragonHunterGame) {
    DragonHunterGame = global.DragonHunterGame;
  }

  if (!DragonHunterGame) {
    throw new Error('DragonHunterGame implementation not found');
  }

  if (global) {
    global.DragonHunterGame = DragonHunterGame;
  }

  if (typeof module === 'object' && module && module.exports) {
    module.exports = DragonHunterGame;
  }
}(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this)));
