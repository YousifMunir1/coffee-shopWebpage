// DOM Elements for Order Form
const orderForm = document.getElementById('orderForm');
const itemSelect = document.getElementById('itemSelect');
const quantityInput = document.getElementById('quantity');
const selectedItemSpan = document.getElementById('selectedItem');
const selectedQuantitySpan = document.getElementById('selectedQuantity');
const unitPriceSpan = document.getElementById('unitPrice');
const totalPriceSpan = document.getElementById('totalPrice');
const orderConfirmation = document.getElementById('orderConfirmation');
const customerName = document.getElementById('customerName');
const customerEmail = document.getElementById('customerEmail');
const customerPhone = document.getElementById('customerPhone');

// Update order summary when item or quantity changes
function updateOrderSummary() {
    if (!itemSelect || !quantityInput) return; // Not on order page

    const selectedOption = itemSelect.options[itemSelect.selectedIndex];
    const itemName = selectedOption.text.split(' - ')[0];
    const price = parseFloat(selectedOption.getAttribute('data-price')) || 0;
    const quantity = parseInt(quantityInput.value) || 0;
    const total = price * quantity;

    selectedItemSpan.textContent = itemName;
    selectedQuantitySpan.textContent = quantity;
    unitPriceSpan.textContent = price.toFixed(2);
    totalPriceSpan.textContent = total.toFixed(2);
}

// Event listeners for order form
if (itemSelect && quantityInput) {
    itemSelect.addEventListener('change', updateOrderSummary);
    quantityInput.addEventListener('input', updateOrderSummary);
}

// Handle order form submission
if (orderForm) {
    orderForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const itemId = parseInt(itemSelect.value);
        const quantity = parseInt(quantityInput.value);
        const total = parseFloat(totalPriceSpan.textContent);

        // Get customer information from form
        const name = customerName.value;
        const email = customerEmail.value;
        const phone = customerPhone.value;

        try {
            // Save customer information
            const customerResponse = await fetch('/api/customer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    email,
                    phone
                })
            });

            if (!customerResponse.ok) {
                throw new Error('Failed to save customer information');
            }

            // Save order locally
            const orderData = {
                itemId,
                quantity,
                total,
                timestamp: new Date().toISOString()
            };

            const orders = JSON.parse(localStorage.getItem('orders') || '[]');
            orders.push(orderData);
            localStorage.setItem('orders', JSON.stringify(orders));

            // Show order confirmation
            orderForm.style.display = 'none';
            orderConfirmation.style.display = 'block';
            
            // Generate a random order ID
            document.getElementById('orderId').textContent = 
                Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to process order: ' + error.message);
        }
    });
}

// Menu page functionality
function addToOrder(itemId) {
    // Redirect to order page with pre-selected item
    window.location.href = `invoice.html?item=${itemId}`;
}

// Handle pre-selected item from menu page
window.addEventListener('DOMContentLoaded', () => {
    if (itemSelect) {
        const urlParams = new URLSearchParams(window.location.search);
        const preSelectedItem = urlParams.get('item');
        
        if (preSelectedItem) {
            itemSelect.value = preSelectedItem;
            updateOrderSummary();
        }
    }
});

// Fetch menu items from JSON file
async function loadMenuItems() {
    const menuGrid = document.querySelector('.menu-grid');
    if (!menuGrid) return; // Not on menu page

    try {
        const response = await fetch('data/menu.json');
        if (!response.ok) throw new Error('Failed to fetch menu items');
        
        const items = await response.json();
        
        // Clear existing static items
        menuGrid.innerHTML = '';
        
        // Create menu items dynamically
        items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'menu-item';
            itemElement.setAttribute('data-item-id', item.ItemID);
            
            itemElement.innerHTML = `
                <img src="images/${item.ImageURL}" alt="${item.Name}">
                <div class="item-details">
                    <h3>${item.Name}</h3>
                    <p class="description">${item.Description}</p>
                    <p class="price">$${item.Price.toFixed(2)}</p>
                    <button class="order-btn" onclick="addToOrder(${item.ItemID})">Add to Order</button>
                </div>
            `;
            
            menuGrid.appendChild(itemElement);
        });
    } catch (error) {
        console.error('Error loading menu items:', error);
        menuGrid.innerHTML = '<p class="error">Failed to load menu items. Please try again later.</p>';
    }
}

// Load menu items when on menu page
if (document.querySelector('.menu-grid')) {
    loadMenuItems();
}
