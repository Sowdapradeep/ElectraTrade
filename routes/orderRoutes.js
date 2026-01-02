
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/authMiddleware');

// Create order
router.post('/', protect, authorize('SHOP_OWNER'), async (req, res) => {
  const { items, paymentMethod } = req.body;
  
  if (items && items.length === 0) {
    return res.status(400).json({ message: 'No order items' });
  }

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const gst = subtotal * 0.18;
  const totalAmount = subtotal + gst;

  // Credit Check
  if (paymentMethod === 'NET_30') {
    if ((req.user.creditUsed + totalAmount) > req.user.creditLimit) {
      return res.status(400).json({ message: 'Insufficient trade credit limit' });
    }
  }

  const order = new Order({
    shopOwner: req.user._id,
    manufacturer: items[0].manufacturerId,
    items: items.map(i => ({
      product: i.productId,
      quantity: i.quantity,
      priceAtTimeOfOrder: i.price
    })),
    subtotal,
    gst,
    totalAmount,
    paymentMethod,
    paymentStatus: paymentMethod === 'NET_30' ? 'UNPAID' : 'PAID',
    invoiceNumber: 'TAX-' + Date.now().toString().slice(-6),
    dueDate: paymentMethod === 'NET_30' ? new Date(Date.now() + 30*24*60*60*1000) : null
  });

  const createdOrder = await order.save();

  // Update User Credit if NET_30
  if (paymentMethod === 'NET_30') {
    await User.findByIdAndUpdate(req.user._id, { $inc: { creditUsed: totalAmount } });
  }

  res.status(201).json(createdOrder);
});

// Settle Invoice
router.patch('/:id/settle', protect, async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (order) {
    order.paymentStatus = 'PAID';
    await order.save();
    
    // Restore credit limit
    if (order.paymentMethod === 'NET_30') {
      await User.findByIdAndUpdate(order.shopOwner, { $inc: { creditUsed: -order.totalAmount } });
    }
    
    res.json(order);
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
});

router.get('/myorders', protect, async (req, res) => {
  let orders;
  if (req.user.role === 'MANUFACTURER') {
    orders = await Order.find({ manufacturer: req.user._id }).populate('shopOwner', 'companyName');
  } else if (req.user.role === 'ADMIN') {
    orders = await Order.find({}).populate('shopOwner', 'companyName').populate('manufacturer', 'companyName');
  } else {
    orders = await Order.find({ shopOwner: req.user._id }).populate('manufacturer', 'companyName');
  }
  res.json(orders);
});

module.exports = router;
