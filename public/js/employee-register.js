document.getElementById('employeeRegisterForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const empId = document.getElementById('empId').value.trim();
    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validate passwords match
    if (password !== confirmPassword) {
        showError('Passwords do not match!');
        return;
    }
    
    // Validate password format (name@ID)
    const expectedFormat = `${fullName.split(' ')[0].toLowerCase()}@${empId}`;
    if (!password.toLowerCase().includes(empId.toLowerCase())) {
        showError(`Password should follow format: yourname@${empId}`);
        return;
    }
    
    const employeeData = {
        empId,
        name: fullName,
        email,
        password,
        walletBalance: 0,
        creditBalance: 0
    };
    
    try {
        const response = await fetch('/api/ordering/employee-register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(employeeData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Registration successful! You can now login with your credentials.');
            window.location.href = '/ordering-system';
        } else {
            showError(result.message || 'Registration failed. Please try again.');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Registration failed. Please try again.');
    }
});

function showError(message) {
    const errorDiv = document.getElementById('registerError');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}