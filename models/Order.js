
const mongoose = require('mongoose');

const orderSchema = mongoose.Schema({
  shopOwner: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  manufacturer: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Product' },
    quantity: { type: Number, required: true },
    priceAtTimeOfOrder: { type: Number, required: true }
  }],
  subtotal: { type: Number, required: true },
  gst: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  platformFee: { type: Number, required: true, default: 0 },
  paymentMethod: { type: String, enum: ['DIRECT', 'NET_30'], required: true },
  paymentStatus: { type: String, enum: ['UNPAID', 'PAID', 'OVERDUE'], default: 'UNPAID' },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
    default: 'PENDING'
  },
  invoiceNumber: { type: String, unique: true },
  trackingId: { type: String },
  carrier: { type: String },
  dueDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
