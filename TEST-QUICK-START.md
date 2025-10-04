# 🚀 测试快速开始

## 最简单的执行方式

### 1️⃣ 使用测试脚本（推荐）

```bash
# 显示帮助
./run-tests.sh help

# 快速测试（仅新增的 114 个测试用例）
./run-tests.sh quick

# 执行所有测试
./run-tests.sh all
```

---

### 2️⃣ 使用 npm 命令

```bash
# 执行综合集成测试（67个用例）
npm test -- tests/ComprehensiveIntegrationTests.test.js

# 执行逻辑漏洞测试（47个用例）
npm test -- tests/LogicVulnerabilityTests.test.js

# 执行所有测试
npm test

# 生成覆盖率报告
npm test -- --coverage
```

---

## 📊 测试文件说明

| 序号 | 测试文件 | 用例数 | 说明 |
|-----|---------|-------|------|
| 1 | `ComprehensiveIntegrationTests.test.js` | 67 | **新增** - 游戏核心功能测试 |
| 2 | `LogicVulnerabilityTests.test.js` | 47 | **新增** - 边界条件和漏洞测试 |
| 3 | `Epic4UIStructure.test.js` | ~50 | 现有 - UI 结构测试 |
| 4 | `Epic4UIIntegration.test.js` | ~40 | 现有 - UI 集成测试 |
| 5 | `GameStartupFix.test.js` | ~30 | 现有 - 启动流程测试 |

---

## ✨ 推荐测试流程

### 第一次运行
```bash
# 1. 快速测试（仅新增测试，约 2-3 分钟）
./run-tests.sh quick

# 2. 如果通过，执行完整测试
./run-tests.sh all
```

### 开发时
```bash
# 监控模式（代码改动时自动测试）
./run-tests.sh watch
```

### 提交代码前
```bash
# 完整测试 + 覆盖率报告
./run-tests.sh coverage
```

---

## 📖 详细文档

查看完整指南：`docs/qa/HOW-TO-RUN-TESTS.md`

---

**快速问题？**

- ❓ 测试失败怎么办？ → 查看终端输出的错误信息
- ❓ 如何只测试某个功能？ → `npm test -- -t "元素系统"`
- ❓ 测试太慢？ → 使用 `./run-tests.sh quick` 仅测试核心功能

