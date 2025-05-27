const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation');
const jwt = require('jsonwebtoken');

// Middleware to parse JSON bodies
router.use(express.json());

// Create new donation
router.post('/', async (req, res) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;

    const { foodType, quantity, estimatedSpoilTime, location, marketCost } = req.body;
    
    // Create new donation
    const donation = new Donation({
      donorId: req.user.userId,
      foodType,
      quantity,
      estimatedSpoilTime,
      location,
      marketCost,
      status: 'Available'
    });

    // Save donation
    await donation.save();
    
    res.status(201).json({
      message: 'Donation created successfully',
      donation,
    });
  } catch (error) {
    console.error('Error creating donation:', error);
    res.status(500).json({ 
      message: 'Failed to create donation',
      error: error.message 
    });
  }
});

// Get user's donations
router.get('/my-donations', async (req, res) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;

    const donations = await Donation.find({ donorId: req.user.userId })
      .populate('donorId', 'name')
      .populate('receiverId', 'name')
      .populate('deliveryPartnerId', 'name')
      .sort({ createdAt: -1 });

    res.json({ donations });
  } catch (error) {
    console.error('Error fetching user donations:', error);
    res.status(500).json({ message: 'Error fetching user donations', error: error.message });
  }
});

// Get all donations with optional filters
router.get('/', async (req, res) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;

    const { foodType, location, minQuantity } = req.query;
    
    // Build query
    const query = { status: 'Available' };
    
    // Exclude current user's donations
    query.donorId = { $ne: req.user.userId };
    
    // Apply filters if provided
    if (foodType) {
      query.foodType = foodType;
    }
    
    if (location) {
      // Case-insensitive search for location
      query.location = { $regex: new RegExp(location, 'i') };
    }
    
    if (minQuantity) {
      // Assuming quantity is a string like '5 kg' or '10 pieces'
      // Extract the numeric part for comparison
      const quantityNum = parseFloat(minQuantity);
      if (!isNaN(quantityNum)) {
        query.$expr = {
          $gte: [
            { $toDouble: { $arrayElemAt: [{ $split: ["$quantity", " "] }, 0] } },
            quantityNum
          ]
        };
      }
    }

    const donations = await Donation.find(query)
      .populate('donorId', 'name email phone')
      .sort({ estimatedSpoilTime: 1 }) // Sort by soonest to expire first
      .limit(50); // Limit results to prevent over-fetching

    res.json(donations);
  } catch (error) {
    console.error('Error fetching donations:', error);
    res.status(500).json({ message: 'Error fetching donations', error: error.message });
  }
});

// Get user's donations
router.get('/my-donations', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;

    const donations = await Donation.find({ donorId: req.user.userId })
      .populate('receiverId', 'name')
      .populate('deliveryPartnerId', 'name')
      .sort({ createdAt: -1 });

    res.json({ donations });
  } catch (error) {
    console.error('Error fetching user donations:', error);
    res.status(500).json({ message: 'Error fetching user donations', error: error.message });
  }
});

// Delete a donation
router.delete('/:id', async (req, res) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Find the donation and verify ownership
    const donation = await Donation.findOne({
      _id: req.params.id,
      donorId: decoded.userId
    });

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found or not authorized' });
    }

    // Delete the donation
    await Donation.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Donation deleted successfully' });
  } catch (error) {
    console.error('Error deleting donation:', error);
    res.status(500).json({ message: 'Error deleting donation', error: error.message });
  }
});

module.exports = router;
