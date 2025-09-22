# 🧪 龙猎游戏测试指南

## 📋 测试概览

本项目包含完整的测试套件，覆盖单元测试、集成测试和性能测试，确保游戏的稳定性和可靠性。

### 🎯 测试目标
- **单元测试**: 测试独立的游戏组件和函数
- **集成测试**: 测试组件间的交互和完整游戏流程
- **性能测试**: 验证游戏在各种负载下的性能表现
- **DOM测试**: 验证浏览器环境下的功能

---

## 🚀 快速开始

### 安装依赖
```bash
npm install
```

### 运行所有测试
```bash
npm test
# 或使用脚本
./scripts/test.sh --all
```

### 生成覆盖率报告
```bash
npm run test:coverage
# 或使用脚本
./scripts/test.sh --coverage
```

---

## 📁 测试结构

```
tests/
├── setup.js                    # 测试环境配置
├── unit/                       # 单元测试
│   ├── game.test.js            # 游戏核心逻辑测试
│   └── utils.test.js           # 工具函数测试
└── integration/                # 集成测试
    ├── gameplay.test.js        # 游戏玩法集成测试
    ├── dom.test.js             # DOM交互测试
    └── performance.test.js     # 性能测试
```

---

## 🛠️ 测试命令

### NPM脚本
```bash
# 运行所有测试
npm test

# 监听模式（文件变化时自动运行）
npm run test:watch

# 生成覆盖率报告
npm run test:coverage

# 仅运行单元测试
npm run test:unit

# 仅运行集成测试
npm run test:integration
```

### 测试脚本
```bash
# 显示帮助
./scripts/test.sh --help

# 运行所有测试
./scripts/test.sh --all

# 运行单元测试
./scripts/test.sh --unit

# 运行集成测试
./scripts/test.sh --integration

# 运行性能测试
./scripts/test.sh --performance

# 生成覆盖率报告
./scripts/test.sh --coverage

# 监听模式
./scripts/test.sh --watch

# 清理缓存
./scripts/test.sh --clean

# 验证测试环境
./scripts/test.sh --validate
```

---

## 📊 测试覆盖率

### 覆盖率目标
- **全局覆盖率**: 80%
- **核心游戏逻辑**: 85%
- **分支覆盖率**: 70%
- **函数覆盖率**: 80%

### 查看覆盖率报告
```bash
# 生成报告后，打开浏览器查看
open coverage/lcov-report/index.html
# 或在Linux上
xdg-open coverage/lcov-report/index.html
```

---

## 🧪 测试类型详解

### 1. 单元测试 (Unit Tests)

**位置**: `tests/unit/`

**覆盖内容**:
- ✅ 游戏初始化
- ✅ 玩家移动和边界检测
- ✅ 射击系统和冷却机制
- ✅ 龙的生成和AI行为
- ✅ 碰撞检测算法
- ✅ 道具系统
- ✅ 升级机制
- ✅ 特效系统
- ✅ 数学工具函数

**示例**:
```javascript
test('应该正确初始化游戏状态', () => {
    const game = new DragonHunterGame();
    expect(game.gameStarted).toBe(false);
    expect(game.lives).toBe(3);
    expect(game.score).toBe(0);
});
```

### 2. 集成测试 (Integration Tests)

**位置**: `tests/integration/`

**覆盖内容**:
- ✅ 完整游戏流程
- ✅ 组件交互
- ✅ 用户输入处理
- ✅ DOM操作
- ✅ 事件系统
- ✅ 状态管理

**示例**:
```javascript
test('应该能够完成一个完整的游戏循环', () => {
    game.startGame();
    game.spawnDragon();
    game.shoot();
    game.update(0.016);
    
    expect(game.gameStarted).toBe(true);
    expect(game.bullets.length).toBeGreaterThan(0);
});
```

### 3. 性能测试 (Performance Tests)

**位置**: `tests/integration/performance.test.js`

**覆盖内容**:
- ✅ 游戏循环性能
- ✅ 大量对象处理
- ✅ 碰撞检测效率
- ✅ 内存使用优化
- ✅ 帧率稳定性

**示例**:
```javascript
test('单次游戏更新应该在合理时间内完成', () => {
    const startTime = Date.now();
    game.update(0.016);
    const endTime = Date.now();
    
    expect(endTime - startTime).toBeLessThan(16);
});
```

### 4. DOM测试 (DOM Tests)

**位置**: `tests/integration/dom.test.js`

**覆盖内容**:
- ✅ HTML结构验证
- ✅ CSS样式测试
- ✅ 事件绑定
- ✅ Canvas渲染
- ✅ UI更新
- ✅ 响应式设计

---

## 🔧 测试配置

### Jest配置 (`jest.config.js`)
```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### 测试环境设置 (`tests/setup.js`)
- Canvas API模拟
- DOM事件模拟
- requestAnimationFrame模拟
- localStorage模拟
- 全局测试辅助函数

---

## 🐛 调试测试

### 运行特定测试
```bash
# 运行特定测试文件
npx jest tests/unit/game.test.js

# 运行特定测试用例
npx jest --testNamePattern="射击系统"

# 运行匹配模式的测试
npx jest --testPathPattern=unit
```

### 调试模式
```bash
# 详细输出
npx jest --verbose

# 检测打开的句柄
npx jest --detectOpenHandles

# 强制退出
npx jest --forceExit
```

### 常见问题解决

1. **Canvas相关错误**
   - 确保安装了`jest-canvas-mock`
   - 检查`tests/setup.js`中的Canvas模拟

2. **DOM相关错误**
   - 确保使用`jsdom`测试环境
   - 检查HTML文件路径是否正确

3. **异步测试超时**
   - 增加测试超时时间
   - 使用`async/await`或`done`回调

---

## 📈 持续集成

### GitHub Actions配置示例
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

---

## 🎯 最佳实践

### 测试编写原则
1. **AAA模式**: Arrange, Act, Assert
2. **单一职责**: 每个测试只验证一个功能点
3. **独立性**: 测试之间不应相互依赖
4. **可读性**: 使用描述性的测试名称
5. **覆盖边界**: 测试边界条件和异常情况

### 测试命名规范
```javascript
describe('游戏组件', () => {
  describe('特定功能', () => {
    test('应该在特定条件下产生预期行为', () => {
      // 测试代码
    });
  });
});
```

### Mock使用指南
```javascript
// Mock外部依赖
jest.mock('external-library');

// 监听方法调用
const spy = jest.spyOn(object, 'method');

// 模拟返回值
jest.fn().mockReturnValue('mocked value');
```

---

## 📚 相关资源

- [Jest官方文档](https://jestjs.io/docs/getting-started)
- [JSDOM文档](https://github.com/jsdom/jsdom)
- [Canvas测试指南](https://github.com/hustcc/jest-canvas-mock)
- [测试最佳实践](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

## 🤝 贡献指南

### 添加新测试
1. 在相应目录创建测试文件
2. 遵循现有的测试结构和命名规范
3. 确保测试覆盖率不下降
4. 运行完整测试套件验证

### 修改现有测试
1. 理解测试目的和覆盖范围
2. 保持向后兼容性
3. 更新相关文档
4. 验证所有测试通过

---

## 📞 支持

如果您在运行测试时遇到问题：

1. 检查Node.js和npm版本
2. 重新安装依赖：`rm -rf node_modules && npm install`
3. 清理测试缓存：`./scripts/test.sh --clean`
4. 验证测试环境：`./scripts/test.sh --validate`

---

**🎮 享受测试驱动的游戏开发！** 🚀
