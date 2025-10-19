-- Agregar columnas de ciudad y barrio a la tabla de facturas
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS ciudad TEXT,
ADD COLUMN IF NOT EXISTS barrio TEXT;

-- Actualizar facturas existentes con datos de ejemplo
UPDATE invoices SET ciudad = 'Cúcuta', barrio = 'Centro' WHERE invoice_number = 'FAC-2025-002';
UPDATE invoices SET ciudad = 'Bogotá', barrio = 'Chapinero' WHERE invoice_number = 'FAC-2025-001';
UPDATE invoices SET ciudad = 'Medellín', barrio = 'El Poblado' WHERE invoice_number = 'FAC-2025-003';

-- Comentario: Las columnas ciudad y barrio ahora son parte de la tabla de facturas
-- y se mostrarán en la columna "TRANSPORTADORA / CIUDAD" de la tabla
