/**
 * Member registration form (CESLA application) - submit to API and show in admin
 */
document.addEventListener('DOMContentLoaded', function() {
    // Generate application number on load
    const appNoInput = document.getElementById('applicationNo');
    if (appNoInput && !appNoInput.value) {
        appNoInput.value = 'APP-' + Date.now();
    }
    const applicationDateInput = document.getElementById('applicationDate');
    if (applicationDateInput && !applicationDateInput.value) {
        applicationDateInput.value = new Date().toISOString().slice(0, 10);
    }

    // Nationality "Others" show/hide
    const nationalityRadios = document.querySelectorAll('input[name="nationality"]');
    const nationalityOther = document.getElementById('nationalityOther');
    if (nationalityOther) {
        nationalityRadios.forEach(function(r) {
            r.addEventListener('change', function() {
                nationalityOther.style.display = this.value === 'Others' ? 'inline-block' : 'none';
            });
        });
    }

    document.getElementById('membershipForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        if (password !== confirmPassword) {
            alert('Password and Confirm Password do not match.');
            return;
        }
        if (password.length < 6) {
            alert('Password must be at least 6 characters.');
            return;
        }

        const title = document.querySelector('input[name="title"]:checked');
        const gender = document.querySelector('input[name="gender"]:checked');
        const nationality = document.querySelector('input[name="nationality"]:checked');
        const civilStatus = document.querySelector('input[name="civilStatus"]:checked');

        const formData = {
            // Application
            applicationDate: document.getElementById('applicationDate').value,
            applicationNo: document.getElementById('applicationNo').value,

            // Personal
            title: title ? title.value : '',
            lastName: document.getElementById('lastName').value.trim(),
            firstName: document.getElementById('firstName').value.trim(),
            middleName: document.getElementById('middleName').value.trim(),
            suffix: document.getElementById('suffix').value.trim(),
            birthdate: document.getElementById('birthdate').value,
            placeOfBirth: document.getElementById('placeOfBirth').value.trim(),
            gender: gender ? gender.value : '',
            nationality: nationality ? nationality.value : '',
            nationalityOther: document.getElementById('nationalityOther').value.trim(),
            religion: document.getElementById('religion').value.trim(),
            dependents: document.getElementById('dependents').value || 0,
            civilStatus: civilStatus ? civilStatus.value : '',
            sssNumber: document.getElementById('sssNumber').value.trim(),
            tinNumber: document.getElementById('tinNumber').value.trim(),
            otherIds: document.getElementById('otherIds').value.trim(),
            referredBy: document.getElementById('referredBy').value.trim(),
            referredContact: document.getElementById('referredContact').value.trim(),

            // Family
            family1: { name: document.getElementById('family1Name').value.trim(), relation: document.getElementById('family1Relation').value.trim(), age: document.getElementById('family1Age').value, occupation: document.getElementById('family1Occupation').value.trim() },
            family2: { name: document.getElementById('family2Name').value.trim(), relation: document.getElementById('family2Relation').value.trim(), age: document.getElementById('family2Age').value, occupation: document.getElementById('family2Occupation').value.trim() },
            family3: { name: document.getElementById('family3Name').value.trim(), relation: document.getElementById('family3Relation').value.trim(), age: document.getElementById('family3Age').value, occupation: document.getElementById('family3Occupation').value.trim() },
            family4: { name: document.getElementById('family4Name').value.trim(), relation: document.getElementById('family4Relation').value.trim(), age: document.getElementById('family4Age').value, occupation: document.getElementById('family4Occupation').value.trim() },

            // Contact
            presentAddress: document.getElementById('presentAddress').value.trim(),
            zipCode1: document.getElementById('zipCode1').value.trim(),
            stayYears: document.getElementById('stayYears').value || '',
            stayMonths: document.getElementById('stayMonths').value || '',
            permanentAddress: document.getElementById('permanentAddress').value.trim(),
            zipCode2: document.getElementById('zipCode2').value.trim(),

            // Employed
            employerName: document.getElementById('employerName').value.trim(),
            officeAddress: document.getElementById('officeAddress').value.trim(),
            businessNature: document.getElementById('businessNature').value.trim(),
            officeNo: document.getElementById('officeNo').value.trim(),
            faxNo: document.getElementById('faxNo').value.trim(),
            position: document.getElementById('position').value.trim(),
            monthlyIncome: document.getElementById('monthlyIncome').value || '',
            prevEmployer: document.getElementById('prevEmployer').value.trim(),
            prevYears: document.getElementById('prevYears').value.trim(),
            prevPosition: document.getElementById('prevPosition').value.trim(),

            // Self-employed
            businessName: document.getElementById('businessName').value.trim(),
            selfBusinessNature: document.getElementById('selfBusinessNature').value.trim(),
            assetSize: document.getElementById('assetSize').value || '',
            businessShare: document.getElementById('businessShare').value || '',
            selfMonthlyIncome: document.getElementById('selfMonthlyIncome').value || '',

            // Unemployed
            unemployedOther: document.getElementById('unemployedOther').value.trim(),

            // Login (required for API)
            email: document.getElementById('email').value.trim(),
            password: password
        };

        // Employment type checkboxes
        const empTypes = document.querySelectorAll('input[name="empType"]:checked');
        formData.employmentType = Array.from(empTypes).map(function(c) { return c.value; });

        const businessTypes = document.querySelectorAll('input[name="businessType"]:checked');
        formData.businessType = Array.from(businessTypes).map(function(c) { return c.value; });

        const unemployedTypes = document.querySelectorAll('input[name="unemployedType"]:checked');
        formData.unemployedType = Array.from(unemployedTypes).map(function(c) { return c.value; });

            // For admin list/detail
            formData.mobile = formData.referredContact || '';
            formData.address = formData.presentAddress || '';

        try {
            const response = await fetch('/api/membership/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                const successMsg = document.getElementById('successMessage');
                successMsg.innerHTML = '<strong>Application saved successfully!</strong><br>Member ID: #' + String(result.memberId).padStart(5, '0') + '<br>You can print this form. Admin can see this in Membership Admin.';
                successMsg.style.display = 'block';
                successMsg.scrollIntoView({ behavior: 'smooth' });
            } else {
                alert('Error: ' + (result.error || 'Could not save'));
            }
        } catch (err) {
            console.error(err);
            alert('Error saving application. Check connection and try again.');
        }
    });
});
