// Check if admin is logged in
const isAdmin = sessionStorage.getItem('orderingAdmin');
if (!isAdmin) {
    window.location.href = '/ordering-system';
}

let menuItems = [];
let allOrders = [];
let employees = [];

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadOverviewData();
    loadMenuItems();
    loadInventory();
    loadOrders();
    loadEmployeeCredits();
    
    // Set default date for daily report
    document.getElementById('dailyDate').value = new Date().toISOString().split('T')[0];
    
    // Set current month and year
    const now = new Date();
    document.getElementById('monthlyMonth').value = now.getMonth() + 1;
    document.getElementById('monthlyYear').value = now.getFullYear();
    document.getElementById('yearlyYear').value = now.getFullYear();
});

// Show section
function showSection(section) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.style.display = 'none';
    });
    
    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Show selected section
    document.getElementById(section + 'Section').style.display = 'block';
    
    // Load data based on section
    if (section === 'overview') {
        loadOverviewData();
    } else if (section === 'menu') {
        loadMenuItems();
    } else if (section === 'inventory') {
        loadInventory();
    } else if (section === 'orders') {
        loadOrders();
    } else if (section === 'credits') {
        loadEmployeeCredits();
    }
}

// ===== OVERVIEW SECTION =====

async function loadOverviewData() {
    try {
        const response = await fetch('/api/ordering/admin/overview');
        const result = await response.json();
        
        if (result.success) {
            document.getElementById('todaySales').textContent = `₱${result.todaySales.toFixed(2)}`;
            document.getElementById('todayOrders').textContent = result.todayOrders;
            document.getElementById('lowStock').textContent = result.lowStockItems;
            document.getElementById('totalCredits').textContent = `₱${result.totalCredits.toFixed(2)}`;
            
            displayRecentOrders(result.recentOrders || []);
        }
    } catch (error) {
        console.error('Error loading overview:', error);
    }
}

function displayRecentOrders(orders) {
    const recentDiv = document.getElementById('recentOrders');
    
    if (orders.length === 0) {
        recentDiv.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">No recent orders</p>';
        return;
    }
    
    recentDiv.innerHTML = '';
    orders.slice(0, 10).forEach(order => {
        const orderDiv = document.createElement('div');
        orderDiv.className = 'activity-item';
        orderDiv.innerHTML = `
            <div class="activity-info">
                <div class="activity-title">Order #${order.id} - ${order.customerName || order.employeeName || 'Customer'}</div>
                <div class="activity-details">₱${order.total.toFixed(2)} - ${order.paymentMethod}</div>
            </div>
            <div class="activity-time">${new Date(order.orderDate).toLocaleString()}</div>
        `;
        recentDiv.appendChild(orderDiv);
    });
}

// ===== MENU MANAGEMENT SECTION =====

async function loadMenuItems() {
    try {
        const response = await fetch('/api/ordering/menu-items');
        const result = await response.json();
        
        if (result.success) {
            menuItems = result.items;
            displayMenuTable();
        }
    } catch (error) {
        console.error('Error loading menu:', error);
    }
}

function displayMenuTable() {
    const tbody = document.getElementById('menuTableBody');
    tbody.innerHTML = '';
    
    menuItems.forEach(item => {
        const row = document.createElement('tr');
        const available = item.available !== false;
        const stock = item.stock || 0;
        
        row.innerHTML = `
            <td style="font-size: 2em;">${item.emoji}</td>
            <td>${item.name}</td>
            <td>${item.category.charAt(0).toUpperCase() + item.category.slice(1)}</td>
            <td>₱${item.price.toFixed(2)}</td>
            <td>${stock}</td>
            <td><span class="status-badge status-${available ? 'available' : 'unavailable'}">${available ? 'Available' : 'Unavailable'}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action btn-edit" onclick="editMenuItem(${item.id})">Edit</button>
                    <button class="btn-action btn-delete" onclick="deleteMenuItem(${item.id})">Delete</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function showAddMenuItem() {
    document.getElementById('menuModalTitle').textContent = 'Add Menu Item';
    document.getElementById('menuItemForm').reset();
    document.getElementById('itemId').value = '';
    document.getElementById('itemAvailable').checked = true;
    document.getElementById('menuItemModal').style.display = 'block';
}

function editMenuItem(itemId) {
    const item = menuItems.find(i => i.id === itemId);
    if (!item) return;
    
    document.getElementById('menuModalTitle').textContent = 'Edit Menu Item';
    document.getElementById('itemId').value = item.id;
    document.getElementById('itemName').value = item.name;
    document.getElementById('itemEmoji').value = item.emoji;
    document.getElementById('itemCategory').value = item.category;
    document.getElementById('itemPrice').value = item.price;
    document.getElementById('itemStock').value = item.stock || 0;
    document.getElementById('itemMinStock').value = item.minStock || 5;
    document.getElementById('itemAvailable').checked = item.available !== false;
    
    document.getElementById('menuItemModal').style.display = 'block';
}

async function deleteMenuItem(itemId) {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    
    try {
        const response = await fetch('/api/ordering/admin/delete-menu-item', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: itemId })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Menu item deleted successfully!');
            loadMenuItems();
        } else {
            alert('Error deleting item');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error deleting item');
    }
}

function closeMenuItemModal() {
    document.getElementById('menuItemModal').style.display = 'none';
}

// Menu item form submission
document.getElementById('menuItemForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const itemIdInput = document.getElementById('itemId').value;
    const itemId = itemIdInput ? parseInt(itemIdInput) : Date.now();
    
    const itemData = {
        id: itemId,
        name: document.getElementById('itemName').value.trim(),
        emoji: document.getElementById('itemEmoji').value.trim(),
        category: document.getElementById('itemCategory').value,
        price: parseFloat(document.getElementById('itemPrice').value),
        stock: parseInt(document.getElementById('itemStock').value),
        minStock: parseInt(document.getElementById('itemMinStock').value),
        available: document.getElementById('itemAvailable').checked
    };
    
    console.log('Submitting item data:', itemData); // Debug log
    
    try {
        const url = itemIdInput ? '/api/ordering/admin/update-menu-item' : '/api/ordering/admin/add-menu-item';
        console.log('Using URL:', url); // Debug log
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(itemData)
        });
        
        const result = await response.json();
        console.log('Server response:', result); // Debug log
        
        if (result.success) {
            alert(itemIdInput ? 'Menu item updated successfully!' : 'Menu item added successfully!');
            await loadMenuItems();
            await loadInventory();
            closeMenuItemModal();
        } else {
            alert('Error saving menu item: ' + (result.error || 'Unknown error'));
            console.error('Save error:', result);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error saving menu item: ' + error.message);
    }
});

// ===== INVENTORY SECTION =====

async function loadInventory() {
    try {
        const response = await fetch('/api/ordering/menu-items');
        const result = await response.json();
        
        if (result.success) {
            displayInventoryTable(result.items);
            populateStockSelect(result.items);
        }
    } catch (error) {
        console.error('Error loading inventory:', error);
    }
}

function displayInventoryTable(items) {
    const tbody = document.getElementById('inventoryTableBody');
    tbody.innerHTML = '';
    
    items.forEach(item => {
        const stock = item.stock || 0;
        const minStock = item.minStock || 5;
        const status = stock === 0 ? 'Out of Stock' : (stock <= minStock ? 'Low Stock' : 'OK');
        const statusClass = stock === 0 ? 'unavailable' : (stock <= minStock ? 'low' : 'ok');
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${stock}</td>
            <td>${minStock}</td>
            <td><span class="status-badge status-${statusClass}">${status}</span></td>
            <td>${new Date().toLocaleDateString()}</td>
            <td>
                <button class="btn-action btn-stock" onclick="quickUpdateStock(${item.id})">+ Add Stock</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function populateStockSelect(items) {
    const select = document.getElementById('stockItemSelect');
    select.innerHTML = '<option value="">Select an item</option>';
    
    items.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = item.name;
        option.dataset.stock = item.stock || 0;
        select.appendChild(option);
    });
}

function showUpdateStockModal() {
    document.getElementById('updateStockModal').style.display = 'block';
}

function closeUpdateStockModal() {
    document.getElementById('updateStockModal').style.display = 'none';
    document.getElementById('updateStockForm').reset();
}

function quickUpdateStock(itemId) {
    const item = menuItems.find(i => i.id === itemId);
    if (!item) return;
    
    const addQty = prompt(`Current stock: ${item.stock || 0}\n\nHow many to add?`);
    if (addQty === null || addQty === '') return;
    
    const qty = parseInt(addQty);
    if (isNaN(qty) || qty <= 0) {
        alert('Invalid quantity');
        return;
    }
    
    updateStock(itemId, qty);
}

// Stock item select change
document.getElementById('stockItemSelect').addEventListener('change', function() {
    const selectedOption = this.options[this.selectedIndex];
    if (selectedOption.value) {
        document.getElementById('currentStock').textContent = selectedOption.dataset.stock;
    } else {
        document.getElementById('currentStock').textContent = '0';
    }
});

// Update stock form submission
document.getElementById('updateStockForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const itemId = parseInt(document.getElementById('stockItemSelect').value);
    const addQty = parseInt(document.getElementById('addStock').value);
    
    await updateStock(itemId, addQty);
    closeUpdateStockModal();
});

async function updateStock(itemId, addQty) {
    try {
        const response = await fetch('/api/ordering/admin/update-stock', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ itemId, addQty })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Stock updated successfully!');
            loadInventory();
            loadMenuItems();
        } else {
            alert('Error updating stock');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error updating stock');
    }
}

// ===== ORDERS SECTION =====

async function loadOrders() {
    try {
        const response = await fetch('/api/ordering/admin/all-orders');
        const result = await response.json();
        
        if (result.success) {
            allOrders = result.orders;
            displayOrdersTable(allOrders);
        }
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

function displayOrdersTable(orders) {
    const tbody = document.getElementById('ordersTableBody');
    tbody.innerHTML = '';
    
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">No orders found</td></tr>';
        return;
    }
    
    orders.forEach(order => {
        const row = document.createElement('tr');
        const customerName = order.customerName || order.employeeName || 'Customer';
        const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
        
        row.innerHTML = `
            <td>#${order.id}</td>
            <td>${customerName}</td>
            <td>${itemCount} items</td>
            <td>₱${order.total.toFixed(2)}</td>
            <td>${order.paymentMethod === 'wallet' ? '💰 Wallet' : order.paymentMethod === 'credit' ? '💳 Credit' : '💵 Cash'}</td>
            <td>${new Date(order.orderDate).toLocaleString()}</td>
            <td>
                <button class="btn-action btn-view" onclick="viewOrderDetails(${order.id})">View</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function filterOrders() {
    const filter = document.getElementById('orderFilter').value;
    const now = new Date();
    let filtered = allOrders;
    
    if (filter === 'today') {
        const today = now.toDateString();
        filtered = allOrders.filter(o => new Date(o.orderDate).toDateString() === today);
    } else if (filter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = allOrders.filter(o => new Date(o.orderDate) >= weekAgo);
    } else if (filter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = allOrders.filter(o => new Date(o.orderDate) >= monthAgo);
    }
    
    displayOrdersTable(filtered);
}

function viewOrderDetails(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;
    
    const customerName = order.customerName || order.employeeName || 'Customer';
    
    let itemsHTML = '';
    order.items.forEach(item => {
        itemsHTML += `
            <div class="item-detail">
                <span>${item.name} x${item.quantity}</span>
                <span>₱${(item.price * item.quantity).toFixed(2)}</span>
            </div>
        `;
    });
    
    const detailsContent = document.getElementById('orderDetailsContent');
    detailsContent.innerHTML = `
        <div class="order-detail-grid">
            <div class="detail-row">
                <span class="detail-label">Order ID:</span>
                <span class="detail-value">#${order.id}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Customer:</span>
                <span class="detail-value">${customerName}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Date & Time:</span>
                <span class="detail-value">${new Date(order.orderDate).toLocaleString()}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Payment Method:</span>
                <span class="detail-value">${order.paymentMethod}</span>
            </div>
            ${order.amountPaid ? `
            <div class="detail-row">
                <span class="detail-label">Amount Paid:</span>
                <span class="detail-value">₱${order.amountPaid.toFixed(2)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Change:</span>
                <span class="detail-value">₱${(order.change || 0).toFixed(2)}</span>
            </div>
            ` : ''}
        </div>
        
        <div class="order-items-detail">
            <h4>Order Items</h4>
            ${itemsHTML}
            <div class="detail-row" style="margin-top: 15px; font-size: 1.3em; font-weight: 700;">
                <span class="detail-label">Total:</span>
                <span class="detail-value">₱${order.total.toFixed(2)}</span>
            </div>
        </div>
    `;
    
    document.getElementById('orderDetailsModal').style.display = 'block';
}

function closeOrderDetailsModal() {
    document.getElementById('orderDetailsModal').style.display = 'none';
}

// ===== REPORTS SECTION =====

function showReport(type) {
    // Update active tab
    document.querySelectorAll('.report-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Hide all report panels
    document.querySelectorAll('.report-panel').forEach(panel => {
        panel.style.display = 'none';
    });
    
    // Show selected panel
    document.getElementById(type + 'Report').style.display = 'block';
}

async function generateDailyReport() {
    const date = document.getElementById('dailyDate').value;
    if (!date) {
        alert('Please select a date');
        return;
    }
    
    try {
        const response = await fetch(`/api/ordering/admin/daily-report?date=${date}`);
        const result = await response.json();
        
        if (result.success) {
            displayDailyReport(result.report);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error generating report');
    }
}

function displayDailyReport(report) {
    const content = document.getElementById('dailyReportContent');
    
    const reportDate = document.getElementById('dailyDate').value;
    const formattedDate = new Date(reportDate).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    content.innerHTML = `
        <div class="report-header-section">
            <div class="report-title-area">
                <h2>CLIMBS Canteen Daily Sales Report</h2>
                <p class="report-date">${formattedDate}</p>
            </div>
            <button class="btn btn-print no-print" onclick="printDailyReport()">🖨️ Print Report</button>
        </div>
        
        <div class="report-summary">
            <div class="report-stat">
                <div class="report-stat-value">${report.totalOrders}</div>
                <div class="report-stat-label">Total Orders</div>
            </div>
            <div class="report-stat">
                <div class="report-stat-value">₱${report.totalSales.toFixed(2)}</div>
                <div class="report-stat-label">Total Sales</div>
            </div>
            <div class="report-stat">
                <div class="report-stat-value">₱${report.averageOrder.toFixed(2)}</div>
                <div class="report-stat-label">Average Order</div>
            </div>
        </div>
        
        <h4 style="margin-top: 30px; color: #667eea;">Top Selling Items</h4>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Quantity Sold</th>
                    <th>Revenue</th>
                </tr>
            </thead>
            <tbody>
                ${report.topItems.length > 0 ? report.topItems.map(item => `
                    <tr>
                        <td>${item.name}</td>
                        <td>${item.quantity}</td>
                        <td>₱${item.revenue.toFixed(2)}</td>
                    </tr>
                `).join('') : '<tr><td colspan="3" style="text-align: center;">No sales for this date</td></tr>'}
            </tbody>
        </table>
        
        <div class="report-footer no-print">
            <p>Report generated on ${new Date().toLocaleString()}</p>
        </div>
    `;
}

// Add print function for daily report
function printDailyReport() {
    const reportDate = document.getElementById('dailyDate').value;
    const formattedDate = new Date(reportDate).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    // Get the report content
    const reportContent = document.getElementById('dailyReportContent').innerHTML;
    
    // Create print window
    const printWindow = window.open('', '', 'width=800,height=600');
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Daily Sales Report - ${formattedDate}</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    padding: 40px;
                    max-width: 800px;
                    margin: 0 auto;
                }
                .report-header-section {
                    text-align: center;
                    margin-bottom: 40px;
                    border-bottom: 3px solid #667eea;
                    padding-bottom: 20px;
                }
                .report-title-area h2 {
                    color: #667eea;
                    margin: 0 0 10px 0;
                    font-size: 2em;
                }
                .report-date {
                    color: #666;
                    font-size: 1.2em;
                    margin: 0;
                }
                .report-summary {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 20px;
                    margin-bottom: 40px;
                }
                .report-stat {
                    background: linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%);
                    padding: 25px;
                    border-radius: 12px;
                    text-align: center;
                    border: 2px solid #667eea;
                }
                .report-stat-value {
                    font-size: 2.5em;
                    font-weight: 700;
                    color: #667eea;
                    margin-bottom: 8px;
                }
                .report-stat-label {
                    color: #666;
                    font-size: 0.95em;
                }
                h4 {
                    color: #667eea;
                    margin-top: 30px;
                    margin-bottom: 15px;
                    font-size: 1.3em;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                }
                th, td {
                    padding: 12px 15px;
                    text-align: left;
                    border-bottom: 1px solid #eee;
                }
                th {
                    background: #667eea;
                    color: white;
                    font-weight: 600;
                }
                tbody tr:hover {
                    background: #f8f9fa;
                }
                .report-footer {
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 2px solid #eee;
                    text-align: center;
                    color: #666;
                    font-size: 0.9em;
                }
                .no-print {
                    display: none;
                }
                @media print {
                    .no-print {
                        display: none !important;
                    }
                }
            </style>
        </head>
        <body>
            ${reportContent}
            <div class="report-footer">
                <p><strong>CLIMBS Life and General Insurance Cooperative</strong></p>
                <p>Canteen Management System</p>
                <p>Report generated on ${new Date().toLocaleString()}</p>
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load then print
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
}

async function generateMonthlyReport() {
    const month = document.getElementById('monthlyMonth').value;
    const year = document.getElementById('monthlyYear').value;
    
    try {
        const response = await fetch(`/api/ordering/admin/monthly-report?month=${month}&year=${year}`);
        const result = await response.json();
        
        if (result.success) {
            displayMonthlyReport(result.report);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error generating report');
    }
}

function displayMonthlyReport(report) {
    const content = document.getElementById('monthlyReportContent');
    
    content.innerHTML = `
        <div class="report-summary">
            <div class="report-stat">
                <div class="report-stat-value">${report.totalOrders}</div>
                <div class="report-stat-label">Total Orders</div>
            </div>
            <div class="report-stat">
                <div class="report-stat-value">₱${report.totalSales.toFixed(2)}</div>
                <div class="report-stat-label">Total Sales</div>
            </div>
            <div class="report-stat">
                <div class="report-stat-value">₱${report.averageOrder.toFixed(2)}</div>
                <div class="report-stat-label">Average Order</div>
            </div>
            <div class="report-stat">
                <div class="report-stat-value">${report.averageDaily.toFixed(0)}</div>
                <div class="report-stat-label">Avg Orders/Day</div>
            </div>
        </div>
        
        <h4 style="margin-top: 30px; color: #667eea;">Monthly Performance</h4>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Metric</th>
                    <th>Value</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Total Revenue</td>
                    <td>₱${report.totalSales.toFixed(2)}</td>
                </tr>
                <tr>
                    <td>Cash Payments</td>
                    <td>₱${report.cashPayments.toFixed(2)}</td>
                </tr>
                <tr>
                    <td>Wallet Payments</td>
                    <td>₱${report.walletPayments.toFixed(2)}</td>
                </tr>
                <tr>
                    <td>Credit Payments</td>
                    <td>₱${report.creditPayments.toFixed(2)}</td>
                </tr>
            </tbody>
        </table>
    `;
}

async function generateYearlyReport() {
    const year = document.getElementById('yearlyYear').value;
    
    try {
        const response = await fetch(`/api/ordering/admin/yearly-report?year=${year}`);
        const result = await response.json();
        
        if (result.success) {
            displayYearlyReport(result.report);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error generating report');
    }
}

function displayYearlyReport(report) {
    const content = document.getElementById('yearlyReportContent');
    
    content.innerHTML = `
        <div class="report-summary">
            <div class="report-stat">
                <div class="report-stat-value">${report.totalOrders}</div>
                <div class="report-stat-label">Total Orders</div>
            </div>
            <div class="report-stat">
                <div class="report-stat-value">₱${report.totalSales.toFixed(2)}</div>
                <div class="report-stat-label">Total Sales</div>
            </div>
            <div class="report-stat">
                <div class="report-stat-value">₱${report.averageMonthly.toFixed(2)}</div>
                <div class="report-stat-label">Avg Monthly Sales</div>
            </div>
        </div>
        
        <h4 style="margin-top: 30px; color: #667eea;">Monthly Breakdown</h4>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Month</th>
                    <th>Orders</th>
                    <th>Sales</th>
                </tr>
            </thead>
            <tbody>
                ${report.monthlyData.map(month => `
                    <tr>
                        <td>${month.name}</td>
                        <td>${month.orders}</td>
                        <td>₱${month.sales.toFixed(2)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// ===== EMPLOYEE CREDITS SECTION =====

async function loadEmployeeCredits() {
    try {
        const response = await fetch('/api/ordering/admin/employee-credits');
        const result = await response.json();
        
        if (result.success) {
            displayEmployeeCredits(result.credits);
        }
    } catch (error) {
        console.error('Error loading credits:', error);
    }
}

function displayEmployeeCredits(credits) {
    const tbody = document.getElementById('creditsTableBody');
    tbody.innerHTML = '';
    
    if (credits.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;">No employee credits</td></tr>';
        return;
    }
    
    credits.forEach(credit => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${credit.empId}</td>
            <td>${credit.employeeName}</td>
            <td>₱${credit.creditBalance.toFixed(2)}</td>
            <td>${credit.lastTransaction ? new Date(credit.lastTransaction).toLocaleString() : 'N/A'}</td>
            <td>
                <button class="btn-action btn-view" onclick="viewCreditDetails('${credit.empId}')">View Details</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function viewCreditDetails(empId) {
    alert(`Credit details for ${empId} - Feature coming soon!`);
}

// Logout
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.removeItem('orderingAdmin');
        window.location.href = '/ordering-system';
    }
}

// Close modals when clicking outside
window.onclick = function(event) {
    const menuModal = document.getElementById('menuItemModal');
    const stockModal = document.getElementById('updateStockModal');
    const orderModal = document.getElementById('orderDetailsModal');
    
    if (event.target === menuModal) {
        closeMenuItemModal();
    }
    if (event.target === stockModal) {
        closeUpdateStockModal();
    }
    if (event.target === orderModal) {
        closeOrderDetailsModal();
    }
}