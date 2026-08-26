/* ============================================
   APP.JS — Router, Sidebar, Initialization
   ============================================ */

(function() {
    'use strict';

    // ---- Router ----
    const pages = {
        'dashboard': { title: 'DISCREPANCY SCORE DASHBOARD', subtitle: 'Map Comparison : RoR Cadastral Map vs UAV/Survey Map', init: null },
        'discrepancy-map': { title: 'DISCREPANCY MAP', subtitle: 'Full-screen interactive map with parcel boundaries', init: null },
        'discrepancy-list': { title: 'DISCREPANCY LIST', subtitle: 'Complete list of all parcels with discrepancy analysis', init: null },
        'field-verification': { title: 'FIELD VERIFICATION', subtitle: 'Manage and track parcel verification activities', init: null },
        'survey-missions': { title: 'SURVEY MISSIONS', subtitle: 'VTOL Drone Flight Logs & ODM Photogrammetry Pipeline', init: null },
        'reports': { title: 'REPORTS', subtitle: 'Generate and view discrepancy reports', init: null },
        'actions': { title: 'ADMIN ACTIONS', subtitle: 'Administrative actions and activity log', init: null },
        'users': { title: 'USER MANAGEMENT', subtitle: 'Manage system users and permissions', init: null },
        'settings': { title: 'SETTINGS', subtitle: 'System configuration and preferences', init: null },
    };

    let currentPage = 'dashboard';
    let headerControlsVisible = true;

    function navigateTo(page) {
        if (!pages[page]) return;

        // Update nav
        document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });

        // Update page sections
        document.querySelectorAll('.page-section').forEach(section => {
            section.classList.toggle('active', section.id === 'page-' + page);
        });

        // Update header
        document.getElementById('page-title').textContent = pages[page].title;
        document.getElementById('page-subtitle').textContent = pages[page].subtitle;

        // Show/hide header controls (only on dashboard)
        const headerControls = document.getElementById('header-controls');
        if (page === 'dashboard') {
            headerControls.style.display = 'flex';
        } else {
            headerControls.style.display = 'none';
        }

        currentPage = page;

        // Trigger page-specific init if registered
        if (pages[page].init && typeof pages[page].init === 'function') {
            pages[page].init();
        }

        // Close field panel if open
        closeFieldPanel();
    }

    // Register page init functions (called from other JS files)
    window.registerPageInit = function(pageName, initFn) {
        if (pages[pageName]) {
            pages[pageName].init = initFn;
        }
    };

    // ---- Sidebar Navigation ----
    function setupNavigation() {
        document.querySelectorAll('.sidebar-nav .nav-item[data-page]').forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                navigateTo(this.dataset.page);
            });
        });

        // Handle hash changes
        window.addEventListener('hashchange', function() {
            const hash = window.location.hash.substring(1);
            if (hash && pages[hash]) {
                navigateTo(hash);
            }
        });

        // Initial page from hash
        const initialHash = window.location.hash.substring(1);
        if (initialHash && pages[initialHash]) {
            navigateTo(initialHash);
        }
    }

    // ---- Field Panel ----
    window.openFieldPanel = function(parcel) {
        const panel = document.getElementById('field-panel');
        const backdrop = document.getElementById('field-panel-backdrop');

        // Fill parcel data
        document.getElementById('fp-parcel-id').textContent = parcel.parcelId;

        const scoreBadge = document.getElementById('fp-score-badge');
        scoreBadge.innerHTML = `<span class="score-pill badge-${parcel.category}">${parcel.score} (${getScoreLabel(parcel.score)})</span>`;

        document.getElementById('fp-gps-accuracy').textContent = `${parcel.rtkFixType}: ±${parcel.gpsAccuracyCm} cm`;
        document.getElementById('fp-coords').innerHTML = `
            <span>${parcel.geometry.center[0].toFixed(6)}, ${parcel.geometry.center[1].toFixed(6)}</span>
            <div class="fp-live-indicator"><span class="live-dot"></span> Live</div>
        `;

        document.getElementById('fp-observation').value = parcel.observations || '';

        // Details tab content with ASUNAMA pipeline metrics
        const mut = (parcel.mutationRecords && parcel.mutationRecords.length > 0) ? parcel.mutationRecords[0] : null;
        const mutHtml = mut ? `
            <div style="margin-top:12px;padding-top:8px;border-top:1px solid var(--border-light);">
                <div style="font-weight:700;font-size:11px;color:var(--text-secondary);margin-bottom:4px;text-transform:uppercase;">Mutation Record</div>
                <div class="settings-row"><span class="sr-label">Deed No.</span><span class="text-sm">${mut.deedNo}</span></div>
                <div class="settings-row"><span class="sr-label">Mutation Type</span><span class="text-sm">${mut.type}</span></div>
                <div class="settings-row"><span class="sr-label">Transferred From</span><span class="text-sm">${mut.from}</span></div>
                <div class="settings-row"><span class="sr-label">Transferred To</span><span class="text-sm">${mut.to}</span></div>
                <div class="settings-row"><span class="sr-label">Registration Date</span><span class="text-sm">${mut.registrationDate}</span></div>
            </div>
        ` : '';

        document.getElementById('fp-details-content').innerHTML = `
            <div style="font-size:var(--font-size-xs);">
                <div class="settings-row" style="background:#f8f9ff;padding:6px;border-radius:4px;margin-bottom:6px;">
                    <span class="sr-label" style="font-weight:700;color:var(--primary);">ULPIN</span>
                    <span class="text-sm" style="font-weight:700;color:var(--primary);">${parcel.ulpin || 'N/A'}</span>
                </div>
                <div class="settings-row">
                    <span class="sr-label">Owner Name</span>
                    <span class="text-sm" style="font-weight:600;">${parcel.ownerName}</span>
                </div>
                <div class="settings-row">
                    <span class="sr-label">Khatian / Dag No.</span>
                    <span class="text-sm">${parcel.khatianNo} / ${parcel.dagNo || 'N/A'}</span>
                </div>
                <div class="settings-row">
                    <span class="sr-label">Land Classification</span>
                    <span class="text-sm">${parcel.landType}</span>
                </div>
                <div class="settings-row">
                    <span class="sr-label">RoR Area</span>
                    <span class="text-sm">${parcel.rorArea.toLocaleString()} sqm</span>
                </div>
                <div class="settings-row">
                    <span class="sr-label">Survey Area (ODM)</span>
                    <span class="text-sm">${parcel.surveyArea.toLocaleString()} sqm</span>
                </div>
                <div class="settings-row">
                    <span class="sr-label">Area Difference</span>
                    <span class="text-sm ${parcel.areaDiff > 0 ? 'text-danger' : 'text-success'}">${parcel.areaDiff > 0 ? '+' : ''}${parcel.areaDiff.toFixed(2)} sqm (${parcel.areaDiffPercent > 0 ? '+' : ''}${parcel.areaDiffPercent}%)</span>
                </div>
                <div class="settings-row">
                    <span class="sr-label">PostGIS Analysis</span>
                    <span class="text-sm">${parcel.type}</span>
                </div>
                <div class="settings-row">
                    <span class="sr-label">U-Net AI Confidence</span>
                    <span class="text-sm" style="font-weight:700;color:${parcel.aiConfidence > 85 ? 'var(--score-low)' : 'var(--score-high)'};">${parcel.aiConfidence}% (${parcel.aiExtractionStatus})</span>
                </div>
                <div class="settings-row">
                    <span class="sr-label">Spatial IoU Score</span>
                    <span class="text-sm" style="font-weight:600;">${parcel.iouScore}</span>
                </div>
                <div class="settings-row">
                    <span class="sr-label">Positioning Mode</span>
                    <span class="text-sm">${parcel.rtkFixType} (±${parcel.gpsAccuracyCm} cm)</span>
                </div>
                <div class="settings-row">
                    <span class="sr-label">Elevation (LiDAR)</span>
                    <span class="text-sm">${parcel.elevation} m MSL (${parcel.terrainType})</span>
                </div>
                <div class="settings-row">
                    <span class="sr-label">Survey Mission</span>
                    <span class="text-sm">${parcel.missionId}</span>
                </div>
                <div class="settings-row">
                    <span class="sr-label">Surveyor</span>
                    <span class="text-sm">${parcel.surveyor}</span>
                </div>
                ${mutHtml}
            </div>
        `;

        // Initialize mini map
        initMiniMap(parcel);

        // Reset to verification tab
        document.querySelectorAll('#fp-tabs .tab-item').forEach(t => t.classList.remove('active'));
        document.querySelector('#fp-tabs .tab-item[data-tab="verification"]').classList.add('active');
        document.querySelectorAll('.fp-tab-content').forEach(c => c.style.display = 'none');
        document.getElementById('fp-tab-verification').style.display = 'block';

        panel.classList.add('open');
        backdrop.classList.add('open');
    };

    function closeFieldPanel() {
        document.getElementById('field-panel').classList.remove('open');
        document.getElementById('field-panel-backdrop').classList.remove('open');
    }

    let miniMap = null;
    function initMiniMap(parcel) {
        const container = document.getElementById('fp-mini-map');
        container.innerHTML = '';

        // Create a new div for the map
        const mapDiv = document.createElement('div');
        mapDiv.style.width = '100%';
        mapDiv.style.height = '100%';
        container.appendChild(mapDiv);

        if (miniMap) {
            miniMap.remove();
            miniMap = null;
        }

        miniMap = L.map(mapDiv, {
            zoomControl: false,
            attributionControl: false,
            dragging: false,
            scrollWheelZoom: false,
            doubleClickZoom: false,
        }).setView(parcel.geometry.center, 18);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(miniMap);

        L.circleMarker(parcel.geometry.center, {
            radius: 8,
            fillColor: getScoreColor(parcel.score),
            color: '#fff',
            weight: 2,
            fillOpacity: 0.9
        }).addTo(miniMap);

        setTimeout(() => miniMap.invalidateSize(), 100);
    }

    // ---- Field Panel Tabs ----
    function setupFieldPanelTabs() {
        document.querySelectorAll('#fp-tabs .tab-item').forEach(tab => {
            tab.addEventListener('click', function() {
                const tabName = this.dataset.tab;
                document.querySelectorAll('#fp-tabs .tab-item').forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                document.querySelectorAll('.fp-tab-content').forEach(c => c.style.display = 'none');
                document.getElementById('fp-tab-' + tabName).style.display = 'block';
            });
        });
    }

    // ---- Table Helpers ----
    window.createScoreBadge = function(score) {
        const cat = getScoreCategory(score);
        return `<span class="badge badge-${cat}">${score}</span>`;
    };

    window.createStatusBadge = function(status) {
        const cls = status.toLowerCase().replace(/\s+/g, '-');
        return `<span class="badge badge-${cls}">${status}</span>`;
    };

    window.formatNumber = function(num) {
        return Number(num).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // ---- Pagination Helper ----
    window.renderPagination = function(containerId, currentPage, totalPages, onPageChange) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const totalItems = totalPages * 5; // assuming 5 per page for dashboard
        const startItem = (currentPage - 1) * 5 + 1;
        const endItem = Math.min(currentPage * 5, totalItems);

        let html = `<span class="page-info">Showing ${startItem} to ${endItem} of ${totalItems} entries</span>`;
        html += '<div class="page-buttons">';

        // Previous button
        html += `<button class="page-btn ${currentPage === 1 ? 'disabled' : ''}" data-page="${currentPage - 1}">‹</button>`;

        // Page numbers
        const maxVisible = 5;
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);
        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        if (startPage > 1) {
            html += `<button class="page-btn" data-page="1">1</button>`;
            if (startPage > 2) html += '<span class="page-ellipsis">...</span>';
        }

        for (let i = startPage; i <= endPage; i++) {
            html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) html += '<span class="page-ellipsis">...</span>';
            html += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
        }

        // Next button
        html += `<button class="page-btn ${currentPage === totalPages ? 'disabled' : ''}" data-page="${currentPage + 1}">›</button>`;
        html += '</div>';

        container.innerHTML = html;

        // Bind click events
        container.querySelectorAll('.page-btn:not(.disabled)').forEach(btn => {
            btn.addEventListener('click', function() {
                const page = parseInt(this.dataset.page);
                if (page >= 1 && page <= totalPages) {
                    onPageChange(page);
                }
            });
        });
    };

    // ---- Refresh Button ----
    function setupRefreshButton() {
        document.getElementById('btn-refresh').addEventListener('click', function() {
            this.style.transform = 'rotate(360deg)';
            this.style.transition = 'transform 0.6s ease';
            setTimeout(() => {
                this.style.transform = '';
                this.style.transition = '';
            }, 700);
            // Re-init current page
            if (pages[currentPage].init) {
                pages[currentPage].init();
            }
        });
    }

    // ---- Submit Verification ----
    function setupSubmitVerification() {
        document.getElementById('fp-submit-btn').addEventListener('click', function() {
            this.textContent = '✓ SUBMITTED';
            this.style.background = '#27ae60';
            this.disabled = true;
            setTimeout(() => {
                this.textContent = 'SUBMIT VERIFICATION';
                this.style.background = '';
                this.disabled = false;
                closeFieldPanel();
            }, 1500);
        });
    }

    // ---- Init ----
    document.addEventListener('DOMContentLoaded', function() {
        setupNavigation();
        setupFieldPanelTabs();
        setupRefreshButton();
        setupSubmitVerification();

        // Close field panel
        document.getElementById('fp-close').addEventListener('click', closeFieldPanel);
        document.getElementById('field-panel-backdrop').addEventListener('click', closeFieldPanel);

        // Trigger dashboard init
        setTimeout(() => {
            if (typeof initDashboard === 'function') initDashboard();
        }, 100);
    });

})();
