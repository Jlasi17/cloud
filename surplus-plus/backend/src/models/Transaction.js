const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  donationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donation',
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
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed', 'Failed', 'Refunded'],
    default: 'Pending'
  },
  paymentMethod: {
    type: String,
    enum: ['Card', 'Cash', 'Other'],
    required: true
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

transactionSchema.index({ donationId: 1 });
transactionSchema.index({ donorId: 1 });
transactionSchema.index({ receiverId: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ createdAt: -1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction; 