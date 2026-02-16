require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const os = require('os');
const dataStore = require('./lib/dataStore');

const app = express();
const PORT = process.env.PORT || 3000;

// Persistent data directory (relative to this file so data never resets when run from different cwd)
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// PayMongo webhook must receive raw body for signature verification - register BEFORE json parser
app.post('/api/webhooks/paymongo', express.raw({ type: 'application/json' }), paymongoWebhookHandler);

// Middleware (higher limit for profile image base64)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Initialize menu file with default items (only if file does not exist - never overwrite existing data)
function initializeMenu() {
    const menuFile = path.join(DATA_DIR, 'menu.json');
    if (!fs.existsSync(menuFile)) {
        const defaultMenu = [
            { id: 1, name: 'Chicken Adobo', price: 85, category: 'meals', emoji: '🍗', stock: 50, minStock: 10, available: true },
            { id: 2, name: 'Pork Sinigang', price: 90, category: 'meals', emoji: '🍲', stock: 40, minStock: 10, available: true },
            { id: 3, name: 'Beef Tapa', price: 95, category: 'meals', emoji: '🥩', stock: 35, minStock: 10, available: true },
            { id: 4, name: 'Iced Coffee', price: 45, category: 'drinks', emoji: '☕', stock: 100, minStock: 20, available: true },
            { id: 5, name: 'Fresh Juice', price: 40, category: 'drinks', emoji: '🧃', stock: 80, minStock: 15, available: true },
            { id: 6, name: 'Lumpia', price: 35, category: 'snacks', emoji: '🥟', stock: 60, minStock: 15, available: true }
        ];
        fs.writeFileSync(menuFile, JSON.stringify(defaultMenu, null, 2));
    }
}

// Initialize employees (only if file does not exist)
function initializeEmployees() {
    const empFile = path.join(DATA_DIR, 'employees.json');
    if (!fs.existsSync(empFile)) {
        const defaultEmployees = [
            { empId: 'EMP001', name: 'Juan Dela Cruz', password: 'emp123', walletBalance: 500, creditBalance: 0 },
            { empId: 'EMP002', name: 'Maria Santos', password: 'emp123', walletBalance: 300, creditBalance: 0 },
            { empId: 'EMP003', name: 'Pedro Garcia', password: 'emp123', walletBalance: 450, creditBalance: 0 }
        ];
        fs.writeFileSync(empFile, JSON.stringify(defaultEmployees, null, 2));
    }
}

// Initialize ordering orders (only if file does not exist)
function initializeOrderingOrders() {
    const ordersFile = path.join(DATA_DIR, 'ordering-orders.json');
    if (!fs.existsSync(ordersFile)) {
        fs.writeFileSync(ordersFile, JSON.stringify([], null, 2));
    }
}

// Initialize data on server start (file-based fallback; db init runs in start())
if (!process.env.DATABASE_URL) {
    initializeMenu();
    initializeEmployees();
    initializeOrderingOrders();
}

// ============ ROUTES ============

app.get('/', (req, res) => {
    res.render('index');
});

// Membership routes
app.get('/membership', (req, res) => {
    res.render('membership-login');
});

app.get('/member-register', (req, res) => {
    res.render('member-register');
});

app.get('/member-dashboard', (req, res) => {
    res.render('member-dashboard');
});

app.get('/membership/deposit-success', (req, res) => {
    res.render('deposit-success');
});

app.get('/membership/deposit-failed', (req, res) => {
    res.render('deposit-failed');
});

app.get('/admin-dashboard', (req, res) => {
    res.render('admin-dashboard');
});

// Ordering routes
app.get('/ordering', (req, res) => {
    res.redirect('/ordering-system');
});

app.get('/ordering-system', (req, res) => {
    res.render('ordering-login');
});

app.get('/employee-ordering', (req, res) => {
    res.render('employee-ordering');
});

app.get('/visitor-ordering', (req, res) => {
    res.render('visitor-ordering');
});

app.get('/admin-ordering', (req, res) => {
    res.render('admin-ordering');
});

// ============ MEMBERSHIP APIs ============

// API: Member Login
app.post('/api/membership/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const members = await dataStore.getMembers();
        const member = members.find(m => m.email === email && m.password === password);
        if (member) {
            const { password: _, ...memberData } = member;
            res.json({ success: true, member: memberData });
        } else {
            res.json({ success: false, message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.json({ success: false, message: 'Login failed' });
    }
});
// ============ MEMBER FINANCIAL MANAGEMENT APIs ============

// Initialize member financial data (only create empty file if missing - never overwrite)
function initializeMemberFinancials() {
    const financialsFile = path.join(DATA_DIR, 'member-financials.json');
    if (!fs.existsSync(financialsFile)) {
        fs.writeFileSync(financialsFile, JSON.stringify({}, null, 2));
    }
}

// Call this in initialization section
initializeMemberFinancials();

// API: Get member financial data
app.get('/api/membership/financial-data', (req, res) => {
    try {
        const { memberId } = req.query;
        const financialsFile = path.join(DATA_DIR, 'member-financials.json');
        
        let financials = {};
        if (fs.existsSync(financialsFile)) {
            const data = fs.readFileSync(financialsFile, 'utf8');
            if (data.trim()) {
                financials = JSON.parse(data);
            }
        }
        
        // Get member's financial data or create default
        if (!financials[memberId]) {
            financials[memberId] = {
                shareCapital: {
                    total: 0,
                    shares: 0,
                    history: []
                },
                savings: {
                    balance: 0,
                    history: []
                },
                loans: {
                    currentBalance: 0,
                    currentLoan: null,
                    history: []
                }
            };
        }
        
        res.json({ success: true, data: financials[memberId] });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// API: Add share capital
app.post('/api/membership/add-share', (req, res) => {
    try {
        const { memberId, amount, paymentMethod, date } = req.body;
        const financialsFile = path.join(DATA_DIR, 'member-financials.json');
        
        let financials = {};
        if (fs.existsSync(financialsFile)) {
            const data = fs.readFileSync(financialsFile, 'utf8');
            if (data.trim()) {
                financials = JSON.parse(data);
            }
        }
        
        // Initialize if doesn't exist
        if (!financials[memberId]) {
            financials[memberId] = {
                shareCapital: { total: 0, shares: 0, history: [] },
                savings: { balance: 0, history: [] },
                loans: { currentBalance: 0, currentLoan: null, history: [] }
            };
        }
        
        // Add share capital (₱100 per share)
        const sharePrice = 100;
        const numberOfShares = Math.floor(amount / sharePrice);
        
        financials[memberId].shareCapital.total += amount;
        financials[memberId].shareCapital.shares += numberOfShares;
        financials[memberId].shareCapital.history.push({
            amount: amount,
            shares: numberOfShares,
            paymentMethod: paymentMethod,
            date: date
        });
        
        fs.writeFileSync(financialsFile, JSON.stringify(financials, null, 2));
        
        // Return updated financial data so member sees new balance right away (real-time)
        res.json({ success: true, data: financials[memberId] });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// API: Savings transaction (deposit/withdrawal)
app.post('/api/membership/savings-transaction', (req, res) => {
    try {
        const { memberId, amount, reason, reference, type, date } = req.body;
        const paymentMethod = req.body.paymentMethod || req.body.paymentMethodUsed || '';
        const financialsFile = path.join(DATA_DIR, 'member-financials.json');
        
        let financials = {};
        if (fs.existsSync(financialsFile)) {
            const data = fs.readFileSync(financialsFile, 'utf8');
            if (data.trim()) {
                financials = JSON.parse(data);
            }
        }
        
        // Initialize if doesn't exist
        if (!financials[memberId]) {
            financials[memberId] = {
                shareCapital: { total: 0, shares: 0, history: [] },
                savings: { balance: 0, history: [] },
                loans: { currentBalance: 0, currentLoan: null, history: [] }
            };
        }
        
        // Process transaction (real-time: deposit goes straight to savings, like GCash)
        if (type === 'deposit') {
            financials[memberId].savings.balance += amount;
            const transactionId = 'TXN-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8).toUpperCase();
            financials[memberId].savings.history.push({
                transactionId,
                type: 'deposit',
                amount: amount,
                paymentMethod: paymentMethod,
                reference: reference || '',
                date: date,
                status: 'completed'  // Real transaction - naa dayon sa account, dili pending
            });
        } else if (type === 'withdrawal') {
            // Check if sufficient balance
            if (financials[memberId].savings.balance < amount) {
                return res.json({ success: false, error: 'Insufficient balance' });
            }
            
            financials[memberId].savings.balance -= amount;
            const transactionId = 'TXN-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8).toUpperCase();
            financials[memberId].savings.history.push({
                transactionId,
                type: 'withdrawal',
                amount: amount,
                reason: reason,
                paymentMethod: paymentMethod || '',
                date: date,
                status: 'pending'  // Withdrawal release needs approval
            });
        }
        
        fs.writeFileSync(financialsFile, JSON.stringify(financials, null, 2));
        
        // Return updated financial data so member sees new savings balance right away (real-time)
        res.json({ success: true, data: financials[memberId] });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// ---------- PayMongo: Deposit via GCash (redirect to app, auto-credit after payment) ----------
const PAYMONGO_SECRET = process.env.PAYMONGO_SECRET_KEY || process.env.PAYMONGO_SECRET;
const PAYMONGO_PUBLIC = process.env.PAYMONGO_PUBLIC_KEY || process.env.PAYMONGO_PUBLIC;
const BASE_URL = process.env.BASE_URL || '';

async function paymongoCreateSource(amountPesos, memberId, successUrl, failedUrl) {
    const amountCentavos = Math.round(amountPesos * 100);
    const res = await fetch('https://api.paymongo.com/v1/sources', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + Buffer.from((PAYMONGO_PUBLIC || PAYMONGO_SECRET) + ':').toString('base64')
        },
        body: JSON.stringify({
            data: {
                attributes: {
                    amount: amountCentavos,
                    currency: 'PHP',
                    type: 'gcash',
                    redirect: { success: successUrl, failed: failedUrl },
                    metadata: { member_id: String(memberId) }
                }
            }
        })
    });
    const json = await res.json();
    if (json.errors && json.errors.length) throw new Error(json.errors[0].detail || 'PayMongo error');
    return json.data;
}

async function paymongoCreatePayment(sourceId, amountCentavos) {
    const res = await fetch('https://api.paymongo.com/v1/payments', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + Buffer.from((PAYMONGO_SECRET || '') + ':').toString('base64')
        },
        body: JSON.stringify({
            data: {
                attributes: {
                    amount: amountCentavos,
                    currency: 'PHP',
                    source: { id: sourceId, type: 'source' }
                }
            }
        })
    });
    const json = await res.json();
    if (json.errors && json.errors.length) throw new Error(json.errors[0].detail || 'PayMongo payment error');
    return json.data;
}

function creditMemberSavings(memberId, amount, paymentMethod, transactionId) {
    const financialsFile = path.join(DATA_DIR, 'member-financials.json');
    let financials = {};
    if (fs.existsSync(financialsFile)) {
        const data = fs.readFileSync(financialsFile, 'utf8');
        if (data.trim()) financials = JSON.parse(data);
    }
    if (!financials[memberId]) {
        financials[memberId] = {
            shareCapital: { total: 0, shares: 0, history: [] },
            savings: { balance: 0, history: [] },
            loans: { currentBalance: 0, currentLoan: null, history: [] }
        };
    }
    financials[memberId].savings.balance += amount;
    financials[memberId].savings.history.push({
        transactionId,
        type: 'deposit',
        amount,
        paymentMethod: paymentMethod || 'GCash (PayMongo)',
        reference: 'PayMongo',
        date: new Date().toISOString(),
        status: 'completed'
    });
    fs.writeFileSync(financialsFile, JSON.stringify(financials, null, 2));
}

// API: Create deposit link (redirect to GCash → pay there → webhook auto-credits)
app.post('/api/membership/create-deposit-link', async (req, res) => {
    try {
        if (!PAYMONGO_PUBLIC && !PAYMONGO_SECRET) {
            return res.json({ success: false, error: 'PayMongo not configured. Set PAYMONGO_PUBLIC_KEY and PAYMONGO_SECRET_KEY.' });
        }
        const { memberId, amount } = req.body;
        const amt = Math.max(100, Number(amount) || 100);
        const host = BASE_URL || (req.protocol + '://' + req.get('host'));
        const successUrl = host + '/membership/deposit-success';
        const failedUrl = host + '/membership/deposit-failed';
        const source = await paymongoCreateSource(amt, memberId, successUrl, failedUrl);
        const checkoutUrl = source.attributes?.checkout_url;
        if (!checkoutUrl) throw new Error('No checkout URL from PayMongo');
        res.json({ success: true, checkoutUrl, amount: amt });
    } catch (err) {
        res.json({ success: false, error: err.message || 'Failed to create deposit link' });
    }
});

// PayMongo webhook: on source.chargeable → credit member then create payment
function paymongoWebhookHandler(req, res) {
    res.status(200).send(); // respond immediately so PayMongo doesn't retry
    let payload;
    try {
        payload = JSON.parse(req.body.toString());
    } catch (_) {
        return;
    }
    if (payload.data?.attributes?.type !== 'source.chargeable') return;
    const sourceData = payload.data?.attributes?.data;
    const sourceId = sourceData?.id;
    const attrs = sourceData?.attributes || {};
    const amountCentavos = attrs.amount;
    const memberId = attrs.metadata?.member_id;
    if (!sourceId || !amountCentavos || !memberId) return;
    const amount = amountCentavos / 100;
    const transactionId = 'TXN-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8).toUpperCase();
    setImmediate(async () => {
        try {
            creditMemberSavings(memberId, amount, 'GCash (PayMongo)', transactionId);
            if (PAYMONGO_SECRET) await paymongoCreatePayment(sourceId, amountCentavos);
        } catch (e) {
            console.error('PayMongo webhook credit/payment error:', e);
        }
    });
}

// API: Loan application
app.post('/api/membership/loan-application', (req, res) => {
    try {
        const { memberId, loanType, amount, term, purpose, notes, applicationDate, status } = req.body;
        const financialsFile = path.join(DATA_DIR, 'member-financials.json');
        
        let financials = {};
        if (fs.existsSync(financialsFile)) {
            const data = fs.readFileSync(financialsFile, 'utf8');
            if (data.trim()) {
                financials = JSON.parse(data);
            }
        }
        
        // Initialize if doesn't exist
        if (!financials[memberId]) {
            financials[memberId] = {
                shareCapital: { total: 0, shares: 0, history: [] },
                savings: { balance: 0, history: [] },
                loans: { currentBalance: 0, currentLoan: null, history: [] }
            };
        }
        
        // Calculate monthly payment (simple calculation, 12% annual interest)
        const interestRate = 0.12 / 12; // Monthly interest
        const monthlyPayment = (amount * interestRate * Math.pow(1 + interestRate, term)) / 
                               (Math.pow(1 + interestRate, term) - 1);
        
        // Add loan application
        const loanApplication = {
            loanType: loanType,
            amount: amount,
            term: term,
            purpose: purpose,
            notes: notes,
            applicationDate: applicationDate,
            status: status,
            monthlyPayment: monthlyPayment
        };
        
        financials[memberId].loans.history.push(loanApplication);
        
        fs.writeFileSync(financialsFile, JSON.stringify(financials, null, 2));
        
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// API: Get member payment methods
app.get('/api/membership/payment-methods', (req, res) => {
    try {
        const { memberId } = req.query;
        const file = path.join(DATA_DIR, 'member-payment-methods.json');
        let data = {};
        if (fs.existsSync(file)) {
            const raw = fs.readFileSync(file, 'utf8');
            if (raw.trim()) data = JSON.parse(raw);
        }
        const methods = data[memberId] || [];
        res.json({ success: true, methods });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// API: Add member payment method
app.post('/api/membership/payment-methods', (req, res) => {
    try {
        const { memberId, type, ...details } = req.body;
        if (!memberId || !type) {
            return res.status(400).json({ success: false, error: 'memberId and type are required' });
        }
        const file = path.join(DATA_DIR, 'member-payment-methods.json');
        let data = {};
        if (fs.existsSync(file)) {
            const raw = fs.readFileSync(file, 'utf8');
            if (raw.trim()) data = JSON.parse(raw);
        }
        if (!data[memberId]) data[memberId] = [];
        const status = details.status || 'pending';
        const id = 'pm_' + Date.now();
        data[memberId].push({
            id,
            type,
            ...details,
            status,
            verified: status === 'verified',
            addedAt: new Date().toISOString()
        });
        if (!fs.existsSync('./data')) fs.mkdirSync('./data');
        fs.writeFileSync(file, JSON.stringify(data, null, 2));
        res.json({ success: true, id });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// API: Get all payment methods (for admin)
app.get('/api/membership/all-payment-methods', (req, res) => {
    try {
        const file = path.join(DATA_DIR, 'member-payment-methods.json');
        let data = {};
        if (fs.existsSync(file)) {
            const raw = fs.readFileSync(file, 'utf8');
            if (raw.trim()) data = JSON.parse(raw);
        }
        res.json({ success: true, paymentMethods: data });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// API: Update payment method status (admin verify/reject)
app.post('/api/membership/payment-method-status', (req, res) => {
    try {
        const { memberId, methodId, status } = req.body;
        if (!memberId || !methodId || !['verified', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, error: 'memberId, methodId and status (verified|rejected) required' });
        }
        const file = path.join(DATA_DIR, 'member-payment-methods.json');
        let data = {};
        if (fs.existsSync(file)) {
            const raw = fs.readFileSync(file, 'utf8');
            if (raw.trim()) data = JSON.parse(raw);
        }
        const methods = data[memberId];
        if (!methods || !Array.isArray(methods)) {
            return res.json({ success: false, error: 'Member or payment methods not found' });
        }
        const method = methods.find(m => m.id === methodId);
        if (!method) {
            return res.json({ success: false, error: 'Payment method not found' });
        }
        method.status = status;
        method.verified = status === 'verified';
        if (status === 'rejected') method.rejectedAt = new Date().toISOString();
        if (status === 'verified') method.verifiedAt = new Date().toISOString();
        fs.writeFileSync(file, JSON.stringify(data, null, 2));
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// API: Get all member financials (for admin)
app.get('/api/membership/all-financials', (req, res) => {
    try {
        const financialsFile = path.join(DATA_DIR, 'member-financials.json');
        
        let financials = {};
        if (fs.existsSync(financialsFile)) {
            const data = fs.readFileSync(financialsFile, 'utf8');
            if (data.trim()) {
                financials = JSON.parse(data);
            }
        }
        
        res.json({ success: true, financials });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// API: Approve loan (admin)
app.post('/api/membership/approve-loan', (req, res) => {
    try {
        const { memberId, loanIndex } = req.body;
        const financialsFile = path.join(DATA_DIR, 'member-financials.json');
        
        let financials = JSON.parse(fs.readFileSync(financialsFile, 'utf8'));
        
        if (financials[memberId] && financials[memberId].loans.history[loanIndex]) {
            const loan = financials[memberId].loans.history[loanIndex];
            loan.status = 'approved';
            loan.approvedDate = new Date().toISOString();
            
            // Set as current loan
            financials[memberId].loans.currentLoan = {
                ...loan,
                balance: loan.amount,
                monthlyPayment: loan.monthlyPayment
            };
            financials[memberId].loans.currentBalance = loan.amount;
            
            fs.writeFileSync(financialsFile, JSON.stringify(financials, null, 2));
            res.json({ success: true });
        } else {
            res.json({ success: false, error: 'Loan not found' });
        }
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// API: Reject loan (admin)
app.post('/api/membership/reject-loan', (req, res) => {
    try {
        const { memberId, loanIndex, reason } = req.body;
        const financialsFile = path.join(DATA_DIR, 'member-financials.json');
        if (!fs.existsSync(financialsFile)) {
            return res.json({ success: false, error: 'Financials not found' });
        }
        const financials = JSON.parse(fs.readFileSync(financialsFile, 'utf8'));
        if (financials[memberId] && financials[memberId].loans.history[loanIndex]) {
            const loan = financials[memberId].loans.history[loanIndex];
            loan.status = 'rejected';
            loan.rejectedDate = new Date().toISOString();
            loan.rejectionReason = reason || '';
            fs.writeFileSync(financialsFile, JSON.stringify(financials, null, 2));
            res.json({ success: true });
        } else {
            res.json({ success: false, error: 'Loan not found' });
        }
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// API: Make loan payment
app.post('/api/membership/loan-payment', (req, res) => {
    try {
        const { memberId, amount, date } = req.body;
        const financialsFile = path.join(DATA_DIR, 'member-financials.json');
        
        let financials = JSON.parse(fs.readFileSync(financialsFile, 'utf8'));
        
        if (financials[memberId] && financials[memberId].loans.currentLoan) {
            financials[memberId].loans.currentBalance -= amount;
            financials[memberId].loans.currentLoan.balance -= amount;
            
            // If fully paid
            if (financials[memberId].loans.currentBalance <= 0) {
                financials[memberId].loans.currentLoan.status = 'completed';
                financials[memberId].loans.currentLoan = null;
                financials[memberId].loans.currentBalance = 0;
            }
            
            fs.writeFileSync(financialsFile, JSON.stringify(financials, null, 2));
            res.json({ success: true });
        } else {
            res.json({ success: false, error: 'No active loan' });
        }
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});
// API: Admin Login
app.post('/api/membership/admin-login', (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (username === 'admin' && password === 'admin123') {
            res.json({ success: true });
        } else {
            res.json({ success: false, message: 'Invalid credentials' });
        }
    } catch (error) {
        res.json({ success: false, message: 'Login failed' });
    }
});

// API: Save membership registration
app.post('/api/membership/register', async (req, res) => {
    try {
        const memberData = req.body;
        if (!memberData || Object.keys(memberData).length === 0) {
            return res.status(400).json({ success: false, error: 'No data received' });
        }
        const members = await dataStore.getMembers();
        if (members.find(m => m.email === memberData.email)) {
            return res.json({ success: false, error: 'Email already registered' });
        }
        memberData.id = members.length ? Math.max(...members.map(m => m.id)) + 1 : 1;
        memberData.registrationDate = new Date().toISOString();
        memberData.status = 'pending';
        members.push(memberData);
        await dataStore.saveMembers(members);
        res.json({ success: true, memberId: memberData.id });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// API: Get current member (for dashboard to sync status - para dili "under review" kung na-verify na)
app.get('/api/membership/me', async (req, res) => {
    try {
        const { memberId } = req.query;
        if (!memberId) return res.json({ success: false, error: 'memberId required' });
        const members = await dataStore.getMembers();
        const m = members.find(mem => String(mem.id) === String(memberId));
        if (!m) return res.json({ success: false, error: 'Member not found' });
        const { password: _, ...memberData } = m;
        res.json({ success: true, member: memberData });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// API: Get all members
app.get('/api/membership/all-members', async (req, res) => {
    try {
        const members = await dataStore.getMembers();
        const list = members.map(({ password, ...member }) => member);
        res.json({ success: true, members: list });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// API: Update member profile (basic info)
app.post('/api/membership/update-profile', async (req, res) => {
    try {
        const { id, firstName, middleName, lastName, mobile, address } = req.body;
        if (!id) return res.json({ success: false, error: 'Member ID is required' });
        const members = await dataStore.getMembers();
        const index = members.findIndex(m => m.id === id);
        if (index === -1) return res.json({ success: false, error: 'Member not found' });
        if (typeof firstName === 'string') members[index].firstName = firstName.trim();
        if (typeof middleName === 'string') members[index].middleName = middleName.trim();
        if (typeof lastName === 'string') members[index].lastName = lastName.trim();
        if (typeof mobile === 'string') members[index].mobile = mobile.trim();
        if (typeof address === 'string') {
            members[index].address = address.trim();
            members[index].presentAddress = address.trim();
        }
        await dataStore.saveMembers(members);
        const { password, ...memberData } = members[index];
        res.json({ success: true, member: memberData });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// API: Update member password
app.post('/api/membership/update-password', async (req, res) => {
    try {
        const { id, currentPassword, newPassword } = req.body;
        if (!id || !currentPassword || !newPassword) return res.json({ success: false, error: 'All fields are required' });
        const members = await dataStore.getMembers();
        const index = members.findIndex(m => m.id === id);
        if (index === -1) return res.json({ success: false, error: 'Member not found' });
        if (members[index].password !== currentPassword) return res.json({ success: false, error: 'Current password is incorrect' });
        members[index].password = newPassword;
        await dataStore.saveMembers(members);
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// API: Verify member
app.post('/api/membership/verify', async (req, res) => {
    try {
        const { memberId } = req.body;
        const members = await dataStore.getMembers();
        const i = members.findIndex(m => m.id === memberId);
        if (i !== -1) {
            members[i].status = 'verified';
            members[i].verifiedDate = new Date().toISOString();
            await dataStore.saveMembers(members);
            res.json({ success: true });
        } else {
            res.json({ success: false, error: 'Member not found' });
        }
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// ============ ORDERING SYSTEM APIs ============

// API: Employee Login
app.post('/api/ordering/employee-login', async (req, res) => {
    try {
        const { empId, password } = req.body;
        const employees = await dataStore.getEmployees();
        const employee = employees.find(e => e.empId === empId && e.password === password);
        if (employee) {
            const { password: _, ...empData } = employee;
            res.json({ success: true, employee: empData });
        } else {
            res.json({ success: false, message: 'Invalid employee ID or password' });
        }
    } catch (error) {
        res.json({ success: false, message: 'Login failed' });
    }
});

// API: Employee Registration
app.post('/api/ordering/employee-register', async (req, res) => {
    try {
        const employeeData = req.body;
        if (!employeeData || !employeeData.empId) return res.status(400).json({ success: false, message: 'No data received' });
        const employees = await dataStore.getEmployees();
        // Check if employee ID already exists
        if (employees.find(e => e.empId === employeeData.empId)) return res.json({ success: false, message: 'Employee ID already registered' });
        if (employeeData.email && employees.find(e => e.email === employeeData.email)) return res.json({ success: false, message: 'Email already registered' });
        employees.push(employeeData);
        await dataStore.saveEmployees(employees);
        res.json({ success: true, message: 'Registration successful' });
    } catch (error) {
        console.error('Registration error:', error);
        res.json({ success: false, message: 'Registration failed' });
    }
});

// Add route for employee registration page
app.get('/employee-register', (req, res) => {
    res.render('employee-register');
});

// API: Admin Login (Ordering)
app.post('/api/ordering/admin-login', (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (username === 'admin' && password === 'admin123') {
            res.json({ success: true });
        } else {
            res.json({ success: false, message: 'Invalid credentials' });
        }
    } catch (error) {
        res.json({ success: false, message: 'Login failed' });
    }
});

// API: Get menu items
app.get('/api/ordering/menu-items', async (req, res) => {
    try {
        const items = await dataStore.getMenu();
        res.json({ success: true, items });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// API: Get wallet balance
app.get('/api/ordering/wallet-balance', async (req, res) => {
    try {
        const { empId } = req.query;
        const employees = await dataStore.getEmployees();
        const employee = employees.find(e => e.empId === empId);
        if (employee) res.json({ success: true, balance: employee.walletBalance || 0 });
        else res.json({ success: false, error: 'Employee not found' });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// API: Top up wallet
app.post('/api/ordering/top-up-wallet', async (req, res) => {
    try {
        const { empId, amount } = req.body;
        const employees = await dataStore.getEmployees();
        const i = employees.findIndex(e => e.empId === empId);
        if (i !== -1) {
            employees[i].walletBalance = (employees[i].walletBalance || 0) + amount;
            await dataStore.saveEmployees(employees);
            res.json({ success: true, newBalance: employees[i].walletBalance });
        } else res.json({ success: false, error: 'Employee not found' });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// API: Place order
app.post('/api/ordering/place-order', async (req, res) => {
    try {
        const orderData = req.body;
        if (!orderData || !orderData.items || orderData.items.length === 0) return res.status(400).json({ success: false, error: 'No items in order' });
        const orderId = await dataStore.addOrder(orderData);
        orderData.id = orderId;
        let menuItems = await dataStore.getMenu();
        orderData.items.forEach(orderItem => {
            const idx = menuItems.findIndex(m => m.id === orderItem.id);
            if (idx !== -1) menuItems[idx].stock = (menuItems[idx].stock || 0) - orderItem.quantity;
        });
        await dataStore.saveMenu(menuItems);
        let newBalance = 0;
        const employees = await dataStore.getEmployees();
        if (orderData.paymentMethod === 'wallet' && orderData.empId) {
            const i = employees.findIndex(e => e.empId === orderData.empId);
            if (i !== -1) {
                employees[i].walletBalance -= orderData.total;
                newBalance = employees[i].walletBalance;
                await dataStore.saveEmployees(employees);
            }
        } else if (orderData.paymentMethod === 'credit' && orderData.empId) {
            const i = employees.findIndex(e => e.empId === orderData.empId);
            if (i !== -1) {
                employees[i].creditBalance = (employees[i].creditBalance || 0) + orderData.total;
                await dataStore.saveEmployees(employees);
            }
        }
        res.json({ success: true, orderId, newBalance });
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// API: Get order history
app.get('/api/ordering/order-history', async (req, res) => {
    try {
        const { empId } = req.query;
        const orders = await dataStore.getOrders();
        const employeeOrders = orders.filter(o => o.empId === empId);
        res.json({ success: true, orders: employeeOrders });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// API: Get favorites
app.get('/api/ordering/favorites', (req, res) => {
    try {
        // For now, return empty array - can be enhanced later
        res.json({ success: true, favorites: [] });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// API: Get credit balance
app.get('/api/ordering/credit-balance', async (req, res) => {
    try {
        const { empId } = req.query;
        const employees = await dataStore.getEmployees();
        const employee = employees.find(e => e.empId === empId);
        if (employee) {
            const orders = await dataStore.getOrders();
            const creditOrders = orders.filter(o => o.empId === empId && o.paymentMethod === 'credit');
            const creditHistory = creditOrders.map(o => ({ orderId: o.id, amount: o.total, date: o.orderDate }));
            res.json({ success: true, creditBalance: employee.creditBalance || 0, creditHistory });
        } else {
            res.json({ success: false, error: 'Employee not found' });
        }
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// ============ ADMIN ORDERING APIs ============

// API: Admin Overview
app.get('/api/ordering/admin/overview', async (req, res) => {
    try {
        const [orders, menuItems, employees] = await Promise.all([dataStore.getOrders(), dataStore.getMenu(), dataStore.getEmployees()]);
        const today = new Date().toDateString();
        const todayOrders = orders.filter(o => new Date(o.orderDate).toDateString() === today);
        const todaySales = todayOrders.reduce((sum, o) => sum + o.total, 0);
        const lowStockItems = menuItems.filter(item => (item.stock || 0) <= (item.minStock || 5)).length;
        const totalCredits = employees.reduce((sum, e) => sum + (e.creditBalance || 0), 0);
        const recentOrders = orders.slice(-10).reverse();
        res.json({ success: true, todaySales, todayOrders: todayOrders.length, lowStockItems, totalCredits, recentOrders });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

if (!process.env.DATABASE_URL) {
    const adminProfileFile = path.join(DATA_DIR, 'admin-profile.json');
    if (!fs.existsSync(adminProfileFile)) {
        fs.writeFileSync(adminProfileFile, JSON.stringify({
            fullName: 'Administrator',
            email: 'admin@climbs.com',
            phone: '',
            address: '',
            username: 'admin',
            password: 'admin123',
            profileImage: '',
            accountCreated: new Date().toISOString()
        }, null, 2));
    }
}

// Add route for admin profile page
app.get('/admin-profile', (req, res) => {
    res.render('admin-profile');
});

// API: Get admin profile
app.get('/api/ordering/admin/profile', async (req, res) => {
    try {
        const profile = await dataStore.getAdminProfile();
        const { password, ...profileData } = profile;
        res.json({ success: true, profile: profileData });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// API: Update admin profile
app.post('/api/ordering/admin/update-profile', async (req, res) => {
    try {
        const { fullName, email, phone, address } = req.body;
        const profile = await dataStore.getAdminProfile();
        if (fullName != null) profile.fullName = fullName;
        if (email != null) profile.email = email;
        if (phone != null) profile.phone = phone;
        if (address != null) profile.address = address;
        await dataStore.saveAdminProfile(profile);
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// API: Update profile image
app.post('/api/ordering/admin/update-profile-image', async (req, res) => {
    try {
        const profileImage = req.body && req.body.profileImage;
        const profile = await dataStore.getAdminProfile();
        if (typeof profileImage === 'string') profile.profileImage = profileImage;
        await dataStore.saveAdminProfile(profile);
        res.json({ success: true });
    } catch (error) {
        console.error('Update profile image error:', error);
        res.json({ success: false, error: error.message });
    }
});

// API: Update security (username/password)
app.post('/api/ordering/admin/update-security', async (req, res) => {
    try {
        const { username, currentPassword, newPassword } = req.body;
        const profile = await dataStore.getAdminProfile();
        if (profile.password !== currentPassword) return res.json({ success: false, error: 'Current password is incorrect' });
        profile.username = username;
        if (newPassword) profile.password = newPassword;
        await dataStore.saveAdminProfile(profile);
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Update admin login API to use profile data
app.post('/api/ordering/admin-login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const profile = await dataStore.getAdminProfile();
        const adminUsername = profile.username || 'admin';
        const adminPassword = profile.password || 'admin123';
        if (username === adminUsername && password === adminPassword) res.json({ success: true });
        else res.json({ success: false, message: 'Invalid credentials' });
    } catch (error) {
        res.json({ success: false, message: 'Login failed' });
    }
});

// API: Add menu item
app.post('/api/ordering/admin/add-menu-item', async (req, res) => {
    try {
        const items = await dataStore.getMenu();
        items.push(req.body);
        await dataStore.saveMenu(items);
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// API: Update menu item
app.post('/api/ordering/admin/update-menu-item', async (req, res) => {
    try {
        const items = await dataStore.getMenu();
        const i = items.findIndex(item => item.id === req.body.id);
        if (i !== -1) { items[i] = req.body; await dataStore.saveMenu(items); res.json({ success: true }); }
        else res.json({ success: false, error: 'Item not found' });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// API: Delete menu item
app.post('/api/ordering/admin/delete-menu-item', async (req, res) => {
    try {
        const items = await dataStore.getMenu();
        const filtered = items.filter(item => item.id !== req.body.id);
        await dataStore.saveMenu(filtered);
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// API: Update stock
app.post('/api/ordering/admin/update-stock', async (req, res) => {
    try {
        const items = await dataStore.getMenu();
        const i = items.findIndex(item => item.id === req.body.itemId);
        if (i !== -1) {
            items[i].stock = (items[i].stock || 0) + req.body.addQty;
            await dataStore.saveMenu(items);
            res.json({ success: true });
        } else res.json({ success: false, error: 'Item not found' });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// API: Get all orders
app.get('/api/ordering/admin/all-orders', async (req, res) => {
    try {
        const orders = await dataStore.getOrders();
        orders.sort((a, b) => new Date(b.orderDate || 0) - new Date(a.orderDate || 0));
        res.json({ success: true, orders });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// API: Daily report
app.get('/api/ordering/admin/daily-report', async (req, res) => {
    try {
        const { date } = req.query;
        const orders = await dataStore.getOrders();
        const targetDate = new Date(date).toDateString();
        const dayOrders = orders.filter(o => new Date(o.orderDate).toDateString() === targetDate);
        
        const totalOrders = dayOrders.length;
        const totalSales = dayOrders.reduce((sum, o) => sum + o.total, 0);
        const averageOrder = totalOrders > 0 ? totalSales / totalOrders : 0;
        
        // Top items
        const itemSales = {};
        dayOrders.forEach(order => {
            order.items.forEach(item => {
                if (!itemSales[item.name]) {
                    itemSales[item.name] = { name: item.name, quantity: 0, revenue: 0 };
                }
                itemSales[item.name].quantity += item.quantity;
                itemSales[item.name].revenue += item.price * item.quantity;
            });
        });
        
        const topItems = Object.values(itemSales).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
        
        res.json({
            success: true,
            report: {
                totalOrders,
                totalSales,
                averageOrder,
                topItems
            }
        });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// API: Monthly report
app.get('/api/ordering/admin/monthly-report', async (req, res) => {
    try {
        const { month, year } = req.query;
        const orders = await dataStore.getOrders();
        const monthOrders = orders.filter(o => {
            const orderDate = new Date(o.orderDate);
            return orderDate.getMonth() + 1 === parseInt(month) && orderDate.getFullYear() === parseInt(year);
        });
        
        const totalOrders = monthOrders.length;
        const totalSales = monthOrders.reduce((sum, o) => sum + o.total, 0);
        const averageOrder = totalOrders > 0 ? totalSales / totalOrders : 0;
        
        const cashPayments = monthOrders.filter(o => o.paymentMethod === 'cash').reduce((sum, o) => sum + o.total, 0);
        const walletPayments = monthOrders.filter(o => o.paymentMethod === 'wallet').reduce((sum, o) => sum + o.total, 0);
        const creditPayments = monthOrders.filter(o => o.paymentMethod === 'credit').reduce((sum, o) => sum + o.total, 0);
        
        const daysInMonth = new Date(year, month, 0).getDate();
        const averageDaily = totalOrders / daysInMonth;
        
        res.json({
            success: true,
            report: {
                totalOrders,
                totalSales,
                averageOrder,
                cashPayments,
                walletPayments,
                creditPayments,
                averageDaily
            }
        });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// API: Yearly report
app.get('/api/ordering/admin/yearly-report', async (req, res) => {
    try {
        const { year } = req.query;
        const orders = await dataStore.getOrders();
        const yearOrders = orders.filter(o => new Date(o.orderDate).getFullYear() === parseInt(year));
        
        const totalOrders = yearOrders.length;
        const totalSales = yearOrders.reduce((sum, o) => sum + o.total, 0);
        const averageMonthly = totalSales / 12;
        
        // Monthly breakdown
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const monthlyData = monthNames.map((name, index) => {
            const monthOrders = yearOrders.filter(o => new Date(o.orderDate).getMonth() === index);
            return {
                name,
                orders: monthOrders.length,
                sales: monthOrders.reduce((sum, o) => sum + o.total, 0)
            };
        });
        
        res.json({
            success: true,
            report: {
                totalOrders,
                totalSales,
                averageMonthly,
                monthlyData
            }
        });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// API: Employee credits
app.get('/api/ordering/admin/employee-credits', async (req, res) => {
    try {
        const [employees, orders] = await Promise.all([dataStore.getEmployees(), dataStore.getOrders()]);
        const credits = employees
            .filter(e => (e.creditBalance || 0) > 0)
            .map(e => {
                const lastCreditOrder = orders
                    .filter(o => o.empId === e.empId && o.paymentMethod === 'credit')
                    .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))[0];
                
                return {
                    empId: e.empId,
                    employeeName: e.name,
                    creditBalance: e.creditBalance || 0,
                    lastTransaction: lastCreditOrder ? lastCreditOrder.orderDate : null
                };
            });
        
        res.json({ success: true, credits });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Start server (init DB or files first, then listen)
async function start() {
    await dataStore.init();
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server is running on http://localhost:${PORT}`);
        if (dataStore.useDb) console.log('Using PostgreSQL database (DATABASE_URL)');
        else console.log('Data saved in:', DATA_DIR);
        const nets = os.networkInterfaces();
        for (const name of Object.keys(nets)) {
            for (const net of nets[name]) {
                if (net.family === 'IPv4' && !net.internal) {
                    console.log(`  Access from other devices: http://${net.address}:${PORT}`);
                }
            }
        }
        console.log('Press Ctrl+C to stop the server');
    });
}
start().catch(err => { console.error('Failed to start:', err); process.exit(1); });