import { z } from 'zod'

export const INBODY_OCR_PROMPT = `You are analyzing an InBody 170 body composition report. Extract all visible values from this report and return them as JSON.

Extract these fields (use null if a value is not visible or not present):

{
  "weight": number or null (kg),
  "body_fat_pct": number or null (% body fat),
  "muscle_mass": number or null (skeletal muscle mass in kg),
  "bmi": number or null,
  "visceral_fat": number or null (visceral fat level),
  "body_water_pct": number or null (total body water as percentage),
  "fat_kg": number or null (body fat mass in kg),
  "ffm_kg": number or null (fat-free mass in kg),
  "tbw_liters": number or null (total body water in liters),
  "whr": number or null (waist-hip ratio),
  "bmr_kcal": number or null (basal metabolic rate in kcal),
  "fitness_score": number or null (InBody score),
  "gender": "male" or "female" or null,
  "age": number or null,
  "height_cm": number or null,
  "muscle_adjustment_kg": number or null (recommended muscle mass change in kg, from Muscle-Fat Control),
  "fat_adjustment_kg": number or null (recommended fat mass change in kg, from Muscle-Fat Control),
  "segmental_lean": {
    "right_arm": { "mass_kg": number or null, "evaluation": "below" or "normal" or "above" or null },
    "left_arm": { "mass_kg": number or null, "evaluation": "below" or "normal" or "above" or null },
    "trunk": { "mass_kg": number or null, "evaluation": "below" or "normal" or "above" or null },
    "right_leg": { "mass_kg": number or null, "evaluation": "below" or "normal" or "above" or null },
    "left_leg": { "mass_kg": number or null, "evaluation": "below" or "normal" or "above" or null }
  },
  "segmental_fat": {
    "right_arm": { "mass_kg": number or null, "evaluation": "below" or "normal" or "above" or null },
    "left_arm": { "mass_kg": number or null, "evaluation": "below" or "normal" or "above" or null },
    "trunk": { "mass_kg": number or null, "evaluation": "below" or "normal" or "above" or null },
    "right_leg": { "mass_kg": number or null, "evaluation": "below" or "normal" or "above" or null },
    "left_leg": { "mass_kg": number or null, "evaluation": "below" or "normal" or "above" or null }
  }
}

For segmental evaluation, map the bar chart indicators:
- Below the normal range = "below"
- Within the normal range = "normal"
- Above the normal range = "above"

Return ONLY the JSON object, no additional text.`

const segmentalEntrySchema = z.object({
  mass_kg: z.number().nullable().optional().default(null),
  evaluation: z.enum(['below', 'normal', 'above']).nullable().optional().default(null),
})

const defaultEntry = { mass_kg: null, evaluation: null } as const

const segmentalSchema = z.object({
  right_arm: segmentalEntrySchema.optional().default(defaultEntry),
  left_arm: segmentalEntrySchema.optional().default(defaultEntry),
  trunk: segmentalEntrySchema.optional().default(defaultEntry),
  right_leg: segmentalEntrySchema.optional().default(defaultEntry),
  left_leg: segmentalEntrySchema.optional().default(defaultEntry),
})

export const inBodyOcrResponseSchema = z.object({
  weight: z.number().nullable().optional().default(null),
  body_fat_pct: z.number().nullable().optional().default(null),
  muscle_mass: z.number().nullable().optional().default(null),
  bmi: z.number().nullable().optional().default(null),
  visceral_fat: z.number().nullable().optional().default(null),
  body_water_pct: z.number().nullable().optional().default(null),
  fat_kg: z.number().nullable().optional().default(null),
  ffm_kg: z.number().nullable().optional().default(null),
  tbw_liters: z.number().nullable().optional().default(null),
  whr: z.number().nullable().optional().default(null),
  bmr_kcal: z.number().nullable().optional().default(null),
  fitness_score: z.number().nullable().optional().default(null),
  gender: z.enum(['male', 'female']).nullable().optional().default(null),
  age: z.number().nullable().optional().default(null),
  height_cm: z.number().nullable().optional().default(null),
  muscle_adjustment_kg: z.number().nullable().optional().default(null),
  fat_adjustment_kg: z.number().nullable().optional().default(null),
  segmental_lean: segmentalSchema.nullable().optional().default(null),
  segmental_fat: segmentalSchema.nullable().optional().default(null),
})

export type InBodyOcrResponse = z.infer<typeof inBodyOcrResponseSchema>
