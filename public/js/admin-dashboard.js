// Check if admin is logged in
const isAdmin = sessionStorage.getItem('admin');
if (!isAdmin) {
    window.location.href = '/membership';
}

let allMembers = [];
let allFinancials = {};
let allPaymentMethods = {}; // { memberId: [ methods ] }
let currentFilter = 'all';
let currentLoanFilter = 'all';
let currentPaymentMethodFilter = 'all';
let currentViewPaymentMethod = null; // { memberId, method } for modal verify/reject

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadMembers();
    
    // Add loan action change listener
    const loanActionSelect = document.getElementById('loanAction');
    if (loanActionSelect) {
        loanActionSelect.addEventListener('change', function() {
            const rejectGroup = document.getElementById('rejectReasonGroup');
            if (this.value === 'reject') {
                rejectGroup.style.display = 'block';
            } else {
                rejectGroup.style.display = 'none';
            }
        });
    }
    
    // Loan action form
    const loanActionForm = document.getElementById('loanActionForm');
    if (loanActionForm) {
        loanActionForm.addEventListener('submit', handleLoanAction);
    }
});

// Show section
function showSection(section) {
    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.style.display = 'none';
    });
    
    // Show selected section
    if (section === 'members') {
        document.getElementById('membersSection').style.display = 'block';
        loadMembers();
    } else if (section === 'paymentMethods') {
        document.getElementById('paymentMethodsSection').style.display = 'block';
        loadPaymentMethods();
    } else if (section === 'financials') {
        document.getElementById('financialsSection').style.display = 'block';
        loadFinancialOverview();
    } else if (section === 'loans') {
        document.getElementById('loansSection').style.display = 'block';
        loadLoanApplications();
    }
}

// Load members
async function loadMembers() {
    try {
        const response = await fetch('/api/membership/all-members');
        const result = await response.json();
        
        if (result.success) {
            allMembers = result.members;
            displayMembers(allMembers);
            updateStats(allMembers);
        }
    } catch (error) {
        console.error('Error loading members:', error);
    }
}

// Display members
function displayMembers(members) {
    const tbody = document.getElementById('membersTableBody');
    tbody.innerHTML = '';
    
    if (members.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">No members found</td></tr>';
        return;
    }
    
    members.forEach(member => {
        const row = document.createElement('tr');
        const statusClass = member.status === 'verified' ? 'status-verified' : 'status-pending';
        const statusText = member.status === 'verified' ? 'Verified' : 'Pending';
        
        const regDate = new Date(member.registrationDate);
        const formattedDate = regDate.toLocaleDateString();
        
        row.innerHTML = `
            <td>#${String(member.id).padStart(5, '0')}</td>
            <td>${member.firstName || ''} ${member.lastName || ''}</td>
            <td>${member.email || '-'}</td>
            <td>${member.mobile || '-'}</td>
            <td>${formattedDate}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>
                <button class="btn btn-view" onclick="viewMember(${member.id})">View</button>
                ${member.status === 'pending' ? `<button class="btn btn-success" onclick="verifyMember(${member.id})">Verify</button>` : ''}
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Update stats
function updateStats(members) {
    const total = members.length;
    const pending = members.filter(m => m.status === 'pending').length;
    const verified = members.filter(m => m.status === 'verified').length;
    
    document.getElementById('totalMembers').textContent = total;
    document.getElementById('pendingMembers').textContent = pending;
    document.getElementById('verifiedMembers').textContent = verified;
}

// --- Payment Methods (admin) ---
async function loadPaymentMethods() {
    try {
        const [pmResponse, membersResponse] = await Promise.all([
            fetch('/api/membership/all-payment-methods'),
            fetch('/api/membership/all-members')
        ]);
        const pmResult = await pmResponse.json();
        const membersResult = await membersResponse.json();
        if (pmResult.success && membersResult.success) {
            allPaymentMethods = pmResult.paymentMethods || {};
            if (membersResult.members && membersResult.members.length) allMembers = membersResult.members;
            displayPaymentMethods(allPaymentMethods, membersResult.members);
        }
    } catch (error) {
        console.error('Error loading payment methods:', error);
        document.getElementById('paymentMethodsTableBody').innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;">Error loading payment methods</td></tr>';
    }
}

function displayPaymentMethods(pmData, members) {
    const tbody = document.getElementById('paymentMethodsTableBody');
    tbody.innerHTML = '';
    let pendingCount = 0, verifiedCount = 0;
    const rows = [];
    Object.keys(pmData).forEach(memberId => {
        const methods = pmData[memberId] || [];
        const member = members.find(m => String(m.id) === String(memberId));
        const memberName = member ? `${member.firstName || ''} ${member.lastName || ''}`.trim() || `#${memberId}` : `#${memberId}`;
        methods.forEach(method => {
            if (method.status === 'pending') pendingCount++;
            else if (method.status === 'verified') verifiedCount++;
            if (currentPaymentMethodFilter !== 'all' && method.status !== currentPaymentMethodFilter) return;
            const details = method.type === 'ewallet' ? `${method.provider} - ${method.mobile || '-'}` : `${method.bankName || '-'} - ${method.accountNumber || '-'}`;
            const dateAdded = method.addedAt ? new Date(method.addedAt).toLocaleDateString() : '-';
            const statusClass = method.status === 'verified' ? 'status-verified' : method.status === 'pending' ? 'status-pending' : 'status-rejected';
            rows.push({ memberId, memberName, method, details, dateAdded, statusClass });
        });
    });
    document.getElementById('pendingPaymentMethods').textContent = pendingCount;
    document.getElementById('verifiedPaymentMethods').textContent = verifiedCount;
    if (rows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px;">No payment methods match filter</td></tr>';
        return;
    }
    rows.forEach(({ memberId, memberName, method, details, dateAdded, statusClass }) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${memberName}</td>
            <td>${method.type === 'ewallet' ? '📱 E-Wallet' : '🏦 Bank'}</td>
            <td>${details}</td>
            <td>${dateAdded}</td>
            <td><span class="status-badge ${statusClass}">${method.status}</span></td>
            <td>
                <button class="btn btn-view" onclick="viewPaymentMethodModal(${memberId}, '${method.id}')">View</button>
                ${method.status === 'pending' ? `<button class="btn btn-success" onclick="confirmVerifyPaymentMethodFromTable(${memberId}, '${method.id}')">Verify</button>` : ''}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function filterPaymentMethods(status) {
    currentPaymentMethodFilter = status;
    document.querySelectorAll('#paymentMethodsSection .filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    const members = allMembers.length ? allMembers : [];
    if (!allMembers.length) {
        fetch('/api/membership/all-members').then(r => r.json()).then(result => {
            if (result.success) displayPaymentMethods(allPaymentMethods, result.members);
        });
    } else {
        displayPaymentMethods(allPaymentMethods, allMembers);
    }
}

async function viewPaymentMethodModal(memberId, methodId) {
    const res = await fetch(`/api/membership/payment-methods?memberId=${memberId}`);
    const result = await res.json();
    if (!result.success || !result.methods) {
        alert('Could not load payment method');
        return;
    }
    const method = result.methods.find(m => m.id === methodId);
    if (!method) {
        alert('Payment method not found');
        return;
    }
    currentViewPaymentMethod = { memberId, method };
    const member = allMembers.find(m => m.id === parseInt(memberId, 10));
    const memberName = member ? `${member.firstName} ${member.lastName}` : `#${memberId}`;
    let detailsHtml = `
        <div class="member-detail-grid">
            <div class="detail-item"><div class="detail-label">Member</div><div class="detail-value">${memberName}</div></div>
            <div class="detail-item"><div class="detail-label">Type</div><div class="detail-value">${method.type === 'ewallet' ? 'E-Wallet' : 'Bank Account'}</div></div>
    `;
    if (method.type === 'ewallet') {
        detailsHtml += `
            <div class="detail-item"><div class="detail-label">Provider</div><div class="detail-value">${method.provider || '-'}</div></div>
            <div class="detail-item"><div class="detail-label">Mobile</div><div class="detail-value">${method.mobile || '-'}</div></div>
            <div class="detail-item"><div class="detail-label">Account Name</div><div class="detail-value">${method.accountName || '-'}</div></div>
        `;
    } else {
        detailsHtml += `
            <div class="detail-item"><div class="detail-label">Bank</div><div class="detail-value">${method.bankName || '-'}</div></div>
            <div class="detail-item"><div class="detail-label">Account Number</div><div class="detail-value">${method.accountNumber || '-'}</div></div>
            <div class="detail-item"><div class="detail-label">Account Name</div><div class="detail-value">${method.accountName || '-'}</div></div>
        `;
    }
    detailsHtml += `<div class="detail-item"><div class="detail-label">Status</div><div class="detail-value"><span class="status-badge status-${method.status}">${method.status}</span></div></div>`;
    detailsHtml += `<div class="detail-item"><div class="detail-label">Date Added</div><div class="detail-value">${method.addedAt ? new Date(method.addedAt).toLocaleString() : '-'}</div></div></div>`;
    if (method.proof && method.proof.startsWith('data:')) {
        detailsHtml += `<h4 style="margin-top:20px;">Proof of account</h4><img src="${method.proof}" alt="Proof" style="max-width:100%; max-height:400px; border-radius:8px; border:1px solid #ddd;">`;
    }
    document.getElementById('paymentMethodDetailsBody').innerHTML = detailsHtml;
    document.getElementById('paymentMethodActions').style.display = method.status === 'pending' ? 'flex' : 'none';
    if (document.getElementById('paymentMethodActions').style.display === 'flex') {
        document.getElementById('paymentMethodActions').style.gap = '10px';
        document.getElementById('paymentMethodActions').style.flexWrap = 'wrap';
    }
    document.getElementById('viewPaymentMethodModal').style.display = 'block';
}

function closePaymentMethodModal() {
    document.getElementById('viewPaymentMethodModal').style.display = 'none';
    currentViewPaymentMethod = null;
}

async function confirmVerifyPaymentMethod() {
    if (!currentViewPaymentMethod || !confirm('Verify this payment method?')) return;
    await updatePaymentMethodStatus(currentViewPaymentMethod.memberId, currentViewPaymentMethod.method.id, 'verified');
}

async function confirmRejectPaymentMethod() {
    if (!currentViewPaymentMethod || !confirm('Reject this payment method? Member will need to submit again.')) return;
    await updatePaymentMethodStatus(currentViewPaymentMethod.memberId, currentViewPaymentMethod.method.id, 'rejected');
}

function confirmVerifyPaymentMethodFromTable(memberId, methodId) {
    if (!confirm('Verify this payment method?')) return;
    updatePaymentMethodStatus(memberId, methodId, 'verified');
}

async function updatePaymentMethodStatus(memberId, methodId, status) {
    try {
        const response = await fetch('/api/membership/payment-method-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ memberId: String(memberId), methodId, status })
        });
        const result = await response.json();
        if (result.success) {
            alert('Payment method ' + status + ' successfully.');
            closePaymentMethodModal();
            loadPaymentMethods();
            if (document.getElementById('viewMemberModal').style.display === 'block') {
                const el = document.getElementById('memberDetailPaymentMethods');
                if (el) fetch(`/api/membership/payment-methods?memberId=${memberId}`).then(r => r.json()).then(res => {
                    if (res.success && res.methods && res.methods.length > 0) {
                        el.innerHTML = res.methods.map(m => {
                            const statusClass = m.status === 'verified' ? 'status-verified' : m.status === 'pending' ? 'status-pending' : 'status-rejected';
                            const details = m.type === 'ewallet' ? `${m.provider} - ${m.mobile}` : `${m.bankName} - ${m.accountNumber}`;
                            return `<div style="margin:8px 0; padding:10px; background:#f8f9ff; border-radius:8px;">
                                <strong>${m.type === 'ewallet' ? '📱 E-Wallet' : '🏦 Bank'}</strong> ${details}<br>
                                <span class="status-badge ${statusClass}">${m.status}</span>
                                ${m.status === 'pending' ? `<button class="btn btn-success btn-sm" style="margin-left:8px;" onclick="viewPaymentMethodModal(${memberId}, '${m.id}')">Review</button>` : ''}
                            </div>`;
                        }).join('');
                    }
                });
            }
        } else {
            alert('Error: ' + (result.error || 'Failed to update'));
        }
    } catch (error) {
        console.error(error);
        alert('Error updating payment method');
    }
}

// Filter members
function filterMembers(status) {
    currentFilter = status;
    
    // Update filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Filter and display
    if (status === 'all') {
        displayMembers(allMembers);
    } else {
        const filtered = allMembers.filter(m => m.status === status);
        displayMembers(filtered);
    }
}

// View member details
function viewMember(memberId) {
    const member = allMembers.find(m => m.id === memberId);
    if (!member) return;
    
    const detailsBody = document.getElementById('memberDetailsBody');
    detailsBody.innerHTML = `
        <div class="member-detail-grid">
            <div class="detail-item">
                <div class="detail-label">Member ID</div>
                <div class="detail-value">#${String(member.id).padStart(5, '0')}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Status</div>
                <div class="detail-value">
                    <span class="status-badge ${member.status === 'verified' ? 'status-verified' : 'status-pending'}">
                        ${member.status === 'verified' ? 'Verified' : 'Pending'}
                    </span>
                </div>
            </div>
            <div class="detail-item">
                <div class="detail-label">First Name</div>
                <div class="detail-value">${member.firstName || '-'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Last Name</div>
                <div class="detail-value">${member.lastName || '-'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Middle Name</div>
                <div class="detail-value">${member.middleName || '-'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Email</div>
                <div class="detail-value">${member.email || '-'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Mobile Number</div>
                <div class="detail-value">${member.mobile || '-'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Date of Birth</div>
                <div class="detail-value">${member.birthdate ? new Date(member.birthdate).toLocaleDateString() : '-'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Gender</div>
                <div class="detail-value">${member.gender || '-'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Civil Status</div>
                <div class="detail-value">${member.civilStatus || '-'}</div>
            </div>
            <div class="detail-item" style="grid-column: 1 / -1;">
                <div class="detail-label">Address</div>
                <div class="detail-value">${member.address || member.presentAddress || '-'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Registration Date</div>
                <div class="detail-value">${new Date(member.registrationDate).toLocaleString()}</div>
            </div>
            ${member.verifiedDate ? `
            <div class="detail-item">
                <div class="detail-label">Verified Date</div>
                <div class="detail-value">${new Date(member.verifiedDate).toLocaleString()}</div>
            </div>
            ` : ''}
            <div class="detail-item" style="grid-column: 1 / -1;">
                <div class="detail-label">💳 Payment Methods</div>
                <div class="detail-value" id="memberDetailPaymentMethods">Loading...</div>
            </div>
        </div>
        
        ${member.status === 'pending' ? `
        <div class="form-actions">
            <button class="btn btn-success" onclick="verifyMember(${member.id}); closeViewMember();">Verify Member</button>
            <button class="btn btn-secondary" onclick="closeViewMember()">Close</button>
        </div>
        ` : ''}
    `;
    
    document.getElementById('viewMemberModal').style.display = 'block';
    
    // Load this member's payment methods
    fetch(`/api/membership/payment-methods?memberId=${member.id}`)
        .then(r => r.json())
        .then(result => {
            const el = document.getElementById('memberDetailPaymentMethods');
            if (result.success && result.methods && result.methods.length > 0) {
                el.innerHTML = result.methods.map(m => {
                    const statusClass = m.status === 'verified' ? 'status-verified' : m.status === 'pending' ? 'status-pending' : 'status-rejected';
                    const details = m.type === 'ewallet' ? `${m.provider} - ${m.mobile}` : `${m.bankName} - ${m.accountNumber}`;
                    return `<div style="margin:8px 0; padding:10px; background:#f8f9ff; border-radius:8px;">
                        <strong>${m.type === 'ewallet' ? '📱 E-Wallet' : '🏦 Bank'}</strong> ${details}<br>
                        <span class="status-badge ${statusClass}">${m.status}</span>
                        ${m.status === 'pending' ? `<button class="btn btn-success btn-sm" style="margin-left:8px;" onclick="viewPaymentMethodModal(${member.id}, '${m.id}')">Review</button>` : ''}
                    </div>`;
                }).join('');
            } else {
                el.innerHTML = '<em>No payment methods added</em>';
            }
        })
        .catch(() => { document.getElementById('memberDetailPaymentMethods').innerHTML = '<em>Error loading</em>'; });
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
            loadMembers();
        } else {
            alert('Error verifying member: ' + (result.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error verifying member');
    }
}

// Load financial overview
async function loadFinancialOverview() {
    try {
        const [membersResponse, financialsResponse] = await Promise.all([
            fetch('/api/membership/all-members'),
            fetch('/api/membership/all-financials')
        ]);
        
        const membersResult = await membersResponse.json();
        const financialsResult = await financialsResponse.json();
        
        if (membersResult.success && financialsResult.success) {
            allFinancials = financialsResult.financials;
            displayFinancialOverview(membersResult.members, financialsResult.financials);
        }
    } catch (error) {
        console.error('Error loading financials:', error);
    }
}

// Display financial overview
function displayFinancialOverview(members, financials) {
    const tbody = document.getElementById('financialsTableBody');
    tbody.innerHTML = '';
    
    let totalShareCapital = 0;
    let totalSavings = 0;
    let totalLoans = 0;
    
    // Only show verified members
    const verifiedMembers = members.filter(m => m.status === 'verified');
    
    if (verifiedMembers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px;">No verified members yet</td></tr>';
        return;
    }
    
    verifiedMembers.forEach(member => {
        const memberFinancials = financials[member.id] || {
            shareCapital: { total: 0 },
            savings: { balance: 0 },
            loans: { currentBalance: 0 }
        };
        
        totalShareCapital += memberFinancials.shareCapital.total || 0;
        totalSavings += memberFinancials.savings.balance || 0;
        totalLoans += memberFinancials.loans.currentBalance || 0;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>#${String(member.id).padStart(5, '0')}</td>
            <td>${member.firstName || ''} ${member.lastName || ''}</td>
            <td>₱${(memberFinancials.shareCapital.total || 0).toFixed(2)}</td>
            <td>₱${(memberFinancials.savings.balance || 0).toFixed(2)}</td>
            <td>₱${(memberFinancials.loans.currentBalance || 0).toFixed(2)}</td>
            <td>
                <button class="btn btn-view" onclick="viewFinancialDetails(${member.id})">Details</button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Update summary stats
    document.getElementById('totalShareCapital').textContent = `₱${totalShareCapital.toFixed(2)}`;
    document.getElementById('totalSavings').textContent = `₱${totalSavings.toFixed(2)}`;
    document.getElementById('totalLoans').textContent = `₱${totalLoans.toFixed(2)}`;
}

// View financial details
function viewFinancialDetails(memberId) {
    const member = allMembers.find(m => m.id === memberId);
    const financials = allFinancials[memberId] || {
        shareCapital: { total: 0, shares: 0, history: [] },
        savings: { balance: 0, history: [] },
        loans: { currentBalance: 0, currentLoan: null, history: [] }
    };
    
    const detailsBody = document.getElementById('financialDetailsBody');
    detailsBody.innerHTML = `
        <h3>${member.firstName} ${member.lastName} - Financial Details</h3>
        
        <div style="margin: 30px 0;">
            <h4 style="color: #667eea; margin-bottom: 15px;">💰 Share Capital</h4>
            <div class="member-detail-grid">
                <div class="detail-item">
                    <div class="detail-label">Total Share Capital</div>
                    <div class="detail-value">₱${(financials.shareCapital.total || 0).toFixed(2)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Number of Shares</div>
                    <div class="detail-value">${financials.shareCapital.shares || 0}</div>
                </div>
            </div>
            ${financials.shareCapital.history && financials.shareCapital.history.length > 0 ? `
                <h5 style="margin-top: 20px;">Transaction History:</h5>
                ${financials.shareCapital.history.map(t => `
                    <div style="padding: 10px; background: #f8f9ff; margin: 5px 0; border-radius: 8px;">
                        ${new Date(t.date).toLocaleString()} - ₱${t.amount.toFixed(2)} (${t.paymentMethod})
                    </div>
                `).join('')}
            ` : '<p>No share capital transactions</p>'}
        </div>
        
        <div style="margin: 30px 0;">
            <h4 style="color: #667eea; margin-bottom: 15px;">🏦 Savings</h4>
            <div class="member-detail-grid">
                <div class="detail-item">
                    <div class="detail-label">Current Balance</div>
                    <div class="detail-value">₱${(financials.savings.balance || 0).toFixed(2)}</div>
                </div>
            </div>
            ${financials.savings.history && financials.savings.history.length > 0 ? `
                <h5 style="margin-top: 20px;">Transaction History:</h5>
                ${financials.savings.history.map(t => `
                    <div style="padding: 10px; background: #f8f9ff; margin: 5px 0; border-radius: 8px;">
                        ${new Date(t.date).toLocaleString()} - ${t.type.toUpperCase()} - ₱${t.amount.toFixed(2)}
                    </div>
                `).join('')}
            ` : '<p>No savings transactions</p>'}
        </div>
        
        <div style="margin: 30px 0;">
            <h4 style="color: #667eea; margin-bottom: 15px;">📋 Loans</h4>
            <div class="member-detail-grid">
                <div class="detail-item">
                    <div class="detail-label">Current Balance</div>
                    <div class="detail-value">₱${(financials.loans.currentBalance || 0).toFixed(2)}</div>
                </div>
                ${financials.loans.currentLoan ? `
                <div class="detail-item">
                    <div class="detail-label">Monthly Payment</div>
                    <div class="detail-value">₱${(financials.loans.currentLoan.monthlyPayment || 0).toFixed(2)}</div>
                </div>
                ` : ''}
            </div>
            ${financials.loans.history && financials.loans.history.length > 0 ? `
                <h5 style="margin-top: 20px;">Loan Applications:</h5>
                ${financials.loans.history.map((loan, index) => `
                    <div style="padding: 15px; background: #f8f9ff; margin: 10px 0; border-radius: 8px;">
                        <strong>${loan.loanType}</strong> - ₱${loan.amount.toFixed(2)}<br>
                        ${loan.term} months | ${loan.purpose}<br>
                        Applied: ${new Date(loan.applicationDate).toLocaleDateString()}<br>
                        Status: <span class="status-badge status-${loan.status}">${loan.status.toUpperCase()}</span>
                    </div>
                `).join('')}
            ` : '<p>No loan applications</p>'}
        </div>
    `;
    
    document.getElementById('viewFinancialModal').style.display = 'block';
}

// Close financial modal
function closeFinancialModal() {
    document.getElementById('viewFinancialModal').style.display = 'none';
}

// Load loan applications
async function loadLoanApplications() {
    try {
        const [membersResponse, financialsResponse] = await Promise.all([
            fetch('/api/membership/all-members'),
            fetch('/api/membership/all-financials')
        ]);
        
        const membersResult = await membersResponse.json();
        const financialsResult = await financialsResponse.json();
        
        if (membersResult.success && financialsResult.success) {
            displayLoanApplications(membersResult.members, financialsResult.financials);
        }
    } catch (error) {
        console.error('Error loading loan applications:', error);
    }
}

// Display loan applications
function displayLoanApplications(members, financials) {
    const tbody = document.getElementById('loansTableBody');
    tbody.innerHTML = '';
    
    const allLoans = [];
    
    // Collect all loans from all members
    members.forEach(member => {
        const memberFinancials = financials[member.id];
        if (memberFinancials && memberFinancials.loans && memberFinancials.loans.history) {
            memberFinancials.loans.history.forEach((loan, index) => {
                allLoans.push({
                    memberId: member.id,
                    memberName: `${member.firstName} ${member.lastName}`,
                    loanIndex: index,
                    ...loan
                });
            });
        }
    });
    
    if (allLoans.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px;">No loan applications</td></tr>';
        return;
    }
    
    // Sort by date (newest first)
    allLoans.sort((a, b) => new Date(b.applicationDate) - new Date(a.applicationDate));
    
    allLoans.forEach(loan => {
        const row = document.createElement('tr');
        const statusClass = `status-${loan.status}`;
        
        row.innerHTML = `
            <td>${loan.memberName}</td>
            <td>${loan.loanType}</td>
            <td>₱${loan.amount.toFixed(2)}</td>
            <td>${loan.term} months</td>
            <td>${loan.purpose}</td>
            <td>${new Date(loan.applicationDate).toLocaleDateString()}</td>
            <td><span class="status-badge ${statusClass}">${loan.status.toUpperCase()}</span></td>
            <td>
                ${loan.status === 'pending' ? `
                    <button class="btn btn-view" onclick="showLoanAction(${loan.memberId}, ${loan.loanIndex})">Review</button>
                ` : ''}
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Filter loans
function filterLoans(status) {
    currentLoanFilter = status;
    
    // Update filter buttons
    document.querySelectorAll('#loansSection .filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Reload with filter
    loadLoanApplications();
}

// Show loan action modal
function showLoanAction(memberId, loanIndex) {
    const member = allMembers.find(m => m.id === memberId);
    const loan = allFinancials[memberId].loans.history[loanIndex];
    
    document.getElementById('loanActionTitle').textContent = 'Review Loan Application';
    document.getElementById('loanActionDetails').innerHTML = `
        <div class="member-detail-grid">
            <div class="detail-item">
                <div class="detail-label">Member</div>
                <div class="detail-value">${member.firstName} ${member.lastName}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Loan Type</div>
                <div class="detail-value">${loan.loanType}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Amount</div>
                <div class="detail-value">₱${loan.amount.toFixed(2)}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Term</div>
                <div class="detail-value">${loan.term} months</div>
            </div>
            <div class="detail-item" style="grid-column: 1 / -1;">
                <div class="detail-label">Purpose</div>
                <div class="detail-value">${loan.purpose}</div>
            </div>
            ${loan.notes ? `
            <div class="detail-item" style="grid-column: 1 / -1;">
                <div class="detail-label">Notes</div>
                <div class="detail-value">${loan.notes}</div>
            </div>
            ` : ''}
        </div>
    `;
    
    // Store current loan info for form submission
    document.getElementById('loanActionForm').dataset.memberId = memberId;
    document.getElementById('loanActionForm').dataset.loanIndex = loanIndex;
    
    document.getElementById('loanActionModal').style.display = 'block';
}

// Close loan action modal
function closeLoanActionModal() {
    document.getElementById('loanActionModal').style.display = 'none';
    document.getElementById('loanActionForm').reset();
    document.getElementById('rejectReasonGroup').style.display = 'none';
}

// Handle loan action
async function handleLoanAction(e) {
    e.preventDefault();
    
    const form = e.target;
    const memberId = parseInt(form.dataset.memberId);
    const loanIndex = parseInt(form.dataset.loanIndex);
    const action = document.getElementById('loanAction').value;
    
    if (action === 'approve') {
        if (!confirm('Approve this loan application?')) return;
        
        try {
            const response = await fetch('/api/membership/approve-loan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberId, loanIndex })
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert('Loan approved successfully!');
                closeLoanActionModal();
                loadLoanApplications();
            } else {
                alert('Error: ' + (result.error || 'Failed to approve loan'));
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error approving loan');
        }
    } else if (action === 'reject') {
        const reason = document.getElementById('rejectReason').value.trim();
        if (!reason) {
            alert('Please provide a reason for rejection');
            return;
        }
        
        if (!confirm('Reject this loan application?')) return;
        
        try {
            const response = await fetch('/api/membership/reject-loan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberId, loanIndex, reason })
            });
            const result = await response.json();
            if (result.success) {
                alert('Loan rejected.');
                closeLoanActionModal();
                loadLoanApplications();
                allFinancials = (await fetch('/api/membership/all-financials').then(r => r.json())).financials || allFinancials;
            } else {
                alert('Error: ' + (result.error || 'Failed to reject loan'));
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error rejecting loan');
        }
    }
}

// Close modals when clicking outside
window.onclick = function(event) {
    const modals = [
        document.getElementById('viewMemberModal'),
        document.getElementById('viewFinancialModal'),
        document.getElementById('viewPaymentMethodModal'),
        document.getElementById('loanActionModal')
    ];
    
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Logout
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.removeItem('admin');
        window.location.href = '/membership';
    }
}