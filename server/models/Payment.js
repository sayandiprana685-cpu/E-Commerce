const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    method: { type: String, enum: ['cod', 'card', 'upi', 'netbanking'], default: 'cod' },
    status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    transactionId: { type: String, default: '' },
    gatewayResponse: { type: String, default: '' },
    refundedAmount: { type: Number, default: 0 },
    refundedAt: Date,
  },
  { timestamps: true }
);

paymentSchema.pre('save', function (next) {
  if (this.isNew && !this.transactionId) {
    this.transactionId = `TXN-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 100000)}`;
  }
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);
