/**
 * 简单的测试文件验证脚本
 * 检查测试文件的存在性和基本结构
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 塔防游戏单元测试验证报告');
console.log('='.repeat(50));

const testFiles = [
    'TestFramework.js',
    'AdventureModeTests.js', 
    'EndlessModeTests.js',
    'IntegrationTests.js',
    'TestRunner.html',
    'README.md'
];

const fileStats = [];

testFiles.forEach(fileName => {
    const filePath = path.join(__dirname, fileName);
    
    try {
        const stats = fs.statSync(filePath);
        const content = fs.readFileSync(filePath, 'utf8');
        
        fileStats.push({
            name: fileName,
            exists: true,
            size: stats.size,
            lines: content.split('\n').length,
            content: content
        });
        
        console.log(`✅ ${fileName} - ${content.split('\n').length} 行, ${(stats.size/1024).toFixed(1)}KB`);
        
    } catch (error) {
        fileStats.push({
            name: fileName,
            exists: false,
            error: error.message
        });
        
        console.log(`❌ ${fileName} - 文件不存在`);
    }
});

console.log('\n📊 测试文件统计:');
console.log('-'.repeat(30));

let totalLines = 0;
let totalSize = 0;

fileStats.forEach(file => {
    if (file.exists) {
        totalLines += file.lines;
        totalSize += file.size;
    }
});

console.log(`总文件数: ${fileStats.filter(f => f.exists).length}/${testFiles.length}`);
console.log(`总行数: ${totalLines.toLocaleString()}`);
console.log(`总大小: ${(totalSize/1024).toFixed(1)}KB`);

console.log('\n🎯 测试内容分析:');
console.log('-'.repeat(30));

// 分析测试框架
const frameworkFile = fileStats.find(f => f.name === 'TestFramework.js');
if (frameworkFile && frameworkFile.exists) {
    const content = frameworkFile.content;
    const features = [];
    
    if (content.includes('describe(')) features.push('测试套件组织');
    if (content.includes('it(')) features.push('测试用例定义');
    if (content.includes('beforeEach')) features.push('钩子函数');
    if (content.includes('expect(')) features.push('断言系统');
    if (content.includes('createMock')) features.push('模拟对象');
    if (content.includes('createSpy')) features.push('间谍函数');
    if (content.includes('async')) features.push('异步测试');
    
    console.log('🔧 测试框架功能:');
    features.forEach(feature => console.log(`  ✓ ${feature}`));
}

// 分析测试覆盖范围
const testCoverage = [];

const adventureFile = fileStats.find(f => f.name === 'AdventureModeTests.js');
if (adventureFile && adventureFile.exists) {
    const content = adventureFile.content;
    const describeMatches = content.match(/describe\('[^']+'/g) || [];
    testCoverage.push({
        mode: '闯关模式',
        suites: describeMatches.length,
        tests: (content.match(/it\('[^']+'/g) || []).length
    });
}

const endlessFile = fileStats.find(f => f.name === 'EndlessModeTests.js');
if (endlessFile && endlessFile.exists) {
    const content = endlessFile.content;
    const describeMatches = content.match(/describe\('[^']+'/g) || [];
    testCoverage.push({
        mode: '无限模式',
        suites: describeMatches.length,
        tests: (content.match(/it\('[^']+'/g) || []).length
    });
}

const integrationFile = fileStats.find(f => f.name === 'IntegrationTests.js');
if (integrationFile && integrationFile.exists) {
    const content = integrationFile.content;
    const describeMatches = content.match(/describe\('[^']+'/g) || [];
    testCoverage.push({
        mode: '集成测试',
        suites: describeMatches.length,
        tests: (content.match(/it\('[^']+'/g) || []).length
    });
}

console.log('\n📋 测试覆盖范围:');
testCoverage.forEach(coverage => {
    console.log(`  ${coverage.mode}: ${coverage.suites} 个测试套件, ${coverage.tests} 个测试用例`);
});

const totalSuites = testCoverage.reduce((sum, c) => sum + c.suites, 0);
const totalTests = testCoverage.reduce((sum, c) => sum + c.tests, 0);
console.log(`  总计: ${totalSuites} 个测试套件, ${totalTests} 个测试用例`);

// 检查HTML测试运行器
const htmlFile = fileStats.find(f => f.name === 'TestRunner.html');
if (htmlFile && htmlFile.exists) {
    const content = htmlFile.content;
    const features = [];
    
    if (content.includes('测试运行器')) features.push('可视化界面');
    if (content.includes('progressFill')) features.push('进度显示');
    if (content.includes('filter')) features.push('测试过滤');
    if (content.includes('console')) features.push('控制台输出');
    if (content.includes('stat')) features.push('统计信息');
    
    console.log('\n🖥️ HTML测试运行器功能:');
    features.forEach(feature => console.log(`  ✓ ${feature}`));
}

console.log('\n🚀 使用方法:');
console.log('  1. 在浏览器中打开 TestRunner.html');
console.log('  2. 点击"运行所有测试"查看完整测试结果');
console.log('  3. 使用过滤器查看特定模式的测试');
console.log('  4. 查看详细的错误信息和执行时间');

console.log('\n✨ 测试套件创建完成！');
console.log(`📁 位置: ${__dirname}`);
console.log(`🎯 目标: 确保塔防游戏两大核心模式的稳定性和可靠性`);

// 验证结果总结
const allFilesExist = fileStats.every(f => f.exists);
if (allFilesExist) {
    console.log('\n🎉 所有测试文件创建成功，可以开始使用！');
} else {
    console.log('\n⚠️ 部分文件缺失，请检查文件完整性');
}
