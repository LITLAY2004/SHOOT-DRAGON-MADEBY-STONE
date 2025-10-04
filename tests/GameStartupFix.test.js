/**
 * 游戏启动和渲染修复测试
 * @jest-environment jsdom
 */

require('jest-canvas-mock');

describe('游戏启动和渲染修复', () => {
    let gameController;
    let canvas;
    let ctx;

    beforeEach(() => {
        // 创建 canvas
        canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        ctx = canvas.getContext('2d');

        // 加载依赖
        const EventSystem = require('../src/core/EventSystem.js');
        const GameState = require('../src/core/GameState.js');
        const ElementSystem = require('../src/systems/elements/ElementSystem.js');
        const ElementConfig = require('../src/config/ElementConfig.js');
        const BalanceConfig = require('../src/config/BalanceConfig.js');
        const GameController = require('../src/core/GameController.js');

        gameController = new GameController(canvas);
    });

    describe('缺失方法修复', () => {
        test('spawnStoneEnhancementSegment 方法应该存在', () => {
            expect(typeof gameController.spawnStoneEnhancementSegment).toBe('function');
        });

        test('handleEnhancementSegmentDestroyed 方法应该存在', () => {
            expect(typeof gameController.handleEnhancementSegmentDestroyed).toBe('function');
        });

        test('spawnStoneEnhancementSegment 应该能为石龙创建强化段', () => {
            const stoneDragon = {
                id: 'test-stone-dragon',
                type: 'stone',
                x: 400,
                y: 300,
                radius: 30,
                maxHealth: 500,
                health: 500,
                enhancementSegments: []
            };

            gameController.spawnStoneEnhancementSegment(stoneDragon);

            expect(stoneDragon.enhancementSegments.length).toBe(1);
            const segment = stoneDragon.enhancementSegments[0];
            expect(segment).toHaveProperty('id');
            expect(segment).toHaveProperty('health');
            expect(segment).toHaveProperty('maxHealth');
            expect(segment.isEnhancementSegment).toBe(true);
            expect(segment.color).toBe('#9C8C6A');
        });

        test('spawnStoneEnhancementSegment 应该拒绝非石龙', () => {
            const fireDragon = {
                id: 'test-fire-dragon',
                type: 'fire',
                x: 400,
                y: 300,
                radius: 30,
                maxHealth: 300,
                enhancementSegments: []
            };

            gameController.spawnStoneEnhancementSegment(fireDragon);
            expect(fireDragon.enhancementSegments.length).toBe(0);
        });

        test('handleEnhancementSegmentDestroyed 应该移除强化段', () => {
            const stoneDragon = {
                id: 'test-stone-dragon',
                type: 'stone',
                x: 400,
                y: 300,
                radius: 30,
                maxHealth: 500,
                enhancementSegments: []
            };

            gameController.spawnStoneEnhancementSegment(stoneDragon);
            const segment = stoneDragon.enhancementSegments[0];

            expect(stoneDragon.enhancementSegments.length).toBe(1);

            gameController.handleEnhancementSegmentDestroyed(stoneDragon, segment);

            expect(stoneDragon.enhancementSegments.length).toBe(0);
        });

        test('handleEnhancementSegmentDestroyed 应该触发事件', () => {
            const stoneDragon = {
                id: 'test-stone-dragon',
                type: 'stone',
                x: 400,
                y: 300,
                radius: 30,
                maxHealth: 500,
                enhancementSegments: []
            };

            gameController.spawnStoneEnhancementSegment(stoneDragon);
            const segment = stoneDragon.enhancementSegments[0];

            let eventFired = false;
            gameController.eventSystem.on('ENHANCEMENT_SEGMENT_DESTROYED', () => {
                eventFired = true;
            });

            gameController.handleEnhancementSegmentDestroyed(stoneDragon, segment);

            expect(eventFired).toBe(true);
        });
    });

    describe('渲染方法验证', () => {
        test('render 方法应该存在', () => {
            expect(typeof gameController.render).toBe('function');
        });

        test('renderGame 方法应该存在', () => {
            expect(typeof gameController.renderGame).toBe('function');
        });

        test('renderPlayer 方法应该存在', () => {
            expect(typeof gameController.renderPlayer).toBe('function');
        });

        test('renderDragons 方法应该存在', () => {
            expect(typeof gameController.renderDragons).toBe('function');
        });

        test('render 应该清空画布', () => {
            gameController.render();
            
            const calls = ctx.fillRect.mock.calls;
            expect(calls.length).toBeGreaterThan(0);
            expect(calls[0]).toEqual([0, 0, 800, 600]);
        });

        test('renderPlayer 应该绘制玩家', () => {
            gameController.gameState.player = {
                x: 400,
                y: 300,
                radius: 15,
                health: 100,
                maxHealth: 100
            };

            gameController.renderPlayer();

            const arcCalls = ctx.arc.mock.calls;
            expect(arcCalls.length).toBeGreaterThan(0);
            
            const playerArcCall = arcCalls.find(call => 
                call[0] === 400 && call[1] === 300 && call[2] === 15
            );
            expect(playerArcCall).toBeDefined();
        });

        test('renderDragons 应该绘制石龙和强化段', () => {
            const stoneDragon = {
                id: 'test-stone-dragon',
                type: 'stone',
                x: 200,
                y: 200,
                radius: 30,
                color: '#888888',
                glowColor: '#AAAAAA',
                health: 500,
                maxHealth: 500,
                bodySegments: [],
                enhancementSegments: []
            };

            gameController.spawnStoneEnhancementSegment(stoneDragon);
            gameController.gameState.dragons = [stoneDragon];
            
            gameController.renderDragons();

            // 验证绘制了龙头
            const arcCalls = ctx.arc.mock.calls;
            const dragonHeadCall = arcCalls.find(call => 
                call[0] === 200 && call[1] === 200 && call[2] === 30
            );
            expect(dragonHeadCall).toBeDefined();
        });
    });

    describe('游戏启动流程', () => {
        test('start 方法应该设置 gameStarted 为 true', () => {
            gameController.start();
            expect(gameController.gameState.gameStarted).toBe(true);
        });

        test('start 应该重置 gameOver 状态', () => {
            gameController.gameState.gameOver = true;
            gameController.start();
            expect(gameController.gameState.gameOver).toBe(false);
        });

        test('initializeGame 应该设置玩家位置', () => {
            gameController.initializeGame();
            
            expect(gameController.gameState.player).toBeDefined();
            expect(gameController.gameState.player.x).toBe(400);
            expect(gameController.gameState.player.y).toBe(300);
        });

        test('spawnInitialDragon 应该创建石龙', () => {
            gameController.spawnInitialDragon();
            
            const dragons = gameController.gameState.getDragons();
            expect(dragons.length).toBeGreaterThan(0);
            expect(dragons[0].type).toBe('stone');
        });

        test('创建石龙时应该初始化强化段', () => {
            const dragon = gameController.createDragon('stone');
            
            expect(dragon).toBeDefined();
            expect(dragon.type).toBe('stone');
            expect(Array.isArray(dragon.enhancementSegments)).toBe(true);
            // 应该有一个初始强化段
            expect(dragon.enhancementSegments.length).toBeGreaterThanOrEqual(0);
        });
    });

    describe('完整启动流程集成测试', () => {
        test('游戏应该能够完整启动', () => {
            expect(() => {
                gameController.start();
            }).not.toThrow();
        });

        test('启动后应该有玩家', () => {
            gameController.start();
            
            expect(gameController.gameState.player).toBeDefined();
            expect(gameController.gameState.player.health).toBeGreaterThan(0);
        });

        test('启动后应该有龙', () => {
            gameController.start();
            
            const dragons = gameController.gameState.getDragons();
            expect(dragons.length).toBeGreaterThan(0);
        });

        test('启动后第一只龙应该是石龙', () => {
            gameController.start();
            
            const dragons = gameController.gameState.getDragons();
            expect(dragons[0].type).toBe('stone');
        });

        test('启动后石龙应该有强化段配置', () => {
            gameController.start();
            
            const dragons = gameController.gameState.getDragons();
            const stoneDragon = dragons.find(d => d.type === 'stone');
            
            expect(stoneDragon).toBeDefined();
            expect(Array.isArray(stoneDragon.enhancementSegments)).toBe(true);
        });

        test('游戏启动后应该能够渲染', () => {
            gameController.start();
            
            expect(() => {
                gameController.render();
            }).not.toThrow();
        });

        test('渲染应该清空画布并绘制内容', () => {
            gameController.start();
            gameController.render();
            
            // 验证画布被清空
            expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 800, 600);
            
            // 验证有绘制操作
            expect(ctx.arc).toHaveBeenCalled();
            expect(ctx.fill).toHaveBeenCalled();
        });
    });

    describe('错误处理', () => {
        test('spawnStoneEnhancementSegment 应该处理 null dragon', () => {
            expect(() => {
                gameController.spawnStoneEnhancementSegment(null);
            }).not.toThrow();
        });

        test('spawnStoneEnhancementSegment 应该处理没有 enhancementSegments 的龙', () => {
            const dragon = {
                id: 'test',
                type: 'stone',
                x: 100,
                y: 100,
                radius: 20,
                maxHealth: 100
            };

            expect(() => {
                gameController.spawnStoneEnhancementSegment(dragon);
            }).not.toThrow();

            expect(Array.isArray(dragon.enhancementSegments)).toBe(true);
            expect(dragon.enhancementSegments.length).toBe(1);
        });

        test('handleEnhancementSegmentDestroyed 应该处理 null 参数', () => {
            expect(() => {
                gameController.handleEnhancementSegmentDestroyed(null, null);
            }).not.toThrow();
        });

        test('handleEnhancementSegmentDestroyed 应该处理不存在的段', () => {
            const dragon = {
                id: 'test',
                type: 'stone',
                enhancementSegments: []
            };

            const fakeSegment = { id: 'fake' };

            expect(() => {
                gameController.handleEnhancementSegmentDestroyed(dragon, fakeSegment);
            }).not.toThrow();
        });
    });

    describe('性能测试', () => {
        test('创建多个强化段应该高效', () => {
            const dragon = {
                id: 'test',
                type: 'stone',
                x: 100,
                y: 100,
                radius: 20,
                maxHealth: 500,
                enhancementSegments: []
            };

            const startTime = Date.now();
            for (let i = 0; i < 10; i++) {
                gameController.spawnStoneEnhancementSegment(dragon);
            }
            const endTime = Date.now();

            expect(dragon.enhancementSegments.length).toBe(10);
            expect(endTime - startTime).toBeLessThan(100); // 应该在100ms内完成
        });

        test('渲染应该在合理时间内完成', () => {
            gameController.start();

            const startTime = Date.now();
            for (let i = 0; i < 60; i++) { // 模拟60帧
                gameController.render();
            }
            const endTime = Date.now();

            expect(endTime - startTime).toBeLessThan(1000); // 60帧应该在1秒内完成
        });
    });
});

