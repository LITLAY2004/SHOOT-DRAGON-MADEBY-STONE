/**
 * 数学工具类
 * 提供游戏中常用的数学计算函数
 */
class MathUtils {
    /**
     * 计算两点之间的距离
     * @param {number} x1 - 第一个点的x坐标
     * @param {number} y1 - 第一个点的y坐标
     * @param {number} x2 - 第二个点的x坐标
     * @param {number} y2 - 第二个点的y坐标
     * @returns {number} 距离
     */
    static distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * 计算两点之间的距离平方（性能优化版本）
     * @param {number} x1 - 第一个点的x坐标
     * @param {number} y1 - 第一个点的y坐标
     * @param {number} x2 - 第二个点的x坐标
     * @param {number} y2 - 第二个点的y坐标
     * @returns {number} 距离的平方
     */
    static distanceSquared(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return dx * dx + dy * dy;
    }

    /**
     * 线性插值
     * @param {number} start - 起始值
     * @param {number} end - 结束值
     * @param {number} t - 插值参数 (0-1)
     * @returns {number} 插值结果
     */
    static lerp(start, end, t) {
        return start + (end - start) * t;
    }

    /**
     * 将数值限制在指定范围内
     * @param {number} value - 输入值
     * @param {number} min - 最小值
     * @param {number} max - 最大值
     * @returns {number} 限制后的值
     */
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    /**
     * 计算两点之间的角度（弧度）
     * @param {number} x1 - 第一个点的x坐标
     * @param {number} y1 - 第一个点的y坐标
     * @param {number} x2 - 第二个点的x坐标
     * @param {number} y2 - 第二个点的y坐标
     * @returns {number} 角度（弧度）
     */
    static angleBetween(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    }

    /**
     * 将角度标准化到 -π 到 π 范围内
     * @param {number} angle - 输入角度（弧度）
     * @returns {number} 标准化后的角度
     */
    static normalizeAngle(angle) {
        while (angle > Math.PI) angle -= 2 * Math.PI;
        while (angle < -Math.PI) angle += 2 * Math.PI;
        return angle;
    }

    /**
     * 角度转弧度
     * @param {number} degrees - 角度值
     * @returns {number} 弧度值
     */
    static degreesToRadians(degrees) {
        return degrees * Math.PI / 180;
    }

    /**
     * 弧度转角度
     * @param {number} radians - 弧度值
     * @returns {number} 角度值
     */
    static radiansToDegrees(radians) {
        return radians * 180 / Math.PI;
    }

    /**
     * 向量标准化
     * @param {Object} vector - 向量对象 {x, y}
     * @returns {Object} 标准化后的向量
     */
    static normalize(vector) {
        const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
        if (length === 0) {
            return { x: 0, y: 0 };
        }
        return {
            x: vector.x / length,
            y: vector.y / length
        };
    }

    /**
     * 向量点积
     * @param {Object} v1 - 第一个向量 {x, y}
     * @param {Object} v2 - 第二个向量 {x, y}
     * @returns {number} 点积结果
     */
    static dotProduct(v1, v2) {
        return v1.x * v2.x + v1.y * v2.y;
    }

    /**
     * 2D向量叉积（返回标量）
     * @param {Object} v1 - 第一个向量 {x, y}
     * @param {Object} v2 - 第二个向量 {x, y}
     * @returns {number} 叉积结果
     */
    static crossProduct(v1, v2) {
        return v1.x * v2.y - v1.y * v2.x;
    }

    /**
     * 计算向量长度
     * @param {Object} vector - 向量对象 {x, y}
     * @returns {number} 向量长度
     */
    static vectorLength(vector) {
        return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    }

    /**
     * 向量减法
     * @param {Object} v1 - 第一个向量 {x, y}
     * @param {Object} v2 - 第二个向量 {x, y}
     * @returns {Object} 结果向量
     */
    static vectorSubtract(v1, v2) {
        return {
            x: v1.x - v2.x,
            y: v1.y - v2.y
        };
    }

    /**
     * 向量加法
     * @param {Object} v1 - 第一个向量 {x, y}
     * @param {Object} v2 - 第二个向量 {x, y}
     * @returns {Object} 结果向量
     */
    static vectorAdd(v1, v2) {
        return {
            x: v1.x + v2.x,
            y: v1.y + v2.y
        };
    }

    /**
     * 向量标量乘法
     * @param {Object} vector - 向量对象 {x, y}
     * @param {number} scalar - 标量
     * @returns {Object} 结果向量
     */
    static vectorScale(vector, scalar) {
        return {
            x: vector.x * scalar,
            y: vector.y * scalar
        };
    }

    /**
     * 检查两个数值是否近似相等
     * @param {number} a - 第一个数值
     * @param {number} b - 第二个数值
     * @param {number} epsilon - 误差范围，默认为 1e-10
     * @returns {boolean} 是否近似相等
     */
    static approximately(a, b, epsilon = 1e-10) {
        return Math.abs(a - b) < epsilon;
    }

    /**
     * 在指定范围内生成随机数
     * @param {number} min - 最小值
     * @param {number} max - 最大值
     * @returns {number} 随机数
     */
    static randomFloat(min, max) {
        return min + Math.random() * (max - min);
    }

    /**
     * 在指定范围内生成随机整数
     * @param {number} min - 最小值（包含）
     * @param {number} max - 最大值（包含）
     * @returns {number} 随机整数
     */
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * 根据权重进行随机选择
     * @param {Array} items - 项目数组
     * @param {Array} weights - 对应的权重数组
     * @returns {any} 选中的项目
     */
    static weightedRandomChoice(items, weights) {
        if (items.length !== weights.length) {
            throw new Error('项目数量与权重数量不匹配');
        }

        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;

        for (let i = 0; i < items.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return items[i];
            }
        }

        // 备用返回最后一个项目
        return items[items.length - 1];
    }

    /**
     * 平滑阶跃函数
     * @param {number} edge0 - 下边界
     * @param {number} edge1 - 上边界
     * @param {number} x - 输入值
     * @returns {number} 平滑插值结果 (0-1)
     */
    static smoothstep(edge0, edge1, x) {
        const t = this.clamp((x - edge0) / (edge1 - edge0), 0, 1);
        return t * t * (3 - 2 * t);
    }

    /**
     * 将数值从一个范围映射到另一个范围
     * @param {number} value - 输入值
     * @param {number} fromMin - 原范围最小值
     * @param {number} fromMax - 原范围最大值
     * @param {number} toMin - 目标范围最小值
     * @param {number} toMax - 目标范围最大值
     * @returns {number} 映射后的值
     */
    static map(value, fromMin, fromMax, toMin, toMax) {
        const ratio = (value - fromMin) / (fromMax - fromMin);
        return toMin + ratio * (toMax - toMin);
    }

    /**
     * 检查点是否在圆内
     * @param {number} pointX - 点的x坐标
     * @param {number} pointY - 点的y坐标
     * @param {number} circleX - 圆心x坐标
     * @param {number} circleY - 圆心y坐标
     * @param {number} radius - 圆半径
     * @returns {boolean} 是否在圆内
     */
    static pointInCircle(pointX, pointY, circleX, circleY, radius) {
        return this.distanceSquared(pointX, pointY, circleX, circleY) <= radius * radius;
    }

    /**
     * 检查两个圆是否相交
     * @param {number} x1 - 第一个圆心x坐标
     * @param {number} y1 - 第一个圆心y坐标
     * @param {number} r1 - 第一个圆半径
     * @param {number} x2 - 第二个圆心x坐标
     * @param {number} y2 - 第二个圆心y坐标
     * @param {number} r2 - 第二个圆半径
     * @returns {boolean} 是否相交
     */
    static circlesIntersect(x1, y1, r1, x2, y2, r2) {
        const distance = this.distance(x1, y1, x2, y2);
        return distance <= (r1 + r2);
    }

    /**
     * 常用数学常量
     */
    static get PI() { return Math.PI; }
    static get PI2() { return Math.PI * 2; }
    static get PI_HALF() { return Math.PI / 2; }
    static get EPSILON() { return 1e-10; }
    static get GOLDEN_RATIO() { return 1.618033988749; }
}

// 导出模块
if (typeof module === 'object' && module && module.exports) {
    module.exports = MathUtils;
}
if (typeof globalThis !== 'undefined') {
    globalThis.MathUtils = MathUtils;
}
