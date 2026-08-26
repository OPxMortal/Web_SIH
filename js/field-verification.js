/* ============================================
   FIELD-VERIFICATION.JS — Verification page
   ============================================ */

let verificationCurrentPage = 1;
let verificationStatusFilter = 'all';
let verificationSearchQuery = '';
let verificationInitialized = false;

function initFieldVerification() {
    renderVerificationStats();
    renderVerificationTable();

    if (!verificationInitialized) {
        setupVerificationEvents();
        verificationInitialized = true;
    }
}

function renderVerificationStats() {
    const container = document.getElementById('verification-stats');
    container.innerHTML = `
        <div class="verification-stat-card pending">
            <div class="vs-count" style="color:var(--status-pending);">${SUMMARY.pendingCount}</div>
            <div class="vs-label">Pending</div>
        </div>
        <div class="verification-stat-card in-progress">
            <div class="vs-count" style="color:var(--status-in-progress);">${SUMMARY.inProgressCount}</div>
            <div class="vs-label">In Progress</div>
        </div>
        <div class="verification-stat-card verified">
            <div class="vs-count" style="color:var(--status-verified);">${SUMMARY.verifiedCount}</div>
            <div class="vs-label">Verified</div>
        </div>
        <div class="verification-stat-card rejected">
            <div class="vs-count" style="color:var(--status-rejected);">${SUMMARY.rejectedCount || 0}</div>
            <div class="vs-label">Rejected</div>
        </div>
    `;
}

function getVerificationFilteredParcels() {
    let filtered = [...PARCELS];

    // Only show parcels that need verification (Pending + In Progress + high score)
    if (verificationStatusFilter !== 'all') {
        filtered = filtered.filter(p => p.status === verificationStatusFilter);
    }

    if (verificationSearchQuery) {
        const q = verificationSearchQuery.toLowerCase();
        filtered = filtered.filter(p =>
            p.parcelId.includes(q) ||
            p.surveyor.toLowerCase().includes(q)
        );
    }

    // Sort by score descending (highest priority first)
    filtered.sort((a, b) => b.score - a.score);

    return filtered;
}

function renderVerificationTable() {
    const filtered = getVerificationFilteredParcels();
    const perPage = 10;
    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    verificationCurrentPage = Math.min(verificationCurrentPage, totalPages);

    const start = (verificationCurrentPage - 1) * perPage;
    const pageData = filtered.slice(start, start + perPage);

    const tbody = document.getElementById('verification-table-body');
    tbody.innerHTML = pageData.map(p => `
        <tr>
            <td style="font-weight:600;">${p.parcelId}</td>
            <td class="cell-center">${createScoreBadge(p.score)}</td>
            <td style="font-size:var(--font-size-xs);">${p.type}</td>
            <td class="cell-center">${createStatusBadge(p.status)}</td>
            <td style="font-size:var(--font-size-xs);">${p.surveyor}</td>
            <td style="font-size:var(--font-size-xs);">${p.lastUpdated}</td>
            <td style="font-size:var(--font-size-xs);">${p.gpsAccuracy} m</td>
            <td>
                <div class="action-cell">
                    <button class="btn btn-primary btn-sm" onclick="openFieldPanelById(${p.id})">Verify</button>
                </div>
            </td>
        </tr>
    `).join('');

    // Pagination
    const paginationEl = document.getElementById('verification-pagination');
    const totalItems = filtered.length;
    const startItem = filtered.length > 0 ? start + 1 : 0;
    const endItem = Math.min(start + perPage, totalItems);

    let html = `<span class="page-info">Showing ${startItem} to ${endItem} of ${totalItems} entries</span>`;
    html += '<div class="page-buttons">';
    html += `<button class="page-btn ${verificationCurrentPage === 1 ? 'disabled' : ''}" data-page="${verificationCurrentPage - 1}">‹</button>`;

    for (let i = 1; i <= Math.min(totalPages, 5); i++) {
        html += `<button class="page-btn ${i === verificationCurrentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    if (totalPages > 5) {
        html += '<span class="page-ellipsis">...</span>';
        html += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
    }

    html += `<button class="page-btn ${verificationCurrentPage === totalPages ? 'disabled' : ''}" data-page="${verificationCurrentPage + 1}">›</button>`;
    html += '</div>';

    paginationEl.innerHTML = html;

    paginationEl.querySelectorAll('.page-btn:not(.disabled)').forEach(btn => {
        btn.addEventListener('click', function() {
            verificationCurrentPage = parseInt(this.dataset.page);
            if (verificationCurrentPage >= 1 && verificationCurrentPage <= totalPages) {
                renderVerificationTable();
            }
        });
    });
}

function setupVerificationEvents() {
    document.getElementById('verification-search').addEventListener('input', function() {
        verificationSearchQuery = this.value.trim();
        verificationCurrentPage = 1;
        renderVerificationTable();
    });

    document.getElementById('verification-status-filter').addEventListener('change', function() {
        verificationStatusFilter = this.value;
        verificationCurrentPage = 1;
        renderVerificationTable();
    });
}

// Register
if (typeof registerPageInit === 'function') {
    registerPageInit('field-verification', initFieldVerification);
}
