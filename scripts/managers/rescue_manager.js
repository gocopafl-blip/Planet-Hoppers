// scripts/managers/rescue_manager.js — emergency tow when stranded (no fuel)

class RescueManager {

    canRequestTow(spaceScene) {
        if (!spaceScene?.ship || spaceScene.ship.fuel == null) return false;
        if (spaceScene.ship.isDocked) return false;
        return spaceScene.ship.fuel <= 0;
    }

    requestTow(spaceScene) {
        if (!this.canRequestTow(spaceScene)) {
            return { ok: false, message: 'Tow not available.' };
        }

        const activeShip = playerDataManager.getActiveShip();
        if (!activeShip) {
            return { ok: false, message: 'No active ship.' };
        }

        const confirmMsg =
            `Emergency tow to Alpha Station will cost ¢ ${TOW_COST.toLocaleString()}.\n\n` +
            'Your ship will be docked with empty fuel. Continue?';
        if (!confirm(confirmMsg)) {
            return { ok: false, cancelled: true };
        }

        const paid = playerDataManager.spend(
            TOW_COST,
            FINANCE_CATEGORIES.TOW,
            'Emergency tow to Alpha Station',
            { shipId: activeShip.id }
        );
        if (!paid) {
            uiNotify({
                title: 'Insufficient Credits',
                message: 'Insufficient credits for emergency tow.',
                variant: 'warning'
            });
            return { ok: false, message: 'Insufficient credits.' };
        }

        this.dockShipAtStation(spaceScene, activeShip);
        consumablesManager.syncSceneShipToFleet(spaceScene);
        fleetManager.saveCurrentShipState(activeShip, spaceScene);
        playerDataManager.saveData();

        gameManager.switchScene(spaceDockScene, { openTitanSupply: true });
        return { ok: true };
    }

    dockShipAtStation(spaceScene, fleetShip) {
        const ship = spaceScene.ship;
        const alphaDock = spaceScene.spaceDocks?.[0];

        if (alphaDock) {
            ship.x = alphaDock.x + SHIP_DOCKED_OFFSET.x;
            ship.y = alphaDock.y + SHIP_DOCKED_OFFSET.y;
        }

        ship.velX = 0;
        ship.velY = 0;
        ship.isDocked = true;
        ship.isOrbitLocked = false;
        ship.inStableOrbit = false;
        ship.isApproachingOrbit = false;
        ship.orbitingPlanet = null;
        ship.thrusting = false;
        ship.reversing = false;
        ship.strafingLeft = false;
        ship.strafingRight = false;
        ship.rotatingLeft = false;
        ship.rotatingRight = false;

        fleetShip.location = {
            type: 'docked',
            x: ship.x,
            y: ship.y,
            velX: 0,
            velY: 0,
            angle: ship.angle || 0,
            isDocked: true,
            isOrbitLocked: false,
            planetName: null,
            orbitData: null
        };
    }
}

const rescueManager = new RescueManager();
