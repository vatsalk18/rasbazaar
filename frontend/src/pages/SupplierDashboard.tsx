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
  supplierId: number
  targetQuantity: number
  currentQuantity: number
  pricePerUnit: number
  deadline: string
  participants: Array<{ vendorId: number; quantity: number }>
  status: string
}

const SupplierDashboard: React.FC = () => {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [groupOrders, setGroupOrders] = useState<GroupOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [showCreateOrder, setShowCreateOrder] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'vegetables',
    basePrice: '',
    unit: 'kg',
    minOrder: ''
  })

  const [newOrder, setNewOrder] = useState({
    title: '',
    targetQuantity: '',
    pricePerUnit: '',
    deadline: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [productsRes, ordersRes] = await Promise.all([
        axios.get('/products'),
        axios.get('/orders')
      ])
      
      // Filter to show only this supplier's products and orders
      const myProducts = productsRes.data.filter((p: Product) => p.supplierId === user?.id)
      const myOrders = ordersRes.data.filter((o: GroupOrder) => o.supplierId === user?.id)
      
      setProducts(myProducts)
      setGroupOrders(myOrders)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const addProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await axios.post('/products', {
        ...newProduct,
        basePrice: parseFloat(newProduct.basePrice),
        minOrder: parseInt(newProduct.minOrder)
      })
      
      setNewProduct({ name: '', category: 'vegetables', basePrice: '', unit: 'kg', minOrder: '' })
      setShowAddProduct(false)
      fetchData()
      
      alert('Product added successfully!')
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error adding product')
    }
  }

  const createGroupOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) return

    try {
      await axios.post('/orders', {
        productId: selectedProduct.id,
        title: newOrder.title || `Bulk ${selectedProduct.name} Order`,
        targetQuantity: parseInt(newOrder.targetQuantity),
        pricePerUnit: parseFloat(newOrder.pricePerUnit),
        deadline: newOrder.deadline
      })
      
      setNewOrder({ title: '', targetQuantity: '', pricePerUnit: '', deadline: '' })
      setSelectedProduct(null)
      setShowCreateOrder(false)
      fetchData()
      
      alert('Group order created successfully!')
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error creating group order')
    }
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
            Welcome, {user?.name}! 🏪
          </h1>
          <p className="mt-2 text-gray-600">
            Manage your products and create group buying opportunities
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900">My Products</h3>
            <p className="text-3xl font-bold text-primary-600">{products.length}</p>
          </div>
          
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900">Active Group Orders</h3>
            <p className="text-3xl font-bold text-blue-600">
              {groupOrders.filter(order => order.status === 'active').length}
            </p>
          </div>
          
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900">Total Participants</h3>
            <p className="text-3xl font-bold text-green-600">
              {groupOrders.reduce((sum, order) => sum + order.participants.length, 0)}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Products Section */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">📦 My Products</h2>
              <button
                onClick={() => setShowAddProduct(true)}
                className="btn-primary"
              >
                Add Product
              </button>
            </div>

            {/* Add Product Form */}
            {showAddProduct && (
              <div className="card mb-6">
                <h3 className="text-lg font-semibold mb-4">Add New Product</h3>
                <form onSubmit={addProduct} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Name
                    </label>
                    <input
                      type="text"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                      className="input-field"
                      placeholder="e.g., Fresh Onions"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                      className="input-field"
                    >
                      <option value="vegetables">🥕 Vegetables</option>
                      <option value="spices">🌶️ Spices</option>
                      <option value="oil">🫒 Oil</option>
                      <option value="grains">🌾 Grains</option>
                      <option value="dairy">🥛 Dairy</option>
                      <option value="other">📦 Other</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Base Price (₹)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={newProduct.basePrice}
                        onChange={(e) => setNewProduct({...newProduct, basePrice: e.target.value})}
                        className="input-field"
                        placeholder="30.00"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit
                      </label>
                      <select
                        value={newProduct.unit}
                        onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})}
                        className="input-field"
                      >
                        <option value="kg">kg</option>
                        <option value="liter">liter</option>
                        <option value="piece">piece</option>
                        <option value="dozen">dozen</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Order Quantity
                    </label>
                    <input
                      type="number"
                      value={newProduct.minOrder}
                      onChange={(e) => setNewProduct({...newProduct, minOrder: e.target.value})}
                      className="input-field"
                      placeholder="100"
                      required
                    />
                  </div>

                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary">
                      Add Product
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddProduct(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Products List */}
            <div className="space-y-4">
              {products.length === 0 ? (
                <div className="card text-center">
                  <p className="text-gray-500">No products added yet.</p>
                  <p className="text-sm text-gray-400 mt-2">Add your first product to get started!</p>
                </div>
              ) : (
                products.map((product) => (
                  <div key={product.id} className="card">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                        <p className="text-gray-600">{product.category}</p>
                        <p className="text-xl font-bold text-primary-600 mt-2">
                          ₹{product.basePrice}/{product.unit}
                        </p>
                        <p className="text-sm text-gray-500">
                          Min order: {product.minOrder} {product.unit}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedProduct(product)
                          setShowCreateOrder(true)
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Create Group Order
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Group Orders Section */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">🤝 My Group Orders</h2>
            
            {/* Create Order Form */}
            {showCreateOrder && selectedProduct && (
              <div className="card mb-6">
                <h3 className="text-lg font-semibold mb-4">
                  Create Group Order for {selectedProduct.name}
                </h3>
                <form onSubmit={createGroupOrder} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Order Title
                    </label>
                    <input
                      type="text"
                      value={newOrder.title}
                      onChange={(e) => setNewOrder({...newOrder, title: e.target.value})}
                      className="input-field"
                      placeholder={`Bulk ${selectedProduct.name} Order`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Target Quantity ({selectedProduct.unit})
                      </label>
                      <input
                        type="number"
                        value={newOrder.targetQuantity}
                        onChange={(e) => setNewOrder({...newOrder, targetQuantity: e.target.value})}
                        className="input-field"
                        placeholder="500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Group Price (₹/{selectedProduct.unit})
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={newOrder.pricePerUnit}
                        onChange={(e) => setNewOrder({...newOrder, pricePerUnit: e.target.value})}
                        className="input-field"
                        placeholder="25.00"
                        required
                      />
                      <p className="text-sm text-green-600 mt-1">
                        {newOrder.pricePerUnit && (
                          `Save ₹${(selectedProduct.basePrice - parseFloat(newOrder.pricePerUnit)).toFixed(2)} per ${selectedProduct.unit}`
                        )}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Deadline
                    </label>
                    <input
                      type="date"
                      value={newOrder.deadline}
                      onChange={(e) => setNewOrder({...newOrder, deadline: e.target.value})}
                      className="input-field"
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>

                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary">
                      Create Group Order
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateOrder(false)
                        setSelectedProduct(null)
                      }}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Group Orders List */}
            <div className="space-y-4">
              {groupOrders.length === 0 ? (
                <div className="card text-center">
                  <p className="text-gray-500">No group orders created yet.</p>
                  <p className="text-sm text-gray-400 mt-2">Create your first group order from your products!</p>
                </div>
              ) : (
                groupOrders.map((order) => {
                  const product = products.find(p => p.id === order.productId)
                  const progress = (order.currentQuantity / order.targetQuantity) * 100

                  return (
                    <div key={order.id} className="card">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{order.title}</h3>
                          <p className="text-gray-600">{product?.name}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          order.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Progress</p>
                          <div className="flex items-center">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                              <div 
                                className="bg-primary-600 h-2 rounded-full"
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">
                              {order.currentQuantity}/{order.targetQuantity}
                            </span>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm text-gray-600">Participants</p>
                          <p className="text-xl font-bold text-blue-600">
                            {order.participants.length} vendor(s)
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-sm text-gray-600">
                        <span>Price: ₹{order.pricePerUnit}/{product?.unit}</span>
                        <span>Deadline: {new Date(order.deadline).toLocaleDateString()}</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SupplierDashboard
