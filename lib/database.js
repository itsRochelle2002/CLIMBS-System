/**
 * PostgreSQL database for Render. Uses DATABASE_URL from environment.
 * Creates tables and provides query helpers. Used by dataStore.js when DATABASE_URL is set.
 */
const { Pool } = require('pg');

let pool = null;

function getPool() {
    if (!pool) {
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) return null;
        pool = new Pool({
            connectionString,
            ssl: connectionString.includes('render.com') ? { rejectUnauthorized: false } : false
        });
    }
    return pool;
}

async function query(text, params) {
    const p = getPool();
    if (!p) throw new Error('No database pool');
    return p.query(text, params);
}

async function init() {
    const p = getPool();
    if (!p) return;

    await query(`
        CREATE TABLE IF NOT EXISTS members (
            id SERIAL PRIMARY KEY,
            data JSONB NOT NULL DEFAULT '{}'
        )
    `);
    await query(`
        CREATE TABLE IF NOT EXISTS menu_items (
            id BIGINT PRIMARY KEY,
            data JSONB NOT NULL DEFAULT '{}'
        )
    `);
    await query(`
        CREATE TABLE IF NOT EXISTS employees (
            emp_id TEXT PRIMARY KEY,
            data JSONB NOT NULL DEFAULT '{}'
        )
    `);
    await query(`
        CREATE TABLE IF NOT EXISTS ordering_orders (
            id SERIAL PRIMARY KEY,
            data JSONB NOT NULL DEFAULT '{}'
        )
    `);
    await query(`
        CREATE TABLE IF NOT EXISTS admin_profile (
            id SERIAL PRIMARY KEY,
            data JSONB NOT NULL DEFAULT '{}'
        )
    `);

    const { rows: adminRows } = await query('SELECT id FROM admin_profile WHERE id = 1');
    if (adminRows.length === 0) {
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
        await query('INSERT INTO admin_profile (id, data) VALUES (1, $1)', [JSON.stringify(defaultProfile)]);
    }

    const { rows: menuRows } = await query('SELECT id FROM menu_items LIMIT 1');
    if (menuRows.length === 0) {
        const defaultMenu = [
            { id: 1, name: 'Chicken Adobo', price: 85, category: 'meals', emoji: '🍗', stock: 50, minStock: 10, available: true },
            { id: 2, name: 'Pork Sinigang', price: 90, category: 'meals', emoji: '🍲', stock: 40, minStock: 10, available: true },
            { id: 3, name: 'Beef Tapa', price: 95, category: 'meals', emoji: '🥩', stock: 35, minStock: 10, available: true },
            { id: 4, name: 'Iced Coffee', price: 45, category: 'drinks', emoji: '☕', stock: 100, minStock: 20, available: true },
            { id: 5, name: 'Fresh Juice', price: 40, category: 'drinks', emoji: '🧃', stock: 80, minStock: 15, available: true },
            { id: 6, name: 'Lumpia', price: 35, category: 'snacks', emoji: '🥟', stock: 60, minStock: 15, available: true }
        ];
        for (const item of defaultMenu) {
            await query('INSERT INTO menu_items (id, data) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING', [item.id, JSON.stringify(item)]);
        }
    }

    const { rows: empRows } = await query('SELECT emp_id FROM employees LIMIT 1');
    if (empRows.length === 0) {
        const defaultEmployees = [
            { empId: 'EMP001', name: 'Juan Dela Cruz', password: 'emp123', walletBalance: 500, creditBalance: 0 },
            { empId: 'EMP002', name: 'Maria Santos', password: 'emp123', walletBalance: 300, creditBalance: 0 },
            { empId: 'EMP003', name: 'Pedro Garcia', password: 'emp123', walletBalance: 450, creditBalance: 0 }
        ];
        for (const e of defaultEmployees) {
            await query('INSERT INTO employees (emp_id, data) VALUES ($1, $2) ON CONFLICT (emp_id) DO NOTHING', [e.empId, JSON.stringify(e)]);
        }
    }

    console.log('Database initialized (PostgreSQL)');
}

module.exports = { getPool, query, init };
