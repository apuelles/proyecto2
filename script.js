// Base de datos de productos
const products = [
    {
      id: 1,
      name: "Creatina",
      price: 14990,
    },
    {
      id: 2,
      name: "Proteína",
      price: 22990,
    },
    {
      id: 3,
      name: "Electrolitos",
      price: 8990,
    },
    {
      id: 4,
      name: "Pre Workout",
      price: 18990,
    }
  ];
  // Variable global para almacenar los productos del carrito
  let cart = [];
  
  // Función para inyectar los productos en el HTML
  function renderProducts() {
    const grid = document.getElementById('productsGrid');
    
    grid.innerHTML = products.map((p, index) => `
      <div class="product-card">
        <div class="product-num">0${index + 1}</div>
        <span class="product-icon">${p.icon}</span>
        <h3 class="product-name">${p.name}</h3>
        <p class="product-desc">${p.desc}</p>
        <div class="product-tags">
          ${p.tags.map(t => `<span class="tag">${t}</span>`).join('')}
        </div>
        <div class="product-price">$${p.price.toLocaleString('es-AR')} <span>ARS</span></div>
        <button class="add-to-cart" onclick="addToCart(${p.id})">
          <span>Añadir al Carrito</span>
        </button>
      </div>
    `).join('');
  }
  
  function addToCart(id) {
    const product = products.find(p => p.id === id);
    const existingItem = cart.find(item => item.id === id);
    
    if (existingItem) {
      existingItem.qty++;
    } else {
      cart.push({ ...product, qty: 1 });
    }
    
    updateCartUI();
    showToast(`${product.name} añadido al carrito`);
  }
  
  function updateCartUI() {
    const count = document.getElementById('cartCount');
    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    
    count.innerText = totalItems;
    
    count.classList.add('bump');
    setTimeout(() => count.classList.remove('bump'), 300);
  
    renderCartDrawer();
  }

  function renderCartDrawer() {
    const itemsContainer = document.getElementById('drawerItems');
    const footer = document.getElementById('drawerFooter');
    
    if (cart.length === 0) {
      itemsContainer.innerHTML = `
        <div class="cart-empty" id="cartEmpty">
          <span class="cart-empty-icon">◻</span>
          <p>Tu carrito está vacío</p>
        </div>
      `;
      footer.style.display = 'none';
      return;
    }
  
    footer.style.display = 'block';
    itemsContainer.innerHTML = cart.map(item => `
      <div class="cart-item">
        <div class="cart-item-icon">${item.icon}</div>
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">$${item.price.toLocaleString('es-AR')}</div>
        </div>
        <div class="cart-item-controls">
          <button class="qty-btn" onclick="updateQty(${item.id}, -1)">-</button>
          <div class="qty-num">${item.qty}</div>
          <button class="qty-btn" onclick="updateQty(${item.id}, 1)">+</button>
          <button class="remove-btn" onclick="removeItem(${item.id})">✕</button>
        </div>
      </div>
    `).join('');
  
    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    document.getElementById('drawerTotal').innerText = `$${total.toLocaleString('es-AR')}`;
  }
  
  // Cambiar cantidades dentro del carrito
  function updateQty(id, delta) {
    const item = cart.find(i => i.id === id);
    if (item) {
      item.qty += delta;
      if (item.qty <= 0) {
        removeItem(id);
      } else {
        updateCartUI();
      }
    }
  }
  
  // Eliminar ítem del carrito
  function removeItem(id) {
    cart = cart.filter(item => item.id !== id);
    updateCartUI();
  }
  
  // Abrir y cerrar el panel del carrito
  function openCart() {
    document.getElementById('cartOverlay').classList.add('open');
    document.getElementById('cartDrawer').classList.add('open');
  }
  
  function closeCart() {
    document.getElementById('cartOverlay').classList.remove('open');
    document.getElementById('cartDrawer').classList.remove('open');
  }
  
  // Abrir el modal de checkout (Pago)
  function openCheckout() {
    closeCart();
    const modal = document.getElementById('checkoutModal');
    
    // Reseteamos el estado visual
    document.getElementById('checkoutForm').style.display = 'block';
    document.getElementById('successState').style.display = 'none';
    
    // Dibujamos el resumen de compra
    const checkoutItems = document.getElementById('checkoutItems');
    checkoutItems.innerHTML = cart.map(item => `
      <div class="order-item">
        <span>${item.qty}x <span class="order-item-name">${item.name}</span></span>
        <span>$${(item.price * item.qty).toLocaleString('es-AR')}</span>
      </div>
    `).join('');
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    document.getElementById('checkoutTotal').innerText = `$${total.toLocaleString('es-AR')}`;
    
    modal.classList.add('open');
  }
  
  function closeCheckout() {
    document.getElementById('checkoutModal').classList.remove('open');
  }
  
  // Confirmar el pedido
  function placeOrder() {
    document.getElementById('checkoutForm').style.display = 'none';
    document.getElementById('successState').style.display = 'flex';
    
    // Vaciamos el carrito tras la compra exitosa
    cart = [];
    updateCartUI();
  }
  
  // Manejar la suscripción del Newsletter
  function handleNewsletter() {
    const input = document.getElementById('newsEmail');
    if(input.value) {
      showToast("¡Gracias por suscribirte!");
      input.value = ''; // Limpiamos el input
    } else {
      showToast("Por favor, ingresá un email válido.");
    }
  }
  
  // Alertas tipo "Toast" abajo en la pantalla
  function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.innerText = msg;
    toast.classList.add('show');
    
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }
  document.addEventListener('DOMContentLoaded', renderProducts);