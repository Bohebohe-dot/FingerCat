// 摄像头与手势识别模块
class CameraManager {
    constructor() {
        this.videoElement = document.getElementById('videoElement');
        this.handCanvas = document.getElementById('handCanvas');
        this.handCanvasCtx = this.handCanvas.getContext('2d');
        this.hands = null;
        this.camera = null;
        this.consecutiveFrames = [];
    }

    // 初始化
    async init() {
        try {
            // 初始化 MediaPipe Hands
            this.hands = new Hands({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
                }
            });

            this.hands.setOptions({
                maxNumHands: CONFIG.mediapipe.maxNumHands,
                modelComplexity: CONFIG.mediapipe.modelComplexity,
                minDetectionConfidence: CONFIG.mediapipe.minDetectionConfidence,
                minTrackingConfidence: CONFIG.mediapipe.minTrackingConfidence
            });

            this.hands.onResults(results => this.onResults(results));

            // 初始化摄像头
            this.camera = new Camera(this.videoElement, {
                onFrame: async () => {
                    await this.hands.send({ image: this.videoElement });
                },
                width: 640,
                height: 480
            });

            await this.camera.start();

            STATE.isCameraReady = true;
            this.updateCameraStatus('摄像头就绪', true);
            console.log('✅ 摄像头和手势识别已初始化');

        } catch (error) {
            console.error('❌ 摄像头初始化失败:', error);
            this.updateCameraStatus('摄像头启动失败', false);
            Utils.updateStatus('无法访问摄像头，请检查权限设置', 'error');
        }
    }

    // 处理识别结果
    onResults(results) {
        // 调整 canvas 尺寸
        this.handCanvas.width = this.videoElement.videoWidth;
        this.handCanvas.height = this.videoElement.videoHeight;

        // 清空画布
        this.handCanvasCtx.save();
        this.handCanvasCtx.clearRect(0, 0, this.handCanvas.width, this.handCanvas.height);

        // 绘制手部关键点和骨架
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            let totalFingers = 0;

            for (const landmarks of results.multiHandLandmarks) {
                // 绘制连接线（骨架）
                this.drawConnectors(landmarks);

                // 绘制关键点
                this.drawLandmarks(landmarks);

                // 计数手指
                totalFingers += this.countFingers(landmarks);
            }

            // 记录连续帧
            this.recordConsecutiveFrames(totalFingers);

        } else {
            // 没有检测到手
            this.recordConsecutiveFrames(0);
        }

        this.handCanvasCtx.restore();
    }

    // 绘制骨架连接线
    drawConnectors(landmarks) {
        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4],      // 拇指
            [0, 5], [5, 6], [6, 7], [7, 8],      // 食指
            [0, 9], [9, 10], [10, 11], [11, 12], // 中指
            [0, 13], [13, 14], [14, 15], [15, 16], // 无名指
            [0, 17], [17, 18], [18, 19], [19, 20], // 小指
            [5, 9], [9, 13], [13, 17]            // 手掌
        ];

        this.handCanvasCtx.strokeStyle = 'rgba(78, 205, 196, 0.8)';
        this.handCanvasCtx.lineWidth = 3;

        for (const [start, end] of connections) {
            const startPoint = landmarks[start];
            const endPoint = landmarks[end];

            this.handCanvasCtx.beginPath();
            this.handCanvasCtx.moveTo(
                startPoint.x * this.handCanvas.width,
                startPoint.y * this.handCanvas.height
            );
            this.handCanvasCtx.lineTo(
                endPoint.x * this.handCanvas.width,
                endPoint.y * this.handCanvas.height
            );
            this.handCanvasCtx.stroke();
        }
    }

    // 绘制关键点
    drawLandmarks(landmarks) {
        for (let i = 0; i < landmarks.length; i++) {
            const point = landmarks[i];
            const x = point.x * this.handCanvas.width;
            const y = point.y * this.handCanvas.height;

            // 指尖用不同颜色
            const isTip = [4, 8, 12, 16, 20].includes(i);
            this.handCanvasCtx.fillStyle = isTip ? '#FF6B9D' : '#4ECDC4';

            this.handCanvasCtx.beginPath();
            this.handCanvasCtx.arc(x, y, isTip ? 6 : 4, 0, 2 * Math.PI);
            this.handCanvasCtx.fill();
        }
    }

    // 计数单手手指（优化算法：严格的伸直判断）
    countFingers(landmarks) {
        let count = 0;

        // 拇指特殊判断（基于角度 + 水平判断）
        if (this.isFingerStraight(landmarks, [1, 2, 3, 4], true)) {
            count++;
        }

        // 其他四指判断（基于角度 + 垂直判断）
        const fingers = [
            { name: '食指', points: [5, 6, 7, 8] },
            { name: '中指', points: [9, 10, 11, 12] },
            { name: '无名指', points: [13, 14, 15, 16] },
            { name: '小指', points: [17, 18, 19, 20] }
        ];

        for (const finger of fingers) {
            if (this.isFingerStraight(landmarks, finger.points, false)) {
                count++;
            }
        }

        return count;
    }

    // 判断手指是否伸直（更严格的算法）
    isFingerStraight(landmarks, points, isThumb) {
        // points: [base, mcp, pip, tip]
        const base = landmarks[points[0]];  // 基点
        const mcp = landmarks[points[1]];   // 掌指关节
        const pip = landmarks[points[2]];   // 近指关节
        const tip = landmarks[points[3]];   // 指尖

        // 拇指使用简化算法（2个点角度判定）
        if (isThumb) {
            // 只检查 MCP-PIP-TIP 的角度
            const angle = this.calculateAngleBetweenPoints(mcp, pip, tip);

            // 角度接近180度（偏离不超过40度，更宽松的判定）
            if (Math.abs(180 - angle) > 40) {
                return false;
            }

            // 拇指伸直时，指尖应该在横向远离基点（更宽松的方向判断）
            return Math.abs(tip.x - base.x) > Math.abs(tip.y - base.y) * 0.6;
        }

        // 其他四指使用严格算法
        // 1. 检查关节是否近似共线（使用基点到指尖的向量）
        const baseToTip = {
            x: tip.x - base.x,
            y: tip.y - base.y
        };

        const baseToTipLength = Math.sqrt(baseToTip.x ** 2 + baseToTip.y ** 2);

        // 计算中间关节到这条直线的距离
        const distMCP = this.pointToLineDistance(mcp, base, tip);
        const distPIP = this.pointToLineDistance(pip, base, tip);

        // 归一化距离（相对于手指长度）
        const normalizedDistMCP = distMCP / baseToTipLength;
        const normalizedDistPIP = distPIP / baseToTipLength;

        // 如果偏离太大，说明手指弯曲
        if (normalizedDistMCP > 0.15 || normalizedDistPIP > 0.15) {
            return false;
        }

        // 2. 检查各个关节间的夹角（必须接近180度，偏离不超过20度）
        const angle1 = this.calculateAngleBetweenPoints(base, mcp, pip);
        const angle2 = this.calculateAngleBetweenPoints(mcp, pip, tip);

        const maxDeviation = 20;

        if (Math.abs(180 - angle1) > maxDeviation || Math.abs(180 - angle2) > maxDeviation) {
            return false;
        }

        // 3. 垂直方向伸展（指尖在基点上方）
        return tip.y < base.y;
    }

    // 计算点到直线的距离
    pointToLineDistance(point, lineStart, lineEnd) {
        const A = point.x - lineStart.x;
        const B = point.y - lineStart.y;
        const C = lineEnd.x - lineStart.x;
        const D = lineEnd.y - lineStart.y;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;

        if (lenSq === 0) return Math.sqrt(A * A + B * B);

        const param = dot / lenSq;

        let xx, yy;

        if (param < 0) {
            xx = lineStart.x;
            yy = lineStart.y;
        } else if (param > 1) {
            xx = lineEnd.x;
            yy = lineEnd.y;
        } else {
            xx = lineStart.x + param * C;
            yy = lineStart.y + param * D;
        }

        const dx = point.x - xx;
        const dy = point.y - yy;

        return Math.sqrt(dx * dx + dy * dy);
    }

    // 计算三个点之间的夹角（以中间点为顶点）
    calculateAngleBetweenPoints(p1, p2, p3) {
        // p2 是顶点
        const vector1 = {
            x: p1.x - p2.x,
            y: p1.y - p2.y
        };

        const vector2 = {
            x: p3.x - p2.x,
            y: p3.y - p2.y
        };

        // 计算夹角
        const dotProduct = vector1.x * vector2.x + vector1.y * vector2.y;
        const magnitude1 = Math.sqrt(vector1.x ** 2 + vector1.y ** 2);
        const magnitude2 = Math.sqrt(vector2.x ** 2 + vector2.y ** 2);

        if (magnitude1 === 0 || magnitude2 === 0) return 0;

        const cosAngle = dotProduct / (magnitude1 * magnitude2);
        const angleRad = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
        const angleDeg = angleRad * (180 / Math.PI);

        return angleDeg;
    }

    // 记录连续帧
    recordConsecutiveFrames(count) {
        this.consecutiveFrames.push(count);

        // 只保留最近N帧
        if (this.consecutiveFrames.length > CONFIG.detection.minFramesConsistent) {
            this.consecutiveFrames.shift();
        }

        // 检查是否稳定
        if (this.consecutiveFrames.length === CONFIG.detection.minFramesConsistent) {
            const allSame = this.consecutiveFrames.every(val => val === this.consecutiveFrames[0]);

            if (allSame && this.consecutiveFrames[0] !== STATE.detectedFingers) {
                const newCount = this.consecutiveFrames[0];
                STATE.detectedFingers = newCount;
                this.updateDetectionDisplay(newCount);

                // 触发事件（供其他模块监听）
                document.dispatchEvent(new CustomEvent('fingersDetected', {
                    detail: { count: newCount }
                }));
            }
        }
    }

    // 更新检测显示
    updateDetectionDisplay(count) {
        const countEl = document.querySelector('.finger-count');
        if (countEl) {
            countEl.textContent = count;

            // 添加跳动动画
            countEl.style.animation = 'none';
            setTimeout(() => {
                countEl.style.animation = 'bounce 0.5s ease';
            }, 10);
        }
    }

    // 更新摄像头状态
    updateCameraStatus(message, isReady) {
        const statusEl = document.getElementById('cameraStatus');
        if (statusEl) {
            statusEl.querySelector('span').textContent = message;
            const indicator = statusEl.querySelector('.status-indicator');
            indicator.style.background = isReady ? '#4ECDC4' : '#FF6B9D';
        }
    }
}

// 导出全局实例
window.cameraManager = new CameraManager();
