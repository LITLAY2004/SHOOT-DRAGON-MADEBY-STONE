#!/bin/bash

# 🎮 龙猎游戏启动脚本
echo "🐉 启动龙猎游戏服务器..."
echo "=========================="

# 检查端口是否被占用
PORT=8080
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  端口 $PORT 已被占用"
    echo "🔄 尝试使用其他端口..."
    PORT=8081
fi

# 启动服务器
echo "🚀 启动游戏服务器在端口 $PORT..."
echo "🌐 游戏地址: http://localhost:$PORT"
echo "📱 或访问: http://127.0.0.1:$PORT"
echo ""
echo "🎮 游戏操作提示:"
echo "   WASD - 移动"
echo "   鼠标 - 瞄准和射击"
echo "   P键 - 暂停/继续"
echo ""
echo "🛑 按 Ctrl+C 停止服务器"
echo "=========================="

# 启动Python HTTP服务器
python3 -m http.server $PORT
