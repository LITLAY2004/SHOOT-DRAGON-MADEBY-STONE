# Codex CLI 使用指南

## 安装确认
✅ OpenAI Codex CLI v0.41.0 已成功安装

## 基本使用

### 1. 首次使用 - 登录
```bash
codex login
```

### 2. 交互模式
在项目目录中直接运行：
```bash
codex
```
或者带初始提示：
```bash
codex "帮我优化这个塔防游戏的性能"
```

### 3. 非交互模式
```bash
codex exec "分析这个 JavaScript 文件的问题"
```

## 常用命令

### 安全模式使用
```bash
# 只读模式（最安全）
codex -s read-only "分析代码质量"

# 工作区写入模式（推荐）
codex -s workspace-write "重构这个函数"

# 全自动模式（便捷但需谨慎）
codex --full-auto "运行测试并修复发现的问题"
```

### 针对特定文件
```bash
# 分析特定文件
codex -i src/game.js "分析这个游戏逻辑"

# 处理多个文件
codex -i src/game.js -i src/config/BalanceConfig.js "比较这两个文件的设计模式"
```

### 模型选择
```bash
# 使用特定模型
codex -m o3 "复杂的代码重构任务"

# 使用本地开源模型（需要 Ollama）
codex --oss "简单的代码生成任务"
```

## 针对本项目的推荐用法

### 游戏开发任务
```bash
# 游戏逻辑分析
codex -s workspace-write "分析塔防游戏的平衡性并提供优化建议"

# 新功能开发
codex -s workspace-write "基于现有的 SkillSystem，添加一个新的技能"

# 代码优化
codex -s read-only "分析 src/game.js 的性能瓶颈"

# 测试相关
codex -s workspace-write "为新添加的功能编写 Jest 测试"
```

### 配置相关
```bash
# 分析项目配置
codex -i package.json -i tsconfig.json "优化项目构建配置"

# 平衡参数调整
codex -i src/config/BalanceConfig.js "分析游戏平衡性并提供调整建议"
```

## 安全建议

1. **首次使用推荐只读模式**：`-s read-only`
2. **逐步放宽权限**：熟悉后使用 `-s workspace-write`
3. **重要操作前备份**：使用 git commit 保存当前状态
4. **审查生成的代码**：始终检查 Codex 生成的代码再应用

## 配置文件
Codex CLI 的配置文件位置：`~/.codex/config.toml`

示例配置：
```toml
[model]
provider = "openai"
name = "gpt-4"

[sandbox]
default_mode = "workspace-write"

[approval]
policy = "untrusted"
```

## 高级功能

### MCP 服务器模式
```bash
codex mcp
```

### 恢复之前的会话
```bash
codex resume --last
```

### 应用生成的差异
```bash
codex apply
```

## 故障排除

### 常见问题
1. **认证错误**：运行 `codex login` 重新登录
2. **权限问题**：使用 `sudo` 或调整文件权限
3. **模型访问问题**：检查 API 密钥和网络连接

### 调试命令
```bash
codex debug
```

## 与项目集成

考虑在 package.json 中添加便捷脚本：
```json
{
  "scripts": {
    "codex": "codex",
    "codex-safe": "codex -s read-only",
    "codex-dev": "codex -s workspace-write",
    "codex-test": "codex -s workspace-write 'run tests and fix any issues'"
  }
}
```

## 最佳实践

1. **明确的指令**：提供清晰、具体的任务描述
2. **上下文信息**：提供相关文件和背景信息
3. **渐进式任务**：将复杂任务分解为小步骤
4. **代码审查**：始终审查生成的代码
5. **版本控制**：频繁提交，方便回滚

祝您使用 Codex CLI 愉快！🚀
