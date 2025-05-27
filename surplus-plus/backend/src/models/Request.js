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
  status: {
    type: String,
    enum: ['Pending', 'Matched', 'Completed'],
    default: 'Pending'
  },
  donorId: {
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

requestSchema.index({ requesterId: 1 });
requestSchema.index({ status: 1 });
requestSchema.index({ createdAt: -1 });

requestSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Request = mongoose.model('Request', requestSchema);

module.exports = Request;
