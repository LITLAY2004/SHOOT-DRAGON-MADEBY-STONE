/**
 * AssetManager class stub for TypeScript compatibility
 * Main game implementation is in src/game.js
 */

export class AssetManager {
  private static instance: AssetManager | null = null
  
  static getInstance(): AssetManager {
    if (!AssetManager.instance) {
      AssetManager.instance = new AssetManager()
    }
    return AssetManager.instance
  }
  
  async loadAllAssets(): Promise<void> {
    console.log('🔄 AssetManager.loadAllAssets() - Stub implementation')
    // Minimal delay to simulate loading
    await new Promise(resolve => setTimeout(resolve, 100))
  }
}
