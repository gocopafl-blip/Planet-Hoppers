// scripts/managers/player_data_manager.js

class PlayerDataManager {
    constructor() {
        this.data = null; // We'll load the data here
        this.SAVE_KEY = 'planetHoppersSaveData'; // The key for localStorage
    }

    // Tries to load data from localStorage, or creates a new game if none is found.
    loadData() {
        const savedData = localStorage.getItem(this.SAVE_KEY);
        if (savedData) {
            this.data = JSON.parse(savedData);
            console.log("Player data LOADED from save.", this.data);
        } else {
            this.data = getNewPlayerData(); // From player_data.js
            this.saveData(); // ADD THIS LINE to save the new data immediately
            console.log("No save file found. Created NEW player data.", this.data);
        }
    }

    // Saves the current data object to localStorage.
    saveData() {
        if (this.data) {
            localStorage.setItem(this.SAVE_KEY, JSON.stringify(this.data));
            console.log("Player data SAVED.", this.data);
        }
    }

    // A helper function to easily get the player's bank balance.
    getBalance() {
        return this.data.playerBankBalance;
    }

    // A helper function to easily get the player's company name.
    getCompanyName() {
        return this.data.cargoCoName;
    }

    // A helper function to find the currently active ship object from the fleet.
    getActiveShip() {
        if (!this.data || !this.data.fleet) return null;

        return this.data.fleet.find(ship => ship.id === this.data.activeShipId);
    }
}