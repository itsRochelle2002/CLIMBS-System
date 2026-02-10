// Check if admin is logged in
const isAdmin = sessionStorage.getItem('admin');
if (!isAdmin) {
    window.location.href = '/membership';
}

let allMembers = [];
let currentFilter = 'all';

// Load all members
async function loadMembers() {
    try {
        const response = await fetch('/api/membership/all-members');
        const result = await response.json();
        
        if (result.success) {
            allMembers = result.members;
            displayMembers(currentFilter);
            updateStats();
        }
    } catch (error) {
        console.error('Error loading members:', error);
    }
}

// Display members based on filter
function displayMembers(filter) {
    currentFilter = filter;
    
    // Update filter buttons (safe when called from loadMembers - no event)
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        const btnFilter = btn.textContent.trim().toLowerCase();
        if (btnFilter === filter.toLowerCase()) btn.classList.add('active');
    });
    
    const tbody = document.getElementById('membersTableBody');
    tbody.innerHTML = '';
    
    let filteredMembers = allMembers;
    
    if (filter === 'pending') {
        filteredMembers = allMembers.filter(m => !m.status || m.status === 'pending');
    } else if (filter === 'verified') {
        filteredMembers = allMembers.filter(m => m.status === 'verified');
    }
    
    if (filteredMembers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 30px;">No members found</td></tr>';
        return;
    }
    
    filteredMembers.forEach(member => {
        const row = document.createElement('tr');
        const status = member.status || 'pending';
        
        row.innerHTML = `
            <td>#${String(member.id).padStart(5, '0')}</td>
            <td>${member.firstName} ${member.lastName}</td>
            <td>${member.email}</td>
            <td>${member.mobile}</td>
            <td>${new Date(member.registrationDate).toLocaleDateString()}</td>
            <td><span class="status-badge status-${status}">${status === 'verified' ? 'Verified' : 'Pending'}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-view" onclick="viewMember(${member.id})">View</button>
                    ${status === 'pending' ? `<button class="btn-verify" onclick="verifyMember(${member.id})">Verify</button>` : ''}
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Update statistics
function updateStats() {
    const total = allMembers.length;
    const pending = allMembers.filter(m => !m.status || m.status === 'pending').length;
    const verified = allMembers.filter(m => m.status === 'verified').length;
    
    document.getElementById('totalMembers').textContent = total;
    document.getElementById('pendingMembers').textContent = pending;
    document.getElementById('verifiedMembers').textContent = verified;
}

// Filter members
function filterMembers(filter) {
    currentFilter = filter;
    displayMembers(filter);
}

// View member details
function viewMember(memberId) {
    const member = allMembers.find(m => m.id === memberId);
    if (!member) return;
    
    const detailsBody = document.getElementById('memberDetailsBody');
    const status = member.status || 'pending';
    
    detailsBody.innerHTML = `
        <div class="detail-grid">
            <div class="detail-item">
                <div class="detail-label">Member ID</div>
                <div class="detail-value">#${String(member.id).padStart(5, '0')}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Full Name</div>
                <div class="detail-value">${[member.firstName, member.middleName, member.lastName].filter(Boolean).join(' ')}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Email</div>
                <div class="detail-value">${member.email}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Mobile</div>
                <div class="detail-value">${member.mobile || '—'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Date of Birth</div>
                <div class="detail-value">${member.birthdate ? new Date(member.birthdate).toLocaleDateString() : '—'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Gender</div>
                <div class="detail-value">${member.gender || '—'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Civil Status</div>
                <div class="detail-value">${member.civilStatus || '—'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Address</div>
                <div class="detail-value">${member.address || member.presentAddress || '—'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Beneficiary Name</div>
                <div class="detail-value">${member.beneficiaryName || '—'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Relationship</div>
                <div class="detail-value">${member.relationship || '—'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Share Amount</div>
                <div class="detail-value">${member.shareAmount != null ? '₱' + parseFloat(member.shareAmount).toFixed(2) : '—'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Payment Mode</div>
                <div class="detail-value">${member.paymentMode || '—'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Registration Date</div>
                <div class="detail-value">${new Date(member.registrationDate).toLocaleDateString()}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Status</div>
                <div class="detail-value"><span class="status-badge status-${status}">${status === 'verified' ? 'Verified' : 'Pending'}</span></div>
            </div>
        </div>
    `;
    
    document.getElementById('viewMemberModal').style.display = 'block';
}

// Close view member modal
function closeViewMember() {
    document.getElementById('viewMemberModal').style.display = 'none';
}

// Verify member
async function verifyMember(memberId) {
    if (!confirm('Verify this member?')) return;
    
    try {
        const response = await fetch('/api/membership/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ memberId })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Member verified successfully!');
            loadMembers(); // Reload members
        } else {
            alert('Error verifying member');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error verifying member');
    }
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.removeItem('admin');
        window.location.href = '/membership';
    }
}

// Load members on page load
loadMembers();