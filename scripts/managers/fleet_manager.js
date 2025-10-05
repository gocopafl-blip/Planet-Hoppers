class FleetManager {

    constructor() {
        // --- THIS IS THE LINE YOU WILL CHANGE FOR TESTING ---
        // To test a different ship, just change the text below.
        // For example: 'apex_dart' or 'echo_pacer'
        this.activeShipId = 'default_ship';
        //this.activeShipId = 'apex_dart';
        //this.activeShipId = 'echo_pacer';
        //this.activeShipId = 'zenith_runner';
        //this.activeShipId = 'black_falcon'; // Default active ship
    }

    // A method to get the full data object for the active ship
    getActiveShipData() {
        // Look in the shipCatalogue and return the data for the active ship
        return shipCatalogue[this.activeShipId];
    }

    // A placeholder for the future UI-driven method
    setActiveShip(shipId) {
        // In the future, a button click in the UI will call this function.
        // For now, we just change the activeShipId variable manually.
        console.log(`New active ship set to: ${shipId}`);
        this.activeShipId = shipId;
    }

    buyShip(shipID) {
        const shipData = shipCatalogue[shipID];
        if (!shipData) {
            console.error(`Ship with ID ${shipID} not found.`);
            return;
        }

        // Check if the player has enough currency to buy the ship
        if (playerDataManager.getBalance() < shipData.shipBuyValue) {
            alert(`Not enough credits to buy ${shipData.shipID}.`);
            return;
        }

        // Deduct the price from the player's currency
        playerDataManager.addMoney(-shipData.shipBuyValue);

        // Add the ship to the player's fleet (store full ship object)
        if (!playerDataManager.data.fleet) {
            playerDataManager.data.fleet = [];
        }
        // Create a new ship object for the fleet
        const newShip = {
            id: Date.now(), // Unique ID for the ship instance
            shipTypeId: shipData.shipID,
            name: shipData.shipName || shipData.shipID,
            currentHealth: shipData.shipMaxHealth || 100,
            maxHealth: shipData.shipMaxHealth || 100,
            cargoCapacity: shipData.cargoCapacity || 0,
            // Add other relevant properties as needed
        };
        playerDataManager.data.fleet.push(newShip);

        // Set as active ship
        this.activeShipId = shipID;
        // Save to local storage
        playerDataManager.saveData();

        alert(`Bought ship: ${shipData.shipID}`);
    }

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

