/* ============================================
   DASHBOARD.JS — Map, Charts, Overall Score, Table
   ============================================ */

let dashboardMap = null;
let dashboardRorLayer = null;
let dashboardUavLayer = null;
let dashboardCurrentPage = 1;
let dashboardFilterCategory = 'all';
let dashboardSearchQuery = '';
let dashboardSortField = 'score';
let dashboardSortDir = 'desc';
let scoreChart = null;

function initDashboard() {
    renderOverallScore();
    renderScoreChart();
    renderInsights();
    renderDashboardFilterTabs();
    renderDashboardTable();
    initDashboardMap();
    setupDashboardEvents();
}

// ---- Overall Score Card ----
function renderOverallScore() {
    const card = document.getElementById('overall-score-card');
    const level = SUMMARY.avgScore > 60 ? 'very-high' : SUMMARY.avgScore > 40 ? 'high' : SUMMARY.avgScore > 20 ? 'moderate' : 'low';
    const levelText = SUMMARY.avgScore > 60 ? 'VERY HIGH' : SUMMARY.avgScore > 40 ? 'HIGH' : SUMMARY.avgScore > 20 ? 'MODERATE' : 'LOW';

    card.innerHTML = `
        <div style="font-size:var(--font-size-sm);font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-secondary);margin-bottom:var(--space-sm);">OVERALL DISCREPANCY SCORE</div>
        <div>
            <span class="score-big">${SUMMARY.avgScore}</span>
            <span class="score-max"> / 100</span>
        </div>
        <div class="score-level ${level}">${levelText}</div>
        <div class="score-trend">
            <span class="trend-up">↗</span>
            <span class="trend-up">+5.8</span> from last update
        </div>
    `;
}

// ---- Score Donut Chart ----
function renderScoreChart() {
    const ctx = document.getElementById('score-donut-chart');
    if (!ctx) return;

    if (scoreChart) {
        scoreChart.destroy();
    }

    scoreChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Low (0-20)', 'Moderate (21-40)', 'High (41-60)', 'Very High (61-100)'],
            datasets: [{
                data: [SUMMARY.low.percent, SUMMARY.moderate.percent, SUMMARY.high.percent, SUMMARY.veryHigh.percent],
                backgroundColor: ['#27ae60', '#f0b429', '#e67e22', '#e74c3c'],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '60%',
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(ctx) {
                            return ctx.label + ': ' + ctx.parsed + '%';
                        }
                    }
                }
            }
        }
    });

    // Score breakdown table
    const breakdown = document.getElementById('score-breakdown');
    breakdown.innerHTML = `
        <table>
            <tr><td style="font-weight:600;color:var(--text-muted);font-size:10px;text-transform:uppercase;">Score Range</td><td style="font-weight:600;color:var(--text-muted);font-size:10px;">Parcels</td><td style="font-weight:600;color:var(--text-muted);font-size:10px;">%</td></tr>
            <tr><td><span class="dot" style="background:#27ae60;display:inline-block;"></span> 0 – 20 (Low)</td><td>${SUMMARY.low.count}</td><td>${SUMMARY.low.percent}%</td></tr>
            <tr><td><span class="dot" style="background:#f0b429;display:inline-block;"></span> 21 – 40 (Moderate)</td><td>${SUMMARY.moderate.count}</td><td>${SUMMARY.moderate.percent}%</td></tr>
            <tr><td><span class="dot" style="background:#e67e22;display:inline-block;"></span> 41 – 60 (High)</td><td>${SUMMARY.high.count}</td><td>${SUMMARY.high.percent}%</td></tr>
            <tr><td><span class="dot" style="background:#e74c3c;display:inline-block;"></span> 61 – 100 (Very High)</td><td>${SUMMARY.veryHigh.count}</td><td>${SUMMARY.veryHigh.percent}%</td></tr>
            <tr class="total-row"><td>Total</td><td>${SUMMARY.total}</td><td>100%</td></tr>
        </table>
    `;
}

// ---- Discrepancy Insights ----
function renderInsights() {
    const container = document.getElementById('discrepancy-insights');
    container.innerHTML = `
        <h4>Discrepancy Insights</h4>
        <div class="insight-item">
            <div class="insight-icon danger">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <span>${SUMMARY.veryHigh.count} parcels (${SUMMARY.veryHigh.percent}%) have very high discrepancy (61 – 100)</span>
        </div>
        <div class="insight-item">
            <div class="insight-icon warning">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <span>${SUMMARY.high.count} parcels (${SUMMARY.high.percent}%) have high discrepancy (41 – 60)</span>
        </div>
        <div class="insight-item">
            <div class="insight-icon info">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            </div>
            <span>Major discrepancies observed in parcel boundaries and area mismatch</span>
        </div>
        <div class="insight-item">
            <div class="insight-icon success">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <span>Field verification recommended for high discrepancy parcels</span>
        </div>
    `;
}

// ---- Filter Tabs ----
function renderDashboardFilterTabs() {
    const container = document.getElementById('dashboard-filter-tabs');
    const counts = {
        'all': SUMMARY.total,
        'low': SUMMARY.low.count,
        'moderate': SUMMARY.moderate.count,
        'high': SUMMARY.high.count,
        'very-high': SUMMARY.veryHigh.count
    };
    const labels = {
        'all': 'All',
        'low': 'Low',
        'moderate': 'Moderate',
        'high': 'High',
        'very-high': 'Very High'
    };

    container.innerHTML = Object.keys(counts).map(key =>
        `<button class="filter-tab ${key === dashboardFilterCategory ? 'active' : ''}" data-filter="${key}">${labels[key]} (${counts[key]})</button>`
    ).join('');

    container.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            dashboardFilterCategory = this.dataset.filter;
            dashboardCurrentPage = 1;
            container.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            renderDashboardTable();
        });
    });
}

// ---- Dashboard Table ----
function getFilteredParcels() {
    let filtered = [...PARCELS];

    if (dashboardFilterCategory !== 'all') {
        filtered = filtered.filter(p => p.category === dashboardFilterCategory);
    }

    if (dashboardSearchQuery) {
        filtered = filtered.filter(p => p.parcelId.includes(dashboardSearchQuery));
    }

    // Sort
    filtered.sort((a, b) => {
        let valA = a[dashboardSortField];
        let valB = b[dashboardSortField];
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        if (valA < valB) return dashboardSortDir === 'asc' ? -1 : 1;
        if (valA > valB) return dashboardSortDir === 'asc' ? 1 : -1;
        return 0;
    });

    return filtered;
}

function renderDashboardTable() {
    const filtered = getFilteredParcels();
    const perPage = 5;
    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    dashboardCurrentPage = Math.min(dashboardCurrentPage, totalPages);

    const start = (dashboardCurrentPage - 1) * perPage;
    const pageData = filtered.slice(start, start + perPage);

    const tbody = document.getElementById('dashboard-table-body');
    tbody.innerHTML = pageData.map(p => `
        <tr>
            <td style="font-weight:600;">${p.parcelId}<span class="text-xs text-muted" style="display:block;font-weight:normal;font-size:10px;">${p.ulpin}</span></td>
            <td class="cell-right">${formatNumber(p.rorArea)}</td>
            <td class="cell-right">${formatNumber(p.surveyArea)}</td>
            <td class="cell-right" style="color:${p.areaDiff > 0 ? 'var(--score-very-high)' : 'var(--score-low)'};">${p.areaDiff > 0 ? '+' : ''}${formatNumber(p.areaDiff)}</td>
            <td class="cell-right" style="color:${p.areaDiffPercent > 0 ? 'var(--score-very-high)' : 'var(--score-low)'};">${p.areaDiffPercent > 0 ? '+' : ''}${p.areaDiffPercent}%</td>
            <td class="cell-center">${createScoreBadge(p.score)}</td>
            <td style="font-size:var(--font-size-xs);">${p.type}</td>
            <td class="cell-center">${createStatusBadge(p.status)}</td>
            <td>
                <div class="action-cell">
                    <button class="action-btn" title="View Details" data-parcel-id="${p.id}" onclick="openFieldPanelById(${p.id})">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                    <button class="action-btn" title="More Options">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    // Update sort indicators
    document.querySelectorAll('#dashboard-table thead th').forEach(th => {
        th.classList.remove('sorted-asc', 'sorted-desc');
        if (th.dataset.sort === dashboardSortField) {
            th.classList.add(dashboardSortDir === 'asc' ? 'sorted-asc' : 'sorted-desc');
        }
    });

    // Pagination
    renderPagination('dashboard-pagination', dashboardCurrentPage, totalPages, function(page) {
        dashboardCurrentPage = page;
        renderDashboardTable();
    });
}

window.openFieldPanelById = function(id) {
    const parcel = PARCELS.find(p => p.id === id);
    if (parcel) openFieldPanel(parcel);
};

// ---- Dashboard Map ----
function initDashboardMap() {
    const mapContainer = document.getElementById('dashboard-map');
    if (!mapContainer) return;

    if (dashboardMap) {
        dashboardMap.remove();
        dashboardMap = null;
    }

    dashboardMap = L.map('dashboard-map', {
        zoomControl: true,
        attributionControl: false
    }).setView(MAP_CENTER, MAP_ZOOM);

    // Base tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
    }).addTo(dashboardMap);

    // Add parcel polygons
    dashboardRorLayer = L.layerGroup();
    dashboardUavLayer = L.layerGroup();

    PARCELS.forEach(parcel => {
        const color = getScoreColor(parcel.score);
        const fillOpacity = 0.35 + (parcel.score / 100) * 0.35;

        // RoR boundary
        const rorPoly = L.polygon(parcel.geometry.rorCoords, {
            color: '#3498db',
            weight: 1.5,
            fillColor: color,
            fillOpacity: fillOpacity,
            opacity: 0.8
        });

        // Tooltip with parcel ID
        rorPoly.bindTooltip(String(parcel.parcelId), {
            permanent: true,
            direction: 'center',
            className: 'parcel-tooltip'
        });

        // Click to open field panel
        rorPoly.on('click', function() {
            openFieldPanel(parcel);
        });

        rorPoly.addTo(dashboardRorLayer);

        // UAV boundary
        const uavPoly = L.polygon(parcel.geometry.uavCoords, {
            color: '#e74c3c',
            weight: 1.2,
            dashArray: '5, 5',
            fillColor: 'transparent',
            fillOpacity: 0,
            opacity: 0.6
        });

        uavPoly.addTo(dashboardUavLayer);
    });

    dashboardRorLayer.addTo(dashboardMap);
    dashboardUavLayer.addTo(dashboardMap);

    // Add GCP Markers Layer
    const gcpLayer = L.layerGroup();
    if (typeof GCP_POINTS !== 'undefined') {
        GCP_POINTS.forEach(gcp => {
            const marker = L.circleMarker([gcp.lat, gcp.lng], {
                radius: 5,
                fillColor: '#9b59b6',
                color: '#ffffff',
                weight: 1.5,
                fillOpacity: 0.9
            });
            marker.bindPopup(`<b>${gcp.id}</b> (${gcp.type})<br>Elev: ${gcp.elevation}m | Acc: ±${gcp.accuracy}cm<br>Status: ${gcp.status}`);
            marker.addTo(gcpLayer);
        });
    }
    gcpLayer.addTo(dashboardMap);

    // Fit bounds to parcels
    const allCoords = PARCELS.flatMap(p => p.geometry.rorCoords);
    if (allCoords.length > 0) {
        dashboardMap.fitBounds(allCoords);
    }

    setTimeout(() => dashboardMap.invalidateSize(), 200);
}

// Village coordinates mapping
const VILLAGE_COORDS = {
    'Ponneri': [13.3120, 80.1950],
    'Minjur': [13.2790, 80.2520],
    'Sriperumbudur': [12.9690, 79.9430],
    'Gummidipoondi': [13.4070, 80.1230],
    'Red Hills (Puzhal)': [13.1890, 80.1830],
    'Avadi': [13.1140, 80.1000]
};

// ---- Setup Events ----
function setupDashboardEvents() {
    // Village select map change
    const villageSelect = document.getElementById('village-select');
    if (villageSelect && !villageSelect._bound) {
        villageSelect._bound = true;
        villageSelect.addEventListener('change', function() {
            const selectedVillage = this.value;
            const coords = VILLAGE_COORDS[selectedVillage];
            if (coords && dashboardMap) {
                dashboardMap.flyTo(coords, 16, { duration: 1.2 });
            }
        });
    }

    // Search
    const searchInput = document.getElementById('dashboard-search');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            dashboardSearchQuery = this.value.trim();
            dashboardCurrentPage = 1;
            renderDashboardTable();
        });
    }

    // Table sorting
    document.querySelectorAll('#dashboard-table thead th[data-sort]').forEach(th => {
        th.addEventListener('click', function() {
            const field = this.dataset.sort;
            if (dashboardSortField === field) {
                dashboardSortDir = dashboardSortDir === 'asc' ? 'desc' : 'asc';
            } else {
                dashboardSortField = field;
                dashboardSortDir = 'desc';
            }
            renderDashboardTable();
        });
    });
}

// Register with router
if (typeof registerPageInit === 'function') {
    registerPageInit('dashboard', initDashboard);
}
