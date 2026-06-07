// scripts/ui/ui_notify.js — alert() replacement with notification fallback

function uiNotify({ title, message = '', variant = 'info', durationMs = 6000, dismissible = true }) {
    if (typeof notificationManager !== 'undefined' && notificationManager.showSimple) {
        notificationManager.showSimple({ title, message, variant, durationMs, dismissible });
        return;
    }
    console.warn('[uiNotify] notificationManager unavailable:', title, message);
}
