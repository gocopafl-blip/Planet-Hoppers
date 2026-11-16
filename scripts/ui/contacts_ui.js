// scripts/ui/contacts_ui.js — Contacts UI v1 (Phase 2, Slice A)
//
// Holo-call message panel: portrait + name + typewriter text + holo flicker.
// Queue-based; messages are queued by mission effects (contactOnComplete /
// contactOnRivalWin), dock encounters, and story beats. See docs/MISSIONS.md
// §12. Mara/Pip portraits are v1 placeholders from approved concepts (baked
// holo frames); the other four are clean production-style portraits. A
// contact without a portrait file falls back to an initials badge.
// Text-first: voice stingers arrive in a later slice.

const CONTACTS = {
    mara: {
        name: 'Mara Voss',
        role: 'Dispatch — Orbital Cargo Solutions',
        portrait: 'assets/images/portraits/mara_voss.webp',
        fallbackInitials: 'MV'
    },
    pip: {
        name: 'Pip',
        role: 'Home',
        portrait: 'assets/images/portraits/pip_comet.webp',
        fallbackInitials: 'P'
    },
    kess: {
        name: 'Kess Alden',
        role: 'Rival hauler — open comms',
        portrait: 'assets/images/portraits/kess_alden.webp',
        fallbackInitials: 'KA'
    },
    old_tam: {
        name: 'Old Tam',
        role: 'Dock 9',
        portrait: 'assets/images/portraits/old_tam.webp',
        fallbackInitials: 'OT'
    },
    sorren: {
        name: 'Dr. Ilya Sorren',
        role: 'Geological Survey Office',
        portrait: 'assets/images/portraits/ilya_sorren.webp',
        fallbackInitials: 'IS'
    },
    harlan: {
        name: 'Mr. Harlan',
        role: 'StarHopper Accounts',
        portrait: 'assets/images/portraits/harlan.webp',
        fallbackInitials: 'MH'
    }
};

const CONTACT_MESSAGES = {
    mara_first_cert: {
        contact: 'mara',
        lines: [
            "Mara Voss, dispatch. I run the board, the buoys, and — on bad days — the coffee machine. You did fine out there. The clamps held, which is more than I can say for last week's trainee.",
            "One rule: if your comms start hissing, it's the buoys. Probably. Come find me on the board when you're ready for real work."
        ]
    },
    harlan_lien: {
        contact: 'harlan',
        lines: [
            "Good evening. Mr. Harlan, StarHopper accounts. I handle your advance personally — every contractor's ledger has a name attached, and yours is mine.",
            'Your first repayment posted cleanly. Keep flying, keep paying, and you and I will have a short, pleasant relationship. Fall behind, and it becomes a longer one.',
            'That is all. Fly safe. The company prefers its assets intact.'
        ]
    },
    sorren_sample: {
        contact: 'sorren',
        lines: [
            "Dr. Ilya Sorren, Geological Survey. Your core sample is... irregular. The alloy content doesn't match anything in our catalogue, and our catalogue is very thorough.",
            "I've logged it as an anomaly and asked that the next sample come to my lab directly. If you find more rock that shouldn't exist, bring it to me before the board does."
        ]
    },
    pip_comet: {
        contact: 'pip',
        lines: [
            'THANK YOU THANK YOU THANK YOU. His name is Comet because his tail goes ZOOM like a comet.',
            "Mara says he's a good dog and a bad copilot. He chewed your checklist. I drew you a new one. It's on your bunk.",
            'Come home soon. Comet misses you and I miss you. Mostly Comet. Kidding. Mostly me.'
        ]
    },
    kess_race_won: {
        contact: 'kess',
        lines: [
            "Lucky. That's all I'm saying. Lucky.",
            "Enjoy the coffee money, hauler. Next time the depot's mine, and I'll wave on the way past."
        ]
    },
    kess_race_lost: {
        contact: 'kess',
        lines: [
            'Slow. Sorry — did I say that out loud? On open comms? How embarrassing.',
            'No hard feelings. The depot keeps score, not me. See you on the next one — try flying like you mean it.'
        ]
    }
};

const CONTACT_ENCOUNTERS = {
    mad_hauler_first: {
        contact: 'old_tam',
        missionId: 'MAD_HAULER_01',
        lines: [
            'You fly the K-14 lanes, kid? Then listen to an old man who already flew them. A century ago. Same stars. Same station. Different coffee.',
            "There's a door out past the rim signals. Black as a shut eye. I went through it once. Came out... later. Much later. Everyone I knew was gone, and the station had the nerve to look exactly the same.",
            "You don't believe me. Nobody does. That's fine. Belief is for people with time.",
            "But if you ever find the door — fly OUT the way you came in. Don't die in there. Dying in there's the only way to lose everybody at once.",
            'Here. For listening. Nobody listens.'
        ]
    }
};

const contactsUI = {
    queue: [],
    active: null,
    _overlay: null,
    _bodyEl: null,
    _continueBtn: null,
    _typingTimer: null,
    _currentLineIndex: 0,
    _lineFullyShown: false,

    /** Test hook: when set, lines render instantly (no typewriter). */
    get instant() {
        return typeof window !== 'undefined' && !!window.__CONTACTS_INSTANT__;
    },

    ensureOverlay() {
        if (this._overlay) return this._overlay;
        const host = document.getElementById('game-container') || document.body;
        const overlay = document.createElement('div');
        overlay.id = 'contact-overlay';
        overlay.style.display = 'none';
        overlay.innerHTML = `
            <div class="contact-panel" role="dialog" aria-live="polite">
                <div class="contact-scan-line" aria-hidden="true"></div>
                <div class="contact-header">
                    <div class="contact-portrait-wrap"></div>
                    <div class="contact-identity">
                        <div class="contact-name"></div>
                        <div class="contact-role"></div>
                    </div>
                </div>
                <div class="contact-body"></div>
                <div class="contact-footer">
                    <span class="contact-hint">Click the message to finish the line</span>
                    <button type="button" class="contact-continue">Continue</button>
                </div>
            </div>
        `;
        host.appendChild(overlay);
        this._overlay = overlay;
        this._bodyEl = overlay.querySelector('.contact-body');
        this._continueBtn = overlay.querySelector('.contact-continue');
        this._bodyEl.addEventListener('click', () => this._finishCurrentLine());
        this._continueBtn.addEventListener('click', () => this._advance());
        return overlay;
    },

    /** Queue a catalogued message by id. Unknown ids are ignored loudly. */
    queueMessage(messageId) {
        const message = CONTACT_MESSAGES[messageId];
        if (!message) {
            console.warn(`contactsUI: unknown message id "${messageId}"`);
            return false;
        }
        this.queue.push({ contactId: message.contact, lines: [...message.lines], onDone: null });
        this._pump();
        return true;
    },

    /** Start a dock encounter dialogue; onDone runs after the last line. */
    showEncounter(encounterId, onDone) {
        const encounter = CONTACT_ENCOUNTERS[encounterId];
        if (!encounter) {
            console.warn(`contactsUI: unknown encounter id "${encounterId}"`);
            return false;
        }
        this.queue.push({
            contactId: encounter.contact,
            lines: [...encounter.lines],
            onDone: onDone || null,
            encounterId
        });
        this._pump();
        return true;
    },

    /** Direct dialogue with ad-hoc lines (story beats that need no catalogue entry). */
    showDialogue(contactId, lines, onDone) {
        if (!CONTACTS[contactId] || !Array.isArray(lines) || lines.length === 0) {
            console.warn('contactsUI: showDialogue needs a known contact and at least one line.');
            return false;
        }
        this.queue.push({ contactId, lines: [...lines], onDone: onDone || null });
        this._pump();
        return true;
    },

    _pump() {
        if (this.active) return;
        const next = this.queue.shift();
        if (!next) return;
        this.active = next;
        this._currentLineIndex = 0;
        this._renderActive();
        this._showLine(0);
    },

    _renderActive() {
        const overlay = this.ensureOverlay();
        const contact = CONTACTS[this.active.contactId];
        overlay.querySelector('.contact-name').textContent = contact.name;
        overlay.querySelector('.contact-role').textContent = contact.role;

        const wrap = overlay.querySelector('.contact-portrait-wrap');
        wrap.innerHTML = '';
        if (contact.portrait) {
            const img = document.createElement('img');
            img.className = 'contact-portrait';
            img.src = contact.portrait;
            img.alt = contact.name;
            img.addEventListener('error', () => {
                wrap.innerHTML = '';
                wrap.appendChild(this._fallbackBadge(contact));
            });
            wrap.appendChild(img);
        } else {
            wrap.appendChild(this._fallbackBadge(contact));
        }

        overlay.style.display = 'flex';
        requestAnimationFrame(() => overlay.classList.add('contact-visible'));
    },

    _fallbackBadge(contact) {
        const badge = document.createElement('div');
        badge.className = 'contact-portrait-fallback';
        badge.textContent = contact.fallbackInitials || '?';
        badge.setAttribute('aria-label', contact.name);
        return badge;
    },

    _showLine(index) {
        this._currentLineIndex = index;
        this._lineFullyShown = false;
        this._stopTyping();
        const line = this.active.lines[index] || '';
        const isLast = index >= this.active.lines.length - 1;
        this._continueBtn.textContent = isLast ? 'Close' : 'Continue';

        if (this.instant) {
            this._bodyEl.textContent = line;
            this._lineFullyShown = true;
            return;
        }

        let shown = 0;
        this._bodyEl.textContent = '';
        this._typingTimer = window.setInterval(() => {
            shown += 2;
            this._bodyEl.textContent = line.slice(0, shown);
            if (shown >= line.length) {
                this._stopTyping();
                this._lineFullyShown = true;
            }
        }, 18);
    },

    _finishCurrentLine() {
        if (!this.active || this._lineFullyShown) return;
        this._stopTyping();
        this._bodyEl.textContent = this.active.lines[this._currentLineIndex] || '';
        this._lineFullyShown = true;
    },

    _advance() {
        if (!this.active) return;
        if (!this._lineFullyShown) {
            this._finishCurrentLine();
            return;
        }
        const nextIndex = this._currentLineIndex + 1;
        if (nextIndex < this.active.lines.length) {
            this._showLine(nextIndex);
            return;
        }
        this._closeActive();
    },

    _closeActive() {
        this._stopTyping();
        const done = this.active?.onDone || null;
        this.active = null;
        if (this._overlay) {
            this._overlay.classList.remove('contact-visible');
            this._overlay.style.display = 'none';
        }
        if (typeof done === 'function') {
            try {
                done();
            } catch (err) {
                console.error('contactsUI: onDone handler failed', err);
            }
        }
        this._pump();
    },

    _stopTyping() {
        if (this._typingTimer) {
            window.clearInterval(this._typingTimer);
            this._typingTimer = null;
        }
    },

    escapeHtml(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
};
