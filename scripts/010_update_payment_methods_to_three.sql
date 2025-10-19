-- Actualizar métodos de pago a solo 3 opciones: efectivo, transferencia, contraentrega
-- Migrar "credito" y "tarjeta" a "contraentrega"

-- Actualizar tabla de ventas
ALTER TABLE public.sales DROP CONSTRAINT IF EXISTS sales_payment_method_check;

-- Migrar datos existentes
UPDATE public.sales 
SET payment_method = 'contraentrega' 
WHERE payment_method IN ('credito', 'tarjeta');

-- Agregar nueva constraint con solo 3 métodos
ALTER TABLE public.sales 
ADD CONSTRAINT sales_payment_method_check 
CHECK (payment_method IN ('efectivo', 'transferencia', 'contraentrega'));

-- Actualizar tabla de facturas
ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_payment_method_check;

-- Migrar datos existentes en facturas
UPDATE public.invoices 
SET payment_method = 'contraentrega' 
WHERE payment_method IN ('credito', 'tarjeta');

-- Agregar nueva constraint con solo 3 métodos
ALTER TABLE public.invoices 
ADD CONSTRAINT invoices_payment_method_check 
CHECK (payment_method IN ('efectivo', 'transferencia', 'contraentrega'));

-- Comentario explicativo
COMMENT ON COLUMN public.sales.payment_method IS 'Método de pago: efectivo, transferencia, o contraentrega (crédito)';
COMMENT ON COLUMN public.invoices.payment_method IS 'Método de pago: efectivo, transferencia, o contraentrega (crédito)';
