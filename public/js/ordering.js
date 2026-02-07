// Menu items data
const menuItems = [
    // Meals
    { id: 1, name: 'Chicken Adobo', price: 85, category: 'meals', emoji: '🍗' },
    { id: 2, name: 'Pork Sinigang', price: 90, category: 'meals', emoji: '🍲' },
    { id: 3, name: 'Beef Tapa', price: 95, category: 'meals', emoji: '🥩' },
    { id: 4, name: 'Fried Chicken', price: 80, category: 'meals', emoji: '🍗' },
    { id: 5, name: 'Sisig', price: 85, category: 'meals', emoji: '🍖' },
    { id: 6, name: 'Bicol Express', price: 90, category: 'meals', emoji: '🌶️' },
    
    // Drinks
    { id: 7, name: 'Iced Coffee', price: 45, category: 'drinks', emoji: '☕' },
    { id: 8, name: 'Fresh Juice', price: 40, category: 'drinks', emoji: '🧃' },
    { id: 9, name: 'Softdrinks', price: 25, category: 'drinks', emoji: '🥤' },
    { id: 10, name: 'Bottled Water', price: 15, category: 'drinks', emoji: '💧' },
    { id: 11, name: 'Iced Tea', price: 30, category: 'drinks', emoji: '🧋' },
    
    // Snacks
    { id: 12, name: 'Lumpia', price: 35, category: 'snacks', emoji: '🥟' },
    { id: 13, name: 'Banana Cue', price: 25, category: 'snacks', emoji: '🍌' },
    { id: 14, name: 'Turon', price: 30, category: 'snacks', emoji: '🥞' },
    { id: 15, name: 'Empanada', price: 40, category: 'snacks', emoji: '🥟' },
    { id: 16, name: 'Halo-Halo', price: 60, category: 'snacks', emoji: '🍧' }
];

// Cart array
let cart = [];

// Load menu items on page load
document.addEventListener('DOMContentLoaded', function() {
    displayMenuItems('all');
    
    // Add event listener for amount paid
    document.getElementById('amountPaid').addEventListener('input', calculateChange);
});

// Display menu items
function displayMenuItems(category) {
    const menuGrid = document.getElementById('menuGrid');
    menuGrid.innerHTML = '';
    
    const filteredItems = category === 'all' 
        ? menuItems 
        : menuItems.filter(item => item.category === category);
    
    filteredItems.forEach(item => {
        const menuItemDiv = document.createElement('div');
        menuItemDiv.className = 'menu-item';
        menuItemDiv.innerHTML = `
            <div class="menu-item-image">${item.emoji}</div>
            <h3>${item.name}</h3>
            <div class="menu-item-price">₱${item.price.toFixed(2)}</div>
            <button class="add-btn" onclick="addToCart(${item.id})">Add to Order</button>
        `;
        menuGrid.appendChild(menuItemDiv);
    });
}

// Filter category
function filterCategory(category) {
    // Update active button
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Display filtered items
    displayMenuItems(category);
}

// Add item to cart
function addToCart(itemId) {
    const item = menuItems.find(i => i.id === itemId);
    const existingItem = cart.find(i => i.id === itemId);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: 1
        });
    }
    
    updateOrderDisplay();
}

// Update order display
function updateOrderDisplay() {
    const orderItemsDiv = document.getElementById('orderItems');
    
    if (cart.length === 0) {
        orderItemsDiv.innerHTML = '<p class="empty-cart">Your cart is empty. Add items from the menu.</p>';
    } else {
        orderItemsDiv.innerHTML = '';
        cart.forEach(item => {
            const orderItemDiv = document.createElement('div');
            orderItemDiv.className = 'order-item';
            orderItemDiv.innerHTML = `
                <div class="order-item-info">
                    <div class="order-item-name">${item.name}</div>
                    <div class="order-item-price">₱${item.price.toFixed(2)} each</div>
                </div>
                <div class="order-item-controls">
                    <button class="qty-btn" onclick="decreaseQuantity(${item.id})">-</button>
                    <span class="qty-display">${item.quantity}</span>
                    <button class="qty-btn" onclick="increaseQuantity(${item.id})">+</button>
                    <button class="remove-btn" onclick="removeFromCart(${item.id})">Remove</button>
                </div>
            `;
            orderItemsDiv.appendChild(orderItemDiv);
        });
    }
    
    updateTotals();
    calculateChange();
}

// Increase quantity
function increaseQuantity(itemId) {
    const item = cart.find(i => i.id === itemId);
    if (item) {
        item.quantity++;
        updateOrderDisplay();
    }
}

// Decrease quantity
function decreaseQuantity(itemId) {
    const item = cart.find(i => i.id === itemId);
    if (item && item.quantity > 1) {
        item.quantity--;
        updateOrderDisplay();
    }
}

// Remove from cart
function removeFromCart(itemId) {
    cart = cart.filter(i => i.id !== itemId);
    updateOrderDisplay();
}

// Update totals
function updateTotals() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    document.getElementById('subtotal').textContent = `₱${subtotal.toFixed(2)}`;
    document.getElementById('total').textContent = `₱${subtotal.toFixed(2)}`;
}

// Calculate change
function calculateChange() {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const amountPaid = parseFloat(document.getElementById('amountPaid').value) || 0;
    const change = amountPaid - total;
    
    const changeDisplay = document.getElementById('change');
    if (change >= 0) {
        changeDisplay.textContent = `₱${change.toFixed(2)}`;
        changeDisplay.style.color = '#28a745';
    } else {
        changeDisplay.textContent = `₱${Math.abs(change).toFixed(2)} short`;
        changeDisplay.style.color = '#dc3545';
    }
}

// Place order
async function placeOrder() {
    const employeeName = document.getElementById('employeeName').value.trim();
    const employeeId = document.getElementById('employeeId').value.trim();
    const amountPaid = parseFloat(document.getElementById('amountPaid').value) || 0;
    
    // Validation
    if (!employeeName || !employeeId) {
        alert('Please enter employee name and ID');
        return;
    }
    
    if (cart.length === 0) {
        alert('Please add items to your order');
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    if (amountPaid < total) {
        alert('Insufficient payment amount');
        return;
    }
    
    const change = amountPaid - total;
    
    const orderData = {
        employeeName,
        employeeId,
        items: cart,
        subtotal: total,
        total: total,
        amountPaid: amountPaid,
        change: change,
        orderDate: new Date().toISOString()
    };
    
    try {
        const response = await fetch('/api/orders/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Show success message
            const successMsg = document.getElementById('orderSuccess');
            successMsg.innerHTML = `<p>✓ Order placed successfully! Order ID: ${result.orderId}<br>Change: ₱${change.toFixed(2)}</p>`;
            successMsg.style.display = 'block';
            
            // Clear order after 3 seconds
            setTimeout(() => {
                clearOrder();
                successMsg.style.display = 'none';
            }, 3000);
        } else {
            alert('Error placing order. Please try again.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error placing order. Please try again.');
    }
}

// Clear order
function clearOrder() {
    cart = [];
    document.getElementById('employeeName').value = '';
    document.getElementById('employeeId').value = '';
    document.getElementById('amountPaid').value = '';
    updateOrderDisplay();
}