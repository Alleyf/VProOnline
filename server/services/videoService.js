const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

// 确保目录存在
const ensureDirectoryExistence = (dirPath) => {
  // 如果传入的是文件路径，获取其目录路径
  const dirname = path.extname(dirPath) ? path.dirname(dirPath) : dirPath;
  
  if (fs.existsSync(dirname)) {
    return true;
  }
  
  try {
    fs.mkdirSync(dirname, { recursive: true });
    return true;
  } catch (err) {
    console.error(`创建目录失败: ${dirname}`, err);
    return false;
  }
};

// 获取视频信息
const getVideoInfo = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      
      const stream = metadata.streams.find(s => s.codec_type === 'video');
      
      resolve({
        duration: metadata.format.duration,
        width: stream ? stream.width : 0,
        height: stream ? stream.height : 0,
        format: metadata.format.format_name.split(',')[0],
        size: fs.statSync(filePath).size
      });
    });
  });
};

// 存储正在进行的处理任务
const activeProcesses = new Map();

// 处理视频
const processVideo = (inputFilename, options, progressCallback) => {
  return new Promise((resolve, reject) => {
    try {
      const inputPath = path.join(config.uploadDir, inputFilename);
      
      // 生成输出文件名和处理ID
      const processId = uuidv4();
      const outputExt = options.extractAudio ? 
        options.audioFormat : 
        options.format || 'mp4';
      const outputFilename = `${processId}.${outputExt}`;
      const outputPath = path.join(config.processedDir, outputFilename);
      
      // 确保输出目录存在
      ensureDirectoryExistence(outputPath);
      
      // 创建FFmpeg命令
      let command = ffmpeg(inputPath);
      
      // 裁剪处理
      if (options.crop) {
        if (options.crop.startTime) {
          command = command.setStartTime(options.crop.startTime);
        }
        if (options.crop.endTime) {
          command = command.setDuration(options.crop.endTime - (options.crop.startTime || 0));
        }
      }
      
      // 尺寸调整
      if (options.resize) {
        let sizeStr = '';
        if (options.resize.width && options.resize.height) {
          sizeStr = `${options.resize.width}x${options.resize.height}`;
        } else if (options.resize.width) {
          sizeStr = `${options.resize.width}x?`;
        } else if (options.resize.height) {
          sizeStr = `?x${options.resize.height}`;
        }
        
        if (sizeStr && !options.resize.keepAspectRatio) {
          sizeStr += '!'; // 不保持比例
        }
        
        if (sizeStr) {
          command = command.size(sizeStr);
        }
      }
      
      // 压缩处理
      if (options.compress) {
        // 使用CRF值控制压缩质量，值越大压缩率越高（质量越低）
        const crf = Math.min(Math.max(options.compress.crf || 23, 18), 28);
        command = command.outputOptions(`-crf ${crf}`);
      }
      
      // 提取音频
      if (options.extractAudio) {
        command = command.noVideo();
        // 设置音频编码
        switch(options.audioFormat) {
          case 'mp3':
            command = command.audioCodec('libmp3lame');
            break;
          case 'wav':
            command = command.audioCodec('pcm_s16le');
            break;
          case 'ogg':
            command = command.audioCodec('libvorbis');
            break;
          case 'm4a':
            command = command.audioCodec('aac');
            break;
        }
      } else {
        // 设置视频编码
        switch(options.format) {
          case 'mp4':
            command = command.videoCodec('libx264');
            break;
          case 'webm':
            command = command.videoCodec('libvpx');
            break;
          case 'avi':
            command = command.videoCodec('mpeg4');
            break;
          case 'mov':
            command = command.videoCodec('libx264');
            break;
        }
      }
      
      // 添加水印（简化版，实际应用需更复杂的位置和透明度控制）
      if (options.watermark && options.watermark.path) {
        command = command.overlay(options.watermark.position || '5:5');
      }
      
      // 进度回调
      command.on('progress', (progress) => {
        if (progressCallback) {
          progressCallback(Math.round(progress.percent));
        }
      });
      
      // 错误处理
      command.on('error', (err) => {
        console.error('视频处理错误:', err);
        // 从活动处理中移除
        activeProcesses.delete(processId);
        reject(err);
      });
      
      // 处理完成
      command.on('end', () => {
        // 从活动处理中移除
        activeProcesses.delete(processId);
        resolve({
          processId: processId,
          filename: outputFilename,
          path: outputPath,
          url: `${config.publicUrl}/processed/${outputFilename}`
        });
      });
      
      // 存储命令到活动处理中
      activeProcesses.set(processId, { command, outputPath });
      
      // 执行命令
      command.save(outputPath);
    } catch (error) {
      console.error('视频处理过程中发生错误:', error);
      reject(error);
    }
  });
};

// 清理过期文件
const cleanExpiredFiles = () => {
  const now = Date.now();
  
  // 清理上传目录
  fs.readdir(config.uploadDir, (err, files) => {
    if (err) return console.error('读取上传目录失败:', err);
    
    files.forEach(file => {
      const filePath = path.join(config.uploadDir, file);
      fs.stat(filePath, (err, stats) => {
        if (err) return console.error('获取文件信息失败:', err);
        
        // 删除超过24小时的文件
        if (now - stats.ctimeMs > 24 * 60 * 60 * 1000) {
          fs.unlink(filePath, err => {
            if (err) console.error('删除文件失败:', err);
            else console.log(`已删除过期文件: ${file}`);
          });
        }
      });
    });
  });
  
  // 清理处理完成目录
  fs.readdir(config.processedDir, (err, files) => {
    if (err) return console.error('读取处理目录失败:', err);
    
    files.forEach(file => {
      const filePath = path.join(config.processedDir, file);
      fs.stat(filePath, (err, stats) => {
        if (err) return console.error('获取文件信息失败:', err);
        
        // 删除超过7天的文件
        if (now - stats.ctimeMs > 7 * 24 * 60 * 60 * 1000) {
          fs.unlink(filePath, err => {
            if (err) console.error('删除文件失败:', err);
            else console.log(`已删除过期文件: ${file}`);
          });
        }
      });
    });
  });
};

// 取消视频处理
const cancelProcessing = (processId) => {
  if (!activeProcesses.has(processId)) {
    throw new Error('未找到指定的处理任务');
  }
  
  try {
    const { command, outputPath } = activeProcesses.get(processId);
    
    // 停止FFmpeg命令
    command.kill('SIGKILL');
    
    // 尝试删除未完成的输出文件
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }
    
    // 从活动处理中移除
    activeProcesses.delete(processId);
    
    return { success: true, message: '处理已取消' };
  } catch (error) {
    console.error('取消处理错误:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  getVideoInfo,
  processVideo,
  cancelProcessing,
  cleanExpiredFiles,
  ensureDirectoryExistence
};
