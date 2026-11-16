// scripts/ui/intro_screen.js — Phase 1B.1 contractor orientation briefing

const INTRO_BRIEFING_PARAGRAPHS = [
    'Sector K-14 is under-charted. Most contacts on your nav are not worlds yet — they are unknown signals until someone flies out and catalogs them.',
    'You are an independent hauler under contract to this orbital station. The chart does not fill itself; runners like you survey, deliver, and expand reach.',
    null, // filled with ship/company line at show time
    'Run dock contracts to pay consumables and dock fees. Take survey work to unlock better jobs on the mission board. Discovery is how you graduate from rent money to real routes.',
    'One more thing, and it is not in the manual: there is an eight-year-old back home who thinks you fly the stars for a living. Pip\'s drawing is taped above your bunk — a rocket, a star, and a stick figure with your name on it. Keep the runs coming and the lien shrinking. That is the whole job.'
];

const introScreen = {
    _onContinue: null,

    buildBodyHtml() {
        const shipName = typeof playerDataManager.getStarterShipName === 'function'
            ? playerDataManager.getStarterShipName()
            : 'Stardust Drifter';
        const companyName = typeof playerDataManager.getCompanyName === 'function'
            ? playerDataManager.getCompanyName()
            : 'StarHopper Cargo';

        const paragraphs = INTRO_BRIEFING_PARAGRAPHS.map(text => {
            if (text === null) {
                return `Your company-issue hull is the <strong>${this.escapeHtml(shipName)}</strong> — repo salvage, but she flies. <strong>${this.escapeHtml(companyName)}</strong> fronted your starting balance and dock access.`;
            }
            return this.escapeHtml(text);
        });

        return paragraphs.map(p => `<p>${p}</p>`).join('');
    },

    escapeHtml(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    },

    show(onContinue) {
        const overlay = document.getElementById('intro-briefing');
        const body = document.getElementById('intro-briefing-body');
        if (!overlay || !body) {
            onContinue?.();
            return;
        }

        body.innerHTML = this.buildBodyHtml();
        this._onContinue = onContinue;
        overlay.style.display = 'flex';
        requestAnimationFrame(() => overlay.classList.add('intro-visible'));
    },

    hide() {
        const overlay = document.getElementById('intro-briefing');
        if (!overlay) return;
        overlay.classList.remove('intro-visible');
        overlay.style.display = 'none';
    },

    handleContinue() {
        this.hide();
        const cb = this._onContinue;
        this._onContinue = null;
        cb?.();
    }
};
