-- Agregar columna para el estado de MiPaquete
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS mipaquete_status TEXT;

-- Agregar columna para la transportadora
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS mipaquete_carrier TEXT;

-- Actualizar el check constraint para incluir más estados
ALTER TABLE public.sales DROP CONSTRAINT IF EXISTS sales_status_check;
ALTER TABLE public.sales ADD CONSTRAINT sales_status_check 
  CHECK (status IN ('completada', 'pendiente', 'cancelada', 'en_transito', 'entregada', 'devolucion'));
