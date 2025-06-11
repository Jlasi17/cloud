const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Donation = require('../models/Donation');
const Request = require('../models/Request');
const jwt = require('jsonwebtoken');

// Middleware to parse JSON bodies
router.use(express.json());

// Middleware to verify JWT token
const auth = (req, res, next) => {
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

// Create new transaction
router.post('/', async (req, res) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    if (!decoded.userId) {
      return res.status(401).json({ message: 'Invalid token - missing user ID' });
    }

    const { donationId, donorId, receiverId, amount, status, paymentMethod } = req.body;

    // Create new transaction
    const transaction = new Transaction({
      donationId,
      donorId,
      receiverId,
      amount,
      status,
      paymentMethod
    });

    // Save transaction
    await transaction.save();

    // Populate the response
    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate('donorId', 'name')
      .populate('receiverId', 'name');

    res.status(201).json({
      message: 'Transaction created successfully',
      transaction: populatedTransaction
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Invalid transaction data',
        error: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({ 
      message: 'Failed to create transaction',
      error: error.message 
    });
  }
});

// Get user's transactions
router.get('/', async (req, res) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    if (!decoded.userId) {
      return res.status(401).json({ message: 'Invalid token - missing user ID' });
    }

    // Find transactions where user is either donor or receiver
    const transactions = await Transaction.find({
      $or: [
        { donorId: decoded.userId },
        { receiverId: decoded.userId }
      ]
    })
    .populate('donorId', 'name')
    .populate('receiverId', 'name')
    .populate('donationId')
    .sort({ createdAt: -1 });

    res.json({ transactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    res.status(500).json({ message: 'Error fetching transactions', error: error.message });
  }
});

// Get a single transaction
router.get('/:id', async (req, res) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    if (!decoded.userId) {
      return res.status(401).json({ message: 'Invalid token - missing user ID' });
    }

    const transaction = await Transaction.findById(req.params.id)
      .populate('donorId', 'name')
      .populate('receiverId', 'name')
      .populate('donationId');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Check if user is authorized to view this transaction
    if (transaction.donorId._id.toString() !== decoded.userId && 
        transaction.receiverId._id.toString() !== decoded.userId) {
      return res.status(403).json({ message: 'Not authorized to view this transaction' });
    }

    res.json(transaction);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid transaction ID format' });
    }
    res.status(500).json({ message: 'Error fetching transaction', error: error.message });
  }
});

// Create a new transaction
router.post('/create', auth, async (req, res) => {
  try {
    const { donationId, donorId, receiverId, amount, paymentMethod } = req.body;
    
    const transaction = new Transaction({
      donationId,
      donorId,
      receiverId,
      amount,
      status: 'In Progress',
      paymentMethod
    });
    
    await transaction.save();
    
    res.status(201).json({
      message: 'Transaction created successfully',
      transaction
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ message: 'Error creating transaction', error: error.message });
  }
});

// Mark transaction as delivered
router.put('/:id/deliver', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.status !== 'In Progress') {
      return res.status(400).json({ message: 'Transaction must be in progress to be marked as delivered' });
    }

    // Update transaction status
    transaction.status = 'Completed';
    await transaction.save();

    // Update donation status
    await Donation.findByIdAndUpdate(transaction.donationId, {
      status: 'Delivered',
      updatedAt: new Date()
    });

    // Find and update associated request
    const request = await Request.findOne({ donationId: transaction.donationId });
    if (request) {
      request.status = 'Completed';
      request.updatedAt = new Date();
      await request.save();
    }

    res.json({
      message: 'Transaction marked as delivered',
      transaction,
      request: request || null
    });
  } catch (error) {
    console.error('Error marking transaction as delivered:', error);
    res.status(500).json({ message: 'Error marking transaction as delivered', error: error.message });
  }
});

module.exports = router; 