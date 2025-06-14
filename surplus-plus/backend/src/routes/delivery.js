const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const Donation = require('../models/Donation');
const Request = require('../models/Request');

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

// Update delivery partner's location
router.post('/location', auth, async (req, res) => {
  try {
    const { longitude, latitude, address } = req.body;
    
    if (!longitude || !latitude) {
      return res.status(400).json({ message: 'Longitude and latitude are required' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      {
        'location.coordinates': [parseFloat(longitude), parseFloat(latitude)],
        ...(address && { 'location.address': address })
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      message: 'Location updated successfully',
      location: user.location
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ message: 'Error updating location', error: error.message });
  }
});

// Update delivery partner's cost per km
router.put('/profile', auth, async (req, res) => {
  try {
    const { costPerKm } = req.body;
    
    if (!costPerKm || isNaN(costPerKm) || costPerKm < 1) {
      return res.status(400).json({ message: 'Valid cost per km is required' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { costPerKm: parseFloat(costPerKm) },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        costPerKm: user.costPerKm,
        location: user.location
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});

// Get delivery partner's profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      costPerKm: user.costPerKm,
      location: user.location
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

// Update delivery status
router.post('/update-status', auth, async (req, res) => {
  try {
    const { donationId, status } = req.body;
    
    if (!donationId || !status) {
      return res.status(400).json({ message: 'Donation ID and status are required' });
    }

    const donation = await Donation.findById(donationId)
      .populate('donorId')
      .populate('receiverId');
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    // Verify this delivery partner is assigned to this donation
    if (donation.deliveryPartnerId?.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to update this delivery' });
    }

    // Update the status
    donation.status = status;
    await donation.save();

    // If status is Delivered, also update the associated request
    if (status === 'Delivered') {
      console.log('Delivery marked as Delivered, searching for associated request...');
      console.log('Donation details:', {
        donorId: donation.donorId,
        receiverId: donation.receiverId
      });
      
      const request = await Request.findOne({ 
        donorId: donation.donorId,
        requesterId: donation.receiverId,
        status: { $in: ['Pending', 'Matched', 'In Progress'] }
      });
      
      console.log('Found request:', request);
      
      if (request) {
        console.log('Updating request status to Completed');
        request.status = 'Completed';
        await request.save();
        console.log('Request updated successfully');
      } else {
        console.log('No matching request found to update');
      }
    }

    // Emit socket event for real-time update
    req.app.get('io').emit('delivery_status_update', {
      donationId,
      status,
      deliveryPartnerId: req.user.userId
    });

    res.json({ 
      message: 'Delivery status updated successfully',
      donation
    });
  } catch (error) {
    console.error('Error updating delivery status:', error);
    res.status(500).json({ message: 'Error updating delivery status', error: error.message });
  }
});

// Handle delivery request notification response
router.post('/request-response', auth, async (req, res) => {
  try {
    const { donationId, response } = req.body;
    
    if (!donationId || !response || !['accept', 'decline'].includes(response)) {
      return res.status(400).json({ message: 'Valid donation ID and response (accept/decline) are required' });
    }

    const donation = await Donation.findById(donationId)
      .populate('donorId')
      .populate('receiverId');
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    // For accepting a new delivery
    if (response === 'accept') {
      // Check if donation is available to be accepted
      if (donation.deliveryPartnerId) {
        return res.status(400).json({ message: 'This delivery has already been assigned to a delivery partner' });
      }
      
      // Assign the delivery partner and update status
      donation.deliveryPartnerId = req.user.userId;
      donation.status = 'Ready to Pick Up';
    } else {
      // For declining, check if this delivery partner is assigned to this donation
      if (donation.deliveryPartnerId?.toString() !== req.user.userId) {
        return res.status(403).json({ message: 'Not authorized to decline this request' });
      }
      
      // Remove the delivery partner assignment
      donation.deliveryPartnerId = null;
      donation.status = 'Available';
    }

    await donation.save();

    // Emit socket event for real-time update
    req.app.get('io').emit('delivery_response', {
      donationId,
      response,
      deliveryPartnerId: req.user.userId,
      status: donation.status
    });

    res.json({ 
      message: `Delivery request ${response}ed successfully`,
      donation
    });
  } catch (error) {
    console.error('Error handling delivery response:', error);
    res.status(500).json({ message: 'Error handling delivery response', error: error.message });
  }
});

// Get pending delivery requests
router.get('/pending-requests', auth, async (req, res) => {
  try {
    // Find all donations that are paid and waiting for delivery partner acceptance
    const pendingRequests = await Donation.find({
      status: 'Paid',
      deliveryPartnerId: null // Only get requests that haven't been accepted yet
    })
    .populate('donorId', 'name location')
    .populate('receiverId', 'name location')
    .sort({ createdAt: -1 }); // Most recent first

    res.json({
      pendingRequests: pendingRequests.map(request => ({
        donationId: request._id,
        foodType: request.foodType,
        quantity: request.quantity,
        pickupAddress: request.location,
        pickupCoordinates: request.coordinates,
        deliveryAddress: request.receiverId?.location,
        estimatedValue: request.estimatedValue,
        donorName: request.donorId?.name,
        receiverName: request.receiverId?.name,
        createdAt: request.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({ message: 'Error fetching pending requests', error: error.message });
  }
});

module.exports = router;
