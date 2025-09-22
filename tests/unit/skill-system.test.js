/**
 * SkillSystem 类的详细单元测试
 */

// 导入测试框架
if (typeof require !== 'undefined') {
    const { testFramework, describe, it, expect, beforeEach, afterEach, MockUtils } = require('../test-framework.js');
    global.testFramework = testFramework;
    global.describe = describe;
    global.it = it;
    global.expect = expect;
    global.beforeEach = beforeEach;
    global.afterEach = afterEach;
    global.MockUtils = MockUtils;
}

describe('SkillSystem 单元测试', () => {
    let game;
    let skillSystem;
    let mockCanvas;

    beforeEach(() => {
        mockCanvas = MockUtils.createMockCanvas();
        game = new DragonHunterGame(mockCanvas);
        skillSystem = game.skillSystem;
    });

    afterEach(() => {
        game = null;
        skillSystem = null;
        mockCanvas = null;
    });

    describe('构造函数和初始化', () => {
        it('应该正确初始化技能系统', () => {
            expect(skillSystem).toBeInstanceOf(SkillSystem);
            expect(skillSystem.game).toBe(game);
            expect(skillSystem.activeSkills).toEqual({});
            expect(skillSystem.passiveSkills).toEqual({});
            expect(skillSystem.cooldowns).toEqual({});
        });

        it('应该正确初始化资源系统', () => {
            expect(skillSystem.resources).toHaveProperty('mana');
            expect(skillSystem.resources).toHaveProperty('maxMana');
            expect(skillSystem.resources).toHaveProperty('manaRegen');
            
            expect(skillSystem.resources.mana).toBe(100);
            expect(skillSystem.resources.maxMana).toBe(100);
            expect(skillSystem.resources.manaRegen).toBe(10);
        });

        it('应该正确初始化技能配置', () => {
            expect(skillSystem.ACTIVE_SKILLS).toHaveProperty('volley');
            expect(skillSystem.ACTIVE_SKILLS).toHaveProperty('burst');
            expect(skillSystem.ACTIVE_SKILLS).toHaveProperty('shield');
            expect(skillSystem.ACTIVE_SKILLS).toHaveProperty('heal');
            expect(skillSystem.ACTIVE_SKILLS).toHaveProperty('freeze');
            expect(skillSystem.ACTIVE_SKILLS).toHaveProperty('ultimate');
        });
    });

    describe('技能激活系统', () => {
        beforeEach(() => {
            game.startGame();
            // 重置冷却时间和法力值
            skillSystem.cooldowns = {};
            skillSystem.resources.mana = skillSystem.resources.maxMana;
        });

        it('应该能够激活齐射技能', () => {
            const initialBulletCount = game.bullets.length;
            
            const result = skillSystem.activateSkill('volley');
            
            expect(result).toBe(true);
            expect(game.bullets.length).toBeGreaterThan(initialBulletCount);
            expect(skillSystem.cooldowns['volley']).toBeGreaterThan(0);
            expect(skillSystem.resources.mana).toBeLessThan(skillSystem.resources.maxMana);
        });

        it('应该能够激活爆发射击技能', () => {
            const result = skillSystem.activateSkill('burst');
            
            expect(result).toBe(true);
            expect(skillSystem.activeSkills['burst']).toBeTruthy();
            expect(skillSystem.cooldowns['burst']).toBeGreaterThan(0);
        });

        it('应该能够激活护盾技能', () => {
            const result = skillSystem.activateSkill('shield');
            
            expect(result).toBe(true);
            expect(skillSystem.activeSkills['shield']).toBeTruthy();
            expect(game.player.shielded).toBe(true);
        });

        it('应该能够激活治疗技能', () => {
            // 先减少玩家血量
            game.player.health = 50;
            const initialHealth = game.player.health;
            
            const result = skillSystem.activateSkill('heal');
            
            expect(result).toBe(true);
            expect(game.player.health).toBeGreaterThan(initialHealth);
        });

        it('应该能够激活冰冻技能', () => {
            // 先生成一些敌人
            game.spawnDragon();
            game.spawnDragon();
            
            const result = skillSystem.activateSkill('freeze');
            
            expect(result).toBe(true);
            
            // 检查敌人是否被冰冻
            game.dragons.forEach(dragon => {
                expect(dragon.frozen).toBe(true);
            });
        });

        it('应该能够激活终极技能', () => {
            // 先生成一些敌人
            for (let i = 0; i < 5; i++) {
                game.spawnDragon();
            }
            
            const initialDragonCount = game.dragons.length;
            const result = skillSystem.activateSkill('ultimate');
            
            expect(result).toBe(true);
            expect(game.dragons.length).toBeLessThan(initialDragonCount);
        });

        it('法力不足时应该无法激活技能', () => {
            skillSystem.resources.mana = 0;
            
            const result = skillSystem.activateSkill('volley');
            
            expect(result).toBe(false);
            expect(skillSystem.cooldowns['volley']).toBeUndefined();
        });

        it('冷却中的技能应该无法激活', () => {
            // 先激活一次
            skillSystem.activateSkill('volley');
            
            // 立即再次激活
            const result = skillSystem.activateSkill('volley');
            
            expect(result).toBe(false);
        });

        it('不存在的技能应该无法激活', () => {
            const result = skillSystem.activateSkill('nonexistent_skill');
            
            expect(result).toBe(false);
        });
    });

    describe('冷却时间系统', () => {
        beforeEach(() => {
            game.startGame();
            skillSystem.cooldowns = {};
            skillSystem.resources.mana = skillSystem.resources.maxMana;
        });

        it('应该正确设置技能冷却时间', () => {
            skillSystem.activateSkill('volley');
            
            const expectedCooldown = skillSystem.ACTIVE_SKILLS.volley.cooldown;
            expect(skillSystem.cooldowns['volley']).toBeCloseTo(expectedCooldown, 100);
        });

        it('应该正确更新冷却时间', () => {
            skillSystem.activateSkill('volley');
            const initialCooldown = skillSystem.cooldowns['volley'];
            
            skillSystem.updateCooldowns(1000); // 1秒
            
            expect(skillSystem.cooldowns['volley']).toBeLessThan(initialCooldown);
        });

        it('冷却完成的技能应该被移除', () => {
            skillSystem.activateSkill('volley');
            const cooldownTime = skillSystem.cooldowns['volley'];
            
            skillSystem.updateCooldowns(cooldownTime + 100);
            
            expect(skillSystem.cooldowns['volley']).toBeUndefined();
        });

        it('应该能够获取技能剩余冷却时间', () => {
            skillSystem.activateSkill('volley');
            
            const remainingCooldown = skillSystem.getRemainingCooldown('volley');
            
            expect(remainingCooldown).toBeGreaterThan(0);
        });

        it('没有冷却的技能应该返回0', () => {
            const remainingCooldown = skillSystem.getRemainingCooldown('volley');
            
            expect(remainingCooldown).toBe(0);
        });
    });

    describe('法力值系统', () => {
        beforeEach(() => {
            skillSystem.resources.mana = skillSystem.resources.maxMana;
        });

        it('应该正确消耗法力值', () => {
            const initialMana = skillSystem.resources.mana;
            const manaCost = skillSystem.ACTIVE_SKILLS.volley.manaCost;
            
            skillSystem.consumeMana(manaCost);
            
            expect(skillSystem.resources.mana).toBe(initialMana - manaCost);
        });

        it('法力值不应该低于0', () => {
            skillSystem.consumeMana(skillSystem.resources.maxMana + 100);
            
            expect(skillSystem.resources.mana).toBe(0);
        });

        it('应该正确恢复法力值', () => {
            skillSystem.resources.mana = 50;
            const initialMana = skillSystem.resources.mana;
            
            skillSystem.updateManaRegen(1000); // 1秒
            
            expect(skillSystem.resources.mana).toBeGreaterThan(initialMana);
        });

        it('法力值不应该超过最大值', () => {
            skillSystem.resources.mana = skillSystem.resources.maxMana - 5;
            
            skillSystem.updateManaRegen(2000); // 2秒，应该超过最大值
            
            expect(skillSystem.resources.mana).toBe(skillSystem.resources.maxMana);
        });

        it('应该正确检查法力值是否足够', () => {
            skillSystem.resources.mana = 30;
            
            expect(skillSystem.hasSufficientMana('volley')).toBe(true);
            expect(skillSystem.hasSufficientMana('burst')).toBe(true);
            expect(skillSystem.hasSufficientMana('ultimate')).toBe(false);
        });
    });

    describe('持续技能效果', () => {
        beforeEach(() => {
            game.startGame();
            skillSystem.activeSkills = {};
            skillSystem.cooldowns = {};
            skillSystem.resources.mana = skillSystem.resources.maxMana;
        });

        it('爆发射击应该增加射击速度', () => {
            const originalFireRate = game.fireRate;
            
            skillSystem.activateSkill('burst');
            
            expect(game.fireRate).toBeLessThan(originalFireRate);
        });

        it('护盾技能应该提供伤害保护', () => {
            skillSystem.activateSkill('shield');
            
            expect(game.player.shielded).toBe(true);
            expect(game.player.shieldHealth).toBeGreaterThan(0);
        });

        it('持续技能应该在时间结束后失效', () => {
            skillSystem.activateSkill('shield');
            const duration = skillSystem.ACTIVE_SKILLS.shield.duration;
            
            skillSystem.updateActiveSkills(duration + 100);
            
            expect(skillSystem.activeSkills['shield']).toBeUndefined();
            expect(game.player.shielded).toBe(false);
        });

        it('应该正确更新持续技能的剩余时间', () => {
            skillSystem.activateSkill('shield');
            const initialDuration = skillSystem.activeSkills['shield'].remaining;
            
            skillSystem.updateActiveSkills(1000);
            
            expect(skillSystem.activeSkills['shield'].remaining).toBeLessThan(initialDuration);
        });
    });

    describe('技能效果计算', () => {
        beforeEach(() => {
            game.startGame();
        });

        it('齐射技能应该创建正确数量的子弹', () => {
            const initialBulletCount = game.bullets.length;
            const expectedBullets = skillSystem.ACTIVE_SKILLS.volley.effects.bulletCount;
            
            skillSystem.activateSkill('volley');
            
            expect(game.bullets.length).toBe(initialBulletCount + expectedBullets);
        });

        it('齐射子弹应该有正确的伤害倍数', () => {
            skillSystem.activateSkill('volley');
            
            const bullet = game.bullets[game.bullets.length - 1];
            const expectedDamage = game.player.damage * skillSystem.ACTIVE_SKILLS.volley.effects.damageMultiplier;
            
            expect(bullet.damage).toBeCloseTo(expectedDamage, 1);
        });

        it('治疗技能应该恢复正确的血量', () => {
            game.player.health = 50;
            const initialHealth = game.player.health;
            const healAmount = skillSystem.ACTIVE_SKILLS.heal.effects.healAmount;
            
            skillSystem.activateSkill('heal');
            
            expect(game.player.health).toBe(Math.min(initialHealth + healAmount, game.player.maxHealth));
        });

        it('冰冻技能应该正确设置敌人状态', () => {
            game.spawnDragon();
            const dragon = game.dragons[0];
            const originalSpeed = dragon.speed;
            
            skillSystem.activateSkill('freeze');
            
            expect(dragon.frozen).toBe(true);
            expect(dragon.speed).toBeLessThan(originalSpeed);
        });
    });

    describe('技能升级系统', () => {
        it('应该能够升级技能', () => {
            const skillId = 'volley';
            const initialLevel = skillSystem.getSkillLevel(skillId);
            
            skillSystem.upgradeSkill(skillId);
            
            expect(skillSystem.getSkillLevel(skillId)).toBe(initialLevel + 1);
        });

        it('升级技能应该消耗正确的资源', () => {
            const skillId = 'volley';
            game.player.experience = 1000; // 给足够的经验
            const initialExp = game.player.experience;
            const upgradeCost = skillSystem.getUpgradeCost(skillId);
            
            skillSystem.upgradeSkill(skillId);
            
            expect(game.player.experience).toBe(initialExp - upgradeCost);
        });

        it('经验不足时应该无法升级技能', () => {
            const skillId = 'volley';
            game.player.experience = 0;
            const initialLevel = skillSystem.getSkillLevel(skillId);
            
            const result = skillSystem.upgradeSkill(skillId);
            
            expect(result).toBe(false);
            expect(skillSystem.getSkillLevel(skillId)).toBe(initialLevel);
        });

        it('升级技能应该增强技能效果', () => {
            const skillId = 'volley';
            const initialDamage = skillSystem.ACTIVE_SKILLS[skillId].effects.damageMultiplier;
            
            skillSystem.upgradeSkill(skillId);
            
            const newDamage = skillSystem.getSkillEffectValue(skillId, 'damageMultiplier');
            expect(newDamage).toBeGreaterThan(initialDamage);
        });
    });

    describe('被动技能系统', () => {
        it('应该能够学习被动技能', () => {
            const passiveId = 'damage_boost';
            
            skillSystem.learnPassive(passiveId);
            
            expect(skillSystem.passiveSkills[passiveId]).toBeTruthy();
        });

        it('被动技能应该提供持续效果', () => {
            const originalDamage = game.player.damage;
            
            skillSystem.learnPassive('damage_boost');
            skillSystem.applyPassiveEffects();
            
            expect(game.player.damage).toBeGreaterThan(originalDamage);
        });

        it('多个被动技能应该能够叠加', () => {
            const originalDamage = game.player.damage;
            
            skillSystem.learnPassive('damage_boost');
            skillSystem.learnPassive('critical_chance');
            skillSystem.applyPassiveEffects();
            
            expect(game.player.damage).toBeGreaterThan(originalDamage);
            expect(game.player.criticalChance).toBeGreaterThan(0);
        });
    });

    describe('技能组合系统', () => {
        beforeEach(() => {
            game.startGame();
            skillSystem.resources.mana = skillSystem.resources.maxMana;
            skillSystem.cooldowns = {};
        });

        it('应该能够检测技能组合', () => {
            const combo = skillSystem.checkCombo(['volley', 'burst']);
            
            expect(combo).toBeTruthy();
        });

        it('技能组合应该提供额外效果', () => {
            const initialScore = game.score;
            
            skillSystem.activateSkill('volley');
            skillSystem.activateSkill('burst');
            skillSystem.executeCombo(['volley', 'burst']);
            
            expect(game.score).toBeGreaterThan(initialScore);
        });

        it('无效的技能组合应该返回false', () => {
            const combo = skillSystem.checkCombo(['volley', 'invalid_skill']);
            
            expect(combo).toBe(false);
        });
    });

    describe('UI集成', () => {
        it('应该能够获取技能UI信息', () => {
            const skillInfo = skillSystem.getSkillUIInfo('volley');
            
            expect(skillInfo).toHaveProperty('name');
            expect(skillInfo).toHaveProperty('description');
            expect(skillInfo).toHaveProperty('cooldown');
            expect(skillInfo).toHaveProperty('manaCost');
            expect(skillInfo).toHaveProperty('ready');
        });

        it('应该正确显示技能状态', () => {
            skillSystem.activateSkill('volley');
            const skillInfo = skillSystem.getSkillUIInfo('volley');
            
            expect(skillInfo.ready).toBe(false);
            expect(skillInfo.cooldown).toBeGreaterThan(0);
        });

        it('应该能够获取所有技能的状态', () => {
            const allSkillsInfo = skillSystem.getAllSkillsUIInfo();
            
            expect(Array.isArray(allSkillsInfo)).toBe(true);
            expect(allSkillsInfo.length).toBeGreaterThan(0);
            
            allSkillsInfo.forEach(skillInfo => {
                expect(skillInfo).toHaveProperty('id');
                expect(skillInfo).toHaveProperty('name');
                expect(skillInfo).toHaveProperty('ready');
            });
        });
    });

    describe('性能测试', () => {
        it('技能激活应该在合理时间内完成', async () => {
            const result = await testFramework.benchmark(
                '技能激活性能',
                () => {
                    skillSystem.cooldowns = {};
                    skillSystem.resources.mana = skillSystem.resources.maxMana;
                    skillSystem.activateSkill('volley');
                },
                100
            );
            
            expect(result.avg).toBeLessThan(1); // 应该在1ms内完成
        });

        it('冷却时间更新应该高效', async () => {
            // 设置多个技能冷却
            Object.keys(skillSystem.ACTIVE_SKILLS).forEach(skillId => {
                skillSystem.cooldowns[skillId] = 5000;
            });
            
            const result = await testFramework.benchmark(
                '冷却时间更新性能',
                () => skillSystem.updateCooldowns(16),
                1000
            );
            
            expect(result.avg).toBeLessThan(0.5); // 应该在0.5ms内完成
        });
    });

    describe('边界情况和错误处理', () => {
        it('应该处理空的技能ID', () => {
            expect(() => {
                skillSystem.activateSkill('');
                skillSystem.activateSkill(null);
                skillSystem.activateSkill(undefined);
            }).not.toThrow();
        });

        it('应该处理极端的时间值', () => {
            skillSystem.activateSkill('shield');
            
            expect(() => {
                skillSystem.updateActiveSkills(0);
                skillSystem.updateActiveSkills(-1000);
                skillSystem.updateActiveSkills(Number.MAX_VALUE);
            }).not.toThrow();
        });

        it('应该处理损坏的技能配置', () => {
            const originalSkill = skillSystem.ACTIVE_SKILLS.volley;
            skillSystem.ACTIVE_SKILLS.volley = null;
            
            expect(() => {
                skillSystem.activateSkill('volley');
            }).not.toThrow();
            
            skillSystem.ACTIVE_SKILLS.volley = originalSkill;
        });

        it('应该处理游戏对象为null的情况', () => {
            skillSystem.game = null;
            
            expect(() => {
                skillSystem.activateSkill('volley');
            }).not.toThrow();
        });
    });
});

// 如果在浏览器环境中，自动运行测试
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        setTimeout(() => window.testFramework.run(), 200);
    });
} else if (typeof module !== 'undefined') {
    module.exports = { testFramework: global.testFramework };
}
