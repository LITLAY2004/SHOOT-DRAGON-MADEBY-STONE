#!/bin/bash

echo "🔄 强制推送到GitHub..."

# 检查网络连接
echo "📡 检查网络连接..."
ping -c 1 github.com

# 检查远程仓库状态
echo "🔍 检查远程仓库配置..."
git remote -v

# 获取当前分支和提交信息
echo "📊 当前Git状态..."
git status
git log --oneline -5

# 尝试推送
echo "🚀 开始推送..."
git push -v origin main

# 如果失败，尝试强制推送
if [ $? -ne 0 ]; then
    echo "⚠️  常规推送失败，尝试强制推送..."
    git push --force-with-lease origin main
fi

# 如果还是失败，显示详细错误
if [ $? -ne 0 ]; then
    echo "❌ 推送失败！可能的原因："
    echo "1. 网络连接问题"
    echo "2. GitHub访问权限问题"  
    echo "3. 仓库不存在或私有"
    echo ""
    echo "🔧 建议的解决方案："
    echo "1. 检查GitHub仓库是否存在: https://github.com/LITLAY2004/SHOOT-DRAGON-MADEBY-STONE"
    echo "2. 确保仓库是公开的"
    echo "3. 检查网络连接"
    echo "4. 尝试重新创建仓库"
else
    echo "✅ 推送成功！"
    echo "🌐 请访问: https://github.com/LITLAY2004/SHOOT-DRAGON-MADEBY-STONE"
fi
