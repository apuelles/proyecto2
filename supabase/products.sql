create table if not exists public.products (
  id bigint generated always as identity primary key,
  name text not null,
  description text not null,
  tags text[] not null default '{}',
  price integer not null check (price >= 0),
  image_url text not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;

drop policy if exists "Anyone can read active products" on public.products;

create policy "Anyone can read active products"
on public.products
for select
using (active = true);

insert into public.products (name, description, tags, price, image_url, active, sort_order)
values
  (
    'Creatina',
    'Monohidrato de creatina pura. Aumenta la fuerza, potencia y recuperación muscular.',
    array['Fuerza', 'Potencia', 'Recuperación'],
    14990,
    '/images/product-creatina.jpg',
    true,
    1
  ),
  (
    'Proteína',
    'Whey protein de alta calidad con 25g de proteína por porción. Sabor premium.',
    array['Masa muscular', 'Whey', '25g Proteína'],
    22990,
    '/images/product-proteina.jpg',
    true,
    2
  ),
  (
    'Electrolitos',
    'Fórmula de hidratación avanzada con sodio, potasio y magnesio. Para el rendimiento máximo.',
    array['Hidratación', 'Resistencia', 'Sin azúcar'],
    8990,
    '/images/product-electrolitos.webp',
    true,
    3
  ),
  (
    'Pre Workout',
    'Fórmula explosiva con cafeína, beta-alanina y citrulina. Energía total desde el primer rep.',
    array['Energía', 'Enfoque', 'Bombeo'],
    18990,
    '/images/product-preworkout.jpg',
    true,
    4
  );
