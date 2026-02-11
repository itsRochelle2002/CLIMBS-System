// Check if member is logged in
const memberStr = sessionStorage.getItem('member');
if (!memberStr) {
    window.location.href = '/membership';
}

const member = JSON.parse(memberStr);
let paymentMethods = [];

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    displayMemberInfo();
    checkMemberStatus();
    loadFinancialData();
    loadPaymentMethods();
    
    // Setup payment method form listeners
    setupPaymentMethodForms();
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

// Load payment methods
async function loadPaymentMethods() {
    if (member.status !== 'verified') return;
    
    try {
        const response = await fetch(`/api/membership/payment-methods?memberId=${member.id}`);
        const result = await response.json();
        
        if (result.success) {
            paymentMethods = result.methods || [];
            displayPaymentMethods();
            checkPaymentMethodsSetup();
        }
    } catch (error) {
        console.error('Error loading payment methods:', error);
        paymentMethods = [];
        checkPaymentMethodsSetup();
    }
}

// Display payment methods
function displayPaymentMethods() {
    const methodsList = document.getElementById('paymentMethodsList');
    
    if (paymentMethods.length === 0) {
        methodsList.innerHTML = `
            <div class="no-payment-methods">
                <div class="no-payment-methods-icon">💳</div>
                <p>No payment methods added yet</p>
            </div>
        `;
        return;
    }
    
    methodsList.innerHTML = '';
    paymentMethods.forEach(method => {
        const methodCard = document.createElement('div');
        methodCard.className = `payment-method-card ${method.status}`;
        
        const statusBadge = method.status === 'verified' ? '✅ Verified' : 
                           method.status === 'pending' ? '⏳ Pending' : 
                           '❌ Rejected';
        
        let methodDetails = '';
        if (method.type === 'ewallet') {
            methodDetails = `
                <div class="method-detail-item"><strong>Provider:</strong> ${method.provider}</div>
                <div class="method-detail-item"><strong>Mobile:</strong> ${method.mobile}</div>
                <div class="method-detail-item"><strong>Name:</strong> ${method.accountName}</div>
            `;
        } else if (method.type === 'bank') {
            methodDetails = `
                <div class="method-detail-item"><strong>Bank:</strong> ${method.bankName}</div>
                <div class="method-detail-item"><strong>Account:</strong> ${method.accountNumber}</div>
                <div class="method-detail-item"><strong>Name:</strong> ${method.accountName}</div>
            `;
        }
        
        methodCard.innerHTML = `
            <div class="method-header">
                <div class="method-type">
                    ${method.type === 'ewallet' ? '📱' : '🏦'} 
                    ${method.type === 'ewallet' ? 'E-Wallet' : 'Bank Account'}
                </div>
                <div class="method-status ${method.status}">${statusBadge}</div>
            </div>
            <div class="method-details">
                ${methodDetails}
            </div>
        `;
        
        methodsList.appendChild(methodCard);
    });
}

// Check if payment methods are setup
function checkPaymentMethodsSetup() {
    const hasVerifiedMethod = paymentMethods.some(m => m.status === 'verified');
    
    if (hasVerifiedMethod) {
        document.getElementById('paymentMethodsSetup').style.display = 'none';
        document.getElementById('paymentMethodsDisplay').style.display = 'block';
    } else {
        document.getElementById('paymentMethodsSetup').style.display = 'block';
        document.getElementById('paymentMethodsDisplay').style.display = 'none';
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
    document.getElementById('withdrawAvailableBalance').textContent = '₱0.00';
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
    document.getElementById('withdrawAvailableBalance').textContent = `₱${balance.toFixed(2)}`;
    
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
        
        let statusBadge = '';
        if (transaction.status === 'pending') {
            statusBadge = ' <span class="status-badge status-pending">Pending</span>';
        } else if (transaction.status === 'approved') {
            statusBadge = ' <span class="status-badge status-verified">Approved</span>';
        } else if (transaction.status === 'rejected') {
            statusBadge = ' <span class="status-badge status-rejected">Rejected</span>';
        }
        
        transactionDiv.innerHTML = `
            <div class="transaction-info">
                <div class="transaction-type">${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)} - ${transaction.paymentMethodUsed || transaction.reason || ''}${statusBadge}</div>
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
    } else if (section === 'overview') {
        document.getElementById('overviewSection').style.display = 'block';
    }
}

// Setup payment method forms
function setupPaymentMethodForms() {
    // E-wallet form
    document.getElementById('ewalletSetupForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const proofFile = document.getElementById('ewalletProof').files[0];
        if (!proofFile) {
            alert('Please upload proof of e-wallet account');
            return;
        }
        
        // Convert file to base64
        const proofBase64 = await fileToBase64(proofFile);
        
        const methodData = {
            memberId: member.id,
            type: 'ewallet',
            provider: document.getElementById('ewalletProvider').value,
            mobile: document.getElementById('ewalletMobile').value,
            accountName: document.getElementById('ewalletName').value,
            proof: proofBase64,
            status: 'pending',
            dateAdded: new Date().toISOString()
        };
        
        try {
            const response = await fetch('/api/membership/payment-methods', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(methodData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert('E-wallet added! Pending admin verification.');
                closePaymentSetupModal();
                loadPaymentMethods();
            } else {
                alert('Error: ' + (result.error || 'Failed to add payment method'));
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error adding payment method');
        }
    });
    
    // Bank form
    document.getElementById('bankSetupForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const proofFile = document.getElementById('bankProof').files[0];
        if (!proofFile) {
            alert('Please upload bank proof');
            return;
        }
        
        const proofBase64 = await fileToBase64(proofFile);
        
        const methodData = {
            memberId: member.id,
            type: 'bank',
            bankName: document.getElementById('bankName').value,
            accountNumber: document.getElementById('bankAccountNumber').value,
            accountName: document.getElementById('bankAccountName').value,
            proof: proofBase64,
            status: 'pending',
            dateAdded: new Date().toISOString()
        };
        
        try {
            const response = await fetch('/api/membership/payment-methods', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(methodData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert('Bank account added! Pending admin verification.');
                closePaymentSetupModal();
                loadPaymentMethods();
            } else {
                alert('Error: ' + (result.error || 'Failed to add payment method'));
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error adding payment method');
        }
    });
}

// File to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Switch payment method tab
function switchMethodTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.method-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Show/hide forms
    if (tab === 'ewallet') {
        document.getElementById('ewalletSetupForm').style.display = 'block';
        document.getElementById('bankSetupForm').style.display = 'none';
    } else {
        document.getElementById('ewalletSetupForm').style.display = 'none';
        document.getElementById('bankSetupForm').style.display = 'block';
    }
}

// Payment setup modal
function showPaymentSetupModal() {
    document.getElementById('paymentSetupModal').style.display = 'block';
}

function closePaymentSetupModal() {
    document.getElementById('paymentSetupModal').style.display = 'none';
    document.getElementById('ewalletSetupForm').reset();
    document.getElementById('bankSetupForm').reset();
}

// Deposit modal
function showDepositModal() {
    // Check if has verified payment method
    const verifiedMethods = paymentMethods.filter(m => m.status === 'verified');
    
    if (verifiedMethods.length === 0) {
        alert('Please add and verify a payment method first!');
        showPaymentSetupModal();
        return;
    }
    
    // Populate payment method dropdown
    const select = document.getElementById('depositPaymentMethod');
    select.innerHTML = '<option value="">Select your verified payment method</option>';
    
    verifiedMethods.forEach((method, index) => {
        const option = document.createElement('option');
        option.value = index;
        if (method.type === 'ewallet') {
            option.textContent = `${method.provider} - ${method.mobile}`;
        } else {
            option.textContent = `${method.bankName} - ${method.accountNumber}`;
        }
        select.appendChild(option);
    });
    
    document.getElementById('depositModal').style.display = 'block';
}

function closeDepositModal() {
    document.getElementById('depositModal').style.display = 'none';
    document.getElementById('depositForm').reset();
}

// Deposit form submission
document.getElementById('depositForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const methodIndex = document.getElementById('depositPaymentMethod').value;
    const amount = parseFloat(document.getElementById('depositAmount').value);
    const reference = document.getElementById('depositReference').value;
    const proofFile = document.getElementById('depositProof').files[0];
    
    if (!proofFile) {
        alert('Please upload proof of payment');
        return;
    }
    
    const proofBase64 = await fileToBase64(proofFile);
    const verifiedMethods = paymentMethods.filter(m => m.status === 'verified');
    const selectedMethod = verifiedMethods[methodIndex];
    
    const depositData = {
        memberId: member.id,
        amount: amount,
        paymentMethodUsed: selectedMethod.type === 'ewallet' ? 
            `${selectedMethod.provider} - ${selectedMethod.mobile}` : 
            `${selectedMethod.bankName} - ${selectedMethod.accountNumber}`,
        reference: reference,
        proof: proofBase64,
        type: 'deposit',
        status: 'pending',
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
            alert('Deposit request submitted! Pending admin verification.');
            closeDepositModal();
            loadFinancialData();
        } else {
            alert('Error: ' + (result.error || 'Failed to submit deposit'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error submitting deposit');
    }
});

// Withdraw modal
function showWithdrawModal() {
    const verifiedMethods = paymentMethods.filter(m => m.status === 'verified');
    
    if (verifiedMethods.length === 0) {
        alert('Please add and verify a payment method first!');
        showPaymentSetupModal();
        return;
    }
    
    // Populate payment method dropdown
    const select = document.getElementById('withdrawPaymentMethod');
    select.innerHTML = '<option value="">Select destination account</option>';
    
    verifiedMethods.forEach((method, index) => {
        const option = document.createElement('option');
        option.value = index;
        if (method.type === 'ewallet') {
            option.textContent = `${method.provider} - ${method.mobile}`;
        } else {
            option.textContent = `${method.bankName} - ${method.accountNumber}`;
        }
        select.appendChild(option);
    });
    
    // Show destination on change
    select.addEventListener('change', function() {
        const destDiv = document.getElementById('withdrawDestination');
        if (this.value !== '') {
            const method = verifiedMethods[this.value];
            let details = '';
            
            if (method.type === 'ewallet') {
                details = `
                    <h5>Withdrawal will be sent to:</h5>
                    <p><strong>${method.provider}</strong></p>
                    <p>${method.mobile}</p>
                    <p>${method.accountName}</p>
                `;
            } else {
                details = `
                    <h5>Withdrawal will be sent to:</h5>
                    <p><strong>${method.bankName}</strong></p>
                    <p>${method.accountNumber}</p>
                    <p>${method.accountName}</p>
                `;
            }
            
            destDiv.innerHTML = details;
            destDiv.style.display = 'block';
        } else {
            destDiv.style.display = 'none';
        }
    });
    
    document.getElementById('withdrawModal').style.display = 'block';
}

function closeWithdrawModal() {
    document.getElementById('withdrawModal').style.display = 'none';
    document.getElementById('withdrawForm').reset();
    document.getElementById('withdrawDestination').style.display = 'none';
}

// Withdraw form submission
document.getElementById('withdrawForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const methodIndex = document.getElementById('withdrawPaymentMethod').value;
    const amount = parseFloat(document.getElementById('withdrawAmount').value);
    const reason = document.getElementById('withdrawReason').value;
    
    const verifiedMethods = paymentMethods.filter(m => m.status === 'verified');
    const selectedMethod = verifiedMethods[methodIndex];
    
    const withdrawData = {
        memberId: member.id,
        amount: amount,
        paymentMethodUsed: selectedMethod.type === 'ewallet' ? 
            `${selectedMethod.provider} - ${selectedMethod.mobile}` : 
            `${selectedMethod.bankName} - ${selectedMethod.accountNumber}`,
        reason: reason,
        type: 'withdrawal',
        status: 'pending',
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
            alert('Withdrawal request submitted! Pending admin approval.');
            closeWithdrawModal();
            loadFinancialData();
        } else {
            alert('Error: ' + (result.error || 'Failed to submit withdrawal'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error submitting withdrawal');
    }
});

// Add Share modal
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

// Loan Application modal
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
        document.getElementById('paymentSetupModal'),
        document.getElementById('depositModal'),
        document.getElementById('withdrawModal'),
        document.getElementById('addShareModal'),
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