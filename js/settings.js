/* ============================================
   SETTINGS.JS — Settings page (mostly static)
   ============================================ */

function initSettings() {
    // Settings page is mostly static HTML
    // Just handle save button feedback
    const saveBtn = document.querySelector('#page-settings .btn-primary');
    if (saveBtn && !saveBtn._bound) {
        saveBtn._bound = true;
        saveBtn.addEventListener('click', function() {
            const originalText = this.textContent;
            this.textContent = '✓ Saved';
            this.style.background = '#27ae60';
            this.style.borderColor = '#27ae60';
            setTimeout(() => {
                this.textContent = originalText;
                this.style.background = '';
                this.style.borderColor = '';
            }, 1500);
        });
    }
}

// Register
if (typeof registerPageInit === 'function') {
    registerPageInit('settings', initSettings);
}
