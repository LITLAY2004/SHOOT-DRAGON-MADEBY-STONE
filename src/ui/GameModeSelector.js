/**
 * 游戏模式选择器UI组件
 * 提供美观的模式选择和关卡选择界面
 */

class GameModeSelector {
    constructor(container, gameInstance) {
        this.container = container;
        this.game = gameInstance;
        this.currentMode = null;
        this.selectedLevel = null;
        
        this.setupUI();
        this.bindEvents();
    }

    /**
     * 设置UI结构
     */
    setupUI() {
        this.container.innerHTML = `
            <div class="game-mode-selector">
                <!-- 主标题 -->
                <div class="mode-selector-header">
                    <h1 class="mode-selector-title">
                        <span class="title-icon">🎮</span>
                        选择游戏模式
                    </h1>
                    <button class="close-btn" id="closeModeSelector" title="关闭选择器">
                        <span class="close-icon">✖</span>
                    </button>
                    <p class="mode-selector-subtitle">选择您想要的挑战方式</p>
                </div>

                <!-- 模式卡片区域 -->
                <div class="mode-cards-container">
                    <div class="mode-card" data-mode="adventure">
                        <div class="mode-card-icon">🗺️</div>
                        <h3 class="mode-card-title">闯关模式</h3>
                        <p class="mode-card-description">
                            通过精心设计的关卡，每个关卡都有独特的挑战和奖励
                        </p>
                        <div class="mode-card-features">
                            <span class="feature-tag">🎯 目标明确</span>
                            <span class="feature-tag">🏆 丰富奖励</span>
                            <span class="feature-tag">📈 渐进难度</span>
                        </div>
                        <button class="mode-select-btn" data-mode="adventure">
                            选择闯关
                        </button>
                    </div>

                    <div class="mode-card" data-mode="endless">
                        <div class="mode-card-icon">♾️</div>
                        <h3 class="mode-card-title">无限模式</h3>
                        <p class="mode-card-description">
                            挑战你的极限！坚持得越久，奖励越丰厚
                        </p>
                        <div class="mode-card-features">
                            <span class="feature-tag">🔥 无限挑战</span>
                            <span class="feature-tag">📊 排行榜</span>
                            <span class="feature-tag">💎 稀有奖励</span>
                        </div>
                        <button class="mode-select-btn" data-mode="endless">
                            开始挑战
                        </button>
                    </div>

                    <div class="mode-card" data-mode="survival">
                        <div class="mode-card-icon">🛡️</div>
                        <h3 class="mode-card-title">生存模式</h3>
                        <p class="mode-card-description">
                            保护你的基地，建造防御塔，抵御敌人的猛攻
                        </p>
                        <div class="mode-card-features">
                            <span class="feature-tag">🏗️ 塔防策略</span>
                            <span class="feature-tag">⚡ 资源管理</span>
                            <span class="feature-tag">🎲 策略深度</span>
                        </div>
                        <button class="mode-select-btn disabled" data-mode="survival" disabled>
                            即将推出
                        </button>
                    </div>
                </div>

                <!-- 关卡选择面板（闯关模式专用） -->
                <div class="level-selector-panel hidden" id="levelSelectorPanel">
                    <div class="level-selector-header">
                        <h2>选择关卡</h2>
                        <button class="back-btn" id="backToModes">← 返回模式选择</button>
                    </div>
                    <div class="levels-grid" id="levelsGrid">
                        <!-- 关卡卡片将动态生成 -->
                    </div>
                </div>

                <!-- 无限模式配置面板 -->
                <div class="endless-config-panel hidden" id="endlessConfigPanel">
                    <div class="endless-config-header">
                        <h2>无限挑战配置</h2>
                        <button class="back-btn" id="backToModesFromEndless">← 返回模式选择</button>
                    </div>
                    <div class="endless-config-content">
                        <div class="config-section">
                            <h3>个人最佳记录</h3>
                            <div class="record-display">
                                <div class="record-item">
                                    <span class="record-label">最高波次</span>
                                    <span class="record-value" id="bestWave">0</span>
                                </div>
                                <div class="record-item">
                                    <span class="record-label">最长存活</span>
                                    <span class="record-value" id="bestTime">00:00</span>
                                </div>
                                <div class="record-item">
                                    <span class="record-label">最高分数</span>
                                    <span class="record-value" id="bestScore">0</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="config-section">
                            <h3>难度设置</h3>
                            <div class="difficulty-selector">
                                <label class="difficulty-option">
                                    <input type="radio" name="difficulty" value="normal" checked>
                                    <span class="difficulty-label">
                                        <strong>标准</strong>
                                        <small>推荐的平衡体验</small>
                                    </span>
                                </label>
                                <label class="difficulty-option">
                                    <input type="radio" name="difficulty" value="hard">
                                    <span class="difficulty-label">
                                        <strong>困难</strong>
                                        <small>更快的敌人增强</small>
                                    </span>
                                </label>
                                <label class="difficulty-option">
                                    <input type="radio" name="difficulty" value="nightmare">
                                    <span class="difficulty-label">
                                        <strong>噩梦</strong>
                                        <small>只有真正的勇士</small>
                                    </span>
                                </label>
                            </div>
                        </div>
                        
                        <button class="start-endless-btn" id="startEndlessBtn">
                            🚀 开始无限挑战
                        </button>
                    </div>
                </div>

                <!-- 底部操作区域 -->
                <div class="mode-selector-footer">
                    <button class="settings-btn" id="settingsBtn">⚙️ 设置</button>
                    <button class="stats-btn" id="statsBtn">📊 统计</button>
                    <button class="help-btn" id="helpBtn">❓ 帮助</button>
                </div>
            </div>
        `;

        this.applyStyles();
    }

    /**
     * 应用样式
     */
    applyStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .game-mode-selector {
                max-width: 1200px;
                margin: 0 auto;
                padding: 2rem;
                font-family: 'Inter', sans-serif;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                min-height: 100vh;
                color: #ffffff;
            }

            .mode-selector-header {
                text-align: center;
                margin-bottom: 3rem;
                position: relative;
            }

            .mode-selector-title {
                font-size: 3rem;
                font-weight: 700;
                background: linear-gradient(45deg, #00d4ff, #ff00d4);
                -webkit-background-clip: text;
                background-clip: text;
                color: transparent;
                -webkit-text-fill-color: transparent;
                margin-bottom: 1rem;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 1rem;
            }

            .title-icon {
                font-size: 3rem;
                filter: drop-shadow(0 0 10px rgba(0, 212, 255, 0.5));
            }

            .mode-selector-subtitle {
                font-size: 1.2rem;
                color: #a0a0a0;
                margin: 0;
            }

            .close-btn {
                position: absolute;
                top: 15px;
                right: 20px;
                background: rgba(255, 68, 68, 0.2);
                border: 2px solid rgba(255, 68, 68, 0.4);
                border-radius: 50%;
                width: 50px;
                height: 50px;
                color: #ffffff;
                font-size: 20px;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                box-shadow: 0 4px 12px rgba(255, 68, 68, 0.3);
            }

            .close-btn:hover {
                background: rgba(255, 68, 68, 0.4);
                border-color: #ff4444;
                color: #ffffff;
                transform: scale(1.15);
                box-shadow: 0 6px 20px rgba(255, 68, 68, 0.5);
            }

            .close-btn:active {
                transform: scale(1.05);
                box-shadow: 0 2px 8px rgba(255, 68, 68, 0.6);
            }

            .close-icon {
                font-weight: bold;
                line-height: 1;
                user-select: none;
                display: block;
            }

            .mode-cards-container {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                gap: 2rem;
                margin-bottom: 3rem;
            }

            .mode-card {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 16px;
                padding: 2rem;
                text-align: center;
                transition: all 0.3s ease;
                backdrop-filter: blur(10px);
                cursor: pointer;
                position: relative;
                overflow: hidden;
            }

            .mode-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(45deg, transparent, rgba(0, 212, 255, 0.1), transparent);
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .mode-card:hover {
                transform: translateY(-8px);
                border-color: rgba(0, 212, 255, 0.5);
                box-shadow: 0 20px 40px rgba(0, 212, 255, 0.2);
            }

            .mode-card:hover::before {
                opacity: 1;
            }

            .mode-card-icon {
                font-size: 4rem;
                margin-bottom: 1rem;
                filter: drop-shadow(0 0 20px rgba(0, 212, 255, 0.5));
            }

            .mode-card-title {
                font-size: 1.5rem;
                font-weight: 600;
                margin-bottom: 1rem;
                color: #ffffff;
            }

            .mode-card-description {
                color: #b0b0b0;
                line-height: 1.6;
                margin-bottom: 1.5rem;
            }

            .mode-card-features {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5rem;
                justify-content: center;
                margin-bottom: 2rem;
            }

            .feature-tag {
                background: rgba(0, 212, 255, 0.2);
                border: 1px solid rgba(0, 212, 255, 0.3);
                border-radius: 20px;
                padding: 0.5rem 1rem;
                font-size: 0.8rem;
                font-weight: 500;
                color: #00d4ff;
            }

            .mode-select-btn {
                background: linear-gradient(45deg, #00d4ff, #0099cc);
                border: none;
                border-radius: 8px;
                padding: 1rem 2rem;
                color: white;
                font-weight: 600;
                font-size: 1rem;
                cursor: pointer;
                transition: all 0.3s ease;
                width: 100%;
                position: relative;
                z-index: 2;
            }

            .mode-select-btn:hover {
                background: linear-gradient(45deg, #00b8e6, #0088bb);
                transform: translateY(-2px);
                box-shadow: 0 10px 20px rgba(0, 212, 255, 0.3);
            }

            .mode-select-btn.disabled {
                background: rgba(255, 255, 255, 0.1);
                color: #666;
                cursor: not-allowed;
            }

            .mode-select-btn.disabled:hover {
                transform: none;
                box-shadow: none;
            }

            /* 关卡选择面板样式 */
            .level-selector-panel {
                background: rgba(0, 0, 0, 0.8);
                border-radius: 16px;
                padding: 2rem;
                margin-top: 2rem;
            }

            .level-selector-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 2rem;
            }

            .level-selector-header h2 {
                color: #ffffff;
                font-size: 2rem;
                margin: 0;
            }

            .back-btn {
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 8px;
                padding: 0.5rem 1rem;
                color: #ffffff;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .back-btn:hover {
                background: rgba(255, 255, 255, 0.2);
            }

            .levels-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                gap: 1.5rem;
            }

            /* 无限模式配置面板样式 */
            .endless-config-panel {
                background: rgba(0, 0, 0, 0.8);
                border-radius: 16px;
                padding: 2rem;
                margin-top: 2rem;
            }

            .endless-config-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 2rem;
            }

            .endless-config-header h2 {
                color: #ffffff;
                font-size: 2rem;
                margin: 0;
            }

            .config-section {
                margin-bottom: 2rem;
            }

            .config-section h3 {
                color: #00d4ff;
                font-size: 1.3rem;
                margin-bottom: 1rem;
            }

            .record-display {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
            }

            .record-item {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 8px;
                padding: 1rem;
                text-align: center;
            }

            .record-label {
                display: block;
                color: #a0a0a0;
                font-size: 0.9rem;
                margin-bottom: 0.5rem;
            }

            .record-value {
                display: block;
                color: #00d4ff;
                font-size: 1.5rem;
                font-weight: 600;
            }

            .difficulty-selector {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }

            .difficulty-option {
                display: flex;
                align-items: center;
                gap: 1rem;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 8px;
                padding: 1rem;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .difficulty-option:hover {
                background: rgba(255, 255, 255, 0.1);
            }

            .difficulty-option input[type="radio"] {
                accent-color: #00d4ff;
            }

            .difficulty-label strong {
                color: #ffffff;
                display: block;
                margin-bottom: 0.25rem;
            }

            .difficulty-label small {
                color: #a0a0a0;
            }

            .start-endless-btn {
                background: linear-gradient(45deg, #ff6b6b, #ee5a52);
                border: none;
                border-radius: 8px;
                padding: 1rem 2rem;
                color: white;
                font-weight: 600;
                font-size: 1.1rem;
                cursor: pointer;
                transition: all 0.3s ease;
                width: 100%;
                margin-top: 1rem;
            }

            .start-endless-btn:hover {
                background: linear-gradient(45deg, #ff5252, #e53935);
                transform: translateY(-2px);
                box-shadow: 0 10px 20px rgba(255, 107, 107, 0.3);
            }

            /* 底部操作区域 */
            .mode-selector-footer {
                display: flex;
                justify-content: center;
                gap: 1rem;
                margin-top: 3rem;
            }

            .mode-selector-footer button {
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 8px;
                padding: 0.75rem 1.5rem;
                color: #ffffff;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 0.9rem;
            }

            .mode-selector-footer button:hover {
                background: rgba(255, 255, 255, 0.2);
                transform: translateY(-2px);
            }

            /* 隐藏类 */
            .hidden {
                display: none !important;
            }

            /* 响应式设计 */
            @media (max-width: 768px) {
                .game-mode-selector {
                    padding: 1rem;
                }

                .mode-selector-title {
                    font-size: 2rem;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .mode-cards-container {
                    grid-template-columns: 1fr;
                    gap: 1rem;
                }

                .levels-grid {
                    grid-template-columns: 1fr;
                }

                .level-selector-header {
                    flex-direction: column;
                    gap: 1rem;
                    text-align: center;
                }

                .endless-config-header {
                    flex-direction: column;
                    gap: 1rem;
                    text-align: center;
                }

                .record-display {
                    grid-template-columns: 1fr;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 模式选择事件
        this.container.addEventListener('click', (e) => {
            if (e.target.matches('.mode-select-btn') && !e.target.disabled) {
                const mode = e.target.dataset.mode;
                this.selectMode(mode);
            }
            
            // 返回按钮事件
            if (e.target.matches('#backToModes') || e.target.matches('#backToModesFromEndless')) {
                this.showModeSelection();
            }
            
            // 开始无限模式按钮
            if (e.target.matches('#startEndlessBtn')) {
                this.startEndlessMode();
            }
            
            // 关闭选择器按钮
            if (e.target.matches('#closeModeSelector')) {
                this.hide();
                // 返回到游戏主菜单
                if (typeof document !== 'undefined') {
                    const gameMenu = document.getElementById('gameMenu');
                    if (gameMenu) {
                        gameMenu.classList.remove('hidden');
                    }
                }
            }
        });
    }

    /**
     * 选择游戏模式
     */
    selectMode(mode) {
        this.currentMode = mode;
        
        switch (mode) {
            case 'adventure':
                this.showLevelSelection();
                break;
            case 'endless':
                this.showEndlessConfiguration();
                break;
            case 'survival':
                // 暂未实现
                break;
        }
    }

    /**
     * 显示关卡选择
     */
    showLevelSelection() {
        const modeCards = this.container.querySelector('.mode-cards-container');
        const levelPanel = this.container.querySelector('#levelSelectorPanel');
        const levelsGrid = this.container.querySelector('#levelsGrid');
        
        modeCards.classList.add('hidden');
        levelPanel.classList.remove('hidden');
        
        // 生成关卡卡片
        this.generateLevelCards(levelsGrid);
    }

    /**
     * 生成关卡卡片
     */
    generateLevelCards(container) {
        const levels = LevelConfig.getAllLevels();
        const progressionSystem = this.game.progressionSystem;
        
        container.innerHTML = levels.map(level => {
            const isUnlocked = progressionSystem ? 
                progressionSystem.isLevelUnlocked(level.id) : 
                LevelConfig.isLevelUnlocked(level.id, []);
            const isCompleted = progressionSystem ? 
                progressionSystem.playerData.completedLevels.includes(level.id) : 
                false;
            
            return `
                <div class="level-card ${!isUnlocked ? 'locked' : ''} ${isCompleted ? 'completed' : ''}" 
                     data-level="${level.id}">
                    <div class="level-card-header">
                        <div class="level-number">${level.id}</div>
                        <div class="level-status">
                            ${isCompleted ? '✅' : isUnlocked ? '🔓' : '🔒'}
                        </div>
                    </div>
                    <h3 class="level-title">${level.name}</h3>
                    <p class="level-description">${level.description}</p>
                    <div class="level-objectives">
                        <div class="objective-item">
                            🎯 击败 ${level.objectives.killCount} 个敌人
                        </div>
                        <div class="objective-item">
                            ⏱️ 生存 ${level.objectives.surviveTime} 秒
                        </div>
                        ${level.objectives.specialConditions.map(condition => 
                            `<div class="objective-item">⭐ ${this.getConditionText(condition)}</div>`
                        ).join('')}
                    </div>
                    <div class="level-rewards">
                        <span class="reward-item">🪙 ${level.rewards.coins}</span>
                        <span class="reward-item">📈 ${level.rewards.experience}</span>
                        <span class="reward-item">🔮 ${level.rewards.skillPoints}SP</span>
                    </div>
                    <button class="level-start-btn ${!isUnlocked ? 'disabled' : ''}" 
                            ${!isUnlocked ? 'disabled' : ''} 
                            data-level="${level.id}">
                        ${isCompleted ? '重新挑战' : isUnlocked ? '开始关卡' : '未解锁'}
                    </button>
                </div>
            `;
        }).join('');
        
        // 添加关卡卡片样式
        this.addLevelCardStyles();
        
        // 绑定关卡开始事件
        container.addEventListener('click', (e) => {
            if (e.target.matches('.level-start-btn') && !e.target.disabled) {
                const levelId = parseInt(e.target.dataset.level);
                this.startLevel(levelId);
            }
        });
    }

    /**
     * 添加关卡卡片样式
     */
    addLevelCardStyles() {
        if (document.getElementById('level-card-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'level-card-styles';
        style.textContent = `
            .level-card {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                padding: 1.5rem;
                transition: all 0.3s ease;
                cursor: pointer;
            }

            .level-card:not(.locked):hover {
                transform: translateY(-4px);
                border-color: rgba(0, 212, 255, 0.5);
                box-shadow: 0 10px 20px rgba(0, 212, 255, 0.2);
            }

            .level-card.locked {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .level-card.completed {
                border-color: rgba(76, 175, 80, 0.5);
                background: rgba(76, 175, 80, 0.1);
            }

            .level-card-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
            }

            .level-number {
                background: linear-gradient(45deg, #00d4ff, #0099cc);
                color: white;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
                font-size: 1.2rem;
            }

            .level-status {
                font-size: 1.5rem;
            }

            .level-title {
                color: #ffffff;
                font-size: 1.3rem;
                margin-bottom: 0.5rem;
            }

            .level-description {
                color: #b0b0b0;
                line-height: 1.5;
                margin-bottom: 1rem;
                font-size: 0.9rem;
            }

            .level-objectives {
                margin-bottom: 1rem;
            }

            .objective-item {
                color: #a0a0a0;
                font-size: 0.85rem;
                margin-bottom: 0.25rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .level-rewards {
                display: flex;
                gap: 0.5rem;
                margin-bottom: 1rem;
                flex-wrap: wrap;
            }

            .reward-item {
                background: rgba(255, 215, 0, 0.2);
                border: 1px solid rgba(255, 215, 0, 0.3);
                border-radius: 12px;
                padding: 0.25rem 0.5rem;
                font-size: 0.8rem;
                color: #ffd700;
            }

            .level-start-btn {
                background: linear-gradient(45deg, #4caf50, #45a049);
                border: none;
                border-radius: 6px;
                padding: 0.75rem 1.5rem;
                color: white;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
                width: 100%;
            }

            .level-start-btn:hover:not(.disabled) {
                background: linear-gradient(45deg, #45a049, #3d8b40);
                transform: translateY(-2px);
            }

            .level-start-btn.disabled {
                background: rgba(255, 255, 255, 0.1);
                color: #666;
                cursor: not-allowed;
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * 显示无限模式配置
     */
    showEndlessConfiguration() {
        const modeCards = this.container.querySelector('.mode-cards-container');
        const endlessPanel = this.container.querySelector('#endlessConfigPanel');
        
        modeCards.classList.add('hidden');
        endlessPanel.classList.remove('hidden');
        
        // 加载个人记录
        this.loadEndlessRecords();
    }

    /**
     * 加载无限模式记录
     */
    loadEndlessRecords() {
        // 从进度系统加载记录
        let records = {};
        if (this.game.progressionSystem) {
            records = this.game.progressionSystem.playerData.endlessRecords;
        } else {
            // 后备方案：从本地存储加载
            records = JSON.parse(localStorage.getItem('endless_records') || '{}');
        }
        
        document.getElementById('bestWave').textContent = records.bestWave || 0;
        document.getElementById('bestTime').textContent = this.formatTime(records.bestTime || 0);
        document.getElementById('bestScore').textContent = records.bestScore || 0;
    }

    /**
     * 显示模式选择
     */
    showModeSelection() {
        const modeCards = this.container.querySelector('.mode-cards-container');
        const levelPanel = this.container.querySelector('#levelSelectorPanel');
        const endlessPanel = this.container.querySelector('#endlessConfigPanel');
        
        modeCards.classList.remove('hidden');
        levelPanel.classList.add('hidden');
        endlessPanel.classList.add('hidden');
    }

    /**
     * 开始关卡
     */
    startLevel(levelId) {
        // 记录选择
        this.currentMode = LevelConfig.GAME_MODES.ADVENTURE;
        this.selectedLevel = levelId;

        if (this.game && this.game.gameModeManager) {
            const success = this.game.gameModeManager.startMode(LevelConfig.GAME_MODES.ADVENTURE, levelId);
            if (success) {
                this.onGameStart();
            } else {
                // 回退到外部启动流程
                this.onGameStart();
            }
        } else {
            // 未传入完整的 game 实例时，直接通知外部由入口页完成创建与挂载
            this.onGameStart();
        }
    }

    /**
     * 开始无限模式
     */
    startEndlessMode() {
        const difficulty = document.querySelector('input[name="difficulty"]:checked').value;

        // 记录选择
        this.currentMode = LevelConfig.GAME_MODES.ENDLESS;
        this.selectedLevel = null;

        if (this.game && this.game.gameModeManager) {
            // 设置难度配置
            this.game.endlessDifficulty = difficulty;
            const success = this.game.gameModeManager.startMode(LevelConfig.GAME_MODES.ENDLESS);
            if (success) {
                this.onGameStart();
            } else {
                // 回退到外部启动流程
                this.onGameStart();
            }
        } else {
            // 未传入完整的 game 实例时，直接通知外部由入口页完成创建与挂载
            if (this.game) {
                this.game.endlessDifficulty = difficulty;
            }
            this.onGameStart();
        }
    }

    /**
     * 游戏开始回调
     */
    onGameStart() {
        // 隐藏模式选择器
        this.container.style.display = 'none';
        
        // 触发游戏开始事件
        if (this.game.eventSystem) {
            this.game.eventSystem.emit('mode_selected', {
                mode: this.currentMode,
                level: this.selectedLevel
            });
        }
    }

    /**
     * 显示模式选择器
     */
    show() {
        this.container.style.display = 'block';
        this.showModeSelection();
    }

    /**
     * 隐藏模式选择器
     */
    hide() {
        this.container.style.display = 'none';
    }

    /**
     * 获取条件文本
     */
    getConditionText(condition) {
        const conditionTexts = {
            'defeat_fire_dragon': '击败火元素龙',
            'defeat_ancient_dragon': '击败古龙',
            'use_elemental_combos': '使用元素连击',
            'survive_lightning_storm': '在雷电风暴中生存'
        };
        return conditionTexts[condition] || condition;
    }

    /**
     * 格式化时间
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameModeSelector;
} else if (typeof window !== 'undefined') {
    window.GameModeSelector = GameModeSelector;
}
