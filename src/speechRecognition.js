// 语音识别模块
class SpeechRecognitionManager {
    constructor() {
        this.recognition = null;
        this.isSupported = false;
        this.isListening = false;
        this.expectedAnswer = null;

        this.init();
    }

    // 初始化语音识别
    init() {
        // 检查浏览器支持
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.warn('⚠️ 浏览器不支持语音识别');
            this.isSupported = false;
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.lang = CONFIG.speech.lang;
        this.recognition.continuous = CONFIG.speech.continuous;
        this.recognition.interimResults = CONFIG.speech.interimResults;
        this.recognition.maxAlternatives = CONFIG.speech.maxAlternatives;

        // 监听识别结果
        this.recognition.onresult = (event) => this.onResult(event);

        // 监听错误
        this.recognition.onerror = (event) => this.onError(event);

        // 监听结束
        this.recognition.onend = () => this.onEnd();

        this.isSupported = true;
        console.log('✅ 语音识别已初始化');
    }

    // 开始监听
    startListening(expectedAnswer) {
        if (!this.isSupported) {
            Utils.updateStatus('您的浏览器不支持语音识别功能', 'error');
            return;
        }

        if (this.isListening) {
            console.log('已经在监听中');
            return;
        }

        this.expectedAnswer = expectedAnswer;
        this.isListening = true;
        STATE.isListening = true;

        try {
            this.recognition.start();
            Utils.updateStatus('🎤 请说出你看到的手指数量...', 'info');

            // 更新按钮状态
            const listenBtn = document.getElementById('listenBtn');
            if (listenBtn) {
                listenBtn.classList.add('listening');
                listenBtn.innerHTML = '<span class="btn-icon">🔴</span> 正在聆听...';
            }

        } catch (error) {
            console.error('启动语音识别失败:', error);
            this.isListening = false;
            STATE.isListening = false;
        }
    }

    // 停止监听
    stopListening() {
        if (!this.isSupported || !this.isListening) return;

        try {
            this.recognition.stop();
        } catch (error) {
            console.error('停止语音识别失败:', error);
        }
    }

    // 处理识别结果
    onResult(event) {
        const result = event.results[0][0];
        const transcript = result.transcript.trim();
        const confidence = result.confidence;

        console.log(`识别结果: "${transcript}", 置信度: ${confidence.toFixed(2)}`);

        // 解析数字
        const spokenNumber = this.parseNumber(transcript);

        if (spokenNumber === null) {
            Utils.speak('我没听清，请再说一次');
            Utils.updateStatus('❌ 未识别到有效数字，请重试', 'error');
            this.stopListening();
            return;
        }

        // 验证答案
        if (spokenNumber === this.expectedAnswer) {
            // 回答正确！
            this.onCorrectAnswer(spokenNumber);
        } else {
            // 回答错误
            this.onWrongAnswer(spokenNumber, this.expectedAnswer);
        }

        this.stopListening();
    }

    // 解析语音中的数字
    parseNumber(text) {
        // 直接匹配阿拉伯数字
        const arabicMatch = text.match(/(\d+)/);
        if (arabicMatch) {
            return parseInt(arabicMatch[1]);
        }

        // 中文数字映射
        const chineseNumbers = {
            '零': 0, '〇': 0,
            '一': 1, '壹': 1, '幺': 1,
            '二': 2, '贰': 2, '两': 2,
            '三': 3, '叁': 3,
            '四': 4, '肆': 4,
            '五': 5, '伍': 5,
            '六': 6, '陆': 6,
            '七': 7, '柒': 7,
            '八': 8, '捌': 8,
            '九': 9, '玖': 9,
            '十': 10, '拾': 10
        };

        // 匹配单个中文数字
        for (const [chinese, num] of Object.entries(chineseNumbers)) {
            if (text.includes(chinese)) {
                return num;
            }
        }

        // 处理 "十一" 到 "二十" 的情况
        if (text.includes('十')) {
            const match = text.match(/([一二三四五六七八九])十([一二三四五六七八九])?/);
            if (match) {
                const tens = chineseNumbers[match[1]] || 1;
                const ones = match[2] ? chineseNumbers[match[2]] : 0;
                return tens * 10 + ones;
            }
        }

        return null;
    }

    // 回答正确
    onCorrectAnswer(number) {
        const encouragement = Utils.getEncouragement();

        Utils.speak(`${encouragement} ${Utils.numberToChinese(number)} 个手指！`);
        Utils.updateStatus(`✨ ${encouragement} 答对了！`, 'success');
        Utils.playSuccessSound();

        // 触发渲染事件
        document.dispatchEvent(new CustomEvent('correctAnswer', {
            detail: { count: number }
        }));
    }

    // 回答错误
    onWrongAnswer(spoken, expected) {
        Utils.speak(`数一数，应该是 ${Utils.numberToChinese(expected)} 个哦`);
        Utils.updateStatus(`❌ 你说的是 ${spoken}，再仔细数一数吧！`, 'error');
    }

    // 处理错误
    onError(event) {
        console.error('语音识别错误:', event.error);

        const errorMessages = {
            'no-speech': '没有检测到语音，请再试一次',
            'audio-capture': '无法访问麦克风',
            'not-allowed': '麦克风权限被拒绝',
            'network': '网络错误'
        };

        const message = errorMessages[event.error] || '识别出错，请重试';
        Utils.updateStatus(`🎤 ${message}`, 'error');

        this.isListening = false;
        STATE.isListening = false;
    }

    // 结束监听
    onEnd() {
        this.isListening = false;
        STATE.isListening = false;

        // 重置按钮
        const listenBtn = document.getElementById('listenBtn');
        if (listenBtn) {
            listenBtn.classList.remove('listening');
            listenBtn.innerHTML = '<span class="btn-icon">🎤</span> 点击说话';
        }
    }
}

// 导出全局实例
window.speechManager = new SpeechRecognitionManager();
