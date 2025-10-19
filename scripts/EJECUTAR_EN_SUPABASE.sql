-- =========================================================
-- SCRIPT DEFINITIVO PARA CREAR TABLA SALES EN SUPABASE
-- =========================================================
-- INSTRUCCIONES:
-- 1. Ve a tu proyecto de Supabase → SQL Editor
-- 2. Copia y pega TODO este script
-- 3. Haz clic en "Run" para ejecutarlo
-- 4. Después ve a Project Settings → API y haz clic en "Reload schema"
-- =========================================================

-- Extensiones necesarias para UUID
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- =========================================================
-- TABLA PRINCIPAL: public.sales
-- =========================================================
create table if not exists public.sales (
  id                uuid primary key default gen_random_uuid(),
  order_id          text unique,                     -- ID interno de la venta / pedido
  campaign_id       text,                            -- id de campaña de Meta (si aplica)
  campaign_name     text,                            -- nombre de campaña (para reportes)
  adset_id          text,                            -- ad set
  ad_id             text,                            -- anuncio
  customer_phone    text,                            -- clave para amarrar con CRM
  customer_name     text,
  city              text,                            -- ciudad para Geografía
  department        text,                            -- depto/estado opcional
  -- Separación de valores para excluir el envío en los ingresos:
  subtotal          numeric(12,2) not null default 0,  -- valor de productos SIN envío
  shipping_cost     numeric(12,2) not null default 0,  -- costo de envío (se excluye de ingresos)
  total             numeric(12,2) generated always as (subtotal + shipping_cost) stored, -- total solo de referencia
  payment_method    text check (payment_method in ('transferencia','efectivo','contraentrega')),
  is_return         boolean not null default false,     -- devoluciones
  mipaquete_code    text,                               -- guía de MiPaquete (para tracking)
  created_at        timestamptz not null default now()
);

comment on table public.sales is 'Ventas (subtotal sin envío). Compatible con /rest/v1/sales usados por la app.';
comment on column public.sales.subtotal is 'Valor de productos SIN envío (esto se usa para ingresos).';
comment on column public.sales.shipping_cost is 'Costo de envío (NO se usa para ingresos).';
comment on column public.sales.payment_method is 'transferencia | efectivo | contraentrega';

-- =========================================================
-- ÍNDICES PARA MEJORAR RENDIMIENTO
-- =========================================================
create index if not exists sales_created_at_idx on public.sales (created_at desc);
create index if not exists sales_city_idx       on public.sales (city);
create index if not exists sales_campaign_idx   on public.sales (campaign_id);
create index if not exists sales_payment_method_idx on public.sales (payment_method);
create index if not exists sales_is_return_idx  on public.sales (is_return);

-- =========================================================
-- VISTA PARA GEOGRAFÍA (ventas por ciudad)
-- =========================================================
create or replace view public.sales_geo as
select
  coalesce(city, 'Sin ciudad') as city,
  count(*)                     as orders,
  sum(subtotal)::numeric(12,2) as revenue,  -- SOLO subtotal (sin envío)
  min(created_at)              as first_sale_at,
  max(created_at)              as last_sale_at
from public.sales
where is_return = false
group by 1;

comment on view public.sales_geo is 'Agregados por ciudad (orders, revenue=subtotal) para el mapa/choropleth.';

-- =========================================================
-- RLS (Row Level Security) + POLÍTICAS
-- =========================================================
alter table public.sales enable row level security;

-- Eliminar políticas existentes si existen (para evitar duplicados)
drop policy if exists sales_select_all on public.sales;
drop policy if exists sales_upsert_service on public.sales;
drop policy if exists sales_update_service on public.sales;
drop policy if exists sales_delete_service on public.sales;

-- Política de lectura para anon y authenticated
create policy sales_select_all
  on public.sales
  for select
  to anon, authenticated
  using (true);

-- Políticas de escritura para service_role
create policy sales_upsert_service
  on public.sales
  for insert
  to service_role
  with check (true);

create policy sales_update_service
  on public.sales
  for update
  to service_role
  using (true)
  with check (true);

create policy sales_delete_service
  on public.sales
  for delete
  to service_role
  using (true);

-- =========================================================
-- PERMISOS EXPLÍCITOS
-- =========================================================
grant select on public.sales to anon, authenticated;
grant select on public.sales_geo to anon, authenticated;
grant insert, update, delete on public.sales to service_role;

-- =========================================================
-- DATOS DE PRUEBA (OPCIONAL - puedes comentar si no los necesitas)
-- =========================================================
insert into public.sales (order_id, campaign_id, campaign_name, customer_phone, customer_name, city, department, subtotal, shipping_cost, payment_method, is_return, mipaquete_code)
values
  ('ORD-001', '12023344568701113', 'Mensajes Mayor', '3001112233', 'Juan Pérez', 'Bogotá', 'Cundinamarca', 180000, 10000, 'contraentrega', false, 'MP1791809'),
  ('ORD-002', '120232224011150113', 'Balines WhatsApp', '3002223344', 'María García', 'Medellín', 'Antioquia', 250000, 12000, 'transferencia', false, 'MP1791810'),
  ('ORD-003', '12023344568701113', 'Mensajes Mayor', '3003334455', 'Carlos López', 'Cali', 'Valle del Cauca', 150000, 8000, 'efectivo', false, 'MP1791811'),
  ('ORD-004', '120232224011150113', 'Balines WhatsApp', '3004445566', 'Ana Martínez', 'Barranquilla', 'Atlántico', 200000, 15000, 'contraentrega', false, 'MP1791812'),
  ('ORD-005', '12023344568701113', 'Mensajes Mayor', '3005556677', 'Luis Rodríguez', 'Cartagena', 'Bolívar', 175000, 18000, 'transferencia', false, 'MP1791813'),
  ('ORD-006', '120232224011150113', 'Balines WhatsApp', '3006667788', 'Laura Sánchez', 'Bogotá', 'Cundinamarca', 220000, 10000, 'contraentrega', true, 'MP1791814'), -- Devolución
  ('ORD-007', '12023344568701113', 'Mensajes Mayor', '3007778899', 'Pedro Gómez', 'Medellín', 'Antioquia', 190000, 12000, 'efectivo', false, 'MP1791815'),
  ('ORD-008', '120232224011150113', 'Balines WhatsApp', '3008889900', 'Sofía Torres', 'Cali', 'Valle del Cauca', 280000, 8000, 'transferencia', false, 'MP1791816'),
  ('ORD-009', '12023344568701113', 'Mensajes Mayor', '3009990011', 'Diego Ramírez', 'Bucaramanga', 'Santander', 160000, 14000, 'contraentrega', false, 'MP1791817'),
  ('ORD-010', '120232224011150113', 'Balines WhatsApp', '3000001122', 'Valentina Cruz', 'Pereira', 'Risaralda', 210000, 11000, 'transferencia', false, 'MP1791818')
on conflict (order_id) do nothing;

-- =========================================================
-- MENSAJE DE CONFIRMACIÓN
-- =========================================================
do $$
begin
  raise notice '✅ Tabla public.sales creada exitosamente';
  raise notice '✅ Vista public.sales_geo creada';
  raise notice '✅ Índices creados';
  raise notice '✅ RLS y políticas configuradas';
  raise notice '✅ % registros de prueba insertados', (select count(*) from public.sales);
  raise notice '';
  raise notice '🔄 SIGUIENTE PASO: Ve a Project Settings → API y haz clic en "Reload schema"';
  raise notice '📊 Luego prueba: /rest/v1/sales?select=*';
  raise notice '🗺️  Y también: /rest/v1/sales_geo?select=*';
end $$;
