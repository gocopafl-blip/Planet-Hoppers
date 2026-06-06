// scripts/core/finance_constants.js
// Shared labels for the player transaction ledger (bank statements, future Aegis UI).

const FINANCE_TRANSACTION_TYPES = {
    DEPOSIT: 'deposit',
    WITHDRAWAL: 'withdrawal'
};

const FINANCE_CATEGORIES = {
    MISSION: 'mission',
    SHIP: 'ship',
    CONSUMABLES: 'consumables',
    REPAIR: 'repair',
    TOW: 'tow',
    LOAN: 'loan',
    DEBUG: 'debug',
    OTHER: 'other'
};

/** Emergency tow to Alpha Station when stranded without fuel. */
const TOW_COST = 1000;

/** Max ledger rows kept in save data (newest first). */
const FINANCE_LEDGER_MAX_ENTRIES = 250;

/** First-time survey payout when a scan/orbit mission marks a planet surveyed (Phase 1.2). */
const DISCOVERY_FIRST_SURVEY_BONUS = 250;

/** Billed when a drop ship is destroyed on landing (Phase 1B.3). */
const DROP_SHIP_REPLACEMENT_COST = 750;
