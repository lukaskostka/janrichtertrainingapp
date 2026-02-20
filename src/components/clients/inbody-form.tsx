'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { createInBodyRecord, getInBodyPhotoUrls } from '@/lib/actions/inbody'
import { toPragueDate } from '@/lib/datetime'
import { format } from 'date-fns'
import type { InBodyRecord } from '@/types'

async function compressImage(file: File, maxWidth = 1200, quality = 0.8): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let { width, height } = img
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
          } else {
            resolve(file)
          }
        },
        'image/jpeg',
        quality
      )
    }
    img.onerror = () => resolve(file)
    img.src = URL.createObjectURL(file)
  })
}

interface InBodyFormProps {
  clientId: string
  record?: InBodyRecord
  onSubmit?: (formData: FormData) => Promise<void>
}

export function InBodyForm({ clientId, record, onSubmit }: InBodyFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previews, setPreviews] = useState<string[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [existingPhotoPaths, setExistingPhotoPaths] = useState<string[]>(record?.photo_urls ?? [])
  const [existingPhotoUrls, setExistingPhotoUrls] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const submittingRef = useRef(false)

  useEffect(() => {
    if (existingPhotoPaths.length > 0) {
      getInBodyPhotoUrls(existingPhotoPaths).then(setExistingPhotoUrls)
    }
  }, [existingPhotoPaths])

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    if (selected.length === 0) return

    const compressed: File[] = []
    for (const file of selected) {
      const c = await compressImage(file)
      compressed.push(c)
    }

    const newFiles = [...files, ...compressed]
    setFiles(newFiles)

    for (const file of compressed) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setPreviews((prev) => [...prev, ev.target?.result as string])
      }
      reader.readAsDataURL(file)
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removeNewPhoto(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  function removeExistingPhoto(index: number) {
    setExistingPhotoPaths((prev) => prev.filter((_, i) => i !== index))
    setExistingPhotoUrls((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (submittingRef.current) return
    submittingRef.current = true
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData(e.currentTarget)
      // Remove the file input entries and add our tracked files
      formData.delete('photos')
      for (const file of files) {
        formData.append('photos', file)
      }
      // Add existing photo paths for edit mode
      formData.delete('existing_photos')
      for (const path of existingPhotoPaths) {
        formData.append('existing_photos', path)
      }
      if (onSubmit) {
        await onSubmit(formData)
      } else {
        await createInBodyRecord(clientId, formData)
      }
      router.push(`/clients/${clientId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nastala chyba')
    } finally {
      setLoading(false)
      submittingRef.current = false
    }
  }

  const isEdit = !!record

  return (
    <form onSubmit={handleSubmit} className="space-y-4 px-4">
      {error && (
        <div className="rounded-xl border border-danger/50 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <Input
        id="measured_at"
        name="measured_at"
        label="Datum měření *"
        type="date"
        required
        defaultValue={record?.measured_at ?? format(toPragueDate(new Date()), 'yyyy-MM-dd')}
      />

      <Input
        id="weight"
        name="weight"
        label="Váha (kg)"
        type="number"
        step="0.1"
        min={0}
        placeholder="75.5"
        defaultValue={record?.weight ?? undefined}
      />

      <Input
        id="body_fat_pct"
        name="body_fat_pct"
        label="Tělesný tuk (%)"
        type="number"
        step="0.1"
        min={0}
        max={100}
        placeholder="15.2"
        defaultValue={record?.body_fat_pct ?? undefined}
      />

      <Input
        id="muscle_mass"
        name="muscle_mass"
        label="Svalová hmota (kg)"
        type="number"
        step="0.1"
        min={0}
        placeholder="35.0"
        defaultValue={record?.muscle_mass ?? undefined}
      />

      <Input
        id="bmi"
        name="bmi"
        label="BMI"
        type="number"
        step="0.1"
        min={0}
        placeholder="24.5"
        defaultValue={record?.bmi ?? undefined}
      />

      <Input
        id="visceral_fat"
        name="visceral_fat"
        label="Viscerální tuk"
        type="number"
        step="0.1"
        min={0}
        placeholder="8"
        defaultValue={record?.visceral_fat ?? undefined}
      />

      <Input
        id="body_water_pct"
        name="body_water_pct"
        label="Voda v těle (%)"
        type="number"
        step="0.1"
        min={0}
        max={100}
        placeholder="55.0"
        defaultValue={record?.body_water_pct ?? undefined}
      />

      <Textarea
        id="notes"
        name="notes"
        label="Poznámky"
        placeholder="Poznámky k měření..."
        defaultValue={record?.notes ?? undefined}
      />

      <div className="w-full">
        <label className="mb-1 block text-sm text-text-secondary">Fotky</label>
        <input
          ref={fileInputRef}
          type="file"
          name="photos"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handlePhotoSelect}
        />

        {(existingPhotoUrls.length > 0 || previews.length > 0) && (
          <div className="mb-3 grid grid-cols-3 gap-2">
            {existingPhotoUrls.map((url, i) => (
              <div key={`existing-${i}`} className="group relative aspect-square overflow-hidden rounded-xl border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeExistingPhoto(i)}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-1.5 text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {previews.map((src, i) => (
              <div key={`new-${i}`} className="group relative aspect-square overflow-hidden rounded-xl border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeNewPhoto(i)}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-1.5 text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={() => fileInputRef.current?.click()}
        >
          <Camera className="mr-2 h-4 w-4" strokeWidth={1.5} />
          Přidat fotky
        </Button>
      </div>

      <Button type="submit" loading={loading} className="w-full">
        {isEdit ? 'Uložit změny' : 'Uložit měření'}
      </Button>
    </form>
  )
}
