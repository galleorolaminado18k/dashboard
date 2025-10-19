-- Reemplazando datos de ejemplo con lógica correcta de estados
-- Este archivo ahora solo referencia al script principal de datos
-- Los datos de ejemplo se crean en 015_clear_and_recreate_sample_data.sql

-- LÓGICA DE ESTADOS:
-- - Efectivo o Transferencia → Estado inicial: PAGADO (porque ya se pagó)
-- - Contraentrega → Estado inicial: PENDIENTE PAGO (porque se paga al recibir)
-- - Cuando se entrega → Estado puede cambiar a: ENTREGADO

-- Para recrear los datos de ejemplo, ejecutar:
-- scripts/015_clear_and_recreate_sample_data.sql
