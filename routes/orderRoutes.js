
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

  // 1. Verify Stock & Calculate Totals
  const orderItems = [];
  let subtotal = 0;

  for (const item of items) {
    const product = await require('../models/Product').findById(item.productId);
    if (!product) {
      return res.status(404).json({ message: `Product not found: ${item.productId}` });
    }
    if (product.stock < item.quantity) {
      return res.status(400).json({ message: `Insufficient stock for ${product.name}. Available: ${product.stock}` });
    }

    // Decrement Stock
    product.stock -= item.quantity;
    await product.save();

    const price = product.price; // Use current price for security
    subtotal += price * item.quantity;

    orderItems.push({
      product: product._id,
      quantity: item.quantity,
      priceAtTimeOfOrder: price
    });
  }

  const gst = subtotal * 0.18;
  const totalAmount = subtotal + gst;
  const platformFee = totalAmount * 0.05; // 5% Platform Commission

  // 2. Credit Check
  if (paymentMethod === 'NET_30') {
    if ((req.user.creditUsed + totalAmount) > req.user.creditLimit) {
      // Rollback stock (simple compensation)
      for (const item of items) {
        await require('../models/Product').findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });
      }
      return res.status(400).json({ message: 'Insufficient trade credit limit' });
    }
  }

  const order = new Order({
    shopOwner: req.user._id,
    manufacturer: items[0].product.manufacturerId, // Assuming passed from frontend or need lookup. 
    // Fix: Lookup manufacturer from first product since we just fetched it? 
    // For simplicity, re-using frontend passed ManufacturerID or relying on single-vendor-per-order 
    // BUT safest is to use the product's actual manufacturer.
    // Let's grab it from the first product we fetched above.
    // Re-fetching typically needed or restructuring loop. 
    // Optimizing: just assume single vendor cart for MVP or take from first item details.
    manufacturer: (await require('../models/Product').findById(items[0].productId)).manufacturer,
    items: orderItems,
    subtotal,
    gst,
    totalAmount,
    platformFee,
    paymentMethod,
    paymentStatus: paymentMethod === 'NET_30' ? 'UNPAID' : 'PAID',
    invoiceNumber: 'TAX-' + Date.now().toString().slice(-6),
    dueDate: paymentMethod === 'NET_30' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null
  });

  const createdOrder = await order.save();

  // Update User Credit if NET_30
  if (paymentMethod === 'NET_30') {
    await User.findByIdAndUpdate(req.user._id, { $inc: { creditUsed: totalAmount } });
  } else {
    // DIRECT / UPI Payment (Marketplace Split)
    const platformFeePercentage = 0.05;
    const platformFee = totalAmount * platformFeePercentage;
    const manufacturerCredit = totalAmount - platformFee;

    // 1. Credit Admin (Platform Fee)
    // Finding Admin (Assuming specific email or first admin found)
    const admin = await User.findOne({ role: 'ADMIN' });
    if (admin) {
      await User.findByIdAndUpdate(admin._id, { $inc: { walletBalance: platformFee } });
    }

    // 2. Credit Manufacturer (Net Amount)
    await User.findByIdAndUpdate(createdOrder.manufacturer, { $inc: { walletBalance: manufacturerCredit } });
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
