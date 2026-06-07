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

    clampCreditScore(score) {
        return Math.max(CREDIT_SCORE.MIN, Math.min(CREDIT_SCORE.MAX, Math.round(score)));
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
            data.financeStats = {
                hasSeenLienReveal: false,
                lifetimeGrossMissionPay: 0,
                manualPaymentCount: 0
            };
            changed = true;
        }
        if (typeof data.financeStats.manualPaymentCount !== 'number') {
            data.financeStats.manualPaymentCount = 0;
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
            productName: 'Contractor Advance',
            principalOriginal: STARHOPPER_ADVANCE.principal,
            principalRemaining: STARHOPPER_ADVANCE.principal,
            interestRateOfGross: STARHOPPER_ADVANCE.interestRateOfGross,
            principalRateOfGross: STARHOPPER_ADVANCE.principalRateOfGross,
            skimRateOfGross: skim,
            headlineRatePct: Math.round(skim * 100),
            earlyPayoffFee: 0,
            status: 'active',
            signedAt: Date.now(),
            termsSummary: STARHOPPER_LENDER.termsSummary,
            finePrint: STARHOPPER_LENDER.termsSummary,
            isOpeningAdvance: true
        };
    }

    createMarketLoanRecord(lender, product) {
        const skim = product.interestRateOfGross + product.principalRateOfGross;
        const loan = {
            id: `loan_${lender.id}_${product.id}_${Date.now()}`,
            lenderId: lender.id,
            lenderName: lender.name,
            productId: product.id,
            productName: product.name,
            principalOriginal: product.principal,
            principalRemaining: product.principal,
            interestRateOfGross: product.interestRateOfGross,
            principalRateOfGross: product.principalRateOfGross,
            skimRateOfGross: skim,
            headlineRatePct: product.headlineRatePct,
            earlyPayoffFee: product.earlyPayoffFee || 0,
            perJobFee: product.perJobFee || 0,
            compoundAfterMissions: product.compoundAfterMissions || 0,
            compoundPrincipalPct: product.compoundPrincipalPct || 0,
            missionsSincePrincipalPayment: 0,
            status: 'active',
            signedAt: Date.now(),
            termsSummary: product.termsSummary,
            finePrint: product.finePrint || product.termsSummary,
            isOpeningAdvance: false
        };

        if (product.collateralRequired) {
            const ship = playerDataManager.getActiveShip?.();
            if (ship) {
                loan.collateralShipId = ship.id;
                loan.collateralShipName = ship.name;
            }
        }

        return loan;
    }

    getLoanById(loanId) {
        const loans = playerDataManager.data?.activeLoans;
        if (!Array.isArray(loans)) return null;
        return loans.find(loan => loan.id === loanId && loan.status === 'active') || null;
    }

    markLoanPaid(loan) {
        if (!loan) return;
        loan.principalRemaining = 0;
        loan.status = 'paid';
        loan.paidAt = Date.now();
    }

    getActiveLoans() {
        const loans = playerDataManager.data?.activeLoans;
        if (!Array.isArray(loans)) return [];
        return loans.filter(loan => loan.status === 'active' && (loan.principalRemaining || 0) > 0);
    }

    /** Payout order: StarHopper first, then market loans by signedAt. */
    getActiveLoansForPayout() {
        return [...this.getActiveLoans()].sort((a, b) => {
            if (a.lenderId === STARHOPPER_LENDER.id) return -1;
            if (b.lenderId === STARHOPPER_LENDER.id) return 1;
            return (a.signedAt || 0) - (b.signedAt || 0);
        });
    }

    hasActiveProductLoan(lenderId, productId) {
        return this.getActiveLoans().some(
            loan => loan.lenderId === lenderId && loan.productId === productId
        );
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
            return sum + (row.amount || 0);
        }, 0);
    }

    isLoanMarketUnlocked() {
        return this.getLifetimeMissionEarnings() >= LOAN_MARKET_MIN_LIFETIME_EARNINGS;
    }

    getCreditScore() {
        this.ensurePlayerFinanceState();

        const lifetime = this.getLifetimeMissionEarnings();
        const liabilities = this.getTotalLiabilities();
        const marketLoans = this.getActiveLoans().filter(l => l.lenderId !== STARHOPPER_LENDER.id);
        const extraLoans = Math.max(0, marketLoans.length);

        let score = CREDIT_SCORE.BASE;

        if (lifetime > 0) {
            const debtRatio = liabilities / lifetime;
            score -= Math.min(280, Math.round(debtRatio * 160));
        } else if (liabilities > 0) {
            score -= 130;
        }

        score -= extraLoans * CREDIT_SCORE.EXTRA_LOAN_PENALTY;

        if (this.isLoanMarketUnlocked()) {
            score += CREDIT_SCORE.MARKET_UNLOCK_BONUS;
        }

        const manualPayments = playerDataManager.data?.financeStats?.manualPaymentCount || 0;
        score += Math.min(40, manualPayments * CREDIT_SCORE.MANUAL_PAYMENT_BONUS);

        return this.clampCreditScore(score);
    }

    getCreditGrade(score = this.getCreditScore()) {
        if (score >= 720) return 'Excellent';
        if (score >= 640) return 'Good';
        if (score >= 520) return 'Fair';
        return 'Poor';
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

    getDashboardSnapshot() {
        const creditScore = this.getCreditScore();
        return {
            balance: playerDataManager.getBalance(),
            totalLiabilities: this.getTotalLiabilities(),
            lifetimeEarnings: this.getLifetimeMissionEarnings(),
            incomeCommittedPct: this.getIncomeCommittedPercent(),
            creditScore,
            creditGrade: this.getCreditGrade(creditScore),
            marketUnlocked: this.isLoanMarketUnlocked(),
            marketUnlockThreshold: LOAN_MARKET_MIN_LIFETIME_EARNINGS,
            companyName: playerDataManager.getCompanyName?.() || 'Contractor'
        };
    }

    findCatalogueProduct(lenderId, productId) {
        const lender = LENDER_CATALOGUE.find(l => l.id === lenderId);
        if (!lender) return { lender: null, product: null };
        const product = lender.products.find(p => p.id === productId);
        return { lender, product };
    }

    getProductEligibility(lender, product) {
        if (!this.isLoanMarketUnlocked()) {
            const remaining = LOAN_MARKET_MIN_LIFETIME_EARNINGS - this.getLifetimeMissionEarnings();
            return {
                eligible: false,
                reason: `Earn ¢${Math.max(0, remaining).toLocaleString()} more contract pay to unlock the loan market.`
            };
        }

        const creditScore = this.getCreditScore();
        const required = product.minCreditScore || lender.minCreditScore || CREDIT_SCORE.MIN;
        if (creditScore < required) {
            return {
                eligible: false,
                reason: `K-14 score ${creditScore} below required ${required}.`
            };
        }

        if (this.hasActiveProductLoan(lender.id, product.id)) {
            return { eligible: false, reason: 'You already hold this loan product.' };
        }

        return { eligible: true, reason: null };
    }

    getMarketOffers() {
        const creditScore = this.getCreditScore();
        const unlocked = this.isLoanMarketUnlocked();
        const offers = [];

        LENDER_CATALOGUE.forEach(lender => {
            lender.products.forEach(product => {
                const eligibility = this.getProductEligibility(lender, product);
                const netDraw = Math.max(0, product.principal - (product.originationFee || 0));
                offers.push({
                    lenderId: lender.id,
                    lenderName: lender.name,
                    lenderTagline: lender.tagline,
                    productId: product.id,
                    productName: product.name,
                    principal: product.principal,
                    headlineRatePct: product.headlineRatePct,
                    originationFee: product.originationFee || 0,
                    earlyPayoffFee: product.earlyPayoffFee || 0,
                    perJobFee: product.perJobFee || 0,
                    netDraw,
                    termsSummary: product.termsSummary,
                    finePrint: product.finePrint || product.termsSummary,
                    minCreditScore: product.minCreditScore || lender.minCreditScore,
                    eligible: eligibility.eligible,
                    lockReason: eligibility.reason,
                    creditScore
                });
            });
        });

        return {
            unlocked,
            unlockThreshold: LOAN_MARKET_MIN_LIFETIME_EARNINGS,
            lifetimeEarnings: this.getLifetimeMissionEarnings(),
            creditScore,
            creditGrade: this.getCreditGrade(creditScore),
            offers
        };
    }

    /** Comparison grid: amounts as rows, lenders as columns (Phase A loan market UI). */
    refreshMarketLenderRotation() {
        const ids = LENDER_CATALOGUE.map(lender => lender.id);
        for (let i = ids.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [ids[i], ids[j]] = [ids[j], ids[i]];
        }
        this._visibleMarketLenderIds = ids.slice(0, LOAN_MARKET_VISIBLE_LENDER_COUNT);
    }

    getVisibleMarketLenderIds() {
        if (!this._visibleMarketLenderIds?.length) {
            this.refreshMarketLenderRotation();
        }
        return this._visibleMarketLenderIds;
    }

    getMarketComparisonGrid() {
        const market = this.getMarketOffers();
        const visibleIds = new Set(this.getVisibleMarketLenderIds());
        const lenders = LENDER_CATALOGUE
            .filter(lender => visibleIds.has(lender.id))
            .map(lender => ({
                id: lender.id,
                name: lender.name,
                tagline: lender.tagline,
                logoKey: lender.logoKey,
                logoPath: lender.logoKey ? assetCatalogue.images[lender.logoKey] : null,
                brandColor: lender.brandColor || '#6ec8ff',
                channelLabel: lender.channelLabel || '',
                ribbon: lender.ribbon || null
            }));

        const offerByKey = {};
        market.offers.forEach(offer => {
            if (!visibleIds.has(offer.lenderId)) return;
            offerByKey[`${offer.principal}:${offer.lenderId}`] = offer;
        });

        const amountSet = new Set();
        Object.keys(offerByKey).forEach(key => {
            amountSet.add(Number(key.split(':')[0]));
        });
        const amounts = [...amountSet].sort((a, b) => a - b);

        return {
            ...market,
            lenders,
            amounts,
            offerByKey,
            amountIconPath: assetCatalogue.images.loan_amount_icon
        };
    }

    getMarketRibbonLabel(ribbon) {
        const labels = {
            best_rate: 'Best rate!',
            lowest_fee: 'Lowest fee',
            fast_funding: 'Fast funding!',
            great_value: 'Great value!',
            no_upfront_fee: 'No upfront fee'
        };
        return labels[ribbon] || null;
    }

    /**
     * Draw a market loan — disburse principal, charge origination fee, add active lien.
     * @returns {{ ok: boolean, message: string, loan?: object }}
     */
    drawLoan(lenderId, productId) {
        this.ensurePlayerFinanceState();

        const { lender, product } = this.findCatalogueProduct(lenderId, productId);
        if (!lender || !product) {
            return { ok: false, message: 'Unknown lender or loan product.' };
        }

        const eligibility = this.getProductEligibility(lender, product);
        if (!eligibility.eligible) {
            return { ok: false, message: eligibility.reason || 'Loan not available.' };
        }

        const loan = this.createMarketLoanRecord(lender, product);
        playerDataManager.data.activeLoans.push(loan);

        playerDataManager.credit(
            product.principal,
            FINANCE_CATEGORIES.LOAN,
            `Loan draw: ${product.name} — ${lender.name}`,
            { lenderId: lender.id, productId: product.id, loanId: loan.id, disbursement: true }
        );

        const originationFee = product.originationFee || 0;
        if (originationFee > 0) {
            const paid = playerDataManager.spend(
                originationFee,
                FINANCE_CATEGORIES.LOAN,
                `Origination fee: ${product.name} — ${lender.name}`,
                { lenderId: lender.id, productId: product.id, loanId: loan.id, originationFee: true }
            );
            if (!paid) {
                loan.principalRemaining += originationFee;
                loan.principalOriginal += originationFee;
            }
        }

        playerDataManager.saveData();

        const net = product.principal - originationFee;
        return {
            ok: true,
            message: `¢${net.toLocaleString()} deposited (${product.name}). ${product.headlineRatePct}% of future gross pay until repaid.`,
            loan
        };
    }

    getLienSummaries() {
        return this.getActiveLoans().map(loan => {
            const original = loan.principalOriginal || loan.principalRemaining || 1;
            const remaining = loan.principalRemaining || 0;
            const paid = Math.max(0, original - remaining);
            const progressPct = Math.min(100, Math.round((paid / original) * 100));
            const skimPct = Math.round(((loan.interestRateOfGross || 0) + (loan.principalRateOfGross || 0)) * 100);
            const payoffQuote = this.getManualPaymentQuote(loan.id, remaining);
            return {
                id: loan.id,
                lenderName: loan.lenderName || loan.lenderId,
                productName: loan.productName || '',
                principalOriginal: original,
                principalRemaining: remaining,
                progressPct,
                skimPct,
                headlineRatePct: loan.headlineRatePct || skimPct,
                earlyPayoffFee: loan.earlyPayoffFee || 0,
                perJobFee: loan.perJobFee || 0,
                payoffTotal: payoffQuote.totalDue,
                collateralShipName: loan.collateralShipName || null,
                termsSummary: loan.termsSummary || '',
                finePrint: loan.finePrint || loan.termsSummary || '',
                isOpeningAdvance: !!loan.isOpeningAdvance
            };
        });
    }

    /**
     * Quote a manual payment toward principal.
     * @param {string} loanId
     * @param {number|null} amount — null or full remaining triggers early payoff fee when applicable
     */
    getManualPaymentQuote(loanId, amount = null) {
        const loan = this.getLoanById(loanId);
        if (!loan) {
            return { ok: false, message: 'Loan not found.' };
        }

        const remaining = loan.principalRemaining || 0;
        if (remaining <= 0) {
            return { ok: false, message: 'This loan is already repaid.' };
        }

        let principalDue = Math.round(Number(amount) || 0);
        if (!principalDue || principalDue > remaining) {
            principalDue = remaining;
        }
        principalDue = Math.max(1, Math.min(principalDue, remaining));

        const paysOff = principalDue >= remaining;
        const earlyPayoffFee = paysOff ? (loan.earlyPayoffFee || 0) : 0;
        const totalDue = principalDue + earlyPayoffFee;

        return {
            ok: true,
            loanId: loan.id,
            lenderName: loan.lenderName,
            principalDue,
            earlyPayoffFee,
            totalDue,
            paysOff,
            balance: playerDataManager.getBalance(),
            canAfford: playerDataManager.getBalance() >= totalDue
        };
    }

    /**
     * Manual paydown from player balance (Phase 3.2d).
     * @returns {{ ok: boolean, message: string }}
     */
    makeManualPayment(loanId, amount) {
        this.ensurePlayerFinanceState();

        const quote = this.getManualPaymentQuote(loanId, amount);
        if (!quote.ok) {
            return { ok: false, message: quote.message };
        }

        if (!quote.canAfford) {
            return {
                ok: false,
                message: `Insufficient balance. Need ${this.formatCredits(quote.totalDue)}.`
            };
        }

        const loan = this.getLoanById(loanId);
        if (!loan) {
            return { ok: false, message: 'Loan not found.' };
        }

        const label = loan.lenderName || loan.lenderId;
        const paidPrincipal = playerDataManager.spend(
            quote.principalDue,
            FINANCE_CATEGORIES.LOAN,
            `Manual paydown — ${label}`,
            { lenderId: loan.lenderId, loanId: loan.id, manualPayment: true, principal: quote.principalDue }
        );
        if (!paidPrincipal) {
            return { ok: false, message: 'Payment failed — insufficient funds.' };
        }

        loan.principalRemaining = Math.max(0, (loan.principalRemaining || 0) - quote.principalDue);

        if (quote.earlyPayoffFee > 0) {
            playerDataManager.spend(
                quote.earlyPayoffFee,
                FINANCE_CATEGORIES.LOAN,
                `Early payoff fee — ${label}`,
                { lenderId: loan.lenderId, loanId: loan.id, earlyPayoffFee: true }
            );
        }

        if (loan.principalRemaining <= 0) {
            this.markLoanPaid(loan);
        } else {
            loan.missionsSincePrincipalPayment = 0;
        }

        const stats = playerDataManager.data.financeStats;
        stats.manualPaymentCount = (stats.manualPaymentCount || 0) + 1;
        playerDataManager.saveData();

        let message = `Paid ${this.formatCredits(quote.principalDue)} toward ${label}.`;
        if (quote.earlyPayoffFee > 0) {
            message += ` Early payoff fee: ${this.formatCredits(quote.earlyPayoffFee)}.`;
        }
        if (quote.paysOff) {
            message += ' Lien cleared.';
        } else {
            message += ` Remaining: ${this.formatCredits(loan.principalRemaining)}.`;
        }

        return { ok: true, message, quote };
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
        const orderedLoans = this.getActiveLoansForPayout();
        const starhopper = orderedLoans.find(l => l.lenderId === STARHOPPER_LENDER.id);
        const marketLoans = orderedLoans.filter(l => l.lenderId !== STARHOPPER_LENDER.id);

        if (starhopper) {
            this.applyLoanSkim(starhopper, G, missionTitle, deductions);
        }
        this.applyPerJobFees(missionTitle, deductions);
        marketLoans.forEach(loan => {
            this.applyLoanSkim(loan, G, missionTitle, deductions);
        });

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

    applyPerJobFees(missionTitle, deductions) {
        this.getActiveLoans().forEach(loan => {
            if (loan.lenderId === STARHOPPER_LENDER.id) return;
            const fee = loan.perJobFee || 0;
            if (fee <= 0) return;

            const label = loan.lenderName || loan.lenderId;
            playerDataManager.spend(
                fee,
                FINANCE_CATEGORIES.LOAN,
                `${label} per-job fee — ${missionTitle}`,
                { lenderId: loan.lenderId, loanId: loan.id, perJobFee: true }
            );
            deductions.push({
                lenderId: loan.lenderId,
                lenderName: loan.lenderName,
                type: 'per_job_fee',
                amount: fee
            });
        });
    }

    applyLoanSkim(loan, gross, missionTitle, deductions) {
        if (!loan || (loan.principalRemaining || 0) <= 0) return;

        const label = loan.lenderName || loan.lenderId;
        const interest = Math.round(gross * (loan.interestRateOfGross || 0));
        const principalTarget = Math.round(gross * (loan.principalRateOfGross || 0));
        const principal = Math.min(principalTarget, loan.principalRemaining);

        if (interest > 0) {
            playerDataManager.spend(
                interest,
                FINANCE_CATEGORIES.LOAN,
                `${label} interest — ${missionTitle}`,
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
                `${label} principal — ${missionTitle}`,
                { lenderId: loan.lenderId, loanId: loan.id }
            );
            loan.principalRemaining = Math.max(0, loan.principalRemaining - principal);
            deductions.push({
                lenderId: loan.lenderId,
                lenderName: loan.lenderName,
                type: 'principal',
                amount: principal
            });
            loan.missionsSincePrincipalPayment = 0;
        } else if (loan.compoundAfterMissions > 0) {
            loan.missionsSincePrincipalPayment = (loan.missionsSincePrincipalPayment || 0) + 1;
            if (loan.missionsSincePrincipalPayment >= loan.compoundAfterMissions) {
                const bump = Math.round(
                    (loan.principalRemaining || 0) * (loan.compoundPrincipalPct || 0)
                );
                if (bump > 0) {
                    loan.principalRemaining += bump;
                    loan.principalOriginal = (loan.principalOriginal || loan.principalRemaining) + bump;
                    playerDataManager.recordTransaction(
                        FINANCE_TRANSACTION_TYPES.WITHDRAWAL,
                        FINANCE_CATEGORIES.LOAN,
                        bump,
                        `${label} principal compound — ${missionTitle}`,
                        { lenderId: loan.lenderId, loanId: loan.id, compound: true }
                    );
                }
                loan.missionsSincePrincipalPayment = 0;
            }
        }

        if (loan.principalRemaining <= 0) {
            this.markLoanPaid(loan);
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
