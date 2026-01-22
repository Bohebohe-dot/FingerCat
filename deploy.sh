#!/bin/bash

# FingerCat GitHub 部署脚本

echo "🚀 开始部署 FingerCat 到 GitHub..."

# 检查是否已配置 remote
if git remote get-url origin > /dev/null 2>&1; then
    echo "✅ 已找到 remote 配置"
    echo "📤 推送代码到 GitHub..."
    git push -u origin main
else
    echo "❌ 尚未配置 GitHub 仓库地址"
    echo ""
    echo "请按以下步骤操作："
    echo "1. 访问 https://github.com/new 创建新仓库"
    echo "2. 仓库名称：FingerCat"
    echo "3. 复制仓库 URL（如：https://github.com/你的用户名/FingerCat.git）"
    echo "4. 运行以下命令："
    echo ""
    echo "   git remote add origin <你的仓库URL>"
    echo "   git push -u origin main"
    echo ""
fi

echo ""
echo "✨ 部署完成后，你可以："
echo "1. 在 GitHub 仓库设置中启用 GitHub Pages"
echo "2. 游戏将在 https://你的用户名.github.io/FingerCat/ 访问"
