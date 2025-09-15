# VProOnline - Vercel Blob Store 集成指南

## 概述

VProOnline 现在支持使用 Vercel 的 Blob Store 来存储上传和处理后的视频文件。这提供了云存储的优势，包括更好的扩展性、可靠性和全球访问性。

## 功能特性

- ✅ **混合存储模式**: 支持本地存储和 Blob Store 之间的无缝切换
- ✅ **自动上传**: 上传的原始视频和处理后的视频自动上传到 Blob Store
- ✅ **智能回退**: 如果 Blob Store 不可用，自动回退到本地存储
- ✅ **清理机制**: 可选择在上传成功后清理本地文件
- ✅ **统一 API**: 无论使用哪种存储方式，API 接口保持一致

## 配置说明

### 环境变量

在 `.env` 文件中配置以下环境变量：

```env
# Vercel Blob Store 配置
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token_here
BLOB_STORAGE_ENABLED=true

# 服务器配置
PORT=3001
PUBLIC_URL=http://localhost:3001
```

### 配置选项

- `BLOB_READ_WRITE_TOKEN`: 你的 Vercel Blob Store 访问令牌
- `BLOB_STORAGE_ENABLED`: 设置为 `true` 启用 Blob 存储，`false` 使用本地存储

## 使用方法

### 1. 上传视频

**请求:**
```bash
POST /api/video/upload
Content-Type: multipart/form-data

# 文件字段名: video
```

**响应:**
```json
{
  "success": true,
  "file": {
    "filename": "uuid-generated-filename.mp4",
    "originalname": "my-video.mp4",
    "name": "my-video",
    "size": 10485760,
    "url": "https://vercel.blob.store/videos/uploads/filename.mp4",
    "blobUrl": "https://vercel.blob.store/videos/uploads/filename.mp4",
    "storage": "blob",
    "videoInfo": {
      "duration": 120.5,
      "width": 1920,
      "height": 1080,
      "format": "mp4",
      "size": 10485760
    }
  }
}
```

### 2. 处理视频

**请求:**
```bash
POST /api/video/process
Content-Type: application/json

{
  "filename": "uuid-generated-filename.mp4",
  "options": {
    "format": "mp4",
    "resize": {
      "width": 1280,
      "height": 720
    },
    "compress": {
      "crf": 23
    }
  }
}
```

**响应:**
```json
{
  "success": true,
  "result": {
    "processId": "process-uuid",
    "filename": "processed-uuid.mp4",
    "url": "https://vercel.blob.store/videos/processed/processed-uuid.mp4",
    "blobUrl": "https://vercel.blob.store/videos/processed/processed-uuid.mp4",
    "storage": "blob"
  }
}
```

### 3. 获取视频列表

**请求:**
```bash
GET /api/video/list
```

**响应:**
```json
{
  "success": true,
  "storage": "blob",
  "videos": [
    {
      "id": "video-uuid",
      "filename": "video-uuid.mp4",
      "name": "video-uuid",
      "url": "https://vercel.blob.store/videos/uploads/video-uuid.mp4",
      "blobUrl": "https://vercel.blob.store/videos/uploads/video-uuid.mp4",
      "size": 10485760,
      "uploadDate": "2025-01-15T10:30:00.000Z",
      "storage": "blob"
    }
  ]
}
```

### 4. 删除视频

**请求:**
```bash
DELETE /api/video/delete/filename.mp4
```

**响应:**
```json
{
  "success": true,
  "message": "视频已删除"
}
```

## Blob Store 结构

文件在 Vercel Blob Store 中的组织结构：

```
videos/
├── uploads/          # 原始上传的视频文件
│   ├── uuid1.mp4
│   ├── uuid2.avi
│   └── ...
└── processed/        # 处理后的视频文件
    ├── processed-uuid1.mp4
    ├── processed-uuid2.webm
    └── ...
```

## API 示例代码

### JavaScript/Node.js 示例

```javascript
// 上传视频
const uploadVideo = async (file) => {
  const formData = new FormData();
  formData.append('video', file);
  
  const response = await fetch('http://localhost:3001/api/video/upload', {
    method: 'POST',
    body: formData
  });
  
  return await response.json();
};

// 处理视频
const processVideo = async (filename, options) => {
  const response = await fetch('http://localhost:3001/api/video/process', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ filename, options })
  });
  
  return await response.json();
};

// 获取视频列表
const getVideoList = async () => {
  const response = await fetch('http://localhost:3001/api/video/list');
  return await response.json();
};
```

### Python 示例

```python
import requests

# 上传视频
def upload_video(file_path):
    with open(file_path, 'rb') as f:
        files = {'video': f}
        response = requests.post('http://localhost:3001/api/video/upload', files=files)
    return response.json()

# 处理视频
def process_video(filename, options):
    data = {'filename': filename, 'options': options}
    response = requests.post('http://localhost:3001/api/video/process', json=data)
    return response.json()

# 获取视频列表
def get_video_list():
    response = requests.get('http://localhost:3001/api/video/list')
    return response.json()
```

## 存储模式对比

| 特性 | 本地存储 | Blob Store |
|------|----------|------------|
| 扩展性 | 受限于服务器磁盘 | 无限扩展 |
| 可靠性 | 依赖服务器硬件 | 高可用性 |
| 成本 | 服务器存储成本 | 按使用量付费 |
| 访问速度 | 本地网络速度 | 全球 CDN |
| 管理复杂度 | 需要管理磁盘空间 | 自动管理 |

## 故障排除

### 1. Blob Store 连接失败

如果遇到 Blob Store 连接问题：

1. 检查 `BLOB_READ_WRITE_TOKEN` 是否正确
2. 确认网络连接正常
3. 检查 Vercel 服务状态
4. 系统会自动回退到本地存储

### 2. 环境变量未加载

确保 `.env` 文件位于项目根目录，并且格式正确。

### 3. 权限问题

确保 Blob Store 令牌有读写权限。

## 迁移说明

### 从本地存储迁移到 Blob Store

1. 设置环境变量 `BLOB_STORAGE_ENABLED=true`
2. 配置 `BLOB_READ_WRITE_TOKEN`
3. 重启服务器
4. 新上传的文件将自动使用 Blob Store

### 从 Blob Store 迁移到本地存储

1. 设置环境变量 `BLOB_STORAGE_ENABLED=false`
2. 重启服务器
3. 新上传的文件将使用本地存储

## 注意事项

1. **令牌安全**: 请妥善保管 Blob Store 访问令牌，不要在代码中硬编码
2. **成本控制**: Blob Store 按使用量计费，建议监控使用情况
3. **备份策略**: 虽然 Blob Store 很可靠，但建议制定备份策略
4. **文件命名**: 系统使用 UUID 生成唯一文件名，避免命名冲突

## 支持的操作

- ✅ 上传原始视频到 Blob Store
- ✅ 上传处理后的视频到 Blob Store
- ✅ 从 Blob Store 删除文件
- ✅ 列出 Blob Store 中的文件
- ✅ 智能存储模式切换
- ✅ 错误处理和回退机制