# 上传Token验证系统测试说明

## 测试目标

验证上传Token验证系统是否正常工作，包括：
1. 正确的Token可以上传文件
2. 没有Token的上传请求被拒绝
3. 错误的Token被拒绝
4. Token只能使用一次

## 测试步骤

### 1. 测试Token获取

```bash
# 使用正确的管理员密钥获取Token
curl -X POST http://localhost:3001/api/video/auth/upload-token \
  -H "Content-Type: application/json" \
  -d '{"authKey":"csdc"}'
```

预期响应：
```json
{
  "success": true,
  "token": "uuid格式的token",
  "expiryTime": 1234567890123,
  "validFor": "3600秒",
  "message": "上传token获取成功"
}
```

### 2. 测试无Token上传（应该被拒绝）

```bash
# 尝试不带Token上传文件
curl -X POST http://localhost:3001/api/video/upload \
  -F "video=@test-video.mp4"
```

预期响应：
```json
{
  "success": false,
  "message": "缺少上传验证token",
  "code": "MISSING_UPLOAD_TOKEN"
}
```

### 3. 测试有Token上传（应该成功）

```bash
# 使用获取到的Token上传文件
curl -X POST http://localhost:3001/api/video/upload \
  -H "X-Upload-Token: YOUR_TOKEN_HERE" \
  -F "video=@test-video.mp4"
```

预期响应：
```json
{
  "success": true,
  "file": {
    // 文件信息
  }
}
```

### 4. 测试Token重复使用（应该被拒绝）

```bash
# 使用已经使用过的Token再次上传
curl -X POST http://localhost:3001/api/video/upload \
  -H "X-Upload-Token: SAME_TOKEN_AS_BEFORE" \
  -F "video=@test-video.mp4"
```

预期响应：
```json
{
  "success": false,
  "message": "上传token已使用",
  "code": "TOKEN_ALREADY_USED"
}
```

### 5. 测试错误的管理员密钥

```bash
# 使用错误的管理员密钥
curl -X POST http://localhost:3001/api/video/auth/upload-token \
  -H "Content-Type: application/json" \
  -d '{"authKey":"wrong_key"}'
```

预期响应：
```json
{
  "success": false,
  "message": "身份验证失败，无权获取上传token",
  "code": "INVALID_AUTH_KEY"
}
```

## 测试结果验证

查看服务器日志确认：
1. 无Token上传请求返回401状态码
2. 有Token上传请求正常处理
3. Token重复使用被拒绝
4. 错误密钥被拒绝

## 自动化测试脚本

运行以下脚本进行自动化测试：

```bash
cd a:\dashboard\GH_Repos\VProOnline
node test-token.js
```

## 前端集成测试

1. 访问首页：http://localhost:3001
2. 选择一个视频文件上传
3. 观察控制台日志，确认：
   - 自动获取Token
   - 使用Token上传
   - 上传成功

## 管理员控制台测试

1. 访问管理员控制台：http://localhost:3001/admin.html
2. 输入管理员密钥：csdc
3. 点击"生成上传Token"
4. 复制Token并用于测试

## 故障排除

### 常见问题

1. **Token获取失败**
   - 检查.env文件中的UPLOAD_AUTH_TOKEN是否正确设置为"csdc"
   - 确认服务器正常运行

2. **上传被拒绝**
   - 检查Token是否正确传递
   - 确认Token未过期
   - 确认Token未被重复使用

3. **前端无响应**
   - 检查浏览器控制台是否有JavaScript错误
   - 确认blob-direct-upload.js正确加载

### 日志查看

```bash
# 查看服务器日志
cd a:\dashboard\GH_Repos\VProOnline
node app.js
```

关注以下日志信息：
- Token生成日志
- 上传请求验证结果
- 错误信息

## 安全性验证

1. **频率限制**：同一IP每分钟最多生成10个Token
2. **一次性使用**：Token使用后立即失效
3. **时效性**：Token默认1小时后过期
4. **密钥保护**：只有持有正确密钥的用户才能生成Token

## 性能测试

1. **Token生成响应时间**：< 100ms
2. **上传验证响应时间**：< 50ms
3. **并发处理能力**：支持多个并发上传请求