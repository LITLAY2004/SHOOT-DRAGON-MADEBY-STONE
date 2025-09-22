#!/bin/bash

# 🚀 Tower Defense Game - GitHub部署脚本
# 自动化部署塔防游戏到GitHub仓库

set -e

echo "🎮 准备部署 Tower Defense Game 到 GitHub..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 函数：打印带颜色的消息
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# 检查Git是否已初始化
if [ ! -d ".git" ]; then
    print_error "Git仓库未初始化！请先运行 git init"
    exit 1
fi

print_status "检查Git仓库状态..."

# 检查是否有未提交的更改
if ! git diff-index --quiet HEAD --; then
    print_warning "检测到未提交的更改"
    echo "未提交的文件："
    git status --porcelain
    echo ""
    read -p "是否要提交这些更改？(y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        echo "请输入提交信息: "
        read commit_message
        git commit -m "$commit_message"
        print_status "已提交所有更改"
    else
        print_warning "跳过提交，继续部署当前状态"
    fi
fi

# 检查是否已配置远程仓库
if ! git remote get-url origin >/dev/null 2>&1; then
    echo ""
    print_info "需要配置GitHub远程仓库"
    echo "请提供GitHub仓库信息："
    echo ""
    echo "选择一个选项："
    echo "1) 创建新的GitHub仓库"
    echo "2) 连接到现有GitHub仓库"
    echo ""
    read -p "请选择 (1 或 2): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[1]$ ]]; then
        echo ""
        print_info "请在GitHub上创建新仓库："
        echo "1. 访问 https://github.com/new"
        echo "2. 仓库名建议：tower-defense-game"
        echo "3. 描述：🚀 CYBER TOWER DEFENSE - A modern HTML5 tower defense game"
        echo "4. 设为公开仓库（推荐）"
        echo "5. 不要初始化README、.gitignore或LICENSE（我们已经有了）"
        echo ""
        read -p "GitHub用户名: " github_username
        read -p "仓库名: " repo_name
        
        remote_url="https://github.com/$github_username/$repo_name.git"
        git remote add origin "$remote_url"
        print_status "已添加远程仓库: $remote_url"
        
    elif [[ $REPLY =~ ^[2]$ ]]; then
        echo ""
        read -p "请输入GitHub仓库URL: " remote_url
        git remote add origin "$remote_url"
        print_status "已添加远程仓库: $remote_url"
    else
        print_error "无效选择，退出部署"
        exit 1
    fi
else
    remote_url=$(git remote get-url origin)
    print_status "远程仓库已配置: $remote_url"
fi

# 检查主分支名称
current_branch=$(git branch --show-current)
if [ "$current_branch" = "master" ]; then
    print_info "当前在master分支，建议重命名为main分支"
    read -p "是否重命名为main分支？(y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git branch -m master main
        print_status "已重命名分支为main"
        current_branch="main"
    fi
fi

echo ""
print_info "准备推送到GitHub..."
echo "仓库: $remote_url"
echo "分支: $current_branch"
echo ""

# 推送代码
print_status "正在推送代码到GitHub..."

if git push -u origin "$current_branch" 2>/dev/null; then
    print_status "成功推送到GitHub！"
else
    print_warning "首次推送可能需要认证"
    echo ""
    echo "如果遇到认证问题，请尝试以下方案："
    echo ""
    echo "方案1 - 使用Personal Access Token："
    echo "1. 访问 https://github.com/settings/tokens"
    echo "2. 创建新的Personal Access Token"
    echo "3. 权限选择：repo, workflow"
    echo "4. 复制token并在提示时使用"
    echo ""
    echo "方案2 - 使用SSH（推荐）："
    echo "1. 生成SSH密钥：ssh-keygen -t ed25519 -C 'your_email@example.com'"
    echo "2. 添加到SSH agent：ssh-add ~/.ssh/id_ed25519"
    echo "3. 复制公钥到GitHub：cat ~/.ssh/id_ed25519.pub"
    echo "4. 更新远程URL：git remote set-url origin git@github.com:用户名/仓库名.git"
    echo ""
    
    read -p "是否重试推送？(y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git push -u origin "$current_branch"
    fi
fi

echo ""
print_status "部署完成！"
echo ""
echo "🎮 游戏链接："
echo "📦 GitHub仓库: $remote_url"
echo "🌐 在线演示: ${remote_url%%.git}/blob/$current_branch/README.md"
echo ""
echo "📋 下一步建议："
echo "1. 在GitHub仓库设置中启用GitHub Pages"
echo "2. 添加游戏截图到screenshots目录"
echo "3. 邀请其他开发者参与贡献"
echo "4. 创建Issues和Project看板管理开发进度"
echo ""
print_status "享受你的开源塔防游戏项目！🎮"
