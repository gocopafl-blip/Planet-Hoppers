// scripts/scenes/aegis_banking_scene.js — Aegis Banking Systems (Phase 3.2a+)

const aegisBankingScene = {
    name: 'menu',
    _activeTab: 'statement',

    start(settings) {
        console.log('Starting Aegis Banking Scene...');
        canvas.style.display = 'block';
        const panel = document.getElementById('aegis-banking');
        panel.style.display = 'none';
        panel.classList.remove('slide-out');

        setTimeout(() => {
            panel.style.display = 'flex';
            panel.classList.add('slide-in');
            this.refreshPanel();
        }, 500);

        this._closeBtn = document.getElementById('closeAegisBankingBtn');
        this._tabButtons = panel?.querySelectorAll('.aegis-tab-btn') || [];
        this._marketGrid = document.getElementById('aegis-market-grid');
        this._liensList = document.getElementById('aegis-liens-list');
        this._boundClose = this.handleClose.bind(this);
        this._boundTabClick = this.handleTabClick.bind(this);
        this._boundMarketClick = this.handleMarketClick.bind(this);
        this._boundLiensClick = this.handleLiensClick.bind(this);

        if (this._closeBtn) {
            this._closeBtn.addEventListener('click', this._boundClose);
        }
        this._tabButtons.forEach(btn => {
            btn.addEventListener('click', this._boundTabClick);
        });
        if (this._marketGrid) {
            this._marketGrid.addEventListener('click', this._boundMarketClick);
        }
        if (this._liensList) {
            this._liensList.addEventListener('click', this._boundLiensClick);
        }
    },

    stop() {
        if (this._closeBtn && this._boundClose) {
            this._closeBtn.removeEventListener('click', this._boundClose);
        }
        this._tabButtons.forEach(btn => {
            btn.removeEventListener('click', this._boundTabClick);
        });
        if (this._marketGrid && this._boundMarketClick) {
            this._marketGrid.removeEventListener('click', this._boundMarketClick);
        }
        if (this._liensList && this._boundLiensClick) {
            this._liensList.removeEventListener('click', this._boundLiensClick);
        }
        const panel = document.getElementById('aegis-banking');
        if (panel) {
            panel.style.display = 'none';
            panel.classList.remove('slide-in', 'slide-out');
        }
    },

    handleTabClick(event) {
        const btn = event.target.closest('.aegis-tab-btn');
        if (!btn || btn.disabled) return;
        this.setActiveTab(btn.dataset.tab);
    },

    setActiveTab(tabId) {
        this._activeTab = tabId;
        const panel = document.getElementById('aegis-banking');
        if (!panel) return;

        panel.querySelectorAll('.aegis-tab-btn').forEach(btn => {
            btn.classList.toggle('aegis-tab-active', btn.dataset.tab === tabId);
        });
        panel.querySelectorAll('.aegis-tab-panel').forEach(el => {
            el.classList.toggle('aegis-tab-hidden', el.dataset.tab !== tabId);
        });
    },

    refreshPanel() {
        const snap = bankingManager.getDashboardSnapshot();
        const bm = bankingManager;

        const setText = (id, text) => {
            const el = document.getElementById(id);
            if (el) el.textContent = text;
        };

        setText('aegis-balance-value', bm.formatCredits(snap.balance));
        setText('aegis-liabilities-value', bm.formatCredits(snap.totalLiabilities));
        setText('aegis-lifetime-value', bm.formatCredits(snap.lifetimeEarnings));
        setText('aegis-committed-value', snap.incomeCommittedPct > 0
            ? `${snap.incomeCommittedPct}%`
            : '—');
        setText('aegis-credit-value', `${snap.creditScore} · ${snap.creditGrade}`);
        setText('aegis-company-meta', `${snap.companyName} · contractor account`);

        this.renderStatement();
        this.renderLiens();
        this.renderMarket();
        this.setActiveTab(this._activeTab);
    },

    renderLiens() {
        const list = document.getElementById('aegis-liens-list');
        if (!list) return;

        const liens = bankingManager.getLienSummaries();
        if (!liens.length) {
            list.innerHTML = '<p class="aegis-empty">No active liens. Your contractor advance is fully repaid.</p>';
            return;
        }

        list.innerHTML = liens.map(lien => {
            const bm = bankingManager;
            const productLine = lien.productName
                ? `<span class="aegis-lien-product">${bm.escapeHtml(lien.productName)}</span>`
                : '';
            const collateralLine = lien.collateralShipName
                ? `<p class="aegis-lien-collateral">Collateral: ${bm.escapeHtml(lien.collateralShipName)}</p>`
                : '';
            const perJobLine = lien.perJobFee > 0
                ? `<p class="aegis-lien-hook">¢${lien.perJobFee.toLocaleString()} per completed contract</p>`
                : '';
            const earlyFeeHint = lien.earlyPayoffFee > 0
                ? `<span class="aegis-lien-payoff-hint">Pay in full: ${bm.escapeHtml(bm.formatCredits(lien.payoffTotal))} incl. ¢${lien.earlyPayoffFee.toLocaleString()} fee</span>`
                : '';
            return `
                <div class="aegis-lien-card" data-loan-id="${bm.escapeHtml(lien.id)}">
                    <div class="aegis-lien-header">
                        <span class="aegis-lien-lender">${bm.escapeHtml(lien.lenderName)}</span>
                        <span class="aegis-lien-skim">${lien.headlineRatePct}% headline · ${lien.skimPct}% skim</span>
                    </div>
                    ${productLine}
                    ${collateralLine}
                    ${perJobLine}
                    <div class="aegis-lien-balance">
                        <span>Principal remaining</span>
                        <strong>${bm.escapeHtml(bm.formatCredits(lien.principalRemaining))}</strong>
                        <span class="aegis-lien-original">of ${bm.escapeHtml(bm.formatCredits(lien.principalOriginal))}</span>
                    </div>
                    <div class="aegis-lien-progress" role="progressbar"
                        aria-valuenow="${lien.progressPct}" aria-valuemin="0" aria-valuemax="100">
                        <div class="aegis-lien-progress-fill" style="width: ${lien.progressPct}%"></div>
                    </div>
                    <p class="aegis-lien-terms">${bm.escapeHtml(lien.termsSummary)}</p>
                    <p class="aegis-lien-fineprint">${bm.escapeHtml(lien.finePrint)}</p>
                    <div class="aegis-lien-actions">
                        <button type="button" class="aegis-lien-pay-btn" data-loan-id="${bm.escapeHtml(lien.id)}" data-pay-mode="partial">Make payment</button>
                        <button type="button" class="aegis-lien-pay-btn aegis-lien-pay-btn--full" data-loan-id="${bm.escapeHtml(lien.id)}" data-pay-mode="full">Pay in full</button>
                    </div>
                    ${earlyFeeHint}
                </div>
            `;
        }).join('');
    },

    async handleLiensClick(event) {
        const btn = event.target.closest('.aegis-lien-pay-btn');
        if (!btn) return;

        const loanId = btn.dataset.loanId;
        const payMode = btn.dataset.payMode;
        const bm = bankingManager;
        const loan = bm.getLoanById(loanId);
        if (!loan) return;

        if (payMode === 'full') {
            const quote = bm.getManualPaymentQuote(loanId, loan.principalRemaining);
            if (!quote.ok) {
                uiNotify({ title: 'Payment declined', message: quote.message, variant: 'warning' });
                return;
            }
            const feeLine = quote.earlyPayoffFee > 0
                ? `\nEarly payoff fee: ${bm.formatCredits(quote.earlyPayoffFee)}`
                : '';
            const accepted = await uiPrompt.confirm({
                title: `Pay off ${loan.lenderName}?`,
                message: `Principal: ${bm.formatCredits(quote.principalDue)}${feeLine}\nTotal: ${bm.formatCredits(quote.totalDue)}`,
                confirmLabel: 'Pay & close lien',
                cancelLabel: 'Cancel'
            });
            if (!accepted) return;

            const result = bm.makeManualPayment(loanId, quote.principalDue);
            uiNotify({
                title: result.ok ? 'Lien cleared' : 'Payment declined',
                message: result.message,
                variant: result.ok ? 'success' : 'warning',
                durationMs: 7000
            });
            if (result.ok) this.refreshPanel();
            return;
        }

        const quote = bm.getManualPaymentQuote(loanId, loan.principalRemaining);
        const feeNote = loan.earlyPayoffFee > 0
            ? `\nPaying the full ${bm.formatCredits(loan.principalRemaining)} adds a ¢${loan.earlyPayoffFee.toLocaleString()} early payoff fee.`
            : '';
        const amountStr = await uiPrompt.prompt({
            title: `Pay ${loan.lenderName}`,
            message: `Amount toward principal (max ${bm.formatCredits(loan.principalRemaining)}).${feeNote}`,
            defaultValue: String(Math.min(500, loan.principalRemaining)),
            confirmLabel: 'Pay',
            cancelLabel: 'Cancel'
        });
        if (amountStr == null) return;

        const amount = Math.round(Number(String(amountStr).replace(/[^\d]/g, '')) || 0);
        if (amount <= 0) {
            uiNotify({ title: 'Invalid amount', message: 'Enter a positive credit amount.', variant: 'warning' });
            return;
        }

        const result = bm.makeManualPayment(loanId, amount);
        uiNotify({
            title: result.ok ? 'Payment posted' : 'Payment declined',
            message: result.message,
            variant: result.ok ? 'success' : 'warning',
            durationMs: 7000
        });
        if (result.ok) this.refreshPanel();
    },

    renderMarket() {
        const header = document.getElementById('aegis-market-header');
        const grid = document.getElementById('aegis-market-grid');
        if (!header || !grid) return;

        const market = bankingManager.getMarketOffers();
        const bm = bankingManager;

        if (!market.unlocked) {
            const remaining = Math.max(0, market.unlockThreshold - market.lifetimeEarnings);
            header.innerHTML = `
                <p class="aegis-market-lock-title">Loan market locked</p>
                <p class="aegis-market-lock-desc">
                    Earn <strong>${bm.escapeHtml(bm.formatCredits(remaining))}</strong> more lifetime contract pay
                    to access third-party lenders (¢${market.unlockThreshold.toLocaleString()} total required).
                </p>
            `;
        } else {
            header.innerHTML = `
                <p class="aegis-market-unlock-title">K-14 Trust Index: ${market.creditScore} · ${market.creditGrade}</p>
                <p class="aegis-market-unlock-desc">Browse lenders below. Headline rates hide the fine print — read before you draw.</p>
            `;
        }

        if (!market.offers.length) {
            grid.innerHTML = '<p class="aegis-empty">No loan products in catalogue.</p>';
            return;
        }

        grid.innerHTML = market.offers.map(offer => {
            const locked = !offer.eligible;
            const lockClass = locked ? 'aegis-market-card--locked' : '';
            const drawDisabled = locked ? 'disabled' : '';
            return `
                <article class="aegis-market-card ${lockClass}" data-lender-id="${bm.escapeHtml(offer.lenderId)}" data-product-id="${bm.escapeHtml(offer.productId)}">
                    <header class="aegis-market-card-header">
                        <h3 class="aegis-market-lender">${bm.escapeHtml(offer.lenderName)}</h3>
                        <span class="aegis-market-rate">${offer.headlineRatePct}% income</span>
                    </header>
                    <p class="aegis-market-tagline">${bm.escapeHtml(offer.lenderTagline)}</p>
                    <p class="aegis-market-product">${bm.escapeHtml(offer.productName)} · ${bm.escapeHtml(bm.formatCredits(offer.principal))}</p>
                    <dl class="aegis-market-stats">
                        <div><dt>Net draw</dt><dd>${bm.escapeHtml(bm.formatCredits(offer.netDraw))}</dd></div>
                        <div><dt>Min K-14</dt><dd>${offer.minCreditScore}</dd></div>
                    </dl>
                    <p class="aegis-market-terms">${bm.escapeHtml(offer.termsSummary)}</p>
                    <p class="aegis-market-fineprint">${bm.escapeHtml(offer.finePrint)}</p>
                    ${locked
                        ? `<p class="aegis-market-lock-reason">${bm.escapeHtml(offer.lockReason)}</p>`
                        : `<button type="button" class="aegis-market-draw-btn" data-lender-id="${bm.escapeHtml(offer.lenderId)}" data-product-id="${bm.escapeHtml(offer.productId)}" ${drawDisabled}>Draw loan</button>`
                    }
                </article>
            `;
        }).join('');
    },

    async handleMarketClick(event) {
        const btn = event.target.closest('.aegis-market-draw-btn');
        if (!btn || btn.disabled) return;

        const lenderId = btn.dataset.lenderId;
        const productId = btn.dataset.productId;
        const { lender, product } = bankingManager.findCatalogueProduct(lenderId, productId);
        if (!lender || !product) return;

        const bm = bankingManager;
        const netDraw = Math.max(0, product.principal - (product.originationFee || 0));
        const confirmMsg = [
            `${product.name} — ${bm.formatCredits(product.principal)} principal`,
            `Headline: ${product.headlineRatePct}% of gross contract pay`,
            `Fine print: ${product.finePrint}`,
            `Net cash after ¢${(product.originationFee || 0).toLocaleString()} origination: ${bm.formatCredits(netDraw)}`,
            '',
            'Repayment is automatic from future contract pay per signed terms.'
        ].join('\n');

        const accepted = await uiPrompt.confirm({
            title: `Draw from ${lender.name}?`,
            message: confirmMsg,
            confirmLabel: 'Sign & draw',
            cancelLabel: 'Walk away',
            variant: 'default'
        });

        if (!accepted) return;

        const result = bankingManager.drawLoan(lenderId, productId);
        if (result.ok) {
            uiNotify({
                title: 'Loan drawn',
                message: result.message,
                variant: 'success',
                durationMs: 8000
            });
            this._activeTab = 'liens';
            this.refreshPanel();
        } else {
            uiNotify({
                title: 'Loan declined',
                message: result.message,
                variant: 'warning',
                durationMs: 6000
            });
        }
    },

    renderStatement() {
        const list = document.getElementById('aegis-statement-list');
        if (!list) return;

        const rows = bankingManager.getStatementRows(50);
        if (!rows.length) {
            list.innerHTML = '<p class="aegis-empty">No transactions yet. Complete a contract to see your statement.</p>';
            return;
        }

        list.innerHTML = rows.map(row => {
            const typeClass = row.type === FINANCE_TRANSACTION_TYPES.DEPOSIT
                ? 'aegis-amount-credit'
                : 'aegis-amount-debit';
            return `
                <div class="aegis-statement-row">
                    <div class="aegis-statement-main">
                        <span class="aegis-statement-time">${bankingManager.escapeHtml(row.timestampLabel)}</span>
                        <span class="aegis-statement-cat">${bankingManager.escapeHtml(row.categoryLabel)}</span>
                        <span class="aegis-statement-desc">${bankingManager.escapeHtml(row.description)}</span>
                    </div>
                    <div class="aegis-statement-amounts">
                        <span class="aegis-statement-amount ${typeClass}">${bankingManager.escapeHtml(row.amountLabel)}</span>
                        <span class="aegis-statement-balance">${bankingManager.escapeHtml(row.balanceLabel)}</span>
                    </div>
                </div>
            `;
        }).join('');
    },

    handleClose() {
        if (gameManager.activeScene !== aegisBankingScene) return;
        const panel = document.getElementById('aegis-banking');
        panel.classList.remove('slide-in');
        panel.classList.add('slide-out');
        setTimeout(() => gameManager.switchScene(spaceDockScene), 500);
    },

    update() {},

    draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const bg = assetManager.getImage('aegis_banking_bg');
        if (bg && bg.complete) {
            ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
        }
    }
};
