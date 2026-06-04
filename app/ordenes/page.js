'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('Cargando órdenes...');

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const response = await fetch('/api/ordenes', { cache: 'no-store' });
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'No se pudieron cargar las órdenes');
        }

        setOrders(result.data.orders);
        setStatus('');
      } catch (error) {
        setStatus(error.message);
      }
    };

    loadOrders();
  }, []);

  return (
    <main className="orders-page">
      <nav className="orders-nav">
        <Link href="/" className="nav-logo">Vital<span>Core</span></Link>
        <Link href="/#productos" className="continue-btn orders-back">Volver al catálogo</Link>
      </nav>

      <section className="orders-hero">
        <div className="checkout-tag">{'// Historial de compras'}</div>
        <h1 className="orders-title">ÓRDENES</h1>
      </section>

      <section className="orders-list">
        {status && <p className="orders-status">{status}</p>}

        {!status && orders.length === 0 && (
          <div className="orders-empty">
            <p>Todavía no hay órdenes registradas.</p>
            <Link href="/#productos" className="hero-cta">Comprar productos</Link>
          </div>
        )}

        {orders.map((order) => (
          <article className="order-card" key={order.id}>
            <div>
              <div className="order-card-id">{order.id}</div>
              <div className="order-card-date">
                {new Intl.DateTimeFormat('es-AR', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }).format(new Date(order.created_at))}
              </div>
            </div>
            <div className="order-card-state">{order.estado}</div>
            <div className="order-card-total">${order.total.toLocaleString('es-AR')}</div>
            <Link className="order-card-link" href={`/checkout?orden=${order.id}`}>
              Ir a checkout
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}
