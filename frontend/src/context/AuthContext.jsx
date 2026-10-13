import { createContext, useContext, useState } from 'react'
import { api, apiErrorMessage, getToken, setToken } from '../services/api'

const AuthContext = createContext(null)
const USER_KEY = 'sentinelops_user'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return getToken() ? JSON.parse(localStorage.getItem(USER_KEY)) : null
    } catch {
      return null
    }
  })

  // Task 6: POST /api/auth/login - real authentication against MySQL.
  async function login(email, password) {
    try {
      const { data } = await api.post('/auth/login', { email, password })
      setToken(data.token)
      localStorage.setItem(USER_KEY, JSON.stringify(data.user))
      setUser(data.user)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: apiErrorMessage(err, 'Email or password is incorrect.') }
    }
  }

  function logout() {
    setToken(null)
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
