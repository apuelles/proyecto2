create type public.estado_orden as enum (
  'pendiente', 'pagada', 'confirmada', 'enviada', 'entregada', 'cancelada'
);

create table if not exists public.products (
  id bigint generated always as identity primary key,
  name text not null,
  description text not null,
  tags text[] not null default '{}',
  price integer not null check (price >= 0),
  image_url text not null,
  active boolean not null default true,
  stock integer not null default 100 check (stock >= 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'cliente' check (role in ('cliente', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id bigint generated always as identity primary key,
  user_id text not null,
  customer_email text not null,
  customer_name text not null,
  total integer not null check (total >= 0),
  status public.estado_orden not null default 'pendiente',
  payment_method varchar(50),
  payment_reference varchar(255),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id bigint generated always as identity primary key,
  order_id bigint not null references public.orders(id) on delete cascade,
  product_id bigint not null references public.products(id),
  product_name text not null,
  quantity integer not null check (quantity > 0 and quantity <= 100),
  unit_price integer not null check (unit_price >= 0),
  subtotal integer not null check (subtotal >= 0)
);

create table if not exists public.cart_items (
  id bigint generated always as identity primary key,
  user_id text not null,
  product_id bigint not null references public.products(id),
  quantity integer not null check (quantity > 0 and quantity <= 100),
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create index if not exists idx_users_role on public.users(role);

alter table public.products enable row level security;
alter table public.users enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.cart_items enable row level security;

create policy "Anyone can read active products" on public.products
  for select using (active = true);

create policy "Users can read their profile" on public.users
  for select using (id = auth.uid());

create policy "Users can read own orders" on public.orders
  for select using (user_id = auth.uid()::text);

create policy "Admins can read all orders" on public.orders
  for all
  using (exists (select 1 from public.users where users.id = auth.uid() and users.role = 'admin'))
  with check (exists (select 1 from public.users where users.id = auth.uid() and users.role = 'admin'));

create policy "Users can read own order items" on public.order_items
  for select using (exists (
    select 1 from public.orders where orders.id = order_items.order_id and orders.user_id = auth.uid()::text
  ));

create policy "Admins can read all order items" on public.order_items
  for all
  using (exists (select 1 from public.users where users.id = auth.uid() and users.role = 'admin'))
  with check (exists (select 1 from public.users where users.id = auth.uid() and users.role = 'admin'));

create policy "Users can manage own cart" on public.cart_items
  for all using (user_id = auth.uid()::text) with check (user_id = auth.uid()::text);

create or replace function public.crear_orden_completa(
  p_usuario_id text,
  p_items jsonb,
  p_total integer,
  p_customer_email text,
  p_customer_name text
)
returns table (orden_id bigint, success boolean, error_msg text)
language plpgsql security definer set search_path = public
as $$
declare
  v_orden_id bigint;
  v_item jsonb;
  v_product_id bigint;
  v_quantity integer;
  v_product_name text;
  v_unit_price integer;
  v_expected_total integer := 0;
begin
  begin
    if p_items is null or jsonb_array_length(p_items) = 0 then
      raise exception 'La orden no tiene items';
    end if;

    for v_item in select * from jsonb_array_elements(p_items) loop
      v_product_id := (v_item->>'producto_id')::bigint;
      v_quantity := (v_item->>'cantidad')::integer;

      if v_quantity < 1 or v_quantity > 100 then
        raise exception 'Cantidad inválida para producto %', v_product_id;
      end if;

      select name, price into v_product_name, v_unit_price
      from public.products where id = v_product_id and active = true for update;

      if v_product_name is null then
        raise exception 'Producto % no encontrado', v_product_id;
      end if;

      update public.products set stock = stock - v_quantity
      where id = v_product_id and stock >= v_quantity;

      if not found then
        raise exception 'Stock insuficiente para %', v_product_name;
      end if;

      v_expected_total := v_expected_total + (v_unit_price * v_quantity);
    end loop;

    if v_expected_total <> p_total then
      raise exception 'Total inválido. Esperado %, recibido %', v_expected_total, p_total;
    end if;

    insert into public.orders (user_id, customer_email, customer_name, total, status)
    values (p_usuario_id, p_customer_email, p_customer_name, p_total, 'pendiente')
    returning id into v_orden_id;

    for v_item in select * from jsonb_array_elements(p_items) loop
      v_product_id := (v_item->>'producto_id')::bigint;
      v_quantity := (v_item->>'cantidad')::integer;

      select name, price into v_product_name, v_unit_price
      from public.products where id = v_product_id;

      insert into public.order_items (order_id, product_id, product_name, quantity, unit_price, subtotal)
      values (v_orden_id, v_product_id, v_product_name, v_quantity, v_unit_price, v_unit_price * v_quantity);
    end loop;

    delete from public.cart_items where user_id = p_usuario_id;

    return query select v_orden_id, true, null::text;
  exception when others then
    return query select null::bigint, false, sqlerrm;
  end;
end;
$$;

insert into public.products (name, description, tags, price, image_url, active, sort_order) values
  ('Creatina', 'Monohidrato de creatina pura. Aumenta la fuerza, potencia y recuperación muscular.', array['Fuerza', 'Potencia', 'Recuperación'], 14990, '/images/product-creatina.jpg', true, 1),
  ('Proteína', 'Whey protein de alta calidad con 25g de proteína por porción. Sabor premium.', array['Masa muscular', 'Whey', '25g Proteína'], 22990, '/images/product-proteina.jpg', true, 2),
  ('Electrolitos', 'Fórmula de hidratación avanzada con sodio, potasio y magnesio. Para el rendimiento máximo.', array['Hidratación', 'Resistencia', 'Sin azúcar'], 8990, '/images/product-electrolitos.webp', true, 3),
  ('Pre Workout', 'Fórmula explosiva con cafeína, beta-alanina y citrulina. Energía total desde el primer rep.', array['Energía', 'Enfoque', 'Bombeo'], 18990, '/images/product-preworkout.jpg', true, 4);
