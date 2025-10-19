-- Agregar columna para fecha de carga de evidencia fotográfica
ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS photo_uploaded_at TIMESTAMP WITH TIME ZONE;

-- Actualizar registros existentes con evidencia para establecer una fecha
UPDATE sales 
SET photo_uploaded_at = updated_at 
WHERE photo_evidence IS NOT NULL AND photo_uploaded_at IS NULL;

-- Crear índice para mejorar consultas por fecha de carga
CREATE INDEX IF NOT EXISTS idx_sales_photo_uploaded_at ON sales(photo_uploaded_at);
