/**
 * 简单但强大的测试框架
 * 支持单元测试、集成测试、性能测试
 */

class TestFramework {
    constructor() {
        this.tests = [];
        this.results = {
            passed: 0,
            failed: 0,
            skipped: 0,
            total: 0
        };
        this.startTime = null;
        this.endTime = null;
        this.currentSuite = null;
        this.beforeEachFns = [];
        this.afterEachFns = [];
        this.beforeAllFns = [];
        this.afterAllFns = [];
    }

    // 测试套件
    describe(description, fn) {
        const previousSuite = this.currentSuite;
        this.currentSuite = {
            description,
            tests: [],
            beforeEach: [],
            afterEach: [],
            beforeAll: [],
            afterAll: []
        };
        
        console.log(`\n📋 测试套件: ${description}`);
        console.log('═'.repeat(50));
        
        fn();
        
        this.currentSuite = previousSuite;
    }

    // 单个测试
    it(description, fn) {
        const test = {
            description,
            fn,
            suite: this.currentSuite?.description || 'Global',
            status: 'pending'
        };
        
        this.tests.push(test);
        if (this.currentSuite) {
            this.currentSuite.tests.push(test);
        }
    }

    // 跳过测试
    xit(description, fn) {
        this.it(`[SKIPPED] ${description}`, () => {
            throw new Error('SKIPPED');
        });
    }

    // 生命周期钩子
    beforeEach(fn) {
        if (this.currentSuite) {
            this.currentSuite.beforeEach.push(fn);
        } else {
            this.beforeEachFns.push(fn);
        }
    }

    afterEach(fn) {
        if (this.currentSuite) {
            this.currentSuite.afterEach.push(fn);
        } else {
            this.afterEachFns.push(fn);
        }
    }

    beforeAll(fn) {
        if (this.currentSuite) {
            this.currentSuite.beforeAll.push(fn);
        } else {
            this.beforeAllFns.push(fn);
        }
    }

    afterAll(fn) {
        if (this.currentSuite) {
            this.currentSuite.afterAll.push(fn);
        } else {
            this.afterAllFns.push(fn);
        }
    }

    // 断言方法
    expect(actual) {
        return new Expectation(actual);
    }

    // 异步测试支持
    async runAsync(fn) {
        if (fn.constructor.name === 'AsyncFunction') {
            return await fn();
        }
        return fn();
    }

    // 运行所有测试
    async run() {
        this.startTime = Date.now();
        console.log('🚀 开始运行测试...\n');

        // 运行全局 beforeAll
        for (const fn of this.beforeAllFns) {
            await this.runAsync(fn);
        }

        for (const test of this.tests) {
            this.results.total++;
            
            try {
                // 运行 beforeEach
                for (const fn of this.beforeEachFns) {
                    await this.runAsync(fn);
                }

                // 运行测试
                await this.runAsync(test.fn);
                
                test.status = 'passed';
                this.results.passed++;
                console.log(`✅ ${test.description}`);
                
                // 运行 afterEach
                for (const fn of this.afterEachFns) {
                    await this.runAsync(fn);
                }
                
            } catch (error) {
                if (error.message === 'SKIPPED') {
                    test.status = 'skipped';
                    this.results.skipped++;
                    console.log(`⏭️  ${test.description}`);
                } else {
                    test.status = 'failed';
                    test.error = error;
                    this.results.failed++;
                    console.log(`❌ ${test.description}`);
                    console.log(`   错误: ${error.message}`);
                    if (error.stack) {
                        console.log(`   堆栈: ${error.stack.split('\n')[1]?.trim()}`);
                    }
                }
            }
        }

        // 运行全局 afterAll
        for (const fn of this.afterAllFns) {
            await this.runAsync(fn);
        }

        this.endTime = Date.now();
        this.printSummary();
    }

    // 打印测试摘要
    printSummary() {
        const duration = this.endTime - this.startTime;
        
        console.log('\n' + '═'.repeat(50));
        console.log('📊 测试结果摘要');
        console.log('═'.repeat(50));
        console.log(`✅ 通过: ${this.results.passed}`);
        console.log(`❌ 失败: ${this.results.failed}`);
        console.log(`⏭️  跳过: ${this.results.skipped}`);
        console.log(`📊 总计: ${this.results.total}`);
        console.log(`⏱️  耗时: ${duration}ms`);
        
        const successRate = ((this.results.passed / this.results.total) * 100).toFixed(1);
        console.log(`📈 成功率: ${successRate}%`);
        
        if (this.results.failed > 0) {
            console.log('\n❌ 失败的测试:');
            this.tests.filter(t => t.status === 'failed').forEach(test => {
                console.log(`   - ${test.description}: ${test.error.message}`);
            });
        }
        
        console.log('\n' + (this.results.failed === 0 ? '🎉 所有测试通过!' : '⚠️  有测试失败'));
    }

    // 性能测试
    benchmark(name, fn, iterations = 1000) {
        return new Promise(async (resolve) => {
            console.log(`⚡ 性能测试: ${name} (${iterations}次迭代)`);
            
            const times = [];
            for (let i = 0; i < iterations; i++) {
                const start = performance.now();
                await this.runAsync(fn);
                const end = performance.now();
                times.push(end - start);
            }
            
            const avg = times.reduce((a, b) => a + b, 0) / times.length;
            const min = Math.min(...times);
            const max = Math.max(...times);
            
            console.log(`   平均: ${avg.toFixed(2)}ms`);
            console.log(`   最小: ${min.toFixed(2)}ms`);
            console.log(`   最大: ${max.toFixed(2)}ms`);
            
            resolve({ avg, min, max, times });
        });
    }
}

// 断言类
class Expectation {
    constructor(actual) {
        this.actual = actual;
    }

    toBe(expected) {
        if (this.actual !== expected) {
            throw new Error(`期望 ${expected}, 但得到 ${this.actual}`);
        }
        return this;
    }

    toEqual(expected) {
        if (JSON.stringify(this.actual) !== JSON.stringify(expected)) {
            throw new Error(`期望 ${JSON.stringify(expected)}, 但得到 ${JSON.stringify(this.actual)}`);
        }
        return this;
    }

    toBeTruthy() {
        if (!this.actual) {
            throw new Error(`期望真值, 但得到 ${this.actual}`);
        }
        return this;
    }

    toBeFalsy() {
        if (this.actual) {
            throw new Error(`期望假值, 但得到 ${this.actual}`);
        }
        return this;
    }

    toBeNull() {
        if (this.actual !== null) {
            throw new Error(`期望 null, 但得到 ${this.actual}`);
        }
        return this;
    }

    toBeUndefined() {
        if (this.actual !== undefined) {
            throw new Error(`期望 undefined, 但得到 ${this.actual}`);
        }
        return this;
    }

    toBeInstanceOf(constructor) {
        if (!(this.actual instanceof constructor)) {
            throw new Error(`期望 ${constructor.name} 实例, 但得到 ${typeof this.actual}`);
        }
        return this;
    }

    toHaveProperty(property) {
        if (!(property in this.actual)) {
            throw new Error(`期望对象有属性 "${property}"`);
        }
        return this;
    }

    toHaveLength(length) {
        if (this.actual.length !== length) {
            throw new Error(`期望长度 ${length}, 但得到 ${this.actual.length}`);
        }
        return this;
    }

    toBeGreaterThan(value) {
        if (this.actual <= value) {
            throw new Error(`期望 > ${value}, 但得到 ${this.actual}`);
        }
        return this;
    }

    toBeLessThan(value) {
        if (this.actual >= value) {
            throw new Error(`期望 < ${value}, 但得到 ${this.actual}`);
        }
        return this;
    }

    toBeCloseTo(expected, precision = 2) {
        const pass = Math.abs(this.actual - expected) < Math.pow(10, -precision) / 2;
        if (!pass) {
            throw new Error(`期望 ${this.actual} 接近 ${expected} (精度: ${precision})`);
        }
        return this;
    }

    toThrow(expectedError) {
        let threw = false;
        let actualError = null;
        
        try {
            if (typeof this.actual === 'function') {
                this.actual();
            }
        } catch (error) {
            threw = true;
            actualError = error;
        }
        
        if (!threw) {
            throw new Error('期望抛出异常，但没有异常被抛出');
        }
        
        if (expectedError && actualError.message !== expectedError) {
            throw new Error(`期望异常消息 "${expectedError}", 但得到 "${actualError.message}"`);
        }
        
        return this;
    }
}

// Mock 工具
class MockUtils {
    static createMockCanvas(width = 800, height = 600) {
        const canvas = {
            width,
            height,
            getContext: (type) => {
                if (type === '2d') {
                    return MockUtils.createMock2DContext();
                }
                return null;
            },
            addEventListener: () => {},
            removeEventListener: () => {},
            getBoundingClientRect: () => ({
                left: 0, top: 0, right: width, bottom: height,
                width, height, x: 0, y: 0
            })
        };
        return canvas;
    }

    static createMock2DContext() {
        const calls = [];
        const context = {
            // 记录所有方法调用
            _calls: calls,
            
            // 绘制方法
            fillRect: (...args) => calls.push(['fillRect', args]),
            strokeRect: (...args) => calls.push(['strokeRect', args]),
            clearRect: (...args) => calls.push(['clearRect', args]),
            arc: (...args) => calls.push(['arc', args]),
            beginPath: (...args) => calls.push(['beginPath', args]),
            closePath: (...args) => calls.push(['closePath', args]),
            fill: (...args) => calls.push(['fill', args]),
            stroke: (...args) => calls.push(['stroke', args]),
            moveTo: (...args) => calls.push(['moveTo', args]),
            lineTo: (...args) => calls.push(['lineTo', args]),
            
            // 变换方法
            save: (...args) => calls.push(['save', args]),
            restore: (...args) => calls.push(['restore', args]),
            translate: (...args) => calls.push(['translate', args]),
            rotate: (...args) => calls.push(['rotate', args]),
            scale: (...args) => calls.push(['scale', args]),
            
            // 属性
            fillStyle: '#000000',
            strokeStyle: '#000000',
            lineWidth: 1,
            font: '10px sans-serif',
            textAlign: 'start',
            textBaseline: 'alphabetic',
            globalAlpha: 1,
            globalCompositeOperation: 'source-over',
            
            // 文本方法
            fillText: (...args) => calls.push(['fillText', args]),
            strokeText: (...args) => calls.push(['strokeText', args]),
            measureText: (text) => ({ width: text.length * 6 }),
            
            // 图像方法
            drawImage: (...args) => calls.push(['drawImage', args]),
            
            // 路径方法
            rect: (...args) => calls.push(['rect', args]),
            
            // 渐变方法
            createLinearGradient: () => ({
                addColorStop: () => {}
            }),
            createRadialGradient: () => ({
                addColorStop: () => {}
            })
        };
        
        return context;
    }

    static spy(obj, method) {
        const original = obj[method];
        const calls = [];
        
        obj[method] = function(...args) {
            calls.push({ args, result: null, error: null });
            try {
                const result = original.apply(this, args);
                calls[calls.length - 1].result = result;
                return result;
            } catch (error) {
                calls[calls.length - 1].error = error;
                throw error;
            }
        };
        
        obj[method].calls = calls;
        obj[method].restore = () => {
            obj[method] = original;
        };
        
        return obj[method];
    }

    static mock(obj, method, implementation) {
        const original = obj[method];
        obj[method] = implementation;
        
        return {
            restore: () => {
                obj[method] = original;
            }
        };
    }
}

// 创建全局实例
const globalTestFramework = new TestFramework();

// 导出全局实例和类
if (typeof window !== 'undefined') {
    window.TestFramework = TestFramework;
    window.MockUtils = MockUtils;
    window.testFramework = globalTestFramework;
    
    // 全局测试方法
    window.describe = globalTestFramework.describe.bind(globalTestFramework);
    window.it = globalTestFramework.it.bind(globalTestFramework);
    window.xit = globalTestFramework.xit.bind(globalTestFramework);
    window.expect = globalTestFramework.expect.bind(globalTestFramework);
    window.beforeEach = globalTestFramework.beforeEach.bind(globalTestFramework);
    window.afterEach = globalTestFramework.afterEach.bind(globalTestFramework);
    window.beforeAll = globalTestFramework.beforeAll.bind(globalTestFramework);
    window.afterAll = globalTestFramework.afterAll.bind(globalTestFramework);
} else if (typeof module !== 'undefined') {
    module.exports = { 
        TestFramework, 
        MockUtils,
        testFramework: globalTestFramework,
        describe: globalTestFramework.describe.bind(globalTestFramework),
        it: globalTestFramework.it.bind(globalTestFramework),
        xit: globalTestFramework.xit.bind(globalTestFramework),
        expect: globalTestFramework.expect.bind(globalTestFramework),
        beforeEach: globalTestFramework.beforeEach.bind(globalTestFramework),
        afterEach: globalTestFramework.afterEach.bind(globalTestFramework),
        beforeAll: globalTestFramework.beforeAll.bind(globalTestFramework),
        afterAll: globalTestFramework.afterAll.bind(globalTestFramework)
    };
}
