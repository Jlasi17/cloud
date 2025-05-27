const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const jwt = require('jsonwebtoken');

// Middleware to parse JSON bodies
router.use(express.json());

// Create new request
router.post('/', async (req, res) => {
  try {
    // Verify JWT token
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      req.user = decoded;
    } catch (jwtError) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const { foodType, quantity, urgency, location } = req.body;

    // Validate required fields
    if (!foodType || !quantity || !location) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Create new request
    const request = new Request({
      requesterId: req.user.userId,
      foodType,
      quantity,
      urgency,
      location,
    });

    try {
      await request.save();
      res.status(201).json({
        message: 'Request created successfully',
        request,
      });
    } catch (saveError) {
      console.error('Error saving request:', saveError);
      return res.status(500).json({
        message: 'Failed to save request',
        error: saveError.message
      });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Get all requests
router.get('/', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;

    const requests = await Request.find()
      .populate('requesterId', 'name')
      .populate('donorId', 'name')
      .populate('deliveryPartnerId', 'name')
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ message: 'Error fetching requests', error: error.message });
  }
});

// Get user's requests
router.get('/my-requests', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;

    const requests = await Request.find({ requesterId: req.user.userId })
      .populate('donorId', 'name')
      .populate('deliveryPartnerId', 'name')
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (error) {
    console.error('Error fetching user requests:', error);
    res.status(500).json({ message: 'Error fetching user requests', error: error.message });
  }
});

// Delete a request
router.delete('/:id', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Find the request and verify ownership
    const request = await Request.findOne({
      _id: req.params.id,
      requesterId: decoded.userId
    });

    if (!request) {
      return res.status(404).json({ message: 'Request not found or not authorized' });
    }

    // Delete the request
    await Request.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Request deleted successfully' });
  } catch (error) {
    console.error('Error deleting request:', error);
    res.status(500).json({ message: 'Error deleting request', error: error.message });
  }
});

module.exports = router;
