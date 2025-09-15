const fetch = require('node-fetch');

async function testTokenSystem() {
  console.log('=== Token验证系统测试 ===');
  
  // 1. 测试获取Token
  console.log('\n1. 测试获取Token (正确密钥)...');
  try {
    const response = await fetch('http://localhost:3001/api/video/auth/upload-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authKey: 'csdc' })
    });
    const data = await response.json();
    console.log('结果:', data);
    
    if (data.success) {
      const token = data.token;
      console.log('Token获取成功:', token);
      
      // 2. 测试Token验证
      console.log('\n2. 测试Token验证...');
      const verifyResponse = await fetch('http://localhost:3001/api/video/auth/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      const verifyData = await verifyResponse.json();
      console.log('验证结果:', verifyData);
    }
  } catch (error) {
    console.error('错误:', error.message);
  }
  
  // 3. 测试错误密钥
  console.log('\n3. 测试错误密钥...');
  try {
    const response = await fetch('http://localhost:3001/api/video/auth/upload-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authKey: 'wrong_key' })
    });
    const data = await response.json();
    console.log('结果:', data);
  } catch (error) {
    console.error('错误:', error.message);
  }
}

testTokenSystem();