'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function PagoCompletadoPage() {
  const [params, setParams] = useState({});

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    setParams({
      paymentId: search.get('payment_id') || search.get('collection_id') || '',
      status: search.get('status') || search.get('collection_status') || 'approved',
      externalRef: search.get('external_reference') || '',
      paymentType: search.get('payment_type') || '',
    });
  }, []);

  return (
    <main className="orders-page">
      <nav className="orders-nav">
        <Link href="/" className="nav-logo">Vital<span>Core</span></Link>
        <Link href="/ordenes" className="continue-btn orders-back">Mis órdenes</Link>
      </nav>

      <section className="orders-hero" style={{ borderTop: '4px solid #27ae60' }}>
        <div className="checkout-tag" style={{ color: '#27ae60' }}>{'// Pago aprobado'}</div>
        <h1 className="orders-title" style={{ color: '#27ae60' }}>¡LISTO!</h1>
      </section>

      <section className="orders-list" style={{ maxWidth: 600, margin: '0 auto', padding: '2rem 1rem', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✓</div>
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem', color: '#ccc' }}>
          Tu pago fue procesado exitosamente por Mercado Pago.
        </p>

        {params.paymentId && (
          <div className="preference-box" style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
            <div className="order-summary-title">Detalles del pago</div>
            <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {params.paymentId && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#888', fontSize: '0.85rem' }}>ID de pago</span>
                  <span className="preference-id" style={{ fontSize: '0.85rem' }}>{params.paymentId}</span>
                </div>
              )}
              {params.externalRef && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#888', fontSize: '0.85rem' }}>Referencia de orden</span>
                  <span className="preference-id" style={{ fontSize: '0.85rem' }}>{params.externalRef}</span>
                </div>
              )}
              {params.status && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#888', fontSize: '0.85rem' }}>Estado</span>
                  <span style={{ color: '#27ae60', fontSize: '0.85rem', fontWeight: 600 }}>{params.status}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Link href="/ordenes" className="place-order-btn" style={{ textDecoration: 'none', textAlign: 'center' }}>
            Ver mis órdenes
          </Link>
          <Link href="/#productos" className="continue-btn" style={{ textDecoration: 'none', textAlign: 'center' }}>
            Seguir comprando
          </Link>
        </div>
      </section>
    </main>
  );
}
