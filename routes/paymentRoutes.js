
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// @desc    Process mock payment
// @route   POST /api/payments/process
// @access  Private
router.post('/process', protect, async (req, res) => {
    const { amount, paymentMethod, cardDetails } = req.body;

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Determine success/failure (Mock logic)
    // Fail if amount > 500,000 (just for testing logic, or random)
    // For demo, we'll make it succeed mostly.
    const isSuccess = Math.random() > 0.1; // 90% success rate

    if (isSuccess) {
        res.json({
            id: 'txn_' + Math.random().toString(36).substr(2, 9),
            status: 'COMPLETED',
            amount: amount,
            currency: 'USD', // or INR
            method: paymentMethod,
            timestamp: new Date().toISOString()
        });
    } else {
        res.status(400).json({
            message: 'Payment Gateway Error: Transaction Declined by Bank'
        });
    }
});

module.exports = router;
