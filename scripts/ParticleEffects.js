/**
 * 🎆 Particle Effects System - 粒子效果系统
 * 为科技风游戏提供各种视觉特效
 */

class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.maxParticles = 500;
        
        // 预定义的粒子类型
        this.particleTypes = {
            spark: { life: 1000, size: 2, speed: 3 },
            glow: { life: 2000, size: 4, speed: 1 },
            energy: { life: 1500, size: 3, speed: 2 },
            explosion: { life: 800, size: 6, speed: 5 },
            trail: { life: 500, size: 1, speed: 4 }
        };
        
        // 颜色主题
        this.colors = {
            cyan: '#00ffff',
            blue: '#0080ff',
            purple: '#8338ec',
            pink: '#ff006e',
            green: '#3fb950',
            orange: '#ff9500',
            white: '#ffffff'
        };
    }
    
    /**
     * 创建粒子
     */
    createParticle(x, y, type = 'spark', color = 'cyan', options = {}) {
        if (this.particles.length >= this.maxParticles) {
            // 移除最老的粒子
            this.particles.shift();
        }
        
        const config = this.particleTypes[type] || this.particleTypes.spark;
        const particleColor = this.colors[color] || color;
        
        const particle = {
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * config.speed * 2,
            vy: (Math.random() - 0.5) * config.speed * 2,
            life: config.life,
            maxLife: config.life,
            size: config.size + (Math.random() - 0.5),
            color: particleColor,
            type: type,
            alpha: 1,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.1,
            ...options
        };
        
        this.particles.push(particle);
        return particle;
    }
    
    /**
     * 创建技能激活特效
     */
    createSkillEffect(x, y, skillType) {
        const effectMap = {
            'barrage': () => this.createBarrageEffect(x, y),
            'burst': () => this.createBurstEffect(x, y),
            'shield': () => this.createShieldEffect(x, y),
            'timewarp': () => this.createTimeWarpEffect(x, y),
            'storm': () => this.createStormEffect(x, y),
            'dragon': () => this.createDragonEffect(x, y)
        };
        
        const effect = effectMap[skillType];
        if (effect) {
            effect();
        } else {
            this.createDefaultSkillEffect(x, y);
        }
    }
    
    /**
     * 齐射技能特效
     */
    createBarrageEffect(x, y) {
        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2;
            const distance = 30 + Math.random() * 20;
            const px = x + Math.cos(angle) * distance;
            const py = y + Math.sin(angle) * distance;
            
            this.createParticle(px, py, 'energy', 'cyan', {
                vx: Math.cos(angle) * 3,
                vy: Math.sin(angle) * 3,
                size: 3 + Math.random() * 2
            });
        }
        
        // 中心爆发
        for (let i = 0; i < 8; i++) {
            this.createParticle(x, y, 'spark', 'white', {
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6
            });
        }
    }
    
    /**
     * 爆发射击特效
     */
    createBurstEffect(x, y) {
        for (let i = 0; i < 12; i++) {
            this.createParticle(x, y, 'spark', 'orange', {
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                size: 2 + Math.random() * 3
            });
        }
    }
    
    /**
     * 护盾技能特效
     */
    createShieldEffect(x, y) {
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const radius = 40;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            
            this.createParticle(px, py, 'glow', 'blue', {
                vx: Math.cos(angle) * 1,
                vy: Math.sin(angle) * 1,
                life: 3000,
                size: 4
            });
        }
    }
    
    /**
     * 时间扭曲特效
     */
    createTimeWarpEffect(x, y) {
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 60;
            const px = x + Math.cos(angle) * distance;
            const py = y + Math.sin(angle) * distance;
            
            this.createParticle(px, py, 'energy', 'purple', {
                vx: Math.cos(angle + Math.PI) * 2,
                vy: Math.sin(angle + Math.PI) * 2,
                life: 2000,
                size: 2 + Math.random()
            });
        }
    }
    
    /**
     * 元素风暴特效
     */
    createStormEffect(x, y) {
        const colors = ['cyan', 'purple', 'pink', 'green'];
        
        for (let i = 0; i < 25; i++) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            this.createParticle(x, y, 'energy', color, {
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 1500 + Math.random() * 1000,
                size: 3 + Math.random() * 2
            });
        }
    }
    
    /**
     * 屠龙剑气特效
     */
    createDragonEffect(x, y) {
        // 剑气轨迹
        for (let i = 0; i < 20; i++) {
            this.createParticle(x, y, 'trail', 'white', {
                vx: (Math.random() - 0.5) * 12,
                vy: (Math.random() - 0.5) * 12,
                size: 4 + Math.random() * 3,
                life: 1000
            });
        }
        
        // 金色光芒
        for (let i = 0; i < 15; i++) {
            this.createParticle(x, y, 'glow', '#ffd700', {
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                size: 5 + Math.random() * 2,
                life: 2000
            });
        }
    }
    
    /**
     * 默认技能特效
     */
    createDefaultSkillEffect(x, y) {
        for (let i = 0; i < 10; i++) {
            this.createParticle(x, y, 'spark', 'cyan', {
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6
            });
        }
    }
    
    /**
     * 创建命中特效
     */
    createHitEffect(x, y, damage, isCritical = false) {
        const color = isCritical ? 'pink' : 'orange';
        const particleCount = isCritical ? 15 : 8;
        
        for (let i = 0; i < particleCount; i++) {
            this.createParticle(x, y, 'spark', color, {
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                size: isCritical ? 3 + Math.random() * 2 : 2 + Math.random()
            });
        }
        
        // 创建伤害数字
        this.createDamageNumber(x, y, damage, isCritical);
    }
    
    /**
     * 创建伤害数字显示
     */
    createDamageNumber(x, y, damage, isCritical = false) {
        const damageText = document.createElement('div');
        damageText.className = `damage-number ${isCritical ? 'critical-hit' : ''}`;
        damageText.textContent = Math.round(damage);
        damageText.style.left = x + 'px';
        damageText.style.top = y + 'px';
        
        document.body.appendChild(damageText);
        
        setTimeout(() => {
            if (damageText.parentNode) {
                damageText.parentNode.removeChild(damageText);
            }
        }, 1000);
    }
    
    /**
     * 创建治疗特效
     */
    createHealEffect(x, y, amount) {
        for (let i = 0; i < 8; i++) {
            this.createParticle(x, y, 'glow', 'green', {
                vx: (Math.random() - 0.5) * 3,
                vy: -Math.random() * 4 - 1,
                size: 3 + Math.random(),
                life: 2000
            });
        }
        
        // 治疗数字
        const healText = document.createElement('div');
        healText.className = 'damage-number';
        healText.style.color = '#3fb950';
        healText.textContent = '+' + Math.round(amount);
        healText.style.left = x + 'px';
        healText.style.top = y + 'px';
        
        document.body.appendChild(healText);
        
        setTimeout(() => {
            if (healText.parentNode) {
                healText.parentNode.removeChild(healText);
            }
        }, 1000);
    }
    
    /**
     * 创建升级特效
     */
    createLevelUpEffect(x, y) {
        // 闪光环
        for (let i = 0; i < 24; i++) {
            const angle = (i / 24) * Math.PI * 2;
            const radius = 50;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            
            this.createParticle(px, py, 'glow', 'white', {
                vx: Math.cos(angle) * 2,
                vy: Math.sin(angle) * 2,
                size: 4,
                life: 2000
            });
        }
        
        // 中心爆发
        for (let i = 0; i < 20; i++) {
            this.createParticle(x, y, 'spark', 'cyan', {
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                size: 3 + Math.random() * 2,
                life: 1500
            });
        }
    }
    
    /**
     * 创建环境粒子（背景效果）
     */
    createAmbientParticles() {
        if (Math.random() < 0.3) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            
            this.createParticle(x, y, 'glow', 'cyan', {
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: 1 + Math.random(),
                life: 5000 + Math.random() * 3000,
                alpha: 0.3
            });
        }
    }
    
    /**
     * 更新所有粒子
     */
    update(deltaTime) {
        // 更新现有粒子
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // 更新位置
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // 更新旋转
            particle.rotation += particle.rotationSpeed;
            
            // 更新生命周期
            particle.life -= deltaTime;
            particle.alpha = Math.max(0, particle.life / particle.maxLife);
            
            // 添加重力效果（某些类型）
            if (particle.type === 'spark' || particle.type === 'explosion') {
                particle.vy += 0.1;
            }
            
            // 添加阻力
            particle.vx *= 0.98;
            particle.vy *= 0.98;
            
            // 移除死亡的粒子
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
        
        // 偶尔创建环境粒子
        this.createAmbientParticles();
    }
    
    /**
     * 渲染所有粒子
     */
    render() {
        this.ctx.save();
        
        for (const particle of this.particles) {
            this.ctx.save();
            
            // 设置透明度
            this.ctx.globalAlpha = particle.alpha;
            
            // 移动到粒子位置
            this.ctx.translate(particle.x, particle.y);
            this.ctx.rotate(particle.rotation);
            
            // 设置颜色和发光效果
            this.ctx.fillStyle = particle.color;
            this.ctx.shadowColor = particle.color;
            this.ctx.shadowBlur = particle.size * 2;
            
            // 根据类型渲染不同形状
            switch (particle.type) {
                case 'spark':
                    this.renderSpark(particle);
                    break;
                case 'glow':
                    this.renderGlow(particle);
                    break;
                case 'energy':
                    this.renderEnergy(particle);
                    break;
                case 'explosion':
                    this.renderExplosion(particle);
                    break;
                case 'trail':
                    this.renderTrail(particle);
                    break;
                case 'shockwave':
                    this.renderShockwave(particle);
                    break;
                default:
                    this.renderDefault(particle);
            }
            
            this.ctx.restore();
        }
        
        this.ctx.restore();
    }
    
    /**
     * 渲染火花粒子
     */
    renderSpark(particle) {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 添加亮点
        this.ctx.fillStyle = 'white';
        this.ctx.globalAlpha *= 0.8;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, particle.size * 0.5, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    /**
     * 渲染发光粒子
     */
    renderGlow(particle) {
        const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, particle.size);
        gradient.addColorStop(0, particle.color);
        gradient.addColorStop(1, 'transparent');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    /**
     * 渲染能量粒子
     */
    renderEnergy(particle) {
        this.ctx.beginPath();
        this.ctx.rect(-particle.size/2, -particle.size/2, particle.size, particle.size);
        this.ctx.fill();
        
        // 旋转的内核
        this.ctx.fillStyle = 'white';
        this.ctx.globalAlpha *= 0.6;
        this.ctx.beginPath();
        this.ctx.rect(-particle.size/4, -particle.size/4, particle.size/2, particle.size/2);
        this.ctx.fill();
    }
    
    /**
     * 渲染爆炸粒子
     */
    renderExplosion(particle) {
        const spikes = 6;
        this.ctx.beginPath();
        
        for (let i = 0; i < spikes; i++) {
            const angle = (i / spikes) * Math.PI * 2;
            const x = Math.cos(angle) * particle.size;
            const y = Math.sin(angle) * particle.size;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    /**
     * 渲染拖尾粒子
     */
    renderTrail(particle) {
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, particle.size * 2, particle.size, 0, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    /**
     * 渲染默认粒子
     */
    renderDefault(particle) {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    /**
     * 清除所有粒子
     */
    clear() {
        this.particles = [];
    }
    
    /**
     * 获取粒子数量
     */
    getParticleCount() {
        return this.particles.length;
    }
    
    /**
     * 创建冲击波效果
     */
    createShockwave(x, y, radius, intensity = 1.0) {
        const particleCount = Math.floor(30 * intensity);
        
        // 创建冲击波环形粒子
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const distance = radius * (0.8 + Math.random() * 0.4);
            
            const particle = {
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                vx: Math.cos(angle) * 2,
                vy: Math.sin(angle) * 2,
                size: 4 + Math.random() * 6,
                life: 1.0,
                maxLife: 1000 + Math.random() * 500,
                color: `hsla(${30 + Math.random() * 60}, 100%, ${50 + Math.random() * 30}%, `,
                type: 'shockwave',
                startSize: 4 + Math.random() * 6,
                endSize: 1
            };
            
            this.particles.push(particle);
        }
        
        // 创建中心爆炸粒子
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            
            const particle = {
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 6 + Math.random() * 8,
                life: 1.0,
                maxLife: 800 + Math.random() * 400,
                color: `hsla(${15 + Math.random() * 30}, 100%, ${60 + Math.random() * 40}%, `,
                type: 'explosion',
                startSize: 6 + Math.random() * 8,
                endSize: 0
            };
            
            this.particles.push(particle);
        }
    }
    
    /**
     * 渲染冲击波粒子
     */
    renderShockwave(particle) {
        // 冲击波环形效果
        this.ctx.beginPath();
        this.ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 添加内部发光
        this.ctx.globalAlpha *= 0.5;
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, particle.size * 0.6, 0, Math.PI * 2);
        this.ctx.fill();
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ParticleSystem;
} else if (typeof window !== 'undefined') {
    window.ParticleSystem = ParticleSystem;
}
