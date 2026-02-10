// Check if member is logged in
const memberStr = sessionStorage.getItem('member');
if (!memberStr) {
    window.location.href = '/membership';
}

let member = JSON.parse(memberStr);

// Helper to get display values safely
function getFullName(m) {
    return [m.firstName, m.middleName, m.lastName].filter(Boolean).join(' ');
}

// Display in header + sidebar
function loadHeaderAndSidebar() {
    document.getElementById('memberName').textContent = getFullName(member) || member.email || 'Member';

    const sidebarNameEl = document.getElementById('sidebarName');
    const sidebarEmailEl = document.getElementById('sidebarEmail');
    const sidebarIdEl = document.getElementById('sidebarMemberId');
    const avatarEl = document.getElementById('memberAvatar');

    if (sidebarNameEl) sidebarNameEl.textContent = getFullName(member) || 'Member';
    if (sidebarEmailEl) sidebarEmailEl.textContent = member.email || '';
    if (sidebarIdEl) sidebarIdEl.textContent = member.id ? `Member ID: #${String(member.id).padStart(5, '0')}` : '';

    if (avatarEl) {
        const initial = (member.firstName || member.email || 'M').charAt(0).toUpperCase();
        avatarEl.textContent = initial;
    }
}

// Load main membership information
function loadMemberInfo() {
    const memberInfoDiv = document.getElementById('memberInfo');
    
    memberInfoDiv.innerHTML = `
        <div class="info-item">
            <div class="info-label">Full Name</div>
            <div class="info-value">${getFullName(member)}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Email</div>
            <div class="info-value">${member.email || '—'}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Mobile Number</div>
            <div class="info-value">${member.mobile || '—'}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Date of Birth</div>
            <div class="info-value">${member.birthdate ? new Date(member.birthdate).toLocaleDateString() : '—'}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Gender</div>
            <div class="info-value">${member.gender || '—'}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Civil Status</div>
            <div class="info-value">${member.civilStatus || '—'}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Address</div>
            <div class="info-value">${member.address || member.presentAddress || '—'}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Share Amount</div>
            <div class="info-value">${member.shareAmount != null ? '₱' + parseFloat(member.shareAmount).toFixed(2) : '—'}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Member ID</div>
            <div class="info-value">${member.id ? '#' + String(member.id).padStart(5, '0') : '—'}</div>
        </div>
    `;
    
    // Display status
    const statusBadge = document.getElementById('statusBadge');
    const status = member.status || 'pending';
    statusBadge.className = `status-badge status-${status}`;
    statusBadge.textContent = status === 'verified' ? '✓ Verified Member' : '⏳ Pending Verification';
}

// Populate profile form with current data
function populateProfileForm() {
    const firstNameInput = document.getElementById('profileFirstName');
    if (!firstNameInput) return; // if sidebar not present

    document.getElementById('profileFirstName').value = member.firstName || '';
    document.getElementById('profileMiddleName').value = member.middleName || '';
    document.getElementById('profileLastName').value = member.lastName || '';
    document.getElementById('profileMobile').value = member.mobile || '';
    document.getElementById('profileAddress').value = member.address || member.presentAddress || '';
}

// Wire profile form submit
const profileForm = document.getElementById('memberProfileForm');
if (profileForm) {
    profileForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const payload = {
            id: member.id,
            firstName: document.getElementById('profileFirstName').value.trim(),
            middleName: document.getElementById('profileMiddleName').value.trim(),
            lastName: document.getElementById('profileLastName').value.trim(),
            mobile: document.getElementById('profileMobile').value.trim(),
            address: document.getElementById('profileAddress').value.trim()
        };

        if (!payload.firstName || !payload.lastName) {
            alert('First name and Last name are required.');
            return;
        }

        try {
            const res = await fetch('/api/membership/update-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await res.json();

            if (result.success && result.member) {
                member = result.member;
                sessionStorage.setItem('member', JSON.stringify(member));
                loadHeaderAndSidebar();
                loadMemberInfo();
                populateProfileForm();
                alert('Profile updated successfully.');
            } else {
                alert('Error updating profile: ' + (result.error || 'Unknown error'));
            }
        } catch (err) {
            console.error(err);
            alert('Error updating profile. Please try again.');
        }
    });
}

// Wire password change form
const passwordForm = document.getElementById('memberPasswordForm');
if (passwordForm) {
    passwordForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmNewPassword = document.getElementById('confirmNewPassword').value;

        if (!currentPassword || !newPassword || !confirmNewPassword) {
            alert('Please fill in all password fields.');
            return;
        }

        if (newPassword.length < 6) {
            alert('New password must be at least 6 characters.');
            return;
        }

        if (newPassword !== confirmNewPassword) {
            alert('New passwords do not match.');
            return;
        }

        try {
            const res = await fetch('/api/membership/update-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: member.id, currentPassword, newPassword })
            });
            const result = await res.json();

            if (result.success) {
                alert('Password updated successfully.');
                passwordForm.reset();
            } else {
                alert('Error updating password: ' + (result.error || 'Unknown error'));
            }
        } catch (err) {
            console.error(err);
            alert('Error updating password. Please try again.');
        }
    });
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.removeItem('member');
        window.location.href = '/membership';
    }
}

// Load data on page load
loadHeaderAndSidebar();
loadMemberInfo();
populateProfileForm();