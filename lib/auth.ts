import { supabase, createServerClient } from './supabase'
import { Role, User } from '@/types'

const CEO_EMAIL = process.env.CEO_EMAIL || 'jiratcha.a@freshket.co'
const PE_DEPT = process.env.PEOPLE_EXPERIENCE_DEPT || 'People Experience'

export function getRole(email: string, department: string): Role {
  if (email === CEO_EMAIL) return 'ceo'
  if (department === PE_DEPT) return 'people_experience'
  return 'manager'
}

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser?.email) return null

  const { data: staff } = await supabase
    .from('staff')
    .select('*')
    .eq('email', authUser.email)
    .single()

  if (!staff) return null

  return {
    id: staff.id,
    email: staff.email,
    name_surname: staff.name_surname,
    nickname: staff.nickname,
    full_name: staff.full_name,
    department: staff.department,
    position: staff.position,
    job_grade: staff.job_grade,
    role: getRole(staff.email, staff.department),
  }
}

export async function getServerUser(accessToken: string): Promise<User | null> {
  const db = createServerClient()
  const { data: { user: authUser } } = await supabase.auth.getUser(accessToken)
  if (!authUser?.email) return null

  const { data: staff } = await db
    .from('staff')
    .select('*')
    .eq('email', authUser.email)
    .single()

  if (!staff) return null

  return {
    id: staff.id,
    email: staff.email,
    name_surname: staff.name_surname,
    nickname: staff.nickname,
    full_name: staff.full_name,
    department: staff.department,
    position: staff.position,
    job_grade: staff.job_grade,
    role: getRole(staff.email, staff.department),
  }
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/requests`,
    },
  })
  return { data, error }
}

export async function signOut() {
  return supabase.auth.signOut()
}
