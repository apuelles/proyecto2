'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function PagoFallidoPage() {
  const [params, setParams] = useState({});

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    setParams({
      paymentId: search.get('payment_id') || search.get('collection_id') || '',
      status: search.get('status') || search.get('collection_status') || 'rejected',
      externalRef: search.get('external_reference') || '',
    });
  }, []);

  return (
    <main className="orders-page">
      <nav className="orders-nav">
        <Link href="/" className="nav-logo">Vital<span>Core</span></Link>
        <Link href="/ordenes" className="continue-btn orders-back">Mis órdenes</Link>
      </nav>

      <section className="orders-hero" style={{ borderTop: '4px solid #e74c3c' }}>
        <div className="checkout-tag" style={{ color: '#e74c3c' }}>{'// Pago rechazado'}</div>
        <h1 className="orders-title" style={{ color: '#e74c3c' }}>PAGO FALLIDO</h1>
      </section>

      <section className="orders-list" style={{ maxWidth: 600, margin: '0 auto', padding: '2rem 1rem', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✕</div>
        <p style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#ccc' }}>
          No se pudo procesar tu pago.
        </p>

        <div className="preference-box" style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
          <div className="order-summary-title">Posibles razones</div>
          <ul style={{ marginTop: '0.75rem', color: '#aaa', fontSize: '0.9rem', paddingLeft: '1.2rem', lineHeight: '2' }}>
            <li>Fondos insuficientes en la tarjeta</li>
            <li>Tarjeta rechazada por el banco emisor</li>
            <li>Datos de tarjeta incorrectos</li>
            <li>La operación fue cancelada</li>
          </ul>
        </div>

        {params.externalRef && (
          <div className="preference-box" style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
            <div className="order-summary-title">Referencia</div>
            <div style={{ marginTop: '0.75rem' }}>
              <span style={{ color: '#888', fontSize: '0.85rem' }}>Orden: </span>
              <span className="preference-id" style={{ fontSize: '0.85rem' }}>{params.externalRef}</span>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {params.externalRef && (
            <Link
              href={`/checkout?orden=${params.externalRef}`}
              className="place-order-btn"
              style={{ textDecoration: 'none', textAlign: 'center', background: '#e74c3c' }}
            >
              Reintentar pago
            </Link>
          )}
          <Link href="/ordenes" className="continue-btn" style={{ textDecoration: 'none', textAlign: 'center' }}>
            Ver mis órdenes
          </Link>
        </div>
      </section>
    </main>
  );
}
