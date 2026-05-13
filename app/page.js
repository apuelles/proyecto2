'use client';

import { useRef, useState } from 'react';

const productsData = [
  {
    id: 1,
    name: "Creatina",
    desc: "Monohidrato de creatina pura. Aumenta la fuerza, potencia y recuperación muscular.",
    tags: ["Fuerza", "Potencia", "Recuperación"],
    price: 14990,
    image: "/images/product-creatina.jpg"
  },
  {
    id: 2,
    name: "Proteína",
    desc: "Whey protein de alta calidad con 25g de proteína por porción. Sabor premium.",
    tags: ["Masa muscular", "Whey", "25g Proteína"],
    price: 22990,
    image: "/images/product-proteina.jpg"
  },
  {
    id: 3,
    name: "Electrolitos",
    desc: "Fórmula de hidratación avanzada con sodio, potasio y magnesio. Para el rendimiento máximo.",
    tags: ["Hidratación", "Resistencia", "Sin azúcar"],
    price: 8990,
    image: "/images/product-electrolitos.webp"
  },
  {
    id: 4,
    name: "Pre Workout",
    desc: "Fórmula explosiva con cafeína, beta-alanina y citrulina. Energía total desde el primer rep.",
    tags: ["Energía", "Enfoque", "Bombeo"],
    price: 18990,
    image: "/images/product-preworkout.jpg"
  }
];


export default function App() {

  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [isCheckoutSuccess, setIsCheckoutSuccess] = useState(false);
  const newsletterInputRef = useRef(null);


  const addToCart = (product) => {
    setCart((prevCart) => {
      const existing = prevCart.find(item => item.id === product.id);
      if (existing) {
        return prevCart.map(item => 
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prevCart, { ...product, qty: 1 }];
    });
    showToast(`${product.name} añadido al carrito`);
  };

  const updateQty = (id, delta) => {
    setCart((prevCart) => {
      return prevCart.map(item => {
        if (item.id === id) {
          return { ...item, qty: item.qty + delta };
        }
        return item;
      }).filter(item => item.qty > 0);
    });
  };

  const removeItem = (id) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handlePlaceOrder = () => {
    setIsCheckoutSuccess(true);
    setCart([]); 
  };

  const cartTotalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartTotalPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  return (
    <>
      {/* NAVEGACIÓN */}
      <nav>
        <a href="#" className="nav-logo">Vital<span>Core</span></a>
        <ul className="nav-links">
          <li><a href="#productos">Productos</a></li>
          <li><a href="#nosotros">Nosotros</a></li>
          <li><a href="#contacto">Contacto</a></li>
        </ul>
        <button className="cart-btn" onClick={() => setIsCartOpen(true)}>
          <span className="cart-icon">◻</span>
          Carrito
          <span className="cart-count">{cartTotalItems}</span>
        </button>
      </nav>

      {/* HERO SECTION */}
      <section className="hero">
        <div className="hero-bg"></div>
        <div className="hero-lines"></div>
        <div className="hero-tag">{'// Performance Science — Est. 2024'}</div>
        <h1 className="hero-title">FUEL YOUR<br/><span>POTENTIAL</span></h1>
        <p className="hero-sub">
          Suplementos de precisión formulados para atletas que no aceptan límites. Ciencia aplicada al rendimiento humano.
        </p>
        <a href="#productos" className="hero-cta">Ver Productos</a>
        <img
          className="hero-athlete"
          src="/images/hero-bodybuilder.jpg"
          alt="Silueta de fisicoculturista"
        />
      </section>

      {/* PRODUCTOS */}
      <section id="productos">
        <div className="section-header">
          <span className="section-num">01</span>
          <h2 className="section-title">PRODUCTOS</h2>
          <div className="section-line"></div>
        </div>
        
        <div className="products-grid">
          {productsData.map((p, index) => (
            <div className="product-card" key={p.id}>
              <div className="product-num">0{index + 1}</div>
              <div className="product-image">
                <img src={p.image} alt={p.name} />
              </div>
              <h3 className="product-name">{p.name}</h3>
              <p className="product-desc">{p.desc}</p>
              <div className="product-tags">
                {p.tags.map(tag => <span className="tag" key={tag}>{tag}</span>)}
              </div>
              <div className="product-price">${p.price.toLocaleString('es-AR')} <span>ARS</span></div>
              <button className="add-to-cart" onClick={() => addToCart(p)}>
                <span>Añadir al Carrito</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* NOSOTROS */}
      <section id="nosotros">
        <div className="section-header">
          <span className="section-num">02</span>
          <h2 className="section-title">NOSOTROS</h2>
          <div className="section-line"></div>
        </div>
        <div className="features-grid">
          <div className="feature">
            <div className="feature-image">
              <img
                src="/images/feature-calidad.jpg"
                alt="Control de calidad certificado"
              />
            </div>
            <div className="feature-title">CALIDAD CERTIFICADA</div>
            <p className="feature-text">Todos nuestros productos pasan por rigurosos controles de calidad. Sin rellenos, sin compromisos.</p>
          </div>
          <div className="feature">
            <div className="feature-image">
              <img
                src="/images/feature-formulas.jpg"
                alt="Fórmulas validadas en laboratorio"
              />
            </div>
            <div className="feature-title">FÓRMULAS VALIDADAS</div>
            <p className="feature-text">Cada fórmula está respaldada por investigación científica y dosificada para resultados medibles.</p>
          </div>
          <div className="feature">
            <div className="feature-image feature-image-icon">
              <img
                src="/images/feature-entrega.png"
                alt="Entrega rápida"
              />
            </div>
            <div className="feature-title">ENTREGA RÁPIDA</div>
            <p className="feature-text">Despacho en 24–48h a todo el país. Porque tu entrenamiento no puede esperar.</p>
          </div>
        </div>
      </section>

      {/* FOOTER & NEWSLETTER */}
      <section id="contacto">
        <div className="newsletter-left">
          <h2>MANTENTE<br/>INFORMADO</h2>
          <p>Recibí novedades, lanzamientos y consejos de entrenamiento directo en tu inbox.</p>
        </div>
        <div className="newsletter-form">
          <input className="newsletter-input" type="email" placeholder="tu@email.com" ref={newsletterInputRef} />
          <button 
            className="newsletter-submit" 
            onClick={() => {
              const val = newsletterInputRef.current?.value;
              showToast(val ? "¡Gracias por suscribirte!" : "Ingresá un email válido");
              if (newsletterInputRef.current) {
                newsletterInputRef.current.value = '';
              }
            }}
          >
            Suscribir
          </button>
        </div>
      </section>

      <footer>
        <span className="footer-logo">VitalCore</span>
        <span className="footer-copy">© 2024 VitalCore — Todos los derechos reservados</span>
      </footer>

      {/* OVERLAY DEL CARRITO */}
      <div 
        className={`cart-overlay ${isCartOpen ? 'open' : ''}`} 
        onClick={() => setIsCartOpen(false)}
      ></div>

      {/* DRAWER DEL CARRITO */}
      <div className={`cart-drawer ${isCartOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <span className="drawer-title">CARRITO</span>
          <button className="drawer-close" onClick={() => setIsCartOpen(false)}>✕</button>
        </div>
        
        <div className="drawer-items">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <span className="cart-empty-icon">◻</span>
              <p>Tu carrito está vacío</p>
            </div>
          ) : (
            cart.map(item => (
              <div className="cart-item" key={item.id}>
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-price">${item.price.toLocaleString('es-AR')}</div>
                </div>
                <div className="cart-item-controls">
                  <button className="qty-btn" onClick={() => updateQty(item.id, -1)}>-</button>
                  <div className="qty-num">{item.qty}</div>
                  <button className="qty-btn" onClick={() => updateQty(item.id, 1)}>+</button>
                  <button className="remove-btn" onClick={() => removeItem(item.id)}>✕</button>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="drawer-footer">
            <div className="drawer-total-row">
              <span className="drawer-total-label">Total</span>
              <span className="drawer-total-amount">${cartTotalPrice.toLocaleString('es-AR')}</span>
            </div>
            <button className="checkout-btn" onClick={() => {
              setIsCartOpen(false);
              setIsCheckoutOpen(true);
              setIsCheckoutSuccess(false);
            }}>
              Finalizar Compra
            </button>
            <button className="continue-btn" onClick={() => setIsCartOpen(false)}>Seguir Comprando</button>
          </div>
        )}
      </div>

      {/* CHECKOUT MODAL */}
      <div className={`checkout-modal ${isCheckoutOpen ? 'open' : ''}`}>
        <div className="checkout-box">
          <button className="checkout-box-close" onClick={() => setIsCheckoutOpen(false)}>✕</button>

          {!isCheckoutSuccess ? (
            <div>
              <div className="checkout-tag">{'// Finalizar compra'}</div>
              <div className="checkout-title">CHECKOUT</div>
              
              <div className="form-row">
                <div className="form-group"><label className="form-label">Nombre</label><input className="form-input" /></div>
                <div className="form-group"><label className="form-label">Apellido</label><input className="form-input" /></div>
              </div>
              
              <div className="order-summary">
                <div className="order-summary-title">Resumen del pedido</div>
                <div className="order-items">
                  {cart.map(item => (
                    <div className="order-item" key={item.id}>
                      <span>{item.qty}x <span className="order-item-name">{item.name}</span></span>
                      <span>${(item.price * item.qty).toLocaleString('es-AR')}</span>
                    </div>
                  ))}
                </div>
                <div className="order-divider"></div>
                <div className="order-total">
                  <span>Total</span>
                  <span>${cartTotalPrice.toLocaleString('es-AR')}</span>
                </div>
              </div>

              <button className="place-order-btn" onClick={handlePlaceOrder}>Confirmar Pedido</button>
            </div>
          ) : (
            <div className="success-state" style={{display: 'flex'}}>
              <div className="success-icon">✓</div>
              <div className="success-title">¡LISTO!</div>
              <p className="success-text">Tu pedido fue confirmado. Te llegará un email con los detalles.</p>
            </div>
          )}
        </div>
      </div>

      {/* TOAST ALERTS */}
      <div className={`toast ${toastMsg ? 'show' : ''}`}>
        {toastMsg}
      </div>
    </>
  );
}
