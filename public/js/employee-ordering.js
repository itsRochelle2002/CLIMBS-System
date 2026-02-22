// Check if employee is logged in
const employeeStr = sessionStorage.getItem('employee');
if (!employeeStr) {
    window.location.href = '/ordering-system';
}

const employee = JSON.parse(employeeStr);
let cart = [];
let menuItems = [];
let orderHistory = [];
let favorites = [];
let lastOrderId = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    displayEmployeeInfo();
    loadMenuItems();
    loadWalletBalance();
    loadOrderHistory();
    loadFavorites();
    loadCreditInfo();
    
    // Add payment method change listener
    document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
        radio.addEventListener('change', handlePaymentMethodChange);
    });
    
    // Add cash amount paid listener
    const cashInput = document.getElementById('cashAmountPaid');
    if (cashInput) {
        cashInput.addEventListener('input', calculateCashChange);
    }
});

// Display employee info
function displayEmployeeInfo() {
    document.getElementById('employeeBadge').textContent = `${employee.name} (${employee.empId})`;
}

// Handle payment method change
function handlePaymentMethodChange() {
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    const cashSection = document.getElementById('cashPaymentSection');
    
    if (paymentMethod === 'cash') {
        cashSection.style.display = 'block';
    } else {
        cashSection.style.display = 'none';
    }
}

// Calculate cash change
function calculateCashChange() {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const amountPaid = parseFloat(document.getElementById('cashAmountPaid').value) || 0;
    const change = amountPaid - total;
    
    const changeDisplay = document.getElementById('cashChange');
    if (change >= 0) {
        changeDisplay.textContent = `₱${change.toFixed(2)}`;
        changeDisplay.style.color = '#28a745';
    } else {
        changeDisplay.textContent = `₱${Math.abs(change).toFixed(2)} short`;
        changeDisplay.style.color = '#dc3545';
    }
}

// Load wallet balance
async function loadWalletBalance() {
    try {
        const response = await fetch(`/api/ordering/wallet-balance?empId=${employee.empId}`);
        const result = await response.json();
        
        if (result.success) {
            document.getElementById('walletBalance').textContent = `₱${result.balance.toFixed(2)}`;
        }
    } catch (error) {
        console.error('Error loading wallet:', error);
    }
}

// Load menu items
async function loadMenuItems() {
    try {
        const response = await fetch('/api/ordering/menu-items');
        const result = await response.json();
        
        if (result.success) {
            menuItems = result.items.filter(item => item.available !== false);
            displayMenuItems('all');
        }
    } catch (error) {
        console.error('Error loading menu:', error);
    }
}

// Display menu items
function displayMenuItems(category) {
    const menuGrid = document.getElementById('menuGrid');
    menuGrid.innerHTML = '';
    
    const filteredItems = category === 'all' 
        ? menuItems 
        : menuItems.filter(item => item.category === category);
    
    filteredItems.forEach(item => {
        const stock = item.stock || 0;
        const isOutOfStock = stock <= 0;
        
        const menuItemDiv = document.createElement('div');
        menuItemDiv.className = `menu-item ${isOutOfStock ? 'out-of-stock' : ''}`;
        menuItemDiv.innerHTML = `
            <div class="item-emoji">${item.emoji}</div>
            <div class="item-name">${item.name}</div>
            <div class="item-stock">Stock: ${stock}</div>
            <div class="item-price">₱${item.price.toFixed(2)}</div>
            ${!isOutOfStock ? `<button class="item-add-btn" onclick="addToCart(${item.id})">Add to Cart</button>` : ''}
        `;
        menuGrid.appendChild(menuItemDiv);
    });
}

// Filter menu
function filterMenu(category) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    displayMenuItems(category);
}

// Add to cart
function addToCart(itemId) {
    const item = menuItems.find(i => i.id === itemId);
    const existingItem = cart.find(i => i.id === itemId);
    
    if (existingItem) {
        if (existingItem.quantity < item.stock) {
            existingItem.quantity++;
        } else {
            alert('Cannot add more. Stock limit reached.');
            return;
        }
    } else {
        cart.push({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: 1,
            maxStock: item.stock
        });
    }
    
    updateCartDisplay();
}

// Update cart display
function updateCartDisplay() {
    const cartItemsDiv = document.getElementById('cartItems');
    
    if (cart.length === 0) {
        cartItemsDiv.innerHTML = '<p class="empty-cart">Cart is empty</p>';
    } else {
        cartItemsDiv.innerHTML = '';
        cart.forEach(item => {
            const cartItemDiv = document.createElement('div');
            cartItemDiv.className = 'cart-item';
            cartItemDiv.innerHTML = `
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">₱${item.price.toFixed(2)} each</div>
                </div>
                <div class="cart-item-controls">
                    <button class="qty-btn" onclick="decreaseQuantity(${item.id})">-</button>
                    <span class="qty-display">${item.quantity}</span>
                    <button class="qty-btn" onclick="increaseQuantity(${item.id})">+</button>
                    <button class="cart-remove-btn" onclick="removeFromCart(${item.id})">Remove</button>
                </div>
            `;
            cartItemsDiv.appendChild(cartItemDiv);
        });
    }
    
    updateCartTotals();
    calculateCashChange();
}

// Increase quantity
function increaseQuantity(itemId) {
    const item = cart.find(i => i.id === itemId);
    if (item && item.quantity < item.maxStock) {
        item.quantity++;
        updateCartDisplay();
    } else {
        alert('Cannot add more. Stock limit reached.');
    }
}

// Decrease quantity
function decreaseQuantity(itemId) {
    const item = cart.find(i => i.id === itemId);
    if (item && item.quantity > 1) {
        item.quantity--;
        updateCartDisplay();
    }
}

// Remove from cart
function removeFromCart(itemId) {
    cart = cart.filter(i => i.id !== itemId);
    updateCartDisplay();
}

// Update cart totals
function updateCartTotals() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    document.getElementById('cartSubtotal').textContent = `₱${subtotal.toFixed(2)}`;
    document.getElementById('cartTotal').textContent = `₱${subtotal.toFixed(2)}`;
}

// Clear cart
function clearCart() {
    if (confirm('Clear all items from cart?')) {
        cart = [];
        updateCartDisplay();
    }
}

// Place order
async function placeOrder() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Validate payment
    if (paymentMethod === 'wallet') {
        const walletBalance = parseFloat(document.getElementById('walletBalance').textContent.replace('₱', ''));
        if (walletBalance < total) {
            alert('Insufficient wallet balance! Please top up or use another payment method.');
            return;
        }
    } else if (paymentMethod === 'cash') {
        const amountPaid = parseFloat(document.getElementById('cashAmountPaid').value) || 0;
        if (amountPaid < total) {
            alert('Insufficient cash payment!');
            return;
        }
    }
    
    const orderData = {
        empId: employee.empId,
        employeeName: employee.name,
        items: cart,
        total: total,
        paymentMethod: paymentMethod,
        orderDate: new Date().toISOString()
    };
    
    if (paymentMethod === 'cash') {
        const amountPaid = parseFloat(document.getElementById('cashAmountPaid').value);
        orderData.amountPaid = amountPaid;
        orderData.change = amountPaid - total;
    }
    
    try {
        const response = await fetch('/api/ordering/place-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            lastOrderId = result.orderId;
            
            // Show success modal
            const successMsg = document.getElementById('orderSuccessMessage');
            let paymentInfo = '';
            
            if (paymentMethod === 'wallet') {
                paymentInfo = `<p><strong>Payment:</strong> Wallet</p><p><strong>New Balance:</strong> ₱${result.newBalance.toFixed(2)}</p>`;
            } else if (paymentMethod === 'cash') {
                paymentInfo = `<p><strong>Payment:</strong> Cash</p><p><strong>Amount Paid:</strong> ₱${orderData.amountPaid.toFixed(2)}</p><p><strong>Change:</strong> ₱${orderData.change.toFixed(2)}</p>`;
            } else {
                paymentInfo = `<p><strong>Payment:</strong> Credit (Pay Later)</p>`;
            }
            
            successMsg.innerHTML = `
                <h3>Order #${result.orderId}</h3>
                <p><strong>Total:</strong> ₱${total.toFixed(2)}</p>
                ${paymentInfo}
                <p class="success-note">Your order has been placed successfully!</p>
            `;
            document.getElementById('orderSuccessModal').style.display = 'block';
            
            // Show receipt button
            document.getElementById('receiptBtn').style.display = 'block';
            
            // Clear cart and reload data
            cart = [];
            updateCartDisplay();
            loadWalletBalance();
            loadOrderHistory();
            loadCreditInfo();
            loadMenuItems();
            
            // Reset cash payment fields
            document.getElementById('cashAmountPaid').value = '';
            document.getElementById('cashChange').textContent = '₱0.00';
        } else {
            alert('Error placing order: ' + result.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error placing order. Please try again.');
    }
}

// Print receipt
function printReceipt() {
    if (!lastOrderId) {
        alert('No recent order to print');
        return;
    }
    
    // Find the order
    const order = orderHistory.find(o => o.id === lastOrderId);
    if (!order) {
        alert('Order not found');
        return;
    }
    
    // Create receipt HTML
    const receiptHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Receipt - Order #${order.id}</title>
            <style>
                body {
                    font-family: 'Courier New', monospace;
                    max-width: 400px;
                    margin: 20px auto;
                }
                .receipt {
                    border: 2px dashed #333;
                    padding: 20px;
                }
                .receipt-header {
                    text-align: center;
                    border-bottom: 2px dashed #333;
                    padding-bottom: 15px;
                    margin-bottom: 15px;
                }
                .receipt-info div {
                    margin-bottom: 5px;
                }
                .receipt-items {
                    border-top: 2px dashed #333;
                    border-bottom: 2px dashed #333;
                    padding: 15px 0;
                    margin: 15px 0;
                }
                .receipt-item {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                }
                .receipt-total {
                    font-size: 1.2em;
                    font-weight: bold;
                    text-align: right;
                    margin-top: 10px;
                }
                .receipt-footer {
                    text-align: center;
                    margin-top: 15px;
                    border-top: 2px dashed #333;
                    padding-top: 15px;
                    font-size: 0.9em;
                }
            </style>
        </head>
        <body>
            <div class="receipt">
                <div class="receipt-header">
                    <h2>CLIMBS CANTEEN</h2>
                    <p>Official Receipt</p>
                </div>
                
                <div class="receipt-info">
                    <div><strong>Order #:</strong> ${order.id}</div>
                    <div><strong>Employee:</strong> ${order.employeeName}</div>
                    <div><strong>ID:</strong> ${order.empId}</div>
                    <div><strong>Date:</strong> ${new Date(order.orderDate).toLocaleString()}</div>
                    <div><strong>Payment:</strong> ${order.paymentMethod.toUpperCase()}</div>
                </div>
                
                <div class="receipt-items">
                    <h4>ITEMS:</h4>
                    ${order.items.map(item => `
                        <div class="receipt-item">
                            <span>${item.name} x${item.quantity}</span>
                            <span>₱${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    `).join('')}
                </div>
                
                <div class="receipt-total">
                    <div>TOTAL: ₱${order.total.toFixed(2)}</div>
                    ${order.amountPaid ? `<div>PAID: ₱${order.amountPaid.toFixed(2)}</div>` : ''}
                    ${order.change ? `<div>CHANGE: ₱${order.change.toFixed(2)}</div>` : ''}
                </div>
                
                <div class="receipt-footer">
                    <p>Thank you for your order!</p>
                    <p>CLIMBS Life and General Insurance Cooperative</p>
                </div>
            </div>
        </body>
        </html>
    `;
    
    // Open print window
    const printWindow = window.open('', '', 'width=400,height=600');
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
}

// Close order success modal
function closeOrderSuccess() {
    document.getElementById('orderSuccessModal').style.display = 'none';
}

// Show top up modal
function showTopUpModal() {
    document.getElementById('topUpModal').style.display = 'block';
}

// Close top up modal
function closeTopUpModal() {
    document.getElementById('topUpModal').style.display = 'none';
}

// Set top up amount
function setTopUp(amount) {
    document.getElementById('topUpAmount').value = amount;
}

// Top up form submission
document.getElementById('topUpForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const amount = parseFloat(document.getElementById('topUpAmount').value);
    
    try {
        const response = await fetch('/api/ordering/top-up-wallet', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ empId: employee.empId, amount })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert(`Successfully added ₱${amount.toFixed(2)} to your wallet!`);
            loadWalletBalance();
            closeTopUpModal();
            document.getElementById('topUpForm').reset();
        } else {
            alert('Error topping up wallet.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error topping up wallet.');
    }
});

// Load order history
async function loadOrderHistory() {
    try {
        const response = await fetch(`/api/ordering/order-history?empId=${employee.empId}`);
        const result = await response.json();
        
        if (result.success) {
            orderHistory = result.orders;
            displayOrderHistory();
        }
    } catch (error) {
        console.error('Error loading order history:', error);
    }
}

// Display order history
function displayOrderHistory() {
    const historyDiv = document.getElementById('orderHistory');
    
    if (orderHistory.length === 0) {
        historyDiv.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">No orders yet</p>';
        return;
    }
    
    historyDiv.innerHTML = '';
    orderHistory.forEach(order => {
        const orderDiv = document.createElement('div');
        orderDiv.className = 'order-history-item';
        
        const itemsList = order.items.map(item => 
            `<div class="order-item">
                <span>${item.name} x${item.quantity}</span>
                <span>₱${(item.price * item.quantity).toFixed(2)}</span>
            </div>`
        ).join('');
        
        orderDiv.innerHTML = `
            <div class="order-header">
                <span class="order-id">Order #${order.id}</span>
                <span class="order-date">${new Date(order.orderDate).toLocaleString()}</span>
            </div>
            <div class="order-items-list">${itemsList}</div>
            <div class="order-total">Total: ₱${order.total.toFixed(2)}</div>
            <button class="reorder-btn" onclick="reorder(${order.id})">Reorder</button>
        `;
        
        historyDiv.appendChild(orderDiv);
    });
}

// Reorder
function reorder(orderId) {
    const order = orderHistory.find(o => o.id === orderId);
    if (!order) return;
    
    cart = order.items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        maxStock: 999
    }));
    
    updateCartDisplay();
    showSection('order');
    alert('Items added to cart!');
}

// Load favorites
async function loadFavorites() {
    try {
        const response = await fetch(`/api/ordering/favorites?empId=${employee.empId}`);
        const result = await response.json();
        
        if (result.success) {
            favorites = result.favorites || [];
            displayFavorites();
        }
    } catch (error) {
        console.error('Error loading favorites:', error);
    }
}

// Display favorites
function displayFavorites() {
    const favoritesDiv = document.getElementById('favoritesList');
    
    if (favorites.length === 0) {
        favoritesDiv.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">No favorite items yet</p>';
        return;
    }
    
    favoritesDiv.innerHTML = '';
    favorites.forEach(fav => {
        const favDiv = document.createElement('div');
        favDiv.className = 'order-history-item';
        favDiv.innerHTML = `
            <div class="order-header">
                <span class="order-id">${fav.name}</span>
                <span class="order-date">₱${fav.price.toFixed(2)}</span>
            </div>
            <button class="reorder-btn" onclick="addFavoriteToCart(${fav.id})">Add to Cart</button>
        `;
        favoritesDiv.appendChild(favDiv);
    });
}

// Add favorite to cart
function addFavoriteToCart(itemId) {
    addToCart(itemId);
    showSection('order');
}

// Load credit info
async function loadCreditInfo() {
    try {
        const response = await fetch(`/api/ordering/credit-balance?empId=${employee.empId}`);
        const result = await response.json();
        
        if (result.success) {
            document.getElementById('creditAmount').textContent = `₱${result.creditBalance.toFixed(2)}`;
            displayCreditHistory(result.creditHistory || []);
        }
    } catch (error) {
        console.error('Error loading credit:', error);
    }
}

// Display credit history
function displayCreditHistory(creditHistory) {
    const creditDiv = document.getElementById('creditHistory');
    
    if (creditHistory.length === 0) {
        creditDiv.innerHTML = '<p style="text-align: center; color: #999; padding: 40px; margin-top: 20px;">No credit transactions</p>';
        return;
    }
    
    creditDiv.innerHTML = '<h3 style="margin-top: 30px; color: #667eea;">Credit History</h3>';
    creditHistory.forEach(credit => {
        const creditItemDiv = document.createElement('div');
        creditItemDiv.className = 'order-history-item';
        creditItemDiv.innerHTML = `
            <div class="order-header">
                <span class="order-id">Order #${credit.orderId}</span>
                <span class="order-date">${new Date(credit.date).toLocaleString()}</span>
            </div>
            <div class="order-total">Amount: ₱${credit.amount.toFixed(2)}</div>
        `;
        creditDiv.appendChild(creditItemDiv);
    });
}

// Show section
function showSection(section) {
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.style.display = 'none';
    });
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (section === 'order') {
        document.getElementById('orderSection').style.display = 'block';
        event.target.classList.add('active');
    } else if (section === 'history') {
        document.getElementById('historySection').style.display = 'block';
        event.target.classList.add('active');
        loadOrderHistory();
    } else if (section === 'favorites') {
        document.getElementById('favoritesSection').style.display = 'block';
        event.target.classList.add('active');
        loadFavorites();
    } else if (section === 'credit') {
        document.getElementById('creditSection').style.display = 'block';
        event.target.classList.add('active');
        loadCreditInfo();
    }
}

// Logout
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.removeItem('employee');
        window.location.href = '/ordering-system';
    }
}

// Close modals when clicking outside
window.onclick = function(event) {
    const topUpModal = document.getElementById('topUpModal');
    const successModal = document.getElementById('orderSuccessModal');
    
    if (event.target === topUpModal) {
        closeTopUpModal();
    }
    if (event.target === successModal) {
        closeOrderSuccess();
    }
}