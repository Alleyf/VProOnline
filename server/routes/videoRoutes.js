const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const videoService = require('../services/videoService');
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

// 上传视频
router.post('/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '未上传视频文件'
      });
    }
    
    // 获取视频信息
    const videoInfo = await videoService.getVideoInfo(req.file.path);
    
    // 解决中文文件名编码问题
    const originalname = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
    const name = path.basename(originalname, path.extname(originalname));
    
    res.json({
      success: true,
      file: {
        filename: req.file.filename,
        originalname: originalname,
        name: name,
        size: req.file.size,
        path: req.file.path,
        url: `${config.publicUrl}/uploads/${req.file.filename}`,
        videoInfo: videoInfo
      }
    });
  } catch (error) {
    console.error('视频上传错误:', error);
    res.status(500).json({
      success: false,
      message: '视频上传失败: ' + error.message
    });
  }
});

// 处理视频
router.post('/process', async (req, res) => {
  try {
    const { filename, options } = req.body;
    
    if (!filename) {
      return res.status(400).json({
        success: false,
        message: '缺少视频文件名'
      });
    }
    
    const inputPath = path.join(config.uploadDir, filename);
    
    // 检查文件是否存在
    if (!fs.existsSync(inputPath)) {
      return res.status(404).json({
        success: false,
        message: '视频文件不存在'
      });
    }
    
    // 处理视频
    // 注意：实际生产环境中应使用队列和WebSocket来处理长时间运行的任务
    const result = await videoService.processVideo(
      filename, 
      options || {},
      (progress) => {
        // 这里可以通过WebSocket发送进度更新
        console.log(`处理进度: ${progress}%`);
      }
    );
    
    res.json({
      success: true,
      result: result
    });
  } catch (error) {
    console.error('视频处理错误:', error);
    res.status(500).json({
      success: false,
      message: '视频处理失败: ' + error.message
    });
  }
});

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
router.get('/process-result/:processId', (req, res) => {
  try {
    const processId = req.params.processId;
    
    if (!processId) {
      return res.status(400).json({
        success: false,
        message: '缺少处理ID'
      });
    }
    
    // 查找处理结果文件
    const files = fs.readdirSync(config.processedDir);
    
    // 查找视频文件（不以_audio结尾的文件）
    const videoFile = files.find(file => file.startsWith(processId) && !file.endsWith('_audio.mp3'));
    
    // 查找音频文件（以_audio结尾的文件）
    const audioFile = files.find(file => file.startsWith(processId) && file.endsWith('_audio.mp3'));
    
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
        url: videoFile ? `${config.publicUrl}/processed/${videoFile}` : null,
        audioFilename: audioFile || null,
        audioUrl: audioFile ? `${config.publicUrl}/processed/${audioFile}` : null
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
            format: videoInfo.format
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
            uploadDate: stats.ctime
          };
        }
      });
    
    // 等待所有视频信息获取完成
    const videos = await Promise.all(videoPromises);
    
    res.json({
      success: true,
      videos: videos
    });
  } catch (error) {
    console.error('获取视频列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取视频列表失败: ' + error.message
    });
  }
});

// 删除视频
router.delete('/delete/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(config.uploadDir, filename);
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }
    
    // 删除文件
    fs.unlinkSync(filePath);
    
    res.json({
      success: true,
      message: '视频已删除'
    });
  } catch (error) {
    console.error('删除视频错误:', error);
    res.status(500).json({
      success: false,
      message: '删除视频失败: ' + error.message
    });
  }
});

module.exports = router;
