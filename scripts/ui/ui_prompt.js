// scripts/ui/ui_prompt.js — in-game confirm / prompt dialogs

const uiPrompt = {
    _ready: false,
    _resolve: null,

    init() {
        if (this._ready) return;

        this._modal = document.getElementById('ui-prompt-modal');
        this._content = document.getElementById('ui-prompt-content');
        this._titleEl = document.getElementById('ui-prompt-title');
        this._messageEl = document.getElementById('ui-prompt-message');
        this._inputEl = document.getElementById('ui-prompt-input');
        this._confirmBtn = document.getElementById('ui-prompt-confirm');
        this._cancelBtn = document.getElementById('ui-prompt-cancel');

        if (!this._modal) return;

        this._confirmBtn?.addEventListener('click', () => this._submit());
        this._cancelBtn?.addEventListener('click', () => this._close(null));
        this._inputEl?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this._submit();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this._close(null);
            }
        });
        this._modal.addEventListener('click', (e) => {
            if (e.target === this._modal) this._close(null);
        });

        this._ready = true;
    },

    _open({ mode, title, message, defaultValue = '', confirmLabel = 'Confirm', cancelLabel = 'Cancel', variant = 'default' }) {
        this.init();
        if (!this._modal) {
            return Promise.resolve(mode === 'prompt' ? null : false);
        }

        return new Promise((resolve) => {
            this._resolve = resolve;
            this._mode = mode;
            this._defaultValue = defaultValue || '';

            if (this._titleEl) this._titleEl.textContent = title || '';
            if (this._messageEl) {
                this._messageEl.textContent = message || '';
                this._messageEl.style.display = message ? 'block' : 'none';
            }
            if (this._confirmBtn) this._confirmBtn.textContent = confirmLabel;
            if (this._cancelBtn) this._cancelBtn.textContent = cancelLabel;

            if (this._content) {
                this._content.classList.toggle('ui-prompt--danger', variant === 'danger');
                this._content.classList.toggle('ui-prompt--trade', variant === 'trade');
            }

            const isPrompt = mode === 'prompt';
            if (this._inputEl) {
                this._inputEl.style.display = isPrompt ? 'block' : 'none';
                this._inputEl.value = defaultValue || '';
            }

            this._modal.style.display = 'flex';
            if (isPrompt && this._inputEl) {
                requestAnimationFrame(() => {
                    this._inputEl.focus();
                    this._inputEl.select();
                });
            } else if (this._confirmBtn) {
                this._confirmBtn.focus();
            }
        });
    },

    confirm({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', variant = 'default' }) {
        return this._open({ mode: 'confirm', title, message, confirmLabel, cancelLabel, variant });
    },

    prompt({ title, message, defaultValue = '', confirmLabel = 'Confirm', cancelLabel = 'Cancel', variant = 'default' }) {
        return this._open({
            mode: 'prompt',
            title,
            message,
            defaultValue,
            confirmLabel,
            cancelLabel,
            variant
        });
    },

    _submit() {
        if (this._mode === 'prompt') {
            const raw = this._inputEl ? this._inputEl.value.trim() : '';
            this._close(raw || this._defaultValue || null);
            return;
        }
        this._close(true);
    },

    _close(value) {
        if (this._modal) this._modal.style.display = 'none';
        const resolve = this._resolve;
        this._resolve = null;
        this._mode = null;
        if (resolve) resolve(value);
    }
};
