-- Agregar columna de referencia a invoice_items
ALTER TABLE invoice_items
ADD COLUMN IF NOT EXISTS reference TEXT;

-- Actualizar datos de ejemplo con referencias
UPDATE invoice_items
SET reference = CASE 
  WHEN description LIKE '%Anillo%' THEN 'REF-001'
  WHEN description LIKE '%Balin%' THEN 'REF-002'
  WHEN description LIKE '%Aretes%' THEN 'REF-003'
  WHEN description LIKE '%Pulsera%' THEN 'REF-004'
  WHEN description LIKE '%Cadena%' THEN 'REF-005'
  ELSE NULL
END;
