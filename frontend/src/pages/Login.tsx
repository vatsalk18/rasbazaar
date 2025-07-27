import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    type: 'vendor',
    area: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login, register } = useAuth()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    // Clear error when user starts typing
    if (error) setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isLogin) {
        await login(formData.email, formData.password)
      } else {
        // Validation for registration
        if (!formData.name || !formData.area) {
          setError('Please fill in all fields')
          return
        }
        await register(formData.email, formData.password, formData.name, formData.type, formData.area)
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    setError('')
    setFormData({
      email: '',
      password: '',
      name: '',
      type: 'vendor',
      area: ''
    })
  }

  // Demo credentials
  const fillDemoCredentials = (type: 'vendor' | 'supplier') => {
    setFormData({
      ...formData,
      email: type === 'vendor' ? 'vendor@demo.com' : 'supplier@demo.com',
      password: 'demo123'
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {isLogin ? 'Sign in to' : 'Join'} RasaBazaar
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isLogin 
              ? 'Access your group buying dashboard' 
              : 'Start saving money with group buying'
            }
          </p>
        </div>

        {/* Demo Credentials */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800 mb-2">📝 Demo Credentials:</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fillDemoCredentials('vendor')}
              className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded"
            >
              Vendor Demo
            </button>
            <button
              type="button"
              onClick={() => fillDemoCredentials('supplier')}
              className="text-xs bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded"
            >
              Supplier Demo
            </button>
          </div>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Registration fields */}
            {!isLogin && (
              <>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required={!isLogin}
                    value={formData.name}
                    onChange={handleInputChange}
                    className="input-field mt-1"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                    Account Type
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="input-field mt-1"
                  >
                    <option value="vendor">🍽️ Vendor (Street Food)</option>
                    <option value="supplier">🏪 Supplier (Wholesale)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="area" className="block text-sm font-medium text-gray-700">
                    Area/Location
                  </label>
                  <input
                    id="area"
                    name="area"
                    type="text"
                    required={!isLogin}
                    value={formData.area}
                    onChange={handleInputChange}
                    className="input-field mt-1"
                    placeholder="e.g., Connaught Place, Delhi"
                  />
                </div>
              </>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="input-field mt-1"
                placeholder="Enter your email"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                required
                value={formData.password}
                onChange={handleInputChange}
                className="input-field mt-1"
                placeholder="Enter your password"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </span>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </div>

          {/* Toggle Mode */}
          <div className="text-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-primary-600 hover:text-primary-500 text-sm"
            >
              {isLogin ? (
                <>Don't have an account? <span className="font-medium">Sign up</span></>
              ) : (
                <>Already have an account? <span className="font-medium">Sign in</span></>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login
