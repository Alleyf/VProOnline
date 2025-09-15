# 上传Token验证系统说明

## 概述

为了防止非法用户随意上传文件攻击网站消耗资源，VProOnline实现了基于Token的上传验证机制。用户在上传文件前需要先获取有效的上传Token。

## 功能特性

### 🔐 **安全性**
- **Token验证**：每次上传都需要有效的Token
- **一次性Token**：每个Token只能使用一次，防止重复使用
- **时效性**：Token有过期时间（默认1小时）
- **权限控制**：只有持有管理员密钥的用户才能生成Token

### 🛡️ **防护机制**
- **频率限制**：同一IP每分钟最多申请10个Token
- **自动清理**：过期Token自动从内存中清除
- **错误记录**：详细的日志记录便于监控

## 配置说明

### 环境变量

在`.env`文件中配置以下变量：

```bash
# 上传验证配置
UPLOAD_AUTH_TOKEN=your_secure_admin_key_here
UPLOAD_TOKEN_EXPIRY=3600000  # Token有效期（毫秒），默认1小时
UPLOAD_REQUIRE_AUTH=true     # 是否启用上传验证
```

### 配置选项

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `UPLOAD_AUTH_TOKEN` | 管理员密钥，用于获取Token | `default_upload_token_change_me` |
| `UPLOAD_TOKEN_EXPIRY` | Token有效期（毫秒） | `3600000` (1小时) |
| `UPLOAD_REQUIRE_AUTH` | 是否启用验证 | `true` |

## 使用流程

### 1. 管理员生成Token

访问管理员控制台：`http://localhost:3001/admin.html`

1. 输入管理员密钥
2. 点击"生成上传Token"
3. 复制生成的Token

### 2. 用户上传文件

前端会自动处理Token验证：

1. 用户选择文件上传
2. 系统自动获取上传Token
3. 使用Token进行文件上传
4. Token使用后失效

## API接口

### 生成上传Token

```http
POST /api/video/auth/upload-token
Content-Type: application/json

{
  "authKey": "your_admin_key"
}
```

**响应示例：**
```json
{
  "success": true,
  "token": "abc123-def456-ghi789",
  "expiryTime": 1640995200000,
  "validFor": "3600秒",
  "message": "上传token获取成功"
}
```

### 验证Token

```http
POST /api/video/auth/verify-token
Content-Type: application/json

{
  "token": "abc123-def456-ghi789"
}
```

### 文件上传

```http
POST /api/video/upload
X-Upload-Token: abc123-def456-ghi789
Content-Type: multipart/form-data

# 文件数据
```

## 错误代码

| 代码 | 说明 |
|------|------|
| `MISSING_UPLOAD_TOKEN` | 缺少上传验证token |
| `INVALID_UPLOAD_TOKEN` | 无效的上传token |
| `TOKEN_EXPIRED` | 上传token已过期 |
| `TOKEN_ALREADY_USED` | 上传token已使用 |
| `INVALID_AUTH_KEY` | 管理员密钥错误 |
| `RATE_LIMITED` | 请求过于频繁 |

## 安全建议

### 🔒 **生产环境配置**

1. **更改默认密钥**：
   ```bash
   UPLOAD_AUTH_TOKEN=your_complex_random_string_here_with_at_least_32_characters
   ```

2. **启用HTTPS**：确保Token传输安全

3. **定期更换密钥**：建议每月更换管理员密钥

4. **监控日志**：定期检查Token使用日志

### 🛠 **开发环境**

- 可以设置 `UPLOAD_REQUIRE_AUTH=false` 临时禁用验证
- 使用默认密钥进行测试

## 故障排除

### 常见问题

1. **Token获取失败**
   - 检查管理员密钥是否正确
   - 确认服务器正常运行

2. **上传权限验证失败**
   - 确认Token未过期
   - 检查Token是否已被使用

3. **频率限制**
   - 等待1分钟后重试
   - 联系管理员获取更多Token

### 调试信息

开启详细日志记录：
```bash
DEBUG=vpro:auth node app.js
```

## 系统架构

```
用户端           管理员端          服务器端
┌─────┐         ┌─────┐          ┌─────┐
│文件 │         │密钥 │          │Token│
│选择 │────────▶│输入 │─────────▶│生成 │
└─────┘         └─────┘          └─────┘
   │                                │
   ▼                                ▼
┌─────┐         ┌─────┐          ┌─────┐
│获取 │◀────────│Token│◀─────────│验证 │
│Token│         │返回 │          │权限 │
└─────┘         └─────┘          └─────┘
   │
   ▼
┌─────┐
│文件 │
│上传 │
└─────┘
```

## 更新日志

- **v1.0.0**: 初始版本，基础Token验证功能
- 支持Token生成、验证、过期清理
- 集成频率限制和日志记录
- 提供管理员控制台界面