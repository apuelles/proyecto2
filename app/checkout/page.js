'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

export default function CheckoutPage() {
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState('Cargando checkout...');
  const [isProcessing, setIsProcessing] = useState(false);
  const [preference, setPreference] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const currentOrderId = params.get('orden') || params.get('orderId') || '';

    if (!currentOrderId) {
      window.requestAnimationFrame(() => {
        setOrderId(currentOrderId);
        setStatus('Falta indicar una orden para pagar.');
      });
      return;
    }

    const loadOrder = async () => {
      try {
        const response = await fetch(`/api/ordenes/${currentOrderId}`, { cache: 'no-store' });
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'No se pudo cargar la orden');
        }

        setOrder(result.data.order);
        setStatus('');
      } catch (error) {
        setStatus(error.message);
      }
    };

    window.requestAnimationFrame(() => {
      setOrderId(currentOrderId);
    });
    loadOrder();
  }, []);

  const canPay = useMemo(() => order?.estado === 'pendiente' && !preference, [order, preference]);

  const createPaymentPreference = async () => {
    setIsProcessing(true);
    setStatus('');

    try {
      const response = await fetch('/api/pagos/crear-preferencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orden_id: orderId }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'No se pudo preparar el pago');
      }

      const pref = result.data.preference;
      setPreference(pref);
      setOrder((prevOrder) => ({
        ...prevOrder,
        metodo_pago: 'mercado_pago',
        referencia_pago: pref.id,
      }));

      if (pref.init_point) {
        window.location.href = pref.init_point;
        return;
      }
    } catch (error) {
      setStatus(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="orders-page checkout-page">
      <nav className="orders-nav">
        <Link href="/" className="nav-logo">Vital<span>Core</span></Link>
        <Link href="/ordenes" className="continue-btn orders-back">Volver a órdenes</Link>
      </nav>

      <section className="orders-hero checkout-hero">
        <div className="checkout-tag">{'// Preparación de pagos'}</div>
        <h1 className="orders-title">CHECKOUT</h1>
      </section>

      <section className="checkout-layout">
        {status && <div className="orders-status">{status}</div>}

        {order && (
          <>
            <article className="checkout-summary">
              <div>
                <div className="checkout-tag">Orden</div>
                <div className="checkout-order-id">{order.id}</div>
              </div>

              <div className="checkout-meta">
                <span>{order.estado}</span>
                <span>{order.metodo_pago || 'sin método'}</span>
              </div>

              <div className="order-summary checkout-order-summary">
                <div className="order-summary-title">Resumen de orden</div>
                <div className="order-items">
                  {order.items.map((item) => (
                    <div className="order-item" key={`${item.id}-${item.name}`}>
                      <span>{item.qty}x <span className="order-item-name">{item.name}</span></span>
                      <span>${item.subtotal.toLocaleString('es-AR')}</span>
                    </div>
                  ))}
                </div>
                <div className="order-divider"></div>
                <div className="order-total">
                  <span>Total</span>
                  <span>${order.total.toLocaleString('es-AR')}</span>
                </div>
              </div>
            </article>

            <aside className="payment-panel">
              <div className="payment-method selected">
                <div>
                  <div className="payment-title">Mercado Pago</div>
                  <div className="payment-text">Preferencia preparada para la integración real.</div>
                </div>
                <div className="payment-state">Activo</div>
              </div>

              <div className="payment-method disabled">
                <div>
                  <div className="payment-title">Transferencia bancaria</div>
                  <div className="payment-text">Disponible próximamente.</div>
                </div>
                <div className="payment-state">Luego</div>
              </div>

              <div className="security-note">
                SSL activo, orden validada en servidor y referencia externa lista para webhook.
              </div>

              {preference && !preference.init_point && (
                <div className="preference-box">
                  <div className="order-summary-title">Preferencia generada (modo demo)</div>
                  <div className="preference-id">{preference.id}</div>
                  <div className="payment-text">Configurá <code>MERCADOPAGO_ACCESS_TOKEN</code> en <code>.env.local</code> para activar la redirección real.</div>
                </div>
              )}

              <button
                className="place-order-btn"
                onClick={createPaymentPreference}
                disabled={!canPay || isProcessing}
              >
                {isProcessing ? 'Redirigiendo...' : 'Pagar con Mercado Pago'}
              </button>
            </aside>
          </>
        )}
      </section>
    </main>
  );
}
