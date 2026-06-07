// One-off validator — run: node scripts/dev/validate_planet_catalogue.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..', '..');
const code = fs.readFileSync(path.join(root, 'scripts/core/planet_catalogue.js'), 'utf8')
    .replace('const planetCatalogue', 'var planetCatalogue');
const sandbox = { console };
vm.runInNewContext(code, sandbox);
const planetCatalogue = sandbox.planetCatalogue;
const assetsSrc = fs.readFileSync(path.join(root, 'scripts/core/asset_catalogue.js'), 'utf8');
const assetKeys = new Set([...assetsSrc.matchAll(/"([a-z0-9_]+)":\s*"assets\//gi)].map(m => m[1]));

let ok = true;
const used = new Map();

for (const [type, dna] of Object.entries(planetCatalogue)) {
    for (const k of dna.planetImages) {
        if (!assetKeys.has(k)) {
            console.error(`Missing image key "${k}" for ${type}`);
            ok = false;
        }
        used.set(k, (used.get(k) || []).concat(type));
    }
    for (const k of dna.landerBackgrounds) {
        if (!assetKeys.has(k)) {
            console.error(`Missing lander bg "${k}" for ${type}`);
            ok = false;
        }
    }
}

console.log(`Planet types: ${Object.keys(planetCatalogue).length}`);
console.log('Sprite assignment:');
for (const [k, v] of [...used.entries()].sort()) {
    console.log(`  ${k} -> ${v.join(', ')}`);
}

const expected = {
    planet1: 'water_world',
    planet2: 'terran_world',
    planet3: 'gas_giant',
    planet4: 'volcanic_world',
    planet5: 'volcanic_world',
    planet6: 'ice_world',
    planet7: 'ice_world',
    planet8: 'city_world'
};

for (const [sprite, type] of Object.entries(expected)) {
    const assign = used.get(sprite);
    if (!assign || assign.length !== 1 || assign[0] !== type) {
        console.error(`Expected ${sprite} -> ${type}, got ${assign}`);
        ok = false;
    }
}

console.log(ok ? 'Validation OK' : 'Validation FAILED');
process.exit(ok ? 0 : 1);
