// 图片库管理模块
class ImageLibrary {
    constructor() {
        this.images = new Map();
        this.selectedImage = 'cat';
        this.init();
    }

    // 初始化图片库
    init() {
        // 默认图片库配置
        this.library = {
            animals: [
                { id: 'cat', path: 'assets/images/animals/cat.jpg', name: '小猫咪', emoji: '🐱' }
                // 可以添加更多图片
            ]
        };

        // 预加载所有图片
        this.preloadImages();

        // 渲染图片选择器
        this.renderImageGallery();
    }

    // 预加载图片
    async preloadImages() {
        const loadPromises = [];

        for (const category of Object.values(this.library)) {
            for (const item of category) {
                const promise = new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = () => {
                        this.images.set(item.id, img);
                        console.log(`✅ 图片加载成功: ${item.name}`);
                        resolve();
                    };
                    img.onerror = () => {
                        console.error(`❌ 图片加载失败: ${item.path}`);
                        reject();
                    };
                    img.src = item.path;
                });

                loadPromises.push(promise);
            }
        }

        try {
            await Promise.all(loadPromises);
            console.log('📚 所有图片加载完成');
        } catch (error) {
            console.error('部分图片加载失败');
        }
    }

    // 渲染图片选择器
    renderImageGallery() {
        const gallery = document.getElementById('imageGallery');
        if (!gallery) return;

        gallery.innerHTML = '';

        for (const category of Object.values(this.library)) {
            for (const item of category) {
                const card = document.createElement('div');
                card.className = 'image-card';
                if (item.id === this.selectedImage) {
                    card.classList.add('active');
                }
                card.dataset.image = item.id;

                card.innerHTML = `
                    <img src="${item.path}" alt="${item.name}">
                    <span class="image-label">${item.emoji} ${item.name}</span>
                `;

                // 点击选择图片
                card.addEventListener('click', () => this.selectImage(item.id));

                gallery.appendChild(card);
            }
        }
    }

    // 选择图片
    selectImage(imageId) {
        this.selectedImage = imageId;
        STATE.selectedImage = imageId;

        // 更新UI
        document.querySelectorAll('.image-card').forEach(card => {
            card.classList.toggle('active', card.dataset.image === imageId);
        });

        const imageInfo = this.getImageInfo(imageId);
        Utils.updateStatus(`已选择：${imageInfo.emoji} ${imageInfo.name}`);

        console.log(`📸 切换图片: ${imageInfo.name}`);
    }

    // 获取图片信息
    getImageInfo(imageId) {
        for (const category of Object.values(this.library)) {
            const item = category.find(img => img.id === imageId);
            if (item) return item;
        }
        return null;
    }

    // 获取已加载的图片对象
    getImage(imageId) {
        return this.images.get(imageId);
    }

    // 添加自定义图片（未来功能）
    addCustomImage(file) {
        // TODO: 支持用户上传自定义图片
        console.log('自定义图片上传功能开发中...');
    }
}

// 导出全局实例
window.imageLibrary = new ImageLibrary();
