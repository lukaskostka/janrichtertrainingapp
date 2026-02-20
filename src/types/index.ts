import { Database } from './database'

export type Client = Database['public']['Tables']['clients']['Row']
export type ClientInsert = Database['public']['Tables']['clients']['Insert']
export type Package = Database['public']['Tables']['packages']['Row']
export type PackageInsert = Database['public']['Tables']['packages']['Insert']
export type Session = Database['public']['Tables']['sessions']['Row']
export type SessionInsert = Database['public']['Tables']['sessions']['Insert']
export type Exercise = Database['public']['Tables']['exercises']['Row']
export type SessionExercise = Database['public']['Tables']['session_exercises']['Row']
export type WorkoutTemplate = Database['public']['Tables']['workout_templates']['Row']
export type InBodyRecord = Database['public']['Tables']['inbody_records']['Row']
export type Trainer = Database['public']['Tables']['trainers']['Row']

export type ClientStatus = Database['public']['Enums']['client_status']
export type PackageStatus = Database['public']['Enums']['package_status']
export type SessionStatus = Database['public']['Enums']['session_status']

// Sets type for session exercises
export type ExerciseSet = {
  reps: number
  weight: number
}

// Template exercise config
export type TemplateExercise = {
  exercise_id: string
  exercise_name?: string
  sets_config: ExerciseSet[]
  order_index: number
  superset_group: number | null
}

// Session with relations
export type SessionWithClient = Session & {
  clients: Pick<Client, 'id' | 'name'>
}

export type SessionWithDetails = Session & {
  clients: Pick<Client, 'id' | 'name'>
  packages: Pick<Package, 'id' | 'name' | 'total_sessions' | 'used_sessions'> | null
}

export type PackageWithClient = Package & {
  clients: Pick<Client, 'id' | 'name'>
}
