/**
 * 简单而强大的单元测试框架
 * 专为塔防游戏模式测试设计
 */

class TestFramework {
    constructor() {
        this.tests = [];
        this.suites = new Map();
        this.results = {
            passed: 0,
            failed: 0,
            skipped: 0,
            errors: []
        };
        this.startTime = null;
        this.endTime = null;
    }

    /**
     * 创建测试套件
     */
    describe(suiteName, testFunction) {
        const suite = {
            name: suiteName,
            tests: [],
            beforeEach: null,
            afterEach: null,
            beforeAll: null,
            afterAll: null
        };

        this.suites.set(suiteName, suite);
        this.currentSuite = suite;
        
        testFunction();
        
        this.currentSuite = null;
        return suite;
    }

    /**
     * 定义单个测试
     */
    it(testName, testFunction) {
        const test = {
            name: testName,
            function: testFunction,
            suite: this.currentSuite ? this.currentSuite.name : 'Global',
            status: 'pending',
            error: null,
            duration: 0
        };

        if (this.currentSuite) {
            this.currentSuite.tests.push(test);
        }
        
        this.tests.push(test);
        return test;
    }

    /**
     * 设置钩子函数
     */
    beforeEach(hookFunction) {
        if (this.currentSuite) {
            this.currentSuite.beforeEach = hookFunction;
        }
    }

    afterEach(hookFunction) {
        if (this.currentSuite) {
            this.currentSuite.afterEach = hookFunction;
        }
    }

    beforeAll(hookFunction) {
        if (this.currentSuite) {
            this.currentSuite.beforeAll = hookFunction;
        }
    }

    afterAll(hookFunction) {
        if (this.currentSuite) {
            this.currentSuite.afterAll = hookFunction;
        }
    }

    /**
     * 断言方法
     */
    expect(actual) {
        return {
            toBe: (expected) => {
                if (actual !== expected) {
                    throw new Error(`Expected ${actual} to be ${expected}`);
                }
                return true;
            },
            
            toEqual: (expected) => {
                if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                    throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
                }
                return true;
            },
            
            toBeGreaterThan: (expected) => {
                if (actual <= expected) {
                    throw new Error(`Expected ${actual} to be greater than ${expected}`);
                }
                return true;
            },
            
            toBeLessThan: (expected) => {
                if (actual >= expected) {
                    throw new Error(`Expected ${actual} to be less than ${expected}`);
                }
                return true;
            },
            
            toBeGreaterThanOrEqual: (expected) => {
                if (actual < expected) {
                    throw new Error(`Expected ${actual} to be greater than or equal to ${expected}`);
                }
                return true;
            },
            
            toBeTruthy: () => {
                if (!actual) {
                    throw new Error(`Expected ${actual} to be truthy`);
                }
                return true;
            },
            
            toBeFalsy: () => {
                if (actual) {
                    throw new Error(`Expected ${actual} to be falsy`);
                }
                return true;
            },
            
            toBeUndefined: () => {
                if (actual !== undefined) {
                    throw new Error(`Expected ${actual} to be undefined`);
                }
                return true;
            },
            
            toContain: (expected) => {
                if (!actual.includes || !actual.includes(expected)) {
                    throw new Error(`Expected ${actual} to contain ${expected}`);
                }
                return true;
            },
            
            toHaveProperty: (property) => {
                if (!(property in actual)) {
                    throw new Error(`Expected object to have property ${property}`);
                }
                return true;
            },
            
            toBeInstanceOf: (expectedClass) => {
                if (!(actual instanceof expectedClass)) {
                    throw new Error(`Expected ${actual} to be instance of ${expectedClass.name}`);
                }
                return true;
            },
            
            toThrow: () => {
                let threw = false;
                try {
                    if (typeof actual === 'function') {
                        actual();
                    }
                } catch (e) {
                    threw = true;
                }
                if (!threw) {
                    throw new Error('Expected function to throw');
                }
                return true;
            }
        };
    }

    /**
     * 模拟对象创建
     */
    createMock(methods = {}) {
        const mock = {
            calls: {},
            callCount: 0
        };

        Object.keys(methods).forEach(method => {
            mock.calls[method] = [];
            mock[method] = (...args) => {
                mock.calls[method].push(args);
                mock.callCount++;
                if (typeof methods[method] === 'function') {
                    return methods[method](...args);
                }
                return methods[method];
            };
        });

        return mock;
    }

    /**
     * 创建间谍函数
     */
    createSpy(originalFunction = () => {}) {
        const spy = (...args) => {
            spy.calls.push(args);
            spy.callCount++;
            return originalFunction(...args);
        };
        
        spy.calls = [];
        spy.callCount = 0;
        
        return spy;
    }

    /**
     * 异步测试支持
     */
    async runAsyncTest(test, suite) {
        const startTime = performance.now();
        
        try {
            // 运行beforeEach
            if (suite && suite.beforeEach) {
                await suite.beforeEach();
            }
            
            // 运行测试
            await test.function();
            
            test.status = 'passed';
            this.results.passed++;
            
        } catch (error) {
            test.status = 'failed';
            test.error = error;
            this.results.failed++;
            this.results.errors.push({
                suite: test.suite,
                test: test.name,
                error: error.message
            });
        } finally {
            // 运行afterEach
            if (suite && suite.afterEach) {
                try {
                    await suite.afterEach();
                } catch (error) {
                    console.warn('AfterEach hook failed:', error);
                }
            }
            
            test.duration = performance.now() - startTime;
        }
    }

    /**
     * 运行所有测试
     */
    async run() {
        console.log('🧪 开始运行测试...');
        this.startTime = performance.now();
        
        // 重置结果
        this.results = {
            passed: 0,
            failed: 0,
            skipped: 0,
            errors: []
        };

        // 按套件运行测试
        for (const [suiteName, suite] of this.suites) {
            console.log(`📋 运行测试套件: ${suiteName}`);
            
            // 运行beforeAll
            if (suite.beforeAll) {
                try {
                    await suite.beforeAll();
                } catch (error) {
                    console.error(`BeforeAll hook failed in ${suiteName}:`, error);
                }
            }
            
            // 运行套件中的测试
            for (const test of suite.tests) {
                await this.runAsyncTest(test, suite);
                console.log(`  ${test.status === 'passed' ? '✅' : '❌'} ${test.name} (${test.duration.toFixed(2)}ms)`);
            }
            
            // 运行afterAll
            if (suite.afterAll) {
                try {
                    await suite.afterAll();
                } catch (error) {
                    console.warn(`AfterAll hook failed in ${suiteName}:`, error);
                }
            }
        }

        this.endTime = performance.now();
        this.printResults();
        return this.results;
    }

    /**
     * 打印测试结果
     */
    printResults() {
        const duration = this.endTime - this.startTime;
        const total = this.results.passed + this.results.failed + this.results.skipped;
        
        console.log('\n📊 测试结果总结:');
        console.log(`总耗时: ${duration.toFixed(2)}ms`);
        console.log(`总测试数: ${total}`);
        console.log(`✅ 通过: ${this.results.passed}`);
        console.log(`❌ 失败: ${this.results.failed}`);
        console.log(`⏭️ 跳过: ${this.results.skipped}`);
        
        if (this.results.errors.length > 0) {
            console.log('\n❌ 失败详情:');
            this.results.errors.forEach(error => {
                console.log(`  ${error.suite} > ${error.test}: ${error.error}`);
            });
        }
        
        if (this.results.failed === 0) {
            console.log('\n🎉 所有测试通过！');
        }
    }

    /**
     * 生成HTML报告
     */
    generateHTMLReport() {
        const duration = this.endTime - this.startTime;
        const total = this.results.passed + this.results.failed + this.results.skipped;
        
        let html = `
        <div class="test-report">
            <div class="test-summary">
                <h3>测试结果总结</h3>
                <div class="summary-stats">
                    <div class="stat">
                        <span class="label">总耗时:</span>
                        <span class="value">${duration.toFixed(2)}ms</span>
                    </div>
                    <div class="stat">
                        <span class="label">总测试数:</span>
                        <span class="value">${total}</span>
                    </div>
                    <div class="stat success">
                        <span class="label">通过:</span>
                        <span class="value">${this.results.passed}</span>
                    </div>
                    <div class="stat ${this.results.failed > 0 ? 'failure' : ''}">
                        <span class="label">失败:</span>
                        <span class="value">${this.results.failed}</span>
                    </div>
                </div>
            </div>
            
            <div class="test-suites">
        `;
        
        for (const [suiteName, suite] of this.suites) {
            html += `
                <div class="test-suite">
                    <h4>${suiteName}</h4>
                    <div class="test-cases">
            `;
            
            suite.tests.forEach(test => {
                const statusClass = test.status === 'passed' ? 'success' : 'failure';
                const icon = test.status === 'passed' ? '✅' : '❌';
                
                html += `
                    <div class="test-case ${statusClass}">
                        <span class="icon">${icon}</span>
                        <span class="name">${test.name}</span>
                        <span class="duration">${test.duration.toFixed(2)}ms</span>
                        ${test.error ? `<div class="error">${test.error.message}</div>` : ''}
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        }
        
        html += `
            </div>
        </div>
        `;
        
        return html;
    }
}

// 创建全局测试实例
const testFramework = new TestFramework();

// 导出全局函数
const describe = testFramework.describe.bind(testFramework);
const it = testFramework.it.bind(testFramework);
const beforeEach = testFramework.beforeEach.bind(testFramework);
const afterEach = testFramework.afterEach.bind(testFramework);
const beforeAll = testFramework.beforeAll.bind(testFramework);
const afterAll = testFramework.afterAll.bind(testFramework);
const expect = testFramework.expect.bind(testFramework);

// 工具函数
const createMock = testFramework.createMock.bind(testFramework);
const createSpy = testFramework.createSpy.bind(testFramework);
const runTests = testFramework.run.bind(testFramework);

// Node.js 环境支持
if (typeof module !== 'undefined' && module.exports) {
    // 在 Node.js 环境中导出到全局
    global.testFramework = testFramework;
    global.describe = describe;
    global.it = it;
    global.beforeEach = beforeEach;
    global.afterEach = afterEach;
    global.beforeAll = beforeAll;
    global.afterAll = afterAll;
    global.expect = expect;
    global.createMock = createMock;
    global.createSpy = createSpy;
    global.runTests = runTests;
    global.ExpectMatcher = ExpectMatcher;
    global.TestFramework = TestFramework;
    
    module.exports = {
        TestFramework,
        ExpectMatcher,
        testFramework,
        describe,
        it,
        beforeEach,
        afterEach,
        beforeAll,
        afterAll,
        expect,
        createMock,
        createSpy,
        runTests
    };
}
