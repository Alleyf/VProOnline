/**
 * 优化的上传实现，优先使用服务器上传到 Blob Store
 * 用于解决 Vercel Serverless Functions 4.5MB 文件大小限制
 */

// 智能上传功能（优先使用服务器上传到 Blob Store）
async function uploadFileDirectToBlob(file, uploadToken, onProgress, onSuccess, onError) {
    try {
        console.log('开始智能上传:', {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            hasToken: !!uploadToken
        });
        
        if (onProgress) {
            onProgress(0, '准备上传...', 'preparing');
        }
        
        // 直接使用服务器上传（服务器将自动上传到 Blob Store）
        return await uploadFileToServer(file, uploadToken, onProgress, onSuccess, onError);
        
    } catch (error) {
        console.error('上传出错:', error);
        if (onError) {
            onError(error);
        }
    }
}

// 服务器上传方式（服务器会自动处理 Blob Store 上传）
async function uploadFileToServer(file, uploadToken, onProgress, onSuccess, onError) {
    const formData = new FormData();
    formData.append('video', file);
    formData.append('uploadToken', uploadToken); // 添加上传token
    
    // 生成唯一会话 ID
    const sessionId = 'upload_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    formData.append('sessionId', sessionId);
    
    if (onProgress) {
        onProgress(0, '开始上传...', 'uploading');
    }
    
    const xhr = new XMLHttpRequest();
    
    // 创建一个可取消的对象
    const uploadObject = {
        xhr: xhr,
        cancel: function() {
            xhr.abort();
            console.log('上传已取消');
        },
        abort: function() {
            xhr.abort();
            console.log('上传已中止');
        }
    };
    
    // 设置 SSE 连接来接收进度更新
    let eventSource = null;
    if (typeof EventSource !== 'undefined') {
        eventSource = new EventSource(`/api/video/upload-progress/${sessionId}`);
        uploadObject.eventSource = eventSource;
        
        eventSource.onmessage = function(event) {
            try {
                const data = JSON.parse(event.data);
                
                if (data.type === 'progress' && onProgress) {
                    onProgress(data.progress, data.message, data.phase);
                } else if (data.type === 'complete') {
                    if (onProgress) {
                        onProgress(100, '上传完成！', 'complete');
                    }
                    if (eventSource) {
                        eventSource.close();
                    }
                } else if (data.type === 'error') {
                    console.error('SSE 进度错误:', data.message);
                    if (eventSource) {
                        eventSource.close();
                    }
                }
            } catch (parseError) {
                console.error('解析 SSE 数据失败:', parseError);
            }
        };
        
        eventSource.onerror = function(error) {
            console.error('SSE 连接错误:', error);
            if (eventSource) {
                eventSource.close();
            }
        };
    }
    
    // 设置上传进度监听
    xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
            const percentComplete = Math.round((e.loaded / e.total) * 30); // 0-30% 为上传阶段
            onProgress(percentComplete, `上传中... ${percentComplete}%`, 'uploading');
        }
    });
    
    xhr.addEventListener('load', async () => {
        // 关闭SSE连接
        if (eventSource) {
            eventSource.close();
        }
        
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
                } else {
                    throw new Error(result.message || '上传失败');
                }
            } catch (parseError) {
                console.error('解析响应失败:', parseError);
                const error = new Error('解析服务器响应失败');
                if (onError) onError(error);
            }
        } else {
            const error = new Error(`服务器错误: ${xhr.status} ${xhr.statusText}`);
            if (onError) onError(error);
        }
    });
    
    xhr.addEventListener('error', () => {
        // 关闭SSE连接
        if (eventSource) {
            eventSource.close();
        }
        
        const error = new Error('网络错误');
        if (onError) onError(error);
    });
    
    xhr.addEventListener('timeout', () => {
        // 关闭SSE连接
        if (eventSource) {
            eventSource.close();
        }
        
        const error = new Error('上传超时');
        if (onError) onError(error);
    });
    
    // 设置超时时间（10分钟）
    xhr.timeout = 10 * 60 * 1000;
    
    xhr.open('POST', '/api/video/upload');
    // 设置上传token头
    if (uploadToken) {
        xhr.setRequestHeader('X-Upload-Token', uploadToken);
    }
    xhr.send(formData);
    
    // 返回可取消的对象
    return uploadObject;
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

// 为了兼容性，保持原有的函数名
function smartUploadFile(file, uploadToken, onProgress, onSuccess, onError) {
    return uploadFileDirectToBlob(file, uploadToken, onProgress, onSuccess, onError);
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