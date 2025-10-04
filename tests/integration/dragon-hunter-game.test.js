const DragonHunterGame = require('../../src/game.js');
const ElementConfig = require('../../src/config/ElementConfig.js');

beforeAll(() => {
  global.ElementConfig = ElementConfig;
  global.requestAnimationFrame = () => 1;
  global.cancelAnimationFrame = () => {};
});

afterAll(() => {
  delete global.requestAnimationFrame;
  delete global.cancelAnimationFrame;
});

describe('DragonHunterGame (modular implementation)', () => {
  test('startGame 应该激活游戏状态并生成敌人', () => {
    const game = new DragonHunterGame();

    game.startGame();

    expect(game.gameStarted).toBe(true);
    expect(game.gameController.gameState.getDragons().length).toBeGreaterThan(0);

    game.gameController.stop();
  });

  test('playerAttack 应该创建子弹', () => {
    const game = new DragonHunterGame();
    game.gameController.initializeGame();

    game.playerAttack();

    expect(game.gameController.gameState.getBullets().length).toBeGreaterThan(0);

    game.gameController.stop();
  });

  test('triggerEvent 应通过事件系统广播', () => {
    const game = new DragonHunterGame();
    const handler = jest.fn();

    game.addEventListener('CUSTOM_TEST_EVENT', handler);
    game.triggerEvent('CUSTOM_TEST_EVENT', { value: 42 });

    expect(handler).toHaveBeenCalledWith({ value: 42 });
  });
});
