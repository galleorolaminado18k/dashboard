import { WhatsAppConnector } from '@/components/whatsapp-connector';

export default function WhatsAppTestPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Prueba de Conexión WhatsApp</h1>
        <p className="text-muted-foreground">
          Conecta tu cuenta de WhatsApp usando WAHA
        </p>
      </div>

      <WhatsAppConnector />
    </div>
  );
}

