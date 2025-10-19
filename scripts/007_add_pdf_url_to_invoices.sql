-- Agregar columna para almacenar la URL del PDF de la factura en Vercel Blob
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- Agregar índice para búsquedas rápidas por URL
CREATE INDEX IF NOT EXISTS idx_invoices_pdf_url ON invoices(pdf_url);
