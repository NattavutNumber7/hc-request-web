'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from '@/types'
import { supabase } from './supabase'
import { getRole } from './auth'

interface AuthContextType {
  user: User | null
  loading: boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.email) {
        setUser(null)
        setLoading(false)
        return
      }

      const { data: staff } = await supabase
        .from('staff')
        .select('*')
        .eq('email', session.user.email)
        .single()

      if (staff) {
        setUser({
          id: staff.id,
          email: staff.email,
          name_surname: staff.name_surname,
          nickname: staff.nickname,
          full_name: staff.full_name,
          department: staff.department,
          position: staff.position,
          job_grade: staff.job_grade,
          role: getRole(staff.email, staff.department),
        })
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUser()
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
