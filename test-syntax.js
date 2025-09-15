// 语法检查脚本
const fs = require('fs');
const path = require('path');

console.log('检查关键文件语法...');

// 检查app.js
try {
    require('./app.js');
    console.log('✅ app.js 语法正确');
} catch (error) {
    console.error('❌ app.js 语法错误:', error.message);
}

// 检查videoService.js
try {
    require('./server/services/videoService.js');
    console.log('✅ videoService.js 语法正确');
} catch (error) {
    console.error('❌ videoService.js 语法错误:', error.message);
}

// 检查videoRoutes.js
try {
    require('./server/routes/videoRoutes.js');
    console.log('✅ videoRoutes.js 语法正确');
} catch (error) {
    console.error('❌ videoRoutes.js 语法错误:', error.message);
}

console.log('语法检查完成');