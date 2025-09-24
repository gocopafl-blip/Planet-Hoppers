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
    addMoney(amount) {
        if (this.data) {
            this.data.playerBankBalance += amount;
            console.log(`Added ${amount} credits. New balance: ${this.data.playerBankBalance}`);
            this.saveData(); // This is the crucial step!
        }
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
    setActiveMissionId(missionId) {
        if (this.data) {
            this.data.activeMissionId = missionId;
            console.log(`Player's active mission set to: ${missionId}`);
            this.saveData();
        }
    }
    // Gets the state object for the currently active mission.
    getActiveMissionState() {
        return this.data ? this.data.activeMissionState : null;
    }

    // Updates the state of the active mission and saves the game.
    updateActiveMissionState(newState) {
        if (this.data) {
            // Object.assign merges the new state with the old one.
            this.data.activeMissionState = Object.assign(this.data.activeMissionState || {}, newState);
            console.log("Active mission state updated:", this.data.activeMissionState);
            this.saveData();
        }

    }

    // Gets the ID of the player's currently active mission.
    getActiveMissionId() {
        return this.data ? this.data.activeMissionId : null;
    }

}