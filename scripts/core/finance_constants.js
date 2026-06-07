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

/** StarHopper opening advance — tune payoff pace here (Phase 3.2b). */
const STARHOPPER_ADVANCE = {
    principal: 2500,
    /** Share of gross contract payout → interest (gone). */
    interestRateOfGross: 0.18,
    /** Share of gross contract payout → principal reduction. */
    principalRateOfGross: 0.12
};

/** Minimum lifetime mission earnings before loan market unlocks (Phase 3.2c). */
const LOAN_MARKET_MIN_LIFETIME_EARNINGS = 5000;

/** Display labels for ledger categories on Aegis statement. */
const FINANCE_CATEGORY_LABELS = {
    mission: 'Contract',
    ship: 'Hull',
    consumables: 'Consumables',
    repair: 'Repair',
    tow: 'Tow',
    loan: 'Loan',
    debug: 'Debug',
    other: 'Other'
};
