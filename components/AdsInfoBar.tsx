export default function AdsInfoBar() {
  return (
    <div className="mb-3 flex items-center gap-2 text-sm">
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border text-[11px]">i</span>
      <span className="text-neutral-600">
        <strong>Administrador de anuncios</strong> — KPIs superiores se reinician al inicio de cada mes. Ingresos por
        campaña excluyen <u>siempre</u> el valor del envío. CVR = Ventas / Conversaciones. $/Conv = Gastado /
        Conversaciones. ROAS = Ingresos / Gastado.
      </span>
      <span className="ml-auto text-xs text-neutral-400">Auto-refresh cada 5 min</span>
    </div>
  )
}
