import { hasMercadoPagoConfig, Payment, client } from "../../../../lib/mercadopago";
import { orders } from "../../../../lib/serverStore";

export async function GET() {
  return Response.json({ status: "webhook active" }, { status: 200 });
}

export async function POST(request) {
  let body;

  try {
    body = await request.json();
  } catch {
    return Response.json({ received: true }, { status: 200 });
  }

  const topic = body.topic || body.type;
  const resourceId = body.id || body.data?.id;

  if (topic === "payment" && resourceId) {
    try {
      let externalReference = body.external_reference || null;
      let newStatus = null;
      let paymentId = resourceId;

      if (hasMercadoPagoConfig) {
        const payment = new Payment(client);
        const paymentData = await payment.get({ id: resourceId });
        externalReference = paymentData.external_reference || externalReference;
        paymentId = paymentData.id || resourceId;

        const mpStatus = paymentData.status;
        if (mpStatus === "approved") newStatus = "pagada";
        else if (mpStatus === "rejected" || mpStatus === "cancelled") newStatus = "cancelada";
      }

      if (externalReference && newStatus) {
        const order = orders.find((o) => String(o.id) === String(externalReference));
        if (order) {
          order.estado = newStatus;
          order.referencia_pago = String(paymentId);
          if (newStatus === "pagada") {
            order.pagado_en = new Date().toISOString();
          }
        }
      }
    } catch (error) {
      console.error("Webhook error processing payment:", error?.message || error);
    }
  }

  return Response.json({ received: true }, { status: 200 });
}
