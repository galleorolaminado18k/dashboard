-- Vincular facturas existentes con ventas correspondientes basándose en el nombre del cliente
UPDATE public.sales 
SET invoice_number = 'FAC-2025-0001'
WHERE client_name = 'María González' AND invoice_number IS NULL;

UPDATE public.sales 
SET invoice_number = 'FAC-2025-0002'
WHERE client_name = 'Carlos Rodríguez' AND invoice_number IS NULL;

UPDATE public.sales 
SET invoice_number = 'FAC-2025-0003'
WHERE client_name = 'Laura Martínez' AND invoice_number IS NULL;
