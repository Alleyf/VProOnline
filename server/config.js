const path = require('path');
require('dotenv').config();

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
  cleanupInterval: 24 * 60 * 60 * 1000,
  
  // 上传验证配置
  upload: {
    // 上传验证token，防止非法用户攻击
    authToken: process.env.UPLOAD_AUTH_TOKEN || 'default_upload_token_change_me',
    // Token有效期 (默认1小时)
    tokenExpiryTime: parseInt(process.env.UPLOAD_TOKEN_EXPIRY) || 3600000, // 1小时
    // 是否启用上传验证
    requireAuth: process.env.UPLOAD_REQUIRE_AUTH !== 'false'
  },
  
  // Vercel Blob Store 配置
  blob: {
    // Blob Store 访问令牌
    token: process.env.BLOB_READ_WRITE_TOKEN,
    // 是否启用 Blob 存储 (如果为 true，将上传到 Blob Store；为 false 则使用本地存储)
    enabled: process.env.BLOB_STORAGE_ENABLED === 'true' || false,
    // 存储桶前缀
    uploadPrefix: 'videos/uploads/',
    processedPrefix: 'videos/processed/',
    // 是否在上传到Blob Store后清理本地文件默认为true
    cleanupLocal: process.env.BLOB_CLEANUP_LOCAL !== 'false'
  }
};
