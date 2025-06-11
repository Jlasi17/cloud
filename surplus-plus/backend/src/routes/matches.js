const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation');
const Request = require('../models/Request');
const jwt = require('jsonwebtoken');

router.use(express.json());

// Define maximum distances for each food type (in kilometers)
const MAX_DISTANCES = {
  'Cooked Food': 10,
  'Fruits & Vegetables': 20,
  'Packet Food': 40,
  'Pulses': 40,
  'Other': 30
};

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

// Get matches for a request
router.get('/request/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await Request.findById(requestId);
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const matches = await Donation.find({
      status: 'Available',
      // Add any other matching criteria
    }).populate('donorId', 'name');

    res.json({ matches });
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ message: 'Error fetching matches', error: error.message });
  }
});

// Helper function to calculate distance between two points using Haversine formula
function calculateDistance(coord1, coord2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLon = toRad(coord2.lng - coord1.lng);
  const lat1 = toRad(coord1.lat);
  const lat2 = toRad(coord2.lat);

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
           Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function toRad(degrees) {
  return degrees * Math.PI / 180;
}

// Create a match
router.post('/create', async (req, res) => {
  try {
    const { donationId, requestId } = req.body;
    
    const donation = await Donation.findById(donationId);
    const request = await Request.findById(requestId);
    
    if (!donation || !request) {
      return res.status(404).json({ message: 'Donation or Request not found' });
    }
    
    // Update donation status
    donation.status = 'Matched';
    donation.receiverId = request.requesterId;
    await donation.save();
    
    // Update request status
    request.status = 'Matched';
    request.donationId = donationId;
    await request.save();
    
    // Emit socket event for real-time update
    req.app.get('io').emit('match_notification', {
      donationId,
      requestId,
      status: 'Matched'
    });
    
    res.json({ 
      message: 'Match created successfully',
      donation,
      request
    });
  } catch (error) {
    console.error('Error creating match:', error);
    res.status(500).json({ message: 'Error creating match', error: error.message });
  }
});

// Update match status
router.post('/status', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    const { matchId, status } = req.body;

    // Update the status in both Request and Donation collections
    await Request.findByIdAndUpdate(matchId, { status });
    await Donation.updateOne(
      { receiverId: matchId },
      { status }
    );

    res.json({ message: 'Status updated successfully' });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ message: 'Error updating status', error: error.message });
  }
});

// Get delivery partner's matches and available deliveries
router.get('/delivery', async (req, res) => {
  try {
    console.log('Fetching delivery matches and available deliveries');
    
    // Find all donations that are In Progress or need delivery
    const matches = await Donation.find({
      $or: [
        { status: 'In Progress' },
        { status: 'Paid' }
      ]
    })
    .populate('donorId', 'name location')
    .populate('receiverId', 'name location')
    .sort({ updatedAt: -1 });

    console.log('Found matches:', matches.length);
    
    // Separate matches into assigned and available
    const result = {
      assignedDeliveries: matches.filter(match => 
        match.deliveryPartnerId && match.deliveryPartnerId.toString() === req.user.userId
      ),
      availableDeliveries: matches.filter(match => 
        !match.deliveryPartnerId || match.status === 'In Progress'
      )
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching delivery matches:', error);
    res.status(500).json({ message: 'Error fetching delivery matches', error: error.message });
  }
});

module.exports = router;
