#!/bin/bash
# Tower Defense Game - 测试执行脚本
# 使用方法：./run-tests.sh [选项]

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Tower Defense Game 测试套件 ===${NC}\n"

# 显示可用的测试文件
echo -e "${YELLOW}📋 可用的测试文件：${NC}"
echo "  1. ComprehensiveIntegrationTests.test.js (综合集成测试 - 67个用例)"
echo "  2. LogicVulnerabilityTests.test.js      (逻辑漏洞测试 - 47个用例)"
echo "  3. Epic4UIStructure.test.js              (UI结构测试)"
echo "  4. Epic4UIIntegration.test.js            (UI集成测试)"
echo "  5. GameStartupFix.test.js                (启动流程测试)"
echo ""

# 解析命令行参数
case "$1" in
    1|integration)
        echo -e "${GREEN}🚀 执行综合集成测试...${NC}\n"
        npm test -- tests/ComprehensiveIntegrationTests.test.js --silent
        ;;
    2|vulnerability)
        echo -e "${GREEN}🚀 执行逻辑漏洞测试...${NC}\n"
        npm test -- tests/LogicVulnerabilityTests.test.js --silent
        ;;
    3|ui-structure)
        echo -e "${GREEN}🚀 执行UI结构测试...${NC}\n"
        npm test -- tests/Epic4UIStructure.test.js --silent
        ;;
    4|ui-integration)
        echo -e "${GREEN}🚀 执行UI集成测试...${NC}\n"
        npm test -- tests/Epic4UIIntegration.test.js --silent
        ;;
    5|startup)
        echo -e "${GREEN}🚀 执行启动流程测试...${NC}\n"
        npm test -- tests/GameStartupFix.test.js --silent
        ;;
    all)
        echo -e "${GREEN}🚀 执行所有测试...${NC}\n"
        npm test -- --silent
        ;;
    coverage)
        echo -e "${GREEN}🚀 执行测试并生成覆盖率报告...${NC}\n"
        npm test -- --coverage --silent
        ;;
    quick)
        echo -e "${GREEN}🚀 执行快速测试（仅新增测试）...${NC}\n"
        npm test -- tests/ComprehensiveIntegrationTests.test.js tests/LogicVulnerabilityTests.test.js --silent
        ;;
    watch)
        echo -e "${GREEN}🚀 启动测试监控模式...${NC}\n"
        npm test -- --watch
        ;;
    help|--help|-h|"")
        echo -e "${YELLOW}使用方法：${NC}"
        echo "  ./run-tests.sh [选项]"
        echo ""
        echo -e "${YELLOW}选项：${NC}"
        echo "  1 或 integration    - 执行综合集成测试"
        echo "  2 或 vulnerability  - 执行逻辑漏洞测试"
        echo "  3 或 ui-structure   - 执行UI结构测试"
        echo "  4 或 ui-integration - 执行UI集成测试"
        echo "  5 或 startup        - 执行启动流程测试"
        echo "  all                 - 执行所有测试"
        echo "  quick               - 快速测试（仅新增测试）"
        echo "  coverage            - 生成测试覆盖率报告"
        echo "  watch               - 监控模式（文件变化时自动测试）"
        echo "  help                - 显示此帮助信息"
        echo ""
        echo -e "${YELLOW}示例：${NC}"
        echo "  ./run-tests.sh 1              # 执行综合集成测试"
        echo "  ./run-tests.sh quick          # 快速测试"
        echo "  ./run-tests.sh coverage       # 生成覆盖率报告"
        echo ""
        ;;
    *)
        echo -e "${RED}❌ 未知选项: $1${NC}"
        echo "使用 './run-tests.sh help' 查看帮助"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}=== 测试完成 ===${NC}"

