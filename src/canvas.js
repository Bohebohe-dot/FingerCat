// 画布渲染模块
class CanvasRenderer {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.placeholder = document.getElementById('canvasPlaceholder');

        this.init();
    }

    // 初始化
    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    // 调整画布尺寸
    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    }

    // 清空画布
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.showPlaceholder();
    }

    // 显示占位符
    showPlaceholder() {
        if (this.placeholder) {
            this.placeholder.style.display = 'block';
        }
    }

    // 隐藏占位符
    hidePlaceholder() {
        if (this.placeholder) {
            this.placeholder.style.display = 'none';
        }
    }

    // 渲染图片（带动画）
    async renderImages(imageId, count) {
        if (count <= 0) {
            this.clear();
            return;
        }

        this.hidePlaceholder();

        // 获取图片对象
        const img = window.imageLibrary.getImage(imageId);
        if (!img) {
            console.error('图片未加载:', imageId);
            return;
        }

        // 计算布局
        const layout = this.calculateLayout(count);

        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 使用动画绘制每个图片
        for (let i = 0; i < count; i++) {
            await this.animateImage(img, layout.positions[i], i * 80); // 每个图片延迟80ms
        }
    }

    // 计算布局位置
    calculateLayout(count) {
        const imageSize = CONFIG.canvas.imageSize;
        const padding = CONFIG.canvas.padding;
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;

        const positions = [];

        // 根据数量选择布局策略
        if (count <= 5) {
            // 单行居中布局
            const totalWidth = count * imageSize + (count - 1) * padding;
            const startX = (canvasWidth - totalWidth) / 2;
            const startY = (canvasHeight - imageSize) / 2;

            for (let i = 0; i < count; i++) {
                positions.push({
                    x: startX + i * (imageSize + padding),
                    y: startY,
                    size: imageSize
                });
            }
        } else if (count <= 10) {
            // 双行布局
            const cols = Math.ceil(count / 2);
            const totalWidth = cols * imageSize + (cols - 1) * padding;
            const startX = (canvasWidth - totalWidth) / 2;
            const rowHeight = imageSize + padding;
            const startY = (canvasHeight - rowHeight * 2 + padding) / 2;

            for (let i = 0; i < count; i++) {
                const row = Math.floor(i / cols);
                const col = i % cols;

                positions.push({
                    x: startX + col * (imageSize + padding),
                    y: startY + row * rowHeight,
                    size: imageSize
                });
            }
        } else {
            // 网格布局（3-4列）
            const cols = Math.ceil(Math.sqrt(count));
            const rows = Math.ceil(count / cols);

            // 如果数量太多，缩小图片尺寸
            const adjustedSize = Math.min(imageSize, (canvasWidth - padding * (cols + 1)) / cols);
            const totalWidth = cols * adjustedSize + (cols - 1) * padding;
            const totalHeight = rows * adjustedSize + (rows - 1) * padding;
            const startX = (canvasWidth - totalWidth) / 2;
            const startY = (canvasHeight - totalHeight) / 2;

            for (let i = 0; i < count; i++) {
                const row = Math.floor(i / cols);
                const col = i % cols;

                positions.push({
                    x: startX + col * (adjustedSize + padding),
                    y: startY + row * (adjustedSize + padding),
                    size: adjustedSize
                });
            }
        }

        return { positions };
    }

    // 动画绘制单个图片
    animateImage(img, position, delay) {
        return new Promise(resolve => {
            setTimeout(() => {
                const duration = CONFIG.canvas.animationDuration;
                const startTime = Date.now();

                const animate = () => {
                    const elapsed = Date.now() - startTime;
                    const progress = Math.min(elapsed / duration, 1);

                    // 缓动函数（弹性效果）
                    const easeOutBack = (t) => {
                        const c1 = 1.70158;
                        const c3 = c1 + 1;
                        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
                    };

                    const scale = easeOutBack(progress);
                    const alpha = progress;

                    // 绘制图片
                    this.ctx.save();
                    this.ctx.globalAlpha = alpha;

                    const x = position.x + position.size / 2;
                    const y = position.y + position.size / 2;

                    this.ctx.translate(x, y);
                    this.ctx.scale(scale, scale);
                    this.ctx.translate(-x, -y);

                    // 绘制圆角图片
                    this.drawRoundedImage(img, position.x, position.y, position.size, position.size, 12);

                    this.ctx.restore();

                    if (progress < 1) {
                        requestAnimationFrame(animate);
                    } else {
                        resolve();
                    }
                };

                animate();
            }, delay);
        });
    }

    // 绘制圆角图片
    drawRoundedImage(img, x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
        this.ctx.clip();

        this.ctx.drawImage(img, x, y, width, height);

        // 添加边框
        this.ctx.strokeStyle = 'rgba(255, 107, 157, 0.3)';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
    }
}

// 导出全局实例
window.canvasRenderer = new CanvasRenderer();
