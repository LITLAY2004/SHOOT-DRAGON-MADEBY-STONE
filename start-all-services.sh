#!/bin/bash

# Cyber Tower Defense - 完整服务启动脚本
# 作者: AI Assistant
# 版本: 1.0.0

echo "🚀 启动 Cyber Tower Defense 完整服务..."
echo "================================================"

# 检查当前目录
if [ ! -f "game.html" ]; then
    echo "❌ 错误: 请在游戏根目录运行此脚本"
    exit 1
fi

# 检查Python是否可用
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误: Python3 未安装"
    exit 1
fi

# 显示服务信息
echo "📋 服务配置信息:"
echo "   🌐 HTTP服务器: localhost:8000"
echo "   📁 游戏目录: $(pwd)"
echo "   🎮 主游戏: game.html"
echo "   ⚡ 快速试玩: play-game.html"
echo "   🧪 测试中心: complete-test.html"
echo "   🚀 启动中心: launch-game.html"
echo ""

# 检查必要文件
echo "🔍 检查关键文件..."
required_files=(
    "game.html"
    "play-game.html"
    "complete-test.html"
    "launch-game.html"
    "src/game.js"
    "styles/cyber-theme.css"
    "tests/TestRunner.html"
)

missing_files=()
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✅ $file"
    else
        echo "   ❌ $file (缺失)"
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -gt 0 ]; then
    echo ""
    echo "⚠️  警告: 发现 ${#missing_files[@]} 个缺失文件"
    echo "继续启动可能会遇到问题..."
    echo ""
fi

# 检查端口占用
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  端口 8000 已被占用，正在尝试终止..."
    pkill -f "python.*http.server.*8000" 2>/dev/null || true
    sleep 2
fi

# 启动HTTP服务器
echo "🌐 启动HTTP服务器 (端口: 8000)..."
nohup python3 -m http.server 8000 > server.log 2>&1 &
SERVER_PID=$!

# 等待服务器启动
echo "⏳ 等待服务器启动..."
sleep 3

# 检查服务器是否启动成功
if kill -0 $SERVER_PID 2>/dev/null; then
    echo "✅ HTTP服务器启动成功 (PID: $SERVER_PID)"
else
    echo "❌ HTTP服务器启动失败"
    exit 1
fi

# 测试服务器连接
echo "🔗 测试服务器连接..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/ | grep -q "200"; then
    echo "✅ 服务器连接测试通过"
else
    echo "⚠️  服务器连接测试失败，但继续运行..."
fi

echo ""
echo "🎉 所有服务启动完成！"
echo "================================================"
echo ""
echo "🎮 游戏访问地址:"
echo "   🚀 启动中心:    http://localhost:8000/launch-game.html"
echo "   🎯 完整游戏:    http://localhost:8000/game.html"
echo "   ⚡ 快速试玩:    http://localhost:8000/play-game.html"
echo "   🧪 测试中心:    http://localhost:8000/complete-test.html"
echo "   🏠 项目主页:    http://localhost:8000/index.html"
echo "   📖 游戏指南:    http://localhost:8000/game-guide.html"
echo ""
echo "🔧 开发工具:"
echo "   🧪 单元测试:    http://localhost:8000/tests/TestRunner.html"
echo "   📊 性能测试:    http://localhost:8000/test-new-features.html"
echo "   📚 文档目录:    http://localhost:8000/docs/"
echo ""
echo "💡 使用提示:"
echo "   • 推荐首先访问启动中心选择游戏模式"
echo "   • 使用 Ctrl+C 停止所有服务"
echo "   • 服务器日志保存在 server.log 文件中"
echo "   • 支持手机和平板访问"
echo ""

# 显示实时日志选项
read -p "🔍 是否显示实时服务器日志? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📋 实时服务器日志 (按 Ctrl+C 停止):"
    echo "----------------------------------------"
    tail -f server.log
else
    echo "🎮 服务器在后台运行中..."
    echo "📋 查看日志: tail -f server.log"
    echo "🛑 停止服务: pkill -f 'python.*http.server.*8000'"
    echo ""
    echo "🎉 享受游戏吧！"
fi

# 等待用户停止
trap 'echo -e "\n🛑 正在停止服务..."; kill $SERVER_PID 2>/dev/null; echo "✅ 服务已停止"; exit 0' INT

# 如果不显示日志，保持脚本运行
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    while kill -0 $SERVER_PID 2>/dev/null; do
        sleep 5
    done
fi
