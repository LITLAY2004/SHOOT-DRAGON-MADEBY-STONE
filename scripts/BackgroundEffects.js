/**
 * 🌌 Background Effects System - 背景效果系统
 * 创建动态科技背景和环境效果
 */

class BackgroundEffects {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // 网格系统
        this.grid = {
            size: 50,
            offset: { x: 0, y: 0 },
            speed: 0.5,
            opacity: 0.1,
            color: '#00ffff'
        };
        
        // 数据流
        this.dataStreams = [];
        this.maxDataStreams = 8;
        
        // 脉冲环
        this.pulseRings = [];
        this.maxPulseRings = 3;
        
        // 光束
        this.lightBeams = [];
        this.maxLightBeams = 5;
        
        // 浮动图标
        this.floatingIcons = [];
        this.maxFloatingIcons = 12;
        
        this.time = 0;
        
        this.initializeEffects();
    }
    
    /**
     * 初始化背景效果
     */
    initializeEffects() {
        this.generateDataStreams();
        this.generatePulseRings();
        this.generateLightBeams();
        this.generateFloatingIcons();
    }
    
    /**
     * 生成数据流
     */
    generateDataStreams() {
        for (let i = 0; i < this.maxDataStreams; i++) {
            this.dataStreams.push({
                x: Math.random() * this.canvas.width,
                y: -50,
                speed: 1 + Math.random() * 2,
                length: 80 + Math.random() * 120,
                opacity: 0.3 + Math.random() * 0.4,
                color: this.getRandomCyberColor(),
                data: this.generateBinaryString(20 + Math.random() * 30)
            });
        }
    }
    
    /**
     * 生成脉冲环
     */
    generatePulseRings() {
        for (let i = 0; i < this.maxPulseRings; i++) {
            this.pulseRings.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                radius: 0,
                maxRadius: 100 + Math.random() * 200,
                speed: 0.5 + Math.random() * 1,
                opacity: 0.5,
                color: this.getRandomCyberColor(),
                life: 0,
                maxLife: 3000 + Math.random() * 2000
            });
        }
    }
    
    /**
     * 生成光束
     */
    generateLightBeams() {
        for (let i = 0; i < this.maxLightBeams; i++) {
            this.lightBeams.push({
                startX: Math.random() * this.canvas.width,
                startY: Math.random() * this.canvas.height,
                endX: Math.random() * this.canvas.width,
                endY: Math.random() * this.canvas.height,
                opacity: 0.2 + Math.random() * 0.3,
                color: this.getRandomCyberColor(),
                pulseSpeed: 0.02 + Math.random() * 0.03,
                life: 0,
                maxLife: 4000 + Math.random() * 3000
            });
        }
    }
    
    /**
     * 生成浮动图标
     */
    generateFloatingIcons() {
        const icons = ['⚡', '🔹', '🔸', '◆', '◇', '▲', '▼', '●', '◐', '◑'];
        
        for (let i = 0; i < this.maxFloatingIcons; i++) {
            this.floatingIcons.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                icon: icons[Math.floor(Math.random() * icons.length)],
                size: 12 + Math.random() * 8,
                opacity: 0.1 + Math.random() * 0.2,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.02,
                pulsePhase: Math.random() * Math.PI * 2,
                color: this.getRandomCyberColor()
            });
        }
    }
    
    /**
     * 获取随机赛博朋克颜色
     */
    getRandomCyberColor() {
        const colors = [
            '#00ffff', // 青色
            '#0080ff', // 蓝色
            '#8338ec', // 紫色
            '#ff006e', // 粉色
            '#3fb950', // 绿色
            '#ff9500'  // 橙色
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    /**
     * 生成二进制字符串
     */
    generateBinaryString(length) {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += Math.random() > 0.5 ? '1' : '0';
        }
        return result;
    }
    
    /**
     * 更新所有效果
     */
    update(deltaTime) {
        this.time += deltaTime;
        
        this.updateGrid(deltaTime);
        this.updateDataStreams(deltaTime);
        this.updatePulseRings(deltaTime);
        this.updateLightBeams(deltaTime);
        this.updateFloatingIcons(deltaTime);
    }
    
    /**
     * 更新网格
     */
    updateGrid(deltaTime) {
        this.grid.offset.x += this.grid.speed;
        this.grid.offset.y += this.grid.speed;
        
        if (this.grid.offset.x >= this.grid.size) {
            this.grid.offset.x = 0;
        }
        if (this.grid.offset.y >= this.grid.size) {
            this.grid.offset.y = 0;
        }
    }
    
    /**
     * 更新数据流
     */
    updateDataStreams(deltaTime) {
        for (let i = this.dataStreams.length - 1; i >= 0; i--) {
            const stream = this.dataStreams[i];
            
            stream.y += stream.speed;
            
            // 重置超出屏幕的数据流
            if (stream.y > this.canvas.height + stream.length) {
                stream.y = -stream.length;
                stream.x = Math.random() * this.canvas.width;
                stream.data = this.generateBinaryString(20 + Math.random() * 30);
                stream.color = this.getRandomCyberColor();
            }
        }
    }
    
    /**
     * 更新脉冲环
     */
    updatePulseRings(deltaTime) {
        for (let i = this.pulseRings.length - 1; i >= 0; i--) {
            const ring = this.pulseRings[i];
            
            ring.life += deltaTime;
            ring.radius += ring.speed;
            ring.opacity = Math.max(0, 0.5 * (1 - ring.life / ring.maxLife));
            
            // 重置完成的脉冲环
            if (ring.life >= ring.maxLife) {
                ring.x = Math.random() * this.canvas.width;
                ring.y = Math.random() * this.canvas.height;
                ring.radius = 0;
                ring.life = 0;
                ring.color = this.getRandomCyberColor();
                ring.maxRadius = 100 + Math.random() * 200;
            }
        }
    }
    
    /**
     * 更新光束
     */
    updateLightBeams(deltaTime) {
        for (let i = this.lightBeams.length - 1; i >= 0; i--) {
            const beam = this.lightBeams[i];
            
            beam.life += deltaTime;
            
            // 脉冲效果
            const pulseIntensity = Math.sin(beam.life * beam.pulseSpeed) * 0.5 + 0.5;
            beam.currentOpacity = beam.opacity * pulseIntensity;
            
            // 重置光束
            if (beam.life >= beam.maxLife) {
                beam.startX = Math.random() * this.canvas.width;
                beam.startY = Math.random() * this.canvas.height;
                beam.endX = Math.random() * this.canvas.width;
                beam.endY = Math.random() * this.canvas.height;
                beam.life = 0;
                beam.color = this.getRandomCyberColor();
            }
        }
    }
    
    /**
     * 更新浮动图标
     */
    updateFloatingIcons(deltaTime) {
        for (const icon of this.floatingIcons) {
            icon.x += icon.vx;
            icon.y += icon.vy;
            icon.rotation += icon.rotationSpeed;
            icon.pulsePhase += 0.02;
            
            // 边界反弹
            if (icon.x < 0 || icon.x > this.canvas.width) {
                icon.vx = -icon.vx;
            }
            if (icon.y < 0 || icon.y > this.canvas.height) {
                icon.vy = -icon.vy;
            }
            
            // 保持在画布内
            icon.x = Math.max(0, Math.min(this.canvas.width, icon.x));
            icon.y = Math.max(0, Math.min(this.canvas.height, icon.y));
            
            // 脉冲透明度
            icon.currentOpacity = icon.opacity * (Math.sin(icon.pulsePhase) * 0.3 + 0.7);
        }
    }
    
    /**
     * 渲染所有背景效果
     */
    render() {
        this.ctx.save();
        
        this.renderGrid();
        this.renderLightBeams();
        this.renderPulseRings();
        this.renderDataStreams();
        this.renderFloatingIcons();
        
        this.ctx.restore();
    }
    
    /**
     * 渲染网格
     */
    renderGrid() {
        this.ctx.save();
        this.ctx.strokeStyle = this.grid.color;
        this.ctx.globalAlpha = this.grid.opacity;
        this.ctx.lineWidth = 1;
        
        // 垂直线
        for (let x = -this.grid.size + this.grid.offset.x; x <= this.canvas.width; x += this.grid.size) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // 水平线
        for (let y = -this.grid.size + this.grid.offset.y; y <= this.canvas.height; y += this.grid.size) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }
    
    /**
     * 渲染数据流
     */
    renderDataStreams() {
        this.ctx.save();
        this.ctx.font = '12px monospace';
        
        for (const stream of this.dataStreams) {
            this.ctx.save();
            this.ctx.fillStyle = stream.color;
            this.ctx.globalAlpha = stream.opacity;
            this.ctx.shadowColor = stream.color;
            this.ctx.shadowBlur = 5;
            
            // 渲染二进制数据
            const chars = stream.data.split('');
            for (let i = 0; i < chars.length; i++) {
                const charY = stream.y - i * 15;
                const alpha = Math.max(0, 1 - i / chars.length);
                this.ctx.globalAlpha = stream.opacity * alpha;
                
                if (charY > -20 && charY < this.canvas.height + 20) {
                    this.ctx.fillText(chars[i], stream.x, charY);
                }
            }
            
            this.ctx.restore();
        }
        
        this.ctx.restore();
    }
    
    /**
     * 渲染脉冲环
     */
    renderPulseRings() {
        this.ctx.save();
        
        for (const ring of this.pulseRings) {
            if (ring.opacity <= 0) continue;
            
            this.ctx.save();
            this.ctx.strokeStyle = ring.color;
            this.ctx.globalAlpha = ring.opacity;
            this.ctx.lineWidth = 2;
            this.ctx.shadowColor = ring.color;
            this.ctx.shadowBlur = 10;
            
            this.ctx.beginPath();
            this.ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // 内环
            if (ring.radius > 20) {
                this.ctx.globalAlpha = ring.opacity * 0.5;
                this.ctx.beginPath();
                this.ctx.arc(ring.x, ring.y, ring.radius - 10, 0, Math.PI * 2);
                this.ctx.stroke();
            }
            
            this.ctx.restore();
        }
        
        this.ctx.restore();
    }
    
    /**
     * 渲染光束
     */
    renderLightBeams() {
        this.ctx.save();
        
        for (const beam of this.lightBeams) {
            this.ctx.save();
            this.ctx.strokeStyle = beam.color;
            this.ctx.globalAlpha = beam.currentOpacity || beam.opacity;
            this.ctx.lineWidth = 1;
            this.ctx.shadowColor = beam.color;
            this.ctx.shadowBlur = 8;
            
            this.ctx.beginPath();
            this.ctx.moveTo(beam.startX, beam.startY);
            this.ctx.lineTo(beam.endX, beam.endY);
            this.ctx.stroke();
            
            this.ctx.restore();
        }
        
        this.ctx.restore();
    }
    
    /**
     * 渲染浮动图标
     */
    renderFloatingIcons() {
        this.ctx.save();
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        for (const icon of this.floatingIcons) {
            this.ctx.save();
            this.ctx.translate(icon.x, icon.y);
            this.ctx.rotate(icon.rotation);
            this.ctx.globalAlpha = icon.currentOpacity;
            this.ctx.fillStyle = icon.color;
            this.ctx.shadowColor = icon.color;
            this.ctx.shadowBlur = 5;
            
            this.ctx.fillText(icon.icon, 0, 0);
            
            this.ctx.restore();
        }
        
        this.ctx.restore();
    }
    
    /**
     * 添加特殊效果
     */
    addSpecialEffect(type, x, y) {
        switch (type) {
            case 'pulse':
                this.addPulseRing(x, y);
                break;
            case 'beam':
                this.addLightBeam(x, y);
                break;
            case 'scan':
                this.addScanLine(x, y);
                break;
        }
    }
    
    /**
     * 添加脉冲环
     */
    addPulseRing(x, y) {
        this.pulseRings.push({
            x: x,
            y: y,
            radius: 0,
            maxRadius: 150,
            speed: 2,
            opacity: 0.8,
            color: this.getRandomCyberColor(),
            life: 0,
            maxLife: 2000
        });
    }
    
    /**
     * 添加光束
     */
    addLightBeam(x, y) {
        const angle = Math.random() * Math.PI * 2;
        const length = 200 + Math.random() * 300;
        
        this.lightBeams.push({
            startX: x,
            startY: y,
            endX: x + Math.cos(angle) * length,
            endY: y + Math.sin(angle) * length,
            opacity: 0.6,
            color: this.getRandomCyberColor(),
            pulseSpeed: 0.05,
            life: 0,
            maxLife: 1500
        });
    }
    
    /**
     * 设置强度
     */
    setIntensity(intensity) {
        intensity = Math.max(0, Math.min(1, intensity));
        
        this.grid.opacity = 0.05 + intensity * 0.15;
        
        // 调整数据流数量
        const targetStreams = Math.floor(4 + intensity * 8);
        while (this.dataStreams.length < targetStreams) {
            this.dataStreams.push({
                x: Math.random() * this.canvas.width,
                y: -50,
                speed: 1 + Math.random() * 2,
                length: 80 + Math.random() * 120,
                opacity: 0.3 + Math.random() * 0.4,
                color: this.getRandomCyberColor(),
                data: this.generateBinaryString(20 + Math.random() * 30)
            });
        }
        
        while (this.dataStreams.length > targetStreams) {
            this.dataStreams.pop();
        }
    }
    
    /**
     * 重置效果
     */
    reset() {
        this.dataStreams = [];
        this.pulseRings = [];
        this.lightBeams = [];
        this.floatingIcons = [];
        this.time = 0;
        
        this.initializeEffects();
    }
    
    /**
     * 设置背景主题
     * @param {string} theme - 主题名称 (tech, forest, volcano, cosmic等)
     */
    setTheme(theme = 'tech') {
        // 定义不同主题的颜色配置
        const themes = {
            tech: {
                gridColor: '#00ffff',
                dataStreamColor: '#00ff41',
                pulseColor: '#ff0080',
                lightBeamColor: '#ffffff'
            },
            forest: {
                gridColor: '#228B22',
                dataStreamColor: '#32CD32',
                pulseColor: '#90EE90',
                lightBeamColor: '#9AFF9A'
            },
            volcano: {
                gridColor: '#FF4500',
                dataStreamColor: '#FF6347',
                pulseColor: '#FFD700',
                lightBeamColor: '#FFFF00'
            },
            cosmic: {
                gridColor: '#8A2BE2',
                dataStreamColor: '#9370DB',
                pulseColor: '#DA70D6',
                lightBeamColor: '#E6E6FA'
            },
            ice: {
                gridColor: '#87CEEB',
                dataStreamColor: '#00BFFF',
                pulseColor: '#B0E0E6',
                lightBeamColor: '#F0F8FF'
            }
        };
        
        // 应用主题配置
        const config = themes[theme] || themes.tech;
        this.grid.color = config.gridColor;
        
        // 更新现有效果的颜色
        this.dataStreams.forEach(stream => {
            stream.color = config.dataStreamColor;
        });
        
        this.pulseRings.forEach(ring => {
            ring.color = config.pulseColor;
        });
        
        this.lightBeams.forEach(beam => {
            beam.color = config.lightBeamColor;
        });
        
        console.log(`🎨 背景主题已设置为: ${theme}`);
    }
    
    /**
     * 获取当前主题
     */
    getCurrentTheme() {
        // 根据当前颜色判断主题
        const gridColor = this.grid.color;
        if (gridColor === '#00ffff') return 'tech';
        if (gridColor === '#228B22') return 'forest';
        if (gridColor === '#FF4500') return 'volcano';
        if (gridColor === '#8A2BE2') return 'cosmic';
        if (gridColor === '#87CEEB') return 'ice';
        return 'tech'; // 默认
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BackgroundEffects;
} else if (typeof window !== 'undefined') {
    window.BackgroundEffects = BackgroundEffects;
}
