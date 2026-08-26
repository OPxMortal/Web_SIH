/* ============================================
   ACTIONS.JS — Admin actions page
   ============================================ */

function initActions() {
    renderActionLog();
}

function renderActionLog() {
    const tbody = document.getElementById('action-log-body');
    tbody.innerHTML = ACTION_LOG.map(a => {
        let statusBadge = '';
        if (a.status === 'Completed') {
            statusBadge = '<span class="badge badge-verified">Completed</span>';
        } else if (a.status === 'Pending Review') {
            statusBadge = '<span class="badge badge-pending">Pending Review</span>';
        } else if (a.status === 'Under Review') {
            statusBadge = '<span class="badge badge-in-progress">Under Review</span>';
        }

        return `
            <tr>
                <td style="font-weight:500;font-size:var(--font-size-xs);">${a.id}</td>
                <td style="font-size:var(--font-size-xs);">${a.action}</td>
                <td style="font-weight:600;">${a.parcelId}</td>
                <td style="font-size:var(--font-size-xs);">${a.user}</td>
                <td style="font-size:var(--font-size-xs);">${a.date}</td>
                <td class="cell-center">${statusBadge}</td>
            </tr>
        `;
    }).join('');
}

// Register
if (typeof registerPageInit === 'function') {
    registerPageInit('actions', initActions);
}
