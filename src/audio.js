// 音频系统模块
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.sounds = new Map();
        this.init();
    }

    // 初始化
    init() {
        // 创建 AudioContext（需要用户交互后才能使用）
        document.addEventListener('click', () => {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                console.log('✅ 音频上下文已创建');
            }
        }, { once: true });
    }

    // 播放成功音效
    playSuccess() {
        if (!CONFIG.audio.enableSFX) return;

        // 使用简单的 beep 音效
        this.playBeep(800, 0.1, 'sine');
        setTimeout(() => this.playBeep(1000, 0.15, 'sine'), 100);
    }

    // 播放错误音效
    playError() {
        if (!CONFIG.audio.enableSFX) return;

        this.playBeep(300, 0.2, 'sawtooth');
    }

    // 播放点击音效
    playClick() {
        if (!CONFIG.audio.enableSFX) return;

        this.playBeep(600, 0.05, 'square');
    }

    // 生成简单的 beep 音
    playBeep(frequency, duration, type = 'sine') {
        if (!this.audioContext) return;

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = type;

            gainNode.gain.setValueAtTime(CONFIG.audio.volume * 0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);

        } catch (error) {
            console.error('播放音效失败:', error);
        }
    }

    // 语音播报（使用 Web Speech API）
    speak(text) {
        Utils.speak(text);
    }
}

// 导出全局实例
window.audioManager = new AudioManager();
