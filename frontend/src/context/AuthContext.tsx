import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import axios from 'axios'

// Use environment variable for API base URL
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

// Configure axios defaults
axios.defaults.baseURL = API_BASE

interface User {
  id: number
  name: string
  email: string
  type: 'vendor' | 'supplier'
  area: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string, type: string, area: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Initialize auth state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token')
      
      if (token) {
        try {
          // Set token in axios headers
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          // Verify token by fetching user profile
          const response = await axios.get('/profile')
          setUser(response.data)
        } catch (error) {
          console.error('Token verification failed:', error)
          // Clear invalid token
          localStorage.removeItem('token')
          delete axios.defaults.headers.common['Authorization']
        }
      }
      
      setLoading(false)
    }

    initializeAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post('/login', { email, password })
      const { token, user } = response.data

      // Store token
      localStorage.setItem('token', token)
      
      // Set token in axios headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      // Set user state
      setUser(user)
      
    } catch (error: any) {
      console.error('Login error:', error)
      throw new Error(error.response?.data?.error || 'Login failed')
    }
  }

  const register = async (email: string, password: string, name: string, type: string, area: string) => {
    try {
      const response = await axios.post('/register', { 
        email, 
        password, 
        name, 
        type, 
        area 
      })
      const { token, user } = response.data

      // Store token
      localStorage.setItem('token', token)
      
      // Set token in axios headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      // Set user state
      setUser(user)
      
    } catch (error: any) {
      console.error('Registration error:', error)
      throw new Error(error.response?.data?.error || 'Registration failed')
    }
  }

  const logout = () => {
    // Clear token from storage and axios headers
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
    
    // Clear user state
    setUser(null)
  }

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
