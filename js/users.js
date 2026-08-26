/* ============================================
   USERS.JS — User management page
   ============================================ */

function initUsers() {
    renderUsersTable();
    setupUserEvents();
}

function renderUsersTable() {
    const tbody = document.getElementById('users-table-body');
    tbody.innerHTML = USERS.map(u => {
        const statusDot = u.status === 'online'
            ? '<span style="display:inline-flex;align-items:center;gap:4px;"><span style="width:7px;height:7px;border-radius:50%;background:#27ae60;display:inline-block;"></span> Online</span>'
            : '<span style="display:inline-flex;align-items:center;gap:4px;"><span style="width:7px;height:7px;border-radius:50%;background:#bbb;display:inline-block;"></span> Offline</span>';

        return `
            <tr>
                <td>
                    <div style="display:flex;align-items:center;gap:8px;">
                        <div style="width:32px;height:32px;border-radius:50%;background:var(--primary-light);display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:600;flex-shrink:0;">${u.name.split(' ').map(n => n[0]).join('').substring(0, 2)}</div>
                        <div>
                            <div style="font-weight:600;font-size:var(--font-size-sm);">${u.fullName}</div>
                        </div>
                    </div>
                </td>
                <td style="font-size:var(--font-size-xs);">${u.email}</td>
                <td><span class="user-role-badge ${u.role}">${u.role.charAt(0).toUpperCase() + u.role.slice(1)}</span></td>
                <td style="font-size:var(--font-size-xs);">${statusDot}</td>
                <td style="font-size:var(--font-size-xs);">${u.lastActive}</td>
                <td class="cell-center">${u.parcelsAssigned}</td>
                <td>
                    <div class="action-cell">
                        <button class="action-btn" title="Edit">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button class="action-btn" title="More">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function setupUserEvents() {
    // Add user modal
    const addBtn = document.getElementById('add-user-btn');
    const modal = document.getElementById('add-user-modal');
    const closeBtn = document.getElementById('close-user-modal');
    const cancelBtn = document.getElementById('cancel-user-modal');
    const saveBtn = document.getElementById('save-user-modal');

    if (addBtn) {
        addBtn.addEventListener('click', () => modal.classList.add('open'));
    }
    if (closeBtn) {
        closeBtn.addEventListener('click', () => modal.classList.remove('open'));
    }
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => modal.classList.remove('open'));
    }
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) this.classList.remove('open');
        });
    }

    if (saveBtn && !saveBtn._bound) {
        saveBtn._bound = true;
        saveBtn.addEventListener('click', function() {
            const nameInput = document.getElementById('new-user-name');
            const emailInput = document.getElementById('new-user-email');
            const roleSelect = document.getElementById('new-user-role');

            const fullName = nameInput ? nameInput.value.trim() : '';
            const email = emailInput ? emailInput.value.trim() : '';
            const role = roleSelect ? roleSelect.value : 'surveyor';

            if (!fullName) {
                alert('Please enter a full name.');
                return;
            }
            if (!email) {
                alert('Please enter an email address.');
                return;
            }

            const shortName = fullName.split(' ')[0];
            const newUser = {
                id: USERS.length + 1,
                name: shortName,
                fullName: fullName,
                email: email,
                role: role,
                status: 'online',
                lastActive: new Date().toISOString().split('T')[0],
                parcelsAssigned: role === 'admin' || role === 'viewer' ? '-' : 0
            };

            USERS.unshift(newUser);
            renderUsersTable();

            // Clear inputs
            if (nameInput) nameInput.value = '';
            if (emailInput) emailInput.value = '';
            if (roleSelect) roleSelect.selectedIndex = 0;

            modal.classList.remove('open');
        });
    }
}

// Register
if (typeof registerPageInit === 'function') {
    registerPageInit('users', initUsers);
}
