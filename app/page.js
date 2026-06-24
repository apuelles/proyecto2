'use client';

import { useEffect, useRef, useState } from 'react';
import { fallbackProducts } from '../lib/fallbackProducts';

const CART_STORAGE_KEY = 'vitalcore-cart';

export default function App() {

  const [products, setProducts] = useState(fallbackProducts);
  const [cart, setCart] = useState([]);
  const [hasLoadedCart, setHasLoadedCart] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [isCheckoutSuccess, setIsCheckoutSuccess] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    verificationCode: '',
  });
  const [verification, setVerification] = useState(null);
  const [checkoutError, setCheckoutError] = useState('');
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const newsletterInputRef = useRef(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch('/api/products');

        if (!response.ok) {
          throw new Error('No se pudieron cargar los productos');
        }

        const data = await response.json();
        setProducts(data.data?.products || data.products);
      } catch (error) {
        console.error(error);
        setProducts(fallbackProducts);
      }
    };

    loadProducts();
  }, []);

  useEffect(() => {
    let parsedCart = null;

    try {
      const savedCart = window.localStorage.getItem(CART_STORAGE_KEY);

      if (savedCart) {
        parsedCart = JSON.parse(savedCart);
      }
    } catch (error) {
      console.error('No se pudo recuperar el carrito:', error);
    }

    window.requestAnimationFrame(() => {
      if (Array.isArray(parsedCart)) {
        setCart(parsedCart);
      }

      setHasLoadedCart(true);
    });
  }, []);

  useEffect(() => {
    if (!hasLoadedCart) {
      return;
    }

    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart, hasLoadedCart]);

  const addToCartLocally = (product) => {
    setCart((prevCart) => {
      const existing = prevCart.find(item => item.id === product.id);
      if (existing) {
        return prevCart.map(item => 
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prevCart, { ...product, qty: 1 }];
    });
  };

  const addToCart = async (product) => {
    try {
      const response = await fetch('/api/carrito', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ producto_id: product.id, cantidad: 1 }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'No se pudo añadir al carrito');
      }

      setCart(result.data.items);
    } catch (error) {
      console.error(error);
      addToCartLocally(product);
    }

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

  const handleCheckoutField = (field, value) => {
    setCheckoutForm((prevForm) => ({ ...prevForm, [field]: value }));
    setCheckoutError('');
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const requestPurchaseVerification = async () => {
    const { firstName, lastName, email } = checkoutForm;
    if (!firstName.trim() || !lastName.trim()) {
      setCheckoutError('Completá tu nombre y apellido antes de continuar.');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setCheckoutError('Ingresá un email válido.');
      return;
    }
    setIsProcessingCheckout(true);
    setCheckoutError('');

    try {
      const response = await fetch('/api/checkout-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: checkoutForm.email,
          items: cart,
        }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'No se pudo verificar la compra');
      }

      setVerification(result.data);
      showToast('Código de verificación generado');
    } catch (error) {
      setCheckoutError(error.message);
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  const handlePlaceOrder = async () => {
    setIsProcessingCheckout(true);
    setCheckoutError('');

    try {
      const response = await fetch('/api/ordenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            firstName: checkoutForm.firstName,
            lastName: checkoutForm.lastName,
            email: checkoutForm.email,
          },
          verificationToken: verification?.token,
          verificationCode: checkoutForm.verificationCode,
          items: cart,
        }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'No se pudo confirmar el pedido');
      }

      setConfirmedOrder(result.data.order);
      setIsCheckoutSuccess(true);
      setCart([]);
      setVerification(null);
    } catch (error) {
      setCheckoutError(error.message);
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  const cartTotalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartTotalPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  return (
    <>
      {/* NAVEGACIÓN */}
      <nav aria-label="Navegación principal">
        <a href="#" className="nav-logo" aria-label="VitalCore - Ir al inicio">Vital<span>Core</span></a>
        <ul className="nav-links">
          <li><a href="#productos">Productos</a></li>
          <li><a href="#nosotros">Nosotros</a></li>
          <li><a href="/ordenes">Órdenes</a></li>
          <li><a href="#contacto">Contacto</a></li>
          <li><a href="/admin">Admin</a></li>
        </ul>
        <button
          className="cart-btn"
          onClick={() => setIsCartOpen(true)}
          aria-label={`Abrir carrito, ${cartTotalItems} ${cartTotalItems === 1 ? 'producto' : 'productos'}`}
        >
          <span className="cart-icon" aria-hidden="true">◻</span>
          Carrito
          <span className="cart-count" aria-hidden="true">{cartTotalItems}</span>
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
          {products.map((p, index) => (
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
          <label htmlFor="newsletter-email" className="visually-hidden">Tu email para suscripción</label>
          <input
            id="newsletter-email"
            className="newsletter-input"
            type="email"
            placeholder="tu@email.com"
            ref={newsletterInputRef}
            aria-label="Email para suscripción al newsletter"
          />
          <button
            className="newsletter-submit"
            onClick={() => {
              const val = newsletterInputRef.current?.value?.trim();
              const isValid = val && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
              showToast(isValid ? '¡Gracias por suscribirte!' : 'Ingresá un email válido');
              if (isValid && newsletterInputRef.current) {
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
      <div
        className={`cart-drawer ${isCartOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de compras"
      >
        <div className="drawer-header">
          <span className="drawer-title">CARRITO</span>
          <button className="drawer-close" onClick={() => setIsCartOpen(false)} aria-label="Cerrar carrito">✕</button>
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
                  <button className="qty-btn" onClick={() => updateQty(item.id, -1)} aria-label={`Reducir cantidad de ${item.name}`}>-</button>
                  <div className="qty-num" aria-label={`Cantidad: ${item.qty}`}>{item.qty}</div>
                  <button className="qty-btn" onClick={() => updateQty(item.id, 1)} aria-label={`Aumentar cantidad de ${item.name}`}>+</button>
                  <button className="remove-btn" onClick={() => removeItem(item.id)} aria-label={`Eliminar ${item.name} del carrito`}>✕</button>
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
              setCheckoutError('');
              setVerification(null);
              setConfirmedOrder(null);
            }}>
              Finalizar Compra
            </button>
            <button className="continue-btn" onClick={() => setIsCartOpen(false)}>Seguir Comprando</button>
          </div>
        )}
      </div>

      {/* CHECKOUT MODAL */}
      <div
        className={`checkout-modal ${isCheckoutOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Finalizar compra"
      >
        <div className="checkout-box">
          <button className="checkout-box-close" onClick={() => setIsCheckoutOpen(false)} aria-label="Cerrar checkout">✕</button>

          {!isCheckoutSuccess ? (
            <div>
              <div className="checkout-tag">{'// Finalizar compra'}</div>
              <div className="checkout-title">CHECKOUT</div>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="checkout-firstname">Nombre <span aria-hidden="true">*</span></label>
                  <input
                    id="checkout-firstname"
                    className="form-input"
                    type="text"
                    required
                    minLength={2}
                    autoComplete="given-name"
                    value={checkoutForm.firstName}
                    onChange={(event) => handleCheckoutField('firstName', event.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="checkout-lastname">Apellido <span aria-hidden="true">*</span></label>
                  <input
                    id="checkout-lastname"
                    className="form-input"
                    type="text"
                    required
                    minLength={2}
                    autoComplete="family-name"
                    value={checkoutForm.lastName}
                    onChange={(event) => handleCheckoutField('lastName', event.target.value)}
                  />
                </div>
              </div>

              <div className="form-row full">
                <div className="form-group">
                  <label className="form-label" htmlFor="checkout-email">Email para verificar <span aria-hidden="true">*</span></label>
                  <input
                    id="checkout-email"
                    className="form-input"
                    type="email"
                    required
                    autoComplete="email"
                    value={checkoutForm.email}
                    onChange={(event) => handleCheckoutField('email', event.target.value)}
                  />
                </div>
              </div>

              <div className="verification-panel">
                <button
                  className="continue-btn"
                  onClick={requestPurchaseVerification}
                  disabled={isProcessingCheckout}
                >
                  {verification ? 'Reenviar Código' : 'Enviar Código'}
                </button>
                {verification && (
                  <div className="verification-code-demo">
                    Código demo: <strong>{verification.demoCode}</strong>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label" htmlFor="checkout-code">Código de verificación</label>
                  <input
                    id="checkout-code"
                    className="form-input"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    autoComplete="one-time-code"
                    value={checkoutForm.verificationCode}
                    onChange={(event) => handleCheckoutField('verificationCode', event.target.value)}
                  />
                </div>
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

              {checkoutError && <div className="checkout-error" role="alert" aria-live="assertive">{checkoutError}</div>}

              <button
                className="place-order-btn"
                onClick={handlePlaceOrder}
                disabled={isProcessingCheckout || !verification}
              >
                {isProcessingCheckout ? 'Procesando...' : 'Confirmar Pedido'}
              </button>
            </div>
          ) : (
            <div className="success-state" style={{display: 'flex'}}>
              <div className="success-icon">✓</div>
              <div className="success-title">¡LISTO!</div>
              <p className="success-text">
                Pedido {confirmedOrder?.id} confirmado por ${confirmedOrder?.total?.toLocaleString('es-AR')}.
              </p>
              <a className="hero-cta success-link" href={`/checkout?orden=${confirmedOrder?.id}`}>Ir a pagar</a>
              <a className="continue-btn success-secondary-link" href="/ordenes">Ver órdenes</a>
            </div>
          )}
        </div>
      </div>

      {/* TOAST ALERTS */}
      <div className={`toast ${toastMsg ? 'show' : ''}`} role="status" aria-live="polite" aria-atomic="true">
        {toastMsg}
      </div>
    </>
  );
}
