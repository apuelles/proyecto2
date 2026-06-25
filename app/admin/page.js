'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

const ADMIN_HEADERS = { 'x-user-role': 'admin', 'Content-Type': 'application/json' };
const ORDER_STATES = ['pendiente', 'procesando', 'enviado', 'entregado', 'pagada', 'cancelada'];

const STATE_COLORS = {
  pendiente: '#f39c12',
  procesando: '#3498db',
  enviado: '#9b59b6',
  entregado: '#27ae60',
  pagada: '#27ae60',
  cancelada: '#e74c3c',
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [adminProducts, setAdminProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState({ msg: '', type: 'ok' });
  const [stockEdits, setStockEdits] = useState({});

  const showFlash = (msg, type = 'ok') => {
    setFlash({ msg, type });
    setTimeout(() => setFlash({ msg: '', type: 'ok' }), 2500);
  };

  const loadOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/orders', { headers: ADMIN_HEADERS });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cargar órdenes');
      setOrders(data.data?.orders || []);
    } catch (e) {
      showFlash(e.message, 'err');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/products', { headers: ADMIN_HEADERS });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cargar productos');
      setAdminProducts(data.data?.products || []);
    } catch (e) {
      showFlash(e.message, 'err');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      if (activeTab === 'orders') loadOrders();
      else loadProducts();
    }, 0);
    return () => clearTimeout(timer);
  }, [activeTab, loadOrders, loadProducts]);

  const updateOrderStatus = async (orderId, estado) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: ADMIN_HEADERS,
        body: JSON.stringify({ estado }),
      });
      if (!res.ok) throw new Error('No se pudo actualizar');
      showFlash(`Orden actualizada a "${estado}"`);
      loadOrders();
    } catch (e) {
      showFlash(e.message, 'err');
    }
  };

  const updateProduct = async (productId, updates) => {
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: ADMIN_HEADERS,
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('No se pudo actualizar');
      showFlash('Producto actualizado');
      loadProducts();
    } catch (e) {
      showFlash(e.message, 'err');
    }
  };

  return (
    <main className="orders-page" aria-label="Panel de administración">
      <nav className="orders-nav" aria-label="Navegación admin">
        <Link href="/" className="nav-logo">Vital<span>Core</span></Link>
        <span style={{ color: '#7b61ff', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.05em' }}>
          ADMIN
        </span>
        <Link href="/ordenes" className="continue-btn orders-back">Ver tienda</Link>
      </nav>

      <section className="orders-hero" style={{ borderTop: '4px solid #7b61ff' }}>
        <div className="checkout-tag" style={{ color: '#7b61ff' }}>{'// Panel de control'}</div>
        <h1 className="orders-title" style={{ color: '#7b61ff' }}>ADMINISTRACIÓN</h1>
      </section>

      <div style={{ display: 'flex', gap: '1rem', padding: '0 2rem 1.5rem', borderBottom: '1px solid #222' }}>
        <button
          onClick={() => setActiveTab('orders')}
          className={activeTab === 'orders' ? 'place-order-btn' : 'continue-btn'}
          style={{ width: 'auto', padding: '0.5rem 1.5rem' }}
          aria-pressed={activeTab === 'orders'}
        >
          Órdenes
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={activeTab === 'products' ? 'place-order-btn' : 'continue-btn'}
          style={{ width: 'auto', padding: '0.5rem 1.5rem' }}
          aria-pressed={activeTab === 'products'}
        >
          Productos
        </button>
      </div>

      {flash.msg && (
        <div
          role="alert"
          style={{
            padding: '0.75rem 2rem',
            color: flash.type === 'err' ? '#e74c3c' : '#27ae60',
            fontSize: '0.9rem',
            borderLeft: `3px solid ${flash.type === 'err' ? '#e74c3c' : '#27ae60'}`,
            margin: '1rem 2rem 0',
          }}
        >
          {flash.msg}
        </div>
      )}

      {loading ? (
        <p style={{ color: '#888', padding: '3rem', textAlign: 'center' }}>Cargando...</p>
      ) : activeTab === 'orders' ? (
        <section className="orders-list" aria-label="Lista de órdenes">
          {orders.length === 0 ? (
            <div className="orders-empty">
              <p>No hay órdenes registradas.</p>
            </div>
          ) : (
            orders.map((order) => (
              <article className="order-card" key={order.id}>
                <div className="order-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <div className="order-card-id" style={{ fontSize: '0.8rem' }}>{order.id}</div>
                    <div style={{ color: '#888', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                      {order.customer?.firstName} {order.customer?.lastName} — {order.customer?.email}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                    <span style={{ color: STATE_COLORS[order.estado] || '#ccc', fontWeight: 700, fontSize: '0.85rem' }}>
                      {order.estado}
                    </span>
                    <span style={{ color: '#ccc', fontWeight: 600 }}>
                      ${order.total?.toLocaleString('es-AR')}
                    </span>
                  </div>
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <div style={{ color: '#666', fontSize: '0.75rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Cambiar estado:
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {ORDER_STATES.map((state) => (
                      <button
                        key={state}
                        onClick={() => updateOrderStatus(order.id, state)}
                        aria-label={`Cambiar orden a ${state}`}
                        aria-pressed={order.estado === state}
                        style={{
                          padding: '0.25rem 0.6rem',
                          fontSize: '0.75rem',
                          border: `1px solid ${order.estado === state ? STATE_COLORS[state] : '#333'}`,
                          background: order.estado === state ? STATE_COLORS[state] : 'transparent',
                          color: order.estado === state ? '#fff' : '#888',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        {state}
                      </button>
                    ))}
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      ) : (
        <section className="orders-list" aria-label="Lista de productos">
          {adminProducts.length === 0 ? (
            <div className="orders-empty">
              <p>No hay productos registrados.</p>
            </div>
          ) : (
            adminProducts.map((product) => (
              <article className="order-card" key={product.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#fff', marginBottom: '0.25rem' }}>{product.name}</div>
                    <div style={{ color: '#888', fontSize: '0.85rem' }}>
                      Precio: <strong style={{ color: '#ccc' }}>${product.price?.toLocaleString('es-AR')}</strong>
                      &nbsp;·&nbsp;Stock actual: <strong style={{ color: '#ccc' }}>{product.stock ?? '—'}</strong>
                    </div>
                  </div>
                  <span style={{
                    color: product.active !== false ? '#27ae60' : '#e74c3c',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                  }}>
                    {product.active !== false ? 'ACTIVO' : 'INACTIVO'}
                  </span>
                </div>

                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <label htmlFor={`stock-${product.id}`} style={{ color: '#666', fontSize: '0.8rem' }}>
                    Nuevo stock:
                  </label>
                  <input
                    id={`stock-${product.id}`}
                    type="number"
                    min="0"
                    value={stockEdits[product.id] ?? product.stock ?? 0}
                    onChange={(e) => setStockEdits((prev) => ({ ...prev, [product.id]: e.target.value }))}
                    className="form-input"
                    style={{ width: '80px', padding: '0.3rem 0.5rem' }}
                    aria-label={`Stock de ${product.name}`}
                  />
                  <button
                    onClick={() => updateProduct(product.id, { stock: Number(stockEdits[product.id] ?? product.stock) })}
                    className="continue-btn"
                    style={{ width: 'auto', padding: '0.3rem 0.9rem', fontSize: '0.8rem' }}
                  >
                    Guardar stock
                  </button>
                  <button
                    onClick={() => updateProduct(product.id, { active: !(product.active !== false) })}
                    className="continue-btn"
                    style={{ width: 'auto', padding: '0.3rem 0.9rem', fontSize: '0.8rem' }}
                    aria-label={`${product.active !== false ? 'Desactivar' : 'Activar'} ${product.name}`}
                  >
                    {product.active !== false ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              </article>
            ))
          )}
        </section>
      )}
    </main>
  );
}
