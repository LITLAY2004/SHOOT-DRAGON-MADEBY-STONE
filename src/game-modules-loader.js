/**
 * 游戏模块加载器
 * 负责按正确顺序加载所有游戏模块
 */

(function() {
    'use strict';

    // 检查是否在浏览器环境中
    const isBrowser = typeof window !== 'undefined';
    
    if (isBrowser) {
        console.log('开始加载游戏模块...');
        
        // 定义模块加载顺序（从依赖最少到依赖最多）
        const modules = [
            // 1. 工具类（无依赖）
            'utils/MathUtils.js',
            
            // 2. 配置文件（无依赖）
            'config/ElementConfig.js',
            
            // 3. 核心系统（基础依赖）
            'core/EventSystem.js',
            'core/GameState.js',
            
            // 4. 游戏系统（依赖核心系统）
            'systems/elements/ElementSystem.js',
            
            // 5. 主控制器（依赖所有系统）
            'core/GameController.js',
            
            // 6. 兼容性层（依赖所有模块）
            'game-refactored.js'
        ];
        
        let loadedModules = 0;
        const totalModules = modules.length;
        
        /**
         * 加载模块的函数
         */
        function loadModule(modulePath, callback) {
            const script = document.createElement('script');
            script.src = `src/${modulePath}`;
            script.async = false; // 保证按顺序加载
            
            script.onload = function() {
                loadedModules++;
                console.log(`✓ 已加载模块: ${modulePath} (${loadedModules}/${totalModules})`);
                
                if (callback) {
                    callback(null);
                }
            };
            
            script.onerror = function() {
                console.error(`✗ 加载模块失败: ${modulePath}`);
                if (callback) {
                    callback(new Error(`Failed to load ${modulePath}`));
                }
            };
            
            document.head.appendChild(script);
        }
        
        /**
         * 按顺序加载所有模块
         */
        function loadModulesSequentially(moduleList, callback) {
            if (moduleList.length === 0) {
                if (callback) callback();
                return;
            }
            
            const [currentModule, ...remainingModules] = moduleList;
            
            loadModule(currentModule, (error) => {
                if (error) {
                    console.error('模块加载失败，停止加载:', error);
                    if (callback) callback(error);
                    return;
                }
                
                // 递归加载剩余模块
                loadModulesSequentially(remainingModules, callback);
            });
        }
        
        /**
         * 开始加载所有模块
         */
        loadModulesSequentially(modules, (error) => {
            if (error) {
                console.error('❌ 游戏模块加载失败:', error);
                // 显示错误信息给用户
                showLoadingError(error);
            } else {
                console.log('✅ 所有游戏模块加载完成！');
                // 通知游戏可以初始化了
                window.dispatchEvent(new CustomEvent('gameModulesLoaded'));
            }
        });
        
        /**
         * 显示加载错误
         */
        function showLoadingError(error) {
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #ff4444;
                color: white;
                padding: 20px;
                border-radius: 10px;
                font-family: Arial, sans-serif;
                text-align: center;
                z-index: 10000;
            `;
            errorDiv.innerHTML = `
                <h3>游戏加载失败</h3>
                <p>请检查网络连接或刷新页面重试</p>
                <p style="font-size: 12px; opacity: 0.8;">错误详情: ${error.message}</p>
            `;
            document.body.appendChild(errorDiv);
        }
        
        /**
         * 显示加载进度
         */
        function createLoadingIndicator() {
            const loadingDiv = document.createElement('div');
            loadingDiv.id = 'gameLoading';
            loadingDiv.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 20px;
                border-radius: 10px;
                font-family: Arial, sans-serif;
                text-align: center;
                z-index: 9999;
            `;
            loadingDiv.innerHTML = `
                <h3>🐉 数字龙猎</h3>
                <p>正在加载游戏模块...</p>
                <div style="width: 200px; height: 4px; background: #333; border-radius: 2px; margin: 10px auto;">
                    <div id="loadingBar" style="width: 0%; height: 100%; background: #4CAF50; border-radius: 2px; transition: width 0.3s;"></div>
                </div>
                <p id="loadingStatus" style="font-size: 12px; opacity: 0.8;">准备中...</p>
            `;
            document.body.appendChild(loadingDiv);
            
            // 更新进度条
            const updateProgress = () => {
                const progress = (loadedModules / totalModules) * 100;
                const progressBar = document.getElementById('loadingBar');
                const statusText = document.getElementById('loadingStatus');
                
                if (progressBar) {
                    progressBar.style.width = progress + '%';
                }
                
                if (statusText) {
                    statusText.textContent = `${loadedModules}/${totalModules} 模块已加载`;
                }
                
                if (loadedModules < totalModules) {
                    setTimeout(updateProgress, 100);
                } else {
                    setTimeout(() => {
                        const loadingElement = document.getElementById('gameLoading');
                        if (loadingElement) {
                            loadingElement.remove();
                        }
                    }, 500);
                }
            };
            
            updateProgress();
        }
        
        // 创建加载指示器
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', createLoadingIndicator);
        } else {
            createLoadingIndicator();
        }
        
        // 为了方便调试，提供模块信息
        window.GameModules = {
            modules: modules,
            loadedCount: () => loadedModules,
            totalCount: () => totalModules,
            isReady: () => loadedModules === totalModules,
            getLoadedModules: () => modules.slice(0, loadedModules)
        };
        
    } else {
        // Node.js 环境
        console.log('检测到Node.js环境，跳过浏览器模块加载');
    }
})();

// 模块加载完成事件
if (typeof window !== 'undefined') {
    window.addEventListener('gameModulesLoaded', function() {
        console.log('🎮 游戏已准备就绪！');
        
        // 检查是否所有必要的类都已加载
        const requiredClasses = [
            'EventSystem',
            'GameState', 
            'MathUtils',
            'ElementConfig',
            'ElementSystem',
            'GameController',
            'DragonHunterGame'
        ];
        
        const missingClasses = requiredClasses.filter(className => typeof window[className] === 'undefined');
        
        if (missingClasses.length > 0) {
            console.warn('⚠️ 以下类未正确加载:', missingClasses);
        } else {
            console.log('✅ 所有核心类已正确加载');
            
            // 可以在这里添加自动启动游戏的逻辑
            if (typeof window.initializeGame === 'function') {
                window.initializeGame();
            }
        }
    });
}
