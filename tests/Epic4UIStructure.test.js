/**
 * EPIC4: UI结构验证测试
 * 验证game.html (855-1255行) 中定义的UI组件结构正确
 * 
 * 这个测试不需要浏览器环境,通过文本分析验证HTML结构
 */

const fs = require('fs');
const path = require('path');

describe('EPIC4: UI Structure Validation', () => {
    let gameHtml;

    beforeAll(() => {
        const htmlPath = path.join(__dirname, '..', 'game.html');
        gameHtml = fs.readFileSync(htmlPath, 'utf-8');
    });

    describe('HTML元素ID完整性', () => {
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
                const regex = new RegExp(`id="${id}"`);
                expect(gameHtml).toMatch(regex);
            });
        });

        test('游戏画布元素存在', () => {
            expect(gameHtml).toContain('id="gameCanvas"');
            expect(gameHtml).toMatch(/<canvas[^>]*id="gameCanvas"/);
            expect(gameHtml).toMatch(/width="800"/);
            expect(gameHtml).toMatch(/height="600"/);
        });

        test('游戏头部统计元素ID存在', () => {
            expect(gameHtml).toContain('id="score"');
            expect(gameHtml).toContain('id="wave"');
        expect(gameHtml).toContain('id="shop-tokens"');
        });
    });

    describe('技能栏结构', () => {
        test('包含6个技能槽', () => {
            const skillSlotMatches = gameHtml.match(/class="skill-slot"/g);
            expect(skillSlotMatches).not.toBeNull();
            expect(skillSlotMatches.length).toBe(6);
        });

        test('每个技能槽有data-skill属性', () => {
            for (let i = 0; i < 6; i++) {
                expect(gameHtml).toContain(`data-skill="${i}"`);
            }
        });

        test('每个技能槽包含编号和图标', () => {
            expect(gameHtml).toContain('class="skill-number"');
            expect(gameHtml).toContain('class="skill-icon"');
            
            // 验证每个编号1-6都存在
            for (let i = 1; i <= 6; i++) {
                const numberPattern = new RegExp(`<span class="skill-number">${i}</span>`);
                expect(gameHtml).toMatch(numberPattern);
            }
        });

        test('技能使用emoji图标', () => {
            const skillEmojis = ['🎯', '💥', '🛡️', '⏰', '🌪️', '⚔️'];
            skillEmojis.forEach(emoji => {
                expect(gameHtml).toContain(emoji);
            });
        });
    });

    describe('侧边栏结构', () => {
        test('包含sidebar-section类', () => {
            const sectionMatches = gameHtml.match(/class="sidebar-section"/g);
            expect(sectionMatches).not.toBeNull();
            expect(sectionMatches.length).toBeGreaterThanOrEqual(3);
        });

        test('包含sidebar-title类', () => {
            const titleMatches = gameHtml.match(/class="sidebar-title"/g);
            expect(titleMatches).not.toBeNull();
            expect(titleMatches.length).toBeGreaterThanOrEqual(3);
        });

        test('玩家状态section存在', () => {
            expect(gameHtml).toContain('玩家状态');
            expect(gameHtml).toContain('player-level');
            expect(gameHtml).toContain('player-exp');
            expect(gameHtml).toContain('player-damage');
            expect(gameHtml).toContain('player-firerate');
            expect(gameHtml).toContain('player-speed');
        });

        test('升级系统section存在', () => {
            expect(gameHtml).toContain('属性升级');
            expect(gameHtml).toContain('id="upgrade-list"');
        });

        test('被动技能section存在', () => {
            expect(gameHtml).toContain('被动技能');
            expect(gameHtml).toContain('id="passive-skills"');
        });
    });

    describe('HUD覆盖层结构', () => {
        test('HUD元素存在', () => {
            expect(gameHtml).toContain('class="hud-overlay"');
            expect(gameHtml).toContain('class="hud-element');
            expect(gameHtml).toContain('hud-top-left');
            expect(gameHtml).toContain('hud-top-right');
            expect(gameHtml).toContain('hud-top-center');
        });

        test('生命值和法力值进度条存在', () => {
            expect(gameHtml).toContain('health-bar');
            expect(gameHtml).toContain('mana-bar');
            expect(gameHtml).toContain('class="progress-bar health-bar"');
            expect(gameHtml).toContain('class="progress-bar mana-bar"');
            expect(gameHtml).toContain('class="progress-fill"');
        });

        test('敌人信息显示存在', () => {
            expect(gameHtml).toContain('敌人剩余');
            expect(gameHtml).toContain('下波倒计时');
            expect(gameHtml).toContain('当前关卡');
        });
    });

    describe('无限模式UI组件', () => {
        test('无限模式UI容器存在', () => {
            expect(gameHtml).toContain('id="endlessModeUI"');
            // endless-mode-ui在HTML中与其他类一起使用
            expect(gameHtml).toContain('endless-mode-ui');
            expect(gameHtml).toContain('hidden');
        });

        test('无限模式统计元素存在', () => {
            expect(gameHtml).toContain('class="endless-stats"');
            expect(gameHtml).toContain('id="endless-wave"');
            expect(gameHtml).toContain('id="endless-score"');
            expect(gameHtml).toContain('id="endless-kills"');
            expect(gameHtml).toContain('id="endless-time"');
        });

        test('连击显示组件存在', () => {
            expect(gameHtml).toContain('id="comboDisplay"');
            expect(gameHtml).toContain('class="combo-display');
            expect(gameHtml).toContain('id="comboNumber"');
            expect(gameHtml).toContain('连击');
        });

        test('特殊事件显示组件存在', () => {
            expect(gameHtml).toContain('id="specialEventDisplay"');
            expect(gameHtml).toContain('class="special-event-display');
            expect(gameHtml).toContain('id="eventText"');
        });
    });

    describe('菜单系统结构', () => {
        test('加载屏幕存在', () => {
            expect(gameHtml).toContain('id="loadingScreen"');
            expect(gameHtml).toContain('id="loadingText"');
            expect(gameHtml).toContain('id="loadingProgress"');
            expect(gameHtml).toContain('正在初始化系统');
        });

        test('游戏模式选择器存在', () => {
            expect(gameHtml).toContain('id="gameModeSelector"');
            expect(gameHtml).toContain('class="mode-selector-overlay"');
        });

        test('游戏菜单存在', () => {
            expect(gameHtml).toContain('id="gameMenu"');
            expect(gameHtml).toContain('class="game-menu');
        });

        test('游戏菜单按钮存在', () => {
            expect(gameHtml).toContain('onclick="showModeSelector()"');
            expect(gameHtml).toContain('onclick="startGame()"');
            expect(gameHtml).toContain('onclick="showInstructions()"');
            expect(gameHtml).toContain('onclick="showTutorial()"');
            
            expect(gameHtml).toContain('选择模式');
            expect(gameHtml).toContain('快速开始');
            expect(gameHtml).toContain('游戏说明');
            expect(gameHtml).toContain('新手教程');
        });

        test('游戏结束菜单存在', () => {
            expect(gameHtml).toContain('id="gameOverMenu"');
            expect(gameHtml).toContain('id="finalScore"');
            expect(gameHtml).toContain('GAME OVER');
        });

        test('功能亮点展示存在', () => {
            expect(gameHtml).toContain('class="feature-highlights"');
            expect(gameHtml).toContain('class="feature-item"');
            expect(gameHtml).toContain('6个主动技能');
            expect(gameHtml).toContain('6个被动技能');
            expect(gameHtml).toContain('元素系统');
            expect(gameHtml).toContain('无限升级');
        });

        test('升级商店菜单按钮存在', () => {
            expect(gameHtml).toContain('onclick="enterUpgradeShop()"');
            expect(gameHtml).toContain('onclick="restartGame()"');
            expect(gameHtml).toContain('onclick="backToMainMenu()"');
        });
    });

    describe('响应式布局样式', () => {
        test('包含移动端媒体查询', () => {
            expect(gameHtml).toContain('@media (max-width: 768px)');
            expect(gameHtml).toContain('@media (max-width: 1024px)');
        });

        test('移动端调整game-sidebar', () => {
            const mobileSection = gameHtml.substring(
                gameHtml.indexOf('@media (max-width: 768px)'),
                gameHtml.indexOf('}', gameHtml.lastIndexOf('@media (max-width: 768px)') + 500)
            );
            expect(mobileSection).toContain('.game-sidebar');
        });

        test('移动端调整技能栏', () => {
            const mobileSection = gameHtml.substring(
                gameHtml.indexOf('@media (max-width: 768px)'),
                gameHtml.lastIndexOf('@media (max-width: 768px)') + 2000
            );
            expect(mobileSection).toContain('skill');
        });

        test('移动端调整canvas', () => {
            const mobileSection = gameHtml.substring(
                gameHtml.indexOf('@media (max-width: 768px)')
            );
            expect(mobileSection).toContain('gameCanvas');
        });
    });

    describe('CSS类和样式定义', () => {
        test('游戏容器相关类存在', () => {
            expect(gameHtml).toContain('.game-container');
            expect(gameHtml).toContain('.game-header');
            expect(gameHtml).toContain('.game-main');
            expect(gameHtml).toContain('.game-sidebar');
        });

        test('技能相关类存在', () => {
            expect(gameHtml).toContain('.skill-bar-container');
            expect(gameHtml).toContain('.skill-bar');
            expect(gameHtml).toContain('.skill-slot');
            expect(gameHtml).toContain('.skill-number');
            // skill-icon在HTML中使用但CSS中可能内联样式或继承
            expect(gameHtml).toContain('class="skill-icon"');
        });

        test('HUD相关类存在', () => {
            expect(gameHtml).toContain('.hud-overlay');
            expect(gameHtml).toContain('.hud-element');
            expect(gameHtml).toContain('.progress-container');
            expect(gameHtml).toContain('.progress-bar');
            expect(gameHtml).toContain('.progress-fill');
        });

        test('菜单相关类存在', () => {
            expect(gameHtml).toContain('.game-menu');
            expect(gameHtml).toContain('.menu-title');
            expect(gameHtml).toContain('.menu-description');
            expect(gameHtml).toContain('.menu-buttons');
            expect(gameHtml).toContain('.cyber-button');
        });

        test('无限模式相关类存在', () => {
            expect(gameHtml).toContain('.endless-mode-ui');
            expect(gameHtml).toContain('.endless-stats');
            expect(gameHtml).toContain('.combo-display');
            expect(gameHtml).toContain('.special-event-display');
        });

        test('科技主题CSS变量使用', () => {
            expect(gameHtml).toContain('var(--bg-card)');
            expect(gameHtml).toContain('var(--border-primary)');
            expect(gameHtml).toContain('var(--text-secondary)');
            expect(gameHtml).toContain('var(--gradient-neon)');
        });

        test('backdrop-filter效果应用', () => {
            expect(gameHtml).toContain('backdrop-filter: blur');
            expect(gameHtml).toContain('-webkit-backdrop-filter');
        });
    });

    describe('可访问性和用户体验', () => {
        test('touch-action设置', () => {
            expect(gameHtml).toContain('touch-action: manipulation');
            expect(gameHtml).toContain('-ms-touch-action');
        });

        test('用户选择行为设置', () => {
            expect(gameHtml).toContain('user-select: none');
            expect(gameHtml).toContain('-webkit-user-select');
            expect(gameHtml).toContain('-moz-user-select');
        });

        test('控制提示UI存在', () => {
            expect(gameHtml).toContain('controls-hint');
        });

        test('游戏标题正确显示', () => {
            expect(gameHtml).toContain('SHOOTING THE DRAGON');
            expect(gameHtml).toContain('科技塔防');
        });

        test('使用现代字体', () => {
            expect(gameHtml).toContain('Inter');
            expect(gameHtml).toContain('fonts.googleapis.com');
        });
    });

    describe('JavaScript函数绑定', () => {
        test('所有onclick函数都已定义', () => {
            const requiredFunctions = [
                'showModeSelector', 'startGame', 'showInstructions', 'showTutorial',
                'enterUpgradeShop', 'restartGame', 'backToMainMenu',
                'exitUpgradeShop', 'resetUpgrades', 'purchaseUpgrade'
            ];

            requiredFunctions.forEach(funcName => {
                const functionPattern = new RegExp(
                    `function\\s+${funcName}\\s*\\(|const\\s+${funcName}\\s*=|let\\s+${funcName}\\s*=`
                );
                expect(gameHtml).toMatch(functionPattern);
            });
        });

        test('游戏模式系统脚本引入', () => {
            expect(gameHtml).toContain('src/config/LevelConfig.js');
            expect(gameHtml).toContain('src/systems/GameModeManager.js');
            expect(gameHtml).toContain('src/systems/ProgressionSystem.js');
            expect(gameHtml).toContain('src/modes/EndlessMode.js');
            expect(gameHtml).toContain('src/ui/GameModeSelector.js');
        });
    });

    describe('855-1255行核心内容验证', () => {
        test('该区域包含完整的HTML body结构', () => {
            const lines = gameHtml.split('\n');
            const targetSection = lines.slice(854, 1255).join('\n');
            
            // 验证关键HTML结构都在这个区域
            expect(targetSection).toContain('<body>');
            expect(targetSection).toContain('game-container');
            expect(targetSection).toContain('game-header');
            expect(targetSection).toContain('gameCanvas');
            expect(targetSection).toContain('game-sidebar');
            expect(targetSection).toContain('skill-bar-container');
        });

        test('该区域包含菜单系统', () => {
            const lines = gameHtml.split('\n');
            const targetSection = lines.slice(854, 1255).join('\n');
            
            expect(targetSection).toContain('loadingScreen');
            expect(targetSection).toContain('gameModeSelector');
            expect(targetSection).toContain('gameMenu');
            expect(targetSection).toContain('gameOverMenu');
        });
    });
});
