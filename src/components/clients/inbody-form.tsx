'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, X, Scan, ChevronDown, ChevronUp } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { createInBodyRecord, getInBodyPhotoUrls } from '@/lib/actions/inbody'
import { toPragueDate } from '@/lib/datetime'
import { format } from 'date-fns'
import type { InBodyRecord, InBodyExtendedData, BodySegment, SegmentalEvaluation } from '@/types'
import type { InBodyOcrResponse } from '@/lib/inbody-ocr'

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

const SEGMENTS: { key: BodySegment; label: string }[] = [
  { key: 'right_arm', label: 'Pravá paže' },
  { key: 'left_arm', label: 'Levá paže' },
  { key: 'trunk', label: 'Trup' },
  { key: 'right_leg', label: 'Pravá noha' },
  { key: 'left_leg', label: 'Levá noha' },
]

const EVAL_OPTIONS: { value: SegmentalEvaluation | ''; label: string }[] = [
  { value: '', label: '—' },
  { value: 'below', label: 'Pod normou' },
  { value: 'normal', label: 'Normální' },
  { value: 'above', label: 'Nad normou' },
]

interface InBodyFormProps {
  clientId: string
  record?: InBodyRecord
  onSubmit?: (formData: FormData) => Promise<void>
}

type FormValues = {
  measured_at: string
  weight: string
  body_fat_pct: string
  muscle_mass: string
  bmi: string
  visceral_fat: string
  body_water_pct: string
  notes: string
  // Extended
  ext_fat_kg: string
  ext_ffm_kg: string
  ext_tbw_liters: string
  ext_whr: string
  ext_bmr_kcal: string
  ext_fitness_score: string
  ext_gender: string
  ext_age: string
  ext_height_cm: string
  ext_muscle_adjustment_kg: string
  ext_fat_adjustment_kg: string
  // Segmental lean
  seg_lean_right_arm_mass: string
  seg_lean_right_arm_eval: string
  seg_lean_left_arm_mass: string
  seg_lean_left_arm_eval: string
  seg_lean_trunk_mass: string
  seg_lean_trunk_eval: string
  seg_lean_right_leg_mass: string
  seg_lean_right_leg_eval: string
  seg_lean_left_leg_mass: string
  seg_lean_left_leg_eval: string
  // Segmental fat
  seg_fat_right_arm_mass: string
  seg_fat_right_arm_eval: string
  seg_fat_left_arm_mass: string
  seg_fat_left_arm_eval: string
  seg_fat_trunk_mass: string
  seg_fat_trunk_eval: string
  seg_fat_right_leg_mass: string
  seg_fat_right_leg_eval: string
  seg_fat_left_leg_mass: string
  seg_fat_left_leg_eval: string
}

function getInitialValues(record?: InBodyRecord): FormValues {
  const customData = record?.custom_data as InBodyExtendedData | null
  const segLean = customData?.segmental_lean
  const segFat = customData?.segmental_fat

  return {
    measured_at: record?.measured_at ?? format(toPragueDate(new Date()), 'yyyy-MM-dd'),
    weight: record?.weight?.toString() ?? '',
    body_fat_pct: record?.body_fat_pct?.toString() ?? '',
    muscle_mass: record?.muscle_mass?.toString() ?? '',
    bmi: record?.bmi?.toString() ?? '',
    visceral_fat: record?.visceral_fat?.toString() ?? '',
    body_water_pct: record?.body_water_pct?.toString() ?? '',
    notes: record?.notes ?? '',
    // Extended
    ext_fat_kg: customData?.fat_kg?.toString() ?? '',
    ext_ffm_kg: customData?.ffm_kg?.toString() ?? '',
    ext_tbw_liters: customData?.tbw_liters?.toString() ?? '',
    ext_whr: customData?.whr?.toString() ?? '',
    ext_bmr_kcal: customData?.bmr_kcal?.toString() ?? '',
    ext_fitness_score: customData?.fitness_score?.toString() ?? '',
    ext_gender: customData?.gender ?? '',
    ext_age: customData?.age?.toString() ?? '',
    ext_height_cm: customData?.height_cm?.toString() ?? '',
    ext_muscle_adjustment_kg: customData?.muscle_fat_control?.muscle_adjustment_kg?.toString() ?? '',
    ext_fat_adjustment_kg: customData?.muscle_fat_control?.fat_adjustment_kg?.toString() ?? '',
    // Segmental lean
    seg_lean_right_arm_mass: segLean?.right_arm?.mass_kg?.toString() ?? '',
    seg_lean_right_arm_eval: segLean?.right_arm?.evaluation ?? '',
    seg_lean_left_arm_mass: segLean?.left_arm?.mass_kg?.toString() ?? '',
    seg_lean_left_arm_eval: segLean?.left_arm?.evaluation ?? '',
    seg_lean_trunk_mass: segLean?.trunk?.mass_kg?.toString() ?? '',
    seg_lean_trunk_eval: segLean?.trunk?.evaluation ?? '',
    seg_lean_right_leg_mass: segLean?.right_leg?.mass_kg?.toString() ?? '',
    seg_lean_right_leg_eval: segLean?.right_leg?.evaluation ?? '',
    seg_lean_left_leg_mass: segLean?.left_leg?.mass_kg?.toString() ?? '',
    seg_lean_left_leg_eval: segLean?.left_leg?.evaluation ?? '',
    // Segmental fat
    seg_fat_right_arm_mass: segFat?.right_arm?.mass_kg?.toString() ?? '',
    seg_fat_right_arm_eval: segFat?.right_arm?.evaluation ?? '',
    seg_fat_left_arm_mass: segFat?.left_arm?.mass_kg?.toString() ?? '',
    seg_fat_left_arm_eval: segFat?.left_arm?.evaluation ?? '',
    seg_fat_trunk_mass: segFat?.trunk?.mass_kg?.toString() ?? '',
    seg_fat_trunk_eval: segFat?.trunk?.evaluation ?? '',
    seg_fat_right_leg_mass: segFat?.right_leg?.mass_kg?.toString() ?? '',
    seg_fat_right_leg_eval: segFat?.right_leg?.evaluation ?? '',
    seg_fat_left_leg_mass: segFat?.left_leg?.mass_kg?.toString() ?? '',
    seg_fat_left_leg_eval: segFat?.left_leg?.evaluation ?? '',
  }
}

function hasExtendedData(values: FormValues): boolean {
  return !!(
    values.ext_fat_kg || values.ext_ffm_kg || values.ext_tbw_liters ||
    values.ext_whr || values.ext_bmr_kcal || values.ext_fitness_score
  )
}

function hasSegmentalData(values: FormValues): boolean {
  return SEGMENTS.some((s) =>
    values[`seg_lean_${s.key}_mass` as keyof FormValues] ||
    values[`seg_lean_${s.key}_eval` as keyof FormValues] ||
    values[`seg_fat_${s.key}_mass` as keyof FormValues] ||
    values[`seg_fat_${s.key}_eval` as keyof FormValues]
  )
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
  const ocrInputRef = useRef<HTMLInputElement>(null)
  const submittingRef = useRef(false)

  const [formValues, setFormValues] = useState<FormValues>(() => getInitialValues(record))
  const [ocrLoading, setOcrLoading] = useState(false)
  const [ocrBanner, setOcrBanner] = useState(false)
  const [ocrFields, setOcrFields] = useState<Set<string>>(new Set())
  const [addOcrPhoto, setAddOcrPhoto] = useState(true)
  const [showExtended, setShowExtended] = useState(() => hasExtendedData(getInitialValues(record)))
  const [showSegmental, setShowSegmental] = useState(() => hasSegmentalData(getInitialValues(record)))

  useEffect(() => {
    if (existingPhotoPaths.length > 0) {
      getInBodyPhotoUrls(existingPhotoPaths).then(setExistingPhotoUrls)
    }
  }, [existingPhotoPaths])

  function updateField(field: keyof FormValues, value: string) {
    setFormValues((prev) => ({ ...prev, [field]: value }))
  }

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

  async function handleOcrSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (ocrInputRef.current) ocrInputRef.current.value = ''

    setOcrLoading(true)
    setError(null)

    try {
      // Higher quality compression for OCR
      const compressed = await compressImage(file, 2048, 0.9)

      const fd = new FormData()
      fd.append('photo', compressed)

      const res = await fetch('/api/inbody/ocr', {
        method: 'POST',
        body: fd,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Chyba při OCR rozpoznávání')
      }

      const ocr: InBodyOcrResponse = await res.json()
      applyOcrData(ocr)

      // Optionally add the scanned photo to the record
      if (addOcrPhoto) {
        const photoCompressed = await compressImage(file)
        setFiles((prev) => [...prev, photoCompressed])
        const reader = new FileReader()
        reader.onload = (ev) => {
          setPreviews((prev) => [...prev, ev.target?.result as string])
        }
        reader.readAsDataURL(photoCompressed)
      }

      setOcrBanner(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při OCR rozpoznávání')
    } finally {
      setOcrLoading(false)
    }
  }

  function applyOcrData(ocr: InBodyOcrResponse) {
    const filledFields = new Set<string>()
    const updates: Partial<FormValues> = {}

    function set(field: keyof FormValues, val: number | string | null | undefined) {
      if (val != null && val !== '') {
        updates[field] = String(val)
        filledFields.add(field)
      }
    }

    // Core fields
    set('weight', ocr.weight)
    set('body_fat_pct', ocr.body_fat_pct)
    set('muscle_mass', ocr.muscle_mass)
    set('bmi', ocr.bmi)
    set('visceral_fat', ocr.visceral_fat)
    set('body_water_pct', ocr.body_water_pct)

    // Extended fields
    set('ext_fat_kg', ocr.fat_kg)
    set('ext_ffm_kg', ocr.ffm_kg)
    set('ext_tbw_liters', ocr.tbw_liters)
    set('ext_whr', ocr.whr)
    set('ext_bmr_kcal', ocr.bmr_kcal)
    set('ext_fitness_score', ocr.fitness_score)
    set('ext_gender', ocr.gender)
    set('ext_age', ocr.age)
    set('ext_height_cm', ocr.height_cm)
    set('ext_muscle_adjustment_kg', ocr.muscle_adjustment_kg)
    set('ext_fat_adjustment_kg', ocr.fat_adjustment_kg)

    // Segmental lean
    if (ocr.segmental_lean) {
      for (const seg of SEGMENTS) {
        const entry = ocr.segmental_lean[seg.key]
        if (entry) {
          set(`seg_lean_${seg.key}_mass` as keyof FormValues, entry.mass_kg)
          set(`seg_lean_${seg.key}_eval` as keyof FormValues, entry.evaluation)
        }
      }
    }

    // Segmental fat
    if (ocr.segmental_fat) {
      for (const seg of SEGMENTS) {
        const entry = ocr.segmental_fat[seg.key]
        if (entry) {
          set(`seg_fat_${seg.key}_mass` as keyof FormValues, entry.mass_kg)
          set(`seg_fat_${seg.key}_eval` as keyof FormValues, entry.evaluation)
        }
      }
    }

    setFormValues((prev) => ({ ...prev, ...updates }))
    setOcrFields(filledFields)

    // Auto-expand sections if OCR filled them
    const newValues = { ...formValues, ...updates }
    if (hasExtendedData(newValues as FormValues)) setShowExtended(true)
    if (hasSegmentalData(newValues as FormValues)) setShowSegmental(true)
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

  function fieldClass(field: string) {
    return ocrFields.has(field) ? 'border-l-2 border-l-success pl-3' : ''
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 px-4">
      {error && (
        <div className="rounded-xl border border-danger/50 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {ocrBanner && (
        <div className="rounded-xl border border-success/50 bg-success/10 px-4 py-3 text-sm text-success">
          Data automaticky rozpoznána. Zkontrolujte prosím správnost.
        </div>
      )}

      {/* OCR Button */}
      {!isEdit && (
        <div className="space-y-2">
          <input
            ref={ocrInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleOcrSelect}
          />
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            loading={ocrLoading}
            onClick={() => ocrInputRef.current?.click()}
            disabled={ocrLoading}
          >
            <Scan className="mr-2 h-4 w-4" strokeWidth={1.5} />
            {ocrLoading ? 'Analyzuji InBody report...' : 'Naskenovat z fotky'}
          </Button>
          {ocrBanner && (
            <label className="flex items-center gap-2 text-xs text-text-secondary">
              <input
                type="checkbox"
                checked={addOcrPhoto}
                onChange={(e) => setAddOcrPhoto(e.target.checked)}
                className="rounded border-border"
              />
              Přidat naskenovanou fotku k záznamu
            </label>
          )}
        </div>
      )}

      {/* Loading overlay */}
      {ocrLoading && (
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-text-tertiary border-t-accent" />
          <p className="text-sm text-text-secondary">Analyzuji InBody report...</p>
        </div>
      )}

      <Input
        id="measured_at"
        name="measured_at"
        label="Datum měření *"
        type="date"
        required
        value={formValues.measured_at}
        onChange={(e) => updateField('measured_at', e.target.value)}
      />

      <div className={fieldClass('weight')}>
        <Input
          id="weight"
          name="weight"
          label="Váha (kg)"
          type="number"
          step="any"
          min={0}
          placeholder="75.5"
          value={formValues.weight}
          onChange={(e) => updateField('weight', e.target.value)}
        />
      </div>

      <div className={fieldClass('body_fat_pct')}>
        <Input
          id="body_fat_pct"
          name="body_fat_pct"
          label="Tělesný tuk (%)"
          type="number"
          step="any"
          min={0}
          max={100}
          placeholder="15.2"
          value={formValues.body_fat_pct}
          onChange={(e) => updateField('body_fat_pct', e.target.value)}
        />
      </div>

      <div className={fieldClass('muscle_mass')}>
        <Input
          id="muscle_mass"
          name="muscle_mass"
          label="Svalová hmota (kg)"
          type="number"
          step="any"
          min={0}
          placeholder="35.0"
          value={formValues.muscle_mass}
          onChange={(e) => updateField('muscle_mass', e.target.value)}
        />
      </div>

      <div className={fieldClass('bmi')}>
        <Input
          id="bmi"
          name="bmi"
          label="BMI"
          type="number"
          step="any"
          min={0}
          placeholder="24.5"
          value={formValues.bmi}
          onChange={(e) => updateField('bmi', e.target.value)}
        />
      </div>

      <div className={fieldClass('visceral_fat')}>
        <Input
          id="visceral_fat"
          name="visceral_fat"
          label="Viscerální tuk"
          type="number"
          step="any"
          min={0}
          placeholder="8"
          value={formValues.visceral_fat}
          onChange={(e) => updateField('visceral_fat', e.target.value)}
        />
      </div>

      <div className={fieldClass('body_water_pct')}>
        <Input
          id="body_water_pct"
          name="body_water_pct"
          label="Voda v těle (%)"
          type="number"
          step="any"
          min={0}
          max={100}
          placeholder="55.0"
          value={formValues.body_water_pct}
          onChange={(e) => updateField('body_water_pct', e.target.value)}
        />
      </div>

      {/* Detailní metriky - collapsible */}
      <div className="rounded-xl border border-border">
        <button
          type="button"
          onClick={() => setShowExtended(!showExtended)}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-text-secondary"
        >
          Detailní metriky
          {showExtended ? (
            <ChevronUp className="h-4 w-4" strokeWidth={1.5} />
          ) : (
            <ChevronDown className="h-4 w-4" strokeWidth={1.5} />
          )}
        </button>
        {showExtended && (
          <div className="space-y-4 px-4 pb-4">
            <div className={fieldClass('ext_fat_kg')}>
              <Input
                id="ext_fat_kg"
                name="ext_fat_kg"
                label="Tuková hmota (kg)"
                type="number"
                step="any"
                min={0}
                placeholder="12.5"
                value={formValues.ext_fat_kg}
                onChange={(e) => updateField('ext_fat_kg', e.target.value)}
              />
            </div>
            <div className={fieldClass('ext_ffm_kg')}>
              <Input
                id="ext_ffm_kg"
                name="ext_ffm_kg"
                label="Beztuková hmota (kg)"
                type="number"
                step="any"
                min={0}
                placeholder="63.0"
                value={formValues.ext_ffm_kg}
                onChange={(e) => updateField('ext_ffm_kg', e.target.value)}
              />
            </div>
            <div className={fieldClass('ext_tbw_liters')}>
              <Input
                id="ext_tbw_liters"
                name="ext_tbw_liters"
                label="Celková voda (l)"
                type="number"
                step="any"
                min={0}
                placeholder="42.0"
                value={formValues.ext_tbw_liters}
                onChange={(e) => updateField('ext_tbw_liters', e.target.value)}
              />
            </div>
            <div className={fieldClass('ext_whr')}>
              <Input
                id="ext_whr"
                name="ext_whr"
                label="WHR"
                type="number"
                step="any"
                min={0}
                placeholder="0.85"
                value={formValues.ext_whr}
                onChange={(e) => updateField('ext_whr', e.target.value)}
              />
            </div>
            <div className={fieldClass('ext_bmr_kcal')}>
              <Input
                id="ext_bmr_kcal"
                name="ext_bmr_kcal"
                label="BMR (kcal)"
                type="number"
                step="1"
                min={0}
                placeholder="1650"
                value={formValues.ext_bmr_kcal}
                onChange={(e) => updateField('ext_bmr_kcal', e.target.value)}
              />
            </div>
            <div className={fieldClass('ext_fitness_score')}>
              <Input
                id="ext_fitness_score"
                name="ext_fitness_score"
                label="InBody skóre"
                type="number"
                step="1"
                min={0}
                placeholder="75"
                value={formValues.ext_fitness_score}
                onChange={(e) => updateField('ext_fitness_score', e.target.value)}
              />
            </div>
            <div className={fieldClass('ext_gender')}>
              <div className="w-full">
                <label htmlFor="ext_gender" className="mb-1 block text-sm text-text-secondary">Pohlaví</label>
                <select
                  id="ext_gender"
                  name="ext_gender"
                  value={formValues.ext_gender}
                  onChange={(e) => updateField('ext_gender', e.target.value)}
                  className="w-full rounded-xl border border-border bg-elevated px-4 py-3 text-text-primary outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
                >
                  <option value="">—</option>
                  <option value="male">Muž</option>
                  <option value="female">Žena</option>
                </select>
              </div>
            </div>
            <div className={fieldClass('ext_age')}>
              <Input
                id="ext_age"
                name="ext_age"
                label="Věk"
                type="number"
                step="1"
                min={0}
                placeholder="30"
                value={formValues.ext_age}
                onChange={(e) => updateField('ext_age', e.target.value)}
              />
            </div>
            <div className={fieldClass('ext_height_cm')}>
              <Input
                id="ext_height_cm"
                name="ext_height_cm"
                label="Výška (cm)"
                type="number"
                step="any"
                min={0}
                placeholder="175"
                value={formValues.ext_height_cm}
                onChange={(e) => updateField('ext_height_cm', e.target.value)}
              />
            </div>
            <div className={fieldClass('ext_muscle_adjustment_kg')}>
              <Input
                id="ext_muscle_adjustment_kg"
                name="ext_muscle_adjustment_kg"
                label="Doporučená změna svalů (kg)"
                type="number"
                step="any"
                placeholder="+2.5"
                value={formValues.ext_muscle_adjustment_kg}
                onChange={(e) => updateField('ext_muscle_adjustment_kg', e.target.value)}
              />
            </div>
            <div className={fieldClass('ext_fat_adjustment_kg')}>
              <Input
                id="ext_fat_adjustment_kg"
                name="ext_fat_adjustment_kg"
                label="Doporučená změna tuku (kg)"
                type="number"
                step="any"
                placeholder="-3.0"
                value={formValues.ext_fat_adjustment_kg}
                onChange={(e) => updateField('ext_fat_adjustment_kg', e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Segmentální analýza - collapsible */}
      <div className="rounded-xl border border-border">
        <button
          type="button"
          onClick={() => setShowSegmental(!showSegmental)}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-text-secondary"
        >
          Segmentální analýza
          {showSegmental ? (
            <ChevronUp className="h-4 w-4" strokeWidth={1.5} />
          ) : (
            <ChevronDown className="h-4 w-4" strokeWidth={1.5} />
          )}
        </button>
        {showSegmental && (
          <div className="space-y-6 px-4 pb-4">
            {/* Segmental Lean Mass */}
            <div>
              <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-text-tertiary">
                Svalová hmota segmentů
              </h4>
              <div className="space-y-3">
                {SEGMENTS.map((seg) => {
                  const massField = `seg_lean_${seg.key}_mass` as keyof FormValues
                  const evalField = `seg_lean_${seg.key}_eval` as keyof FormValues
                  return (
                    <div key={`lean-${seg.key}`} className={`flex items-end gap-2 ${fieldClass(massField)}`}>
                      <div className="w-24 shrink-0 pb-3 text-xs text-text-secondary">{seg.label}</div>
                      <Input
                        id={massField}
                        name={massField}
                        label="kg"
                        type="number"
                        step="any"
                        min={0}
                        value={formValues[massField]}
                        onChange={(e) => updateField(massField, e.target.value)}
                      />
                      <div className="w-full">
                        <label htmlFor={evalField} className="mb-1 block text-sm text-text-secondary">Hodnocení</label>
                        <select
                          id={evalField}
                          name={evalField}
                          value={formValues[evalField]}
                          onChange={(e) => updateField(evalField, e.target.value)}
                          className="w-full rounded-xl border border-border bg-elevated px-3 py-3 text-sm text-text-primary outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
                        >
                          {EVAL_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Segmental Fat Mass */}
            <div>
              <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-text-tertiary">
                Tuková hmota segmentů
              </h4>
              <div className="space-y-3">
                {SEGMENTS.map((seg) => {
                  const massField = `seg_fat_${seg.key}_mass` as keyof FormValues
                  const evalField = `seg_fat_${seg.key}_eval` as keyof FormValues
                  return (
                    <div key={`fat-${seg.key}`} className={`flex items-end gap-2 ${fieldClass(massField)}`}>
                      <div className="w-24 shrink-0 pb-3 text-xs text-text-secondary">{seg.label}</div>
                      <Input
                        id={massField}
                        name={massField}
                        label="kg"
                        type="number"
                        step="any"
                        min={0}
                        value={formValues[massField]}
                        onChange={(e) => updateField(massField, e.target.value)}
                      />
                      <div className="w-full">
                        <label htmlFor={evalField} className="mb-1 block text-sm text-text-secondary">Hodnocení</label>
                        <select
                          id={evalField}
                          name={evalField}
                          value={formValues[evalField]}
                          onChange={(e) => updateField(evalField, e.target.value)}
                          className="w-full rounded-xl border border-border bg-elevated px-3 py-3 text-sm text-text-primary outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
                        >
                          {EVAL_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <Textarea
        id="notes"
        name="notes"
        label="Poznámky"
        placeholder="Poznámky k měření..."
        value={formValues.notes}
        onChange={(e) => updateField('notes', e.target.value)}
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
