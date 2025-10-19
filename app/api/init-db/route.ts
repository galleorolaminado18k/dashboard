import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST() {
  try {
    const supabaseUrl = process.env.SUPABASE_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Missing Supabase credentials" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const createTableSQL = `
      -- Limpiar versiones anteriores
      DROP VIEW IF EXISTS public.sales CASCADE;
      DROP TABLE IF EXISTS public.sales CASCADE;

      -- Crear tabla sales con estructura completa
      CREATE TABLE public.sales (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        
        -- Información del cliente
        client_name TEXT,
        client_phone TEXT,
        client_address TEXT,
        city TEXT,
        
        -- Información de productos
        products JSONB DEFAULT '[]'::jsonb,
        
        -- Información financiera
        payment_method TEXT,
        total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
        shipping_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
        revenue_no_shipping NUMERIC(12,2) GENERATED ALWAYS AS 
          (COALESCE(total_amount, 0) - COALESCE(shipping_amount, 0)) STORED,
        
        -- Estado de la venta
        status TEXT DEFAULT 'pendiente',
        is_return BOOLEAN NOT NULL DEFAULT false,
        
        -- Información de envío (MiPaquete)
        mipaquete_code TEXT,
        mipaquete_status TEXT,
        paid_by_mipaquete BOOLEAN DEFAULT false,
        carrier TEXT,
        
        -- Facturación
        invoice_number TEXT,
        
        -- Marketing y atribución
        campaign_id TEXT,
        utm_source TEXT,
        utm_medium TEXT,
        utm_campaign TEXT,
        
        -- Evidencia
        evidence_url TEXT,
        
        -- Auditoría
        updated_at TIMESTAMPTZ DEFAULT now()
      );

      -- Crear índices
      CREATE INDEX idx_sales_created_at ON public.sales(created_at DESC);
      CREATE INDEX idx_sales_city ON public.sales(city);
      CREATE INDEX idx_sales_status ON public.sales(status);
      CREATE INDEX idx_sales_payment_method ON public.sales(payment_method);
      CREATE INDEX idx_sales_mipaquete_code ON public.sales(mipaquete_code);
      CREATE INDEX idx_sales_is_return ON public.sales(is_return);

      -- Habilitar RLS
      ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

      -- Crear políticas permisivas
      CREATE POLICY "Permitir todo" ON public.sales FOR ALL USING (true) WITH CHECK (true);

      -- Insertar datos de ejemplo
      INSERT INTO public.sales (
        client_name, client_phone, city, payment_method, 
        total_amount, shipping_amount, status, products
      ) VALUES
        ('Juan Pérez', '3001234567', 'Bogotá', 'contraentrega', 150000, 15000, 'entregado', '[{"name":"Producto A","quantity":2,"price":67500}]'::jsonb),
        ('María García', '3009876543', 'Medellín', 'transferencia', 200000, 20000, 'pendiente', '[{"name":"Producto B","quantity":1,"price":200000}]'::jsonb),
        ('Carlos López', '3005551234', 'Cali', 'contraentrega', 180000, 18000, 'en_transito', '[{"name":"Producto C","quantity":3,"price":60000}]'::jsonb);
    `

    // Intentar ejecutar el SQL directamente
    const { error: execError } = await supabase.rpc("exec_sql", {
      sql: createTableSQL,
    })

    if (execError) {
      console.error("[v0] Error con exec_sql:", execError)

      // Verificar si la tabla existe
      const { error: checkError } = await supabase.from("sales").select("id").limit(1)

      if (checkError && checkError.code === "42P01") {
        return NextResponse.json(
          {
            error: "Database needs manual initialization",
            message: "Por favor ejecuta el script 023_create_sales_table_final_fix.sql desde la interfaz de v0",
            hint: "Busca el archivo en la carpeta /scripts y haz clic en el botón de ejecutar",
          },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({ success: true, message: "Base de datos inicializada correctamente" })
  } catch (error: any) {
    console.error("[v0] Error inicializando base de datos:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabaseUrl = process.env.SUPABASE_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ initialized: false, error: "Missing credentials" })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verificar si la tabla existe
    const { error } = await supabase.from("sales").select("id").limit(1)

    if (error && error.code === "42P01") {
      return NextResponse.json({ initialized: false, error: "Table does not exist" })
    }

    return NextResponse.json({ initialized: true })
  } catch (error: any) {
    return NextResponse.json({ initialized: false, error: error.message })
  }
}
