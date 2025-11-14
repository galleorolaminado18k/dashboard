/**
 * Endpoint de diagnóstico WAHA
 * Verifica que las variables de entorno estén configuradas
 * y que WAHA responda correctamente
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BASE = process.env.WAHA_BASE_URL?.replace(/\/+$/, '') || '';
const KEY = process.env.WAHA_API_KEY || '';

function mask(s: string) {
  if (!s) return '(empty)';
  if (s.length <= 10) return '***';
  return s.slice(0, 6) + '…' + s.slice(-4);
}

export async function GET() {
  const headers = new Headers({
    'Content-Type': 'application/json',
    'X-Api-Key': KEY,          // mayúsculas
    'x-api-key': KEY,          // minúsculas (por si algún proxy)
    'Authorization': `Api-Key ${KEY}`, // fallback (WAHA acepta en varias distros)
  });

  let wahaResponse = {
    status: 0,
    body: null as any,
    error: null as any,
  };

  try {
    const r = await fetch(`${BASE}/api/server/version`, {
      headers,
      cache: 'no-store',
    });

    wahaResponse.status = r.status;

    try {
      wahaResponse.body = await r.json();
    } catch (e) {
      wahaResponse.body = await r.text();
    }
  } catch (e) {
    wahaResponse.error = e instanceof Error ? e.message : String(e);
  }

  const diagnostic = {
    timestamp: new Date().toISOString(),
    env: {
      BASE,
      HAS_KEY: Boolean(KEY),
      KEY_SAMPLE: mask(KEY),
      KEY_LENGTH: KEY.length,
      RUNTIME: process.env.NEXT_RUNTIME || 'nodejs',
    },
    requestHeadersSent: Array.from(headers.entries()),
    waha: wahaResponse,
    interpretation: interpretResult(wahaResponse.status, Boolean(KEY)),
  };

  return new Response(JSON.stringify(diagnostic, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function interpretResult(status: number, hasKey: boolean) {
  const result: any = {
    status,
    hasKey,
    diagnosis: '',
    action: '',
  };

  if (!hasKey) {
    result.diagnosis = '❌ WAHA_API_KEY no está configurada en Vercel';
    result.action = 'Ir a Vercel → Environment Variables → Agregar WAHA_API_KEY → Redeploy';
    return result;
  }

  if (status === 200) {
    result.diagnosis = '✅ TODO CORRECTO - WAHA responde OK';
    result.action = 'Si aún hay 401 en otras rutas, revisar esas rutas específicas';
    return result;
  }

  if (status === 401) {
    result.diagnosis = '❌ ERROR 401 - La API Key no coincide';
    result.action = 'Verificar que WAHA_API_KEY en Vercel sea EXACTAMENTE igual a la del VPS (grep WAHA_API_KEY /opt/baileys/.env)';
    return result;
  }

  if (status === 0) {
    result.diagnosis = '❌ No se pudo conectar a WAHA';
    result.action = 'Verificar que WAHA_BASE_URL sea correcto y que WAHA esté corriendo (docker ps)';
    return result;
  }

  if (status === 404) {
    result.diagnosis = '❌ Endpoint no encontrado';
    result.action = 'Verificar que WAHA_BASE_URL sea correcto (sin barra al final)';
    return result;
  }

  result.diagnosis = `⚠️  Status inesperado: ${status}`;
  result.action = 'Revisar logs de WAHA (docker logs waha-api)';
  return result;
}

