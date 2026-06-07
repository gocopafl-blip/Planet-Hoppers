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

    /** Ensure save has finance fields and the StarHopper opening lien (Phase 3.2b). */
    ensurePlayerFinanceState() {
        const data = playerDataManager.data;
        if (!data) return;

        let changed = false;

        if (!Array.isArray(data.activeLoans)) {
            data.activeLoans = [];
            changed = true;
        }
        if (!data.financeStats) {
            data.financeStats = { hasSeenLienReveal: false, lifetimeGrossMissionPay: 0 };
            changed = true;
        }
        if (typeof data.financeStats.hasSeenLienReveal !== 'boolean') {
            data.financeStats.hasSeenLienReveal = false;
            changed = true;
        }
        if (typeof data.financeStats.lifetimeGrossMissionPay !== 'number') {
            data.financeStats.lifetimeGrossMissionPay = 0;
            changed = true;
        }

        const hasActiveStarhopper = data.activeLoans.some(
            loan => loan.lenderId === STARHOPPER_LENDER.id && loan.status === 'active'
        );
        const everHadStarhopper = data.activeLoans.some(
            loan => loan.lenderId === STARHOPPER_LENDER.id
        );

        if (!hasActiveStarhopper && !everHadStarhopper) {
            data.activeLoans.push(this.createStarHopperLoan());
            changed = true;
        }

        if (Array.isArray(data.completedMissionIds) && data.completedMissionIds.length > 0
            && !data.financeStats.hasSeenLienReveal) {
            data.financeStats.hasSeenLienReveal = true;
            changed = true;
        }

        if (changed) {
            playerDataManager.saveData();
        }
    }

    createStarHopperLoan() {
        const skim = STARHOPPER_ADVANCE.interestRateOfGross + STARHOPPER_ADVANCE.principalRateOfGross;
        return {
            id: `loan_${STARHOPPER_LENDER.id}_advance`,
            lenderId: STARHOPPER_LENDER.id,
            lenderName: STARHOPPER_LENDER.name,
            productId: STARHOPPER_LENDER.productId,
            principalOriginal: STARHOPPER_ADVANCE.principal,
            principalRemaining: STARHOPPER_ADVANCE.principal,
            interestRateOfGross: STARHOPPER_ADVANCE.interestRateOfGross,
            principalRateOfGross: STARHOPPER_ADVANCE.principalRateOfGross,
            skimRateOfGross: skim,
            status: 'active',
            signedAt: Date.now(),
            termsSummary: STARHOPPER_LENDER.termsSummary
        };
    }

    getActiveLoans() {
        const loans = playerDataManager.data?.activeLoans;
        if (!Array.isArray(loans)) return [];
        return loans.filter(loan => loan.status === 'active' && (loan.principalRemaining || 0) > 0);
    }

    getStarHopperLoan() {
        const loans = playerDataManager.data?.activeLoans;
        if (!Array.isArray(loans)) return null;
        return loans.find(loan => loan.lenderId === STARHOPPER_LENDER.id && loan.status === 'active') || null;
    }

    getLifetimeMissionEarnings() {
        const tracked = playerDataManager.data?.financeStats?.lifetimeGrossMissionPay;
        if (typeof tracked === 'number' && tracked > 0) {
            return tracked;
        }
        const history = playerDataManager.getTransactionHistory(FINANCE_LEDGER_MAX_ENTRIES);
        return history.reduce((sum, row) => {
            if (row.category !== FINANCE_CATEGORIES.MISSION) return sum;
            if (row.type !== FINANCE_TRANSACTION_TYPES.DEPOSIT) return sum;
            if (row.grossPayout) return sum + (row.amount || 0);
            return sum + (row.amount || 0);
        }, 0);
    }

    getTotalLiabilities() {
        return this.getActiveLoans().reduce((sum, loan) => sum + (loan.principalRemaining || 0), 0);
    }

    getIncomeCommittedPercent() {
        const loans = this.getActiveLoans();
        if (!loans.length) return 0;
        const pct = loans.reduce((sum, loan) => {
            return sum + ((loan.interestRateOfGross || 0) + (loan.principalRateOfGross || 0)) * 100;
        }, 0);
        return Math.round(pct);
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

    getLienSummaries() {
        return this.getActiveLoans().map(loan => {
            const original = loan.principalOriginal || loan.principalRemaining || 1;
            const remaining = loan.principalRemaining || 0;
            const paid = Math.max(0, original - remaining);
            const progressPct = Math.min(100, Math.round((paid / original) * 100));
            const skimPct = Math.round(((loan.interestRateOfGross || 0) + (loan.principalRateOfGross || 0)) * 100);
            return {
                id: loan.id,
                lenderName: loan.lenderName || loan.lenderId,
                principalOriginal: original,
                principalRemaining: remaining,
                progressPct,
                skimPct,
                termsSummary: loan.termsSummary || ''
            };
        });
    }

    /**
     * Apply lien deductions to a gross contract payout, credit ledger lines, return net.
     * @param {number} gross — total gross pay (contract reward + discovery bonus, etc.)
     * @param {object} context — { missionTitle, missionId, shipId, discoveryBonus }
     */
    applyContractPayoutDeductions(gross, context = {}) {
        const G = Math.round(Number(gross) || 0);
        if (G <= 0) {
            return { gross: 0, net: 0, deductions: [], totalDeducted: 0, isFirstLienReveal: false };
        }

        this.ensurePlayerFinanceState();

        const {
            missionTitle = 'Contract',
            missionId = null,
            shipId = null,
            discoveryBonus = 0
        } = context;

        const grossDesc = discoveryBonus > 0
            ? `Gross contract pay: ${missionTitle} (+ discovery)`
            : `Gross contract pay: ${missionTitle}`;

        playerDataManager.credit(G, FINANCE_CATEGORIES.MISSION, grossDesc, {
            missionId,
            shipId,
            grossPayout: true,
            discoveryBonus: discoveryBonus > 0 ? discoveryBonus : undefined
        });

        const deductions = [];
        this.applyStarHopperSkim(G, missionTitle, deductions);

        const stats = playerDataManager.data.financeStats;
        stats.lifetimeGrossMissionPay = (stats.lifetimeGrossMissionPay || 0) + G;

        const totalDeducted = deductions.reduce((sum, d) => sum + d.amount, 0);
        const net = G - totalDeducted;

        const isFirstLienReveal = !stats.hasSeenLienReveal && totalDeducted > 0;
        if (isFirstLienReveal) {
            stats.hasSeenLienReveal = true;
        }
        playerDataManager.saveData();

        return { gross: G, net, deductions, totalDeducted, isFirstLienReveal };
    }

    applyStarHopperSkim(gross, missionTitle, deductions) {
        const loan = this.getStarHopperLoan();
        if (!loan || (loan.principalRemaining || 0) <= 0) return;

        const interest = Math.round(gross * (loan.interestRateOfGross || 0));
        const principalTarget = Math.round(gross * (loan.principalRateOfGross || 0));
        const principal = Math.min(principalTarget, loan.principalRemaining);

        if (interest > 0) {
            playerDataManager.spend(
                interest,
                FINANCE_CATEGORIES.LOAN,
                `StarHopper interest — ${missionTitle}`,
                { lenderId: loan.lenderId, loanId: loan.id, grossRate: loan.interestRateOfGross }
            );
            deductions.push({
                lenderId: loan.lenderId,
                lenderName: loan.lenderName,
                type: 'interest',
                amount: interest
            });
        }

        if (principal > 0) {
            playerDataManager.spend(
                principal,
                FINANCE_CATEGORIES.LOAN,
                `StarHopper principal — ${missionTitle}`,
                { lenderId: loan.lenderId, loanId: loan.id }
            );
            loan.principalRemaining = Math.max(0, loan.principalRemaining - principal);
            deductions.push({
                lenderId: loan.lenderId,
                lenderName: loan.lenderName,
                type: 'principal',
                amount: principal
            });
        }

        if (loan.principalRemaining <= 0) {
            loan.principalRemaining = 0;
            loan.status = 'paid';
            loan.paidAt = Date.now();
        }
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
