/**
 * 简单测试验证测试框架工作正常
 */

// 导入测试框架
const { testFramework, describe, it, expect } = require('./tests/test-framework.js');

// 创建简单的测试
describe('测试框架验证', () => {
    it('基础断言应该工作', () => {
        expect(1 + 1).toBe(2);
        expect('hello').toBe('hello');
        expect(true).toBeTruthy();
        expect(false).toBeFalsy();
    });

    it('对象断言应该工作', () => {
        const obj = { a: 1, b: 2 };
        expect(obj).toHaveProperty('a');
        expect(obj.a).toBe(1);
    });

    it('数组断言应该工作', () => {
        const arr = [1, 2, 3];
        expect(arr).toHaveLength(3);
        expect(arr[0]).toBe(1);
    });

    it('数值比较应该工作', () => {
        expect(10).toBeGreaterThan(5);
        expect(3).toBeLessThan(5);
        expect(3.14159).toBeCloseTo(3.14, 2);
    });
});

// 运行测试
async function runTest() {
    console.log('🧪 运行简单测试验证...');
    await testFramework.run();
    
    if (testFramework.results.failed === 0) {
        console.log('✅ 测试框架工作正常！');
        process.exit(0);
    } else {
        console.log('❌ 测试框架有问题');
        process.exit(1);
    }
}

runTest();
