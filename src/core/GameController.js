/**
 * 游戏主控制器
 * 负责协调所有游戏系统和管理游戏生命周期
 */
(function (global) {
    const isNodeEnvironment = typeof module === 'object' && module && module.exports && typeof require === 'function';

    const getDependency = (globalName, nodePath) => {
        if (isNodeEnvironment) {
            try {
                return require(nodePath);
            } catch (error) {
                return null;
            }
        }
        return global && global[globalName] ? global[globalName] : null;
    };

    const EventSystem = getDependency('EventSystem', './EventSystem.js');
    const GameState = getDependency('GameState', './GameState.js');
    const ElementSystem = getDependency('ElementSystem', '../systems/elements/ElementSystem.js');
    const AbilitySystem = getDependency('AbilitySystem', '../systems/AbilitySystem.js');
    const ResourceSystem = getDependency('ResourceSystem', '../systems/ResourceSystem.js');
    const EnhancementSystem = getDependency('EnhancementSystem', '../systems/EnhancementSystem.js');
    const ComboSystem = getDependency('ComboSystem', '../systems/ComboSystem.js');
    const WaveModifierSystem = getDependency('WaveModifierSystem', '../systems/WaveModifierSystem.js');
    const ShopSystem = getDependency('ShopSystem', '../systems/ShopSystem.js');

    if (!EventSystem || !GameState) {
        throw new Error('GameController dependencies not available');
}

class GameController {
    constructor(canvas) {
        this.canvas = canvas || this.createMockCanvas();
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width || 800;
        this.height = this.canvas.height || 600;

        // 时间管理
        this.lastTime = 0;
        this.deltaTime = 0;
        this.gameLoopId = null;

        // 输入状态
        this.keys = {};
        this.mouse = { x: 0, y: 0, isDown: false };

        // 初始化核心系统
        this.initializeSystems();
        
        const initialPlayer = typeof this.gameState?.getPlayer === 'function'
            ? this.gameState.getPlayer()
            : this.gameState.player;
        this.basePlayerTemplate = initialPlayer ? { ...initialPlayer } : null;
        
        // 绑定事件处理器
        this.setupEventHandlers();
        
        // 设置输入监听
        this.setupInputListeners();

        this.activeEffects = [];
        this.soundEvents = [];
        this.abilityHotspots = [];
        this.attackBuff = { remaining: 0, multiplier: 1 };
        this.abilityUpgrades = {
            rapid_fire: 0,
            guardian_shield: 0,
            dragon_slayer: 0,
            healing_wave: 0
        };
        this.manaRegenBuffer = 0;
        this.maxDragonsPerRun = 2;
        this.resetDragonRunState();
        this.resetDragonQueue();
        this.adventurePowerUpConfig = null;
        this.adventurePowerUpTimer = 0;

        this.difficultyProfiles = {
            normal: {
                id: 'normal',
                label: '标准',
                maxDragons: 2,
                dragon: {
                    headHealth: 1.0,
                    headDamage: 1.0,
                    speed: 1.0,
                    growthInterval: 1.0,
                    segmentHealthFactor: 1.22,
                    segmentDamageFactor: 1.12,
                    maxSegmentsFactor: 1.0
                },
                player: {
                    maxHealth: 1.0,
                    damage: 1.0,
                    speed: 1.0,
                    mana: 1.0,
                    manaRegen: 1.0
                },
                rewards: {
                    attribute: 1.0,
                    token: 1.0
                },
                resource: {
                    token: 1.0,
                    crystalChance: 1.0,
                    lootLifetime: 1.0,
                    magnetRange: 1.0,
                    collectRange: 1.0,
                    lootValue: 1.0
                },
                endless: {
                    spawnInterval: 1.0,
                    healthMultiplier: 1.0,
                    damageMultiplier: 1.0,
                    speedMultiplier: 1.0,
                    countMultiplier: 1.0,
                    rewardMultiplier: 1.0,
                    specialChanceMultiplier: 1.0,
                    bossFrequencyMultiplier: 1.0
                }
            },
            hard: {
                id: 'hard',
                label: '困难',
                maxDragons: 3,
                dragon: {
                    headHealth: 1.28,
                    headDamage: 1.18,
                    speed: 1.1,
                    growthInterval: 0.85,
                    segmentHealthFactor: 1.28,
                    segmentDamageFactor: 1.18,
                    maxSegmentsFactor: 1.1
                },
                player: {
                    maxHealth: 0.92,
                    damage: 0.98,
                    speed: 0.98,
                    mana: 0.95,
                    manaRegen: 0.9
                },
                rewards: {
                    attribute: 1.05,
                    token: 0.9
                },
                resource: {
                    token: 0.85,
                    crystalChance: 0.9,
                    lootLifetime: 0.9,
                    magnetRange: 0.9,
                    collectRange: 0.95,
                    lootValue: 0.9
                },
                endless: {
                    spawnInterval: 0.9,
                    healthMultiplier: 1.12,
                    damageMultiplier: 1.15,
                    speedMultiplier: 1.08,
                    countMultiplier: 1.08,
                    rewardMultiplier: 1.1,
                    specialChanceMultiplier: 1.25,
                    bossFrequencyMultiplier: 0.85
                }
            },
            nightmare: {
                id: 'nightmare',
                label: '噩梦',
                maxDragons: 4,
                dragon: {
                    headHealth: 1.55,
                    headDamage: 1.35,
                    speed: 1.22,
                    growthInterval: 0.72,
                    segmentHealthFactor: 1.35,
                    segmentDamageFactor: 1.25,
                    maxSegmentsFactor: 1.22
                },
                player: {
                    maxHealth: 0.85,
                    damage: 0.95,
                    speed: 0.95,
                    mana: 0.9,
                    manaRegen: 0.85
                },
                rewards: {
                    attribute: 1.12,
                    token: 0.8
                },
                resource: {
                    token: 0.7,
                    crystalChance: 0.75,
                    lootLifetime: 0.8,
                    magnetRange: 0.85,
                    collectRange: 0.9,
                    lootValue: 0.75
                },
                endless: {
                    spawnInterval: 0.75,
                    healthMultiplier: 1.22,
                    damageMultiplier: 1.28,
                    speedMultiplier: 1.16,
                    countMultiplier: 1.16,
                    rewardMultiplier: 1.25,
                    specialChanceMultiplier: 1.55,
                    bossFrequencyMultiplier: 0.7
                }
            }
        };

        this.difficulty = 'normal';
        this.activeDifficultyProfile = this.difficultyProfiles.normal;
        this.setDifficulty('normal', { skipPlayerAdjustment: true, skipEvent: true });
    }

    /**
     * 初始化所有游戏系统
     */
    initializeSystems() {
        // 核心系统
        this.eventSystem = new EventSystem();
        this.gameState = new GameState(this.eventSystem);
        
        // 加载配置
        this.loadConfigurations();

        // 初始化游戏系统
        this.elementSystem = ElementSystem
            ? new ElementSystem(this.eventSystem, this.gameState)
            : null;

        this.enhancementSystem = EnhancementSystem
            ? new EnhancementSystem()
            : null;

        this.abilitySystem = AbilitySystem
            ? new AbilitySystem(this.eventSystem, this.gameState, {
                enhancementSystem: this.enhancementSystem || undefined
            })
            : null;

        this.resourceSystem = ResourceSystem
            ? new ResourceSystem(this.eventSystem, this.gameState, {
                enhancementSystem: this.enhancementSystem || undefined
            })
            : null;

        this.comboSystem = ComboSystem
            ? new ComboSystem(this.eventSystem, this.gameState)
            : null;

        this.waveModifierSystem = WaveModifierSystem
            ? new WaveModifierSystem(this.eventSystem, this.gameState)
            : null;

        this.shopSystem = ShopSystem
            ? new ShopSystem(this.eventSystem)
            : null;
        
        // 其他系统将在需要时初始化
        this.systems = {
            element: this.elementSystem,
            ability: this.abilitySystem,
            resource: this.resourceSystem,
            combo: this.comboSystem,
            waveModifier: this.waveModifierSystem,
            enhancement: this.enhancementSystem,
            shop: this.shopSystem
        };

        this.waveKillProgress = 0;
        this.waveKillTarget = this.calculateWaveTarget(this.gameState.getWave());

        if (this.waveModifierSystem) {
            this.waveModifierSystem.initializeWave(this.gameState.getWave());
        }

        console.log('游戏系统初始化完成');
    }

    resetDragonQueue() {
        this.dragonQueue = this.createDragonQueue();
        this.currentDragonIndex = 0;
    }

    resetDragonRunState() {
        this.dragonsSpawned = 0;
        this.dragonsDefeated = 0;
    }

    setDifficulty(level = 'normal', options = {}) {
        const profile = this.difficultyProfiles?.[level] || this.difficultyProfiles?.normal;
        if (!profile) {
            return this.difficulty;
        }

        this.difficulty = profile.id || level;
        this.activeDifficultyProfile = profile;
        this.applyDifficultyToSystems();
        const previousMax = this.maxDragonsPerRun;
        this.maxDragonsPerRun = Math.max(1, profile.maxDragons || this.maxDragonsPerRun || 2);

        if (!options.skipPlayerAdjustment) {
            this.applyDifficultyToPlayerStats({
                preserveHealth: options.preserveHealth,
                skipShopReapply: options.skipShopReapply
            });
        }

        if (previousMax !== this.maxDragonsPerRun && !options.skipWaveReset) {
            this.resetWaveProgress(this.gameState?.getWave?.() || 1);
        }

        if (!options.skipEvent && this.eventSystem) {
            this.eventSystem.emit('DIFFICULTY_CHANGED', {
                difficulty: this.difficulty,
                profile: this.activeDifficultyProfile
            });
        }

        return this.difficulty;
    }

    applyDifficultyToPlayerStats(options = {}) {
        if (!this.gameState || !this.basePlayerTemplate || !this.activeDifficultyProfile) {
            return;
        }

        const profile = this.activeDifficultyProfile.player || {};
        const base = this.basePlayerTemplate;
        const target = { ...base };

        const currentPlayer = this.gameState.player || {};
        const healthMultiplier = profile.maxHealth ?? 1;
        const damageMultiplier = profile.damage ?? 1;
        const speedMultiplier = profile.speed ?? 1;
        const manaMultiplier = profile.mana ?? 1;
        const manaRegenMultiplier = profile.manaRegen ?? 1;

        const maxHealth = Math.max(1, Math.round((base.maxHealth || 100) * healthMultiplier));
        const damage = Math.max(1, Math.round((base.damage || 25) * damageMultiplier));
        const speed = Math.max(40, Math.round((base.speed || 200) * speedMultiplier));
        const maxMana = Math.max(0, Math.round((base.maxMana || 100) * manaMultiplier));
        const mana = options.preserveHealth ? Math.min(this.gameState.player?.mana || maxMana, maxMana)
            : maxMana;
        const manaRegen = Math.max(0, Math.round((base.manaRegenRate || 10) * manaRegenMultiplier));

        const currentHealth = this.gameState.player?.health || maxHealth;
        const newHealth = options.preserveHealth ? Math.min(currentHealth, maxHealth) : maxHealth;

        this.gameState.setPlayer({
            ...target,
            x: currentPlayer.x ?? target.x ?? this.width / 2,
            y: currentPlayer.y ?? target.y ?? this.height / 2,
            maxHealth,
            health: newHealth,
            damage,
            speed,
            maxMana,
            mana,
            manaRegenRate: manaRegen
        });

        if (!options.skipShopReapply && this.shopSystem && typeof this.shopSystem.applyUpgrades === 'function') {
            this.shopSystem.applyUpgrades(this.gameState);
        }
    }

    applyDifficultyToSystems() {
        this.applyDifficultyToResourceSystem();
    }

    applyDifficultyToResourceSystem() {
        if (!this.resourceSystem || !this.activeDifficultyProfile) {
            return;
        }

        const resourceProfile = this.activeDifficultyProfile.resource || {};
        if (typeof this.resourceSystem.setDifficultyModifiers === 'function') {
            this.resourceSystem.setDifficultyModifiers({
                tokenDrop: resourceProfile.token ?? 1,
                crystalChance: resourceProfile.crystalChance ?? 1,
                lootLifetime: resourceProfile.lootLifetime ?? 1,
                magnetRange: resourceProfile.magnetRange ?? 1,
                collectRange: resourceProfile.collectRange ?? 1,
                lootValue: resourceProfile.lootValue ?? 1
            });
        }
    }

    // ==================== 闯关模式辅助 ====================

    configureAdventureLevel(levelConfig) {
        if (!levelConfig) {
            this.clearAdventureLevelConfig();
            return;
        }

        const obstacles = levelConfig?.environment?.obstacles || [];
        if (typeof this.gameState.setObstacles === 'function') {
            this.gameState.setObstacles(obstacles);
        }

        if (typeof this.gameState.clearPowerUps === 'function') {
            this.gameState.clearPowerUps();
        }

        const settings = levelConfig.powerUps || levelConfig.environment?.powerUps || {};
        this.adventurePowerUpConfig = {
            spawnInterval: Math.max(4, settings.spawnInterval || 18),
            maxActive: Math.max(1, settings.maxActive || 3),
            types: Array.isArray(settings.types) && settings.types.length
                ? settings.types
                : ['attack', 'attack_speed', 'move_speed', 'volley', 'spread'],
            lifespan: Math.max(6, settings.lifespan || 25)
        };
        this.adventurePowerUpTimer = 0;

        if (this.gameState.player) {
            this.gameState.player.weaponMode = 'single';
            this.gameState.player.weaponModeTimer = 0;
            this.gameState.player.attackSpeedBonus = 0;
        }
    }

    clearAdventureLevelConfig() {
        this.adventurePowerUpConfig = null;
        this.adventurePowerUpTimer = 0;
        if (typeof this.gameState.clearObstacles === 'function') {
            this.gameState.clearObstacles();
        }
        if (typeof this.gameState.clearPowerUps === 'function') {
            this.gameState.clearPowerUps();
        }
        const player = this.gameState.player;
        if (player) {
            player.weaponMode = 'single';
            player.weaponModeTimer = 0;
            player.attackSpeedBonus = 0;
        }
    }

    getDifficultyRewardMultiplier(type) {
        const rewards = this.activeDifficultyProfile?.rewards || {};
        if (type === 'token') {
            return rewards.token ?? 1;
        }
        return rewards.attribute ?? 1;
    }

    createDragonQueue() {
        return [
            {
                type: 'stone',
                startSegments: 5,
                maxSegments: 30,
                growthInterval: 1.4,
                rewardSegments: [
                    { index: 6, bonus: { type: 'attack', value: 5 } },
                    { index: 10, abilityId: 'rapid_fire' },
                    { index: 16, bonus: { type: 'fire_rate', value: 0.12 } },
                    { index: 24, bonus: { type: 'speed', value: 28 } },
                    { index: 27, bonus: { type: 'attack', value: 9 } },
                    { index: 29, bonus: { type: 'token', value: 18 } },
                    { index: 30, bonus: { type: 'fire_rate', value: 0.16 } }
                ]
            },
            {
                type: 'thunder',
                startSegments: 6,
                maxSegments: 30,
                growthInterval: 1.1,
                rewardSegments: [
                    { index: 8, abilityId: 'guardian_shield' },
                    { index: 12, bonus: { type: 'speed', value: 30 } },
                    { index: 18, bonus: { type: 'attack', value: 6 } },
                    { index: 22, bonus: { type: 'fire_rate', value: 0.15 } },
                    { index: 26, bonus: { type: 'attack', value: 12 } },
                    { index: 28, bonus: { type: 'token', value: 24 } },
                    { index: 30, bonus: { type: 'mana', value: 25 } }
                ]
            }
        ];
    }

    getNextDragonDefinition() {
        if (!Array.isArray(this.dragonQueue) || this.dragonQueue.length === 0) {
            this.resetDragonQueue();
        }
        const index = this.currentDragonIndex % this.dragonQueue.length;
        const definition = this.dragonQueue[index];
        this.currentDragonIndex += 1;
        return definition;
    }

    /**
     * 加载配置文件
     */
    loadConfigurations() {
        try {
            // 尝试加载各种配置
            if (typeof ElementConfig !== 'undefined') {
                if (global) {
                    global.ElementConfig = ElementConfig;
                }
            }
        } catch (error) {
            console.warn('配置加载失败，使用默认配置:', error);
        }
    }

    /**
     * 设置事件处理器
     */
    setupEventHandlers() {
        // 游戏状态事件
        this.eventSystem.on('GAME_START', this.onGameStart.bind(this));
        this.eventSystem.on('GAME_PAUSE', this.onGamePause.bind(this));
        this.eventSystem.on('GAME_RESUME', this.onGameResume.bind(this));
        this.eventSystem.on('GAME_OVER', this.onGameOver.bind(this));
        
        // 实体事件
        this.eventSystem.on('DRAGON_DEATH', this.onDragonDeath.bind(this));
        this.eventSystem.on('PLAYER_DAMAGE', this.onPlayerDamage.bind(this));
        // 调试：子弹命中日志
        this.eventSystem.on('BULLET_HIT', this.onBulletHit.bind(this));
        
        // 系统事件
        this.eventSystem.on('ACHIEVEMENT_UNLOCK', this.onAchievementUnlock.bind(this));
        this.eventSystem.on('ABILITY_UPGRADE_LOOT', this.onAbilityUpgradeLoot.bind(this));
        this.eventSystem.on('SHOP_TOKEN_COLLECTED', this.onShopTokenCollected.bind(this));
        this.eventSystem.on('SHOP_PURCHASED', this.onShopUpgradePurchased.bind(this));
        this.eventSystem.on('REWARD_BONUS_LOOT_COLLECTED', this.onRewardBonusLootCollected.bind(this));
        this.eventSystem.on('PARTICLE_CREATE', this.onParticleCreate.bind(this));
        this.eventSystem.on('EFFECT_CREATE', this.onEffectCreate.bind(this));
        this.eventSystem.on('SOUND_PLAY', this.onSoundPlay.bind(this));
        this.eventSystem.on('ABILITY_CAST', this.onAbilityCast.bind(this));
    }

    /**
     * 设置输入监听器
     */
    setupInputListeners() {
        if (typeof document === 'undefined') {
            return;
        }

        const canvas = this.canvas;
        const canListen = canvas && typeof canvas.addEventListener === 'function';

            // 键盘事件
            document.addEventListener('keydown', this.handleKeyDown.bind(this));
            document.addEventListener('keyup', this.handleKeyUp.bind(this));
        
        if (!canListen) {
            return;
        }
            
            // 鼠标事件
        canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
            
            // 防止右键菜单
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    /**
     * 创建模拟画布（用于测试）
     */
    createMockCanvas() {
        return {
            width: 800,
            height: 600,
            getContext: () => ({
                save: () => {},
                restore: () => {},
                clearRect: () => {},
                fillRect: () => {},
                beginPath: () => {},
                arc: () => {},
                fill: () => {},
                stroke: () => {},
                fillText: () => {},
                measureText: () => ({ width: 100 })
            })
        };
    }

    // ==================== 游戏控制方法 ====================

    /**
     * 开始游戏
     */
    start() {
        if (this.gameState.gameStarted && !this.gameState.gameOver) {
            console.log('游戏已经在运行中');
            return;
        }

        console.log('开始游戏');
        // 初始化命中调试：打印关键状态
        this.eventSystem.on('BULLET_HIT', (data) => {
            const { dragon, hitPart } = data || {};
            if (!dragon) return;
            const segs = Array.isArray(dragon.bodySegments) ? dragon.bodySegments.length : 0;
            console.debug('[HITDBG] part=%s headDead=%s headHP=%d/%d segments=%d agg=%d/%d',
                hitPart,
                !!dragon.isHeadDead,
                Math.floor(dragon.headHealth || 0),
                Math.floor(dragon.headMaxHealth || 0),
                segs,
                Math.floor(dragon.health || 0),
                Math.floor(dragon.maxHealth || 1)
            );
        });
        this.gameState.setGameState('started', true);
        this.gameState.setGameState('over', false);
        this.gameState.setGameState('paused', false);
        
        // 初始化游戏
        this.initializeGame();
        
        // 启动游戏循环
        this.startGameLoop();
        
        // 触发游戏开始事件
        this.eventSystem.emit('GAME_START');
    }

    /**
     * 暂停游戏
     */
    pause() {
        if (!this.gameState.gameStarted || this.gameState.gameOver) {
            return;
        }

        console.log('暂停游戏');
        this.gameState.setGameState('paused', true);
        this.eventSystem.emit('GAME_PAUSE');
    }

    /**
     * 恢复游戏
     */
    resume() {
        if (!this.gameState.gameStarted || this.gameState.gameOver || !this.gameState.isPaused) {
            return;
        }

        console.log('恢复游戏');
        this.gameState.setGameState('paused', false);
        this.eventSystem.emit('GAME_RESUME');
    }

    /**
     * 重启游戏
     */
    restart() {
        console.log('重启游戏');
        this.stop();
        this.gameState.reset();
        this.start();
    }

    /**
     * 停止游戏
     */
    stop() {
        console.log('停止游戏');
        this.gameState.setGameState('started', false);
        this.gameState.setGameState('paused', false);
        
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
    }

    /**
     * 初始化游戏
     */
    initializeGame() {
        // 设置玩家初始位置
        this.gameState.setPlayer({
            x: this.width / 2,
            y: this.height / 2
        });

        this.resetDragonQueue();
        this.resetDragonRunState();
        this.resetWaveProgress(this.gameState.getWave());

        this.applyDifficultyToSystems();
        this.applyDifficultyToPlayerStats({ skipShopReapply: true });

        if (this.shopSystem) {
            this.shopSystem.applyUpgrades(this.gameState);
        }

        // 生成第一只龙
        this.spawnInitialDragon();
        
        console.log('游戏初始化完成');
    }

    /**
     * 生成初始龙
     */
    spawnInitialDragon() {
        this.spawnNextDragon(true);
    }

    calculateWaveTarget() {
        return this.maxDragonsPerRun;
    }

    resetWaveProgress(wave) {
        this.waveKillProgress = 0;
        this.waveKillTarget = this.calculateWaveTarget(wave);
    }

    handleWaveProgressOnKill() {
        this.waveKillProgress += 1;

        if (this.waveKillProgress >= this.waveKillTarget) {
            const completedWave = this.gameState.getWave();
            this.eventSystem.emit('WAVE_COMPLETE', completedWave);
            this.gameState.incrementWave();
            const newWave = this.gameState.getWave();
            this.resetWaveProgress(newWave);
            if (this.waveModifierSystem) {
                this.waveModifierSystem.initializeWave(newWave);
            }
        }
    }

    applyWaveModifiers(dragon) {
        if (!dragon) {
            return dragon;
        }
        if (this.waveModifierSystem) {
            this.waveModifierSystem.applyToDragon(dragon);
        }
        return dragon;
    }

    /**
     * 创建龙对象
     */
    createDragon(type, definition = {}) {
        let element = this.elementSystem.getElement(type);
        if (!element) {
            element = this.elementSystem.getElement('normal') || {
                name: type,
                baseHealth: 260,
                healthMultiplier: 1.08,
                damageMultiplier: 1.0,
                speedMultiplier: 1.0,
                color: '#FFFFFF',
                glowColor: '#FFFFFF'
            };
        }
        const wave = this.gameState.getWave();
        const difficultyDragon = this.activeDifficultyProfile?.dragon || {};

        const headHealthMultiplier = difficultyDragon.headHealth ?? 1;
        const headDamageMultiplier = difficultyDragon.headDamage ?? 1;
        const headSpeedMultiplier = difficultyDragon.speed ?? 1;
        const elementBaseHealth = element.baseHealth ?? 260;
        const elementHealthMultiplier = element.healthMultiplier ?? 1.12;
        const elementDamageMultiplier = element.damageMultiplier ?? 1.0;
        const elementSpeedMultiplier = element.speedMultiplier ?? 1.0;

        // 头部基础属性
        const headMaxHealth = Math.floor(elementBaseHealth * Math.pow(elementHealthMultiplier, wave - 1) * headHealthMultiplier);
        const headDamage = Math.floor(15 * elementDamageMultiplier * headDamageMultiplier);
        const headSpeed = 30 * elementSpeedMultiplier * headSpeedMultiplier;

        // 从 BalanceConfig 读取身体配置（有兜底）
        const bodyConfig = (typeof BalanceConfig !== 'undefined' && typeof BalanceConfig.getDragonBodyConfig === 'function')
            ? BalanceConfig.getDragonBodyConfig(wave)
            : { segmentCount: 3, spacing: 20, radiusRatio: 0.85, growthInterval: 3.5 };

        const segmentDamageRatio = (typeof BalanceConfig !== 'undefined' && BalanceConfig.ENEMIES && BalanceConfig.ENEMIES.dragon && typeof BalanceConfig.ENEMIES.dragon.segmentDamageRatio === 'number')
            ? BalanceConfig.ENEMIES.dragon.segmentDamageRatio
            : 0.6;

        // 初始位置与朝向
        const startX = Math.random() * this.width;
        const startY = Math.random() * this.height;
        const initialAngle = Math.random() * Math.PI * 2;

        const maxSegmentsBase = definition.maxSegments ?? bodyConfig.segmentCount ?? 3;
        const maxBodySegments = Math.min(30, Math.max(0, Math.round(maxSegmentsBase * (difficultyDragon.maxSegmentsFactor ?? 1))));
        const startBase = Math.max(0, definition.startSegments ?? 1);
        const startBodySegments = Math.max(0, Math.min(maxBodySegments, Math.round(startBase * (difficultyDragon.initialSegmentsFactor || 1))));
        const rewardSegments = Array.isArray(definition.rewardSegments) ? definition.rewardSegments : [];
        const rewardMap = new Map();
        rewardSegments.forEach(entry => {
            if (entry && typeof entry.index === 'number') {
                rewardMap.set(entry.index, { ...entry });
            }
        });
        const pathCapacity = Math.max(4000, maxBodySegments * 120);

        // 构建身体段
        const bodySegments = [];
        const baseSegmentRadius = Math.floor(25 * (bodyConfig.radiusRatio || 0.85));
        const baseSegmentHealth = Math.max(20, Math.floor(headMaxHealth * 0.6));
        const segmentHealthFactor = Math.max(1.05, difficultyDragon.segmentHealthFactor ?? 1.22);
        const segmentDamageFactor = Math.max(1.05, difficultyDragon.segmentDamageFactor ?? 1.12);
        for (let i = 0; i < startBodySegments; i++) {
            const distanceBehindHead = (i + 1) * (bodyConfig.spacing || 20);
            const segX = startX - Math.cos(initialAngle) * distanceBehindHead;
            const segY = startY - Math.sin(initialAngle) * distanceBehindHead;

            const segmentIndex = i + 1;
            const healthGrowth = Math.pow(segmentHealthFactor, Math.max(0, segmentIndex - 1));
            let segMaxHealth = Math.max(15, Math.floor(baseSegmentHealth * healthGrowth));
            const damageGrowth = Math.pow(segmentDamageFactor, Math.max(0, segmentIndex - 1));
            if (i > 0) {
                const prevSegment = bodySegments[i - 1];
                const prevMax = Math.max(0, prevSegment?.maxHealth ?? 0);
                segMaxHealth = Math.max(segMaxHealth, prevMax + 1);
            }
            let segmentDamage = Math.max(1, Math.floor(headDamage * segmentDamageRatio * damageGrowth));
            if (i > 0) {
                const prevSegment = bodySegments[i - 1];
                const prevDamage = Math.max(0, prevSegment?.damage ?? 0);
                segmentDamage = Math.max(segmentDamage, prevDamage + 1);
            }
            const rewardDef = rewardMap.get(i + 1);
            bodySegments.push({
                x: segX,
                y: segY,
                radius: baseSegmentRadius,
                health: segMaxHealth,
                maxHealth: segMaxHealth,
                hitFlash: 0,
                damage: segmentDamage,
                rewardAbility: rewardDef?.abilityId || null,
                rewardBonus: rewardDef?.bonus || null
            });
        }

        // 初始化路径（用于路径追踪法）
        const bodyPath = [];
        const step = 5; // 路径采样步长（像素）
        const needDistance = (bodySegments.length + 2) * bodyConfig.spacing;
        const steps = Math.max(2, Math.ceil(needDistance / step));
        for (let i = 0; i < steps; i++) {
            bodyPath.push({
                x: startX - Math.cos(initialAngle) * i * step,
                y: startY - Math.sin(initialAngle) * i * step
            });
        }

        const dragon = {
            id: Date.now() + Math.random(),
            type: type,
            element: type,
            x: startX,
            y: startY,
            radius: 25,
            // 头部血量（与总血量解耦）
            headHealth: headMaxHealth,
            headMaxHealth: headMaxHealth,
            // 聚合血量（渲染/数值显示使用，按需更新）
            health: headMaxHealth,
            maxHealth: headMaxHealth,
            damage: headDamage,
            speed: headSpeed,
            color: element.color || '#FFFFFF',
            glowColor: element.glowColor || element.color || '#FFFFFF',
            specialAbility: element.specialAbility,
            lastAbilityUse: 0,
            abilityTimer: 0,
            // 完整贪吃蛇新增字段
            bodySegments,
            bodyPath,
            spacing: bodyConfig.spacing,
            segmentRadius: Math.floor(25 * (bodyConfig.radiusRatio || 0.85)),
            growthInterval: (definition.growthInterval || bodyConfig.growthInterval || 2.5) * (difficultyDragon.growthInterval ?? 1),
            growthTimer: 0,
            targetSegmentCount: maxBodySegments,
            maxSegments: maxBodySegments,
            segmentDamageRatio: segmentDamageRatio,
            rewardSegmentMap: rewardMap,
            maxBodySegments,
            definition,
            segmentHealthFactor,
            segmentDamageFactor,
            difficultyId: this.difficulty,
            headRewardAbility: null,
            enhancementSegments: [],
            maxEnhancementSegments: definition.maxEnhancementSegments ?? 12,
            // 运行时控制
            isHeadDead: false,
            maxBodyPathPoints: pathCapacity,
            deathTimer: 0, // 头死亡后的清理定时器（避免瞬间清空）
            decayInterval: 0.5, // 每0.5秒衰减一节
            _markedForRemoval: false,
            timeDilation: null
        };

        // 初始化聚合血量
        this.updateDragonAggregateHealth(dragon);

        return dragon;
    }

    // ==================== 游戏循环 ====================

    /**
     * 启动游戏循环
     */
    startGameLoop() {
        this.lastTime = performance.now();
        this.gameLoop();
    }

    /**
     * 主游戏循环
     */
    gameLoop(currentTime = performance.now()) {
        // 计算时间增量
        this.deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // 限制时间增量（防止大幅跳跃）
        this.deltaTime = Math.min(this.deltaTime, 1/30);

        // 如果游戏正在运行且未暂停
        if (this.gameState.gameStarted && !this.gameState.isPaused && !this.gameState.gameOver) {
            this.update(this.deltaTime);
        }
        
        // 渲染（即使暂停也要渲染）
        this.render();
        
        // 请求下一帧
        this.gameLoopId = requestAnimationFrame(this.gameLoop.bind(this));
    }

    /**
     * 更新游戏逻辑
     */
    update(deltaTime) {
        // 更新游戏时间
        this.gameState.updateGameTime(deltaTime);
        
        // 更新各个系统
        this.updateSystems(deltaTime);
        
        // 更新实体
        this.updateEntities(deltaTime);
        
        // 处理碰撞
        this.handleCollisions();
        
        // 清理无效对象
        this.cleanup();
        
        // 检查游戏结束条件
        this.checkGameOver();
    }

    /**
     * 更新各个系统
     */
    updateSystems(deltaTime) {
        // 更新元素系统
        if (this.systems.element) {
            this.systems.element.updateActiveEffects(deltaTime);
        }

        if (this.systems.ability) {
            this.systems.ability.update(deltaTime);
        }

        if (this.systems.resource) {
            this.systems.resource.update(deltaTime, this.gameState.player);
        }

        if (this.systems.combo) {
            this.systems.combo.update(deltaTime);
        }

        // 更新其他系统...

        this.updatePlayerBuffs(deltaTime);
        this.regenPlayerMana(deltaTime);
    }

    /**
     * 更新实体
     */
    updateEntities(deltaTime) {
        const player = this.gameState.player;
        
        // 更新玩家
        this.updatePlayer(player, deltaTime);
        
        // 更新龙
        const dragons = this.gameState.getDragons();
        dragons.forEach(dragon => this.updateDragon(dragon, deltaTime));
        
        // 更新子弹
        const bullets = this.gameState.getBullets();
        bullets.forEach(bullet => this.updateBullet(bullet, deltaTime));

        // 更新粒子
        this.updateParticles(deltaTime);

        // 更新强化果实
        this.updatePowerUps(deltaTime);

        // 更新伤害数字
        this.updateDamageNumbers(deltaTime);

        this.updateEffects(deltaTime);
    }

    /**
     * 更新玩家
     */
    updatePlayer(player, deltaTime) {
        if (player.invulnerableTimer) {
            player.invulnerableTimer = Math.max(0, player.invulnerableTimer - deltaTime);
        }

        if (player.shield) {
            if (typeof player.shield.remaining === 'number') {
                player.shield.remaining = Math.max(0, player.shield.remaining - deltaTime);
            }
            if (player.shield.remaining === 0 || player.shield.value <= 0) {
                player.shield = null;
            }
        }

        // 移动处理
        const moveSpeed = player.speed * deltaTime;
        const prevX = player.x;
        const prevY = player.y;
        let nextX = player.x;
        let nextY = player.y;

        const moveLeft = this.keys['ArrowLeft'] || this.keys['a'];
        const moveRight = this.keys['ArrowRight'] || this.keys['d'];
        const moveUp = this.keys['ArrowUp'] || this.keys['w'];
        const moveDown = this.keys['ArrowDown'] || this.keys['s'];

        if (moveLeft && !moveRight) {
            nextX = Math.max(player.radius, nextX - moveSpeed);
        } else if (moveRight && !moveLeft) {
            nextX = Math.min(this.width - player.radius, nextX + moveSpeed);
        }

        if (moveUp && !moveDown) {
            nextY = Math.max(player.radius, nextY - moveSpeed);
        } else if (moveDown && !moveUp) {
            nextY = Math.min(this.height - player.radius, nextY + moveSpeed);
        }

        // 障碍物碰撞处理（逐轴）
        if (this.isCircleCollidingWithObstacles(nextX, prevY, player.radius)) {
            nextX = prevX;
        }
        if (this.isCircleCollidingWithObstacles(prevX, nextY, player.radius)) {
            nextY = prevY;
        }
        if (this.isCircleCollidingWithObstacles(nextX, nextY, player.radius)) {
            nextX = prevX;
            nextY = prevY;
        }

        player.x = nextX;
        player.y = nextY;

        const moved = (nextX !== prevX || nextY !== prevY);

        this.clampPlayerPosition(player);
        if (moved || player.x !== prevX || player.y !== prevY) {
            this.gameState.notifyChange('player', player);
        }

        // 攻击处理
        if (this.keys[' '] || this.mouse.isDown) {
            this.playerAttack(player);
        }
    }

    /**
     * 玩家攻击
     */
    playerAttack(player) {
        const currentTime = Date.now();
        const attackInterval = this.getCurrentAttackInterval();
        if (!player.lastAttackTime || currentTime - player.lastAttackTime >= attackInterval) {
            // 找到最近的龙
            const dragons = this.gameState.getDragons();
            let nearestDragon = null;
            let nearestDistance = Infinity;

            for (const dragon of dragons) {
                const distance = Math.sqrt(
                    Math.pow(dragon.x - player.x, 2) +
                    Math.pow(dragon.y - player.y, 2)
                );
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestDragon = dragon;
                }
            }

            if (nearestDragon) {
                this.createBullet(player, nearestDragon);
                player.lastAttackTime = currentTime;

                this.eventSystem.emit('PLAYER_ATTACK', {
                    player,
                    target: nearestDragon
                });
            }
        }
    }

    getCurrentAttackInterval() {
        const baseInterval = 250;
        const multiplier = this.getAttackSpeedMultiplier();
        return Math.max(60, baseInterval / Math.max(1, multiplier));
    }

    getAttackSpeedMultiplier() {
        const permanentBonus = 1 + (this.gameState.permanentUpgrades?.attackSpeedBonus || 0);
        const playerBonus = 1 + (this.gameState.player?.attackSpeedBonus || 0);
        let total = permanentBonus * playerBonus;
        if (this.attackBuff && this.attackBuff.remaining > 0 && this.attackBuff.multiplier > 0) {
            total *= this.attackBuff.multiplier;
        }
        return Math.max(0.1, total);
    }

    updatePlayerBuffs(deltaTime) {
        if (this.attackBuff) {
            if (this.attackBuff.remaining > 0) {
                this.attackBuff.remaining = Math.max(0, this.attackBuff.remaining - deltaTime);
                if (this.attackBuff.remaining === 0) {
                    this.attackBuff.multiplier = 1;
                }
            }
        }

        const player = this.gameState.player;
        if (player && typeof player.weaponModeTimer === 'number') {
            if (player.weaponModeTimer > 0) {
                player.weaponModeTimer = Math.max(0, player.weaponModeTimer - deltaTime);
                if (player.weaponModeTimer === 0) {
                    player.weaponMode = 'single';
                }
            }
        }
    }

    regenPlayerMana(deltaTime) {
        const player = this.gameState.player;
        if (!player) {
            return;
        }

        const regenRate = player.manaRegenRate ?? 0;
        const maxMana = player.maxMana ?? 0;
        const currentMana = player.mana ?? 0;

        if (regenRate <= 0 || currentMana >= maxMana) {
            this.manaRegenBuffer = 0;
            return;
        }

        const accrued = regenRate * deltaTime + (this.manaRegenBuffer || 0);
        const gain = Math.floor(accrued);
        this.manaRegenBuffer = accrued - gain;
        if (gain <= 0) {
            return;
        }

        const allowable = Math.min(gain, maxMana - currentMana);
        if (allowable > 0) {
            this.gameState.addResource('crystals', allowable);
        }
    }

    /**
     * 创建子弹
     */
    createBullet(source, target) {
        const angle = Math.atan2(target.y - source.y, target.x - source.x);
        const directions = this.getBulletDirections(angle, source.weaponMode);
        const mode = (source.weaponMode || 'single').toString().toLowerCase();
        const baseSpeed = 400;
        const bullets = [];
        let damageMultiplier = 1;
        if (mode === 'volley') {
            damageMultiplier = 0.85;
        } else if (mode === 'spread' || mode === 'spread_shot') {
            damageMultiplier = 0.65;
        }

        directions.forEach(dir => {
            const bullet = {
                id: Date.now() + Math.random(),
                x: source.x,
                y: source.y,
                vx: Math.cos(dir) * baseSpeed,
                vy: Math.sin(dir) * baseSpeed,
                damage: Math.max(1, Math.round(source.damage * damageMultiplier)),
                element: source.weaponElement || 'normal',
                radius: 3,
                life: 2.0,
                source,
                target,
                trajectoryAngle: dir
            };
            this.gameState.addBullet(bullet);
            bullets.push(bullet);
        });

        bullets.forEach(b => this.eventSystem.emit('BULLET_FIRE', b));
    }

    getBulletDirections(baseAngle, mode) {
        const normalizedMode = (mode || 'single').toString().toLowerCase();
        switch (normalizedMode) {
            case 'volley':
                return [baseAngle - 0.08, baseAngle, baseAngle + 0.08];
            case 'spread':
            case 'spread_shot':
                return [baseAngle - 0.25, baseAngle - 0.05, baseAngle + 0.05, baseAngle + 0.25];
            default:
                return [baseAngle];
        }
    }

    /**
     * 更新龙
     */
    updateDragon(dragon, deltaTime) {
        // 简单的AI：朝玩家移动（使用头部坐标或前段坐标）
        const player = this.gameState.player;
        const dx = player.x - dragon.x;
        const dy = player.y - dragon.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        let moveSpeed = dragon.speed * deltaTime;
        if (dragon.timeDilation && typeof dragon.timeDilation.remaining === 'number') {
            if (dragon.timeDilation.remaining > 0) {
                moveSpeed *= dragon.timeDilation.multiplier || 1;
                dragon.timeDilation.remaining = Math.max(0, dragon.timeDilation.remaining - deltaTime);
        if (dragon.slowEffect) {
                    const current = typeof dragon.slowEffect.remaining === 'number'
                        ? dragon.slowEffect.remaining
                        : dragon.slowEffect.duration;
                    const next = Math.max(0, current - deltaTime);
                    dragon.slowEffect.remaining = next;
                    if (next === 0) {
                        dragon.slowEffect = null;
                    }
                }
            } else {
                dragon.timeDilation = null;
                dragon.slowEffect = null;
            }
        }

        const chargeState = dragon.skillState?.charge;
        if (chargeState && chargeState.phase === 'charging') {
            const dir = chargeState.direction || this.getDirectionToPlayer(dragon);
            const chargeSpeed = dragon.speed * (chargeState.speedMultiplier || 3) * deltaTime;
            dragon.x += dir.x * chargeSpeed;
            dragon.y += dir.y * chargeSpeed;
        } else if (distance > 0) {
            dragon.x += (dx / distance) * moveSpeed;
            dragon.y += (dy / distance) * moveSpeed;
        }

        // 边界检查
        dragon.x = Math.max(dragon.radius, Math.min(this.width - dragon.radius, dragon.x));
        dragon.y = Math.max(dragon.radius, Math.min(this.height - dragon.radius, dragon.y));

        // 路径采样：在路径头部压入当前位置
        if (Array.isArray(dragon.bodyPath)) {
            const last = dragon.bodyPath[0];
            if (!last || (last.x !== dragon.x || last.y !== dragon.y)) {
                dragon.bodyPath.unshift({ x: dragon.x, y: dragon.y });
                // 维护路径长度上限
                if (dragon.bodyPath.length > dragon.maxBodyPathPoints) {
                    dragon.bodyPath.length = dragon.maxBodyPathPoints;
                }
            }
        }

        // 路径追踪：根据 spacing 在路径上定位每个段
        this.updateDragonBodyByPath(dragon);

        // 生长计时器
        dragon.growthTimer += deltaTime;
        if (dragon.growthTimer >= dragon.growthInterval) {
            dragon.growthTimer = 0;
            this.tryGrowDragonSegment(dragon);
        }

        // 使用特殊能力
        this.updateDragonAbilities(dragon, deltaTime);
    }

    /**
     * 更新龙的特殊能力
     */
    updateDragonAbilities(dragon, deltaTime) {
        const balanceConfig = (typeof globalThis !== 'undefined' && globalThis.BalanceConfig)
            ? globalThis.BalanceConfig
            : (typeof BalanceConfig !== 'undefined' ? BalanceConfig : null);
        const skillsConfig = balanceConfig?.ENEMIES?.dragon?.skills;
        if (!skillsConfig || dragon.isHeadDead) {
            this.resetDragonSkills(dragon);
            return;
        }

        if (!dragon.skillState) {
            this.initializeDragonSkillState(dragon, skillsConfig);
        }

        const state = dragon.skillState;
        if (!state.laser.phase) {
            state.laser.cooldown = Math.max(0, state.laser.cooldown - deltaTime);
        }
        if (!state.charge.phase) {
            state.charge.cooldown = Math.max(0, state.charge.cooldown - deltaTime);
        }

        this.updateLaserAttack(dragon, skillsConfig.laserSweep, deltaTime);
        this.updateChargeAttack(dragon, skillsConfig.chargeAttack, deltaTime);

        state.nextCheck -= deltaTime;
        if (state.nextCheck <= 0) {
            this.tryTriggerDragonSkill(dragon, skillsConfig);
            state.nextCheck = skillsConfig.aiConfig?.skillCheckInterval || 2.0;
        }
    }

    initializeDragonSkillState(dragon, config) {
        const laserCfg = config.laserSweep || {};
        const chargeCfg = config.chargeAttack || {};

        dragon.skillState = {
            nextCheck: config.aiConfig?.skillCheckInterval || 2.0,
            laser: {
                phase: null,
                timer: 0,
                cooldown: (laserCfg.cooldown || 6) * 0.6,
                range: laserCfg.range || 420,
                direction: { x: 1, y: 0 },
                damageBuffer: 0
            },
            charge: {
                phase: null,
                timer: 0,
                cooldown: (chargeCfg.cooldown || 10) * 0.7,
                direction: { x: 1, y: 0 },
                speedMultiplier: chargeCfg.chargeSpeed || 3,
                hasStruck: false
            }
        };
    }

    resetDragonSkills(dragon) {
        if (!dragon || !dragon.skillState) {
            return;
        }
        dragon.skillState.laser.phase = null;
        dragon.skillState.laser.timer = 0;
        dragon.skillState.laser.damageBuffer = 0;
        dragon.skillState.charge.phase = null;
        dragon.skillState.charge.timer = 0;
        dragon.skillState.charge.hasStruck = false;
    }

    tryTriggerDragonSkill(dragon, config) {
        const player = this.gameState.player;
        if (!player || !dragon.skillState) {
            return;
        }

        const aiConfig = config.aiConfig || {};
        const direction = this.getDirectionToPlayer(dragon);
        const distance = direction.distance;
        const healthRatio = Math.max(0, (dragon.health || 0) / Math.max(1, dragon.maxHealth || 1));
        const bonus = healthRatio <= (aiConfig.minHealthPercent || 0.3)
            ? aiConfig.lowHealthSkillBonus || 1.4
            : 1;

        const laserCfg = config.laserSweep || {};
        const laserState = dragon.skillState.laser;
        if (!laserState.phase && laserState.cooldown <= 0) {
            const chance = (laserCfg.triggerChance || 0.2) * bonus;
            const minDistance = (laserCfg.range || 380) * 0.35;
            if (distance >= minDistance && Math.random() < chance) {
                this.startLaserAttack(dragon, laserCfg);
            return;
        }
        }

        const chargeCfg = config.chargeAttack || {};
        const chargeState = dragon.skillState.charge;
        if (!chargeState.phase && chargeState.cooldown <= 0) {
            const chance = (chargeCfg.triggerChance || 0.15) * bonus;
            const threshold = aiConfig.playerDistanceThreshold || 220;
            if (distance <= threshold && Math.random() < chance) {
                this.startChargeAttack(dragon, chargeCfg, direction);
            }
        }
    }

    startLaserAttack(dragon, config) {
        const state = dragon.skillState.laser;
        state.phase = 'telegraph';
        state.timer = 0;
        state.cooldown = config.cooldown || 8;
        const dir = this.getDirectionToPlayer(dragon);
        state.direction = { x: dir.x, y: dir.y };
        state.range = config.range || 420;
        state.damageBuffer = 0;
    }

    updateLaserAttack(dragon, config, deltaTime) {
        const state = dragon.skillState?.laser;
        if (!state || !state.phase) {
            return;
        }

        state.timer += deltaTime;

        switch (state.phase) {
            case 'telegraph': {
                const dir = this.getDirectionToPlayer(dragon);
                state.direction = { x: dir.x, y: dir.y };
                if (state.timer >= (config.telegraphDuration || 1)) {
                    state.phase = 'firing';
                    state.timer = 0;
                    state.damageBuffer = 0;
                }
                break;
            }
            case 'firing': {
                this.applyLaserDamage(dragon, config, deltaTime);
                if (state.timer >= (config.duration || 0.75)) {
                    state.phase = 'recovery';
                    state.timer = 0;
                }
                break;
            }
            case 'recovery': {
                if (state.timer >= (config.recoveryDuration || 0.6)) {
                    state.phase = null;
                    state.timer = 0;
                }
                break;
            }
        }
    }

    startChargeAttack(dragon, config, direction) {
        const state = dragon.skillState.charge;
        state.phase = 'telegraph';
        state.timer = 0;
        state.cooldown = config.cooldown || 12;
        const dir = direction || this.getDirectionToPlayer(dragon);
        state.direction = { x: dir.x, y: dir.y };
        state.speedMultiplier = config.chargeSpeed || 3;
        state.hasStruck = false;
    }

    updateChargeAttack(dragon, config, deltaTime) {
        const state = dragon.skillState?.charge;
        if (!state || !state.phase) {
            return;
        }

        state.timer += deltaTime;

        switch (state.phase) {
            case 'telegraph': {
                const dir = this.getDirectionToPlayer(dragon);
                state.direction = { x: dir.x, y: dir.y };
                if (state.timer >= (config.telegraphDuration || 0.8)) {
                    state.phase = 'charging';
                    state.timer = 0;
                    state.hasStruck = false;
                }
                break;
            }
            case 'charging': {
                this.applyChargeDamage(dragon, config);
                if (state.timer >= (config.chargeDuration || 1.4)) {
                    state.phase = 'recovery';
                    state.timer = 0;
                }
                break;
            }
            case 'recovery': {
                if (state.timer >= (config.recoveryDuration || 0.7)) {
                    state.phase = null;
                    state.timer = 0;
                }
                break;
            }
        }
    }

    applyLaserDamage(dragon, config, deltaTime) {
        const player = this.gameState.player;
        if (!player) {
            return;
        }
        const state = dragon.skillState.laser;
        const origin = { x: dragon.x, y: dragon.y };
        const dir = state.direction || this.getDirectionToPlayer(dragon);
        const range = state.range || config.range || 420;
        const end = { x: origin.x + dir.x * range, y: origin.y + dir.y * range };

        const distance = this.distancePointToSegment(player.x, player.y, origin.x, origin.y, end.x, end.y);
        const beamRadius = config.projectileRadius || 16;
        if (distance > player.radius + beamRadius) {
            return;
        }

        state.damageBuffer = (state.damageBuffer || 0) + (config.damage || 40) * deltaTime;
        if (state.damageBuffer >= 1) {
            const amount = Math.max(1, Math.floor(state.damageBuffer));
            this.applyDamageToPlayer(amount, { source: dragon, type: 'dragon_laser' });
            state.damageBuffer -= amount;
        }
    }

    applyChargeDamage(dragon, config) {
        if (!this.gameState || !this.gameState.player) {
            return;
        }
        const state = dragon.skillState.charge;
        if (!state || state.hasStruck) {
            return;
        }

        const player = this.gameState.player;
        const distance = Math.hypot(player.x - dragon.x, player.y - dragon.y);
        if (distance <= player.radius + (dragon.radius || 25) * 0.85) {
            this.applyDamageToPlayer(config.damage || 50, { source: dragon, type: 'dragon_charge' });
            player.x += state.direction.x * (config.knockback || 80);
            player.y += state.direction.y * (config.knockback || 80);
            this.resolvePlayerObstacleOverlap(player, state.direction);
            this.clampPlayerPosition(player);
            this.gameState.notifyChange('player', player);
            state.hasStruck = true;
        }
    }

    renderDragonSkillEffects(dragon) {
        if (!dragon.skillState) {
            return;
        }
        const ctx = this.ctx;
        const laserState = dragon.skillState.laser;
        if (laserState && laserState.phase) {
            const origin = { x: dragon.x, y: dragon.y };
            const dir = laserState.direction || this.getDirectionToPlayer(dragon);
            const range = laserState.range || 420;
            const end = { x: origin.x + dir.x * range, y: origin.y + dir.y * range };

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(origin.x, origin.y);
            ctx.lineTo(end.x, end.y);
            if (laserState.phase === 'firing') {
                ctx.lineWidth = 6;
                ctx.strokeStyle = 'rgba(255, 46, 99, 0.92)';
                ctx.shadowColor = '#ff2e63';
                ctx.shadowBlur = 18;
            } else {
                ctx.lineWidth = 4;
                ctx.strokeStyle = 'rgba(255, 184, 77, 0.7)';
                ctx.shadowColor = '#ffb44d';
                ctx.shadowBlur = 12;
                ctx.setLineDash([10, 8]);
            }
            ctx.stroke();
            ctx.restore();
        }

        const chargeState = dragon.skillState.charge;
        if (chargeState && chargeState.phase === 'telegraph') {
            const origin = { x: dragon.x, y: dragon.y };
            const dir = chargeState.direction || this.getDirectionToPlayer(dragon);
            const end = { x: origin.x + dir.x * 90, y: origin.y + dir.y * 90 };
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(origin.x, origin.y);
            ctx.lineTo(end.x, end.y);
            ctx.lineWidth = 3;
            ctx.setLineDash([6, 6]);
            ctx.strokeStyle = 'rgba(0, 220, 255, 0.85)';
            ctx.shadowColor = '#00d0ff';
            ctx.shadowBlur = 8;
            ctx.stroke();
            ctx.restore();
        }
    }

    getDirectionToPlayer(dragon) {
        const player = this.gameState.player || { x: dragon.x, y: dragon.y };
        const dx = player.x - dragon.x;
        const dy = player.y - dragon.y;
        const distance = Math.hypot(dx, dy) || 1;
        return {
            x: dx / distance,
            y: dy / distance,
            distance
        };
    }

    distancePointToSegment(px, py, x1, y1, x2, y2) {
        const vx = x2 - x1;
        const vy = y2 - y1;
        const lengthSq = vx * vx + vy * vy;
        if (lengthSq === 0) {
            return Math.hypot(px - x1, py - y1);
        }
        let t = ((px - x1) * vx + (py - y1) * vy) / lengthSq;
        t = Math.max(0, Math.min(1, t));
        const sx = x1 + t * vx;
        const sy = y1 + t * vy;
        return Math.hypot(px - sx, py - sy);
    }

    isCircleCollidingWithObstacles(cx, cy, radius) {
        const obstacles = Array.isArray(this.gameState.obstacles)
            ? this.gameState.obstacles
            : [];
        if (!Array.isArray(obstacles) || obstacles.length === 0) {
            return false;
        }
        for (const obstacle of obstacles) {
            if (this.circleRectIntersects(cx, cy, radius, obstacle)) {
                return true;
            }
        }
        return false;
    }

    circleRectIntersects(cx, cy, radius, rect = {}) {
        const x = rect.x ?? 0;
        const y = rect.y ?? 0;
        const width = rect.width ?? 0;
        const height = rect.height ?? 0;
        const closestX = Math.max(x, Math.min(cx, x + width));
        const closestY = Math.max(y, Math.min(cy, y + height));
        const dx = cx - closestX;
        const dy = cy - closestY;
        return (dx * dx + dy * dy) <= radius * radius;
    }

    resolvePlayerObstacleOverlap(player, direction = { x: 0, y: 0 }) {
        if (!player) {
            return;
        }
        const obstacles = Array.isArray(this.gameState.obstacles)
            ? this.gameState.obstacles
            : [];
        if (!obstacles.length) {
            return;
        }

        let attempts = 0;
        const maxAttempts = 12;
        let dx = -(direction?.x || 0);
        let dy = -(direction?.y || 0);
        const hasDirection = Math.hypot(dx, dy) > 0.0001;

        while (this.isCircleCollidingWithObstacles(player.x, player.y, player.radius) && attempts < maxAttempts) {
            if (hasDirection) {
                const invMag = 1 / Math.hypot(dx, dy);
                player.x += dx * invMag * 4;
                player.y += dy * invMag * 4;
            } else {
                player.x += (attempts % 2 === 0 ? 1 : -1) * 3;
                player.y += (attempts % 3 === 0 ? 1 : -1) * 3;
            }
            attempts += 1;
        }

        if (!this.isCircleCollidingWithObstacles(player.x, player.y, player.radius)) {
            return;
        }

        obstacles.forEach(ob => {
            if (!this.circleRectIntersects(player.x, player.y, player.radius, ob)) {
                return;
            }
            const closestX = Math.max(ob.x, Math.min(player.x, ob.x + ob.width));
            const closestY = Math.max(ob.y, Math.min(player.y, ob.y + ob.height));
            const overlapDX = player.x - closestX;
            const overlapDY = player.y - closestY;
            const distance = Math.hypot(overlapDX, overlapDY) || 1;
            player.x = closestX + (overlapDX / distance) * (player.radius + 1);
            player.y = closestY + (overlapDY / distance) * (player.radius + 1);
        });
    }

    clampPlayerPosition(player) {
        player.x = Math.max(player.radius, Math.min(this.width - player.radius, player.x));
        player.y = Math.max(player.radius, Math.min(this.height - player.radius, player.y));
    }

    /**
     * 更新子弹
     */
    updateBullet(bullet, deltaTime) {
        bullet.x += bullet.vx * deltaTime;
        bullet.y += bullet.vy * deltaTime;
        bullet.life -= deltaTime;
        
        // 边界检查
        if (bullet.x < 0 || bullet.x > this.width || 
            bullet.y < 0 || bullet.y > this.height || 
            bullet.life <= 0) {
            this.gameState.removeBullet(bullet);
        }
    }

    /**
     * 更新粒子
     */
    updateParticles(deltaTime) {
        const particles = this.gameState.particles;
        for (let i = particles.length - 1; i >= 0; i--) {
            const particle = particles[i];
            particle.life -= deltaTime;
            
            if (particle.life <= 0) {
                particles.splice(i, 1);
            } else {
                // 更新粒子位置
                particle.x += particle.vx * deltaTime;
                particle.y += particle.vy * deltaTime;
                particle.vy += particle.gravity * deltaTime;
            }
        }
    }

    updatePowerUps(deltaTime) {
        const powerUps = Array.isArray(this.gameState.powerUps)
            ? this.gameState.powerUps
            : [];

        for (let i = powerUps.length - 1; i >= 0; i--) {
            const power = powerUps[i];
            power.age = (power.age || 0) + deltaTime;
            power.floatPhase = (power.floatPhase || 0) + deltaTime * 2.2;
            const lifespan = power.lifespan || (this.adventurePowerUpConfig?.lifespan || 25);
            if (power.age >= lifespan) {
                this.gameState.removePowerUp(power);
                continue;
            }
        }

        this.updateAdventurePowerUpSpawns(deltaTime);
    }

    updateAdventurePowerUpSpawns(deltaTime) {
        if (!this.adventurePowerUpConfig) {
            return;
        }

        this.adventurePowerUpTimer += deltaTime;
        const currentCount = Array.isArray(this.gameState.powerUps) ? this.gameState.powerUps.length : 0;
        if (currentCount >= this.adventurePowerUpConfig.maxActive) {
            return;
        }

        if (this.adventurePowerUpTimer >= this.adventurePowerUpConfig.spawnInterval) {
            const spawned = this.spawnAdventurePowerUp();
            if (spawned) {
                this.adventurePowerUpTimer = 0;
            }
        }
    }

    spawnAdventurePowerUp() {
        if (!this.adventurePowerUpConfig) {
            return false;
        }

        const position = this.findAdventurePowerUpPosition();
        if (!position) {
            return false;
        }

        const type = this.pickAdventurePowerUpType();
        const powerUp = {
            id: `fruit-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
            type,
            x: position.x,
            y: position.y,
            radius: 16,
            age: 0,
            lifespan: this.adventurePowerUpConfig.lifespan,
            floatPhase: Math.random() * Math.PI * 2
        };

        this.gameState.addPowerUp(powerUp);
        this.eventSystem.emit('POWER_UP_SPAWNED', powerUp);
        return true;
    }

    pickAdventurePowerUpType() {
        const types = this.adventurePowerUpConfig?.types;
        if (!Array.isArray(types) || types.length === 0) {
            return 'attack';
        }
        const index = Math.floor(Math.random() * types.length);
        return types[index];
    }

    findAdventurePowerUpPosition() {
        const attempts = 30;
        const margin = 40;
        const player = this.gameState.player;
        const radius = 16;
        const existing = Array.isArray(this.gameState.powerUps) ? this.gameState.powerUps : [];
        for (let i = 0; i < attempts; i++) {
            const x = margin + Math.random() * (this.width - margin * 2);
            const y = margin + Math.random() * (this.height - margin * 2);
            if (player && Math.hypot(player.x - x, player.y - y) < player.radius + radius + 15) {
                continue;
            }
            if (this.isCircleCollidingWithObstacles(x, y, radius + 4)) {
                continue;
            }
            let overlaps = false;
            for (const power of existing) {
                if (Math.hypot((power.x || 0) - x, (power.y || 0) - y) < (power.radius || radius) + radius + 12) {
                    overlaps = true;
                    break;
                }
            }
            if (overlaps) {
                continue;
            }
            return { x, y };
        }
        return null;
    }

    /**
     * 更新伤害数字
     */
    updateDamageNumbers(deltaTime) {
        const damageNumbers = this.gameState.damageNumbers;
        for (let i = damageNumbers.length - 1; i >= 0; i--) {
            const dn = damageNumbers[i];
            dn.life -= deltaTime;
            
            if (dn.life <= 0) {
                damageNumbers.splice(i, 1);
            } else {
                dn.y -= 50 * deltaTime; // 向上飘移
                dn.alpha = dn.life / dn.maxLife;
            }
        }
    }

    updateEffects(deltaTime) {
        if (!Array.isArray(this.activeEffects) || !this.activeEffects.length) {
            return;
        }

        for (let i = this.activeEffects.length - 1; i >= 0; i--) {
            const effect = this.activeEffects[i];
            effect.remaining -= deltaTime;
            if (effect.remaining <= 0) {
                this.activeEffects.splice(i, 1);
            }
        }
    }

    /**
     * 处理碰撞检测
     */
    handleCollisions() {
        this.checkBulletDragonCollisions();
        this.checkPlayerDragonCollisions();
        this.checkPlayerPowerUpCollisions();
    }

    /**
     * 检查子弹与龙的碰撞
     */
    checkBulletDragonCollisions() {
        const bullets = this.gameState.getBullets();
        const dragons = this.gameState.getDragons();

        for (const bullet of bullets) {
            for (const dragon of dragons) {
                let applied = false;

                // 预筛：与头或任意段发生重叠才继续，实际判定交给 handleBulletHit 执行顺序规则
                const headDist = Math.sqrt(
                    Math.pow(bullet.x - dragon.x, 2) + 
                    Math.pow(bullet.y - dragon.y, 2)
                );
                if (headDist <= bullet.radius + dragon.radius) {
                    applied = this.handleBulletHit(bullet, dragon) === true;
                } else if (Array.isArray(dragon.bodySegments)) {
                    for (let i = 0; i < dragon.bodySegments.length; i++) {
                        const seg = dragon.bodySegments[i];
                        const d = Math.sqrt(
                            Math.pow(bullet.x - seg.x, 2) + 
                            Math.pow(bullet.y - seg.y, 2)
                        );
                        if (d <= bullet.radius + seg.radius) {
                            applied = this.handleBulletHit(bullet, dragon) === true;
                            break;
                        }
                    }
                }

                if (applied) {
                    this.gameState.removeBullet(bullet);
                    break;
                }
            }
        }
    }

    /**
     * 处理子弹击中
     */
    handleBulletHit(bullet, dragon) {
        // 伤害与元素克制
        const effectiveness = this.elementSystem.getEffectiveness(bullet.element, dragon.element);
        const finalDamage = bullet.damage * effectiveness;

        // 顺序规则：若头未死，只能伤害头；若头已死，只能伤害最前面的身体段 index=0
        const headDist = Math.sqrt(Math.pow(bullet.x - dragon.x, 2) + Math.pow(bullet.y - dragon.y, 2));
        if (!dragon.isHeadDead) {
            if (headDist > bullet.radius + dragon.radius) return false;
            let remainingDamage = finalDamage;
            // 连续处理头部伤害，若旧头被击破则自动提升下一节
            while (remainingDamage > 0 && !dragon._markedForRemoval) {
                const nextRemaining = this.applyDamageToHead(dragon, remainingDamage, bullet, effectiveness);
                if (nextRemaining === remainingDamage) {
                    // 未造成额外伤害，停止循环以避免死循环
                    break;
                }
                remainingDamage = nextRemaining;
                if (remainingDamage <= 0 || dragon.isHeadDead) {
                    break;
                }
            }
            this.eventSystem.emit('BULLET_HIT', { bullet, dragon, damage: finalDamage, effectiveness, hitPart: 'head' });
            return true;
        }

        if (!Array.isArray(dragon.bodySegments) || dragon.bodySegments.length === 0) return false;
        const front = dragon.bodySegments[0];
        const d = Math.sqrt(Math.pow(bullet.x - front.x, 2) + Math.pow(bullet.y - front.y, 2));
        if (d > bullet.radius + front.radius) return false;
        this.applyDamageToFrontSegments(dragon, finalDamage, bullet);
        this.eventSystem.emit('BULLET_HIT', { bullet, dragon, damage: finalDamage, effectiveness, hitPart: 'segment' });
        // 只有当所有段被玩家清空后才判定整龙死亡
        if (!dragon._markedForRemoval && dragon.isHeadDead && (!dragon.bodySegments || dragon.bodySegments.length === 0)) {
            this.handleDragonDeath(dragon);
        }
        return true;
    }

    /**
     * 处理龙死亡
     */
    handleDragonDeath(dragon) {
        if (dragon) {
            dragon._markedForRemoval = true;
        }
        const comboResult = this.comboSystem
            ? this.comboSystem.registerKill({ gameTime: this.gameState.getGameTime() })
            : null;

        const waveRewardModifiers = this.waveModifierSystem
            ? this.waveModifierSystem.getRewardModifiers()
            : null;

        const waveKillBonuses = this.waveModifierSystem
            ? this.waveModifierSystem.handleDragonDeath()
            : null;

        // 记录击杀
        this.gameState.recordKill(dragon.element);
        this.dragonsDefeated = (this.dragonsDefeated || 0) + 1;
        const victoryReached = this.dragonsDefeated >= this.maxDragonsPerRun;

        // 增加分数
        const baseScore = 100;
        const waveBonus = this.gameState.getWave() * 10;
        const elementBonus = this.getElementBonus(dragon.element);
        const comboMultiplier = comboResult?.multiplier ?? 1;
        const rewardMultiplier = waveRewardModifiers?.scoreMultiplier ?? 1;

        let totalScore = baseScore + waveBonus + elementBonus;
        totalScore = Math.floor(totalScore * comboMultiplier * rewardMultiplier);
        totalScore += comboResult?.bonusScore ?? 0;
        totalScore += waveRewardModifiers?.flatScoreBonus ?? 0;
        totalScore += waveKillBonuses?.bonusScore ?? 0;

        this.gameState.updateScore(totalScore);

        const extraExperience = (comboResult?.bonusExperience ?? 0) + (waveKillBonuses?.bonusExperience ?? 0);
        const experienceMultiplier = waveRewardModifiers?.experienceMultiplier ?? 1;
        const flatExperienceBonus = waveRewardModifiers?.flatExperienceBonus ?? 0;
        const totalExperience = extraExperience * experienceMultiplier + flatExperienceBonus;
        if (totalExperience > 0 && typeof this.gameState.addExperience === 'function') {
            this.gameState.addExperience(totalExperience);
        }

        // 创建死亡粒子效果
        this.createDeathEffect(dragon);

        // 移除龙
        this.gameState.removeDragon(dragon);

        if (this.resourceSystem) {
            this.resourceSystem.handleDragonDeath(dragon, {
                combo: comboResult || (this.comboSystem ? this.comboSystem.getState() : this.gameState.getComboState?.()),
                waveModifier: this.waveModifierSystem ? this.waveModifierSystem.getActiveModifier() : null
            });
        }

        if (this.enhancementSystem && waveKillBonuses?.extraEnhancement) {
            this.enhancementSystem.applyEnhancement(waveKillBonuses.extraEnhancement);
        }

        this.handleWaveProgressOnKill();

        // 生成新龙或结束游戏
        if (!victoryReached) {
            this.spawnNewDragon();
        } else {
            this.handleGameVictory();
        }

        // 触发事件
        this.eventSystem.emit('DRAGON_DEATH', {
            dragon,
            scoreAward: totalScore,
            combo: comboResult,
            waveModifier: waveRewardModifiers,
            experienceAward: totalExperience
        });
        
        console.log(`击杀了${dragon.element}龙，获得${totalScore}分`);
    }

    /**
     * 获取元素奖励倍率
     */
    getElementBonus(element) {
        const bonuses = {
            stone: 50,
            fire: 75,
            ice: 75,
            thunder: 100,
            poison: 100,
            dark: 200
        };
        return bonuses[element] || 50;
    }

    /**
     * 创建死亡特效
     */
    createDeathEffect(dragon) {
        const particleCount = 15;
        const element = this.elementSystem.getElement(dragon.element);
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = 50 + Math.random() * 100;
            
            const particle = {
                x: dragon.x,
                y: dragon.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: element.color,
                size: 2 + Math.random() * 4,
                life: 1.0 + Math.random() * 1.0,
                maxLife: 2.0,
                gravity: 50
            };
            
            this.gameState.addParticle(particle);
        }
    }

    /**
     * 生成新龙
     */
    spawnNewDragon() {
        this.spawnNextDragon();
    }

    spawnNextDragon(initial = false) {
        if (this.dragonsSpawned >= this.maxDragonsPerRun) {
            return;
        }
        if (!initial && this.gameState.getDragons().length > 0) {
            return;
        }

        const definition = this.getNextDragonDefinition();
        const dragon = this.createDragon(definition.type, definition);

        const player = this.gameState.player;
        const safeDistance = 200;
        const maxAttempts = 20;
        let attempts = 0;
        let validPosition = false;

        while (attempts < maxAttempts && player) {
            dragon.x = Math.random() * this.width;
            dragon.y = Math.random() * this.height;
            attempts += 1;
            const distance = Math.hypot(dragon.x - player.x, dragon.y - player.y);
            if (distance >= safeDistance) {
                validPosition = true;
                break;
            }
        }

        if (!validPosition && player) {
            const angle = Math.random() * Math.PI * 2;
            dragon.x = Math.max(dragon.radius, Math.min(this.width - dragon.radius, player.x + Math.cos(angle) * safeDistance));
            dragon.y = Math.max(dragon.radius, Math.min(this.height - dragon.radius, player.y + Math.sin(angle) * safeDistance));
        } else if (!player) {
            dragon.x = Math.random() * this.width;
            dragon.y = Math.random() * this.height;
        }

        this.applyWaveModifiers(dragon);
        this.gameState.addDragon(dragon);
        this.dragonsSpawned += 1;
        this.eventSystem.emit('DRAGON_SPAWN', dragon);
        console.log(`生成了${definition.type}龙`);
    }

    spawnAbilityUpgradeLoot(abilityId, source) {
        if (!this.resourceSystem || !abilityId || !source) {
            return;
        }

        const loot = this.resourceSystem.spawnLoot(source, 'ability_upgrade', abilityId);
        if (loot) {
            loot.abilityId = abilityId;
        }
    }

    spawnRewardBonusLoot(bonus, source) {
        if (!bonus || !source) {
            return;
        }

        if (!this.resourceSystem || typeof this.resourceSystem.spawnLoot !== 'function') {
            this.applyRewardBonus(bonus);
            return;
        }

        const bonusValue = typeof bonus === 'object' ? { ...bonus } : bonus;
        const loot = this.resourceSystem.spawnLoot(source, 'reward_bonus', bonusValue);
        if (loot) {
            loot.bonus = typeof bonusValue === 'object' ? { ...bonusValue } : bonusValue;
        } else {
            this.applyRewardBonus(bonusValue);
        }
    }

    /**
     * 检查玩家与龙的碰撞
     */
    checkPlayerDragonCollisions() {
        const player = this.gameState.player;
        const dragons = this.gameState.getDragons();
        
        for (const dragon of dragons) {
            // 头部碰撞
            if (!dragon.isHeadDead && (dragon.headHealth || 0) > 0) {
                const headDist = Math.sqrt(
                Math.pow(player.x - dragon.x, 2) + 
                Math.pow(player.y - dragon.y, 2)
            );
                if (headDist <= player.radius + dragon.radius) {
                this.handlePlayerDragonCollision(player, dragon);
                continue;
            }
            }

            // 身体段碰撞
            if (Array.isArray(dragon.bodySegments)) {
                for (let i = 0; i < dragon.bodySegments.length; i++) {
                    const seg = dragon.bodySegments[i];
                    const d = Math.sqrt(
                        Math.pow(player.x - seg.x, 2) + 
                        Math.pow(player.y - seg.y, 2)
                    );
                    if (d <= player.radius + seg.radius) {
                        this.handlePlayerDragonCollision(player, dragon);
                        break;
                    }
                }
            }
        }
    }

    checkPlayerPowerUpCollisions() {
        const player = this.gameState.player;
        const powerUps = Array.isArray(this.gameState.powerUps)
            ? this.gameState.powerUps
            : [];
        if (!player || powerUps.length === 0) {
            return;
        }

        for (let i = powerUps.length - 1; i >= 0; i--) {
            const power = powerUps[i];
            const distance = Math.hypot((power.x || 0) - player.x, (power.y || 0) - player.y);
            if (distance <= (power.radius || 14) + player.radius) {
                this.applyPowerUpEffect(power.type, player);
                this.gameState.removePowerUp(power);
                this.eventSystem.emit('POWER_UP_COLLECTED', { type: power.type, player });
            }
        }
    }

    applyPowerUpEffect(type, player) {
        if (!player) {
            return;
        }

        const normalized = (type || '').toString().toLowerCase();
        switch (normalized) {
            case 'attack': {
                const bonus = Math.max(2, Math.round(player.damage * 0.12));
                player.damage += bonus;
                break;
            }
            case 'attack_speed': {
                player.attackSpeedBonus = (player.attackSpeedBonus || 0) + 0.25;
                break;
            }
            case 'move_speed': {
                player.speed = Math.min(520, player.speed + 35);
                break;
            }
            case 'volley': {
                player.weaponMode = 'volley';
                player.weaponModeTimer = Math.max(player.weaponModeTimer || 0, 18);
                break;
            }
            case 'spread':
            case 'spread_shot': {
                player.weaponMode = 'spread';
                player.weaponModeTimer = Math.max(player.weaponModeTimer || 0, 18);
                break;
            }
            default: {
                player.damage += Math.max(1, Math.round(player.damage * 0.08));
                break;
            }
        }

        this.gameState.notifyChange('player', player);
    }

    /**
     * 处理玩家与龙的碰撞
     */
    handlePlayerDragonCollision(player, dragon) {
        const currentTime = Date.now();
        if (!dragon.lastPlayerHit || currentTime - dragon.lastPlayerHit >= 1000) {
            const damage = Math.max(1, dragon.damage || 0);
            const result = this.applyDamageToPlayer(damage, { source: dragon, type: 'dragon_collision' });

            if (result.healthDamage > 0 || result.shieldAbsorbed > 0) {
            dragon.lastPlayerHit = currentTime;
                this.eventSystem.emit('PLAYER_DAMAGE', { player, dragon, damage, result });
            }
        }
    }

    applyDamageToPlayer(amount, context = {}) {
        const player = this.gameState.player;
        if (!player || typeof amount !== 'number' || amount <= 0) {
            return { applied: 0, shieldAbsorbed: 0, healthDamage: 0, context };
        }

        if (player.invulnerableTimer && player.invulnerableTimer > 0) {
            return { applied: 0, shieldAbsorbed: 0, healthDamage: 0, context, reason: 'invulnerable' };
        }

        let remaining = amount;
        let shieldAbsorbed = 0;

        if (player.shield && player.shield.value > 0) {
            const absorbed = Math.min(player.shield.value, remaining);
            player.shield.value -= absorbed;
            shieldAbsorbed = absorbed;
            remaining -= absorbed;

            if (player.shield.value <= 0) {
                player.shield = null;
            }
        }

        let healthDamage = 0;
        if (remaining > 0) {
            healthDamage = remaining;
            player.health = Math.max(0, player.health - remaining);
            this.gameState.recordDamage(remaining, 'taken');
            this.addDamageNumber(player.x, player.y - 30, Math.floor(remaining), 1.0, true);

            if (player.health <= 0) {
                this.handlePlayerDeath();
            }
        }

        this.gameState.notifyChange('player', player);

        this.eventSystem.emit('PLAYER_DAMAGE_TAKEN', {
            amount,
            shieldAbsorbed,
            healthDamage,
            context
        });

        return {
            applied: amount,
            shieldAbsorbed,
            healthDamage,
            remainingDamage: Math.max(0, remaining),
            context
        };
    }

    /**
     * 处理玩家死亡
     */
    handlePlayerDeath() {
        console.log('玩家死亡');
        this.gameState.lives--;
        
        if (this.gameState.lives <= 0) {
            this.handleGameOver();
        } else {
            // 复活玩家
            const respawnInvuln = (typeof BalanceConfig !== 'undefined' && BalanceConfig.PLAYER?.invincibilityFrames)
                ? BalanceConfig.PLAYER.invincibilityFrames / 1000
                : 1.0;
            this.gameState.setPlayer({
                health: this.gameState.player.maxHealth,
                x: this.width / 2,
                y: this.height / 2,
                shield: null,
                invulnerableTimer: respawnInvuln
            });
        }
    }

    /**
     * 处理游戏结束
     */
    handleGameOver() {
        console.log('游戏结束');
        this.gameState.setGameState('over', true);
        const payload = {
            score: this.gameState.getScore(),
            wave: this.gameState.getWave(),
            kills: this.gameState.kills
        };
        this.eventSystem.emit('GAME_OVER', payload);
        if (typeof window !== 'undefined' && typeof window.handleGameOver === 'function') {
            try {
                window.handleGameOver(payload);
            } catch (error) {
                console.warn('handleGameOver 回调执行失败:', error);
            }
        }
    }

    handleGameVictory() {
        if (this.gameState.gameOver) {
            return;
        }
        console.log('胜利！所有巨龙已被击败');
        this.gameState.setGameState('over', true);
        const payload = {
            score: this.gameState.getScore(),
            wave: this.gameState.getWave(),
            kills: this.gameState.kills,
            victory: true
        };
        this.eventSystem.emit('GAME_OVER', payload);
        if (typeof window !== 'undefined' && typeof window.handleGameOver === 'function') {
            try {
                window.handleGameOver(payload);
            } catch (error) {
                console.warn('handleGameOver 回调执行失败:', error);
            }
        }
    }

    /**
     * 添加伤害数字
     */
    addDamageNumber(x, y, damage, effectiveness = 1.0, isPlayerDamage = false) {
        let color = '#FFFFFF';
        
            if (isPlayerDamage) {
                color = '#FF0000';
            } else if (effectiveness > 1.5) {
                color = '#FFD700'; // 金色 - 强克制
            } else if (effectiveness > 1.0) {
                color = '#00FF00'; // 绿色 - 克制
            } else if (effectiveness < 1.0) {
                color = '#0080FF'; // 蓝色 - 被克制
        }
        
        const damageNumber = {
            x: x + (Math.random() - 0.5) * 20,
            y: y - 10,
            text: Math.floor(damage).toString(),
            color: color,
            life: 1.5,
            maxLife: 1.5,
            alpha: 1.0
        };
        
        this.gameState.addDamageNumber(damageNumber);
    }

    /**
     * 清理无效对象
     */
    cleanup() {
        this.gameState.cleanupParticles();
        this.gameState.cleanupDamageNumbers();
    }

    /**
     * 检查游戏结束条件
     */
    checkGameOver() {
        if (this.gameState.player.health <= 0 && this.gameState.lives <= 0) {
            this.handleGameOver();
        }
    }

    // ==================== 渲染方法 ====================

    /**
     * 渲染游戏画面
     */
    render() {
        // 清空画布
        this.ctx.fillStyle = '#000011';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        if (this.gameState.gameStarted) {
            this.renderGame();
        } else {
            this.renderMenu();
        }
    }

    /**
     * 渲染游戏内容
     */
    renderGame() {
        // 渲染实体
        this.renderObstacles();
        this.renderPowerUps();
        this.renderPlayer();
        this.renderDragons();
        this.renderBullets();
        this.renderParticles();
        this.renderEffects();
        this.renderDamageNumbers();
        
        // 渲染UI
        this.renderHUD();
        
        // 渲染暂停界面
        if (this.gameState.isPaused) {
            this.renderPauseScreen();
        }
        
        // 渲染游戏结束界面
        if (this.gameState.gameOver) {
            this.renderGameOverScreen();
        }
    }

    /**
     * 渲染玩家
     */
    renderPlayer() {
        const player = this.gameState.player;
        
        this.ctx.save();
        this.ctx.fillStyle = '#00FFFF';
        this.ctx.beginPath();
        this.ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
        this.ctx.fill();

        // 渲染生命条
        this.renderEntityHealthBar(player, player.x, player.y - player.radius - 10);
        
        this.ctx.restore();
    }

    renderObstacles() {
        const obstacles = Array.isArray(this.gameState.obstacles)
            ? this.gameState.obstacles
            : [];
        if (!Array.isArray(obstacles) || obstacles.length === 0) {
            return;
        }

        this.ctx.save();
        this.ctx.fillStyle = 'rgba(76, 106, 160, 0.9)';
        this.ctx.strokeStyle = '#c9d7ff';
        this.ctx.lineWidth = 3;
        this.ctx.shadowColor = 'rgba(145, 178, 255, 0.8)';
        this.ctx.shadowBlur = 16;
        obstacles.forEach(ob => {
            const { x = 0, y = 0, width = 40, height = 40 } = ob || {};
            this.ctx.globalAlpha = 0.95;
            this.ctx.fillRect(x, y, width, height);
            this.ctx.globalAlpha = 1;
            if (typeof this.ctx.setLineDash === 'function') {
                this.ctx.setLineDash([10, 6]);
            }
            this.ctx.strokeRect(x, y, width, height);
            if (typeof this.ctx.setLineDash === 'function') {
                this.ctx.setLineDash([]);
            }
        });
        this.ctx.restore();
    }

    renderPowerUps() {
        const powerUps = Array.isArray(this.gameState.powerUps)
            ? this.gameState.powerUps
            : [];
        if (!powerUps.length) {
            return;
        }

        const typeStyles = {
            attack: { fill: '#ff6b6b', stroke: '#ff3b3b', icon: '⚔️' },
            attack_speed: { fill: '#ffa94d', stroke: '#ff922b', icon: '⚡' },
            move_speed: { fill: '#4dabf7', stroke: '#339af0', icon: '💨' },
            volley: { fill: '#845ef7', stroke: '#7048e8', icon: '🎯' },
            spread: { fill: '#63e6be', stroke: '#38d9a9', icon: '🌟' },
            spread_shot: { fill: '#63e6be', stroke: '#38d9a9', icon: '🌟' }
        };

        this.ctx.save();
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.font = '16px sans-serif';
        powerUps.forEach(power => {
            const style = typeStyles[power.type] || typeStyles.attack;
            const floatPhase = power.floatPhase || 0;
            const offset = Math.sin(floatPhase) * 4;
            const x = power.x;
            const y = power.y + offset;
            const radius = power.radius || 14;

            this.ctx.beginPath();
            this.ctx.fillStyle = style.fill;
            this.ctx.strokeStyle = style.stroke;
            this.ctx.lineWidth = 2;
            const gradient = this.ctx.createRadialGradient(x, y, radius * 0.2, x, y, radius);
            gradient.addColorStop(0, style.fill);
            gradient.addColorStop(1, '#121826');
            this.ctx.fillStyle = gradient;
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();

            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText(style.icon, x, y);
        });
        this.ctx.restore();
    }

    /**
     * 渲染龙
     */
    renderDragons() {
        const dragons = this.gameState.getDragons();
        
        for (const dragon of dragons) {
            this.ctx.save();

            if (Array.isArray(dragon.bodySegments)) {
                for (let i = dragon.bodySegments.length - 1; i >= 0; i--) {
                    const seg = dragon.bodySegments[i];
                    this.ctx.save();
                    if (seg.rewardBonus) {
                        this.ctx.fillStyle = 'rgba(255, 215, 0, 0.18)';
                        this.ctx.strokeStyle = '#FFD700';
                        this.ctx.lineWidth = 3;
                    } else {
            this.ctx.fillStyle = dragon.color;
                    }
            this.ctx.shadowColor = dragon.glowColor;
                    this.ctx.shadowBlur = 6;
                    this.ctx.globalAlpha = 1.0;
            this.ctx.beginPath();
                    this.ctx.arc(seg.x, seg.y, seg.radius, 0, Math.PI * 2);
            this.ctx.fill();
                    if (seg.rewardBonus) {
                        this.ctx.stroke();
                    }

                    this.renderSmallHealthBar(seg, seg.x, seg.y - seg.radius - 6);
                    this.renderHealthValue(seg.health, seg.x, seg.y);
            this.ctx.restore();
        }
    }

            if (Array.isArray(dragon.enhancementSegments) && dragon.enhancementSegments.length > 0) {
                this.renderStoneEnhancementSegments(dragon);
            }

            const currentHeadHealth = (dragon.headHealth !== undefined)
                ? dragon.headHealth
                : (dragon.health !== undefined ? dragon.health : 0);
            const currentHeadMax = (dragon.headMaxHealth !== undefined)
                ? dragon.headMaxHealth
                : (dragon.maxHealth !== undefined ? dragon.maxHealth : Math.max(1, currentHeadHealth));

            if (!dragon.isHeadDead && currentHeadHealth > 0) {
                // 渲染头部（置于最上层）
                this.ctx.fillStyle = dragon.color;
                this.ctx.shadowColor = dragon.glowColor;
                this.ctx.shadowBlur = 10;
        this.ctx.beginPath();
                this.ctx.arc(dragon.x, dragon.y, dragon.radius, 0, Math.PI * 2);
            this.ctx.fill();

                // 头部生命条
                const headProxy = { health: currentHeadHealth, maxHealth: currentHeadMax };
                this.renderEntityHealthBar(headProxy, dragon.x, dragon.y - dragon.radius - 10);
                this.renderHealthValue(currentHeadHealth, dragon.x, dragon.y);
            }

            this.renderDragonSkillEffects(dragon);
            this.ctx.restore();
        }
    }

    renderStoneEnhancementSegments(dragon) {
        const segments = Array.isArray(dragon.enhancementSegments) ? dragon.enhancementSegments : [];
        if (!segments.length) {
            return;
        }

        const baseRadius = (dragon.radius || 30) + 18;
        const time = (this.gameState && typeof this.gameState.getGameTime === 'function')
            ? this.gameState.getGameTime()
            : 0;
        const spin = 0.8;
        const total = Math.max(1, segments.length);
        
        for (let i = 0; i < total; i++) {
            const segment = segments[i];
            const radius = segment.radius || Math.max(10, Math.round((dragon.radius || 30) * 0.28));
            const baseAngle = typeof segment.angleOffset === 'number'
                ? segment.angleOffset
                : (i / total) * Math.PI * 2;
            const angle = baseAngle + time * spin;
            const x = (dragon.x || 0) + Math.cos(angle) * baseRadius;
            const y = (dragon.y || 0) + Math.sin(angle) * baseRadius;

        this.ctx.save();
            this.ctx.fillStyle = segment.color || '#9C8C6A';
            this.ctx.shadowColor = segment.glowColor || '#d1c4a8';
            this.ctx.shadowBlur = 6;
            this.ctx.globalAlpha = 0.9;
        this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }
    }

    /**
     * 渲染实体生命条
     */
    renderEntityHealthBar(entity, x, y) {
        const barWidth = 40;
        const barHeight = 4;
        const healthPercent = Math.max(0, Math.min(1, entity.health / Math.max(1, entity.maxHealth)));
        
        // 背景
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(x - barWidth/2, y, barWidth, barHeight);
        
        // 生命条
        this.ctx.fillStyle = healthPercent > 0.6 ? '#00FF00' : 
                            healthPercent > 0.3 ? '#FFFF00' : '#FF0000';
        this.ctx.fillRect(x - barWidth/2, y, barWidth * healthPercent, barHeight);
    }

    /**
     * 渲染小号生命条（用于身体段）
     */
    renderSmallHealthBar(entity, x, y) {
        const barWidth = 26;
        const barHeight = 3;
        const healthPercent = Math.max(0, Math.min(1, entity.health / Math.max(1, entity.maxHealth)));
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(x - barWidth/2, y, barWidth, barHeight);
        this.ctx.fillStyle = healthPercent > 0.6 ? '#00FF00' : 
                            healthPercent > 0.3 ? '#FFFF00' : '#FF0000';
        this.ctx.fillRect(x - barWidth/2, y, barWidth * healthPercent, barHeight);
    }

    renderHealthValue(value, x, y) {
        const numeric = Math.max(0, Math.floor(value || 0));
            this.ctx.save();
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 16px "Roboto", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        this.ctx.shadowBlur = 4;
        this.ctx.fillText(numeric.toLocaleString(), x, y);
            this.ctx.restore();
    }

    /**
     * 根据路径更新身体段位置
     */
    updateDragonBodyByPath(dragon) {
        if (!Array.isArray(dragon.bodySegments) || dragon.bodySegments.length === 0) {
            return;
        }
        if (!Array.isArray(dragon.bodyPath) || dragon.bodyPath.length < 2) {
            return;
        }

        const spacing = Math.max(4, dragon.spacing || 20);
        const path = dragon.bodyPath;

        // 预先计算每段在路径上的目标距离
        for (let i = 0; i < dragon.bodySegments.length; i++) {
            const targetDistance = (i + 1) * spacing;
            // 在路径上累计距离以找到对应点
            let accumulated = 0;
            let found = false;
            for (let j = 0; j < path.length - 1; j++) {
                const p0 = path[j];
                const p1 = path[j + 1];
                const dx = p1.x - p0.x;
                const dy = p1.y - p0.y;
                const segDist = Math.sqrt(dx * dx + dy * dy);
                if (accumulated + segDist >= targetDistance) {
                    const t = (targetDistance - accumulated) / Math.max(0.0001, segDist);
                    const seg = dragon.bodySegments[i];
                    seg.x = p0.x + dx * t;
                    seg.y = p0.y + dy * t;
                    found = true;
                    break;
                }
                accumulated += segDist;
            }
            if (!found) {
                // 路径不够长，使用最后一个点兜底
                const last = path[path.length - 1];
                const seg = dragon.bodySegments[i];
                seg.x = last.x;
                seg.y = last.y;
            }
        }
    }

    /**
     * 聚合并更新龙的展示血量（头部+所有身体段）
     */
    updateDragonAggregateHealth(dragon) {
        const bodyHealth = Array.isArray(dragon.bodySegments)
            ? dragon.bodySegments.reduce((sum, seg) => sum + Math.max(0, seg.health), 0)
            : 0;
        dragon.health = Math.max(0, (dragon.headHealth || 0) + bodyHealth);
        const bodyMax = Array.isArray(dragon.bodySegments)
            ? dragon.bodySegments.reduce((sum, seg) => sum + Math.max(0, seg.maxHealth || 0), 0)
            : 0;
        dragon.maxHealth = Math.max(1, (dragon.headMaxHealth || 0) + bodyMax);
    }

    /**
     * 增长一个身体段（遵循 BalanceConfig）
     */
    tryGrowDragonSegment(dragon) {
        if (!Array.isArray(dragon.bodySegments)) {
            dragon.bodySegments = [];
        }
        const current = dragon.bodySegments.length;
        const maxSegments = Math.min(30, Math.max(0, dragon.maxBodySegments ?? dragon.maxSegments ?? 3));
        if (current >= maxSegments) {
            return;
        }

        const radius = dragon.segmentRadius || Math.floor(dragon.radius * 0.85);
        const baseHealth = Math.max(20, Math.floor(dragon.headMaxHealth * 0.6));
        const segmentHealthFactor = Math.max(1.05, dragon.segmentHealthFactor || this.activeDifficultyProfile?.dragon?.segmentHealthFactor || 1.22);
        const segmentDamageFactor = Math.max(1.05, dragon.segmentDamageFactor || this.activeDifficultyProfile?.dragon?.segmentDamageFactor || 1.12);
        const segmentIndex = current + 1;
        const healthGrowth = Math.pow(segmentHealthFactor, Math.max(0, segmentIndex - 1));
        let segMaxHealth = Math.max(15, Math.floor(baseHealth * healthGrowth));
        const damageGrowth = Math.pow(segmentDamageFactor, Math.max(0, segmentIndex - 1));
        let damage = Math.max(1, Math.floor(dragon.damage * (dragon.segmentDamageRatio || 0.6) * damageGrowth));
        if (current > 0) {
            const previousSegment = dragon.bodySegments[current - 1];
            const prevMax = Math.max(0, previousSegment?.maxHealth ?? 0);
            const prevDamage = Math.max(0, previousSegment?.damage ?? 0);
            segMaxHealth = Math.max(segMaxHealth, prevMax + 1);
            damage = Math.max(damage, prevDamage + 1);
        }

        // 新段初始位置放在当前尾部附近，随后由路径追踪校正
        let initX = dragon.x;
        let initY = dragon.y;
        if (current > 0) {
            initX = dragon.bodySegments[current - 1].x;
            initY = dragon.bodySegments[current - 1].y;
        } else if (Array.isArray(dragon.bodyPath) && dragon.bodyPath.length > 0) {
            const last = dragon.bodyPath[dragon.bodyPath.length - 1];
            initX = last.x;
            initY = last.y;
        }
        const newSegment = {
            x: initX,
            y: initY,
            radius,
            health: segMaxHealth,
            maxHealth: segMaxHealth,
            hitFlash: 0,
            damage,
            rewardAbility: null,
            rewardBonus: null
        };
        const rewardDef = dragon.rewardSegmentMap?.get(current + 1);
        if (rewardDef) {
            newSegment.rewardAbility = rewardDef.abilityId || null;
            newSegment.rewardBonus = rewardDef.bonus || null;
        }
        dragon.bodySegments.push(newSegment); // 追加到尾部

        // 聚合血量刷新
        this.updateDragonAggregateHealth(dragon);
    }

    /**
     * 渲染子弹
     */
    renderBullets() {
        const bullets = this.gameState.getBullets();
        
        for (const bullet of bullets) {
            this.ctx.save();
            this.ctx.fillStyle = '#FFFF00';
                this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
        }
    }

    /**
     * 渲染粒子
     */
    renderParticles() {
        const particles = this.gameState.particles;
        
        for (const particle of particles) {
            this.ctx.save();
            this.ctx.globalAlpha = particle.life / particle.maxLife;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
    }

    renderEffects() {
        if (!Array.isArray(this.activeEffects) || !this.activeEffects.length) {
            return;
        }

        for (const effect of this.activeEffects) {
            const alpha = Math.max(0, effect.remaining / effect.duration);
            switch (effect.type) {
                case 'lightning': {
                    const from = effect.from || { x: 0, y: 0 };
                    const to = effect.to || { x: 0, y: 0 };
                    this.ctx.save();
                    this.ctx.globalAlpha = alpha;
                    this.ctx.strokeStyle = effect.color || '#FFFFFF';
                    this.ctx.lineWidth = 2 + alpha * 2;
                    this.ctx.beginPath();
                    this.ctx.moveTo(from.x, from.y);
                    this.ctx.lineTo(to.x, to.y);
                    this.ctx.stroke();
                    this.ctx.restore();
                    break;
                }
                default:
                    break;
            }
        }
    }

    /**
     * 渲染伤害数字
     */
    renderDamageNumbers() {
        const damageNumbers = this.gameState.damageNumbers;
        
        for (const dn of damageNumbers) {
            this.ctx.save();
            this.ctx.globalAlpha = dn.alpha;
            this.ctx.fillStyle = dn.color;
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(dn.text, dn.x, dn.y);
            this.ctx.restore();
        }
    }

    /**
     * 渲染HUD
     */
    renderHUD() {
        this.ctx.save();
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'left';
        
        // 基本信息
        this.ctx.fillText(`分数: ${this.gameState.getScore()}`, 10, 25);
        this.ctx.fillText(`波次: ${this.gameState.getWave()}`, 10, 45);
        this.ctx.fillText(`击杀: ${this.gameState.kills}`, 10, 65);
        this.ctx.fillText(`生命: ${this.gameState.lives}`, 10, 85);
        
        // 玩家信息
        const player = this.gameState.player;
        this.ctx.fillText(`生命值: ${player.health}/${player.maxHealth}`, 10, 110);
        this.ctx.fillText(`武器: ${player.weaponElement}`, 10, 130);
        
        this.ctx.restore();

        this.renderAbilityBar();
    }

    renderAbilityBar(statusList = null) {
        if (!this.ctx || !this.abilitySystem) {
            return;
        }

        const abilities = statusList || this.abilitySystem.getAbilityStatus();
        if (!Array.isArray(abilities) || abilities.length === 0) {
        this.abilityHotspots = [];
            return;
        }

        const padding = 12;
        const slotWidth = 68;
        const slotHeight = 68;
        const totalWidth = abilities.length * slotWidth + (abilities.length - 1) * padding;
        const startX = Math.max(padding, this.width - totalWidth - padding);
        const slotY = this.height - slotHeight - padding;

        this.abilityHotspots = [];

        abilities.forEach((ability, index) => {
            const slotX = startX + index * (slotWidth + padding);
            const ready = ability.ready;
            const cooldownRatio = ability.cooldown > 0 ? (ability.remaining / ability.cooldown) : 0;

            this.ctx.save();
            if (typeof this.ctx.fillRect === 'function') {
                this.ctx.fillStyle = ready ? 'rgba(46, 204, 113, 0.85)' : 'rgba(52, 73, 94, 0.8)';
                this.ctx.fillRect(slotX, slotY, slotWidth, slotHeight);
            }

            if (typeof this.ctx.strokeRect === 'function') {
                this.ctx.strokeStyle = '#222';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(slotX, slotY, slotWidth, slotHeight);
            }

            this.ctx.fillStyle = '#fff';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(ability.name, slotX + slotWidth / 2, slotY + slotHeight - 10);

            if (!ready && cooldownRatio > 0) {
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
                this.ctx.fillRect(slotX, slotY, slotWidth, slotHeight * cooldownRatio);
            }

            if (ability.hotkey) {
                this.ctx.fillStyle = '#f1c40f';
                this.ctx.font = 'bold 14px Arial';
                this.ctx.fillText(ability.hotkey, slotX + slotWidth / 2, slotY + 18);
            }

            this.ctx.restore();

            this.abilityHotspots.push({
                id: ability.id,
                x: slotX,
                y: slotY,
                width: slotWidth,
                height: slotHeight,
                status: ability
            });
        });
    }

    /**
     * 渲染菜单
     */
    renderMenu() {
        this.ctx.save();
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '32px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('数字龙猎', this.width/2, this.height/2 - 50);
        
        this.ctx.font = '16px Arial';
        this.ctx.fillText('按空格键开始游戏', this.width/2, this.height/2 + 20);
        this.ctx.fillText('WASD或方向键移动，空格或鼠标攻击', this.width/2, this.height/2 + 50);
        
        this.ctx.restore();
    }

    /**
     * 渲染暂停画面
     */
    renderPauseScreen() {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '32px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('游戏暂停', this.width/2, this.height/2);
        
        this.ctx.font = '16px Arial';
        this.ctx.fillText('按P键继续', this.width/2, this.height/2 + 40);
        
        this.ctx.restore();
    }

    /**
     * 渲染游戏结束画面
     */
    renderGameOverScreen() {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '32px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('游戏结束', this.width/2, this.height/2 - 50);

        this.ctx.font = '20px Arial';
        this.ctx.fillText(`最终分数: ${this.gameState.getScore()}`, this.width/2, this.height/2);
        this.ctx.fillText(`击杀数: ${this.gameState.kills}`, this.width/2, this.height/2 + 30);

        this.ctx.font = '16px Arial';
        this.ctx.fillText('按R键重新开始', this.width/2, this.height/2 + 70);
        
        this.ctx.restore();
    }

    // ==================== 输入处理 ====================

    /**
     * 处理键盘按下
     */
    handleKeyDown(event) {
        this.keys[event.key] = true;
        
        // 处理特殊按键
        switch (event.key) {
            case ' ':
                if (!this.gameState.gameStarted) {
                    this.start();
                }
                event.preventDefault();
                break;
            case 'p':
            case 'P':
                if (this.gameState.gameStarted && !this.gameState.gameOver) {
                    if (this.gameState.isPaused) {
                        this.resume();
                    } else {
                        this.pause();
                    }
                }
                break;
            case 'r':
            case 'R':
                if (this.gameState.gameOver) {
                    this.restart();
                }
                break;
        }
    }

    /**
     * 处理键盘释放
     */
    handleKeyUp(event) {
        this.keys[event.key] = false;
    }

    /**
     * 处理鼠标移动
     */
    handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = event.clientX - rect.left;
        this.mouse.y = event.clientY - rect.top;
    }

    /**
     * 处理鼠标按下
     */
    handleMouseDown(event) {
        const rect = (typeof this.canvas.getBoundingClientRect === 'function')
            ? this.canvas.getBoundingClientRect()
            : { left: 0, top: 0 };
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        this.mouse.x = x;
        this.mouse.y = y;
        this.mouse.isDown = true;

        if (this.tryHandleAbilityClick(x, y)) {
            return;
        }

        if (!this.gameState.gameStarted) {
            this.start();
        }
    }

    tryHandleAbilityClick(x, y) {
        if (!Array.isArray(this.abilityHotspots) || !this.abilityHotspots.length || !this.abilitySystem) {
            return false;
        }

        for (const slot of this.abilityHotspots) {
            if (x >= slot.x && x <= slot.x + slot.width && y >= slot.y && y <= slot.y + slot.height) {
                const abilityId = slot.id;
                this.mouse.isDown = false;

                const context = {
                    player: this.gameState.getPlayer(),
                    target: { x: this.gameState.player.x, y: this.gameState.player.y }
                };

                this.abilitySystem.activate(abilityId, context);
                return true;
            }
        }

        return false;
    }

    /**
     * 处理鼠标释放
     */
    handleMouseUp(event) {
        this.mouse.isDown = false;
    }

    // ==================== 事件处理器 ====================

    onGameStart() {
        console.log('游戏开始事件触发');
        if (this.comboSystem) {
            this.comboSystem.reset('game_start');
        }
        if (this.abilitySystem) {
            this.abilitySystem.reset();
        }
        if (this.resourceSystem && typeof this.resourceSystem.onGameStart === 'function') {
            this.resourceSystem.onGameStart();
        }
    }

    onGamePause() {
        console.log('游戏暂停事件触发');
    }

    onGameResume() {
        console.log('游戏恢复事件触发');
    }

    onGameOver(data) {
        console.log('游戏结束事件触发:', data);
        if (this.comboSystem) {
            this.comboSystem.reset('game_over');
        }
    }

    onDragonDeath(dragon) {
        console.log('龙死亡事件触发:', dragon.element);
    }

    onPlayerDamage(data) {
        console.log('玩家受伤事件触发:', data.damage);
    }

    onAbilityUpgradeLoot(payload) {
        const abilityId = payload?.abilityId || payload?.value || null;
        if (!abilityId) {
            return;
        }
        this.applyAbilityUpgrade(abilityId);
    }

    onShopTokenCollected(payload) {
        if (!this.shopSystem) {
            return;
        }
        const amount = Math.max(0, Math.floor(payload?.amount ?? 0));
        if (amount <= 0) {
            return;
        }
        this.shopSystem.addCurrency(amount);
    }

    onShopUpgradePurchased(payload) {
        if (!this.shopSystem) {
            return;
        }
        this.shopSystem.applyUpgrades(this.gameState);
        this.eventSystem.emit('SHOP_EFFECT_APPLIED', {
            upgradeId: payload?.upgradeId,
            level: payload?.level,
            state: this.shopSystem.getState()
        });
    }

    onRewardBonusLootCollected(payload) {
        const bonus = payload?.bonus || payload?.value || null;
        if (!bonus) {
            return;
        }
        this.applyRewardBonus(bonus);
    }

    onAchievementUnlock(achievementId, achievementData) {
        console.log('成就解锁:', achievementId, achievementData);
    }

    onBulletHit(data) {
        try {
            const { bullet, dragon, damage, effectiveness, hitPart } = data || {};
            const segCount = Array.isArray(dragon?.bodySegments) ? dragon.bodySegments.length : 0;
            console.log(
                `BULLET_HIT part=${hitPart} dmg=${Math.floor(damage)} eff=${effectiveness.toFixed ? effectiveness.toFixed(2) : effectiveness} ` +
                `headDead=${!!dragon.isHeadDead} headHP=${Math.floor(dragon.headHealth || 0)}/${Math.floor(dragon.headMaxHealth || 0)} ` +
                `segments=${segCount}`
            );
        } catch (e) {
            console.warn('BULLET_HIT log error:', e);
        }
    }

    applyAbilityUpgrade(abilityId) {
        const key = this.normalizeAbilityId(abilityId);
        if (!key) {
            return;
        }
        const currentLevel = this.abilityUpgrades[key] ?? 0;
        this.abilityUpgrades[key] = currentLevel + 1;
        this.eventSystem.emit('ABILITY_UPGRADE_APPLIED', {
            abilityId: key,
            level: this.abilityUpgrades[key]
        });
        console.log(`技能强化获得：${key} 等级提升至 ${this.abilityUpgrades[key]}`);
    }

    normalizeAbilityId(abilityId) {
        if (!abilityId) {
            return null;
        }
        const normalized = abilityId.toString().trim().toLowerCase();
        const mapping = {
            'rapid_fire': 'rapid_fire',
            'guardian_shield': 'guardian_shield',
            'guardian_barrier': 'guardian_shield',
            'dragon_slayer': 'dragon_slayer',
            'healing_wave': 'healing_wave',
            'heal': 'healing_wave'
        };
        return mapping[normalized] || null;
    }

    onParticleCreate(payload) {
        if (!payload) {
            return;
        }

        const {
            x = 0,
            y = 0,
            count = 10,
            element = 'normal',
            color
        } = payload;

        const elementInfo = this.elementSystem ? this.elementSystem.getElement(element) : null;
        const particleColor = color || elementInfo?.color || '#FFFFFF';
        const minSpeed = payload.minSpeed ?? 60;
        const maxSpeed = payload.maxSpeed ?? 140;
        const minLife = payload.minLife ?? 0.45;
        const maxLife = payload.maxLife ?? 0.9;

        for (let i = 0; i < Math.max(1, count); i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = minSpeed + Math.random() * (Math.max(minSpeed, maxSpeed) - minSpeed);
            const life = minLife + Math.random() * (Math.max(minLife, maxLife) - minLife);

            const particle = {
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: particleColor,
                size: payload.size ?? (2 + Math.random() * 3),
                life,
                maxLife: life,
                gravity: payload.gravity ?? 20,
                alpha: 1.0
            };

            this.gameState.addParticle(particle);
        }
    }

    onEffectCreate(payload) {
        if (!payload || !payload.type) {
            return;
        }

        const durationSec = Math.max(0.05, (payload.duration ?? 250) / 1000);
        const effectColor = payload.color || (payload.element && this.elementSystem
            ? this.elementSystem.getElement(payload.element)?.glowColor || this.elementSystem.getElement(payload.element)?.color
            : '#FFFFFF');

        this.activeEffects.push({
            ...payload,
            color: effectColor,
            duration: durationSec,
            remaining: durationSec
        });
    }

    onSoundPlay(payload) {
        if (!payload || this.gameState.soundEnabled === false) {
            return;
        }

        const soundEvent = {
            ...payload,
            timestamp: this.gameState.getGameTime()
        };

        this.soundEvents.push(soundEvent);
        if (this.soundEvents.length > 25) {
            this.soundEvents.shift();
        }

        if (typeof Audio === 'function' && payload.src) {
            try {
                const audio = new Audio(payload.src);
                audio.volume = typeof payload.volume === 'number' ? payload.volume : 1;
                audio.play().catch(() => {});
            } catch (error) {
                console.debug('音效播放失败:', error);
            }
        }
    }

    onAbilityCast(payload) {
        if (!payload || !payload.ability) {
            return;
        }

        const { ability, context = {} } = payload;
        switch (ability.id) {
            case 'rapid_fire':
                this.resolveRapidFire(ability, context);
                break;
            case 'guardian_shield':
                this.resolveGuardianShield(ability, context);
                break;
            case 'dragon_slayer':
                this.resolveDragonSlayer(ability, context);
                break;
            case 'healing_wave':
                this.resolveHealingWave(ability, context);
                break;
            default:
                break;
        }
    }

    resolveRapidFire(ability) {
        const level = this.abilityUpgrades.rapid_fire || 0;
        const masteryBonus = this.gameState.permanentUpgrades?.skillMasteryBonus || 0;
        const durationBase = (ability.duration || 0) + level * 0.75;
        const duration = durationBase * (1 + masteryBonus);
        const multiplierBase = Math.max(1, (ability.fireRateMultiplier || 2) + level * 0.5);
        const multiplier = multiplierBase * (1 + masteryBonus);

        this.attackBuff.remaining = duration;
        this.attackBuff.multiplier = multiplier;

        this.eventSystem.emit('ABILITY_EFFECT_APPLIED', {
            abilityId: ability.id,
            multiplier,
            duration
        });
    }

    resolveGuardianShield(ability) {
        const player = this.gameState.getPlayer();
        if (!player) {
                return;
            }

        const level = this.abilityUpgrades.guardian_shield || 0;
        const masteryBonus = this.gameState.permanentUpgrades?.skillMasteryBonus || 0;
        const shieldBase = (ability.shieldAmount || 0) + level * 60;
        const shieldValue = Math.round(shieldBase * (1 + masteryBonus));
        const durationBase = (ability.duration || 0) + level * 0.6;
        const duration = durationBase * (1 + masteryBonus);

        this.gameState.setPlayer({
            shield: {
                value: shieldValue,
                maxValue: shieldValue,
                remaining: duration
            },
            invulnerableTimer: Math.max(player.invulnerableTimer || 0, 0.6)
        });

        this.eventSystem.emit('ABILITY_EFFECT_APPLIED', {
            abilityId: ability.id,
            shield: { value: shieldValue, duration }
        });

        this.eventSystem.emit('PARTICLE_CREATE', {
            x: player.x,
            y: player.y,
            element: 'stone',
            count: 18,
            maxSpeed: 120,
            minSpeed: 40
        });
    }

    resolveDragonSlayer(ability) {
        const level = this.abilityUpgrades.dragon_slayer || 0;
        const masteryBonus = this.gameState.permanentUpgrades?.skillMasteryBonus || 0;
        const reductionBase = (ability.reductionPercent || 0.5) + level * 0.1;
        const reduction = Math.min(0.9, reductionBase * (1 + masteryBonus));

        const dragons = this.gameState.getDragons();
        dragons.forEach(dragon => {
            if (!dragon || dragon._markedForRemoval) {
                return;
            }

            const headDamage = Math.ceil((dragon.headHealth || 0) * reduction);
            if (headDamage > 0) {
                this.applyDamageToHead(dragon, headDamage, null, 1);
            }

            if (Array.isArray(dragon.bodySegments)) {
                for (const segment of dragon.bodySegments) {
                    if (!segment) continue;
                    const segmentDamage = Math.ceil((segment.health || 0) * reduction);
                    segment.health = Math.max(1, (segment.health || 0) - segmentDamage);
                    segment.maxHealth = Math.max(segment.maxHealth || segment.health, segment.health);
                }
                this.updateDragonAggregateHealth(dragon);
            }
        });

        this.eventSystem.emit('ABILITY_EFFECT_APPLIED', {
            abilityId: ability.id,
            reduction
        });
    }

    resolveHealingWave(ability) {
        const player = this.gameState.getPlayer();
        if (!player) {
                return;
            }

        const level = this.abilityUpgrades.healing_wave || 0;
        const masteryBonus = this.gameState.permanentUpgrades?.skillMasteryBonus || 0;
        const healBase = (ability.healAmount || 30) + level * 12;
        const healAmount = Math.round(healBase * (1 + masteryBonus));
        player.health = Math.min(player.maxHealth || 100, (player.health || 0) + healAmount);

        this.gameState.notifyChange('player', player);

        this.eventSystem.emit('ABILITY_EFFECT_APPLIED', {
            abilityId: ability.id,
            heal: healAmount,
            newHealth: player.health
        });
    }

    applyAreaDamageToDragon(dragon, baseDamage, options = {}) {
        if (!dragon || !baseDamage) {
            return 0;
        }

        const { center = { x: dragon.x, y: dragon.y }, radius = 0, falloff = 0, targetPart = 'head' } = options;

        let targetPoint;
        let currentHealth;

        if (targetPart === 'head') {
            targetPoint = { x: dragon.x, y: dragon.y, radius: dragon.radius || 0 };
            currentHealth = dragon.headHealth || 0;
        } else if (targetPart && typeof targetPart === 'object') {
            targetPoint = targetPart;
            currentHealth = targetPart.health || 0;
        } else {
            return 0;
        }

        const distance = Math.hypot((targetPoint.x || 0) - center.x, (targetPoint.y || 0) - center.y);
        if (distance > radius + (targetPoint.radius || 0)) {
            return 0;
        }

        const normalized = radius > 0 ? Math.min(1, distance / radius) : 0;
        const falloffFactor = Math.max(0.1, 1 - falloff * normalized);
        const rawDamage = Math.max(1, Math.round(baseDamage * falloffFactor));
        const inflicted = Math.min(currentHealth, rawDamage);

        if (targetPart === 'head') {
            dragon.headHealth = Math.max(0, (dragon.headHealth || 0) - rawDamage);
            if (dragon.headHealth <= 0) {
                dragon.headHealth = 0;
                dragon.isHeadDead = true;
            }
        } else if (targetPart && typeof targetPart === 'object') {
            targetPart.health = Math.max(0, (targetPart.health || 0) - rawDamage);
            targetPart.hitFlash = 0.2;
            if (targetPart.health <= 0) {
                const index = Array.isArray(dragon.bodySegments) ? dragon.bodySegments.indexOf(targetPart) : -1;
                const rewardAbility = targetPart.rewardAbility;
                const rewardBonus = targetPart.rewardBonus;
                if (index !== -1) {
                    dragon.bodySegments.splice(index, 1);
                }
                this.createDeathEffect({ x: targetPoint.x, y: targetPoint.y, element: dragon.element });
                if (rewardAbility) {
                    this.spawnAbilityUpgradeLoot(rewardAbility, targetPoint);
                    targetPart.rewardAbility = null;
                }
                if (rewardBonus) {
                    this.spawnRewardBonusLoot(rewardBonus, targetPoint);
                    targetPart.rewardBonus = null;
                }
            }
        }

        if (inflicted > 0) {
            this.addDamageNumber(targetPoint.x, targetPoint.y, Math.floor(inflicted), 1.0);
        }

        this.updateDragonAggregateHealth(dragon);

        if (dragon.isHeadDead && (!Array.isArray(dragon.bodySegments) || dragon.bodySegments.length === 0) && !dragon._markedForRemoval) {
            dragon._markedForRemoval = true;
            this.handleDragonDeath(dragon);
        }

        return inflicted;
    }

    applyDamageToFrontSegments(dragon, damage, bullet) {
        if (!Array.isArray(dragon.bodySegments) || dragon.bodySegments.length === 0) {
            return 0;
        }

        let remaining = damage;
        let applied = 0;

        while (remaining > 0 && Array.isArray(dragon.bodySegments) && dragon.bodySegments.length > 0) {
            const segment = dragon.bodySegments[0];
            const before = segment.health || 0;
            if (before <= 0) {
                dragon.bodySegments.splice(0, 1);
                continue;
            }

            const inflicted = Math.min(before, remaining);
            segment.health = Math.max(0, before - inflicted);
            segment.hitFlash = Math.max(segment.hitFlash || 0, 0.15);

            this.addDamageNumber(segment.x, segment.y, Math.floor(inflicted), 1.0);

            if (bullet && bullet.element && bullet.element !== 'normal') {
                this.elementSystem.applyElementEffect(segment, bullet.element, 1.0, bullet.source);
            }

            applied += inflicted;
            remaining -= inflicted;

            if (segment.health <= 0) {
                this.createDeathEffect({ x: segment.x, y: segment.y, element: dragon.element });
                if (segment.rewardAbility) {
                    this.spawnAbilityUpgradeLoot(segment.rewardAbility, segment);
                }
                if (segment.rewardBonus) {
                    this.spawnRewardBonusLoot(segment.rewardBonus, segment);
                    segment.rewardBonus = null;
                }
                dragon.bodySegments.splice(0, 1);
            } else {
                // Segment survived; exit loop because bullet stops here
                break;
            }
        }

        this.updateDragonAggregateHealth(dragon);
        return applied;
    }

    applyRewardBonus(bonus) {
        if (!bonus || typeof bonus !== 'object') {
            return;
        }

        const type = String(bonus.type || '').toLowerCase();
        if (!type) {
            return;
        }

        const value = Number(bonus.value ?? 0);
        if (!Number.isFinite(value)) {
            console.warn('无效的奖励加成数值:', bonus);
            return;
        }

        const player = typeof this.gameState?.getPlayer === 'function'
            ? this.gameState.getPlayer()
            : this.gameState.player;
        const currentPermanent = this.gameState.permanentUpgrades || {};
        const updatedPermanent = { ...currentPermanent };
        let permanentChanged = false;
        let applied = false;
        const attributeMultiplier = this.getDifficultyRewardMultiplier('attribute');
        const tokenMultiplier = this.getDifficultyRewardMultiplier('token');

        switch (type) {
            case 'attack': {
                const amount = Math.max(0, Math.round(value * attributeMultiplier));
                if (amount > 0 && player) {
                    const newDamage = (player.damage || 0) + amount;
                    this.gameState.setPlayer({ damage: newDamage });
                    updatedPermanent.attackBonusFromRewards = (updatedPermanent.attackBonusFromRewards || 0) + amount;
                    permanentChanged = true;
                    applied = true;
                }
                break;
            }
            case 'fire_rate': {
                const amount = Math.max(0, value * attributeMultiplier);
                if (amount > 0) {
                    updatedPermanent.attackSpeedBonus = (updatedPermanent.attackSpeedBonus || 0) + amount;
                    permanentChanged = true;
                    applied = true;
                }
                break;
            }
            case 'speed': {
                const amount = Math.max(0, value * attributeMultiplier);
                if (amount > 0 && player) {
                    const newSpeed = Math.max(60, (player.speed || 0) + amount);
                    this.gameState.setPlayer({ speed: newSpeed });
                    updatedPermanent.movementBonus = (updatedPermanent.movementBonus || 0) + amount;
                    permanentChanged = true;
                    applied = true;
                }
                break;
            }
            case 'token': {
                const amount = Math.max(0, Math.round(value * tokenMultiplier));
                if (amount > 0) {
                    if (this.shopSystem && typeof this.shopSystem.addCurrency === 'function') {
                        this.shopSystem.addCurrency(amount);
                        applied = true;
                    } else {
                        console.warn('无法应用代币奖励：商店系统不可用');
                    }
                }
                break;
            }
            case 'mana': {
                const amount = Math.max(0, value * attributeMultiplier);
                if (amount > 0 && player) {
                    const newMaxMana = Math.max(0, (player.maxMana || 0) + amount);
                    const newMana = Math.min(newMaxMana, (player.mana || 0) + amount);
                    this.gameState.setPlayer({ maxMana: newMaxMana, mana: newMana });
                    updatedPermanent.manaBonus = (updatedPermanent.manaBonus || 0) + amount;
                    permanentChanged = true;
                    applied = true;
                }
                break;
            }
            default:
                console.warn('未知的奖励加成类型:', bonus);
                break;
        }

        if (permanentChanged) {
            this.gameState.permanentUpgrades = {
                ...this.gameState.permanentUpgrades,
                ...updatedPermanent
            };
        }

        if (applied && this.eventSystem) {
            this.eventSystem.emit('REWARD_BONUS_APPLIED', {
                type,
                value,
                bonus
            });
        }
    }

    applyDamageToHead(dragon, damage, bullet, effectiveness = 1) {
        if (!dragon || damage <= 0 || dragon._markedForRemoval) {
            return damage;
        }

        const currentHealth = Math.max(0, dragon.headHealth || 0);
        if (currentHealth <= 0) {
            dragon.isHeadDead = true;
            return damage;
        }

        const inflicted = Math.min(currentHealth, damage);
        dragon.headHealth = currentHealth - inflicted;
        this.addDamageNumber(dragon.x, dragon.y, Math.floor(inflicted), effectiveness);
        if (bullet && bullet.element !== 'normal') {
            this.elementSystem.applyElementEffect(dragon, bullet.element, 1.0, bullet.source);
        }
        this.updateDragonAggregateHealth(dragon);

        if (dragon.headHealth <= 0) {
            dragon.isHeadDead = true;
            const leftover = damage - inflicted;
            if (dragon.headRewardAbility) {
                this.spawnAbilityUpgradeLoot(dragon.headRewardAbility, { x: dragon.x, y: dragon.y });
                dragon.headRewardAbility = null;
            }
            dragon.headHealth = 0;
            dragon.headMaxHealth = 0;
            if (leftover > 0 && Array.isArray(dragon.bodySegments) && dragon.bodySegments.length > 0) {
                this.applyDamageToFrontSegments(dragon, leftover, bullet);
            }
            if (!Array.isArray(dragon.bodySegments) || dragon.bodySegments.length === 0) {
                this.handleDragonDeath(dragon);
            }
            return 0;
        }

        dragon.isHeadDead = false;
        return damage - inflicted;
    }

    
    // ==================== 石龙强化段 ====================

    spawnStoneEnhancementSegment(dragon) {
        const elementType = dragon ? (dragon.element || dragon.type) : null;
        if (!dragon || elementType !== 'stone') {
            return null;
        }

        dragon.element = elementType;

        if (!Array.isArray(dragon.enhancementSegments)) {
            dragon.enhancementSegments = [];
        }

        const maxSegments = typeof dragon.maxEnhancementSegments === 'number'
            ? dragon.maxEnhancementSegments
            : 12;
        dragon.maxEnhancementSegments = maxSegments;
        if (dragon.enhancementSegments.length >= maxSegments) {
            return null;
        }

        const index = dragon.enhancementSegments.length;
        const baseHealth = 120 + index * 15;
        const radius = Math.max(10, Math.round((dragon.radius || 30) * 0.28));
        const angleStep = (Math.PI * 2) / Math.max(1, maxSegments);

        const segment = {
            id: 'stone-enh-' + Date.now() + '-' + Math.floor(Math.random() * 1e6),
            type: 'stone',
            health: baseHealth,
            maxHealth: baseHealth,
            damageBonus: 6 + index * 2,
            maxHealthBonus: 60 + index * 20,
            radius,
            color: '#9C8C6A',
            glowColor: '#D9C9A4',
            isEnhancementSegment: true,
            active: true,
            angleOffset: index * angleStep,
            createdAt: this.gameState.getGameTime ? this.gameState.getGameTime() : 0
        };

        dragon.enhancementSegments.push(segment);

        return segment;
    }

    handleEnhancementSegmentDestroyed(dragon, segment) {
        if (!dragon || !segment || !Array.isArray(dragon.enhancementSegments)) {
            return;
        }

        const index = dragon.enhancementSegments.indexOf(segment);
        if (index === -1) {
            return;
        }

        dragon.enhancementSegments.splice(index, 1);
        segment.active = false;

        const total = dragon.enhancementSegments.length;
        if (total > 0) {
            const step = (Math.PI * 2) / total;
            dragon.enhancementSegments.forEach((seg, idx) => {
                seg.angleOffset = idx * step;
            });
        }

        this.eventSystem.emit('ENHANCEMENT_SEGMENT_DESTROYED', {
            dragon,
            segment
        });
    }

    // ==================== 公共接口 ====================

    /**
     * 获取游戏状态
     */
    getState() {
        return this.gameState.getSnapshot();
    }

    /**
     * 设置游戏状态
     */
    setState(state) {
        this.gameState.restoreFromSnapshot(state);
    }

    /**
     * 获取统计数据
     */
    getStatistics() {
        return this.gameState.getStatistics();
    }
}

// 导出模块
if (isNodeEnvironment) {
    module.exports = GameController;
}
if (global && !global.GameController) {
    global.GameController = GameController;
}

})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));
