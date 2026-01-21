// 游戏配置文件
const CONFIG = {
    // 识别配置
    detection: {
        minFramesConsistent: 3,  // 需要连续N帧一致才确认
        confidenceThreshold: 0.7, // 最低置信度
        maxFingers: 10,          // 最大手指数（基础版）
    },
    
    // 难度设置
    difficulty: {
        easy: { min: 1, max: 5 },
        medium: { min: 1, max: 10 },
        hard: { min: 1, max: 20 }
    },
    
    // 语音识别配置
    speech: {
        lang: 'zh-CN',           // 中文识别
        continuous: false,       // 非连续识别
        interimResults: false,   // 不需要临时结果
        maxAlternatives: 1
    },
    
    // 音频配置
    audio: {
        enableVoice: true,       // 语音反馈
        enableSFX: true,         // 音效
        volume: 0.7
    },
    
    // 画布配置
    canvas: {
        imageSize: 150,          // 单个图片尺寸
        padding: 20,             // 图片间距
        animationDuration: 600   // 动画持续时间（ms）
    },
    
    // MediaPipe 配置
    mediapipe: {
        modelComplexity: 1,      // 模型复杂度 0-2
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5,
        maxNumHands: 2           // 支持双手检测
    }
};

// 全局状态
const STATE = {
    currentDifficulty: 'medium',
    selectedImage: 'cat',
    detectedFingers: 0,
    isGameActive: false,
    isListening: false,
    isCameraReady: false,
    handsModel: null
};

// 工具函数
const Utils = {
    // 播放成功音效
    playSuccessSound() {
        if (!CONFIG.audio.enableSFX) return;
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTUHGWm98OScTgwOUKjj8LRgGgU7k9n0yoIyBSh+zPLaizsIHm7A8+OVSAwSV6/o7qxXEwtHoePxvmweBTCFz/PYhjMGHmzA9OWhUQ0PVKzm77NfHAU7lNr1yH4xBSh+zPDajjsIF2/D9OSYTAwTWK/o7atWEwpHouPzu2ccBDOG0fLVgzQGH23C8+OaTQwQVK3m77RiHgQ'); // 简单的提示音
        audio.volume = CONFIG.audio.volume;
        audio.play().catch(e => console.log('音效播放失败:', e));
    },
    
    // 语音播报数字
    speak(text) {
        if (!CONFIG.audio.enableVoice) return;
        
        // 使用 Web Speech API
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-CN';
        utterance.rate = 0.9;  // 稍慢一点，适合儿童
        utterance.pitch = 1.2; // 稍高音调，更活泼
        utterance.volume = CONFIG.audio.volume;
        
        window.speechSynthesis.cancel(); // 取消之前的语音
        window.speechSynthesis.speak(utterance);
    },
    
    // 数字转中文
    numberToChinese(num) {
        const digits = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
        if (num <= 10) return digits[num];
        if (num < 20) return '十' + digits[num - 10];
        const tens = Math.floor(num / 10);
        const ones = num % 10;
        return digits[tens] + '十' + (ones > 0 ? digits[ones] : '');
    },
    
    // 更新状态消息
    updateStatus(message, type = 'info') {
        const statusEl = document.getElementById('statusMessage');
        if (!statusEl) return;
        
        statusEl.textContent = message;
        statusEl.style.borderLeftColor = {
            'info': 'var(--secondary)',
            'success': 'var(--success)',
            'error': 'var(--primary)'
        }[type] || 'var(--secondary)';
    },
    
    // 生成随机鼓励语
    getEncouragement() {
        const messages = [
            '太棒了！',
            '你真聪明！',
            '答对啦！',
            '继续加油！',
            '你好厉害！',
            '真是数学小天才！'
        ];
        return messages[Math.floor(Math.random() * messages.length)];
    }
};
