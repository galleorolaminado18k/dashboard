'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle, Smartphone, LogOut, RefreshCw } from 'lucide-react';

interface WahaStatus {
  status?: string;
  connected?: boolean;
  error?: string;
  me?: {
    id?: string;
    pushName?: string;
  };
}

const STORAGE_KEY = 'whatsapp_connection_state';

function formatPhone(raw?: string) {
  if (!raw) return '';
  // Extraer solo números del formato "573001234567@c.us"
  const numbers = raw.replace(/@.*$/, '').replace(/\D/g, '');
  if (numbers.length === 12 && numbers.startsWith('57')) {
    return `+57 ${numbers.slice(2, 5)} ${numbers.slice(5, 8)} ${numbers.slice(8)}`;
  }
  if (numbers.length === 10) {
    return `+57 ${numbers.slice(0, 3)} ${numbers.slice(3, 6)} ${numbers.slice(6)}`;
  }
  return numbers.startsWith('57') ? `+${numbers}` : numbers;
}

export function WhatsAppConnector() {
  const [loading, setLoading] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [qrcode, setQrcode] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [status, setStatus] = useState<WahaStatus | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [connectedPhone, setConnectedPhone] = useState<string>('');
  const [connectedName, setConnectedName] = useState<string>('');

  // Cargar estado guardado al montar
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.phone) setConnectedPhone(parsed.phone);
        if (parsed.name) setConnectedName(parsed.name);
      } catch (e) {
        console.error('Error parsing saved state:', e);
      }
    }
    checkStatus();
  }, []);

  // Guardar estado cuando cambia
  const saveState = useCallback((phone: string, name: string) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ phone, name, timestamp: Date.now() }));
    setConnectedPhone(phone);
    setConnectedName(name);
  }, []);

  const clearState = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setConnectedPhone('');
    setConnectedName('');
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

      // Si está conectado, guardar info y limpiar el QR
      if (data.connected || data.status === 'WORKING') {
        setQrcode('');
        setError('');

        // Guardar número y nombre si están disponibles
        if (data.me?.id || data.me?.pushName) {
          saveState(data.me?.id || '', data.me?.pushName || '');
        }
      } else if (data.status === 'STOPPED' || data.status === 'FAILED') {
        // Si está desconectado, limpiar estado guardado
        clearState();
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

  async function desconectar() {
    setDisconnecting(true);
    try {
      const res = await fetch('/api/waha/disconnect', {
        method: 'POST',
      });

      if (res.ok) {
        clearState();
        setStatus({ connected: false, status: 'STOPPED' });
        setQrcode('');
      } else {
        const data = await res.json();
        setError(data.error || 'Error al desconectar');
      }
    } catch (err) {
      setError('Error al desconectar: ' + (err instanceof Error ? err.message : 'Unknown'));
    } finally {
      setDisconnecting(false);
    }
  }

  const isConnected = status?.connected || status?.status === 'WORKING';
  const displayPhone = connectedPhone || status?.me?.id || '';
  const displayName = connectedName || status?.me?.pushName || '';

  // ========================
  // DISEÑO LUXURY CUANDO ESTÁ CONECTADO
  // ========================
  if (isConnected) {
    return (
      <div className="w-full max-w-lg mx-auto">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c1220] via-[#0f1a2e] to-[#081018] border border-emerald-500/20 shadow-2xl shadow-emerald-500/10">
          {/* Efecto de brillo superior */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />

          {/* Contenido principal */}
          <div className="p-8">
            {/* Header con estado */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <Smartphone className="w-6 h-6 text-white" />
                  </div>
                  {/* Indicador de conexión animado */}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-[#0c1220] animate-pulse" />
                </div>
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3" />
                    WhatsApp Conectado
                  </span>
                </div>
              </div>

              {/* Botón de refrescar */}
              <button
                onClick={checkStatus}
                disabled={checkingStatus}
                className="p-2 rounded-xl hover:bg-white/5 transition-colors text-gray-400 hover:text-white disabled:opacity-50"
                title="Actualizar estado"
              >
                <RefreshCw className={`w-4 h-4 ${checkingStatus ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Número conectado */}
            <div className="mb-8">
              <p className="text-sm text-gray-400 mb-1">Número conectado</p>
              <h2 className="text-3xl font-bold text-white tracking-tight">
                {formatPhone(displayPhone) || 'Sesión activa'}
              </h2>
              {displayName && (
                <p className="text-sm text-gray-300 mt-1">{displayName}</p>
              )}
            </div>

            {/* Estadísticas/Info */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-xs text-gray-400 mb-1">Estado</p>
                <p className="text-sm font-medium text-emerald-400">Activo</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-xs text-gray-400 mb-1">Sesión</p>
                <p className="text-sm font-medium text-white">default</p>
              </div>
            </div>

            {/* Botón de desconectar */}
            <button
              onClick={desconectar}
              disabled={disconnecting}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {disconnecting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Desconectando...
                </>
              ) : (
                <>
                  <LogOut className="w-5 h-5" />
                  Cerrar sesión de WhatsApp
                </>
              )}
            </button>
          </div>

          {/* Efecto de brillo inferior */}
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent" />
        </div>

        {/* Error si existe */}
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  // ========================
  // DISEÑO PARA NO CONECTADO
  // ========================
  return (
    <Card className="w-full max-w-2xl mx-auto border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Smartphone className="h-5 w-5 text-emerald-500" />
          Conexión WhatsApp
        </CardTitle>
        <CardDescription className="text-gray-400">
          Conecta tu WhatsApp escaneando el código QR
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estado de conexión */}
        {status && !isConnected && (
          <Alert variant="destructive" className="bg-red-500/10 border-red-500/30">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-400" />
              <AlertDescription>
                <span className="text-red-300">Estado: {status.status || 'Desconectado'}</span>
              </AlertDescription>
              {checkingStatus && (
                <Loader2 className="h-4 w-4 animate-spin ml-auto text-red-400" />
              )}
            </div>
          </Alert>
        )}

        {/* Error */}
        {error && (
          <Alert variant="destructive" className="bg-red-500/10 border-red-500/30">
            <AlertDescription>
              <span className="text-red-300">{error}</span>
            </AlertDescription>
          </Alert>
        )}

        {/* Código QR */}
        {qrcode && !isConnected && (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-4 p-6 border border-gray-700 rounded-2xl bg-white">
              <p className="text-sm font-medium text-center text-gray-800">
                Escanea este código QR con WhatsApp
              </p>
              <img
                src={qrcode}
                alt="Código QR de WhatsApp"
                className="w-64 h-64 border-4 border-emerald-200 rounded-xl"
              />
              <p className="text-xs text-gray-500 text-center max-w-sm">
                Abre WhatsApp → Configuración → Dispositivos vinculados → Vincular un dispositivo
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-emerald-400">
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
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Generando QR...' : 'Conectar WhatsApp'}
            </Button>
          )}

          <Button
            onClick={checkStatus}
            disabled={checkingStatus}
            variant="outline"
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            {checkingStatus && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verificar
          </Button>
        </div>

        {/* Información adicional */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• El código QR expira después de unos minutos</p>
          <p>• Genera uno nuevo si expira</p>
          <p>• La verificación de estado es automática cada 5 segundos</p>
        </div>
      </CardContent>
    </Card>
  );
}

