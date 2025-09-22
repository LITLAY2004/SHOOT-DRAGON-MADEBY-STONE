# 🤖 AI开发规则与规范

## 🚨 **强制性规则**

### 1. 📋 代码修改前必须检查

**在修改任何代码之前，AI必须：**

1. **阅读功能结构图** - 查看 `docs/FUNCTION_MAP.md`
2. **检查架构文档** - 查看 `docs/ARCHITECTURE.md` 
3. **确认功能是否已存在** - 避免重复开发
4. **了解模块职责分工** - 确保修改在正确的模块中

### 2. 🔍 强制性检查清单

在每次代码修改前，必须回答以下问题：

- [ ] 我要实现的功能是否已经存在？
- [ ] 如果存在，我是否可以复用或扩展现有功能？
- [ ] 我选择的模块是否是最合适的？
- [ ] 我的修改是否会破坏现有功能？
- [ ] 我是否遵循了既定的架构模式？

### 3. 🔄 复用优先原则

**必须按以下优先级进行开发：**

1. **复用现有函数** - 首选使用已有功能
2. **扩展现有类** - 在现有类基础上添加功能
3. **利用事件系统** - 使用 EventSystem 进行模块通信
4. **配置驱动** - 通过配置文件实现变化
5. **创建新模块** - 只有在必要时才创建新模块

---

## 📚 开发指南

### 🔧 模块选择指南

| 需要实现的功能 | 应该修改的模块 | 主要文件 |
|---------------|----------------|----------|
| 新增元素类型 | ElementSystem | `config/ElementConfig.js` |
| 修改伤害计算 | CombatSystem | `systems/combat/CombatSystem.js` |
| 添加特效 | ParticleSystem | `rendering/ParticleSystem.js` |
| 新增音效 | AudioSystem | `systems/audio/AudioSystem.js` |
| 添加成就 | AchievementSystem | `systems/achievements/AchievementSystem.js` |
| 修改UI显示 | UIRenderer | `ui/UIRenderer.js` |
| 调整生成逻辑 | SpawnSystem | `systems/spawn/SpawnSystem.js` |
| 修改游戏状态 | GameState | `core/GameState.js` |
| 添加实体类型 | entities/ | `systems/entities/` |

### 🎯 功能定位指南

**想要添加新功能？先查找现有实现：**

#### 战斗相关
- 伤害计算 → `CombatSystem.calculateDamage()`
- 碰撞检测 → `CollisionDetector.checkCollisions()`
- 元素克制 → `ElementSystem.getEffectiveness()`

#### 视觉效果
- 粒子效果 → `ParticleSystem.createParticle()`
- 特效渲染 → `EffectRenderer.renderEffect()`
- UI显示 → `UIRenderer.renderHUD()`

#### 实体管理
- 玩家控制 → `Player.move()`, `Player.attack()`
- 龙AI → `Dragon.updateAI()`, `Dragon.useSpecialAbility()`
- 塔管理 → `Tower.upgrade()`, `Tower.attack()`

#### 系统功能
- 事件通信 → `EventSystem.emit()`, `EventSystem.on()`
- 状态管理 → `GameState.updateScore()`, `GameState.recordKill()`
- 配置管理 → `ConfigManager.getConfig()`

---

## 🛠️ 开发工作流

### 1. 📖 需求分析阶段

```markdown
1. 阅读用户需求
2. 查看 FUNCTION_MAP.md 确认现有功能
3. 查看 ARCHITECTURE.md 了解架构
4. 确定最佳实现方案
```

### 2. 🔍 功能复用检查

```markdown
1. 搜索相关函数名
2. 检查相似功能实现
3. 评估复用可能性
4. 确定扩展点
```

### 3. 💻 代码实现阶段

```markdown
1. 优先复用现有函数
2. 遵循既定的代码模式
3. 使用事件系统进行通信
4. 更新相关配置文件
```

### 4. 📝 文档更新阶段

```markdown
1. 更新 FUNCTION_MAP.md
2. 更新 ARCHITECTURE.md（如有架构变化）
3. 添加新功能到快速参考
4. 更新示例代码
```

---

## 🔍 代码审查标准

### ✅ 良好实践

```javascript
// ✅ 好：使用现有的事件系统
this.eventSystem.emit('DRAGON_DEATH', dragon);

// ✅ 好：复用现有的数学工具
const distance = MathUtils.distance(player.x, player.y, dragon.x, dragon.y);

// ✅ 好：使用配置驱动
const elementConfig = ElementConfig.getElement(dragonType);

// ✅ 好：遵循既定的命名约定
class DragonAI {
    updateBehavior(deltaTime) { /* ... */ }
}
```

### ❌ 应该避免

```javascript
// ❌ 差：重复实现已有功能
function calculateDistance(x1, y1, x2, y2) {
    return Math.sqrt((x2-x1)*(x2-x1) + (y2-y1)*(y2-y1));
}

// ❌ 差：硬编码配置
const dragonHealth = 100; // 应该从配置文件读取

// ❌ 差：直接修改状态，而不使用事件
gameState.score += 100; // 应该使用 gameState.updateScore(100)

// ❌ 差：绕过架构层次
renderEngine.drawDragon(dragon); // 应该通过适当的接口
```

---

## 📋 检查点清单

### 🚀 开发前检查

- [ ] 已阅读 `FUNCTION_MAP.md`
- [ ] 已阅读 `ARCHITECTURE.md`
- [ ] 已确认功能不存在或需要扩展
- [ ] 已确定正确的模块和文件
- [ ] 已了解相关的现有函数

### 🔧 开发中检查

- [ ] 正在复用现有函数而非重新实现
- [ ] 遵循既定的代码模式和约定
- [ ] 使用事件系统进行模块间通信
- [ ] 通过配置文件管理可变参数
- [ ] 保持代码的可读性和可维护性

### ✅ 完成后检查

- [ ] 功能正常工作且没有破坏现有功能
- [ ] 已更新 `FUNCTION_MAP.md`
- [ ] 已更新架构文档（如需要）
- [ ] 代码符合项目规范
- [ ] 已进行基本测试

---

## 🎯 特殊场景指南

### 🆕 添加新元素类型

1. **配置文件** - 在 `ElementConfig.js` 中添加元素定义
2. **效果系统** - 在 `ElementEffects.js` 中实现特殊效果
3. **渲染系统** - 在粒子配置中添加视觉效果
4. **音效系统** - 在音效配置中添加对应声音

### 🏗️ 添加新实体类型

1. **基类继承** - 继承 `Entity` 基类
2. **生命周期** - 实现 `update()` 和 `render()` 方法
3. **管理器注册** - 在对应管理器中注册
4. **事件集成** - 发送相关生命周期事件

### ⚙️ 添加新系统

1. **接口实现** - 实现标准系统接口
2. **生命周期** - 包含 `initialize()`, `update()`, `cleanup()`
3. **事件通信** - 通过 EventSystem 与其他系统通信
4. **配置管理** - 使用 ConfigManager 管理配置

---

## 🔍 常见问题与解决方案

### Q: 我想添加一个新的攻击效果，应该怎么做？

A: 
1. 检查 `ElementEffects.js` 是否已有类似效果
2. 如果没有，在 `ElementSystem.js` 中添加新的特殊能力
3. 在 `ElementConfig.js` 中配置新效果
4. 使用现有的事件系统触发效果

### Q: 我需要修改伤害计算公式，应该改哪里？

A:
1. 查看 `CombatSystem.calculateDamage()` 方法
2. 检查 `ElementSystem.getDamageMultiplier()` 方法
3. 优先通过配置文件调整参数
4. 必要时扩展现有计算逻辑

### Q: 我想添加新的UI元素，应该如何进行？

A:
1. 查看 `UIRenderer.js` 中的现有UI组件
2. 扩展 `renderHUD()` 或相关渲染方法
3. 使用事件系统接收状态更新
4. 保持UI组件的模块化设计

---

## 🎯 性能优化指南

### 🚀 优化原则

1. **复用对象** - 避免频繁创建和销毁对象
2. **事件去重** - 避免重复监听相同事件
3. **渲染优化** - 使用视锥剔除和对象池
4. **计算缓存** - 缓存昂贵的计算结果

### 📊 监控指标

- 实体数量控制（龙 < 10, 子弹 < 50, 粒子 < 200）
- 事件监听器数量监控
- 渲染帧率保持 > 30fps
- 内存使用量稳定

---

## 🎉 总结

记住：**复用 > 扩展 > 创建**

这个规则确保了：
- 代码的一致性和可维护性
- 功能的稳定性和可靠性  
- 开发效率的提升
- 架构的清晰和整洁

遵循这些规则，我们可以构建一个强大、灵活且易于扩展的游戏系统！
