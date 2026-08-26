/* ============================================
   REPORTS.JS — Reports page
   ============================================ */

let reportsInitialized = false;

function initReports() {
    renderReportsTable();

    if (!reportsInitialized) {
        setupReportsEvents();
        reportsInitialized = true;
    }
}

function renderReportsTable() {
    const tbody = document.getElementById('reports-table-body');
    tbody.innerHTML = RECENT_REPORTS.map(r => `
        <tr>
            <td style="font-weight:600;">${r.id}</td>
            <td>${r.type}</td>
            <td>${r.date}</td>
            <td>${r.generatedBy}</td>
            <td class="cell-center">${r.parcels}</td>
            <td class="cell-center"><span class="badge badge-verified">${r.status}</span></td>
            <td>
                <div class="action-cell">
                    <button class="action-btn" title="Download PDF">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    </button>
                    <button class="action-btn" title="View Report">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function setupReportsEvents() {
    // Report card click
    document.querySelectorAll('.report-card').forEach(card => {
        card.addEventListener('click', function() {
            const type = this.dataset.report;
            const select = document.getElementById('report-type-select');
            if (type === 'summary') select.selectedIndex = 0;
            else if (type === 'detailed') select.selectedIndex = 1;
            else if (type === 'action') select.selectedIndex = 2;

            // Scroll to generate section
            select.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    });

    // Generate report button
    document.getElementById('generate-report-btn').addEventListener('click', function() {
        this.innerHTML = '<span style="display:inline-flex;align-items:center;gap:6px;"><span class="spinner"></span> Generating...</span>';
        this.disabled = true;

        setTimeout(() => {
            this.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><polyline points="20 6 9 17 4 12"/></svg>
                Generated!
            `;
            this.style.background = '#27ae60';
            this.style.borderColor = '#27ae60';

            setTimeout(() => {
                this.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    Generate
                `;
                this.style.background = '';
                this.style.borderColor = '';
                this.disabled = false;
            }, 2000);
        }, 1500);
    });
}

// Register
if (typeof registerPageInit === 'function') {
    registerPageInit('reports', initReports);
}
