const router = require('express').Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');
const videoService = require('../services/videoService');
const blobService = require('../services/blobService');
const config = require('../config');

// 配置Multer上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    videoService.ensureDirectoryExistence(config.uploadDir);
    cb(null, config.uploadDir);
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  }
});

// 限制文件类型和大小
const fileFilter = (req, file, cb) => {
  // 检查是否为视频文件
  if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('只允许上传视频文件'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: config.maxFileSize // 最大文件大小
  },
  fileFilter: fileFilter
});

// 存储上传会话信息
const uploadSessions = new Map();

// 存储有效的上传token
const validUploadTokens = new Map();

// 生成上传验证token
function generateUploadToken() {
  const token = uuidv4();
  const expiryTime = Date.now() + config.upload.tokenExpiryTime;
  
  validUploadTokens.set(token, {
    createdAt: Date.now(),
    expiryTime: expiryTime,
    used: false
  });
  
  // 定期清理过期token
  setTimeout(() => {
    validUploadTokens.delete(token);
  }, config.upload.tokenExpiryTime);
  
  return { token, expiryTime };
}

// 验证上传token的中间件
function validateUploadToken(req, res, next) {
  // 如果禁用了验证，直接通过
  if (!config.upload.requireAuth) {
    return next();
  }
  
  const authToken = req.headers['x-upload-token'] || req.body.uploadToken || req.query.uploadToken;
  
  if (!authToken) {
    return res.status(401).json({
      success: false,
      message: '缺少上传验证token',
      code: 'MISSING_UPLOAD_TOKEN'
    });
  }
  
  const tokenInfo = validUploadTokens.get(authToken);
  
  if (!tokenInfo) {
    return res.status(401).json({
      success: false,
      message: '无效的上传token',
      code: 'INVALID_UPLOAD_TOKEN'
    });
  }
  
  if (Date.now() > tokenInfo.expiryTime) {
    validUploadTokens.delete(authToken);
    return res.status(401).json({
      success: false,
      message: '上传token已过期',
      code: 'TOKEN_EXPIRED'
    });
  }
  
  if (tokenInfo.used) {
    return res.status(401).json({
      success: false,
      message: '上传token已使用',
      code: 'TOKEN_ALREADY_USED'
    });
  }
  
  // 标记token为已使用（一次性token）
  tokenInfo.used = true;
  
  next();
}

// 获取上传验证token
router.post('/auth/upload-token', (req, res) => {
  try {
    const { authKey } = req.body;
    
    // 验证管理员身份（使用环境变量中的秘钥）
    if (authKey !== config.upload.authToken) {
      return res.status(403).json({
        success: false,
        message: '身份验证失败，无权获取上传token',
        code: 'INVALID_AUTH_KEY'
      });
    }
    
    // 限制频繁请求（简单的频率限制）
    const clientIp = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const rateLimitKey = `rate_limit_${clientIp}`;
    
    // 存储每个IP的请求记录
    if (!router.rateLimitStore) {
      router.rateLimitStore = new Map();
    }
    
    const requests = router.rateLimitStore.get(rateLimitKey) || [];
    const recentRequests = requests.filter(time => now - time < 60000); // 1分钟内的请求
    
    if (recentRequests.length >= 10) { // 1分钟最多10次请求
      return res.status(429).json({
        success: false,
        message: '请求过于频繁，请稍后再试',
        code: 'RATE_LIMITED'
      });
    }
    
    recentRequests.push(now);
    router.rateLimitStore.set(rateLimitKey, recentRequests);
    
    // 生成上传token
    const tokenData = generateUploadToken();
    
    console.log(`为IP ${clientIp} 生成上传token: ${tokenData.token}`);
    
    res.json({
      success: true,
      token: tokenData.token,
      expiryTime: tokenData.expiryTime,
      validFor: Math.floor((tokenData.expiryTime - Date.now()) / 1000) + '秒',
      message: '上传token获取成功'
    });
  } catch (error) {
    console.error('获取上传token错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误: ' + error.message
    });
  }
});

// 验证token有效性的API
router.post('/auth/verify-token', (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: '缺少token参数'
      });
    }
    
    const tokenInfo = validUploadTokens.get(token);
    
    if (!tokenInfo) {
      return res.json({
        success: false,
        valid: false,
        message: 'Token不存在'
      });
    }
    
    if (Date.now() > tokenInfo.expiryTime) {
      validUploadTokens.delete(token);
      return res.json({
        success: true,
        valid: false,
        message: 'Token已过期'
      });
    }
    
    if (tokenInfo.used) {
      return res.json({
        success: true,
        valid: false,
        message: 'Token已使用'
      });
    }
    
    const remainingTime = Math.floor((tokenInfo.expiryTime - Date.now()) / 1000);
    
    res.json({
      success: true,
      valid: true,
      remainingTime: remainingTime + '秒',
      message: 'Token有效'
    });
  } catch (error) {
    console.error('验证token错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误: ' + error.message
    });
  }
});

// 上传进度事件流
router.get('/upload-progress/:sessionId', (req, res) => {
  const sessionId = req.params.sessionId;
  
  // 设置 SSE 头
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });
  
  // 发送初始消息
  res.write(`data: ${JSON.stringify({ type: 'connected', sessionId })}\n\n`);
  
  // 保存连接以便后续发送进度更新
  if (!uploadSessions.has(sessionId)) {
    uploadSessions.set(sessionId, { connections: [] });
  }
  uploadSessions.get(sessionId).connections.push(res);
  
  // 客户端断开连接时清理
  req.on('close', () => {
    const session = uploadSessions.get(sessionId);
    if (session) {
      session.connections = session.connections.filter(conn => conn !== res);
      if (session.connections.length === 0) {
        uploadSessions.delete(sessionId);
      }
    }
  });
});

// 发送进度更新
function sendProgressUpdate(sessionId, data) {
  const session = uploadSessions.get(sessionId);
  if (session) {
    const message = `data: ${JSON.stringify(data)}\n\n`;
    session.connections.forEach(res => {
      try {
        res.write(message);
      } catch (error) {
        console.error('发送进度更新失败:', error);
      }
    });
  }
}

// 上传视频（分阶段处理）
router.post('/upload', validateUploadToken, upload.single('video'), async (req, res) => {
  const sessionId = req.body.sessionId || uuidv4();
  
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '未上传视频文件'
      });
    }
    
    // 第一阶段：文件已上传到服务器 (30%)
    sendProgressUpdate(sessionId, {
      type: 'progress',
      phase: 'server_upload',
      progress: 30,
      message: '文件已上传到服务器，正在分析视频信息...'
    });
    
    // 获取视频信息
    const videoInfo = await videoService.getVideoInfo(req.file.path);
    
    // 解决中文文件名编码问题
    const originalname = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
    const name = path.basename(originalname, path.extname(originalname));
    
    let result = {
      filename: req.file.filename,
      originalname: originalname,
      name: name,
      size: req.file.size,
      path: req.file.path,
      videoInfo: videoInfo,
      storage: 'local',
      sessionId: sessionId
    };
    
    // 第二阶段：视频信息分析完成 (50%)
    sendProgressUpdate(sessionId, {
      type: 'progress',
      phase: 'video_analysis',
      progress: 50,
      message: '视频分析完成，准备上传到云存储...'
    });
    
    // 如果启用了 Blob 存储，上传到 Blob Store
    if (blobService.isBlobStorageAvailable()) {
      try {
        console.log('正在上传原始视频到 Blob Store...');
        
        // 第三阶段：开始上传到 Blob Store (60%)
        sendProgressUpdate(sessionId, {
          type: 'progress',
          phase: 'blob_upload_start',
          progress: 60,
          message: '正在上传到云存储...'
        });
        
        // 使用带进度回调的上传函数
        const blobResult = await blobService.uploadRawVideo(
          req.file.path, 
          req.file.filename,
          // 进度回调（从60%到90%）
          (blobProgress) => {
            // 确保进度值有效
            const validProgress = Math.max(0, Math.min(100, blobProgress || 0));
            const adjustedProgress = 60 + (validProgress * 0.3); // 60% + (blob进度 * 30%)
            console.log(`Blob上传进度: ${validProgress}%, 调整后总进度: ${adjustedProgress.toFixed(1)}%`);
            sendProgressUpdate(sessionId, {
              type: 'progress',
              phase: 'blob_uploading',
              progress: Math.round(adjustedProgress),
              message: `云存储上传中... ${Math.round(validProgress)}%`
            });
          }
        );
        
        result.url = blobResult.url;
        result.blobUrl = blobResult.url;
        result.storage = 'blob';
        
        // 第四阶段：Blob 上传完成 (90%)
        sendProgressUpdate(sessionId, {
          type: 'progress',
          phase: 'blob_upload_complete',
          progress: 90,
          message: '云存储上传完成，正在清理临时文件...'
        });
        
        // 上传成功后清理本地文件
        if (config.blob.cleanupLocal) {
          console.log(`清理配置启用，开始清理本地文件: ${req.file.path}`);
          try {
            await blobService.cleanupLocalFile(req.file.path);
            console.log(`原始上传文件已清理: ${req.file.path}`);
          } catch (cleanupError) {
            console.error(`清理原始上传文件失败: ${req.file.path}`, cleanupError);
          }
        } else {
          console.log(`清理配置禁用，保留本地文件: ${req.file.path}`);
        }
        
        console.log('原始视频已成功上传到 Blob Store:', blobResult.url);
      } catch (blobError) {
        console.error('上传到 Blob Store 失败，使用本地存储:', blobError);
        
        sendProgressUpdate(sessionId, {
          type: 'progress',
          phase: 'blob_upload_error',
          progress: 80,
          message: '云存储上传失败，回退到本地存储...'
        });
        
        // 如果 Blob 上传失败，回退到本地存储
        result.url = `${config.publicUrl}/uploads/${req.file.filename}`;
        result.storage = 'local';
        result.error = 'Blob upload failed: ' + blobError.message;
      }
    } else {
      // 使用本地存储
      result.url = `${config.publicUrl}/uploads/${req.file.filename}`;
      
      sendProgressUpdate(sessionId, {
        type: 'progress',
        phase: 'local_storage',
        progress: 90,
        message: '使用本地存储，准备完成...'
      });
    }
    
    // 最终阶段：完成 (100%)
    sendProgressUpdate(sessionId, {
      type: 'complete',
      phase: 'complete',
      progress: 100,
      message: '上传完成！',
      result: result
    });
    
    res.json({
      success: true,
      file: result,
      sessionId: sessionId
    });
    
    // 延迟清理会话信息
    setTimeout(() => {
      uploadSessions.delete(sessionId);
    }, 5000);
    
  } catch (error) {
    console.error('视频上传错误:', error);
    
    sendProgressUpdate(sessionId, {
      type: 'error',
      message: '上传失败: ' + error.message
    });
    
    res.status(500).json({
      success: false,
      message: '视频上传失败: ' + error.message,
      sessionId: sessionId
    });
  }
});

// 处理视频
router.post('/process', async (req, res) => {
  try {
    const { filename, options, sessionId } = req.body;
    
    if (!filename) {
      return res.status(400).json({
        success: false,
        message: '缺少视频文件名'
      });
    }
    
    // 生成会话ID（如果没有提供）
    const processSessionId = sessionId || `process_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 发送处理开始状态
    sendProgressUpdate(processSessionId, {
      type: 'progress',
      phase: 'process_start',
      progress: 0,
      message: '开始视频处理...'
    });

    let inputPath = path.join(config.uploadDir, filename);
    let needsCleanup = false;
    
    // 检查本地文件是否存在
    if (!fs.existsSync(inputPath)) {
      console.log(`本地文件不存在: ${inputPath}，尝试从Blob Store下载...`);
      
      sendProgressUpdate(processSessionId, {
        type: 'progress',
        phase: 'downloading_source',
        progress: 5,
        message: '正在下载源文件...'
      });
      
      // 如果本地文件不存在且启用了Blob存储，尝试从Blob Store下载
      if (blobService.isBlobStorageAvailable()) {
        try {
          // 查找Blob Store中的文件
          const uploadBlobs = await blobService.listBlobFiles(config.blob.uploadPrefix);
          const targetBlob = uploadBlobs.find(blob => blob.pathname.endsWith(filename));
          
          if (targetBlob) {
            console.log(`找到Blob文件: ${targetBlob.url}`);
            
            // 下载文件到临时位置
            const tempPath = path.join(config.uploadDir, `temp_${filename}`);
            await downloadBlobToLocal(targetBlob.url, tempPath);
            
            inputPath = tempPath;
            needsCleanup = true;
            console.log(`文件已下载到: ${tempPath}`);
            
            sendProgressUpdate(processSessionId, {
              type: 'progress',
              phase: 'download_complete',
              progress: 15,
              message: '源文件下载完成'
            });
          } else {
            sendProgressUpdate(processSessionId, {
              type: 'error',
              message: '在Blob Store中找不到视频文件'
            });
            return res.status(404).json({
              success: false,
              message: '在Blob Store中找不到视频文件'
            });
          }
        } catch (blobError) {
          console.error('从Blob Store下载文件失败:', blobError);
          sendProgressUpdate(processSessionId, {
            type: 'error',
            message: '从云存储下载文件失败: ' + blobError.message
          });
          return res.status(500).json({
            success: false,
            message: '从云存储下载文件失败: ' + blobError.message
          });
        }
      } else {
        sendProgressUpdate(processSessionId, {
          type: 'error',
          message: '视频文件不存在且未启用云存储'
        });
        return res.status(404).json({
          success: false,
          message: '视频文件不存在且未启用云存储'
        });
      }
    } else {
      sendProgressUpdate(processSessionId, {
        type: 'progress',
        phase: 'source_ready',
        progress: 15,
        message: '源文件准备就绪'
      });
    }
    
    console.log(`开始处理视频: ${inputPath}`);
    
    sendProgressUpdate(processSessionId, {
      type: 'progress',
      phase: 'processing',
      progress: 20,
      message: '正在处理视频...'
    });
    
    // 处理视频
    const result = await videoService.processVideo(
      path.basename(inputPath), // 只传递文件名
      options || {},
      (progress) => {
        // 将FFmpeg进度映射到20%-80%
        const adjustedProgress = 20 + (progress * 0.6); // 20% + (处理进度 * 60%)
        console.log(`FFmpeg处理进度: ${progress}%, 调整后总进度: ${adjustedProgress.toFixed(1)}%`);
        
        sendProgressUpdate(processSessionId, {
          type: 'progress',
          phase: 'processing',
          progress: Math.round(adjustedProgress),
          message: `视频处理中... ${Math.round(progress)}%`
        });
      }
    );
    
    sendProgressUpdate(processSessionId, {
      type: 'progress',
      phase: 'process_complete',
      progress: 90,
      message: '视频处理完成，正在清理临时文件...'
    });
    
    // 如果使用了临时文件，清理它
    if (needsCleanup && fs.existsSync(inputPath)) {
      try {
        fs.unlinkSync(inputPath);
        console.log(`临时文件已清理: ${inputPath}`);
      } catch (cleanupError) {
        console.error('清理临时文件失败:', cleanupError);
        // 不影响主要流程，只记录错误
      }
    }
    
    sendProgressUpdate(processSessionId, {
      type: 'complete',
      phase: 'complete',
      progress: 100,
      message: '视频处理完成！',
      result: result
    });
    
    res.json({
      success: true,
      result: result,
      sessionId: processSessionId
    });
    
    // 延迟清理会话信息
    setTimeout(() => {
      uploadSessions.delete(processSessionId);
    }, 5000);
    
  } catch (error) {
    console.error('视频处理错误:', error);
    
    if (req.body.sessionId) {
      sendProgressUpdate(req.body.sessionId, {
        type: 'error',
        message: '视频处理失败: ' + error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: '视频处理失败: ' + error.message
    });
  }
});

// 从Blob Store下载文件到本地的辅助函数
async function downloadBlobToLocal(blobUrl, localPath) {
  const fetch = require('node-fetch');
  
  console.log(`开始下载: ${blobUrl} -> ${localPath}`);
  
  const response = await fetch(blobUrl);
  if (!response.ok) {
    throw new Error(`下载失败，状态码: ${response.status}`);
  }
  
  // 确保目录存在
  const dir = path.dirname(localPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // 写入文件
  const buffer = await response.buffer();
  fs.writeFileSync(localPath, buffer);
  
  console.log(`文件下载完成: ${localPath}, 大小: ${buffer.length} bytes`);
}

// 下载视频
router.get('/download/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(config.processedDir, filename);
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }
    
    // 设置下载头
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    // 发送文件
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('文件下载错误:', error);
    res.status(500).json({
      success: false,
      message: '文件下载失败: ' + error.message
    });
  }
});

// 取消视频处理
router.post('/cancel-process', (req, res) => {
  try {
    const { processId } = req.body;
    
    if (!processId) {
      return res.status(400).json({
        success: false,
        message: '缺少处理ID'
      });
    }
    
    // 调用服务取消处理
    const result = videoService.cancelProcessing(processId);
    
    res.json({
      success: true,
      message: '处理已取消',
      result: result
    });
  } catch (error) {
    console.error('取消处理错误:', error);
    res.status(500).json({
      success: false,
      message: '取消处理失败: ' + error.message
    });
  }
});

// 获取处理结果信息
router.get('/process-result/:processId', async (req, res) => {
  try {
    const processId = req.params.processId;
    
    if (!processId) {
      return res.status(400).json({
        success: false,
        message: '缺少处理ID'
      });
    }
    
    let videoFile = null;
    let audioFile = null;
    let videoUrl = null;
    let audioUrl = null;
    let storage = 'local';
    
    // 首先检查本地文件
    try {
      const files = fs.readdirSync(config.processedDir);
      
      // 查找视频文件（不以_audio结尾的文件）
      videoFile = files.find(file => file.startsWith(processId) && !file.endsWith('_audio.mp3'));
      
      // 查找音频文件（以_audio结尾的文件）
      audioFile = files.find(file => file.startsWith(processId) && file.endsWith('_audio.mp3'));
      
      if (videoFile) {
        videoUrl = `${config.publicUrl}/processed/${videoFile}`;
      }
      if (audioFile) {
        audioUrl = `${config.publicUrl}/processed/${audioFile}`;
      }
    } catch (localError) {
      console.log('读取本地处理目录失败:', localError.message);
    }
    
    // 如果本地没有找到文件，且启用了Blob存储，尝试从Blob Store查找
    if (!videoFile && !audioFile && blobService.isBlobStorageAvailable()) {
      try {
        console.log(`在Blob Store中查找处理结果: ${processId}`);
        const processedBlobs = await blobService.listBlobFiles(config.blob.processedPrefix);
        
        // 查找视频文件
        const videoBlobFile = processedBlobs.find(blob => {
          const filename = path.basename(blob.pathname);
          return filename.startsWith(processId) && !filename.endsWith('_audio.mp3');
        });
        
        // 查找音频文件
        const audioBlobFile = processedBlobs.find(blob => {
          const filename = path.basename(blob.pathname);
          return filename.startsWith(processId) && filename.endsWith('_audio.mp3');
        });
        
        if (videoBlobFile) {
          videoFile = path.basename(videoBlobFile.pathname);
          videoUrl = videoBlobFile.url;
          storage = 'blob';
        }
        
        if (audioBlobFile) {
          audioFile = path.basename(audioBlobFile.pathname);
          audioUrl = audioBlobFile.url;
          storage = 'blob';
        }
        
        console.log(`Blob Store查找结果: video=${!!videoBlobFile}, audio=${!!audioBlobFile}`);
      } catch (blobError) {
        console.error('从Blob Store查找处理结果失败:', blobError);
      }
    }
    
    if (!videoFile && !audioFile) {
      return res.status(404).json({
        success: false,
        message: '找不到处理结果文件'
      });
    }
    
    // 返回处理结果信息
    res.json({
      success: true,
      result: {
        processId: processId,
        filename: videoFile || null,
        url: videoUrl,
        audioFilename: audioFile || null,
        audioUrl: audioUrl,
        storage: storage
      }
    });
  } catch (error) {
    console.error('获取处理结果错误:', error);
    res.status(500).json({
      success: false,
      message: '获取处理结果失败: ' + error.message
    });
  }
});

// 获取视频列表
router.get('/list', async (req, res) => {
  try {
    let videos = [];
    
    // 如果启用了 Blob 存储，从 Blob Store 获取列表
    if (blobService.isBlobStorageAvailable()) {
      try {
        console.log('从 Blob Store 获取视频列表...');
        const uploadBlobs = await blobService.listBlobFiles(config.blob.uploadPrefix);
        
        // 获取每个视频的详细信息
        const videoPromises = uploadBlobs.map(async (blob) => {
          const filename = path.basename(blob.pathname);
          const id = path.basename(blob.pathname, path.extname(blob.pathname));
          
          // 尝试获取视频信息（如果可能的话）
          let videoInfo = {};
          try {
            // 如果是本地文件，可以获取详细信息
            // 但 Blob Store 中的文件需要特殊处理
            // 这里我们只返回基本的 Blob 信息
            videoInfo = {
              duration: 0, // 无法直接从 Blob 信息获取时长
              width: 0,
              height: 0,
              format: path.extname(filename).substring(1)
            };
          } catch (infoError) {
            console.error(`获取视频信息失败: ${filename}`, infoError);
          }
          
          return {
            id: id,
            filename: filename,
            name: id,
            url: blob.url,
            blobUrl: blob.url,
            size: blob.size,
            uploadDate: blob.uploadedAt,
            duration: videoInfo.duration,
            width: videoInfo.width,
            height: videoInfo.height,
            format: videoInfo.format,
            storage: 'blob'
          };
        });
        
        videos = await Promise.all(videoPromises);
        console.log(`从 Blob Store 获取到 ${videos.length} 个视频`);
      } catch (blobError) {
        console.error('从 Blob Store 获取列表失败:', blobError);
        // 如果 Blob 获取失败，回退到本地存储
      }
    }
    
    // 如果没有启用 Blob 存储或获取失败，从本地获取
    if (videos.length === 0) {
      // 读取上传目录中的所有文件
      const files = fs.readdirSync(config.uploadDir);
      
      // 过滤出视频文件并获取信息
      const videoPromises = files
        .filter(file => {
          const ext = path.extname(file).toLowerCase();
          return config.supportedVideoFormats.includes(ext.substring(1));
        })
        .map(async (file) => {
          const filePath = path.join(config.uploadDir, file);
          const stats = fs.statSync(filePath);
          
          try {
            // 获取视频信息
            const videoInfo = await videoService.getVideoInfo(filePath);
            
            return {
              id: path.basename(file, path.extname(file)),
              filename: file,
              name: path.basename(file, path.extname(file)),
              path: filePath,
              url: `${config.publicUrl}/uploads/${file}`,
              size: stats.size,
              uploadDate: stats.ctime,
              duration: videoInfo.duration,
              width: videoInfo.width,
              height: videoInfo.height,
              format: videoInfo.format,
              storage: 'local'
            };
          } catch (error) {
            console.error(`获取视频信息失败: ${file}`, error);
            
            // 返回基本信息
            return {
              id: path.basename(file, path.extname(file)),
              filename: file,
              name: path.basename(file, path.extname(file)),
              path: filePath,
              url: `${config.publicUrl}/uploads/${file}`,
              size: stats.size,
              uploadDate: stats.ctime,
              storage: 'local'
            };
          }
        });
      
      // 等待所有视频信息获取完成
      videos = await Promise.all(videoPromises);
    }
    
    res.json({
      success: true,
      videos: videos,
      storage: blobService.isBlobStorageAvailable() ? 'blob' : 'local'
    });
  } catch (error) {
    console.error('获取视频列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取视频列表失败: ' + error.message
    });
  }
});

// 删除视频（增强版，支持删除上传的视频和处理后的视频）
router.delete('/delete/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    let deletedFromBlob = false;
    let deletedFromLocal = false;
    let deletedFromProcessed = false;
    
    console.log(`开始删除视频文件: ${filename}`);
    
    // 1. 尝试从上传目录的 Blob Store 删除
    if (blobService.isBlobStorageAvailable()) {
      try {
        // 先尝试从上传视频列表中获取实际的 Blob URL
        const uploadBlobs = await blobService.listBlobFiles(config.blob.uploadPrefix);
        const targetBlob = uploadBlobs.find(blob => blob.pathname.endsWith(filename));
        
        if (targetBlob) {
          // 使用从列表中获取的 URL
          await blobService.deleteFromBlob(targetBlob.url);
          deletedFromBlob = true;
          console.log('已从 Blob Store 删除上传文件:', filename);
        } else {
          console.log('在 Blob Store 上传目录中未找到文件:', filename);
        }
      } catch (blobError) {
        console.error('从 Blob Store 删除上传文件失败:', blobError);
      }
    }
    
    // 2. 尝试从处理后视频的 Blob Store 删除
    if (blobService.isBlobStorageAvailable() && !deletedFromBlob) {
      try {
        // 尝试从处理后视频列表中获取实际的 Blob URL
        const processedBlobs = await blobService.listBlobFiles(config.blob.processedPrefix);
        const targetBlob = processedBlobs.find(blob => blob.pathname.endsWith(filename));
        
        if (targetBlob) {
          // 使用从列表中获取的 URL
          await blobService.deleteFromBlob(targetBlob.url);
          deletedFromBlob = true;
          console.log('已从 Blob Store 删除处理后文件:', filename);
        } else {
          console.log('在 Blob Store 处理后目录中未找到文件:', filename);
        }
      } catch (blobError) {
        console.error('从 Blob Store 删除处理后文件失败:', blobError);
      }
    }
    
    // 3. 删除本地上传文件（如果存在）
    const uploadFilePath = path.join(config.uploadDir, filename);
    if (fs.existsSync(uploadFilePath)) {
      fs.unlinkSync(uploadFilePath);
      deletedFromLocal = true;
      console.log('已删除本地上传文件:', filename);
    } else {
      console.log('本地上传目录中未找到文件:', filename);
    }
    
    // 4. 删除本地处理后文件（如果存在）
    const processedFilePath = path.join(config.processedDir, filename);
    if (fs.existsSync(processedFilePath)) {
      fs.unlinkSync(processedFilePath);
      deletedFromProcessed = true;
      console.log('已删除本地处理后文件:', filename);
    } else {
      console.log('本地处理目录中未找到文件:', filename);
    }
    
    // 5. 检查是否至少删除了一个文件
    if (deletedFromBlob || deletedFromLocal || deletedFromProcessed) {
      res.json({
        success: true,
        message: '视频已删除',
        details: {
          deletedFromBlob: deletedFromBlob,
          deletedFromLocal: deletedFromLocal,
          deletedFromProcessed: deletedFromProcessed
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: '未找到要删除的视频文件'
      });
    }
  } catch (error) {
    console.error('删除视频错误:', error);
    res.status(500).json({
      success: false,
      message: '删除视频失败: ' + error.message
    });
  }
});

// 代理 Blob Store 视频流（解决跨域问题）
router.get('/proxy/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    console.log(`代理视频请求: ${filename}`);
    
    // 如果启用了 Blob 存储，从 Blob Store 获取文件
    if (blobService.isBlobStorageAvailable()) {
      try {
        const uploadBlobs = await blobService.listBlobFiles(config.blob.uploadPrefix);
        const targetBlob = uploadBlobs.find(blob => blob.pathname.endsWith(filename));
        
        if (targetBlob) {
          console.log(`找到Blob文件: ${targetBlob.url}`);
          
          // 处理Range请求支持
          const range = req.headers.range;
          
          if (range) {
            // 支持分段请求
            const response = await fetch(targetBlob.url, {
              headers: {
                'Range': range
              }
            });
            
            if (response.status === 206 || response.status === 200) {
              // 转发响应头
              res.status(response.status);
              response.headers.forEach((value, key) => {
                if (['content-length', 'content-range', 'content-type', 'accept-ranges'].includes(key.toLowerCase())) {
                  res.setHeader(key, value);
                }
              });
              
              // 流式传输数据
              const readable = response.body;
              readable.on('error', (err) => {
                console.error('视频流传输错误:', err);
                if (!res.headersSent) {
                  res.status(500).end();
                }
              });
              
              readable.pipe(res);
              return;
            }
          } else {
            // 普通请求
            const response = await fetch(targetBlob.url);
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            // 设置响应头
            res.setHeader('Content-Type', response.headers.get('content-type') || 'video/mp4');
            res.setHeader('Content-Length', response.headers.get('content-length'));
            res.setHeader('Accept-Ranges', 'bytes');
            res.setHeader('Cache-Control', 'public, max-age=31536000');
            res.setHeader('Access-Control-Allow-Origin', '*');
            
            // 流式传输数据
            const readable = response.body;
            readable.on('error', (err) => {
              console.error('视频流传输错误:', err);
              if (!res.headersSent) {
                res.status(500).end();
              }
            });
            
            readable.pipe(res);
            return;
          }
        }
      } catch (blobError) {
        console.error('Blob Store 代理错误:', blobError);
        // 回退到本地文件
      }
    }
    
    // 回退到本地文件
    const filePath = path.join(config.uploadDir, filename);
    
    if (!fs.existsSync(filePath)) {
      console.error(`本地文件不存在: ${filePath}`);
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }
    
    console.log(`发送本地文件: ${filePath}`);
    // 发送本地文件，支持Range请求
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('发送本地文件失败:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: '文件发送失败: ' + err.message
          });
        }
      }
    });
  } catch (error) {
    console.error('代理视频错误:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: '代理视频失败: ' + error.message
      });
    }
  }
});

// 测试 Blob Store 连接状态
router.get('/blob-status', async (req, res) => {
  try {
    const status = {
      enabled: blobService.isBlobStorageAvailable(),
      token: !!config.blob.token,
      tokenPrefix: config.blob.token ? config.blob.token.substring(0, 20) + '...' : null,
      uploadPrefix: config.blob.uploadPrefix,
      processedPrefix: config.blob.processedPrefix,
      cleanupLocal: config.blob.cleanupLocal
    };
    
    if (status.enabled) {
      try {
        // 尝试列出文件来测试连接
        const files = await blobService.listBlobFiles(config.blob.uploadPrefix, { limit: 1 });
        status.connection = 'ok';
        status.fileCount = files.length;
      } catch (error) {
        status.connection = 'error';
        status.error = error.message;
      }
    } else {
      status.connection = 'disabled';
    }
    
    res.json({
      success: true,
      status: status
    });
  } catch (error) {
    console.error('检查 Blob Store 状态错误:', error);
    res.status(500).json({
      success: false,
      message: '检查状态失败: ' + error.message
    });
  }
});

// 检查本地文件状态
router.get('/local-files-status', async (req, res) => {
  try {
    const getFileInfo = (dirPath) => {
      if (!fs.existsSync(dirPath)) {
        return [];
      }
      const files = fs.readdirSync(dirPath);
      return files.map(filename => {
        const filePath = path.join(dirPath, filename);
        const stats = fs.statSync(filePath);
        const ageMs = Date.now() - stats.ctimeMs;
        const ageHours = Math.floor(ageMs / (1000 * 60 * 60));
        const ageMinutes = Math.floor((ageMs % (1000 * 60 * 60)) / (1000 * 60));
        return {
          name: filename,
          size: stats.size,
          created: stats.ctime,
          age: ageHours > 0 ? `${ageHours}小时${ageMinutes}分钟前` : `${ageMinutes}分钟前`
        };
      });
    };

    const uploadFiles = getFileInfo(config.uploadDir);
    const processedFiles = getFileInfo(config.processedDir);

    res.json({
      success: true,
      uploadDir: config.uploadDir,
      processedDir: config.processedDir,
      uploadFiles: uploadFiles,
      processedFiles: processedFiles,
      totalFiles: uploadFiles.length + processedFiles.length
    });
  } catch (error) {
    console.error('检查本地文件错误:', error);
    res.status(500).json({
      success: false,
      message: '检查本地文件失败: ' + error.message
    });
  }
});

// 强制清理本地文件
router.post('/force-cleanup', async (req, res) => {
  try {
    let cleanedFiles = 0;
    let freedSpace = 0;
    const details = [];

    const cleanDirectory = (dirPath, description) => {
      if (!fs.existsSync(dirPath)) {
        details.push(`${description}: 目录不存在`);
        return;
      }
      
      const files = fs.readdirSync(dirPath);
      details.push(`${description}: 找到 ${files.length} 个文件`);
      
      files.forEach(filename => {
        const filePath = path.join(dirPath, filename);
        try {
          const stats = fs.statSync(filePath);
          fs.unlinkSync(filePath);
          cleanedFiles++;
          freedSpace += stats.size;
          details.push(`删除: ${filename} (${(stats.size/1024/1024).toFixed(2)}MB)`);
        } catch (error) {
          details.push(`删除失败: ${filename} - ${error.message}`);
        }
      });
    };

    // 清理上传目录
    cleanDirectory(config.uploadDir, '上传目录');
    
    // 清理处理目录
    cleanDirectory(config.processedDir, '处理目录');

    res.json({
      success: true,
      cleanedFiles: cleanedFiles,
      freedSpace: `${(freedSpace/1024/1024).toFixed(2)}MB`,
      details: details.join('\n')
    });
  } catch (error) {
    console.error('强制清理错误:', error);
    res.status(500).json({
      success: false,
      message: '清理失败: ' + error.message
    });
  }
});

// 获取上传限制信息
router.get('/upload-limits', (req, res) => {
  try {
    res.json({
      success: true,
      maxFileSize: config.maxFileSize,
      serverlessLimit: 4.5 * 1024 * 1024, // 4.5MB Vercel 限制
      useDirectUpload: process.env.NODE_ENV === 'production', // 生产环境使用直接上传
      blobEnabled: blobService.isBlobStorageAvailable()
    });
  } catch (error) {
    console.error('获取上传限制错误:', error);
    res.status(500).json({
      success: false,
      message: '获取上传限制失败: ' + error.message
    });
  }
});

module.exports = router;






