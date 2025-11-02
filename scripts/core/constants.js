// scripts/core/constants.js

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const loadingScreen = document.getElementById('loading-screen');
const startScreen = document.getElementById('start-screen');
const menu = document.getElementById('menu');
const shipSelectionMenu = document.getElementById('ship-selection');
const zoomControls = document.getElementById('zoom-controls');

canvas.width = 1200;
//1400x980 OR 1000x700
canvas.height = 840;

const ASSET_BASE_URL = 'https://raw.githubusercontent.com/gocopafl-blip/Planet-Hoppers/main/assets/';

// SHIP POSITIONING CONSTANTS
// These constants define ship placement relative to space dock positions
// Adjust these values if dock images or layouts change

// Standard docked ship position (close proximity to station)
const SHIP_DOCKED_OFFSET = {
    x: 980,   // Distance right of dock center for docked ships
    y: -50    // Distance above dock center for docked ships
};

// Launch position for dispatched ships (further from station for realistic launch)
const SHIP_LAUNCH_OFFSET = {
    x: 1200,  // Distance right of dock center for launching ships (further than docked)
    y: -100   // Distance above dock center for launching ships (more separation)
};

// ORBITAL MECHANICS CONSTANTS
// These constants define valid orbital parameters for ship positioning and validation
// Based on simplified orbit system where speed determines orbital radius

// Orbital radius as multipliers of planet radius (more realistic than fixed distances)
const ORBIT_RADIUS_MULTIPLIERS = {
    MIN: 1.1,    // Ships can orbit just outside planet surface (110% of planet radius)
    DEFAULT: 1.25, // Default safe orbital distance (125% of planet radius) 
    MAX: 1.35    // Maximum orbit at gravity well edge (135% of planet radius)
};

// Orbital speed range (determines valid orbit entry and radius mapping)
const MIN_ORBIT_SPEED = 2.0;  // Minimum speed for stable orbit (maps to MIN orbital radius)
const MAX_ORBIT_SPEED = 5.0;  // Maximum speed for stable orbit (maps to MAX orbital radius)

// Orbit departure warning time (seconds before exceeding max radius to show exit trajectory)
const ORBIT_DEPARTURE_WARNING_TIME = 2.0;

// Fallback orbital radius for error conditions (when planet data unavailable)
const FALLBACK_ORBIT_RADIUS = 300;

// Orbital radius validation bounds (absolute minimums/maximums for safety)
const ORBIT_RADIUS_BOUNDS = {
    ABSOLUTE_MIN: 100,   // Never orbit closer than this regardless of planet size
    ABSOLUTE_MAX: 4500   // Never orbit further than this (largest gas giant * MAX multiplier)
};

function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}