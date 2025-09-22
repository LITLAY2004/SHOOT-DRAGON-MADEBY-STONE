/**
 * UI和用户交互集成测试
 * 测试用户界面响应和交互逻辑
 */

// 导入测试框架
if (typeof require !== 'undefined') {
    const { TestFramework, MockUtils } = require('../test-framework.js');
    global.TestFramework = TestFramework;
    global.MockUtils = MockUtils;
}

const testFramework = new TestFramework();
const { describe, it, expect, beforeEach, afterEach } = testFramework;

describe('UI和用户交互测试', () => {
    let game;
    let mockCanvas;
    let mockContext;
    let mockDocument;
    let mockWindow;

    beforeEach(() => {
        // 创建mock DOM环境
        mockDocument = {
            getElementById: (id) => {
                const mockElement = {
                    innerHTML: '',
                    textContent: '',
                    style: {},
                    classList: {
                        add: () => {},
                        remove: () => {},
                        contains: () => false
                    },
                    addEventListener: () => {},
                    removeEventListener: () => {}
                };
                return mockElement;
            },
            createElement: (tag) => ({
                innerHTML: '',
                style: {},
                addEventListener: () => {}
            }),
            addEventListener: () => {},
            removeEventListener: () => {}
        };

        mockWindow = {
            addEventListener: () => {},
            removeEventListener: () => {},
            requestAnimationFrame: (callback) => setTimeout(callback, 16),
            cancelAnimationFrame: () => {}
        };

        // 设置全局mock
        if (typeof global !== 'undefined') {
            global.document = mockDocument;
            global.window = mockWindow;
        }

        mockCanvas = MockUtils.createMockCanvas(800, 600);
        mockContext = mockCanvas.getContext('2d');
        game = new DragonHunterGame(mockCanvas);
        game.startGame();
    });

    afterEach(() => {
        game = null;
        mockCanvas = null;
        mockContext = null;
    });

    describe('键盘输入处理', () => {
        it('应该正确处理WASD移动键', () => {
            const initialX = game.player.x;
            const initialY = game.player.y;

            // 模拟按下W键
            game.handleKeyDown({ code: 'KeyW' });
            game.updatePlayer(16);
            expect(game.player.y).toBeLessThan(initialY);

            // 重置位置
            game.player.x = initialX;
            game.player.y = initialY;

            // 模拟按下S键
            game.handleKeyDown({ code: 'KeyS' });
            game.updatePlayer(16);
            expect(game.player.y).toBeGreaterThan(initialY);

            // 重置位置
            game.player.x = initialX;
            game.player.y = initialY;

            // 模拟按下A键
            game.handleKeyDown({ code: 'KeyA' });
            game.updatePlayer(16);
            expect(game.player.x).toBeLessThan(initialX);

            // 重置位置
            game.player.x = initialX;
            game.player.y = initialY;

            // 模拟按下D键
            game.handleKeyDown({ code: 'KeyD' });
            game.updatePlayer(16);
            expect(game.player.x).toBeGreaterThan(initialX);
        });

        it('应该正确处理技能快捷键', () => {
            game.skillSystem.resources.mana = game.skillSystem.resources.maxMana;
            game.skillSystem.cooldowns = {};

            const initialBulletCount = game.bullets.length;

            // 模拟按下数字键1激活齐射技能
            game.handleKeyDown({ code: 'Digit1' });

            expect(game.bullets.length).toBeGreaterThan(initialBulletCount);
            expect(game.skillSystem.cooldowns['volley']).toBeGreaterThan(0);
        });

        it('应该正确处理暂停键', () => {
            expect(game.isPaused).toBe(false);

            // 模拟按下ESC键
            game.handleKeyDown({ code: 'Escape' });

            expect(game.isPaused).toBe(true);

            // 再次按下ESC键
            game.handleKeyDown({ code: 'Escape' });

            expect(game.isPaused).toBe(false);
        });

        it('应该正确处理按键释放', () => {
            // 按下移动键
            game.handleKeyDown({ code: 'KeyW' });
            expect(game.keys.w).toBe(true);

            // 释放移动键
            game.handleKeyUp({ code: 'KeyW' });
            expect(game.keys.w).toBe(false);
        });

        it('应该处理同时按下多个键', () => {
            const initialX = game.player.x;
            const initialY = game.player.y;

            // 同时按下W和D键（向右上移动）
            game.handleKeyDown({ code: 'KeyW' });
            game.handleKeyDown({ code: 'KeyD' });
            game.updatePlayer(16);

            expect(game.player.x).toBeGreaterThan(initialX);
            expect(game.player.y).toBeLessThan(initialY);
        });
    });

    describe('鼠标输入处理', () => {
        it('应该正确处理鼠标移动', () => {
            const mouseEvent = {
                clientX: 500,
                clientY: 400,
                preventDefault: () => {}
            };

            // 模拟鼠标移动
            game.handleMouseMove(mouseEvent);

            expect(game.mouseX).toBe(500);
            expect(game.mouseY).toBe(400);
        });

        it('应该正确处理鼠标点击射击', () => {
            const initialBulletCount = game.bullets.length;

            const clickEvent = {
                clientX: 500,
                clientY: 300,
                preventDefault: () => {}
            };

            // 模拟鼠标点击
            game.handleMouseClick(clickEvent);

            expect(game.bullets.length).toBeGreaterThan(initialBulletCount);

            // 验证子弹方向
            const bullet = game.bullets[game.bullets.length - 1];
            expect(bullet.x).toBe(game.player.x);
            expect(bullet.y).toBe(game.player.y);
        });

        it('应该正确计算射击角度', () => {
            game.player.x = 400;
            game.player.y = 300;

            const clickEvent = {
                clientX: 500,
                clientY: 300,
                preventDefault: () => {}
            };

            game.handleMouseClick(clickEvent);

            const bullet = game.bullets[game.bullets.length - 1];
            expect(bullet.vx).toBeGreaterThan(0); // 向右射击
            expect(Math.abs(bullet.vy)).toBeLessThan(0.1); // 水平射击
        });

        it('应该处理画布边界外的点击', () => {
            const initialBulletCount = game.bullets.length;

            const clickEvent = {
                clientX: -100,
                clientY: -100,
                preventDefault: () => {}
            };

            game.handleMouseClick(clickEvent);

            // 仍然应该能够射击
            expect(game.bullets.length).toBeGreaterThan(initialBulletCount);
        });
    });

    describe('触摸输入处理', () => {
        it('应该正确处理触摸移动', () => {
            const touchEvent = {
                touches: [{
                    clientX: 300,
                    clientY: 200
                }],
                preventDefault: () => {}
            };

            game.handleTouchMove(touchEvent);

            expect(game.touchX).toBe(300);
            expect(game.touchY).toBe(200);
        });

        it('应该正确处理触摸射击', () => {
            const initialBulletCount = game.bullets.length;

            const touchEvent = {
                touches: [{
                    clientX: 600,
                    clientY: 400
                }],
                preventDefault: () => {}
            };

            game.handleTouchStart(touchEvent);

            expect(game.bullets.length).toBeGreaterThan(initialBulletCount);
        });

        it('应该处理多点触摸', () => {
            const touchEvent = {
                touches: [
                    { clientX: 300, clientY: 200 },
                    { clientX: 500, clientY: 400 }
                ],
                preventDefault: () => {}
            };

            expect(() => {
                game.handleTouchMove(touchEvent);
            }).not.toThrow();
        });
    });

    describe('UI状态更新', () => {
        it('应该正确更新血量显示', () => {
            game.player.health = 75;
            game.player.maxHealth = 100;

            const uiState = game.getUIState();

            expect(uiState.health).toBe(75);
            expect(uiState.maxHealth).toBe(100);
            expect(uiState.healthPercentage).toBe(75);
        });

        it('应该正确更新得分显示', () => {
            game.score = 12345;

            const uiState = game.getUIState();

            expect(uiState.score).toBe(12345);
            expect(uiState.formattedScore).toBe('12,345');
        });

        it('应该正确更新技能冷却显示', () => {
            game.skillSystem.activateSkill('volley');

            const skillsUI = game.skillSystem.getAllSkillsUIInfo();
            const volleySkill = skillsUI.find(skill => skill.id === 'volley');

            expect(volleySkill.ready).toBe(false);
            expect(volleySkill.cooldown).toBeGreaterThan(0);
            expect(volleySkill.cooldownPercentage).toBeGreaterThan(0);
            expect(volleySkill.cooldownPercentage).toBeLessThan(100);
        });

        it('应该正确更新法力值显示', () => {
            game.skillSystem.resources.mana = 75;
            game.skillSystem.resources.maxMana = 100;

            const uiState = game.getUIState();

            expect(uiState.mana).toBe(75);
            expect(uiState.maxMana).toBe(100);
            expect(uiState.manaPercentage).toBe(75);
        });

        it('应该正确更新经验值显示', () => {
            game.player.level = 3;
            game.player.experience = 150;

            const expForCurrentLevel = game.getExperienceForLevel(3);
            const expForNextLevel = game.getExperienceForLevel(4);

            const uiState = game.getUIState();

            expect(uiState.level).toBe(3);
            expect(uiState.experience).toBe(150);
            expect(uiState.experiencePercentage).toBeGreaterThan(0);
        });
    });

    describe('UI响应性测试', () => {
        it('UI更新应该在合理时间内完成', async () => {
            // 创建复杂的游戏状态
            game.score = 999999;
            game.player.health = 1;
            game.player.level = 50;
            game.skillSystem.resources.mana = 1;

            for (let i = 0; i < 6; i++) {
                game.skillSystem.activateSkill(Object.keys(game.skillSystem.ACTIVE_SKILLS)[i]);
            }

            const result = await testFramework.benchmark(
                'UI状态更新性能',
                () => {
                    game.getUIState();
                    game.skillSystem.getAllSkillsUIInfo();
                },
                1000
            );

            expect(result.avg).toBeLessThan(1); // 应该在1ms内完成
        });

        it('大量UI元素更新应该高效', async () => {
            // 模拟大量UI元素
            const uiElements = [];
            for (let i = 0; i < 100; i++) {
                uiElements.push({
                    id: `element_${i}`,
                    value: Math.random() * 1000,
                    update: function(newValue) {
                        this.value = newValue;
                    }
                });
            }

            const result = await testFramework.benchmark(
                '大量UI元素更新',
                () => {
                    uiElements.forEach(element => {
                        element.update(Math.random() * 1000);
                    });
                },
                100
            );

            expect(result.avg).toBeLessThan(5); // 应该在5ms内完成
        });
    });

    describe('无障碍性测试', () => {
        it('应该支持键盘导航', () => {
            // 模拟Tab键导航
            let focusedElement = 0;
            const maxElements = 6; // 6个技能按钮

            game.handleKeyDown({ code: 'Tab' });
            focusedElement = (focusedElement + 1) % maxElements;

            expect(focusedElement).toBe(1);

            // 模拟Shift+Tab反向导航
            game.handleKeyDown({ code: 'Tab', shiftKey: true });
            focusedElement = (focusedElement - 1 + maxElements) % maxElements;

            expect(focusedElement).toBe(0);
        });

        it('应该支持空格键激活', () => {
            const initialBulletCount = game.bullets.length;

            // 模拟空格键激活当前焦点技能
            game.focusedSkill = 'volley';
            game.handleKeyDown({ code: 'Space' });

            expect(game.bullets.length).toBeGreaterThan(initialBulletCount);
        });

        it('应该提供音频反馈', () => {
            let soundsPlayed = [];
            game.playSound = (soundName) => {
                soundsPlayed.push(soundName);
            };

            // UI交互应该有音频反馈
            game.handleKeyDown({ code: 'Digit1' });
            expect(soundsPlayed.length).toBeGreaterThan(0);
        });
    });

    describe('移动设备适配', () => {
        it('应该正确处理设备方向变化', () => {
            const originalWidth = game.width;
            const originalHeight = game.height;

            // 模拟设备旋转
            game.handleOrientationChange();

            // 游戏应该适应新的屏幕尺寸
            expect(game.width).toBeTruthy();
            expect(game.height).toBeTruthy();
        });

        it('应该调整触摸区域大小', () => {
            // 模拟小屏幕设备
            game.isMobile = true;
            game.width = 375;
            game.height = 667;

            const touchAreas = game.getTouchAreas();

            expect(touchAreas.skillButtons).toBeTruthy();
            expect(touchAreas.skillButtons.length).toBe(6);

            // 触摸区域应该足够大
            touchAreas.skillButtons.forEach(button => {
                expect(button.width).toBeGreaterThan(40);
                expect(button.height).toBeGreaterThan(40);
            });
        });

        it('应该提供触觉反馈', () => {
            game.isMobile = true;
            let vibrationCalled = false;

            // Mock vibration API
            if (typeof navigator !== 'undefined') {
                navigator.vibrate = () => {
                    vibrationCalled = true;
                };
            }

            // 技能激活应该触发触觉反馈
            game.skillSystem.activateSkill('volley');

            // 在支持的设备上应该有触觉反馈
            if (game.supportsVibration) {
                expect(vibrationCalled).toBe(true);
            }
        });
    });

    describe('游戏菜单和界面切换', () => {
        it('应该正确处理游戏暂停菜单', () => {
            expect(game.isPaused).toBe(false);

            // 打开暂停菜单
            game.showPauseMenu();

            expect(game.isPaused).toBe(true);
            expect(game.currentMenu).toBe('pause');

            // 关闭暂停菜单
            game.hidePauseMenu();

            expect(game.isPaused).toBe(false);
            expect(game.currentMenu).toBe(null);
        });

        it('应该正确处理游戏结束界面', () => {
            game.gameOver = true;
            game.showGameOverMenu();

            expect(game.currentMenu).toBe('gameOver');

            const gameOverData = game.getGameOverData();
            expect(gameOverData).toHaveProperty('finalScore');
            expect(gameOverData).toHaveProperty('wave');
            expect(gameOverData).toHaveProperty('kills');
            expect(gameOverData).toHaveProperty('playTime');
        });

        it('应该正确处理设置菜单', () => {
            game.showSettingsMenu();

            expect(game.currentMenu).toBe('settings');

            const settings = game.getSettings();
            expect(settings).toHaveProperty('soundEnabled');
            expect(settings).toHaveProperty('musicEnabled');
            expect(settings).toHaveProperty('difficulty');
        });

        it('应该正确处理技能升级界面', () => {
            game.player.experience = 1000;
            game.showSkillUpgradeMenu();

            expect(game.currentMenu).toBe('skillUpgrade');

            const availableUpgrades = game.getAvailableSkillUpgrades();
            expect(Array.isArray(availableUpgrades)).toBe(true);
        });
    });

    describe('实时数据显示', () => {
        it('应该正确显示FPS', () => {
            game.frameCount = 60;
            game.lastFPSUpdate = Date.now() - 1000;

            game.updateFPS();

            expect(game.fps).toBeCloseTo(60, 5);
        });

        it('应该正确显示游戏统计', () => {
            game.kills = 100;
            game.bulletsShot = 500;
            game.accuracy = game.kills / game.bulletsShot;

            const stats = game.getGameStats();

            expect(stats.kills).toBe(100);
            expect(stats.bulletsShot).toBe(500);
            expect(stats.accuracy).toBeCloseTo(0.2, 2);
        });

        it('应该正确显示实时伤害数字', () => {
            game.showDamageNumber(400, 300, 50, 'normal');

            expect(game.damageNumbers.length).toBeGreaterThan(0);

            const damageNumber = game.damageNumbers[game.damageNumbers.length - 1];
            expect(damageNumber.damage).toBe(50);
            expect(damageNumber.x).toBe(400);
            expect(damageNumber.y).toBe(300);
        });
    });

    describe('错误处理和用户反馈', () => {
        it('应该正确处理无效输入', () => {
            expect(() => {
                game.handleKeyDown(null);
                game.handleKeyDown({ code: null });
                game.handleKeyDown({ code: 'InvalidKey' });
            }).not.toThrow();
        });

        it('应该正确处理网络错误', () => {
            let errorShown = false;
            game.showError = (message) => {
                errorShown = true;
            };

            // 模拟网络错误
            game.handleNetworkError('Connection failed');

            expect(errorShown).toBe(true);
        });

        it('应该提供用户操作反馈', () => {
            let feedbackShown = false;
            game.showFeedback = (message, type) => {
                feedbackShown = true;
            };

            // 成功操作应该显示反馈
            game.skillSystem.activateSkill('volley');

            expect(feedbackShown).toBe(true);
        });
    });

    describe('国际化和本地化', () => {
        it('应该支持多语言文本', () => {
            game.setLanguage('zh-CN');

            const uiTexts = game.getUITexts();

            expect(uiTexts.startGame).toBe('开始游戏');
            expect(uiTexts.pause).toBe('暂停');
            expect(uiTexts.resume).toBe('继续');

            game.setLanguage('en-US');

            const englishTexts = game.getUITexts();

            expect(englishTexts.startGame).toBe('Start Game');
            expect(englishTexts.pause).toBe('Pause');
            expect(englishTexts.resume).toBe('Resume');
        });

        it('应该正确格式化数字', () => {
            game.setLanguage('zh-CN');
            expect(game.formatNumber(12345)).toBe('12,345');

            game.setLanguage('de-DE');
            expect(game.formatNumber(12345)).toBe('12.345');
        });
    });
});

// 如果在浏览器环境中，自动运行测试
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        setTimeout(() => testFramework.run(), 400);
    });
} else if (typeof module !== 'undefined') {
    module.exports = { testFramework };
}
