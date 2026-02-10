let cart = [];
let menuItems = [];

// Load menu items on page load
document.addEventListener('DOMContentLoaded', function() {
    loadMenuItems();
    
    // Add event listener for amount paid
    document.getElementById('amountPaid').addEventListener('input', calculateChange);
    
    // Add payment method change listener
    document.querySelectorAll('input[name="visitorPayment"]').forEach(radio => {
        radio.addEventListener('change', handlePaymentMethodChange);
    });
});

// Handle payment method change
function handlePaymentMethodChange() {
    const paymentMethod = document.querySelector('input[name="visitorPayment"]:checked').value;
    const cashDetails = document.getElementById('cashPaymentDetails');
    const ewalletDetails = document.getElementById('ewalletPaymentDetails');
    
    if (paymentMethod === 'cash') {
        cashDetails.style.display = 'block';
        ewalletDetails.style.display = 'none';
    } else {
        cashDetails.style.display = 'none';
        ewalletDetails.style.display = 'block';
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
            ${!isOutOfStock ? `<button class="item-add-btn" onclick="addToCart(${item.id})">Add</button>` : ''}
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
                    <button class="cart-remove-btn" onclick="removeFromCart(${item.id})">×</button>
                </div>
            `;
            cartItemsDiv.appendChild(cartItemDiv);
        });
    }
    
    updateCartTotals();
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
    
    calculateChange();
}

// Calculate change
function calculateChange() {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const amountPaid = parseFloat(document.getElementById('amountPaid').value) || 0;
    const change = amountPaid - total;
    
    const changeDisplay = document.getElementById('changeAmount');
    if (change >= 0) {
        changeDisplay.textContent = `₱${change.toFixed(2)}`;
        changeDisplay.style.color = '#28a745';
    } else {
        changeDisplay.textContent = `₱${Math.abs(change).toFixed(2)} short`;
        changeDisplay.style.color = '#dc3545';
    }
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
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const paymentMethod = document.querySelector('input[name="visitorPayment"]:checked').value;
    
    let orderData = {
        customerType: 'visitor',
        customerName: 'Walk-in Customer',
        items: cart,
        total: total,
        paymentMethod: paymentMethod,
        orderDate: new Date().toISOString()
    };
    
    // Validate payment
    if (paymentMethod === 'cash') {
        const amountPaid = parseFloat(document.getElementById('amountPaid').value) || 0;
        
        if (amountPaid < total) {
            alert('Insufficient payment amount!');
            return;
        }
        
        const change = amountPaid - total;
        orderData.amountPaid = amountPaid;
        orderData.change = change;
    } else if (paymentMethod === 'ewallet') {
        const reference = document.getElementById('ewalletReference').value.trim();
        
        if (!reference) {
            alert('Please enter e-wallet reference number!');
            return;
        }
        
        orderData.ewalletReference = reference;
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
            let message = `Order placed successfully!\n\nOrder #${result.orderId}\nTotal: ₱${total.toFixed(2)}`;
            
            if (paymentMethod === 'cash') {
                message += `\nPaid: ₱${orderData.amountPaid.toFixed(2)}\nChange: ₱${orderData.change.toFixed(2)}`;
            } else {
                message += `\nPayment: E-Wallet\nReference: ${orderData.ewalletReference}`;
            }
            
            message += '\n\nThank you!';
            alert(message);
            
            // Clear cart and form
            cart = [];
            updateCartDisplay();
            document.getElementById('amountPaid').value = '';
            document.getElementById('ewalletReference').value = '';
            
            // Reload menu to update stock
            loadMenuItems();
        } else {
            alert('Error placing order: ' + result.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error placing order. Please try again.');
    }
}