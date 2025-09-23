#!/bin/bash

echo "🔐 GitHub认证配置助手"
echo "======================="
echo ""

echo "📋 请按照以下步骤操作："
echo ""
echo "1️⃣ 首先，获取你的Personal Access Token："
echo "   访问: https://github.com/settings/tokens"
echo "   点击 'Generate new token (classic)'"
echo "   勾选 'repo' 权限"
echo "   复制生成的token"
echo ""

read -p "2️⃣ 请输入你的GitHub邮箱: " email
read -p "3️⃣ 请粘贴你的Personal Access Token: " token

echo ""
echo "🔧 配置Git..."

# 配置用户信息
git config --global user.name "LITLAY2004"
git config --global user.email "$email"

# 配置远程仓库
git remote set-url origin "https://LITLAY2004:${token}@github.com/LITLAY2004/SHOOT-DRAGON-MADEBY-STONE.git"

echo "✅ 配置完成！"
echo ""
echo "🚀 开始推送..."

# 推送到GitHub
git push origin main

if [ $? -eq 0 ]; then
    echo "🎉 成功！你的游戏已经上传到GitHub！"
    echo "🌐 访问链接: https://github.com/LITLAY2004/SHOOT-DRAGON-MADEBY-STONE"
    echo ""
    echo "🎮 启用GitHub Pages："
    echo "1. 访问仓库设置: https://github.com/LITLAY2004/SHOOT-DRAGON-MADEBY-STONE/settings/pages"
    echo "2. 选择 'Deploy from a branch'"
    echo "3. 选择 'main' 分支"
    echo "4. 点击 Save"
    echo "5. 几分钟后访问: https://LITLAY2004.github.io/SHOOT-DRAGON-MADEBY-STONE/"
else
    echo "❌ 推送失败，请检查token是否正确"
fi
