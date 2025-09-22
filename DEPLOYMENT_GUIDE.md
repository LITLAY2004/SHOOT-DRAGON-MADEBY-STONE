# 🚀 GitHub部署指南

## 快速部署到GitHub

### 方法一：使用自动化脚本（推荐）

```bash
# 运行自动化部署脚本
./deploy-to-github.sh
```

脚本将会：
- ✅ 检查Git状态和提交更改
- ✅ 配置GitHub远程仓库
- ✅ 推送代码到GitHub
- ✅ 提供部署后的链接和说明

### 方法二：手动部署

#### 1. 创建GitHub仓库

1. 访问 [GitHub](https://github.com/new)
2. 创建新仓库：
   - **仓库名**: `tower-defense-game`
   - **描述**: `🚀 CYBER TOWER DEFENSE - A modern HTML5 tower defense game`
   - **类型**: 公开（推荐）
   - **不要**初始化README、.gitignore或LICENSE（我们已经有了）

#### 2. 连接本地仓库到GitHub

```bash
# 添加GitHub远程仓库（替换你的用户名）
git remote add origin https://github.com/YOUR_USERNAME/tower-defense-game.git

# 推送代码到GitHub
git push -u origin master
```

#### 3. 启用GitHub Pages

1. 进入仓库设置页面：`Settings` → `Pages`
2. 源选择：`Deploy from a branch`
3. 分支选择：`master` 或 `main`
4. 文件夹选择：`/ (root)`
5. 保存设置

## 🌐 部署后的访问链接

部署成功后，你的游戏将在以下链接可用：

### 主要游戏链接
- 🎮 **主游戏**: `https://YOUR_USERNAME.github.io/tower-defense-game/game.html`
- 🏠 **项目主页**: `https://YOUR_USERNAME.github.io/tower-defense-game/docs/index.html`
- 📊 **游戏状态**: `https://YOUR_USERNAME.github.io/tower-defense-game/game-status.html`

### 其他页面
- 📋 **游戏指南**: `https://YOUR_USERNAME.github.io/tower-defense-game/game-guide.html`
- 🎯 **演示页面**: `https://YOUR_USERNAME.github.io/tower-defense-game/demo.html`
- 🛠️ **系统监控**: `https://YOUR_USERNAME.github.io/tower-defense-game/test-page.html`

## 🔧 高级配置

### 自定义域名

1. 在仓库根目录创建 `CNAME` 文件
2. 文件内容为你的域名，例如：`game.yourdomain.com`
3. 在域名提供商设置CNAME记录指向：`YOUR_USERNAME.github.io`

### 自动化部署

项目已包含GitHub Actions工作流（`.github/workflows/deploy.yml`），将自动：
- 🧪 运行测试
- 🏗️ 构建项目
- 📊 生成统计信息
- 🌐 部署到GitHub Pages

## 📱 分享你的游戏

### 社交媒体分享模板

```
🚀 我刚刚在GitHub上开源了一个塔防游戏！

🎮 特色功能：
✨ 多种游戏模式（闯关/无限/生存）
⚡ 6种强大技能系统
💎 永久升级系统
🎵 完整音效和特效

🌐 立即试玩：https://YOUR_USERNAME.github.io/tower-defense-game/

📦 源码：https://github.com/YOUR_USERNAME/tower-defense-game

#HTML5游戏 #开源 #塔防游戏 #JavaScript
```

### README徽章

在你的GitHub README中添加这些徽章：

```markdown
[![GitHub Stars](https://img.shields.io/github/stars/YOUR_USERNAME/tower-defense-game?style=social)](https://github.com/YOUR_USERNAME/tower-defense-game)
[![Play Game](https://img.shields.io/badge/🎮_Play_Game-success?style=for-the-badge)](https://YOUR_USERNAME.github.io/tower-defense-game/game.html)
[![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-Live-green?style=flat&logo=github)](https://YOUR_USERNAME.github.io/tower-defense-game/)
```

## 🤝 邀请协作

### 添加贡献者

1. 进入仓库 `Settings` → `Manage access`
2. 点击 `Invite a collaborator`
3. 输入用户名或邮箱
4. 选择权限级别

### 创建Issues模板

在 `.github/ISSUE_TEMPLATE/` 目录创建：

**bug_report.md**:
```markdown
---
name: 🐛 Bug报告
about: 报告游戏中的问题
---

**描述问题**
简要描述遇到的问题

**重现步骤**
1. 打开游戏
2. 执行某个操作
3. 观察到错误

**预期行为**
描述期望发生什么

**环境信息**
- 浏览器: [Chrome/Firefox/Safari]
- 版本: [版本号]
- 操作系统: [Windows/Mac/Linux]
```

## 📊 监控和分析

### GitHub Pages分析

- 访问 `Insights` → `Traffic` 查看访问统计
- 查看 `Popular content` 了解用户最喜欢的页面
- 监控 `Git clones` 和 `Visits` 数据

### 游戏内统计

游戏包含内置的统计系统：
- 📈 玩家行为分析
- 🎯 关卡完成率
- ⚡ 技能使用频率
- 💎 升级偏好统计

## 🛠️ 故障排除

### 常见问题

**Q: GitHub Pages没有更新？**
A: 等待几分钟，GitHub Pages更新可能需要时间。检查Actions是否运行成功。

**Q: 游戏无法加载？**
A: 检查浏览器控制台错误，确保所有文件路径正确。

**Q: 音效不工作？**
A: 现代浏览器需要用户交互才能播放音频，确保点击了"启用音效"按钮。

**Q: 移动设备上游戏体验不佳？**
A: 游戏主要为桌面设计，移动设备支持正在开发中。

### 获取帮助

- 📚 查看项目文档
- 🐛 在GitHub Issues中报告问题
- 💬 参与GitHub Discussions讨论
- 📧 联系项目维护者

---

**🎉 恭喜！你的塔防游戏现在已经在GitHub上线了！**

记得给项目加个⭐Star，并邀请朋友来试玩你的游戏！
