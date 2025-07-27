const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'rasabazaar-demo-secret-key';

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Helper functions for JSON file operations
const readJSON = (filename) => {
  const filePath = path.join(__dirname, 'data', filename);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '[]');
    return [];
  }
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return [];
  }
};

const writeJSON = (filename, data) => {
  const filePath = path.join(__dirname, 'data', filename);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing ${filename}:`, error);
    return false;
  }
};

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// ==================== AUTH ROUTES ====================

// User Registration
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name, type, area } = req.body;
    
    // Validation
    if (!email || !password || !name || !type || !area) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!['vendor', 'supplier'].includes(type)) {
      return res.status(400).json({ error: 'Type must be vendor or supplier' });
    }

    const users = readJSON('users.json');
    
    // Check if user already exists
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    // Create new user
    const newUser = {
      id: users.length + 1,
      email,
      password: hashedPassword,
      name,
      type,
      area,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    writeJSON('users.json', users);

    // Generate token
    const token = jwt.sign(
      { id: newUser.id, type: newUser.type }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({ 
      message: 'User registered successfully',
      token, 
      user: userWithoutPassword 
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// User Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const users = readJSON('users.json');
    const user = users.find(u => u.email === email);

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, type: user.type }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;
    res.json({ 
      message: 'Login successful',
      token, 
      user: userWithoutPassword 
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// ==================== PRODUCT ROUTES ====================

// Get all products
app.get('/api/products', (req, res) => {
  try {
    const products = readJSON('products.json');
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Server error fetching products' });
  }
});

// Add new product (suppliers only)
app.post('/api/products', authenticateToken, (req, res) => {
  try {
    if (req.user.type !== 'supplier') {
      return res.status(403).json({ error: 'Only suppliers can add products' });
    }

    const { name, category, basePrice, unit, minOrder } = req.body;

    if (!name || !category || !basePrice || !unit || !minOrder) {
      return res.status(400).json({ error: 'All product fields are required' });
    }

    const products = readJSON('products.json');
    
    const newProduct = {
      id: products.length + 1,
      supplierId: req.user.id,
      name,
      category,
      basePrice: parseFloat(basePrice),
      unit,
      minOrder: parseInt(minOrder),
      createdAt: new Date().toISOString()
    };

    products.push(newProduct);
    writeJSON('products.json', products);

    res.status(201).json({ 
      message: 'Product added successfully',
      product: newProduct 
    });

  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ error: 'Server error adding product' });
  }
});

// ==================== GROUP ORDER ROUTES ====================

// Get all group orders
app.get('/api/orders', (req, res) => {
  try {
    const orders = readJSON('orders.json');
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Server error fetching orders' });
  }
});

// Create new group order (suppliers only)
app.post('/api/orders', authenticateToken, (req, res) => {
  try {
    if (req.user.type !== 'supplier') {
      return res.status(403).json({ error: 'Only suppliers can create group orders' });
    }

    const { productId, title, targetQuantity, pricePerUnit, deadline } = req.body;

    if (!productId || !title || !targetQuantity || !pricePerUnit || !deadline) {
      return res.status(400).json({ error: 'All order fields are required' });
    }

    const orders = readJSON('orders.json');
    
    const newOrder = {
      id: orders.length + 1,
      productId: parseInt(productId),
      supplierId: req.user.id,
      title,
      targetQuantity: parseInt(targetQuantity),
      currentQuantity: 0,
      pricePerUnit: parseFloat(pricePerUnit),
      deadline,
      participants: [],
      status: 'active',
      createdAt: new Date().toISOString()
    };

    orders.push(newOrder);
    writeJSON('orders.json', orders);

    res.status(201).json({ 
      message: 'Group order created successfully',
      order: newOrder 
    });

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Server error creating order' });
  }
});

// Join group order (vendors only)
app.post('/api/orders/:id/join', authenticateToken, (req, res) => {
  try {
    if (req.user.type !== 'vendor') {
      return res.status(403).json({ error: 'Only vendors can join group orders' });
    }

    const orderId = parseInt(req.params.id);
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Valid quantity is required' });
    }

    const orders = readJSON('orders.json');
    const orderIndex = orders.findIndex(o => o.id === orderId);

    if (orderIndex === -1) {
      return res.status(404).json({ error: 'Group order not found' });
    }

    const order = orders[orderIndex];

    if (order.status !== 'active') {
      return res.status(400).json({ error: 'This group order is no longer active' });
    }

    // Check if vendor already joined
    const existingParticipant = order.participants.find(p => p.vendorId === req.user.id);
    if (existingParticipant) {
      return res.status(400).json({ error: 'You have already joined this group order' });
    }

    // Add participant
    const participant = {
      vendorId: req.user.id,
      quantity: parseInt(quantity),
      joinedAt: new Date().toISOString()
    };

    orders[orderIndex].participants.push(participant);
    orders[orderIndex].currentQuantity += parseInt(quantity);

    writeJSON('orders.json', orders);

    res.json({ 
      message: 'Successfully joined group order',
      order: orders[orderIndex] 
    });

  } catch (error) {
    console.error('Error joining order:', error);
    res.status(500).json({ error: 'Server error joining order' });
  }
});

// ==================== UTILITY ROUTES ====================

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'RasaBazaar API is running',
    timestamp: new Date().toISOString() 
  });
});

// Get user profile
app.get('/api/profile', authenticateToken, (req, res) => {
  try {
    const users = readJSON('users.json');
    const user = users.find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);

  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Server error fetching profile' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 RasaBazaar API server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
