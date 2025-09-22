/**
 * 游戏主控制器
 * 负责协调所有游戏系统和管理游戏生命周期
 */
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
        
        // 绑定事件处理器
        this.setupEventHandlers();
        
        // 设置输入监听
        this.setupInputListeners();
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
        this.elementSystem = new ElementSystem(this.eventSystem, this.gameState);
        
        // 其他系统将在需要时初始化
        this.systems = {
            element: this.elementSystem,
            // 其他系统会在后续添加
        };

        console.log('游戏系统初始化完成');
    }

    /**
     * 加载配置文件
     */
    loadConfigurations() {
        try {
            // 尝试加载各种配置
            if (typeof ElementConfig !== 'undefined') {
                window.ElementConfig = ElementConfig;
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
        
        // 系统事件
        this.eventSystem.on('ACHIEVEMENT_UNLOCK', this.onAchievementUnlock.bind(this));
    }

    /**
     * 设置输入监听器
     */
    setupInputListeners() {
        if (typeof document !== 'undefined') {
            // 键盘事件
            document.addEventListener('keydown', this.handleKeyDown.bind(this));
            document.addEventListener('keyup', this.handleKeyUp.bind(this));
            
            // 鼠标事件
            this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
            this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
            this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
            
            // 防止右键菜单
            this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        }
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

        // 生成第一只龙
        this.spawnInitialDragon();
        
        console.log('游戏初始化完成');
    }

    /**
     * 生成初始龙
     */
    spawnInitialDragon() {
        const dragonType = this.elementSystem.getRandomElement(1);
        const dragon = this.createDragon(dragonType);
        this.gameState.addDragon(dragon);
        
        console.log(`生成了${dragonType}龙`);
    }

    /**
     * 创建龙对象
     */
    createDragon(type) {
        const element = this.elementSystem.getElement(type);
        const wave = this.gameState.getWave();
        
        return {
            id: Date.now() + Math.random(),
            type: type,
            element: type,
            x: Math.random() * this.width,
            y: Math.random() * this.height,
            radius: 25,
            health: Math.floor(element.baseHealth * Math.pow(element.healthMultiplier, wave - 1)),
            maxHealth: Math.floor(element.baseHealth * Math.pow(element.healthMultiplier, wave - 1)),
            damage: Math.floor(15 * element.damageMultiplier),
            speed: 30 * element.speedMultiplier,
            color: element.color,
            glowColor: element.glowColor,
            specialAbility: element.specialAbility,
            lastAbilityUse: 0,
            abilityTimer: 0,
            segments: [{
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                attackCooldown: 0,
                segmentIndex: 0,
                damage: Math.floor(15 * element.damageMultiplier)
            }],
            totalSegments: 1,
            segmentIndex: 0
        };
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
        
        // 更新其他系统...
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
        
        // 更新伤害数字
        this.updateDamageNumbers(deltaTime);
    }

    /**
     * 更新玩家
     */
    updatePlayer(player, deltaTime) {
        // 移动处理
        const moveSpeed = player.speed * deltaTime;
        
        if (this.keys['ArrowLeft'] || this.keys['a']) {
            player.x = Math.max(player.radius, player.x - moveSpeed);
        }
        if (this.keys['ArrowRight'] || this.keys['d']) {
            player.x = Math.min(this.width - player.radius, player.x + moveSpeed);
        }
        if (this.keys['ArrowUp'] || this.keys['w']) {
            player.y = Math.max(player.radius, player.y - moveSpeed);
        }
        if (this.keys['ArrowDown'] || this.keys['s']) {
            player.y = Math.min(this.height - player.radius, player.y + moveSpeed);
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
        if (!player.lastAttackTime || currentTime - player.lastAttackTime >= 250) {
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

    /**
     * 创建子弹
     */
    createBullet(source, target) {
        const angle = Math.atan2(target.y - source.y, target.x - source.x);
        const bullet = {
            id: Date.now() + Math.random(),
            x: source.x,
            y: source.y,
            vx: Math.cos(angle) * 400,
            vy: Math.sin(angle) * 400,
            damage: source.damage,
            element: source.weaponElement || 'normal',
            radius: 3,
            life: 2.0, // 2秒后消失
            source: source,
            target: target
        };
        
        this.gameState.addBullet(bullet);
        
        this.eventSystem.emit('BULLET_FIRE', bullet);
    }

    /**
     * 更新龙
     */
    updateDragon(dragon, deltaTime) {
        // 简单的AI：朝玩家移动
        const player = this.gameState.player;
        const dx = player.x - dragon.x;
        const dy = player.y - dragon.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const moveSpeed = dragon.speed * deltaTime;
            dragon.x += (dx / distance) * moveSpeed;
            dragon.y += (dy / distance) * moveSpeed;
        }
        
        // 边界检查
        dragon.x = Math.max(dragon.radius, Math.min(this.width - dragon.radius, dragon.x));
        dragon.y = Math.max(dragon.radius, Math.min(this.height - dragon.radius, dragon.y));
        
        // 更新特殊能力计时器
        if (dragon.abilityTimer > 0) {
            dragon.abilityTimer -= deltaTime * 1000;
        }
        
        // 使用特殊能力
        this.updateDragonAbilities(dragon);
    }

    /**
     * 更新龙的特殊能力
     */
    updateDragonAbilities(dragon) {
        const currentTime = Date.now();
        const cooldown = 5000; // 5秒冷却
        
        if (!dragon.lastAbilityUse || currentTime - dragon.lastAbilityUse >= cooldown) {
            if (dragon.specialAbility && dragon.specialAbility !== 'none') {
                this.elementSystem.applyElementEffect(
                    this.gameState.player, 
                    dragon.element, 
                    1.0, 
                    dragon
                );
                dragon.lastAbilityUse = currentTime;
            }
        }
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

    /**
     * 处理碰撞检测
     */
    handleCollisions() {
        this.checkBulletDragonCollisions();
        this.checkPlayerDragonCollisions();
    }

    /**
     * 检查子弹与龙的碰撞
     */
    checkBulletDragonCollisions() {
        const bullets = this.gameState.getBullets();
        const dragons = this.gameState.getDragons();
        
        for (const bullet of bullets) {
            for (const dragon of dragons) {
                const distance = Math.sqrt(
                    Math.pow(bullet.x - dragon.x, 2) + 
                    Math.pow(bullet.y - dragon.y, 2)
                );
                
                if (distance <= bullet.radius + dragon.radius) {
                    this.handleBulletHit(bullet, dragon);
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
        // 计算伤害
        const effectiveness = this.elementSystem.getEffectiveness(bullet.element, dragon.element);
        const finalDamage = bullet.damage * effectiveness;
        
        // 应用伤害
        dragon.health -= finalDamage;
        
        // 创建伤害数字
        this.addDamageNumber(dragon.x, dragon.y, Math.floor(finalDamage), effectiveness);
        
        // 应用元素效果
        if (bullet.element !== 'normal') {
            this.elementSystem.applyElementEffect(dragon, bullet.element, 1.0, bullet.source);
        }
        
        // 触发事件
        this.eventSystem.emit('BULLET_HIT', { bullet, dragon, damage: finalDamage, effectiveness });
        
        // 检查龙是否死亡
        if (dragon.health <= 0) {
            this.handleDragonDeath(dragon);
        }
    }

    /**
     * 处理龙死亡
     */
    handleDragonDeath(dragon) {
        // 记录击杀
        this.gameState.recordKill(dragon.element);
        
        // 增加分数
        const baseScore = 100;
        const waveBonus = this.gameState.getWave() * 10;
        const elementBonus = this.getElementBonus(dragon.element);
        const totalScore = baseScore + waveBonus + elementBonus;
        
        this.gameState.updateScore(totalScore);
        
        // 创建死亡粒子效果
        this.createDeathEffect(dragon);
        
        // 移除龙
        this.gameState.removeDragon(dragon);
        
        // 生成新龙
        this.spawnNewDragon();
        
        // 触发事件
        this.eventSystem.emit('DRAGON_DEATH', dragon);
        
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
        const wave = this.gameState.getWave();
        const dragonType = this.elementSystem.getRandomElement(wave);
        const dragon = this.createDragon(dragonType);
        
        // 设置生成位置（远离玩家）
        const player = this.gameState.player;
        do {
            dragon.x = Math.random() * this.width;
            dragon.y = Math.random() * this.height;
        } while (Math.sqrt(Math.pow(dragon.x - player.x, 2) + Math.pow(dragon.y - player.y, 2)) < 200);
        
        this.gameState.addDragon(dragon);
        
        this.eventSystem.emit('DRAGON_SPAWN', dragon);
    }

    /**
     * 检查玩家与龙的碰撞
     */
    checkPlayerDragonCollisions() {
        const player = this.gameState.player;
        const dragons = this.gameState.getDragons();
        
        for (const dragon of dragons) {
            const distance = Math.sqrt(
                Math.pow(player.x - dragon.x, 2) + 
                Math.pow(player.y - dragon.y, 2)
            );
            
            if (distance <= player.radius + dragon.radius) {
                this.handlePlayerDragonCollision(player, dragon);
            }
        }
    }

    /**
     * 处理玩家与龙的碰撞
     */
    handlePlayerDragonCollision(player, dragon) {
        const currentTime = Date.now();
        if (!dragon.lastPlayerHit || currentTime - dragon.lastPlayerHit >= 1000) {
            const damage = dragon.damage;
            player.health -= damage;
            
            this.addDamageNumber(player.x, player.y - 30, damage, 1.0, true);
            
            dragon.lastPlayerHit = currentTime;
            
            this.eventSystem.emit('PLAYER_DAMAGE', { player, dragon, damage });
            
            if (player.health <= 0) {
                this.handlePlayerDeath();
            }
        }
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
            this.gameState.setPlayer({
                health: this.gameState.player.maxHealth,
                x: this.width / 2,
                y: this.height / 2
            });
        }
    }

    /**
     * 处理游戏结束
     */
    handleGameOver() {
        console.log('游戏结束');
        this.gameState.setGameState('over', true);
        this.eventSystem.emit('GAME_OVER', {
            score: this.gameState.getScore(),
            wave: this.gameState.getWave(),
            kills: this.gameState.kills
        });
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
        this.renderPlayer();
        this.renderDragons();
        this.renderBullets();
        this.renderParticles();
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

    /**
     * 渲染龙
     */
    renderDragons() {
        const dragons = this.gameState.getDragons();
        
        for (const dragon of dragons) {
            this.ctx.save();
            
            // 渲染龙身体
            this.ctx.fillStyle = dragon.color;
            this.ctx.shadowColor = dragon.glowColor;
            this.ctx.shadowBlur = 10;
            this.ctx.beginPath();
            this.ctx.arc(dragon.x, dragon.y, dragon.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 渲染生命条
            this.renderEntityHealthBar(dragon, dragon.x, dragon.y - dragon.radius - 10);
            
            this.ctx.restore();
        }
    }

    /**
     * 渲染实体生命条
     */
    renderEntityHealthBar(entity, x, y) {
        const barWidth = 40;
        const barHeight = 4;
        const healthPercent = entity.health / entity.maxHealth;
        
        // 背景
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(x - barWidth/2, y, barWidth, barHeight);
        
        // 生命条
        this.ctx.fillStyle = healthPercent > 0.6 ? '#00FF00' : 
                            healthPercent > 0.3 ? '#FFFF00' : '#FF0000';
        this.ctx.fillRect(x - barWidth/2, y, barWidth * healthPercent, barHeight);
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
        this.mouse.isDown = true;
        
        if (!this.gameState.gameStarted) {
            this.start();
        }
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
    }

    onGamePause() {
        console.log('游戏暂停事件触发');
    }

    onGameResume() {
        console.log('游戏恢复事件触发');
    }

    onGameOver(data) {
        console.log('游戏结束事件触发:', data);
    }

    onDragonDeath(dragon) {
        console.log('龙死亡事件触发:', dragon.element);
    }

    onPlayerDamage(data) {
        console.log('玩家受伤事件触发:', data.damage);
    }

    onAchievementUnlock(achievementId, achievementData) {
        console.log('成就解锁:', achievementId, achievementData);
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
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameController;
}
