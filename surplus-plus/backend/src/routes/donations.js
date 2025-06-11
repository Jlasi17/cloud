const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation');
const jwt = require('jsonwebtoken');
const { calculateFinalPrice } = require('../utils/priceCalculator');

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
      status: 'Available',
      // Set default values for required fields
      coordinates: {
        lat: 0,
        lng: 0
      },
      estimatedValue: parseFloat(marketCost) || 0,
      spoilTime: new Date(estimatedSpoilTime)
    });

    // Save donation
    await donation.save();
    
    res.status(201).json({
      message: 'Donation created successfully',
      donation,
    });
  } catch (error) {
    console.error('Error creating donation:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Invalid donation data',
        error: Object.values(error.errors).map(err => err.message)
      });
    }
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
    if (!decoded.userId) {
      return res.status(401).json({ message: 'Invalid token - missing user ID' });
    }

    const donations = await Donation.find({ donorId: decoded.userId })
      .populate('donorId', 'name')
      .populate('receiverId', 'name')
      .populate('deliveryPartnerId', 'name')
      .sort({ createdAt: -1 });

    if (!donations) {
      return res.status(404).json({ message: 'No donations found' });
    }

    res.json({ donations });
  } catch (error) {
    console.error('Error fetching user donations:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
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

    // Add price calculations to each donation
    const donationsWithPrices = donations.map(donation => {
      const priceInfo = calculateFinalPrice(donation);
      return {
        ...donation.toObject(),
        pricing: priceInfo
      };
    });

    res.json(donationsWithPrices);
  } catch (error) {
    console.error('Error fetching donations:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    res.status(500).json({ message: 'Error fetching donations', error: error.message });
  }
});

// Get a single donation by ID
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

    const donation = await Donation.findById(req.params.id)
      .populate('donorId', 'name')
      .populate('receiverId', 'name')
      .populate('deliveryPartnerId', 'name');

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    // If the donation is not available and the user is not the donor or receiver, don't show it
    if (donation.status !== 'Available' && 
        donation.donorId._id.toString() !== decoded.userId &&
        donation.receiverId?._id?.toString() !== decoded.userId) {
      return res.status(403).json({ message: 'You do not have permission to view this donation' });
    }

    // Add price calculations
    const priceInfo = calculateFinalPrice(donation);
    const donationWithPrice = {
      ...donation.toObject(),
      pricing: priceInfo
    };

    res.json(donationWithPrice);
  } catch (error) {
    console.error('Error fetching donation:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid donation ID format' });
    }
    res.status(500).json({ message: 'Error fetching donation', error: error.message });
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
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    res.status(500).json({ message: 'Error deleting donation', error: error.message });
  }
});

// Update donation status
router.put('/:id', async (req, res) => {
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

    const { status, receiverId } = req.body;

    // Validate status
    const validStatuses = ['Available', 'In Progress', 'Matched', 'Expired', 'Delivered'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status',
        validStatuses 
      });
    }
    
    // Find the donation
    const donation = await Donation.findById(req.params.id);
    
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    // Validate state transition
    if (donation.status === 'Delivered') {
      return res.status(400).json({ message: 'Cannot update a delivered donation' });
    }

    if (donation.status === 'Expired') {
      return res.status(400).json({ message: 'Cannot update an expired donation' });
    }

    // Update only the status and receiverId, preserving other fields
    const updatedDonation = await Donation.findByIdAndUpdate(
      req.params.id,
      { 
        $set: {
          status,
          receiverId: receiverId || null,
          updatedAt: new Date()
        }
      },
      { 
        new: true,
        runValidators: true // Enable validation to ensure status is valid
      }
    ).populate('donorId', 'name')
     .populate('receiverId', 'name')
     .populate('deliveryPartnerId', 'name');

    if (!updatedDonation) {
      return res.status(404).json({ message: 'Donation not found after update' });
    }

    res.json({
      message: 'Donation updated successfully',
      donation: updatedDonation
    });
  } catch (error) {
    console.error('Error updating donation:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Invalid donation data',
        error: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({ 
      message: 'Failed to update donation',
      error: error.message 
    });
  }
});

// Calculate price for a donation
router.post('/calculate-price', async (req, res) => {
  try {
    const { donationId } = req.body;

    if (!donationId) {
      return res.status(400).json({ message: 'Donation ID is required' });
    }

    const donation = await Donation.findById(donationId);
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    const priceInfo = calculateFinalPrice(donation);
    res.json(priceInfo);
  } catch (error) {
    console.error('Error calculating price:', error);
    res.status(500).json({ 
      message: 'Error calculating price', 
      error: error.message 
    });
  }
});

module.exports = router;
