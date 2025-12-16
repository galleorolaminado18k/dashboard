/**
 * WAHA Disconnect Route
 * Endpoint para cerrar la sesión de WhatsApp
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BASE = process.env.WAHA_BASE_URL?.replace(/\/+$/, '') || 'https://wpp.galle18k.com';
const KEY = process.env.WAHA_API_KEY!;
const SESS = 'default';

const H = {
  'X-Api-Key': KEY,
  'Content-Type': 'application/json',
};

export async function POST() {
  try {
    // Primero cerrar sesión de WhatsApp
    const logoutRes = await fetch(`${BASE}/api/sessions/${SESS}/logout`, {
      method: 'POST',
      headers: H,
    });

    if (!logoutRes.ok) {
      const detail = await logoutRes.text();
      console.error('[WAHA] Logout failed:', logoutRes.status, detail);

      // Intentar detener la sesión si logout falla
      const stopRes = await fetch(`${BASE}/api/sessions/${SESS}/stop`, {
        method: 'POST',
        headers: H,
      });

      if (!stopRes.ok) {
        return new Response(
          JSON.stringify({
            ok: false,
            error: `No se pudo desconectar: ${detail}`,
          }),
          { status: logoutRes.status, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('[WAHA] Sesión cerrada correctamente');

    return new Response(
      JSON.stringify({
        ok: true,
        message: 'Sesión de WhatsApp cerrada correctamente',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[WAHA] Disconnect error:', error);
    return new Response(
      JSON.stringify({
        ok: false,
        error: 'Error al desconectar',
        detail: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

