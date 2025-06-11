const express = require('express');
const router = express.Router();
const Billing = require('../models/Billing');
const Donation = require('../models/Donation');
const Request = require('../models/Request');
const jwt = require('jsonwebtoken');

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

// Create a new bill (called when food is delivered)
router.post('/create', auth, async (req, res) => {
  try {
    const { donationId, requestId } = req.body;
    
    // Get donation and request details
    const donation = await Donation.findById(donationId);
    const request = await Request.findById(requestId);
    
    if (!donation || !request) {
      return res.status(404).json({ message: 'Donation or Request not found' });
    }
    
    // Create a new bill
    const bill = new Billing({
      donationId,
      requestId,
      donorId: donation.donorId,
      receiverId: request.requesterId,
      originalCost: donation.estimatedValue || 100,
      quantity: request.quantity,
      spoilTime: donation.spoilTime || new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: 'completed'
    });
    
    // Calculate and save the final cost
    bill.calculateCost();
    await bill.save();
    
    // Update donation status to indicate payment is complete
    donation.status = 'Paid';
    donation.deliveryPartnerId = null; // Reset delivery partner to allow new assignment
    await donation.save();
    
    // Emit socket event to notify all delivery partners of new request
    req.app.get('io').emit('delivery_request', {
      type: 'new_request',
      donationId: donation._id,
      foodType: donation.foodType,
      quantity: donation.quantity,
      pickupAddress: donation.location,
      deliveryAddress: request.deliveryAddress,
      estimatedValue: donation.estimatedValue,
      requestId: request._id,
      timestamp: new Date()
    });
    
    res.status(201).json({
      message: 'Bill created successfully',
      bill: {
        id: bill._id,
        transactionId: bill.transactionId,
        originalCost: bill.originalCost,
        calculatedCost: bill.calculatedCost,
        quantity: bill.quantity,
        status: bill.status,
        timestamp: bill.timestamp
      }
    });
    
  } catch (error) {
    console.error('Error creating bill:', error);
    res.status(500).json({ message: 'Error creating bill', error: error.message });
  }
});

// Get billing history for a user
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get both donor and receiver transactions
    const bills = await Billing.find({
      $or: [{ donorId: userId }, { receiverId: userId }]
    })
    .sort({ timestamp: -1 })
    .populate('donorId', 'name')
    .populate('receiverId', 'name')
    .populate('donationId', 'foodType')
    .populate('requestId', 'foodType');
    
    res.json(bills);
    
  } catch (error) {
    console.error('Error fetching billing history:', error);
    res.status(500).json({ message: 'Error fetching billing history', error: error.message });
  }
});

// Simulate payment (in a real app, this would integrate with a payment processor)
router.post('/simulate-payment', auth, async (req, res) => {
  try {
    const { amount, paymentMethod = 'card' } = req.body;
    
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real app, you would integrate with a payment processor here
    const paymentSuccess = Math.random() > 0.1; // 90% success rate for demo
    
    if (paymentSuccess) {
      res.json({
        success: true,
        transactionId: 'PAY' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        amount,
        paymentMethod,
        timestamp: new Date()
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment failed. Please try again.'
      });
    }
    
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ message: 'Error processing payment', error: error.message });
  }
});

module.exports = router;
