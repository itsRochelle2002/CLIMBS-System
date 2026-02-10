// Check if member is logged in
const memberStr = sessionStorage.getItem('member');
if (!memberStr) {
    window.location.href = '/membership';
}

const member = JSON.parse(memberStr);

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    displayMemberInfo();
    checkMemberStatus();
    loadFinancialData();
});

// Display member info in header
function displayMemberInfo() {
    const fullName = `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Member';
    document.getElementById('memberBadge').textContent = fullName;
}

// Check member verification status
function checkMemberStatus() {
    if (member.status === 'verified') {
        // Show verified content
        document.getElementById('verifiedContent').style.display = 'block';
        document.getElementById('pendingNotice').style.display = 'none';
    } else {
        // Show pending notice
        document.getElementById('verifiedContent').style.display = 'none';
        document.getElementById('pendingNotice').style.display = 'flex';
    }
}

// Load financial data
async function loadFinancialData() {
    if (member.status !== 'verified') return;
    
    try {
        const response = await fetch(`/api/membership/financial-data?memberId=${member.id}`);
        const result = await response.json();
        
        if (result.success) {
            displayFinancialSummary(result.data);
            displayShareCapitalHistory(result.data.shareCapital);
            displaySavingsHistory(result.data.savings);
            displayLoanHistory(result.data.loans);
            displayMemberSince();
        }
    } catch (error) {
        console.error('Error loading financial data:', error);
        // Use default values if API fails
        displayDefaultValues();
    }
}

// Display default values
function displayDefaultValues() {
    document.getElementById('shareCapitalAmount').textContent = '₱0.00';
    document.getElementById('savingsAmount').textContent = '₱0.00';
    document.getElementById('currentLoanAmount').textContent = '₱0.00';
    document.getElementById('shareCapitalBalance').textContent = '₱0.00';
    document.getElementById('numberOfShares').textContent = '0';
    document.getElementById('savingsBalance').textContent = '₱0.00';
    document.getElementById('availableBalance').textContent = '₱0.00';
    document.getElementById('loanBalance').textContent = '₱0.00';
    document.getElementById('monthlyPayment').textContent = '₱0.00';
    document.getElementById('loanStatus').textContent = 'No Active Loan';
}

// Display financial summary
function displayFinancialSummary(data) {
    const shareCapital = data.shareCapital || { total: 0, shares: 0 };
    const savings = data.savings || { balance: 0 };
    const loans = data.loans || { currentBalance: 0 };
    
    document.getElementById('shareCapitalAmount').textContent = `₱${shareCapital.total.toFixed(2)}`;
    document.getElementById('savingsAmount').textContent = `₱${savings.balance.toFixed(2)}`;
    document.getElementById('currentLoanAmount').textContent = `₱${loans.currentBalance.toFixed(2)}`;
}

// Display member since
function displayMemberSince() {
    const memberSince = new Date(member.registrationDate || member.verifiedDate);
    const options = { year: 'numeric', month: 'long' };
    document.getElementById('memberSince').textContent = memberSince.toLocaleDateString('en-US', options);
}

// Display share capital history
function displayShareCapitalHistory(shareData) {
    const history = shareData?.history || [];
    const total = shareData?.total || 0;
    const shares = shareData?.shares || 0;
    
    document.getElementById('shareCapitalBalance').textContent = `₱${total.toFixed(2)}`;
    document.getElementById('numberOfShares').textContent = shares;
    
    const historyDiv = document.getElementById('shareCapitalHistory');
    
    if (history.length === 0) {
        historyDiv.innerHTML = '<p class="no-transactions">No share capital transactions yet</p>';
        return;
    }
    
    historyDiv.innerHTML = '';
    history.forEach(transaction => {
        const transactionDiv = document.createElement('div');
        transactionDiv.className = 'transaction-item';
        transactionDiv.innerHTML = `
            <div class="transaction-info">
                <div class="transaction-type">Share Purchase - ${transaction.paymentMethod}</div>
                <div class="transaction-date">${new Date(transaction.date).toLocaleString()}</div>
            </div>
            <div class="transaction-amount positive">+₱${transaction.amount.toFixed(2)}</div>
        `;
        historyDiv.appendChild(transactionDiv);
    });
}

// Display savings history
function displaySavingsHistory(savingsData) {
    const history = savingsData?.history || [];
    const balance = savingsData?.balance || 0;
    
    document.getElementById('savingsBalance').textContent = `₱${balance.toFixed(2)}`;
    document.getElementById('availableBalance').textContent = `₱${balance.toFixed(2)}`;
    
    const historyDiv = document.getElementById('savingsHistory');
    
    if (history.length === 0) {
        historyDiv.innerHTML = '<p class="no-transactions">No savings transactions yet</p>';
        return;
    }
    
    historyDiv.innerHTML = '';
    history.forEach(transaction => {
        const transactionDiv = document.createElement('div');
        transactionDiv.className = 'transaction-item';
        const isDeposit = transaction.type === 'deposit';
        const amountClass = isDeposit ? 'positive' : 'negative';
        const amountSign = isDeposit ? '+' : '-';
        
        transactionDiv.innerHTML = `
            <div class="transaction-info">
                <div class="transaction-type">${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)} - ${transaction.paymentMethod || transaction.reason || ''}</div>
                <div class="transaction-date">${new Date(transaction.date).toLocaleString()}</div>
            </div>
            <div class="transaction-amount ${amountClass}">${amountSign}₱${transaction.amount.toFixed(2)}</div>
        `;
        historyDiv.appendChild(transactionDiv);
    });
}

// Display loan history
function displayLoanHistory(loansData) {
    const currentLoan = loansData?.currentLoan || null;
    const history = loansData?.history || [];
    
    if (currentLoan) {
        document.getElementById('loanBalance').textContent = `₱${currentLoan.balance.toFixed(2)}`;
        document.getElementById('monthlyPayment').textContent = `₱${currentLoan.monthlyPayment.toFixed(2)}`;
        document.getElementById('loanStatus').textContent = currentLoan.status || 'Active';
    } else {
        document.getElementById('loanBalance').textContent = '₱0.00';
        document.getElementById('monthlyPayment').textContent = '₱0.00';
        document.getElementById('loanStatus').textContent = 'No Active Loan';
    }
    
    const historyDiv = document.getElementById('loanHistory');
    
    if (history.length === 0) {
        historyDiv.innerHTML = '<p class="no-transactions">No loan applications yet</p>';
        return;
    }
    
    historyDiv.innerHTML = '';
    history.forEach(loan => {
        const loanDiv = document.createElement('div');
        loanDiv.className = 'transaction-item';
        
        let statusBadge = '';
        if (loan.status === 'approved') statusBadge = '<span style="background: #28a745; color: white; padding: 5px 15px; border-radius: 15px; font-size: 0.85em;">Approved</span>';
        else if (loan.status === 'pending') statusBadge = '<span style="background: #ffc107; color: white; padding: 5px 15px; border-radius: 15px; font-size: 0.85em;">Pending</span>';
        else if (loan.status === 'rejected') statusBadge = '<span style="background: #dc3545; color: white; padding: 5px 15px; border-radius: 15px; font-size: 0.85em;">Rejected</span>';
        else if (loan.status === 'completed') statusBadge = '<span style="background: #6c757d; color: white; padding: 5px 15px; border-radius: 15px; font-size: 0.85em;">Completed</span>';
        
        loanDiv.innerHTML = `
            <div class="transaction-info">
                <div class="transaction-type">${loan.loanType} - ${loan.purpose}</div>
                <div class="transaction-date">${new Date(loan.applicationDate).toLocaleDateString()} • ${loan.term} months • ${statusBadge}</div>
            </div>
            <div class="transaction-amount">₱${loan.amount.toFixed(2)}</div>
        `;
        historyDiv.appendChild(loanDiv);
    });
}

// Show section
function showSection(section) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.style.display = 'none';
    });
    
    // Show selected section
    if (section === 'shareCapital') {
        document.getElementById('shareCapitalSection').style.display = 'block';
    } else if (section === 'savings') {
        document.getElementById('savingsSection').style.display = 'block';
    } else if (section === 'loans') {
        document.getElementById('loansSection').style.display = 'block';
    }
}

// Modal functions - Add Share
function showAddShareModal() {
    document.getElementById('addShareModal').style.display = 'block';
}

function closeAddShareModal() {
    document.getElementById('addShareModal').style.display = 'none';
    document.getElementById('addShareForm').reset();
}

document.getElementById('addShareForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const amount = parseFloat(document.getElementById('shareAmount').value);
    const paymentMethod = document.getElementById('sharePaymentMethod').value;
    
    const shareData = {
        memberId: member.id,
        amount: amount,
        paymentMethod: paymentMethod,
        date: new Date().toISOString()
    };
    
    try {
        const response = await fetch('/api/membership/add-share', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(shareData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Share capital added successfully!');
            closeAddShareModal();
            loadFinancialData();
        } else {
            alert('Error: ' + (result.error || 'Failed to add share capital'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error adding share capital');
    }
});

// Modal functions - Deposit
function showDepositModal() {
    document.getElementById('depositModal').style.display = 'block';
}

function closeDepositModal() {
    document.getElementById('depositModal').style.display = 'none';
    document.getElementById('depositForm').reset();
}

document.getElementById('depositForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const amount = parseFloat(document.getElementById('depositAmount').value);
    const paymentMethod = document.getElementById('depositPaymentMethod').value;
    
    const depositData = {
        memberId: member.id,
        amount: amount,
        paymentMethod: paymentMethod,
        type: 'deposit',
        date: new Date().toISOString()
    };
    
    try {
        const response = await fetch('/api/membership/savings-transaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(depositData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Deposit successful!');
            closeDepositModal();
            loadFinancialData();
        } else {
            alert('Error: ' + (result.error || 'Failed to deposit'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error processing deposit');
    }
});

// Modal functions - Withdraw
function showWithdrawModal() {
    document.getElementById('withdrawModal').style.display = 'block';
}

function closeWithdrawModal() {
    document.getElementById('withdrawModal').style.display = 'none';
    document.getElementById('withdrawForm').reset();
}

document.getElementById('withdrawForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const amount = parseFloat(document.getElementById('withdrawAmount').value);
    const reason = document.getElementById('withdrawReason').value;
    
    const withdrawData = {
        memberId: member.id,
        amount: amount,
        reason: reason,
        type: 'withdrawal',
        date: new Date().toISOString()
    };
    
    try {
        const response = await fetch('/api/membership/savings-transaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(withdrawData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Withdrawal request submitted! Pending approval.');
            closeWithdrawModal();
            loadFinancialData();
        } else {
            alert('Error: ' + (result.error || 'Failed to withdraw'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error processing withdrawal');
    }
});

// Modal functions - Loan Application
function showLoanApplicationModal() {
    document.getElementById('loanApplicationModal').style.display = 'block';
}

function closeLoanApplicationModal() {
    document.getElementById('loanApplicationModal').style.display = 'none';
    document.getElementById('loanApplicationForm').reset();
}

document.getElementById('loanApplicationForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const loanData = {
        memberId: member.id,
        loanType: document.getElementById('loanType').value,
        amount: parseFloat(document.getElementById('loanAmount').value),
        term: parseInt(document.getElementById('loanTerm').value),
        purpose: document.getElementById('loanPurpose').value,
        notes: document.getElementById('loanNotes').value,
        applicationDate: new Date().toISOString(),
        status: 'pending'
    };
    
    try {
        const response = await fetch('/api/membership/loan-application', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loanData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Loan application submitted successfully! Pending approval.');
            closeLoanApplicationModal();
            loadFinancialData();
        } else {
            alert('Error: ' + (result.error || 'Failed to submit loan application'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error submitting loan application');
    }
});

// Close modals when clicking outside
window.onclick = function(event) {
    const modals = [
        document.getElementById('addShareModal'),
        document.getElementById('depositModal'),
        document.getElementById('withdrawModal'),
        document.getElementById('loanApplicationModal')
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
        sessionStorage.removeItem('member');
        window.location.href = '/membership';
    }
}