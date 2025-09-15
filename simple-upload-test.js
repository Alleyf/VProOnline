// 简单的上传测试脚本
const fs = require('fs');

async function testUpload() {
  try {
    // 1. 获取Token
    console.log('1. 获取上传Token...');
    const tokenRes = await fetch('http://localhost:3001/api/video/auth/upload-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authKey: 'csdc' })
    });
    
    const tokenData = await tokenRes.json();
    console.log('Token结果:', tokenData);
    
    if (!tokenData.success) {
      console.log('Token获取失败');
      return;
    }
    
    const token = tokenData.token;
    console.log('Token:', token);
    
    // 2. 测试无Token上传（应该失败）
    console.log('\\n2. 测试无Token上传...');
    const noTokenRes = await fetch('http://localhost:3001/api/video/upload', {
      method: 'POST',
      body: 'dummy content'
    });
    
    const noTokenData = await noTokenRes.json();
    console.log('无Token上传结果:', noTokenData);
    
    // 3. 测试有Token上传（应该成功）
    console.log('\\n3. 测试有Token上传...');
    
    // 使用curl命令测试
    const { exec } = require('child_process');
    exec(`curl -v -X POST http://localhost:3001/api/video/upload -H "X-Upload-Token: ${token}" -F "video=@test-video.mp4"`, 
      (error, stdout, stderr) => {
        if (error) {
          console.log('执行curl命令出错:', error);
          return;
        }
        console.log('curl stdout:', stdout);
        console.log('curl stderr:', stderr);
      });
    
  } catch (error) {
    console.error('测试出错:', error.message);
  }
}

testUpload();