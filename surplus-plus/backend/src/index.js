require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const socketIo = require('socket.io');
const connectDB = require('./config/db');

const app = express();
const server = require('http').createServer(app);

// Connect to MongoDB
connectDB();

const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Auth middleware
const jwtMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
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
app.use('/api/donations', donationRoutes);

// Matches routes
const matchesRoutes = require('./routes/matches');
app.use('/api/matches', matchesRoutes);

// Request routes
const requestRoutes = require('./routes/requests');
app.use('/api/requests', jwtMiddleware, requestRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });

  // Handle real-time notifications
  socket.on('new_match', (data) => {
    io.emit('match_notification', data);
  });

  socket.on('delivery_status_update', (data) => {
    io.emit('delivery_update', data);
  });
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Add timeout
  socketTimeoutMS: 45000,
  family: 4 // Use IPv4
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5002;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
