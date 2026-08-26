/* ============================================
   DISCREPANCY-MAP.JS — Full-screen map page
   ============================================ */

let fullMap = null;
let fullRorLayer = null;
let fullUavLayer = null;
let fullMapInitialized = false;
let showRorLayer = true;
let showUavLayer = true;
let mapScoreFilter = 'all';
let mapStatusFilter = 'all';

function initDiscrepancyMap() {
    if (fullMapInitialized && fullMap) {
        setTimeout(() => fullMap.invalidateSize(), 100);
        return;
    }

    const mapContainer = document.getElementById('full-map');
    if (!mapContainer) return;

    if (fullMap) {
        fullMap.remove();
        fullMap = null;
    }

    fullMap = L.map('full-map', {
        zoomControl: true,
        attributionControl: false
    }).setView(MAP_CENTER, MAP_ZOOM);

    // Base layers
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
    });

    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19
    });

    osmLayer.addTo(fullMap);

    // Add parcel layers
    fullRorLayer = L.layerGroup();
    fullUavLayer = L.layerGroup();

    renderMapParcels();

    fullRorLayer.addTo(fullMap);
    fullUavLayer.addTo(fullMap);

    // Fit bounds
    const allCoords = PARCELS.flatMap(p => p.geometry.rorCoords);
    if (allCoords.length > 0) {
        fullMap.fitBounds(allCoords);
    }

    // Toolbar events
    setupMapToolbar(osmLayer, satelliteLayer);
    setupMapSearch();
    setupMapFilterPanel();

    fullMapInitialized = true;
    setTimeout(() => fullMap.invalidateSize(), 200);
}

function renderMapParcels() {
    fullRorLayer.clearLayers();
    fullUavLayer.clearLayers();

    let filteredParcels = [...PARCELS];

    if (mapScoreFilter !== 'all') {
        filteredParcels = filteredParcels.filter(p => p.category === mapScoreFilter);
    }

    if (mapStatusFilter !== 'all') {
        filteredParcels = filteredParcels.filter(p => p.status === mapStatusFilter);
    }

    filteredParcels.forEach(parcel => {
        const color = getScoreColor(parcel.score);
        const fillOpacity = 0.3 + (parcel.score / 100) * 0.4;

        // RoR boundary polygon
        const rorPoly = L.polygon(parcel.geometry.rorCoords, {
            color: '#3498db',
            weight: 2,
            fillColor: color,
            fillOpacity: fillOpacity,
            opacity: 0.9
        });

        rorPoly.bindTooltip(String(parcel.parcelId), {
            permanent: true,
            direction: 'center',
            className: 'parcel-tooltip'
        });

        // Popup with parcel details
        rorPoly.bindPopup(createParcelPopup(parcel));
        rorPoly.on('click', function() {
            this.openPopup();
        });

        rorPoly.addTo(fullRorLayer);

        // UAV boundary
        const uavPoly = L.polygon(parcel.geometry.uavCoords, {
            color: '#e74c3c',
            weight: 1.5,
            dashArray: '6, 6',
            fillColor: 'transparent',
            fillOpacity: 0,
            opacity: 0.7
        });
        uavPoly.addTo(fullUavLayer);
    });
}

function createParcelPopup(parcel) {
    return `
        <div class="popup-content">
            <div class="popup-title">
                Parcel ${parcel.parcelId}
                ${createScoreBadge(parcel.score)}
            </div>
            <div class="popup-row"><span>Owner:</span><span>${parcel.ownerName}</span></div>
            <div class="popup-row"><span>RoR Area:</span><span>${formatNumber(parcel.rorArea)} sqm</span></div>
            <div class="popup-row"><span>Survey Area:</span><span>${formatNumber(parcel.surveyArea)} sqm</span></div>
            <div class="popup-row"><span>Difference:</span><span style="color:${parcel.areaDiff > 0 ? '#e74c3c' : '#27ae60'}">${parcel.areaDiff > 0 ? '+' : ''}${formatNumber(parcel.areaDiff)} sqm</span></div>
            <div class="popup-row"><span>Type:</span><span>${parcel.type}</span></div>
            <div class="popup-row"><span>Status:</span><span>${parcel.status}</span></div>
            <div class="popup-actions">
                <button class="btn btn-primary btn-sm btn-block" onclick="openFieldPanelById(${parcel.id})">Open Verification</button>
            </div>
        </div>
    `;
}

function setupMapToolbar(osmLayer, satelliteLayer) {
    let currentBase = 'osm';

    document.querySelectorAll('#map-toolbar .tool-btn[data-layer]').forEach(btn => {
        btn.addEventListener('click', function() {
            const layer = this.dataset.layer;

            if (layer === 'ror') {
                showRorLayer = !showRorLayer;
                this.classList.toggle('active', showRorLayer);
                if (showRorLayer) fullMap.addLayer(fullRorLayer);
                else fullMap.removeLayer(fullRorLayer);
            } else if (layer === 'uav') {
                showUavLayer = !showUavLayer;
                this.classList.toggle('active', showUavLayer);
                if (showUavLayer) fullMap.addLayer(fullUavLayer);
                else fullMap.removeLayer(fullUavLayer);
            } else if (layer === 'satellite') {
                if (currentBase === 'osm') {
                    fullMap.removeLayer(osmLayer);
                    fullMap.addLayer(satelliteLayer);
                    currentBase = 'satellite';
                    this.classList.add('active');
                } else {
                    fullMap.removeLayer(satelliteLayer);
                    fullMap.addLayer(osmLayer);
                    currentBase = 'osm';
                    this.classList.remove('active');
                }
            }
        });
    });

    // Filter button toggles panel
    document.querySelector('#map-toolbar .tool-btn[data-action="filter"]').addEventListener('click', function() {
        const panel = document.getElementById('map-filter-panel');
        panel.classList.toggle('open');
        this.classList.toggle('active', panel.classList.contains('open'));
    });
}

function setupMapSearch() {
    const input = document.getElementById('map-search-input');
    if (!input) return;

    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            const query = this.value.trim();
            const parcel = PARCELS.find(p => p.parcelId === query);
            if (parcel && fullMap) {
                fullMap.setView(parcel.geometry.center, 18);
                // Open popup
                fullRorLayer.eachLayer(layer => {
                    if (layer.getTooltip && layer.getTooltip()) {
                        const content = layer.getTooltip().getContent();
                        if (content === query) {
                            layer.openPopup();
                        }
                    }
                });
            }
        }
    });
}

function setupMapFilterPanel() {
    document.getElementById('map-apply-filter').addEventListener('click', function() {
        mapScoreFilter = document.getElementById('map-score-filter').value;
        mapStatusFilter = document.getElementById('map-status-filter').value;
        renderMapParcels();
        document.getElementById('map-filter-panel').classList.remove('open');
    });
}

// Register
if (typeof registerPageInit === 'function') {
    registerPageInit('discrepancy-map', initDiscrepancyMap);
}
