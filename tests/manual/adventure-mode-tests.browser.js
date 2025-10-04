(function () {
    const assert = (condition, message) => {
        if (!condition) {
            throw new Error(message || 'Assertion failed');
        }
    };

    const resultsContainer = document.getElementById('testResults');
    const runButton = document.getElementById('runAdventureTests');
    const summaryLabel = document.getElementById('testSummary');

    const levelIds = [1, 2, 3, 4, 5, 6];

    function logResult(name, ok, message) {
        const li = document.createElement('li');
        li.className = ok ? 'pass' : 'fail';
        li.textContent = `${ok ? '✅' : '❌'} ${name}${message ? ` — ${message}` : ''}`;
        resultsContainer.appendChild(li);
    }

    function createController() {
        const controller = new window.GameController();
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

    function testLevelScaling() {
        let lastSpawnRate = Infinity;
        let lastConcurrent = 0;
        let lastWaves = 0;
        let lastBossHealth = 0;

        levelIds.forEach(id => {
            const level = window.LevelConfig.ADVENTURE_LEVELS[id];
            const waves = level.enemyWaves;
            assert(waves.spawnRate <= lastSpawnRate,
                `第 ${id} 关的刷新间隔应当不高于上一关`);
            lastSpawnRate = waves.spawnRate;

            assert(waves.maxConcurrent >= lastConcurrent,
                `第 ${id} 关的同时敌人数应当不低于上一关`);
            lastConcurrent = waves.maxConcurrent;

            assert(waves.totalWaves >= lastWaves,
                `第 ${id} 关的总波次应当不低于上一关`);
            lastWaves = waves.totalWaves;

            if (waves.bossWave && waves.bossWave.boss) {
                const boss = waves.bossWave.boss;
                assert(boss.health >= lastBossHealth,
                    `第 ${id} 关的 Boss 血量应当不低于上一关`);
                lastBossHealth = boss.health;
            }
        });
    }

    function testPowerUpLifecycle() {
        const controller = createController();
        try {
            const level = window.LevelConfig.ADVENTURE_LEVELS[1];
            controller.configureAdventureLevel(level);

            controller.adventurePowerUpConfig.spawnInterval = 0.05;
            controller.adventurePowerUpConfig.maxActive = 2;
            controller.adventurePowerUpConfig.lifespan = 0.3;

            advancePowerUps(controller, 0.2);
            assert(controller.gameState.powerUps.length > 0,
                '强化果实应当在设定时间内刷新');
            assert(controller.gameState.powerUps.length <= controller.adventurePowerUpConfig.maxActive,
                '强化果实数量不得超过上限');

            const initialCount = controller.gameState.powerUps.length;
            controller.adventurePowerUpConfig.spawnInterval = 999;
            controller.adventurePowerUpConfig.maxActive = 0;
            advancePowerUps(controller, 0.6);
            assert(controller.gameState.powerUps.length < initialCount,
                '超时的强化果实需要消失');

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
                assert(fruit && fruit.type === type, `应当刷出 ${type} 类型果实`);
                player.x = fruit.x;
                player.y = fruit.y;
                controller.checkPlayerPowerUpCollisions();
            };

            collectType('attack');
            assert(player.damage > baseDamage, '攻击果实应当提升面板伤害');

            const intervalAfterAttack = controller.getCurrentAttackInterval();
            collectType('attack_speed');
            const intervalAfterSpeed = controller.getCurrentAttackInterval();
            assert(intervalAfterSpeed < intervalAfterAttack,
                '攻速果实应当缩短攻击间隔');

            collectType('move_speed');
            assert(player.speed > baseSpeed, '移动果实应当提升速度');

            collectType('volley');
            assert(player.weaponMode === 'volley' && player.weaponModeTimer > 0,
                '齐射果实应当切换武器模式');

            collectType('spread');
            assert(player.weaponMode === 'spread', '散射果实应当切换武器模式');

            controller.configureAdventureLevel(level);
            controller.adventurePowerUpConfig.spawnInterval = 0.05;
            controller.adventurePowerUpConfig.maxActive = 2;
            controller.adventurePowerUpConfig.types = ['attack', 'move_speed'];
            advancePowerUps(controller, 0.4);
            assert(controller.gameState.powerUps.length <= 2,
                '多类型刷新的数量仍须遵守上限');
        } finally {
            destroyController(controller);
        }
    }

    function testPowerUpStacking() {
        const controller = createController();
        try {
            controller.configureAdventureLevel(window.LevelConfig.ADVENTURE_LEVELS[1]);
            const player = controller.gameState.player;
            const baseDamage = player.damage;
            const baseSpeed = player.speed;

            controller.applyPowerUpEffect('attack', player);
            controller.applyPowerUpEffect('move_speed', player);
            controller.applyPowerUpEffect('attack_speed', player);

            assert(player.damage > baseDamage, '攻击果实效果应当被保留');
            assert(player.speed > baseSpeed, '移动速度增益应当被保留');
            assert(controller.getCurrentAttackInterval() < 250,
                '累计攻速提升后间隔应当低于基础值');

            controller.applyPowerUpEffect('volley', player);
            player.weaponModeTimer = 0.05;
            controller.updatePlayerBuffs(0.1);
            assert(player.weaponMode === 'single', '武器模式计时结束后应当归位');
        } finally {
            destroyController(controller);
        }
    }

    function testObstacleInteractions() {
        const controller = createController();
        try {
            controller.configureAdventureLevel(window.LevelConfig.ADVENTURE_LEVELS[1]);
            const player = controller.gameState.player;
            controller.gameState.setObstacles([{ x: 320, y: 280, width: 120, height: 40 }]);

            player.x = 360;
            player.y = 300;
            controller.keys = { a: true };
            controller.updatePlayer(player, 0.2);
            assert(player.x >= 260, '角色不应穿过障碍物');

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
                '击退后角色仍需处于障碍物外');

            controller.gameState.addBullet({
                id: 'test-bullet', x: 260, y: 300, vx: 200, vy: 0,
                radius: 3, life: 2, damage: 10, element: 'normal'
            });
            const bullet = controller.gameState.getBullets()[0];
            controller.updateBullet(bullet, 0.3);
            const stillPresent = controller.gameState.getBullets().some(b => b.id === 'test-bullet');
            assert(stillPresent, '子弹不应被障碍物移除');

            player.x = 5;
            player.y = 5;
            controller.keys = { a: true, w: true };
            controller.updatePlayer(player, 0.3);
            assert(player.x >= player.radius && player.y >= player.radius,
                '角色应当被限制在地图边界内');
        } finally {
            destroyController(controller);
        }
    }

    function testSerialization() {
        const controller = createController();
        try {
            controller.configureAdventureLevel(window.LevelConfig.ADVENTURE_LEVELS[1]);
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

            assert(controller.gameState.obstacles.length === 1, '障碍物应当从快照恢复');
            assert(controller.gameState.powerUps.length === 1, '强化果实应当从快照恢复');
            assert(controller.gameState.player.weaponMode === 'spread', '武器模式应当从快照恢复');
        } finally {
            destroyController(controller);
        }
    }

    function testModeSwitch() {
        const controller = createController();
        try {
            const level = window.LevelConfig.ADVENTURE_LEVELS[1];
            controller.configureAdventureLevel(level);
            controller.gameState.addPowerUp({ id: 'p', type: 'attack', x: 200, y: 200, radius: 16, age: 0, lifespan: 10 });

            let adventureConfigured = 0;
            const gameStub = {
                configureAdventureLevel: (lvl) => {
                    if (lvl) {
                        adventureConfigured += 1;
                    } else {
                        controller.clearAdventureLevelConfig();
                    }
                },
                gameController: controller,
                eventSystem: controller.eventSystem,
                backgroundEffects: { setTheme() {} },
                particleSystem: { createParticle() {} },
                audioSystem: { playBackgroundMusic() {} },
                waveManager: { clearEnemies() {} },
                towerManager: { clearTowers() {} },
                startGame() {},
                gameStarted: true,
                endlessDifficulty: 'normal'
            };

            const manager = new window.GameModeManager(gameStub);
            manager.setupLevelEnvironment(level);
            assert(adventureConfigured > 0, '进入闯关模式时应当调用配置函数');

            manager.startEndlessMode();
            assert(controller.gameState.obstacles.length === 0 && controller.gameState.powerUps.length === 0,
                '切换到无限模式时应当清空障碍物和强化果实');

            controller.configureAdventureLevel(level);
            assert(controller.gameState.obstacles.length > 0,
                '返回闯关模式时应恢复障碍布局');
        } finally {
            destroyController(controller);
        }
    }

    function testDifficultyMetric() {
        const scores = levelIds.map(id => {
            const level = window.LevelConfig.ADVENTURE_LEVELS[id];
            const waves = level.enemyWaves;
            const spawnFactor = 2000 / waves.spawnRate;
            return spawnFactor * waves.maxConcurrent * waves.totalWaves;
        });
        for (let i = 1; i < scores.length; i++) {
            assert(scores[i] >= scores[i - 1],
                `难度综合指标应当随关卡提升 (Level ${levelIds[i - 1]} -> ${levelIds[i]})`);
        }
    }

    const tests = [
        { name: '关卡难度参数递增', runner: testLevelScaling },
        { name: '强化果实刷新与上限', runner: testPowerUpLifecycle },
        { name: '强化果实叠加效果', runner: testPowerUpStacking },
        { name: '障碍物与碰撞行为', runner: testObstacleInteractions },
        { name: '关卡状态序列化', runner: testSerialization },
        { name: '模式切换清理状态', runner: testModeSwitch },
        { name: '关卡难度综合指标', runner: testDifficultyMetric }
    ];

    async function runAllTests() {
        resultsContainer.innerHTML = '';
        summaryLabel.textContent = '测试进行中...';
        runButton.disabled = true;

        let failures = 0;
        for (const test of tests) {
            await new Promise(resolve => setTimeout(resolve, 0));
            try {
                test.runner();
                logResult(test.name, true);
            } catch (error) {
                failures += 1;
                logResult(test.name, false, error.message);
            }
        }

        summaryLabel.textContent = failures === 0
            ? '全部测试通过 🎉'
            : `共有 ${failures} 项测试未通过，请查看详情。`;
        runButton.disabled = false;
    }

    runButton?.addEventListener('click', () => {
        runAllTests().catch(error => {
            console.error(error);
            summaryLabel.textContent = '运行测试时发生错误，请查看控制台。';
            runButton.disabled = false;
        });
    });
})();

