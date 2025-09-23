# 🔐 GitHub认证设置指南

## 问题诊断
❌ **认证失败**: GitHub不允许匿名推送，需要配置认证信息。

## 📋 解决方案步骤

### 方法1: 使用Personal Access Token (推荐)

#### 步骤1: 创建Personal Access Token
1. 打开 [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. 点击 **Generate new token (classic)**
3. 设置以下选项：
   - **Note**: `Tower Defense Game Deployment`
   - **Expiration**: `90 days` (或更长)
   - **Select scopes**: 勾选 `repo` (Full control of private repositories)
4. 点击 **Generate token**
5. **重要**: 复制生成的token（只显示一次！）

#### 步骤2: 配置Git认证
在终端中运行以下命令（用你的实际信息替换）：

```bash
# 配置用户信息
git config --global user.name "LITLAY2004"
git config --global user.email "你的邮箱@example.com"

# 重新配置远程仓库使用token
git remote set-url origin https://LITLAY2004:你的TOKEN@github.com/LITLAY2004/SHOOT-DRAGON-MADEBY-STONE.git
```

#### 步骤3: 推送代码
```bash
git push origin main
```

### 方法2: 手动上传文件 (快速解决)

如果token配置有困难，可以手动上传：

1. 打开 [你的GitHub仓库](https://github.com/LITLAY2004/SHOOT-DRAGON-MADEBY-STONE)
2. 点击 **uploading an existing file** 或 **Add file > Upload files**
3. 拖拽所有文件到页面中
4. 填写提交信息：`Upload complete tower defense game`
5. 点击 **Commit changes**

### 方法3: 重新创建仓库

1. 删除现有仓库
2. 重新创建时勾选 **Add a README file**
3. 克隆到本地：
   ```bash
   git clone https://github.com/LITLAY2004/SHOOT-DRAGON-MADEBY-STONE.git
   ```
4. 复制所有文件到克隆的目录
5. 提交并推送

## 🚀 推荐使用方法1，最快最简单！

### 具体执行命令模板：
```bash
# 1. 替换为你的邮箱
git config --global user.email "your-email@example.com"

# 2. 替换为你的Personal Access Token
git remote set-url origin https://LITLAY2004:ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@github.com/LITLAY2004/SHOOT-DRAGON-MADEBY-STONE.git

# 3. 推送
git push origin main
```

## ⚠️ 安全提示
- 不要在公开场所暴露你的Personal Access Token
- Token有过期时间，过期后需要重新生成
- 使用token后记得在本地删除包含token的命令历史

## 📞 需要帮助？
如果还有问题，请告诉我你选择了哪种方法，我可以提供具体的命令！
