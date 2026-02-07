// Store account credentials
let accountCredentials = {};

// Step 1: Account Form Submission
document.getElementById('accountForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validate passwords match
    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }
    
    // Validate password length
    if (password.length < 6) {
        alert('Password must be at least 6 characters long!');
        return;
    }
    
    // Store credentials
    accountCredentials = {
        email: email,
        password: password
    };
    
    // Move to step 2
    document.getElementById('step1').style.display = 'none';
    document.getElementById('step2').style.display = 'block';
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Step 2: Membership Form Submission
document.getElementById('membershipForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Get form data
    const formData = {
        // Account credentials from step 1
        email: accountCredentials.email,
        password: accountCredentials.password,
        
        // Personal information
        lastName: document.getElementById('lastName').value.trim(),
        firstName: document.getElementById('firstName').value.trim(),
        middleName: document.getElementById('middleName').value.trim(),
        birthdate: document.getElementById('birthdate').value,
        gender: document.getElementById('gender').value,
        civilStatus: document.getElementById('civilStatus').value,
        
        // Contact information
        address: document.getElementById('address').value.trim(),
        mobile: document.getElementById('mobile').value.trim(),
        telephone: document.getElementById('telephone').value.trim(),
        
        // Beneficiary information
        beneficiaryName: document.getElementById('beneficiaryName').value.trim(),
        relationship: document.getElementById('relationship').value.trim(),
        beneficiaryContact: document.getElementById('beneficiaryContact').value.trim(),
        beneficiaryBirthdate: document.getElementById('beneficiaryBirthdate').value,
        
        // Share capital
        shareAmount: document.getElementById('shareAmount').value,
        paymentMode: document.getElementById('paymentMode').value,
        
        // Status
        status: 'pending'
    };
    
    console.log('Sending data:', formData);
    
    try {
        // Send data to server
        const response = await fetch('/api/membership/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Server response:', result);
        
        if (result.success) {
            // Show success message
            const successMsg = document.getElementById('successMessage');
            successMsg.innerHTML = `
                <p>✓ Membership application saved successfully!</p>
                <p><strong>Member ID:</strong> #${String(result.memberId).padStart(5, '0')}</p>
                <p><strong>Email:</strong> ${accountCredentials.email}</p>
                <p>You can now print this form or login with your credentials.</p>
            `;
            successMsg.style.display = 'block';
            
            // Scroll to success message
            successMsg.scrollIntoView({ behavior: 'smooth' });
            
            // Redirect to login after 5 seconds
            setTimeout(() => {
                if (confirm('Registration successful! Go to login page?')) {
                    window.location.href = '/membership';
                }
            }, 5000);
            
        } else {
            alert('Error: ' + (result.error || 'Unknown error occurred'));
        }
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error saving application: ' + error.message);
    }
});

// Go back to step 1
function goBackToStep1() {
    if (confirm('Are you sure? Your membership form data will be lost.')) {
        document.getElementById('step2').style.display = 'none';
        document.getElementById('step1').style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Print function
function printForm() {
    window.print();
}

// Mobile number formatting
document.getElementById('mobile').addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    e.target.value = value;
});

document.getElementById('beneficiaryContact').addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    e.target.value = value;
});

document.getElementById('telephone').addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 10) value = value.slice(0, 10);
    e.target.value = value;
});