const fleetManager = {
    buyShip(shipID) {
        const shipData = shipCatalogue[shipID];
        if (!shipData) {
            console.error(`Ship with ID ${shipID} not found.`);
            return;
        }

        // Check if the player has enough currency to buy the ship
        if (player.currency < shipData.price) {
            console.error(`Not enough currency to buy ${shipData.name}.`);
            return;
        }

        // Deduct the price from the player's currency
        player.currency -= shipData.price;

        // Add the ship to the player's fleet
        player.fleet.push(shipData);

        console.log(`Bought ship: ${shipData.name}`);
    },

    sellShip(shipID) {
        const shipIndex = player.fleet.findIndex(ship => ship.shipID === shipID);
        if (shipIndex === -1) {
            console.error(`Ship with ID ${shipID} not found in fleet.`);
            return;
        }

        // Get the ship data and remove it from the fleet
        const shipData = player.fleet[shipIndex];
        player.fleet.splice(shipIndex, 1);

        // Refund the player a portion of the ship's price
        player.currency += shipData.price * 0.8; // 80% refund

        console.log(`Sold ship: ${shipData.name}`);
    }
};