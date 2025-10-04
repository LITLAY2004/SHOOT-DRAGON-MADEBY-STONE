const EventSystem = require('../../src/core/EventSystem.js');
const PersistentStorage = require('../../src/services/PersistentStorage.js');
const ShopSystem = require('../../src/systems/ShopSystem.js');

describe('ShopSystem', () => {
    let eventSystem;
    let shop;

    beforeEach(() => {
        eventSystem = new EventSystem();
        PersistentStorage.memoryStore = {};
        shop = new ShopSystem(eventSystem, { storageKey: 'TEST_SHOP' });
    });

    test('addCurrency increases balance and emits updates', () => {
        const states = [];
        eventSystem.on('SHOP_UPDATED', (state) => {
            states.push(state);
        });

        const result = shop.addCurrency(75);

        expect(result).toBe(75);
        expect(shop.getCurrency()).toBe(75);
        expect(PersistentStorage.memoryStore.TEST_SHOP.currency).toBe(75);
        expect(states).toHaveLength(1);
        expect(states[0].currency).toBe(75);
    });

    test('purchase upgrades consumes currency and increases level', () => {
        const purchases = [];
        shop.addCurrency(500);
        eventSystem.on('SHOP_PURCHASED', (payload) => {
            purchases.push(payload);
        });

        const first = shop.purchase('attack_power');
        expect(first.success).toBe(true);
        expect(first.level).toBe(1);
        expect(shop.getUpgradeLevel('attack_power')).toBe(1);
        expect(shop.getCurrency()).toBeLessThan(500);

        const stored = PersistentStorage.memoryStore.TEST_SHOP;
        expect(stored.upgrades.attack_power).toBe(1);
        expect(purchases).toHaveLength(1);
        expect(purchases[0].upgradeId).toBe('attack_power');
    });

    test('applyUpgrades updates player stats without stacking', () => {
        shop.data.upgrades.attack_power = 1;
        shop.data.upgrades.max_health = 1;
        shop.data.upgrades.mana_regen = 2;
        shop.data.upgrades.skill_mastery = 1;

        const gameState = {
            player: {
                damage: 40,
                maxHealth: 110,
                health: 90,
                manaRegenRate: 12
            },
            setPlayer(update) {
                this.player = { ...this.player, ...update };
            },
            getPlayer() {
                return this.player;
            },
            permanentUpgrades: {}
        };

        shop.applyUpgrades(gameState);

        expect(gameState.player.damage).toBe(45);
        expect(gameState.player.maxHealth).toBe(135);
        expect(gameState.player.health).toBe(115);
        expect(gameState.player.manaRegenRate).toBe(16);
        expect(gameState.permanentUpgrades.skillMasteryLevel).toBe(1);
        expect(gameState.permanentUpgrades.skillMasteryBonus).toBeCloseTo(0.08);

        // apply again to ensure values are stable
        shop.applyUpgrades(gameState);
        expect(gameState.player.damage).toBe(45);
        expect(gameState.player.maxHealth).toBe(135);
        expect(gameState.player.manaRegenRate).toBe(16);
    });
});
