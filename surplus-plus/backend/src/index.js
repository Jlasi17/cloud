require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const socketIO = require('socket.io');
const connectDB = require('./config/db');
const http = require('http');

const app = express();
const server = http.createServer(app);

// Connect to MongoDB
connectDB();

const io = socketIO(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 10000,
  allowEIO3: true
});

// Make io accessible to routes
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());

// JWT Middleware
const jwtMiddleware = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Please authenticate' });
  }
};

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Surplus+ API' });
});

// Auth routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Donation routes
const donationRoutes = require('./routes/donations');
app.use('/api/donations', jwtMiddleware, donationRoutes);

// Transaction routes
const transactionRoutes = require('./routes/transactions');
app.use('/api/transactions', jwtMiddleware, transactionRoutes);

// Matches routes
const matchRoutes = require('./routes/matches');
app.use('/api/matches', jwtMiddleware, matchRoutes);

// Request routes
const requestRoutes = require('./routes/requests');
app.use('/api/requests', jwtMiddleware, requestRoutes);

// Delivery routes
const deliveryRoutes = require('./routes/delivery');
app.use('/api/delivery', jwtMiddleware, deliveryRoutes);

// Billing routes
const billingRoutes = require('./routes/billing');
app.use('/api/billing', jwtMiddleware, billingRoutes);

// Payment routes
const paymentRoutes = require('./routes/payments');
app.use('/api/payments', jwtMiddleware, paymentRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Handle client errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  socket.on('disconnect', (reason) => {
    console.log('Client disconnected:', socket.id, 'Reason:', reason);
  });

  // Handle real-time notifications
  socket.on('new_match', (data) => {
    try {
      io.emit('match_notification', data);
    } catch (error) {
      console.error('Error emitting match notification:', error);
    }
  });

  socket.on('delivery_status_update', (data) => {
    try {
      io.emit('delivery_update', data);
    } catch (error) {
      console.error('Error emitting delivery update:', error);
    }
  });
});

// Error handling for Socket.IO
io.engine.on('connection_error', (err) => {
  console.error('Socket.IO connection error:', err);
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/surplus-plus', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Add timeout
  socketTimeoutMS: 45000,
  family: 4 // Use IPv4
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5002;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
