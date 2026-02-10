const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const os = require('os');

const app = express();
const PORT = 3000;

// Middleware (higher limit for profile image base64)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Create data directory if it doesn't exist
if (!fs.existsSync('./data')) {
    fs.mkdirSync('./data');
}

// Initialize menu file with default items
function initializeMenu() {
    const menuFile = './data/menu.json';
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

// Initialize employees
function initializeEmployees() {
    const empFile = './data/employees.json';
    if (!fs.existsSync(empFile)) {
        const defaultEmployees = [
            { empId: 'EMP001', name: 'Juan Dela Cruz', password: 'emp123', walletBalance: 500, creditBalance: 0 },
            { empId: 'EMP002', name: 'Maria Santos', password: 'emp123', walletBalance: 300, creditBalance: 0 },
            { empId: 'EMP003', name: 'Pedro Garcia', password: 'emp123', walletBalance: 450, creditBalance: 0 }
        ];
        fs.writeFileSync(empFile, JSON.stringify(defaultEmployees, null, 2));
    }
}

// Initialize ordering orders
function initializeOrderingOrders() {
    const ordersFile = './data/ordering-orders.json';
    if (!fs.existsSync(ordersFile)) {
        fs.writeFileSync(ordersFile, JSON.stringify([], null, 2));
    }
}

// Initialize data on server start
initializeMenu();
initializeEmployees();
initializeOrderingOrders();

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
app.post('/api/membership/login', (req, res) => {
    try {
        const { email, password } = req.body;
        
        const membersFile = './data/members.json';
        let members = [];
        
        if (fs.existsSync(membersFile)) {
            const data = fs.readFileSync(membersFile, 'utf8');
            if (data.trim()) {
                members = JSON.parse(data);
            }
        }
        
        const member = members.find(m => m.email === email && m.password === password);
        
        if (member) {
            const { password, ...memberData } = member;
            res.json({ success: true, member: memberData });
        } else {
            res.json({ success: false, message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.json({ success: false, message: 'Login failed' });
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
app.post('/api/membership/register', (req, res) => {
    try {
        const memberData = req.body;
        
        if (!memberData || Object.keys(memberData).length === 0) {
            return res.status(400).json({ success: false, error: 'No data received' });
        }
        
        let members = [];
        const filePath = './data/members.json';
        
        if (fs.existsSync(filePath)) {
            try {
                const data = fs.readFileSync(filePath, 'utf8');
                if (data.trim()) {
                    members = JSON.parse(data);
                }
            } catch (parseError) {
                members = [];
            }
        }
        
        const emailExists = members.find(m => m.email === memberData.email);
        if (emailExists) {
            return res.json({ success: false, error: 'Email already registered' });
        }
        
        memberData.id = members.length + 1;
        memberData.registrationDate = new Date().toISOString();
        memberData.status = 'pending';
        members.push(memberData);
        
        fs.writeFileSync(filePath, JSON.stringify(members, null, 2));
        
        res.json({ success: true, memberId: memberData.id });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// API: Get all members
app.get('/api/membership/all-members', (req, res) => {
    try {
        const membersFile = './data/members.json';
        let members = [];
        
        if (fs.existsSync(membersFile)) {
            const data = fs.readFileSync(membersFile, 'utf8');
            if (data.trim()) {
                members = JSON.parse(data);
                members = members.map(({ password, ...member }) => member);
            }
        }
        
        res.json({ success: true, members });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// API: Verify member
app.post('/api/membership/verify', (req, res) => {
    try {
        const { memberId } = req.body;
        const membersFile = './data/members.json';
        
        let members = [];
        if (fs.existsSync(membersFile)) {
            const data = fs.readFileSync(membersFile, 'utf8');
            if (data.trim()) {
                members = JSON.parse(data);
            }
        }
        
        const memberIndex = members.findIndex(m => m.id === memberId);
        if (memberIndex !== -1) {
            members[memberIndex].status = 'verified';
            members[memberIndex].verifiedDate = new Date().toISOString();
            fs.writeFileSync(membersFile, JSON.stringify(members, null, 2));
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
app.post('/api/ordering/employee-login', (req, res) => {
    try {
        const { empId, password } = req.body;
        
        const empFile = './data/employees.json';
        let employees = [];
        
        if (fs.existsSync(empFile)) {
            const data = fs.readFileSync(empFile, 'utf8');
            employees = JSON.parse(data);
        }
        
        const employee = employees.find(e => e.empId === empId && e.password === password);
        
        if (employee) {
            const { password, ...empData } = employee;
            res.json({ success: true, employee: empData });
        } else {
            res.json({ success: false, message: 'Invalid employee ID or password' });
        }
    } catch (error) {
        res.json({ success: false, message: 'Login failed' });
    }
});

// API: Employee Registration
app.post('/api/ordering/employee-register', (req, res) => {
    try {
        const employeeData = req.body;
        
        if (!employeeData || !employeeData.empId) {
            return res.status(400).json({ success: false, message: 'No data received' });
        }
        
        const empFile = './data/employees.json';
        let employees = [];
        
        if (fs.existsSync(empFile)) {
            const data = fs.readFileSync(empFile, 'utf8');
            employees = JSON.parse(data);
        }
        
        // Check if employee ID already exists
        const empExists = employees.find(e => e.empId === employeeData.empId);
        if (empExists) {
            return res.json({ success: false, message: 'Employee ID already registered' });
        }
        
        // Check if email already exists
        const emailExists = employees.find(e => e.email === employeeData.email);
        if (emailExists) {
            return res.json({ success: false, message: 'Email already registered' });
        }
        
        // Add new employee
        employees.push(employeeData);
        fs.writeFileSync(empFile, JSON.stringify(employees, null, 2));
        
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
app.get('/api/ordering/menu-items', (req, res) => {
    try {
        const menuFile = './data/menu.json';
        let items = [];
        
        if (fs.existsSync(menuFile)) {
            const data = fs.readFileSync(menuFile, 'utf8');
            if (data.trim()) {
                items = JSON.parse(data);
            }
        }
        
        res.json({ success: true, items });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// API: Get wallet balance
app.get('/api/ordering/wallet-balance', (req, res) => {
    try {
        const { empId } = req.query;
        
        const empFile = './data/employees.json';
        let employees = JSON.parse(fs.readFileSync(empFile, 'utf8'));
        
        const employee = employees.find(e => e.empId === empId);
        
        if (employee) {
            res.json({ success: true, balance: employee.walletBalance || 0 });
        } else {
            res.json({ success: false, error: 'Employee not found' });
        }
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// API: Top up wallet
app.post('/api/ordering/top-up-wallet', (req, res) => {
    try {
        const { empId, amount } = req.body;
        
        const empFile = './data/employees.json';
        let employees = JSON.parse(fs.readFileSync(empFile, 'utf8'));
        
        const empIndex = employees.findIndex(e => e.empId === empId);
        
        if (empIndex !== -1) {
            employees[empIndex].walletBalance = (employees[empIndex].walletBalance || 0) + amount;
            fs.writeFileSync(empFile, JSON.stringify(employees, null, 2));
            res.json({ success: true, newBalance: employees[empIndex].walletBalance });
        } else {
            res.json({ success: false, error: 'Employee not found' });
        }
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// API: Place order
app.post('/api/ordering/place-order', (req, res) => {
    try {
        const orderData = req.body;
        
        if (!orderData || !orderData.items || orderData.items.length === 0) {
            return res.status(400).json({ success: false, error: 'No items in order' });
        }
        
        // Read orders
        let orders = [];
        const ordersFile = './data/ordering-orders.json';
        
        if (fs.existsSync(ordersFile)) {
            const data = fs.readFileSync(ordersFile, 'utf8');
            if (data.trim()) {
                orders = JSON.parse(data);
            }
        }
        
        // Add order ID
        orderData.id = orders.length + 1;
        
        // Update stock
        const menuFile = './data/menu.json';
        let menuItems = JSON.parse(fs.readFileSync(menuFile, 'utf8'));
        
        orderData.items.forEach(orderItem => {
            const menuItemIndex = menuItems.findIndex(m => m.id === orderItem.id);
            if (menuItemIndex !== -1) {
                menuItems[menuItemIndex].stock = (menuItems[menuItemIndex].stock || 0) - orderItem.quantity;
            }
        });
        
        fs.writeFileSync(menuFile, JSON.stringify(menuItems, null, 2));
        
        // Handle payment
        let newBalance = 0;
        if (orderData.paymentMethod === 'wallet' && orderData.empId) {
            // Deduct from wallet
            const empFile = './data/employees.json';
            let employees = JSON.parse(fs.readFileSync(empFile, 'utf8'));
            
            const empIndex = employees.findIndex(e => e.empId === orderData.empId);
            if (empIndex !== -1) {
                employees[empIndex].walletBalance -= orderData.total;
                newBalance = employees[empIndex].walletBalance;
                fs.writeFileSync(empFile, JSON.stringify(employees, null, 2));
            }
        } else if (orderData.paymentMethod === 'credit' && orderData.empId) {
            // Add to credit
            const empFile = './data/employees.json';
            let employees = JSON.parse(fs.readFileSync(empFile, 'utf8'));
            
            const empIndex = employees.findIndex(e => e.empId === orderData.empId);
            if (empIndex !== -1) {
                employees[empIndex].creditBalance = (employees[empIndex].creditBalance || 0) + orderData.total;
                fs.writeFileSync(empFile, JSON.stringify(employees, null, 2));
            }
        }
        
        // Save order
        orders.push(orderData);
        fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));
        
        res.json({ 
            success: true, 
            orderId: orderData.id,
            newBalance: newBalance
        });
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// API: Get order history
app.get('/api/ordering/order-history', (req, res) => {
    try {
        const { empId } = req.query;
        
        const ordersFile = './data/ordering-orders.json';
        let orders = [];
        
        if (fs.existsSync(ordersFile)) {
            const data = fs.readFileSync(ordersFile, 'utf8');
            if (data.trim()) {
                orders = JSON.parse(data);
            }
        }
        
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
app.get('/api/ordering/credit-balance', (req, res) => {
    try {
        const { empId } = req.query;
        
        const empFile = './data/employees.json';
        let employees = JSON.parse(fs.readFileSync(empFile, 'utf8'));
        
        const employee = employees.find(e => e.empId === empId);
        
        if (employee) {
            // Get credit history
            const ordersFile = './data/ordering-orders.json';
            let orders = [];
            
            if (fs.existsSync(ordersFile)) {
                const data = fs.readFileSync(ordersFile, 'utf8');
                if (data.trim()) {
                    orders = JSON.parse(data);
                }
            }
            
            const creditOrders = orders.filter(o => o.empId === empId && o.paymentMethod === 'credit');
            const creditHistory = creditOrders.map(o => ({
                orderId: o.id,
                amount: o.total,
                date: o.orderDate
            }));
            
            res.json({ 
                success: true, 
                creditBalance: employee.creditBalance || 0,
                creditHistory: creditHistory
            });
        } else {
            res.json({ success: false, error: 'Employee not found' });
        }
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// ============ ADMIN ORDERING APIs ============

// API: Admin Overview
app.get('/api/ordering/admin/overview', (req, res) => {
    try {
        const ordersFile = './data/ordering-orders.json';
        const menuFile = './data/menu.json';
        const empFile = './data/employees.json';
        
        let orders = [];
        if (fs.existsSync(ordersFile)) {
            const data = fs.readFileSync(ordersFile, 'utf8');
            if (data.trim()) {
                orders = JSON.parse(data);
            }
        }
        
        let menuItems = JSON.parse(fs.readFileSync(menuFile, 'utf8'));
        let employees = JSON.parse(fs.readFileSync(empFile, 'utf8'));
        
        // Today's orders and sales
        const today = new Date().toDateString();
        const todayOrders = orders.filter(o => new Date(o.orderDate).toDateString() === today);
        const todaySales = todayOrders.reduce((sum, o) => sum + o.total, 0);
        
        // Low stock items
        const lowStockItems = menuItems.filter(item => (item.stock || 0) <= (item.minStock || 5)).length;
        
        // Total credits
        const totalCredits = employees.reduce((sum, e) => sum + (e.creditBalance || 0), 0);
        
        // Recent orders
        const recentOrders = orders.slice(-10).reverse();
        
        res.json({
            success: true,
            todaySales,
            todayOrders: todayOrders.length,
            lowStockItems,
            totalCredits,
            recentOrders
        });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Initialize admin profile
function initializeAdminProfile() {
    const adminProfileFile = './data/admin-profile.json';
    if (!fs.existsSync(adminProfileFile)) {
        const defaultProfile = {
            fullName: 'Administrator',
            email: 'admin@climbs.com',
            phone: '',
            address: '',
            username: 'admin',
            password: 'admin123',
            profileImage: '',
            accountCreated: new Date().toISOString()
        };
        fs.writeFileSync(adminProfileFile, JSON.stringify(defaultProfile, null, 2));
    }
}

// Call this in initialization section
initializeAdminProfile();

// Add route for admin profile page
app.get('/admin-profile', (req, res) => {
    res.render('admin-profile');
});

// API: Get admin profile
app.get('/api/ordering/admin/profile', (req, res) => {
    try {
        const profileFile = './data/admin-profile.json';
        let profile = {};
        
        if (fs.existsSync(profileFile)) {
            const data = fs.readFileSync(profileFile, 'utf8');
            profile = JSON.parse(data);
        }
        
        // Don't send password to client
        const { password, ...profileData } = profile;
        
        res.json({ success: true, profile: profileData });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// API: Update admin profile
app.post('/api/ordering/admin/update-profile', (req, res) => {
    try {
        const { fullName, email, phone, address } = req.body;
        const profileFile = './data/admin-profile.json';
        
        let profile = {};
        if (fs.existsSync(profileFile)) {
            const data = fs.readFileSync(profileFile, 'utf8');
            profile = JSON.parse(data);
        }
        
        // Update profile
        profile.fullName = fullName;
        profile.email = email;
        profile.phone = phone;
        profile.address = address;
        
        fs.writeFileSync(profileFile, JSON.stringify(profile, null, 2));
        
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// API: Update profile image (accepts base64; body limit 10mb in middleware)
app.post('/api/ordering/admin/update-profile-image', (req, res) => {
    try {
        const profileImage = req.body && req.body.profileImage;
        const profileFile = './data/admin-profile.json';
        
        let profile = {};
        if (fs.existsSync(profileFile)) {
            const data = fs.readFileSync(profileFile, 'utf8');
            profile = JSON.parse(data);
        }
        
        // Only update if we got a string (empty string = remove image)
        if (typeof profileImage === 'string') {
            profile.profileImage = profileImage;
        }
        
        fs.writeFileSync(profileFile, JSON.stringify(profile, null, 2), 'utf8');
        res.json({ success: true });
    } catch (error) {
        console.error('Update profile image error:', error);
        res.json({ success: false, error: error.message });
    }
});

// API: Update security (username/password)
app.post('/api/ordering/admin/update-security', (req, res) => {
    try {
        const { username, currentPassword, newPassword } = req.body;
        const profileFile = './data/admin-profile.json';
        
        let profile = {};
        if (fs.existsSync(profileFile)) {
            const data = fs.readFileSync(profileFile, 'utf8');
            profile = JSON.parse(data);
        }
        
        // Verify current password
        if (profile.password !== currentPassword) {
            return res.json({ success: false, error: 'Current password is incorrect' });
        }
        
        // Update username
        profile.username = username;
        
        // Update password if provided
        if (newPassword) {
            profile.password = newPassword;
        }
        
        fs.writeFileSync(profileFile, JSON.stringify(profile, null, 2));
        
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Update admin login API to use profile data
app.post('/api/ordering/admin-login', (req, res) => {
    try {
        const { username, password } = req.body;
        const profileFile = './data/admin-profile.json';
        
        let adminCredentials = { username: 'admin', password: 'admin123' };
        
        if (fs.existsSync(profileFile)) {
            const data = fs.readFileSync(profileFile, 'utf8');
            const profile = JSON.parse(data);
            adminCredentials = {
                username: profile.username || 'admin',
                password: profile.password || 'admin123'
            };
        }
        
        if (username === adminCredentials.username && password === adminCredentials.password) {
            res.json({ success: true });
        } else {
            res.json({ success: false, message: 'Invalid credentials' });
        }
    } catch (error) {
        res.json({ success: false, message: 'Login failed' });
    }
});

// API: Add menu item
app.post('/api/ordering/admin/add-menu-item', (req, res) => {
    try {
        const newItem = req.body;
        const menuFile = './data/menu.json';
        
        let items = JSON.parse(fs.readFileSync(menuFile, 'utf8'));
        items.push(newItem);
        
        fs.writeFileSync(menuFile, JSON.stringify(items, null, 2));
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// API: Update menu item
app.post('/api/ordering/admin/update-menu-item', (req, res) => {
    try {
        const updatedItem = req.body;
        const menuFile = './data/menu.json';
        
        let items = JSON.parse(fs.readFileSync(menuFile, 'utf8'));
        const index = items.findIndex(item => item.id === updatedItem.id);
        
        if (index !== -1) {
            items[index] = updatedItem;
            fs.writeFileSync(menuFile, JSON.stringify(items, null, 2));
            res.json({ success: true });
        } else {
            res.json({ success: false, error: 'Item not found' });
        }
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// API: Delete menu item
app.post('/api/ordering/admin/delete-menu-item', (req, res) => {
    try {
        const { id } = req.body;
        const menuFile = './data/menu.json';
        
        let items = JSON.parse(fs.readFileSync(menuFile, 'utf8'));
        items = items.filter(item => item.id !== id);
        
        fs.writeFileSync(menuFile, JSON.stringify(items, null, 2));
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// API: Update stock
app.post('/api/ordering/admin/update-stock', (req, res) => {
    try {
        const { itemId, addQty } = req.body;
        const menuFile = './data/menu.json';
        
        let items = JSON.parse(fs.readFileSync(menuFile, 'utf8'));
        const index = items.findIndex(item => item.id === itemId);
        
        if (index !== -1) {
            items[index].stock = (items[index].stock || 0) + addQty;
            fs.writeFileSync(menuFile, JSON.stringify(items, null, 2));
            res.json({ success: true });
        } else {
            res.json({ success: false, error: 'Item not found' });
        }
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// API: Get all orders
app.get('/api/ordering/admin/all-orders', (req, res) => {
    try {
        const ordersFile = './data/ordering-orders.json';
        let orders = [];
        
        if (fs.existsSync(ordersFile)) {
            const data = fs.readFileSync(ordersFile, 'utf8');
            if (data.trim()) {
                orders = JSON.parse(data);
            }
        }
        
        orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
        
        res.json({ success: true, orders });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// API: Daily report
app.get('/api/ordering/admin/daily-report', (req, res) => {
    try {
        const { date } = req.query;
        const ordersFile = './data/ordering-orders.json';
        
        let orders = [];
        if (fs.existsSync(ordersFile)) {
            const data = fs.readFileSync(ordersFile, 'utf8');
            if (data.trim()) {
                orders = JSON.parse(data);
            }
        }
        
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
app.get('/api/ordering/admin/monthly-report', (req, res) => {
    try {
        const { month, year } = req.query;
        const ordersFile = './data/ordering-orders.json';
        
        let orders = [];
        if (fs.existsSync(ordersFile)) {
            const data = fs.readFileSync(ordersFile, 'utf8');
            if (data.trim()) {
                orders = JSON.parse(data);
            }
        }
        
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
app.get('/api/ordering/admin/yearly-report', (req, res) => {
    try {
        const { year } = req.query;
        const ordersFile = './data/ordering-orders.json';
        
        let orders = [];
        if (fs.existsSync(ordersFile)) {
            const data = fs.readFileSync(ordersFile, 'utf8');
            if (data.trim()) {
                orders = JSON.parse(data);
            }
        }
        
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
app.get('/api/ordering/admin/employee-credits', (req, res) => {
    try {
        const empFile = './data/employees.json';
        const ordersFile = './data/ordering-orders.json';
        
        let employees = JSON.parse(fs.readFileSync(empFile, 'utf8'));
        
        let orders = [];
        if (fs.existsSync(ordersFile)) {
            const data = fs.readFileSync(ordersFile, 'utf8');
            if (data.trim()) {
                orders = JSON.parse(data);
            }
        }
        
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

// Start server - listen on all interfaces so others on same network can access
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
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