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

    const { foodType, quantity, urgency, location, coordinates } = req.body;

    // Validate required fields
    if (!foodType || !quantity || !location || !coordinates) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: {
          foodType: !foodType,
          quantity: !quantity,
          location: !location,
          coordinates: !coordinates
        }
      });
    }

    // Validate coordinates
    if (!coordinates.lat || !coordinates.lng) {
      return res.status(400).json({ 
        message: 'Invalid coordinates format. Both latitude and longitude are required.',
        received: coordinates
      });
    }

    // Create new request
    const request = new Request({
      requesterId: req.user.userId,
      foodType,
      quantity,
      urgency: urgency || 'Medium',
      location,
      coordinates: {
        lat: coordinates.lat,
        lng: coordinates.lng
      }
    });

    try {
      await request.save();
      res.status(201).json({
        message: 'Request created successfully',
        request,
      });
    } catch (saveError) {
      console.error('Error saving request:', saveError);
      return res.status(400).json({
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

// Update request status
router.put('/:id', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    if (!decoded.userId) {
      return res.status(401).json({ message: 'Invalid token - missing user ID' });
    }

    const { status, donorId, donationId } = req.body;

    // Validate status
    const validStatuses = ['Pending', 'In Progress', 'Matched', 'Completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status',
        validStatuses 
      });
    }
    
    // Find the request
    const request = await Request.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Validate state transition
    if (request.status === 'Completed') {
      return res.status(400).json({ message: 'Cannot update a completed request' });
    }

    // Update request fields
    const updateFields = {
      status,
      updatedAt: new Date()
    };

    if (donorId) {
      updateFields.donorId = donorId;
    }

    if (donationId) {
      updateFields.donationId = donationId;
    }

    // Update the request
    const updatedRequest = await Request.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { 
        new: true,
        runValidators: true
      }
    ).populate('requesterId', 'name')
     .populate('donorId', 'name')
     .populate('deliveryPartnerId', 'name');

    if (!updatedRequest) {
      return res.status(404).json({ message: 'Request not found after update' });
    }

    res.json({
      message: 'Request updated successfully',
      request: updatedRequest
    });
  } catch (error) {
    console.error('Error updating request:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Invalid request data',
        error: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({ 
      message: 'Failed to update request',
      error: error.message 
    });
  }
});

// Find and update request by details
router.post('/find-and-update', async (req, res) => {
  try {
    const { foodType, urgency, location, status } = req.body;

    // Find the request with matching details
    const request = await Request.findOne({
      foodType,
      urgency,
      location,
      status: 'Pending'
    });

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Update the request status
    request.status = status || 'Completed';
    await request.save();

    res.json({
      message: 'Request updated successfully',
      request
    });
  } catch (error) {
    console.error('Error updating request:', error);
    res.status(500).json({ message: 'Error updating request', error: error.message });
  }
});

module.exports = router;
