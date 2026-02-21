import { NextResponse } from 'next/server'
import { createAuthenticatedClient } from '@/lib/supabase/server'
import { INBODY_OCR_PROMPT, inBodyOcrResponseSchema } from '@/lib/inbody-ocr'

export async function POST(request: Request) {
  try {
    // Auth check
    await createAuthenticatedClient()

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API klíč není nakonfigurován' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const photo = formData.get('photo') as File | null
    if (!photo || photo.size === 0) {
      return NextResponse.json(
        { error: 'Nebyla nahrána žádná fotka' },
        { status: 400 }
      )
    }

    // Convert to base64
    const arrayBuffer = await photo.arrayBuffer()
    const base64Image = Buffer.from(arrayBuffer).toString('base64')
    const mimeType = photo.type || 'image/jpeg'

    // Call Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inlineData: { mimeType, data: base64Image } },
              { text: INBODY_OCR_PROMPT },
            ],
          }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      }
    )

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text()
      console.error('Gemini API error:', errorText)
      return NextResponse.json(
        { error: 'Chyba při komunikaci s Gemini API' },
        { status: 502 }
      )
    }

    const geminiData = await geminiResponse.json()
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!rawText) {
      return NextResponse.json(
        { error: 'Gemini API nevrátilo žádná data' },
        { status: 502 }
      )
    }

    const parsed = JSON.parse(rawText)
    const validated = inBodyOcrResponseSchema.parse(parsed)

    return NextResponse.json(validated)
  } catch (err) {
    console.error('InBody OCR error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Nastala neočekávaná chyba' },
      { status: 500 }
    )
  }
}
