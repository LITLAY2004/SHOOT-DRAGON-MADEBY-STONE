/**
 * 综合测试运行器和报告系统
 * 运行所有测试套件并生成详细报告
 */

// 导入测试框架
if (typeof require !== 'undefined') {
    const { TestFramework, MockUtils } = require('./test-framework.js');
    global.TestFramework = TestFramework;
    global.MockUtils = MockUtils;
}

class TestRunner {
    constructor() {
        this.testSuites = [];
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            suites: [],
            startTime: null,
            endTime: null,
            duration: 0
        };
        this.config = {
            parallel: false,
            timeout: 30000,
            verbose: true,
            generateReport: true,
            reportFormat: 'html'
        };
    }

    // 添加测试套件
    addTestSuite(name, testModule) {
        this.testSuites.push({
            name,
            module: testModule,
            framework: testModule.testFramework
        });
    }

    // 设置配置
    configure(options) {
        Object.assign(this.config, options);
    }

    // 运行所有测试
    async runAll() {
        console.log('🚀 开始运行所有测试套件...\n');
        this.results.startTime = Date.now();

        if (this.config.parallel) {
            await this.runParallel();
        } else {
            await this.runSequential();
        }

        this.results.endTime = Date.now();
        this.results.duration = this.results.endTime - this.results.startTime;

        this.printSummary();

        if (this.config.generateReport) {
            await this.generateReport();
        }

        return this.results;
    }

    // 顺序运行测试
    async runSequential() {
        for (const suite of this.testSuites) {
            console.log(`\n📋 运行测试套件: ${suite.name}`);
            console.log('═'.repeat(60));

            try {
                await suite.framework.run();
                
                const suiteResult = {
                    name: suite.name,
                    passed: suite.framework.results.passed,
                    failed: suite.framework.results.failed,
                    skipped: suite.framework.results.skipped,
                    total: suite.framework.results.total,
                    duration: suite.framework.endTime - suite.framework.startTime,
                    status: suite.framework.results.failed === 0 ? 'passed' : 'failed'
                };

                this.results.suites.push(suiteResult);
                this.results.total += suiteResult.total;
                this.results.passed += suiteResult.passed;
                this.results.failed += suiteResult.failed;
                this.results.skipped += suiteResult.skipped;

            } catch (error) {
                console.error(`❌ 测试套件 ${suite.name} 运行失败:`, error.message);
                
                const suiteResult = {
                    name: suite.name,
                    passed: 0,
                    failed: 1,
                    skipped: 0,
                    total: 1,
                    duration: 0,
                    status: 'error',
                    error: error.message
                };

                this.results.suites.push(suiteResult);
                this.results.total += 1;
                this.results.failed += 1;
            }
        }
    }

    // 并行运行测试
    async runParallel() {
        const promises = this.testSuites.map(async (suite) => {
            console.log(`\n📋 启动测试套件: ${suite.name}`);
            
            try {
                await suite.framework.run();
                
                return {
                    name: suite.name,
                    passed: suite.framework.results.passed,
                    failed: suite.framework.results.failed,
                    skipped: suite.framework.results.skipped,
                    total: suite.framework.results.total,
                    duration: suite.framework.endTime - suite.framework.startTime,
                    status: suite.framework.results.failed === 0 ? 'passed' : 'failed'
                };
            } catch (error) {
                return {
                    name: suite.name,
                    passed: 0,
                    failed: 1,
                    skipped: 0,
                    total: 1,
                    duration: 0,
                    status: 'error',
                    error: error.message
                };
            }
        });

        const suiteResults = await Promise.all(promises);
        
        suiteResults.forEach(result => {
            this.results.suites.push(result);
            this.results.total += result.total;
            this.results.passed += result.passed;
            this.results.failed += result.failed;
            this.results.skipped += result.skipped;
        });
    }

    // 打印测试摘要
    printSummary() {
        console.log('\n' + '═'.repeat(80));
        console.log('📊 测试运行完成 - 总体摘要');
        console.log('═'.repeat(80));

        // 总体统计
        console.log(`📈 总体结果:`);
        console.log(`   ✅ 通过: ${this.results.passed}`);
        console.log(`   ❌ 失败: ${this.results.failed}`);
        console.log(`   ⏭️  跳过: ${this.results.skipped}`);
        console.log(`   📊 总计: ${this.results.total}`);
        console.log(`   ⏱️  总耗时: ${this.results.duration}ms`);

        const successRate = this.results.total > 0 
            ? ((this.results.passed / this.results.total) * 100).toFixed(1)
            : 0;
        console.log(`   📈 成功率: ${successRate}%`);

        // 各套件详情
        console.log(`\n📋 各测试套件详情:`);
        this.results.suites.forEach(suite => {
            const statusIcon = suite.status === 'passed' ? '✅' : 
                              suite.status === 'error' ? '💥' : '❌';
            console.log(`   ${statusIcon} ${suite.name}: ${suite.passed}/${suite.total} (${suite.duration}ms)`);
            
            if (suite.error) {
                console.log(`      错误: ${suite.error}`);
            }
        });

        // 失败的测试详情
        if (this.results.failed > 0) {
            console.log(`\n❌ 失败的测试套件:`);
            const failedSuites = this.results.suites.filter(s => s.status !== 'passed');
            failedSuites.forEach(suite => {
                console.log(`   - ${suite.name}: ${suite.failed} 个测试失败`);
            });
        }

        // 性能统计
        const avgDuration = this.results.suites.length > 0 
            ? (this.results.duration / this.results.suites.length).toFixed(1)
            : 0;
        console.log(`\n⚡ 性能统计:`);
        console.log(`   平均套件耗时: ${avgDuration}ms`);
        console.log(`   最快套件: ${Math.min(...this.results.suites.map(s => s.duration))}ms`);
        console.log(`   最慢套件: ${Math.max(...this.results.suites.map(s => s.duration))}ms`);

        // 最终状态
        console.log('\n' + '═'.repeat(80));
        if (this.results.failed === 0) {
            console.log('🎉 所有测试通过！游戏质量良好！');
        } else {
            console.log('⚠️  有测试失败，请检查并修复问题。');
        }
        console.log('═'.repeat(80));
    }

    // 生成测试报告
    async generateReport() {
        if (this.config.reportFormat === 'html') {
            await this.generateHTMLReport();
        } else if (this.config.reportFormat === 'json') {
            await this.generateJSONReport();
        }
    }

    // 生成HTML报告
    async generateHTMLReport() {
        const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>塔防游戏测试报告</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            margin: 0;
            font-size: 2.5em;
            font-weight: 300;
        }
        
        .header .subtitle {
            margin-top: 10px;
            opacity: 0.9;
            font-size: 1.1em;
        }
        
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 30px;
            background: #f8f9fa;
        }
        
        .metric {
            text-align: center;
            padding: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .metric-value {
            font-size: 2.5em;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .metric-label {
            color: #666;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .skipped { color: #ffc107; }
        .total { color: #007bff; }
        
        .suites {
            padding: 30px;
        }
        
        .suite {
            margin-bottom: 20px;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            overflow: hidden;
        }
        
        .suite-header {
            padding: 15px 20px;
            background: #f8f9fa;
            border-bottom: 1px solid #e9ecef;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .suite-name {
            font-weight: bold;
            font-size: 1.1em;
        }
        
        .suite-status {
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 0.8em;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .suite-status.passed {
            background: #d4edda;
            color: #155724;
        }
        
        .suite-status.failed {
            background: #f8d7da;
            color: #721c24;
        }
        
        .suite-status.error {
            background: #f8d7da;
            color: #721c24;
        }
        
        .suite-details {
            padding: 20px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
        }
        
        .suite-metric {
            text-align: center;
        }
        
        .suite-metric-value {
            font-size: 1.5em;
            font-weight: bold;
        }
        
        .suite-metric-label {
            color: #666;
            font-size: 0.8em;
        }
        
        .progress-bar {
            width: 100%;
            height: 8px;
            background: #e9ecef;
            border-radius: 4px;
            overflow: hidden;
            margin: 15px 0;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #28a745, #20c997);
            transition: width 0.3s ease;
        }
        
        .footer {
            padding: 20px 30px;
            background: #f8f9fa;
            border-top: 1px solid #e9ecef;
            text-align: center;
            color: #666;
        }
        
        .chart-container {
            margin: 20px 0;
            text-align: center;
        }
        
        .performance-chart {
            display: inline-block;
            margin: 10px;
            padding: 15px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎮 塔防游戏测试报告</h1>
            <div class="subtitle">
                生成时间: ${new Date().toLocaleString('zh-CN')} | 
                总耗时: ${this.results.duration}ms
            </div>
        </div>
        
        <div class="summary">
            <div class="metric">
                <div class="metric-value total">${this.results.total}</div>
                <div class="metric-label">总测试数</div>
            </div>
            <div class="metric">
                <div class="metric-value passed">${this.results.passed}</div>
                <div class="metric-label">通过</div>
            </div>
            <div class="metric">
                <div class="metric-value failed">${this.results.failed}</div>
                <div class="metric-label">失败</div>
            </div>
            <div class="metric">
                <div class="metric-value skipped">${this.results.skipped}</div>
                <div class="metric-label">跳过</div>
            </div>
            <div class="metric">
                <div class="metric-value total">${this.results.total > 0 ? ((this.results.passed / this.results.total) * 100).toFixed(1) : 0}%</div>
                <div class="metric-label">成功率</div>
            </div>
        </div>
        
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${this.results.total > 0 ? (this.results.passed / this.results.total) * 100 : 0}%"></div>
        </div>
        
        <div class="suites">
            <h2>📋 测试套件详情</h2>
            ${this.results.suites.map(suite => `
                <div class="suite">
                    <div class="suite-header">
                        <div class="suite-name">${suite.name}</div>
                        <div class="suite-status ${suite.status}">${suite.status}</div>
                    </div>
                    <div class="suite-details">
                        <div class="suite-metric">
                            <div class="suite-metric-value total">${suite.total}</div>
                            <div class="suite-metric-label">总计</div>
                        </div>
                        <div class="suite-metric">
                            <div class="suite-metric-value passed">${suite.passed}</div>
                            <div class="suite-metric-label">通过</div>
                        </div>
                        <div class="suite-metric">
                            <div class="suite-metric-value failed">${suite.failed}</div>
                            <div class="suite-metric-label">失败</div>
                        </div>
                        <div class="suite-metric">
                            <div class="suite-metric-value skipped">${suite.skipped}</div>
                            <div class="suite-metric-label">跳过</div>
                        </div>
                        <div class="suite-metric">
                            <div class="suite-metric-value">${suite.duration}ms</div>
                            <div class="suite-metric-label">耗时</div>
                        </div>
                        <div class="suite-metric">
                            <div class="suite-metric-value">${suite.total > 0 ? ((suite.passed / suite.total) * 100).toFixed(1) : 0}%</div>
                            <div class="suite-metric-label">成功率</div>
                        </div>
                    </div>
                    ${suite.error ? `<div style="padding: 20px; background: #f8d7da; color: #721c24; border-top: 1px solid #f5c6cb;"><strong>错误:</strong> ${suite.error}</div>` : ''}
                </div>
            `).join('')}
        </div>
        
        <div class="chart-container">
            <h2>📊 性能统计</h2>
            <div class="performance-chart">
                <h4>平均耗时</h4>
                <div style="font-size: 2em; color: #007bff;">${this.results.suites.length > 0 ? (this.results.duration / this.results.suites.length).toFixed(1) : 0}ms</div>
            </div>
            <div class="performance-chart">
                <h4>最快套件</h4>
                <div style="font-size: 2em; color: #28a745;">${this.results.suites.length > 0 ? Math.min(...this.results.suites.map(s => s.duration)) : 0}ms</div>
            </div>
            <div class="performance-chart">
                <h4>最慢套件</h4>
                <div style="font-size: 2em; color: #dc3545;">${this.results.suites.length > 0 ? Math.max(...this.results.suites.map(s => s.duration)) : 0}ms</div>
            </div>
        </div>
        
        <div class="footer">
            <p>
                🚀 塔防游戏自动化测试系统 | 
                ${this.results.failed === 0 ? '🎉 所有测试通过！' : '⚠️ 有测试失败，请检查修复。'}
            </p>
        </div>
    </div>
</body>
</html>`;

        try {
            // 在Node.js环境中写入文件
            if (typeof require !== 'undefined') {
                const fs = require('fs');
                fs.writeFileSync('./test-report.html', html);
                console.log('📄 HTML测试报告已生成: test-report.html');
            }
            
            // 在浏览器环境中显示报告
            if (typeof window !== 'undefined') {
                const reportWindow = window.open('', '_blank');
                reportWindow.document.write(html);
                reportWindow.document.close();
                console.log('📄 HTML测试报告已在新窗口中打开');
            }
        } catch (error) {
            console.warn('⚠️ 无法生成HTML报告:', error.message);
        }
    }

    // 生成JSON报告
    async generateJSONReport() {
        const report = {
            summary: {
                total: this.results.total,
                passed: this.results.passed,
                failed: this.results.failed,
                skipped: this.results.skipped,
                successRate: this.results.total > 0 ? (this.results.passed / this.results.total) * 100 : 0,
                duration: this.results.duration,
                timestamp: new Date().toISOString()
            },
            suites: this.results.suites,
            config: this.config
        };

        try {
            if (typeof require !== 'undefined') {
                const fs = require('fs');
                fs.writeFileSync('./test-report.json', JSON.stringify(report, null, 2));
                console.log('📄 JSON测试报告已生成: test-report.json');
            }
        } catch (error) {
            console.warn('⚠️ 无法生成JSON报告:', error.message);
        }
    }

    // 运行特定测试套件
    async runSuite(suiteName) {
        const suite = this.testSuites.find(s => s.name === suiteName);
        if (!suite) {
            throw new Error(`测试套件 "${suiteName}" 不存在`);
        }

        console.log(`\n📋 运行单个测试套件: ${suiteName}`);
        console.log('═'.repeat(60));

        await suite.framework.run();
        
        return {
            name: suite.name,
            passed: suite.framework.results.passed,
            failed: suite.framework.results.failed,
            skipped: suite.framework.results.skipped,
            total: suite.framework.results.total,
            duration: suite.framework.endTime - suite.framework.startTime
        };
    }

    // 获取测试覆盖率信息
    getCoverageInfo() {
        // 这里可以集成代码覆盖率工具
        return {
            lines: { covered: 0, total: 0, percentage: 0 },
            functions: { covered: 0, total: 0, percentage: 0 },
            branches: { covered: 0, total: 0, percentage: 0 }
        };
    }

    // 监控测试运行
    watch() {
        console.log('👀 开启测试监控模式...');
        
        // 模拟文件监控
        setInterval(() => {
            console.log('🔄 检查文件变化...');
            // 这里可以集成文件监控逻辑
        }, 5000);
    }
}

// 创建全局测试运行器实例
const testRunner = new TestRunner();

// 自动加载测试套件（如果在浏览器环境中）
if (typeof window !== 'undefined') {
    // 浏览器环境自动运行
    window.addEventListener('load', async () => {
        try {
            console.log('🌐 浏览器环境检测到，准备运行测试...');
            
            // 这里需要手动添加测试套件
            // testRunner.addTestSuite('单元测试', unitTestModule);
            // testRunner.addTestSuite('集成测试', integrationTestModule);
            
            // 配置测试运行器
            testRunner.configure({
                parallel: false,
                verbose: true,
                generateReport: true,
                reportFormat: 'html'
            });
            
            // 运行所有测试
            await testRunner.runAll();
            
        } catch (error) {
            console.error('❌ 测试运行失败:', error);
        }
    });
}

// Node.js环境导出
if (typeof module !== 'undefined') {
    module.exports = { TestRunner, testRunner };
}

// 全局导出
if (typeof window !== 'undefined') {
    window.TestRunner = TestRunner;
    window.testRunner = testRunner;
}
