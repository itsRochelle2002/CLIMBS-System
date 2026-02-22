// Show employee login modal
function showEmployeeLogin() {
    document.getElementById('employeeLoginModal').style.display = 'block';
}

// Close employee login modal
function closeEmployeeLogin() {
    document.getElementById('employeeLoginModal').style.display = 'none';
}

// Show admin login modal
function showAdminLogin() {
    document.getElementById('adminLoginModal').style.display = 'block';
}

// Close admin login modal
function closeAdminLogin() {
    document.getElementById('adminLoginModal').style.display = 'none';
}

// Guest order (visitor)
function guestOrder() {
    window.location.href = '/visitor-ordering';
}
// Go to employee registration
function goToEmployeeRegister() {
    window.location.href = '/employee-register';
}
// Employee login form submission
document.getElementById('employeeLoginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const empId = document.getElementById('empId').value.trim();
    const password = document.getElementById('empPassword').value;
    
    try {
        const response = await fetch('/api/ordering/employee-login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ empId, password })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Store employee info
            sessionStorage.setItem('employee', JSON.stringify(result.employee));
            window.location.href = '/employee-ordering';
        } else {
            showError('empLoginError', result.message || 'Invalid employee ID or password');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('empLoginError', 'Login failed. Please try again.');
    }
});

// Admin login form submission
document.getElementById('adminLoginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('adminUsername').value.trim();
    const password = document.getElementById('adminPassword').value;
    
    try {
        const response = await fetch('/api/ordering/admin-login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Store admin info
            sessionStorage.setItem('orderingAdmin', 'true');
            window.location.href = '/admin-ordering';
        } else {
            showError('adminLoginError', result.message || 'Invalid username or password');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('adminLoginError', 'Login failed. Please try again.');
    }
});

// Show error message
function showError(elementId, message) {
    const errorDiv = document.getElementById(elementId);
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

// Close modals when clicking outside
window.onclick = function(event) {
    const empModal = document.getElementById('employeeLoginModal');
    const adminModal = document.getElementById('adminLoginModal');
    
    if (event.target === empModal) {
        closeEmployeeLogin();
    }
    if (event.target === adminModal) {
        closeAdminLogin();
    }
}