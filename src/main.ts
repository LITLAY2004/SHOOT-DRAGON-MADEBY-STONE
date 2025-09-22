/**
 * 🏰 塔防大师 - 主入口文件
 * Tower Defense Master - Main Entry Point
 */

import { Game } from '@/game/Game'
import { AssetManager } from '@/engine/AssetManager'

class GameBootstrap {
  private game: Game | null = null
  private loadingScreen: HTMLElement | null = null

  async init() {
    console.log('🎮 塔防大师启动中...')
    
    this.loadingScreen = document.getElementById('loading-screen')
    
    try {
      // 初始化资源管理器
      await AssetManager.getInstance().loadAllAssets()
      
      // 创建游戏实例
      this.game = new Game()
      await this.game.init()
      
      // 隐藏加载屏幕
      this.hideLoadingScreen()
      
      // 启动游戏循环
      this.game.start()
      
      console.log('🎉 游戏启动成功！')
    } catch (error) {
      console.error('❌ 游戏启动失败:', error)
      this.showError('游戏启动失败，请刷新页面重试')
    }
  }

  private hideLoadingScreen() {
    if (this.loadingScreen) {
      this.loadingScreen.style.opacity = '0'
      setTimeout(() => {
        if (this.loadingScreen) {
          this.loadingScreen.style.display = 'none'
        }
      }, 500)
    }
  }

  private showError(message: string) {
    if (this.loadingScreen) {
      this.loadingScreen.innerHTML = `
        <div style="color: #ff6b6b; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 20px;">❌</div>
          <div>${message}</div>
        </div>
      `
    }
  }
}

// 启动游戏
window.addEventListener('DOMContentLoaded', () => {
  const bootstrap = new GameBootstrap()
  bootstrap.init()
})
