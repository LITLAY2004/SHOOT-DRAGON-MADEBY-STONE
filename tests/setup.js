/**
 * Jest测试环境设置
 * 为游戏测试配置DOM环境和Canvas模拟
 */

// 引入Canvas模拟
import 'jest-canvas-mock';

// 加载测试依赖
require('./test-dependencies.js');

// 加载测试修复
require('./test-fixes.js');

// 模拟requestAnimationFrame和cancelAnimationFrame
global.requestAnimationFrame = (callback) => {
  return setTimeout(() => callback(Date.now()), 16);
};

global.cancelAnimationFrame = (id) => {
  clearTimeout(id);
};

// 模拟performance.now()
global.performance = {
  now: jest.fn(() => Date.now())
};

// 模拟localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// 模拟Audio API
global.Audio = jest.fn().mockImplementation(() => ({
  play: jest.fn(),
  pause: jest.fn(),
  load: jest.fn(),
  volume: 1,
  currentTime: 0,
  duration: 0,
  paused: true,
  ended: false,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

// 模拟HTMLCanvasElement的方法
HTMLCanvasElement.prototype.getContext = jest.fn((contextType) => {
  if (contextType === '2d') {
    return {
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      font: '',
      textAlign: 'left',
      globalAlpha: 1,
      shadowColor: '',
      shadowBlur: 0,
      beginPath: jest.fn(),
      closePath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      arc: jest.fn(),
      rect: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
      fillRect: jest.fn(),
      strokeRect: jest.fn(),
      clearRect: jest.fn(),
      fillText: jest.fn(),
      strokeText: jest.fn(),
      measureText: jest.fn(() => ({ width: 0 })),
      save: jest.fn(),
      restore: jest.fn(),
      translate: jest.fn(),
      rotate: jest.fn(),
      scale: jest.fn(),
      drawImage: jest.fn(),
      createLinearGradient: jest.fn(() => ({
        addColorStop: jest.fn()
      })),
      createRadialGradient: jest.fn(() => ({
        addColorStop: jest.fn()
      }))
    };
  }
  return null;
});

// 设置默认的canvas尺寸
HTMLCanvasElement.prototype.width = 800;
HTMLCanvasElement.prototype.height = 600;

// 模拟DOM事件
const mockEvent = (type, properties = {}) => ({
  type,
  preventDefault: jest.fn(),
  stopPropagation: jest.fn(),
  ...properties
});

// 全局测试辅助函数
global.createMockEvent = mockEvent;

// 设置控制台输出级别（减少测试时的噪音）
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// 测试前清理
beforeEach(() => {
  // 清理所有mock调用记录
  jest.clearAllMocks();
  
  // 重置localStorage mock
  localStorageMock.getItem.mockReturnValue(null);
  
  // 重置performance.now mock
  global.performance.now.mockReturnValue(0);
});
