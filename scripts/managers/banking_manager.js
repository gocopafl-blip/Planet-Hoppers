// scripts/managers/banking_manager.js
// Central banking / loan logic. UI scenes call this — rates live in finance_constants + lender_catalogue.

class BankingManager {

    formatCredits(amount) {
        const n = Math.round(Number(amount) || 0);
        const prefix = n < 0 ? '−¢ ' : '¢ ';
        return `${prefix}${Math.abs(n).toLocaleString()}`;
    }

    getCategoryLabel(category) {
        return FINANCE_CATEGORY_LABELS[category] || category || 'Other';
    }

    formatLedgerTimestamp(timestamp) {
        if (!timestamp) return '—';
        const d = new Date(timestamp);
        return d.toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /** Sum gross mission income from ledger (until financeStats tracked in 3.2b). */
    getLifetimeMissionEarnings() {
        const history = playerDataManager.getTransactionHistory(FINANCE_LEDGER_MAX_ENTRIES);
        return history.reduce((sum, row) => {
            if (row.category !== FINANCE_CATEGORIES.MISSION) return sum;
            if (row.type !== FINANCE_TRANSACTION_TYPES.DEPOSIT) return sum;
            return sum + (row.amount || 0);
        }, 0);
    }

    /** Total principal owed across active loans (0 until 3.2b). */
    getTotalLiabilities() {
        const loans = playerDataManager.data?.activeLoans;
        if (!Array.isArray(loans) || !loans.length) return 0;
        return loans.reduce((sum, loan) => sum + (loan.principalRemaining || 0), 0);
    }

    /** % of gross income committed to liens (0 until 3.2b). */
    getIncomeCommittedPercent() {
        return 0;
    }

    /** K-14 Trust Index placeholder until 3.2c. */
    getCreditScore() {
        return null;
    }

    getDashboardSnapshot() {
        return {
            balance: playerDataManager.getBalance(),
            totalLiabilities: this.getTotalLiabilities(),
            lifetimeEarnings: this.getLifetimeMissionEarnings(),
            incomeCommittedPct: this.getIncomeCommittedPercent(),
            creditScore: this.getCreditScore(),
            companyName: playerDataManager.getCompanyName?.() || 'Contractor'
        };
    }

    getStatementRows(limit = 50) {
        return playerDataManager.getTransactionHistory(limit).map(row => ({
            id: row.id,
            timestamp: row.timestamp,
            timestampLabel: this.formatLedgerTimestamp(row.timestamp),
            type: row.type,
            category: row.category,
            categoryLabel: this.getCategoryLabel(row.category),
            amount: row.amount,
            amountLabel: this.formatSignedAmount(row),
            balanceAfter: row.balanceAfter,
            balanceLabel: this.formatCredits(row.balanceAfter),
            description: row.description || ''
        }));
    }

    formatSignedAmount(row) {
        const isDeposit = row.type === FINANCE_TRANSACTION_TYPES.DEPOSIT;
        const sign = isDeposit ? '+' : '−';
        return `${sign}${this.formatCredits(row.amount).replace('¢ ', '')}`;
    }

    escapeHtml(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
}

const bankingManager = new BankingManager();
