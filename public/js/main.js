// VProOnline - 主JavaScript文件

console.log('main.js 文件加载完成');

// 添加全局变量来存储token状态
let uploadToken = null;
let isTokenValid = false;

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM内容加载完成，开始初始化应用');
    // 初始化应用
    initApp();
});

// 初始化应用
function initApp() {
    console.log('开始初始化应用...');
    
    // 首先检查token状态
    checkTokenStatus();
    
    // 初始化上传功能
    try {
        initUpload();
        console.log('上传功能初始化成功');
    } catch (error) {
        console.error('上传功能初始化失败:', error);
    }
    
    // 初始化视频列表
    try {
        loadVideoList();
        console.log('视频列表初始化成功');
    } catch (error) {
        console.error('视频列表初始化失败:', error);
    }
    
    // 初始化UI交互
    try {
        initUIInteractions();
        console.log('UI交互初始化成功');
    } catch (error) {
        console.error('UI交互初始化失败:', error);
    }
    
    // 初始化首页按钮
    try {
        initHomePageButtons();
        console.log('首页按钮初始化成功');
    } catch (error) {
        console.error('首页按钮初始化失败:', error);
    }
    
    // 初始化所有页面交互功能
    try {
        if (typeof initializeAllInteractions === 'function') {
            initializeAllInteractions();
            console.log('页面交互功能初始化成功');
        } else {
            console.warn('initializeAllInteractions 函数不存在，跳过该初始化');
        }
    } catch (error) {
        console.error('页面交互功能初始化失败:', error);
    }
    
    console.log('应用初始化完成');
}

// 初始化上传功能
function initUpload() {
    console.log('初始化上传功能...');
    
    // 在token验证通过之前不初始化上传功能
    if (!isTokenValid) {
        console.log('Token未验证，暂不初始化上传功能');
        return;
    }
    
    const uploadForm = document.getElementById('upload-form');
    const fileInput = document.getElementById('file-input');
    const selectFileBtn = document.getElementById('select-file-btn');
    const dropArea = document.getElementById('drop-area');
    
    console.log('元素查找结果:', {
        uploadForm: !!uploadForm,
        fileInput: !!fileInput,
        selectFileBtn: !!selectFileBtn,
        dropArea: !!dropArea
    });
    
    // 点击选择文件按钮时触发文件输入元素点击
    if (selectFileBtn && fileInput) {
        console.log('添加按钮点击事件监听器');
        selectFileBtn.addEventListener('click', function(e) {
            console.log('按钮被点击');
            e.preventDefault();
            e.stopPropagation();
            fileInput.click();
        });
    } else {
        console.error('按钮或文件输入元素不存在:', { selectFileBtn: !!selectFileBtn, fileInput: !!fileInput });
    }
    
    // 点击整个上传区域时也触发文件选择
    if (dropArea && fileInput) {
        console.log('添加区域点击事件监听器');
        dropArea.addEventListener('click', function(e) {
            console.log('区域被点击，目标元素:', e.target.tagName, e.target.className);
            
            // 如果点击的是按钮或按钮内的元素，不做处理，让按钮自己处理
            if (e.target === selectFileBtn || selectFileBtn.contains(e.target)) {
                console.log('点击的是按钮，让按钮处理');
                return;
            }
            
            // 如果点击的是区域的其他地方，触发文件选择
            console.log('点击上传区域，触发文件选择');
            fileInput.click();
        });
    } else {
        console.error('区域或文件输入元素不存在:', { dropArea: !!dropArea, fileInput: !!fileInput });
    }
    
    // 文件选择变化时处理上传
    if (fileInput) {
        console.log('添加文件输入变化事件监听器');
        fileInput.addEventListener('change', function() {
            console.log('文件被选择:', this.files[0]);
            handleFileUpload(this.files[0]);
        });
    }
    
    // 拖放功能
    if (dropArea) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, preventDefaults, false);
        });
        
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, unhighlight, false);
        });
        
        function highlight() {
            dropArea.classList.add('border-primary');
        }
        
        function unhighlight() {
            dropArea.classList.remove('border-primary');
        }
        
        dropArea.addEventListener('drop', function(e) {
            const dt = e.dataTransfer;
            const file = dt.files[0];
            handleFileUpload(file);
        });
    }
    
    // 如果存在表单，添加提交处理
    if (uploadForm) {
        uploadForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const file = fileInput.files[0];
            
            if (!file) {
                showNotification('请选择要上传的视频文件', 'error');
                return;
            }
            
            // 直接调用 handleFileUpload 函数，使用统一的上传逻辑
            handleFileUpload(file);
        });
    }
    
    // 取消上传按钮
    const cancelUploadBtn = document.getElementById('cancel-upload-btn');
    if (cancelUploadBtn) {
        cancelUploadBtn.addEventListener('click', function() {
            cancelCurrentUpload();
        });
    }
}

// 修改checkTokenStatus函数，在token验证成功后初始化上传功能
// 检查token状态
function checkTokenStatus() {
    // 隐藏上传区域和相关元素
    hideUploadElements();
    
    // 尝试获取token
    getUploadToken()
        .then(token => {
            uploadToken = token;
            isTokenValid = true;
            console.log('Token获取成功，显示上传区域');
            showUploadElements();
            // Token验证成功后初始化上传功能
            initUpload();
        })
        .catch(error => {
            console.error('Token获取失败:', error);
            // 仍然隐藏上传区域
            hideUploadElements();
            showTokenError();
        });
}

// 显示上传区域和相关元素
function showUploadElements() {
    const uploadArea = document.getElementById('upload-area');
    const selectFileBtn = document.getElementById('select-file-btn');
    const dropArea = document.getElementById('drop-area');
    const videoListSection = document.getElementById('video-list-section');
    
    if (uploadArea) uploadArea.classList.remove('hidden');
    if (selectFileBtn) selectFileBtn.classList.remove('hidden');
    if (dropArea) dropArea.classList.remove('hidden');
    if (videoListSection) videoListSection.classList.remove('hidden');
}

// 隐藏上传区域和相关元素
function hideUploadElements() {
    const uploadArea = document.getElementById('upload-area');
    const selectFileBtn = document.getElementById('select-file-btn');
    const dropArea = document.getElementById('drop-area');
    const videoListSection = document.getElementById('video-list-section');
    
    if (uploadArea) uploadArea.classList.add('hidden');
    if (selectFileBtn) selectFileBtn.classList.add('hidden');
    if (dropArea) dropArea.classList.add('hidden');
    if (videoListSection) videoListSection.classList.add('hidden');
}

// 显示token错误信息
function showTokenError() {
    const uploadArea = document.getElementById('upload-area');
    if (uploadArea) {
        uploadArea.innerHTML = `
            <div class="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <i class="fa fa-exclamation-triangle text-red-400"></i>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm text-red-700">
                            <strong>上传权限验证失败</strong><br>
                            无法获取上传权限，请确保您有权限上传文件。
                            <button id="retry-token-btn" class="ml-2 underline text-red-800 hover:text-red-900">
                                重试
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        `;
        
        // 添加重试按钮事件监听
        const retryBtn = document.getElementById('retry-token-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', function() {
                checkTokenStatus();
            });
        }
    }
}

// 获取上传验证token
async function getUploadToken() {
    try {
        // 使用与环境变量中配置的秘钥一致的值
        const authKey = ''; // 与 .env 文件中的 UPLOAD_AUTH_TOKEN 一致
        
        const response = await fetch('/api/video/auth/upload-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ authKey })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || '获取上传token失败');
        }
        
        const data = await response.json();
        if (data.success) {
            console.log('上传token获取成功:', data.token);
            return data.token;
        } else {
            throw new Error(data.message || '获取上传token失败');
        }
    } catch (error) {
        console.error('获取上传token错误:', error);
        throw error;
    }
}

// 初始化首页按钮
function initHomePageButtons() {
    // 立即开始按钮
    const getStartedBtn = document.getElementById('get-started-btn');
    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', function() {
            // 滚动到上传区域
            const videoProcessor = document.getElementById('video-processor');
            if (videoProcessor) {
                const navbarHeight = document.querySelector('#navbar').offsetHeight;
                const targetPosition = videoProcessor.offsetTop - navbarHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    }
    
    // 观看演示按钮 - 跳转到演示页面
    const demoBtns = document.querySelectorAll('button:has(.fa-play-circle)');
    demoBtns.forEach(demoBtn => {
        // 排除主logo，只处理演示按钮
        if (demoBtn.textContent.includes('观看演示') || demoBtn.textContent.includes('观看教程')) {
            demoBtn.addEventListener('click', function() {
                // 跳转到演示页面
                window.location.href = '/demo.html';
            });
        }
    });
}

// 处理文件上传
async function handleFileUpload(file) {
    if (!file) {
        showNotification('请选择要上传的视频文件', 'error');
        return;
    }
    
    // 检查文件类型
    const fileType = file.type;
    if (!fileType.startsWith('video/')) {
        showNotification('请选择有效的视频文件', 'error');
        return;
    }
    
    // 显示文件名和上传进度
    const uploadFilename = document.getElementById('upload-filename');
    
    if (uploadFilename) {
        uploadFilename.textContent = file.name;
    }
    
    try {
        // 第一步：获取上传验证token
        console.log('获取上传验证token...');
        showUploadProgress(true);
        updateUploadProgress(0, '获取上传权限...');
        
        const uploadToken = await getUploadToken();
        if (!uploadToken) {
            throw new Error('无法获取上传权限，请稍后再试');
        }
        
        console.log('上传token获取成功，开始上传文件:', file.name, '大小:', formatFileSize(file.size));
        updateUploadProgress(5, '权限验证成功，开始上传...');
        
        // 检查 smartUploadFile 函数是否可用
        if (typeof smartUploadFile !== 'function') {
            console.error('smartUploadFile 函数不存在，请检查 blob-direct-upload.js 是否正确加载');
            throw new Error('上传功能初始化失败，请刷新页面重试');
        }
        
        // 取消之前的上传（如果有）
        if (currentUploadXhr) {
            currentUploadXhr.abort();
        }
        
        // 使用智能上传函数（自动选择最佳上传方式）
        currentUploadXhr = smartUploadFile(
            file,
            uploadToken, // 传递上传token
            // 进度回调（支持消息和阶段）
            function(percentage, message, phase) {
                updateUploadProgress(percentage, message, phase);
                console.log('上传进度:', Math.round(percentage) + '%', '阶段:', phase);
            },
            // 成功回调
            function(data) {
                console.log('上传成功:', data);
                showUploadProgress(false);
                currentUploadXhr = null; // 清空引用
                
                if (data.success) {
                    showNotification('视频上传成功', 'success');
                    loadVideoList(); // 重新加载视频列表
                    
                    // 显示处理选项
                    const uploadArea = document.getElementById('upload-area');
                    const processingOptions = document.getElementById('processing-options');
                    
                    if (uploadArea && processingOptions) {
                        uploadArea.classList.add('hidden');
                        processingOptions.classList.remove('hidden');
                        
                        // 设置视频预览
                        const videoPreview = document.getElementById('video-preview');
                        if (videoPreview && data.file && data.file.url) {
                            console.log('Setting up video preview for:', {
                                filename: data.file.filename,
                                originalUrl: data.file.url,
                                storage: data.file.storage
                            });
                            
                            // 添加错误处理
                            videoPreview.onerror = function() {
                                console.error('视频预览加载失败:', {
                                    src: videoPreview.src,
                                    storage: data.file.storage,
                                    error: 'Video element error event'
                                });
                                
                                // 创建一个占位符或显示错误信息
                                const errorDiv = document.createElement('div');
                                errorDiv.className = 'flex items-center justify-center h-full bg-gray-100 text-gray-500';
                                errorDiv.innerHTML = '<div class="text-center"><i class="fa fa-exclamation-triangle text-2xl mb-2"></i><p>视频预览暂不可用<br>文件已成功上传</p></div>';
                                
                                // 替换视频元素
                                videoPreview.parentNode.replaceChild(errorDiv, videoPreview);
                            };
                            
                            videoPreview.onabort = function() {
                                console.warn('视频预览被中断:', {
                                    src: videoPreview.src,
                                    storage: data.file.storage,
                                    readyState: videoPreview.readyState,
                                    networkState: videoPreview.networkState
                                });
                                
                                // 尝试重新加载
                                setTimeout(() => {
                                    console.log('尝试重新加载视频...');
                                    videoPreview.load();
                                }, 1000);
                                
                                showNotification('视频预览加载被中断，正在重试...', 'info');
                            };
                            
                            videoPreview.oncanplay = function() {
                                console.log('视频可以播放:', videoPreview.src);
                            };
                            
                            // 如果是 Blob 存储，使用代理端点
                            let videoUrl = data.file.url;
                            if (data.file.storage === 'blob') {
                                // 使用本地代理端点来解决跨域问题
                                videoUrl = `/api/video/proxy/${data.file.filename}`;
                                console.log('使用代理 URL:', videoUrl);
                            }
                            
                            // 设置视频源并加载
                            videoPreview.src = videoUrl;
                            
                            // 添加重试机制
                            let retryCount = 0;
                            const maxRetries = 3;
                            
                            const loadWithRetry = () => {
                                videoPreview.load();
                                
                                const retryTimeout = setTimeout(() => {
                                    if (videoPreview.readyState === 0 && retryCount < maxRetries) {
                                        retryCount++;
                                        console.log(`视频加载超时，第 ${retryCount} 次重试...`);
                                        loadWithRetry();
                                    } else if (retryCount >= maxRetries) {
                                        console.error('视频加载多次失败，放弃重试');
                                        showNotification('视频预览加载失败，但文件已成功上传', 'warning');
                                    }
                                }, 5000); // 5秒超时
                                
                                // 如果成功加载，清除超时定时器
                                videoPreview.onloadstart = function() {
                                    clearTimeout(retryTimeout);
                                    console.log('视频开始加载:', videoPreview.src);
                                };
                            };
                            
                            loadWithRetry();
                        }
                        
                        // 设置视频信息
                        if (data.file && data.file.videoInfo) {
                            document.getElementById('video-filename').textContent = data.file.name || file.name;
                            document.getElementById('video-format').textContent = data.file.videoInfo.format || '-';
                            document.getElementById('video-duration').textContent = formatDuration(data.file.videoInfo.duration) || '-';
                            document.getElementById('video-resolution').textContent = 
                                data.file.videoInfo.width && data.file.videoInfo.height ? 
                                `${data.file.videoInfo.width} x ${data.file.videoInfo.height}` : '-';
                            document.getElementById('video-size').textContent = formatFileSize(data.file.size || file.size);
                        }
                        
                        // 存储当前视频文件名，用于后续处理
                        const currentVideoFilename = document.getElementById('current-video-filename');
                        if (!currentVideoFilename) {
                            // 如果不存在，创建一个隐藏字段
                            const hiddenField = document.createElement('input');
                            hiddenField.type = 'hidden';
                            hiddenField.id = 'current-video-filename';
                            hiddenField.value = data.file.filename;
                            document.body.appendChild(hiddenField);
                        } else {
                            // 如果已存在，更新值
                            currentVideoFilename.value = data.file.filename;
                        }
                    }
                } else {
                    showNotification('上传失败: ' + data.message, 'error');
                }
            },
            // 错误回调
            function(error) {
                console.error('上传错误:', error);
                showUploadProgress(false);
                currentUploadXhr = null; // 清空引用
                showNotification('上传出错: ' + error.message, 'error');
            }
        );
        
        // 返回 xhr 对象，以便可以取消上传
        return currentUploadXhr;
        
    } catch (error) {
        console.error('上传准备错误:', error);
        showUploadProgress(false);
        showNotification(error.message, 'error');
    }
}

// 加载视频列表
function loadVideoList() {
    const videoListContainer = document.getElementById('video-list');
    
    if (videoListContainer) {
        // 显示加载中
        videoListContainer.innerHTML = '<div class="text-center py-10"><i class="fa fa-spinner fa-spin fa-2x"></i><p class="mt-2">加载中...</p></div>';
        
        // 获取视频列表
        fetch('/api/video/list')
            .then(response => response.json())
            .then(data => {
                if (data.success && data.videos) {
                    if (data.videos.length === 0) {
                        videoListContainer.innerHTML = '<div class="text-center py-10 text-gray-500">暂无视频，请上传视频文件</div>';
                    } else {
                        renderVideoList(data.videos, videoListContainer);
                    }
                } else {
                    videoListContainer.innerHTML = '<div class="text-center py-10 text-red-500">加载视频列表失败</div>';
                }
            })
            .catch(error => {
                videoListContainer.innerHTML = `<div class="text-center py-10 text-red-500">加载出错: ${error.message}</div>`;
            });
    }
}

// 渲染视频列表
function renderVideoList(videos, container) {
    let html = '';
    
    videos.forEach(video => {
        const thumbnailUrl = video.thumbnail || '/img/default-thumbnail.jpg';
        
        html += `
        <div class="video-item bg-white rounded-lg shadow-md overflow-hidden transition-all hover:shadow-lg" data-id="${video.id}">
            <div class="relative pb-[56.25%] bg-gray-100">
                <img src="${thumbnailUrl}" alt="${video.name}" class="absolute top-0 left-0 w-full h-full object-cover">
                <span class="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">${formatDuration(video.duration)}</span>
            </div>
            <div class="p-4">
                <h3 class="font-medium text-dark truncate">${video.name}</h3>
                <div class="flex justify-between items-center mt-2 text-sm text-gray-500">
                    <span>${formatFileSize(video.size)}</span>
                    <span>${formatDate(video.uploadDate)}</span>
                </div>
                <div class="flex justify-between mt-3">
                    <button class="process-btn bg-primary hover:bg-blue-600 text-white px-3 py-1 rounded text-sm" data-id="${video.id}" data-filename="${video.filename}">处理</button>
                    <button class="delete-btn bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm" data-id="${video.id}" data-filename="${video.filename}">删除</button>
                </div>
            </div>
        </div>
        `;
    });
    
    container.innerHTML = `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">${html}</div>`;
    
    // 添加事件监听
    attachVideoItemEvents();
}

// 为视频项添加事件监听
function attachVideoItemEvents() {
    // 处理按钮点击事件
    document.querySelectorAll('.process-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const videoId = this.getAttribute('data-id');
            openProcessDialog(videoId);
        });
    });
    
    // 删除按钮点击事件
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const videoId = this.getAttribute('data-id');
            deleteVideo(videoId);
        });
    });
}

// 打开处理对话框
function openProcessDialog(videoId) {
    // 获取处理按钮元素
    const processBtn = document.querySelector(`.process-btn[data-id="${videoId}"]`);
    if (!processBtn) {
        showNotification('找不到视频信息', 'error');
        return;
    }
    
    // 获取文件名
    const filename = processBtn.getAttribute('data-filename');
    if (!filename) {
        showNotification('找不到视频文件名', 'error');
        return;
    }
    
    // 设置当前视频文件名到隐藏字段
    const currentVideoFilename = document.getElementById('current-video-filename');
    if (currentVideoFilename) {
        currentVideoFilename.value = filename;
    } else {
        // 如果不存在，创建一个隐藏字段
        const hiddenField = document.createElement('input');
        hiddenField.type = 'hidden';
        hiddenField.id = 'current-video-filename';
        hiddenField.name = 'current-video-filename';
        hiddenField.value = filename;
        document.body.appendChild(hiddenField);
    }
    
    // 显示处理选项区域
    const uploadArea = document.getElementById('upload-area');
    const processingOptions = document.getElementById('processing-options');
    
    if (uploadArea && processingOptions) {
        uploadArea.classList.add('hidden');
        processingOptions.classList.remove('hidden');
    }
    
    // 可以在这里添加其他逻辑，比如根据视频信息预设处理选项等
    console.log('打开处理对话框，视频ID:', videoId, '文件名:', filename);
}

// 删除视频
function deleteVideo(videoId) {
    // 获取删除按钮元素
    const deleteBtn = document.querySelector(`.delete-btn[data-id="${videoId}"]`);
    if (!deleteBtn) {
        showNotification('找不到视频信息', 'error');
        return;
    }
    
    // 直接从删除按钮获取文件名
    const filename = deleteBtn.getAttribute('data-filename');
    
    if (!filename) {
        showNotification('找不到视频文件名', 'error');
        return;
    }
    
    if (confirm('确定要删除这个视频吗？')) {
        fetch(`/api/video/delete/${filename}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('视频已删除', 'success');
                loadVideoList(); // 重新加载视频列表
            } else {
                showNotification('删除失败: ' + data.message, 'error');
            }
        })
        .catch(error => {
            showNotification('删除出错: ' + error.message, 'error');
        });
    }
}

// 初始化UI交互
function initUIInteractions() {
    // 压缩视频选项显示/隐藏
    const compressVideo = document.getElementById('compress-video');
    const compressionOptions = document.getElementById('compression-options');
    
    if (compressVideo && compressionOptions) {
        compressVideo.addEventListener('change', function() {
            compressionOptions.classList.toggle('hidden', !this.checked);
        });
    }
    
    // 提取音频选项显示/隐藏
    const extractAudio = document.getElementById('extract-audio');
    const audioOptions = document.getElementById('audio-options');
    
    if (extractAudio && audioOptions) {
        extractAudio.addEventListener('change', function() {
            audioOptions.classList.toggle('hidden', !this.checked);
        });
    }
    
    // 水印选项显示/隐藏
    const addWatermark = document.getElementById('add-watermark');
    const watermarkOptions = document.getElementById('watermark-options');
    
    if (addWatermark && watermarkOptions) {
        addWatermark.addEventListener('change', function() {
            watermarkOptions.classList.toggle('hidden', !this.checked);
        });
    }
    
    // 返回选项按钮
    const backToOptions = document.getElementById('back-to-options');
    const processingOptions = document.getElementById('processing-options');
    const processingProgress = document.getElementById('processing-progress');
    
    if (backToOptions && processingOptions && processingProgress) {
        backToOptions.addEventListener('click', function() {
            // 返回到处理选项界面
            processingProgress.classList.add('hidden');
            processingOptions.classList.remove('hidden');
            
            // 重置进度条
            updateProgressBar(0);
            
            // 清除进度更新定时器
            if (progressInterval) {
                clearInterval(progressInterval);
                progressInterval = null;
            }
        });
    }
    
    // 选择水印图片
    const selectWatermark = document.getElementById('select-watermark');
    const watermarkFile = document.getElementById('watermark-file');
    const watermarkFilename = document.getElementById('watermark-filename');
    
    if (selectWatermark && watermarkFile) {
        selectWatermark.addEventListener('click', function() {
            watermarkFile.click();
        });
        
        watermarkFile.addEventListener('change', function() {
            if (this.files[0] && watermarkFilename) {
                watermarkFilename.textContent = this.files[0].name;
            }
        });
    }
    
    // 预设分辨率按钮
    const presetResolutionButtons = document.querySelectorAll('.preset-resolution');
    const widthInput = document.getElementById('width');
    const heightInput = document.getElementById('height');
    
    if (presetResolutionButtons.length > 0 && widthInput && heightInput) {
        presetResolutionButtons.forEach(button => {
            button.addEventListener('click', function() {
                const width = this.getAttribute('data-width');
                const height = this.getAttribute('data-height');
                
                widthInput.value = width;
                heightInput.value = height;
            });
        });
    }
    
    // 重新上传按钮
    const restartUpload = document.getElementById('restart-upload');
    const uploadArea = document.getElementById('upload-area');
    
    if (restartUpload && uploadArea && processingOptions) {
        restartUpload.addEventListener('click', function() {
            uploadArea.classList.remove('hidden');
            processingOptions.classList.add('hidden');
        });
    }
    
    // 处理视频按钮
    const processBtn = document.getElementById('process-btn');
    
    if (processBtn && processingProgress && processingOptions) {
        processBtn.addEventListener('click', function() {
            processVideo();
        });
    }
    
    // 取消处理按钮
    const cancelProcess = document.getElementById('cancel-process');
    
    if (cancelProcess) {
        cancelProcess.addEventListener('click', function() {
            cancelVideoProcessing();
        });
    }
    
    // 刷新视频列表按钮
    const refreshVideoList = document.getElementById('refresh-video-list');
    if (refreshVideoList) {
        refreshVideoList.addEventListener('click', function() {
            loadVideoList();
        });
    }
}

// 显示上传进度
function showUploadProgress(show) {
    console.log('显示/隐藏上传进度容器:', show);
    
    const progressContainer = document.getElementById('upload-progress-container');
    if (progressContainer) {
        if (show) {
            progressContainer.classList.remove('hidden');
            console.log('上传进度容器已显示');
        } else {
            progressContainer.classList.add('hidden');
            console.log('上传进度容器已隐藏');
        }
    } else {
        console.error('未找到上传进度容器元素: upload-progress-container');
    }
}

// 更新上传进度（支持消息和阶段信息）
function updateUploadProgress(percentage, message, phase) {
    console.log('更新上传进度:', percentage + '%', '消息:', message, '阶段:', phase);
    
    const progressBar = document.getElementById('upload-progress-bar');
    const progressText = document.getElementById('upload-percentage');
    const statusMessage = document.getElementById('upload-status-message');
    
    if (progressBar) {
        progressBar.style.width = percentage + '%';
        console.log('进度条更新成功，宽度:', percentage + '%');
    } else {
        console.error('未找到进度条元素: upload-progress-bar');
    }
    
    if (progressText) {
        progressText.textContent = Math.round(percentage) + '%';
        console.log('进度文本更新成功，内容:', Math.round(percentage) + '%');
    } else {
        console.error('未找到进度文本元素: upload-percentage');
    }
    
    // 更新状态消息
    if (message) {
        if (statusMessage) {
            statusMessage.textContent = message;
            console.log('状态消息更新成功:', message);
        } else {
            // 如果没有专门的状态消息元素，尝试创建一个
            const progressContainer = document.getElementById('upload-progress-container');
            if (progressContainer && !statusMessage) {
                const messageElement = document.createElement('div');
                messageElement.id = 'upload-status-message';
                messageElement.className = 'text-sm text-gray-600 mt-1 text-center';
                messageElement.textContent = message;
                progressContainer.appendChild(messageElement);
                console.log('创建并更新状态消息:', message);
            }
        }
    }
}

// 使用 XMLHttpRequest 实现带进度的文件上传（带 SSE 实时进度）
function uploadFileWithProgress(file, onProgress, onSuccess, onError) {
    console.log('开始创建上传请求...', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
    });
    
    // 生成会话ID
    const sessionId = 'upload_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    console.log('生成上传会话ID:', sessionId);
    
    // 创建SSE连接监听服务器端进度
    const eventSource = new EventSource(`/api/video/upload-progress/${sessionId}`);
    
    eventSource.onopen = function() {
        console.log('SSE连接已建立');
    };
    
    eventSource.onmessage = function(event) {
        try {
            const data = JSON.parse(event.data);
            console.log('收到SSE消息:', data);
            
            if (data.type === 'progress') {
                if (onProgress) {
                    onProgress(data.progress, data.message, data.phase);
                }
            } else if (data.type === 'complete') {
                console.log('服务器端处理完成:', data.result);
                eventSource.close();
                if (onSuccess) {
                    // 确保数据结构符合期望，包装成与直接返回相同的格式
                    const responseData = {
                        success: true,
                        file: data.result
                    };
                    onSuccess(responseData);
                }
            } else if (data.type === 'error') {
                console.error('服务器端处理错误:', data.message);
                eventSource.close();
                if (onError) {
                    onError(new Error(data.message));
                }
            }
        } catch (error) {
            console.error('解析SSE消息失败:', error);
        }
    };
    
    eventSource.onerror = function(error) {
        console.error('SSE连接错误:', error);
        eventSource.close();
    };
    
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('video', file);
    formData.append('sessionId', sessionId); // 添加会话ID
    
    // 上传进度监听（只反映浏览器到服务器的进度，约占总进度的30%）
    xhr.upload.addEventListener('progress', function(e) {
        console.log('浏览器上传进度事件:', {
            lengthComputable: e.lengthComputable,
            loaded: e.loaded,
            total: e.total,
            percentage: e.lengthComputable ? (e.loaded / e.total) * 100 : 0
        });
        
        if (e.lengthComputable) {
            // 浏览器到服务器的进度只占总进度的30%
            const browserProgress = (e.loaded / e.total) * 30;
            console.log('浏览器上传进度:', browserProgress.toFixed(2) + '%');
            if (onProgress) {
                onProgress(browserProgress, '正在上传到服务器...', 'browser_upload');
            }
        } else {
            console.warn('无法计算浏览器上传进度，lengthComputable为false');
        }
    });
    
    // 上传开始
    xhr.upload.addEventListener('loadstart', function() {
        console.log('浏览器上传开始');
        if (onProgress) {
            onProgress(0, '开始上传...', 'start'); // 确保开始时显示0%
        }
    });
    
    // 完成监听
    xhr.addEventListener('load', function() {
        console.log('浏览器上传请求完成，状态码:', xhr.status);
        
        if (xhr.status === 200) {
            try {
                const response = JSON.parse(xhr.responseText);
                console.log('浏览器上传响应解析成功:', response);
                
                // 注意：这里不调用 onSuccess，因为真正的成功会通过SSE通知
                // 浏览器上传完成只是第一阶段，还需要等待服务器处理
                if (onProgress && !response.success) {
                    // 如果上传失败，立即通知
                    eventSource.close();
                    if (onError) {
                        onError(new Error(response.message || '上传失败'));
                    }
                }
            } catch (error) {
                console.error('响应解析失败:', error.message);
                eventSource.close();
                if (onError) {
                    onError(new Error('响应解析失败: ' + error.message));
                }
            }
        } else {
            console.error('浏览器上传失败，状态码:', xhr.status, '响应:', xhr.responseText);
            eventSource.close();
            if (onError) {
                onError(new Error('上传失败，状态码: ' + xhr.status));
            }
        }
    });
    
    // 错误监听
    xhr.addEventListener('error', function() {
        console.error('浏览器上传发生网络错误');
        eventSource.close();
        if (onError) {
            onError(new Error('网络错误'));
        }
    });
    
    // 超时监听
    xhr.addEventListener('timeout', function() {
        console.error('浏览器上传超时');
        eventSource.close();
        if (onError) {
            onError(new Error('上传超时'));
        }
    });
    
    // 中断监听
    xhr.addEventListener('abort', function() {
        console.log('浏览器上传被中断');
        eventSource.close();
    });
    
    // 设置超时时间（10分钟）
    xhr.timeout = 10 * 60 * 1000;
    
    // 发送请求
    console.log('发送上传请求到:', '/api/video/upload');
    xhr.open('POST', '/api/video/upload');
    xhr.send(formData);
    
    // 返回一个包含xhr和eventSource的对象，以便可以取消上传
    return {
        xhr: xhr,
        eventSource: eventSource,
        abort: function() {
            xhr.abort();
            eventSource.close();
        }
    };
}

// 显示通知
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    if (notification) {
        // 设置通知类型样式
        notification.className = 'fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 translate-y-0 opacity-100';
        
        switch(type) {
            case 'success':
                notification.classList.add('bg-success', 'text-white');
                break;
            case 'error':
                notification.classList.add('bg-danger', 'text-white');
                break;
            case 'warning':
                notification.classList.add('bg-warning', 'text-white');
                break;
            default:
                notification.classList.add('bg-primary', 'text-white');
        }
        
        // 设置通知内容
        notification.textContent = message;
        
        // 显示通知
        notification.style.display = 'block';
        
        // 3秒后隐藏
        setTimeout(() => {
            notification.classList.add('translate-y-[-20px]', 'opacity-0');
            setTimeout(() => {
                notification.style.display = 'none';
            }, 300);
        }, 3000);
    }
}

// 存储当前上传的 xhr 对象，用于取消上传
let currentUploadXhr = null;

// 取消当前上传
function cancelCurrentUpload() {
    if (currentUploadXhr) {
        console.log('取消当前上传，currentUploadXhr 类型:', typeof currentUploadXhr);
        console.log('currentUploadXhr 内容:', currentUploadXhr);
        
        try {
            // 检查 currentUploadXhr 的类型并相应处理
            if (typeof currentUploadXhr === 'object') {
                // 检查是否有 abort 方法（优先使用）
                if (currentUploadXhr.abort && typeof currentUploadXhr.abort === 'function') {
                    console.log('调用 abort 方法');
                    currentUploadXhr.abort();
                } 
                // 检查是否有 cancel 方法
                else if (currentUploadXhr.cancel && typeof currentUploadXhr.cancel === 'function') {
                    console.log('调用 cancel 方法');
                    currentUploadXhr.cancel();
                }
                // 兼容旧版本结构（包含 xhr 属性）
                else if (currentUploadXhr.xhr && typeof currentUploadXhr.xhr.abort === 'function') {
                    console.log('调用 xhr.abort 方法');
                    currentUploadXhr.xhr.abort();
                    // 如果有 eventSource，也关闭它
                    if (currentUploadXhr.eventSource && typeof currentUploadXhr.eventSource.close === 'function') {
                        currentUploadXhr.eventSource.close();
                    }
                } else {
                    console.warn('无法取消上传：currentUploadXhr 对象没有可识别的取消方法');
                    console.log('currentUploadXhr 结构:', Object.keys(currentUploadXhr));
                }
            } else if (typeof currentUploadXhr === 'function') {
                // 如果是函数，尝试调用它
                console.log('调用 currentUploadXhr 函数');
                currentUploadXhr();
            } else {
                console.warn('无法取消上传：currentUploadXhr 不是有效的对象或函数，类型为:', typeof currentUploadXhr);
            }
        } catch (e) {
            console.error('取消上传时出错:', e);
        }
        
        currentUploadXhr = null;
        showUploadProgress(false);
        showNotification('上传已取消', 'info');
    } else {
        console.log('没有正在进行的上传任务');
    }
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 格式化时长
function formatDuration(seconds) {
    if (!seconds) return '00:00';
    
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    let result = '';
    
    if (hrs > 0) {
        result += `${hrs}:`;
    }
    
    result += `${mins < 10 ? '0' + mins : mins}:${secs < 10 ? '0' + secs : secs}`;
    
    return result;
}

// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
}

// 存储当前处理任务的ID
let currentProcessId = null;

// 处理视频
function processVideo() {
    // 检查是否已有处理任务在进行
    if (currentProcessId) {
        showNotification('已有处理任务正在进行，请等待完成或取消', 'warning');
        return;
    }
    
    try {
        // 获取处理选项
        const outputFormat = document.getElementById('output-format')?.value;
        if (!outputFormat) {
            throw new Error('请选择输出格式');
        }
        
        const width = document.getElementById('width')?.value;
        const height = document.getElementById('height')?.value;
        const keepAspectRatio = document.getElementById('keep-aspect-ratio')?.checked;
        const startTime = document.getElementById('start-time')?.value;
        const endTime = document.getElementById('end-time')?.value;
        const compressVideo = document.getElementById('compress-video')?.checked;
        const compressionLevel = compressVideo ? document.getElementById('compression-level')?.value : null;
        const extractAudio = document.getElementById('extract-audio')?.checked;
        const audioFormat = extractAudio ? document.getElementById('audio-format')?.value : null;
        const addWatermark = document.getElementById('add-watermark')?.checked;
        const watermarkFile = addWatermark ? document.getElementById('watermark-file')?.files[0] : null;
        
        // 验证必要的参数
        if (addWatermark && !watermarkFile) {
            throw new Error('请选择水印图片');
        }
        
        if (extractAudio && !audioFormat) {
            throw new Error('请选择音频格式');
        }
    
    // 获取当前选中的视频文件名
    const videoFilename = document.getElementById('current-video-filename')?.value;
    
    if (!videoFilename) {
        throw new Error('请先上传视频文件');
    }
    
    // 创建处理选项对象
    const processingOptions = {
        format: outputFormat,
        resize: (width && height) ? { width: parseInt(width), height: parseInt(height), keepAspectRatio } : null,
        crop: (startTime || endTime) ? { startTime: parseFloat(startTime) || 0, endTime: parseFloat(endTime) || null } : null,
        compress: compressVideo ? { crf: parseInt(compressionLevel) || 23 } : null,
        extractAudio: extractAudio,
        audioFormat: extractAudio ? audioFormat : null,
        watermark: addWatermark && watermarkFile ? { position: '10:10' } : null
    };
    
    // 准备请求数据
    const requestData = {
        filename: videoFilename,
        options: processingOptions
    };
    
    // 隐藏处理选项，显示处理进度
    const processingOptionsDiv = document.getElementById('processing-options');
    const processingProgress = document.getElementById('processing-progress');
    
    if (processingOptionsDiv && processingProgress) {
        processingOptionsDiv.classList.add('hidden');
        processingProgress.classList.remove('hidden');
    }
    
    // 更新处理日志
    updateProcessLog('开始处理视频...');
    
    // 发送处理请求
    fetch('/api/video/process', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // 保存处理ID
            currentProcessId = data.result.processId;
            updateProcessLog('视频处理已开始，处理ID: ' + currentProcessId);
            
            // 实际项目中应使用WebSocket或轮询获取实时进度
            simulateProgressUpdate();
        } else {
            updateProcessLog('处理失败: ' + data.message);
            showNotification('处理失败: ' + data.message, 'error');
            
            // 返回到处理选项界面
            const processingOptionsDiv = document.getElementById('processing-options');
            const processingProgress = document.getElementById('processing-progress');
            
            if (processingOptionsDiv && processingProgress) {
                processingProgress.classList.add('hidden');
                processingOptionsDiv.classList.remove('hidden');
            }
        }
    })
    .catch(error => {
        updateProcessLog('处理出错: ' + error.message);
        showNotification('处理出错: ' + error.message, 'error');
        
        // 返回到处理选项界面
        const processingOptionsDiv = document.getElementById('processing-options');
        const processingProgress = document.getElementById('processing-progress');
        
        if (processingOptionsDiv && processingProgress) {
            processingProgress.classList.add('hidden');
            processingOptionsDiv.classList.remove('hidden');
        }
    });
    } catch (error) {
        // 捕获参数验证等错误
        showNotification(error.message, 'error');
        console.error('处理视频参数错误:', error);
    }
}

// 取消视频处理
function cancelVideoProcessing() {
    // 检查是否有正在进行的处理
    if (!currentProcessId) {
        showNotification('没有正在进行的处理任务', 'warning');
        return;
    }
    
    // 更新处理日志
    updateProcessLog('正在取消处理...');
    
    // 禁用取消按钮，防止重复点击
    const cancelBtn = document.getElementById('cancel-process');
    if (cancelBtn) {
        cancelBtn.disabled = true;
        cancelBtn.classList.add('opacity-50');
    }
    
    // 发送取消请求
    fetch('/api/video/cancel-process', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ processId: currentProcessId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            updateProcessLog('处理已取消');
            showNotification('处理已取消', 'info');
            
            // 清除当前处理ID
            currentProcessId = null;
            
            // 返回到处理选项界面
            const processingOptions = document.getElementById('processing-options');
            const processingProgress = document.getElementById('processing-progress');
            
            if (processingOptions && processingProgress) {
                processingProgress.classList.add('hidden');
                processingOptions.classList.remove('hidden');
            }
            
            // 重置进度条
            updateProgressBar(0);
            
            // 清除进度更新定时器
            if (progressInterval) {
                clearInterval(progressInterval);
                progressInterval = null;
            }
        } else {
            updateProcessLog('取消失败: ' + data.message);
            showNotification('取消失败: ' + data.message, 'error');
        }
        
        // 重置取消按钮状态
        const cancelBtn = document.getElementById('cancel-process');
        if (cancelBtn) {
            cancelBtn.disabled = false;
            cancelBtn.classList.remove('opacity-50');
        }
    })
    .catch(error => {
        updateProcessLog('取消出错: ' + error.message);
        showNotification('取消出错: ' + error.message, 'error');
        
        // 重置取消按钮状态
        const cancelBtn = document.getElementById('cancel-process');
        if (cancelBtn) {
            cancelBtn.disabled = false;
            cancelBtn.classList.remove('opacity-50');
        }
    });
}

// 更新处理日志
function updateProcessLog(message) {
    const processLog = document.getElementById('process-log');
    if (processLog) {
        const logEntry = document.createElement('p');
        logEntry.textContent = message;
        processLog.appendChild(logEntry);
        processLog.scrollTop = processLog.scrollHeight; // 滚动到底部
    }
}

// 更新进度条
function updateProgressBar(percentage) {
    const progressBar = document.getElementById('progress-bar');
    const progressPercentage = document.getElementById('progress-percentage');
    
    if (progressBar) {
        progressBar.style.width = percentage + '%';
    }
    
    if (progressPercentage) {
        progressPercentage.textContent = percentage + '%';
    }
}

// 显示下载按钮
function showDownloadButton(result) {
    const downloadBtn = document.getElementById('download-btn');
    const audioDownloadBtn = document.getElementById('audio-download-btn') || createAudioDownloadButton();
    
    // 处理视频下载按钮
    if (downloadBtn && result.url) {
        downloadBtn.classList.remove('hidden');
        downloadBtn.textContent = '下载处理后的视频';
        
        // 移除可能存在的旧事件监听器
        const newBtn = downloadBtn.cloneNode(true);
        downloadBtn.parentNode.replaceChild(newBtn, downloadBtn);
        
        // 添加新的事件监听器，使用a标签的download属性触发下载
        newBtn.addEventListener('click', function() {
            const a = document.createElement('a');
            a.href = result.url;
            a.download = result.filename; // 使用返回的文件名
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    } else if (downloadBtn) {
        downloadBtn.classList.add('hidden');
    }
    
    // 处理音频下载按钮
    if (audioDownloadBtn && result.audioUrl) {
        audioDownloadBtn.classList.remove('hidden');
        
        // 移除可能存在的旧事件监听器
        const newAudioBtn = audioDownloadBtn.cloneNode(true);
        audioDownloadBtn.parentNode.replaceChild(newAudioBtn, audioDownloadBtn);
        
        // 添加新的事件监听器，使用a标签的download属性触发下载
        newAudioBtn.addEventListener('click', function() {
            const a = document.createElement('a');
            a.href = result.audioUrl;
            a.download = result.audioFilename; // 使用返回的音频文件名
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    } else if (audioDownloadBtn) {
        audioDownloadBtn.classList.add('hidden');
    }
}

// 创建音频下载按钮
function createAudioDownloadButton() {
    const downloadBtn = document.getElementById('download-btn');
    if (!downloadBtn) return null;
    
    const audioBtn = document.createElement('button');
    audioBtn.id = 'audio-download-btn';
    audioBtn.className = downloadBtn.className; // 复制下载按钮的样式
    audioBtn.textContent = '下载处理后的音频';
    audioBtn.classList.add('hidden');
    
    // 插入到下载按钮后面
    downloadBtn.parentNode.insertBefore(audioBtn, downloadBtn.nextSibling);
    return audioBtn;
}

// 模拟进度更新（实际应使用WebSocket或轮询API获取实时进度）
let progressInterval = null;

function simulateProgressUpdate() {
    // 清除可能存在的旧定时器
    if (progressInterval) {
        clearInterval(progressInterval);
    }
    
    let progress = 0;
    progressInterval = setInterval(() => {
        // 如果处理已被取消，停止更新
        if (!currentProcessId) {
            clearInterval(progressInterval);
            progressInterval = null;
            return;
        }
        
        progress += Math.random() * 10;
        if (progress >= 100) {
            progress = 100;
            clearInterval(progressInterval);
            progressInterval = null;
            
            // 处理完成后的操作
            updateProcessLog('处理完成！');
            showNotification('视频处理已完成', 'success');
            
            // 从服务器获取处理结果信息
            fetch(`/api/video/process-result/${currentProcessId}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success && data.result) {
                        // 传递整个结果对象，包含视频和音频URL
                        showDownloadButton(data.result);
                        
                        // 更新处理日志，显示可用的下载选项
                        let logMessage = '处理完成！';
                        if (data.result.url) {
                            logMessage += ' 视频可下载。';
                        }
                        if (data.result.audioUrl) {
                            logMessage += ' 音频可下载。';
                        }
                        updateProcessLog(logMessage);
                    } else {
                        console.error('获取处理结果失败:', data.message || '未知错误');
                        updateProcessLog('获取下载链接失败，请刷新页面重试');
                    }
                })
                .catch(error => {
                    console.error('获取处理结果错误:', error);
                    updateProcessLog('获取下载链接失败，请刷新页面重试');
                });
            
            // 清除当前处理ID
            currentProcessId = null;
        }
        
        updateProgressBar(Math.floor(progress));
        
        // 添加一些处理日志
        if (progress > 10 && progress < 15) {
            updateProcessLog('正在解析视频文件...');
        } else if (progress > 30 && progress < 35) {
            updateProcessLog('应用处理选项...');
        } else if (progress > 60 && progress < 65) {
            updateProcessLog('正在编码输出视频...');
        } else if (progress > 90 && progress < 95) {
            updateProcessLog('完成处理，准备输出文件...');
        }
    }, 500);
}