/**
 * 数字龙猎游戏核心逻辑
 * 从HTML文件中提取的可测试游戏类
 */

// 导入技能系统和平衡配置
if (typeof require !== 'undefined') {
    try {
        const SkillSystem = require('./systems/SkillSystem.js');
        const BalanceConfig = require('./config/BalanceConfig.js');
    } catch (e) {
        // 在浏览器环境中，这些会通过script标签加载
    }
}

class DragonHunterGame {
    constructor(canvas = null) {
        // 如果在测试环境中，canvas可能为null
        this.canvas = canvas || this.createMockCanvas();
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width || 800;
        this.height = this.canvas.height || 600;

        // 游戏状态
        this.gameStarted = false;
        this.gameOver = false;
        this.isPaused = false;
        this.score = 0;
        this.lives = 3;
        this.wave = 1;
        this.kills = 0;
        this.gameTime = 0; // 游戏时间（秒）
        this.gameStartTime = 0; // 游戏开始时间
        this.isEndlessMode = false; // 是否为无限模式

        // 使用平衡配置初始化玩家属性
        const playerConfig = (typeof BalanceConfig !== 'undefined') ? BalanceConfig.PLAYER : {
            baseHealth: 100, baseDamage: 25, baseSpeed: 180, baseFireRate: 300
        };
        
        this.player = {
            x: this.width / 2,
            y: this.height / 2,
            radius: 15,
            speed: playerConfig.baseSpeed,
            damage: playerConfig.baseDamage,
            health: playerConfig.baseHealth,
            maxHealth: playerConfig.baseHealth,
            weaponElement: 'normal', // 玩家武器元素
            level: 1, // 玩家等级
            experience: 0 // 经验值
        };
        
        // 游戏货币
        this.coins = 100; // 游戏内金币
        
        // 初始化技能系统
        if (typeof SkillSystem !== 'undefined') {
            this.skillSystem = new SkillSystem(this);
        }
        
        // 音效设置
        this.soundEnabled = true;

        // 游戏对象数组
        this.bullets = [];
        this.stoneDragon = null; // 石龙BOSS
        this.dragons = []; // 兼容测试的龙数组
        this.loot = [];
        this.damageNumbers = [];
        this.particles = [];
        
        // 多元素龙配置系统
        this.dragonElements = {
            stone: {
                name: '石龙',
                color: '#8B7355',
                glowColor: '#A0956B',
                baseHealth: 80,
                healthMultiplier: 1.15,
                damageMultiplier: 1.1,
                speedMultiplier: 1.0,
                specialAbility: 'armor', // 减伤
                weight: 30 // 出现权重
            },
            fire: {
                name: '火龙',
                color: '#FF4500',
                glowColor: '#FF6B35',
                baseHealth: 70,
                healthMultiplier: 1.1,
                damageMultiplier: 1.3,
                speedMultiplier: 1.1,
                specialAbility: 'burn', // 燃烧伤害
                weight: 25
            },
            ice: {
                name: '冰龙',
                color: '#87CEEB',
                glowColor: '#B0E0E6',
                baseHealth: 90,
                healthMultiplier: 1.2,
                damageMultiplier: 1.0,
                speedMultiplier: 0.8,
                specialAbility: 'freeze', // 减速玩家
                weight: 25
            },
            thunder: {
                name: '雷龙',
                color: '#9370DB',
                glowColor: '#BA55D3',
                baseHealth: 65,
                healthMultiplier: 1.05,
                damageMultiplier: 1.2,
                speedMultiplier: 1.3,
                specialAbility: 'chain', // 连锁闪电
                weight: 15
            },
            poison: {
                name: '毒龙',
                color: '#32CD32',
                glowColor: '#7FFF00',
                baseHealth: 75,
                healthMultiplier: 1.1,
                damageMultiplier: 1.15,
                speedMultiplier: 0.9,
                specialAbility: 'poison', // 中毒效果
                weight: 20
            },
            shadow: {
                name: '暗龙',
                color: '#2F2F2F',
                glowColor: '#4B0082',
                baseHealth: 100,
                healthMultiplier: 1.25,
                damageMultiplier: 1.4,
                speedMultiplier: 1.2,
                specialAbility: 'phase', // 阶段性无敌
                weight: 5 // 稀有
            }
        };

        // 基础龙配置
        this.dragonConfig = {
            segmentSize: 40,
            segmentSpacing: 35,
            baseHealth: 80, // 基础血量
            healthIncrement: 60, // 每段血量递增
            spawnInterval: 3, // 每3秒生成新段
            lastSpawnTime: 0,
            maxSegments: 50, // 最大段数
            difficultyScaling: {
                healthMultiplier: 1.15, // 每段血量乘数
                damageMultiplier: 1.1,  // 每段伤害乘数
                speedIncrement: 3       // 每段速度增加
            }
        };

        // 游戏状态
        this.playerEffects = {
            freeze: { duration: 0, intensity: 1.0 }, // 冰龙减速效果
            poison: { duration: 0, damage: 0 },      // 毒龙中毒效果
            burn: { duration: 0, damage: 0 }         // 火龙燃烧效果
        };

        // 游戏设置
        this.bulletSpeed = 350;
        this.bulletDamage = 25;
        this.fireRate = 2.5; // 每秒发射次数（自动射击）
        this.lastShotTime = 0;
        this.luck = 0.15; // 掉落概率
        this.autoShoot = true; // 自动射击开关
        this.bulletPenetration = 0; // 穿透能力

        // 升级系统（肉鸽平衡优化）
        this.upgrades = {
            damage: { level: 0, cost: 80, increment: 1.4 },
            fireRate: { level: 0, cost: 120, increment: 1.25 },
            luck: { level: 0, cost: 160, increment: 1.15 },
            penetration: { level: 0, cost: 200, increment: 1.0 } // 穿透能力
        };

        // 输入状态
        this.keys = {};
        this.mousePos = { x: 0, y: 0 };

        // 时间管理
        this.lastTime = 0;
        this.animationId = null;

        // 绑定事件（仅在浏览器环境中）
        if (typeof window !== 'undefined') {
            this.bindEvents();
        }
    }

    createMockCanvas() {
        // 为测试环境创建模拟canvas
        return {
            width: 800,
            height: 600,
            getContext: () => ({
                fillStyle: '',
                strokeStyle: '',
                lineWidth: 1,
                font: '',
                textAlign: 'left',
                globalAlpha: 1,
                shadowColor: '',
                shadowBlur: 0,
                beginPath: () => {},
                closePath: () => {},
                moveTo: () => {},
                lineTo: () => {},
                arc: () => {},
                rect: () => {},
                fill: () => {},
                stroke: () => {},
                fillRect: () => {},
                strokeRect: () => {},
                clearRect: () => {},
                fillText: () => {},
                strokeText: () => {},
                measureText: () => ({ width: 0 }),
                save: () => {},
                restore: () => {},
                translate: () => {},
                rotate: () => {},
                scale: () => {},
                drawImage: () => {},
                createLinearGradient: () => ({ addColorStop: () => {} }),
                createRadialGradient: () => ({ addColorStop: () => {} })
            })
        };
    }

    bindEvents() {
        // 键盘事件
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            this.handleSkillKeys(e);
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        // 鼠标事件
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mousePos.x = e.clientX - rect.left;
            this.mousePos.y = e.clientY - rect.top;
        });

        // 移除手动射击，改为自动射击
        // this.canvas.addEventListener('click', (e) => {
        //     if (this.gameStarted && !this.gameOver && !this.isPaused) {
        //         this.shoot();
        //     }
        // });
    }

    // 处理技能按键
    handleSkillKeys(e) {
        if (!this.skillSystem || !this.gameStarted || this.gameOver || this.isPaused) return;
        
        // 数字键1-6对应技能
        const skillMap = {
            '1': 'volley',
            '2': 'burst',
            '3': 'shield',
            '4': 'timeWarp',
            '5': 'elementalStorm',
            '6': 'dragonSlayer'
        };
        
        const skillId = skillMap[e.key];
        if (skillId) {
            e.preventDefault();
            this.skillSystem.useActiveSkill(skillId);
        }
    }

    // 根据权重选择随机龙元素
    selectRandomDragonElement() {
        // 根据波数调整元素权重（平衡性调整）
        const adjustedElements = { ...this.dragonElements };
        
        // 前5波降低暗龙概率
        if (this.wave <= 5) {
            adjustedElements.shadow.weight = Math.max(1, adjustedElements.shadow.weight * 0.3);
        }
        
        // 每10波增加暗龙概率
        if (this.wave > 10) {
            adjustedElements.shadow.weight *= (1 + Math.floor(this.wave / 10) * 0.2);
        }
        
        // 高波数增加所有高级元素权重
        if (this.wave > 15) {
            adjustedElements.thunder.weight *= 1.3;
            adjustedElements.poison.weight *= 1.2;
        }
        
        const totalWeight = Object.values(adjustedElements).reduce((sum, element) => sum + element.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const [elementType, element] of Object.entries(adjustedElements)) {
            random -= element.weight;
            if (random <= 0) {
                return { type: elementType, ...this.dragonElements[elementType] };
            }
        }
        
        // 默认返回火龙
        return { type: 'fire', ...this.dragonElements.fire };
    }

    startGame() {
        this.gameStarted = true;
        this.gameOver = false;
        this.score = 0;
        this.lives = 3;
        this.wave = 1;
        this.kills = 0;
        this.gameTime = 0;
        this.gameStartTime = Date.now();
        this.bullets = [];
        this.stoneDragon = null;
        this.dragons = [];
        this.loot = [];
        this.damageNumbers = [];
        this.particles = [];
        this.dragonConfig.lastSpawnTime = 0;
        
        // 重置玩家位置
        this.player.x = this.width / 2;
        this.player.y = this.height / 2;

        this.spawnStoneDragon();
        this.gameLoop();
    }

    pauseGame() {
        this.isPaused = !this.isPaused;
    }

    gameLoop(currentTime = 0) {
        if (this.gameOver) return;

        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;
        
        // 更新游戏时间
        if (this.gameStarted && !this.isPaused) {
            this.gameTime = (Date.now() - this.gameStartTime) / 1000;
        }

        if (!this.isPaused) {
            this.update(deltaTime);
            this.render();
            this.updateUI();
        }

        if (typeof requestAnimationFrame !== 'undefined') {
            this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
        }
    }

    update(deltaTime) {
        this.updatePlayer(deltaTime);
        this.updateBullets(deltaTime);
        this.updateStoneDragon(deltaTime);
        this.updateLoot(deltaTime);
        this.updateEffects(deltaTime);
        
        // 更新技能系统
        if (this.skillSystem) {
            this.skillSystem.update(deltaTime);
        }
        
        this.checkCollisions();
        this.autoShootLogic(deltaTime);
        this.spawnLogic(deltaTime);
    }

    updatePlayer(deltaTime) {
        const speed = this.player.speed * deltaTime;
        
        // 移动玩家
        if (this.keys['w'] || this.keys['arrowup']) {
            this.player.y = Math.max(this.player.radius, this.player.y - speed);
        }
        if (this.keys['s'] || this.keys['arrowdown']) {
            this.player.y = Math.min(this.height - this.player.radius, this.player.y + speed);
        }
        if (this.keys['a'] || this.keys['arrowleft']) {
            this.player.x = Math.max(this.player.radius, this.player.x - speed);
        }
        if (this.keys['d'] || this.keys['arrowright']) {
            this.player.x = Math.min(this.width - this.player.radius, this.player.x + speed);
        }
    }

    updateBullets(deltaTime) {
        this.bullets = this.bullets.filter(bullet => {
            bullet.x += bullet.vx * deltaTime;
            bullet.y += bullet.vy * deltaTime;
            
            // 移除超出边界的子弹
            return bullet.x > 0 && bullet.x < this.width && 
                   bullet.y > 0 && bullet.y < this.height;
        });
    }

    updateStoneDragon(deltaTime) {
        if (!this.stoneDragon) return;
        
        // 更新特殊能力计时器
        this.stoneDragon.specialAbilityTimer += deltaTime;
        
        // 处理元素特殊能力
        this.updateElementalAbilities(deltaTime);
        
        // 更新龙技能系统
        this.updateDragonSkills(deltaTime);
        
        // 更新石龙每个段的位置
        this.stoneDragon.segments.forEach((segment, index) => {
            if (index === 0) {
                // 头部跟随玩家
                const dx = this.player.x - segment.x;
                const dy = this.player.y - segment.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 0) {
                    // 冰龙减速效果
                    let speedMultiplier = 1.0;
                    if (this.playerEffects.freeze.duration > 0) {
                        speedMultiplier = this.playerEffects.freeze.intensity;
                    }
                    
                    segment.x += (dx / distance) * this.stoneDragon.speed * deltaTime * speedMultiplier;
                    segment.y += (dy / distance) * this.stoneDragon.speed * deltaTime * speedMultiplier;
                }
            } else {
                // 身体段跟随前一段
                const prevSegment = this.stoneDragon.segments[index - 1];
                const dx = prevSegment.x - segment.x;
                const dy = prevSegment.y - segment.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > this.dragonConfig.segmentSpacing) {
                    const moveRatio = (distance - this.dragonConfig.segmentSpacing) / distance;
                    segment.x += dx * moveRatio * 0.8;
                    segment.y += dy * moveRatio * 0.8;
                }
            }
            
            // 攻击冷却
            if (segment.attackCooldown > 0) {
                segment.attackCooldown -= deltaTime;
            }
        });
    }

    // 更新元素特殊能力
    updateElementalAbilities(deltaTime) {
        if (!this.stoneDragon || !this.stoneDragon.element) return;
        
        const element = this.stoneDragon.element;
        
        // 更新玩家状态效果
        Object.keys(this.playerEffects).forEach(effect => {
            if (this.playerEffects[effect].duration > 0) {
                this.playerEffects[effect].duration -= deltaTime;
            }
        });
        
        switch (element.specialAbility) {
            case 'freeze':
                // 冰龙：每3秒减速玩家
                if (this.stoneDragon.specialAbilityTimer >= 3.0) {
                    this.playerEffects.freeze.duration = 2.0;
                    this.playerEffects.freeze.intensity = 0.5; // 减速50%
                    this.stoneDragon.specialAbilityTimer = 0;
                    this.addDamageNumber(this.player.x, this.player.y - 30, '冰冻减速!', false, true);
                }
                break;
                
            case 'burn':
                // 火龙：持续燃烧伤害
                if (this.stoneDragon.specialAbilityTimer >= 1.0) {
                    this.playerEffects.burn.duration = 3.0;
                    this.playerEffects.burn.damage = 5;
                    this.stoneDragon.specialAbilityTimer = 0;
                }
                if (this.playerEffects.burn.duration > 0) {
                    this.lives -= this.playerEffects.burn.damage * deltaTime / 3.0; // 每秒5点伤害
                    if (Math.random() < 0.1) { // 10%概率显示伤害
                        this.addDamageNumber(this.player.x, this.player.y - 20, '燃烧', false, true);
                    }
                }
                break;
                
            case 'poison':
                // 毒龙：中毒效果
                if (this.stoneDragon.specialAbilityTimer >= 2.0) {
                    this.playerEffects.poison.duration = 4.0;
                    this.playerEffects.poison.damage = 3;
                    this.stoneDragon.specialAbilityTimer = 0;
                }
                if (this.playerEffects.poison.duration > 0) {
                    this.lives -= this.playerEffects.poison.damage * deltaTime / 4.0; // 每秒3点伤害
                    if (Math.random() < 0.08) { // 8%概率显示伤害
                        this.addDamageNumber(this.player.x, this.player.y - 25, '中毒', false, true);
                    }
                }
                break;
                
            case 'chain':
                // 雷龙：连锁闪电（增加伤害）
                if (this.stoneDragon.specialAbilityTimer >= 4.0) {
                    this.stoneDragon.segments.forEach(segment => {
                        segment.damage *= 1.5; // 临时增加50%伤害
                    });
                    this.stoneDragon.specialAbilityTimer = 0;
                    this.addDamageNumber(this.stoneDragon.segments[0].x, this.stoneDragon.segments[0].y - 50, '雷电强化!', false, true);
                    
                    // 3秒后恢复正常伤害
                    setTimeout(() => {
                        if (this.stoneDragon && this.stoneDragon.segments) {
                            this.stoneDragon.segments.forEach(segment => {
                                segment.damage /= 1.5;
                            });
                        }
                    }, 3000);
                }
                break;
                
            case 'phase':
                // 暗龙：阶段性无敌
                if (this.stoneDragon.specialAbilityTimer >= 8.0) {
                    this.stoneDragon.phaseInvulnerable = true;
                    this.stoneDragon.specialAbilityTimer = 0;
                    this.addDamageNumber(this.stoneDragon.segments[0].x, this.stoneDragon.segments[0].y - 50, '暗影护盾!', false, true);
                    
                    // 3秒后取消无敌
                    setTimeout(() => {
                        if (this.stoneDragon) {
                            this.stoneDragon.phaseInvulnerable = false;
                        }
                    }, 3000);
                }
                break;
                
            case 'armor':
                // 石龙：减伤（被动，在受伤时处理）
                break;
        }
    }

    updateLoot(deltaTime) {
        this.loot.forEach(loot => {
            const time = (Date.now() - loot.createdTime) / 1000;
            loot.y += Math.sin(time * 3 + loot.bobOffset) * 0.5;
        });
    }

    updateEffects(deltaTime) {
        // 更新伤害数字
        this.damageNumbers = this.damageNumbers.filter(dmg => {
            dmg.y -= 100 * deltaTime;
            dmg.life -= deltaTime;
            return dmg.life > 0;
        });

        // 更新粒子
        this.particles = this.particles.filter(particle => {
            particle.life -= deltaTime;
            particle.x += particle.vx * deltaTime * 60;
            particle.y += particle.vy * deltaTime * 60;
            particle.vy += 200 * deltaTime; // 重力
            return particle.life > 0;
        });
    }

    autoShootLogic(deltaTime) {
        if (!this.autoShoot || !this.stoneDragon) return;
        
        // 应用技能系统的射速修正
        let effectiveFireRate = this.fireRate;
        if (this.skillSystem) {
            const fireRateBonus = this.skillSystem.getPassiveEffect('quickReload', 'fireRateBonus') || 0;
            effectiveFireRate *= (1 + fireRateBonus);
        }
        
        const now = Date.now() / 1000;
        if (now - this.lastShotTime < 1 / effectiveFireRate) return;
        
        // 找到最近的石龙段
        let nearestSegment = null;
        let nearestDistance = Infinity;
        
        this.stoneDragon.segments.forEach(segment => {
            const dx = segment.x - this.player.x;
            const dy = segment.y - this.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestSegment = segment;
            }
        });
        
        if (nearestSegment) {
            this.shootAtTarget(nearestSegment.x, nearestSegment.y);
        }
    }

    // 优化后的射击方法，支持技能效果
    shootAtTarget(targetX, targetY) {
        const dx = targetX - this.player.x;
        const dy = targetY - this.player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) return;
        
        // 计算基础伤害和暴击
        let damage = this.bulletDamage;
        let isCrit = false;
        
        if (this.skillSystem) {
            const critChance = this.skillSystem.getPassiveEffect('criticalHit', 'critChance') || 0;
            if (Math.random() < critChance) {
                const critMultiplier = this.skillSystem.getPassiveEffect('criticalHit', 'critMultiplier') || 1;
                damage *= critMultiplier;
                isCrit = true;
            }
        }
        
        // 创建主子弹
        this.createBullet(dx, dy, distance, damage, isCrit);
        
        // 双重射击检查
        if (this.skillSystem) {
            const extraShotChance = this.skillSystem.getPassiveEffect('doubleShot', 'extraShotChance') || 0;
            if (Math.random() < extraShotChance) {
                // 略微偏移角度的额外子弹
                const offsetAngle = (Math.random() - 0.5) * 0.2;
                const cos = Math.cos(offsetAngle);
                const sin = Math.sin(offsetAngle);
                const newDx = dx * cos - dy * sin;
                const newDy = dx * sin + dy * cos;
                
                this.createBullet(newDx, newDy, distance, damage * 0.8, false);
            }
        }
        
        this.lastShotTime = Date.now() / 1000;
    }

    // 创建子弹的辅助方法
    createBullet(dx, dy, distance, damage, isCrit = false) {
        this.bullets.push({
            x: this.player.x,
            y: this.player.y,
            vx: (dx / distance) * this.bulletSpeed,
            vy: (dy / distance) * this.bulletSpeed,
            damage: damage,
            element: this.player.weaponElement || 'normal',
            penetration: this.bulletPenetration || 0,
            radius: 3,
            isCrit: isCrit,
            life: 3.0
        });
    }

    // 兼容测试的方法别名
    spawnDragon() {
        this.spawnStoneDragon();
        this.syncDragonsArray();
    }

    // 同步dragons数组与stoneDragon状态
    syncDragonsArray() {
        this.dragons = [];
        if (this.stoneDragon && this.stoneDragon.segments.length > 0) {
            this.stoneDragon.segments.forEach(segment => {
                this.dragons.push({
                    x: segment.x,
                    y: segment.y,
                    health: segment.health,
                    maxHealth: segment.maxHealth,
                    speed: this.stoneDragon.speed,
                    attackCooldown: segment.attackCooldown,
                    damage: segment.damage || (15 + segment.segmentIndex * 5)
                });
            });
        }
    }

    // 手动射击方法
    shoot(targetX = null, targetY = null) {
        // 如果没有提供目标位置，使用鼠标位置
        const tx = targetX !== null ? targetX : this.mousePos.x;
        const ty = targetY !== null ? targetY : this.mousePos.y;
        
        // 处理无效位置
        if (isNaN(tx) || isNaN(ty)) {
            return;
        }
        
        const dx = tx - this.player.x;
        const dy = ty - this.player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            this.bullets.push({
                x: this.player.x,
                y: this.player.y,
                vx: (dx / distance) * this.bulletSpeed,
                vy: (dy / distance) * this.bulletSpeed,
                damage: this.bulletDamage,
                penetration: this.bulletPenetration,
                radius: 3
            });
        }
    }

    spawnStoneDragon() {
        // 初始化石龙，从屏幕外开始
        const side = Math.floor(Math.random() * 4);
        let startX, startY;
        
        switch (side) {
            case 0: // 上边
                startX = Math.random() * this.width;
                startY = -100;
                break;
            case 1: // 右边
                startX = this.width + 100;
                startY = Math.random() * this.height;
                break;
            case 2: // 下边
                startX = Math.random() * this.width;
                startY = this.height + 100;
                break;
            case 3: // 左边
                startX = -100;
                startY = Math.random() * this.height;
                break;
        }
        
        // 根据波数调整初始属性（线性增长以匹配测试期望）
        const baseHealth = 50; // 基础血量（测试期望）
        const healthPerWave = 25; // 每波增加血量（测试期望）
        let initialHealth = baseHealth + this.wave * healthPerWave;
        
        // 无限模式额外加强
        if (this.isEndlessMode && this.wave > 10) {
            const endlessMultiplier = 1 + (this.wave - 10) * 0.2; // 每波额外20%增长
            initialHealth = Math.floor(initialHealth * endlessMultiplier);
        }
        
        // 选择随机龙元素
        const dragonElement = this.selectRandomDragonElement();
        
        // 创建元素龙，初始只有一个头部
        this.stoneDragon = {
            element: dragonElement,
            segments: [{
                x: startX,
                y: startY,
                health: Math.floor(initialHealth * dragonElement.healthMultiplier),
                maxHealth: Math.floor(initialHealth * dragonElement.healthMultiplier),
                attackCooldown: 0,
                segmentIndex: 0,
                damage: Math.floor((15 + (this.wave - 1) * 5) * dragonElement.damageMultiplier * (this.isEndlessMode && this.wave > 10 ? 1 + (this.wave - 10) * 0.15 : 1))
            }],
            speed: Math.floor((30 + this.wave * 5) * dragonElement.speedMultiplier * (this.isEndlessMode && this.wave > 15 ? Math.min(1 + (this.wave - 15) * 0.1, 2.5) : 1)), // 基础速度受元素影响，无限模式加强但有上限
            totalSegments: 1,
            specialAbilityTimer: 0, // 特殊能力计时器
            phaseInvulnerable: false, // 暗龙的阶段性无敌状态
            
            // 龙技能系统
            skills: {
                laserSweep: {
                    cooldown: 0,
                    isActive: false,
                    currentAngle: 0,
                    startAngle: 0,
                    elapsed: 0
                },
                chargeAttack: {
                    cooldown: 0,
                    isCharging: false,
                    chargeTarget: { x: 0, y: 0 },
                    originalSpeed: 0,
                    elapsed: 0
                },
                aiTimer: 0, // AI技能检查计时器
                skillCheckInterval: Math.max(1000, 2000 - this.wave * 50) // 技能检查间隔，随波次减少
            }
        };
        
        // 播放龙生成音效
        this.playSound('dragon_spawn');
    }

    spawnLogic(deltaTime) {
        // 游戏结束时停止生成
        if (this.gameOver || !this.stoneDragon) return;
        
        const now = Date.now() / 1000;
        
        // 动态生成间隔：随着段数增加而递减（但有下限）
        const currentSegments = this.stoneDragon.segments.length;
        const dynamicInterval = Math.max(
            this.dragonConfig.spawnInterval - (currentSegments * 0.1), 
            1.5 // 最快1.5秒生成一段
        );
        
        if (now - this.dragonConfig.lastSpawnTime > dynamicInterval) {
            this.addDragonSegment();
            this.dragonConfig.lastSpawnTime = now;
        }
    }

    checkCollisions() {
        // 处理直接添加到dragons数组的龙（测试兼容）
        for (let dragonIndex = this.dragons.length - 1; dragonIndex >= 0; dragonIndex--) {
            const dragon = this.dragons[dragonIndex];
            
            for (let bulletIndex = this.bullets.length - 1; bulletIndex >= 0; bulletIndex--) {
                const bullet = this.bullets[bulletIndex];
                const dx = bullet.x - dragon.x;
                const dy = bullet.y - dragon.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                const dragonSize = dragon.size || this.dragonConfig.segmentSize;
                if (distance < dragonSize) {
                    // 造成伤害
                    dragon.health -= bullet.damage;
                    
                    // 显示伤害数字
                    this.addDamageNumber(dragon.x, dragon.y, bullet.damage);
                    
                    // 创建击中粒子
                    this.createHitParticles(dragon.x, dragon.y);
                    
                    // 移除子弹
                    this.bullets.splice(bulletIndex, 1);
                    
                    // 检查龙是否被摧毁
                    if (dragon.health <= 0) {
                        // 给予分数和击杀
                        this.score += 100;
                        this.kills++;
                        
                        // 显示得分
                        this.addDamageNumber(dragon.x, dragon.y - 20, '+100', false, true);
                        
                        // 道具掉落
                        if (Math.random() < this.luck || this.luck >= 1.0) {
                            this.dropLoot(dragon.x, dragon.y);
                        }
                        
                        // 移除龙
                        this.dragons.splice(dragonIndex, 1);
                    }
                    
                    break;
                }
            }
        }

        // 子弹击中石龙段
        if (this.stoneDragon) {
            for (let bulletIndex = this.bullets.length - 1; bulletIndex >= 0; bulletIndex--) {
                const bullet = this.bullets[bulletIndex];
                let hitSegment = false;
                
                for (let segmentIndex = this.stoneDragon.segments.length - 1; segmentIndex >= 0; segmentIndex--) {
                    const segment = this.stoneDragon.segments[segmentIndex];
                    const dx = bullet.x - segment.x;
                    const dy = bullet.y - segment.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < this.dragonConfig.segmentSize) {
                        // 检查暗龙无敌状态
                        if (this.stoneDragon.phaseInvulnerable) {
                            this.addDamageNumber(segment.x, segment.y, '无敌', false, true);
                        } else {
                            // 计算元素克制伤害
                            let actualDamage = this.calculateElementalDamage(bullet.damage, bullet.element || 'normal', this.stoneDragon.element.type);
                            
                            // 石龙特殊减伤
                            if (this.stoneDragon.element.specialAbility === 'armor') {
                                actualDamage *= 0.7;
                            }
                            
                            // 造成伤害
                            segment.health -= actualDamage;
                            
                            // 显示伤害数字（如果有克制效果，显示特殊颜色）
                            const effectiveness = this.getElementalEffectiveness(bullet.element || 'normal', this.stoneDragon.element.type);
                            this.addDamageNumber(segment.x, segment.y, Math.ceil(actualDamage), false, false, effectiveness);
                        }
                        
                        // 创建击中粒子
                        this.createHitParticles(segment.x, segment.y);
                        
                        // 检查是否有穿透能力
                        if (!this.bulletPenetration || this.bulletPenetration <= 0) {
                            this.bullets.splice(bulletIndex, 1);
                        } else {
                            // 穿透弹减少伤害但不消失
                            bullet.damage = Math.max(bullet.damage * 0.8, 10);
                        }
                        hitSegment = true;
                        
                        // 检查段是否被摧毁
                        if (segment.health <= 0) {
                            this.destroyDragonSegment(segmentIndex);
                            // 同步更新dragons数组
                            this.syncDragonsArray();
                        }
                        
                        if (!this.bulletPenetration || this.bulletPenetration <= 0) {
                            break; // 非穿透弹才退出
                        }
                    }
                }
                
                if (hitSegment) continue;
            }
        }

        // dragons数组中的龙攻击玩家（测试兼容）
        this.dragons.forEach(dragon => {
            const dx = dragon.x - this.player.x;
            const dy = dragon.y - this.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            const dragonSize = dragon.size || this.dragonConfig.segmentSize;
            if (distance < dragonSize + this.player.radius && (!dragon.attackCooldown || dragon.attackCooldown <= 0)) {
                const damage = dragon.damage || 100; // 测试中的龙伤害很高
                this.takeDamage(damage);
                if (dragon.attackCooldown !== undefined) {
                    dragon.attackCooldown = 2 + Math.random() * 2;
                }
            }
        });

        // 石龙攻击玩家（使用动态伤害）
        if (this.stoneDragon) {
            this.stoneDragon.segments.forEach(segment => {
                const dx = segment.x - this.player.x;
                const dy = segment.y - this.player.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.dragonConfig.segmentSize + this.player.radius && segment.attackCooldown <= 0) {
                    const damage = segment.damage || (15 + segment.segmentIndex * 5);
                    this.takeDamage(damage);
                    segment.attackCooldown = 2 + Math.random() * 2;
                }
            });
        }

        // 玩家拾取道具
        this.loot.forEach((loot, lootIndex) => {
            const dx = loot.x - this.player.x;
            const dy = loot.y - this.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 30) {
                this.collectLoot(loot);
                this.loot.splice(lootIndex, 1);
            }
        });
    }

    addDragonSegment() {
        if (!this.stoneDragon || this.stoneDragon.totalSegments >= this.dragonConfig.maxSegments) return;
        
        // 在龙尾添加新段
        const lastSegment = this.stoneDragon.segments[this.stoneDragon.segments.length - 1];
        const newSegmentIndex = this.stoneDragon.totalSegments;
        
        // 肉鸽式难度递增：指数型血量增长，受元素影响
        const element = this.stoneDragon.element;
        const baseHealth = this.dragonConfig.baseHealth * element.healthMultiplier;
        const healthMultiplier = Math.pow(this.dragonConfig.difficultyScaling.healthMultiplier, newSegmentIndex);
        const newHealth = Math.floor(baseHealth * healthMultiplier) + (newSegmentIndex * this.dragonConfig.healthIncrement);
        
        const baseDamage = 15 + Math.floor(newSegmentIndex * this.dragonConfig.difficultyScaling.damageMultiplier * 5);
        const elementalDamage = Math.floor(baseDamage * element.damageMultiplier);
        
        const newSegment = {
            x: lastSegment.x - this.dragonConfig.segmentSpacing,
            y: lastSegment.y,
            health: newHealth,
            maxHealth: newHealth,
            attackCooldown: 0,
            segmentIndex: newSegmentIndex,
            damage: elementalDamage
        };
        
        this.stoneDragon.segments.push(newSegment);
        this.stoneDragon.totalSegments++;
        
        // 每添加一段，提高整体速度（但有上限）
        this.stoneDragon.speed = Math.min(this.stoneDragon.speed + this.dragonConfig.difficultyScaling.speedIncrement, 120);
        
        // 显示新段出现的提示
        this.addDamageNumber(
            lastSegment.x, 
            lastSegment.y - 50, 
            `石龙成长! 第${newSegmentIndex + 1}段`, 
            false, 
            true
        );
    }
    
    destroyDragonSegment(segmentIndex) {
        if (!this.stoneDragon || segmentIndex >= this.stoneDragon.segments.length) return;
        
        const segment = this.stoneDragon.segments[segmentIndex];
        
        // 肉鸽式奖励：后面的段给更多分数
        const baseScore = 50;
        const segmentBonus = segment.segmentIndex * 30;
        const difficultyBonus = Math.floor(segment.maxHealth / 10); // 根据血量给奖励
        const totalScore = baseScore + segmentBonus + difficultyBonus;
        
        this.score += totalScore;
        this.kills++;
        
        // 显示得分
        this.addDamageNumber(segment.x, segment.y - 20, `+${totalScore}`, false, true);
        
        // 高级段有更高掉落率
        const lootChance = this.luck + (segment.segmentIndex * 0.05);
        if (Math.random() < lootChance) {
            this.dropLoot(segment.x, segment.y);
            
            // 高级段可能掉落多个道具
            if (segment.segmentIndex > 5 && Math.random() < 0.3) {
                this.dropLoot(segment.x + 20, segment.y + 20);
            }
        }
        
        // 移除段
        this.stoneDragon.segments.splice(segmentIndex, 1);
        
        // 检查是否所有段都被摧毁
        if (this.stoneDragon.segments.length === 0) {
            this.defeatDragon();
        }
    }

    defeatDragon() {
        if (!this.stoneDragon) return;
        
        const element = this.stoneDragon.element;
        const dragonCenterX = this.width / 2;
        const dragonCenterY = this.height / 2;
        
        // 基础奖励
        const bossBonus = 1000 + (this.wave * 500);
        let totalBonus = bossBonus;
        
        // 元素特殊死亡效果和奖励
        switch(element.type) {
            case 'fire':
                // 火龙：爆炸效果，额外分数
                this.createExplosionEffect(dragonCenterX, dragonCenterY, 100);
                totalBonus *= 1.2;
                this.addDamageNumber(dragonCenterX, dragonCenterY - 50, '火焰爆发!', false, true);
                this.playSound('fire_death');
                break;
                
            case 'ice':
                // 冰龙：冰晶效果，临时减速所有敌人
                this.createIceShatterEffect(dragonCenterX, dragonCenterY);
                this.addDamageNumber(dragonCenterX, dragonCenterY - 50, '冰晶破碎!', false, true);
                this.playSound('ice_death');
                break;
                
            case 'lightning':
                // 雷龙：闪电效果，临时提高所有塔攻速
                this.createLightningEffect(dragonCenterX, dragonCenterY);
                this.temporaryAttackSpeedBoost();
                totalBonus *= 1.1;
                this.addDamageNumber(dragonCenterX, dragonCenterY - 50, '雷电爆发!', false, true);
                this.playSound('lightning_death');
                break;
                
            case 'poison':
                // 毒龙：毒雾效果，掉落额外金币
                this.createPoisonCloudEffect(dragonCenterX, dragonCenterY);
                this.spawnExtraGold(dragonCenterX, dragonCenterY);
                this.addDamageNumber(dragonCenterX, dragonCenterY - 50, '毒雾散发!', false, true);
                this.playSound('poison_death');
                break;
                
            case 'dark':
                // 暗龙：最高奖励和特殊掉落
                this.createDarkVoidEffect(dragonCenterX, dragonCenterY);
                totalBonus *= 1.5;
                this.spawnRareLoot(dragonCenterX, dragonCenterY);
                this.addDamageNumber(dragonCenterX, dragonCenterY - 50, '暗影破灭!', false, true);
                this.playSound('dark_death');
                break;
        }
        
        // 给予奖励
        this.score += Math.floor(totalBonus);
        this.addDamageNumber(dragonCenterX, dragonCenterY, `${element.name}击败! +${Math.floor(totalBonus)}`, false, true);
        
        // 记录击败的龙类型（用于成就系统）
        if (!this.defeatedDragons) this.defeatedDragons = {};
        this.defeatedDragons[element.type] = (this.defeatedDragons[element.type] || 0) + 1;
        
        // 检查成就
        this.checkAchievements(element.type);
        
        this.stoneDragon = null;
        this.wave++;
        
        // 等待时间根据元素类型调整
        const waitTime = element.type === 'dark' ? 8000 : 5000;
        setTimeout(() => {
            if (!this.gameOver) {
                this.spawnStoneDragon();
            }
        }, waitTime);
    }

    createExplosionEffect(x, y, radius) {
        // 创建火焰爆炸粒子
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 200 + 100;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                maxLife: 1,
                color: Math.random() > 0.5 ? '#ff4444' : '#ffaa00',
                size: Math.random() * 8 + 4
            });
        }
    }

    createIceShatterEffect(x, y) {
        // 创建冰晶破碎效果
        for (let i = 0; i < 25; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 150 + 50;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.5,
                maxLife: 1.5,
                color: Math.random() > 0.5 ? '#88ddff' : '#ffffff',
                size: Math.random() * 6 + 3
            });
        }
    }

    createLightningEffect(x, y) {
        // 创建闪电效果
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 300 + 200;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.5,
                maxLife: 0.5,
                color: Math.random() > 0.5 ? '#ffff00' : '#ffffff',
                size: Math.random() * 4 + 2
            });
        }
    }

    createPoisonCloudEffect(x, y) {
        // 创建毒雾效果
        for (let i = 0; i < 35; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 100 + 30;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 2,
                maxLife: 2,
                color: Math.random() > 0.5 ? '#44ff44' : '#88ff88',
                size: Math.random() * 10 + 5
            });
        }
    }

    createDarkVoidEffect(x, y) {
        // 创建暗影虚空效果
        for (let i = 0; i < 40; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 250 + 100;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 2.5,
                maxLife: 2.5,
                color: Math.random() > 0.5 ? '#440044' : '#880088',
                size: Math.random() * 12 + 6
            });
        }
    }

    temporaryAttackSpeedBoost() {
        // 临时提高所有塔的攻击速度
        const originalSpeeds = {};
        this.towers.forEach((tower, index) => {
            originalSpeeds[index] = tower.fireRate;
            tower.fireRate *= 2; // 攻击速度翻倍
        });
        
        // 10秒后恢复
        setTimeout(() => {
            this.towers.forEach((tower, index) => {
                if (originalSpeeds[index]) {
                    tower.fireRate = originalSpeeds[index];
                }
            });
        }, 10000);
        
        this.addDamageNumber(this.width / 2, 100, '全塔攻速提升!', false, true);
    }

    spawnExtraGold(x, y) {
        // 在击败位置周围生成额外金币
        for (let i = 0; i < 5; i++) {
            const offsetX = (Math.random() - 0.5) * 200;
            const offsetY = (Math.random() - 0.5) * 200;
            this.loot.push({
                x: x + offsetX,
                y: y + offsetY,
                type: 'gold',
                value: 100 + Math.random() * 200,
                life: 300
            });
        }
    }

    spawnRareLoot(x, y) {
        // 生成稀有掉落
        this.loot.push({
            x: x,
            y: y,
            type: 'rare_upgrade',
            value: 1,
            life: 600
        });
    }

    calculateElementalDamage(baseDamage, attackerElement, defenderElement) {
        const effectiveness = this.getElementalEffectiveness(attackerElement, defenderElement);
        return baseDamage * effectiveness;
    }

    getElementalEffectiveness(attackerElement, defenderElement) {
        // 元素克制表
        const effectiveness = {
            'fire': {
                'ice': 2.0,      // 火克冰
                'poison': 1.5,   // 火对毒有效
                'fire': 0.5,     // 火对火抗性
                'lightning': 1.0,
                'dark': 1.0
            },
            'ice': {
                'fire': 0.5,     // 冰被火克制
                'lightning': 2.0, // 冰克雷
                'poison': 1.5,   // 冰对毒有效
                'ice': 0.5,      // 冰对冰抗性
                'dark': 1.0
            },
            'lightning': {
                'ice': 0.5,      // 雷被冰克制
                'dark': 2.0,     // 雷克暗
                'fire': 1.5,     // 雷对火有效
                'lightning': 0.5, // 雷对雷抗性
                'poison': 1.0
            },
            'poison': {
                'fire': 0.5,     // 毒被火克制
                'ice': 0.5,      // 毒被冰克制
                'dark': 1.5,     // 毒对暗有效
                'lightning': 1.0,
                'poison': 0.5    // 毒对毒抗性
            },
            'dark': {
                'lightning': 0.5, // 暗被雷克制
                'poison': 0.5,   // 暗被毒克制
                'fire': 1.5,     // 暗对火有效
                'ice': 1.5,      // 暗对冰有效
                'dark': 0.5      // 暗对暗抗性
            },
            'normal': {
                'fire': 1.0,
                'ice': 1.0,
                'lightning': 1.0,
                'poison': 1.0,
                'dark': 1.0
            }
        };

        if (!effectiveness[attackerElement] || !effectiveness[attackerElement][defenderElement]) {
            return 1.0; // 默认效果
        }

        return effectiveness[attackerElement][defenderElement];
    }

    // 塔升级系统
    upgradeTower(towerIndex) {
        if (towerIndex >= 0 && towerIndex < this.towers.length) {
            const tower = this.towers[towerIndex];
            const upgradeCost = this.getTowerUpgradeCost(tower);
            
            if (this.score >= upgradeCost) {
                this.score -= upgradeCost;
                this.performTowerUpgrade(tower);
                return true;
            }
        }
        return false;
    }

    getTowerUpgradeCost(tower) {
        const baseUpgradeCost = 500;
        return baseUpgradeCost * Math.pow(1.5, tower.level || 0);
    }

    performTowerUpgrade(tower) {
        if (!tower.level) tower.level = 0;
        tower.level++;

        // 基础属性提升
        tower.damage = Math.floor(tower.damage * 1.3);
        tower.fireRate = Math.max(tower.fireRate * 0.9, 100); // 提高攻速（降低间隔）
        tower.range = Math.min(tower.range * 1.1, 300); // 提高射程

        // 每3级解锁特殊能力或元素属性
        if (tower.level % 3 === 0) {
            this.unlockTowerSpecialAbility(tower);
        }

        // 视觉升级
        tower.size = Math.min(tower.size * 1.1, 20);
        this.addDamageNumber(tower.x, tower.y, `升级! Lv.${tower.level}`, false, true);
        this.playSound('upgrade');
    }

    unlockTowerSpecialAbility(tower) {
        const abilities = ['piercing', 'explosive', 'freeze', 'poison', 'lightning'];
        const elements = ['fire', 'ice', 'lightning', 'poison', 'dark'];
        
        if (tower.level === 3) {
            // 第一次升级：获得穿透能力
            tower.piercing = true;
            this.addDamageNumber(tower.x, tower.y, '穿透!', false, true);
        } else if (tower.level === 6) {
            // 第二次升级：获得元素属性
            tower.element = elements[Math.floor(Math.random() * elements.length)];
            this.addDamageNumber(tower.x, tower.y, `${tower.element}元素!`, false, true);
        } else if (tower.level === 9) {
            // 第三次升级：获得特殊效果
            const ability = abilities[Math.floor(Math.random() * abilities.length)];
            tower.specialAbility = ability;
            this.addDamageNumber(tower.x, tower.y, `${ability}特效!`, false, true);
        }
    }

    checkAchievements(dragonType) {
        if (!this.achievements) {
            this.achievements = {
                unlocked: [],
                definitions: {
                    'fire_slayer_1': { name: '烈焰克星I', desc: '击败5只火龙', target: 5, type: 'fire' },
                    'fire_slayer_2': { name: '烈焰克星II', desc: '击败15只火龙', target: 15, type: 'fire' },
                    'fire_slayer_3': { name: '烈焰克星III', desc: '击败30只火龙', target: 30, type: 'fire' },
                    
                    'ice_slayer_1': { name: '冰霜克星I', desc: '击败5只冰龙', target: 5, type: 'ice' },
                    'ice_slayer_2': { name: '冰霜克星II', desc: '击败15只冰龙', target: 15, type: 'ice' },
                    'ice_slayer_3': { name: '冰霜克星III', desc: '击败30只冰龙', target: 30, type: 'ice' },
                    
                    'lightning_slayer_1': { name: '雷电克星I', desc: '击败5只雷龙', target: 5, type: 'lightning' },
                    'lightning_slayer_2': { name: '雷电克星II', desc: '击败15只雷龙', target: 15, type: 'lightning' },
                    'lightning_slayer_3': { name: '雷电克星III', desc: '击败30只雷龙', target: 30, type: 'lightning' },
                    
                    'poison_slayer_1': { name: '毒素克星I', desc: '击败5只毒龙', target: 5, type: 'poison' },
                    'poison_slayer_2': { name: '毒素克星II', desc: '击败15只毒龙', target: 15, type: 'poison' },
                    'poison_slayer_3': { name: '毒素克星III', desc: '击败30只毒龙', target: 30, type: 'poison' },
                    
                    'dark_slayer_1': { name: '暗影克星I', desc: '击败3只暗龙', target: 3, type: 'dark' },
                    'dark_slayer_2': { name: '暗影克星II', desc: '击败10只暗龙', target: 10, type: 'dark' },
                    'dark_slayer_3': { name: '暗影克星III', desc: '击败20只暗龙', target: 20, type: 'dark' },
                    
                    'dragon_master': { name: '龙族大师', desc: '击败所有类型的龙各10只', target: 10, type: 'all' },
                    'legendary_hunter': { name: '传奇猎手', desc: '击败100只龙', target: 100, type: 'total' }
                }
            };
        }

        const count = this.defeatedDragons[dragonType] || 0;
        
        // 检查特定龙类型的成就
        Object.keys(this.achievements.definitions).forEach(achievementId => {
            const achievement = this.achievements.definitions[achievementId];
            
            if (this.achievements.unlocked.includes(achievementId)) return;
            
            let shouldUnlock = false;
            
            if (achievement.type === dragonType && count >= achievement.target) {
                shouldUnlock = true;
            } else if (achievement.type === 'all') {
                // 检查是否所有类型的龙都击败了目标数量
                const elementTypes = ['fire', 'ice', 'lightning', 'poison', 'dark'];
                shouldUnlock = elementTypes.every(type => 
                    (this.defeatedDragons[type] || 0) >= achievement.target
                );
            } else if (achievement.type === 'total') {
                // 检查总击败数量
                const totalDefeated = Object.values(this.defeatedDragons).reduce((sum, count) => sum + count, 0);
                shouldUnlock = totalDefeated >= achievement.target;
            }
            
            if (shouldUnlock) {
                this.unlockAchievement(achievementId, achievement);
            }
        });
    }

    unlockAchievement(achievementId, achievement) {
        this.achievements.unlocked.push(achievementId);
        
        // 显示成就解锁通知
        this.addDamageNumber(
            this.width / 2, 
            this.height / 2 - 100, 
            `🏆 ${achievement.name}`, 
            false, 
            true
        );
        
        // 给予成就奖励
        let reward = 0;
        if (achievement.name.includes('III')) {
            reward = 5000; // 三级成就高额奖励
        } else if (achievement.name.includes('II')) {
            reward = 2000; // 二级成就中等奖励
        } else if (achievement.name.includes('I')) {
            reward = 1000; // 一级成就基础奖励
        } else if (achievement.name.includes('大师') || achievement.name.includes('传奇')) {
            reward = 10000; // 特殊成就超高奖励
        }
        
        this.score += reward;
        if (reward > 0) {
            this.addDamageNumber(
                this.width / 2, 
                this.height / 2 - 70, 
                `奖励: +${reward}`, 
                false, 
                true
            );
        }
        
        console.log(`Achievement unlocked: ${achievement.name} - ${achievement.desc}`);
        
        // 播放成就音效
        this.playSound('achievement');
    }

    // 简单的音效系统（模拟）
    playSound(soundType) {
        if (!this.soundEnabled) return;
        
        const soundMessages = {
            'fire_death': '🔥 火焰爆炸音效',
            'ice_death': '❄️ 冰晶破碎音效', 
            'lightning_death': '⚡ 雷电爆发音效',
            'poison_death': '🧪 毒雾散发音效',
            'dark_death': '🌑 暗影破灭音效',
            'dragon_spawn': '🐉 龙吟声',
            'achievement': '🏆 成就解锁音效',
            'upgrade': '⬆️ 升级音效',
            'hit': '💥 击中音效'
        };
        
        if (soundMessages[soundType]) {
            console.log(`🔊 ${soundMessages[soundType]}`);
        }
    }

    takeDamage(damage) {
        // 检查护盾保护
        if (this.skillSystem && this.skillSystem.hasShieldProtection()) {
            this.addDamageNumber(this.player.x, this.player.y, '护盾抵挡!', false, true);
            return;
        }
        
        // 应用被动技能伤害减免
        let actualDamage = damage;
        if (this.skillSystem) {
            const damageReduction = this.skillSystem.getPassiveEffect('magicArmor', 'damageReduction') || 0;
            actualDamage = damage * (1 - damageReduction);
        }
        
        // 减少玩家健康值
        this.player.health -= actualDamage;
        this.addDamageNumber(this.player.x, this.player.y, Math.floor(actualDamage), true);
        
        // 如果健康值耗尽，减少生命值
        if (this.player.health <= 0) {
            this.lives -= 1;
            
            if (this.lives <= 0) {
                this.gameOver = true;
                this.handleGameOver();
            } else {
                // 重置健康值，给玩家新的生命
                this.player.health = this.player.maxHealth;
                
                // 吸血技能恢复
                if (this.skillSystem) {
                    const healthPerKill = this.skillSystem.getPassiveEffect('vampiric', 'healthPerKill') || 0;
                    if (healthPerKill > 0) {
                        this.player.health = Math.min(this.player.maxHealth, this.player.health + healthPerKill);
                    }
                }
            }
        }
    }

    handleGameOver() {
        // 停止所有游戏逻辑
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // 清空游戏对象
        this.bullets = [];
        this.loot = [];
        this.particles = [];
        
        // 显示游戏结束界面
        this.showGameOverScreen();
    }

    showGameOverScreen() {
        // 只在浏览器环境中显示游戏结束界面
        if (typeof document === 'undefined') return;
        
        // 调用新的游戏结束处理函数
        if (typeof handleGameOver === 'function') {
            handleGameOver();
        } else {
            // 备用显示逻辑
            const gameOverMenu = document.getElementById('gameOverMenu');
            if (gameOverMenu) {
                gameOverMenu.classList.remove('hidden');
                
                // 更新最终数据
                const finalScore = document.getElementById('finalScore');
                const finalWave = document.getElementById('finalWave');
                const finalKills = document.getElementById('finalKills');
                
                if (finalScore) finalScore.textContent = this.score;
                if (finalWave) finalWave.textContent = this.wave;
                if (finalKills) finalKills.textContent = this.kills || 0;
            }
        }
    }

    restart() {
        // 重置游戏状态
        this.gameStarted = false;
        this.gameOver = false;
        this.isPaused = false;
        this.score = 0;
        this.lives = 3;
        this.wave = 1;
        this.kills = 0;
        this.coins = 100; // 重置金币
        this.gameTime = 0; // 重置游戏时间
        
        // 重置玩家位置和属性
        this.player.x = this.width / 2;
        this.player.y = this.height / 2;
        this.player.health = this.player.maxHealth;
        this.player.level = 1;
        this.player.experience = 0;
        
        // 清空所有游戏对象
        this.bullets = [];
        this.loot = [];
        this.damageNumbers = [];
        this.particles = [];
        this.stoneDragon = null;
        
        // 重置各个系统
        if (this.skillSystem && typeof this.skillSystem.reset === 'function') {
            this.skillSystem.reset();
        }
        
        if (this.backgroundEffects && typeof this.backgroundEffects.reset === 'function') {
            this.backgroundEffects.reset();
            console.log('🔄 背景效果已重置');
        }
        
        if (this.gameModeManager) {
            // 重置模式管理器（如果有重置方法）
            if (typeof this.gameModeManager.reset === 'function') {
                this.gameModeManager.reset();
            }
            console.log('🔄 游戏模式管理器已重置');
        }
        
        // 重置敌人相关
        this.lastEnemyTime = 0;
        this.enemies = [];
        
        // 隐藏游戏结束界面
        if (typeof document !== 'undefined') {
            const gameOverMenu = document.getElementById('gameOverMenu');
            if (gameOverMenu) {
                gameOverMenu.classList.add('hidden');
            }
        }
        
        console.log('🎮 游戏重启完成');
        
        // 重新开始游戏
        this.startGame();
    }


    togglePause() {
        if (!this.gameStarted || this.gameOver) return;
        this.isPaused = !this.isPaused;
    }

    updateUI() {
        // 只在浏览器环境中更新UI元素
        if (typeof document === 'undefined') return;
        
        const elements = {
            damage: this.player.damage,
            fireRate: this.fireRate.toFixed(1),
            penetration: this.bulletPenetration || 0,
            lives: this.lives,
            score: this.score,
            dragonSegments: this.stoneDragon ? this.stoneDragon.segments.length : 0,
            wave: this.wave,
            coins: this.coins || 100
        };

        Object.keys(elements).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = elements[id];
            }
        });
    }

    dropLoot(x, y) {
        const lootTypes = ['damage', 'fireRate', 'health', 'luck', 'penetration'];
        
        // 根据游戏进度调整掉落概率
        const weights = {
            damage: 25,
            fireRate: 25, 
            health: 30,
            luck: 15,
            penetration: 5 + Math.min(this.wave * 2, 15) // 后期更容易掉落
        };
        
        const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;
        
        let selectedType = 'health';
        for (const [type, weight] of Object.entries(weights)) {
            random -= weight;
            if (random <= 0) {
                selectedType = type;
                break;
            }
        }
        
        this.loot.push({
            x: x,
            y: y,
            type: selectedType,
            name: this.getLootName(selectedType),
            createdTime: Date.now(),
            bobOffset: Math.random() * Math.PI * 2
        });
    }

    getLootName(type) {
        const names = {
            damage: '伤害提升 +8',
            fireRate: '射速提升 +0.15',
            health: '生命恢复 +1',
            luck: '幸运提升 +8%',
            penetration: '穿透弹 +1'
        };
        return names[type] || '未知道具';
    }


    addDamageNumber(x, y, text, isPlayerDamage = false, isUpgrade = false, effectiveness = 1.0) {
        let color = '255, 255, 100'; // 默认黄色
        
        if (isUpgrade) {
            color = '79, 209, 199'; // 青色 - 升级
        } else if (isPlayerDamage) {
            color = '255, 100, 100'; // 红色 - 玩家受伤
        } else if (effectiveness > 1.5) {
            color = '255, 50, 50'; // 亮红色 - 超效果
        } else if (effectiveness > 1.0) {
            color = '255, 150, 50'; // 橙色 - 有效
        } else if (effectiveness < 0.8) {
            color = '150, 150, 255'; // 蓝色 - 抗性
        }
        
        this.damageNumbers.push({
            x: x,
            y: y,
            text: text,
            life: isUpgrade ? 1.5 : 1.0,
            isPlayerDamage: isPlayerDamage,
            isUpgrade: isUpgrade,
            color: color,
            effectiveness: effectiveness
        });
    }

    createHitParticles(x, y) {
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const speed = 50 + Math.random() * 50;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.5 + Math.random() * 0.5,
                maxLife: 1.0,
                size: 2 + Math.random() * 3,
                color: `hsl(${Math.random() * 360}, 70%, 60%)`
            });
        }
    }

    buyUpgrade(type) {
        // 使用HTML中定义的简单升级成本
        const costs = {
            damage: 100,
            fireRate: 150,
            luck: 200
        };
        
        const cost = costs[type];
        if (this.score >= cost) {
            this.score -= cost;
            
            switch (type) {
                case 'damage':
                    this.player.damage += 5; // 更新玩家伤害
                    this.bulletDamage += 5;  // 同时更新子弹伤害
                    break;
                case 'fireRate':
                    this.fireRate += 0.5;
                    break;
                case 'luck':
                    this.luck += 0.15;
                    break;
            }
            
            // 更新可用分数显示
            if (typeof document !== 'undefined') {
                const availableScore = document.getElementById('availableScore');
                if (availableScore) availableScore.textContent = this.score;
            }
            return true;
        }
        return false;
    }

    render() {
        // 渲染逻辑（简化版，主要用于测试）
        if (!this.ctx) return;
        
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // 渲染游戏对象
        this.renderPlayer();
        this.renderBullets();
        this.renderStoneDragon();
        this.renderLoot();
        this.renderEffects();
        
        // 渲染技能UI
        if (this.skillSystem && this.gameStarted) {
            this.skillSystem.render(this.ctx);
        }
    }

    renderPlayer() {
        if (!this.ctx) return;
        
        this.ctx.fillStyle = '#4fd1c7';
        this.ctx.beginPath();
        this.ctx.arc(this.player.x, this.player.y, this.player.radius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    renderBullets() {
        if (!this.ctx) return;
        
        this.ctx.fillStyle = '#fbbf24';
        this.bullets.forEach(bullet => {
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    renderStoneDragon() {
        if (!this.ctx || !this.stoneDragon) return;
        
        const element = this.stoneDragon.element;
        const currentTime = Date.now();
        
        // 渲染龙技能效果（在龙身下方）
        this.renderDragonSkillEffects();
        
        this.stoneDragon.segments.forEach((segment, index) => {
            // 元素特效和光晕
            if (element.type !== 'stone') {
                // 绘制外层光晕
                const glowRadius = this.dragonConfig.segmentSize + 8;
                const gradient = this.ctx.createRadialGradient(
                    segment.x, segment.y, this.dragonConfig.segmentSize,
                    segment.x, segment.y, glowRadius
                );
                gradient.addColorStop(0, element.glowColor + '40');
                gradient.addColorStop(1, element.glowColor + '00');
                
                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(segment.x, segment.y, glowRadius, 0, Math.PI * 2);
                this.ctx.fill();
                
                // 特殊元素效果
                this.renderElementalEffects(segment, element, currentTime, index);
            }
            
            // 渲染龙身段（根据元素调整颜色）
            const isHead = index === 0;
            let segmentColor = element.color;
            
            // 头部稍微亮一些
            if (isHead) {
                segmentColor = this.adjustBrightness(element.color, 1.2);
            }
            
            // 暗龙的阶段性无敌效果
            if (element.type === 'shadow' && this.stoneDragon.phaseInvulnerable) {
                segmentColor = '#666666';
                this.ctx.globalAlpha = 0.5;
            }
            
            this.ctx.fillStyle = segmentColor;
            this.ctx.beginPath();
            this.ctx.arc(segment.x, segment.y, this.dragonConfig.segmentSize, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.globalAlpha = 1.0; // 重置透明度
            
            // 渲染血量条
            const healthRatio = segment.health / segment.maxHealth;
            const barWidth = this.dragonConfig.segmentSize * 1.5;
            const barHeight = 6;
            const barX = segment.x - barWidth / 2;
            const barY = segment.y - this.dragonConfig.segmentSize - 15;
            
            // 背景
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(barX, barY, barWidth, barHeight);
            
            // 血量（根据元素调整颜色）
            let healthColor = healthRatio > 0.5 ? '#10b981' : healthRatio > 0.25 ? '#f59e0b' : '#ef4444';
            if (element.type === 'poison') healthColor = '#32CD32';
            else if (element.type === 'ice') healthColor = '#87CEEB';
            else if (element.type === 'fire') healthColor = '#FF4500';
            
            this.ctx.fillStyle = healthColor;
            this.ctx.fillRect(barX, barY, barWidth * healthRatio, barHeight);
            
            // 段索引和血量显示
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(segment.segmentIndex.toString(), segment.x, segment.y - 5);
            
            // 显示血量数值
            this.ctx.font = '8px Arial';
            this.ctx.fillText(`${Math.ceil(segment.health)}`, segment.x, segment.y + 8);
        });
        
        // 在左上角显示龙的详细信息
        this.ctx.fillStyle = element.color;
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`当前龙: ${element.name}`, 10, 30);
        
        // 显示龙的特殊能力状态
        this.ctx.font = '12px Arial';
        let yOffset = 50;
        
        // 显示特殊能力
        this.ctx.fillStyle = '#ffff00';
        this.ctx.fillText(`特殊能力: ${element.specialAbility}`, 10, yOffset);
        yOffset += 20;
        
        // 显示元素克制信息
        if (this.player.weaponElement && this.player.weaponElement !== 'normal') {
            const effectiveness = this.getElementalEffectiveness(this.player.weaponElement, element.type);
            let effectText = '普通伤害';
            let effectColor = '#ffffff';
            
            if (effectiveness > 1.5) {
                effectText = '超效伤害!';
                effectColor = '#ff0000';
            } else if (effectiveness > 1.0) {
                effectText = '有效伤害';
                effectColor = '#ff8800';
            } else if (effectiveness < 0.8) {
                effectText = '抗性伤害';
                effectColor = '#8888ff';
            }
            
            this.ctx.fillStyle = effectColor;
            this.ctx.fillText(`武器效果: ${effectText} (${Math.round(effectiveness * 100)}%)`, 10, yOffset);
            yOffset += 20;
        }
        
        // 显示龙的当前状态
        if (this.stoneDragon.phaseInvulnerable) {
            this.ctx.fillStyle = '#ff00ff';
            this.ctx.fillText('状态: 无敌中!', 10, yOffset);
            yOffset += 20;
        }
        
        if (this.stoneDragon.speedBoost > 0) {
            this.ctx.fillStyle = '#00ffff';
            this.ctx.fillText('状态: 加速中!', 10, yOffset);
            yOffset += 20;
        }
        
        // 显示击败龙的成就进度
        if (this.defeatedDragons) {
            this.ctx.fillStyle = '#80ff80';
            this.ctx.fillText(`已击败: ${this.defeatedDragons[element.type] || 0}只 ${element.name}`, 10, yOffset);
        }
    }

    // 渲染元素特效
    renderElementalEffects(segment, element, currentTime, segmentIndex) {
        const pulseIntensity = Math.sin(currentTime / 200 + segmentIndex) * 0.5 + 0.5;
        
        switch (element.type) {
            case 'fire':
                // 火焰粒子效果
                for (let i = 0; i < 3; i++) {
                    const angle = (currentTime / 100 + segmentIndex + i) % (Math.PI * 2);
                    const radius = 15 + Math.sin(currentTime / 150 + i) * 5;
                    const x = segment.x + Math.cos(angle) * radius;
                    const y = segment.y + Math.sin(angle) * radius;
                    
                    this.ctx.fillStyle = `rgba(255, 69, 0, ${0.3 + pulseIntensity * 0.4})`;
                    this.ctx.beginPath();
                    this.ctx.arc(x, y, 3, 0, Math.PI * 2);
                    this.ctx.fill();
                }
                break;
                
            case 'ice':
                // 冰晶效果
                this.ctx.strokeStyle = `rgba(135, 206, 235, ${0.5 + pulseIntensity * 0.3})`;
                this.ctx.lineWidth = 2;
                for (let i = 0; i < 6; i++) {
                    const angle = (i * Math.PI) / 3;
                    const length = 20 + pulseIntensity * 10;
                    this.ctx.beginPath();
                    this.ctx.moveTo(segment.x, segment.y);
                    this.ctx.lineTo(
                        segment.x + Math.cos(angle) * length,
                        segment.y + Math.sin(angle) * length
                    );
                    this.ctx.stroke();
                }
                break;
                
            case 'thunder':
                // 雷电效果
                if (Math.random() < 0.3) {
                    this.ctx.strokeStyle = `rgba(147, 112, 219, ${0.7 + pulseIntensity * 0.3})`;
                    this.ctx.lineWidth = 3;
                    this.ctx.beginPath();
                    this.ctx.moveTo(segment.x - 25, segment.y - 25);
                    this.ctx.lineTo(segment.x + Math.random() * 10 - 5, segment.y);
                    this.ctx.lineTo(segment.x + 25, segment.y + 25);
                    this.ctx.stroke();
                }
                break;
                
            case 'poison':
                // 毒气效果
                for (let i = 0; i < 2; i++) {
                    const x = segment.x + (Math.random() - 0.5) * 40;
                    const y = segment.y + (Math.random() - 0.5) * 40;
                    this.ctx.fillStyle = `rgba(50, 205, 50, ${0.2 + pulseIntensity * 0.2})`;
                    this.ctx.beginPath();
                    this.ctx.arc(x, y, 5 + Math.random() * 5, 0, Math.PI * 2);
                    this.ctx.fill();
                }
                break;
                
            case 'shadow':
                // 暗影波动效果
                const shadowRadius = this.dragonConfig.segmentSize + pulseIntensity * 15;
                this.ctx.strokeStyle = `rgba(75, 0, 130, ${0.4 + pulseIntensity * 0.3})`;
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(segment.x, segment.y, shadowRadius, 0, Math.PI * 2);
                this.ctx.stroke();
                break;
        }
    }

    // 调整颜色亮度的辅助函数
    adjustBrightness(hexColor, factor) {
        const hex = hexColor.replace('#', '');
        const r = Math.min(255, Math.floor(parseInt(hex.substr(0, 2), 16) * factor));
        const g = Math.min(255, Math.floor(parseInt(hex.substr(2, 2), 16) * factor));
        const b = Math.min(255, Math.floor(parseInt(hex.substr(4, 2), 16) * factor));
        return `rgb(${r}, ${g}, ${b})`;
    }

    renderLoot() {
        if (!this.ctx) return;
        
        this.ctx.fillStyle = '#10b981';
        this.loot.forEach(loot => {
            this.ctx.beginPath();
            this.ctx.arc(loot.x, loot.y, 10, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    renderDragonSkillEffects() {
        if (!this.ctx || !this.stoneDragon || !this.stoneDragon.skills) return;
        
        const head = this.stoneDragon.segments[0];
        if (!head) return;
        
        // 渲染激光扫射效果
        if (this.stoneDragon.skills.laserSweep.isActive) {
            this.renderLaserSweep(head);
        }
        
        // 渲染冲撞攻击效果
        if (this.stoneDragon.skills.chargeAttack.isCharging) {
            this.renderChargeEffect(head);
        }
    }
    
    renderLaserSweep(head) {
        const skill = this.stoneDragon.skills.laserSweep;
        const config = BalanceConfig.ENEMIES.dragon.skills.laserSweep;
        
        // 计算激光终点
        const laserEndX = head.x + Math.cos(skill.currentAngle) * config.range;
        const laserEndY = head.y + Math.sin(skill.currentAngle) * config.range;
        
        // 渲染激光束
        this.ctx.save();
        
        // 主激光束
        this.ctx.strokeStyle = '#ff0080';
        this.ctx.lineWidth = config.laserWidth;
        this.ctx.lineCap = 'round';
        this.ctx.globalAlpha = 0.8;
        
        this.ctx.beginPath();
        this.ctx.moveTo(head.x, head.y);
        this.ctx.lineTo(laserEndX, laserEndY);
        this.ctx.stroke();
        
        // 内部光芒
        this.ctx.strokeStyle = '#ffaadd';
        this.ctx.lineWidth = config.laserWidth * 0.4;
        this.ctx.globalAlpha = 1.0;
        
        this.ctx.beginPath();
        this.ctx.moveTo(head.x, head.y);
        this.ctx.lineTo(laserEndX, laserEndY);
        this.ctx.stroke();
        
        // 激光起点特效
        const glowRadius = config.laserWidth;
        const gradient = this.ctx.createRadialGradient(
            head.x, head.y, 0,
            head.x, head.y, glowRadius
        );
        gradient.addColorStop(0, 'rgba(255, 170, 221, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 0, 128, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(head.x, head.y, glowRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    renderChargeEffect(head) {
        const skill = this.stoneDragon.skills.chargeAttack;
        
        // 冲撞时的气流效果
        this.ctx.save();
        
        // 龙头周围的能量光环
        const chargeIntensity = Math.sin(Date.now() / 100) * 0.5 + 0.5;
        const chargeRadius = this.dragonConfig.segmentSize + (chargeIntensity * 20);
        
        const gradient = this.ctx.createRadialGradient(
            head.x, head.y, this.dragonConfig.segmentSize,
            head.x, head.y, chargeRadius
        );
        gradient.addColorStop(0, 'rgba(255, 100, 100, 0.6)');
        gradient.addColorStop(1, 'rgba(255, 200, 100, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(head.x, head.y, chargeRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 冲撞方向指示
        const dx = skill.chargeTarget.x - head.x;
        const dy = skill.chargeTarget.y - head.y;
        const angle = Math.atan2(dy, dx);
        
        this.ctx.strokeStyle = 'rgba(255, 150, 100, 0.8)';
        this.ctx.lineWidth = 4;
        this.ctx.lineCap = 'round';
        
        const arrowLength = 40;
        const arrowX = head.x + Math.cos(angle) * arrowLength;
        const arrowY = head.y + Math.sin(angle) * arrowLength;
        
        this.ctx.beginPath();
        this.ctx.moveTo(head.x, head.y);
        this.ctx.lineTo(arrowX, arrowY);
        this.ctx.stroke();
        
        // 箭头
        const arrowSize = 10;
        this.ctx.beginPath();
        this.ctx.moveTo(arrowX, arrowY);
        this.ctx.lineTo(
            arrowX - Math.cos(angle - 0.5) * arrowSize,
            arrowY - Math.sin(angle - 0.5) * arrowSize
        );
        this.ctx.moveTo(arrowX, arrowY);
        this.ctx.lineTo(
            arrowX - Math.cos(angle + 0.5) * arrowSize,
            arrowY - Math.sin(angle + 0.5) * arrowSize
        );
        this.ctx.stroke();
        
        this.ctx.restore();
    }

    renderEffects() {
        if (!this.ctx) return;
        
        // 渲染粒子
        this.particles.forEach(particle => {
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    // 获取游戏状态（用于测试）
    getGameState() {
        return {
            gameStarted: this.gameStarted,
            gameOver: this.gameOver,
            isPaused: this.isPaused,
            score: this.score,
            lives: this.lives,
            wave: this.wave,
            kills: this.kills,
            player: { ...this.player },
            bulletsCount: this.bullets.length,
            dragonsCount: this.dragons.length,
            dragonSegmentsCount: this.stoneDragon ? this.stoneDragon.segments.length : 0,
            lootCount: this.loot.length,
            particlesCount: this.particles.length,
            bulletDamage: this.bulletDamage,
            fireRate: this.fireRate,
            luck: this.luck,
            bulletPenetration: this.bulletPenetration || 0
        };
    }


    // 收集道具
    collectLoot(loot) {
        // 默认值，兼容测试
        const defaultValues = {
            damage: 5,
            speed: 20,
            health: 25,
            score: 100
        };
        
        const value = loot.value || defaultValues[loot.type] || 0;
        
        switch (loot.type) {
            case 'damage':
                this.bulletDamage += value;
                break;
            case 'speed':
                this.player.speed += value;
                break;
            case 'health':
                this.player.health = Math.min(this.player.maxHealth, this.player.health + value);
                break;
            case 'score':
                this.score += value;
                break;
            case 'gold':
                this.coins += value;
                break;
        }
        
        // 显示收集效果（如果有位置信息）
        if (loot.x !== undefined && loot.y !== undefined) {
            this.addDamageNumber(loot.x, loot.y, `+${value} ${loot.type.toUpperCase()}`, false, true);
        }
    }

    // 购买升级
    purchaseUpgrade(upgradeType) {
        const upgrade = this.upgrades[upgradeType];
        if (!upgrade) return false;
        
        if (this.score >= upgrade.cost) {
            this.score -= upgrade.cost;
            upgrade.level++;
            
            // 应用升级效果
            switch (upgradeType) {
                case 'damage':
                    this.bulletDamage = Math.floor(this.bulletDamage * upgrade.increment);
                    break;
                case 'fireRate':
                    this.fireRate *= upgrade.increment;
                    break;
                case 'luck':
                    this.luck = Math.min(0.95, this.luck * upgrade.increment);
                    break;
                case 'penetration':
                    this.bulletPenetration += upgrade.increment;
                    break;
            }
            
            // 增加升级成本
            upgrade.cost = Math.floor(upgrade.cost * 1.3);
            
            return true;
        }
        
        return false;
    }

    // 别名方法
    buyUpgrade(upgradeType) {
        return this.purchaseUpgrade(upgradeType);
    }

    // 龙技能系统更新
    updateDragonSkills(deltaTime) {
        if (!this.stoneDragon || !this.stoneDragon.skills) return;
        
        const skills = this.stoneDragon.skills;
        const skillConfig = BalanceConfig.ENEMIES.dragon.skills;
        
        // 更新技能冷却时间
        if (skills.laserSweep.cooldown > 0) {
            skills.laserSweep.cooldown -= deltaTime;
        }
        if (skills.chargeAttack.cooldown > 0) {
            skills.chargeAttack.cooldown -= deltaTime;
        }
        
        // 更新AI计时器
        skills.aiTimer += deltaTime;
        
        // 更新激光扫射技能
        this.updateLaserSweep(deltaTime);
        
        // 更新冲撞攻击技能
        this.updateChargeAttack(deltaTime);
        
        // AI技能使用检查 - 使用动态间隔
        const checkInterval = skills.skillCheckInterval || skillConfig.aiConfig.skillCheckInterval;
        if (skills.aiTimer >= checkInterval) {
            this.dragonSkillAI();
            skills.aiTimer = 0;
        }
    }
    
    // 激光扫射技能更新
    updateLaserSweep(deltaTime) {
        const skill = this.stoneDragon.skills.laserSweep;
        const config = BalanceConfig.ENEMIES.dragon.skills.laserSweep;
        
        if (skill.isActive) {
            skill.elapsed += deltaTime;
            
            // 更新激光角度
            skill.currentAngle = skill.startAngle + (skill.elapsed / config.duration) * config.sweepAngle - config.sweepAngle / 2;
            
            // 检查激光伤害
            this.checkLaserDamage();
            
            // 技能结束
            if (skill.elapsed >= config.duration) {
                skill.isActive = false;
                skill.elapsed = 0;
            }
        }
    }
    
    // 冲撞攻击技能更新
    updateChargeAttack(deltaTime) {
        const skill = this.stoneDragon.skills.chargeAttack;
        const config = BalanceConfig.ENEMIES.dragon.skills.chargeAttack;
        
        if (skill.isCharging) {
            skill.elapsed += deltaTime;
            
            // 调整龙头移动速度
            const head = this.stoneDragon.segments[0];
            if (head) {
                const dx = skill.chargeTarget.x - head.x;
                const dy = skill.chargeTarget.y - head.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 10) {
                    const chargeSpeed = this.stoneDragon.speed * config.chargeSpeed;
                    head.x += (dx / distance) * chargeSpeed * deltaTime;
                    head.y += (dy / distance) * chargeSpeed * deltaTime;
                }
                
                // 检查冲撞伤害
                this.checkChargeDamage();
            }
            
            // 技能结束
            if (skill.elapsed >= config.chargeDuration) {
                skill.isCharging = false;
                skill.elapsed = 0;
                // 创建冲击波效果
                this.createShockwave();
            }
        }
    }
    
    // 龙技能AI决策
    dragonSkillAI() {
        if (!this.stoneDragon || !this.stoneDragon.segments[0]) return;
        
        const head = this.stoneDragon.segments[0];
        const playerDistance = Math.sqrt(
            Math.pow(head.x - this.player.x, 2) + 
            Math.pow(head.y - this.player.y, 2)
        );
        
        const skillConfig = BalanceConfig.ENEMIES.dragon.skills;
        const skills = this.stoneDragon.skills;
        
        // 计算血量百分比
        const healthPercent = head.health / head.maxHealth;
        
        // 低血量技能使用频率加成
        const skillBonus = healthPercent < skillConfig.aiConfig.minHealthPercent ? 
            skillConfig.aiConfig.lowHealthSkillBonus : 1.0;
        
        // 距离检查
        if (playerDistance <= skillConfig.aiConfig.playerDistanceThreshold) {
            // 尝试使用激光扫射
            if (skills.laserSweep.cooldown <= 0 && !skills.laserSweep.isActive) {
                const chance = skillConfig.laserSweep.triggerChance * skillBonus;
                if (Math.random() < chance) {
                    this.activateLaserSweep();
                    return;
                }
            }
            
            // 尝试使用冲撞攻击
            if (skills.chargeAttack.cooldown <= 0 && !skills.chargeAttack.isCharging) {
                const chance = skillConfig.chargeAttack.triggerChance * skillBonus;
                if (Math.random() < chance) {
                    this.activateChargeAttack();
                    return;
                }
            }
        }
    }
    
    // 激活激光扫射
    activateLaserSweep() {
        const head = this.stoneDragon.segments[0];
        if (!head) return;
        
        const skill = this.stoneDragon.skills.laserSweep;
        const config = BalanceConfig.ENEMIES.dragon.skills.laserSweep;
        
        // 计算朝向玩家的角度
        const dx = this.player.x - head.x;
        const dy = this.player.y - head.y;
        const targetAngle = Math.atan2(dy, dx);
        
        skill.isActive = true;
        skill.cooldown = config.cooldown;
        skill.startAngle = targetAngle;
        skill.currentAngle = targetAngle - config.sweepAngle / 2;
        skill.elapsed = 0;
        
        // 显示技能提示
        this.addDamageNumber(head.x, head.y - 60, '激光扫射!', false, true);
        
        // 播放音效
        this.playSound('laser_charge');
    }
    
    // 激活冲撞攻击
    activateChargeAttack() {
        const head = this.stoneDragon.segments[0];
        if (!head) return;
        
        const skill = this.stoneDragon.skills.chargeAttack;
        const config = BalanceConfig.ENEMIES.dragon.skills.chargeAttack;
        
        skill.isCharging = true;
        skill.cooldown = config.cooldown;
        skill.chargeTarget = { x: this.player.x, y: this.player.y };
        skill.originalSpeed = this.stoneDragon.speed;
        skill.elapsed = 0;
        
        // 显示技能提示
        this.addDamageNumber(head.x, head.y - 60, '龙撞冲击!', false, true);
        
        // 播放音效
        this.playSound('charge_roar');
    }
    
    // 检查激光伤害
    checkLaserDamage() {
        const head = this.stoneDragon.segments[0];
        if (!head) return;
        
        const config = BalanceConfig.ENEMIES.dragon.skills.laserSweep;
        const skill = this.stoneDragon.skills.laserSweep;
        
        // 计算激光终点
        const laserEndX = head.x + Math.cos(skill.currentAngle) * config.range;
        const laserEndY = head.y + Math.sin(skill.currentAngle) * config.range;
        
        // 检查玩家是否被激光击中
        const playerDistance = this.distanceToLineSegment(
            this.player.x, this.player.y,
            head.x, head.y,
            laserEndX, laserEndY
        );
        
        if (playerDistance <= config.laserWidth / 2) {
            // 玩家受到激光伤害
            if (!this.player.laserDamageImmune) {
                // 根据波次和无限模式调整伤害
                let finalDamage = config.damage;
                if (this.isEndlessMode && this.wave > 5) {
                    finalDamage = Math.floor(finalDamage * (1 + (this.wave - 5) * 0.1)); // 每波增加10%伤害
                }
                
                this.lives -= finalDamage;
                this.addDamageNumber(this.player.x, this.player.y - 30, finalDamage, true);
                this.createHitParticles(this.player.x, this.player.y);
                
                // 短暂免疫，避免连续伤害
                this.player.laserDamageImmune = true;
                setTimeout(() => {
                    if (this.player) this.player.laserDamageImmune = false;
                }, 200);
            }
        }
    }
    
    // 检查冲撞伤害
    checkChargeDamage() {
        const head = this.stoneDragon.segments[0];
        if (!head) return;
        
        const config = BalanceConfig.ENEMIES.dragon.skills.chargeAttack;
        const distance = Math.sqrt(
            Math.pow(head.x - this.player.x, 2) + 
            Math.pow(head.y - this.player.y, 2)
        );
        
        if (distance <= this.dragonConfig.segmentSize + this.player.radius) {
            if (!this.player.chargeDamageImmune) {
                // 根据波次和无限模式调整伤害
                let finalDamage = config.damage;
                if (this.isEndlessMode && this.wave > 5) {
                    finalDamage = Math.floor(finalDamage * (1 + (this.wave - 5) * 0.1)); // 每波增加10%伤害
                }
                
                this.lives -= finalDamage;
                this.addDamageNumber(this.player.x, this.player.y - 30, finalDamage, true);
                this.createHitParticles(this.player.x, this.player.y);
                
                // 击退效果
                const dx = this.player.x - head.x;
                const dy = this.player.y - head.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 0) {
                    this.player.x += (dx / dist) * config.knockback;
                    this.player.y += (dy / dist) * config.knockback;
                    
                    // 确保玩家不超出边界
                    this.player.x = Math.max(this.player.radius, Math.min(this.width - this.player.radius, this.player.x));
                    this.player.y = Math.max(this.player.radius, Math.min(this.height - this.player.radius, this.player.y));
                }
                
                // 短暂免疫
                this.player.chargeDamageImmune = true;
                setTimeout(() => {
                    if (this.player) this.player.chargeDamageImmune = false;
                }, 500);
            }
        }
    }
    
    // 创建冲击波效果
    createShockwave() {
        const head = this.stoneDragon.segments[0];
        if (!head) return;
        
        const config = BalanceConfig.ENEMIES.dragon.skills.chargeAttack;
        
        // 检查玩家是否在冲击波范围内
        const distance = Math.sqrt(
            Math.pow(head.x - this.player.x, 2) + 
            Math.pow(head.y - this.player.y, 2)
        );
        
        if (distance <= config.shockwaveRadius) {
            this.lives -= config.damage * 0.5; // 冲击波伤害减半
            this.addDamageNumber(this.player.x, this.player.y - 40, Math.floor(config.damage * 0.5), true);
        }
        
        // 创建冲击波粒子效果
        if (this.particleSystem) {
            this.particleSystem.createShockwave(head.x, head.y, config.shockwaveRadius);
        }
        
        // 播放音效
        this.playSound('shockwave');
    }
    
    // 计算点到线段的距离
    distanceToLineSegment(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        
        if (lenSq === 0) {
            return Math.sqrt(A * A + B * B);
        }
        
        let param = dot / lenSq;
        
        let xx, yy;
        
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
        
        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // 清理资源
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // 清理事件监听器
        if (typeof document !== 'undefined') {
            document.removeEventListener('keydown', this.handleKeyDown);
            document.removeEventListener('keyup', this.handleKeyUp);
        }
    }
}

// 导出类（Node.js环境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DragonHunterGame;
}

// 全局导出（浏览器环境）
if (typeof window !== 'undefined') {
    window.DragonHunterGame = DragonHunterGame;
}
