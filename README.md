# VProOnline 视频处理平台

一个基于Node.js的视频上传、处理和分享平台。

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
- 数据库: MongoDB
- 视频处理: FFmpeg

## 安装指南

1. 克隆仓库
```bash
git clone https://github.com/your-repo/VProOnline.git
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