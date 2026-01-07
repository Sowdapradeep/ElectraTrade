
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// @desc    Process mock payment
// @route   POST /api/payments/process
// @access  Private
router.post('/process', protect, async (req, res) => {
    const { amount, paymentMethod, cardDetails, upiDetails, manufacturerId } = req.body;

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Determine success/failure (Mock logic)
    const isSuccess = Math.random() > 0.1; // 90% success rate

    if (isSuccess) {
        // Marketplace Split Logic (Mock Database Update)
        // In a real app, this would be an atomic transaction updating User documents
        const platformFeePercentage = 0.05;
        const platformFee = amount * platformFeePercentage;
        const netAmount = amount - platformFee;

        // Mock response includes split details
        res.json({
            id: 'txn_' + Math.random().toString(36).substr(2, 9),
            status: 'COMPLETED',
            amount: amount,
            currency: 'USD',
            method: paymentMethod,
            upiId: paymentMethod === 'UPI' ? upiDetails?.upiId : undefined,
            split: {
                platformFee: platformFee,
                manufacturerCredit: netAmount,
                adminCredit: platformFee // Admin keeps the fee
            },
            timestamp: new Date().toISOString()
        });
    } else {
        res.status(400).json({
            message: 'Payment Gateway Error: Transaction Declined by Bank'
        });
    }
});

module.exports = router;
