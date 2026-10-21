const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const prices = require('../public/js/economyPrices');
const config = require('../src/config');

assert.deepStrictEqual(config.HOUSE_PRICES, prices.HOUSE_PRICES);
assert.deepStrictEqual(config.FURNITURE_PRICES, prices.FURNITURE_PRICES);
assert.deepStrictEqual(config.WARDROBE_ITEM_PRICES, prices.WARDROBE_ITEM_PRICES);
assert.deepStrictEqual(config.DAILY_QUEST_REWARDS, prices.DAILY_QUEST_REWARDS);

assert.deepStrictEqual(prices.HOUSE_PRICES, {
    standart: 4125,
    garden: 8250,
    pool: 12375
});
assert.strictEqual(prices.FURNITURE_PRICES.slot_machine, 5250);
assert.strictEqual(prices.FURNITURE_PRICES.roulette_table, 5950);
assert.strictEqual(prices.WARDROBE_ITEM_PRICES.watches_watch_gold_rolex, 4000);
assert.strictEqual(prices.WARDROBE_ITEM_PRICES.watches_watch_leather_classic, 2800);
assert.strictEqual(prices.WARDROBE_ITEM_PRICES.watches_watch_cyber_sport, 3360);
assert.deepStrictEqual(prices.DAILY_QUEST_REWARDS, {
    okey101_play: 180,
    batak_play: 150,
    tavla_play: 120,
    drink_tea: 60,
    go_fishing: 90
});

const wardrobeSource = fs.readFileSync(require.resolve('../public/js/wardrobe.js'), 'utf8');
const wardrobeContext = {
    window: { METAVERSE_PRICES: prices, addEventListener() {} },
    document: {
        getElementById() { return null; },
        querySelectorAll() { return []; },
        readyState: 'loading'
    },
    socket: { on() {}, emit() {} }
};
vm.runInNewContext(`${wardrobeSource}\nthis.wardrobeCatalog = WARDROBE_CATALOG;`, wardrobeContext);

for (const [category, items] of Object.entries(wardrobeContext.wardrobeCatalog)) {
    if (category === 'shirts') continue;
    for (const item of items) {
        assert.strictEqual(
            item.cost,
            prices.WARDROBE_ITEM_PRICES[`${category}_${item.id}`],
            `${category}/${item.id} must use the shared price`
        );
    }
}

const emlakciSource = fs.readFileSync(require.resolve('../public/js/renderers/renderEmlakci.js'), 'utf8');
assert(emlakciSource.includes('housePrices.standart.toLocaleString'));
assert(emlakciSource.includes('housePrices.garden.toLocaleString'));
assert(emlakciSource.includes('housePrices.pool.toLocaleString'));
assert(!emlakciSource.includes('1.250 TL'));
assert(!emlakciSource.includes('2.500 TL'));
assert(!emlakciSource.includes('3.750 TL'));

console.log('Shared economy prices, storefront catalog, watch prices, and estate display are synchronized.');
