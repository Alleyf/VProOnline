const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./server/config');
const videoRoutes = require('./server/routes/videoRoutes');
const videoService = require('./server/services/videoService');

// 创建Express应用
const app = express();

// 中间件
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use(express.static(config.publicDir));
app.use('/uploads', express.static(config.uploadDir));
app.use('/processed', express.static(config.processedDir));

// API路由
app.use('/api/video', videoRoutes);

// 主页面路由
app.get('*', (req, res) => {
  res.sendFile(path.join(config.publicDir, 'index.html'));
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: '服务器内部错误: ' + err.message
  });
});

// 确保目录存在
videoService.ensureDirectoryExistence(config.uploadDir);
videoService.ensureDirectoryExistence(config.processedDir);

// 设置定期清理过期文件
setInterval(videoService.cleanExpiredFiles, config.cleanupInterval);
// 启动时立即清理一次
videoService.cleanExpiredFiles();

// 启动服务器
app.listen(config.port, () => {
  console.log(`服务器已启动，监听端口 ${config.port}`);
  console.log(`访问地址: ${config.publicUrl}`);
});

module.exports = app;
