# 🗺️ 游戏功能结构图（函数级别）

## 📋 使用说明
**⚠️ AI开发重要规则：修改代码前必须查看此结构图，避免重复开发和功能冲突！**

## 🔍 快速查找索引

### 按模块查找
- [核心系统](#核心系统-core) - 游戏控制、状态管理、事件系统
- [战斗系统](#战斗系统-combat) - 攻击、碰撞、伤害计算
- [元素系统](#元素系统-elements) - 元素属性、克制关系、效果
- [实体系统](#实体系统-entities) - 玩家、龙、塔、子弹
- [渲染系统](#渲染系统-rendering) - 绘制、特效、动画
- [UI系统](#ui系统-interface) - 界面、菜单、通知
- [音效系统](#音效系统-audio) - 声音播放、音效管理
- [成就系统](#成就系统-achievements) - 成就解锁、进度追踪
- [生成系统](#生成系统-spawn) - 波次管理、龙生成

### 按功能查找
- [玩家控制](#玩家相关功能) - 移动、攻击、升级
- [龙相关功能](#龙相关功能) - 生成、AI、特殊能力
- [塔相关功能](#塔相关功能) - 建造、升级、攻击
- [视觉效果](#视觉效果功能) - 粒子、动画、特效
- [游戏数据](#数据管理功能) - 保存、配置、统计

---

## 核心系统 (Core)

### 🎮 GameController
```javascript
// 📁 src/core/GameController.js
class GameController {
    // 🔧 核心控制方法
    constructor(canvas)              // 游戏初始化
    start()                          // 开始游戏
    pause()                          // 暂停游戏  
    resume()                         // 恢复游戏
    restart()                        // 重启游戏
    stop()                           // 停止游戏
    
    // 🔄 游戏循环
    gameLoop(currentTime)            // 主游戏循环
    update(deltaTime)                // 更新游戏逻辑
    render()                         // 渲染游戏画面
    
    // 📥 输入处理
    handleInput(inputData)           // 处理输入事件
    handleKeyDown(event)             // 键盘按下事件
    handleKeyUp(event)               // 键盘释放事件
    handleMouseMove(event)           // 鼠标移动事件
    handleMouseClick(event)          // 鼠标点击事件
    
    // 🎯 游戏状态管理
    initializeGame()                 // 初始化游戏状态
    resetGame()                      // 重置游戏状态
    saveGameState()                  // 保存游戏状态
    loadGameState()                  // 加载游戏状态
}
```

### 📊 GameState
```javascript
// 📁 src/core/GameState.js
class GameState {
    // 🏗️ 状态初始化
    constructor()                    // 初始化游戏状态
    reset()                          // 重置所有状态
    
    // 📈 状态获取器
    getPlayer()                      // 获取玩家状态
    getDragons()                     // 获取龙列表
    getTowers()                      // 获取塔列表
    getBullets()                     // 获取子弹列表
    getScore()                       // 获取分数
    getWave()                        // 获取当前波次
    getGameTime()                    // 获取游戏时间
    
    // 📝 状态设置器
    setPlayer(playerData)            // 设置玩家状态
    updateScore(points)              // 更新分数
    incrementWave()                  // 增加波次
    updateGameTime(deltaTime)        // 更新游戏时间
    
    // 🔄 状态变更通知
    notifyStateChange(key, value)    // 通知状态变更
    subscribeToChanges(callback)     // 订阅状态变更
}
```

### 📡 EventSystem
```javascript
// 📁 src/core/EventSystem.js
class EventSystem {
    // 🔗 事件注册
    on(event, callback, context)     // 注册事件监听器
    once(event, callback, context)   // 注册一次性监听器
    off(event, callback, context)    // 移除事件监听器
    
    // 📢 事件触发
    emit(event, ...args)             // 同步触发事件
    emitAsync(event, ...args)        // 异步触发事件
    
    // 🧹 事件管理
    clear()                          // 清除所有监听器
    clearEvent(event)                // 清除指定事件监听器
    hasListeners(event)              // 检查是否有监听器
    getListenerCount(event)          // 获取监听器数量
    
    // 📋 预定义事件常量
    static EVENTS = {
        // 游戏流程事件
        GAME_START: 'game_start',
        GAME_PAUSE: 'game_pause',
        GAME_RESUME: 'game_resume',
        GAME_OVER: 'game_over',
        WAVE_START: 'wave_start',
        WAVE_COMPLETE: 'wave_complete',
        
        // 实体事件
        PLAYER_MOVE: 'player_move',
        PLAYER_ATTACK: 'player_attack',
        PLAYER_DAMAGE: 'player_damage',
        DRAGON_SPAWN: 'dragon_spawn',
        DRAGON_DEATH: 'dragon_death',
        TOWER_BUILD: 'tower_build',
        TOWER_UPGRADE: 'tower_upgrade',
        
        // 系统事件
        ACHIEVEMENT_UNLOCK: 'achievement_unlock',
        EFFECT_CREATE: 'effect_create',
        SOUND_PLAY: 'sound_play'
    }
}
```

---

## 战斗系统 (Combat)

### ⚔️ CombatSystem
```javascript
// 📁 src/systems/combat/CombatSystem.js
class CombatSystem {
    // 🎯 战斗管理
    constructor(gameState, eventSystem)  // 初始化战斗系统
    update(deltaTime)                    // 更新战斗逻辑
    
    // 🔫 攻击处理
    processPlayerAttack(target)          // 处理玩家攻击
    processTowerAttack(tower, target)    // 处理塔攻击
    processDragonAttack(dragon, target)  // 处理龙攻击
    
    // 💥 伤害计算
    calculateDamage(attacker, target)    // 计算基础伤害
    applyElementalDamage(damage, attackerElement, targetElement)  // 应用元素伤害
    applyArmorReduction(damage, armor)   // 应用护甲减免
    
    // 🎪 特殊效果
    applyStatusEffect(target, effect)    // 应用状态效果
    updateStatusEffects(entity, deltaTime) // 更新状态效果
    removeExpiredEffects(entity)         // 移除过期效果
    
    // 📊 战斗统计
    recordDamage(amount, type)           // 记录伤害统计
    recordKill(killerType, targetType)   // 记录击杀统计
    getCombatStats()                     // 获取战斗统计
}
```

### 🎯 CollisionDetector
```javascript
// 📁 src/systems/combat/CollisionDetector.js
class CollisionDetector {
    // 🔍 碰撞检测方法
    pointInCircle(point, circle)         // 点与圆碰撞
    circleToCircle(circle1, circle2)     // 圆与圆碰撞
    pointInRect(point, rect)             // 点与矩形碰撞
    circleToRect(circle, rect)           // 圆与矩形碰撞
    
    // 🎯 游戏特定碰撞
    bulletHitDragon(bullet, dragon)      // 子弹击中龙
    playerTouchDragon(player, dragon)    // 玩家接触龙
    bulletHitTower(bullet, tower)        // 子弹击中塔
    
    // 📏 距离计算
    getDistance(obj1, obj2)              // 计算两点距离
    getDistanceSquared(obj1, obj2)       // 计算距离平方（性能优化）
    isInRange(obj1, obj2, range)         // 检查是否在范围内
    
    // 🔧 批量检测
    checkAllCollisions()                 // 检查所有碰撞
    checkBulletCollisions()              // 检查子弹碰撞
    checkEntityCollisions()              // 检查实体碰撞
}
```

---

## 元素系统 (Elements)

### 🔥 ElementSystem
```javascript
// 📁 src/systems/elements/ElementSystem.js
class ElementSystem {
    // 🏗️ 系统初始化
    constructor()                        // 初始化元素系统
    initialize()                         // 加载元素配置
    
    // 🌟 元素管理
    getElement(type)                     // 获取元素配置
    getAllElements()                     // 获取所有元素
    getElementByName(name)               // 通过名称获取元素
    
    // ⚔️ 元素克制
    getEffectiveness(attackElement, targetElement)  // 获取克制效果
    getDamageMultiplier(attacker, target)          // 获取伤害倍率
    getResistance(element, damageType)             // 获取抗性
    
    // ✨ 元素效果
    applyElementEffect(target, element, strength)  // 应用元素效果
    createElementParticles(x, y, element)          // 创建元素粒子
    playElementSound(element, action)              // 播放元素音效
    
    // 🎯 随机选择
    getRandomElement(waveNumber)         // 根据波次随机选择元素
    getWeightedRandomElement(weights)    // 根据权重随机选择
    
    // 📊 元素统计
    getElementUsageStats()               // 获取元素使用统计
    getElementEffectivenessStats()       // 获取元素效果统计
}
```

### 🌈 ElementEffects
```javascript
// 📁 src/systems/elements/ElementEffects.js
class ElementEffects {
    // 🔥 火元素效果
    applyBurnEffect(target, duration, damage)     // 燃烧效果
    createFireParticles(x, y, count)              // 火焰粒子
    fireExplosion(x, y, radius)                   // 火焰爆炸
    
    // ❄️ 冰元素效果
    applyFreezeEffect(target, duration, slowPercent)  // 冰冻效果
    createIceParticles(x, y, count)               // 冰晶粒子
    iceShatter(x, y, pieces)                      // 冰晶破碎
    
    // ⚡ 雷元素效果
    applyShockEffect(target, damage, chainRange)  // 电击效果
    createLightningBolt(start, end)               // 闪电效果
    chainLightning(origin, targets, damage)       // 连锁闪电
    
    // 🧪 毒元素效果
    applyPoisonEffect(target, duration, dps)      // 中毒效果
    createPoisonCloud(x, y, radius)               // 毒云效果
    poisonSpread(center, radius, strength)        // 毒素扩散
    
    // 🌑 暗元素效果
    applyDarkEffect(target, debuffType)           // 暗系效果
    createDarkVoid(x, y, radius)                  // 暗影虚空
    drainLife(source, target, amount)             // 生命汲取
    
    // 🛡️ 效果管理
    updateAllEffects(deltaTime)                   // 更新所有效果
    removeEffect(target, effectType)             // 移除指定效果
    clearAllEffects(target)                      // 清除所有效果
}
```

---

## 实体系统 (Entities)

### 👤 Player
```javascript
// 📁 src/systems/entities/Player.js
class Player {
    // 🏗️ 玩家初始化
    constructor(x, y)                    // 创建玩家
    initialize()                         // 初始化玩家属性
    reset()                              // 重置玩家状态
    
    // 🏃 移动系统
    move(direction, deltaTime)           // 移动玩家
    setPosition(x, y)                    // 设置位置
    getPosition()                        // 获取位置
    checkBoundaries()                    // 检查边界碰撞
    
    // ⚔️ 战斗系统
    attack(target)                       // 攻击目标
    takeDamage(amount, damageType)       // 受到伤害
    heal(amount)                         // 恢复生命
    setWeaponElement(element)            // 设置武器元素
    
    // 📈 升级系统
    gainExperience(amount)               // 获得经验
    levelUp()                            // 升级
    upgradeAttribute(attribute)          // 升级属性
    
    // 🎯 状态查询
    isAlive()                            // 是否存活
    getHealthPercent()                   // 获取生命百分比
    getCurrentLevel()                    // 获取当前等级
    getExperienceToNext()                // 获取升级所需经验
    
    // 🎨 渲染相关
    update(deltaTime)                    // 更新玩家状态
    render(ctx)                          // 渲染玩家
    renderHealthBar(ctx)                 // 渲染生命条
}
```

### 🐉 Dragon  
```javascript
// 📁 src/systems/entities/Dragon.js
class Dragon {
    // 🏗️ 龙初始化
    constructor(type, x, y)              // 创建龙
    initializeByType(type)               // 根据类型初始化
    initializeAI()                       // 初始化AI
    
    // 🧠 AI系统
    updateAI(deltaTime)                  // 更新AI逻辑
    findTarget()                         // 寻找攻击目标
    moveTowardsTarget()                  // 向目标移动
    attackTarget()                       // 攻击目标
    
    // 🌟 特殊能力
    useSpecialAbility()                  // 使用特殊能力
    checkAbilityCooldown()               // 检查技能冷却
    activateElementalPower()             // 激活元素力量
    
    // 🎭 行为状态
    setState(newState)                   // 设置行为状态
    getState()                           // 获取当前状态
    canAttack()                          // 是否可以攻击
    canMove()                            // 是否可以移动
    
    // 💀 死亡处理
    takeDamage(amount, damageType, attacker)  // 受到伤害
    die()                                // 死亡处理
    dropLoot()                           // 掉落战利品
    createDeathEffect()                  // 创建死亡特效
    
    // 🎨 渲染相关
    update(deltaTime)                    // 更新龙状态
    render(ctx)                          // 渲染龙
    renderHealthBar(ctx)                 // 渲染生命条
    renderElementGlow(ctx)               // 渲染元素光效
}
```

### 🏰 Tower
```javascript
// 📁 src/systems/entities/Tower.js  
class Tower {
    // 🏗️ 塔初始化
    constructor(x, y, type)              // 创建塔
    initialize()                         // 初始化塔属性
    
    // 🎯 攻击系统
    findTargetsInRange()                 // 寻找射程内目标
    selectTarget()                       // 选择攻击目标
    attack(target)                       // 攻击目标
    createProjectile(target)             // 创建投射物
    
    // 📈 升级系统
    canUpgrade()                         // 是否可以升级
    upgrade()                            // 升级塔
    getUpgradeCost()                     // 获取升级成本
    unlockSpecialAbility()               // 解锁特殊能力
    
    // 🌟 特殊能力
    hasAbility(abilityType)              // 是否拥有能力
    useAbility(abilityType)              // 使用特殊能力
    getAbilityCooldown(abilityType)      // 获取能力冷却时间
    
    // ⚙️ 配置管理
    setElement(element)                  // 设置元素属性
    getElement()                         // 获取元素属性
    modifyStats(statType, value)         // 修改属性值
    
    // 🎨 渲染相关
    update(deltaTime)                    // 更新塔状态
    render(ctx)                          // 渲染塔
    renderRange(ctx)                     // 渲染射程指示
    renderUpgradeIndicator(ctx)          // 渲染升级指示
}
```

---

## 渲染系统 (Rendering)

### 🎨 RenderEngine
```javascript
// 📁 src/rendering/RenderEngine.js
class RenderEngine {
    // 🏗️ 渲染引擎初始化
    constructor(canvas)                  // 初始化渲染引擎
    initialize()                         // 设置渲染参数
    
    // 🎬 主渲染方法
    render(gameState)                    // 主渲染方法
    clearCanvas()                        // 清空画布
    
    // 🎭 分层渲染
    renderBackground()                   // 渲染背景层
    renderEntities(entities)             // 渲染实体层
    renderEffects(effects)               // 渲染特效层
    renderUI(uiData)                     // 渲染UI层
    renderHUD(hudData)                   // 渲染HUD层
    
    // 🎪 特效渲染
    renderParticles(particles)           // 渲染粒子系统
    renderExplosion(x, y, type)          // 渲染爆炸效果
    renderElementalEffect(effect)        // 渲染元素效果
    
    // 📊 性能优化
    enableFrustumCulling()               // 启用视锥剔除
    updateViewport(x, y, width, height)  // 更新视口
    isInViewport(entity)                 // 检查是否在视口内
    
    // 🎛️ 渲染设置
    setRenderQuality(quality)            // 设置渲染质量
    enableVSync(enabled)                 // 启用垂直同步
    getFrameRate()                       // 获取帧率
}
```

### ✨ ParticleSystem
```javascript
// 📁 src/rendering/ParticleSystem.js
class ParticleSystem {
    // 🏗️ 粒子系统初始化
    constructor()                        // 初始化粒子系统
    
    // 🎆 粒子创建
    createParticle(config)               // 创建单个粒子
    createExplosion(x, y, config)        // 创建爆炸粒子群
    createTrail(start, end, config)      // 创建拖尾粒子
    createElementParticles(x, y, element) // 创建元素粒子
    
    // 🔄 粒子更新
    update(deltaTime)                    // 更新所有粒子
    updateParticle(particle, deltaTime)  // 更新单个粒子
    removeDeadParticles()                // 移除死亡粒子
    
    // 🎨 粒子渲染
    render(ctx)                          // 渲染所有粒子
    renderParticle(ctx, particle)        // 渲染单个粒子
    
    // 🧹 粒子管理
    clear()                              // 清除所有粒子
    getParticleCount()                   // 获取粒子数量
    setMaxParticles(max)                 // 设置最大粒子数
    
    // 🎛️ 预设效果
    static PRESETS = {
        FIRE: { /* 火焰效果配置 */ },
        ICE: { /* 冰霜效果配置 */ },
        LIGHTNING: { /* 雷电效果配置 */ },
        POISON: { /* 毒素效果配置 */ },
        DARK: { /* 暗影效果配置 */ }
    }
}
```

---

## UI系统 (Interface)

### 🖥️ UIRenderer
```javascript
// 📁 src/ui/UIRenderer.js
class UIRenderer {
    // 🏗️ UI渲染器初始化
    constructor(canvas)                  // 初始化UI渲染器
    
    // 📋 HUD渲染
    renderHUD(gameState)                 // 渲染游戏HUD
    renderScoreBoard(score, wave)        // 渲染计分板
    renderHealthBar(health, maxHealth)   // 渲染生命条
    renderMiniMap(entities)              // 渲染小地图
    
    // 🎯 信息面板
    renderDragonInfo(dragon)             // 渲染龙信息
    renderTowerInfo(tower)               // 渲染塔信息
    renderPlayerInfo(player)             // 渲染玩家信息
    renderElementalInfo(elements)        // 渲染元素信息
    
    // 📜 菜单系统
    renderMainMenu()                     // 渲染主菜单
    renderPauseMenu()                    // 渲染暂停菜单
    renderGameOverScreen()               // 渲染游戏结束画面
    renderSettingsMenu()                 // 渲染设置菜单
    
    // 🎖️ 成就显示
    renderAchievements(achievements)     // 渲染成就列表
    renderAchievementNotification(achievement) // 渲染成就通知
    renderProgressBar(current, max)      // 渲染进度条
    
    // 💬 通知系统
    renderNotification(message, type)    // 渲染通知消息
    renderDamageNumbers(numbers)         // 渲染伤害数字
    renderFloatingText(text, x, y)       // 渲染浮动文字
}
```

---

## 音效系统 (Audio)

### 🔊 AudioSystem
```javascript
// 📁 src/systems/audio/AudioSystem.js
class AudioSystem {
    // 🏗️ 音效系统初始化
    constructor()                        // 初始化音效系统
    loadAudioAssets()                    // 加载音效资源
    
    // 🎵 音效播放
    playSound(soundName, volume, pitch)  // 播放音效
    playMusic(musicName, loop)           // 播放背景音乐
    stopSound(soundName)                 // 停止音效
    stopMusic()                          // 停止背景音乐
    
    // 🔧 音效管理
    setMasterVolume(volume)              // 设置主音量
    setSoundVolume(volume)               // 设置音效音量
    setMusicVolume(volume)               // 设置音乐音量
    
    // 🎪 动态音效
    playElementSound(element, action)    // 播放元素音效
    playImpactSound(materialType)        // 播放撞击音效
    playAmbientSound(environment)        // 播放环境音效
    
    // 📊 音效配置
    static SOUNDS = {
        // 游戏基础音效
        MENU_CLICK: 'menu_click',
        GAME_START: 'game_start',
        GAME_OVER: 'game_over',
        
        // 战斗音效
        PLAYER_SHOOT: 'player_shoot',
        BULLET_HIT: 'bullet_hit',
        EXPLOSION: 'explosion',
        
        // 元素音效
        FIRE_ATTACK: 'fire_attack',
        ICE_SHATTER: 'ice_shatter',
        THUNDER_STRIKE: 'thunder_strike',
        POISON_CLOUD: 'poison_cloud',
        DARK_VOID: 'dark_void',
        
        // 实体音效
        DRAGON_SPAWN: 'dragon_spawn',
        DRAGON_DEATH: 'dragon_death',
        TOWER_BUILD: 'tower_build',
        TOWER_UPGRADE: 'tower_upgrade',
        
        // 成就音效
        ACHIEVEMENT_UNLOCK: 'achievement_unlock',
        LEVEL_UP: 'level_up'
    }
}
```

---

## 成就系统 (Achievements)

### 🏆 AchievementSystem
```javascript
// 📁 src/systems/achievements/AchievementSystem.js
class AchievementSystem {
    // 🏗️ 成就系统初始化
    constructor(eventSystem)             // 初始化成就系统
    loadAchievements()                   // 加载成就配置
    
    // 🎯 成就检查
    checkAchievements(gameState)         // 检查所有成就
    checkKillAchievements(killedType)    // 检查击杀成就
    checkProgressAchievements(stats)     // 检查进度成就
    checkSpecialAchievements(event)      // 检查特殊成就
    
    // 🔓 成就解锁
    unlockAchievement(achievementId)     // 解锁成就
    isAchievementUnlocked(achievementId) // 检查成就是否已解锁
    getUnlockedAchievements()            // 获取已解锁成就
    
    // 📊 进度追踪
    updateProgress(achievementId, progress) // 更新成就进度
    getProgress(achievementId)           // 获取成就进度
    getProgressPercent(achievementId)    // 获取进度百分比
    
    // 🎁 奖励发放
    grantAchievementReward(achievementId) // 发放成就奖励
    calculateRewardValue(achievement)     // 计算奖励价值
    
    // 📋 成就数据
    static ACHIEVEMENTS = {
        // 击杀成就
        FIRE_SLAYER_I: { type: 'kill', target: 'fire', count: 10, reward: 100 },
        FIRE_SLAYER_II: { type: 'kill', target: 'fire', count: 50, reward: 500 },
        FIRE_SLAYER_III: { type: 'kill', target: 'fire', count: 100, reward: 1000 },
        
        // 其他元素击杀成就...
        
        // 特殊成就
        DRAGON_MASTER: { type: 'special', requirement: 'kill_all_elements', reward: 5000 },
        LEGENDARY_HUNTER: { type: 'special', requirement: 'kill_100_dark_dragons', reward: 10000 }
    }
}
```

---

## 生成系统 (Spawn)

### 🌊 SpawnSystem
```javascript
// 📁 src/systems/spawn/SpawnSystem.js
class SpawnSystem {
    // 🏗️ 生成系统初始化
    constructor(gameState, eventSystem)  // 初始化生成系统
    
    // 🌊 波次管理
    startWave(waveNumber)                // 开始新波次
    completeWave()                       // 完成当前波次
    calculateWaveDifficulty(wave)        // 计算波次难度
    
    // 🐉 龙生成逻辑
    spawnDragon()                        // 生成龙
    chooseDragonType(waveNumber)         // 选择龙类型
    createDragonByType(type)             // 根据类型创建龙
    
    // ⏰ 生成时机
    updateSpawnTimer(deltaTime)          // 更新生成计时器
    getSpawnInterval(waveNumber)         // 获取生成间隔
    shouldSpawnDragon()                  // 是否应该生成龙
    
    // 🎯 生成位置
    getSpawnPosition()                   // 获取生成位置
    findValidSpawnPoint()                // 寻找有效生成点
    isPositionValid(x, y)                // 检查位置是否有效
    
    // 📊 难度调整
    adjustElementWeights(waveNumber)     // 调整元素权重
    getDifficultyMultiplier(wave)        // 获取难度倍率
    scaleDragonStats(dragon, multiplier) // 缩放龙属性
}
```

---

## 数据管理功能

### 📁 ConfigManager
```javascript
// 📁 src/core/ConfigManager.js
class ConfigManager {
    // 🏗️ 配置管理器初始化
    constructor()                        // 初始化配置管理器
    loadConfigurations()                 // 加载所有配置
    
    // 📖 配置读取
    getGameConfig()                      // 获取游戏配置
    getElementConfig()                   // 获取元素配置
    getBalanceConfig()                   // 获取平衡配置
    getAudioConfig()                     // 获取音频配置
    
    // ✏️ 配置修改
    updateConfig(section, key, value)    // 更新配置项
    saveConfig()                         // 保存配置
    resetToDefault()                     // 重置为默认配置
    
    // 🔄 热重载
    reloadConfig(section)                // 重新加载配置
    watchConfigChanges()                 // 监听配置变化
    
    // ✅ 配置验证
    validateConfig(config)               // 验证配置格式
    getConfigSchema()                    // 获取配置模式
}
```

---

## 🔧 工具函数库

### 📐 MathUtils
```javascript
// 📁 src/utils/MathUtils.js
class MathUtils {
    // 📏 基础数学
    static distance(x1, y1, x2, y2)      // 计算两点距离
    static distanceSquared(x1, y1, x2, y2) // 计算距离平方
    static lerp(start, end, t)           // 线性插值
    static clamp(value, min, max)        // 数值限制
    
    // 📐 角度计算
    static angleBetween(x1, y1, x2, y2)  // 计算两点间角度
    static normalizeAngle(angle)         // 角度标准化
    static degreesToRadians(degrees)     // 角度转弧度
    static radiansToDegrees(radians)     // 弧度转角度
    
    // 🎯 向量运算
    static normalize(vector)             // 向量标准化
    static dotProduct(v1, v2)            // 向量点积
    static crossProduct(v1, v2)          // 向量叉积
    static vectorLength(vector)          // 向量长度
}
```

### 🎨 ColorUtils
```javascript
// 📁 src/utils/ColorUtils.js
class ColorUtils {
    // 🎨 颜色转换
    static hexToRgb(hex)                 // 十六进制转RGB
    static rgbToHex(r, g, b)             // RGB转十六进制
    static hslToRgb(h, s, l)             // HSL转RGB
    static rgbToHsl(r, g, b)             // RGB转HSL
    
    // 🌈 颜色操作
    static lighten(color, amount)        // 颜色变亮
    static darken(color, amount)         // 颜色变暗
    static blend(color1, color2, ratio)  // 颜色混合
    static getRandomColor()              // 随机颜色
    
    // ✨ 元素色彩
    static getElementColor(element)      // 获取元素颜色
    static getElementGlow(element)       // 获取元素光效色
    static getDamageColor(effectiveness) // 获取伤害颜色
}
```

---

## 🚨 重要开发规则

### 1. 📋 代码修改前必检查项
- [ ] 查看 `FUNCTION_MAP.md` 确认功能是否已存在
- [ ] 查看 `ARCHITECTURE.md` 了解模块分工
- [ ] 检查相关模块是否已有类似功能
- [ ] 确认修改不会破坏现有功能

### 2. 🔄 复用优先原则
- 优先使用现有函数而非重新实现
- 扩展现有类而非创建新类
- 复用现有事件系统进行模块通信
- 使用现有配置系统管理参数

### 3. 📝 代码提交规范
- 修改功能后及时更新结构图
- 新增函数必须添加到对应模块文档
- 重构代码后验证所有相关功能
- 保持向后兼容性

### 4. 🎯 扩展开发指导
- 新功能优先考虑事件驱动实现
- 新实体继承对应基类
- 新系统实现标准生命周期方法
- 新配置项添加到对应配置文件

---

## 📊 快速参考

### 🔍 常用功能快速定位
| 需求 | 模块 | 主要函数 |
|------|------|----------|
| 添加新元素 | ElementSystem | `getElement()`, `applyElementEffect()` |
| 修改伤害计算 | CombatSystem | `calculateDamage()`, `applyElementalDamage()` |
| 添加特效 | ParticleSystem | `createParticle()`, `createElementParticles()` |
| 新增音效 | AudioSystem | `playSound()`, `playElementSound()` |
| 添加成就 | AchievementSystem | `checkAchievements()`, `unlockAchievement()` |
| 修改UI | UIRenderer | `renderHUD()`, `renderNotification()` |
| 调整生成 | SpawnSystem | `spawnDragon()`, `chooseDragonType()` |

### 🎨 常用工具函数
| 功能 | 函数 | 用途 |
|------|------|------|
| 距离计算 | `MathUtils.distance()` | 碰撞检测、AI |
| 颜色处理 | `ColorUtils.getElementColor()` | 渲染、特效 |
| 随机选择 | `RandomUtils.weightedChoice()` | 生成、掉落 |
| 事件通信 | `EventSystem.emit()` | 模块通信 |

这个结构图确保了开发过程中的代码复用和功能一致性！
