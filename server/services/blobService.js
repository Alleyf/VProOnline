const { put, del, list } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');
const config = require('../config');

/**
 * Blob 存储服务
 * 提供与 Vercel Blob Store 交互的功能
 */

/**
 * 上传文件到 Blob Store
 * @param {string} localFilePath - 本地文件路径
 * @param {string} blobPath - Blob 存储路径
 * @param {Object} options - 上传选项
 * @returns {Promise<Object>} 上传结果，包含 url 和其他信息
 */
const uploadToBlob = async (localFilePath, blobPath, options = {}) => {
  try {
    if (!config.blob.enabled || !config.blob.token) {
      throw new Error('Blob 存储未启用或缺少访问令牌');
    }

    // 检查本地文件是否存在
    if (!fs.existsSync(localFilePath)) {
      throw new Error(`本地文件不存在: ${localFilePath}`);
    }

    // 读取文件内容
    const fileBuffer = fs.readFileSync(localFilePath);
    
    // 设置默认选项
    const uploadOptions = {
      access: 'public',
      token: config.blob.token,
      ...options
    };

    // 上传到 Blob Store
    console.log(`正在上传文件到 Blob Store: ${blobPath}`);
    const result = await put(blobPath, fileBuffer, uploadOptions);
    
    console.log(`文件上传成功: ${result.url}`);
    return result;
  } catch (error) {
    console.error('上传到 Blob Store 失败:', error);
    throw error;
  }
};

/**
 * 从 Blob Store 删除文件
 * @param {string} blobUrl - Blob 文件 URL
 * @returns {Promise<void>}
 */
const deleteFromBlob = async (blobUrl) => {
  try {
    if (!config.blob.enabled || !config.blob.token) {
      throw new Error('Blob 存储未启用或缺少访问令牌');
    }

    console.log(`正在从 Blob Store 删除文件: ${blobUrl}`);
    await del(blobUrl, { token: config.blob.token });
    console.log(`文件删除成功: ${blobUrl}`);
  } catch (error) {
    console.error('从 Blob Store 删除文件失败:', error);
    throw error;
  }
};

/**
 * 列出 Blob Store 中的文件
 * @param {string} prefix - 前缀过滤
 * @param {Object} options - 列表选项
 * @returns {Promise<Array>} 文件列表
 */
const listBlobFiles = async (prefix = '', options = {}) => {
  try {
    if (!config.blob.enabled || !config.blob.token) {
      throw new Error('Blob 存储未启用或缺少访问令牌');
    }

    const listOptions = {
      token: config.blob.token,
      prefix,
      ...options
    };

    const result = await list(listOptions);
    return result.blobs || [];
  } catch (error) {
    console.error('列出 Blob Store 文件失败:', error);
    throw error;
  }
};

/**
 * 上传原始视频到 Blob Store（带进度回调）
 * @param {string} localFilePath - 本地文件路径
 * @param {string} filename - 文件名
 * @param {Function} progressCallback - 进度回调函数
 * @returns {Promise<Object>} 上传结果
 */
const uploadRawVideo = async (localFilePath, filename, progressCallback = null) => {
  const blobPath = `${config.blob.uploadPrefix}${filename}`;
  
  // 模拟进度更新，因为Vercel Blob Store不支持真实进度回调
  if (progressCallback) {
    // 获取文件大小来估算进度
    const stats = fs.statSync(localFilePath);
    const fileSize = stats.size;
    
    // 根据文件大小估算上传时间并模拟进度
    const estimatedTime = Math.max(2000, Math.min(10000, fileSize / 1024 / 1024 * 1000)); // 1MB/s的估算
    const progressInterval = estimatedTime / 30; // 分30步更新进度
    
    console.log(`开始模拟Blob上传进度，文件大小: ${(fileSize / 1024 / 1024).toFixed(2)}MB，估算时间: ${estimatedTime}ms`);
    
    // 创建进度更新定时器
    let currentProgress = 0;
    const progressTimer = setInterval(() => {
      currentProgress += 3; // 每次增加3%
      if (currentProgress <= 85) { // 最多到85%，剩下的等实际完成
        progressCallback(currentProgress);
      }
    }, progressInterval);
    
    try {
      // 执行实际上传
      const result = await uploadToBlob(localFilePath, blobPath);
      
      // 清除定时器并设置为100%
      clearInterval(progressTimer);
      if (progressCallback) {
        progressCallback(100);
      }
      
      return result;
    } catch (error) {
      // 清除定时器
      clearInterval(progressTimer);
      throw error;
    }
  } else {
    // 如果没有进度回调，直接上传
    return await uploadToBlob(localFilePath, blobPath);
  }
};

/**
 * 上传处理后的视频到 Blob Store
 * @param {string} localFilePath - 本地文件路径
 * @param {string} filename - 文件名
 * @returns {Promise<Object>} 上传结果
 */
const uploadProcessedVideo = async (localFilePath, filename) => {
  const blobPath = `${config.blob.processedPrefix}${filename}`;
  return await uploadToBlob(localFilePath, blobPath);
};

/**
 * 生成 Blob 文件路径
 * @param {string} filename - 文件名
 * @param {string} type - 文件类型 ('upload' 或 'processed')
 * @returns {string} Blob 路径
 */
const generateBlobPath = (filename, type = 'upload') => {
  const prefix = type === 'processed' ? config.blob.processedPrefix : config.blob.uploadPrefix;
  return `${prefix}${filename}`;
};

/**
 * 检查 Blob 存储是否可用
 * @returns {boolean} 是否可用
 */
const isBlobStorageAvailable = () => {
  return config.blob.enabled && !!config.blob.token;
};

/**
 * 清理本地文件（在上传到 Blob Store 后）
 * @param {string} localFilePath - 本地文件路径
 * @returns {Promise<void>}
 */
const cleanupLocalFile = async (localFilePath) => {
  try {
    if (fs.existsSync(localFilePath)) {
      await fs.promises.unlink(localFilePath);
      console.log(`本地文件已清理: ${localFilePath}`);
    }
  } catch (error) {
    console.error(`清理本地文件失败: ${localFilePath}`, error);
    // 不抛出错误，因为这不是关键操作
  }
};

module.exports = {
  uploadToBlob,
  deleteFromBlob,
  listBlobFiles,
  uploadRawVideo,
  uploadProcessedVideo,
  generateBlobPath,
  isBlobStorageAvailable,
  cleanupLocalFile
};