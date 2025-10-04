/**
 * 技能系统
 * 管理所有主动技能和被动技能
 */
class SkillSystem {
    constructor(game) {
        this.game = game;
        this.activeSkills = {};
        this.passiveSkills = {};
        this.cooldowns = {};
        this.resources = {
            mana: 100,
            maxMana: 100,
            manaRegen: 10 // 每秒恢复
        };
        
        this.initializeSkills();
    }

    /**
     * 初始化技能配置
     */
    initializeSkills() {
        // 主动技能配置
        this.ACTIVE_SKILLS = {
            volley: {
                id: 'volley',
                name: '齐射',
                description: '向所有方向发射8枚子弹',
                manaCost: 25,
                cooldown: 5000, // 5秒
                duration: 0,
                unlock: { level: 1, cost: 0 },
                effects: {
                    bulletCount: 8,
                    damageMultiplier: 0.7,
                    spreadAngle: Math.PI * 2
                }
            },
            
            burst: {
                id: 'burst',
                name: '爆发射击',
                description: '快速连射15发子弹',
                manaCost: 30,
                cooldown: 8000, // 8秒
                duration: 2000, // 持续2秒
                unlock: { level: 3, cost: 200 },
                effects: {
                    fireRateMultiplier: 5.0,
                    damageMultiplier: 0.6
                }
            },
            
            shield: {
                id: 'shield',
                name: '能量护盾',
                description: '10秒内免疫所有伤害',
                manaCost: 40,
                cooldown: 20000, // 20秒
                duration: 10000, // 持续10秒
                unlock: { level: 5, cost: 500 },
                effects: {
                    invulnerable: true,
                    damageReduction: 1.0
                }
            },
            
            timeWarp: {
                id: 'timeWarp',
                name: '时间扭曲',
                description: '减缓所有敌人50%移动速度',
                manaCost: 35,
                cooldown: 15000, // 15秒
                duration: 8000, // 持续8秒
                unlock: { level: 7, cost: 800 },
                effects: {
                    enemySlowPercent: 0.5,
                    globalEffect: true
                }
            },
            
            elementalStorm: {
                id: 'elementalStorm',
                name: '元素风暴',
                description: '召唤随机元素的风暴攻击',
                manaCost: 50,
                cooldown: 12000, // 12秒
                duration: 5000, // 持续5秒
                unlock: { level: 10, cost: 1500 },
                effects: {
                    stormRadius: 150,
                    damagePerTick: 25,
                    tickInterval: 500,
                    elements: ['fire', 'ice', 'thunder', 'poison']
                }
            },
            
            dragonSlayer: {
                id: 'dragonSlayer',
                name: '屠龙剑气',
                description: '释放强力剑气，对龙类造成巨额伤害',
                manaCost: 60,
                cooldown: 25000, // 25秒
                duration: 0,
                unlock: { level: 15, cost: 3000 },
                effects: {
                    dragonDamageMultiplier: 10.0,
                    pierceSegments: true,
                    range: 300
                }
            }
        };

        // 被动技能配置
        this.PASSIVE_SKILLS = {
            quickReload: {
                id: 'quickReload',
                name: '快速装填',
                description: '攻击速度提升30%',
                unlock: { level: 2, cost: 150 },
                maxLevel: 5,
                effects: {
                    fireRateBonus: 0.3,
                    levelScaling: 0.1 // 每级额外+10%
                }
            },
            
            doubleShot: {
                id: 'doubleShot',
                name: '双重射击',
                description: '20%概率发射额外子弹',
                unlock: { level: 4, cost: 300 },
                maxLevel: 3,
                effects: {
                    extraShotChance: 0.2,
                    levelScaling: 0.1
                }
            },
            
            magicArmor: {
                id: 'magicArmor',
                name: '魔法护甲',
                description: '减少受到的伤害25%',
                unlock: { level: 6, cost: 600 },
                maxLevel: 4,
                effects: {
                    damageReduction: 0.25,
                    levelScaling: 0.05
                }
            },
            
            manaEfficiency: {
                id: 'manaEfficiency',
                name: '法力效率',
                description: '技能消耗减少20%，回复速度提升',
                unlock: { level: 8, cost: 1000 },
                maxLevel: 3,
                effects: {
                    manaCostReduction: 0.2,
                    manaRegenBonus: 5,
                    levelScaling: 0.1
                }
            },
            
            criticalHit: {
                id: 'criticalHit',
                name: '致命一击',
                description: '15%概率造成3倍伤害',
                unlock: { level: 9, cost: 1200 },
                maxLevel: 5,
                effects: {
                    critChance: 0.15,
                    critMultiplier: 3.0,
                    levelScaling: 0.05
                }
            },
            
            vampiric: {
                id: 'vampiric',
                name: '吸血',
                description: '击败敌人时恢复生命值',
                unlock: { level: 12, cost: 2000 },
                maxLevel: 3,
                effects: {
                    lifeSteal: 0.1,
                    healthPerKill: 10,
                    levelScaling: 5
                }
            }
        };
    }

    /**
     * 使用主动技能
     * @param {string} skillId - 技能ID
     * @returns {boolean} 是否成功使用
     */
    useActiveSkill(skillId) {
        const skill = this.ACTIVE_SKILLS[skillId];
        if (!skill) return false;

        // 检查是否已解锁
        if (!this.isSkillUnlocked(skillId)) return false;

        // 检查冷却时间
        if (this.isOnCooldown(skillId)) return false;

        // 检查法力消耗
        const actualManaCost = this.calculateManaCost(skill.manaCost);
        if (this.resources.mana < actualManaCost) return false;

        // 消耗法力
        this.resources.mana -= actualManaCost;

        // 激活技能
        this.activateSkill(skillId, skill);

        // 设置冷却
        this.cooldowns[skillId] = Date.now() + skill.cooldown;

        // 播放音效
        this.game.playSound('skill_cast');

        return true;
    }

    /**
     * 激活技能效果
     * @param {string} skillId - 技能ID
     * @param {Object} skill - 技能配置
     */
    activateSkill(skillId, skill) {
        switch (skillId) {
            case 'volley':
                this.executeVolley(skill);
                break;
            case 'burst':
                this.executeBurst(skill);
                break;
            case 'shield':
                this.executeShield(skill);
                break;
            case 'timeWarp':
                this.executeTimeWarp(skill);
                break;
            case 'elementalStorm':
                this.executeElementalStorm(skill);
                break;
            case 'dragonSlayer':
                this.executeDragonSlayer(skill);
                break;
        }
    }

    /**
     * 齐射技能实现
     */
    executeVolley(skill) {
        const effects = skill.effects;
        const angleStep = effects.spreadAngle / effects.bulletCount;
        
        for (let i = 0; i < effects.bulletCount; i++) {
            const angle = i * angleStep;
            const damage = this.game.bulletDamage * effects.damageMultiplier;
            
            this.game.bullets.push({
                x: this.game.player.x,
                y: this.game.player.y,
                angle: angle,
                speed: 400,
                damage: damage,
                element: this.game.player.weaponElement,
                life: 3.0,
                isSkillBullet: true
            });
        }
        
        this.game.addDamageNumber(
            this.game.player.x, 
            this.game.player.y - 40, 
            '齐射!', 
            false, 
            true
        );
    }

    /**
     * 爆发射击技能实现
     */
    executeBurst(skill) {
        const effects = skill.effects;
        this.activeSkills.burst = {
            endTime: Date.now() + skill.duration,
            originalFireRate: this.game.fireRate,
            burstActive: true
        };
        
        // 临时提高射速
        this.game.fireRate *= effects.fireRateMultiplier;
        
        this.game.addDamageNumber(
            this.game.player.x, 
            this.game.player.y - 40, 
            '爆发模式!', 
            false, 
            true
        );
    }

    /**
     * 能量护盾技能实现
     */
    executeShield(skill) {
        this.activeSkills.shield = {
            endTime: Date.now() + skill.duration,
            shieldActive: true
        };
        
        this.game.addDamageNumber(
            this.game.player.x, 
            this.game.player.y - 40, 
            '护盾激活!', 
            false, 
            true
        );
    }

    /**
     * 时间扭曲技能实现
     */
    executeTimeWarp(skill) {
        this.activeSkills.timeWarp = {
            endTime: Date.now() + skill.duration,
            slowActive: true,
            slowPercent: skill.effects.enemySlowPercent
        };
        
        this.game.addDamageNumber(
            this.game.width / 2, 
            50, 
            '时间扭曲!', 
            false, 
            true
        );
    }

    /**
     * 元素风暴技能实现
     */
    executeElementalStorm(skill) {
        const effects = skill.effects;
        this.activeSkills.elementalStorm = {
            endTime: Date.now() + skill.duration,
            lastTick: Date.now(),
            tickInterval: effects.tickInterval,
            damagePerTick: effects.damagePerTick,
            radius: effects.stormRadius,
            elements: effects.elements
        };
        
        this.game.addDamageNumber(
            this.game.width / 2, 
            50, 
            '元素风暴!', 
            false, 
            true
        );
    }

    /**
     * 屠龙剑气技能实现
     */
    executeDragonSlayer(skill) {
        if (!this.game.stoneDragon) return;
        
        const effects = skill.effects;
        const dragon = this.game.stoneDragon;
        
        // 对所有龙段造成巨额伤害
        const segments = Array.isArray(dragon.enhancementSegments) ? dragon.enhancementSegments : [];

        segments.forEach(segment => {
            const damage = this.game.bulletDamage * effects.dragonDamageMultiplier;
            segment.health -= damage;
            
            this.game.addDamageNumber(
                segment.x, 
                segment.y - 30, 
                `屠龙: ${Math.floor(damage)}`, 
                false, 
                false, 
                5.0
            );
        });
        
        // 创建剑气特效
        this.createSwordSlashEffect();
    }

    /**
     * 创建剑气特效
     */
    createSwordSlashEffect() {
        for (let i = 0; i < 50; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 300 + 100;
            
            this.game.particles.push({
                x: this.game.player.x,
                y: this.game.player.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: '#FFD700',
                size: Math.random() * 5 + 2,
                life: Math.random() * 1.5 + 0.5,
                maxLife: Math.random() * 1.5 + 0.5,
                alpha: 1.0
            });
        }
    }

    /**
     * 更新技能系统
     * @param {number} deltaTime - 帧时间
     */
    update(deltaTime) {
        // 更新法力回复
        this.updateManaRegen(deltaTime);
        
        // 更新主动技能状态
        this.updateActiveSkills(deltaTime);
        
        // 更新被动技能效果
        this.updatePassiveSkills();
    }

    /**
     * 更新法力回复
     */
    updateManaRegen(deltaTime) {
        const baseRegen = this.resources.manaRegen;
        const bonus = this.getPassiveEffect('manaEfficiency', 'manaRegenBonus') || 0;
        const totalRegen = baseRegen + bonus;
        
        this.resources.mana = Math.min(
            this.resources.maxMana, 
            this.resources.mana + totalRegen * deltaTime
        );
    }

    /**
     * 更新主动技能状态
     */
    updateActiveSkills(deltaTime) {
        const currentTime = Date.now();
        
        // 检查爆发射击状态
        if (this.activeSkills.burst) {
            if (currentTime >= this.activeSkills.burst.endTime) {
                this.game.fireRate = this.activeSkills.burst.originalFireRate;
                delete this.activeSkills.burst;
            }
        }
        
        // 检查护盾状态
        if (this.activeSkills.shield) {
            if (currentTime >= this.activeSkills.shield.endTime) {
                delete this.activeSkills.shield;
            }
        }
        
        // 检查时间扭曲状态
        if (this.activeSkills.timeWarp) {
            if (currentTime >= this.activeSkills.timeWarp.endTime) {
                delete this.activeSkills.timeWarp;
            }
        }
        
        // 更新元素风暴
        if (this.activeSkills.elementalStorm) {
            const storm = this.activeSkills.elementalStorm;
            if (currentTime >= storm.endTime) {
                delete this.activeSkills.elementalStorm;
            } else if (currentTime - storm.lastTick >= storm.tickInterval) {
                this.executeStormTick(storm);
                storm.lastTick = currentTime;
            }
        }
    }

    /**
     * 更新被动技能效果
     */
    updatePassiveSkills() {
        // 被动技能的效果通过 getPassiveEffect 方法在需要时计算
        // 这里可以添加需要持续更新的被动效果
        
        // 例如：更新生命回复
        const healthRegenBonus = this.getPassiveEffect('vitality', 'healthRegenBonus') || 0;
        if (healthRegenBonus > 0 && this.game.stoneDragon) {
            const regenAmount = healthRegenBonus * 0.016; // 每帧恢复
            this.game.stoneDragon.health = Math.min(
                this.game.stoneDragon.maxHealth,
                this.game.stoneDragon.health + regenAmount
            );
        }
    }

    /**
     * 执行元素风暴tick伤害
     */
    executeStormTick(storm) {
        if (!this.game.stoneDragon) return;
        
        // 随机选择元素
        const element = storm.elements[Math.floor(Math.random() * storm.elements.length)];
        
        // 对范围内的敌人造成伤害
        const segments = Array.isArray(this.game.stoneDragon.enhancementSegments)
            ? this.game.stoneDragon.enhancementSegments
            : [];

        segments.forEach(segment => {
            const distance = Math.sqrt(
                Math.pow(segment.x - this.game.width / 2, 2) + 
                Math.pow(segment.y - this.game.height / 2, 2)
            );
            
            if (distance <= storm.radius) {
                segment.health -= storm.damagePerTick;
                
                this.game.addDamageNumber(
                    segment.x, 
                    segment.y - 20, 
                    storm.damagePerTick, 
                    false, 
                    false, 
                    1.5
                );
                
                // 创建元素特效
                this.createElementalParticle(segment.x, segment.y, element);
            }
        });
    }

    /**
     * 创建元素粒子特效
     */
    createElementalParticle(x, y, element) {
        const colors = {
            fire: '#FF4500',
            ice: '#87CEEB',
            thunder: '#9370DB',
            poison: '#32CD32'
        };
        
        for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 100 + 50;
            
            this.game.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: colors[element] || '#FFFFFF',
                size: Math.random() * 3 + 1,
                life: Math.random() * 1.0 + 0.5,
                maxLife: Math.random() * 1.0 + 0.5,
                alpha: 1.0
            });
        }
    }

    /**
     * 计算实际法力消耗
     */
    calculateManaCost(baseCost) {
        const reduction = this.getPassiveEffect('manaEfficiency', 'manaCostReduction') || 0;
        return Math.max(1, Math.floor(baseCost * (1 - reduction)));
    }

    /**
     * 检查技能是否在冷却中
     */
    isOnCooldown(skillId) {
        return this.cooldowns[skillId] && Date.now() < this.cooldowns[skillId];
    }

    /**
     * 获取技能剩余冷却时间
     */
    getCooldownRemaining(skillId) {
        if (!this.cooldowns[skillId]) return 0;
        return Math.max(0, this.cooldowns[skillId] - Date.now());
    }

    /**
     * 检查技能是否已解锁
     */
    isSkillUnlocked(skillId) {
        // 这里应该检查玩家等级和是否已购买
        // 暂时返回true，实际实现时需要连接到升级系统
        return true;
    }

    /**
     * 获取被动技能效果
     */
    getPassiveEffect(skillId, effectType) {
        const skill = this.passiveSkills[skillId];
        if (!skill) return 0;
        
        const config = this.PASSIVE_SKILLS[skillId];
        const baseEffect = config.effects[effectType] || 0;
        const levelScaling = config.effects.levelScaling || 0;
        
        return baseEffect + (levelScaling * (skill.level - 1));
    }

    /**
     * 检查是否有护盾保护
     */
    hasShieldProtection() {
        return !!this.activeSkills.shield;
    }

    /**
     * 获取敌人减速效果
     */
    getEnemySlowEffect() {
        if (this.activeSkills.timeWarp) {
            return this.activeSkills.timeWarp.slowPercent;
        }
        return 0;
    }

    /**
     * 获取所有可用技能
     */
    getAvailableSkills() {
        return {
            active: this.ACTIVE_SKILLS,
            passive: this.PASSIVE_SKILLS
        };
    }

    /**
     * 渲染技能UI
     */
    render(ctx) {
        this.renderSkillBar(ctx);
        this.renderActiveEffects(ctx);
    }

    /**
     * 渲染技能栏
     */
    renderSkillBar(ctx) {
        const barY = this.game.height - 80;
        const slotSize = 50;
        const spacing = 10;
        const startX = 20;
        
        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, barY - 10, 400, 70);
        
        // 渲染技能槽
        Object.keys(this.ACTIVE_SKILLS).forEach((skillId, index) => {
            const skill = this.ACTIVE_SKILLS[skillId];
            const x = startX + index * (slotSize + spacing);
            
            // 技能槽背景
            ctx.fillStyle = this.isOnCooldown(skillId) ? '#444' : '#666';
            ctx.fillRect(x, barY, slotSize, slotSize);
            
            // 技能图标（简化为文字）
            ctx.fillStyle = '#FFF';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(skill.name.substr(0, 2), x + slotSize/2, barY + slotSize/2);
            
            // 冷却倒计时
            if (this.isOnCooldown(skillId)) {
                const remaining = Math.ceil(this.getCooldownRemaining(skillId) / 1000);
                ctx.fillStyle = '#FF0';
                ctx.font = '14px Arial';
                ctx.fillText(remaining.toString(), x + slotSize/2, barY + slotSize - 5);
            }
            
            // 法力消耗
            ctx.fillStyle = '#00F';
            ctx.font = '10px Arial';
            ctx.fillText(skill.manaCost.toString(), x + slotSize/2, barY - 2);
        });
        
        // 法力条
        const manaBarY = barY + slotSize + 10;
        const manaBarWidth = 200;
        const manaRatio = this.resources.mana / this.resources.maxMana;
        
        ctx.fillStyle = '#333';
        ctx.fillRect(startX, manaBarY, manaBarWidth, 10);
        ctx.fillStyle = '#00F';
        ctx.fillRect(startX, manaBarY, manaBarWidth * manaRatio, 10);
        
        ctx.fillStyle = '#FFF';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`法力: ${Math.floor(this.resources.mana)}/${this.resources.maxMana}`, startX, manaBarY - 5);
    }

    /**
     * 渲染活跃效果提示
     */
    renderActiveEffects(ctx) {
        let yOffset = 100;
        
        Object.keys(this.activeSkills).forEach(skillId => {
            const skill = this.ACTIVE_SKILLS[skillId];
            const activeSkill = this.activeSkills[skillId];
            
            if (activeSkill && activeSkill.endTime) {
                const remaining = Math.ceil((activeSkill.endTime - Date.now()) / 1000);
                
                ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
                ctx.font = '14px Arial';
                ctx.textAlign = 'right';
                ctx.fillText(`${skill.name}: ${remaining}s`, this.game.width - 20, yOffset);
                
                yOffset += 20;
            }
        });
    }
    
    /**
     * 重置技能系统
     * 在游戏重启时调用
     */
    reset() {
        // 重置技能状态
        this.activeSkills = {};
        this.passiveSkills = {};
        this.cooldowns = {};
        
        // 重置资源
        this.resources = {
            mana: 100,
            maxMana: 100,
            manaRegen: 10 // 每秒恢复
        };
        
        console.log('🔄 SkillSystem: 技能系统已重置');
    }
}

// 导出模块
if (typeof module === 'object' && module && module.exports) {
    module.exports = SkillSystem;
}
if (typeof globalThis !== 'undefined') {
    globalThis.SkillSystem = SkillSystem;
}
