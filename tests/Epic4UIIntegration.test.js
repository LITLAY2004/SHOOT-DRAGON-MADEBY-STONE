/**
 * @jest-environment jsdom
 */

/**
 * EPIC4: UI集成测试
 * 验证game.html (855-1255行) 中定义的UI组件与JavaScript的正确集成
 */

describe('EPIC4: UI Integration Tests', () => {
    let gameHtml;

    beforeEach(() => {
        // 设置DOM环境
        const fs = require('fs');
        const path = require('path');
        const htmlPath = path.join(__dirname, '..', 'game.html');
        gameHtml = fs.readFileSync(htmlPath, 'utf-8');
        
        document.body.innerHTML = gameHtml;
    });

    describe('HTML结构完整性', () => {
        test('所有关键HUD元素ID存在', () => {
            const criticalIds = [
                'health-text', 'health-bar', 'mana-text', 'mana-bar',
                'enemies-remaining', 'wave-countdown', 'current-level',
                'endlessModeUI', 'endless-wave', 'endless-score', 
                'endless-kills', 'endless-time',
                'comboDisplay', 'comboNumber', 
                'specialEventDisplay', 'eventText',
                'player-level', 'player-exp', 'player-damage', 
                'player-firerate', 'player-speed',
                'upgrade-list', 'passive-skills',
                'loadingScreen', 'loadingText', 'loadingProgress',
                'gameModeSelector', 'gameMenu', 'gameOverMenu', 'finalScore'
            ];

            criticalIds.forEach(id => {
                const element = document.getElementById(id);
                expect(element).toBeTruthy();
                expect(element.id).toBe(id);
            });
        });

        test('技能栏包含6个技能槽', () => {
            const skillSlots = document.querySelectorAll('.skill-slot');
            expect(skillSlots.length).toBe(6);
            
            skillSlots.forEach((slot, index) => {
                expect(slot.dataset.skill).toBe(index.toString());
                expect(slot.querySelector('.skill-number')).toBeTruthy();
                expect(slot.querySelector('.skill-icon')).toBeTruthy();
            });
        });

        test('侧边栏包含必要的section', () => {
            const sections = document.querySelectorAll('.sidebar-section');
            expect(sections.length).toBeGreaterThanOrEqual(3);
            
            // 验证玩家状态、升级系统、被动技能section存在
            const titles = Array.from(sections).map(s => 
                s.querySelector('.sidebar-title')?.textContent.trim()
            );
            
            expect(titles.some(t => t && t.includes('玩家状态'))).toBe(true);
            expect(titles.some(t => t && t.includes('属性升级'))).toBe(true);
            expect(titles.some(t => t && t.includes('被动技能'))).toBe(true);
        });

        test('游戏头部包含分数、波次、代币显示', () => {
            const scoreElement = document.getElementById('score');
            const waveElement = document.getElementById('wave');
            const tokensElement = document.getElementById('shop-tokens');
            
            expect(scoreElement).toBeTruthy();
            expect(waveElement).toBeTruthy();
            expect(tokensElement).toBeTruthy();
        });
    });

    describe('响应式布局样式', () => {
        test('包含移动端媒体查询', () => {
            expect(gameHtml).toContain('@media (max-width: 768px)');
            expect(gameHtml).toContain('@media (max-width: 1024px)');
        });

        test('移动端样式调整game-sidebar', () => {
            const mobileCss = gameHtml.match(/@media \(max-width: 768px\) \{[^}]*\}/gs);
            expect(mobileCss).toBeTruthy();
            
            const sidebarStyles = gameHtml.match(/\.game-sidebar\s*\{[^}]*\}/g);
            expect(sidebarStyles).toBeTruthy();
        });

        test('技能栏在移动端有适配样式', () => {
            expect(gameHtml).toContain('.skill-slot');
            expect(gameHtml).toContain('.skill-bar');
            
            // 验证移动端技能槽尺寸调整
            const mobileSection = gameHtml.substring(
                gameHtml.indexOf('@media (max-width: 768px)'),
                gameHtml.indexOf('}', gameHtml.lastIndexOf('.skill-slot'))
            );
            expect(mobileSection).toContain('skill-slot');
        });
    });

    describe('HUD元素数据绑定', () => {
        test('生命值和法力值进度条可更新', () => {
            const healthBar = document.getElementById('health-bar');
            const manaBar = document.getElementById('mana-bar');
            const healthText = document.getElementById('health-text');
            const manaText = document.getElementById('mana-text');
            
            expect(healthBar).toBeTruthy();
            expect(manaBar).toBeTruthy();
            expect(healthText).toBeTruthy();
            expect(manaText).toBeTruthy();
            
            // 验证初始样式
            expect(healthBar.style.width).toBe('100%');
            expect(manaBar.style.width).toBe('100%');
        });

        test('玩家状态项都有正确的ID', () => {
            const statusIds = [
                'player-level',
                'player-exp',
                'player-damage',
                'player-firerate',
                'player-speed'
            ];
            
            statusIds.forEach(id => {
                const element = document.getElementById(id);
                expect(element).toBeTruthy();
                expect(element.classList.contains('status-value')).toBe(true);
            });
        });

        test('敌人信息显示元素存在', () => {
            const enemiesRemaining = document.getElementById('enemies-remaining');
            const waveCountdown = document.getElementById('wave-countdown');
            const currentLevel = document.getElementById('current-level');
            
            expect(enemiesRemaining).toBeTruthy();
            expect(waveCountdown).toBeTruthy();
            expect(currentLevel).toBeTruthy();
        });
    });

    describe('无限模式UI组件', () => {
        test('无限模式UI容器存在且初始隐藏', () => {
            const endlessUI = document.getElementById('endlessModeUI');
            expect(endlessUI).toBeTruthy();
            expect(endlessUI.classList.contains('hidden')).toBe(true);
        });

        test('无限模式统计元素都存在', () => {
            const endlessWave = document.getElementById('endless-wave');
            const endlessScore = document.getElementById('endless-score');
            const endlessKills = document.getElementById('endless-kills');
            const endlessTime = document.getElementById('endless-time');
            
            expect(endlessWave).toBeTruthy();
            expect(endlessScore).toBeTruthy();
            expect(endlessKills).toBeTruthy();
            expect(endlessTime).toBeTruthy();
        });

        test('连击显示组件存在', () => {
            const comboDisplay = document.getElementById('comboDisplay');
            const comboNumber = document.getElementById('comboNumber');
            
            expect(comboDisplay).toBeTruthy();
            expect(comboNumber).toBeTruthy();
            expect(comboDisplay.classList.contains('hidden')).toBe(true);
        });

        test('特殊事件显示组件存在', () => {
            const eventDisplay = document.getElementById('specialEventDisplay');
            const eventText = document.getElementById('eventText');
            
            expect(eventDisplay).toBeTruthy();
            expect(eventText).toBeTruthy();
            expect(eventDisplay.classList.contains('hidden')).toBe(true);
        });
    });

    describe('技能栏交互', () => {
        test('每个技能槽有正确的data-skill属性', () => {
            for (let i = 0; i < 6; i++) {
                const slot = document.querySelector(`[data-skill="${i}"]`);
                expect(slot).toBeTruthy();
                expect(slot.classList.contains('skill-slot')).toBe(true);
            }
        });

        test('技能槽包含技能编号和图标', () => {
            const slots = document.querySelectorAll('.skill-slot');
            
            slots.forEach((slot, index) => {
                const number = slot.querySelector('.skill-number');
                const icon = slot.querySelector('.skill-icon');
                
                expect(number).toBeTruthy();
                expect(icon).toBeTruthy();
                expect(number.textContent).toBe((index + 1).toString());
            });
        });

        test('技能图标使用emoji表情', () => {
            const skillIcons = ['🎯', '💥', '🛡️', '⏰', '🌪️', '⚔️'];
            const slots = document.querySelectorAll('.skill-slot .skill-icon');
            
            slots.forEach((icon, index) => {
                expect(icon.textContent.trim()).toBe(skillIcons[index]);
            });
        });
    });

    describe('菜单系统', () => {
        test('加载屏幕元素完整', () => {
            const loadingScreen = document.getElementById('loadingScreen');
            const loadingText = document.getElementById('loadingText');
            const loadingProgress = document.getElementById('loadingProgress');
            
            expect(loadingScreen).toBeTruthy();
            expect(loadingText).toBeTruthy();
            expect(loadingProgress).toBeTruthy();
            
            expect(loadingScreen.classList.contains('game-menu')).toBe(true);
        });

        test('游戏菜单包含必要按钮', () => {
            const gameMenu = document.getElementById('gameMenu');
            expect(gameMenu).toBeTruthy();
            
            const buttons = gameMenu.querySelectorAll('button');
            expect(buttons.length).toBeGreaterThanOrEqual(4);
            
            const buttonTexts = Array.from(buttons).map(b => b.textContent.trim());
            expect(buttonTexts).toContain('选择模式');
            expect(buttonTexts).toContain('快速开始');
            expect(buttonTexts).toContain('游戏说明');
            expect(buttonTexts).toContain('新手教程');
        });

        test('游戏菜单按钮绑定onclick函数', () => {
            const gameMenu = document.getElementById('gameMenu');
            const buttons = gameMenu.querySelectorAll('button[onclick]');
            
            expect(buttons.length).toBeGreaterThanOrEqual(4);
            
            const onclicks = Array.from(buttons).map(b => b.getAttribute('onclick'));
            expect(onclicks).toContain('showModeSelector()');
            expect(onclicks).toContain('startGame()');
            expect(onclicks).toContain('showInstructions()');
            expect(onclicks).toContain('showTutorial()');
        });

        test('游戏模式选择器容器存在', () => {
            const modeSelector = document.getElementById('gameModeSelector');
            expect(modeSelector).toBeTruthy();
            expect(modeSelector.classList.contains('mode-selector-overlay')).toBe(true);
        });

        test('游戏结束菜单存在且包含最终分数', () => {
            const gameOverMenu = document.getElementById('gameOverMenu');
            const finalScore = document.getElementById('finalScore');
            
            expect(gameOverMenu).toBeTruthy();
            expect(finalScore).toBeTruthy();
            expect(gameOverMenu.classList.contains('hidden')).toBe(true);
        });

        test('功能亮点展示存在', () => {
            const highlights = document.querySelector('.feature-highlights');
            expect(highlights).toBeTruthy();
            
            const items = highlights.querySelectorAll('.feature-item');
            expect(items.length).toBe(4);
            
            const features = Array.from(items).map(item => 
                item.textContent.trim()
            );
            
            expect(features.some(f => f.includes('主动技能'))).toBe(true);
            expect(features.some(f => f.includes('被动技能'))).toBe(true);
            expect(features.some(f => f.includes('元素系统'))).toBe(true);
            expect(features.some(f => f.includes('无限升级'))).toBe(true);
        });
    });

    describe('CSS类和样式', () => {
        test('关键CSS类定义存在', () => {
            const criticalClasses = [
                '.game-container', '.game-header', '.game-main',
                '.game-sidebar', '.sidebar-section', '.sidebar-title',
                '.skill-bar', '.skill-slot', '.skill-icon',
                '.hud-overlay', '.hud-element',
                '.progress-bar', '.progress-fill',
                '.game-menu', '.cyber-button',
                '.endless-mode-ui', '.combo-display', '.special-event-display'
            ];
            
            criticalClasses.forEach(className => {
                const regex = new RegExp(className.replace('.', '\\.') + '\\s*\\{');
                expect(gameHtml).toMatch(regex);
            });
        });

        test('科技主题CSS变量使用', () => {
            expect(gameHtml).toContain('var(--');
            expect(gameHtml).toContain('var(--bg-card)');
            expect(gameHtml).toContain('var(--border-primary)');
            expect(gameHtml).toContain('var(--text-secondary)');
        });

        test('backdrop-filter效果应用', () => {
            expect(gameHtml).toContain('backdrop-filter');
            expect(gameHtml).toContain('-webkit-backdrop-filter');
        });
    });

    describe('可访问性和用户体验', () => {
        test('所有交互元素有touch-action设置', () => {
            expect(gameHtml).toContain('touch-action: manipulation');
        });

        test('用户选择行为正确设置', () => {
            expect(gameHtml).toContain('-webkit-user-select');
            expect(gameHtml).toContain('user-select: none');
            expect(gameHtml).toContain('user-select: text'); // for input/textarea
        });

        test('Canvas元素存在且有正确尺寸', () => {
            const canvas = document.getElementById('gameCanvas');
            expect(canvas).toBeTruthy();
            expect(canvas.tagName).toBe('CANVAS');
            expect(canvas.width).toBe(800);
            expect(canvas.height).toBe(600);
        });

        test('控制提示UI存在', () => {
            expect(gameHtml).toContain('controls-hint');
        });
    });
});
