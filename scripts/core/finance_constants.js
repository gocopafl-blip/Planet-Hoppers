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

/** Lender #0 — hidden contractor advance (not shown in loan market). */
const STARHOPPER_LENDER = {
    id: 'starhopper',
    name: 'StarHopper Cargo',
    productId: 'contractor_advance',
    termsSummary: '30% of gross contract pay (18% interest · 12% principal) until advance repaid'
};

/** Minimum lifetime mission earnings before loan market unlocks (Phase 3.2c). */
const LOAN_MARKET_MIN_LIFETIME_EARNINGS = 5000;

/** Lenders shown as columns in the loan market grid; remainder rotate each Aegis visit. */
const LOAN_MARKET_VISIBLE_LENDER_COUNT = 6;

/** K-14 Trust Index range and tuning (Phase 3.2c). */
const CREDIT_SCORE = {
    MIN: 300,
    MAX: 850,
    BASE: 650,
    /** Penalty per active loan above the first (StarHopper doesn't count extra). */
    EXTRA_LOAN_PENALTY: 22,
    /** Bonus once lifetime earnings cross market unlock threshold. */
    MARKET_UNLOCK_BONUS: 35,
    /** K-14 bonus per manual loan payment (Phase 3.2d). */
    MANUAL_PAYMENT_BONUS: 8
};

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
