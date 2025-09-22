#!/bin/bash

# 龙猎游戏测试运行脚本
# 提供各种测试运行选项

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 函数定义
print_header() {
    echo -e "${CYAN}================================${NC}"
    echo -e "${CYAN}    龙猎游戏测试套件${NC}"
    echo -e "${CYAN}================================${NC}"
    echo ""
}

print_section() {
    echo -e "${BLUE}--- $1 ---${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${PURPLE}ℹ $1${NC}"
}

# 检查依赖
check_dependencies() {
    print_section "检查依赖"
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js 未安装"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm 未安装"
        exit 1
    fi
    
    if [ ! -f "package.json" ]; then
        print_error "package.json 不存在"
        exit 1
    fi
    
    if [ ! -d "node_modules" ]; then
        print_warning "node_modules 不存在，正在安装依赖..."
        npm install
    fi
    
    print_success "依赖检查完成"
    echo ""
}

# 运行单元测试
run_unit_tests() {
    print_section "运行单元测试"
    
    if npm run test:unit; then
        print_success "单元测试通过"
    else
        print_error "单元测试失败"
        return 1
    fi
    
    echo ""
}

# 运行集成测试
run_integration_tests() {
    print_section "运行集成测试"
    
    if npm run test:integration; then
        print_success "集成测试通过"
    else
        print_error "集成测试失败"
        return 1
    fi
    
    echo ""
}

# 运行所有测试
run_all_tests() {
    print_section "运行所有测试"
    
    if npm test; then
        print_success "所有测试通过"
    else
        print_error "测试失败"
        return 1
    fi
    
    echo ""
}

# 生成覆盖率报告
generate_coverage() {
    print_section "生成覆盖率报告"
    
    if npm run test:coverage; then
        print_success "覆盖率报告生成完成"
        print_info "报告位置: coverage/lcov-report/index.html"
    else
        print_error "覆盖率报告生成失败"
        return 1
    fi
    
    echo ""
}

# 监听模式
run_watch_mode() {
    print_section "启动监听模式"
    print_info "文件变化时自动运行测试"
    print_info "按 Ctrl+C 退出"
    
    npm run test:watch
}

# 性能测试
run_performance_tests() {
    print_section "运行性能测试"
    
    if npx jest --testPathPattern=performance --verbose; then
        print_success "性能测试完成"
    else
        print_error "性能测试失败"
        return 1
    fi
    
    echo ""
}

# 清理测试缓存
clean_cache() {
    print_section "清理测试缓存"
    
    if [ -d ".jest-cache" ]; then
        rm -rf .jest-cache
        print_success "Jest缓存已清理"
    fi
    
    if [ -d "coverage" ]; then
        rm -rf coverage
        print_success "覆盖率报告已清理"
    fi
    
    echo ""
}

# 验证测试环境
validate_environment() {
    print_section "验证测试环境"
    
    # 检查测试文件
    if [ ! -d "tests" ]; then
        print_error "tests目录不存在"
        return 1
    fi
    
    if [ ! -f "tests/setup.js" ]; then
        print_error "测试设置文件不存在"
        return 1
    fi
    
    # 检查源文件
    if [ ! -d "src" ]; then
        print_error "src目录不存在"
        return 1
    fi
    
    if [ ! -f "src/game.js" ]; then
        print_error "游戏源文件不存在"
        return 1
    fi
    
    # 检查配置文件
    if [ ! -f "jest.config.js" ]; then
        print_error "Jest配置文件不存在"
        return 1
    fi
    
    print_success "测试环境验证通过"
    echo ""
}

# 显示帮助
show_help() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help          显示此帮助信息"
    echo "  -a, --all           运行所有测试"
    echo "  -u, --unit          仅运行单元测试"
    echo "  -i, --integration   仅运行集成测试"
    echo "  -p, --performance   仅运行性能测试"
    echo "  -c, --coverage      生成覆盖率报告"
    echo "  -w, --watch         监听模式"
    echo "  -C, --clean         清理缓存"
    echo "  -v, --validate      验证测试环境"
    echo ""
    echo "示例:"
    echo "  $0 --all           # 运行所有测试"
    echo "  $0 --unit          # 仅运行单元测试"
    echo "  $0 --coverage      # 生成覆盖率报告"
    echo "  $0 --watch         # 监听模式"
    echo ""
}

# 主函数
main() {
    print_header
    
    # 默认行为
    if [ $# -eq 0 ]; then
        check_dependencies
        validate_environment
        run_all_tests
        return $?
    fi
    
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -a|--all)
                check_dependencies
                validate_environment
                run_all_tests
                exit $?
                ;;
            -u|--unit)
                check_dependencies
                validate_environment
                run_unit_tests
                exit $?
                ;;
            -i|--integration)
                check_dependencies
                validate_environment
                run_integration_tests
                exit $?
                ;;
            -p|--performance)
                check_dependencies
                validate_environment
                run_performance_tests
                exit $?
                ;;
            -c|--coverage)
                check_dependencies
                validate_environment
                generate_coverage
                exit $?
                ;;
            -w|--watch)
                check_dependencies
                validate_environment
                run_watch_mode
                exit $?
                ;;
            -C|--clean)
                clean_cache
                exit $?
                ;;
            -v|--validate)
                validate_environment
                exit $?
                ;;
            *)
                print_error "未知选项: $1"
                show_help
                exit 1
                ;;
        esac
        shift
    done
}

# 运行主函数
main "$@"
