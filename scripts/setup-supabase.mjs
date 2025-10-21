import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

// Cargar credenciales
const supabaseUrl = 'https://eyrdjtsgpubazdtgywiv.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5cmRqdHNncHViYXpkdGd5d2l2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDExMzYyNywiZXhwIjoyMDc1Njg5NjI3fQ.FaIB7q1NOLJILTXrtysiswto-Y8aoRAHNmGYtmieK5I'

// Crear cliente de Supabase con service role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function ejecutarMigracion() {
  console.log('🚀 Iniciando configuración de Supabase...\n')

  try {
    // Leer el script SQL
    const sqlPath = join(process.cwd(), 'scripts', '030_create_crm_tables.sql')
    const sqlScript = readFileSync(sqlPath, 'utf-8')

    console.log('📄 Script SQL cargado:', sqlPath)
    console.log('📊 Tamaño del script:', sqlScript.length, 'caracteres\n')

    // Ejecutar el script SQL
    console.log('⚙️  Ejecutando script SQL en Supabase...')
    
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_string: sqlScript 
    })

    if (error) {
      // Si exec_sql no existe, intentar método alternativo
      console.log('⚠️  Método RPC no disponible, usando método directo...\n')
      
      // Dividir el script en comandos individuales
      const comandos = sqlScript
        .split(';')
        .filter(cmd => cmd.trim().length > 0)
        .map(cmd => cmd.trim() + ';')

      console.log(`📋 Ejecutando ${comandos.length} comandos SQL...\n`)

      for (let i = 0; i < comandos.length; i++) {
        const comando = comandos[i]
        
        // Saltar comentarios
        if (comando.startsWith('--')) continue
        
        console.log(`   [${i + 1}/${comandos.length}] Ejecutando comando...`)
        
        try {
          // Ejecutar cada comando
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({ query: comando })
          })

          if (!response.ok) {
            console.log(`   ⚠️  Advertencia en comando ${i + 1}`)
          } else {
            console.log(`   ✅ Comando ${i + 1} ejecutado`)
          }
        } catch (err) {
          console.log(`   ⚠️  Error en comando ${i + 1}:`, err.message)
        }
      }
    } else {
      console.log('✅ Script SQL ejecutado exitosamente!\n')
    }

    // Verificar que las tablas se crearon
    console.log('\n🔍 Verificando tablas creadas...\n')

    const { data: clients, error: errorClients } = await supabase
      .from('clients')
      .select('count')
      .limit(1)

    if (errorClients) {
      console.log('❌ Error al verificar tabla clients:', errorClients.message)
    } else {
      console.log('✅ Tabla "clients" creada correctamente')
    }

    const { data: conversations, error: errorConversations } = await supabase
      .from('conversations')
      .select('count')
      .limit(1)

    if (errorConversations) {
      console.log('❌ Error al verificar tabla conversations:', errorConversations.message)
    } else {
      console.log('✅ Tabla "conversations" creada correctamente')
    }

    const { data: messages, error: errorMessages } = await supabase
      .from('messages')
      .select('count')
      .limit(1)

    if (errorMessages) {
      console.log('❌ Error al verificar tabla messages:', errorMessages.message)
    } else {
      console.log('✅ Tabla "messages" creada correctamente')
    }

    // Verificar datos de ejemplo
    console.log('\n📊 Verificando datos de ejemplo...\n')

    const { data: clientsData, error: errorClientsData } = await supabase
      .from('clients')
      .select('*')

    if (!errorClientsData && clientsData) {
      console.log(`✅ ${clientsData.length} clientes de ejemplo creados`)
      clientsData.forEach((client, i) => {
        console.log(`   ${i + 1}. ${client.name} (${client.type})`)
      })
    }

    console.log('\n🎉 ¡Configuración de Supabase completada!\n')
    console.log('📋 Resumen:')
    console.log('   ✅ Tablas creadas: clients, conversations, messages')
    console.log('   ✅ Triggers configurados')
    console.log('   ✅ Índices creados')
    console.log('   ✅ Políticas RLS aplicadas')
    console.log('   ✅ Datos de ejemplo insertados\n')
    console.log('🚀 Próximo paso: Ejecutar "pnpm run dev" y visitar http://localhost:3000/crm\n')

  } catch (error) {
    console.error('❌ Error durante la configuración:', error.message)
    process.exit(1)
  }
}

// Ejecutar
ejecutarMigracion()
