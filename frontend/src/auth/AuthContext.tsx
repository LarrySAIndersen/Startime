import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, clearDemoUser, getDemoUserId, setDemoUserId } from '../api/client'

export type Me = {
  id: string
  displayName: string
  givenName: string
  roles: string[]
  team?: { id: string; name: string }
}

type AuthCtx = {
  me: Me | null
  loading: boolean
  loginAs: (userId: string) => Promise<void>
  logout: () => void
  refresh: () => Promise<void>
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null)
  const [loading, setLoading] = useState(true)

  async function refresh() {
    if (!getDemoUserId()) {
      setMe(null)
      setLoading(false)
      return
    }
    try {
      setMe(await api<Me>('/api/v1/me'))
    } catch {
      setMe(null)
      clearDemoUser()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  async function loginAs(userId: string) {
    setDemoUserId(userId)
    setLoading(true)
    await refresh()
  }

  function logout() {
    clearDemoUser()
    setMe(null)
  }

  return (
    <Ctx.Provider value={{ me, loading, loginAs, logout, refresh }}>{children}</Ctx.Provider>
  )
}

export function useAuth() {
  const v = useContext(Ctx)
  if (!v) throw new Error('AuthProvider missing')
  return v
}
