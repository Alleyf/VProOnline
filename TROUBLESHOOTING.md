# VProOnline Blob Store 问题排查指南

## 错误：DOMException: The fetching process for the media resource was aborted by the user agent at the user's request

这个错误通常表示浏览器在尝试加载视频资源时被中断。以下是可能的原因和解决方案：

## 可能的原因

### 1. 跨域资源共享（CORS）问题
**症状**: 视频无法在浏览器中直接播放，控制台显示 CORS 错误
**原因**: Vercel Blob Store 的 URL 可能不允许从您的域名直接访问
**解决方案**: 
- ✅ 已实现：使用本地代理端点 `/api/video/proxy/:filename`
- ✅ 已实现：前端自动检测 Blob 存储并使用代理 URL

### 2. 网络连接问题
**症状**: 间歇性加载失败
**原因**: 网络连接不稳定或 Blob Store 暂时不可用
**解决方案**: 
- ✅ 已实现：智能回退到本地存储
- ✅ 已实现：错误处理和用户提示

### 3. 文件格式兼容性
**症状**: 某些视频格式无法播放
**原因**: 浏览器不支持特定的视频编码
**解决方案**: 
- ✅ 已支持：多种视频格式转换
- ✅ 已实现：MP4 作为默认兼容格式

### 4. 权限或认证问题
**症状**: 上传成功但无法访问
**原因**: Blob Store 访问令牌配置问题
**解决方案**: 
- ✅ 已配置：使用提供的访问令牌
- ✅ 已实现：权限检查和错误处理

## 排查步骤

### 第一步：检查环境配置
```bash
# 检查环境变量
cat .env

# 应该包含：
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_7BYECCM0v5Fi8Z7e_C3tHS2D9CS2RNBg1XU2zOJSv8JL4pG
BLOB_STORAGE_ENABLED=true
```

### 第二步：查看浏览器控制台
1. 打开浏览器开发者工具 (F12)
2. 查看 Console 标签页
3. 上传视频并观察日志输出

**期望看到的日志**:
```
Setting up video preview for: {filename: "xxx.mp4", originalUrl: "blob-url", storage: "blob"}
使用代理 URL: /api/video/proxy/xxx.mp4
视频开始加载: /api/video/proxy/xxx.mp4
视频可以播放: /api/video/proxy/xxx.mp4
```

**如果看到错误日志**:
```
视频预览加载失败: {src: "...", storage: "blob", error: "Video element error event"}
```

### 第三步：测试代理端点
直接在浏览器中访问代理 URL：
```
http://localhost:3001/api/video/proxy/[filename]
```
如果能下载视频文件，说明代理工作正常。

### 第四步：检查服务器日志
查看服务器控制台输出，应该能看到：
```
正在上传原始视频到 Blob Store...
正在上传文件到 Blob Store: videos/uploads/xxx.mp4
原始视频已成功上传到 Blob Store: https://...
```

## 快速修复

### 方案1：禁用 Blob Store（临时解决）
在 `.env` 文件中设置：
```
BLOB_STORAGE_ENABLED=false
```
这将回退到本地存储，视频预览应该正常工作。

### 方案2：清理浏览器缓存
1. 按 Ctrl+Shift+Delete 清理浏览器缓存
2. 或者使用无痕模式测试

### 方案3：检查视频文件大小
大文件可能导致加载超时：
- 测试小于 10MB 的视频文件
- 检查网络连接速度

## 调试信息收集

如果问题持续存在，请收集以下信息：

1. **浏览器信息**
   - 浏览器类型和版本
   - 操作系统

2. **网络状态**
   - 网络连接类型（WiFi/有线）
   - 网速测试结果

3. **控制台日志**
   - 完整的浏览器控制台输出
   - 服务器控制台输出

4. **文件信息**
   - 测试视频文件大小
   - 视频格式和编码

## 高级排查

### 检查 Blob Store 连接
```javascript
// 在浏览器控制台运行
fetch('/api/video/list')
  .then(r => r.json())
  .then(data => console.log('存储模式:', data.storage, '视频数量:', data.videos.length));
```

### 手动测试代理
```javascript
// 测试代理端点
fetch('/api/video/proxy/test-filename.mp4')
  .then(response => console.log('代理状态:', response.status, response.headers.get('content-type')));
```

## 性能优化建议

1. **启用 CDN 缓存**: Blob Store 自带全球 CDN
2. **使用适当的视频格式**: MP4 H.264 兼容性最好
3. **控制文件大小**: 建议单个视频文件不超过 500MB
4. **网络优化**: 确保稳定的网络连接

## 已知限制

1. **浏览器兼容性**: 某些老版本浏览器可能不支持现代视频格式
2. **移动端限制**: iOS Safari 对视频播放有特殊限制
3. **网络限制**: 企业网络可能阻止某些外部请求

## 联系支持

如果按照以上步骤仍无法解决问题，请提供：
- 完整的错误日志
- 网络和浏览器信息
- 重现问题的详细步骤