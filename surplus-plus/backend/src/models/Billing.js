const mongoose = require('mongoose');

const billingSchema = new mongoose.Schema({
  donationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donation',
    required: true
  },
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request',
    required: true
  },
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  originalCost: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  spoilTime: {
    type: Date,
    required: true
  },
  calculatedCost: {
    type: Number,
    required: true
  },
  transactionId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    default: 'card' // or 'wallet', 'net_banking', etc.
  },
  platformFee: {
    type: Number,
    default: 0.1 // 10% platform fee
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Calculate the final cost based on time until spoilage and original cost
billingSchema.methods.calculateCost = function() {
  const now = new Date();
  const timeUntilSpoil = (this.spoilTime - now) / (1000 * 60 * 60); // in hours
  
  // Simple degradation model - the closer to spoilage, the lower the cost
  // Max 100% of original cost if far from spoilage, min 20% if very close to spoiling
  const timeFactor = Math.max(0.2, Math.min(1, timeUntilSpoil / 24)); // 24 hours to spoil = 100% value
  
  const baseCost = this.originalCost * this.quantity * timeFactor;
  this.calculatedCost = baseCost * (1 - this.platformFee);
  return this.calculatedCost;
};

// Create a transaction ID
billingSchema.pre('save', function(next) {
  if (!this.transactionId) {
    this.transactionId = 'TXN' + Math.random().toString(36).substr(2, 9).toUpperCase();
  }
  if (this.isModified('originalCost') || this.isModified('quantity') || this.isModified('spoilTime')) {
    this.calculateCost();
  }
  next();
});

module.exports = mongoose.model('Billing', billingSchema);
