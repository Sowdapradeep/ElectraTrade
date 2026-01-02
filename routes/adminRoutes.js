
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/authMiddleware');

// Platform Settings (Mocked in DB for now)
let platformSettings = { baseMarkupRate: 5, maxMarkupCap: 1000, aiSupportEnabled: true };

router.get('/settings', protect, authorize('ADMIN'), (req, res) => {
  res.json(platformSettings);
});

router.put('/settings', protect, authorize('ADMIN'), (req, res) => {
  platformSettings = { ...platformSettings, ...req.body };
  res.json(platformSettings);
});

router.get('/users', protect, authorize('ADMIN'), async (req, res) => {
  const users = await User.find({});
  res.json(users);
});

router.get('/users/pending', protect, authorize('ADMIN'), async (req, res) => {
  const users = await User.find({ isApproved: false });
  res.json(users);
});

router.get('/users/:id', protect, async (req, res) => {
  const user = await User.findById(req.params.id);
  res.json(user);
});

router.patch('/users/:id/approve', protect, authorize('ADMIN'), async (req, res) => {
  const user = await User.findById(req.params.id);
  if (user) {
    user.isApproved = true;
    await user.save();
    res.json(user);
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

router.patch('/users/:id/reject', protect, authorize('ADMIN'), async (req, res) => {
  const user = await User.findById(req.params.id);
  if (user) {
    user.isApproved = false;
    // Mark as rejected if you add that field to model
    await user.save();
    res.json(user);
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

module.exports = router;
