import { defineStore } from 'pinia'

export interface AuthUser {
  id: number
  name: string
  email: string
  phone?: string | null
}

const TOKEN_KEY = 'legalline_auth_token'
const USER_KEY = 'legalline_auth_user'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as AuthUser | null,
    token: null as string | null,
  }),
  getters: {
    isAuthenticated: state => !!state.token && !!state.user,
  },
  actions: {
    setAuth(token: string, user: AuthUser) {
      this.token = token
      this.user = user
      this.persist()
    },
    setUser(user: AuthUser | null) {
      this.user = user
      this.persist()
    },
    clearAuth() {
      this.token = null
      this.user = null
      this.persist()
    },
    authHeaders(): Record<string, string> {
      return this.token ? { Authorization: `Bearer ${this.token}` } : {}
    },
    restore() {
      if (!process.client) return
      const token = localStorage.getItem(TOKEN_KEY)
      const userRaw = localStorage.getItem(USER_KEY)
      if (!token || !userRaw) return

      try {
        this.token = token
        this.user = JSON.parse(userRaw)
      } catch {
        this.clearAuth()
      }
    },
    persist() {
      if (!process.client) return

      if (this.token && this.user) {
        localStorage.setItem(TOKEN_KEY, this.token)
        localStorage.setItem(USER_KEY, JSON.stringify(this.user))
        return
      }

      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    },
  },
})
