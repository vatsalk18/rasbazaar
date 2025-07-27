import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

interface Product {
  id: number
  name: string
  category: string
  basePrice: number
  unit: string
  minOrder: number
  supplierId: number
}

interface GroupOrder {
  id: number
  title: string
  productId: number
  targetQuantity: number
  currentQuantity: number
  pricePerUnit: number
  deadline: string
  participants: Array<{ vendorId: number; quantity: number }>
  status: string
}

const VendorDashboard: React.FC = () => {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [groupOrders, setGroupOrders] = useState<GroupOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [productsRes, ordersRes] = await Promise.all([
        axios.get('/products'),
        axios.get('/orders')
      ])
      
      setProducts(productsRes.data)
      setGroupOrders(ordersRes.data.filter((order: GroupOrder) => order.status === 'active'))
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const joinGroup = async (orderId: number, quantity: number) => {
    try {
      await axios.post(`/orders/${orderId}/join`, { quantity })
      
      // Refresh data
      fetchData()
      
      alert(`Successfully joined group order with ${quantity} units!`)
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to join group order')
    }
  }

  const handleJoinGroup = (order: GroupOrder) => {
    const quantity = prompt(`How many ${order.targetQuantity >= 100 ? 'kg' : 'units'} do you want to order?`)
    
    if (quantity && parseInt(quantity) > 0) {
      joinGroup(order.id, parseInt(quantity))
    }
  }

  const isParticipating = (order: GroupOrder) => {
    return order.participants.some(p => p.vendorId === user?.id)
  }

  const getMyQuantity = (order: GroupOrder) => {
    const participant = order.participants.find(p => p.vendorId === user?.id)
    return participant?.quantity || 0
  }

  const calculateSavings = (basePrice: number, groupPrice: number, quantity: number) => {
    const savings = (basePrice - groupPrice) * quantity
    const percentage = ((basePrice - groupPrice) / basePrice) * 100
    return { savings, percentage }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {user?.name}! 🍽️
          </h1>
          <p className="mt-2 text-gray-600">
            Find great group deals on ingredients for your food business
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900">Active Group Orders</h3>
            <p className="text-3xl font-bold text-primary-600">{groupOrders.length}</p>
          </div>
          
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900">My Participations</h3>
            <p className="text-3xl font-bold text-blue-600">
              {groupOrders.filter(order => isParticipating(order)).length}
            </p>
          </div>
          
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900">Available Products</h3>
            <p className="text-3xl font-bold text-green-600">{products.length}</p>
          </div>
        </div>

        {/* Active Group Orders */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">🤝 Active Group Orders</h2>
          
          {groupOrders.length === 0 ? (
            <div className="card text-center">
              <p className="text-gray-500">No active group orders available.</p>
              <p className="text-sm text-gray-400 mt-2">Check back later for new deals!</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {groupOrders.map((order) => {
                const product = products.find(p => p.id === order.productId)
                const participating = isParticipating(order)
                const myQuantity = getMyQuantity(order)
                const progress = (order.currentQuantity / order.targetQuantity) * 100
                
                const savings = product ? calculateSavings(product.basePrice, order.pricePerUnit, myQuantity) : null

                return (
                  <div key={order.id} className="card">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{order.title}</h3>
                        <p className="text-gray-600">{product?.name} - {product?.category}</p>
                      </div>
                      {participating && (
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                          ✅ Joined
                        </span>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Price per unit</p>
                        <p className="text-2xl font-bold text-primary-600">
                          ₹{order.pricePerUnit}
                          {product && (
                            <span className="text-sm text-gray-500 line-through ml-2">
                              ₹{product.basePrice}
                            </span>
                          )}
                        </p>
                        {product && (
                          <p className="text-sm text-green-600">
                            Save ₹{product.basePrice - order.pricePerUnit} per {product.unit}
                          </p>
                        )}
                      </div>

                      <div>
                        <p className="text-sm text-gray-600">Progress</p>
                        <div className="flex items-center">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                            <div 
                              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">
                            {order.currentQuantity}/{order.targetQuantity}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {order.participants.length} vendor(s) joined
                        </p>
                      </div>
                    </div>

                    {participating && myQuantity > 0 && savings && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                        <p className="text-sm text-green-800">
                          <strong>Your order:</strong> {myQuantity} {product?.unit}
                        </p>
                        <p className="text-sm text-green-800">
                          <strong>Your savings:</strong> ₹{savings.savings.toFixed(2)} 
                          ({savings.percentage.toFixed(1)}% off)
                        </p>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        Deadline: {new Date(order.deadline).toLocaleDateString()}
                      </div>
                      
                      {!participating ? (
                        <button
                          onClick={() => handleJoinGroup(order)}
                          className="btn-primary"
                        >
                          Join Group Order
                        </button>
                      ) : (
                        <span className="text-green-600 font-medium">
                          Already joined with {myQuantity} {product?.unit}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Available Products */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">📦 Available Products</h2>
          
          {products.length === 0 ? (
            <div className="card text-center">
              <p className="text-gray-500">No products available yet.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div key={product.id} className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {product.name}
                  </h3>
                  <p className="text-gray-600 mb-2">{product.category}</p>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xl font-bold text-gray-900">
                        ₹{product.basePrice}/{product.unit}
                      </p>
                      <p className="text-sm text-gray-500">
                        Min order: {product.minOrder} {product.unit}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default VendorDashboard
