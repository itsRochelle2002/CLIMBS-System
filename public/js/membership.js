// Handle form submission
document.getElementById('membershipForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Get password fields
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
    
    // Get form data
    const formData = {
        lastName: document.getElementById('lastName').value.trim(),
        firstName: document.getElementById('firstName').value.trim(),
        middleName: document.getElementById('middleName').value.trim(),
        birthdate: document.getElementById('birthdate').value,
        gender: document.getElementById('gender').value,
        civilStatus: document.getElementById('civilStatus').value,
        address: document.getElementById('address').value.trim(),
        mobile: document.getElementById('mobile').value.trim(),
        email: document.getElementById('email').value.trim(),
        password: password,
        beneficiaryName: document.getElementById('beneficiaryName').value.trim(),
        relationship: document.getElementById('relationship').value.trim(),
        beneficiaryContact: document.getElementById('beneficiaryContact').value.trim(),
        beneficiaryBirthdate: document.getElementById('beneficiaryBirthdate').value,
        shareAmount: document.getElementById('shareAmount').value,
        paymentMode: document.getElementById('paymentMode').value,
        status: 'pending' // Default status
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
        
        // Check if response is ok
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Server response:', result);
        
        if (result.success) {
            // Show success message
            const successMsg = document.getElementById('successMessage');
            successMsg.innerHTML = `<p>✓ Membership application saved successfully! Member ID: ${result.memberId}<br>You can now login with your email and password.</p>`;
            successMsg.style.display = 'block';
            
            // Scroll to success message
            successMsg.scrollIntoView({ behavior: 'smooth' });
            
            // Redirect to login after 3 seconds
            setTimeout(() => {
                window.location.href = '/membership';
            }, 3000);
            
        } else {
            alert('Error: ' + (result.error || 'Unknown error occurred'));
        }
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error saving application: ' + error.message);
    }
});

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