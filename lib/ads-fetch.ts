export const fetcher = (u: string) => fetch(u).then((r) => r.json())
