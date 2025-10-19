import { put } from "@vercel/blob"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const saleId = formData.get("saleId") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!saleId) {
      return NextResponse.json({ error: "No sale ID provided" }, { status: 400 })
    }

    const blob = await put(file.name, file, {
      access: "public",
    })

    const supabase = await createClient()
    const { error: updateError } = await supabase
      .from("sales")
      .update({
        photo_evidence: blob.url,
        photo_uploaded_at: new Date().toISOString(),
      })
      .eq("id", saleId)

    if (updateError) {
      console.error("[v0] Error updating sale with photo:", updateError)
      return NextResponse.json({ error: "Failed to update sale" }, { status: 500 })
    }

    return NextResponse.json({ url: blob.url, uploadedAt: new Date().toISOString() })
  } catch (error) {
    console.error("[v0] Error uploading file:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
