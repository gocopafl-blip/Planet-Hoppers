// scripts/managers/consumables_manager.js

class ConsumablesManager {

    initShipConsumables(ship, shipData, fleetShip = null) {
        const fc = fleetShip?.consumables;
        const fuelMax = fc?.fuel?.max
            ?? shipData.shipConsumables?.shipFuel?.max ?? 100;
        const oxygenMax = fc?.oxygen?.max
            ?? shipData.shipConsumables?.shipOxygen?.max ?? 100;
        const electricityMax = fc?.electricity?.max
            ?? shipData.shipConsumables?.shipElectricity?.max ?? 100;

        ship.fuelMax = fuelMax;
        ship.oxygenMax = oxygenMax;
        ship.electricityMax = electricityMax;

        ship.fuel = fc?.fuel?.current ?? fuelMax;
        ship.oxygen = fc?.oxygen?.current ?? oxygenMax;
        ship.electricity = fc?.electricity?.current ?? electricityMax;

        ship.maxHealth = fleetShip?.maxHealth || shipData.shipMaxHealth || 100;
        ship.health = fleetShip?.currentHealth ?? shipData.shipCurrentHealth ?? ship.maxHealth;

        ship.fuelBurnRate = shipData.shipThrusterBurnRate ?? 0.2;
        ship.oxygenBurnRate = shipData.shipOxygenBurnRate ?? 0.00165;
        ship.electricityBurnRate = shipData.shipElectricityBurnRate ?? 0.03;
    }

    applyFlightBurn(ship) {
        if (ship.fuel == null) return;

        const usingMainThrust = ship.thrusting || ship.reversing;
        const usingRcs = ship.strafingLeft || ship.strafingRight
            || ship.rotatingLeft || ship.rotatingRight;

        if (usingMainThrust) {
            ship.fuel = Math.max(0, ship.fuel - ship.fuelBurnRate);
        } else if (usingRcs) {
            ship.fuel = Math.max(0, ship.fuel - ship.fuelBurnRate * 0.35);
        }

        ship.oxygen = Math.max(0, ship.oxygen - ship.oxygenBurnRate);

        const elecMultiplier = (usingMainThrust || usingRcs) ? 1.4 : 1;
        ship.electricity = Math.max(0, ship.electricity - ship.electricityBurnRate * elecMultiplier);
    }

    canOperateShip(fleetShip) {
        if (!fleetShip?.consumables) return true;
        const fuel = fleetShip.consumables.fuel;
        const minFuel = (fuel?.max || 100) * 0.1;
        return (fuel?.current ?? 0) >= minFuel;
    }

    getDockedFleetShips() {
        return (playerDataManager.getFleet() || []).filter(
            s => s.location?.type === 'docked'
        );
    }

    getFillCost(ship, consumableKey) {
        const price = consumablesCatalogue[consumableKey]?.pricePerUnit ?? 0;
        const c = ship.consumables?.[consumableKey];
        if (!c || price <= 0) return { units: 0, cost: 0 };

        const units = Math.max(0, (c.max || 0) - (c.current || 0));
        return { units, cost: units * price };
    }

    getFillAllCost(ship) {
        const keys = ['fuel', 'oxygen', 'electricity'];
        let total = 0;
        const breakdown = {};
        keys.forEach(key => {
            const part = this.getFillCost(ship, key);
            breakdown[key] = part;
            total += part.cost;
        });
        return { total, breakdown };
    }

    purchaseFill(shipId, consumableKey) {
        const ship = playerDataManager.getShipById(shipId);
        if (!ship) return { ok: false, message: 'Ship not found.' };

        playerDataManager.ensureShipConsumables(ship);

        const { units, cost } = this.getFillCost(ship, consumableKey);
        if (units <= 0) return { ok: false, message: 'Already at maximum.' };

        const label = consumablesCatalogue[consumableKey]?.label || consumableKey;
        const paid = playerDataManager.spend(
            cost,
            FINANCE_CATEGORIES.CONSUMABLES,
            `Titan Supply: ${label} for ${ship.name}`,
            { shipId, consumableKey, units }
        );
        if (!paid) return { ok: false, message: 'Insufficient credits.' };

        ship.consumables[consumableKey].current = ship.consumables[consumableKey].max;
        playerDataManager.saveData();
        return { ok: true, message: `Filled ${label} on ${ship.name} (¢ ${cost.toLocaleString()}).`, cost };
    }

    purchaseFillAll(shipId) {
        const ship = playerDataManager.getShipById(shipId);
        if (!ship) return { ok: false, message: 'Ship not found.' };

        playerDataManager.ensureShipConsumables(ship);

        const { total, breakdown } = this.getFillAllCost(ship);
        if (total <= 0) return { ok: false, message: 'All consumables already full.' };

        const paid = playerDataManager.spend(
            total,
            FINANCE_CATEGORIES.CONSUMABLES,
            `Titan Supply: full resupply for ${ship.name}`,
            { shipId }
        );
        if (!paid) return { ok: false, message: 'Insufficient credits.' };

        ['fuel', 'oxygen', 'electricity'].forEach(key => {
            if (breakdown[key].units > 0) {
                ship.consumables[key].current = ship.consumables[key].max;
            }
        });
        playerDataManager.saveData();
        return { ok: true, message: `Full resupply for ${ship.name} (¢ ${total.toLocaleString()}).`, cost: total };
    }

    syncSceneShipToFleet(spaceScene) {
        const active = playerDataManager.getActiveShip();
        if (!active || !spaceScene?.ship) return;

        const s = spaceScene.ship;
        if (active.consumables?.fuel) {
            active.consumables.fuel.current = Math.max(0, Math.floor(s.fuel ?? 0));
        }
        if (active.consumables?.oxygen) {
            active.consumables.oxygen.current = Math.max(0, Math.floor(s.oxygen ?? 0));
        }
        if (active.consumables?.electricity) {
            active.consumables.electricity.current = Math.max(0, Math.floor(s.electricity ?? 0));
        }
        if (typeof s.health === 'number') {
            active.currentHealth = s.health;
        }
    }
}

const consumablesManager = new ConsumablesManager();
