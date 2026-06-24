import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
export const hasMercadoPagoConfig = Boolean(accessToken);

export const client = hasMercadoPagoConfig
  ? new MercadoPagoConfig({ accessToken })
  : null;

export { Preference, Payment };
