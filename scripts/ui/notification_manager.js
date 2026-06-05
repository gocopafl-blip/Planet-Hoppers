// scripts/ui/notification_manager.js
//
// Lightweight toast / banner notifications. Planet discovery uses showPlanetDiscovery()
// — later this can evolve into a full dossier modal without changing call sites.

const PLANET_TYPE_LABELS = {
    gas_giant: 'Gas Giant',
    terran_world: 'Terran World',
    water_world: 'Water World',
    ice_world: 'Ice World',
    city_world: 'City World',
    volcanic_world: 'Volcanic World'
};

/** Satirical one-liners keyed by planetTypeId — teaser for future dossier pop-ups. */
const PLANET_DISCOVERY_FLAVOR = {
    gas_giant: 'Atmospheric survey complete. No solid ground found. HR recommends floaties.',
    terran_world: 'Biosignatures detected. Local wildlife filed a noise complaint about your engines.',
    water_world: 'Surface is 97% ocean. Tourism board insists the other 3% is "premium beachfront."',
    ice_world: 'Entire hemisphere currently frozen. Property values described as "chilly but stable."',
    city_world: 'Urban sprawl detected. Parking remains the dominant local religion.',
    volcanic_world: 'Magma flows mapped. Geology department rated this "aggressively habitable."'
};

const PLANET_DISCOVERY_STATS = {
    gas_giant: { population: 'Uncountable gas blobs', trade: 'Helium-3, storm souvenirs, liability waivers' },
    terran_world: { population: '12M (± 40% census error)', trade: 'Grain, textiles, artisanal oxygen' },
    water_world: { population: '8M aquatics, 3 yacht clubs', trade: 'Fish, desalinated hope, waterproof pamphlets' },
    ice_world: { population: '2M huddled warmly', trade: 'Ice cubes, parkas, frozen excuses' },
    city_world: { population: '47M and one very loud billboard', trade: 'Consumer goods, data plans, overpriced coffee' },
    volcanic_world: { population: '900K heat-resistant optimists', trade: 'Obsidian, geothermal credits, burn cream' }
};

class NotificationManager {
    constructor() {
        this.stackEl = null;
        this.queue = [];
        this.active = null;
    }

    init() {
        if (this.stackEl) return;
        const host = document.getElementById('game-container') || document.body;
        this.stackEl = document.createElement('div');
        this.stackEl.id = 'notification-stack';
        this.stackEl.setAttribute('aria-live', 'polite');
        host.appendChild(this.stackEl);
    }

    /** Generic toast — title + optional body HTML. */
    show({ title, bodyHtml = '', variant = 'info', durationMs = 5000, dismissible = true }) {
        this.init();
        this.queue.push({ title, bodyHtml, variant, durationMs, dismissible });
        if (!this.active) this._showNext();
    }

    /** Organic orbit discovery — call after markPlanetSurveyed succeeds. */
    showPlanetDiscovery(planet) {
        if (!planet) return;
        const content = this.buildPlanetDiscoveryContent(planet);
        this.show({
            title: content.title,
            bodyHtml: content.bodyHtml,
            variant: 'discovery',
            durationMs: 0,
            dismissible: true
        });
    }

    /** Shared markup builder — reuse when upgrading to a full dossier modal. */
    buildPlanetDiscoveryContent(planet) {
        const typeId = planet.planetTypeId || 'terran_world';
        const typeLabel = PLANET_TYPE_LABELS[typeId] || 'Unknown World';
        const flavor = PLANET_DISCOVERY_FLAVOR[typeId] || 'Long-range sensors updated the star charts.';
        const stats = PLANET_DISCOVERY_STATS[typeId] || { population: 'Unknown', trade: 'TBD by committee' };
        const diameterKm = Math.round((planet.radius || 2000) * 2 / 1000);
        const gravity = this.formatGravity(planet);
        const danger = planet.dangerLevel != null ? `${planet.dangerLevel}/10` : 'Unrated';

        const bodyHtml = `
            <p class="notification-planet-name">${this.escapeHtml(planet.name)}</p>
            <p class="notification-planet-type">${this.escapeHtml(typeLabel)}</p>
            <dl class="notification-stats">
                <div><dt>Diameter</dt><dd>~${diameterKm.toLocaleString()} km</dd></div>
                <div><dt>Gravity</dt><dd>${this.escapeHtml(gravity)}</dd></div>
                <div><dt>Hazard</dt><dd>${this.escapeHtml(danger)}</dd></div>
                <div><dt>Population</dt><dd>${this.escapeHtml(stats.population)}</dd></div>
                <div><dt>Trade goods</dt><dd>${this.escapeHtml(stats.trade)}</dd></div>
            </dl>
            <p class="notification-flavor">${this.escapeHtml(flavor)}</p>
        `;

        return {
            title: 'New World Catalogued',
            bodyHtml
        };
    }

    formatGravity(planet) {
        const g = planet.gravityG;
        if (g && typeof g.min === 'number' && typeof g.max === 'number') {
            const mid = (g.min + g.max) / 2;
            return `~${mid.toFixed(1)} g`;
        }
        if (typeof planet.gravity === 'number') {
            return `~${planet.gravity.toFixed(1)} g`;
        }
        return 'Unknown';
    }

    escapeHtml(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    _showNext() {
        const next = this.queue.shift();
        if (!next) {
            this.active = null;
            return;
        }

        this.active = next;
        const card = document.createElement('div');
        card.className = `notification-card notification-${next.variant}`;
        card.innerHTML = `
            <div class="notification-scan-line" aria-hidden="true"></div>
            <div class="notification-header">
                <span class="notification-badge">DISCOVERY</span>
                <h3 class="notification-title">${this.escapeHtml(next.title)}</h3>
            </div>
            <div class="notification-body">${next.bodyHtml}</div>
            ${next.dismissible && next.durationMs === 0 ? '<p class="notification-dismiss-hint">Click to dismiss</p>' : ''}
            ${next.dismissible ? '<button type="button" class="notification-dismiss" aria-label="Dismiss">×</button>' : ''}
        `;

        const dismiss = () => this._dismiss(card);
        if (next.dismissible) {
            card.querySelector('.notification-dismiss')?.addEventListener('click', dismiss);
            card.addEventListener('click', (e) => {
                if (e.target.closest('.notification-dismiss')) return;
                dismiss();
            });
        }

        this.stackEl.appendChild(card);
        requestAnimationFrame(() => card.classList.add('notification-visible'));

        if (next.durationMs > 0) {
            card._timeoutId = window.setTimeout(dismiss, next.durationMs);
        }
    }

    _dismiss(card) {
        if (!card || card._dismissed) return;
        card._dismissed = true;
        if (card._timeoutId) window.clearTimeout(card._timeoutId);
        card.classList.remove('notification-visible');
        card.classList.add('notification-hiding');
        card.addEventListener('transitionend', () => {
            card.remove();
            if (this.active && card.dataset?.notificationId === this.active.id) {
                this.active = null;
            }
            this._showNext();
        }, { once: true });
        window.setTimeout(() => {
            if (card.isConnected) {
                card.remove();
                this.active = null;
                this._showNext();
            }
        }, 500);
    }
}

const notificationManager = new NotificationManager();
