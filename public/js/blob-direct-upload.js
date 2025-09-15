/**
 * 优化的上传实现，优先使用服务器上传到 Blob Store
 * 用于解决 Vercel Serverless Functions 4.5MB 文件大小限制
 */

// 智能上传功能（优先使用服务器上传到 Blob Store）
async function uploadFileDirectToBlob(file, onProgress, onSuccess, onError) {
    try {
        console.log('开始智能上传:', {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type
        });
        
        if (onProgress) {
            onProgress(0, '准备上传...', 'preparing');
        }
        
        // 直接使用服务器上传（服务器将自动上传到 Blob Store）
        return await uploadFileToServer(file, onProgress, onSuccess, onError);
        
    } catch (error) {
        console.error('上传出错:', error);
        if (onError) {
            onError(error);
        }
    }
}

// 服务器上传方式（服务器会自动处理 Blob Store 上传）
async function uploadFileToServer(file, onProgress, onSuccess, onError) {
    const formData = new FormData();
    formData.append('video', file);
    
    // 生成唯一会话 ID
    const sessionId = 'upload_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    formData.append('sessionId', sessionId);
    
    if (onProgress) {
        onProgress(0, '开始上传...', 'uploading');
    }
    
    const xhr = new XMLHttpRequest();
    
    return new Promise((resolve, reject) => {
        // 设置上传进度监听
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable && onProgress) {
                const percentComplete = Math.round((e.loaded / e.total) * 30); // 0-30% 为上传阶段
                onProgress(percentComplete, `上传中... ${percentComplete}%`, 'uploading');
            }
        });
        
        // 设置 SSE 连接来接收进度更新
        if (typeof EventSource !== 'undefined') {
            const eventSource = new EventSource(`/api/video/upload-progress/${sessionId}`);
            
            eventSource.onmessage = function(event) {
                try {
                    const data = JSON.parse(event.data);
                    
                    if (data.type === 'progress' && onProgress) {
                        onProgress(data.progress, data.message, data.phase);
                    } else if (data.type === 'complete') {
                        if (onProgress) {
                            onProgress(100, '上传完成！', 'complete');
                        }
                        eventSource.close();
                    } else if (data.type === 'error') {
                        console.error('SSE 进度错误:', data.message);
                        eventSource.close();
                    }
                } catch (parseError) {
                    console.error('解析 SSE 数据失败:', parseError);
                }
            };
            
            eventSource.onerror = function(error) {
                console.error('SSE 连接错误:', error);
                eventSource.close();
            };
        }
        
        xhr.addEventListener('load', async () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const result = JSON.parse(xhr.responseText);
                    if (result.success) {
                        if (onProgress) {
                            onProgress(100, '上传完成！', 'complete');
                        }
                        if (onSuccess) {
                            onSuccess(result);
                        }
                        resolve(result);
                    } else {
                        throw new Error(result.message || '上传失败');
                    }
                } catch (parseError) {
                    console.error('解析响应失败:', parseError);
                    const error = new Error('解析服务器响应失败');
                    if (onError) onError(error);
                    reject(error);
                }
            } else {
                const error = new Error(`服务器错误: ${xhr.status} ${xhr.statusText}`);
                if (onError) onError(error);
                reject(error);
            }
        });
        
        xhr.addEventListener('error', () => {
            const error = new Error('网络错误');
            if (onError) onError(error);
            reject(error);
        });
        
        xhr.addEventListener('timeout', () => {
            const error = new Error('上传超时');
            if (onError) onError(error);
            reject(error);
        });
        
        // 设置超时时间（10分钟）
        xhr.timeout = 10 * 60 * 1000;
        
        xhr.open('POST', '/api/video/upload');
        xhr.send(formData);
    });
}

// 获取上传限制信息
async function getUploadLimits() {
    try {
        const response = await fetch('/api/video/upload-limits');
        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.error('获取上传限制失败:', error);
    }
    
    // 默认限制
    return {
        maxFileSize: 2 * 1024 * 1024 * 1024, // 2GB
        serverlessLimit: 4.5 * 1024 * 1024, // 4.5MB
        useDirectUpload: true
    };
}

// 智能选择上传方式
async function smartUploadFile(file, onProgress, onSuccess, onError) {
    const limits = await getUploadLimits();
    
    console.log('文件大小:', formatFileSize(file.size));
    console.log('服务器限制:', formatFileSize(limits.serverlessLimit));
    
    // 如果文件小于 4.5MB 且不强制使用直接上传，使用传统上传
    if (file.size <= limits.serverlessLimit && !limits.useDirectUpload) {
        console.log('使用传统服务器上传方式');
        return uploadFileWithProgress(file, onProgress, onSuccess, onError);
    } else {
        console.log('使用直接Blob Store上传方式');
        return uploadFileDirectToBlob(file, onProgress, onSuccess, onError);
    }
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 导出函数（如果在模块环境中）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        uploadFileDirectToBlob,
        getUploadLimits,
        smartUploadFile
    };
}