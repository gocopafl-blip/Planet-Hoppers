// scripts/scenes/titan_supply_scene.js — Titan Supply Services (consumables)

const titanSupplyScene = {
    name: 'menu',

    start(settings) {
        console.log('Starting Titan Supply Scene...');
        canvas.style.display = 'block';
        const panel = document.getElementById('titan-supply');
        panel.style.display = 'none';
        panel.classList.remove('slide-in', 'slide-out');

        setTimeout(() => {
            panel.style.display = 'flex';
            panel.classList.add('slide-in');
            this.populateSupplyList();
        }, 500);

        this._supplyList = document.getElementById('titan-supply-list');
        this._closeBtn = document.getElementById('closeTitanSupplyBtn');
        this._boundHandleSupplyClick = this.handleSupplyClick.bind(this);
        this._boundHandleClose = this.handleClose.bind(this);
        if (this._supplyList) {
            this._supplyList.addEventListener('click', this._boundHandleSupplyClick);
        }
        if (this._closeBtn) {
            this._closeBtn.addEventListener('click', this._boundHandleClose);
        }
    },

    stop() {
        if (this._supplyList && this._boundHandleSupplyClick) {
            this._supplyList.removeEventListener('click', this._boundHandleSupplyClick);
        }
        if (this._closeBtn && this._boundHandleClose) {
            this._closeBtn.removeEventListener('click', this._boundHandleClose);
        }
        const panel = document.getElementById('titan-supply');
        panel.style.display = 'none';
        panel.classList.remove('slide-in', 'slide-out');
    },

    handleSupplyClick(event) {
        const btn = event.target.closest('button[data-action]');
        if (!btn) return;

        const shipId = parseInt(btn.dataset.shipId, 10);
        const action = btn.dataset.action;
        const key = btn.dataset.consumable;

        let result;
        if (action === 'fill-all') {
            result = consumablesManager.purchaseFillAll(shipId);
        } else if (action === 'fill') {
            result = consumablesManager.purchaseFill(shipId, key);
        } else {
            return;
        }

        if (result.message) {
            uiNotify({
                title: result.ok ? 'Resupply Complete' : 'Resupply Failed',
                message: result.message,
                variant: result.ok ? 'success' : 'warning',
                durationMs: result.ok ? 5000 : 8000
            });
        }
        if (result.ok) {
            this.populateSupplyList();
        }
    },

    handleClose() {
        if (gameManager.activeScene !== titanSupplyScene) return;
        const panel = document.getElementById('titan-supply');
        panel.classList.remove('slide-in');
        panel.classList.add('slide-out');
        setTimeout(() => gameManager.switchScene(spaceDockScene), 500);
    },

    populateSupplyList() {
        const list = document.getElementById('titan-supply-list');
        const balanceEl = document.getElementById('titan-balance');
        const docked = consumablesManager.getDockedFleetShips();
        const balance = playerDataManager.getBalance();

        if (balanceEl) {
            balanceEl.textContent = `Account balance: ¢ ${balance.toLocaleString()}`;
        }

        list.innerHTML = '';

        if (docked.length === 0) {
            list.innerHTML += '<p class="titan-empty">No ships are docked at the station. Dock a vessel to resupply.</p>';
            return;
        }

        docked.forEach(ship => {
            playerDataManager.ensureShipConsumables(ship);

            const fillAll = consumablesManager.getFillAllCost(ship);
            const card = document.createElement('div');
            card.className = 'supply-item';

            const rows = ['fuel', 'oxygen', 'electricity'].map(key => {
                const c = ship.consumables?.[key];
                if (!c) return '';

                const { units, cost } = consumablesManager.getFillCost(ship, key);
                const label = consumablesCatalogue[key].label;
                const pct = c.max ? Math.round((c.current / c.max) * 100) : 0;
                return `
                    <div class="supply-row">
                        <span>${label}: ${Math.floor(c.current)} / ${c.max} (${pct}%)</span>
                        <button class="accept-btn" data-action="fill" data-ship-id="${ship.id}" data-consumable="${key}"
                            ${units <= 0 ? 'disabled' : ''}>Fill ¢ ${cost.toLocaleString()}</button>
                    </div>`;
            }).join('');

            card.innerHTML = `
                <h3>${ship.name}</h3>
                <p class="supply-ship-type">${shipCatalogue[ship.shipTypeId]?.shipID || ship.shipTypeId}</p>
                ${rows}
                <div class="supply-footer">
                    <button class="accept-btn supply-fill-all" data-action="fill-all" data-ship-id="${ship.id}"
                        ${fillAll.total <= 0 ? 'disabled' : ''}>Fill all — ¢ ${fillAll.total.toLocaleString()}</button>
                </div>`;
            list.appendChild(card);
        });
    },

    update() {},
    draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const bg = assetManager.getImage('titan_supply_bg');
        if (bg && bg.complete) {
            ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
        }
    },
    handleKeys() {}
};
