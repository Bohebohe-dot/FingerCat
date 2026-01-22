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
        try {
            // 只有在尺寸变化时才调整 canvas 尺寸，避免每帧重置 context
            const videoWidth = this.videoElement.videoWidth;
            const videoHeight = this.videoElement.videoHeight;
            
            if (videoWidth === 0 || videoHeight === 0) return;

            if (this.handCanvas.width !== videoWidth || this.handCanvas.height !== videoHeight) {
                this.handCanvas.width = videoWidth;
                this.handCanvas.height = videoHeight;
            }

            // 清空画布
            this.handCanvasCtx.save();
            this.handCanvasCtx.clearRect(0, 0, this.handCanvas.width, this.handCanvas.height);

            // 如果视频是镜像的，画布绘图也应该镜像，以匹配视频显示
            // 这里的 translate 和 scale 会影响后续所有的绘制操作
            this.handCanvasCtx.translate(this.handCanvas.width, 0);
            this.handCanvasCtx.scale(-1, 1);

            // 绘制手部关键点和骨架
            if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                let totalFingers = 0;

                for (const landmarks of results.multiHandLandmarks) {
                    if (!landmarks || landmarks.length < 21) continue;

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
        } catch (error) {
            console.error('Error in onResults:', error);
            // 确保即使报错也尝试 restore，防止 state 堆栈溢出
            try { this.handCanvasCtx.restore(); } catch (e) {}
        }
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

    // 计数单手手指（优化算法：基于夹角判定）
    countFingers(landmarks) {
        if (!landmarks || landmarks.length < 21) return 0;
        let count = 0;

        // MediaPipe Hand Landmarker 索引：
        // 拇指: 4 (Tip), 3 (IP), 2 (MCP)
        // 食指: 8 (Tip), 7 (DIP), 6 (PIP)
        // 中指: 12 (Tip), 11 (DIP), 10 (PIP)
        // 无名指: 16 (Tip), 15 (DIP), 14 (PIP)
        // 小指: 20 (Tip), 19 (DIP), 18 (PIP)

        // 拇指 (基于指尖、IP、MCP关节)
        if (this.isFingerStraight(landmarks, [4, 3, 2], 'thumb')) count++;
        // 食指 (基于指尖、DIP、PIP关节)
        if (this.isFingerStraight(landmarks, [8, 7, 6], 'index')) count++;
        // 中指
        if (this.isFingerStraight(landmarks, [12, 11, 10], 'middle')) count++;
        // 无名指
        if (this.isFingerStraight(landmarks, [16, 15, 14], 'ring')) count++;
        // 小指
        if (this.isFingerStraight(landmarks, [20, 19, 18], 'pinky')) count++;

        return count;
    }

    // 判断手指是否伸直（基于【红色端点-相邻关节点的夹角】）
    isFingerStraight(landmarks, points, fingerName) {
        // points 数组现在包含 [tip, joint1, joint2]
        // 例如，食指是 [8, 7, 6]，分别代表 tip, dip, pip
        const tip = landmarks[points[0]];
        const joint1 = landmarks[points[1]];
        const joint2 = landmarks[points[2]];

        // 我们计算 joint2 -> joint1 -> tip 的夹角
        // 伸直时，这个角度应该接近 180 度
        const angle = this.calculateAngleBetweenPoints(joint2, joint1, tip);
        
        // 从配置中获取该手指的阈值
        const threshold = CONFIG.detection.fingerThresholds[fingerName] || 30;
        
        // 判断是否伸直：(180 - angle) < threshold
        if (Math.abs(180 - angle) <= threshold) {
            // 附加检查，防止握拳时误判
            // 规则：指尖到手腕的距离必须大于指关节到手腕的距离
            const wrist = landmarks[0];
            const tipDist = Math.sqrt(Math.pow(tip.x - wrist.x, 2) + Math.pow(tip.y - wrist.y, 2));
            const jointDist = Math.sqrt(Math.pow(joint1.x - wrist.x, 2) + Math.pow(joint1.y - wrist.y, 2));
            
            return tipDist > jointDist;
        }
        
        return false;
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
