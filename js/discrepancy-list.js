/* ============================================
   DISCREPANCY-LIST.JS — Full table page
   ============================================ */

let listCurrentPage = 1;
let listFilterCategory = 'all';
let listSearchQuery = '';
let listSortField = 'score';
let listSortDir = 'desc';
let listTypeFilter = 'all';
let listStatusFilter = 'all';
let listInitialized = false;

function initDiscrepancyList() {
    renderListFilterTabs();
    renderListTable();

    if (!listInitialized) {
        setupListEvents();
        listInitialized = true;
    }
}

function getListFilteredParcels() {
    let filtered = [...PARCELS];

    if (listFilterCategory !== 'all') {
        filtered = filtered.filter(p => p.category === listFilterCategory);
    }

    if (listSearchQuery) {
        const q = listSearchQuery.toLowerCase();
        filtered = filtered.filter(p =>
            p.parcelId.includes(q) ||
            (p.ulpin && p.ulpin.toLowerCase().includes(q)) ||
            p.ownerName.toLowerCase().includes(q) ||
            p.khatianNo.toLowerCase().includes(q)
        );
    }

    if (listTypeFilter !== 'all') {
        filtered = filtered.filter(p => p.type.includes(listTypeFilter));
    }

    if (listStatusFilter !== 'all') {
        filtered = filtered.filter(p => p.status === listStatusFilter);
    }

    filtered.sort((a, b) => {
        let valA = a[listSortField];
        let valB = b[listSortField];
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        if (valA < valB) return listSortDir === 'asc' ? -1 : 1;
        if (valA > valB) return listSortDir === 'asc' ? 1 : -1;
        return 0;
    });

    return filtered;
}

function renderListFilterTabs() {
    const container = document.getElementById('list-filter-tabs');
    if (!container) return;

    const counts = {
        'all': SUMMARY.total,
        'low': SUMMARY.low.count,
        'moderate': SUMMARY.moderate.count,
        'high': SUMMARY.high.count,
        'very-high': SUMMARY.veryHigh.count
    };
    const labels = { 'all': 'All', 'low': 'Low', 'moderate': 'Moderate', 'high': 'High', 'very-high': 'Very High' };

    container.innerHTML = Object.keys(counts).map(key =>
        `<button class="filter-tab ${key === listFilterCategory ? 'active' : ''}" data-filter="${key}">${labels[key]} (${counts[key]})</button>`
    ).join('');

    container.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            listFilterCategory = this.dataset.filter;
            listCurrentPage = 1;
            container.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            renderListTable();
        });
    });
}

function renderListTable() {
    const filtered = getListFilteredParcels();
    const perPage = 10;
    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    listCurrentPage = Math.min(listCurrentPage, totalPages);

    const start = (listCurrentPage - 1) * perPage;
    const pageData = filtered.slice(start, start + perPage);

    const tbody = document.getElementById('list-table-body');
    tbody.innerHTML = pageData.map(p => `
        <tr>
            <td><input type="checkbox" class="list-row-checkbox" value="${p.id}"></td>
            <td style="font-weight:600;">${p.parcelId}<span class="text-xs text-muted" style="display:block;font-weight:normal;font-size:10px;">${p.ulpin}</span></td>
            <td style="font-size:var(--font-size-xs);">${p.ownerName}</td>
            <td style="font-size:var(--font-size-xs);">${p.khatianNo}</td>
            <td class="cell-right">${formatNumber(p.rorArea)}</td>
            <td class="cell-right">${formatNumber(p.surveyArea)}</td>
            <td class="cell-right" style="color:${p.areaDiff > 0 ? 'var(--score-very-high)' : 'var(--score-low)'};">${p.areaDiff > 0 ? '+' : ''}${formatNumber(p.areaDiff)}</td>
            <td class="cell-right" style="color:${p.areaDiffPercent > 0 ? 'var(--score-very-high)' : 'var(--score-low)'};">${p.areaDiffPercent > 0 ? '+' : ''}${p.areaDiffPercent}%</td>
            <td class="cell-center">${createScoreBadge(p.score)}</td>
            <td style="font-size:var(--font-size-xs);">${p.type}</td>
            <td class="cell-center">${createStatusBadge(p.status)}</td>
            <td>
                <div class="action-cell">
                    <button class="action-btn" title="View" onclick="openFieldPanelById(${p.id})">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                    <button class="action-btn" title="More">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    // Update sort indicators
    document.querySelectorAll('#list-table thead th').forEach(th => {
        th.classList.remove('sorted-asc', 'sorted-desc');
        if (th.dataset.sort === listSortField) {
            th.classList.add(listSortDir === 'asc' ? 'sorted-asc' : 'sorted-desc');
        }
    });

    // Pagination
    const paginationEl = document.getElementById('list-pagination');
    const totalItems = filtered.length;
    const startItem = filtered.length > 0 ? start + 1 : 0;
    const endItem = Math.min(start + perPage, totalItems);

    let html = `<span class="page-info">Showing ${startItem} to ${endItem} of ${totalItems} entries</span>`;
    html += '<div class="page-buttons">';
    html += `<button class="page-btn ${listCurrentPage === 1 ? 'disabled' : ''}" data-page="${listCurrentPage - 1}">‹</button>`;

    const maxVis = 5;
    let sp = Math.max(1, listCurrentPage - 2);
    let ep = Math.min(totalPages, sp + maxVis - 1);
    if (ep - sp < maxVis - 1) sp = Math.max(1, ep - maxVis + 1);

    if (sp > 1) { html += `<button class="page-btn" data-page="1">1</button>`; if (sp > 2) html += '<span class="page-ellipsis">...</span>'; }
    for (let i = sp; i <= ep; i++) { html += `<button class="page-btn ${i === listCurrentPage ? 'active' : ''}" data-page="${i}">${i}</button>`; }
    if (ep < totalPages) { if (ep < totalPages - 1) html += '<span class="page-ellipsis">...</span>'; html += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`; }

    html += `<button class="page-btn ${listCurrentPage === totalPages ? 'disabled' : ''}" data-page="${listCurrentPage + 1}">›</button>`;
    html += '</div>';
    paginationEl.innerHTML = html;

    paginationEl.querySelectorAll('.page-btn:not(.disabled)').forEach(btn => {
        btn.addEventListener('click', function() {
            listCurrentPage = parseInt(this.dataset.page);
            renderListTable();
        });
    });
}

function setupListEvents() {
    // Search
    document.getElementById('list-search').addEventListener('input', function() {
        listSearchQuery = this.value.trim();
        listCurrentPage = 1;
        renderListTable();
    });

    // Sort
    document.querySelectorAll('#list-table thead th[data-sort]').forEach(th => {
        th.addEventListener('click', function() {
            const field = this.dataset.sort;
            if (listSortField === field) {
                listSortDir = listSortDir === 'asc' ? 'desc' : 'asc';
            } else {
                listSortField = field;
                listSortDir = 'desc';
            }
            renderListTable();
        });
    });

    // Advanced filters toggle
    document.getElementById('toggle-advanced-filters').addEventListener('click', function() {
        document.getElementById('advanced-filters-panel').classList.toggle('open');
    });

    // Apply advanced filters
    document.getElementById('apply-list-filters').addEventListener('click', function() {
        const scoreVal = document.getElementById('list-score-filter').value;
        const typeVal = document.getElementById('list-type-filter').value;
        const statusVal = document.getElementById('list-status-filter').value;

        listFilterCategory = scoreVal;
        listTypeFilter = typeVal;
        listStatusFilter = statusVal;
        listCurrentPage = 1;

        // Update tab highlight
        document.querySelectorAll('#list-filter-tabs .filter-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.filter === listFilterCategory);
        });

        renderListTable();
    });

    // Select all checkbox
    document.getElementById('list-select-all').addEventListener('change', function() {
        document.querySelectorAll('.list-row-checkbox').forEach(cb => {
            cb.checked = this.checked;
        });
    });

    // Export CSV
    document.getElementById('export-csv-btn').addEventListener('click', function() {
        const filtered = getListFilteredParcels();
        let csv = 'Parcel ID,Owner,Khatian No,RoR Area (sqm),Survey Area (sqm),Area Diff (sqm),Diff %,Score,Type,Status\n';
        filtered.forEach(p => {
            csv += `${p.parcelId},"${p.ownerName}",${p.khatianNo},${p.rorArea},${p.surveyArea},${p.areaDiff},${p.areaDiffPercent},${p.score},"${p.type}",${p.status}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'discrepancy_list_export.csv';
        a.click();
        URL.revokeObjectURL(url);
    });
}

// Register
if (typeof registerPageInit === 'function') {
    registerPageInit('discrepancy-list', initDiscrepancyList);
}
