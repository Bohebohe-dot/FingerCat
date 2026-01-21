# FingerCat 部署到 GitHub 指南

## 🚀 快速部署步骤

### 步骤 1：初始化 Git 仓库

```bash
cd /Users/pantasia/Documents/AI/FingerCat
git init
```

### 步骤 2：创建 .gitignore

已自动创建 `.gitignore` 文件，忽略不必要的文件。

### 步骤 3：提交代码

```bash
git add .
git commit -m "Initial commit: FingerCat 手指计数游戏"
```

### 步骤 4：创建 GitHub 仓库

1. 访问 https://github.com/new
2. 仓库名称：`FingerCat`
3. 描述：`基于 AI 视觉识别和语音交互的儿童手指计数学习游戏`
4. 选择 Public（公开）
5. **不要**勾选 "Add a README file"（我们已经有了）
6. 点击 "Create repository"

### 步骤 5：关联远程仓库

复制 GitHub 提供的 URL，然后执行：

```bash
# 替换 <your-username> 为你的 GitHub 用户名
git remote add origin https://github.com/<your-username>/FingerCat.git
git branch -M main
git push -u origin main
```

---

## 🌐 GitHub Pages 部署（可选）

让游戏在线可访问：

### 步骤 1：启用 GitHub Pages

1. 进入你的仓库页面
2. 点击 "Settings" → "Pages"
3. Source 选择：`main` 分支
4. 文件夹选择：`/ (root)`
5. 点击 "Save"

### 步骤 2：等待部署

几分钟后，你的游戏将在以下地址访问：
```
https://<your-username>.github.io/FingerCat/
```

---

## ⚠️ 重要提醒

### 摄像头和麦克风权限

GitHub Pages 使用 HTTPS，所以摄像头和麦克风 API 可以正常工作。但用户首次访问需要授权。

### 浏览器兼容性

建议在 README 中说明：
- ✅ 推荐：Chrome、Safari（macOS）
- ⚠️ 部分支持：Firefox（语音识别可能不可用）

---

## 📝 后续维护

### 更新代码

```bash
git add .
git commit -m "更新描述"
git push
```

### 查看在线版本

访问你的 GitHub Pages 地址即可。

---

需要我帮你执行这些命令吗？
