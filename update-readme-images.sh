#!/bin/bash

# 🎮 CYBER TOWER DEFENSE - README图片更新脚本
# 自动更新README中的图片链接指向实际的截图文件

echo "🔗 更新README中的游戏截图链接..."

# 检查screenshots目录是否存在
if [ ! -d "screenshots" ]; then
    echo "❌ screenshots目录不存在，请先运行 ./save-screenshots.sh"
    exit 1
fi

# 备份原始README
cp README.md README.md.backup
echo "📁 已创建README备份: README.md.backup"

# 更新README中的图片链接
echo "🔄 正在更新图片链接..."

# 使用sed替换图片链接
sed -i 's|!\[游戏系统状态监控\](screenshots/system_status_placeholder\.png)|![游戏系统状态监控](screenshots/system_status.png)|g' README.md
sed -i 's|!\[永久升级商店\](screenshots/upgrade_shop_placeholder\.png)|![永久升级商店](screenshots/upgrade_shop.png)|g' README.md
sed -i 's|!\[游戏结束统计\](screenshots/game_over_placeholder\.png)|![游戏结束统计](screenshots/game_over.png)|g' README.md
sed -i 's|!\[游戏主菜单\](screenshots/main_menu_placeholder\.png)|![游戏主菜单](screenshots/main_menu.png)|g' README.md
sed -i 's|!\[实时游戏战斗\](screenshots/gameplay_placeholder\.png)|![实时游戏战斗](screenshots/gameplay.png)|g' README.md
sed -i 's|!\[游戏模式选择\](screenshots/game_modes_placeholder\.png)|![游戏模式选择](screenshots/game_modes.png)|g' README.md

echo ""
echo "📊 检查截图文件状态:"

# 检查每个预期的截图文件
declare -A required_screenshots=(
    ["system_status.png"]="🛠️ 游戏系统状态监控"
    ["upgrade_shop.png"]="💎 永久升级商店"
    ["game_over.png"]="📊 游戏结束统计"
    ["main_menu.png"]="🏠 游戏主菜单"
    ["gameplay.png"]="⚔️ 实时游戏战斗"
    ["game_modes.png"]="🎯 游戏模式选择"
)

found_count=0
total_count=${#required_screenshots[@]}

for file in "${!required_screenshots[@]}"; do
    description="${required_screenshots[$file]}"
    if [ -f "screenshots/$file" ]; then
        size=$(du -h "screenshots/$file" | cut -f1)
        echo "✅ $description - screenshots/$file ($size)"
        ((found_count++))
    else
        echo "❌ $description - screenshots/$file (缺失)"
    fi
done

echo ""
echo "📈 截图完成度: $found_count/$total_count"

if [ $found_count -eq $total_count ]; then
    echo "🎉 所有截图都已就位！README已更新完成。"
    echo ""
    echo "🚀 下一步："
    echo "1. git add screenshots/ README.md"
    echo "2. git commit -m \"📸 Add game screenshots\""
    echo "3. git push"
    echo ""
    echo "🌐 推送后，您的GitHub仓库将显示完整的游戏截图！"
else
    missing=$((total_count - found_count))
    echo "⚠️  还有 $missing 个截图缺失。请参考 ./save-screenshots.sh 的说明。"
    echo ""
    echo "💡 您可以："
    echo "1. 继续保存剩余截图"
    echo "2. 重新运行此脚本更新README"
    echo "3. 或者部分提交已有的截图"
fi

echo ""
echo "📝 README更新日志:"
echo "- 已移除占位符图片链接"
echo "- 已添加实际截图文件链接"
echo "- 备份文件: README.md.backup"
