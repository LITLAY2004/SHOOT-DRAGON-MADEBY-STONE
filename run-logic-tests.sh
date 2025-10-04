#!/bin/bash
# 运行逻辑漏洞测试

echo "运行逻辑漏洞和边界条件测试..."
echo ""

cd "$(dirname "$0")"
npx jest tests/LogicVulnerabilityTests.test.js --verbose

echo ""
echo "测试完成!"

