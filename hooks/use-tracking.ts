import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useTracking(mpCode?: string) {
  const code = (mpCode || "").trim()
  const { data, error, isLoading } = useSWR(
    code ? `/api/mipaquete/tracking?mpCode=${encodeURIComponent(code)}` : null,
    fetcher,
    { refreshInterval: 60_000 }, // refresco cada 1 minuto
  )
  return { data, error, isLoading }
}
