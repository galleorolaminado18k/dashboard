-- Script para verificar el valor de shipping_cost en las facturas
-- Ejecutar en Supabase SQL Editor

-- Ver todas las facturas con sus valores de shipping_cost
SELECT
  invoice_number,
  client_name,
  total,
  shipping_cost,
  CASE
    WHEN shipping_cost IS NULL THEN 'NULL'
    WHEN shipping_cost = 0 THEN 'CERO'
    ELSE 'TIENE VALOR'
  END as shipping_status,
  created_at
FROM invoices
ORDER BY created_at DESC
LIMIT 20;

-- Ver estadísticas de shipping_cost
SELECT
  COUNT(*) as total_facturas,
  COUNT(shipping_cost) as con_shipping_cost,
  COUNT(*) - COUNT(shipping_cost) as sin_shipping_cost,
  SUM(CASE WHEN shipping_cost > 0 THEN 1 ELSE 0 END) as con_valor_mayor_cero,
  AVG(shipping_cost) as promedio_shipping,
  MAX(shipping_cost) as max_shipping,
  MIN(shipping_cost) as min_shipping
FROM invoices;

-- Ver una factura específica (cambiar el número por el que quieras verificar)
SELECT
  *
FROM invoices
WHERE invoice_number = '000021';

