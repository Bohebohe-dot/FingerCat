// 主入口文件
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 FingerCat 游戏启动中...');

    // 初始化所有模块
    await init();

    // 绑定事件监听器
    bindEventListeners();

    console.log('✅ 游戏初始化完成');
});

// 初始化函数
async function init() {
    try {
        // 1. 初始化摄像头和手势识别
        Utils.updateStatus('正在启动摄像头...', 'info');
        await window.cameraManager.init();

        // 2. 初始化图片库（已自动加载）
        console.log('📚 图片库已初始化');

        // 3. 初始化画布
        console.log('🎨 画布已初始化');

        // 4. 初始化语音识别
        if (!window.speechManager.isSupported) {
            Utils.updateStatus('⚠️ 您的浏览器不支持语音识别，建议使用 Chrome 或 Safari', 'error');
            document.getElementById('listenBtn').disabled = true;
        }

        // 5. 显示欢迎信息
        Utils.updateStatus('欢迎来到 FingerCat！点击「开始游戏」按钮开始吧~');

    } catch (error) {
        console.error('❌ 初始化失败:', error);
        Utils.updateStatus('初始化失败，请刷新页面重试', 'error');
    }
}

// 绑定事件监听器
function bindEventListeners() {
    // 开始游戏按钮
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            window.audioManager.playClick();
            window.gameStateManager.startGame();
        });
    }

    // 语音识别按钮
    const listenBtn = document.getElementById('listenBtn');
    if (listenBtn) {
        listenBtn.addEventListener('click', () => {
            window.audioManager.playClick();
            window.gameStateManager.startListening();
        });
    }

    // 清空画布按钮
    const clearBtn = document.getElementById('clearBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            window.gameStateManager.clearCanvas();
        });
    }

    // 设置按钮
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeModal = document.getElementById('closeModal');

    if (settingsBtn && settingsModal) {
        settingsBtn.addEventListener('click', () => {
            window.audioManager.playClick();
            settingsModal.classList.add('active');
        });
    }

    if (closeModal && settingsModal) {
        closeModal.addEventListener('click', () => {
            window.audioManager.playClick();
            settingsModal.classList.remove('active');
        });

        // 点击模态框外部关闭
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) {
                settingsModal.classList.remove('active');
            }
        });
    }

    // 设置面板 - 难度选择
    const difficultySelect = document.getElementById('difficultySelect');
    if (difficultySelect) {
        difficultySelect.addEventListener('change', (e) => {
            STATE.currentDifficulty = e.target.value;
            console.log('难度设置:', e.target.value);
        });
    }

    // 设置面板 - 语音开关
    const voiceToggle = document.getElementById('voiceToggle');
    if (voiceToggle) {
        voiceToggle.addEventListener('change', (e) => {
            CONFIG.audio.enableVoice = e.target.checked;
            console.log('语音反馈:', e.target.checked);
        });
    }

    // 设置面板 - 音效开关
    const sfxToggle = document.getElementById('sfxToggle');
    if (sfxToggle) {
        sfxToggle.addEventListener('change', (e) => {
            CONFIG.audio.enableSFX = e.target.checked;
            console.log('音效:', e.target.checked);
        });
    }

    // 设置面板 - 灵敏度
    const sensitivitySlider = document.getElementById('sensitivitySlider');
    const sensitivityValue = document.getElementById('sensitivityValue');
    if (sensitivitySlider && sensitivityValue) {
        sensitivitySlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            const labels = ['很低', '较低', '中等', '较高', '很高'];
            sensitivityValue.textContent = labels[value - 1];

            // 调整检测参数
            CONFIG.detection.minFramesConsistent = 6 - value; // 1-5 -> 5-1
            console.log('灵敏度:', labels[value - 1], '帧数:', CONFIG.detection.minFramesConsistent);
        });
    }

    // 键盘快捷键
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && STATE.isGameActive && !STATE.isListening) {
            e.preventDefault();
            window.gameStateManager.startListening();
        }
    });
}

// 错误处理
window.addEventListener('error', (e) => {
    console.error('全局错误:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('未处理的Promise错误:', e.reason);
});
