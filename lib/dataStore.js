/**
 * Unified data layer: uses PostgreSQL when DATABASE_URL is set (e.g. on Render), otherwise uses JSON files.
 * All functions are async and return the same shape so server.js can use one code path.
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const FILES = {
    members: path.join(DATA_DIR, 'members.json'),
    menu: path.join(DATA_DIR, 'menu.json'),
    employees: path.join(DATA_DIR, 'employees.json'),
    orderingOrders: path.join(DATA_DIR, 'ordering-orders.json'),
    adminProfile: path.join(DATA_DIR, 'admin-profile.json')
};

const useDb = !!process.env.DATABASE_URL;
let db = null;

if (useDb) {
    db = require('./database.js');
}

function readJson(filePath, defaultVal = []) {
    if (!fs.existsSync(filePath)) return defaultVal;
    const data = fs.readFileSync(filePath, 'utf8');
    if (!data.trim()) return defaultVal;
    try {
        return JSON.parse(data);
    } catch (e) {
        return defaultVal;
    }
}

function writeJson(filePath, data) {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

async function init() {
    if (useDb && db) {
        await db.init();
        return;
    }
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(FILES.menu)) {
        const defaultMenu = [
            { id: 1, name: 'Chicken Adobo', price: 85, category: 'meals', emoji: '🍗', stock: 50, minStock: 10, available: true },
            { id: 2, name: 'Pork Sinigang', price: 90, category: 'meals', emoji: '🍲', stock: 40, minStock: 10, available: true },
            { id: 3, name: 'Beef Tapa', price: 95, category: 'meals', emoji: '🥩', stock: 35, minStock: 10, available: true },
            { id: 4, name: 'Iced Coffee', price: 45, category: 'drinks', emoji: '☕', stock: 100, minStock: 20, available: true },
            { id: 5, name: 'Fresh Juice', price: 40, category: 'drinks', emoji: '🧃', stock: 80, minStock: 15, available: true },
            { id: 6, name: 'Lumpia', price: 35, category: 'snacks', emoji: '🥟', stock: 60, minStock: 15, available: true }
        ];
        writeJson(FILES.menu, defaultMenu);
    }
    if (!fs.existsSync(FILES.employees)) {
        writeJson(FILES.employees, [
            { empId: 'EMP001', name: 'Juan Dela Cruz', password: 'emp123', walletBalance: 500, creditBalance: 0 },
            { empId: 'EMP002', name: 'Maria Santos', password: 'emp123', walletBalance: 300, creditBalance: 0 },
            { empId: 'EMP003', name: 'Pedro Garcia', password: 'emp123', walletBalance: 450, creditBalance: 0 }
        ]);
    }
    if (!fs.existsSync(FILES.orderingOrders)) writeJson(FILES.orderingOrders, []);
    if (!fs.existsSync(FILES.adminProfile)) {
        writeJson(FILES.adminProfile, {
            fullName: 'Administrator',
            email: 'admin@climbs.com',
            phone: '',
            address: '',
            username: 'admin',
            password: 'admin123',
            profileImage: '',
            accountCreated: new Date().toISOString()
        });
    }
}

// ---- Members ----
async function getMembers() {
    if (useDb && db) {
        const { rows } = await db.query('SELECT id, data FROM members ORDER BY id');
        return rows.map(r => ({ id: r.id, ...r.data }));
    }
    return readJson(FILES.members, []);
}

async function saveMembers(members) {
    if (useDb && db) {
        await db.query('DELETE FROM members');
        for (let i = 0; i < members.length; i++) {
            const m = members[i];
            const id = m.id != null ? m.id : i + 1;
            const { ...data } = m;
            data.id = id;
            await db.query('INSERT INTO members (id, data) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET data = $2', [id, JSON.stringify(data)]);
        }
        return;
    }
    writeJson(FILES.members, members);
}

// ---- Menu ----
async function getMenu() {
    if (useDb && db) {
        const { rows } = await db.query('SELECT id, data FROM menu_items ORDER BY id');
        return rows.map(r => ({ ...r.data, id: Number(r.id) }));
    }
    return readJson(FILES.menu, []);
}

async function saveMenu(items) {
    if (useDb && db) {
        for (const item of items) {
            const id = item.id != null ? item.id : Date.now();
            await db.query('INSERT INTO menu_items (id, data) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET data = $2', [id, JSON.stringify({ ...item, id })]);
        }
        return;
    }
    writeJson(FILES.menu, items);
}

// ---- Employees ----
async function getEmployees() {
    if (useDb && db) {
        const { rows } = await db.query('SELECT emp_id, data FROM employees');
        return rows.map(r => ({ ...r.data, empId: r.emp_id }));
    }
    return readJson(FILES.employees, []);
}

async function saveEmployees(employees) {
    if (useDb && db) {
        for (const e of employees) {
            await db.query('INSERT INTO employees (emp_id, data) VALUES ($1, $2) ON CONFLICT (emp_id) DO UPDATE SET data = $2', [e.empId, JSON.stringify(e)]);
        }
        return;
    }
    writeJson(FILES.employees, employees);
}

// ---- Orders ----
async function getOrders() {
    if (useDb && db) {
        const { rows } = await db.query('SELECT id, data FROM ordering_orders ORDER BY id');
        return rows.map(r => ({ id: r.id, ...r.data }));
    }
    return readJson(FILES.orderingOrders, []);
}

async function addOrder(order) {
    if (useDb && db) {
        const { rows: maxRow } = await db.query('SELECT COALESCE(MAX(id), 0) AS mx FROM ordering_orders');
        const nextId = (maxRow[0].mx || 0) + 1;
        const data = { ...order, id: nextId };
        await db.query('INSERT INTO ordering_orders (id, data) VALUES ($1, $2)', [nextId, JSON.stringify(data)]);
        return nextId;
    }
    const orders = readJson(FILES.orderingOrders, []);
    order.id = orders.length + 1;
    orders.push(order);
    writeJson(FILES.orderingOrders, orders);
    return order.id;
}

async function saveOrders(orders) {
    if (useDb && db) {
        await db.query('DELETE FROM ordering_orders');
        for (const o of orders) {
            await db.query('INSERT INTO ordering_orders (id, data) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET data = $2', [o.id, JSON.stringify(o)]);
        }
        return;
    }
    writeJson(FILES.orderingOrders, orders);
}

// ---- Admin profile ----
async function getAdminProfile() {
    if (useDb && db) {
        const { rows } = await db.query('SELECT data FROM admin_profile WHERE id = 1');
        return rows.length ? rows[0].data : {};
    }
    return readJson(FILES.adminProfile, {});
}

async function saveAdminProfile(profile) {
    if (useDb && db) {
        await db.query('INSERT INTO admin_profile (id, data) VALUES (1, $1) ON CONFLICT (id) DO UPDATE SET data = $1', [JSON.stringify(profile)]);
        return;
    }
    writeJson(FILES.adminProfile, profile);
}

module.exports = {
    init,
    getMembers,
    saveMembers,
    getMenu,
    saveMenu,
    getEmployees,
    saveEmployees,
    getOrders,
    addOrder,
    saveOrders,
    getAdminProfile,
    saveAdminProfile,
    useDb
};
