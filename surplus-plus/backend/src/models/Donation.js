const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const donationSchema = new mongoose.Schema({
  donorId: {
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
  estimatedSpoilTime: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  marketCost: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Available', 'Matched', 'Expired', 'Delivered'],
    default: 'Available'
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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

donationSchema.index({ donorId: 1 });
donationSchema.index({ status: 1 });
donationSchema.index({ createdAt: -1 });

donationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Donation = mongoose.model('Donation', donationSchema);

module.exports = Donation;
