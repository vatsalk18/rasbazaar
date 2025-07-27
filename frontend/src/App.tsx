import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import VendorDashboard from './pages/VendorDashboard'
import SupplierDashboard from './pages/SupplierDashboard'

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to={user.type === 'vendor' ? '/vendor' : '/supplier'} />} />
        <Route path="/vendor" element={user?.type === 'vendor' ? <VendorDashboard /> : <Navigate to="/login" />} />
        <Route path="/supplier" element={user?.type === 'supplier' ? <SupplierDashboard /> : <Navigate to="/login" />} />
        <Route path="/" element={<Navigate to={user ? (user.type === 'vendor' ? '/vendor' : '/supplier') : '/login'} />} />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
