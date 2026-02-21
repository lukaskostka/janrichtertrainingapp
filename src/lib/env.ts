import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL musí být platná URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY je povinný'),
})

const serverEnvSchema = envSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY je povinný'),
})

export function validateEnv() {
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    console.error('Chybějící nebo neplatné proměnné prostředí:', result.error.flatten().fieldErrors)
    throw new Error('Neplatná konfigurace prostředí')
  }
  return result.data
}

export function validateServerEnv() {
  const result = serverEnvSchema.safeParse(process.env)
  if (!result.success) {
    console.error('Chybějící nebo neplatné serverové proměnné prostředí:', result.error.flatten().fieldErrors)
    throw new Error('Neplatná serverová konfigurace prostředí')
  }
  return result.data
}

