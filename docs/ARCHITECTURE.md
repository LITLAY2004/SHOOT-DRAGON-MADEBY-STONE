# 塔防游戏架构设计文档

## 🏗️ 整体架构设计

### 架构原则
- **单一职责原则**：每个模块只负责一个特定功能
- **开闭原则**：对扩展开放，对修改关闭
- **依赖注入**：模块间通过接口交互，降低耦合
- **配置驱动**：游戏参数可配置，便于调整和扩展

### 核心架构层级
```
应用层 (Application Layer)
├── 游戏控制器 (GameController)
└── UI控制器 (UIController)

业务层 (Business Layer)  
├── 游戏逻辑 (GameLogic)
├── 战斗系统 (CombatSystem)
├── 元素系统 (ElementSystem)
├── 成就系统 (AchievementSystem)
└── 音效系统 (AudioSystem)

数据层 (Data Layer)
├── 游戏状态 (GameState)
├── 配置管理 (ConfigManager)
└── 事件系统 (EventSystem)

渲染层 (Render Layer)
├── 渲染引擎 (RenderEngine)
├── 特效系统 (EffectSystem)
└── UI渲染器 (UIRenderer)

工具层 (Utility Layer)
├── 数学工具 (MathUtils)
├── 几何工具 (GeometryUtils)
└── 随机工具 (RandomUtils)
```

## 📁 目录结构设计

```
src/
├── core/                    # 核心系统
│   ├── GameController.js    # 游戏主控制器
│   ├── GameState.js         # 游戏状态管理
│   ├── EventSystem.js       # 事件系统
│   └── ConfigManager.js     # 配置管理器
│
├── systems/                 # 游戏系统
│   ├── combat/              # 战斗系统
│   │   ├── CombatSystem.js  # 战斗主逻辑
│   │   ├── BulletManager.js # 子弹管理
│   │   ├── CollisionDetector.js # 碰撞检测
│   │   └── DamageCalculator.js  # 伤害计算
│   │
│   ├── elements/            # 元素系统
│   │   ├── ElementSystem.js # 元素主系统
│   │   ├── ElementManager.js # 元素管理
│   │   ├── ElementEffects.js # 元素效果
│   │   └── ElementConfig.js  # 元素配置
│   │
│   ├── entities/            # 实体系统
│   │   ├── Player.js        # 玩家实体
│   │   ├── Dragon.js        # 龙实体
│   │   ├── Tower.js         # 塔实体
│   │   └── Projectile.js    # 投射物实体
│   │
│   ├── achievements/        # 成就系统
│   │   ├── AchievementSystem.js # 成就主系统
│   │   ├── AchievementManager.js # 成就管理
│   │   └── AchievementConfig.js  # 成就配置
│   │
│   ├── audio/               # 音效系统
│   │   ├── AudioSystem.js   # 音效主系统
│   │   ├── SoundManager.js  # 声音管理
│   │   └── AudioConfig.js   # 音效配置
│   │
│   └── spawn/               # 生成系统
│       ├── SpawnSystem.js   # 生成主逻辑
│       ├── WaveManager.js   # 波次管理
│       └── DragonSpawner.js # 龙生成器
│
├── rendering/               # 渲染系统
│   ├── RenderEngine.js      # 渲染引擎
│   ├── ParticleSystem.js    # 粒子系统
│   ├── EffectRenderer.js    # 特效渲染器
│   ├── UIRenderer.js        # UI渲染器
│   └── AnimationSystem.js   # 动画系统
│
├── ui/                      # 用户界面
│   ├── HUD.js              # 游戏界面
│   ├── MenuSystem.js       # 菜单系统
│   ├── InfoPanel.js        # 信息面板
│   └── NotificationSystem.js # 通知系统
│
├── utils/                   # 工具类
│   ├── MathUtils.js        # 数学工具
│   ├── GeometryUtils.js    # 几何工具
│   ├── RandomUtils.js      # 随机工具
│   ├── TimerUtils.js       # 计时工具
│   └── ColorUtils.js       # 颜色工具
│
├── config/                  # 配置文件
│   ├── GameConfig.js       # 游戏配置
│   ├── ElementConfig.js    # 元素配置
│   ├── AudioConfig.js      # 音效配置
│   └── BalanceConfig.js    # 平衡性配置
│
└── game.js                 # 主入口文件（保持兼容性）
```

## 🔧 模块接口设计

### 核心模块接口

#### GameController
```javascript
class GameController {
    // 核心方法
    start()               // 开始游戏
    pause()               // 暂停游戏
    resume()              // 恢复游戏
    restart()             // 重启游戏
    stop()                // 停止游戏
    
    // 状态管理
    getState()            // 获取游戏状态
    setState(state)       // 设置游戏状态
    
    // 事件处理
    handleInput(input)    // 处理输入
    update(deltaTime)     // 更新逻辑
    render()              // 渲染画面
}
```

#### EventSystem
```javascript
class EventSystem {
    // 事件注册
    on(event, callback)      // 注册事件监听
    off(event, callback)     // 移除事件监听
    once(event, callback)    // 一次性事件监听
    
    // 事件触发
    emit(event, data)        // 触发事件
    emitAsync(event, data)   // 异步触发事件
    
    // 事件管理
    clear()                  // 清除所有事件
    hasListener(event)       // 检查是否有监听器
}
```

## 📊 数据流设计

### 游戏循环数据流
```
Input → EventSystem → GameController → Systems → GameState → Renderer → Output
```

### 事件驱动架构
```
用户操作 → UI事件 → 游戏逻辑事件 → 系统响应 → 状态更新 → UI更新
```

## 🎯 扩展点设计

### 1. 新元素类型扩展
- 在 `ElementConfig.js` 中添加新元素配置
- 在 `ElementEffects.js` 中实现新元素效果
- 自动集成到现有系统中

### 2. 新实体类型扩展
- 继承基础 `Entity` 类
- 实现特定的 `update()` 和 `render()` 方法
- 注册到对应的管理器中

### 3. 新系统扩展
- 实现标准的系统接口
- 注册到 `GameController` 中
- 通过事件系统与其他系统通信

## ⚙️ 配置管理

### 配置层级
1. **默认配置** - 硬编码的基础配置
2. **环境配置** - 不同环境的配置覆盖
3. **用户配置** - 用户自定义配置
4. **运行时配置** - 游戏运行中的动态配置

### 配置更新策略
- 热重载支持
- 配置验证机制
- 配置版本管理
- 配置回滚支持

这个架构设计确保了代码的可维护性、可扩展性和可测试性，为后续开发提供了清晰的指导。
