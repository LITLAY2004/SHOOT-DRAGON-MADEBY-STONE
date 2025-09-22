#!/bin/bash

# 🎮 CYBER TOWER DEFENSE - 截图保存脚本
# 使用此脚本来轻松保存游戏截图到正确位置

echo "🎮 CYBER TOWER DEFENSE - 截图保存助手"
echo "=============================================="

# 创建screenshots目录（如果不存在）
mkdir -p screenshots

echo ""
echo "📸 请将以下截图保存到对应位置："
echo ""

# 截图文件列表和对应的游戏界面
declare -A screenshots=(
    ["system_status.png"]="🛠️ 游戏系统状态监控界面"
    ["upgrade_shop.png"]="💎 永久升级商店界面"
    ["game_over.png"]="📊 游戏结束统计界面"
    ["main_menu.png"]="🏠 游戏主菜单界面"
    ["gameplay.png"]="⚔️ 实时游戏战斗界面"
    ["game_modes.png"]="🎯 游戏模式选择界面"
    ["test_page.png"]="🧪 游戏测试页面界面"
)

counter=1
for file in "${!screenshots[@]}"; do
    description="${screenshots[$file]}"
    echo "$counter. $description"
    echo "   📁 保存位置: screenshots/$file"
    echo ""
    ((counter++))
done

echo "💡 使用方法："
echo "1. 右键点击聊天中的截图 → '另存为'"
echo "2. 将文件保存到 screenshots/ 目录"
echo "3. 使用上面列出的确切文件名"
echo "4. 运行 ./update-readme-images.sh 更新README"
echo ""

echo "🚀 自动化方法："
echo "如果您有截图的URL或base64数据，可以使用："
echo "curl -o screenshots/filename.png [图片URL]"
echo ""

# 检查现有截图
echo "📋 当前screenshots目录状态："
if [ -d "screenshots" ] && [ "$(ls -A screenshots)" ]; then
    ls -la screenshots/
    echo ""
    echo "✅ 发现 $(ls screenshots/*.png 2>/dev/null | wc -l) 个PNG截图文件"
else
    echo "📂 screenshots目录为空或不存在"
fi

echo ""
echo "🔗 完成后，您的README将显示："
echo "- GitHub仓库中的实际游戏截图"
echo "- 专业的项目展示效果"
echo "- 提升项目的可信度和吸引力"
