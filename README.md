# 🐾 FingerCat - 手指计数互动游戏

一款为 3 岁儿童设计的基于 AI 视觉识别的手指计数学习游戏。

## ✨ 核心特性

- 🎥 **实时手势识别**：基于 MediaPipe Hands 的高精度手部检测
- 🎤 **语音交互学习**：孩子说出数量，AI 验证答案
- 🎨 **可爱视觉设计**：专为儿童优化的色彩和动画
- 🔊 **多感官反馈**：语音播报 + 音效 + 视觉动画
- 👨‍👩‍👧 **家长控制面板**：难度调节、音效控制、灵敏度设置

## 🎮 游戏玩法

1. **选择图片**：从图片库选择喜欢的图片（如小猫咪）
2. **开始游戏**：点击「开始游戏」按钮
3. **伸出手指**：在摄像头前伸出任意数量的手指（1-10）
4. **语音回答**：点击「点击说话」按钮，说出看到的手指数量
5. **查看结果**：
   - ✅ **答对**：画布上会显示对应数量的图片 + 鼓励语音
   - ❌ **答错**：AI 会提示正确答案，鼓励再次尝试

## 🚀 快速启动

### 方式一：直接打开（推荐）

```bash
# 启动本地服务器
python3 -m http.server 8000

# 或使用 Node.js
npx http-server -p 8000
```

然后在浏览器访问：`http://localhost:8000`

### 方式二：Live Server（VS Code）

1. 安装 VS Code 插件 "Live Server"
2. 右键 `index.html` → "Open with Live Server"

## 📋 浏览器要求

- ✅ **推荐**：Chrome 100+、Safari 15+（macOS）
- ⚠️ **部分支持**：Firefox（语音识别可能不可用）
- ❌ **不支持**：IE 11 及以下

### 权限要求

首次访问需要授权：
- 📷 **摄像头权限**：用于手势识别
- 🎤 **麦克风权限**：用于语音识别

## 🛠️ 技术架构

```
前端框架：Vanilla JavaScript + HTML5 + CSS3
AI 模型：MediaPipe Hands (Google)
语音识别：Web Speech API
语音合成：Web Speech Synthesis API
渲染引擎：HTML5 Canvas
```

## 📁 项目结构

```
FingerCat/
├── index.html              # 主入口页面
├── assets/                 # 资源文件
│   ├── images/            # 图片库
│   │   └── animals/       # 动物分类
│   │       └── cat.jpg    # 猫咪照片
│   └── audio/             # 音频资源（未来）
├── src/                   # 源代码
│   ├── config.js          # 配置文件
│   ├── camera.js          # 摄像头与手势识别
│   ├── speechRecognition.js # 语音识别
│   ├── imageLibrary.js    # 图片管理
│   ├── canvas.js          # 画布渲染
│   ├── audio.js           # 音频系统
│   ├── gameState.js       # 游戏状态管理
│   └── main.js            # 主程序入口
└── styles/                # 样式文件
    └── main.css           # 主样式
```

## 🎨 自定义图片

将你的图片放入 `assets/images/animals/` 目录，然后在 `src/imageLibrary.js` 中添加配置：

```javascript
this.library = {
    animals: [
        { id: 'cat', path: 'assets/images/animals/cat.jpg', name: '小猫咪', emoji: '🐱' },
        { id: 'dog', path: 'assets/images/animals/dog.jpg', name: '小狗狗', emoji: '🐶' }
        // 添加更多...
    ]
};
```

## ⚙️ 家长设置

点击右上角 ⚙️ 图标可以设置：

- **难度**：简单（1-5）、中等（1-10）、挑战（10+）
- **音效控制**：独立开关语音反馈和音效
- **识别灵敏度**：调整手指检测的响应速度

## 🐛 常见问题

### Q: 摄像头无法启动？
A: 检查浏览器权限设置，确保允许网站访问摄像头

### Q: 语音识别不工作？
A: 
1. 确认使用 Chrome 或 Safari 浏览器
2. 检查麦克风权限
3. 确保在 HTTPS 或 localhost 环境下运行

### Q: 手指识别不准确？
A: 
1. 确保光线充足
2. 手指清晰可见，不要遮挡
3. 调整家长设置中的灵敏度

### Q: 没有声音？
A: 检查家长设置面板中的音效开关，确保系统音量未静音

## 🔮 未来计划

- [ ] 更多图片分类（水果、玩具、交通工具）
- [ ] 自定义图片上传功能
- [ ] 进度追踪和数据统计
- [ ] 多语言支持（英语、西班牙语）
- [ ] 简单数学题模式（加减法）
- [ ] 多人游戏模式
- [ ] iPad/移动端适配

## 📄 开源协议

MIT License - 自由使用和修改

---

**Made with ❤️ for curious kids**
