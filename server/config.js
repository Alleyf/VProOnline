const path = require('path');

// 基础目录
const baseDir = path.resolve(__dirname, '..');

module.exports = {
  // 服务器配置
  port: process.env.PORT || 3001,
  publicUrl: process.env.PUBLIC_URL || 'http://localhost:3001',
  
  // 目录配置
  publicDir: path.join(baseDir, 'public'),
  uploadDir: path.join(baseDir, 'uploads'),
  processedDir: path.join(baseDir, 'processed'),
  outputDir: path.join(baseDir, 'outputs'),
  
  // 文件大小限制 (2GB)
  maxFileSize: 2 * 1024 * 1024 * 1024,
  
  // 支持的视频格式
  supportedVideoFormats: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'],
  
  // 支持的音频格式
  supportedAudioFormats: ['mp3', 'wav', 'ogg', 'm4a'],
  
  // 清理过期文件的时间间隔 (24小时)
  cleanupInterval: 24 * 60 * 60 * 1000
};
