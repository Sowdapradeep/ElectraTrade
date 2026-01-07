
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/authMiddleware');

// Get all products
router.get('/', async (req, res) => {
  const products = await Product.find({}).populate('manufacturer', 'companyName');
  res.json(products);
});

// Get single product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('manufacturer', 'companyName email');
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Get products by manufacturer
router.get('/manufacturer/:id', async (req, res) => {
  const products = await Product.find({ manufacturer: req.params.id });
  res.json(products);
});

// Get product reviews (Mock implementation for demo)
router.get('/:id/reviews', async (req, res) => {
  res.json([]); // Return empty array or implement Review model
});

// Create product (Manufacturer only)
router.post('/', protect, authorize('MANUFACTURER'), async (req, res) => {
  const { name, category, brand, hsnCode, price, stock, moq, imageUrl, specifications } = req.body;
  const product = new Product({
    name, category, brand, hsnCode, price, stock, moq, imageUrl, specifications,
    manufacturer: req.user._id
  });
  const createdProduct = await product.save();
  res.status(201).json(createdProduct);
});

module.exports = router;
