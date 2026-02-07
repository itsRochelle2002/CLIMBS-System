// Check if member is logged in
const memberStr = sessionStorage.getItem('member');
if (!memberStr) {
    window.location.href = '/membership';
}

const member = JSON.parse(memberStr);

// Display member name
document.getElementById('memberName').textContent = `${member.firstName} ${member.lastName}`;

// Load member information
function loadMemberInfo() {
    const memberInfoDiv = document.getElementById('memberInfo');
    
    memberInfoDiv.innerHTML = `
        <div class="info-item">
            <div class="info-label">Full Name</div>
            <div class="info-value">${member.firstName} ${member.middleName} ${member.lastName}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Email</div>
            <div class="info-value">${member.email}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Mobile Number</div>
            <div class="info-value">${member.mobile}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Date of Birth</div>
            <div class="info-value">${new Date(member.birthdate).toLocaleDateString()}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Gender</div>
            <div class="info-value">${member.gender}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Civil Status</div>
            <div class="info-value">${member.civilStatus}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Address</div>
            <div class="info-value">${member.address}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Share Amount</div>
            <div class="info-value">₱${parseFloat(member.shareAmount).toFixed(2)}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Member ID</div>
            <div class="info-value">#${String(member.id).padStart(5, '0')}</div>
        </div>
    `;
    
    // Display status
    const statusBadge = document.getElementById('statusBadge');
    const status = member.status || 'pending';
    statusBadge.className = `status-badge status-${status}`;
    statusBadge.textContent = status === 'verified' ? '✓ Verified Member' : '⏳ Pending Verification';
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.removeItem('member');
        window.location.href = '/membership';
    }
}

// Load data on page load
loadMemberInfo();