// 游戏状态管理模块
class GameStateManager {
    constructor() {
        this.state = 'idle'; // idle, selecting, detecting, waiting_speech, rendering, celebrating
        this.init();
    }

    // 初始化
    init() {
        // 监听手指检测事件
        document.addEventListener('fingersDetected', (e) => {
            this.onFingersDetected(e.detail.count);
        });

        // 监听正确答案事件
        document.addEventListener('correctAnswer', (e) => {
            this.onCorrectAnswer(e.detail.count);
        });
    }

    // 开始游戏
    startGame() {
        if (!STATE.isCameraReady) {
            Utils.updateStatus('摄像头未就绪，请稍候...', 'error');
            return;
        }

        this.state = 'detecting';
        STATE.isGameActive = true;

        // 启用语音按钮
        const listenBtn = document.getElementById('listenBtn');
        if (listenBtn) {
            listenBtn.disabled = false;
        }

        Utils.updateStatus('👆 请伸出你的手指，然后点击「点击说话」按钮！');
        Utils.speak('伸出你的手指，数一数有几个，然后点击按钮告诉我');

        console.log('🎮 游戏开始');
    }

    // 检测到手指
    onFingersDetected(count) {
        if (!STATE.isGameActive || this.state === 'rendering') return;

        // 更新提示信息
        if (count > 0) {
            const listenBtn = document.getElementById('listenBtn');
            if (listenBtn && !listenBtn.disabled) {
                Utils.updateStatus(`👆 检测到 ${count} 个手指，点击「点击说话」按钮说出数量`);
            }
        }
    }

    // 开始语音识别
    startListening() {
        if (!STATE.isGameActive) {
            Utils.updateStatus('请先点击「开始游戏」', 'info');
            return;
        }

        if (STATE.detectedFingers === 0) {
            Utils.updateStatus('请先伸出手指！', 'error');
            Utils.speak('我还没看到你的手指哦');
            return;
        }

        this.state = 'waiting_speech';

        // 开始语音识别
        window.speechManager.startListening(STATE.detectedFingers);
    }

    // 回答正确
    async onCorrectAnswer(count) {
        this.state = 'rendering';

        // 播放成功音效
        window.audioManager.playSuccess();

        // 渲染图片
        await window.canvasRenderer.renderImages(STATE.selectedImage, count);

        this.state = 'celebrating';

        // 3秒后自动重置
        setTimeout(() => {
            this.resetRound();
        }, 3000);
    }

    // 重置回合
    resetRound() {
        this.state = 'detecting';
        Utils.updateStatus('👆 继续玩吧！伸出新的手指数量');
        Utils.speak('我们再来一次');

        // 清空画布
        setTimeout(() => {
            window.canvasRenderer.clear();
        }, 500);
    }

    // 清空画布
    clearCanvas() {
        window.canvasRenderer.clear();
        Utils.updateStatus('画布已清空');
        window.audioManager.playClick();
    }

    // 停止游戏
    stopGame() {
        this.state = 'idle';
        STATE.isGameActive = false;

        const listenBtn = document.getElementById('listenBtn');
        if (listenBtn) {
            listenBtn.disabled = true;
        }

        window.canvasRenderer.clear();
        Utils.updateStatus('游戏已结束');
    }
}

// 导出全局实例
window.gameStateManager = new GameStateManager();
