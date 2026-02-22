// Check if admin is logged in
const isAdmin = sessionStorage.getItem('orderingAdmin');
if (!isAdmin) {
    window.location.href = '/ordering-system';
}

let adminProfile = {};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadAdminProfile();
    
    // Profile image upload
    document.getElementById('profileImageInput').addEventListener('change', handleImageUpload);
    
    // Profile info form
    document.getElementById('profileInfoForm').addEventListener('submit', handleProfileUpdate);
    
    // Security form
    document.getElementById('securityForm').addEventListener('submit', handleSecurityUpdate);
});

// Load admin profile
async function loadAdminProfile() {
    try {
        const response = await fetch('/api/ordering/admin/profile');
        const result = await response.json();
        
        if (result.success) {
            adminProfile = result.profile;
            displayProfile();
        } else {
            // Use default profile
            adminProfile = {
                fullName: 'Administrator',
                email: 'admin@climbs.com',
                phone: '',
                address: '',
                username: 'admin',
                profileImage: '',
                accountCreated: new Date().toISOString()
            };
            displayProfile();
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        // Use default profile
        adminProfile = {
            fullName: 'Administrator',
            email: 'admin@climbs.com',
            phone: '',
            address: '',
            username: 'admin',
            profileImage: ''
        };
        displayProfile();
    }
}

// Display profile
function displayProfile() {
    // Profile picture
    if (adminProfile.profileImage) {
        document.getElementById('profileImage').src = adminProfile.profileImage;
        document.getElementById('profileImage').style.display = 'block';
        document.getElementById('profileInitials').style.display = 'none';
    } else {
        const initials = adminProfile.fullName ? adminProfile.fullName.charAt(0).toUpperCase() : 'A';
        document.getElementById('profileInitials').textContent = initials;
        document.getElementById('profileImage').style.display = 'none';
        document.getElementById('profileInitials').style.display = 'flex';
    }
    
    // Basic information
    document.getElementById('fullName').value = adminProfile.fullName || '';
    document.getElementById('email').value = adminProfile.email || '';
    document.getElementById('phone').value = adminProfile.phone || '';
    document.getElementById('address').value = adminProfile.address || '';
    
    // Security
    document.getElementById('username').value = adminProfile.username || 'admin';
    
    // System info
    if (adminProfile.accountCreated) {
        document.getElementById('accountCreated').textContent = new Date(adminProfile.accountCreated).toLocaleDateString();
    }
    
    // Last login
    const now = new Date().toLocaleString();
    document.getElementById('lastLogin').textContent = now;
}

// Handle image upload
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
        alert('Image size must be less than 2MB');
        return;
    }
    
    // Read and display image
    const reader = new FileReader();
    reader.onload = function(e) {
        adminProfile.profileImage = e.target.result;
        document.getElementById('profileImage').src = e.target.result;
        document.getElementById('profileImage').style.display = 'block';
        document.getElementById('profileInitials').style.display = 'none';
        
        // Save to server
        saveProfileImage(e.target.result);
    };
    reader.readAsDataURL(file);
}

// Remove profile picture
function removeProfilePicture() {
    if (!confirm('Remove profile picture?')) return;
    
    adminProfile.profileImage = '';
    document.getElementById('profileImage').style.display = 'none';
    document.getElementById('profileInitials').style.display = 'flex';
    
    // Save to server
    saveProfileImage('');
}

// Save profile image
async function saveProfileImage(imageData) {
    try {
        const response = await fetch('/api/ordering/admin/update-profile-image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ profileImage: imageData })
        });
        
        const result = await response.json();
        if (result.success) {
            console.log('Profile image saved');
        } else {
            alert('Could not save photo: ' + (result.error || 'Please use a smaller image (under 2MB).'));
        }
    } catch (error) {
        console.error('Error saving image:', error);
        alert('Could not save photo. Try a smaller image (under 2MB).');
    }
}

// Handle profile update
async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const profileData = {
        fullName: document.getElementById('fullName').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        address: document.getElementById('address').value.trim()
    };
    
    try {
        const response = await fetch('/api/ordering/admin/update-profile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(profileData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Profile updated successfully!');
            adminProfile = { ...adminProfile, ...profileData };
            displayProfile();
        } else {
            alert('Error updating profile: ' + (result.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error updating profile');
    }
}

// Handle security update
async function handleSecurityUpdate(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const username = document.getElementById('username').value.trim();
    
    // Validate current password
    if (currentPassword !== 'admin123') {
        alert('Current password is incorrect');
        return;
    }
    
    // Validate new passwords match
    if (newPassword && newPassword !== confirmPassword) {
        alert('New passwords do not match');
        return;
    }
    
    // Validate password length
    if (newPassword && newPassword.length < 6) {
        alert('Password must be at least 6 characters');
        return;
    }
    
    const securityData = {
        username: username,
        currentPassword: currentPassword
    };
    
    if (newPassword) {
        securityData.newPassword = newPassword;
    }
    
    try {
        const response = await fetch('/api/ordering/admin/update-security', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(securityData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Security settings updated successfully!');
            document.getElementById('securityForm').reset();
            document.getElementById('username').value = username;
        } else {
            alert('Error updating security: ' + (result.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error updating security settings');
    }
}

// Logout
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.removeItem('orderingAdmin');
        window.location.href = '/ordering-system';
    }
}