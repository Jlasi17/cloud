const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  foodType: {
    type: String,
    required: true,
    enum: ['Pulses', 'Packet Food', 'Fruits & Vegetables', 'Cooked Food', 'Other']
  },
  quantity: {
    type: String,
    required: true
  },
  urgency: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  location: {
    type: String,
    required: true
  },
  coordinates: {
    type: {
      lat: Number,
      lng: Number
    },
    required: true,
    index: '2dsphere' // Enable geospatial queries
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Matched', 'Completed'],
    default: 'Pending'
  },
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  donationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donation',
    default: null
  },
  deliveryPartnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create indexes
requestSchema.index({ requesterId: 1 });
requestSchema.index({ coordinates: '2dsphere' }); // Enable geospatial queries
requestSchema.index({ status: 1 });
requestSchema.index({ createdAt: -1 });
requestSchema.index({ donationId: 1 }); // Add index for donationId

requestSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Request = mongoose.model('Request', requestSchema);

module.exports = Request;
