// scripts/scenes/aegis_banking_scene.js — Aegis Banking Systems (Phase 3.2a)

const aegisBankingScene = {
    name: 'menu',

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
        this._boundClose = this.handleClose.bind(this);
        this._boundTabClick = this.handleTabClick.bind(this);

        if (this._closeBtn) {
            this._closeBtn.addEventListener('click', this._boundClose);
        }
        this._tabButtons.forEach(btn => {
            btn.addEventListener('click', this._boundTabClick);
        });
    },

    stop() {
        if (this._closeBtn && this._boundClose) {
            this._closeBtn.removeEventListener('click', this._boundClose);
        }
        this._tabButtons.forEach(btn => {
            btn.removeEventListener('click', this._boundTabClick);
        });
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
        setText('aegis-credit-value', snap.creditScore != null ? String(snap.creditScore) : '—');
        setText('aegis-company-meta', `${snap.companyName} · contractor account`);

        this.renderStatement();
        this.renderLiens();
        this.setActiveTab('statement');
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
            return `
                <div class="aegis-lien-card">
                    <div class="aegis-lien-header">
                        <span class="aegis-lien-lender">${bm.escapeHtml(lien.lenderName)}</span>
                        <span class="aegis-lien-skim">${lien.skimPct}% of gross pay</span>
                    </div>
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
                </div>
            `;
        }).join('');
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
