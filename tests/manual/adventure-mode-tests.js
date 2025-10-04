const assert = require('assert');

const GameController = require('../../src/core/GameController.js');
const LevelConfig = require('../../src/config/LevelConfig.js');
const GameModeManager = require('../../src/systems/GameModeManager.js');

if (typeof global.LevelConfig === 'undefined') {
    global.LevelConfig = LevelConfig;
}

if (typeof global.EndlessMode !== 'function') {
    global.EndlessMode = class EndlessModeStub {
        constructor(game) {
            this.game = game;
        }
        start() { return true; }
        stop() {}
    };
}

if (typeof global.requestAnimationFrame !== 'function') {
    global.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 16);
}
if (typeof global.cancelAnimationFrame !== 'function') {
    global.cancelAnimationFrame = (id) => clearTimeout(id);
}

if (typeof global.document === 'undefined') {
    global.document = {
        addEventListener() {},
        removeEventListener() {},
        getElementById() {
            return { classList: { remove() {}, add() {} } };
        }
    };
}

const outcomes = [];

function recordResult(name, ok, error) {
    outcomes.push({ name, ok, error });
    if (ok) {
        console.log(`  ✅ ${name}`);
    } else {
        console.error(`  ❌ ${name}`);
        if (error) {
            console.error(error.stack || error);
        }
    }
}

function runTest(name, fn) {
    try {
        fn();
        recordResult(name, true);
    } catch (error) {
        recordResult(name, false, error);
    }
}

function createController() {
    const controller = new GameController();
    controller.start();
    controller.pause();
    controller.gameState.setGameState('started', true);
    controller.keys = {};
    return controller;
}

function destroyController(controller) {
    if (controller && typeof controller.stop === 'function') {
        controller.stop();
    }
}

function advancePowerUps(controller, seconds, step = 0.05) {
    let elapsed = 0;
    while (elapsed < seconds) {
        controller.updatePowerUps(step);
        elapsed += step;
    }
}

function assertMonotonicDifficulty() {
    const orderedIds = [1, 2, 3, 4, 5, 6];

    let lastSpawnRate = Infinity;
    let lastConcurrent = 0;
    let lastWaves = 0;
    let lastBossHealth = 0;

    orderedIds.forEach(id => {
        const level = LevelConfig.ADVENTURE_LEVELS[id];
        const waves = level.enemyWaves;

        assert(waves.spawnRate <= lastSpawnRate,
            `Level ${id} spawnRate should be <= previous level`);
        lastSpawnRate = waves.spawnRate;

        assert(waves.maxConcurrent >= lastConcurrent,
            `Level ${id} maxConcurrent should be >= previous level`);
        lastConcurrent = waves.maxConcurrent;

        assert(waves.totalWaves >= lastWaves,
            `Level ${id} total waves should be >= previous level`);
        lastWaves = waves.totalWaves;

        if (waves.bossWave && waves.bossWave.boss) {
            const boss = waves.bossWave.boss;
            assert(boss.health >= lastBossHealth,
                `Level ${id} boss health should be >= previous level`);
            lastBossHealth = boss.health;
        }
    });
}

function testPowerUpLifecycle() {
    const controller = createController();
    try {
        const level = LevelConfig.ADVENTURE_LEVELS[1];
        controller.configureAdventureLevel(level);

        controller.adventurePowerUpConfig.spawnInterval = 0.05;
        controller.adventurePowerUpConfig.maxActive = 2;
        controller.adventurePowerUpConfig.lifespan = 0.3;

        advancePowerUps(controller, 0.2);
        assert(controller.gameState.powerUps.length > 0,
            'Power-ups should spawn within configured interval');
        assert(controller.gameState.powerUps.length <= controller.adventurePowerUpConfig.maxActive,
            'Power-up count should respect maxActive');

        const initialCount = controller.gameState.powerUps.length;
        controller.adventurePowerUpConfig.spawnInterval = 999;
        controller.adventurePowerUpConfig.maxActive = 0;
        advancePowerUps(controller, 0.6);
        assert(controller.gameState.powerUps.length < initialCount,
            'Expired power-ups should disappear once lifespan ends');

        const player = controller.gameState.player;
        const baseInterval = controller.getCurrentAttackInterval();
        const baseDamage = player.damage;
        const baseSpeed = player.speed;

        const collectType = (type) => {
            controller.gameState.clearPowerUps();
            controller.configureAdventureLevel(level);
            controller.adventurePowerUpConfig.types = [type];
            controller.adventurePowerUpConfig.spawnInterval = 0.05;
            controller.adventurePowerUpConfig.maxActive = 1;
            advancePowerUps(controller, 0.2);
            const fruit = controller.gameState.powerUps[0];
            assert(fruit && fruit.type === type, `Fruit should spawn as ${type}`);
            player.x = fruit.x;
            player.y = fruit.y;
            controller.checkPlayerPowerUpCollisions();
        };

        collectType('attack');
        assert(player.damage > baseDamage, 'Attack fruit increases damage');

        const intervalAfterAttack = controller.getCurrentAttackInterval();
        assert(intervalAfterAttack <= baseInterval,
            'Attack fruit must not worsen firing interval');

        collectType('attack_speed');
        const intervalAfterSpeed = controller.getCurrentAttackInterval();
        assert(intervalAfterSpeed < intervalAfterAttack,
            'Attack speed fruit should reduce firing interval');

        collectType('move_speed');
        assert(player.speed > baseSpeed, 'Move speed fruit boosts movement');

        collectType('volley');
        assert.strictEqual(player.weaponMode, 'volley', 'Volley mode enabled');
        assert(player.weaponModeTimer > 0, 'Volley mode timer set');

        collectType('spread');
        assert(player.weaponMode === 'spread', 'Spread mode enabled');

        controller.configureAdventureLevel(level);
        controller.adventurePowerUpConfig.spawnInterval = 0.05;
        controller.adventurePowerUpConfig.maxActive = 2;
        controller.adventurePowerUpConfig.types = ['attack', 'move_speed'];
        advancePowerUps(controller, 0.4);
        assert(controller.gameState.powerUps.length <= 2,
            'Power-up count respects cap even after multiple spawns');
    } finally {
        destroyController(controller);
    }
}

function testPowerUpStacking() {
    const controller = createController();
    try {
        controller.configureAdventureLevel(LevelConfig.ADVENTURE_LEVELS[1]);
        const player = controller.gameState.player;
        const baseDamage = player.damage;
        const baseSpeed = player.speed;

        controller.applyPowerUpEffect('attack', player);
        controller.applyPowerUpEffect('move_speed', player);
        controller.applyPowerUpEffect('attack_speed', player);

        assert(player.damage > baseDamage, 'Attack buff stacks');
        assert(player.speed > baseSpeed, 'Speed buff stacks');
        const interval = controller.getCurrentAttackInterval();
        assert(interval < 250, 'Attack speed buff reduces firing interval');

        controller.applyPowerUpEffect('volley', player);
        player.weaponModeTimer = 0.05;
        controller.updatePlayerBuffs(0.1);
        assert.strictEqual(player.weaponMode, 'single', 'Weapon mode reverts after timer');
    } finally {
        destroyController(controller);
    }
}

function testObstacleInteractions() {
    const controller = createController();
    try {
        controller.configureAdventureLevel(LevelConfig.ADVENTURE_LEVELS[1]);
        const player = controller.gameState.player;
        controller.gameState.setObstacles([{ x: 320, y: 280, width: 120, height: 40 }]);

        player.x = 360;
        player.y = 300;
        controller.keys = { a: true };
        controller.updatePlayer(player, 0.2);
        assert(player.x >= 260, 'Player should not phase through obstacles');

        player.x = 310;
        player.y = 300;
        const dragon = {
            x: 300,
            y: 300,
            radius: 28,
            skillState: {
                charge: {
                    phase: 'charging',
                    direction: { x: 1, y: 0 },
                    hasStruck: false
                }
            }
        };
        controller.applyChargeDamage(dragon, { damage: 0, knockback: 160 });
        assert(!controller.isCircleCollidingWithObstacles(player.x, player.y, player.radius),
            'Knockback should respect obstacle boundaries');

        controller.gameState.addBullet({
            id: 'test-bullet', x: 260, y: 300, vx: 200, vy: 0,
            radius: 3, life: 2, damage: 10, element: 'normal'
        });
        const bullet = controller.gameState.getBullets()[0];
        controller.updateBullet(bullet, 0.3);
        const stillPresent = controller.gameState.getBullets().some(b => b.id === 'test-bullet');
        assert(stillPresent, 'Obstacles should not remove bullets');

        player.x = 5;
        player.y = 5;
        controller.keys = { a: true, w: true };
        controller.updatePlayer(player, 0.3);
        assert(player.x >= player.radius && player.y >= player.radius,
            'Clamp keeps player inside arena');
    } finally {
        destroyController(controller);
    }
}

function testSerialization() {
    const controller = createController();
    try {
        controller.configureAdventureLevel(LevelConfig.ADVENTURE_LEVELS[1]);
        const player = controller.gameState.player;
        player.weaponMode = 'spread';
        player.weaponModeTimer = 10;
        player.attackSpeedBonus = 0.5;
        controller.gameState.setObstacles([{ x: 200, y: 200, width: 50, height: 50 }]);
        controller.gameState.addPowerUp({ id: 'test', type: 'attack', x: 220, y: 220, radius: 16, age: 0, lifespan: 10 });

        const snapshot = controller.gameState.getSnapshot();

        controller.gameState.clearObstacles();
        controller.gameState.clearPowerUps();
        player.weaponMode = 'single';
        player.weaponModeTimer = 0;
        player.attackSpeedBonus = 0;

        controller.gameState.restoreFromSnapshot(snapshot);

        assert.strictEqual(controller.gameState.obstacles.length, 1, 'Obstacles restored from snapshot');
        assert.strictEqual(controller.gameState.powerUps.length, 1, 'Power-ups restored from snapshot');
        assert.strictEqual(controller.gameState.player.weaponMode, 'spread', 'Weapon mode restored');
        assert(controller.gameState.player.attackSpeedBonus > 0, 'Attack speed bonus restored');
    } finally {
        destroyController(controller);
    }
}

function testModeSwitchResets() {
    const controller = createController();
    try {
        const level = LevelConfig.ADVENTURE_LEVELS[1];
        controller.configureAdventureLevel(level);
        controller.gameState.addPowerUp({ id: 'p', type: 'attack', x: 200, y: 200, radius: 16, age: 0, lifespan: 10 });

        let configureCalls = 0;
        const gameStub = {
            configureAdventureLevel: (lvl) => {
                if (lvl) {
                    configureCalls += 1;
                } else {
                    controller.clearAdventureLevelConfig();
                }
            },
            gameController: controller,
            eventSystem: { on() {}, emit() {} },
            backgroundEffects: { setTheme() {} },
            particleSystem: { createParticle() {} },
            audioSystem: { playBackgroundMusic() {} },
            waveManager: { clearEnemies() {} },
            towerManager: { clearTowers() {} },
            startGame() {},
            gameStarted: true
        };

        const manager = new GameModeManager(gameStub);
        manager.setupLevelEnvironment(level);
        assert(configureCalls > 0, 'configureAdventureLevel should be called for adventure levels');

        manager.startEndlessMode();
        assert.strictEqual(controller.gameState.obstacles.length, 0,
            'Obstacles cleared when switching to endless');
        assert.strictEqual(controller.gameState.powerUps.length, 0,
            'Power-ups cleared when switching to endless');

        controller.configureAdventureLevel(level);
        assert(controller.gameState.obstacles.length > 0,
            'Re-entering adventure restores obstacles');
    } finally {
        destroyController(controller);
    }
}

function testDifficultyMetric() {
    const orderedIds = [1, 2, 3, 4, 5, 6];
    const scores = orderedIds.map(id => {
        const level = LevelConfig.ADVENTURE_LEVELS[id];
        const waves = level.enemyWaves;
        const spawnFactor = 2000 / waves.spawnRate;
        return spawnFactor * waves.maxConcurrent * waves.totalWaves;
    });
    for (let i = 1; i < scores.length; i++) {
        assert(scores[i] >= scores[i - 1],
            `Difficulty score should increase between levels ${orderedIds[i - 1]} and ${orderedIds[i]}`);
    }
}

console.log('▶️  Adventure mode comprehensive tests');

runTest('Level scaling increases difficulty parameters', () => {
    assertMonotonicDifficulty();
});

runTest('Power-up lifecycle and limits', () => {
    testPowerUpLifecycle();
});

runTest('Power-up stacking behaviour', () => {
    testPowerUpStacking();
});

runTest('Obstacle collisions and bullet behaviour', () => {
    testObstacleInteractions();
});

runTest('Game state snapshot restores adventure state', () => {
    testSerialization();
});

runTest('Mode switching resets adventure configuration', () => {
    testModeSwitchResets();
});

runTest('Difficulty metric grows monotonically', () => {
    testDifficultyMetric();
});

if (outcomes.some(result => !result.ok)) {
    console.error('❗ Adventure mode tests encountered failures');
    process.exitCode = 1;
} else {
    console.log('🎉  Adventure mode tests all passed');
}
