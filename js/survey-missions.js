/* ============================================
   SURVEY-MISSIONS.JS — VTOL Drone Mission Tracking
   ============================================ */

function initSurveyMissions() {
    renderSurveyMissionsTable();
    setupSurveyMissionEvents();
}

function renderSurveyMissionsTable() {
    const tbody = document.getElementById('survey-missions-body');
    if (!tbody) return;

    tbody.innerHTML = SURVEY_MISSIONS.map(m => {
        let statusBadge = '';
        if (m.status === 'Completed') {
            statusBadge = '<span class="badge badge-verified">Completed</span>';
        } else if (m.status === 'Processing') {
            statusBadge = '<span class="badge badge-in-progress">Processing</span>';
        } else {
            statusBadge = '<span class="badge badge-pending">Planned</span>';
        }

        return `
            <tr>
                <td style="font-weight:700;">${m.id}</td>
                <td style="font-size:var(--font-size-xs);">${m.date}</td>
                <td style="font-size:var(--font-size-xs);">${m.drone}</td>
                <td style="font-size:var(--font-size-xs);">${m.pilot}</td>
                <td class="cell-center" style="font-size:var(--font-size-xs);">${m.flightTime}</td>
                <td class="cell-center" style="font-size:var(--font-size-xs);">${m.gcpsUsed}</td>
                <td class="cell-center" style="font-size:var(--font-size-xs);"><span class="badge badge-verified" style="background:#eef0ff;color:#4a3aad;">${m.rtkMode}</span></td>
                <td class="cell-center" style="font-size:var(--font-size-xs);">${m.orthomosaicRes}</td>
                <td class="cell-center">${statusBadge} <span class="text-xs text-muted" style="display:block;">${m.processingStatus}</span></td>
                <td>
                    <div class="action-cell">
                        <button class="btn btn-outline btn-sm" onclick="viewMissionDetails('${m.id}')">View ODM</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function setupSurveyMissionEvents() {
    const triggerBtn = document.getElementById('btn-trigger-survey');
    if (triggerBtn && !triggerBtn._bound) {
        triggerBtn._bound = true;
        triggerBtn.addEventListener('click', function() {
            this.innerHTML = '<span style="display:inline-flex;align-items:center;gap:6px;"><span class="spinner"></span> Triggering VTOL...</span>';
            this.disabled = true;

            setTimeout(() => {
                this.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><polyline points="20 6 9 17 4 12"/></svg>
                    VTOL Drone Triggered!
                `;
                this.style.background = '#27ae60';
                this.style.borderColor = '#27ae60';

                // Add a new mission to top
                SURVEY_MISSIONS.unshift({
                    id: `MSN-00${SURVEY_MISSIONS.length + 1}`,
                    date: new Date().toISOString().split('T')[0],
                    drone: 'VTOL-01 (PX4)',
                    pilot: 'Admin (Remote Trigger)',
                    status: 'Processing',
                    area: '2.5 sq km', altitude: '120 m AGL', overlap: '80/70%',
                    flightTime: 'Live Flying...', images: 0, gcpsUsed: 6,
                    parcelsProcessed: 0, rtkMode: 'RTK Fixed',
                    orthomosaicRes: 'In Progress', pointCloud: 'Processing...',
                    processingStatus: 'VTOL In-Flight → ODM Processing', odmVersion: 'ODM 3.2.1'
                });

                renderSurveyMissionsTable();

                setTimeout(() => {
                    this.innerHTML = `
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        Trigger New Drone Survey
                    `;
                    this.style.background = '';
                    this.style.borderColor = '';
                    this.disabled = false;
                }, 2500);
            }, 1200);
        });
    }
}

window.viewMissionDetails = function(missionId) {
    alert(`Survey Mission ${missionId}\nODM Photogrammetry: Orthomosaic & 3D Point Cloud generated successfully.\nProcessing pipeline: VTOL → ODM → U-Net Boundary → PostGIS`);
};

// Register
if (typeof registerPageInit === 'function') {
    registerPageInit('survey-missions', initSurveyMissions);
}
