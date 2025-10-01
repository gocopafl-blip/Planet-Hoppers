// scripts/core/constants.js

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const loadingScreen = document.getElementById('loading-screen');
const startScreen = document.getElementById('start-screen');
const menu = document.getElementById('menu');
const shipSelectionMenu = document.getElementById('ship-selection');
const descentUI = document.getElementById('descent-ui');
const zoomControls = document.getElementById('zoom-controls');

canvas.width = 1000;
canvas.height = 700;

const ASSET_BASE_URL = 'https://raw.githubusercontent.com/gocopafl-blip/Planet-Hoppers/main/assets/';

function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}