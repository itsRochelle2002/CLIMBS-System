// Show member login modal
function showMemberLogin() {
    document.getElementById('memberLoginModal').style.display = 'block';
}

// Close member login modal
function closeMemberLogin() {
    document.getElementById('memberLoginModal').style.display = 'none';
}

// Show admin login modal
function showAdminLogin() {
    document.getElementById('adminLoginModal').style.display = 'block';
}

// Close admin login modal
function closeAdminLogin() {
    document.getElementById('adminLoginModal').style.display = 'none';
}

// Show register form
// Show register form
function showRegisterForm() {
    window.location.href = '/member-register';
}

// Member login form submission
document.getElementById('memberLoginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('memberEmail').value.trim();
    const password = document.getElementById('memberPassword').value;
    
    try {
        const response = await fetch('/api/membership/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Store member info
            sessionStorage.setItem('member', JSON.stringify(result.member));
            window.location.href = '/member-dashboard';
        } else {
            showError('memberLoginError', result.message || 'Invalid email or password');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('memberLoginError', 'Login failed. Please try again.');
    }
});

// Admin login form submission
document.getElementById('adminLoginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('adminUsername').value.trim();
    const password = document.getElementById('adminPassword').value;
    
    try {
        const response = await fetch('/api/membership/admin-login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Store admin info
            sessionStorage.setItem('admin', 'true');
            window.location.href = '/admin-dashboard';
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
    const memberModal = document.getElementById('memberLoginModal');
    const adminModal = document.getElementById('adminLoginModal');
    
    if (event.target === memberModal) {
        closeMemberLogin();
    }
    if (event.target === adminModal) {
        closeAdminLogin();
    }
}