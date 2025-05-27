const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation');
const Request = require('../models/Request');
const jwt = require('jsonwebtoken');

router.use(express.json());

// Get matches for a request
router.get('/request/:requestId', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;

    const requestId = req.params.requestId;
    const request = await Request.findById(requestId);
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Find matching donations from other users
    const matches = await Donation.find({
      foodType: request.foodType,
      location: request.location,
      status: 'Available',
      quantity: { $gte: request.quantity },
      donorId: { $ne: request.requesterId },  // Exclude donations from the requester
    })
    .populate('donorId', 'name')
    .sort({ createdAt: -1 });

    res.json({ matches });
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ message: 'Error fetching matches', error: error.message });
  }
});

// Create a match
router.post('/create', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;

    const { requestId, donationId } = req.body;

    // Update request status
    await Request.findByIdAndUpdate(requestId, {
      status: 'Matched',
      donorId: req.user.userId
    });

    // Update donation status
    await Donation.findByIdAndUpdate(donationId, {
      status: 'Matched',
      receiverId: req.user.userId
    });

    res.json({ message: 'Match created successfully' });
  } catch (error) {
    console.error('Error creating match:', error);
    res.status(500).json({ message: 'Error creating match', error: error.message });
  }
});

module.exports = router;
