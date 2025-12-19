import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxy reverso para MiPaquete
 * NOTA: MiPaquete bloquea proxies y scraping
 * Esta solución redirige directamente en lugar de hacer proxy
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const guia = searchParams.get('guia')

    if (!guia) {
      return NextResponse.json({ error: 'Guía requerida' }, { status: 400 })
    }

    // URL del portal de MiPaquete
    const mipaqueteUrl = `https://centrodenovedades.mipaquete.com/novedades/envios-con-novedad?search=${encodeURIComponent(guia)}`

    console.log('🌐 Redirigiendo a MiPaquete para guía:', guia)

    // Crear HTML personalizado que redirige o muestra iframe con fallback
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Portal MiPaquete - Guía ${guia}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      color: white;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    .container {
      max-width: 600px;
      text-align: center;
    }
    .icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 2rem;
      background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 20px 60px rgba(255, 107, 53, 0.3);
    }
    .icon svg {
      width: 40px;
      height: 40px;
      color: white;
    }
    h1 {
      font-size: 2rem;
      margin-bottom: 1rem;
      background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    p {
      color: #aaa;
      margin-bottom: 2rem;
      line-height: 1.6;
    }
    .guia {
      display: inline-block;
      background: rgba(255, 107, 53, 0.1);
      border: 1px solid rgba(255, 107, 53, 0.3);
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      font-weight: bold;
      color: #ff6b35;
      margin: 1rem 0;
    }
    .btn {
      display: inline-block;
      padding: 1rem 2rem;
      background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
      color: white;
      text-decoration: none;
      border-radius: 12px;
      font-weight: 600;
      transition: all 0.3s ease;
      box-shadow: 0 10px 30px rgba(255, 107, 53, 0.3);
      cursor: pointer;
      border: none;
      font-size: 1rem;
    }
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 40px rgba(255, 107, 53, 0.4);
    }
    .loading {
      margin-top: 2rem;
    }
    .loading-dots {
      display: flex;
      gap: 0.5rem;
      justify-content: center;
      align-items: center;
    }
    .dot {
      width: 8px;
      height: 8px;
      background: #ff6b35;
      border-radius: 50%;
      animation: bounce 1.4s infinite ease-in-out both;
    }
    .dot:nth-child(1) { animation-delay: -0.32s; }
    .dot:nth-child(2) { animation-delay: -0.16s; }
    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </div>
    
    <h1>Portal de MiPaquete</h1>
    <p>Redirigiendo al portal para gestionar tu envío</p>
    
    <div class="guia">Guía: ${guia}</div>
    
    <div class="loading">
      <div class="loading-dots">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>
    </div>
    
    <p style="margin-top: 2rem; font-size: 0.9rem;">
      Si no se abre automáticamente, haz clic en el botón:
    </p>
    
    <button class="btn" onclick="abrirPortal()">
      Abrir Portal de MiPaquete
    </button>
  </div>

  <script>
    const url = '${mipaqueteUrl}';
    
    function abrirPortal() {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    
    // Auto-abrir después de 1 segundo
    setTimeout(() => {
      abrirPortal();
    }, 1000);
  </script>
</body>
</html>
    `

    // Retornar HTML con headers apropiados
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })

  } catch (error: any) {
    console.error('❌ Error en proxy MiPaquete:', error)

    // HTML de error elegante
    const errorHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error - Portal MiPaquete</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      color: white;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      text-align: center;
    }
    .error {
      max-width: 500px;
    }
    h1 {
      color: #ff6b35;
      margin-bottom: 1rem;
    }
  </style>
</head>
<body>
  <div class="error">
    <h1>⚠️ Error de Conexión</h1>
    <p>No se pudo conectar con MiPaquete. Por favor, intenta acceder directamente:</p>
    <a href="https://centrodenovedades.mipaquete.com/novedades" 
       style="color: #ff6b35; text-decoration: underline;"
       target="_blank">
      Abrir MiPaquete
    </a>
  </div>
</body>
</html>
    `

    return new NextResponse(errorHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      }
    })
  }
}

