# VitalCore

E-commerce de suplementos deportivos desarrollado para la materia Programación Web (ITBA 2026).

## Stack tecnológico

- **Frontend:** Next.js 16 (App Router), React 19
- **Base de datos:** Supabase (PostgreSQL con RLS)
- **Pagos:** Mercado Pago (Checkout Pro + webhooks)
- **Deploy:** Vercel

## Instalación local

```bash
git clone <repo-url>
cd proyecto
npm install
cp .env.example .env.local  # completar con tus credenciales
npm run dev
```

El sitio queda disponible en `http://localhost:3000`.

## Variables de entorno

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima de Supabase |
| `MERCADOPAGO_ACCESS_TOKEN` | Access Token de Mercado Pago (servidor) |
| `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` | Public Key de Mercado Pago (cliente) |
| `NEXT_PUBLIC_APP_URL` | URL pública de la app (webhooks y back_urls) |

Sin estas variables el sitio funciona en **modo demo** con datos en memoria.

## API Routes

### Productos
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/products` | Lista de productos activos |

### Carrito
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/carrito` | Items del carrito actual |
| POST | `/api/carrito` | Agregar producto al carrito |

### Órdenes
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/ordenes` | Órdenes del usuario |
| POST | `/api/ordenes` | Crear una nueva orden |
| GET | `/api/ordenes/[id]` | Detalle de una orden |

### Checkout y pagos
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/checkout-verification` | Generar código de verificación |
| POST | `/api/pagos/crear-preferencia` | Crear preferencia en Mercado Pago |
| POST | `/api/webhooks/mercado-pago` | Recibir notificaciones de pago |

### Admin (requiere header `x-user-role: admin`)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/admin/orders` | Todas las órdenes |
| PATCH | `/api/admin/orders/[id]` | Actualizar estado de una orden |
| GET | `/api/admin/products` | Todos los productos |
| PATCH | `/api/admin/products/[id]` | Actualizar stock o estado de un producto |

## Panel de administración

Disponible en `/admin`. Permite:
- Ver y gestionar todas las órdenes con sus estados
- Cambiar el estado de cualquier orden (`pendiente → procesando → enviado → entregado`)
- Ver y actualizar el stock de productos
- Activar o desactivar productos

## Base de datos

El esquema SQL está en `supabase/products.sql`. Ejecutarlo en el SQL Editor de Supabase crea las tablas `products`, `users`, `orders` y `order_items` con sus políticas RLS.

## Flujo de compra

1. El usuario agrega productos al carrito
2. Completa el formulario de checkout (nombre, apellido, email)
3. Solicita un código de verificación por email
4. Ingresa el código y confirma el pedido → orden en estado `pendiente`
5. Es redirigido a Checkout Pro de Mercado Pago
6. MP notifica el resultado vía webhook → orden pasa a `pagada` o `cancelada`
7. El usuario es redirigido a la página de resultado correspondiente

## Despliegue

Configurado para Vercel. Cada push a `main` dispara un deploy automático con lint y build validados por GitHub Actions.

Configurar las variables de entorno en **Vercel → Settings → Environment Variables** antes del primer deploy.
