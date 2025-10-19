import os
import sys

# Leer las variables de entorno
supabase_url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
supabase_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

if not supabase_url or not supabase_key:
    print("❌ Error: Faltan variables de entorno")
    print("\nNecesitas configurar:")
    print("  - NEXT_PUBLIC_SUPABASE_URL")
    print("  - SUPABASE_SERVICE_ROLE_KEY")
    print("\nVe a la sección 'Vars' en el sidebar izquierdo para agregarlas.")
    sys.exit(1)

try:
    from supabase import create_client
    
    # Crear cliente de Supabase
    supabase = create_client(supabase_url, supabase_key)
    
    # Leer el script SQL
    with open('scripts/001_create_sales_tables.sql', 'r', encoding='utf-8') as f:
        sql_script = f.read()
    
    print("🔄 Ejecutando script SQL para crear tablas...")
    
    # Ejecutar el script SQL
    # Nota: Supabase Python no tiene un método directo para ejecutar SQL raw
    # Necesitamos usar la API REST directamente
    import requests
    
    # Extraer el proyecto ID de la URL
    project_ref = supabase_url.replace('https://', '').split('.')[0]
    
    # URL de la API de Supabase para ejecutar SQL
    sql_url = f"https://{project_ref}.supabase.co/rest/v1/rpc/exec_sql"
    
    headers = {
        'apikey': supabase_key,
        'Authorization': f'Bearer {supabase_key}',
        'Content-Type': 'application/json'
    }
    
    print("\n⚠️  IMPORTANTE:")
    print("Este script necesita que ejecutes el SQL manualmente en Supabase.")
    print("\nPasos:")
    print("1. Ve a tu proyecto en Supabase Dashboard")
    print("2. Abre el SQL Editor")
    print("3. Copia y pega el contenido de 'scripts/001_create_sales_tables.sql'")
    print("4. Ejecuta el script")
    print("\nO usa el siguiente comando si tienes Supabase CLI instalado:")
    print(f"  supabase db execute --file scripts/001_create_sales_tables.sql")
    
    print("\n✅ Una vez ejecutado el script, recarga la página de ventas.")
    
except ImportError:
    print("❌ Error: No se pudo importar la librería de Supabase")
    print("\nEste script requiere la librería 'supabase' de Python.")
    print("Sin embargo, para este proyecto, es más fácil ejecutar el SQL directamente.")
    print("\nPor favor, ejecuta el script SQL manualmente:")
    print("1. Abre scripts/001_create_sales_tables.sql")
    print("2. Copia todo el contenido")
    print("3. Ve a tu Supabase Dashboard > SQL Editor")
    print("4. Pega y ejecuta el script")
except Exception as e:
    print(f"❌ Error: {str(e)}")
    sys.exit(1)
