const fs = require('fs');
const path = require('path');

async function testUploadWithToken() {
  console.log('=== 测试带Token的上传 ===');
  
  try {
    // 1. 获取Token
    console.log('\n1. 获取上传Token...');
    const tokenResponse = await fetch('http://localhost:3001/api/video/auth/upload-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authKey: 'csdc' })
    });
    const tokenData = await tokenResponse.json();
    
    if (!tokenData.success) {
      console.error('获取Token失败:', tokenData.message);
      return;
    }
    
    const token = tokenData.token;
    console.log('Token获取成功:', token);
    
    // 2. 使用Token上传文件
    console.log('\n2. 使用Token上传文件...');
    
    // 创建FormData
    const formData = new FormData();
    const fileBuffer = fs.readFileSync('test-video.mp4');
    formData.append('video', new Blob([fileBuffer]), 'test-video.mp4');
    
    const uploadResponse = await fetch('http://localhost:3001/api/video/upload', {
      method: 'POST',
      headers: {
        'X-Upload-Token': token
      },
      body: formData
    });
    
    const uploadData = await uploadResponse.json();
    console.log('上传结果:', uploadData);
    
  } catch (error) {
    console.error('上传测试失败:', error.message);
  }
}

testUploadWithToken();