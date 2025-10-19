import axios from "axios"

export const MIPAQUETE = axios.create({
  baseURL: "https://api-v2.mpr.mipaquete.com",
  headers: {
    "Content-Type": "application/json",
    "session-tracker": "a0c96ea6-b22d-4fb7-a278-850678d5429c",
    apikey:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NzExOWRjNDMzNjk2M2YzMzBlYjFjZTYiLCJuYW1lIjoiQ29tZXJjaWFsaXphZG9yYSIsInN1cm5hbWUiOiJnYWxlMThrIiwiZW1haWwiOiJnYWxsZW9yb2xhbWluYWRvMThrQGdtYWlsLmNvbSIsImNlbGxQaG9uZSI6IjMwMTY4NDUwMjYiLCJjcmVhdGVkQXQiOiIyMDI0LTEwLTE3VDIzOjI5OjA4LjAxNFoiLCJkYXRlIjoiMjAyNS0wOC0xOSAxMDoyMDoyNCIsImlhdCI6MTc1NTYxNjgyNH0.LHBLIsBCQlNM6WlnB514dN00dR7LcPjIQcYt1B62hEA",
  },
})

export async function getTrackingByGuide(guide: string) {
  try {
    const r = await MIPAQUETE.post("/getSendingTracking", { mpCode: guide })
    return r.data
  } catch (error) {
    console.error("[v0] Error fetching tracking:", error)
    throw error
  }
}
