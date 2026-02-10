/* General Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    margin: 0;
    padding: 20px;
    font-family: Arial, Helvetica, sans-serif;
    background: #f0f0f0;
    font-size: 12pt;
}

.container {
    max-width: 210mm;
    margin: 0 auto;
}

/* Top Action Buttons */
.form-actions-top {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
}

.btn-back,
.btn-print {
    padding: 12px 25px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    font-size: 1em;
    text-decoration: none;
    transition: all 0.3s;
}

.btn-back {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.btn-print {
    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
    color: white;
}

/* Application Form Container */
.application-form {
    background: white;
    box-shadow: 0 5px 20px rgba(0,0,0,0.1);
}

.page {
    width: 210mm;
    min-height: 297mm;
    padding: 20mm;
    background: white;
    position: relative;
}

/* Form Header */
.form-header {
    display: grid;
    grid-template-columns: 80px 1fr 100px;
    gap: 15px;
    align-items: start;
    margin-bottom: 15px;
    padding-bottom: 15px;
    border-bottom: 3px solid #000;
}

.logo-container {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding-top: 5px;
}

.logo-circle {
    width: 80px;
    height: 80px;
    border: 4px solid #0066cc;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #0066cc;
}

.logo-text {
    color: white;
    font-weight: 900;
    font-size: 18pt;
    text-align: center;
    letter-spacing: 1px;
}

.header-info {
    text-align: center;
    padding-top: 5px;
}

.header-info h1 {
    margin: 0 0 5px 0;
    font-size: 18pt;
    font-weight: 700;
    color: #000;
}

.header-info p {
    margin: 3px 0;
    font-size: 10pt;
    color: #000;
    line-height: 1.3;
}

.photo-box {
    width: 100px;
    height: 120px;
    border: 2px solid #000;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10pt;
    color: #666;
    background: #fafafa;
}

/* Form Title */
.form-title {
    text-align: center;
    font-size: 24pt;
    font-weight: 900;
    margin: 15px 0;
    padding: 10px 0;
    color: #000;
    border-bottom: 3px solid #000;
    border-top: 3px solid #000;
}

/* Section Titles */
.section-title {
    background: #000;
    color: white;
    padding: 8px 15px;
    font-weight: 700;
    font-size: 11pt;
    margin: 20px 0 15px 0;
    text-align: center;
    text-transform: uppercase;
}

/* Form Structure */
form {
    width: 100%;
}

.form-row {
    display: flex;
    gap: 10px;
    margin-bottom: 12px;
    width: 100%;
}

.form-field {
    flex: 1;
    min-width: 0;
}

.form-field.half {
    flex: 1;
}

.form-field.third {
    flex: 1;
}

.form-field.small {
    flex: 0.5;
    min-width: 80px;
}

.form-field label {
    display: block;
    font-weight: 600;
    font-size: 9pt;
    margin-bottom: 3px;
    color: #000;
}

.form-field input,
.form-field select,
.form-field textarea {
    width: 100%;
    padding: 4px 6px;
    border: none;
    border-bottom: 1px solid #000;
    font-size: 10pt;
    font-family: Arial, sans-serif;
    background: transparent;
}

.form-field input:focus,
.form-field select:focus,
.form-field textarea:focus {
    outline: none;
    border-bottom: 2px solid #000;
    background: #fffacd;
}

.form-field input[readonly] {
    background: #f0f0f0;
    color: #666;
}

/* Checkbox Groups */
.checkbox-group {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
    margin-top: 5px;
}

.checkbox-label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 10pt;
    cursor: pointer;
    white-space: nowrap;
}

.checkbox-label input[type="radio"],
.checkbox-label input[type="checkbox"] {
    width: auto;
    margin: 0;
    cursor: pointer;
}

/* Family Table */
.family-table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
}

.family-table th,
.family-table td {
    border: 1px solid #000;
    padding: 6px;
    text-align: left;
}

.family-table th {
    background: #f0f0f0;
    font-weight: 700;
    font-size: 9pt;
}

.family-table input {
    width: 100%;
    border: none;
    padding: 4px;
    font-size: 9pt;
    background: transparent;
}

.family-table input:focus {
    outline: none;
    background: #fffacd;
}

/* Employment Grid */
.employment-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    border: 2px solid #000;
    margin: 15px 0;
}

.employment-section {
    border-right: 1px solid #000;
    padding: 12px;
}

.employment-section:last-child {
    border-right: none;
}

.employment-section h4 {
    background: #000;
    color: white;
    padding: 6px;
    margin: -12px -12px 12px -12px;
    font-size: 10pt;
    text-align: center;
    font-weight: 700;
}

.employment-section .form-field {
    margin-bottom: 10px;
}

.employment-section label {
    font-size: 8pt;
}

.employment-section input {
    font-size: 9pt;
    padding: 3px;
}

/* Declaration Box */
.declaration {
    margin: 20px 0;
    padding: 12px;
    border: 2px solid #000;
    font-size: 9pt;
    line-height: 1.5;
    text-align: justify;
}

/* Signature Section */
.signature-section {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 15px;
    margin: 25px 0;
}

.signature-box {
    text-align: center;
}

.signature-line {
    border-bottom: 2px solid #000;
    height: 50px;
    margin-bottom: 8px;
}

.signature-box label {
    font-size: 8pt;
    font-weight: 600;
    display: block;
    line-height: 1.3;
}

/* Form Actions */
.form-actions {
    display: flex;
    gap: 15px;
    justify-content: center;
    margin-top: 30px;
    padding-top: 20px;
    border-top: 2px solid #ddd;
}

.btn {
    padding: 14px 35px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 700;
    font-size: 1em;
    transition: all 0.3s;
}

.btn-submit {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.btn-submit:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 25px rgba(102, 126, 234, 0.6);
}

/* Success Message */
.success-message {
    background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
    color: #155724;
    padding: 20px;
    border-radius: 10px;
    margin-top: 20px;
    text-align: center;
    border-left: 5px solid #28a745;
    font-weight: 600;
}

.success-message h3 {
    margin: 0 0 10px 0;
    font-size: 1.3em;
}

.success-message p {
    margin: 5px 0;
}

/* Page Break */
.page-break {
    page-break-before: always;
    margin: 30px 0;
    padding-top: 20px;
}

/* Print Styles */
@media print {
    @page {
        size: A4;
        margin: 0;
    }
    
    body {
        background: white;
        padding: 0;
        margin: 0;
    }
    
    .container {
        max-width: 100%;
        margin: 0;
    }
    
    .no-print {
        display: none !important;
    }
    
    .application-form {
        box-shadow: none;
        padding: 0;
    }
    
    .page {
        width: 210mm;
        height: 297mm;
        padding: 15mm;
        page-break-after: always;
        box-shadow: none;
    }
    
    .page-break {
        page-break-before: always;
        margin: 0;
        padding: 0;
        border: none;
        height: 0;
    }
    
    .form-header {
        border-bottom: 3px solid #000 !important;
    }
    
    .form-title {
        border-top: 3px solid #000 !important;
        border-bottom: 3px solid #000 !important;
    }
    
    .section-title {
        background: #000 !important;
        color: white !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }
    
    .employment-section h4 {
        background: #000 !important;
        color: white !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }
    
    .logo-circle {
        border: 4px solid #0066cc !important;
        background: #0066cc !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }
    
    .logo-text {
        color: white !important;
    }
    
    .photo-box {
        border: 2px solid #000 !important;
        background: #fafafa !important;
    }
    
    .family-table th,
    .family-table td {
        border: 1px solid #000 !important;
    }
    
    .family-table th {
        background: #f0f0f0 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }
    
    .employment-grid {
        border: 2px solid #000 !important;
    }
    
    .employment-section {
        border-right: 1px solid #000 !important;
    }
    
    .declaration {
        border: 2px solid #000 !important;
    }
    
    .signature-line {
        border-bottom: 2px solid #000 !important;
    }
    
    body, p, div, span, label, input, select, textarea {
        color: #000 !important;
    }
    
    input, select, textarea {
        border: none !important;
        border-bottom: 1px solid #000 !important;
        background: transparent !important;
    }
}

/* Responsive Design */
@media (max-width: 768px) {
    .page {
        padding: 15px;
        min-height: auto;
    }
    
    .form-header {
        grid-template-columns: 1fr;
        text-align: center;
    }
    
    .logo-container {
        justify-content: center;
    }
    
    .photo-box {
        margin: 0 auto;
    }
    
    .employment-grid {
        grid-template-columns: 1fr;
    }
    
    .employment-section {
        border-right: none;
        border-bottom: 1px solid #000;
    }
    
    .employment-section:last-child {
        border-bottom: none;
    }
    
    .signature-section {
        grid-template-columns: 1fr;
    }
    
    .form-row {
        flex-direction: column;
    }
}