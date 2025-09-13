# VProOnline 视频处理平台

# MediaBunny - 在线视频处理平台

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Alleyf/VProOnline)

一个基于Node.js的视频上传、处理和分享平台，支持多种视频格式转换、裁剪、压缩等操作。

## ✨ 功能特点

- 视频上传与存储管理
- 多种格式转换（MP4, AVI, MOV, WebM等）
- 视频裁剪与尺寸调整
- 视频压缩与质量调整
- 音频提取（MP3, WAV等格式）
- 水印添加功能
- 响应式设计，适配各种设备

## 🚀 快速开始

### 环境要求
- Node.js 16+
- npm 8+
- FFmpeg (视频处理依赖)

### 安装步骤

1. 克隆仓库：
```bash
git clone https://github.com/Alleyf/VProOnline.git
cd VProOnline
```

2. 安装依赖：
```bash
npm install
```

3. 配置环境变量：
复制`.env.example`文件并重命名为`.env`，然后修改相应配置。

4. 启动开发服务器：
```bash
npm run dev
```

5. 访问应用：
打开浏览器访问 [http://localhost:3001](http://localhost:3001)

## 🌐 Vercel一键部署

点击下方按钮一键部署到Vercel：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Alleyf/VProOnline)

## 📝 使用说明

1. 上传视频文件（拖放或点击选择）
2. 选择处理选项（格式、尺寸、裁剪等）
3. 开始处理并等待完成
4. 下载处理后的文件

## 🤝 贡献指南

欢迎提交Pull Request或Issue。

## 📄 许可证

MIT

## 功能特性

- 视频上传与管理
- 视频压缩与格式转换
- 视频剪辑与裁剪
- 音频提取
- 水印添加
- 分辨率调整

## 技术栈

- 前端: HTML5, CSS3, JavaScript
- 后端: Node.js, Express
- 视频处理: FFmpeg

## 安装指南

1. 克隆仓库
```bash
git clone https://github.com/Alleyf/VProOnline.git
cd VProOnline
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
复制`.env.example`为`.env`并修改配置

4. 启动开发服务器
```bash
npm run dev
```

## 开发脚本

- `npm run dev` - 启动开发服务器
- `npm test` - 运行测试
- `npm run lint` - 代码检查
- `npm run build` - 生产环境构建