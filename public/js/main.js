// MediaBunny - 主JavaScript文件

document.addEventListener('DOMContentLoaded', function() {
    // 初始化应用
    initApp();
});

// 初始化应用
function initApp() {
    // 初始化上传功能
    initUpload();
    
    // 初始化视频列表
    loadVideoList();
    
    // 初始化UI交互
    initUIInteractions();
    
    // 初始化首页按钮
    initHomePageButtons();
}

// 初始化首页按钮
function initHomePageButtons() {
    // 立即开始按钮
    const getStartedBtn = document.getElementById('get-started-btn');
    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', function() {
            // 滚动到上传区域
            const uploadSection = document.getElementById('upload-section');
            if (uploadSection) {
                uploadSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
    
    // 观看演示按钮
    const demoBtn = document.querySelector('button:has(.fa-play-circle)');
    if (demoBtn) {
        demoBtn.addEventListener('click', function() {
            // 打开演示视频模态框
            const demoModal = document.getElementById('demo-modal');
            if (demoModal) {
                demoModal.classList.remove('hidden');
            } else {
                // 如果模态框不存在，创建一个
                createDemoModal();
            }
        });
    }
}

// 创建演示视频模态框
function createDemoModal() {
    // 创建模态框容器
    const modal = document.createElement('div');
    modal.id = 'demo-modal';
    modal.className = 'fixed inset-0 flex items-center justify-center z-50 bg-black/50';
    
    // 创建模态框内容
    const modalContent = document.createElement('div');
    modalContent.className = 'bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 overflow-hidden';
    
    // 创建模态框头部
    const modalHeader = document.createElement('div');
    modalHeader.className = 'flex justify-between items-center p-4 border-b';
    
    const modalTitle = document.createElement('h3');
    modalTitle.className = 'text-lg font-semibold';
    modalTitle.textContent = '产品演示视频';
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'text-gray-500 hover:text-gray-700';
    closeBtn.innerHTML = '<i class="fa fa-times"></i>';
    closeBtn.addEventListener('click', function() {
        modal.classList.add('hidden');
    });
    
    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(closeBtn);
    
    // 创建视频容器
    const videoContainer = document.createElement('div');
    videoContainer.className = 'p-4';
    
    const video = document.createElement('video');
    video.className = 'w-full aspect-video';
    video.controls = true;
    video.src = 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4'; // 示例视频URL
    video.poster = 'https://picsum.photos/id/96/800/500'; // 示例封面图
    
    videoContainer.appendChild(video);
    
    // 组装模态框
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(videoContainer);
    modal.appendChild(modalContent);
    
    // 添加点击外部关闭功能
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });
    
    // 添加到页面
    document.body.appendChild(modal);
}

// 初始化上传功能
function initUpload() {
    const uploadForm = document.getElementById('upload-form');
    const fileInput = document.getElementById('file-input');
    const selectFileBtn = document.getElementById('select-file-btn');
    const dropArea = document.getElementById('drop-area');
    
    // 点击选择文件按钮时触发文件输入元素点击
    if (selectFileBtn && fileInput) {
        selectFileBtn.addEventListener('click', function() {
            fileInput.click();
        });
    }
    
    // 文件选择变化时处理上传
    if (fileInput) {
        fileInput.addEventListener('change', function() {
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
            
            const formData = new FormData();
            const file = fileInput.files[0];
            
            if (!file) {
                showNotification('请选择要上传的视频文件', 'error');
                return;
            }
            
            formData.append('video', file);
            
            // 显示上传进度
            showUploadProgress(true);
            
            // 发送上传请求
            fetch('/api/video/upload', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                showUploadProgress(false);
                
                if (data.success) {
                    showNotification('视频上传成功', 'success');
                    loadVideoList(); // 重新加载视频列表
                } else {
                    showNotification('上传失败: ' + data.message, 'error');
                }
            })
            .catch(error => {
                showUploadProgress(false);
                showNotification('上传出错: ' + error.message, 'error');
            });
        });
    }
}

// 处理文件上传
function handleFileUpload(file) {
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
    const uploadProgressContainer = document.getElementById('upload-progress-container');
    
    if (uploadFilename) {
        uploadFilename.textContent = file.name;
    }
    
    if (uploadProgressContainer) {
        uploadProgressContainer.classList.remove('hidden');
    }
    
    // 创建FormData对象
    const formData = new FormData();
    formData.append('video', file);
    
    // 显示上传进度
    showUploadProgress(true);
    
    // 发送上传请求
    fetch('/api/video/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        showUploadProgress(false);
        
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
                    videoPreview.src = data.file.url;
                    videoPreview.load();
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
    })
    .catch(error => {
        showUploadProgress(false);
        showNotification('上传出错: ' + error.message, 'error');
    });
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
    const processingOptions = document.getElementById('processing-options');
    
    if (restartUpload && uploadArea && processingOptions) {
        restartUpload.addEventListener('click', function() {
            uploadArea.classList.remove('hidden');
            processingOptions.classList.add('hidden');
        });
    }
    
    // 处理视频按钮
    const processBtn = document.getElementById('process-btn');
    const processingProgress = document.getElementById('processing-progress');
    
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
}

// 显示上传进度
function showUploadProgress(show) {
    const progressBar = document.getElementById('upload-progress');
    if (progressBar) {
        progressBar.style.display = show ? 'block' : 'none';
    }
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