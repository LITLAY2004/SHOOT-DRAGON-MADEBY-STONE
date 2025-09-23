#!/bin/bash

# 设置环境变量避免pager问题
export PAGER=cat
export GIT_PAGER=cat
export LESS="-F -X"

echo "🚀 开始推送塔防游戏到GitHub..."
echo "📍 当前工作目录: $(pwd)"

# 确保在正确的目录
cd /root/projects/tower-defense-game

# 检查Git状态
echo "📊 检查Git状态..."
git status --porcelain

# 移除可能存在的远程仓库配置
echo "🔧 重新配置远程仓库..."
git remote remove origin 2>/dev/null || echo "没有找到现有的origin远程仓库"

# 添加GitHub远程仓库
echo "🔗 添加GitHub远程仓库..."
git remote add origin https://github.com/LITLAY2004/Conditional-Shooting-and-SHOOTING-Dragon-GAME-s-Javascript-WAY.git

# 验证远程仓库配置
echo "✅ 验证远程仓库配置:"
git remote -v

# 推送到GitHub（强制推送以覆盖任何现有内容）
echo "📤 推送到GitHub main分支..."
git push -u origin main --force

echo "🎉 推送完成！"
echo "🌐 项目地址: https://github.com/LITLAY2004/Conditional-Shooting-and-SHOOTING-Dragon-GAME-s-Javascript-WAY"
echo "🎮 您的塔防游戏现在已经在GitHub上了！"