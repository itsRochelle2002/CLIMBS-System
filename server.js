const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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
            { id: 1, name: 'Chicken Adobo', price: 85, category: 'meals', emoji: '🍗' },
            { id: 2, name: 'Pork Sinigang', price: 90, category: 'meals', emoji: '🍲' },
            { id: 3, name: 'Beef Tapa', price: 95, category: 'meals', emoji: '🥩' },
            { id: 4, name: 'Iced Coffee', price: 45, category: 'drinks', emoji: '☕' },
            { id: 5, name: 'Fresh Juice', price: 40, category: 'drinks', emoji: '🧃' },
            { id: 6, name: 'Lumpia', price: 35, category: 'snacks', emoji: '🥟' }
        ];
        fs.writeFileSync(menuFile, JSON.stringify(defaultMenu, null, 2));
    }
}

// Initialize menu on server start
initializeMenu();

// ============ ROUTES ============

app.get('/', (req, res) => {
    res.render('index');
});

// Membership routes
app.get('/membership', (req, res) => {
    res.render('membership-login');
});

app.get('/membership-register', (req, res) => {
    res.render('membership');
});

app.get('/member-dashboard', (req, res) => {
    res.render('member-dashboard');
});

app.get('/admin-dashboard', (req, res) => {
    res.render('admin-dashboard');
});

app.get('/member-register', (req, res) => {
    res.render('member-register');
});

// Ordering routes
app.get('/ordering', (req, res) => {
    res.render('ordering');
});

// ============ MEMBERSHIP APIs ============

// API: Member Login
app.post('/api/membership/login', (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Read members
        const membersFile = './data/members.json';
        let members = [];
        
        if (fs.existsSync(membersFile)) {
            const data = fs.readFileSync(membersFile, 'utf8');
            if (data.trim()) {
                members = JSON.parse(data);
            }
        }
        
        // Find member
        const member = members.find(m => m.email === email && m.password === password);
        
        if (member) {
            // Return member without password
            const { password, ...memberData } = member;
            
            res.json({ 
                success: true, 
                member: memberData,
                message: 'Login successful' 
            });
        } else {
            res.json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
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
        
        // Default admin credentials
        const adminUsername = 'admin';
        const adminPassword = 'admin123';
        
        if (username === adminUsername && password === adminPassword) {
            res.json({ 
                success: true, 
                message: 'Admin login successful' 
            });
        } else {
            res.json({ 
                success: false, 
                message: 'Invalid admin credentials' 
            });
        }
        
    } catch (error) {
        console.error('Admin login error:', error);
        res.json({ success: false, message: 'Login failed' });
    }
});

// API: Save membership registration
app.post('/api/membership/register', (req, res) => {
    try {
        console.log('Received data:', req.body);
        
        const memberData = req.body;
        
        // Validate that we received data
        if (!memberData || Object.keys(memberData).length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'No data received' 
            });
        }
        
        // Read existing members
        let members = [];
        const filePath = './data/members.json';
        
        if (fs.existsSync(filePath)) {
            try {
                const data = fs.readFileSync(filePath, 'utf8');
                if (data.trim()) {
                    members = JSON.parse(data);
                }
            } catch (parseError) {
                console.log('Creating new members array');
                members = [];
            }
        }
        
        // Check if email already exists
        const emailExists = members.find(m => m.email === memberData.email);
        if (emailExists) {
            return res.json({
                success: false,
                error: 'Email already registered'
            });
        }
        
        // Add new member with ID
        memberData.id = members.length + 1;
        memberData.registrationDate = new Date().toISOString();
        memberData.status = 'pending'; // Default status
        members.push(memberData);
        
        // Save to file
        fs.writeFileSync(filePath, JSON.stringify(members, null, 2));
        
        console.log('Member saved successfully:', memberData.id);
        
        res.json({ 
            success: true, 
            memberId: memberData.id,
            message: 'Registration saved successfully!' 
        });
        
    } catch (error) {
        console.error('Error saving member:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// API: Get all members (Admin only)
app.get('/api/membership/all-members', (req, res) => {
    try {
        const membersFile = './data/members.json';
        let members = [];
        
        if (fs.existsSync(membersFile)) {
            const data = fs.readFileSync(membersFile, 'utf8');
            if (data.trim()) {
                members = JSON.parse(data);
                // Remove passwords from response
                members = members.map(({ password, ...member }) => member);
            }
        }
        
        res.json({ success: true, members });
    } catch (error) {
        console.error('Error loading members:', error);
        res.json({ success: false, error: error.message });
    }
});

// API: Verify member (Admin only)
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
        
        // Find and update member status
        const memberIndex = members.findIndex(m => m.id === memberId);
        if (memberIndex !== -1) {
            members[memberIndex].status = 'verified';
            members[memberIndex].verifiedDate = new Date().toISOString();
            
            // Save to file
            fs.writeFileSync(membersFile, JSON.stringify(members, null, 2));
            
            res.json({ success: true, message: 'Member verified successfully' });
        } else {
            res.json({ success: false, error: 'Member not found' });
        }
        
    } catch (error) {
        console.error('Error verifying member:', error);
        res.json({ success: false, error: error.message });
    }
});

// ============ MENU APIs ============

// API: Get all menu items
app.get('/api/menu/items', (req, res) => {
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
        console.error('Error loading menu:', error);
        res.json({ success: false, error: error.message });
    }
});

// API: Add menu item
app.post('/api/menu/add', (req, res) => {
    try {
        const newItem = req.body;
        const menuFile = './data/menu.json';
        
        let items = [];
        if (fs.existsSync(menuFile)) {
            const data = fs.readFileSync(menuFile, 'utf8');
            if (data.trim()) {
                items = JSON.parse(data);
            }
        }
        
        // Add new item
        items.push(newItem);
        
        // Save to file
        fs.writeFileSync(menuFile, JSON.stringify(items, null, 2));
        
        res.json({ success: true, message: 'Item added successfully' });
    } catch (error) {
        console.error('Error adding item:', error);
        res.json({ success: false, error: error.message });
    }
});

// API: Update menu item
app.post('/api/menu/update', (req, res) => {
    try {
        const updatedItem = req.body;
        const menuFile = './data/menu.json';
        
        let items = [];
        if (fs.existsSync(menuFile)) {
            const data = fs.readFileSync(menuFile, 'utf8');
            if (data.trim()) {
                items = JSON.parse(data);
            }
        }
        
        // Find and update item
        const index = items.findIndex(item => item.id === updatedItem.id);
        if (index !== -1) {
            items[index] = updatedItem;
            fs.writeFileSync(menuFile, JSON.stringify(items, null, 2));
            res.json({ success: true, message: 'Item updated successfully' });
        } else {
            res.json({ success: false, error: 'Item not found' });
        }
    } catch (error) {
        console.error('Error updating item:', error);
        res.json({ success: false, error: error.message });
    }
});

// API: Delete menu item
app.post('/api/menu/delete', (req, res) => {
    try {
        const { id } = req.body;
        const menuFile = './data/menu.json';
        
        let items = [];
        if (fs.existsSync(menuFile)) {
            const data = fs.readFileSync(menuFile, 'utf8');
            if (data.trim()) {
                items = JSON.parse(data);
            }
        }
        
        // Filter out the deleted item
        items = items.filter(item => item.id !== id);
        
        // Save to file
        fs.writeFileSync(menuFile, JSON.stringify(items, null, 2));
        
        res.json({ success: true, message: 'Item deleted successfully' });
    } catch (error) {
        console.error('Error deleting item:', error);
        res.json({ success: false, error: error.message });
    }
});

// ============ ORDERS APIs ============

// API: Create order
app.post('/api/orders/create', (req, res) => {
    try {
        console.log('Received order:', req.body);
        
        const orderData = req.body;
        
        // Validate order data
        if (!orderData || !orderData.items || orderData.items.length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'No items in order' 
            });
        }
        
        // Read existing orders
        let orders = [];
        const filePath = './data/orders.json';
        
        if (fs.existsSync(filePath)) {
            try {
                const data = fs.readFileSync(filePath, 'utf8');
                if (data.trim()) {
                    orders = JSON.parse(data);
                }
            } catch (parseError) {
                console.log('Creating new orders array');
                orders = [];
            }
        }
        
        // Add new order with ID
        orderData.id = orders.length + 1;
        orders.push(orderData);
        
        // Save to file
        fs.writeFileSync(filePath, JSON.stringify(orders, null, 2));
        
        console.log('Order saved successfully:', orderData.id);
        
        res.json({ 
            success: true, 
            orderId: orderData.id,
            message: 'Order placed successfully!' 
        });
        
    } catch (error) {
        console.error('Error saving order:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('Press Ctrl+C to stop the server');
});