'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle, Smartphone } from 'lucide-react';

interface WahaStatus {
  status?: string;
  connected?: boolean;
  error?: string;
}

export function WhatsAppConnector() {
  const [loading, setLoading] = useState(false);
  const [qrcode, setQrcode] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [status, setStatus] = useState<WahaStatus | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Verificar estado al montar el componente
  useEffect(() => {
    checkStatus();
  }, []);

  // Auto-refresh del estado cada 5 segundos cuando hay un QR activo
  useEffect(() => {
    if (qrcode && !status?.connected) {
      const interval = setInterval(() => {
        checkStatus();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [qrcode, status?.connected]);

  async function checkStatus() {
    setCheckingStatus(true);
    try {
      const res = await fetch('/api/waha/status', { cache: 'no-store' });
      const data = await res.json();
      setStatus(data);

      // Si está conectado, limpiar el QR
      if (data.connected || data.status === 'WORKING') {
        setQrcode('');
        setError('');
      }
    } catch (err) {
      console.error('Error checking status:', err);
    } finally {
      setCheckingStatus(false);
    }
  }

  async function conectar() {
    setLoading(true);
    setQrcode('');
    setError('');

    try {
      const res = await fetch('/api/waha/connect', {
        method: 'POST',
      });

      const data = await res.json();

      if (res.ok && data.qrcode) {
        setQrcode(data.qrcode);
        setError('');
        // Verificar estado después de obtener el QR
        setTimeout(() => checkStatus(), 1000);
      } else {
        setError(data.error || 'Error al solicitar código QR');
        setQrcode('');
      }
    } catch (err) {
      setError('Error de conexión: ' + (err instanceof Error ? err.message : 'Unknown'));
      setQrcode('');
    } finally {
      setLoading(false);
    }
  }

  const isConnected = status?.connected || status?.status === 'WORKING';

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Conexión WhatsApp
        </CardTitle>
        <CardDescription>
          Conecta tu WhatsApp escaneando el código QR
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estado de conexión */}
        {status && (
          <Alert variant={isConnected ? 'default' : 'destructive'}>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    WhatsApp conectado correctamente
                  </AlertDescription>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    Estado: {status.status || 'Desconectado'}
                  </AlertDescription>
                </>
              )}
              {checkingStatus && (
                <Loader2 className="h-4 w-4 animate-spin ml-auto" />
              )}
            </div>
          </Alert>
        )}

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Código QR */}
        {qrcode && !isConnected && (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-4 p-6 border rounded-lg bg-white">
              <p className="text-sm font-medium text-center">
                Escanea este código QR con WhatsApp
              </p>
              <img
                src={qrcode}
                alt="Código QR de WhatsApp"
                className="w-64 h-64 border-4 border-gray-200 rounded-lg"
              />
              <p className="text-xs text-muted-foreground text-center max-w-sm">
                Abre WhatsApp → Configuración → Dispositivos vinculados → Vincular un dispositivo
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Esperando escaneo del código QR...</span>
            </div>
          </div>
        )}

        {/* Botón de acción */}
        <div className="flex gap-2">
          {!isConnected && (
            <Button
              onClick={conectar}
              disabled={loading}
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Generando QR...' : 'Conectar WhatsApp'}
            </Button>
          )}

          <Button
            onClick={checkStatus}
            disabled={checkingStatus}
            variant="outline"
          >
            {checkingStatus && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verificar Estado
          </Button>
        </div>

        {/* Información adicional */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• El código QR expira después de unos minutos</p>
          <p>• Genera uno nuevo si expira</p>
          <p>• La verificación de estado es automática cada 5 segundos</p>
        </div>
      </CardContent>
    </Card>
  );
}

