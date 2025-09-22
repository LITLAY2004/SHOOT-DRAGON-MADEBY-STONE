# 塔防游戏单元测试

这个目录包含了塔防游戏两大核心模式（闯关模式和无限模式）的完整单元测试套件。

## 📁 文件结构

```
tests/
├── TestFramework.js          # 自定义测试框架
├── AdventureModeTests.js     # 闯关模式测试
├── EndlessModeTests.js       # 无限模式测试
├── IntegrationTests.js       # 模式集成测试
├── TestRunner.html           # 可视化测试运行器
└── README.md                 # 本文件
```

## 🧪 测试框架特性

我们开发了一个轻量级但功能强大的测试框架，专为塔防游戏设计：

### 核心功能
- **测试套件组织**: 使用 `describe()` 和 `it()` 组织测试
- **丰富的断言**: 支持多种断言方法（`toBe`, `toEqual`, `toBeGreaterThan` 等）
- **异步测试**: 完整支持 Promise 和 async/await
- **钩子函数**: 支持 `beforeEach`, `afterEach`, `beforeAll`, `afterAll`
- **模拟对象**: 内置 Mock 和 Spy 功能
- **性能测试**: 自动统计测试执行时间

### 断言方法
```javascript
expect(actual).toBe(expected)                    // 严格相等
expect(actual).toEqual(expected)                 // 深度相等
expect(actual).toBeGreaterThan(value)           // 大于
expect(actual).toBeLessThan(value)              // 小于
expect(actual).toBeTruthy()                     // 真值
expect(actual).toBeFalsy()                      // 假值
expect(actual).toContain(item)                  // 包含
expect(actual).toHaveProperty(prop)             // 有属性
expect(actual).toBeInstanceOf(Class)            // 实例检查
expect(fn).toThrow()                           // 抛出异常
```

## 📋 测试覆盖范围

### 闯关模式测试 (`AdventureModeTests.js`)
- **关卡配置系统**: 验证关卡定义、属性完整性、难度递增
- **关卡解锁系统**: 测试解锁逻辑、前置条件验证
- **闯关模式启动**: 测试模式启动、状态设置、事件触发
- **关卡进度追踪**: 验证击杀统计、生存时间、目标检查
- **关卡完成处理**: 测试奖励给予、进度保存、解锁逻辑
- **特殊关卡条件**: Boss关卡、特殊胜利条件
- **错误处理**: 无效输入、缺失配置、系统错误
- **性能测试**: 启动时间、检查效率

### 无限模式测试 (`EndlessModeTests.js`)
- **模式初始化**: 默认状态、难度配置、参数验证
- **波次管理**: 波次递增、敌人属性计算、Boss波次识别
- **计分系统**: 击杀得分、波次奖励、连击系统、生存奖励
- **特殊事件系统**: 事件触发、效果执行、持续时间管理
- **排行榜系统**: 高分保存、排序逻辑、记录限制
- **状态更新**: 实时统计、渲染逻辑
- **游戏结束处理**: 结果保存、新纪录检测
- **性能测试**: 大波次计算、更新循环效率
- **边界条件**: 极值处理、异常输入

### 集成测试 (`IntegrationTests.js`)
- **模式管理器初始化**: 系统集成、事件注册
- **模式切换**: 闯关↔无限模式切换、状态清理
- **数据持久化**: 进度保存、排行榜存储、数据一致性
- **事件系统集成**: 跨模式事件处理、通知机制
- **UI状态同步**: 界面更新、信息显示
- **资源管理**: 资源状态、模式隔离
- **性能和稳定性**: 频繁切换、大数据处理
- **错误恢复**: 数据损坏、启动失败、系统错误
- **完整游戏流程**: 端到端测试场景

## 🚀 运行测试

### 方法1: 可视化测试运行器（推荐）
1. 在浏览器中打开 `TestRunner.html`
2. 点击"运行所有测试"按钮
3. 查看详细的测试结果和统计信息

### 方法2: 控制台运行
```javascript
// 在浏览器控制台中运行
runTests().then(results => {
    console.log('测试完成:', results);
});
```

### 方法3: 单独运行测试套件
```javascript
// 运行特定的测试套件
describe('闯关模式测试', () => {
    // 测试代码...
});
```

## 📊 测试报告功能

测试运行器提供了丰富的报告功能：

### 实时统计
- 总测试数量
- 通过/失败/跳过数量
- 总执行时间
- 实时进度条

### 详细报告
- 按测试套件分组显示
- 每个测试的执行时间
- 失败测试的详细错误信息
- 控制台输出捕获

### 过滤功能
- 查看所有测试
- 仅查看闯关模式测试
- 仅查看无限模式测试
- 仅查看集成测试

## 🔧 模拟对象使用

我们的测试使用了大量模拟对象来隔离测试环境：

```javascript
// 创建模拟游戏对象
const mockGame = createMock({
    eventSystem: createMock({
        emit: () => {},
        on: () => {},
        off: () => {}
    }),
    resources: {
        money: 1000,
        lives: 20
    }
});

// 创建间谍函数
const spy = createSpy();
mockObject.method = spy;

// 验证调用
expect(spy.callCount).toBe(1);
expect(spy.calls[0]).toEqual([arg1, arg2]);
```

## 📈 性能测试

我们特别关注性能测试，确保游戏在各种情况下都能保持良好性能：

```javascript
it('关卡启动应该在合理时间内完成', () => {
    const startTime = performance.now();
    
    gameModeManager.startAdventureMode(1);
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(100); // 100ms内完成
});
```

## 🛠️ 扩展测试

要添加新的测试：

1. **新增测试文件**: 在 `tests/` 目录下创建新的测试文件
2. **在TestRunner.html中引入**: 在HTML文件中添加script标签
3. **使用测试框架**: 按照现有模式编写测试

```javascript
describe('新功能测试', () => {
    let testInstance;
    
    beforeEach(() => {
        testInstance = new TestClass();
    });
    
    it('应该正确执行新功能', () => {
        const result = testInstance.newMethod();
        expect(result).toBeTruthy();
    });
});
```

## 📝 测试最佳实践

1. **隔离性**: 每个测试都应该独立，不依赖其他测试的结果
2. **清晰性**: 测试名称应该清楚描述被测试的功能
3. **完整性**: 测试应该覆盖正常流程、边界条件和错误情况
4. **性能**: 关注测试执行时间，避免过慢的测试
5. **维护性**: 保持测试代码的简洁和可读性

## 🎯 持续改进

这个测试套件是一个活跃的项目，我们会持续：

- 添加新的测试用例
- 优化测试性能
- 改进测试报告
- 扩展测试覆盖范围
- 修复发现的问题

通过这个comprehensive的测试套件，我们确保塔防游戏的两大核心模式都能稳定可靠地运行，为玩家提供最佳的游戏体验！