import React from 'react'
import { useAuth } from '../context/AuthContext'

const Navbar: React.FC = () => {
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
  }

  return (
    <nav className="bg-primary-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold">
              🛒 RasaBazaar
            </h1>
            <span className="ml-2 text-sm text-primary-200">
              Group Buying for Street Vendors
            </span>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className="text-sm">
                  <span className="text-primary-200">Welcome,</span>
                  <span className="font-medium ml-1">{user.name}</span>
                  <span className="text-primary-300 ml-2">
                    ({user.type === 'vendor' ? '🍽️ Vendor' : '🏪 Supplier'})
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-primary-700 hover:bg-primary-800 px-3 py-1 rounded text-sm transition-colors duration-200"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="text-sm text-primary-200">
                Not logged in
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
